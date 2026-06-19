-- Local Day 8 overdue notice generation for UJ-CRM-001B / UJ-ADM-001.
--
-- Source-backed intent:
-- - Non-payment suspension requires overdue-notice evidence.
-- - Billing/Operational contacts need visibility of the overdue notice.
--
-- This migration creates local notice evidence only. It does not send email,
-- SMS, or in-app messages because the production notification provider and
-- channel remain unconfirmed.

alter table public.billing_notices
  add column if not exists system_generated boolean not null default false,
  add column if not exists generation_source text not null default 'admin_manual'
    check (generation_source in ('admin_manual', 'system_due_scan', 'invoice_status_trigger', 'scheduled_job'));

create or replace function public.generate_due_day8_overdue_notices(p_today date default current_date)
returns integer
language plpgsql
as $$
declare
  inserted_count integer := 0;
begin
  insert into public.billing_notices (
    invoice_id,
    invoice_number,
    account_actor_id,
    billing_contact_id,
    billing_email,
    operational_contact_email,
    notice_type,
    channel,
    status,
    invoice_due_date,
    notice_due_date,
    recorded_at,
    external_delivery_status,
    system_generated,
    generation_source,
    payload
  )
  select
    i.id,
    i.invoice_number,
    i.account_actor_id,
    i.billing_contact_id,
    i.billing_email,
    null,
    'day_8_overdue',
    'local_record_only',
    'recorded',
    i.due_date,
    i.due_date + 8,
    now(),
    'provider_not_configured',
    true,
    'system_due_scan',
    jsonb_build_object(
      'source', 'UJ-CRM-001B / UJ-ADM-001',
      'note', 'System-generated local Day 8 overdue notice evidence. Production outbound delivery remains unconfirmed.'
    )
  from public.invoices i
  where i.status = 'overdue'
    and p_today >= i.due_date + 8
    and not exists (
      select 1
      from public.billing_notices bn
      where bn.invoice_id = i.id
        and bn.notice_type = 'day_8_overdue'
        and bn.status <> 'cancelled'
    );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.generate_day8_notice_on_invoice_overdue()
returns trigger
language plpgsql
as $$
begin
  perform public.generate_due_day8_overdue_notices(current_date);
  return null;
end;
$$;

drop trigger if exists invoices_generate_day8_notice on public.invoices;
create trigger invoices_generate_day8_notice
after insert or update of status, due_date on public.invoices
for each statement execute function public.generate_day8_notice_on_invoice_overdue();

comment on function public.generate_due_day8_overdue_notices(date) is
  'Creates local Day 8 overdue notice evidence for overdue invoices once due_date + 8 has passed. Does not send external notifications.';

comment on trigger invoices_generate_day8_notice on public.invoices is
  'UJ-ADM-001 local evidence helper: creates Day 8 overdue notice rows when overdue invoice changes make them due. Scheduled daily execution still depends on production platform setup.';
