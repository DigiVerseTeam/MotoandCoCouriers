# Release One Rules

Last updated: 2026-07-02

Source for this pass: direct user answers from 2026-06-18 through 2026-07-02, with policy/SOP/control references preserved as supplied.

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
- Driver offline device handling is governed by `SOP-OPS-01`.
- Offline mode saves driver actions on the same device and retries live sync later.
- Offline mode does not update the live production record until that device reconnects and sync succeeds.
- If signature image upload fails, proof metadata may still sync with a storage-pending status for Admin review.

TBD:

- Whether photos are optional, conditionally required, or not part of release one.
- Minimum supported driver device/browser.
- Production Supabase Storage policy UAT and proof-object persistence.

## Operations

Confirmed launch roles:

- Client Operational Contact: `ACT-CRM-001a`.
- Client Billing Contact: `ACT-CRM-001b`.
- Driver: `ACT-INT-001`.
- Admin: `ACT-INT-002`.
- Super Admin: `ACT-INT-003`.
- Receiver: `ACT-INT-004`, no login.

Exceptions:

- Exceptions are recorded through `APP-ADM-005`.
- Exceptions go into an exception queue.
- Exceptions generate a daily structured alert to Admin.

Disputes:

- Policy #18 governs disputes.
- Admin investigates disputes using `APP-DRV-003` proof records.

Offline recovery:

- `SOP-OPS-01` governs driver network dropouts.
- The driver portal shows pending sync count and the last sync issue.
- Drivers must keep the same device signed in and online until pending sync clears.
- Admin recovery for unrecoverable local outbox data is handled through APP-ADM-005 evidence.

TBD:

- Daily structured alert channel.
- Full admin dispatch workflow.
- Full run-planning workflow.
- Final unrecoverable-offline-data correction procedure.

## Billing

- Approved pricing source of truth: Policy #9 and `SOP-MDM-02`.
- Runtime pricing data lives in a Supabase `price_rules` table.
- Rates are fixed tiers.
- Rate tiers are based on tyre count and weight band.
- Rates are not customer-specific.
- Rates are not manually entered by drivers.
- Administrators must be able to update pricing rules.
- Pricing must not be hard-coded in the app.
- Xero, OpenClaw, and accounting API integration are not part of V1 after the attempted Xero connection failed.
- V1 billing uses portal-generated invoice PDFs.
- Admin downloads invoice PDFs and emails them to clients manually outside the portal.
- Payment follow-up and bank reconciliation are manual out-of-system processes.

TBD:

- UAT evidence that the correct client/month invoice PDF can be downloaded.
- Manual payment evidence format recorded by Admin.
- Corrected-invoice or credit-note manual process only if required by a live dispute.

## Data And Compliance

Controlling policies:

- Policy #3.
- Policy #4.
- Policy #5.
- Policy #7.
- Policy #21.

Policy baseline:

- `docs/policy-baseline-reconciliation.md` records policy impacts introduced by current V1 runtime decisions.
- The policy reconciliation file is a working addendum, not final legal copy.
- Formal policy `.docx` files still need Policy Owner/legal owner versioning before they are treated as approved policy baseline.

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
- Privacy Owner is role-based GM Moto & Co Logistics.
- Some retention periods remain TBD pending retained Privacy Owner approval evidence.

Australian data residency:

- Intended yes.
- Supabase infrastructure in Australia is the intended direction.
- Digiverse has not confirmed this yet, so this remains an open gap.

## Platform

- Production V1 portal URL: `https://motoandcocouriers.vercel.app`.
- Active Supabase project ref for V1 testing: `fhrqfrhqopicekaiibyj`.
- Supabase region is not confirmed.
- Supabase region is a Digiverse decision.
- Preview deployments must not connect to production Supabase.
- `PIPE-DEV-001` release control policy and `SOP-REL-01` imply environment separation.
- Environment separation is implied but not explicitly confirmed in the source documents.
- Live RLS/Auth, private Storage, migration execution, and deployment ownership still require production UAT/evidence.

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
