-- SOP-DEL-01 Delivery Stop Grouping.
-- Source rules:
-- - Delivery stops are grouped by client account and delivery address.
-- - One receiver name and signature covers all work items at that delivery location.
-- - Driver reviews the grouped stop list before the delivery phase begins.
-- - Grouped proof completion must still be proof-driven by SOP-DEL-05.

create table if not exists public.delivery_stop_groups (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  account_actor_id uuid not null references public.actors(id) on delete restrict,
  delivery_address text not null,
  delivery_stop_key text not null,
  status text not null default 'assigned' check (status in ('assigned', 'out_for_delivery', 'delivered', 'failed', 'exception')),
  reviewed_by_driver_at timestamptz,
  created_at timestamptz not null default now(),
  unique (run_id, account_actor_id, delivery_stop_key)
);

alter table public.deliveries
  add column if not exists delivery_stop_group_id uuid references public.delivery_stop_groups(id) on delete set null,
  add column if not exists delivery_stop_key text,
  add column if not exists delivery_group_sequence integer;

alter table public.delivery_proof
  add column if not exists delivery_stop_group_id uuid references public.delivery_stop_groups(id) on delete restrict,
  add column if not exists grouped_delivery_count integer not null default 1 check (grouped_delivery_count > 0);

create index if not exists delivery_stop_groups_run_sequence_idx
  on public.delivery_stop_groups (run_id, delivery_stop_key);

create index if not exists deliveries_stop_group_idx
  on public.deliveries (delivery_stop_group_id, status);

create unique index if not exists delivery_proof_one_per_delivery_stop_group
  on public.delivery_proof (delivery_stop_group_id)
  where delivery_stop_group_id is not null;

create or replace function public.complete_delivery_from_proof()
returns trigger
language plpgsql
as $$
declare
  completed_at timestamptz := coalesce(new.captured_at, now());
begin
  perform set_config('app.sop_del05_completion', 'on', true);

  if new.delivery_stop_group_id is not null then
    update public.deliveries
    set status = 'delivered',
        delivered_at = completed_at,
        billing_ready = true,
        billing_ready_at = completed_at,
        delivery_completion_source = 'SOP-DEL-01 grouped stop / SOP-DEL-05 delivery_proof insert'
    where delivery_stop_group_id = new.delivery_stop_group_id;

    update public.pickup_requests pr
    set status = 'delivered'
    from public.deliveries d
    where d.delivery_stop_group_id = new.delivery_stop_group_id
      and pr.id = d.pickup_request_id;

    update public.delivery_stop_groups
    set status = 'delivered'
    where id = new.delivery_stop_group_id;
  else
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
  end if;

  return new;
end;
$$;

alter table public.delivery_stop_groups enable row level security;

drop policy if exists delivery_stop_groups_select_by_role_scope on public.delivery_stop_groups;
create policy delivery_stop_groups_select_by_role_scope
on public.delivery_stop_groups for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.deliveries d
    where d.delivery_stop_group_id = delivery_stop_groups.id
      and public.can_access_delivery(d.id)
  )
);

drop policy if exists delivery_stop_groups_admin_write on public.delivery_stop_groups;
create policy delivery_stop_groups_admin_write
on public.delivery_stop_groups for all to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.delivery_stop_groups is
  'SOP-DEL-01 grouped delivery stop: one client account + delivery address within a compiled run.';

comment on column public.delivery_proof.delivery_stop_group_id is
  'SOP-DEL-01: when present, one receiver name/signature completes every delivery in the grouped stop.';

comment on column public.delivery_proof.grouped_delivery_count is
  'Count of delivery records covered by the SOP-DEL-01 one-signature grouped proof.';

comment on function public.complete_delivery_from_proof() is
  'SOP-DEL-05 proof-driven completion, extended for SOP-DEL-01 grouped delivery stops.';
