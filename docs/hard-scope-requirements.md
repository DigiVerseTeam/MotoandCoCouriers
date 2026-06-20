# Hard Scope Requirements

These requirements are build boundaries for the Moto and Co Couriers logistics portal.

## SLA Monitoring Is Out Of Scope

The logistics portal must not own Admin SLA monitoring.

Out of scope:

- SLA countdowns, timers, breach labels, overdue SLA states, or escalation clocks.
- Admin response SLA enforcement for registrations, disputes, overdue accounts, or exceptions.
- Runtime alerts that claim an Admin SLA has been missed.
- Database triggers that calculate Admin acknowledgement or resolution due dates for SLA monitoring.

In scope:

- Recording timestamps when a record is created, acknowledged, investigated, updated, or closed.
- The portal records timestamps only for Admin response history; it does not monitor SLA compliance.
- Showing source-backed policy timing context where it is needed for a decision, without monitoring it as a portal-owned SLA.
- Keeping SLA monitoring as an external HCM/SLA-monitoring responsibility.

## HCM Requirements Are Out Of Scope

The logistics portal must not own HCM requirements.

Out of scope:

- Driver legal classification.
- Driver agreements.
- Driver verification evidence that belongs to onboarding or employment/legal eligibility.
- Driver disciplinary/removal consequences.
- Employee/contractor classification, payment model, GST, or external-courier employment terms.

In scope:

- Logistics-facing driver identity, login, active/inactive operational status, dispatch assignment, vehicle assignment, run work, POD, and audit evidence needed to perform courier operations.
- Consuming a future HCM-owned operational status only if a separate HCM system later becomes the driver eligibility source.

Source boundary: `docs/hcm-boundary.md`.
