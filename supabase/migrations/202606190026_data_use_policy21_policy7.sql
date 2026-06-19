-- Policy #21 / POL-OPS-021 Internal Acceptable Use of Data and
-- Policy #7 / POL-OPS-007 Information Security controls.
--
-- Source-backed intent:
-- - Data is accessed only for the purpose collected.
-- - Driver access is limited to assigned-run data; unassigned pool_jobs must
--   not return PII.
-- - Admin access is limited to operational business management.
-- - Digiverse production access is maintenance/support only and must be logged.
-- - Personal curiosity, personal gain, unrelated use, personal-device storage,
--   unsupported third-party sharing, and marketing without consent must not be
--   approved.
-- - APP-PRV-004 records PII actions with tamper-evident audit history.

create table if not exists public.data_use_reviews (
  id uuid primary key default gen_random_uuid(),
  request_title text not null,
  request_type text not null,
  requester_role text not null,
  requester_name text not null,
  request_date date not null default current_date,
  data_categories text not null,
  purpose text not null,
  role_basis text not null,
  service_delivery_involved boolean not null default false,
  external_recipient text,
  consent_evidence text,
  admin_approval_evidence text,
  production_access_log_ref text,
  digiverse_scope text,
  breach_escalation_note text,
  prohibited_personal_use boolean not null default false,
  stored_on_personal_device boolean not null default false,
  shares_client_data_externally boolean not null default false,
  shares_driver_data_to_clients_or_suppliers boolean not null default false,
  blocked_reasons text[] not null default '{}',
  status text not null default 'logged',
  source_ref text not null default 'Policy #21 / POL-OPS-021; Policy #7 / POL-OPS-007',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint data_use_reviews_type_check
    check (request_type in (
      'operational_access',
      'data_export',
      'digiverse_production_access',
      'third_party_sharing',
      'marketing_use',
      'data_access_breach'
    )),
  constraint data_use_reviews_requester_role_check
    check (requester_role in ('admin', 'driver', 'digiverse', 'other_staff', 'client')),
  constraint data_use_reviews_status_check
    check (status in ('logged', 'approved', 'blocked', 'breach_reported')),
  constraint data_use_reviews_policy_source_check
    check (
      source_ref like 'Policy #21%'
      and length(btrim(request_title)) > 0
      and length(btrim(requester_name)) > 0
      and length(btrim(data_categories)) > 0
      and length(btrim(purpose)) > 0
      and length(btrim(role_basis)) > 0
    ),
  constraint data_use_reviews_prohibited_personal_use_check
    check (
      status = 'blocked'
      or prohibited_personal_use = false
    ),
  constraint data_use_reviews_personal_device_check
    check (
      status = 'blocked'
      or stored_on_personal_device = false
    ),
  constraint data_use_reviews_data_export_approval_check
    check (
      status = 'blocked'
      or request_type <> 'data_export'
      or length(btrim(coalesce(admin_approval_evidence, ''))) > 0
    ),
  constraint data_use_reviews_marketing_consent_check
    check (
      status = 'blocked'
      or request_type <> 'marketing_use'
      or length(btrim(coalesce(consent_evidence, ''))) > 0
    ),
  constraint data_use_reviews_client_sharing_check
    check (
      status = 'blocked'
      or (request_type <> 'third_party_sharing' and shares_client_data_externally = false)
      or service_delivery_involved = true
      or length(btrim(coalesce(consent_evidence, ''))) > 0
    ),
  constraint data_use_reviews_driver_pi_sharing_check
    check (
      status = 'blocked'
      or shares_driver_data_to_clients_or_suppliers = false
    ),
  constraint data_use_reviews_digiverse_access_log_check
    check (
      status = 'blocked'
      or request_type <> 'digiverse_production_access'
      or (
        length(btrim(coalesce(production_access_log_ref, ''))) > 0
        and length(btrim(coalesce(admin_approval_evidence, ''))) > 0
        and (
          purpose ~* '(maintenance|support|security|incident|platform)'
          or coalesce(digiverse_scope, '') ~* '(maintenance|support|security|incident|platform)'
        )
      )
    ),
  constraint data_use_reviews_access_breach_escalation_check
    check (
      request_type <> 'data_access_breach'
      or (
        status = 'breach_reported'
        and length(btrim(coalesce(breach_escalation_note, ''))) > 0
      )
    )
);

create or replace function public.set_data_use_policy21_fields()
returns trigger
language plpgsql
as $$
declare
  block_reasons text[] := '{}';
