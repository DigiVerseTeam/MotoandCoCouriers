import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const passes = [];

function filePath(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  const target = filePath(relativePath);
  if (!fs.existsSync(target)) {
    failures.push(`${relativePath}: file is missing`);
    return "";
  }
  return fs.readFileSync(target, "utf8");
}

function exists(relativePath, label = relativePath) {
  if (!fs.existsSync(filePath(relativePath))) {
    failures.push(`${label}: expected file does not exist`);
    return false;
  }
  passes.push(`${label}: file exists`);
  return true;
}

function missingFile(relativePath, label = relativePath) {
  if (fs.existsSync(filePath(relativePath))) {
    failures.push(`${label}: legacy file should not exist in the active runtime surface`);
    return false;
  }
  passes.push(`${label}: legacy file absent`);
  return true;
}

function requireText(relativePath, checks, label) {
  const content = read(relativePath);
  if (!content) return;
  const missing = checks.filter((check) => {
    if (typeof check === "string") return !content.includes(check);
    return !check.test(content);
  });
  if (missing.length) {
    failures.push(`${label || relativePath}: missing ${missing.map(String).join(", ")}`);
    return;
  }
  passes.push(`${label || relativePath}: ${checks.length} requirement marker(s) present`);
}

function requireAnyText(relativePath, checks, label) {
  const content = read(relativePath);
  if (!content) return;
  const found = checks.some((check) => (typeof check === "string" ? content.includes(check) : check.test(content)));
  if (!found) {
    failures.push(`${label || relativePath}: none of ${checks.map(String).join(", ")} present`);
    return;
  }
  passes.push(`${label || relativePath}: accepted marker present`);
}

function forbidText(relativePath, checks, label) {
  const content = read(relativePath);
  if (!content) return;
  const found = checks.filter((check) => {
    if (typeof check === "string") return content.includes(check);
    return check.test(content);
  });
  if (found.length) {
    failures.push(`${label || relativePath}: forbidden ${found.map(String).join(", ")} present`);
    return;
  }
  passes.push(`${label || relativePath}: forbidden marker(s) absent`);
}

const productRoutes = [
  "src/app/page.tsx",
  "src/app/booking/page.tsx",
  "src/app/tracking/page.tsx",
  "src/app/portal/page.tsx",
  "src/app/driver/page.tsx",
  "src/app/admin/page.tsx",
  "src/app/login/page.tsx",
  "src/app/journey/page.tsx",
  "src/app/accountability/page.tsx",
];

for (const route of productRoutes) {
  requireText(route, ["MotoCoLogisticsApp"], `software shell route ${route}`);
}

requireText(
  "src/lib/brand.ts",
  [
    "Moto and Co Couriers",
    "Brisbane suppliers to Gold Coast workshops",
    "#e11d48",
    "#b9b9c3",
    "#f3f3e8",
    "Approved black-and-white website photos are not available yet; use placeholders",
  ],
  "brand constants and placeholder-safe source notes"
);

requireText(
  "src/app/website/page.tsx",
  [
    "moto-and-co-couriers-logo.png",
    "Black-and-white website photo placeholder",
    "brand.geography",
    "brand.tagline",
    "href=\"/booking\"",
    "href=\"/tracking\"",
    "href=\"/legal\"",
    "href=\"/\"",
    "Receiver name and signature",
    "Booking terms, credit terms, dangerous goods policy, delivery disclaimer, privacy policy",
  ],
  "public website uses confirmed brand facts and app entry points"
);

requireText(
  "src/app/legal/page.tsx",
  [
    "Booking Terms",
    "Credit Terms",
    "Dangerous Goods Policy",
    "Delivery Disclaimer",
    "Privacy Policy",
    "Data Retention & Destruction",
    "Not Published",
    "Awaiting approved release copy",
  ],
  "legal status page avoids publishing unapproved legal copy"
);

[
  "src/components/courier-portal.tsx",
  "src/components/workspace-shell.tsx",
  "src/components/runtime-provider.tsx",
  "src/components/auth-provider.tsx",
  "src/components/admin-console.tsx",
  "src/components/client-ops-workspace.tsx",
  "src/components/billing-workspace.tsx",
  "src/components/driver-console.tsx",
  "src/components/booking-workflow.tsx",
  "src/components/journey-map.tsx",
  "src/components/accountability-console.tsx",
  "src/lib/domain.ts",
  "src/lib/seed-data.ts",
  "src/lib/access.ts",
].forEach((legacyPath) => missingFile(legacyPath, `removed first-pass scaffold ${legacyPath}`));

