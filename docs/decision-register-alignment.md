# Decisions Register Alignment

Source: `DECISIONS-REGISTER.html`

Date reviewed: 2026-06-21

All 24 pre-build user-journey gaps are decision-resolved by the decisions register. This page separates decision status from software/integration status so the build does not fill missing implementation details.

Hard scope now applied:

- SLA monitoring is outside the logistics portal. The portal records timestamps and evidence only.
- HCM requirements are outside the logistics portal. Driver legal/HCM material remains in `hcm-extract/` for a future HCM build.

| Gap | Decision Status | Portal Alignment |
| --- | --- | --- |
| 1 Address validation | Resolved | Integration pending: requires Google Maps API or equivalent plus approved SEQ geofence/postcode boundary. |
| 2 Admin new-registration email | Resolved | Integration pending: outbound email provider/send-domain required. |
| 3 Client review timeframe | Resolved | Portal copy aligned; confirmation email pending provider. |
| 4 Admin registration SLA | Resolved | Aligned as out of scope for portal SLA monitoring; timestamps only. |
| 5 Admin eligibility checklist | Resolved | Aligned: advisory checklist, no forced ticking. |
| 6 Activation confirmation step | Resolved | Aligned: direct Admin activation action. |
| 7 Activation notification | Resolved | Aligned: no activation notice; client logs in to check status. |
| 8 Rejected client re-registration | Resolved | Needs live Auth validation for same-email re-registration path. |
| 9 Rejection sender address | Resolved | Integration pending: no-reply sender requires email provider/domain setup. |
| 10 Suspended portal message | Resolved | Aligned: suspended clients see a clear suspension message. |
| 11 After cut-off notification | Resolved | Portal confirmation aligned; email pending provider. |
| 12 No next run date | Removed | Aligned: not treated as client-facing scenario. |
| 13 Pickup date field | Resolved | Aligned: simple date input retained as reference; system assigns next available run and blocks past dates. |
| 14 Driver availability capture | Resolved | Aligned for no driver self-confirmation; Admin operational availability records remain logistics scope. |
| 15 Run-planning failure fallback | Resolved | Aligned as manual fallback/exception evidence; no invented automation. |
| 16 No Pickup time constraint | Resolved | Aligned in runtime and Supabase draft migration. |
| 17 Redelivery fee queue | Resolved | Aligned: Admin exception queue review before invoice. |
| 18 Second delivery attempt | Resolved | Aligned: second attempt scheduled for next available run only. |
| 19 Overdue account SLA | Resolved | Aligned as out of scope for portal SLA monitoring; timestamps only. |
| 20 Payment arrangement fields | Resolved | Aligned: date, amount, agreeing contact, and written evidence reference captured. |
| 21 Reinstatement notification | Resolved | Local automatic notice record aligned; external delivery pending provider. |
| 22 Billing compilation trigger | Resolved | Aligned: Admin-triggered first. |
| 23 Admin unavailability | Resolved | Needs production role guard: minimum two active Admin users. |
| 24 Invoice dispatch trigger | Resolved | Aligned: Admin confirms invoice correct and dispatch is recorded automatically in the same action. |
