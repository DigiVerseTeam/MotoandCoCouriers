-- Policy #15 / POL-OPS-015 goods acceptance guardrails.
--
-- Source-backed rules:
-- - Goods must be labelled and packaged for item type before acceptance.
-- - Tyres must be upright or stacked, secured, not loose, and not presented
--   flat or rolling freely.
-- - Batteries require correct hazardous-goods containment.
-- - Parts/accessories must be boxed or bagged, labelled, and contained together.
-- - Driver must not accept goods under protest or with a note to follow up
--   later; the dock decision is final for that run.
-- - Refused goods are APP-DRV-002 No Pickup outcomes and never create a
--   billable row.

alter table public.pickup_requests
  add column if not exists goods_acceptance_confirmed boolean not null default false,
  add column if not exists goods_acceptance_final_decision boolean not null default false,
  add column if not exists goods_acceptance_refused boolean not null default false,
  add column if not exists goods_acceptance_policy_ref text;

alter table public.pickup_requests
  drop constraint if exists pickup_requests_policy15_picked_up_acceptance_check;

alter table public.pickup_requests
  add constraint pickup_requests_policy15_picked_up_acceptance_check
  check (
    status <> 'picked_up'
    or (
      pickup_labelled_confirmed = true
      and pickup_packaging_confirmed = true
      and goods_acceptance_confirmed = true
      and goods_acceptance_final_decision = true
      and coalesce(goods_acceptance_refused, false) = false
    )
  ) not valid;

alter table public.pickup_requests
  drop constraint if exists pickup_requests_policy15_no_pickup_acceptance_check;

alter table public.pickup_requests
  add constraint pickup_requests_policy15_no_pickup_acceptance_check
  check (
    status <> 'no_pickup'
    or (
      goods_acceptance_final_decision = true
      and coalesce(goods_acceptance_refused, false) = true
      and coalesce(billable, false) = false
    )
  ) not valid;

comment on column public.pickup_requests.goods_acceptance_confirmed is
  'Policy #15: item-specific goods acceptance confirmed before driver accepts goods onto the milk run.';

comment on column public.pickup_requests.goods_acceptance_final_decision is
  'Policy #15: dock decision is final for the run; goods are not accepted under protest or pending later follow-up.';

comment on column public.pickup_requests.goods_acceptance_refused is
  'Policy #15: refused goods recorded as APP-DRV-002 No Pickup with no billable row.';

comment on column public.pickup_requests.goods_acceptance_policy_ref is
  'Policy #15 / POL-OPS-015 source reference for accepted or refused goods evidence.';
