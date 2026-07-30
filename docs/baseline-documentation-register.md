# Baseline Documentation Register

Last updated: 2026-07-03

Status: active reconciliation register.

Purpose: keep BOAS, SOP, policy, journey, and runtime documentation aligned before more software changes are made. This register does not replace the formal source files. It records what must be updated, what has been reconciled in the working documentation, and what still needs owner or legal approval.

Principle: do not fill gaps. If a rule is not confirmed, mark it `TBD` and keep it visible.

## Versioned Baseline Pack

The current recreated baseline pack is:

- Folder: `baseline/v2.0/`.
- Pack version: v2.0.
- Status: Draft for approval.
- Version register: `baseline/v2.0/version-control-register.csv`.
- Full source folder: `baseline/v2.0/full-source/`.
- TBD approval register: `docs/baseline-tbd-approval-register.md`.
- System/UAT scripts: `docs/system-testing-status-and-uat-scripts.md`.
- Legal page reconciliation: `docs/legal-pages-policy-reconciliation.md`.

Versioned documents:

- `MotoCo_Baseline_Documentation_Control_v2.0.docx`.
- `MotoCo_BOAS_Baseline_Addendum_v2.0.docx`.
- `MotoCo_SOP_Baseline_Addendum_v1.3.docx`.
- `MotoCo_Policy_Baseline_Addendum_v2.0.docx`.

Full recreated source outputs:

- `baseline/v2.0/full-source/BOAS/MotoCo_Unified_BOAS_Hierarchy_v2.0.xlsx`.
- `baseline/v2.0/full-source/SOP/` versioned SOP workbook set.
- `baseline/v2.0/full-source/policies/` versioned policy DOCX set.
- `baseline/v2.0/full-source/journeys/` versioned journey records.
- `baseline/v2.0/full-source/MotoCo_BOAS_v2.0_Draft.zip`.
- `baseline/v2.0/full-source/MotoCo_SOPs_v2.0_Draft.zip`.
- `baseline/v2.0/full-source/MotoCo_Policies_v2.0_Draft.zip`.
- `baseline/v2.0/full-source/MotoCo_Journeys_v2.0_Draft.zip`.
- `baseline/v2.0/MotoCo_Full_Baseline_v2.0_Draft.zip`.
- `baseline/v2.0/MotoCo_Baseline_v2.0_Documentation_Pack.zip`.
- `baseline/v2.0/tbd-approval-register.csv`.
- `baseline/v2.0/uat-test-scripts-v1.csv`.
- `src/content/legal/motoandco-legal-pages.v2.html`.
- `baseline/v2.0/full-source/legal/MotoCo_Legal_Pages_v2.0_Draft.html`.
- `docs/software-scope-v2.0.md`.
- `docs/entity-relationship-diagram-v2.0.md`.
- `docs/software-build-traceability-v2.0.md`.

The old policy zip archives and BOAS v1.9 workbook remain preserved as source evidence. They have not been overwritten.

## Current Baseline Position

| Baseline asset | Current source | Working reconciliation status | Formal update still needed |
| --- | --- | --- | --- |
| BOAS | `MotoCo_Unified_BOAS_Hierarchy_v1.9.xlsx` | Full v2.0 draft recreated at `baseline/v2.0/full-source/BOAS/MotoCo_Unified_BOAS_Hierarchy_v2.0.xlsx`. | Owner approval reference remains TBD. Do not silently overwrite v1.9. |
| SOP library | `SOP/` latest manifest and root SOP zip archives | Full SOP draft set recreated under `baseline/v2.0/full-source/SOP/`. | Owner approval reference remains TBD. Minimum device/browser and recovery details remain TBD. |
| Policies | Root policy zip archives | Full policy draft set recreated under `baseline/v2.0/full-source/policies/`. | Policy Owner/legal owner approval remains TBD before legal reliance/publication. |
| User journeys | `customer journey.zip`, `user journeys and gaps.zip`, journey rules in docs | Journey draft set recreated under `baseline/v2.0/full-source/journeys/`. | Owner approval reference remains TBD. |
| Runtime source map | `docs/release-one-source-map.md` | Active working map for source-backed implementation rules. | Keep updated after every approved baseline decision. |
| Software scope | `docs/software-scope-v2.0.md` | Draft v2.0 scope boundary created to define runtime vs out-of-system business process. | Owner approval reference remains TBD. |
| ERD | `docs/entity-relationship-diagram-v2.0.md` | Draft v2.0 ERD created from visible migrations, seed data, and approved logical objects. | Owner/Digiverse approval and migration-state reconciliation remain required before build. |
| Build traceability | `docs/software-build-traceability-v2.0.md` | Draft v2.0 plain-English build map created to show what is built, out of runtime, or approved but not live. | Owner review and UAT evidence remain required. |
| Decision log | `docs/decision-log.md` | Active dated decision record. | Every new baseline change must be logged here before implementation. |
| Open questions | `docs/open-questions.md` | Active gap register. | Close items only when approved source evidence exists. |
| Production blockers | `docs/production-blocker-register.md` | Active production gate. | Keep policy, platform, and integration blockers visible until resolved. |

## Baseline Changes Since BOAS v1.9

