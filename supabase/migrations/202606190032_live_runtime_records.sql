-- Live runtime record bridge for the V1 app shell.
--
-- This table stores the current UI workflow objects by accountable domain while
-- the relational release-one schema remains the source for formal controls,
-- RLS, pricing, POD storage, audit, billing, and retention evidence.
-- It deliberately does not seed launch customers, suppliers, drivers, or
-- vehicles. Those records must come from an approved production import.

create table if not exists public.runtime_records (
  id uuid primary key default gen_random_uuid(),
  record_type text not null check (
    record_type in (
      'client',
      'supplier',
      'driver',
      'vehicle',
      'price_rule',
      'order',
      'delivery_proof',
      'exception',
      'audit',
      'invoice',
      'billing_notice',
      'operational_notice',
      'run_close',
      'master_data_change',
      'exception_alert',
      'driver_availability',
      'financial_reconciliation',
      'ai_draft',
      'data_breach_incident',
      'data_use_record',
      'privacy_request',
      'retention'
    )
  ),
  local_id text not null,
  owner_actor_id uuid references public.actors(id) on delete set null,
  driver_profile_id uuid references public.profiles(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  source_ref text not null default 'Moto & Co V1 live runtime bridge',
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (record_type, local_id)
);

create index if not exists runtime_records_type_idx
  on public.runtime_records (record_type, updated_at desc);

create index if not exists runtime_records_owner_idx
  on public.runtime_records (owner_actor_id, record_type);

create index if not exists runtime_records_driver_idx
  on public.runtime_records (driver_profile_id, record_type);

drop trigger if exists runtime_records_touch_updated_at on public.runtime_records;
create trigger runtime_records_touch_updated_at
before update on public.runtime_records
for each row execute function public.touch_updated_at();

drop trigger if exists runtime_records_pii_audit on public.runtime_records;
create trigger runtime_records_pii_audit
after insert or update or delete on public.runtime_records
for each row execute function public.write_pii_audit_log();

alter table public.runtime_records enable row level security;

drop policy if exists runtime_records_select_by_role_scope on public.runtime_records;
create policy runtime_records_select_by_role_scope
on public.runtime_records for select to authenticated
using (
  public.is_admin()
  or record_type = 'price_rule'
  or (
    owner_actor_id is not null
    and public.can_client_access_account(owner_actor_id)
  )
  or (
    driver_profile_id is not null
    and driver_profile_id = auth.uid()
  )
);

drop policy if exists runtime_records_insert_by_role_scope on public.runtime_records;
create policy runtime_records_insert_by_role_scope
on public.runtime_records for insert to authenticated
with check (
  public.is_admin()
  or (
    record_type in ('order', 'exception', 'operational_notice')
    and owner_actor_id is not null
    and public.can_client_operational_account(owner_actor_id)
  )
  or (
    record_type in ('exception', 'billing_notice')
    and owner_actor_id is not null
    and public.can_client_billing_account(owner_actor_id)
  )
  or (
    record_type in ('delivery_proof', 'order', 'exception', 'run_close')
    and driver_profile_id = auth.uid()
  )
);

drop policy if exists runtime_records_update_by_role_scope on public.runtime_records;
create policy runtime_records_update_by_role_scope
on public.runtime_records for update to authenticated
using (
  public.is_admin()
  or (
    record_type in ('order', 'exception', 'operational_notice')
    and owner_actor_id is not null
    and public.can_client_operational_account(owner_actor_id)
  )
  or (
    record_type in ('exception', 'billing_notice')
    and owner_actor_id is not null
    and public.can_client_billing_account(owner_actor_id)
  )
  or (
    record_type in ('delivery_proof', 'order', 'exception', 'run_close')
    and driver_profile_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or (
    record_type in ('order', 'exception', 'operational_notice')
    and owner_actor_id is not null
    and public.can_client_operational_account(owner_actor_id)
  )
  or (
    record_type in ('exception', 'billing_notice')
    and owner_actor_id is not null
    and public.can_client_billing_account(owner_actor_id)
  )
  or (
    record_type in ('delivery_proof', 'order', 'exception', 'run_close')
    and driver_profile_id = auth.uid()
  )
);

drop policy if exists runtime_records_admin_delete on public.runtime_records;
create policy runtime_records_admin_delete
on public.runtime_records for delete to authenticated
using (public.is_admin());

create table if not exists public.production_seed_imports (
  id uuid primary key default gen_random_uuid(),
  import_name text not null,
  source_file text not null,
  approved_by text not null,
  approved_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'applied', 'rejected')),
  imported_by uuid references public.profiles(id),
  imported_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.production_seed_imports enable row level security;

drop policy if exists production_seed_imports_admin_manage on public.production_seed_imports;
create policy production_seed_imports_admin_manage
on public.production_seed_imports for all to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.runtime_records is
  'V1 live runtime bridge. Stores workflow objects by domain without inventing production master data.';

comment on table public.production_seed_imports is
  'Approved launch master-data import evidence. No production customers, suppliers, drivers, or vehicles are seeded without this record.';
