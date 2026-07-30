# Decision Log

Last updated: 2026-07-03

## Format

Each decision should include:

- Date.
- Status: Confirmed, Pending, Superseded, or Rejected.
- Decision.
- Source.
- Notes.

## Decisions

### 2026-07-03 - Driver safety legal document draft

Status: Pending Policy Owner / legal owner approval.

Decision: Draft a separate customer-facing Driver Safety and Respectful Conduct legal document before publishing it to the website. The document should be derived from Policy #27 WHS / fatigue / driver wellbeing controls and current Australian WHS guidance, but the public copy must avoid BOAS, SOP, versioning, administration, and internal control terminology.

Source: User direction on 2026-07-03; `docs/release-one-source-map.md`; official Safe Work Australia, WorkSafe Queensland, Australian Human Rights Commission, and Fair Work Ombudsman guidance reviewed on 2026-07-03.

Notes: Draft created at `docs/driver-safety-and-respectful-conduct-policy-draft.md`. Do not add it to `/legal` until approval and publication gaps are closed.

### 2026-07-03 - Supplier warehouse cut-off replaces fixed public cut-off

Status: Confirmed.

Decision: Public website and legal booking copy must not publish a Moto & Co-owned universal order cut-off time. Customer-facing copy must tell workshops to place supplier orders before each supplier warehouse's own cut-off so goods can be picked, packed, and ready for the scheduled collection. Tuesday and Thursday remain the published standard run days unless separately changed.

Source: User direction on 2026-07-03.

Notes: This supersedes the earlier public `12:30pm Brisbane time` cut-off wording. Existing portal/runtime and internal documentation references to the old fixed cut-off require separate reconciliation before booking logic is changed.

### 2026-07-03 - Legal pages split into separate public routes

Status: Confirmed.

Decision: Keep the approved legal copy unchanged but present each legal document on its own public page under `/legal/...`, with `/legal` acting as the legal hub. Restore Legal to the top website navigation.

Source: User direction on 2026-07-03; `src/content/legal/motoandco-legal-pages.v2.html`.

Notes: No legal wording was rewritten for this change. The split routes are Booking Terms, Credit Terms, Dangerous Goods, Delivery Disclaimer, Privacy Policy, Collection Notice, Data Retention, and Information Security.

### 2026-07-03 - Brand architecture and public copy boundaries

Status: Confirmed for working website and marketing capability alignment.

Decision: Treat `moto-and-co-couriers-brand-architecture-guide.md` as the current brand architecture input for public website copy and internal marketing capability documentation. Public copy should use Moto & Co Couriers as the customer-facing brand, keep Moto & Co Pty Ltd as the parent-company reference, avoid internal control/version/administration terminology, and align operational claims to the approved pricing, supplier, cadence, POD, billing, and portal boundaries.

Source: User direction on 2026-07-03; `moto-and-co-couriers-brand-architecture-guide.md`; `moto-and-co-couriers-webcopy-final.md`; `docs/baseline-documentation-register.md`; `baseline/v2.0/MotoCo_BOAS_Baseline_Addendum_v2.0.md`.

Notes: Future Moto & Co family naming ideas are future considerations only. They are not active public services, policy requirements, or runtime scope until separately approved.

### 2026-07-03 - Public website SEO copy alignment

Status: Confirmed.

Decision: Update the public website copy using the uploaded SEO/web copy direction, but align every operational claim with the V1 BOAS, policy, and legal baseline. Public pages must keep the approved active supplier list, approved ex-GST pricing, Tuesday/Thursday cadence, supplier warehouse cut-off wording, receiver-name/signature POD rule, and manual PDF invoice boundary.

Source: User direction on 2026-07-03; `moto and Co web copy and seo.zip`; `docs/baseline-documentation-register.md`; `docs/policy-baseline-reconciliation.md`; `baseline/v2.0/MotoCo_BOAS_Baseline_Addendum_v2.0.md`.

