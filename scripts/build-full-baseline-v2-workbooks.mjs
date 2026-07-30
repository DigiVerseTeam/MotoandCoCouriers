import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const ROOT = process.cwd();
const BASE = path.join(ROOT, "baseline", "v2.0", "full-source");
const BOAS_OUT = path.join(BASE, "BOAS");
const SOP_OUT = path.join(BASE, "SOP");

const brand = {
  red: "#E11D48",
  gray: "#B9B9C3",
  cream: "#F3F3E8",
  white: "#FFFFFF",
  ink: "#000000",
  blue: "#E8EEF5",
};

const sopImpacts = {
  "SOP-BIL-01-MonthEndBillingReview-v1.2.xlsx": {
    version: "1.3",
    notes: [
      "Billing V1 runtime creates downloadable EOM invoice PDFs grouped by client/month.",
      "Admin reviews proof-linked delivered work before invoice generation.",
      "Admin email, payment follow-up, and bank reconciliation are off-system human/accounting processes; no OpenClaw/Xero/accounting API path is in V1.",
    ],
  },
  "SOP-BIL-04-CreateSendInvoice-v1.2.xlsx": {
    version: "1.3",
    notes: [
      "Replace external accounting/send integration path with portal-generated downloadable invoice PDF only.",
      "Admin downloads PDF and emails client manually outside the portal.",
      "Email bounce handling, payment follow-up, and bank reconciliation are outside the V1 runtime.",
    ],
  },
  "SOP-PUP-02-ConfirmCustomerPickup-v1.1.xlsx": {
    version: "1.2",
    notes: [
      "Driver counts tyres, parts, and returns at pickup, not delivery.",
      "Pickup count becomes the pricing basis for delivery sign-off and billing.",
      "Driver can edit pickup item counts before completing pickup if a typo is found.",
    ],
  },
  "SOP-DEL-04-DeliverySignOffProof-v1.2.xlsx": {
    version: "1.3",
    notes: [
      "Delivery sign-off verifies pickup-counted items and price.",
      "Receiver name and signature are mandatory; receiver phone is not required.",
      "Storage-pending proof metadata is allowed for Admin review if signature upload fails.",
    ],
  },
  "SOP-DEL-05-DeliveryCompletion-v1.1.xlsx": {
    version: "1.2",
    notes: [
      "Delivered status requires receiver name and signature.",
      "Offline completion does not update live records until sync succeeds.",
      "Billing-ready status depends on proof-linked completion.",
    ],
  },
  "SOP-RUN-04-BringForwardPickup-v1.1.xlsx": {
    version: "1.2",
    notes: [
      "Driver can bring forward a ready next-day package at the depot as part of the daily run workflow.",
      "Supplier must already be on today's route and no detour is allowed unless separately approved.",
      "Original intended run date remains audit evidence.",
    ],
  },
  "SOP-RUN-01-DriverMilkRunPlanning-v1.2.xlsx": {
    version: "1.3",
    notes: [
      "Previous evening-before run lockdown is rejected for V1.",
      "Driver creates the daily run from ready con notes.",
      "At each depot, driver can collect planned milk-run package, bring forward ready next-day package, or record ready package with no con note/customer missed portal entry.",
    ],
  },
  "SOP-MDM-01-SupplierMasterDataMaintenance-v1.1.xlsx": {
    version: "1.2",
    notes: [
      "Ficeda is removed from active V1 supplier network.",
      "Active suppliers: Link International, A1 Accessories, McLeods, Gas Imports, Whites Powersports.",
      "Supplier archive/reactivation requires reason and evidence.",
    ],
  },
  "SOP-MDM-02-CourierItemPricingMasterData-v1.1.xlsx": {
    version: "1.2",
    notes: [
      "Pricing remains table-driven and not driver-entered.",
      "Corrected pricing schedule requires Owner approval evidence.",
      "Production authority tension remains TBD where source says Digiverse executes approved updates.",
    ],
  },
  "SOP-PRV-01-PrivacyConsentCapture-v1.2.xlsx": {
    version: "1.3",
    notes: [
      "Privacy and collection notices must cover receiver name/signature and portal registration data.",
      "Privacy Owner is role-based GM Moto & Co Logistics.",
      "Offline same-device cache/outbox wording is approved for UAT and must be re-executed after ERD approval and schema/runtime reconciliation.",
    ],
  },
  "SOP-PRV-02-DataRetentionDestruction-v1.2.xlsx": {
    version: "1.3",
    notes: [
      "Local device cache/outbox remains only until sync or Admin recovery succeeds, then clears.",
      "POD retention remains 7 years from delivery date.",
      "Privacy Owner is role-based GM Moto & Co Logistics; UAT evidence is required after ERD approval and schema/runtime reconciliation.",
    ],
  },
  "SOP-IAM-01-CustomerAccessRegistration-v1.2.xlsx": {
    version: "1.3",
    notes: [
      "Customer Login / Courier Business Login is the active entry model.",
      "Customer activation and password setup/reset remain portal-driven.",
      "Admin can provision users; Super Admin governance remains active.",
    ],
  },
  "SOP-IAM-04-StaffRoleAccessManagement-v1.1.xlsx": {
    version: "1.2",
    notes: [
      "Super Admin role is active for provisioning Admin users.",
      "Admin cannot create Admin/Super Admin unless Super Admin permission exists.",
      "RLS/Auth live proof remains open.",
    ],
  },
  "SOP-CUS-01-CustomerAccountSetup-v1.1.xlsx": {
    version: "1.2",
    notes: [
      "Admin approval controls customer activation before booking opens.",
      "Approved suppliers are controlled master data.",
      "Activation notifications remain manual/provider-TBD.",
    ],
  },
  "SOP-REQ-01-SubmitPickupRequest-v1.1.xlsx": {
    version: "1.2",
    notes: [
      "Client sees scheduled run status and received/scheduled wording.",
      "Supplier/customer con-note timing is upstream input, not a BOAS process owned by the portal.",
      "Ready future/no-con-note depot pickups are handled through the approved driver daily-run workflow once built.",
    ],
  },
  "SOP-OPS-01-OfflineDeviceSyncRecovery-v1.0.xlsx": {
    version: "1.0",
    notes: [
      "New SOP added for V1 field testing.",
      "Same-device local outbox is not live until sync succeeds.",
      "Supported device/browser, local retention, clear-data warning, unrecoverable recovery, and POD photo non-mandatory position are approved for UAT and must be re-executed after ERD approval and schema/runtime reconciliation.",
    ],
  },
  "SOP-JDD-01-DriverApplicationOnboarding-v1.1.xlsx": {
    version: "1.2",
    notes: [
      "Preserved for future HCM work.",
      "Driver legal classification, agreements, verification, and disciplinary consequences are not logistics portal scope.",
    ],
  },
};

