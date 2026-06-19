-- CAP-MCL-002 / APP-ADM-002 run planning governance monitor.
-- Source rule: runs are compiled the night before with a named driver,
-- named vehicle, and APP-FLT-001 compliance gate. Live pg_cron automation
-- remains a production setup task; this migration stores governance evidence.

alter table public.runs
  add column if not exists expected_compile_date date,
  add column if not exists compiled_night_before boolean not null default false,
  add column if not exists admin_intervention_required boolean not null default false,
  add column if not exists admin_intervention_reason text,
  add column if not exists run_planning_exception_id uuid references public.exceptions(id) on delete set null;

alter table public.runs
  drop constraint if exists runs_cap_mcl002_compile_timing_check;

alter table public.runs
  add constraint runs_cap_mcl002_compile_timing_check
  check (
    expected_compile_date is null
    or run_date is null
    or expected_compile_date = (run_date - interval '1 day')::date
  );

alter table public.runs
  drop constraint if exists runs_admin_intervention_requires_reason;

alter table public.runs
  add constraint runs_admin_intervention_requires_reason
  check (
    admin_intervention_required = false
    or length(btrim(coalesce(admin_intervention_reason, ''))) > 0
  );

alter table public.exceptions
  drop constraint if exists exceptions_run_planning_source_check;

alter table public.exceptions
  add constraint exceptions_run_planning_source_check
  check (
    type <> 'Run Planning Exception'
    or source = 'CAP-MCL-002 / APP-ADM-002 / POL-MCL-002-001'
  );

create index if not exists runs_expected_compile_date_idx
  on public.runs (expected_compile_date, status);

create index if not exists exceptions_run_planning_open_idx
  on public.exceptions (order_id, status)
  where type = 'Run Planning Exception';

comment on column public.runs.expected_compile_date is
  'CAP-MCL-002: night-before APP-ADM-002 compilation due date, one calendar day before run_date.';

comment on column public.runs.compiled_night_before is
  'CAP-MCL-002 governance evidence. True only when APP-ADM-002 compilation occurred by expected_compile_date.';

comment on column public.runs.admin_intervention_required is
  'CAP-MCL-002 target is zero Admin intervention under normal operating conditions. True records exception handling only.';

comment on column public.runs.run_planning_exception_id is
  'APP-ADM-005 exception linked when APP-ADM-002 cannot resolve night-before compilation, driver/vehicle assignment, or fleet gate.';
