# Release One Source Map

Last updated: 2026-06-19

This file records implementation rules extracted from source material. It is not legal copy and must not be published as customer-facing terms.

## Uploaded User Journeys

Sources:

- `customer journey.zip/UJ-CRM-001A-ClientOperationalContactJourney.json`
- `customer journey.zip/UJ-CRM-001B-ClientBillingContactJourney.json`
- `customer journey.zip/UJ-ADM-001-AdminJourney.json`
- `customer journey.zip/UJ-DRV-001-DriverJourney.json`

Confirmed journey actors:

- Client Operational Contact: registration, pending activation, first login/supplier setup, pickup request, tracking, and dispute.
- Client Billing Contact: invoice email, EFT payment, invoice dispute, overdue notice, suspension notification, and reinstatement notification.
- Admin: OTP login, exception queue, billing review, invoice preview, overdue/suspension handling, supplier master data, and pricing governance.
- Driver: OTP login, run brief, pre-trip check, supplier pickup, no-pickup, bring-forward, delivery, failed delivery, POD, and run close.

Implementation note:

- Current local build only partially covers these journeys. See `customer-journey-comparison.md` for stage-by-stage coverage.

## AI Use Governance

Source:

- `Policy-20-AIUsePolicy.docx`

Confirmed rules:

- Release-one AI governance recognises three agents only: `AGT-CS-001b` Customer Success AI, `AGT-SRM-001b` Supplier CTA Agent, and `AGT-ADM-007b` CTA Drafting Agent.
- AI use is on-demand only and Admin-triggered.
- AI cannot send messages autonomously.
- Admin must review, edit, reject, or approve every AI output.
- No batch approval of unread AI messages is permitted.
- AI cannot make commercial, pricing, account, suspension, or legal decisions.
- All AI interactions must be logged.

Local runtime state:

- Admin now has a `Policy #20 AI Draft Review Gate` tab that creates local draft CTA records from flagged CRM, supplier, and APP-ADM-005 exception records.
- Drafts enter `Draft Pending Admin Review`, must be opened by Admin, and require an Admin review note before they can become `Approved - Not Sent` or `Rejected`.
- Approved drafts remain `not_sent_provider_not_configured`; the local app does not send them.
- Duplicate unread draft creation is blocked per agent/target so an unread draft cannot be quietly batch-approved or bypassed.
- APP-PRV-004 audit rows are written when a Policy #20 draft is requested and when Admin reviews it.
- Supabase draft migration `202606190024_ai_use_policy20.sql` adds Admin-only `ai_draft_reviews`, approved-agent constraints, Admin-review evidence constraints, no-autonomous-send checks, no-batch-approval checks, no-commercial-decision checks, and PII audit logging.

Open gaps:

- Live AI provider, model, prompt registry, prompt/version approval, and agent orchestration are not confirmed.
- Production outbound send channel and evidence write-back are not confirmed.
- Final review authority for production AI prompts and generated message templates is not confirmed.
- The local draft text is a placeholder review record, not a connected AI model response.

## Customer Registration And Account Setup

Sources:

- `SOP-IAM-01-CustomerAccessRegistration.xlsx`
- `SOP-CUS-01-CustomerAccountSetup.xlsx`

Confirmed rules:

- Registration required fields: business name, Operational Contact name and email, Billing Contact name and email, delivery address, and at least one approved supplier selection.
- Collection Notice acknowledgement is required before registration can complete.
- Consent record stores identity, notice version, and timestamp.
- New account status starts as `Pending`; order submission is not active until Admin activation.
- Admin reviews eligibility before activation.
- Eligibility criteria include B2B, SEQ service area, and approved supplier.
- Operational Contact and Billing Contact must both have real names and working email addresses before activation.
- The same person can be both contacts if explicitly recorded.
- Order submission is blocked until at least one approved supplier is linked.
- Delivery address must be a physical address in the SEQ service area, not a PO box.
- Account data object includes `account_id`, `business_name`, `delivery_address`, `linked_suppliers`, `status`, `operational_contact`, and `billing_contact`.
- Client account retention: duration of relationship + 7 years.

## Pickup Request And Cut-Off

Sources:

- `SOP-REQ-01-SubmitPickupRequest.xlsx`
- `SOP-REQ-02-CutOffHandling.xlsx`

Confirmed rules:

- Client Operational Contact logs in before submitting a pickup request.
- Request form shows only approved suppliers linked to the account.
- Request fields from source: supplier, requested run date, notes.
- Required fields must be enforced by the portal.
- Cut-off is 12:30pm Brisbane time for the requested run date.
- If submitted before cut-off, the work item is created for the requested date.
- If submitted after cut-off, the work item is created for the next available run date.
- Local runtime now resolves adjusted work to the next available Tuesday/Thursday run date and records `schedule_adjusted` evidence when the requested and actual dates differ.
- Requested date is retained for reference when adjusted.
- `cut_off_applied=true` is stored when adjusted.
- Client Operational Contact is automatically notified if the date is adjusted.
- Admin is alerted if work item creation fails, notification fails, or no next available run date exists.
- Notification failure routing now treats explicit `failed` delivery status as APP-ADM-005 exception material. `provider_not_configured` remains a deployment gap until a production notification provider/channel is confirmed.
- Suspended accounts can log in but order submission is blocked.
- Pickup request data object includes `work_item_id`, `account_id`, `supplier_id`, `requested_date`, `actual_run_date`, `notes`, and `status=Pending`.
- Pickup request retention: 7 years from run date.
- Pickup request inserts/actual-run-date updates now queue a Policy #5 retention review row from actual run date in the Supabase draft migration.

## Order Cancellation

Source:

- `Policy-14-OrderCancellation.docx`

Confirmed rules:

- Client Operational Contact can cancel through the portal before the 12:30pm Brisbane cut-off on the day before the scheduled run date.
- Post-cut-off cancellation requires Admin judgement before the order is cancelled.
- Once goods have been collected, the order cannot be cancelled; refusal or non-receipt follows Failed Delivery handling.
- Orders cancelled before goods collection do not create a billable record.
- Local runtime now exposes client self-service cancellation when before cut-off, client post-cut-off cancellation review requests, Admin APP-ADM-005 review/acceptance, `order_cancelled` and `cancellation_requested` operational notice records, and APP-PRV-004 audit evidence.

Implementation gap:

- Production notification delivery for cancellation/request updates remains unbuilt until the notification provider/channel is confirmed.

## Failed Delivery And Redelivery Fee

Source:

- `Policy-08-FailedDelivery.docx`

Confirmed rules:

