# SOP-OPS-01 Offline Device Sync And Recovery

Version: 1.0  
Status: Active - written for V1 production testing  
Effective date: 2026-07-02  
Owner: Admin / Operations

## Purpose

Define what the Moto & Co Couriers portal does when a driver loses internet during a live run, and how the driver and Admin recover the work once internet returns.

## Scope

In scope:

- Driver pickup confirmation.
- Pickup item counting and price calculation.
- Bring-forward movement for a complete future order.
- Delivery sign-off and POD evidence capture.
- Run-close field updates.
- Local retry of failed live runtime writes.
- Admin review of unresolved sync problems.

Out of scope:

- Creating a new live order while the portal has not already loaded.
- Guaranteed background sync after the browser is closed.
- Cross-device visibility before the original driver device syncs.
- Reconstructing a lost or malformed signature image.
- SLA monitoring or Admin countdowns.

## Core Rule

Offline mode protects the driver device's copy of the work. It does not update the live production record until the same device reconnects and sync succeeds.

Clients, Admin, and other driver sessions may still see the older live status while a driver device has unsynced updates.

## Actors

- Driver: continues the run only from the already-loaded, signed-in driver portal.
- Admin: monitors exceptions, failed syncs, and manual recovery if the device cannot sync.
- System: saves local updates, queues live runtime writes, and retries when the device is online.
- Client Operational Contact: sees updated order state only after live sync succeeds.
- Client Billing Contact: sees delivered/POD/billing-ready state only after live sync succeeds.

## Procedure

| Phase | Actor | Action | Required Evidence / Result |
| --- | --- | --- | --- |
| 1 | Driver | Loads the driver portal while online before or during the run. | Current run data is available on the device. |
| 2 | System | Detects a live update failure or offline browser state. | Update is written to the local device queue. |
| 3 | Driver | Continues pickup, item count, bring-forward, delivery, POD, or run-close work from the loaded portal. | Device shows the local state change; live users may not see it yet. |
| 4 | System | Stores pending update in the device outbox. | `mc_live_sync_outbox` holds the pending live write and last error if any. |
| 5 | Driver | Keeps the device signed in and online when signal returns. | Sync banner shows pending count until cleared. |
| 6 | Driver/System | Uses automatic retry or the driver presses `Retry Sync`. | Successful rows are removed from the local outbox. |
| 7 | System | Sync succeeds. | Live runtime record updates; Client/Admin views can see the new state after refresh/sync. |
| 8 | System | Sync fails again. | Last sync issue is shown; pending count remains visible. |
| 9 | Admin | Reviews unresolved sync issue if the same device cannot clear it. | Admin records exception/recovery decision under APP-ADM-005. |

## Controls

- The driver portal displays a pending sync count when local updates have not reached the live runtime.
- The driver portal displays the last sync issue so Admin can see whether the blocker is network, browser data, signature encoding, Storage/RLS, or another write failure.
- Drivers must not clear saved device data unless Admin accepts that any unsynced local updates may be abandoned.
- Bad or malformed signature image data must not block order-status/proof metadata from syncing.
- Supabase Storage upload failure records proof metadata with a `storage_pending:*` status so Admin can investigate without losing the delivery workflow state.
- Manual Admin correction uses APP-ADM-005 exception evidence and must preserve the reason for correction.

## Records

- Local device outbox: `mc_live_sync_outbox`.
- Live runtime records: orders, proofs, exceptions, run closures, and related workflow fields.
- POD metadata: delivery proof record with receiver name, signature status, proof path when available, and storage upload status.
- Exception evidence: APP-ADM-005 record when Admin manually recovers or closes an unresolved sync issue.
- Audit evidence: APP-PRV-004 where the action changes production data or PII.

## Testing Requirements

The portal cannot be treated as V1 field-ready until these tests pass on the actual driver device/browser:

- Pickup while offline, reconnect, then Client sees `En Route`.
- POD while offline, reconnect, then Client sees `Delivered`.
- Signature upload failure does not block order status or proof metadata from syncing.
- `Retry Sync` clears a pending update after connectivity returns.
- Clearing saved device data is tested only with a disposable test order and is documented as abandoning local unsynced updates.
- Admin can identify and manually correct a stuck sync using APP-ADM-005 evidence.

## Open Gaps

- Minimum supported driver browser/device policy is not final.
- True PWA background sync or IndexedDB-backed offline storage is not implemented for V1.
- Production Supabase Storage policy and proof-object persistence still require live UAT.
- Formal Admin procedure for unrecoverable local outbox data needs a final operating decision.
- Retention/destruction period for local device cache needs Privacy Owner confirmation.
