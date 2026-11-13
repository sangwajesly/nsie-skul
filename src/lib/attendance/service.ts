import { createClient } from "@/lib/supabase/server";
import { isSchoolHubMode } from "@/lib/hub/hub-node-store";
import {
  AttendanceSession,
  AttendanceRecord,
  DisciplinaryRecord,
} from "@/types/database";

export interface StudentAttendanceSummary {
  unjustifiedAbsHours: number;
  justifiedAbsHours: number;
  lateCount: number;
  punishmentHours: number;
  warning: boolean;
  reprimand: boolean;
  suspension: boolean;
  dismissed: boolean;
}

/**
 * Retrieves the roll call session and student attendance records for a specific stream and date.
 */
export async function getAttendanceSessionWithRecords(
  schoolId: string,
  classStreamId: string,
  sessionDate: string,
  periodType: "daily" | "morning" | "afternoon" = "daily"
): Promise<{ session: AttendanceSession | null; records: AttendanceRecord[] }> {
  // On-premise School Hub: query local PostgreSQL cluster directly (<1ms)
  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      const sesRes = await queryLocalDb(
        `SELECT s.*, json_build_object('id', u.id, 'full_name', u.full_name) as recorder
         FROM public.attendance_sessions s
         LEFT JOIN public.user_profiles u ON u.id = s.recorded_by
         WHERE s.school_id = $1 AND s.class_stream_id = $2 AND s.session_date = $3 AND s.period_type = $4
         LIMIT 1`,
        [schoolId, classStreamId, sessionDate, periodType]
      );

      const session = sesRes.rows[0] as AttendanceSession | null;
      if (!session) return { session: null, records: [] };

      const recRes = await queryLocalDb(
        `SELECT r.*, json_build_object('id', st.id, 'first_name', st.first_name, 'last_name', st.last_name, 'matricule', st.matricule) as student
         FROM public.attendance_records r
         LEFT JOIN public.students st ON st.id = r.student_id
         WHERE r.session_id = $1`,
        [session.id]
      );

      return {
        session,
        records: recRes.rows as AttendanceRecord[],
      };
    } catch {}
  }

  try {
    const supabase = await createClient();

    const { data: sessionData } = await supabase
      .from("attendance_sessions")
      .select(
        `
        *,
        recorder:user_profiles (*)
      `
      )
      .eq("school_id", schoolId)
      .eq("class_stream_id", classStreamId)
      .eq("session_date", sessionDate)
      .eq("period_type", periodType)
      .maybeSingle();

    if (!sessionData) {
      return { session: null, records: [] };
    }

    const { data: recordsData } = await supabase
      .from("attendance_records")
      .select(
        `
        *,
        student:students (*)
      `
      )
      .eq("session_id", sessionData.id);

    return {
      session: sessionData as AttendanceSession,
      records: (recordsData as AttendanceRecord[]) || [],
    };
  } catch {
    return { session: null, records: [] };
  }
}

/**
 * Retrieves recent disciplinary sanctions across the school.
 */
export async function getRecentDisciplinaryIncidents(
  schoolId: string,
  academicYearId: string,
  limit: number = 20,
  classStreamIds?: string[]
): Promise<DisciplinaryRecord[]> {
  if (classStreamIds && classStreamIds.length === 0) return [];

  // On-premise School Hub: query local PostgreSQL cluster directly (<1ms)
  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      let sql = `
        SELECT dr.*,
          json_build_object('id', st.id, 'first_name', st.first_name, 'last_name', st.last_name, 'matricule', st.matricule) as student,
          json_build_object('id', cs.id, 'name', cs.name) as class_stream,
          json_build_object('id', u.id, 'full_name', u.full_name) as recorder
        FROM public.disciplinary_records dr
        LEFT JOIN public.students st ON st.id = dr.student_id
        LEFT JOIN public.class_streams cs ON cs.id = dr.class_stream_id
        LEFT JOIN public.user_profiles u ON u.id = dr.recorded_by
        WHERE dr.school_id = $1 AND dr.academic_year_id = $2
      `;
      const params: any[] = [schoolId, academicYearId];
      if (classStreamIds && classStreamIds.length > 0) {
        params.push(classStreamIds);
        sql += ` AND dr.class_stream_id = ANY($${params.length}::uuid[])`;
      }
      sql += ` ORDER BY dr.incident_date DESC LIMIT ${limit}`;
      const res = await queryLocalDb(sql, params);
      return res.rows as DisciplinaryRecord[];
    } catch {}
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("disciplinary_records")
      .select(
        `
        *,
        student:students (*),
        class_stream:class_streams (*),
        recorder:user_profiles (*)
      `
      )
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .order("incident_date", { ascending: false });

    if (classStreamIds) {
      query = query.in("class_stream_id", classStreamIds);
    }

    const { data } = await query.limit(limit);

    return (data as DisciplinaryRecord[]) || [];
  } catch {
    return [];
  }
}

/**
 * Aggregates attendance and sanctions for a student to populate the official MINESEC report card box.
 */
export async function getStudentDisciplineForReportCard(
  schoolId: string,
  studentId: string,
  termId: string
): Promise<StudentAttendanceSummary> {
  const supabase = await createClient();

  // 1. Roll up absence hours and late counts from attendance records
  const { data: attendanceData } = await supabase
    .from("attendance_records")
    .select(
      `
      status,
      hours_missed,
      session:attendance_sessions!inner (
        term_id
      )
    `
    )
    .eq("school_id", schoolId)
    .eq("student_id", studentId)
    .eq("session.term_id", termId);

  let unjustifiedAbsHours = 0;
  let justifiedAbsHours = 0;
  let lateCount = 0;

  for (const record of attendanceData || []) {
    const hours = Number(record.hours_missed) || 0;
    if (record.status === "unjustified_absent") {
      unjustifiedAbsHours += hours > 0 ? hours : 2; // Default 2h per missed block
    } else if (record.status === "justified_absent") {
      justifiedAbsHours += hours > 0 ? hours : 2;
    } else if (record.status === "late") {
      lateCount += 1;
    }
  }

  // 2. Fetch disciplinary sanctions
  const { data: sanctionsData } = await supabase
    .from("disciplinary_records")
    .select("sanction_type, punishment_hours, status")
    .eq("school_id", schoolId)
    .eq("student_id", studentId)
    .eq("term_id", termId)
    .eq("status", "active");

  const sanctions = sanctionsData || [];
  let punishmentHours = 0;
  let warning = false;
  let reprimand = false;
  let suspension = false;
  let dismissed = false;

  for (const s of sanctions) {
    punishmentHours += s.punishment_hours || 0;
    if (s.sanction_type === "warning") warning = true;
    else if (s.sanction_type === "reprimand") reprimand = true;
    else if (s.sanction_type === "suspension") suspension = true;
    else if (s.sanction_type === "dismissed") dismissed = true;
  }

  return {
    unjustifiedAbsHours,
    justifiedAbsHours,
    lateCount,
    punishmentHours,
    warning,
    reprimand,
    suspension,
    dismissed,
  };
}
