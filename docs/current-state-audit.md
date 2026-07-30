# Current State Audit

Last updated: 2026-07-02

This audit checks the current local package against the user objective: develop the Moto and Co end-to-end local software and website package from BOAS, customer journeys, and the old Moto and Co Logistics app baseline, without inventing unknown requirements.

It is not a claim that production launch is complete. It separates executable software from items that need live platform assurance, business decisions, or policy decisions.

## 2026-07-02 Reconciliation Note

The original audit below was written as a local-build audit. Since then, the V1 portal has moved into production testing at `https://motoandcocouriers.vercel.app` with Supabase project ref `fhrqfrhqopicekaiibyj` as the active runtime target.

Current changes since the original local audit:

- Login/provisioning, client activation, driver run work, Admin operations, and billing have been exercised against the production portal.
- Driver offline recovery is now a formal requirement documented in `SOP-OPS-01 Offline Device Sync And Recovery`.
- Offline mode saves updates on the driver device only; Client/Admin views update after the same device reconnects and sync succeeds.
- Billing V1 is portal-generated invoice PDF download plus Admin manual email outside the portal. Xero, OpenClaw, and accounting API integration are not part of the V1 baseline.
- Ficeda has been removed from the active supplier network for V1 runtime.
- Baseline documentation now has a control register, addendum set, and full recreated v2.0 source pack under `baseline/v2.0/full-source/`. The files are draft for approval; approval references remain open.

Remaining production assurance gaps are tracked in `production-blocker-register.md`.

## Evidence Inspected

- Local runtime: `src/components/moto-co-logistics.tsx`.
- Public website: `src/app/website/page.tsx`.
- Legal status page: `src/app/legal/page.tsx`.
- Journey model: `src/lib/journeys.ts`.
- Local preflight runner: `scripts/local-preflight.mjs`.
- Local requirement verifier: `scripts/verify-runtime-requirements.mjs`.
- Platform environment reporter: `scripts/check-platform-env.mjs` and `docs/platform-env-contract.md`.
- Launch readiness reporter: `scripts/check-launch-readiness.mjs`.
- Strict production readiness gate: `scripts/production-readiness.mjs`.
- Supabase migration verifier: `scripts/verify-supabase-migrations.mjs`.
- Supabase draft schema and RLS migrations: `supabase/migrations/`.
- Local verification report: `docs/local-build-report.md`.
- Remaining gaps: `docs/build-gaps.md`.
- Production blockers: `docs/production-blocker-register.md`.
- HCM boundary correction: `docs/hcm-boundary.md` and `hcm-extract/`.
- Source-backed rules: `docs/release-one-source-map.md` and `docs/release-one-rules.md`.
- Launch and platform status: `docs/architecture.md`, `docs/open-questions.md`, and `docs/launch-checklist.md`.

## Requirement Audit

