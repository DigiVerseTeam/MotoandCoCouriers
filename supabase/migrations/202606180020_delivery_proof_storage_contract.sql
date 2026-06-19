-- POD private storage contract and Policy #5 retention queueing.
--
-- Source-backed intent:
-- - Receiver name and signature are mandatory before Delivered.
-- - Signature evidence lives in a private Supabase Storage bucket.
-- - delivery_proof.signature_path stores the private object path.
-- - Delivery proof is retained for 7 years from delivery date.
--
-- This defines the production path convention for release-one proof assets:
--   deliveries/{delivery_id}/signature.{ext}
--
-- Live upload transport, signed upload RPCs, device assumptions, and deletion
-- approval remain production decisions.

insert into storage.buckets (id, name, public)
values ('delivery-proof', 'delivery-proof', false)
on conflict (id) do update set public = false;

create or replace function public.delivery_proof_object_delivery_id(object_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  delivery_id_text text;
begin
  if object_name is null
    or object_name !~ '^deliveries/[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{4}-[0-9a-fA-F-]{12}/[^/]+$'
  then
    return null;
  end if;

  delivery_id_text := split_part(object_name, '/', 2);
  return delivery_id_text::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.enforce_delivery_proof_signature_path()
returns trigger
language plpgsql
as $$
begin
  if public.delivery_proof_object_delivery_id(new.signature_path) is distinct from new.delivery_id then
    raise exception 'delivery_proof.signature_path must use deliveries/{delivery_id}/... in the private delivery-proof bucket';
  end if;

  return new;
end;
$$;

drop trigger if exists delivery_proof_signature_path_guard on public.delivery_proof;
create trigger delivery_proof_signature_path_guard
before insert on public.delivery_proof
for each row execute function public.enforce_delivery_proof_signature_path();

create unique index if not exists retention_queue_record_unique_idx
  on public.retention_queue (table_name, record_id);

create or replace function public.queue_delivery_proof_retention()
returns trigger
language plpgsql
as $$
begin
  insert into public.retention_queue (
    table_name,
    record_id,
    retention_until,
    status
  )
  values (
    'delivery_proof',
    new.id,
    new.retention_until,
    'pending_privacy_owner_approval'
  )
  on conflict (table_name, record_id) do update
  set retention_until = excluded.retention_until;

  return new;
end;
$$;

drop trigger if exists delivery_proof_retention_queue on public.delivery_proof;
create trigger delivery_proof_retention_queue
after insert on public.delivery_proof
for each row execute function public.queue_delivery_proof_retention();

drop policy if exists delivery_proof_driver_insert_assigned on public.delivery_proof;
create policy delivery_proof_driver_insert_assigned
on public.delivery_proof for insert to authenticated
with check (
  public.delivery_proof_object_delivery_id(signature_path) = delivery_id
  and (
    public.is_admin()
    or (
      captured_by = auth.uid()
      and public.driver_can_access_delivery(delivery_id)
    )
  )
);

-- Drivers can upload only to proof paths for deliveries assigned to their run.
-- Admin can upload when correcting controlled operational evidence. No update
-- or delete storage policy is added because proof assets remain immutable until
-- a Privacy Owner-approved destruction workflow is confirmed.
drop policy if exists delivery_proof_objects_driver_insert_assigned on storage.objects;
create policy delivery_proof_objects_driver_insert_assigned
on storage.objects for insert to authenticated
with check (
  bucket_id = 'delivery-proof'
  and public.delivery_proof_object_delivery_id(name) is not null
  and public.can_access_delivery(public.delivery_proof_object_delivery_id(name))
  and (
    public.is_admin()
    or (
      public.has_active_app_role('driver')
      and public.driver_can_access_delivery(public.delivery_proof_object_delivery_id(name))
    )
  )
);

drop policy if exists delivery_proof_objects_read_by_linked_role on storage.objects;
create policy delivery_proof_objects_read_by_linked_role
on storage.objects for select to authenticated
using (
  bucket_id = 'delivery-proof'
  and (
    exists (
      select 1
      from public.delivery_proof dp
      where dp.signature_path = storage.objects.name
        and public.can_access_delivery(dp.delivery_id)
    )
    or (
      public.is_admin()
      and public.can_access_delivery(public.delivery_proof_object_delivery_id(storage.objects.name))
    )
    or (
      public.has_active_app_role('driver')
      and public.driver_can_access_delivery(public.delivery_proof_object_delivery_id(storage.objects.name))
    )
  )
);

comment on function public.delivery_proof_object_delivery_id(text) is
  'Parses release-one private POD object paths: deliveries/{delivery_id}/signature.ext.';

comment on trigger delivery_proof_retention_queue on public.delivery_proof is
  'Policy #5: queue immutable POD proof for 7-year retention review from captured delivery date.';