function bumpMinorFromName(name) {
  const match = name.match(/-v(\d+)\.(\d+)\.xlsx$/);
  if (!match) return "2.0";
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return `${major}.${minor + 1}`;
}

function outputName(inputName, version) {
  if (inputName.match(/-v\d+\.\d+\.xlsx$/)) {
    return inputName.replace(/-v\d+\.\d+\.xlsx$/, `-v${version}.xlsx`);
  }
  return inputName.replace(/\.xlsx$/, `-v${version}.xlsx`);
}

function rowsForBaselineSheet(docName, version, notes, status = "Draft for approval") {
  return [
    ["Moto and Co Couriers Baseline Update", ""],
    ["Document", docName],
    ["Version", version],
    ["Status", status],
    ["Created", "2026-07-02"],
    ["Baseline pack", "baseline/v2.0"],
    ["Approval reference", "TBD"],
    ["Owner", "TBD"],
    ["", ""],
    ["Confirmed V1 operating changes", ""],
    ...notes.map((note) => ["-", note]),
    ["", ""],
    ["Hard boundaries", "No SLA monitoring in logistics portal; no HCM legal/classification requirements in logistics portal."],
    ["Policy status", "Policy Owner/legal owner approval remains TBD where legal copy is affected."],
  ];
}

function applyBasicFormat(sheet, rows, columns = "A:B") {
  const range = sheet.getRange(`A1:B${rows.length}`);
  range.values = rows;
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
  sheet.getRange(columns).format.wrapText = true;
  sheet.getRange("A:A").format.columnWidth = 24;
  sheet.getRange("B:B").format.columnWidth = 90;
}

function setCell(sheet, address, value) {
  sheet.getRange(address).values = [[value]];
  sheet.getRange(address).format.wrapText = true;
}

