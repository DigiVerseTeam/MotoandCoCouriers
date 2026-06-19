-- Account suspension notice guardrails for Policy #23 / UJ-ADM-001.
--
-- Source-backed intent:
-- - Non-payment suspension is only valid after an overdue notice exists.
-- - Admin records notification to both Operational and Billing contacts.
-- - Suspended accounts can still log in, but new pickup submission is blocked
--   by the RLS/account status layer already represented in prior migrations.
--
-- This does not implement outbound email/SMS/in-app delivery. The production
-- notification provider/channel remains unconfirmed, so this migration records
-- evidence and guards the database state only.

alter table public.account_suspensions
  add column if not exists suspension_type text not null default 'other'
    check (suspension_type in ('non_payment', 'material_conduct_breach', 'other')),
  add column if not exists billing_notice_id uuid references public.billing_notices(id) on delete restrict,
  add column if not exists operational_contact_notified boolean not null default false,
  add column if not exists billing_contact_notified boolean not null default false,
  add column if not exists notification_recorded_at timestamptz,
  add column if not exists notification_note text,
  add column if not exists reinstatement_operational_contact_notified boolean not null default false,
  add column if not exists reinstatement_billing_contact_notified boolean not null default false,
  add column if not exists reinstatement_notification_recorded_at timestamptz;

create index if not exists account_suspensions_billing_notice_idx
  on public.account_suspensions (billing_notice_id);

create or replace function public.enforce_account_suspension_notice_gate()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'active' then
    if coalesce(new.operational_contact_notified, false) = false
      or coalesce(new.billing_contact_notified, false) = false
    then
      raise exception 'account suspension requires Operational and Billing contact notification evidence';
    end if;

    new.notification_sent := true;
    new.notification_recorded_at := coalesce(new.notification_recorded_at, now());

    if new.suspension_type = 'non_payment'
      or new.invoice_id is not null
      or lower(new.reason) like '%non-payment%'
      or lower(new.reason) like '%non payment%'
    then
      if new.invoice_id is null then
        raise exception 'non-payment suspension requires linked overdue invoice';
      end if;

      if new.billing_notice_id is null then
        raise exception 'non-payment suspension requires linked Day 8 overdue notice';
      end if;

      if not exists (
        select 1
        from public.billing_notices bn
        join public.invoices i on i.id = new.invoice_id
        where bn.id = new.billing_notice_id
          and bn.notice_type = 'day_8_overdue'
          and bn.status <> 'cancelled'
          and bn.account_actor_id = new.account_actor_id
          and (
            bn.invoice_id = new.invoice_id
            or bn.invoice_number = i.invoice_number
          )
      ) then
        raise exception 'linked Day 8 overdue notice must match the suspended account and invoice';
      end if;
    end if;
  end if;

  if new.status = 'reinstated' then
    if coalesce(new.reinstatement_operational_contact_notified, false) = false
      or coalesce(new.reinstatement_billing_contact_notified, false) = false
    then
      raise exception 'account reinstatement requires Operational and Billing contact notification evidence';
    end if;

    new.reinstatement_notification_recorded_at := coalesce(new.reinstatement_notification_recorded_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists account_suspensions_notice_gate on public.account_suspensions;
create trigger account_suspensions_notice_gate
before insert or update of status, suspension_type, invoice_id, billing_notice_id, operational_contact_notified, billing_contact_notified, reinstatement_operational_contact_notified, reinstatement_billing_contact_notified
on public.account_suspensions
for each row execute function public.enforce_account_suspension_notice_gate();

comment on trigger account_suspensions_notice_gate on public.account_suspensions is
  'Policy #23 / UJ-ADM-001: non-payment suspension requires a matching Day 8 overdue notice; suspension and reinstatement require both Operational/Billing contact notification evidence.';
