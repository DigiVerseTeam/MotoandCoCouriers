# Baseline TBD Approval Register

Last updated: 2026-07-02

Purpose: surface the remaining `TBD` decisions from the v2.0 baseline pack so the Owner/Admin can approve, reject, or keep each item open. This register does not fill gaps. It states the decision needed and the effect of approval or rejection.

## Owner Responses Received 2026-07-02

| ID | Response recorded | Current decision state |
| --- | --- | --- |
| TBD-001 | Approved. Baseline v2.0 is the source of truth for all testing. | Approved |
| TBD-002 | Approved. | Approved |
| TBD-003 | Approved. | Approved |
| TBD-004 | Approved. | Approved |
| TBD-005 | Policy/legal owner should be a Moto & Co Logistics role. No named person supplied. | Role approved; named assignee still open |
| TBD-006 | Privacy Owner is role-based: GM Moto & Co Logistics. | Approved |
| TBD-007 | Legal pages supplied and require updating against policy changes. | Draft update required; not final legal approval |
| TBD-008 | Australia/Sydney database confirmed by Owner response, but evidence/UAT still required. | Approved in principle; evidence required |
| TBD-009 | Still requires UAT. System testing is not complete. | Needs UAT |
| TBD-010 | Process approved. System testing failed. | Process approved; retest required |
| TBD-011 | System testing completion cannot be confirmed. UAT scripts required. | Needs UAT scripts/evidence |
| TBD-012 | Security schedule/DPA not required for V1. | Not required |
| TBD-013 | Approved for V1 UAT evidence; supported device/browser must be captured during testing and re-executed after ERD approval/schema reconciliation. | Approved; UAT required |
| TBD-014 | Approved for V1 UAT evidence; local outbox/cache remains only until sync or Admin recovery succeeds, then is cleared. | Approved; UAT required |
| TBD-015 | Approved for V1 UAT evidence; clearing saved device data must warn that unsynced records can be abandoned. | Approved; UAT required |
| TBD-016 | Approved for V1 UAT evidence; Admin reconstructs unrecoverable updates from driver evidence and records recovery audit. | Approved; UAT required |
| TBD-017 | Approved for V1; POD photos are not mandatory. Receiver name and signature remain mandatory. | Approved; UAT required |
| TBD-018 | V1 runtime only generates downloadable invoice PDFs. Admin emails each invoice manually outside the system. | Approved |
| TBD-019 | Invoice email handling is an off-system human process. No runtime email/bounce workflow is required for V1. | Approved; out of runtime scope |
| TBD-020 | Payment evidence and bank reconciliation are off-system human processes after the downloadable PDF. | Approved; out of runtime scope |
| TBD-021 | BAS/accountant handoff is out of runtime scope for V1. | Approved; out of runtime scope |
| TBD-022 | Accounting API/OpenClaw/Xero integration is removed from the V1 baseline. | Approved; removed from V1 |
| TBD-023 | Runtime billing scope remains invoice PDF download only; pricing stays table-driven with existing Admin/Owner governance. | Approved |
| TBD-024 | Policy #22 source could not be reviewed by Owner; keep scheduling-cadence approval open until source is surfaced. | Keep open |
| TBD-025 | Previous evening-before lockdown rejected. New requirement: driver creates daily run from ready con notes and may collect three package types at depot. | Approved as new build requirement |
| TBD-026 | Supplier governance stays light-touch for V1. | Approved |
| TBD-027 | Privacy Owner role is GM Moto & Co Logistics; NDB templates/handoff artefacts still require evidence. | Partially resolved |
| TBD-028 | Draft ERD created; approve ERD and schema reconciliation before further build. | Draft created; approval required |
| TBD-029 | Current runtime red/coral state-colour direction approved for V1. | Approved |
| TBD-030 | Current simple UI/icon approach approved for V1; no new icon library required now. | Approved |

Status values:

- `Needs approval` means the business can approve/reject now.
- `Needs evidence` means the rule is agreed in principle but proof is still required.
- `Keep open` means the item should stay out of V1 until a later decision.

## Owner Approval Items

