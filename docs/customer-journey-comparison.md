# Customer Journey Comparison

Last updated: 2026-06-19

Source archive: `customer journey.zip`

This comparison checks the uploaded user journeys against the current local Next.js runtime. It does not invent missing workflow detail. Anything not implemented or not confirmed remains visible as a gap.

The journey material is implementation source and acceptance evidence. Product routes mount the active software shell so actors can perform their accountable steps; they must not become journey-viewer or workflow-display pages.

## Source Files Checked

- `UJ-CRM-001A-ClientOperationalContactJourney.json`
- `UJ-CRM-001A-ClientOperationalContactJourney.xlsx`
- `UJ-CRM-001B-ClientBillingContactJourney.json`
- `UJ-CRM-001B-ClientBillingContactJourney.xlsx`
- `UJ-ADM-001-AdminJourney.json`
- `UJ-ADM-001-AdminJourney.xlsx`
- `UJ-DRV-001-DriverJourney.json`
- `UJ-DRV-001-DriverJourney.xlsx`
- `MotoCo_Unified_BOAS_Hierarchy_v1.7.xlsx`

The JSON files were used as the primary structured source for the journey comparison. The XLSX journey workbooks contain the same journey overview, steps, and screen inventory structure. BOAS v1.7 was identified as the broader process, roles, access, data, risks, UAT, policy, configuration, deployment, privacy, and business model workbook.

## Overall Result

The local build captures the first operational spine but not the full uploaded journeys.

Working locally:

