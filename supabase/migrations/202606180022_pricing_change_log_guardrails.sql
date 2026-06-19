-- Pricing change-log guardrails for Policy #9 / SOP-MDM-02.
--
-- Source-backed intent:
-- - price_rules is the runtime pricing source of truth.
-- - Driver must not enter or override prices.
-- - Pricing changes require written Admin action plus Owner approval evidence.
-- - Pricing changes must be logged before they take effect.
-- - Unlogged pricing changes are Admin exception material.
--
-- This enforces change-log evidence for price_rules. It does not decide the
-- unresolved production execution authority between Admin and Digiverse.

alter table public.price_rules
  add column if not exists status text not null default 'active'
    check (status in ('active', 'archived'));

with missing_price_logs as (
  select pr.id, pr.label, pr.effective_from
  from public.price_rules pr
  where pr.change_log_id is null
),
inserted_logs as (
  insert into public.master_data_changes (
    change_type,
    target_id,
    field,
    old_value,
    new_value,
    reason,
    status,
    approved_by_owner,
    effective_date
  )
  select
    'pricing',
    missing_price_logs.id,
    'initial_price_rule',
    '',
    missing_price_logs.label,
    'Policy #9 / SOP-MDM-02 initial approved pricing schedule',
    'executed',
    'Policy #9 / SOP-MDM-02 initial approved pricing schedule',
    missing_price_logs.effective_from
  from missing_price_logs
  returning id, target_id
)
update public.price_rules pr
set change_log_id = inserted_logs.id
from inserted_logs
where pr.id = inserted_logs.target_id
  and pr.change_log_id is null;

create or replace function public.enforce_price_rule_change_log()
returns trigger
language plpgsql
as $$
declare
  change_record public.master_data_changes%rowtype;
begin
  if new.change_log_id is null then
    raise exception 'price_rules changes require a pricing master_data_changes record before taking effect';
  end if;

  select *
  into change_record
  from public.master_data_changes
  where id = new.change_log_id;

  if change_record.id is null then
    raise exception 'price_rules change_log_id does not reference an existing master_data_changes record';
  end if;

  if change_record.change_type <> 'pricing' then
    raise exception 'price_rules change_log_id must reference a pricing change log';
  end if;

  if length(btrim(coalesce(change_record.reason, ''))) = 0 then
    raise exception 'pricing change log requires written reason';
  end if;

  if length(btrim(coalesce(change_record.approved_by_owner, ''))) = 0 then
    raise exception 'pricing change log requires Owner approval reference';
  end if;

  if change_record.status not in ('owner_approved', 'ready_for_execution', 'executed') then
    raise exception 'pricing change log must be Owner approved before price_rules can take effect';
  end if;

  return new;
end;
$$;

drop trigger if exists price_rules_change_log_guard on public.price_rules;
create trigger price_rules_change_log_guard
before insert or update of service_variant, label, item_type, tyre_count_min, tyre_count_max, weight_band, rate_cents, rate_mode, effective_from, effective_to, status, change_log_id
on public.price_rules
for each row execute function public.enforce_price_rule_change_log();

comment on trigger price_rules_change_log_guard on public.price_rules is
  'Policy #9 / SOP-MDM-02: price_rules rows require pricing change-log reason and Owner approval evidence before taking effect.';
