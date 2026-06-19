-- Moto and Co Couriers dispatch assignment guardrails.
-- Source-backed areas:
-- - APP-ADM-002 assigns an available driver and vehicle to each run.
-- - A run must not depart without a named driver and vehicle assigned.
-- - Driver availability tracking is currently manual.
--
-- This migration does not implement route optimisation, supplier sequencing, or
-- automated night-before planning. Those remain workflow gaps until confirmed.

alter table public.runs
  add column if not exists assigned_at timestamptz,
  add column if not exists assigned_by uuid references public.profiles(id),
  add column if not exists dispatch_notes text;

alter table public.runs
  drop constraint if exists runs_vehicle_name_not_blank;

alter table public.runs
  add constraint runs_vehicle_name_not_blank
  check (length(btrim(vehicle_name)) > 0);

alter table public.runs
  drop constraint if exists runs_compiled_requires_driver_vehicle;

alter table public.runs
  add constraint runs_compiled_requires_driver_vehicle
  check (
    status not in ('compiled', 'in_progress', 'completed')
    or (
      driver_profile_id is not null
      and length(btrim(vehicle_name)) > 0
    )
  );

create table if not exists public.driver_availability (
  id uuid primary key default gen_random_uuid(),
  driver_profile_id uuid not null references public.profiles(id) on delete cascade,
  availability_date date not null,
  status text not null default 'available' check (status in ('available', 'unavailable', 'leave', 'unknown')),
  note text,
  recorded_by uuid references public.profiles(id),
  recorded_at timestamptz not null default now(),
  unique (driver_profile_id, availability_date)
);

create or replace function public.enforce_run_dispatch_assignment()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('compiled', 'in_progress', 'completed')
    and (
      new.driver_profile_id is null
      or new.vehicle_name is null
      or length(btrim(new.vehicle_name)) = 0
    )
  then
    raise exception 'run requires named driver and vehicle before compiled, in_progress, or completed status';
  end if;

  if new.status in ('compiled', 'in_progress')
    and new.driver_profile_id is not null
    and exists (
      select 1
      from public.driver_availability da
      where da.driver_profile_id = new.driver_profile_id
        and da.availability_date = new.run_date
        and da.status in ('unavailable', 'leave')
    )
  then
    raise exception 'assigned driver is not available for this run date';
  end if;

  if new.status = 'compiled' and new.assigned_at is null then
    new.assigned_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists runs_dispatch_assignment_guard on public.runs;
create trigger runs_dispatch_assignment_guard
before insert or update of status, driver_profile_id, vehicle_name, run_date
on public.runs
for each row execute function public.enforce_run_dispatch_assignment();

create index if not exists runs_driver_date_idx
on public.runs (driver_profile_id, run_date);

create index if not exists runs_status_date_idx
on public.runs (status, run_date);

create index if not exists driver_availability_driver_date_idx
on public.driver_availability (driver_profile_id, availability_date);

drop trigger if exists runs_pii_audit on public.runs;
create trigger runs_pii_audit
after insert or update or delete on public.runs
for each row execute function public.write_pii_audit_log();

drop trigger if exists driver_availability_pii_audit on public.driver_availability;
create trigger driver_availability_pii_audit
after insert or update or delete on public.driver_availability
for each row execute function public.write_pii_audit_log();

alter table public.driver_availability enable row level security;
