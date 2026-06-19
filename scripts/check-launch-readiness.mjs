import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const target = (
  args.find((arg) => arg.startsWith("--target="))?.split("=")[1] ||
  process.env.NEXT_PUBLIC_APP_ENV ||
  "local"
).toLowerCase();
const isWindows = process.platform === "win32";
const envFiles = [".env", ".env.local"].filter((file) => fs.existsSync(path.join(cwd, file)));
const knownEnvironments = new Set(["local", "preview", "production"]);

function parseEnvFile(file) {
  const text = fs.readFileSync(path.join(cwd, file), "utf8");
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const raw = line.slice(index + 1).trim();
        const value = raw.replace(/^['"]|['"]$/g, "");
        return [key, value];
      }),
  );
}

const fileEnv = envFiles.reduce((acc, file) => ({ ...acc, ...parseEnvFile(file) }), {});
const env = { ...fileEnv, ...process.env };

function value(key) {
  return String(env[key] || "").trim();
}

function missing(keys) {
  return keys.filter((key) => !value(key));
}

function commandStatus(command, argsForVersion) {
  const runViaCmd = isWindows && !path.isAbsolute(command);
  const result = runViaCmd
    ? spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", command, ...argsForVersion], {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      })
    : spawnSync(command, argsForVersion, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });

  if (result.error || result.status !== 0) {
    return { available: false };
  }

  const version = `${result.stdout || result.stderr}`.split(/\r?\n/).find(Boolean) || "available";
  return { available: true, version: version.trim() };
}

function firstAvailableCommand(candidates) {
  for (const candidate of candidates) {
    const result = commandStatus(candidate.command, candidate.args);
    if (result.available) return result;
  }
  return { available: false };
}

function statusLine(status, label, detail) {
  const prefix = {
    ok: "OK",
    open: "OPEN",
    blocked: "BLOCKED",
  }[status] || "OPEN";
  return `${prefix}  ${label}${detail ? ` - ${detail}` : ""}`;
}

const appEnv = knownEnvironments.has(value("NEXT_PUBLIC_APP_ENV").toLowerCase())
  ? value("NEXT_PUBLIC_APP_ENV").toLowerCase()
  : knownEnvironments.has(target)
    ? target
    : "local";
const supabaseEnv = knownEnvironments.has(value("NEXT_PUBLIC_SUPABASE_ENV").toLowerCase())
  ? value("NEXT_PUBLIC_SUPABASE_ENV").toLowerCase()
  : appEnv;

const checks = [];
checks.push({
  status: knownEnvironments.has(appEnv) && knownEnvironments.has(supabaseEnv) ? "ok" : "open",
  label: "Environment labels",
  detail: `app=${appEnv}; supabase=${supabaseEnv}`,
});

checks.push(
  (appEnv === "local" || appEnv === "preview") && supabaseEnv === "production"
    ? {
        status: "blocked",
        label: "PIPE-DEV-001 / SOP-REL-01",
        detail: "local and preview app builds must not connect to production Supabase",
      }
    : {
        status: "ok",
        label: "PIPE-DEV-001 / SOP-REL-01",
        detail: "no unsafe local/preview-to-production Supabase pairing detected",
      },
);

const toolChecks = [
  [
    "Git CLI",
    [
      { command: "git", args: ["--version"] },
      ...(isWindows ? [{ command: "C:\\Program Files\\Git\\cmd\\git.exe", args: ["--version"] }] : []),
    ],
    "needed to initialise, commit, and push the GitHub repository",
  ],
  [
    "Supabase CLI",
    [
      { command: "supabase", args: ["--version"] },
      { command: isWindows ? "npx.cmd" : "npx", args: ["supabase", "--version"] },
    ],
    "needed for live migration execution and project checks unless Digiverse runs them elsewhere",
  ],
  [
    "Vercel CLI",
    [
      { command: "vercel", args: ["--version"] },
      { command: isWindows ? "npx.cmd" : "npx", args: ["vercel", "--version"] },
    ],
    "needed for local deployment verification unless Vercel is connected through GitHub only",
  ],
];

toolChecks.forEach(([label, candidates, missingDetail]) => {
  const result = firstAvailableCommand(candidates);
  checks.push({
    status: result.available ? "ok" : "open",
    label,
    detail: result.available ? result.version : missingDetail,
  });
});

const envGroups = [
  [
    "GitHub repository values",
    ["GITHUB_OWNER", "GITHUB_REPOSITORY"],
    "needed before repository connection and live GitHub Actions evidence",
  ],
  [
    "Supabase project values",
    [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_PROJECT_REF",
      "SUPABASE_REGION",
    ],
    "needed before live Auth/RLS/Storage/migration and data-residency testing",
  ],
  [
    "Vercel deployment values",
    ["VERCEL_TEAM", "VERCEL_PROJECT", "VERCEL_PRODUCTION_DOMAIN", "NEXT_PUBLIC_SITE_URL"],
    "needed before preview/production deployment",
  ],
];

envGroups.forEach(([label, keys, detail]) => {
  const missingKeys = missing(keys);
  checks.push({
    status: missingKeys.length ? "open" : "ok",
    label,
    detail: missingKeys.length ? `${detail}; missing ${missingKeys.join(", ")}` : "required values are present",
  });
});

checks.push({
  status: fs.existsSync(path.join(cwd, ".git")) ? "ok" : "open",
  label: "Local Git repository",
  detail: fs.existsSync(path.join(cwd, ".git"))
    ? ".git directory exists"
    : "workspace is not initialised as a Git repository",
});

const hasBlocked = checks.some((check) => check.status === "blocked");
const hasOpen = checks.some((check) => check.status === "open");

console.log("Moto & Co launch readiness check");
console.log(`Target: ${target}`);
console.log(`Env files loaded: ${envFiles.length ? envFiles.join(", ") : "none"}`);
console.log("");
checks.forEach((check) => console.log(statusLine(check.status, check.label, check.detail)));
console.log("");
console.log("This check is read-only. It does not create repositories, run migrations, deploy, or print secret values.");

if (hasBlocked || (strict && hasOpen)) {
  process.exit(1);
}
