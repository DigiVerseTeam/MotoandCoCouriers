export type AccountabilityStatus =
  | "built"
  | "part_built"
  | "needs_sop"
  | "not_started"
  | "open_gap"
  | "controlled";

export type AccountabilityKind = "system" | "human" | "hybrid";

export type SoftwareActor = {
  id: string;
  name: string;
  surface: "Customer" | "Admin" | "Driver" | "Billing" | "Privacy" | "Fleet" | "Monitoring";
  accountableFor: string;
  mustNotDo: string;
  source: string;
  status: AccountabilityStatus;
};

export type ProcessAccountability = {
  moduleId: string;
  processId: string;
  process: string;
  accountableActorId: string;
  humanGate: string;
  kind: AccountabilityKind;
  trigger: string;
  input: string;
  output: string;
  dataObject: string;
  control: string;
  status: AccountabilityStatus;
  source: string;
};

export type RoleAccessRule = {
  roleId: string;
  role: string;
  canDo: string;
  cannotDo: string;
  accessNotes: string;
  source: string;
};

export type ProtectedDataObject = {
  name: string;
  keyFields: string;
  primaryModule: string;
  riskLevel: "Medium" | "High" | "Critical";
  accountableActorId: string;
  whyItMatters: string;
  source: string;
};

export const softwareActors: SoftwareActor[] = [
  {
    id: "APP-ADM-001",
    name: "Identity, account and order intake gate",
    surface: "Customer",
    accountableFor: "Supabase Auth/RLS, registration, role gate, pickup request validation, 12:30pm cut-off, work item creation, and suspended-account insert blocks.",
    mustNotDo: "Must not silently accept incomplete requests, bypass courier eligibility, or expose one customer's records to another customer.",
    source: "BOAS v1.7 Sheets 02, 03, 06; UJ-CRM-001A; SOP-IAM-01/02; SOP-REQ-01/02",
    status: "part_built"
  },
  {
    id: "APP-ADM-002",
    name: "Run compiler and dispatch assignment",
    surface: "Admin",
    accountableFor: "Compiles milk runs, groups by supplier and delivery location, assigns named driver and vehicle, and prepares the driver run brief.",
    mustNotDo: "Must not allow a run to depart without named driver and vehicle assignment.",
    source: "BOAS v1.7 Sheets 01, 02; Policy #22; SOP-RUN-01",
    status: "part_built"
  },
  {
    id: "APP-DRV-001",
    name: "Driver run brief workspace",
    surface: "Driver",
    accountableFor: "Shows only assigned run data to the driver: supplier sequence, delivery stops, vehicle/run context, and current stop state.",
    mustNotDo: "Must not expose unassigned customer PII or admin/billing/master-data screens.",
    source: "BOAS v1.7 Sheets 02, 05; UJ-DRV-001 S2",
    status: "part_built"
  },
  {
    id: "APP-DRV-002",
    name: "Pickup outcome and pricing enforcer",
    surface: "Driver",
    accountableFor: "Enforces per-customer pickup outcomes, blocks billable item rows on No Pickup, timestamps server-side, and calculates prices from price_rules.",
    mustNotDo: "Must not confirm pickup at supplier level, let drivers override price, or create charges for No Pickup.",
    source: "BOAS v1.7 Sheets 02, 03, 07; SOP-PUP-02/03; SOP-ITM-02/03; Policy #9",
    status: "part_built"
  },
  {
    id: "APP-DRV-003",
    name: "Delivery proof and delivery outcome enforcer",
    surface: "Driver",
    accountableFor: "Groups delivery stops, records failed/delivered outcomes, requires receiver name and signature, stores proof in private storage, and writes Delivered.",
    mustNotDo: "Must not allow Delivered without proof or allow proof edits after completion.",
    source: "BOAS v1.7 Sheets 02, 03, 07; UJ-DRV-001 S4; SOP-DEL-04/05; POL-MCL-004-001",
    status: "part_built"
  },
  {
    id: "APP-ADM-003",
    name: "Billing batch compiler",
    surface: "Billing",
    accountableFor: "Compiles billable delivered jobs into account/period invoice batches and flags unmatched accounts.",
    mustNotDo: "Must not double bill, include No Pickup rows, or compile unmatched customer records without Admin review.",
    source: "BOAS v1.7 Sheets 02, 03, 06; SOP-BIL-01; SOP-EXC-03",
    status: "not_started"
  },
  {
    id: "APP-ADM-004",
    name: "Invoice generator and dispatcher",
    surface: "Billing",
    accountableFor: "Generates invoice records, dispatches invoices to ACT-CRM-001b, records send/bounce state, and writes invoice_id back to job records.",
    mustNotDo: "Must not send invoice to an unconfirmed billing contact or hide email bounce failures.",
    source: "BOAS v1.7 Sheets 02, 06, 07; UJ-CRM-001B; SOP-BIL-04; Policy #10",
    status: "not_started"
  },
  {
    id: "APP-ADM-005",
    name: "Exception and overdue monitor",
    surface: "Monitoring",
    accountableFor: "Detects/classifies exceptions, sends daily structured Admin alert, monitors payment status, sends day 8 overdue notice, and queues Admin action.",
    mustNotDo: "Must not make human commercial decisions such as suspension; Admin remains the human gate.",
    source: "BOAS v1.7 Sheets 02, 03, 07; EXC-SOP-05/06; Policy #10a",
    status: "needs_sop"
  },
  {
    id: "APP-ADM-006",
    name: "Access and master-data monitor",
    surface: "Monitoring",
    accountableFor: "Monitors staff access changes, supplier/pricing master-data drift, unlogged price changes, and stale supplier records.",
    mustNotDo: "Must not approve pricing changes or grant access without the required human authority.",
    source: "BOAS v1.7 Sheets 03, 07; SOP-IAM-04; SOP-MDM-01/02",
    status: "part_built"
  },
  {
    id: "APP-PRV-001",
    name: "Privacy consent capture",
    surface: "Privacy",
    accountableFor: "Captures Collection Notice version, consent identity, timestamp, and collection-point proof.",
    mustNotDo: "Must not create an account without recording required consent evidence.",
    source: "BOAS v1.7 Sheets 06, 07; SOP-PRV-01; Policy #4",
    status: "part_built"
  },
  {
    id: "APP-PRV-004",
    name: "Append-only privacy audit log",
    surface: "Privacy",
    accountableFor: "Records all PII actions in a tamper-evident append-only audit log.",
    mustNotDo: "Must not allow audit edits/deletes or unaudited PII exports.",
    source: "Policy #21; Policy #7; BOAS v1.7 privacy controls",
    status: "open_gap"
  },
  {
    id: "APP-FLT-001",
    name: "Fleet compliance monitor",
    surface: "Fleet",
    accountableFor: "Monitors registration, insurance, service intervals, pre-trip checks, defects, and vehicle assignment.",
    mustNotDo: "Must not permit vehicle operation without current registration/insurance data.",
    source: "BOAS v1.7 Sheets 02, 07; Policy #1; Policy #2",
    status: "not_started"
  }
];

