-- Policy #27 / POL-OPS-027 WHS / fatigue / driver wellbeing guardrails.
-- Source-backed active sections:
-- - Driver must not enter a supplier premises hazard area.
-- - WHS hazard at supplier premises is recorded as APP-DRV-002 No Pickup.
-- - Admin must raise the hazard with the supplier and must not require return
--   while a known WHS hazard remains unresolved.
-- - WHS incident/fatigue framework beyond core active obligations remains
--   conditional on driver pool expansion or an incident.

alter table public.pickup_requests
  add column if not exists whs_hazard_reported boolean not null default false,
  add column if not exists whs_hazard_status text,
  add column if not exists whs_policy_ref text;

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
      'wrong_items',
      'whs_hazard'
    )
  );

alter table public.pickup_requests
  drop constraint if exists pickup_requests_policy27_whs_hazard_check;

alter table public.pickup_requests
  add constraint pickup_requests_policy27_whs_hazard_check
  check (
    not whs_hazard_reported
    or (
      pickup_no_pickup_category = 'whs_hazard'
      and status = 'no_pickup'
      and length(btrim(coalesce(whs_hazard_status, ''))) > 0
      and coalesce(whs_policy_ref, '') like 'Policy #27%'
    )
  );

create index if not exists pickup_requests_whs_hazard_idx
on public.pickup_requests (whs_hazard_reported, actual_run_date)
where whs_hazard_reported = true;

comment on column public.pickup_requests.whs_hazard_reported is
  'Policy #27: driver reported a supplier-premises WHS hazard and did not enter the hazardous area.';

comment on column public.pickup_requests.whs_hazard_status is
  'Policy #27: Admin supplier follow-up / unresolved hazard status; driver return must not be required while unresolved.';

comment on constraint pickup_requests_pickup_no_pickup_category_check on public.pickup_requests is
  'SOP-PUP-03 / Policy #16 / Policy #27 No Pickup reason taxonomy for APP-DRV-002 no-billing evidence.';
