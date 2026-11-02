import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { resilientSupabaseFetch } from "./fetch-handler";

/**
 * Privileged Supabase Admin Client.
 * STRICTLY SERVER-SIDE ONLY. Never import or use in client-side code.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin environment variables (SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    global: {
      fetch: resilientSupabaseFetch,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
