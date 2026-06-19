-- APP-ADM-006 / SOP-JDD-01 driver record governance.
--
-- Source-backed intent:
-- - Driver Record fields include driver_id, name, licence_number,
--   classification, engagement_start_date, and agreement_signed_date.
-- - The current driver's engagement start date must be recorded now.
-- - Driver onboarding / APP-JDD-003 is blocked for production until a
--   Fair Work-aware lawyer confirms classification and Policy #12 Driver
--   Agreement is reviewed/finalised.
-- - Retention is duration of engagement plus 7 years.

create table if not exists public.driver_records (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  driver_code text unique,
  full_name text not null,
  email text,
  phone text,
  licence_number text,
  classification text,
  classification_status text not null default 'blocked_pending_fair_work_legal_classification'
    check (classification_status in ('blocked_pending_fair_work_legal_classification', 'recorded_from_legal_advice')),
  engagement_start_date date,
  engagement_end_date date,
  agreement_signed_date date,
  agreement_status text not null default 'blocked_pending_policy_12_legal_review'
    check (agreement_status in ('blocked_pending_policy_12_legal_review', 'signed')),
  onboarding_status text not null default 'production_onboarding_blocked'
    check (onboarding_status in ('production_onboarding_blocked', 'ready_for_admin_review', 'active', 'inactive')),
  last_reviewed date,
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.master_data_changes
  drop constraint if exists master_data_changes_change_type_check;

alter table public.master_data_changes
  add constraint master_data_changes_change_type_check
  check (change_type in ('supplier', 'pricing', 'account', 'vehicle', 'driver_record'));

create index if not exists driver_records_profile_idx
  on public.driver_records (profile_id);

create index if not exists driver_records_engagement_review_idx
  on public.driver_records (engagement_start_date, engagement_end_date, last_reviewed);

alter table public.driver_records
  drop constraint if exists driver_records_engagement_dates_check;

alter table public.driver_records
  add constraint driver_records_engagement_dates_check
  check (
    engagement_end_date is null
    or engagement_start_date is null
    or engagement_end_date >= engagement_start_date
  );

drop trigger if exists driver_records_touch_updated_at on public.driver_records;
create trigger driver_records_touch_updated_at
before update on public.driver_records
for each row execute function public.touch_updated_at();

drop trigger if exists driver_records_pii_audit on public.driver_records;
create trigger driver_records_pii_audit
after insert or update or delete on public.driver_records
for each row execute function public.write_pii_audit_log();

create or replace function public.queue_driver_record_retention()
returns trigger
language plpgsql
as $$
begin
  if new.engagement_end_date is null then
    return new;
  end if;

  insert into public.retention_queue (
    table_name,
    record_id,
    retention_until,
    status
  )
  values (
    'driver_records',
    new.id,
    (new.engagement_end_date + interval '7 years')::date,
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

drop trigger if exists driver_records_retention_queue on public.driver_records;
create trigger driver_records_retention_queue
after insert or update of engagement_end_date
on public.driver_records
for each row execute function public.queue_driver_record_retention();

alter table public.driver_records enable row level security;

drop policy if exists driver_records_select_admin_or_self on public.driver_records;
create policy driver_records_select_admin_or_self
on public.driver_records for select to authenticated
using (
  public.is_admin()
  or (
    public.has_active_app_role('driver')
    and profile_id = auth.uid()
  )
);

drop policy if exists driver_records_admin_manage on public.driver_records;
create policy driver_records_admin_manage
on public.driver_records for all to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.driver_records is
  'APP-ADM-006 driver records for SOP-JDD-01. Production APP-JDD-003 onboarding remains blocked until Fair Work-aware legal classification and Policy #12 Driver Agreement are confirmed.';

comment on column public.driver_records.engagement_start_date is
  'Immediate source-backed APP-ADM-006 action for the current driver: record engagement start date now.';

comment on trigger driver_records_retention_queue on public.driver_records is
  'Policy #5 retention queue: driver record retained for duration of engagement plus 7 years.';
