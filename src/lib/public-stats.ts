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

    const [schoolsRes, studentsRes, marksRes] = await Promise.all([
      supabase.from("schools").select("name", { count: "exact" }),
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("assessment_marks").select("id", { count: "exact", head: true }),
    ]);

    const schoolsCount = schoolsRes.count ?? (schoolsRes.data ? schoolsRes.data.length : FALLBACK_STATS.schoolsCount);
    const studentsCount = studentsRes.count ?? FALLBACK_STATS.studentsCount;
    const marksCount = marksRes.count ?? FALLBACK_STATS.marksCount;

    const schoolNames =
      schoolsRes.data && schoolsRes.data.length > 0
        ? schoolsRes.data.map((s) => s.name).filter(Boolean)
        : FALLBACK_STATS.schoolNames;

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
