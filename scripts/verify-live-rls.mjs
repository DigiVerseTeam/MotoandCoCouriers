import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const isWindows = process.platform === "win32";
const command = isWindows ? process.env.ComSpec || "cmd.exe" : "npx";
const failures = [];
const passes = [];

function read(relativePath) {
  const target = path.join(root, relativePath);
  if (!fs.existsSync(target)) {
    failures.push(`${relativePath}: file is missing`);
    return "";
  }
  return fs.readFileSync(target, "utf8");
}

function requireText(relativePath, markers, label = relativePath) {
  const content = read(relativePath);
  if (!content) return;
  const missing = markers.filter((marker) => !content.includes(marker));
  if (missing.length) {
    failures.push(`${label}: missing ${missing.join(", ")}`);
    return;
  }
  passes.push(`${label}: ${markers.length} marker(s) present`);
}

function failIfAny() {
  if (!failures.length) return;
  console.error("\nLive Supabase verification failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error(`\n${passes.length} check(s) passed before failure.\n`);
  process.exit(1);
}

function queryLinked(sql, label) {
  const queryPath = path.join(os.tmpdir(), `moto-live-verify-${process.pid}-${Math.random().toString(16).slice(2)}.sql`);
  fs.writeFileSync(queryPath, sql, "utf8");
  const args = ["supabase", "db", "query", "--linked", "--output", "json", "--file", queryPath];
  const commandArgs = isWindows ? ["/d", "/s", "/c", "npx.cmd", ...args] : args;
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
  });
  try {
    fs.unlinkSync(queryPath);
  } catch {
    // Best-effort cleanup only.
  }
  if (result.error) {
    failures.push(`${label}: ${result.error.message}`);
    return [];
  }
  if (result.status !== 0) {
    failures.push(`${label}: ${result.stderr || result.stdout || "query failed"}`);
    return [];
  }
  const stdout = String(result.stdout || "");
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end < start) {
    failures.push(`${label}: query did not return JSON`);
    return [];
  }
  try {
    const parsed = JSON.parse(stdout.slice(start, end + 1));
    return parsed.rows || [];
  } catch (error) {
    failures.push(`${label}: could not parse query JSON: ${error.message}`);
    return [];
  }
}

function countSql(sql, label) {
  const rows = queryLinked(sql, label);
  const count = Number(rows[0]?.count || 0);
  passes.push(`${label}: ${count} row(s)`);
  return count;
}

requireText(
  "supabase/migrations/202606190032_live_runtime_records.sql",
  [
    "create table if not exists public.runtime_records",
    "alter table public.runtime_records enable row level security",
    "public.can_client_operational_account(owner_actor_id)",
    "public.can_client_billing_account(owner_actor_id)",
    "driver_profile_id = auth.uid()",
    "public.is_admin()",
    "create table if not exists public.production_seed_imports",
  ],
  "live runtime RLS migration"
);

requireText(
  "supabase/migrations/202606190033_authenticated_table_privileges.sql",
  [
    "grant select, insert, update, delete on all tables in schema public to authenticated",
    "grant all privileges on all tables in schema public to service_role",
    "alter default privileges in schema public",
  ],
  "Supabase API table privilege migration"
);

requireText(
  "supabase/migrations/202606190034_super_admin_provisioning.sql",
  [
    "SOP-IAM-03 Admin Master Data & User Provisioning",
    "super_admin",
    "client_ops",
    "public.is_super_admin()",
    "service_role key must never be exposed to the browser",
  ],
  "SOP-IAM-03 Super Admin provisioning migration"
);

requireText(
  "supabase/migrations/202606180020_delivery_proof_storage_contract.sql",
  [
    "delivery-proof",
    "public = false",
    "storage.objects",
  ],
  "private POD storage migration"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "requestLiveMagicLink",
    "resolveLiveRuntimeSession",
    "syncLiveRuntimeDomain",
    "uploadLiveDeliveryProof",
    "Send Supabase Login Link",
  ],
  "Supabase Auth and live data wiring"
);

