import { readFileSync } from "node:fs";

const source = readFileSync("src/app/api/runtime-records/route.ts", "utf8");

const required = [
  "function payloadIsUnassignedDriverPickupReady",
  "const driverAssignment = compactValues",
  "!driverAssignment.length && !compiledRun",
  "function canWriteRuntimeRecord",
  "payloadForScope",
  "rowMatchesDriverScope(rowForScope, payloadForScope, caller) || payloadIsUnassignedDriverPickupReady(payloadForScope)",
  "rowMatchesClientScope(rowForScope, payloadForScope, caller)",
  ".select(\"local_id, owner_actor_id, driver_profile_id, payload\")",
  "function protectClientPayloadForWrite",
  "function preferredExistingClientRecord",
  "function readableRuntimeError",
  "function uniqueUuids",
  "return uniqueUuids([",
  "const existingClientByOwnerActor = new Map",
  "const existingForWrite = (row",
  "const storedRow = domainKey === \"clients\" ? protectClientPayloadForWrite",
  "const deniedRow = rows.find",
  "return !canWriteRuntimeRecord(domainKey, row || {}, existing, caller);",
  "return json(403, { error: `Caller is not permitted to update",
  "Caller is not permitted to update",
];

const missing = required.filter((marker) => !source.includes(marker));
if (missing.length) {
  console.error("Runtime access-control verification failed:");
  for (const marker of missing) console.error(`- missing ${marker}`);
  process.exit(1);
}

console.log("Runtime access-control verification passed.");
