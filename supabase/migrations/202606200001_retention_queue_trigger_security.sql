-- Policy #5 retention queue trigger hardening.
--
-- Live actor testing showed Client Ops booking inserts were correctly allowed by
-- pickup request RLS, but the system retention queue side-effect was blocked by
-- retention_queue RLS. These queue writes are internal workflow evidence, not
-- direct user access to retention records, so the trigger functions run as
-- SECURITY DEFINER while the table's user-facing policies stay Admin-only.

create or replace function public.queue_pickup_request_retention()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.retention_queue (
    table_name,
    record_id,
    retention_until,
    status
  )
  values (
    'pickup_requests',
    new.id,
    (new.actual_run_date + interval '7 years')::date,
    'pending_privacy_owner_approval'
  )
  on conflict (table_name, record_id) do update
  set retention_until = excluded.retention_until;

  return new;
end;
$$;

create or replace function public.queue_delivery_proof_retention()
returns trigger
language plpgsql
security definer
set search_path = public
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

create or replace function public.queue_supplier_actor_retention()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.actor_type <> 'supplier' or new.relationship_status <> 'closed' then
    return new;
  end if;

  insert into public.retention_queue (
    table_name,
    record_id,
    retention_until,
    status
  )
  values (
    'actors',
    new.id,
    (coalesce(new.last_engagement_date, new.updated_at::date, now()::date) + interval '7 years')::date,
    'pending_privacy_owner_approval'
  )
  on conflict (table_name, record_id) do update
  set retention_until = excluded.retention_until;

  return new;
end;
$$;

create or replace function public.queue_master_data_change_retention()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.retention_queue (
    table_name,
    record_id,
    retention_until,
    status
  )
  values (
    'master_data_changes',
    new.id,
    (new.logged_at::date + interval '7 years')::date,
    'pending_privacy_owner_approval'
  )
  on conflict (table_name, record_id) do update
  set retention_until = excluded.retention_until;

  return new;
end;
$$;

create or replace function public.queue_policy24_financial_reconciliation_retention()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and new.completed_at is not null then
    insert into public.retention_queue (
      table_name,
      record_id,
      retention_until,
      status
    )
    values (
      'financial_reconciliations',
      new.id,
      new.retained_until,
      'pending_privacy_owner_approval'
    )
    on conflict (table_name, record_id) do nothing;
  end if;
  return new;
end;
$$;
