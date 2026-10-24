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
  academicYearId?: string,
  classMasterUserId?: string
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

  if (classMasterUserId) {
    query = query.eq("class_master_id", classMasterUserId);
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

export async function getClassStreamsForSubjects(
  schoolId: string,
  classStreamIds: string[],
  subjectIds: string[]
): Promise<string[]> {
  if (!schoolId || classStreamIds.length === 0 || subjectIds.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("class_subjects")
    .select("class_stream_id")
    .eq("school_id", schoolId)
    .in("class_stream_id", classStreamIds)
    .in("subject_id", subjectIds);

  return [...new Set(data?.map((row) => row.class_stream_id) || [])];
}

export async function getAssignedClassStreamIds(
  schoolId: string,
  academicYearId: string,
  userId: string,
  roleCode: string
): Promise<string[]> {
  if (!schoolId || !academicYearId || !userId) return [];

  const supabase = await createClient();

  if (roleCode === "teacher") {
    const { data } = await supabase
      .from("teacher_assignments")
      .select("class_stream_id")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .eq("teacher_user_id", userId);

    return [...new Set(data?.map((assignment) => assignment.class_stream_id) || [])];
  }

  if (roleCode === "class_master") {
    const { data } = await supabase
      .from("class_streams")
      .select("id")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .eq("class_master_id", userId);

    return [...new Set(data?.map((stream) => stream.id) || [])];
  }

  if (roleCode !== "hod") return [];

  const { data: hodAssignments } = await supabase
    .from("hod_assignments")
    .select("department_id, subject_id")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .eq("hod_user_id", userId)
    .eq("status", "active");

  if (!hodAssignments?.length) return [];

  const explicitSubjectIds = hodAssignments
    .map((assignment) => assignment.subject_id)
    .filter((subjectId): subjectId is string => Boolean(subjectId));
  const departmentIds = [...new Set(hodAssignments.map((assignment) => assignment.department_id))];
  const subjectQueries = [];

  if (explicitSubjectIds.length > 0) {
    subjectQueries.push(
      supabase.from("subjects").select("id").eq("school_id", schoolId).in("id", explicitSubjectIds)
    );
  }

  if (departmentIds.length > 0) {
    subjectQueries.push(
      supabase.from("subjects").select("id").eq("school_id", schoolId).in("department_id", departmentIds)
    );
  }

  const subjectResults = await Promise.all(subjectQueries);
  const subjectIds = [...new Set(subjectResults.flatMap((result) => result.data?.map((subject) => subject.id) || []))];
  if (subjectIds.length === 0) return [];

  const { data: streams } = await supabase
    .from("class_streams")
    .select("id")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId);
  const streamIds = streams?.map((stream) => stream.id) || [];
  if (streamIds.length === 0) return [];

  const { data: classSubjects } = await supabase
    .from("class_subjects")
    .select("class_stream_id")
    .eq("school_id", schoolId)
    .in("class_stream_id", streamIds)
    .in("subject_id", subjectIds);

  return [...new Set(classSubjects?.map((item) => item.class_stream_id) || [])];
}

/**
 * Lists active HOD assignments for a school in an academic year.
 */
export async function getSchoolHodAssignments(
  schoolId: string,
  academicYearId: string,
  hodUserId?: string
): Promise<HodAssignment[]> {
  const supabase = await createClient();
  let query = supabase
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

  if (hodUserId) {
    query = query.eq("hod_user_id", hodUserId);
  }

  const { data } = await query;

  return (data as HodAssignment[]) || [];
}

/**
 * Lists all teacher class-subject assignments for a school in an academic year.
 */
export async function getSchoolTeacherAssignments(
  schoolId: string,
  academicYearId: string,
  teacherUserId?: string
): Promise<TeacherAssignment[]> {
  const supabase = await createClient();
  let query = supabase
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

  if (teacherUserId) {
    query = query.eq("teacher_user_id", teacherUserId);
  }

  const { data } = await query;

  return (data as TeacherAssignment[]) || [];
}

/**
 * Lists students enrolled in a school, with optional filtering by class stream.
 */
export async function getEnrolledStudents(
  schoolId: string,
  academicYearId: string,
  classStreamId?: string,
  classStreamIds?: string[],
  limit?: number,
  status: string = "active"
): Promise<Enrolment[]> {
  if (classStreamIds && classStreamIds.length === 0) return [];

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
    .eq("academic_year_id", academicYearId);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (classStreamId) {
    query = query.eq("class_stream_id", classStreamId);
  }

  if (classStreamIds) {
    query = query.in("class_stream_id", classStreamIds);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data } = await query;
  return (data as Enrolment[]) || [];
}