requireText(
  "src/app/layout.tsx",
  [
    "return (",
    "{children}",
  ],
  "root layout does not mount legacy runtime providers"
);

forbidText(
  "src/components/moto-co-logistics.tsx",
  [
    "window.confirm",
    "window.alert",
    "window.prompt",
    /\balert\s*\(/,
  ],
  "active runtime avoids native browser popups"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "function routeIntentFromPath",
    "function Login",
    "Customer Login",
    "Courier Business Login",
    "Send Login Link",
    "requestLiveMagicLink",
    "resolveLiveRuntimeSession",
    "workspaceSessionForLiveData",
    "Live login is not configured for this deployment. Contact Admin.",
    "showWorkflowNotice",
    "ACCESS_REVIEW_TYPES",
    "role_change",
    "departure",
    "Review Type",
    "accessReviewRecords",
    "Staff access is reviewed annually and on departure or role change",
  ],
  "actor login and access governance"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "Supplier access must be confirmed before pickup requests can be submitted",
    "Admin must approve supplier access before pickup requests can be submitted",
    "Supplier access change reason required.",
    "Supplier Access Change Reason",
    "Confirm Supplier Access Change",
    "supplierAccessChangeLog",
    "Supplier access changes require Admin reason/evidence",
    "applyCutoff",
    "schedule_adjusted",
    "requestCancellationReview",
    "cancelOrderBeforeCollection",
  ],
  "Client Operational booking workflow"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "SOP-DEL-01",
    "deliveryStopKeyForOrder",
    "groupDeliveryStops",
    "groupOrderIds",
    "one signature per account/address",
    "Sign Off Grouped Stop",
    "receiverName",
    "signatureUrl",
    "delivery-proof",
    "Receiver name and signature required",
    "SOP-DEL-04",
    "Physical address matches the registered delivery address",
    "Goods match the picked-up items for this client account",
    "Authorised receiver is present",
    "Read-only calculated price reviewed",
    "Driver supervised signature capture",
    "receiverNameLooksGeneric",
    "deliverySignoffPolicyRef",
    "openPriceDiscrepancyOutcome",
    "Report Price Discrepancy",
    "Read-only delivery price appears incorrect; driver did not complete delivery.",
    "runCloseSummaryForOrders",
    "Run complete. Good work.",
    "No retained-goods action items recorded.",
    "Driver close action items",
    "Delivery completed by system",
    "billingReady: true",
    "SOP-DEL-05",
  ],
  "Driver POD and delivery completion workflow"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "Driver Workflow Rule",
    "Admin Workflow Rule",
    "System Workflow Rule",
    "Complete the pre-trip check before starting the run.",
    "Complete the pre-trip check before confirming pickup.",
    "Receiver name and signature required",
    "Run cannot close while stops remain Pending or En Route.",
    "SOP-DEL-05 sets Delivered from the immutable delivery proof insert.",
    "Delivered jobs are locked after proof completion under SOP-DEL-05.",
    "Policy #14 blocks cancellation after goods have been collected. Treat refusal as Failed Delivery.",
    "Cannot archive",
    "Invoice must be overdue before an overdue notice can be recorded.",
    "Day 8 overdue notice is available from",
  ],
  "Driver, Admin, and system workflow-rule notices"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "Supplier Pickup Standards Review",
    "Policy #16",
    "No Pickup",
    "supplier_refused",
    "wrong_items",
    "Policy #15 / SOP-PUP-03 / Policy #16 / Policy #27 blocks billing",
    "whs_hazard",
    "SOP-PUP-02",
    "Close Supplier Stop",
    "supplierStopClosedAt",
    "supplierStopNoAdhocRecords",
    "each supplier stop to be closed after every customer outcome is recorded",
    "Brought Forward",
    "SOP-RUN-04 Future Pickups Ready Today",
    "No unscheduled detour is required",
    "bringForwardCollectedDate",
    "bringForwardIntendedRunDate",
    "sop_run04_original_run_compile_required",
    "noticeType: \"bring_forward\"",
    "Failed Delivery",
    "SOP_DEL04_FAILED_DELIVERY_CATEGORIES",
    "failedDeliveryCategory",
    "receiver_signature_refused",
    "price_discrepancy",
    "redeliveryFeeAmount",
    "Policy #8 redelivery fee",
  ],
  "Driver outcomes and supplier standards workflow"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "Policy #15 / Policy #16 pickup standards",
    "goodsAcceptanceStandardForRule",
    "pickupGoodsAcceptanceConfirmed",
    "pickupAcceptanceFinalConfirmed",
    "pickupGoodsAcceptanceRefused",
    "pickupGoodsAcceptancePolicyRef",
    "Policy #15 requires item-specific goods acceptance",
    "goods must not be accepted under protest",
    "Dock decision final for this run",
  ],
  "Policy #15 goods acceptance workflow"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "Workshop CRM",
    "CRM Rhythm Monitor",
    "The Village RM10",
    "Event Next Action",
    "Event next action requires an event description",
    "crmRhythmMonitorRows",
    "overdueCrmObligations",
    "Fleet Asset Register",
    "Vehicle register blocks dispatch",
    "CAP-MCL-002 Run Planning Monitor",
    "POL-MCL-002-001",
    "Night-before compile due",
    "Queue APP-ADM-002 Exception",
    "createRunPlanningException",
    "runPlanningMonitorRows",
    "Driver Directory",
    "Edit Driver Directory",
    "Manage logistics-facing driver accounts used for dispatch selection",
    "recordDriverMasterDataChanges",
    "Driver directory updated",
    "Driver Unavailable",
    "Policy #22 Availability Monitor",
    "Notice Received Date",
    "Contingency Plan",
    "driverAvailabilityNoticeDueDate",
    "lateNotice",
    "Policy #22 requires the driver notice received date",
    "Policy #22 requires Admin contingency evidence",
    "Policy #27 WHS",
    "WHS hazard at supplier premises",
    "Fatigue / Health Concern",
    "WHS Incident / Near Miss",
    "whsHazardReported",
    "Admin must raise the hazard with the supplier",
    "Pricing Rules",
    "Owner approval reference required",
    "Daily APP-ADM-005 Alert",
    "Hash Verified",
    "Policy #5 Retention Queue",
    "proofRetentionRows",
    "pickupRetentionRows",
    "supplierRetentionRows",
    "masterDataRetentionRows",
    "Run date + 7 years",
    "Relationship + 7 years",
    "Change date + 7 years",
    "Delivery date + 7 years",
    "Retention starts at archive/closure",
    "Private Bucket",
    "Destruction blocked pending Privacy Owner approval",
  ],
  "Admin CRM, fleet, pricing, exception, audit, and retention workflow"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "POL-OPS-020",
    "Policy #20 AI Draft Review Gate",
    "AI_AGENT_OPTIONS",
    "AGT-CS-001b",
    "AGT-SRM-001b",
    "AGT-ADM-007b",
    "Draft Pending Admin Review",
    "Approved - Not Sent",
    "Request AI CTA Draft",
    "Create Draft For Review",
    "Approve Draft - Do Not Send",
    "Policy #20 blocks duplicate unread AI drafts",
    "No send action available",
    "not_sent_provider_not_configured",
    "no pricing, commercial, account, suspension, or legal decision authority",
    "Provider not configured",
    "Policy #20 AI draft reviewed",
  ],
  "Policy #20 Admin AI draft review workflow"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "POL-OPS-006",
    "Policy #6 / POL-OPS-006 NDB Response Register",
    "Suspected Data Breach Intake",
    "Privacy Owner (ACT-TECH-002) must be named",
    "Blocked - Privacy Owner Unnamed",
    "Policy #6 NDB plan cannot operate past Admin containment",
    "Policy #6 blocks Admin and automation from deciding",
    "APP-PRV-004 Audit Refs Preserved",
    "APP-PRV-004 audit records are preserved",
    "30-day assessment deadline",
    "OAIC Notification Evidence",
    "Affected Individuals Evidence",
    "Post-Breach Review Report Ref",
    "Policy #6 post-breach review report records",
  ],
  "Policy #6 NDB response workflow"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "POL-OPS-021",
    "POL-OPS-007",
    "Policy #21 / POL-OPS-021 Data Use Register",
    "Policy #7 / POL-OPS-007 Information Security",
    "POLICY21_DATA_USE_REQUEST_TYPES",
    "Digiverse Production Access",
    "Data Export",
    "Third-Party Sharing",
    "Marketing Use",
    "Data Access Breach",
    "Policy #21 blocks access for personal curiosity, personal gain, or unrelated purpose.",
    "Policy #21 blocks storing personal information on personal devices.",
    "Policy #21 requires Admin approval evidence before data export.",
    "Policy #21 blocks marketing use without consent evidence.",
    "Policy #21 blocks client data sharing unless the recipient is involved in service delivery or client consent is recorded.",
    "Policy #21 blocks sharing driver personal information with clients or suppliers.",
    "Policy #21 limits Digiverse production data access to maintenance or support purposes.",
    "Policy #21 requires logged Digiverse production data access evidence.",
    "Policy #7 requires Admin-controlled production access evidence.",
    "Policy #21 data use recorded",
    "Open NDB Register",
  ],
  "Policy #21 / Policy #7 data use and information security workflow"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "POL-OPS-003",
    "POL-OPS-004",
    "POL-OPS-005",
    "Policy #3 / POL-OPS-003 Privacy Request Register",
    "POLICY3_PRIVACY_REQUEST_TYPES",
    "Access Request",
    "Correction Request",
    "Privacy Complaint",
    "Unsolicited Information",
    "policy3PrivacyResponseDueDate",
    "policy3PrivacyComplaintAckDueDate",
    "Policy #3 privacy request requires the individual/requester name.",
    "Policy #3 APP 12 access requests require response evidence before resolution.",
    "Policy #3 APP 13 correction requests require correction action evidence before resolution.",
    "Policy #3 allows refusal only on Privacy Act-permitted grounds",
    "Policy #3 APP 4 requires an APP 3 collection assessment",
    "Policy #5 blocks destruction/de-identification until Privacy Owner approval is recorded.",
    "Policy #3 privacy request recorded",
    "Open Retention Register",
  ],
  "Policy #3 / Policy #4 / Policy #5 privacy request workflow"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "CRM_RELATIONSHIP_TIERS",
    "CRM_RELATIONSHIP_STATUSES",
    "CRM_RISK_LEVELS",
    "CRM_EVENT_TYPES",
    "CRM_OBLIGATION_TYPES",
    "CRM_OBLIGATION_STATUSES",
    "Village CRM requires a named internal relationship owner.",
    "Event next action requires an event description.",
    "Event next action due date requires a next action.",
    "Obligations require title, description, and risk if breached.",
    "crmRhythmMonitorRows",
    "clientOpenIssues",
    "overdueCrmObligations",
    "crmReviewedAt",
    "CRM record reviewed",
  ],
  "Village CRM release-one runtime subset"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "supplierOpenWorkCount",
    "Archive Supplier",
    "Reactivate Supplier",
    "Confirm Archive",
    "Confirm Reactivate",
    "Archive is blocked while open work references this supplier",
    "Supplier action reason required.",
    "archivedReason",
    "reactivationReason",
    "Supplier archived",
    "Supplier archive blocked",
  ],
  "Admin supplier archive/reactivation workflow"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "POL-MCL-001-001 Supplier Approval Gate",
    "supplierApprovalGateState",
    "dockContactName",
    "dockAccessAgreed",
    "packagingStandardsAgreed",
    "pickupWindowAgreed",
    "supplierApprovalEvidenceRef",
    "Named Contact Gaps",
    "POL-MCL-001-001 Supplier Approval Gate requires dock access, packaging standards, pickup window, and written approval evidence",
  ],
  "CAP-MCL-001 supplier approval gate"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "Archive Pricing Rule",
    "Reactivate Pricing Rule",
    "Pricing action reason required.",
    "Owner approval reference required before a local price rule can be changed.",
    "Pricing archive/reactivation reason",
    "Owner approval reference or written approval location",
    "local-price-change",
    "recordPricingMasterDataChanges",
    "Pricing rule updated",
  ],
  "Admin pricing archive/reactivation workflow"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "Unmatched Billing Account",
    "MC-UNMATCHED-001",
    "proof-seed-unmatched-1",
    "SOP-EXC-03 local verification fixture",
    "Admin investigation note required before correcting an unmatched billing account",
    "billingAccountMatchStatus: \"resolved\"",
    "Billing account match corrected",
    "Confirm Invoice Correct",
    "Admin invoice review note required before confirming the invoice is correct.",
    "Automatic dispatch triggered by Admin invoice correctness confirmation",
    "Payment monitoring starts after invoice dispatch",
    "Day 8 overdue notice",
    "Record notification evidence for both Operational and Billing contacts",
    "POLICY23_ACCOUNT_STATUS_SOURCE",
    "Conduct breach notice evidence required before suspension.",
    "Policy #23 repeated non-payment termination is blocked.",
    "Owner consultation evidence required before termination.",
    "Written termination notice evidence required.",
    "account_terminated",
    "terminationRecord",
    "Policy #24 Month-End Financial Controls",
    "financialReconciliationRows",
    "No off-system revenue confirmed",
    "Otimi Rules reporting cadence/format unconfirmed",
    "Financial reconciliation recorded",
    "Policy #24 financial reconciliation records",
  ],
  "Billing approval, dispatch, payment, suspension, and financial control workflow"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "buildDay8OverdueNotice",
    "system_due_scan",
    "systemGenerated",
    "System-generated local Day 8 overdue notice",
    "Day 8 overdue notice recorded",
    "source {billingNoticeSourceLabel(notice).toLowerCase()}",
    "No overdue invoices awaiting a Day 8 notice.",
    "generationSource === \"admin_manual\"",
  ],
  "Day 8 overdue notice auto-generation workflow"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "Billing dispute raised",
    "Delivery Dispute",
    "Billing Dispute",
    "Policy #18",
    "policy18StatusLine",
    "response monitoring outside this portal",
    "ownerEscalationStatus",
    "credit note or corrected invoice",
    "policy18BillingLineDate",
    "Billing query description required",
    "Policy #18 delivery date in question required",
  ],
  "Policy #18 dispute workflow"
);

