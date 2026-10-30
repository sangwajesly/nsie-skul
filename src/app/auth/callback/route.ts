import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_SCHOOL_COOKIE } from "@/lib/tenancy/context";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnUrlParam = requestUrl.searchParams.get("returnUrl") || "/dashboard";
  const errorDescription = requestUrl.searchParams.get("error_description");
  const error = requestUrl.searchParams.get("error");

  // Resolve origin reliably across reverse proxies (e.g. Vercel, custom domain)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const origin = `${proto}://${host}`;

  // Sanitize return destination against open redirect vulnerabilities
  const safeReturn =
    returnUrlParam === "/dashboard" ||
    returnUrlParam.startsWith("/dashboard/") ||
    returnUrlParam === "/onboarding"
      ? returnUrlParam
      : "/dashboard";

  // Handle provider-level error callback
  if (error || errorDescription) {
    const errorMsg = encodeURIComponent(
      errorDescription || error || "Google authentication was cancelled or failed."
    );
    return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Missing authorization code from Google.")}`
    );
  }

  try {
    const supabase = await createClient();

    // Exchange the authorization code for an authenticated session
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data?.user) {
      const msg = encodeURIComponent(
        exchangeError?.message || "Failed to exchange authorization code."
      );
      return NextResponse.redirect(`${origin}/login?error=${msg}`);
    }

    const user = data.user;

    // Resolve full name from Google metadata or email fallback
    const resolvedName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "Staff Member";

    // Ensure a matching profile exists in user_profiles
    await supabase.from("user_profiles").upsert(
      {
        id: user.id,
        full_name: resolvedName,
        email: user.email || "",
      },
      { onConflict: "id" }
    );

    // Resolve user's school memberships to determine routing destination
    const { data: memberships, error: membershipsError } = await supabase
      .from("school_memberships")
      .select("id, school_id")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (membershipsError) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent("Could not load your school access permissions.")}`
      );
    }

    if (!memberships || memberships.length === 0) {
      // Authenticated with Google but not yet linked to an institution
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    if (memberships.length > 1) {
      // Multiple schools: user must pick their active institution
      return NextResponse.redirect(
        `${origin}/select-school?returnTo=${encodeURIComponent(safeReturn)}`
      );
    }

    // Exactly one school: activate cookie and proceed to dashboard
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_SCHOOL_COOKIE, memberships[0].school_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.redirect(`${origin}${safeReturn}`);
  } catch (err: unknown) {
    const msg = encodeURIComponent(
      err instanceof Error ? err.message : "Unexpected server authentication error."
    );
    return NextResponse.redirect(`${origin}/login?error=${msg}`);
  }
}
