import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSchoolHubMode } from "@/lib/hub/hub-node-store";
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
 * Auto-provisions the 6 standard Cameroon MINESEC sequences for a school if they do not exist yet.
 */
export async function ensureStandardSequences(schoolId: string): Promise<EvaluationSequence[]> {
  if (!schoolId) return [];

  try {
    const admin = createAdminClient();

    // Check again to avoid duplicate creation
    const { data: existing } = await admin
      .from("evaluation_sequences")
      .select("*")
      .eq("school_id", schoolId)
      .order("sequence_number", { ascending: true });

    if (existing && existing.length > 0) {
      return existing as EvaluationSequence[];
    }

    // Look up school terms
    let { data: terms } = await admin
      .from("terms")
      .select("*")
      .eq("school_id", schoolId)
      .order("term_number", { ascending: true });

    if (!terms || terms.length === 0) {
      // Find or create current academic year
      let { data: year } = await admin
        .from("academic_years")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_current", true)
        .maybeSingle();

      if (!year) {
        const { data: anyYear } = await admin
          .from("academic_years")
          .select("*")
          .eq("school_id", schoolId)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        year = anyYear;
      }

      if (!year) {
        const { data: newYear } = await admin
          .from("academic_years")
          .insert({
            school_id: schoolId,
            name: "2026/2027",
            start_date: "2026-09-01",
            end_date: "2027-06-30",
            is_current: true,
          })
          .select()
          .single();
        year = newYear;
      }

      if (year) {
        const termsToInsert = [
          {
            school_id: schoolId,
            academic_year_id: year.id,
            term_number: 1,
            name: "First Term",
            start_date: "2026-09-01",
            end_date: "2026-12-18",
            is_active: true,
          },
          {
            school_id: schoolId,
            academic_year_id: year.id,
            term_number: 2,
            name: "Second Term",
            start_date: "2027-01-05",
            end_date: "2027-03-26",
            is_active: false,
          },
          {
            school_id: schoolId,
            academic_year_id: year.id,
            term_number: 3,
            name: "Third Term",
            start_date: "2027-04-12",
            end_date: "2027-06-30",
            is_active: false,
          },
        ];
        const { data: createdTerms } = await admin
          .from("terms")
          .insert(termsToInsert)
          .select();
        terms = createdTerms || [];
      }
    }

    const term1 = terms?.find((t) => t.term_number === 1) || terms?.[0];
    const term2 = terms?.find((t) => t.term_number === 2) || terms?.[1] || term1;
    const term3 = terms?.find((t) => t.term_number === 3) || terms?.[2] || term2;

    const sequencesToInsert = [
      {
        school_id: schoolId,
        term_id: term1?.id,
        sequence_number: 1,
        name: "Sequence 1",
        start_date: "2026-09-01",
        end_date: "2026-10-24",
        is_open_for_marks: true,
        is_active: true,
      },
      {
        school_id: schoolId,
        term_id: term1?.id,
        sequence_number: 2,
        name: "Sequence 2",
        start_date: "2026-10-27",
        end_date: "2026-12-18",
        is_open_for_marks: false,
        is_active: false,
      },
      {
        school_id: schoolId,
        term_id: term2?.id,
        sequence_number: 3,
        name: "Sequence 3",
        start_date: "2027-01-05",
        end_date: "2027-02-13",
        is_open_for_marks: false,
        is_active: false,
      },
      {
        school_id: schoolId,
        term_id: term2?.id,
        sequence_number: 4,
        name: "Sequence 4",
        start_date: "2027-02-16",
        end_date: "2027-03-26",
        is_open_for_marks: false,
        is_active: false,
      },
      {
        school_id: schoolId,
        term_id: term3?.id,
        sequence_number: 5,
        name: "Sequence 5",
        start_date: "2027-04-12",
        end_date: "2027-05-20",
        is_open_for_marks: false,
        is_active: false,
      },
      {
        school_id: schoolId,
        term_id: term3?.id,
        sequence_number: 6,
        name: "Sequence 6",
        start_date: "2027-05-21",
        end_date: "2027-06-30",
        is_open_for_marks: false,
        is_active: false,
      },
    ];

    const { data: createdSeqs } = await admin
      .from("evaluation_sequences")
      .insert(sequencesToInsert)
      .select()
      .order("sequence_number", { ascending: true });

    return (createdSeqs as EvaluationSequence[]) || [];
  } catch (error) {
    console.error("Failed to ensure standard sequences:", error);
    return [];
  }
}

