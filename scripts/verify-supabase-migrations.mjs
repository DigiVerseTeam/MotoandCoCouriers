import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const passes = [];

function read(relativePath) {
  const target = path.join(root, relativePath);
  if (!fs.existsSync(target)) {
    failures.push(`${relativePath}: missing`);
    return "";
  }
  return fs.readFileSync(target, "utf8");
}

function requireMarkers(relativePath, markers, label = relativePath) {
  const content = read(relativePath);
  if (!content) return;
  const missing = markers.filter(marker => !content.includes(marker));
  if (missing.length) {
    failures.push(`${label}: missing ${missing.join(", ")}`);
    return;
  }
  passes.push(`${label}: ${markers.length} marker(s) present`);
}

function requireRegex(relativePath, patterns, label = relativePath) {
  const content = read(relativePath);
  if (!content) return;
  const missing = patterns.filter(pattern => !pattern.test(content));
  if (missing.length) {
    failures.push(`${label}: missing ${missing.map(String).join(", ")}`);
    return;
  }
  passes.push(`${label}: ${patterns.length} pattern(s) present`);
}

const migrationDir = path.join(root, "supabase", "migrations");
const files = fs.existsSync(migrationDir)
  ? fs.readdirSync(migrationDir).filter(file => file.endsWith(".sql")).sort()
  : [];

if (files.length < 38) {
  failures.push(`supabase/migrations: expected at least 38 migrations, found ${files.length}`);
} else {
  passes.push(`supabase/migrations: ${files.length} migration files present`);
}

requireMarkers("supabase/migrations/202606180001_release_one_schema.sql", [
  "create table public.actors",
  "create table public.pickup_requests",
  "create table public.delivery_proof",
  "create table public.price_rules",
  "create table public.audit_log",
  "create table public.retention_queue",
  "delivery-proof",
  "enable row level security",
], "release-one base schema");

requireMarkers("supabase/migrations/202606180002_operational_workflows.sql", [
  "prevent_delivery_proof_mutation",
  "prevent_audit_log_mutation",
  "write_pii_audit_log",
  "delivery_proof_pii_audit",
  "invoices",
  "exception_alerts",
], "operational workflow/audit structures");

requireMarkers("supabase/migrations/202606180004_audit_hash_chain.sql", [
  "previous_hash",
  "event_hash",
  "APP-PRV-004-GENESIS",
  "audit_log_hash_chain",
], "APP-PRV-004 audit hash chain");

requireMarkers("supabase/migrations/202606180018_role_access_rls.sql", [
  "client_operational",
  "client_billing",
  "driver",
  "admin",
  "price_rules_admin_only",
  "audit_log_admin_select",
  "delivery_proof_objects_read_by_linked_role",
], "BOAS Sheet 05 role access RLS draft");

requireMarkers("supabase/migrations/202606190034_super_admin_provisioning.sql", [
  "SOP-IAM-03 Admin Master Data & User Provisioning",
  "super_admin",
  "client_ops",
  "public.is_super_admin()",
  "p.status = 'active'",
  "service_role key must never be exposed to the browser",
], "SOP-IAM-03 two-tier Admin provisioning");

requireMarkers("supabase/migrations/202606180020_delivery_proof_storage_contract.sql", [
  "delivery-proof",
  "deliveries/{delivery_id}",
  "delivery_proof_signature_path_guard",
  "queue_delivery_proof_retention",
  "delivery_proof_objects_driver_insert_assigned",
], "private POD storage contract");

requireMarkers("supabase/migrations/202606180022_pricing_change_log_guardrails.sql", [
  "price_rules_change_log_guard",
  "Owner approved",
  "pricing master_data_changes",
  "Policy #9 / SOP-MDM-02",
], "Policy #9 pricing change-log guardrail");

requireMarkers("supabase/migrations/202606190003_order_cancellation_policy14.sql", [
  "Policy #14",
  "cancellation_reason",
  "cancelled_at",
  "order_cancelled",
  "cancellation_requested",
], "Policy #14 cancellation fields");

