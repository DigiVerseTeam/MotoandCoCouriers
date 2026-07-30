# Open Questions

Last updated: 2026-07-03

## Launch decisions

- Is the final public trading name locked as Moto and Co Couriers?
- Should the public website mention Moto & Co Pty Ltd, Moto and Co, GCMTM, or all three? In what hierarchy?
- What is the exact public geography wording for launch?
- What domain should be used for the public website?
- Is launch private, soft launch, or public campaign?

## Website content

- What pages are required for launch?
- Legal pages have been supplied and updated against v2.0 policy changes; final Policy Owner / Privacy Owner approval for publishing remains open.
- Driver Safety and Respectful Conduct legal page draft exists at `docs/driver-safety-and-respectful-conduct-policy-draft.md`; final Policy Owner / legal owner approval is required before adding it to `/legal`.
- What exact booking terms, credit terms, dangerous goods policy, delivery disclaimer, and privacy policy text should be used?
- Should the driver safety public title include "Zero Tolerance", or should that remain inside the policy body?
- Should the driver safety page name a safety contact email, or use the general contact channel only?
- Should account suspension, termination, and failed pickup/delivery charging consequences for abusive or unsafe conduct sit in Driver Safety, Booking Terms, or both?
- Is the Retromecanica case asset approved to name the workshop publicly?
- Is the Argyle-transition origin story approved for public publishing?
- What public proof can be shown now without overstating maturity?

## Baseline documentation and policy approval

- BOAS v2.0 is approved as source of truth for all testing; final approval reference still needs to be retained.
- The next formal BOAS version is v2.0.
- The v2 SOP workbook set is approved for testing alignment, including pickup-count-at-pickup, manual invoice PDF billing, and offline device recovery.
- Policy Owner/legal owner is to be a Moto & Co Logistics role; named role assignee/authority remains open.
- Privacy Owner is role-based GM Moto & Co Logistics.
- Which policy amendments in `policy-baseline-reconciliation.md` require legal review before use?
- Policy updates have been created as new v2.0 `.docx` versions in the baseline pack. Final approved zip/archive publication remains open after approval.
- What final customer-facing wording should be used for local driver-device cache, offline outbox, and clear-device-data risk in Policy #3, Policy #4, Policy #5, Policy #7, and Policy #21 after UAT is re-executed post-ERD?
- What final customer-facing wording should explain that V1 invoices are downloadable PDFs and all email/payment/bank reconciliation steps happen outside the portal?
- What evidence should be kept to prove baseline documents were approved before the next software release?
- When baseline docs are stable, what format should the ERD/entity relationship diagram use?

## Booking

- Is launch booking a request form, a confirmed order workflow, or both?
- What fields are required to submit a pickup request?
- Can unregistered customers submit bookings?
- What confirmation should the customer receive?
- Are notifications email, SMS, in-app, or manual at launch?

## Tracking

- What should a customer see on a tracking link?
- Is tracking public via secure token, customer-authenticated, or staff-only at launch?
- Which statuses are customer-visible?
- Are supplier pickup events visible to customers?
- Are failed pickup and failed delivery outcomes visible to customers?

## POD

- Is photo always required?
- What device will drivers use to capture POD?
- Are POD photos optional, conditionally required, or not part of release one?
- Which exact iPad/device model, operating system, browser, and browser version pass UAT for SOP-OPS-01 offline field use after ERD approval and schema/runtime reconciliation?
- Has the approved Admin unrecoverable-outbox procedure passed UAT after ERD approval and schema/runtime reconciliation?
- Has the approved local device cache rule, retain only until sync/Admin recovery then clear, passed UAT after ERD approval and schema/runtime reconciliation?

## Operations

