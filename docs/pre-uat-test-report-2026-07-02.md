# Pre-UAT Test Report - 2026-07-02

Purpose: record the system checks completed before owner UAT. UAT is the final business sign-off, not the first discovery pass.

## Result

Pre-UAT code and production smoke checks passed for the current V1 candidate.

This does not mean business UAT is complete. Live actor workflows still need to be executed by the real roles using production sessions and retained screenshots/evidence.

## Fix Applied During Pre-UAT

- Replaced native browser `window.confirm` prompts in the client My Orders review/dispute flow with an in-app confirmation panel.
- Updated the runtime verification guard to match the current V1 baseline:
  - root `/` is now the public website front door;
  - legal pages are published from approved HTML source inside the Moto & Co website shell;
  - driver-created daily run replaces the rejected evening-before lockdown;
  - billing V1 is downloadable invoice PDF only, with Admin manual email outside the portal.

## Automated/System Checks Run

| Check | Result | Evidence |
| --- | --- | --- |
| Source-backed runtime requirements | Pass | `npm.cmd run verify:requirements` passed 93 checks |
| Supabase migration guardrails | Pass | `npm.cmd run verify:migrations` passed 35 checks |
| TypeScript / route metadata | Pass | `npm.cmd run typecheck` |
| Production build | Pass | `npm.cmd run build` |
| Local preflight | Pass | `npm.cmd run verify:local` |
| Native browser popup guard | Pass | No `window.confirm`, `window.alert`, or `window.prompt` in active runtime |
| Vercel deployment | Pass | Production aliased to `https://motoandcocouriers.vercel.app` |
| Live route smoke test | Pass | `/`, `/website`, `/services`, `/pricing`, `/contact`, `/legal`, `/portal`, `/booking`, `/tracking`, `/admin`, `/driver` returned 200 |
| Homepage content smoke | Pass | Hero image, logo, Customer portal, and Courier business login present |
| Legal page content smoke | Pass | Booking Terms, Credit Terms, Dangerous Goods Policy, Delivery Disclaimer, Privacy Policy, Collection Notice, and Data Retention present |
| Portal shell smoke | Pass | Portal route loads and shipped bundle includes the in-app confirmation class |

## Checks Not Completed By Codex

These require live signed-in users, the actual driver device/browser, and business evidence. They move into owner UAT:

- Super Admin, Admin, Client Operational, Client Billing, Driver, and Receiver no-login boundary testing.
- Live Supabase Auth/RLS proof by role.
- Live POD Storage proof, private access, and retention evidence.
- Offline driver pickup/POD/reconnect field test on the real device.
- End-to-end client booking to driver pickup to POD to billing PDF using real test orders.
- Admin manual invoice email and out-of-system payment/bank reconciliation evidence.
- Legal wording/business acceptance review of the published legal pages.

## Known Open Platform Evidence

The local preflight still reports open production evidence items, even though the live Vercel URL is running:

- Supabase environment values and live RLS/Storage evidence must be retained.
- GitHub repository/CI evidence is not available from this local folder.
- Vercel team/project/environment ownership evidence must be retained.

## UAT Readiness Decision

The site and portal are ready for owner UAT to commence, with the above limitations visible.

UAT should use `docs/uat-final-signoff-pack-v1.md` as the short control sheet and `docs/system-testing-status-and-uat-scripts.md` as the detailed evidence script.