- Client registration creates a pending customer actor, Operational Contact, Billing Contact, supplier links, and consent record.
- Product entry routes now steer to the relevant accountable actor and workflow context instead of opening only a generic login surface.
- Registration and Admin-created Workshop CRM records reject PO boxes; Admin activation requires B2B, SEQ physical-address, contact, and approved-supplier eligibility confirmation.
- Admin can activate pending accounts after eligibility review and record a local account-level activation outbox update.
- Client, Billing, Driver, and Admin local login use generated one-use testing codes with local expiry, verification-attempt limits, request throttling, and generic unknown-email request behavior.
- Client Operational Contact first-login supplier setup now gates the booking portal until approved supplier links are confirmed or a supplier review request is sent to Admin.
- Admin can create and maintain controlled Workshop CRM records with actor details, Operational/Billing contacts, internal owner, relationship review fields, supplier links, relationship events, event-level next actions, obligations, and a browser-verified CRM Rhythm Monitor for incomplete records, due reviews/actions, overdue obligations, at-risk records, and open issues.
- Admin can view local role assignments, record structured access reviews for annual, role-change, departure, restore, revoke, or other decisions, revoke/restore access, and revoked roles are blocked from local login.
- Admin can add/archive/reactivate suppliers, see supplier status, capture source-backed supplier fields, enforce CAP-MCL-001 / POL-MCL-001-001 active-supplier approval evidence, record named dock contact status, record supplier-level review intervals, capture structured review/archive/reactivation reasons, monitor incomplete/stale supplier records, queue supplier review exceptions, browser-verified archive blocking when open work exists, and update a client's approved supplier access only with Admin reason/evidence and APP-PRV-004 audit evidence.
- Admin can record Policy #22 manual driver availability with note, notice received date, calculated due date, late-notice flag, and contingency evidence; dispatch assignment and run compilation are blocked when the selected driver is unavailable or on leave for the run date.
- Admin can maintain a logistics-facing Driver Directory for dispatch identity/status while HCM-owned driver legal classification, agreement, verification, conduct/discipline, and expansion employment-payment material remains outside the active logistics runtime.
- Admin can investigate Policy #27 WHS hazard, fatigue/health, and WHS incident/near-miss exceptions, and the Supplier Pickup Standards Monitor flags supplier-premises WHS hazard stops that require supplier follow-up.
- Admin Dispatch now includes CAP-MCL-002 run-planning governance: night-before compile status, named assignment rate, fleet gate pass rate, Admin intervention count, and APP-ADM-002 exception queueing.
- Client supplier setup requests create Admin exception queue work items.
- Active accounts can submit pickup requests against linked suppliers.
- The 12:30pm Brisbane cut-off is applied and schedule adjustments are recorded.
- Policy #14 cancellation is interactive locally: Client Operational Contact can self-cancel before cut-off, request Admin review after cut-off, Admin can accept before goods collection, and collected goods block cancellation.
- Client, Client Billing Contact, and Admin can see local operational update/outbox records for account suspension/reinstatement, pickup request, cut-off schedule adjustment, driver pickup confirmation, out-for-delivery, delivery outcomes, supplier setup request, delivery dispute acknowledgement, and billing-query acknowledgement; every record remains `local_record_only` with `provider_not_configured`. Account activation notices are not created under the decisions register.
- Operational or billing notice rows explicitly marked `failed` are routed to APP-ADM-005 exceptions; provider-not-configured records stay visible as production-delivery gaps.
- Admin dispatch now compiles run-date work into a named driver and Admin-managed vehicle run brief with supplier and delivery-geography sequence plus local registration/insurance/defect checks before stops appear in the Driver workspace.
- Admin can see local exceptions, review the daily APP-ADM-005 structured alert, acknowledge Policy #18 disputes without closing them, escalate Policy #18 disputes to Owner, investigate/close disputes against linked invoice, work item, and POD proof context, record controlled Policy #18 findings and local remedy obligations, record the Policy #18 outcome back to linked work/invoice records, investigate/close supplier master-data review exceptions, investigate Policy #16 supplier pickup standards reviews against supplier pickup metrics, and correct SOP-EXC-03 unmatched billing account exceptions before invoice inclusion.
- Admin can inspect the local retention register for pickup request 7-year run-date retention, receiver/signature proof 7-year delivery-date retention, private `delivery-proof/deliveries/{delivery_id}/signature.png` path evidence, and deletion blocked pending Privacy Owner approval.
- Admin can review the local APP-PRV-004 audit chain with PII action counts, protected-object labels, sequence numbers, and verified previous/current hashes.
- Admin can manage structured price rules with required change reason, Owner approval reference, effective dates, browser-verified archive/reactivation evidence, generated local change-log IDs, local master-data change rows, pricing governance monitoring for incomplete or unlogged rows, and Supabase draft guardrails requiring pricing change-log/Owner approval evidence before `price_rules` take effect.
- Client booking cut-off logic now resolves adjusted requests to the next available Tuesday/Thursday run date and carries schedule-adjusted evidence into tracking, Admin dispatch, and customer update records.
- Admin retention now includes pickup request records retained for 7 years from run date, supplier records retained for relationship + 7 years, master-data change logs retained for 7 years from change date, and POD proof retained for 7 years from delivery date.
- Driver can view a local run brief.
- Driver cannot set Delivered without Receiver name and signature.
- Driver pre-trip, compiled run brief, pre-trip/run-brief issue reporting, Policy #27 fatigue/health and WHS incident reporting, missing-stop exception reporting, supplier-sequenced pickup, SOP-PUP-02 supplier-stop closeout, Policy #15 goods-acceptance evidence, Policy #16 pickup standards evidence, pickup item capture from price rules, Picked Up, structured Policy #15 / Policy #16 / Policy #27 No Pickup / SOP-RUN-04 future-pickup Bring Forward / Policy #8 Failed Delivery attempt capture, delivery start gating, SOP-DEL-01 grouped delivery stops by account/address with one signature per location, POD capture with private-storage migration contract, SOP-DEL-05 system delivery completion, UJ-DRV-001 S5 run-close confirmation/action items, and Admin run-close review now exist locally.
- Client delivery dispute raising now captures Policy #18 dispute type, delivery date in question, description, invoice timing, and creates an Admin exception record.
- Admin billing review, SOP-EXC-03 unmatched billing account exclusion/correction, draft invoice batch creation, SOP-BIL-04 rendered-invoice confirmation with automatic local dispatch evidence capture, local payment evidence capture after dispatch, overdue account detail, system-generated local Day 8 overdue notice evidence, Admin fallback Day 8 notice queue, notice-before-suspension gate, suspension contact evidence, automatic reinstatement notification record, local suspension/reinstatement account-notice records, suspension confirmation, structured payment-arrangement fields, reinstatement evidence capture, and Policy #24 month-end financial reconciliation evidence now exist locally.
- Client Billing Contact can now log in with the billing email, preview local invoice batches with proof references and totals, view local invoice dispatch records, local payment evidence, account notices including Day 8 overdue source labels, suspension, and reinstatement notice records, local billing-query acknowledgement updates, and billing-query status/investigation/remedy outcomes in a billing-only portal, raise a Policy #18 billing query with invoice line/order reference, delivery date in question, and description into the Admin exception queue without access to pickup or supplier setup controls, and have the query investigated by Admin against proof, pickup, pricing, and invoice records.
- Client Operational Contact tracking is now account-scoped and searchable, reads pickup, delivery, POD proof, retention, and linked exception records, and can raise a delivery dispute from the tracked order.

