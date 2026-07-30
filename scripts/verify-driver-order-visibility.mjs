import { readFileSync } from "node:fs";

function requireText(source, markers, label) {
  const missing = markers.filter((marker) => !source.includes(marker));
  if (!missing.length) {
    console.log(`PASS ${label}`);
    return;
  }

  console.error(`FAIL ${label}`);
  for (const marker of missing) {
    console.error(`- missing ${marker}`);
  }
  process.exitCode = 1;
}

const driverPortal = readFileSync("src/components/moto-co-logistics.tsx", "utf8");
const runtimeApi = readFileSync("src/app/api/runtime-records/route.ts", "utf8");

requireText(
  driverPortal,
  [
    "function orderHasCompiledDriverRun",
    "function orderNeedsDriverCreatedRun",
    "function clearDriverRunAssignmentFields",
    "return orderIsDriverPickupReady(order) && !orderHasCompiledDriverRun(order);",
    "matchesDriverOrder(order, user) || orderNeedsDriverCreatedRun(order)",
    "const unassignedDispatch = orders.filter(o => orderNeedsDriverCreatedRun(o));",
    "const compileCandidates = sequenceRunOrders(unassignedDispatch.filter(order => driverRunDateValue(order) === compileRunDate));",
    "driver_created_run_intake",
    "Auto-assigned pickups released",
    "Ready Con Notes Not Yet In Today's Run",
    "These are visible to the driver now and will be pulled into the run by Create Daily Run.",
  ],
  "driver portal keeps uncompiled ready con notes visible"
);

if (/dispatchMode:\s*["']single_active_driver_auto_assignment["']/.test(driverPortal)) {
  console.error("FAIL driver portal must not create legacy single-driver auto assignments");
  process.exitCode = 1;
} else {
  console.log("PASS driver portal does not create legacy single-driver auto assignments");
}

requireText(
  driverPortal,
  [
    "order.assignedDriverCode",
    "order.driverActorCode",
    "order.driverContactId",
    "order?.assignedDriverEmail",
    "order?.assignedDriverName",
    "order?.pickupDriverName",
  ],
  "driver portal matches modern driver identity fields"
);

requireText(
  runtimeApi,
  [
    "assignedDriverCode",
    "driverActorCode",
    "driverContactId",
    "assignedDriverEmail",
    "assignedDriverName",
    "pickupDriverName",
    "rowExplicitlyClearsDriverProfile",
  ],
  "runtime API matches modern driver identity fields"
);

requireText(
  runtimeApi,
  [
    "const driverAssignment = compactValues",
    "const compiledRun = String(payload.runId || payload.runCompiledAt || payload.runCompiledBy || \"\").trim();",
    "return !terminal && !pickupCollected && pickupReady && !driverAssignment.length && !compiledRun;",
  ],
  "runtime API exposes genuinely unassigned pickup-ready records until a compiled run exists"
);

if (process.exitCode) {
  console.error("\nDriver order visibility verification failed.");
  process.exit(process.exitCode);
}

console.log("\nDriver order visibility verification passed.");
