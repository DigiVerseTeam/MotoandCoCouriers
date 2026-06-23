// @ts-nocheck

import { createBrowserSupabaseClient, getBrowserSupabaseEnvironmentStatus } from "@/lib/supabase";

export const liveRuntimeDomains = {
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

const allSnapshotKeys = Object.keys(liveRuntimeDomains);
const LIVE_AUTH_RETURN_PATH_KEY = "motoCoLiveAuthReturnPath";
const PRODUCTION_SITE_ORIGIN = "https://motoandcocouriers.vercel.app";
let liveAuthRedirectPromise = null;
let liveAuthRedirectCompletedHref = "";

export function getLiveRuntimeStatus() {
  const status = getBrowserSupabaseEnvironmentStatus();
  return {
    ...status,
    enabled: status.ok,
    label: status.ok
      ? `Live ${status.supabaseEnv} system`
      : "Local runtime",
  };
}

function client() {
  return createBrowserSupabaseClient();
}

function normaliseEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

export function safeLiveAuthReturnPath(value = "/") {
  const raw = String(value || "/").trim();
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  try {
    const parsed = new URL(raw, "https://motoandco.local");
    if (parsed.origin !== "https://motoandco.local") return "/";
    if (parsed.pathname.startsWith("/auth/callback")) return "/";
    if (parsed.pathname === "/login") return "/";
    const allowedPaths = ["/", "/portal", "/booking", "/tracking", "/admin", "/driver"];
    if (!allowedPaths.includes(parsed.pathname)) return "/";
    return `${parsed.pathname}${parsed.search || ""}`;
  } catch {
    return "/";
  }
}

function currentBrowserReturnPath() {
  if (typeof window === "undefined") return "/";
  return safeLiveAuthReturnPath(`${window.location.pathname || "/"}${window.location.search || ""}`);
}

function publicSiteOrigin() {
  const configured = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  const appEnv = String(process.env.NEXT_PUBLIC_APP_ENV || "").trim().toLowerCase();
  const supabaseEnv = String(process.env.NEXT_PUBLIC_SUPABASE_ENV || "").trim().toLowerCase();
  const browserOrigin = typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";
  const productionLiveRuntime = appEnv === "production" || supabaseEnv === "production";

  if (configured) return configured;
  if (productionLiveRuntime) return PRODUCTION_SITE_ORIGIN;
  return browserOrigin || configured;
}

function liveAuthCallbackUrl(returnPath = "/") {
  const origin = publicSiteOrigin();
  if (!origin) return undefined;
  const next = safeLiveAuthReturnPath(returnPath);
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function readStoredLiveAuthReturnPath(fallback = "/") {
  if (typeof window === "undefined") return safeLiveAuthReturnPath(fallback);
  try {
    return safeLiveAuthReturnPath(window.sessionStorage.getItem(LIVE_AUTH_RETURN_PATH_KEY) || fallback);
  } catch {
    return safeLiveAuthReturnPath(fallback);
  }
}

export async function completeLiveAuthRedirect() {
  if (typeof window === "undefined") return "";
  const supabase = client();
  if (!supabase) return "";

  const url = new URL(window.location.href);
  const next = safeLiveAuthReturnPath(url.searchParams.get("next") || readStoredLiveAuthReturnPath("/"));
  const code = url.searchParams.get("code");
  const authError = url.searchParams.get("error_description") || url.searchParams.get("error") || "";

  if (authError) {
    if (url.pathname.startsWith("/auth/callback")) window.history.replaceState({}, "", next);
    throw new Error(authError);
  }

  if (code) {
    const href = window.location.href;
    if (liveAuthRedirectPromise) return liveAuthRedirectPromise;
    if (liveAuthRedirectCompletedHref === href) return next;

    // Supabase can emit SIGNED_IN while this code path is still running. Remove
    // the one-use code immediately and share one exchange promise across callers.
    window.history.replaceState({}, "", next);
    liveAuthRedirectCompletedHref = href;
    liveAuthRedirectPromise = (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        const { data } = await supabase.auth.getSession();
        if (data?.session) return next;
        throw error;
      }
      return next;
    })().finally(() => {
      liveAuthRedirectPromise = null;
    });
    return liveAuthRedirectPromise;
  }

  const hasAuthHash = /access_token|refresh_token|error/.test(window.location.hash || "");
  if (hasAuthHash && url.pathname.startsWith("/auth/callback")) {
    if (liveAuthRedirectPromise) return liveAuthRedirectPromise;
    liveAuthRedirectPromise = (async () => {
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      window.history.replaceState({}, "", next);
      return next;
    })().finally(() => {
      liveAuthRedirectPromise = null;
    });
    return liveAuthRedirectPromise;
  }

  if (!hasAuthHash && url.pathname.startsWith("/auth/callback")) {
    window.history.replaceState({}, "", next);
    return next;
  }

  return "";
}

function rememberLiveAuthReturnPath(returnPath = "/") {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LIVE_AUTH_RETURN_PATH_KEY, safeLiveAuthReturnPath(returnPath));
  } catch {
    // Session storage is best-effort; the callback URL also carries the return path.
  }
}

