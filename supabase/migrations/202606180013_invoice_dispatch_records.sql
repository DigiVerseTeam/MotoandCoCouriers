-- Moto and Co Couriers invoice dispatch record extension.
-- Source-backed areas:
-- - UJ-CRM-001B Billing Contact invoice receipt journey
-- - UJ-ADM-001 Admin billing review / invoice approval journey
--
-- This stores local dispatch evidence only. Production PDF/email rendering,
-- provider delivery, bounce handling, and external accounting export remain
-- open deployment decisions.

alter table public.invoices
  add column if not exists dispatch_channel text not null default 'local_record_only'
    check (dispatch_channel in ('local_record_only', 'email', 'sms', 'in_app', 'export')),
  add column if not exists dispatch_recipient text,
  add column if not exists dispatch_external_status text not null default 'provider_not_configured',
  add column if not exists dispatch_note text,
  add column if not exists dispatch_recorded_at timestamptz,
  add column if not exists dispatch_recorded_by uuid references public.profiles(id);

alter table public.invoices
  drop constraint if exists invoices_sent_dispatch_record_check;

alter table public.invoices
  add constraint invoices_sent_dispatch_record_check
  check (
    status <> 'sent'
    or (
      dispatch_recorded_at is not null
      and length(trim(coalesce(dispatch_recipient, billing_email, ''))) > 0
      and length(trim(coalesce(dispatch_note, ''))) > 0
    )
  );
