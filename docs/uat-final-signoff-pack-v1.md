# UAT Final Sign-Off Pack - V1

Purpose: separate what Codex has tested from what Moto & Co must test for final business sign-off.

Production URL: `https://motoandcocouriers.vercel.app`

## Codex Pre-UAT Scope

Codex tests the system is technically coherent before owner UAT:

| Area | Codex result |
| --- | --- |
| Website routes load | Pass |
| Portal routes load | Pass |
| Runtime source guardrails | Pass |
| Supabase migration guardrails | Pass |
| TypeScript/build | Pass |
| Local preflight | Pass |
| Legal page rendered inside website shell | Pass |
| Homepage hero/logos/content | Pass |
| Native popup removal | Pass |
| Vercel production deployment | Pass |

## Owner UAT Scope

Moto & Co tests whether the system works in the real business context.

Use one test order first, then repeat with a real customer once the flow is clean.

| UAT ID | Actor | Test | Expected Result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| UAT-001 | Visitor | Open homepage, services, pricing, legal, contact | Website explains the business clearly and all pages load |  | Screenshot |
| UAT-002 | New Client | Register a workshop | Account lands in pending activation |  | Screenshot |
| UAT-003 | Admin | Approve registered workshop | Client becomes active and can book |  | Screenshot |
| UAT-004 | Client Ops | Create pickup request with supplier/con note | Order shows received/scheduled state and run date |  | Screenshot |
| UAT-005 | Admin | Review order/dispatch visibility | Admin sees correct order, supplier, client, run date |  | Screenshot |
| UAT-006 | Driver | Create or open today's run | Ready orders appear in driver's run |  | Screenshot |
| UAT-007 | Driver | Bring forward complete ready next-day order | Whole order moves into today's run with original run date retained |  | Screenshot |
| UAT-008 | Driver | Record depot package with no con note/customer missed portal entry | Admin can see evidence and order outcome |  | Screenshot |
| UAT-009 | Driver | Count pickup items | Items and price are captured before en route/sign-off |  | Screenshot |
| UAT-010 | Driver/Receiver | Complete POD with receiver name and signature | Delivered status only occurs after name + signature |  | POD screenshot |
| UAT-011 | Client Ops | View My Orders after delivery | Client sees Delivered and can download POD |  | Screenshot/PDF |
| UAT-012 | Client Ops | Use Review/Dispute button | Confirmation appears; request turns green after sent |  | Screenshot |
| UAT-013 | Admin | View/close exception | Exception is understandable and can be closed without over-strict note rules |  | Screenshot |
| UAT-014 | Admin | Generate monthly client invoice PDF | PDF downloads and totals match approved pricing |  | PDF |
| UAT-015 | Admin | Manually email invoice outside portal | Portal does not claim to send invoice; email process is outside runtime |  | Admin note |
| UAT-016 | Driver/iPad | Repeat driver run on iPad Chrome | iPad sees the same live orders as desktop/admin |  | Screenshot pair |
| UAT-017 | Driver/iPad | Offline pickup then reconnect | Local update queues, syncs after reconnect, and client/admin see update |  | Before/after screenshots |
| UAT-018 | Driver/iPad | Offline POD then reconnect | POD/order metadata syncs; pending sync clears or Admin recovery is triggered |  | Before/after screenshots |
| UAT-019 | Admin | Verify POD private storage/access | Linked client/admin can access POD; unlinked/public access is not available |  | Evidence |
| UAT-020 | Owner/Admin | Review legal pages | Published wording is acceptable for launch |  | Sign-off note |
| UAT-021 | Owner/Admin | Final pricing check | Tyres, parts, returns, out-of-zone, and bulky pricing match approved schedule |  | Screenshot/PDF |
| UAT-022 | Owner/Admin | Role boundary check | Client, Driver, Admin, Super Admin, Billing, Receiver behave as intended |  | Screenshots |

## Pass Criteria

UAT passes only when:

- every row above has Pass/Fail and evidence;
- failed rows have a fix/retest note;
- iPad/driver workflow passes in the actual operating environment;
- POD and invoice PDFs can be retrieved after delivery;
- pricing and legal wording are accepted by the business owner;
- owner/admin signs off the result.

## Final Sign-Off

| Role | Name | Decision | Date | Notes |
| --- | --- | --- | --- | --- |
| Owner |  |  |  |  |
| Admin |  |  |  |  |
| Driver |  |  |  |  |
| Client tester |  |  |  |  |