| ID | Area | Decision to approve or reject | Proposed V1 position | If approved | If rejected / kept open | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TBD-001 | Baseline pack | Approve `baseline/v2.0/` as the current draft baseline for V1 testing. | Use v2.0 baseline pack as the working source for build/test decisions. | Future software changes check against v2.0 first. | Do not treat v2.0 as controlling; keep working from older docs plus ad hoc decisions. | Approved - source of truth for all testing |
| TBD-002 | BOAS | Approve BOAS v2.0 draft workbook as the current BOAS baseline. | `MotoCo_Unified_BOAS_Hierarchy_v2.0.xlsx` supersedes v1.9 for V1 build alignment. | Actors, roles, controls, objects, and journeys use v2.0. | BOAS remains unapproved and source tension stays open. | Approved |
| TBD-003 | SOPs | Approve the v2 SOP workbook set, including SOP-OPS-01 offline device sync. | 27 SOP workbooks in `baseline/v2.0/full-source/SOP/` are the working SOP set. | V1 testing follows the recreated SOP set. | Keep SOPs as draft only; do not claim SOP alignment. | Approved |
| TBD-004 | User journeys | Approve the v2 journey set as the current journey baseline. | Customer, Admin, Driver, and gap-register records in `baseline/v2.0/full-source/journeys/` are the active journey baseline. | Testing uses the updated journeys. | Journey gap alignment remains open. | Approved |
| TBD-005 | Policy ownership | Name the Policy Owner/legal owner for approving policy v2.0 drafts. | Policy/legal owner is a Moto & Co Logistics role; named assignee remains open. | Policy approval can proceed once the role assignee/authority is recorded. | Policies remain draft and not legally relied on. | Role approved; named assignee open |
| TBD-006 | Privacy ownership | Name the Privacy Owner for Privacy, Collection Notice, Retention, NDB, and data-use decisions. | Privacy Owner is the role-based GM Moto & Co Logistics. | Privacy controls can reference the GM Moto & Co Logistics role for V1 approval and UAT evidence. | Privacy/NDB/destruction decisions remain blocked. | Approved |
| TBD-007 | Public legal pages | Approve whether public `/legal` can remain unpublished/placeholder until legal copy is approved. | Supplied legal pages must be updated against policy v2.0 changes before publication. | Website avoids publishing stale legal terms. | Public legal content must be supplied before launch. | Draft update required; not final legal approval |

## Platform And Security Evidence

| ID | Area | Decision to approve or reject | Proposed V1 position | If approved | If rejected / kept open | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TBD-008 | Supabase region/data residency | Confirm the production Supabase project region and Australian data residency position. | Australia/Sydney database accepted by Owner response; independent project evidence still required. | Policies can include Australia/Sydney as the intended/accepted data location once evidence is attached. | Privacy/data-location wording stays blocked. | Approved in principle; evidence/UAT required |
| TBD-009 | Auth/RLS proof | Approve live Auth/RLS UAT evidence before treating access boundaries as final. | Super Admin, Admin, Client Ops, Client Billing, Driver, and Receiver boundaries must be tested live. | Role/security model can be treated as production-tested. | RLS remains draft despite code existing. | Needs UAT; system testing not complete |
| TBD-010 | Storage/POD proof | Approve live private Supabase Storage test evidence for signature/POD objects. | Receiver name/signature required; POD stored private; storage path and retention must be proven live. | POD storage rule can be treated as production-tested after retest passes. | POD proof remains a production assurance gap. | Process approved; system test failed; retest required |
| TBD-011 | Production access logs | Confirm what Digiverse/Supabase production access-log evidence is retained. | Production access to PII/POD/billing data must be auditable. | Policy #21 / Policy #7 can be completed. | Data-use/access logging remains open. | Not complete; UAT evidence required |
| TBD-012 | Security schedule/DPA | Confirm whether Digiverse provides a data-processing agreement or security schedule. | Not required for V1 per Owner response on 2026-07-02. | No V1 testing blocker remains for this item. | External processor assurance would remain open. | Not required |

## Offline Driver Mode

| ID | Area | Decision to approve or reject | Proposed V1 position | If approved | If rejected / kept open | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TBD-013 | Supported device/browser | Approve the minimum driver device/browser for offline mode. | Approved for UAT: the actual supported device/browser must be captured in test evidence and re-executed after ERD approval/schema reconciliation because the runtime is currently broken. | SOP-OPS-01 can state the supported hardware/software baseline once UAT evidence is retained. | Offline support remains best-effort, not guaranteed. | Approved; UAT required |
| TBD-014 | Local cache retention | Approve how long unsynced local outbox/cache data may remain on a driver device. | Approved for V1: keep local outbox/cache only until sync or Admin recovery succeeds, then clear. Re-test after ERD approval/schema reconciliation. | Policy #5 and SOP-OPS-01 can use the sync/recovery-cleared rule. | Retention/destruction remains Privacy Owner-blocked. | Approved; UAT required |
| TBD-015 | Clear-device-data risk | Approve the warning that clearing saved device data can abandon unsynced records. | Approved: app must warn driver/Admin before clearing saved device data. Re-test after ERD approval/schema reconciliation. | Recovery workflow is documented and testable. | Local data recovery remains unclear. | Approved; UAT required |
| TBD-016 | Unrecoverable outbox procedure | Approve what Admin does if a driver device cannot sync pending local updates. | Approved: Admin reviews driver evidence, reconstructs status/POD manually, and records recovery audit note. Re-test after ERD approval/schema reconciliation. | Offline failure path is operationally clear. | Recovery remains ad hoc after network/device failure. | Approved; UAT required |
| TBD-017 | POD photos | Decide whether POD photos are excluded, optional, conditional, or mandatory. | Approved: photos are not mandatory for V1; receiver name and signature remain mandatory; GPS remains not required. Re-test after ERD approval/schema reconciliation. | POD scope is clear for drivers and privacy notices. | Driver/POD evidence expectations remain ambiguous. | Approved; UAT required |

## Billing And Revenue

