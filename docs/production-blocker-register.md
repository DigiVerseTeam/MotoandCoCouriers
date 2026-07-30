# Production Blocker Register

Last updated: 2026-07-02

This register separates the local software package from production launch blockers. It is intentionally strict: if a production behavior needs a missing platform credential, owner decision, policy approval, or unconfirmed business rule, it stays blocked instead of being invented.

Driver legal classification, driver agreements, driver verification evidence, disciplinary/removal consequences, and driver/courier expansion employment-payment models are HCM requirements, not logistics production blockers. Draft material for those items is preserved in `hcm-extract/` and tracked in `docs/hcm-boundary.md`.

Production-first V1 is confirmed. The blockers below are the evidence and access needed before the first production deployment can be treated as live.

## P0 Platform Blockers

| Blocker | Current local evidence | Required answer or access |
| --- | --- | --- |
| GitHub repository is not connected from local workspace. | GitHub connector can see `DigiVerseTeam/MotoandCoCouriers` with repo permissions; local Next.js app, docs, Supabase migrations, and seed SQL exist in the workspace. Normal `git` is not available on PATH and the local folder is not confirmed as a Git repository. | Install/expose local Git or safely clone the repo, push to a branch such as `codex/v1-logistics-runtime`, and open a draft PR without overwriting the old build on `main`. |
| Production Supabase project is not fully assured. | Supabase project ref `fhrqfrhqopicekaiibyj` is active for V1 runtime testing; source-backed draft migrations exist for schema, RLS, Storage, audit, retention, billing, pricing, exceptions, POD, and local guardrails. | Confirm region/data residency, URL/key/secret ownership, Auth settings, migration execution state, live RLS tests, Storage tests, monitoring, and live tool exposure. |
| Australian Supabase data residency is not proven. | User direction says intended yes; docs keep Digiverse confirmation open. | Digiverse must confirm Supabase region/infrastructure before production data is stored. |
| Live RLS/Auth binding needs final evidence. | Production login/provisioning is active enough for V1 testing, and first-pass BOAS Sheet 05 RLS migration exists. | Confirm Supabase Auth identity claims/role mapping, run live RLS tests for Client Operational, Client Billing, Driver, Admin, Super Admin, and Receiver no-login boundaries. |
| Private POD Storage flow needs UAT. | Migration defines private `delivery-proof` bucket, path contract, upload/read policy, proof sign-off fields/constraints, and retention queueing. Runtime proof metadata can sync through the server path and Storage failure can mark proof metadata as storage-pending. | Run live iPad/device POD Storage UAT and confirm proof-object persistence, read access, retry behaviour, and retention path. |
| System testing is not complete. | Baseline v2.0 is now the source of truth for testing. Storage/POD process is approved but failed system testing. Auth/RLS, Storage/POD, production access logs, offline sync, and billing PDF require UAT evidence. | Execute `docs/system-testing-status-and-uat-scripts.md`, retain pass/fail evidence, and retest failed items before production stability is claimed. |
| Production Vercel ownership and environment governance are not fully evidenced. | Active production portal is `https://motoandcocouriers.vercel.app`; route smoke checks have passed. | Confirm Vercel team/account, production project ownership, environment variables, deployment protection, monitoring, and no-preview-to-production Supabase governance. |

## P0 Integration Blockers

| Blocker | Current local evidence | Required answer or access |
| --- | --- | --- |
| Notification provider and channel are unconfirmed. | Local operational and billing notice records exist with `local_record_only` and `provider_not_configured`; failed notice rows route to APP-ADM-005. | Confirm launch channels for activation, booking, tracking updates, invoice, overdue, suspension, reinstatement, termination, disputes, and Admin alerts. |
| Invoice PDF operating evidence still needs UAT. | V1 Admin Billing can generate/download portal invoice PDFs and group client/month history. Xero, OpenClaw, and accounting API integration are removed from the V1 baseline. | Run UAT that Admin can download the correct client/month PDF. Admin then emails the PDF manually outside the portal; bounce handling, payment follow-up, and bank reconciliation are human processes outside the runtime. |
| Production next-period treatment for already-invoiced account corrections is unconfirmed. | SOP-EXC-03 local workflow excludes unmatched work before invoicing and the Supabase correction function blocks retro-modifying already-invoiced work. | Confirm how already-invoiced account corrections are noted, carried forward, approved, and evidenced in the chosen invoice provider. |
| Manual payment evidence needs operating control. | Admin can record local payment evidence before marking an invoice paid or reinstating an account. | Confirm who performs the out-of-system bank reconciliation and what evidence Admin records in the portal. |
| BAS/accountant handoff and Otimi Rules reporting are outside runtime. | Admin can record local Policy #24 month-end financial-control evidence, confirm no off-system revenue, see 5-business-day due dates, and retain financial-control records for 7 years. | Keep BAS/tax handoff and Otimi Rules reporting as human/accounting processes outside the portal unless a later approved baseline adds them. |
| Policy #18 corrected-invoice handling needs manual-process approval if required. | Local Policy #18 findings create remedy obligations and due dates without claiming external accounting issue. | Confirm the manual correction/credit-note process only if a live dispute requires it; no invoice-provider API is part of V1. |
| Policy #20 live AI provider and send path are unconfirmed. | Admin can create and review local Policy #20 CTA draft records from flagged CRM, supplier, and exception records; approved drafts remain `Approved - Not Sent` with `not_sent_provider_not_configured`; Supabase draft migration stores review evidence and blocks autonomous send/batch approval/commercial decisions. | Confirm AI provider, model, prompt registry, prompt approval authority, agent orchestration, production review UX, outbound delivery channel, send evidence write-back, and whether sending is in scope for V1. |
| Scheduled production jobs are not configured. | Local runtime and draft SQL can generate Day 8 notice evidence; migrations represent retention queues and some monitoring triggers. | Confirm live scheduler/`pg_cron` authority for Day 8 notices, retention reviews, supplier monitoring, and APP-FLT-001 checks. Do not reintroduce the rejected evening-before run lockdown. |
| Offline device sync requires field UAT and recovery procedure. | `SOP-OPS-01` is written; driver portal has pending sync count, last sync issue, retry sync, local outbox, proof metadata fallback, and storage-pending status handling. | Run field UAT on the actual driver device/browser for offline pickup, offline POD, reconnect, retry sync, and Admin manual recovery. Confirm the unrecoverable local outbox procedure before relying on offline operation. |

