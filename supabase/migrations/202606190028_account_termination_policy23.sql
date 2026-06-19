-- Policy #23 account termination guardrails.
--
-- Source-backed intent:
-- - Suspension grounds are non-payment after overdue notice, or material conduct
--   breach not remedied after Admin notice.
-- - Termination grounds are voluntary client closure, material/repeated conduct
--   breach where suspension has not resulted in remedy, or repeated
--   non-payment after debt recovery escalation is exhausted.
-- - The repeated non-payment debt recovery escalation path and write-off
--   thresholds are not confirmed, so that termination ground is blocked.
-- - Admin records Owner consultation and written termination notice evidence.
-- - Existing outstanding invoices remain payable after termination.
--
-- This migration records evidence and guards state only. It does not implement
-- outbound notification delivery because the production provider/channel is
-- unconfirmed.

alter table public.operational_notices
  drop constraint if exists operational_notices_notice_type_check;

alter table public.operational_notices
  add constraint operational_notices_notice_type_check
  check (notice_type in (
    'pickup_request_submitted',
    'schedule_adjusted',
    'pickup_confirmed',
    'out_for_delivery',
    'delivered',
    'failed_delivery',
    'no_pickup',
    'bring_forward',
    'order_cancelled',
    'cancellation_requested',
    'dispute_received',
    'billing_query_received',
    'supplier_setup_requested',
    'account_activated',
    'account_suspended',
    'account_reinstated',
    'account_terminated'
  ));

alter table public.billing_notices
  drop constraint if exists billing_notices_notice_type_check;

alter table public.billing_notices
  add constraint billing_notices_notice_type_check
  check (notice_type in ('day_8_overdue', 'suspension', 'reinstatement', 'termination', 'invoice'));

create table if not exists public.account_terminations (
  id uuid primary key default gen_random_uuid(),
  account_actor_id uuid not null references public.actors(id) on delete restrict,
  termination_ground text not null
    check (termination_ground in ('conduct_unremedied', 'voluntary_request', 'repeated_non_payment')),
  reason text not null,
  effective_date date not null default current_date,
  prior_suspension_id uuid references public.account_suspensions(id) on delete restrict,
  owner_consultation_evidence text not null,
  written_notification_evidence text not null,
  client_request_evidence text,
  outstanding_invoice_note text not null default 'Existing outstanding invoices remain payable.',
  debt_recovery_escalation_evidence text,
  status text not null default 'terminated' check (status in ('terminated', 'cancelled')),
  terminated_by uuid references public.profiles(id),
  terminated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_terminations_reason_required check (length(btrim(reason)) > 0),
  constraint account_terminations_owner_evidence_required check (length(btrim(owner_consultation_evidence)) > 0),
  constraint account_terminations_written_notice_required check (length(btrim(written_notification_evidence)) > 0),
  constraint account_terminations_conduct_requires_suspension check (
    termination_ground <> 'conduct_unremedied'
    or prior_suspension_id is not null
  ),
  constraint account_terminations_voluntary_requires_request check (
    termination_ground <> 'voluntary_request'
    or length(btrim(coalesce(client_request_evidence, ''))) > 0
  )
);

create index if not exists account_terminations_account_idx
  on public.account_terminations (account_actor_id, terminated_at desc);

create or replace function public.enforce_account_termination_policy23()
returns trigger
language plpgsql
as $$
begin
  if new.termination_ground = 'repeated_non_payment' then
    raise exception 'repeated non-payment termination blocked: Policy #23 debt recovery escalation path and write-off thresholds are unconfirmed';
  end if;

  if length(btrim(coalesce(new.owner_consultation_evidence, ''))) = 0 then
    raise exception 'account termination requires Owner consultation evidence';
  end if;

  if length(btrim(coalesce(new.written_notification_evidence, ''))) = 0 then
    raise exception 'account termination requires written notice evidence';
  end if;

  new.updated_at := now();
  new.terminated_at := coalesce(new.terminated_at, now());
  return new;
end;
$$;

drop trigger if exists account_terminations_policy23_gate on public.account_terminations;
create trigger account_terminations_policy23_gate
before insert or update of termination_ground, owner_consultation_evidence, written_notification_evidence, prior_suspension_id, client_request_evidence
on public.account_terminations
for each row execute function public.enforce_account_termination_policy23();

drop trigger if exists account_terminations_pii_audit on public.account_terminations;
create trigger account_terminations_pii_audit
after insert or update or delete on public.account_terminations
for each row execute function public.write_pii_audit_log();

alter table public.account_terminations enable row level security;

drop policy if exists account_terminations_select_by_role_scope on public.account_terminations;
create policy account_terminations_select_by_role_scope
on public.account_terminations for select to authenticated
using (
  public.is_admin()
  or public.can_client_access_account(account_actor_id)
);

drop policy if exists account_terminations_admin_manage on public.account_terminations;
create policy account_terminations_admin_manage
on public.account_terminations for all to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.account_terminations is
  'Policy #23 account termination evidence register. Repeated non-payment termination is blocked until debt recovery escalation and write-off thresholds are confirmed.';

comment on trigger account_terminations_policy23_gate on public.account_terminations is
  'Policy #23: blocks repeated non-payment termination while the debt recovery gap is open and requires Owner consultation plus written notice evidence.';

comment on constraint operational_notices_notice_type_check on public.operational_notices is
  'Local operational/customer outbox types including Policy #23 account termination records. Production delivery provider remains unconfirmed.';

comment on constraint billing_notices_notice_type_check on public.billing_notices is
  'Local billing/account notice types including Policy #23 termination notice records. Production delivery provider remains unconfirmed.';
