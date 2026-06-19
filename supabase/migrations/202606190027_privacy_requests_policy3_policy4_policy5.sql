-- Policy #3 / POL-OPS-003 Privacy Policy, Policy #4 / POL-OPS-004
-- Collection Notice, and Policy #5 / POL-OPS-005 retention/destruction
-- controls.
--
-- Source-backed intent:
-- - APP 12 access requests are directed to Admin and answered within 30 days.
-- - APP 13 correction requests are directed to Admin and processed within
--   30 days.
-- - Privacy complaints are acknowledged within 5 business days and aimed for
--   resolution within 30 days.
-- - Access/correction may be refused only on Privacy Act-permitted grounds.
-- - APP 4 unsolicited personal information must be assessed against APP 3.
--   If it could not have been collected, destruction/de-identification is
--   required as soon as practicable, but Policy #5 blocks execution until
--   Privacy Owner approval exists.
-- - APP-PRV-001 collection notice version/evidence is retained.
-- - APP-PRV-004 records all PII actions.

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null,
  requester_role text not null,
  requester_name text not null,
  requester_contact text not null,
  related_account text,
  received_date date not null default current_date,
  response_due_date date not null,
  complaint_ack_due_date date,
  request_summary text not null,
  pii_categories text not null,
  collection_notice_version text not null default 'Policy #4 / POL-OPS-004',
  acknowledged_at timestamptz,
  acknowledgement_evidence text,
  access_response_evidence text,
  correction_action_evidence text,
  privacy_act_refusal_ground text,
  app3_assessment text,
  could_have_collected_under_app3 boolean not null default false,
  destruction_or_deidentification_requested boolean not null default false,
  privacy_owner_name text,
  privacy_owner_approval_evidence text,
  outcome_note text,
  resolved_at timestamptz,
  status text not null default 'open',
  source_ref text not null default 'Policy #3 / POL-OPS-003; Policy #4 / POL-OPS-004; Policy #5 / POL-OPS-005',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint privacy_requests_type_check
    check (request_type in ('access_request', 'correction_request', 'privacy_complaint', 'unsolicited_information')),
  constraint privacy_requests_role_check
    check (requester_role in ('client_operational_contact', 'client_billing_contact', 'driver', 'supplier_contact', 'receiver', 'other_individual')),
  constraint privacy_requests_status_check
    check (status in ('open', 'acknowledged', 'resolved', 'refused', 'referred_to_oaic', 'blocked_privacy_owner_required')),
  constraint privacy_requests_required_evidence_check
    check (
      source_ref like 'Policy #3%'
      and collection_notice_version like 'Policy #4%'
      and length(btrim(requester_name)) > 0
      and length(btrim(requester_contact)) > 0
      and length(btrim(request_summary)) > 0
      and length(btrim(pii_categories)) > 0
    ),
  constraint privacy_requests_refusal_ground_check
    check (
      status <> 'refused'
      or length(btrim(coalesce(privacy_act_refusal_ground, ''))) > 0
    ),
  constraint privacy_requests_access_response_check
    check (
      status <> 'resolved'
      or request_type <> 'access_request'
      or length(btrim(coalesce(access_response_evidence, ''))) > 0
    ),
  constraint privacy_requests_correction_action_check
    check (
      status <> 'resolved'
      or request_type <> 'correction_request'
      or length(btrim(coalesce(correction_action_evidence, ''))) > 0
    ),
  constraint privacy_requests_complaint_ack_check
    check (
      request_type <> 'privacy_complaint'
      or status = 'open'
      or (
        acknowledged_at is not null
        and length(btrim(coalesce(acknowledgement_evidence, ''))) > 0
      )
    ),
  constraint privacy_requests_unsolicited_app4_check
    check (
      request_type <> 'unsolicited_information'
      or length(btrim(coalesce(app3_assessment, ''))) > 0
    ),
  constraint privacy_requests_privacy_owner_destruction_check
    check (
      request_type <> 'unsolicited_information'
      or destruction_or_deidentification_requested = false
      or could_have_collected_under_app3 = true
      or status = 'blocked_privacy_owner_required'
      or (
        length(btrim(coalesce(privacy_owner_name, ''))) > 0
        and length(btrim(coalesce(privacy_owner_approval_evidence, ''))) > 0
      )
    )
);

