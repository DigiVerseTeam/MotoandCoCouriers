export type JourneyStatus =
  | "working"
  | "partial"
  | "schema_ready"
  | "documented_gap"
  | "external"
  | "deferred"
  | "blocked";

export type JourneyStage = {
  id: string;
  order: number;
  title: string;
  role: "Client Ops" | "Client Billing" | "Admin" | "System" | "Driver" | "Receiver";
  moment: string;
  source: string;
  data: string;
  outcome: string;
  next: string;
  href: string;
  status: JourneyStatus;
};

export type SourceJourneyStage = {
  id: string;
  title: string;
  summary: string;
  coverage: JourneyStatus;
  localEvidence: string;
  missing: string;
  steps: string[];
};

export type SourceJourney = {
  id: string;
  title: string;
  actor: string;
  sourceFile: string;
  goal: string;
  success: string;
  localFit: string;
  stages: SourceJourneyStage[];
};

export const releaseOneJourney: JourneyStage[] = [
  {
    id: "client-registration",
    order: 1,
    title: "Register and consent",
    role: "Client Ops",
    moment: "Operational Contact enters business details, Operational and Billing contacts, delivery address, supplier selections, and Collection Notice acknowledgement.",
    source: "UJ-CRM-001A S1, SOP-IAM-01, SOP-CUS-01, Policy #4",
    data: "Actor, contacts, supplier links, consent record",
    outcome: "Account exists as Pending and cannot submit orders yet.",
    next: "Admin reviews eligibility and activates or rejects.",
    href: "/booking",
    status: "partial"
  },
  {
    id: "admin-activation",
    order: 2,
    title: "Review and activate",
    role: "Admin",
    moment: "Admin confirms B2B fit, SEQ physical delivery address, named contacts, and at least one approved supplier.",
    source: "UJ-ADM-001 S2, SOP-IAM-01, SOP-CUS-01, Policy #23",
    data: "Actor status, relationship owner, account notes",
    outcome: "Active accounts can submit pickup requests. Suspended accounts can log in but cannot submit.",
    next: "Client sees the local activation update and enters the first login / supplier setup moment.",
    href: "/admin",
    status: "working"
  },
  {
    id: "client-first-login",
    order: 3,
    title: "First login and supplier setup",
    role: "Client Ops",
    moment: "Client receives activation update, logs in with OTP, and confirms supplier preferences before using the dashboard.",
    source: "UJ-CRM-001A S1.3, SOP-IAM-02",
    data: "Profile session, account-supplier links, activation event",
    outcome: "Client lands on a dashboard with linked suppliers ready for requests.",
    next: "Client submits a pickup request.",
    href: "/booking",
    status: "documented_gap"
  },
  {
    id: "pickup-request",
    order: 4,
    title: "Submit pickup request",
    role: "Client Ops",
    moment: "Operational Contact selects a linked supplier, requested run date, and notes. The journey target is under 2 minutes.",
    source: "UJ-CRM-001A S2, SOP-REQ-01",
    data: "Pickup request / work item",
    outcome: "Request is created with received date, requested/run date, and scheduled status.",
    next: "Driver-created daily run consolidates ready con notes and depot-ready packages.",
    href: "/booking",
    status: "partial"
  },
  {
    id: "daily-run-create",
    order: 5,
    title: "Create daily run",
    role: "Driver",
    moment: "Driver creates the daily run from ready con notes. Admin can still review assignment, vehicle evidence, and exceptions.",
    source: "UJ-DRV-001 S2, SOP-REQ-02, Policy #22",
    data: "Run date, driver, vehicle, ready con notes, depot-ready pickup evidence",
    outcome: "Ready work appears in the driver run; missing account or depot-created pickups alert Admin for reconciliation.",
    next: "Driver counts items at pickup.",
    href: "/admin",
    status: "partial"
  },
  {
    id: "admin-exception-queue",
    order: 6,
    title: "Work exception queue",
    role: "Admin",
    moment: "Admin dashboard surfaces what needs attention: failed notifications, schedule gaps, stale master data, disputes, and billing blockers.",
    source: "UJ-ADM-001 S2, APP-ADM-005, EXC-SOP-05",
    data: "Exception records, source, severity, status, detail",
    outcome: "Admin can acknowledge local exceptions; production still needs routing, ownership, and alert channel.",
    next: "Exception type determines the next screen.",
    href: "/admin",
    status: "partial"
  },
  {
    id: "driver-login-brief",
    order: 7,
    title: "Driver login and run brief",
    role: "Driver",
    moment: "Driver authenticates with OTP, reviews today's assigned run, and completes the pre-trip check before departure.",
    source: "UJ-DRV-001 S1-S2, SOP-RUN-01",
    data: "Driver profile, run assignment, vehicle, stop sequence, pre-trip result",
    outcome: "Driver knows the run sequence and whether the vehicle is ready.",
    next: "Driver starts supplier pickup stops.",
    href: "/driver",
    status: "partial"
  },
  {
    id: "supplier-pickup",
    order: 8,
    title: "Supplier pickup outcomes",
    role: "Driver",
    moment: "Driver works each supplier dock and records Picked Up, No Pickup, or Brought Forward for each customer.",
    source: "UJ-DRV-001 S3, SOP-PUP-02, SOP-PUP-03, SOP-RUN-04",
    data: "Pickup records, item type, tyre count or weight band, price rule",
    outcome: "Pickup outcomes become billing and delivery source records. Driver cannot manually override price.",
    next: "All pickup stops complete before delivery phase starts.",
    href: "/driver",
    status: "schema_ready"
  },
  {
    id: "delivery-stop",
    order: 9,
    title: "Delivery or failed delivery",
    role: "Driver",
    moment: "Driver selects each delivery stop, confirms address and items, then records Delivered or Failed Delivery.",
    source: "UJ-DRV-001 S4, SOP-DEL-01, SOP-DEL-05, Policy #8",
    data: "Delivery stop, status, failure reason, retained goods state",
    outcome: "Every delivery stop has an outcome before run close.",
    next: "Delivered stops require receiver name and signature.",
    href: "/driver",
    status: "partial"
  },
  {
    id: "delivery-proof",
    order: 10,
    title: "Capture POD",
    role: "Receiver",
    moment: "Driver hands over goods, captures Receiver name and signature, and only then sets Delivered.",
    source: "UJ-DRV-001 S4.3-S4.4, SOP-DEL-04, POL-MCL-004-001",
    data: "Delivery, delivery_proof, private signature asset",
    outcome: "Receiver name and signature are immutable proof records retained for 7 years.",
    next: "Client can track outcome; Admin can investigate disputes from proof.",
    href: "/driver",
    status: "working"
  },
  {
    id: "run-close",
    order: 11,
    title: "Close run",
    role: "Driver",
    moment: "All pickup and delivery stops are resolved. Driver confirms run complete and the system releases records for billing.",
    source: "UJ-DRV-001 S5, SOP-RUN-04",
    data: "Run status, completed stops, unresolved stop guard",
    outcome: "No open stop remains when the run is closed.",
    next: "Billing review uses the run's source records.",
    href: "/driver",
    status: "schema_ready"
  },
  {
    id: "tracking-dispute",
    order: 12,
    title: "Track and dispute",
    role: "Client Ops",
    moment: "Client checks order status or receives a notification, then raises a dispute from order detail if required.",
    source: "UJ-CRM-001A S3, Policy #18, APP-DRV-003",
    data: "Tracking status, proof record, dispute record, exception queue",
    outcome: "Disputes are acknowledged and investigated from proof records.",
    next: "Billing can use job-level itemisation and dispute evidence.",
    href: "/tracking",
    status: "partial"
  },
  {
    id: "billing-overdue",
    order: 13,
    title: "Invoice, overdue, suspend",
    role: "Client Billing",
    moment: "Billing Contact receives invoice email, pays by EFT, disputes if needed, and receives overdue or suspension notifications when required.",
    source: "UJ-CRM-001B S1-S2, UJ-ADM-001 S3-S4, Policy #10, Policy #10a, Policy #23",
    data: "Invoice, invoice lines, email dispatch, payment status, overdue notice, suspension event",
    outcome: "Admin approves billing groups, sends invoices, and can suspend/reinstate accounts under policy.",
    next: "Production billing path needs a final Zoho/manual decision.",
    href: "/portal",
    status: "documented_gap"
  }
];