/**
 * Retrieves the currently active academic year for a school.
 * Cached per request.
 */
export const getActiveAcademicYear = cache(async function getActiveAcademicYear(
  schoolId: string
): Promise<AcademicYear | null> {
  if (!schoolId) return null;

  // On-premise School Hub: query local PostgreSQL cluster directly (<1ms)
  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      const res = await queryLocalDb<AcademicYear>(
        `SELECT * FROM public.academic_years 
         WHERE school_id = $1 
         ORDER BY is_current DESC, start_date DESC 
         LIMIT 1;`,
        [schoolId]
      );
      if (res.rows.length > 0) {
        return res.rows[0];
      }
    } catch {}
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("academic_years")
      .select("*")
      .eq("school_id", schoolId)
      .eq("is_current", true)
      .maybeSingle();

    if (data) return data as AcademicYear;

    // Fallback: If no year is explicitly marked is_current, select the latest by start_date
    const { data: latest } = await supabase
      .from("academic_years")
      .select("*")
      .eq("school_id", schoolId)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest) return latest as AcademicYear;
  } catch (err) {
    console.warn("[AcademicService] Cloud academic year query notice:", err);
  }

  // Edge / Local Hub fallback if not already checked
  try {
    const { queryLocalDb } = await import("@/lib/db/local-postgres");
    const res = await queryLocalDb<AcademicYear>(
      `SELECT * FROM academic_years 
       WHERE school_id = $1 
       ORDER BY is_current DESC, start_date DESC 
       LIMIT 1;`,
      [schoolId]
    );
    if (res.rows.length > 0) {
      return res.rows[0];
    }
  } catch {}

  return null;
});

/**
 * Lists all academic years for a school, sorted chronologically descending.
 */
export const getSchoolAcademicYears = cache(async function getSchoolAcademicYears(
  schoolId: string
): Promise<AcademicYear[]> {
  if (!schoolId) return [];

  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      const res = await queryLocalDb(
        "SELECT * FROM public.academic_years WHERE school_id = $1 ORDER BY start_date DESC",
        [schoolId]
      );
      if (res.rows.length > 0) return res.rows as AcademicYear[];
    } catch {}
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_years")
    .select("*")
    .eq("school_id", schoolId)
    .order("start_date", { ascending: false });

  return (data as AcademicYear[]) || [];
});

/**
 * Retrieves the 6 evaluation sequences for an academic year.
 * Cached per request. Auto-provisions if missing.
 */
export const getSchoolSequences = cache(async function getSchoolSequences(
  schoolId: string
): Promise<EvaluationSequence[]> {
  if (!schoolId) return [];

  // On-premise School Hub: query local PostgreSQL cluster directly (<1ms)
  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      const res = await queryLocalDb(
        "SELECT * FROM public.evaluation_sequences WHERE school_id = $1 ORDER BY sequence_number ASC",
        [schoolId]
      );
      if (res.rows.length > 0) {
        return res.rows as EvaluationSequence[];
      }
    } catch {}
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("evaluation_sequences")
      .select("*")
      .eq("school_id", schoolId)
      .order("sequence_number", { ascending: true });

    if (data && data.length > 0) {
      return data as EvaluationSequence[];
    }
  } catch {}

  // Local Hub fallback
  try {
    const { queryLocalDb } = await import("@/lib/db/local-postgres");
    const res = await queryLocalDb(
      "SELECT * FROM public.evaluation_sequences WHERE school_id = $1 ORDER BY sequence_number ASC",
      [schoolId]
    );
    if (res.rows.length > 0) {
      return res.rows as EvaluationSequence[];
    }
  } catch {}

  // Auto-provision standard sequences if not found
  return await ensureStandardSequences(schoolId);
});

/**
 * Lists all departments in a school, with their assigned subjects and active HOD.
 */
