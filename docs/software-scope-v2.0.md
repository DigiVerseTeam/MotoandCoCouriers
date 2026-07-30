# Moto & Co Couriers Software Scope v2.0

Status: draft for approval.

Last updated: 2026-07-02.

Owner: Moto & Co Logistics.

Build/service: Moto & Co Couriers V1 portal and public website.

Active production portal: `https://motoandcocouriers.vercel.app`.

Active runtime target: Supabase project ref `fhrqfrhqopicekaiibyj`.

## Purpose

This document defines what the Moto & Co Couriers software is responsible for, what remains a business process outside the runtime, and what must not be added to the software without a later approved scope change.

It sits before the ERD and before further software changes:

Source documents -> software scope -> ERD -> build/change -> UAT evidence.

Owner-readable scope proof is maintained in `docs/software-build-traceability-v2.0.md`.

## Source Material Referenced

- `baseline/v2.0/`
- `baseline/v2.0/full-source/BOAS/MotoCo_Unified_BOAS_Hierarchy_v2.0.xlsx`
- `baseline/v2.0/full-source/SOP/`
- `baseline/v2.0/full-source/policies/`
- `baseline/v2.0/full-source/journeys/`
- `docs/baseline-documentation-register.md`
- `docs/release-one-source-map.md`
- `docs/architecture.md`
- `docs/platform-env-contract.md`
- `docs/system-testing-status-and-uat-scripts.md`
- `docs/hcm-boundary.md`
- `supabase/migrations/`
- `src/components/moto-co-logistics.tsx`

## Source Of Truth Rule

Do not infer missing rules.

When a runtime behavior, data object, or control conflicts between sources, use this order:

1. User-approved decision in the current baseline or decision register.
2. BOAS v2.0.
3. SOP v2.0/v1.3 set.
4. Policy v2.0 draft set.
5. Journey files.
6. Current runtime code and migrations.

If a gap remains, record it as a gap. Do not silently design around it.

## Problem Statement

Moto & Co needs a simple delivery portal for workshop support courier work. The software must let customers request pickup work, let the courier business control master data and access, let drivers complete runs and capture proof, and let Admin produce billing evidence without relying on scattered messages or manually reconstructed delivery records.

The software must replace the old lightweight delivery app behavior, not display workflow documentation as screens.

## Objectives

- Give customers a simple way to register, log in, request pickups, see scheduled/current/delivered work, download POD, and raise review/dispute requests.
- Give Admin/Super Admin a controlled way to manage customers, suppliers, drivers, vehicles, users, pricing, dispatch, exceptions, billing, audit, retention, privacy, and operational governance.
- Give drivers a field workflow for today's run, upcoming/bring-forward work, pickup-time item counting, delivery sign-off, POD capture, and offline retry.
- Keep billing inside the app only up to downloadable invoice PDF generation.
- Keep out-of-system business processes explicit so scope does not creep into HCM, accounting, SLA monitoring, or external integrations.
- Keep every new build change aligned to BOAS/SOP/policy and ERD before implementation.

## Users And Roles

| Role | Description | Key runtime actions |
| --- | --- | --- |
| Super Admin | Courier business owner/highest internal access role. | Bootstrap/manage Admin users; oversee access model; perform courier-business login. |
| Admin | Courier business operator. | Approve customers; manage suppliers, drivers, vehicles, pricing, dispatch, exceptions, billing PDFs, privacy/retention/audit evidence. |
| Client Operational | Customer/workshop operational user. | Register, log in, request pickups, view orders, raise delivery review/dispute, download POD where allowed. |
| Client Billing | Customer/workshop billing user. | View billing records, invoice PDFs, billing notices, payment evidence visibility, billing disputes. Cannot create operational pickups. |
| Driver | Courier driver. | Log in, create/see daily run, count items at pickup, bring forward ready packages, complete POD/sign-off, run close, retry offline updates. |
| Receiver | No-login person receiving goods. | Provides receiver name and signature only through driver POD workflow. |
| Digiverse/platform support | Technical delivery/support role, not a normal business app user. | Maintains GitHub, Vercel, Supabase, environment secrets, migrations, deployment and rollback controls under approval. |

