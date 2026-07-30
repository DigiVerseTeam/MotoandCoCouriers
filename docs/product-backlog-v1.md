# Product Backlog - Portal And Website V1

Last updated: 2026-07-08

Purpose: keep product changes, candidate changes, and UAT findings in one working backlog so the software, BOAS, SOPs, policies, and UAT scripts stay aligned.

This backlog is not the full BOAS. It only tracks items that change or may change the V1 website, portal, runtime behaviour, testing, or immediate post-UAT operating process.

## Priority Key

| Priority | Meaning |
| --- | --- |
| P0 | Must fix or prove before V1 can be treated as stable for real use. |
| P1 | Should fix during UAT or immediately after, because it affects real user confidence or operational clarity. |
| P2 | Consider after V1 is stable, or add only if UAT proves it is worth the effort. |
| Later | Not for V1 unless Owner explicitly changes scope. |

## Status Key

| Status | Meaning |
| --- | --- |
| Needs build | Not built or needs a software change. |
| Built - needs UAT | Implemented enough to test, but not signed off. |
| Needs decision | Business/Owner decision needed before build. |
| Process only | Human process, not software runtime. |
| Watch | Leave as-is for now, but monitor during UAT. |

## P0 - Stability, Data, And UAT

| ID | Item | Status | Why it matters | Next action |
| --- | --- | --- | --- | --- |
| BL-P0-001 | Complete live actor UAT across Super Admin, Admin, Client Ops, Client Billing, Driver, and Receiver no-login POD. | Built - needs UAT | V1 cannot be called stable until real roles prove access and workflow boundaries. | Run `docs/uat-final-signoff-pack-v1.md` and retain screenshots/evidence. |
| BL-P0-002 | Prove production Supabase Auth/RLS role boundaries. | Built - needs UAT | Login works, but live role enforcement must be proven for customer, billing, driver, admin, and super admin access. | Test each role against allowed and blocked data. |
| BL-P0-003 | Prove POD Storage and POD PDF retrieval in production. | Built - needs UAT | Delivered status, billing, and customer POD downloads depend on proof records being private, retrievable, and linked to the right order. | Run iPad/desktop POD test, then download POD from client and admin views. |
| BL-P0-004 | Re-test offline driver mode on the actual driver device/browser. | Built - needs UAT | Offline updates are only local until sync succeeds. We need proof that reconnect, retry, and Admin recovery work in the real field setup. | Run offline pickup, offline sign-off, reconnect, retry sync, and Admin recovery evidence. |
| BL-P0-005 | Confirm no hidden local-device-only behaviour remains in production workflows. | Needs test | Previous iPad/desktop mismatches showed risk that local cache can make one device look different from another. | Compare Admin, desktop driver, and iPad driver views against the same live orders. |
| BL-P0-006 | Resolve any recurring right-side "system error" or sync notice that appears after actions. | Needs build/test | Even if the data eventually syncs, unexplained error messages reduce user trust during UAT. | Capture exact message, action, role, and order ID; fix or convert into a clear recoverable sync notice. |
| BL-P0-007 | Confirm production deployment ownership and rollback process. | Needs evidence | If Vercel or Supabase breaks during UAT, we need to know who can inspect, roll back, and redeploy. | Record Vercel owner/project, Supabase owner/project, GitHub branch, and rollback steps. |

## P1 - Workflow Changes And UX Clarification

| ID | Item | Status | Why it matters | Proposed direction |
| --- | --- | --- | --- | --- |
| BL-P1-001 | Clarify booking date behaviour on the Client New Order screen. | Needs build | Drivers asked why a late order went into Today's Run instead of Upcoming. Current logic uses the requested run date, not the ASAP/Next Run priority. | Rename "Date Submitted" to "Requested Run Date" or "Pickup Run Date"; add helper text explaining Today vs Upcoming. |
| BL-P1-002 | Add explicit "Schedule For Next Run" action or default for late orders if approved. | Needs decision | If customers lodge after suppliers have packed, same-day visibility can be misleading. | Decide whether late same-day orders should default to next run or require the customer to choose. |
| BL-P1-003 | Explain Driver Upcoming in the UI. | Needs build | Upcoming is for future scheduled orders only; it is not a late-order queue. | Add short in-app text: "Future scheduled work. Bring forward only if supplier is on today's route and complete order is ready." |
| BL-P1-004 | Keep driver bring-forward whole-order only. | Built - needs UAT | Owner approved Option 2: if the complete order is ready, move the whole order into today's run. | UAT with one future order, same supplier on route, complete order ready. |
| BL-P1-005 | Test Create Daily Run against real depot behaviour. | Built - needs UAT | Current SOP now says driver creates daily run from ready con notes and can record planned, brought-forward, or no-con-note depot pickups. | Run UAT at one supplier with all three package types if possible. |
| BL-P1-006 | Improve no-con-note/customer-missed-portal pickup reconciliation. | Built/part built - needs UAT | Driver can record depot-ready packages, but Admin must reconcile before billing. | UAT Admin unmatched billing/account correction after a driver-created depot pickup. |
| BL-P1-007 | Tighten Sync Recovery screen wording. | Needs build | Current recovery wording is technically accurate but can scare users. | Make it plain: what is saved locally, what is not live yet, and when to call Admin. |
| BL-P1-008 | Confirm Driver iPad supported browser/device baseline. | Needs UAT | Offline, signature capture, and sync need to work on the actual device, not only desktop. | Record iPad model, iPadOS, Chrome/Safari version, and pass/fail screenshots. |
| BL-P1-009 | Validate current package pricing everywhere it appears. | Built - needs UAT | Pricing was corrected, but driver pickup, sign-off, billing PDF, and admin pricing must all match the approved price schedule. | Test tyre, up-to-5kg, 5-10kg, 10kg+, return, out-of-zone, and oversized/approval cases. |
| BL-P1-010 | Make customer My Orders status explanations clearer. | Built/part built - watch | Review, dispute, POD download, scheduled, delivered, and next-run labels need to be self-explanatory. | UAT with a customer who has not been involved in the build. |
| BL-P1-011 | Confirm invoice PDF layout and monthly client billing flow. | Built - needs UAT | Billing V1 is manual PDF download and off-system email. The PDF needs to be readable and match charges. | Generate one client/month invoice PDF and manually email it as the approved process. |
| BL-P1-012 | Confirm legal page navigation and website shell remain brand-consistent. | Built - needs UAT | Legal HTML was embedded into the site and must not break menu/look and feel. | Browse all legal pages from the public site and portal entry points. |