create or replace function public.policy3_add_business_days(start_date date, business_days integer)
returns date
language plpgsql
stable
as $$
declare
  d date := start_date;
  added integer := 0;
begin
  while added < business_days loop
    d := d + 1;
    if extract(isodow from d) < 6 then
      added := added + 1;
    end if;
  end loop;
  return d;
end;
$$;

create or replace function public.set_privacy_request_policy_fields()
returns trigger
language plpgsql
as $$
begin
  new.source_ref := coalesce(nullif(new.source_ref, ''), 'Policy #3 / POL-OPS-003; Policy #4 / POL-OPS-004; Policy #5 / POL-OPS-005');
  new.collection_notice_version := coalesce(nullif(new.collection_notice_version, ''), 'Policy #4 / POL-OPS-004');
  new.response_due_date := new.received_date + 30;
  new.updated_at := now();

  if new.request_type = 'privacy_complaint' then
    new.complaint_ack_due_date := public.policy3_add_business_days(new.received_date, 5);
    if new.status in ('acknowledged', 'resolved', 'refused', 'referred_to_oaic') and new.acknowledged_at is null then
      new.acknowledged_at := now();
    end if;
  else
    new.complaint_ack_due_date := null;
    if new.status = 'acknowledged' then
      new.status := 'open';
    end if;
  end if;

  if new.request_type = 'unsolicited_information'
    and new.destruction_or_deidentification_requested
    and new.could_have_collected_under_app3 = false
    and (
      length(btrim(coalesce(new.privacy_owner_name, ''))) = 0
      or length(btrim(coalesce(new.privacy_owner_approval_evidence, ''))) = 0
    ) then
    new.status := 'blocked_privacy_owner_required';
    new.outcome_note := coalesce(nullif(new.outcome_note, ''), 'Policy #5 blocks APP 4 destruction/de-identification until Privacy Owner approval is recorded.');
  end if;

  if new.status in ('resolved', 'refused', 'referred_to_oaic') and new.resolved_at is null then
    new.resolved_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists privacy_requests_policy_fields on public.privacy_requests;
create trigger privacy_requests_policy_fields
before insert or update on public.privacy_requests
for each row execute function public.set_privacy_request_policy_fields();

create index if not exists privacy_requests_status_due_idx
  on public.privacy_requests (status, response_due_date);

create index if not exists privacy_requests_complaint_ack_idx
  on public.privacy_requests (complaint_ack_due_date)
  where request_type = 'privacy_complaint' and acknowledged_at is null;

drop trigger if exists privacy_requests_pii_audit on public.privacy_requests;
create trigger privacy_requests_pii_audit
after insert or update or delete on public.privacy_requests
for each row execute function public.write_pii_audit_log();

alter table public.privacy_requests enable row level security;

drop policy if exists privacy_requests_admin_manage on public.privacy_requests;
create policy privacy_requests_admin_manage
on public.privacy_requests for all to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.privacy_requests is
  'Policy #3 Admin privacy request register for APP 12 access, APP 13 correction, privacy complaints, APP 4 unsolicited information assessment, Policy #4 collection notice evidence, and Policy #5 Privacy Owner destruction blocking.';

comment on column public.privacy_requests.response_due_date is
  'Policy #3: access, correction, and privacy complaint target response date is 30 days from receipt.';

comment on column public.privacy_requests.complaint_ack_due_date is
  'Policy #3 complaints: acknowledgement due within 5 business days.';

comment on constraint privacy_requests_privacy_owner_destruction_check on public.privacy_requests is
  'Policy #5: no destruction/de-identification execution without Privacy Owner approval evidence.';
