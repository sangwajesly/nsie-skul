"use server";

import { getTenantContext } from "@/lib/tenancy/context";
import { getAcademicAnalytics, type AcademicAnalyticsData } from "@/lib/academic/analytics-service";

export async function fetchSequenceAnalyticsAction(
  sequenceId: string
): Promise<{ success: boolean; data?: AcademicAnalyticsData; error?: string }> {
  try {
    const tenantContext = await getTenantContext();
    if (!tenantContext || !tenantContext.school?.id) {
      throw new Error("Unauthorized or session expired.");
    }

    const schoolId = tenantContext.school.id;
    const roleCode = tenantContext.role?.code || "teacher";
    const isAdmin = ["school_admin", "principal", "superadmin"].includes(roleCode);
    const isTeacher = roleCode === "teacher" || roleCode === "class_master";
    const isHod = !isAdmin && (roleCode === "hod" || Boolean(tenantContext.isHod));

    const role: "admin" | "teacher" | "hod" = isAdmin ? "admin" : isHod ? "hod" : "teacher";

    const data = await getAcademicAnalytics({
      schoolId,
      sequenceId,
      role,
      userId: tenantContext.user?.id,
    });

    if (!data) {
      throw new Error("No academic data recorded for this sequence yet.");
    }

    return { success: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load sequence analytics.";
    return { success: false, error: msg };
  }
}