forbidText(
  "src/components/moto-co-logistics.tsx",
  [
    "ackDueDate",
    "resolutionDueDate",
    "Admin acknowledgement target",
    "resolution target",
    "policy18SlaLabel",
  ],
  "SLA monitoring excluded from active runtime"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "time_constraint",
    "Eligibility checklist is advisory only",
    "Confirm Invoice Correct",
    "Automatic dispatch triggered by Admin invoice correctness confirmation",
    "Payment arrangement requires agreed date, amount, contact name/role, and written evidence reference.",
    "Operational and Billing contacts notified automatically on Admin reinstatement action.",
    "second attempt scheduled for next run",
  ],
  "decisions register runtime alignment"
);

requireText(
  "src/components/moto-co-logistics.tsx",
  [
    "requestLiveMagicLink",
    "resolveLiveRuntimeSession",
    "loadLiveRuntimeSnapshot",
    "Customer Login",
    "Courier Business Login",
    "Send Login Link",
  ],
  "production login uses live email-link entry flow"
);

forbidText(
  "src/components/moto-co-logistics.tsx",
  [
    "Local testing code",
    "Production Supabase Auth email delivery is not connected",
    "Get Login Code",
    "Reset Local Demo Data",
    "[\"client\", \"billing\", \"driver\", \"admin\"]",
  ],
  "legacy local-code login removed from active portal"
);

