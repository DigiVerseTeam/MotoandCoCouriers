# Architecture Notes

Last updated: 2026-06-19

## Confirmed stack direction

- Repository: GitHub.
- Backend/runtime data: Supabase.
- Hosting: Vercel.

## Current workspace state

- A local Next.js app scaffold exists in this folder.
- The foreground local runtime is `src/components/moto-co-logistics.tsx`, ported from the old Moto & Co Logistics baseline and extended with source-backed journey workflows.
- The unused first-pass portal/workspace/provider scaffold has been removed so active app routes cannot drift back to placeholder workflow surfaces.
- Product routes currently load the logistics software shell rather than documentation pages.
- A public website route exists at `/website`. It uses confirmed brand assets and placeholder-safe content only.
- Supabase migrations exist under `supabase/migrations`.
- The deployed Vercel app has the live Supabase runtime bridge available for production-labelled sessions. First Super Admin bootstrap, approved launch master data, and actor workflow evidence are still required before it can be treated as fully live-backed.
- Supabase MCP is registered and OAuth authenticated for project ref `fhrqfrhqopicekaiibyj`; newly added MCP tools may require a fresh Codex session before they are callable in-thread.
- Git is available through `C:\Program Files\Git\cmd\git.exe`; plain `git` is not currently available on PATH in the local shell used by Codex.
- GitHub repository `DigiVerseTeam/MotoandCoCouriers` is connected; V1 is merged to `main`, and the old build is archived on `archive/old-netlify-vite-build-2026-06-19`.
- Vercel project `digi-verse/motoandcocouriers` is connected to GitHub and deployed at `https://motoandcocouriers.vercel.app`.
- Node.js is available.
- `npm.ps1` is blocked by PowerShell execution policy, but `npm.cmd` works.
- `next.config.mjs` supports `NEXT_DIST_DIR`; local preflight uses `.next-preflight-build` and draft CI uses `.next-ci` so verification does not depend on a locked or stale default `.next` directory.
- `npm.cmd run verify:launch` is a read-only launch-readiness report for Git CLI, Supabase CLI, Vercel CLI, required platform values, environment pairing, and local Git repository initialisation.
- `npm.cmd run verify:production` is the strict production readiness gate for environment values and local Git/Supabase/Vercel tooling. It passed with production values supplied on 2026-06-19.
- Existing workspace files are business, brand, SOP, capability, and policy documents.

## App structure

```text
moto-and-co-couriers/
  src/app/
    app routes
  src/components/
    active local runtime and shared utilities
  docs/
    product and runtime documentation
  supabase/
    migrations
    seed data
```

## GitHub

Confirmed:

- Repository: `DigiVerseTeam/MotoandCoCouriers`.
- Connector visibility exists for repository metadata and permissions.

TBD:

- Local Git installation/PATH and repository initialisation or clone strategy.
- Branching model.
- Required checks.
- Whether production deploys are automatic from `main` or manually promoted.

Local draft:

- `.github/workflows/runtime-ci.yml` runs `npm ci`, `npm run verify:requirements`, `npm run verify:platform`, `npm run verify:migrations`, `npm run typecheck`, and `npm run build` with `NEXT_DIST_DIR=.next-ci`; `npm run typecheck` generates Next route metadata before running TypeScript.
- This workflow has not run in GitHub because local Git availability and branch/PR handoff are not complete.
- Supabase and Vercel production ownership are confirmed. CI still needs live run evidence and branch-protection/release ownership decisions.

## Supabase

Confirmed:

- Production-first V1 path is approved by user direction on 2026-06-19.
- Local and preview builds must not connect to production Supabase.

TBD:

- Supabase project owner.
- Region.
- Production project ref `fhrqfrhqopicekaiibyj` confirmation, project URL/keys, and secret ownership.
- Auth providers.
- Live Row Level Security execution and testing. A first-pass policy migration exists from BOAS Sheet 05, but it is not production-proven.
- Whether tracking links are public, tokenised, authenticated, or mixed.

Confirmed Supabase requirements:

- Customer/workshop CRM should be guided by the Village CRM/ERM model in `village-crm-rules.md`.
- Release one uses a lean Village CRM/ERM subset: actors, contacts, events, obligations, and courier-specific operational tables.
- Suppliers must be stored in an administrator-managed table.
- Customers/workshops must be stored in a CRM-controlled table or tables.
- Pricing rules must be stored in a `price_rules` table.
- BOAS v1.8 / `SOP-IAM-03` requires a two-tier Super Admin/Admin model: first Super Admin is bootstrapped server-side, Super Admin creates Admin users, Admin creates Client Ops/Client Billing/Driver users, and the browser must never receive the `service_role` key.
- Policy #24 revenue reconciliation must be stored in Admin-managed financial reconciliation tables, not hard-coded reporting text.
- Policy #20 AI draft governance is stored as Admin-managed `ai_draft_reviews` evidence only; live AI provider, model, prompt registry, and outbound send transport are not part of the confirmed architecture yet.
- Policy #21 / Policy #7 data-use governance is stored as Admin-managed `data_use_reviews` evidence for operational access, exports, Digiverse production access, third-party sharing, marketing use, blocked acceptable-use decisions, breach escalation, and APP-PRV-004 audit.
- Policy #3 / Policy #4 / Policy #5 privacy governance is stored as Admin-managed `privacy_requests` evidence for APP 12 access requests, APP 13 correction requests, privacy complaints, APP 4 unsolicited information assessment, collection notice version evidence, and Privacy Owner destruction blocking.
- POD signatures must be stored in a private Supabase Storage bucket.
- Signature URL must be written to the `delivery_proof` table.
- POD records are retained for 7 years from delivery date.
- Delivery proof storage paths use `deliveries/{delivery_id}/...` in the private `delivery-proof` bucket, with assigned-driver/Admin upload and linked-role read policies represented in local migrations. `SOP-DEL-01` grouped delivery stops add a delivery-stop group layer so one proof can complete multiple work items for the same account/address while preserving proof-driven `SOP-DEL-05` completion.
- Audit log must be append-only, cover all PII actions, and be tamper-evident.
- `npm.cmd run verify:migrations` statically checks the local migrations for required source-backed guardrail markers. The active logistics migrations are applied to production Supabase; real actor Auth/RLS and Storage upload tests remain open.