## P1 Compliance And Legal Blockers

| Blocker | Current local evidence | Required answer or access |
| --- | --- | --- |
| Privacy Owner evidence needs retained role/contact approval. | Privacy Owner is role-based GM Moto & Co Logistics in the v2.0 baseline. Local retention register blocks destruction pending Privacy Owner approval. Policy #6 NDB register allows Admin suspected-incident intake and containment evidence only. | Retain the GM role approval reference, contact/escalation details, and approval workflow before destruction execution or final NDB decisions are treated as production-ready. |
| Some retention periods remain TBD. | Confirmed 7-year rules are implemented locally for pickup requests, supplier records, master-data change logs, and POD proof. | Confirm remaining Policy #5 retention periods and legal-hold/destruction evidence requirements. |
| Legal pages are not publishable. | `/legal` lists required legal surfaces but does not publish draft legal copy. | Provide approved Booking Terms, Credit Terms, Dangerous Goods Policy, Delivery Disclaimer, Privacy Policy, and Collection Notice copy. |
| Formal baseline approval is not recorded. | Full draft baseline source outputs now exist under `baseline/v2.0/full-source/`, including BOAS v2.0, SOP workbook set, policy v2.0 DOCX set, and journey records. | Owner, Policy Owner/legal owner, and Privacy Owner must approve the relevant v2.0 files before the set is treated as final legal/source baseline. |
| Privacy Policy and Collection Notice are draft. | Local Admin Privacy register records APP 12 access requests, APP 13 correction requests, privacy complaints, APP 4 unsolicited-information assessments, Policy #4 collection-notice version evidence, and Policy #5 Privacy Owner destruction blocking. | Approve Policy #3 and Policy #4 text; insert ABN/contact details; confirm APP 5 non-collection consequences, APP 6 Digiverse assessment, and Supabase data-location statement before publishing notices. |
| WHS regulator procedure and full fatigue framework are not final. | Local Policy #27 controls let Driver report fatigue/health concerns, WHS incident/near-miss issues, and supplier-premises WHS hazards; Admin receives WHS exceptions and supplier follow-up evidence, and the app records the unresolved-return block. | Confirm WHSQ notifiable-incident procedure, production WHS notification owner, and the trigger/evidence model for the formal fatigue framework/risk register when driver pool expansion, WHS incident, or regular fatigue risk occurs. |
| Production security confirmations are missing. | Local docs and migrations represent access, audit, RLS, and environment separation. | Digiverse must confirm TLS, encryption at rest, production access logging, backup posture, and incident responsibilities. |
| Policy #21 / Policy #7 production data-use evidence is unconfirmed. | Local Admin Data Use register records operational access, export requests, Digiverse production access, third-party sharing, marketing use, data-access breach escalation, blocked reasons, and APP-PRV-004 audit rows. Supabase draft `data_use_reviews` prevents blocked/prohibited data use from being approved. | Confirm Supabase Auth/RLS identity binding, Digiverse production access-log format, export approval evidence, consent evidence format, data-processing agreement/security schedule, and who reviews production data-use records. |
| Policy #6 NDB notification artefacts are missing. | Local Admin can record suspected incidents, containment actions, APP-PRV-004 audit refs, system/Digiverse evidence, and 30-day assessment due date. Supabase draft blocks eligible-breach decision without Privacy Owner evidence. | Provide OAIC notification process owner, affected-individual notification template, website public-statement URL/content process, and Digiverse incident handoff procedure. |

## P1 Product And Workflow Blockers

