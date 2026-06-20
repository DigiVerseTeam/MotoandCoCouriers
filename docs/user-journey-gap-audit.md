# User Journey Gap Audit

Audit date: 2026-06-21

Source artifacts reviewed:

- `customer journey.zip`
- `user journeys and gaps.zip`
- `user journeys and gaps.zip/UJ-AllJourneys.zip`
- `UJ-CRM-001-ClientRegistration.html`
- `DECISIONS-REGISTER.html`

Implementation audited:

- Runtime source in `src/components/moto-co-logistics.tsx`
- Supabase migrations in `supabase/migrations`
- Evidence docs in `docs/customer-journey-comparison.md`, `docs/build-gaps.md`, `docs/production-blocker-register.md`, and `docs/decision-register-alignment.md`

The decisions register resolves all 24 pre-build user-journey gaps as business decisions. This audit separates decision resolution from integration status so the portal does not pretend that missing providers or live Auth rules are already configured.

Hard scope:

- SLA monitoring is outside the logistics portal. The portal records timestamps and evidence only.
- HCM requirements are outside the logistics portal.

Summary:

| Status | Count |
| --- | ---: |
| Decision resolved | 24 |
| Portal/runtime aligned | 16 |
| Integration or live Auth/role guard pending | 8 |
| Open business decision | 0 |
| Total | 24 |

## Gap Register Audit

| # | Source gap | Current state | Remaining action |
| ---: | --- | --- | --- |
| 1 | Address validation at entry | Decision resolved: Google Maps API or equivalent. | Configure API/provider plus approved SEQ geofence/postcode boundary. |
| 2 | Admin new-registration notification | Decision resolved: email to Admin. | Configure outbound email provider/send-domain. |
| 3 | Client-facing review timeline | Portal copy aligned to 3 business days. | Confirmation email waits on provider. |
| 4 | Admin registration SLA | Hard-scoped out of portal SLA monitoring. | External HCM/SLA monitoring owner only. |
| 5 | Admin checklist mandatory/advisory | Runtime aligned: advisory checklist, no forced ticking. | None for V1. |
| 6 | Activation confirmation step | Runtime aligned: direct action. | None for V1. |
| 7 | Activation notification | Runtime aligned: no activation notice; client checks status by logging in. | None for V1. |
| 8 | Rejected client re-registration | Decision resolved: same-email re-registration permitted. | Validate live Supabase Auth/profile behavior for same-email re-registration. |
| 9 | Rejection sender | Decision resolved: no-reply sender. | Configure provider/domain/template. |
| 10 | Suspended client message | Runtime aligned: clear suspension message. | None for V1. |
| 11 | After-cut-off notification | Portal confirmation aligned. | Email waits on provider. |
| 12 | No next run date | Removed by decision register. | None for V1. |
| 13 | Pickup date field | Runtime aligned: simple date input, past-date blocked, next run assigned. | None for V1. |
| 14 | Driver availability capture | Runtime aligned: no driver self-confirmation; Admin operational availability remains logistics scope. | None for V1 unless daily self-confirmation is later introduced. |
| 15 | Run-planning failure fallback | Manual fallback/exception evidence aligned. | Production operating owner/process evidence still needed before automation claims. |
| 16 | Time constraint No Pickup | Runtime and migration aligned with `time_constraint`. | None for V1. |
| 17 | Redelivery fee queue | Runtime aligned: APP-ADM-005 exception review. | None for V1. |
| 18 | Second delivery attempt timing | Runtime aligned: second attempt scheduled for next available run only. | None for V1. |
| 19 | Overdue account SLA | Hard-scoped out of portal SLA monitoring. | External HCM/SLA monitoring owner only. |
| 20 | Payment arrangement fields | Runtime aligned: agreed date, amount, contact, written evidence reference. | None for V1. |
| 21 | Reinstatement notification | Runtime aligned locally: automatic notice record on Admin action. | External delivery waits on provider. |
| 22 | Billing compilation trigger | Runtime aligned: Admin-triggered. | Future automation deferred. |
| 23 | Admin unavailable/substitute | Decision resolved: at least two active Admin users. | Implement/verify production role guard requiring minimum two active Admin users. |
| 24 | Invoice dispatch trigger | Runtime aligned: Admin confirms invoice correct and dispatch is recorded automatically. | External provider/accounting dispatch remains production integration work. |