export async function getSchoolDepartments(schoolId: string): Promise<Department[]> {
  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      const res = await queryLocalDb(
        `SELECT d.*, 
          COALESCE(
            json_agg(
              json_build_object(
                'id', s.id,
                'name', s.name,
                'code', s.code,
                'department_id', s.department_id
              )
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'
          ) as subjects,
          '[]'::json as hod_assignments
         FROM public.departments d
         LEFT JOIN public.subjects s ON s.department_id = d.id
         WHERE d.school_id = $1
         GROUP BY d.id
         ORDER BY d.name ASC`,
        [schoolId]
      );
      if (res.rows.length > 0) return res.rows as Department[];
    } catch {}
  }

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
  // On-premise School Hub: query local PostgreSQL cluster directly (<1ms)
  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      const res = await queryLocalDb(
        `SELECT s.*, json_build_object('id', d.id, 'name', d.name) as department
         FROM public.subjects s
         LEFT JOIN public.departments d ON d.id = s.department_id
         WHERE s.school_id = $1
         ORDER BY s.name ASC`,
        [schoolId]
      );
      if (res.rows.length > 0) return res.rows as Subject[];
    } catch {}
  }

  try {
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

    if (data && data.length > 0) return data as Subject[];
  } catch {}

  // Local Hub fallback
  try {
    const { queryLocalDb } = await import("@/lib/db/local-postgres");
    const res = await queryLocalDb(
      `SELECT s.*, json_build_object('id', d.id, 'name', d.name) as department
       FROM public.subjects s
       LEFT JOIN public.departments d ON d.id = s.department_id
       WHERE s.school_id = $1
       ORDER BY s.name ASC`,
      [schoolId]
    );
    return res.rows as Subject[];
  } catch {}

  return [];
}

/**
 * Lists all classes and their streams for the active year.
 */
export async function getSchoolClasses(
  schoolId: string,
  academicYearId?: string,
  classMasterUserId?: string
): Promise<(SchoolClass & { streams: ClassStream[] })[]> {
  // On-premise School Hub: query local PostgreSQL cluster directly (<1ms)
  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      const classRes = await queryLocalDb(
        "SELECT * FROM public.classes WHERE school_id = $1 ORDER BY level_order ASC",
        [schoolId]
      );

      let streamQuery =
        "SELECT cs.*, json_build_object('id', u.id, 'full_name', u.full_name) as class_master FROM public.class_streams cs LEFT JOIN public.user_profiles u ON u.id = cs.class_master_id WHERE cs.school_id = $1";
      const streamParams: any[] = [schoolId];

      if (academicYearId) {
        streamParams.push(academicYearId);
        streamQuery += ` AND cs.academic_year_id = $${streamParams.length}`;
      }
      if (classMasterUserId) {
        streamParams.push(classMasterUserId);
        streamQuery += ` AND cs.class_master_id = $${streamParams.length}`;
      }

      const streamRes = await queryLocalDb(streamQuery, streamParams);
      if (classRes.rows.length > 0) {
        return classRes.rows.map((c: any) => ({
          ...c,
          streams: streamRes.rows.filter((s: any) => s.class_id === c.id) as ClassStream[],
        }));
      }
    } catch {}
  }

  try {
    const supabase = await createClient();

    const { data: classes } = await supabase
      .from("classes")
      .select("*")
      .eq("school_id", schoolId)
      .order("level_order", { ascending: true });

    if (classes && classes.length > 0) {
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
  } catch (err) {
    console.warn("[AcademicService] Cloud getSchoolClasses notice:", err);
  }

  // Edge / Local Hub fallback: query local PostgreSQL cluster directly
  try {
    const { queryLocalDb } = await import("@/lib/db/local-postgres");
    const classRes = await queryLocalDb(
      "SELECT * FROM public.classes WHERE school_id = $1 ORDER BY level_order ASC",
      [schoolId]
    );

    let streamQuery =
      "SELECT cs.*, json_build_object('id', u.id, 'full_name', u.full_name) as class_master FROM public.class_streams cs LEFT JOIN public.user_profiles u ON u.id = cs.class_master_id WHERE cs.school_id = $1";
    const streamParams: any[] = [schoolId];

    if (academicYearId) {
      streamParams.push(academicYearId);
      streamQuery += ` AND cs.academic_year_id = $${streamParams.length}`;
    }
    if (classMasterUserId) {
      streamParams.push(classMasterUserId);
      streamQuery += ` AND cs.class_master_id = $${streamParams.length}`;
    }

    const streamRes = await queryLocalDb(streamQuery, streamParams);
    return classRes.rows.map((c: any) => ({
      ...c,
      streams: streamRes.rows.filter((s: any) => s.class_id === c.id) as ClassStream[],
    }));
  } catch (localErr) {
    console.warn("[AcademicService] Local getSchoolClasses error:", localErr);
  }

  return [];
}