| Blocker | Current local evidence | Required answer or access |
| --- | --- | --- |
| Public tracking model is unconfirmed. | Authenticated Client Operational tracking exists and is account-scoped. | Confirm whether launch tracking is public token, authenticated, staff-only, or mixed; confirm visible statuses and event visibility. |
| Booking fields beyond source-backed fields are unconfirmed. | Local booking uses confirmed supplier, requested run date, and notes, with 12:30pm Brisbane cut-off and Tuesday/Thursday cadence. | Confirm any additional required pickup fields and whether unregistered customers can submit any request. |
| POD photo and device assumptions are unconfirmed. | Receiver name, signature, address/goods/receiver/handover/price confirmations, and driver-supervised signature capture are mandatory; GPS is not required; proof path/storage contract exists; offline behaviour is governed by SOP-OPS-01. | Confirm whether POD photos are excluded, optional, conditional, or mandatory, and approve the minimum supported driver device/browser model. |
| Production reason-code taxonomy is incomplete. | Local No Pickup now uses the decision-register confirmed category list, including `time_constraint`; SOP-RUN-04 Bring Forward is modelled as moving a complete future pickup into today's run when the supplier is already on today's route; Failed Delivery now uses source-backed SOP-DEL-04 categories. | Confirm any final production reason codes beyond the SOP-DEL-04 categories for driver issues, redelivery, retained goods, upload retry, and any extra wrong-address handling. |
| Driver-created daily run workflow is approved but not rebuilt/UAT-tested. | The previous evening-before lockdown is rejected. Existing local APP-ADM-002 compiles runs by supplier and delivery geography, with driver and fleet checks. | After ERD review, build and test `Create Daily Run` so the driver can consolidate ready con notes and record planned, brought-forward, and no-con-note depot pickups. Confirm whether V1 route sequencing stays manual/supplier-geography based. |
| Supplier-health scoring beyond CAP-MCL-001 targets is unspecified. | Local supplier monitor checks No Pickup rate and packaging/label refusal patterns against source targets. | Confirm any additional supplier scoring algorithm, named dock contacts, cadence, and Owner/Admin review authority. |
| Policy #23 repeated non-payment termination is not final. | Local voluntary and conduct termination workflows are interactive with Owner consultation and written notice evidence. Repeated non-payment termination is blocked in the runtime and Supabase draft trigger because the policy states the debt-recovery escalation path/write-off thresholds are open. | Confirm the debt recovery escalation path, external recovery trigger, write-off thresholds, authority, notice wording, and evidence required before repeated non-payment termination can be enabled. |
| Production price-change authority has source tension. | Admin can maintain local `price_rules` only with written reason and Owner approval reference; Supabase guardrails require change-log evidence. | Confirm whether Admin may directly apply approved production price changes or whether Digiverse executes after Admin + Owner approval. |

## P1 Brand And Website Blockers

| Blocker | Current local evidence | Required answer or access |
| --- | --- | --- |
| Public trading name and hierarchy are not launch-locked. | Website uses Moto and Co Couriers with approved PNG logo. | Confirm hierarchy between Moto and Co, Moto and Co Couriers, GCMTM, and any legal entity text. |
| Public geography wording needs approval. | Website uses confirmed operating geography/cadence cautiously. | Approve exact launch geography wording. |
| Final sitemap and public copy are not approved. | `/website` has safe app-entry content and placeholders. | Confirm homepage copy, booking entry copy, tracking entry copy, case/origin-story approval, and sitemap. |
| Approved photography is unavailable. | Website uses explicit black-and-white placeholders. | Provide approved black-and-white photos or approve placeholder strategy for launch. |
| Semantic UI state colours and icon library remain open. | Local UI uses confirmed V1 colours and `lucide-react` as an implementation placeholder. | Confirm exact success/warning/error hex values and final icon library. |

## P2 Production Data Blockers

| Blocker | Current local evidence | Required answer or access |
| --- | --- | --- |
| Production fleet vehicle records are missing. | Local Admin fleet register exists and dispatch blocks non-compliant vehicles. | Provide ACT-VEH-001/002 registration, expiry, insurance, GVM, make/model/year, ownership, assigned driver, service schedule, and defect history. |
| Policy #22 source and driver availability evidence need final alignment. | Local Admin can record Policy #22 unavailable/leave periods with note, notice received date, calculated due date, late-notice flag, contingency evidence, and dispatch/run-compiler blocking for unavailable drivers. | Surface Policy #22 source or approve a replacement. The previous evening-before run lockdown is rejected; keep only light-touch logistics availability governance for V1. |
| Live supplier/pricing/fleet monitoring execution is unproven. | Local monitors, production runtime records, and Supabase draft structures exist. Ficeda has been removed from the active supplier list for V1. | Confirm who runs/owns monitoring jobs, exception follow-up, supplier review cadence, and production master-data source evidence. |

## Build Rule

Do not convert any blocker above into production behavior until its required answer or access is supplied and recorded in `decision-log.md`. Local evidence can continue to be refined only where the source material already defines the rule.

Baseline documentation must also be checked before new build work. Use `docs/baseline-documentation-register.md` and `docs/policy-baseline-reconciliation.md` to confirm whether a BOAS, SOP, policy, or journey update is required before runtime changes.

`npm.cmd run verify:production` is the strict production gate. It is expected to fail while this register still has unresolved GitHub, Supabase, Vercel, local Git, live-tooling, or platform-value blockers.