- Driver records every failed delivery attempt in APP-DRV-003 with date/time, reason, and driver identifier.
- Maximum delivery attempts per consignment is 2.
- After the first failed attempt, goods remain with the driver and no redelivery fee is charged.
- A discretionary same-run reattempt may occur only if practical; it is not an obligation.
- After the second failed attempt, goods return to the originating supplier on the next scheduled milk run.
- APP-ADM-004 generates a $10 flat redelivery fee only after the second failed attempt.
- Admin must review the failed-delivery records before applying the fee.
- Admin may waive the fee in exceptional circumstances and must record the waiver reason.
- Local runtime now records failed-delivery attempt count/evidence, schedules the second attempt for the next available run after attempt one, exposes Admin fee approve/waive review after attempt two, includes approved Policy #8 fees on the next draft invoice, and records APP-PRV-004 audit evidence.

Implementation gaps:

- Production reason-code taxonomy and offline/upload retry handling remain unconfirmed.
- Production notification delivery after each failed attempt remains unbuilt until the notification provider/channel is confirmed.
- Live Supabase execution of the Policy #8 columns and guardrails remains untested until the project is connected.

## Network And Supplier Access

Source:

- `CAP-MCL-001-NetworkSupplierAccess.docx`

Confirmed rules:

- The approved pickup network has six Preferred, Active suppliers: Link International, A1 Accessories, McLeods, Gas Imports, Ficeda, and Whites Powersports.
- `POL-MCL-001-001` states that no supplier is added to the approved pickup network without Admin confirmation that dock access, packaging standards, and pickup window have been agreed in writing.
- The 2026-2028 charter target is that every approved supplier has a documented current dock access arrangement, named dock contact, agreed packaging standards, and confirmed pickup window on file.
- Named supplier Logistics/Dock Contact individuals are explicitly unresolved in the source material.
- `APP-SRM-001a` monitors pickup success rate, no-pickup count, and contact recency; formal health score definition remains open.

Local runtime state:

- Admin Suppliers now includes a `POL-MCL-001-001 Supplier Approval Gate` with dock-access, packaging-standards, pickup-window, and written-evidence fields.
- Active supplier save/reactivation is blocked locally unless the approval gate evidence is complete.
- Supplier cards and exception investigations now surface named dock contact status and approval evidence.
- The six source-approved suppliers remain active from the CAP-MCL-001 current network, while named dock contact names remain blank and flagged until Admin records the real people.
- Supabase draft migration `202606190016_supplier_approval_gate_cap_mcl001.sql` adds matching supplier approval fields and an active-supplier approval-gate constraint.

Open gaps:

- The actual named supplier dock contacts are not provided.
- Final APP-SRM-001a health score algorithm and live monitoring cadence are not specified.
- Live Supabase execution and production exception automation remain untested until the project is connected.

## Supplier Master Data

Source:

- `SOP-MDM-01-SupplierMasterDataMaintenance.xlsx`

Confirmed rules:

- Supplier records are Admin-managed.
- Supplier record fields include `supplier_id`, `name`, `dock_address`, `dock_contact_role`, `pickup_window`, `packaging_notes`, `status`, and `last_reviewed`.
- Supplier changes are logged automatically to the master data audit trail.
- Master data change log fields include `admin_id`, `supplier_id`, `changed_field`, `old_value`, `new_value`, `changed_at`, and `reason`.
- Supplier staleness monitoring flags suppliers where `last_reviewed` is outside the review interval.
- Stale supplier flags go to the Admin exception queue.
- Supplier record retention: duration of supplier relationship + 7 years.
- Master data change log retention: 7 years from change date.
- Closed supplier actor records now queue relationship-end + 7-year retention review rows in the Supabase draft migration.
- Master data change rows now queue change-date + 7-year retention review rows in the Supabase draft migration.

## Goods Acceptance

Source:

- `Policy-15-GoodsAcceptance.docx`

Confirmed rules:

- Goods must be labelled with customer name and con note reference before the driver accepts them.
- Goods must be appropriately packaged for item type and safe to transport without risk of damage or spillage.
- Tyres must be upright or stacked, secured, not loose, and not presented flat or rolling freely.
- Batteries must have correct hazardous-goods containment.
- Parts and accessories must be boxed or bagged, labelled, and contained together.
- The driver may refuse goods that do not meet acceptance standards using reasonable judgement.
- Refused goods are recorded as APP-DRV-002 `No Pickup` with reason and must never create a billable row.
- The driver must not accept goods under protest or with a note to follow up later; the dock decision is final for that run.
- Packaging refusal patterns feed APP-SRM-001a supplier health alerts to Admin.

Local runtime state:

- Driver pickup confirmation now requires Policy #15 item-specific acceptance evidence and final dock-decision/no-under-protest confirmation before `Picked Up` can be recorded.
- Driver No Pickup records now carry Policy #15 / Policy #16 source evidence, final dock decision evidence, no-billable-row evidence, and APP-ADM-005 exception routing.
- SOP-RUN-04 brought-forward pickup records also carry Policy #15 goods-acceptance evidence while retaining the original intended run date.
- Supabase draft migration `202606190017_goods_acceptance_policy15.sql` adds matching goods-acceptance confirmation, final-decision, refused-goods, and policy-reference fields.

Open gaps:

- Policy #15 is marked Draft/Awaiting Review in the source.
- Approved public Dangerous Goods Policy copy remains unavailable; `/legal` must keep it unpublished until approved.

## Vendor Pickup Standards

Source:

- `Policy-16-VendorPickupStandards.docx`

Related controls:

- `APP-DRV-002`
- `APP-ADM-005`
- `APP-SRM-001a`
- `CAP-MCL-001`

Confirmed rules:

- Supplier goods must be ready at the supplier dock by 10:00am on the scheduled run date.
- Suppliers are not notified on the day of pickup; night-before run preparation belongs to `APP-ADM-002` / `pg_cron`.
- Goods must be labelled with customer name and con note.
- Tyres must be upright or stacked, secured, and not loose.
- Batteries must use correct hazardous-goods packaging.
- Parts and accessories must be boxed or bagged and labelled, not loose.
- Driver may refuse goods that are unlabelled or improperly packaged.
- SOP-PUP-03 also treats supplier refusal and wrong items presented as valid `No Pickup` reasons.
- Driver records refused goods as `No Pickup` in `APP-DRV-002`.
- Driver grace period is maximum 10 minutes; driver may leave earlier where other stop timing would be jeopardised and must record the reason.
- `No Pickup` is recorded per customer, never per supplier.
- `No Pickup` never creates a billable item row.
- `APP-ADM-005` flags No Pickup exceptions for Admin.
- Repeated supplier pattern triggers supplier health review through `APP-SRM-001a`.
- CAP-MCL-001 supplier-health targets include No Pickup rate below 5 percent per supplier/month, packaging refusal rate declining toward zero, and Admin review of patterns within 5 business days.

Local runtime state:

- Driver pickup confirmation now captures Policy #16 evidence: ready by 10:00am, labelled, packaged, grace minutes, and compliance note.
- Driver `No Pickup` now requires a SOP-PUP-03 / Policy #16 category, reason, grace minutes, and optional handling note.
- Local No Pickup categories cover goods not ready after the 10-minute grace period, unlabelled or con-note mismatch, improper packaging, supplier refused pickup, wrong items presented, time constraint, and WHS hazard at supplier premises.
- Local `No Pickup` evidence records no billable pickup line and routes an APP-ADM-005 exception.
- Admin Suppliers now includes a Pickup Standards Monitor with No Pickup rate, packaging/label refusal count, APP-ADM-005 queueing, and Policy #16 investigation context.
- Supabase draft migrations add Policy #16 pickup standards fields and SOP-PUP-03 category constraints to `pickup_requests`.