/**
 * Lists all subjects offered in a specific class stream, including customized coefficients and max marks.
 */
export async function getStreamSubjects(classStreamId: string): Promise<ClassSubject[]> {
  // On-premise School Hub: query local PostgreSQL cluster directly (<1ms)
  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      const res = await queryLocalDb(
        `SELECT cs.*, json_build_object('id', s.id, 'name', s.name, 'code', s.code) as subject
         FROM public.class_subjects cs
         LEFT JOIN public.subjects s ON s.id = cs.subject_id
         WHERE cs.class_stream_id = $1`,
        [classStreamId]
      );
      if (res.rows.length > 0) return res.rows as ClassSubject[];
    } catch {}
  }

  try {
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

    if (data && data.length > 0) return data as ClassSubject[];
  } catch {}

  // Local Hub fallback
  try {
    const { queryLocalDb } = await import("@/lib/db/local-postgres");
    const res = await queryLocalDb(
      `SELECT cs.*, json_build_object('id', s.id, 'name', s.name, 'code', s.code) as subject
       FROM public.class_subjects cs
       LEFT JOIN public.subjects s ON s.id = cs.subject_id
       WHERE cs.class_stream_id = $1`,
      [classStreamId]
    );
    return res.rows as ClassSubject[];
  } catch {}

  return [];
}

/**
 * Lists all class-subject configurations for a school.
 */
export async function getSchoolClassSubjects(schoolId: string): Promise<ClassSubject[]> {
  // On-premise School Hub: query local PostgreSQL cluster directly (<1ms)
  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      const res = await queryLocalDb(
        `SELECT cs.*, json_build_object('id', s.id, 'name', s.name, 'code', s.code) as subject
         FROM public.class_subjects cs
         LEFT JOIN public.subjects s ON s.id = cs.subject_id
         WHERE cs.school_id = $1`,
        [schoolId]
      );
      if (res.rows.length > 0) return res.rows as ClassSubject[];
    } catch {}
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("class_subjects")
      .select("id, school_id, class_stream_id, subject_id, coefficient, max_marks, is_compulsory")
      .eq("school_id", schoolId);

    if (data && data.length > 0) return data as ClassSubject[];
  } catch {}

  // Local Hub fallback
  try {
    const { queryLocalDb } = await import("@/lib/db/local-postgres");
    const res = await queryLocalDb(
      `SELECT cs.*, json_build_object('id', s.id, 'name', s.name, 'code', s.code) as subject
       FROM public.class_subjects cs
       LEFT JOIN public.subjects s ON s.id = cs.subject_id
       WHERE cs.school_id = $1`,
      [schoolId]
    );
    return res.rows as ClassSubject[];
  } catch {}

  return [];
}

export async function getClassStreamsForSubjects(
  schoolId: string,
  classStreamIds: string[],
  subjectIds: string[]
): Promise<string[]> {
  if (!schoolId || classStreamIds.length === 0 || subjectIds.length === 0) return [];

  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      const res = await queryLocalDb(
        `SELECT DISTINCT class_stream_id 
         FROM public.class_subjects 
         WHERE school_id = $1 
           AND class_stream_id = ANY($2::uuid[]) 
           AND subject_id = ANY($3::uuid[])`,
        [schoolId, classStreamIds, subjectIds]
      );
      if (res.rows.length > 0) return res.rows.map((r: any) => r.class_stream_id);
    } catch {}
  }

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

  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      if (roleCode === "teacher") {
        const res = await queryLocalDb(
          `SELECT DISTINCT class_stream_id 
           FROM public.teacher_assignments 
           WHERE school_id = $1 AND academic_year_id = $2 AND teacher_user_id = $3`,
          [schoolId, academicYearId, userId]
        );
        return res.rows.map((r: any) => r.class_stream_id);
      }
      if (roleCode === "class_master") {
        const res = await queryLocalDb(
          `SELECT id FROM public.class_streams 
           WHERE school_id = $1 AND academic_year_id = $2 AND class_master_id = $3`,
          [schoolId, academicYearId, userId]
        );
        return res.rows.map((r: any) => r.id);
      }
    } catch {}
  }

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
 * Resolves the department IDs, subject IDs, and department names that an HOD is assigned to.
 */
