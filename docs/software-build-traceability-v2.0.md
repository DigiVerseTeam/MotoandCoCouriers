# Moto & Co Couriers Software Build Traceability v2.0

Status: draft for owner review.

Last updated: 2026-07-02.

Purpose: show, in plain English, how the V1 software build maps to BOAS/SOP/policy requirements without trying to build the entire BOAS into the app.

This is the practical proof layer that sits between the documentation and the portal.

## How To Read This

For each business area, this register answers five questions:

1. Is this part of the V1 software runtime?
2. If yes, where does the user see or use it?
3. What record or data object proves it happened?
4. Which UAT test proves it works?
5. If no, where does the process happen instead?

Use this rule:

- `Built - needs UAT` means the portal has the workflow, but it is not accepted until UAT passes.
- `Approved - not built` means the business has approved the requirement, but it must not be assumed live yet.
- `Out of runtime` means it is intentionally a human/business/accounting/legal process, not software.
- `Evidence/control only` means the app records evidence or timestamps but does not manage the whole business process.

## Owner Confidence Summary

| Area | Current answer |
| --- | --- |
| Does the portal try to build the whole BOAS? | No. V1 is limited to courier portal runtime, proof, billing PDF, access, master data, exceptions, audit, privacy/retention evidence, and the approved driver workflow. |
| Does the app include HCM? | No. Driver agreements, driver classification, verification, disciplinary process, and courier expansion payment models are out of V1 logistics runtime. |
| Does the app include Xero/OpenClaw/accounting API? | No. V1 billing stops at downloadable invoice PDF. Admin emails invoices manually outside the system. |
| Does the app include SLA management? | No. The app stores timestamps/evidence, but SLA monitoring is out of runtime scope. |
| Does built mean accepted? | No. Built items still require UAT evidence before they are treated as accepted. |
| What blocks more software changes? | ERD approval, migration-state reconciliation, and UAT re-execution. |

## Build Traceability Matrix

