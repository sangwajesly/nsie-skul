import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resilientSupabaseFetch } from "./fetch-handler";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: resilientSupabaseFetch,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const pathname = request.nextUrl.pathname;

  // --- School Hub On-Premise Mode Routing & Offline Access ---
  const isHubMode =
    process.env.HUB_MODE === "true" ||
    process.env.NEXT_PUBLIC_HUB_MODE === "true";

  const hasHubSession = Boolean(
    request.cookies.get("nsei_hub_admin_session")?.value
  );

  if (isHubMode) {
    // 1. Static assets, API endpoints, manifests, and workers pass straight through
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api/") ||
      pathname === "/manifest.json" ||
      pathname === "/manifest.webmanifest" ||
      pathname === "/sw.js" ||
      pathname.startsWith("/favicon") ||
      pathname.startsWith("/app-icon") ||
      pathname.endsWith(".ico") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".svg") ||
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".css") ||
      pathname.endsWith(".js") ||
      pathname.endsWith(".json")
    ) {
      return supabaseResponse;
    }

    // 2. Unlocked Station Session
    if (hasHubSession) {
      if (
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/hub/login" ||
        pathname === "/register"
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    // 3. Station not unlocked yet: allow /hub/login
    if (pathname.startsWith("/hub/login")) {
      return supabaseResponse;
    }

    // 4. Any other page (/, /login, /dashboard, etc.) redirects cleanly to /hub/login
    const url = request.nextUrl.clone();
    url.pathname = "/hub/login";
    return NextResponse.redirect(url);
  }

  // Refresh auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes that unauthenticated users can access
  const isPublicAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/hub/login");

  // Routes that require authentication
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding");

  // --- Unauthenticated user hitting a protected page → redirect to login ---
  if (!user && !hasHubSession && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = isHubMode ? "/hub/login" : "/login";
    url.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(url);
  }

  // --- Authenticated user hitting login/register → send to dashboard ---
  if (user && isPublicAuthRoute) {
    // If the active session is the temporary demo user, NEVER trap them!
    // Allow them to access /login or /register freely so they can enter their real school.
    if (user.email === "demo@nsei-sukul.klarifypath.com") {
      return supabaseResponse;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