export const roleJourneys = [
  {
    role: "Client Ops",
    title: "Client Operational Contact",
    steps: [
      "Register and acknowledge Collection Notice",
      "Wait for Admin activation",
      "First login and supplier setup",
      "Submit pickup request",
      "Track delivery and raise dispute if needed"
    ]
  },
  {
    role: "Client Billing",
    title: "Client Billing Contact",
    steps: [
      "Receive invoice email",
      "Review and pay by EFT",
      "Raise invoice dispute",
      "Receive overdue notice",
      "Receive suspension or reinstatement notice"
    ]
  },
  {
    role: "Admin",
    title: "Admin",
    steps: [
      "OTP login",
      "Work exception queue",
      "Approve billing",
      "Suspend or reinstate accounts",
      "Manage suppliers and pricing"
    ]
  },
  {
    role: "Driver",
    title: "Driver",
    steps: [
      "OTP login",
      "Review run brief and pre-trip",
      "Record pickup outcomes",
      "Record delivery outcomes",
      "Capture POD and close run"
    ]
  },
  {
    role: "Receiver",
    title: "Receiver",
    steps: ["Accept goods", "Give name", "Sign proof", "No login required"]
  }
];

export const sourceUserJourneys: SourceJourney[] = [
  {
    id: "UJ-CRM-001A",
    title: "Client Operational Contact Journey",
    actor: "Client Operational Contact (ACT-CRM-001a)",
    sourceFile: "customer journey.zip/UJ-CRM-001A-ClientOperationalContactJourney.json",
    goal: "Order parts delivery quickly and confidently, know when goods will arrive, and submit a request in under 2 minutes.",
    success: "Pickup request submitted, confirmation received, goods arrive on expected run day, and exceptions are communicated automatically.",
    localFit: "Core registration, physical-address/no-PO-box validation, Admin SEQ eligibility confirmation, local pending activation screen, account-level activation outbox record, hardened local code login, first-login supplier setup gate, pickup request, supplier setup request, local operational notice/outbox records, authenticated account-scoped tracking, and dispute logic exist. Production activation delivery, production Auth delivery, automated postcode/suburb boundary validation, public secure tracking tokens, final customer-visible tracking labels, and production notification delivery are not built.",
    stages: [
      {
        id: "S1",
        title: "Registration and Onboarding",
        summary: "Client registers, supplies contacts and address, acknowledges Collection Notice, then waits for Admin activation.",
        coverage: "partial",
        localEvidence: "Registration form creates a pending customer, blocks PO box delivery addresses, records two contacts, supplier links, consent record, pending activation workspace, hardened local code-login account path, Admin eligibility review, account-level local activation outbox record, and a first-login supplier setup gate before booking opens.",
        missing: "Production activation delivery, production Supabase/Auth delivery, and automated postcode/suburb boundary validation.",
        steps: ["Registration Screen", "Pending Activation Screen", "First Login - Supplier Setup"]
      },
      {
        id: "S2",
        title: "Submit Pickup Request",
        summary: "Client dashboard lets an active account submit a supplier pickup request in under 2 minutes.",
        coverage: "partial",
        localEvidence: "Pickup form uses active accounts, linked suppliers, requested date, notes, Brisbane cut-off logic, Tuesday/Thursday next-run adjustment, and local pickup/schedule update records with provider_not_configured.",
        missing: "Production confirmation delivery, suspended-account screen, and supplier unavailable state.",
        steps: ["Dashboard", "New Pickup Request Form", "Order Confirmation"]
      },
      {
        id: "S3",
        title: "Delivery Notifications and Tracking",
        summary: "Client receives status notifications, checks order status, and raises disputes from order detail.",
        coverage: "partial",
        localEvidence: "Authenticated Client Operational Contact tracking reads the account's own orders, pickup state, delivery state, POD proof, Policy #5 retain-until date, and linked Admin exception records; local update records cover pickup confirmation, out-for-delivery, delivery outcomes, and dispute acknowledgement; the tracking card can raise a delivery dispute into the Admin queue.",
        missing: "Production notification delivery, public secure tracking token model, customer-visible status taxonomy, and 14-day dispute guard.",
        steps: ["Order Status View", "Raise Dispute Screen"]
      }
    ]
  },
  {
    id: "UJ-CRM-001B",
    title: "Client Billing Contact Journey",
    actor: "Client Billing Contact (ACT-CRM-001b)",
    sourceFile: "customer journey.zip/UJ-CRM-001B-ClientBillingContactJourney.json",
    goal: "Receive the invoice, verify it, pay it, and resolve any problem quickly.",
    success: "Invoice reaches the right email, amount matches expected deliveries, and payment is straightforward.",
    localFit: "Billing contact data, Admin draft invoice batches, local invoice preview, automatic local invoice dispatch evidence from Admin invoice-correct confirmation, client invoice visibility, billing-query escalation, local billing-query acknowledgement, local billing-query status/investigation visibility, Admin overdue account suspension confirmation, structured payment-arrangement evidence, and reinstatement evidence capture exist locally. Actual invoice email dispatch, payment reconciliation, and automated billing-contact notices are not built.",
    stages: [
      {
        id: "S1",
        title: "Receive and Review Invoice",
        summary: "Billing Contact receives monthly invoice email, pays by EFT, or disputes invoice by portal/email.",
        coverage: "partial",
        localEvidence: "Billing contact name and email are stored; Admin can create local draft invoice batches with line items; Admin confirms the rendered invoice is correct and the portal records local dispatch evidence automatically with recipient, provider-not-configured status, and note; Admin, Client Operational Contact, and Client Billing Contact can open an inline invoice preview with proof references, totals, due date, local dispatch record, notices, and payment evidence; Client can raise a billing query into the Admin exception queue and see a local billing-query acknowledgement record with provider_not_configured plus current query status and Admin investigation outcome.",
        missing: "Production PDF/email invoice rendering, actual email dispatch, bounce detection, external accounting export, and EFT reconciliation.",
        steps: ["Invoice Email", "Payment (External - EFT)", "Invoice Dispute"]
      },
      {
        id: "S2",
        title: "Overdue Notice and Suspension",
        summary: "Day 8 overdue notice is sent, Admin may suspend, and reinstatement follows payment confirmation.",
        coverage: "partial",
        localEvidence: "Admin can mark invoices overdue, record a local Day 8 overdue notice before non-payment suspension, open overdue account detail from Billing or Clients, confirm suspension by typing the account name, record reason plus Operational and Billing contact notification evidence, block new orders for suspended clients, and reinstate with payment-clearance evidence or structured payment-arrangement evidence. Reinstatement notification is automatic on the Admin action.",
        missing: "Day 8 automation, actual billing/operational-contact email notices, external payment confirmation source, and production notification delivery.",
        steps: ["Overdue Notice Email", "Suspension Notification Email", "Reinstatement Notification Email"]
      }
    ]
  },
  {
    id: "UJ-ADM-001",
    title: "Admin Journey",
    actor: "Admin (ACT-INT-002)",
    sourceFile: "customer journey.zip/UJ-ADM-001-AdminJourney.json",
    goal: "Keep the business running without code changes: invoice correctness confirmation, master data, exceptions, account activation, and suspension.",
    success: "Invoices go to the right person, supplier and pricing changes are controlled, and every exception is resolved before the next run.",
    localFit: "Admin can log in with a hardened local testing code, activate accounts with an advisory eligibility checklist, manage suppliers with structured review/archive/reactivation reasons and monitoring, manage structured price rules with change reasons, Owner approval references, and pricing governance monitoring, review the local operational update outbox, acknowledge exceptions, review delivered billing groups, create draft invoice batches, confirm invoices are correct and automatically record local dispatch evidence, mark local invoice status, confirm account suspension after Day 8 notice evidence, and reinstate with payment or payment-arrangement evidence. Production Auth delivery, actual invoice dispatch, production notification delivery, automated overdue notices, and dual-control production execution remain gaps.",
    stages: [
      {
        id: "S1",
        title: "Login",
        summary: "Admin authenticates with the same OTP mechanism as Driver, with no static password.",
        coverage: "partial",
        localEvidence: "The active local shell has role email and generated one-use code entry for Admin with local expiry, verification-attempt limits, request throttling, and generic request behavior for unknown emails.",
        missing: "Supabase Auth delivery, admin-role validation from real identity claims, final production rate-limit/expiry policy values, email failure exception handling, used-code deletion in the real Auth store, and real identity session.",
        steps: ["Admin Login"]
      },
      {
        id: "S2",
        title: "Dashboard - Exception Queue",
        summary: "Exception queue is the primary Admin entry point.",
        coverage: "partial",
        localEvidence: "Admin page displays exception source, severity, detail, status, and acknowledge action.",
        missing: "Production external alert/notification channel, due dates, and resolved workflow.",
        steps: ["Admin Dashboard"]
      },
      {
        id: "S3",
        title: "Billing - Month-End Review and Confirmation",
        summary: "Admin reviews compiled billing groups and confirms invoices are correct.",
        coverage: "partial",
        localEvidence: "Admin billing review groups delivered unbilled jobs by client, creates local draft invoice batches, stores invoice lines, confirms the invoice is correct, records local dispatch evidence automatically, exposes those batches to the client billing view, and opens a local invoice preview from the invoice batch.",
        missing: "Production dispatch provider, PDF/email invoice output, bounce handling, unmatched account checks, and external accounting export.",
        steps: ["Billing Review Screen", "Invoice Preview"]
      },
      {
        id: "S4",
        title: "Exception Handling - Overdue and Suspension",
        summary: "Admin resolves overdue accounts, suspends when required, and reinstates after payment.",
        coverage: "partial",
        localEvidence: "Admin Billing and Clients views show overdue account context; non-payment suspension requires Day 8 overdue notice evidence, account-name confirmation, reason, and Operational/Billing contact notification evidence; suspended clients can log in but cannot submit new pickup requests; reinstatement requires account-name confirmation, payment/reinstatement evidence, and both-contact notification evidence.",
        missing: "Day 8 automation, actual outbound suspension/reinstatement notices, external payment confirmation source, and production RLS enforcement.",
        steps: ["Overdue Account Detail", "Account Suspension Confirmation", "Account Reinstatement"]
      },
      {
        id: "S5",
        title: "Master Data - Supplier Management",
        summary: "Admin adds, updates, or deactivates suppliers without developer involvement.",
        coverage: "working",
        localEvidence: "Admin page can add and edit suppliers with dock address, dock contact role, pickup window, packaging notes, status, last review, required change reason, structured review/archive/reactivation evidence modals, local master-data change rows, incomplete/stale supplier monitoring, exception queue routing, and open-work archive guard.",
        missing: "Production Supabase master_data_changes rows and live Supabase supplier monitoring execution.",
        steps: ["Supplier List Screen", "Supplier Edit / Add Screen"]
      },
      {
        id: "S6",
        title: "Master Data - Pricing Management",
        summary: "Admin proposes pricing changes and Owner approval is required before application.",
        coverage: "partial",
        localEvidence: "Admin page edits structured price_rules rows with service variant, item type, tyre count, weight band, rate mode, effective dates, required change reason, Owner approval reference, structured archive/reactivation evidence modals, local change-log ID, master-data audit rows, and a pricing governance monitor that can route incomplete or unlogged rows to Admin exceptions.",
        missing: "Production dual-control approval workflow, live Supabase monitoring execution, and production authority decision.",
        steps: ["Pricing Rules Screen", "Pricing Change Proposal", "Pricing Change - Apply"]
      }
    ]
  },
  {
    id: "UJ-DRV-001",
    title: "Driver Journey",
    actor: "Driver (ACT-INT-001)",
    sourceFile: "customer journey.zip/UJ-DRV-001-DriverJourney.json",
    goal: "Complete the milk run with every pickup and delivery outcome recorded before leaving each stop.",
    success: "Every pickup stop and delivery stop has an outcome, the run is closed, and billing records are available.",
    localFit: "Driver hardened local code login, compiled run brief with supplier/geography sequence, Admin-managed vehicle register checks, pre-trip, pre-trip/run-brief exception reporting, missing-stop exception reporting, supplier-grouped pickup, pickup item capture from price_rules, structured pickup/delivery outcome handling, SOP-RUN-04 future-pickup Bring Forward capture, delivery start gating, Policy #8 failed delivery/redelivery fee handling, run close, Admin run-close review, and mandatory POD capture are working locally. Production Auth delivery, full route optimization, night-before automation, live APP-FLT-001 expiry monitoring, production reason codes, close confirmation notification, and offline/upload handling are not yet complete.",
    stages: [
      {
        id: "S1",
        title: "Login",
        summary: "Driver authenticates by email one-time code, with rate limit and generic responses.",
        coverage: "partial",
        localEvidence: "The active local shell has role email and generated one-use code entry for Driver with local expiry, verification-attempt limits, request throttling, and generic request behavior for unknown emails.",
        missing: "Supabase Auth delivery, final production rate-limit/expiry policy values, inactive driver handling, email failure exception, used-code deletion in the real Auth store, and real identity session.",
        steps: ["Login Screen", "Code Entry Screen"]
      },
      {
        id: "S2",
        title: "Run Brief",
        summary: "Driver sees today's assigned run, stop sequence, and completes pre-trip check.",
        coverage: "partial",
        localEvidence: "Admin APP-ADM-002 local run compiler assigns named driver, named Admin-managed vehicle record, local registration/insurance/defect checks from the fleet register, supplier sequence, delivery zone, and stop sequence. Driver page shows compiled run brief, run date, vehicle, run ID, sequenced supplier pickup phase, pre-trip controls, pre-trip/run-brief issue reporting, missing-stop exception reporting, and delivery phase. Open pre-trip/run-brief issues block departure until Admin closes the exception.",
        missing: "Production route optimization, night-before automation, live APP-FLT-001 expiry monitoring/external integrations, and production reason-code/schema rules for driver run issues.",
        steps: ["Run Brief Screen", "Pre-Trip Check Screen", "Run Brief - Ready to Depart"]
      },
      {
        id: "S3",
        title: "Supplier Stop - Pickup",
        summary: "Driver records Picked Up, No Pickup, or Brought Forward for each customer at each supplier stop.",
        coverage: "partial",
        localEvidence: "Driver pickup phase groups pending work by supplier stop in compiled sequence, shows run/vehicle summary, captures observed item band or tyre quantity from active price_rules before Picked Up, calculates pickup total without driver price override, records source-backed No Pickup categories, records SOP-RUN-04 Bring Forward only for future pickups at suppliers already on the current route, and blocks delivery start while current pickup stops remain unresolved.",
        missing: "Production price anomaly workflow, production reason-code schema outside confirmed No Pickup/SOP-RUN-04/Policy #8 behavior, route optimization, offline/upload handling, and production notification delivery for pickup outcome updates.",
        steps: ["Supplier Stop Screen", "Customer Pickup Screen", "No Pickup Screen", "Bring Forward Screen", "Supplier Stop Summary"]
      },
      {
        id: "S4",
        title: "Delivery",
        summary: "Driver records Delivered or Failed Delivery, including receiver name and signature for Delivered.",
        coverage: "partial",
        localEvidence: "Driver delivery phase lists picked-up stops, starts delivery, records Failed Delivery through a structured reason/handling-note modal, routes the outcome to Admin exceptions, blocks Delivered until receiver name and signature exist, and now has a Supabase private delivery-proof storage/retention migration contract.",
        missing: "Production failed-delivery reason codes, refusal paths, redelivery/retained-goods policy, live upload wiring/testing, upload retry/offline handling, and wrong address state.",
        steps: ["Delivery Stop List", "Delivery Stop Screen", "Receiver Name Capture", "Signature Capture", "Failed Delivery Screen"]
      },
      {
        id: "S5",
        title: "Run Close",
        summary: "Driver confirms all stops are resolved, closes run, and releases records for billing.",
        coverage: "partial",
        localEvidence: "Driver run close screen shows open stops, delivered count, open exceptions, and blocks close while stops remain open. Admin run-close review shows the close record, open-stop check, linked POD proof count, linked open exceptions, and APP-PRV-004 audit evidence.",
        missing: "Production billing-ready event semantics, accounting handoff, and close confirmation notification.",
        steps: ["Run Summary Screen", "Run Closed Confirmation"]
      }
    ]
  }
];