Partially represented:

- Client Operational Contact journey.
- Admin exception queue and local daily structured alert.
- Admin overdue/suspension concept.
- Driver assigned run brief.
- Delivery proof and failed delivery production execution.
- Customer tracking and dispute concept.
- Production pricing authority and dual-control execution.

Not built yet:

- Production activation email/SMS/in-app delivery.
- Production Supabase/Auth email delivery for Client Operational Contact, Client Billing Contact, Driver, and Admin code login.
- Production activation email/OTP delivery into the first-login supplier setup sequence.
- Production customer notification delivery, provider failure handling, and customer-visible delivery channel.
- Production invoice dispatch, bounce handling, and external accounting export.
- Production next-period treatment for already-invoiced unmatched account corrections.
- Production external delivery of Day 8 overdue notices and scheduled daily generator execution.
- Production payment confirmation source for invoice/reinstatement reconciliation.
- Production route optimization and night-before automation.
- Production reason-code governance for Failed Delivery, driver issues, retained goods, upload retry, offline handling, and wrong-address handling.
- WHSQ notifiable-incident procedure, production WHS notification ownership, and full fatigue/risk framework activation evidence remain open; local Policy #27 only implements the active hazard/fatigue reporting and Admin follow-up rules.
- Driver upload retry/offline handling.
- Billing Contact email-first invoice dispatch, EFT payment confirmation, outbound notice delivery, and production scheduled Day 8 generator execution.
- BAS/tax accountant handoff and Otimi Rules reporting cadence/format/recipient.

## Journey Coverage

| Journey | Uploaded stages | Current coverage |
| --- | ---: | --- |
| `UJ-CRM-001A` Client Operational Contact | 3 | Partial: registration, physical-address/no-PO-box validation, Admin SEQ eligibility confirmation, local pending activation screen, local account-activation outbox record, hardened local code login, first-login supplier setup gate, supplier setup request, Policy #14 order cancellation/review request, local operational update/outbox records, authenticated account-scoped tracking with POD/exception evidence, and Policy #18 delivery dispute required-field capture exist locally, but production activation delivery, production Supabase/Auth delivery, automated postcode/suburb boundary validation, public secure tracking-token model, final customer-visible tracking labels, and production notification delivery are missing. |
| `UJ-CRM-001B` Client Billing Contact | 2 | Partial: billing contact data, separate billing-email login, billing-only invoice visibility, inline invoice preview with proof references and totals, Admin draft invoice batches, local invoice dispatch record visibility, local payment evidence visibility, system-generated local Day 8 overdue notice evidence with source labels, local suspension and reinstatement notice records, Policy #18 invoice-line/date billing-query escalation, billing-query acknowledgement, billing-query status/investigation/remedy visibility, proof/pickup/pricing/invoice-backed Admin investigation, local suspension record, structured payment-arrangement evidence, and local automatic reinstatement notification record exist, but actual invoice email, production EFT reconciliation source, external credit-note/corrected-invoice issue path, production scheduled overdue generator execution, suspension notification delivery, and reinstatement notification delivery are not built. |
| `UJ-ADM-001` Admin | 6 | Partial: hardened local code login, role access register/review/revoke/restore, Workshop CRM create/review, account activation/suspension, supplier access, Policy #14 post-cut-off cancellation review/acceptance before goods collection, Policy #8 next-run second-attempt scheduling and redelivery-fee approve/waive review, Policy #16 supplier pickup standards monitoring and supplier-health exception investigation, Policy #27 WHS hazard/fatigue exception investigation and supplier follow-up evidence, Driver Directory logistics account management, Policy #22 manual driver availability notice/late/contingency evidence and dispatch/run-compiler blocking, CAP-MCL-001 supplier approval-gate evidence and named dock contact gap visibility, CAP-MCL-002 run-planning monitor with APP-ADM-002 exception queueing, APP-ADM-002 local run compilation with supplier/geography sequencing and fleet-compliance checks from the Admin vehicle register, operational update outbox review, supplier master data, structured price rules, exceptions, SOP-EXC-03 unmatched billing account correction, SOP-BIL-04 rendered-invoice approval, Policy #24 financial reconciliation, Policy #18 disputes, retention, audit, billing, and first-pass BOAS Sheet 05 RLS migration exist. Production Supabase/Auth delivery, live RLS enforcement testing, external alert delivery, production notification delivery, actual invoice dispatch, BAS/accountant handoff, Otimi Rules reporting, retention destruction approval, actual supplier named dock contacts, live monitoring execution, live audit enforcement, formal dual-control Owner approval workflow, production route optimisation/night-before automation, live APP-FLT-001 checks, live Policy #16 supplier-health automation, WHSQ notifiable-incident procedure, full fatigue framework activation criteria/evidence, live SOP-DEL-05 trigger execution, scheduled Day 8 generator execution, external credit-note/corrected-invoice issue path, production next-period treatment for already-invoiced account corrections, production apply-pricing authority, and final Policy #22 daily-versus-exception availability operating cadence are missing/unclear. |
| `UJ-DRV-001` Driver | 5 | Partial: hardened local code login, compiled run brief with supplier/geography sequence, pre-trip, pre-trip/run-brief issue reporting, Policy #27 fatigue/health and WHS incident reporting, missing-stop exception reporting, supplier-grouped pickup, SOP-PUP-02 supplier-stop closeout, Policy #15 goods-acceptance evidence, Policy #16 pickup standards evidence, pickup item capture from price rules, pickup outcome, SOP-RUN-04 future-pickup bring-forward capture, delivery start gate, SOP-DEL-01 grouped delivery stop list by account/address with one receiver name/signature per location, SOP-DEL-04 delivery sign-off and price-discrepancy reporting, structured Policy #15 / Policy #16 / Policy #27 no-pickup/Policy #8 failed-delivery attempt capture, POD gate, private proof-storage migration contract, SOP-DEL-05 system completion after proof capture, run close with `Run complete. Good work.` confirmation/action items, and Admin run-close review exist locally. Production Supabase/Auth delivery, route optimization, live upload wiring/testing, upload retry/offline handling, broader production failed-delivery/driver issue reason codes, SOP-PUP-02 `Time constraint` reconciliation against SOP-PUP-03, WHSQ notifiable-incident procedure, production accounting handoff, and external close-confirmation delivery are missing. |

