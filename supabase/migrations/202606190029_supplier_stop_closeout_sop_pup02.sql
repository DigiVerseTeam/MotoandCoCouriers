-- SOP-PUP-02 Confirm Customer Pickup supplier-stop closeout evidence.
-- The driver records pickup outcomes per customer, then closes the supplier stop
-- only after the customer list, dock contact, no-ad-hoc-record, and leave-dock
-- completion standard have been recorded.

alter table public.pickup_requests
  add column if not exists supplier_stop_correct_dock_confirmed boolean not null default false,
  add column if not exists supplier_stop_customer_list_reviewed boolean not null default false,
  add column if not exists supplier_stop_no_adhoc_records boolean not null default false,
  add column if not exists supplier_stop_dock_contact_engaged boolean not null default false,
  add column if not exists supplier_stop_left_dock_confirmed boolean not null default false,
  add column if not exists supplier_stop_closed_at timestamptz,
  add column if not exists supplier_stop_closed_by uuid references public.profiles(id) on delete set null,
  add column if not exists supplier_stop_customer_count integer,
  add column if not exists supplier_stop_outcome_summary text,
  add column if not exists supplier_stop_closeout_note text,
  add column if not exists supplier_stop_policy_ref text;

alter table public.pickup_requests
  drop constraint if exists pickup_requests_sop_pup02_supplier_stop_closeout_check;

alter table public.pickup_requests
  add constraint pickup_requests_sop_pup02_supplier_stop_closeout_check
  check (
    supplier_stop_closed_at is null
    or (
      supplier_stop_correct_dock_confirmed
      and supplier_stop_customer_list_reviewed
      and supplier_stop_no_adhoc_records
      and supplier_stop_dock_contact_engaged
      and supplier_stop_left_dock_confirmed
      and coalesce(supplier_stop_customer_count, 0) > 0
      and nullif(trim(supplier_stop_outcome_summary), '') is not null
      and supplier_stop_policy_ref = 'SOP-PUP-02 / APP-DRV-002'
    )
  );

alter table public.pickup_requests
  drop constraint if exists pickup_requests_sop_pup02_delivered_requires_supplier_stop_closeout;

alter table public.pickup_requests
  add constraint pickup_requests_sop_pup02_delivered_requires_supplier_stop_closeout
  check (
    status <> 'delivered'
    or supplier_stop_closed_at is not null
  ) not valid;

create index if not exists pickup_requests_supplier_stop_closeout_idx
  on public.pickup_requests (actual_run_date, supplier_actor_id, supplier_stop_closed_at);

comment on column public.pickup_requests.supplier_stop_correct_dock_confirmed is
  'SOP-PUP-02 driver confirms the correct supplier dock before recording customer pickup outcomes.';

comment on column public.pickup_requests.supplier_stop_customer_list_reviewed is
  'SOP-PUP-02 driver reviews the per-customer pickup list; if missing or incorrect, Admin must be contacted rather than creating an ad-hoc dock record.';

comment on column public.pickup_requests.supplier_stop_no_adhoc_records is
  'SOP-PUP-02 evidence that no ad-hoc customer pickup record was created at the supplier dock.';

comment on column public.pickup_requests.supplier_stop_dock_contact_engaged is
  'SOP-PUP-02 supplier dock contact engagement evidence for every supplier visit.';

comment on column public.pickup_requests.supplier_stop_left_dock_confirmed is
  'SOP-PUP-02 driver leaves the supplier dock only after every customer has Picked Up, No Pickup, or Brought Forward outcome evidence.';

comment on column public.pickup_requests.supplier_stop_closed_at is
  'SOP-PUP-02 supplier-stop closeout timestamp after all customer outcomes for this supplier stop have been recorded.';

comment on column public.pickup_requests.supplier_stop_outcome_summary is
  'SOP-PUP-02 summary of per-customer outcomes for the supplier stop, for example Picked Up, No Pickup, and Brought Forward counts.';

comment on constraint pickup_requests_sop_pup02_supplier_stop_closeout_check on public.pickup_requests is
  'SOP-PUP-02 / APP-DRV-002 supplier-stop closeout evidence must include correct dock, customer list review, no ad-hoc records, dock contact engagement, leave-dock confirmation, customer count, and outcome summary.';

comment on constraint pickup_requests_sop_pup02_delivered_requires_supplier_stop_closeout on public.pickup_requests is
  'SOP-PUP-02 requires supplier-stop closeout evidence before work can reach delivered status.';
