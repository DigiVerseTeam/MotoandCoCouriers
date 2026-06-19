# Current State Audit

Last updated: 2026-06-19

This audit checks the current local package against the user objective: develop the Moto and Co end-to-end local software and website package from BOAS, customer journeys, and the old Moto and Co Logistics app baseline, without inventing unknown requirements.

It is not a claim that production launch is complete. It separates locally executable software from items that need live platform access or business/policy decisions.

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
- BOAS v1.8 / SOP-IAM-03 Super Admin and provisioning update from `super admin boas.zip`.
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
| Driver login and delivery workflow | Local testing-code login, compiled run brief, pre-trip gate, Policy #27 fatigue/health and WHS incident reporting, supplier pickup, SOP-PUP-02 supplier-stop closeout, Policy #15 goods-acceptance evidence, Policy #16 pickup standards evidence, structured Policy #15 / Policy #16 / Policy #27 No Pickup / SOP-RUN-04 future-pickup Bring Forward / Policy #8 Failed Delivery attempts, SOP-DEL-01 grouped delivery stops by account/address with one signature per location, SOP-DEL-04 gated address/goods/receiver/handover/price/device-supervision sign-off, SOP-DEL-04 price-discrepancy reporting from read-only price review, POD receiver/signature capture, SOP-DEL-05 system delivery completion, and UJ-DRV-001 S5 run-close confirmation/action items exist. | Locally built |
| Admin operations | Admin CRM, account activation/suspension/reinstatement/termination, supplier master data with CAP-MCL-001 approval-gate evidence, supplier pickup standards and Policy #27 WHS hazard monitoring, Driver Directory account records, Policy #22 manual driver availability with notice/late/contingency evidence, fleet register, CAP-MCL-002 run-planning monitor, dispatch/run compilation, Policy #14 cancellation review, WHS/fatigue exceptions, billing, Policy #24 month-end financial reconciliation, Policy #6 NDB suspected-incident intake/containment register, Policy #21 / Policy #7 data-use register, Policy #3/#4/#5 privacy request register, pricing, retention, audit, structured access governance, and SOP-IAM-03 user provisioning for Admin/Super Admin boundaries are locally interactive. | Locally built |
| AI use governance | Admin has a Policy #20 AI Draft Review Gate that creates local CTA draft records from flagged CRM, supplier, and APP-ADM-005 exception records; Admin must review with a note before approval/rejection; approved drafts are explicitly not sent and stay `not_sent_provider_not_configured`; live AI provider/model/prompt/send path remains blocked. | Locally built; production AI integration blocked |
| Receiver actor | Receiver remains no-login; receiver name and signature are captured only through Driver POD. | Locally built |
| Controlled suppliers | Suppliers are local Admin-managed records, not hard-coded form choices; Admin can capture CAP-MCL-001 dock-access, packaging-standards, pickup-window, written-approval evidence, and named dock contact status; browser verification confirmed disabled archive for open-work suppliers, required Admin reason/evidence, archive/reactivation state changes, APP-PRV-004 audit rows, and master-data change rows. | Locally built |
| Controlled workshops / CRM | Admin can manage workshop/customer CRM records with contacts, owner, events, event-level next actions, obligations, governed supplier-link changes with reason/evidence, status, and a source-backed CRM Rhythm Monitor for incomplete records, due reviews/actions, overdue obligations, at-risk records, and open issues. | Locally built |
| Pricing rules table and Admin update path | Structured local price rules exist; browser verification confirmed Admin reason plus Owner approval reference guards, archive/reactivation state changes, generated local change-log IDs, APP-PRV-004 audit rows, and pricing master-data change rows. Supabase draft guardrails require change-log evidence. | Locally built; production authority unresolved |
| POD storage and retention | Local proof records use private `delivery-proof/deliveries/{delivery_id}/signature.png` path convention and carry SOP-DEL-04 sign-off evidence; Supabase draft migrations define private bucket, path guard, linked-role read policy, sign-off proof constraints, and 7-year retention queueing. | Locally built; live Storage testing blocked |
| Exceptions and disputes | APP-ADM-005 local queue, daily structured alert, cancellation review requests, Policy #8 failed-delivery fee review, Policy #16 supplier pickup standards review, SOP-EXC-03 unmatched billing account correction, Policy #18 dispute reason/date/invoice timing/SLA/Owner escalation/finding/remedy/outcome-history controls, dispute investigation against invoice/work/POD proof, supplier/pricing review exceptions, and notification-failure exception routing exist. | Locally built |
| Billing and account suspension/termination | Draft invoice batches, SOP-BIL-04 rendered-invoice approval before dispatch, browser-verified SOP-EXC-03 unmatched account exclusion/correction before invoice inclusion, a fresh-seed unmatched-account fixture for correction-path verification, proof-linked SOP-DEL-05 billing-ready delivery line items, approved Policy #8 redelivery-fee line items, dispatch evidence, payment evidence after dispatch before Paid, Policy #24 month-end financial reconciliation evidence, system-generated local Day 8 overdue notice evidence, Admin fallback Day 8 notice recording, non-payment suspension confirmation, conduct suspension evidence, both-contact notice evidence, reinstatement evidence, voluntary termination, conduct termination, Owner consultation evidence, written termination notice evidence, and local termination account notices exist. | Locally built; repeated non-payment termination, external delivery/payment/accounting source blocked |
| Audit and retention | Local APP-PRV-004 hash-chain audit review and Policy #5 / Policy #24 / Policy #6 retention register exist for confirmed 7-year pickup request, supplier relationship, master-data change-log, POD proof, financial reconciliation, and post-breach review report rules; browser verification generated supplier master-data changes and confirmed disabled destruction pending Privacy Owner approval. | Locally built; deletion approval blocked |
| Public website | `/website` uses confirmed logo, brand colours, market geography, cadence, booking/tracking/app links, and photo placeholders because no approved photos exist; browser verification confirmed website links hand off to `/booking`, `/tracking`, `/`, and `/legal`, with no mobile horizontal overflow at 390px. | Locally built |
| Legal page | `/legal` lists required legal surfaces as not published and avoids publishing unapproved legal copy; browser verification confirmed 8 required rows with 8 `Not Published` statuses. | Locally built as status surface only |
| Supabase backend | Active logistics migrations are applied to production with RLS, API table privileges, private POD storage, audit, retention, pricing, notification, cancellation, billing-notice generation, Policy #6 NDB incident controls, Policy #21 / Policy #7 data-use controls, Policy #3 / Policy #4 / Policy #5 privacy request controls, Policy #24 financial reconciliation controls, Policy #20 AI draft review controls, Policy #22 driver scheduling, Policy #27 WHS hazard controls, CAP-MCL-001 supplier approval gate, CAP-MCL-002 run planning monitor, Policy #8, Policy #15, Policy #16, Policy #18 dispute SLA/remedy/outcome-history, SOP-PUP-02 supplier-stop closeout, SOP-DEL-01 grouped delivery stops, SOP-DEL-04 delivery sign-off proof, SOP-DEL-05, UJ-DRV-001 run-close confirmation, a bootstrapped Admin role, and the SOP-IAM-03 Super Admin provisioning migration/script. HCM-owned driver legal/classification/agreement/conduct/expansion migrations were extracted from the active migration set. | Production backend active; first Super Admin, approved launch master data, and live actor journey tests still blocked |
| Supabase migration guardrails | `npm.cmd run verify:migrations` statically checks core source-backed migration markers for schema, RLS, audit hash-chain, private POD storage, retention, pricing, supplier-stop closeout, delivery sign-off proof, delivery stop grouping/completion, WHS hazard controls, exceptions, billing, and dispute guardrails. | Locally verified; live execution blocked |
| Vercel launch | Vercel project `digi-verse/motoandcocouriers` is connected to GitHub and deployed at `https://motoandcocouriers.vercel.app`; live smoke test returned HTTP 200 for `/`, `/login`, `/booking`, and `/admin` on 2026-06-19. | Deployed; Supabase-backed runtime still blocked |
| GitHub launch | V1 is merged to `DigiVerseTeam/MotoandCoCouriers` `main`; the old build is archived on `archive/old-netlify-vite-build-2026-06-19`; draft GitHub Actions CI exists in the repo. | Connected; CI/release evidence pending |
| Platform environment handoff | `.env.example`, `docs/platform-env-contract.md`, `npm.cmd run verify:platform`, `npm.cmd run verify:launch`, and the failing strict `npm.cmd run verify:production` gate list remaining local env/Supabase values required before full live production. | Partially complete; Supabase values open |

