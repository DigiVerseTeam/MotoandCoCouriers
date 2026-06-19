-- UJ-DRV-001 S5 Run Closed Confirmation.
--
-- Confirmed source rules:
-- - Driver can close the run only after every stop has a terminal outcome.
-- - The confirmation shows summary stats for pickups, deliveries, no-pickups, and failed deliveries.
-- - Any retained goods / second-attempt / return-to-supplier action items remain visible after close.
-- - Delivered jobs are available to billing compilation after proof-driven completion.

alter table public.run_closures
  add column if not exists picked_up_count integer not null default 0 check (picked_up_count >= 0),
  add column if not exists no_pickup_count integer not null default 0 check (no_pickup_count >= 0),
  add column if not exists failed_delivery_count integer not null default 0 check (failed_delivery_count >= 0),
  add column if not exists retained_goods_count integer not null default 0 check (retained_goods_count >= 0),
  add column if not exists second_attempt_required_count integer not null default 0 check (second_attempt_required_count >= 0),
  add column if not exists return_to_supplier_count integer not null default 0 check (return_to_supplier_count >= 0),
  add column if not exists action_items jsonb not null default '[]'::jsonb,
  add column if not exists run_close_policy_ref text;

alter table public.run_closures
  drop constraint if exists run_closures_uj_drv001_confirmation_check;

alter table public.run_closures
  add constraint run_closures_uj_drv001_confirmation_check
  check (
    open_stop_count = 0
    and retained_goods_count = second_attempt_required_count + return_to_supplier_count
    and jsonb_typeof(action_items) = 'array'
  ) not valid;

comment on column public.run_closures.picked_up_count is
  'UJ-DRV-001 S5.2: run closed confirmation pickup count shown to Driver.';

comment on column public.run_closures.no_pickup_count is
  'UJ-DRV-001 S5.2: run closed confirmation no-pickup count shown to Driver.';

comment on column public.run_closures.failed_delivery_count is
  'UJ-DRV-001 S5.2: run closed confirmation failed-delivery count shown to Driver.';

comment on column public.run_closures.retained_goods_count is
  'UJ-DRV-001 S5.2: count of retained-goods action items shown on run close.';

comment on column public.run_closures.second_attempt_required_count is
  'UJ-DRV-001 S5.2 / Policy #8: goods retained for a second delivery attempt.';

comment on column public.run_closures.return_to_supplier_count is
  'UJ-DRV-001 S5.2 / Policy #8: goods to return to originating supplier on the next scheduled milk run.';

comment on column public.run_closures.action_items is
  'UJ-DRV-001 S5.2: Driver-visible run-closed action items, such as retained goods or return-to-supplier follow-up.';

comment on column public.run_closures.run_close_policy_ref is
  'Source marker for UJ-DRV-001 S5 / SOP-DEL-05 run close confirmation.';

comment on constraint run_closures_uj_drv001_confirmation_check on public.run_closures is
  'UJ-DRV-001 S5: run close confirmation cannot be recorded with open stops and retained-goods counts must reconcile.';
