-- Ensure Supabase API roles can reach RLS-protected tables.
--
-- RLS remains the enforcement layer. These grants provide the base table
-- privileges required before RLS policies are evaluated by PostgREST, Auth
-- sessions, and service-role import tooling.

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
grant all privileges on tables to service_role;

alter default privileges in schema public
grant usage, select on sequences to authenticated, service_role;
