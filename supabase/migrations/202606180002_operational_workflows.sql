-- Moto and Co Couriers operational workflow extension.
-- Source-backed areas:
-- - UJ-CRM-001A dispute journey
-- - UJ-CRM-001B billing journey
-- - UJ-ADM-001 billing/suspension journey
-- - UJ-DRV-001 run close journey
-- - docs/release-one-source-map.md
--
-- This migration does not finalize production RLS policy logic. Policy #21,
-- BOAS Sheet 05, Supabase Auth setup, and project-region decisions remain
-- deployment blockers.

alter table public.pickup_requests
  drop constraint if exists pickup_requests_status_check;

alter table public.pickup_requests
  add constraint pickup_requests_status_check
  check (status in (
    'pending',
    'assigned',
    'picked_up',
    'delivered',
    'no_pickup',
    'brought_forward',
    'failed_delivery',
    'cancelled',
    'exception'
  ));

alter table public.pickups
  drop constraint if exists pickups_status_check;

alter table public.pickups
  add constraint pickups_status_check
  check (status in (
    'pending',
    'picked_up',
    'no_pickup',
    'brought_forward',
    'abandoned',
    'exception'
  ));

alter table public.deliveries
  add column if not exists failed_reason text,
  add column if not exists retained_goods_note text;

alter table public.runs
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references public.profiles(id),
  add column if not exists close_summary jsonb not null default '{}'::jsonb;