## App Updates Made From This Check

- Expanded `src/lib/journeys.ts` from the rough 8-stage journey to a 13-stage journey aligned to the uploaded source journeys.
- Added `sourceUserJourneys` data with per-stage local coverage and missing work.
- Kept uploaded journey comparison as source evidence while product routes, including `/journey`, mount the active software shell.
- Updated route-level actor contexts for `/booking`, `/admin`, `/driver`, `/tracking`, and `/portal`.
- Added local client supplier setup request and Admin supplier access management with required change reason/evidence.
- Added authenticated Client Operational Contact tracking workspace with account-scoped order search, POD proof/retention visibility, linked exception visibility, and Policy #18 dispute handoff to Admin with required type/date/description fields.
- Added local Client/Admin operational update outbox records for booking submission, cut-off adjustment, driver pickup confirmation, out-for-delivery, delivery outcomes, supplier setup request, delivery dispute acknowledgement, and billing-query acknowledgement without claiming production notification delivery. Account activation notices are not created under the decisions register.
- Added local Policy #14 order cancellation workflow: client self-service before cut-off, post-cut-off Admin review request, Admin acceptance before goods collection, cancellation blocked after collection, non-billable cancelled orders, and local cancellation notice records.
- Added local first-login supplier setup confirmation before booking access opens for activated Client Operational Contacts.
- Added local customer eligibility activation review and no-PO-box delivery-address validation.
- Added browser-verified local Admin Workshop CRM create/review workflow using the lean Village actor/contact/event/obligation subset, including owner, event next-action, and obligation guardrails.
- Added local Admin dispatch assignment and driver-scoped run visibility.
- Added logistics-facing Driver Directory management; HCM-owned driver legal verification material was extracted to `hcm-extract/`.
- Added local Admin Policy #22 manual driver availability workflow with notice received date, due date, late-notice flag, contingency evidence, and dispatch/run-compiler block for unavailable/leave dates.
- Added local Supabase migration guardrails for dispatch assignment and Policy #22 manual driver availability evidence records.
- Extracted Policy #25/#26 driver/courier expansion material to `hcm-extract/`; it is not part of the active logistics runtime.
- Added local Policy #27 WHS/fatigue workflow: Driver fatigue/health and WHS incident reporting, supplier-premises WHS hazard No Pickup capture, Admin APP-ADM-005 WHS Hazard investigation prompts, Supplier Pickup Standards WHS hazard counts, and Supabase WHS hazard guardrails.
- Extracted Policy #19 driver conduct/discipline material to `hcm-extract/`; the logistics app keeps Policy #27 WHS/fatigue reporting and operational exception workflows.
- Added local Client billing visibility and billing-query escalation from invoice batches.
- Added local Billing Contact billing-query acknowledgement records in the billing-only portal.
- Added active-shell Client Billing Contact login and billing-only portal access.
- Added system-generated local Day 8 overdue notice records with Billing Contact and Operational Contact visibility, source labels, Admin fallback recording, and an Admin non-payment suspension prerequisite.
- Added local suspension/reinstatement account notice records with Client Billing Contact visibility and Client Operational Contact update visibility while keeping external delivery unresolved.
- Added local payment evidence capture before Paid status with Billing Contact and Operational Contact visibility.
- Added local inline invoice preview for Admin, Client Operational Contact, and Client Billing Contact, with Billing Contact query handoff from the preview.
- Added local invoice dispatch evidence capture and visibility without claiming production email/PDF delivery.
- Added local SOP-BIL-04 rendered-invoice confirmation gate; confirmation records local dispatch evidence automatically and payment monitoring remains blocked until dispatch evidence exists.
- Added local SOP-EXC-03 unmatched billing account queueing, billing-candidate exclusion, Admin account correction, and matching Supabase migration.
- Added local Policy #24 month-end financial reconciliation controls for Admin, including no-off-system-revenue confirmation, 5-business-day due date visibility, 7-year retention evidence, and open accountant/Otimi reporting gaps.
- Added active-shell Admin exception investigation with linked invoice, work item, and POD proof context.
- Added local APP-ADM-005 daily structured exception alert and Admin review acknowledgement.
- Added local Admin retention register for confirmed 7-year pickup-request and receiver/signature proof retention rules, aligned to the private proof object path convention used by the Supabase migration contract.
- Added local APP-PRV-004 audit-chain review and Supabase audit hash-chain migration.
- Replaced the active local password login with role email plus local testing code entry for Client Operational Contact, Client Billing Contact, Driver, and Admin.
- Hardened the local testing-code flow with generated one-use codes, a 5-minute local expiry, 3 local verification attempts, 5 local requests per role/email per 10 minutes, and generic request behavior for unknown emails.
- Added a local pending activation client workspace that blocks booking actions until Admin activation.
- Added local Admin access governance with role assignment visibility, structured access review/revoke/restore controls, Receiver no-login visibility, login blocking for revoked roles, and APP-PRV-004 audit events.
- Added first-pass Supabase RLS migration from BOAS Sheet 05 for account-scoped Client Operational access, billing-only Client Billing access, assigned Driver access, Admin full-platform access, Admin-only pricing/master-data writes, suspended-account pickup blocking, private proof-object reads, and Receiver no-login.
- Added local Driver pickup outcome handling and gated delivery start until supplier pickup is confirmed.
- Added local Driver No Pickup / SOP-PUP-02 supplier-stop closeout / SOP-RUN-04 Bring Forward / Policy #8 Failed Delivery controls with required reason capture, optional handling context, No Pickup and Failed Delivery Admin exception routing, source-backed SOP-DEL-04 price-discrepancy reporting, supplier-stop closeout evidence, future-pickup bring-forward evidence, two-attempt failed-delivery tracking, next-run second-attempt scheduling, Admin redelivery fee approval/waiver, approved-fee billing, and local Supabase outcome evidence fields.
- Added local Policy #15 goods-acceptance evidence and Policy #16 Driver pickup standards evidence, No Pickup category capture, no-billable-row evidence, Admin supplier pickup standards monitor, APP-ADM-005 supplier-health queueing, and Policy #15 / Policy #16 / CAP-MCL-001 investigation context.
- Added local SOP-DEL-01 delivery stop grouping so Driver delivery work groups by client account and delivery address; one receiver name/signature completes every work item in that grouped stop.
- Added local Admin run-close review for Driver close records, open-stop check, linked POD proof count, linked open exceptions, and APP-PRV-004 audit evidence while keeping production billing-ready semantics unresolved.
- Added local APP-ADM-002 run compiler with run-date selection, named driver, Admin-managed vehicle record selection, registration/insurance/defect checks, supplier/geography sequence, and Driver compiled run brief display.
- Added local SOP-DEL-05 proof-driven delivery completion: Driver POD insert now causes system Delivered status, proof-linked billing-ready evidence, delivered update/audit records, Admin direct Delivered status guard, and Supabase draft trigger/guardrail migration.
- Added local Admin fleet asset register for BOAS Sheet 06 / APP-FLT-001 vehicle records, master-data change rows, and dispatch blocking when vehicle compliance is incomplete.
- Added Supabase private POD storage contract migration: `delivery-proof` path convention, assigned-driver/Admin proof object upload policy, linked-role read policy, delivery_proof path enforcement, and Policy #5 retention queueing.
- Expanded local Admin supplier master data capture, inline supplier edit, structured review/archive/reactivation reasons, browser-verified archive/reactivation state changes, and active-work archive guard.
- Added local Admin supplier master-data monitoring with supplier-level review intervals, incomplete/stale supplier flags, exception queue routing, and `SOP-MDM-01` investigation context.
- Added local Admin pricing governance monitoring with incomplete/unlogged price-rule flags, APP-ADM-005 exception routing, and `Policy #9` / `SOP-MDM-02` investigation context.
- Added Supabase pricing change-log guardrail migration and seed change-log rows for initial Policy #9 / SOP-MDM-02 pricing rules.
- Added Supabase run-day cadence guardrail migration for Tuesday/Thursday pickup request and compiled run dates.
- Added Supabase pickup request retention queue migration for the confirmed Policy #5 7-year run-date retention rule.
- Added Supabase supplier/master-data retention queue migration for closed supplier relationship records and master-data change logs.
- Added Supabase notification-failure exception routing migration for failed operational and billing notice records.
- Added route-aware app entry intent for Admin, Driver, Client tracking, Client booking, and Client portal routes.

