# Legal Pages Policy Reconciliation

Last updated: 2026-07-03

Status: draft for Policy Owner / Privacy Owner approval.

Source reviewed:

- `C:\Users\User\Downloads\motoandco-legal-pages.html`
- Previous workspace copy: `motoandco-legal-pages.html`
- `docs/driver-safety-and-respectful-conduct-policy-draft.md`

Output:

- Source-code draft: `src/content/legal/motoandco-legal-pages.v2.html`
- Baseline draft copy: `baseline/v2.0/full-source/legal/MotoCo_Legal_Pages_v2.0_Draft.html`
- Runtime publication status page: `src/app/legal/page.tsx`
- Driver safety draft: `docs/driver-safety-and-respectful-conduct-policy-draft.md`

Control rule:

- The source-code draft and baseline draft copy must remain aligned.
- The `/legal` route must not publish the full legal copy until Policy Owner and Privacy Owner approval is recorded.

## Reconciliation Summary

The supplied legal pages were updated against the v2.0 baseline and current policy changes.

Changes made:

- Added draft v2.0 / pending Policy Owner and Privacy Owner approval wording.
- Changed booking cut-off wording to 12:30pm Brisbane time.
- Updated active supplier network to Link International, Gas Imports, McLeods, Whites Powersports, and A1 Accessories.
- Marked Ficeda as not part of the active pickup network.
- Replaced external accounting invoicing with portal-generated PDF invoices manually emailed by Admin.
- Removed specific unapproved late-payment/debt-recovery wording and replaced it with Admin review / approved credit-control process wording.
- Changed delivery completion to require receiver name and receiver signature.
- Removed GPS as a required POD item.
- Changed photos from mandatory to optional/exception-based only.
- Updated POD retention to 7 years from delivery date.
- Replaced legacy architecture language with Moto and Co portal, Vercel, Supabase, private proof storage, and Australia/Sydney database/storage wording subject to retained platform evidence.
- Updated access roles to Super Admin, Admin, Client Operational, Client Billing, Driver, and Receiver no-login.
- Updated retention wording for job, delivery, account, POD, billing, and operational records.
- Drafted a separate Driver Safety and Respectful Conduct legal document for review only. It has not been added to the public legal route set.

## Still Not Final

These legal pages are not approved for public publication until:

- Moto & Co Logistics Policy Owner role is assigned or formally authorised.
- Moto & Co Logistics Privacy Owner role is assigned or formally authorised.
- Australia/Sydney Supabase region evidence is retained.
- Auth/RLS, private Storage/POD, and production access-log UAT evidence is complete.
- Final customer-facing legal copy is reviewed by the relevant legal/privacy owner.
- Driver Safety and Respectful Conduct wording is approved for publication, including incident reporting, privacy/retention wording, service restriction consequences, and any WHSQ/police escalation boundary.
