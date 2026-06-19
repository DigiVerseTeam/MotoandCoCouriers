-- Notification failure exception routing for APP-ADM-005.
--
-- Source-backed intent:
-- - Admin is alerted if a customer notification fails.
-- - Production notification provider/channel is still unconfirmed.
-- - provider_not_configured is a deployment gap, not a failed delivery event.
--
-- These triggers only queue exceptions when a notice record is explicitly marked
-- failed by future delivery-provider wiring or imported provider evidence.

alter table public.exceptions
  add column if not exists source_table text,
  add column if not exists source_record_id uuid;

create index if not exists exceptions_notification_source_idx
  on public.exceptions (source_table, source_record_id)
  where source = 'notification_delivery';

create or replace function public.queue_notification_failure_exception(
  notice_table text,
  notice_id uuid,
  failure_summary text,
  failure_detail text
)
returns void
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.exceptions
    where source = 'notification_delivery'
      and source_table = notice_table
      and source_record_id = notice_id
      and status <> 'resolved'
  ) then
    return;
  end if;

  insert into public.exceptions (
    source,
    severity,
    status,
    summary,
    detail,
    source_table,
    source_record_id
  )
  values (
    'notification_delivery',
    'high',
    'open',
    failure_summary,
    failure_detail,
    notice_table,
    notice_id
  );
end;
$$;

create or replace function public.operational_notice_failure_exception()
returns trigger
language plpgsql
as $$
begin
  if lower(coalesce(new.external_delivery_status, '')) = 'failed' then
    perform public.queue_notification_failure_exception(
      'operational_notices',
      new.id,
      'Operational notification failed',
      concat_ws(
        ' | ',
        'notice_type=' || new.notice_type,
        'account_actor_id=' || coalesce(new.account_actor_id::text, ''),
        'client_local_id=' || coalesce(new.client_local_id, ''),
        'order_local_id=' || coalesce(new.order_local_id, ''),
        'subject=' || new.subject,
        'policy=UJ-CRM-001A / APP-ADM-005'
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists operational_notices_failure_exception on public.operational_notices;
create trigger operational_notices_failure_exception
after insert or update of external_delivery_status
on public.operational_notices
for each row execute function public.operational_notice_failure_exception();

create or replace function public.billing_notice_failure_exception()
returns trigger
language plpgsql
as $$
begin
  if lower(coalesce(new.status, '')) = 'failed'
     or lower(coalesce(new.external_delivery_status, '')) = 'failed' then
    perform public.queue_notification_failure_exception(
      'billing_notices',
      new.id,
      'Billing notification failed',
      concat_ws(
        ' | ',
        'notice_type=' || new.notice_type,
        'invoice_number=' || new.invoice_number,
        'account_actor_id=' || new.account_actor_id::text,
        'billing_email=' || new.billing_email,
        'policy=UJ-CRM-001B / APP-ADM-005'
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists billing_notices_failure_exception on public.billing_notices;
create trigger billing_notices_failure_exception
after insert or update of status, external_delivery_status
on public.billing_notices
for each row execute function public.billing_notice_failure_exception();

comment on trigger operational_notices_failure_exception on public.operational_notices is
  'APP-ADM-005: failed operational notice delivery queues an Admin exception.';

comment on trigger billing_notices_failure_exception on public.billing_notices is
  'APP-ADM-005: failed billing notice delivery queues an Admin exception.';
