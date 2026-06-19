-- Policy #18 Delivery Dispute & Complaint controls.
-- Source-backed rules:
-- - Client provides order reference/con note through the linked work item, delivery date in question,
--   dispute reason, and description.
-- - Admin acknowledges within 2 business days and aims to resolve within 10 business days.
-- - Disputes should be raised within 14 days of invoice date; disputes over 30 days may not be actionable.
-- - Admin investigates delivery disputes with APP-DRV-003 proof records and billing disputes with
--   APP-DRV-002 pickup capture plus APP-ADM-004 invoice evidence.
-- - Owner escalation is available when the client is not satisfied; Owner decision is final.

alter table public.disputes
  add column if not exists policy_ref text not null default 'Policy #18',
  add column if not exists dispute_reason text,
  add column if not exists disputed_delivery_date date,
  add column if not exists invoice_date date,
  add column if not exists days_since_invoice integer,
  add column if not exists timing_status text,
  add column if not exists ack_due_date date,
  add column if not exists resolution_due_date date,
  add column if not exists acknowledged_at timestamptz,
  add column if not exists acknowledged_by uuid references public.profiles(id),
  add column if not exists finding text,
  add column if not exists remedy_required boolean not null default false,
  add column if not exists remedy_type text not null default 'none',
  add column if not exists remedy_due_date date,
  add column if not exists remedy_status text not null default 'not_required',
  add column if not exists remedy_note text,
  add column if not exists owner_escalation_status text not null default 'not_requested',
  add column if not exists owner_escalated_at timestamptz,
  add column if not exists owner_decision_note text;

alter table public.pickup_requests
  add column if not exists policy18_dispute_status text,
  add column if not exists policy18_last_outcome text,
  add column if not exists policy18_last_outcome_at timestamptz,
  add column if not exists policy18_last_exception_id uuid references public.exceptions(id) on delete set null,
  add column if not exists policy18_remedy_required boolean not null default false,
  add column if not exists policy18_remedy_type text not null default 'none',
  add column if not exists policy18_remedy_due_date date,
  add column if not exists policy18_remedy_status text not null default 'not_required',
  add column if not exists policy18_dispute_history jsonb not null default '[]'::jsonb;

alter table public.invoices
  add column if not exists policy18_dispute_status text,
  add column if not exists policy18_last_outcome text,
  add column if not exists policy18_last_outcome_at timestamptz,
  add column if not exists policy18_last_exception_id uuid references public.exceptions(id) on delete set null,
  add column if not exists policy18_remedy_required boolean not null default false,
  add column if not exists policy18_remedy_type text not null default 'none',
  add column if not exists policy18_remedy_due_date date,
  add column if not exists policy18_remedy_status text not null default 'not_required',
  add column if not exists policy18_dispute_history jsonb not null default '[]'::jsonb;

alter table public.disputes
  drop constraint if exists disputes_dispute_reason_check,
  add constraint disputes_dispute_reason_check
  check (
    dispute_reason is null or dispute_reason in (
      'goods_not_received',
      'wrong_goods',
      'goods_damaged',
      'incorrect_charge',
      'other'
    )
  );

alter table public.disputes
  drop constraint if exists disputes_policy18_timing_status_check,
  add constraint disputes_policy18_timing_status_check
  check (
    timing_status is null or timing_status in (
      'within_14_days',
      'outside_14_days',
      'over_30_days',
      'invoice_date_missing'
    )
  );

alter table public.disputes
  drop constraint if exists disputes_policy18_owner_escalation_check,
  add constraint disputes_policy18_owner_escalation_check
  check (owner_escalation_status in ('not_requested', 'requested', 'decision_recorded'));

alter table public.disputes
  drop constraint if exists disputes_policy18_finding_check,
  add constraint disputes_policy18_finding_check
  check (
    finding is null or finding in (
      'proof_confirms_completed',
      'delivery_error_no_cost_remedy',
      'no_billing_error',
      'billing_error_credit_note',
      'billing_error_corrected_invoice',
      'not_actionable',
      'other_resolution'
    )
  );

