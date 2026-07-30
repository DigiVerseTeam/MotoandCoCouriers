# System Testing Status And UAT Scripts

Last updated: 2026-07-02

Status: system testing is **not complete**.

Reason: current V1 testing has already found failures and unresolved evidence gaps. The v2.0 baseline is now the source of truth for testing, but the production app still needs live UAT evidence before it can be treated as stable.

## System Testing Status

| Area | Current status | Evidence / note |
| --- | --- | --- |
| Baseline v2.0 | Approved as source of truth for testing | Owner response 2026-07-02 |
| BOAS v2.0 | Approved for testing alignment | Owner response 2026-07-02 |
| SOP v2 set | Approved for testing alignment | Owner response 2026-07-02 |
| Journey v2 set | Approved for testing alignment | Owner response 2026-07-02 |
| Legal pages | Draft updated against policy changes | Not final; Policy Owner / Privacy Owner approval still required |
| Supabase Australia/Sydney | Approved in principle | Evidence/UAT still required |
| Auth/RLS access boundaries | Not complete | Live Super Admin/Admin/Client Ops/Client Billing/Driver/Receiver testing required |
| POD Storage | Process approved, system testing failed | Private signature/POD storage requires retest |
| Production access logs | Not complete | Evidence format/provider access logs remain open |
| Security schedule/DPA | Not required for V1 | Owner response 2026-07-02 |
| Offline driver sync | Not complete | Items TBD-013 to TBD-017 approved for UAT evidence; must be re-executed after ERD approval and schema/runtime reconciliation because the runtime is currently broken |
| Billing PDF | V1 runtime scope confirmed | Runtime only creates downloadable EOM invoice PDF; Admin email, payment follow-up, and bank reconciliation are off-system human processes |
| Daily run creation | New build requirement | Previous evening-before lockdown rejected; driver-created daily run and depot collection choices must be built and tested after ERD |

## UAT Roles

| Role | Test account / evidence required |
| --- | --- |
| Super Admin | Real Supabase session for Super Admin |
| Admin | Admin session separate from Super Admin where required |
| Client Operational | Approved client user who can book and view delivery status |
| Client Billing | Approved client billing user who can view invoice/POD/billing evidence |
| Driver | Active driver account for vehicle/rego `957OC8` unless a new driver is approved |
| Receiver | No-login receiver name + signature captured in driver workflow |

## UAT Test Scripts