| ID | Area | Decision to approve or reject | Proposed V1 position | If approved | If rejected / kept open | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TBD-018 | Invoice PDF/manual email boundary | Approve whether the runtime ends at downloadable EOM invoice PDF generation. | Runtime scope ends at downloadable EOM invoice PDF. Manual emailing is performed outside the system by Admin. | Billing runtime remains simple and auditable at PDF generation only. | Invoice-send proof would need a separate runtime evidence workflow. | Approved; off-system |
| TBD-019 | Bounce/non-delivery handling | Approve what happens if an invoice email bounces or is not received. | Bounce/non-delivery handling is an off-system human process, not a V1 runtime workflow. | No runtime email/bounce feature is required. | Failed invoice delivery remains unmanaged. | Approved; out of runtime scope |
| TBD-020 | Payment source | Confirm where payment evidence comes from. | Payment evidence and bank reconciliation are handled outside the runtime as human/accounting processes after invoice PDF issue. | Runtime does not need bank reconciliation or payment-source automation. | Payment reconciliation remains incomplete. | Approved; out of runtime scope |
| TBD-021 | BAS/accountant handoff | Name the external accountant or BAS/tax handoff process. | BAS/accountant handoff is outside the V1 runtime. | No BAS/accountant workflow is required inside the app. | BAS/tax handoff remains outside the app without evidence. | Approved; out of runtime scope |
| TBD-022 | Accounting integrations removed from V1 | Confirm whether any OpenClaw/Xero/API accounting path remains in V1 scope. | Remove API/OpenClaw/Xero accounting-integration considerations from the V1 baseline. | Scope remains stable: downloadable PDF only. | None for V1 runtime; manual email/payment/bank reconciliation are out-of-system processes. | Approved; removed from V1 |
| TBD-023 | Price-change authority | Decide whether Admin directly applies approved production price changes or Digiverse executes them after Admin + Owner approval. | Pricing remains table-driven with existing Admin/Owner governance; no additional billing runtime is added. | SOP-MDM-02/Policy #9 can stay aligned to table-driven Admin-managed prices. | Production pricing authority remains a control gap. | Approved for V1 |

## Operations And Compliance

| ID | Area | Decision to approve or reject | Proposed V1 position | If approved | If rejected / kept open | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TBD-024 | Driver scheduling cadence | Decide daily driver availability entry vs exception-only availability. | Owner could not locate Policy #22 source for approval. Keep open until the source is surfaced and reviewed. | Policy #22 and driver workflow can be finalized after source review. | Scheduling evidence remains open. | Keep open |
| TBD-025 | Evening-before run cut-off | Confirm exact production cut-off for compiling next-day runs. | Previous evening-before lockdown is rejected. New approved requirement: driver uses `Create Daily Run` to consolidate ready con notes; at each depot driver can collect planned milk-run packages, bring-forward next-day packages, and ready packages with no con note/customer missed portal entry. | Run planning moves to driver-created daily run workflow after ERD approval, schema reconciliation, and runtime build. | Run compiler remains less precise. | Approved as new build requirement |
| TBD-026 | Supplier governance | Approve named dock contacts, supplier review cadence, and supplier health scoring. | Keep supplier governance light-touch for V1. Active supplier list remains controlled; advanced health scoring is not required now. | Supplier governance remains simple and does not block V1. | Supplier list works, but relationship governance remains light. | Approved |
| TBD-027 | NDB process artefacts | Approve OAIC/affected-person templates, public statement process, and Digiverse incident handoff evidence. | Privacy Owner role is GM Moto & Co Logistics. Specific OAIC/affected-person/public statement/Digiverse handoff artefacts still require evidence. | NDB workflow can use the GM role for Privacy Owner gates once artefacts exist. | Breach process remains blocked. | Partially resolved |
| TBD-028 | ERD | Approve ERD format, schema reconciliation decisions, and timing before further build. | ERD draft created at `docs/entity-relationship-diagram-v2.0.md`; migration-state and role-model reconciliation remain required. | ERD can now be reviewed and used as the gate before further schema/runtime work. | Schema changes remain harder to control if ERD approval is skipped. | Draft created; approval required |
| TBD-029 | UI state colours | Approve exact error/warning/success colour mapping. | Current runtime red/coral state-colour direction is approved for V1. | UI governance is sufficient for V1. | UI can keep current app styling without formal semantic colour control. | Approved |
| TBD-030 | Icon library | Approve icon library or continue with current simple UI. | Current simple UI/icon approach is approved for V1; no new icon library is required now. | UI remains stable for V1. | Keep current visuals without icon-system governance. | Approved |

## How To Approve

Reply with decisions using the IDs above, for example:

```text
TBD-001 approved: Owner approved baseline pack v2.0 for V1 testing, 2026-07-02.
TBD-006 rejected: no named Privacy Owner yet, keep open.
TBD-018 approved: retain sent email PDF/screenshot and invoice filename.
```

When a row is approved, update:

1. `docs/decision-log.md`.
2. This register.
3. The affected BOAS/SOP/policy/journey source file.
4. `docs/open-questions.md`.
5. The runtime only if the decision changes software behaviour.