## P2 - Consider After UAT Starts

| ID | Item | Status | Why consider it | Possible approach |
| --- | --- | --- | --- | --- |
| BL-P2-001 | Add better order search/filtering for Client My Orders. | Candidate | My Orders will grow quickly and become hard to scan. | Add month filter, status filter, supplier filter, and con-note search; keep monthly archive grouping. |
| BL-P2-002 | Add pagination or lazy loading to Client My Orders. | Candidate | Long order lists will slow the screen and make mobile harder. | Show recent 30 first, then "Load more" by month. |
| BL-P2-003 | Add Driver Upcoming filter by supplier/date. | Candidate | Future run lists may become crowded once more clients use the portal. | Filter by supplier, run date, and bring-forward eligible only. |
| BL-P2-004 | Add Admin "late order" monitor. | Candidate | Late orders that land in today's run may need Admin/driver attention. | Flag orders created after a configurable supplier-readiness time. |
| BL-P2-005 | Add simple Admin dashboard for sync health. | Candidate | Offline mode is operationally sensitive. Admin should know if a driver device has unsynced actions. | Show pending sync count only if the app can safely report live/device sync status. |
| BL-P2-006 | Add public tracking token model. | Needs decision | Current tracking is authenticated. Public tracking may be useful, but adds access/security decisions. | Decide authenticated only vs secure token before build. |
| BL-P2-007 | Add notification provider for customer status updates. | Later/needs decision | Current notices are local records or manual. Automatic email/SMS is outside current V1. | Choose provider/channel after V1 UAT. |
| BL-P2-008 | Add accounting integration later. | Later | Xero was attempted and removed from V1. Current approved path is PDF download plus manual email. | Reconsider only after V1 stabilises and billing PDF process is proven. |
| BL-P2-009 | Add route optimisation. | Later | V1 uses supplier/geography sequencing and driver judgement. | Consider only after real run data shows routing pain. |
| BL-P2-010 | Add richer supplier performance reporting. | Later | Supplier standards monitoring exists, but deeper scoring may not be needed yet. | Use UAT/first month operations to decide metrics. |

## Documentation And Control Backlog

| ID | Item | Status | Why it matters | Next action |
| --- | --- | --- | --- | --- |
| DOC-001 | Keep BOAS v2.0 aligned to any backlog item approved for build. | Ongoing | Prevents the software drifting away from source documentation. | Before each build item, update BOAS/SOP/policy if the behaviour changes. |
| DOC-002 | Update SOP-RUN and driver journey if booking date/default rules change. | Conditional | Upcoming/Today's Run rules affect driver and customer journeys. | Required if BL-P1-001 or BL-P1-002 changes runtime logic. |
| DOC-003 | Keep SOP-OPS-01 aligned with actual offline UAT results. | Ongoing | Offline mode is delicate and cannot be treated as magic live sync. | Update after device/browser UAT. |
| DOC-004 | Keep billing policy/process clear: portal PDF only, manual email/payment/bank reconciliation outside runtime. | Ongoing | Stops Xero/OpenClaw/API assumptions creeping back into V1 scope. | Keep in software scope, SOP, policy reconciliation, and UAT notes. |
| DOC-005 | Build ERD review pack after V1 UAT evidence is stable. | Pending | ERD is needed to reduce breakage when future changes touch data relationships. | Use UAT failures and current schema/runtime as input. |

## Out Of Scope For V1 Unless Re-approved

| Item | Reason |
| --- | --- |
| Xero, OpenClaw, or accounting API integration | Removed from V1. Billing is PDF download plus manual email and payment process. |
| HCM driver legal classification, agreements, verification, discipline, and employment model | Confirmed HCM scope, not logistics portal scope. |
| Full route optimisation | Not required for V1. |
| Public token tracking | Needs access/security decision before build. |
| Automated email/SMS notification provider | Provider/channel unconfirmed. |
| Multi-driver/external courier expansion | Conditional future scope only. |
| Supplier warehouse internal workflow | Upstream supplier process, not Moto & Co portal runtime. |

## Immediate Recommended Work Order

1. Run UAT on the current build before adding more product change, except critical bug fixes.
2. Capture any UAT failure as a backlog item with role, device, order ID, expected result, and actual result.
3. Prioritise P0 sync/POD/Auth/RLS failures before UI polish.
4. Decide BL-P1-001 and BL-P1-002 before changing Upcoming/Today's Run behaviour.
5. After UAT, update BOAS/SOP/policy docs for any approved runtime change, then build, test, and redeploy.
