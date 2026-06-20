export type RuntimeEnvironment = "local" | "preview" | "production" | "unknown";

export type SupabaseEnvironmentStatus = {
  ok: boolean;
  appEnv: RuntimeEnvironment;
  supabaseEnv: RuntimeEnvironment;
  urlConfigured: boolean;
  anonKeyConfigured: boolean;
  reason?: string;
};

const knownEnvironments = new Set(["local", "preview", "production"]);

export function normaliseEnvironment(value?: string | null): RuntimeEnvironment {
  const normalised = String(value || "").trim().toLowerCase();
  if (knownEnvironments.has(normalised)) return normalised as RuntimeEnvironment;
  if (normalised === "development" || normalised === "dev") return "local";
  if (!normalised) return "unknown";
  return "unknown";
}

export function validateSupabaseEnvironment(input: {
  appEnv?: string | null;
  supabaseEnv?: string | null;
  supabaseUrl?: string | null;
  supabaseAnonKey?: string | null;
}): SupabaseEnvironmentStatus {
  const appEnv = normaliseEnvironment(input.appEnv || "local");
  const supabaseEnv = normaliseEnvironment(input.supabaseEnv || appEnv);
  const urlConfigured = Boolean(String(input.supabaseUrl || "").trim());
  const anonKeyConfigured = Boolean(String(input.supabaseAnonKey || "").trim());

  if (!urlConfigured || !anonKeyConfigured) {
    return {
      ok: false,
      appEnv,
      supabaseEnv,
      urlConfigured,
      anonKeyConfigured,
      reason: "Live system connection settings are required before this portal can use live data.",
    };
  }

  if ((appEnv === "local" || appEnv === "preview") && supabaseEnv === "production") {
    return {
      ok: false,
      appEnv,
      supabaseEnv,
      urlConfigured,
      anonKeyConfigured,
      reason: "PIPE-DEV-001 / SOP-REL-01 guard: local and preview app builds must not connect to production live data.",
    };
  }

  return {
    ok: true,
    appEnv,
    supabaseEnv,
    urlConfigured,
    anonKeyConfigured,
  };
}