| Requirement | Current Evidence | Status |
| --- | --- | --- |
| Build working software rather than workflow display pages | The foreground route loads `MotoCoLogisticsApp`; role routes steer users to actor-specific login contexts; local workflows are executable for Client Operational, Client Billing, Driver, and Admin. | Locally built |
| Keep the local build from regressing into workflow display pages | `npm.cmd run verify:local` runs the source-backed runtime verifier, platform contract reporter, launch readiness reporter, Supabase migration guardrail verifier, Next route type generation, TypeScript, and production build using `.next-preflight-build`; `npm.cmd run verify:requirements` checks every product route mounts the runtime shell, verifies source markers for confirmed actor workflows, blocks the removed first-pass portal/workspace/provider scaffold from returning, and rejects native popup-style workflow guards. | Locally verified |
| Use the old Moto and Co Logistics app as functional baseline | The local runtime was ported from `moto-co-logistics.jsx` and extended rather than replaced by process pages. | Locally built |
| Use BOAS and journeys as implementation rules | Journey coverage is mapped in `src/lib/journeys.ts` and `docs/customer-journey-comparison.md`; source-backed rules are captured in `docs/release-one-source-map.md`. | Locally built with documented gaps |
| Client Operational login and booking | Local testing-code login, registration, pending activation, supplier setup gate, supplier-controlled pickup request, account suspension block, cut-off adjustment, Policy #14 cancellation/review request, tracking, and Policy #18 delivery dispute required-field handoff exist. | Locally built |
| Client Billing login and billing workflow | Separate billing login, invoice visibility, invoice preview, dispatch/payment evidence visibility, account notices, Policy #18 invoice-line/date billing-query acknowledgement, query status, and Admin investigation outcome visibility exist. | Locally built |
| Driver login and delivery workflow | Production portal driver workflow includes compiled run brief, pre-trip gate, supplier pickup, pickup-time item count/pricing, SOP-RUN-04 bring-forward, delivery/POD, receiver name/signature capture, SOP-DEL-05 completion, and SOP-OPS-01 local outbox retry for offline updates. | Built; offline field UAT required |
| Admin operations | Admin CRM, account activation/suspension/reinstatement/termination, supplier master data with CAP-MCL-001 approval-gate evidence, supplier pickup standards and Policy #27 WHS hazard monitoring, Driver Directory account records, Policy #22 manual driver availability with notice/late/contingency evidence, fleet register, CAP-MCL-002 run-planning monitor, dispatch/run compilation, Policy #14 cancellation review, WHS/fatigue exceptions, billing, Policy #24 month-end financial reconciliation, Policy #6 NDB suspected-incident intake/containment register, Policy #21 / Policy #7 data-use register, Policy #3/#4/#5 privacy request register, pricing, retention, audit, and structured access governance are locally interactive. | Locally built |
| AI use governance | Admin has a Policy #20 AI Draft Review Gate that creates local CTA draft records from flagged CRM, supplier, and APP-ADM-005 exception records; Admin must review with a note before approval/rejection; approved drafts are explicitly not sent and stay `not_sent_provider_not_configured`; live AI provider/model/prompt/send path remains blocked. | Locally built; production AI integration blocked |
| Receiver actor | Receiver remains no-login; receiver name and signature are captured only through Driver POD. | Locally built |
| Controlled suppliers | Suppliers are local Admin-managed records, not hard-coded form choices; Admin can capture CAP-MCL-001 dock-access, packaging-standards, pickup-window, written-approval evidence, and named dock contact status; browser verification confirmed disabled archive for open-work suppliers, required Admin reason/evidence, archive/reactivation state changes, APP-PRV-004 audit rows, and master-data change rows. | Locally built |
| Controlled workshops / CRM | Admin can manage workshop/customer CRM records with contacts, owner, events, event-level next actions, obligations, governed supplier-link changes with reason/evidence, status, and a source-backed CRM Rhythm Monitor for incomplete records, due reviews/actions, overdue obligations, at-risk records, and open issues. | Locally built |
| Pricing rules table and Admin update path | Structured local price rules exist; browser verification confirmed Admin reason plus Owner approval reference guards, archive/reactivation state changes, generated local change-log IDs, APP-PRV-004 audit rows, and pricing master-data change rows. Supabase draft guardrails require change-log evidence. | Locally built; production authority unresolved |
| POD storage and retention | Local proof records use private `delivery-proof/deliveries/{delivery_id}/signature.png` path convention and carry SOP-DEL-04 sign-off evidence; Supabase draft migrations define private bucket, path guard, linked-role read policy, sign-off proof constraints, and 7-year retention queueing. | Locally built; live Storage testing blocked |
| Exceptions and disputes | APP-ADM-005 local queue, daily structured alert, cancellation review requests, Policy #8 failed-delivery fee review, Policy #16 supplier pickup standards review, SOP-EXC-03 unmatched billing account correction, Policy #18 dispute reason/date/invoice timing/timestamps/Owner escalation/finding/remedy/outcome-history controls, dispute investigation against invoice/work/POD proof, supplier/pricing review exceptions, and notification-failure exception routing exist. Admin SLA monitoring is out of logistics portal scope. | Locally built |
| Billing and account suspension/termination | Draft invoice batches, SOP-BIL-04 rendered-invoice confirmation with automatic local dispatch evidence, browser-verified SOP-EXC-03 unmatched account exclusion/correction before invoice inclusion, a fresh-seed unmatched-account fixture for correction-path verification, proof-linked SOP-DEL-05 billing-ready delivery line items, approved Policy #8 redelivery-fee line items, dispatch evidence, payment evidence after dispatch before Paid, Policy #24 month-end financial reconciliation evidence, system-generated local Day 8 overdue notice evidence, Admin fallback Day 8 notice recording, non-payment suspension confirmation, conduct suspension evidence, suspension notice evidence, automatic reinstatement notice record, structured payment-arrangement fields, reinstatement evidence, voluntary termination, conduct termination, Owner consultation evidence, written termination notice evidence, and local termination account notices exist. | Locally built; repeated non-payment termination, external delivery/payment/accounting source blocked |
| Audit and retention | Local APP-PRV-004 hash-chain audit review and Policy #5 / Policy #24 / Policy #6 retention register exist for confirmed 7-year pickup request, supplier relationship, master-data change-log, POD proof, financial reconciliation, and post-breach review report rules; browser verification generated supplier master-data changes and confirmed disabled destruction pending Privacy Owner approval. | Locally built; deletion approval blocked |
| Public website | `/website` uses confirmed logo, brand colours, market geography, cadence, booking/tracking/app links, and photo placeholders because no approved photos exist; browser verification confirmed website links hand off to `/booking`, `/tracking`, `/`, and `/legal`, with no mobile horizontal overflow at 390px. | Locally built |
| Legal page | `/legal` renders the approved customer-facing legal HTML held at `src/content/legal/motoandco-legal-pages.v2.html`, including booking terms, credit terms, dangerous goods, delivery disclaimer, privacy, collection notice, retention, and security. | Published for UAT from approved HTML source |
| Supabase backend | Draft schema/migrations exist and project ref `fhrqfrhqopicekaiibyj` is the active runtime target for V1 testing. Live RLS, Storage, migration execution state, region/data residency, and monitoring evidence still need final assurance. HCM-owned driver legal/classification/agreement/conduct/expansion migrations were extracted from the active migration set. | Active runtime target; assurance incomplete |
| Supabase migration guardrails | `npm.cmd run verify:migrations` statically checks core source-backed migration markers for schema, RLS, audit hash-chain, private POD storage, retention, pricing, supplier-stop closeout, delivery sign-off proof, delivery stop grouping/completion, WHS hazard controls, exceptions, billing, and dispute guardrails. | Locally verified; live execution blocked |
| Vercel launch | Active production portal is `https://motoandcocouriers.vercel.app`; environment guard blocks local/preview app from production-labelled Supabase. | Deployed; ownership/monitoring evidence open |
| GitHub launch | Draft GitHub Actions CI exists locally and runs the package gates when a repo is connected; repository is not initialised/connected because Git is not available on PATH and owner/name are unconfirmed. | Prepared locally; connection blocked |
| Platform environment handoff | `.env.example`, `docs/platform-env-contract.md`, `npm.cmd run verify:platform`, `npm.cmd run verify:launch`, and the failing strict `npm.cmd run verify:production` gate list GitHub, Supabase, and Vercel values plus local CLI/repository readiness required before external connection. | Prepared locally; values open |

