-- Decisions Register scope alignment.
-- Source:
-- - DECISIONS-REGISTER Gap 16 confirms "time_constraint" as a valid No Pickup reason.
-- - Hard scope: Admin SLA monitoring is outside the logistics portal. The portal records
--   timestamps and investigation evidence, but must not calculate Admin SLA due dates.

alter table public.pickup_requests
  drop constraint if exists pickup_requests_pickup_no_pickup_category_check;

alter table public.pickup_requests
  add constraint pickup_requests_pickup_no_pickup_category_check
  check (
    pickup_no_pickup_category is null
    or pickup_no_pickup_category in (
      'not_ready_after_grace',
      'unlabelled',
      'improper_packaging',
      'supplier_refused',
      'wrong_items',
      'time_constraint',
      'whs_hazard'
    )
  );

create or replace function public.apply_policy18_dispute_controls()
returns trigger
language plpgsql
as $$
begin
  new.policy_ref := coalesce(nullif(new.policy_ref, ''), 'Policy #18');

  -- SLA monitoring is out of scope for the logistics portal.
  -- Keep any imported legacy values, but do not calculate due dates here.
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

comment on constraint pickup_requests_pickup_no_pickup_category_check on public.pickup_requests is
  'DECISIONS-REGISTER Gap 16 / SOP-PUP-03 / Policy #16 / Policy #27 No Pickup reason taxonomy for APP-DRV-002 no-billing evidence.';

comment on column public.disputes.ack_due_date is
  'Legacy compatibility field only. Admin SLA acknowledgement monitoring is outside the logistics portal; the portal records timestamps only.';

comment on column public.disputes.resolution_due_date is
  'Legacy compatibility field only. Admin SLA resolution monitoring is outside the logistics portal; the portal records timestamps only.';
