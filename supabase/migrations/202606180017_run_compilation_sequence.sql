-- APP-ADM-002 local run compilation and sequencing support.
-- This stores the run brief order produced by local/manual compilation while
-- keeping production route optimisation and live APP-FLT-001 checks as gaps.

alter table public.runs
  add column if not exists compile_mode text not null default 'local_manual_compile',
  add column if not exists vehicle_registration_current boolean not null default false,
  add column if not exists vehicle_insurance_current boolean not null default false,
  add column if not exists vehicle_compliance_checked_at timestamptz,
  add column if not exists vehicle_compliance_note text;

alter table public.pickup_requests
  add column if not exists run_id uuid references public.runs(id) on delete set null,
  add column if not exists run_sequence integer,
  add column if not exists supplier_sequence integer,
  add column if not exists delivery_zone text,
  add column if not exists dispatch_mode text,
  add column if not exists assigned_at timestamptz,
  add column if not exists assigned_by uuid references public.profiles(id);

alter table public.pickups
  add column if not exists run_sequence integer,
  add column if not exists supplier_sequence integer,
  add column if not exists delivery_zone text;

alter table public.deliveries
  add column if not exists run_sequence integer,
  add column if not exists delivery_zone text;

alter table public.pickup_requests
  drop constraint if exists pickup_requests_run_sequence_positive;

alter table public.pickup_requests
  add constraint pickup_requests_run_sequence_positive
  check (run_sequence is null or run_sequence > 0);

alter table public.pickup_requests
  drop constraint if exists pickup_requests_supplier_sequence_positive;

alter table public.pickup_requests
  add constraint pickup_requests_supplier_sequence_positive
  check (supplier_sequence is null or supplier_sequence > 0);

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

  if new.status in ('compiled', 'in_progress', 'completed')
    and (
      coalesce(new.vehicle_registration_current, false) = false
      or coalesce(new.vehicle_insurance_current, false) = false
    )
  then
    raise exception 'run requires vehicle registration and insurance compliance confirmation';
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

  if new.status = 'compiled' and new.compiled_at is null then
    new.compiled_at = now();
  end if;

  return new;
end;
$$;

create index if not exists pickup_requests_run_sequence_idx
  on public.pickup_requests (run_id, run_sequence);

create index if not exists pickup_requests_actual_run_assignment_idx
  on public.pickup_requests (actual_run_date, run_id, run_sequence);

comment on column public.pickup_requests.run_sequence is
  'Driver-visible stop sequence from APP-ADM-002 run compilation. Local sequence is supplier/geography deterministic, not production route optimisation.';

comment on column public.runs.vehicle_compliance_note is
  'Local APP-FLT-001 compliance evidence or blocker note until live fleet compliance data is connected.';