requireMarkers("supabase/migrations/202606190004_failed_delivery_policy8.sql", [
  "Policy #8",
  "failed_delivery_attempt_count",
  "failed_delivery_attempts",
  "redelivery_fee_status",
  "return_to_supplier_status",
  "redelivery_fee_reviewed_at",
], "Policy #8 failed delivery/redelivery fee");

requireMarkers("supabase/migrations/202606190005_supplier_pickup_standards_policy16.sql", [
  "Policy #16",
  "pickup_ready_by_10",
  "pickup_labelled",
  "pickup_packaging_confirmed",
  "no_pickup_category",
  "pickup_grace_minutes",
], "Policy #16 supplier pickup standards");

requireMarkers("supabase/migrations/202606190006_delivery_completion_sop_del05.sql", [
  "SOP-DEL-05",
  "delivery_proof_complete_delivery",
  "billing_ready",
  "Delivered status is system-written",
], "SOP-DEL-05 proof-driven delivery completion");

requireMarkers("supabase/migrations/202606190007_policy18_dispute_sla.sql", [
  "Policy #18",
  "ack_due_date",
  "resolution_due_date",
  "owner_escalation_status",
  "policy18_remedy_type",
  "credit note",
], "Policy #18 dispute SLA/remedy tracking");

requireMarkers("supabase/migrations/202606190008_day8_overdue_notice_generation.sql", [
  "generate_due_day8_overdue_notices",
  "day_8_overdue",
  "provider_not_configured",
  "local_record_only",
], "Day 8 overdue local evidence generation");

requireMarkers("supabase/migrations/202606190009_unmatched_billing_account_exceptions.sql", [
  "SOP-EXC-03",
  "billing_account_match_status",
  "queue_unmatched_billing_account_exception",
  "correct_pickup_request_billing_account",
  "already-invoiced work",
], "SOP-EXC-03 unmatched billing account guardrail");

requireMarkers("supabase/migrations/202606190010_invoice_approval_gate_sop_bil04.sql", [
  "SOP-BIL-04",
  "invoice_approval_note",
  "approve_invoice_for_dispatch",
  "invoices_sent_requires_invoice_approval",
  "invoices_monitoring_requires_dispatch",
], "SOP-BIL-04 invoice approval gate");

requireMarkers("supabase/migrations/202606190011_delivery_stop_grouping_sop_del01.sql", [
  "SOP-DEL-01",
  "delivery_stop_groups",
  "delivery_stop_key",
  "delivery_proof_one_per_delivery_stop_group",
  "grouped_delivery_count",
  "SOP-DEL-01 grouped stop / SOP-DEL-05 delivery_proof insert",
], "SOP-DEL-01 delivery stop grouping");

requireMarkers("supabase/migrations/202606190013_no_pickup_reason_taxonomy_sop_pup03.sql", [
  "SOP-PUP-03",
  "pickup_requests_pickup_no_pickup_category_check",
  "not_ready_after_grace",
  "unlabelled",
  "improper_packaging",
  "supplier_refused",
  "wrong_items",
  "APP-DRV-002 no-billing evidence",
], "SOP-PUP-03 No Pickup reason taxonomy");

requireMarkers("supabase/migrations/202606190014_bring_forward_sop_run04.sql", [
  "SOP-RUN-04",
  "Bring Future Pickup Into Today",
  "bring_forward_collected_date",
  "bring_forward_intended_run_date",
  "bring_forward_no_detour_confirmed",
  "bring_forward_acceptance_confirmed",
  "pickup_requests_bring_forward_sop_run04_check",
  "not a requested postponement date",
], "SOP-RUN-04 bring-forward guardrail");

requireMarkers("supabase/migrations/202606190029_supplier_stop_closeout_sop_pup02.sql", [
  "SOP-PUP-02",
  "APP-DRV-002",
  "supplier_stop_correct_dock_confirmed",
  "supplier_stop_customer_list_reviewed",
  "supplier_stop_no_adhoc_records",
  "supplier_stop_dock_contact_engaged",
  "supplier_stop_left_dock_confirmed",
  "supplier_stop_outcome_summary",
  "pickup_requests_sop_pup02_supplier_stop_closeout_check",
  "pickup_requests_sop_pup02_delivered_requires_supplier_stop_closeout",
], "SOP-PUP-02 supplier-stop closeout guardrail");

