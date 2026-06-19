-- Policy #6 / POL-OPS-006 Notifiable Data Breach response controls.
--
-- Source-backed intent:
-- - The NDB plan is Draft and cannot be Active until the Privacy Owner
--   (ACT-TECH-002) is named.
-- - Admin is the first point of contact and records suspected incidents.
-- - Admin and Digiverse take immediate containment action.
-- - APP-PRV-004 audit records must be preserved; no audit records may be
--   deleted or altered during or after breach investigation.
-- - The Privacy Owner is the sole decision-maker on whether an incident is an
--   eligible data breach. This cannot be delegated to Admin or automated.
-- - Assessment is due within 30 days of awareness.
-- - If eligible, OAIC and affected-individual notification evidence is needed.
-- - Post-breach review reports are retained for 7 years.

create table if not exists public.ndb_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_title text not null,
  reported_by text not null default 'Admin',
  awareness_date date not null,
  description text not null,
  personal_information_involved text not null,
  affected_individual_estimate text,
  containment_actions text not null,
  containment_status text not null default 'identified_containment_in_progress',
  app_prv_004_audit_refs text not null,
  system_access_log_refs text,
  digiverse_evidence_refs text,
  privacy_owner_name text,
  privacy_owner_notified_at timestamptz,
  privacy_owner_notification_evidence text,
  assessment_due_date date not null,
  eligibility_decision text not null default 'blocked_privacy_owner_unnamed',
  privacy_owner_decision_at timestamptz,
  privacy_owner_decision_note text,
  oaic_notification_evidence text,
  affected_individuals_notification_evidence text,
  website_public_statement_url text,
  post_breach_review_report_ref text,
  post_breach_review_completed_at timestamptz,
  retained_until date,
  status text not null default 'open_identify_contain',
  source_ref text not null default 'Policy #6 / POL-OPS-006',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ndb_incidents_status_check
    check (status in (
      'open_identify_contain',
      'contained_awaiting_privacy_owner',
      'privacy_owner_assessment',
      'notification_required',
      'post_breach_review',
      'closed'
    )),
  constraint ndb_incidents_eligibility_check
    check (eligibility_decision in (
      'blocked_privacy_owner_unnamed',
      'awaiting_privacy_owner_assessment',
      'eligible_data_breach',
      'not_eligible'
    )),
  constraint ndb_incidents_policy6_intake_evidence_check
    check (
      length(btrim(incident_title)) > 0
      and length(btrim(reported_by)) > 0
      and length(btrim(description)) > 0
      and length(btrim(personal_information_involved)) > 0
      and length(btrim(containment_actions)) > 0
      and length(btrim(app_prv_004_audit_refs)) > 0
      and source_ref like 'Policy #6%'
    ),
  constraint ndb_incidents_privacy_owner_decision_check
    check (
      eligibility_decision in ('blocked_privacy_owner_unnamed', 'awaiting_privacy_owner_assessment')
      or (
        length(btrim(coalesce(privacy_owner_name, ''))) > 0
        and privacy_owner_decision_at is not null
        and length(btrim(coalesce(privacy_owner_decision_note, ''))) > 0
      )
    ),
  constraint ndb_incidents_eligible_notification_check
    check (
      status <> 'closed'
      or eligibility_decision <> 'eligible_data_breach'
      or (
        length(btrim(coalesce(oaic_notification_evidence, ''))) > 0
        and length(btrim(coalesce(affected_individuals_notification_evidence, ''))) > 0
      )
    ),
  constraint ndb_incidents_post_breach_review_retention_check
    check (
      status <> 'closed'
      or (
        length(btrim(coalesce(post_breach_review_report_ref, ''))) > 0
        and post_breach_review_completed_at is not null
        and retained_until is not null
      )
    )
);

create or replace function public.set_ndb_incident_policy6_fields()
returns trigger
language plpgsql
as $$
begin
  new.assessment_due_date := new.awareness_date + 30;
  new.source_ref := coalesce(nullif(new.source_ref, ''), 'Policy #6 / POL-OPS-006');
  new.updated_at := now();

  if length(btrim(coalesce(new.privacy_owner_name, ''))) = 0 then
    if new.status in ('privacy_owner_assessment', 'notification_required', 'post_breach_review', 'closed') then
      raise exception 'Policy #6 NDB plan cannot operate past Admin containment until Privacy Owner ACT-TECH-002 is named';
    end if;

    if new.eligibility_decision in ('eligible_data_breach', 'not_eligible') then
      raise exception 'Policy #6 eligible breach decision cannot be delegated to Admin or automated';
    end if;

    new.eligibility_decision := 'blocked_privacy_owner_unnamed';
  end if;

  if new.eligibility_decision in ('eligible_data_breach', 'not_eligible') then
    if new.privacy_owner_decision_at is null
      or length(btrim(coalesce(new.privacy_owner_decision_note, ''))) = 0 then
      raise exception 'Policy #6 Privacy Owner decision evidence is required';
    end if;
  end if;

  if new.post_breach_review_completed_at is not null then
    new.retained_until := (new.post_breach_review_completed_at::date + interval '7 years')::date;
  end if;

  return new;
end;
$$;

drop trigger if exists ndb_incidents_policy6_fields on public.ndb_incidents;
create trigger ndb_incidents_policy6_fields
before insert or update on public.ndb_incidents
for each row execute function public.set_ndb_incident_policy6_fields();

create index if not exists ndb_incidents_status_due_idx
  on public.ndb_incidents (status, assessment_due_date);

create index if not exists ndb_incidents_privacy_owner_blocked_idx
  on public.ndb_incidents (eligibility_decision, awareness_date)
  where eligibility_decision = 'blocked_privacy_owner_unnamed';

drop trigger if exists ndb_incidents_pii_audit on public.ndb_incidents;
create trigger ndb_incidents_pii_audit
after insert or update or delete on public.ndb_incidents
for each row execute function public.write_pii_audit_log();

alter table public.ndb_incidents enable row level security;

drop policy if exists ndb_incidents_admin_manage on public.ndb_incidents;
create policy ndb_incidents_admin_manage
on public.ndb_incidents for all to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.ndb_incidents is
  'Policy #6 / POL-OPS-006 suspected data breach intake, containment, Privacy Owner assessment, notification evidence, post-breach review, and 7-year report retention. The plan cannot become Active until Privacy Owner ACT-TECH-002 is named.';

comment on column public.ndb_incidents.assessment_due_date is
  'Policy #6 30-day assessment deadline calculated from awareness_date, not from assessment completion.';

comment on column public.ndb_incidents.app_prv_004_audit_refs is
  'Policy #6 requires APP-PRV-004 audit records and system access evidence to be preserved; audit records must not be deleted or altered during or after investigation.';

comment on constraint ndb_incidents_privacy_owner_decision_check on public.ndb_incidents is
  'Policy #6: Privacy Owner is the sole eligible data breach decision-maker; Admin and automation cannot decide.';

comment on constraint ndb_incidents_eligible_notification_check on public.ndb_incidents is
  'Policy #6: eligible data breach closure requires OAIC notification evidence and affected-individual notification evidence.';

comment on constraint ndb_incidents_post_breach_review_retention_check on public.ndb_incidents is
  'Policy #6: post-breach review report reference and 7-year retention date required before closing a breach record.';
