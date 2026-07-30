import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputPath = path.resolve("SOP", "SOP-OPS-01-OfflineDeviceSyncRecovery-v1.0.xlsx");
const previewDir = path.join(process.env.TEMP || ".", "motoco-offline-sop-preview");

const red = "#D80B3A";
const paleRed = "#FCE7EE";
const grey = "#E8E2D4";
const dark = "#111111";
const border = "#C9C1B4";
const green = "#17783B";

const wb = Workbook.create();

function title(sheet, range, text) {
  const r = sheet.getRange(range);
  r.merge();
  r.values = [[text]];
  r.format = {
    fill: red,
    font: { bold: true, color: "#FFFFFF", size: 16 },
    horizontalAlignment: "left",
    verticalAlignment: "center",
  };
  r.format.rowHeight = 34;
}

function section(sheet, range, text) {
  const r = sheet.getRange(range);
  r.merge();
  r.values = [[text]];
  r.format = {
    fill: grey,
    font: { bold: true, color: dark },
    horizontalAlignment: "left",
    verticalAlignment: "center",
  };
  r.format.rowHeight = 24;
}

function table(sheet, startCell, rows, headerFill = red) {
  const startCol = startCell.match(/[A-Z]+/)[0];
  const startRow = Number(startCell.match(/\d+/)[0]);
  const width = rows[0].length;
  const height = rows.length;
  const endCol = String.fromCharCode(startCol.charCodeAt(0) + width - 1);
  const range = sheet.getRange(`${startCell}:${endCol}${startRow + height - 1}`);
  range.values = rows;
  range.format = {
    wrapText: true,
    verticalAlignment: "top",
    borders: { preset: "all", style: "thin", color: border },
  };
  sheet.getRange(`${startCell}:${endCol}${startRow}`).format = {
    fill: headerFill,
    font: { bold: true, color: "#FFFFFF" },
    wrapText: true,
    verticalAlignment: "center",
  };
  return range;
}

function setupSheet(name) {
  const sheet = wb.worksheets.add(name);
  sheet.showGridLines = false;
  sheet.getRange("A:A").format.columnWidth = 18;
  sheet.getRange("B:B").format.columnWidth = 22;
  sheet.getRange("C:C").format.columnWidth = 42;
  sheet.getRange("D:D").format.columnWidth = 52;
  sheet.getRange("E:E").format.columnWidth = 30;
  return sheet;
}

const overview = setupSheet("Overview");
title(overview, "A1:E1", "SOP-OPS-01 Offline Device Sync And Recovery");
overview.getRange("A3:E8").values = [
  ["Version", "1.0", "Status", "Active - written for V1 production testing", ""],
  ["Effective Date", new Date("2026-07-02T00:00:00"), "Owner", "Admin / Operations", ""],
  ["Purpose", "Define what happens when a driver loses internet during a live run and how recovery works.", "", "", ""],
  ["Core Rule", "Offline mode protects the driver device copy. It does not update the live production record until the same device reconnects and sync succeeds.", "", "", ""],
  ["Related Controls", "APP-ADM-005, APP-PRV-004, SOP-DEL-04, SOP-DEL-05, SOP-RUN-04", "", "", ""],
  ["Source", "Operational decision recorded 2026-07-02 after field testing revealed driver network dropouts.", "", "", ""],
];
overview.getRange("A3:E8").format = {
  wrapText: true,
  verticalAlignment: "top",
  borders: { preset: "all", style: "thin", color: border },
};
overview.getRange("A3:A8").format = { fill: grey, font: { bold: true }, wrapText: true };
overview.getRange("C3:C4").format = { fill: grey, font: { bold: true }, wrapText: true };
overview.getRange("B4").format.numberFormat = "yyyy-mm-dd";
section(overview, "A10:E10", "In Scope");
overview.getRange("A11:E16").values = [
  ["Driver pickup confirmation", "", "", "", ""],
  ["Pickup item counting and price calculation", "", "", "", ""],
  ["Bring-forward movement for a complete future order", "", "", "", ""],
  ["Delivery sign-off and POD evidence capture", "", "", "", ""],
  ["Run-close field updates", "", "", "", ""],
  ["Local retry of failed live runtime writes", "", "", "", ""],
];
overview.getRange("A11:E16").format = { wrapText: true, borders: { preset: "inside", style: "thin", color: border } };
section(overview, "A18:E18", "Out Of Scope");
overview.getRange("A19:E24").values = [
  ["Creating a new live order while the portal has not already loaded", "", "", "", ""],
  ["Guaranteed background sync after the browser is closed", "", "", "", ""],
  ["Cross-device visibility before the original driver device syncs", "", "", "", ""],
  ["Reconstructing a lost or malformed signature image", "", "", "", ""],
  ["SLA monitoring or Admin countdowns", "", "", "", ""],
  ["Replacing Admin exception review for unrecoverable field data", "", "", "", ""],
];
overview.getRange("A19:E24").format = { wrapText: true, borders: { preset: "inside", style: "thin", color: border } };

