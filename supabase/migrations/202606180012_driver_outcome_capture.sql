-- Moto and Co Couriers driver outcome capture extension.
-- Source-backed areas:
-- - UJ-DRV-001 Supplier Stop / No Pickup / Bring Forward / Failed Delivery screens
-- - APP-ADM-005 exception queue routing
--
-- This migration stores the local driver outcome evidence without finalising the
-- production reason-code taxonomy or offline retry rules. Policy #8 redelivery
-- attempt and fee-review guardrails are extended in 202606190004.

alter table public.pickup_requests
  add column if not exists driver_outcome text
    check (driver_outcome is null or driver_outcome in ('no_pickup', 'brought_forward', 'failed_delivery')),
  add column if not exists driver_outcome_reason text,
  add column if not exists driver_outcome_note text,
  add column if not exists driver_outcome_at timestamptz,
  add column if not exists bring_forward_requested_run_date date;

alter table public.pickup_requests
  drop constraint if exists pickup_requests_driver_outcome_reason_check;

alter table public.pickup_requests
  add constraint pickup_requests_driver_outcome_reason_check
  check (
    driver_outcome is null
    or length(trim(coalesce(driver_outcome_reason, ''))) > 0
  );

alter table public.pickup_requests
  drop constraint if exists pickup_requests_bring_forward_date_check;

alter table public.pickup_requests
  add constraint pickup_requests_bring_forward_date_check
  check (
    driver_outcome is distinct from 'brought_forward'
    or bring_forward_requested_run_date is not null
  );

alter table public.pickups
  add column if not exists outcome_reason text,
  add column if not exists outcome_note text,
  add column if not exists outcome_at timestamptz,
  add column if not exists bring_forward_requested_run_date date;

alter table public.pickups
  drop constraint if exists pickups_outcome_reason_check;

alter table public.pickups
  add constraint pickups_outcome_reason_check
  check (
    status not in ('no_pickup', 'brought_forward')
    or length(trim(coalesce(outcome_reason, ''))) > 0
  );

alter table public.pickups
  drop constraint if exists pickups_bring_forward_date_check;

alter table public.pickups
  add constraint pickups_bring_forward_date_check
  check (
    status is distinct from 'brought_forward'
    or bring_forward_requested_run_date is not null
  );

alter table public.deliveries
  add column if not exists failed_at timestamptz,
  add column if not exists failed_by uuid references public.profiles(id);

alter table public.deliveries
  drop constraint if exists deliveries_failed_reason_check;

alter table public.deliveries
  add constraint deliveries_failed_reason_check
  check (
    status <> 'failed'
    or length(trim(coalesce(failed_reason, ''))) > 0
  );
