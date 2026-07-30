import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type AdminSupabaseClient = SupabaseClient<any, "public", any>;

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

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function normaliseEmail(value: unknown) {
  return cleanText(value).toLowerCase();
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function localClientId() {
  return `c-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function relationshipTier(value: unknown) {
  const normalised = cleanText(value).toLowerCase().replace(/\s+/g, "_");
  return ["transactional", "preferred", "strategic", "co_creation"].includes(normalised) ? normalised : "transactional";
}

function supplierNameKey(name = "") {
  return String(name || "").trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ");
}

function canonicalSupplierName(name = "") {
  const key = supplierNameKey(name);
  if (!key) return "";
  if (key.includes("ficeda")) return "";
  if (key.includes("link")) return "Link International";
  if (key.includes("gas")) return "Gas Imports";
  if (key.includes("mcleod") || key.includes("mcloed") || key.includes("mcleods")) return "McLeods";
  if (key.includes("white")) return "Whites Powersports";
  if (key.includes("a1") || key.includes("a one") || key.includes("accessor") || key.includes("assess")) return "A1 Accessories";
  return cleanText(name);
}

function normaliseSupplierList(values: unknown[]) {
  const approved = new Set(["Link International", "A1 Accessories", "McLeods", "Gas Imports", "Whites Powersports"]);
  const seen = new Set<string>();
  return values
    .map((value) => canonicalSupplierName(cleanText(value)))
    .filter((name) => approved.has(name))
    .filter((name) => !seen.has(name) && seen.add(name));
}

async function findExistingClientRuntime(supabase: AdminSupabaseClient, emailsToCheck: string[]) {
  const emails = new Set(emailsToCheck.map(normaliseEmail).filter(Boolean));
  const { data, error } = await supabase
    .from("runtime_records")
    .select("local_id, payload")
    .eq("record_type", "client");
  if (error) throw error;
  return (data || []).find((row) => {
    const payload = row.payload || {};
    return [
      payload.email,
      payload.operationalContact?.email,
      payload.billingContact?.email,
    ].some((candidate) => emails.has(normaliseEmail(candidate)));
  }) || null;
}

async function findSupplierActorIds(supabase: AdminSupabaseClient, supplierNames: string[]) {
  if (!supplierNames.length) return [];
  const { data, error } = await supabase
    .from("actors")
    .select("id, legal_name, trading_name")
    .eq("actor_type", "supplier");
  if (error) throw error;
  const requested = new Set(supplierNames.map((name) => canonicalSupplierName(name).toLowerCase()));
  return (data || [])
    .filter((actor) => requested.has(canonicalSupplierName(actor.trading_name).toLowerCase()) || requested.has(canonicalSupplierName(actor.legal_name).toLowerCase()))
    .map((actor) => actor.id);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = serviceClient();
    if (!supabase) return json(500, { error: "Server-side customer registration is not configured." });

    const body = await request.json();
    const name = cleanText(body.name || body.businessName);
    const email = normaliseEmail(body.email || body.operationalContact?.email);
    const phone = cleanText(body.phone);
    const address = cleanText(body.address || body.deliveryAddress);
    const operationalName = cleanText(body.operationalContact?.name || body.opName || name);
    const billingName = cleanText(body.billingContact?.name || body.billingName || operationalName);
    const billingEmail = normaliseEmail(body.billingContact?.email || body.billingEmail || email);
    const vendors = Array.isArray(body.vendors) ? normaliseSupplierList(body.vendors) : [];
    const submittedAt = new Date().toISOString();
    const consentAcceptedAt = submittedAt;

    if (!name) return json(400, { error: "Business name is required." });
    if (!validEmail(email)) return json(400, { error: "A valid operational email is required." });
    if (!validEmail(billingEmail)) return json(400, { error: "A valid billing email is required." });
    if (!operationalName) return json(400, { error: "Operational contact name is required." });
    if (!billingName) return json(400, { error: "Billing contact name is required." });
    if (!phone) return json(400, { error: "Phone is required." });
    if (!address) return json(400, { error: "Delivery address is required." });
    if (!vendors.length) return json(400, { error: "At least one supplier is required." });

    const existing = await findExistingClientRuntime(supabase, [email, billingEmail]);
    if (existing) return json(409, { error: "This email is already registered or pending Admin review." });

    const today = new Date().toISOString().slice(0, 10);
    const { data: actor, error: actorError } = await supabase
      .from("actors")
      .insert({
        actor_type: "customer",
        legal_name: name,
        trading_name: name,
        relationship_tier: relationshipTier(body.relationshipTier),
        relationship_status: "pending",
        delivery_address: address,
        first_engagement_date: today,
        risk_level: "medium",
        notes: "Self-registration pending Admin activation.",
      })
      .select("id")
      .single();
    if (actorError) throw actorError;

    const actorId = actor.id;
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .insert([
        {
          actor_id: actorId,
          contact_kind: "operational",
          full_name: operationalName,
          role_title: "Operational Contact",
          influence_role: "operational_lead",
          email,
          phone,
          preferred_contact_method: "email",
        },
        {
          actor_id: actorId,
          contact_kind: "billing",
          full_name: billingName,
          role_title: "Billing Contact",
          influence_role: "economic_buyer",
          email: billingEmail,
          phone,
          preferred_contact_method: "email",
        },
      ])
      .select("id, contact_kind");
    if (contactsError) throw contactsError;

    const supplierActorIds = await findSupplierActorIds(supabase, vendors);
    if (supplierActorIds.length) {
      const { error: linkError } = await supabase
        .from("actor_supplier_links")
        .upsert(
          supplierActorIds.map((supplierActorId) => ({
            account_actor_id: actorId,
            supplier_actor_id: supplierActorId,
          })),
          { onConflict: "account_actor_id,supplier_actor_id" },
        );
      if (linkError) throw linkError;
    }

    const operationalContactId = contacts?.find((contact) => contact.contact_kind === "operational")?.id || "";
    const billingContactId = contacts?.find((contact) => contact.contact_kind === "billing")?.id || "";

    const { error: consentError } = await supabase.from("consent_records").insert({
      actor_id: actorId,
      contact_id: operationalContactId || null,
      notice_version: "Policy #4 Collection Notice",
      consented_at: consentAcceptedAt,
      immutable_note: "Collection Notice acknowledgement captured at customer self-registration.",
    });
    if (consentError) throw consentError;

    const client = {
      id: localClientId(),
      actorId,
      name,
      businessName: name,
      email,
      phone,
      address,
      deliveryAddress: address,
      vendors,
      status: "Pending",
      courierEligible: false,
      operationalContact: { id: operationalContactId, name: operationalName, email, phone },
      billingContact: { id: billingContactId, name: billingName, email: billingEmail, phone },
      consent: { notice: "Policy #4 Collection Notice", acceptedAt: consentAcceptedAt },
      registrationSource: "public_customer_registration",
      registeredAt: submittedAt,
      activationEligibility: {
        reviewedAt: "",
        source: "Pending Admin activation",
      },
    };

    const { error: runtimeError } = await supabase.from("runtime_records").upsert({
      record_type: "client",
      local_id: client.id,
      owner_actor_id: actorId,
      payload: client,
      source_ref: "Public customer registration pending Admin activation",
    }, { onConflict: "record_type,local_id" });
    if (runtimeError) throw runtimeError;

    await supabase.from("master_data_changes").insert({
      change_type: "customer",
      target_id: actorId,
      field: "registration",
      old_value: "",
      new_value: "pending",
      reason: "Public customer registration submitted for Admin activation.",
      status: "executed",
      action_type: "customer_registration",
      entity_type: "customer",
      entity_id: actorId,
      changed_field: "registration",
      approval_reference: "Pending Admin activation",
      changed_at: new Date().toISOString(),
    });

    return json(201, { client });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : "Customer registration failed." });
  }
}