| Area | Confirmed V1 rule | Baseline update required |
| --- | --- | --- |
| Production runtime | Active portal is `https://motoandcocouriers.vercel.app`; active Supabase project ref is `fhrqfrhqopicekaiibyj`. | BOAS platform/config sheets and architecture docs must identify these as the active V1 test targets while region, RLS, Storage, monitoring, and ownership evidence remain open. |
| Login and provisioning | Simplified Customer Login / Courier Business Login; Super Admin and Admin provisioning; Receiver remains no-login. | BOAS actors, roles/access, and journeys must keep the two-entry login model and Super Admin provisioning path. |
| Offline driver operation | Driver device can store local updates during network dropouts and retry sync later. Live records are not updated until sync succeeds. | BOAS controls/risks, SOP register, data objects, roles/access, and policy impact docs must include local device cache, outbox, retry, failure, and Admin recovery rules. |
| Driver pickup workflow | Driver counts tyres/parts/returns at pickup, then moves completed con notes to sign-off. Delivery sign-off verifies pickup-counted items, price, receiver name, and signature. Receiver phone is not required. | Driver journey, SOP-PUP-02, SOP-DEL-04, SOP-DEL-05, pricing/billing, and POD evidence sections require formal alignment. |
| Driver daily run workflow | Previous evening-before lockdown is rejected. Driver must be able to create the daily run from ready con notes and, at each depot, collect planned milk-run packages, bring forward ready next-day packages, or record ready packages with no con note/customer missed portal entry. | ERD must be reviewed before build; SOP-RUN-01, SOP-RUN-04, SOP-PUP-02, BOAS workflow/control sheets, and Driver/Admin journeys need formal alignment. |
| Billing | V1 runtime uses portal-generated EOM invoice PDFs only. Admin emails clients individually outside the system; payment follow-up and bank reconciliation are off-system human/accounting processes. No OpenClaw/Xero/accounting API integration is part of the V1 baseline. | Billing policy, SOP-BIL-01, SOP-BIL-04, BOAS billing objects, and customer/billing journeys must keep the runtime boundary at downloadable PDF. |
| Supplier network | Ficeda is removed from the active supplier network. Active V1 suppliers are Link International, A1 Accessories, McLeods, Gas Imports, and Whites Powersports. | CAP-MCL-001/source map must distinguish original source list from current active runtime list. Supplier master-data policy/SOP should record archive/reactivation evidence. |
| Brand architecture and marketing capability | Moto & Co Couriers is the customer-facing brand. Brand architecture, public copy boundaries, and copy review should be treated as a marketing/business-model capability. | BOAS business model/capability sheets should add brand architecture and controlled copy review. Future Moto & Co family naming ideas remain future considerations only. |
| Supplier warehouse cut-off | Public copy must instruct workshops to place supplier orders before each supplier warehouse's own cut-off so goods are picked, packed, and ready for the scheduled collection. Moto & Co Couriers does not own a universal customer-facing cut-off time. | Public website and legal copy updated. BOAS, SOP, journey, and portal/runtime references to the old fixed 12:30pm cut-off require separate reconciliation before logic changes. |
| Privacy ownership | Privacy Owner is role-based GM Moto & Co Logistics. | Policy #3/#4/#5/#6/#7/#21 and related UAT evidence must reference this role instead of an unnamed ACT-TECH-002 blocker. |
| HCM boundary | Driver legal classification, agreements, verification, disciplinary/removal consequences, and driver/courier expansion employment/payment models are not in logistics portal scope. | BOAS and policies must keep HCM requirements separate from logistics runtime requirements. |
| SLA boundary | SLA monitoring is not in logistics portal scope. The app may record timestamps/evidence, but does not own SLA countdowns or breach alerts. | BOAS controls and journey docs must not reintroduce Admin SLA monitoring into the logistics portal. |
| Public legal pages | Approved customer-facing legal HTML is held with source code at `src/content/legal/motoandco-legal-pages.v2.html`; `/legal` renders the approved source directly. | Published for UAT from user-supplied approved HTML. |
| Driver safety legal draft | A separate Driver Safety and Respectful Conduct legal page has been drafted from Policy #27 WHS controls and current Australian WHS guidance. | Draft only at `docs/driver-safety-and-respectful-conduct-policy-draft.md`; not published to `/legal` until Policy Owner / legal owner approval and privacy/incident-record wording are confirmed. |
| System/UAT testing | System testing is not complete; Storage/POD process is approved but failed system testing; Auth/RLS/access logs require UAT evidence. | UAT scripts must be executed and retained before production stability is claimed. |

## Documentation Gate Before New Build Work

Before building more product behaviour:

1. Check this register for impacted baseline assets.
2. Update `decision-log.md` with the approved decision.
3. Update `release-one-rules.md` or `release-one-source-map.md`.
4. Update `policy-baseline-reconciliation.md` if any policy is affected.
5. Add or close the relevant item in `open-questions.md`.
6. Keep production blockers open until evidence is supplied.
7. Only then change runtime code, migrations, or deployment settings.

## Not Yet Done

- Final owner/legal approvals are not recorded yet. Privacy Owner role is GM Moto & Co Logistics, but policy approval evidence still needs to be retained.
- Customer-facing legal page draft has been updated against v2.0 policies, but final legal/privacy approval is not recorded yet.
- Minimum driver device/browser, local cache retention, clear-device-data warning, POD photo non-mandatory position, and Admin unrecoverable-offline recovery procedure are approved for UAT evidence and must be re-executed after ERD approval and schema/runtime reconciliation.
- Manual invoice email/payment/bank reconciliation processes are outside the V1 runtime; the runtime requirement is downloadable EOM invoice PDF only.
- ERD/entity relationship diagram draft now exists at `docs/entity-relationship-diagram-v2.0.md`. It still needs approval and migration-state reconciliation before further schema/runtime work.
