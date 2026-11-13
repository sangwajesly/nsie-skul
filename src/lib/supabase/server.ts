import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resilientSupabaseFetch } from "./fetch-handler";
import { HUB_SESSION_COOKIE } from "@/lib/hub/hub-node-store";

export async function createClient() {
  const cookieStore = await cookies();

  // On Vercel: use plain names (SUPABASE_URL / SUPABASE_ANON_KEY) - Vercel blocks
  // NEXT_PUBLIC_ for secret-looking values. Plain names stay server-only (safe).
  // Locally: .env.local can use either name; NEXT_PUBLIC_ is kept as a fallback.
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || (!anonKey && !serviceRoleKey)) {
    throw new Error(
      "[Nsei Sukul] Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Project > Settings > Environment Variables."
    );
  }

  // Detect whether request is running under School Hub Mode or an active Hub Session
  const isHubSession =
    Boolean(cookieStore.get(HUB_SESSION_COOKIE)?.value) ||
    process.env.HUB_MODE === "true" ||
    process.env.NEXT_PUBLIC_HUB_MODE === "true";

  // When operating in Hub Mode or an active Hub Admin Session, use serviceRoleKey if available
  // so that administrative mutations (creating classes, registering students, adding staff, 
  // configuring subjects) are not blocked by cloud RLS anon checks.
  const supabaseKey =
    isHubSession && serviceRoleKey ? serviceRoleKey : (anonKey || serviceRoleKey!);

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      global: {
        fetch: resilientSupabaseFetch,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}