export async function getHodScope(
  schoolId: string,
  academicYearId?: string,
  hodUserId?: string
): Promise<{ departmentIds: string[]; subjectIds: string[]; departmentNames: string[] }> {
  if (!schoolId || !hodUserId) {
    return { departmentIds: [], subjectIds: [], departmentNames: [] };
  }

  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      let sql = `
        SELECT ha.department_id, ha.subject_id, d.name as department_name
        FROM public.hod_assignments ha
        LEFT JOIN public.departments d ON d.id = ha.department_id
        WHERE ha.school_id = $1 AND ha.hod_user_id = $2 AND ha.status = 'active'
      `;
      const params: any[] = [schoolId, hodUserId];
      if (academicYearId) {
        params.push(academicYearId);
        sql += ` AND ha.academic_year_id = $3`;
      }
      const res = await queryLocalDb(sql, params);
      const deptIds = [...new Set(res.rows.map((r: any) => r.department_id).filter(Boolean))];
      const subIds = [...new Set(res.rows.map((r: any) => r.subject_id).filter(Boolean))];
      const deptNames = [...new Set(res.rows.map((r: any) => r.department_name).filter(Boolean))];
      return { departmentIds: deptIds, subjectIds: subIds, departmentNames: deptNames };
    } catch {}
    return { departmentIds: [], subjectIds: [], departmentNames: [] };
  }

  const supabase = await createClient();

  let query = supabase
    .from("hod_assignments")
    .select("department_id, subject_id, department:departments (id, name)")
    .eq("school_id", schoolId)
    .eq("hod_user_id", hodUserId)
    .eq("status", "active");

  if (academicYearId) {
    query = query.eq("academic_year_id", academicYearId);
  }

  let { data: hodAssignments } = await query;

  // Fallback: if no active HOD assignment tied to this specific year, check any active assignment in school
  if ((!hodAssignments || hodAssignments.length === 0) && academicYearId) {
    const fallback = await supabase
      .from("hod_assignments")
      .select("department_id, subject_id, department:departments (id, name)")
      .eq("school_id", schoolId)
      .eq("hod_user_id", hodUserId)
      .eq("status", "active");
    hodAssignments = fallback.data;
  }

  if (!hodAssignments?.length) {
    return { departmentIds: [], subjectIds: [], departmentNames: [] };
  }

  const explicitSubjectIds = hodAssignments
    .map((assignment) => assignment.subject_id)
    .filter((subjectId): subjectId is string => Boolean(subjectId));

  const departmentIds = [
    ...new Set(hodAssignments.map((assignment) => assignment.department_id).filter(Boolean)),
  ];

  const departmentNames = [
    ...new Set(
      hodAssignments
        .map((a) => (a.department as any)?.name)
        .filter((name): name is string => Boolean(name))
    ),
  ];

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

  if (subjectQueries.length === 0) {
    return { departmentIds, subjectIds: [], departmentNames };
  }

  const subjectResults = await Promise.all(subjectQueries);
  const subjectIds = [
    ...new Set(subjectResults.flatMap((result) => result.data?.map((subject) => subject.id) || [])),
  ];

  return { departmentIds, subjectIds, departmentNames };
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
  // On-premise School Hub: query local PostgreSQL cluster directly (<1ms)
  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      let sql = `
        SELECT ta.*,
          json_build_object('id', u.id, 'full_name', u.full_name) as teacher,
          json_build_object('id', cs.id, 'name', cs.name, 'class_id', cs.class_id) as class_stream,
          json_build_object('id', s.id, 'name', s.name, 'code', s.code) as subject
        FROM public.teacher_assignments ta
        LEFT JOIN public.user_profiles u ON u.id = ta.teacher_user_id
        LEFT JOIN public.class_streams cs ON cs.id = ta.class_stream_id
        LEFT JOIN public.subjects s ON s.id = ta.subject_id
        WHERE ta.school_id = $1 AND ta.academic_year_id = $2
      `;
      const params: any[] = [schoolId, academicYearId];
      if (teacherUserId) {
        params.push(teacherUserId);
        sql += ` AND ta.teacher_user_id = $3`;
      }
      const res = await queryLocalDb(sql, params);
      return res.rows as TeacherAssignment[];
    } catch {}
  }

  try {
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
    if (data && data.length > 0) return data as TeacherAssignment[];
  } catch {}

  // Local Hub fallback
  try {
    const { queryLocalDb } = await import("@/lib/db/local-postgres");
    let sql = `
      SELECT ta.*,
        json_build_object('id', u.id, 'full_name', u.full_name) as teacher,
        json_build_object('id', cs.id, 'name', cs.name, 'class_id', cs.class_id) as class_stream,
        json_build_object('id', s.id, 'name', s.name, 'code', s.code) as subject
      FROM public.teacher_assignments ta
      LEFT JOIN public.user_profiles u ON u.id = ta.teacher_user_id
      LEFT JOIN public.class_streams cs ON cs.id = ta.class_stream_id
      LEFT JOIN public.subjects s ON s.id = ta.subject_id
      WHERE ta.school_id = $1 AND ta.academic_year_id = $2
    `;
    const params: any[] = [schoolId, academicYearId];
    if (teacherUserId) {
      params.push(teacherUserId);
      sql += ` AND ta.teacher_user_id = $3`;
    }
    const res = await queryLocalDb(sql, params);
    return res.rows as TeacherAssignment[];
  } catch {}

  return [];
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

  // On-premise School Hub: query local PostgreSQL cluster directly (<1ms)
  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      let sql = `
        SELECT e.*,
          json_build_object('id', st.id, 'first_name', st.first_name, 'last_name', st.last_name, 'matricule', st.matricule, 'gender', st.gender, 'date_of_birth', st.date_of_birth, 'status', st.status) as student,
          json_build_object('id', cs.id, 'name', cs.name, 'class_id', cs.class_id) as class_stream
        FROM public.enrolments e
        JOIN public.students st ON st.id = e.student_id
        JOIN public.class_streams cs ON cs.id = e.class_stream_id
        WHERE e.school_id = $1 AND e.academic_year_id = $2
      `;
      const params: any[] = [schoolId, academicYearId];

      if (status && status !== "all") {
        params.push(status);
        sql += ` AND e.status = $${params.length}`;
      }
      if (classStreamId) {
        params.push(classStreamId);
        sql += ` AND e.class_stream_id = $${params.length}`;
      }
      if (classStreamIds && classStreamIds.length > 0) {
        params.push(classStreamIds);
        sql += ` AND e.class_stream_id = ANY($${params.length}::uuid[])`;
      }

      sql += ` ORDER BY st.last_name ASC, st.first_name ASC`;
      if (limit) {
        params.push(limit);
        sql += ` LIMIT $${params.length}`;
      }

      const res = await queryLocalDb(sql, params);
      if (res.rows.length > 0) return res.rows as Enrolment[];
    } catch {}
  }

  try {
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
    if (data && data.length > 0) return data as Enrolment[];
  } catch {}

  // Local Hub fallback
  try {
    const { queryLocalDb } = await import("@/lib/db/local-postgres");
    let sql = `
      SELECT e.*,
        json_build_object('id', st.id, 'first_name', st.first_name, 'last_name', st.last_name, 'matricule', st.matricule, 'gender', st.gender, 'date_of_birth', st.date_of_birth, 'status', st.status) as student,
        json_build_object('id', cs.id, 'name', cs.name, 'class_id', cs.class_id) as class_stream
      FROM public.enrolments e
      JOIN public.students st ON st.id = e.student_id
      JOIN public.class_streams cs ON cs.id = e.class_stream_id
      WHERE e.school_id = $1 AND e.academic_year_id = $2
    `;
    const params: any[] = [schoolId, academicYearId];

    if (status && status !== "all") {
      params.push(status);
      sql += ` AND e.status = $${params.length}`;
    }
    if (classStreamId) {
      params.push(classStreamId);
      sql += ` AND e.class_stream_id = $${params.length}`;
    }
    if (classStreamIds && classStreamIds.length > 0) {
      params.push(classStreamIds);
      sql += ` AND e.class_stream_id = ANY($${params.length}::uuid[])`;
    }
    if (limit) {
      params.push(limit);
      sql += ` LIMIT $${params.length}`;
    }

    const res = await queryLocalDb(sql, params);
    return res.rows as Enrolment[];
  } catch {}

  return [];
}