export const processAccountabilities: ProcessAccountability[] = [
  {
    moduleId: "MCO-COR-01",
    processId: "IAM-01",
    process: "Register customer access",
    accountableActorId: "APP-ADM-001",
    humanGate: "ACT-CRM-001a/b provide account/contact details; Admin reviews eligibility.",
    kind: "hybrid",
    trigger: "Customer onboarding submitted",
    input: "Business details, operational contact, billing contact, email, delivery address",
    output: "Customer access profile created",
    dataObject: "Access User; Customer Account",
    control: "Supabase Auth/RLS and courier eligibility flag",
    status: "part_built",
    source: "BOAS Sheet 03 IAM-01; SOP-IAM-01; SOP-CUS-01"
  },
  {
    moduleId: "MCO-COR-01",
    processId: "IAM-02/03",
    process: "Request and verify login code",
    accountableActorId: "APP-ADM-001",
    humanGate: "Client, Driver, or Admin enters email/code.",
    kind: "system",
    trigger: "User wants to log in",
    input: "Email, requested role, OTP code",
    output: "Login code sent or access denied; active session created",
    dataObject: "Access User",
    control: "No static passwords; role-scoped session; generic failure response",
    status: "not_started",
    source: "BOAS Sheet 03 IAM-02/IAM-03; UJ-ADM-001; UJ-DRV-001; SOP-IAM-02"
  },
  {
    moduleId: "MCO-COR-02",
    processId: "CUS-01/03",
    process: "Create customer account and confirm billing contact",
    accountableActorId: "APP-ADM-001",
    humanGate: "ACT-CRM-001a/b self-service; Admin confirms billing readiness.",
    kind: "hybrid",
    trigger: "New customer wants courier service",
    input: "Business name, billing email, delivery address, phone/contact fields",
    output: "Billing-ready customer record",
    dataObject: "Customer Account",
    control: "Named Operational and Billing contacts before activation/invoicing",
    status: "part_built",
    source: "BOAS Sheet 03 CUS-01/CUS-03; UJ-CRM-001A/B"
  },
  {
    moduleId: "MCO-COR-03",
    processId: "REQ-01/02/03",
    process: "Pickup request intake and cut-off",
    accountableActorId: "APP-ADM-001",
    humanGate: "ACT-CRM-001a submits request.",
    kind: "hybrid",
    trigger: "Customer submits pickup request",
    input: "Account, supplier, requested date, notes, submission time",
    output: "Pickup request/work item with actual run date",
    dataObject: "Pickup Request / Work Item",
    control: "12:30pm Brisbane cut-off; linked supplier; active account only",
    status: "part_built",
    source: "BOAS Sheet 03 REQ-01/02/03; SOP-REQ-01/02"
  },
  {
    moduleId: "MCO-COR-04",
    processId: "RUN-01",
    process: "Milk run planning",
    accountableActorId: "APP-ADM-002",
    humanGate: "Admin maintains driver availability and vehicle assignment source data.",
    kind: "system",
    trigger: "Scheduled run date arrives / night-before run compilation",
    input: "Accepted work items, supplier table, driver availability, vehicle assignment",
    output: "Driver milk run plan",
    dataObject: "Milk Run",
    control: "Run must have named driver and vehicle before departure",
    status: "part_built",
    source: "BOAS Sheet 02 MCO-COR-04; Policy #22; SOP-RUN-01"
  },
  {
    moduleId: "MCO-COR-05",
    processId: "PUP-02/03/RUN-04",
    process: "Supplier pickup execution",
    accountableActorId: "APP-DRV-002",
    humanGate: "ACT-INT-001 physically inspects goods and selects outcome.",
    kind: "hybrid",
    trigger: "Driver arrives at supplier",
    input: "Supplier stop, customer work item, goods readiness, item notes",
    output: "Picked Up, No Pickup, Brought Forward, or Abandoned outcome",
    dataObject: "Pickup Outcome",
    control: "Per-customer confirmation; No Pickup blocks billable item rows",
    status: "part_built",
    source: "BOAS Sheets 02/03/07; UJ-DRV-001 S3; SOP-PUP-02/03; SOP-RUN-04"
  },
  {
    moduleId: "MCO-COR-06",
    processId: "ITM-02/03",
    process: "Pickup item capture and pricing basis",
    accountableActorId: "APP-DRV-002",
    humanGate: "ACT-INT-001 selects tyre count or weight band from observed goods.",
    kind: "hybrid",
    trigger: "Driver confirms picked-up items",
    input: "Item type, quantity, tyre count, weight band",
    output: "Item rows and calculated pickup total",
    dataObject: "Pickup Item Row; Price Rules Table",
    control: "Server-side price calculation; driver cannot override price",
    status: "part_built",
    source: "BOAS Sheet 03; SOP-ITM-02/03; Policy #9"
  },
  {
    moduleId: "MCO-COR-07",
    processId: "DEL-04/05",
    process: "Delivery execution and sign-off",
    accountableActorId: "APP-DRV-003",
    humanGate: "Driver delivers; Receiver provides name and signature.",
    kind: "hybrid",
    trigger: "Driver delivers goods",
    input: "Delivery stop, expected items, receiver name, signature image",
    output: "Delivery proof and Delivered status",
    dataObject: "Delivery Proof",
    control: "Receiver name/signature required before Delivered; private storage",
    status: "part_built",
    source: "BOAS Sheets 02/03/07; UJ-DRV-001 S4; SOP-DEL-04/05"
  },
  {
    moduleId: "MCO-COR-08",
    processId: "BIL-01/04",
    process: "Month-end account invoicing",
    accountableActorId: "APP-ADM-003",
    humanGate: "Admin approves billing group before invoice creation.",
    kind: "hybrid",
    trigger: "End of month / Admin review",
    input: "Delivered jobs, proof records, account, price rules, billing email",
    output: "Customer account invoice and send record",
    dataObject: "Invoice Batch; Invoice Record",
    control: "Admin approval gate; confident account match; no double billing",
    status: "not_started",
    source: "BOAS Sheet 02 MCO-COR-08; SOP-BIL-01/04; UJ-ADM-001 S3"
  },
  {
    moduleId: "MCO-COR-08",
    processId: "BIL-04",
    process: "Invoice generation and dispatch",
    accountableActorId: "APP-ADM-004",
    humanGate: "ACT-CRM-001b receives, reviews, pays, or disputes.",
    kind: "system",
    trigger: "Admin approves billing group",
    input: "Invoice batch, billing contact, EFT details, invoice template",
    output: "Invoice email and invoice_id written to jobs",
    dataObject: "Invoice Record",
    control: "Bounce detection and billing contact validation",
    status: "not_started",
    source: "BOAS Sheet 06 Invoice Record; UJ-CRM-001B S1; SOP-BIL-04"
  },
  {
    moduleId: "MCO-COR-09",
    processId: "EXC-05/06",
    process: "Exception, overdue, suspension and reinstatement",
    accountableActorId: "APP-ADM-005",
    humanGate: "Admin resolves exceptions, suspends accounts, and reinstates after payment.",
    kind: "hybrid",
    trigger: "Exception occurs or invoice reaches day 8 unpaid",
    input: "Exception type, invoice payment status, related work item/account",
    output: "Resolved exception, overdue notice, suspension or reinstatement state",
    dataObject: "Exception Record; Account Suspension Record",
    control: "Daily structured alert; Admin human decision gate for suspension",
    status: "needs_sop",
    source: "BOAS Sheets 02/03/06/07; Policy #10a; Policy #23; EXC-SOP-05/06"
  },
  {
    moduleId: "MCO-COR-10/11",
    processId: "MDM/IAM monitoring",
    process: "Access and master-data monitoring",
    accountableActorId: "APP-ADM-006",
    humanGate: "Admin/Owner approve access, supplier, and pricing changes.",
    kind: "hybrid",
    trigger: "Access change, supplier change, price change, stale supplier, or unlogged drift",
    input: "Change log, access user, supplier table, price_rules",
    output: "Alert, change record, approved or rejected change",
    dataObject: "Supplier Table; Price Rules Table; Access User",
    control: "Change log; dual approval for pricing; annual access review",
    status: "part_built",
    source: "BOAS Sheets 03/06/07; SOP-IAM-04; SOP-MDM-01/02"
  }
];

