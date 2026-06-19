-- Billing notice records for UJ-CRM-001B and UJ-ADM-001.
-- Local build supports Day 8 overdue, invoice, suspension, and reinstatement
-- notice evidence records.
-- Production email/SMS/in-app delivery remains unconfirmed, so channel defaults to local_record_only.

create table if not exists public.billing_notices (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete set null,
  invoice_number text not null,
  account_actor_id uuid not null references public.actors(id) on delete restrict,
  billing_contact_id uuid references public.contacts(id) on delete set null,
  billing_email text not null,
  operational_contact_email text,
  notice_type text not null check (notice_type in ('day_8_overdue', 'suspension', 'reinstatement', 'invoice')),
  channel text not null default 'local_record_only' check (channel in ('local_record_only', 'email', 'sms', 'in_app')),
  status text not null default 'recorded' check (status in ('recorded', 'queued', 'sent', 'failed', 'cancelled')),
  invoice_due_date date,
  notice_due_date date not null,
  recorded_by uuid references public.profiles(id),
  recorded_at timestamptz not null default now(),
  external_delivery_status text not null default 'provider_not_configured',
  payload jsonb not null default '{}'::jsonb,
  constraint billing_notices_unique_invoice_type unique (invoice_number, notice_type)
);

create index if not exists billing_notices_account_idx
  on public.billing_notices (account_actor_id, notice_type, recorded_at desc);

create index if not exists billing_notices_invoice_idx
  on public.billing_notices (invoice_number, notice_type);

drop trigger if exists billing_notices_pii_audit on public.billing_notices;
create trigger billing_notices_pii_audit
after insert or update or delete on public.billing_notices
for each row execute function public.write_pii_audit_log();

alter table public.billing_notices enable row level security;