Open gaps:

- Named dock contacts are not confirmed in the source material.
- The exact supplier health scoring algorithm beyond the CAP-MCL-001 targets is not specified.
- Production `APP-ADM-002` night-before automation, live `pg_cron`, and live supplier-health monitoring remain untested until Supabase is connected.

## Confirm Customer Pickup

Source:

- `SOP-PUP-02-ConfirmCustomerPickup.xlsx`

Confirmed rules:

- Driver confirms successful customer pickup at the supplier stop.
- Pickup outcome is recorded per customer, not at supplier-stop aggregate level.
- The system shows all customers who ordered from the supplier on the day's run.
- Driver must not create an ad-hoc customer record at the dock; missing or incorrect customer list issues go to Admin.
- Goods are verified against acceptance standards before acceptance.
- Item type and quantity are captured for server-side price calculation from `price_rules`.
- Driver cannot override the calculated price.
- `No Pickup` creates no billable row.
- The pickup record must be complete before the driver leaves the supplier dock.
- Supplier dock contact is engaged professionally on every visit.
- Completion standard is that every customer at the supplier stop has `Picked Up`, `No Pickup`, or `Brought Forward` outcome evidence before the driver leaves.

Local runtime state:

- Driver supplier stops now remain open after individual customer outcomes until the supplier stop is explicitly closed.
- The Driver pickup tab shows per-supplier counts for Picked Up, No Pickup, Brought Forward, and outstanding customer outcomes.
- `Close Supplier Stop` is blocked until every customer at that supplier has a recorded outcome.
- Supplier-stop closeout records correct dock confirmation, customer-list review, no-ad-hoc-record confirmation, dock-contact engagement, leave-dock confirmation, outcome summary, driver, timestamp, and optional closeout note.
- Driver delivery start is blocked until all current supplier stops have SOP-PUP-02 closeout evidence.

Supabase draft state:

- `202606190029_supplier_stop_closeout_sop_pup02.sql` adds supplier-stop closeout fields and guardrails to `pickup_requests`, including delivered-status protection for new writes.

Open gaps:

- The decisions register confirms `time_constraint` as a valid No Pickup reason. The runtime and superseding Supabase draft migration include that category.
- Production route optimisation, offline handling, and live Supabase execution/testing remain unconfirmed.

## Bring Future Pickup Into Today

Source:

- `SOP-RUN-04-BringForwardPickup.xlsx`

Confirmed rules:

- Bring-forward means collecting goods for a future pickup today because the supplier is already on today's planned route.
- The driver must not make an unscheduled detour for a bring-forward.
- Bring-forward is a distinct pickup outcome, not a standard `Picked Up` outcome.
- The driver records item type and quantity as normal.
- Pickup date is today/current route date.
- Intended delivery run date remains the original future run date.
- Goods must be correctly labelled and packaged before the driver accepts them.
- The record must clearly distinguish brought-forward goods to avoid billing confusion.

Local runtime state:

- Driver supplier stops now show a `SOP-RUN-04 Future Pickups Ready Today` section only for future unassigned pickups at suppliers already on the current planned route.
- The current-run customer pickup rows no longer expose Bring Forward as a way to postpone an unready pickup.
- The Bring Forward modal records item type, quantity, calculated price, no-unscheduled-detour confirmation, labelling confirmation, packaging confirmation, collected date, intended run date, and handling note.
- The brought-forward order remains unassigned for Admin compilation on its original intended run date, then appears as delivery-ready because the pickup evidence has already been captured.
- Local operational updates say the future pickup was collected early and that the intended delivery run remains unchanged.
- Browser smoke on 2026-06-19 confirmed the Driver dashboard shows the Link International `SOP-RUN-04 Future Pickups Ready Today` action, opens the brought-forward capture modal, blocks incomplete capture with `Outcome reason is required.`, accepts reason plus no-detour/labelling/packaging evidence, removes the candidate after capture, and returns the browser to clean seeded `/booking` state after reset.

Supabase draft state:

- `202606190014_bring_forward_sop_run04.sql` adds bring-forward flag, collected date, intended run date, no-detour confirmation, acceptance confirmation, and SOP-RUN-04 constraints to `pickup_requests` and `pickups`.

Open gaps:

- Production notification delivery for early pickup updates remains unbuilt until the notification provider/channel is confirmed.

## Pricing

Sources:

- `Policy-09-PricingSchedule.docx`
- `SOP-MDM-02-CourierItemPricingMasterData.xlsx`

Confirmed rules:

- Pricing source of truth is Policy #9 and `SOP-MDM-02`.
- Prices are in AUD excluding GST.
- Prices are calculated server-side by `APP-DRV-002` using `price_rules`.
- Driver selects item type and quantity or weight band.
- Driver cannot override, modify, or manually enter a price.
- Pricing changes require written approval from both Admin and Owner.
- Pricing changes must be logged before they take effect.
- `price_rules` changes must reference a change log entry.
- Runtime `price_rules` rows must reference a pricing change-log record with written reason and Owner approval evidence before taking effect.
- Unlogged pricing changes are immediate Admin alerts.

Current pricing tiers:

- Tyre Delivery, 1 tyre: $25.00.
- Tyre Delivery, 2 tyres: $40.00.
- Tyre Delivery, 3 tyres: $55.00.
- Tyre Delivery, 4 or more tyres: $12.00 each.
- Parts Delivery, less than 5 kg: $15.00.
- Parts Delivery, 5 kg to 15 kg: $22.00.
- Parts Delivery, more than 15 kg: $35.00.
- Redelivery fee after 2nd failed attempt: $10.00.

Implementation gap:

- User confirmed Admin should be able to update pricing rules, while source material says Digiverse implements approved `price_rules` changes after Admin and Owner approval. Release one should model the approval/change-log process and keep direct production update authority as a deployment decision.

## Billing Compilation And Unmatched Accounts

Sources:

- `SOP-BIL-04-CreateSendInvoice.xlsx`
- `SOP-EXC-03-UnmatchedBillingAccountException.xlsx`

Confirmed rules:

- Invoice generation starts from an approved billing group.
- Admin confirms the rendered invoice is correct.
- The system dispatches the invoice to the Billing Contact from that same confirmation action.
- `invoice_id` is written back to billed jobs.
- Payment monitoring starts after invoice dispatch.
- During billing compilation, the system flags jobs where `account_id` is null, unknown, inactive, or has multiple possible matches.
- Flagged jobs are excluded from the billing group and added to the APP-ADM-005 exception queue.
- Admin investigates using POD proof and pickup capture evidence: delivery address, con note/order reference, supplier, and delivery date.
- Admin updates the job with the correct `account_id` before the job enters the correct billing group.
- If a job was already invoiced, the original invoice is not retro-modified; the correction is handled in the next billing period with a note.

