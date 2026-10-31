import { getTenantContext } from "@/lib/tenancy/context";
import { getActiveAcademicYear, getSchoolClasses, getSchoolSubjects } from "@/lib/academic/service";
import {
  getSchoolTimetableProfiles,
  getSchoolTeacherAvailabilities,
  getTimetableSlots,
} from "@/lib/academic/timetable-service";
import { createClient } from "@/lib/supabase/server";
import { TimetableViewClient } from "./TimetableViewClient";
import Link from "next/link";
import { ArrowLeft, Calendar, Sparkles } from "lucide-react";
import { UserProfile } from "@/types/database";

export const dynamic = "force-dynamic";

interface TimetablePageProps {
  searchParams: Promise<{
    streamId?: string;
    profileId?: string;
    tab?: string;
  }>;
}

export default async function TimetablePage({ searchParams }: TimetablePageProps) {
  const params = await searchParams;
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";
  const roleCode = context?.role?.code || "teacher";
  const isAdmin = ["school_admin", "principal", "superadmin"].includes(roleCode);
  const isHod = !isAdmin && (roleCode === "hod" || Boolean(context?.isHod));
  const isTeacher = !isAdmin && !isHod && (roleCode === "teacher" || roleCode === "class_master");

  const activeYear = await getActiveAcademicYear(schoolId);
  const supabase = await createClient();

  // Load profiles, classes, subjects, availabilities, and all timetable slots in parallel
  const [profiles, classesWithStreams, subjects, availabilities, allSlots, teachersQuery] = await Promise.all([
    getSchoolTimetableProfiles(schoolId),
    getSchoolClasses(schoolId, activeYear?.id),
    getSchoolSubjects(schoolId),
    getSchoolTeacherAvailabilities(schoolId),
    activeYear ? getTimetableSlots(schoolId, activeYear.id) : Promise.resolve([]),
    supabase
      .from("school_memberships")
      .select("user:users(id, full_name, email), roles(code)")
      .eq("school_id", schoolId)
      .eq("status", "active"),
  ]);

  const allStreams = classesWithStreams.flatMap((c) => c.streams);

  // Extract unique teachers from active school memberships
  const teachersMap = new Map<string, UserProfile>();
  if (teachersQuery.data) {
    for (const m of teachersQuery.data) {
      const u = m.user as unknown as UserProfile;
      if (u && u.id) {
        teachersMap.set(u.id, u);
      }
    }
  }
  const teachers = Array.from(teachersMap.values()).sort((a, b) =>
    (a.full_name || "").localeCompare(b.full_name || "")
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8DFC9]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/dashboard/academics"
              className="inline-flex items-center gap-1 text-[#525E4B] hover:text-[#142010] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Academics</span>
            </Link>
            <span className="text-[#E8DFC9]">/</span>
            <span className="font-semibold text-[#2A7C13]">Timetable Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#142010] tracking-tight">
            Master Timetable &amp; Bell Schedules
          </h1>
          <p className="text-xs text-[#525E4B]">
            Configure multi-system bell periods (Grammar, Technical &amp; Commercial), manage teacher free days, and generate conflict-free class timetables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-[4px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] text-xs font-bold">
            {activeYear?.name || "Academic Year Not Set"}
          </span>
        </div>
      </div>

      {/* Main Interactive Timetable Client Component */}
      <TimetableViewClient
        school={context?.school || null}
        academicYear={activeYear}
        isAdmin={isAdmin}
        isHod={isHod}
        isTeacher={isTeacher}
        currentUserId={context?.user?.id || ""}
        initialProfiles={profiles}
        classesWithStreams={classesWithStreams}
        allStreams={allStreams}
        subjects={subjects}
        teachers={teachers}
        initialAvailabilities={availabilities}
        initialSlots={allSlots}
        initialStreamId={params.streamId || allStreams[0]?.id || ""}
        initialProfileId={params.profileId || profiles[0]?.id || ""}
        initialTab={params.tab || "grid"}
      />
    </div>
  );
}
