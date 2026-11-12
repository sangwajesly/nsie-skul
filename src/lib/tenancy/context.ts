import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { ActiveTenantContext, UserSchoolOption, SchoolSubscriptionInfo } from "@/types/tenancy";
import { School, UserProfile, Role, Permission } from "@/types/database";
import {
  isSchoolHubMode,
  verifyHubSessionToken,
  HUB_SESSION_COOKIE,
} from "@/lib/hub/hub-node-store";

export const ACTIVE_SCHOOL_COOKIE = "nsei_active_school_id";

export const SUPER_ADMIN_EMAILS = [
  "sangwajesly82@gmail.com",
  "nseiskul@gmail.com",
  ...(process.env.SUPER_ADMIN_EMAILS
    ? process.env.SUPER_ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : []),
];

export const SUPER_ADMIN_ROLE_DEF: Role = {
  id: "ef5bdbad-dd6d-4bfb-bc08-739355fe1a2c",
  code: "superadmin",
  name: "Platform Superadmin",
  description: "SaaS platform operator with cross-tenant management",
  is_system: true,
  created_at: "2026-01-01T00:00:00.000Z",
};

/**
 * Retrieves the currently active tenant context for the authenticated user.
 * Wrapped in React cache() to deduplicate requests across layout and page components
 * within the same server render lifecycle.
 */