Local runtime state:

- Admin Billing now excludes unmatched billing account candidates from draft invoice groups.
- Draft invoice creation records the approved billing group evidence.
- Admin Billing now requires rendered invoice correctness confirmation with an Admin review note; dispatch is recorded automatically from that confirmation action.
- Payment evidence and overdue monitoring are blocked locally until dispatch evidence exists.
- Admin Billing shows an Unmatched Billing Account Queue with reason, supplier, con note, run date, delivery address, proof link, and candidate account names.
- The local system scan queues APP-ADM-005 `Unmatched Billing Account` exceptions for current billing candidates that fail the account match.
- Admin can correct the account match only to an active client account and must record an investigation note before the work returns to billing eligibility.
- Closing the account-match correction writes local order state, exception investigation evidence, and APP-PRV-004 audit evidence.
- Supabase draft migration `202606190009_unmatched_billing_account_exceptions.sql` adds billing-account match state, exception queueing, and an Admin-only correction function that refuses already-invoiced retro-modification.
- Supabase draft migration `202606190010_invoice_approval_gate_sop_bil04.sql` adds invoice approval evidence fields, an Admin-only approval function, and guardrails requiring approval before dispatch/payment-monitoring states. The active runtime uses the decisions-register single confirmation/dispatch action.

Open gaps:

- Production invoice PDF/email rendering, provider dispatch, bounce handling, payment source, and accounting export/reconciliation remain unconfirmed.
- The production next-period treatment workflow for already-invoiced account corrections is not built until the accounting path is confirmed.

## Revenue Reporting And Financial Controls

Source:

- `Policy-24-RevenueReportingFinancialControls.docx`

Confirmed rules:

- Revenue is recorded through the APP-ADM-003/004 billing pipeline.
- Off-system invoices are not permitted without Admin approval and documented evidence.
- Admin reconciles APP-ADM-004 invoice records against payment received records at month end.
- Month-end reconciliation is due within 5 business days of month end.
- Invoice, payment, and reconciliation records are retained for at least 7 years.
- GST applies to all invoices.
- BAS/tax reporting requires an external accountant.
- Otimi Rules portfolio reporting requires monthly revenue, accounts-receivable balance, days sales outstanding, and material financial events.

Local runtime state:

- Admin Billing now includes `Policy #24 Month-End Financial Controls`.
- The local workflow groups invoices by financial month, calculates month end, reconciliation due date, invoice total, GST, paid/unpaid totals, overdue invoice count, and open/completed status.
- Admin must confirm no off-system revenue before recording reconciliation evidence.
- Admin must enter a reconciliation note before the period can be marked completed.
- The local record keeps external accountant and Otimi Rules reporting cadence/format gaps visible instead of claiming they are configured.
- Completed Policy #24 reconciliation records appear in the Admin retention register with a 7-year retention window from completion.
- APP-PRV-004 audit records `Financial reconciliation recorded` when Admin saves the evidence.

Supabase draft state:

- `202606190020_revenue_reporting_financial_controls_policy24.sql` adds `financial_reconciliations` and `financial_reconciliation_invoices`.
- The draft migration calculates the 5-business-day due date, requires no-off-system-revenue confirmation and Admin note before completed status, queues 7-year retention review rows, and restricts records to Admin through RLS.

Open gaps:

- The external accountant is not named.
- BAS lodgement/handoff is not implemented.
- Otimi Rules reporting cadence, format, recipient, and delivery method are not confirmed.
- Live Supabase execution and RLS testing for the Policy #24 migration remain blocked until the project is connected.

## Delivery Stop Grouping

Source:

- `SOP-DEL-01-DeliveryStopGrouping.xlsx`

Confirmed rules:

- Delivery stops are grouped by client account and delivery address.
- If multiple work items for the same account go to the same address, they appear as one delivery stop.
- One receiver name and signature covers all items at that delivery location.
- Driver reviews the grouped stop list before departing for deliveries.
- Missing or incorrect grouped stops must be raised before departure.

Local runtime state:

- Driver Delivery now renders grouped delivery stops rather than separate sign-off cards for each order.
- The grouped stop displays all work items, suppliers, con notes, pickup-captured item/price evidence, and the stop total.
- Starting a grouped delivery updates every work item in the delivery stop together with `SOP-DEL-01` group evidence.
- One POD receiver name and signature creates a grouped proof record and the system completes every work item in the stop under `SOP-DEL-01 / SOP-DEL-05`.
- A grouped failed-delivery action records Policy #8 attempt evidence and Admin exceptions for each work item in the delivery stop.
- Supabase draft migration `202606190011_delivery_stop_grouping_sop_del01.sql` adds delivery stop groups and extends proof-driven completion for grouped stops.

Open gaps:

- Live Supabase execution of grouped-stop proof completion is untested until the project is connected.
- Production route optimisation remains separate from source-confirmed grouping by account and address.

## Delivery Proof

Sources:

- `SOP-DEL-04-DeliverySignOffProof.xlsx`
- User confirmation on 2026-06-18.

Confirmed rules:

- Driver sees delivery stops for the assigned run.
- Stop view pre-fills customer name, address, and expected items.
- Receiver name is required.
- Receiver signature is required.
- Receiver name and signature are required before `Delivered` status can be set.
- Before proof capture, the driver must confirm the physical address matches the registered delivery address.
- Before proof capture, the driver must confirm goods match the picked-up items for the client account.
- An authorised receiver must be present and goods must be handed over before POD capture.
- Delivery price is read-only from pickup item data and cannot be overridden by the driver.
- Receiver name must be the actual receiver full name, not a generic placeholder.
- Driver must supervise signature capture and keep the device in sight.
- `delivery_proof.receiver_name` is not nullable.
- Signature image is uploaded to private Supabase Storage.
- Signature path or URL is stored in `delivery_proof`.
- Release-one production storage path convention is `deliveries/{delivery_id}/signature.{ext}` in the private `delivery-proof` bucket.
- Only Admin or the Driver assigned to the delivery run can upload proof objects under that controlled path.
- Signature path or URL is not nullable.
- GPS is not required.
- Receiver name and signature are immutable after delivery completion.
- Receiver name and signature retention: 7 years from delivery date.
- Delivery proof inserts queue a retention review row for the 7-year Policy #5 window.
- Access to proof records is restricted to Admin and dispute resolution processes.

Local runtime state:

