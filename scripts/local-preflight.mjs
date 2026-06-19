import { spawnSync } from "node:child_process";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? process.env.ComSpec || "cmd.exe" : "npm";
const defaultPreflightDistDir = ".next-preflight-build";
const baseEnv = {
  ...process.env,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || "local",
  NEXT_PUBLIC_SUPABASE_ENV: process.env.NEXT_PUBLIC_SUPABASE_ENV || "local",
};
const buildEnv = {
  ...baseEnv,
  NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || defaultPreflightDistDir,
};

const steps = [
  ["Source-backed runtime requirements", ["run", "verify:requirements"], baseEnv],
  ["Platform environment contract", ["run", "verify:platform"], baseEnv],
  ["Launch readiness report", ["run", "verify:launch"], baseEnv],
  ["Supabase migration guardrails", ["run", "verify:migrations"], baseEnv],
  ["TypeScript and Next route metadata", ["run", "typecheck"], baseEnv],
  ["Next production build", ["run", "build"], buildEnv],
];

console.log("Moto & Co local preflight");
console.log(`APP_ENV=${baseEnv.NEXT_PUBLIC_APP_ENV}`);
console.log(`SUPABASE_ENV=${baseEnv.NEXT_PUBLIC_SUPABASE_ENV}`);
console.log(`BUILD_NEXT_DIST_DIR=${buildEnv.NEXT_DIST_DIR}`);
console.log("");

for (const [label, args, stepEnv] of steps) {
  console.log(`==> ${label}`);
  const commandArgs = isWindows ? ["/d", "/s", "/c", "npm.cmd", ...args] : args;
  const result = spawnSync(npmCommand, commandArgs, {
    cwd: process.cwd(),
    env: stepEnv,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`\n${label} failed to start: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\n${label} failed with exit code ${result.status ?? "unknown"}.`);
    process.exit(result.status || 1);
  }

  console.log("");
}

console.log("Local preflight passed.");
