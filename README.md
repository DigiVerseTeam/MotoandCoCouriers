# Moto and Co Couriers Runtime

Local-first software package for the Moto and Co Couriers website and app.

The build follows the project documentation in `docs/` and does not treat unknown business rules as final. Where source material is incomplete, the app shows draft/TBD states or defers production behavior.

## Stack

- Next.js for the Vercel-ready website and app.
- Supabase for auth, database, storage, and RLS.
- Supabase live runtime bridge for production Auth, role records, RLS-protected workflow persistence, and private POD Storage.
- Local mock state remains available only for non-live workflow verification.

## Environment Guardrail

The browser Supabase client is intentionally blocked when `NEXT_PUBLIC_APP_ENV` is
`local` or `preview` and `NEXT_PUBLIC_SUPABASE_ENV` is `production`.

This implements the confirmed release-control rule that preview deployments must
not connect to production Supabase. GitHub, Vercel, Supabase region, production
keys, migrations, private POD bucket, the initial pricing seed, and the live
runtime bridge are connected. Approved launch master data and actor-by-actor
journey evidence remain open.

## Local Commands

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run verify:local
npm.cmd run verify:launch
npm.cmd run verify:production
npm.cmd run verify:live
npm.cmd run typecheck
npm.cmd run verify:requirements
npm.cmd run verify:platform
npm.cmd run verify:migrations
npm.cmd run build
```

Use `npm.cmd run verify:local` before handoff or deployment work. It runs the
source-backed requirement verifier, platform-contract report, read-only launch
readiness report, Supabase migration guardrail verifier, Next route type
generation, TypeScript, and the production build with
`NEXT_DIST_DIR=.next-preflight`.

Use `npm.cmd run verify:launch` when you want the GitHub, Supabase, and Vercel
handoff blockers named without creating repositories, running migrations,
deploying, or printing secret values.

Use `npm.cmd run verify:production` as the strict production readiness gate. It
passes when production values are supplied and the local Git/Supabase/Vercel
tooling is available. It does not prove actor workflow data has been wired into
Supabase.

Use `npm.cmd run verify:live` after Supabase is linked to confirm the production
live bridge, private POD bucket, price rules, seed import evidence, and active
Admin/Driver/Client/Billing role records. It is expected to fail until an
approved private production master-data file has been imported.

Use `node scripts/import-production-master-data.mjs --file=<private-json> --apply`
only after the launch master-data file has approval evidence. Start from
`docs/production-master-data.template.json`, keep the completed file uncommitted,
and do not use placeholder records.

The draft GitHub Actions workflow at `.github/workflows/runtime-ci.yml` runs the
same requirement, platform-contract, Supabase migration, typecheck, and build
gates once a repository is connected. CI uses `NEXT_DIST_DIR=.next-ci` so it
does not depend on local build output.

The active local shell stores demo workflow state in browser session storage. Use
`Reset Local Demo Data` on the login screen to reload the seeded workflows for a
fresh demonstration.

## Important Gaps

See `docs/platform-env-contract.md`, `docs/production-blocker-register.md`,
`docs/open-questions.md`, and the final build gap list before production
deployment.
