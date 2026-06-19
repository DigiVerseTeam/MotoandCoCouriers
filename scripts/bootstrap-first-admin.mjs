import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const email = String(process.argv[2] || "").trim().toLowerCase();
const displayName = String(process.argv[3] || email).trim();
const evidenceRef = String(process.argv.slice(4).join(" ") || `Owner approved first Admin bootstrap for ${email}`).trim();

function fail(message) {
  console.error(`First Admin bootstrap failed: ${message}`);
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

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("valid admin email argument is required");

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

function adminCodeForEmail(value) {
  return `ADMIN-BOOTSTRAP-${value.split("@")[0].toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`;
}

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
        launch_admin_bootstrap: true,
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
      role: "admin",
      display_name: displayName,
    }, { onConflict: "id" });
  if (profileError) throw profileError;

  const actorCode = adminCodeForEmail(email);
  const { data: existingRole, error: existingRoleError } = await supabase
    .from("access_role_assignments")
    .select("id")
    .eq("profile_id", user.id)
    .eq("application_role", "admin")
    .eq("actor_code", actorCode)
    .maybeSingle();
  if (existingRoleError) throw existingRoleError;

  const accessPayload = {
    profile_id: user.id,
    actor_id: null,
    contact_id: null,
    application_role: "admin",
    actor_code: actorCode,
    status: "active",
    granted_by: user.id,
    granted_at: new Date().toISOString(),
    last_reviewed_by: user.id,
    last_reviewed_at: new Date().toISOString(),
    last_review_reason: evidenceRef,
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

  const { error: runtimeError } = await supabase
    .from("runtime_records")
    .upsert({
      record_type: "master_data_change",
      local_id: `admin-bootstrap-${email.replace(/[^a-z0-9]+/g, "-")}`,
      payload: {
        code: actorCode,
        email,
        displayName,
        role: "admin",
        status: "active",
        evidenceRef,
        authAction,
        bootstrappedAt: new Date().toISOString(),
      },
      source_ref: "Approved first Admin bootstrap",
      updated_by: user.id,
    }, { onConflict: "record_type,local_id" });
  if (runtimeError) throw runtimeError;

  console.log(`First Admin ${authAction}: ${email}`);
}

main().catch((error) => {
  fail(error?.message || String(error));
});
