"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ACTIVE_SCHOOL_COOKIE, getUserSchools } from "@/lib/tenancy/context";
import { uuidSchema } from "@/lib/validation";

function getSafeDashboardPath(value: string) {
  const baseUrl = "http://nsei.local";
  const destination = new URL(value, baseUrl);

  if (
    destination.origin !== baseUrl ||
    (destination.pathname !== "/dashboard" && !destination.pathname.startsWith("/dashboard/"))
  ) {
    return "/dashboard";
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export async function setActiveSchoolAction(formData: FormData) {
  const parsed = z
    .object({
      schoolId: uuidSchema("Choose a valid school."),
      returnTo: z.string().optional(),
    })
    .safeParse({
      schoolId: formData.get("schoolId"),
      returnTo: String(formData.get("returnTo") || "/dashboard"),
    });

  if (!parsed.success) {
    throw new Error("Choose a valid school.");
  }

  const memberships = await getUserSchools();
  const selectedMembership = memberships.find(
    (membership) => membership.school.id === parsed.data.schoolId
  );

  if (!selectedMembership) {
    throw new Error("You do not have active access to that school.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SCHOOL_COOKIE, selectedMembership.school.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(getSafeDashboardPath(parsed.data.returnTo || "/dashboard"));
}
