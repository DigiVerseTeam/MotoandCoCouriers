# Platform Environment Contract

Last updated: 2026-06-21

This file records the environment values needed before GitHub, Supabase, and Vercel can be treated as connected. GitHub, Vercel, Supabase project metadata, production keys, migrations, private POD Storage bucket, initial pricing seed evidence, the live runtime bridge, SOP-IAM-03 server-side provisioning, first Super Admin bootstrap, pilot master data, decision-register scope alignment, and live actor journey evidence are now recorded here. Full launch master data and remaining production operating evidence remain open.

Production-first V1 is now the confirmed platform direction. The Vercel production deployment is live, and the Supabase schema is deployed. The UI runtime now has Supabase Auth, role resolution, RLS-protected live persistence, private POD upload wiring, a server-side provisioning API, first Super Admin bootstrap evidence, and one approved pilot customer/supplier/driver/vehicle/user set. It is not full-launch-complete until the remaining launch roster, legal/compliance confirmations, notification/accounting paths, and real POD evidence are supplied.

## Local Command

```powershell
npm.cmd run verify:platform
npm.cmd run verify:launch
npm.cmd run verify:production
node scripts/verify-live-rls.mjs
```

For a production preflight report:

```powershell
node scripts/check-platform-env.mjs --target=production
node scripts/check-launch-readiness.mjs --target=production
```

For a strict production gate after the values are supplied:

```powershell
npm.cmd run verify:production
node scripts/check-platform-env.mjs --target=production --strict
node scripts/check-launch-readiness.mjs --target=production --strict
```

## Confirmed Guardrail

`NEXT_PUBLIC_APP_ENV=local` or `preview` must not be paired with `NEXT_PUBLIC_SUPABASE_ENV=production`.

For the production-first V1 path, the production deployment should use `NEXT_PUBLIC_APP_ENV=production` and `NEXT_PUBLIC_SUPABASE_ENV=production`. Local development remains `local/local`. Preview deployments should either have no Supabase credentials or use a non-production Supabase backend; they must not point at production Supabase.

The app client guard enforces this at runtime, and `scripts/check-platform-env.mjs` reports it as a blocking environment error.

`scripts/check-launch-readiness.mjs` also reports the same pairing as a blocking
launch-readiness error, and then checks local Git/Supabase/Vercel CLI
availability, required handoff values, and local Git repository initialisation.
It is read-only: it does not create repositories, run migrations, deploy, or
print secret values.

`scripts/production-readiness.mjs` combines the strict production platform and
launch readiness checks. It must fail while any required local environment value,
Supabase input, or live-tooling input remains open.

## Local Runtime Labels

| Variable | Current local value | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_ENV` | `local` | Labels the app build/runtime environment. |
| `NEXT_PUBLIC_SUPABASE_ENV` | `local` | Labels the Supabase backend environment. |

## Supabase Handoff Values

These are required before live Auth, RLS, Storage, migration, and Australian data-residency testing.

| Variable | Status |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Confirmed project URL: `https://fhrqfrhqopicekaiibyj.supabase.co`; set in Vercel production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Set in Vercel production from Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Set in Vercel production as a sensitive server secret |
| `SUPABASE_SERVICE_KEY` | Set in Vercel production as the server-side service-key alias used by the provisioning API |
| `SUPABASE_PROJECT_REF` | Confirmed from Supabase MCP setup: `fhrqfrhqopicekaiibyj` |
| `SUPABASE_REGION` | Confirmed from Supabase project metadata: `ap-southeast-2` |

## GitHub Handoff Values

These are required before repository connection and live GitHub Actions evidence.

| Variable | Status |
| --- | --- |
| `GITHUB_OWNER` | Confirmed: `DigiVerseTeam` |
| `GITHUB_REPOSITORY` | Confirmed: `MotoandCoCouriers` |

## Vercel Handoff Values

These record the connected Vercel production deployment.

| Variable | Status |
| --- | --- |
| `VERCEL_TEAM` | Confirmed: `DigiVerse` / `digi-verse` |
| `VERCEL_PROJECT` | Confirmed: `motoandcocouriers` (`prj_PfQzTZZ04DuORDQkIOr5WeD17T5j`) |
| `VERCEL_PRODUCTION_DOMAIN` | Confirmed: `https://motoandcocouriers.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | Confirmed and set in Vercel production: `https://motoandcocouriers.vercel.app` |

## Production Deployment Evidence