function runtimeRecordId(row) {
  const browserCrypto = typeof crypto !== "undefined" ? crypto : null;
  const generatedId = browserCrypto?.randomUUID
    ? browserCrypto.randomUUID()
    : `runtime-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return String(row?.id || row?.localId || row?.invoiceNumber || row?.orderId || row?.email || generatedId);
}

function profileDisplayName(profile, email) {
  return profile?.display_name || email || "Signed-in user";
}

function localRoleFromAccess(profile, accessRows = []) {
  const active = (accessRows || []).find((row) => row.status === "active");
  if (active?.application_role === "super_admin") return "super_admin";
  if (active?.application_role === "admin") return "admin";
  if (active?.application_role === "driver") return "driver";
  if (active?.application_role === "client_billing") return "billing";
  if (active?.application_role === "client_ops") return "client";
  if (active?.application_role === "client_operational") return "client";
  if (profile?.role === "super_admin") return "super_admin";
  if (profile?.role === "admin") return "admin";
  if (profile?.role === "driver") return "driver";
  if (profile?.role === "client_ops") return "client";
  if (profile?.role === "client_billing") return "billing";
  if (profile?.role === "client") return "client";
  return "";
}

function appUserFromProfile({ session, profile, accessRows }) {
  const email = normaliseEmail(session?.user?.email);
  const role = localRoleFromAccess(profile, accessRows);
  const assignment = (accessRows || []).find((row) => row.status === "active") || {};
  const actorCode = assignment.actor_code || "";
  const localId = actorCode || profile?.account_id || profile?.driver_id || profile?.actor_id || profile?.id || session?.user?.id;
  return {
    role,
    user: {
      id: localId,
      profileId: profile?.id || session?.user?.id,
      actorId: profile?.actor_id || assignment.actor_id || "",
      actorCode,
      contactId: assignment.contact_id || "",
      accountId: profile?.account_id || "",
      driverId: profile?.driver_id || "",
      name: profileDisplayName(profile, email),
      displayName: profileDisplayName(profile, email),
      email,
      role,
      supabaseRole: profile?.role || "",
      accessRole: assignment.application_role || "",
      status: assignment.status === "revoked" ? "Revoked" : "Active",
    },
    profile,
    accessRows,
  };
}

export async function requestLiveMagicLink(email, roleHint = "client", returnPath = "") {
  const supabase = client();
  if (!supabase) throw new Error("Live sign-in is not configured.");
  const resolvedReturnPath = safeLiveAuthReturnPath(returnPath || currentBrowserReturnPath());
  rememberLiveAuthReturnPath(resolvedReturnPath);
  const redirectTo = liveAuthCallbackUrl(resolvedReturnPath);
  const { error } = await supabase.auth.signInWithOtp({
    email: normaliseEmail(email),
    options: {
      shouldCreateUser: false,
      emailRedirectTo: redirectTo,
      data: { role_hint: roleHint },
    },
  });
  if (error) throw error;
  return true;
}

export async function requestLivePasswordLogin(email, password) {
  const supabase = client();
  if (!supabase) throw new Error("Live sign-in is not configured.");
  const { error } = await supabase.auth.signInWithPassword({
    email: normaliseEmail(email),
    password: String(password || ""),
  });
  if (error) throw error;
  return true;
}

export async function signOutLiveRuntime() {
  const supabase = client();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function onLiveAuthStateChange(callback) {
  const supabase = client();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(() => callback());
  return () => data?.subscription?.unsubscribe?.();
}

export async function resolveLiveRuntimeSession() {
  const supabase = client();
  if (!supabase) return null;
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData?.session?.user) return null;
  const authUser = sessionData.session.user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, actor_id, account_id, driver_id, role, status, display_name, email")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) {
    return {
      blocked: true,
      reason: "Sign-in succeeded, but this email is not approved for Moto & Co access.",
      email: authUser.email,
    };
  }
  if (profile.status && profile.status !== "active") {
    return {
      blocked: true,
      reason: `Moto & Co profile exists, but the account is ${profile.status}. Admin activation is required before login.`,
      email: authUser.email,
    };
  }

  const { data: accessRows, error: accessError } = await supabase
    .from("access_role_assignments")
    .select("id, profile_id, actor_id, contact_id, application_role, actor_code, status")
    .eq("profile_id", authUser.id);

  if (accessError) throw accessError;
  const appSession = appUserFromProfile({ session: sessionData.session, profile, accessRows: accessRows || [] });
  if (!appSession.role) {
    return {
      blocked: true,
      reason: "Sign-in succeeded, but no active Moto & Co access role is assigned.",
      email: authUser.email,
    };
  }
  return appSession;
}

function emptySnapshot() {
  return Object.fromEntries(allSnapshotKeys.map((key) => [key, []]));
}

function priceRuleFromRow(row) {
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

export async function loadLiveRuntimeSnapshot() {
  const supabase = client();
  const snapshot = emptySnapshot();
  if (!supabase) return snapshot;

  const { data: records, error } = await supabase
    .from("runtime_records")
    .select("record_type, local_id, payload, owner_actor_id, driver_profile_id, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const typeToKey = Object.fromEntries(Object.entries(liveRuntimeDomains).map(([key, type]) => [type, key]));
  for (const record of records || []) {
    const key = typeToKey[record.record_type];
    if (!key) continue;
    snapshot[key].push({
      ...(record.payload || {}),
      id: record.payload?.id || record.local_id,
      actorId: record.payload?.actorId || record.owner_actor_id || "",
      profileId: record.payload?.profileId || record.driver_profile_id || "",
      liveUpdatedAt: record.updated_at,
    });
  }

  const { data: priceRows } = await supabase
    .from("price_rules")
    .select("id, service_variant, label, item_type, tyre_count_min, tyre_count_max, weight_band, rate_cents, rate_mode, effective_from, effective_to, status, change_log_id")
    .eq("status", "active")
    .order("effective_from", { ascending: true });

  if (!snapshot.priceRules.length && priceRows?.length) {
    snapshot.priceRules = priceRows.map(priceRuleFromRow);
  }

  return snapshot;
}

function ownerActorForRow(row, appSession) {
  return row?.actorId || row?.accountActorId || row?.account_actor_id || row?.clientActorId || appSession?.user?.actorId || null;
}

function driverProfileForRow(row, appSession) {
  return row?.driverProfileId || row?.driver_profile_id || row?.profileId || (appSession?.role === "driver" ? appSession?.user?.profileId : null);
}

export function canSyncDomainForRole(domainKey, role) {
  if (!role) return false;
  if (role === "admin" || role === "super_admin") return true;
  if (role === "client") return ["orders", "exceptions", "operationalNotices"].includes(domainKey);
  if (role === "billing") return ["exceptions", "billingNotices"].includes(domainKey);
  if (role === "driver") return ["orders", "proofs", "exceptions", "runClosures"].includes(domainKey);
  return false;
}

async function liveAccessToken() {
  const supabase = client();
  if (!supabase) throw new Error("Live system connection is not configured.");
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token) throw new Error("A live Admin session is required.");
  return data.session.access_token;
}

async function provisioningApi(method, body = null) {
  const token = await liveAccessToken();
  const response = await fetch("/api/admin/provision-user", {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `SOP-IAM-03 provisioning API failed (${response.status}).`);
  return payload;
}

export async function listLiveProvisionedUsers() {
  return provisioningApi("GET");
}

export async function provisionLiveUser(input) {
  return provisioningApi("POST", input);
}

export async function updateLiveProvisionedUserStatus(input) {
  return provisioningApi("PATCH", input);
}

export async function syncLiveRuntimeDomain(domainKey, rows = [], appSession) {
  const supabase = client();
  const recordType = liveRuntimeDomains[domainKey];
  if (!supabase || !recordType || !appSession?.role || !canSyncDomainForRole(domainKey, appSession.role)) {
    return { skipped: true };
  }

  const payload = (rows || []).map((row) => ({
    record_type: recordType,
    local_id: runtimeRecordId(row),
    owner_actor_id: ownerActorForRow(row, appSession),
    driver_profile_id: driverProfileForRow(row, appSession),
    payload: row || {},
    updated_by: appSession?.user?.profileId || null,
    source_ref: "Moto & Co V1 live runtime bridge",
  }));

  if (!payload.length) return { skipped: true };

  const { error } = await supabase
    .from("runtime_records")
    .upsert(payload, { onConflict: "record_type,local_id" });

  if (error) throw error;
  return { synced: payload.length };
}

function dataUrlToBlob(dataUrl) {
  const [meta, encoded] = String(dataUrl || "").split(",");
  if (!meta?.startsWith("data:") || !encoded) return null;
  const mime = meta.match(/^data:([^;]+)/)?.[1] || "application/octet-stream";
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mime });
}

export async function uploadLiveDeliveryProof(proof, appSession) {
  const supabase = client();
  if (!supabase || !proof?.signatureUrl || !appSession?.role) return { skipped: true };
  const blob = dataUrlToBlob(proof.signatureUrl);
  if (!blob) return { skipped: true };

  const path = proof.signaturePath || `deliveries/${proof.deliveryId || proof.id}/signature.png`;
  const { error: uploadError } = await supabase.storage
    .from("delivery-proof")
    .upload(path, blob, {
      upsert: false,
      contentType: blob.type || "image/png",
    });

  if (uploadError && !String(uploadError.message || "").toLowerCase().includes("already exists")) {
    throw uploadError;
  }

  await syncLiveRuntimeDomain("proofs", [{ ...proof, signaturePath: path, storage: `delivery-proof/${path}` }], appSession);

  if (proof.deliveryId && /^[0-9a-f-]{36}$/i.test(proof.deliveryId)) {
    await supabase
      .from("delivery_proof")
      .insert({
        delivery_id: proof.deliveryId,
        receiver_name: proof.receiverName,
        signature_path: path,
        captured_by: appSession?.user?.profileId || null,
        captured_at: proof.capturedAt || proof.deliveredAt || new Date().toISOString(),
      });
  }

  return { uploaded: true, path };
}