Notes: Do not publish Ficeda as active, do not use the lower draft pricing table, do not invent phone/address NAP details, and do not claim portal-based invoice email dispatch or accounting integrations.

### 2026-06-18 - Platform direction

Status: Pending confirmation details.

Decision: Build toward a GitHub + Supabase + Vercel runtime.

Source: User instruction on 2026-06-18.

Notes: Repository owner, Supabase project, Vercel account, domain, environments, and deployment policy are still TBD.

### 2026-06-18 - Documentation rule

Status: Confirmed.

Decision: Do not fill gaps where the answer is unknown. Mark unknowns as `TBD` or keep them in `open-questions.md`.

Source: User instruction on 2026-06-18.

Notes: This applies to product scope, copy, schema, workflow, compliance, deployment, and launch planning.

### 2026-06-18 - Working brand name

Status: Requires final lock before public launch.

Decision: Treat Moto and Co Couriers as the working name in this documentation.

Source: `Moto_and_Co_Couriers_Brand_Guide_V1.pdf`, page 2 and page 4.

Notes: The brand guide itself says trading name lock is one of the open decisions before public launch.

### 2026-06-18 - Market geography

Status: Requires final public wording.

Decision: Use Brisbane suppliers to Gold Coast workshops as the working geography.

Source: `Moto_and_Co_Couriers_Brand_Guide_V1.pdf`, page 4.

Notes: Registered office is SA 5062, but the public market geography in the guide is Brisbane to Gold Coast.

### 2026-06-18 - Software canvas

Status: Confirmed from brand guide for V1.

Decision: Use pure white as the default software canvas for booking app, customer portal, driver dashboard, invoices, and operational UI.

Source: `Moto_and_Co_Couriers_Brand_Guide_V1.pdf`, page 28.

Notes: Semantic UI colours remain trajectory items for V2.

### 2026-06-18 - Controlled supplier list

Status: Confirmed.

Decision: Supplier names are selected from a controlled list managed by Admin. Supplier names must not be hard-coded.

Source: User instruction on 2026-06-18.

Notes: Requires an administrator-managed supplier table.

### 2026-06-18 - Controlled customer/workshop list

Status: Confirmed.

Decision: Delivery workshops are selected from a controlled customer/workshop list, and the app requires CRM capability.

Source: User instruction on 2026-06-18.

Notes: CRM/village design standard is supplied by `The village ERM Complete Requirements v2.0.pdf`.

### 2026-06-18 - Booking cut-off

Status: Superseded for public/BOAS wording by the 2026-07-03 supplier warehouse cut-off decision.

Decision: Fixed booking cut-off was previously recorded as 12:30pm Brisbane time and enforced by `APP-ADM-001`.

Source: User instruction on 2026-06-18.

Notes: Do not carry this fixed public cut-off into website, legal, or BOAS copy. Existing runtime references need separate review before portal booking logic is changed.

### 2026-06-18 - POD delivered gate

Status: Confirmed.

Decision: Receiver name and receiver signature are mandatory before `Delivered` status can be set. GPS is not required.

Source: User instruction on 2026-06-18; `POL-MCL-004-001`.

Notes: Photo handling remains TBD.

### 2026-06-18 - POD storage and retention

Status: Confirmed.

Decision: POD is stored in a private Supabase Storage bucket, with signature URL written to `delivery_proof`. POD retention is 7 years from delivery date.

Source: User instruction on 2026-06-18; Policy #5 and billing dispute window.

Notes: Local migrations now define the private `delivery-proof` bucket, release-one object path convention, assigned-driver/Admin object insert policy, linked-role read policy, proof path enforcement, and automatic retention queue row creation. Live Storage policy testing and final upload transport remain open.

### 2026-06-18 - Launch roles

Status: Confirmed.

Decision: Release one roles are Client, Driver, Admin, and Receiver. Receiver has no login.

Source: User instruction on 2026-06-18; `ACT-CRM-001a/b`, `ACT-INT-001`, `ACT-INT-002`, `ACT-INT-003`.