function patchBoasOperatingSheets(workbook) {
  const hierarchy = workbook.worksheets.getItem("01 Hierarchy");
  setCell(
    hierarchy,
    "K21",
    [
      "DEFINED (v2.0 baseline - July 2026):",
      "",
      "PICKUP WINDOW:",
      "- Goods should be ready at supplier dock by 10:00am where supplier process allows.",
      "- Customer/supplier con-note timing is an upstream input, not a BOAS-controlled portal process.",
      "- The previous evening-before/day-before run lockdown is rejected for V1.",
      "- Driver uses Create Daily Run to consolidate con notes ready now.",
      "",
      "DEPOT COLLECTION OPTIONS:",
      "- Planned milk-run package.",
      "- Bring-forward ready next-day package where the complete order is ready.",
      "- Ready package with no con note/customer missed portal entry, captured as an exception/evidence item.",
      "",
      "PACKAGING STANDARD:",
      "- Goods must be labelled with customer name and con note where available.",
      "- Packaging must be appropriate for item type.",
      "- Driver may refuse non-compliant goods and record No Pickup with reason.",
    ].join("\n"),
  );
  setCell(
    hierarchy,
    "K22",
    "Standard freight pricing ex GST: 1 tyre $18.50; 2 tyres $24.00; 3 tyres $33.00; 4+ tyres $12.30 each; parts up to 5kg $17.20; parts 5-10kg $21.00; parts 10kg+ from $25.00 subject to handling approval; return to supplier pre-labelled $6.00; out-of-zone $10.00; oversized/bulky quoted on application.",
  );
  setCell(
    hierarchy,
    "E23",
    "APP-ADM-003\n(Supabase - compiles proof-linked billable jobs)\n\nAdmin (ACT-INT-002)\n- approves billing group (human gate)\n\nAPP-ADM-004\n(Supabase - generates downloadable invoice PDF only)",
  );
  setCell(
    hierarchy,
    "K23",
    "DEFINED - APP-ADM-003 + APP-ADM-004 (Supabase): APP-ADM-003 compiles proof-linked delivered jobs grouped by account and billing period. Admin approves the billing group. APP-ADM-004 generates a downloadable EOM invoice PDF for Admin. Admin emails the PDF manually outside the portal. Payment follow-up, bank reconciliation, BAS/accountant handoff, OpenClaw, Xero, and accounting API integrations are outside V1 runtime.",
  );
  setCell(
    hierarchy,
    "E63",
    "PIPE-DEV-001 (GitHub Actions + Vercel deployment gate) + ACT-TECH-001 Digiverse (human approves go/no-go)",
  );
  setCell(
    hierarchy,
    "E64",
    "PIPE-DEV-001 (Vercel production rollback) + ACT-TECH-001 Digiverse (human decides rollback trigger)",
  );

  const modules = workbook.worksheets.getItem("02 Process Modules");
  setCell(
    modules,
    "J10",
    "V2 baseline: previous night-before lockdown is rejected. Driver creates the daily run from ready con notes. At depot, Driver may collect planned milk-run packages, bring forward complete ready next-day packages, or record ready packages with no con note/customer missed portal entry. Grace/no-pickup evidence remains source-backed.",
  );
  setCell(
    modules,
    "G14",
    "APP-ADM-003 (Supabase - compiles proof-linked billable jobs by account/period)\nAdmin (ACT-INT-002) - approves billing group (human gate)\nAPP-ADM-004 (Supabase - generates downloadable invoice PDF only; Admin emails manually outside portal)",
  );
  setCell(
    modules,
    "G18",
    "PIPE-DEV-001 (GitHub Actions + Vercel deployment gate - automated smoke tests, deploy gate, rollback) ACT-TECH-001 Digiverse - human go/no-go on every deployment Admin (ACT-INT-002) - approves releases affecting billing/pricing",
  );
  setCell(
    modules,
    "J18",
    "Covers GitHub Actions + Vercel production deployment controls today; written as software release control.",
  );

  const processTasks = workbook.worksheets.getItem("03 Processes & Tasks");
  setCell(processTasks, "E39", "APP-ADM-004\n(Supabase - generates downloadable invoice PDF only; Admin emails manually outside portal)");
  setCell(processTasks, "E53", "PIPE-DEV-001 (Vercel deployment after Actions pass) + ACT-TECH-001 Digiverse (go/no-go)");
  setCell(processTasks, "E54", "PIPE-DEV-001 (Vercel rollback) + ACT-TECH-001 Digiverse (decides trigger)");

  const sopRegister = workbook.worksheets.getItem("04 SOP Register");
  setCell(sopRegister, "H15", "Standard freight pricing ex GST is table-driven from price_rules: 1 tyre $18.50, 2 tyres $24.00, 3 tyres $33.00, 4+ tyres $12.30 each; parts bands $17.20/$21.00/from $25.00; returns/out-of-zone/oversized as approved.");
  setCell(sopRegister, "E20", "Admin (ACT-INT-002) - approves group (human gate)\nAPP-ADM-004 (Supabase - generates downloadable invoice PDF only; no runtime email/API/accounting integration)");

  const policyRegister = workbook.worksheets.getItem("09 Policy Register");
  setCell(
    policyRegister,
    "D13",
    "Official pricing tiers ex GST: 1 tyre $18.50; 2 tyres $24.00; 3 tyres $33.00; 4+ tyres $12.30 each; parts up to 5kg $17.20; parts 5-10kg $21.00; parts 10kg+ from $25.00 subject to handling approval; return to supplier pre-labelled $6.00; out-of-zone delivery $10.00; oversized/bulky freight quoted on application. Pricing changes require the approved price_rules governance path.",
  );
  setCell(
    policyRegister,
    "D21",
    "Supplier/customer con-note timing is an upstream input. Previous evening-before/day-before run lockdown is rejected for V1. Driver creates the daily run from ready con notes and, at each depot, can collect planned milk-run packages, bring forward complete ready next-day packages, or record ready packages with no con note/customer missed portal entry.",
  );
  setCell(policyRegister, "I27", "POL-MCL-002-001 / CAP-MCL-002 Run Planning & Dispatch - V2 baseline: driver-created daily run replaces previous evening-before lockdown for V1; named driver/vehicle evidence and fleet compliance remain required.");

  const crosswalk = workbook.worksheets.getItem("13 Source Crosswalk");
  setCell(
    crosswalk,
    "B14",
    "Application database confirmed as Supabase (PostgreSQL). Runtime modules use Supabase tables, RLS, functions/triggers, Storage, Auth, and Vercel deployment. GitHub is the source-control target. Legacy third-party automation and accounting-system references are not V1 runtime dependencies.",
  );
  setCell(
    crosswalk,
    "B28",
    [
      "Confirmed runtime decisions recorded through July 2026:",
      "BOOKING: Supplier list is Admin-managed DB table, not hardcoded. Customer CRM uses the lean Village CRM subset.",
      "POD: Mandatory receiver name + signature. Photo not mandatory for V1. GPS not required. Supabase private bucket. Retention 7 years.",
      "BILLING: price_rules Admin-managed DB table. V1 runtime creates downloadable EOM invoice PDF only; Admin email/payment/bank reconciliation are out-of-system human processes. No OpenClaw/Xero/accounting API integration in V1.",
      "RUNS: previous evening-before lockdown rejected. Driver Create Daily Run consolidates ready con notes and depot collection types after ERD approval and schema/runtime build.",
      "BRAND/UI: 5 brand colours final. Error/warning/success direction red/coral. Logo PNG approved. Photography placeholders at launch.",
      "PLATFORM: GitHub/Vercel/Supabase production target. No preview-to-production Supabase. AU/Sydney data residency accepted in principle, evidence/UAT still required.",
      "ROLES: Super Admin, Admin, Client Operational, Client Billing, Driver, Receiver no-login.",
      "COMPLIANCE: Policies #3,4,5,7,21 govern. Privacy Owner is role-based GM Moto & Co Logistics; retained role/contact evidence still required.",
    ].join("\n"),
  );

  const villageActors = workbook.worksheets.getItem("14 The Village — Actors");
  setCell(
    villageActors,
    "I20",
    "Builds, maintains and supports the Moto & Co Logistics portal and Moto & Co Couriers app. Manages deployment pipeline (GitHub/Supabase + Vercel), environment variables, integrations and rollbacks. Operates within Otimi approval controls and the V1 runtime boundary.",
  );
  setCell(
    villageActors,
    "I36",
    [
      "Build, maintain and operate the Moto & Co platform stack on behalf of Digiverse:",
      "",
      "APPLICATION DATABASE:",
      "- Supabase (PostgreSQL) - schema design, RLS policies, database functions, audit log tables, storage buckets.",
      "",
      "RUNTIME SERVICES:",
      "- Supabase Auth, Storage, database functions/triggers, and controlled server-side workflow logic.",
      "- Invoice email dispatch, bounce handling, payment follow-up, bank reconciliation, OpenClaw, Xero, and accounting APIs are outside V1 runtime.",
      "",
      "CI/CD PIPELINE:",
      "- GitHub source control and workflow checks.",
      "- Vercel frontend/app hosting.",
      "- PIPE-DEV-001 Release Gate Pipeline - deterministic, no tokens in source.",
      "",
      "HUMAN GATE:",
      "- Approves every production deployment.",
      "- Manages Supabase project keys, service role keys, and environment secrets.",
    ].join("\n"),
  );

  const influenceMap = workbook.worksheets.getItem("16 The Village — Influence Map");
  setCell(
    influenceMap,
    "C13",
    "The individual within Digiverse who is accountable for technical delivery to Moto & Co. Makes platform implementation decisions for Supabase schema, RLS policies, Edge Functions, GitHub Actions pipeline, Vercel deployment, environment variables, secrets, and rollback controls under Moto & Co approval.",
  );

  const aiAgentDesign = workbook.worksheets.getItem("17 AI Agent Design");
  setCell(
    aiAgentDesign,
    "A26",
    "RELEASE CONTROL - CI/CD Pipeline (deterministic). Zero token spend. GitHub Actions + Vercel deployment gate. Digiverse builds and maintains.",
  );
  setCell(
    aiAgentDesign,
    "H5",
    "Supabase implementation:\n- Orders table with RLS; clients can insert/read only their own scoped rows.\n- Database/server logic validates supplier in client's approved supplier list.\n- 12:30pm Brisbane cut-off is applied for schedule status.\n- Notification provider remains out of scope/unconfirmed for V1; no Resend/Postmark dependency is part of the baseline.\nNo LLM. No tokens.",
  );
  setCell(
    aiAgentDesign,
    "H8",
    "Supabase implementation:\n- Billing group approval creates a portal-generated invoice PDF/download record.\n- Jobs are linked to invoice records to prevent double billing.\n- Admin downloads the PDF and emails manually outside the portal.\n- Bounce handling, payment follow-up, bank reconciliation, Xero/OpenClaw/accounting APIs, and invoice send webhooks are outside V1 runtime.\nNo LLM. No tokens.",
  );
  setCell(
    aiAgentDesign,
    "H27",
    "Digiverse CI/CD implementation:\n- GitHub Actions workflow runs on production source changes.\n- Smoke tests cover critical portal journeys before production deploy.\n- Vercel hosts the production frontend/app.\n- Supabase production changes require controlled migration and evidence.\n- Human go/no-go and rollback control remain with Digiverse under Moto & Co approval.",
  );

  const businessModel = workbook.worksheets.getItem("19 Business Model");
  setCell(businessModel, "E21", "The business compiles and dispatches efficient, correctly sequenced milk runs by consolidating ready con notes into a driver-created daily run, with named driver/vehicle evidence and Admin exception visibility.");
  setCell(businessModel, "C38", "Every run must have a named driver and named vehicle before departure. V1 rejects hard day-before lockdown; Driver Create Daily Run consolidates ready con notes and captures planned, brought-forward, and no-con-note depot pickups.");

  const serviceModel = workbook.worksheets.getItem("20 Service Model");
  setCell(
    serviceModel,
    "C17",
    "Per-delivery pricing, billed monthly, ex GST:\nTYRES: 1 tyre $18.50; 2 tyres $24.00; 3 tyres $33.00; 4+ tyres $12.30 each.\nGENERAL PARTS: up to 5kg $17.20; 5-10kg $21.00; 10kg+ from $25.00 subject to handling approval.\nADDITIONAL: return to supplier pre-labelled $6.00; out-of-zone delivery $10.00; oversized/bulky freight quoted on application.\nBilling V1 generates downloadable invoice PDF only; Admin emails manually outside portal.",
  );
  setCell(serviceModel, "E28", "1 tyre = $18.50\n2 tyres = $24.00\n3 tyres = $33.00\n4+ tyres = $12.30 each");
  setCell(serviceModel, "E29", "up to 5kg = $17.20\n5-10kg = $21.00\n10kg+ = from $25.00 subject to handling approval");
}

