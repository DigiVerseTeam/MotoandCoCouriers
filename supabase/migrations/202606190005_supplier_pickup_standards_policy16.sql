-- Policy #16 vendor pickup standards guardrails.
--
-- Confirmed source rules:
-- - All goods must be ready at the supplier dock by 10:00am on the scheduled
--   run date.
-- - Goods must be labelled with customer name and con note reference.
-- - Packaging must be appropriate for item type.
-- - Driver grace period at supplier dock is maximum 10 minutes.
-- - No Pickup is recorded per customer in APP-DRV-002 and must never create a
--   billable item row for that customer.
-- - No Pickup patterns and packaging refusals feed Admin supplier health review.

alter table public.pickup_requests
  add column if not exists pickup_ready_by_10_confirmed boolean not null default false,
  add column if not exists pickup_labelled_confirmed boolean not null default false,
  add column if not exists pickup_packaging_confirmed boolean not null default false,
  add column if not exists pickup_grace_minutes integer
    check (pickup_grace_minutes is null or pickup_grace_minutes between 0 and 10),
  add column if not exists pickup_no_pickup_category text
    check (
      pickup_no_pickup_category is null
      or pickup_no_pickup_category in ('not_ready_after_grace', 'unlabelled', 'improper_packaging')
    ),
  add column if not exists pickup_compliance_note text,
  add column if not exists pickup_standards_policy_ref text;

comment on column public.pickup_requests.pickup_ready_by_10_confirmed is
  'Policy #16: goods ready at supplier dock by 10:00am before pickup can be confirmed.';

comment on column public.pickup_requests.pickup_labelled_confirmed is
  'Policy #16: goods labelled with customer name and con note reference before collection.';

comment on column public.pickup_requests.pickup_packaging_confirmed is
  'Policy #16: packaging appropriate for item type before collection.';

comment on column public.pickup_requests.pickup_grace_minutes is
  'Policy #16: supplier dock grace period, maximum 10 minutes.';

comment on column public.pickup_requests.pickup_no_pickup_category is
  'Policy #16 APP-DRV-002 No Pickup category used for supplier health monitoring and no-billing evidence.';