## Current Verification

- `npm.cmd run verify:local` passed on 2026-06-19, covering source-backed requirements, platform environment reporting, launch readiness reporting, Supabase migration guardrails, Next route type generation, TypeScript, and production build with isolated `.next-preflight-build` output.
- `npm.cmd run typecheck` passed on 2026-06-19.
- `npm.cmd run verify:requirements` passed on 2026-06-19 with 89 source-backed checks.
- `npm.cmd run verify:live` passed 32 production checks on 2026-06-19, then failed only on missing approved client/supplier/driver/vehicle records and missing active `super_admin`, `driver`, `client_ops`, and `client_billing` role records. The first Admin role remains active in production and is not silently promoted.
- `npm.cmd run verify:launch` remains a read-only local env report; GitHub, Supabase, and Vercel are connected externally, while approved launch master data remains open.
- `npm.cmd run verify:production` failed as expected on 2026-06-19 because production platform and live-tooling blockers remain open.
- `npm.cmd run verify:platform` passed locally as a report; production values remain open.
- `npm.cmd run verify:migrations` passed on 2026-06-19 with 35 source-backed checks.
- Production build passed with isolated local preflight output; final post-cleanup `typecheck`, `verify:requirements`, and `verify:migrations` also passed.
- Browser smoke on `http://127.0.0.1:3001/admin` passed after `next.config.mjs` allowed the `127.0.0.1` dev origin: Admin login issued and verified a local code, the Access tab opened, Receiver showed as `ACT-INT-004`, and SOP-IAM-03 provisioning displayed with Admin creation hidden from a non-Super-Admin session.
- Draft GitHub Actions CI exists at `.github/workflows/runtime-ci.yml`; it is not GitHub-run evidence until the repository is connected.
- Browser verification exists for the main actor workflows in `docs/local-build-report.md`, including UJ-DRV-001 S5 run-close confirmation/action-items, SOP-DEL-04 price-discrepancy sign-off, SOP-DEL-04 delivery sign-off proof, SOP-PUP-02 supplier-stop closeout, Policy #3 / Policy #4 / Policy #5 privacy request, Policy #21 / Policy #7 data-use, Policy #6 NDB response, Policy #20 AI draft review, Policy #24 month-end financial reconciliation, Policy #27 WHS hazard No Pickup/Admin follow-up, CAP-MCL-001 Supplier Approval Gate, Policy #15 goods acceptance, Policy #22 driver availability notice/late/contingency and dispatch-block, CAP-MCL-002 Run Planning Monitor and APP-ADM-002 exception queueing, SOP-RUN-04 source-correct future-pickup Bring Forward, SOP-DEL-01 grouped delivery stop workflow, Admin client supplier-access reason/evidence workflow, Day 8 auto-generated overdue notice evidence, Driver/Admin workflow-rule notice checks, Village CRM Rhythm Monitor/CRM Review workflow, Billing Contact to Admin investigation outcome workflow, Policy #14 cancellation workflow, Policy #8 failed-delivery/redelivery-fee workflow, Policy #16 vendor pickup standards workflow, Policy #18 required-field/SLA/remedy/outcome workflow, SOP-DEL-05 proof-driven delivery completion, SOP-BIL-04 fresh invoice approval/dispatch, the public website/app-entry handoff check, the in-app reset confirmation smoke check, and the post-cleanup route smoke check for `/`, `/legal`, and `/booking`.

