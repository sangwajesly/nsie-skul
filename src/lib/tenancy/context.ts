import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { ActiveTenantContext, UserSchoolOption, SchoolSubscriptionInfo } from "@/types/tenancy";
import { School, UserProfile, Role, Permission } from "@/types/database";

export const ACTIVE_SCHOOL_COOKIE = "nsei_active_school_id";

/**
 * Retrieves the currently active tenant context for the authenticated user.
 * Wrapped in React cache() to deduplicate requests across layout and page components
 * within the same server render lifecycle.
 */
export const getTenantContext = cache(async function getTenantContext(): Promise<ActiveTenantContext | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  // 1. Fetch user profile
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!userProfile) {
    return null;
  }

  // 2. Fetch all active memberships for this user
  const { data: memberships } = await supabase
    .from("school_memberships")
    .select(
      `
      id,
      school_id,
      status,
      schools (*),
      roles (id, code, name, description, is_system)
    `
    )
    .eq("user_id", authUser.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    return null;
  }

  // 3. Resolve active school
  const cookieStore = await cookies();
  const preferredSchoolId = cookieStore.get(ACTIVE_SCHOOL_COOKIE)?.value;

  const activeMembership =
    memberships.find((m) => m.school_id === preferredSchoolId) ||
    memberships[0];

  const activeSchool = activeMembership.schools as unknown as School;
  const activeRole = activeMembership.roles as unknown as Role;

  if (!activeSchool || !activeRole) {
    return null;
  }

  // 4. Fetch permissions for the active role
  const { data: rolePerms } = await supabase
    .from("role_permissions")
    .select("permissions (*)")
    .eq("role_id", activeRole.id);

  const permissions: Permission[] =
    rolePerms?.map((rp) => rp.permissions as unknown as Permission) || [];

  const permissionSet = new Set(permissions.map((p) => p.code));
  if (["school_admin", "principal"].includes(activeRole.code)) {
    for (const code of [
      "students.manage",
      "students.import_export",
      "students.view_all",
      "academics.manage",
      "schemes.manage",
      "assignments.manage",
      "school.settings.manage",
      "staff.manage",
      "marks.view_all",
      "marks.enter_assigned",
      "marks.approve_hod",
      "results.approve_school",
      "report_cards.generate",
      "report_cards.view",
      "attendance.view_all",
      "attendance.take_assigned",
      "audit.view",
    ]) {
      permissionSet.add(code);
    }
  } else if (activeRole.code === "teacher") {
    for (const code of [
      "students.view_assigned",
      "marks.enter_assigned",
      "attendance.take_assigned",
      "report_cards.view",
    ]) {
      permissionSet.add(code);
    }
  } else if (activeRole.code === "class_master") {
    for (const code of [
      "students.view_assigned",
      "marks.enter_assigned",
      "attendance.take_assigned",
      "attendance.view_all",
      "report_cards.view",
    ]) {
      permissionSet.add(code);
    }
  } else if (activeRole.code === "hod") {
    for (const code of [
      "students.view_assigned",
      "marks.view_department",
      "marks.enter_assigned",
      "marks.review_hod",
      "marks.approve_hod",
      "report_cards.view",
      "attendance.take_assigned",
      "assignments.manage",
      "academics.manage",
      "schemes.manage",
    ]) {
      permissionSet.add(code);
    }
  }

  // 5. Dynamic Dual-Role Resolution & Subscription Status:
  // Check if staff member is appointed as a Class Master or HOD, and fetch school license
  const [{ data: masteredStreams }, { data: hodDepartments }, { data: subData }] = await Promise.all([
    supabase
      .from("class_streams")
      .select("id, name")
      .eq("school_id", activeSchool.id)
      .eq("class_master_id", authUser.id),
    supabase
      .from("hod_assignments")
      .select("id, department_id")
      .eq("school_id", activeSchool.id)
      .eq("hod_user_id", authUser.id)
      .eq("status", "active"),
    supabase
      .from("school_subscriptions")
      .select("*")
      .eq("school_id", activeSchool.id)
      .maybeSingle(),
  ]);

  // Compute subscription state
  const now = Date.now();
  const trialEndsAt = subData?.trial_ends_at || null;
  const currentPeriodEnd = subData?.current_period_end || null;
  const subStatus = (subData?.status || "trial") as "trial" | "active" | "past_due" | "canceled";

  let isExpired = false;
  let daysRemaining = 0;

  if (subStatus === "active") {
    if (currentPeriodEnd) {
      const diffMs = new Date(currentPeriodEnd).getTime() - now;
      daysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
      isExpired = diffMs <= 0;
    } else {
      daysRemaining = 365;
      isExpired = false;
    }
  } else if (subStatus === "trial") {
    if (trialEndsAt) {
      const diffMs = new Date(trialEndsAt).getTime() - now;
      daysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
      isExpired = diffMs <= 0;
    } else {
      daysRemaining = 30;
      isExpired = false;
    }
  } else {
    isExpired = true;
    daysRemaining = 0;
  }

  const subscription: SchoolSubscriptionInfo = {
    status: subStatus,
    plan: subData?.plan || "pilot",
    trialEndsAt,
    currentPeriodEnd,
    isExpired,
    isTrial: subStatus === "trial",
    daysRemaining,
  };

  // A teacher only has active Class Master status if assigned to at least one class stream
  const isClassMaster = Boolean(masteredStreams && masteredStreams.length > 0);
  const isHod = (hodDepartments && hodDepartments.length > 0) || activeRole.code === "hod";

  // Grant dual-role permissions if appointed as Class Master
  if (isClassMaster) {
    permissionSet.add("report_cards.view");
    permissionSet.add("attendance.take_assigned");
    permissionSet.add("attendance.view_all");
  }

  // Grant dual-role permissions if appointed as HOD
  if (isHod) {
    permissionSet.add("marks.view_department");
    permissionSet.add("marks.review_hod");
    permissionSet.add("marks.approve_hod");
    permissionSet.add("assignments.manage");
    permissionSet.add("academics.manage");
    permissionSet.add("schemes.manage");
  }

  return {
    user: userProfile as UserProfile,
    school: activeSchool,
    membershipId: activeMembership.id,
    role: activeRole,
    permissions,
    hasPermission: (code: string) => permissionSet.has(code),
    isClassMaster,
    masteredStreamNames: masteredStreams?.map((s) => s.name) || [],
    isHod,
    subscription,
  };
});

