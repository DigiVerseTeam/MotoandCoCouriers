-- CAP-MCL-001 / POL-MCL-001-001 supplier approval gate.
-- Source rule: no supplier is added to the approved pickup network without
-- Admin confirmation that dock access, packaging standards, and pickup window
-- have been agreed in writing. Named dock contacts remain a documented source gap.

alter table public.actors
  add column if not exists dock_contact_name text,
  add column if not exists dock_access_agreed boolean not null default false,
  add column if not exists packaging_standards_agreed boolean not null default false,
  add column if not exists pickup_window_agreed boolean not null default false,
  add column if not exists supplier_approval_evidence_ref text;

alter table public.actors
  drop constraint if exists actors_supplier_approval_gate_cap_mcl001;

alter table public.actors
  add constraint actors_supplier_approval_gate_cap_mcl001
  check (
    actor_type <> 'supplier'
    or relationship_status <> 'active'
    or (
      dock_access_agreed is true
      and packaging_standards_agreed is true
      and pickup_window_agreed is true
      and length(btrim(coalesce(supplier_approval_evidence_ref, ''))) > 0
    )
  );

create index if not exists actors_supplier_approval_gate_idx
  on public.actors (relationship_status, last_reviewed)
  where actor_type = 'supplier';

comment on column public.actors.dock_contact_name is
  'CAP-MCL-001 named supplier Logistics/Dock Contact. Current source marks all six names unresolved until Admin confirms real people.';

comment on column public.actors.dock_access_agreed is
  'POL-MCL-001-001 approval gate evidence: dock access agreed in writing before supplier can be active.';

comment on column public.actors.packaging_standards_agreed is
  'POL-MCL-001-001 approval gate evidence: packaging standards agreed in writing before supplier can be active.';

comment on column public.actors.pickup_window_agreed is
  'POL-MCL-001-001 approval gate evidence: pickup window agreed in writing before supplier can be active.';

comment on column public.actors.supplier_approval_evidence_ref is
  'Reference to the written supplier approval evidence required by CAP-MCL-001 / POL-MCL-001-001.';
