-- Decisions Register Gap 20/21 reinstatement alignment.
-- Payment arrangements require structured evidence, and reinstatement
-- notification is automatic on the Admin reinstatement action.

alter table public.account_suspensions
  add column if not exists reinstatement_resolution_type text not null default 'payment_confirmed'
    check (reinstatement_resolution_type in ('payment_confirmed', 'payment_arrangement', 'breach_remedied')),
  add column if not exists payment_arrangement_agreed_date date,
  add column if not exists payment_arrangement_agreed_amount numeric(12, 2),
  add column if not exists payment_arrangement_contact text,
  add column if not exists payment_arrangement_evidence_ref text,
  add column if not exists payment_arrangement_recorded_at timestamptz;

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
    if new.reinstatement_resolution_type = 'payment_arrangement' then
      if new.payment_arrangement_agreed_date is null
        or new.payment_arrangement_agreed_amount is null
        or length(btrim(coalesce(new.payment_arrangement_contact, ''))) = 0
        or length(btrim(coalesce(new.payment_arrangement_evidence_ref, ''))) = 0
      then
        raise exception 'payment arrangement reinstatement requires agreed date, amount, contact, and written evidence reference';
      end if;

      new.payment_arrangement_recorded_at := coalesce(new.payment_arrangement_recorded_at, now());
    end if;

    new.reinstatement_operational_contact_notified := true;
    new.reinstatement_billing_contact_notified := true;
    new.reinstatement_notification_recorded_at := coalesce(new.reinstatement_notification_recorded_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists account_suspensions_notice_gate on public.account_suspensions;
create trigger account_suspensions_notice_gate
before insert or update of status, suspension_type, invoice_id, billing_notice_id, operational_contact_notified, billing_contact_notified, reinstatement_resolution_type, payment_arrangement_agreed_date, payment_arrangement_agreed_amount, payment_arrangement_contact, payment_arrangement_evidence_ref
on public.account_suspensions
for each row execute function public.enforce_account_suspension_notice_gate();

comment on trigger account_suspensions_notice_gate on public.account_suspensions is
  'Policy #23 / Decisions Register Gap 20/21: non-payment suspension requires Day 8 evidence; reinstatement notification is automatic and payment arrangements require structured evidence.';