const procedure = setupSheet("Procedure");
title(procedure, "A1:E1", "Procedure");
table(procedure, "A3", [
  ["Phase", "Actor", "Action", "Evidence / Result", "Control"],
  ["1", "Driver", "Loads the driver portal while online before or during the run.", "Current run data is available on the device.", "Driver must stay signed in."],
  ["2", "System", "Detects a live update failure or offline browser state.", "Update is written to the local device queue.", "Do not discard unsynced local state."],
  ["3", "Driver", "Continues pickup, item count, bring-forward, delivery, POD, or run-close work from the loaded portal.", "Device shows the local state change; live users may still see the older state.", "Driver understands local is not live."],
  ["4", "System", "Stores pending update in the device outbox.", "`mc_live_sync_outbox` holds the pending live write and last error if any.", "Outbox count is visible."],
  ["5", "Driver", "Keeps the device signed in and online when signal returns.", "Sync banner remains visible until cleared.", "Device must not be cleared while pending; clear-data warning is approved for UAT."],
  ["6", "Driver / System", "Uses automatic retry or driver presses Retry Sync.", "Successful rows are removed from local outbox.", "Last issue remains visible if retry fails."],
  ["7", "System", "Sync succeeds.", "Live runtime record updates; Client/Admin see the new state after refresh/sync.", "Audit and proof metadata remain linked."],
  ["8", "System", "Sync fails again.", "Last sync issue is shown; pending count remains visible.", "Admin can review error text."],
  ["9", "Admin", "Reviews unresolved sync issue if the same device cannot clear it.", "Admin reconstructs status/POD from driver evidence and records exception/recovery decision under APP-ADM-005.", "Manual correction needs reason and evidence."],
]);
procedure.getRange("A4:A12").format = { horizontalAlignment: "center" };
procedure.freezePanes.freezeRows(3);

const controls = setupSheet("Controls");
title(controls, "A1:E1", "Controls And Records");
table(controls, "A3", [
  ["Control / Record", "Type", "Rule", "System Behaviour", "Open Decision"],
  ["Pending sync count", "Control", "Driver sees unsynced update count.", "Shown in driver portal when local updates are pending.", "None for V1."],
  ["Last sync issue", "Control", "Driver/Admin can see the most recent failure reason.", "Network, browser data, signature, Storage/RLS, or runtime write errors are surfaced.", "Admin recovery is approved for UAT after ERD approval and schema/runtime reconciliation."],
  ["Clear saved device data", "Control", "Must warn that local unsynced updates may be abandoned.", "Local cache/outbox is reset only after warning/Admin acceptance.", "Re-execute after ERD approval and schema/runtime reconciliation."],
  ["Signature upload status", "Record", "Bad image or Storage failure must not block order/proof metadata sync.", "`storage_pending:*` marks unresolved proof object upload.", "Live Storage UAT."],
  ["APP-ADM-005 exception", "Record", "Manual recovery is recorded as an exception.", "Admin records correction reason, linked work item, and driver evidence used for reconstruction.", "Re-execute after ERD approval and schema/runtime reconciliation."],
  ["APP-PRV-004 audit", "Record", "Production data/PII corrections are auditable.", "Audit event is required for manual correction where applicable.", "Live audit/RLS UAT."],
]);
controls.freezePanes.freezeRows(3);

