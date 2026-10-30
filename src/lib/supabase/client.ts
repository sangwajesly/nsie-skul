import { createBrowserClient } from "@supabase/ssr";

// Fallbacks ensure client-side components never crash with missing credentials
// if NEXT_PUBLIC_ variables are missing from a hosting environment bundle.
const FALLBACK_SUPABASE_URL = "https://utgzjzwftdnmydvyxpwl.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "sb_publishable_FW7ZcyhWn0msWD5EvknCDw_cq2Nw9Vx";

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    FALLBACK_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    FALLBACK_SUPABASE_ANON_KEY;

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
