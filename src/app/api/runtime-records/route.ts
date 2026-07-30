import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type AdminSupabaseClient = SupabaseClient<any, "public", any>;

const runtimeDomains: Record<string, string> = {
  clients: "client",
  suppliers: "supplier",
  drivers: "driver",
  vehicles: "vehicle",
  priceRules: "price_rule",
  orders: "order",
  proofs: "delivery_proof",
  exceptions: "exception",
  audit: "audit",
  invoices: "invoice",
  billingNotices: "billing_notice",
  operationalNotices: "operational_notice",
  runClosures: "run_close",
  masterDataChanges: "master_data_change",
  exceptionAlerts: "exception_alert",
  driverAvailability: "driver_availability",
  financialReconciliations: "financial_reconciliation",
  aiDrafts: "ai_draft",
  dataBreachIncidents: "data_breach_incident",
  dataUseRecords: "data_use_record",
  privacyRequests: "privacy_request",
};

function json(status: number, payload: Record<string, unknown>) {
  return NextResponse.json(payload, { status });
}

function runtimeErrorMessage(error: unknown, fallback = "Runtime sync failed.") {
  const message = error instanceof Error ? error.message : String(error || "");
  if (message.toLowerCase().includes("row-level security")) {
    return "Live server write was blocked by database policy. Check the production runtime service key and runtime_records access policy.";
  }
  return message || fallback;
}

function serviceClient(): AdminSupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normaliseRole(value: unknown) {
  const role = String(value || "").trim().toLowerCase();
  if (role === "client_ops" || role === "client_operational" || role === "client") return "client";
  if (role === "client_billing" || role === "billing") return "billing";
  if (role === "super_admin") return "super_admin";
  if (role === "admin") return "admin";
  if (role === "driver") return "driver";
  return "";
}

function canSyncDomainForRole(domainKey: string, role: string) {
  if (!role) return false;
  if (role === "admin" || role === "super_admin") return true;
  if (role === "client") return ["orders", "exceptions", "operationalNotices"].includes(domainKey);
  if (role === "billing") return ["exceptions", "billingNotices"].includes(domainKey);
  if (role === "driver") return ["orders", "proofs", "exceptions", "runClosures", "operationalNotices"].includes(domainKey);
  return false;
}

function isUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function normaliseText(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function compactValues(values: unknown[] = []) {
  return values.map((value) => String(value || "").trim()).filter(Boolean);
}

function runtimeRecordId(row: Record<string, unknown>) {
  const id = row?.id || row?.localId || row?.local_id || row?.code || row?.email;
  return id ? String(id) : `runtime-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ownerActorForRow(row: Record<string, unknown>, existingOwnerActorId = "", callerActorId = "") {
  const candidates = [
    row.account_actor_id,
    row.clientActorId,
    row.client_actor_id,
    row.accountActorId,
    existingOwnerActorId,
    row.actorId,
    callerActorId,
  ];
  return candidates.find(isUuid) as string | undefined || null;
}

function driverProfileForRow(row: Record<string, unknown>, callerRole = "", callerProfileId = "") {
  const candidates = [
    row.driverProfileId,
    row.driver_profile_id,
    row.profileId,
    callerRole === "driver" ? callerProfileId : "",
  ];
  return candidates.find(isUuid) as string | undefined || null;
}

function rowExplicitlyClearsDriverProfile(row: Record<string, unknown>) {
  return ["driverProfileId", "driver_profile_id"].some((key) =>
    Object.prototype.hasOwnProperty.call(row, key) && !String(row[key] || "").trim()
  );
}

function emptySnapshot() {
  return Object.fromEntries(Object.keys(runtimeDomains).map((key) => [key, []]));
}

function priceRuleFromRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    serviceVariant: row.service_variant,
    label: row.label,
    itemType: row.item_type,
    tyreCountMin: row.tyre_count_min,
    tyreCountMax: row.tyre_count_max,
    weightBand: row.weight_band,
    rateCents: row.rate_cents,
    rateMode: row.rate_mode,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    status: row.status || "active",
    changeLogId: row.change_log_id,
  };
}

function callerIdentityValues(caller: any) {
  const assignmentValues = (caller?.assignments || []).flatMap((assignment: any) => [
    assignment?.actor_id,
    assignment?.actor_code,
    assignment?.contact_id,
  ]);
  return new Set(compactValues([
    caller?.profile?.id,
    caller?.profile?.actor_id,
    caller?.profile?.account_id,
    caller?.profile?.driver_id,
    caller?.profile?.email,
    caller?.profile?.display_name,
    ...assignmentValues,
  ]));
}

function payloadIdentityValues(payload: Record<string, unknown>, keys: string[]) {
  return compactValues(keys.map((key) => payload[key]));
}

function rowMatchesClientScope(row: Record<string, unknown>, payload: Record<string, unknown>, caller: any) {
  const callerIds = callerIdentityValues(caller);
  const rowValues = compactValues([row.owner_actor_id]);
  const payloadValues = payloadIdentityValues(payload, [
    "actorId",
    "accountActorId",
    "account_actor_id",
    "clientActorId",
    "client_actor_id",
    "clientId",
    "accountId",
    "accountName",
    "profileId",
    "operationalProfileId",
    "billingProfileId",
    "clientName",
    "businessName",
    "name",
  ]);
  if ([...rowValues, ...payloadValues].some((value) => callerIds.has(value))) return true;

  const callerEmail = normaliseText(caller?.profile?.email);
  const emails = [
    payload.email,
    payload.clientEmail,
    payload.operationalEmail,
    payload.billingEmail,
    (payload.operationalContact as Record<string, unknown> | undefined)?.email,
    (payload.billingContact as Record<string, unknown> | undefined)?.email,
  ].map(normaliseText).filter(Boolean);
  if (callerEmail && emails.includes(callerEmail)) return true;

  const callerNames = [
    caller?.profile?.display_name,
    ...(caller?.assignments || []).map((assignment: any) => assignment?.actor_code),
  ].map(normaliseText).filter(Boolean);
  const payloadNames = [
    payload.clientName,
    payload.businessName,
    payload.accountName,
    payload.name,
  ].map(normaliseText).filter(Boolean);
  return payloadNames.some((name) => callerNames.includes(name));
}

function rowMatchesDriverScope(row: Record<string, unknown>, payload: Record<string, unknown>, caller: any) {
  const callerIds = callerIdentityValues(caller);
  const rowValues = compactValues([row.driver_profile_id]);
  const payloadValues = payloadIdentityValues(payload, [
    "driverId",
    "assignedDriverId",
    "driverRecordId",
    "driverProfileId",
    "driver_profile_id",
    "profileId",
    "driverActorId",
    "driver_actor_id",
    "driverCode",
    "assignedDriverCode",
    "driverActorCode",
    "driver_actor_code",
    "driverContactId",
    "driver_contact_id",
    "pickupDriverId",
    "pickupDriverProfileId",
    "pickupDriverActorId",
    "pickupDriverCode",
    "pickupDriverActorCode",
    "pickup_driver_actor_code",
    "pickupDriverContactId",
  ]);
  if ([...rowValues, ...payloadValues].some((value) => callerIds.has(value))) return true;

  const callerEmail = normaliseText(caller?.profile?.email);
  const emails = [payload.driverEmail, payload.assignedDriverEmail, payload.pickupDriverEmail, payload.email].map(normaliseText).filter(Boolean);
  if (callerEmail && emails.includes(callerEmail)) return true;

  const callerName = normaliseText(caller?.profile?.display_name);
  const driverNames = [payload.driverName, payload.assignedDriverName, payload.pickupDriverName, payload.name, payload.displayName].map(normaliseText).filter(Boolean);
  return Boolean(callerName && driverNames.includes(callerName));
}

function payloadIsUnassignedDriverPickupReady(payload: Record<string, unknown>) {
  const status = String(payload.status || "Pending");
  const pickupOutcome = String(payload.pickupOutcome || "");
  const driverAssignment = compactValues([
    payload.driverId,
    payload.assignedDriverId,
    payload.driverRecordId,
    payload.driverProfileId,
    payload.driver_profile_id,
    payload.profileId,
    payload.driverActorId,
    payload.driver_actor_id,
    payload.driverCode,
    payload.assignedDriverCode,
    payload.driverActorCode,
    payload.driver_actor_code,
    payload.driverContactId,
    payload.driver_contact_id,
    payload.pickupDriverId,
    payload.pickupDriverProfileId,
    payload.pickupDriverActorId,
    payload.pickupDriverCode,
    payload.pickupDriverActorCode,
    payload.pickup_driver_actor_code,
    payload.pickupDriverContactId,
    payload.driverEmail,
    payload.assignedDriverEmail,
    payload.pickupDriverEmail,
    payload.driverName,
    payload.assignedDriverName,
    payload.pickupDriverName,
  ]);
  const compiledRun = String(payload.runId || payload.runCompiledAt || payload.runCompiledBy || "").trim();
  const terminal = ["Delivered", "Cancelled", "Failed Delivery", "No Pickup"].includes(status);
  const pickupCollected = ["Picked Up", "Brought Forward"].includes(pickupOutcome);
  const pickupReady = ["Pending", "Scheduled", "Received - Scheduled", "Received - Awaiting Dispatch", "Cut-off Adjusted", "Schedule Adjusted", "Brought Forward"].includes(status);
  return !terminal && !pickupCollected && pickupReady && !driverAssignment.length && !compiledRun;
}

function canReadRuntimeRecord(domainKey: string, row: Record<string, unknown>, payload: Record<string, unknown>, caller: any) {
  if (caller.roles?.has("admin") || caller.roles?.has("super_admin")) return true;
  if (["suppliers", "priceRules"].includes(domainKey)) return true;

  if (caller.roles?.has("driver")) {
    if (domainKey === "orders") return rowMatchesDriverScope(row, payload, caller) || payloadIsUnassignedDriverPickupReady(payload);
    if (domainKey === "drivers") return rowMatchesDriverScope(row, payload, caller);
    if (domainKey === "vehicles") return true;
    if (["proofs", "exceptions", "runClosures"].includes(domainKey)) return rowMatchesDriverScope(row, payload, caller);
  }

  if (caller.roles?.has("client") && ["clients", "orders", "exceptions", "operationalNotices"].includes(domainKey)) {
    return rowMatchesClientScope(row, payload, caller);
  }

  if (caller.roles?.has("billing") && ["clients", "invoices", "billingNotices", "exceptions"].includes(domainKey)) {
    return rowMatchesClientScope(row, payload, caller);
  }

  return false;
}

function canWriteRuntimeRecord(domainKey: string, row: Record<string, unknown>, existing: Record<string, unknown> | undefined, caller: any) {
  if (caller.roles?.has("admin") || caller.roles?.has("super_admin")) return true;

  const existingPayload = ((existing?.payload || {}) as Record<string, unknown>) || {};
  const payloadForScope = { ...existingPayload, ...(row || {}) };
  const rowForScope = { ...(existing || {}), ...(row || {}) };

  if (caller.roles?.has("driver")) {
    if (domainKey === "orders") {
      return rowMatchesDriverScope(rowForScope, payloadForScope, caller) || payloadIsUnassignedDriverPickupReady(payloadForScope);
    }
    if (["proofs", "exceptions", "runClosures", "operationalNotices"].includes(domainKey)) {
      return rowMatchesDriverScope(rowForScope, payloadForScope, caller);
    }
  }

  if (caller.roles?.has("client") && ["orders", "exceptions", "operationalNotices"].includes(domainKey)) {
    return rowMatchesClientScope(rowForScope, payloadForScope, caller);
  }

  if (caller.roles?.has("billing") && ["exceptions", "billingNotices"].includes(domainKey)) {
    return rowMatchesClientScope(rowForScope, payloadForScope, caller);
  }

  return false;
}

function proofHasDeliveryEvidence(proof: Record<string, unknown>) {
  return Boolean(
    proof?.receiverName &&
    (proof?.signatureUrl || proof?.signaturePath || proof?.storage)
  );
}

function proofLinkedOrderIds(proof: Record<string, unknown>) {
  const ids = new Set<string>();
  const groupOrderIds = Array.isArray(proof.groupOrderIds)
    ? proof.groupOrderIds
    : Array.isArray(proof.group_order_ids)
      ? proof.group_order_ids
      : [];
  for (const id of groupOrderIds) {
    if (id) ids.add(String(id));
  }
  if (proof.orderId) ids.add(String(proof.orderId));
  if (proof.order_id) ids.add(String(proof.order_id));
  return [...ids];
}

function timestampValue(value: unknown) {
  const time = Date.parse(String(value || ""));
  return Number.isFinite(time) ? time : 0;
}

function newestProof(existing: Record<string, unknown> | undefined, next: Record<string, unknown>) {
  if (!existing) return next;
  const existingAt = timestampValue(existing.deliveredAt || existing.capturedAt || existing.liveUpdatedAt);
  const nextAt = timestampValue(next.deliveredAt || next.capturedAt || next.liveUpdatedAt);
  return nextAt >= existingAt ? next : existing;
}

function deliveryProofsByOrderId(records: any[] = []) {
  const proofs = new Map<string, Record<string, unknown>>();
  for (const record of records || []) {
    if (record.record_type !== "delivery_proof") continue;
    const proof = {
      ...((record.payload || {}) as Record<string, unknown>),
      id: (record.payload || {})?.id || record.local_id,
      liveUpdatedAt: record.updated_at,
    };
    if (!proofHasDeliveryEvidence(proof)) continue;
    for (const orderId of proofLinkedOrderIds(proof)) {
      proofs.set(orderId, newestProof(proofs.get(orderId), proof));
    }
  }
  return proofs;
}

function orderReconciledFromProof(order: Record<string, unknown>, proof?: Record<string, unknown>) {
  if (!proof) return order;
  const deliveredAt = proof.deliveredAt || proof.capturedAt || order.deliveredAt || order.deliveryCompletedAt || "";
  return {
    ...order,
    status: "Delivered",
    proofId: order.proofId || proof.id || "",
    deliveryProofId: order.deliveryProofId || proof.id || "",
    recvName: order.recvName || proof.receiverName || "",
    sig: order.sig || proof.signatureUrl || "",
    signaturePath: order.signaturePath || proof.signaturePath || "",
    storage: order.storage || proof.storage || "",
    deliveryId: order.deliveryId || proof.deliveryId || "",
    deliveryStopKey: order.deliveryStopKey || proof.deliveryStopKey || "",
    deliveredAt,
    deliveryCompletedAt: order.deliveryCompletedAt || deliveredAt,
    deliveryCompletionSource: order.deliveryCompletionSource || "SOP-DEL-05 delivery_proof reconciliation",
    deliveryCompletedBy: order.deliveryCompletedBy || "system",
    billingReady: order.billingReady ?? true,
    billingReadyAt: order.billingReadyAt || deliveredAt,
    billingReadySource: order.billingReadySource || "SOP-DEL-05",
    price: order.price ?? proof.price ?? order.pickupCalculatedPrice ?? null,
  };
}

async function callerContext(request: NextRequest, supabase: AdminSupabaseClient) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { error: json(401, { error: "Missing live sign-in session." }) };

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user?.id) return { error: json(401, { error: "Invalid live sign-in session." }) };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, status, actor_id, account_id, driver_id")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile || profile.status !== "active") return { error: json(403, { error: "Caller is not an active Moto & Co user." }) };

  const { data: assignments, error: assignmentError } = await supabase
    .from("access_role_assignments")
    .select("application_role, status, actor_id, actor_code, contact_id")
    .eq("profile_id", profile.id);
  if (assignmentError) throw assignmentError;

  const roles = new Set<string>();
  const profileRole = normaliseRole(profile.role);
  if (profileRole) roles.add(profileRole);
  for (const assignment of assignments || []) {
    if (assignment.status !== "active") continue;
    const role = normaliseRole(assignment.application_role);
    if (role) roles.add(role);
  }
  if (roles.has("super_admin")) roles.add("admin");

  return { profile, roles, assignments: assignments || [] };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = serviceClient();
    if (!supabase) return json(500, { error: "Server-side runtime sync is not configured." });

    const caller = await callerContext(request, supabase);
    if ("error" in caller) return caller.error;

    const snapshot = emptySnapshot() as Record<string, unknown[]>;
    const typeToKey = Object.fromEntries(Object.entries(runtimeDomains).map(([key, type]) => [type, key]));
    const { data: records, error } = await supabase
      .from("runtime_records")
      .select("record_type, local_id, payload, owner_actor_id, driver_profile_id, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const proofByOrderId = deliveryProofsByOrderId(records || []);

    for (const record of records || []) {
      const domainKey = typeToKey[record.record_type];
      if (!domainKey) continue;
      const basePayload: Record<string, unknown> = {
        ...((record.payload || {}) as Record<string, unknown>),
        id: (record.payload || {})?.id || record.local_id,
      };
      const payload: Record<string, unknown> = domainKey === "orders"
        ? orderReconciledFromProof(basePayload, proofByOrderId.get(String(basePayload.id || record.local_id)))
        : basePayload;
      if (!canReadRuntimeRecord(domainKey, record, payload, caller)) continue;
      snapshot[domainKey].push({
        ...payload,
        actorId: payload.actorId || record.owner_actor_id || "",
        profileId: payload.profileId || record.driver_profile_id || "",
        liveUpdatedAt: record.updated_at,
      });
    }

    const { data: priceRows, error: priceError } = await supabase
      .from("price_rules")
      .select("id, service_variant, label, item_type, tyre_count_min, tyre_count_max, weight_band, rate_cents, rate_mode, effective_from, effective_to, status, change_log_id")
      .eq("status", "active")
      .order("effective_from", { ascending: true });
    if (priceError) throw priceError;
    if (!snapshot.priceRules.length && priceRows?.length) {
      snapshot.priceRules = priceRows.map(priceRuleFromRow);
    }

    return json(200, { snapshot });
  } catch (error) {
    return json(500, { error: runtimeErrorMessage(error, "Runtime snapshot failed.") });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = serviceClient();
    if (!supabase) return json(500, { error: "Server-side runtime sync is not configured." });

    const caller = await callerContext(request, supabase);
    if ("error" in caller) return caller.error;

    const body = await request.json();
    const domainKey = String(body.domainKey || body.domain || "").trim();
    const recordType = runtimeDomains[domainKey];
    const rows: Array<Record<string, unknown>> = Array.isArray(body.rows) ? body.rows : [];
    if (!recordType) return json(400, { error: "Unknown runtime domain." });
    if (!rows.length) return json(400, { error: "No runtime records supplied." });

    const callerRole = [...caller.roles].find((role) => canSyncDomainForRole(domainKey, role)) || "";
    if (!callerRole) return json(403, { error: "This role cannot update that runtime domain." });

    const localIds = rows.map((row: Record<string, unknown>) => runtimeRecordId(row || {}));
    const { data: existingRows, error: existingError } = await supabase
      .from("runtime_records")
      .select("local_id, owner_actor_id, driver_profile_id, payload")
      .eq("record_type", recordType)
      .in("local_id", localIds);
    if (existingError) throw existingError;

    const existingById = new Map((existingRows || []).map((row) => [row.local_id, row]));
    const deniedRow = rows.find((row: Record<string, unknown>) => {
      const localId = runtimeRecordId(row || {});
      const existing = existingById.get(localId);
      return !canWriteRuntimeRecord(domainKey, row || {}, existing, caller);
    });
    if (deniedRow) {
      return json(403, { error: `Caller is not permitted to update ${domainKey} record ${runtimeRecordId(deniedRow || {})}.` });
    }

    const payload = rows.map((row: Record<string, unknown>) => {
      const localId = runtimeRecordId(row || {});
      const existing = existingById.get(localId);
      return {
        record_type: recordType,
        local_id: localId,
        owner_actor_id: ownerActorForRow(row || {}, existing?.owner_actor_id || "", caller.profile.actor_id || ""),
        driver_profile_id: driverProfileForRow(row || {}, callerRole, caller.profile.id) || (rowExplicitlyClearsDriverProfile(row || {}) ? null : existing?.driver_profile_id || null),
        payload: row || {},
        updated_by: caller.profile.id,
        source_ref: "Moto & Co V1 server runtime sync",
      };
    });

    const { error } = await supabase
      .from("runtime_records")
      .upsert(payload, { onConflict: "record_type,local_id" });
    if (error) throw error;

    return json(200, { synced: payload.length });
  } catch (error) {
    return json(500, { error: runtimeErrorMessage(error, "Runtime sync failed.") });
  }
}
