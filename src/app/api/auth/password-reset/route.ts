import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type AdminSupabaseClient = SupabaseClient<any, "public", any>;

const productionSiteOrigin = "https://motoandcocouriers.vercel.app";
const allowedReturnPaths = new Set(["/", "/portal", "/booking", "/tracking", "/admin", "/driver"]);

function json(status: number, payload: Record<string, unknown>) {
  return NextResponse.json(payload, { status });
}

function normaliseEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function serviceClient(): AdminSupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function siteOrigin() {
  const configured = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (configured) return configured;
  const vercelUrl = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "").trim().replace(/\/+$/, "");
  if (!vercelUrl) return productionSiteOrigin;
  return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
}

function safeReturnPath(value: unknown) {
  const raw = String(value || "/").trim();
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  try {
    const parsed = new URL(raw, "https://motoandco.local");
    if (parsed.origin !== "https://motoandco.local") return "/";
    if (!allowedReturnPaths.has(parsed.pathname)) return "/";
    return `${parsed.pathname}${parsed.search || ""}`;
  } catch {
    return "/";
  }
}

function authRedirectTo(returnPath = "/") {
  return `${siteOrigin()}/auth/callback?next=${encodeURIComponent(safeReturnPath(returnPath))}`;
}

function successPayload() {
  return {
    accepted: true,
    message: "If this email is approved for Moto & Co portal access, a password email has been sent.",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normaliseEmail(body.email);
    const returnPath = safeReturnPath(body.returnPath);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "A valid email address is required." });

    const supabase = serviceClient();
    if (!supabase) return json(500, { error: "Password reset service is not configured." });

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, status")
      .eq("email", email)
      .eq("status", "active")
      .limit(1);
    if (profileError) throw profileError;

    const profile = profiles?.[0];
    if (!profile) {
      // Do not reveal whether an email exists in Auth or the portal access model.
      return json(200, successPayload());
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectTo(returnPath),
    });
    if (resetError) throw resetError;

    return json(200, {
      ...successPayload(),
      resetEmailSent: true,
    });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : "Password reset email failed." });
  }
}