create table if not exists public.run_closures (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.runs(id) on delete set null,
  driver_profile_id uuid references public.profiles(id),
  run_date date not null,
  open_stop_count integer not null default 0 check (open_stop_count >= 0),
  delivered_count integer not null default 0 check (delivered_count >= 0),
  exception_count integer not null default 0 check (exception_count >= 0),
  billing_ready boolean not null default false,
  closed_at timestamptz not null default now(),
  close_note text
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  account_actor_id uuid not null references public.actors(id) on delete restrict,
  billing_contact_id uuid references public.contacts(id) on delete set null,
  billing_email text not null,
  period_start date,
  period_end date,
  status text not null default 'draft' check (status in ('draft', 'approved', 'sent', 'paid', 'overdue', 'disputed', 'void')),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  gst_cents integer not null default 0 check (gst_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  due_date date not null,
  sent_at timestamptz,
  paid_at timestamptz,
  overdue_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  pickup_request_id uuid references public.pickup_requests(id) on delete restrict,
  delivery_id uuid references public.deliveries(id) on delete restrict,
  delivery_proof_id uuid references public.delivery_proof(id) on delete restrict,
  description text not null,
  item_type text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_amount_cents integer not null check (unit_amount_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  dispute_type text not null check (dispute_type in ('delivery', 'billing')),
  account_actor_id uuid not null references public.actors(id) on delete restrict,
  pickup_request_id uuid references public.pickup_requests(id) on delete set null,
  delivery_id uuid references public.deliveries(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  exception_id uuid references public.exceptions(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'rejected')),
  summary text not null,
  detail text not null,
  raised_by uuid references public.profiles(id),
  raised_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_note text
);

create table if not exists public.account_suspensions (
  id uuid primary key default gen_random_uuid(),
  account_actor_id uuid not null references public.actors(id) on delete restrict,
  invoice_id uuid references public.invoices(id) on delete set null,
  reason text not null,
  status text not null default 'active' check (status in ('active', 'reinstated', 'cancelled')),
  suspended_by uuid references public.profiles(id),
  suspended_at timestamptz not null default now(),
  notification_sent boolean not null default false,
  reinstated_by uuid references public.profiles(id),
  reinstated_at timestamptz,
  reinstatement_note text
);

alter table public.exceptions
  add column if not exists investigation_policy text,
  add column if not exists investigation_outcome text,
  add column if not exists investigation_note text,
  add column if not exists investigation_evidence jsonb not null default '{}'::jsonb,
  add column if not exists investigated_by uuid references public.profiles(id),
  add column if not exists investigated_at timestamptz;

create table if not exists public.exception_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_date date not null,
  audience_role text not null default 'admin',
  channel text not null default 'local_dashboard',
  status text not null default 'generated' check (status in ('generated', 'reviewed', 'sent', 'failed')),
  open_exception_count integer not null default 0 check (open_exception_count >= 0),
  proof_linked_count integer not null default 0 check (proof_linked_count >= 0),
  payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  unique (alert_date, audience_role, channel)
);

create or replace function public.touch_invoice_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invoices_touch_updated_at on public.invoices;
create trigger invoices_touch_updated_at
before update on public.invoices
for each row execute function public.touch_invoice_updated_at();

-- Run close cannot be recorded while unresolved run stops remain.
create or replace function public.enforce_run_close_no_open_stops()
returns trigger
language plpgsql
as $$
begin
  if new.open_stop_count > 0 then
    raise exception 'run cannot close while stops remain open';
  end if;
  return new;
end;
$$;

drop trigger if exists run_closures_no_open_stops on public.run_closures;
create trigger run_closures_no_open_stops
before insert or update on public.run_closures
for each row execute function public.enforce_run_close_no_open_stops();

-- Delivery proof is immutable once captured.
create or replace function public.prevent_delivery_proof_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'delivery_proof records are immutable';
end;
$$;

drop trigger if exists delivery_proof_no_update on public.delivery_proof;
create trigger delivery_proof_no_update
before update on public.delivery_proof
for each row execute function public.prevent_delivery_proof_mutation();

drop trigger if exists delivery_proof_no_delete on public.delivery_proof;
create trigger delivery_proof_no_delete
before delete on public.delivery_proof
for each row execute function public.prevent_delivery_proof_mutation();

-- Audit log is append-only.
create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;

drop trigger if exists audit_log_no_update on public.audit_log;
create trigger audit_log_no_update
before update on public.audit_log
for each row execute function public.prevent_audit_log_mutation();

drop trigger if exists audit_log_no_delete on public.audit_log;
create trigger audit_log_no_delete
before delete on public.audit_log
for each row execute function public.prevent_audit_log_mutation();

create or replace function public.write_pii_audit_log()
returns trigger
language plpgsql
as $$
declare
  record_uuid uuid;
begin
  record_uuid := coalesce(new.id, old.id);

  insert into public.audit_log (
    table_name,
    record_id,
    action,
    pii_action,
    performed_by,
    metadata
  )
  values (
    tg_table_name,
    record_uuid,
    lower(tg_op),
    true,
    auth.uid(),
    jsonb_build_object('schema', tg_table_schema)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists actors_pii_audit on public.actors;
create trigger actors_pii_audit
after insert or update or delete on public.actors
for each row execute function public.write_pii_audit_log();

drop trigger if exists contacts_pii_audit on public.contacts;
create trigger contacts_pii_audit
after insert or update or delete on public.contacts
for each row execute function public.write_pii_audit_log();

drop trigger if exists pickup_requests_pii_audit on public.pickup_requests;
create trigger pickup_requests_pii_audit
after insert or update or delete on public.pickup_requests
for each row execute function public.write_pii_audit_log();

drop trigger if exists deliveries_pii_audit on public.deliveries;
create trigger deliveries_pii_audit
after insert or update or delete on public.deliveries
for each row execute function public.write_pii_audit_log();

drop trigger if exists delivery_proof_pii_audit on public.delivery_proof;
create trigger delivery_proof_pii_audit
after insert on public.delivery_proof
for each row execute function public.write_pii_audit_log();

drop trigger if exists invoices_pii_audit on public.invoices;
create trigger invoices_pii_audit
after insert or update or delete on public.invoices
for each row execute function public.write_pii_audit_log();

drop trigger if exists invoice_lines_pii_audit on public.invoice_lines;
create trigger invoice_lines_pii_audit
after insert or update or delete on public.invoice_lines
for each row execute function public.write_pii_audit_log();

drop trigger if exists disputes_pii_audit on public.disputes;
create trigger disputes_pii_audit
after insert or update or delete on public.disputes
for each row execute function public.write_pii_audit_log();

drop trigger if exists exception_alerts_pii_audit on public.exception_alerts;
create trigger exception_alerts_pii_audit
after insert or update or delete on public.exception_alerts
for each row execute function public.write_pii_audit_log();

drop trigger if exists account_suspensions_pii_audit on public.account_suspensions;
create trigger account_suspensions_pii_audit
after insert or update or delete on public.account_suspensions
for each row execute function public.write_pii_audit_log();

alter table public.run_closures enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.disputes enable row level security;
alter table public.exception_alerts enable row level security;
alter table public.account_suspensions enable row level security;
