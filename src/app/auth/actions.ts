"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACTIVE_SCHOOL_COOKIE } from "@/lib/tenancy/context";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginRateLimit,
} from "@/lib/auth/rate-limiter";

const LoginSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const RegisterSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please provide a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type ActionResult = { error: string } | { redirectTo: string };

export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const returnUrl = (formData.get("returnUrl") as string) || "/dashboard";

  const validation = LoginSchema.safeParse({ email, password });
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  // Rate limiting by email
  const rateCheck = checkLoginRateLimit(email);
  if (!rateCheck.allowed) {
    return {
      error: `Too many failed login attempts. Please wait ${rateCheck.retryAfterSeconds || 60} seconds before trying again.`,
    };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server configuration error.";
    return { error: msg };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const attempt = recordFailedLoginAttempt(email);
    if (attempt.blocked) {
      return {
        error: `Account temporarily locked for ${attempt.retryAfterSeconds || 60} seconds due to multiple failed attempts.`,
      };
    }
    return { error: "Invalid email or password. Please try again." };
  }

  resetLoginRateLimit(email);

  const { data: memberships, error: membershipsError } = await supabase
    .from("school_memberships")
    .select("id, school_id")
    .eq("user_id", data.user.id)
    .eq("status", "active");

  if (membershipsError) {
    return { error: "Could not load your school access. Please try again." };
  }

  if (!memberships || memberships.length === 0) {
    return { redirectTo: "/onboarding" };
  }

  const safePath =
    returnUrl === "/dashboard" ||
    returnUrl.startsWith("/dashboard/") ||
    returnUrl === "/onboarding"
      ? returnUrl
      : "/dashboard";

  if (memberships.length > 1) {
    return {
      redirectTo: `/select-school?returnTo=${encodeURIComponent(safePath)}`,
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SCHOOL_COOKIE, memberships[0].school_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return { redirectTo: safePath };
}

export async function loginWithTeacherCodeAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const identifier = String(formData.get("identifier") || "").trim();
  const schoolCodeInput = String(formData.get("schoolCode") || "").trim().toUpperCase();
  const pin = String(formData.get("pin") || "").trim();
  const returnUrl = (formData.get("returnUrl") as string) || "/dashboard";

  if (!identifier) {
    return { error: "Please enter your Cameroon phone number or staff code." };
  }
  if (!pin) {
    return { error: "Please enter your 4 to 6 digit PIN." };
  }

  // Rate limiting check
  const rateCheck = checkLoginRateLimit(identifier);
  if (!rateCheck.allowed) {
    return {
      error: `Too many failed attempts. For security, please wait ${rateCheck.retryAfterSeconds || 60} seconds before trying again.`,
    };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server configuration error.";
    return { error: msg };
  }

  const admin = createAdminClient();
  let userEmail: string | null = null;
  let preselectedSchoolId: string | null = null;

  // Clean identifier (strip all non-digit characters)
  const cleanDigits = identifier.replace(/\D/g, "");
  const isLikelyPhone =
    (cleanDigits.length === 9 && (cleanDigits.startsWith("6") || cleanDigits.startsWith("2"))) ||
    (cleanDigits.startsWith("237") && cleanDigits.length === 12);

  if (isLikelyPhone) {
    const phone9 = cleanDigits.startsWith("237") ? cleanDigits.slice(3) : cleanDigits;
    // Look up user profile by phone or synthetic internal email
    const { data: profile } = await admin
      .from("user_profiles")
      .select("id, email, phone")
      .or(`phone.eq.${phone9},phone.eq.+237${phone9},email.eq.teacher_${phone9}@staff.nseisukul.internal`)
      .maybeSingle();

    if (profile) {
      userEmail = profile.email;
    }
  }

  // If not matched by phone, or user entered code like "BHS-T101" or specified schoolCode
  if (!userEmail) {
    let targetSchoolCode = schoolCodeInput;
    let targetStaffCode = identifier;

    if (!targetSchoolCode && identifier.includes("-")) {
      const parts = identifier.split("-");
      targetSchoolCode = parts[0].toUpperCase();
      targetStaffCode = parts.slice(1).join("-");
    }

    if (targetSchoolCode) {
      const { data: school } = await admin
        .from("schools")
        .select("id, code, slug")
        .or(`code.ilike.${targetSchoolCode},slug.ilike.${targetSchoolCode}`)
        .maybeSingle();

      if (school) {
        // Look up membership by access_code
        const { data: membership } = await admin
          .from("school_memberships")
          .select("id, school_id, user_id, access_code, status, user:user_profiles(id, email)")
          .eq("school_id", school.id)
          .eq("status", "active")
          .or(`access_code.ilike.${targetStaffCode},access_code.ilike.${identifier}`)
          .maybeSingle();

        if (membership && membership.user) {
          const userObj = membership.user as unknown as { id: string; email: string };
          userEmail = userObj.email;
          preselectedSchoolId = school.id;
        }
      }
    }
  }

  if (!userEmail) {
    const attempt = recordFailedLoginAttempt(identifier);
    if (attempt.blocked) {
      return {
        error: `Too many failed attempts. Access temporarily locked for ${attempt.retryAfterSeconds || 60} seconds for security.`,
      };
    }
    return {
      error:
        "No teacher account found matching those details. Please check your phone number or ask your school administrator for your access slip.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: pin,
  });

  if (error) {
    const attempt = recordFailedLoginAttempt(identifier);
    if (attempt.blocked) {
      return {
        error: `Too many incorrect PIN attempts. Access locked for ${attempt.retryAfterSeconds || 60} seconds for security.`,
      };
    }
    return {
      error: `Incorrect PIN. Please re-enter your teacher PIN (${attempt.remainingAttempts} attempts remaining).`,
    };
  }

  // Reset rate limiting on successful authentication
  resetLoginRateLimit(identifier);

  // Get active school memberships
  const { data: memberships, error: membershipsError } = await supabase
    .from("school_memberships")
    .select("id, school_id")
    .eq("user_id", data.user.id)
    .eq("status", "active");

  if (membershipsError || !memberships || memberships.length === 0) {
    return { redirectTo: "/onboarding" };
  }

  const safePath =
    returnUrl === "/dashboard" ||
    returnUrl.startsWith("/dashboard/") ||
    returnUrl === "/onboarding"
      ? returnUrl
      : "/dashboard";

  const cookieStore = await cookies();

  // If teacher logged in with a specific school code, take them straight to that school
  if (preselectedSchoolId) {
    cookieStore.set(ACTIVE_SCHOOL_COOKIE, preselectedSchoolId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return { redirectTo: safePath };
  }

  if (memberships.length === 1) {
    cookieStore.set(ACTIVE_SCHOOL_COOKIE, memberships[0].school_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return { redirectTo: safePath };
  }

  // Teacher has multiple schools and logged in via universal phone number
  return {
    redirectTo: `/select-school?returnTo=${encodeURIComponent(safePath)}`,
  };
}

export async function registerAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validation = RegisterSchema.safeParse({ fullName, email, password });
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server configuration error.";
    return { error: msg };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await supabase.from("user_profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      email,
    });
  }

  return { redirectTo: "/onboarding" };
}

export async function signOutAction() {
  // Called from a plain <form action={}> : redirect() is safe here (not inside useActionState)
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
