-- Pickup request retention queueing for Policy #5 / SOP-REQ-01.
--
-- Source-backed intent:
-- - Pickup request records are retained for 7 years from run date.
-- - Requested date and actual run date evidence must stay available for audit,
--   billing dispute review, and Admin investigation.
-- - Destruction execution remains blocked until Privacy Owner approval rules are
--   confirmed.

create unique index if not exists retention_queue_record_unique_idx
  on public.retention_queue (table_name, record_id);

create or replace function public.queue_pickup_request_retention()
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

drop trigger if exists pickup_requests_retention_queue on public.pickup_requests;
create trigger pickup_requests_retention_queue
after insert or update of actual_run_date
on public.pickup_requests
for each row execute function public.queue_pickup_request_retention();

comment on trigger pickup_requests_retention_queue on public.pickup_requests is
  'Policy #5 / SOP-REQ-01: queue pickup request records for 7-year retention review from actual run date.';