const testing = setupSheet("UAT Checklist");
title(testing, "A1:E1", "UAT Checklist");
table(testing, "A3", [
  ["Test", "Expected Result", "Owner", "Status", "Evidence Required"],
  ["Supported device/browser evidence", "Actual driver device, OS, browser, and version are captured.", "Driver / Admin", "Not run - re-execute after ERD", "Device/browser detail plus driver/Admin comparison screenshots."],
  ["Pickup while offline, reconnect", "Client sees En Route after sync succeeds.", "Driver / Admin", "Not run - re-execute after ERD approval and schema/runtime reconciliation", "Screenshot or runtime record before and after sync."],
  ["POD while offline, reconnect", "Client sees Delivered after sync succeeds.", "Driver / Admin", "Not run - re-execute after ERD approval and schema/runtime reconciliation", "POD record and order status linked."],
  ["Signature upload failure", "Order status and proof metadata still sync; storage_pending is visible.", "Admin", "Not run", "Proof row with upload status."],
  ["Retry Sync", "Pending count clears after connectivity returns.", "Driver", "Not run - re-execute after ERD", "Driver portal pending count before/after."],
  ["Clear saved device data test", "Disposable test order confirms clearing warns and can abandon unsynced local updates.", "Admin", "Not run - re-execute after ERD", "Admin sign-off that it is not used on live unsynced work."],
  ["Manual recovery", "Admin can correct stuck status with APP-ADM-005 evidence.", "Admin", "Not run - re-execute after ERD", "Exception record and corrected order history."],
  ["POD without photo/GPS", "Delivered succeeds with receiver name and signature only.", "Driver / Receiver", "Not run - re-execute after ERD", "POD completion and client delivered evidence."],
]);
testing.getRange("D4:D9").dataValidation = { rule: { type: "list", values: ["Not run", "Pass", "Fail", "Blocked"] } };
testing.getRange("D4:D9").conditionalFormats.add("containsText", { text: "Pass", format: { fill: "#D9EAD3", font: { color: green, bold: true } } });
testing.getRange("D4:D9").conditionalFormats.add("containsText", { text: "Fail", format: { fill: paleRed, font: { color: red, bold: true } } });
testing.freezePanes.freezeRows(3);

const gaps = setupSheet("Open Gaps");
title(gaps, "A1:E1", "Open Gaps");
table(gaps, "A3", [
  ["Gap", "Why It Matters", "Current Position", "Owner", "Next Decision"],
  ["Minimum driver browser/device policy", "Offline reliability depends on device/browser storage and connectivity behaviour.", "Approved for UAT evidence.", "Admin / Digiverse", "Capture exact device/browser and re-execute after ERD approval and schema/runtime reconciliation."],
  ["True PWA background sync / IndexedDB", "LocalStorage outbox works only when the loaded browser session can retry.", "Not implemented in V1.", "Digiverse", "Decide whether to upgrade after field testing."],
  ["Live Storage policy and proof-object persistence", "POD signature file must persist privately for seven years.", "Proof metadata can sync; Storage UAT still required.", "Digiverse", "Run live iPad Storage UAT."],
  ["Unrecoverable local outbox procedure", "Admin needs a controlled path if the device cannot sync.", "Approved: reconstruct from driver evidence and record APP-ADM-005/audit.", "Admin", "Re-execute after ERD approval and schema/runtime reconciliation."],
  ["Local device cache retention", "Local copies may contain delivery and receiver personal information.", "Approved: retain until sync/Admin recovery succeeds, then clear.", "GM Moto & Co Logistics", "Re-execute after ERD approval and schema/runtime reconciliation."],
]);
gaps.freezePanes.freezeRows(3);

for (const sheet of wb.worksheets.items) {
  sheet.getRange("A:E").format.font = { name: "Aptos", size: 10 };
  sheet.getUsedRange().format.autofitRows();
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

for (const sheet of wb.worksheets.items) {
  const preview = await wb.render({ sheetName: sheet.name, autoCrop: "all", scale: 1, format: "png" });
  const safeName = sheet.name.replace(/[^a-z0-9]+/gi, "-");
  await fs.writeFile(path.join(previewDir, `SOP-OPS-01-${safeName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(outputPath);
console.log(`Saved ${outputPath}`);
