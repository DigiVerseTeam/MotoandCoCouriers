-- SOP-DEL-04 Delivery Sign-Off Proof.
--
-- Confirmed source rules:
-- - Before POD capture, the driver confirms the physical address matches the registered delivery address.
-- - The driver confirms goods match the picked-up items for that client account.
-- - An authorised receiver must be present and goods must be handed over.
-- - Delivery price is read-only from pickup item data; driver cannot override it.
-- - Receiver full name and digital signature are mandatory, and the driver supervises signature capture.
-- - Failed Delivery uses the source-backed reason categories below; broader production reason-code governance remains open.

alter table public.delivery_proof
  add column if not exists signoff_address_confirmed boolean not null default false,
  add column if not exists signoff_goods_matched boolean not null default false,
  add column if not exists signoff_authorised_receiver_confirmed boolean not null default false,
  add column if not exists signoff_handover_confirmed boolean not null default false,
  add column if not exists signoff_price_reviewed boolean not null default false,
  add column if not exists signoff_device_supervised boolean not null default false,
  add column if not exists delivery_signoff_policy_ref text;

alter table public.pickup_requests
  add column if not exists failed_delivery_category text,
  add column if not exists failed_delivery_category_label text;

alter table public.delivery_proof
  drop constraint if exists delivery_proof_sop_del04_signoff_check;

alter table public.delivery_proof
  add constraint delivery_proof_sop_del04_signoff_check
  check (
    signoff_address_confirmed
    and signoff_goods_matched
    and signoff_authorised_receiver_confirmed
    and signoff_handover_confirmed
    and signoff_price_reviewed
    and signoff_device_supervised
    and coalesce(delivery_signoff_policy_ref, '') <> ''
  ) not valid;

alter table public.pickup_requests
  drop constraint if exists pickup_requests_sop_del04_failed_delivery_category_check;

alter table public.pickup_requests
  add constraint pickup_requests_sop_del04_failed_delivery_category_check
  check (
    status is distinct from 'failed_delivery'
    or failed_delivery_category in (
      'receiver_absent',
      'address_wrong_or_unconfirmed',
      'goods_not_confirmed_for_account',
      'delivery_refused',
      'receiver_name_refused',
      'receiver_signature_refused',
      'price_discrepancy'
    )
  ) not valid;

create index if not exists pickup_requests_sop_del04_failed_delivery_category_idx
  on public.pickup_requests (failed_delivery_category, actual_run_date)
  where status = 'failed_delivery';

comment on column public.delivery_proof.signoff_address_confirmed is
  'SOP-DEL-04: driver confirmed the physical address matched the registered delivery address before unloading.';

comment on column public.delivery_proof.signoff_goods_matched is
  'SOP-DEL-04: driver confirmed goods matched the picked-up items for the client account.';

comment on column public.delivery_proof.signoff_authorised_receiver_confirmed is
  'SOP-DEL-04: authorised receiver was present before handover.';

comment on column public.delivery_proof.signoff_handover_confirmed is
  'SOP-DEL-04: goods were handed over before POD capture.';

comment on column public.delivery_proof.signoff_price_reviewed is
  'SOP-DEL-04: driver reviewed read-only pickup-calculated delivery price; no driver override.';

comment on column public.delivery_proof.signoff_device_supervised is
  'SOP-DEL-04: driver kept the signature device in sight while the receiver signed.';

comment on column public.delivery_proof.delivery_signoff_policy_ref is
  'SOP-DEL-04 / APP-DRV-003 source marker for proof sign-off evidence.';

comment on constraint delivery_proof_sop_del04_signoff_check on public.delivery_proof is
  'SOP-DEL-04: new proof records must include all delivery sign-off confirmations before Delivered status can be completed.';

comment on column public.pickup_requests.failed_delivery_category is
  'SOP-DEL-04 controlled Failed Delivery category captured by APP-DRV-003.';

comment on column public.pickup_requests.failed_delivery_category_label is
  'Display label for the SOP-DEL-04 controlled Failed Delivery category captured by APP-DRV-003.';

comment on constraint pickup_requests_sop_del04_failed_delivery_category_check on public.pickup_requests is
  'SOP-DEL-04: failed_delivery work items must carry a source-backed Failed Delivery category.';