Notes: Auth provider remains TBD. A first-pass RLS migration now maps BOAS Sheet 05 role boundaries, but live Supabase/Auth execution testing is still required before it is final.

### 2026-06-18 - First-pass RLS policy layer

Status: Draft implementation, pending live Supabase verification.

Decision: Use BOAS Sheet 05 as the source for a first-pass Supabase RLS policy migration covering account-scoped Client Operational access, billing-only Client Billing access, assigned Driver access, Admin full-platform access, Admin-only pricing/master-data writes, suspended-account pickup blocking, private delivery-proof reads, and Receiver no-login.

Source: `MotoCo_Unified_BOAS_Hierarchy_v1.6.xlsx`, Sheet 05 Roles & Access and Sheet 06 Data Objects.

Notes: Policy #21 review, production Supabase Auth identity binding, private Storage upload flow, and live policy execution tests are still required.

### 2026-06-18 - Exceptions and disputes

Status: Confirmed.

Decision: Exceptions are recorded through `APP-ADM-005` into an exception queue with a daily structured alert to Admin. Disputes are governed by Policy #18 and investigated by Admin using `APP-DRV-003` proof records.

Source: User instruction on 2026-06-18.

Notes: Alert delivery channel remains TBD.

### 2026-06-18 - Pricing rules

Status: Confirmed.

Decision: Policy #9 and `SOP-MDM-02` are the pricing source of truth. Runtime pricing lives in a Supabase `price_rules` table. Rates are fixed tiers based on tyre count and weight band, not customer-specific and not manually entered by drivers.

Source: User instruction on 2026-06-18.

Notes: Admin must be able to update `price_rules`. Local app and Supabase draft guardrails require written change reason and Owner approval evidence before price rules take effect. Production execution authority remains open because source material references Digiverse execution after Admin and Owner approval.

### 2026-06-18 - Privacy, access, audit, and retention controls

Status: Confirmed with some retention gaps pending Privacy Owner.

Decision: Policies #3, #4, #5, #7, and #21 control privacy, collection, retention, information security, and internal acceptable use. `APP-PRV-004` requires append-only, tamper-evident audit logging for all PII actions.

Source: User instruction on 2026-06-18.

Notes: Access rules are documented in Policy #21 and BOAS Sheet 05. Some retention periods remain TBD.

### 2026-06-18 - Environment separation

Status: Confirmed with topology pending.

Decision: Preview deployments must not connect to production Supabase.

Source: User instruction on 2026-06-18; `PIPE-DEV-001`, `SOP-REL-01`.

Notes: Environment separation is implied by release control policy, but exact environment topology remains TBD.

### 2026-06-18 - Brand assets

Status: Confirmed with UI details pending.

Decision: The five V1 brand colours are final. The existing PNG logo is approved for production. No approved black-and-white photos exist for the first website, so placeholders should be used.

Source: User instruction on 2026-06-18.

Notes: Icon library is not selected. Semantic UI direction is red/coral, but exact state mapping and hex values remain TBD.

### 2026-06-18 - Village CRM/ERM design standard

Status: Confirmed as design source.

Decision: Use `The village ERM Complete Requirements v2.0.pdf` as the CRM/ERM design standard for the Moto and Co Couriers customer/workshop CRM.

Source: User supplied file on 2026-06-18.

Notes: The source defines The Village as an Ecosystem Relationship Management runtime across SRM, PRM, and CRM. It confirms the Actor, Contact, Relationship Record, Event, Obligation, and Opportunity object model. Release-one scope is confirmed separately as a lean subset.

### 2026-06-18 - Release-one CRM/ERM scope

Status: Confirmed.

Decision: Release one uses a lean Village CRM/ERM subset: actors, contacts, events, obligations, and courier-specific operational tables. Relationship records, opportunities, partner management, and relationship health scoring are deferred unless a later decision brings them into release one.

Source: User agreement on 2026-06-18.

Notes: This keeps the schema aligned to The Village model without building the full ERM product before booking, POD, admin, and CRM continuity are working.

