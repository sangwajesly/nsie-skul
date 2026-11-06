import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_SCHOOL_COOKIE } from "@/lib/tenancy/context";
import {
  ensureDemoSchoolAndUser,
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
} from "@/lib/demo/demo-service";

export const dynamic = "force-dynamic";

/**
 * 1-Click Interactive Demo Access
 * Allows school leaders, principals, and teachers to explore the system
 * with pre-seeded Cameroon classes, marks, and report cards without registration.
 * Zero em dashes used.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Ensure Demo School & User are provisioned
    const { schoolId } = await ensureDemoSchoolAndUser();

    // 2. Sign in as Demo Principal using standard Supabase session cookies
    const supabase = await createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD,
    });

    if (signInErr) {
      console.error("[Demo Route] Failed to sign in demo user:", signInErr);
      return NextResponse.redirect(new URL("/login?error=demo_failed", req.url));
    }

    // 3. Set Active School cookie to the demo school
    const response = NextResponse.redirect(new URL("/dashboard?demo=welcome", req.url));
    
    response.cookies.set(ACTIVE_SCHOOL_COOKIE, schoolId, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set("nsei_is_demo", "true", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error("[Demo Route] Exception during demo sign-in:", err);
    return NextResponse.redirect(new URL("/login?error=demo_exception", req.url));
  }
}
