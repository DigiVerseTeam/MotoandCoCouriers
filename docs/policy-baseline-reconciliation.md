# Policy Baseline Reconciliation

Last updated: 2026-07-02

Status: controlled policy addendum for documentation alignment. This is not final legal copy.

Purpose: record how current V1 portal behaviour affects the policy baseline before more software work continues. The formal policy `.docx` files remain in the policy zip archives and still require Policy Owner/legal versioning before publication or legal reliance.

## Current V1 Policy Impact Summary

| Policy | Baseline update required | Current V1 operating position | Still not confirmed |
| --- | --- | --- | --- |
| Policy #3 Privacy Policy | Add driver-device offline cache and portal-generated invoice/POD handling to privacy descriptions under GM Moto & Co Logistics Privacy Owner governance. | Customer, booking, delivery, receiver name/signature, billing, audit, and proof data are handled in the portal. Driver offline updates may be stored temporarily on the same device until sync or Admin recovery succeeds. | ABN/contact details, APP 6 Digiverse assessment, Supabase data-location evidence, public privacy wording. |
| Policy #4 Collection Notice | Add collection notice wording for receiver name/signature, delivery proof, customer portal registration, and offline device processing. | Receiver has no login. Receiver name and signature are captured only through Driver POD. Customer registration and booking details are collected through the portal. | APP 5 consequence-of-non-collection wording; final public notice copy. |
| Policy #5 Data Retention and Destruction | Add local device cache/outbox retention and destruction rules; confirm storage-pending proof handling. | POD proof is retained for 7 years from delivery date. Pickup, supplier, master-data change, financial reconciliation, and breach-review records follow confirmed 7-year windows where source-backed. Offline local updates remain on the same device until sync or approved Admin recovery, then clear. | Remaining retention periods and legal-hold handling. |
| Policy #6 NDB Response Plan | Add lost/stolen driver device, unsynced local outbox, storage-pending proof, and production access issues as suspected incident triggers. | Admin can record suspected incidents and containment evidence; Privacy Owner role is GM Moto & Co Logistics. | OAIC notification artefacts, affected-person template, website public statement process, Digiverse incident handoff. |
| Policy #7 Information Security | Add supported device/browser, offline local cache, retry sync, clear-device-data risk, production access logging, and RLS/Storage evidence requirements. | Driver offline mode is local-device only. Clearing saved device data can abandon unsynced updates. Minimum driver device/browser must be captured in UAT and re-executed after ERD approval and schema/runtime reconciliation. Live RLS/Auth/Storage assurance remains open. | Digiverse production security confirmations, production access-log format. |
| Policy #8 Failed Delivery | Confirm how offline retry and manual recovery affect failed-delivery evidence and redelivery-fee billing. | Failed-delivery workflow and redelivery fee review are built locally; billing includes approved failed-delivery fee lines where proof-backed. | Final failed-delivery reason taxonomy beyond source-backed categories; production accounting treatment. |
| Policy #9 Pricing Schedule | Align to corrected price schedule and Admin-managed `price_rules` with Owner approval evidence. | Pricing is table-driven, not hard-coded, and not manually entered by drivers. Admin updates require reason and Owner approval reference. | Final production authority model where source material says Digiverse executes updates after Admin/Owner approval. |
| Policy #10 Invoicing and Payment Terms | Replace external accounting dependency with V1 portal-generated invoice PDF download only. | Admin can generate/download invoice PDFs. Admin emails each invoice manually outside the portal. The runtime does not own email dispatch, bounce handling, payment follow-up, bank reconciliation, OpenClaw, Xero, or accounting API integration. | Credit-note/corrected-invoice issue path if later required. |
| Policy #10a Credit Control | Align overdue, suspension/reinstatement, and manual invoice dispatch to V1 PDF-only billing boundary. | Portal billing scope ends at downloadable invoice PDF and account status controls. Payment follow-up and bank reconciliation are off-system human/accounting processes. | Repeated non-payment termination pathway. |
| Policy #11 Customer Terms | Add portal booking, scheduled run status, next-run/brought-forward handling, POD access/download, disputes, manual invoice PDF, and no-SLA-monitoring boundary. | Customers see scheduled/delivered/dispute/download POD flows in the portal. Approved legal HTML is published at `/legal`. | UAT must confirm the published legal pages match the current portal journey and pricing. |
| Policy #14 Order Cancellation | Confirm customer-visible cancellation/review wording and any manual notification evidence. | Client can self-cancel before cut-off and request Admin review after cut-off if goods are not collected. | External notification channel and final customer wording. |
| Policy #15 Goods Acceptance | Align with pickup-time item counting and driver dock-decision evidence. | Driver counts freight items at pickup and records pickup evidence before delivery sign-off. | Policy #15 remains Draft/Awaiting Review in source map. |
| Policy #16 Vendor Pickup Standards | Align active supplier list, supplier archive/reactivation, named dock contact gaps, and no-pickup evidence. | Active V1 supplier list excludes Ficeda. Supplier standards and No Pickup evidence are tracked. | Named dock contacts, supplier review cadence, final supplier-health scoring. |
| Policy #18 Delivery Dispute | Add portal POD download, manual invoice PDF, billing-query acknowledgement, remedy, and credit-note/corrected-invoice path. | Admin investigates disputes using proof, pickup/pricing records, invoice/work links, and controlled findings. Invoice emailing and payment reconciliation remain outside runtime. | Actual credit note/corrected invoice issue/send path if later required. |
| Policy #20 AI Use Policy | Keep live AI generation/send out of V1 unless separately approved. | Admin can review local AI draft records only. Approved drafts are not sent. | Provider, model, prompt registry, outbound send channel, evidence write-back. |
| Policy #21 Internal Acceptable Use and Data | Add explicit production access logging, offline local device data handling, export approval evidence, and RLS/Auth boundary UAT. | Admin data-use register records acceptable-use decisions and blocked data-use attempts. | Digiverse data-processing/security schedule, access-log format, review cadence, live RLS/Auth proof. |
| Policy #22 Driver Scheduling | Keep logistics availability only; do not reintroduce HCM/legal classification. Add approved daily-run creation change once Policy #22 source is surfaced. | Owner could not locate Policy #22 source for approval. Previous evening-before lockdown is rejected. New approved runtime requirement is driver-created daily run from ready con notes, with depot options for planned milk-run package, bring-forward next-day package, and ready package without con note/customer missed portal entry. | Policy #22 source review, ERD impact, and runtime build/UAT for daily run creation. |
| Policy #23 Account Suspension and Termination | Keep repeated non-payment termination blocked; align manual invoice/notice evidence. | Suspension/reinstatement can be evidenced locally; repeated non-payment termination remains blocked. | Debt recovery escalation path, write-off thresholds, authority, notice wording. |
| Policy #24 Revenue Reporting and Financial Controls | Add V1 portal invoice PDF download and explicitly keep email, payment follow-up, bank reconciliation, BAS/accountant handoff, and other accounting processes outside the runtime. | Admin Billing groups client/month history and can generate invoice PDFs. After download, Admin emails clients individually and handles bank reconciliation outside the portal. | Otimi Rules reporting cadence/format/recipient if required outside runtime. |
| Policy #27 WHS, Fatigue, Driver Wellbeing | Keep active supplier WHS hazard/no-pickup evidence; leave full fatigue/risk framework conditional. | Driver can report fatigue/health concerns, WHS incidents/near misses, and supplier-premises hazards. | WHSQ notification owner/process, full fatigue framework evidence trigger. |