| Item | Evidence |
| --- | --- |
| GitHub repository | `https://github.com/DigiVerseTeam/MotoandCoCouriers`; V1 merged to `main` on 2026-06-19 |
| Archived old build | `archive/old-netlify-vite-build-2026-06-19` |
| Vercel project | `digi-verse/motoandcocouriers` |
| Vercel deployment | Production alias Ready; latest manual production deploy `dpl_7yJen5Sb5LZsbWfC86mnaAp7HeDD` verified on 2026-06-21 after decisions-register scope alignment |
| Production URL | `https://motoandcocouriers.vercel.app` |
| Smoke test | `/`, `/login`, `/portal`, `/booking`, `/admin`, `/journey`, `/legal`, and `/auth/callback` returned HTTP 200 on 2026-06-21 |

## Supabase Production Evidence

| Item | Evidence |
| --- | --- |
| Project | `motoandcocouriers`, ref `fhrqfrhqopicekaiibyj`, status `ACTIVE_HEALTHY` |
| Region | `ap-southeast-2` |
| Migrations | Active logistics migrations `202606180001` through `202606190034` applied on 2026-06-19; `202606200001_retention_queue_trigger_security.sql` applied on 2026-06-20; `202606210001_decisions_register_scope_alignment.sql` and `202606210002_reinstatement_payment_arrangement.sql` applied on 2026-06-21; HCM migrations remain excluded under `hcm-extract/` |
| Storage | Private `delivery-proof` bucket exists with `public=false` |
| Pricing seed | 8 `price_rules` rows and 8 matching pricing `master_data_changes` rows loaded from `supabase/seed/release_one_seed.sql` |
| RLS coverage | 40 public base tables exist and all 40 have RLS enabled |
| Production env | Vercel production has app env labels, site URL, Supabase URL, project ref, region, publishable key, and sensitive server key |
| First Super Admin | `gerrard@otimi.com.au` active as `super_admin` / `ACT-INT-003`; approval reference `User approved gerrard@otimi.com.au Super Admin upgrade in Codex chat - 2026-06-20` |
| Pilot launch records | `Gold Coast Motorcycle Tyres And Mechanical`, `Link International`, driver `Peter Price` / `gcmtm12@gmail.com`, vehicle `957OC8`, Client Ops `gcmtm_parts@outlook.com`, and Client Billing `josephine@otimi.com.au` imported under approval reference `Approved V1 pilot test data - user supplied in Codex chat - 2026-06-20` |

Update 2026-06-19: migrations through `202606190034_super_admin_provisioning.sql` are applied. `202606190034` adds the BOAS v1.9/SOP-IAM-03 two-tier role model, `client_ops` alias handling, profile status/link fields, pending-profile RLS blocking, and provisioning audit fields. At that point `npm.cmd run verify:live` reached production and confirmed the live bridge structure, RLS policies, API table privileges, private `delivery-proof` bucket, price rules, and active role records, then failed because the first Super Admin, approved client/supplier/driver/vehicle records, and active Driver, Client Ops, and Client Billing users did not exist yet.

Update 2026-06-20: first Super Admin bootstrap is complete for `gerrard@otimi.com.au`. A V1 pilot master-data import created one active customer/workshop, one supplier link, one driver, one fleet vehicle, and active Client Ops, Client Billing, and Driver users. `npm.cmd run verify:live` passed 31 production checks, `npm.cmd run verify:requirements` passed 90 checks, and a live actor test covered Super Admin provisioning API access, Client Ops booking, Client Billing booking denial, Super Admin/Admin dispatch, Driver pickup/delivery/POD Storage upload/runtime proof/run close, Client Billing invoice visibility and billing dispute, Client Ops delivery dispute, Admin exception queue, and Receiver/no-login runtime denial. The immutable `delivery_proof` table was not populated with fake evidence because Policy #5 retains real proof rows for 7 years.

Update 2026-06-21: decisions-register scope alignment is deployed to production. Vercel production deployment `dpl_7yJen5Sb5LZsbWfC86mnaAp7HeDD` is aliased to `https://motoandcocouriers.vercel.app`. Supabase migrations `202606210001` and `202606210002` were applied with `supabase db push`, adding the confirmed `time_constraint` no-pickup reason, removing portal-owned Admin SLA due-date calculation, and adding structured payment-arrangement reinstatement fields. SLA monitoring and HCM requirements remain hard-excluded from the logistics portal build.

## Not Environment Variables

The following are business or policy decisions, not values to hide in `.env`:

- Notification provider and customer/admin delivery channels.
- Public tracking token model and customer-visible tracking statuses.
- Zoho/export/manual accounting path, payment source of truth, and credit-note/corrected-invoice handoff.
- Privacy Owner and retention destruction approval workflow.
- Approved public legal copy, public sitemap/copy, and final brand hierarchy.