function patchSopOperatingSheets(workbook, sourceName) {
  if (sourceName === "EXC-SOP-05-OverdueNoticeProcess-v1.2.xlsx") {
    setCell(workbook.worksheets.getItem("Steps"), "G5", "V1 runtime does not send invoice/overdue emails. Admin downloads the invoice PDF and emails manually outside the portal. Any bounce or failed contact follow-up is an out-of-system Admin process and does not create a runtime retry workflow.");
    setCell(workbook.worksheets.getItem("Runtime"), "F5", "No runtime email retry. Admin handles manual email/contact correction outside the portal.");
    setCell(workbook.worksheets.getItem("Runtime"), "I5", "If a manual email bounces, Admin corrects the Billing Contact outside the portal and records any required account note manually. The portal remains responsible only for invoice PDF generation and local billing evidence.");
  }

  if (sourceName === "SOP-BIL-04-CreateSendInvoice-v1.2.xlsx") {
    setCell(workbook.worksheets.getItem("Steps"), "C7", "APP-ADM-004 generates a downloadable invoice PDF for the selected client/month. Admin downloads the PDF and emails it manually outside the portal. The runtime does not send invoice email, monitor bounce handling, or integrate with Xero/OpenClaw/accounting APIs.");
    setCell(workbook.worksheets.getItem("Steps"), "G7", "If a manual invoice email bounces, Admin corrects the Billing Contact outside the portal and re-sends manually. This is an out-of-system human process, not a runtime retry workflow.");
    setCell(workbook.worksheets.getItem("Skills"), "E5", "How to download invoice PDF. How to manually email client. How to update Billing Contact if a manual email bounces. Payment follow-up remains outside runtime.");
    setCell(workbook.worksheets.getItem("Runtime"), "F7", "No runtime email retry. Portal creates downloadable invoice PDF only.");
    setCell(workbook.worksheets.getItem("Runtime"), "I7", "Manual email bounce/contact correction is handled by Admin outside the portal. Runtime evidence remains invoice PDF generation/download and billing record status.");
    setCell(workbook.worksheets.getItem("SLA"), "H5", "No runtime SLA/email dispatch control. Admin manually emails invoice PDF outside the portal; payment terms are managed through the manual billing process.");
  }

  if (sourceName === "SOP-REQ-02-CutOffHandling-v1.1.xlsx") {
    setCell(workbook.worksheets.getItem("Summary"), "B30", "POL-MCL-002-001 - cut-off supports scheduling, but the previous evening-before run lockdown is rejected for V1. Driver Create Daily Run consolidates ready con notes and captures depot collection choices.");
    setCell(workbook.worksheets.getItem("Skills"), "E4", "What the 12:30pm Brisbane cut-off is. How scheduled/next-run status works. Why supplier/customer con-note timing is an upstream input. How Driver Create Daily Run handles ready con notes and depot exceptions.");
    setCell(workbook.worksheets.getItem("Runtime"), "F7", "No runtime email retry. Schedule/update notifications remain provider-dependent; V1 evidence focuses on scheduled run status and Admin-visible records.");
  }

  if (sourceName === "SOP-RUN-01-DriverMilkRunPlanning-v1.2.xlsx") {
    setCell(workbook.worksheets.getItem("Summary"), "A21", "This SOP defines the V1 driver-created daily run process. It covers how ready con notes are consolidated, how named driver and vehicle evidence is confirmed, how depot collection choices are captured, and what happens if the driver or vehicle is unavailable.");
    setCell(workbook.worksheets.getItem("Summary"), "A24", "  1.  Driver selects Create Daily Run to consolidate ready con notes. The previous evening-before/day-before lockdown is rejected for V1.");
    setCell(workbook.worksheets.getItem("Summary"), "B35", "POL-MCL-002-001 - V1 requires a named driver and vehicle before departure. Driver Create Daily Run replaces the previous evening-before lockdown and captures planned, bring-forward, and no-con-note depot pickups.");
  }

  if (sourceName.startsWith("SOP-REL-01-ReleaseDeploymentControl-")) {
    setCell(workbook.worksheets.getItem("Summary"), "A21", "This SOP controls the V1 release/deployment process for the GitHub + Supabase + Vercel production stack. PIPE-DEV-001 requires automated checks, production environment separation, human go/no-go approval, rollback evidence, and release notes before deployment.");
    setCell(workbook.worksheets.getItem("Platform"), "D4", "PIPE-DEV-001 applies to GitHub Actions, Supabase migrations/configuration, and Vercel production deployment. Production release evidence must include the source version, migration/version evidence where applicable, smoke-test result, human approval, and rollback path.");
  }
}