## Policies Held Out Of Logistics Scope

The following remain outside the logistics portal baseline unless a future HCM build is started:

- Policy #12 Driver Agreement.
- Policy #13 Driver Verification.
- Policy #19 Driver Code of Conduct.
- Policy #25 Pickup/Delivery Execution Multi Driver, except conditional logistics visibility once approved activation criteria exist.
- Policy #26 Billing/Payment Couriers, except conditional future external courier/payment model evidence.

These items are preserved in `hcm-extract/` and controlled by `docs/hcm-boundary.md`.

## Required Formal Policy Work

Before publishing or relying on policy wording as final:

1. Name the Policy Owner where required; Privacy Owner is role-based GM Moto & Co Logistics.
2. Confirm which policies require legal review.
3. Version the affected `.docx` policies instead of editing zip archives silently.
4. Approve customer-facing legal copy for `/legal`.
5. Retest local device cache retention/destruction after ERD approval and schema/runtime reconciliation.
6. Keep manual invoice email, payment follow-up, and bank reconciliation outside runtime under Policy #10, Policy #10a, and Policy #24.
7. Confirm production security/data-use evidence under Policy #7 and Policy #21.
8. Confirm NDB notification artefacts and Digiverse incident handoff under Policy #6.

## Build Gate

No new runtime feature should be treated as policy-approved unless:

- The affected policy row above is updated.
- The decision is recorded in `decision-log.md`.
- Any open approval remains visible in `open-questions.md` or `production-blocker-register.md`.
- The policy owner/legal owner has approved the final policy copy where legal wording is involved.
