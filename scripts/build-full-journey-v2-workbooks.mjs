import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "baseline", "v2.0", "full-source", "journeys");
const ORIGINAL = path.join(OUT, "original");

const brand = {
  red: "#E11D48",
  white: "#FFFFFF",
  ink: "#000000",
  blue: "#E8EEF5",
};

const changes = [
  "Simplified Customer Login / Courier Business Login entry model.",
  "Super Admin provisioning included.",
  "Driver pickup item count occurs at pickup, not delivery.",
  "Receiver phone is not required for POD.",
  "Driver same-device offline outbox is not live until sync succeeds.",
  "Driver can bring forward a complete future order under SOP-RUN-04 conditions.",
  "Billing V1 uses portal-generated invoice PDF and Admin manual email.",
  "SLA monitoring and HCM requirements are outside logistics portal scope.",
];

function outputName(name) {
  return name.replace(/\.xlsx$/i, "-v2.0.xlsx");
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  let entries = [];
  try {
    entries = await fs.readdir(ORIGINAL, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".xlsx")) continue;
    const sourcePath = path.join(ORIGINAL, entry.name);
    const blob = await FileBlob.load(sourcePath);
    const workbook = await SpreadsheetFile.importXlsx(blob);
    const sheet = workbook.worksheets.add("V2 Baseline Update");
    const rows = [
      ["Moto and Co Couriers Journey Baseline v2.0", ""],
      ["Source file", entry.name],
      ["Version", "v2.0"],
      ["Status", "Draft for approval"],
      ["Created", "2026-07-02"],
      ["Approval reference", "TBD"],
      ["", ""],
      ["Confirmed journey changes", ""],
      ...changes.map((change) => ["-", change]),
    ];
    sheet.getRange(`A1:B${rows.length}`).values = rows;
    sheet.getRange("A1:B1").merge();
    sheet.getRange("A1:B1").format = {
      fill: brand.red,
      font: { bold: true, color: brand.white, size: 14 },
    };
    sheet.getRange(`A2:A${rows.length}`).format = {
      fill: brand.blue,
      font: { bold: true, color: brand.ink },
    };
    sheet.getRange(`A1:B${rows.length}`).format.borders = {
      preset: "all",
      style: "thin",
      color: "#D9D9D9",
    };
    sheet.getRange("A:B").format.wrapText = true;
    sheet.getRange("A:A").format.columnWidth = 28;
    sheet.getRange("B:B").format.columnWidth = 90;

    const output = await SpreadsheetFile.exportXlsx(workbook);
    await output.save(path.join(OUT, outputName(entry.name)));
  }
  console.log("Journey v2.0 workbooks created.");
}

await main();