| Test ID | Area | Actor | Preconditions | Steps | Expected result | Evidence to retain |
| --- | --- | --- | --- | --- | --- | --- |
| UAT-001 | Login routing | Client Operational | Approved active client user exists | Open portal; choose Customer Login; sign in with password; reload page | Client lands in customer dashboard, not four-login test screen | Screenshot of dashboard and URL |
| UAT-002 | Courier login routing | Super Admin/Admin/Driver | Courier user exists | Open portal; choose Courier Business Login; sign in with courier role | User lands in correct courier/admin/driver view based on role | Screenshot showing role and nav |
| UAT-003 | Role boundary | Admin | Super Admin and normal Admin exist | Log in as normal Admin; attempt Admin/Super Admin provisioning | Normal Admin cannot create Admin/Super Admin | Screenshot / access-denied evidence |
| UAT-004 | Super Admin provisioning | Super Admin | Super Admin session exists | Create or update Admin user; create Client Ops/Billing and Driver users | Users created/reset without exposing service-role secrets | Audit row or screenshot |
| UAT-005 | Customer registration approval | Admin + new client | New client registration submitted | Register client; Admin reviews; approve; client sets password/signs in | Client moves from pending activation to active booking access | Screenshots before/after |
| UAT-006 | Customer booking | Client Operational | Active client, approved supplier, valid delivery address | Create pickup request with supplier and con note | Booking saved with received date and scheduled run date | Client order screenshot and Admin order row |
| UAT-007 | Cut-off scheduling | Client Operational/Admin | Brisbane time known | Submit before and after 12:30pm Brisbane test cut-off | Correct same/next eligible run date appears | Screenshots with timestamps |
| UAT-008 | Driver today's run | Driver | Admin assigned eligible stops to driver/vehicle | Log in on driver device; view Today's Run | Assigned same-day stops visible on desktop and iPad/browser | Screenshots from both devices |
| UAT-009 | Upcoming run visibility | Driver | Future scheduled stop exists | Open Upcoming; refresh; compare with Admin orders | Future stop visible and count matches Admin | Screenshot pair |
| UAT-010 | Bring forward order | Driver | Future stop ready; same supplier/on-route | Use bring-forward action for complete order | Order moves to Today's Run; original run date retained in audit/status | Driver screenshot + Admin audit/status |
| UAT-011 | Pickup item count | Driver | Pending stop visible | Tap pickup; count tyres/parts/returns; finalise pickup | Stop moves to en route/sign-off with counted items and price | Driver screen and Admin order status |
| UAT-012 | Offline pickup sync | Driver/Admin | Driver device signed in; network can be disabled | Disable network; perform pickup/count; reconnect; wait for sync | Live status updates after reconnect; no duplicate or lost update | Screenshots before/offline/after + sync message |
| UAT-013 | Offline failure recovery | Driver/Admin | Unsynced local change exists or simulated | Force sync failure; open recovery/admin view | App shows pending sync; Admin has recovery path; clearing data warning appears | Screenshot of warning/recovery evidence |
| UAT-014 | Delivery sign-off | Driver/Receiver | En route stop exists | Select stop; enter receiver name; capture signature; complete delivery | Delivered status set only after receiver name + signature | POD screen + client delivered status |
| UAT-015 | POD private storage | Driver/Admin | Delivery sign-off completed | Confirm signature/POD path stored privately; test linked access | POD available to linked client/admin/driver as allowed; not public | Storage path/proof screenshot |
| UAT-016 | Client delivery status | Client Operational | Delivered order exists | Log in as client; open My Orders | Delivered order shows delivered status and POD download button | Client screenshot |
| UAT-017 | Client review/dispute | Client Operational | Delivered/scheduled order exists | Use Review or Dispute; confirm prompt; submit | Button state updates and Admin exception/review queue receives item | Client + Admin screenshots |
| UAT-018 | Billing invoice PDF | Admin/Client Billing | Delivered proof-linked jobs exist | Open Billing; select client/month; generate/download invoice PDF | PDF totals match price rules and includes delivery history | PDF file and billing screenshot |
| UAT-019 | Manual invoice email boundary | Admin | Invoice PDF generated | Download PDF and email it manually outside the portal | Portal does not attempt send/bounce/API handling; manual email is outside runtime | PDF file plus Admin note that email occurred outside system |
| UAT-020 | Payment/bank reconciliation boundary | Admin | Invoice exists | Confirm payment follow-up and bank reconciliation are handled outside the portal | Portal does not require bank reconciliation workflow for V1 | Admin note or external accounting evidence retained outside portal |
| UAT-021 | Price rules | Admin/Driver | Current prices loaded | Process tyres/parts/return package counts | Charges match approved standard freight pricing ex GST | Driver price screenshot + invoice PDF |
| UAT-022 | Supplier network | Client/Admin | Supplier master data loaded | Create bookings for active suppliers; attempt Ficeda/inactive supplier | Active suppliers available; Ficeda not selectable unless reactivated | Booking dropdown screenshot |
| UAT-023 | Legal page draft | Admin/Owner | Updated legal page exists | Review legal page copy against v2.0 policy changes | No legacy provider/Ficeda-active/GPS-required/90-day POD wording remains | Scan result/screenshot |
| UAT-024 | Access logging | Admin/Digiverse | Production access log evidence source exists | Perform data access/export/admin action; retrieve evidence | Access event can be traced to user/action/time | Log export or provider screenshot |
| UAT-025 | Regression smoke | All | Previous tests passed | Reload app on desktop/iPad; log out/in; refresh after 12 seconds | No page crash, no ghost local-state divergence, no stale local-only order | Screenshots and issue log |
| UAT-026 | Supported driver device/browser | Driver/Admin | Driver test device and browser selected | Record iPad/device model, OS, browser, browser version; log in as driver; compare Today's Run/Upcoming with Admin orders | Supported device/browser is documented and sees the same live run data as Admin | Device/browser details, driver screenshot, Admin comparison screenshot |
| UAT-027 | Local outbox/cache retention | Driver/Admin | Test order exists; network interruption can be simulated | Perform pickup/delivery update offline; reconnect; confirm sync succeeds and local pending count clears | Local cache/outbox remains only until sync/recovery succeeds, then clears | Before/offline/after screenshots and sync banner evidence |
| UAT-028 | Clear saved device data warning | Driver/Admin | Disposable unsynced local update exists | Attempt Clear Saved Device Data while unsynced updates exist | Warning states unsynced records may be abandoned; action is not used on live unresolved work | Warning screenshot and Admin sign-off note |
| UAT-029 | Unrecoverable outbox recovery | Driver/Admin | Simulated unrecoverable local update exists | Admin reviews driver evidence, reconstructs status/POD manually if needed, records recovery audit/exception | Live record reflects Admin recovery with audit evidence and no silent data loss | Driver evidence, Admin recovery note, audit/exception screenshot |
| UAT-030 | POD photo not mandatory | Driver/Receiver | En route stop exists | Complete delivery with receiver name and signature only; do not attach photo/GPS | Delivered status succeeds without photo/GPS; POD still stores receiver name/signature | POD completion screenshot and client delivered/POD evidence |
| UAT-031 | EOM invoice PDF only | Admin | Delivered proof-linked jobs exist for a client/month | Generate/download invoice PDF; do not trigger email/API/accounting integration from the portal | Runtime produces downloadable PDF only; Admin email/payment/bank reconciliation remain outside system | PDF file and screenshot showing no send/API workflow |
| UAT-032 | Driver create daily run | Driver/Admin | ERD approved; schema/runtime reconciled; daily-run feature built; ready con notes exist | Driver selects Create Daily Run; system consolidates ready con notes into Today's Run | Ready con notes appear in Today's Run without previous-day lockdown | Driver screenshot and Admin order comparison |
| UAT-033 | Depot collection choices | Driver/Admin | ERD approved; schema/runtime reconciled; daily-run feature built; depot has mixed package scenarios | At depot, driver records planned milk-run collection, brings forward complete next-day package, and records ready package with no con note/customer missed portal entry | All three collection types are captured, auditable, and visible to Admin/client where appropriate | Driver depot screenshots, Admin audit/order evidence |

## Entry Criteria

- v2.0 baseline is the source of truth.
- Active production app URL is known.
- Test users for all roles exist.
- One approved launch/test customer, supplier, driver, and vehicle exist.
- Testers know which browser/device is under test.

## Exit Criteria

UAT is complete only when:

- Every UAT row has Pass/Fail evidence.
- Failed rows have issue numbers or documented retest outcomes.
- Auth/RLS, POD Storage, offline sync, billing PDF, legal page draft, and access logging have retained evidence.
- Offline UAT rows UAT-026 to UAT-030 are re-executed after ERD approval and schema/runtime reconciliation.
- Daily-run UAT rows UAT-032 and UAT-033 pass after the approved daily-run workflow is built.
- Owner/Admin signs off the UAT result.

Until then, system testing is not complete.
