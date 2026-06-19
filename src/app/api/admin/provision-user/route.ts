import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type ProvisionRole = "super_admin" | "admin" | "client_ops" | "client_billing" | "driver";
type ProvisionStatus = "pending" | "active" | "inactive" | "revoked";
type AdminSupabaseClient = SupabaseClient<any, "public", any>;

const allowedRoles = new Set<ProvisionRole>(["super_admin", "admin", "client_ops", "client_billing", "driver"]);
const allowedStatuses = new Set<ProvisionStatus>(["pending", "active", "inactive", "revoked"]);

function json(status: number, payload: Record<string, unknown>) {
  return NextResponse.json(payload, { status });
}

function normaliseEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normaliseRole(value: unknown): ProvisionRole | "" {
  const role = String(value || "").trim().toLowerCase();
  if (role === "client" || role === "client_operational") return "client_ops";
  if (role === "billing") return "client_billing";
  return allowedRoles.has(role as ProvisionRole) ? (role as ProvisionRole) : "";
}

function isUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function serviceClient(): AdminSupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function actorCodeForRole(role: ProvisionRole, linkCode = "") {
  if (linkCode.trim()) return linkCode.trim();
  if (role === "super_admin") return "ACT-INT-003";
  if (role === "admin") return "ACT-INT-002";
  if (role === "driver") return "ACT-INT-001";
  if (role === "client_billing") return "ACT-CRM-001b";
  return "ACT-CRM-001a";
}

function canAssign(callerRoles: Set<string>, targetRole: ProvisionRole) {
  if (targetRole === "super_admin") return false;
  if (targetRole === "admin") return callerRoles.has("super_admin");
  return callerRoles.has("super_admin") || callerRoles.has("admin");
}

async function findAuthUserByEmail(supabase: AdminSupabaseClient, email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = (data?.users || []).find((user) => String(user.email || "").toLowerCase() === email);
    if (found) return found;
    if (!data?.users || data.users.length < 1000) return null;
  }
  throw new Error("Auth user lookup exceeded 20,000 users.");
}

async function callerContext(request: NextRequest, supabase: AdminSupabaseClient) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { error: json(401, { error: "Missing Supabase bearer token." }) };

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user?.id) return { error: json(401, { error: "Invalid Supabase session." }) };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, status")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile || profile.status !== "active") return { error: json(403, { error: "Caller is not an active Moto & Co Admin user." }) };

  const { data: assignments, error: assignmentError } = await supabase
    .from("access_role_assignments")
    .select("application_role, status")
    .eq("profile_id", authData.user.id);
  if (assignmentError) throw assignmentError;

  const roles = new Set<string>();
  if (profile.role === "super_admin") roles.add("super_admin");
  if (profile.role === "admin" || profile.role === "super_admin") roles.add("admin");
  for (const assignment of assignments || []) {
    if (assignment.status !== "active") continue;
    const role = normaliseRole(assignment.application_role);
    if (role === "super_admin") roles.add("super_admin");
    if (role === "admin" || role === "super_admin") roles.add("admin");
  }

  if (!roles.has("admin") && !roles.has("super_admin")) {
    return { error: json(403, { error: "Only Admin or Super Admin can use SOP-IAM-03 provisioning." }) };
  }

  return { authUser: authData.user, profile, roles };
}

