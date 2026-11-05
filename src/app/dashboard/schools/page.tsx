import { redirect } from "next/navigation";
import { getTenantContext, SUPER_ADMIN_EMAILS } from "@/lib/tenancy/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { SchoolsManagerClient, type SchoolRow } from "./SchoolsManagerClient";

export const metadata = {
  title: "Multi-Tenant School Network | Nsei Sukul",
  description: "Platform Super Admin console for managing school tenancies across Cameroon.",
};

export default async function PlatformSchoolsPage() {
  const context = await getTenantContext();

  if (!context) {
    redirect("/login");
  }

  const isSuperAdmin =
    context.isSuperAdmin ||
    context.role.code === "superadmin" ||
    SUPER_ADMIN_EMAILS.includes(context.user.email?.toLowerCase() || "");

  if (!isSuperAdmin) {
    redirect("/dashboard");
  }

  const adminClient = createAdminClient();

  // 1. Fetch all schools and landing page featured configuration in parallel
  const [schoolsResult, featuredLogResult] = await Promise.all([
    adminClient
      .from("schools")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    adminClient
      .from("audit_logs")
      .select("details")
      .eq("resource_type", "platform_settings")
      .eq("resource_id", "featured_landing_schools")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data: schoolsData, error } = schoolsResult;
  const featuredSchoolIds: string[] = featuredLogResult.data?.details?.featuredSchoolIds || [];

  if (error || !schoolsData) {
    throw new Error(`Failed to load school network: ${error?.message || "Unknown error"}`);
  }

  // 2. Fetch parallel aggregates for each school
  const schoolRows: SchoolRow[] = await Promise.all(
    schoolsData.map(async (sch) => {
      const [
        { count: studentCount },
        { count: staffCount },
        { count: streamCount },
        { data: activeYear },
        { data: subData },
      ] = await Promise.all([
        adminClient
          .from("students")
          .select("id", { count: "exact", head: true })
          .eq("school_id", sch.id)
          .eq("is_active", true),
        adminClient
          .from("school_memberships")
          .select("id", { count: "exact", head: true })
          .eq("school_id", sch.id)
          .eq("status", "active"),
        adminClient
          .from("class_streams")
          .select("id", { count: "exact", head: true })
          .eq("school_id", sch.id),
        adminClient
          .from("academic_years")
          .select("name")
          .eq("school_id", sch.id)
          .eq("is_current", true)
          .maybeSingle(),
        adminClient
          .from("school_subscriptions")
          .select("*")
          .eq("school_id", sch.id)
          .maybeSingle(),
      ]);

      const now = Date.now();
      const trialEndsAt = subData?.trial_ends_at || null;
      const currentPeriodEnd = subData?.current_period_end || null;
      const subStatus = (subData?.status || "trial") as
        | "trial"
        | "active"
        | "past_due"
        | "canceled";

      let daysRemaining = 0;
      let isExpired = false;

      if (subStatus === "active") {
        if (currentPeriodEnd) {
          const diffMs = new Date(currentPeriodEnd).getTime() - now;
          daysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
          isExpired = diffMs <= 0;
        } else {
          daysRemaining = 365;
        }
      } else if (subStatus === "trial") {
        if (trialEndsAt) {
          const diffMs = new Date(trialEndsAt).getTime() - now;
          daysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
          isExpired = diffMs <= 0;
        } else {
          daysRemaining = 30;
        }
      } else {
        isExpired = true;
      }

      return {
        id: sch.id,
        name: sch.name,
        code: sch.code,
        slug: sch.slug,
        subsystem: sch.subsystem as "anglophone" | "francophone" | "bilingual",
        address: sch.address,
        phone: sch.phone,
        studentCount: studentCount || 0,
        staffCount: staffCount || 0,
        streamCount: streamCount || 0,
        academicYearName: activeYear?.name || null,
        isFeaturedOnLanding: featuredSchoolIds.includes(sch.id),
        subscription: {
          status: subStatus,
          plan: subData?.plan || "pilot",
          trialEndsAt,
          currentPeriodEnd,
          daysRemaining,
          isExpired,
        },
      };
    })
  );

  return (
    <SchoolsManagerClient
      schools={schoolRows}
      currentActiveSchoolId={context.school.id}
      currentUserName={context.user.full_name}
    />
  );
}