requireMarkers("supabase/migrations/202606190030_delivery_signoff_sop_del04.sql", [
  "SOP-DEL-04",
  "APP-DRV-003",
  "signoff_address_confirmed",
  "signoff_goods_matched",
  "signoff_authorised_receiver_confirmed",
  "signoff_handover_confirmed",
  "signoff_price_reviewed",
  "signoff_device_supervised",
  "delivery_signoff_policy_ref",
  "delivery_proof_sop_del04_signoff_check",
  "failed_delivery_category",
  "receiver_signature_refused",
  "price_discrepancy",
  "pickup_requests_sop_del04_failed_delivery_category_check",
], "SOP-DEL-04 delivery sign-off proof");

requireMarkers("supabase/migrations/202606190031_run_close_confirmation_uj_drv001.sql", [
  "UJ-DRV-001 S5",
  "SOP-DEL-05",
  "picked_up_count",
  "no_pickup_count",
  "failed_delivery_count",
  "retained_goods_count",
  "second_attempt_required_count",
  "return_to_supplier_count",
  "action_items",
  "run_close_policy_ref",
  "run_closures_uj_drv001_confirmation_check",
], "UJ-DRV-001 run close confirmation");

requireMarkers("supabase/migrations/202606190032_live_runtime_records.sql", [
  "runtime_records",
  "record_type in",
  "production_seed_imports",
  "public.can_client_operational_account(owner_actor_id)",
  "public.can_client_billing_account(owner_actor_id)",
  "driver_profile_id = auth.uid()",
  "public.is_admin()",
  "No production customers, suppliers, drivers, or vehicles are seeded",
], "V1 live runtime records and approved master-data evidence gate");

requireMarkers("supabase/migrations/202606190015_run_planning_monitor_cap_mcl002.sql", [
  "CAP-MCL-002",
  "APP-ADM-002",
  "POL-MCL-002-001",
  "expected_compile_date",
  "compiled_night_before",
  "admin_intervention_required",
  "Run Planning Exception",
], "CAP-MCL-002 run planning monitor");

requireMarkers("supabase/migrations/202606190016_supplier_approval_gate_cap_mcl001.sql", [
  "CAP-MCL-001",
  "POL-MCL-001-001",
  "dock_contact_name",
  "dock_access_agreed",
  "packaging_standards_agreed",
  "pickup_window_agreed",
  "supplier_approval_evidence_ref",
  "actors_supplier_approval_gate_cap_mcl001",
], "CAP-MCL-001 supplier approval gate");

requireMarkers("supabase/migrations/202606190017_goods_acceptance_policy15.sql", [
  "Policy #15",
  "POL-OPS-015",
  "goods_acceptance_confirmed",
  "goods_acceptance_final_decision",
  "goods_acceptance_refused",
  "goods_acceptance_policy_ref",
  "pickup_requests_policy15_picked_up_acceptance_check",
  "pickup_requests_policy15_no_pickup_acceptance_check",
  "not accepted under protest",
], "Policy #15 goods acceptance");

requireMarkers("supabase/migrations/202606190018_driver_scheduling_policy22.sql", [
  "Policy #22",
  "APP-ADM-002",
  "notice_received_date",
  "notice_due_date",
  "late_notice",
  "contingency_plan",
  "driver_availability_policy22_evidence_required",
  "set_driver_availability_policy22_fields",
  "driver_availability_late_notice_idx",
], "Policy #22 driver scheduling");

requireMarkers("supabase/migrations/202606190019_whs_policy27.sql", [
  "Policy #27",
  "POL-OPS-027",
  "whs_hazard",
  "whs_hazard_reported",
  "whs_hazard_status",
  "pickup_requests_policy27_whs_hazard_check",
  "pickup_requests_whs_hazard_idx",
  "driver return must not be required while unresolved",
], "Policy #27 WHS hazard controls");

requireMarkers("supabase/migrations/202606190020_revenue_reporting_financial_controls_policy24.sql", [
  "Policy #24",
  "POL-OPS-024",
  "financial_reconciliations",
  "financial_reconciliation_invoices",
  "no_off_system_revenue_confirmed",
  "financial_reconciliations_policy24_completed_evidence_check",
  "policy24_add_business_days",
  "queue_policy24_financial_reconciliation_retention",
  "Otimi Rules reporting cadence/format remain open gaps",
], "Policy #24 revenue reporting financial controls");