/**
 * Automatically generates the next unique student matricule for a school.
 * Formatted according to the school's configured matricule_format pattern (default: {CODE}-{YEAR}-{SEQ:4}).
 */
export async function generateNextStudentMatricule(
  schoolId: string,
  academicYearId?: string
): Promise<string> {
  const supabase = await createClient();

  // 1. Fetch School Settings & Code
  const { data: school } = await supabase
    .from("schools")
    .select("name, code, matricule_format")
    .eq("id", schoolId)
    .maybeSingle();

  // 2. Fetch Academic Year (current or requested)
  let yearName = "";
  if (academicYearId) {
    const { data: year } = await supabase
      .from("academic_years")
      .select("name")
      .eq("id", academicYearId)
      .maybeSingle();
    yearName = year?.name || "";
  } else {
    const activeYear = await getActiveAcademicYear(schoolId);
    yearName = activeYear?.name || "";
  }

  // Determine {CODE}
  let code = (school?.code || "").trim().toUpperCase();
  if (!code && school?.name) {
    const words = school.name.trim().split(/\s+/).filter(Boolean);
    code = words.map((w: string) => w[0]?.toUpperCase()).join("").slice(0, 5) || "SCH";
  }
  if (!code) code = "SCH";

  // Determine {YEAR}
  const yearMatch = yearName.match(/\d{4}/);
  const fullYear = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();
  const shortYear = fullYear.slice(-2);

  // 3. Inspect recent students to detect existing numbering pattern (e.g. FFOCAST001 -> FFOCAST002)
  const { data: recentStudents } = await supabase
    .from("students")
    .select("matricule")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(100);

  let detectedPrefix: string | null = null;
  let detectedPadLength = 3;
  let maxFoundSeq = 0;

  if (recentStudents && recentStudents.length > 0) {
    for (const st of recentStudents) {
      const mat = (st.matricule || "").trim().toUpperCase();
      // Match patterns like "FFOCAST001", "BHS-2026-0042", "ST-015"
      const match = mat.match(/^(.*?)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const numStr = match[2];
        const numVal = parseInt(numStr, 10);

        if (!isNaN(numVal)) {
          if (!detectedPrefix) {
            detectedPrefix = prefix;
            detectedPadLength = Math.max(numStr.length, 3);
          }
          if (prefix === detectedPrefix && numVal > maxFoundSeq) {
            maxFoundSeq = numVal;
          }
        }
      }
    }
  }

  // 4. Determine format and initial candidate
  const customFormat = (school?.matricule_format || "").trim();
  let candidate = "";
  let nextIndex = 1;

  if (detectedPrefix && maxFoundSeq > 0 && !customFormat) {
    // School already has an active convention (e.g. FFOCAST001)
    nextIndex = maxFoundSeq + 1;
    candidate = `${detectedPrefix}${String(nextIndex).padStart(detectedPadLength, "0")}`;
  } else {
    // Use custom format or default
    const format = customFormat || "{CODE}-{YEAR}-{SEQ:4}";

    const { count } = await supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId);

    nextIndex = Math.max((count || 0) + 1, maxFoundSeq + 1);

    const buildMatricule = (idx: number) => {
      return format
        .replace(/{CODE}/gi, code)
        .replace(/{YEAR:4}/gi, fullYear)
        .replace(/{YEAR}/gi, shortYear)
        .replace(/{SEQ:(\d+)}/gi, (_: string, pad: string) => String(idx).padStart(Number(pad) || 3, "0"))
        .replace(/{SEQ}/gi, String(idx).padStart(3, "0"));
    };

    candidate = buildMatricule(nextIndex);
  }

  // 5. Collision safety check: ensure candidate is strictly unique
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 100) {
    const { data: existing } = await supabase
      .from("students")
      .select("id")
      .eq("school_id", schoolId)
      .eq("matricule", candidate)
      .maybeSingle();

    if (!existing) {
      exists = false;
    } else {
      nextIndex++;
      if (detectedPrefix && !customFormat) {
        candidate = `${detectedPrefix}${String(nextIndex).padStart(detectedPadLength, "0")}`;
      } else {
        const format = customFormat || "{CODE}-{YEAR}-{SEQ:4}";
        candidate = format
          .replace(/{CODE}/gi, code)
          .replace(/{YEAR:4}/gi, fullYear)
          .replace(/{YEAR}/gi, shortYear)
          .replace(/{SEQ:(\d+)}/gi, (_: string, pad: string) => String(nextIndex).padStart(Number(pad) || 3, "0"))
          .replace(/{SEQ}/gi, String(nextIndex).padStart(3, "0"));
      }
      attempts++;
    }
  }

  return candidate;
}
