-- First-login supplier setup confirmation for UJ-CRM-001A.
-- Production RLS still depends on Supabase Auth identity binding and Policy #21 review.

alter table public.actors
  add column if not exists first_login_supplier_setup_confirmed_at timestamptz,
  add column if not exists first_login_supplier_setup_confirmed_by uuid references public.profiles(id),
  add column if not exists first_login_supplier_setup_note text;

alter table public.actor_supplier_links
  add column if not exists client_confirmed_at timestamptz,
  add column if not exists client_confirmed_by uuid references public.profiles(id);

comment on column public.actors.first_login_supplier_setup_confirmed_at is
  'Client Operational Contact first-login supplier preference confirmation timestamp.';

comment on column public.actor_supplier_links.client_confirmed_at is
  'Per-link client confirmation timestamp from the first-login supplier setup workflow.';