requireText(
  "src/lib/live-runtime.ts",
  [
    "liveAuthRedirectPromise",
    "liveAuthRedirectCompletedHref",
    "exchangeCodeForSession",
    "if (data?.session) return next",
    "Remove",
    "one-use code",
    "getSession",
    "actor_code",
    "requestLiveMagicLink",
    "resolveLiveRuntimeSession",
  ],
  "live Supabase auth callback race guard and role mapping"
);

requireText(
  "src/app/auth/callback/page.tsx",
  [
    "completeLiveAuthRedirect",
    "window.location.replace",
    "Completing your sign in",
    "Request a new login link",
  ],
  "lightweight auth callback route"
);

forbidText(
  "src/app/auth/callback/page.tsx",
  [
    "MotoCoLogisticsApp",
    "@/components/moto-co-logistics",
  ],
  "auth callback must not mount the full portal"
);

requireText(
  "src/lib/environment-guard.ts",
  [
    "local and preview app builds must not connect to production Supabase",
  ],
  "preview-to-production Supabase guard"
);

requireText(
  "src/lib/supabase.ts",
  [
    "NEXT_PUBLIC_APP_ENV",
    "NEXT_PUBLIC_SUPABASE_ENV",
    "validateSupabaseEnvironment",
    "flowType: \"implicit\"",
    "detectSessionInUrl: true",
  ],
  "Supabase environment labels are wired into client creation"
);

