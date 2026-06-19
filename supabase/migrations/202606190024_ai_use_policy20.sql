-- Policy #20 / POL-OPS-020 AI use governance.
--
-- Source-backed intent:
-- - Only three AI agents are in scope for release-one governance:
--   AGT-CS-001b Customer Success AI, AGT-SRM-001b Supplier CTA Agent,
--   and AGT-ADM-007b CTA Drafting Agent.
-- - AI is on-demand only and must be triggered by Admin.
-- - No AI output is sent autonomously.
-- - Admin must review, edit, reject, or approve every output.
-- - No batch approval of unread messages.
-- - AI cannot make commercial, pricing, account, suspension, or legal
--   decisions.
-- - Live AI provider, model, prompt registry, and outbound send channel are
--   not confirmed. This migration stores review evidence only.

create table if not exists public.ai_draft_reviews (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  agent_name text not null,
  target_type text not null,
  target_id text not null,
  target_label text not null,
  trigger_source text not null,
  trigger_reason text not null,
  draft_text text not null,
  approved_text text,
  status text not null default 'draft_pending_admin_review',
  created_by uuid references public.profiles(id),
  created_by_label text not null default 'Admin',
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.profiles(id),
  reviewed_by_label text,
  reviewed_at timestamptz,
  review_note text,
  rejected_reason text,
  sent_at timestamptz,
  external_delivery_status text not null default 'not_sent_provider_not_configured',
  autonomous_send_attempted boolean not null default false,
  commercial_decision_made boolean not null default false,
  batch_approval boolean not null default false,
  source_ref text not null default 'Policy #20 / POL-OPS-020',
  constraint ai_draft_agent_id_check
    check (agent_id in ('AGT-CS-001b', 'AGT-SRM-001b', 'AGT-ADM-007b')),
  constraint ai_draft_review_status_check
    check (status in ('draft_pending_admin_review', 'approved_not_sent', 'rejected')),
  constraint ai_draft_has_trigger_evidence_check
    check (
      length(btrim(target_type)) > 0
      and length(btrim(target_id)) > 0
      and length(btrim(target_label)) > 0
      and length(btrim(trigger_source)) > 0
      and length(btrim(trigger_reason)) > 0
      and length(btrim(draft_text)) > 0
      and source_ref like 'Policy #20%'
    ),
  constraint ai_draft_admin_review_required_check
    check (
      status = 'draft_pending_admin_review'
      or (
        reviewed_at is not null
        and (reviewed_by is not null or length(btrim(coalesce(reviewed_by_label, ''))) > 0)
        and length(btrim(coalesce(review_note, rejected_reason, ''))) > 0
      )
    ),
  constraint ai_draft_approval_text_required_check
    check (
      status <> 'approved_not_sent'
      or length(btrim(coalesce(approved_text, ''))) > 0
    ),
  constraint ai_draft_no_autonomous_send_check
    check (
      sent_at is null
      and external_delivery_status = 'not_sent_provider_not_configured'
      and autonomous_send_attempted = false
    ),
  constraint ai_draft_no_commercial_decision_check
    check (commercial_decision_made = false),
  constraint ai_draft_no_batch_approval_check
    check (batch_approval = false)
);

create index if not exists ai_draft_reviews_status_idx
  on public.ai_draft_reviews (status, created_at desc);

create index if not exists ai_draft_reviews_target_idx
  on public.ai_draft_reviews (agent_id, target_type, target_id)
  where status = 'draft_pending_admin_review';

drop trigger if exists ai_draft_reviews_pii_audit on public.ai_draft_reviews;
create trigger ai_draft_reviews_pii_audit
after insert or update or delete on public.ai_draft_reviews
for each row execute function public.write_pii_audit_log();

alter table public.ai_draft_reviews enable row level security;

drop policy if exists ai_draft_reviews_admin_manage on public.ai_draft_reviews;
create policy ai_draft_reviews_admin_manage
on public.ai_draft_reviews for all to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.ai_draft_reviews is
  'Policy #20 / POL-OPS-020 Admin-triggered AI draft review records only. Live AI provider, model, prompt registry, and outbound send channel remain unconfirmed.';

comment on column public.ai_draft_reviews.agent_id is
  'Policy #20 approved agent identifier: AGT-CS-001b, AGT-SRM-001b, or AGT-ADM-007b.';

comment on column public.ai_draft_reviews.external_delivery_status is
  'Policy #20: no autonomous send. Release-one local records remain not_sent_provider_not_configured until production delivery is confirmed.';

comment on constraint ai_draft_admin_review_required_check on public.ai_draft_reviews is
  'Policy #20 requires Admin review evidence before any AI draft can be approved or rejected.';

comment on constraint ai_draft_no_batch_approval_check on public.ai_draft_reviews is
  'Policy #20 blocks batch approval of unread AI messages.';

comment on constraint ai_draft_no_commercial_decision_check on public.ai_draft_reviews is
  'Policy #20 blocks AI commercial, pricing, account, suspension, and legal decisions.';