begin
  new.source_ref := coalesce(nullif(new.source_ref, ''), 'Policy #21 / POL-OPS-021; Policy #7 / POL-OPS-007');
  new.updated_at := now();

  if new.prohibited_personal_use then
    block_reasons := array_append(block_reasons, 'Policy #21 blocks access for personal curiosity, personal gain, or unrelated purpose.');
  end if;

  if new.stored_on_personal_device then
    block_reasons := array_append(block_reasons, 'Policy #21 blocks storing personal information on personal devices.');
  end if;

  if new.request_type = 'data_export' and length(btrim(coalesce(new.admin_approval_evidence, ''))) = 0 then
    block_reasons := array_append(block_reasons, 'Policy #21 requires Admin approval evidence before data export.');
  end if;

  if new.request_type = 'marketing_use' and length(btrim(coalesce(new.consent_evidence, ''))) = 0 then
    block_reasons := array_append(block_reasons, 'Policy #21 blocks marketing use without consent evidence.');
  end if;

  if (new.request_type = 'third_party_sharing' or new.shares_client_data_externally)
    and new.service_delivery_involved = false
    and length(btrim(coalesce(new.consent_evidence, ''))) = 0 then
    block_reasons := array_append(block_reasons, 'Policy #21 blocks client data sharing unless the recipient is involved in service delivery or client consent is recorded.');
  end if;

  if new.shares_driver_data_to_clients_or_suppliers then
    block_reasons := array_append(block_reasons, 'Policy #21 blocks sharing driver personal information with clients or suppliers.');
  end if;

  if new.request_type = 'digiverse_production_access' then
    if length(btrim(coalesce(new.production_access_log_ref, ''))) = 0 then
      block_reasons := array_append(block_reasons, 'Policy #21 requires logged Digiverse production data access evidence.');
    end if;
    if length(btrim(coalesce(new.admin_approval_evidence, ''))) = 0 then
      block_reasons := array_append(block_reasons, 'Policy #7 requires Admin-controlled production access evidence.');
    end if;
    if not (
      new.purpose ~* '(maintenance|support|security|incident|platform)'
      or coalesce(new.digiverse_scope, '') ~* '(maintenance|support|security|incident|platform)'
    ) then
      block_reasons := array_append(block_reasons, 'Policy #21 limits Digiverse production data access to maintenance or support purposes.');
    end if;
  end if;

  if new.request_type = 'data_access_breach' then
    if length(btrim(coalesce(new.breach_escalation_note, ''))) = 0 then
      raise exception 'Policy #21 requires immediate Admin breach escalation evidence for data access breaches';
    end if;
    new.status := 'breach_reported';
  elsif array_length(block_reasons, 1) is not null then
    new.status := 'blocked';
  elsif new.status = 'blocked' then
    new.status := 'approved';
  end if;

  new.blocked_reasons := coalesce(block_reasons, '{}');
  return new;
end;
$$;

drop trigger if exists data_use_reviews_policy21_fields on public.data_use_reviews;
create trigger data_use_reviews_policy21_fields
before insert or update on public.data_use_reviews
for each row execute function public.set_data_use_policy21_fields();

create index if not exists data_use_reviews_status_idx
  on public.data_use_reviews (status, request_date);

create index if not exists data_use_reviews_digiverse_access_idx
  on public.data_use_reviews (request_type, production_access_log_ref)
  where request_type = 'digiverse_production_access';

drop trigger if exists data_use_reviews_pii_audit on public.data_use_reviews;
create trigger data_use_reviews_pii_audit
after insert or update or delete on public.data_use_reviews
for each row execute function public.write_pii_audit_log();

alter table public.data_use_reviews enable row level security;

drop policy if exists data_use_reviews_admin_manage on public.data_use_reviews;
create policy data_use_reviews_admin_manage
on public.data_use_reviews for all to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.data_use_reviews is
  'Policy #21 / Policy #7 Admin register for acceptable data use, data exports, Digiverse production access, third-party sharing, marketing use, breach escalation, blocked reasons, and APP-PRV-004 audit history.';

comment on column public.data_use_reviews.production_access_log_ref is
  'Policy #21 requires all Digiverse production data access to be logged; Policy #7 requires Admin-controlled production access evidence.';

comment on constraint data_use_reviews_data_export_approval_check on public.data_use_reviews is
  'Policy #21: data export cannot be approved without Admin approval evidence.';

comment on constraint data_use_reviews_marketing_consent_check on public.data_use_reviews is
  'Policy #21: marketing use cannot be approved without consent evidence.';

comment on constraint data_use_reviews_digiverse_access_log_check on public.data_use_reviews is
  'Policy #21 / Policy #7: Digiverse production access is maintenance/support only and requires access log plus Admin evidence.';
