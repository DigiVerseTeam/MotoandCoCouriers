-- Account activation notice records for UJ-CRM-001A.
-- This keeps activation communication as a local outbox record until the
-- production email/SMS/in-app provider is confirmed.

alter table public.operational_notices
  alter column order_local_id drop not null;

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
    'supplier_setup_requested',
    'account_activated'
  ));

comment on column public.operational_notices.order_local_id is
  'Optional local work item reference. Account-level notices such as activation may be stored without an order.';
