import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const returnUrlParam = requestUrl.searchParams.get("returnUrl") || "/dashboard";

  // Resolve origin reliably across reverse proxies (e.g. Vercel, custom domain)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const origin = `${proto}://${host}`;

  const safeReturn =
    returnUrlParam === "/dashboard" ||
    returnUrlParam.startsWith("/dashboard/") ||
    returnUrlParam === "/onboarding"
      ? returnUrlParam
      : "/dashboard";

  try {
    const supabase = await createClient();
    const redirectTo = `${origin}/auth/callback?returnUrl=${encodeURIComponent(safeReturn)}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error || !data?.url) {
      const errorMsg = encodeURIComponent(
        error?.message || "Failed to initialize Google authentication."
      );
      return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
    }

    return NextResponse.redirect(data.url);
  } catch (err: unknown) {
    const errorMsg = encodeURIComponent(
      err instanceof Error ? err.message : "Authentication configuration error."
    );
    return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
  }
}
