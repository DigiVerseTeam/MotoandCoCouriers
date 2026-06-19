-- Operational notice type alignment for local account and billing-query records.
--
-- Runtime workflows now create local records for account suspension,
-- account reinstatement, and billing-query acknowledgement. These remain
-- local outbox/evidence records only; no production email/SMS/in-app provider
-- is implied.

alter table public.operational_notices
  drop constraint if exists operational_notices_notice_type_check;

alter table public.operational_notices
  add constraint operational_notices_notice_type_check
  check (notice_type in (
    'pickup_request_submitted',
    'schedule_adjusted',
    'pickup_confirmed',
    'out_for_delivery',
    'delivered',
    'failed_delivery',
    'no_pickup',
    'bring_forward',
    'dispute_received',
    'billing_query_received',
    'supplier_setup_requested',
    'account_activated',
    'account_suspended',
    'account_reinstated'
  ));

comment on constraint operational_notices_notice_type_check on public.operational_notices is
  'Local operational/customer outbox types for UJ-CRM-001A, UJ-CRM-001B, and UJ-ADM-001. Production delivery provider remains unconfirmed.';