async function buildBoas() {
  await fs.mkdir(BOAS_OUT, { recursive: true });
  const blob = await FileBlob.load("MotoCo_Unified_BOAS_Hierarchy_v1.9.xlsx");
  const workbook = await SpreadsheetFile.importXlsx(blob);
  patchBoasOperatingSheets(workbook);
  const control = workbook.worksheets.add("V2 Baseline Control");
  const rows = [
    ["Moto and Co Couriers BOAS v2.0 Baseline Control", ""],
    ["Document ID", "BOAS-v2.0"],
    ["Status", "Draft for approval"],
    ["Created", "2026-07-02"],
    ["Previous source", "MotoCo_Unified_BOAS_Hierarchy_v1.9.xlsx"],
    ["Approval reference", "TBD"],
    ["Owner", "TBD"],
    ["", ""],
    ["Confirmed V1 changes", ""],
    ["Production portal", "https://motoandcocouriers.vercel.app"],
    ["Supabase project ref", "fhrqfrhqopicekaiibyj"],
    ["Offline mode", "Same-device local outbox only; live record updates after sync succeeds."],
    ["Billing", "Runtime creates downloadable EOM invoice PDF only; Admin email, payment follow-up, bank reconciliation, and accounting integrations are outside V1 runtime."],
    ["Supplier network", "Active: Link International, A1 Accessories, McLeods, Gas Imports, Whites Powersports. Ficeda removed."],
    ["Driver pickup workflow", "Freight item count occurs at pickup, not delivery. Receiver phone is not required for POD."],
    ["Driver daily run", "Driver creates daily run from ready con notes and can collect planned, bring-forward, and no-con-note depot packages once ERD approval and schema/runtime build are complete."],
    ["Scope boundaries", "SLA monitoring and HCM requirements are outside logistics portal scope."],
    ["Privacy Owner", "Role-based GM Moto & Co Logistics."],
    ["", ""],
    ["Open approvals", "Policy Owner/legal owner, live RLS/Auth/Storage evidence, Supabase region/data residency evidence, ERD format/examples."],
  ];
  applyBasicFormat(control, rows);

  const policy = workbook.worksheets.add("V2 Policy Impact");
  const policyRows = [
    ["Policy", "Required v2.0 update", "Open approval"],
    ["Policy #3/#4", "Privacy and collection notices include portal data, receiver POD, and offline local cache where approved.", "Privacy Owner role is GM Moto & Co Logistics"],
    ["Policy #5", "Retention/destruction includes local device cache/outbox and storage-pending proof handling.", "Offline cache UAT after ERD; legal hold remains open"],
    ["Policy #7/#21", "Information security and acceptable use include production access logging, RLS/Auth proof, and offline cache handling.", "Digiverse evidence and access-log format TBD"],
    ["Policy #10/#10a/#24", "Runtime creates downloadable EOM invoice PDF only; email/payment/bank reconciliation are off-system.", "Otimi reporting remains outside runtime if required"],
    ["Policy #11/#18", "Customer terms and disputes include POD download, scheduled status, manual invoice PDF, and remedy path.", "Customer-facing legal copy and credit note path TBD"],
    ["Policy #12/#13/#19/#25/#26", "Held outside logistics portal or conditional future activation.", "HCM/future activation only"],
  ];
  policy.getRange(`A1:C${policyRows.length}`).values = policyRows;
  policy.getRange("A1:C1").format = { fill: brand.red, font: { bold: true, color: brand.white } };
  policy.getRange(`A1:C${policyRows.length}`).format.borders = { preset: "all", style: "thin", color: "#D9D9D9" };
  policy.getRange("A:C").format.wrapText = true;
  policy.getRange("A:A").format.columnWidth = 24;
  policy.getRange("B:B").format.columnWidth = 70;
  policy.getRange("C:C").format.columnWidth = 45;

  const data = workbook.worksheets.add("V2 Data Objects");
  const dataRows = [
    ["Object", "Type", "V2 baseline note"],
    ["local_device_outbox", "Operational record", "Driver same-device offline retry queue; not live until sync succeeds."],
    ["offline_sync_attempt", "Audit/control record", "Records retry attempts, last issue, success/failure evidence."],
    ["storage_pending_proof", "POD evidence state", "Proof metadata synced while signature object upload is pending Admin review."],
    ["manual_invoice_pdf", "Billing artifact", "Portal-generated invoice PDF downloaded by Admin."],
    ["invoice_pdf_download_record", "Billing artifact", "Portal records/generated evidence that the Admin downloaded the invoice PDF; external email is not runtime data."],
    ["driver_daily_run", "Run evidence", "Driver-created daily run consolidates ready con notes."],
    ["bring_forward_pickup", "Run evidence", "Ready next-day package brought forward at depot under daily-run workflow."],
    ["no_con_note_pickup", "Run exception evidence", "Ready package collected where customer missed portal entry or con note is unavailable."],
    ["pickup_item_count", "Pricing evidence", "Driver counts items at pickup; billing derives from pickup count."],
    ["baseline_document_version", "Governance record", "Version-control record for BOAS/SOP/policy/journey baselines."],
  ];
  data.getRange(`A1:C${dataRows.length}`).values = dataRows;
  data.getRange("A1:C1").format = { fill: brand.red, font: { bold: true, color: brand.white } };
  data.getRange(`A1:C${dataRows.length}`).format.borders = { preset: "all", style: "thin", color: "#D9D9D9" };
  data.getRange("A:C").format.wrapText = true;
  data.getRange("A:A").format.columnWidth = 28;
  data.getRange("B:B").format.columnWidth = 24;
  data.getRange("C:C").format.columnWidth = 80;

  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(path.join(BOAS_OUT, "MotoCo_Unified_BOAS_Hierarchy_v2.0.xlsx"));
}

