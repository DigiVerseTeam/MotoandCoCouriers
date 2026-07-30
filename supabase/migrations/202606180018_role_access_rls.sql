-- Source-backed RLS policy layer for BOAS Sheet 05 Roles & Access.
--
-- This migration intentionally limits itself to confirmed access rules:
-- - ACT-CRM-001a Client Operational Contact: own account/order history,
--   approved supplier list, and pickup request submission while account is active.
-- - ACT-CRM-001b Client Billing Contact: own invoices, billing notices,
--   billing disputes, and account-level commercial records.
-- - ACT-INT-001 Driver: assigned runs, assigned pickup/delivery work,
--   POD capture for assigned deliveries, and own run-close evidence.
-- - ACT-INT-002 Admin / Business Owner: full platform access to operational,
--   billing, CRM, master-data, exception, audit, and access-governance records.
-- - ACT-INT-003 Receiver: no login; receiver data is captured only as POD.
--
-- Still not final without live Supabase/Auth testing, project-region confirmation,
-- and any production RPC/service-role decisions for public registration and
-- proof upload ordering.

create or replace function public.is_service_role()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(auth.role(), '') = 'service_role';
$$;

create or replace function public.has_active_app_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    public.is_service_role()
    or exists (
      select 1
      from public.access_role_assignments ara
      where ara.profile_id = auth.uid()
        and ara.application_role = required_role
        and ara.status = 'active'
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          (required_role = 'admin' and p.role = 'admin')
          or (required_role = 'driver' and p.role = 'driver')
          or (required_role = 'client_operational' and p.role = 'client')
        )
        and not exists (
          select 1
          from public.access_role_assignments revoked
          where revoked.profile_id = p.id
            and revoked.application_role = required_role
            and revoked.status = 'revoked'
        )
    );
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
  select
    public.is_service_role()
    or exists (
      select 1
      from public.access_role_assignments ara
      where ara.profile_id = auth.uid()
        and ara.application_role = required_role
        and ara.actor_id = target_actor_id
        and ara.status = 'active'
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.actor_id = target_actor_id
        and required_role = 'client_operational'
        and p.role = 'client'
        and not exists (
          select 1
          from public.access_role_assignments revoked
          where revoked.profile_id = p.id
            and revoked.actor_id = target_actor_id
            and revoked.application_role = required_role
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
  select public.has_actor_app_role('client_operational', target_actor_id);
$$;

create or replace function public.can_client_billing_account(target_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.has_actor_app_role('client_billing', target_actor_id);
$$;

create or replace function public.can_client_access_account(target_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.can_client_operational_account(target_actor_id)
    or public.can_client_billing_account(target_actor_id);
$$;

create or replace function public.account_accepts_new_pickups(target_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.actors a
    where a.id = target_actor_id
      and a.actor_type = 'customer'
      and a.relationship_status = 'active'
      and not exists (
        select 1
        from public.account_suspensions s
        where s.account_actor_id = a.id
          and s.status = 'active'
      )
  );
$$;

create or replace function public.client_can_submit_pickup(target_account_actor_id uuid, target_supplier_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.can_client_operational_account(target_account_actor_id)
    and public.account_accepts_new_pickups(target_account_actor_id)
    and exists (
      select 1
      from public.actor_supplier_links asl
      where asl.account_actor_id = target_account_actor_id
        and asl.supplier_actor_id = target_supplier_actor_id
        and asl.client_confirmed_at is not null
    );
$$;

create or replace function public.driver_can_access_run(target_run_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.has_active_app_role('driver')
    and exists (
      select 1
      from public.runs r
      where r.id = target_run_id
        and r.driver_profile_id = auth.uid()
    );
$$;

create or replace function public.driver_can_access_pickup_request(target_pickup_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.has_active_app_role('driver')
    and (
      exists (
        select 1
        from public.pickup_requests pr
        join public.runs r on r.id = pr.run_id
        where pr.id = target_pickup_request_id
          and r.driver_profile_id = auth.uid()
      )
      or exists (
        select 1
        from public.pickups p
        join public.runs r on r.id = p.run_id
        where p.pickup_request_id = target_pickup_request_id
          and r.driver_profile_id = auth.uid()
      )
      or exists (
        select 1
        from public.deliveries d
        join public.runs r on r.id = d.run_id
        where d.pickup_request_id = target_pickup_request_id
          and r.driver_profile_id = auth.uid()
      )
    );
$$;

create or replace function public.driver_can_access_delivery(target_delivery_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.has_active_app_role('driver')
    and exists (
      select 1
      from public.deliveries d
      join public.runs r on r.id = d.run_id
      where d.id = target_delivery_id
        and r.driver_profile_id = auth.uid()
    );
$$;

create or replace function public.driver_can_access_actor(target_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.has_active_app_role('driver')
    and (
      exists (
        select 1
        from public.pickup_requests pr
        join public.runs r on r.id = pr.run_id
        where r.driver_profile_id = auth.uid()
          and (pr.account_actor_id = target_actor_id or pr.supplier_actor_id = target_actor_id)
      )
      or
      exists (
        select 1
        from public.pickups p
        join public.runs r on r.id = p.run_id
        where r.driver_profile_id = auth.uid()
          and (p.account_actor_id = target_actor_id or p.supplier_actor_id = target_actor_id)
      )
      or exists (
        select 1
        from public.deliveries d
        join public.runs r on r.id = d.run_id
        where r.driver_profile_id = auth.uid()
          and d.account_actor_id = target_actor_id
      )
    );
$$;

create or replace function public.can_select_actor(target_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_admin()
    or public.can_client_access_account(target_actor_id)
    or public.driver_can_access_actor(target_actor_id)
    or exists (
      select 1
      from public.actor_supplier_links asl
      where asl.supplier_actor_id = target_actor_id
        and public.can_client_operational_account(asl.account_actor_id)
    );
$$;

create or replace function public.client_can_access_pickup_request(target_pickup_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.pickup_requests pr
    where pr.id = target_pickup_request_id
      and public.can_client_operational_account(pr.account_actor_id)
  );
$$;

create or replace function public.can_access_delivery(target_delivery_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_admin()
    or public.driver_can_access_delivery(target_delivery_id)
    or exists (
      select 1
      from public.deliveries d
      where d.id = target_delivery_id
        and public.can_client_operational_account(d.account_actor_id)
    )
    or exists (
      select 1
      from public.invoice_lines il
      join public.invoices i on i.id = il.invoice_id
      where il.delivery_id = target_delivery_id
        and public.can_client_billing_account(i.account_actor_id)
    );
$$;

create or replace function public.can_access_invoice(target_invoice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.invoices i
      where i.id = target_invoice_id
        and public.can_client_billing_account(i.account_actor_id)
    );
$$;

create or replace function public.can_access_delivery_proof(target_delivery_proof_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.delivery_proof dp
    where dp.id = target_delivery_proof_id
      and public.can_access_delivery(dp.delivery_id)
  );
$$;

create or replace function public.prevent_non_admin_pickup_scope_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;

  if new.pickup_request_id is distinct from old.pickup_request_id
    or new.run_id is distinct from old.run_id
    or new.supplier_actor_id is distinct from old.supplier_actor_id
    or new.account_actor_id is distinct from old.account_actor_id
  then
    raise exception 'assigned driver cannot change pickup work scope';
  end if;

  return new;
end;
$$;

drop trigger if exists pickups_non_admin_scope_guard on public.pickups;
create trigger pickups_non_admin_scope_guard
before update on public.pickups
for each row execute function public.prevent_non_admin_pickup_scope_change();

create or replace function public.prevent_non_admin_delivery_scope_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;

  if new.run_id is distinct from old.run_id
    or new.account_actor_id is distinct from old.account_actor_id
    or new.pickup_request_id is distinct from old.pickup_request_id
  then
    raise exception 'assigned driver cannot change delivery work scope';
  end if;

  return new;
end;
$$;

drop trigger if exists deliveries_non_admin_scope_guard on public.deliveries;
create trigger deliveries_non_admin_scope_guard
before update on public.deliveries
for each row execute function public.prevent_non_admin_delivery_scope_change();

create or replace function public.prevent_non_admin_supplier_link_key_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if public.is_service_role() or public.is_admin() then
    return new;
  end if;

  if new.account_actor_id is distinct from old.account_actor_id
    or new.supplier_actor_id is distinct from old.supplier_actor_id
  then
    raise exception 'client cannot change supplier link scope';
  end if;

  return new;
end;
$$;

drop trigger if exists actor_supplier_links_non_admin_key_guard on public.actor_supplier_links;
create trigger actor_supplier_links_non_admin_key_guard
before update on public.actor_supplier_links
for each row execute function public.prevent_non_admin_supplier_link_key_change();

-- Profiles and access governance.
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists access_role_assignments_select_own_or_admin on public.access_role_assignments;
create policy access_role_assignments_select_own_or_admin
on public.access_role_assignments for select to authenticated
using (profile_id = auth.uid() or public.is_admin());

drop policy if exists access_role_assignments_admin_manage on public.access_role_assignments;
create policy access_role_assignments_admin_manage
on public.access_role_assignments for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists access_role_reviews_select_own_or_admin on public.access_role_reviews;
create policy access_role_reviews_select_own_or_admin
on public.access_role_reviews for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.access_role_assignments ara
    where ara.id = access_role_reviews.access_role_assignment_id
      and ara.profile_id = auth.uid()
  )
);

drop policy if exists access_role_reviews_admin_manage on public.access_role_reviews;
create policy access_role_reviews_admin_manage
on public.access_role_reviews for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- CRM/account records.
drop policy if exists actors_select_by_role_scope on public.actors;
create policy actors_select_by_role_scope
on public.actors for select to authenticated
using (public.can_select_actor(id));

drop policy if exists actors_admin_manage on public.actors;
create policy actors_admin_manage
on public.actors for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists contacts_select_by_actor_scope on public.contacts;
create policy contacts_select_by_actor_scope
on public.contacts for select to authenticated
using (public.can_select_actor(actor_id));

drop policy if exists contacts_admin_manage on public.contacts;
create policy contacts_admin_manage
on public.contacts for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists actor_supplier_links_select_by_role_scope on public.actor_supplier_links;
create policy actor_supplier_links_select_by_role_scope
on public.actor_supplier_links for select to authenticated
using (
  public.is_admin()
  or public.can_client_operational_account(account_actor_id)
  or public.driver_can_access_actor(supplier_actor_id)
);

drop policy if exists actor_supplier_links_admin_insert on public.actor_supplier_links;
create policy actor_supplier_links_admin_insert
on public.actor_supplier_links for insert to authenticated
with check (public.is_admin());

drop policy if exists actor_supplier_links_admin_delete on public.actor_supplier_links;
create policy actor_supplier_links_admin_delete
on public.actor_supplier_links for delete to authenticated
using (public.is_admin());

drop policy if exists actor_supplier_links_admin_or_client_confirm_update on public.actor_supplier_links;
create policy actor_supplier_links_admin_or_client_confirm_update
on public.actor_supplier_links for update to authenticated
using (public.is_admin() or public.can_client_operational_account(account_actor_id))
with check (public.is_admin() or public.can_client_operational_account(account_actor_id));

drop policy if exists consent_records_select_own_or_admin on public.consent_records;
create policy consent_records_select_own_or_admin
on public.consent_records for select to authenticated
using (public.is_admin() or public.can_client_access_account(actor_id));

drop policy if exists consent_records_insert_own_or_admin on public.consent_records;
create policy consent_records_insert_own_or_admin
on public.consent_records for insert to authenticated
with check (public.is_admin() or public.can_client_access_account(actor_id));

-- Operational work.
drop policy if exists pickup_requests_select_by_role_scope on public.pickup_requests;
create policy pickup_requests_select_by_role_scope
on public.pickup_requests for select to authenticated
using (
  public.is_admin()
  or public.can_client_operational_account(account_actor_id)
  or public.driver_can_access_pickup_request(id)
);

drop policy if exists pickup_requests_client_insert on public.pickup_requests;
create policy pickup_requests_client_insert
on public.pickup_requests for insert to authenticated
with check (
  public.is_admin()
  or (
    submitted_by = auth.uid()
    and public.client_can_submit_pickup(account_actor_id, supplier_actor_id)
  )
);

drop policy if exists pickup_requests_admin_update on public.pickup_requests;
create policy pickup_requests_admin_update
on public.pickup_requests for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists runs_select_admin_or_assigned_driver on public.runs;
create policy runs_select_admin_or_assigned_driver
on public.runs for select to authenticated
using (public.is_admin() or public.driver_can_access_run(id));

drop policy if exists runs_admin_manage on public.runs;
create policy runs_admin_manage
on public.runs for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists pickups_select_by_role_scope on public.pickups;
create policy pickups_select_by_role_scope
on public.pickups for select to authenticated
using (
  public.is_admin()
  or public.can_client_operational_account(account_actor_id)
  or public.driver_can_access_run(run_id)
);

drop policy if exists pickups_driver_update_assigned on public.pickups;
create policy pickups_driver_update_assigned
on public.pickups for update to authenticated
using (public.driver_can_access_run(run_id) or public.is_admin())
with check (public.driver_can_access_run(run_id) or public.is_admin());

drop policy if exists pickups_admin_insert on public.pickups;
create policy pickups_admin_insert
on public.pickups for insert to authenticated
with check (public.is_admin());

drop policy if exists deliveries_select_by_role_scope on public.deliveries;
create policy deliveries_select_by_role_scope
on public.deliveries for select to authenticated
using (
  public.is_admin()
  or public.can_client_operational_account(account_actor_id)
  or public.driver_can_access_run(run_id)
);

drop policy if exists deliveries_driver_update_assigned on public.deliveries;
create policy deliveries_driver_update_assigned
on public.deliveries for update to authenticated
using (public.driver_can_access_run(run_id) or public.is_admin())
with check (public.driver_can_access_run(run_id) or public.is_admin());

drop policy if exists deliveries_admin_insert on public.deliveries;
create policy deliveries_admin_insert
on public.deliveries for insert to authenticated
with check (public.is_admin());

drop policy if exists delivery_proof_select_by_role_scope on public.delivery_proof;
create policy delivery_proof_select_by_role_scope
on public.delivery_proof for select to authenticated
using (public.can_access_delivery_proof(id));

drop policy if exists delivery_proof_driver_insert_assigned on public.delivery_proof;
create policy delivery_proof_driver_insert_assigned
on public.delivery_proof for insert to authenticated
with check (
  public.is_admin()
  or (
    captured_by = auth.uid()
    and public.driver_can_access_delivery(delivery_id)
  )
);

drop policy if exists run_closures_select_by_role_scope on public.run_closures;
create policy run_closures_select_by_role_scope
on public.run_closures for select to authenticated
using (
  public.is_admin()
  or (
    driver_profile_id = auth.uid()
    and public.has_active_app_role('driver')
  )
);

drop policy if exists run_closures_driver_insert_own on public.run_closures;
create policy run_closures_driver_insert_own
on public.run_closures for insert to authenticated
with check (
  public.is_admin()
  or (
    driver_profile_id = auth.uid()
    and public.has_active_app_role('driver')
  )
);

drop policy if exists driver_availability_select_admin_or_own_driver on public.driver_availability;
create policy driver_availability_select_admin_or_own_driver
on public.driver_availability for select to authenticated
using (
  public.is_admin()
  or (
    driver_profile_id = auth.uid()
    and public.has_active_app_role('driver')
  )
);

drop policy if exists driver_availability_admin_manage on public.driver_availability;
create policy driver_availability_admin_manage
on public.driver_availability for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Billing, notices, disputes, and suspension.
drop policy if exists invoices_select_admin_or_billing_contact on public.invoices;
create policy invoices_select_admin_or_billing_contact
on public.invoices for select to authenticated
using (public.can_access_invoice(id));

drop policy if exists invoices_admin_manage on public.invoices;
create policy invoices_admin_manage
on public.invoices for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists invoice_lines_select_via_invoice on public.invoice_lines;
create policy invoice_lines_select_via_invoice
on public.invoice_lines for select to authenticated
using (
  public.is_admin()
  or public.can_access_invoice(invoice_id)
);

drop policy if exists invoice_lines_admin_manage on public.invoice_lines;
create policy invoice_lines_admin_manage
on public.invoice_lines for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists billing_notices_select_by_role_scope on public.billing_notices;
create policy billing_notices_select_by_role_scope
on public.billing_notices for select to authenticated
using (
  public.is_admin()
  or public.can_client_billing_account(account_actor_id)
  or (
    notice_type in ('suspension', 'reinstatement')
    and public.can_client_operational_account(account_actor_id)
  )
);

drop policy if exists billing_notices_admin_manage on public.billing_notices;
create policy billing_notices_admin_manage
on public.billing_notices for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists account_suspensions_select_by_role_scope on public.account_suspensions;
create policy account_suspensions_select_by_role_scope
on public.account_suspensions for select to authenticated
using (
  public.is_admin()
  or public.can_client_access_account(account_actor_id)
);

drop policy if exists account_suspensions_admin_manage on public.account_suspensions;
create policy account_suspensions_admin_manage
on public.account_suspensions for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists disputes_select_by_role_scope on public.disputes;
create policy disputes_select_by_role_scope
on public.disputes for select to authenticated
using (
  public.is_admin()
  or public.can_client_access_account(account_actor_id)
);

drop policy if exists disputes_client_insert_own on public.disputes;
create policy disputes_client_insert_own
on public.disputes for insert to authenticated
with check (
  public.is_admin()
  or (
    dispute_type = 'delivery'
    and public.can_client_operational_account(account_actor_id)
  )
  or (
    dispute_type = 'billing'
    and public.can_client_billing_account(account_actor_id)
  )
);

drop policy if exists disputes_admin_update on public.disputes;
create policy disputes_admin_update
on public.disputes for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists operational_notices_select_by_audience_scope on public.operational_notices;
create policy operational_notices_select_by_audience_scope
on public.operational_notices for select to authenticated
using (
  public.is_admin()
  or (
    audience = 'client_operational'
    and public.can_client_operational_account(account_actor_id)
  )
  or (
    audience = 'client_billing'
    and public.can_client_billing_account(account_actor_id)
  )
);

drop policy if exists operational_notices_admin_manage on public.operational_notices;
create policy operational_notices_admin_manage
on public.operational_notices for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Master data, exception monitoring, audit, retention, and legal surfaces.
drop policy if exists price_rules_admin_only on public.price_rules;
create policy price_rules_admin_only
on public.price_rules for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists master_data_changes_admin_only on public.master_data_changes;
create policy master_data_changes_admin_only
on public.master_data_changes for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists supplier_master_data_review_flags_admin_only on public.supplier_master_data_review_flags;
create policy supplier_master_data_review_flags_admin_only
on public.supplier_master_data_review_flags for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists pricing_master_data_review_flags_admin_only on public.pricing_master_data_review_flags;
create policy pricing_master_data_review_flags_admin_only
on public.pricing_master_data_review_flags for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists exceptions_admin_only on public.exceptions;
create policy exceptions_admin_only
on public.exceptions for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists exception_alerts_admin_only on public.exception_alerts;
create policy exception_alerts_admin_only
on public.exception_alerts for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists relationship_events_admin_only on public.relationship_events;
create policy relationship_events_admin_only
on public.relationship_events for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists obligations_admin_only on public.obligations;
create policy obligations_admin_only
on public.obligations for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists audit_log_admin_select on public.audit_log;
create policy audit_log_admin_select
on public.audit_log for select to authenticated
using (public.is_admin());

drop policy if exists audit_log_system_insert on public.audit_log;
create policy audit_log_system_insert
on public.audit_log for insert to authenticated
with check (public.is_admin() or performed_by = auth.uid());

drop policy if exists retention_queue_admin_select on public.retention_queue;
create policy retention_queue_admin_select
on public.retention_queue for select to authenticated
using (public.is_admin());

drop policy if exists legal_documents_public_published_select on public.legal_documents;
create policy legal_documents_public_published_select
on public.legal_documents for select to anon, authenticated
using (status = 'published' or public.is_admin());

drop policy if exists legal_documents_admin_manage on public.legal_documents;
create policy legal_documents_admin_manage
on public.legal_documents for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Initial private delivery-proof storage reads are scoped to the linked
-- immutable proof row. Migration 202606180020 adds the controlled object path,
-- assigned-driver/Admin object insert policy, and retention queue trigger.
drop policy if exists delivery_proof_objects_read_by_linked_role on storage.objects;
create policy delivery_proof_objects_read_by_linked_role
on storage.objects for select to authenticated
using (
  bucket_id = 'delivery-proof'
  and exists (
    select 1
    from public.delivery_proof dp
    where dp.signature_path = storage.objects.name
      and public.can_access_delivery(dp.delivery_id)
  )
);

comment on function public.has_active_app_role(text) is
  'BOAS Sheet 05 role check for active Admin, Driver, Client Operational, or Client Billing access. Receiver has no login role.';

comment on function public.client_can_submit_pickup(uuid, uuid) is
  'APP-ADM-001 / BOAS Sheet 05 guard: Client Operational Contact can submit only for own active, unsuspended account and confirmed approved supplier link.';

comment on policy price_rules_admin_only on public.price_rules is
  'BOAS Sheet 05 and Sheet 06: Driver cannot read or modify price_rules directly; pricing is applied server-side and Admin governs master data.';