### 2026-06-18 - Local-first package

Status: Confirmed.

Decision: Build and verify the package locally before GitHub, Supabase, and Vercel deployment.

Source: User agreement on 2026-06-18.

Notes: Local build completed with Next.js app routes, Supabase schema draft, mock runtime state, and workflow verification. Production deployment remains blocked by platform access and unresolved business/compliance gaps listed in `build-gaps.md`.

### 2026-06-18 - Fleet vehicle register

Status: Draft implementation, pending production vehicle evidence and live Supabase verification.

Decision: Dispatch must use Admin-managed APP-FLT-001 fleet vehicle records rather than free-text vehicle names. Run assignment is blocked locally unless the selected vehicle is active, has current registration and insurance evidence, and has no open defect.

Source: `MotoCo_Unified_BOAS_Hierarchy_v1.6.xlsx`, Sheet 06 Data Objects; APP-FLT-001; ACT-VEH-001/002 references; user direction that administrator-managed controlled data should not be hard-coded.

Notes: The local app includes seeded placeholder vehicle records for workflow verification. Real production vehicle details remain open in `open-questions.md`.

### 2026-06-18 - Non-payment suspension guardrail

Status: Draft implementation, pending live Supabase verification and production notification provider decision.

Decision: Non-payment account suspension must be blocked unless a Day 8 overdue notice record exists for the linked invoice, and Admin must record notification evidence for both Operational and Billing contacts before suspension or reinstatement is accepted.

Source: `Policy-23-AccountSuspensionTermination.docx`; `UJ-CRM-001B`; `UJ-ADM-001`; release-one source map.

Notes: This does not send external notices. Email/SMS/in-app provider, bounce handling, and production notification delivery remain open gaps.

### 2026-06-19 - HCM boundary for driver legal records

Status: Supersedes the earlier driver-record governance implementation for the logistics app.

Decision: Driver legal classification, driver agreements, legal verification evidence, disciplinary/removal consequences, and driver/courier expansion employment-payment models are HCM requirements, not active logistics software requirements. The logistics runtime keeps only driver directory account data and Policy #22 availability records needed for dispatch operations.

Source: User correction on 2026-06-19; `docs/hcm-boundary.md`; `hcm-extract/`.

Notes: The previously built HCM-adjacent runtime and migration material was preserved under `hcm-extract/` for a future HCM system. It was removed from the active logistics runtime, active Supabase migration set, and TypeScript build.

### 2026-06-19 - Production-first V1 platform path

Status: Confirmed direction, pending platform credentials and live checks.

Decision: V1 can go straight to production rather than requiring a separate staging launch first.

Source: User direction on 2026-06-19.

Notes: This does not permit local or preview builds to write to production Supabase. The production-first path still needs production Supabase project values, region confirmation, migration authority, Auth/RLS/Storage verification, Vercel production project/domain values, and Git/GitHub branch/PR handoff before launch evidence can be recorded.

### 2026-06-19 - Supabase MCP project connection

Status: MCP registered and OAuth authenticated locally; live project inspection still pending tool exposure in the active Codex session.

Decision: Use Supabase project ref `fhrqfrhqopicekaiibyj` for the production-first V1 connection path unless Digiverse later replaces it.

Source: User supplied Supabase MCP command on 2026-06-19; local `codex mcp list` verification.

Notes: The Supabase MCP server `supabase` is registered at `https://mcp.supabase.com/mcp?project_ref=fhrqfrhqopicekaiibyj` and authenticated via OAuth. Secrets, region/data-residency confirmation, Auth/RLS/Storage verification, and migration execution remain open.

### 2026-06-21 - Decisions register closes pre-build UJ gaps

Status: Confirmed source; implementation alignment in progress.

Decision: `DECISIONS-REGISTER.html` is the authoritative source for the 24 pre-build user-journey gaps. All 24 gaps are decision-resolved in that register.

Source: User supplied `DECISIONS-REGISTER.html` on 2026-06-21.

