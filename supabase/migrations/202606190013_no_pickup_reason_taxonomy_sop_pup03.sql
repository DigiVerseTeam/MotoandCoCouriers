-- SOP-PUP-03 No Pickup reason taxonomy extension.
--
-- Source-backed intent:
-- - Valid release-one No Pickup reasons include goods not ready after the
--   10-minute grace period, unlabelled/con-note mismatch, improperly
--   packaged goods, supplier refusal, and wrong items presented.
-- - This does not finalise Bring Forward, Failed Delivery, offline retry,
--   retained-goods, or wrong-address production reason codes.

alter table public.pickup_requests
  drop constraint if exists pickup_requests_pickup_no_pickup_category_check;

alter table public.pickup_requests
  add constraint pickup_requests_pickup_no_pickup_category_check
  check (
    pickup_no_pickup_category is null
    or pickup_no_pickup_category in (
      'not_ready_after_grace',
      'unlabelled',
      'improper_packaging',
      'supplier_refused',
      'wrong_items'
    )
  );

comment on constraint pickup_requests_pickup_no_pickup_category_check on public.pickup_requests is
  'SOP-PUP-03 / Policy #16 No Pickup reason taxonomy for APP-DRV-002 no-billing evidence.';
