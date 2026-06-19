-- APP-FLT-001 / BOAS Sheet 06 fleet vehicle register.
--
-- Source-backed intent:
-- - Vehicle Record and Fleet Asset Register are required data objects.
-- - Admin owns fleet master data.
-- - Runs must not use a vehicle with expired registration, lapsed insurance,
--   or a known safety defect.
--
-- This does not implement live expiry monitoring, route optimisation, or
-- external vehicle/insurance integrations.

create table if not exists public.fleet_vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_code text not null unique,
  registration_plate text,
  make text,
  model text,
  vehicle_year integer,
  ownership_type text not null default 'company' check (ownership_type in ('company', 'driver', 'other')),
  status text not null default 'needs_review' check (status in ('active', 'needs_review', 'out_of_service', 'archived')),
  assigned_driver_profile_id uuid references public.profiles(id) on delete set null,
  registration_expiry date,
  insurance_policy text,
  insurance_expiry date,
  gvm_kg numeric(10,2),
  last_service_date date,
  next_service_due date,
  defect_status text not null default 'unknown' check (defect_status in ('clear', 'unknown', 'open_defect')),
  last_reviewed date,
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fleet_vehicles_status_idx
  on public.fleet_vehicles (status, registration_expiry, insurance_expiry, defect_status);

create index if not exists fleet_vehicles_driver_idx
  on public.fleet_vehicles (assigned_driver_profile_id, status);

drop trigger if exists fleet_vehicles_touch_updated_at on public.fleet_vehicles;
create trigger fleet_vehicles_touch_updated_at
before update on public.fleet_vehicles
for each row execute function public.touch_updated_at();

drop trigger if exists fleet_vehicles_pii_audit on public.fleet_vehicles;
create trigger fleet_vehicles_pii_audit
after insert or update or delete on public.fleet_vehicles
for each row execute function public.write_pii_audit_log();

alter table public.fleet_vehicles enable row level security;

alter table public.runs
  add column if not exists vehicle_id uuid references public.fleet_vehicles(id) on delete restrict,
  add column if not exists vehicle_registration_expiry date,
  add column if not exists vehicle_insurance_expiry date,
  add column if not exists vehicle_compliance_source text;

create index if not exists runs_vehicle_idx
  on public.runs (vehicle_id, run_date);

drop policy if exists fleet_vehicles_select_admin_or_assigned_driver on public.fleet_vehicles;
create policy fleet_vehicles_select_admin_or_assigned_driver
on public.fleet_vehicles for select to authenticated
using (
  public.is_admin()
  or (
    public.has_active_app_role('driver')
    and (
      assigned_driver_profile_id = auth.uid()
      or exists (
        select 1
        from public.runs r
        where r.vehicle_id = fleet_vehicles.id
          and r.driver_profile_id = auth.uid()
      )
    )
  )
);

drop policy if exists fleet_vehicles_admin_manage on public.fleet_vehicles;
create policy fleet_vehicles_admin_manage
on public.fleet_vehicles for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.enforce_run_fleet_vehicle()
returns trigger
language plpgsql
as $$
declare
  fleet_record public.fleet_vehicles%rowtype;
begin
  if new.status in ('compiled', 'in_progress', 'completed') then
    if new.vehicle_id is null then
      raise exception 'run requires a fleet vehicle record before compiled, in_progress, or completed status';
    end if;

    select *
    into fleet_record
    from public.fleet_vehicles
    where id = new.vehicle_id;

    if fleet_record.id is null then
      raise exception 'fleet vehicle record not found';
    end if;

    if fleet_record.status <> 'active' then
      raise exception 'fleet vehicle must be active before run assignment';
    end if;

    if fleet_record.registration_expiry is null or fleet_record.registration_expiry < new.run_date then
      raise exception 'fleet vehicle registration is not current for this run date';
    end if;

    if fleet_record.insurance_expiry is null or fleet_record.insurance_expiry < new.run_date then
      raise exception 'fleet vehicle insurance is not current for this run date';
    end if;

    if fleet_record.defect_status = 'open_defect' then
      raise exception 'fleet vehicle has an open defect';
    end if;

    new.vehicle_name := coalesce(nullif(btrim(new.vehicle_name), ''), fleet_record.vehicle_code);
    new.vehicle_registration_current := true;
    new.vehicle_insurance_current := true;
    new.vehicle_registration_expiry := fleet_record.registration_expiry;
    new.vehicle_insurance_expiry := fleet_record.insurance_expiry;
    new.vehicle_compliance_checked_at := coalesce(new.vehicle_compliance_checked_at, now());
    new.vehicle_compliance_source := coalesce(nullif(new.vehicle_compliance_source, ''), 'fleet_vehicles');
  end if;

  return new;
end;
$$;

drop trigger if exists runs_fleet_vehicle_guard on public.runs;
drop trigger if exists runs_before_fleet_vehicle_guard on public.runs;
create trigger runs_before_fleet_vehicle_guard
before insert or update of status, vehicle_id, vehicle_name, run_date
on public.runs
for each row execute function public.enforce_run_fleet_vehicle();

comment on table public.fleet_vehicles is
  'Admin-managed APP-FLT-001 fleet vehicle register from BOAS Sheet 06 Vehicle Record / Fleet Asset Register.';

comment on column public.runs.vehicle_id is
  'Named fleet vehicle record assigned by APP-ADM-002 before run departure.';