## Remaining Build Gaps Added By The Journey Check

- Exact customer-visible tracking status taxonomy remains open.
- Secure public tracking token model remains open; current tracking is authenticated and account-scoped.
- Notification provider and channels remain open; current build records local outbox rows only and does not send email, SMS, or in-app notifications.
- Production PDF/email invoice rendering, exact external invoice template, actual email dispatch, bounce handling, and export remain open.
- Production next-period treatment for already-invoiced unmatched account corrections remains open until the accounting handoff is confirmed.
- Production payment confirmation source remains open.
- External accountant/BAS handoff and Otimi Rules reporting cadence, format, recipient, and delivery method remain open.
- Driver legal verification, multi-driver expansion, and external-courier/per-run employment-payment model evidence remain HCM open items outside this logistics build.
- Production retention destruction/review authority remains open because the Privacy Owner is unnamed.
- Live Supabase audit hash-chain/RLS testing remains open because the MCP project is authenticated but live migration/RLS execution has not been run.
- Production RLS for actor/contact/event/obligation CRM writes and access-role enforcement now has a first-pass source-backed migration, but remains unproven because live Supabase Auth identities and policy execution are not connected.
- Production supplier review cadence ownership, live Supabase monitoring execution, and external Admin alert delivery remain open.
- Production run compilation automation, route optimisation, live APP-FLT-001 expiry monitoring, and external vehicle/insurance integrations remain open.
- Whether Admin can directly apply approved price changes in production remains open because source material and user direction need final reconciliation.
- Live Supabase execution for pricing governance flags remains open because the MCP project is authenticated but live migration/RLS execution has not been run.
- Driver offline/upload retry rules are not confirmed.
- SOP-RUN-04 Bring Forward now records early collection of a future pickup only where the supplier is already on today's route, keeps the intended delivery run date unchanged, and records local operational update evidence; production notification handling remains open.
- Failed Delivery has local Policy #8 attempt/evidence, Admin fee-review, waiver, and approved-fee billing behavior, but final production reason codes and offline retry handling remain open.
- Supplier pickup standards and CAP-MCL-001 approval-gate evidence are locally implemented, but actual named supplier dock contacts, live supplier-health automation, and the exact scoring algorithm beyond CAP-MCL-001 thresholds remain open.
- Policy #27 WHS/fatigue is locally implemented for active Driver/Admin hazard reporting and supplier follow-up, but WHSQ notification procedure, production WHS owner, and full fatigue framework activation remain open.