export const roleAccessRules: RoleAccessRule[] = [
  {
    roleId: "ACT-CRM-001a",
    role: "Client Operational Contact",
    canDo: "Submit pickup requests, select approved supplier, confirm drop address, track delivery, raise delivery dispute.",
    cannotDo: "Cannot access other customer accounts, driver run, admin billing, master data, pricing, or staff access.",
    accessNotes: "Email/code login. Courier account eligibility flag required. Linked to one customer account.",
    source: "BOAS Sheet 05 Roles & Access"
  },
  {
    roleId: "ACT-CRM-001b",
    role: "Client Billing Contact",
    canDo: "Receive invoices, approve payment, raise billing disputes, authorise account/payment contact details.",
    cannotDo: "Cannot access delivery portal, driver run, master data, pricing approval, or staff access unless combined with Operational Contact.",
    accessNotes: "Email-first journey. Portal login not required unless combined with Operational Contact.",
    source: "BOAS Sheet 05 Roles & Access; UJ-CRM-001B"
  },
  {
    roleId: "ACT-INT-001",
    role: "Driver",
    canDo: "View assigned daily milk run, confirm pickups per customer, record item types/quantities, capture delivery proof, record failed delivery.",
    cannotDo: "Cannot create invoices, change pricing, manage access, approve releases, view unassigned customer PII, or mark Delivered without name/signature.",
    accessNotes: "Role-controlled and revocable. Must be assigned to a specific run/vehicle.",
    source: "BOAS Sheet 05 Roles & Access; UJ-DRV-001"
  },
  {
    roleId: "ACT-INT-002",
    role: "Admin",
    canDo: "Approve billing groups, manage supplier/customer/driver/vehicle master data, resolve exceptions, suspend/reinstate accounts, and create Client Ops, Client Billing, and Driver users.",
    cannotDo: "Cannot create or remove Admin or Super Admin users, self-approve pricing changes, edit code, environment variables, secrets, or deployment settings as routine business operation.",
    accessNotes: "Created by Super Admin through SOP-IAM-03. Production changes and support access must be audited.",
    source: "BOAS v1.8 Sheet 05 Roles & Access; UJ-ADM-001; SOP-IAM-03"
  },
  {
    roleId: "ACT-INT-003",
    role: "Super Admin",
    canDo: "Create/remove Admin users, perform second pricing approval gate, and do everything Admin can do.",
    cannotDo: "Cannot be created inside the app. Routine business data changes still need source-backed approval evidence.",
    accessNotes: "One person at launch, bootstrapped manually by Digiverse server-side before in-app Admin provisioning begins.",
    source: "BOAS v1.8 Sheet 05 Roles & Access; SOP-IAM-03"
  },
  {
    roleId: "ACT-INT-004",
    role: "Receiver",
    canDo: "Provide receiver name and sign delivery confirmation on driver device.",
    cannotDo: "No login. Cannot access app, authorise account/order changes, or view records.",
    accessNotes: "Name/signature are linked to delivery proof, not a standing user account.",
    source: "BOAS v1.8 Sheet 05 Roles & Access"
  },
  {
    roleId: "ACT-PRM-001",
    role: "Digiverse",
    canDo: "Build, maintain, deploy, configure environments, and support the platform under release-control policy.",
    cannotDo: "Cannot make business decisions, approve billing, change pricing, or manage customer data outside authorised support.",
    accessNotes: "Technology partner. Production access must be logged and policy-bound.",
    source: "BOAS Sheet 05 Roles & Access; SOP-REL-01"
  }
];

