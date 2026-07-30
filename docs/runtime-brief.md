# Runtime Brief

Last updated: 2026-07-02

## Confirmed from source material

Source: `Moto_and_Co_Couriers_Brand_Guide_V1.pdf`.

- Business name in the current brand guide: Moto and Co Couriers.
- Legal entity: Moto & Co Pty Ltd.
- ABN: 55 679 964 357.
- GST: registered from 15 Aug 2024.
- Registered office: SA 5062.
- Public market geography in the brand guide: Brisbane suppliers to Gold Coast workshops.
- Parent brand: Moto and Co.
- Sister brand: GCMTM, Gold Coast Motorcycle Tyres & Mechanical, Mermaid Beach.
- Founders named in the guide: Gerrard and Josephine Otimi.
- Payment terms in the guide: strictly 7 days from invoice date.
- Service days in the guide: order Monday, delivered Tuesday; order Wednesday, delivered Thursday.
- Current market state in the guide: live in market with early invoiced jobs, no public campaign.
- Brand maturity in the guide: Level 1 Persuasion, aiming for Level 2 Proof inside 90 days if proof is captured systematically.

## Confirmed launch needs from source material

The brand guide lists these next moves:

- Lock the trading name and update every artefact.
- Stand up POD discipline on every run.
- Document driver SOP, customer onboarding sheet, and booking workflow as one-pagers.
- Publish Booking Terms, Credit Terms, Dangerous Goods Policy, Delivery Disclaimer, and Privacy Policy under `/legal/`.
- Capture a short conversation with Retromecanica about the first three months as the foundation for the first case asset.
- Onboard second and third workshops.
- Stand up the booking form and tracking link on the website.
- Run the first weekly invoicing batch with job-level itemisation. V1 now uses portal-generated invoice PDFs for Admin to manually email outside the portal; Xero, OpenClaw, and accounting API integration are not part of the V1 baseline.
- Write the Argyle-transition origin story as a short website piece.

## Intended runtime direction

Confirmed platform direction from user:

- GitHub for source control and project history.
- Supabase for app runtime backend.
- Vercel for website and app launch.
- Active V1 portal for production testing: `https://motoandcocouriers.vercel.app`.
- Active V1 Supabase project ref for runtime testing: `fhrqfrhqopicekaiibyj`.

Working runtime shape, subject to confirmation:

- Public website for brand, legal pages, case assets, and booking entry.
- Customer-facing booking form.
- Tracking link experience.
- Internal operating app for pickup, delivery, POD, and run visibility.
- Admin view for jobs, customers, suppliers, drivers, billing status, and exceptions.

Confirmed release-one rules are tracked in `release-one-rules.md`. Remaining unknowns must stay visible until they are answered or extracted from source material.

Baseline documentation gate:

- No further product behaviour should be built until the affected BOAS, SOP, policy, journey, and runtime documentation impacts are checked.
- `docs/baseline-documentation-register.md` controls the baseline update checklist.
- `docs/policy-baseline-reconciliation.md` controls policy impacts until formal policy source files are versioned and approved.
- Formal BOAS and policy source files have not been silently overwritten.

## Product boundaries

Confirmed:

- This is a workshop support courier, not a generic logistics platform.
- The first proof loop depends on capturing POD consistently.
- The brand should not overstate public proof before proof exists.
- Supplier names are selected from an administrator-managed controlled list.
- Delivery workshops are selected from a controlled customer/workshop list.
- Booking cut-off is 12:30pm Brisbane time.
- Mandatory POD evidence is receiver name and receiver signature.
- Receiver name and signature are required before `Delivered` status can be set.
- GPS is not required for POD.
- Pricing rules are stored in a Supabase `price_rules` table and are not hard-coded.
- Rates are fixed tiers based on tyre count and weight band.
- Driver offline mode is governed by `SOP-OPS-01`: local device updates are not live until the same device reconnects and sync succeeds.
- Billing V1 is invoice PDF download plus Admin manual email.
- Release one uses a lean Village CRM/ERM subset: actors, contacts, events, obligations, and courier-specific operational tables.
- Relationship records, opportunities, partner management, and relationship health scoring are deferred unless a later decision brings them into release one.

TBD:

- Whether the first release requires authentication for customers.
- Whether the first tracking link is public-token based, authenticated, or both.
- Whether customers can create accounts at launch.
- Whether booking starts as a simple request form or a structured order workflow.
- Invoice PDF UAT evidence and manual payment evidence format.
- Whether relationship records are needed for a specific release-one workflow.

## Brand constraints to respect

Source: brand guide visual section.

- Signal red: `#e11d48`.
- Parent grey: `#b9b9c3`.
- Ink black: `#000000`.
- Paper cream: `#f3f3e8`.
- Pure white: `#ffffff`.
- Cream is the brand canvas.
- White is the software canvas.
- The five V1 brand colours are final.
- Semantic UI direction from user: red/coral.
- Exact semantic UI mapping and hex values for error, warning, and success are still TBD.
- Existing PNG logo asset is approved for production use.
- Approved black-and-white website photos are not available yet; use placeholders.
- Colour photography is not part of the current brand system.
- Photography should be black and white with real tonal range.

## Do not assume yet

- Do not invent pricing.
- Do not invent route coverage beyond the stated Brisbane suppliers to Gold Coast workshops.
- Do not invent customer names beyond those named in the source material.
- Do not invent delivery guarantees beyond the stated operating cadence.
- Do not invent legal text. Use the policy source documents when publishing legal pages.
- Do not expand the release-one CRM scope beyond the agreed lean Village subset without a later decision.
- Do not hard-code suppliers, workshops, or price rules.
- Do not treat exact semantic UI colours as final until mapping and hex values are approved.
