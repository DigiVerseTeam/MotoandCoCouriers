# Legacy App Reference Notes

Last updated: 2026-06-18

## Files Checked

- `moto-co-logistics.jsx`
- `C:\Users\User\Downloads\gcm-workshop-platform_1.jsx`

## GCM Workshop App Patterns Worth Reusing

- Operational dashboard with stage counts and today's workload.
- Pipeline board where work changes state through direct controls.
- Calendar/run-style view with assigned work blocks.
- Job-card detail surface with accountable actions and progress.
- Invoice review surface tied to completed operational work.
- Contacts/customer history table.

## Reused In The Moto & Co Local Build

- Admin now has an interactive Dispatch assignment surface instead of a one-click workflow label.
- Dispatch assignment requires a named driver and named vehicle before a stop appears to the Driver.
- Driver run visibility is scoped to the assigned driver's stops.
- The local Supabase schema now has guardrails for dispatch assignment and manual driver availability records.
- Client supplier setup and Admin supplier access are operational actions, not static journey text.
- The old dark logistics-app visual shell has been replaced with the Moto and Co Couriers software canvas, approved logo, and source-backed supplier/workshop-support language.

## Not Reused

- Workshop service checklists, parts search, labour entry, motorcycle service stages, live Zoho calls, and AI assistant prompts are not Moto & Co courier requirements.
- Route optimisation, supplier sequencing, and production driver availability automation remain gaps until confirmed from BOAS/SOP owner decisions.
