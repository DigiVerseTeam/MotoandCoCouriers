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
  const message = readableRuntimeError(error);
  if (message.toLowerCase().includes("row-level security")) {
    return "Live server write was blocked by database policy. Check the production runtime service key and runtime_records access policy.";
  }
  return message || fallback;
}

function logRuntimeRouteError(method: string, error: unknown) {
  const message = runtimeErrorMessage(error);
  const stack = error instanceof Error ? error.stack : undefined;
  console.error(`[api/runtime-records:${method}] failed`, { message, stack });
}

function readableRuntimeError(error: unknown) {
  if (!error) return "";
  if (error instanceof Error) return String(error.message || "").trim();
  if (typeof error === "string") return error.trim();
  if (typeof error === "number" || typeof error === "boolean") return String(error);
  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = ["message", "error", "details", "hint", "code"]
      .map((key) => record[key])
      .filter((value) => typeof value === "string" || typeof value === "number")
      .map((value) => String(value).trim())
      .filter(Boolean);
    if (parts.length) return parts.join(" ");
    try {
      return JSON.stringify(error);
    } catch {
      return Object.prototype.toString.call(error);
    }
  }
  return String(error || "").trim();
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
  if (role === "client") return ["clients", "orders", "exceptions", "operationalNotices"].includes(domainKey);
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

