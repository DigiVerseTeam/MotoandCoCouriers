# Launch Checklist

Last updated: 2026-06-19

This checklist is staged around confirmed source material and known platform direction. It is not a final project plan.

## Documentation first

- [x] Create documentation hub.
- [x] Record known facts from brand guide.
- [x] Record open questions.
- [x] Record initial platform direction.
- [x] Extract full archive inventory.
- [x] Extract Village CRM/ERM design standard.
- [x] Confirm release-one CRM/ERM scope.
- [x] Extract release-one source map.
- [x] Build local website/app package.
- [x] Create production blocker register.
- [x] Add local runtime requirement verification gate.
- [x] Add read-only launch readiness checker for GitHub, Supabase, and Vercel handoff blockers.
- [x] Add strict production readiness gate that fails until platform blockers are resolved.
- [ ] Extract and review approved legal source documents.
- [ ] Extract and review booking, tracking, POD, run planning, and onboarding SOPs.
- [ ] Confirm release-one scope.

## Brand and launch readiness

- [ ] Lock public trading name.
- [ ] Confirm public geography wording.
- [ ] Confirm brand hierarchy between Moto and Co, Moto and Co Couriers, and GCMTM.
- [x] Confirm production logo asset.
- [ ] Select semantic UI colours for error, warning, and success.
- [ ] Select icon library.
- [x] Confirm photography source.

## Website release

- [x] Add local public website route with app entry points.
- [ ] Confirm sitemap.
- [ ] Confirm homepage copy.
- [ ] Confirm `/legal/` documents and approval status.
- [ ] Confirm booking entry content.
- [ ] Confirm tracking link entry content.
- [ ] Confirm case asset availability.
- [ ] Confirm origin story availability.

## Runtime release

- [x] Confirm user roles.
- [ ] Confirm booking workflow fields and rules.
- [ ] Confirm tracking statuses.
- [x] Confirm POD requirements.
- [ ] Confirm driver workflow.
- [ ] Confirm admin workflow.
- [x] Confirm billing pricing source.
- [x] Confirm exception workflow.

## Supabase

- [ ] Confirm Supabase project owner.
- [ ] Confirm region.
- [ ] Confirm environments.
- [ ] Confirm auth model.
- [x] Draft release-one database entities.
- [x] Add static Supabase migration guardrail verification.
- [x] Confirm storage needs for POD assets.
- [ ] Confirm Row Level Security model.
- [ ] Confirm backup and retention requirements.

## GitHub

- [ ] Install or expose Git locally.
- [ ] Confirm repository owner.
- [ ] Confirm repository name.
- [ ] Initialise repository.
- [ ] Commit documentation baseline.
- [ ] Add branch protection or review rules if required.
- [x] Add CI once app scaffold exists.
- [x] Add read-only Git/GitHub readiness report.
- [x] Add strict production gate coverage for missing Git/GitHub readiness.

## Vercel

- [ ] Confirm Vercel account/team.
- [ ] Confirm production domain.
- [x] Confirm preview deployment policy.
- [x] Add app-side guard blocking preview/local builds from production-labelled Supabase.
- [x] Add environment variable contract/reporting.
- [x] Add read-only Vercel readiness report.
- [x] Add strict production gate coverage for missing Vercel readiness.
- [ ] Confirm environment variables.
- [ ] Connect GitHub repository.
- [ ] Connect Supabase variables.
- [ ] Deploy preview.
- [ ] Promote production after approval.
