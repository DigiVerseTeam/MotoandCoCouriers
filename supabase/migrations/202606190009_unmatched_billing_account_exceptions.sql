-- SOP-EXC-03 unmatched billing account exception handling.
--
-- Source-backed intent:
-- - Billing compilation flags delivered, uninvoiced work where the account_id is
--   missing, invalid, inactive, or explicitly marked unmatched.
-- - Flagged work is excluded from billing groups until Admin investigates POD
--   proof and pickup capture evidence.
-- - Admin may correct account_id only to an active customer account.
-- - Already-invoiced work is not retro-modified here; SOP-EXC-03 requires a
--   next-period treatment note, and the production accounting path is still a
--   launch blocker.

alter table public.pickup_requests
  add column if not exists billing_account_match_status text not null default 'matched',
  add column if not exists billing_account_match_note text,
  add column if not exists billing_account_match_source text not null default 'SOP-EXC-03',
  add column if not exists billing_account_matched_by uuid references public.profiles(id),
  add column if not exists billing_account_matched_at timestamptz;

alter table public.pickup_requests
  drop constraint if exists pickup_requests_billing_account_match_status_check;

alter table public.pickup_requests
  add constraint pickup_requests_billing_account_match_status_check
  check (billing_account_match_status in ('matched', 'unmatched', 'resolved', 'excluded_next_period'));

create index if not exists pickup_requests_billing_account_match_idx
  on public.pickup_requests (billing_account_match_status, status, account_actor_id);

comment on column public.pickup_requests.billing_account_match_status is
  'SOP-EXC-03 billing account match state used to exclude unmatched delivered work from invoice groups.';

comment on column public.pickup_requests.billing_account_match_note is
  'Admin investigation note for SOP-EXC-03 billing account correction or next-period treatment.';

create or replace function public.queue_unmatched_billing_account_exception(target_pickup_request_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  with flagged as (
    select
      pr.id,
      pr.account_actor_id,
      pr.status,
      pr.billing_account_match_status,
      pr.billing_account_match_note,
      a.trading_name,
      a.actor_type,
      a.relationship_status
    from public.pickup_requests pr
    left join public.actors a on a.id = pr.account_actor_id
    where pr.status = 'delivered'
      and (target_pickup_request_id is null or pr.id = target_pickup_request_id)
      and not exists (
        select 1
        from public.invoice_lines il
        where il.pickup_request_id = pr.id
      )
      and (
        pr.billing_account_match_status = 'unmatched'
        or a.id is null
        or a.actor_type <> 'customer'
        or a.relationship_status <> 'active'
      )
      and not exists (
        select 1
        from public.exceptions e
        where e.source = 'billing_account_match'
          and e.source_table = 'pickup_requests'
          and e.source_record_id = pr.id
          and e.status <> 'resolved'
      )
  )
  insert into public.exceptions (
    source,
    severity,
    status,
    summary,
    detail,
    source_table,
    source_record_id
  )
  select
    'billing_account_match',
    'high',
    'open',
    'Unmatched billing account',
    concat_ws(
      ' | ',
      'pickup_request_id=' || id::text,
      'account_actor_id=' || coalesce(account_actor_id::text, ''),
      'account=' || coalesce(trading_name, 'not matched'),
      'actor_type=' || coalesce(actor_type, 'not found'),
      'relationship_status=' || coalesce(relationship_status, 'not found'),
      'match_status=' || billing_account_match_status,
      'policy=SOP-EXC-03 / Policy #10a / APP-ADM-005',
      nullif(billing_account_match_note, '')
    ),
    'pickup_requests',
    id
  from flagged;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.pickup_request_unmatched_billing_exception_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.queue_unmatched_billing_account_exception(new.id);
  return new;
end;
$$;

drop trigger if exists pickup_requests_unmatched_billing_exception on public.pickup_requests;
create trigger pickup_requests_unmatched_billing_exception
after insert or update of status, account_actor_id, billing_account_match_status
on public.pickup_requests
for each row
execute function public.pickup_request_unmatched_billing_exception_trigger();

create or replace function public.correct_pickup_request_billing_account(
  target_pickup_request_id uuid,
  corrected_account_actor_id uuid,
  investigation_note text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin role required to correct billing account matches';
  end if;

  if nullif(trim(coalesce(investigation_note, '')), '') is null then
    raise exception 'SOP-EXC-03 investigation note is required';
  end if;

  if exists (
    select 1
    from public.invoice_lines il
    where il.pickup_request_id = target_pickup_request_id
  ) then
    raise exception 'SOP-EXC-03 blocks retro-modifying already-invoiced work; record next-period treatment instead';
  end if;

  if not exists (
    select 1
    from public.actors a
    where a.id = corrected_account_actor_id
      and a.actor_type = 'customer'
      and a.relationship_status = 'active'
  ) then
    raise exception 'Corrected billing account must be an active customer account';
  end if;

  update public.pickup_requests
  set
    account_actor_id = corrected_account_actor_id,
    billing_account_match_status = 'resolved',
    billing_account_match_note = investigation_note,
    billing_account_match_source = 'SOP-EXC-03',
    billing_account_matched_by = auth.uid(),
    billing_account_matched_at = now()
  where id = target_pickup_request_id;

  if not found then
    raise exception 'Pickup request not found';
  end if;

  update public.exceptions
  set
    status = 'resolved',
    resolved_at = now(),
    detail = concat_ws(
      ' | ',
      detail,
      'resolved_account_actor_id=' || corrected_account_actor_id::text,
      'investigation_note=' || investigation_note
    )
  where source = 'billing_account_match'
    and source_table = 'pickup_requests'
    and source_record_id = target_pickup_request_id
    and status <> 'resolved';
end;
$$;

comment on function public.queue_unmatched_billing_account_exception(uuid) is
  'Queues APP-ADM-005 exceptions for SOP-EXC-03 unmatched delivered billing candidates.';

comment on function public.correct_pickup_request_billing_account(uuid, uuid, text) is
  'Admin-only SOP-EXC-03 correction path for delivered, uninvoiced pickup request billing account matches.';