## Runtime Scope Matrix

| Area | In software runtime | Out of software/business process | Evidence retained by runtime |
| --- | --- | --- | --- |
| Login and access | Customer Login / Courier Business Login; Supabase Auth; role resolution; RLS-protected access; Admin/Super Admin provisioning. | Final legal employment classification or HCM onboarding. | Profiles, role/access assignments, provisioning/access review audit. |
| Customer registration | Customer submits details and requested supplier access; Admin reviews and activates before booking opens. | Manual commercial decision-making outside the app if owner chooses. | Customer actor/contact/profile records, consent/collection notice acknowledgement, activation status. |
| Customer CRM | Lean Village CRM subset for customer/workshop records. | Full external CRM, marketing automation, opportunity management, relationship health scoring. | Actors, contacts, relationship events, obligations, supplier access links. |
| Supplier master data | Admin-managed suppliers, supplier access links, archive/reactivation, supplier review flags. | Supplier contract negotiation and upstream supplier/customer con-note creation. | Supplier actors, supplier links, master-data changes, supplier review flags. |
| Booking/pickup request | Client submits con note, supplier, priority, delivery address, requested/scheduled run date. Cut-off and scheduled status are visible. | Customer getting information to supplier before the supplier creates a con note. | Pickup request, schedule flags, operational notices, audit. |
| Dispatch and run planning | Admin/Driver view/assign work; named driver and vehicle evidence; driver daily run requirement is approved. | Hard previous evening-before lockdown. Route optimisation. SLA countdown ownership. | Runs, pickups, deliveries, delivery stop groups, fleet vehicle evidence, run closures. |
| Driver depot workflow | Driver can collect planned milk-run packages, bring forward complete ready next-day packages, and record ready no-con-note/missed-portal packages once built. | Depot stock organisation before driver arrival. Supplier warehouse internal process. | Pickup status/outcome, bring-forward records/statuses, no-pickup/exception records. |
| Pickup item count | Driver counts tyres, parts, returns at pickup before moving work to en route/sign-off. | Driver manually entering or overriding prices. | Pickup item counts, price-rule derived amounts, audit/exception if corrected. |
| Delivery and POD | Receiver name and signature required before Delivered. Receiver phone, photo, and GPS are not mandatory. POD stored privately. | Public tracking links unless separately approved. | Delivery, delivery proof, private proof path, grouped-stop proof, retention queue. |
| Offline driver operation | Same-device local outbox/cache can hold failed field updates and retry when online. Live records update only after sync succeeds. | Treating local device state as live source of truth. Recovering cleared unsynced device data without Admin evidence. | Sync status, Admin recovery notes/audit where applicable. Current local outbox is not a Supabase table. |
| Exceptions | Admin exception queue, daily alert review, dispute/no-pickup/unmatched billing/supplier/pricing/privacy exceptions. | Portal-owned SLA breach monitoring. | Exceptions, exception alerts, investigations, audit. |
| Billing | Admin billing review, invoice preview, downloadable invoice PDF, invoice and invoice-line records. | Runtime email send, bounce handling, payment follow-up, bank reconciliation, BAS/accountant handoff, external accounting API integration. | Invoices, invoice lines, invoice PDF/download evidence where modeled, billing notices/payment evidence where applicable. |
| Disputes/reviews | Customer can raise delivery/billing disputes; Admin investigates using POD, pickup count, invoice PDF, audit. | Legal advice or formal debt recovery beyond approved process. | Disputes, exceptions, resolution notes, audit. |
| Pricing | Admin-managed `price_rules`; Owner approval/change-log evidence; driver cannot price manually. | Ad hoc customer-specific pricing unless separately approved. | Price rules, master data changes, pricing review flags. |
| Privacy and retention | Access/correction/privacy request records, data-use reviews, NDB incidents, retention queue, audit log. | Legal publication/sign-off where owner/legal approval not recorded. | Privacy requests, data use reviews, NDB incidents, retention queue, audit log. |
| Website/legal pages | Website route and draft legal page source held with code. | Publishing unapproved customer-facing legal copy. | Source-code legal draft and baseline evidence copy. |