Confirmed release-one data areas based on source documents, brand guide, and user confirmations:

- Actors for customers/workshops, suppliers, and any other approved relationship parties.
- Contacts linked to actors.
- Events.
- Obligations.
- Price rules.
- Pickup requests.
- Runs.
- Dispatch assignment guardrails for named driver and Admin-managed fleet vehicle record.
- Policy #20 AI draft review records for the three confirmed agents, Admin review evidence, no-autonomous-send, no-batch-approval, and no-commercial-decision constraints.
- Policy #6 NDB incident records for Admin suspected-breach intake, containment evidence, APP-PRV-004 audit refs, 30-day assessment deadline, Privacy Owner-only decision evidence, notification evidence, and post-breach review retention.
- Policy #21 / Policy #7 data-use review records for acceptable-use decisions, data-export approval evidence, Digiverse production access logs, third-party sharing/consent evidence, marketing consent evidence, blocked-reason capture, and breach escalation evidence.
- Policy #3 / Policy #4 / Policy #5 privacy request records for access/correction response due dates, complaint acknowledgement due dates, Privacy Act refusal evidence, collection notice version evidence, APP 4 unsolicited-information assessment, and Privacy Owner destruction/de-identification approval evidence.
- Policy #22 driver availability records for manual availability tracking, notice received date, due date, late-notice flag, and contingency evidence.
- Policy #27 WHS hazard flags, supplier-premises hazard status, and Admin exception evidence for fatigue, WHS incident/near miss, and unresolved supplier hazards.
- Driver directory account records for logistics identity/status only. Driver legal classification, agreements, verification evidence, disciplinary/removal consequences, and driver/courier expansion employment-payment models are excluded from the logistics data model and preserved for future HCM work in `hcm-extract/`.
- Jobs/deliveries.
- Delivery proof records.
- Drivers.
- Fleet vehicles / fleet asset register records.
- Invoices and invoice line references.
- Policy #24 financial reconciliation records and invoice links.
- Policy #6 post-breach review report records, retained for 7 years from completion where a report exists.
- Legal document acknowledgements.
- Exceptions, failed deliveries, disputes, and cancellations.
- Audit log entries.
- Run close records.
- Account suspension records.

Deferred Village data areas:

- Relationship records, unless required by a release-one workflow.
- Opportunities.
- Partner relationship management.
- Relationship health scoring.

Source materials used or still required before final schema and RLS:

- `The village ERM Complete Requirements v2.0.pdf`.
- Policy #3.
- Policy #4.
- Policy #5.
- Policy #7.
- Policy #21.
- Policy #9.
- Policy #18.
- `SOP-MDM-02`.
- BOAS Sheet 05, Roles & Access model. This has been reviewed from `MotoCo_Unified_BOAS_Hierarchy_v1.6.xlsx` for the first-pass RLS migration.
- BOAS Sheet 06, Data Objects. This has been reviewed from `MotoCo_Unified_BOAS_Hierarchy_v1.6.xlsx` for the first-pass fleet vehicle register and APP-FLT-001 guardrails.

## Vercel

Confirmed:

- Production-first V1 path is approved by user direction on 2026-06-19.
- Preview deployments must not connect to production Supabase.
- Vercel team/account: `DigiVerse` / `digi-verse`.
- Vercel project: `motoandcocouriers`.
- Production domain: `https://motoandcocouriers.vercel.app`.
- Website and app are deployed as one Vercel project for V1.

TBD:

- Preview domain.
- Environment variable ownership.
- Deployment protection requirements.
- Analytics and monitoring requirements.

Confirmed deployment rule:

- Preview deployments must not connect to production Supabase.
- Production deployment may use production Supabase once `NEXT_PUBLIC_APP_ENV=production` and `NEXT_PUBLIC_SUPABASE_ENV=production` are set with approved production values.
- A browser-client environment guard now enforces the confirmed no-preview-to-production rule using `NEXT_PUBLIC_APP_ENV` and `NEXT_PUBLIC_SUPABASE_ENV`. If a local or preview app is labelled against production Supabase, the client factory returns `null` instead of creating a live Supabase client.

Current environment labels:

- `NEXT_PUBLIC_APP_ENV`: `local`, `preview`, or `production`.
- `NEXT_PUBLIC_SUPABASE_ENV`: `local`, `preview`, or `production`.
- Supabase project URL, region, production publishable/server keys, and migration execution are confirmed. Auth identity binding, end-to-end RLS/Storage workflow verification, and secret ownership remain open.
- `docs/platform-env-contract.md` records the GitHub, Supabase, and Vercel values required before connection.
- `npm.cmd run verify:platform` reports the current environment contract without creating projects or connecting external services.

## Next build recommendation

1. Keep the local software runtime as the product baseline.
2. Split the large local component into role modules once behavior stabilises.
3. Wire the confirmed actor workflows to the live Supabase data objects and Auth identities.
4. Add public website routes without replacing the software shell.
5. Complete Supabase production connection, then redeploy and repeat live workflow verification against the Vercel production URL.

## Non-negotiable documentation rule

No schema, copy, policy page, or workflow should be treated as final unless it traces back to:

- A source document in this workspace.
- A decision recorded in `decision-log.md`.
- A direct user instruction.