requireText(
  "package.json",
  [
    "\"typecheck\": \"next typegen && tsc --noEmit\"",
    "\"verify:launch\": \"node scripts/check-launch-readiness.mjs\"",
    "\"verify:local\": \"node scripts/local-preflight.mjs\"",
    "\"verify:production\": \"node scripts/production-readiness.mjs\"",
  ],
  "clean local verification scripts"
);

requireText(
  "scripts/production-readiness.mjs",
  [
    "Strict platform environment gate",
    "Strict launch readiness gate",
    "--target=production",
    "--strict",
    "expected to fail until GitHub, Supabase, Vercel",
    "Production readiness gate failed",
  ],
  "strict production readiness gate"
);

requireText(
  "scripts/check-launch-readiness.mjs",
  [
    "Git CLI",
    "Supabase CLI",
    "Vercel CLI",
    "Local Git repository",
    "PIPE-DEV-001 / SOP-REL-01",
    "This check is read-only",
  ],
  "launch readiness checker"
);

requireText(
  "scripts/local-preflight.mjs",
  [
    "NEXT_DIST_DIR",
    ".next-preflight",
    "verify:requirements",
    "verify:platform",
    "verify:launch",
    "verify:migrations",
    "typecheck",
    "build",
  ],
  "local preflight runner"
);