export const protectedDataObjects: ProtectedDataObject[] = [
  {
    name: "Access User",
    keyFields: "email, role, status, can-login, linked account/contact",
    primaryModule: "MCO-COR-01",
    riskLevel: "Medium",
    accountableActorId: "APP-ADM-001",
    whyItMatters: "Controls who can enter which workspace.",
    source: "BOAS Sheet 06"
  },
  {
    name: "Customer Account",
    keyFields: "business name, delivery address, billing email, phone, courier eligible flag",
    primaryModule: "MCO-COR-02",
    riskLevel: "High",
    accountableActorId: "APP-ADM-001",
    whyItMatters: "Billing and delivery owner.",
    source: "BOAS Sheet 06"
  },
  {
    name: "Pickup Request / Work Item",
    keyFields: "work item ID, account, supplier, requested date, notes, status",
    primaryModule: "MCO-COR-03",
    riskLevel: "Critical",
    accountableActorId: "APP-ADM-001",
    whyItMatters: "Operational shell for a courier job.",
    source: "BOAS Sheet 06"
  },
  {
    name: "Pickup Outcome",
    keyFields: "picked up, no pickup, brought forward, abandoned, actual pickup date/time, notes",
    primaryModule: "MCO-COR-05",
    riskLevel: "Critical",
    accountableActorId: "APP-DRV-002",
    whyItMatters: "Records what happened at supplier and controls billing eligibility.",
    source: "BOAS Sheet 06; BOAS Risk R-002/R-003"
  },
  {
    name: "Delivery Proof",
    keyFields: "receiver name, signature, driver, delivered timestamp, item summary",
    primaryModule: "MCO-COR-07",
    riskLevel: "Critical",
    accountableActorId: "APP-DRV-003",
    whyItMatters: "Evidence for delivered status and billing disputes.",
    source: "BOAS Sheet 06; SOP-DEL-04"
  },
  {
    name: "Invoice Record",
    keyFields: "invoice_id, account_id, billing period, line items, total, GST, due date, payment status, billing email",
    primaryModule: "MCO-COR-08",
    riskLevel: "Critical",
    accountableActorId: "APP-ADM-004",
    whyItMatters: "Financial record sent to ACT-CRM-001b and monitored for overdue action.",
    source: "BOAS Sheet 06; UJ-CRM-001B"
  },
  {
    name: "Account Suspension Record",
    keyFields: "account_id, suspension_flag, suspended_at, reason, suspended_by, reinstated_at, reinstated_by",
    primaryModule: "MCO-COR-09",
    riskLevel: "High",
    accountableActorId: "APP-ADM-005",
    whyItMatters: "Controls whether ACT-CRM-001a can submit orders.",
    source: "BOAS Sheet 06; Policy #23"
  },
  {
    name: "Supplier Table",
    keyFields: "supplier_id, name, dock address, dock contact role, pickup window, packaging notes, active flag, last reviewed",
    primaryModule: "MCO-COR-11",
    riskLevel: "Critical",
    accountableActorId: "APP-ADM-006",
    whyItMatters: "Admin-managed supplier source for client options and run compilation.",
    source: "BOAS Sheet 06; SOP-MDM-01"
  },
  {
    name: "Price Rules Table",
    keyFields: "price_rule_id, item_type, rate, band/quantity, effective date, approved_by_admin, approved_by_owner",
    primaryModule: "MCO-COR-11",
    riskLevel: "Critical",
    accountableActorId: "APP-ADM-006",
    whyItMatters: "Server-side source of truth for pricing; not driver-entered and not hardcoded.",
    source: "BOAS Sheet 06; SOP-MDM-02; Policy #9"
  }
];

export function statusLabel(status: AccountabilityStatus) {
  if (status === "built") return "Built";
  if (status === "part_built") return "Part built";
  if (status === "needs_sop") return "Needs SOP";
  if (status === "not_started") return "Not started";
  if (status === "open_gap") return "Open gap";
  return "Controlled";
}

export function statusTone(status: AccountabilityStatus): "neutral" | "red" | "dark" {
  if (status === "built" || status === "controlled") return "dark";
  if (status === "needs_sop" || status === "not_started" || status === "open_gap") return "red";
  return "neutral";
}
