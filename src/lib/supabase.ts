import { createClient } from "@supabase/supabase-js";
import { validateSupabaseEnvironment } from "@/lib/environment-guard";

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const status = validateSupabaseEnvironment({
    appEnv: process.env.NEXT_PUBLIC_APP_ENV,
    supabaseEnv: process.env.NEXT_PUBLIC_SUPABASE_ENV,
    supabaseUrl: url,
    supabaseAnonKey: anonKey,
  });

  if (!status.ok) {
    if (status.reason) console.warn(status.reason);
    return null;
  }

  return createClient(url!, anonKey!);
}

export function getBrowserSupabaseEnvironmentStatus() {
  return validateSupabaseEnvironment({
    appEnv: process.env.NEXT_PUBLIC_APP_ENV,
    supabaseEnv: process.env.NEXT_PUBLIC_SUPABASE_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
