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
  if (role === "driver") return ["orders", "proofs", "exceptions", "runClosures"].includes(domainKey);
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
    row.actorId,
    row.accountActorId,
    row.account_actor_id,
    row.clientActorId,
    row.client_actor_id,
    existingOwnerActorId,
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
  return new Set(compactValues([
    caller?.profile?.id,
    caller?.profile?.actor_id,
    caller?.profile?.account_id,
    caller?.profile?.driver_id,
    caller?.profile?.email,
    caller?.profile?.display_name,
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
    "profileId",
    "operationalProfileId",
    "billingProfileId",
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
  return Boolean(callerEmail && emails.includes(callerEmail));
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
    "pickupDriverId",
    "pickupDriverProfileId",
    "pickupDriverActorId",
  ]);
  if ([...rowValues, ...payloadValues].some((value) => callerIds.has(value))) return true;

  const callerEmail = normaliseText(caller?.profile?.email);
  const emails = [payload.driverEmail, payload.pickupDriverEmail, payload.email].map(normaliseText).filter(Boolean);
  if (callerEmail && emails.includes(callerEmail)) return true;

  const callerName = normaliseText(caller?.profile?.display_name);
  const driverNames = [payload.driverName, payload.name, payload.displayName].map(normaliseText).filter(Boolean);
  return Boolean(callerName && driverNames.includes(callerName));
}

function payloadIsUnassignedDriverPickupReady(payload: Record<string, unknown>) {
  const status = String(payload.status || "Pending");
  const pickupOutcome = String(payload.pickupOutcome || "");
  const driverId = String(payload.driverId || payload.assignedDriverId || payload.driverRecordId || "").trim();
  const terminal = ["Delivered", "Cancelled", "Failed Delivery", "No Pickup"].includes(status);
  const pickupCollected = ["Picked Up", "Brought Forward"].includes(pickupOutcome);
  const pickupReady = ["Pending", "Scheduled", "Received - Scheduled", "Received - Awaiting Dispatch", "Cut-off Adjusted", "Schedule Adjusted", "Brought Forward"].includes(status);
  return !terminal && !pickupCollected && pickupReady && !driverId;
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
    .select("application_role, status, actor_id")
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

  return { profile, roles };
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

    for (const record of records || []) {
      const domainKey = typeToKey[record.record_type];
      if (!domainKey) continue;
      const payload = (record.payload || {}) as Record<string, unknown>;
      if (!canReadRuntimeRecord(domainKey, record, payload, caller)) continue;
      snapshot[domainKey].push({
        ...payload,
        id: payload.id || record.local_id,
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
    return json(500, { error: error instanceof Error ? error.message : "Runtime snapshot failed." });
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
      .select("local_id, owner_actor_id, driver_profile_id")
      .eq("record_type", recordType)
      .in("local_id", localIds);
    if (existingError) throw existingError;

    const existingById = new Map((existingRows || []).map((row) => [row.local_id, row]));
    const payload = rows.map((row: Record<string, unknown>) => {
      const localId = runtimeRecordId(row || {});
      const existing = existingById.get(localId);
      return {
        record_type: recordType,
        local_id: localId,
        owner_actor_id: ownerActorForRow(row || {}, existing?.owner_actor_id || "", caller.profile.actor_id || ""),
        driver_profile_id: driverProfileForRow(row || {}, callerRole, caller.profile.id) || existing?.driver_profile_id || null,
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
    return json(500, { error: error instanceof Error ? error.message : "Runtime sync failed." });
  }
}