Notes: Implemented alignment includes advisory-only activation checklist, no activation notification, `time_constraint` No Pickup category, next-scheduled-run second delivery attempt, structured payment-arrangement reinstatement fields, automatic reinstatement notification record on Admin action, and single-action invoice confirmation/dispatch. Google Maps/equivalent SEQ validation and real outbound email remain integration work because API/provider credentials and send-domain configuration are not present in the repo.

### 2026-06-21 - Hard scope exclusions

Status: Confirmed.

Decision: SLA monitoring is not in scope for the logistics software build. HCM requirements are not in scope for the logistics software build.

Source: User direction on 2026-06-21; `docs/hard-scope-requirements.md`; `docs/hcm-boundary.md`.

Notes: The logistics portal may record timestamps, evidence, and operational courier records. It must not own Admin SLA countdowns, breach alerts, escalation timers, or due-date trigger logic. It also must not own driver legal classification, driver agreements, driver legal verification evidence, disciplinary/removal consequences, or employee/contractor payment model decisions.

### 2026-07-02 - Production runtime reconciliation

Status: Confirmed direction, pending full platform assurance.

Decision: Treat `https://motoandcocouriers.vercel.app` as the active V1 production portal and Supabase project ref `fhrqfrhqopicekaiibyj` as the active runtime target for V1 testing.

Source: Production testing and user direction through June 2026; current app deployment checks on 2026-07-02.

Notes: This does not close region/data-residency, RLS, Storage, migration, monitoring, or deployment-ownership gaps. The local workspace still needs safe Git/GitHub handoff before source-control evidence is complete.

### 2026-07-02 - Offline driver device sync

Status: Confirmed for V1 testing.

Decision: Add `SOP-OPS-01 Offline Device Sync And Recovery`. Offline mode saves driver actions locally on the same device and retries live sync later; it does not update the live production record until that device reconnects and sync succeeds.

Source: User field-test issue and confirmation on 2026-07-02.

Notes: Driver users must keep the device signed in and online to clear pending sync. Clearing saved device data can abandon unsynced local updates. PWA background sync, minimum supported device/browser, local cache retention, and Admin recovery for unrecoverable outbox data remain open.

### 2026-07-02 - Manual invoice PDF for V1

Status: Confirmed.

Decision: Xero connection is deferred/removed from V1. The portal generates downloadable invoice PDFs for Admin to manually email to clients.

Source: User decision after Xero invalid-scope connection failure and invoice UX direction in late June 2026.

Notes: Superseded by the later 2026-07-02 TBD-register decision for V1 scope: Admin email, bounce handling, payment follow-up, bank reconciliation, BAS/accountant handoff, and any corrected-invoice handling are out-of-system human/accounting processes. No Xero/OpenClaw/accounting API integration is part of the V1 baseline.

### 2026-07-02 - Active supplier network adjustment

Status: Confirmed for V1 runtime.

Decision: Ficeda is removed from the active supplier network. The V1 active supplier list is Link International, A1 Accessories, McLeods, Gas Imports, and Whites Powersports.

Source: User direction during supplier testing in late June 2026.

Notes: CAP-MCL-001 source material still records the earlier six-supplier network. Documentation must distinguish the original source list from the current active runtime list.

### 2026-07-02 - Driver pickup count timing

Status: Confirmed.

Decision: Drivers count freight items at pickup, not at delivery. Delivery sign-off verifies the pickup-counted items, price, receiver name, and receiver signature. Receiver phone is not required for POD.

Source: User direction during driver journey testing in late June 2026.

Notes: This changes the user journey and needs BOAS/SOP reconciliation against SOP-PUP-02, SOP-DEL-04, and SOP-DEL-05.

### 2026-07-02 - Baseline documentation freeze before further build work

Status: Confirmed.

Decision: All baseline documentation must be reconciled before moving forward with more software changes. This includes BOAS, SOP, policy, journey, and runtime documentation.

Source: User direction on 2026-07-02.