## Explicitly Out Of Scope For V1 Runtime

- HCM requirements: driver legal classification, driver agreements, driver verification evidence, disciplinary/removal consequences, employment/contractor payment model, external courier expansion employment model.
- SLA monitoring as a software feature. The app may store timestamps and evidence, but it does not own SLA countdowns or breach alerts.
- External accounting API integration, including Xero/OpenClaw/accounting API paths.
- Runtime invoice email sending and bounce monitoring.
- Bank reconciliation and payment follow-up automation.
- BAS/accountant handoff workflow.
- Route optimisation.
- GPS as mandatory POD evidence.
- POD photo as mandatory evidence.
- Receiver login.
- Hard previous evening-before/day-before run lock.
- Driver-entered manual pricing.
- External CRM dependency for V1.
- AI-generated outbound customer/admin sends.

## Key Entities In Plain Language

| Entity | What it represents | Owner/source |
| --- | --- | --- |
| Actor | A customer, supplier, partner, advisor, regulator, or other relationship party. | Admin/customer registration. |
| Contact | A person linked to an actor, such as operational, billing, receiver, or supplier dock contact. | Customer/Admin. |
| Profile | A login identity linked to a Supabase Auth user and optionally an actor. | Admin/Super Admin provisioning. |
| Access role assignment | The specific app role granted to a profile/contact/actor. | Admin/Super Admin. |
| Supplier link | A customer account's approved supplier access. | Admin. |
| Pickup request | A customer booking/con note request. | Client Operational. |
| Run | A day's courier run with named driver and vehicle evidence. | Admin/Driver workflow. |
| Pickup | Pickup-time item/outcome record linked to a pickup request and run. | Driver. |
| Delivery | Delivery work item created from picked-up work. | System/Admin/Driver workflow. |
| Delivery stop group | Same-account/address grouping so one receiver signature can complete multiple work items. | System/Driver workflow. |
| Delivery proof | Receiver name, signature path, and proof metadata. | Driver/Receiver. |
| Price rule | Approved table-driven pricing source. | Admin/Owner governance. |
| Invoice | Monthly/customer invoice record used to generate a downloadable PDF. | Admin. |
| Invoice line | Billable proof-linked work item. | System/Admin billing. |
| Exception | Structured issue requiring Admin action or review. | System/Admin/Client/Driver. |
| Audit log | Append-only PII/action history. | System. |
| Retention queue | Records requiring retention/destruction/privacy-owner approval. | System/Admin. |

## Key Relationships In Plain Language

- A customer actor can have many contacts.
- A supplier actor can have many contacts.
- A customer actor can be linked to many supplier actors.
- A pickup request belongs to one customer actor and one supplier actor.
- A pickup request can produce pickup and delivery records.
- A run can contain many pickups, deliveries, and delivery stop groups.
- A delivery may have one delivery proof record.
- A delivery stop group may have one grouped proof that completes multiple deliveries.
- A customer can have many invoices.
- An invoice can have many invoice lines.
- Invoice lines link back to pickup request, delivery, and delivery proof where available.
- Exceptions and disputes link back to affected operational/billing records.
- Audit and retention records are cross-cutting and can refer to many table/record types.

## Business Rules And Constraints

