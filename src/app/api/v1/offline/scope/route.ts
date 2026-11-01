import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy/context";
import {
  getActiveAcademicYear,
  getSchoolSequences,
  getSchoolClasses,
  getSchoolSubjects,
  getSchoolTeacherAssignments,
  getEnrolledStudents,
} from "@/lib/academic/service";
import type { OfflineTeachingScope } from "@/lib/offline/offline-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const context = await getTenantContext();
    if (!context || !context.school?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = context.school.id;
    const userId = context.user.id;
    const roleCode = context.role.code || "teacher";
    const isAdmin = ["school_admin", "principal", "superadmin"].includes(roleCode);
    const isTeacher = !isAdmin && (roleCode === "teacher" || roleCode === "class_master");

    const activeYear = await getActiveAcademicYear(schoolId);
    if (!activeYear) {
      return NextResponse.json(
        { error: "No active academic year configured for this school." },
        { status: 400 }
      );
    }

    const [sequencesRaw, classesRaw, subjectsRaw, teacherAssignmentsRaw] = await Promise.all([
      getSchoolSequences(schoolId),
      getSchoolClasses(schoolId, activeYear.id),
      getSchoolSubjects(schoolId),
      isTeacher
        ? getSchoolTeacherAssignments(schoolId, activeYear.id, userId)
        : getSchoolTeacherAssignments(schoolId, activeYear.id),
    ]);

    // Format sequences
    const sequences = sequencesRaw.map((seq) => ({
      id: seq.id,
      name: seq.name,
      termId: seq.term_id,
      termName: `Term ${seq.term_id.slice(0, 4)}`,
    }));

    // Format classes & streams
    const classes = classesRaw.map((cls) => ({
      id: cls.id,
      name: cls.name,
      streams: cls.streams.map((stream) => ({
        id: stream.id,
        name: stream.name,
      })),
    }));

    // Format subjects
    const subjects = subjectsRaw.map((sub) => ({
      id: sub.id,
      name: sub.name,
      code: sub.code,
      defaultCoefficient: sub.default_coefficient || 2,
      defaultMaxMarks: sub.default_max_marks || 20,
    }));

    // Assigned streams
    const assignedStreams = teacherAssignmentsRaw.map((a) => ({
      classStreamId: a.class_stream_id,
      subjectId: a.subject_id,
    }));

    // Determine relevant stream IDs to download roster for
    const allStreams = classesRaw.flatMap((cls) => cls.streams);
    let targetStreamIds: string[] = [];

    if (isTeacher && teacherAssignmentsRaw.length > 0) {
      targetStreamIds = Array.from(new Set(teacherAssignmentsRaw.map((a) => a.class_stream_id)));
    } else {
      // Admin, HOD, or teacher without assignments: cache all streams
      targetStreamIds = allStreams.map((s) => s.id);
    }

    // Fetch enrolled students for these streams
    const enrolments =
      targetStreamIds.length > 0
        ? await getEnrolledStudents(
            schoolId,
            activeYear.id,
            undefined,
            targetStreamIds,
            undefined,
            "all"
          )
        : [];

    const enrolledStudents = enrolments.map((e) => ({
      classStreamId: e.class_stream_id,
      studentId: e.student_id,
      matricule: e.student?.matricule || "N/A",
      fullName: `${e.student?.last_name || ""} ${e.student?.first_name || ""}`.trim(),
      gender: e.student?.gender || "M",
    }));

    const scope: OfflineTeachingScope = {
      academicYearId: activeYear.id,
      academicYearName: activeYear.name,
      sequences,
      classes,
      subjects,
      assignedStreams,
      enrolledStudents,
    };

    return NextResponse.json(scope, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, private",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to generate offline scope" },
      { status: 500 }
    );
  }
}
