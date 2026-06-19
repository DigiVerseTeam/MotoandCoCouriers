-- Policy #25 / POL-OPS-025 and Policy #26 / POL-OPS-026 conditional activation gates.
--
-- Source-backed intent:
-- - Policy #25 is Conditional - Not Active until the driver pool reaches 3+
--   active drivers, with APP-ADM-002 assignment review, Policy #13 driver
--   verification, Policy #12 agreements, and Admin policy-register activation.
-- - Policy #26 is Conditional - Not Active until an external-courier or
--   per-run payment model is confirmed by the business owner.
-- - Policy #26 placeholder content must not be treated as active policy.
-- - Policy #26 activation requires legal classification advice, payment model,
--   POD/system integration, and Admin + Owner joint approval evidence.

create table if not exists public.conditional_policy_activation_reviews (
  id uuid primary key default gen_random_uuid(),
  policy_id text not null check (policy_id in ('POL-OPS-025', 'POL-OPS-026')),
  policy_name text not null,
  lifecycle_state text not null default 'conditional_not_active'
    check (lifecycle_state in ('conditional_not_active', 'activation_review_required', 'active', 'rejected')),
  activation_trigger text not null,
  active_driver_count_at_review integer not null default 0 check (active_driver_count_at_review >= 0),
  app_adm_002_assignment_review_confirmed boolean not null default false,
  policy_13_driver_verification_confirmed boolean not null default false,
  policy_12_driver_agreements_confirmed boolean not null default false,
  admin_policy_register_activation_confirmed boolean not null default false,
  jdd_addendum_required boolean not null default false,
  jdd_addendum_confirmed boolean not null default false,
  legal_classification_confirmed boolean not null default false,
  courier_payment_model_confirmed boolean not null default false,
  courier_pod_integration_confirmed boolean not null default false,
  owner_approval_reference text,
  admin_review_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz not null default now(),
  activated_by uuid references public.profiles(id),
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conditional_policy_25_activation_evidence_check
    check (
      policy_id <> 'POL-OPS-025'
      or lifecycle_state <> 'active'
      or (
        active_driver_count_at_review >= 3
        and app_adm_002_assignment_review_confirmed = true
        and policy_13_driver_verification_confirmed = true
        and policy_12_driver_agreements_confirmed = true
        and admin_policy_register_activation_confirmed = true
        and length(trim(coalesce(admin_review_note, ''))) > 0
        and (jdd_addendum_required = false or jdd_addendum_confirmed = true)
        and activated_at is not null
      )
    ),
  constraint conditional_policy_26_activation_evidence_check
    check (
      policy_id <> 'POL-OPS-026'
      or lifecycle_state <> 'active'
      or (
        legal_classification_confirmed = true
        and courier_payment_model_confirmed = true
        and courier_pod_integration_confirmed = true
        and length(trim(coalesce(owner_approval_reference, ''))) > 0
        and length(trim(coalesce(admin_review_note, ''))) > 0
        and activated_at is not null
      )
    )
);

create index if not exists conditional_policy_activation_reviews_policy_idx
  on public.conditional_policy_activation_reviews (policy_id, lifecycle_state, reviewed_at desc);

drop trigger if exists conditional_policy_activation_reviews_touch_updated_at on public.conditional_policy_activation_reviews;
create trigger conditional_policy_activation_reviews_touch_updated_at
before update on public.conditional_policy_activation_reviews
for each row execute function public.touch_updated_at();

drop trigger if exists conditional_policy_activation_reviews_pii_audit on public.conditional_policy_activation_reviews;
create trigger conditional_policy_activation_reviews_pii_audit
after insert or update or delete on public.conditional_policy_activation_reviews
for each row execute function public.write_pii_audit_log();

alter table public.conditional_policy_activation_reviews enable row level security;

drop policy if exists conditional_policy_activation_reviews_admin_manage on public.conditional_policy_activation_reviews;
create policy conditional_policy_activation_reviews_admin_manage
on public.conditional_policy_activation_reviews for all to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.conditional_policy_activation_reviews is
  'Policy #25 / #26 conditional activation evidence. These policies remain inactive until their source-backed triggers and approvals are recorded.';

comment on constraint conditional_policy_25_activation_evidence_check on public.conditional_policy_activation_reviews is
  'Policy #25: active state requires 3+ active drivers, APP-ADM-002 review, Policy #13 verification, Policy #12 agreements, Admin activation note, and JDD addendum evidence where required.';

comment on constraint conditional_policy_26_activation_evidence_check on public.conditional_policy_activation_reviews is
  'Policy #26: placeholder courier-billing content cannot become active without legal classification, payment model, POD integration, Admin note, and Owner approval reference.';