- Supplier names are controlled master data, not hardcoded.
- Pricing is controlled through `price_rules`, not driver entry.
- The old 12:30pm Brisbane hard booking cut-off is not a runtime lockdown rule for V2.0; supplier con-note timing is an upstream input and the driver creates the daily run from ready con notes.
- Drivers can bring forward a complete ready order when they are already at that supplier and can record a depot-ready package with no con note/customer portal entry for Admin reconciliation.
- Driver item count occurs at pickup.
- Delivered status requires receiver name and signature.
- POD proof is private and retained for 7 years from delivery date.
- GPS is not required.
- Receiver phone is not required.
- Customer account activation is required before booking opens.
- Client Billing must not create operational pickup requests.
- Receiver remains no-login.
- Local/offline driver updates are not live until synced.
- Clearing saved device data can abandon unsynced local records and must not be used on unresolved live work.
- Privacy Owner is role-based GM Moto & Co Logistics.
- System testing is not complete; UAT must be re-executed after ERD changes and before claiming stability.

## Systems And Integrations

| System | Runtime purpose | Direction/status |
| --- | --- | --- |
| GitHub | Source control and CI evidence. | Confirmed target; local handoff evidence still needs care. |
| Vercel | Production hosting for portal and website. | Active production URL. |
| Supabase Auth | User authentication. | Active runtime target; role/RLS UAT still required after schema changes. |
| Supabase Postgres | Runtime database. | Active runtime target; migration-state reconciliation required before next DB change. |
| Supabase Storage | Private POD signature/proof storage. | Private `delivery-proof` bucket; live UAT still required. |
| Email client outside portal | Admin manually sends downloaded invoice PDFs. | Out of runtime. |
| Bank/accounting process outside portal | Payment follow-up and reconciliation. | Out of runtime. |

## Known Scope And Schema Gaps To Resolve Before Next Software Update

| Gap | Why it matters | Next action |
| --- | --- | --- |
| ERD approval | More runtime changes have been breaking adjacent behavior. | Review and approve `docs/entity-relationship-diagram-v2.0.md` before schema/app changes. |
| Local migration folder vs production evidence | `docs/platform-env-contract.md` references production migrations through `202606190034_super_admin_provisioning.sql`, but that migration is not present in the visible local migration folder. | Pull/reconstruct the missing migration state or document production-only delta before changing schema. |
| Role model mismatch | BOAS v2.0 uses `super_admin`, `admin`, `client_ops`, `client_billing`, `driver`, `no_login`; visible local SQL still includes coarse `profiles.role` and `access_role_assignments` without visible `super_admin` in the migration folder. | Align ERD, migrations, and live schema before role-related changes. |
| Driver daily run data shape | Daily-run creation and depot collection choices are approved, but the exact persistent table shape is not fully modeled in the visible migrations. | Approve ERD addition before build. |
| Offline outbox data shape | Offline outbox is currently a local device/browser concept, not a Supabase source-of-truth table. | Decide whether only local cache is needed or whether sync attempt evidence needs a server table. |
| Invoice PDF download evidence | Billing boundary is approved, but a distinct invoice PDF download evidence table is not visible in the current local migrations. | Decide whether invoice fields are enough or add a download/evidence table. |
| Price constraint alignment | Seeded approved prices use `up_to_5kg`, `5_to_10kg`, `10kg_plus`, return, and out-of-zone rows; earliest SQL constraints show older bands/types. | Verify live schema constraints and add corrective migration if needed. |
| RLS/Auth/Storage UAT | Access/storage policies are not fully proven after all workflow changes. | Re-run UAT scripts after ERD/schema alignment. |

## Build Gate

No further software behavior changes should be made until:

1. This scope document is accepted as the V1 boundary.
2. The ERD is reviewed and approved or marked with explicit rejected/open sections.
3. Any schema mismatch between local migrations and production is reconciled.
4. UAT scripts are updated for any ERD-approved schema changes.

## Sign-Off

| Name | Role | Date | Approved? |
| --- | --- | --- | --- |
| TBD | Owner/Admin | TBD | No |
| TBD | Policy/Privacy Owner | TBD | No |
| TBD | Digiverse technical owner | TBD | No |

## Change Log

| Date | Change | Author |
| --- | --- | --- |
| 2026-07-02 | Initial v2.0 software scope created from baseline v2.0, runtime docs, templates, and visible migrations. | Codex |