alter table public.disputes
  drop constraint if exists disputes_policy18_remedy_check,
  add constraint disputes_policy18_remedy_check
  check (
    remedy_type in ('none', 'no_cost_delivery_remedy', 'credit_note', 'corrected_invoice')
    and remedy_status in ('not_required', 'required', 'pending_accounting_handoff', 'completed', 'cancelled')
  );

alter table public.disputes
  drop constraint if exists disputes_policy18_required_fields_check,
  add constraint disputes_policy18_required_fields_check
  check (
    dispute_type not in ('delivery', 'billing')
    or (
      dispute_reason is not null
      and disputed_delivery_date is not null
      and length(trim(detail)) > 0
    )
  );

alter table public.pickup_requests
  drop constraint if exists pickup_requests_policy18_dispute_status_check,
  add constraint pickup_requests_policy18_dispute_status_check
  check (
    policy18_dispute_status is null or policy18_dispute_status in ('open', 'acknowledged', 'owner_escalated', 'resolved')
  );

alter table public.invoices
  drop constraint if exists invoices_policy18_dispute_status_check,
  add constraint invoices_policy18_dispute_status_check
  check (
    policy18_dispute_status is null or policy18_dispute_status in ('open', 'acknowledged', 'owner_escalated', 'resolved')
  );

create or replace function public.add_business_days(start_date date, business_days integer)
returns date
language plpgsql
immutable
as $$
declare
  current_date_value date := start_date;
  added integer := 0;
begin
  if start_date is null then
    return null;
  end if;

  while added < business_days loop
    current_date_value := current_date_value + 1;
    if extract(isodow from current_date_value) < 6 then
      added := added + 1;
    end if;
  end loop;

  return current_date_value;
end;
$$;

create or replace function public.apply_policy18_dispute_controls()
returns trigger
language plpgsql
as $$
begin
  new.policy_ref := coalesce(nullif(new.policy_ref, ''), 'Policy #18');
  new.ack_due_date := coalesce(new.ack_due_date, public.add_business_days(new.raised_at::date, 2));
  new.resolution_due_date := coalesce(new.resolution_due_date, public.add_business_days(new.raised_at::date, 10));

  if new.invoice_date is null then
    new.timing_status := coalesce(new.timing_status, 'invoice_date_missing');
    new.days_since_invoice := null;
  else
    new.days_since_invoice := greatest(0, new.raised_at::date - new.invoice_date);
    new.timing_status := case
      when new.days_since_invoice <= 14 then 'within_14_days'
      when new.days_since_invoice > 30 then 'over_30_days'
      else 'outside_14_days'
    end;
  end if;

  return new;
end;
$$;

drop trigger if exists disputes_apply_policy18_controls on public.disputes;
create trigger disputes_apply_policy18_controls
before insert or update on public.disputes
for each row execute function public.apply_policy18_dispute_controls();

comment on column public.disputes.dispute_reason is 'Policy #18 dispute category supplied by the client.';
comment on column public.disputes.disputed_delivery_date is 'Policy #18 delivery date in question supplied by the client.';
comment on column public.disputes.ack_due_date is 'Policy #18 2 business day acknowledgement target.';
comment on column public.disputes.resolution_due_date is 'Policy #18 10 business day resolution target.';
comment on column public.disputes.remedy_due_date is 'Policy #18 due date for credit note or corrected invoice when a billing error is confirmed.';
comment on column public.disputes.owner_escalation_status is 'Policy #18 Owner escalation state when client is not satisfied.';
comment on column public.pickup_requests.policy18_dispute_history is 'Append-style Policy #18 dispute outcome summaries recorded against the relevant work item.';
comment on column public.invoices.policy18_dispute_history is 'Append-style Policy #18 billing dispute outcome summaries recorded against the relevant invoice.';
