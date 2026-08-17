import { readFileSync } from "node:fs";

const component = readFileSync("src/components/moto-co-logistics.tsx", "utf8");
const runtimeRoute = readFileSync("src/app/api/runtime-records/route.ts", "utf8");
const liveRuntime = readFileSync("src/lib/live-runtime.ts", "utf8");

const markers = [
  ["runtime supplier link reader", runtimeRoute, "async function supplierLinksByAccountActorId"],
  ["runtime reads actor supplier links", runtimeRoute, '.from("actor_supplier_links")'],
  ["runtime maps supplier actors", runtimeRoute, '.from("actors")'],
  ["runtime merges linked vendors", runtimeRoute, "vendors: mergeSupplierNames(basePayload.vendors, supplierLinks.get(accountActorId) || [])"],
  ["runtime synthesizes relational client", runtimeRoute, "async function relationalClientRowsForCaller"],
  ["runtime appends missing client account", runtimeRoute, "snapshot.clients.push(client)"],
  ["runtime lets clients sync own client record", runtimeRoute, 'if (role === "client") return ["clients", "orders", "exceptions", "operationalNotices"].includes(domainKey);'],
  ["browser lets clients sync own client record", liveRuntime, 'if (role === "client") return ["clients", "orders", "exceptions", "operationalNotices"].includes(domainKey);'],
  ["runtime client write scope includes clients", runtimeRoute, 'caller.roles?.has("client") && ["clients", "orders", "exceptions", "operationalNotices"].includes(domainKey)'],
  ["runtime self-service supplier link sync", runtimeRoute, "async function syncClientSupplierLinks"],
  ["runtime supplier links client-confirmed", runtimeRoute, "client_confirmed_at: now"],
  ["runtime client empty supplier list cannot replace links", runtimeRoute, "const callerCanReplaceLinks = caller.roles?.has(\"admin\") || caller.roles?.has(\"super_admin\");"],
  ["runtime preserves client payload fields", runtimeRoute, "function protectClientPayloadForWrite"],
  ["client supplier normalization", component, "function clientApprovedSupplierNames"],
  ["client dropdown options helper", component, "function clientSupplierOptions"],
  ["client selected supplier display helper", component, "function clientSelectedSupplierOptions"],
  ["client dropdown uses all active suppliers", component, "...activeSupplierList.filter(supplier => !selectedNames.has(supplier.name))"],
  ["client session preserves suppliers", component, "vendors: mergedSuppliers"],
  ["client live duplicate merge", component, "function mergeDuplicateClientProfile"],
  ["client live account readiness guard", component, "function liveClientAccountLoaded"],
  ["client profile save preserves existing fields", component, "function preserveClientProfileFields"],
  ["client portal blocks before snapshot", component, "const liveRuntimeDataPending = liveRuntimeEnabled"],
  ["client order matching uses live actor id", component, "order?.actorId, order?.accountActorId"],
  ["new client portal uses supplier options", component, "const linkedSuppliers = clientSupplierOptions(user, suppliers);"],
  ["legacy client portal uses supplier options", component, "const linkedSuppliers = clientSupplierOptions(user, suppliers);"],
  ["client access normalizer uses supplier helper", component, "vendors: clientApprovedSupplierNames(client)"],
  ["client supplier self-service copy", component, "Active Moto & Co suppliers are available for new orders without Admin approval."],
  ["client supplier save action", component, "Save Suppliers"],
  ["client update syncs live for client role", component, 'syncLiveRuntimeDomain("clients", [stored], workspaceSession)'],
];

const failures = markers
  .filter(([, source, marker]) => !source.includes(marker))
  .map(([label, , marker]) => `${label} missing ${JSON.stringify(marker)}`);

const linkedSupplierUsageCount = (component.match(/const linkedSuppliers = clientSupplierOptions\(user, suppliers\);/g) || []).length;
if (linkedSupplierUsageCount < 2) {
  failures.push(`expected both client portals to use clientSupplierOptions; found ${linkedSupplierUsageCount}`);
}

for (const removedText of ["Request Vendor Setup", "Supplier Setup Request", "Admin approval required"]) {
  if (component.includes(removedText)) failures.push(`supplier self-service UI still contains ${JSON.stringify(removedText)}`);
}

if (failures.length) {
  console.error("Client supplier dropdown verification failed.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Client supplier dropdown verification passed.");