export function hasAnyPermission(
  context: ActiveTenantContext | null,
  permissionCodes: readonly string[]
): boolean {
  return Boolean(context && permissionCodes.some((code) => context.hasPermission(code)));
}

/**
 * Asserts that the authenticated user has a specific permission in the active school.
 * Throws an Error if unauthorized.
 */
export async function requirePermission(permissionCode: string): Promise<ActiveTenantContext> {
  const context = await getTenantContext();

  if (!context) {
    throw new Error("Unauthorized: No active school session found.");
  }

  if (!context.hasPermission(permissionCode)) {
    throw new Error(
      `Forbidden: Missing required permission [${permissionCode}] for school ${context.school.name}.`
    );
  }

  return context;
}

export async function requireAnyPermission(
  permissionCodes: readonly string[]
): Promise<ActiveTenantContext> {
  const context = await getTenantContext();

  if (!context) {
    throw new Error("Unauthorized: No active school session found.");
  }

  if (!hasAnyPermission(context, permissionCodes)) {
    throw new Error(`Forbidden: Missing one of the required permissions [${permissionCodes.join(", ")}].`);
  }

  return context;
}

/**
 * Returns all schools available to the current user (for school switcher).
 */
export async function getUserSchools(): Promise<UserSchoolOption[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("school_memberships")
    .select(
      `
      id,
      status,
      schools (*),
      roles (*)
    `
    )
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!data) return [];

  return data.map((item) => ({
    membershipId: item.id,
    school: item.schools as unknown as School,
    role: item.roles as unknown as Role,
    status: item.status,
  }));
}
