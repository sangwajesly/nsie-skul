import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { ActiveTenantContext, UserSchoolOption } from "@/types/tenancy";
import { School, UserProfile, Role, Permission } from "@/types/database";

export const ACTIVE_SCHOOL_COOKIE = "nsei_active_school_id";

/**
 * Retrieves the currently active tenant context for the authenticated user.
 */
export async function getTenantContext(): Promise<ActiveTenantContext | null> {
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

  return {
    user: userProfile as UserProfile,
    school: activeSchool,
    membershipId: activeMembership.id,
    role: activeRole,
    permissions,
    hasPermission: (code: string) => permissionSet.has(code),
  };
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