- Driver grouped delivery sign-off is now a gated SOP-DEL-04 workflow, not a static workflow display.
- Step 1 requires the driver to confirm registered address match, goods match, authorised receiver, handover, and read-only price review before proof capture opens.
- If the read-only price appears incorrect, Driver can report a SOP-DEL-04 price discrepancy from sign-off; this opens Failed Delivery evidence with the controlled `price_discrepancy` category and blocks delivery completion.
- Step 2 requires receiver full name, receiver signature, and device-supervision confirmation before the proof can be stored.
- Generic receiver placeholders such as `receiver`, `customer`, `workshop`, `unknown`, or `n/a` are blocked.
- Failed Delivery uses source-backed SOP-DEL-04 categories: receiver absent, address wrong or unconfirmed, goods cannot be confirmed for the client account, delivery refused, receiver name refused, receiver signature refused, and price discrepancy.
- Completed work items retain the SOP-DEL-04 sign-off evidence flags with the proof and delivery completion audit trail.
- Supabase draft migration `202606190030_delivery_signoff_sop_del04.sql` adds proof sign-off fields, a proof sign-off constraint, failed-delivery category columns, and a failed-delivery category constraint.

TBD:

- Whether POD photos are optional, conditionally required, or out of release one.
- Production device model, offline retry behavior, and hardware/support assumptions for signature capture.
- Live upload transport: direct browser upload, signed upload URL, or server/RPC mediated upload.
- Broader production reason-code governance beyond the SOP-DEL-04 failed-delivery categories.

## Delivery Completion

Source:

- `SOP-DEL-05-DeliveryCompletion.xlsx`

Related controls:

- `SOP-DEL-04`
- `APP-DRV-003`
- `APP-ADM-004`
- `APP-PRV-004`
- `CAP-MCL-004`

Confirmed rules:

- Driver captures receiver name and signature before delivery completion.
- Driver does not manually set Delivered status.
- After delivery proof is inserted, the system sets job status to `Delivered` with a server-side timestamp.
- Delivery proof record is immutable after completion.
- Audit event is written for delivery completion.
- Proof-backed delivered job is immediately visible to billing compilation for month-end Admin review.
- If proof insert succeeds but Delivered status write fails, Admin must be alerted because billing will not include the job until corrected.

Local runtime state:

- Driver POD capture now creates a delivery proof record; local system completion then sets the order to Delivered, links proof ID, writes receiver/signature/price evidence, marks the job billing-ready, writes a delivered customer update, and writes APP-PRV-004 audit evidence.
- Admin order status shortcut now blocks manually setting Delivered or changing away from Delivered after proof completion.
- Admin Billing Review now requires a proof-linked Delivered order before it appears in delivered unbilled work.
- Supabase draft migration adds `delivery_proof` after-insert completion trigger, delivery billing-ready fields, and a guard blocking direct `delivered` status writes outside the SOP-DEL-05 trigger path.

Open gaps:

- Live Supabase trigger execution is untested until the project is connected.
- Production correction workflow for wrong proof/customer selection remains Admin/technology-partner exception handling; the exact local production UI for that exception is not confirmed.

## Run Close Confirmation

Source:

- `customer journey.zip/UJ-DRV-001-DriverJourney.json`, stage S5.

Confirmed rules:

- Driver can close the run only after all pickup and delivery stops have a terminal outcome.
- Run close is disabled while any stop remains Pending or En Route.
- Run summary shows total pickups, deliveries, no-pickups, failed deliveries, and open exceptions.
- The closed confirmation says the run is complete and no further driver action is required unless action items are listed.
- Retained goods, second-attempt, and return-to-supplier action items must remain visible after close.
- Delivered jobs are available to billing compilation after proof-driven completion.

Local runtime state:

- Driver Run Close now shows the UJ-DRV-001 S5 confirmation text `Run complete. Good work.` after close.
- The local close record stores pickup, delivered, no-pickup, failed-delivery, retained-goods, second-attempt, return-to-supplier, and action-item evidence.
- Admin Run Close Review shows the same action-item evidence with linked POD proof/open-exception context.
- Supabase draft migration `202606190031_run_close_confirmation_uj_drv001.sql` adds explicit run-close confirmation/action-item fields and a retained-goods reconciliation check.
- Browser smoke verification covered Driver No Pickup, SOP-DEL-04 price-discrepancy failed delivery, Driver close confirmation/action items, Admin run-close review, reset to `/booking`, and zero console errors.

Open gaps:

- Production close confirmation delivery outside the app remains unbuilt until the notification provider/channel is confirmed.
- Production accounting handoff after run close remains governed by the billing/accounting blockers.

## Delivery Dispute And Complaint

Source:

- `Policy-18-DeliveryDispute.docx`

Related controls:

- `APP-DRV-003`
- `APP-DRV-002`
- `APP-ADM-004`
- `APP-ADM-005`

Confirmed rules:

- Client may raise a delivery dispute through Admin.
- Client must provide an order reference or con note, the delivery date in question, and a description of the issue.
- Confirmed dispute categories are goods not received, wrong goods, goods damaged, and incorrect charge.
- Disputes should be raised within 14 days of the relevant invoice date.
- Disputes raised more than 30 days after the invoice date may not be actionable.
- Admin investigates delivery disputes using `APP-DRV-003` proof records: receiver name, signature, proof image/path, and delivery timestamp.
- Admin investigates incorrect-charge disputes using `APP-DRV-002` pickup capture and `APP-ADM-004` invoice evidence.
- Admin aims to acknowledge disputes within 2 business days and resolve within 10 business days.
- If delivery error is confirmed, remedy is provided at no cost.
- If billing error is confirmed, Admin issues a credit note or corrected invoice within 5 business days of confirmation.
- Admin records the outcome against the relevant order record.
- If the client is not satisfied, they may request escalation to Owner; Owner decision is final.

Local runtime state:

- Client Operational delivery disputes now require dispute type, delivery date in question, and description before creating the Admin exception.
- Client Operational and Client Billing incorrect-charge disputes require an invoice line/order reference, delivery date in question, and description before creating the Admin exception.
- Local dispute exceptions carry Policy #18 reason, delivery date, linked invoice/order, invoice timing, 14-day/30-day timing label, received/acknowledged timestamps, and Owner escalation state. Admin SLA monitoring is outside the logistics portal.
- Admin APP-ADM-005 queue can record acknowledgement without closing the dispute, escalate a dispute to Owner, and investigate/close with linked invoice, work item, POD proof, pickup/pricing, Policy #18 timing context, and a controlled Policy #18 finding.
- Closing a Policy #18 investigation now records the outcome back against linked local work items and invoices, including outcome, note, finding, timing, acknowledgement, Owner escalation state, remedy requirement, remedy note, and investigation timestamp.
- Confirmed local delivery-error findings create a no-cost remedy requirement. Confirmed local billing-error findings create a credit-note or corrected-invoice obligation due 5 business days from confirmation, without claiming the external accounting artifact was issued.
- Supabase draft migrations add Policy #18 dispute reason, delivery date, invoice timing, received/acknowledged timestamp, Owner escalation fields, remedy fields, linked work/invoice outcome-history fields, and a superseding trigger that does not calculate Admin SLA due dates.

Open gaps:

- External notification delivery for dispute acknowledgement/resolution remains unbuilt because the notification provider and channel are unconfirmed.
- External credit-note/corrected-invoice issuance and accounting handoff remain unbuilt until Zoho/export/manual reconciliation is confirmed.
- Live Supabase execution and RLS testing for the Policy #18 migration remain blocked until the project is connected.

## Privacy, Access, Audit, And Retention

Sources:

- `Policy-03-PrivacyPolicy.docx`
- `Policy-04-CollectionNotice.docx`
- `Policy-05-DataRetentionDestruction.docx`
- `Policy-07-InformationSecurity.docx`
- `Policy-21-InternalAcceptableUseData.docx`

Confirmed rules:

- Magic link / OTP authentication through Supabase Auth. No static passwords for client or driver access.
- Role-Based Access Control and Row Level Security are required.
- Client Operational Contact, Client Billing Contact, Driver, and Admin can access only the data their role requires.
- Driver app displays only data needed for the assigned run.
- Unassigned driver pool views must not return PII columns.
- Admin grants, modifies, and revokes access roles.
- Staff access is reviewed annually and on departure or role change.
- Audit logging records every PII action via database trigger.
- Audit log is insert-only / append-only.
- Production Digiverse data access must be logged.
- APP 12 access requests are directed to Admin and answered within 30 days.
- APP 13 correction requests are directed to Admin and processed within 30 days.
- Privacy complaints are acknowledged within 5 business days and aimed for resolution within 30 days.
- Access/correction may be refused only on Privacy Act-permitted grounds.
- APP 4 unsolicited personal information must be assessed against APP 3. If it could not have been collected, it must be destroyed or de-identified as soon as practicable.
- No record in a destruction queue is destroyed without Privacy Owner approval.
- Destruction records are retained for 7 years.
- Legal holds override retention destruction.

Local runtime state:

- Admin now has a `Policy #3 / POL-OPS-003 Privacy Request Register` for access requests, correction requests, privacy complaints, and unsolicited-information assessments.
- The register calculates 30-day response due dates for all Policy #3 requests and 5-business-day acknowledgement due dates for privacy complaints.
- The app requires acknowledgement evidence before complaint acknowledgement/resolution, access response evidence before resolving an APP 12 access request, correction action evidence before resolving an APP 13 correction request, and Privacy Act refusal-ground evidence before refusing a request.
- APP 4 unsolicited-information records require APP 3 collection assessment. If destruction/de-identification is requested for information that could not have been collected under APP 3, the app stores the record as `Blocked - Privacy Owner Required` until a named Privacy Owner and approval evidence are recorded.
- APP-PRV-004 audit records are written when Admin records or updates a privacy request.

Supabase draft state:

- `202606190027_privacy_requests_policy3_policy4_policy5.sql` adds `privacy_requests`, 30-day response due dates, 5-business-day complaint acknowledgement due dates, Privacy Act refusal-ground checks, access/correction evidence checks, APP 4 unsolicited-information checks, Policy #4 collection notice version evidence, Policy #5 Privacy Owner destruction/de-identification blocking, Admin-only RLS, and PII audit logging.

Open gaps:

- Privacy Owner is unnamed in source policies.
- Specific retention periods are not fully confirmed.
- Digiverse must confirm TLS, encryption at rest, and Australian Supabase data residency.
- Policy #3 and Policy #4 remain Draft until Privacy Owner approval, ABN/contact details, APP 5 non-collection consequences, APP 6 Digiverse assessment, and Supabase data-location confirmation are completed.

## Account Suspension And Termination

Source:

- `Policy-23-AccountSuspensionTermination.docx`

Confirmed rules:

- Grounds for suspension include non-payment after overdue notice or material conduct breach.
- Admin sets account status to `Suspended`.
- RLS immediately blocks order submission for suspended accounts.
- Suspended clients can log in but cannot place new orders.
- Goods already in transit continue to be delivered.
- Suspension record includes date, reason, and notification sent.
- Admin notifies both Operational Contact and Billing Contact.
- Non-payment suspension requires linked overdue-notice evidence before account suspension can be recorded.
- Conduct suspension requires Admin notice evidence and evidence that the breach was not remedied.
- Payment arrangement reinstatement requires agreed payment date, agreed amount, agreeing contact name/role, and written evidence reference.
- Reinstatement notification is automatic on the Admin reinstatement action.
- Voluntary account termination requires client closure-request evidence.
- Conduct termination requires a prior conduct suspension record, Owner consultation evidence, written termination notice evidence, reason, and effective date.
- Repeated non-payment termination is blocked because the debt recovery escalation path and write-off thresholds are not confirmed.
- Existing outstanding invoices remain payable after termination.
- Policy #5 retention applies after account termination; data is not destroyed immediately.

Local runtime state:

- The local runtime scans overdue invoices and creates a local Day 8 overdue notice evidence record once the invoice is overdue and the due date plus 8 days has passed.
- The local Day 8 notice record is labelled with generation source so Client Billing Contact, Client Operational Contact, and Admin can distinguish system-generated evidence from an Admin fallback record.
- Admin still has fallback visibility for overdue invoices that do not yet have a Day 8 notice record.
- Non-payment suspension remains blocked until a linked Day 8 overdue notice exists and both Operational and Billing contact notification evidence is recorded.
- Conduct suspension is a controlled Admin workflow with required notice and unremedied-breach evidence.
- Reinstatement captures payment clearance or structured payment-arrangement evidence; the local record marks Operational and Billing contact notification as automatic on the Admin action.
- Account termination is now a controlled Admin workflow for voluntary closure and conduct-breach termination, with exact account-name confirmation, Owner consultation evidence, written notice evidence, local operational/billing account notices, and a permanent `Closed` account state.
- Repeated non-payment termination is visible but blocked in the runtime until the Policy #23 debt recovery gap is resolved.
- Supabase draft migration `202606190008_day8_overdue_notice_generation.sql` adds billing-notice generation fields and a callable local evidence generator. It does not send external notifications.
- Supabase draft migration `202606190028_account_termination_policy23.sql` adds `account_terminations`, account termination notice types, Owner/written-notice evidence guardrails, and a trigger that blocks repeated non-payment termination while the debt recovery escalation gap remains open.

Open gap:

- Debt recovery escalation path for repeated non-payment is not confirmed.
- Production external delivery of Day 8 overdue notices remains unbuilt because the notification provider/channel is unconfirmed.
- Production daily scheduling for the Day 8 generator remains unproven until the live Supabase/project automation setup is confirmed.

## Run Planning And Dispatch

Source:

- `CAP-MCL-002-RunPlanningDispatch.docx`

Confirmed rules:

- APP-ADM-002 is the Run Planning Module.
- Runs are compiled the night before the run date.
- Same-day compilation is not permitted as the structural planning model.
- APP-ADM-002 reads orders that have already passed the 12:30pm Brisbane cut-off gate in APP-ADM-001.
- APP-ADM-002 groups stops by supplier and geography.
- Every milk run must have a named driver and named vehicle before departure.
- APP-FLT-001 checks vehicle registration and insurance at compilation.
- Admin is the escalation gate for exceptions APP-ADM-002 cannot resolve.
- Success measures include compilation completion rate, Admin intervention rate, named driver/vehicle assignment rate, and fleet compliance gate pass rate.
- Target maturity is automated by 2026, with Admin intervention trending toward zero under normal operating conditions.

