-- Policy #8 failed delivery and redelivery fee guardrails.
--
-- Confirmed source rules:
-- - Every failed delivery attempt is recorded in APP-DRV-003 with timestamp,
--   reason, and driver identifier.
-- - Maximum delivery attempts per consignment is 2.
-- - No redelivery fee is applied after the first failed attempt.
-- - After the second failed attempt, goods return to the originating supplier
--   on the next scheduled milk run.
-- - APP-ADM-004 generates a $10 flat redelivery fee only after Admin reviews
--   both failed-delivery records; Admin may waive the fee with a recorded reason.

alter table public.pickup_requests
  add column if not exists failed_delivery_attempt_count integer not null default 0
    check (failed_delivery_attempt_count between 0 and 2),
  add column if not exists failed_delivery_attempts jsonb not null default '[]'::jsonb,
  add column if not exists failed_delivery_policy_ref text,
  add column if not exists redelivery_attempt_number integer
    check (redelivery_attempt_number is null or redelivery_attempt_number between 1 and 2),
  add column if not exists second_attempt_authorised_at timestamptz,
  add column if not exists return_to_supplier_required boolean not null default false,
  add column if not exists return_to_supplier_status text,
  add column if not exists redelivery_fee_status text
    check (redelivery_fee_status is null or redelivery_fee_status in ('Not Applicable', 'Pending Admin Review', 'Approved', 'Waived')),
  add column if not exists redelivery_fee_amount numeric(10,2),
  add column if not exists redelivery_fee_rule_id text,
  add column if not exists redelivery_fee_policy_ref text,
  add column if not exists redelivery_fee_reviewed_at timestamptz,
  add column if not exists redelivery_fee_reviewed_by uuid references public.profiles(id),
  add column if not exists redelivery_fee_review_note text,
  add column if not exists redelivery_fee_waived_reason text,
  add column if not exists redelivery_invoice_id text,
  add column if not exists redelivery_fee_billed_at timestamptz;

comment on column public.pickup_requests.failed_delivery_attempt_count is
  'Policy #8: maximum two delivery attempts per consignment.';

comment on column public.pickup_requests.failed_delivery_attempts is
  'Policy #8 APP-DRV-003 evidence array containing failed-delivery timestamp, reason, and driver identifier for each attempt.';

comment on column public.pickup_requests.redelivery_fee_status is
  'Policy #8 / APP-ADM-004 Admin review status for the $10 redelivery fee after the second failed attempt.';

comment on column public.pickup_requests.return_to_supplier_status is
  'Policy #8 goods handling after failed attempts, including return to originating supplier on the next scheduled milk run after the second failed attempt.';