requireText(
  "scripts/check-platform-env.mjs",
  [
    "PIPE-DEV-001 / SOP-REL-01",
    "local and preview app builds must not connect to production Supabase",
    "Supabase live project",
    "GitHub repository",
    "Vercel deployment",
  ],
  "platform environment contract reporter"
);

requireText(
  "scripts/verify-supabase-migrations.mjs",
  [
    "SOP-DEL-05 proof-driven delivery completion",
    "SOP-DEL-04 delivery sign-off proof",
    "SOP-EXC-03 unmatched billing account guardrail",
    "SOP-BIL-04 invoice approval gate",
    "SOP-PUP-03 No Pickup reason taxonomy",
    "SOP-RUN-04 bring-forward guardrail",
    "Policy #24 revenue reporting financial controls",
    "Policy #20 AI use governance",
    "Policy #21 / Policy #7 data use",
    "Policy #3/#4/#5 privacy request controls",
    "BOAS Sheet 05 role access RLS draft",
  ],
  "Supabase migration verifier"
);

requireText(
  ".env.example",
  [
    "NEXT_PUBLIC_APP_ENV=local",
    "NEXT_PUBLIC_SUPABASE_ENV=local",
    "SUPABASE_PROJECT_REF=",
    "SUPABASE_REGION=",
    "GITHUB_OWNER=",
    "GITHUB_REPOSITORY=",
    "VERCEL_TEAM=",
    "VERCEL_PROJECT=",
    "VERCEL_PRODUCTION_DOMAIN=",
    "NEXT_PUBLIC_SITE_URL=",
  ],
  "platform environment example contract"
);

