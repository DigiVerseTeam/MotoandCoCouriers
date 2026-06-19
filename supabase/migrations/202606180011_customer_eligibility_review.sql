-- Customer activation eligibility review for UJ-CRM-001A.
-- Source: release-one-source-map registration and activation rules.
-- Exact public geography wording and final RLS remain open.

alter table public.actors
  add column if not exists b2b_confirmed boolean not null default false,
  add column if not exists seq_service_area_confirmed boolean not null default false,
  add column if not exists physical_delivery_address_confirmed boolean not null default false,
  add column if not exists activation_eligibility_reviewed_at timestamptz,
  add column if not exists activation_eligibility_reviewed_by uuid references public.profiles(id),
  add column if not exists activation_eligibility_note text;

alter table public.actors
  drop constraint if exists actors_delivery_address_no_po_box;

alter table public.actors
  add constraint actors_delivery_address_no_po_box
  check (
    delivery_address is null
    or delivery_address !~* '(^|[^[:alpha:]])(p[.]?[[:space:]]*o[.]?|post[[:space:]]+office)[[:space:]]*box([^[:alpha:]]|$)'
  );

comment on column public.actors.seq_service_area_confirmed is
  'Admin confirmation that the customer/workshop delivery address is inside the SEQ service area.';

comment on column public.actors.activation_eligibility_reviewed_at is
  'Admin activation eligibility review timestamp for B2B, SEQ service area, physical address, contacts, and approved supplier.';
