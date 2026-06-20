# User Journey Gap Audit

Audit date: 2026-06-21

Source artifacts reviewed:
- `customer journey.zip`
- `user journeys and gaps.zip`
- `user journeys and gaps.zip/UJ-AllJourneys.zip`
- `UJ-CRM-001-ClientRegistration.html`

Implementation audited:
- Production portal source in `src/components/moto-co-logistics.tsx`
- Supabase migrations in `supabase/migrations`
- Existing evidence docs in `docs/customer-journey-comparison.md`, `docs/build-gaps.md`, and `docs/production-blocker-register.md`

This audit does not fill unknown business decisions. A row is marked `Resolved` only where the portal already has source-backed runtime behavior or where this audit made a narrow implementation fix that does not require a policy decision. A row is marked `Partial` where the portal has an in-app/local/runtime behavior but production channel, automation, SLA, or ownership is still unconfirmed. A row is marked `Open` where a business decision is still required.

Summary:

| Status | Count |
| --- | ---: |
| Resolved in portal | 7 |
| Partially resolved, production/business decision still needed | 10 |
| Open business decision | 7 |
| Total | 24 |

## Gap Register Audit

| # | Source gap | Audit against current portal | Status | Remaining action |
| ---: | --- | --- | --- | --- |
| 1 | SOP-IAM-01 SCR-01: Does the form validate address format here, or only service area eligibility at Admin review? | Registration/CRM address handling rejects missing addresses and PO boxes. Admin activation separately requires the service-area eligibility confirmation. | Resolved | None for V1. Automated suburb/postcode boundary validation remains separate if required later. |
| 2 | SOP-IAM-01 SCR-03: Admin is notified of new registrations - how? Email digest, push notification, or exception queue? | The app creates a pending Admin activation workflow and audit evidence. Production outbound notification channel is still unconfirmed. | Partial | Confirm whether new registration alerts are in-app queue only, email digest, push, or APP-ADM-005 exception queue. |
| 3 | SOP-IAM-01 SCR-03: Expected review timeline communicated to client - "1 business day" - is this the correct SLA? | The pending activation screen is built, but the app does not hard-code the 1 business day promise. | Open | Confirm the customer-facing registration review SLA before adding timeline copy or SLA indicators. |
| 4 | SOP-IAM-01 SCR-05: Admin review SLA for new registrations is not formally defined. | No formal registration review SLA is present in the runtime. | Open | Confirm the Admin review SLA and whether overdue pending registrations enter APP-ADM-005. |
| 5 | SOP-IAM-01 SCR-05: Does Admin checklist require each item to be individually checked, or is it advisory only? | Admin activation has individual required checklist controls. Activation is disabled until required eligibility checks are available and checked. | Resolved | None. |
| 6 | SOP-IAM-01 SCR-06: Is there a confirmation step before activation executes? | Activation occurs through an Admin eligibility modal with checklist and review note before the Activate Account action. | Resolved | None unless the business wants an additional typed-confirmation gate. |
| 7 | SOP-IAM-01 SCR-06: Is the client notified automatically on activation? What channel and what does the email say? | The app records a local account activation notice/update. Production email/SMS/in-app delivery provider and exact message template are still unconfirmed. | Partial | Confirm activation notification channel, template, sender, and failure handling. |
| 8 | SOP-IAM-01 SCR-07R: Can a rejected client re-register? What happens if the same email address is used? | Server-side provisioning blocks duplicate auth emails for Admin-created users. A formal rejected-client re-registration path is not defined. | Open | Confirm whether rejected customers may reapply, whether the same email reopens the old record or creates a new attempt, and who approves it. |
| 9 | SOP-IAM-01 SCR-07R: Is the rejection email sent from a monitored address or no-reply? | Rejection email channel/sender is not implemented because notification provider is unconfirmed. | Open | Confirm monitored sender versus no-reply, reply handling, bounce handling, and rejection template. |
| 10 | REQ-01 SCR-02: What does the client see if their account is suspended - a suspension notice or a generic access denied? | Client portal shows an account status card and blocks pickup requests with the account-status message. Billing/account notice records are visible where available. | Resolved | None for V1. |
| 11 | REQ-01 SCR-03: After-cut-off notification - what channel? Email to Operational Contact only, or also shown in portal? | The app records schedule-adjusted operational notices and shows adjusted run dates in portal/tracking. External notification channel is still unconfirmed. | Partial | Confirm whether after-cut-off notices are portal-only, email to Operational Contact, or both. |
| 12 | REQ-02 SCR-03: If no next run date exists, what does the client see? Does submission appear to succeed or fail? | The V1 app computes the next Tuesday/Thursday run date, so an empty schedule table is not part of the current design. The client sees the adjusted scheduled run date. | Resolved | If run dates later become Admin-managed records, define the error state for no available future run. |
| 13 | REQ-01 SCR-01: Calendar or typed date? What prevents selecting a date in the past? | The app uses a native date picker. This audit added `min=today` plus submit-time validation so past dates are blocked instead of silently adjusted. | Resolved | Deploy and test this fix. |
| 14 | RUN-01 SCR-01: Driver availability confirmation is manual. When does it become system-captured? | Admin can record driver unavailable/leave records with notice date, due date, late flag, and contingency evidence. Dispatch/run compilation is blocked for unavailable drivers. Driver self-confirmation cadence is still not defined. | Partial | Confirm whether V1 uses exception-only Admin availability records or daily Driver self-confirmation. |
| 15 | RUN-01 SCR-01: If run planning fails nightly, what is the manual fallback process? | CAP-MCL-002 monitor queues APP-ADM-002 run-planning exceptions for missed night-before compile evidence. Named fallback owner/substitute process is not confirmed. | Partial | Confirm manual fallback owner, deadline, customer notification rule, and whether Super Admin can substitute for Admin. |
| 16 | PUP-02 SCR-03: If driver runs out of time at the dock, is "time constraint" an available No Pickup reason? | Not added. Existing source conflict remains: SOP-PUP-02 mentions time constraint, while SOP-PUP-03 confirmed No Pickup taxonomy does not include it. | Open | Reconcile SOP-PUP-02 and SOP-PUP-03, then confirm whether `time_constraint` is an approved No Pickup category. |
| 17 | DEL-04 SCR-07: Redelivery fee - Admin must approve before applying. Is it exception queue or separate fee queue? | Built through APP-ADM-005 exception handling. After the second failed attempt, Admin approves or waives Policy #8 redelivery fee with review note before billing. | Resolved | None for V1. |
| 18 | DEL-04 SCR-05: Second delivery attempt - always next scheduled run or can Admin approve same-day? | The app supports Admin authorisation of a second attempt after one failed delivery. It does not formally encode same-day versus next-run scheduling as a business rule. | Partial | Confirm second-attempt scheduling rule and whether same-day second attempt is allowed. |
| 19 | EXC-SOP-05 SCR-01: Admin response SLA for overdue accounts is not defined in Policy #10a. | No confirmed overdue-account SLA is implemented for exception indicators. | Open | Confirm overdue-account Admin response SLA before adding timer/SLA badges. |
| 20 | EXC-SOP-06 SCR-03: Payment arrangement fields - amount, date, channel? | Reinstatement evidence supports free-text payment reference, part-payment arrangement, breach remedy, or Admin evidence. Structured arrangement fields are not defined. | Partial | Confirm structured payment-arrangement fields if the UI must report amount/date/channel separately. |
| 21 | EXC-SOP-06 SCR-04: Reinstatement notification - automatic or manual? | Admin reinstatement creates local notice evidence and requires Operational/Billing notification evidence. Production outbound delivery remains unconfirmed. | Partial | Confirm whether reinstatement sends automatically on Admin action or remains manual evidence. |
| 22 | BIL-01 SCR-01: Month-end billing compilation - Admin-triggered or automatically scheduled? | Current portal is Admin-triggered: Admin creates draft invoices from billing-ready deliveries and approved redelivery fees. No automatic month-end invoice creation is active. | Partial | Confirm that Admin-triggered billing is the approved V1 rule, or specify the scheduled automation requirement. |
| 23 | BIL-01 SCR-02: If Admin is unavailable, who substitutes? | No substitute/escalation path is documented or enforced for invoice generation when Admin is unavailable. | Open | Confirm substitute role, approval authority, and escalation path. Likely candidate is Super Admin, but this has not been formally confirmed. |
| 24 | BIL-04 SCR-04: Invoice dispatch automatic after Admin review or does Admin press Send? | Current portal requires Admin rendered-invoice approval, then a separate Admin `Record Dispatch` action with evidence. Production PDF/email dispatch is still unconfirmed. | Partial | Confirm final invoice dispatch model: manual Admin send/record, automatic send after approval, or accounting-system integration. |

## Implementation Note From This Audit

Gap 13 produced one narrow code change: the client pickup request date picker now blocks past dates in the browser and submit handler. This does not decide any business policy; it only prevents invalid input that the journey register explicitly called out.

## Still Open Business Decisions

The following rows remain open and should be answered before claiming the journey package is fully resolved: 3, 4, 8, 9, 16, 19, and 23.

The following rows are partially resolved but still need production or business confirmation: 2, 7, 11, 14, 15, 18, 20, 21, 22, and 24.
