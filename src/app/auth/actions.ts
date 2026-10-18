"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_SCHOOL_COOKIE } from "@/lib/tenancy/context";
import { redirect } from "next/navigation";
import { z } from "zod";

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
    return { error: error.message };
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("school_memberships")
    .select("id, school_id")
    .eq("user_id", data.user.id)
    .eq("status", "active");

  if (membershipsError) {
    return { error: "Could not load your school access. Please try again." };
  }

  if (!memberships || memberships.length === 0) {
    // Authenticated but not linked to any school yet
    return { redirectTo: "/onboarding" };
  }

  // Honour only known internal destinations after authentication.
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
    // Create a user_profile row so the rest of the app can resolve identity
    await supabase.from("user_profiles").upsert({
      id: data.user.id,
      full_name: fullName,
      email,
    });
  }

  // New users always go to onboarding first (no school membership yet)
  return { redirectTo: "/onboarding" };
}

export async function signOutAction() {
  // Called from a plain <form action={}> — redirect() is safe here (not inside useActionState)
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
