-- Policy #14 order cancellation guardrails and local notice types.
--
-- Confirmed source rules:
-- - Client self-service cancellation is allowed only before the 12:30pm
--   Brisbane cut-off on the day before the scheduled run date.
-- - Post-cut-off cancellation is an Admin judgement request.
-- - Once goods are collected, the order cannot be cancelled; refusal follows
--   Failed Delivery handling.
-- - Cancelled orders before goods collection do not create a billable record.

alter table public.pickup_requests
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.profiles(id),
  add column if not exists cancellation_reason text,
  add column if not exists cancellation_policy_ref text,
  add column if not exists cancellation_cutoff_date date,
  add column if not exists billable boolean not null default true;

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
    'order_cancelled',
    'cancellation_requested',
    'dispute_received',
    'billing_query_received',
    'supplier_setup_requested',
    'account_activated',
    'account_suspended',
    'account_reinstated'
  ));

comment on column public.pickup_requests.cancellation_reason is
  'Policy #14 evidence: client self-service reason or Admin cancellation judgement before goods collected.';

comment on column public.pickup_requests.cancellation_cutoff_date is
  'Policy #14 cut-off date: day before the scheduled run date, with 12:30pm Brisbane time enforced in application workflow.';

comment on column public.pickup_requests.billable is
  'Policy #14: cancelled orders before goods collection are not billable.';

comment on constraint operational_notices_notice_type_check on public.operational_notices is
  'Local operational/customer outbox types including Policy #14 cancellation records. Production delivery provider remains unconfirmed.';
