import { createClient } from "@/lib/supabase/server";
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
