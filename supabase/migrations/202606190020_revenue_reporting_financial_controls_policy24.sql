-- Policy #24 / POL-OPS-024 Revenue Reporting & Financial Controls.
--
-- Source-backed intent:
-- - APP-ADM-003/004 invoice records are the system of record for revenue.
-- - No off-system invoices are permitted.
-- - Admin reconciles invoice records against payment received records within
--   5 business days of month end.
-- - Invoice, payment, and reconciliation records are retained for 7 years.
-- - External accountant and Otimi Rules reporting cadence/format remain open
--   production gaps and are recorded as gaps, not configured integrations.

create or replace function public.policy24_add_business_days(start_date date, business_days integer)
returns date
language plpgsql
immutable
as $$
declare
  cursor_date date := start_date;
  added integer := 0;
begin
  while added < business_days loop
    cursor_date := cursor_date + 1;
    if extract(isodow from cursor_date) < 6 then
      added := added + 1;
    end if;
  end loop;
  return cursor_date;
end;
$$;

create table if not exists public.financial_reconciliations (
  id uuid primary key default gen_random_uuid(),
  period_month date not null unique,
  month_end_date date not null,
  reconciliation_due_date date not null,
  status text not null default 'open' check (status in ('open', 'completed', 'overdue')),
  invoice_count integer not null default 0 check (invoice_count >= 0),
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  gst_cents integer not null default 0 check (gst_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  paid_cents integer not null default 0 check (paid_cents >= 0),
  unpaid_cents integer not null default 0 check (unpaid_cents >= 0),
  payment_record_count integer not null default 0 check (payment_record_count >= 0),
  overdue_invoice_count integer not null default 0 check (overdue_invoice_count >= 0),
  no_off_system_revenue_confirmed boolean not null default false,
  external_accountant_name text,
  portfolio_report_status text not null default 'blocked_otimi_rules_cadence_format_unconfirmed',
  admin_note text,
  source_ref text not null default 'Policy #24 / POL-OPS-024',
  completed_by uuid references public.profiles(id),
  completed_at timestamptz,
  retained_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_reconciliations_policy24_completed_evidence_check
    check (
      status <> 'completed'
      or (
        completed_at is not null
        and no_off_system_revenue_confirmed = true
        and length(trim(coalesce(admin_note, ''))) > 0
        and source_ref like 'Policy #24%'
      )
    )
);

create table if not exists public.financial_reconciliation_invoices (
  financial_reconciliation_id uuid not null references public.financial_reconciliations(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  primary key (financial_reconciliation_id, invoice_id)
);

create index if not exists financial_reconciliations_due_idx
  on public.financial_reconciliations (status, reconciliation_due_date);

create or replace function public.set_policy24_reconciliation_dates()
returns trigger
language plpgsql
as $$
begin
  new.period_month := date_trunc('month', new.period_month)::date;
  new.month_end_date := (date_trunc('month', new.period_month)::date + interval '1 month - 1 day')::date;
  new.reconciliation_due_date := public.policy24_add_business_days(new.month_end_date, 5);
  if new.completed_at is null then
    new.retained_until := null;
  else
    new.retained_until := (new.completed_at::date + interval '7 years')::date;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists financial_reconciliations_policy24_dates on public.financial_reconciliations;
create trigger financial_reconciliations_policy24_dates
before insert or update on public.financial_reconciliations
for each row execute function public.set_policy24_reconciliation_dates();

create or replace function public.queue_policy24_financial_reconciliation_retention()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and new.completed_at is not null then
    insert into public.retention_queue (
      table_name,
      record_id,
      retention_until,
      status
    )
    values (
      'financial_reconciliations',
      new.id,
      new.retained_until,
      'pending_privacy_owner_approval'
    )
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists financial_reconciliations_policy24_retention on public.financial_reconciliations;
create trigger financial_reconciliations_policy24_retention
after insert or update on public.financial_reconciliations
for each row execute function public.queue_policy24_financial_reconciliation_retention();

drop trigger if exists financial_reconciliations_pii_audit on public.financial_reconciliations;
create trigger financial_reconciliations_pii_audit
after insert or update or delete on public.financial_reconciliations
for each row execute function public.write_pii_audit_log();

alter table public.financial_reconciliations enable row level security;
alter table public.financial_reconciliation_invoices enable row level security;

drop policy if exists financial_reconciliations_admin_manage on public.financial_reconciliations;
create policy financial_reconciliations_admin_manage
on public.financial_reconciliations for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists financial_reconciliation_invoices_admin_manage on public.financial_reconciliation_invoices;
create policy financial_reconciliation_invoices_admin_manage
on public.financial_reconciliation_invoices for all to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.financial_reconciliations is
  'Policy #24 / POL-OPS-024 month-end revenue reconciliation records. External accountant and Otimi Rules reporting cadence/format remain open gaps.';

comment on column public.financial_reconciliations.no_off_system_revenue_confirmed is
  'Policy #24 evidence: Admin confirms all revenue was recorded through APP-ADM-003/004 and no off-system invoice was used.';

comment on column public.financial_reconciliations.reconciliation_due_date is
  'Policy #24: month-end reconciliation due 5 business days after month end.';

comment on column public.financial_reconciliations.portfolio_report_status is
  'Policy #24: Otimi Rules reporting cadence and format are unconfirmed until supplied by Owner/Admin.';
