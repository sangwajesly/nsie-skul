"use server";

import { createClient } from "@/lib/supabase/server";
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

export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<{ error: string } | void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const returnUrl = (formData.get("returnUrl") as string) || "/dashboard";

  const validation = LoginSchema.safeParse({ email, password });
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Check if user has at least one active school membership
  const { data: memberships } = await supabase
    .from("school_memberships")
    .select("id")
    .eq("user_id", data.user.id)
    .eq("status", "active")
    .limit(1);

  if (!memberships || memberships.length === 0) {
    // Authenticated but not linked to any school yet
    redirect("/onboarding");
  }

  // Honour the returnUrl if it's a safe internal path
  const safePath =
    returnUrl.startsWith("/dashboard") || returnUrl.startsWith("/onboarding")
      ? returnUrl
      : "/dashboard";

  redirect(safePath);
}

export async function registerAction(
  prevState: unknown,
  formData: FormData
): Promise<{ error: string } | void> {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validation = RegisterSchema.safeParse({ fullName, email, password });
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const supabase = await createClient();
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
  redirect("/onboarding");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
