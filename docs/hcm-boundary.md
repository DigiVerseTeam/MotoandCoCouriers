# HCM Boundary

Last updated: 2026-06-19

This note records the corrected product boundary after review with the user.

The Moto and Co Couriers logistics app does not own driver legal classification, driver agreements, driver legal verification evidence, disciplinary/removal consequences, or driver/courier expansion employment/payment models. Those items are HCM requirements and have been extracted for a future HCM system.

## Preserved For HCM

Draft source material has been preserved under `hcm-extract/` so it can be repurposed later:

- `hcm-extract/runtime/moto-co-logistics-hcm-source.tsx`
- `hcm-extract/supabase-migrations/202606190012_driver_record_governance_sop_jdd01.sql`
- `hcm-extract/supabase-migrations/202606190021_conditional_driver_courier_policy_gates.sql`
- `hcm-extract/supabase-migrations/202606190022_driver_verification_policy13.sql`
- `hcm-extract/supabase-migrations/202606190023_driver_conduct_policy19.sql`

These files are not part of the active logistics runtime, active Supabase migration set, or TypeScript build.

## Logistics Scope

The logistics app keeps only driver account and run-operating data needed for courier operations:

- Driver directory name, email, phone, status, review date, and logistics notes.
- Policy #22 driver availability records, notice evidence, late notice flag, contingency plan, and dispatch blocking for unavailable or leave status.
- Dispatch selection of a named driver and Admin-managed vehicle, with fleet compliance checks.
- Driver run workflow, supplier pickup workflow, delivery proof, exception reporting, billing, audit, retention, and CRM/admin operations.

If a future HCM system becomes the source of driver eligibility, the logistics app should receive only an approved operational status such as `assignable` or `not_assignable`, plus a reason code approved for logistics display. It should not store or adjudicate HCM legal evidence.
