import { spawnSync } from "node:child_process";

const nodeCommand = process.execPath;
const checks = [
  ["Strict platform environment gate", ["scripts/check-platform-env.mjs", "--target=production", "--strict"]],
  ["Strict launch readiness gate", ["scripts/check-launch-readiness.mjs", "--target=production", "--strict"]],
];

let failed = false;

console.log("Moto & Co production readiness gate");
console.log("This gate is expected to fail until production environment values and live-tooling blockers are resolved.");
console.log("");

for (const [label, args] of checks) {
  console.log(`==> ${label}`);
  const result = spawnSync(nodeCommand, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`\n${label} failed to start: ${result.error.message}`);
    failed = true;
  } else if (result.status !== 0) {
    failed = true;
  }

  console.log("");
}

if (failed) {
  console.error("Production readiness gate failed. Keep production blocked and update the blocker register when answers/access arrive.");
  process.exit(1);
}

console.log("Production readiness gate passed.");
