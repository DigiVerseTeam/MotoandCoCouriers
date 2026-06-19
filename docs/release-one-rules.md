# Release One Rules

Last updated: 2026-06-18

Source for this pass: direct user answers on 2026-06-18, with policy/SOP/control references preserved as supplied.

## Booking

- Supplier names are selected from a controlled list.
- Supplier names must not be hard-coded in the app.
- Administrators must be able to add and remove suppliers.
- Delivery workshops are selected from a controlled list.
- Customer/workshop records require a CRM.
- CRM/village design standard is supplied in `The village ERM Complete Requirements v2.0.pdf` and summarised in `village-crm-rules.md`.
- Release one uses a lean Village CRM/ERM subset: actors, contacts, events, obligations, and courier-specific operational tables.
- Relationship records, opportunities, partner management, and relationship health scoring are deferred unless a later decision brings them into release one.
- Booking cut-off is 12:30pm Brisbane time.
- Cut-off enforcement is governed by `APP-ADM-001`.

TBD:

- Exact pickup request fields.
- Whether launch booking is request-only, confirmed-order, or both.
- Whether unregistered customers can submit bookings.
- Customer confirmation and notification channels.

## POD

- Mandatory POD evidence is receiver name and receiver signature.
- Receiver name and signature are both required before `Delivered` status can be set.
- Mandatory POD requirement source: `POL-MCL-004-001`.
- GPS is not required.
- POD is stored in Supabase Storage.
- POD storage bucket must be private.
- Signature URL is written to the `delivery_proof` table.
- POD retention is 7 years from delivery date.
- POD retention source: Policy #5 and billing dispute window.

TBD:

- Whether photos are optional, conditionally required, or not part of release one.
- Driver device assumptions for POD capture.

## Operations

Confirmed launch roles:

- Client: `ACT-CRM-001a/b`.
- Driver: `ACT-INT-001`.
- Admin: `ACT-INT-002`.
- Super Admin: `ACT-INT-003`.
- Receiver: `ACT-INT-004`, no login.

Confirmed access model from BOAS v1.8 / `SOP-IAM-03`:

- Super Admin is one person at launch and is bootstrapped manually by Digiverse server-side.
- Super Admin creates/removes Admin users inside the app after bootstrap.
- Admin creates Client Ops, Client Billing, and Driver users inside the app.
- Login-user provisioning must run through a server-side API/Edge Function using `service_role`; the `service_role` key must never be exposed in the browser.
- Admin can add/update customer/workshop, supplier, driver, vehicle, and login-user master data with required approval/audit evidence.

Exceptions:

- Exceptions are recorded through `APP-ADM-005`.
- Exceptions go into an exception queue.
- Exceptions generate a daily structured alert to Admin.

Disputes:

- Policy #18 governs disputes.
- Admin investigates disputes using `APP-DRV-003` proof records.

TBD:

- Daily structured alert channel.
- Full admin dispatch workflow.
- Full run-planning workflow.

## Billing

- Approved pricing source of truth: Policy #9 and `SOP-MDM-02`.
- Runtime pricing data lives in a Supabase `price_rules` table.
- Rates are fixed tiers.
- Rate tiers are based on tyre count and weight band.
- Rates are not customer-specific.
- Rates are not manually entered by drivers.
- Administrators must be able to update pricing rules.
- Pricing must not be hard-coded in the app.

TBD:

- Whether Zoho Books is integrated in release one.
- If Zoho is not integrated, what export or manual reconciliation is required.
- Exact invoice fields required at job level.

## Data And Compliance

Controlling policies:

- Policy #3.
- Policy #4.
- Policy #5.
- Policy #7.
- Policy #21.

Access control:

- Access rules are documented in Policy #21 and the Roles & Access model in Sheet 05 of BOAS.
- BOAS Sheet 05 has been reviewed for a first-pass Row Level Security migration. Policy #21 review, live Supabase Auth binding, and live policy testing are still required before RLS is final.
- The Village source requires every relationship to have a named internal owner.

Audit history:

- `APP-PRV-004` requires an append-only audit log.
- Audit log covers all PII actions.
- Audit log must be tamper-evident.

Retention and deletion:

- Policy #5 governs data retention and deletion.
- Some retention periods remain TBD pending Privacy Owner.

Australian data residency:

- Intended yes.
- Supabase infrastructure in Australia is the intended direction.
- Digiverse has not confirmed this yet, so this remains an open gap.

## Platform

- Supabase region is not confirmed.
- Supabase region is a Digiverse decision.
- Preview deployments must not connect to production Supabase.
- `PIPE-DEV-001` release control policy and `SOP-REL-01` imply environment separation.
- Environment separation is implied but not explicitly confirmed in the source documents.

## Brand And UI

- The five V1 brand colours are confirmed final.
- Existing PNG logo asset is approved for production use.
- No approved black-and-white photos are available for the first website.
- Use placeholders for first website photography until approved assets exist.
- Icon library is not selected yet.

Semantic UI colours:

- User direction: red/coral.
- Exact error, warning, and success mapping is still TBD.
- Exact hex values are still TBD.
- The brand guide says brand red should not double as error red, so this needs a final UI colour decision before implementation is treated as final.
