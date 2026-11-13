"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACTIVE_SCHOOL_COOKIE } from "@/lib/tenancy/context";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  resetLoginRateLimit,
} from "@/lib/auth/rate-limiter";
import { normalizePinForAuth, getPinAuthCandidates } from "@/lib/auth/pin-utils";

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
  cookieStore.delete("nsei_is_demo");
  cookieStore.delete("nsei_demo_school_id");
  cookieStore.set(ACTIVE_SCHOOL_COOKIE, memberships[0].school_id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return { redirectTo: safePath };
}

async function loginTeacherOfflineWithLocalPg(
  identifier: string,
  schoolCodeInput: string,
  pin: string,
  returnUrl: string
): Promise<ActionResult | null> {
  try {
    const { isSchoolHubMode, getHubNodeConfig, createHubUserSessionToken, HUB_SESSION_COOKIE } = await import("@/lib/hub/hub-node-store");
    if (!isSchoolHubMode()) return null;

    const { queryLocalDb } = await import("@/lib/db/local-postgres");
    const config = getHubNodeConfig();

    const cleanDigits = identifier.replace(/\D/g, "");
    const isLikelyPhone =
      (cleanDigits.length === 9 && (cleanDigits.startsWith("6") || cleanDigits.startsWith("2"))) ||
      (cleanDigits.startsWith("237") && cleanDigits.length === 12);
    const phone9 = cleanDigits.startsWith("237") ? cleanDigits.slice(3) : cleanDigits;

    let targetSchoolCode = schoolCodeInput || config?.schoolCode || "";
    let targetStaffCode = identifier;
    if (!schoolCodeInput && identifier.includes("-")) {
      const parts = identifier.split("-");
      targetSchoolCode = parts[0].toUpperCase();
      targetStaffCode = parts.slice(1).join("-");
    }
    const cleanStaff = targetStaffCode.replace(/^[-_]+/, "");

    let queryText = `
      SELECT 
        m.id as membership_id,
        m.school_id,
        m.user_id,
        m.access_code,
        m.title,
        m.status,
        COALESCE(r.code, 'teacher') as role_code,
        COALESCE(r.name, 'Subject Teacher') as role_name,
        COALESCE(u.full_name, m.title, 'Subject Teacher') as full_name,
        u.phone,
        u.email,
        s.name as school_name,
        s.code as school_code
      FROM public.school_memberships m
      LEFT JOIN public.user_profiles u ON u.id = m.user_id
      LEFT JOIN public.roles r ON r.id = m.role_id
      LEFT JOIN public.schools s ON s.id = m.school_id
      WHERE m.status = 'active'
    `;
    const params: any[] = [];

    if (isLikelyPhone) {
      params.push(phone9, `+237${phone9}`, `teacher_${phone9}@staff.nseisukul.internal`);
      queryText += ` AND (u.phone = $1 OR u.phone = $2 OR u.email = $3)`;
    } else {
      params.push(identifier, cleanStaff, `%-${cleanStaff}`);
      queryText += ` AND (m.access_code ILIKE $1 OR m.access_code ILIKE $2 OR m.access_code ILIKE $3)`;
    }

    if (targetSchoolCode) {
      params.push(targetSchoolCode);
      queryText += ` AND (s.code ILIKE $${params.length} OR s.slug ILIKE $${params.length})`;
    }

    queryText += ` LIMIT 1`;

    const res = await queryLocalDb(queryText, params);
    if (res.rows.length === 0) {
      // Fallback search: try matching anywhere in access_code or phone without strict school code constraint
      const fallbackRes = await queryLocalDb(
        `SELECT 
          m.id as membership_id,
          m.school_id,
          m.user_id,
          m.access_code,
          m.title,
          m.status,
          COALESCE(r.code, 'teacher') as role_code,
          COALESCE(r.name, 'Subject Teacher') as role_name,
          COALESCE(u.full_name, m.title, 'Subject Teacher') as full_name,
          u.phone,
          u.email,
          s.name as school_name,
          s.code as school_code
        FROM public.school_memberships m
        LEFT JOIN public.user_profiles u ON u.id = m.user_id
        LEFT JOIN public.roles r ON r.id = m.role_id
        LEFT JOIN public.schools s ON s.id = m.school_id
        WHERE m.status = 'active'
          AND (m.access_code ILIKE $1 OR u.phone LIKE $2 OR u.email ILIKE $1)
        LIMIT 1`,
        [`%${cleanStaff || identifier}%`, `%${phone9 || cleanDigits}%`]
      );
      if (fallbackRes.rows.length > 0) {
        res.rows.push(fallbackRes.rows[0]);
      }
    }

    if (res.rows.length === 0) {
      return {
        error: "No teacher account found matching those details on the local School Hub. Ask your administrator for your access code or slip.",
      };
    }

    const member = res.rows[0];

    // Hub Session Token scoped to this specific teacher
    const hubToken = createHubUserSessionToken({
      userId: member.user_id,
      fullName: member.full_name || "Subject Teacher",
      phone: member.phone,
      email: member.email,
      role: member.role_code || "teacher",
      accessCode: member.access_code,
      config: {
        nodeKey: config?.nodeKey || "",
        schoolId: member.school_id,
        schoolName: member.school_name || config?.schoolName || "School Station",
        schoolCode: member.school_code || config?.schoolCode || "CAMPUS",
      },
    });

    try {
      const cookieStore = await cookies();
      cookieStore.delete("nsei_is_demo");
      cookieStore.delete("nsei_demo_school_id");
      cookieStore.set(HUB_SESSION_COOKIE, hubToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
      cookieStore.set(ACTIVE_SCHOOL_COOKIE, member.school_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    } catch (cookieErr) {
      // Non-blocking in headless unit test runners
    }

    return { redirectTo: returnUrl || "/dashboard" };
  } catch (err) {
    console.warn("[loginTeacherOfflineWithLocalPg] Error:", err);
    return null;
  }
}

export async function loginWithTeacherCodeAction(
  prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const identifier = String(formData.get("identifier") || "").trim();
  const schoolCodeInput = String(formData.get("schoolCode") || "").trim().toUpperCase();
  const rawPin = String(formData.get("pin") || "").trim();
  // Default to system initial PIN "123456" if left empty by the teacher
  const pin = rawPin || "123456";
  const returnUrl = (formData.get("returnUrl") as string) || "/dashboard";

  if (!identifier) {
    return { error: "Please enter your teacher code (e.g. T-101) or phone number." };
  }

  // Rate limiting check
  const rateCheck = checkLoginRateLimit(identifier);
  if (!rateCheck.allowed) {
    return {
      error: `Too many failed attempts. For security, please wait ${rateCheck.retryAfterSeconds || 60} seconds before trying again.`,
    };
  }

  // ── SCHOOL HUB 100% OFFLINE AUTHENTICATION ────────────────────────────────
  try {
    const { isSchoolHubMode } = await import("@/lib/hub/hub-node-store");
    if (isSchoolHubMode()) {
      const offlineRes = await loginTeacherOfflineWithLocalPg(
        identifier,
        schoolCodeInput,
        pin,
        returnUrl
      );
      if (offlineRes) {
        return offlineRes;
      }
    }
  } catch (hubErr) {
    console.warn("[loginWithTeacherCodeAction] Local Hub check notice:", hubErr);
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

      // If a school code was passed (e.g. from invite link ?s=BHS), preselect that school
      if (schoolCodeInput) {
        const { data: school } = await admin
          .from("schools")
          .select("id")
          .or(`code.ilike.${schoolCodeInput},slug.ilike.${schoolCodeInput}`)
          .maybeSingle();

        if (school) {
          preselectedSchoolId = school.id;
        }
      }

      // If school not specified via code, preselect their first active real school membership
      if (!preselectedSchoolId) {
        const { data: userMemberships } = await admin
          .from("school_memberships")
          .select("school_id")
          .eq("user_id", profile.id)
          .eq("status", "active")
          .limit(1);

        if (userMemberships && userMemberships.length > 0) {
          preselectedSchoolId = userMemberships[0].school_id;
        }
      }
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

    const cleanStaff = targetStaffCode.replace(/^[-_]+/, "");

    if (targetSchoolCode) {
      const { data: school } = await admin
        .from("schools")
        .select("id, code, slug")
        .or(`code.ilike.${targetSchoolCode},slug.ilike.${targetSchoolCode}`)
        .maybeSingle();

      if (school) {
        const prefixedStaff = `${school.code || targetSchoolCode}-${cleanStaff}`;
        // Look up membership by access_code with broad matching (exact, trimmed, or school-prefixed)
        const { data: membership } = await admin
          .from("school_memberships")
          .select("id, school_id, user_id, access_code, status, user:user_profiles(id, email)")
          .eq("school_id", school.id)
          .eq("status", "active")
          .or(`access_code.ilike.${targetStaffCode},access_code.ilike.${identifier},access_code.ilike.${prefixedStaff},access_code.ilike.%-${cleanStaff}`)
          .maybeSingle();

        if (membership && membership.user) {
          const userObj = membership.user as unknown as { id: string; email: string };
          userEmail = userObj.email;
          preselectedSchoolId = school.id;
        }
      }
    } else {
      // No school code provided: search active memberships directly across schools
      const { data: membership } = await admin
        .from("school_memberships")
        .select("id, school_id, user_id, access_code, status, user:user_profiles(id, email)")
        .eq("status", "active")
        .or(`access_code.ilike.${identifier},access_code.ilike.%-${cleanStaff}`)
        .maybeSingle();

      if (membership && membership.user) {
        const userObj = membership.user as unknown as { id: string; email: string };
        userEmail = userObj.email;
        preselectedSchoolId = membership.school_id;
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

  // Authenticate across candidate password variants (supports 4 to 6 digit PINs seamlessly)
  const candidatePasswords = getPinAuthCandidates(pin);
  let authData: { user: { id: string } } | null = null;
  let authError: { message?: string } | null = null;

  for (const candidate of candidatePasswords) {
    const res = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: candidate,
    });
    if (!res.error && res.data?.user) {
      authData = res.data;
      authError = null;
      break;
    } else {
      authError = res.error;
    }
  }

  if (authError || !authData) {
    const attempt = recordFailedLoginAttempt(identifier);
    if (attempt.blocked) {
      return {
        error: `Too many incorrect PIN attempts. Access locked for ${attempt.retryAfterSeconds || 60} seconds for security.`,
      };
    }
    if (!rawPin) {
      return {
        error: "Could not log in with initial default PIN (123456). If your school set a custom PIN for you, please enter it below.",
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
    .eq("user_id", authData.user.id)
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
  cookieStore.delete("nsei_is_demo");
  cookieStore.delete("nsei_demo_school_id");

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

    // Check if the user already has an active school membership (e.g. invited by school admin)
    const { data: memberships } = await supabase
      .from("school_memberships")
      .select("id, school_id")
      .eq("user_id", data.user.id)
      .eq("status", "active")
      .limit(1);

    if (memberships && memberships.length > 0) {
      const cookieStore = await cookies();
      cookieStore.set(ACTIVE_SCHOOL_COOKIE, memberships[0].school_id, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
      return { redirectTo: "/dashboard" };
    }
  }

  return { redirectTo: "/onboarding" };
}

export async function signOutAction() {
  // Called from a plain <form action={}> : redirect() is safe here (not inside useActionState)
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_SCHOOL_COOKIE);
  cookieStore.delete("nsei_is_demo");
  cookieStore.delete("nsei_demo_school_id");
  redirect("/login");
}

/**
 * Updates a teacher's personal 4 to 6 digit PIN to replace the initial default PIN (123456),
 * protecting their marks and evaluations from student guessing.
 */
export async function updateTeacherPinAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const newPin = String(formData.get("newPin") || "").trim();
    const confirmPin = String(formData.get("confirmPin") || "").trim();

    if (!newPin || newPin.length < 4) {
      return { success: false, error: "Please enter a PIN with at least 4 digits." };
    }
    if (newPin.length > 6) {
      return { success: false, error: "PIN must be between 4 and 6 digits." };
    }
    if (!/^\d+$/.test(newPin)) {
      return { success: false, error: "PIN must contain only numbers (0 to 9)." };
    }
    if (newPin === "123456" || newPin === "0000" || newPin === "1234") {
      return { success: false, error: "Please choose a safer PIN than 123456 or 0000 for exam security." };
    }
    if (newPin !== confirmPin) {
      return { success: false, error: "The two PINs do not match. Please re-enter." };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Your session has expired. Please sign in again." };
    }

    const authPassword = normalizePinForAuth(newPin);

    const { error: updateError } = await supabase.auth.updateUser({
      password: authPassword,
      data: {
        needs_pin_setup: false,
        pin_updated_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      return { success: false, error: updateError.message || "Failed to update your PIN." };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "An unexpected error occurred while saving your PIN." };
  }
}
