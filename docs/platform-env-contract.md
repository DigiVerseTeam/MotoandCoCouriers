# Platform Environment Contract

Last updated: 2026-06-19

This file records the environment values needed before GitHub, Supabase, and Vercel can be treated as connected. GitHub and Vercel production connection evidence is now recorded here; Supabase remains incomplete until credentials, region, migrations, Auth/RLS, and Storage checks are done.

Production-first V1 is now the confirmed platform direction. The first Vercel production deployment is live, but it is not yet a fully live-backed production system because Supabase credentials and migrations are still open.

## Local Command

```powershell
npm.cmd run verify:platform
npm.cmd run verify:launch
npm.cmd run verify:production
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
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Open |
| `SUPABASE_SERVICE_ROLE_KEY` | Open |
| `SUPABASE_PROJECT_REF` | Confirmed from Supabase MCP setup: `fhrqfrhqopicekaiibyj` |
| `SUPABASE_REGION` | Open; Digiverse must confirm region/data residency |

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
| Vercel deployment | `dpl_87hZW7WC4ve1oBUgfa2fa7RCqw45`, Ready, production |
| Production URL | `https://motoandcocouriers.vercel.app` |
| Smoke test | `/`, `/login`, `/booking`, and `/admin` returned HTTP 200 on 2026-06-19 |

## Not Environment Variables

The following are business or policy decisions, not values to hide in `.env`:

- Notification provider and customer/admin delivery channels.
- Public tracking token model and customer-visible tracking statuses.
- Zoho/export/manual accounting path, payment source of truth, and credit-note/corrected-invoice handoff.
- Privacy Owner and retention destruction approval workflow.
- Approved public legal copy, public sitemap/copy, and final brand hierarchy.