const migrations = [
  "supabase/migrations/202606180018_role_access_rls.sql",
  "supabase/migrations/202606180020_delivery_proof_storage_contract.sql",
  "supabase/migrations/202606180022_pricing_change_log_guardrails.sql",
  "supabase/migrations/202606190003_order_cancellation_policy14.sql",
  "supabase/migrations/202606190004_failed_delivery_policy8.sql",
  "supabase/migrations/202606190005_supplier_pickup_standards_policy16.sql",
  "supabase/migrations/202606190006_delivery_completion_sop_del05.sql",
  "supabase/migrations/202606190007_policy18_dispute_sla.sql",
  "supabase/migrations/202606190008_day8_overdue_notice_generation.sql",
  "supabase/migrations/202606190009_unmatched_billing_account_exceptions.sql",
  "supabase/migrations/202606190010_invoice_approval_gate_sop_bil04.sql",
  "supabase/migrations/202606190011_delivery_stop_grouping_sop_del01.sql",
  "supabase/migrations/202606190030_delivery_signoff_sop_del04.sql",
  "supabase/migrations/202606190031_run_close_confirmation_uj_drv001.sql",
  "supabase/migrations/202606190024_ai_use_policy20.sql",
  "supabase/migrations/202606190026_data_use_policy21_policy7.sql",
  "supabase/migrations/202606190027_privacy_requests_policy3_policy4_policy5.sql",
  "supabase/migrations/202606210001_decisions_register_scope_alignment.sql",
  "supabase/migrations/202606210002_reinstatement_payment_arrangement.sql",
];

for (const migration of migrations) exists(migration, `source-backed migration ${migration}`);

requireText(
  "docs/production-blocker-register.md",
  [
    "GitHub repository is not connected",
    "Production Supabase project is not fully connected",
    "Vercel project is not connected",
    "Notification provider and channel are unconfirmed",
    "Production invoice dispatch is unconfirmed",
    "Public tracking model is unconfirmed",
    "POD photo and device assumptions are unconfirmed",
    "Production reason-code taxonomy is incomplete",
  ],
  "production blocker register"
);

requireText(
  "docs/build-gaps.md",
  [
    "provider_not_configured",
    "Zoho Books integration is not confirmed",
    "Privacy Owner is unnamed",
    "Public secure tracking-token model is not confirmed",
    "Production invoice PDF/email rendering",
  ],
  "local gaps remain explicit"
);

requireText(
  "docs/hard-scope-requirements.md",
  [
    "SLA Monitoring Is Out Of Scope",
    "HCM Requirements Are Out Of Scope",
    "Database triggers that calculate Admin acknowledgement or resolution due dates",
    "Driver legal classification",
    "Logistics-facing driver identity",
    "records timestamps",
  ],
  "hard scope requirements"
);

requireText(
  "docs/decision-register-alignment.md",
  [
    "All 24 pre-build user-journey gaps are decision-resolved",
    "SLA monitoring is outside the logistics portal",
    "HCM requirements are outside the logistics portal",
    "No Pickup time constraint",
    "Invoice dispatch trigger",
    "minimum two active Admin users",
  ],
  "decisions register alignment"
);

requireText(
  "docs/hcm-boundary.md",
  [
    "driver legal classification, driver agreements, driver legal verification evidence, disciplinary/removal consequences",
    "Those items are HCM requirements",
    "These files are not part of the active logistics runtime",
    "Policy #22 driver availability records",
    "assignable",
    "not_assignable",
  ],
  "HCM boundary and preserved draft material"
);

requireAnyText(
  "docs/current-state-audit.md",
  [
    "Build working software rather than workflow display pages",
    "software rather than workflow display pages",
  ],
  "completion audit keeps software-vs-documentation distinction"
);

requireText(
  "docs/local-build-report.md",
  [
    "Product route `/journey` now mounts the active software shell",
    "not a journey-map product page",
  ],
  "build report keeps journey route aligned to software shell"
);

requireText(
  "docs/customer-journey-comparison.md",
  [
    "The journey material is implementation source and acceptance evidence",
    "Product routes mount the active software shell",
    "must not become journey-viewer or workflow-display pages",
  ],
  "customer journey comparison stays source evidence, not product UI"
);

forbidText(
  "docs/local-build-report.md",
  [
    "Journey page shows the uploaded user journeys",
    "Journey page verified after uploaded journey update",
    "Journey page verified with no page-wide horizontal overflow",
  ],
  "build report avoids stale journey-page product claims"
);

forbidText(
  "docs/customer-journey-comparison.md",
  [
    "Updated `/journey` to show the uploaded journey comparison",
  ],
  "customer journey comparison avoids stale journey-viewer route claims"
);

if (failures.length) {
  console.error("\nRuntime requirement verification failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`\n${passes.length} check(s) passed before failure.\n`);
  process.exit(1);
}

console.log(`Runtime requirement verification passed: ${passes.length} check(s).`);
