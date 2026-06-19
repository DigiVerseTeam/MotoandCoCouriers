-- SOP-IAM-03 Admin Master Data & User Provisioning.
--
-- Source: BOAS v1.8 sheets 05, 06, 07, 10, 13, 14 and
-- SOP-IAM-03-AdminMasterDataUserProvisioning.
--
-- This migration adds the confirmed two-tier Admin / Super Admin role model,
-- profile status/link fields, and provisioning audit fields. Auth user creation
-- is still performed only by a server-side API/Edge Function using service_role.
-- The service_role key must never be exposed to the browser.

alter table public.profiles
  add column if not exists email text,
  add column if not exists status text not null default 'active',
  add column if not exists account_id text,
  add column if not exists driver_id text,
  add column if not exists last_reviewed_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_role_check,
  drop constraint if exists profiles_status_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'admin', 'client_ops', 'client_billing', 'driver', 'client')),
  add constraint profiles_status_check
  check (status in ('pending', 'active', 'inactive', 'revoked'));

alter table public.access_role_assignments
  drop constraint if exists access_role_assignments_application_role_check;

alter table public.access_role_assignments
  add constraint access_role_assignments_application_role_check
  check (application_role in ('super_admin', 'admin', 'client_ops', 'client_operational', 'client_billing', 'driver'));

alter table public.master_data_changes
  drop constraint if exists master_data_changes_change_type_check;

alter table public.master_data_changes
  add constraint master_data_changes_change_type_check
  check (change_type in ('supplier', 'pricing', 'account', 'customer', 'driver', 'vehicle', 'user'));

alter table public.master_data_changes
  add column if not exists actor_id uuid references public.profiles(id),
  add column if not exists action_type text,
  add column if not exists entity_type text,
  add column if not exists entity_id text,
  add column if not exists changed_field text,
  add column if not exists approval_reference text,
  add column if not exists changed_at timestamptz not null default now();

create index if not exists profiles_role_status_idx
  on public.profiles (role, status, last_reviewed_at);

create index if not exists master_data_changes_entity_idx
  on public.master_data_changes (entity_type, entity_id, changed_at desc);

create or replace function public.normalise_app_role(input_role text)
returns text
language sql
immutable
as $$
  select case input_role
    when 'client' then 'client_ops'
    when 'client_operational' then 'client_ops'
    when 'billing' then 'client_billing'
    else input_role
  end;
$$;

create or replace function public.has_active_app_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  with required as (
    select public.normalise_app_role(required_role) as role_name
  )
  select
    public.is_service_role()
    or exists (
      select 1
      from public.access_role_assignments ara
      join public.profiles p on p.id = ara.profile_id,
      required
      where ara.profile_id = auth.uid()
        and p.status = 'active'
        and ara.status = 'active'
        and (
          public.normalise_app_role(ara.application_role) = required.role_name
          or (required.role_name = 'admin' and ara.application_role = 'super_admin')
        )
    )
    or exists (
      select 1
      from public.profiles p, required
      where p.id = auth.uid()
        and p.status = 'active'
        and (
          public.normalise_app_role(p.role) = required.role_name
          or (required.role_name = 'admin' and p.role = 'super_admin')
        )
        and not exists (
          select 1
          from public.access_role_assignments revoked
          where revoked.profile_id = p.id
            and public.normalise_app_role(revoked.application_role) = required.role_name
            and revoked.status = 'revoked'
        )
    );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.has_active_app_role('super_admin');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.has_active_app_role('admin');
$$;

create or replace function public.has_actor_app_role(required_role text, target_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  with required as (
    select public.normalise_app_role(required_role) as role_name
  )
  select
    public.is_service_role()
    or exists (
      select 1
      from public.access_role_assignments ara
      join public.profiles p on p.id = ara.profile_id,
      required
      where ara.profile_id = auth.uid()
        and ara.actor_id = target_actor_id
        and p.status = 'active'
        and ara.status = 'active'
        and public.normalise_app_role(ara.application_role) = required.role_name
    )
    or exists (
      select 1
      from public.profiles p, required
      where p.id = auth.uid()
        and p.actor_id = target_actor_id
        and p.status = 'active'
        and required.role_name = 'client_ops'
        and public.normalise_app_role(p.role) = 'client_ops'
        and not exists (
          select 1
          from public.access_role_assignments revoked
          where revoked.profile_id = p.id
            and revoked.actor_id = target_actor_id
            and public.normalise_app_role(revoked.application_role) = required.role_name
            and revoked.status = 'revoked'
        )
    );
$$;

create or replace function public.can_client_operational_account(target_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.has_actor_app_role('client_ops', target_actor_id);
$$;

comment on function public.is_super_admin() is
  'SOP-IAM-03: Super Admin is ACT-INT-003, role=super_admin, one person at launch and the only role that can create Admin users.';

comment on column public.profiles.status is
  'SOP-IAM-03: pending blocks login until the account/profile/role link is confirmed and activated.';

comment on column public.master_data_changes.approval_reference is
  'SOP-IAM-03 provisioning evidence. Required by server-side provisioning API for login users.';