Notes: `docs/baseline-documentation-register.md` now controls the baseline-documentation gate. `docs/policy-baseline-reconciliation.md` records policy impacts from offline mode, manual invoice PDF billing, active supplier changes, pickup-count timing, HCM boundary, SLA boundary, and production runtime. The formal BOAS workbook and policy `.docx` archives have not been silently overwritten; they still need approved versioned source updates.

### 2026-07-02 - Recreated baseline pack with version control numbers

Status: Draft for approval.

Decision: Recreate the baseline documentation set as a version-controlled draft pack under `baseline/v2.0/`, preserving the old BOAS and policy archives as source evidence.

Source: User direction on 2026-07-02 to edit or recreate the documents with new version control numbers.

Notes: New draft documents are `DOC-BASE-CTRL-002` v2.0, `BOAS-ADD-002` v2.0, `SOP-ADD-001` v1.3, and `POL-ADD-002` v2.0. Full recreated source outputs now exist under `baseline/v2.0/full-source/`: BOAS v2.0 workbook, versioned SOP workbooks, versioned policy DOCX files, and versioned journey records. They are not final legal approval. Owner, Policy Owner/legal owner, Privacy Owner, and approval references remain `TBD`.

### 2026-07-02 - Baseline approval register responses

Status: Partially approved; UAT/evidence still required.

Decision: Baseline v2.0 is approved as the source of truth for all V1 testing. BOAS v2.0, the v2 SOP workbook set, and the v2 journey set are approved for V1 testing alignment.

Source: User response on 2026-07-02 to `docs/baseline-tbd-approval-register.md`.

Notes: Policy/legal owner and Privacy Owner are to be Moto & Co Logistics roles; named assignees remain open. Legal pages are supplied but require updating against policy changes before publication. Australia/Sydney database position is accepted in principle, with evidence/UAT still required. Auth/RLS, Storage/POD, and production access-log testing are not complete. Storage/POD process is approved, but system testing failed and requires retest. DPA/security schedule remains open pending explanation/evidence.

### 2026-07-02 - Remaining TBD register decisions

Status: Confirmed with retained UAT/build gaps.

Decision: Close or update TBD-012 through TBD-030 in the v2.0 baseline register. Security schedule/DPA is not required for V1. Offline device/browser, local cache retention, clear-device-data warning, unrecoverable outbox recovery, and POD photo non-mandatory position are approved for UAT evidence and must be re-executed after ERD approval and schema/runtime reconciliation. V1 billing runtime creates downloadable EOM invoice PDFs only; Admin email, bounce handling, payment follow-up, bank reconciliation, BAS/accountant handoff, and any corrected-invoice handling are outside the V1 runtime. Accounting API/OpenClaw/Xero integration is not part of the V1 baseline. Privacy Owner is role-based GM Moto & Co Logistics. Light-touch supplier governance, current red/coral state-colour direction, and current simple UI/icon approach are approved for V1.

Source: Owner response on 2026-07-02 to `docs/baseline-tbd-approval-register.md`.

Notes: Policy #22 source was not located by Owner, so scheduling cadence approval remains open. Previous evening-before run lockdown is rejected. New approved build requirement is a driver `Create Daily Run` workflow that consolidates ready con notes and supports three depot collection types: planned milk-run package, brought-forward ready next-day package, and ready package with no con note/customer missed portal entry. ERD draft now exists at `docs/entity-relationship-diagram-v2.0.md`; the daily-run workflow is blocked until ERD approval, schema/runtime build, and UAT.

## 2026-07-02 - Software Scope v2.0 and ERD v2.0 Created

Decision: Create `docs/software-scope-v2.0.md` and `docs/entity-relationship-diagram-v2.0.md` as the required gate before further software updates. Scope separates runtime responsibilities from out-of-system business processes. ERD documents the visible local Supabase migration state plus approved logical data requirements and flags migration/role-model reconciliation gaps.

Notes: Further runtime/schema changes should wait until the software scope is accepted, the ERD is reviewed, and the local migration folder is reconciled against production evidence.
