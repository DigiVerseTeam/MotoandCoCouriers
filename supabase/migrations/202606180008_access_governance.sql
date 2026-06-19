-- Local-to-production access governance structure.
-- Source-backed requirements:
-- - Admin grants, modifies, and revokes access roles.
-- - Staff access is reviewed annually and on departure or role change.
-- - Receiver has no login.
-- Final RLS policies still require Policy #21 and BOAS Sheet 05 review.

create table if not exists public.access_role_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  actor_id uuid references public.actors(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  application_role text not null check (application_role in ('client_operational', 'client_billing', 'driver', 'admin')),
  actor_code text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  revoked_by uuid references public.profiles(id),
  revoked_at timestamptz,
  revoked_reason text,
  last_reviewed_by uuid references public.profiles(id),
  last_reviewed_at timestamptz,
  last_review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_role_reviews (
  id uuid primary key default gen_random_uuid(),
  access_role_assignment_id uuid not null references public.access_role_assignments(id) on delete cascade,
  review_type text not null check (review_type in ('annual', 'role_change', 'departure', 'restore', 'revoke', 'other')),
  outcome text not null check (outcome in ('retain', 'revoke', 'restore', 'no_change')),
  reason text not null,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz not null default now()
);

create unique index if not exists access_role_assignments_unique_active_target
  on public.access_role_assignments (profile_id, actor_id, contact_id, application_role);

create index if not exists access_role_assignments_status_idx
  on public.access_role_assignments (application_role, status, last_reviewed_at);

drop trigger if exists access_role_assignments_touch_updated_at on public.access_role_assignments;
create trigger access_role_assignments_touch_updated_at
before update on public.access_role_assignments
for each row execute function public.touch_updated_at();

drop trigger if exists access_role_assignments_pii_audit on public.access_role_assignments;
create trigger access_role_assignments_pii_audit
after insert or update or delete on public.access_role_assignments
for each row execute function public.write_pii_audit_log();

drop trigger if exists access_role_reviews_pii_audit on public.access_role_reviews;
create trigger access_role_reviews_pii_audit
after insert or update or delete on public.access_role_reviews
for each row execute function public.write_pii_audit_log();

alter table public.access_role_assignments enable row level security;
alter table public.access_role_reviews enable row level security;
