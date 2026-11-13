import { NextResponse, type NextRequest } from "next/server";
import { getTenantContext, getUserSchools } from "@/lib/tenancy/context";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveAcademicYear,
  getSchoolSequences,
  getSchoolClasses,
  getSchoolSubjects,
  getSchoolTeacherAssignments,
  getEnrolledStudents,
  getHodScope,
} from "@/lib/academic/service";
import type { OfflineTeachingScope } from "@/lib/offline/offline-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContext();
    if (!context || !context.school?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get("schoolId");

    let schoolId = context.school.id;
    let roleCode = context.role.code || "teacher";

    // If teacher is synchronizing a specific school from their authorized memberships
    if (requestedSchoolId && requestedSchoolId !== context.school.id) {
      const memberships = await getUserSchools();
      const targetMembership = memberships.find((m) => m.school.id === requestedSchoolId);
      if (!targetMembership) {
        return NextResponse.json(
          { error: "Access denied to the requested school." },
          { status: 403 }
        );
      }
      schoolId = targetMembership.school.id;
      roleCode = targetMembership.role.code || "teacher";
    }

    const userId = context.user.id;
    const isAdmin = ["school_admin", "principal", "superadmin"].includes(roleCode);
    const isHod = !isAdmin && (roleCode === "hod" || Boolean(context.isHod));
    const isTeacher = !isAdmin && !isHod && (roleCode === "teacher" || roleCode === "class_master");

    let activeYear = await getActiveAcademicYear(schoolId);
    if (!activeYear) {
      try {
        const { queryLocalDb } = await import("@/lib/db/local-postgres");
        const res = await queryLocalDb(
          `SELECT * FROM academic_years WHERE school_id = $1 ORDER BY is_current DESC, start_date DESC LIMIT 1;`,
          [schoolId]
        );
        if (res.rows.length > 0) {
          activeYear = res.rows[0];
        }
      } catch {}
    }

    if (!activeYear) {
      return NextResponse.json(
        { error: "No active academic year configured for this school." },
        { status: 400 }
      );
    }

    let [sequencesRaw, classesRaw, subjectsRaw, teacherAssignmentsRaw, hodScope] = await Promise.all([
      getSchoolSequences(schoolId),
      getSchoolClasses(schoolId, activeYear.id),
      getSchoolSubjects(schoolId),
      isTeacher
        ? getSchoolTeacherAssignments(schoolId, activeYear.id, userId)
        : getSchoolTeacherAssignments(schoolId, activeYear.id),
      isHod
        ? getHodScope(schoolId, activeYear.id, userId)
        : Promise.resolve(null),
    ]);

    // Local DB fallbacks if running in standalone offline hub mode
    if (classesRaw.length === 0) {
      try {
        const { queryLocalDb } = await import("@/lib/db/local-postgres");
        const clsRes = await queryLocalDb(
          `SELECT id, name, level_order, cycle FROM classes WHERE school_id = $1 ORDER BY level_order ASC;`,
          [schoolId]
        );
        if (clsRes.rows.length > 0) {
          const stmRes = await queryLocalDb(
            `SELECT id, class_id, name, stream_tag FROM class_streams WHERE school_id = $1 ORDER BY name ASC;`,
            [schoolId]
          );
          classesRaw = clsRes.rows.map((c) => ({
            ...c,
            streams: stmRes.rows.filter((s) => s.class_id === c.id),
          }));
        }
      } catch {}
    }

    if (sequencesRaw.length === 0) {
      try {
        const { queryLocalDb } = await import("@/lib/db/local-postgres");
        const seqRes = await queryLocalDb(
          `SELECT id, term_id, sequence_number, name FROM evaluation_sequences WHERE school_id = $1 ORDER BY sequence_number ASC;`,
          [schoolId]
        );
        if (seqRes.rows.length > 0) {
          sequencesRaw = seqRes.rows as any;
        }
      } catch {}
    }

    if (subjectsRaw.length === 0) {
      try {
        const { queryLocalDb } = await import("@/lib/db/local-postgres");
        const subRes = await queryLocalDb(
          `SELECT id, school_id, department_id, name, code, default_coefficient, default_max_marks FROM subjects WHERE school_id = $1 ORDER BY name ASC;`,
          [schoolId]
        );
        if (subRes.rows.length > 0) {
          subjectsRaw = subRes.rows as any;
        }
      } catch {}
    }

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

    // Filter subjects strictly according to role:
    // - Superadmin / School Admin: all school subjects
    // - HOD: only subjects within their department + personally assigned subjects
    // - Teacher: only subjects they are assigned to teach
    let filteredSubjectsRaw = subjectsRaw;
    if (isHod) {
      const hodSubjectIds = new Set([
        ...(hodScope?.subjectIds || []),
        ...teacherAssignmentsRaw.filter((a) => a.teacher_user_id === userId).map((a) => a.subject_id),
      ]);
      filteredSubjectsRaw = subjectsRaw.filter((s) => hodSubjectIds.has(s.id));
    } else if (isTeacher) {
      const assignedSubIds = new Set(teacherAssignmentsRaw.map((a) => a.subject_id));
      filteredSubjectsRaw = subjectsRaw.filter((s) => assignedSubIds.has(s.id));
    }

    // Format subjects
    const subjects = filteredSubjectsRaw.map((sub) => ({
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
    } else if (isHod) {
      const allowedSubIds = new Set(filteredSubjectsRaw.map((s) => s.id));
      const hodStreamIds = teacherAssignmentsRaw
        .filter((a) => allowedSubIds.has(a.subject_id))
        .map((a) => a.class_stream_id);
      targetStreamIds = Array.from(new Set(hodStreamIds));
      if (targetStreamIds.length === 0) {
        targetStreamIds = allStreams.map((s) => s.id);
      }
    } else {
      // Admin: cache all streams
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

    // Fetch timetable slots for this school and academic year
    const supabase = await createClient();
    let timetableQuery = supabase
      .from("timetable_slots")
      .select(`
        id,
        day_of_week,
        room_name,
        teacher_id,
        class_stream_id,
        period:timetable_periods(id, period_number, start_time, end_time, is_break, name),
        subject:subjects(id, name, code),
        teacher:users(id, full_name),
        class_stream:class_streams(id, name)
      `)
      .eq("school_id", schoolId)
      .eq("academic_year_id", activeYear.id);

    if (isTeacher && !isHod) {
      timetableQuery = timetableQuery.eq("teacher_id", userId);
    }

    const { data: slotsRaw } = await timetableQuery;
    const timetable = ((slotsRaw as any[]) || []).map((s) => ({
      id: s.id,
      dayOfWeek: s.day_of_week,
      periodNumber: s.period?.period_number || 1,
      startTime: s.period?.start_time || "08:00",
      endTime: s.period?.end_time || "08:50",
      isBreak: s.period?.is_break || false,
      periodName: s.period?.name || `Period ${s.period?.period_number || 1}`,
      subjectName: s.subject?.name || "Subject",
      subjectCode: s.subject?.code || "SUB",
      className: s.class_stream?.name || "Class",
      classStreamId: s.class_stream_id,
      roomName: s.room_name || null,
      teacherId: s.teacher_id || null,
      teacherName: s.teacher?.full_name || null,
    }));

    const scope: OfflineTeachingScope = {
      academicYearId: activeYear.id,
      academicYearName: activeYear.name,
      sequences,
      classes,
      subjects,
      assignedStreams,
      enrolledStudents,
      timetable,
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