| BOAS/SOP/policy area | V1 scope decision | Runtime user experience | Runtime evidence/data | UAT proof | Notes |
| --- | --- | --- | --- | --- | --- |
| Login routing and roles | Built - needs UAT | User chooses Customer Login or Courier Business Login; app routes to client, billing, driver, admin, or super admin experience by role. | Supabase Auth user, profile, role/access assignment. | UAT-001, UAT-002, UAT-003, UAT-004 | Role model still needs schema reconciliation because visible local migrations do not fully show the later super-admin production migration. |
| Super Admin/Admin provisioning | Built - needs UAT | Courier business role can create/reset users and manage access records. | Profile/access role assignment, access review, audit. | UAT-003, UAT-004 | Normal Admin must not create Admin/Super Admin. |
| Customer registration and activation | Built - needs UAT | New customer registers; account stays pending until Admin activates it. | Customer actor/client record, supplier access request, consent/collection notice evidence, activation status. | UAT-005 | This is runtime scope because booking access depends on it. |
| Customer CRM | Built as lean V1 CRM - needs UAT | Admin sees customer/workshop records, rhythm flags, supplier access, activation/review actions. | Actor/contact/customer account records, supplier links, CRM review fields. | UAT-005, UAT-022 | This is not a full external CRM. Marketing/opportunity management is out of runtime. |
| Supplier master data | Built - needs UAT | Admin adds/updates/archives suppliers; client can only book approved active suppliers. | Supplier actor records, actor-supplier links, master data change log. | UAT-022 | Supplier list is controlled data, not hardcoded. Ficeda removed from active supplier network. |
| Client pickup request | Built - needs UAT | Client creates order with con note, supplier, priority, run/date details, address and notes. | Pickup request/order record, supplier link, status, received date, scheduled run date. | UAT-006, UAT-007 | The portal records requests; upstream supplier con-note creation remains outside the app. |
| Scheduling visibility | Built - needs UAT | App shows received/scheduled status and run date, but runtime no longer hard-locks work around the previous 12:30pm booking cut-off. | Order received date, scheduled/actual run date, status, driver-created run evidence. | UAT-007 | Supplier con-note timing is an upstream input, not an app lockdown rule. |
| Admin dispatch/run assignment | Built - needs UAT | Admin can review dispatch/run assignment and named driver/vehicle evidence; driver can also create the daily run from ready con notes. | Run, driver, vehicle, fleet compliance, assignment evidence. | UAT-008, UAT-025 | Admin assignment remains available when needed. |
| Driver Today's Run | Built - needs UAT | Driver sees today's pickup and en-route work assigned to the driver/vehicle. | Orders/runs, driver assignment, status, pickup/delivery state. | UAT-008, UAT-025, UAT-026 | Must be retested on iPad/Chrome because real testing exposed sync/data mismatch. |
| Driver Upcoming and bring-forward | Built/part built - needs UAT | Driver can view upcoming work and bring forward complete ready packages where allowed. | Original run date, current run date, bring-forward evidence, audit/status. | UAT-009, UAT-010 | Approved model is whole-order bring-forward if complete order is ready. |
| Driver Create Daily Run | Built - needs UAT | Driver can create the daily run from con notes that are ready. | Driver-created run fields, assignment fields, run date, audit/sync evidence. | UAT-032 | ERD still needs to formalise the run and depot-pickup entities. |
| Depot collection choices | Built - needs UAT | Driver can collect planned milk-run packages, brought-forward ready next-day packages, and ready packages with no con note/customer missed portal entry. | Depot pickup source, count, con-note/no-con-note evidence, Admin reconciliation exception. | UAT-033 | No-con-note/missed-portal pickups are excluded from billing until Admin reconciles account ownership. |
| Pickup-time item counting | Built - needs UAT | Driver counts tyres, parts and returns at pickup, before moving work to en route/sign-off. | Pickup item type/quantity, price rule, pickup total, status change. | UAT-011, UAT-021 | Driver must not manually override pricing. |
| Delivery sign-off and POD | Built - needs UAT | Driver selects en-route work, enters receiver name, captures signature, completes delivery. | Delivery, delivery proof, receiver name, signature path/proof ID, delivered status. | UAT-014, UAT-015, UAT-016, UAT-030 | Receiver phone, GPS, and photo are not mandatory for V1. |
| Processed con-note/POD download | Built - needs UAT | Client/Admin can download POD/processed con note for delivered work. | Delivery proof and generated PDF evidence. | UAT-015, UAT-016 | PDF availability still needs live storage/access testing. |
| Client My Orders | Built - needs UAT | Client sees scheduled, next-run, en-route, delivered orders; can download POD, review, dispute. | Account-scoped order records, proof records, dispute/review exceptions. | UAT-016, UAT-017 | Review/dispute buttons should create visible Admin work, not just UI state. |
| Exceptions and daily alert | Built - needs UAT | Admin sees exception queue/alert categories and can close/review exceptions. | Exception records, alert review status, audit. | UAT-017, UAT-025 | SLA monitoring is not in scope; exception evidence is in scope. |
| Billing by customer/month | Built - needs UAT | Admin sees customer/month invoice groups and can download invoice PDF. | Invoice, invoice lines, delivery proof links, PDF output. | UAT-018, UAT-031 | V1 billing runtime ends at downloadable PDF. |
| Invoice email and payment follow-up | Out of runtime | Admin downloads PDF and emails it manually outside the portal. | Optional Admin note/external evidence outside runtime. | UAT-019, UAT-020 | No runtime email send, bounce, payment chasing, bank reconciliation, BAS, Xero, OpenClaw, or accounting API. |
| Pricing | Built - needs UAT | Price rules are table-driven; Admin manages approved pricing; driver sees calculated price only. | `price_rules`, pricing master data change log, invoice lines. | UAT-021 | Confirm live schema constraints match approved current prices. |
| Offline driver mode | Part built - needs ERD/schema reconciliation and UAT | Same device can temporarily hold failed field updates and retry when online. | Local browser outbox/cache, sync banner, Admin recovery evidence if needed. | UAT-012, UAT-013, UAT-026, UAT-027, UAT-028, UAT-029 | Local changes are not live until sync succeeds. Real-life test failed, so this is not accepted yet. |
| Audit history | Built/part built - needs UAT | Key access, master data, status, billing, privacy and recovery actions are audited. | Audit log/hash-chain records and local audit events. | UAT-003, UAT-004, UAT-024, UAT-025 | Production access-log evidence from platform still required. |
| Privacy, retention, NDB | Evidence/control only - needs UAT/legal approval | Admin can record privacy/data-use/NDB/retention evidence. | Privacy request, data-use, NDB, retention queue, audit records. | UAT-023, UAT-024 | Final policy/legal owner approval still required. Privacy Owner role is GM Moto & Co Logistics. |
| Public website/legal pages | Draft only | Legal pages are held with source code and baseline evidence copy. | Legal HTML source and baseline legal draft. | UAT-023 | Do not treat legal pages as final public/legal approval. |
| HCM and driver legal classification | Out of runtime | Not part of courier portal. | HCM extract/future HCM software only. | Not a V1 UAT item | Driver agreement, verification, disciplinary/removal and classification are not logistics runtime scope. |
| SLA monitoring | Out of runtime | No portal-owned SLA timer/escalation. | Timestamps may exist as evidence only. | Not a V1 UAT item | This is a business/process boundary, not portal functionality. |
| Route optimisation/GPS tracking | Out of runtime | No route optimisation or mandatory GPS. | None required for V1. | Not a V1 UAT item | Driver run views are operational lists, not routing optimisation. |
| External supplier/customer upstream process | Out of runtime | Customer still gets supplier information/con note through supplier process. | Portal only records submitted con note/request. | UAT-006 | Supplier warehouse processes before pickup are not BOAS runtime build scope. |

## What This Proves

This register proves scope alignment only when the following are true:

1. Every BOAS/SOP/policy item is assigned one of the scope decisions above.
2. Every `Built - needs UAT` row has a matching UAT script and test evidence.
3. Every `Out of runtime` row is also reflected in policy/SOP/customer-facing wording so no one expects the app to do it.
4. Every `Approved - not built` row is blocked from being treated as live until ERD, schema/runtime build, and UAT are complete.

## What This Does Not Prove Yet

This register does not prove the production app is stable. It shows the intended build boundary.

Production acceptance still requires:

- ERD owner/Digiverse approval.
- Reconciliation of production Supabase schema vs local migration folder.
- Live Auth/RLS/Storage tests.
- iPad/Chrome driver UAT after the offline/sync issues.
- End-to-end actor UAT for Client, Billing, Driver, Admin, Super Admin, and Receiver POD.

## Owner Review Method

Use three passes:

1. Read the `Out of runtime` rows first. If any of those should actually be software, mark them as a scope change.
2. Read the `Approved - not built` rows next. These are not live promises yet.
3. Run the UAT rows for everything marked `Built - needs UAT`. If the test fails, the row is not accepted.

If a requirement cannot be found in this register, it should not be built until it is added here and mapped to scope, data evidence, and UAT.