function uniqueText(values: unknown[] = []) {
  const seen = new Set<string>();
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function uniqueUuids(values: unknown[] = []) {
  return uniqueText(values).filter(isUuid);
}

function mergeSupplierNames(existing: unknown, linked: unknown[] = []) {
  const existingNames = Array.isArray(existing)
    ? existing.map((value) => typeof value === "string" ? value : (value as Record<string, unknown> | null)?.name || (value as Record<string, unknown> | null)?.supplierName || "")
    : [];
  return uniqueText([...existingNames, ...linked]);
}

const clientProtectedTextFields = [
  "name",
  "businessName",
  "email",
  "phone",
  "address",
  "deliveryAddress",
  "accountId",
  "actorId",
  "actorCode",
  "contactId",
  "profileId",
  "operationalProfileId",
  "billingProfileId",
  "displayName",
  "accessRole",
  "supabaseRole",
  "relationshipStatus",
  "relationshipTier",
  "relationshipOwner",
  "riskLevel",
  "status",
];

const clientProtectedContactFields = ["id", "name", "email", "phone", "role", "roleTitle"];

function isBlankRuntimeValue(value: unknown) {
  if (Array.isArray(value)) return value.length === 0;
  if (value && typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
  return !String(value || "").trim();
}

function protectRuntimeField(next: Record<string, unknown>, existing: Record<string, unknown>, key: string) {
  if (isBlankRuntimeValue(next[key]) && !isBlankRuntimeValue(existing[key])) {
    next[key] = existing[key];
  }
}

function protectRuntimeContact(next: Record<string, unknown>, existing: Record<string, unknown>, key: string) {
  const existingContact = ((existing[key] || {}) as Record<string, unknown>) || {};
  const nextContact = ((next[key] || {}) as Record<string, unknown>) || {};
  if (!Object.keys(existingContact).length) return;
  const merged = { ...nextContact };
  for (const field of clientProtectedContactFields) protectRuntimeField(merged, existingContact, field);
  next[key] = merged;
}

function clientRecordCompletenessScore(record: Record<string, unknown> | undefined) {
  const payload = (((record as any)?.payload || record || {}) as Record<string, unknown>) || {};
  let score = 0;
  for (const key of ["businessName", "name", "email", "phone", "address", "deliveryAddress", "actorId", "accountId"]) {
    if (!isBlankRuntimeValue(payload[key])) score += 2;
  }
  for (const key of ["operationalContact", "billingContact"]) {
    const contact = ((payload[key] || {}) as Record<string, unknown>) || {};
    for (const field of ["name", "email", "phone"]) {
      if (!isBlankRuntimeValue(contact[field])) score += 1;
    }
  }
  score += mergeSupplierNames(payload.vendors, []).length;
  if (String(payload.relationshipStatus || payload.status || "").toLowerCase() === "active") score += 2;
  return score;
}

function preferredExistingClientRecord(primary: any, fallback: any) {
  if (!primary) return fallback;
  if (!fallback) return primary;
  return clientRecordCompletenessScore(fallback) > clientRecordCompletenessScore(primary) ? fallback : primary;
}

function protectClientPayloadForWrite(row: Record<string, unknown>, existing: any, callerRole: string) {
  if (callerRole !== "client") return row;
  const existingPayload = (((existing?.payload || {}) as Record<string, unknown>) || {});
  if (!Object.keys(existingPayload).length) return row;

  const next = { ...(row || {}) };
  for (const field of clientProtectedTextFields) protectRuntimeField(next, existingPayload, field);
  protectRuntimeContact(next, existingPayload, "operationalContact");
  protectRuntimeContact(next, existingPayload, "billingContact");

  const existingSuppliers = mergeSupplierNames(existingPayload.vendors, []);
  const nextSuppliers = mergeSupplierNames(next.vendors, []);
  if (!nextSuppliers.length && existingSuppliers.length) {
    next.vendors = existingSuppliers;
  }
  return next;
}

function supplierNameKey(name: unknown) {
  return String(name || "").trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
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

function callerAccountActorIds(caller: any) {
  const assignmentActorIds = (caller?.assignments || [])
    .filter((assignment: any) => ["client_ops", "client_operational", "client_billing"].includes(String(assignment?.application_role || "")))
    .map((assignment: any) => assignment?.actor_id);
  return uniqueUuids([
    caller?.profile?.account_id,
    caller?.profile?.actor_id,
    ...assignmentActorIds,
  ]);
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

  if (caller.roles?.has("client") && ["clients", "orders", "exceptions", "operationalNotices"].includes(domainKey)) {
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

async function supplierLinksByAccountActorId(supabase: AdminSupabaseClient) {
  const linksByAccount = new Map<string, string[]>();
  const { data: links, error: linkError } = await supabase
    .from("actor_supplier_links")
    .select("account_actor_id, supplier_actor_id");
  if (linkError) throw linkError;

  const supplierIds = uniqueText((links || []).map((link) => link.supplier_actor_id));
  if (!supplierIds.length) return linksByAccount;

  const { data: suppliers, error: supplierError } = await supabase
    .from("actors")
    .select("id, legal_name, trading_name, relationship_status")
    .in("id", supplierIds);
  if (supplierError) throw supplierError;

  const supplierNameById = new Map<string, string>();
  for (const supplier of suppliers || []) {
    if (supplier.relationship_status === "closed") continue;
    const name = String(supplier.trading_name || supplier.legal_name || "").trim();
    if (name) supplierNameById.set(String(supplier.id), name);
  }

  for (const link of links || []) {
    const accountActorId = String(link.account_actor_id || "").trim();
    const supplierName = supplierNameById.get(String(link.supplier_actor_id || ""));
    if (!accountActorId || !supplierName) continue;
    linksByAccount.set(accountActorId, mergeSupplierNames(linksByAccount.get(accountActorId), [supplierName]));
  }
  return linksByAccount;
}

async function relationalClientRowsForCaller(supabase: AdminSupabaseClient, caller: any, supplierLinks: Map<string, string[]>) {
  if (!caller.roles?.has("client") && !caller.roles?.has("billing")) return [];
  const accountActorIds = callerAccountActorIds(caller);
  if (!accountActorIds.length) return [];

  const { data: actors, error: actorError } = await supabase
    .from("actors")
    .select("id, legal_name, trading_name, relationship_status, delivery_address")
    .in("id", accountActorIds);
  if (actorError) throw actorError;

  const { data: contacts, error: contactError } = await supabase
    .from("contacts")
    .select("id, actor_id, contact_kind, full_name, email, phone")
    .in("actor_id", accountActorIds);
  if (contactError) throw contactError;

  return (actors || [])
    .filter((actor) => actor.relationship_status !== "closed")
    .map((actor) => {
      const actorContacts = (contacts || []).filter((contact) => contact.actor_id === actor.id);
      const operational = actorContacts.find((contact) => contact.contact_kind === "operational") || actorContacts[0] || {};
      const billing = actorContacts.find((contact) => contact.contact_kind === "billing") || operational;
      const active = actor.relationship_status === "active";
      return {
        id: String(actor.id),
        actorId: String(actor.id),
        accountId: String(actor.id),
        name: actor.trading_name || actor.legal_name,
        businessName: actor.trading_name || actor.legal_name,
        email: operational.email || caller.profile?.email || "",
        phone: operational.phone || billing.phone || "",
        address: actor.delivery_address || "",
        deliveryAddress: actor.delivery_address || "",
        status: active ? "Active" : actor.relationship_status === "suspended" ? "Suspended" : "Pending",
        courierEligible: active,
        vendors: mergeSupplierNames([], supplierLinks.get(String(actor.id)) || []),
        operationalContact: {
          id: operational.id || "",
          name: operational.full_name || actor.trading_name || actor.legal_name,
          email: operational.email || caller.profile?.email || "",
          phone: operational.phone || "",
        },
        billingContact: {
          id: billing.id || "",
          name: billing.full_name || operational.full_name || actor.trading_name || actor.legal_name,
          email: billing.email || operational.email || caller.profile?.email || "",
          phone: billing.phone || operational.phone || "",
        },
        runtimeSource: "actor_supplier_links_snapshot",
      };
    });
}

async function activeSupplierActorIdsByName(supabase: AdminSupabaseClient, names: string[]) {
  const wanted = new Set(names.map(supplierNameKey).filter(Boolean));
  if (!wanted.size) return [];
  const { data, error } = await supabase
    .from("actors")
    .select("id, legal_name, trading_name, relationship_status")
    .eq("actor_type", "supplier");
  if (error) throw error;
  return (data || [])
    .filter((actor) => actor.relationship_status !== "closed")
    .filter((actor) => wanted.has(supplierNameKey(actor.trading_name)) || wanted.has(supplierNameKey(actor.legal_name)))
    .map((actor) => actor.id);
}

async function syncClientSupplierLinks(supabase: AdminSupabaseClient, rows: Array<Record<string, unknown>>, caller: any) {
  const callerCanReplaceLinks = caller.roles?.has("admin") || caller.roles?.has("super_admin");
  for (const row of rows || []) {
    if (!Object.prototype.hasOwnProperty.call(row || {}, "vendors")) continue;
    const accountActorId = [
      row.actorId,
      row.accountActorId,
      row.account_actor_id,
      row.clientActorId,
      row.client_actor_id,
      caller.profile?.account_id,
      caller.profile?.actor_id,
    ].find(isUuid) as string | undefined;
    if (!accountActorId) continue;

    const supplierNames = mergeSupplierNames(row.vendors, []);
    if (!supplierNames.length) {
      if (callerCanReplaceLinks) {
        const { error: deleteError } = await supabase
          .from("actor_supplier_links")
          .delete()
          .eq("account_actor_id", accountActorId);
        if (deleteError) throw deleteError;
      }
      continue;
    }

    const supplierActorIds = await activeSupplierActorIdsByName(supabase, supplierNames);

    if (callerCanReplaceLinks) {
      const { error: deleteError } = await supabase
        .from("actor_supplier_links")
        .delete()
        .eq("account_actor_id", accountActorId);
      if (deleteError) throw deleteError;
    }

    if (!supplierActorIds.length) continue;
    const now = new Date().toISOString();
    const { error: upsertError } = await supabase
      .from("actor_supplier_links")
      .upsert(
        supplierActorIds.map((supplierActorId) => ({
          account_actor_id: accountActorId,
          supplier_actor_id: supplierActorId,
          client_confirmed_at: now,
          client_confirmed_by: caller.profile?.id || null,
        })),
        { onConflict: "account_actor_id,supplier_actor_id" },
      );
    if (upsertError) throw upsertError;
  }
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
    const supplierLinks = await supplierLinksByAccountActorId(supabase);
    const clientIdsSeen = new Set<string>();

    for (const record of records || []) {
      const domainKey = typeToKey[record.record_type];
      if (!domainKey) continue;
      const basePayload: Record<string, unknown> = {
        ...((record.payload || {}) as Record<string, unknown>),
        id: (record.payload || {})?.id || record.local_id,
      };
      const accountActorId = String(basePayload.actorId || basePayload.accountActorId || basePayload.account_actor_id || record.owner_actor_id || "").trim();
      const payload: Record<string, unknown> = domainKey === "orders"
        ? orderReconciledFromProof(basePayload, proofByOrderId.get(String(basePayload.id || record.local_id)))
        : domainKey === "clients"
          ? {
              ...basePayload,
              actorId: accountActorId || basePayload.actorId || "",
              accountId: basePayload.accountId || accountActorId || basePayload.id,
              vendors: mergeSupplierNames(basePayload.vendors, supplierLinks.get(accountActorId) || []),
            }
          : basePayload;
      if (!canReadRuntimeRecord(domainKey, record, payload, caller)) continue;
      if (domainKey === "clients") clientIdsSeen.add(String(payload.actorId || payload.id || ""));
      snapshot[domainKey].push({
        ...payload,
        actorId: payload.actorId || record.owner_actor_id || "",
        profileId: payload.profileId || record.driver_profile_id || "",
        liveUpdatedAt: record.updated_at,
      });
    }

    for (const client of await relationalClientRowsForCaller(supabase, caller, supplierLinks)) {
      if (clientIdsSeen.has(String(client.actorId || client.id || ""))) continue;
      snapshot.clients.push(client);
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
    logRuntimeRouteError("GET", error);
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

    const preparedRowsById = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      const safeRow = row || {};
      preparedRowsById.set(runtimeRecordId(safeRow), safeRow);
    }
    const preparedRows = [...preparedRowsById.entries()].map(([localId, row]) => ({ localId, row }));
    const localIds = preparedRows.map(({ localId }) => localId);
    const { data: existingRows, error: existingError } = await supabase
      .from("runtime_records")
      .select("local_id, owner_actor_id, driver_profile_id, payload")
      .eq("record_type", recordType)
      .in("local_id", localIds);
    if (existingError) throw existingError;

    const existingById = new Map((existingRows || []).map((row) => [row.local_id, row]));
    const existingClientByOwnerActor = new Map<string, any>();
    if (domainKey === "clients") {
      const ownerActorIds = uniqueText(
        preparedRows
          .map(({ row }) => ownerActorForRow(row || {}, "", caller.profile.actor_id || ""))
          .filter(isUuid)
      );
      if (ownerActorIds.length) {
        const { data: ownerRows, error: ownerError } = await supabase
          .from("runtime_records")
          .select("local_id, owner_actor_id, driver_profile_id, payload")
          .eq("record_type", recordType)
          .in("owner_actor_id", ownerActorIds);
        if (ownerError) throw ownerError;
        for (const row of ownerRows || []) {
          const ownerActorId = String(row.owner_actor_id || "").trim();
          if (!ownerActorId) continue;
          existingClientByOwnerActor.set(ownerActorId, preferredExistingClientRecord(existingClientByOwnerActor.get(ownerActorId), row));
        }
      }
    }

    const existingForWrite = (row: Record<string, unknown>, localId: string) => {
      const existing = existingById.get(localId);
      if (domainKey !== "clients") return existing;
      const ownerActorId = ownerActorForRow(row || {}, existing?.owner_actor_id || "", caller.profile.actor_id || "");
      return preferredExistingClientRecord(existing, ownerActorId ? existingClientByOwnerActor.get(ownerActorId) : undefined);
    };

    const deniedRow = preparedRows.find(({ row, localId }) => {
      const existing = existingForWrite(row || {}, localId);
      return !canWriteRuntimeRecord(domainKey, row || {}, existing, caller);
    });
    if (deniedRow) {
      return json(403, { error: `Caller is not permitted to update ${domainKey} record ${deniedRow.localId}.` });
    }

    const payload = preparedRows.map(({ row, localId }) => {
      const existing = existingForWrite(row || {}, localId);
      const storedRow = domainKey === "clients" ? protectClientPayloadForWrite(row || {}, existing, callerRole) : row || {};
      return {
        record_type: recordType,
        local_id: localId,
        owner_actor_id: ownerActorForRow(storedRow, existing?.owner_actor_id || "", caller.profile.actor_id || ""),
        driver_profile_id: driverProfileForRow(storedRow, callerRole, caller.profile.id) || (rowExplicitlyClearsDriverProfile(storedRow) ? null : existing?.driver_profile_id || null),
        payload: storedRow,
        updated_by: caller.profile.id,
        source_ref: "Moto & Co V1 server runtime sync",
      };
    });

    const { error } = await supabase
      .from("runtime_records")
      .upsert(payload, { onConflict: "record_type,local_id" });
    if (error) throw error;

    if (domainKey === "clients") {
      await syncClientSupplierLinks(supabase, rows, caller);
    }

    return json(200, { synced: payload.length });
  } catch (error) {
    logRuntimeRouteError("POST", error);
    return json(500, { error: runtimeErrorMessage(error, "Runtime sync failed.") });
  }
}
