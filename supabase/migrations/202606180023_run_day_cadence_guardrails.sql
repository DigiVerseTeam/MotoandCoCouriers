-- Run-day cadence guardrails for SOP-REQ-02 / APP-ADM-001.
--
-- Source-backed intent:
-- - Cut-off handling moves adjusted work to the next available run date.
-- - Release-one journeys describe the run model as Tuesday / Thursday.
-- - Date adjustments must be retained as evidence, not silently overwritten.
--
-- These triggers protect future inserts/updates without validating any historical
-- rows that may already exist in a live project before this migration is applied.

create or replace function public.is_moto_run_day(run_date date)
returns boolean
language sql
immutable
as $$
  select extract(dow from run_date)::int in (2, 4)
$$;

create or replace function public.enforce_pickup_request_run_cadence()
returns trigger
language plpgsql
as $$
begin
  if new.actual_run_date < new.requested_run_date then
    raise exception 'actual_run_date cannot be before requested_run_date';
  end if;

  if not public.is_moto_run_day(new.actual_run_date) then
    raise exception 'actual_run_date must be a Tuesday or Thursday run date';
  end if;

  if new.cut_off_applied and not new.schedule_adjusted then
    raise exception 'cut_off_applied pickup requests must also set schedule_adjusted';
  end if;

  if new.actual_run_date <> new.requested_run_date and not new.schedule_adjusted then
    raise exception 'schedule_adjusted must be true when actual_run_date differs from requested_run_date';
  end if;

  return new;
end;
$$;

drop trigger if exists pickup_requests_run_cadence_guard on public.pickup_requests;
create trigger pickup_requests_run_cadence_guard
before insert or update of requested_run_date, actual_run_date, cut_off_applied, schedule_adjusted
on public.pickup_requests
for each row execute function public.enforce_pickup_request_run_cadence();

create or replace function public.enforce_run_day_cadence()
returns trigger
language plpgsql
as $$
begin
  if not public.is_moto_run_day(new.run_date) then
    raise exception 'runs.run_date must be a Tuesday or Thursday run date';
  end if;

  return new;
end;
$$;

drop trigger if exists runs_run_day_cadence_guard on public.runs;
create trigger runs_run_day_cadence_guard
before insert or update of run_date
on public.runs
for each row execute function public.enforce_run_day_cadence();

comment on trigger pickup_requests_run_cadence_guard on public.pickup_requests is
  'SOP-REQ-02 / APP-ADM-001: adjusted pickup requests must resolve to a Tuesday/Thursday run date and retain schedule-adjusted evidence.';

comment on trigger runs_run_day_cadence_guard on public.runs is
  'APP-ADM-002: compiled runs must use the confirmed Tuesday/Thursday release-one cadence.';