## Current Verification

- `NEXT_DIST_DIR=.next-preflight-build-assignmentfixture npm.cmd run verify:local` passed on 2026-06-19, covering source-backed requirements, platform environment reporting, launch readiness reporting, Supabase migration guardrails, Next route type generation, TypeScript, and production build.
- `npm.cmd run typecheck` passed on 2026-06-19.
- `npm.cmd run verify:requirements` passed on 2026-06-19 with 81 source-backed checks.
- `npm.cmd run verify:launch` passed locally as a read-only report; Git, Supabase, and Vercel readiness remain open.
- `npm.cmd run verify:production` failed as expected on 2026-06-19 because production platform and live-tooling blockers remain open.
- `npm.cmd run verify:platform` passed locally as a report; production values remain open.
- `npm.cmd run verify:migrations` passed on 2026-06-19 with 37 source-backed checks.
- Production build passed with isolated local preflight output; final post-cleanup `typecheck`, `verify:requirements`, and `verify:migrations` also passed.
- Draft GitHub Actions CI exists at `.github/workflows/runtime-ci.yml`; it is not GitHub-run evidence until the repository is connected.
- Browser verification exists for the main actor workflows in `docs/local-build-report.md`, including UJ-DRV-001 S5 run-close confirmation/action-items, SOP-DEL-04 price-discrepancy sign-off, SOP-DEL-04 delivery sign-off proof, SOP-PUP-02 supplier-stop closeout, Policy #3 / Policy #4 / Policy #5 privacy request, Policy #21 / Policy #7 data-use, Policy #6 NDB response, Policy #20 AI draft review, Policy #24 month-end financial reconciliation, Policy #27 WHS hazard No Pickup/Admin follow-up, CAP-MCL-001 Supplier Approval Gate, Policy #15 goods acceptance, Policy #22 driver availability notice/late/contingency and dispatch-block, CAP-MCL-002 Run Planning Monitor and APP-ADM-002 exception queueing, SOP-RUN-04 source-correct future-pickup Bring Forward, SOP-DEL-01 grouped delivery stop workflow, Admin client supplier-access reason/evidence workflow, Day 8 auto-generated overdue notice evidence, Driver/Admin workflow-rule notice checks, Village CRM Rhythm Monitor/CRM Review workflow, Billing Contact to Admin investigation outcome workflow, Policy #14 cancellation workflow, Policy #8 failed-delivery/redelivery-fee workflow, Policy #16 vendor pickup standards workflow, Policy #18 required-field/remedy/outcome workflow, SOP-DEL-05 proof-driven delivery completion, SOP-BIL-04 fresh invoice approval/dispatch, the public website/app-entry handoff check, the in-app reset confirmation smoke check, and the post-cleanup route smoke check for `/`, `/legal`, and `/booking`.

