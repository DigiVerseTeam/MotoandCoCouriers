-- Account-level billing notice records for UJ-CRM-001B / UJ-ADM-001.
--
-- The original billing_notices table already allowed suspension and
-- reinstatement notice types, but required an invoice_number. Suspension and
-- reinstatement notices can be account-level records, so invoice_number must be
-- optional for those notice types. This migration does not add outbound
-- delivery; channel/status remain local evidence until a production provider is
-- confirmed.

alter table public.billing_notices
  alter column invoice_number drop not null;

alter table public.billing_notices
  add column if not exists subject text,
  add column if not exists event_ref text;

alter table public.billing_notices
  drop constraint if exists billing_notices_unique_invoice_type;

create unique index if not exists billing_notices_unique_invoice_type_idx
  on public.billing_notices (invoice_number, notice_type)
  where invoice_number is not null;

create index if not exists billing_notices_account_notice_idx
  on public.billing_notices (account_actor_id, notice_type, event_ref, recorded_at desc)
  where invoice_number is null;

comment on table public.billing_notices is
  'UJ-CRM-001B / UJ-ADM-001: local billing, overdue, suspension, and reinstatement notice evidence. Production outbound delivery remains unconfirmed.';
