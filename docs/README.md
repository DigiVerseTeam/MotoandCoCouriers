# Moto and Co Couriers Runtime Documentation

This folder is the working documentation hub for the Moto and Co Couriers app and website.

Principle: do not fill gaps. If a detail is not confirmed by the source documents or a direct business decision, mark it `TBD` and keep it visible.

## Current documentation set

- `runtime-brief.md` - confirmed project facts, intended runtime direction, and launch posture.
- `release-one-rules.md` - confirmed application rules for the first build.
- `release-one-source-map.md` - source-backed implementation rules extracted from SOPs and policies.
- `offline-device-sync-sop.md` - SOP-OPS-01 offline device sync and recovery rule for driver network dropouts.
- `baseline-documentation-register.md` - baseline documentation control register for BOAS, SOP, policy, journey, and runtime alignment before new build work.
- `baseline-tbd-approval-register.md` - owner-facing approval/rejection register for the remaining baseline `TBD` decisions.
- `system-testing-status-and-uat-scripts.md` - current system testing status and UAT scripts for V1 production testing.
- `pre-uat-test-report-2026-07-02.md` - Codex pre-UAT system check evidence for the current V1 candidate.
- `uat-final-signoff-pack-v1.md` - short owner UAT control sheet separating Codex system checks from business sign-off tests.
- `product-backlog-v1.md` - working product backlog for V1 changes, candidate changes, UAT findings, and immediate post-UAT improvements.
- `legal-pages-policy-reconciliation.md` - legal page reconciliation against v2.0 policy changes.
- `brand-architecture-marketing-capability.md` - working marketing capability note for brand architecture, public copy boundaries, and future copy-control policy needs.
- `../src/content/legal/motoandco-legal-pages.v2.html` - source-code copy of the approved legal pages rendered by `/legal`.
- `policy-baseline-reconciliation.md` - policy impact addendum showing which policies must be formally updated and what remains unapproved.
- `../baseline/v2.0/` - recreated version-controlled baseline pack with DOCX/markdown addendums and full-source BOAS, SOP, policy, and journey outputs.
- `village-crm-rules.md` - CRM/ERM design standard extracted from The Village requirements.
- `architecture.md` - GitHub, Supabase, and Vercel structure with unknowns called out.
- `platform-env-contract.md` - environment values and handoff checks required before GitHub, Supabase, and Vercel can be treated as connected.
- `local-build-report.md` - verification evidence, including runtime, platform, and Supabase migration guardrail checks.
- `open-questions.md` - decisions needed before build, launch, or database migrations.
- `decision-log.md` - dated record of confirmed and pending decisions.
- `decision-register-alignment.md` - 24 decisions-register gaps mapped to portal alignment and remaining integration dependencies.
- `user-journey-gap-audit.md` - UJ gap audit updated after the decisions register resolved all 24 pre-build gaps.
- `source-index.md` - local source files and archive contents identified so far.
- `customer-journey-comparison.md` - uploaded customer/admin/driver journeys checked against the local build.
- `legacy-app-reference-notes.md` - old app references checked for reusable interaction patterns.
- The in-app `/accountability` route now holds the source-backed software actor accountability model.
- `launch-checklist.md` - staged build and launch checklist based on confirmed source material.
- `local-build-report.md` - what has been built and verified locally.
- `build-gaps.md` - remaining gaps after the local build.
- `current-state-audit.md` - requirement-by-requirement audit of local software evidence versus production blockers.
- `production-blocker-register.md` - strict launch blocker register showing what must be answered or connected before production behavior is built.
- `hard-scope-requirements.md` - hard boundaries: no SLA monitoring and no HCM requirements in the logistics portal build.
- `hcm-boundary.md` - corrected boundary for driver legal/HCM material extracted from the logistics app.

## Current V1 documentation reconciliation

- Offline driver operation is now a documented V1 operating rule, not an implied technical feature.
- Billing V1 runtime is downloadable EOM invoice PDF only. Admin email, payment follow-up, and bank reconciliation happen outside the portal; OpenClaw/Xero/accounting API integration is not part of the V1 baseline.
- Previous evening-before run lockdown is rejected. A new driver `Create Daily Run` workflow is approved as a build requirement after ERD review.
- Privacy Owner is role-based GM Moto & Co Logistics.
- Ficeda has been removed from the active supplier network for V1 runtime.
- Draft legal pages now live with the app source at `src/content/legal/motoandco-legal-pages.v2.html`; the baseline pack keeps a matching evidence copy under `baseline/v2.0/full-source/legal/`.
- Brand architecture is recorded as a marketing capability input, with future Moto & Co family naming ideas held as future considerations only.
- Policies now have v2.0 draft DOCX copies under `baseline/v2.0/full-source/policies/`. They still require Policy Owner/legal owner approval before legal reliance or customer publication.
- A draft recreated baseline pack now exists under `baseline/v2.0/`, with full source outputs under `baseline/v2.0/full-source/`, a source-pack zip at `baseline/v2.0/MotoCo_Full_Baseline_v2.0_Draft.zip`, and a complete documentation-pack zip at `baseline/v2.0/MotoCo_Baseline_v2.0_Documentation_Pack.zip`; it does not overwrite the original BOAS, SOP, policy, or journey archives.
- Production runtime testing is occurring against `https://motoandcocouriers.vercel.app` and Supabase project ref `fhrqfrhqopicekaiibyj`, while data residency evidence, RLS, Storage, ERD, and deployment ownership checks remain open.

## Source status

Primary source reviewed:

- `Moto_and_Co_Couriers_Brand_Guide_V1.pdf`

Local assets identified but not yet fully extracted:

- Policy zip archives
- SOP zip archives
- Capability documents
- Logo image asset
- Word documents in the workspace root

## Update rule

When new answers arrive:

1. Add the decision to `decision-log.md`.
2. Update the affected brief or architecture section.
3. Update `baseline-documentation-register.md` and `policy-baseline-reconciliation.md` if the change affects BOAS, SOPs, policies, journeys, or customer-facing rules.
4. Remove or close the matching question in `open-questions.md`.
5. Only then convert any `TBD` into implementation work.