async function writeAudit(
  supabase: AdminSupabaseClient,
  callerId: string,
  targetId: string,
  actionType: string,
  entityType: string,
  changedField: string,
  oldValue: string,
  newValue: string,
  reason: string,
  approvalReference: string,
) {
  const { error } = await supabase.from("master_data_changes").insert({
    change_type: entityType === "profile" ? "user" : entityType,
    target_id: targetId,
    field: changedField,
    old_value: oldValue,
    new_value: newValue,
    reason,
    status: "executed",
    proposed_by: callerId,
    actor_id: callerId,
    action_type: actionType,
    entity_type: entityType,
    entity_id: targetId,
    changed_field: changedField,
    approval_reference: approvalReference,
    changed_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = serviceClient();
    if (!supabase) return json(500, { error: "Server-side Supabase service key is not configured." });
    const caller = await callerContext(request, supabase);
    if ("error" in caller) return caller.error;

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, display_name, role, status, actor_id, account_id, driver_id, last_reviewed_at, created_at")
      .in("role", ["super_admin", "admin", "client_ops", "client_billing", "driver", "client"])
      .order("created_at", { ascending: false });
    if (profileError) throw profileError;

    const ids = (profiles || []).map((profile) => profile.id);
    const { data: assignments, error: assignmentError } = ids.length
      ? await supabase
          .from("access_role_assignments")
          .select("id, profile_id, actor_id, contact_id, application_role, actor_code, status, granted_at, last_reviewed_at, last_review_reason")
          .in("profile_id", ids)
      : { data: [], error: null };
    if (assignmentError) throw assignmentError;

    return json(200, { profiles: profiles || [], accessRoleAssignments: assignments || [] });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : "Provisioning list failed." });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = serviceClient();
    if (!supabase) return json(500, { error: "Server-side Supabase service key is not configured." });
    const caller = await callerContext(request, supabase);
    if ("error" in caller) return caller.error;

    const body = await request.json();
    const email = normaliseEmail(body.email);
    const displayName = String(body.displayName || "").trim();
    const role = normaliseRole(body.role);
    const approvalReference = String(body.approvalReference || "").trim();
    const reason = String(body.reason || approvalReference).trim();
    const actorId = isUuid(body.actorId) ? String(body.actorId) : null;
    const contactId = isUuid(body.contactId) ? String(body.contactId) : null;
    const accountId = String(body.accountId || "").trim() || null;
    const driverId = String(body.driverId || "").trim() || null;
    const actorCode = actorCodeForRole(role as ProvisionRole, String(body.actorCode || body.linkCode || ""));

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "A valid email address is required." });
    if (!displayName) return json(400, { error: "Display name is required." });
    if (!role) return json(400, { error: "A confirmed SOP-IAM-03 role is required." });
    if (role === "super_admin") return json(403, { error: "Super Admin cannot be created from inside the app. Use the one-time bootstrap process." });
    if (!approvalReference) return json(400, { error: "Approval reference is required." });
    if (!reason) return json(400, { error: "Provisioning reason is required." });
    if (!canAssign(caller.roles, role)) return json(403, { error: "This caller is not permitted to assign that role." });
    if ((role === "client_ops" || role === "client_billing") && !accountId && !actorId) {
      return json(400, { error: "Client roles must be linked to a customer/account record." });
    }
    if (role === "driver" && !driverId) return json(400, { error: "Driver role must be linked to a driver record." });

    const existing = await findAuthUserByEmail(supabase, email);
    if (existing) return json(409, { error: "Email already exists in Supabase Auth. Admin must investigate possible duplicate registration." });

    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        display_name: displayName,
        sop_iam_03_role: role,
      },
    });
    if (inviteError) throw inviteError;
    const user = inviteData.user;
    if (!user?.id) throw new Error("Supabase Auth did not return a user id.");

    const profileRole = role;
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      actor_id: actorId,
      email,
      role: profileRole,
      status: "pending",
      display_name: displayName,
      account_id: accountId,
      driver_id: driverId,
      last_reviewed_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (profileError) throw profileError;

    const { error: assignmentError } = await supabase.from("access_role_assignments").insert({
      profile_id: user.id,
      actor_id: actorId,
      contact_id: contactId,
      application_role: role,
      actor_code: actorCode,
      status: "active",
      granted_by: caller.authUser.id,
      granted_at: new Date().toISOString(),
      last_reviewed_by: caller.authUser.id,
      last_reviewed_at: new Date().toISOString(),
      last_review_reason: approvalReference,
    });
    if (assignmentError) throw assignmentError;

    await writeAudit(
      supabase,
      caller.authUser.id,
      user.id,
      "provision_user",
      "profile",
      "role",
      "",
      role,
      reason,
      approvalReference,
    );

    return json(201, {
      profile: {
        id: user.id,
        email,
        display_name: displayName,
        role,
        status: "pending",
        account_id: accountId,
        driver_id: driverId,
      },
      welcomeEmailSent: true,
    });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : "Provisioning failed." });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = serviceClient();
    if (!supabase) return json(500, { error: "Server-side Supabase service key is not configured." });
    const caller = await callerContext(request, supabase);
    if ("error" in caller) return caller.error;

    const body = await request.json();
    const profileId = String(body.profileId || "").trim();
    const nextStatus = String(body.status || "").trim().toLowerCase() as ProvisionStatus;
    const approvalReference = String(body.approvalReference || "").trim();
    const reason = String(body.reason || approvalReference).trim();

    if (!isUuid(profileId)) return json(400, { error: "A valid profile id is required." });
    if (!allowedStatuses.has(nextStatus)) return json(400, { error: "A valid target status is required." });
    if (!approvalReference) return json(400, { error: "Approval reference is required." });
    if (!reason) return json(400, { error: "Status change reason is required." });

    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select("id, role, status")
      .eq("id", profileId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) return json(404, { error: "Profile was not found." });
    const targetRole = normaliseRole(existing.role);
    if (!targetRole || !canAssign(caller.roles, targetRole)) {
      return json(403, { error: "This caller is not permitted to change that user's status." });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        status: nextStatus,
        last_reviewed_at: new Date().toISOString(),
      })
      .eq("id", profileId);
    if (profileError) throw profileError;

    const assignmentStatus = nextStatus === "revoked" || nextStatus === "inactive" ? "revoked" : "active";
    const { error: assignmentError } = await supabase
      .from("access_role_assignments")
      .update({
        status: assignmentStatus,
        last_reviewed_by: caller.authUser.id,
        last_reviewed_at: new Date().toISOString(),
        last_review_reason: approvalReference,
        revoked_by: assignmentStatus === "revoked" ? caller.authUser.id : null,
        revoked_at: assignmentStatus === "revoked" ? new Date().toISOString() : null,
        revoked_reason: assignmentStatus === "revoked" ? reason : null,
      })
      .eq("profile_id", profileId);
    if (assignmentError) throw assignmentError;

    await writeAudit(
      supabase,
      caller.authUser.id,
      profileId,
      "update_user_status",
      "profile",
      "status",
      existing.status || "",
      nextStatus,
      reason,
      approvalReference,
    );

    return json(200, { profile: { id: profileId, status: nextStatus } });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : "Provisioning status update failed." });
  }
}
