import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const fileArg = args.find((arg) => arg.startsWith("--file="))?.slice("--file=".length);
const sourcePath = fileArg ? path.resolve(root, fileArg) : path.resolve(root, "data", "production-master-data.json");
const placeholderPattern = /\b(REPLACE|TODO|TBD|example\.com|APPROVED|Approved .* Name|Approved .* Contact|Approved physical|Approved policy)/i;

function fail(message) {
  console.error(`Production master-data import failed: ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) fail(`source file does not exist: ${filePath}`);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`source file is not valid JSON: ${error.message}`);
  }
}

function requiredText(value, label) {
  const text = String(value || "").trim();
  if (!text) fail(`${label} is required`);
  if (placeholderPattern.test(text)) fail(`${label} still looks like a placeholder`);
  return text;
}

function optionalText(value) {
  return String(value || "").trim();
}

function requiredArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) fail(`${label} must contain at least one approved record`);
  return value;
}

function requiredIsoDate(value, label) {
  const text = requiredText(value, label);
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) fail(`${label} must be an ISO date/time`);
  return date.toISOString();
}

function requiredEmail(value, label) {
  const email = requiredText(value, label).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(`${label} must be a valid email`);
  return email;
}

function normaliseStatus(value, fallback = "active") {
  return String(value || fallback).trim().toLowerCase().replace(/\s+/g, "_");
}

function assertNoPlaceholder(value, label) {
  if (typeof value === "string" && placeholderPattern.test(value)) fail(`${label} still looks like a placeholder`);
}

function validateInput(input) {
  const approval = input.approval || {};
  const validated = {
    approval: {
      importName: requiredText(approval.importName, "approval.importName"),
      approvedBy: requiredText(approval.approvedBy, "approval.approvedBy"),
      approvedAt: requiredIsoDate(approval.approvedAt, "approval.approvedAt"),
      evidenceRef: requiredText(approval.evidenceRef, "approval.evidenceRef"),
      sourceFile: requiredText(approval.sourceFile || path.basename(sourcePath), "approval.sourceFile"),
    },
    adminUsers: requiredArray(input.adminUsers, "adminUsers"),
    suppliers: requiredArray(input.suppliers, "suppliers"),
    customers: requiredArray(input.customers, "customers"),
    drivers: requiredArray(input.drivers, "drivers"),
    vehicles: requiredArray(input.vehicles, "vehicles"),
  };

  validated.adminUsers.forEach((admin, index) => {
    requiredText(admin.code, `adminUsers[${index}].code`);
    requiredEmail(admin.email, `adminUsers[${index}].email`);
    requiredText(admin.displayName, `adminUsers[${index}].displayName`);
  });

  validated.suppliers.forEach((supplier, index) => {
    requiredText(supplier.code, `suppliers[${index}].code`);
    requiredText(supplier.legalName, `suppliers[${index}].legalName`);
    requiredText(supplier.tradingName, `suppliers[${index}].tradingName`);
    requiredText(supplier.dockAddress, `suppliers[${index}].dockAddress`);
    requiredText(supplier.pickupWindow, `suppliers[${index}].pickupWindow`);
    requiredText(supplier.packagingNotes, `suppliers[${index}].packagingNotes`);
    requiredText(supplier.approvalEvidenceRef, `suppliers[${index}].approvalEvidenceRef`);
    requiredText(supplier.dockContact?.fullName, `suppliers[${index}].dockContact.fullName`);
  });

  validated.customers.forEach((customer, index) => {
    requiredText(customer.code, `customers[${index}].code`);
    requiredText(customer.legalName, `customers[${index}].legalName`);
    requiredText(customer.tradingName, `customers[${index}].tradingName`);
    requiredText(customer.deliveryAddress, `customers[${index}].deliveryAddress`);
    requiredText(customer.operationalContact?.fullName, `customers[${index}].operationalContact.fullName`);
    requiredEmail(customer.operationalContact?.email, `customers[${index}].operationalContact.email`);
    requiredText(customer.billingContact?.fullName, `customers[${index}].billingContact.fullName`);
    requiredEmail(customer.billingContact?.email, `customers[${index}].billingContact.email`);
    requiredArray(customer.supplierCodes, `customers[${index}].supplierCodes`);
  });

  validated.drivers.forEach((driver, index) => {
    requiredText(driver.code, `drivers[${index}].code`);
    requiredEmail(driver.email, `drivers[${index}].email`);
    requiredText(driver.displayName, `drivers[${index}].displayName`);
  });

  validated.vehicles.forEach((vehicle, index) => {
    requiredText(vehicle.code, `vehicles[${index}].code`);
    requiredText(vehicle.registrationPlate, `vehicles[${index}].registrationPlate`);
    requiredText(vehicle.registrationExpiry, `vehicles[${index}].registrationExpiry`);
    requiredText(vehicle.insuranceExpiry, `vehicles[${index}].insuranceExpiry`);
    assertNoPlaceholder(vehicle.insurancePolicy, `vehicles[${index}].insurancePolicy`);
  });

  return validated;
}

function supabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url) fail("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is required for --apply");
  if (!serviceRoleKey) fail("SUPABASE_SERVICE_ROLE_KEY is required for --apply");
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getRuntimeRecord(supabase, recordType, localId) {
  const { data, error } = await supabase
    .from("runtime_records")
    .select("id, payload")
    .eq("record_type", recordType)
    .eq("local_id", localId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function upsertRuntimeRecord(supabase, recordType, localId, payload, extra = {}) {
  const { data, error } = await supabase
    .from("runtime_records")
    .upsert({
      record_type: recordType,
      local_id: localId,
      payload,
      source_ref: "Approved production master-data import",
      ...extra,
    }, { onConflict: "record_type,local_id" })
    .select("id, payload")
    .single();
  if (error) throw error;
  return data;
}

async function upsertActorFromCode(supabase, recordType, code, actorPayload, runtimePayload) {
  const runtime = await getRuntimeRecord(supabase, recordType, code);
  const actorId = runtime?.payload?.actorId;
  let actor;
  if (actorId) {
    const { data, error } = await supabase
      .from("actors")
      .update(actorPayload)
      .eq("id", actorId)
      .select("id")
      .single();
    if (error) throw error;
    actor = data;
  } else {
    const { data, error } = await supabase
      .from("actors")
      .insert(actorPayload)
      .select("id")
      .single();
    if (error) throw error;
    actor = data;
  }
  await upsertRuntimeRecord(supabase, recordType, code, { ...runtimePayload, actorId: actor.id }, {
    owner_actor_id: actorPayload.actor_type === "customer" ? actor.id : null,
  });
  return actor.id;
}

async function upsertContact(supabase, existingContactId, actorId, contactKind, contactInput, defaults = {}) {
  const payload = {
    actor_id: actorId,
    contact_kind: contactKind,
    full_name: requiredText(contactInput.fullName, `${contactKind}.fullName`),
    role_title: optionalText(contactInput.roleTitle) || defaults.roleTitle || "Contact",
    influence_role: defaults.influenceRole || "operational_lead",
    email: contactInput.email ? requiredEmail(contactInput.email, `${contactKind}.email`) : null,
    phone: optionalText(contactInput.phone) || null,
    preferred_contact_method: "email",
    notes: optionalText(contactInput.notes),
  };

  if (existingContactId) {
    const { data, error } = await supabase
      .from("contacts")
      .update(payload)
      .eq("id", existingContactId)
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function findAuthUserByEmail(supabase, email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = (data?.users || []).find((user) => String(user.email || "").toLowerCase() === email);
    if (found) return found;
    if (!data?.users || data.users.length < 1000) return null;
  }
  fail("auth user lookup exceeded 20,000 users; use a narrower manual import");
}

async function ensureAuthProfile(supabase, { email, displayName, role, actorId = null }) {
  const loginEmail = requiredEmail(email, `${displayName}.email`);
  const existing = await findAuthUserByEmail(supabase, loginEmail);
  let user = existing;
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: loginEmail,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        launch_import: true,
      },
    });
    if (error) throw error;
    user = data.user;
  }
  if (!user?.id) fail(`could not create or find Auth user for ${loginEmail}`);

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      actor_id: actorId,
      role,
      display_name: displayName,
    }, { onConflict: "id" });
  if (error) throw error;
  return user.id;
}

async function ensureAccessRole(supabase, { profileId, actorId = null, contactId = null, applicationRole, actorCode, grantedBy }) {
  let query = supabase
    .from("access_role_assignments")
    .select("id")
    .eq("profile_id", profileId)
    .eq("application_role", applicationRole)
    .eq("actor_code", actorCode);

  query = actorId ? query.eq("actor_id", actorId) : query.is("actor_id", null);
  query = contactId ? query.eq("contact_id", contactId) : query.is("contact_id", null);

  const { data: existing, error: selectError } = await query.maybeSingle();
  if (selectError) throw selectError;

  const payload = {
    profile_id: profileId,
    actor_id: actorId,
    contact_id: contactId,
    application_role: applicationRole,
    actor_code: actorCode,
    status: "active",
    granted_by: grantedBy || profileId,
    granted_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("access_role_assignments")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase
    .from("access_role_assignments")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function applyImport(input) {
  const supabase = supabaseAdminClient();
  const summary = {
    adminUsers: input.adminUsers.length,
    suppliers: input.suppliers.length,
    customers: input.customers.length,
    drivers: input.drivers.length,
    vehicles: input.vehicles.length,
  };

  const adminProfiles = [];
  for (const admin of input.adminUsers) {
    const profileId = await ensureAuthProfile(supabase, {
      email: admin.email,
      displayName: admin.displayName,
      role: "admin",
    });
    await ensureAccessRole(supabase, {
      profileId,
      applicationRole: "admin",
      actorCode: admin.code,
      grantedBy: profileId,
    });
    adminProfiles.push(profileId);
    await upsertRuntimeRecord(supabase, "master_data_change", admin.code, {
      code: admin.code,
      displayName: admin.displayName,
      email: admin.email,
      role: "admin",
      approvalEvidenceRef: input.approval.evidenceRef,
    }, { updated_by: profileId });
  }
  const importedBy = adminProfiles[0] || null;

  const { data: importRecord, error: importError } = await supabase
    .from("production_seed_imports")
    .insert({
      import_name: input.approval.importName,
      source_file: input.approval.sourceFile,
      approved_by: input.approval.approvedBy,
      approved_at: input.approval.approvedAt,
      status: "pending",
      imported_by: importedBy,
      summary: { ...summary, evidenceRef: input.approval.evidenceRef },
    })
    .select("id")
    .single();
  if (importError) throw importError;

  const supplierActorIds = new Map();
  for (const supplier of input.suppliers) {
    const actorId = await upsertActorFromCode(supabase, "supplier", supplier.code, {
      actor_type: "supplier",
      legal_name: supplier.legalName,
      trading_name: supplier.tradingName,
      relationship_status: "active",
      dock_address: supplier.dockAddress,
      dock_contact_role: supplier.dockContact?.roleTitle || "Dock Contact",
      pickup_window: supplier.pickupWindow,
      packaging_notes: supplier.packagingNotes,
      last_reviewed: new Date().toISOString().slice(0, 10),
      notes: `Approval evidence: ${supplier.approvalEvidenceRef}`,
    }, {
      id: supplier.code,
      code: supplier.code,
      name: supplier.tradingName,
      legalName: supplier.legalName,
      address: supplier.dockAddress,
      phone: optionalText(supplier.dockContact?.phone),
      pickupWindow: supplier.pickupWindow,
      packagingNotes: supplier.packagingNotes,
      status: "Active",
      dockContactName: supplier.dockContact.fullName,
      dockContactRole: supplier.dockContact?.roleTitle || "Dock Contact",
      supplierApprovalEvidenceRef: supplier.approvalEvidenceRef,
      dockAccessAgreed: true,
      packagingStandardsAgreed: true,
      pickupWindowAgreed: true,
      lastReviewed: new Date().toISOString().slice(0, 10),
    });
    supplierActorIds.set(supplier.code, actorId);
    const runtime = await getRuntimeRecord(supabase, "supplier", supplier.code);
    const dockContactId = await upsertContact(supabase, runtime?.payload?.dockContactId, actorId, "supplier_dock", supplier.dockContact, {
      roleTitle: "Dock Contact",
      influenceRole: "operational_lead",
    });
    await upsertRuntimeRecord(supabase, "supplier", supplier.code, {
      ...(runtime?.payload || {}),
      actorId,
      dockContactId,
    });
  }

  const customerActorIds = new Map();
  for (const customer of input.customers) {
    const unknownSupplier = customer.supplierCodes.find((code) => !supplierActorIds.has(code));
    if (unknownSupplier) fail(`customers supplierCodes contains unknown supplier code: ${unknownSupplier}`);

    const actorId = await upsertActorFromCode(supabase, "client", customer.code, {
      actor_type: "customer",
      legal_name: customer.legalName,
      trading_name: customer.tradingName,
      relationship_status: "active",
      relationship_tier: normaliseStatus(customer.relationshipTier, "transactional"),
      delivery_address: customer.deliveryAddress,
      last_reviewed: new Date().toISOString().slice(0, 10),
      notes: optionalText(customer.notes),
    }, {
      id: customer.code,
      code: customer.code,
      name: customer.tradingName,
      legalName: customer.legalName,
      email: customer.operationalContact.email,
      phone: optionalText(customer.phone || customer.operationalContact.phone),
      address: customer.deliveryAddress,
      vendors: customer.supplierCodes.map((code) => input.suppliers.find((supplier) => supplier.code === code)?.tradingName || code),
      supplierCodes: customer.supplierCodes,
      status: "Active",
      courierEligible: true,
      operationalContact: {
        name: customer.operationalContact.fullName,
        email: customer.operationalContact.email,
      },
      billingContact: {
        name: customer.billingContact.fullName,
        email: customer.billingContact.email,
      },
      consent: {
        notice: "Policy #4 Collection Notice",
        acceptedAt: input.approval.approvedAt,
      },
    });
    customerActorIds.set(customer.code, actorId);

    const runtime = await getRuntimeRecord(supabase, "client", customer.code);
    const operationalContactId = await upsertContact(supabase, runtime?.payload?.operationalContactId, actorId, "operational", customer.operationalContact, {
      roleTitle: "Operational Contact",
      influenceRole: "operational_lead",
    });
    const billingContactId = await upsertContact(supabase, runtime?.payload?.billingContactId, actorId, "billing", customer.billingContact, {
      roleTitle: "Billing Contact",
      influenceRole: "economic_buyer",
    });
    const receiverContactIds = [];
    for (const [index, receiver] of (customer.receiverContacts || []).entries()) {
      const existingId = runtime?.payload?.receiverContactIds?.[index];
      receiverContactIds.push(await upsertContact(supabase, existingId, actorId, "receiver", receiver, {
        roleTitle: "Receiver",
        influenceRole: "end_user",
      }));
    }

    for (const supplierCode of customer.supplierCodes) {
      const { error } = await supabase
        .from("actor_supplier_links")
        .upsert({
          account_actor_id: actorId,
          supplier_actor_id: supplierActorIds.get(supplierCode),
        }, { onConflict: "account_actor_id,supplier_actor_id" });
      if (error) throw error;
    }

    const operationalProfileId = await ensureAuthProfile(supabase, {
      email: customer.operationalContact.email,
      displayName: customer.operationalContact.fullName,
      role: "client",
      actorId,
    });
    await ensureAccessRole(supabase, {
      profileId: operationalProfileId,
      actorId,
      contactId: operationalContactId,
      applicationRole: "client_operational",
      actorCode: customer.code,
      grantedBy: importedBy,
    });

    const billingProfileId = await ensureAuthProfile(supabase, {
      email: customer.billingContact.email,
      displayName: customer.billingContact.fullName,
      role: "client",
      actorId,
    });
    await ensureAccessRole(supabase, {
      profileId: billingProfileId,
      actorId,
      contactId: billingContactId,
      applicationRole: "client_billing",
      actorCode: customer.code,
      grantedBy: importedBy,
    });

    await upsertRuntimeRecord(supabase, "client", customer.code, {
      ...(runtime?.payload || {}),
      actorId,
      operationalContactId,
      billingContactId,
      receiverContactIds,
      operationalProfileId,
      billingProfileId,
    }, { owner_actor_id: actorId });
  }

  const driverProfiles = new Map();
  for (const driver of input.drivers) {
    const profileId = await ensureAuthProfile(supabase, {
      email: driver.email,
      displayName: driver.displayName,
      role: "driver",
    });
    await ensureAccessRole(supabase, {
      profileId,
      applicationRole: "driver",
      actorCode: driver.code,
      grantedBy: importedBy,
    });
    driverProfiles.set(driver.code, profileId);
    await upsertRuntimeRecord(supabase, "driver", driver.code, {
      id: driver.code,
      code: driver.code,
      profileId,
      name: driver.displayName,
      email: driver.email,
      phone: optionalText(driver.phone),
      status: normaliseStatus(driver.status, "active") === "active" ? "Active" : "Not Assignable",
      notes: optionalText(driver.notes),
    }, { driver_profile_id: profileId });
  }

  for (const vehicle of input.vehicles) {
    const assignedDriverProfileId = vehicle.assignedDriverCode ? driverProfiles.get(vehicle.assignedDriverCode) : null;
    if (vehicle.assignedDriverCode && !assignedDriverProfileId) fail(`vehicles assignedDriverCode is unknown: ${vehicle.assignedDriverCode}`);
    const vehiclePayload = {
      vehicle_code: vehicle.code,
      registration_plate: vehicle.registrationPlate,
      make: optionalText(vehicle.make) || null,
      model: optionalText(vehicle.model) || null,
      vehicle_year: vehicle.year || null,
      ownership_type: normaliseStatus(vehicle.ownershipType, "company"),
      status: normaliseStatus(vehicle.status, "active"),
      assigned_driver_profile_id: assignedDriverProfileId,
      registration_expiry: vehicle.registrationExpiry,
      insurance_policy: optionalText(vehicle.insurancePolicy) || null,
      insurance_expiry: vehicle.insuranceExpiry,
      gvm_kg: vehicle.gvmKg || null,
      defect_status: normaliseStatus(vehicle.defectStatus, "clear"),
      notes: optionalText(vehicle.notes),
      updated_by: importedBy,
      created_by: importedBy,
    };
    const { data, error } = await supabase
      .from("fleet_vehicles")
      .upsert(vehiclePayload, { onConflict: "vehicle_code" })
      .select("id")
      .single();
    if (error) throw error;
    await upsertRuntimeRecord(supabase, "vehicle", vehicle.code, {
      id: vehicle.code,
      vehicleId: data.id,
      vehicleName: vehicle.code,
      registrationPlate: vehicle.registrationPlate,
      make: optionalText(vehicle.make),
      model: optionalText(vehicle.model),
      year: vehicle.year || "",
      ownershipType: vehicle.ownershipType || "Company",
      status: normaliseStatus(vehicle.status, "active") === "active" ? "Active" : "Needs Review",
      assignedDriverId: vehicle.assignedDriverCode || "",
      assignedDriverProfileId,
      registrationExpiry: vehicle.registrationExpiry,
      insurancePolicy: optionalText(vehicle.insurancePolicy),
      insuranceExpiry: vehicle.insuranceExpiry,
      gvmKg: vehicle.gvmKg || "",
      defectStatus: vehicle.defectStatus || "clear",
      notes: optionalText(vehicle.notes),
    });
  }

  const { error: completeError } = await supabase
    .from("production_seed_imports")
    .update({
      status: "applied",
      imported_at: new Date().toISOString(),
      summary: { ...summary, evidenceRef: input.approval.evidenceRef, applied: true },
    })
    .eq("id", importRecord.id);
  if (completeError) throw completeError;

  console.log(`Production master-data import applied: ${JSON.stringify(summary)}`);
}

const raw = readJson(sourcePath);
const input = validateInput(raw);

console.log(`Production master-data source validated: ${sourcePath}`);
console.log(`Approved by ${input.approval.approvedBy} at ${input.approval.approvedAt}`);
console.log(`Records: ${JSON.stringify({
  adminUsers: input.adminUsers.length,
  suppliers: input.suppliers.length,
  customers: input.customers.length,
  drivers: input.drivers.length,
  vehicles: input.vehicles.length,
})}`);

if (!apply) {
  console.log("Dry run only. Re-run with --apply after confirming the private source file is approved.");
  process.exit(0);
}

applyImport(input).catch((error) => {
  fail(error?.message || String(error));
});
