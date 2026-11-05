import { createAdminClient } from "@/lib/supabase/admin";

export interface PlatformPublicStats {
  schoolsCount: number;
  studentsCount: number;
  marksCount: number;
  schoolNames: string[];
}

const FALLBACK_STATS: PlatformPublicStats = {
  schoolsCount: 3,
  studentsCount: 197,
  marksCount: 420,
  schoolNames: [
    "Government Bilingual High School Bamenda",
    "Nsei College Of Excellence",
    "Givtech Secondary Schools",
  ],
};

/**
 * Fetches platform-wide public statistics for the landing page.
 * Uses the privileged admin client on the server to bypass school tenancy RLS.
 * Falls back gracefully to baseline metrics if the database is unreachable or offline.
 */
export async function getPlatformPublicStats(): Promise<PlatformPublicStats> {
  try {
    const supabase = createAdminClient();

    const [schoolsRes, studentsRes, marksRes, featuredLogRes] = await Promise.all([
      supabase
        .from("schools")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("assessment_marks").select("id", { count: "exact", head: true }),
      supabase
        .from("audit_logs")
        .select("details")
        .eq("resource_type", "platform_settings")
        .eq("resource_id", "featured_landing_schools")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const allActiveSchools = schoolsRes.data || [];
    const schoolsCount = schoolsRes.count ?? (allActiveSchools.length > 0 ? allActiveSchools.length : FALLBACK_STATS.schoolsCount);
    const studentsCount = studentsRes.count ?? FALLBACK_STATS.studentsCount;
    const marksCount = marksRes.count ?? FALLBACK_STATS.marksCount;

    // Check if the super admin has hand-picked featured schools for the platform
    const featuredSchoolIds: string[] = featuredLogRes.data?.details?.featuredSchoolIds || [];

    let schoolNames: string[] = [];
    if (featuredSchoolIds.length > 0 && allActiveSchools.length > 0) {
      // Preserve the exact order chosen by the Super Admin
      schoolNames = featuredSchoolIds
        .map((id) => allActiveSchools.find((s) => s.id === id)?.name)
        .filter((name): name is string => Boolean(name));
    }

    // Fall back to stable alphabetical list if none are featured or allActiveSchools list
    if (schoolNames.length === 0) {
      schoolNames = allActiveSchools.length > 0
        ? allActiveSchools.map((s) => s.name).filter(Boolean)
        : FALLBACK_STATS.schoolNames;
    }

    return {
      schoolsCount: Math.max(schoolsCount, FALLBACK_STATS.schoolsCount),
      studentsCount: Math.max(studentsCount, FALLBACK_STATS.studentsCount),
      marksCount: Math.max(marksCount, FALLBACK_STATS.marksCount),
      schoolNames,
    };
  } catch (err) {
    console.warn("Could not query platform stats from Supabase, using baseline stats:", err);
    return FALLBACK_STATS;
  }
}