export const getTenantContext = cache(async function getTenantContext(): Promise<ActiveTenantContext | null> {
  // Check for local School Hub Admin Session first (Offline on-premise Station)
  const cookieStore = await cookies();
  const hubToken = cookieStore.get(HUB_SESSION_COOKIE)?.value;
  if (hubToken) {
    const verifiedHub = verifyHubSessionToken(hubToken);
    if (verifiedHub) {
      const allPermCodes = [
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
        "results.publish",
        "id_cards.print",
        "reports.view_school",
        "school.manage_settings",
        "report_cards.view",
        "attendance.take_assigned",
        "attendance.view_all",
      ];

      const permissions: Permission[] = allPermCodes.map((code) => ({
        id: `perm-${code}`,
        code,
        category: code.split(".")[0],
        description: code,
        created_at: new Date().toISOString(),
      }));

      const activeSchool = {
        id: verifiedHub.schoolId,
        name: verifiedHub.schoolName,
        code: verifiedHub.schoolCode,
        slug: verifiedHub.schoolSlug || "local-school",
        logo_url: verifiedHub.schoolLogoUrl || "/app-icon.png",
        country: "Cameroon",
        address: "School Campus LAN Station",
        phone: null,
        email: null,
        website: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as School;

      const activeRole: Role = {
        id: "role-school-admin",
        code: "school_admin",
        name: "School Hub Administrator",
        description: "Local School Hub Master Station Administrator",
        is_system: true,
        created_at: new Date().toISOString(),
      };

      return {
        user: {
          id: `hub-admin-${verifiedHub.schoolId}`,
          full_name: "School Hub Administrator",
          email: `admin@${verifiedHub.schoolCode.toLowerCase() || "hub"}.local`,
          phone: null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        school: activeSchool,
        membershipId: `mem-hub-${verifiedHub.schoolId}`,
        role: activeRole,
        permissions,
        hasPermission: () => true,
        isClassMaster: true,
        masteredStreamNames: [],
        isHod: true,
        subscription: {
          status: "active",
          plan: "School Hub Perpetual",
          trialEndsAt: null,
          currentPeriodEnd: null,
          isExpired: false,
          isTrial: false,
          daysRemaining: 365,
        },
        isSuperAdmin: false,
        needsPinSetup: false,
      };
    }
  }

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
  const { data: userMemberships } = await supabase
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

  const memberships = userMemberships || [];

  const isSuperAdminUser =
    SUPER_ADMIN_EMAILS.includes(authUser.email?.toLowerCase() || "") ||
    memberships.some((m) => (m.roles as unknown as Role)?.code === "superadmin");

  if (memberships.length === 0 && !isSuperAdminUser) {
    return null;
  }

  // 3. Resolve active school
  const preferredSchoolId = cookieStore.get(ACTIVE_SCHOOL_COOKIE)?.value;

  let activeMembership: any = memberships.find((m) => m.school_id === preferredSchoolId);

  // If superadmin switched to a school where no explicit row exists yet, resolve it dynamically
  if (!activeMembership && isSuperAdminUser) {
    if (preferredSchoolId) {
      const { data: targetSchool } = await supabase
        .from("schools")
        .select("*")
        .eq("id", preferredSchoolId)
        .maybeSingle();

      if (targetSchool) {
        activeMembership = {
          id: `super-${targetSchool.id}`,
          school_id: targetSchool.id,
          status: "active",
          schools: targetSchool,
          roles: SUPER_ADMIN_ROLE_DEF,
        };
      }
    }

    // Fallback for superadmin: first available school in platform
    if (!activeMembership && memberships.length === 0) {
      const { data: anySchool } = await supabase
        .from("schools")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (anySchool) {
        activeMembership = {
          id: `super-${anySchool.id}`,
          school_id: anySchool.id,
          status: "active",
          schools: anySchool,
          roles: SUPER_ADMIN_ROLE_DEF,
        };
      }
    }
  }

  if (!activeMembership) {
    activeMembership = memberships[0];
  }

  // Ensure a real user is never trapped in the demo school if they have a real school
  if (authUser.email !== "demo@nsei-sukul.klarifypath.com") {
    const nonDemoMembership = memberships.find(
      (m: any) => m.schools?.slug !== "demo-bilingual-high-school"
    );
    if (nonDemoMembership && (activeMembership?.schools as any)?.slug === "demo-bilingual-high-school") {
      activeMembership = nonDemoMembership;
    }
  }

  if (!activeMembership) {
    return null;
  }

  const activeSchool = activeMembership.schools as unknown as School;
  const activeRole = isSuperAdminUser
    ? SUPER_ADMIN_ROLE_DEF
    : (activeMembership.roles as unknown as Role);

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

  if (
    ["school_admin", "principal", "superadmin"].includes(activeRole.code) ||
    isSuperAdminUser
  ) {
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
      "finance.manage",
      "payments.record",
      "school.platform.manage",
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

  // 5. Dynamic Dual-Role Resolution, Subscription Status & Student Capacity:
  const adminClient = createAdminClient();
  const [{ data: masteredStreams }, { data: hodDepartments }, { data: subData }, { count: enrolledCount }] =
    await Promise.all([
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
      adminClient
        .from("school_subscriptions")
        .select("*")
        .eq("school_id", activeSchool.id)
        .maybeSingle(),
      adminClient
        .from("enrolments")
        .select("id", { count: "exact", head: true })
        .eq("school_id", activeSchool.id)
        .eq("status", "active"),
    ]);

  // Compute subscription state
  const now = Date.now();
  const trialEndsAt = subData?.trial_ends_at || null;
  const currentPeriodEnd = subData?.current_period_end || null;
  const subStatus = (subData?.status || "trial") as
    | "trial"
    | "active"
    | "past_due"
    | "canceled";

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

  // Tier student limits & grace buffer (10% overage allowed without disruption)
  const activePlan = subData?.plan || "pilot";
  let maxStudents = 300;
  let tierName = "Tier 1: Up to 300 students";

  if (activePlan === "tier_1") {
    maxStudents = 300;
    tierName = "Tier 1: Up to 300 students";
  } else if (activePlan === "tier_2" || activePlan === "standard") {
    maxStudents = 750;
    tierName = "Tier 2: 301 to 750 students";
  } else if (activePlan === "tier_3" || activePlan === "premium") {
    maxStudents = 1500;
    tierName = "Tier 3: 751 to 1,500 students";
  } else if (activePlan === "tier_4" || activePlan === "custom") {
    maxStudents = 99999;
    tierName = "Tier 4: 1,501+ students";
  } else {
    maxStudents = 300;
    tierName = subStatus === "trial" ? "30-Day Free Trial (Up to 300 students)" : "Pilot Plan (Up to 300 students)";
  }

  const actualEnrolled = enrolledCount || 0;
  const bufferLimit = Math.round(maxStudents * 1.10); // 10% grace buffer (e.g. 330)
  const isOverTier = actualEnrolled > maxStudents;
  const isInBuffer = actualEnrolled > maxStudents && actualEnrolled <= bufferLimit;

  const subscription: SchoolSubscriptionInfo = {
    status: subStatus,
    plan: activePlan,
    trialEndsAt,
    currentPeriodEnd,
    isExpired,
    isTrial: subStatus === "trial",
    daysRemaining,
    enrolledCount: actualEnrolled,
    maxStudents,
    bufferLimit,
    tierName,
    isOverTier,
    isInBuffer,
  };

  const isClassMaster = Boolean(masteredStreams && masteredStreams.length > 0);
  const isHod =
    (hodDepartments && hodDepartments.length > 0) || activeRole.code === "hod";

  if (isClassMaster) {
    permissionSet.add("report_cards.view");
    permissionSet.add("attendance.take_assigned");
    permissionSet.add("attendance.view_all");
  }

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
    hasPermission: (code: string) => isSuperAdminUser || permissionSet.has(code),
    isClassMaster,
    masteredStreamNames: masteredStreams?.map((s) => s.name) || [],
    isHod,
    subscription,
    isSuperAdmin: isSuperAdminUser,
    needsPinSetup: Boolean(authUser.user_metadata?.needs_pin_setup),
  };
});

export function hasAnyPermission(
  context: ActiveTenantContext | null,
  permissionCodes: readonly string[]
): boolean {
  if (context?.isSuperAdmin) return true;
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

  if (context.isSuperAdmin) {
    return context;
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

  if (context.isSuperAdmin) {
    return context;
  }

  if (!hasAnyPermission(context, permissionCodes)) {
    throw new Error(`Forbidden: Missing one of the required permissions [${permissionCodes.join(", ")}].`);
  }

  return context;
}

/**
 * Returns all schools available to the current user (for school switcher).
 * If user is Platform Superadmin, returns every active school on the platform.
 */
export async function getUserSchools(): Promise<UserSchoolOption[]> {
  const cookieStore = await cookies();
  const hubToken = cookieStore.get(HUB_SESSION_COOKIE)?.value;
  if (hubToken) {
    const verifiedHub = verifyHubSessionToken(hubToken);
    if (verifiedHub) {
      return [
        {
          membershipId: `mem-hub-${verifiedHub.schoolId}`,
          school: {
            id: verifiedHub.schoolId,
            name: verifiedHub.schoolName,
            code: verifiedHub.schoolCode,
            slug: verifiedHub.schoolSlug || "local-school",
            logo_url: verifiedHub.schoolLogoUrl || "/app-icon.png",
            country: "Cameroon",
            address: "School Campus LAN Station",
            phone: null,
            email: null,
            website: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as unknown as School,
          role: {
            id: "role-school-admin",
            code: "school_admin",
            name: "School Hub Administrator",
            description: "Local School Hub Station Administrator",
            is_system: true,
            created_at: new Date().toISOString(),
          },
          status: "active",
        },
      ];
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: userMemberships } = await supabase
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

  const isSuperAdminUser =
    SUPER_ADMIN_EMAILS.includes(user.email?.toLowerCase() || "") ||
    (userMemberships || []).some(
      (m) => (m.roles as unknown as Role)?.code === "superadmin"
    );

  if (isSuperAdminUser) {
    const { data: allSchools } = await supabase
      .from("schools")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (allSchools && allSchools.length > 0) {
      return allSchools.map((sch) => {
        const directMem = (userMemberships || []).find(
          (m) => m.schools && (m.schools as any).id === sch.id
        );
        return {
          membershipId: directMem ? directMem.id : `super-${sch.id}`,
          school: sch as unknown as School,
          role: SUPER_ADMIN_ROLE_DEF,
          status: "active",
        };
      });
    }
  }

  if (!userMemberships) return [];

  return userMemberships.map((item) => ({
    membershipId: item.id,
    school: item.schools as unknown as School,
    role: item.roles as unknown as Role,
    status: item.status,
  }));
}