## Blockers That Must Not Be Invented

- GitHub owner, repository name, and local Git availability.
- Supabase MCP project ref `fhrqfrhqopicekaiibyj` is registered/authenticated, but region, credentials, Auth identity binding, RLS execution, migration execution, and Storage policy testing remain open.
- Vercel deployment ownership, environment variables, deployment protection, and monitoring evidence.
- Notification provider and delivery channels for activation, booking, invoice, overdue, suspension, reinstatement, termination, delivery updates, and Admin alerts.
- Policy #23 repeated non-payment termination remains blocked until debt recovery escalation and write-off thresholds are confirmed.
- Public tracking token model and final customer-visible tracking status taxonomy.
- Invoice PDF UAT, manual payment evidence format, manual corrected-invoice process if required, and out-of-system BAS/Otimi reporting evidence.
- Role-based GM Moto & Co Logistics Privacy Owner evidence, retention destruction approval workflow, and any remaining TBD retention periods.
- Production reason-code taxonomies beyond the SOP-DEL-04 failed-delivery categories for driver issues, redelivery, retained goods, upload retry, and any extra wrong-address handling. Offline handling is now governed by SOP-OPS-01.
- WHSQ notifiable-incident procedure, production WHS notification ownership, and full fatigue/risk framework activation evidence.
- Actual supplier named dock contacts, live Policy #16 supplier-health automation, and exact health scoring beyond CAP-MCL-001 thresholds.
- Privacy Owner (ACT-TECH-002), Policy #6 OAIC/affected-person notification templates, website public statement URL, and production NDB incident responsibility handoff.
- Approved public legal copy, final website sitemap/copy, real approved black-and-white photography, and case/origin-story publishing approval.
- Production authority for applying price-rule changes where user direction and source material still need reconciliation.
- Formal owner/legal/privacy approvals for the recreated v2.0 baseline source pack.

## Next Source-Backed Actions

1. When platform answers arrive, update `docs/decision-log.md`, `docs/architecture.md`, and `docs/open-questions.md`, then wire GitHub/Supabase/Vercel.
2. When notification answers arrive, replace local-only outbox records with provider-backed send attempts and keep APP-ADM-005 failure routing.
3. When tracking-token/status answers arrive, add the public tracking experience without weakening authenticated account-scoped tracking.
4. When legal copy is approved, publish only the approved documents under `/legal`.
5. When billing/payment evidence is ready, test the invoice PDF download path and record the manual payment/reconciliation evidence expected from Admin.
6. Keep `docs/production-blocker-register.md` as the gating source before turning any local-only evidence path into production behavior.