requireText(
  "scripts/import-production-master-data.mjs",
  [
    "production_seed_imports",
    "ensureAuthProfile",
    "ensureAccessRole",
    "fleet_vehicles",
    "runtime_records",
  ],
  "approved production master-data importer"
);

failIfAny();

const rlsRows = queryLinked(`
  select c.relname as table_name, c.relrowsecurity as rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('runtime_records', 'production_seed_imports')
  order by c.relname;
`, "runtime RLS flags");
for (const tableName of ["runtime_records", "production_seed_imports"]) {
  const row = rlsRows.find((item) => item.table_name === tableName);
  if (!row) failures.push(`${tableName}: table is missing`);
  else if (!row.rls_enabled) failures.push(`${tableName}: RLS is not enabled`);
  else passes.push(`${tableName}: RLS enabled`);
}

const runtimePolicyCount = countSql(`
  select count(*)::int as count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'runtime_records';
`, "runtime_records policies");
if (runtimePolicyCount < 4) failures.push("runtime_records policies: expected select, insert, update, and admin delete policies");

const privilegeRows = queryLinked(`
  select table_name, grantee, count(distinct privilege_type)::int as grant_count
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in ('profiles', 'access_role_assignments', 'runtime_records', 'production_seed_imports')
    and grantee in ('authenticated', 'service_role')
    and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
  group by table_name, grantee;
`, "Supabase API table privileges");
for (const tableName of ["profiles", "access_role_assignments", "runtime_records", "production_seed_imports"]) {
  for (const grantee of ["authenticated", "service_role"]) {
    const row = privilegeRows.find((item) => item.table_name === tableName && item.grantee === grantee);
    if (!row || Number(row.grant_count) < 4) {
      failures.push(`${tableName}: ${grantee} is missing select/insert/update/delete grants before RLS`);
    } else {
      passes.push(`${tableName}: ${grantee} table grants present`);
    }
  }
}

const bucketRows = queryLinked(`
  select id, name, public
  from storage.buckets
  where id = 'delivery-proof';
`, "delivery-proof bucket");
if (!bucketRows.length) failures.push("delivery-proof bucket is missing");
else if (bucketRows[0].public) failures.push("delivery-proof bucket must be private");
else passes.push("delivery-proof bucket: private bucket exists");

const priceRuleCount = countSql("select count(*)::int as count from public.price_rules;", "price_rules source-of-truth");
if (priceRuleCount < 1) failures.push("price_rules: no pricing records found");

countSql("select count(*)::int as count from public.runtime_records;", "runtime_records live bridge");
const appliedImports = countSql(
  "select count(*)::int as count from public.production_seed_imports where status = 'applied';",
  "approved production master-data import evidence"
);
const requiredMasterDataTypes = ["client", "supplier", "driver", "vehicle"];
for (const recordType of requiredMasterDataTypes) {
  const count = countSql(
    `select count(*)::int as count from public.runtime_records where record_type = '${recordType}';`,
    `approved production master-data record ${recordType}`
  );
  if (count < 1) {
    failures.push(`approved production master-data record ${recordType}: missing approved launch record`);
  }
}
if (appliedImports < 1) {
  passes.push("approved production master-data import evidence: no bulk import applied; SOP-IAM-03 app-managed records are allowed when the required runtime records exist");
}

const requiredRoles = ["super_admin", "admin", "driver", "client_ops", "client_billing"];
for (const role of requiredRoles) {
  const count = countSql(
    `select count(*)::int as count
     from public.access_role_assignments ara
     join public.profiles p on p.id = ara.profile_id
     where ara.application_role = '${role}'
       and ara.status = 'active'
       and p.status = 'active';`,
    `active access role ${role}`
  );
  if (count < 1) failures.push(`active access role ${role}: missing approved launch record`);
}

const receiverRoleCount = countSql(
  "select count(*)::int as count from public.access_role_assignments where application_role = 'receiver';",
  "receiver no-login boundary"
);
if (receiverRoleCount !== 0) failures.push("receiver no-login boundary: receiver must not have an application login role");

failIfAny();
console.log(`Live Supabase verification passed: ${passes.length} check(s).`);
