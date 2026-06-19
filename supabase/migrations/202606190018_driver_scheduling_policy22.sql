-- Policy #22 driver scheduling and availability guardrails.
-- Source-backed areas:
-- - Driver availability tracking is currently manual.
-- - Driver must notify Admin as early as possible and no later than the
--   evening before a scheduled run.
-- - Current single-driver capacity requires Admin contingency evidence when
--   the driver is unavailable.

alter table public.driver_availability
  add column if not exists notice_received_date date,
  add column if not exists notice_due_date date,
  add column if not exists late_notice boolean not null default false,
  add column if not exists contingency_plan text,
  add column if not exists source_ref text not null default 'Policy #22 / APP-ADM-002';

update public.driver_availability
set notice_due_date = availability_date - 1
where notice_due_date is null;

update public.driver_availability
set late_notice = coalesce(notice_received_date > notice_due_date, false);

alter table public.driver_availability
  drop constraint if exists driver_availability_policy22_evidence_required;

alter table public.driver_availability
  add constraint driver_availability_policy22_evidence_required
  check (
    status not in ('unavailable', 'leave')
    or (
      length(btrim(coalesce(note, ''))) > 0
      and notice_received_date is not null
      and notice_due_date is not null
      and length(btrim(coalesce(contingency_plan, ''))) > 0
    )
  );

create or replace function public.set_driver_availability_policy22_fields()
returns trigger
language plpgsql
as $$
begin
  if new.availability_date is not null then
    new.notice_due_date := new.availability_date - 1;
  end if;

  new.late_notice := coalesce(new.notice_received_date > new.notice_due_date, false);

  if new.source_ref is null or length(btrim(new.source_ref)) = 0 then
    new.source_ref := 'Policy #22 / APP-ADM-002';
  end if;

  return new;
end;
$$;

drop trigger if exists driver_availability_policy22_fields on public.driver_availability;
create trigger driver_availability_policy22_fields
before insert or update of availability_date, notice_received_date, notice_due_date, status, note, contingency_plan, source_ref
on public.driver_availability
for each row execute function public.set_driver_availability_policy22_fields();

create index if not exists driver_availability_late_notice_idx
on public.driver_availability (late_notice, availability_date)
where late_notice = true;

comment on column public.driver_availability.notice_received_date is
  'Policy #22: date Admin received driver unavailability or leave notice.';

comment on column public.driver_availability.notice_due_date is
  'Policy #22: notice due date, calculated as the calendar day before the scheduled run.';

comment on column public.driver_availability.contingency_plan is
  'Policy #22: Admin contingency evidence required while current capacity is single-driver.';