Local runtime state:

- Admin Dispatch now includes a `CAP-MCL-002 Run Planning Monitor`.
- The monitor shows run compilation completion rate, named assignment rate, fleet gate pass rate, Admin intervention count, night-before compile due date, unassigned stop counts, and queued APP-ADM-002 exceptions.
- Admin can queue a `Run Planning Exception` into APP-ADM-005 for overdue night-before compilation, missing named assignment evidence, or missing fleet gate evidence.
- The local compiler remains manual and transparent; it does not claim live pg_cron automation or production route optimisation.

Supabase draft state:

- `202606190015_run_planning_monitor_cap_mcl002.sql` adds run-planning governance fields for expected compile date, night-before compilation evidence, Admin intervention requirement/reason, and linked APP-ADM-005 run planning exception.

Open gaps:

- Live APP-ADM-002 pg_cron automation is not connected.
- Production route optimisation remains separate from the local supplier/geography deterministic sequencing.
- Production driver pool expansion and future JDD dispatch evaluation remain deferred until a 3-5 casual-driver pool exists.

## Driver Scheduling

Source:

- `Policy-22-DriverScheduling.docx`

Confirmed rules:

- Admin maintains driver availability.
- Driver availability tracking is currently manual.
- Driver unavailability, leave, illness, or personal commitment notice must reach Admin as early as possible and no later than the evening before a scheduled run.
- A driver who cannot perform a run must notify Admin before APP-ADM-002 compiles the run.
- APP-ADM-002 assigns available driver and an Admin-managed fleet vehicle record to each run the night before.
- A run must not depart without a named driver and dispatch-ready vehicle record assigned.
- Current single-driver capacity means an unavailable driver can prevent the run proceeding.
- While single-driver capacity applies, Admin must maintain contingency evidence for driver unavailability.

Local runtime state:

- Admin Drivers now includes a Policy #22 Availability Monitor with blocking unavailable/leave record count, late-notice count, and contingency-gap count.
- Manual unavailable/leave records require a note, driver notice received date, and Admin contingency plan before save.
- Notice due date is calculated as the calendar day before the run date; late notices are accepted into the record and flagged instead of hidden.
- Dispatch and the APP-ADM-002 run compiler read driver availability records and block assignment/compilation when the selected driver is unavailable or on leave for the run date, showing note, notice received date, due date, late-notice state, and contingency evidence.

Supabase draft state:

- `202606190018_driver_scheduling_policy22.sql` adds `notice_received_date`, `notice_due_date`, `late_notice`, `contingency_plan`, and `source_ref` to `driver_availability`, requires Policy #22 evidence for unavailable/leave rows, computes notice due date and late-notice state, and indexes late notices.

Open gaps:

- The exact "evening before" time cut-off is not defined in the source material; local enforcement uses the previous calendar day and flags late notices.
- Daily in-app availability entry versus exception-only availability entry remains a V1 operating decision.
- Multi-driver assignment policy is deferred until the driver pool expands to 3-5 drivers.

## HCM Boundary For Driver Legal And Expansion Sources

Sources preserved for future HCM work:

- `Policy-25-PickupDeliveryExecutionMultiDriver.docx`
- `Policy-26-BillingPaymentCouriers.docx`
- `Policy-13-DriverVerification.docx`
- `Policy-19-DriverCodeOfConduct.docx`
- `SOP-JDD-01-DriverApplicationOnboarding.xlsx`

Corrected logistics boundary:

- Driver legal classification, driver agreements, legal verification evidence, disciplinary/removal consequences, and driver/courier expansion employment-payment models are HCM requirements.
- They are not active logistics runtime requirements, production logistics blockers, or active Supabase logistics migrations.
- Draft runtime and migration work from the earlier implementation has been preserved under `hcm-extract/`.
- The logistics runtime keeps only driver directory account data and Policy #22 availability evidence needed for run assignment.
- If a future HCM system owns driver eligibility, logistics should consume only an approved operational status such as `assignable` or `not_assignable`, not the underlying HCM evidence.

Active logistics state:

- Admin Drivers now provides a Driver Directory for name, email, phone, active/inactive status, review date, notes, change reason, local audit, and local master-data change rows.
- Admin Policy #22 manual availability remains active for unavailable/leave records, notice evidence, late-notice flag, contingency evidence, and dispatch/run-compiler blocking for the affected run date.
- APP-ADM-002 dispatch still requires a named driver and compliant Admin-managed vehicle, but it does not store or adjudicate HCM legal evidence.

## WHS / Fatigue / Driver Wellbeing

Source:

- `Policy-27-WHSFatigueDriverWellbeing.docx`

Related controls:

- `APP-DRV-002`
- `APP-ADM-002`
- `APP-ADM-005`

Confirmed rules:

- Moto & Co must not direct or allow a driver to work where there is an unacceptable WHS risk, including fatigue, an unroadworthy vehicle, or a known supplier-premises hazard.
- Drivers must take reasonable care for their own safety and report hazards, fatigue, near misses, injuries, dangerous occurrences, and unsafe conditions immediately.
- If a driver sees an immediate WHS hazard at supplier premises, the driver must not enter the hazardous area.
- The driver records the supplier stop as APP-DRV-002 `No Pickup` with the WHS hazard reason.
- Admin must log the hazard report, raise it with the supplier, and must not require the driver to return to the supplier premises while the hazard remains unresolved.
- Injury, near-miss, and dangerous-occurrence reports are recorded for Admin review and notifiable-incident assessment.

Local runtime state:

- Driver run issue reporting now includes `Fatigue / Health Concern` and `WHS Incident / Near Miss` outcomes that route to APP-ADM-005 with Policy #27 source evidence.
- Driver No Pickup now includes `WHS hazard at supplier premises`; selecting it records the stop as non-billable, flags `whsHazardReported`, stores the Policy #27 reference, and creates a high-severity APP-ADM-005 `WHS Hazard` exception.
- Admin exception investigation now has Policy #27 evidence prompts for WHS hazards, fatigue/health concerns, WHS incident/near miss reports, and pre-trip defects.
- Admin Supplier Pickup Standards Monitor now counts supplier WHS hazard stops separately and shows the required supplier follow-up and unresolved-return block.

Supabase draft state:

- `202606190019_whs_policy27.sql` adds WHS hazard fields to `pickup_requests`, extends the No Pickup category constraint for `whs_hazard`, adds the Policy #27 unresolved-return check, and indexes WHS hazard stops for Admin follow-up.

Open gaps:

- The WHSQ notifiable-incident procedure is not fully defined in the provided source.
- A formal fatigue framework/risk register remains conditional until driver pool expansion, a WHS incident, or regular fatigue risk is identified.
- Production WHS incident notification ownership and any external regulator reporting workflow must be confirmed before launch.