requireMarkers("supabase/migrations/202606190024_ai_use_policy20.sql", [
  "Policy #20",
  "POL-OPS-020",
  "ai_draft_reviews",
  "AGT-CS-001b",
  "AGT-SRM-001b",
  "AGT-ADM-007b",
  "draft_pending_admin_review",
  "approved_not_sent",
  "ai_draft_admin_review_required_check",
  "ai_draft_no_autonomous_send_check",
  "ai_draft_no_batch_approval_check",
  "not_sent_provider_not_configured",
  "commercial, pricing, account, suspension, and legal decisions",
], "Policy #20 AI use governance");

requireMarkers("supabase/migrations/202606190028_account_termination_policy23.sql", [
  "Policy #23",
  "account_terminations",
  "account_terminated",
  "termination",
  "conduct_unremedied",
  "voluntary_request",
  "repeated_non_payment",
  "debt recovery escalation path and write-off thresholds are unconfirmed",
  "owner_consultation_evidence",
  "written_notification_evidence",
  "account_terminations_policy23_gate",
  "can_client_access_account",
], "Policy #23 account termination guardrails");

requireMarkers("supabase/migrations/202606190025_ndb_response_policy6.sql", [
  "Policy #6",
  "POL-OPS-006",
  "ndb_incidents",
  "Privacy Owner",
  "blocked_privacy_owner_unnamed",
  "assessment_due_date",
  "new.awareness_date + 30",
  "app_prv_004_audit_refs",
  "eligible breach decision cannot be delegated to Admin or automated",
  "oaic_notification_evidence",
  "affected_individuals_notification_evidence",
  "post_breach_review_report_ref",
  "retained_until",
  "ndb_incidents_admin_manage",
], "Policy #6 NDB response controls");

requireMarkers("supabase/migrations/202606190026_data_use_policy21_policy7.sql", [
  "Policy #21",
  "POL-OPS-021",
  "Policy #7",
  "POL-OPS-007",
  "data_use_reviews",
  "operational_access",
  "data_export",
  "digiverse_production_access",
  "third_party_sharing",
  "marketing_use",
  "data_access_breach",
  "prohibited_personal_use",
  "stored_on_personal_device",
  "shares_driver_data_to_clients_or_suppliers",
  "Policy #21 blocks access for personal curiosity, personal gain, or unrelated purpose.",
  "Policy #21 requires logged Digiverse production data access evidence.",
  "Policy #7 requires Admin-controlled production access evidence.",
  "data_use_reviews_pii_audit",
  "data_use_reviews_admin_manage",
], "Policy #21 / Policy #7 data use controls");

requireMarkers("supabase/migrations/202606190027_privacy_requests_policy3_policy4_policy5.sql", [
  "Policy #3",
  "POL-OPS-003",
  "Policy #4",
  "POL-OPS-004",
  "Policy #5",
  "POL-OPS-005",
  "privacy_requests",
  "access_request",
  "correction_request",
  "privacy_complaint",
  "unsolicited_information",
  "policy3_add_business_days",
  "response_due_date := new.received_date + 30",
  "complaint_ack_due_date",
  "privacy_act_refusal_ground",
  "app3_assessment",
  "blocked_privacy_owner_required",
  "Privacy Owner approval",
  "privacy_requests_pii_audit",
  "privacy_requests_admin_manage",
], "Policy #3/#4/#5 privacy request controls");

requireRegex("supabase/migrations/202606180018_role_access_rls.sql", [
  /create policy [\s\S]+ on public\.pickup_requests/i,
  /create policy [\s\S]+ on public\.invoices/i,
  /create policy [\s\S]+ on public\.delivery_proof/i,
], "RLS policy coverage for core workflow tables");

if (failures.length) {
  console.error("\nSupabase migration verification failed:\n");
  failures.forEach(failure => console.error(`- ${failure}`));
  console.error(`\n${passes.length} check(s) passed before failure.\n`);
  process.exit(1);
}

console.log(`Supabase migration verification passed: ${passes.length} check(s).`);
