-- Pricing master-data monitoring for Policy #9 and SOP-MDM-02.
-- This models local detection of incomplete or unlogged price_rules rows.
-- Final production authority still depends on the Admin + Owner approval workflow
-- and live Supabase/RLS execution.

create table if not exists public.pricing_master_data_review_flags (
  id uuid primary key default gen_random_uuid(),
  price_rule_id uuid references public.price_rules(id) on delete cascade,
  price_rule_local_id text,
  source_policy text not null default 'Policy #9 / SOP-MDM-02',
  status text not null default 'open' check (status in ('open', 'queued_exception', 'resolved', 'deferred')),
  severity text not null default 'high' check (severity in ('low', 'medium', 'high', 'critical')),
  flag_reason text not null,
  missing_fields text[] not null default '{}'::text[],
  change_log_id uuid references public.master_data_changes(id),
  owner_approval_ref text,
  exception_id uuid,
  flagged_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  resolution_note text
);

create index if not exists pricing_master_data_review_flags_rule_idx
  on public.pricing_master_data_review_flags (price_rule_id, status);

create index if not exists pricing_master_data_review_flags_local_rule_idx
  on public.pricing_master_data_review_flags (price_rule_local_id, status);

drop trigger if exists pricing_master_data_review_flags_pii_audit on public.pricing_master_data_review_flags;
create trigger pricing_master_data_review_flags_pii_audit
after insert or update or delete on public.pricing_master_data_review_flags
for each row execute function public.write_pii_audit_log();

alter table public.pricing_master_data_review_flags enable row level security;

comment on table public.pricing_master_data_review_flags is
  'Policy #9 / SOP-MDM-02 price_rules governance flags routed to Admin exception handling.';