## Driver Legal, Onboarding, And Conduct Sources

Source documents preserved for future HCM work:

- `Policy-13-DriverVerification.docx`
- `Policy-19-DriverCodeOfConduct.docx`
- `SOP-JDD-01-DriverApplicationOnboarding.xlsx`
- `SOP-IAM-04-StaffRoleAccessManagement.xlsx`

Corrected logistics boundary:

- Driver legal/onboarding/conduct evidence is not implemented in the active logistics runtime.
- The earlier APP-ADM-006/SOP-JDD, Policy #13, and Policy #19 runtime and migration work has been extracted to `hcm-extract/`.
- Driver access in logistics remains limited to assigned-run data, local login/access governance, Driver Directory account status, and Policy #22 availability where it affects run assignment.
- HCM can later define driver eligibility and expose only an approved logistics-facing assignment status.

## Policy #21 / Policy #7 Data Use And Information Security

Sources:

- `Policy-21-InternalAcceptableUseData.docx`
- `Policy-07-InformationSecurity.docx`

Confirmed rules:

- Data is accessed only for the purpose for which it was collected.
- Driver data access is limited to assigned-run data. Pool/unassigned job views must not return PII.
- Admin can access only operational data needed to manage the business.
- Digiverse production data access is limited to maintenance/support and must be logged.
- Personal curiosity, personal gain, unrelated purpose, personal-device storage, unsupported third-party sharing, and marketing use without consent are prohibited.
- Client delivery addresses/contact details/order histories must not be shared with suppliers or external parties without client consent or service-delivery basis.
- Driver personal information must not be shared with clients or suppliers.
- Data access breaches must be reported to Admin immediately and escalated under the privacy/NDB process where required.
- APP-PRV-004 records all PII actions with append-only, tamper-evident audit history.

Local runtime state:

- Admin now has a `Policy #21 / POL-OPS-021 Data Use Register` for operational access decisions, data export requests, Digiverse production access, third-party sharing, marketing use, and data-access breach escalation.
- The register requires requester, data category, purpose, role/RLS basis, and request type before a record is saved.
- The app stores prohibited requests as `Blocked` where they involve personal curiosity/gain/unrelated purpose, personal-device storage, export without Admin approval evidence, marketing without consent, unsupported client-data sharing, driver PI sharing to clients/suppliers, or Digiverse production access without maintenance/support purpose plus production access log and Admin evidence.
- Data-access breach records require immediate Admin escalation evidence and link the operator to the Policy #6 NDB register without letting Admin make Privacy Owner decisions.
- APP-PRV-004 audit records are written when Admin records or updates a data-use decision.

Supabase draft state:

- `202606190026_data_use_policy21_policy7.sql` adds `data_use_reviews`, Admin-only RLS, PII audit trigger, blocked-reason capture, data-export approval checks, marketing consent checks, third-party sharing checks, Digiverse production access-log/Admin-evidence checks, personal-use/personal-device blocks, driver PI sharing blocks, and data-access breach escalation evidence.

Open gaps:

- Live Supabase Auth identity binding and RLS execution remain untested.
- Digiverse production access-log evidence format is not confirmed.
- Australian Supabase region/data residency, TLS, encryption at rest, backup posture, and production access logging confirmations remain open.
- Formal data-processing agreement/security schedule with Digiverse is recommended by source material but not confirmed.
- The Privacy Owner remains unnamed, so breach escalation can be recorded locally but final privacy/NDB ownership remains blocked.

## Policy #6 NDB Response

Source:

- `Policy-06-NDBResponsePlan.docx`

Confirmed rules:

- The NDB response plan is Draft and cannot be Active until the Privacy Owner (ACT-TECH-002) is named.
- Admin is the first point of contact for suspected data breaches and must notify the Privacy Owner immediately once that owner exists.
- Admin and Digiverse take immediate containment action such as access revocation, system isolation, or blocking further unauthorised disclosure.
- APP-PRV-004 audit records are preserved. No audit log records may be deleted or altered during or after a breach investigation.
- The Privacy Owner is the sole decision-maker on whether the incident is an eligible data breach. This decision cannot be delegated to Admin or automated.
- Assessment must be completed within 30 days of becoming aware of the suspected breach.
- If eligible, OAIC and affected-individual notification evidence is required. If direct notification is not practicable, a website/public statement path is an open item.
- A post-breach review report is prepared by the Privacy Owner and retained for 7 years.

Local runtime state:

- Admin now has a `Policy #6 / POL-OPS-006 NDB Response Register` for suspected incident title, reporter, awareness date, description, information involved, affected estimate, containment action/status, APP-PRV-004 audit refs, system access logs, Digiverse evidence, Privacy Owner notification/blocker evidence, 30-day assessment due date, notification evidence fields, and post-breach review report ref.
- The local app blocks Privacy Owner assessment, eligible/not-eligible decision, notification-required, post-breach-review, and closed states while ACT-TECH-002 remains unnamed.
- Admin can record identify/contain evidence without pretending the NDB plan is Active.
- Policy #6 post-breach review report records appear in the retention register with completion + 7 years where a report exists.
- APP-PRV-004 audit records are written when Admin records or updates an NDB incident.

Supabase draft state:

- `202606190025_ndb_response_policy6.sql` adds `ndb_incidents`, Admin-only RLS, mandatory containment and APP-PRV-004 audit refs, 30-day assessment due date, Privacy Owner decision guardrails, eligible-breach notification evidence checks, post-breach review report retention checks, and PII audit trigger.

Open gaps:

- Privacy Owner (ACT-TECH-002) is not named.
- OAIC notification evidence format and owner are not confirmed.
- Affected-individual notification template/contact details are not provided.
- Website URL/content approval path for public NDB statements is not confirmed.
- Digiverse incident handoff procedure and production access-log evidence format are not confirmed.

## Fleet Vehicle Register

Source:

- `MotoCo_Unified_BOAS_Hierarchy_v1.6.xlsx`, Sheet 06 Data Objects.

Confirmed rules:

- Vehicle records are Admin-managed fleet master data.
- Vehicle Record fields include vehicle ID, registration plate and expiry, insurance policy and expiry, GVM, make/model/year, ownership type, assigned driver, last service, next service, and defect log.
- The Fleet Asset Register is the Admin source of truth.
- APP-FLT-001 monitors vehicle expiry and blocks assignment where compliance evidence is incomplete.
- Dispatch uses a controlled fleet vehicle record, not a manually typed vehicle name.

Open gaps:

- Real production records for ACT-VEH-001 and ACT-VEH-002 are not confirmed.
- Live APP-FLT-001 expiry monitoring and external vehicle/insurance integrations remain unbuilt until the production data source and integration authority are confirmed.

Deferred or conditional:

- Multi-driver policy activates only when the driver pool reaches 3 or more drivers.
- External courier billing policy is conditional and not active.