async function buildSops() {
  await fs.mkdir(SOP_OUT, { recursive: true });
  const entries = await fs.readdir(path.join(ROOT, "SOP"), { withFileTypes: true });
  const xlsx = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".xlsx"))
    .map((entry) => entry.name);

  const manifestRows = [["SOP ID", "File", "Version", "Status", "Previous Source", "Baseline Notes"]];

  for (const name of xlsx) {
    const source = path.join("SOP", name);
    const impact = sopImpacts[name];
    const version = impact?.version ?? bumpMinorFromName(name);
    const notes = impact?.notes ?? [
      "Reviewed against baseline v2.0.",
      "No specific V2 operating change identified for this SOP.",
      "Retained in versioned pack for full baseline consistency.",
    ];
    const blob = await FileBlob.load(source);
    const workbook = await SpreadsheetFile.importXlsx(blob);
    patchSopOperatingSheets(workbook, name);
    let summary = null;
    try {
      summary = workbook.worksheets.getItem("Summary");
    } catch {
      summary = null;
    }
    if (summary) {
      try {
        summary.getRange("B6").values = [[version]];
        summary.getRange("B8").values = [["Draft for approval - baseline v2.0"]];
      } catch {
        // Some workbooks may not follow the standard summary layout.
      }
    }
    const sheet = workbook.worksheets.add("Baseline Update");
    const rows = rowsForBaselineSheet(name, version, notes);
    applyBasicFormat(sheet, rows);
    const outName = outputName(name, version);
    const output = await SpreadsheetFile.exportXlsx(workbook);
    await output.save(path.join(SOP_OUT, outName));
    const sopId = name.split("-v")[0];
    manifestRows.push([sopId, outName, version, "Draft for approval", `SOP/${name}`, notes.join(" | ")]);
  }

  const csv = manifestRows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  await fs.writeFile(path.join(SOP_OUT, "SOP_v2_baseline_manifest.csv"), csv, "utf8");
}

await buildBoas();
await buildSops();
console.log("Full baseline v2.0 workbooks created.");
