-- Local invoice payment evidence for UJ-CRM-001B / UJ-ADM-001.
-- This does not choose a production payment confirmation source.
-- Zoho, bank-feed, export, and manual reconciliation rules remain open.

alter table public.invoices
  add column if not exists payment_source text,
  add column if not exists payment_evidence text,
  add column if not exists payment_recorded_by uuid references public.profiles(id),
  add column if not exists payment_recorded_at timestamptz;

comment on column public.invoices.payment_source is
  'Local value is local_admin_evidence. Production payment confirmation source is not confirmed.';

comment on column public.invoices.payment_evidence is
  'Admin-entered payment evidence/reference required before local invoice status is set to paid.';
