import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const email = String(process.argv[2] || "").trim().toLowerCase();
const displayName = String(process.argv[3] || "").trim();
const approvalReference = String(process.argv.slice(4).join(" ") || "").trim();

function fail(message) {
  console.error(`Super Admin bootstrap failed: ${message}`);
  process.exit(1);
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] ||= value;
  }
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("valid Super Admin email argument is required");
if (!displayName) fail("display name argument is required");
if (!approvalReference) fail("approval reference argument is required");

loadEnvFile(path.join(process.cwd(), ".env.production.local"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) fail("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is required");
if (!serviceRoleKey) fail("SUPABASE_SERVICE_ROLE_KEY is required");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findAuthUserByEmail() {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = (data?.users || []).find((user) => String(user.email || "").toLowerCase() === email);
    if (found) return found;
    if (!data?.users || data.users.length < 1000) return null;
  }
  fail("auth user lookup exceeded 20,000 users");
}

async function main() {
  let user = await findAuthUserByEmail();
  let authAction = "existing";

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        launch_super_admin_bootstrap: true,
      },
    });
    if (error) throw error;
    user = data.user;
    authAction = "created";
  }

  if (!user?.id) fail("Supabase Auth did not return a user id");

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      actor_id: null,
      email,
      role: "super_admin",
      status: "active",
      display_name: displayName,
      account_id: null,
      driver_id: null,
      last_reviewed_at: new Date().toISOString(),
    }, { onConflict: "id" });
  if (profileError) throw profileError;

  const { data: existingRole, error: existingRoleError } = await supabase
    .from("access_role_assignments")
    .select("id")
    .eq("profile_id", user.id)
    .eq("application_role", "super_admin")
    .eq("actor_code", "ACT-INT-003")
    .maybeSingle();
  if (existingRoleError) throw existingRoleError;

  const accessPayload = {
    profile_id: user.id,
    actor_id: null,
    contact_id: null,
    application_role: "super_admin",
    actor_code: "ACT-INT-003",
    status: "active",
    granted_by: user.id,
    granted_at: new Date().toISOString(),
    last_reviewed_by: user.id,
    last_reviewed_at: new Date().toISOString(),
    last_review_reason: approvalReference,
  };

  if (existingRole?.id) {
    const { error } = await supabase
      .from("access_role_assignments")
      .update(accessPayload)
      .eq("id", existingRole.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("access_role_assignments")
      .insert(accessPayload);
    if (error) throw error;
  }

  const now = new Date().toISOString();
  const { error: auditError } = await supabase
    .from("master_data_changes")
    .insert({
      change_type: "user",
      target_id: user.id,
      field: "role",
      old_value: "",
      new_value: "super_admin",
      reason: approvalReference,
      status: "executed",
      proposed_by: user.id,
      actor_id: user.id,
      action_type: "bootstrap_super_admin",
      entity_type: "profile",
      entity_id: user.id,
      changed_field: "role",
      approval_reference: approvalReference,
      changed_at: now,
    });
  if (auditError) throw auditError;

  const { error: runtimeError } = await supabase
    .from("runtime_records")
    .upsert({
      record_type: "master_data_change",
      local_id: `super-admin-bootstrap-${email.replace(/[^a-z0-9]+/g, "-")}`,
      payload: {
        actorCode: "ACT-INT-003",
        email,
        displayName,
        role: "super_admin",
        status: "active",
        approvalReference,
        authAction,
        bootstrappedAt: now,
      },
      source_ref: "SOP-IAM-03 approved Super Admin bootstrap",
      updated_by: user.id,
    }, { onConflict: "record_type,local_id" });
  if (runtimeError) throw runtimeError;

  console.log(`Super Admin ${authAction}: ${email}`);
}

main().catch((error) => {
  fail(error?.message || String(error));
});
