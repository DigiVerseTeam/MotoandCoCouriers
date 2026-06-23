// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { nextAvailableRunDate, resolveActualRunDate } from "@/lib/date-rules";
import {
  completeLiveAuthRedirect,
  getLiveRuntimeStatus,
  loadLiveRuntimeSnapshot,
  onLiveAuthStateChange,
  requestLivePasswordLogin,
  resolveLiveRuntimeSession,
  signOutLiveRuntime,
} from "@/lib/live-runtime";

// ─── THEME ───────────────────────────────────────────────────────────────────
const T = {
  bg: "#ffffff",
  card: "#ffffff",
  border: "#b9b9c3",
  acc: "#e11d48",
  teal: "#000000",
  red: "#e11d48",
  tx: "#000000",
  mu: "rgba(0,0,0,.62)",
  mu2: "rgba(0,0,0,.36)",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${T.bg};color:${T.tx};font-family:'Inter',sans-serif;min-height:100vh}
  .app{min-height:100vh;display:flex;flex-direction:column}
  /* NAV */
  .nav{background:${T.card};border-bottom:1px solid ${T.border};padding:.7rem 1.4rem;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:4}
  .logo{display:flex;align-items:center;gap:.75rem;font-weight:900;font-size:1rem;letter-spacing:0;text-transform:uppercase}
  .logo img{width:92px;height:auto;display:block}
  .logo-sub{color:${T.mu};font-size:.72rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase}
  .nav-role{font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${T.tx};background:${T.bg};padding:.25rem .65rem;border-radius:4px;border:1px solid ${T.border}}
  .nav-out{font-size:.8rem;color:${T.tx};cursor:pointer;padding:.3rem .7rem;border-radius:4px;border:1px solid ${T.border};background:transparent;transition:.2s}
  .nav-out:hover{border-color:${T.tx}}
  /* MAIN */
  .main{flex:1;padding:1.4rem;max-width:820px;margin:0 auto;width:100%}
  /* LOGIN */
  .login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.4rem;background:${T.bg}}
  .login-card{background:${T.card};border:1px solid ${T.border};border-radius:8px;padding:2rem 1.8rem;width:100%;max-width:400px}
  .login-logo{text-align:center;margin-bottom:1.8rem}
  .login-logo img{width:142px;height:auto;margin:0 auto .8rem;display:block}
  .login-logo h1{font-size:1.6rem;font-weight:900;letter-spacing:0}
  .login-logo h1 span{color:${T.acc}}
  .login-logo p{font-size:.75rem;color:${T.mu};margin-top:.25rem;letter-spacing:.05em;text-transform:uppercase}
  .tabs{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:1.4rem;background:rgba(0,0,0,.03);border:1px solid ${T.border};border-radius:8px;padding:.25rem}
  .tab{flex:1 1 86px;padding:.45rem;font-size:.78rem;font-weight:800;line-height:1.15;border:none;background:transparent;color:${T.mu};border-radius:4px;cursor:pointer;transition:.15s}
  .tab.active{background:${T.card};color:${T.tx};box-shadow:none;border:1px solid ${T.border}}
  /* FORMS */
  .f{display:flex;flex-direction:column;gap:.3rem;margin-bottom:.9rem}
  .f label{font-size:.72rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:${T.mu}}
  .f input,.f select,.f textarea{background:${T.bg};border:1px solid ${T.border};border-radius:6px;padding:.6rem .8rem;color:${T.tx};font-size:.9rem;font-family:inherit;outline:none;transition:.15s;width:100%}
  .f input:focus,.f select:focus,.f textarea:focus{border-color:${T.tx};box-shadow:0 0 0 3px rgba(0,0,0,.06)}
  .f textarea{resize:vertical;min-height:80px}
  .fr{display:grid;grid-template-columns:1fr 1fr;gap:.8rem}
  .btn{width:100%;padding:.7rem;border-radius:6px;border:1px solid transparent;font-weight:800;font-size:.9rem;cursor:pointer;transition:.15s;display:flex;align-items:center;justify-content:center;gap:.5rem}
  .b-acc{background:${T.acc};color:#ffffff}
  .b-acc:hover{filter:brightness(.94)}
  .b-teal{background:${T.tx};color:#ffffff}
  .b-teal:hover{filter:brightness(.94)}
  .b-red{background:${T.red};color:#ffffff}
  .b-ghost{background:transparent;border:1px solid ${T.border};color:${T.tx}}
  .b-ghost:hover{border-color:${T.tx}}
  .b-sm{width:auto;padding:.4rem .9rem;font-size:.8rem}
  .err{color:${T.red};font-size:.8rem;margin-bottom:.7rem;text-align:center}
  .policy-notice{border:1px solid ${T.acc};border-left:4px solid ${T.acc};border-radius:8px;background:rgba(225,29,72,.06);padding:.85rem .95rem;margin-bottom:.9rem;display:flex;gap:.8rem;align-items:flex-start;justify-content:space-between;position:relative;z-index:1}
  .policy-notice-title{font-size:.72rem;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:${T.acc};margin-bottom:.25rem}
  .policy-notice-body{font-size:.84rem;color:${T.tx};line-height:1.42}
  .policy-notice-close{border:1px solid ${T.border};background:${T.card};color:${T.tx};border-radius:4px;padding:.15rem .45rem;font-size:.74rem;font-weight:800;cursor:pointer}
  .system-notice{position:fixed;right:1rem;top:1rem;z-index:120;width:min(420px,calc(100vw - 2rem));box-shadow:0 16px 36px rgba(0,0,0,.16)}
  .fp{font-size:.75rem;color:${T.mu};text-align:right;cursor:pointer;margin-top:-.4rem;margin-bottom:.6rem}
  .fp:hover{color:${T.acc}}
  /* CARDS */
  .card{background:${T.card};border:1px solid ${T.border};border-radius:8px;padding:1.1rem 1.2rem;margin-bottom:.8rem}
  .card-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.6rem}
  .card-title{font-weight:700;font-size:1rem}
  .badge{font-size:.67rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:.2rem .55rem;border-radius:4px;border:1px solid currentColor}
  .b-pending{background:rgba(225,29,72,.07);color:${T.acc}}
  .b-enroute{background:rgba(0,0,0,.03);color:${T.tx}}
  .b-done{background:#ffffff;color:${T.tx}}
  .b-cancelled{background:rgba(225,29,72,.07);color:${T.red}}
  .meta{font-size:.8rem;color:${T.mu};display:flex;flex-wrap:wrap;gap:.5rem .9rem;margin-bottom:.5rem}
  .meta span{display:flex;align-items:center;gap:.3rem}
  .dvd{border:none;border-top:1px solid ${T.border};margin:.8rem 0}
  /* SECTION HEAD */
  .sh{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
  .sh h2{font-size:1.1rem;font-weight:700}
  /* SPINNER */
  .spin{width:14px;height:14px;border:2px solid rgba(0,0,0,.3);border-top-color:#000000;border-radius:50%;animation:spin .7s linear infinite;display:inline-block}
  @keyframes spin{to{transform:rotate(360deg)}}
  /* SIGNATURE */
  .sigbox{position:relative;background:${T.bg};border:1px solid ${T.border};border-radius:6px;height:120px;cursor:crosshair;touch-action:none;overflow:hidden}
  .sigph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:${T.mu2};font-size:.8rem;pointer-events:none}
  .sigclr{position:absolute;top:6px;right:6px;background:rgba(0,0,0,.03);border:1px solid ${T.border};color:${T.tx};font-size:.7rem;padding:.2rem .5rem;border-radius:4px;cursor:pointer}
  /* PILL SELECTOR */
  .pills{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.8rem}
  .pill{padding:.35rem .85rem;border-radius:4px;border:1px solid ${T.border};font-size:.8rem;font-weight:800;cursor:pointer;transition:.15s;background:transparent;color:${T.mu}}
  .pill.sel{border-color:${T.acc};color:${T.acc};background:rgba(225,29,72,.06)}
  /* STEP */
  .step-bar{display:flex;gap:.4rem;margin-bottom:1.2rem}
  .step-dot{flex:1;height:4px;border-radius:2px;background:${T.border}}
  .step-dot.done{background:${T.acc}}
  /* EMPTY */
  .empty{text-align:center;padding:3rem 1rem;color:${T.mu};font-size:.9rem}
  /* MODAL */
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;z-index:100;padding:1rem}
  .modal{background:${T.card};border:1px solid ${T.border};border-radius:8px;padding:1.6rem;width:100%;max-width:460px;max-height:90vh;overflow-y:auto}
  .modal h3{font-size:1rem;font-weight:700;margin-bottom:1rem}
  /* ADMIN TABLE */
  .tbl{width:100%;border-collapse:collapse;font-size:.82rem}
  .tbl th{text-align:left;font-size:.68rem;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:${T.mu};padding:.5rem .8rem;border-bottom:1px solid ${T.border}}
  .tbl td{padding:.6rem .8rem;border-bottom:1px solid ${T.border};vertical-align:middle}
  .tbl tr:hover td{background:rgba(0,0,0,.02)}
  /* STAT CARDS */
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.8rem;margin-bottom:1.4rem}
  .stat{background:${T.card};border:1px solid ${T.border};border-radius:8px;padding:.9rem 1rem}
  .stat-num{font-size:1.7rem;font-weight:900;line-height:1}
  .stat-lbl{font-size:.7rem;color:${T.mu};font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-top:.3rem}
  select option{background:${T.card};color:${T.tx}}
`;

function PolicyNotice({ title = "Workflow Rule", children, onDismiss, system = false }) {
  if (!children) return null;
  return (
    <div className={`policy-notice${system ? " system-notice" : ""}`} role="status" aria-live="polite">
      <div>
        <div className="policy-notice-title">{title}</div>
        <div className="policy-notice-body">{children}</div>
      </div>
      {onDismiss && <button className="policy-notice-close" onClick={onDismiss}>Close</button>}
    </div>
  );
}

function routeIntentFromPath(pathname = "/") {
  const path = String(pathname || "/").toLowerCase();
  if (path.startsWith("/admin")) {
    return {
      loginRole: "admin",
      loginNotice: "Admin operations route. Login as Admin to review exceptions, dispatch, CRM, supplier, pricing, billing, retention, and audit work.",
    };
  }
  if (path.startsWith("/driver")) {
    return {
      loginRole: "driver",
      loginNotice: "Driver run route. Login as Driver to work assigned pickup, delivery, POD, and run close tasks.",
    };
  }
  if (path.startsWith("/tracking")) {
    return {
      loginRole: "client",
      clientInitialView: "tracking",
      loginNotice: "Tracking route. Login as Client Operational Contact to search account-scoped delivery records and POD evidence.",
    };
  }
  if (path.startsWith("/booking")) {
    return {
      loginRole: "client",
      clientInitialView: "orders",
      startNewPickup: true,
      loginNotice: "Booking route. Login as Client Operational Contact to submit pickup requests against approved suppliers. New public/unregistered bookings remain unresolved.",
    };
  }
  if (path.startsWith("/portal")) {
    return {
      loginRole: "client",
      clientInitialView: "orders",
      loginNotice: "Client portal route. Login as Client Operational Contact to manage orders, suppliers, tracking, updates, billing evidence, and profile details.",
    };
  }
  return {
    loginRole: "client",
    clientInitialView: "orders",
    loginNotice: "",
  };
}

// ─── DATA ────────────────────────────────────────────────────────────────────
const SUPPLIER_APPROVAL_SOURCE = "CAP-MCL-001 / POL-MCL-001-001";
const CURRENT_SUPPLIER_NETWORK_REF = "CAP-MCL-001 v1.0 current approved supplier network";
const approvedSupplierDefaults = {
  dockContactRole: "Supplier Logistics/Dock Contact",
  dockContactName: "",
  dockAccessAgreed: true,
  packagingStandardsAgreed: true,
  pickupWindowAgreed: true,
  supplierApprovalEvidenceRef: CURRENT_SUPPLIER_NETWORK_REF,
};
const seedSuppliers = [
  { id: "sup-link", name: "Link International", address: "14 Kimberly Rd, Dandenong South VIC 3175", phone: "03 9768 0600", pickupWindow: "Goods ready at dock by 10:00am", packagingNotes: "Policy #16: tyres upright/stacked and secured; batteries hazardous-goods packaged; parts boxed/bagged and labelled.", status: "Active", lastReviewed: "2026-06-18" },
  { id: "sup-a1", name: "A1 Accessories", address: "15 Hoepner Rd, Bundamba QLD 4304", phone: "07 3282 4888", pickupWindow: "Goods ready at dock by 10:00am", packagingNotes: "Policy #16: tyres upright/stacked and secured; batteries hazardous-goods packaged; parts boxed/bagged and labelled.", status: "Active", lastReviewed: "2026-06-18" },
  { id: "sup-mcleods", name: "McLeods", address: "3 Nestor Dr, Meadowbrook QLD 4131", phone: "07 3200 2820", pickupWindow: "Goods ready at dock by 10:00am", packagingNotes: "Policy #16: tyres upright/stacked and secured; batteries hazardous-goods packaged; parts boxed/bagged and labelled.", status: "Active", lastReviewed: "2026-06-18" },
  { id: "sup-gas", name: "Gas Imports", address: "31 Gardner Ct, Wilsonton QLD 4350", phone: "07 4634 8233", pickupWindow: "Goods ready at dock by 10:00am", packagingNotes: "Policy #16: tyres upright/stacked and secured; batteries hazardous-goods packaged; parts boxed/bagged and labelled.", status: "Active", lastReviewed: "2026-06-18" },
  { id: "sup-ficeda", name: "Ficeda", address: "12 Northumberland Rd, Caringbah NSW 2229", phone: "02 9526 6600", pickupWindow: "Goods ready at dock by 10:00am", packagingNotes: "Policy #16: tyres upright/stacked and secured; batteries hazardous-goods packaged; parts boxed/bagged and labelled.", status: "Active", lastReviewed: "2026-06-18" },
  { id: "sup-whites", name: "Whites Powersports", address: "6 Hamill St, Archerfield QLD 4108", phone: "07 3277 5999", pickupWindow: "Goods ready at dock by 10:00am", packagingNotes: "Policy #16: tyres upright/stacked and secured; batteries hazardous-goods packaged; parts boxed/bagged and labelled.", status: "Active", lastReviewed: "2026-06-18" },
].map(supplier => ({ ...approvedSupplierDefaults, ...supplier, reviewIntervalDays: "" }));

const VENDORS = seedSuppliers;

const STAGES = ["Pending", "En Route", "Delivered", "No Pickup", "Brought Forward", "Failed Delivery", "Cancelled"];
const DRIVER_AVAILABILITY_BLOCKING_STATUSES = ["unavailable", "leave"];
const POLICY22_DRIVER_SCHEDULING_SOURCE = "Policy #22 / APP-ADM-002";
const POLICY27_WHS_SOURCE = "Policy #27 / POL-OPS-027";
const POLICY24_REVENUE_SOURCE = "Policy #24 / POL-OPS-024";
const POLICY20_AI_USE_SOURCE = "Policy #20 / POL-OPS-020";
const POLICY6_NDB_SOURCE = "Policy #6 / POL-OPS-006";
const POLICY3_PRIVACY_SOURCE = "Policy #3 / POL-OPS-003";
const POLICY4_COLLECTION_NOTICE_SOURCE = "Policy #4 / POL-OPS-004";
const POLICY5_RETENTION_SOURCE = "Policy #5 / POL-OPS-005";
const POLICY21_DATA_USE_SOURCE = "Policy #21 / POL-OPS-021";
const POLICY7_INFORMATION_SECURITY_SOURCE = "Policy #7 / POL-OPS-007 Information Security";
const POLICY23_ACCOUNT_STATUS_SOURCE = "Policy #23 / Account Suspension & Termination";
const POLICY6_PRIVACY_OWNER_BLOCKER = "Privacy Owner (ACT-TECH-002) unnamed";
const DRIVER_RUN_BLOCKING_ISSUE_TYPES = ["Pre-Trip Defect", "Device Issue", "Run Brief Issue", "Fatigue / Health Concern", "WHS Incident / Near Miss"];
const POLICY20_AI_DRAFT_STATUSES = ["Draft Pending Admin Review", "Approved - Not Sent", "Rejected"];
const POLICY6_NDB_STATUSES = [
  "Open - Identify and Contain",
  "Contained - Awaiting Privacy Owner",
  "Privacy Owner Assessment",
  "Notification Required",
  "Post-Breach Review",
  "Closed",
];
const POLICY6_ELIGIBILITY_DECISIONS = [
  "Blocked - Privacy Owner Unnamed",
  "Awaiting Privacy Owner Assessment",
  "Eligible Data Breach",
  "Not Eligible",
];
const POLICY21_DATA_USE_REQUEST_TYPES = [
  "Operational Access",
  "Data Export",
  "Digiverse Production Access",
  "Third-Party Sharing",
  "Marketing Use",
  "Data Access Breach",
];
const POLICY21_DATA_USE_REQUESTER_ROLES = ["Admin", "Driver", "Digiverse", "Other Staff", "Client"];
const POLICY21_DATA_USE_STATUSES = ["Logged", "Approved", "Blocked", "Breach Reported"];
const POLICY3_PRIVACY_REQUEST_TYPES = ["Access Request", "Correction Request", "Privacy Complaint", "Unsolicited Information"];
const POLICY3_PRIVACY_REQUESTER_ROLES = ["Client Operational Contact", "Client Billing Contact", "Driver", "Supplier Contact", "Receiver", "Other Individual"];
const POLICY3_PRIVACY_STATUSES = ["Open", "Acknowledged", "Resolved", "Refused", "Referred to OAIC", "Blocked - Privacy Owner Required"];
const POLICY23_SUSPENSION_TYPES = ["non_payment", "material_conduct_breach"];
const POLICY23_TERMINATION_GROUNDS = ["conduct_unremedied", "voluntary_request", "repeated_non_payment"];
const POLICY23_DEBT_RECOVERY_GAP = "Debt recovery escalation path and write-off thresholds are not confirmed";
const AI_AGENT_OPTIONS = [
  {
    id: "AGT-CS-001b",
    name: "Customer Success AI",
    scope: "flagged_client",
    trigger: "Admin reviews a flagged account in APP-CS-001a",
  },
  {
    id: "AGT-SRM-001b",
    name: "Supplier CTA Agent",
    scope: "flagged_supplier",
    trigger: "Admin reviews a flagged supplier in APP-SRM-001a",
  },
  {
    id: "AGT-ADM-007b",
    name: "CTA Drafting Agent",
    scope: "flagged_actor",
    trigger: "Admin trigger - any flagged actor",
  },
];
const CRM_RELATIONSHIP_TIERS = ["Transactional", "Preferred", "Strategic", "Co-creation"];
const CRM_RELATIONSHIP_STATUSES = ["Active", "Inactive", "At-Risk", "Suspended", "Closed"];
const CRM_RISK_LEVELS = ["Low", "Medium", "High", "Critical"];
const CRM_EVENT_TYPES = ["Meeting", "Call", "Email", "Decision", "Issue", "Commitment", "Performance Signal", "Sentiment Signal", "Other"];
const CRM_HEALTH_IMPACTS = ["Positive", "Neutral", "Negative"];
const CRM_OBLIGATION_TYPES = ["Contract", "Service Commitment", "Payment Term", "Regulatory Commitment", "Agreed Action", "Other"];
const CRM_OBLIGATION_DIRECTIONS = ["We owe them", "They owe us", "Mutual"];
const CRM_OBLIGATION_STATUSES = ["Active", "Fulfilled", "Overdue", "Disputed", "Terminated"];

const seedPriceRules = [
  { id: "price-tyre-1", serviceVariant: "SVC-MCL-001-T", label: "1 tyre", itemType: "tyre", tyreCountMin: 1, tyreCountMax: 1, rateCents: 2500, rateMode: "flat", effectiveFrom: "2026-06-01", amount: 25, method: "fixed", status: "Active" },
  { id: "price-tyre-2", serviceVariant: "SVC-MCL-001-T", label: "2 tyres", itemType: "tyre", tyreCountMin: 2, tyreCountMax: 2, rateCents: 4000, rateMode: "flat", effectiveFrom: "2026-06-01", amount: 40, method: "fixed", status: "Active" },
  { id: "price-tyre-3", serviceVariant: "SVC-MCL-001-T", label: "3 tyres", itemType: "tyre", tyreCountMin: 3, tyreCountMax: 3, rateCents: 5500, rateMode: "flat", effectiveFrom: "2026-06-01", amount: 55, method: "fixed", status: "Active" },
  { id: "price-tyre-4-plus", serviceVariant: "SVC-MCL-001-T", label: "4 or more tyres", itemType: "tyre", tyreCountMin: 4, rateCents: 1200, rateMode: "per_item", effectiveFrom: "2026-06-01", amount: 12, method: "perItem", minQty: 4, status: "Active" },
  { id: "price-parts-lt-5", serviceVariant: "SVC-MCL-001-P", label: "Less than 5 kg", itemType: "parts", weightBand: "lt_5kg", rateCents: 1500, rateMode: "flat", effectiveFrom: "2026-06-01", amount: 15, method: "fixed", status: "Active" },
  { id: "price-parts-5-15", serviceVariant: "SVC-MCL-001-P", label: "5 kg to 15 kg", itemType: "parts", weightBand: "5_to_15kg", rateCents: 2200, rateMode: "flat", effectiveFrom: "2026-06-01", amount: 22, method: "fixed", status: "Active" },
  { id: "price-parts-gt-15", serviceVariant: "SVC-MCL-001-P", label: "More than 15 kg", itemType: "parts", weightBand: "gt_15kg", rateCents: 3500, rateMode: "flat", effectiveFrom: "2026-06-01", amount: 35, method: "fixed", status: "Active" },
  { id: "price-redelivery", serviceVariant: "REDELIVERY", label: "After 2nd failed attempt", itemType: "redelivery", rateCents: 1000, rateMode: "flat", effectiveFrom: "2026-06-01", amount: 10, method: "fixed", status: "Active" },
].map(rule => ({
  ...rule,
  changeLogId: "policy-9-initial-2026-06-01",
  ownerApprovalRef: "Policy #9 / SOP-MDM-02 initial approved schedule",
  sourceRef: "Policy #9 / SOP-MDM-02",
}));


// ─── SEED DATA ───────────────────────────────────────────────────────────────
const seedOrders = [
  { id: "MC-001", clientId: "c1", clientName: "Gold Coast Cycles", vendor: "Link International", conNote: "LI-4821", dropAddress: "22 Ferry Rd, Southport QLD", notes: "Call on arrival", status: "En Route", pickupOutcome: "Picked Up", pickupPriceRuleId: "price-tyre-2", pickupItemType: "2 tyres", pickupItemQty: 2, pickupCalculatedPrice: 40, requestedDate: "2026-05-14", actualRunDate: "2026-05-14", date: "2026-05-14", driverId: "d1", driverName: "Damo Reeves", vehicleId: "act-veh-001", vehicleName: "MCO-001", runId: "RUN-2026-05-14-d1-MCO-001", assignedAt: "2026-05-14T00:00:00.000Z", price: 40, recvName: "", sig: "", vehicleRegistrationCurrent: true, vehicleInsuranceCurrent: true, vehicleRegistrationExpiry: "2027-06-18", vehicleInsuranceExpiry: "2027-06-18", vehicleComplianceCheckedAt: "2026-06-18T00:00:00.000Z", vehicleComplianceCheckedBy: "Admin", vehicleComplianceSource: "vehicle_register_local", vehicleComplianceNote: "Seed vehicle register APP-FLT-001 local check" },
  { id: "MC-004", clientId: "c1", clientName: "Gold Coast Cycles", vendor: "A1 Accessories", conNote: "A1-DEL01", dropAddress: "22 Ferry Rd, Southport QLD", notes: "Local SOP-DEL-01 grouped delivery-stop fixture; same account and address as MC-001.", status: "En Route", pickupOutcome: "Picked Up", pickupPriceRuleId: "price-parts-lt-5", pickupItemType: "Less than 5 kg", pickupItemQty: 1, pickupWeightBand: "lt_5kg", pickupCalculatedPrice: 15, requestedDate: "2026-05-14", actualRunDate: "2026-05-14", date: "2026-05-14", driverId: "d1", driverName: "Damo Reeves", vehicleId: "act-veh-001", vehicleName: "MCO-001", runId: "RUN-2026-05-14-d1-MCO-001", assignedAt: "2026-05-14T00:00:00.000Z", price: 15, recvName: "", sig: "", vehicleRegistrationCurrent: true, vehicleInsuranceCurrent: true, vehicleRegistrationExpiry: "2027-06-18", vehicleInsuranceExpiry: "2027-06-18", vehicleComplianceCheckedAt: "2026-06-18T00:00:00.000Z", vehicleComplianceCheckedBy: "Admin", vehicleComplianceSource: "vehicle_register_local", vehicleComplianceNote: "Seed vehicle register APP-FLT-001 local check" },
  { id: "MC-006", clientId: "c1", clientName: "Gold Coast Cycles", vendor: "Link International", conNote: "LI-PUP02", dropAddress: "22 Ferry Rd, Southport QLD", notes: "Local SOP-PUP-02 fixture: assigned current-run supplier pickup requiring per-customer outcome and supplier-stop closeout before delivery start.", status: "Pending", requestedDate: "2026-05-14", actualRunDate: "2026-05-14", date: "2026-05-14", driverId: "d1", driverName: "Damo Reeves", vehicleId: "act-veh-001", vehicleName: "MCO-001", runId: "RUN-2026-05-14-d1-MCO-001", assignedAt: "2026-05-14T00:00:00.000Z", price: null, recvName: "", sig: "", vehicleRegistrationCurrent: true, vehicleInsuranceCurrent: true, vehicleRegistrationExpiry: "2027-06-18", vehicleInsuranceExpiry: "2027-06-18", vehicleComplianceCheckedAt: "2026-06-18T00:00:00.000Z", vehicleComplianceCheckedBy: "Admin", vehicleComplianceSource: "vehicle_register_local", vehicleComplianceNote: "Seed vehicle register APP-FLT-001 local check" },
  { id: "MC-005", clientId: "c1", clientName: "Gold Coast Cycles", vendor: "Link International", conNote: "LI-RUN04", dropAddress: "22 Ferry Rd, Southport QLD", notes: "Local SOP-RUN-04 fixture: future pickup eligible to bring forward only because Link International is already on today's planned route.", status: "Pending", requestedDate: "2026-05-19", actualRunDate: "2026-05-19", date: "2026-05-19", driverId: null, price: null, recvName: "", sig: "" },
  { id: "MC-002", clientId: "c2", clientName: "Moto Madness", vendor: "Ficeda", conNote: "FC-9923", dropAddress: "8 Griffith St, Coolangatta QLD", notes: "", status: "Pending", requestedDate: "2026-05-14", actualRunDate: "2026-05-14", date: "2026-05-14", driverId: null, price: null, recvName: "", sig: "" },
  { id: "MC-003", clientId: "c1", clientName: "Gold Coast Cycles", vendor: "A1 Accessories", conNote: "A1-3311", dropAddress: "22 Ferry Rd, Southport QLD", notes: "Heavy boxes", status: "Delivered", requestedDate: "2026-05-13", actualRunDate: "2026-05-13", date: "2026-05-13", driverId: "d1", driverName: "Damo Reeves", vehicleId: "act-veh-001", vehicleName: "MCO-001", runId: "RUN-2026-05-13-d1-MCO-001", assignedAt: "2026-05-13T00:00:00.000Z", deliveryId: stableLocalDeliveryId("MC-003"), price: 35, recvName: "Jake T", sig: "data:image/png;base64,sign", proofId: "proof-seed-1", invoiceId: "INV-SEED-001", vehicleRegistrationCurrent: true, vehicleInsuranceCurrent: true, vehicleRegistrationExpiry: "2027-06-18", vehicleInsuranceExpiry: "2027-06-18", vehicleComplianceCheckedAt: "2026-06-18T00:00:00.000Z", vehicleComplianceCheckedBy: "Admin", vehicleComplianceSource: "vehicle_register_local", vehicleComplianceNote: "Seed vehicle register APP-FLT-001 local check" },
  { id: "MC-UNMATCHED-001", clientId: "unknown-account", clientName: "SOP-EXC-03 Verification Fixture", vendor: "Whites Powersports", conNote: "WP-UNMATCHED-01", dropAddress: "44 Verification Ave, Southport QLD", notes: "Local fixture: delivered proof-linked job with intentionally unknown account_id to verify SOP-EXC-03 billing exclusion and Admin correction.", status: "Delivered", requestedDate: "2026-05-13", actualRunDate: "2026-05-13", date: "2026-05-13", driverId: "d1", driverName: "Damo Reeves", vehicleId: "act-veh-001", vehicleName: "MCO-001", runId: "RUN-2026-05-13-d1-MCO-001", assignedAt: "2026-05-13T00:00:00.000Z", deliveryId: stableLocalDeliveryId("MC-UNMATCHED-001"), price: 22, recvName: "Casey V", sig: "data:image/png;base64,sign-unmatched", proofId: "proof-seed-unmatched-1", itemType: "5 kg to 15 kg", itemQty: 1, weightBand: "5_to_15kg", priceRuleId: "price-parts-5-15", deliveryCompletionSource: "SOP-DEL-05 / delivery_proof insert", deliveryCompletedBy: "system", deliveryCompletedAt: "2026-05-13T04:15:00.000Z", billingReady: true, billingReadyAt: "2026-05-13T04:15:00.000Z", billingReadySource: "SOP-DEL-05", billingAccountMatchStatus: "unmatched_fixture", billingAccountMatchSource: "SOP-EXC-03 local verification fixture", vehicleRegistrationCurrent: true, vehicleInsuranceCurrent: true, vehicleRegistrationExpiry: "2027-06-18", vehicleInsuranceExpiry: "2027-06-18", vehicleComplianceCheckedAt: "2026-06-18T00:00:00.000Z", vehicleComplianceCheckedBy: "Admin", vehicleComplianceSource: "vehicle_register_local", vehicleComplianceNote: "Seed vehicle register APP-FLT-001 local check" },
];

const seedClients = [
  { id: "c1", name: "Gold Coast Cycles", email: "gc@example.com", phone: "07 5555 1234", address: "22 Ferry Rd, Southport QLD", vendors: ["Link International", "A1 Accessories"], status: "Active", courierEligible: true, operationalContact: { name: "Gold Coast Cycles Ops", email: "gc@example.com" }, billingContact: { name: "Gold Coast Cycles Billing", email: "accounts@goldcoastcycles.example" }, consent: { notice: "Policy #4 Collection Notice", acceptedAt: "2026-06-18T00:00:00.000Z" } },
  { id: "c2", name: "Moto Madness", email: "mm@example.com", phone: "07 5555 9999", address: "8 Griffith St, Coolangatta QLD", vendors: ["Ficeda"], status: "Active", courierEligible: true, operationalContact: { name: "Moto Madness Ops", email: "mm@example.com" }, billingContact: { name: "Moto Madness Billing", email: "accounts@motomadness.example" }, consent: { notice: "Policy #4 Collection Notice", acceptedAt: "2026-06-18T00:00:00.000Z" } },
];

const seedDrivers = [
  {
    id: "d1",
    name: "Damo Reeves",
    email: "damo@motoco.com.au",
    phone: "0411 222 333",
    status: "Active",
    notes: "Local logistics driver account for dispatch and availability.",
  },
];

const seedVehicles = [
  {
    id: "act-veh-001",
    vehicleName: "MCO-001",
    registrationPlate: "MCO-001",
    make: "Local seed",
    model: "Fleet vehicle",
    year: "",
    ownershipType: "Company",
    status: "Active",
    assignedDriverId: "d1",
    registrationExpiry: "2027-06-18",
    insurancePolicy: "",
    insuranceExpiry: "2027-06-18",
    gvmKg: "",
    lastServiceDate: "2026-06-18",
    nextServiceDue: "2026-12-18",
    defectStatus: "Clear",
    lastReviewed: "2026-06-18",
    notes: "Local seed from old Moto app vehicle MCO-001. Replace with live APP-FLT-001 evidence before production.",
  },
  {
    id: "act-veh-002",
    vehicleName: "ACT-VEH-002",
    registrationPlate: "",
    make: "",
    model: "",
    year: "",
    ownershipType: "Company",
    status: "Needs Review",
    assignedDriverId: "",
    registrationExpiry: "",
    insurancePolicy: "",
    insuranceExpiry: "",
    gvmKg: "",
    lastServiceDate: "",
    nextServiceDue: "",
    defectStatus: "Unknown",
    lastReviewed: "",
    notes: "BOAS Sheet 06 identifies ACT-VEH-002 as a fleet actor, but production vehicle details are not confirmed.",
  },
];

const seedAdmins = [
  { id: "a1", name: "Admin", email: "admin@motoco.com.au" },
];

const seedProofs = [
  { id: "proof-seed-1", orderId: "MC-003", deliveryId: stableLocalDeliveryId("MC-003"), receiverName: "Jake T", signatureUrl: "data:image/png;base64,sign", signaturePath: deliveryProofSignaturePath({ id: "MC-003", deliveryId: stableLocalDeliveryId("MC-003") }), driverId: "d1", deliveredAt: "2026-05-13T03:30:00.000Z", retentionUntil: "2033-05-13", storage: `delivery-proof/${deliveryProofSignaturePath({ id: "MC-003", deliveryId: stableLocalDeliveryId("MC-003") })}`, bucketPrivate: true },
  { id: "proof-seed-unmatched-1", orderId: "MC-UNMATCHED-001", deliveryId: stableLocalDeliveryId("MC-UNMATCHED-001"), receiverName: "Casey V", signatureUrl: "data:image/png;base64,sign-unmatched", signaturePath: deliveryProofSignaturePath({ id: "MC-UNMATCHED-001", deliveryId: stableLocalDeliveryId("MC-UNMATCHED-001") }), driverId: "d1", deliveredAt: "2026-05-13T04:15:00.000Z", retentionUntil: "2033-05-13", storage: `delivery-proof/${deliveryProofSignaturePath({ id: "MC-UNMATCHED-001", deliveryId: stableLocalDeliveryId("MC-UNMATCHED-001") })}`, bucketPrivate: true, note: "Local SOP-EXC-03 verification fixture for unmatched billing account correction." },
];

const seedInvoices = [
  {
    id: "INV-SEED-001",
    clientId: "c1",
    clientName: "Gold Coast Cycles",
    billingEmail: "accounts@goldcoastcycles.example",
    status: "Overdue",
    createdAt: "2026-05-14T00:00:00.000Z",
    billingGroupApprovedAt: "2026-05-14T00:00:00.000Z",
    billingGroupApprovedBy: "seed",
    billingGroupApprovalSource: "SOP-BIL-04 seeded approved billing group",
    invoiceApprovalStatus: "Approved",
    invoiceApprovedAt: "2026-05-14T00:00:00.000Z",
    invoiceApprovedBy: "seed",
    invoiceApprovalSource: "SOP-BIL-04 seeded invoice review",
    invoiceApprovalNote: "Seeded invoice treated as rendered and reviewed for local continuity.",
    sentAt: "2026-05-14T00:00:00.000Z",
    dispatchChannel: "local_record_only",
    dispatchRecipient: "accounts@goldcoastcycles.example",
    dispatchExternalStatus: "provider_not_configured",
    dispatchNote: "Seeded local dispatch evidence retained for local continuity.",
    dispatchRecordedAt: "2026-05-14T00:00:00.000Z",
    dispatchRecordedBy: "seed",
    overdueAt: "2026-05-29T00:00:00.000Z",
    dueDate: "2026-05-21",
    subtotal: 35,
    gst: 3.5,
    total: 38.5,
    lines: [
      { orderId: "MC-003", vendor: "A1 Accessories", description: "A1-3311", amount: 35, proofId: "proof-seed-1" },
    ],
  },
];
const seedBillingNotices = [];
const seedOperationalNotices = [];
const seedRunClosures = [];
const seedDriverAvailability = [];
const seedFinancialReconciliations = [];
const seedAiDrafts = [];
const seedDataBreachIncidents = [];
const seedDataUseRecords = [];
const seedPrivacyRequests = [];

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
const KEY_ORDERS = "mc_orders";
const KEY_CLIENTS = "mc_clients";
const KEY_DRIVERS = "mc_drivers";
const KEY_VEHICLES = "mc_vehicles";
const KEY_SUPPLIERS = "mc_suppliers";
const KEY_PRICE_RULES = "mc_price_rules";
const KEY_EXCEPTIONS = "mc_exceptions";
const KEY_AUDIT = "mc_audit";
const KEY_PROOFS = "mc_delivery_proofs";
const KEY_INVOICES = "mc_invoices";
const KEY_BILLING_NOTICES = "mc_billing_notices";
const KEY_OPERATIONAL_NOTICES = "mc_operational_notices";
const KEY_RUN_CLOSES = "mc_run_closes";
const KEY_MASTER_DATA_CHANGES = "mc_master_data_changes";
const KEY_EXCEPTION_ALERTS = "mc_exception_alerts";
const KEY_DRIVER_AVAILABILITY = "mc_driver_availability";
const KEY_ACCESS_OVERRIDES = "mc_access_overrides";
const KEY_FINANCIAL_RECONCILIATIONS = "mc_financial_reconciliations";
const KEY_AI_DRAFTS = "mc_ai_drafts";
const KEY_DATA_BREACH_INCIDENTS = "mc_data_breach_incidents";
const KEY_DATA_USE_RECORDS = "mc_data_use_records";
const KEY_PRIVACY_REQUESTS = "mc_privacy_requests";
const LOCAL_DEMO_STORAGE_KEYS = [
  KEY_ORDERS,
  KEY_CLIENTS,
  KEY_DRIVERS,
  KEY_VEHICLES,
  KEY_SUPPLIERS,
  KEY_PRICE_RULES,
  KEY_EXCEPTIONS,
  KEY_AUDIT,
  KEY_PROOFS,
  KEY_INVOICES,
  KEY_BILLING_NOTICES,
  KEY_OPERATIONAL_NOTICES,
  KEY_RUN_CLOSES,
  KEY_MASTER_DATA_CHANGES,
  KEY_EXCEPTION_ALERTS,
  KEY_DRIVER_AVAILABILITY,
  KEY_ACCESS_OVERRIDES,
  KEY_FINANCIAL_RECONCILIATIONS,
  KEY_AI_DRAFTS,
  KEY_DATA_BREACH_INCIDENTS,
  KEY_DATA_USE_RECORDS,
  KEY_PRIVACY_REQUESTS,
];
const LOCAL_OTP_EXPIRY_MS = 5 * 60 * 1000;
const LOCAL_OTP_MAX_ATTEMPTS = 3;
const LOCAL_OTP_REQUEST_WINDOW_MS = 10 * 60 * 1000;
const LOCAL_OTP_MAX_REQUESTS = 5;
const AUDIT_GENESIS_HASH = "APP-PRV-004-GENESIS";
const AUDIT_HASH_ALGORITHM = "local-fnv1a-v1";

function load(key, fallback) {
  try {
    const v = sessionStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function save(key, val) {
  try { sessionStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function clearLocalDemoState() {
  try {
    LOCAL_DEMO_STORAGE_KEYS.forEach(key => sessionStorage.removeItem(key));
  } catch {}
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
function auditProtectedObject(action) {
  const text = String(action || "").toLowerCase();
  if (text.includes("privacy request") || text.includes("policy #3") || text.includes("collection notice") || text.includes("unsolicited information")) return "privacy_request";
  if (text.includes("policy #21") || text.includes("data use") || text.includes("digiverse production")) return "data_use";
  if (text.includes("breach") || text.includes("ndb") || text.includes("policy #6")) return "privacy_incident";
  if (text.includes("access") || text.includes("login") || text.includes("role")) return "access_control";
  if (text.includes("driver record") || text.includes("app-adm-006")) return "driver_record";
  if (text.includes("delivery proof")) return "delivery_proof";
  if (text.includes("billing") || text.includes("invoice")) return "billing";
  if (text.includes("customer") || text.includes("client") || text.includes("account") || text.includes("registration")) return "customer_account";
  if (text.includes("supplier")) return "supplier_master_data";
  if (text.includes("pricing")) return "price_rules";
  if (text.includes("exception") || text.includes("dispute") || text.includes("alert")) return "exception_queue";
  if (text.includes("vehicle") || text.includes("fleet")) return "fleet_asset";
  if (text.includes("driver") || text.includes("run")) return "driver_run";
  if (text.includes("order") || text.includes("pickup")) return "pickup_delivery_work";
  return "system";
}

function localAuditHash(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `local-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableLocalDeliveryId(seed) {
  const hex = [0, 1, 2, 3].map(index => localAuditHash(`${seed}|delivery|${index}`).replace("local-", "")).join("");
  const variant = ((parseInt(hex.slice(16, 17), 16) & 3) | 8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function deliveryIdForOrder(order) {
  if (Array.isArray(order?.orders)) return order.deliveryId || order.deliveryGroupId || deliveryStopIdForOrders(order.orders);
  return order?.deliveryId || stableLocalDeliveryId(order?.id || "local-delivery");
}

function deliveryProofSignaturePath(order) {
  return `deliveries/${deliveryIdForOrder(order)}/signature.png`;
}

function normaliseDeliveryStopAddress(address = "") {
  return String(address || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function deliveryStopKeyForOrder(order) {
  const account = order?.clientId || order?.accountId || order?.account_actor_id || order?.clientName || "account-not-recorded";
  return `${account}|${normaliseDeliveryStopAddress(order?.dropAddress || order?.deliveryAddress || "")}`;
}

function deliveryStopIdForOrders(orders = []) {
  const first = orders[0] || {};
  const key = first.deliveryStopKey || deliveryStopKeyForOrder(first);
  const runRef = first.runId || first.actualRunDate || first.date || "run-not-recorded";
  return stableLocalDeliveryId(`SOP-DEL-01|${key}|${runRef}`);
}

function deliveryStopOrders(stop) {
  return Array.isArray(stop?.orders) ? stop.orders : stop ? [stop] : [];
}

function deliveryStopTotal(stop) {
  return deliveryStopOrders(stop).reduce((sum, order) => sum + Number(order.pickupCalculatedPrice || order.price || 0), 0);
}

function deliveryStopLabel(stop) {
  const orders = deliveryStopOrders(stop);
  const first = orders[0] || {};
  if (orders.length > 1) return `${first.clientName || "Delivery stop"} (${orders.length} orders)`;
  return `${first.id || "Delivery stop"} - ${first.clientName || "Customer"}`;
}

function groupDeliveryStops(orders = []) {
  const groups = orders.reduce((acc, order) => {
    const key = order.deliveryStopKey || deliveryStopKeyForOrder(order);
    if (!acc[key]) {
      acc[key] = {
        key,
        deliveryId: order.deliveryGroupId || order.deliveryId || "",
        clientId: order.clientId,
        clientName: order.clientName,
        dropAddress: order.dropAddress,
        deliveryZone: order.deliveryZone || deliveryZone(order.dropAddress),
        runSequence: Number(order.runSequence || 9999),
        orders: [],
      };
    }
    acc[key].orders.push(order);
    acc[key].runSequence = Math.min(Number(acc[key].runSequence || 9999), Number(order.runSequence || 9999));
    acc[key].deliveryId = acc[key].deliveryId || order.deliveryGroupId || order.deliveryId || "";
    return acc;
  }, {});

  return Object.values(groups)
    .map(group => ({
      ...group,
      deliveryId: group.deliveryId || deliveryStopIdForOrders(group.orders),
      vendors: [...new Set(group.orders.map(order => order.vendor).filter(Boolean))],
      runDates: [...new Set(group.orders.map(order => order.actualRunDate || order.date).filter(Boolean))],
      runIds: [...new Set(group.orders.map(order => order.runId).filter(Boolean))],
      pickedUpAt: group.orders.map(order => order.pickupConfirmedAt).filter(Boolean).sort()[0] || "",
      status: group.orders.every(order => order.status === "En Route") ? "En Route" : "Pending",
    }))
    .sort((a, b) => Number(a.runSequence || 9999) - Number(b.runSequence || 9999) || String(a.clientName || "").localeCompare(String(b.clientName || "")));
}

function proofStorageLabel(proof) {
  if (proof?.signaturePath) return `delivery-proof/${proof.signaturePath}`;
  return proof?.storage || "Supabase private bucket path not recorded locally";
}

function normaliseDeliveryProof(proof, orders = []) {
  const groupOrderIds = Array.isArray(proof.groupOrderIds) ? proof.groupOrderIds.filter(Boolean) : [];
  const order = orders.find(item => item.id === proof.orderId || groupOrderIds.includes(item.id) || item.proofId === proof.id || item.deliveryId === proof.deliveryId);
  const deliveryId = proof.deliveryId || (order ? deliveryIdForOrder(order) : stableLocalDeliveryId(proof.orderId || proof.id));
  const signaturePath = proof.signaturePath || `deliveries/${deliveryId}/signature.png`;
  return {
    ...proof,
    deliveryId,
    deliveryStopKey: proof.deliveryStopKey || (order ? deliveryStopKeyForOrder(order) : ""),
    groupOrderIds,
    deliveryGroupSize: Number(proof.deliveryGroupSize || groupOrderIds.length || 1),
    signaturePath,
    storage: `delivery-proof/${signaturePath}`,
    bucketPrivate: true,
    retentionUntil: proof.retentionUntil || addYears(isoDate(proof.deliveredAt || proof.capturedAt), 7),
  };
}

function invoiceIsApproved(invoice) {
  return Boolean(invoice?.invoiceApprovedAt || invoice?.invoiceApprovalStatus === "Approved");
}

function normaliseInvoice(invoice) {
  if (!invoice) return invoice;
  const issued = Boolean(invoice.sentAt || invoice.dispatchRecordedAt || ["Sent", "Overdue", "Paid"].includes(invoice.status));
  const approvedAt = invoice.invoiceApprovedAt || (issued ? invoice.sentAt || invoice.dispatchRecordedAt || invoice.createdAt : "");
  const dispatchRecordedAt = invoice.dispatchRecordedAt || (issued && invoice.sentAt ? invoice.sentAt : "");
  return {
    ...invoice,
    billingGroupApprovedAt: invoice.billingGroupApprovedAt || invoice.createdAt || "",
    billingGroupApprovedBy: invoice.billingGroupApprovedBy || (invoice.createdAt ? "admin" : ""),
    billingGroupApprovalSource: invoice.billingGroupApprovalSource || "SOP-BIL-04 approved billing group",
    invoiceApprovalStatus: invoice.invoiceApprovalStatus || (approvedAt ? "Approved" : "Pending Review"),
    invoiceApprovedAt: approvedAt,
    invoiceApprovedBy: invoice.invoiceApprovedBy || (approvedAt ? "admin" : ""),
    invoiceApprovalSource: invoice.invoiceApprovalSource || (approvedAt ? "SOP-BIL-04 rendered invoice review" : ""),
    invoiceApprovalNote: invoice.invoiceApprovalNote || (approvedAt ? "Legacy local invoice treated as rendered and reviewed before dispatch." : ""),
    dispatchChannel: invoice.dispatchChannel || (dispatchRecordedAt ? "local_record_only" : undefined),
    dispatchRecipient: invoice.dispatchRecipient || (dispatchRecordedAt ? invoice.billingEmail : undefined),
    dispatchExternalStatus: invoice.dispatchExternalStatus || (dispatchRecordedAt ? "provider_not_configured" : undefined),
    dispatchNote: invoice.dispatchNote || (dispatchRecordedAt ? "Legacy local dispatch evidence retained for local continuity." : undefined),
    dispatchRecordedAt,
    dispatchRecordedBy: invoice.dispatchRecordedBy || (dispatchRecordedAt ? "admin" : undefined),
  };
}

function invoiceFinancialPeriod(invoice) {
  return isoDate(invoice?.createdAt || invoice?.sentAt || invoice?.dispatchRecordedAt || invoice?.invoiceDate || invoice?.date || todayBrisbane()).slice(0, 7);
}

function periodMonthEnd(period) {
  const [year, month] = String(period || todayBrisbane().slice(0, 7)).split("-").map(Number);
  const d = new Date(Date.UTC(year, month, 0));
  return d.toISOString().slice(0, 10);
}

function financialReconciliationDueDate(period) {
  return addBusinessDays(periodMonthEnd(period), 5);
}

function financialReconciliationRetentionUntil(record) {
  return addYears(isoDate(record?.completedAt || record?.recordedAt || record?.createdAt), 7);
}

function normaliseFinancialReconciliation(record = {}) {
  const period = record.period || todayBrisbane().slice(0, 7);
  const completedAt = record.completedAt || record.recordedAt || "";
  return {
    ...record,
    period,
    monthEndDate: record.monthEndDate || periodMonthEnd(period),
    dueDate: record.dueDate || financialReconciliationDueDate(period),
    status: record.status || (completedAt ? "Completed" : "Open"),
    completedAt,
    completedBy: record.completedBy || (completedAt ? "admin" : ""),
    sourceRef: record.sourceRef || POLICY24_REVENUE_SOURCE,
    externalAccountantName: record.externalAccountantName || "",
    portfolioReportStatus: record.portfolioReportStatus || "Blocked - Otimi Rules cadence/format unconfirmed",
    noOffSystemRevenueConfirmed: Boolean(record.noOffSystemRevenueConfirmed),
    retentionUntil: record.retentionUntil || (completedAt ? financialReconciliationRetentionUntil({ ...record, completedAt }) : ""),
  };
}

function financialReconciliationRows(invoices = [], records = [], today = todayBrisbane()) {
  const recordByPeriod = new Map(
    (records || []).map(normaliseFinancialReconciliation).map(record => [record.period, record])
  );
  const grouped = (invoices || []).reduce((map, invoice) => {
    const period = invoiceFinancialPeriod(invoice);
    if (!map.has(period)) map.set(period, []);
    map.get(period).push(invoice);
    return map;
  }, new Map());
  for (const record of recordByPeriod.values()) {
    if (!grouped.has(record.period)) grouped.set(record.period, []);
  }
  return Array.from(grouped.entries())
    .map(([period, periodInvoices]) => {
      const record = recordByPeriod.get(period) || null;
      const monthEndDate = periodMonthEnd(period);
      const dueDate = financialReconciliationDueDate(period);
      const subtotal = periodInvoices.reduce((sum, invoice) => sum + Number(invoice.subtotal || 0), 0);
      const gst = periodInvoices.reduce((sum, invoice) => sum + Number(invoice.gst || 0), 0);
      const total = periodInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
      const paidInvoices = periodInvoices.filter(invoice => invoice.status === "Paid");
      const paymentRecords = periodInvoices.filter(invoice => invoice.paymentEvidence || invoice.paymentRecordedAt || invoice.paidAt);
      const paidTotal = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
      const overdueInvoices = periodInvoices.filter(invoice => invoice.status === "Overdue");
      const openInvoices = periodInvoices.filter(invoice => invoice.status !== "Paid");
      const status = record?.completedAt ? "Completed" : (today > dueDate ? "Overdue" : "Open");
      const reasons = [];
      if (status === "Overdue") reasons.push(`Month-end reconciliation was due ${fmtFullDate(dueDate)}`);
      if (periodInvoices.length === 0) reasons.push("No invoice records in period");
      if (periodInvoices.some(invoice => !invoiceIsApproved(invoice))) reasons.push("Rendered invoice approval evidence missing");
      if (periodInvoices.some(invoice => ["Sent", "Overdue", "Paid"].includes(invoice.status) && !invoice.dispatchRecordedAt)) reasons.push("Dispatch evidence missing for issued invoice");
      if (paidInvoices.some(invoice => !invoice.paymentEvidence)) reasons.push("Paid invoice missing payment evidence");
      if (!record) reasons.push("Policy #24 reconciliation record not completed");
      if (record && !record.externalAccountantName) reasons.push("External accountant not named");
      if (record && String(record.portfolioReportStatus || "").toLowerCase().includes("blocked")) reasons.push("Otimi Rules reporting cadence/format unconfirmed");
      return {
        period,
        monthEndDate,
        dueDate,
        invoices: periodInvoices,
        invoiceCount: periodInvoices.length,
        subtotal,
        gst,
        total,
        paidInvoices,
        paymentRecords,
        paidTotal,
        unpaidTotal: total - paidTotal,
        overdueInvoices,
        openInvoices,
        record,
        status,
        reasons,
      };
    })
    .sort((a, b) => b.period.localeCompare(a.period));
}

function auditHashPayload(event) {
  return [
    event.sequence,
    event.id,
    event.at,
    event.actor,
    event.action,
    event.detail,
    event.piiAction ? "pii" : "non-pii",
    event.protectedObject,
    event.previousHash,
  ].map(value => String(value ?? "")).join("|");
}

function auditEventHash(event) {
  return localAuditHash(auditHashPayload(event));
}

function buildAuditEvent(base, previous) {
  const event = {
    ...base,
    sequence: Number(base.sequence || (previous?.sequence || 0) + 1),
    piiAction: base.piiAction ?? true,
    protectedObject: base.protectedObject || auditProtectedObject(base.action),
    previousHash: base.previousHash || previous?.eventHash || AUDIT_GENESIS_HASH,
    hashAlgorithm: base.hashAlgorithm || AUDIT_HASH_ALGORITHM,
  };
  return { ...event, eventHash: base.eventHash || auditEventHash(event) };
}

function normaliseAuditTrail(events) {
  return (events || []).reduce((rows, raw, index) => {
    const previous = rows[index - 1];
    rows.push(buildAuditEvent({
      ...raw,
      sequence: raw.sequence || index + 1,
      previousHash: raw.previousHash || previous?.eventHash || AUDIT_GENESIS_HASH,
      piiAction: raw.piiAction ?? true,
      protectedObject: raw.protectedObject || auditProtectedObject(raw.action),
    }, previous));
    return rows;
  }, []);
}

function loadAuditTrail() {
  const loaded = load(KEY_AUDIT, []);
  const normalised = normaliseAuditTrail(loaded);
  if (JSON.stringify(loaded) !== JSON.stringify(normalised)) save(KEY_AUDIT, normalised);
  return normalised;
}

function verifyAuditTrail(events) {
  let previousHash = AUDIT_GENESIS_HASH;
  const rows = (events || []).map((event, index) => {
    const expected = auditEventHash(event);
    const sequenceOk = Number(event.sequence) === index + 1;
    const previousOk = event.previousHash === previousHash;
    const hashOk = event.eventHash === expected;
    previousHash = event.eventHash || "";
    return { id: event.id, sequenceOk, previousOk, hashOk, valid: sequenceOk && previousOk && hashOk };
  });
  return { checked: rows.length, valid: rows.every(row => row.valid), rows };
}

function uid() { return "MC-" + Math.floor(Math.random() * 90000 + 10000); }
function fmt(d) { return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" }); }
function fmtFullDate(d) { return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); }
function isoNow() { return new Date().toISOString(); }
function localOtpCode() {
  return String(Math.floor(Math.random() * 900000) + 100000);
}
function localLoginKey(role, email) {
  return `${role}:${String(email || "").trim().toLowerCase()}`;
}
function localOtpExpiryLabel(expiresAt) {
  return new Date(expiresAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}
function todayBrisbane() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = type => parts.find(p => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
function brisbaneMinutes() {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Brisbane", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  return Number(parts.find(p => p.type === "hour")?.value || 0) * 60 + Number(parts.find(p => p.type === "minute")?.value || 0);
}
function addDays(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function driverAvailabilityBlockingStatus(status) {
  return DRIVER_AVAILABILITY_BLOCKING_STATUSES.includes(status);
}
function driverAvailabilityNoticeDueDate(availabilityDate) {
  return availabilityDate ? addDays(availabilityDate, -1) : "";
}
function normaliseDriverAvailabilityRecord(record = {}) {
  const availabilityDate = optionalIsoDate(record.availabilityDate);
  const noticeReceivedDate = optionalIsoDate(record.noticeReceivedDate);
  const noticeDueDate = optionalIsoDate(record.noticeDueDate) || driverAvailabilityNoticeDueDate(availabilityDate);
  const blocking = driverAvailabilityBlockingStatus(record.status);
  const lateNotice = Boolean(record.lateNotice ?? (blocking && noticeReceivedDate && noticeDueDate && noticeReceivedDate > noticeDueDate));
  return {
    ...record,
    availabilityDate,
    noticeReceivedDate,
    noticeDueDate,
    lateNotice,
    contingencyPlan: String(record.contingencyPlan || "").trim(),
    sourceRef: record.sourceRef || POLICY22_DRIVER_SCHEDULING_SOURCE,
  };
}
function driverAvailabilityDetail(record) {
  const resolved = normaliseDriverAvailabilityRecord(record);
  const parts = [];
  if (resolved.noticeReceivedDate) parts.push(`notice received ${fmtFullDate(resolved.noticeReceivedDate)}`);
  if (resolved.noticeDueDate) parts.push(`due ${fmtFullDate(resolved.noticeDueDate)}`);
  if (resolved.lateNotice) parts.push("late notice");
  if (resolved.contingencyPlan) parts.push(`contingency: ${resolved.contingencyPlan}`);
  return parts.join("; ");
}
function addBusinessDays(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    const weekday = d.getUTCDay();
    if (weekday !== 0 && weekday !== 6) added += 1;
  }
  return d.toISOString().slice(0, 10);
}
function daysBetween(startDate, endDate) {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  return Math.floor((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86400000);
}
const POLICY18_DISPUTE_REASONS = [
  { value: "goods_not_received", label: "Goods not received" },
  { value: "wrong_goods", label: "Wrong goods" },
  { value: "goods_damaged", label: "Goods damaged" },
  { value: "incorrect_charge", label: "Incorrect charge" },
  { value: "other", label: "Other" },
];
function policy18ReasonLabel(value) {
  return POLICY18_DISPUTE_REASONS.find(reason => reason.value === value)?.label || value || "Not recorded";
}
function policy18InvoiceDate(invoice) {
  const value = invoice?.createdAt || invoice?.sentAt || invoice?.dispatchRecordedAt || invoice?.invoiceDate || invoice?.date || "";
  return value ? isoDate(value) : "";
}
function policy18InvoiceForOrder(order, invoices = []) {
  if (!order) return null;
  return invoices.find(invoice =>
    invoice.id === order.invoiceId ||
    (invoice.lines || []).some(line =>
      line.orderId === order.id ||
      (line.proofId && (line.proofId === order.proofId || line.proofId === order.deliveryProofId))
    )
  ) || null;
}
function policy18BillingLineDate(invoice, orders = [], orderId = "") {
  const line = (invoice?.lines || []).find(item => item.orderId === orderId) || (invoice?.lines || [])[0];
  const linkedOrder = (orders || []).find(order => order.id === line?.orderId);
  return isoDate(linkedOrder?.deliveredAt || linkedOrder?.failedDeliveryAt || linkedOrder?.actualRunDate || linkedOrder?.date || line?.deliveryDate || "");
}
function policy18DisputeWindowForInvoice(invoice, receivedDate = todayBrisbane()) {
  const invoiceDate = policy18InvoiceDate(invoice);
  if (!invoiceDate) {
    return {
      invoiceDate: "",
      daysSinceInvoice: null,
      timingStatus: "invoice_date_missing",
      timingLabel: "Invoice date unavailable - Admin timing review required",
      within14: false,
      after30: false,
    };
  }
  const daysSinceInvoice = daysBetween(invoiceDate, receivedDate);
  const within14 = daysSinceInvoice <= 14;
  const after30 = daysSinceInvoice > 30;
  const timingStatus = within14 ? "within_14_days" : after30 ? "over_30_days" : "outside_14_days";
  const timingLabel = within14
    ? `Within Policy #18 14-day dispute window (${daysSinceInvoice} day${daysSinceInvoice === 1 ? "" : "s"} from invoice)`
    : after30
      ? `Raised ${daysSinceInvoice} days after invoice; Policy #18 says disputes over 30 days may not be actionable`
      : `Raised ${daysSinceInvoice} days after invoice; outside the preferred 14-day dispute window`;
  return { invoiceDate, daysSinceInvoice, timingStatus, timingLabel, within14, after30 };
}
function policy18DisputeWindowForOrder(order, invoices = [], receivedDate = todayBrisbane()) {
  return policy18DisputeWindowForInvoice(policy18InvoiceForOrder(order, invoices), receivedDate);
}
function normalisePolicy18Dispute(input, defaults = {}) {
  const raw = typeof input === "string" ? { note: input } : (input || {});
  const reason = raw.reason || defaults.reason || "";
  return {
    reason,
    reasonLabel: policy18ReasonLabel(reason),
    orderId: raw.orderId || defaults.orderId || "",
    deliveryDate: raw.deliveryDate || defaults.deliveryDate || "",
    note: String(raw.note || defaults.note || "").trim(),
  };
}
function isPolicy18Dispute(exception) {
  return ["Delivery Dispute", "Billing Dispute"].includes(exception?.type);
}
const POLICY18_DELIVERY_FINDINGS = [
  { value: "proof_confirms_completed", label: "Proof confirms delivery completed", remedyType: "none" },
  { value: "delivery_error_no_cost_remedy", label: "Delivery error confirmed - no-cost remedy required", remedyType: "no_cost_delivery_remedy" },
  { value: "not_actionable", label: "Not actionable under Policy #18 timing", remedyType: "none" },
  { value: "other_resolution", label: "Other resolution recorded", remedyType: "none" },
];
const POLICY18_BILLING_FINDINGS = [
  { value: "no_billing_error", label: "No billing error confirmed", remedyType: "none" },
  { value: "billing_error_credit_note", label: "Billing error confirmed - credit note required", remedyType: "credit_note" },
  { value: "billing_error_corrected_invoice", label: "Billing error confirmed - corrected invoice required", remedyType: "corrected_invoice" },
  { value: "not_actionable", label: "Not actionable under Policy #18 timing", remedyType: "none" },
  { value: "other_resolution", label: "Other resolution recorded", remedyType: "none" },
];
function policy18FindingOptions(exception) {
  return exception?.type === "Billing Dispute" ? POLICY18_BILLING_FINDINGS : POLICY18_DELIVERY_FINDINGS;
}
function policy18FindingForValue(exception, value) {
  return policy18FindingOptions(exception).find(item => item.value === value) || policy18FindingOptions(exception)[0];
}
function defaultPolicy18Finding(exception) {
  return policy18FindingOptions(exception)[0]?.value || "other_resolution";
}
function policy18RemedyForFinding(exception, findingValue, investigatedAt = isoNow()) {
  const finding = policy18FindingForValue(exception, findingValue);
  if (!finding || finding.remedyType === "none") {
    return { remedyRequired: false, remedyType: "none", remedyLabel: "No remedy required", remedyDueDate: "", remedyStatus: "Not Required" };
  }
  if (finding.remedyType === "credit_note" || finding.remedyType === "corrected_invoice") {
    return {
      remedyRequired: true,
      remedyType: finding.remedyType,
      remedyLabel: finding.remedyType === "credit_note" ? "Credit note required" : "Corrected invoice required",
      remedyDueDate: addBusinessDays(isoDate(investigatedAt), 5),
      remedyStatus: "Pending Accounting Handoff",
    };
  }
  return {
    remedyRequired: true,
    remedyType: finding.remedyType,
    remedyLabel: "No-cost delivery remedy required",
    remedyDueDate: "",
    remedyStatus: "Required",
  };
}
function policy18StatusLine(exception) {
  if (!isPolicy18Dispute(exception)) return "";
  const received = exception.raisedAt ? `Received ${fmtFullDate(isoDate(exception.raisedAt))}` : "Received date not recorded";
  const acknowledged = exception.acknowledgedAt ? `Acknowledged ${fmtFullDate(isoDate(exception.acknowledgedAt))}` : "Acknowledgement not recorded";
  return `${received}; ${acknowledged}; response monitoring outside this portal`;
}
function policy18RemedyLine(record) {
  if (!record?.policy18RemedyRequired) return "";
  const due = record.policy18RemedyDueDate ? ` Due ${fmtFullDate(record.policy18RemedyDueDate)}.` : "";
  const note = record.policy18RemedyNote ? ` ${record.policy18RemedyNote}` : "";
  return `${record.policy18RemedyLabel || "Policy #18 remedy required"} - ${record.policy18RemedyStatus || "Required"}.${due}${note}`;
}
function day8NoticeDueDate(invoice) {
  return addDays(invoice.dueDate, 8);
}
function isDay8NoticeDue(invoice, today = todayBrisbane()) {
  return invoice?.status === "Overdue" && today >= day8NoticeDueDate(invoice);
}
function pickupAlreadyCollected(order) {
  return ["Picked Up", "Brought Forward"].includes(order?.pickupOutcome);
}
function orderGoodsCollected(order) {
  return Boolean(
    pickupAlreadyCollected(order) ||
    order?.pickupConfirmedAt ||
    order?.proofId ||
    ["Brought Forward", "En Route", "Delivered", "Failed Delivery"].includes(order?.status)
  );
}
function cancellationCutoffDate(order) {
  return addDays(order?.actualRunDate || order?.date || order?.requestedDate || todayBrisbane(), -1);
}
function beforeCancellationCutoff(order) {
  const cutoffDate = cancellationCutoffDate(order);
  const today = todayBrisbane();
  if (today < cutoffDate) return true;
  if (today > cutoffDate) return false;
  return brisbaneMinutes() < 12 * 60 + 30;
}
function cancellationState(order) {
  if (!order) return { canSelfCancel: false, canRequestAdminReview: false, reason: "Order not selected" };
  if (order.status === "Cancelled") return { canSelfCancel: false, canRequestAdminReview: false, reason: "Already cancelled" };
  if (orderGoodsCollected(order)) {
    return {
      canSelfCancel: false,
      canRequestAdminReview: false,
      reason: "Goods collected - Policy #14 says the delivery proceeds and refusal is handled as Failed Delivery",
    };
  }
  const beforeCutoff = beforeCancellationCutoff(order);
  return {
    canSelfCancel: beforeCutoff,
    canRequestAdminReview: !beforeCutoff,
    reason: beforeCutoff
      ? "Client self-service cancellation is open before the Policy #14 cut-off"
      : "After cut-off: Admin review required before cancellation",
  };
}
function addYears(date, years) {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}
function isoDate(value) {
  if (!value) return todayBrisbane();
  return String(value).slice(0, 10);
}
function optionalIsoDate(value) {
  return value ? String(value).slice(0, 10) : "";
}
function isPoBoxAddress(address) {
  return /(^|[^a-z])(p\.?\s*o\.?|post\s+office)\s*box([^a-z]|$)/i.test(String(address || ""));
}
function physicalAddressStatus(address) {
  const text = String(address || "").trim();
  if (!text) return { ok: false, reason: "Delivery address required" };
  if (isPoBoxAddress(text)) return { ok: false, reason: "PO boxes are not accepted for delivery addresses" };
  return { ok: true, reason: "Physical address recorded" };
}
function contactEligibilityStatus(client) {
  const op = client?.operationalContact || {};
  const billing = client?.billingContact || {};
  const ok = Boolean(
    String(op.name || client?.name || "").trim() &&
    String(op.email || client?.email || "").trim() &&
    String(billing.name || "").trim() &&
    String(billing.email || "").trim()
  );
  return { ok, reason: ok ? "Operational and Billing contacts recorded" : "Operational and Billing contacts must both have names and emails" };
}
function supplierEligibilityStatus(client) {
  const ok = (client?.vendors || []).length > 0;
  return { ok, reason: ok ? "Approved supplier linked" : "At least one approved supplier is required" };
}
function proofRetentionUntil(proof) {
  return proof.retentionUntil || addYears(isoDate(proof.deliveredAt || proof.capturedAt), 7);
}
function pickupRequestRetentionUntil(order) {
  return addYears(isoDate(order.actualRunDate || order.date || order.requestedDate), 7);
}
function supplierRelationshipClosed(supplier) {
  return ["Archived", "Closed"].includes(String(supplier?.status || ""));
}
function supplierRelationshipEndDate(supplier) {
  return isoDate(supplier?.archivedAt || supplier?.closedAt || supplier?.lastEngagementDate || supplier?.updatedAt || supplier?.lastReviewed);
}
function supplierRetentionUntil(supplier) {
  if (!supplierRelationshipClosed(supplier)) return "";
  return addYears(supplierRelationshipEndDate(supplier), 7);
}
function masterDataChangeRetentionUntil(change) {
  return addYears(isoDate(change?.changedAt || change?.loggedAt || change?.createdAt), 7);
}
const LEGACY_HCM_DRIVER_TEXT = /SOP-JDD|APP-ADM-006|Policy #12|Policy #13|Policy #19|Policy #25|Policy #26|HCM|onboarding|classification|agreement/i;
function normaliseDriverDirectoryStatus(status) {
  const text = String(status || "").toLowerCase();
  return ["inactive", "archived", "terminated"].includes(text) ? "Inactive" : "Active";
}
function normaliseDriverRecord(driver = {}) {
  const rawNotes = driver.notes || "";
  return {
    ...driver,
    name: driver.name || "",
    email: driver.email || "",
    phone: driver.phone || "",
    status: normaliseDriverDirectoryStatus(driver.status || driver.onboardingStatus || driver.onboarding_status),
    lastReviewed: optionalIsoDate(driver.lastReviewed || driver.last_reviewed),
    notes: LEGACY_HCM_DRIVER_TEXT.test(rawNotes) ? "Local logistics driver account for dispatch and availability." : rawNotes,
  };
}
function driverRecordBadgeClass(driver = {}) {
  return normaliseDriverRecord(driver).status === "Active" ? "b-done" : "b-pending";
}
function activeDriverRecords(drivers = []) {
  return (drivers || [])
    .map(normaliseDriverRecord)
    .filter(driver => !["inactive", "archived", "terminated"].includes(String(driver.status || "").toLowerCase()));
}
function runIdFor(runDate, driverId, vehicleName) {
  const vehicle = (vehicleName || "vehicle").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toUpperCase();
  return `RUN-${runDate}-${driverId}-${vehicle}`;
}
function deliveryZone(address = "") {
  const text = String(address || "").trim();
  const qldMatch = text.match(/,\s*([^,]+?)\s+QLD\b/i) || text.match(/\b([A-Za-z][A-Za-z\s'-]+?)\s+QLD\b/i);
  if (qldMatch?.[1]) return qldMatch[1].replace(/\s+\d+$/, "").trim();
  const parts = text.split(",").map(part => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : (parts[0] || "Geography not recorded");
}
function vehicleLabel(vehicle) {
  if (!vehicle) return "";
  return vehicle.registrationPlate || vehicle.vehicleName || vehicle.id || "";
}
function activeVehicles(vehicles = []) {
  return vehicles.filter(vehicle => (vehicle.status || "Active") === "Active");
}
function vehicleComplianceState(vehicle, runDate = todayBrisbane()) {
  if (!vehicle) return { ready: false, reason: "Named vehicle record required", warnings: [] };
  const warnings = [];
  const status = vehicle.status || "Active";
  if (status !== "Active") return { ready: false, reason: `Vehicle status is ${status}`, warnings };
  if (!vehicle.registrationExpiry) return { ready: false, reason: "Registration expiry not recorded", warnings };
  if (!vehicle.insuranceExpiry) return { ready: false, reason: "Insurance expiry not recorded", warnings };
  if (vehicle.registrationExpiry < runDate) return { ready: false, reason: `Registration expired ${fmtFullDate(vehicle.registrationExpiry)}`, warnings };
  if (vehicle.insuranceExpiry < runDate) return { ready: false, reason: `Insurance expired ${fmtFullDate(vehicle.insuranceExpiry)}`, warnings };
  if ((vehicle.defectStatus || "Clear") === "Open Defect") return { ready: false, reason: "Open defect recorded", warnings };
  if (vehicle.nextServiceDue && vehicle.nextServiceDue < runDate) warnings.push(`Service due ${fmtFullDate(vehicle.nextServiceDue)}`);
  return { ready: true, reason: "Registration and insurance current from vehicle register", warnings };
}
function normaliseOrderVehicleEvidence(orders = [], vehicles = []) {
  return (orders || []).map(order => {
    if (!order?.vehicleName || (order.vehicleId && order.vehicleRegistrationCurrent && order.vehicleInsuranceCurrent)) return order;
    const vehicle = vehicles.find(item => item.id === order.vehicleId || vehicleLabel(item) === order.vehicleName || item.vehicleName === order.vehicleName);
    const runDate = order.actualRunDate || order.runDate || order.date || todayBrisbane();
    const compliance = vehicleComplianceState(vehicle, runDate);
    if (!vehicle || !compliance.ready) return order;
    return {
      ...order,
      vehicleId: vehicle.id,
      vehicleName: vehicleLabel(vehicle),
      vehicleRegistrationCurrent: true,
      vehicleInsuranceCurrent: true,
      vehicleRegistrationExpiry: vehicle.registrationExpiry,
      vehicleInsuranceExpiry: vehicle.insuranceExpiry,
      vehicleComplianceCheckedAt: order.vehicleComplianceCheckedAt || isoNow(),
      vehicleComplianceCheckedBy: order.vehicleComplianceCheckedBy || "Admin",
      vehicleComplianceSource: order.vehicleComplianceSource || "vehicle_register_local",
      vehicleComplianceNote: order.vehicleComplianceNote || vehicle.notes || "Vehicle register APP-FLT-001 local check",
    };
  });
}
function sequenceRunOrders(orders = []) {
  return [...orders].sort((a, b) => {
    const supplierCompare = String(a.vendor || "").localeCompare(String(b.vendor || ""));
    if (supplierCompare) return supplierCompare;
    const zoneCompare = deliveryZone(a.dropAddress).localeCompare(deliveryZone(b.dropAddress));
    if (zoneCompare) return zoneCompare;
    const clientCompare = String(a.clientName || "").localeCompare(String(b.clientName || ""));
    if (clientCompare) return clientCompare;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}
function runPlanningCompileDueDate(runDate) {
  return addDays(runDate, -1);
}
function runPlanningMonitorRows(orders = [], exceptions = [], today = todayBrisbane()) {
  const runDates = [...new Set(
    (orders || [])
      .filter(order => !["Cancelled"].includes(order.status))
      .map(order => order.actualRunDate || order.date || order.requestedDate)
      .filter(Boolean)
  )].sort();
  return runDates.map(runDate => {
    const runOrders = (orders || []).filter(order => (order.actualRunDate || order.date || order.requestedDate) === runDate && order.status !== "Cancelled");
    const dispatchableOrders = runOrders.filter(order => !["Delivered"].includes(order.status));
    const unassignedOrders = dispatchableOrders.filter(order => ["Pending", "Brought Forward"].includes(order.status) && !order.driverId);
    const assignedOrders = dispatchableOrders.filter(order => order.driverId || order.vehicleName || order.runId);
    const namedAssignmentOrders = assignedOrders.filter(order => order.driverId && order.vehicleName && order.runId);
    const fleetPassOrders = namedAssignmentOrders.filter(order => order.vehicleRegistrationCurrent && order.vehicleInsuranceCurrent);
    const adminInterventionOrders = dispatchableOrders.filter(order => order.dispatchMode === "manual_single_stop_assignment" || order.dispatchMode === "local_run_compiler" || order.runCompiledBy === "Admin");
    const compileDueDate = runPlanningCompileDueDate(runDate);
    const openException = (exceptions || []).find(exception => exception.type === "Run Planning Exception" && exception.orderId === runDate && exception.status !== "Closed");
    const reasons = [];
    if (today > compileDueDate && unassignedOrders.length > 0) reasons.push(`Night-before compilation overdue for ${unassignedOrders.length} unassigned stop(s)`);
    if (assignedOrders.length > 0 && namedAssignmentOrders.length < assignedOrders.length) reasons.push("Named driver, named vehicle, or run ID missing on assigned stop(s)");
    if (namedAssignmentOrders.length > 0 && fleetPassOrders.length < namedAssignmentOrders.length) reasons.push("Fleet compliance evidence missing on assigned stop(s)");
    if (dispatchableOrders.length === 0) reasons.push("No dispatchable stops for this run date");
    return {
      runDate,
      compileDueDate,
      totalStops: dispatchableOrders.length,
      unassignedOrders,
      assignedOrders,
      namedAssignmentOrders,
      fleetPassOrders,
      adminInterventionOrders,
      openException,
      reasons,
      compileComplete: dispatchableOrders.length > 0 && unassignedOrders.length === 0,
      overdue: today > compileDueDate && unassignedOrders.length > 0,
    };
  });
}
function rateLabel(numerator, denominator) {
  if (!denominator) return "N/A";
  return `${Math.round((numerator / denominator) * 100)}%`;
}
function applyCutoff(requestedDate) {
  const today = todayBrisbane();
  const schedule = resolveActualRunDate(requestedDate);
  const afterCutoff = requestedDate === today && brisbaneMinutes() >= (12 * 60 + 30);
  const requestedIsPast = requestedDate < today;
  const scheduleAdjustmentReason = requestedIsPast
    ? "requested_date_past"
    : afterCutoff
      ? "after_cutoff"
      : schedule.scheduleAdjusted
        ? "non_run_day"
        : "none";
  return {
    cutoffApplied: schedule.cutOffApplied,
    scheduleAdjusted: schedule.scheduleAdjusted,
    actualRunDate: schedule.actualRunDate,
    scheduleAdjustmentReason,
  };
}
function activeSuppliers(suppliers) { return suppliers.filter(s => (s.status || "Active") === "Active"); }
function supplierApprovalGateReasons(supplier) {
  const status = supplier?.status || "Active";
  if (status !== "Active") return [];
  const missing = [];
  if (!supplier?.dockAccessAgreed) missing.push("dock access agreement missing");
  if (!supplier?.packagingStandardsAgreed) missing.push("packaging standards agreement missing");
  if (!supplier?.pickupWindowAgreed) missing.push("pickup window agreement missing");
  if (!String(supplier?.supplierApprovalEvidenceRef || "").trim()) missing.push("written approval evidence missing");
  return missing;
}
function supplierApprovalGateState(supplier) {
  const reasons = supplierApprovalGateReasons(supplier);
  return {
    approved: reasons.length === 0,
    reasons,
    source: SUPPLIER_APPROVAL_SOURCE,
  };
}
const POLICY16_NO_PICKUP_CATEGORIES = [
  ["not_ready_after_grace", "Goods not ready after 10-minute grace"],
  ["unlabelled", "Unlabelled or con-note mismatch"],
  ["improper_packaging", "Improper packaging"],
  ["supplier_refused", "Supplier refused pickup"],
  ["wrong_items", "Wrong items presented"],
  ["time_constraint", "Time constraint"],
  ["whs_hazard", "WHS hazard at supplier premises"],
];
function noPickupCategoryLabel(category) {
  return POLICY16_NO_PICKUP_CATEGORIES.find(([value]) => value === category)?.[1] || "No Pickup";
}
const SOP_DEL04_FAILED_DELIVERY_CATEGORIES = [
  ["receiver_absent", "Receiver absent"],
  ["address_wrong_or_unconfirmed", "Address wrong or cannot be confirmed"],
  ["goods_not_confirmed_for_account", "Goods cannot be confirmed for this client"],
  ["delivery_refused", "Receiver refused goods"],
  ["receiver_name_refused", "Receiver declined to provide name"],
  ["receiver_signature_refused", "Receiver refused to sign"],
  ["price_discrepancy", "Price appears incorrect"],
];
function failedDeliveryCategoryLabel(category) {
  return SOP_DEL04_FAILED_DELIVERY_CATEGORIES.find(([value]) => value === category)?.[1] || "Failed Delivery";
}
function receiverNameLooksGeneric(name = "") {
  const text = String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!text) return true;
  return ["receiver", "customer", "client", "workshop", "staff", "n/a", "na", "unknown", "signature", "person"].includes(text);
}
function goodsAcceptanceStandardForRule(rule) {
  const label = String(rule?.label || "").toLowerCase();
  const itemType = String(rule?.itemType || "").toLowerCase();
  if (itemType === "tyre" || label.includes("tyre")) return "Tyres upright or stacked, secured, not loose, not flat or rolling freely";
  if (label.includes("battery") || label.includes("batteries")) return "Batteries in correct hazardous-goods containment";
  if (itemType === "parts" || label.includes("parts") || label.includes("accessories")) return "Parts/accessories boxed or bagged, labelled, and contained together";
  return "Goods labelled, packaged for item type, safe to transport, and not loose";
}
function supplierReviewIntervalDays(supplier) {
  const days = Number(supplier?.reviewIntervalDays || 0);
  return Number.isFinite(days) && days > 0 ? Math.floor(days) : 0;
}
function supplierReviewDueDate(supplier) {
  const days = supplierReviewIntervalDays(supplier);
  if (!supplier?.lastReviewed || !days) return "";
  return addDays(isoDate(supplier.lastReviewed), days);
}
function supplierReviewReasons(supplier, today = todayBrisbane()) {
  const status = supplier?.status || "Active";
  if (status !== "Active") return [];
  const missing = [];
  if (!String(supplier?.name || "").trim()) missing.push("supplier name missing");
  if (!String(supplier?.address || "").trim()) missing.push("dock address missing");
  if (!String(supplier?.dockContactRole || "").trim()) missing.push("dock contact role missing");
  if (!String(supplier?.dockContactName || "").trim()) missing.push("named dock contact unresolved");
  if (!String(supplier?.pickupWindow || "").trim()) missing.push("pickup window missing");
  if (!String(supplier?.packagingNotes || "").trim()) missing.push("packaging notes missing");
  missing.push(...supplierApprovalGateReasons(supplier).map(reason => `POL-MCL-001-001 ${reason}`));
  if (!String(supplier?.lastReviewed || "").trim()) missing.push("last reviewed date missing");
  if (!supplierReviewIntervalDays(supplier)) missing.push("review interval not set");
  const dueDate = supplierReviewDueDate(supplier);
  if (dueDate && dueDate <= today) missing.push(`review due since ${dueDate}`);
  return missing;
}
function supplierReviewRows(suppliers, exceptions = [], today = todayBrisbane()) {
  return (suppliers || []).map(supplier => {
    const reasons = supplierReviewReasons(supplier, today);
    const openException = (exceptions || []).find(exception =>
      exception.type === "Supplier Master Data Review" &&
      exception.orderId === supplier.id &&
      exception.status !== "Closed"
    );
    return {
      supplier,
      reasons,
      dueDate: supplierReviewDueDate(supplier),
      reviewIntervalDays: supplierReviewIntervalDays(supplier),
      flagged: reasons.length > 0,
      openException,
    };
  });
}
function supplierReviewBadgeClass(row) {
  if (row.openException) return "b-cancelled";
  if (row.flagged) return "b-pending";
  return "b-done";
}
function supplierPickupStandardsRows(suppliers, orders = [], exceptions = []) {
  return (suppliers || []).map(supplier => {
    const supplierOrders = (orders || []).filter(order => order.vendor === supplier.name);
    const pickupRecords = supplierOrders.filter(order =>
      order.pickupOutcome ||
      ["En Route", "Delivered", "Failed Delivery", "No Pickup", "Brought Forward"].includes(order.status)
    );
    const noPickupOrders = supplierOrders.filter(order => order.pickupOutcome === "No Pickup" || order.status === "No Pickup");
    const packagingRefusals = noPickupOrders.filter(order => ["unlabelled", "improper_packaging"].includes(order.pickupNoPickupCategory));
    const whsHazards = noPickupOrders.filter(order => order.pickupNoPickupCategory === "whs_hazard" || order.whsHazardReported);
    const total = pickupRecords.length;
    const noPickupRate = total ? (noPickupOrders.length / total) * 100 : 0;
    const reasons = [];
    if (total > 0 && noPickupRate > 5) reasons.push(`No Pickup rate ${noPickupRate.toFixed(0)}% exceeds Policy #16 / CAP-MCL-001 target <5%`);
    if (packagingRefusals.length > 0) reasons.push(`${packagingRefusals.length} packaging/label refusal${packagingRefusals.length === 1 ? "" : "s"} recorded`);
    if (whsHazards.length > 0) reasons.push(`${whsHazards.length} Policy #27 WHS hazard stop${whsHazards.length === 1 ? "" : "s"} require Admin supplier follow-up`);
    const openException = (exceptions || []).find(exception =>
      exception.type === "Supplier Pickup Standards Review" &&
      exception.orderId === supplier.id &&
      exception.status !== "Closed"
    );
    return {
      supplier,
      total,
      noPickupCount: noPickupOrders.length,
      noPickupRate,
      packagingRefusalCount: packagingRefusals.length,
      whsHazardCount: whsHazards.length,
      reasons,
      flagged: reasons.length > 0,
      openException,
    };
  });
}
function supplierPickupStandardsBadgeClass(row) {
  if (row.openException) return "b-cancelled";
  if (row.flagged) return "b-pending";
  return "b-done";
}
function priceRuleReviewReasons(rule) {
  const reasons = [];
  const itemType = rule?.itemType || "";
  const rateCents = priceRuleRateCents(rule || {});
  if (!String(rule?.label || "").trim()) reasons.push("pricing label missing");
  if (!String(rule?.serviceVariant || "").trim()) reasons.push("service variant missing");
  if (!["tyre", "parts", "redelivery"].includes(itemType)) reasons.push("item type invalid or missing");
  if (!Number.isFinite(rateCents) || rateCents < 0) reasons.push("rate cents invalid or missing");
  if (!["flat", "per_item"].includes(priceRuleRateMode(rule || {}))) reasons.push("rate mode invalid or missing");
  if (!String(rule?.effectiveFrom || "").trim()) reasons.push("effective-from date missing");
  if (rule?.effectiveTo && rule.effectiveFrom && rule.effectiveTo < rule.effectiveFrom) reasons.push("effective-to date before effective-from");
  if (itemType === "tyre" && !Number(rule?.tyreCountMin || rule?.minQty || 0)) reasons.push("tyre count minimum missing");
  if (itemType === "parts" && !String(rule?.weightBand || "").trim()) reasons.push("weight band missing");
  if (!String(rule?.changeLogId || rule?.sourceRef || "").trim()) reasons.push("change log reference missing");
  if (!String(rule?.ownerApprovalRef || rule?.sourceRef || "").trim()) reasons.push("Owner approval reference missing");
  return reasons;
}
function priceRuleReviewRows(priceRules, exceptions = []) {
  return (priceRules || []).map(rule => {
    const reasons = priceRuleReviewReasons(rule);
    const openException = (exceptions || []).find(exception =>
      exception.type === "Pricing Master Data Review" &&
      exception.orderId === rule.id &&
      exception.status !== "Closed"
    );
    return {
      rule,
      reasons,
      flagged: reasons.length > 0,
      openException,
    };
  });
}
function priceRuleReviewBadgeClass(row) {
  if (row.openException) return "b-cancelled";
  if (row.flagged) return "b-pending";
  return "b-done";
}
function operationalNoticeLabel(type) {
  const labels = {
    pickup_request_submitted: "Pickup request",
    schedule_adjusted: "Schedule adjusted",
    pickup_confirmed: "Pickup confirmed",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    failed_delivery: "Failed delivery",
    no_pickup: "No pickup",
    bring_forward: "Bring forward",
    order_cancelled: "Order cancelled",
    cancellation_requested: "Cancellation requested",
    dispute_received: "Dispute received",
    billing_query_received: "Billing query received",
    supplier_setup_requested: "Supplier setup requested",
    account_activated: "Account activated",
    account_suspended: "Account suspended",
    account_reinstated: "Account reinstated",
    account_terminated: "Account terminated",
  };
  return labels[type] || String(type || "Operational update").replace(/_/g, " ");
}
function billingNoticeLabel(type) {
  const labels = {
    day_8_overdue: "Day 8 overdue notice",
    suspension: "Account suspension notice",
    reinstatement: "Account reinstatement notice",
    termination: "Account termination notice",
    invoice: "Invoice notice",
  };
  return labels[type] || String(type || "Billing notice").replace(/_/g, " ");
}
function policy23SuspensionTypeLabel(type) {
  const labels = {
    non_payment: "Non-payment after overdue notice",
    material_conduct_breach: "Material conduct breach",
  };
  return labels[type] || String(type || "Suspension").replace(/_/g, " ");
}
function policy23TerminationGroundLabel(ground) {
  const labels = {
    conduct_unremedied: "Conduct breach not remedied",
    voluntary_request: "Voluntary client closure request",
    repeated_non_payment: "Repeated non-payment",
  };
  return labels[ground] || String(ground || "Termination").replace(/_/g, " ");
}
function billingNoticeReference(notice) {
  return notice?.invoiceId || notice?.invoice_number || "Account";
}
function billingNoticeChannelLabel(notice) {
  const channel = notice?.deliveryChannel || notice?.channel || "";
  return channel === "local_record_only" ? "Local record only" : (channel || "Channel not recorded");
}
function billingNoticeSourceLabel(notice) {
  if (notice?.systemGenerated || notice?.generationSource === "system_due_scan") return "System generated";
  if (notice?.generationSource === "admin_manual") return "Admin recorded";
  return notice?.recordedBy === "system" ? "System generated" : "Admin recorded";
}
function normaliseMatchText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}
function activeClientAccounts(clients = []) {
  return (clients || []).filter(client => (client.status || "Active") === "Active" && client.courierEligible !== false);
}
function billingAccountMatchState(order, clients = []) {
  const activeClients = activeClientAccounts(clients);
  const current = clients.find(client => client.id === order?.clientId) || null;
  const currentActive = current && activeClients.some(client => client.id === current.id);
  const byAddress = activeClients.filter(client =>
    normaliseMatchText(client.address) &&
    normaliseMatchText(client.address) === normaliseMatchText(order?.dropAddress)
  );
  const byName = activeClients.filter(client =>
    normaliseMatchText(client.name) &&
    normaliseMatchText(client.name) === normaliseMatchText(order?.clientName)
  );
  const candidates = [...new Map([...byAddress, ...byName, ...activeClients].map(client => [client.id, client])).values()];

  if (currentActive) {
    return {
      matched: true,
      reason: "Known active account",
      client: current,
      candidates,
      reasons: [],
    };
  }

  const reasons = [];
  if (!order?.clientId) reasons.push("account_id missing");
  else if (!current) reasons.push("account_id does not match a known customer account");
  else reasons.push("matched account is not active for billing");
  if (!currentActive && byAddress.length > 1) reasons.push("multiple active accounts match the delivery address");
  if (!currentActive && byAddress.length === 0 && byName.length === 0) reasons.push("no confident active account candidate from address or account name");

  return {
    matched: false,
    reason: reasons.join("; "),
    client: current,
    candidates,
    reasons,
  };
}
function isBillingCandidate(order) {
  return order?.status === "Delivered" && order.price && order.proofId && !order.invoiceId;
}
function isRedeliveryBillingCandidate(order) {
  return order?.redeliveryFeeStatus === "Approved" && !order.redeliveryInvoiceId;
}
function unmatchedBillingAccountRows(orders = [], clients = [], exceptions = []) {
  return (orders || [])
    .filter(order => isBillingCandidate(order) || isRedeliveryBillingCandidate(order))
    .map(order => {
      const match = billingAccountMatchState(order, clients);
      const openException = (exceptions || []).find(exception =>
        exception.type === "Unmatched Billing Account" &&
        exception.orderId === order.id &&
        exception.status !== "Closed"
      );
      return { order, match, openException };
    })
    .filter(row => !row.match.matched);
}
function billingQueryRowsForInvoices(invoices = [], exceptions = []) {
  const invoiceById = new Map((invoices || []).map(invoice => [invoice.id, invoice]));
  return (exceptions || [])
    .filter(exception => exception.type === "Billing Dispute" && invoiceById.has(exception.orderId))
    .map(exception => ({ exception, invoice: invoiceById.get(exception.orderId) }))
    .sort((a, b) => String(b.exception.createdAt || "").localeCompare(String(a.exception.createdAt || "")));
}
function exceptionStatusBadgeClass(status) {
  return status === "Closed" ? "b-done" : "b-pending";
}
function notificationDeliveryFailed(record) {
  const status = String(record?.status || "").toLowerCase();
  const externalStatus = String(record?.externalDeliveryStatus || record?.external_delivery_status || record?.dispatchExternalStatus || "").toLowerCase();
  return status === "failed" || externalStatus === "failed";
}
function notificationFailureRows(operationalNotices = [], billingNotices = []) {
  return [
    ...operationalNotices.filter(notificationDeliveryFailed).map(notice => ({
      key: `operational_notices:${notice.id}`,
      noticeTable: "operational_notices",
      noticeId: notice.id,
      type: "Operational notification",
      subject: notice.subject || operationalNoticeLabel(notice.noticeType),
      reference: notice.orderId || notice.clientId || "Account",
      clientName: notice.clientName || "",
      status: notice.externalDeliveryStatus || notice.status || "failed",
      policyRef: notice.policyRef || "UJ-CRM-001A / APP-ADM-005",
    })),
    ...billingNotices.filter(notificationDeliveryFailed).map(notice => ({
      key: `billing_notices:${notice.id}`,
      noticeTable: "billing_notices",
      noticeId: notice.id,
      type: "Billing notification",
      subject: notice.subject || `${billingNoticeLabel(notice.noticeType)} - ${billingNoticeReference(notice)}`,
      reference: notice.invoiceId || notice.invoice_number || notice.clientId || "Invoice",
      clientName: notice.clientName || "",
      status: notice.externalDeliveryStatus || notice.status || "failed",
      policyRef: notice.policyRef || "UJ-CRM-001B / APP-ADM-005",
    })),
  ];
}
function aiAgentForId(agentId) {
  return AI_AGENT_OPTIONS.find(agent => agent.id === agentId) || AI_AGENT_OPTIONS[2];
}
function normaliseAiDraft(record = {}) {
  const agent = aiAgentForId(record.agentId || record.agent_id);
  const status = POLICY20_AI_DRAFT_STATUSES.includes(record.status) ? record.status : "Draft Pending Admin Review";
  return {
    ...record,
    id: record.id || `ai-draft-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    agentId: agent.id,
    agentName: record.agentName || record.agent_name || agent.name,
    targetType: record.targetType || record.target_type || agent.scope,
    targetId: record.targetId || record.target_id || "",
    targetName: record.targetName || record.target_name || "Flagged actor",
    triggerSource: record.triggerSource || record.trigger_source || agent.trigger,
    triggerReason: record.triggerReason || record.trigger_reason || "",
    draftText: record.draftText || record.draft_text || "",
    status,
    createdAt: record.createdAt || record.created_at || isoNow(),
    createdBy: record.createdBy || record.created_by || "Admin",
    reviewedAt: record.reviewedAt || record.reviewed_at || "",
    reviewedBy: record.reviewedBy || record.reviewed_by || "",
    reviewNote: record.reviewNote || record.review_note || "",
    approvedText: record.approvedText || record.approved_text || "",
    rejectedReason: record.rejectedReason || record.rejected_reason || "",
    sentAt: "",
    externalDeliveryStatus: "not_sent_provider_not_configured",
    autonomousSendAttempted: false,
    commercialDecisionMade: false,
    policyRef: record.policyRef || record.policy_ref || POLICY20_AI_USE_SOURCE,
  };
}
function aiDraftRequiresReview(draft) {
  return normaliseAiDraft(draft).status === "Draft Pending Admin Review";
}
function aiDraftStatusBadgeClass(status) {
  if (status === "Approved - Not Sent") return "b-done";
  if (status === "Rejected") return "b-cancelled";
  return "b-pending";
}
function policy6AssessmentDueDate(awarenessDate) {
  return addDays(isoDate(awarenessDate), 30);
}
function normaliseDataBreachIncident(record = {}) {
  const awarenessDate = optionalIsoDate(record.awarenessDate || record.awareness_date) || todayBrisbane();
  const privacyOwnerName = String(record.privacyOwnerName || record.privacy_owner_name || "").trim();
  const ownerNamed = Boolean(privacyOwnerName);
  let eligibilityDecision = record.eligibilityDecision || record.eligibility_decision || (ownerNamed ? "Awaiting Privacy Owner Assessment" : "Blocked - Privacy Owner Unnamed");
  if (!POLICY6_ELIGIBILITY_DECISIONS.includes(eligibilityDecision)) eligibilityDecision = ownerNamed ? "Awaiting Privacy Owner Assessment" : "Blocked - Privacy Owner Unnamed";
  if (!ownerNamed && ["Eligible Data Breach", "Not Eligible"].includes(eligibilityDecision)) {
    eligibilityDecision = "Blocked - Privacy Owner Unnamed";
  }
  const status = POLICY6_NDB_STATUSES.includes(record.status) ? record.status : "Open - Identify and Contain";
  const postBreachReviewCompletedAt = record.postBreachReviewCompletedAt || record.post_breach_review_completed_at || "";
  return {
    ...record,
    id: record.id || `ndb-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: record.title || record.incidentTitle || record.incident_title || "",
    reportedBy: record.reportedBy || record.reported_by || "Admin",
    awarenessDate,
    description: record.description || "",
    personalInformationInvolved: record.personalInformationInvolved || record.personal_information_involved || "",
    affectedIndividualEstimate: record.affectedIndividualEstimate || record.affected_individual_estimate || "",
    containmentActions: record.containmentActions || record.containment_actions || "",
    containmentStatus: record.containmentStatus || record.containment_status || "Identified - containment in progress",
    appPrv004AuditRefs: record.appPrv004AuditRefs || record.app_prv_004_audit_refs || "",
    systemAccessLogRefs: record.systemAccessLogRefs || record.system_access_log_refs || "",
    digiverseEvidenceRefs: record.digiverseEvidenceRefs || record.digiverse_evidence_refs || "",
    privacyOwnerName,
    privacyOwnerNotificationEvidence: record.privacyOwnerNotificationEvidence || record.privacy_owner_notification_evidence || (ownerNamed ? "" : POLICY6_PRIVACY_OWNER_BLOCKER),
    privacyOwnerNotifiedAt: record.privacyOwnerNotifiedAt || record.privacy_owner_notified_at || "",
    assessmentDueDate: record.assessmentDueDate || record.assessment_due_date || policy6AssessmentDueDate(awarenessDate),
    eligibilityDecision,
    privacyOwnerDecisionAt: record.privacyOwnerDecisionAt || record.privacy_owner_decision_at || "",
    privacyOwnerDecisionNote: record.privacyOwnerDecisionNote || record.privacy_owner_decision_note || "",
    oaicNotificationEvidence: record.oaicNotificationEvidence || record.oaic_notification_evidence || "",
    affectedIndividualsNotificationEvidence: record.affectedIndividualsNotificationEvidence || record.affected_individuals_notification_evidence || "",
    publicStatementUrl: record.publicStatementUrl || record.public_statement_url || "",
    postBreachReviewReportRef: record.postBreachReviewReportRef || record.post_breach_review_report_ref || "",
    postBreachReviewCompletedAt,
    retainedUntil: record.retainedUntil || record.retained_until || (postBreachReviewCompletedAt ? addYears(isoDate(postBreachReviewCompletedAt), 7) : ""),
    status,
    sourceRef: record.sourceRef || record.source_ref || POLICY6_NDB_SOURCE,
    createdAt: record.createdAt || record.created_at || isoNow(),
    updatedAt: record.updatedAt || record.updated_at || "",
  };
}
function dataBreachIncidentOpen(record) {
  return normaliseDataBreachIncident(record).status !== "Closed";
}
function dataBreachAssessmentOverdue(record, today = todayBrisbane()) {
  const incident = normaliseDataBreachIncident(record);
  return dataBreachIncidentOpen(incident) && today > incident.assessmentDueDate;
}
function dataBreachStatusBadgeClass(status) {
  if (status === "Closed") return "b-done";
  if (status === "Notification Required") return "b-cancelled";
  return "b-pending";
}
function normaliseDataUseRecord(record = {}) {
  const requestType = POLICY21_DATA_USE_REQUEST_TYPES.includes(record.requestType || record.request_type)
    ? (record.requestType || record.request_type)
    : "Operational Access";
  const requesterRole = POLICY21_DATA_USE_REQUESTER_ROLES.includes(record.requesterRole || record.requester_role)
    ? (record.requesterRole || record.requester_role)
    : "Admin";
  const status = POLICY21_DATA_USE_STATUSES.includes(record.status) ? record.status : "Logged";
  return {
    ...record,
    id: record.id || `data-use-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: record.title || record.requestTitle || record.request_title || "",
    requestType,
    requesterRole,
    requesterName: record.requesterName || record.requester_name || "Admin",
    requestDate: optionalIsoDate(record.requestDate || record.request_date) || todayBrisbane(),
    dataCategories: record.dataCategories || record.data_categories || "",
    purpose: record.purpose || "",
    roleBasis: record.roleBasis || record.role_basis || "",
    serviceDeliveryInvolved: Boolean(record.serviceDeliveryInvolved ?? record.service_delivery_involved),
    externalRecipient: record.externalRecipient || record.external_recipient || "",
    consentEvidence: record.consentEvidence || record.consent_evidence || "",
    adminApprovalEvidence: record.adminApprovalEvidence || record.admin_approval_evidence || "",
    productionAccessLogRef: record.productionAccessLogRef || record.production_access_log_ref || "",
    digiverseScope: record.digiverseScope || record.digiverse_scope || "",
    breachEscalationNote: record.breachEscalationNote || record.breach_escalation_note || "",
    prohibitedPersonalUse: Boolean(record.prohibitedPersonalUse ?? record.prohibited_personal_use),
    storedOnPersonalDevice: Boolean(record.storedOnPersonalDevice ?? record.stored_on_personal_device),
    sharesClientDataExternally: Boolean(record.sharesClientDataExternally ?? record.shares_client_data_externally),
    sharesDriverDataToClientsOrSuppliers: Boolean(record.sharesDriverDataToClientsOrSuppliers ?? record.shares_driver_data_to_clients_or_suppliers),
    blockedReasons: Array.isArray(record.blockedReasons) ? record.blockedReasons : (Array.isArray(record.blocked_reasons) ? record.blocked_reasons : []),
    status,
    sourceRef: record.sourceRef || record.source_ref || `${POLICY21_DATA_USE_SOURCE}; ${POLICY7_INFORMATION_SECURITY_SOURCE}`,
    createdAt: record.createdAt || record.created_at || isoNow(),
    updatedAt: record.updatedAt || record.updated_at || "",
  };
}
function dataUseBlockedReasons(record = {}) {
  const row = normaliseDataUseRecord(record);
  const text = `${row.purpose} ${row.roleBasis} ${row.digiverseScope}`.toLowerCase();
  const blockers = [];
  if (row.prohibitedPersonalUse || /personal curiosity|personal gain|unrelated purpose|unrelated use/.test(text)) {
    blockers.push("Policy #21 blocks access for personal curiosity, personal gain, or unrelated purpose.");
  }
  if (row.storedOnPersonalDevice) {
    blockers.push("Policy #21 blocks storing personal information on personal devices.");
  }
  if (row.requestType === "Data Export" && !row.adminApprovalEvidence.trim()) {
    blockers.push("Policy #21 requires Admin approval evidence before data export.");
  }
  if (row.requestType === "Marketing Use" && !row.consentEvidence.trim()) {
    blockers.push("Policy #21 blocks marketing use without consent evidence.");
  }
  if ((row.requestType === "Third-Party Sharing" || row.sharesClientDataExternally) && !row.serviceDeliveryInvolved && !row.consentEvidence.trim()) {
    blockers.push("Policy #21 blocks client data sharing unless the recipient is involved in service delivery or client consent is recorded.");
  }
  if (row.sharesDriverDataToClientsOrSuppliers) {
    blockers.push("Policy #21 blocks sharing driver personal information with clients or suppliers.");
  }
  if (row.requestType === "Digiverse Production Access") {
    if (!/(maintenance|support|security|incident|platform)/.test(text)) {
      blockers.push("Policy #21 limits Digiverse production data access to maintenance or support purposes.");
    }
    if (!row.productionAccessLogRef.trim()) {
      blockers.push("Policy #21 requires logged Digiverse production data access evidence.");
    }
    if (!row.adminApprovalEvidence.trim()) {
      blockers.push("Policy #7 requires Admin-controlled production access evidence.");
    }
  }
  return blockers;
}
function dataUseStatusBadgeClass(status) {
  if (status === "Approved" || status === "Logged") return "b-done";
  if (status === "Blocked" || status === "Breach Reported") return "b-cancelled";
  return "b-pending";
}
function policy3PrivacyResponseDueDate(receivedDate) {
  return addDays(isoDate(receivedDate), 30);
}
function policy3PrivacyComplaintAckDueDate(receivedDate) {
  return addBusinessDays(isoDate(receivedDate), 5);
}
function normalisePrivacyRequest(record = {}) {
  const receivedDate = optionalIsoDate(record.receivedDate || record.received_date) || todayBrisbane();
  const requestType = POLICY3_PRIVACY_REQUEST_TYPES.includes(record.requestType || record.request_type)
    ? (record.requestType || record.request_type)
    : "Access Request";
  const requesterRole = POLICY3_PRIVACY_REQUESTER_ROLES.includes(record.requesterRole || record.requester_role)
    ? (record.requesterRole || record.requester_role)
    : "Client Operational Contact";
  const status = POLICY3_PRIVACY_STATUSES.includes(record.status) ? record.status : "Open";
  return {
    ...record,
    id: record.id || `privacy-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    requestType,
    requesterRole,
    requesterName: record.requesterName || record.requester_name || "",
    requesterContact: record.requesterContact || record.requester_contact || "",
    relatedAccount: record.relatedAccount || record.related_account || "",
    receivedDate,
    responseDueDate: record.responseDueDate || record.response_due_date || policy3PrivacyResponseDueDate(receivedDate),
    complaintAckDueDate: requestType === "Privacy Complaint" ? (record.complaintAckDueDate || record.complaint_ack_due_date || policy3PrivacyComplaintAckDueDate(receivedDate)) : "",
    requestSummary: record.requestSummary || record.request_summary || "",
    piiCategories: record.piiCategories || record.pii_categories || "",
    collectionNoticeVersion: record.collectionNoticeVersion || record.collection_notice_version || POLICY4_COLLECTION_NOTICE_SOURCE,
    acknowledgedAt: record.acknowledgedAt || record.acknowledged_at || "",
    acknowledgementEvidence: record.acknowledgementEvidence || record.acknowledgement_evidence || "",
    accessResponseEvidence: record.accessResponseEvidence || record.access_response_evidence || "",
    correctionActionEvidence: record.correctionActionEvidence || record.correction_action_evidence || "",
    privacyActRefusalGround: record.privacyActRefusalGround || record.privacy_act_refusal_ground || "",
    app3Assessment: record.app3Assessment || record.app3_assessment || "",
    couldHaveCollectedUnderApp3: Boolean(record.couldHaveCollectedUnderApp3 ?? record.could_have_collected_under_app3),
    destructionOrDeidentificationRequested: Boolean(record.destructionOrDeidentificationRequested ?? record.destruction_or_deidentification_requested),
    privacyOwnerName: record.privacyOwnerName || record.privacy_owner_name || "",
    privacyOwnerApprovalEvidence: record.privacyOwnerApprovalEvidence || record.privacy_owner_approval_evidence || "",
    outcomeNote: record.outcomeNote || record.outcome_note || "",
    resolvedAt: record.resolvedAt || record.resolved_at || "",
    status,
    sourceRef: record.sourceRef || record.source_ref || `${POLICY3_PRIVACY_SOURCE}; ${POLICY4_COLLECTION_NOTICE_SOURCE}; ${POLICY5_RETENTION_SOURCE}`,
    createdAt: record.createdAt || record.created_at || isoNow(),
    updatedAt: record.updatedAt || record.updated_at || "",
  };
}
function privacyRequestOpen(record) {
  const row = normalisePrivacyRequest(record);
  return !["Resolved", "Refused", "Referred to OAIC"].includes(row.status);
}
function privacyRequestAckOverdue(record, today = todayBrisbane()) {
  const row = normalisePrivacyRequest(record);
  return row.requestType === "Privacy Complaint" && !row.acknowledgedAt && row.complaintAckDueDate && today > row.complaintAckDueDate;
}
function privacyRequestResponseOverdue(record, today = todayBrisbane()) {
  const row = normalisePrivacyRequest(record);
  return privacyRequestOpen(row) && row.responseDueDate && today > row.responseDueDate;
}
function privacyRequestStatusBadgeClass(status) {
  if (status === "Resolved") return "b-done";
  if (status === "Refused" || status === "Referred to OAIC" || status === "Blocked - Privacy Owner Required") return "b-cancelled";
  return "b-pending";
}
function runDateAdjustmentLabel(reason) {
  const labels = {
    after_cutoff: "12:30pm Brisbane cut-off applied",
    requested_date_past: "Requested date was in the past",
    non_run_day: "Moved to next Tuesday/Thursday run",
  };
  return labels[reason] || "Schedule adjusted";
}
function accessKey(role, subjectId, email) { return `${role}:${subjectId}:${String(email || "").toLowerCase()}`; }
function accessBadgeClass(status) { return status === "Revoked" ? "b-cancelled" : status === "Review Due" ? "b-pending" : "b-done"; }
const ACCESS_REVIEW_TYPES = [
  { value: "annual", label: "Annual" },
  { value: "role_change", label: "Role Change" },
  { value: "departure", label: "Departure" },
  { value: "restore", label: "Restore" },
  { value: "revoke", label: "Revoke" },
  { value: "other", label: "Other" },
];
function accessReviewTypeLabel(value) {
  return ACCESS_REVIEW_TYPES.find(type => type.value === value)?.label || "Other";
}
function accessReviewTypeAllowed(value) {
  return ACCESS_REVIEW_TYPES.some(type => type.value === value);
}
function defaultAccessReviewType(action, record) {
  if (action === "revoke") return "revoke";
  if (action === "restore") return "restore";
  return isStaffAccess(record) ? "annual" : "other";
}
function accessReviewOutcome(action) {
  if (action === "revoke") return "revoke";
  if (action === "restore") return "restore";
  return "retain";
}
function isStaffAccess(record) { return ["driver", "admin"].includes(record.role); }
function accessReviewDue(record) {
  if (!isStaffAccess(record) || record.status === "Revoked") return false;
  if (!record.reviewedAt) return true;
  return addYears(isoDate(record.reviewedAt), 1) <= todayBrisbane();
}
function withAccessOverride(base, overrides) {
  const override = (overrides || []).find(item => item.key === base.key);
  const next = { ...base, ...(override || {}) };
  next.status = override?.status || base.status || "Active";
  return next;
}
function buildAccessRecords(clients, drivers, overrides = []) {
  const rows = [];
  (clients || []).forEach(client => {
    rows.push(withAccessOverride({
      key: accessKey("client", client.id, client.email),
      role: "client",
      roleLabel: "Client Operational Contact",
      actorCode: "ACT-CRM-001a",
      subjectId: client.id,
      subjectName: client.operationalContact?.name || client.name,
      accountName: client.name,
      email: client.email,
      status: "Active",
      accessScope: "Pickup requests, tracking, delivery disputes, and billing visibility for own account.",
    }, overrides));
    rows.push(withAccessOverride({
      key: accessKey("billing", client.id, client.billingContact?.email || client.email),
      role: "billing",
      roleLabel: "Client Billing Contact",
      actorCode: "ACT-CRM-001b",
      subjectId: client.id,
      subjectName: client.billingContact?.name || client.name,
      accountName: client.name,
      email: client.billingContact?.email || client.email,
      status: "Active",
      accessScope: "Invoices, account notices, payment evidence, and billing disputes for own account.",
    }, overrides));
  });
  (drivers || []).forEach(driver => rows.push(withAccessOverride({
    key: accessKey("driver", driver.id, driver.email),
    role: "driver",
    roleLabel: "Driver",
    actorCode: "ACT-INT-001",
    subjectId: driver.id,
    subjectName: driver.name,
    accountName: "Moto and Co Couriers",
    email: driver.email,
    status: "Active",
    accessScope: "Assigned run brief, pickup outcomes, delivery outcomes, POD, and run close.",
  }, overrides)));
  seedAdmins.forEach(admin => rows.push(withAccessOverride({
    key: accessKey("admin", admin.id, admin.email),
    role: "admin",
    roleLabel: "Admin",
    actorCode: "ACT-INT-002",
    subjectId: admin.id,
    subjectName: admin.name,
    accountName: "Moto and Co Couriers",
    email: admin.email,
    status: "Active",
    accessScope: "Operations console, CRM, dispatch, exceptions, billing, pricing, retention, audit, and access review.",
  }, overrides)));
  return rows.map(row => ({ ...row, reviewDue: accessReviewDue(row) }));
}
function accessRecordForLogin(accessRecords, role, user, loginEmail) {
  const email = String(loginEmail || user?.loginEmail || user?.email || "").toLowerCase();
  const subjectId = user?.id;
  return (accessRecords || []).find(record => record.role === role && record.subjectId === subjectId && record.email.toLowerCase() === email)
    || (accessRecords || []).find(record => record.role === role && record.email.toLowerCase() === email);
}
function activePriceRules(priceRules) { return priceRules.filter(r => (r.status || "Active") === "Active"); }
function priceRuleRateCents(rule) { return Number(rule.rateCents ?? Math.round(Number(rule.amount || 0) * 100)); }
function priceRuleDollars(rule) { return priceRuleRateCents(rule) / 100; }
function priceRuleRateMode(rule) { return rule.rateMode || (rule.method === "perItem" ? "per_item" : "flat"); }
function priceRuleIsPerItem(rule) { return priceRuleRateMode(rule) === "per_item"; }
function priceRuleMinQty(rule) { return Number(rule?.tyreCountMin || rule?.minQty || 1); }
function redeliveryPriceRule(priceRules = []) {
  return activePriceRules(priceRules).find(rule => rule.itemType === "redelivery" || rule.serviceVariant === "REDELIVERY");
}
function policy8RedeliveryFeeAmount(priceRules = []) {
  const rule = redeliveryPriceRule(priceRules);
  return rule ? priceRuleDollars(rule) : 10;
}
function failedDeliveryAttempts(order) {
  return Array.isArray(order?.failedDeliveryAttempts) ? order.failedDeliveryAttempts : [];
}
function failedDeliveryAttemptCount(order) {
  const attempts = failedDeliveryAttempts(order).length;
  return Number(order?.failedDeliveryAttemptCount || attempts || (order?.status === "Failed Delivery" ? 1 : 0));
}
function runCloseActionItemsForOrders(orders = []) {
  const failedOrders = orders.filter(order => order.status === "Failed Delivery");
  return failedOrders.map(order => {
    const attemptCount = failedDeliveryAttemptCount(order);
    const label = `${order.id} - ${order.clientName || "Customer"}`;
    if (attemptCount >= 2 || order.returnToSupplierRequired) {
      return `${label}: return goods to originating supplier on the next scheduled milk run.`;
    }
    return `${label}: goods retained for second delivery attempt.`;
  });
}
function runCloseSummaryForOrders(orders = []) {
  const deliveredCount = orders.filter(order => order.status === "Delivered").length;
  const noPickupCount = orders.filter(order => order.status === "No Pickup").length;
  const failedDeliveryOrders = orders.filter(order => order.status === "Failed Delivery");
  const pickedUpCount = orders.filter(order =>
    order.pickupOutcome === "Picked Up"
    || ["Delivered", "Failed Delivery", "En Route"].includes(order.status)
  ).length;
  const returnToSupplierCount = failedDeliveryOrders.filter(order => failedDeliveryAttemptCount(order) >= 2 || order.returnToSupplierRequired).length;
  const secondAttemptRequiredCount = failedDeliveryOrders.filter(order => failedDeliveryAttemptCount(order) < 2 && !order.returnToSupplierRequired).length;
  const actionItems = runCloseActionItemsForOrders(orders);
  return {
    totalStopCount: orders.length,
    pickedUpCount,
    deliveredCount,
    noPickupCount,
    failedDeliveryCount: failedDeliveryOrders.length,
    secondAttemptRequiredCount,
    returnToSupplierCount,
    retainedGoodsCount: failedDeliveryOrders.length,
    actionItems,
  };
}
function priceRuleBand(rule) {
  if (rule.itemType === "tyre" || rule.tyreCountMin) {
    const min = rule.tyreCountMin || rule.minQty || "";
    const max = rule.tyreCountMax || "";
    return max ? `${min}-${max} tyres` : `${min}+ tyres`;
  }
  if (rule.weightBand === "lt_5kg") return "Less than 5 kg";
  if (rule.weightBand === "5_to_15kg") return "5 kg to 15 kg";
  if (rule.weightBand === "gt_15kg") return "More than 15 kg";
  return rule.itemType || "Not classified";
}
function normalisePriceRule(rule) {
  const label = String(rule.label || "").toLowerCase();
  const legacyIdByLabel = {
    "1 tyre": "price-tyre-1",
    "2 tyres": "price-tyre-2",
    "3 tyres": "price-tyre-3",
    "4+ tyres": "price-tyre-4-plus",
    "4 or more tyres": "price-tyre-4-plus",
    "parts <5kg": "price-parts-lt-5",
    "parts 5-15kg": "price-parts-5-15",
    "parts 15kg+": "price-parts-gt-15",
    "less than 5 kg": "price-parts-lt-5",
    "5 kg to 15 kg": "price-parts-5-15",
    "more than 15 kg": "price-parts-gt-15",
  };
  const seed = seedPriceRules.find(s => s.id === rule.id || s.id === legacyIdByLabel[label] || s.label.toLowerCase() === label);
  const merged = seed ? { ...seed, ...rule } : rule;
  const itemType = merged.itemType || (merged.weightBand || label.includes("parts") ? "parts" : label.includes("redelivery") ? "redelivery" : "tyre");
  const serviceVariant = merged.serviceVariant || (itemType === "parts" ? "SVC-MCL-001-P" : itemType === "redelivery" ? "REDELIVERY" : "SVC-MCL-001-T");
  const rateCents = priceRuleRateCents(merged);
  return {
    ...merged,
    serviceVariant,
    itemType,
    tyreCountMin: itemType === "tyre" ? (merged.tyreCountMin || merged.minQty || undefined) : undefined,
    tyreCountMax: itemType === "tyre" ? merged.tyreCountMax : undefined,
    weightBand: itemType === "parts" ? merged.weightBand : undefined,
    rateCents,
    rateMode: priceRuleRateMode(merged),
    effectiveFrom: merged.effectiveFrom || "2026-06-01",
    amount: rateCents / 100,
    method: priceRuleRateMode(merged) === "per_item" ? "perItem" : "fixed",
    status: merged.status || "Active",
  };
}

// ─── SIGNATURE PAD ───────────────────────────────────────────────────────────
function SigPad({ onSig }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const [hasSig, setHasSig] = useState(false);

  function pos(e) {
    const r = ref.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return [src.clientX - r.left, src.clientY - r.top];
  }
  function start(e) { e.preventDefault(); drawing.current = true; const [x, y] = pos(e); const ctx = ref.current.getContext("2d"); ctx.beginPath(); ctx.moveTo(x, y); }
  function draw(e) {
    if (!drawing.current) return; e.preventDefault();
    const [x, y] = pos(e);
    const ctx = ref.current.getContext("2d");
    ctx.lineWidth = 2; ctx.strokeStyle = T.acc; ctx.lineCap = "round";
    ctx.lineTo(x, y); ctx.stroke();
    setHasSig(true);
    onSig(ref.current.toDataURL());
  }
  function end() { drawing.current = false; }
  function clear() {
    const c = ref.current; const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    setHasSig(false); onSig(null);
  }

  useEffect(() => {
    const c = ref.current;
    c.width = c.offsetWidth; c.height = c.offsetHeight;
  }, []);

  return (
    <div className="sigbox" onMouseDown={start} onMouseMove={draw} onMouseUp={end} onMouseLeave={end}
      onTouchStart={start} onTouchMove={draw} onTouchEnd={end}>
      <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {!hasSig && <div className="sigph">Sign here</div>}
      <button className="sigclr" onClick={clear}>Clear</button>
    </div>
  );
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
// ─── REGISTER CLIENT ─────────────────────────────────────────────────────────
function passwordLoginErrorMessage(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  if (code.includes("invalid_credentials") || message.includes("invalid login") || message.includes("invalid credentials")) {
    return "Email or password is incorrect.";
  }
  if (message.includes("email not confirmed")) {
    return "This login is not active yet. Contact Admin.";
  }
  return "We could not sign you in. Check the email and password, or contact Admin.";
}

function portalTaskTimeout(label, promise, timeoutMs = 15000) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} took too long. Refresh the page and try again.`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function Login({ onRegister, defaultRole = "client", entryNotice = "", liveRuntimeStatus, liveAuthError = "" }) {
  const defaultEntry = ["admin", "driver"].includes(defaultRole) ? "courier_business" : "customer";
  const [entryType, setEntryType] = useState(defaultEntry);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setEntryType(["admin", "driver"].includes(defaultRole) ? "courier_business" : "customer");
    setErr("");
    setNotice("");
  }, [defaultRole]);

  async function signIn() {
    setErr("");
    setNotice("");
    const loginEmail = email.trim().toLowerCase();
    if (!loginEmail) {
      setErr("Email required");
      return;
    }
    if (!password) {
      setErr("Password required");
      return;
    }
    if (!liveRuntimeStatus?.enabled) {
      setErr("Live login is not configured for this deployment. Contact Admin.");
      return;
    }
    setSending(true);
    try {
      await requestLivePasswordLogin(loginEmail, password);
      setNotice("Opening portal...");
    } catch (error) {
      setErr(passwordLoginErrorMessage(error));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <img src="/moto-and-co-couriers-logo.png" alt="Moto and Co Couriers" />
          <p>Workshop support courier portal</p>
        </div>
        <div className="tabs" aria-label="Portal type">
          <button className={`tab${entryType === "customer" ? " active" : ""}`} onClick={() => setEntryType("customer")}>
            Customer Login
          </button>
          <button className={`tab${entryType === "courier_business" ? " active" : ""}`} onClick={() => setEntryType("courier_business")}>
            Courier Business Login
          </button>
        </div>
        {entryNotice && <div className="card" style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".9rem" }}>{entryNotice}</div>}
        {liveAuthError && <div className="err">{liveAuthError}</div>}
        {err && <div className="err">{err}</div>}
        {notice && <div className="card" style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".9rem" }}>{notice}</div>}
        <p style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".8rem" }}>
          {entryType === "customer"
            ? "Sign in with your customer email and password."
            : "Sign in with your courier business email and password."}
        </p>
        <div className="f">
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" onKeyDown={e => e.key === "Enter" && signIn()} />
        </div>
        <div className="f">
          <label>Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" onKeyDown={e => e.key === "Enter" && signIn()} />
        </div>
        <button className="btn b-acc" onClick={signIn} disabled={sending}>
          {sending ? "Signing in..." : "Sign In"}
        </button>
        {entryType === "customer" && (
          <p style={{ fontSize: ".75rem", color: T.mu, textAlign: "center", marginTop: "1rem" }}>
            Not registered? <span style={{ color: T.acc, cursor: "pointer" }} onClick={onRegister}>Register</span>
          </p>
        )}
      </div>
    </div>
  );
}

function RegisterClient({ suppliers, onDone, onCancel }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [opName, setOpName] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [phone, setPhone] = useState(""); const [address, setAddress] = useState("");
  const [vendors, setVendors] = useState([]);
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState("");

  function toggle(v) { setVendors(vs => vs.includes(v) ? vs.filter(x => x !== v) : [...vs, v]); }

  function submit() {
    if (!name || !email || !opName || !billingName || !billingEmail || !phone || !address) { setErr("All fields required"); return; }
    const addressStatus = physicalAddressStatus(address);
    if (!addressStatus.ok) { setErr("Delivery address must be a physical address in the SEQ service area. PO boxes are not accepted."); return; }
    if (vendors.length === 0) { setErr("Select at least one approved supplier"); return; }
    if (!consent) { setErr("Collection notice acknowledgement is required"); return; }
    onDone({
      id: "c" + Date.now(),
      name,
      email,
      phone,
      address: address.trim(),
      vendors,
      status: "Pending",
      courierEligible: false,
      operationalContact: { name: opName, email },
      billingContact: { name: billingName, email: billingEmail },
      consent: { notice: "Policy #4 Collection Notice", acceptedAt: isoNow() },
    });
  }

  return (
    <div className="modal">
      <h3>Register with Moto and Co Couriers</h3>
      {err && <div className="err">{err}</div>}
      <div className="fr">
        <div className="f"><label>Business Name</label><input value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="f"><label>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} /></div>
      </div>
      <div className="fr">
        <div className="f"><label>Operational Contact Name</label><input value={opName} onChange={e => setOpName(e.target.value)} /></div>
        <div className="f"><label>Operational Email</label><input value={email} onChange={e => setEmail(e.target.value)} type="email" /></div>
      </div>
      <div className="fr">
        <div className="f"><label>Billing Contact Name</label><input value={billingName} onChange={e => setBillingName(e.target.value)} /></div>
        <div className="f"><label>Billing Email</label><input value={billingEmail} onChange={e => setBillingEmail(e.target.value)} type="email" /></div>
      </div>
      <div className="f"><label>Delivery Address</label><input value={address} onChange={e => setAddress(e.target.value)} placeholder="Physical street address, suburb, QLD" /></div>
      <div className="f"><label>Approved Suppliers You Use</label></div>
      <div className="pills">
        {activeSuppliers(suppliers).map(v => (
          <button key={v.name} className={`pill${vendors.includes(v.name) ? " sel" : ""}`} onClick={() => toggle(v.name)}>{v.name}</button>
        ))}
      </div>
      <label style={{ display: "flex", gap: ".5rem", alignItems: "flex-start", color: T.mu, fontSize: ".78rem", lineHeight: 1.4, margin: ".8rem 0" }}>
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ width: "auto", marginTop: ".15rem" }} />
        I acknowledge the collection notice and consent record for account setup.
      </label>
      <button className="btn b-acc" onClick={submit}>Submit for Admin Activation</button>
      <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={onCancel}>Cancel</button>
    </div>
  );
}

// ─── CLIENT PORTAL ───────────────────────────────────────────────────────────
function PendingActivationPortal({ user, suppliers, onLogout }) {
  const requestedSuppliers = activeSuppliers(suppliers).filter(supplier => (user.vendors || []).includes(supplier.name));

  return (
    <>
      <div className="nav">
        <div className="logo"><img src="/moto-and-co-couriers-logo.png" alt="Moto and Co Couriers" /><span className="logo-sub">Pending activation</span></div>
        <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
          <div className="nav-role">{user.name}</div>
          <button className="nav-out" onClick={onLogout}>Log out</button>
        </div>
      </div>
      <div className="main">
        <div className="card" style={{ borderColor: T.acc }}>
          <div className="card-head">
            <div className="card-title">Account pending Admin activation</div>
            <span className="badge b-pending">Pending</span>
          </div>
          <div style={{ fontSize: ".84rem", color: T.mu, marginTop: ".5rem" }}>
            Pickup requests are locked while your account is under Admin review. Review target is 3 business days; log back in to check your status.
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: ".6rem" }}>Submitted Account Details</div>
          <div className="meta">
            <span>{user.name}</span>
            <span>{user.email}</span>
            <span>{user.phone || "Phone not recorded"}</span>
            <span>{user.address}</span>
          </div>
          <hr className="dvd" />
          <div style={{ fontSize: ".8rem", color: T.mu, marginBottom: ".35rem" }}>Operational: {user.operationalContact?.name || user.name} ({user.operationalContact?.email || user.email})</div>
          <div style={{ fontSize: ".8rem", color: T.mu, marginBottom: ".35rem" }}>Billing: {user.billingContact?.name || "Not recorded"} ({user.billingContact?.email || "Not recorded"})</div>
          <div style={{ fontSize: ".8rem", color: T.mu }}>Collection notice: {user.consent?.acceptedAt ? `Acknowledged ${new Date(user.consent.acceptedAt).toLocaleDateString("en-AU")}` : "Not recorded"}</div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: ".6rem" }}>Requested Supplier Access</div>
          {requestedSuppliers.length === 0 ? (
            <div className="empty">No supplier access was selected.</div>
          ) : (
            requestedSuppliers.map(supplier => (
              <div key={supplier.id || supplier.name} className="meta" style={{ marginBottom: ".35rem" }}>
                <span>{supplier.name}</span>
                <span>{supplier.address}</span>
                <span>{supplier.pickupWindow}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function InvoicePreviewModal({ invoice, client, notices = [], onClose, onRaiseQuery }) {
  const lines = invoice?.lines || [];
  const subtotal = Number(invoice?.subtotal ?? lines.reduce((sum, line) => sum + Number(line.amount || 0), 0));
  const gst = Number(invoice?.gst ?? Math.round(subtotal * 0.1 * 100) / 100);
  const total = Number(invoice?.total ?? subtotal + gst);
  const issueDate = invoice?.createdAt ? fmtFullDate(isoDate(invoice.createdAt)) : "Not recorded";
  const dueDate = invoice?.dueDate ? fmtFullDate(invoice.dueDate) : "Not set";
  const invoiceNotices = notices.filter(notice => notice.invoiceId === invoice?.id);

  if (!invoice) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: "860px" }} onClick={e => e.stopPropagation()}>
        <h3>Invoice Preview - {invoice.id}</h3>
        <div className="card" style={{ marginBottom: ".8rem" }}>
          <div className="card-head">
            <div>
              <div className="card-title">{invoice.clientName || client?.name || "Customer account"}</div>
              <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".25rem" }}>{client?.address || "Delivery address not recorded"}</div>
            </div>
            <span className={`badge ${invoice.status === "Paid" ? "b-done" : invoice.status === "Overdue" ? "b-cancelled" : "b-pending"}`}>{invoice.status}</span>
          </div>
          <div className="meta" style={{ marginTop: ".6rem" }}>
            <span>Billing: {invoice.billingEmail || client?.billingContact?.email || client?.email || "Not recorded"}</span>
            <span>Issued {issueDate}</span>
            <span>Due {dueDate}</span>
            <span>Terms 7 days</span>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="tbl">
            <thead><tr><th>Work Item</th><th>Supplier</th><th>Description</th><th>Proof</th><th>Amount</th></tr></thead>
            <tbody>
              {lines.map(line => (
                <tr key={line.orderId}>
                  <td>{line.orderId}</td>
                  <td>{line.vendor}</td>
                  <td>{line.description}</td>
                  <td>{line.proofId || "Proof pending"}</td>
                  <td>${Number(line.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="meta">
            <span>Subtotal ${subtotal.toFixed(2)}</span>
            <span>GST ${gst.toFixed(2)}</span>
            <span>Total ${total.toFixed(2)}</span>
          </div>
          {invoice.paymentEvidence && (
            <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".6rem" }}>
              Payment evidence: {invoice.paymentEvidence}
            </div>
          )}
          {invoiceIsApproved(invoice) ? (
            <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".6rem" }}>
              SOP-BIL-04 approval: {fmtFullDate(isoDate(invoice.invoiceApprovedAt))}; note {invoice.invoiceApprovalNote || "not recorded"}.
            </div>
          ) : (
            <div style={{ fontSize: ".82rem", color: T.acc, marginTop: ".6rem" }}>
              SOP-BIL-04 approval is required before dispatch.
            </div>
          )}
          {invoice.dispatchRecordedAt && (
            <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".6rem" }}>
              Dispatch record: {invoice.dispatchChannel === "local_record_only" ? "local record only" : invoice.dispatchChannel}; recipient {invoice.dispatchRecipient || invoice.billingEmail}; external status {invoice.dispatchExternalStatus || "not recorded"}; note {invoice.dispatchNote || "not recorded"}.
            </div>
          )}
          {invoiceNotices.map(notice => (
            <div key={notice.id} style={{ fontSize: ".82rem", color: T.mu, marginTop: ".6rem" }}>
              {billingNoticeLabel(notice.noticeType)} recorded {fmtFullDate(isoDate(notice.recordedAt))}; source {billingNoticeSourceLabel(notice).toLowerCase()}; channel {billingNoticeChannelLabel(notice).toLowerCase()}.
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
          {onRaiseQuery && <button className="btn b-ghost" onClick={() => onRaiseQuery(invoice)}>Raise Billing Query</button>}
          <button className="btn b-acc" onClick={onClose}>Close Preview</button>
        </div>
      </div>
    </div>
  );
}

function FirstLoginSupplierSetup({ user, suppliers, onConfirm, onSupplierSetupRequest, onLogout }) {
  const activeSupplierList = activeSuppliers(suppliers);
  const activeSupplierNames = activeSupplierList.map(supplier => supplier.name);
  const initialNames = (user.vendors || []).filter(name => activeSupplierNames.includes(name));
  const [selectedNames, setSelectedNames] = useState(initialNames);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");

  function toggleSupplier(name) {
    setSelectedNames(names => names.includes(name) ? names.filter(item => item !== name) : [...names, name]);
  }

  function confirmSupplierSetup() {
    if (selectedNames.length === 0) {
      setErr("At least one approved supplier is required before booking can open.");
      return;
    }
    onConfirm({
      ...user,
      vendors: selectedNames,
      firstLoginSupplierSetupConfirmedAt: isoNow(),
      firstLoginSupplierSetupSuppliers: selectedNames,
      auditActor: "client",
      auditDetail: `${user.name} first-login supplier setup confirmed: ${selectedNames.join(", ")}`,
    });
  }

  function requestSupplierReview() {
    const cleanNote = note.trim();
    if (selectedNames.length === 0 && !cleanNote) {
      setErr("Select a supplier or add a note for Admin.");
      return;
    }
    onSupplierSetupRequest(user, {
      supplierNames: selectedNames,
      note: cleanNote || "First login supplier setup review",
    });
    setNotice("Supplier setup request sent to Admin.");
    setErr("");
    setNote("");
  }

  return (
    <>
      <div className="nav">
        <div className="logo"><img src="/moto-and-co-couriers-logo.png" alt="Moto and Co Couriers" /><span className="logo-sub">Supplier setup</span></div>
        <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
          <div className="nav-role">{user.name}</div>
          <button className="nav-out" onClick={onLogout}>Log out</button>
        </div>
      </div>
      <div className="main">
        <div className="card" style={{ borderColor: T.acc }}>
          <div className="card-head">
            <div className="card-title">Confirm Supplier Access</div>
            <span className="badge b-pending">First Login</span>
          </div>
          <div style={{ fontSize: ".84rem", color: T.mu, marginTop: ".5rem" }}>
            Confirm the approved supplier links for this workshop before opening pickup requests.
          </div>
        </div>

        {err && <div className="err">{err}</div>}
        {notice && <div className="card" style={{ fontSize: ".82rem", color: T.mu }}>{notice}</div>}

        <div className="card">
          <div className="card-title" style={{ marginBottom: ".6rem" }}>Approved Supplier Links</div>
          <div className="pills">
            {activeSupplierList.map(supplier => (
              <button key={supplier.id || supplier.name} className={`pill${selectedNames.includes(supplier.name) ? " sel" : ""}`} onClick={() => toggleSupplier(supplier.name)}>
                {selectedNames.includes(supplier.name) ? "Selected: " : "Add: "}{supplier.name}
              </button>
            ))}
          </div>
          {selectedNames.length > 0 ? (
            <div className="meta" style={{ marginTop: ".8rem" }}>
              {activeSupplierList.filter(supplier => selectedNames.includes(supplier.name)).map(supplier => (
                <span key={supplier.id || supplier.name}>{supplier.name} - {supplier.pickupWindow}</span>
              ))}
            </div>
          ) : (
            <div className="empty" style={{ marginTop: ".8rem" }}>No supplier links selected.</div>
          )}
          <button className="btn b-acc" style={{ marginTop: ".9rem" }} onClick={confirmSupplierSetup}>Confirm Supplier Access</button>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: ".5rem" }}>Supplier Review Request</div>
          <div className="f"><label>Admin note</label><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Supplier access to add or review" /></div>
          <button className="btn b-ghost" onClick={requestSupplierReview}>Send to Admin</button>
        </div>
      </div>
    </>
  );
}

function ClientPortal({ user, orders, suppliers, invoices, billingNotices, operationalNotices = [], proofs = [], exceptions = [], initialView = "orders", startNewPickup = false, onNewOrder, onCancelOrder, onCancellationRequest, onDispute, onBillingDispute, onSupplierSetupRequest, onUpdateClient, onLogout }) {
  const [view, setView] = useState(initialView || "orders");
  const [newOrder, setNewOrder] = useState(false);
  const [conNote, setConNote] = useState(""); const [vendor, setVendor] = useState(""); const [notes, setNotes] = useState(""); const [err, setErr] = useState("");
  const [requestedDate, setRequestedDate] = useState(todayBrisbane());
  const [trackingQuery, setTrackingQuery] = useState("");
  const [disputeOrder, setDisputeOrder] = useState(null);
  const [disputeReason, setDisputeReason] = useState("goods_not_received");
  const [disputeDeliveryDate, setDisputeDeliveryDate] = useState("");
  const [disputeNote, setDisputeNote] = useState("");
  const [billingInvoice, setBillingInvoice] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [billingDisputeLineId, setBillingDisputeLineId] = useState("");
  const [billingDisputeDeliveryDate, setBillingDisputeDeliveryDate] = useState("");
  const [billingDisputeNote, setBillingDisputeNote] = useState("");
  const [cancellationOrder, setCancellationOrder] = useState(null);
  const [cancellationNote, setCancellationNote] = useState("");
  const [supplierRequestNames, setSupplierRequestNames] = useState([]);
  const [supplierRequestNote, setSupplierRequestNote] = useState("");

  const myOrders = orders.filter(o => o.clientId === user.id);
  const myInvoices = invoices.filter(invoice => invoice.clientId === user.id);
  const myBillingNotices = (billingNotices || []).filter(notice => notice.clientId === user.id);
  const myBillingQueryRows = billingQueryRowsForInvoices(myInvoices, exceptions);
  const myOperationalNotices = (operationalNotices || [])
    .filter(notice => notice.clientId === user.id)
    .slice()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const accountStatus = user.status || "Active";
  const canRequest = accountStatus === "Active" && (user.courierEligible ?? true);
  const activeSupplierList = activeSuppliers(suppliers);
  const linkedSuppliers = activeSupplierList.filter(v => (user.vendors || []).includes(v.name));
  const supplierSetupComplete = Boolean(user.firstLoginSupplierSetupConfirmedAt || user.supplierSetupConfirmedAt);
  const canBook = canRequest && supplierSetupComplete && linkedSuppliers.length > 0;
  const accountBlockMessage = accountStatus === "Closed"
    ? "Policy #23 account termination is permanent in this local build. Existing delivery, billing, and retained records remain visible; new pickup requests require a new account agreement."
    : accountStatus === "Suspended"
      ? "Policy #23 suspended accounts can log in, but new pickup requests are blocked until Admin records reinstatement evidence."
      : "Pickup requests are blocked until Admin activates courier eligibility. Existing deliveries and history remain visible.";

  useEffect(() => {
    if (initialView) setView(initialView);
  }, [initialView, user.id]);

  useEffect(() => {
    if (startNewPickup && canBook) setNewOrder(true);
  }, [startNewPickup, canBook, user.id]);

  if (accountStatus === "Pending") {
    return <PendingActivationPortal user={user} suppliers={suppliers} onLogout={onLogout} />;
  }
  if (canRequest && !supplierSetupComplete) {
    return <FirstLoginSupplierSetup user={user} suppliers={suppliers} onConfirm={onUpdateClient} onSupplierSetupRequest={onSupplierSetupRequest} onLogout={onLogout} />;
  }

  function submit() {
    if (!canRequest) { setErr("Account must be active before pickup requests can be submitted"); return; }
    if (!supplierSetupComplete) { setErr("Supplier access must be confirmed before pickup requests can be submitted"); return; }
    if (linkedSuppliers.length === 0) { setErr("Admin must approve supplier access before pickup requests can be submitted"); return; }
    if (!conNote || !vendor) { setErr("Con note and supplier required"); return; }
    const schedule = applyCutoff(requestedDate);
    onNewOrder({ id: uid(), clientId: user.id, clientName: user.name, vendor, conNote, dropAddress: user.address, notes, status: "Pending", requestedDate, actualRunDate: schedule.actualRunDate, cutoffApplied: schedule.cutoffApplied, scheduleAdjusted: schedule.scheduleAdjusted, scheduleAdjustmentReason: schedule.scheduleAdjustmentReason, date: schedule.actualRunDate, submittedAt: isoNow(), driverId: null, price: null, recvName: "", sig: "" });
    setConNote(""); setVendor(""); setNotes(""); setRequestedDate(todayBrisbane()); setNewOrder(false); setErr("");
  }

  function statusBadge(s) {
    const cls = { Pending: "b-pending", Submitted: "b-done", Scheduled: "b-pending", "Cut-off Adjusted": "b-pending", "En Route": "b-enroute", "Picked Up": "b-enroute", Delivered: "b-done", Captured: "b-done", "No POD": "b-pending", "No Pickup": "b-cancelled", "Brought Forward": "b-pending", "Failed Delivery": "b-cancelled", Cancelled: "b-cancelled" };
    return <span className={`badge ${cls[s] || "b-pending"}`}>{s}</span>;
  }

  function proofForOrder(order) {
    return (proofs || []).find(proof => proof.orderId === order.id || proof.id === order.proofId);
  }

  function issuesForOrder(order) {
    return (exceptions || []).filter(item => item.orderId === order.id);
  }

  function trackingRows(order) {
    const proof = proofForOrder(order);
    const pickupStatus = order.pickupOutcome || (["En Route", "Delivered", "Failed Delivery"].includes(order.status) ? "Picked Up" : order.status === "No Pickup" ? "No Pickup" : "Pending");
    const pickupRecord = order.pickupConfirmedAt || order.pickupOutcomeAt;
    const deliveryRecord = order.deliveredAt || (order.status === "Delivered" ? (proof?.deliveredAt || proof?.capturedAt) : "") || order.failedDeliveryAt;
    return [
      {
        step: "Pickup request",
        state: "Submitted",
        record: fmtFullDate(isoDate(order.submittedAt || order.requestedDate || order.date)),
        evidence: `Con note ${order.conNote}; supplier ${order.vendor}`,
      },
      {
        step: "Run date",
        state: (order.scheduleAdjusted || order.cutoffApplied) ? (order.cutoffApplied ? "Cut-off Adjusted" : "Schedule Adjusted") : "Scheduled",
        record: fmtFullDate(order.actualRunDate || order.date),
        evidence: (order.scheduleAdjusted || order.cutoffApplied) ? `Requested ${fmtFullDate(order.requestedDate)}; ${runDateAdjustmentLabel(order.scheduleAdjustmentReason)}` : "Original requested date retained",
      },
      {
        step: "Pickup",
        state: pickupStatus,
        record: pickupRecord ? fmtFullDate(isoDate(pickupRecord)) : "Not recorded",
        evidence: order.pickupItemType ? `${order.pickupItemType}${order.pickupItemQty ? ` x ${order.pickupItemQty}` : ""}` : (order.pickupNote || "Pickup evidence pending"),
      },
      {
        step: "Delivery",
        state: order.status === "Delivered" ? "Delivered" : order.status === "Failed Delivery" ? "Failed Delivery" : order.status === "En Route" ? "En Route" : order.status === "Brought Forward" ? "Brought Forward" : order.status === "No Pickup" ? "No Pickup" : "Pending",
        record: deliveryRecord ? fmtFullDate(isoDate(deliveryRecord)) : "Not delivered",
        evidence: order.failedDeliveryReason || order.failedDeliveryHandlingNote || (order.status === "Delivered" ? `Receiver ${order.recvName || proof?.receiverName || "recorded"}` : "Delivery proof pending"),
      },
      {
        step: "Proof",
        state: proof ? "Captured" : "No POD",
        record: proof ? fmtFullDate(isoDate(proof.deliveredAt || proof.capturedAt)) : "No POD record",
        evidence: proof ? `Receiver ${proof.receiverName}; ${proofStorageLabel(proof)}` : "Receiver name and signature required before Delivered",
      },
    ];
  }

  function openDeliveryDispute(order) {
    setDisputeOrder(order);
    setDisputeReason("goods_not_received");
    setDisputeDeliveryDate(isoDate(order.deliveredAt || order.failedDeliveryAt || order.actualRunDate || order.date));
    setDisputeNote("");
    setErr("");
  }

  function openBillingDispute(invoice) {
    const lineId = invoice?.lines?.[0]?.orderId || "";
    setBillingInvoice(invoice);
    setBillingDisputeLineId(lineId);
    setBillingDisputeDeliveryDate(policy18BillingLineDate(invoice, orders, lineId));
    setBillingDisputeNote("");
    setErr("");
  }

  const trackingQueryValue = trackingQuery.trim().toLowerCase();
  const trackingOrders = trackingQueryValue
    ? myOrders.filter(order => [order.id, order.conNote, order.vendor, order.status].some(value => String(value || "").toLowerCase().includes(trackingQueryValue)))
    : myOrders;

  function raiseDispute() {
    if (!disputeOrder) return;
    if (!disputeReason) { setErr("Policy #18 dispute type required"); return; }
    if (!disputeDeliveryDate) { setErr("Policy #18 delivery date in question required"); return; }
    if (!disputeNote.trim()) { setErr("Dispute description required"); return; }
    onDispute(disputeOrder, {
      reason: disputeReason,
      deliveryDate: disputeDeliveryDate,
      note: disputeNote.trim(),
      window: policy18DisputeWindowForOrder(disputeOrder, myInvoices),
    });
    setDisputeOrder(null);
    setDisputeReason("goods_not_received");
    setDisputeDeliveryDate("");
    setDisputeNote("");
    setErr("");
  }

  function raiseBillingDispute() {
    if (!billingInvoice) return;
    if (!billingDisputeLineId) { setErr("Policy #18 invoice line or order reference required"); return; }
    if (!billingDisputeDeliveryDate) { setErr("Policy #18 delivery date in question required"); return; }
    if (!billingDisputeNote.trim()) { setErr("Billing query description required"); return; }
    onBillingDispute(billingInvoice, {
      reason: "incorrect_charge",
      orderId: billingDisputeLineId,
      deliveryDate: billingDisputeDeliveryDate,
      note: billingDisputeNote.trim(),
      window: policy18DisputeWindowForInvoice(billingInvoice),
    }, "client_operational");
    setBillingInvoice(null);
    setBillingDisputeLineId("");
    setBillingDisputeDeliveryDate("");
    setBillingDisputeNote("");
    setErr("");
  }

  function cancelOrder(order) {
    const state = cancellationState(order);
    if (!state.canSelfCancel) { setErr(state.reason); return; }
    onCancelOrder(order, "Client self-service before Policy #14 cut-off");
    setErr("");
  }

  function submitCancellationRequest() {
    if (!cancellationOrder) return;
    const state = cancellationState(cancellationOrder);
    if (!state.canRequestAdminReview) { setErr(state.reason); return; }
    if (!cancellationNote.trim()) { setErr("Cancellation review note required"); return; }
    onCancellationRequest(cancellationOrder, cancellationNote.trim());
    setCancellationOrder(null);
    setCancellationNote("");
    setErr("");
  }

  function toggleSupplierRequest(name) {
    setSupplierRequestNames(names => names.includes(name) ? names.filter(item => item !== name) : [...names, name]);
  }

  function submitSupplierSetupRequest() {
    const note = supplierRequestNote.trim();
    if (supplierRequestNames.length === 0 && !note) { setErr("Select a supplier or add a note for Admin"); return; }
    onSupplierSetupRequest(user, { supplierNames: supplierRequestNames, note });
    setSupplierRequestNames([]);
    setSupplierRequestNote("");
    setErr("");
  }

  return (
    <>
      <div className="nav">
        <div className="logo"><img src="/moto-and-co-couriers-logo.png" alt="Moto and Co Couriers" /><span className="logo-sub">Client portal</span></div>
        <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
          <div className="nav-role">{user.name}</div>
          <button className="nav-out" onClick={onLogout}>Log out</button>
        </div>
      </div>
      <div className="main">
        <div className="tabs" style={{ marginBottom: "1.2rem" }}>
          <button className={`tab${view === "orders" ? " active" : ""}`} onClick={() => setView("orders")}>My Orders</button>
          <button className={`tab${view === "tracking" ? " active" : ""}`} onClick={() => setView("tracking")}>Tracking ({myOrders.length})</button>
          <button className={`tab${view === "updates" ? " active" : ""}`} onClick={() => setView("updates")}>Updates ({myOperationalNotices.length})</button>
          <button className={`tab${view === "vendors" ? " active" : ""}`} onClick={() => setView("vendors")}>Suppliers</button>
          <button className={`tab${view === "billing" ? " active" : ""}`} onClick={() => setView("billing")}>Billing ({myInvoices.length})</button>
          <button className={`tab${view === "profile" ? " active" : ""}`} onClick={() => setView("profile")}>Profile</button>
        </div>

        {view === "orders" && (
          <>
            <div className="sh">
              <h2>My Deliveries</h2>
              <button className="btn b-acc b-sm" disabled={!canBook} onClick={() => setNewOrder(true)}>+ New Pickup</button>
            </div>
            {!canRequest && (
              <div className="card" style={{ borderColor: T.acc }}>
                <div className="card-title">Account {accountStatus}</div>
                <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".35rem" }}>
                  {accountBlockMessage}
                </div>
                {user.terminationRecord && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Termination: {user.terminationRecord.groundLabel || policy23TerminationGroundLabel(user.terminationRecord.ground)}; effective {fmtFullDate(user.terminationRecord.effectiveDate)}.
                  </div>
                )}
              </div>
            )}
            {canRequest && linkedSuppliers.length === 0 && (
              <div className="card" style={{ borderColor: T.acc }}>
                <div className="card-title">Supplier access required</div>
                <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".35rem" }}>
                  Admin approval is required before pickup requests can be raised against the controlled supplier list.
                </div>
                <button className="btn b-acc b-sm" style={{ marginTop: ".8rem" }} onClick={() => setView("vendors")}>Request Supplier Setup</button>
              </div>
            )}
            {myOrders.length === 0 && <div className="empty">No orders yet — create one above.</div>}
            {myOrders.map(o => (
              <div className="card" key={o.id}>
                <div className="card-head"><div className="card-title">{o.id} — {o.vendor}</div>{statusBadge(o.status)}</div>
                <div className="meta">
                  <span>📋 {o.conNote}</span>
                  <span>📍 {o.dropAddress}</span>
                  <span>📅 Run {fmt(o.actualRunDate || o.date)}</span>
                  {(o.scheduleAdjusted || o.cutoffApplied) && <span>{runDateAdjustmentLabel(o.scheduleAdjustmentReason)}</span>}
                  {o.price && <span>💰 ${o.price}</span>}
                </div>
                {o.notes && <div style={{ fontSize: ".8rem", color: T.mu }}>{o.notes}</div>}
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".8rem" }}>
                  <button className="btn b-ghost b-sm" onClick={() => { setTrackingQuery(o.id); setView("tracking"); }}>Track</button>
                  {cancellationState(o).canSelfCancel && (
                    <button className="btn b-red b-sm" onClick={() => cancelOrder(o)}>Cancel Order</button>
                  )}
                  {cancellationState(o).canRequestAdminReview && (
                    <button className="btn b-ghost b-sm" onClick={() => { setCancellationOrder(o); setCancellationNote(""); setErr(""); }}>Request Cancellation Review</button>
                  )}
                </div>
                {!["Cancelled", "Delivered", "Failed Delivery", "No Pickup"].includes(o.status) && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Policy #14: {cancellationState(o).reason}.
                  </div>
                )}
                {["Delivered", "Failed Delivery", "No Pickup"].includes(o.status) && (
                  <>
                    <hr className="dvd" />
                    <button className="btn b-ghost b-sm" onClick={() => openDeliveryDispute(o)}>Raise Dispute</button>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {view === "tracking" && (
          <>
            <div className="sh"><h2>Tracking</h2></div>
            <div className="card">
              <div className="f" style={{ marginBottom: 0 }}>
                <label>Tracking reference</label>
                <input value={trackingQuery} onChange={e => setTrackingQuery(e.target.value)} placeholder="Order ID, con note, supplier, or status" />
              </div>
            </div>
            {trackingOrders.length === 0 && <div className="empty">No matching delivery record for this account.</div>}
            {trackingOrders.slice().reverse().map(order => {
              const proof = proofForOrder(order);
              const linkedIssues = issuesForOrder(order);
              return (
                <div className="card" key={order.id}>
                  <div className="card-head">
                    <div className="card-title">{order.id} - {order.vendor}</div>
                    {statusBadge(order.status)}
                  </div>
                  <div className="meta">
                    <span>Con note {order.conNote}</span>
                    <span>Run {fmt(order.actualRunDate || order.date)}</span>
                    <span>{order.dropAddress}</span>
                    {order.driverName && <span>Driver {order.driverName}</span>}
                    {order.vehicleName && <span>Vehicle {order.vehicleName}</span>}
                  </div>
                  {linkedIssues.length > 0 && (
                    <div style={{ fontSize: ".78rem", color: T.mu, marginBottom: ".65rem" }}>
                      Admin queue: {linkedIssues.map(issue => `${issue.type} - ${issue.status}`).join("; ")}
                    </div>
                  )}
                  {order.policy18LastOutcome && (
                    <div style={{ fontSize: ".78rem", color: T.mu, marginBottom: ".65rem" }}>
                      Policy #18 outcome recorded {fmtFullDate(isoDate(order.policy18LastOutcomeAt))}: {order.policy18LastOutcome}.
                      {policy18RemedyLine(order) && <><br />{policy18RemedyLine(order)}</>}
                    </div>
                  )}
                  <div className="table-wrap">
                    <table className="tbl">
                      <thead><tr><th>Step</th><th>State</th><th>Record</th><th>Evidence</th></tr></thead>
                      <tbody>
                        {trackingRows(order).map(row => (
                          <tr key={row.step}>
                            <td>{row.step}</td>
                            <td>{statusBadge(row.state)}</td>
                            <td>{row.record}</td>
                            <td>{row.evidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {proof && (
                    <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".65rem" }}>
                      POD retained under Policy #5 until {fmtFullDate(addYears(isoDate(proof.deliveredAt || proof.capturedAt), 7))}.
                    </div>
                  )}
                  {["Delivered", "Failed Delivery", "No Pickup"].includes(order.status) && (
                    <button className="btn b-ghost b-sm" style={{ marginTop: ".8rem" }} onClick={() => openDeliveryDispute(order)}>Raise Dispute</button>
                  )}
                </div>
              );
            })}
          </>
        )}

        {view === "updates" && (
          <>
            <div className="sh"><h2>Operational Updates</h2></div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: ".45rem" }}>Local Outbox</div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Updates are recorded locally for the Operational Contact. Production email, SMS, or in-app delivery is still unconfigured.
              </div>
            </div>
            {myOperationalNotices.length === 0 && <div className="empty">No operational updates recorded for this account yet.</div>}
            {myOperationalNotices.map(notice => (
              <div className="card" key={notice.id}>
                <div className="card-head">
                  <div className="card-title">{notice.subject}</div>
                  <span className="badge b-pending">{notice.channel === "local_record_only" ? "Local" : notice.channel}</span>
                </div>
                <div className="meta">
                  <span>{notice.orderId || "Account"}</span>
                  <span>{operationalNoticeLabel(notice.noticeType)}</span>
                  <span>{fmtFullDate(isoDate(notice.createdAt))}</span>
                  <span>{notice.externalDeliveryStatus || "not recorded"}</span>
                </div>
                <div style={{ fontSize: ".82rem", color: T.mu }}>{notice.message}</div>
                {String(notice.orderId || "").startsWith("MC-") && (
                  <button className="btn b-ghost b-sm" style={{ marginTop: ".8rem" }} onClick={() => { setTrackingQuery(notice.orderId); setView("tracking"); }}>Track Order</button>
                )}
              </div>
            ))}
          </>
        )}

        {view === "vendors" && (
          <>
            <h2 style={{ marginBottom: "1rem" }}>Approved Suppliers</h2>
            {linkedSuppliers.length === 0 && <div className="empty">No approved suppliers yet.</div>}
            {linkedSuppliers.map(v => (
              <div className="card" key={v.name}>
                <div className="card-title" style={{ marginBottom: ".4rem" }}>{v.name}</div>
                <div className="meta"><span>📍 {v.address}</span><span>📞 {v.phone}</span><span>{v.pickupWindow}</span></div>
              </div>
            ))}
            <div className="card">
              <div className="card-title" style={{ marginBottom: ".4rem" }}>Supplier Setup Request</div>
              {err && <div className="err">{err}</div>}
              <div className="meta" style={{ marginBottom: ".8rem" }}>
                <span>Controlled supplier list</span>
                <span>Admin approval required</span>
              </div>
              <div className="pills">
                {activeSupplierList.map(supplier => (
                  <button key={supplier.id || supplier.name} className={`pill${supplierRequestNames.includes(supplier.name) ? " sel" : ""}`} onClick={() => toggleSupplierRequest(supplier.name)}>
                    {supplier.name}
                  </button>
                ))}
              </div>
              <div className="f"><label>Request note</label><textarea value={supplierRequestNote} onChange={e => setSupplierRequestNote(e.target.value)} placeholder="Supplier access to add or review" /></div>
              <button className="btn b-acc" onClick={submitSupplierSetupRequest}>Send to Admin</button>
            </div>
          </>
        )}

        {view === "billing" && (
          <>
            <div className="sh"><h2>Billing</h2></div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: ".4rem" }}>Billing Contact</div>
              <div className="meta">
                <span>{user.billingContact?.name || user.name}</span>
                <span>{user.billingContact?.email || user.email}</span>
                <span>Terms 7 days from invoice date</span>
              </div>
            </div>
            {(myBillingNotices.length > 0 || user.terminationRecord) && (
              <div className="card">
                <div className="card-title" style={{ marginBottom: ".45rem" }}>Account Notices</div>
                {myBillingNotices.map(notice => (
                  <div key={notice.id} style={{ marginBottom: ".55rem" }}>
                    <div className="meta" style={{ marginBottom: ".25rem" }}>
                      <span>{billingNoticeReference(notice)}</span>
                      <span>{billingNoticeLabel(notice.noticeType)}</span>
                      <span>Recorded {fmtFullDate(isoDate(notice.recordedAt))}</span>
                      <span>{billingNoticeChannelLabel(notice)}</span>
                      <span>{billingNoticeSourceLabel(notice)}</span>
                    </div>
                    {notice.note && <div style={{ fontSize: ".78rem", color: T.mu }}>{notice.note}</div>}
                  </div>
                ))}
                {user.terminationRecord && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Termination: {user.terminationRecord.groundLabel || policy23TerminationGroundLabel(user.terminationRecord.ground)}; effective {fmtFullDate(user.terminationRecord.effectiveDate)}. {user.terminationRecord.outstandingInvoiceNote}
                  </div>
                )}
              </div>
            )}
            {myBillingQueryRows.length > 0 && (
              <div className="card">
                <div className="card-title" style={{ marginBottom: ".45rem" }}>Billing Query Status</div>
                {myBillingQueryRows.map(({ exception, invoice }) => (
                  <div key={exception.id} style={{ marginBottom: ".65rem" }}>
                    <div className="meta" style={{ marginBottom: ".25rem" }}>
                      <span>{invoice.id}</span>
                      <span>{invoice.status}</span>
                      <span className={`badge ${exceptionStatusBadgeClass(exception.status)}`}>{exception.status}</span>
                      <span>{exception.createdAt ? new Date(exception.createdAt).toLocaleString("en-AU") : "Not dated"}</span>
                    </div>
                    <div style={{ fontSize: ".78rem", color: T.mu }}>{exception.note}</div>
                    {exception.investigation && (
                      <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>
                        Admin investigation: {exception.investigation.outcome}; {exception.investigation.note}
                        {exception.investigation.policy18RemedyRequired && <><br />{exception.investigation.policy18RemedyLabel || "Policy #18 remedy required"} - {exception.investigation.policy18RemedyStatus || "Required"}{exception.investigation.policy18RemedyDueDate ? `, due ${fmtFullDate(exception.investigation.policy18RemedyDueDate)}` : ""}.</>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {myInvoices.length === 0 && <div className="empty">No invoice batches available yet.</div>}
            {myInvoices.slice().reverse().map(invoice => (
              <div className="card" key={invoice.id}>
                <div className="card-head">
                  <div className="card-title">{invoice.id}</div>
                  <span className={`badge ${invoice.status === "Paid" ? "b-done" : invoice.status === "Overdue" ? "b-cancelled" : "b-pending"}`}>{invoice.status}</span>
                </div>
                <div className="meta">
                  <span>Billing: {invoice.billingEmail}</span>
                  <span>Due {fmt(invoice.dueDate)}</span>
                  <span>{invoice.lines.length} lines</span>
                  <span>Total ${Number(invoice.total || 0).toFixed(2)}</span>
                </div>
                {myBillingNotices.filter(notice => notice.invoiceId === invoice.id).map(notice => (
                  <div key={notice.id} style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    {billingNoticeLabel(notice.noticeType)} recorded for Billing and Operational contacts on {fmtFullDate(isoDate(notice.recordedAt))}. External delivery channel remains unconfirmed.
                  </div>
                ))}
                {invoice.status === "Paid" && invoice.paymentEvidence && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Payment evidence recorded {fmtFullDate(isoDate(invoice.paymentRecordedAt || invoice.paidAt))}: {invoice.paymentEvidence}
                  </div>
                )}
                {invoice.dispatchRecordedAt && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Dispatch recorded {fmtFullDate(isoDate(invoice.dispatchRecordedAt))}: {invoice.dispatchChannel === "local_record_only" ? "local record only" : invoice.dispatchChannel}; recipient {invoice.dispatchRecipient || invoice.billingEmail}; external status {invoice.dispatchExternalStatus || "not recorded"}.
                  </div>
                )}
                {invoice.policy18LastOutcome && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Policy #18 billing dispute outcome recorded {fmtFullDate(isoDate(invoice.policy18LastOutcomeAt))}: {invoice.policy18LastOutcome}.
                    {policy18RemedyLine(invoice) && <><br />{policy18RemedyLine(invoice)}</>}
                  </div>
                )}
                <hr className="dvd" />
                {invoice.lines.map(line => (
                  <div key={line.orderId} className="meta">
                    <span>{line.orderId}</span>
                    <span>{line.vendor}</span>
                    <span>{line.description}</span>
                    <span>${Number(line.amount || 0).toFixed(2)}</span>
                    <span>{line.proofId ? "Proof captured" : "Proof pending"}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".8rem" }}>
                  <button className="btn b-acc b-sm" onClick={() => setInvoicePreview(invoice)}>Preview Invoice</button>
                  <button className="btn b-ghost b-sm" onClick={() => openBillingDispute(invoice)}>Raise Billing Query</button>
                </div>
              </div>
            ))}
          </>
        )}

        {view === "profile" && (
          <>
            <h2 style={{ marginBottom: "1rem" }}>Your Profile</h2>
            <div className="card">
              <div className="card-title" style={{ marginBottom: ".6rem" }}>{user.name}</div>
              <div className="meta"><span>✉️ {user.email}</span><span>📞 {user.phone}</span><span>📍 {user.address}</span><span>Status: {accountStatus}</span></div>
              <hr className="dvd" />
              <div style={{ fontSize: ".8rem", color: T.mu, marginBottom: ".35rem" }}>Operational: {user.operationalContact?.name || user.name} ({user.operationalContact?.email || user.email})</div>
              <div style={{ fontSize: ".8rem", color: T.mu, marginBottom: ".35rem" }}>Billing: {user.billingContact?.name || "Not recorded"} ({user.billingContact?.email || "Not recorded"})</div>
              <div style={{ fontSize: ".8rem", color: T.mu, marginBottom: ".35rem" }}>Approved suppliers: {user.vendors.join(", ")}</div>
              <div style={{ fontSize: ".8rem", color: T.mu }}>Supplier setup: {supplierSetupComplete ? `Confirmed ${new Date(user.firstLoginSupplierSetupConfirmedAt || user.supplierSetupConfirmedAt).toLocaleDateString("en-AU")}` : "Not confirmed"}</div>
            </div>
          </>
        )}

        {newOrder && (
          <div className="overlay" onClick={() => setNewOrder(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>New Delivery Order</h3>
              {err && <div className="err">{err}</div>}
              <div className="f"><label>Con Note Number</label><input value={conNote} onChange={e => setConNote(e.target.value)} placeholder="e.g. LI-4821" /></div>
              <div className="f"><label>Requested Run Date</label><input type="date" value={requestedDate} onChange={e => setRequestedDate(e.target.value)} /></div>
              <div className="f"><label>Supplier</label>
                <select value={vendor} onChange={e => setVendor(e.target.value)}>
                  <option value="">— Select supplier —</option>
                  {linkedSuppliers.map(v => <option key={v.name} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <div className="f"><label>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any delivery instructions…" /></div>
              <button className="btn b-acc" style={{ marginBottom: ".5rem" }} onClick={submit}>Submit Order</button>
              <button className="btn b-ghost" onClick={() => setNewOrder(false)}>Cancel</button>
            </div>
          </div>
        )}

        {billingInvoice && (
          <div className="overlay" onClick={() => setBillingInvoice(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Billing Query - {billingInvoice.id}</h3>
              {err && <div className="err">{err}</div>}
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{billingInvoice.status}</span>
                <span>Due {fmt(billingInvoice.dueDate)}</span>
                <span>Total ${Number(billingInvoice.total || 0).toFixed(2)}</span>
              </div>
              <div className="f"><label>Policy #18 dispute type</label><input value="Incorrect charge" disabled /></div>
              <div className="f"><label>Invoice line / order reference</label>
                <select value={billingDisputeLineId} onChange={e => {
                  const nextLineId = e.target.value;
                  setBillingDisputeLineId(nextLineId);
                  setBillingDisputeDeliveryDate(policy18BillingLineDate(billingInvoice, orders, nextLineId));
                  setErr("");
                }}>
                  <option value="">Select invoice line</option>
                  {(billingInvoice.lines || []).map(line => (
                    <option key={line.orderId} value={line.orderId}>{line.orderId} - {line.description} - ${Number(line.amount || 0).toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div className="f"><label>Delivery date in question</label><input type="date" value={billingDisputeDeliveryDate} onChange={e => { setBillingDisputeDeliveryDate(e.target.value); setErr(""); }} /></div>
              <div style={{ fontSize: ".78rem", color: T.mu, marginBottom: ".7rem" }}>
                {policy18DisputeWindowForInvoice(billingInvoice).timingLabel}. Admin response monitoring is outside this portal; this records the query timestamp and investigation evidence only.
              </div>
              <div className="f"><label>What needs investigation?</label><textarea value={billingDisputeNote} onChange={e => setBillingDisputeNote(e.target.value)} placeholder="Describe the invoice line, amount, proof, or account issue for Admin." /></div>
              <button className="btn b-acc" style={{ marginBottom: ".5rem" }} onClick={raiseBillingDispute}>Send to Admin</button>
              <button className="btn b-ghost" onClick={() => setBillingInvoice(null)}>Cancel</button>
            </div>
          </div>
        )}

        {cancellationOrder && (
          <div className="overlay" onClick={() => setCancellationOrder(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Cancellation Review - {cancellationOrder.id}</h3>
              {err && <div className="err">{err}</div>}
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{cancellationOrder.vendor}</span>
                <span>Run {fmt(cancellationOrder.actualRunDate || cancellationOrder.date)}</span>
                <span>{cancellationState(cancellationOrder).reason}</span>
              </div>
              <div className="f"><label>Reason for Admin review</label><textarea value={cancellationNote} onChange={e => setCancellationNote(e.target.value)} placeholder="Why should Admin review this post-cut-off cancellation request?" /></div>
              <button className="btn b-acc" style={{ marginBottom: ".5rem" }} onClick={submitCancellationRequest}>Send to Admin</button>
              <button className="btn b-ghost" onClick={() => setCancellationOrder(null)}>Cancel</button>
            </div>
          </div>
        )}

        {invoicePreview && (
          <InvoicePreviewModal
            invoice={invoicePreview}
            client={user}
            notices={myBillingNotices}
            onClose={() => setInvoicePreview(null)}
            onRaiseQuery={invoice => { setInvoicePreview(null); openBillingDispute(invoice); }}
          />
        )}

        {disputeOrder && (
          <div className="overlay" onClick={() => setDisputeOrder(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Raise Dispute — {disputeOrder.id}</h3>
              {err && <div className="err">{err}</div>}
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{disputeOrder.vendor}</span>
                <span>{disputeOrder.status}</span>
                <span>Run {fmt(disputeOrder.actualRunDate || disputeOrder.date)}</span>
              </div>
              <div className="f"><label>Dispute type</label>
                <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)}>
                  {POLICY18_DISPUTE_REASONS.map(reason => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
                </select>
              </div>
              <div className="f"><label>Delivery date in question</label><input type="date" value={disputeDeliveryDate} onChange={e => setDisputeDeliveryDate(e.target.value)} /></div>
              <div style={{ fontSize: ".78rem", color: T.mu, marginBottom: ".7rem" }}>
                {policy18DisputeWindowForOrder(disputeOrder, myInvoices).timingLabel}. Admin investigates using APP-DRV-003 proof records.
              </div>
              <div className="f"><label>What needs investigation?</label><textarea value={disputeNote} onChange={e => setDisputeNote(e.target.value)} placeholder="Describe the delivery or billing issue for Admin." /></div>
              <button className="btn b-acc" style={{ marginBottom: ".5rem" }} onClick={raiseDispute}>Send to Admin</button>
              <button className="btn b-ghost" onClick={() => setDisputeOrder(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── DRIVER PORTAL ────────────────────────────────────────────────────────────
function BillingContactPortal({ user, orders = [], invoices, billingNotices, operationalNotices = [], exceptions = [], onBillingDispute, onLogout }) {
  const [billingInvoice, setBillingInvoice] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [billingDisputeLineId, setBillingDisputeLineId] = useState("");
  const [billingDisputeDeliveryDate, setBillingDisputeDeliveryDate] = useState("");
  const [billingDisputeNote, setBillingDisputeNote] = useState("");
  const [err, setErr] = useState("");

  const myInvoices = invoices.filter(invoice => invoice.clientId === user.id);
  const myBillingNotices = (billingNotices || []).filter(notice => notice.clientId === user.id);
  const myBillingQueryRows = billingQueryRowsForInvoices(myInvoices, exceptions);
  const myBillingUpdates = (operationalNotices || [])
    .filter(notice => notice.clientId === user.id && notice.audience === "client_billing")
    .slice()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const billingContact = user.billingContact || { name: user.name, email: user.email };
  const overdueInvoices = myInvoices.filter(invoice => invoice.status === "Overdue");
  const accountStatus = user.status || "Active";

  function openBillingDispute(invoice) {
    const lineId = invoice?.lines?.[0]?.orderId || "";
    setBillingInvoice(invoice);
    setBillingDisputeLineId(lineId);
    setBillingDisputeDeliveryDate(policy18BillingLineDate(invoice, orders, lineId));
    setBillingDisputeNote("");
    setErr("");
  }

  function raiseBillingDispute() {
    if (!billingInvoice) return;
    if (!billingDisputeLineId) { setErr("Policy #18 invoice line or order reference required"); return; }
    if (!billingDisputeDeliveryDate) { setErr("Policy #18 delivery date in question required"); return; }
    if (!billingDisputeNote.trim()) { setErr("Billing query description required"); return; }
    onBillingDispute(billingInvoice, {
      reason: "incorrect_charge",
      orderId: billingDisputeLineId,
      deliveryDate: billingDisputeDeliveryDate,
      note: billingDisputeNote.trim(),
      window: policy18DisputeWindowForInvoice(billingInvoice),
    }, "client_billing");
    setBillingInvoice(null);
    setBillingDisputeLineId("");
    setBillingDisputeDeliveryDate("");
    setBillingDisputeNote("");
    setErr("");
  }

  return (
    <>
      <div className="nav">
        <div className="logo"><img src="/moto-and-co-couriers-logo.png" alt="Moto and Co Couriers" /><span className="logo-sub">Billing portal</span></div>
        <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
          <div className="nav-role">{billingContact.name}</div>
          <button className="nav-out" onClick={onLogout}>Log out</button>
        </div>
      </div>
      <div className="main">
        <div className="sh"><h2>Billing Workspace</h2></div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">{user.name}</div>
            <span className={`badge ${accountStatus === "Active" ? "b-done" : ["Suspended", "Closed"].includes(accountStatus) ? "b-cancelled" : "b-pending"}`}>{accountStatus}</span>
          </div>
          <div className="meta">
            <span>{billingContact.email}</span>
            <span>Terms 7 days from invoice date</span>
            <span>{myInvoices.length} invoice batches</span>
          </div>
        </div>

        {(overdueInvoices.length > 0 || myBillingNotices.length > 0 || user.suspensionRecord || user.reinstatementRecord || user.terminationRecord) && (
          <div className="card">
            <div className="card-title" style={{ marginBottom: ".45rem" }}>Account Notices</div>
            {myBillingNotices.map(notice => (
              <div key={notice.id} style={{ marginBottom: ".55rem" }}>
                <div className="meta" style={{ marginBottom: ".25rem" }}>
                  <span>{billingNoticeReference(notice)}</span>
                  <span>{billingNoticeLabel(notice.noticeType)}</span>
                  <span>Recorded {fmtFullDate(isoDate(notice.recordedAt))}</span>
                  <span>{billingNoticeChannelLabel(notice)}</span>
                  <span>{billingNoticeSourceLabel(notice)}</span>
                </div>
                {notice.note && <div style={{ fontSize: ".78rem", color: T.mu }}>{notice.note}</div>}
              </div>
            ))}
            {overdueInvoices.map(invoice => (
              <div key={invoice.id} className="meta" style={{ marginBottom: ".35rem" }}>
                <span>{invoice.id}</span>
                <span>Overdue</span>
                <span>Due {fmt(invoice.dueDate)}</span>
                <span>Total ${Number(invoice.total || 0).toFixed(2)}</span>
              </div>
            ))}
            {user.suspensionRecord && (
              <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".45rem" }}>
                Suspension: {user.suspensionRecord.reason}; notified {user.suspensionRecord.operationalContactNotified ? "Operational" : ""}{user.suspensionRecord.operationalContactNotified && user.suspensionRecord.billingContactNotified ? " + " : ""}{user.suspensionRecord.billingContactNotified ? "Billing" : ""}.
              </div>
            )}
            {user.reinstatementRecord && (
              <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".45rem" }}>
                Reinstatement evidence: {user.reinstatementRecord.evidence}
                {user.reinstatementRecord.paymentArrangement && (
                  <>
                    <br />
                    Payment arrangement: {user.reinstatementRecord.paymentArrangement.agreedAmount} due {fmtFullDate(user.reinstatementRecord.paymentArrangement.agreedPaymentDate)}; agreed by {user.reinstatementRecord.paymentArrangement.agreedByNameAndRole}.
                  </>
                )}
              </div>
            )}
            {user.terminationRecord && (
              <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".45rem" }}>
                Termination: {user.terminationRecord.groundLabel || policy23TerminationGroundLabel(user.terminationRecord.ground)}; effective {fmtFullDate(user.terminationRecord.effectiveDate)}. {user.terminationRecord.outstandingInvoiceNote}
              </div>
            )}
          </div>
        )}

        {myBillingUpdates.length > 0 && (
          <div className="card">
            <div className="card-title" style={{ marginBottom: ".45rem" }}>Billing Updates</div>
            {myBillingUpdates.map(notice => (
              <div key={notice.id} style={{ marginBottom: ".55rem" }}>
                <div className="meta" style={{ marginBottom: ".25rem" }}>
                  <span>{notice.orderId || "Account"}</span>
                  <span>{operationalNoticeLabel(notice.noticeType)}</span>
                  <span>{fmtFullDate(isoDate(notice.createdAt))}</span>
                  <span>{notice.channel === "local_record_only" ? "Local record only" : notice.channel}</span>
                  <span>{notice.externalDeliveryStatus || "not recorded"}</span>
                </div>
                <div style={{ fontSize: ".78rem", color: T.mu }}>{notice.message}</div>
              </div>
            ))}
          </div>
        )}

        {myBillingQueryRows.length > 0 && (
          <div className="card">
            <div className="card-title" style={{ marginBottom: ".45rem" }}>Billing Query Status</div>
            {myBillingQueryRows.map(({ exception, invoice }) => (
              <div key={exception.id} style={{ marginBottom: ".65rem" }}>
                <div className="meta" style={{ marginBottom: ".25rem" }}>
                  <span>{invoice.id}</span>
                  <span>{invoice.status}</span>
                  <span className={`badge ${exceptionStatusBadgeClass(exception.status)}`}>{exception.status}</span>
                  <span>{exception.createdAt ? new Date(exception.createdAt).toLocaleString("en-AU") : "Not dated"}</span>
                </div>
                <div style={{ fontSize: ".78rem", color: T.mu }}>{exception.note}</div>
                {exception.investigation && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>
                    Admin investigation: {exception.investigation.outcome}; {exception.investigation.note}
                    {exception.investigation.policy18RemedyRequired && <><br />{exception.investigation.policy18RemedyLabel || "Policy #18 remedy required"} - {exception.investigation.policy18RemedyStatus || "Required"}{exception.investigation.policy18RemedyDueDate ? `, due ${fmtFullDate(exception.investigation.policy18RemedyDueDate)}` : ""}.</>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {myInvoices.length === 0 && <div className="empty">No invoice batches available yet.</div>}
        {myInvoices.slice().reverse().map(invoice => (
          <div className="card" key={invoice.id}>
            <div className="card-head">
              <div className="card-title">{invoice.id}</div>
              <span className={`badge ${invoice.status === "Paid" ? "b-done" : invoice.status === "Overdue" ? "b-cancelled" : "b-pending"}`}>{invoice.status}</span>
            </div>
            <div className="meta">
              <span>Billing: {invoice.billingEmail}</span>
              <span>Due {fmt(invoice.dueDate)}</span>
                  <span>{invoice.lines.length} lines</span>
                  <span>Total ${Number(invoice.total || 0).toFixed(2)}</span>
                </div>
                {myBillingNotices.filter(notice => notice.invoiceId === invoice.id).map(notice => (
                  <div key={notice.id} style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    {billingNoticeLabel(notice.noticeType)} recorded for Billing and Operational contacts on {fmtFullDate(isoDate(notice.recordedAt))}. External delivery channel remains unconfirmed.
                  </div>
                ))}
                {invoice.status === "Paid" && invoice.paymentEvidence && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Payment evidence recorded {fmtFullDate(isoDate(invoice.paymentRecordedAt || invoice.paidAt))}: {invoice.paymentEvidence}
                  </div>
                )}
                {invoice.policy18LastOutcome && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Policy #18 billing dispute outcome recorded {fmtFullDate(isoDate(invoice.policy18LastOutcomeAt))}: {invoice.policy18LastOutcome}.
                    {policy18RemedyLine(invoice) && <><br />{policy18RemedyLine(invoice)}</>}
                  </div>
                )}
                <hr className="dvd" />
            {invoice.lines.map(line => (
              <div key={line.orderId} className="meta">
                <span>{line.orderId}</span>
                <span>{line.vendor}</span>
                <span>{line.description}</span>
                <span>${Number(line.amount || 0).toFixed(2)}</span>
                <span>{line.proofId ? "Proof captured" : "Proof pending"}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".8rem" }}>
              <button className="btn b-acc b-sm" onClick={() => setInvoicePreview(invoice)}>Preview Invoice</button>
              <button className="btn b-ghost b-sm" onClick={() => openBillingDispute(invoice)}>Raise Billing Query</button>
            </div>
          </div>
        ))}

        <div className="card">
          <div className="card-title" style={{ marginBottom: ".45rem" }}>Account Contacts</div>
          <div className="meta">
            <span>Operational: {user.operationalContact?.name || user.name}</span>
            <span>{user.operationalContact?.email || user.email}</span>
            <span>Billing: {billingContact.name}</span>
            <span>{billingContact.email}</span>
          </div>
        </div>

        {billingInvoice && (
          <div className="overlay" onClick={() => setBillingInvoice(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Billing Query - {billingInvoice.id}</h3>
              {err && <div className="err">{err}</div>}
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{billingInvoice.status}</span>
                <span>Due {fmt(billingInvoice.dueDate)}</span>
                <span>Total ${Number(billingInvoice.total || 0).toFixed(2)}</span>
              </div>
              <div className="f"><label>Policy #18 dispute type</label><input value="Incorrect charge" disabled /></div>
              <div className="f"><label>Invoice line / order reference</label>
                <select value={billingDisputeLineId} onChange={e => {
                  const nextLineId = e.target.value;
                  setBillingDisputeLineId(nextLineId);
                  setBillingDisputeDeliveryDate(policy18BillingLineDate(billingInvoice, orders, nextLineId));
                  setErr("");
                }}>
                  <option value="">Select invoice line</option>
                  {(billingInvoice.lines || []).map(line => (
                    <option key={line.orderId} value={line.orderId}>{line.orderId} - {line.description} - ${Number(line.amount || 0).toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div className="f"><label>Delivery date in question</label><input type="date" value={billingDisputeDeliveryDate} onChange={e => { setBillingDisputeDeliveryDate(e.target.value); setErr(""); }} /></div>
              <div style={{ fontSize: ".78rem", color: T.mu, marginBottom: ".7rem" }}>
                {policy18DisputeWindowForInvoice(billingInvoice).timingLabel}. Admin response monitoring is outside this portal; this records the query timestamp and investigation evidence only.
              </div>
              <div className="f"><label>What needs investigation?</label><textarea value={billingDisputeNote} onChange={e => setBillingDisputeNote(e.target.value)} placeholder="Describe the invoice line, amount, proof, or account issue for Admin." /></div>
              <button className="btn b-acc" style={{ marginBottom: ".5rem" }} onClick={raiseBillingDispute}>Send to Admin</button>
              <button className="btn b-ghost" onClick={() => setBillingInvoice(null)}>Cancel</button>
            </div>
          </div>
        )}
        {invoicePreview && (
          <InvoicePreviewModal
            invoice={invoicePreview}
            client={user}
            notices={myBillingNotices}
            onClose={() => setInvoicePreview(null)}
            onRaiseQuery={invoice => { setInvoicePreview(null); openBillingDispute(invoice); }}
          />
        )}
      </div>
    </>
  );
}

function DriverPortal({ user, orders, priceRules, exceptions, runClosures, onUpdateOrder, onUpdateOrders, onDeliveryProof, onException, onRunClose, onLogout }) {
  const [sel, setSel] = useState(null);
  const [step, setStep] = useState(1);
  const [typeKey, setTypeKey] = useState("");
  const [tyreQty, setTyreQty] = useState(4);
  const [recvName, setRecvName] = useState("");
  const [sig, setSig] = useState(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("active");
  const [preTrip, setPreTrip] = useState({ vehicle: false, device: false, run: false });
  const [runIssueDraft, setRunIssueDraft] = useState({ type: "Pre-Trip Defect", note: "" });
  const [pickupCapture, setPickupCapture] = useState(null);
  const [pickupRuleId, setPickupRuleId] = useState("");
  const [pickupQty, setPickupQty] = useState(4);
  const [pickupStandardsDraft, setPickupStandardsDraft] = useState({ readyBy10: false, labelled: false, packaged: false, goodsAcceptance: false, finalDecision: false, graceMinutes: 0, note: "" });
  const [supplierStopCloseoutTarget, setSupplierStopCloseoutTarget] = useState(null);
  const [supplierStopCloseoutDraft, setSupplierStopCloseoutDraft] = useState({ correctDock: false, customerListReviewed: false, noAdhocRecords: false, dockContactEngaged: false, leftDock: false, note: "" });
  const [deliverySignoffDraft, setDeliverySignoffDraft] = useState({ addressConfirmed: false, goodsMatched: false, authorisedReceiver: false, handoverConfirmed: false, priceReviewed: false, deviceSupervised: false });
  const [outcomeTarget, setOutcomeTarget] = useState(null);
  const [outcomeDraft, setOutcomeDraft] = useState({ type: "", reason: "", nextRunDate: "", handlingNote: "", noPickupCategory: "", failedDeliveryCategory: "", graceMinutes: 10, priceRuleId: "", itemQty: 1, noDetour: false, labelled: false, packaged: false });
  const [workflowNotice, setWorkflowNotice] = useState("");

  const driverRunOrders = orders.filter(o => o.driverId === user.id);
  const driverOrderIds = new Set(driverRunOrders.map(o => o.id));
  const driverSequence = order => Number(order.runSequence || 9999);
  const active = orders.filter(o => o.driverId === user.id && ["Pending", "En Route"].includes(o.status)).sort((a, b) => driverSequence(a) - driverSequence(b));
  const activeRunIds = [...new Set(active.map(order => order.runId).filter(Boolean))];
  const activeVehicles = [...new Set(active.map(order => order.vehicleName).filter(Boolean))];
  const activeRunDates = [...new Set(active.map(order => order.actualRunDate || order.date).filter(Boolean))];
  const pickupStops = orders.filter(o => o.driverId === user.id && o.status === "Pending" && !pickupAlreadyCollected(o)).sort((a, b) => driverSequence(a) - driverSequence(b));
  const deliveryOrders = orders.filter(o => o.driverId === user.id && (o.status === "En Route" || (o.status === "Pending" && pickupAlreadyCollected(o)))).sort((a, b) => driverSequence(a) - driverSequence(b));
  const deliveryStops = groupDeliveryStops(deliveryOrders);
  const supplierStopScopeOrders = orders
    .filter(o => o.driverId === user.id && o.runId && ["Pending", "No Pickup"].includes(o.status))
    .sort((a, b) => driverSequence(a) - driverSequence(b));
  const supplierGroups = Object.values(supplierStopScopeOrders.reduce((groups, order) => {
    const key = order.vendor || "Supplier not recorded";
    if (!groups[key]) groups[key] = { name: key, supplierSequence: order.supplierSequence || 9999, orders: [] };
    groups[key].orders.push(order);
    return groups;
  }, {}))
    .filter(group => !supplierStopClosed(group))
    .sort((a, b) => Number(a.supplierSequence || 9999) - Number(b.supplierSequence || 9999) || a.name.localeCompare(b.name));
  const supplierNamesOnCurrentRoute = new Set(active.map(order => order.vendor || "Supplier not recorded"));
  const bringForwardEligibleOrders = orders
    .filter(order => {
      const supplier = order.vendor || "Supplier not recorded";
      const intendedRunDate = order.actualRunDate || order.date;
      const currentRunDate = currentRunDateForSupplier(supplier);
      return supplierNamesOnCurrentRoute.has(supplier)
        && !order.driverId
        && order.status === "Pending"
        && !pickupAlreadyCollected(order)
        && intendedRunDate
        && currentRunDate
        && intendedRunDate > currentRunDate;
    })
    .sort((a, b) => String(a.actualRunDate || a.date).localeCompare(String(b.actualRunDate || b.date)) || String(a.id).localeCompare(String(b.id)));
  const supplierGroupNames = new Set(supplierGroups.map(group => group.name));
  const bringForwardOnlyGroups = Object.values(bringForwardEligibleOrders
    .filter(order => !supplierGroupNames.has(order.vendor || "Supplier not recorded"))
    .reduce((groups, order) => {
      const key = order.vendor || "Supplier not recorded";
      if (!groups[key]) groups[key] = { name: key, orders: [] };
      groups[key].orders.push(order);
      return groups;
    }, {}));
  const completed = orders.filter(o => o.driverId === user.id && o.status === "Delivered");
  const activeRunBriefs = activeRunIds.length
    ? activeRunIds.map(runId => ({ runId, orders: active.filter(order => order.runId === runId) }))
    : (active.length ? [{ runId: "Run not recorded", orders: active }] : []);
  const runExceptions = exceptions.filter(e => e.status !== "Closed" && (driverOrderIds.has(e.orderId) || e.driverId === user.id));
  const latestRunClose = runClosures.filter(r => r.driverId === user.id).slice(-1)[0];
  const rules = activePriceRules(priceRules);
  const pickupRules = rules.filter(r => r.itemType !== "redelivery");
  const selectedPriceRule = rules.find(r => r.id === typeKey || r.label === typeKey);
  const selectedPickupRule = pickupRules.find(r => r.id === pickupRuleId);
  const selectedOutcomeRule = pickupRules.find(r => r.id === outcomeDraft.priceRuleId);
  const selectedStopOrders = deliveryStopOrders(sel);
  const selectedStopTotal = deliveryStopTotal(sel);
  const runCloseSummary = runCloseSummaryForOrders(driverRunOrders);
  const preTripBlockingExceptions = runExceptions.filter(e => DRIVER_RUN_BLOCKING_ISSUE_TYPES.includes(e.type));
  const readyToDepart = preTrip.vehicle && preTrip.device && preTrip.run && preTripBlockingExceptions.length === 0;

  function showWorkflowNotice(message) {
    setWorkflowNotice(String(message || "A workflow rule blocked this action."));
  }

  function price() {
    if (!selectedPriceRule) return 0;
    const amount = priceRuleDollars(selectedPriceRule);
    if (priceRuleIsPerItem(selectedPriceRule)) return amount * Math.max(Number(tyreQty || priceRuleMinQty(selectedPriceRule)), priceRuleMinQty(selectedPriceRule));
    return amount;
  }

  function pickupPrice() {
    if (!selectedPickupRule) return 0;
    const amount = priceRuleDollars(selectedPickupRule);
    if (priceRuleIsPerItem(selectedPickupRule)) return amount * Math.max(Number(pickupQty || priceRuleMinQty(selectedPickupRule)), priceRuleMinQty(selectedPickupRule));
    return amount;
  }

  function outcomePickupPrice() {
    if (!selectedOutcomeRule) return 0;
    const amount = priceRuleDollars(selectedOutcomeRule);
    if (priceRuleIsPerItem(selectedOutcomeRule)) return amount * Math.max(Number(outcomeDraft.itemQty || priceRuleMinQty(selectedOutcomeRule)), priceRuleMinQty(selectedOutcomeRule));
    return amount;
  }

  function currentRunDateForSupplier(supplierName) {
    const dates = active
      .filter(order => order.vendor === supplierName)
      .map(order => order.actualRunDate || order.date)
      .filter(Boolean)
      .sort();
    return dates[0] || activeRunDates.slice().sort()[0] || todayBrisbane();
  }

  function applyOrderUpdates(updates, auditDetail) {
    if (onUpdateOrders) onUpdateOrders(updates, auditDetail);
    else updates.forEach(update => onUpdateOrder(update));
  }

  function supplierStopOutcomeRecorded(order) {
    return pickupAlreadyCollected(order) || order.pickupOutcome === "No Pickup" || order.status === "No Pickup" || order.status === "Brought Forward";
  }

  function supplierStopClosed(group) {
    return group?.orders?.length > 0 && group.orders.every(order => order.supplierStopClosedAt);
  }

  function supplierStopOutstandingOrders(group) {
    return (group?.orders || []).filter(order => !supplierStopOutcomeRecorded(order));
  }

  function supplierStopOutcomeCounts(group) {
    const ordersInGroup = group?.orders || [];
    return {
      pickedUp: ordersInGroup.filter(order => order.pickupOutcome === "Picked Up").length,
      noPickup: ordersInGroup.filter(order => order.pickupOutcome === "No Pickup" || order.status === "No Pickup").length,
      broughtForward: ordersInGroup.filter(order => order.pickupOutcome === "Brought Forward" || order.status === "Brought Forward").length,
    };
  }

  function startDelivery(stop) {
    const stopOrders = deliveryStopOrders(stop);
    const first = stopOrders[0];
    if (!first) return;
    if (!readyToDepart) { showWorkflowNotice("Complete the pre-trip check before starting the run."); return; }
    if (stopOrders.some(o => !o.driverId || !o.vehicleName || !o.runId)) { showWorkflowNotice("Admin dispatch assignment must include driver, vehicle, and run before departure."); return; }
    if (stopOrders.some(o => !pickupAlreadyCollected(o))) { showWorkflowNotice("Confirm supplier pickup before starting delivery."); return; }
    if (supplierGroups.length > 0) { showWorkflowNotice("SOP-PUP-02 requires each supplier stop to be closed after every customer outcome is recorded before delivery starts."); return; }
    const deliveryGroupId = stop.deliveryId || deliveryStopIdForOrders(stopOrders);
    const deliveryStopKey = stop.key || deliveryStopKeyForOrder(first);
    const startedAt = isoNow();
    applyOrderUpdates(
      stopOrders.map(o => ({
        ...o,
        status: "En Route",
        driverId: user.id,
        startedAt,
        deliveryStopKey,
        deliveryGroupId,
        deliveryGroupSize: stopOrders.length,
        deliverySignatureScope: "SOP-DEL-01 one signature per account/address",
      })),
      `SOP-DEL-01 grouped delivery stop started: ${first.clientName}, ${stopOrders.length} work item(s), one signature per account/address`
    );
  }

  function confirmPickup(o) {
    if (!readyToDepart) { showWorkflowNotice("Complete the pre-trip check before confirming pickup."); return; }
    if (!o.driverId || !o.vehicleName || !o.runId) { showWorkflowNotice("Admin dispatch assignment must include driver, vehicle, and run before pickup."); return; }
    if (pickupRules.length === 0) { showWorkflowNotice("No active price rules available for pickup item capture."); return; }
    const firstRule = pickupRules[0];
    setPickupCapture(o);
    setPickupRuleId(o.pickupPriceRuleId || firstRule.id);
    setPickupQty(o.pickupItemQty || priceRuleMinQty(firstRule));
    setPickupStandardsDraft({
      readyBy10: Boolean(o.pickupReadyBy10Confirmed),
      labelled: Boolean(o.pickupLabelledConfirmed),
      packaged: Boolean(o.pickupPackagingConfirmed),
      goodsAcceptance: Boolean(o.pickupGoodsAcceptanceConfirmed),
      finalDecision: Boolean(o.pickupAcceptanceFinalConfirmed),
      graceMinutes: Number(o.pickupGraceMinutes || 0),
      note: o.pickupComplianceNote || "",
    });
  }

  function completePickupCapture() {
    if (!pickupCapture || !selectedPickupRule) return;
    const graceMinutes = Number(pickupStandardsDraft.graceMinutes || 0);
    if (graceMinutes > 10) return showWorkflowNotice("Policy #16 says the driver does not wait beyond the 10-minute supplier grace period.");
    if (!pickupStandardsDraft.readyBy10) return showWorkflowNotice("Policy #16 requires goods ready at the supplier dock by 10:00am before pickup can be confirmed. Use No Pickup if goods are not ready.");
    if (!pickupStandardsDraft.labelled) return showWorkflowNotice("Policy #16 requires customer name and con note labelling before collection. Use No Pickup for unlabelled goods.");
    if (!pickupStandardsDraft.packaged) return showWorkflowNotice("Policy #16 allows refusal of improperly packaged goods. Use No Pickup for packaging refusal.");
    if (!pickupStandardsDraft.goodsAcceptance) return showWorkflowNotice("Policy #15 requires item-specific goods acceptance to be confirmed at the supplier dock. Use No Pickup if goods fail acceptance standards.");
    if (!pickupStandardsDraft.finalDecision) return showWorkflowNotice("Policy #15 says goods must not be accepted under protest or with follow-up later. Record No Pickup if the dock decision is refusal.");
    const minQty = priceRuleMinQty(selectedPickupRule);
    const quantity = priceRuleIsPerItem(selectedPickupRule) ? Math.max(Number(pickupQty || minQty), minQty) : (selectedPickupRule.tyreCountMin || 1);
    const calculatedPrice = pickupPrice();
    onUpdateOrder({
      ...pickupCapture,
      pickupOutcome: "Picked Up",
      pickupConfirmedAt: isoNow(),
      pickupDriverId: user.id,
      pickupPriceRuleId: selectedPickupRule.id,
      pickupItemType: selectedPickupRule.label,
      pickupItemQty: quantity,
      pickupWeightBand: selectedPickupRule.weightBand || "",
      pickupRateCents: priceRuleRateCents(selectedPickupRule),
      pickupRateMode: priceRuleRateMode(selectedPickupRule),
      pickupCalculatedPrice: calculatedPrice,
      pickupReadyBy10Confirmed: true,
      pickupLabelledConfirmed: true,
      pickupPackagingConfirmed: true,
      pickupGoodsAcceptanceConfirmed: true,
      pickupAcceptanceFinalConfirmed: true,
      pickupGoodsAcceptancePolicyRef: "Policy #15 / POL-OPS-015",
      pickupGraceMinutes: graceMinutes,
      pickupComplianceNote: pickupStandardsDraft.note.trim(),
      pickupStandardsPolicyRef: "Policy #15 / Policy #16 / APP-DRV-002",
      price: calculatedPrice,
    });
    setPickupCapture(null);
    setPickupRuleId("");
    setPickupQty(4);
    setPickupStandardsDraft({ readyBy10: false, labelled: false, packaged: false, goodsAcceptance: false, finalDecision: false, graceMinutes: 0, note: "" });
  }

  function openSupplierStopCloseout(group) {
    const outstanding = supplierStopOutstandingOrders(group);
    if (outstanding.length > 0) {
      showWorkflowNotice(`SOP-PUP-02 requires every customer at ${group.name} to have a Picked Up, No Pickup, or Brought Forward outcome before the driver leaves the dock. ${outstanding.length} customer outcome${outstanding.length === 1 ? "" : "s"} still required.`);
      return;
    }
    setSupplierStopCloseoutTarget(group);
    setSupplierStopCloseoutDraft({ correctDock: false, customerListReviewed: false, noAdhocRecords: false, dockContactEngaged: false, leftDock: false, note: "" });
  }

  function closeSupplierStopCloseout() {
    setSupplierStopCloseoutTarget(null);
    setSupplierStopCloseoutDraft({ correctDock: false, customerListReviewed: false, noAdhocRecords: false, dockContactEngaged: false, leftDock: false, note: "" });
  }

  function completeSupplierStopCloseout() {
    const group = supplierStopCloseoutTarget;
    if (!group) return;
    const outstanding = supplierStopOutstandingOrders(group);
    if (outstanding.length > 0) return showWorkflowNotice("SOP-PUP-02 closeout is blocked until every customer at this supplier has an outcome.");
    if (!supplierStopCloseoutDraft.correctDock) return showWorkflowNotice("SOP-PUP-02 requires the driver to confirm the correct supplier dock.");
    if (!supplierStopCloseoutDraft.customerListReviewed) return showWorkflowNotice("SOP-PUP-02 requires the driver to review the customer list for this supplier stop.");
    if (!supplierStopCloseoutDraft.noAdhocRecords) return showWorkflowNotice("SOP-PUP-02 blocks ad-hoc customer records at the dock; contact Admin if the customer list is wrong.");
    if (!supplierStopCloseoutDraft.dockContactEngaged) return showWorkflowNotice("SOP-PUP-02 requires supplier dock contact engagement on every visit.");
    if (!supplierStopCloseoutDraft.leftDock) return showWorkflowNotice("SOP-PUP-02 closeout requires confirmation that the driver leaves only after all customer outcomes are recorded.");
    const closedAt = isoNow();
    const counts = supplierStopOutcomeCounts(group);
    const summary = `Picked Up ${counts.pickedUp}; No Pickup ${counts.noPickup}; Brought Forward ${counts.broughtForward}`;
    applyOrderUpdates(
      group.orders.map(order => ({
        ...order,
        supplierStopClosedAt: closedAt,
        supplierStopClosedBy: user.id,
        supplierStopClosedByName: user.name,
        supplierStopName: group.name,
        supplierStopCustomerCount: group.orders.length,
        supplierStopOutcomeSummary: summary,
        supplierStopCorrectDockConfirmed: true,
        supplierStopCustomerListReviewed: true,
        supplierStopNoAdhocRecords: true,
        supplierStopDockContactEngaged: true,
        supplierStopLeftDockConfirmed: true,
        supplierStopCloseoutNote: supplierStopCloseoutDraft.note.trim(),
        supplierStopPolicyRef: "SOP-PUP-02 / APP-DRV-002",
      })),
      `SOP-PUP-02 supplier stop closed: ${group.name}, ${group.orders.length} customer outcome(s), ${summary}`
    );
    closeSupplierStopCloseout();
  }

  function resetDeliverySignoffDraft() {
    setDeliverySignoffDraft({ addressConfirmed: false, goodsMatched: false, authorisedReceiver: false, handoverConfirmed: false, priceReviewed: false, deviceSupervised: false });
  }

  function openDeliverySignoff(stop) {
    setSel(stop);
    setStep(1);
    setTypeKey("");
    setTyreQty(4);
    setRecvName("");
    setSig(null);
    resetDeliverySignoffDraft();
  }

  function closeDeliverySignoff() {
    setSel(null);
    setStep(1);
    setTypeKey("");
    setTyreQty(4);
    setRecvName("");
    setSig(null);
    resetDeliverySignoffDraft();
  }

  function openPriceDiscrepancyOutcome(stop) {
    const stopOrders = deliveryStopOrders(stop);
    const firstRule = pickupRules[0];
    const priceSummary = stopOrders
      .map(order => `${order.id} ${order.pickupItemType || order.itemType || "item"} $${Number(order.pickupCalculatedPrice || order.price || 0).toFixed(2)}`)
      .join("; ");
    setOutcomeTarget(stop);
    setOutcomeDraft({
      type: "Failed Delivery",
      reason: "Read-only delivery price appears incorrect; driver did not complete delivery.",
      nextRunDate: "",
      handlingNote: `SOP-DEL-04 price discrepancy from delivery sign-off. Stop total $${deliveryStopTotal(stop).toFixed(2)}.${priceSummary ? ` Items: ${priceSummary}` : ""}`,
      noPickupCategory: "",
      failedDeliveryCategory: "price_discrepancy",
      graceMinutes: 10,
      priceRuleId: firstRule?.id || "",
      itemQty: firstRule ? priceRuleMinQty(firstRule) : 1,
      noDetour: false,
      labelled: false,
      packaged: false,
    });
    setSel(null);
    setStep(1);
    setTypeKey("");
    setTyreQty(4);
    setRecvName("");
    setSig(null);
    resetDeliverySignoffDraft();
  }

  function proceedDeliverySignoff() {
    if (!deliverySignoffDraft.addressConfirmed) return showWorkflowNotice("SOP-DEL-04 requires the driver to confirm the physical address matches the registered delivery address before unloading.");
    if (!deliverySignoffDraft.goodsMatched) return showWorkflowNotice("SOP-DEL-04 requires the driver to confirm the goods match this client account before handover.");
    if (!deliverySignoffDraft.authorisedReceiver) return showWorkflowNotice("SOP-DEL-04 requires an authorised receiver at the delivery address. Use Failed Delivery if no authorised receiver is present.");
    if (!deliverySignoffDraft.handoverConfirmed) return showWorkflowNotice("SOP-DEL-04 requires goods handover to the receiver before proof capture.");
    if (!deliverySignoffDraft.priceReviewed) return showWorkflowNotice("SOP-DEL-04 requires the driver to review the read-only calculated delivery price and contact Admin if it appears incorrect.");
    setStep(2);
  }

  function complete() {
    if (!recvName || !sig) { showWorkflowNotice("Receiver name and signature required"); return; }
    if (receiverNameLooksGeneric(recvName)) { showWorkflowNotice("SOP-DEL-04 requires the actual receiver's full name, not a generic placeholder."); return; }
    if (!deliverySignoffDraft.deviceSupervised) { showWorkflowNotice("SOP-DEL-04 requires the driver to supervise signature capture and keep the device in sight."); return; }
    const stopOrders = deliveryStopOrders(sel);
    const primaryOrder = stopOrders[0];
    if (!primaryOrder) return;
    setBusy(true);
    setTimeout(() => {
      const deliveredAt = isoNow();
      const deliveryId = deliveryIdForOrder(sel);
      const deliveryStopKey = sel?.key || deliveryStopKeyForOrder(primaryOrder);
      const signaturePath = deliveryProofSignaturePath({ ...primaryOrder, deliveryId });
      const proof = {
        id: `proof-${Date.now()}`,
        orderId: primaryOrder.id,
        groupOrderIds: stopOrders.map(order => order.id),
        deliveryStopKey,
        deliveryGroupSize: stopOrders.length,
        deliveryAddress: primaryOrder.dropAddress,
        clientId: primaryOrder.clientId,
        clientName: primaryOrder.clientName,
        deliveryId,
        receiverName: recvName,
        signatureUrl: sig,
        signaturePath,
        driverId: user.id,
        deliveredAt,
        capturedAt: deliveredAt,
        retentionUntil: addYears(isoDate(deliveredAt), 7),
        storage: `delivery-proof/${signaturePath}`,
        bucketPrivate: true,
        price: deliveryStopTotal(sel),
        itemSummary: stopOrders.map(order => `${order.id}: ${order.pickupItemType || order.itemType || "item"}${order.pickupItemQty ? ` x ${order.pickupItemQty}` : ""}`).join("; "),
        signoffAddressConfirmed: true,
        signoffGoodsMatched: true,
        signoffAuthorisedReceiverConfirmed: true,
        signoffHandoverConfirmed: true,
        signoffPriceReviewed: true,
        signoffDeviceSupervised: true,
        deliverySignoffPolicyRef: "SOP-DEL-04 / APP-DRV-003",
        completionSource: "SOP-DEL-04 / SOP-DEL-01 grouped stop / SOP-DEL-05",
      };
      onDeliveryProof(proof);
      closeDeliverySignoff();
      setBusy(false);
    }, 800);
  }

  function openOutcome(o, type) {
    const firstRule = pickupRules[0];
    setOutcomeTarget(o);
    setOutcomeDraft({
      type,
      reason: "",
      nextRunDate: "",
      handlingNote: "",
      noPickupCategory: "",
      failedDeliveryCategory: "",
      graceMinutes: 10,
      priceRuleId: firstRule?.id || "",
      itemQty: firstRule ? priceRuleMinQty(firstRule) : 1,
      noDetour: false,
      labelled: false,
      packaged: false,
    });
  }

  function closeOutcome() {
    setOutcomeTarget(null);
    setOutcomeDraft({ type: "", reason: "", nextRunDate: "", handlingNote: "", noPickupCategory: "", failedDeliveryCategory: "", graceMinutes: 10, priceRuleId: "", itemQty: 1, noDetour: false, labelled: false, packaged: false });
  }

  function submitOutcome() {
    if (!outcomeTarget) return;
    const targetOrders = deliveryStopOrders(outcomeTarget);
    const primaryTarget = targetOrders[0] || outcomeTarget;
    const reason = outcomeDraft.reason.trim();
    const handlingNote = outcomeDraft.handlingNote.trim();
    if (!reason) return showWorkflowNotice("Outcome reason is required.");
    if (outcomeDraft.type === "No Pickup") {
      if (!outcomeDraft.noPickupCategory) return showWorkflowNotice("Policy #16 / Policy #27 No Pickup category is required.");
      const graceMinutes = Number(outcomeDraft.graceMinutes || 0);
      if (graceMinutes > 10) return showWorkflowNotice("Policy #16 says the driver does not wait beyond the 10-minute supplier grace period.");
      if (outcomeDraft.noPickupCategory === "not_ready_after_grace" && graceMinutes < 10 && !handlingNote) {
        return showWorkflowNotice("Policy #16 allows moving on before 10 minutes only at driver discretion. Record the timing impact in the handling note.");
      }
      const categoryLabel = noPickupCategoryLabel(outcomeDraft.noPickupCategory);
      const whsHazard = outcomeDraft.noPickupCategory === "whs_hazard";
      onUpdateOrder({
        ...outcomeTarget,
        status: "No Pickup",
        pickupOutcome: "No Pickup",
        pickupNote: `${categoryLabel}: ${reason}`,
        pickupOutcomeAt: isoNow(),
        pickupNoPickupCategory: outcomeDraft.noPickupCategory,
        pickupGraceMinutes: graceMinutes,
        pickupGoodsAcceptanceRefused: true,
        pickupAcceptanceFinalConfirmed: true,
        pickupGoodsAcceptancePolicyRef: "Policy #15 / POL-OPS-015",
        pickupStandardsPolicyRef: whsHazard ? `${POLICY27_WHS_SOURCE} / APP-DRV-002` : "Policy #15 / Policy #16 / APP-DRV-002",
        whsHazardReported: whsHazard,
        whsHazardStatus: whsHazard ? "Open - Admin supplier follow-up required" : "",
        whsPolicyRef: whsHazard ? POLICY27_WHS_SOURCE : "",
        billable: false,
        driverOutcomeNote: handlingNote,
        price: null,
      });
      onException({
        type: whsHazard ? "WHS Hazard" : "No Pickup",
        orderId: outcomeTarget.id,
        supplierName: whsHazard ? outcomeTarget.vendor : "",
        owner: "Admin",
        note: whsHazard
          ? `${POLICY27_WHS_SOURCE}: ${categoryLabel}. Driver must not enter the hazardous area. ${reason}. Admin must raise the hazard with the supplier and must not require return while the hazard is unresolved.${handlingNote ? ` | Driver note: ${handlingNote}` : ""} No billable item row.`
          : `Policy #15 / Policy #16 ${categoryLabel}. ${reason}. Dock decision final for this run. Grace ${graceMinutes} minute(s). No billable item row.${handlingNote ? ` | Driver note: ${handlingNote}` : ""}`,
        status: "Open",
        driverId: user.id,
        severity: whsHazard ? "High" : "Medium",
        source: whsHazard ? `${POLICY27_WHS_SOURCE} / APP-DRV-002` : "Policy #15 / Policy #16 / APP-DRV-002",
      });
      closeOutcome();
      return;
    }

    if (outcomeDraft.type === "Bring Forward") {
      const supplier = outcomeTarget.vendor || "Supplier not recorded";
      const collectedDate = currentRunDateForSupplier(supplier);
      const intendedRunDate = outcomeTarget.actualRunDate || outcomeTarget.date;
      if (!supplierNamesOnCurrentRoute.has(supplier)) return showWorkflowNotice("SOP-RUN-04 allows bring-forward only when the supplier is already on today's planned route.");
      if (!intendedRunDate || intendedRunDate <= collectedDate) return showWorkflowNotice("SOP-RUN-04 Bring Forward requires a future pickup from a later intended run date.");
      if (!selectedOutcomeRule) return showWorkflowNotice("Item type is required for a brought-forward pickup.");
      if (!outcomeDraft.noDetour) return showWorkflowNotice("Confirm this bring-forward does not require an unscheduled detour.");
      if (!outcomeDraft.labelled || !outcomeDraft.packaged) return showWorkflowNotice("Brought-forward goods must meet labelling and packaging acceptance standards.");
      const minQty = priceRuleMinQty(selectedOutcomeRule);
      const quantity = priceRuleIsPerItem(selectedOutcomeRule) ? Math.max(Number(outcomeDraft.itemQty || minQty), minQty) : (selectedOutcomeRule.tyreCountMin || 1);
      const calculatedPrice = outcomePickupPrice();
      onUpdateOrder({
        ...outcomeTarget,
        status: "Brought Forward",
        pickupOutcome: "Brought Forward",
        pickupNote: reason,
        pickupOutcomeAt: isoNow(),
        pickupDriverId: user.id,
        pickupPriceRuleId: selectedOutcomeRule.id,
        pickupItemType: selectedOutcomeRule.label,
        pickupItemQty: quantity,
        pickupWeightBand: selectedOutcomeRule.weightBand || "",
        pickupRateCents: priceRuleRateCents(selectedOutcomeRule),
        pickupRateMode: priceRuleRateMode(selectedOutcomeRule),
        pickupCalculatedPrice: calculatedPrice,
        pickupLabelledConfirmed: true,
        pickupPackagingConfirmed: true,
        pickupGoodsAcceptanceConfirmed: true,
        pickupAcceptanceFinalConfirmed: true,
        pickupGoodsAcceptancePolicyRef: "Policy #15 / POL-OPS-015 / SOP-RUN-04",
        pickupStandardsPolicyRef: "SOP-RUN-04 / Policy #15 / Policy #16 / APP-DRV-002",
        bringForwardFlag: true,
        bringForwardReason: reason,
        bringForwardCollectedDate: collectedDate,
        bringForwardIntendedRunDate: intendedRunDate,
        bringForwardNoDetourConfirmed: true,
        bringForwardAcceptanceConfirmed: true,
        actualRunDate: intendedRunDate,
        date: intendedRunDate,
        driverId: null,
        driverName: "",
        vehicleId: null,
        vehicleName: "",
        runId: null,
        assignedAt: null,
        runSequence: null,
        supplierSequence: null,
        bringForwardResetSource: "sop_run04_original_run_compile_required",
        driverOutcomeNote: handlingNote,
        price: calculatedPrice,
      });
      closeOutcome();
      return;
    }

    if (outcomeDraft.type === "Failed Delivery") {
      const attemptedAt = isoNow();
      const redeliveryRule = redeliveryPriceRule(priceRules);
      if (!outcomeDraft.failedDeliveryCategory) return showWorkflowNotice("SOP-DEL-04 failed delivery category is required.");
      const failedCategoryLabel = failedDeliveryCategoryLabel(outcomeDraft.failedDeliveryCategory);
      const updates = [];
      const exceptionRows = [];
      for (const order of targetOrders) {
        const previousAttempts = failedDeliveryAttempts(order);
        const attemptNumber = previousAttempts.length + 1;
        if (attemptNumber > 2) return showWorkflowNotice("Policy #8 allows a maximum of 2 delivery attempts for a consignment.");
        const attempts = [
          ...previousAttempts,
          {
            attemptNumber,
            attemptedAt,
            reason,
            category: outcomeDraft.failedDeliveryCategory,
            categoryLabel: failedCategoryLabel,
            handlingNote,
            driverId: user.id,
            driverName: user.name,
            deliveryStopKey: outcomeTarget.key || order.deliveryStopKey || deliveryStopKeyForOrder(order),
          },
        ];
        const secondAttempt = attemptNumber >= 2;
        updates.push({
          ...order,
          status: "Failed Delivery",
          deliveryStopKey: outcomeTarget.key || order.deliveryStopKey || deliveryStopKeyForOrder(order),
          deliveryGroupId: outcomeTarget.deliveryId || order.deliveryGroupId || "",
          deliveryGroupSize: targetOrders.length,
          failedDeliveryReason: reason,
          failedDeliveryCategory: outcomeDraft.failedDeliveryCategory,
          failedDeliveryCategoryLabel: failedCategoryLabel,
          failedDeliveryAt: attemptedAt,
          failedDeliveryHandlingNote: handlingNote,
          failedDeliveryAttemptCount: attemptNumber,
          failedDeliveryAttempts: attempts,
          failedDeliveryPolicyRef: "SOP-DEL-04 / Policy #8",
          redeliveryFeeStatus: secondAttempt ? "Pending Admin Review" : "Not Applicable",
          redeliveryFeeAmount: secondAttempt ? policy8RedeliveryFeeAmount(priceRules) : 0,
          redeliveryFeeRuleId: secondAttempt ? (redeliveryRule?.id || "price-redelivery") : "",
          returnToSupplierRequired: secondAttempt,
          returnToSupplierStatus: secondAttempt
            ? "Return to originating supplier on next scheduled milk run"
            : "Goods retained with driver after first failed attempt",
          price: null,
        });
        exceptionRows.push({
          type: "Failed Delivery",
          orderId: order.id,
          owner: "Admin",
          note: `Attempt ${attemptNumber} of 2. SOP-DEL-04 category: ${failedCategoryLabel}. ${reason}${handlingNote ? ` | Driver note: ${handlingNote}` : ""}. ${targetOrders.length > 1 ? `SOP-DEL-01 grouped stop ${primaryTarget.clientName || ""}; one failed delivery action applied to ${targetOrders.length} work item(s). ` : ""}${secondAttempt ? "Policy #8: return goods to originating supplier on next scheduled milk run; Admin review required before $10 redelivery fee is applied." : "Policy #8: goods remain with driver after first failed attempt; no redelivery fee after first attempt."}`,
          status: "Open",
          driverId: user.id,
          severity: "High",
          source: "SOP-DEL-04 / Policy #8 / APP-DRV-003 / SOP-DEL-01",
          failedDeliveryAttemptNumber: attemptNumber,
          failedDeliveryCategory: outcomeDraft.failedDeliveryCategory,
        });
      }
      applyOrderUpdates(updates, `SOP-DEL-04 / Policy #8 failed delivery recorded for SOP-DEL-01 grouped stop ${primaryTarget.clientName || ""}: ${failedCategoryLabel}; ${updates.length} work item(s)`);
      exceptionRows.forEach(onException);
      closeOutcome();
    }
  }

  function reportRunIssue() {
    const note = runIssueDraft.note.trim();
    if (!note) return showWorkflowNotice("Issue detail required");
    const runRef = pickupStops[0]?.runId || deliveryOrders[0]?.runId || active[0]?.runId || `RUN-${todayBrisbane()}-${user.id}`;
    const policy27Issue = ["Fatigue / Health Concern", "WHS Incident / Near Miss"].includes(runIssueDraft.type);
    onException({
      type: runIssueDraft.type,
      orderId: runRef,
      owner: "Admin",
      note: ["Pre-Trip Defect", "Fatigue / Health Concern", "WHS Incident / Near Miss"].includes(runIssueDraft.type)
        ? `${POLICY27_WHS_SOURCE}: ${user.name}: ${note}`
        : `${user.name}: ${note}`,
      status: "Open",
      driverId: user.id,
      severity: runIssueDraft.type === "Missing Stop" ? "Medium" : "High",
      source: policy27Issue
        ? `${POLICY27_WHS_SOURCE} / APP-ADM-002`
        : "APP-DRV-001 run issue",
    });
    setRunIssueDraft({ type: "Pre-Trip Defect", note: "" });
  }

  function statusBadge(s) {
    const cls = { Pending: "b-pending", "En Route": "b-enroute", Delivered: "b-done", "No Pickup": "b-cancelled", "Brought Forward": "b-pending", "Failed Delivery": "b-cancelled" };
    return <span className={`badge ${cls[s] || "b-pending"}`}>{s}</span>;
  }

  function closeRun() {
    if (active.length > 0) return showWorkflowNotice("Run cannot close while stops remain Pending or En Route.");
    const closeSummary = runCloseSummaryForOrders(driverRunOrders);
    onRunClose({
      id: `run-close-${Date.now()}`,
      driverId: user.id,
      driverName: user.name,
      runDate: todayBrisbane(),
      deliveredCount: closeSummary.deliveredCount,
      exceptionCount: runExceptions.length,
      openStopCount: active.length,
      pickedUpCount: closeSummary.pickedUpCount,
      noPickupCount: closeSummary.noPickupCount,
      failedDeliveryCount: closeSummary.failedDeliveryCount,
      closeSummary,
      actionItems: closeSummary.actionItems,
      retainedGoodsCount: closeSummary.retainedGoodsCount,
      secondAttemptRequiredCount: closeSummary.secondAttemptRequiredCount,
      returnToSupplierCount: closeSummary.returnToSupplierCount,
      runClosePolicyRef: "UJ-DRV-001 S5 / SOP-DEL-05",
      closedAt: isoNow(),
    });
  }

  return (
    <>
      <div className="nav">
        <div className="logo"><img src="/moto-and-co-couriers-logo.png" alt="Moto and Co Couriers" /><span className="logo-sub">Driver run portal</span></div>
        <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
          <div className="nav-role">{user.name}</div>
          <button className="nav-out" onClick={onLogout}>Log out</button>
        </div>
      </div>
      <div className="main">
        <div className="tabs" style={{ marginBottom: "1.2rem" }}>
          <button className={`tab${view === "active" ? " active" : ""}`} onClick={() => setView("active")}>Pickup ({supplierGroups.length})</button>
          <button className={`tab${view === "delivery" ? " active" : ""}`} onClick={() => setView("delivery")}>Delivery ({deliveryStops.length})</button>
          <button className={`tab${view === "done" ? " active" : ""}`} onClick={() => setView("done")}>Completed ({completed.length})</button>
          <button className={`tab${view === "close" ? " active" : ""}`} onClick={() => setView("close")}>Run Close</button>
        </div>

        {workflowNotice && (
          <PolicyNotice title="Driver Workflow Rule" system onDismiss={() => setWorkflowNotice("")}>
            {workflowNotice}
          </PolicyNotice>
        )}

        {view === "active" && (
          <>
            <div className="card" style={{ borderColor: readyToDepart ? T.teal : T.acc }}>
              <div className="card-head">
                <div className="card-title">Pre-Trip Check</div>
                <span className={`badge ${readyToDepart ? "b-done" : "b-pending"}`}>{readyToDepart ? "Ready" : "Required"}</span>
              </div>
              <div className="pills" style={{ marginTop: ".6rem" }}>
                {[
                  ["vehicle", "Vehicle assigned and safe"],
                  ["device", "Device charged and signature ready"],
                  ["run", "Run brief reviewed"],
                ].map(([key, label]) => (
                  <button key={key} className={`pill${preTrip[key] ? " sel" : ""}`} onClick={() => setPreTrip(p => ({ ...p, [key]: !p[key] }))}>{label}</button>
                ))}
              </div>
              {preTripBlockingExceptions.length > 0 && (
                <div className="err" style={{ marginTop: ".8rem" }}>
                  {preTripBlockingExceptions.length} open pre-trip/run-brief issue{preTripBlockingExceptions.length === 1 ? "" : "s"} must be closed by Admin before departure.
                </div>
              )}
              <hr className="dvd" />
              <div className="card-title" style={{ fontSize: ".9rem", marginBottom: ".6rem" }}>Run issue</div>
              <div className="fr">
                <div className="f"><label>Issue Type</label>
                  <select value={runIssueDraft.type} onChange={e => setRunIssueDraft(p => ({ ...p, type: e.target.value }))}>
                    <option value="Pre-Trip Defect">Pre-Trip Defect</option>
                    <option value="Device Issue">Device Issue</option>
                    <option value="Run Brief Issue">Run Brief Issue</option>
                    <option value="Fatigue / Health Concern">Fatigue / Health Concern</option>
                    <option value="WHS Incident / Near Miss">WHS Incident / Near Miss</option>
                    <option value="Missing Stop">Missing Stop</option>
                  </select>
                </div>
                <div className="f"><label>Detail</label><input value={runIssueDraft.note} onChange={e => setRunIssueDraft(p => ({ ...p, note: e.target.value }))} placeholder="What needs Admin attention?" /></div>
              </div>
              <button className="btn b-ghost b-sm" onClick={reportRunIssue}>Send to Admin Exception Queue</button>
            </div>
            {active.length > 0 && (
              <div className="card">
                <div className="card-head">
                  <div className="card-title">Compiled Run Brief</div>
                  <span className="badge b-done">{active.length} open stop{active.length === 1 ? "" : "s"}</span>
                </div>
                <div className="meta">
                  {activeRunDates.map(date => <span key={date}>Run {fmt(date)}</span>)}
                  {activeVehicles.map(vehicle => <span key={vehicle}>Vehicle {vehicle}</span>)}
                </div>
                {activeRunBriefs.map(brief => (
                  <div className="meta" key={brief.runId} style={{ marginTop: ".35rem" }}>
                    <span>{brief.runId}</span>
                    <span>{brief.orders.length} stop{brief.orders.length === 1 ? "" : "s"}</span>
                    <span>{brief.orders.every(order => order.vehicleRegistrationCurrent && order.vehicleInsuranceCurrent) ? "Fleet compliance attested" : "Fleet compliance not fully recorded"}</span>
                  </div>
                ))}
                <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".45rem" }}>
                  Stops are sequenced by supplier, then delivery geography, from the local APP-ADM-002 run compiler. Production route optimisation remains separate.
                </div>
              </div>
            )}
            {supplierGroups.length === 0 && bringForwardOnlyGroups.length === 0 && <div className="empty">No supplier pickup stops waiting.</div>}
            {supplierGroups.map(group => {
              const runDates = [...new Set(group.orders.map(o => o.actualRunDate || o.date).filter(Boolean))];
              const vehicles = [...new Set(group.orders.map(o => o.vehicleName).filter(Boolean))];
              const runIds = [...new Set(group.orders.map(o => o.runId).filter(Boolean))];
              const groupBringForwardCandidates = bringForwardEligibleOrders.filter(order => (order.vendor || "Supplier not recorded") === group.name);
              const outstanding = supplierStopOutstandingOrders(group);
              const counts = supplierStopOutcomeCounts(group);
              return (
                <div className="card" key={group.name}>
                  <div className="card-head">
                    <div className="card-title">{group.supplierSequence && group.supplierSequence !== 9999 ? `${group.supplierSequence}. ` : ""}{group.name}</div>
                    <span className={`badge ${outstanding.length ? "b-pending" : "b-done"}`}>
                      {outstanding.length ? `${outstanding.length} outcome${outstanding.length === 1 ? "" : "s"} needed` : "Ready to close"}
                    </span>
                  </div>
                  <div className="meta">
                    {runDates.map(date => <span key={date}>Run {fmt(date)}</span>)}
                    {vehicles.map(vehicle => <span key={vehicle}>Vehicle {vehicle}</span>)}
                    {runIds.map(runId => <span key={runId}>{runId}</span>)}
                    <span>Picked Up {counts.pickedUp}</span>
                    <span>No Pickup {counts.noPickup}</span>
                    <span>Brought Forward {counts.broughtForward}</span>
                  </div>
                  <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".45rem" }}>
                    SOP-PUP-02: close this supplier stop only after every customer has a recorded outcome and the driver has left the dock.
                  </div>
                  <hr className="dvd" />
                  {group.orders.map(o => (
                    <div key={o.id} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".75rem", marginTop: ".75rem" }}>
                      <div className="card-head">
                        <div className="card-title" style={{ fontSize: ".94rem" }}>{o.id} - {o.clientName}</div>
                        {pickupAlreadyCollected(o)
                          ? <span className="badge b-done">{o.pickupOutcome}</span>
                          : statusBadge(o.status)}
                      </div>
                      <div className="meta"><span>Seq {o.runSequence || "Not set"}</span><span>{o.deliveryZone || deliveryZone(o.dropAddress)}</span><span>{o.conNote}</span><span>{o.dropAddress}</span></div>
                      {o.notes && <div style={{ fontSize: ".8rem", color: T.mu, marginBottom: ".6rem" }}>{o.notes}</div>}
                      {o.pickupPriceRuleId && (
                        <div style={{ fontSize: ".78rem", color: T.mu, margin: ".35rem 0" }}>
                          Pickup item: {o.pickupItemType} {o.pickupItemQty ? `x ${o.pickupItemQty}` : ""}{o.pickupWeightBand ? `, ${priceRuleBand({ itemType: "parts", weightBand: o.pickupWeightBand })}` : ""} - ${Number(o.pickupCalculatedPrice || 0).toFixed(2)}
                        </div>
                      )}
                      {(o.pickupOutcome === "No Pickup" || o.status === "No Pickup") && (
                        <div style={{ fontSize: ".78rem", color: T.mu, margin: ".35rem 0" }}>
                          No Pickup: {noPickupCategoryLabel(o.pickupNoPickupCategory)}{o.pickupNote ? ` - ${o.pickupNote}` : ""}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".55rem" }}>
                        {o.status === "Pending" && !pickupAlreadyCollected(o) && <button className="btn b-teal b-sm" onClick={() => confirmPickup(o)}>Capture Items / Picked Up</button>}
                        {o.status === "Pending" && !pickupAlreadyCollected(o) && <button className="btn b-ghost b-sm" onClick={() => openOutcome(o, "No Pickup")}>No Pickup</button>}
                      </div>
                    </div>
                  ))}
                  {groupBringForwardCandidates.length > 0 && (
                    <>
                      <hr className="dvd" />
                      <div className="card-title" style={{ fontSize: ".9rem", marginBottom: ".45rem" }}>SOP-RUN-04 Future Pickups Ready Today</div>
                      <div style={{ fontSize: ".78rem", color: T.mu, marginBottom: ".6rem" }}>
                        Bring-forward is only available because this supplier is already on today's planned route. It does not change the intended delivery run date.
                      </div>
                      {groupBringForwardCandidates.map(o => (
                        <div key={`bring-forward-${o.id}`} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".65rem", marginTop: ".65rem" }}>
                          <div className="card-head">
                            <div className="card-title" style={{ fontSize: ".9rem" }}>{o.id} - {o.clientName}</div>
                            <span className="badge b-pending">Intended run {fmt(o.actualRunDate || o.date)}</span>
                          </div>
                          <div className="meta"><span>{o.conNote}</span><span>{o.dropAddress}</span><span>No detour allowed</span></div>
                          {o.notes && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>{o.notes}</div>}
                          <button className="btn b-ghost b-sm" style={{ marginTop: ".55rem" }} onClick={() => openOutcome(o, "Bring Forward")}>Record Brought Forward Pickup</button>
                        </div>
                      ))}
                    </>
                  )}
                  <hr className="dvd" />
                  <button className={`btn ${outstanding.length ? "b-ghost" : "b-acc"} b-sm`} onClick={() => openSupplierStopCloseout(group)}>
                    {outstanding.length ? "Close Supplier Stop Blocked" : "Close Supplier Stop"}
                  </button>
                </div>
              );
            })}
            {bringForwardOnlyGroups.map(group => (
              <div className="card" key={`bring-forward-only-${group.name}`}>
                <div className="card-head">
                  <div className="card-title">SOP-RUN-04 Future Pickups Ready Today - {group.name}</div>
                  <span className="badge b-pending">{group.orders.length} future pickup{group.orders.length === 1 ? "" : "s"}</span>
                </div>
                <div style={{ fontSize: ".78rem", color: T.mu, marginBottom: ".6rem" }}>
                  This supplier is already on the active run. Only collect these future pickups if the goods are ready now, labelled, packaged, and no unscheduled detour is required.
                </div>
                {group.orders.map(o => (
                  <div key={`bring-forward-only-${o.id}`} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".65rem", marginTop: ".65rem" }}>
                    <div className="card-head">
                      <div className="card-title" style={{ fontSize: ".9rem" }}>{o.id} - {o.clientName}</div>
                      <span className="badge b-pending">Intended run {fmt(o.actualRunDate || o.date)}</span>
                    </div>
                    <div className="meta"><span>{o.conNote}</span><span>{o.dropAddress}</span><span>No detour allowed</span></div>
                    {o.notes && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>{o.notes}</div>}
                    <button className="btn b-ghost b-sm" style={{ marginTop: ".55rem" }} onClick={() => openOutcome(o, "Bring Forward")}>Record Brought Forward Pickup</button>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {view === "delivery" && (
          <>
            {deliveryStops.length === 0 && <div className="empty">No grouped delivery stops ready.</div>}
            {deliveryStops.map(stop => {
              const stopIsEnRoute = stop.orders.every(order => order.status === "En Route");
              return (
                <div className="card" key={stop.key}>
                  <div className="card-head">
                    <div className="card-title">{stop.clientName} - Grouped Delivery Stop</div>
                    <span className="badge b-pending">{stop.orders.length} order{stop.orders.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="meta">
                    <span>Seq {stop.runSequence || "Not set"}</span>
                    <span>{stop.deliveryZone}</span>
                    <span>{stop.dropAddress}</span>
                    {stop.runDates.map(date => <span key={date}>Run {fmt(date)}</span>)}
                    {stop.vendors.map(vendor => <span key={vendor}>{vendor}</span>)}
                    {stop.pickedUpAt && <span>Picked up {new Date(stop.pickedUpAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</span>}
                  </div>
                  <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".45rem" }}>
                    SOP-DEL-01 groups by client account and delivery address; one receiver name and signature covers this delivery location.
                  </div>
                  <hr className="dvd" />
                  {stop.orders.map(order => (
                    <div key={order.id} className="meta" style={{ marginTop: ".35rem" }}>
                      <span>{order.id}</span>
                      <span>{order.conNote}</span>
                      <span>{order.pickupItemType || order.itemType || "Item captured at pickup"}</span>
                      {order.pickupItemQty && <span>Qty {order.pickupItemQty}</span>}
                      <span>${Number(order.pickupCalculatedPrice || order.price || 0).toFixed(2)}</span>
                      {statusBadge(order.status)}
                    </div>
                  ))}
                  <div style={{ fontSize: ".86rem", color: T.acc, fontWeight: 800, marginTop: ".65rem" }}>
                    Stop total: ${deliveryStopTotal(stop).toFixed(2)}
                  </div>
                  <hr className="dvd" />
                  <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                    {!stopIsEnRoute && <button className="btn b-teal b-sm" onClick={() => startDelivery(stop)}>Start Grouped Delivery</button>}
                    {stopIsEnRoute && <button className="btn b-acc b-sm" onClick={() => openDeliverySignoff(stop)}>Sign Off Grouped Stop</button>}
                    {stopIsEnRoute && <button className="btn b-red b-sm" onClick={() => openOutcome(stop, "Failed Delivery")}>Failed Delivery</button>}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {view === "done" && (
          <>
            {completed.length === 0 && <div className="empty">No completed deliveries yet.</div>}
            {completed.map(o => (
              <div className="card" key={o.id}>
                <div className="card-head"><div className="card-title">{o.id} — {o.clientName}</div><span className="badge b-done">Delivered</span></div>
                <div className="meta"><span>📦 {o.vendor}</span><span>📋 {o.conNote}</span><span>📍 {o.dropAddress}</span>{o.price && <span>💰 ${o.price}</span>}</div>
                {o.recvName && <div style={{ fontSize: ".8rem", color: T.mu }}>Received by: {o.recvName}</div>}
              </div>
            ))}
          </>
        )}

        {view === "close" && (
          <>
            <h2 style={{ marginBottom: "1rem" }}>Run Summary</h2>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: active.length ? T.acc : T.tx }}>{active.length}</div><div className="stat-lbl">Open Stops</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{runCloseSummary.deliveredCount}</div><div className="stat-lbl">Delivered</div></div>
              <div className="stat"><div className="stat-num" style={{ color: runCloseSummary.noPickupCount ? T.acc : T.tx }}>{runCloseSummary.noPickupCount}</div><div className="stat-lbl">No Pickup</div></div>
              <div className="stat"><div className="stat-num" style={{ color: runCloseSummary.failedDeliveryCount ? T.red : T.tx }}>{runCloseSummary.failedDeliveryCount}</div><div className="stat-lbl">Failed Delivery</div></div>
              <div className="stat"><div className="stat-num" style={{ color: runExceptions.length ? T.red : T.mu }}>{runExceptions.length}</div><div className="stat-lbl">Open Exceptions</div></div>
            </div>
            <div className="card">
              <div className="card-title">Close today's run</div>
              <div style={{ fontSize: ".82rem", color: T.mu, margin: ".5rem 0 1rem" }}>
                Driver run close records the summary once every stop is no longer Pending or En Route. Open exceptions and retained-goods action items remain visible to Admin.
              </div>
              <button className="btn b-acc" disabled={active.length > 0} onClick={closeRun}>{active.length > 0 ? "Resolve open stops first" : "Close Run"}</button>
            </div>
            {latestRunClose && (
              <div className="card">
                <div className="card-head"><div className="card-title">Run complete. Good work.</div><span className="badge b-done">Closed</span></div>
                <div className="meta">
                  <span>{new Date(latestRunClose.closedAt).toLocaleString("en-AU")}</span>
                  <span>{latestRunClose.closeSummary?.pickedUpCount ?? runCloseSummary.pickedUpCount} pickup(s)</span>
                  <span>{latestRunClose.deliveredCount} delivered</span>
                  <span>{latestRunClose.closeSummary?.noPickupCount ?? 0} no pickup</span>
                  <span>{latestRunClose.closeSummary?.failedDeliveryCount ?? 0} failed delivery</span>
                  <span>{latestRunClose.exceptionCount} open exception(s)</span>
                </div>
                <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".65rem" }}>
                  No further driver action is required for this run unless an action item is listed below.
                </div>
                {(latestRunClose.actionItems || latestRunClose.closeSummary?.actionItems || []).length > 0 ? (
                  <div style={{ marginTop: ".7rem" }}>
                    {(latestRunClose.actionItems || latestRunClose.closeSummary?.actionItems || []).map((item, idx) => (
                      <div key={`${latestRunClose.id}-action-${idx}`} style={{ fontSize: ".8rem", color: T.acc, marginTop: ".25rem" }}>{item}</div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: ".8rem", color: T.mu, marginTop: ".7rem" }}>No retained-goods action items recorded.</div>
                )}
                <button className="btn b-ghost b-sm" style={{ marginTop: ".8rem" }} onClick={onLogout}>Log out</button>
              </div>
            )}
          </>
        )}

        {pickupCapture && (
          <div className="overlay" onClick={() => setPickupCapture(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Pickup Items - {pickupCapture.id}</h3>
              <p style={{ fontSize: ".82rem", color: T.mu, marginBottom: "1rem" }}>
                Select the observed item band. Pricing is calculated from price_rules; driver price override is not available.
              </p>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".7rem" }}>
                Policy #15 / Policy #16 pickup standards: goods ready at dock by 10:00am, labelled with customer name and con note, accepted against item-specific standards, and not accepted under protest.
              </div>
              <div className="pills">
                {pickupRules.map(rule => (
                  <button key={rule.id} className={`pill${pickupRuleId === rule.id ? " sel" : ""}`} onClick={() => {
                    setPickupRuleId(rule.id);
                    setPickupQty(q => priceRuleIsPerItem(rule) ? Math.max(Number(q || priceRuleMinQty(rule)), priceRuleMinQty(rule)) : priceRuleMinQty(rule));
                  }}>
                    {rule.label} - ${priceRuleDollars(rule).toFixed(2)}{priceRuleIsPerItem(rule) ? " each" : ""}
                  </button>
                ))}
              </div>
              {selectedPickupRule && priceRuleIsPerItem(selectedPickupRule) && (
                <div className="f" style={{ marginTop: ".8rem" }}>
                  <label>Quantity</label>
                  <input type="number" min={priceRuleMinQty(selectedPickupRule)} value={pickupQty} onChange={e => setPickupQty(+e.target.value)} />
                </div>
              )}
              {selectedPickupRule && (
                <div style={{ fontSize: ".9rem", color: T.acc, fontWeight: 700, margin: ".7rem 0" }}>
                  Pickup total: ${pickupPrice().toFixed(2)}
                </div>
              )}
              <hr className="dvd" />
              <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                <input type="checkbox" checked={pickupStandardsDraft.readyBy10} onChange={e => setPickupStandardsDraft(p => ({ ...p, readyBy10: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                <span>Goods ready at supplier dock by 10:00am</span>
              </label>
              <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                <input type="checkbox" checked={pickupStandardsDraft.labelled} onChange={e => setPickupStandardsDraft(p => ({ ...p, labelled: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                <span>Label shows customer name and con note</span>
              </label>
              <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                <input type="checkbox" checked={pickupStandardsDraft.packaged} onChange={e => setPickupStandardsDraft(p => ({ ...p, packaged: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                <span>Packaging meets item standard</span>
              </label>
              <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                <input type="checkbox" checked={pickupStandardsDraft.goodsAcceptance} onChange={e => setPickupStandardsDraft(p => ({ ...p, goodsAcceptance: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                <span>Policy #15 acceptance met: {goodsAcceptanceStandardForRule(selectedPickupRule)}</span>
              </label>
              <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                <input type="checkbox" checked={pickupStandardsDraft.finalDecision} onChange={e => setPickupStandardsDraft(p => ({ ...p, finalDecision: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                <span>Dock decision final for this run; goods not accepted under protest</span>
              </label>
              <div className="fr">
                <div className="f"><label>Grace Minutes</label><input type="number" min="0" max="10" value={pickupStandardsDraft.graceMinutes} onChange={e => setPickupStandardsDraft(p => ({ ...p, graceMinutes: e.target.value }))} /></div>
                <div className="f"><label>Compliance Note</label><input value={pickupStandardsDraft.note} onChange={e => setPickupStandardsDraft(p => ({ ...p, note: e.target.value }))} placeholder="Dock handover evidence or packaging note" /></div>
              </div>
              <button className="btn b-acc" disabled={!selectedPickupRule} onClick={completePickupCapture}>Confirm Picked Up</button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={() => setPickupCapture(null)}>Cancel</button>
            </div>
          </div>
        )}

        {outcomeTarget && (
          <div className="overlay" onClick={closeOutcome}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{outcomeDraft.type} - {outcomeTarget.id || deliveryStopLabel(outcomeTarget)}</h3>
              <div className="meta" style={{ marginBottom: ".8rem" }}>
                <span>{outcomeTarget.clientName || deliveryStopOrders(outcomeTarget)[0]?.clientName}</span>
                <span>{outcomeTarget.vendor || deliveryStopOrders(outcomeTarget).map(order => order.vendor).filter(Boolean).join(", ")}</span>
                <span>Run {fmt(outcomeTarget.actualRunDate || outcomeTarget.date || deliveryStopOrders(outcomeTarget)[0]?.actualRunDate || deliveryStopOrders(outcomeTarget)[0]?.date)}</span>
              </div>
              <p style={{ fontSize: ".82rem", color: T.mu, marginBottom: "1rem" }}>
                {outcomeDraft.type === "No Pickup"
                  ? "Capture the per-customer APP-DRV-002 No Pickup record. Policy #15 / SOP-PUP-03 / Policy #16 / Policy #27 blocks billing when goods are not ready, unlabelled or mismatched, improperly packaged, refused by supplier, wrong items are presented, time constraints prevent collection, or a supplier-premises WHS hazard prevents safe entry."
                  : outcomeDraft.type === "Failed Delivery"
                    ? "Capture the SOP-DEL-04 driver outcome and send the exception to Admin. Goods must not be left at an unconfirmed address or without receiver acceptance. Policy #8: two attempts maximum, Admin review before any redelivery fee."
                    : "SOP-RUN-04 records a future pickup collected early only because this supplier is already on today's planned route. Delivery remains scheduled for the original intended run date."}
              </p>
              {outcomeDraft.type === "No Pickup" && (
                <>
                  <div className="f">
                    <label>Policy #16 Category *</label>
                    <select value={outcomeDraft.noPickupCategory} onChange={e => setOutcomeDraft(p => ({ ...p, noPickupCategory: e.target.value }))}>
                      <option value="">Select category</option>
                      {POLICY16_NO_PICKUP_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>
                  <div className="f">
                    <label>Grace Minutes</label>
                    <input type="number" min="0" max="10" value={outcomeDraft.graceMinutes} onChange={e => setOutcomeDraft(p => ({ ...p, graceMinutes: e.target.value }))} />
                  </div>
                </>
              )}
              {outcomeDraft.type === "Failed Delivery" && (
                <div className="f">
                  <label>SOP-DEL-04 Category *</label>
                  <select value={outcomeDraft.failedDeliveryCategory} onChange={e => setOutcomeDraft(p => ({ ...p, failedDeliveryCategory: e.target.value }))}>
                    <option value="">Select category</option>
                    {SOP_DEL04_FAILED_DELIVERY_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              )}
              <div className="f">
                <label>Reason *</label>
                <textarea
                  value={outcomeDraft.reason}
                  onChange={e => setOutcomeDraft(p => ({ ...p, reason: e.target.value }))}
                  placeholder={outcomeDraft.type === "Failed Delivery" ? "Unable to complete delivery because..." : "Outcome reason"}
                />
              </div>
              {outcomeDraft.type === "Bring Forward" && (
                <>
                  <div className="fr">
                    <div className="f"><label>Item Type *</label>
                      <select value={outcomeDraft.priceRuleId} onChange={e => setOutcomeDraft(p => ({ ...p, priceRuleId: e.target.value, itemQty: priceRuleMinQty(pickupRules.find(rule => rule.id === e.target.value) || selectedOutcomeRule || pickupRules[0]) }))}>
                        <option value="">Select item type</option>
                        {pickupRules.map(rule => <option key={rule.id} value={rule.id}>{rule.label} - ${priceRuleDollars(rule).toFixed(2)}</option>)}
                      </select>
                    </div>
                    <div className="f"><label>Quantity</label><input type="number" min={selectedOutcomeRule ? priceRuleMinQty(selectedOutcomeRule) : 1} value={outcomeDraft.itemQty} onChange={e => setOutcomeDraft(p => ({ ...p, itemQty: e.target.value }))} /></div>
                  </div>
                  <div className="meta" style={{ marginBottom: ".7rem" }}>
                    <span>Collected on current route {fmt(currentRunDateForSupplier(outcomeTarget.vendor || "Supplier not recorded"))}</span>
                    <span>Intended delivery run {fmt(outcomeTarget.actualRunDate || outcomeTarget.date)}</span>
                    <span>Calculated pickup price ${outcomePickupPrice().toFixed(2)}</span>
                  </div>
                  <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".45rem 0" }}>
                    <input type="checkbox" checked={outcomeDraft.noDetour} onChange={e => setOutcomeDraft(p => ({ ...p, noDetour: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                    <span>No unscheduled detour is required</span>
                  </label>
                  <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".45rem 0" }}>
                    <input type="checkbox" checked={outcomeDraft.labelled} onChange={e => setOutcomeDraft(p => ({ ...p, labelled: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                    <span>Goods are labelled for the correct customer and con note</span>
                  </label>
                  <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".45rem 0 .8rem" }}>
                    <input type="checkbox" checked={outcomeDraft.packaged} onChange={e => setOutcomeDraft(p => ({ ...p, packaged: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                    <span>Packaging meets the item acceptance standard</span>
                  </label>
                </>
              )}
              <div className="f">
                <label>Driver Handling Note</label>
                <textarea
                  value={outcomeDraft.handlingNote}
                  onChange={e => setOutcomeDraft(p => ({ ...p, handlingNote: e.target.value }))}
                  placeholder="Goods state, dock instruction, contact attempt, or follow-up context"
                />
              </div>
              <button className={`btn ${outcomeDraft.type === "Failed Delivery" ? "b-red" : "b-acc"}`} onClick={submitOutcome}>
                Record Outcome
              </button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={closeOutcome}>Cancel</button>
            </div>
          </div>
        )}

        {supplierStopCloseoutTarget && (
          <div className="overlay" onClick={closeSupplierStopCloseout}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Close Supplier Stop - {supplierStopCloseoutTarget.name}</h3>
              <p style={{ fontSize: ".82rem", color: T.mu, marginBottom: "1rem" }}>
                SOP-PUP-02 completion standard: every customer for this supplier stop has a recorded outcome, no ad-hoc customer record was created, and the driver leaves the dock after completion.
              </p>
              <div className="meta" style={{ marginBottom: ".8rem" }}>
                <span>{supplierStopCloseoutTarget.orders.length} customer pickup{supplierStopCloseoutTarget.orders.length === 1 ? "" : "s"}</span>
                <span>{supplierStopOutcomeCounts(supplierStopCloseoutTarget).pickedUp} picked up</span>
                <span>{supplierStopOutcomeCounts(supplierStopCloseoutTarget).noPickup} no pickup</span>
                <span>{supplierStopOutcomeCounts(supplierStopCloseoutTarget).broughtForward} brought forward</span>
              </div>
              <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                <input type="checkbox" checked={supplierStopCloseoutDraft.correctDock} onChange={e => setSupplierStopCloseoutDraft(p => ({ ...p, correctDock: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                <span>Correct supplier dock confirmed</span>
              </label>
              <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                <input type="checkbox" checked={supplierStopCloseoutDraft.customerListReviewed} onChange={e => setSupplierStopCloseoutDraft(p => ({ ...p, customerListReviewed: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                <span>Customer pickup list reviewed for this supplier</span>
              </label>
              <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                <input type="checkbox" checked={supplierStopCloseoutDraft.noAdhocRecords} onChange={e => setSupplierStopCloseoutDraft(p => ({ ...p, noAdhocRecords: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                <span>No ad-hoc customer pickup records created at the dock</span>
              </label>
              <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                <input type="checkbox" checked={supplierStopCloseoutDraft.dockContactEngaged} onChange={e => setSupplierStopCloseoutDraft(p => ({ ...p, dockContactEngaged: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                <span>Supplier dock contact engaged professionally</span>
              </label>
              <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                <input type="checkbox" checked={supplierStopCloseoutDraft.leftDock} onChange={e => setSupplierStopCloseoutDraft(p => ({ ...p, leftDock: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                <span>Driver left dock only after all customer outcomes were recorded</span>
              </label>
              <div className="f">
                <label>Closeout Note</label>
                <textarea value={supplierStopCloseoutDraft.note} onChange={e => setSupplierStopCloseoutDraft(p => ({ ...p, note: e.target.value }))} placeholder="Dock contact, list issue, or timing evidence" />
              </div>
              <button className="btn b-acc" onClick={completeSupplierStopCloseout}>Record Supplier Stop Closeout</button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={closeSupplierStopCloseout}>Cancel</button>
            </div>
          </div>
        )}

        {sel && (
          <div className="overlay">
            <div className="modal">
              <div className="step-bar">
                {[1, 2].map(i => <div key={i} className={`step-dot${step >= i ? " done" : ""}`} />)}
              </div>
              <h3>Sign Off - {deliveryStopLabel(sel)}</h3>

              {step === 1 && (
                <>
                  <p style={{ fontSize: ".82rem", color: T.mu, marginBottom: "1rem" }}>
                    SOP-DEL-01 uses one receiver name and signature for all work items at the same client account and delivery address. Delivery pricing is read-only from APP-DRV-002 pickup capture.
                  </p>
                  <div className="meta" style={{ marginBottom: ".8rem" }}>
                    <span>{selectedStopOrders.length} work item{selectedStopOrders.length === 1 ? "" : "s"}</span>
                    {selectedStopOrders[0]?.dropAddress && <span>{selectedStopOrders[0].dropAddress}</span>}
                    <span>Stop total ${selectedStopTotal.toFixed(2)}</span>
                  </div>
                  {selectedStopOrders.map(order => (
                    <div key={order.id} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".65rem", marginTop: ".65rem" }}>
                      <div className="card-head">
                        <div className="card-title" style={{ fontSize: ".92rem" }}>{order.id} - {order.conNote}</div>
                        <span className="badge b-done">Picked up</span>
                      </div>
                      <div className="meta">
                        <span>{order.vendor}</span>
                        <span>{order.pickupItemType || order.itemType || "Item captured at pickup"}</span>
                        {order.pickupItemQty && <span>Qty {order.pickupItemQty}</span>}
                        <span>${Number(order.pickupCalculatedPrice || order.price || 0).toFixed(2)}</span>
                      </div>
                      {order.notes && <div style={{ fontSize: ".8rem", color: T.mu, marginTop: ".3rem" }}>{order.notes}</div>}
                    </div>
                  ))}
                  <hr className="dvd" />
                  <p style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".7rem" }}>
                    SOP-DEL-04 requires address, goods, receiver, handover, and price review confirmation before POD capture. Use Failed Delivery if any item cannot be confirmed.
                  </p>
                  <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                    <input type="checkbox" checked={deliverySignoffDraft.addressConfirmed} onChange={e => setDeliverySignoffDraft(p => ({ ...p, addressConfirmed: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                    <span>Physical address matches the registered delivery address</span>
                  </label>
                  <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                    <input type="checkbox" checked={deliverySignoffDraft.goodsMatched} onChange={e => setDeliverySignoffDraft(p => ({ ...p, goodsMatched: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                    <span>Goods match the picked-up items for this client account</span>
                  </label>
                  <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                    <input type="checkbox" checked={deliverySignoffDraft.authorisedReceiver} onChange={e => setDeliverySignoffDraft(p => ({ ...p, authorisedReceiver: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                    <span>Authorised receiver is present and willing to accept goods</span>
                  </label>
                  <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0" }}>
                    <input type="checkbox" checked={deliverySignoffDraft.handoverConfirmed} onChange={e => setDeliverySignoffDraft(p => ({ ...p, handoverConfirmed: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                    <span>Goods physically handed over to the receiver</span>
                  </label>
                  <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".55rem 0 .8rem" }}>
                    <input type="checkbox" checked={deliverySignoffDraft.priceReviewed} onChange={e => setDeliverySignoffDraft(p => ({ ...p, priceReviewed: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                    <span>Read-only calculated price reviewed; no driver override required or allowed</span>
                  </label>
                  <button className="btn b-acc" onClick={proceedDeliverySignoff}>Next</button>
                  <button className="btn b-red" style={{ marginTop: ".5rem" }} onClick={() => openPriceDiscrepancyOutcome(sel)}>Report Price Discrepancy</button>
                  <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={closeDeliverySignoff}>Cancel</button>
                </>
              )}

              {step === 2 && (
                <>
                  <p style={{ fontSize: ".82rem", color: T.mu, marginBottom: "1rem" }}>Receiver details & signature</p>
                  <div className="f"><label>Receiver Name *</label><input value={recvName} onChange={e => setRecvName(e.target.value)} placeholder="Full name" /></div>
                  <div style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".7px", textTransform: "uppercase", color: T.mu, marginBottom: ".4rem" }}>Receiver Signature *</div>
                  <SigPad onSig={setSig} />
                  <label style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", fontSize: ".82rem", color: T.tx, margin: ".8rem 0 0" }}>
                    <input type="checkbox" checked={deliverySignoffDraft.deviceSupervised} onChange={e => setDeliverySignoffDraft(p => ({ ...p, deviceSupervised: e.target.checked }))} style={{ width: "auto", marginTop: ".15rem" }} />
                    <span>Driver supervised signature capture and kept the device in sight</span>
                  </label>
                  <div style={{ marginTop: ".9rem", display: "flex", gap: ".6rem" }}>
                    <button className="btn b-ghost b-sm" onClick={() => setStep(1)}>Back</button>
                    <button className="btn b-teal" onClick={complete} disabled={busy}>
                      {busy ? <><span className="spin" />Completing...</> : "Complete Grouped Delivery"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── ADMIN PORTAL ─────────────────────────────────────────────────────────────
function AdminPortal({ orders, clients, drivers, vehicles = [], suppliers, priceRules, exceptions, audit, masterDataChanges, invoices, billingNotices, operationalNotices = [], proofs, exceptionAlerts, driverAvailability, financialReconciliations = [], aiDrafts = [], dataBreachIncidents = [], dataUseRecords = [], privacyRequests = [], accessRecords, runClosures = [], onUpdateOrder, onUpdateOrders, onUpdateClient, onSaveSupplier, onArchiveSupplier, onSavePriceRule, onSaveVehicle, onSaveDriver, onCreateInvoice, onUpdateInvoice, onRecordBillingNotice, onSaveFinancialReconciliation, onCreateAiDraft, onUpdateAiDraft, onSaveDataBreachIncident, onSaveDataUseRecord, onSavePrivacyRequest, onSaveAccessChange, onCreateSupplierReviewException, onCreateSupplierPickupStandardsException, onCreatePricingReviewException, onCreateUnmatchedBillingException, onCreateRunPlanningException, onAcknowledgeException, onUpdateException, onAcknowledgeExceptionAlert, onSaveDriverAvailability, onLogout }) {
  function blankSupplierDraft() {
    return {
      name: "",
      address: "",
      phone: "",
      dockContactRole: "",
      dockContactName: "",
      pickupWindow: "Standard milk run",
      packagingNotes: "",
      dockAccessAgreed: false,
      packagingStandardsAgreed: false,
      pickupWindowAgreed: false,
      supplierApprovalEvidenceRef: "",
      lastReviewed: todayBrisbane(),
      reviewIntervalDays: "",
    };
  }

  function blankDataBreachDraft() {
    return {
      title: "",
      reportedBy: "Admin",
      awarenessDate: todayBrisbane(),
      description: "",
      personalInformationInvolved: "",
      affectedIndividualEstimate: "",
      containmentActions: "",
      containmentStatus: "Identified - containment in progress",
      appPrv004AuditRefs: "",
      systemAccessLogRefs: "",
      digiverseEvidenceRefs: "",
      privacyOwnerName: "",
      privacyOwnerNotificationEvidence: POLICY6_PRIVACY_OWNER_BLOCKER,
      eligibilityDecision: "Blocked - Privacy Owner Unnamed",
      privacyOwnerDecisionNote: "",
      oaicNotificationEvidence: "",
      affectedIndividualsNotificationEvidence: "",
      publicStatementUrl: "",
      postBreachReviewReportRef: "",
      status: "Open - Identify and Contain",
    };
  }

  function blankDataUseDraft() {
    return {
      title: "",
      requestType: "Operational Access",
      requesterRole: "Admin",
      requesterName: "Admin",
      requestDate: todayBrisbane(),
      dataCategories: "",
      purpose: "",
      roleBasis: "",
      serviceDeliveryInvolved: true,
      externalRecipient: "",
      consentEvidence: "",
      adminApprovalEvidence: "",
      productionAccessLogRef: "",
      digiverseScope: "",
      breachEscalationNote: "",
      prohibitedPersonalUse: false,
      storedOnPersonalDevice: false,
      sharesClientDataExternally: false,
      sharesDriverDataToClientsOrSuppliers: false,
      status: "Logged",
    };
  }

  function blankPrivacyRequestDraft() {
    return {
      requestType: "Access Request",
      requesterRole: "Client Operational Contact",
      requesterName: "",
      requesterContact: "",
      relatedAccount: "",
      receivedDate: todayBrisbane(),
      requestSummary: "",
      piiCategories: "",
      collectionNoticeVersion: POLICY4_COLLECTION_NOTICE_SOURCE,
      acknowledgedAt: "",
      acknowledgementEvidence: "",
      accessResponseEvidence: "",
      correctionActionEvidence: "",
      privacyActRefusalGround: "",
      app3Assessment: "",
      couldHaveCollectedUnderApp3: false,
      destructionOrDeidentificationRequested: false,
      privacyOwnerName: "",
      privacyOwnerApprovalEvidence: "",
      outcomeNote: "",
      status: "Open",
    };
  }

  const [view, setView] = useState("dashboard");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selOrder, setSelOrder] = useState(null);
  const [supplierDraft, setSupplierDraft] = useState(() => blankSupplierDraft());
  const [supplierChangeReason, setSupplierChangeReason] = useState("");
  const [editingSupplierId, setEditingSupplierId] = useState("");
  const [priceDraft, setPriceDraft] = useState(() => blankPriceDraft());
  const [priceChangeReason, setPriceChangeReason] = useState("");
  const [priceOwnerApproval, setPriceOwnerApproval] = useState("");
  const [editingPriceRuleId, setEditingPriceRuleId] = useState("");
  const [suspensionTarget, setSuspensionTarget] = useState(null);
  const [suspensionType, setSuspensionType] = useState("non_payment");
  const [suspensionReason, setSuspensionReason] = useState("Non-payment after overdue notice");
  const [conductNoticeEvidence, setConductNoticeEvidence] = useState("");
  const [conductRemedyEvidence, setConductRemedyEvidence] = useState("");
  const [suspensionConfirmName, setSuspensionConfirmName] = useState("");
  const [suspensionNotifyOps, setSuspensionNotifyOps] = useState(true);
  const [suspensionNotifyBilling, setSuspensionNotifyBilling] = useState(true);
  const [reinstatementTarget, setReinstatementTarget] = useState(null);
  const [reinstatementEvidence, setReinstatementEvidence] = useState("");
  const [reinstatementConfirmName, setReinstatementConfirmName] = useState("");
  const [reinstatementResolutionType, setReinstatementResolutionType] = useState("payment_confirmed");
  const [reinstatementArrangementDate, setReinstatementArrangementDate] = useState("");
  const [reinstatementArrangementAmount, setReinstatementArrangementAmount] = useState("");
  const [reinstatementArrangementContact, setReinstatementArrangementContact] = useState("");
  const [reinstatementArrangementEvidence, setReinstatementArrangementEvidence] = useState("");
  const [terminationTarget, setTerminationTarget] = useState(null);
  const [terminationGround, setTerminationGround] = useState("conduct_unremedied");
  const [terminationReason, setTerminationReason] = useState("");
  const [terminationEffectiveDate, setTerminationEffectiveDate] = useState(todayBrisbane());
  const [terminationOwnerConsultation, setTerminationOwnerConsultation] = useState("");
  const [terminationWrittenNotice, setTerminationWrittenNotice] = useState("");
  const [terminationClientRequest, setTerminationClientRequest] = useState("");
  const [terminationConfirmName, setTerminationConfirmName] = useState("");
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentEvidence, setPaymentEvidence] = useState("");
  const [invoiceApprovalTarget, setInvoiceApprovalTarget] = useState(null);
  const [invoiceApprovalNote, setInvoiceApprovalNote] = useState("");
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [reconciliationTarget, setReconciliationTarget] = useState(null);
  const [reconciliationNote, setReconciliationNote] = useState("");
  const [reconciliationNoOffSystemRevenue, setReconciliationNoOffSystemRevenue] = useState(false);
  const [reconciliationExternalAccountantName, setReconciliationExternalAccountantName] = useState("");
  const [investigationTarget, setInvestigationTarget] = useState(null);
  const [investigationOutcome, setInvestigationOutcome] = useState("Resolved from proof review");
  const [investigationNote, setInvestigationNote] = useState("");
  const [policy18Finding, setPolicy18Finding] = useState("proof_confirms_completed");
  const [policy18RemedyNote, setPolicy18RemedyNote] = useState("");
  const [dispatchDraft, setDispatchDraft] = useState({ driverId: drivers[0]?.id || "", vehicleId: activeVehicles(vehicles)[0]?.id || "", vehicleName: "", runDate: "", registrationCurrent: false, insuranceCurrent: false, complianceNote: "" });
  const [vehicleDraft, setVehicleDraft] = useState({ vehicleName: "", registrationPlate: "", make: "", model: "", year: "", ownershipType: "Company", status: "Needs Review", assignedDriverId: drivers[0]?.id || "", registrationExpiry: "", insurancePolicy: "", insuranceExpiry: "", gvmKg: "", lastServiceDate: "", nextServiceDue: "", defectStatus: "Unknown", lastReviewed: todayBrisbane(), notes: "" });
  const [editingVehicleId, setEditingVehicleId] = useState("");
  const [vehicleChangeReason, setVehicleChangeReason] = useState("");
  const [driverDraft, setDriverDraft] = useState(() => normaliseDriverRecord(drivers[0] || {}));
  const [editingDriverId, setEditingDriverId] = useState(drivers[0]?.id || "");
  const [driverChangeReason, setDriverChangeReason] = useState("");
  const [crmTarget, setCrmTarget] = useState(null);
  const [crmDraft, setCrmDraft] = useState(null);
  const [crmEventDraft, setCrmEventDraft] = useState({ eventType: "Decision", description: "", outcome: "", nextAction: "", nextActionOwner: "Admin", nextActionDue: "", healthImpact: "Neutral" });
  const [crmObligationDraft, setCrmObligationDraft] = useState({ obligationType: "Agreed Action", title: "", description: "", direction: "Mutual", dueDate: "", status: "Active", value: "", riskIfBreached: "" });
  const [crmSupplierAccessReason, setCrmSupplierAccessReason] = useState("");
  const [supplierAccessAction, setSupplierAccessAction] = useState(null);
  const [supplierAccessReason, setSupplierAccessReason] = useState("");
  const [availabilityDraft, setAvailabilityDraft] = useState({ driverId: drivers[0]?.id || "", availabilityDate: todayBrisbane(), status: "unavailable", note: "", noticeReceivedDate: "", contingencyPlan: "" });
  const [accessTarget, setAccessTarget] = useState(null);
  const [accessAction, setAccessAction] = useState("");
  const [accessReviewType, setAccessReviewType] = useState("annual");
  const [accessReason, setAccessReason] = useState("");
  const [activationTarget, setActivationTarget] = useState(null);
  const [activationReview, setActivationReview] = useState({
    b2bConfirmed: false,
    serviceAreaConfirmed: false,
    contactsConfirmed: false,
    suppliersConfirmed: false,
    note: "",
  });
  const [supplierAction, setSupplierAction] = useState(null);
  const [supplierActionReasonText, setSupplierActionReasonText] = useState("");
  const [priceAction, setPriceAction] = useState(null);
  const [priceActionReason, setPriceActionReason] = useState("");
  const [priceActionOwnerApproval, setPriceActionOwnerApproval] = useState("");
  const [redeliveryFeeReview, setRedeliveryFeeReview] = useState(null);
  const [redeliveryFeeReviewNote, setRedeliveryFeeReviewNote] = useState("");
  const [accountMatchTarget, setAccountMatchTarget] = useState(null);
  const [accountMatchClientId, setAccountMatchClientId] = useState("");
  const [accountMatchNote, setAccountMatchNote] = useState("");
  const [aiDraftTarget, setAiDraftTarget] = useState(null);
  const [aiDraftReviewTarget, setAiDraftReviewTarget] = useState(null);
  const [aiDraftText, setAiDraftText] = useState("");
  const [aiDraftReviewNote, setAiDraftReviewNote] = useState("");
  const [dataBreachDraft, setDataBreachDraft] = useState(() => blankDataBreachDraft());
  const [editingDataBreachId, setEditingDataBreachId] = useState("");
  const [dataUseDraft, setDataUseDraft] = useState(() => blankDataUseDraft());
  const [editingDataUseId, setEditingDataUseId] = useState("");
  const [privacyRequestDraft, setPrivacyRequestDraft] = useState(() => blankPrivacyRequestDraft());
  const [editingPrivacyRequestId, setEditingPrivacyRequestId] = useState("");
  const [workflowNotice, setWorkflowNotice] = useState("");

  const pending = orders.filter(o => o.status === "Pending").length;
  const enroute = orders.filter(o => o.status === "En Route").length;
  const delivered = orders.filter(o => o.status === "Delivered").length;
  const revenue = orders.filter(o => o.price).reduce((s, o) => s + o.price, 0);
  const openExceptions = exceptions.filter(e => e.status !== "Closed");
  const unmatchedBillingRows = unmatchedBillingAccountRows(orders, clients, exceptions);
  const unmatchedBillingIds = new Set(unmatchedBillingRows.map(row => row.order.id));
  const billableOrders = orders.filter(o => isBillingCandidate(o) && !unmatchedBillingIds.has(o.id));
  const billableRedeliveryFees = orders.filter(o => isRedeliveryBillingCandidate(o) && !unmatchedBillingIds.has(o.id));
  const billableGroups = clients
    .map(client => ({
      client,
      orders: billableOrders.filter(o => o.clientId === client.id),
      redeliveryFees: billableRedeliveryFees.filter(o => o.clientId === client.id),
    }))
    .filter(group => group.orders.length > 0 || group.redeliveryFees.length > 0);
  const day8NoticeRecords = (billingNotices || []).filter(notice => notice.noticeType === "day_8_overdue");
  const overdueNoticeQueue = invoices.filter(invoice => invoice.status === "Overdue" && !day8NoticeRecords.some(notice => notice.invoiceId === invoice.id));
  const financialReconciliationReviewRows = financialReconciliationRows(invoices, financialReconciliations);
  const financialReconciliationOpenRows = financialReconciliationReviewRows.filter(row => row.status !== "Completed");
  const activeAccessCount = (accessRecords || []).filter(record => record.status !== "Revoked").length;
  const revokedAccessCount = (accessRecords || []).filter(record => record.status === "Revoked").length;
  const staffReviewDueCount = (accessRecords || []).filter(record => record.reviewDue).length;
  const operationalNoticeRows = (operationalNotices || []).slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const operationalNoticeClients = new Set(operationalNoticeRows.map(notice => notice.clientId).filter(Boolean)).size;
  const providerNotConfiguredCount = operationalNoticeRows.filter(notice => notice.externalDeliveryStatus === "provider_not_configured").length;
  const failedNotificationRows = notificationFailureRows(operationalNoticeRows, billingNotices || []);
  const activeSupplierList = activeSuppliers(suppliers);
  const supplierApprovalGateRows = activeSupplierList.map(supplier => ({ supplier, gate: supplierApprovalGateState(supplier) }));
  const supplierApprovalGapRows = supplierApprovalGateRows.filter(row => !row.gate.approved);
  const supplierNamedContactGapRows = activeSupplierList.filter(supplier => !String(supplier.dockContactName || "").trim());
  const activeVehicleList = activeVehicles(vehicles);
  const selectedDispatchVehicle = vehicles.find(vehicle => vehicle.id === dispatchDraft.vehicleId)
    || vehicles.find(vehicle => vehicleLabel(vehicle) === dispatchDraft.vehicleName)
    || activeVehicleList[0]
    || null;
  const vehicleComplianceRows = (vehicles || []).map(vehicle => ({ vehicle, compliance: vehicleComplianceState(vehicle, todayBrisbane()) }));
  const vehicleComplianceBlockers = vehicleComplianceRows.filter(row => !row.compliance.ready);
  const serviceWarningCount = vehicleComplianceRows.filter(row => row.compliance.warnings.length > 0).length;
  const supplierReviewHealthRows = supplierReviewRows(suppliers, exceptions);
  const supplierReviewFlagRows = supplierReviewHealthRows.filter(row => row.flagged);
  const supplierReviewOpenQueueRows = supplierReviewHealthRows.filter(row => row.openException);
  const supplierPickupStandardsHealthRows = supplierPickupStandardsRows(suppliers, orders, exceptions);
  const supplierPickupStandardsFlagRows = supplierPickupStandardsHealthRows.filter(row => row.flagged);
  const supplierPickupStandardsOpenQueueRows = supplierPickupStandardsHealthRows.filter(row => row.openException);
  const pricingReviewHealthRows = priceRuleReviewRows(priceRules, exceptions);
  const pricingReviewFlagRows = pricingReviewHealthRows.filter(row => row.flagged);
  const pricingReviewOpenQueueRows = pricingReviewHealthRows.filter(row => row.openException);
  const crmRhythmRows = crmRhythmMonitorRows();
  const crmRhythmByClientId = new Map(crmRhythmRows.map(row => [row.client.id, row]));
  const crmReviewDueCount = crmRhythmRows.filter(row => row.reviewDue).length;
  const crmNextActionDueCount = crmRhythmRows.filter(row => row.nextActionDue).length;
  const crmOverdueObligationCount = crmRhythmRows.reduce((count, row) => count + row.overdueObligations.length, 0);
  const crmIncompleteCount = crmRhythmRows.filter(row => row.incomplete.length > 0).length;
  const unassignedDispatch = orders.filter(o => ["Pending", "Brought Forward"].includes(o.status) && !o.driverId);
  const assignedDispatch = orders
    .filter(o => o.driverId && ["Pending", "En Route"].includes(o.status))
    .sort((a, b) => String(a.runId || "").localeCompare(String(b.runId || "")) || Number(a.runSequence || 9999) - Number(b.runSequence || 9999));
  const nextUnassignedRunDate = unassignedDispatch
    .map(order => order.actualRunDate || order.date)
    .filter(Boolean)
    .sort()[0] || todayBrisbane();
  const compileRunDate = dispatchDraft.runDate || nextUnassignedRunDate;
  const selectedVehicleCompliance = vehicleComplianceState(selectedDispatchVehicle, compileRunDate);
  const compileCandidates = sequenceRunOrders(unassignedDispatch.filter(order => (order.actualRunDate || order.date) === compileRunDate));
  const compileSupplierGroups = Object.values(compileCandidates.reduce((groups, order) => {
    const supplier = order.vendor || "Supplier not recorded";
    if (!groups[supplier]) groups[supplier] = { supplier, zones: {}, orders: [] };
    groups[supplier].orders.push(order);
    const zone = deliveryZone(order.dropAddress);
    if (!groups[supplier].zones[zone]) groups[supplier].zones[zone] = [];
    groups[supplier].zones[zone].push(order);
    return groups;
  }, {}));
  const compileDriver = drivers.find(driver => driver.id === (dispatchDraft.driverId || drivers[0]?.id));
  const compileAvailability = compileDriver ? availabilityFor(compileDriver.id, compileRunDate) : null;
  const compileAvailabilityBlock = compileAvailability && driverAvailabilityBlockingStatus(compileAvailability.status) ? normaliseDriverAvailabilityRecord(compileAvailability) : null;
  const runPlanningRows = runPlanningMonitorRows(orders, exceptions);
  const runPlanningDispatchableRows = runPlanningRows.filter(row => row.totalStops > 0);
  const runPlanningExceptionRows = runPlanningRows.filter(row => row.reasons.some(reason => reason !== "No dispatchable stops for this run date"));
  const runPlanningQueuedRows = runPlanningExceptionRows.filter(row => row.openException);
  const runPlanningCompletionRate = rateLabel(runPlanningDispatchableRows.filter(row => row.compileComplete).length, runPlanningDispatchableRows.length);
  const runPlanningStopCount = runPlanningRows.reduce((sum, row) => sum + row.totalStops, 0);
  const runPlanningNamedCount = runPlanningRows.reduce((sum, row) => sum + row.namedAssignmentOrders.length, 0);
  const runPlanningAssignedCount = runPlanningRows.reduce((sum, row) => sum + row.assignedOrders.length, 0);
  const runPlanningFleetPassCount = runPlanningRows.reduce((sum, row) => sum + row.fleetPassOrders.length, 0);
  const runPlanningAdminInterventionCount = runPlanningRows.reduce((sum, row) => sum + row.adminInterventionOrders.length, 0);
  const runCloseReviewRows = (runClosures || []).slice().reverse().map(close => {
    const driver = drivers.find(item => item.id === close.driverId);
    const driverOrders = orders.filter(order => order.driverId === close.driverId);
    const openStops = driverOrders.filter(order => ["Pending", "En Route"].includes(order.status));
    const closedStops = driverOrders.filter(order => !["Pending", "En Route"].includes(order.status));
    const closedOrderIds = new Set(closedStops.map(order => order.id));
    const linkedProofs = proofs.filter(proof => closedOrderIds.has(proof.orderId) || closedStops.some(order => order.proofId === proof.id));
    const linkedExceptions = exceptions.filter(exception => exception.status !== "Closed" && (exception.driverId === close.driverId || closedOrderIds.has(exception.orderId)));
    return { close, driver, openStops, closedStops, linkedProofs, linkedExceptions };
  });
  const proofRetentionRows = proofs
    .map(proof => {
      const order = orders.find(item => item.id === proof.orderId);
      const client = clients.find(item => item.id === order?.clientId);
      const retentionUntil = proofRetentionUntil(proof);
      return { proof, order, client, retentionUntil, due: retentionUntil <= todayBrisbane() };
    })
    .sort((a, b) => a.retentionUntil.localeCompare(b.retentionUntil));
  const pickupRetentionRows = orders
    .map(order => {
      const client = clients.find(item => item.id === order.clientId);
      const runDate = isoDate(order.actualRunDate || order.date || order.requestedDate);
      const retentionUntil = pickupRequestRetentionUntil(order);
      return { order, client, runDate, retentionUntil, due: retentionUntil <= todayBrisbane() };
    })
    .sort((a, b) => a.retentionUntil.localeCompare(b.retentionUntil));
  const supplierRetentionRows = suppliers
    .map(supplier => {
      const relationshipClosed = supplierRelationshipClosed(supplier);
      const relationshipEndDate = relationshipClosed ? supplierRelationshipEndDate(supplier) : "";
      const retentionUntil = relationshipClosed ? supplierRetentionUntil(supplier) : "";
      return { supplier, relationshipClosed, relationshipEndDate, retentionUntil, due: Boolean(retentionUntil && retentionUntil <= todayBrisbane()) };
    })
    .sort((a, b) => String(a.retentionUntil || "9999-12-31").localeCompare(String(b.retentionUntil || "9999-12-31")));
  const masterDataRetentionRows = (masterDataChanges || [])
    .map(change => {
      const retentionUntil = masterDataChangeRetentionUntil(change);
      return { change, retentionUntil, due: retentionUntil <= todayBrisbane() };
    })
    .sort((a, b) => a.retentionUntil.localeCompare(b.retentionUntil));
  const financialReconciliationRetentionRows = (financialReconciliations || [])
    .map(normaliseFinancialReconciliation)
    .filter(record => record.completedAt)
    .map(record => {
      const retentionUntil = financialReconciliationRetentionUntil(record);
      return { record, retentionUntil, due: retentionUntil <= todayBrisbane() };
    })
    .sort((a, b) => a.retentionUntil.localeCompare(b.retentionUntil));
  const dataBreachRows = (dataBreachIncidents || []).map(normaliseDataBreachIncident).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const openDataBreachRows = dataBreachRows.filter(dataBreachIncidentOpen);
  const overdueDataBreachRows = dataBreachRows.filter(row => dataBreachAssessmentOverdue(row));
  const privacyOwnerBlockedRows = dataBreachRows.filter(row => row.eligibilityDecision === "Blocked - Privacy Owner Unnamed");
  const dataBreachRetentionRows = dataBreachRows
    .filter(record => record.postBreachReviewReportRef && record.postBreachReviewCompletedAt)
    .map(record => {
      const retentionUntil = record.retainedUntil || addYears(isoDate(record.postBreachReviewCompletedAt), 7);
      return { record, retentionUntil, due: retentionUntil <= todayBrisbane() };
    })
    .sort((a, b) => a.retentionUntil.localeCompare(b.retentionUntil));
  const dataUseRows = (dataUseRecords || []).map(normaliseDataUseRecord).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const blockedDataUseRows = dataUseRows.filter(row => row.status === "Blocked" || (row.blockedReasons || []).length > 0);
  const digiverseProductionAccessRows = dataUseRows.filter(row => row.requestType === "Digiverse Production Access");
  const exportDataUseRows = dataUseRows.filter(row => row.requestType === "Data Export");
  const privacyRequestRows = (privacyRequests || []).map(normalisePrivacyRequest).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const openPrivacyRequestRows = privacyRequestRows.filter(privacyRequestOpen);
  const overduePrivacyRequestRows = privacyRequestRows.filter(row => privacyRequestAckOverdue(row) || privacyRequestResponseOverdue(row));
  const privacyOwnerBlockedRequestRows = privacyRequestRows.filter(row => row.status === "Blocked - Privacy Owner Required");
  const retentionDue = [
    ...proofRetentionRows.filter(row => row.due),
    ...pickupRetentionRows.filter(row => row.due),
    ...supplierRetentionRows.filter(row => row.due),
    ...masterDataRetentionRows.filter(row => row.due),
    ...financialReconciliationRetentionRows.filter(row => row.due),
    ...dataBreachRetentionRows.filter(row => row.due),
  ];
  const auditIntegrity = verifyAuditTrail(audit);
  const auditStatusById = new Map(auditIntegrity.rows.map(row => [row.id, row]));
  const piiAuditCount = audit.filter(event => event.piiAction).length;
  const availabilityRows = (driverAvailability || [])
    .map(record => ({ ...normaliseDriverAvailabilityRecord(record), driver: drivers.find(driver => driver.id === record.driverId) }))
    .sort((a, b) => `${b.availabilityDate || ""}`.localeCompare(`${a.availabilityDate || ""}`));
  const blockingAvailabilityRows = availabilityRows.filter(record => driverAvailabilityBlockingStatus(record.status));
  const lateAvailabilityRows = blockingAvailabilityRows.filter(record => record.lateNotice);
  const availabilityContingencyGapRows = blockingAvailabilityRows.filter(record => !String(record.contingencyPlan || "").trim());
  const driverRecordRows = (drivers || []).map(driver => {
    const record = normaliseDriverRecord(driver);
    return { driver: record };
  });
  const activeDriverCount = activeDriverRecords(drivers).length;
  const aiDraftRows = (aiDrafts || []).map(normaliseAiDraft).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  const pendingAiDraftRows = aiDraftRows.filter(aiDraftRequiresReview);
  const approvedAiDraftRows = aiDraftRows.filter(row => row.status === "Approved - Not Sent");
  const rejectedAiDraftRows = aiDraftRows.filter(row => row.status === "Rejected");
  const pendingAiDraftKeys = new Set(pendingAiDraftRows.map(row => `${row.agentId}:${row.targetType}:${row.targetId}`));
  const crmAiCandidates = crmRhythmRows.map(row => ({
    agentId: "AGT-CS-001b",
    targetType: "flagged_client",
    targetId: row.client.id,
    targetName: row.client.name,
    triggerSource: "APP-CS-001a / CRM Rhythm Monitor",
    triggerReason: row.reasons.join("; "),
    reasons: row.reasons,
  }));
  const supplierAiCandidates = [
    ...supplierReviewFlagRows.map(row => ({
      agentId: "AGT-SRM-001b",
      targetType: "flagged_supplier_review",
      targetId: row.supplier.id,
      targetName: row.supplier.name,
      triggerSource: "APP-SRM-001a / Supplier Review Monitor",
      triggerReason: row.reasons.join("; "),
      reasons: row.reasons,
    })),
    ...supplierPickupStandardsFlagRows.map(row => ({
      agentId: "AGT-SRM-001b",
      targetType: "flagged_supplier_pickup",
      targetId: row.supplier.id,
      targetName: row.supplier.name,
      triggerSource: "APP-SRM-001a / Pickup Standards Monitor",
      triggerReason: row.reasons.join("; "),
      reasons: row.reasons,
    })),
  ];
  const adminAiCandidates = openExceptions.slice(0, 8).map(exception => ({
    agentId: "AGT-ADM-007b",
    targetType: "flagged_actor_exception",
    targetId: exception.id,
    targetName: `${exception.type} - ${exception.orderId}`,
    triggerSource: "APP-ADM-005 / Exception Queue",
    triggerReason: exception.note,
    reasons: [exception.note],
  }));
  const aiDraftCandidateRows = [...crmAiCandidates, ...supplierAiCandidates, ...adminAiCandidates]
    .map(candidate => ({
      ...candidate,
      agentName: aiAgentForId(candidate.agentId).name,
      pending: pendingAiDraftKeys.has(`${candidate.agentId}:${candidate.targetType}:${candidate.targetId}`),
    }))
    .filter(candidate => String(candidate.triggerReason || "").trim());

  const filtered = filterStatus === "All" ? orders : orders.filter(o => o.status === filterStatus);

  function showWorkflowNotice(message) {
    setWorkflowNotice(String(message || "A workflow rule blocked this action."));
  }

  function localAiDraftTextForTarget(target) {
    const reason = String(target?.triggerReason || "").trim();
    return [
      "Local AI draft placeholder for Admin review only.",
      `Target: ${target?.targetName || "Flagged actor"}.`,
      `Trigger: ${target?.triggerSource || POLICY20_AI_USE_SOURCE}.`,
      reason ? `Evidence: ${reason}.` : "Evidence: Admin must add source evidence before use.",
      "Draft CTA: Please review the flagged record, confirm the facts, and contact the relevant party through an approved Moto & Co channel only after Admin approval.",
      "Policy #20: no autonomous send and no pricing, commercial, account, suspension, or legal decision authority.",
    ].join("\n");
  }

  function openAiDraftRequest(target) {
    if (!target?.targetId) return showWorkflowNotice("AI draft target required.");
    if (pendingAiDraftKeys.has(`${target.agentId}:${target.targetType}:${target.targetId}`)) {
      return showWorkflowNotice("Policy #20 blocks duplicate unread AI drafts for the same target and agent.");
    }
    setAiDraftTarget(target);
    setAiDraftText(localAiDraftTextForTarget(target));
    setAiDraftReviewNote("");
  }

  function createAiDraftForTarget() {
    if (!aiDraftTarget) return showWorkflowNotice("AI draft target required.");
    const draftText = aiDraftText.trim();
    if (!draftText) return showWorkflowNotice("AI draft text required before the review queue record can be created.");
    onCreateAiDraft({
      ...aiDraftTarget,
      agentName: aiAgentForId(aiDraftTarget.agentId).name,
      draftText,
      status: "Draft Pending Admin Review",
      createdBy: "Admin",
      externalDeliveryStatus: "not_sent_provider_not_configured",
      policyRef: POLICY20_AI_USE_SOURCE,
    });
    setAiDraftTarget(null);
    setAiDraftText("");
  }

  function openAiDraftReview(draft) {
    const row = normaliseAiDraft(draft);
    setAiDraftReviewTarget(row);
    setAiDraftText(row.approvedText || row.draftText || "");
    setAiDraftReviewNote("");
  }

  function approveAiDraftReview() {
    if (!aiDraftReviewTarget) return;
    const note = aiDraftReviewNote.trim();
    const approvedText = aiDraftText.trim();
    if (!approvedText) return showWorkflowNotice("Approved AI draft text required.");
    if (!note) return showWorkflowNotice("Admin review note required before approving a Policy #20 AI draft.");
    onUpdateAiDraft({
      ...aiDraftReviewTarget,
      status: "Approved - Not Sent",
      approvedText,
      reviewNote: note,
      reviewedAt: isoNow(),
      reviewedBy: "Admin",
      externalDeliveryStatus: "not_sent_provider_not_configured",
      sentAt: "",
    });
    setAiDraftReviewTarget(null);
    setAiDraftText("");
    setAiDraftReviewNote("");
  }

  function rejectAiDraftReview() {
    if (!aiDraftReviewTarget) return;
    const note = aiDraftReviewNote.trim();
    if (!note) return showWorkflowNotice("Admin rejection reason required for a Policy #20 AI draft.");
    onUpdateAiDraft({
      ...aiDraftReviewTarget,
      status: "Rejected",
      rejectedReason: note,
      reviewNote: note,
      reviewedAt: isoNow(),
      reviewedBy: "Admin",
      externalDeliveryStatus: "not_sent_provider_not_configured",
      sentAt: "",
    });
    setAiDraftReviewTarget(null);
    setAiDraftText("");
    setAiDraftReviewNote("");
  }

  function editDataBreachIncident(record) {
    const incident = normaliseDataBreachIncident(record);
    setEditingDataBreachId(incident.id);
    setDataBreachDraft(incident);
    setView("ndb");
  }

  function resetDataBreachDraft() {
    setEditingDataBreachId("");
    setDataBreachDraft(blankDataBreachDraft());
  }

  function saveDataBreachDraft() {
    const draft = normaliseDataBreachIncident({
      ...dataBreachDraft,
      id: editingDataBreachId || dataBreachDraft.id,
      updatedAt: isoNow(),
    });
    if (!draft.title.trim()) return showWorkflowNotice("Policy #6 suspected breach title required.");
    if (!draft.awarenessDate) return showWorkflowNotice("Policy #6 awareness date required to calculate the 30-day assessment deadline.");
    if (!draft.description.trim()) return showWorkflowNotice("Policy #6 incident description required.");
    if (!draft.personalInformationInvolved.trim()) return showWorkflowNotice("Policy #6 requires the information accessed, disclosed, or lost to be recorded for assessment.");
    if (!draft.containmentActions.trim()) return showWorkflowNotice("Policy #6 requires Admin/Digiverse containment action evidence.");
    if (!draft.appPrv004AuditRefs.trim()) return showWorkflowNotice("Policy #6 requires APP-PRV-004 audit records to be preserved and referenced.");
    if (["Privacy Owner Assessment", "Notification Required", "Post-Breach Review", "Closed"].includes(draft.status) && !draft.privacyOwnerName.trim()) {
      return showWorkflowNotice("Policy #6 NDB plan cannot operate past Admin containment until the Privacy Owner (ACT-TECH-002) is named.");
    }
    if (["Eligible Data Breach", "Not Eligible"].includes(draft.eligibilityDecision) && !draft.privacyOwnerName.trim()) {
      return showWorkflowNotice("Policy #6 blocks Admin or automation from making the eligible breach decision while the Privacy Owner is unnamed.");
    }
    if (draft.eligibilityDecision === "Eligible Data Breach" && draft.status === "Closed" && (!draft.oaicNotificationEvidence.trim() || !draft.affectedIndividualsNotificationEvidence.trim())) {
      return showWorkflowNotice("Policy #6 eligible breach closure requires OAIC and affected-individual notification evidence.");
    }
    if (draft.status === "Closed" && !draft.postBreachReviewReportRef.trim()) {
      return showWorkflowNotice("Policy #6 closure requires a post-breach review report reference retained for 7 years.");
    }
    onSaveDataBreachIncident(draft);
    resetDataBreachDraft();
  }

  function blockPolicy6EligibilityDecision(incident = null) {
    const target = incident ? normaliseDataBreachIncident(incident) : null;
    showWorkflowNotice(`Policy #6 blocks Admin and automation from deciding whether ${target?.title || "a suspected incident"} is an eligible data breach. The Privacy Owner (ACT-TECH-002) must be named first and must make the decision.`);
  }

  function editDataUseRecord(record) {
    const row = normaliseDataUseRecord(record);
    setEditingDataUseId(row.id);
    setDataUseDraft(row);
    setView("dataUse");
  }

  function resetDataUseDraft() {
    setEditingDataUseId("");
    setDataUseDraft(blankDataUseDraft());
  }

  function saveDataUseDraft() {
    const draft = normaliseDataUseRecord({
      ...dataUseDraft,
      id: editingDataUseId || dataUseDraft.id,
      updatedAt: isoNow(),
    });
    if (!draft.title.trim()) return showWorkflowNotice("Policy #21 data-use request title required.");
    if (!draft.requesterName.trim()) return showWorkflowNotice("Policy #21 requester name required.");
    if (!draft.dataCategories.trim()) return showWorkflowNotice("Policy #21 requires the data category or PII class to be recorded.");
    if (!draft.purpose.trim()) return showWorkflowNotice("Policy #21 requires the access purpose to be recorded.");
    if (!draft.roleBasis.trim()) return showWorkflowNotice("Policy #7 requires the role/RLS basis for access to be recorded.");
    if (draft.requestType === "Data Access Breach" && !draft.breachEscalationNote.trim()) {
      return showWorkflowNotice("Policy #21 requires immediate Admin breach escalation evidence for data access breaches.");
    }
    const blockers = dataUseBlockedReasons(draft);
    const status = blockers.length ? "Blocked" : (draft.requestType === "Data Access Breach" ? "Breach Reported" : "Approved");
    onSaveDataUseRecord?.({ ...draft, blockedReasons: blockers, status });
    if (blockers.length) {
      showWorkflowNotice(`Policy #21 stored this data-use request as Blocked: ${blockers.join(" ")}`);
    }
    resetDataUseDraft();
  }

  function editPrivacyRequest(record) {
    const row = normalisePrivacyRequest(record);
    setEditingPrivacyRequestId(row.id);
    setPrivacyRequestDraft(row);
    setView("privacy");
  }

  function resetPrivacyRequestDraft() {
    setEditingPrivacyRequestId("");
    setPrivacyRequestDraft(blankPrivacyRequestDraft());
  }

  function savePrivacyRequestDraft() {
    const draft = normalisePrivacyRequest({
      ...privacyRequestDraft,
      id: editingPrivacyRequestId || privacyRequestDraft.id,
      updatedAt: isoNow(),
    });
    if (!draft.requesterName.trim()) return showWorkflowNotice("Policy #3 privacy request requires the individual/requester name.");
    if (!draft.requesterContact.trim()) return showWorkflowNotice("Policy #3 privacy request requires contact details so Admin can respond.");
    if (!draft.requestSummary.trim()) return showWorkflowNotice("Policy #3 privacy request summary required.");
    if (!draft.piiCategories.trim()) return showWorkflowNotice("Policy #3 requires the personal information category to be recorded.");
    if (draft.requestType === "Privacy Complaint" && ["Acknowledged", "Resolved", "Refused", "Referred to OAIC"].includes(draft.status) && !draft.acknowledgementEvidence.trim()) {
      return showWorkflowNotice("Policy #3 privacy complaints require acknowledgement evidence.");
    }
    if (draft.status === "Refused" && !draft.privacyActRefusalGround.trim()) {
      return showWorkflowNotice("Policy #3 allows refusal only on Privacy Act-permitted grounds; record the ground/evidence.");
    }
    if (draft.status === "Resolved" && draft.requestType === "Access Request" && !draft.accessResponseEvidence.trim()) {
      return showWorkflowNotice("Policy #3 APP 12 access requests require response evidence before resolution.");
    }
    if (draft.status === "Resolved" && draft.requestType === "Correction Request" && !draft.correctionActionEvidence.trim()) {
      return showWorkflowNotice("Policy #3 APP 13 correction requests require correction action evidence before resolution.");
    }
    if (draft.requestType === "Unsolicited Information" && !draft.app3Assessment.trim()) {
      return showWorkflowNotice("Policy #3 APP 4 requires an APP 3 collection assessment for unsolicited personal information.");
    }
    const needsPrivacyOwner = draft.requestType === "Unsolicited Information" && draft.destructionOrDeidentificationRequested && !draft.couldHaveCollectedUnderApp3;
    const hasPrivacyOwnerApproval = draft.privacyOwnerName.trim() && draft.privacyOwnerApprovalEvidence.trim();
    if (needsPrivacyOwner && !hasPrivacyOwnerApproval) {
      onSavePrivacyRequest?.({ ...draft, status: "Blocked - Privacy Owner Required", outcomeNote: draft.outcomeNote || "APP 4 destruction/de-identification cannot execute until Privacy Owner approval exists." });
      showWorkflowNotice("Policy #5 blocks destruction/de-identification until Privacy Owner approval is recorded.");
      resetPrivacyRequestDraft();
      return;
    }
    const status = draft.status === "Acknowledged" && draft.requestType !== "Privacy Complaint" ? "Open" : draft.status;
    onSavePrivacyRequest?.({
      ...draft,
      status,
      acknowledgedAt: draft.requestType === "Privacy Complaint" && ["Acknowledged", "Resolved", "Refused", "Referred to OAIC"].includes(status) ? (draft.acknowledgedAt || isoNow()) : draft.acknowledgedAt,
      resolvedAt: ["Resolved", "Refused", "Referred to OAIC"].includes(status) ? (draft.resolvedAt || isoNow()) : draft.resolvedAt,
    });
    resetPrivacyRequestDraft();
  }

  function editDriverRecord(driver) {
    const record = normaliseDriverRecord(driver);
    setEditingDriverId(record.id);
    setDriverDraft(record);
    setDriverChangeReason("");
  }

  function saveDriverRecordDraft() {
    if (!editingDriverId) return showWorkflowNotice("Driver record required.");
    if (!driverDraft.name.trim()) return showWorkflowNotice("Driver name required.");
    if (!driverDraft.email.trim()) return showWorkflowNotice("Driver email required.");
    if (!driverChangeReason.trim()) return showWorkflowNotice("Driver record change reason required.");
    onSaveDriver(normaliseDriverRecord({
      ...driverDraft,
      id: editingDriverId,
      name: driverDraft.name.trim(),
      email: driverDraft.email.trim(),
      phone: driverDraft.phone.trim(),
      status: driverDraft.status || "Active",
      notes: driverDraft.notes.trim(),
      lastReviewed: driverDraft.lastReviewed || todayBrisbane(),
    }), driverChangeReason.trim());
    setDriverChangeReason("");
  }

  function availabilityFor(driverId, runDate) {
    const record = (driverAvailability || []).find(record => record.driverId === driverId && record.availabilityDate === runDate);
    return record ? normaliseDriverAvailabilityRecord(record) : null;
  }

  function driverIsBlocked(driverId, runDate) {
    const record = availabilityFor(driverId, runDate);
    return record && driverAvailabilityBlockingStatus(record.status);
  }

  function dispatchAvailabilityBlock(order) {
    const driverId = dispatchDraft.driverId || drivers[0]?.id;
    const runDate = order.actualRunDate || order.date;
    const record = availabilityFor(driverId, runDate);
    if (!record || !driverAvailabilityBlockingStatus(record.status)) return null;
    const driver = drivers.find(item => item.id === driverId);
    return { ...record, driverName: driver?.name || record.driverName || driverId };
  }

  function saveAvailabilityDraft() {
    const driver = drivers.find(item => item.id === availabilityDraft.driverId);
    const blockingStatus = driverAvailabilityBlockingStatus(availabilityDraft.status);
    const noticeReceivedDate = optionalIsoDate(availabilityDraft.noticeReceivedDate);
    const noticeDueDate = driverAvailabilityNoticeDueDate(availabilityDraft.availabilityDate);
    const contingencyPlan = String(availabilityDraft.contingencyPlan || "").trim();
    if (!driver) return showWorkflowNotice("Driver required for availability record");
    if (!availabilityDraft.availabilityDate) return showWorkflowNotice("Availability date required");
    if (blockingStatus && !availabilityDraft.note.trim()) return showWorkflowNotice("Unavailable or leave records require a note");
    if (blockingStatus && !noticeReceivedDate) return showWorkflowNotice("Policy #22 requires the driver notice received date for unavailable or leave records.");
    if (blockingStatus && !contingencyPlan) return showWorkflowNotice("Policy #22 requires Admin contingency evidence while single-driver capacity remains the current model.");
    onSaveDriverAvailability({
      ...availabilityDraft,
      driverName: driver.name,
      note: availabilityDraft.note.trim(),
      noticeReceivedDate,
      noticeDueDate,
      lateNotice: Boolean(blockingStatus && noticeReceivedDate && noticeDueDate && noticeReceivedDate > noticeDueDate),
      contingencyPlan,
      sourceRef: POLICY22_DRIVER_SCHEDULING_SOURCE,
    });
    setAvailabilityDraft({ driverId: driver.id, availabilityDate: availabilityDraft.availabilityDate, status: "unavailable", note: "", noticeReceivedDate: "", contingencyPlan: "" });
  }

  function blankVehicleDraft() {
    return { vehicleName: "", registrationPlate: "", make: "", model: "", year: "", ownershipType: "Company", status: "Needs Review", assignedDriverId: drivers[0]?.id || "", registrationExpiry: "", insuranceExpiry: "", lastServiceDate: "", nextServiceDue: "", defectStatus: "Unknown", lastReviewed: todayBrisbane(), notes: "" };
  }

  function saveVehicleDraft() {
    if (!vehicleDraft.vehicleName.trim()) return showWorkflowNotice("Vehicle name or call sign required.");
    if (!vehicleChangeReason.trim()) return showWorkflowNotice("Vehicle change reason required.");
    if (vehicleDraft.status === "Active" && (!vehicleDraft.registrationExpiry || !vehicleDraft.insuranceExpiry)) return showWorkflowNotice("Active vehicles require registration and insurance expiry dates.");
    if (vehicleDraft.status === "Active" && vehicleDraft.defectStatus === "Open Defect") return showWorkflowNotice("A vehicle with an open defect cannot be active for dispatch.");
    onSaveVehicle({
      ...vehicleDraft,
      id: editingVehicleId || `vehicle-${Date.now()}`,
      vehicleName: vehicleDraft.vehicleName.trim(),
      registrationPlate: vehicleDraft.registrationPlate.trim(),
      make: vehicleDraft.make.trim(),
      model: vehicleDraft.model.trim(),
      year: vehicleDraft.year,
      insurancePolicy: vehicleDraft.insurancePolicy.trim(),
      gvmKg: vehicleDraft.gvmKg,
      notes: vehicleDraft.notes.trim(),
      lastReviewed: vehicleDraft.lastReviewed || todayBrisbane(),
    }, vehicleChangeReason.trim());
    setVehicleDraft(blankVehicleDraft());
    setEditingVehicleId("");
    setVehicleChangeReason("");
  }

  function editVehicle(vehicle) {
    setEditingVehicleId(vehicle.id);
    setVehicleDraft({
      vehicleName: vehicle.vehicleName || "",
      registrationPlate: vehicle.registrationPlate || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      ownershipType: vehicle.ownershipType || "Company",
      status: vehicle.status || "Needs Review",
      assignedDriverId: vehicle.assignedDriverId || "",
      registrationExpiry: vehicle.registrationExpiry || "",
      insuranceExpiry: vehicle.insuranceExpiry || "",
      lastServiceDate: vehicle.lastServiceDate || "",
      nextServiceDue: vehicle.nextServiceDue || "",
      defectStatus: vehicle.defectStatus || "Unknown",
      lastReviewed: vehicle.lastReviewed || todayBrisbane(),
      notes: vehicle.notes || "",
    });
    setVehicleChangeReason("");
  }

  function cancelVehicleEdit() {
    setEditingVehicleId("");
    setVehicleDraft(blankVehicleDraft());
    setVehicleChangeReason("");
  }

  function blankCrmClient() {
    return {
      id: `c${Date.now()}`,
      name: "",
      email: "",
      phone: "",
      address: "",
      vendors: [],
      status: "Pending",
      courierEligible: false,
      operationalContact: { name: "", email: "" },
      billingContact: { name: "", email: "" },
      relationshipOwner: "",
      relationshipTier: "Transactional",
      relationshipStatus: "Active",
      riskLevel: "Low",
      reviewDate: todayBrisbane(),
      nextAction: "",
      nextActionOwner: "Admin",
      nextActionDue: "",
      crmNotes: "",
      crmEvents: [],
      obligations: [],
    };
  }

  function clientOpenIssues(client) {
    const clientOrderIds = new Set(orders.filter(order => order.clientId === client.id || order.clientName === client.name).map(order => order.id));
    return openExceptions.filter(exception => clientOrderIds.has(exception.orderId) || exception.orderId === client.id || String(exception.note || "").includes(client.name));
  }

  function crmIncompleteReasons(client) {
    const missing = [];
    if (!client.relationshipOwner) missing.push("owner");
    if (!client.reviewDate) missing.push("review date");
    if (!client.nextAction) missing.push("next action");
    if (client.nextAction && !client.nextActionDue) missing.push("next action due");
    return missing;
  }

  function crmDateDue(date, today = todayBrisbane()) {
    return Boolean(date && String(date).slice(0, 10) <= today);
  }

  function activeCrmObligations(client) {
    return (client.obligations || []).filter(item => !["Fulfilled", "Terminated"].includes(item.status));
  }

  function overdueCrmObligations(client, today = todayBrisbane()) {
    return activeCrmObligations(client).filter(item => ["Overdue", "Disputed"].includes(item.status) || crmDateDue(item.dueDate, today));
  }

  function crmRhythmMonitorRows() {
    const today = todayBrisbane();
    return clients.map(client => {
      const incomplete = crmIncompleteReasons(client);
      const openIssues = clientOpenIssues(client);
      const overdueObligations = overdueCrmObligations(client, today);
      const reviewDue = crmDateDue(client.reviewDate, today);
      const nextActionDue = crmDateDue(client.nextActionDue, today);
      const atRisk = ["At-Risk", "Suspended"].includes(client.relationshipStatus || client.status)
        || ["High", "Critical"].includes(client.riskLevel || "")
        || openIssues.length > 0
        || overdueObligations.length > 0;
      const reasons = [
        ...incomplete.map(reason => `CRM incomplete: ${reason}`),
        ...(reviewDue ? [`Review due ${fmtFullDate(client.reviewDate)}`] : []),
        ...(nextActionDue ? [`Next action due ${fmtFullDate(client.nextActionDue)}`] : []),
        ...overdueObligations.map(item => `Obligation ${item.status || "Active"}: ${item.title}${item.dueDate ? ` due ${fmtFullDate(item.dueDate)}` : ""}`),
        ...(openIssues.length ? [`${openIssues.length} open issue${openIssues.length === 1 ? "" : "s"}`] : []),
        ...(atRisk && !openIssues.length && !overdueObligations.length ? [`Relationship risk ${client.riskLevel || client.relationshipStatus || "At-Risk"}`] : []),
      ];
      return { client, incomplete, openIssues, overdueObligations, reviewDue, nextActionDue, atRisk, reasons, flagged: reasons.length > 0 };
    }).filter(row => row.flagged);
  }

  function statusBadge(s) {
    const cls = { Pending: "b-pending", "En Route": "b-enroute", Delivered: "b-done", "No Pickup": "b-cancelled", "Brought Forward": "b-pending", "Failed Delivery": "b-cancelled", Cancelled: "b-cancelled" };
    return <span className={`badge ${cls[s] || "b-pending"}`}>{s}</span>;
  }

  function activationRequirementState(client, review = activationReview) {
    const addressStatus = physicalAddressStatus(client?.address);
    const contactStatus = contactEligibilityStatus(client);
    const supplierStatus = supplierEligibilityStatus(client);
    const checks = [
      {
        key: "b2bConfirmed",
        label: "B2B workshop account confirmed",
        source: "Eligibility criteria include B2B.",
        available: Boolean(String(client?.name || "").trim()),
        checked: Boolean(review.b2bConfirmed),
        detail: String(client?.name || "").trim() ? client.name : "Business name required",
      },
      {
        key: "serviceAreaConfirmed",
        label: "Physical delivery address in SEQ service area confirmed",
        source: "Delivery address must be physical, in SEQ service area, and not a PO box.",
        available: addressStatus.ok,
        checked: Boolean(review.serviceAreaConfirmed),
        detail: addressStatus.reason,
      },
      {
        key: "contactsConfirmed",
        label: "Operational and Billing contacts confirmed",
        source: "Both contacts must have real names and working email addresses before activation.",
        available: contactStatus.ok,
        checked: Boolean(review.contactsConfirmed),
        detail: contactStatus.reason,
      },
      {
        key: "suppliersConfirmed",
        label: "At least one approved supplier confirmed",
        source: "Eligibility criteria include approved supplier.",
        available: supplierStatus.ok,
        checked: Boolean(review.suppliersConfirmed),
        detail: supplierStatus.reason,
      },
    ];
    return { checks, canActivate: true };
  }

  function openCrmRecord(client = null) {
    const next = client || blankCrmClient();
    setCrmTarget(client);
    setCrmDraft({
      ...next,
      operationalContact: { name: next.operationalContact?.name || "", email: next.operationalContact?.email || next.email || "" },
      billingContact: { name: next.billingContact?.name || "", email: next.billingContact?.email || "" },
      vendors: next.vendors || [],
      relationshipOwner: next.relationshipOwner || "",
      relationshipTier: next.relationshipTier || "Transactional",
      relationshipStatus: next.relationshipStatus || (next.status === "Suspended" ? "Suspended" : "Active"),
      riskLevel: next.riskLevel || "Low",
      reviewDate: next.reviewDate || "",
      nextAction: next.nextAction || "",
      nextActionOwner: next.nextActionOwner || "Admin",
      nextActionDue: next.nextActionDue || "",
      crmNotes: next.crmNotes || "",
      crmEvents: next.crmEvents || [],
      obligations: next.obligations || [],
    });
    setCrmEventDraft({ eventType: "Decision", description: "", outcome: "", nextAction: "", nextActionOwner: "Admin", nextActionDue: "", healthImpact: "Neutral" });
    setCrmObligationDraft({ obligationType: "Agreed Action", title: "", description: "", direction: "Mutual", dueDate: "", status: "Active", value: "", riskIfBreached: "" });
    setCrmSupplierAccessReason("");
  }

  function saveCrmRecord() {
    if (!crmDraft) return;
    if (!crmDraft.name.trim() || !crmDraft.email.trim() || !crmDraft.phone.trim() || !crmDraft.address.trim()) return showWorkflowNotice("Workshop name, email, phone, and delivery address are required.");
    if (!physicalAddressStatus(crmDraft.address).ok) return showWorkflowNotice("Delivery address must be a physical address in the SEQ service area. PO boxes are not accepted.");
    if (!crmDraft.operationalContact?.name?.trim() || !crmDraft.operationalContact?.email?.trim()) return showWorkflowNotice("Operational contact name and email are required.");
    if (!crmDraft.billingContact?.name?.trim() || !crmDraft.billingContact?.email?.trim()) return showWorkflowNotice("Billing contact name and email are required.");
    if (!crmDraft.relationshipOwner.trim()) return showWorkflowNotice("Village CRM requires a named internal relationship owner.");

    const eventDescription = crmEventDraft.description.trim();
    const obligationTitle = crmObligationDraft.title.trim();
    if ((crmEventDraft.nextAction.trim() || crmEventDraft.nextActionDue) && !eventDescription) {
      return showWorkflowNotice("Event next action requires an event description.");
    }
    if (crmEventDraft.nextActionDue && !crmEventDraft.nextAction.trim()) {
      return showWorkflowNotice("Event next action due date requires a next action.");
    }
    if ((obligationTitle || crmObligationDraft.description.trim()) && (!obligationTitle || !crmObligationDraft.description.trim() || !crmObligationDraft.riskIfBreached.trim())) {
      return showWorkflowNotice("Obligations require title, description, and risk if breached.");
    }

    const previousVendorList = (crmTarget?.vendors || []).slice().sort();
    const nextVendorList = (crmDraft.vendors || []).slice().sort();
    const supplierAccessChanged = JSON.stringify(previousVendorList) !== JSON.stringify(nextVendorList);
    const supplierAccessReason = crmSupplierAccessReason.trim();
    if (supplierAccessChanged && !supplierAccessReason) return showWorkflowNotice("Supplier access change reason required.");

    const crmEvents = [...(crmDraft.crmEvents || [])];
    if (eventDescription) {
      crmEvents.push({
        id: `crm-event-${Date.now()}`,
        eventType: crmEventDraft.eventType,
        eventDate: isoNow(),
        description: eventDescription,
        outcome: crmEventDraft.outcome.trim(),
        nextAction: crmEventDraft.nextAction.trim(),
        nextActionOwner: crmEventDraft.nextActionOwner.trim(),
        nextActionDue: crmEventDraft.nextActionDue,
        createdBy: "Admin",
        healthImpact: crmEventDraft.healthImpact,
      });
    }

    const obligations = [...(crmDraft.obligations || [])];
    if (obligationTitle) {
      obligations.push({
        id: `crm-obligation-${Date.now()}`,
        obligationType: crmObligationDraft.obligationType,
        title: obligationTitle,
        description: crmObligationDraft.description.trim(),
        direction: crmObligationDraft.direction,
        dueDate: crmObligationDraft.dueDate,
        status: crmObligationDraft.status,
        value: crmObligationDraft.value.trim(),
        riskIfBreached: crmObligationDraft.riskIfBreached.trim(),
      });
    }

    const status = crmDraft.relationshipStatus === "Closed" ? "Closed" : (crmDraft.relationshipStatus === "Suspended" ? "Suspended" : (crmDraft.status || "Active"));
    const supplierAccessChange = supplierAccessChanged ? {
      id: `supplier-access-${Date.now()}`,
      action: "crm_update",
      previousSuppliers: previousVendorList,
      nextSuppliers: nextVendorList,
      reason: supplierAccessReason,
      at: isoNow(),
      actor: "Admin",
      source: "Admin CRM Review",
    } : null;
    onUpdateClient({
      ...crmDraft,
      name: crmDraft.name.trim(),
      email: crmDraft.email.trim().toLowerCase(),
      phone: crmDraft.phone.trim(),
      address: crmDraft.address.trim(),
      operationalContact: { name: crmDraft.operationalContact.name.trim(), email: crmDraft.operationalContact.email.trim().toLowerCase() },
      billingContact: { name: crmDraft.billingContact.name.trim(), email: crmDraft.billingContact.email.trim().toLowerCase() },
      relationshipOwner: crmDraft.relationshipOwner.trim(),
      nextAction: crmEventDraft.nextAction.trim() || crmDraft.nextAction.trim(),
      nextActionOwner: crmEventDraft.nextActionOwner.trim() || crmDraft.nextActionOwner.trim(),
      nextActionDue: crmEventDraft.nextActionDue || crmDraft.nextActionDue,
      crmNotes: crmDraft.crmNotes.trim(),
      status,
      courierEligible: status === "Active" && crmDraft.relationshipStatus !== "Inactive",
      crmEvents,
      obligations,
      supplierAccessChangeLog: supplierAccessChange ? [...(crmDraft.supplierAccessChangeLog || []), supplierAccessChange] : (crmDraft.supplierAccessChangeLog || []),
      crmReviewedAt: isoNow(),
      auditDetail: `${crmDraft.name.trim()} CRM record reviewed; owner ${crmDraft.relationshipOwner.trim()}; relationship ${crmDraft.relationshipStatus}; ${eventDescription ? "event added; " : ""}${obligationTitle ? "obligation added; " : ""}${(crmDraft.vendors || []).length} supplier link(s)${supplierAccessChanged ? `; supplier access reason: ${supplierAccessReason}` : ""}`,
    });
    setCrmTarget(null);
    setCrmDraft(null);
    setCrmSupplierAccessReason("");
  }

  function saveSupplier() {
    if (!supplierDraft.name || !supplierDraft.address || !supplierDraft.dockContactRole || !supplierDraft.pickupWindow) return showWorkflowNotice("Supplier name, dock address, dock contact role, and pickup window required");
    if (!supplierChangeReason.trim()) return showWorkflowNotice("Supplier change reason required");
    const intervalNumber = Number(supplierDraft.reviewIntervalDays || 0);
    if (supplierDraft.reviewIntervalDays !== "" && (!Number.isFinite(intervalNumber) || intervalNumber <= 0)) return showWorkflowNotice("Review interval must be a positive number of days or blank if not confirmed.");
    const reviewIntervalDays = supplierDraft.reviewIntervalDays === "" ? "" : String(Math.floor(intervalNumber));
    const storedSupplier = {
      ...supplierDraft,
      id: editingSupplierId || `sup-${Date.now()}`,
      name: supplierDraft.name.trim(),
      address: supplierDraft.address.trim(),
      phone: supplierDraft.phone.trim(),
      dockContactRole: supplierDraft.dockContactRole.trim(),
      dockContactName: supplierDraft.dockContactName.trim(),
      pickupWindow: supplierDraft.pickupWindow.trim(),
      packagingNotes: supplierDraft.packagingNotes.trim(),
      dockAccessAgreed: Boolean(supplierDraft.dockAccessAgreed),
      packagingStandardsAgreed: Boolean(supplierDraft.packagingStandardsAgreed),
      pickupWindowAgreed: Boolean(supplierDraft.pickupWindowAgreed),
      supplierApprovalEvidenceRef: supplierDraft.supplierApprovalEvidenceRef.trim(),
      status: supplierDraft.status || "Active",
      lastReviewed: supplierDraft.lastReviewed || todayBrisbane(),
      reviewIntervalDays,
    };
    const approvalGate = supplierApprovalGateState(storedSupplier);
    if ((storedSupplier.status || "Active") === "Active" && !approvalGate.approved) {
      return showWorkflowNotice("POL-MCL-001-001 Supplier Approval Gate requires dock access, packaging standards, pickup window, and written approval evidence before an active supplier can be saved.");
    }
    onSaveSupplier(storedSupplier, supplierChangeReason.trim());
    setSupplierDraft(blankSupplierDraft());
    setSupplierChangeReason("");
    setEditingSupplierId("");
  }

  function supplierOpenWorkCount(supplierName) {
    return orders.filter(o => o.vendor === supplierName && ["Pending", "En Route", "Brought Forward"].includes(o.status)).length;
  }

  function editSupplier(supplier) {
    setEditingSupplierId(supplier.id);
    setSupplierDraft({
      name: supplier.name || "",
      address: supplier.address || "",
      phone: supplier.phone || "",
      dockContactRole: supplier.dockContactRole || "",
      dockContactName: supplier.dockContactName || "",
      pickupWindow: supplier.pickupWindow || "",
      packagingNotes: supplier.packagingNotes || "",
      dockAccessAgreed: Boolean(supplier.dockAccessAgreed),
      packagingStandardsAgreed: Boolean(supplier.packagingStandardsAgreed),
      pickupWindowAgreed: Boolean(supplier.pickupWindowAgreed),
      supplierApprovalEvidenceRef: supplier.supplierApprovalEvidenceRef || "",
      status: supplier.status || "Active",
      lastReviewed: supplier.lastReviewed || todayBrisbane(),
      reviewIntervalDays: supplier.reviewIntervalDays || "",
    });
    setSupplierChangeReason("");
  }

  function cancelSupplierEdit() {
    setEditingSupplierId("");
    setSupplierDraft(blankSupplierDraft());
    setSupplierChangeReason("");
  }

  function openSupplierAction(supplier, action) {
    setSupplierAction({ supplier, action });
    setSupplierActionReasonText(action === "review" ? "SOP-MDM-01 supplier record reviewed" : "");
  }

  function closeSupplierAction() {
    setSupplierAction(null);
    setSupplierActionReasonText("");
  }

  function confirmSupplierAction() {
    if (!supplierAction?.supplier) return;
    const reason = supplierActionReasonText.trim();
    if (!reason) return showWorkflowNotice("Supplier action reason required.");
    const supplier = supplierAction.supplier;
    if (supplierAction.action === "review") {
      onSaveSupplier({ ...supplier, lastReviewed: todayBrisbane() }, reason);
    } else if (supplierAction.action === "archive") {
      onArchiveSupplier(supplier.id, reason);
    } else if (supplierAction.action === "reactivate") {
      const { archivedAt, archivedReason, ...reactivatedSupplier } = supplier;
      const nextSupplier = { ...reactivatedSupplier, status: "Active", lastReviewed: todayBrisbane(), reactivatedAt: isoNow(), reactivationReason: reason };
      if (!supplierApprovalGateState(nextSupplier).approved) {
        return showWorkflowNotice("POL-MCL-001-001 Supplier Approval Gate must be complete before reactivation.");
      }
      onSaveSupplier(nextSupplier, reason);
    }
    closeSupplierAction();
  }

  function queueSupplierReviewFlag(row) {
    if (!row?.flagged) return;
    if (row.openException) {
      showWorkflowNotice(`${row.supplier.name} already has an open supplier master-data exception.`);
      return;
    }
    onCreateSupplierReviewException(row);
  }

  function queueAllSupplierReviewFlags() {
    supplierReviewFlagRows
      .filter(row => !row.openException)
      .forEach(row => onCreateSupplierReviewException(row));
  }

  function queueSupplierPickupStandardsFlag(row) {
    if (row.openException) {
      showWorkflowNotice("Supplier pickup standards review is already in the exception queue.");
      return;
    }
    onCreateSupplierPickupStandardsException(row);
  }

  function queueAllSupplierPickupStandardsFlags() {
    supplierPickupStandardsFlagRows
      .filter(row => !row.openException)
      .forEach(row => onCreateSupplierPickupStandardsException(row));
  }

  function queuePricingReviewFlag(row) {
    if (!row?.flagged) return;
    if (row.openException) {
      showWorkflowNotice(`${row.rule.label || row.rule.id} already has an open pricing master-data exception.`);
      return;
    }
    onCreatePricingReviewException(row);
  }

  function queueAllPricingReviewFlags() {
    pricingReviewFlagRows
      .filter(row => !row.openException)
      .forEach(row => onCreatePricingReviewException(row));
  }

  function queueUnmatchedBilling(row) {
    if (!row?.order) return;
    if (row.openException) {
      showWorkflowNotice(`${row.order.id} already has an open unmatched billing account exception.`);
      return;
    }
    onCreateUnmatchedBillingException(row);
  }

  function queueAllUnmatchedBilling() {
    unmatchedBillingRows
      .filter(row => !row.openException)
      .forEach(row => onCreateUnmatchedBillingException(row));
  }

  function queueRunPlanningException(row) {
    if (!row?.reasons?.length) return;
    if (row.openException) {
      showWorkflowNotice(`${fmtFullDate(row.runDate)} already has an open run planning exception.`);
      return;
    }
    onCreateRunPlanningException(row);
  }

  function queueAllRunPlanningExceptions() {
    runPlanningExceptionRows
      .filter(row => !row.openException)
      .forEach(row => onCreateRunPlanningException(row));
  }

  function openAccountMatch(row) {
    if (!row?.order) return;
    const firstCandidate = row.match?.candidates?.[0];
    setAccountMatchTarget(row);
    setAccountMatchClientId(firstCandidate?.id || activeClientAccounts(clients)[0]?.id || "");
    setAccountMatchNote("");
  }

  function confirmAccountMatch() {
    const order = accountMatchTarget?.order;
    const client = clients.find(item => item.id === accountMatchClientId);
    const note = accountMatchNote.trim();
    if (!order) return;
    if (!client) {
      showWorkflowNotice("Select the correct active client account before resolving the billing match.");
      return;
    }
    if ((client.status || "Active") !== "Active" || client.courierEligible === false) {
      showWorkflowNotice("SOP-EXC-03 correction requires an active billing account.");
      return;
    }
    if (!note) {
      showWorkflowNotice("Admin investigation note required before correcting an unmatched billing account.");
      return;
    }
    const resolvedAt = isoNow();
    onUpdateOrder({
      ...order,
      clientId: client.id,
      clientName: client.name,
      billingAccountMatchStatus: "resolved",
      billingAccountMatchedAt: resolvedAt,
      billingAccountMatchedBy: "admin",
      billingAccountMatchSource: "SOP-EXC-03",
      billingAccountMatchNote: note,
    });
    const linkedException = accountMatchTarget.openException || exceptions.find(exception =>
      exception.type === "Unmatched Billing Account" &&
      exception.orderId === order.id &&
      exception.status !== "Closed"
    );
    if (linkedException) {
      onAcknowledgeException(linkedException.id, {
        policy: "SOP-EXC-03 / Policy #10a / APP-ADM-005",
        outcome: "Billing account match corrected",
        note: `${order.id} matched to ${client.name}. ${note}`,
        linkedOrderIds: [order.id],
        linkedProofIds: order.proofId ? [order.proofId] : [],
        investigatedAt: resolvedAt,
        investigatedBy: "Admin",
      });
    }
    setAccountMatchTarget(null);
    setAccountMatchClientId("");
    setAccountMatchNote("");
  }

  function blankPriceDraft() {
    return {
      serviceVariant: "SVC-MCL-001-T",
      label: "",
      itemType: "tyre",
      tyreCountMin: "",
      tyreCountMax: "",
      weightBand: "",
      rateDollars: "",
      rateMode: "flat",
      effectiveFrom: todayBrisbane(),
      effectiveTo: "",
      status: "Active",
      changeLogId: "",
    };
  }

  function priceRuleToDraft(rule) {
    return {
      serviceVariant: rule.serviceVariant || (rule.itemType === "parts" ? "SVC-MCL-001-P" : "SVC-MCL-001-T"),
      label: rule.label || "",
      itemType: rule.itemType || (rule.weightBand ? "parts" : "tyre"),
      tyreCountMin: rule.tyreCountMin || rule.minQty || "",
      tyreCountMax: rule.tyreCountMax || "",
      weightBand: rule.weightBand || "",
      rateDollars: String(priceRuleDollars(rule)),
      rateMode: priceRuleRateMode(rule),
      effectiveFrom: rule.effectiveFrom || todayBrisbane(),
      effectiveTo: rule.effectiveTo || "",
      status: rule.status || "Active",
      changeLogId: rule.changeLogId || "",
    };
  }

  function savePriceRule() {
    const rateDollars = Number(priceDraft.rateDollars);
    const tyreMin = priceDraft.tyreCountMin === "" ? undefined : Number(priceDraft.tyreCountMin);
    const tyreMax = priceDraft.tyreCountMax === "" ? undefined : Number(priceDraft.tyreCountMax);
    if (!priceDraft.label || !priceDraft.serviceVariant || !priceDraft.itemType || !priceDraft.effectiveFrom || Number.isNaN(rateDollars) || rateDollars < 0) {
      return showWorkflowNotice("Pricing label, service variant, item type, rate, and effective date required");
    }
    if (priceDraft.itemType === "tyre" && !tyreMin) return showWorkflowNotice("Tyre price rules require a minimum tyre count");
    if (priceDraft.itemType === "parts" && !priceDraft.weightBand) return showWorkflowNotice("Parts price rules require a weight band");
    if (!priceChangeReason.trim()) return showWorkflowNotice("Pricing change reason required");
    if (!priceOwnerApproval.trim()) return showWorkflowNotice("Owner approval reference required before a local price rule can take effect");
    const rateCents = Math.round(rateDollars * 100);
    const rule = {
      id: editingPriceRuleId || `price-${Date.now()}`,
      serviceVariant: priceDraft.serviceVariant,
      label: priceDraft.label,
      itemType: priceDraft.itemType,
      tyreCountMin: priceDraft.itemType === "tyre" ? tyreMin : undefined,
      tyreCountMax: priceDraft.itemType === "tyre" ? tyreMax : undefined,
      weightBand: priceDraft.itemType === "parts" ? priceDraft.weightBand : undefined,
      rateCents,
      rateMode: priceDraft.rateMode,
      effectiveFrom: priceDraft.effectiveFrom,
      effectiveTo: priceDraft.effectiveTo || undefined,
      status: priceDraft.status || "Active",
      changeLogId: `local-price-change-${Date.now()}`,
      amount: rateCents / 100,
      method: priceDraft.rateMode === "per_item" ? "perItem" : "fixed",
      minQty: priceDraft.itemType === "tyre" ? tyreMin : undefined,
    };
    onSavePriceRule(rule, { reason: priceChangeReason.trim(), ownerApprovalRef: priceOwnerApproval.trim(), effectiveDate: priceDraft.effectiveFrom });
    setPriceDraft(blankPriceDraft());
    setPriceChangeReason("");
    setPriceOwnerApproval("");
    setEditingPriceRuleId("");
  }

  function editPriceRule(rule) {
    setEditingPriceRuleId(rule.id);
    setPriceDraft(priceRuleToDraft(rule));
    setPriceChangeReason("");
    setPriceOwnerApproval("");
  }

  function cancelPriceEdit() {
    setEditingPriceRuleId("");
    setPriceDraft(blankPriceDraft());
    setPriceChangeReason("");
    setPriceOwnerApproval("");
  }

  function openPriceAction(rule) {
    setPriceAction({ rule, action: rule.status === "Archived" ? "reactivate" : "archive" });
    setPriceActionReason("");
    setPriceActionOwnerApproval("");
  }

  function closePriceAction() {
    setPriceAction(null);
    setPriceActionReason("");
    setPriceActionOwnerApproval("");
  }

  function confirmPriceAction() {
    if (!priceAction?.rule) return;
    const reason = priceActionReason.trim();
    const ownerApprovalRef = priceActionOwnerApproval.trim();
    if (!reason) return showWorkflowNotice("Pricing action reason required.");
    if (!ownerApprovalRef) return showWorkflowNotice("Owner approval reference required before a local price rule can be changed.");
    const rule = priceAction.rule;
    onSavePriceRule(
      { ...rule, status: rule.status === "Archived" ? "Active" : "Archived", changedAt: isoNow(), changeLogId: `local-price-change-${Date.now()}` },
      { reason, ownerApprovalRef, effectiveDate: rule.effectiveFrom || todayBrisbane() }
    );
    closePriceAction();
  }

  function openAccessAction(record, action) {
    const reviewType = defaultAccessReviewType(action, record);
    setAccessTarget(record);
    setAccessAction(action);
    setAccessReviewType(reviewType);
    setAccessReason(action === "review" ? (reviewType === "annual" ? "Annual access review completed" : "") : action === "restore" ? "Access restored after review" : "");
  }

  function confirmAccessAction() {
    if (!accessTarget || !accessAction) return;
    const reason = accessReason.trim();
    if (!accessReviewTypeAllowed(accessReviewType)) return showWorkflowNotice("Access review type required.");
    if (!reason) return showWorkflowNotice("Access review or change reason required.");
    onSaveAccessChange(accessTarget, accessAction, reason, accessReviewType);
    setAccessTarget(null);
    setAccessAction("");
    setAccessReviewType("annual");
    setAccessReason("");
  }

  function overdueInvoicesForClient(clientId) {
    return invoices.filter(invoice => invoice.clientId === clientId && invoice.status === "Overdue");
  }

  function day8NoticeForInvoice(invoiceId) {
    return day8NoticeRecords.find(notice => notice.invoiceId === invoiceId);
  }

  function canRecordDay8Notice(invoice) {
    return isDay8NoticeDue(invoice) && !day8NoticeForInvoice(invoice.id);
  }

  function invoiceForException(exception) {
    return invoices.find(invoice => invoice.id === exception.invoiceId || invoice.id === exception.orderId);
  }

  function supplierForException(exception) {
    if (!["Supplier Master Data Review", "Supplier Pickup Standards Review", "WHS Hazard"].includes(exception.type)) return null;
    const linkedOrder = orders.find(order => order.id === exception.orderId);
    return suppliers.find(supplier =>
      supplier.id === exception.orderId ||
      supplier.id === exception.supplierId ||
      supplier.name === exception.supplierName ||
      supplier.name === linkedOrder?.vendor
    );
  }

  function priceRuleForException(exception) {
    if (exception.type !== "Pricing Master Data Review") return null;
    return priceRules.find(rule => rule.id === exception.orderId || rule.id === exception.priceRuleId);
  }

  function exceptionInvestigationControl(exception) {
    if (exception.type === "Supplier Master Data Review") {
      return {
        policy: "SOP-MDM-01 / CAP-MCL-001 / POL-MCL-001-001",
        evidence: "Master-data review",
        defaultOutcome: "Supplier master-data reviewed",
        notePlaceholder: "Record fields corrected, review interval set, reason for deferral, or remaining source gap.",
      };
    }
    if (exception.type === "Supplier Pickup Standards Review") {
      return {
        policy: "Policy #15 / Policy #16 / CAP-MCL-001 / APP-SRM-001a",
        evidence: "Pickup standards review",
        defaultOutcome: "Supplier pickup standards reviewed",
        notePlaceholder: "Record supplier contact, packaging/window issue, corrective action, or monitoring decision.",
      };
    }
    if (exception.type === "WHS Hazard") {
      return {
        policy: "Policy #27 / APP-DRV-002 / WHS",
        evidence: "Driver hazard report, No Pickup record, supplier follow-up, and unresolved hazard decision",
        defaultOutcome: "WHS hazard reviewed",
        notePlaceholder: "Record supplier contact, hazard status, driver safety decision, and whether return to the premises remains blocked.",
      };
    }
    if (["Fatigue / Health Concern", "WHS Incident / Near Miss", "Pre-Trip Defect"].includes(exception.type)) {
      return {
        policy: "Policy #27 / APP-ADM-002 / WHS",
        evidence: "Driver report and Admin run-safety decision",
        defaultOutcome: `${exception.type} reviewed`,
        notePlaceholder: "Record whether the driver is stood down, run is held/reassigned, WHS notification is required, or the safety concern is resolved.",
      };
    }
    if (exception.type === "Pricing Master Data Review") {
      return {
        policy: "Policy #9 / SOP-MDM-02 pricing master data",
        evidence: "Pricing review",
        defaultOutcome: "Pricing master-data reviewed",
        notePlaceholder: "Record corrected pricing fields, change-log evidence, Owner approval reference, or remaining source gap.",
      };
    }
    if (exception.type === "Unmatched Billing Account") {
      return {
        policy: "SOP-EXC-03 / Policy #10a / APP-ADM-005",
        evidence: "POD proof, pickup capture, delivery address, con note, supplier, and delivery date",
        defaultOutcome: "Billing account match investigated",
        notePlaceholder: "Record corrected account_id, account evidence reviewed, invoice-period treatment, or why the account remains unresolved.",
      };
    }
    if (exception.type === "Cancellation Request") {
      return {
        policy: "Policy #14 / APP-ADM-001 cancellation review",
        evidence: "Cancellation request",
        defaultOutcome: "Cancellation reviewed",
        notePlaceholder: "Record whether goods were collected, Admin judgement, client notification evidence, and billing impact.",
      };
    }
    if (exception.type === "Failed Delivery") {
      return {
        policy: "Policy #8 / APP-DRV-003 / APP-ADM-004",
        evidence: "Failed delivery attempt records",
        defaultOutcome: "Failed delivery reviewed",
        notePlaceholder: "Record attempt count, goods handling, return-to-supplier status, and redelivery fee decision.",
      };
    }
    if (exception.type === "Delivery Dispute") {
      return {
        policy: "Policy #18 / APP-DRV-003 delivery proof review",
        evidence: "Receiver name, signature, proof image, and delivery timestamp",
        defaultOutcome: "Delivery dispute resolved",
        notePlaceholder: "Record proof reviewed, receiver/signature finding, client response, remedy if delivery error confirmed, and Owner escalation if requested.",
      };
    }
    if (exception.type === "Billing Dispute") {
      return {
        policy: "Policy #18 / APP-DRV-002 pickup capture / APP-ADM-004 invoice review",
        evidence: "Pickup capture, invoice line, pricing rule, and delivery proof",
        defaultOutcome: "Billing query resolved",
        notePlaceholder: "Record invoice line reviewed, pickup/pricing evidence, credit or corrected invoice decision, and Owner escalation if requested.",
      };
    }
    return {
      policy: "Policy #18 / APP-DRV-003 proof review",
      evidence: "Proof review",
      defaultOutcome: exception.type === "Billing Dispute" ? "Billing query resolved" : "Resolved from proof review",
      notePlaceholder: "Record the proof records, invoice line, customer issue, and resolution decision.",
    };
  }

  function ordersForException(exception) {
    if (exception.type === "Delivery Dispute") {
      return orders.filter(order => order.id === exception.orderId || order.id === exception.disputedOrderId);
    }
    if (exception.type === "Billing Dispute" && exception.invoiceLineOrderId) {
      return orders.filter(order => order.id === exception.invoiceLineOrderId || order.id === exception.disputedOrderId);
    }
    const invoice = invoiceForException(exception);
    if (invoice) {
      const orderIds = new Set((invoice.lines || []).map(line => line.orderId));
      return orders.filter(order => orderIds.has(order.id));
    }
    return orders.filter(order => order.id === exception.orderId);
  }

  function proofsForException(exception) {
    const linkedOrders = ordersForException(exception);
    const linkedOrderIds = new Set(linkedOrders.map(order => order.id));
    const linkedProofIds = new Set(linkedOrders.map(order => order.proofId).filter(Boolean));
    return proofs.filter(proof => linkedOrderIds.has(proof.orderId) || linkedProofIds.has(proof.id));
  }

  function exceptionAgeHours(exception) {
    const created = new Date(exception.createdAt || isoNow()).getTime();
    if (Number.isNaN(created)) return 0;
    return Math.max(0, Math.floor((Date.now() - created) / 3600000));
  }

  function exceptionTypeCounts() {
    return openExceptions.reduce((summary, exception) => {
      summary[exception.type] = (summary[exception.type] || 0) + 1;
      return summary;
    }, {});
  }

  function exceptionAlertRows() {
    return openExceptions
      .slice()
      .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
      .map(exception => ({
        exception,
        linkedOrders: ordersForException(exception),
        linkedProofs: proofsForException(exception),
        ageHours: exceptionAgeHours(exception),
      }));
  }

  function reviewedExceptionAlert() {
    return (exceptionAlerts || []).find(alert => alert.alertDate === todayBrisbane() && alert.audience === "Admin" && alert.channel === "local_dashboard");
  }

  function markExceptionAlertReviewed() {
    const rows = exceptionAlertRows();
    const typeCounts = exceptionTypeCounts();
    onAcknowledgeExceptionAlert({
      id: `exception-alert-${todayBrisbane()}-admin-local`,
      alertDate: todayBrisbane(),
      audience: "Admin",
      channel: "local_dashboard",
      status: "reviewed",
      openExceptionCount: openExceptions.length,
      proofLinkedCount: rows.filter(row => row.linkedProofs.length > 0).length,
      typeCounts,
      exceptionIds: rows.map(row => row.exception.id),
      generatedAt: isoNow(),
      reviewedAt: isoNow(),
    });
  }

  function acknowledgePolicy18Dispute(exception) {
    if (!isPolicy18Dispute(exception)) return;
    if (exception.acknowledgedAt) return showWorkflowNotice("Policy #18 acknowledgement is already recorded.");
    onUpdateException(exception.id, {
      acknowledgedAt: isoNow(),
      acknowledgedBy: "Admin",
      acknowledgementStatus: "Acknowledged",
      status: exception.status || "Open",
    }, "Policy #18 dispute acknowledged");
  }

  function escalatePolicy18Dispute(exception) {
    if (!isPolicy18Dispute(exception)) return;
    if (exception.ownerEscalationStatus === "Requested") return showWorkflowNotice("Owner escalation is already requested for this Policy #18 dispute.");
    onUpdateException(exception.id, {
      ownerEscalationStatus: "Requested",
      ownerEscalatedAt: isoNow(),
      ownerDecisionStatus: "Pending",
      severity: "High",
    }, "Policy #18 owner escalation requested");
  }

  function recordPolicy18Outcome(exception, investigation, linkedOrders) {
    if (!isPolicy18Dispute(exception)) return;
    const outcomeRecord = {
      exceptionId: exception.id,
      disputeType: exception.type,
      disputeReason: exception.disputeReason || "",
      disputeReasonLabel: exception.disputeReasonLabel || policy18ReasonLabel(exception.disputeReason),
      disputedDeliveryDate: exception.disputedDeliveryDate || "",
      invoiceId: exception.invoiceId || "",
      policy18TimingStatus: exception.policy18TimingStatus || "",
      policy18TimingLabel: exception.policy18TimingLabel || "",
      acknowledgedAt: exception.acknowledgedAt || "",
      ownerEscalationStatus: exception.ownerEscalationStatus || "Not Requested",
      outcome: investigation.outcome,
      note: investigation.note,
      finding: investigation.policy18Finding || "",
      findingLabel: investigation.policy18FindingLabel || "",
      remedyRequired: Boolean(investigation.policy18RemedyRequired),
      remedyType: investigation.policy18RemedyType || "none",
      remedyLabel: investigation.policy18RemedyLabel || "No remedy required",
      remedyDueDate: investigation.policy18RemedyDueDate || "",
      remedyStatus: investigation.policy18RemedyStatus || "Not Required",
      remedyNote: investigation.policy18RemedyNote || "",
      investigatedAt: investigation.investigatedAt,
      investigatedBy: investigation.investigatedBy,
      policy: investigation.policy,
    };
    if (linkedOrders.length > 0) {
      onUpdateOrders(
        linkedOrders.map(order => ({
          ...order,
          policy18DisputeStatus: "Resolved",
          policy18LastOutcome: investigation.outcome,
          policy18LastOutcomeAt: investigation.investigatedAt,
          policy18LastExceptionId: exception.id,
          policy18LastInvestigationNote: investigation.note,
          policy18LastFinding: investigation.policy18Finding || "",
          policy18LastFindingLabel: investigation.policy18FindingLabel || "",
          policy18RemedyRequired: Boolean(investigation.policy18RemedyRequired),
          policy18RemedyType: investigation.policy18RemedyType || "none",
          policy18RemedyLabel: investigation.policy18RemedyLabel || "No remedy required",
          policy18RemedyDueDate: investigation.policy18RemedyDueDate || "",
          policy18RemedyStatus: investigation.policy18RemedyStatus || "Not Required",
          policy18RemedyNote: investigation.policy18RemedyNote || "",
          policy18DisputeHistory: [...(order.policy18DisputeHistory || []), { ...outcomeRecord, orderId: order.id }],
        })),
        `Policy #18 dispute outcome recorded against ${linkedOrders.map(order => order.id).join(", ")}`
      );
    }
    const linkedInvoice = invoiceForException(exception);
    if (linkedInvoice) {
      onUpdateInvoice({
        ...linkedInvoice,
        policy18DisputeStatus: "Resolved",
        policy18LastOutcome: investigation.outcome,
        policy18LastOutcomeAt: investigation.investigatedAt,
        policy18LastExceptionId: exception.id,
        policy18LastInvestigationNote: investigation.note,
        policy18LastFinding: investigation.policy18Finding || "",
        policy18LastFindingLabel: investigation.policy18FindingLabel || "",
        policy18RemedyRequired: Boolean(investigation.policy18RemedyRequired),
        policy18RemedyType: investigation.policy18RemedyType || "none",
        policy18RemedyLabel: investigation.policy18RemedyLabel || "No remedy required",
        policy18RemedyDueDate: investigation.policy18RemedyDueDate || "",
        policy18RemedyStatus: investigation.policy18RemedyStatus || "Not Required",
        policy18RemedyNote: investigation.policy18RemedyNote || "",
        policy18DisputeHistory: [...(linkedInvoice.policy18DisputeHistory || []), outcomeRecord],
      });
    }
  }

  function openInvestigation(exception) {
    setInvestigationTarget(exception);
    setInvestigationOutcome(exceptionInvestigationControl(exception).defaultOutcome);
    setInvestigationNote("");
    setPolicy18Finding(isPolicy18Dispute(exception) ? defaultPolicy18Finding(exception) : "proof_confirms_completed");
    setPolicy18RemedyNote("");
  }

  function closeInvestigation() {
    if (!investigationTarget) return;
    const note = investigationNote.trim();
    const outcome = investigationOutcome.trim();
    if (!outcome) return showWorkflowNotice("Investigation outcome required.");
    if (!note) return showWorkflowNotice("Investigation note required.");
    const isPolicy18 = isPolicy18Dispute(investigationTarget);
    const finding = isPolicy18 ? policy18FindingForValue(investigationTarget, policy18Finding) : null;
    if (isPolicy18 && !finding) return showWorkflowNotice("Policy #18 finding required.");
    const investigatedAt = isoNow();
    const remedy = isPolicy18 ? policy18RemedyForFinding(investigationTarget, finding.value, investigatedAt) : null;
    const remedyNote = policy18RemedyNote.trim();
    if (remedy?.remedyRequired && !remedyNote) return showWorkflowNotice("Policy #18 remedy note required when a remedy is required.");
    const linkedOrders = ordersForException(investigationTarget);
    const linkedProofs = proofsForException(investigationTarget);
    const control = exceptionInvestigationControl(investigationTarget);
    const linkedPriceRule = priceRuleForException(investigationTarget);
    const investigation = {
      policy: control.policy,
      outcome,
      note,
      supplierId: supplierForException(investigationTarget)?.id || investigationTarget.supplierId || "",
      priceRuleId: linkedPriceRule?.id || investigationTarget.priceRuleId || "",
      linkedOrderIds: linkedOrders.map(order => order.id),
      linkedProofIds: linkedProofs.map(proof => proof.id),
      policy18Finding: finding?.value || "",
      policy18FindingLabel: finding?.label || "",
      policy18RemedyRequired: Boolean(remedy?.remedyRequired),
      policy18RemedyType: remedy?.remedyType || "none",
      policy18RemedyLabel: remedy?.remedyLabel || "No remedy required",
      policy18RemedyDueDate: remedy?.remedyDueDate || "",
      policy18RemedyStatus: remedy?.remedyStatus || "Not Required",
      policy18RemedyNote: remedyNote,
      investigatedAt,
      investigatedBy: "Admin",
    };
    recordPolicy18Outcome(investigationTarget, investigation, linkedOrders);
    onAcknowledgeException(investigationTarget.id, investigation);
    setInvestigationTarget(null);
    setInvestigationOutcome("Resolved from proof review");
    setInvestigationNote("");
    setPolicy18Finding("proof_confirms_completed");
    setPolicy18RemedyNote("");
  }

  function openSuspension(client, invoice = null) {
    if (invoice && !day8NoticeForInvoice(invoice.id)) {
      showWorkflowNotice("Record the Day 8 overdue notice before suspending for non-payment.");
      return;
    }
    const nextType = invoice ? "non_payment" : "material_conduct_breach";
    setSuspensionTarget({ client, invoice });
    setSuspensionType(nextType);
    setSuspensionReason(invoice ? `Non-payment after overdue notice: ${invoice.id}` : "Material conduct breach not remedied after Admin notice");
    setConductNoticeEvidence("");
    setConductRemedyEvidence("");
    setSuspensionConfirmName("");
    setSuspensionNotifyOps(true);
    setSuspensionNotifyBilling(true);
  }

  function confirmSuspension() {
    if (!suspensionTarget) return;
    const { client, invoice } = suspensionTarget;
    const reason = suspensionReason.trim();
    if (suspensionConfirmName.trim() !== client.name) return showWorkflowNotice("Type the exact account name before suspending.");
    if (!reason) return showWorkflowNotice("Suspension reason required.");
    if (!POLICY23_SUSPENSION_TYPES.includes(suspensionType)) return showWorkflowNotice("Select a Policy #23 suspension ground.");
    if (suspensionType === "non_payment" && (!invoice || !day8NoticeForInvoice(invoice.id))) return showWorkflowNotice("Non-payment suspension requires linked Day 8 overdue notice evidence.");
    if (suspensionType === "material_conduct_breach") {
      if (!conductNoticeEvidence.trim()) return showWorkflowNotice("Conduct breach notice evidence required before suspension.");
      if (!conductRemedyEvidence.trim()) return showWorkflowNotice("Conduct breach unremedied evidence required before suspension.");
    }
    if (!suspensionNotifyOps || !suspensionNotifyBilling) return showWorkflowNotice("Record notification evidence for both Operational and Billing contacts.");
    const notifiedAt = isoNow();
    onUpdateClient({
      ...client,
      status: "Suspended",
      courierEligible: false,
      suspensionReason: reason,
      suspendedAt: notifiedAt,
      suspendedBy: "admin",
      suspensionRecord: {
        date: notifiedAt,
        type: suspensionType,
        typeLabel: policy23SuspensionTypeLabel(suspensionType),
        reason,
        invoiceId: invoice?.id || "",
        conductNoticeEvidence: conductNoticeEvidence.trim(),
        conductRemedyEvidence: conductRemedyEvidence.trim(),
        notificationSent: suspensionNotifyOps && suspensionNotifyBilling,
        operationalContactNotified: suspensionNotifyOps,
        billingContactNotified: suspensionNotifyBilling,
        notifiedAt,
        sourceRef: POLICY23_ACCOUNT_STATUS_SOURCE,
      },
    });
    setSuspensionTarget(null);
    setSuspensionType("non_payment");
    setSuspensionReason("Non-payment after overdue notice");
    setConductNoticeEvidence("");
    setConductRemedyEvidence("");
    setSuspensionConfirmName("");
  }

  function openReinstatement(client) {
    setReinstatementTarget(client);
    setReinstatementEvidence("");
    setReinstatementConfirmName("");
    setReinstatementResolutionType("payment_confirmed");
    setReinstatementArrangementDate("");
    setReinstatementArrangementAmount("");
    setReinstatementArrangementContact("");
    setReinstatementArrangementEvidence("");
  }

  function confirmReinstatement() {
    if (!reinstatementTarget) return;
    const evidence = reinstatementEvidence.trim();
    const arrangementDate = reinstatementArrangementDate.trim();
    const arrangementAmount = reinstatementArrangementAmount.trim();
    const arrangementContact = reinstatementArrangementContact.trim();
    const arrangementEvidence = reinstatementArrangementEvidence.trim();
    const isPaymentArrangement = reinstatementResolutionType === "payment_arrangement";
    if (reinstatementTarget.status === "Closed" || reinstatementTarget.terminationRecord) {
      return showWorkflowNotice("Policy #23 does not allow a terminated account to be reinstated without Admin and Owner approval plus a new account agreement.");
    }
    if (reinstatementConfirmName.trim() !== reinstatementTarget.name) return showWorkflowNotice("Type the exact account name before reinstating.");
    if (!evidence) return showWorkflowNotice("Payment clearance or reinstatement evidence required.");
    if (isPaymentArrangement && (!arrangementDate || !arrangementAmount || !arrangementContact || !arrangementEvidence)) {
      return showWorkflowNotice("Payment arrangement requires agreed date, amount, contact name/role, and written evidence reference.");
    }
    const reinstatedAt = isoNow();
    onUpdateClient({
      ...reinstatementTarget,
      status: "Active",
      courierEligible: true,
      reinstatedAt,
      reinstatedBy: "admin",
      reinstatementRecord: {
        date: reinstatedAt,
        evidence,
        resolutionType: reinstatementResolutionType,
        paymentArrangement: isPaymentArrangement ? {
          agreedPaymentDate: arrangementDate,
          agreedAmount: arrangementAmount,
          agreedByNameAndRole: arrangementContact,
          writtenEvidenceRef: arrangementEvidence,
        } : null,
        notificationSent: true,
        notificationMode: "automatic_on_admin_action",
        operationalContactNotified: true,
        billingContactNotified: true,
        notifiedAt: reinstatedAt,
        sourceRef: POLICY23_ACCOUNT_STATUS_SOURCE,
      },
    });
    setReinstatementTarget(null);
    setReinstatementEvidence("");
    setReinstatementConfirmName("");
    setReinstatementResolutionType("payment_confirmed");
    setReinstatementArrangementDate("");
    setReinstatementArrangementAmount("");
    setReinstatementArrangementContact("");
    setReinstatementArrangementEvidence("");
  }

  function openTermination(client) {
    setTerminationTarget(client);
    const defaultGround = client.status === "Suspended" && client.suspensionRecord?.type === "material_conduct_breach"
      ? "conduct_unremedied"
      : "voluntary_request";
    setTerminationGround(defaultGround);
    setTerminationReason(defaultGround === "voluntary_request" ? "Client requested account closure" : "Conduct suspension has not resulted in remedy");
    setTerminationEffectiveDate(todayBrisbane());
    setTerminationOwnerConsultation("");
    setTerminationWrittenNotice("");
    setTerminationClientRequest("");
    setTerminationConfirmName("");
  }

  function closeTermination() {
    setTerminationTarget(null);
    setTerminationGround("conduct_unremedied");
    setTerminationReason("");
    setTerminationEffectiveDate(todayBrisbane());
    setTerminationOwnerConsultation("");
    setTerminationWrittenNotice("");
    setTerminationClientRequest("");
    setTerminationConfirmName("");
  }

  function confirmTermination() {
    if (!terminationTarget) return;
    const reason = terminationReason.trim();
    const ownerConsultation = terminationOwnerConsultation.trim();
    const writtenNotice = terminationWrittenNotice.trim();
    const clientRequest = terminationClientRequest.trim();
    if (terminationConfirmName.trim() !== terminationTarget.name) return showWorkflowNotice("Type the exact account name before terminating.");
    if (!POLICY23_TERMINATION_GROUNDS.includes(terminationGround)) return showWorkflowNotice("Select a Policy #23 termination ground.");
    if (terminationGround === "repeated_non_payment") return showWorkflowNotice(`Policy #23 repeated non-payment termination is blocked. ${POLICY23_DEBT_RECOVERY_GAP}.`);
    if (!reason) return showWorkflowNotice("Termination reason required.");
    if (!terminationEffectiveDate) return showWorkflowNotice("Termination effective date required.");
    if (!ownerConsultation) return showWorkflowNotice("Owner consultation evidence required before termination.");
    if (!writtenNotice) return showWorkflowNotice("Written termination notice evidence required.");
    if (terminationGround === "voluntary_request" && !clientRequest) return showWorkflowNotice("Client closure request evidence required for voluntary termination.");
    if (terminationGround === "conduct_unremedied") {
      if (terminationTarget.status !== "Suspended" || terminationTarget.suspensionRecord?.type !== "material_conduct_breach") {
        return showWorkflowNotice("Conduct termination requires a prior conduct suspension record that has not resulted in remedy.");
      }
    }
    const terminatedAt = isoNow();
    const openInvoices = invoices.filter(invoice => invoice.clientId === terminationTarget.id && invoice.status !== "Paid");
    const outstandingTotal = openInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    onUpdateClient({
      ...terminationTarget,
      status: "Closed",
      relationshipStatus: "Closed",
      courierEligible: false,
      terminatedAt,
      terminatedBy: "admin",
      terminationRecord: {
        date: terminatedAt,
        effectiveDate: terminationEffectiveDate,
        ground: terminationGround,
        groundLabel: policy23TerminationGroundLabel(terminationGround),
        reason,
        ownerConsultationEvidence: ownerConsultation,
        writtenNoticeEvidence: writtenNotice,
        clientRequestEvidence: clientRequest,
        priorSuspensionType: terminationTarget.suspensionRecord?.type || "",
        priorSuspensionDate: terminationTarget.suspensionRecord?.date || "",
        outstandingInvoiceCount: openInvoices.length,
        outstandingInvoiceTotal: outstandingTotal,
        outstandingInvoiceNote: openInvoices.length ? `${openInvoices.length} outstanding invoice(s), total $${outstandingTotal.toFixed(2)}, remain payable.` : "No outstanding local invoice records at termination.",
        sourceRef: POLICY23_ACCOUNT_STATUS_SOURCE,
      },
      auditDetail: `${terminationTarget.name} account terminated under ${policy23TerminationGroundLabel(terminationGround)}. Effective ${terminationEffectiveDate}; Owner consultation: ${ownerConsultation}; written notice: ${writtenNotice}`,
      auditActor: "admin",
    });
    closeTermination();
  }

  function openPayment(invoice) {
    if (!invoice.dispatchRecordedAt) {
      showWorkflowNotice("Payment monitoring starts after invoice dispatch under SOP-BIL-04. Record dispatch evidence before payment evidence.");
      return;
    }
    setPaymentTarget(invoice);
    setPaymentEvidence(invoice.paymentEvidence || "");
  }

  function openInvoiceApproval(invoice) {
    setInvoiceApprovalTarget(invoice);
    setInvoiceApprovalNote(invoice.invoiceApprovalNote || "");
  }

  function confirmInvoiceApproval() {
    if (!invoiceApprovalTarget) return;
    const note = invoiceApprovalNote.trim();
    if (!note) return showWorkflowNotice("Admin invoice review note required before confirming the invoice is correct.");
    const approvedAt = isoNow();
    onUpdateInvoice({
      ...invoiceApprovalTarget,
      status: "Sent",
      invoiceApprovalStatus: "Approved",
      invoiceApprovedAt: approvedAt,
      invoiceApprovedBy: "admin",
      invoiceApprovalSource: "SOP-BIL-04 rendered invoice review / DECISIONS-REGISTER Gap 24",
      invoiceApprovalNote: note,
      sentAt: approvedAt,
      dispatchChannel: "local_record_only",
      dispatchRecipient: invoiceApprovalTarget.billingEmail,
      dispatchExternalStatus: "provider_not_configured",
      dispatchNote: `Automatic dispatch triggered by Admin invoice correctness confirmation. Review note: ${note}`,
      dispatchRecordedAt: approvedAt,
      dispatchRecordedBy: "admin",
    });
    setInvoiceApprovalTarget(null);
    setInvoiceApprovalNote("");
  }

  function confirmPayment() {
    if (!paymentTarget) return;
    const evidence = paymentEvidence.trim();
    if (!evidence) return showWorkflowNotice("Payment evidence or reference required.");
    const paidAt = isoNow();
    onUpdateInvoice({
      ...paymentTarget,
      status: "Paid",
      paidAt,
      paymentEvidence: evidence,
      paymentSource: "local_admin_evidence",
      paymentRecordedAt: paidAt,
      paymentRecordedBy: "admin",
    });
    setPaymentTarget(null);
    setPaymentEvidence("");
  }

  function openFinancialReconciliation(row) {
    setReconciliationTarget(row);
    setReconciliationNote(row.record?.note || "");
    setReconciliationNoOffSystemRevenue(Boolean(row.record?.noOffSystemRevenueConfirmed));
    setReconciliationExternalAccountantName(row.record?.externalAccountantName || "");
  }

  function confirmFinancialReconciliation() {
    if (!reconciliationTarget) return;
    const note = reconciliationNote.trim();
    if (!reconciliationNoOffSystemRevenue) return showWorkflowNotice("Policy #24 requires Admin confirmation that all revenue is recorded through APP-ADM-003/004 and no off-system invoice has been used.");
    if (!note) return showWorkflowNotice("Policy #24 month-end reconciliation note required.");
    const completedAt = isoNow();
    const record = normaliseFinancialReconciliation({
      ...(reconciliationTarget.record || {}),
      id: reconciliationTarget.record?.id || `financial-reconciliation-${Date.now()}`,
      period: reconciliationTarget.period,
      monthEndDate: reconciliationTarget.monthEndDate,
      dueDate: reconciliationTarget.dueDate,
      status: "Completed",
      completedAt,
      completedBy: "admin",
      invoiceIds: reconciliationTarget.invoices.map(invoice => invoice.id),
      invoiceCount: reconciliationTarget.invoiceCount,
      subtotal: reconciliationTarget.subtotal,
      gst: reconciliationTarget.gst,
      total: reconciliationTarget.total,
      paidTotal: reconciliationTarget.paidTotal,
      unpaidTotal: reconciliationTarget.unpaidTotal,
      paymentRecordCount: reconciliationTarget.paymentRecords.length,
      overdueInvoiceCount: reconciliationTarget.overdueInvoices.length,
      noOffSystemRevenueConfirmed: true,
      externalAccountantName: reconciliationExternalAccountantName.trim(),
      portfolioReportStatus: "Blocked - Otimi Rules cadence/format unconfirmed",
      note,
      sourceRef: POLICY24_REVENUE_SOURCE,
    });
    onSaveFinancialReconciliation(record);
    setReconciliationTarget(null);
    setReconciliationNote("");
    setReconciliationNoOffSystemRevenue(false);
    setReconciliationExternalAccountantName("");
  }

  function openSupplierAccessAction(client, supplierName) {
    const linked = (client.vendors || []).includes(supplierName);
    setSupplierAccessAction({ client, supplierName, action: linked ? "remove" : "add" });
    setSupplierAccessReason("");
  }

  function closeSupplierAccessAction() {
    setSupplierAccessAction(null);
    setSupplierAccessReason("");
  }

  function confirmSupplierAccessAction() {
    if (!supplierAccessAction) return;
    const reason = supplierAccessReason.trim();
    if (!reason) return showWorkflowNotice("Supplier access change reason required.");
    const { client, supplierName, action } = supplierAccessAction;
    const current = client.vendors || [];
    const vendors = action === "remove"
      ? current.filter(name => name !== supplierName)
      : Array.from(new Set([...current, supplierName]));
    const change = {
      id: `supplier-access-${Date.now()}`,
      action,
      supplierName,
      previousSuppliers: current,
      nextSuppliers: vendors,
      reason,
      at: isoNow(),
      actor: "Admin",
      source: "Admin Clients supplier access action",
    };
    onUpdateClient({
      ...client,
      vendors,
      supplierAccessChangeLog: [...(client.supplierAccessChangeLog || []), change],
      auditDetail: `${client.name} supplier access ${action === "add" ? "added" : "removed"}: ${supplierName}. Reason/evidence: ${reason}`,
      auditActor: "admin",
    });
    closeSupplierAccessAction();
  }

  function openActivationReview(client) {
    const review = client.activationEligibility || {};
    setActivationTarget(client);
    setActivationReview({
      b2bConfirmed: Boolean(review.b2bConfirmed),
      serviceAreaConfirmed: Boolean(review.serviceAreaConfirmed),
      contactsConfirmed: Boolean(review.contactsConfirmed),
      suppliersConfirmed: Boolean(review.suppliersConfirmed),
      note: review.note || "",
    });
  }

  function setActivationCheck(key, checked) {
    setActivationReview(review => ({ ...review, [key]: checked }));
  }

  function confirmActivationReview() {
    if (!activationTarget) return;
    const reviewedAt = isoNow();
    const addressStatus = physicalAddressStatus(activationTarget.address);
    const contactStatus = contactEligibilityStatus(activationTarget);
    const supplierStatus = supplierEligibilityStatus(activationTarget);
    onUpdateClient({
      ...activationTarget,
      status: "Active",
      courierEligible: true,
      activatedAt: activationTarget.activatedAt || reviewedAt,
      activationReviewedAt: reviewedAt,
      activationEligibility: {
        b2bConfirmed: Boolean(String(activationTarget.name || "").trim()),
        serviceAreaConfirmed: addressStatus.ok,
        contactsConfirmed: contactStatus.ok,
        suppliersConfirmed: supplierStatus.ok,
        physicalAddressConfirmed: addressStatus.ok,
        note: activationReview.note.trim(),
        reviewedAt,
        source: "DECISIONS-REGISTER Gap 5 / UJ-CRM-001A advisory eligibility review",
      },
      auditDetail: `${activationTarget.name} activated after Admin advisory eligibility review. Checklist reference: B2B ${String(Boolean(String(activationTarget.name || "").trim()))}; address ${addressStatus.reason}; contacts ${contactStatus.reason}; suppliers ${supplierStatus.reason}`,
    });
    setActivationTarget(null);
    setActivationReview({ b2bConfirmed: false, serviceAreaConfirmed: false, contactsConfirmed: false, suppliersConfirmed: false, note: "" });
  }

  function dispatchComplianceReady() {
    return selectedVehicleCompliance.ready;
  }

  function compileRun() {
    const driverId = dispatchDraft.driverId || drivers[0]?.id;
    const driver = drivers.find(d => d.id === driverId);
    const vehicle = selectedDispatchVehicle;
    const vehicleState = vehicleComplianceState(vehicle, compileRunDate);
    const vehicleName = vehicleLabel(vehicle);
    if (!compileRunDate) return showWorkflowNotice("Run date required for compilation");
    if (!driver) return showWorkflowNotice("Driver required for run compilation");
    if (!vehicle) return showWorkflowNotice("Named vehicle record required for run compilation");
    if (!vehicleState.ready) return showWorkflowNotice(`Vehicle cannot be assigned: ${vehicleState.reason}.`);
    if (compileCandidates.length === 0) return showWorkflowNotice("No eligible unassigned stops for this run date.");
    const availability = availabilityFor(driver.id, compileRunDate);
    if (driverIsBlocked(driver.id, compileRunDate)) return showWorkflowNotice(`${driver.name} is ${availability.status} for ${fmt(compileRunDate)}. Update availability before compiling this run.`);

    const compiledAt = isoNow();
    const runId = runIdFor(compileRunDate, driver.id, vehicleName);
    const supplierSequence = new Map();
    compileCandidates.forEach(order => {
      const supplier = order.vendor || "Supplier not recorded";
      if (!supplierSequence.has(supplier)) supplierSequence.set(supplier, supplierSequence.size + 1);
    });
    const updates = compileCandidates.map((order, index) => ({
      ...order,
      status: order.status === "Brought Forward" ? "Pending" : order.status,
      driverId: driver.id,
      driverName: driver.name,
      vehicleId: vehicle.id,
      vehicleName,
      runId,
      assignedAt: compiledAt,
      runDate: compileRunDate,
      runCompiledAt: compiledAt,
      runCompiledBy: "Admin",
      runSequence: index + 1,
      supplierSequence: supplierSequence.get(order.vendor || "Supplier not recorded"),
      deliveryZone: deliveryZone(order.dropAddress),
      dispatchMode: "local_run_compiler",
      vehicleRegistrationCurrent: true,
      vehicleInsuranceCurrent: true,
      vehicleRegistrationExpiry: vehicle.registrationExpiry,
      vehicleInsuranceExpiry: vehicle.insuranceExpiry,
      vehicleComplianceCheckedAt: compiledAt,
      vehicleComplianceCheckedBy: "Admin",
      vehicleComplianceNote: dispatchDraft.complianceNote.trim() || vehicle.notes || "Vehicle register APP-FLT-001 local check",
      vehicleComplianceSource: "vehicle_register_local",
    }));
    onUpdateOrders(updates, `Run compiled ${runId}: ${updates.length} stop(s), driver ${driver.name}, vehicle ${vehicleName}`);
    setDispatchDraft(prev => ({ ...prev, vehicleId: vehicle.id, vehicleName, runDate: compileRunDate, registrationCurrent: true, insuranceCurrent: true, complianceNote: "" }));
  }

  function assignDispatch(order) {
    const driverId = dispatchDraft.driverId || drivers[0]?.id;
    const driver = drivers.find(d => d.id === driverId);
    const vehicle = selectedDispatchVehicle;
    const vehicleName = vehicleLabel(vehicle);
    if (!driver) return showWorkflowNotice("Driver required for dispatch assignment");
    if (!vehicle) return showWorkflowNotice("Named vehicle record required for dispatch assignment");
    const runDate = order.actualRunDate || order.date;
    const vehicleState = vehicleComplianceState(vehicle, runDate);
    if (!vehicleState.ready) return showWorkflowNotice(`Vehicle cannot be assigned: ${vehicleState.reason}.`);
    const availability = availabilityFor(driver.id, runDate);
    if (driverIsBlocked(driver.id, runDate)) return showWorkflowNotice(`${driver.name} is ${availability.status} for ${fmt(runDate)}. Update availability before assigning this run.`);
    const assignedAt = isoNow();
    const runId = runIdFor(runDate, driver.id, vehicleName);
    onUpdateOrder({
      ...order,
      status: order.status === "Brought Forward" ? "Pending" : order.status,
      driverId: driver.id,
      driverName: driver.name,
      vehicleId: vehicle.id,
      vehicleName,
      runId,
      assignedAt,
      runDate,
      runCompiledAt: assignedAt,
      runCompiledBy: "Admin",
      runSequence: order.runSequence || 1,
      supplierSequence: order.supplierSequence || 1,
      deliveryZone: deliveryZone(order.dropAddress),
      dispatchMode: "manual_single_stop_assignment",
      vehicleRegistrationCurrent: true,
      vehicleInsuranceCurrent: true,
      vehicleRegistrationExpiry: vehicle.registrationExpiry,
      vehicleInsuranceExpiry: vehicle.insuranceExpiry,
      vehicleComplianceCheckedAt: assignedAt,
      vehicleComplianceCheckedBy: "Admin",
      vehicleComplianceNote: dispatchDraft.complianceNote.trim() || vehicle.notes || "Vehicle register APP-FLT-001 local check",
      vehicleComplianceSource: "vehicle_register_local",
    });
  }

  function clearDispatch(order) {
    if (order.status === "En Route") return showWorkflowNotice("En Route stops cannot be unassigned from this local dispatch screen.");
    onUpdateOrder({
      ...order,
      driverId: null,
      driverName: null,
      vehicleId: null,
      vehicleName: "",
      runId: null,
      assignedAt: null,
      runDate: null,
      runCompiledAt: null,
      runCompiledBy: "",
      runSequence: null,
      supplierSequence: null,
      deliveryZone: "",
      dispatchMode: "",
      vehicleRegistrationCurrent: false,
      vehicleInsuranceCurrent: false,
      vehicleRegistrationExpiry: "",
      vehicleInsuranceExpiry: "",
      vehicleComplianceCheckedAt: "",
      vehicleComplianceCheckedBy: "",
      vehicleComplianceNote: "",
      vehicleComplianceSource: "",
    });
  }

  function cancelAdminOrder(order) {
    if (orderGoodsCollected(order)) {
      showWorkflowNotice("Policy #14 blocks cancellation after goods have been collected. Use Failed Delivery/refusal handling instead.");
      return;
    }
    onUpdateOrder({
      ...order,
      status: "Cancelled",
      cancelledAt: isoNow(),
      cancelledBy: "admin",
      cancellationReason: "Admin cancellation before goods collected",
      cancellationPolicyRef: "Policy #14",
      cancellationCutoffDate: cancellationCutoffDate(order),
      billable: false,
      driverId: null,
      driverName: null,
      vehicleId: null,
      vehicleName: "",
      runId: null,
    });
  }

  function authoriseSecondFailedDeliveryAttempt(order, exception) {
    if (!order) return;
    if (failedDeliveryAttemptCount(order) !== 1) return showWorkflowNotice("Policy #8 second attempt can only be scheduled after one failed delivery attempt.");
    const firstAttemptDate = isoDate(order.failedDeliveryAt || order.actualRunDate || order.date || todayBrisbane());
    const nextRunDate = nextAvailableRunDate(addDays(firstAttemptDate, 1));
    onUpdateOrder({
      ...order,
      status: "Pending",
      actualRunDate: nextRunDate,
      date: nextRunDate,
      runId: null,
      assignedAt: "",
      redeliveryAttemptNumber: 2,
      secondAttemptScheduledAt: isoNow(),
      secondAttemptScheduledRunDate: nextRunDate,
      failedDeliveryPolicyRef: "Policy #8",
      returnToSupplierStatus: `Goods retained for next scheduled run ${fmtFullDate(nextRunDate)}`,
      redeliveryFeeStatus: "Not Applicable",
    });
    onAcknowledgeException(exception.id, {
      policy: "Policy #8 / APP-DRV-003",
      outcome: "Second delivery attempt scheduled",
      note: `First failed attempt reviewed. Goods remain with driver; second attempt scheduled for next run ${fmtFullDate(nextRunDate)}. No redelivery fee applies after first attempt.`,
      linkedOrderIds: [order.id],
      linkedProofIds: [],
      investigatedAt: isoNow(),
      investigatedBy: "Admin",
    });
  }

  function openRedeliveryFeeReview(exception, order, action) {
    setRedeliveryFeeReview({ exception, order, action });
    setRedeliveryFeeReviewNote(action === "approve"
      ? "Admin reviewed both APP-DRV-003 failed delivery records; Policy #8 redelivery fee applies."
      : "");
  }

  function confirmRedeliveryFeeReview() {
    if (!redeliveryFeeReview?.order || !redeliveryFeeReview?.exception) return;
    const note = redeliveryFeeReviewNote.trim();
    if (!note) return showWorkflowNotice("Admin review note required before applying or waiving the Policy #8 redelivery fee.");
    const { order, exception, action } = redeliveryFeeReview;
    const amount = Number(order.redeliveryFeeAmount || policy8RedeliveryFeeAmount(priceRules));
    const reviewedAt = isoNow();
    const approved = action === "approve";
    onUpdateOrder({
      ...order,
      redeliveryFeeStatus: approved ? "Approved" : "Waived",
      redeliveryFeeAmount: amount,
      redeliveryFeeRuleId: order.redeliveryFeeRuleId || redeliveryPriceRule(priceRules)?.id || "price-redelivery",
      redeliveryFeeReviewedAt: reviewedAt,
      redeliveryFeeReviewedBy: "admin",
      redeliveryFeeReviewNote: note,
      redeliveryFeeWaivedReason: approved ? "" : note,
      redeliveryFeePolicyRef: "Policy #8",
      returnToSupplierStatus: order.returnToSupplierStatus || "Return to originating supplier on next scheduled milk run",
    });
    onAcknowledgeException(exception.id, {
      policy: "Policy #8 / APP-DRV-003 / APP-ADM-004",
      outcome: approved ? "Redelivery fee approved" : "Redelivery fee waived",
      note: approved ? `${note} Amount $${amount.toFixed(2)} will be billed on the next monthly invoice.` : note,
      linkedOrderIds: [order.id],
      linkedProofIds: [],
      investigatedAt: reviewedAt,
      investigatedBy: "Admin",
    });
    setRedeliveryFeeReview(null);
    setRedeliveryFeeReviewNote("");
  }

  function billingItemsForGroup(group) {
    return [
      ...group.orders.map(order => ({ id: order.id, type: "delivery", order, amount: Number(order.price || 0) })),
      ...group.redeliveryFees.map(order => ({ id: `redelivery-${order.id}`, type: "redelivery_fee", order, amount: Number(order.redeliveryFeeAmount || policy8RedeliveryFeeAmount(priceRules)) })),
    ];
  }

  function invoiceTotal(lines) {
    const subtotal = lines.reduce((sum, line) => sum + Number(line.amount ?? line.price ?? 0), 0);
    const gst = Math.round(subtotal * 0.1 * 100) / 100;
    return { subtotal, gst, total: subtotal + gst };
  }

  function renderDailyExceptionAlert() {
    const typeCounts = exceptionTypeCounts();
    const rows = exceptionAlertRows();
    const oldest = rows[0];
    const reviewedAlert = reviewedExceptionAlert();
    return (
      <div className="card" style={{ borderColor: openExceptions.length ? T.acc : T.border }}>
        <div className="card-head">
          <div className="card-title">Daily APP-ADM-005 Alert</div>
          <span className={`badge ${openExceptions.length ? "b-cancelled" : "b-done"}`}>{openExceptions.length ? `${openExceptions.length} Open` : "Clear"}</span>
        </div>
        <div className="meta" style={{ marginBottom: ".45rem" }}>
          <span>{todayBrisbane()}</span>
          <span>Admin</span>
          <span>{oldest ? `Oldest ${oldest.ageHours}h` : "No open exceptions"}</span>
          <span>{rows.filter(row => row.linkedProofs.length > 0).length} proof-linked</span>
          <span>{reviewedAlert ? `Reviewed ${new Date(reviewedAlert.reviewedAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}` : "Not reviewed"}</span>
        </div>
        {openExceptions.length === 0 ? (
          <>
            <div style={{ fontSize: ".82rem", color: T.mu }}>No open exceptions for today's structured Admin alert.</div>
            {!reviewedAlert && <button className="btn b-ghost b-sm" style={{ marginTop: ".8rem" }} onClick={markExceptionAlertReviewed}>Mark Alert Reviewed</button>}
          </>
        ) : (
          <>
            <div className="pills" style={{ marginBottom: ".7rem" }}>
              {Object.entries(typeCounts).map(([type, count]) => (
                <span className="pill sel" key={type}>{type}: {count}</span>
              ))}
            </div>
            {rows.slice(0, 5).map(row => {
              const linkedSupplier = supplierForException(row.exception);
              const linkedPriceRule = priceRuleForException(row.exception);
              return (
                <div key={row.exception.id} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".55rem", marginTop: ".55rem" }}>
                  <div className="card-head">
                    <div style={{ fontWeight: 800, fontSize: ".86rem" }}>{row.exception.type} - {row.exception.orderId}</div>
                    <span className="badge b-pending">{row.ageHours}h</span>
                  </div>
                  <div style={{ fontSize: ".8rem", color: T.mu }}>{row.exception.note}</div>
                  <div className="meta" style={{ marginTop: ".35rem" }}>
                    <span>{linkedSupplier ? `${linkedSupplier.name} supplier record` : linkedPriceRule ? `${linkedPriceRule.label} price rule` : row.linkedOrders.length ? `${row.linkedOrders.length} linked work item(s)` : "No linked work"}</span>
                    <span>{linkedSupplier ? (row.exception.type === "Supplier Pickup Standards Review" ? "Policy #15 / Policy #16 / CAP-MCL-001 review" : "SOP-MDM-01 / CAP-MCL-001 review") : linkedPriceRule ? "Policy #9 / SOP-MDM-02 review" : row.linkedProofs.length ? `${row.linkedProofs.length} POD proof record(s)` : "No POD proof linked"}</span>
                    <span>Owner: {row.exception.owner}</span>
                  </div>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".8rem" }}>
              <button className="btn b-acc b-sm" onClick={() => setView("exceptions")}>Open Exception Queue</button>
              {!reviewedAlert && <button className="btn b-ghost b-sm" onClick={markExceptionAlertReviewed}>Mark Alert Reviewed</button>}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="nav">
        <div className="logo"><img src="/moto-and-co-couriers-logo.png" alt="Moto and Co Couriers" /><span className="logo-sub">Admin operations</span></div>
        <div style={{ display: "flex", gap: ".6rem", alignItems: "center" }}>
          <div className="nav-role">Admin</div>
          <button className="nav-out" onClick={onLogout}>Log out</button>
        </div>
      </div>
      <div className="main">
        <div className="tabs" style={{ marginBottom: "1.2rem" }}>
          <button className={`tab${view === "dashboard" ? " active" : ""}`} onClick={() => setView("dashboard")}>Dashboard</button>
          <button className={`tab${view === "orders" ? " active" : ""}`} onClick={() => setView("orders")}>Orders</button>
          <button className={`tab${view === "dispatch" ? " active" : ""}`} onClick={() => setView("dispatch")}>Dispatch ({unassignedDispatch.length})</button>
          <button className={`tab${view === "runClose" ? " active" : ""}`} onClick={() => setView("runClose")}>Run Close ({runCloseReviewRows.length})</button>
          <button className={`tab${view === "updates" ? " active" : ""}`} onClick={() => setView("updates")}>Updates ({operationalNoticeRows.length})</button>
          <button className={`tab${view === "ai" ? " active" : ""}`} onClick={() => setView("ai")}>AI Drafts ({pendingAiDraftRows.length})</button>
          <button className={`tab${view === "clients" ? " active" : ""}`} onClick={() => setView("clients")}>Clients</button>
          <button className={`tab${view === "drivers" ? " active" : ""}`} onClick={() => setView("drivers")}>Drivers</button>
          <button className={`tab${view === "fleet" ? " active" : ""}`} onClick={() => setView("fleet")}>Fleet</button>
          <button className={`tab${view === "access" ? " active" : ""}`} onClick={() => setView("access")}>Access</button>
          <button className={`tab${view === "dataUse" ? " active" : ""}`} onClick={() => setView("dataUse")}>Data Use ({blockedDataUseRows.length})</button>
          <button className={`tab${view === "privacy" ? " active" : ""}`} onClick={() => setView("privacy")}>Privacy ({openPrivacyRequestRows.length})</button>
          <button className={`tab${view === "exceptions" ? " active" : ""}`} onClick={() => setView("exceptions")}>Exceptions ({openExceptions.length})</button>
          <button className={`tab${view === "vendors" ? " active" : ""}`} onClick={() => setView("vendors")}>Suppliers</button>
          <button className={`tab${view === "pricing" ? " active" : ""}`} onClick={() => setView("pricing")}>Pricing</button>
          <button className={`tab${view === "billing" ? " active" : ""}`} onClick={() => setView("billing")}>Billing</button>
          <button className={`tab${view === "ndb" ? " active" : ""}`} onClick={() => setView("ndb")}>NDB ({openDataBreachRows.length})</button>
          <button className={`tab${view === "retention" ? " active" : ""}`} onClick={() => setView("retention")}>Retention</button>
          <button className={`tab${view === "audit" ? " active" : ""}`} onClick={() => setView("audit")}>Audit</button>
        </div>

        {workflowNotice && (
          <PolicyNotice title="Admin Workflow Rule" system onDismiss={() => setWorkflowNotice("")}>
            {workflowNotice}
          </PolicyNotice>
        )}

        {view === "dashboard" && (
          <>
            <h2 style={{ marginBottom: "1rem" }}>Dashboard</h2>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: T.acc }}>{pending}</div><div className="stat-lbl">Pending</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.teal }}>{enroute}</div><div className="stat-lbl">En Route</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{delivered}</div><div className="stat-lbl">Delivered</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.red }}>{openExceptions.length}</div><div className="stat-lbl">Exceptions</div></div>
              <div className="stat"><div className="stat-num" style={{ color: blockedDataUseRows.length ? T.red : T.tx }}>{blockedDataUseRows.length}</div><div className="stat-lbl">Data Use Blocks</div></div>
              <div className="stat"><div className="stat-num" style={{ color: overduePrivacyRequestRows.length ? T.red : T.tx }}>{overduePrivacyRequestRows.length}</div><div className="stat-lbl">Privacy Due</div></div>
              <div className="stat"><div className="stat-num" style={{ color: openDataBreachRows.length ? T.red : T.tx }}>{openDataBreachRows.length}</div><div className="stat-lbl">NDB Incidents</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.acc }}>${revenue}</div><div className="stat-lbl">Revenue</div></div>
            </div>
            {renderDailyExceptionAlert()}
            {openExceptions.length > 0 && (
              <>
                <h2 style={{ marginBottom: ".8rem" }}>Exception Queue</h2>
                {openExceptions.slice(0, 3).map(e => (
                  <div className="card" key={e.id}>
                    <div className="card-head"><div className="card-title">{e.type} — {e.orderId}</div><span className="badge b-cancelled">{e.status}</span></div>
                    <div style={{ fontSize: ".82rem", color: T.mu }}>{e.note}</div>
                  </div>
                ))}
              </>
            )}
            <h2 style={{ marginBottom: ".8rem" }}>Pending Orders</h2>
            {orders.filter(o => o.status === "Pending").map(o => (
              <div className="card" key={o.id}>
                <div className="card-head"><div className="card-title">{o.id} — {o.clientName}</div>{statusBadge(o.status)}</div>
                <div className="meta"><span>📦 {o.vendor}</span><span>📋 {o.conNote}</span><span>📍 {o.dropAddress}</span><span>📅 {fmt(o.date)}</span></div>
                <hr className="dvd" />
                <div style={{ display: "flex", gap: ".6rem" }}>
                  <button className="btn b-teal b-sm" onClick={() => setView("dispatch")}>Open Dispatch</button>
                  <button className="btn b-red b-sm" disabled={orderGoodsCollected(o)} onClick={() => cancelAdminOrder(o)}>✕ Cancel</button>
                </div>
              </div>
            ))}
          </>
        )}

        {view === "ai" && (
          <>
            <div className="sh"><h2>Policy #20 AI Draft Review Gate</h2></div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: pendingAiDraftRows.length ? T.acc : T.tx }}>{pendingAiDraftRows.length}</div><div className="stat-lbl">Pending Review</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{approvedAiDraftRows.length}</div><div className="stat-lbl">Approved Not Sent</div></div>
              <div className="stat"><div className="stat-num" style={{ color: rejectedAiDraftRows.length ? T.red : T.tx }}>{rejectedAiDraftRows.length}</div><div className="stat-lbl">Rejected</div></div>
              <div className="stat"><div className="stat-num" style={{ color: aiDraftCandidateRows.length ? T.acc : T.tx }}>{aiDraftCandidateRows.length}</div><div className="stat-lbl">Flagged Candidates</div></div>
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Policy #20 Controls</div>
                <span className="badge b-pending">Admin Trigger Only</span>
              </div>
              <div className="meta" style={{ marginBottom: ".65rem" }}>
                <span>{POLICY20_AI_USE_SOURCE}</span>
                <span>No autonomous send</span>
                <span>No batch approval of unread messages</span>
                <span>Provider not configured</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Drafts are local review records only. Admin must read, edit, reject, or approve every draft, and approval does not send a customer or supplier message. Pricing, commercial, account, suspension, and legal decisions remain outside AI authority.
              </div>
            </div>
            <div className="grid2">
              {AI_AGENT_OPTIONS.map(agent => (
                <div className="card" key={agent.id}>
                  <div className="card-head">
                    <div className="card-title">{agent.name}</div>
                    <span className="badge b-done">{agent.id}</span>
                  </div>
                  <div className="meta">
                    <span>{agent.scope.replace(/_/g, " ")}</span>
                    <span>{agent.trigger}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Drafts Pending Admin Review</div>
                <span className={`badge ${pendingAiDraftRows.length ? "b-pending" : "b-done"}`}>{pendingAiDraftRows.length ? "Review Required" : "Clear"}</span>
              </div>
              {pendingAiDraftRows.length === 0 ? (
                <div style={{ fontSize: ".82rem", color: T.mu }}>No unread Policy #20 drafts are awaiting Admin review.</div>
              ) : (
                pendingAiDraftRows.map(draft => (
                  <div key={draft.id} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".6rem", marginTop: ".6rem" }}>
                    <div className="card-head">
                      <div style={{ fontWeight: 800, fontSize: ".86rem" }}>{draft.targetName}</div>
                      <span className={`badge ${aiDraftStatusBadgeClass(draft.status)}`}>{draft.status}</span>
                    </div>
                    <div className="meta" style={{ marginTop: ".3rem" }}>
                      <span>{draft.agentId}</span>
                      <span>{draft.agentName}</span>
                      <span>{draft.triggerSource}</span>
                      <span>Created {fmtFullDate(isoDate(draft.createdAt))}</span>
                    </div>
                    <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem", whiteSpace: "pre-wrap" }}>{draft.draftText}</div>
                    <button className="btn b-acc b-sm" style={{ marginTop: ".55rem" }} onClick={() => openAiDraftReview(draft)}>Review Draft</button>
                  </div>
                ))
              )}
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Flagged CTA Candidates</div>
                <span className={`badge ${aiDraftCandidateRows.length ? "b-pending" : "b-done"}`}>{aiDraftCandidateRows.length ? "Available" : "None"}</span>
              </div>
              {aiDraftCandidateRows.length === 0 ? (
                <div style={{ fontSize: ".82rem", color: T.mu }}>No CRM, supplier, or exception records currently need a Policy #20 CTA draft.</div>
              ) : (
                aiDraftCandidateRows.map(candidate => (
                  <div key={`${candidate.agentId}-${candidate.targetType}-${candidate.targetId}`} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".6rem", marginTop: ".6rem" }}>
                    <div className="card-head">
                      <div style={{ fontWeight: 800, fontSize: ".86rem" }}>{candidate.targetName}</div>
                      <span className={`badge ${candidate.pending ? "b-cancelled" : "b-pending"}`}>{candidate.pending ? "Draft Pending" : candidate.agentName}</span>
                    </div>
                    <div className="meta" style={{ marginTop: ".3rem" }}>
                      <span>{candidate.agentId}</span>
                      <span>{candidate.triggerSource}</span>
                    </div>
                    <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>{candidate.triggerReason}</div>
                    <button className="btn b-ghost b-sm" style={{ marginTop: ".55rem" }} disabled={candidate.pending} onClick={() => openAiDraftRequest(candidate)}>
                      {candidate.pending ? "Unread Draft Exists" : "Request AI CTA Draft"}
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Reviewed Draft History</div>
                <span className="badge b-done">{aiDraftRows.length} Logged</span>
              </div>
              {aiDraftRows.length === 0 ? (
                <div style={{ fontSize: ".82rem", color: T.mu }}>No Policy #20 AI draft interactions have been logged in this local session.</div>
              ) : (
                aiDraftRows.map(draft => (
                  <div key={`history-${draft.id}`} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".6rem", marginTop: ".6rem" }}>
                    <div className="card-head">
                      <div style={{ fontWeight: 800, fontSize: ".86rem" }}>{draft.targetName}</div>
                      <span className={`badge ${aiDraftStatusBadgeClass(draft.status)}`}>{draft.status}</span>
                    </div>
                    <div className="meta" style={{ marginTop: ".3rem" }}>
                      <span>{draft.agentId}</span>
                      <span>{draft.reviewedAt ? `Reviewed ${fmtFullDate(isoDate(draft.reviewedAt))}` : "Review pending"}</span>
                      <span>{draft.externalDeliveryStatus}</span>
                    </div>
                    {(draft.reviewNote || draft.rejectedReason) && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Admin note: {draft.reviewNote || draft.rejectedReason}</div>}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {view === "dispatch" && (
          <>
            <div className="sh"><h2>Dispatch Assignment</h2></div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: runPlanningCompletionRate === "100%" ? T.tx : T.acc }}>{runPlanningCompletionRate}</div><div className="stat-lbl">Compilation Rate</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{rateLabel(runPlanningNamedCount, runPlanningAssignedCount)}</div><div className="stat-lbl">Named Assignment</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{rateLabel(runPlanningFleetPassCount, runPlanningAssignedCount)}</div><div className="stat-lbl">Fleet Gate Pass</div></div>
              <div className="stat"><div className="stat-num" style={{ color: runPlanningAdminInterventionCount ? T.acc : T.tx }}>{runPlanningAdminInterventionCount}</div><div className="stat-lbl">Admin Interventions</div></div>
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">CAP-MCL-002 Run Planning Monitor</div>
                <span className={`badge ${runPlanningExceptionRows.length ? "b-cancelled" : "b-done"}`}>{runPlanningExceptionRows.length ? `${runPlanningExceptionRows.length} Review` : "Clear"}</span>
              </div>
              <div className="meta" style={{ marginBottom: ".65rem" }}>
                <span>POL-MCL-002-001</span>
                <span>Night-before compilation</span>
                <span>{runPlanningStopCount} dispatchable stop(s)</span>
                <span>{runPlanningQueuedRows.length} queued exception(s)</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                CAP-MCL-002 requires every milk run to be compiled the night before with a named driver, named vehicle, and APP-FLT-001 compliance gate. This local monitor records the governance evidence and queues Admin exceptions; live pg_cron automation remains a production blocker.
              </div>
              {runPlanningExceptionRows.length > 0 && (
                <>
                  <hr className="dvd" />
                  {runPlanningExceptionRows.map(row => (
                    <div key={`run-planning-${row.runDate}`} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".6rem", marginTop: ".6rem" }}>
                      <div className="card-head">
                        <div style={{ fontWeight: 800, fontSize: ".88rem" }}>Run {fmtFullDate(row.runDate)}</div>
                        <span className={`badge ${row.openException ? "b-pending" : row.overdue ? "b-cancelled" : "b-pending"}`}>{row.openException ? "Queued" : row.overdue ? "Overdue" : "Review"}</span>
                      </div>
                      <div className="meta">
                        <span>Night-before compile due {fmtFullDate(row.compileDueDate)}</span>
                        <span>{row.totalStops} stop(s)</span>
                        <span>{row.unassignedOrders.length} unassigned</span>
                        <span>{row.namedAssignmentOrders.length}/{row.assignedOrders.length || 0} named</span>
                        <span>{row.fleetPassOrders.length}/{row.assignedOrders.length || 0} fleet pass</span>
                      </div>
                      <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>{row.reasons.join("; ")}</div>
                      <button className="btn b-ghost b-sm" style={{ marginTop: ".55rem" }} disabled={Boolean(row.openException)} onClick={() => queueRunPlanningException(row)}>
                        {row.openException ? "Exception Queued" : "Queue APP-ADM-002 Exception"}
                      </button>
                    </div>
                  ))}
                  <button className="btn b-acc b-sm" style={{ marginTop: ".8rem" }} onClick={queueAllRunPlanningExceptions}>Queue All Run Planning Exceptions</button>
                </>
              )}
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">APP-ADM-002 Run Compiler</div>
                <span className={`badge ${compileCandidates.length ? "b-pending" : "b-done"}`}>{compileCandidates.length} eligible</span>
              </div>
              <div className="fr">
                <div className="f"><label>Run Date</label><input type="date" value={compileRunDate} onChange={e => setDispatchDraft(p => ({ ...p, runDate: e.target.value }))} /></div>
                <div className="f"><label>Driver</label>
                  <select value={dispatchDraft.driverId || drivers[0]?.id || ""} onChange={e => setDispatchDraft(p => ({ ...p, driverId: e.target.value }))}>
                    {drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="fr">
                <div className="f"><label>Named Vehicle</label>
                  <select value={selectedDispatchVehicle?.id || ""} onChange={e => {
                    const vehicle = vehicles.find(item => item.id === e.target.value);
                    setDispatchDraft(p => ({ ...p, vehicleId: vehicle?.id || "", vehicleName: vehicleLabel(vehicle) }));
                  }}>
                    {activeVehicleList.length === 0 && <option value="">No active vehicle records</option>}
                    {activeVehicleList.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicleLabel(vehicle)}{vehicle.assignedDriverId ? ` - ${drivers.find(driver => driver.id === vehicle.assignedDriverId)?.name || vehicle.assignedDriverId}` : ""}</option>)}
                  </select>
                </div>
                <div className="f"><label>Compliance Note</label><input value={dispatchDraft.complianceNote} onChange={e => setDispatchDraft(p => ({ ...p, complianceNote: e.target.value }))} placeholder="Local APP-FLT-001 evidence or blocker note" /></div>
              </div>
              {selectedDispatchVehicle ? (
                <div className="pills" style={{ marginTop: ".5rem" }}>
                  <span className={`pill${selectedVehicleCompliance.ready ? " sel" : ""}`}>{selectedVehicleCompliance.ready ? "Fleet compliant" : selectedVehicleCompliance.reason}</span>
                  <span className="pill">Rego {selectedDispatchVehicle.registrationExpiry ? fmt(selectedDispatchVehicle.registrationExpiry) : "not recorded"}</span>
                  <span className="pill">Insurance {selectedDispatchVehicle.insuranceExpiry ? fmt(selectedDispatchVehicle.insuranceExpiry) : "not recorded"}</span>
                  <span className="pill">Defect {selectedDispatchVehicle.defectStatus || "Unknown"}</span>
                  {selectedVehicleCompliance.warnings.map(warning => <span className="pill" key={warning}>{warning}</span>)}
                </div>
              ) : (
                <div className="err" style={{ marginTop: ".8rem" }}>Create or activate a vehicle record before compiling a run.</div>
              )}
              {!selectedVehicleCompliance.ready && selectedDispatchVehicle && <div className="err" style={{ marginTop: ".8rem" }}>Vehicle register blocks dispatch: {selectedVehicleCompliance.reason}</div>}
              {compileAvailabilityBlock && (
                <div className="err" style={{ marginTop: ".8rem" }}>
                  {compileDriver?.name || "Driver"} is {compileAvailabilityBlock.status} for this run date. {compileAvailabilityBlock.note}
                  {driverAvailabilityDetail(compileAvailabilityBlock) ? ` ${driverAvailabilityDetail(compileAvailabilityBlock)}.` : ""}
                </div>
              )}
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                APP-ADM-002 compiles eligible work for the selected run date, groups stops by supplier and delivery geography, assigns a named driver and vehicle record, and reads local APP-FLT-001 registration/insurance/defect evidence from the fleet register. Night-before automation and live APP-FLT-001 checks remain production gaps.
              </div>
              {compileSupplierGroups.length > 0 && (
                <div style={{ marginTop: ".8rem" }}>
                  {compileSupplierGroups.map((group, groupIndex) => (
                    <div key={group.supplier} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".65rem", marginTop: ".65rem" }}>
                      <div className="card-head">
                        <div style={{ fontWeight: 800, fontSize: ".9rem" }}>{groupIndex + 1}. {group.supplier}</div>
                        <span className="badge b-pending">{group.orders.length} stop{group.orders.length === 1 ? "" : "s"}</span>
                      </div>
                      <div className="meta">
                        {Object.entries(group.zones).map(([zone, zoneOrders]) => <span key={zone}>{zone}: {zoneOrders.length}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn b-acc" style={{ marginTop: ".9rem" }} disabled={!compileCandidates.length || Boolean(compileAvailabilityBlock) || !selectedVehicleCompliance.ready} onClick={compileRun}>
                {compileCandidates.length ? "Compile Run Brief" : "No Eligible Stops"}
              </button>
            </div>

            <h2 style={{ margin: "1rem 0 .8rem" }}>Unassigned Stops ({unassignedDispatch.length})</h2>
            {unassignedDispatch.length === 0 && <div className="empty">No stops waiting for dispatch assignment.</div>}
            {unassignedDispatch.map(o => {
              const availabilityBlock = dispatchAvailabilityBlock(o);
              const vehicleState = vehicleComplianceState(selectedDispatchVehicle, o.actualRunDate || o.date);
              const dispatchBlocked = Boolean(availabilityBlock) || !vehicleState.ready;
              return (
                <div className="card" key={o.id}>
                  <div className="card-head"><div className="card-title">{o.id} - {o.clientName}</div>{statusBadge(o.status)}</div>
                  <div className="meta"><span>{o.vendor}</span><span>{o.conNote}</span><span>{o.dropAddress}</span><span>Run {fmt(o.actualRunDate || o.date)}</span></div>
                  {(o.scheduleAdjusted || o.cutoffApplied) && <div style={{ fontSize: ".8rem", color: T.acc, marginBottom: ".5rem" }}>{runDateAdjustmentLabel(o.scheduleAdjustmentReason)}</div>}
                  {availabilityBlock && <div style={{ fontSize: ".8rem", color: T.acc, margin: ".45rem 0" }}>{availabilityBlock.driverName} is {availabilityBlock.status} for this run date. {availabilityBlock.note}{driverAvailabilityDetail(availabilityBlock) ? ` ${driverAvailabilityDetail(availabilityBlock)}.` : ""}</div>}
                  {!vehicleState.ready && <div style={{ fontSize: ".8rem", color: T.acc, margin: ".45rem 0" }}>Vehicle blocked: {vehicleState.reason}</div>}
                  <button className="btn b-teal b-sm" disabled={dispatchBlocked} onClick={() => assignDispatch(o)}>{availabilityBlock ? "Driver Unavailable" : !vehicleState.ready ? "Vehicle Blocked" : "Assign Single Stop"}</button>
                </div>
              );
            })}

            <h2 style={{ margin: "1rem 0 .8rem" }}>Assigned Run ({assignedDispatch.length})</h2>
            {assignedDispatch.length === 0 && <div className="empty">No assigned open stops.</div>}
            {assignedDispatch.map(o => {
              const driver = drivers.find(d => d.id === o.driverId);
              return (
                <div className="card" key={o.id}>
                  <div className="card-head"><div className="card-title">{o.id} - {o.clientName}</div>{statusBadge(o.status)}</div>
                  <div className="meta">
                    <span>{o.vendor}</span>
                    <span>{o.runId || "Run not recorded"}</span>
                    <span>Driver {o.driverName || driver?.name || o.driverId}</span>
                    <span>Vehicle {o.vehicleName || "Not recorded"}</span>
                    <span>Run {fmt(o.actualRunDate || o.date)}</span>
                    <span>Seq {o.runSequence || "Not set"}</span>
                    <span>{o.deliveryZone || deliveryZone(o.dropAddress)}</span>
                  </div>
                  {o.vehicleComplianceCheckedAt && <div style={{ fontSize: ".78rem", color: T.mu, margin: ".35rem 0" }}>Fleet register checked {new Date(o.vehicleComplianceCheckedAt).toLocaleString("en-AU")}: registration {o.vehicleRegistrationExpiry ? `current to ${fmt(o.vehicleRegistrationExpiry)}` : "current"}, insurance {o.vehicleInsuranceExpiry ? `current to ${fmt(o.vehicleInsuranceExpiry)}` : "current"}{o.vehicleComplianceNote ? `; ${o.vehicleComplianceNote}` : ""}.</div>}
                  <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                    {o.status === "Pending" && <button className="btn b-ghost b-sm" onClick={() => clearDispatch(o)}>Remove Assignment</button>}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {view === "runClose" && (
          <>
            <div className="sh"><h2>Run Close Review</h2></div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{runCloseReviewRows.length}</div><div className="stat-lbl">Close Records</div></div>
              <div className="stat"><div className="stat-num" style={{ color: runCloseReviewRows.some(row => row.openStops.length > 0) ? T.acc : T.tx }}>{runCloseReviewRows.reduce((sum, row) => sum + row.openStops.length, 0)}</div><div className="stat-lbl">Open Stops After Close</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.red }}>{runCloseReviewRows.reduce((sum, row) => sum + row.linkedExceptions.length, 0)}</div><div className="stat-lbl">Open Exceptions</div></div>
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: ".45rem" }}>Local Close Rule</div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Driver run close is a local evidence record after stops are no longer Pending or En Route. SOP-DEL-05 marks proof-backed jobs billing-ready; production close confirmation notifications and accounting handoff remain unconfirmed.
              </div>
            </div>
            {runCloseReviewRows.length === 0 && <div className="empty">No driver run close records yet.</div>}
            {runCloseReviewRows.map(row => (
              <div className="card" key={row.close.id}>
                <div className="card-head">
                  <div className="card-title">{row.close.id}</div>
                  <span className={`badge ${row.openStops.length ? "b-cancelled" : "b-done"}`}>{row.openStops.length ? "Review Required" : "Closed"}</span>
                </div>
                <div className="meta">
                  <span>{row.driver?.name || row.close.driverName || row.close.driverId}</span>
                  <span>Closed {new Date(row.close.closedAt).toLocaleString("en-AU")}</span>
                  <span>Run date {fmt(row.close.runDate)}</span>
                  <span>{row.close.closeSummary?.pickedUpCount ?? 0} pickup(s)</span>
                  <span>{row.close.closeSummary?.noPickupCount ?? 0} no pickup</span>
                  <span>{row.close.closeSummary?.failedDeliveryCount ?? 0} failed delivery</span>
                  <span>{row.close.deliveredCount} delivered recorded</span>
                  <span>{row.close.exceptionCount} exceptions recorded</span>
                  <span>{row.linkedProofs.length} POD proof record(s)</span>
                </div>
                {(row.close.actionItems || row.close.closeSummary?.actionItems || []).length > 0 ? (
                  <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>
                    Driver close action items: {(row.close.actionItems || row.close.closeSummary?.actionItems || []).join(" ")}
                  </div>
                ) : (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>
                    Driver close confirmation: no retained-goods action items recorded.
                  </div>
                )}
                {row.openStops.length > 0 && (
                  <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>
                    Open-stop check: {row.openStops.map(order => `${order.id} ${order.status}`).join(", ")}
                  </div>
                )}
                {row.linkedExceptions.length > 0 && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>
                    Open exceptions: {row.linkedExceptions.map(exception => `${exception.type} ${exception.orderId}`).join(", ")}
                  </div>
                )}
                {row.closedStops.length > 0 && (
                  <>
                    <hr className="dvd" />
                    {row.closedStops.slice(0, 5).map(order => (
                      <div key={`${row.close.id}-${order.id}`} className="meta">
                        <span>{order.id}</span>
                        <span>{order.clientName}</span>
                        <span>{order.vendor}</span>
                        <span>{order.status}</span>
                        <span>{order.proofId ? "POD linked" : "No POD"}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {view === "updates" && (
          <>
            <div className="sh"><h2>Operational Updates</h2></div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{operationalNoticeRows.length}</div><div className="stat-lbl">Local Records</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.acc }}>{providerNotConfiguredCount}</div><div className="stat-lbl">Provider Pending</div></div>
              <div className="stat"><div className="stat-num" style={{ color: failedNotificationRows.length ? T.red : T.tx }}>{failedNotificationRows.length}</div><div className="stat-lbl">Failed</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{operationalNoticeClients}</div><div className="stat-lbl">Client Accounts</div></div>
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: ".45rem" }}>Local Outbox Rule</div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Account suspension/reinstatement, booking, schedule adjustment, driver outcome, delivery, supplier setup, delivery dispute acknowledgement, and billing-query acknowledgement records are kept locally until the production customer notification channel and provider are confirmed. Account activation notices are not created; clients log in to check status. Failed notice rows are routed to APP-ADM-005; provider_not_configured is tracked as a production gap, not a failed delivery.
              </div>
            </div>
            {failedNotificationRows.length > 0 && (
              <div className="card">
                <div className="card-head">
                  <div className="card-title">Notification Failure Monitor</div>
                  <span className="badge b-cancelled">{failedNotificationRows.length} failed</span>
                </div>
                {failedNotificationRows.map(row => (
                  <div className="meta" key={row.key}>
                    <span>{row.type}</span>
                    <span>{row.reference}</span>
                    <span>{row.status}</span>
                    <span>{row.policyRef}</span>
                  </div>
                ))}
              </div>
            )}
            {operationalNoticeRows.length === 0 && <div className="empty">No operational customer update records yet.</div>}
            {operationalNoticeRows.map(notice => {
              const order = orders.find(item => item.id === notice.orderId);
              return (
                <div className="card" key={notice.id}>
                  <div className="card-head">
                    <div className="card-title">{notice.subject}</div>
                    <span className={`badge ${notificationDeliveryFailed(notice) ? "b-cancelled" : "b-pending"}`}>{notificationDeliveryFailed(notice) ? "Failed" : notice.channel === "local_record_only" ? "Local" : notice.channel}</span>
                  </div>
                  <div className="meta">
                    <span>{notice.clientName || order?.clientName || notice.clientId || "Client not linked"}</span>
                    <span>{notice.orderId || "Account"}</span>
                    <span>{operationalNoticeLabel(notice.noticeType)}</span>
                    <span>{notice.externalDeliveryStatus || "not recorded"}</span>
                    <span>{new Date(notice.createdAt || isoNow()).toLocaleString("en-AU")}</span>
                  </div>
                  <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".45rem" }}>{notice.message}</div>
                  <div className="meta">
                    <span>Audience: {notice.audience || "client_operational"}</span>
                    <span>{notice.policyRef || "UJ-CRM-001A"}</span>
                    <span>Created by {notice.createdBy || "system"}</span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {view === "orders" && (
          <>
            <div className="sh"><h2>All Orders</h2></div>
            <div className="pills" style={{ marginBottom: ".8rem" }}>
              {["All", ...STAGES].map(s => (
                <button key={s} className={`pill${filterStatus === s ? " sel" : ""}`} onClick={() => setFilterStatus(s)}>{s}</button>
              ))}
            </div>
            <div className="card" style={{ padding: "0", overflow: "hidden" }}>
              <table className="tbl">
                <thead><tr><th>ID</th><th>Client</th><th>Supplier</th><th>Con Note</th><th>Status</th><th>Date</th><th>Price</th></tr></thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setSelOrder(o)}>
                      <td>{o.id}</td><td>{o.clientName}</td><td>{o.vendor}</td><td>{o.conNote}</td>
                      <td>{statusBadge(o.status)}</td><td>{fmt(o.date)}</td><td>{o.price ? `$${o.price}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === "clients" && (
          <>
            <div className="sh">
              <h2>Workshop CRM ({clients.length})</h2>
              <button className="btn b-acc b-sm" onClick={() => openCrmRecord()}>New Workshop</button>
            </div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: crmRhythmRows.length ? T.acc : T.tx }}>{crmRhythmRows.length}</div><div className="stat-lbl">Rhythm Flags</div></div>
              <div className="stat"><div className="stat-num" style={{ color: crmReviewDueCount ? T.acc : T.tx }}>{crmReviewDueCount}</div><div className="stat-lbl">Reviews Due</div></div>
              <div className="stat"><div className="stat-num" style={{ color: crmNextActionDueCount ? T.acc : T.tx }}>{crmNextActionDueCount}</div><div className="stat-lbl">Actions Due</div></div>
              <div className="stat"><div className="stat-num" style={{ color: crmOverdueObligationCount ? T.red : T.tx }}>{crmOverdueObligationCount}</div><div className="stat-lbl">Obligations Due</div></div>
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">CRM Rhythm Monitor</div>
                <span className={`badge ${crmRhythmRows.length ? "b-pending" : "b-done"}`}>{crmRhythmRows.length ? "Action Required" : "Current"}</span>
              </div>
              <div className="meta" style={{ marginBottom: ".65rem" }}>
                <span>The Village RM10</span>
                <span>Owner / Review / Next Action / Obligation</span>
                <span>{crmIncompleteCount} incomplete</span>
              </div>
              {crmRhythmRows.length === 0 ? (
                <div style={{ fontSize: ".82rem", color: T.mu }}>All workshop CRM records have owner, review, next-action, obligation, and open-issue visibility inside the current local evidence set.</div>
              ) : (
                crmRhythmRows.map(row => (
                  <div key={`crm-rhythm-${row.client.id}`} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".6rem", marginTop: ".6rem" }}>
                    <div className="card-head">
                      <div style={{ fontWeight: 800, fontSize: ".86rem" }}>{row.client.name}</div>
                      <span className={`badge ${row.atRisk ? "b-cancelled" : "b-pending"}`}>{row.atRisk ? "At Risk" : "Review"}</span>
                    </div>
                    <div className="meta" style={{ marginTop: ".3rem" }}>
                      <span>Owner: {row.client.relationshipOwner || "Required"}</span>
                      <span>Review: {row.client.reviewDate ? fmtFullDate(row.client.reviewDate) : "Not set"}</span>
                      <span>Next action: {row.client.nextAction || "Not recorded"}</span>
                    </div>
                    <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".3rem" }}>{row.reasons.join("; ")}</div>
                    <button className="btn b-ghost b-sm" style={{ marginTop: ".55rem" }} onClick={() => openCrmRecord(row.client)}>Open CRM Review</button>
                  </div>
                ))
              )}
            </div>
            {clients.map(c => {
              const overdue = overdueInvoicesForClient(c.id);
              const openIssues = clientOpenIssues(c);
              const incomplete = crmIncompleteReasons(c);
              const rhythm = crmRhythmByClientId.get(c.id);
              const activeObligations = activeCrmObligations(c);
              const latestSupplierAccessChange = (c.supplierAccessChangeLog || []).slice(-1)[0];
              const addressStatus = physicalAddressStatus(c.address);
              return (
              <div className="card" key={c.id}>
                <div className="card-head">
                  <div className="card-title" style={{ marginBottom: ".4rem" }}>{c.name}</div>
                  <span className={`badge ${rhythm?.atRisk ? "b-cancelled" : ((c.status || "Active") === "Active" ? "b-done" : (["Suspended", "Closed"].includes(c.status) ? "b-cancelled" : "b-pending"))}`}>{rhythm?.atRisk ? "CRM Risk" : (c.status || "Active")}</span>
                </div>
                <div className="meta"><span>✉️ {c.email}</span><span>📞 {c.phone}</span><span>📍 {c.address}</span></div>
                <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".4rem" }}>Operational: {c.operationalContact?.name || c.name} ({c.operationalContact?.email || c.email})</div>
                <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".25rem" }}>Billing: {c.billingContact?.name || "Not recorded"} ({c.billingContact?.email || "Not recorded"})</div>
                <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".25rem" }}>Supplier access: {(c.vendors || []).length ? (c.vendors || []).join(", ") : "None approved"}</div>
                <div style={{ fontSize: ".78rem", color: addressStatus.ok ? T.mu : T.acc, marginTop: ".25rem" }}>Activation eligibility: {c.activationEligibility?.reviewedAt ? `Reviewed ${fmtFullDate(isoDate(c.activationEligibility.reviewedAt))}` : "Review required"}; {addressStatus.reason}</div>
                <div className="meta" style={{ marginTop: ".45rem" }}>
                  <span>Owner: {c.relationshipOwner || "Required"}</span>
                  <span>Tier: {c.relationshipTier || "Transactional"}</span>
                  <span>Risk: {c.riskLevel || "Low"}</span>
                  <span>Review: {c.reviewDate ? fmt(c.reviewDate) : "Not set"}</span>
                </div>
                {(c.nextAction || c.nextActionDue) && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Next action: {c.nextAction || "Not recorded"}{c.nextActionDue ? ` by ${fmt(c.nextActionDue)}` : ""}</div>}
                {rhythm && <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>Rhythm monitor: {rhythm.reasons.slice(0, 3).join("; ")}{rhythm.reasons.length > 3 ? `; +${rhythm.reasons.length - 3} more` : ""}</div>}
                {incomplete.length > 0 && <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>CRM incomplete: {incomplete.join(", ")}</div>}
                {openIssues.length > 0 && <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>Open issue visibility: {openIssues.map(issue => `${issue.type} ${issue.orderId}`).join(", ")}</div>}
                {activeObligations.length > 0 && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Open obligations: {activeObligations.map(item => `${item.title} due ${item.dueDate ? fmt(item.dueDate) : "TBD"}`).join(", ")}</div>}
                {(c.crmEvents || []).length > 0 && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Latest CRM event: {c.crmEvents[c.crmEvents.length - 1].eventType} - {c.crmEvents[c.crmEvents.length - 1].description}</div>}
                {latestSupplierAccessChange && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Latest supplier access change: {latestSupplierAccessChange.action} {latestSupplierAccessChange.supplierName || latestSupplierAccessChange.nextSuppliers?.join(", ") || "supplier links"} - {latestSupplierAccessChange.reason}</div>}
                {overdue.length > 0 && <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>Overdue: {overdue.map(invoice => `${invoice.id} due ${fmt(invoice.dueDate)}`).join(", ")}</div>}
                {c.suspensionRecord && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>
                    Suspension: {c.suspensionRecord.reason}; notified {c.suspensionRecord.operationalContactNotified ? "Operational" : ""}{c.suspensionRecord.operationalContactNotified && c.suspensionRecord.billingContactNotified ? " + " : ""}{c.suspensionRecord.billingContactNotified ? "Billing" : ""}.
                  </div>
                )}
                {c.reinstatementRecord && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>
                    Reinstatement evidence: {c.reinstatementRecord.evidence}
                    {c.reinstatementRecord.paymentArrangement && (
                      <>
                        <br />
                        Payment arrangement: {c.reinstatementRecord.paymentArrangement.agreedAmount} due {fmtFullDate(c.reinstatementRecord.paymentArrangement.agreedPaymentDate)}; agreed by {c.reinstatementRecord.paymentArrangement.agreedByNameAndRole}.
                      </>
                    )}
                  </div>
                )}
                {c.terminationRecord && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>
                    Termination: {c.terminationRecord.groundLabel || policy23TerminationGroundLabel(c.terminationRecord.ground)}; effective {fmtFullDate(c.terminationRecord.effectiveDate)}; {c.terminationRecord.outstandingInvoiceNote}
                  </div>
                )}
                <div className="pills" style={{ marginTop: ".6rem", marginBottom: ".2rem" }}>
                  {activeSupplierList.map(supplier => {
                    const linked = (c.vendors || []).includes(supplier.name);
                    return (
                      <button key={`${c.id}-${supplier.id || supplier.name}`} className={`pill${linked ? " sel" : ""}`} onClick={() => openSupplierAccessAction(c, supplier.name)}>
                        {linked ? "Linked: " : "Add: "}{supplier.name}
                      </button>
                    );
                  })}
                </div>
                <hr className="dvd" />
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                  <button className="btn b-ghost b-sm" onClick={() => openCrmRecord(c)}>CRM Review</button>
                  {c.status === "Pending" && <button className="btn b-teal b-sm" onClick={() => openActivationReview(c)}>Review Eligibility</button>}
                  {(c.status || "Active") === "Active" && <button className="btn b-red b-sm" onClick={() => openSuspension(c, overdue[0] || null)}>{overdue.length ? "Suspend Overdue Account" : "Suspend Account"}</button>}
                  {c.status === "Suspended" && <button className="btn b-acc b-sm" onClick={() => openReinstatement(c)}>Reinstate</button>}
                  {["Active", "Suspended"].includes(c.status || "Active") && <button className="btn b-red b-sm" onClick={() => openTermination(c)}>Terminate / Close</button>}
                  {c.status === "Closed" && <button className="btn b-ghost b-sm" disabled>New agreement required</button>}
                </div>
              </div>
              );
            })}
          </>
        )}

        {view === "access" && (
          <>
            <div className="sh"><h2>Role Access Register</h2></div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{activeAccessCount}</div><div className="stat-lbl">Active</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.red }}>{revokedAccessCount}</div><div className="stat-lbl">Revoked</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.acc }}>{staffReviewDueCount}</div><div className="stat-lbl">Staff Reviews Due</div></div>
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: ".45rem" }}>Receiver Access Model</div>
              <div className="meta">
                <span>ACT-INT-003</span>
                <span>No login</span>
                <span>POD signature only</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Receiver remains no-login as confirmed. Receiver name and signature are captured only inside the driver POD workflow.
              </div>
            </div>
            {(accessRecords || []).map(record => (
              <div className="card" key={record.key}>
                <div className="card-head">
                  <div className="card-title">{record.roleLabel} - {record.subjectName}</div>
                  <span className={`badge ${accessBadgeClass(record.status)}`}>{record.status}</span>
                </div>
                <div className="meta">
                  <span>{record.actorCode}</span>
                  <span>{record.email}</span>
                  <span>{record.accountName}</span>
                  {isStaffAccess(record) && <span>{record.reviewDue ? "Annual review due" : (record.reviewedAt ? `Reviewed ${fmtFullDate(isoDate(record.reviewedAt))}` : "Annual review not recorded")}</span>}
                  {record.lastReviewType && <span>Review type: {accessReviewTypeLabel(record.lastReviewType)}</span>}
                </div>
                <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>{record.accessScope}</div>
                {record.revokedAt && <div style={{ fontSize: ".78rem", color: record.status === "Revoked" ? T.red : T.mu, marginTop: ".35rem" }}>{record.status === "Revoked" ? "Revoked" : "Previous revoke"} {fmtFullDate(isoDate(record.revokedAt))}{record.revokedReviewType ? ` via ${accessReviewTypeLabel(record.revokedReviewType)}` : ""}: {record.revokedReason}</div>}
                {record.restoredAt && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Restored {fmtFullDate(isoDate(record.restoredAt))}{record.restoredReviewType ? ` via ${accessReviewTypeLabel(record.restoredReviewType)}` : ""}: {record.restoredReason}</div>}
                {record.lastReviewReason && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Review note: {record.lastReviewReason}</div>}
                <hr className="dvd" />
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                  <button className="btn b-ghost b-sm" onClick={() => openAccessAction(record, "review")}>Record Review</button>
                  {record.status === "Revoked" ? (
                    <button className="btn b-acc b-sm" onClick={() => openAccessAction(record, "restore")}>Restore Access</button>
                  ) : (
                    <button className="btn b-red b-sm" onClick={() => openAccessAction(record, "revoke")}>Revoke Access</button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {view === "dataUse" && (
          <>
            <div className="sh"><h2>Policy #21 / POL-OPS-021 Data Use Register</h2></div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{dataUseRows.length}</div><div className="stat-lbl">Records</div></div>
              <div className="stat"><div className="stat-num" style={{ color: blockedDataUseRows.length ? T.red : T.tx }}>{blockedDataUseRows.length}</div><div className="stat-lbl">Blocked</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.acc }}>{digiverseProductionAccessRows.length}</div><div className="stat-lbl">Digiverse Access</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.teal }}>{exportDataUseRows.length}</div><div className="stat-lbl">Exports</div></div>
            </div>
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Data Use / Access Decision</div>
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".25rem" }}>
                    {POLICY21_DATA_USE_SOURCE} and {POLICY7_INFORMATION_SECURITY_SOURCE}: RBAC/RLS basis, acceptable use, Digiverse production access logging, and APP-PRV-004 evidence.
                  </div>
                </div>
                <span className={`badge ${editingDataUseId ? "b-pending" : "b-done"}`}>{editingDataUseId ? "Editing" : "New"}</span>
              </div>
              <div className="grid2" style={{ marginTop: ".9rem" }}>
                <div className="f"><label>Request Title *</label><input value={dataUseDraft.title} onChange={e => setDataUseDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="Digiverse support access / customer export request" /></div>
                <div className="f"><label>Request Date</label><input type="date" value={dataUseDraft.requestDate} onChange={e => setDataUseDraft(prev => ({ ...prev, requestDate: e.target.value }))} /></div>
                <div className="f"><label>Request Type</label><select value={dataUseDraft.requestType} onChange={e => setDataUseDraft(prev => ({ ...prev, requestType: e.target.value, requesterRole: e.target.value === "Digiverse Production Access" ? "Digiverse" : prev.requesterRole }))}>{POLICY21_DATA_USE_REQUEST_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                <div className="f"><label>Requester Role</label><select value={dataUseDraft.requesterRole} onChange={e => setDataUseDraft(prev => ({ ...prev, requesterRole: e.target.value }))}>{POLICY21_DATA_USE_REQUESTER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}</select></div>
                <div className="f"><label>Requester Name *</label><input value={dataUseDraft.requesterName} onChange={e => setDataUseDraft(prev => ({ ...prev, requesterName: e.target.value }))} placeholder="Admin / driver / Digiverse contact" /></div>
                <div className="f"><label>Data Categories / PII Classes *</label><input value={dataUseDraft.dataCategories} onChange={e => setDataUseDraft(prev => ({ ...prev, dataCategories: e.target.value }))} placeholder="Delivery addresses, receiver names, POD signatures, billing records" /></div>
              </div>
              <div className="f"><label>Purpose *</label><textarea value={dataUseDraft.purpose} onChange={e => setDataUseDraft(prev => ({ ...prev, purpose: e.target.value }))} placeholder="Only the operational purpose collected for, or maintenance/support purpose for Digiverse." /></div>
              <div className="f"><label>Role / RLS Basis *</label><textarea value={dataUseDraft.roleBasis} onChange={e => setDataUseDraft(prev => ({ ...prev, roleBasis: e.target.value }))} placeholder="Admin operational management, driver assigned-run data, Digiverse maintenance/support only..." /></div>
              <div className="grid2">
                <div className="f"><label>External Recipient</label><input value={dataUseDraft.externalRecipient} onChange={e => setDataUseDraft(prev => ({ ...prev, externalRecipient: e.target.value }))} placeholder="Supplier / client / provider if any" /></div>
                <div className="f"><label>Consent Evidence</label><input value={dataUseDraft.consentEvidence} onChange={e => setDataUseDraft(prev => ({ ...prev, consentEvidence: e.target.value }))} placeholder="Client consent ref, if needed" /></div>
                <div className="f"><label>Admin Approval Evidence</label><input value={dataUseDraft.adminApprovalEvidence} onChange={e => setDataUseDraft(prev => ({ ...prev, adminApprovalEvidence: e.target.value }))} placeholder="Approval/ref required for export and Digiverse production access" /></div>
                <div className="f"><label>Digiverse Production Access Log Ref</label><input value={dataUseDraft.productionAccessLogRef} onChange={e => setDataUseDraft(prev => ({ ...prev, productionAccessLogRef: e.target.value }))} placeholder="Required for Digiverse production access" /></div>
              </div>
              <div className="f"><label>Digiverse Scope / Breach Escalation Note</label><textarea value={dataUseDraft.requestType === "Data Access Breach" ? dataUseDraft.breachEscalationNote : dataUseDraft.digiverseScope} onChange={e => setDataUseDraft(prev => prev.requestType === "Data Access Breach" ? ({ ...prev, breachEscalationNote: e.target.value }) : ({ ...prev, digiverseScope: e.target.value }))} placeholder="Maintenance/support scope, or immediate Admin breach report evidence." /></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: ".55rem", margin: ".8rem 0" }}>
                <label style={{ fontSize: ".82rem", color: T.mu }}><input type="checkbox" checked={Boolean(dataUseDraft.serviceDeliveryInvolved)} onChange={e => setDataUseDraft(prev => ({ ...prev, serviceDeliveryInvolved: e.target.checked }))} /> Recipient involved in service delivery</label>
                <label style={{ fontSize: ".82rem", color: T.mu }}><input type="checkbox" checked={Boolean(dataUseDraft.prohibitedPersonalUse)} onChange={e => setDataUseDraft(prev => ({ ...prev, prohibitedPersonalUse: e.target.checked }))} /> Personal curiosity/gain/unrelated purpose</label>
                <label style={{ fontSize: ".82rem", color: T.mu }}><input type="checkbox" checked={Boolean(dataUseDraft.storedOnPersonalDevice)} onChange={e => setDataUseDraft(prev => ({ ...prev, storedOnPersonalDevice: e.target.checked }))} /> Stored on personal device</label>
                <label style={{ fontSize: ".82rem", color: T.mu }}><input type="checkbox" checked={Boolean(dataUseDraft.sharesClientDataExternally)} onChange={e => setDataUseDraft(prev => ({ ...prev, sharesClientDataExternally: e.target.checked }))} /> Shares client data externally</label>
                <label style={{ fontSize: ".82rem", color: T.mu }}><input type="checkbox" checked={Boolean(dataUseDraft.sharesDriverDataToClientsOrSuppliers)} onChange={e => setDataUseDraft(prev => ({ ...prev, sharesDriverDataToClientsOrSuppliers: e.target.checked }))} /> Shares driver PI to clients/suppliers</label>
              </div>
              {dataUseBlockedReasons(dataUseDraft).length > 0 && (
                <div className="notice system" style={{ margin: ".7rem 0" }}>
                  <strong>Policy #21 / Policy #7 Blocked Reasons</strong>
                  <ul style={{ margin: ".45rem 0 0", paddingLeft: "1.1rem" }}>
                    {dataUseBlockedReasons(dataUseDraft).map(reason => <li key={reason}>{reason}</li>)}
                  </ul>
                </div>
              )}
              <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".8rem" }}>
                <button className="btn b-acc" onClick={saveDataUseDraft}>{editingDataUseId ? "Update Data Use Record" : "Save Data Use Record"}</button>
                <button className="btn b-ghost" onClick={resetDataUseDraft}>Clear</button>
                <button className="btn b-ghost" onClick={() => setView("ndb")}>Open NDB Register</button>
              </div>
            </div>
            {dataUseRows.length === 0 && <div className="empty">No Policy #21 data-use records yet.</div>}
            {dataUseRows.map(row => (
              <div className="card" key={row.id}>
                <div className="card-head">
                  <div className="card-title">{row.title || row.requestType}</div>
                  <span className={`badge ${dataUseStatusBadgeClass(row.status)}`}>{row.status}</span>
                </div>
                <div className="meta">
                  <span>{row.requestType}</span>
                  <span>{row.requesterRole}: {row.requesterName}</span>
                  <span>{fmtFullDate(row.requestDate)}</span>
                  <span>{row.sourceRef}</span>
                </div>
                <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".45rem" }}>
                  Data: {row.dataCategories}. Purpose: {row.purpose}. Role basis: {row.roleBasis}.
                </div>
                {row.externalRecipient && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>External recipient: {row.externalRecipient}. Consent: {row.consentEvidence || "Not recorded"}.</div>}
                {row.requestType === "Digiverse Production Access" && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>
                    Digiverse scope: {row.digiverseScope || "Not recorded"}. Production access log: {row.productionAccessLogRef || "Missing"}. Admin evidence: {row.adminApprovalEvidence || "Missing"}.
                  </div>
                )}
                {row.requestType === "Data Access Breach" && <div style={{ fontSize: ".78rem", color: T.red, marginTop: ".35rem" }}>Breach escalation: {row.breachEscalationNote || "Missing"}.</div>}
                {(row.blockedReasons || []).length > 0 && (
                  <div style={{ fontSize: ".78rem", color: T.red, marginTop: ".45rem" }}>
                    Blocked reasons: {row.blockedReasons.join(" ")}
                  </div>
                )}
                <hr className="dvd" />
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                  <button className="btn b-ghost b-sm" onClick={() => editDataUseRecord(row)}>Edit Record</button>
                  {row.requestType === "Data Access Breach" && <button className="btn b-red b-sm" onClick={() => setView("ndb")}>Open NDB Register</button>}
                </div>
              </div>
            ))}
          </>
        )}

        {view === "privacy" && (
          <>
            <div className="sh"><h2>Policy #3 / POL-OPS-003 Privacy Request Register</h2></div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{privacyRequestRows.length}</div><div className="stat-lbl">Requests</div></div>
              <div className="stat"><div className="stat-num" style={{ color: openPrivacyRequestRows.length ? T.acc : T.tx }}>{openPrivacyRequestRows.length}</div><div className="stat-lbl">Open</div></div>
              <div className="stat"><div className="stat-num" style={{ color: overduePrivacyRequestRows.length ? T.red : T.tx }}>{overduePrivacyRequestRows.length}</div><div className="stat-lbl">Overdue</div></div>
              <div className="stat"><div className="stat-num" style={{ color: privacyOwnerBlockedRequestRows.length ? T.red : T.tx }}>{privacyOwnerBlockedRequestRows.length}</div><div className="stat-lbl">Owner Blocked</div></div>
            </div>
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Access, Correction, Complaint, Or APP 4 Assessment</div>
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".25rem" }}>
                    {POLICY3_PRIVACY_SOURCE}: APP 12 access and APP 13 correction requests must be processed within 30 days. Complaints are acknowledged within 5 business days and aimed for resolution within 30 days.
                  </div>
                </div>
                <span className={`badge ${editingPrivacyRequestId ? "b-pending" : "b-done"}`}>{editingPrivacyRequestId ? "Editing" : "New"}</span>
              </div>
              <div className="grid2" style={{ marginTop: ".9rem" }}>
                <div className="f"><label>Request Type</label><select value={privacyRequestDraft.requestType} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, requestType: e.target.value, status: e.target.value === "Privacy Complaint" ? "Acknowledged" : "Open" }))}>{POLICY3_PRIVACY_REQUEST_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                <div className="f"><label>Status</label><select value={privacyRequestDraft.status} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, status: e.target.value }))}>{POLICY3_PRIVACY_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}</select></div>
                <div className="f"><label>Requester Role</label><select value={privacyRequestDraft.requesterRole} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, requesterRole: e.target.value }))}>{POLICY3_PRIVACY_REQUESTER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}</select></div>
                <div className="f"><label>Received Date</label><input type="date" value={privacyRequestDraft.receivedDate} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, receivedDate: e.target.value }))} /></div>
                <div className="f"><label>Requester Name *</label><input value={privacyRequestDraft.requesterName} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, requesterName: e.target.value }))} placeholder="Individual making the privacy request" /></div>
                <div className="f"><label>Requester Contact *</label><input value={privacyRequestDraft.requesterContact} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, requesterContact: e.target.value }))} placeholder="Email or phone for Admin response" /></div>
                <div className="f"><label>Related Account</label><input value={privacyRequestDraft.relatedAccount} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, relatedAccount: e.target.value }))} placeholder="Workshop, driver, supplier, receiver, if known" /></div>
                <div className="f"><label>Collection Notice Version</label><input value={privacyRequestDraft.collectionNoticeVersion} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, collectionNoticeVersion: e.target.value }))} placeholder="Policy #4 / POL-OPS-004 version" /></div>
              </div>
              <div className="f"><label>Request Summary *</label><textarea value={privacyRequestDraft.requestSummary} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, requestSummary: e.target.value }))} placeholder="Access request, correction request, privacy complaint, or unsolicited information received." /></div>
              <div className="f"><label>Personal Information Categories *</label><textarea value={privacyRequestDraft.piiCategories} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, piiCategories: e.target.value }))} placeholder="Account contact, delivery address, order history, receiver signature..." /></div>
              <div className="grid2">
                <div className="f"><label>Complaint Acknowledgement Evidence</label><input value={privacyRequestDraft.acknowledgementEvidence} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, acknowledgementEvidence: e.target.value, acknowledgedAt: e.target.value.trim() ? (prev.acknowledgedAt || isoNow()) : "" }))} placeholder="Required before complaint acknowledgement/resolution" /></div>
                <div className="f"><label>Access Response Evidence</label><input value={privacyRequestDraft.accessResponseEvidence} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, accessResponseEvidence: e.target.value }))} placeholder="APP 12 access response record" /></div>
                <div className="f"><label>Correction Action Evidence</label><input value={privacyRequestDraft.correctionActionEvidence} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, correctionActionEvidence: e.target.value }))} placeholder="APP 13 correction action record" /></div>
                <div className="f"><label>Privacy Act Refusal Ground</label><input value={privacyRequestDraft.privacyActRefusalGround} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, privacyActRefusalGround: e.target.value }))} placeholder="Required if refusing access/correction" /></div>
              </div>
              <div className="f"><label>APP 3 Assessment For Unsolicited Information</label><textarea value={privacyRequestDraft.app3Assessment} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, app3Assessment: e.target.value }))} placeholder="Could Moto & Co have collected this information under APP 3? If not, destruction/de-identification requires Privacy Owner approval." /></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: ".55rem", margin: ".8rem 0" }}>
                <label style={{ fontSize: ".82rem", color: T.mu }}><input type="checkbox" checked={Boolean(privacyRequestDraft.couldHaveCollectedUnderApp3)} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, couldHaveCollectedUnderApp3: e.target.checked }))} /> Could have collected under APP 3</label>
                <label style={{ fontSize: ".82rem", color: T.mu }}><input type="checkbox" checked={Boolean(privacyRequestDraft.destructionOrDeidentificationRequested)} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, destructionOrDeidentificationRequested: e.target.checked }))} /> Destruction/de-identification requested</label>
              </div>
              <div className="grid2">
                <div className="f"><label>Privacy Owner Name</label><input value={privacyRequestDraft.privacyOwnerName} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, privacyOwnerName: e.target.value }))} placeholder="Open gap until ACT-TECH-002 is named" /></div>
                <div className="f"><label>Privacy Owner Approval Evidence</label><input value={privacyRequestDraft.privacyOwnerApprovalEvidence} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, privacyOwnerApprovalEvidence: e.target.value }))} placeholder="Required before destruction/de-identification can execute" /></div>
              </div>
              <div className="f"><label>Outcome Note</label><textarea value={privacyRequestDraft.outcomeNote} onChange={e => setPrivacyRequestDraft(prev => ({ ...prev, outcomeNote: e.target.value }))} placeholder="Admin response, correction, refusal, complaint outcome, OAIC referral, or Privacy Owner blocker evidence." /></div>
              <div className="meta" style={{ marginTop: ".55rem" }}>
                <span>Response due {fmtFullDate(policy3PrivacyResponseDueDate(privacyRequestDraft.receivedDate || todayBrisbane()))}</span>
                {privacyRequestDraft.requestType === "Privacy Complaint" && <span>Complaint acknowledgement due {fmtFullDate(policy3PrivacyComplaintAckDueDate(privacyRequestDraft.receivedDate || todayBrisbane()))}</span>}
                <span>{POLICY4_COLLECTION_NOTICE_SOURCE}</span>
                <span>{POLICY5_RETENTION_SOURCE}: destruction blocked without Privacy Owner approval</span>
              </div>
              <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".8rem" }}>
                <button className="btn b-acc" onClick={savePrivacyRequestDraft}>{editingPrivacyRequestId ? "Update Privacy Request" : "Save Privacy Request"}</button>
                <button className="btn b-ghost" onClick={resetPrivacyRequestDraft}>Clear</button>
                <button className="btn b-ghost" onClick={() => setView("retention")}>Open Retention Register</button>
              </div>
            </div>
            {privacyRequestRows.length === 0 && <div className="empty">No Policy #3 privacy requests recorded.</div>}
            {privacyRequestRows.map(row => (
              <div className="card" key={row.id}>
                <div className="card-head">
                  <div className="card-title">{row.requestType} - {row.requesterName || "Requester not named"}</div>
                  <span className={`badge ${privacyRequestAckOverdue(row) || privacyRequestResponseOverdue(row) ? "b-cancelled" : privacyRequestStatusBadgeClass(row.status)}`}>{privacyRequestAckOverdue(row) ? "Ack Overdue" : privacyRequestResponseOverdue(row) ? "Response Overdue" : row.status}</span>
                </div>
                <div className="meta">
                  <span>{row.requesterRole}</span>
                  <span>{row.requesterContact}</span>
                  <span>Received {fmtFullDate(row.receivedDate)}</span>
                  <span>Response due {fmtFullDate(row.responseDueDate)}</span>
                  {row.complaintAckDueDate && <span>Ack due {fmtFullDate(row.complaintAckDueDate)}</span>}
                </div>
                <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".45rem" }}>
                  Data: {row.piiCategories}. Request: {row.requestSummary}
                </div>
                {row.acknowledgementEvidence && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Acknowledgement: {row.acknowledgementEvidence}</div>}
                {row.accessResponseEvidence && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Access response: {row.accessResponseEvidence}</div>}
                {row.correctionActionEvidence && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Correction action: {row.correctionActionEvidence}</div>}
                {row.privacyActRefusalGround && <div style={{ fontSize: ".78rem", color: T.red, marginTop: ".35rem" }}>Privacy Act refusal ground: {row.privacyActRefusalGround}</div>}
                {row.app3Assessment && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>APP 3 assessment: {row.app3Assessment}</div>}
                {row.status === "Blocked - Privacy Owner Required" && <div style={{ fontSize: ".78rem", color: T.red, marginTop: ".35rem" }}>Policy #5 blocks destruction/de-identification until Privacy Owner approval is recorded.</div>}
                {row.outcomeNote && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Outcome: {row.outcomeNote}</div>}
                <hr className="dvd" />
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                  <button className="btn b-ghost b-sm" onClick={() => editPrivacyRequest(row)}>Edit Request</button>
                  {row.status === "Blocked - Privacy Owner Required" && <button className="btn b-ghost b-sm" onClick={() => setView("retention")}>Review Retention Block</button>}
                </div>
              </div>
            ))}
          </>
        )}

        {view === "drivers" && (
          <>
            <h2 style={{ marginBottom: "1rem" }}>Drivers ({drivers.length})</h2>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{drivers.length}</div><div className="stat-lbl">Driver Accounts</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{activeDriverCount}</div><div className="stat-lbl">Active</div></div>
              <div className="stat"><div className="stat-num" style={{ color: blockingAvailabilityRows.length ? T.acc : T.tx }}>{blockingAvailabilityRows.length}</div><div className="stat-lbl">Blocking Records</div></div>
              <div className="stat"><div className="stat-num" style={{ color: availabilityContingencyGapRows.length ? T.acc : T.tx }}>{availabilityContingencyGapRows.length}</div><div className="stat-lbl">Contingency Gaps</div></div>
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Driver Directory</div>
                <span className="badge b-done">Logistics</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Manage logistics-facing driver accounts used for dispatch selection, local availability records, and run assignment visibility.
              </div>
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: ".7rem" }}>Edit Driver Directory</div>
              <div className="fr">
                <div className="f"><label>Driver</label>
                  <select value={editingDriverId || ""} onChange={e => editDriverRecord(drivers.find(driver => driver.id === e.target.value) || drivers[0])}>
                    {drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                  </select>
                </div>
                <div className="f"><label>Name</label><input value={driverDraft.name || ""} onChange={e => setDriverDraft(p => ({ ...p, name: e.target.value }))} /></div>
              </div>
              <div className="fr">
                <div className="f"><label>Email</label><input value={driverDraft.email || ""} onChange={e => setDriverDraft(p => ({ ...p, email: e.target.value }))} /></div>
                <div className="f"><label>Phone</label><input value={driverDraft.phone || ""} onChange={e => setDriverDraft(p => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <div className="fr">
                <div className="f"><label>Status</label>
                  <select value={driverDraft.status || "Active"} onChange={e => setDriverDraft(p => ({ ...p, status: e.target.value }))}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="f"><label>Last Reviewed</label><input type="date" value={driverDraft.lastReviewed || ""} onChange={e => setDriverDraft(p => ({ ...p, lastReviewed: e.target.value }))} /></div>
              </div>
              <div className="f"><label>Notes</label><textarea value={driverDraft.notes || ""} onChange={e => setDriverDraft(p => ({ ...p, notes: e.target.value }))} placeholder="Logistics notes for dispatch/admin use." /></div>
              <div className="f"><label>Driver Directory Change Reason *</label><input value={driverChangeReason} onChange={e => setDriverChangeReason(e.target.value)} placeholder="Required for APP-PRV-004 audit trail" /></div>
              <button className="btn b-acc b-sm" onClick={saveDriverRecordDraft}>Save Driver Directory</button>
            </div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: blockingAvailabilityRows.length ? T.acc : T.tx }}>{blockingAvailabilityRows.length}</div><div className="stat-lbl">Blocking Records</div></div>
              <div className="stat"><div className="stat-num" style={{ color: lateAvailabilityRows.length ? T.acc : T.tx }}>{lateAvailabilityRows.length}</div><div className="stat-lbl">Late Notices</div></div>
              <div className="stat"><div className="stat-num" style={{ color: availabilityContingencyGapRows.length ? T.acc : T.tx }}>{availabilityContingencyGapRows.length}</div><div className="stat-lbl">Contingency Gaps</div></div>
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Policy #22 Availability Monitor</div>
                <span className="badge b-pending">Manual</span>
              </div>
              <div className="meta">
                <span>{POLICY22_DRIVER_SCHEDULING_SOURCE}</span>
                <span>Notice due evening before run</span>
                <span>Single-driver contingency evidence</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Unavailable or leave records require a driver notice received date and Admin contingency evidence. Late notices are accepted into the record and flagged for Admin review.
              </div>
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: ".7rem" }}>Manual Availability</div>
              <div className="fr">
                <div className="f"><label>Driver</label>
                  <select value={availabilityDraft.driverId || drivers[0]?.id || ""} onChange={e => setAvailabilityDraft(p => ({ ...p, driverId: e.target.value }))}>
                    {drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                  </select>
                </div>
                <div className="f"><label>Date</label><input type="date" value={availabilityDraft.availabilityDate} onChange={e => setAvailabilityDraft(p => ({ ...p, availabilityDate: e.target.value }))} onInput={e => setAvailabilityDraft(p => ({ ...p, availabilityDate: e.target.value }))} /></div>
                <div className="f"><label>Status</label>
                  <select value={availabilityDraft.status} onChange={e => setAvailabilityDraft(p => ({ ...p, status: e.target.value }))}>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="leave">Leave</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>
              <div className="fr">
                <div className="f"><label>Note</label><input value={availabilityDraft.note} onChange={e => setAvailabilityDraft(p => ({ ...p, note: e.target.value }))} placeholder="Required for unavailable/leave" /></div>
                <div className="f"><label>Notice Received Date</label><input type="date" value={availabilityDraft.noticeReceivedDate || ""} onChange={e => setAvailabilityDraft(p => ({ ...p, noticeReceivedDate: e.target.value }))} onInput={e => setAvailabilityDraft(p => ({ ...p, noticeReceivedDate: e.target.value }))} /></div>
              </div>
              <div className="f"><label>Contingency Plan</label><textarea value={availabilityDraft.contingencyPlan || ""} onChange={e => setAvailabilityDraft(p => ({ ...p, contingencyPlan: e.target.value }))} placeholder="Required for unavailable/leave while single-driver capacity applies" /></div>
              <div style={{ fontSize: ".78rem", color: T.mu, marginBottom: ".7rem" }}>
                Policy #22 records manual driver availability. Unavailable or leave status blocks dispatch assignment for that run date; notice due date is {availabilityDraft.availabilityDate ? fmtFullDate(driverAvailabilityNoticeDueDate(availabilityDraft.availabilityDate)) : "set after run date"}.
              </div>
              <button className="btn b-acc b-sm" onClick={saveAvailabilityDraft}>Save Availability</button>
            </div>
            {driverRecordRows.map(({ driver: d }) => (
              <div className="card" key={d.id}>
                <div className="card-title" style={{ marginBottom: ".4rem" }}>{d.name}</div>
                <div className="meta" style={{ marginBottom: ".35rem" }}>
                  <span className={`badge ${driverRecordBadgeClass(d)}`}>{d.status || "Active"}</span>
                  <span>Driver ID {d.id}</span>
                </div>
                <div className="meta"><span>Email {d.email}</span><span>Phone {d.phone}</span></div>
                <div className="meta" style={{ marginTop: ".35rem" }}>
                  <span>Last reviewed {d.lastReviewed ? fmtFullDate(d.lastReviewed) : "Not recorded"}</span>
                  <span>{d.notes || "No logistics notes"}</span>
                </div>
                <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".4rem" }}>
                  Deliveries: {orders.filter(o => o.driverId === d.id && o.status === "Delivered").length} completed
                </div>
                {(driverAvailability || []).filter(record => record.driverId === d.id).slice(0, 3).map(record => (
                  <div key={record.id} className="meta" style={{ marginTop: ".35rem" }}>
                    <span>{fmt(record.availabilityDate)}</span>
                    <span>{record.status}</span>
                    <span>{record.note || "No note"}</span>
                    {driverAvailabilityDetail(record) && <span>{driverAvailabilityDetail(record)}</span>}
                  </div>
                ))}
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".7rem" }}>
                  <button className="btn b-ghost b-sm" onClick={() => editDriverRecord(d)}>Edit Directory</button>
                </div>
              </div>
            ))}
            <h2 style={{ margin: "1rem 0 .8rem" }}>Availability Records ({availabilityRows.length})</h2>
            {availabilityRows.length === 0 && <div className="empty">No manual availability records yet.</div>}
            {availabilityRows.map(record => (
              <div className="card" key={record.id}>
                <div className="card-head"><div className="card-title">{record.driver?.name || record.driverName || record.driverId}</div><span className={`badge ${driverAvailabilityBlockingStatus(record.status) ? "b-cancelled" : (record.status === "available" ? "b-done" : "b-pending")}`}>{record.status}</span></div>
                <div className="meta"><span>Date {fmt(record.availabilityDate)}</span><span>{record.note || "No note"}</span><span>Recorded {new Date(record.recordedAt || isoNow()).toLocaleString("en-AU")}</span></div>
                <div className="meta">
                  {record.noticeReceivedDate && <span>Notice received {fmtFullDate(record.noticeReceivedDate)}</span>}
                  {record.noticeDueDate && <span>Notice due {fmtFullDate(record.noticeDueDate)}</span>}
                  {record.lateNotice && <span>Late notice</span>}
                  <span>{record.contingencyPlan || "No contingency evidence"}</span>
                  <span>{record.sourceRef}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {view === "fleet" && (
          <>
            <div className="sh"><h2>Fleet Asset Register ({vehicles.length})</h2></div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{activeVehicleList.length}</div><div className="stat-lbl">Active Vehicles</div></div>
              <div className="stat"><div className="stat-num" style={{ color: vehicleComplianceBlockers.length ? T.acc : T.tx }}>{vehicleComplianceBlockers.length}</div><div className="stat-lbl">Compliance Blocks</div></div>
              <div className="stat"><div className="stat-num" style={{ color: serviceWarningCount ? T.acc : T.tx }}>{serviceWarningCount}</div><div className="stat-lbl">Service Warnings</div></div>
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">APP-FLT-001 Local Register</div>
                <span className="badge b-pending">BOAS Sheet 06</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Vehicle records are Admin-managed fleet master data. Dispatch can only assign an active vehicle with recorded current registration, current insurance, and no open defect. Live APP-FLT-001 expiry monitoring remains a production integration gap.
              </div>
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: ".7rem" }}>{editingVehicleId ? "Edit Vehicle" : "Add Vehicle"}</div>
              <div className="fr">
                <div className="f"><label>Vehicle Name / Call Sign</label><input value={vehicleDraft.vehicleName} onChange={e => setVehicleDraft(p => ({ ...p, vehicleName: e.target.value }))} placeholder="MCO-001 or ACT-VEH-001" /></div>
                <div className="f"><label>Registration Plate</label><input value={vehicleDraft.registrationPlate} onChange={e => setVehicleDraft(p => ({ ...p, registrationPlate: e.target.value }))} placeholder="Plate or registration reference" /></div>
              </div>
              <div className="fr">
                <div className="f"><label>Assigned Driver</label>
                  <select value={vehicleDraft.assignedDriverId} onChange={e => setVehicleDraft(p => ({ ...p, assignedDriverId: e.target.value }))}>
                    <option value="">No standing assignment</option>
                    {drivers.map(driver => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                  </select>
                </div>
                <div className="f"><label>Status</label>
                  <select value={vehicleDraft.status} onChange={e => setVehicleDraft(p => ({ ...p, status: e.target.value }))}>
                    <option value="Active">Active</option>
                    <option value="Needs Review">Needs Review</option>
                    <option value="Out of Service">Out of Service</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="fr">
                <div className="f"><label>Registration Expiry</label><input type="date" value={vehicleDraft.registrationExpiry} onChange={e => setVehicleDraft(p => ({ ...p, registrationExpiry: e.target.value }))} /></div>
                <div className="f"><label>Insurance Policy / Ref</label><input value={vehicleDraft.insurancePolicy} onChange={e => setVehicleDraft(p => ({ ...p, insurancePolicy: e.target.value }))} placeholder="Policy or certificate reference" /></div>
              </div>
              <div className="fr">
                <div className="f"><label>Insurance Expiry</label><input type="date" value={vehicleDraft.insuranceExpiry} onChange={e => setVehicleDraft(p => ({ ...p, insuranceExpiry: e.target.value }))} /></div>
                <div className="f"><label>GVM kg</label><input type="number" min="0" value={vehicleDraft.gvmKg} onChange={e => setVehicleDraft(p => ({ ...p, gvmKg: e.target.value }))} placeholder="Gross vehicle mass" /></div>
              </div>
              <div className="fr">
                <div className="f"><label>Last Service</label><input type="date" value={vehicleDraft.lastServiceDate} onChange={e => setVehicleDraft(p => ({ ...p, lastServiceDate: e.target.value }))} /></div>
                <div className="f"><label>Next Service Due</label><input type="date" value={vehicleDraft.nextServiceDue} onChange={e => setVehicleDraft(p => ({ ...p, nextServiceDue: e.target.value }))} /></div>
              </div>
              <div className="fr">
                <div className="f"><label>Defect Status</label>
                  <select value={vehicleDraft.defectStatus} onChange={e => setVehicleDraft(p => ({ ...p, defectStatus: e.target.value }))}>
                    <option value="Clear">Clear</option>
                    <option value="Unknown">Unknown</option>
                    <option value="Open Defect">Open Defect</option>
                  </select>
                </div>
                <div className="f"><label>Ownership Type</label>
                  <select value={vehicleDraft.ownershipType} onChange={e => setVehicleDraft(p => ({ ...p, ownershipType: e.target.value }))}>
                    <option value="Company">Company</option>
                    <option value="Driver">Driver</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="fr">
                <div className="f"><label>Make</label><input value={vehicleDraft.make} onChange={e => setVehicleDraft(p => ({ ...p, make: e.target.value }))} /></div>
                <div className="f"><label>Model</label><input value={vehicleDraft.model} onChange={e => setVehicleDraft(p => ({ ...p, model: e.target.value }))} /></div>
              </div>
              <div className="fr">
                <div className="f"><label>Year</label><input type="number" min="1900" max="2100" value={vehicleDraft.year} onChange={e => setVehicleDraft(p => ({ ...p, year: e.target.value }))} /></div>
                <div className="f"><label>Last Reviewed</label><input type="date" value={vehicleDraft.lastReviewed} onChange={e => setVehicleDraft(p => ({ ...p, lastReviewed: e.target.value }))} /></div>
              </div>
              <div className="f"><label>Notes</label><textarea value={vehicleDraft.notes} onChange={e => setVehicleDraft(p => ({ ...p, notes: e.target.value }))} placeholder="Local APP-FLT-001 evidence, policy note, or blocker" /></div>
              <div className="f"><label>Change Reason</label><textarea value={vehicleChangeReason} onChange={e => setVehicleChangeReason(e.target.value)} placeholder="Reason for creating or updating vehicle master data" /></div>
              <button className="btn b-acc" onClick={saveVehicleDraft}>{editingVehicleId ? "Save Vehicle" : "Add Vehicle"}</button>
              {editingVehicleId && <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={cancelVehicleEdit}>Cancel Edit</button>}
            </div>
            {vehicleComplianceRows.map(row => {
              const vehicle = row.vehicle;
              const driver = drivers.find(item => item.id === vehicle.assignedDriverId);
              return (
                <div className="card" key={vehicle.id}>
                  <div className="card-head">
                    <div className="card-title">{vehicleLabel(vehicle) || vehicle.id}</div>
                    <span className={`badge ${row.compliance.ready ? "b-done" : "b-cancelled"}`}>{row.compliance.ready ? "Dispatch Ready" : "Blocked"}</span>
                  </div>
                  <div className="meta">
                    <span>{vehicle.status || "Needs Review"}</span>
                    <span>{driver ? `Driver ${driver.name}` : "No standing driver"}</span>
                    <span>Rego {vehicle.registrationExpiry ? fmtFullDate(vehicle.registrationExpiry) : "not recorded"}</span>
                    <span>Insurance {vehicle.insuranceExpiry ? fmtFullDate(vehicle.insuranceExpiry) : "not recorded"}</span>
                    <span>Defect {vehicle.defectStatus || "Unknown"}</span>
                  </div>
                  <div style={{ fontSize: ".78rem", color: row.compliance.ready ? T.mu : T.acc, marginTop: ".35rem" }}>{row.compliance.reason}</div>
                  {row.compliance.warnings.length > 0 && <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>{row.compliance.warnings.join("; ")}</div>}
                  {(vehicle.make || vehicle.model || vehicle.ownershipType || vehicle.nextServiceDue) && (
                    <div className="meta" style={{ marginTop: ".45rem" }}>
                      {vehicle.make && <span>{vehicle.make}</span>}
                      {vehicle.model && <span>{vehicle.model}</span>}
                      {vehicle.year && <span>{vehicle.year}</span>}
                      {vehicle.gvmKg && <span>GVM {vehicle.gvmKg} kg</span>}
                      {vehicle.insurancePolicy && <span>Policy {vehicle.insurancePolicy}</span>}
                      {vehicle.ownershipType && <span>{vehicle.ownershipType}</span>}
                      {vehicle.nextServiceDue && <span>Service due {fmtFullDate(vehicle.nextServiceDue)}</span>}
                    </div>
                  )}
                  {vehicle.notes && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>{vehicle.notes}</div>}
                  <hr className="dvd" />
                  <button className="btn b-ghost b-sm" onClick={() => editVehicle(vehicle)}>Edit Vehicle</button>
                </div>
              );
            })}
          </>
        )}

        {view === "vendors" && (
          <>
            <div className="sh"><h2>Supplier Master Data</h2></div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{activeSupplierList.length}</div><div className="stat-lbl">Active Suppliers</div></div>
              <div className="stat"><div className="stat-num" style={{ color: supplierApprovalGapRows.length ? T.red : T.tx }}>{supplierApprovalGapRows.length}</div><div className="stat-lbl">Approval Gaps</div></div>
              <div className="stat"><div className="stat-num" style={{ color: supplierNamedContactGapRows.length ? T.acc : T.tx }}>{supplierNamedContactGapRows.length}</div><div className="stat-lbl">Named Contact Gaps</div></div>
              <div className="stat"><div className="stat-num" style={{ color: supplierReviewFlagRows.length ? T.acc : T.tx }}>{supplierReviewFlagRows.length}</div><div className="stat-lbl">Review Flags</div></div>
              <div className="stat"><div className="stat-num" style={{ color: supplierReviewOpenQueueRows.length ? T.red : T.tx }}>{supplierReviewOpenQueueRows.length}</div><div className="stat-lbl">Open Queue Items</div></div>
              <div className="stat"><div className="stat-num" style={{ color: supplierPickupStandardsFlagRows.length ? T.acc : T.tx }}>{supplierPickupStandardsFlagRows.length}</div><div className="stat-lbl">Pickup Alerts</div></div>
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">POL-MCL-001-001 Supplier Approval Gate</div>
                <span className={`badge ${supplierApprovalGapRows.length ? "b-cancelled" : "b-done"}`}>{supplierApprovalGapRows.length ? "Blocked" : "Evidence Recorded"}</span>
              </div>
              <div className="meta" style={{ marginBottom: ".65rem" }}>
                <span>CAP-MCL-001</span>
                <span>{supplierApprovalGapRows.length} approval gap{supplierApprovalGapRows.length === 1 ? "" : "s"}</span>
                <span>{supplierNamedContactGapRows.length} named contact gap{supplierNamedContactGapRows.length === 1 ? "" : "s"}</span>
              </div>
              {supplierApprovalGapRows.length === 0 ? (
                <div style={{ fontSize: ".82rem", color: T.mu }}>Active suppliers have dock access, packaging standards, pickup-window, and written evidence recorded. Named contacts remain visible below until Admin records the real people.</div>
              ) : (
                supplierApprovalGapRows.map(row => (
                  <div key={`approval-${row.supplier.id}`} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".6rem", marginTop: ".6rem" }}>
                    <div className="card-head">
                      <div style={{ fontWeight: 800, fontSize: ".86rem" }}>{row.supplier.name}</div>
                      <button className="btn b-acc b-sm" onClick={() => editSupplier(row.supplier)}>Edit Gate</button>
                    </div>
                    <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".3rem" }}>{row.gate.reasons.join("; ")}</div>
                  </div>
                ))
              )}
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Supplier Review Monitor</div>
                <span className={`badge ${supplierReviewFlagRows.length ? "b-pending" : "b-done"}`}>{supplierReviewFlagRows.length ? "Action Required" : "Current"}</span>
              </div>
              <div className="meta" style={{ marginBottom: ".65rem" }}>
                <span>SOP-MDM-01</span>
                <span>{supplierReviewFlagRows.length} flagged</span>
                <span>{supplierReviewOpenQueueRows.length} in exception queue</span>
                <span>Supplier-level review interval</span>
              </div>
              {supplierReviewFlagRows.length === 0 ? (
                <div style={{ fontSize: ".82rem", color: T.mu }}>All active supplier records have required fields and are inside their recorded review interval.</div>
              ) : (
                <>
                  {supplierReviewFlagRows.map(row => (
                    <div key={row.supplier.id} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".6rem", marginTop: ".6rem" }}>
                      <div className="card-head">
                        <div style={{ fontWeight: 800, fontSize: ".86rem" }}>{row.supplier.name}</div>
                        <span className={`badge ${supplierReviewBadgeClass(row)}`}>{row.openException ? "Queued" : "Flagged"}</span>
                      </div>
                      <div className="meta" style={{ marginTop: ".3rem" }}>
                        <span>Reviewed {row.supplier.lastReviewed || "Not recorded"}</span>
                        <span>{row.reviewIntervalDays ? `${row.reviewIntervalDays} day interval` : "Interval not set"}</span>
                        <span>{row.dueDate ? `Due ${fmtFullDate(row.dueDate)}` : "Due date unavailable"}</span>
                      </div>
                      <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".3rem" }}>{row.reasons.join("; ")}</div>
                      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: ".55rem" }}>
                        <button className="btn b-acc b-sm" disabled={Boolean(row.openException)} onClick={() => queueSupplierReviewFlag(row)}>{row.openException ? "Already Queued" : "Send To Exception Queue"}</button>
                        <button className="btn b-ghost b-sm" onClick={() => editSupplier(row.supplier)}>Edit Record</button>
                      </div>
                    </div>
                  ))}
                  <button className="btn b-ghost b-sm" style={{ marginTop: ".8rem" }} disabled={supplierReviewFlagRows.every(row => row.openException)} onClick={queueAllSupplierReviewFlags}>Queue All Current Flags</button>
                </>
              )}
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Pickup Standards Monitor</div>
                <span className={`badge ${supplierPickupStandardsFlagRows.length ? "b-pending" : "b-done"}`}>{supplierPickupStandardsFlagRows.length ? "Action Required" : "Current"}</span>
              </div>
              <div className="meta" style={{ marginBottom: ".65rem" }}>
                <span>Policy #16</span>
                <span>Policy #27 WHS</span>
                <span>APP-DRV-002</span>
                <span>{supplierPickupStandardsFlagRows.length} flagged</span>
                <span>{supplierPickupStandardsOpenQueueRows.length} in exception queue</span>
              </div>
              {supplierPickupStandardsFlagRows.length === 0 ? (
                <div style={{ fontSize: ".82rem", color: T.mu }}>No supplier has a local No Pickup rate above the CAP-MCL-001 evidence target, packaging refusal evidence, or Policy #27 WHS hazard stop.</div>
              ) : (
                <>
                  {supplierPickupStandardsFlagRows.map(row => (
                    <div key={`pickup-standards-${row.supplier.id}`} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".6rem", marginTop: ".6rem" }}>
                      <div className="card-head">
                        <div style={{ fontWeight: 800, fontSize: ".86rem" }}>{row.supplier.name}</div>
                        <span className={`badge ${supplierPickupStandardsBadgeClass(row)}`}>{row.openException ? "Queued" : "Flagged"}</span>
                      </div>
                      <div className="meta" style={{ marginTop: ".3rem" }}>
                        <span>{row.total} pickup record{row.total === 1 ? "" : "s"}</span>
                        <span>{row.noPickupCount} No Pickup</span>
                        <span>{row.noPickupRate.toFixed(0)}%</span>
                        <span>{row.packagingRefusalCount} packaging refusal{row.packagingRefusalCount === 1 ? "" : "s"}</span>
                        <span>{row.whsHazardCount || 0} WHS hazard{row.whsHazardCount === 1 ? "" : "s"}</span>
                      </div>
                      <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".3rem" }}>{row.reasons.join("; ")}</div>
                      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: ".55rem" }}>
                        <button className="btn b-acc b-sm" disabled={Boolean(row.openException)} onClick={() => queueSupplierPickupStandardsFlag(row)}>{row.openException ? "Already Queued" : "Send To Exception Queue"}</button>
                        <button className="btn b-ghost b-sm" onClick={() => editSupplier(row.supplier)}>Edit Supplier Record</button>
                      </div>
                    </div>
                  ))}
                  <button className="btn b-ghost b-sm" style={{ marginTop: ".8rem" }} disabled={supplierPickupStandardsFlagRows.every(row => row.openException)} onClick={queueAllSupplierPickupStandardsFlags}>Queue All Pickup Alerts</button>
                </>
              )}
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: ".7rem" }}>{editingSupplierId ? "Edit Supplier" : "Add Supplier"}</div>
              <div className="fr">
                <div className="f"><label>Name</label><input value={supplierDraft.name} onChange={e => setSupplierDraft(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="f"><label>Phone</label><input value={supplierDraft.phone} onChange={e => setSupplierDraft(p => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <div className="f"><label>Dock Address</label><input value={supplierDraft.address} onChange={e => setSupplierDraft(p => ({ ...p, address: e.target.value }))} /></div>
              <div className="fr">
                <div className="f"><label>Dock Contact Role</label><input value={supplierDraft.dockContactRole} onChange={e => setSupplierDraft(p => ({ ...p, dockContactRole: e.target.value }))} placeholder="e.g. Dispatch / dock contact" /></div>
                <div className="f"><label>Named Dock Contact</label><input value={supplierDraft.dockContactName} onChange={e => setSupplierDraft(p => ({ ...p, dockContactName: e.target.value }))} placeholder="Unresolved until Admin confirms" /></div>
              </div>
              <div className="f"><label>Pickup Window</label><input value={supplierDraft.pickupWindow} onChange={e => setSupplierDraft(p => ({ ...p, pickupWindow: e.target.value }))} /></div>
              <div className="fr">
                <div className="f"><label>Last Reviewed</label><input type="date" value={supplierDraft.lastReviewed || ""} onChange={e => setSupplierDraft(p => ({ ...p, lastReviewed: e.target.value }))} onInput={e => setSupplierDraft(p => ({ ...p, lastReviewed: e.target.value }))} /></div>
                <div className="f"><label>Review Interval Days</label><input type="number" min="1" value={supplierDraft.reviewIntervalDays || ""} onChange={e => setSupplierDraft(p => ({ ...p, reviewIntervalDays: e.target.value }))} placeholder="Set per supplier" /></div>
              </div>
              <div className="f"><label>Packaging Notes</label><textarea value={supplierDraft.packagingNotes} onChange={e => setSupplierDraft(p => ({ ...p, packagingNotes: e.target.value }))} placeholder="Supplier packaging or handover notes" /></div>
              <div style={{ fontSize: ".78rem", fontWeight: 800, color: T.mu, margin: ".8rem 0 .45rem" }}>POL-MCL-001-001 Approval Evidence</div>
              <div className="checks">
                <label><input type="checkbox" checked={Boolean(supplierDraft.dockAccessAgreed)} onChange={e => setSupplierDraft(p => ({ ...p, dockAccessAgreed: e.target.checked }))} /> Dock access agreed in writing</label>
                <label><input type="checkbox" checked={Boolean(supplierDraft.packagingStandardsAgreed)} onChange={e => setSupplierDraft(p => ({ ...p, packagingStandardsAgreed: e.target.checked }))} /> Packaging standards agreed in writing</label>
                <label><input type="checkbox" checked={Boolean(supplierDraft.pickupWindowAgreed)} onChange={e => setSupplierDraft(p => ({ ...p, pickupWindowAgreed: e.target.checked }))} /> Pickup window agreed in writing</label>
              </div>
              <div className="f"><label>Approval Evidence Reference</label><input value={supplierDraft.supplierApprovalEvidenceRef} onChange={e => setSupplierDraft(p => ({ ...p, supplierApprovalEvidenceRef: e.target.value }))} placeholder="Document, email, or approval record reference" /></div>
              <div className="f"><label>Change Reason</label><textarea value={supplierChangeReason} onChange={e => setSupplierChangeReason(e.target.value)} placeholder="Reason for supplier master data change" /></div>
              <button className="btn b-acc" onClick={saveSupplier}>{editingSupplierId ? "Save Supplier" : "Add Supplier"}</button>
              {editingSupplierId && <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={cancelSupplierEdit}>Cancel Edit</button>}
            </div>
            {supplierReviewHealthRows.map(row => {
              const v = row.supplier;
              const approvalGate = supplierApprovalGateState(v);
              return (
              <div className="card" key={v.id || v.name}>
                <div className="card-head">
                  <div className="card-title" style={{ marginBottom: ".4rem" }}>{v.name}</div>
                  <span className={`badge ${(v.status || "Active") === "Active" ? supplierReviewBadgeClass(row) : "b-cancelled"}`}>{(v.status || "Active") === "Active" ? (row.openException ? "Queued" : row.flagged ? "Review" : "Current") : (v.status || "Archived")}</span>
                </div>
                <div className="meta"><span>📍 {v.address}</span><span>📞 {v.phone || "No phone"}</span><span>{v.pickupWindow || "No pickup window"}</span><span>Reviewed {v.lastReviewed || "Not recorded"}</span><span>{row.reviewIntervalDays ? `${row.reviewIntervalDays} day interval` : "Interval not set"}</span></div>
                {row.dueDate && <div style={{ fontSize: ".78rem", color: row.flagged ? T.acc : T.mu, marginTop: ".25rem" }}>Review due: {fmtFullDate(row.dueDate)}</div>}
                {row.flagged && <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".25rem" }}>Review flags: {row.reasons.join("; ")}</div>}
                <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Dock contact role: {v.dockContactRole || "Not recorded"}</div>
                <div style={{ fontSize: ".78rem", color: v.dockContactName ? T.mu : T.acc, marginTop: ".25rem" }}>Named dock contact: {v.dockContactName || "Unresolved"}</div>
                <div style={{ fontSize: ".78rem", color: approvalGate.approved ? T.mu : T.red, marginTop: ".25rem" }}>Supplier Approval Gate: {approvalGate.approved ? (v.supplierApprovalEvidenceRef || "Evidence recorded") : approvalGate.reasons.join("; ")}</div>
                <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".25rem" }}>Packaging notes: {v.packagingNotes || "Not recorded"}</div>
                <div style={{ fontSize: ".78rem", color: supplierOpenWorkCount(v.name) ? T.acc : T.mu, marginTop: ".25rem" }}>Open work: {supplierOpenWorkCount(v.name)}</div>
                <hr className="dvd" />
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                  <button className="btn b-ghost b-sm" onClick={() => editSupplier(v)}>Edit</button>
                  <button className="btn b-ghost b-sm" onClick={() => openSupplierAction(v, "review")}>Mark Reviewed</button>
                  {row.flagged && <button className="btn b-acc b-sm" disabled={Boolean(row.openException)} onClick={() => queueSupplierReviewFlag(row)}>{row.openException ? "Queued" : "Queue Review"}</button>}
                  {(v.status || "Active") === "Active" ? (
                    <button className="btn b-red b-sm" disabled={supplierOpenWorkCount(v.name) > 0} onClick={() => openSupplierAction(v, "archive")}>Archive</button>
                  ) : (
                    <button className="btn b-teal b-sm" onClick={() => openSupplierAction(v, "reactivate")}>Reactivate</button>
                  )}
                </div>
              </div>
              );
            })}
          </>
        )}

        {view === "pricing" && (
          <>
            <div className="sh"><h2>Pricing Rules</h2></div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{activePriceRules(priceRules).length}</div><div className="stat-lbl">Active Rules</div></div>
              <div className="stat"><div className="stat-num" style={{ color: pricingReviewFlagRows.length ? T.acc : T.tx }}>{pricingReviewFlagRows.length}</div><div className="stat-lbl">Review Flags</div></div>
              <div className="stat"><div className="stat-num" style={{ color: pricingReviewOpenQueueRows.length ? T.red : T.tx }}>{pricingReviewOpenQueueRows.length}</div><div className="stat-lbl">Open Queue Items</div></div>
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Pricing Governance Monitor</div>
                <span className={`badge ${pricingReviewFlagRows.length ? "b-pending" : "b-done"}`}>{pricingReviewFlagRows.length ? "Action Required" : "Current"}</span>
              </div>
              <div className="meta" style={{ marginBottom: ".65rem" }}>
                <span>Policy #9</span>
                <span>SOP-MDM-02</span>
                <span>{pricingReviewFlagRows.length} flagged</span>
                <span>{pricingReviewOpenQueueRows.length} in exception queue</span>
              </div>
              {pricingReviewFlagRows.length === 0 ? (
                <div style={{ fontSize: ".82rem", color: T.mu }}>All local pricing rules have required structured fields plus source/change-log and Owner approval references.</div>
              ) : (
                <>
                  {pricingReviewFlagRows.map(row => (
                    <div key={row.rule.id} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".6rem", marginTop: ".6rem" }}>
                      <div className="card-head">
                        <div style={{ fontWeight: 800, fontSize: ".86rem" }}>{row.rule.label || row.rule.id}</div>
                        <span className={`badge ${priceRuleReviewBadgeClass(row)}`}>{row.openException ? "Queued" : "Flagged"}</span>
                      </div>
                      <div className="meta" style={{ marginTop: ".3rem" }}>
                        <span>{row.rule.serviceVariant || "No service variant"}</span>
                        <span>{row.rule.itemType || "No item type"}</span>
                        <span>{priceRuleBand(row.rule)}</span>
                        <span>{row.rule.changeLogId || row.rule.sourceRef || "No change log"}</span>
                      </div>
                      <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".3rem" }}>{row.reasons.join("; ")}</div>
                      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: ".55rem" }}>
                        <button className="btn b-acc b-sm" disabled={Boolean(row.openException)} onClick={() => queuePricingReviewFlag(row)}>{row.openException ? "Already Queued" : "Send To Exception Queue"}</button>
                        <button className="btn b-ghost b-sm" onClick={() => editPriceRule(row.rule)}>Edit Rule</button>
                      </div>
                    </div>
                  ))}
                  <button className="btn b-ghost b-sm" style={{ marginTop: ".8rem" }} disabled={pricingReviewFlagRows.every(row => row.openException)} onClick={queueAllPricingReviewFlags}>Queue All Current Flags</button>
                </>
              )}
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: ".7rem" }}>{editingPriceRuleId ? "Edit Pricing Rule" : "Add Pricing Rule"}</div>
              <div className="fr">
                <div className="f"><label>Rule Label</label><input value={priceDraft.label} onChange={e => setPriceDraft(p => ({ ...p, label: e.target.value }))} placeholder="e.g. 4 or more tyres" /></div>
                <div className="f"><label>Service Variant</label>
                  <select value={priceDraft.serviceVariant} onChange={e => setPriceDraft(p => ({ ...p, serviceVariant: e.target.value }))}>
                    <option value="SVC-MCL-001-T">Tyre Delivery</option>
                    <option value="SVC-MCL-001-P">Parts Delivery</option>
                    <option value="REDELIVERY">Redelivery</option>
                  </select>
                </div>
              </div>
              <div className="fr">
                <div className="f"><label>Item Type</label>
                  <select value={priceDraft.itemType} onChange={e => setPriceDraft(p => ({ ...p, itemType: e.target.value, serviceVariant: e.target.value === "parts" ? "SVC-MCL-001-P" : e.target.value === "redelivery" ? "REDELIVERY" : "SVC-MCL-001-T" }))}>
                    <option value="tyre">Tyre</option>
                    <option value="parts">Parts</option>
                    <option value="redelivery">Redelivery</option>
                  </select>
                </div>
                <div className="f"><label>Rate Mode</label>
                  <select value={priceDraft.rateMode} onChange={e => setPriceDraft(p => ({ ...p, rateMode: e.target.value }))}>
                    <option value="flat">Flat tier</option>
                    <option value="per_item">Per item</option>
                  </select>
                </div>
              </div>
              <div className="fr">
                <div className="f"><label>Tyre Count Min</label><input type="number" min="1" value={priceDraft.tyreCountMin} onChange={e => setPriceDraft(p => ({ ...p, tyreCountMin: e.target.value }))} /></div>
                <div className="f"><label>Tyre Count Max</label><input type="number" min="1" value={priceDraft.tyreCountMax} onChange={e => setPriceDraft(p => ({ ...p, tyreCountMax: e.target.value }))} placeholder="Blank for no maximum" /></div>
              </div>
              <div className="f"><label>Weight Band</label>
                <select value={priceDraft.weightBand} onChange={e => setPriceDraft(p => ({ ...p, weightBand: e.target.value }))}>
                  <option value="">Not applicable</option>
                  <option value="lt_5kg">Less than 5 kg</option>
                  <option value="5_to_15kg">5 kg to 15 kg</option>
                  <option value="gt_15kg">More than 15 kg</option>
                </select>
              </div>
              <div className="fr">
                <div className="f"><label>Rate AUD ex GST</label><input type="number" min="0" step="0.01" value={priceDraft.rateDollars} onChange={e => setPriceDraft(p => ({ ...p, rateDollars: e.target.value }))} /></div>
                <div className="f"><label>Effective From</label><input type="date" value={priceDraft.effectiveFrom} onChange={e => setPriceDraft(p => ({ ...p, effectiveFrom: e.target.value }))} /></div>
              </div>
              <div className="fr">
                <div className="f"><label>Effective To</label><input type="date" value={priceDraft.effectiveTo} onChange={e => setPriceDraft(p => ({ ...p, effectiveTo: e.target.value }))} /></div>
                <div className="f"><label>Status</label>
                  <select value={priceDraft.status} onChange={e => setPriceDraft(p => ({ ...p, status: e.target.value }))}>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="f"><label>Change Reason</label><textarea value={priceChangeReason} onChange={e => setPriceChangeReason(e.target.value)} placeholder="Written reason for pricing change" /></div>
              <div className="f"><label>Owner Approval Reference</label><input value={priceOwnerApproval} onChange={e => setPriceOwnerApproval(e.target.value)} placeholder="Owner approval reference or written approval location" /></div>
              <button className="btn b-acc" onClick={savePriceRule}>{editingPriceRuleId ? "Save Pricing Rule" : "Add Pricing Rule"}</button>
              {editingPriceRuleId && <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={cancelPriceEdit}>Cancel Edit</button>}
              <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".6rem" }}>Local price changes require Admin action, written reason, and Owner approval reference before taking effect. Production dual-control execution remains an open deployment decision from SOP-MDM-02.</div>
            </div>
            {priceRules.map(rule => (
              <div className="card" key={rule.id}>
                <div className="card-head"><div className="card-title">{rule.label}</div><span className={`badge ${(rule.status || "Active") === "Active" ? "b-done" : "b-cancelled"}`}>{rule.status || "Active"}</span></div>
                <div className="meta">
                  <span>{rule.serviceVariant || "Legacy price rule"}</span>
                  <span>{rule.itemType || "Not classified"}</span>
                  <span>{priceRuleBand(rule)}</span>
                  <span>${priceRuleDollars(rule).toFixed(2)}{priceRuleIsPerItem(rule) ? " each" : ""}</span>
                  <span>{priceRuleIsPerItem(rule) ? "Per item" : "Flat tier"}</span>
                  <span>From {rule.effectiveFrom ? fmt(rule.effectiveFrom) : "Not set"}</span>
                </div>
                <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Change log: {rule.changeLogId || "Not recorded locally"}</div>
                <hr className="dvd" />
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                  <button className="btn b-ghost b-sm" onClick={() => editPriceRule(rule)}>Edit</button>
                  <button className={`btn ${rule.status === "Archived" ? "b-teal" : "b-red"} b-sm`} onClick={() => openPriceAction(rule)}>{rule.status === "Archived" ? "Reactivate" : "Archive"}</button>
                </div>
              </div>
            ))}
          </>
        )}

        {view === "billing" && (
          <>
            <div className="sh"><h2>Billing Review</h2></div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Delivered Work And Approved Fees</div>
                <span className="badge b-pending">{billableOrders.length + billableRedeliveryFees.length} lines</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Local billing review groups SOP-DEL-05 billing-ready delivered jobs and Admin-approved Policy #8 redelivery fees by customer account and billing contact. Production PDF/email dispatch, bounce handling, and EFT reconciliation remain external blockers.
                {unmatchedBillingRows.length > 0 && <><br />{unmatchedBillingRows.length} billing candidate(s) are excluded until SOP-EXC-03 account matching is resolved.</>}
              </div>
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Policy #24 Month-End Financial Controls</div>
                <span className={`badge ${financialReconciliationOpenRows.length ? "b-cancelled" : "b-done"}`}>{financialReconciliationOpenRows.length ? `${financialReconciliationOpenRows.length} Open` : "Current"}</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".75rem" }}>
                Admin reconciles APP-ADM-004 invoice records against payment evidence within 5 business days of month end. No off-system invoices are permitted. External accountant engagement and Otimi Rules reporting cadence remain open gaps and are not claimed as configured.
              </div>
              {financialReconciliationReviewRows.length === 0 && <div className="empty">No invoice periods available for reconciliation yet.</div>}
              {financialReconciliationReviewRows.map(row => (
                <div key={`financial-reconciliation-${row.period}`} style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".65rem", marginTop: ".65rem" }}>
                  <div className="card-head">
                    <div style={{ fontWeight: 800, fontSize: ".88rem" }}>{row.period} Revenue Control</div>
                    <span className={`badge ${row.status === "Completed" ? "b-done" : row.status === "Overdue" ? "b-cancelled" : "b-pending"}`}>{row.status}</span>
                  </div>
                  <div className="meta">
                    <span>Month end {fmtFullDate(row.monthEndDate)}</span>
                    <span>Due {fmtFullDate(row.dueDate)}</span>
                    <span>{row.invoiceCount} invoice(s)</span>
                    <span>Subtotal ${row.subtotal.toFixed(2)}</span>
                    <span>GST ${row.gst.toFixed(2)}</span>
                    <span>Total ${row.total.toFixed(2)}</span>
                    <span>Paid ${row.paidTotal.toFixed(2)}</span>
                    <span>Unpaid ${row.unpaidTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: ".78rem", color: row.status === "Completed" ? T.mu : T.acc, marginTop: ".35rem" }}>
                    {row.record?.completedAt
                      ? `Completed ${fmtFullDate(isoDate(row.record.completedAt))}; retain until ${fmtFullDate(row.record.retentionUntil || financialReconciliationRetentionUntil(row.record))}. ${row.record.externalAccountantName ? `Accountant: ${row.record.externalAccountantName}.` : "External accountant not named."}`
                      : row.reasons.join("; ")}
                  </div>
                  {row.record?.note && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Note: {row.record.note}</div>}
                  <button className="btn b-acc b-sm" style={{ marginTop: ".65rem" }} onClick={() => openFinancialReconciliation(row)}>
                    {row.record?.completedAt ? "Update Reconciliation Evidence" : "Record Reconciliation Evidence"}
                  </button>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Unmatched Billing Account Queue</div>
                <span className={`badge ${unmatchedBillingRows.length ? "b-cancelled" : "b-done"}`}>{unmatchedBillingRows.length} blocked</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".75rem" }}>
                SOP-EXC-03 excludes delivered billing candidates from invoice groups when account_id is missing, inactive, unknown, or ambiguous. Admin must investigate POD proof and pickup capture before correcting the billing account.
              </div>
              {unmatchedBillingRows.length === 0 && <div className="empty">No delivered billing candidates are blocked by account matching.</div>}
              {unmatchedBillingRows.length > 0 && (
                <button
                  className="btn b-acc b-sm"
                  style={{ marginBottom: ".75rem" }}
                  disabled={unmatchedBillingRows.every(row => row.openException)}
                  onClick={queueAllUnmatchedBilling}
                >
                  Queue All Current Flags
                </button>
              )}
              {unmatchedBillingRows.map(row => {
                const order = row.order;
                const candidateNames = (row.match?.candidates || []).slice(0, 3).map(client => client.name).join(", ");
                return (
                  <div key={`unmatched-billing-${order.id}`} style={{ borderTop: `1px solid ${T.line}`, paddingTop: ".65rem", marginTop: ".65rem" }}>
                    <div className="card-head">
                      <div className="card-title">{order.id}</div>
                      <span className={`badge ${row.openException ? "b-pending" : "b-cancelled"}`}>{row.openException ? "Exception Queued" : "Blocked From Billing"}</span>
                    </div>
                    <div className="meta">
                      <span>{order.clientName || "No account"}</span>
                      <span>{order.vendor || "Supplier not recorded"}</span>
                      <span>Con note {order.conNote || "not recorded"}</span>
                      <span>Run {fmtFullDate(order.actualRunDate || order.date)}</span>
                      <span>{order.proofId ? `Proof ${order.proofId}` : "Proof not linked"}</span>
                    </div>
                    <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".4rem" }}>
                      Reason: {row.match?.reasons?.join("; ") || row.match?.reason || "Account match failed"}.
                    </div>
                    <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".25rem" }}>
                      Delivery address: {order.dropAddress || "not recorded"}. Candidate accounts: {candidateNames || "none from current CRM"}.
                    </div>
                    <div style={{ display: "flex", gap: ".55rem", flexWrap: "wrap", marginTop: ".65rem" }}>
                      <button className="btn b-ghost b-sm" disabled={Boolean(row.openException)} onClick={() => queueUnmatchedBilling(row)}>{row.openException ? "Already Queued" : "Send To Exception Queue"}</button>
                      <button className="btn b-acc b-sm" onClick={() => openAccountMatch(row)}>Correct Account Match</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Day 8 Overdue Notice Queue</div>
                <span className="badge b-pending">{overdueNoticeQueue.length} invoices</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".75rem" }}>
                Due Day 8 overdue notices are generated as local evidence records by the system scan. This queue remains as Admin fallback visibility until the production notification channel is confirmed.
              </div>
              {overdueNoticeQueue.length === 0 && <div className="empty">No overdue invoices awaiting a Day 8 notice.</div>}
              {overdueNoticeQueue.map(invoice => {
                const noticeDue = day8NoticeDueDate(invoice);
                const ready = canRecordDay8Notice(invoice);
                const client = clients.find(c => c.id === invoice.clientId);
                return (
                  <div key={invoice.id} style={{ borderTop: `1px solid ${T.line}`, paddingTop: ".65rem", marginTop: ".65rem" }}>
                    <div className="meta">
                      <span>{invoice.id}</span>
                      <span>{invoice.clientName}</span>
                      <span>Due {fmtFullDate(invoice.dueDate)}</span>
                      <span>Notice due {fmtFullDate(noticeDue)}</span>
                      <span>{ready ? "Ready" : "Waiting for Day 8"}</span>
                    </div>
                    <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>
                      Billing: {invoice.billingEmail}; Operational: {client?.operationalContact?.email || client?.email || "not recorded"}
                    </div>
                    <button className="btn b-acc b-sm" style={{ marginTop: ".6rem" }} disabled={!ready} onClick={() => onRecordBillingNotice(invoice)}>
                      {ready ? "Record Day 8 Notice" : `Available ${fmtFullDate(noticeDue)}`}
                    </button>
                  </div>
                );
              })}
            </div>
            {billableGroups.length === 0 && <div className="empty">No delivered unbilled jobs or approved redelivery fees.</div>}
            {billableGroups.map(group => {
              const billingItems = billingItemsForGroup(group);
              const totals = invoiceTotal(billingItems);
              return (
                <div className="card" key={group.client.id}>
                  <div className="card-head">
                    <div className="card-title">{group.client.name}</div>
                    <span className="badge b-pending">{billingItems.length} lines</span>
                  </div>
                  <div className="meta"><span>Billing: {group.client.billingContact?.email || group.client.email}</span><span>Subtotal ${totals.subtotal}</span><span>GST ${totals.gst}</span><span>Total ${totals.total}</span></div>
                  <hr className="dvd" />
                  {group.orders.map(order => (
                    <div key={order.id} className="meta"><span>{order.id}</span><span>{order.vendor}</span><span>{order.itemType || "Item type recorded by driver"}</span><span>${order.price}</span><span>{order.billingReady ? "SOP-DEL-05 billing-ready" : order.proofId ? "Proof captured" : "Proof missing"}</span></div>
                  ))}
                  {group.redeliveryFees.map(order => (
                    <div key={`redelivery-${order.id}`} className="meta"><span>{order.id}</span><span>{order.vendor}</span><span>Policy #8 redelivery fee</span><span>${Number(order.redeliveryFeeAmount || policy8RedeliveryFeeAmount(priceRules)).toFixed(2)}</span><span>Admin reviewed</span></div>
                  ))}
                  <button className="btn b-acc" style={{ marginTop: ".8rem" }} onClick={() => onCreateInvoice(group.client, group.orders, group.redeliveryFees)}>Create Draft Invoice</button>
                </div>
              );
            })}
            <h2 style={{ margin: "1.2rem 0 .8rem" }}>Invoice Batches</h2>
            {invoices.length === 0 && <div className="empty">No invoice batches created locally.</div>}
            {invoices.slice().reverse().map(invoice => {
              const notice = day8NoticeForInvoice(invoice.id);
              const noticeDue = day8NoticeDueDate(invoice);
              const noticeReady = canRecordDay8Notice(invoice);
              const approved = invoiceIsApproved(invoice);
              const canDispatch = invoice.status !== "Paid" && !invoice.dispatchRecordedAt;
              const canMarkOverdue = invoice.status !== "Paid" && invoice.status !== "Overdue" && Boolean(invoice.dispatchRecordedAt);
              return (
              <div className="card" key={invoice.id}>
                <div className="card-head">
                  <div className="card-title">{invoice.id} — {invoice.clientName}</div>
                  <span className={`badge ${invoice.status === "Paid" ? "b-done" : invoice.status === "Overdue" ? "b-cancelled" : "b-pending"}`}>{invoice.status}</span>
                </div>
                <div className="meta"><span>{invoice.billingEmail}</span><span>Due {fmt(invoice.dueDate)}</span><span>{invoice.lines.length} lines</span><span>Total ${invoice.total}</span></div>
                <div style={{ fontSize: ".78rem", color: approved ? T.mu : T.acc, marginTop: ".45rem" }}>
                  {approved
                    ? `Rendered invoice approved ${fmtFullDate(isoDate(invoice.invoiceApprovedAt))}; source ${invoice.invoiceApprovalSource || "SOP-BIL-04"}.`
                    : "Rendered invoice approval required before dispatch under SOP-BIL-04."}
                </div>
                {notice && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Day 8 overdue notice recorded {fmtFullDate(isoDate(notice.recordedAt))}; source {billingNoticeSourceLabel(notice).toLowerCase()}; channel {notice.deliveryChannel === "local_record_only" ? "local record only" : notice.deliveryChannel}.
                  </div>
                )}
                {invoice.status === "Overdue" && !notice && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Day 8 notice due {fmtFullDate(noticeDue)} before non-payment suspension.
                  </div>
                )}
                {invoice.status === "Paid" && invoice.paymentEvidence && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Payment evidence recorded {fmtFullDate(isoDate(invoice.paymentRecordedAt || invoice.paidAt))}: {invoice.paymentEvidence}
                  </div>
                )}
                {invoice.dispatchRecordedAt && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Dispatch recorded {fmtFullDate(isoDate(invoice.dispatchRecordedAt))}: {invoice.dispatchChannel === "local_record_only" ? "local record only" : invoice.dispatchChannel}; recipient {invoice.dispatchRecipient || invoice.billingEmail}; external status {invoice.dispatchExternalStatus || "not recorded"}.
                  </div>
                )}
                {invoice.policy18LastOutcome && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Policy #18 billing dispute outcome recorded {fmtFullDate(isoDate(invoice.policy18LastOutcomeAt))}: {invoice.policy18LastOutcome}.
                    {policy18RemedyLine(invoice) && <><br />{policy18RemedyLine(invoice)}</>}
                  </div>
                )}
                <hr className="dvd" />
                {invoice.lines.map(line => (
                  <div key={line.orderId} className="meta"><span>{line.orderId}</span><span>{line.vendor}</span><span>{line.description}</span><span>${line.amount}</span></div>
                ))}
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".8rem" }}>
                  <button className="btn b-acc b-sm" onClick={() => setInvoicePreview(invoice)}>Preview Invoice</button>
                  {invoice.status !== "Paid" && (!approved || canDispatch) && <button className="btn b-teal b-sm" onClick={() => openInvoiceApproval(invoice)}>Confirm Invoice Correct</button>}
                  {invoice.status !== "Paid" && <button className="btn b-acc b-sm" disabled={!invoice.dispatchRecordedAt} onClick={() => openPayment(invoice)}>{invoice.dispatchRecordedAt ? "Record Payment Evidence" : "Dispatch Required"}</button>}
                  {invoice.status !== "Paid" && invoice.status !== "Overdue" && <button className="btn b-red b-sm" disabled={!canMarkOverdue} onClick={() => onUpdateInvoice({ ...invoice, status: "Overdue", overdueAt: isoNow() })}>{canMarkOverdue ? "Mark Overdue" : "Dispatch Required"}</button>}
                  {invoice.status === "Overdue" && !notice && <button className="btn b-acc b-sm" disabled={!noticeReady} onClick={() => onRecordBillingNotice(invoice)}>{noticeReady ? "Record Day 8 Notice" : "Notice Not Due"}</button>}
                  {invoice.status === "Overdue" && <button className="btn b-red b-sm" disabled={!notice} onClick={() => {
                    const client = clients.find(c => c.id === invoice.clientId);
                    if (client) openSuspension(client, invoice);
                  }}>{notice ? "Suspend Account" : "Notice Required"}</button>}
                </div>
              </div>
              );
            })}
          </>
        )}

        {view === "exceptions" && (
          <>
            {renderDailyExceptionAlert()}
            <h2 style={{ marginBottom: "1rem" }}>Exception Queue</h2>
            {exceptions.length === 0 && <div className="empty">No exceptions recorded.</div>}
            {exceptions.map(e => {
              const linkedInvoice = invoiceForException(e);
              const linkedOrders = ordersForException(e);
              const linkedProofs = proofsForException(e);
              const linkedSupplier = supplierForException(e);
              const linkedSupplierPickupRow = linkedSupplier && ["Supplier Pickup Standards Review", "WHS Hazard"].includes(e.type) ? supplierPickupStandardsRows([linkedSupplier], orders, exceptions)[0] : null;
              const linkedPriceRule = priceRuleForException(e);
              const policy18Dispute = isPolicy18Dispute(e);
              const cancellationOrder = e.type === "Cancellation Request" ? linkedOrders[0] : null;
              const canAcceptCancellation = cancellationOrder && cancellationOrder.status !== "Cancelled" && !orderGoodsCollected(cancellationOrder);
              const failedDeliveryOrder = e.type === "Failed Delivery" ? linkedOrders[0] : null;
              const failedAttemptCount = failedDeliveryAttemptCount(failedDeliveryOrder);
              const exceptionAttemptMatch = String(e.note || "").match(/Attempt\s+(\d+)\s+of\s+2/i);
              const exceptionAttemptCount = failedDeliveryOrder ? Number(e.failedDeliveryAttemptNumber || exceptionAttemptMatch?.[1] || failedAttemptCount) : 0;
              const exceptionReturnStatus = exceptionAttemptCount >= 2
                ? (failedDeliveryOrder?.returnToSupplierStatus || "Return to originating supplier on next scheduled milk run")
                : "Goods retained with driver after first failed attempt";
              const exceptionFeeStatus = exceptionAttemptCount >= 2 ? (failedDeliveryOrder?.redeliveryFeeStatus || "Pending Admin Review") : "Not Applicable";
              const exceptionFeeAmount = exceptionAttemptCount >= 2 ? Number(failedDeliveryOrder?.redeliveryFeeAmount || policy8RedeliveryFeeAmount(priceRules)) : 0;
              const canAuthoriseSecondAttempt = failedDeliveryOrder && exceptionAttemptCount === 1 && failedDeliveryOrder.status === "Failed Delivery";
              const canReviewRedeliveryFee = failedDeliveryOrder && exceptionAttemptCount >= 2 && failedDeliveryOrder.redeliveryFeeStatus === "Pending Admin Review";
              return (
              <div className="card" key={e.id}>
                <div className="card-head"><div className="card-title">{e.type} — {e.orderId}</div><span className={`badge ${e.status === "Closed" ? "b-done" : "b-cancelled"}`}>{e.status}</span></div>
                <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".4rem" }}>{e.note}</div>
                <div className="meta"><span>Owner: {e.owner}</span><span>{new Date(e.createdAt).toLocaleString("en-AU")}</span><span>{linkedSupplier ? `${linkedSupplier.name} supplier record` : linkedPriceRule ? `${linkedPriceRule.label} price rule` : linkedProofs.length ? `${linkedProofs.length} proof record(s)` : "No proof record linked"}</span></div>
                {linkedSupplier && e.type === "Supplier Master Data Review" && <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>SOP-MDM-01 / CAP-MCL-001 review: {supplierReviewReasons(linkedSupplier).join("; ") || "No current supplier review flags"}</div>}
                {linkedSupplierPickupRow && <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>Policy #15 / Policy #16 / Policy #27 review: {linkedSupplierPickupRow.reasons.join("; ") || "No current pickup standards flags"}</div>}
                {e.type === "WHS Hazard" && <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>Policy #27: Admin must raise the hazard with the supplier and must not require driver return while the hazard remains unresolved.</div>}
                {linkedPriceRule && <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>Policy #9 / SOP-MDM-02 review: {priceRuleReviewReasons(linkedPriceRule).join("; ") || "No current pricing review flags"}</div>}
                {linkedInvoice && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>Invoice {linkedInvoice.id}: {linkedInvoice.status}, total ${Number(linkedInvoice.total || 0).toFixed(2)}, {linkedInvoice.lines.length} line(s)</div>}
                {policy18Dispute && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Policy #18: {e.disputeReasonLabel || policy18ReasonLabel(e.disputeReason)}; delivery date {e.disputedDeliveryDate || "not recorded"}; {e.policy18TimingLabel || "invoice timing not recorded"}. {policy18StatusLine(e)}. Owner escalation: {e.ownerEscalationStatus || "Not Requested"}.
                  </div>
                )}
                {linkedOrders.length > 0 && <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>Linked work: {linkedOrders.map(order => `${order.id} ${order.status}${order.recvName ? `, received by ${order.recvName}` : ""}`).join("; ")}</div>}
                {failedDeliveryOrder && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>
                    Policy #8: attempt {exceptionAttemptCount} of 2; {exceptionReturnStatus}; redelivery fee {exceptionFeeStatus}{exceptionFeeAmount ? ` ($${exceptionFeeAmount.toFixed(2)})` : ""}.
                  </div>
                )}
                {e.investigation && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Investigation: {e.investigation.outcome}; {e.investigation.note}
                    {e.investigation.policy18RemedyRequired && (
                      <><br />{e.investigation.policy18RemedyLabel || "Policy #18 remedy required"} - {e.investigation.policy18RemedyStatus || "Required"}{e.investigation.policy18RemedyDueDate ? `, due ${fmtFullDate(e.investigation.policy18RemedyDueDate)}` : ""}. {e.investigation.policy18RemedyNote || ""}</>
                    )}
                  </div>
                )}
                {e.status !== "Closed" && (
                  <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".7rem" }}>
                    {canAcceptCancellation && (
                      <button className="btn b-red b-sm" onClick={() => {
                        cancelAdminOrder(cancellationOrder);
                        onAcknowledgeException(e.id, {
                          outcome: "Cancellation accepted",
                          note: "Policy #14 Admin judgement before goods collected; no billable record.",
                          policy: "Policy #14 / APP-ADM-001",
                          evidence: "Cancellation request",
                          linkedOrderIds: [cancellationOrder.id],
                        });
                      }}>Accept Cancellation</button>
                    )}
                    {canAuthoriseSecondAttempt && (
                      <button className="btn b-acc b-sm" onClick={() => authoriseSecondFailedDeliveryAttempt(failedDeliveryOrder, e)}>Schedule Second Attempt</button>
                    )}
                    {canReviewRedeliveryFee && (
                      <>
                        <button className="btn b-acc b-sm" onClick={() => openRedeliveryFeeReview(e, failedDeliveryOrder, "approve")}>Approve $10 Fee</button>
                        <button className="btn b-ghost b-sm" onClick={() => openRedeliveryFeeReview(e, failedDeliveryOrder, "waive")}>Waive Fee</button>
                      </>
                    )}
                    {policy18Dispute && !e.acknowledgedAt && (
                      <button className="btn b-acc b-sm" onClick={() => acknowledgePolicy18Dispute(e)}>Record Acknowledgement</button>
                    )}
                    {policy18Dispute && e.ownerEscalationStatus !== "Requested" && (
                      <button className="btn b-ghost b-sm" onClick={() => escalatePolicy18Dispute(e)}>Escalate To Owner</button>
                    )}
                    <button className="btn b-teal b-sm" onClick={() => openInvestigation(e)}>Investigate / Close</button>
                  </div>
                )}
              </div>
              );
            })}
          </>
        )}

        {view === "ndb" && (
          <>
            <div className="sh"><h2>Policy #6 / POL-OPS-006 NDB Response Register</h2></div>
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Suspected Data Breach Intake</div>
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".25rem" }}>
                    Admin records suspected incidents, containment action, preserved APP-PRV-004 audit evidence, and the 30-day assessment deadline. The Privacy Owner (ACT-TECH-002) must be named before any eligible-breach decision can operate.
                  </div>
                </div>
                <span className="badge b-pending">Draft policy blocker</span>
              </div>
              <div className="fr">
                <div className="f"><label>Incident Title *</label><input value={dataBreachDraft.title} onChange={e => setDataBreachDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="Suspected unauthorised access" /></div>
                <div className="f"><label>Awareness Date *</label><input type="date" value={dataBreachDraft.awarenessDate} onChange={e => setDataBreachDraft(prev => ({ ...prev, awarenessDate: e.target.value, assessmentDueDate: policy6AssessmentDueDate(e.target.value) }))} /></div>
              </div>
              <div className="fr">
                <div className="f"><label>Reported By</label><input value={dataBreachDraft.reportedBy} onChange={e => setDataBreachDraft(prev => ({ ...prev, reportedBy: e.target.value }))} placeholder="Admin / Driver / Digiverse / Client" /></div>
                <div className="f"><label>Status</label><select value={dataBreachDraft.status} onChange={e => setDataBreachDraft(prev => ({ ...prev, status: e.target.value }))}>{POLICY6_NDB_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}</select></div>
              </div>
              <div className="f"><label>What Happened *</label><textarea value={dataBreachDraft.description} onChange={e => setDataBreachDraft(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe the suspected unauthorised access, disclosure, or loss." /></div>
              <div className="f"><label>Personal Information Involved *</label><textarea value={dataBreachDraft.personalInformationInvolved} onChange={e => setDataBreachDraft(prev => ({ ...prev, personalInformationInvolved: e.target.value }))} placeholder="Contact details, delivery addresses, POD evidence, billing records..." /></div>
              <div className="fr">
                <div className="f"><label>Affected Individual Estimate</label><input value={dataBreachDraft.affectedIndividualEstimate} onChange={e => setDataBreachDraft(prev => ({ ...prev, affectedIndividualEstimate: e.target.value }))} placeholder="Unknown / 3 clients / 12 receivers" /></div>
                <div className="f"><label>Containment Status</label><input value={dataBreachDraft.containmentStatus} onChange={e => setDataBreachDraft(prev => ({ ...prev, containmentStatus: e.target.value }))} placeholder="Contained / Access revoked / In progress" /></div>
              </div>
              <div className="f"><label>Containment Actions *</label><textarea value={dataBreachDraft.containmentActions} onChange={e => setDataBreachDraft(prev => ({ ...prev, containmentActions: e.target.value }))} placeholder="Access revoked, system isolated, disclosure blocked, Digiverse engaged..." /></div>
              <div className="f"><label>APP-PRV-004 Audit Refs Preserved *</label><textarea value={dataBreachDraft.appPrv004AuditRefs} onChange={e => setDataBreachDraft(prev => ({ ...prev, appPrv004AuditRefs: e.target.value }))} placeholder="Audit event IDs, hash-chain review, access events. No audit log records may be deleted or altered." /></div>
              <div className="fr">
                <div className="f"><label>System Access Log Refs</label><textarea value={dataBreachDraft.systemAccessLogRefs} onChange={e => setDataBreachDraft(prev => ({ ...prev, systemAccessLogRefs: e.target.value }))} /></div>
                <div className="f"><label>Digiverse Evidence Refs</label><textarea value={dataBreachDraft.digiverseEvidenceRefs} onChange={e => setDataBreachDraft(prev => ({ ...prev, digiverseEvidenceRefs: e.target.value }))} /></div>
              </div>
              <div className="fr">
                <div className="f"><label>Privacy Owner Name</label><input value={dataBreachDraft.privacyOwnerName} onChange={e => setDataBreachDraft(prev => ({ ...prev, privacyOwnerName: e.target.value, eligibilityDecision: e.target.value.trim() ? "Awaiting Privacy Owner Assessment" : "Blocked - Privacy Owner Unnamed" }))} placeholder="Open gap - ACT-TECH-002 unnamed" /></div>
                <div className="f"><label>Eligibility Decision</label><select value={dataBreachDraft.eligibilityDecision} onChange={e => setDataBreachDraft(prev => ({ ...prev, eligibilityDecision: e.target.value }))}>{POLICY6_ELIGIBILITY_DECISIONS.map(status => <option key={status} value={status}>{status}</option>)}</select></div>
              </div>
              <div className="f"><label>Privacy Owner Notification / Blocker Evidence</label><textarea value={dataBreachDraft.privacyOwnerNotificationEvidence} onChange={e => setDataBreachDraft(prev => ({ ...prev, privacyOwnerNotificationEvidence: e.target.value }))} placeholder="Record notification evidence once named; until then, keep the Privacy Owner unnamed blocker visible." /></div>
              <div className="f"><label>Privacy Owner Decision Note</label><textarea value={dataBreachDraft.privacyOwnerDecisionNote} onChange={e => setDataBreachDraft(prev => ({ ...prev, privacyOwnerDecisionNote: e.target.value }))} placeholder="Only the named Privacy Owner can supply the eligible/not eligible decision evidence." /></div>
              <div className="fr">
                <div className="f"><label>OAIC Notification Evidence</label><textarea value={dataBreachDraft.oaicNotificationEvidence} onChange={e => setDataBreachDraft(prev => ({ ...prev, oaicNotificationEvidence: e.target.value }))} /></div>
                <div className="f"><label>Affected Individuals Evidence</label><textarea value={dataBreachDraft.affectedIndividualsNotificationEvidence} onChange={e => setDataBreachDraft(prev => ({ ...prev, affectedIndividualsNotificationEvidence: e.target.value }))} /></div>
              </div>
              <div className="fr">
                <div className="f"><label>Public Statement URL</label><input value={dataBreachDraft.publicStatementUrl} onChange={e => setDataBreachDraft(prev => ({ ...prev, publicStatementUrl: e.target.value }))} placeholder="Open item if direct notification is not practicable" /></div>
                <div className="f"><label>Post-Breach Review Report Ref</label><input value={dataBreachDraft.postBreachReviewReportRef} onChange={e => setDataBreachDraft(prev => ({ ...prev, postBreachReviewReportRef: e.target.value, postBreachReviewCompletedAt: e.target.value.trim() ? (prev.postBreachReviewCompletedAt || isoNow()) : "" }))} placeholder="Report retained for 7 years" /></div>
              </div>
              <div className="meta" style={{ marginBottom: ".8rem" }}>
                <span>Assessment due {fmtFullDate(policy6AssessmentDueDate(dataBreachDraft.awarenessDate || todayBrisbane()))}</span>
                <span>{POLICY6_PRIVACY_OWNER_BLOCKER}</span>
                <span>{POLICY6_NDB_SOURCE}</span>
              </div>
              <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                <button className="btn b-acc b-sm" onClick={saveDataBreachDraft}>{editingDataBreachId ? "Update Incident" : "Record Incident"}</button>
                <button className="btn b-ghost b-sm" onClick={resetDataBreachDraft}>Clear Form</button>
                <button className="btn b-ghost b-sm" onClick={() => blockPolicy6EligibilityDecision(dataBreachDraft)}>Eligibility Decision Blocked</button>
              </div>
            </div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: openDataBreachRows.length ? T.red : T.tx }}>{openDataBreachRows.length}</div><div className="stat-lbl">Open Incidents</div></div>
              <div className="stat"><div className="stat-num" style={{ color: overdueDataBreachRows.length ? T.red : T.tx }}>{overdueDataBreachRows.length}</div><div className="stat-lbl">Assessment Overdue</div></div>
              <div className="stat"><div className="stat-num" style={{ color: privacyOwnerBlockedRows.length ? T.acc : T.tx }}>{privacyOwnerBlockedRows.length}</div><div className="stat-lbl">Owner Blocked</div></div>
            </div>
            {dataBreachRows.length === 0 && <div className="empty">No suspected data breach incidents recorded.</div>}
            {dataBreachRows.map(row => (
              <div className="card" key={row.id}>
                <div className="card-head">
                  <div>
                    <div className="card-title">{row.title || "Suspected data breach"}</div>
                    <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".25rem" }}>
                      {row.description || "No description recorded."}
                    </div>
                  </div>
                  <span className={`badge ${dataBreachAssessmentOverdue(row) ? "b-cancelled" : dataBreachStatusBadgeClass(row.status)}`}>{dataBreachAssessmentOverdue(row) ? "30-day overdue" : row.status}</span>
                </div>
                <div className="meta">
                  <span>Aware {fmtFullDate(row.awarenessDate)}</span>
                  <span>Assessment due {fmtFullDate(row.assessmentDueDate)}</span>
                  <span>{row.eligibilityDecision}</span>
                  <span>{row.privacyOwnerName ? `Privacy Owner ${row.privacyOwnerName}` : POLICY6_PRIVACY_OWNER_BLOCKER}</span>
                </div>
                <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".45rem" }}>
                  PI involved: {row.personalInformationInvolved || "Not recorded"}. Affected estimate: {row.affectedIndividualEstimate || "Not recorded"}.
                </div>
                <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".45rem" }}>
                  Containment: {row.containmentActions || "Not recorded"} ({row.containmentStatus || "status not recorded"}).
                </div>
                <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                  APP-PRV-004 audit records are preserved: {row.appPrv004AuditRefs || "Missing"}.
                  {row.systemAccessLogRefs ? ` Access logs: ${row.systemAccessLogRefs}.` : ""}
                  {row.digiverseEvidenceRefs ? ` Digiverse evidence: ${row.digiverseEvidenceRefs}.` : ""}
                </div>
                {row.eligibilityDecision === "Eligible Data Breach" && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Eligible breach notification evidence: OAIC - {row.oaicNotificationEvidence || "not recorded"}; affected individuals - {row.affectedIndividualsNotificationEvidence || "not recorded"}.
                  </div>
                )}
                {row.postBreachReviewReportRef && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Post-breach review report: {row.postBreachReviewReportRef}. {row.retainedUntil ? `Retain until ${fmtFullDate(row.retainedUntil)}.` : "Retention starts when the review is completed."}
                  </div>
                )}
                <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".8rem" }}>
                  <button className="btn b-ghost b-sm" onClick={() => editDataBreachIncident(row)}>Edit Incident</button>
                  <button className="btn b-ghost b-sm" onClick={() => blockPolicy6EligibilityDecision(row)}>Eligibility Decision Blocked</button>
                </div>
              </div>
            ))}
          </>
        )}

        {view === "retention" && (
          <>
            <div className="sh"><h2>Retention Register</h2></div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Policy #5 Retention Queue</div>
                <span className="badge b-pending">7 years</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Pickup request records are retained for 7 years from run date. Supplier records are retained for the supplier relationship plus 7 years. Master-data change logs are retained for 7 years from change date. Receiver name and signature proof is retained for 7 years from delivery date. Policy #24 financial reconciliation records and Policy #6 post-breach review reports are retained for 7 years from completion. Destruction is blocked until Privacy Owner approval is confirmed.
              </div>
            </div>
            <div className="stats">
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{proofRetentionRows.length}</div><div className="stat-lbl">POD Records</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{pickupRetentionRows.length}</div><div className="stat-lbl">Pickup Requests</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{supplierRetentionRows.length}</div><div className="stat-lbl">Suppliers</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{masterDataRetentionRows.length}</div><div className="stat-lbl">Change Logs</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{financialReconciliationRetentionRows.length}</div><div className="stat-lbl">Financial Records</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{dataBreachRetentionRows.length}</div><div className="stat-lbl">NDB Reports</div></div>
              <div className="stat"><div className="stat-num" style={{ color: retentionDue.length ? T.red : T.tx }}>{retentionDue.length}</div><div className="stat-lbl">Due Review</div></div>
              <div className="stat"><div className="stat-num" style={{ color: T.acc }}>{proofRetentionRows.filter(row => row.proof.bucketPrivate || proofStorageLabel(row.proof).startsWith("delivery-proof/")).length}</div><div className="stat-lbl">Private Bucket</div></div>
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Pickup Request Records</div>
                <span className="badge b-done">Run date + 7 years</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Retention is calculated from the actual run date retained on the pickup request. Requested date and cut-off adjustment evidence remain visible for audit and dispute review.
              </div>
            </div>
            {pickupRetentionRows.length === 0 && <div className="empty">No pickup request records yet.</div>}
            {pickupRetentionRows.map(row => (
              <div className="card" key={`pickup-retention-${row.order.id}`}>
                <div className="card-head">
                  <div className="card-title">{row.order.id} - {row.order.vendor}</div>
                  <span className={`badge ${row.due ? "b-cancelled" : "b-done"}`}>{row.due ? "Privacy Review Due" : "Retain"}</span>
                </div>
                <div className="meta">
                  <span>{row.client?.name || row.order.clientName || "Client not linked"}</span>
                  <span>Con note {row.order.conNote || "not recorded"}</span>
                  <span>Run {fmtFullDate(row.runDate)}</span>
                  {row.order.requestedDate && row.order.requestedDate !== row.runDate && <span>Requested {fmtFullDate(row.order.requestedDate)}</span>}
                  <span>Retain until {fmtFullDate(row.retentionUntil)}</span>
                </div>
                {(row.order.scheduleAdjusted || row.order.cutoffApplied) && (
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Schedule evidence: {runDateAdjustmentLabel(row.order.scheduleAdjustmentReason)}.
                  </div>
                )}
                <button className="btn b-ghost b-sm" style={{ marginTop: ".7rem" }} disabled>
                  Destruction blocked pending Privacy Owner approval
                </button>
              </div>
            ))}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Supplier Records</div>
                <span className="badge b-done">Relationship + 7 years</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Active supplier relationships are retained while the relationship is open. A 7-year retention review date is calculated after archive/closure records the relationship end.
              </div>
            </div>
            {supplierRetentionRows.length === 0 && <div className="empty">No supplier records yet.</div>}
            {supplierRetentionRows.map(row => (
              <div className="card" key={`supplier-retention-${row.supplier.id}`}>
                <div className="card-head">
                  <div className="card-title">{row.supplier.name}</div>
                  <span className={`badge ${row.due ? "b-cancelled" : row.relationshipClosed ? "b-done" : "b-pending"}`}>{row.due ? "Privacy Review Due" : row.relationshipClosed ? "Retain" : "Relationship Active"}</span>
                </div>
                <div className="meta">
                  <span>{row.supplier.status || "Active"}</span>
                  <span>{row.supplier.address || "Dock address not recorded"}</span>
                  <span>Reviewed {row.supplier.lastReviewed ? fmtFullDate(row.supplier.lastReviewed) : "not recorded"}</span>
                  {row.relationshipClosed ? <span>Ended {fmtFullDate(row.relationshipEndDate)}</span> : <span>Retention starts at archive/closure</span>}
                  {row.retentionUntil && <span>Retain until {fmtFullDate(row.retentionUntil)}</span>}
                </div>
                <button className="btn b-ghost b-sm" style={{ marginTop: ".7rem" }} disabled>
                  Destruction blocked pending Privacy Owner approval
                </button>
              </div>
            ))}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Master Data Change Logs</div>
                <span className="badge b-done">Change date + 7 years</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Supplier, pricing, vehicle, and account master-data changes stay available for audit, dispute review, and APP-PRV-004 traceability for 7 years from the recorded change date.
              </div>
            </div>
            {masterDataRetentionRows.length === 0 && <div className="empty">No master data change-log records yet.</div>}
            {masterDataRetentionRows.map(row => {
              const change = row.change;
              const target = change.targetLabel || change.supplierName || change.targetId || change.supplierId || "Master data";
              return (
                <div className="card" key={`mdc-retention-${change.id}`}>
                  <div className="card-head">
                    <div className="card-title">{target} - {change.changedField || change.field || "change"}</div>
                    <span className={`badge ${row.due ? "b-cancelled" : "b-done"}`}>{row.due ? "Privacy Review Due" : "Retain"}</span>
                  </div>
                  <div className="meta">
                    <span>{change.changeType || "master_data"}</span>
                    <span>{change.action || change.status || "logged"}</span>
                    <span>Changed {fmtFullDate(isoDate(change.changedAt || change.loggedAt || change.createdAt))}</span>
                    <span>Retain until {fmtFullDate(row.retentionUntil)}</span>
                  </div>
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                    Reason: {change.reason || "Not recorded"}
                  </div>
                  <button className="btn b-ghost b-sm" style={{ marginTop: ".7rem" }} disabled>
                    Destruction blocked pending Privacy Owner approval
                  </button>
                </div>
              );
            })}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Financial Reconciliation Records</div>
                <span className="badge b-done">Completion + 7 years</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Policy #24 requires invoice, payment, and reconciliation records to be retained for at least 7 years and available for ATO, Otimi Rules, or auditor review.
              </div>
            </div>
            {financialReconciliationRetentionRows.length === 0 && <div className="empty">No Policy #24 reconciliation records yet.</div>}
            {financialReconciliationRetentionRows.map(row => (
              <div className="card" key={`financial-retention-${row.record.id || row.record.period}`}>
                <div className="card-head">
                  <div className="card-title">{row.record.period} Revenue Control</div>
                  <span className={`badge ${row.due ? "b-cancelled" : "b-done"}`}>{row.due ? "Privacy Review Due" : "Retain"}</span>
                </div>
                <div className="meta">
                  <span>{row.record.invoiceCount || 0} invoice(s)</span>
                  <span>Total ${Number(row.record.total || 0).toFixed(2)}</span>
                  <span>Completed {fmtFullDate(isoDate(row.record.completedAt))}</span>
                  <span>Retain until {fmtFullDate(row.retentionUntil)}</span>
                </div>
                <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                  Source: {row.record.sourceRef || POLICY24_REVENUE_SOURCE}. {row.record.note || "No note recorded."}
                </div>
                <button className="btn b-ghost b-sm" style={{ marginTop: ".7rem" }} disabled>
                  Destruction blocked pending Privacy Owner approval
                </button>
              </div>
            ))}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Policy #6 Post-Breach Review Reports</div>
                <span className="badge b-done">Completion + 7 years</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Policy #6 requires the Privacy Owner and Admin to review the cause after a breach and retain the post-breach review report for 7 years. Eligibility decisions remain blocked until the Privacy Owner is named.
              </div>
            </div>
            {dataBreachRetentionRows.length === 0 && <div className="empty">No Policy #6 post-breach review report records yet.</div>}
            {dataBreachRetentionRows.map(row => (
              <div className="card" key={`ndb-retention-${row.record.id}`}>
                <div className="card-head">
                  <div className="card-title">{row.record.title || "Policy #6 breach review"}</div>
                  <span className={`badge ${row.due ? "b-cancelled" : "b-done"}`}>{row.due ? "Privacy Review Due" : "Retain"}</span>
                </div>
                <div className="meta">
                  <span>Report {row.record.postBreachReviewReportRef}</span>
                  <span>Completed {fmtFullDate(isoDate(row.record.postBreachReviewCompletedAt))}</span>
                  <span>Retain until {fmtFullDate(row.retentionUntil)}</span>
                </div>
                <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                  Source: {row.record.sourceRef || POLICY6_NDB_SOURCE}. Privacy Owner decision: {row.record.eligibilityDecision}.
                </div>
                <button className="btn b-ghost b-sm" style={{ marginTop: ".7rem" }} disabled>
                  Destruction blocked pending Privacy Owner approval
                </button>
              </div>
            ))}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Delivery Proof Records</div>
                <span className="badge b-done">Delivery date + 7 years</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu }}>
                Signature files are represented as Supabase private bucket records locally and stay linked to immutable delivery proof records.
              </div>
            </div>
            {proofRetentionRows.length === 0 && <div className="empty">No POD proof records yet.</div>}
            {proofRetentionRows.map(row => (
              <div className="card" key={row.proof.id}>
                <div className="card-head">
                  <div className="card-title">{row.proof.id}</div>
                  <span className={`badge ${row.due ? "b-cancelled" : "b-done"}`}>{row.due ? "Privacy Review Due" : "Retain"}</span>
                </div>
                <div className="meta">
                  <span>{row.proof.orderId}</span>
                  <span>{row.client?.name || row.order?.clientName || "Client not linked"}</span>
                  <span>Receiver {row.proof.receiverName}</span>
                  <span>Captured {fmtFullDate(isoDate(row.proof.deliveredAt || row.proof.capturedAt))}</span>
                  <span>Retain until {fmtFullDate(row.retentionUntil)}</span>
                </div>
                <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".45rem" }}>
                  Storage: {proofStorageLabel(row.proof)}; signature path retained on delivery proof record.
                </div>
                <button className="btn b-ghost b-sm" style={{ marginTop: ".7rem" }} disabled>
                  Destruction blocked pending Privacy Owner approval
                </button>
              </div>
            ))}
          </>
        )}

        {view === "audit" && (
          <>
            <h2 style={{ marginBottom: "1rem" }}>APP-PRV-004 Audit Trail</h2>
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Tamper-Evident Chain</div>
                  <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".25rem" }}>
                    Append-only local event history for PII actions. Production enforcement is represented in Supabase migrations and still needs live project testing.
                  </div>
                </div>
                <span className={`badge ${auditIntegrity.valid ? "b-done" : "b-cancelled"}`}>{auditIntegrity.valid ? "Hash Verified" : "Hash Mismatch"}</span>
              </div>
              <div className="stats" style={{ marginTop: ".9rem" }}>
                <div className="stat"><div className="stat-num" style={{ color: T.tx }}>{audit.length}</div><div className="stat-lbl">Audit Events</div></div>
                <div className="stat"><div className="stat-num" style={{ color: T.acc }}>{piiAuditCount}</div><div className="stat-lbl">PII Actions</div></div>
                <div className="stat"><div className="stat-num" style={{ color: auditIntegrity.valid ? T.tx : T.acc }}>{auditIntegrity.valid ? "0" : auditIntegrity.rows.filter(row => !row.valid).length}</div><div className="stat-lbl">Chain Breaks</div></div>
              </div>
            </div>
            {audit.length === 0 && <div className="empty">No audit events yet.</div>}
            {audit.slice().reverse().map(a => {
              const status = auditStatusById.get(a.id);
              return (
                <div className="card" key={a.id}>
                  <div className="card-head">
                    <div className="card-title">{a.action}</div>
                    <span className={`badge ${status?.valid ? "b-done" : "b-cancelled"}`}>{status?.valid ? "Verified" : "Check Chain"}</span>
                  </div>
                  <div className="meta"><span>Seq {a.sequence}</span><span>{a.actor}</span><span>{a.protectedObject}</span><span>{a.piiAction ? "PII action" : "Non-PII"}</span></div>
                  <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".35rem" }}>{a.detail}</div>
                  <div style={{ fontSize: ".72rem", color: T.mu2, marginTop: ".45rem" }}>{new Date(a.at).toLocaleString("en-AU")}</div>
                  <div className="meta" style={{ marginTop: ".45rem" }}><span>Hash {a.eventHash}</span><span>Previous {a.previousHash}</span><span>{a.hashAlgorithm}</span></div>
                </div>
              );
            })}
            <h2 style={{ margin: "1.2rem 0 1rem" }}>Master Data Changes</h2>
            {masterDataChanges.length === 0 && <div className="empty">No master data changes yet.</div>}
            {masterDataChanges.slice().reverse().map(change => {
              const target = change.targetLabel || change.supplierName || change.targetId || change.supplierId || "Master data";
              return (
                <div className="card" key={change.id}>
                  <div className="card-head"><div className="card-title">{target} - {change.changedField}</div><span className="badge b-pending">{change.action}</span></div>
                  <div className="meta"><span>{change.changeType || "supplier"}</span><span>Old: {change.oldValue || "Blank"}</span><span>New: {change.newValue || "Blank"}</span></div>
                  <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".35rem" }}>Reason: {change.reason}</div>
                  {change.ownerApprovalRef && <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".25rem" }}>Owner approval: {change.ownerApprovalRef}</div>}
                  {change.effectiveDate && <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".25rem" }}>Effective: {fmt(change.effectiveDate)}</div>}
                  <div style={{ fontSize: ".72rem", color: T.mu2, marginTop: ".45rem" }}>{new Date(change.changedAt).toLocaleString("en-AU")}</div>
                </div>
              );
            })}
          </>
        )}

        {redeliveryFeeReview && (
          <div className="overlay" onClick={() => setRedeliveryFeeReview(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{redeliveryFeeReview.action === "approve" ? "Approve Redelivery Fee" : "Waive Redelivery Fee"} - {redeliveryFeeReview.order.id}</h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>Policy #8</span>
                <span>Attempt {failedDeliveryAttemptCount(redeliveryFeeReview.order)} of 2</span>
                <span>{redeliveryFeeReview.order.vendor}</span>
                <span>${Number(redeliveryFeeReview.order.redeliveryFeeAmount || policy8RedeliveryFeeAmount(priceRules)).toFixed(2)}</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".7rem" }}>
                Admin must review both APP-DRV-003 failed-delivery records before the $10 redelivery fee is billed. Waivers require a recorded reason.
              </div>
              <div className="f">
                <label>Admin Review Note *</label>
                <textarea
                  value={redeliveryFeeReviewNote}
                  onChange={e => setRedeliveryFeeReviewNote(e.target.value)}
                  placeholder="Record failed-delivery proof review, fee decision, and any waiver reason"
                />
              </div>
              <button className={`btn ${redeliveryFeeReview.action === "approve" ? "b-acc" : "b-red"}`} onClick={confirmRedeliveryFeeReview}>
                {redeliveryFeeReview.action === "approve" ? "Approve Fee For Next Invoice" : "Confirm Fee Waiver"}
              </button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={() => setRedeliveryFeeReview(null)}>Cancel</button>
            </div>
          </div>
        )}

        {aiDraftTarget && (
          <div className="overlay" onClick={() => setAiDraftTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Request AI CTA Draft - {aiDraftTarget.targetName}</h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{aiDraftTarget.agentId}</span>
                <span>{aiAgentForId(aiDraftTarget.agentId).name}</span>
                <span>{aiDraftTarget.triggerSource}</span>
                <span>{POLICY20_AI_USE_SOURCE}</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".7rem" }}>
                Local draft record only. The production AI provider, model, prompt registry, and outbound send channel are not configured.
              </div>
              <div style={{ fontSize: ".78rem", color: T.acc, marginBottom: ".7rem" }}>{aiDraftTarget.triggerReason}</div>
              <div className="f">
                <label>Draft Text For Admin Review *</label>
                <textarea
                  value={aiDraftText}
                  onChange={e => setAiDraftText(e.target.value)}
                  placeholder="Create a local draft record for Admin review"
                  style={{ minHeight: 180 }}
                />
              </div>
              <button className="btn b-acc" onClick={createAiDraftForTarget}>Create Draft For Review</button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={() => setAiDraftTarget(null)}>Cancel</button>
            </div>
          </div>
        )}

        {aiDraftReviewTarget && (
          <div className="overlay" onClick={() => setAiDraftReviewTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Review AI Draft - {aiDraftReviewTarget.targetName}</h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{aiDraftReviewTarget.agentId}</span>
                <span>{aiDraftReviewTarget.agentName}</span>
                <span>{aiDraftReviewTarget.status}</span>
                <span>No send action available</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".7rem" }}>
                Admin must read and edit the draft before approval. Approval records governance evidence only and leaves delivery status as not sent because the production channel is unconfirmed.
              </div>
              <div className="f">
                <label>Admin-Edited Draft Text *</label>
                <textarea
                  value={aiDraftText}
                  onChange={e => setAiDraftText(e.target.value)}
                  style={{ minHeight: 180 }}
                />
              </div>
              <div className="f">
                <label>Admin Review Note / Rejection Reason *</label>
                <textarea
                  value={aiDraftReviewNote}
                  onChange={e => setAiDraftReviewNote(e.target.value)}
                  placeholder="Record what was checked, changed, rejected, or why approval is safe to hold as not sent"
                />
              </div>
              <button className="btn b-acc" onClick={approveAiDraftReview}>Approve Draft - Do Not Send</button>
              <button className="btn b-red" style={{ marginTop: ".5rem" }} onClick={rejectAiDraftReview}>Reject Draft</button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={() => setAiDraftReviewTarget(null)}>Cancel</button>
            </div>
          </div>
        )}

        {supplierAction && (
          <div className="overlay" onClick={closeSupplierAction}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>
                {supplierAction.action === "archive" ? "Archive Supplier" : supplierAction.action === "reactivate" ? "Reactivate Supplier" : "Mark Supplier Reviewed"} - {supplierAction.supplier.name}
              </h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{supplierAction.supplier.status || "Active"}</span>
                <span>Reviewed {supplierAction.supplier.lastReviewed || "Not recorded"}</span>
                <span>{supplierAction.supplier.reviewIntervalDays ? `${supplierAction.supplier.reviewIntervalDays} day interval` : "Interval not set"}</span>
                <span>Open work {supplierOpenWorkCount(supplierAction.supplier.name)}</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".7rem" }}>
                Supplier master-data actions require a written Admin reason and create local master-data change rows. Production supplier review automation still depends on the live Supabase project and authority model.
              </div>
              {supplierAction.action === "archive" && supplierOpenWorkCount(supplierAction.supplier.name) > 0 && (
                <div className="err">Archive is blocked while open work references this supplier.</div>
              )}
              <div className="f">
                <label>Reason / Evidence *</label>
                <textarea
                  value={supplierActionReasonText}
                  onChange={e => setSupplierActionReasonText(e.target.value)}
                  placeholder="Review evidence, archive reason, or reactivation authority"
                />
              </div>
              <button
                className={`btn ${supplierAction.action === "archive" ? "b-red" : "b-acc"}`}
                disabled={supplierAction.action === "archive" && supplierOpenWorkCount(supplierAction.supplier.name) > 0}
                onClick={confirmSupplierAction}
              >
                {supplierAction.action === "archive" ? "Confirm Archive" : supplierAction.action === "reactivate" ? "Confirm Reactivate" : "Confirm Reviewed"}
              </button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={closeSupplierAction}>Cancel</button>
            </div>
          </div>
        )}

        {priceAction && (
          <div className="overlay" onClick={closePriceAction}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{priceAction.action === "archive" ? "Archive Pricing Rule" : "Reactivate Pricing Rule"} - {priceAction.rule.label}</h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{priceAction.rule.status || "Active"}</span>
                <span>{priceAction.rule.serviceVariant || "Legacy price rule"}</span>
                <span>{priceRuleBand(priceAction.rule)}</span>
                <span>${priceRuleDollars(priceAction.rule).toFixed(2)}{priceRuleIsPerItem(priceAction.rule) ? " each" : ""}</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".7rem" }}>
                Local pricing changes require Admin reason and Owner approval reference before taking effect. Production dual-control execution remains unresolved under Policy #9 / SOP-MDM-02.
              </div>
              <div className="f">
                <label>Reason *</label>
                <textarea
                  value={priceActionReason}
                  onChange={e => setPriceActionReason(e.target.value)}
                  placeholder="Pricing archive/reactivation reason"
                />
              </div>
              <div className="f">
                <label>Owner Approval Reference *</label>
                <input
                  value={priceActionOwnerApproval}
                  onChange={e => setPriceActionOwnerApproval(e.target.value)}
                  placeholder="Owner approval reference or written approval location"
                />
              </div>
              <button className={`btn ${priceAction.action === "archive" ? "b-red" : "b-acc"}`} onClick={confirmPriceAction}>
                {priceAction.action === "archive" ? "Confirm Archive" : "Confirm Reactivate"}
              </button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={closePriceAction}>Cancel</button>
            </div>
          </div>
        )}

        {activationTarget && (() => {
          const state = activationRequirementState(activationTarget, activationReview);
          return (
            <div className="overlay" onClick={() => setActivationTarget(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>Activation Eligibility - {activationTarget.name}</h3>
                <div className="meta" style={{ marginBottom: ".7rem" }}>
                  <span>{activationTarget.status || "Pending"}</span>
                  <span>{activationTarget.address || "No address"}</span>
                  <span>{(activationTarget.vendors || []).length} supplier link(s)</span>
                </div>
                <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".8rem" }}>
                  Eligibility checklist is advisory only. Admin activates or rejects based on the review, and the audit trail records the action.
                </div>
                {state.checks.map(check => (
                  <div key={check.key} style={{ display: "flex", gap: ".55rem", alignItems: "flex-start", color: check.available ? T.tx : T.mu, fontSize: ".82rem", lineHeight: 1.4, margin: ".65rem 0" }}>
                    <span className={`badge ${check.available ? "b-done" : "b-pending"}`} style={{ marginTop: ".1rem" }}>{check.available ? "Reference ok" : "Review"}</span>
                    <span>
                      <strong>{check.label}</strong>
                      <br />
                      <span style={{ color: check.available ? T.mu : T.acc }}>{check.detail}</span>
                      <br />
                      <span style={{ color: T.mu2 }}>{check.source}</span>
                    </span>
                  </div>
                ))}
                <div className="f"><label>Review Note</label><textarea value={activationReview.note} onChange={e => setActivationReview(review => ({ ...review, note: e.target.value }))} placeholder="Eligibility evidence or service-area review note" /></div>
                <button className="btn b-acc" onClick={confirmActivationReview}>Activate Account</button>
                <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={() => setActivationTarget(null)}>Cancel</button>
              </div>
            </div>
          );
        })()}

        {accessTarget && (
          <div className="overlay" onClick={() => setAccessTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{accessAction === "revoke" ? "Revoke Access" : accessAction === "restore" ? "Restore Access" : "Record Access Review"} - {accessTarget.subjectName}</h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{accessTarget.roleLabel}</span>
                <span>{accessTarget.actorCode}</span>
                <span>{accessTarget.email}</span>
                <span>{accessTarget.status}</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".7rem" }}>
                Local access register only. Production Supabase Auth identity binding and final RLS policies remain open pending Policy #21 and BOAS Sheet 05 review.
              </div>
              <div className="f"><label>Review Type</label><select value={accessReviewType} onChange={e => setAccessReviewType(e.target.value)}>
                {ACCESS_REVIEW_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select></div>
              <div style={{ fontSize: ".78rem", color: T.mu, marginBottom: ".7rem" }}>
                SOP-IAM-04 / Policy #21: Staff access is reviewed annually and on departure or role change.
              </div>
              <div className="f"><label>Reason / Evidence</label><textarea value={accessReason} onChange={e => setAccessReason(e.target.value)} placeholder="Annual review, role change, departure, or access decision evidence" /></div>
              <button className={`btn ${accessAction === "revoke" ? "b-red" : "b-acc"}`} onClick={confirmAccessAction}>
                {accessAction === "revoke" ? "Confirm Revoke" : accessAction === "restore" ? "Confirm Restore" : "Confirm Review"}
              </button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={() => setAccessTarget(null)}>Cancel</button>
            </div>
          </div>
        )}

        {crmDraft && (
          <div className="overlay" onClick={() => { setCrmTarget(null); setCrmDraft(null); }}>
            <div className="modal" style={{ maxWidth: "820px" }} onClick={e => e.stopPropagation()}>
              <h3>{crmTarget ? `CRM Review - ${crmTarget.name}` : "New Workshop CRM Record"}</h3>
              <p style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".9rem" }}>
                Lean Village CRM/ERM subset: actor, contacts, events, obligations, owner, review date, next action, and open issue visibility.
              </p>

              <h4 style={{ margin: ".8rem 0 .5rem" }}>Workshop Actor</h4>
              <div className="fr">
                <div className="f"><label>Trading Name</label><input value={crmDraft.name} onChange={e => setCrmDraft(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="f"><label>Account Email</label><input value={crmDraft.email} onChange={e => setCrmDraft(p => ({ ...p, email: e.target.value }))} /></div>
                <div className="f"><label>Phone</label><input value={crmDraft.phone} onChange={e => setCrmDraft(p => ({ ...p, phone: e.target.value }))} /></div>
                <div className="f"><label>Delivery Address</label><input value={crmDraft.address} onChange={e => setCrmDraft(p => ({ ...p, address: e.target.value }))} /></div>
              </div>

              <h4 style={{ margin: ".8rem 0 .5rem" }}>Contacts</h4>
              <div className="fr">
                <div className="f"><label>Operational Contact</label><input value={crmDraft.operationalContact?.name || ""} onChange={e => setCrmDraft(p => ({ ...p, operationalContact: { ...(p.operationalContact || {}), name: e.target.value } }))} /></div>
                <div className="f"><label>Operational Email</label><input value={crmDraft.operationalContact?.email || ""} onChange={e => setCrmDraft(p => ({ ...p, operationalContact: { ...(p.operationalContact || {}), email: e.target.value } }))} /></div>
                <div className="f"><label>Billing Contact</label><input value={crmDraft.billingContact?.name || ""} onChange={e => setCrmDraft(p => ({ ...p, billingContact: { ...(p.billingContact || {}), name: e.target.value } }))} /></div>
                <div className="f"><label>Billing Email</label><input value={crmDraft.billingContact?.email || ""} onChange={e => setCrmDraft(p => ({ ...p, billingContact: { ...(p.billingContact || {}), email: e.target.value } }))} /></div>
              </div>

              <h4 style={{ margin: ".8rem 0 .5rem" }}>Relationship Governance</h4>
              <div className="fr">
                <div className="f"><label>Internal Owner</label><input value={crmDraft.relationshipOwner || ""} onChange={e => setCrmDraft(p => ({ ...p, relationshipOwner: e.target.value }))} placeholder="Required" /></div>
                <div className="f"><label>Relationship Tier</label><select value={crmDraft.relationshipTier || "Transactional"} onChange={e => setCrmDraft(p => ({ ...p, relationshipTier: e.target.value }))}>{CRM_RELATIONSHIP_TIERS.map(value => <option key={value}>{value}</option>)}</select></div>
                <div className="f"><label>Relationship Status</label><select value={crmDraft.relationshipStatus || "Active"} onChange={e => setCrmDraft(p => ({ ...p, relationshipStatus: e.target.value }))}>{CRM_RELATIONSHIP_STATUSES.map(value => <option key={value}>{value}</option>)}</select></div>
                <div className="f"><label>Risk Level</label><select value={crmDraft.riskLevel || "Low"} onChange={e => setCrmDraft(p => ({ ...p, riskLevel: e.target.value }))}>{CRM_RISK_LEVELS.map(value => <option key={value}>{value}</option>)}</select></div>
                <div className="f"><label>Review Date</label><input type="date" value={crmDraft.reviewDate || ""} onChange={e => setCrmDraft(p => ({ ...p, reviewDate: e.target.value }))} onInput={e => setCrmDraft(p => ({ ...p, reviewDate: e.target.value }))} /></div>
                <div className="f"><label>Next Action Due</label><input type="date" value={crmDraft.nextActionDue || ""} onChange={e => setCrmDraft(p => ({ ...p, nextActionDue: e.target.value }))} onInput={e => setCrmDraft(p => ({ ...p, nextActionDue: e.target.value }))} /></div>
              </div>
              <div className="f"><label>Next Action</label><input value={crmDraft.nextAction || ""} onChange={e => setCrmDraft(p => ({ ...p, nextAction: e.target.value }))} /></div>
              <div className="f"><label>CRM Notes</label><textarea value={crmDraft.crmNotes || ""} onChange={e => setCrmDraft(p => ({ ...p, crmNotes: e.target.value }))} /></div>

              <h4 style={{ margin: ".8rem 0 .5rem" }}>Supplier Access</h4>
              <div className="pills">
                {activeSupplierList.map(supplier => {
                  const linked = (crmDraft.vendors || []).includes(supplier.name);
                  return (
                    <button key={`${crmDraft.id}-${supplier.id || supplier.name}`} className={`pill${linked ? " sel" : ""}`} onClick={() => setCrmDraft(p => ({ ...p, vendors: linked ? (p.vendors || []).filter(name => name !== supplier.name) : [...(p.vendors || []), supplier.name] }))}>
                      {linked ? "Linked: " : "Add: "}{supplier.name}
                    </button>
                  );
                })}
              </div>
              <div className="f" style={{ marginTop: ".65rem" }}>
                <label>Supplier Access Change Reason</label>
                <textarea
                  value={crmSupplierAccessReason}
                  onChange={e => setCrmSupplierAccessReason(e.target.value)}
                  placeholder="Required if supplier links are added or removed"
                />
              </div>

              <h4 style={{ margin: ".8rem 0 .5rem" }}>Add Event</h4>
              <div className="fr">
                <div className="f"><label>Event Type</label><select value={crmEventDraft.eventType} onChange={e => setCrmEventDraft(p => ({ ...p, eventType: e.target.value }))}>{CRM_EVENT_TYPES.map(value => <option key={value}>{value}</option>)}</select></div>
                <div className="f"><label>Health Impact</label><select value={crmEventDraft.healthImpact} onChange={e => setCrmEventDraft(p => ({ ...p, healthImpact: e.target.value }))}>{CRM_HEALTH_IMPACTS.map(value => <option key={value}>{value}</option>)}</select></div>
              </div>
              <div className="f"><label>Description</label><input value={crmEventDraft.description} onChange={e => setCrmEventDraft(p => ({ ...p, description: e.target.value }))} placeholder="Optional event to append" /></div>
              <div className="f"><label>Outcome</label><input value={crmEventDraft.outcome} onChange={e => setCrmEventDraft(p => ({ ...p, outcome: e.target.value }))} /></div>
              <div className="fr">
                <div className="f"><label>Event Next Action</label><input value={crmEventDraft.nextAction} onChange={e => setCrmEventDraft(p => ({ ...p, nextAction: e.target.value }))} placeholder="Optional follow-up from this event" /></div>
                <div className="f"><label>Event Next Action Owner</label><input value={crmEventDraft.nextActionOwner} onChange={e => setCrmEventDraft(p => ({ ...p, nextActionOwner: e.target.value }))} /></div>
                <div className="f"><label>Event Next Action Due</label><input type="date" value={crmEventDraft.nextActionDue} onChange={e => setCrmEventDraft(p => ({ ...p, nextActionDue: e.target.value }))} onInput={e => setCrmEventDraft(p => ({ ...p, nextActionDue: e.target.value }))} /></div>
              </div>

              <h4 style={{ margin: ".8rem 0 .5rem" }}>Add Obligation</h4>
              <div className="fr">
                <div className="f"><label>Type</label><select value={crmObligationDraft.obligationType} onChange={e => setCrmObligationDraft(p => ({ ...p, obligationType: e.target.value }))}>{CRM_OBLIGATION_TYPES.map(value => <option key={value}>{value}</option>)}</select></div>
                <div className="f"><label>Direction</label><select value={crmObligationDraft.direction} onChange={e => setCrmObligationDraft(p => ({ ...p, direction: e.target.value }))}>{CRM_OBLIGATION_DIRECTIONS.map(value => <option key={value}>{value}</option>)}</select></div>
                <div className="f"><label>Status</label><select value={crmObligationDraft.status} onChange={e => setCrmObligationDraft(p => ({ ...p, status: e.target.value }))}>{CRM_OBLIGATION_STATUSES.map(value => <option key={value}>{value}</option>)}</select></div>
                <div className="f"><label>Due Date</label><input type="date" value={crmObligationDraft.dueDate} onChange={e => setCrmObligationDraft(p => ({ ...p, dueDate: e.target.value }))} onInput={e => setCrmObligationDraft(p => ({ ...p, dueDate: e.target.value }))} /></div>
              </div>
              <div className="f"><label>Title</label><input value={crmObligationDraft.title} onChange={e => setCrmObligationDraft(p => ({ ...p, title: e.target.value }))} placeholder="Optional obligation to append" /></div>
              <div className="f"><label>Description</label><input value={crmObligationDraft.description} onChange={e => setCrmObligationDraft(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="f"><label>Risk If Breached</label><input value={crmObligationDraft.riskIfBreached} onChange={e => setCrmObligationDraft(p => ({ ...p, riskIfBreached: e.target.value }))} /></div>

              <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap", marginTop: ".9rem" }}>
                <button className="btn b-acc" onClick={saveCrmRecord}>Save CRM Record</button>
                <button className="btn b-ghost" onClick={() => { setCrmTarget(null); setCrmDraft(null); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {supplierAccessAction && (
          <div className="overlay" onClick={closeSupplierAccessAction}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{supplierAccessAction.action === "add" ? "Add Supplier Access" : "Remove Supplier Access"} - {supplierAccessAction.client.name}</h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{supplierAccessAction.supplierName}</span>
                <span>{(supplierAccessAction.client.vendors || []).length} current link(s)</span>
                <span>Controlled supplier list</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".7rem" }}>
                Supplier access changes require Admin reason/evidence and are stored on the customer record with APP-PRV-004 audit evidence.
              </div>
              <div className="f">
                <label>Reason / Evidence *</label>
                <textarea
                  value={supplierAccessReason}
                  onChange={e => setSupplierAccessReason(e.target.value)}
                  placeholder="Supplier approval, removal reason, customer request, or review evidence"
                />
              </div>
              <button className={`btn ${supplierAccessAction.action === "add" ? "b-acc" : "b-red"}`} onClick={confirmSupplierAccessAction}>
                Confirm Supplier Access Change
              </button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={closeSupplierAccessAction}>Cancel</button>
            </div>
          </div>
        )}

        {suspensionTarget && (
          <div className="overlay" onClick={() => setSuspensionTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Account Suspension - {suspensionTarget.client.name}</h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{suspensionTarget.client.status || "Active"}</span>
                <span>Billing: {suspensionTarget.client.billingContact?.email || "Not recorded"}</span>
                <span>Operational: {suspensionTarget.client.operationalContact?.email || suspensionTarget.client.email}</span>
              </div>
              {suspensionTarget.invoice && (
                <div className="card" style={{ marginBottom: ".8rem" }}>
                  <div className="card-title">{suspensionTarget.invoice.id}</div>
                  <div className="meta"><span>{suspensionTarget.invoice.status}</span><span>Due {fmt(suspensionTarget.invoice.dueDate)}</span><span>Total ${Number(suspensionTarget.invoice.total || 0).toFixed(2)}</span></div>
                </div>
              )}
              <div className="f">
                <label>Policy #23 Suspension Ground</label>
                <select value={suspensionType} onChange={e => setSuspensionType(e.target.value)}>
                  {POLICY23_SUSPENSION_TYPES.map(type => <option key={type} value={type}>{policy23SuspensionTypeLabel(type)}</option>)}
                </select>
              </div>
              <div className="f"><label>Suspension Reason</label><textarea value={suspensionReason} onChange={e => setSuspensionReason(e.target.value)} /></div>
              {suspensionType === "material_conduct_breach" && (
                <>
                  <div className="f"><label>Conduct Breach Notice Evidence</label><textarea value={conductNoticeEvidence} onChange={e => setConductNoticeEvidence(e.target.value)} placeholder="Admin notice reference, date, or copy location" /></div>
                  <div className="f"><label>Breach Not Remedied Evidence</label><textarea value={conductRemedyEvidence} onChange={e => setConductRemedyEvidence(e.target.value)} placeholder="Admin review note showing breach was not remedied after notice" /></div>
                </>
              )}
              <div className="pills" style={{ margin: ".7rem 0" }}>
                <button className={`pill${suspensionNotifyOps ? " sel" : ""}`} onClick={() => setSuspensionNotifyOps(v => !v)}>Operational contact notified</button>
                <button className={`pill${suspensionNotifyBilling ? " sel" : ""}`} onClick={() => setSuspensionNotifyBilling(v => !v)}>Billing contact notified</button>
              </div>
              <div className="f"><label>Type Account Name To Confirm</label><input value={suspensionConfirmName} onChange={e => setSuspensionConfirmName(e.target.value)} placeholder={suspensionTarget.client.name} /></div>
              <button className="btn b-red" onClick={confirmSuspension}>Confirm Suspension</button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={() => setSuspensionTarget(null)}>Cancel</button>
            </div>
          </div>
        )}

        {reinstatementTarget && (
          <div className="overlay" onClick={() => setReinstatementTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Account Reinstatement - {reinstatementTarget.name}</h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{reinstatementTarget.status}</span>
                <span>Billing: {reinstatementTarget.billingContact?.email || "Not recorded"}</span>
                <span>Operational: {reinstatementTarget.operationalContact?.email || reinstatementTarget.email}</span>
              </div>
              <div className="pills" style={{ margin: ".7rem 0" }}>
                <button className={`pill${reinstatementResolutionType === "payment_confirmed" ? " sel" : ""}`} onClick={() => setReinstatementResolutionType("payment_confirmed")}>Payment confirmed</button>
                <button className={`pill${reinstatementResolutionType === "payment_arrangement" ? " sel" : ""}`} onClick={() => setReinstatementResolutionType("payment_arrangement")}>Payment arrangement</button>
                {reinstatementTarget.suspensionRecord?.type === "material_conduct_breach" && (
                  <button className={`pill${reinstatementResolutionType === "breach_remedied" ? " sel" : ""}`} onClick={() => setReinstatementResolutionType("breach_remedied")}>Breach remedied</button>
                )}
              </div>
              <div className="f"><label>{reinstatementTarget.suspensionRecord?.type === "material_conduct_breach" ? "Breach Remedy / Reinstatement Evidence" : "Payment Clearance / Reinstatement Evidence"}</label><textarea value={reinstatementEvidence} onChange={e => setReinstatementEvidence(e.target.value)} placeholder="Payment reference, payment arrangement summary, breach remedy, or Admin evidence" /></div>
              {reinstatementResolutionType === "payment_arrangement" && (
                <>
                  <div className="grid-2">
                    <div className="f"><label>Agreed Payment Date *</label><input type="date" value={reinstatementArrangementDate} onChange={e => setReinstatementArrangementDate(e.target.value)} /></div>
                    <div className="f"><label>Agreed Amount *</label><input value={reinstatementArrangementAmount} onChange={e => setReinstatementArrangementAmount(e.target.value)} placeholder="$ amount" /></div>
                  </div>
                  <div className="f"><label>Contact Who Agreed *</label><input value={reinstatementArrangementContact} onChange={e => setReinstatementArrangementContact(e.target.value)} placeholder="Name and role" /></div>
                  <div className="f"><label>Written Evidence Reference *</label><input value={reinstatementArrangementEvidence} onChange={e => setReinstatementArrangementEvidence(e.target.value)} placeholder="Email subject, message reference, or written approval ref" /></div>
                </>
              )}
              <div className="pills" style={{ margin: ".7rem 0" }}>
                <span className="pill sel">Operational contact automatic</span>
                <span className="pill sel">Billing contact automatic</span>
              </div>
              <div className="f"><label>Type Account Name To Confirm</label><input value={reinstatementConfirmName} onChange={e => setReinstatementConfirmName(e.target.value)} placeholder={reinstatementTarget.name} /></div>
              <button className="btn b-acc" onClick={confirmReinstatement}>Confirm Reinstatement</button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={() => setReinstatementTarget(null)}>Cancel</button>
            </div>
          </div>
        )}

        {terminationTarget && (
          <div className="overlay" onClick={closeTermination}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Account Termination - {terminationTarget.name}</h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{terminationTarget.status || "Active"}</span>
                <span>{POLICY23_ACCOUNT_STATUS_SOURCE}</span>
                <span>{POLICY23_DEBT_RECOVERY_GAP}</span>
              </div>
              <div className="f">
                <label>Termination Ground</label>
                <select value={terminationGround} onChange={e => setTerminationGround(e.target.value)}>
                  {POLICY23_TERMINATION_GROUNDS.map(ground => <option key={ground} value={ground}>{policy23TerminationGroundLabel(ground)}</option>)}
                </select>
              </div>
              {terminationGround === "repeated_non_payment" && (
                <div className="err">
                  Policy #23 blocks this local action until the debt recovery escalation path and write-off thresholds are confirmed.
                </div>
              )}
              {terminationGround === "voluntary_request" && (
                <div className="f"><label>Client Closure Request Evidence</label><textarea value={terminationClientRequest} onChange={e => setTerminationClientRequest(e.target.value)} placeholder="Client request reference, date, or copy location" /></div>
              )}
              {terminationGround === "conduct_unremedied" && (
                <div className="card" style={{ marginBottom: ".8rem" }}>
                  <div className="card-title">Prior Conduct Suspension</div>
                  <div style={{ fontSize: ".82rem", color: T.mu, marginTop: ".35rem" }}>
                    {terminationTarget.suspensionRecord?.type === "material_conduct_breach" ? `${terminationTarget.suspensionRecord.reason}; notice evidence ${terminationTarget.suspensionRecord.conductNoticeEvidence || "not recorded"}` : "Conduct termination requires a current conduct suspension record."}
                  </div>
                </div>
              )}
              <div className="fr">
                <div className="f"><label>Effective Date</label><input type="date" value={terminationEffectiveDate} onChange={e => setTerminationEffectiveDate(e.target.value)} /></div>
                <div className="f"><label>Type Account Name To Confirm</label><input value={terminationConfirmName} onChange={e => setTerminationConfirmName(e.target.value)} placeholder={terminationTarget.name} /></div>
              </div>
              <div className="f"><label>Termination Reason</label><textarea value={terminationReason} onChange={e => setTerminationReason(e.target.value)} /></div>
              <div className="f"><label>Owner Consultation Evidence</label><textarea value={terminationOwnerConsultation} onChange={e => setTerminationOwnerConsultation(e.target.value)} placeholder="Owner consultation / approval reference" /></div>
              <div className="f"><label>Written Termination Notice Evidence</label><textarea value={terminationWrittenNotice} onChange={e => setTerminationWrittenNotice(e.target.value)} placeholder="Written notice reference, date, or copy location" /></div>
              <button className="btn b-red" onClick={confirmTermination}>Confirm Termination</button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={closeTermination}>Cancel</button>
            </div>
          </div>
        )}

        {accountMatchTarget && (
          <div className="overlay" onClick={() => setAccountMatchTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Correct Billing Account - {accountMatchTarget.order.id}</h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{accountMatchTarget.order.clientName || "No account"}</span>
                <span>{accountMatchTarget.order.vendor || "Supplier not recorded"}</span>
                <span>Con note {accountMatchTarget.order.conNote || "not recorded"}</span>
                <span>Run {fmtFullDate(accountMatchTarget.order.actualRunDate || accountMatchTarget.order.date)}</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".75rem" }}>
                SOP-EXC-03 requires Admin to investigate POD proof and pickup capture before updating account_id. This job stays out of invoice groups until the active billing account is corrected.
              </div>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>Delivery address: {accountMatchTarget.order.dropAddress || "not recorded"}</span>
                <span>{accountMatchTarget.order.proofId ? `Proof ${accountMatchTarget.order.proofId}` : "Proof not linked"}</span>
              </div>
              <div className="f">
                <label>Correct Client Account</label>
                <select value={accountMatchClientId} onChange={e => setAccountMatchClientId(e.target.value)}>
                  <option value="">Select active account</option>
                  {activeClientAccounts(clients).map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div className="f">
                <label>Admin Investigation Note</label>
                <textarea
                  value={accountMatchNote}
                  onChange={e => setAccountMatchNote(e.target.value)}
                  placeholder="Record proof, address, con note, supplier, and delivery date evidence used to confirm the account."
                />
              </div>
              <button className="btn b-acc" onClick={confirmAccountMatch}>Save Account Match</button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={() => setAccountMatchTarget(null)}>Cancel</button>
            </div>
          </div>
        )}

        {reconciliationTarget && (
          <div className="overlay" onClick={() => setReconciliationTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Policy #24 Reconciliation - {reconciliationTarget.period}</h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>Month end {fmtFullDate(reconciliationTarget.monthEndDate)}</span>
                <span>Due {fmtFullDate(reconciliationTarget.dueDate)}</span>
                <span>{reconciliationTarget.invoiceCount} invoice(s)</span>
                <span>Total ${reconciliationTarget.total.toFixed(2)}</span>
                <span>Paid ${reconciliationTarget.paidTotal.toFixed(2)}</span>
                <span>Unpaid ${reconciliationTarget.unpaidTotal.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".75rem" }}>
                Policy #24 requires Admin to reconcile APP-ADM-004 invoice records against payment evidence within 5 business days of month end, retain financial records for 7 years, and keep BAS/Otimi reporting gaps visible until confirmed.
              </div>
              {reconciliationTarget.reasons.length > 0 && (
                <div style={{ fontSize: ".78rem", color: T.acc, marginBottom: ".75rem" }}>
                  {reconciliationTarget.reasons.join("; ")}
                </div>
              )}
              <div className="pills" style={{ margin: ".7rem 0" }}>
                <button className={`pill${reconciliationNoOffSystemRevenue ? " sel" : ""}`} onClick={() => setReconciliationNoOffSystemRevenue(v => !v)}>
                  No off-system revenue confirmed
                </button>
              </div>
              <div className="f">
                <label>External Accountant Name</label>
                <input
                  value={reconciliationExternalAccountantName}
                  onChange={e => setReconciliationExternalAccountantName(e.target.value)}
                  placeholder="Optional until engagement is confirmed"
                />
              </div>
              <div className="f">
                <label>Admin Reconciliation Note *</label>
                <textarea
                  value={reconciliationNote}
                  onChange={e => setReconciliationNote(e.target.value)}
                  placeholder="Record invoice total, payment evidence reviewed, unpaid/overdue balance, BAS data handoff gap, and Otimi reporting status."
                />
              </div>
              <div style={{ fontSize: ".78rem", color: T.mu, marginBottom: ".75rem" }}>
                Otimi Rules reporting cadence/format is still unconfirmed; this local record does not claim portfolio reporting has been sent.
              </div>
              <button className="btn b-acc" onClick={confirmFinancialReconciliation}>Save Reconciliation Evidence</button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={() => setReconciliationTarget(null)}>Cancel</button>
            </div>
          </div>
        )}

        {paymentTarget && (
          <div className="overlay" onClick={() => setPaymentTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Record Payment Evidence - {paymentTarget.id}</h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{paymentTarget.clientName}</span>
                <span>{paymentTarget.status}</span>
                <span>Due {fmt(paymentTarget.dueDate)}</span>
                <span>Total ${Number(paymentTarget.total || 0).toFixed(2)}</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".7rem" }}>
                Local evidence capture only. Production EFT source, Zoho integration, export, and reconciliation rules remain unconfirmed.
              </div>
              <div className="f"><label>Payment Evidence / Reference</label><textarea value={paymentEvidence} onChange={e => setPaymentEvidence(e.target.value)} placeholder="Bank reference, remittance note, or Admin evidence" /></div>
              <button className="btn b-acc" onClick={confirmPayment}>Confirm Paid</button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={() => setPaymentTarget(null)}>Cancel</button>
            </div>
          </div>
        )}

        {invoiceApprovalTarget && (
          <div className="overlay" onClick={() => setInvoiceApprovalTarget(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Approve Invoice For Dispatch - {invoiceApprovalTarget.id}</h3>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>{invoiceApprovalTarget.clientName}</span>
                <span>{invoiceApprovalTarget.status}</span>
                <span>{invoiceApprovalTarget.lines?.length || 0} lines</span>
                <span>Total ${Number(invoiceApprovalTarget.total || 0).toFixed(2)}</span>
              </div>
              <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".7rem" }}>
                SOP-BIL-04 requires Admin review of the rendered invoice. Confirming the invoice is correct triggers dispatch automatically. Production PDF/email delivery remains unconfirmed, so this records a local dispatch evidence row.
              </div>
              <div className="meta" style={{ marginBottom: ".7rem" }}>
                <span>Billing group approved {fmtFullDate(isoDate(invoiceApprovalTarget.billingGroupApprovedAt || invoiceApprovalTarget.createdAt))}</span>
                <span>Billing contact {invoiceApprovalTarget.billingEmail}</span>
              </div>
              <div className="f">
                <label>Admin Invoice Review Note *</label>
                <textarea
                  value={invoiceApprovalNote}
                  onChange={e => setInvoiceApprovalNote(e.target.value)}
                  placeholder="Record rendered invoice review evidence, line check, billing contact check, or reason confirmation is delayed."
                />
              </div>
              <button className="btn b-acc" onClick={confirmInvoiceApproval}>Confirm Invoice Correct</button>
              <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={() => setInvoiceApprovalTarget(null)}>Cancel</button>
            </div>
          </div>
        )}

        {invoicePreview && (
          <InvoicePreviewModal
            invoice={invoicePreview}
            client={clients.find(client => client.id === invoicePreview.clientId)}
            notices={billingNotices || []}
            onClose={() => setInvoicePreview(null)}
          />
        )}

        {investigationTarget && (() => {
          const linkedInvoice = invoiceForException(investigationTarget);
          const linkedOrders = ordersForException(investigationTarget);
          const linkedProofs = proofsForException(investigationTarget);
          const linkedSupplier = supplierForException(investigationTarget);
          const linkedSupplierPickupRow = linkedSupplier && ["Supplier Pickup Standards Review", "WHS Hazard"].includes(investigationTarget.type) ? supplierPickupStandardsRows([linkedSupplier], orders, exceptions)[0] : null;
          const linkedSupplierApprovalGate = linkedSupplier ? supplierApprovalGateState(linkedSupplier) : null;
          const linkedPriceRule = priceRuleForException(investigationTarget);
          const control = exceptionInvestigationControl(investigationTarget);
          const policy18Remedy = isPolicy18Dispute(investigationTarget) ? policy18RemedyForFinding(investigationTarget, policy18Finding) : null;
          return (
            <div className="overlay" onClick={() => setInvestigationTarget(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>Investigate Exception - {investigationTarget.orderId}</h3>
                <div className="meta" style={{ marginBottom: ".7rem" }}>
                  <span>{investigationTarget.type}</span>
                  <span>{investigationTarget.status}</span>
                  <span>{control.policy}</span>
                  <span>{control.evidence}</span>
                </div>
                <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".8rem" }}>{investigationTarget.note}</div>
                {linkedSupplier && (
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".7rem", marginBottom: ".7rem" }}>
                    <div className="card-title">Supplier Record</div>
                    <div className="meta"><span>{linkedSupplier.name}</span><span>{linkedSupplier.status || "Active"}</span><span>Reviewed {linkedSupplier.lastReviewed || "Not recorded"}</span><span>{supplierReviewIntervalDays(linkedSupplier) ? `${supplierReviewIntervalDays(linkedSupplier)} day interval` : "Interval not set"}</span></div>
                    <div className="meta" style={{ marginTop: ".35rem" }}><span>Dock contact {linkedSupplier.dockContactName || "unresolved"}</span><span>{linkedSupplier.dockContactRole || "role not recorded"}</span><span>{linkedSupplierApprovalGate?.approved ? "Approval gate recorded" : "Approval gate incomplete"}</span></div>
                    {linkedSupplierApprovalGate && <div style={{ fontSize: ".78rem", color: linkedSupplierApprovalGate.approved ? T.mu : T.acc, marginTop: ".35rem" }}>{linkedSupplierApprovalGate.approved ? (linkedSupplier.supplierApprovalEvidenceRef || "Supplier approval evidence recorded") : linkedSupplierApprovalGate.reasons.join("; ")}</div>}
                    {linkedSupplierPickupRow ? (
                      <>
                        <div className="meta" style={{ marginTop: ".35rem" }}><span>{linkedSupplierPickupRow.total} pickup records</span><span>{linkedSupplierPickupRow.noPickupCount} No Pickup</span><span>{linkedSupplierPickupRow.noPickupRate.toFixed(0)}%</span><span>{linkedSupplierPickupRow.packagingRefusalCount} packaging refusals</span><span>{linkedSupplierPickupRow.whsHazardCount || 0} WHS hazards</span></div>
                        <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>{linkedSupplierPickupRow.reasons.join("; ") || "No current pickup standards flags"}</div>
                      </>
                    ) : (
                      investigationTarget.type === "WHS Hazard" ? (
                        <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>Policy #27 requires Admin supplier follow-up and no driver return to a known unresolved WHS hazard.</div>
                      ) : (
                        <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>{supplierReviewReasons(linkedSupplier).join("; ") || "No current supplier review flags"}</div>
                      )
                    )}
                  </div>
                )}
                {linkedPriceRule && (
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".7rem", marginBottom: ".7rem" }}>
                    <div className="card-title">Pricing Rule</div>
                    <div className="meta"><span>{linkedPriceRule.label}</span><span>{linkedPriceRule.serviceVariant || "No service variant"}</span><span>{linkedPriceRule.itemType || "No item type"}</span><span>{priceRuleBand(linkedPriceRule)}</span><span>${priceRuleDollars(linkedPriceRule).toFixed(2)}{priceRuleIsPerItem(linkedPriceRule) ? " each" : ""}</span></div>
                    <div style={{ fontSize: ".78rem", color: T.acc, marginTop: ".35rem" }}>{priceRuleReviewReasons(linkedPriceRule).join("; ") || "No current pricing review flags"}</div>
                  </div>
                )}
                {linkedInvoice && (
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".7rem", marginBottom: ".7rem" }}>
                    <div className="card-title">Invoice Evidence</div>
                    <div className="meta"><span>{linkedInvoice.id}</span><span>{linkedInvoice.status}</span><span>Total ${Number(linkedInvoice.total || 0).toFixed(2)}</span><span>Due {fmt(linkedInvoice.dueDate)}</span></div>
                  </div>
                )}
                {isPolicy18Dispute(investigationTarget) && (
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".7rem", marginBottom: ".7rem" }}>
                    <div className="card-title">Policy #18 Dispute Control</div>
                    <div className="meta">
                      <span>{investigationTarget.disputeReasonLabel || policy18ReasonLabel(investigationTarget.disputeReason)}</span>
                      <span>Delivery date {investigationTarget.disputedDeliveryDate || "not recorded"}</span>
                      <span>{investigationTarget.policy18TimingLabel || "Invoice timing not recorded"}</span>
                      <span>{policy18StatusLine(investigationTarget)}</span>
                      <span>Owner escalation {investigationTarget.ownerEscalationStatus || "Not Requested"}</span>
                    </div>
                    <div style={{ fontSize: ".78rem", color: T.mu, marginTop: ".35rem" }}>
                      Policy #18 requires Admin to record the outcome against the order record. Confirmed billing errors require credit note or corrected invoice action within 5 business days; this local build records that obligation but does not issue it externally.
                    </div>
                  </div>
                )}
                {linkedOrders.length > 0 && (
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".7rem", marginBottom: ".7rem" }}>
                    <div className="card-title">Linked Work</div>
                    {linkedOrders.map(order => (
                      <div className="meta" key={order.id} style={{ marginTop: ".35rem" }}>
                        <span>{order.id}</span>
                        <span>{order.status}</span>
                        <span>{order.vendor}</span>
                        <span>{order.recvName ? `Receiver ${order.recvName}` : "Receiver not recorded"}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!["Supplier Master Data Review", "Supplier Pickup Standards Review", "Pricing Master Data Review"].includes(investigationTarget.type) && (
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".7rem", marginBottom: ".7rem" }}>
                    <div className="card-title">POD Proof Records</div>
                    {linkedProofs.length === 0 && <div style={{ fontSize: ".82rem", color: T.acc, marginTop: ".35rem" }}>No delivery proof record is linked to this exception.</div>}
                    {linkedProofs.map(proof => (
                      <div className="meta" key={proof.id} style={{ marginTop: ".35rem" }}>
                        <span>{proof.id}</span>
                        <span>{proof.orderId}</span>
                        <span>Receiver {proof.receiverName}</span>
                        <span>{proof.deliveredAt ? new Date(proof.deliveredAt).toLocaleString("en-AU") : "Delivered time not recorded"}</span>
                        <span>{proof.storage || "Storage not recorded"}</span>
                      </div>
                    ))}
                  </div>
                )}
                {isPolicy18Dispute(investigationTarget) && (
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: ".7rem", marginBottom: ".7rem" }}>
                    <div className="f"><label>Policy #18 Finding</label>
                      <select value={policy18Finding} onChange={e => setPolicy18Finding(e.target.value)}>
                        {policy18FindingOptions(investigationTarget).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                    {policy18Remedy?.remedyRequired ? (
                      <>
                        <div className="meta" style={{ marginBottom: ".65rem" }}>
                          <span>{policy18Remedy.remedyLabel}</span>
                          <span>{policy18Remedy.remedyStatus}</span>
                          {policy18Remedy.remedyDueDate && <span>Due {fmtFullDate(policy18Remedy.remedyDueDate)}</span>}
                        </div>
                        <div className="f"><label>Policy #18 Remedy Note</label><textarea value={policy18RemedyNote} onChange={e => setPolicy18RemedyNote(e.target.value)} placeholder="Record no-cost remedy decision or local accounting handoff evidence. Do not claim external issue until the accounting path is confirmed." /></div>
                      </>
                    ) : (
                      <div style={{ fontSize: ".78rem", color: T.mu, marginBottom: ".65rem" }}>
                        No Policy #18 remedy obligation will be created for this finding.
                      </div>
                    )}
                  </div>
                )}
                <div className="f"><label>Investigation Outcome</label><input value={investigationOutcome} onChange={e => setInvestigationOutcome(e.target.value)} /></div>
                <div className="f"><label>Admin Investigation Note</label><textarea value={investigationNote} onChange={e => setInvestigationNote(e.target.value)} placeholder={control.notePlaceholder} /></div>
                <button className="btn b-acc" onClick={closeInvestigation}>Close Exception</button>
                <button className="btn b-ghost" style={{ marginTop: ".5rem" }} onClick={() => setInvestigationTarget(null)}>Cancel</button>
              </div>
            </div>
          );
        })()}

        {selOrder && (
          <div className="overlay" onClick={() => setSelOrder(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{selOrder.id} Details</h3>
              <div className="f"><label>Status</label>
                <select value={selOrder.status} onChange={e => {
                  const nextStatus = e.target.value;
                  if (nextStatus === selOrder.status) return;
                  if (nextStatus === "Delivered") {
                    showWorkflowNotice("SOP-DEL-05 sets Delivered from the immutable delivery proof insert. Use the Driver POD workflow, or record a documented Admin/technology exception outside the local status shortcut.");
                    return;
                  }
                  if (selOrder.status === "Delivered") {
                    showWorkflowNotice("Delivered jobs are locked after proof completion under SOP-DEL-05. Corrections require a documented Admin/technology exception.");
                    return;
                  }
                  const upd = { ...selOrder, status: nextStatus };
                  onUpdateOrder(upd);
                  setSelOrder(upd);
                }}>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="meta" style={{ marginBottom: ".6rem" }}>
                <span>👤 {selOrder.clientName}</span><span>📦 {selOrder.vendor}</span>
                <span>📋 {selOrder.conNote}</span><span>📍 {selOrder.dropAddress}</span>
                <span>📅 {fmt(selOrder.date)}</span>{selOrder.price && <span>💰 ${selOrder.price}</span>}
              </div>
              {selOrder.notes && <div style={{ fontSize: ".82rem", color: T.mu, marginBottom: ".6rem" }}>{selOrder.notes}</div>}
              {selOrder.recvName && <div style={{ fontSize: ".82rem", color: T.mu }}>Received by: {selOrder.recvName}</div>}
              <hr className="dvd" />
              <button className="btn b-ghost" onClick={() => setSelOrder(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
function workspaceSessionForLiveData(session, clients = [], drivers = []) {
  if (!session?.user) return session;
  const email = String(session.user.email || "").toLowerCase();

  if (session.role === "client" || session.role === "billing") {
    const client = (clients || []).find(row =>
      row.id === session.user.id ||
      row.actorId === session.user.actorId ||
      row.operationalProfileId === session.user.profileId ||
      row.billingProfileId === session.user.profileId ||
      String(row.email || "").toLowerCase() === email ||
      String(row.operationalContact?.email || "").toLowerCase() === email ||
      String(row.billingContact?.email || "").toLowerCase() === email
    );
    if (client) return { ...session, user: { ...client, ...session.user, id: client.id, name: client.name || session.user.name } };
  }

  if (session.role === "driver") {
    const driver = (drivers || []).find(row =>
      row.id === session.user.id ||
      row.code === session.user.actorCode ||
      row.profileId === session.user.profileId ||
      String(row.email || "").toLowerCase() === email
    );
    if (driver) return { ...session, user: { ...driver, ...session.user, id: driver.id, name: driver.name || session.user.name } };
  }

  return session;
}

export default function App() {
  const pathname = usePathname();
  const routeIntent = routeIntentFromPath(pathname || "/");
  const [session, setSession] = useState(null);
  const [vehicles, setVehicles] = useState(() => load(KEY_VEHICLES, seedVehicles));
  const [orders, setOrders] = useState(() => {
    const vehicleRows = load(KEY_VEHICLES, seedVehicles);
    const loaded = load(KEY_ORDERS, seedOrders);
    const normalised = normaliseOrderVehicleEvidence(loaded, vehicleRows);
    if (JSON.stringify(loaded) !== JSON.stringify(normalised)) save(KEY_ORDERS, normalised);
    return normalised;
  });
  const [clients, setClients] = useState(() => load(KEY_CLIENTS, seedClients));
  const [drivers, setDrivers] = useState(() => {
    const loaded = load(KEY_DRIVERS, seedDrivers);
    const normalised = loaded.map(normaliseDriverRecord);
    if (JSON.stringify(loaded) !== JSON.stringify(normalised)) save(KEY_DRIVERS, normalised);
    return normalised;
  });
  const [suppliers, setSuppliers] = useState(() => load(KEY_SUPPLIERS, seedSuppliers));
  const [priceRules, setPriceRules] = useState(() => {
    const loaded = load(KEY_PRICE_RULES, seedPriceRules);
    const next = loaded.map(normalisePriceRule);
    if (JSON.stringify(loaded) !== JSON.stringify(next)) save(KEY_PRICE_RULES, next);
    return next;
  });
  const [exceptions, setExceptions] = useState(() => load(KEY_EXCEPTIONS, []));
  const [audit, setAudit] = useState(() => loadAuditTrail());
  const [proofs, setProofs] = useState(() => {
    const loaded = load(KEY_PROOFS, seedProofs);
    const normalised = loaded.map(proof => normaliseDeliveryProof(proof, orders));
    if (JSON.stringify(loaded) !== JSON.stringify(normalised)) save(KEY_PROOFS, normalised);
    return normalised;
  });
  const [invoices, setInvoices] = useState(() => {
    const loaded = load(KEY_INVOICES, seedInvoices);
    const normalised = loaded.map(normaliseInvoice);
    if (JSON.stringify(loaded) !== JSON.stringify(normalised)) save(KEY_INVOICES, normalised);
    return normalised;
  });
  const [billingNotices, setBillingNotices] = useState(() => load(KEY_BILLING_NOTICES, seedBillingNotices));
  const [operationalNotices, setOperationalNotices] = useState(() => load(KEY_OPERATIONAL_NOTICES, seedOperationalNotices));
  const [runClosures, setRunClosures] = useState(() => load(KEY_RUN_CLOSES, seedRunClosures));
  const [masterDataChanges, setMasterDataChanges] = useState(() => load(KEY_MASTER_DATA_CHANGES, []));
  const [exceptionAlerts, setExceptionAlerts] = useState(() => load(KEY_EXCEPTION_ALERTS, []));
  const [driverAvailability, setDriverAvailability] = useState(() => load(KEY_DRIVER_AVAILABILITY, seedDriverAvailability));
  const [financialReconciliations, setFinancialReconciliations] = useState(() => {
    const loaded = load(KEY_FINANCIAL_RECONCILIATIONS, seedFinancialReconciliations);
    const normalised = loaded.map(normaliseFinancialReconciliation);
    if (JSON.stringify(loaded) !== JSON.stringify(normalised)) save(KEY_FINANCIAL_RECONCILIATIONS, normalised);
    return normalised;
  });
  const [aiDrafts, setAiDrafts] = useState(() => {
    const loaded = load(KEY_AI_DRAFTS, seedAiDrafts);
    const normalised = loaded.map(normaliseAiDraft);
    if (JSON.stringify(loaded) !== JSON.stringify(normalised)) save(KEY_AI_DRAFTS, normalised);
    return normalised;
  });
  const [dataBreachIncidents, setDataBreachIncidents] = useState(() => {
    const loaded = load(KEY_DATA_BREACH_INCIDENTS, seedDataBreachIncidents);
    const normalised = loaded.map(normaliseDataBreachIncident);
    if (JSON.stringify(loaded) !== JSON.stringify(normalised)) save(KEY_DATA_BREACH_INCIDENTS, normalised);
    return normalised;
  });
  const [dataUseRecords, setDataUseRecords] = useState(() => {
    const loaded = load(KEY_DATA_USE_RECORDS, seedDataUseRecords);
    const normalised = loaded.map(normaliseDataUseRecord);
    if (JSON.stringify(loaded) !== JSON.stringify(normalised)) save(KEY_DATA_USE_RECORDS, normalised);
    return normalised;
  });
  const [privacyRequests, setPrivacyRequests] = useState(() => {
    const loaded = load(KEY_PRIVACY_REQUESTS, seedPrivacyRequests);
    const normalised = loaded.map(normalisePrivacyRequest);
    if (JSON.stringify(loaded) !== JSON.stringify(normalised)) save(KEY_PRIVACY_REQUESTS, normalised);
    return normalised;
  });
  const [accessOverrides, setAccessOverrides] = useState(() => load(KEY_ACCESS_OVERRIDES, []));
  const [showReg, setShowReg] = useState(false);
  const [systemNotice, setSystemNotice] = useState("");
  const accessRecords = buildAccessRecords(clients, drivers, accessOverrides);
  const liveRuntimeStatus = getLiveRuntimeStatus();
  const liveRuntimeEnabled = Boolean(liveRuntimeStatus.enabled);
  const [liveAuthLoading, setLiveAuthLoading] = useState(liveRuntimeEnabled);
  const [liveAuthError, setLiveAuthError] = useState("");
  const [liveSnapshotLoaded, setLiveSnapshotLoaded] = useState(false);
  const liveRefreshSeq = useRef(0);
  const workspaceSession = workspaceSessionForLiveData(session, clients, drivers);

  useEffect(() => {
    if (!liveRuntimeEnabled) {
      setLiveAuthLoading(false);
      return;
    }
    let cancelled = false;

    async function refreshLiveSession() {
      const refreshSeq = ++liveRefreshSeq.current;
      setLiveAuthLoading(true);
      try {
        await portalTaskTimeout("Secure login", completeLiveAuthRedirect(), 10000);
        const resolved = await portalTaskTimeout("Secure session check", resolveLiveRuntimeSession(), 15000);
        if (cancelled || refreshSeq !== liveRefreshSeq.current) return;
        if (resolved?.blocked) {
          setSession(null);
          setLiveAuthError(resolved.reason || "This email is not approved for portal access.");
          return;
        }
        if (resolved?.role) {
          setSession(resolved);
          setLiveAuthError("");
          return;
        }
        setSession(null);
      } catch (error) {
        if (!cancelled && refreshSeq === liveRefreshSeq.current) {
          setSession(null);
          setLiveAuthError(error?.message || "Login could not be completed. Contact Admin.");
        }
      } finally {
        if (!cancelled && refreshSeq === liveRefreshSeq.current) setLiveAuthLoading(false);
      }
    }

    refreshLiveSession();
    const unsubscribe = onLiveAuthStateChange(refreshLiveSession);
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [liveRuntimeEnabled]);

  useEffect(() => {
    if (!liveRuntimeEnabled || !session?.role || liveSnapshotLoaded) return;
    let cancelled = false;

    async function loadSnapshot() {
      try {
        const snapshot = await loadLiveRuntimeSnapshot();
        if (cancelled) return;
        if (snapshot.clients?.length) setClients(snapshot.clients);
        if (snapshot.suppliers?.length) setSuppliers(snapshot.suppliers);
        if (snapshot.drivers?.length) setDrivers(snapshot.drivers.map(normaliseDriverRecord));
        if (snapshot.vehicles?.length) setVehicles(snapshot.vehicles);
        if (snapshot.priceRules?.length) setPriceRules(snapshot.priceRules.map(normalisePriceRule));
        if (snapshot.orders?.length) setOrders(snapshot.orders);
        if (snapshot.proofs?.length) setProofs(snapshot.proofs.map(proof => normaliseDeliveryProof(proof, snapshot.orders?.length ? snapshot.orders : orders)));
        if (snapshot.exceptions?.length) setExceptions(snapshot.exceptions);
        if (snapshot.audit?.length) setAudit(snapshot.audit);
        if (snapshot.invoices?.length) setInvoices(snapshot.invoices.map(normaliseInvoice));
        if (snapshot.billingNotices?.length) setBillingNotices(snapshot.billingNotices);
        if (snapshot.operationalNotices?.length) setOperationalNotices(snapshot.operationalNotices);
        if (snapshot.runClosures?.length) setRunClosures(snapshot.runClosures);
        if (snapshot.masterDataChanges?.length) setMasterDataChanges(snapshot.masterDataChanges);
        if (snapshot.exceptionAlerts?.length) setExceptionAlerts(snapshot.exceptionAlerts);
        if (snapshot.driverAvailability?.length) setDriverAvailability(snapshot.driverAvailability.map(normaliseDriverAvailabilityRecord));
        if (snapshot.financialReconciliations?.length) setFinancialReconciliations(snapshot.financialReconciliations.map(normaliseFinancialReconciliation));
        if (snapshot.aiDrafts?.length) setAiDrafts(snapshot.aiDrafts.map(normaliseAiDraft));
        if (snapshot.dataBreachIncidents?.length) setDataBreachIncidents(snapshot.dataBreachIncidents.map(normaliseDataBreachIncident));
        if (snapshot.dataUseRecords?.length) setDataUseRecords(snapshot.dataUseRecords.map(normaliseDataUseRecord));
        if (snapshot.privacyRequests?.length) setPrivacyRequests(snapshot.privacyRequests.map(normalisePrivacyRequest));
        setLiveSnapshotLoaded(true);
      } catch (error) {
        if (!cancelled) setLiveAuthError(error?.message || "Live portal data could not be loaded. Contact Admin.");
      }
    }

    loadSnapshot();
    return () => { cancelled = true; };
  }, [liveRuntimeEnabled, session?.role, liveSnapshotLoaded]);

  async function logout() {
    if (liveRuntimeEnabled) await signOutLiveRuntime();
    setSession(null);
    setLiveSnapshotLoaded(false);
  }

  function showWorkflowNotice(message) {
    setSystemNotice(String(message || "A system workflow rule blocked this action."));
  }

  function resetLocalDemoData() {
    clearLocalDemoState();
    window.location.reload();
  }

  function writeAudit(action, detail, actor = session?.role || "system") {
    setAudit(prev => {
      const previous = prev[prev.length - 1];
      const event = buildAuditEvent({
        id: `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        action,
        detail,
        actor,
        at: isoNow(),
      }, previous);
      const next = [...prev, event];
      save(KEY_AUDIT, next);
      return next;
    });
  }

  function createOperationalNotice({ clientId, clientName, orderId = "", noticeType, subject, message, audience = "client_operational", eventRef = "", createdBy = session?.role || "system", policyRef = "UJ-CRM-001A / notification provider gap" }) {
    if (!clientId || !noticeType) return;
    const notice = {
      id: `operational-notice-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      clientId,
      clientName,
      orderId,
      noticeType,
      audience,
      subject,
      message,
      channel: "local_record_only",
      externalDeliveryStatus: "provider_not_configured",
      eventRef,
      createdAt: isoNow(),
      createdBy,
      policyRef,
    };
    setOperationalNotices(prev => {
      const next = [notice, ...prev];
      save(KEY_OPERATIONAL_NOTICES, next);
      return next;
    });
    writeAudit("Operational notice recorded", `${orderId || clientId}: ${noticeType}; local record only`, createdBy);
  }

  function createBillingAccountNotice({ client, noticeType, invoiceId = "", subject, note, eventRef = "", recordedAt = isoNow(), createdBy = "admin" }) {
    if (!client?.id || !noticeType) return;
    const linkedInvoice = invoiceId ? invoices.find(invoice => invoice.id === invoiceId) : null;
    const notice = {
      id: `billing-notice-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      invoiceId,
      clientId: client.id,
      clientName: client.name,
      noticeType,
      subject: subject || `${billingNoticeLabel(noticeType)} - ${client.name}`,
      status: "recorded",
      deliveryChannel: "local_record_only",
      dueDate: linkedInvoice?.dueDate || "",
      noticeDueDate: isoDate(recordedAt),
      recordedAt,
      recordedBy: session?.user?.id || "local-admin",
      amount: linkedInvoice?.total || 0,
      billingContactName: client?.billingContact?.name || client.name,
      billingContactEmail: client?.billingContact?.email || client.email || "",
      operationalContactName: client?.operationalContact?.name || client.name,
      operationalContactEmail: client?.operationalContact?.email || client.email || "",
      policyRef: "UJ-CRM-001B / UJ-ADM-001",
      externalDeliveryStatus: "provider_not_configured",
      eventRef,
      note: note || "Local notice record only; production notification delivery provider and channel are unconfirmed.",
    };
    setBillingNotices(prev => {
      const duplicate = prev.some(item =>
        item.clientId === notice.clientId &&
        item.noticeType === notice.noticeType &&
        (item.invoiceId || "") === notice.invoiceId &&
        (item.eventRef || item.recordedAt || "") === (notice.eventRef || notice.recordedAt || "")
      );
      if (duplicate) return prev;
      const next = [notice, ...prev];
      save(KEY_BILLING_NOTICES, next);
      return next;
    });
    writeAudit(`${billingNoticeLabel(noticeType)} recorded`, `${client.name}${invoiceId ? ` ${invoiceId}` : ""}; local record only`, createdBy);
  }

  function buildDay8OverdueNotice(invoice, { client = null, recordedAt = isoNow(), createdBy = "system", generationSource = "system_due_scan" } = {}) {
    const account = client || clients.find(c => c.id === invoice.clientId);
    return {
      id: `billing-notice-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      noticeType: "day_8_overdue",
      subject: `Day 8 overdue notice - ${invoice.id}`,
      status: "recorded",
      deliveryChannel: "local_record_only",
      dueDate: invoice.dueDate,
      noticeDueDate: day8NoticeDueDate(invoice),
      recordedAt,
      recordedBy: createdBy === "system" ? "system" : (session?.user?.id || "local-admin"),
      amount: invoice.total,
      billingContactName: account?.billingContact?.name || invoice.clientName,
      billingContactEmail: invoice.billingEmail,
      operationalContactName: account?.operationalContact?.name || invoice.clientName,
      operationalContactEmail: account?.operationalContact?.email || account?.email || "",
      policyRef: "UJ-CRM-001B / UJ-ADM-001 / Policy #23",
      externalDeliveryStatus: "provider_not_configured",
      eventRef: invoice.id,
      systemGenerated: generationSource !== "admin_manual",
      generationSource,
      note: generationSource === "admin_manual"
        ? "Admin-recorded local Day 8 overdue notice. Production notification delivery provider and channel are unconfirmed."
        : "System-generated local Day 8 overdue notice. Production notification delivery provider and channel are unconfirmed.",
    };
  }

  useEffect(() => {
    const existing = new Set(
      billingNotices
        .filter(notice => notice.noticeType === "day_8_overdue")
        .map(notice => notice.invoiceId)
    );
    const dueInvoices = invoices.filter(invoice => isDay8NoticeDue(invoice) && !existing.has(invoice.id));
    if (dueInvoices.length === 0) return;
    const recordedAt = isoNow();
    const generated = dueInvoices.map(invoice => buildDay8OverdueNotice(invoice, {
      client: clients.find(client => client.id === invoice.clientId),
      recordedAt,
      createdBy: "system",
      generationSource: "system_due_scan",
    }));
    setBillingNotices(prev => {
      const prevKeys = new Set(prev.filter(notice => notice.noticeType === "day_8_overdue").map(notice => notice.invoiceId));
      const stillMissing = generated.filter(notice => !prevKeys.has(notice.invoiceId));
      if (stillMissing.length === 0) return prev;
      const next = [...stillMissing, ...prev];
      save(KEY_BILLING_NOTICES, next);
      return next;
    });
    writeAudit("Day 8 overdue notices generated", `${generated.map(notice => notice.invoiceId).join(", ")}; local records only`, "system");
  }, [invoices, billingNotices, clients]);

  function recordAccountStatusNotices(previous, client) {
    if (!previous?.id || !client?.id) return;
    const previousStatus = previous.status || "Active";
    const nextStatus = client.status || "Active";

    if (previousStatus !== "Suspended" && nextStatus === "Suspended") {
      const record = client.suspensionRecord || {};
      const invoiceId = record.invoiceId || "";
      const reason = record.reason || client.suspensionReason || "Suspension reason recorded by Admin";
      const recordedAt = record.notifiedAt || record.date || client.suspendedAt || isoNow();
      const contactEvidence = `Operational contact notified: ${record.operationalContactNotified ? "yes" : "no"}; Billing contact notified: ${record.billingContactNotified ? "yes" : "no"}.`;
      createOperationalNotice({
        clientId: client.id,
        clientName: client.name,
        orderId: invoiceId,
        noticeType: "account_suspended",
        subject: `Account suspended - ${client.name}`,
        message: `Courier pickup access was suspended by Admin. Reason: ${reason}. ${contactEvidence} Local record only; production outbound delivery remains unconfigured.`,
        eventRef: recordedAt,
        createdBy: "admin",
      });
      createBillingAccountNotice({
        client,
        noticeType: "suspension",
        invoiceId,
        subject: `Account suspended - ${client.name}`,
        note: `Account suspension recorded. Reason: ${reason}. ${contactEvidence} Local record only; production notification delivery provider and channel are unconfirmed.`,
        eventRef: recordedAt,
        recordedAt,
      });
    }

    if (previousStatus === "Suspended" && nextStatus === "Active" && client.reinstatementRecord) {
      const record = client.reinstatementRecord || {};
      const evidence = record.evidence || "Reinstatement evidence recorded by Admin";
      const recordedAt = record.notifiedAt || record.date || client.reinstatedAt || isoNow();
      const arrangement = record.paymentArrangement
        ? ` Payment arrangement: ${record.paymentArrangement.agreedAmount} due ${fmtFullDate(record.paymentArrangement.agreedPaymentDate)}; agreed by ${record.paymentArrangement.agreedByNameAndRole}; evidence ${record.paymentArrangement.writtenEvidenceRef}.`
        : "";
      const contactEvidence = record.notificationMode === "automatic_on_admin_action"
        ? "Operational and Billing contacts notified automatically on Admin reinstatement action."
        : `Operational contact notified: ${record.operationalContactNotified ? "yes" : "no"}; Billing contact notified: ${record.billingContactNotified ? "yes" : "no"}.`;
      createOperationalNotice({
        clientId: client.id,
        clientName: client.name,
        noticeType: "account_reinstated",
        subject: `Account reinstated - ${client.name}`,
        message: `Courier pickup access was reinstated by Admin. Evidence: ${evidence}.${arrangement} ${contactEvidence} Local record only; production outbound delivery remains unconfigured.`,
        eventRef: recordedAt,
        createdBy: "admin",
      });
      createBillingAccountNotice({
        client,
        noticeType: "reinstatement",
        subject: `Account reinstated - ${client.name}`,
        note: `Account reinstatement recorded. Evidence: ${evidence}.${arrangement} ${contactEvidence} Local record only; production notification delivery provider and channel are unconfirmed.`,
        eventRef: recordedAt,
        recordedAt,
      });
    }

    if (previousStatus !== "Closed" && nextStatus === "Closed" && client.terminationRecord) {
      const record = client.terminationRecord || {};
      const ground = record.groundLabel || policy23TerminationGroundLabel(record.ground);
      const reason = record.reason || "Termination reason recorded by Admin";
      const recordedAt = record.date || client.terminatedAt || isoNow();
      const effectiveDate = record.effectiveDate || isoDate(recordedAt);
      const outstandingNote = record.outstandingInvoiceNote || "Existing outstanding invoices remain payable.";
      createOperationalNotice({
        clientId: client.id,
        clientName: client.name,
        noticeType: "account_terminated",
        subject: `Account terminated - ${client.name}`,
        message: `Courier account access was permanently closed by Admin under ${ground}. Reason: ${reason}. Effective ${fmtFullDate(effectiveDate)}. ${outstandingNote} Local record only; production outbound delivery remains unconfigured.`,
        eventRef: recordedAt,
        createdBy: "admin",
        policyRef: `${POLICY23_ACCOUNT_STATUS_SOURCE} / notification provider gap`,
      });
      createBillingAccountNotice({
        client,
        noticeType: "termination",
        subject: `Account terminated - ${client.name}`,
        note: `Account termination recorded under ${ground}. Reason: ${reason}. Effective ${fmtFullDate(effectiveDate)}. Owner consultation evidence: ${record.ownerConsultationEvidence || "not recorded"}. Written notice evidence: ${record.writtenNoticeEvidence || "not recorded"}. ${outstandingNote} Local record only; production notification delivery provider and channel are unconfirmed.`,
        eventRef: recordedAt,
        recordedAt,
      });
    }
  }

  function recordOrderStatusNotice(previous, upd) {
    if (!upd?.clientId) return;
    if (previous?.pickupOutcome !== upd.pickupOutcome && upd.pickupOutcome === "Picked Up") {
      createOperationalNotice({
        clientId: upd.clientId,
        clientName: upd.clientName,
        orderId: upd.id,
        noticeType: "pickup_confirmed",
        subject: `Pickup confirmed - ${upd.id}`,
        message: `${upd.vendor} pickup has been confirmed by ${upd.driverName || "Driver"} for run ${fmtFullDate(upd.actualRunDate || upd.date)}. Item evidence: ${upd.pickupItemType || "not recorded"}${upd.pickupItemQty ? ` x ${upd.pickupItemQty}` : ""}.`,
        eventRef: upd.pickupConfirmedAt || upd.pickupOutcomeAt || "",
        createdBy: "driver",
      });
    }

    if (previous?.status === upd.status) return;
    if (upd.status === "En Route") {
      createOperationalNotice({
        clientId: upd.clientId,
        clientName: upd.clientName,
        orderId: upd.id,
        noticeType: "out_for_delivery",
        subject: `Out for delivery - ${upd.id}`,
        message: `${upd.id} is out for delivery to ${upd.dropAddress}. Driver ${upd.driverName || "not recorded"}; vehicle ${upd.vehicleName || "not recorded"}.`,
        eventRef: upd.startedAt || "",
        createdBy: "driver",
      });
    }
    if (upd.status === "Delivered") {
      createOperationalNotice({
        clientId: upd.clientId,
        clientName: upd.clientName,
        orderId: upd.id,
        noticeType: "delivered",
        subject: `Delivered - ${upd.id}`,
        message: `${upd.id} was delivered to ${upd.recvName || "receiver recorded"}. POD proof ${upd.proofId || "pending link"} is retained under Policy #5.`,
        eventRef: upd.deliveredAt || upd.proofId || "",
        createdBy: "driver",
      });
    }
    if (upd.status === "Failed Delivery") {
      const attemptCount = failedDeliveryAttemptCount(upd);
      createOperationalNotice({
        clientId: upd.clientId,
        clientName: upd.clientName,
        orderId: upd.id,
        noticeType: "failed_delivery",
        subject: `Failed delivery - ${upd.id}`,
        message: `${upd.id} failed delivery attempt ${attemptCount} of 2. Reason: ${upd.failedDeliveryReason || "not recorded"}.${upd.failedDeliveryHandlingNote ? ` Handling: ${upd.failedDeliveryHandlingNote}.` : ""} ${attemptCount >= 2 ? "Goods return to the originating supplier on the next scheduled milk run; Admin reviews the Policy #8 redelivery fee before billing." : "Goods remain with the driver after the first failed attempt; no redelivery fee applies yet."}`,
        eventRef: upd.failedDeliveryAt || "",
        createdBy: "driver",
      });
    }
    if (upd.status === "No Pickup") {
      const noPickupCategory = upd.pickupNoPickupCategory ? noPickupCategoryLabel(upd.pickupNoPickupCategory) : "No Pickup";
      const noPickupPolicy = upd.pickupNoPickupCategory === "whs_hazard" ? "Policy #27 / APP-DRV-002" : "Policy #15 / Policy #16";
      createOperationalNotice({
        clientId: upd.clientId,
        clientName: upd.clientName,
        orderId: upd.id,
        noticeType: "no_pickup",
        subject: `No pickup - ${upd.id}`,
        message: `${upd.vendor} pickup was not completed. ${noPickupPolicy} category: ${noPickupCategory}. Reason: ${upd.pickupNote || "not recorded"}.${upd.driverOutcomeNote ? ` Driver note: ${upd.driverOutcomeNote}.` : ""} Billable item row: none.`,
        eventRef: upd.pickupOutcomeAt || "",
        createdBy: "driver",
      });
    }
    if (upd.status === "Brought Forward") {
      const intendedRun = upd.bringForwardIntendedRunDate || upd.actualRunDate || upd.date;
      const collectedDate = upd.bringForwardCollectedDate || isoDate(upd.pickupOutcomeAt || upd.updatedAt || upd.submittedAt);
      createOperationalNotice({
        clientId: upd.clientId,
        clientName: upd.clientName,
        orderId: upd.id,
        noticeType: "bring_forward",
        subject: `Future pickup collected early - ${upd.id}`,
        message: `${upd.id} was collected early from ${upd.vendor} on ${fmtFullDate(collectedDate)} under SOP-RUN-04 because the supplier was already on the planned route. Intended delivery run remains ${fmtFullDate(intendedRun)}. Reason: ${upd.bringForwardReason || upd.pickupNote || "not recorded"}.`,
        eventRef: upd.pickupOutcomeAt || intendedRun || "",
        createdBy: "driver",
        policyRef: "SOP-RUN-04 / UJ-CRM-001A / notification provider gap",
      });
    }
    if (upd.status === "Cancelled") {
      createOperationalNotice({
        clientId: upd.clientId,
        clientName: upd.clientName,
        orderId: upd.id,
        noticeType: "order_cancelled",
        subject: `Order cancelled - ${upd.id}`,
        message: `${upd.id} was cancelled under Policy #14. Reason: ${upd.cancellationReason || "not recorded"}. Billable record: none before goods collected.`,
        eventRef: upd.cancelledAt || "",
        createdBy: upd.cancelledBy || "admin",
        policyRef: "Policy #14 / APP-ADM-001 / notification provider gap",
      });
    }
  }

  function recordSupplierMasterDataChanges(previous, supplier, reason, action) {
    const fields = [
      ["name", "name"],
      ["phone", "phone"],
      ["address", "dock_address"],
      ["dockContactRole", "dock_contact_role"],
      ["dockContactName", "dock_contact_name"],
      ["pickupWindow", "pickup_window"],
      ["packagingNotes", "packaging_notes"],
      ["dockAccessAgreed", "dock_access_agreed"],
      ["packagingStandardsAgreed", "packaging_standards_agreed"],
      ["pickupWindowAgreed", "pickup_window_agreed"],
      ["supplierApprovalEvidenceRef", "supplier_approval_evidence_ref"],
      ["status", "status"],
      ["lastReviewed", "last_reviewed"],
      ["reviewIntervalDays", "review_interval_days"],
      ["archivedAt", "archived_at"],
      ["reactivatedAt", "reactivated_at"],
    ];
    const changedAt = isoNow();
    const rows = fields
      .map(([key, field]) => {
        const oldValue = previous ? String(previous[key] || "") : "";
        const newValue = String(supplier[key] || "");
        if (previous && oldValue === newValue) return null;
        if (!previous && !newValue) return null;
        return {
          id: `mdc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          changeType: "supplier",
          targetId: supplier.id,
          targetLabel: supplier.name,
          supplierId: supplier.id,
          supplierName: supplier.name,
          changedField: field,
          oldValue,
          newValue,
          reason,
          action,
          adminId: session?.user?.id || "local-admin",
          changedAt,
        };
      })
      .filter(Boolean);
    if (rows.length === 0) return;
    setMasterDataChanges(prev => {
      const next = [...prev, ...rows];
      save(KEY_MASTER_DATA_CHANGES, next);
      return next;
    });
  }

  function recordPricingMasterDataChanges(previous, rule, meta, action) {
    const fields = [
      ["serviceVariant", "service_variant"],
      ["label", "label"],
      ["itemType", "item_type"],
      ["tyreCountMin", "tyre_count_min"],
      ["tyreCountMax", "tyre_count_max"],
      ["weightBand", "weight_band"],
      ["rateCents", "rate_cents"],
      ["rateMode", "rate_mode"],
      ["effectiveFrom", "effective_from"],
      ["effectiveTo", "effective_to"],
      ["status", "status"],
      ["changeLogId", "change_log_id"],
      ["ownerApprovalRef", "owner_approval_ref"],
      ["sourceRef", "source_ref"],
    ];
    const changedAt = isoNow();
    const rows = fields
      .map(([key, field]) => {
        const oldValue = previous ? String(previous[key] || "") : "";
        const newValue = String(rule[key] || "");
        if (previous && oldValue === newValue) return null;
        if (!previous && !newValue) return null;
        return {
          id: `mdc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          changeType: "pricing",
          targetId: rule.id,
          targetLabel: rule.label,
          changedField: field,
          oldValue,
          newValue,
          reason: meta?.reason || "Not recorded",
          action,
          status: "executed",
          ownerApprovalRef: meta?.ownerApprovalRef || "",
          adminId: session?.user?.id || "local-admin",
          effectiveDate: meta?.effectiveDate || rule.effectiveFrom || "",
          changedAt,
        };
      })
      .filter(Boolean);
    if (rows.length === 0) return;
    setMasterDataChanges(prev => {
      const next = [...prev, ...rows];
      save(KEY_MASTER_DATA_CHANGES, next);
      return next;
    });
  }

  function recordVehicleMasterDataChanges(previous, vehicle, reason, action) {
    const fields = [
      ["vehicleName", "vehicle_name"],
      ["registrationPlate", "registration_plate"],
      ["make", "make"],
      ["model", "model"],
      ["year", "year"],
      ["ownershipType", "ownership_type"],
      ["status", "status"],
      ["assignedDriverId", "assigned_driver_id"],
      ["registrationExpiry", "registration_expiry"],
      ["insuranceExpiry", "insurance_expiry"],
      ["lastServiceDate", "last_service_date"],
      ["nextServiceDue", "next_service_due"],
      ["defectStatus", "defect_status"],
      ["lastReviewed", "last_reviewed"],
      ["notes", "notes"],
    ];
    const changedAt = isoNow();
    const rows = fields
      .map(([key, field]) => {
        const oldValue = previous ? String(previous[key] || "") : "";
        const newValue = String(vehicle[key] || "");
        if (previous && oldValue === newValue) return null;
        if (!previous && !newValue) return null;
        return {
          id: `mdc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          changeType: "vehicle",
          targetId: vehicle.id,
          targetLabel: vehicleLabel(vehicle) || vehicle.vehicleName,
          changedField: field,
          oldValue,
          newValue,
          reason,
          action,
          status: "executed",
          adminId: session?.user?.id || "local-admin",
          changedAt,
        };
      })
      .filter(Boolean);
    if (rows.length === 0) return;
    setMasterDataChanges(prev => {
      const next = [...prev, ...rows];
      save(KEY_MASTER_DATA_CHANGES, next);
      return next;
    });
  }

  function recordDriverMasterDataChanges(previous, driver, reason, action) {
    const fields = [
      ["name", "name"],
      ["email", "email"],
      ["phone", "phone"],
      ["status", "status"],
      ["lastReviewed", "last_reviewed"],
      ["notes", "notes"],
    ];
    const previousRecord = previous ? normaliseDriverRecord(previous) : null;
    const nextRecord = normaliseDriverRecord(driver);
    const changedAt = isoNow();
    const rows = fields
      .map(([key, field]) => {
        const oldValue = previousRecord ? String(previousRecord[key] || "") : "";
        const newValue = String(nextRecord[key] || "");
        if (previousRecord && oldValue === newValue) return null;
        if (!previousRecord && !newValue) return null;
        return {
          id: `mdc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          changeType: "driver_record",
          targetId: nextRecord.id,
          targetLabel: nextRecord.name || nextRecord.email || nextRecord.id,
          changedField: field,
          oldValue,
          newValue,
          reason,
          action,
          status: "executed",
          adminId: session?.user?.id || "local-admin",
          changedAt,
        };
      })
      .filter(Boolean);
    if (rows.length === 0) return;
    setMasterDataChanges(prev => {
      const next = [...prev, ...rows];
      save(KEY_MASTER_DATA_CHANGES, next);
      return next;
    });
  }

  function updateOrder(upd) {
    const previous = orders.find(o => o.id === upd.id);
    const next = orders.map(o => o.id === upd.id ? upd : o);
    setOrders(next); save(KEY_ORDERS, next);
    writeAudit("Order updated", `${upd.id} set to ${upd.status}`);
    recordOrderStatusNotice(previous, upd);
  }

  function updateOrders(updates, auditDetail = "Bulk order update") {
    const updateMap = new Map((updates || []).map(order => [order.id, order]));
    if (updateMap.size === 0) return;
    const previousById = new Map(orders.map(order => [order.id, order]));
    const next = orders.map(order => updateMap.get(order.id) || order);
    setOrders(next); save(KEY_ORDERS, next);
    updates.forEach(update => recordOrderStatusNotice(previousById.get(update.id), update));
    writeAudit("Orders updated", auditDetail, "admin");
  }

  function addOrder(o) {
    const next = [o, ...orders];
    setOrders(next); save(KEY_ORDERS, next);
    writeAudit("Pickup request created", `${o.id} for ${o.clientName}, supplier ${o.vendor}, run ${o.actualRunDate || o.date}`, "client");
    createOperationalNotice({
      clientId: o.clientId,
      clientName: o.clientName,
      orderId: o.id,
      noticeType: "pickup_request_submitted",
      subject: `Pickup request received - ${o.id}`,
      message: `${o.vendor} pickup request was recorded for run ${fmtFullDate(o.actualRunDate || o.date)}. Con note ${o.conNote}.`,
      eventRef: o.submittedAt || "",
      createdBy: "client",
    });
    if (o.scheduleAdjusted || o.cutoffApplied) {
      const adjustmentLabel = runDateAdjustmentLabel(o.scheduleAdjustmentReason);
      createOperationalNotice({
        clientId: o.clientId,
        clientName: o.clientName,
        orderId: o.id,
        noticeType: "schedule_adjusted",
        subject: `Run date adjusted - ${o.id}`,
        message: `${adjustmentLabel}. Requested ${fmtFullDate(o.requestedDate)}; scheduled ${fmtFullDate(o.actualRunDate || o.date)}.`,
        eventRef: o.actualRunDate || o.date,
        createdBy: "system",
      });
    }
  }

  function cancelOrderBeforeCollection(order, reason, actor = session?.role || "admin") {
    const state = cancellationState(order);
    if (orderGoodsCollected(order)) {
      showWorkflowNotice("Policy #14 blocks cancellation after goods have been collected. Treat refusal as Failed Delivery.");
      writeAudit("Order cancellation blocked", `${order.id}: goods already collected`, actor);
      return;
    }
    const cancelledAt = isoNow();
    const updated = {
      ...order,
      status: "Cancelled",
      cancelledAt,
      cancelledBy: actor,
      cancellationReason: reason || state.reason,
      cancellationPolicyRef: "Policy #14",
      cancellationCutoffDate: cancellationCutoffDate(order),
      billable: false,
      driverId: null,
      driverName: null,
      vehicleId: null,
      vehicleName: "",
      runId: null,
    };
    const next = orders.map(item => item.id === order.id ? updated : item);
    setOrders(next); save(KEY_ORDERS, next);
    writeAudit("Order cancelled", `${order.id}: ${updated.cancellationReason}; no billable record before goods collected`, actor);
    recordOrderStatusNotice(order, updated);
  }

  function requestCancellationReview(order, note) {
    const state = cancellationState(order);
    if (!state.canRequestAdminReview) {
      writeAudit("Cancellation review blocked", `${order.id}: ${state.reason}`, "client");
      return;
    }
    addException({
      type: "Cancellation Request",
      orderId: order.id,
      owner: "Admin",
      note: `${order.clientName}: ${note}. Policy #14 post-cut-off Admin judgment required. Goods collected: ${orderGoodsCollected(order) ? "yes" : "no"}.`,
      status: "Open",
      source: "Policy #14 / APP-ADM-001",
      severity: "Medium",
    });
    writeAudit("Cancellation review requested", `${order.id}: ${note}`, "client");
    createOperationalNotice({
      clientId: order.clientId,
      clientName: order.clientName,
      orderId: order.id,
      noticeType: "cancellation_requested",
      subject: `Cancellation review requested - ${order.id}`,
      message: `Your post-cut-off cancellation request was recorded for Admin review under Policy #14. Note: ${note}`,
      eventRef: order.id,
      createdBy: "client",
      policyRef: "Policy #14 / APP-ADM-001 / notification provider gap",
    });
  }

  function addClient(c) {
    const next = [...clients, c];
    setClients(next); save(KEY_CLIENTS, next);
    setShowReg(false);
    setSession({ role: "client", user: c });
    writeAudit("Customer registration submitted", `${c.name} pending Admin activation`, "client");
  }

  function updateClient(updated) {
    const auditDetail = updated.auditDetail;
    const auditActor = updated.auditActor;
    const stored = { ...updated };
    delete stored.auditDetail;
    delete stored.auditActor;
    const previous = clients.find(c => c.id === stored.id);
    const previousSuppliers = (previous?.vendors || []).join(", ");
    const nextSuppliers = (stored.vendors || []).join(", ");
    const next = previous ? clients.map(c => c.id === stored.id ? stored : c) : [stored, ...clients];
    setClients(next); save(KEY_CLIENTS, next);
    if (session?.user?.id === stored.id) setSession({ ...session, user: stored });
    recordAccountStatusNotices(previous, stored);
    if (!previous) {
      writeAudit("Customer account created", auditDetail || `${stored.name} CRM workshop record created`, "admin");
      return;
    }
    writeAudit(
      "Customer account updated",
      auditDetail || (previousSuppliers !== nextSuppliers ? `${stored.name} supplier access: ${nextSuppliers || "None approved"}` : `${stored.name} set to ${stored.status || "Active"}`),
      auditActor || "admin"
    );
  }

  function saveSupplier(supplier, reason = "Not recorded") {
    const previous = suppliers.find(s => s.id === supplier.id);
    const exists = Boolean(previous);
    const next = exists ? suppliers.map(s => s.id === supplier.id ? supplier : s) : [supplier, ...suppliers];
    setSuppliers(next); save(KEY_SUPPLIERS, next);
    recordSupplierMasterDataChanges(previous, supplier, reason, exists ? "update" : "add");
    writeAudit(exists ? "Supplier updated" : "Supplier added", `${supplier.name}: ${reason}`, "admin");
  }

  function archiveSupplier(id, reason = "Not recorded") {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) {
      writeAudit("Supplier archive blocked", `${id}: supplier not found`, "admin");
      return;
    }
    const openWork = orders.filter(o => o.vendor === supplier?.name && ["Pending", "En Route", "Brought Forward"].includes(o.status));
    if (openWork.length > 0) {
      showWorkflowNotice(`Cannot archive ${supplier?.name || "supplier"} while ${openWork.length} open work item(s) still reference it.`);
      writeAudit("Supplier archive blocked", `${supplier?.name || id}: ${openWork.length} open work item(s)`, "admin");
      return;
    }
    const archivedSupplier = { ...supplier, status: "Archived", lastReviewed: todayBrisbane(), archivedAt: isoNow(), archivedReason: reason };
    const next = suppliers.map(s => s.id === id ? archivedSupplier : s);
    setSuppliers(next); save(KEY_SUPPLIERS, next);
    recordSupplierMasterDataChanges(supplier, archivedSupplier, reason, "archive");
    writeAudit("Supplier archived", `${supplier.name}: ${reason}`, "admin");
  }

  function savePriceRule(rule, meta = { reason: "Not recorded", ownerApprovalRef: "", effectiveDate: "" }) {
    const previous = priceRules.find(r => r.id === rule.id);
    const exists = Boolean(previous);
    const storedRule = {
      ...rule,
      ownerApprovalRef: meta?.ownerApprovalRef || rule.ownerApprovalRef || "",
      lastChangeReason: meta?.reason || rule.lastChangeReason || "",
      lastChangeAt: isoNow(),
      lastChangedBy: session?.user?.id || "local-admin",
    };
    recordPricingMasterDataChanges(previous, storedRule, meta, exists ? "update" : "add");
    const next = exists ? priceRules.map(r => r.id === storedRule.id ? storedRule : r) : [storedRule, ...priceRules];
    setPriceRules(next); save(KEY_PRICE_RULES, next);
    writeAudit(exists ? "Pricing rule updated" : "Pricing rule added", `${storedRule.label} $${priceRuleDollars(storedRule).toFixed(2)}; reason ${meta?.reason || "Not recorded"}; owner approval ${meta?.ownerApprovalRef || "Not recorded"}`, "admin");
  }

  function saveVehicle(vehicle, reason = "Not recorded") {
    const previous = vehicles.find(v => v.id === vehicle.id);
    const exists = Boolean(previous);
    const storedVehicle = {
      ...vehicle,
      lastReviewed: vehicle.lastReviewed || todayBrisbane(),
      updatedAt: isoNow(),
      updatedBy: session?.user?.id || "local-admin",
    };
    const next = exists ? vehicles.map(v => v.id === storedVehicle.id ? storedVehicle : v) : [storedVehicle, ...vehicles];
    setVehicles(next); save(KEY_VEHICLES, next);
    recordVehicleMasterDataChanges(previous, storedVehicle, reason, exists ? "update" : "add");
    writeAudit(exists ? "Vehicle updated" : "Vehicle added", `${vehicleLabel(storedVehicle) || storedVehicle.id}: ${reason}`, "admin");
  }

  function saveDriver(driver, reason = "Not recorded") {
    const previous = drivers.find(d => d.id === driver.id);
    const exists = Boolean(previous);
    const storedDriver = normaliseDriverRecord({
      ...driver,
      updatedAt: isoNow(),
      updatedBy: session?.user?.id || "local-admin",
    });
    const next = exists ? drivers.map(d => d.id === storedDriver.id ? storedDriver : d) : [storedDriver, ...drivers];
    setDrivers(next); save(KEY_DRIVERS, next);
    recordDriverMasterDataChanges(previous, storedDriver, reason, exists ? "update" : "add");
    writeAudit(exists ? "Driver directory updated" : "Driver directory added", `${storedDriver.name || storedDriver.id}: ${reason}`, "admin");
  }

  function addException(e, actor = session?.role || "system") {
    const event = { ...e, id: `ex-${Date.now()}-${Math.random().toString(16).slice(2)}`, createdAt: isoNow(), status: e.status || "Open" };
    setExceptions(prev => {
      const next = [event, ...prev];
      save(KEY_EXCEPTIONS, next);
      return next;
    });
    writeAudit("Exception recorded", `${event.type} on ${event.orderId}: ${event.note}`, actor);
  }

  useEffect(() => {
    const failedRows = notificationFailureRows(operationalNotices, billingNotices);
    if (failedRows.length === 0) return;
    const existingKeys = new Set(
      exceptions
        .filter(exception => exception.type === "Notification Failure")
        .map(exception => exception.notificationFailureKey || `${exception.noticeTable}:${exception.noticeId}`)
    );
    const missingRows = failedRows.filter(row => !existingKeys.has(row.key));
    if (missingRows.length === 0) return;
    const createdAt = isoNow();
    const createdExceptions = missingRows.map(row => ({
      id: `ex-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: "Notification Failure",
      orderId: row.reference,
      noticeTable: row.noticeTable,
      noticeId: row.noticeId,
      notificationFailureKey: row.key,
      owner: "Admin",
      note: `${row.type} failed for ${row.reference}. Status: ${row.status}. Subject: ${row.subject}.`,
      status: "Open",
      source: row.policyRef,
      severity: "High",
      createdAt,
    }));
    setExceptions(prev => {
      const prevKeys = new Set(
        prev
          .filter(exception => exception.type === "Notification Failure")
          .map(exception => exception.notificationFailureKey || `${exception.noticeTable}:${exception.noticeId}`)
      );
      const stillMissing = createdExceptions.filter(exception => !prevKeys.has(exception.notificationFailureKey));
      if (stillMissing.length === 0) return prev;
      const next = [...stillMissing, ...prev];
      save(KEY_EXCEPTIONS, next);
      return next;
    });
    writeAudit("Notification failure exception queued", `${missingRows.length} failed notification(s) routed to APP-ADM-005`, "system");
  }, [operationalNotices, billingNotices]);

  function createSupplierReviewException(row) {
    const supplier = row?.supplier || row;
    if (!supplier) return;
    const existing = exceptions.find(exception => exception.type === "Supplier Master Data Review" && exception.orderId === supplier.id && exception.status !== "Closed");
    if (existing) {
      writeAudit("Supplier review flag duplicate blocked", `${supplier.name}: ${existing.id}`, "admin");
      return;
    }
    const reasons = row?.reasons?.length ? row.reasons : supplierReviewReasons(supplier);
    if (!reasons.length) return;
    addException({
      type: "Supplier Master Data Review",
      orderId: supplier.id,
      supplierId: supplier.id,
      owner: "Admin",
      note: `${supplier.name}: ${reasons.join("; ")}`,
      status: "Open",
      source: "SOP-MDM-01 / CAP-MCL-001 / POL-MCL-001-001",
      severity: reasons.some(reason => reason.includes("POL-MCL-001-001") || reason.includes("review due")) ? "High" : "Medium",
    });
    writeAudit("Supplier review flag queued", `${supplier.name}: ${reasons.join("; ")}`, "admin");
  }

  function createSupplierPickupStandardsException(row) {
    const supplier = row?.supplier || row;
    if (!supplier) return;
    const existing = exceptions.find(exception => exception.type === "Supplier Pickup Standards Review" && exception.orderId === supplier.id && exception.status !== "Closed");
    if (existing) {
      writeAudit("Supplier pickup standards duplicate blocked", `${supplier.name}: ${existing.id}`, "admin");
      return;
    }
    const reasons = row?.reasons?.length ? row.reasons : supplierPickupStandardsRows([supplier], orders, exceptions)[0]?.reasons || [];
    if (!reasons.length) return;
    addException({
      type: "Supplier Pickup Standards Review",
      orderId: supplier.id,
      supplierId: supplier.id,
      owner: "Admin",
      note: `${supplier.name}: ${reasons.join("; ")}. Policy #15 / Policy #16 require goods ready by 10:00am, labelled, accepted against item-specific standards, properly packaged, final at the dock, and No Pickup recorded per customer with no billable row.`,
      status: "Open",
      source: "Policy #15 / Policy #16 / CAP-MCL-001 / APP-SRM-001a",
      severity: reasons.some(reason => reason.includes("packaging") || reason.includes("refusal")) ? "High" : "Medium",
    });
    writeAudit("Supplier pickup standards flag queued", `${supplier.name}: ${reasons.join("; ")}`, "admin");
  }

  function createPricingReviewException(row) {
    const rule = row?.rule || row;
    if (!rule) return;
    const existing = exceptions.find(exception => exception.type === "Pricing Master Data Review" && exception.orderId === rule.id && exception.status !== "Closed");
    if (existing) {
      writeAudit("Pricing review flag duplicate blocked", `${rule.label || rule.id}: ${existing.id}`, "admin");
      return;
    }
    const reasons = row?.reasons?.length ? row.reasons : priceRuleReviewReasons(rule);
    if (!reasons.length) return;
    addException({
      type: "Pricing Master Data Review",
      orderId: rule.id,
      priceRuleId: rule.id,
      owner: "Admin",
      note: `${rule.label || rule.id}: ${reasons.join("; ")}`,
      status: "Open",
      source: "Policy #9 / SOP-MDM-02",
      severity: reasons.some(reason => reason.includes("change log") || reason.includes("Owner approval")) ? "High" : "Medium",
    });
    writeAudit("Pricing review flag queued", `${rule.label || rule.id}: ${reasons.join("; ")}`, "admin");
  }

  function createUnmatchedBillingException(row, actor = session?.role || "admin") {
    const order = row?.order || row;
    if (!order) return false;
    const existing = exceptions.find(exception => exception.type === "Unmatched Billing Account" && exception.orderId === order.id && exception.status !== "Closed");
    if (existing) {
      writeAudit("Unmatched billing account duplicate blocked", `${order.id}: ${existing.id}`, actor);
      return false;
    }
    const match = row?.match || billingAccountMatchState(order, clients);
    const reasons = match?.reasons?.length ? match.reasons : [match?.reason || "billing account match failed"];
    addException({
      type: "Unmatched Billing Account",
      orderId: order.id,
      proofId: order.proofId || "",
      owner: "Admin",
      note: `${order.id}: ${reasons.join("; ")}. SOP-EXC-03 excludes this work from billing groups until Admin corrects account_id using POD proof and pickup capture evidence.`,
      status: "Open",
      source: "SOP-EXC-03 / Policy #10a / APP-ADM-005",
      severity: reasons.some(reason => reason.includes("multiple") || reason.includes("missing")) ? "High" : "Medium",
      unmatchedBillingReason: reasons,
      billingAccountCandidateIds: (match?.candidates || []).map(client => client.id),
    }, actor);
    writeAudit("Unmatched billing account queued", `${order.id}: ${reasons.join("; ")}`, actor);
    return true;
  }

  function createRunPlanningException(row, actor = session?.role || "admin") {
    if (!row?.runDate) return false;
    const existing = exceptions.find(exception => exception.type === "Run Planning Exception" && exception.orderId === row.runDate && exception.status !== "Closed");
    if (existing) {
      writeAudit("Run planning exception duplicate blocked", `${row.runDate}: ${existing.id}`, actor);
      return false;
    }
    const reasons = (row.reasons || []).filter(reason => reason !== "No dispatchable stops for this run date");
    if (!reasons.length) return false;
    addException({
      type: "Run Planning Exception",
      orderId: row.runDate,
      runDate: row.runDate,
      owner: "Admin",
      note: `CAP-MCL-002 / APP-ADM-002 run ${fmtFullDate(row.runDate)}: ${reasons.join("; ")}. Night-before compile due ${fmtFullDate(row.compileDueDate)}. Local monitor only; production pg_cron automation remains unconnected.`,
      status: "Open",
      source: "CAP-MCL-002 / APP-ADM-002 / POL-MCL-002-001",
      severity: row.overdue ? "High" : "Medium",
    }, actor);
    writeAudit("Run planning exception queued", `${row.runDate}: ${reasons.join("; ")}`, actor);
    return true;
  }

  useEffect(() => {
    const rows = unmatchedBillingAccountRows(orders, clients, exceptions)
      .filter(row => !row.openException);
    if (rows.length === 0) return;
    rows.forEach(row => createUnmatchedBillingException(row, "system"));
  }, [orders, clients, exceptions]);

  function acknowledgeException(id, investigation = null) {
    const closedAt = isoNow();
    setExceptions(prev => {
      const next = prev.map(e => e.id === id ? { ...e, status: "Closed", closedAt, investigation } : e);
      save(KEY_EXCEPTIONS, next);
      return next;
    });
    writeAudit("Exception closed", investigation ? `${id}: ${investigation.outcome}` : id, "admin");
  }

  function updateException(id, patch, auditDetail = "Exception updated", actor = "admin") {
    const updatedAt = isoNow();
    setExceptions(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...patch, updatedAt } : e);
      save(KEY_EXCEPTIONS, next);
      return next;
    });
    writeAudit("Exception updated", `${id}: ${auditDetail}`, actor);
  }

  function acknowledgeExceptionAlert(alert) {
    const next = [alert, ...exceptionAlerts.filter(item => item.id !== alert.id)];
    setExceptionAlerts(next); save(KEY_EXCEPTION_ALERTS, next);
    writeAudit("Daily exception alert reviewed", `${alert.alertDate}: ${alert.openExceptionCount} open, ${alert.proofLinkedCount} proof-linked`, "admin");
  }

  function saveDriverAvailability(record) {
    const resolved = normaliseDriverAvailabilityRecord(record);
    const nextRecord = {
      ...resolved,
      id: resolved.id || `driver-availability-${Date.now()}`,
      recordedAt: isoNow(),
      recordedBy: session?.user?.id || "local-admin",
    };
    const next = [nextRecord, ...driverAvailability.filter(item => !(item.driverId === nextRecord.driverId && item.availabilityDate === nextRecord.availabilityDate))];
    setDriverAvailability(next); save(KEY_DRIVER_AVAILABILITY, next);
    writeAudit("Driver availability recorded", `${nextRecord.driverName || nextRecord.driverId} ${nextRecord.status} on ${nextRecord.availabilityDate}`, "admin");
  }

  function saveAccessChange(record, action, reason, reviewType = "other") {
    const now = isoNow();
    const previous = accessOverrides.find(item => item.key === record.key);
    const normalisedReviewType = accessReviewTypeAllowed(reviewType) ? reviewType : "other";
    const reviewRecord = {
      id: `access-review-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      action,
      reviewType: normalisedReviewType,
      outcome: accessReviewOutcome(action),
      reason,
      reviewedBy: "admin",
      reviewedAt: now,
    };
    const nextRecord = {
      ...(previous || {}),
      key: record.key,
      role: record.role,
      roleLabel: record.roleLabel,
      actorCode: record.actorCode,
      subjectId: record.subjectId,
      subjectName: record.subjectName,
      accountName: record.accountName,
      email: record.email,
      updatedAt: now,
      reviewedAt: now,
      lastReviewType: normalisedReviewType,
      lastReviewReason: reason,
      accessReviewRecords: [reviewRecord, ...(Array.isArray(previous?.accessReviewRecords) ? previous.accessReviewRecords : [])].slice(0, 25),
    };
    if (action === "revoke") {
      nextRecord.status = "Revoked";
      nextRecord.revokedAt = now;
      nextRecord.revokedReason = reason;
      nextRecord.revokedReviewType = normalisedReviewType;
    } else if (action === "restore") {
      nextRecord.status = "Active";
      nextRecord.restoredAt = now;
      nextRecord.restoredReason = reason;
      nextRecord.restoredReviewType = normalisedReviewType;
    } else {
      nextRecord.status = previous?.status || record.status || "Active";
    }
    const next = [nextRecord, ...accessOverrides.filter(item => item.key !== record.key)];
    setAccessOverrides(next); save(KEY_ACCESS_OVERRIDES, next);
    const actionLabel = action === "revoke" ? "Access role revoked" : action === "restore" ? "Access role restored" : "Access role reviewed";
    writeAudit(actionLabel, `${record.roleLabel} ${record.email}: ${accessReviewTypeLabel(normalisedReviewType)}; ${reason}`, "admin");
  }

  function recordAccessDenied(record) {
    writeAudit("Login blocked by revoked access", `${record.roleLabel} ${record.email}`, "system");
  }

  function addDeliveryProof(proof) {
    const storedProof = normaliseDeliveryProof(proof, orders);
    const storedProofOrderIds = new Set(storedProof.groupOrderIds || []);
    if (storedProof.orderId) storedProofOrderIds.add(storedProof.orderId);
    const matchedOrders = orders.filter(order =>
      storedProofOrderIds.has(order.id) ||
      order.deliveryId === storedProof.deliveryId ||
      (storedProof.deliveryStopKey && (order.deliveryStopKey === storedProof.deliveryStopKey))
    );
    const duplicateProof = proofs.some(item => {
      const itemOrderIds = new Set(item.groupOrderIds || []);
      if (item.orderId) itemOrderIds.add(item.orderId);
      return item.id === storedProof.id ||
        item.deliveryId === storedProof.deliveryId ||
        [...storedProofOrderIds].some(orderId => itemOrderIds.has(orderId));
    });
    if (duplicateProof || matchedOrders.some(order => order.proofId)) {
      writeAudit("Delivery proof duplicate blocked", `${storedProof.orderId}: immutable proof already exists`, "system");
      return;
    }
    const next = [storedProof, ...proofs];
    setProofs(next); save(KEY_PROOFS, next);
    writeAudit("Delivery proof stored", `${storedProof.orderId} receiver ${storedProof.receiverName}; ${storedProof.signaturePath}; group size ${storedProof.deliveryGroupSize || 1}; SOP-DEL-04 sign-off evidence captured`, "driver");
    if (matchedOrders.length === 0) {
      addException({
        type: "Delivery Completion Failure",
        orderId: storedProof.orderId || storedProof.deliveryId,
        owner: "Admin",
        note: `SOP-DEL-05 proof insert succeeded but no matching work item was found. Proof ${storedProof.id}.`,
        status: "Open",
        source: "SOP-DEL-05 / APP-DRV-003",
        severity: "High",
      });
      writeAudit("Delivery completion failed", `${storedProof.id}: no matching work item`, "system");
      return;
    }
    const deliveredAt = storedProof.deliveredAt || storedProof.capturedAt || isoNow();
    const completedIds = new Set(matchedOrders.map(order => order.id));
    const completedById = new Map();
    matchedOrders.forEach(order => {
      const orderPrice = Number(order.pickupCalculatedPrice || order.price || 0);
      completedById.set(order.id, {
        ...order,
        status: "Delivered",
        deliveryId: storedProof.deliveryId || deliveryIdForOrder(order),
        deliveryStopKey: storedProof.deliveryStopKey || order.deliveryStopKey || deliveryStopKeyForOrder(order),
        deliveryGroupId: storedProof.deliveryId || order.deliveryGroupId || "",
        deliveryGroupSize: matchedOrders.length,
        deliverySignatureScope: "SOP-DEL-01 one signature per account/address",
        recvName: storedProof.receiverName,
        sig: storedProof.signatureUrl,
        price: orderPrice || (matchedOrders.length === 1 ? Number(storedProof.price || 0) : 0),
        proofId: storedProof.id,
        deliveredAt,
        itemType: order.itemType || order.pickupItemType || storedProof.itemType || "",
        itemQty: order.itemQty || order.pickupItemQty || storedProof.itemQty || "",
        weightBand: order.weightBand || order.pickupWeightBand || storedProof.weightBand || "",
        priceRuleId: order.priceRuleId || order.pickupPriceRuleId || storedProof.priceRuleId || "",
        deliverySignoffAddressConfirmed: Boolean(storedProof.signoffAddressConfirmed),
        deliverySignoffGoodsMatched: Boolean(storedProof.signoffGoodsMatched),
        deliverySignoffAuthorisedReceiverConfirmed: Boolean(storedProof.signoffAuthorisedReceiverConfirmed),
        deliverySignoffHandoverConfirmed: Boolean(storedProof.signoffHandoverConfirmed),
        deliverySignoffPriceReviewed: Boolean(storedProof.signoffPriceReviewed),
        deliverySignoffDeviceSupervised: Boolean(storedProof.signoffDeviceSupervised),
        deliverySignoffPolicyRef: storedProof.deliverySignoffPolicyRef || "SOP-DEL-04 / APP-DRV-003",
        deliveryCompletionSource: "SOP-DEL-01 grouped stop / SOP-DEL-05 delivery_proof insert",
        deliveryCompletedBy: "system",
        deliveryCompletedAt: deliveredAt,
        billingReady: true,
        billingReadyAt: deliveredAt,
        billingReadySource: "SOP-DEL-05",
      });
    });
    const nextOrders = orders.map(order => completedIds.has(order.id) ? completedById.get(order.id) : order);
    setOrders(nextOrders); save(KEY_ORDERS, nextOrders);
    matchedOrders.forEach(previous => recordOrderStatusNotice(previous, completedById.get(previous.id)));
    writeAudit("Delivery completed by system", `${matchedOrders.map(order => order.id).join(", ")}: proof ${storedProof.id}; grouped stop billing-ready under SOP-DEL-01 / SOP-DEL-04 / SOP-DEL-05`, "system");
  }

  function raiseClientDispute(order, disputeInput) {
    const receivedAt = isoNow();
    const dispute = normalisePolicy18Dispute(disputeInput, {
      reason: "goods_not_received",
      orderId: order.id,
      deliveryDate: isoDate(order.deliveredAt || order.failedDeliveryAt || order.actualRunDate || order.date),
    });
    const linkedInvoice = policy18InvoiceForOrder(order, invoices);
    const window = disputeInput?.window || policy18DisputeWindowForInvoice(linkedInvoice, isoDate(receivedAt));
    const timing = window.timingLabel || "Invoice date unavailable - Admin timing review required";
    const description = `${dispute.reasonLabel}; order ${order.id}; con note ${order.conNote || "not recorded"}; delivery date ${dispute.deliveryDate || "not recorded"}; ${timing}. Client note: ${dispute.note}`;
    addException({
      type: "Delivery Dispute",
      orderId: order.id,
      owner: "Admin",
      note: `${order.clientName}: ${description}`,
      status: "Open",
      source: "Policy #18 / APP-DRV-003 / APP-ADM-005",
      policyRef: "Policy #18",
      severity: window.after30 ? "High" : "Medium",
      disputeReason: dispute.reason,
      disputeReasonLabel: dispute.reasonLabel,
      disputedDeliveryDate: dispute.deliveryDate,
      disputedOrderId: order.id,
      conNote: order.conNote || "",
      invoiceId: linkedInvoice?.id || "",
      invoiceDate: window.invoiceDate || "",
      daysSinceInvoice: window.daysSinceInvoice,
      policy18TimingStatus: window.timingStatus,
      policy18TimingLabel: timing,
      raisedAt: receivedAt,
      ownerEscalationStatus: "Not Requested",
    });
    writeAudit("Client dispute raised", `${order.id}: ${description}`, "client");
    createOperationalNotice({
      clientId: order.clientId,
      clientName: order.clientName,
      orderId: order.id,
      noticeType: "dispute_received",
      subject: `Dispute received - ${order.id}`,
      message: `Your delivery dispute was recorded for Admin investigation under Policy #18. Response monitoring is outside this portal; the portal records the received timestamp and investigation evidence. Note: ${dispute.note}`,
      eventRef: order.id,
      createdBy: "client",
      policyRef: "Policy #18 / UJ-CRM-001A / notification provider gap",
    });
  }

  function raiseBillingDispute(invoice, disputeInput, actor = "client_billing") {
    const receivedAt = isoNow();
    const linkedLine = (invoice.lines || []).find(line => line.orderId === disputeInput?.orderId) || (invoice.lines || [])[0] || {};
    const dispute = normalisePolicy18Dispute(disputeInput, {
      reason: "incorrect_charge",
      orderId: linkedLine.orderId || "",
    });
    const window = disputeInput?.window || policy18DisputeWindowForInvoice(invoice, isoDate(receivedAt));
    const timing = window.timingLabel || "Invoice date unavailable - Admin timing review required";
    const description = `${dispute.reasonLabel}; invoice ${invoice.id}; order ${dispute.orderId || "not selected"}; delivery date ${dispute.deliveryDate || "not recorded"}; ${timing}. Client note: ${dispute.note}`;
    addException({
      type: "Billing Dispute",
      orderId: invoice.id,
      owner: "Admin",
      note: `${invoice.clientName}: ${description}`,
      status: "Open",
      source: "Policy #18 / APP-DRV-002 / APP-ADM-004 / APP-ADM-005",
      policyRef: "Policy #18",
      severity: window.after30 ? "High" : "Medium",
      disputeReason: dispute.reason,
      disputeReasonLabel: dispute.reasonLabel,
      disputedDeliveryDate: dispute.deliveryDate,
      disputedOrderId: dispute.orderId || "",
      invoiceId: invoice.id,
      invoiceLineOrderId: dispute.orderId || "",
      invoiceDate: window.invoiceDate || "",
      daysSinceInvoice: window.daysSinceInvoice,
      policy18TimingStatus: window.timingStatus,
      policy18TimingLabel: timing,
      raisedAt: receivedAt,
      ownerEscalationStatus: "Not Requested",
    });
    writeAudit("Billing dispute raised", `${invoice.id}: ${description}`, actor);
    const audience = actor === "client_operational" ? "client_operational" : "client_billing";
    createOperationalNotice({
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      orderId: invoice.id,
      noticeType: "billing_query_received",
      audience,
      subject: `Billing query received - ${invoice.id}`,
      message: `Your billing query was recorded for Admin investigation under Policy #18. Response monitoring is outside this portal; the portal records the received timestamp and investigation evidence. Note: ${dispute.note}`,
      eventRef: invoice.id,
      createdBy: actor,
      policyRef: "UJ-CRM-001B / Policy #18 / notification provider gap",
    });
  }

  function requestSupplierSetup(client, request) {
    const selected = (request.supplierNames || []).join(", ") || "No supplier selected";
    const note = request.note ? ` Note: ${request.note}` : "";
    addException({ type: "Supplier Setup", orderId: client.id, owner: "Admin", note: `${client.name} requested supplier setup. Suppliers: ${selected}.${note}`, status: "Open" });
    writeAudit("Supplier setup requested", `${client.name}: ${selected}`, "client");
    createOperationalNotice({
      clientId: client.id,
      clientName: client.name,
      orderId: client.id,
      noticeType: "supplier_setup_requested",
      subject: "Supplier setup request received",
      message: `Admin supplier setup review was recorded. Requested suppliers: ${selected}.${note}`,
      eventRef: client.id,
      createdBy: "client",
    });
  }

  function createInvoice(client, invoiceOrders, redeliveryFeeOrders = []) {
    const deliveryLines = invoiceOrders.map(order => ({
      orderId: order.id,
      vendor: order.vendor,
      description: order.itemType || order.conNote,
      amount: Number(order.price || 0),
      proofId: order.proofId || null,
      lineType: "delivery",
    }));
    const redeliveryLines = redeliveryFeeOrders.map(order => ({
      orderId: order.id,
      vendor: order.vendor,
      description: "Policy #8 redelivery fee after second failed delivery attempt",
      amount: Number(order.redeliveryFeeAmount || 10),
      proofId: null,
      lineType: "redelivery_fee",
      policyRef: "Policy #8",
      feeReviewAt: order.redeliveryFeeReviewedAt || "",
    }));
    const lines = [...deliveryLines, ...redeliveryLines];
    const subtotal = lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);
    const gst = Math.round(subtotal * 0.1 * 100) / 100;
    const createdAt = isoNow();
    const invoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      clientId: client.id,
      clientName: client.name,
      billingEmail: client.billingContact?.email || client.email,
      status: "Draft",
      createdAt,
      billingGroupApprovedAt: createdAt,
      billingGroupApprovedBy: "admin",
      billingGroupApprovalSource: "SOP-BIL-04 approved billing group",
      invoiceApprovalStatus: "Pending Review",
      invoiceApprovedAt: "",
      invoiceApprovedBy: "",
      invoiceApprovalSource: "",
      invoiceApprovalNote: "",
      dueDate: addDays(todayBrisbane(), 7),
      subtotal,
      gst,
      total: subtotal + gst,
      lines,
    };
    const nextInvoices = [...invoices, invoice];
    setInvoices(nextInvoices); save(KEY_INVOICES, nextInvoices);
    const invoicedOrderIds = new Set(invoiceOrders.map(order => order.id));
    const invoicedRedeliveryIds = new Set(redeliveryFeeOrders.map(order => order.id));
    const nextOrders = orders.map(order => {
      if (invoicedOrderIds.has(order.id)) return { ...order, invoiceId: invoice.id };
      if (invoicedRedeliveryIds.has(order.id)) return { ...order, redeliveryInvoiceId: invoice.id, redeliveryFeeBilledAt: isoNow() };
      return order;
    });
    setOrders(nextOrders); save(KEY_ORDERS, nextOrders);
    writeAudit("Draft invoice created", `${invoice.id} for ${client.name}, total ${invoice.total}; ${deliveryLines.length} delivery line(s), ${redeliveryLines.length} Policy #8 redelivery fee line(s)`, "admin");
  }

  function updateInvoice(invoice) {
    const previous = invoices.find(item => item.id === invoice.id);
    const next = invoices.map(item => item.id === invoice.id ? invoice : item);
    setInvoices(next); save(KEY_INVOICES, next);
    const approvalChanged = invoice.invoiceApprovedAt && invoice.invoiceApprovedAt !== previous?.invoiceApprovedAt;
    const dispatchChanged = invoice.dispatchRecordedAt && invoice.dispatchRecordedAt !== previous?.dispatchRecordedAt;
    const paymentChanged = invoice.status === "Paid" && invoice.paymentEvidence && (previous?.status !== "Paid" || invoice.paymentEvidence !== previous?.paymentEvidence || invoice.paidAt !== previous?.paidAt);
    const policy18Changed = invoice.policy18LastOutcome && invoice.policy18LastOutcomeAt !== previous?.policy18LastOutcomeAt;
    const detail = approvalChanged && dispatchChanged
      ? `${invoice.id} confirmed correct under SOP-BIL-04 and dispatch triggered automatically for ${invoice.dispatchRecipient || invoice.billingEmail}; external status ${invoice.dispatchExternalStatus || "not recorded"}; note ${invoice.invoiceApprovalNote}`
      : approvalChanged
      ? `${invoice.id} confirmed correct under SOP-BIL-04: ${invoice.invoiceApprovalNote}`
      : dispatchChanged
      ? `${invoice.id} dispatch recorded for ${invoice.dispatchRecipient || invoice.billingEmail}; channel ${invoice.dispatchChannel || "local_record_only"}; external status ${invoice.dispatchExternalStatus || "not recorded"}; note ${invoice.dispatchNote}`
      : paymentChanged
      ? `${invoice.id} set to Paid with local payment evidence: ${invoice.paymentEvidence}`
      : policy18Changed
      ? `${invoice.id} Policy #18 dispute outcome recorded: ${invoice.policy18LastOutcome}`
      : `${invoice.id} set to ${invoice.status}`;
    writeAudit("Invoice updated", detail, "admin");
  }

  function saveFinancialReconciliation(record) {
    const stored = normaliseFinancialReconciliation(record);
    const next = [stored, ...financialReconciliations.filter(item => item.period !== stored.period)];
    setFinancialReconciliations(next); save(KEY_FINANCIAL_RECONCILIATIONS, next);
    writeAudit("Financial reconciliation recorded", `${stored.period}: invoices ${stored.invoiceCount || 0}, total $${Number(stored.total || 0).toFixed(2)}, paid $${Number(stored.paidTotal || 0).toFixed(2)}; ${stored.note || "No note"}`, "admin");
  }

  function createAiDraft(record) {
    const stored = normaliseAiDraft({
      ...record,
      status: "Draft Pending Admin Review",
      createdAt: isoNow(),
      createdBy: record.createdBy || "Admin",
      sentAt: "",
      externalDeliveryStatus: "not_sent_provider_not_configured",
      policyRef: POLICY20_AI_USE_SOURCE,
    });
    setAiDrafts(prev => {
      const next = [stored, ...prev];
      save(KEY_AI_DRAFTS, next);
      return next;
    });
    writeAudit("Policy #20 AI draft requested", `${stored.agentId} ${stored.targetName}: ${stored.triggerReason}; Admin review required; provider not configured`, "admin");
  }

  function updateAiDraft(record) {
    const stored = normaliseAiDraft({
      ...record,
      sentAt: "",
      externalDeliveryStatus: "not_sent_provider_not_configured",
      autonomousSendAttempted: false,
      commercialDecisionMade: false,
    });
    if (!POLICY20_AI_DRAFT_STATUSES.includes(stored.status)) {
      writeAudit("Policy #20 AI draft update blocked", `${stored.id}: invalid status ${stored.status}`, "admin");
      return;
    }
    setAiDrafts(prev => {
      const next = prev.map(item => item.id === stored.id ? stored : item);
      save(KEY_AI_DRAFTS, next);
      return next;
    });
    writeAudit("Policy #20 AI draft reviewed", `${stored.agentId} ${stored.status}: ${stored.targetName}; no autonomous send`, "admin");
  }

  function saveDataBreachIncident(record) {
    const existing = dataBreachIncidents.find(item => item.id === record.id);
    const stored = normaliseDataBreachIncident({
      ...record,
      createdAt: existing?.createdAt || record.createdAt || isoNow(),
      updatedAt: isoNow(),
    });
    if (!stored.privacyOwnerName && ["Privacy Owner Assessment", "Notification Required", "Post-Breach Review", "Closed"].includes(stored.status)) {
      writeAudit("Policy #6 NDB progression blocked", `${stored.title}: ${POLICY6_PRIVACY_OWNER_BLOCKER}`, "admin");
      return;
    }
    if (!stored.privacyOwnerName && ["Eligible Data Breach", "Not Eligible"].includes(stored.eligibilityDecision)) {
      writeAudit("Policy #6 eligibility decision blocked", `${stored.title}: ${POLICY6_PRIVACY_OWNER_BLOCKER}`, "admin");
      return;
    }
    setDataBreachIncidents(prev => {
      const next = existing
        ? prev.map(item => item.id === stored.id ? stored : item)
        : [stored, ...prev];
      save(KEY_DATA_BREACH_INCIDENTS, next);
      return next;
    });
    writeAudit(
      existing ? "Policy #6 NDB incident updated" : "Policy #6 NDB incident recorded",
      `${stored.title}: awareness ${stored.awarenessDate}; assessment due ${stored.assessmentDueDate}; ${stored.eligibilityDecision}; APP-PRV-004 preserved ${stored.appPrv004AuditRefs}`,
      "admin"
    );
  }

  function saveDataUseRecord(record) {
    const existing = dataUseRecords.find(item => item.id === record.id);
    const blockers = dataUseBlockedReasons(record);
    const stored = normaliseDataUseRecord({
      ...record,
      blockedReasons: blockers,
      status: blockers.length ? "Blocked" : (record.requestType === "Data Access Breach" ? "Breach Reported" : "Approved"),
      createdAt: existing?.createdAt || record.createdAt || isoNow(),
      updatedAt: isoNow(),
    });
    setDataUseRecords(prev => {
      const next = existing
        ? prev.map(item => item.id === stored.id ? stored : item)
        : [stored, ...prev];
      save(KEY_DATA_USE_RECORDS, next);
      return next;
    });
    writeAudit(
      existing ? "Policy #21 data use updated" : "Policy #21 data use recorded",
      `${stored.title}: ${stored.requestType}; ${stored.status}; requester ${stored.requesterRole} ${stored.requesterName}; ${blockers.length ? blockers.join(" ") : stored.purpose}`,
      "admin"
    );
  }

  function savePrivacyRequest(record) {
    const existing = privacyRequests.find(item => item.id === record.id);
    const stored = normalisePrivacyRequest({
      ...record,
      createdAt: existing?.createdAt || record.createdAt || isoNow(),
      updatedAt: isoNow(),
    });
    setPrivacyRequests(prev => {
      const next = existing
        ? prev.map(item => item.id === stored.id ? stored : item)
        : [stored, ...prev];
      save(KEY_PRIVACY_REQUESTS, next);
      return next;
    });
    writeAudit(
      existing ? "Policy #3 privacy request updated" : "Policy #3 privacy request recorded",
      `${stored.requestType}: ${stored.requesterName}; ${stored.status}; response due ${stored.responseDueDate}; ${stored.status === "Blocked - Privacy Owner Required" ? "Policy #5 Privacy Owner approval required" : stored.requestSummary}`,
      "admin"
    );
  }

  function recordBillingNotice(invoice) {
    if (invoice.status !== "Overdue") {
      showWorkflowNotice("Invoice must be overdue before an overdue notice can be recorded.");
      writeAudit("Billing notice blocked", `${invoice.id} is ${invoice.status}`, "admin");
      return;
    }
    const noticeDue = day8NoticeDueDate(invoice);
    if (todayBrisbane() < noticeDue) {
      showWorkflowNotice(`Day 8 overdue notice is available from ${fmtFullDate(noticeDue)}.`);
      writeAudit("Billing notice blocked", `${invoice.id} Day 8 notice due ${noticeDue}`, "admin");
      return;
    }
    const existing = billingNotices.find(notice => notice.invoiceId === invoice.id && notice.noticeType === "day_8_overdue");
    if (existing) {
      writeAudit("Billing notice duplicate blocked", `${invoice.id} already has Day 8 notice ${existing.id}`, "admin");
      return;
    }
    const client = clients.find(c => c.id === invoice.clientId);
    const notice = buildDay8OverdueNotice(invoice, { client, createdBy: "admin", generationSource: "admin_manual" });
    const next = [notice, ...billingNotices];
    setBillingNotices(next); save(KEY_BILLING_NOTICES, next);
    writeAudit("Day 8 overdue notice recorded", `${invoice.id} for ${invoice.clientName}; local record only`, "admin");
  }

  function closeRun(runClose) {
    const next = [...runClosures, runClose];
    setRunClosures(next); save(KEY_RUN_CLOSES, next);
    writeAudit("Driver run closed", `${runClose.driverName}: ${runClose.deliveredCount} delivered, ${runClose.closeSummary?.noPickupCount || 0} no pickup, ${runClose.closeSummary?.failedDeliveryCount || 0} failed delivery, ${runClose.actionItems?.length || 0} close action item(s), ${runClose.exceptionCount} exceptions`, "driver");
  }

  return (
    <div className="app">
      <style>{css}</style>
      {systemNotice && (
        <PolicyNotice title="System Workflow Rule" system onDismiss={() => setSystemNotice("")}>
          {systemNotice}
        </PolicyNotice>
      )}
      {showReg ? (
        <div className="overlay">
          <RegisterClient suppliers={suppliers} onDone={addClient} onCancel={() => setShowReg(false)} />
        </div>
      ) : liveAuthLoading ? (
        <div className="login-wrap">
          <div className="login-card">
            <div className="login-logo">
              <img src="/moto-and-co-couriers-logo.png" alt="Moto and Co Couriers" />
              <p>Opening portal</p>
            </div>
            <div className="card" style={{ fontSize: ".82rem", color: T.mu }}>Checking your secure session...</div>
          </div>
        </div>
      ) : !workspaceSession ? (
        <Login defaultRole={routeIntent.loginRole} entryNotice={routeIntent.loginNotice} onRegister={() => setShowReg(true)} liveRuntimeStatus={liveRuntimeStatus} liveAuthError={liveAuthError} />
      ) : workspaceSession.role === "client" ? (
        <ClientPortal user={workspaceSession.user} orders={orders} suppliers={suppliers} invoices={invoices} billingNotices={billingNotices} operationalNotices={operationalNotices} proofs={proofs} exceptions={exceptions} initialView={routeIntent.clientInitialView} startNewPickup={Boolean(routeIntent.startNewPickup)} onNewOrder={addOrder} onCancelOrder={cancelOrderBeforeCollection} onCancellationRequest={requestCancellationReview} onDispute={raiseClientDispute} onBillingDispute={raiseBillingDispute} onSupplierSetupRequest={requestSupplierSetup} onUpdateClient={updateClient} onLogout={logout} />
      ) : workspaceSession.role === "billing" ? (
        <BillingContactPortal user={workspaceSession.user} orders={orders} invoices={invoices} billingNotices={billingNotices} operationalNotices={operationalNotices} exceptions={exceptions} onBillingDispute={raiseBillingDispute} onLogout={logout} />
      ) : workspaceSession.role === "driver" ? (
        <DriverPortal user={workspaceSession.user} orders={orders} priceRules={priceRules} exceptions={exceptions} runClosures={runClosures} onUpdateOrder={updateOrder} onUpdateOrders={updateOrders} onDeliveryProof={addDeliveryProof} onException={addException} onRunClose={closeRun} onLogout={logout} />
      ) : (
        <AdminPortal orders={orders} clients={clients} drivers={drivers} vehicles={vehicles} suppliers={suppliers} priceRules={priceRules} exceptions={exceptions} audit={audit} masterDataChanges={masterDataChanges} invoices={invoices} billingNotices={billingNotices} operationalNotices={operationalNotices} proofs={proofs} exceptionAlerts={exceptionAlerts} driverAvailability={driverAvailability} financialReconciliations={financialReconciliations} aiDrafts={aiDrafts} dataBreachIncidents={dataBreachIncidents} dataUseRecords={dataUseRecords} privacyRequests={privacyRequests} accessRecords={accessRecords} runClosures={runClosures} onUpdateOrder={updateOrder} onUpdateOrders={updateOrders} onUpdateClient={updateClient} onSaveSupplier={saveSupplier} onArchiveSupplier={archiveSupplier} onSavePriceRule={savePriceRule} onSaveVehicle={saveVehicle} onSaveDriver={saveDriver} onCreateInvoice={createInvoice} onUpdateInvoice={updateInvoice} onRecordBillingNotice={recordBillingNotice} onSaveFinancialReconciliation={saveFinancialReconciliation} onCreateAiDraft={createAiDraft} onUpdateAiDraft={updateAiDraft} onSaveDataBreachIncident={saveDataBreachIncident} onSaveDataUseRecord={saveDataUseRecord} onSavePrivacyRequest={savePrivacyRequest} onSaveAccessChange={saveAccessChange} onCreateSupplierReviewException={createSupplierReviewException} onCreateSupplierPickupStandardsException={createSupplierPickupStandardsException} onCreatePricingReviewException={createPricingReviewException} onCreateUnmatchedBillingException={createUnmatchedBillingException} onCreateRunPlanningException={createRunPlanningException} onAcknowledgeException={acknowledgeException} onUpdateException={updateException} onAcknowledgeExceptionAlert={acknowledgeExceptionAlert} onSaveDriverAvailability={saveDriverAvailability} onLogout={logout} />
      )}
    </div>
  );
}
