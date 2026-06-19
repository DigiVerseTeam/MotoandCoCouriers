# Decision Log

Last updated: 2026-06-19

## Format

Each decision should include:

- Date.
- Status: Confirmed, Pending, Superseded, or Rejected.
- Decision.
- Source.
- Notes.

## Decisions

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

Status: Confirmed.

Decision: Booking cut-off is 12:30pm Brisbane time and is enforced by `APP-ADM-001`.

Source: User instruction on 2026-06-18.

Notes: App logic must use Brisbane time for cut-off calculations.

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

### 2026-06-19 - GitHub V1 repository handoff

Status: Confirmed.

Decision: Use `DigiVerseTeam/MotoandCoCouriers` as the V1 GitHub repository. Preserve the old build on `archive/old-netlify-vite-build-2026-06-19` and use `main` for the V1 logistics runtime.

Source: User direction on 2026-06-19; local Git push/merge verification.

Notes: V1 was merged to `main` on 2026-06-19. GitHub Actions/release evidence still depends on production credentials and final live checks.

### 2026-06-19 - Vercel production deployment

Status: Confirmed app-shell deployment; Supabase-backed production runtime pending.

Decision: Use Vercel team `DigiVerse` / `digi-verse` and project `motoandcocouriers` for the V1 website and app deployment.

Source: User completed Vercel device login on 2026-06-19; Vercel CLI link/deploy verification.

Notes: The production alias `https://motoandcocouriers.vercel.app` is Ready, and GitHub `main` auto-deploy was verified on 2026-06-19. Live smoke tests for `/`, `/login`, `/booking`, and `/admin` returned HTTP 200. Supabase anon/service keys, region confirmation, migration execution, Auth/RLS, and Storage verification remain open before this is a fully live-backed production system.