## Blockers That Must Not Be Invented

- First Super Admin display name, email address, and approval reference are not yet supplied.
- Vercel is deployed, but full production actor testing remains blocked until first Super Admin approval, approved launch master data, and active Driver/Client Ops/Client Billing role records exist.
- Notification provider and delivery channels for activation, booking, invoice, overdue, suspension, reinstatement, termination, delivery updates, and Admin alerts.
- Policy #23 repeated non-payment termination remains blocked until debt recovery escalation and write-off thresholds are confirmed.
- Public tracking token model and final customer-visible tracking status taxonomy.
- Zoho Books integration versus export/manual reconciliation, production EFT/payment confirmation source, external accountant/BAS handoff, Otimi Rules reporting cadence/format/recipient, and the Policy #18 credit-note/corrected-invoice issue path.
- Privacy Owner, retention destruction approval workflow, and any remaining TBD retention periods.
- Production reason-code taxonomies beyond the SOP-DEL-04 failed-delivery categories for driver issues, redelivery, retained goods, upload retry, offline handling, and any extra wrong-address handling.
- WHSQ notifiable-incident procedure, production WHS notification ownership, and full fatigue/risk framework activation evidence.
- Actual supplier named dock contacts, live Policy #16 supplier-health automation, and exact health scoring beyond CAP-MCL-001 thresholds.
- Privacy Owner (ACT-TECH-002), Policy #6 OAIC/affected-person notification templates, website public statement URL, and production NDB incident responsibility handoff.
- Approved public legal copy, final website sitemap/copy, real approved black-and-white photography, and case/origin-story publishing approval.
- Production authority for applying price-rule changes where user direction and source material still need reconciliation.

## Next Source-Backed Actions

1. When Supabase access arrives, run dry-run/live migration checks, set the remaining Vercel env vars, redeploy, and repeat live workflow verification.
2. When notification answers arrive, replace local-only outbox records with provider-backed send attempts and keep APP-ADM-005 failure routing.
3. When tracking-token/status answers arrive, add the public tracking experience without weakening authenticated account-scoped tracking.
4. When legal copy is approved, publish only the approved documents under `/legal`.
5. When payment/accounting answers arrive, implement the confirmed invoice export, Zoho integration, BAS/accountant handoff, Otimi reporting workflow, or live payment reconciliation workflow.
6. Keep `docs/production-blocker-register.md` as the gating source before turning any local-only evidence path into production behavior.
