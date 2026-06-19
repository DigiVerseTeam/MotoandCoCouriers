import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const target = (
  args.find(arg => arg.startsWith("--target="))?.split("=")[1] ||
  process.env.NEXT_PUBLIC_APP_ENV ||
  "local"
).toLowerCase();

const knownEnvironments = new Set(["local", "preview", "production"]);
const envFiles = [".env", ".env.local"].filter(file => fs.existsSync(path.join(cwd, file)));

function parseEnvFile(file) {
  const text = fs.readFileSync(path.join(cwd, file), "utf8");
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#") && line.includes("="))
      .map(line => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const raw = line.slice(index + 1).trim();
        const value = raw.replace(/^['"]|['"]$/g, "");
        return [key, value];
      })
  );
}

const fileEnv = envFiles.reduce((acc, file) => ({ ...acc, ...parseEnvFile(file) }), {});
const env = { ...fileEnv, ...process.env };

function value(key) {
  return String(env[key] || "").trim();
}

function statusLine(status, label, detail) {
  const prefix = {
    ok: "OK",
    open: "OPEN",
    blocked: "BLOCKED",
  }[status] || "OPEN";
  return `${prefix}  ${label}${detail ? ` - ${detail}` : ""}`;
}

function missing(keys) {
  return keys.filter(key => !value(key));
}

const appEnv = knownEnvironments.has(value("NEXT_PUBLIC_APP_ENV").toLowerCase())
  ? value("NEXT_PUBLIC_APP_ENV").toLowerCase()
  : (knownEnvironments.has(target) ? target : "local");
const supabaseEnv = knownEnvironments.has(value("NEXT_PUBLIC_SUPABASE_ENV").toLowerCase())
  ? value("NEXT_PUBLIC_SUPABASE_ENV").toLowerCase()
  : appEnv;

const checks = [];
checks.push({
  status: knownEnvironments.has(appEnv) && knownEnvironments.has(supabaseEnv) ? "ok" : "open",
  label: "Environment labels",
  detail: `app=${appEnv}; supabase=${supabaseEnv}`,
});

if ((appEnv === "local" || appEnv === "preview") && supabaseEnv === "production") {
  checks.push({
    status: "blocked",
    label: "PIPE-DEV-001 / SOP-REL-01",
    detail: "local and preview app builds must not connect to production Supabase",
  });
} else {
  checks.push({
    status: "ok",
    label: "PIPE-DEV-001 / SOP-REL-01",
    detail: "no unsafe local/preview-to-production Supabase pairing detected",
  });
}

const supabaseKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_PROJECT_REF",
  "SUPABASE_REGION",
];
const githubKeys = ["GITHUB_OWNER", "GITHUB_REPOSITORY"];
const vercelKeys = ["VERCEL_TEAM", "VERCEL_PROJECT", "VERCEL_PRODUCTION_DOMAIN", "NEXT_PUBLIC_SITE_URL"];

[
  ["Supabase live project", supabaseKeys, "needed before live Auth/RLS/Storage/migration testing"],
  ["GitHub repository", githubKeys, "needed before repo connection and CI execution"],
  ["Vercel deployment", vercelKeys, "needed before preview/production deployment"],
].forEach(([label, keys, detail]) => {
  const missingKeys = missing(keys);
  checks.push({
    status: missingKeys.length ? "open" : "ok",
    label,
    detail: missingKeys.length ? `${detail}; missing ${missingKeys.join(", ")}` : "required values are present",
  });
});

const hasBlocker = checks.some(check => check.status === "blocked");
const hasOpen = checks.some(check => check.status === "open");

console.log(`Moto & Co platform environment check`);
console.log(`Target: ${target}`);
console.log(`Env files loaded: ${envFiles.length ? envFiles.join(", ") : "none"}`);
console.log("");
checks.forEach(check => console.log(statusLine(check.status, check.label, check.detail)));
console.log("");
console.log("This check reports production-readiness inputs only; it does not create projects, send secrets, or connect external services.");

if (hasBlocker || (strict && hasOpen)) {
  process.exit(1);
}
