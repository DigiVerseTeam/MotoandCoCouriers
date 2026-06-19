-- SOP-RUN-04 Bring Future Pickup Into Today.
--
-- Source-backed intent:
-- - Bring-forward is only for future goods collected early because the
--   supplier is already on today's planned route.
-- - Driver must not make an unscheduled detour.
-- - Outcome is distinct from standard Picked Up.
-- - Pickup date is today; intended delivery run date remains the original
--   future run date.
-- - Item type and quantity are recorded as normal so billing is not confused.

alter table public.pickup_requests
  add column if not exists bring_forward_flag boolean not null default false,
  add column if not exists bring_forward_collected_date date,
  add column if not exists bring_forward_intended_run_date date,
  add column if not exists bring_forward_no_detour_confirmed boolean not null default false,
  add column if not exists bring_forward_acceptance_confirmed boolean not null default false;

alter table public.pickup_requests
  drop constraint if exists pickup_requests_bring_forward_date_check;

alter table public.pickup_requests
  add constraint pickup_requests_bring_forward_sop_run04_check
  check (
    driver_outcome is distinct from 'brought_forward'
    or (
      bring_forward_flag = true
      and bring_forward_collected_date is not null
      and bring_forward_intended_run_date is not null
      and bring_forward_intended_run_date >= bring_forward_collected_date
      and bring_forward_no_detour_confirmed = true
      and bring_forward_acceptance_confirmed = true
    )
  );

alter table public.pickups
  add column if not exists bring_forward_flag boolean not null default false,
  add column if not exists bring_forward_collected_date date,
  add column if not exists bring_forward_intended_run_date date,
  add column if not exists bring_forward_no_detour_confirmed boolean not null default false,
  add column if not exists bring_forward_acceptance_confirmed boolean not null default false;

alter table public.pickups
  drop constraint if exists pickups_bring_forward_date_check;

alter table public.pickups
  add constraint pickups_bring_forward_sop_run04_check
  check (
    status is distinct from 'brought_forward'
    or (
      bring_forward_flag = true
      and bring_forward_collected_date is not null
      and bring_forward_intended_run_date is not null
      and bring_forward_intended_run_date >= bring_forward_collected_date
      and bring_forward_no_detour_confirmed = true
      and bring_forward_acceptance_confirmed = true
    )
  );

comment on column public.pickup_requests.bring_forward_collected_date is
  'SOP-RUN-04 date the future pickup was collected early while supplier was already on the planned route.';

comment on column public.pickup_requests.bring_forward_intended_run_date is
  'Original intended delivery run date retained after early collection; this is not a requested postponement date.';

comment on constraint pickup_requests_bring_forward_sop_run04_check on public.pickup_requests is
  'SOP-RUN-04 guardrail: bring-forward requires early collection date, original intended run date, no-detour confirmation, and acceptance-standard confirmation.';
