-- Operational notice records for UJ-CRM-001A and UJ-ADM-001.
-- Local build records customer-facing operational updates only.
-- Production email/SMS/in-app delivery remains unconfirmed, so channel defaults to local_record_only.

create table if not exists public.operational_notices (
  id uuid primary key default gen_random_uuid(),
  account_actor_id uuid references public.actors(id) on delete set null,
  client_local_id text,
  order_local_id text not null,
  notice_type text not null check (notice_type in (
    'pickup_request_submitted',
    'schedule_adjusted',
    'pickup_confirmed',
    'out_for_delivery',
    'delivered',
    'failed_delivery',
    'no_pickup',
    'bring_forward',
    'dispute_received',
    'supplier_setup_requested'
  )),
  audience text not null default 'client_operational' check (audience in ('client_operational', 'client_billing', 'admin', 'driver')),
  subject text not null,
  message text not null,
  channel text not null default 'local_record_only' check (channel in ('local_record_only', 'email', 'sms', 'in_app')),
  external_delivery_status text not null default 'provider_not_configured',
  event_ref text,
  policy_ref text,
  created_by text,
  created_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

create index if not exists operational_notices_account_idx
  on public.operational_notices (account_actor_id, notice_type, created_at desc);

create index if not exists operational_notices_order_idx
  on public.operational_notices (order_local_id, created_at desc);

drop trigger if exists operational_notices_pii_audit on public.operational_notices;
create trigger operational_notices_pii_audit
after insert or update or delete on public.operational_notices
for each row execute function public.write_pii_audit_log();

alter table public.operational_notices enable row level security;
