# Open Questions

Last updated: 2026-06-20

## Launch decisions

- Is the final public trading name locked as Moto and Co Couriers?
- Should the public website mention Moto & Co Pty Ltd, Moto and Co, GCMTM, or all three? In what hierarchy?
- What is the exact public geography wording for launch?
- What domain should be used for the public website?
- Is launch private, soft launch, or public campaign?

## Website content

- What pages are required for launch?
- Which legal documents are approved for publishing under `/legal/`?
- What exact booking terms, credit terms, dangerous goods policy, delivery disclaimer, and privacy policy text should be used?
- Is the Retromecanica case asset approved to name the workshop publicly?
- Is the Argyle-transition origin story approved for public publishing?
- What public proof can be shown now without overstating maturity?

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

## Operations

- What are the real production APP-FLT-001 / ACT-VEH-001 and ACT-VEH-002 vehicle records: registration plate and expiry, insurance policy and expiry, GVM, make/model/year, ownership type, assigned driver, service schedule, and defect history?
- Is driver availability recorded daily in-app for V1, or maintained manually and entered only when unavailable?
- Does Policy #22 need an exact production "evening before" time cut-off, or is previous-calendar-day due-date tracking with late-notice flag sufficient for V1?
- What is the WHSQ notifiable-incident procedure and who owns production WHS regulator notification decisions?
- When Policy #27 triggers the formal fatigue framework/risk register, what evidence fields and Admin/Owner approvals must be captured?
- Is run planning limited to manual Admin assignment for V1, or does it require supplier sequencing before launch?
- What channel carries the daily structured exception alert to Admin?
- Which operating cadences are mandatory for Moto and Co Couriers at launch?

Driver legal classification, agreements, verification evidence, disciplinary/removal consequences, and driver/courier expansion employment-payment questions have been moved out of this logistics register. They are HCM questions; draft material is preserved in `hcm-extract/` and the boundary is recorded in `docs/hcm-boundary.md`.

## Billing

- Is Zoho Books integrated in release one?
- If not integrated, what export or manual reconciliation is needed?
- What invoice fields must be captured at job level?
- Who is the external accountant for BAS/tax reporting handoff?
- What evidence should Admin record when BAS/tax reporting has been handed to the external accountant?
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
- Has the Privacy Owner approved the Policy #3 Privacy Policy and Policy #4 Collection Notice text for use in APP-PRV-001?
- Can Digiverse confirm Australian Supabase infrastructure/data residency?
- Has the APP 6 assessment for Digiverse access/disclosure been completed?
- What production evidence format should be used for Digiverse production data access logs under Policy #21 / Policy #7?
- Who reviews the Admin Data Use register, and how often?
- What evidence is acceptable before Admin approves a data export?
- What consent evidence format is acceptable before marketing use or non-service-delivery third-party sharing?
- Will Digiverse provide a formal data-processing agreement or security schedule?
- Which retention periods remain TBD pending Privacy Owner?
- How should The Village relationship lifecycle interact with Policy #5 retention and deletion rules?
- Are relationship records needed for a specific release-one workflow, or can they stay deferred?
- Who is the named Privacy Owner (ACT-TECH-002) for Policy #6 NDB decisions?
- What contact details should be used for Policy #6 affected-person notifications?
- What exact OAIC notification evidence should be stored after a Policy #6 eligible data breach decision?
- What website URL and approval process should be used if Policy #6 requires a public notification statement?
- What Digiverse incident handoff evidence should Admin store for Policy #6 containment and remediation?

## Platform

- GitHub repository is confirmed as `DigiVerseTeam/MotoandCoCouriers`; V1 is merged to `main`.
- Production-first V1 path is confirmed; local/preview builds still must not connect to production Supabase.
- Production Supabase project ref is `fhrqfrhqopicekaiibyj`; project metadata confirms region `ap-southeast-2`.
- Vercel team/account is confirmed as `DigiVerse` / `digi-verse`; project `motoandcocouriers`; production URL `https://motoandcocouriers.vercel.app`.
- First Super Admin bootstrap is complete for `gerrard@otimi.com.au` under the 2026-06-20 user approval reference; live UI testing still needs a real Supabase login session.
- Supabase workflow data wiring, Auth identity role binding, and live actor RLS tests still need approved launch records.
- Who owns production secrets?

## Brand and UI

- What exact semantic UI hex values and state mapping should be used for error, warning, and success? Current direction is red/coral, but exact mapping is not final.
- Which icon library should be selected: Tabler outline, Phosphor light, or another approved option?