- What are the real production APP-FLT-001 / ACT-VEH-001 and ACT-VEH-002 vehicle records: registration plate and expiry, insurance policy and expiry, GVM, make/model/year, ownership type, assigned driver, service schedule, and defect history?
- Surface Policy #22 source for Owner review; Owner could not locate it during TBD review.
- Build and test the approved `Create Daily Run` driver workflow after ERD approval and schema/runtime reconciliation.
- How should no-con-note depot pickups be linked back to customer accounts/orders when the customer forgot to enter the package in the portal?
- What is the WHSQ notifiable-incident procedure and who owns production WHS regulator notification decisions?
- When Policy #27 triggers the formal fatigue framework/risk register, what evidence fields and Admin/Owner approvals must be captured?
- Should supplier partner terms include a matching safe-access and respectful-conduct obligation before the Driver Safety and Respectful Conduct page is published?
- Is run planning limited to manual Admin assignment for V1, or does it require supplier sequencing before launch?
- What channel carries the daily structured exception alert to Admin?
- Which operating cadences are mandatory for Moto and Co Couriers at launch?

Driver legal classification, agreements, verification evidence, disciplinary/removal consequences, and driver/courier expansion employment-payment questions have been moved out of this logistics register. They are HCM questions; draft material is preserved in `hcm-extract/` and the boundary is recorded in `docs/hcm-boundary.md`.

## Billing

- V1 invoice path is portal-generated PDF download only. Admin manual email, bounce/non-delivery handling, payment follow-up, and bank reconciliation are outside the portal runtime.
- No accounting API/OpenClaw/Xero integration is part of the V1 baseline.
- What invoice fields must be captured at job level?
- BAS/tax reporting handoff is outside the V1 runtime.
- What Otimi Rules reporting cadence, format, recipient, and delivery method are required?
- Who is allowed to mark Otimi Rules reporting complete?

## AI

- Which production AI provider and model, if any, should power Policy #20 draft generation?
- Who approves AI prompts, prompt versions, and generated CTA templates?
- Where should production prompt/version history be stored?
- Should V1 include live AI generation, or only Admin-created/reviewed local draft records?
- If live AI generation is in scope, which agent workflows are enabled first: `AGT-CS-001b`, `AGT-SRM-001b`, or `AGT-ADM-007b`?
- What outbound delivery channel, if any, can send Admin-approved AI draft messages?
- What evidence must be written back after a human sends an approved draft outside the app?

## Data and compliance

- What customer data is collected at launch?
- What ABN and contact details should be inserted into Policy #3 and Policy #4 before publication?
- What exact consequence-of-non-collection wording should Policy #4 use under APP 5?
- Privacy Owner is role-based GM Moto & Co Logistics; final approval evidence for Policy #3 / Policy #4 remains open.
- Owner response confirms Australia/Sydney database position; retained Supabase/Digiverse evidence and UAT remain required.
- Has the APP 6 assessment for Digiverse access/disclosure been completed?
- What production evidence format should be used for Digiverse production data access logs under Policy #21 / Policy #7?
- Who reviews the Admin Data Use register, and how often?
- What evidence is acceptable before Admin approves a data export?
- What consent evidence format is acceptable before marketing use or non-service-delivery third-party sharing?
- A Digiverse formal data-processing agreement/security schedule is not required for V1.
- Which retention periods remain TBD pending Privacy Owner?
- How should The Village relationship lifecycle interact with Policy #5 retention and deletion rules?
- Are relationship records needed for a specific release-one workflow, or can they stay deferred?
- Privacy Owner for Policy #6 NDB decisions is role-based GM Moto & Co Logistics.
- What contact details should be used for Policy #6 affected-person notifications?
- What exact OAIC notification evidence should be stored after a Policy #6 eligible data breach decision?
- What website URL and approval process should be used if Policy #6 requires a public notification statement?
- What Digiverse incident handoff evidence should Admin store for Policy #6 containment and remediation?

## Platform

- GitHub repository is confirmed as `DigiVerseTeam/MotoandCoCouriers`; local Git still needs to be installed/exposed before pushing a branch.
- Production-first V1 path is confirmed; local/preview builds still must not connect to production Supabase.
- Production Supabase project ref is `fhrqfrhqopicekaiibyj`; confirm whether Digiverse accepts this as the production V1 project.
- What Supabase region should be used? This is a Digiverse decision.
- What Vercel team/account owns deployment?
- What environment variables are needed?
- Who owns production secrets?

## Brand and UI

- What exact semantic UI hex values and state mapping should be used for error, warning, and success? Current direction is red/coral, but exact mapping is not final.
- Which icon library should be selected: Tabler outline, Phosphor light, or another approved option?
