# HCM Repurpose Inventory

This folder preserves HCM-adjacent work that was originally built inside the Moto & Co logistics runtime before the product boundary was corrected.

These files are not production HCM software. Treat them as draft source material for a future HCM app or HCM module.

## Preserved Runtime Source

- `runtime/moto-co-logistics-hcm-source.tsx`
  - Contains the local Admin Drivers, driver verification, driver conduct, and conditional expansion UI/workflow material as it existed during the logistics build.
  - It is still embedded in the logistics component shape and must be redesigned for HCM roles, navigation, access control, data ownership, and source authority.

## Preserved Draft Supabase Migrations

- `supabase-migrations/202606190012_driver_record_governance_sop_jdd01.sql`
  - Draft driver record governance, engagement dates, retention, RLS, and audit structure.

- `supabase-migrations/202606190021_conditional_driver_courier_policy_gates.sql`
  - Draft conditional Policy #25/#26 activation review structure.

- `supabase-migrations/202606190022_driver_verification_policy13.sql`
  - Draft driver verification evidence and dispatch guard structure.

- `supabase-migrations/202606190023_driver_conduct_policy19.sql`
  - Draft driver conduct reporting and investigation guard structure.

## HCM Redesign Needed

- Confirm HCM actors and access model.
- Confirm whether HCM owns driver eligibility, legal classification, agreement records, verification evidence, conduct investigation, and expansion approvals.
- Replace logistics navigation and dispatch assumptions with HCM workflows.
- Define HCM retention, privacy, audit, and data residency requirements.
- Decide whether logistics should later consume a simple HCM-owned driver eligibility/status feed.
