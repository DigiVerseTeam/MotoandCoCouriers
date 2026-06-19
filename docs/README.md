# Moto and Co Couriers Runtime Documentation

This folder is the working documentation hub for the Moto and Co Couriers app and website.

Principle: do not fill gaps. If a detail is not confirmed by the source documents or a direct business decision, mark it `TBD` and keep it visible.

## Current documentation set

- `runtime-brief.md` - confirmed project facts, intended runtime direction, and launch posture.
- `release-one-rules.md` - confirmed application rules for the first build.
- `release-one-source-map.md` - source-backed implementation rules extracted from SOPs and policies.
- `village-crm-rules.md` - CRM/ERM design standard extracted from The Village requirements.
- `architecture.md` - GitHub, Supabase, and Vercel structure with unknowns called out.
- `platform-env-contract.md` - environment values and handoff checks required before GitHub, Supabase, and Vercel can be treated as connected.
- `local-build-report.md` - verification evidence, including runtime, platform, and Supabase migration guardrail checks.
- `open-questions.md` - decisions needed before build, launch, or database migrations.
- `decision-log.md` - dated record of confirmed and pending decisions.
- `source-index.md` - local source files and archive contents identified so far.
- `customer-journey-comparison.md` - uploaded customer/admin/driver journeys checked against the local build.
- `legacy-app-reference-notes.md` - old app references checked for reusable interaction patterns.
- The in-app `/accountability` route now holds the source-backed software actor accountability model.
- `launch-checklist.md` - staged build and launch checklist based on confirmed source material.
- `local-build-report.md` - what has been built and verified locally.
- `build-gaps.md` - remaining gaps after the local build.
- `current-state-audit.md` - requirement-by-requirement audit of local software evidence versus production blockers.
- `production-blocker-register.md` - strict launch blocker register showing what must be answered or connected before production behavior is built.
- `hcm-boundary.md` - corrected boundary for driver legal/HCM material extracted from the logistics app.
- BOAS v1.9 / `SOP-IAM-03` updates are reflected in the runtime docs: Super Admin is `ACT-INT-003`, Receiver is `ACT-INT-004`, and Admin provisioning/master-data changes must run through server-side audited paths.

## Source status

Primary source reviewed:

- `Moto_and_Co_Couriers_Brand_Guide_V1.pdf`

Local assets identified but not yet fully extracted:

- Policy zip archives
- SOP zip archives
- `super admin boas.zip`
- Capability documents
- Logo image asset
- Word documents in the workspace root

## Update rule

When new answers arrive:

1. Add the decision to `decision-log.md`.
2. Update the affected brief or architecture section.
3. Remove or close the matching question in `open-questions.md`.
4. Only then convert any `TBD` into implementation work.
