-- Policy #19 / POL-OPS-019 driver conduct reporting controls.
--
-- Source-backed intent:
-- - Drivers must report incidents, near-misses, complaints, concerns, and
--   suspected supplier/client staff misconduct to Admin.
-- - Drivers must not attempt to resolve supplier/client staff misconduct
--   directly.
-- - Conduct consequences may include removal from the run schedule pending
--   investigation, but the specific disciplinary process must be legally
--   consistent with Policy #12 Driver Agreement and employment classification.
--   This migration records the report/investigation surface only; it does not
--   invent the unresolved disciplinary process.

alter table public.exceptions
  add column if not exists policy19_conduct_category text,
  add column if not exists policy19_driver_reported boolean not null default false,
  add column if not exists policy19_admin_review_note text,
  add column if not exists policy19_legal_process_blocker boolean not null default false,
  add column if not exists policy19_source_ref text;

alter table public.exceptions
  drop constraint if exists exceptions_policy19_conduct_category_check;

alter table public.exceptions
  add constraint exceptions_policy19_conduct_category_check
  check (
    policy19_conduct_category is null
    or policy19_conduct_category in (
      'conduct_complaint_concern',
      'supplier_or_client_staff_misconduct'
    )
  );

alter table public.exceptions
  drop constraint if exists exceptions_policy19_driver_report_check;

alter table public.exceptions
  add constraint exceptions_policy19_driver_report_check
  check (
    policy19_driver_reported = false
    or (
      policy19_conduct_category is not null
      and coalesce(policy19_source_ref, '') like 'Policy #19%'
      and length(btrim(detail)) > 0
    )
  );

alter table public.exceptions
  drop constraint if exists exceptions_policy19_resolved_review_check;

alter table public.exceptions
  add constraint exceptions_policy19_resolved_review_check
  check (
    policy19_driver_reported = false
    or status <> 'resolved'
    or length(btrim(coalesce(policy19_admin_review_note, ''))) > 0
  );

create index if not exists exceptions_policy19_conduct_open_idx
  on public.exceptions (policy19_conduct_category, status)
  where policy19_driver_reported = true;

drop trigger if exists exceptions_policy19_pii_audit on public.exceptions;
create trigger exceptions_policy19_pii_audit
after insert or update or delete on public.exceptions
for each row execute function public.write_pii_audit_log();

comment on column public.exceptions.policy19_conduct_category is
  'Policy #19 conduct report category: conduct/complaint concern or supplier/client staff misconduct.';

comment on column public.exceptions.policy19_legal_process_blocker is
  'Policy #19 open item: disciplinary consequences require consistency with Policy #12 Driver Agreement and legal classification before production enforcement.';

comment on constraint exceptions_policy19_driver_report_check on public.exceptions is
  'Policy #19: driver conduct reports require category, source, and detail before APP-ADM-005 investigation.';

comment on constraint exceptions_policy19_resolved_review_check on public.exceptions is
  'Policy #19: conduct reports cannot be resolved without Admin investigation note.';
