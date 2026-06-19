-- Moto and Co Couriers release-one schema.
-- Source-backed areas: docs/release-one-source-map.md and docs/village-crm-rules.md.
-- Final production RLS policies require Policy #21 and BOAS Sheet 05 review before deployment.

create extension if not exists pgcrypto;

create table public.actors (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('customer', 'supplier', 'partner', 'advisor', 'regulator', 'other')),
  legal_name text not null,
  trading_name text not null,
  relationship_tier text not null default 'transactional' check (relationship_tier in ('transactional', 'preferred', 'strategic', 'co_creation')),
  relationship_status text not null default 'pending' check (relationship_status in ('pending', 'active', 'inactive', 'at_risk', 'suspended', 'closed')),
  relationship_owner uuid,
  delivery_address text,
  dock_address text,
  dock_contact_role text,
  pickup_window text,
  packaging_notes text,
  first_engagement_date date,
  last_engagement_date date,
  last_reviewed date,
  risk_level text not null default 'medium' check (risk_level in ('low', 'medium', 'high', 'critical')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actors(id) on delete cascade,
  contact_kind text not null check (contact_kind in ('operational', 'billing', 'receiver', 'supplier_dock', 'other')),
  full_name text not null,
  role_title text not null,
  influence_role text not null check (influence_role in ('economic_buyer', 'technical_buyer', 'end_user', 'influencer', 'blocker', 'executive_sponsor', 'operational_lead')),
  email text,
  phone text,
  preferred_contact_method text not null default 'email' check (preferred_contact_method in ('email', 'phone', 'in_person', 'video')),
  last_contact_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  actor_id uuid references public.actors(id),
  role text not null check (role in ('client', 'driver', 'admin')),
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.actor_supplier_links (
  account_actor_id uuid not null references public.actors(id) on delete cascade,
  supplier_actor_id uuid not null references public.actors(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (account_actor_id, supplier_actor_id),
  constraint account_actor_is_customer check (account_actor_id <> supplier_actor_id)
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actors(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  notice_version text not null,
  consented_at timestamptz not null default now(),
  immutable_note text not null default 'Collection Notice acknowledgement captured at registration'
);

create table public.pickup_requests (
  id uuid primary key default gen_random_uuid(),
  account_actor_id uuid not null references public.actors(id) on delete restrict,
  supplier_actor_id uuid not null references public.actors(id) on delete restrict,
  requested_run_date date not null,
  actual_run_date date not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'assigned', 'picked_up', 'delivered', 'cancelled', 'exception')),
  submitted_by uuid references auth.users(id),
  submitted_at timestamptz not null default now(),
  cut_off_applied boolean not null default false,
  schedule_adjusted boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  run_date date not null,
  status text not null default 'planned' check (status in ('planned', 'compiled', 'in_progress', 'completed', 'exception')),
  driver_profile_id uuid references public.profiles(id),
  vehicle_name text not null,
  compiled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.pickups (
  id uuid primary key default gen_random_uuid(),
  pickup_request_id uuid not null references public.pickup_requests(id) on delete cascade,
  run_id uuid references public.runs(id) on delete set null,
  supplier_actor_id uuid not null references public.actors(id) on delete restrict,
  account_actor_id uuid not null references public.actors(id) on delete restrict,
  item_type text not null check (item_type in ('tyre', 'parts', 'other')),
  tyre_count integer,
  weight_band text check (weight_band in ('lt_5kg', '5_to_15kg', 'gt_15kg')),
  quantity integer not null default 1,
  status text not null default 'pending' check (status in ('pending', 'picked_up', 'no_pickup', 'exception')),
  captured_by uuid references public.profiles(id),
  captured_at timestamptz
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  account_actor_id uuid not null references public.actors(id) on delete restrict,
  pickup_request_id uuid not null references public.pickup_requests(id) on delete restrict,
  status text not null default 'assigned' check (status in ('assigned', 'out_for_delivery', 'delivered', 'failed')),
  expected_items text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.delivery_proof (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null unique references public.deliveries(id) on delete cascade,
  receiver_name text not null,
  signature_path text not null,
  captured_by uuid references public.profiles(id),
  captured_at timestamptz not null default now(),
  retention_until date not null default ((current_date + interval '7 years')::date)
);

create table public.price_rules (
  id uuid primary key default gen_random_uuid(),
  service_variant text not null check (service_variant in ('SVC-MCL-001-T', 'SVC-MCL-001-P', 'REDELIVERY')),
  label text not null,
  item_type text not null check (item_type in ('tyre', 'parts', 'redelivery')),
  tyre_count_min integer,
  tyre_count_max integer,
  weight_band text check (weight_band in ('lt_5kg', '5_to_15kg', 'gt_15kg')),
  rate_cents integer not null check (rate_cents >= 0),
  rate_mode text not null default 'flat' check (rate_mode in ('flat', 'per_item')),
  effective_from date not null,
  effective_to date,
  change_log_id uuid,
  created_at timestamptz not null default now()
);

create table public.master_data_changes (
  id uuid primary key default gen_random_uuid(),
  change_type text not null check (change_type in ('supplier', 'pricing', 'account')),
  target_id uuid not null,
  field text not null,
  old_value text,
  new_value text not null,
  reason text not null,
  status text not null default 'proposed' check (status in ('proposed', 'admin_approved', 'owner_approved', 'ready_for_execution', 'executed', 'rejected')),
  proposed_by uuid references public.profiles(id),
  approved_by_admin uuid references public.profiles(id),
  approved_by_owner text,
  effective_date date,
  logged_at timestamptz not null default now()
);

alter table public.price_rules
  add constraint price_rules_change_log_fk
  foreign key (change_log_id) references public.master_data_changes(id);

create table public.exceptions (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  summary text not null,
  detail text not null,
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

create table public.relationship_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actors(id) on delete cascade,
  event_type text not null check (event_type in ('meeting', 'call', 'email', 'decision', 'issue', 'commitment', 'performance_signal', 'sentiment_signal', 'other')),
  event_date timestamptz not null default now(),
  description text not null,
  outcome text,
  next_action text,
  next_action_owner text,
  next_action_due date,
  created_by uuid references public.profiles(id),
  health_impact text not null default 'neutral' check (health_impact in ('positive', 'neutral', 'negative'))
);

create table public.obligations (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actors(id) on delete cascade,
  obligation_type text not null check (obligation_type in ('contract', 'sla', 'payment_term', 'regulatory_commitment', 'agreed_action', 'other')),
  title text not null,
  description text not null,
  direction text not null check (direction in ('we_owe_them', 'they_owe_us', 'mutual')),
  due_date date,
  status text not null default 'active' check (status in ('active', 'fulfilled', 'overdue', 'disputed', 'terminated')),
  value text,
  risk_if_breached text not null,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('insert', 'update', 'delete', 'select', 'export')),
  pii_action boolean not null default true,
  performed_by uuid,
  performed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table public.retention_queue (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  retention_until date not null,
  status text not null default 'pending_privacy_owner_approval' check (status in ('pending_privacy_owner_approval', 'approved', 'destroyed', 'legal_hold')),
  privacy_owner_approval text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'published', 'retired')),
  source_policy text,
  approved_by text,
  approved_at timestamptz,
  body text
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger actors_touch_updated_at
before update on public.actors
for each row execute function public.touch_updated_at();

create or replace function public.set_delivery_proof_retention_until()
returns trigger
language plpgsql
as $$
begin
  new.retention_until := (new.captured_at::date + interval '7 years')::date;
  return new;
end;
$$;

create trigger delivery_proof_set_retention_until
before insert or update of captured_at on public.delivery_proof
for each row execute function public.set_delivery_proof_retention_until();

-- Delivery cannot be marked delivered unless a proof record exists.
create or replace function public.enforce_delivery_proof()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'delivered' and not exists (
    select 1 from public.delivery_proof where delivery_id = new.id
  ) then
    raise exception 'delivery_proof is required before Delivered status';
  end if;
  return new;
end;
$$;

create constraint trigger deliveries_require_proof
after update of status on public.deliveries
deferrable initially deferred
for each row execute function public.enforce_delivery_proof();

-- Private Supabase Storage bucket for delivery proof assets.
insert into storage.buckets (id, name, public)
values ('delivery-proof', 'delivery-proof', false)
on conflict (id) do update set public = false;

alter table public.actors enable row level security;
alter table public.contacts enable row level security;
alter table public.profiles enable row level security;
alter table public.actor_supplier_links enable row level security;
alter table public.consent_records enable row level security;
alter table public.pickup_requests enable row level security;
alter table public.runs enable row level security;
alter table public.pickups enable row level security;
alter table public.deliveries enable row level security;
alter table public.delivery_proof enable row level security;
alter table public.price_rules enable row level security;
alter table public.master_data_changes enable row level security;
alter table public.exceptions enable row level security;
alter table public.relationship_events enable row level security;
alter table public.obligations enable row level security;
alter table public.audit_log enable row level security;
alter table public.retention_queue enable row level security;
alter table public.legal_documents enable row level security;

-- RLS policy implementation is intentionally not final in this migration.
-- Required source review before production:
-- - Policy #21 Internal Acceptable Use of Data
-- - Policy #7 Information Security
-- - BOAS Sheet 05 Roles & Access model
-- - Supabase project/auth provider decisions
