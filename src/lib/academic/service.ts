import { createClient } from "@/lib/supabase/server";
import {
  Department,
  Subject,
  SchoolClass,
  ClassStream,
  ClassSubject,
  HodAssignment,
  TeacherAssignment,
  Student,
  Enrolment,
  AcademicYear,
  EvaluationSequence,
} from "@/types/database";

/**
 * Retrieves the currently active academic year for a school.
 */
export async function getActiveAcademicYear(schoolId: string): Promise<AcademicYear | null> {
  if (!schoolId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_years")
    .select("*")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();

  return (data as AcademicYear | null) || null;
}

/**
 * Retrieves the 6 evaluation sequences for an academic year.
 */
export async function getSchoolSequences(schoolId: string): Promise<EvaluationSequence[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("evaluation_sequences")
    .select("*")
    .eq("school_id", schoolId)
    .order("sequence_number", { ascending: true });

  return (data as EvaluationSequence[]) || [];
}

/**
 * Lists all departments in a school, with their assigned subjects and active HOD.
 */
export async function getSchoolDepartments(schoolId: string): Promise<Department[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select(
      `
      *,
      subjects (*),
      hod_assignments (
        *,
        hod_user:user_profiles (*),
        subject:subjects (*)
      )
    `
    )
    .eq("school_id", schoolId)
    .order("name", { ascending: true });

  return (data as Department[]) || [];
}

/**
 * Lists all subjects in a school.
 */
export async function getSchoolSubjects(schoolId: string): Promise<Subject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select(
      `
      *,
      department:departments (*)
    `
    )
    .eq("school_id", schoolId)
    .order("name", { ascending: true });

  return (data as Subject[]) || [];
}

/**
 * Lists all classes and their streams for the active year.
 */
export async function getSchoolClasses(
  schoolId: string,
  academicYearId?: string
): Promise<(SchoolClass & { streams: ClassStream[] })[]> {
  const supabase = await createClient();

  const { data: classes } = await supabase
    .from("classes")
    .select("*")
    .eq("school_id", schoolId)
    .order("level_order", { ascending: true });

  if (!classes) return [];

  let query = supabase
    .from("class_streams")
    .select(
      `
      *,
      class_master:user_profiles (*)
    `
    )
    .eq("school_id", schoolId);

  if (academicYearId) {
    query = query.eq("academic_year_id", academicYearId);
  }

  const { data: streams } = await query;

  return classes.map((c) => ({
    ...c,
    streams: (streams?.filter((s) => s.class_id === c.id) as ClassStream[]) || [],
  }));
}

/**
 * Lists all subjects offered in a specific class stream, including customized coefficients and max marks.
 */
export async function getStreamSubjects(classStreamId: string): Promise<ClassSubject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("class_subjects")
    .select(
      `
      *,
      subject:subjects (*)
    `
    )
    .eq("class_stream_id", classStreamId);

  return (data as ClassSubject[]) || [];
}

/**
 * Lists active HOD assignments for a school in an academic year.
 */
export async function getSchoolHodAssignments(
  schoolId: string,
  academicYearId: string
): Promise<HodAssignment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hod_assignments")
    .select(
      `
      *,
      hod_user:user_profiles (*),
      department:departments (*),
      subject:subjects (*)
    `
    )
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .eq("status", "active");

  return (data as HodAssignment[]) || [];
}

/**
 * Lists all teacher class-subject assignments for a school in an academic year.
 */
export async function getSchoolTeacherAssignments(
  schoolId: string,
  academicYearId: string
): Promise<TeacherAssignment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teacher_assignments")
    .select(
      `
      *,
      teacher:user_profiles (*),
      class_stream:class_streams (*),
      subject:subjects (*)
    `
    )
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId);

  return (data as TeacherAssignment[]) || [];
}

/**
 * Lists students enrolled in a school, with optional filtering by class stream.
 */
export async function getEnrolledStudents(
  schoolId: string,
  academicYearId: string,
  classStreamId?: string
): Promise<Enrolment[]> {
  const supabase = await createClient();
  let query = supabase
    .from("enrolments")
    .select(
      `
      *,
      student:students (*),
      class_stream:class_streams (*)
    `
    )
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .eq("status", "active");

  if (classStreamId) {
    query = query.eq("class_stream_id", classStreamId);
  }

  const { data } = await query;
  return (data as Enrolment[]) || [];
}
