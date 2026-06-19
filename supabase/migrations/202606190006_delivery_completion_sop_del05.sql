-- SOP-DEL-05 Delivery Completion.
-- Source rules:
-- - Driver captures receiver name + signature in delivery_proof.
-- - Delivered status is written by the system after proof insert.
-- - Delivery proof is immutable after completion.
-- - Delivered proof-backed jobs become available to billing compilation.

alter table public.deliveries
  add column if not exists billing_ready boolean not null default false,
  add column if not exists billing_ready_at timestamptz,
  add column if not exists delivery_completion_source text;

create or replace function public.enforce_sop_del05_delivered_source()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'delivered'
     and old.status is distinct from 'delivered'
     and current_setting('app.sop_del05_completion', true) is distinct from 'on' then
    raise exception 'SOP-DEL-05: Delivered status is system-written after delivery_proof insert';
  end if;
  return new;
end;
$$;

drop trigger if exists deliveries_sop_del05_status_source on public.deliveries;
create trigger deliveries_sop_del05_status_source
before update of status on public.deliveries
for each row execute function public.enforce_sop_del05_delivered_source();

create or replace function public.complete_delivery_from_proof()
returns trigger
language plpgsql
as $$
declare
  completed_at timestamptz := coalesce(new.captured_at, now());
begin
  perform set_config('app.sop_del05_completion', 'on', true);

  update public.deliveries
  set status = 'delivered',
      delivered_at = completed_at,
      billing_ready = true,
      billing_ready_at = completed_at,
      delivery_completion_source = 'SOP-DEL-05 delivery_proof insert'
  where id = new.delivery_id;

  update public.pickup_requests pr
  set status = 'delivered'
  from public.deliveries d
  where d.id = new.delivery_id
    and pr.id = d.pickup_request_id;

  return new;
end;
$$;

drop trigger if exists delivery_proof_complete_delivery on public.delivery_proof;
create trigger delivery_proof_complete_delivery
after insert on public.delivery_proof
for each row execute function public.complete_delivery_from_proof();

comment on trigger delivery_proof_complete_delivery on public.delivery_proof is
  'SOP-DEL-05: proof insert system-completes delivery and marks it billing-ready.';

comment on column public.deliveries.billing_ready is
  'SOP-DEL-05: proof-backed delivered job is visible to billing compilation.';

comment on column public.deliveries.delivery_completion_source is
  'SOP-DEL-05 source marker for system-written Delivered status.';
