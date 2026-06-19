-- Supplier and master-data retention queueing for Policy #5 / SOP-MDM-01.
--
-- Source-backed intent:
-- - Supplier records are retained for the duration of the supplier relationship
--   plus 7 years.
-- - Master data change log rows are retained for 7 years from change date.
-- - Destruction execution remains blocked until Privacy Owner approval rules are
--   confirmed.

create unique index if not exists retention_queue_record_unique_idx
  on public.retention_queue (table_name, record_id);

create or replace function public.queue_supplier_actor_retention()
returns trigger
language plpgsql
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

drop trigger if exists supplier_actor_retention_queue on public.actors;
create trigger supplier_actor_retention_queue
after insert or update of actor_type, relationship_status, last_engagement_date, updated_at
on public.actors
for each row execute function public.queue_supplier_actor_retention();

create or replace function public.queue_master_data_change_retention()
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

drop trigger if exists master_data_changes_retention_queue on public.master_data_changes;
create trigger master_data_changes_retention_queue
after insert or update of logged_at
on public.master_data_changes
for each row execute function public.queue_master_data_change_retention();

comment on trigger supplier_actor_retention_queue on public.actors is
  'Policy #5 / SOP-MDM-01: queue closed supplier relationship records for 7-year retention review from relationship end.';

comment on trigger master_data_changes_retention_queue on public.master_data_changes is
  'Policy #5 / SOP-MDM-01/SOP-MDM-02: queue master data change logs for 7-year retention review from logged change date.';
