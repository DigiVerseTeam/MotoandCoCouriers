-- Policy #13 / POL-OPS-013 driver verification controls.
--
-- Source-backed intent:
-- - Admin must complete licence, original-document sighting, retained copy,
--   government photo ID, criminal-history relevance, and right-to-work checks
--   before any driver is assigned to a run.
-- - Every check stores check type, date performed, outcome, and Admin
--   identifier.
-- - APP-ADM-002 must not assign a driver with a known licence issue.
-- - Licence currency is reviewed annually.
-- - Driver verification records are retained for the duration of engagement
--   plus 7 years under Policy #5.
-- - Criminal-history check scope is still an open legal item; this migration
--   records Admin's outcome but does not define the unconfirmed legal scope.

alter table public.driver_records
  add column if not exists licence_class text,
  add column if not exists known_licence_issue boolean not null default false,
  add column if not exists known_licence_issue_note text,
  add column if not exists licence_currency_reviewed_date date;

create table if not exists public.driver_verification_records (
  id uuid primary key default gen_random_uuid(),
  driver_record_id uuid not null references public.driver_records(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  check_type text not null check (
    check_type in (
      'licence_current',
      'licence_original_sighted',
      'licence_copy_retained',
      'photo_id',
      'criminal_history_relevance',
      'right_to_work',
      'licence_currency_review'
    )
  ),
  check_date date not null,
  outcome_status text not null default 'unresolved'
    check (outcome_status in ('passed', 'blocked', 'unresolved')),
  outcome text not null,
  admin_identifier text not null,
  evidence_reference text,
  source_ref text not null default 'Policy #13 / POL-OPS-013',
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (driver_record_id, check_type)
);

alter table public.driver_verification_records
  drop constraint if exists driver_verification_records_documented_outcome_check;

alter table public.driver_verification_records
  add constraint driver_verification_records_documented_outcome_check
  check (
    length(btrim(outcome)) > 0
    and length(btrim(admin_identifier)) > 0
  );

create index if not exists driver_verification_records_profile_idx
  on public.driver_verification_records (profile_id, check_type, outcome_status);

create index if not exists driver_verification_records_driver_idx
  on public.driver_verification_records (driver_record_id, check_type);

drop trigger if exists driver_verification_records_touch_updated_at on public.driver_verification_records;
create trigger driver_verification_records_touch_updated_at
before update on public.driver_verification_records
for each row execute function public.touch_updated_at();

drop trigger if exists driver_verification_records_pii_audit on public.driver_verification_records;
create trigger driver_verification_records_pii_audit
after insert or update or delete on public.driver_verification_records
for each row execute function public.write_pii_audit_log();

create or replace function public.driver_policy13_verified(
  target_profile_id uuid,
  target_run_date date default current_date
)
returns boolean
language sql
stable
as $$
  with required_checks(check_type) as (
    values
      ('licence_current'),
      ('licence_original_sighted'),
      ('licence_copy_retained'),
      ('photo_id'),
      ('criminal_history_relevance'),
      ('right_to_work')
  ),
  driver_record as (
    select dr.*
    from public.driver_records dr
    where dr.profile_id = target_profile_id
    limit 1
  ),
  passed_required as (
    select count(distinct dvr.check_type) as passed_count
    from public.driver_verification_records dvr
    join driver_record dr on dr.id = dvr.driver_record_id
    join required_checks rc on rc.check_type = dvr.check_type
    where dvr.outcome_status = 'passed'
  ),
  latest_licence_review as (
    select max(dvr.check_date) as reviewed_date
    from public.driver_verification_records dvr
    join driver_record dr on dr.id = dvr.driver_record_id
    where dvr.check_type in ('licence_current', 'licence_currency_review')
      and dvr.outcome_status = 'passed'
  )
  select coalesce((
    select
      dr.agreement_status = 'signed'
      and dr.known_licence_issue = false
      and passed_required.passed_count = (select count(*) from required_checks)
      and latest_licence_review.reviewed_date is not null
      and latest_licence_review.reviewed_date + interval '1 year' > target_run_date
    from driver_record dr
    cross join passed_required
    cross join latest_licence_review
  ), false);
$$;

create or replace function public.enforce_run_policy13_driver_verification()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('compiled', 'in_progress')
    and new.driver_profile_id is not null
    and not public.driver_policy13_verified(new.driver_profile_id, new.run_date)
  then
    raise exception 'Policy #13 driver verification required before APP-ADM-002 assignment';
  end if;

  return new;
end;
$$;

drop trigger if exists runs_policy13_driver_verification_guard on public.runs;
create trigger runs_policy13_driver_verification_guard
before insert or update of status, driver_profile_id, run_date
on public.runs
for each row execute function public.enforce_run_policy13_driver_verification();

create or replace function public.queue_driver_verification_retention()
returns trigger
language plpgsql
as $$
declare
  engagement_end date;
begin
  select dr.engagement_end_date
    into engagement_end
  from public.driver_records dr
  where dr.id = new.driver_record_id;

  if engagement_end is null then
    return new;
  end if;

  insert into public.retention_queue (
    table_name,
    record_id,
    retention_until,
    status
  )
  values (
    'driver_verification_records',
    new.id,
    (engagement_end + interval '7 years')::date,
    'pending_privacy_owner_approval'
  )
  on conflict (table_name, record_id) do update
  set retention_until = excluded.retention_until,
      status = case
        when public.retention_queue.status in ('destroyed', 'legal_hold') then public.retention_queue.status
        else excluded.status
      end;

  return new;
end;
$$;

drop trigger if exists driver_verification_records_retention_queue on public.driver_verification_records;
create trigger driver_verification_records_retention_queue
after insert or update of check_date, outcome_status
on public.driver_verification_records
for each row execute function public.queue_driver_verification_retention();

alter table public.driver_verification_records enable row level security;

drop policy if exists driver_verification_records_select_admin_or_self on public.driver_verification_records;
create policy driver_verification_records_select_admin_or_self
on public.driver_verification_records for select to authenticated
using (
  public.is_admin()
  or (
    public.has_active_app_role('driver')
    and profile_id = auth.uid()
  )
);

drop policy if exists driver_verification_records_admin_manage on public.driver_verification_records;
create policy driver_verification_records_admin_manage
on public.driver_verification_records for all to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.driver_verification_records is
  'Policy #13 / POL-OPS-013 check evidence for driver verification. Criminal-history check scope remains an open legal item; the table records Admin outcome evidence only.';

comment on function public.driver_policy13_verified(uuid, date) is
  'Returns true only when the driver has passed Policy #13 checks, has signed Policy #12 Driver Agreement, has no known licence issue, and licence currency is not older than one year for the target run date.';

comment on trigger runs_policy13_driver_verification_guard on public.runs is
  'APP-ADM-002 cannot compile or start a run for a driver without Policy #13 verification.';

comment on trigger driver_verification_records_retention_queue on public.driver_verification_records is
  'Policy #5 retention queue: driver verification records retained for duration of engagement plus 7 years.';
