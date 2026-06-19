-- Supplier master-data monitoring for SOP-MDM-01.
-- This models review cadence and persisted review flags without choosing a
-- global supplier review interval. Final RLS still depends on Policy #21,
-- BOAS Sheet 05, and the production Supabase Auth role binding.

alter table public.actors
  add column if not exists review_interval_days integer
  check (review_interval_days is null or review_interval_days > 0);

create table if not exists public.supplier_master_data_review_flags (
  id uuid primary key default gen_random_uuid(),
  supplier_actor_id uuid not null references public.actors(id) on delete cascade,
  source_sop text not null default 'SOP-MDM-01',
  status text not null default 'open' check (status in ('open', 'queued_exception', 'resolved', 'deferred')),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  flag_reason text not null,
  missing_fields text[] not null default '{}'::text[],
  last_reviewed date,
  review_interval_days integer check (review_interval_days is null or review_interval_days > 0),
  review_due_date date,
  exception_id uuid,
  flagged_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  resolution_note text
);

create index if not exists supplier_master_data_review_flags_supplier_idx
  on public.supplier_master_data_review_flags (supplier_actor_id, status);

create index if not exists supplier_master_data_review_flags_due_idx
  on public.supplier_master_data_review_flags (review_due_date)
  where status in ('open', 'queued_exception');

alter table public.supplier_master_data_review_flags enable row level security;

comment on column public.actors.review_interval_days is
  'Supplier-specific review interval. No global interval is assumed until approved source material confirms one.';

comment on table public.supplier_master_data_review_flags is
  'SOP-MDM-01 supplier staleness/incomplete-record flags routed to Admin exception handling.';
