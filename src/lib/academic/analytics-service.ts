import { createClient } from "@/lib/supabase/server";
import type { School } from "@/types/database";

export interface StudentRankItem {
  studentId: string;
  matricule: string;
  name: string;
  gender: string;
  className: string;
  streamName: string;
  fullClassName: string;
  average: number;
  totalMarksCount: number;
  appreciation: string;
  rank: number;
  cycle?: "Cycle 1" | "Cycle 2";
}

export interface ClassPerformanceItem {
  classStreamId: string;
  className: string;
  streamName: string;
  fullClassName: string;
  cycle?: "Cycle 1" | "Cycle 2";
  totalStudents: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  failRate: number;
  classAverage: number;
  highestAverage: number;
  lowestAverage: number;
  top3: StudentRankItem[];
}

export interface SubjectLaureateItem {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  departmentName?: string;
  bestMark: number;
  studentName: string;
  studentMatricule: string;
  className: string;
  cycle?: "Cycle 1" | "Cycle 2";
  totalEvaluated: number;
  passedCount: number;
  passRate: number;
  averageScore: number;
  teachers?: string[];
  topTeacher?: string;
}

export interface AcademicAnalyticsData {
  schoolName: string;
  schoolInfo: {
    id: string;
    name: string;
    code?: string | null;
    logoUrl?: string | null;
    motto?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    subsystem?: "anglophone" | "francophone" | "bilingual";
  };
  academicYearName: string;
  selectedSequenceId: string;
  selectedSequenceName: string;
  availableSequences: Array<{
    id: string;
    name: string;
    sequence_number: number;
    is_open: boolean;
  }>;
  overallKpis: {
    totalStudentsEvaluated: number;
    passedCount: number;
    failedCount: number;
    passRate: number;
    failRate: number;
    overallAverage: number;
    highestAverage: number;
    lowestAverage: number;
    honorsCount: number; // >= 14/20
  };
  dux: StudentRankItem | null; // School / Scope Champion
  topStudents: StudentRankItem[]; // Top 3-5 in school or department
  allRankedStudents: StudentRankItem[];
  classPerformance: ClassPerformanceItem[];
  subjectLaureates: SubjectLaureateItem[];
  scope: {
    role: "admin" | "teacher" | "hod";
    title: string;
    departmentName?: string;
    assignedClassCount?: number;
  };
}

/**
 * Computes Cameroon CBA performance appreciation based on standard 20-point scale.
 */
export function getCameroonAppreciation(average: number, subsystem?: string): string {
  if (subsystem === "francophone") {
    if (average >= 16) return "Tableau d'Honneur avec Félicitations";
    if (average >= 14) return "Tableau d'Honneur avec Encouragements";
    if (average >= 12) return "Tableau d'Honneur";
    if (average >= 10) return "Passable";
    if (average >= 8.5) return "Insuffisant";
    return "Médiocre";
  }

  // Anglophone / English Cameroon Secondary Subsystem (GBHS, Colleges, Institutes)
  if (average >= 16) return "Highest Distinction";
  if (average >= 14) return "Distinction";
  if (average >= 12) return "Honours (Roll of Honour)";
  if (average >= 10) return "Satisfactory (Pass)";
  if (average >= 8.5) return "Needs Improvement";
  return "Critical Attention";
}

/**
 * Fetches and calculates institution-wide, teacher-scoped, or HOD-scoped
 * academic analytics and honor rolls for a given sequence.
 */
export async function getAcademicAnalytics(params: {
  schoolId: string;
  academicYearId?: string;
  sequenceId?: string;
  role: "admin" | "teacher" | "hod";
  userId?: string;
  departmentId?: string;
}): Promise<AcademicAnalyticsData | null> {
  const supabase = await createClient();
  const { schoolId, role, userId, departmentId } = params;

  if (!schoolId) return null;

  // 1. Fetch School & Academic Year
  const { data: school } = await supabase
    .from("schools")
    .select("id, name, code, logo_url, motto, address, phone, email, subsystem, ranking_mode")
    .eq("id", schoolId)
    .single();

  let academicYearId = params.academicYearId;
  let academicYearName = "Academic Year";
  if (!academicYearId) {
    const { data: activeYear } = await supabase
      .from("academic_years")
      .select("id, name")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .maybeSingle();
    academicYearId = activeYear?.id;
    if (activeYear?.name) academicYearName = activeYear.name;
  } else {
    const { data: specifiedYear } = await supabase
      .from("academic_years")
      .select("id, name")
      .eq("id", academicYearId)
      .maybeSingle();
    if (specifiedYear?.name) academicYearName = specifiedYear.name;
  }

  // 2. Fetch all evaluation sequences for selector
  const { data: rawSeqs } = await supabase
    .from("evaluation_sequences")
    .select("id, name, sequence_number, is_open_for_marks, created_at")
    .eq("school_id", schoolId)
    .order("sequence_number", { ascending: true });

  const rawSequences = rawSeqs || [];
  if (rawSequences.length === 0) return null;

  const availableSequences = rawSequences.map((s) => ({
    id: s.id,
    name: s.name,
    sequence_number: s.sequence_number,
    is_open: s.is_open_for_marks,
  }));

  // Determine active sequence
  const targetSequenceId: string =
    params.sequenceId ||
    rawSequences.find((s) => s.is_open_for_marks)?.id ||
    rawSequences[0]?.id ||
    "";

  const selectedSeqObj = rawSequences.find((s) => s.id === targetSequenceId) || rawSequences[0];
  const selectedSequenceName = selectedSeqObj?.name || "Sequence 1";

  // 3. Resolve Role Scope (Assigned Streams & Subjects)
  let scopedStreamIds: string[] | null = null;
  let scopedSubjectIds: string[] | null = null;
  let departmentName: string | undefined = undefined;

  if (role === "teacher" && userId) {
    const { data: rawAssignments } = await supabase
      .from("teacher_assignments")
      .select("class_stream_id, subject_id")
      .eq("school_id", schoolId)
      .eq("teacher_user_id", userId);

    const assignments = rawAssignments || [];
    if (assignments.length > 0) {
      scopedStreamIds = Array.from(new Set(assignments.map((a) => a.class_stream_id)));
      scopedSubjectIds = Array.from(new Set(assignments.map((a) => a.subject_id)));
    } else {
      scopedStreamIds = [];
      scopedSubjectIds = [];
    }
  } else if (role === "hod") {
    // If HOD, find department subjects
    let targetDeptId = departmentId;
    if (!targetDeptId && userId) {
      const { data: hodAssign } = await supabase
        .from("hod_assignments")
        .select("department_id, department:departments(name)")
        .eq("school_id", schoolId)
        .eq("hod_user_id", userId)
        .maybeSingle();

      if (hodAssign) {
        targetDeptId = hodAssign.department_id;
        departmentName = (hodAssign.department as any)?.name;
      }
    }

    if (targetDeptId) {
      const { data: rawDeptSubjects } = await supabase
        .from("subjects")
        .select("id, name")
        .eq("school_id", schoolId)
        .eq("department_id", targetDeptId);

      const deptSubjects = rawDeptSubjects || [];
      scopedSubjectIds = deptSubjects.map((s) => s.id);
    }
  }

  // 4. Fetch Classes, Streams & Enrolments
  const { data: rawClasses } = await supabase
    .from("classes")
    .select(`
      id,
      name,
      level_order,
      class_streams (
        id,
        name
      )
    `)
    .eq("school_id", schoolId)
    .order("level_order", { ascending: true });

  const classes = rawClasses || [];

  // Flatten streams map with cycle designation
  const streamMetaMap = new Map<
    string,
    { className: string; streamName: string; fullName: string; cycle: "Cycle 1" | "Cycle 2" }
  >();
  classes.forEach((c) => {
    const cycle: "Cycle 1" | "Cycle 2" = (c.level_order && c.level_order > 5) ? "Cycle 2" : "Cycle 1";
    (c.class_streams || []).forEach((st: any) => {
      const streamClean = (st.name || "").trim();
      const classClean = (c.name || "").trim();
      // If stream already contains class name (e.g. "Form 1 A" vs "Form 1"), don't duplicate
      const fullStreamName = streamClean.toLowerCase().startsWith(classClean.toLowerCase())
        ? streamClean
        : `${classClean} ${streamClean}`.trim();

      streamMetaMap.set(st.id, {
        className: classClean,
        streamName: streamClean,
        fullName: fullStreamName,
        cycle,
      });
    });
  });

  // 5. Fetch Class Subjects (Coefficients)
  const { data: rawClassSubjects } = await supabase
    .from("class_subjects")
    .select("class_stream_id, subject_id, coefficient, subject:subjects(id, name, code, department_id, department:departments(name))")
    .eq("school_id", schoolId);

  const classSubjects = rawClassSubjects || [];

  // Map: `${streamId}_${subjectId}` -> { coefficient, subjectMeta }
  const coefMap = new Map<string, { coefficient: number; subject: any }>();
  classSubjects.forEach((cs) => {
    const key = `${cs.class_stream_id}_${cs.subject_id}`;
    coefMap.set(key, {
      coefficient: Number(cs.coefficient) || 1,
      subject: cs.subject,
    });
  });

  // 5b. Fetch Teacher Assignments for Subject Teacher Mapping
  let teacherAssignQuery = supabase
    .from("teacher_assignments")
    .select("class_stream_id, subject_id, teacher:user_profiles(id, full_name)")
    .eq("school_id", schoolId);

  if (academicYearId) {
    teacherAssignQuery = teacherAssignQuery.eq("academic_year_id", academicYearId);
  }

  const { data: rawTeacherAssignments } = await teacherAssignQuery;
  const subjectTeachersMap = new Map<string, Set<string>>();
  const streamSubjectTeacherMap = new Map<string, string>();

  (rawTeacherAssignments || []).forEach((ta: any) => {
    const teacherName = ta.teacher?.full_name?.trim();
    if (teacherName && ta.subject_id) {
      if (!subjectTeachersMap.has(ta.subject_id)) {
        subjectTeachersMap.set(ta.subject_id, new Set<string>());
      }
      subjectTeachersMap.get(ta.subject_id)!.add(teacherName);

      if (ta.class_stream_id) {
        streamSubjectTeacherMap.set(`${ta.class_stream_id}_${ta.subject_id}`, teacherName);
      }
    }
  });

  // 6. Fetch Assessment Marks for Target Sequence
  let marksQuery = supabase
    .from("assessment_marks")
    .select(`
      id,
      student_id,
      class_stream_id,
      subject_id,
      score,
      max_marks,
      normalized_score_20,
      status,
      student:students (
        id,
        matricule,
        first_name,
        last_name,
        gender
      )
    `)
    .eq("school_id", schoolId)
    .eq("sequence_id", targetSequenceId);

  if (scopedStreamIds && scopedStreamIds.length > 0) {
    marksQuery = marksQuery.in("class_stream_id", scopedStreamIds);
  } else if (scopedStreamIds && scopedStreamIds.length === 0) {
    // Teacher has no assigned classes
    return {
      schoolName: school?.name || "School",
      schoolInfo: {
        id: school?.id || schoolId,
        name: school?.name || "School",
        code: school?.code || null,
        logoUrl: school?.logo_url || null,
        motto: school?.motto || null,
        address: school?.address || null,
        phone: school?.phone || null,
        email: school?.email || null,
        subsystem: (school?.subsystem as any) || "bilingual",
      },
      academicYearName,
      selectedSequenceId: targetSequenceId,
      selectedSequenceName,
      availableSequences,
      overallKpis: {
        totalStudentsEvaluated: 0,
        passedCount: 0,
        failedCount: 0,
        passRate: 0,
        failRate: 0,
        overallAverage: 0,
        highestAverage: 0,
        lowestAverage: 0,
        honorsCount: 0,
      },
      dux: null,
      topStudents: [],
      allRankedStudents: [],
      classPerformance: [],
      subjectLaureates: [],
      scope: {
        role,
        title: "No teaching assignments found",
      },
    };
  }

  if (scopedSubjectIds && scopedSubjectIds.length > 0) {
    marksQuery = marksQuery.in("subject_id", scopedSubjectIds);
  }

  const { data: rawMarks } = await marksQuery;
  const marks = rawMarks || [];

  // 7. Calculate Student Averages (Weighted by Coefficient)
  // Map: studentId -> { student, streamId, weightedSum, totalCoef, scores: Array<{subjectId, mark}> }
  interface StudentAgg {
    student: any;
    streamId: string;
    weightedSum: number;
    totalCoef: number;
    marksCount: number;
    passedMarksCount: number;
  }

  const studentAggMap = new Map<string, StudentAgg>();
  // Map: subjectId -> Array<{ mark, student, streamId }>
  const subjectScoresMap = new Map<string, Array<{ mark: number; student: any; streamId: string }>>();

  for (const m of marks) {
    if (!m.student) continue;

    const sId = m.student_id;
    const score20 = m.status === "present" && m.normalized_score_20 !== null ? Number(m.normalized_score_20) : null;

    if (score20 === null) continue; // Ignore absent / exempt

    // Accumulate subject marks for laureates
    if (!subjectScoresMap.has(m.subject_id)) {
      subjectScoresMap.set(m.subject_id, []);
    }
    subjectScoresMap.get(m.subject_id)!.push({
      mark: score20,
      student: m.student,
      streamId: m.class_stream_id,
    });

    // Lookup coefficient
    const key = `${m.class_stream_id}_${m.subject_id}`;
    const coefInfo = coefMap.get(key);
    const coefficient = coefInfo?.coefficient || 1;

    if (!studentAggMap.has(sId)) {
      studentAggMap.set(sId, {
        student: m.student,
        streamId: m.class_stream_id,
        weightedSum: 0,
        totalCoef: 0,
        marksCount: 0,
        passedMarksCount: 0,
      });
    }

    const agg = studentAggMap.get(sId)!;
    agg.weightedSum += score20 * coefficient;
    agg.totalCoef += coefficient;
    agg.marksCount += 1;
    if (score20 >= 10.0) {
      agg.passedMarksCount += 1;
    }
  }

  // Convert to array of StudentRankItem
  const rankedStudents: StudentRankItem[] = [];
  for (const [sId, agg] of studentAggMap.entries()) {
    if (agg.totalCoef === 0 || agg.marksCount === 0) continue;

    const average = parseFloat((agg.weightedSum / agg.totalCoef).toFixed(2));
    const streamInfo = streamMetaMap.get(agg.streamId) || {
      className: "Class",
      streamName: "",
      fullName: "Class",
      cycle: "Cycle 1" as const,
    };

    const fullName = `${agg.student.last_name || ""} ${agg.student.first_name || ""}`.trim();

    rankedStudents.push({
      studentId: sId,
      matricule: agg.student.matricule || "N/A",
      name: fullName,
      gender: agg.student.gender || "M",
      className: streamInfo.className,
      streamName: streamInfo.streamName,
      fullClassName: streamInfo.fullName,
      cycle: streamInfo.cycle,
      average,
      totalMarksCount: agg.marksCount,
      appreciation: getCameroonAppreciation(average, school?.subsystem),
      rank: 0, // Assigned after sorting
    });
  }

  // Sort by average descending
  rankedStudents.sort((a, b) => b.average - a.average);
  rankedStudents.forEach((st, idx) => {
    st.rank = idx + 1;
  });

  // 8. Overall KPIs
  const totalStudentsEvaluated = rankedStudents.length;
  const passedStudents = rankedStudents.filter((s) => s.average >= 10.0);
  const failedStudents = rankedStudents.filter((s) => s.average < 10.0);
  const honorsStudents = rankedStudents.filter((s) => s.average >= 14.0);

  const passedCount = passedStudents.length;
  const failedCount = failedStudents.length;
  const passRate = totalStudentsEvaluated > 0 ? parseFloat(((passedCount / totalStudentsEvaluated) * 100).toFixed(1)) : 0;
  const failRate = totalStudentsEvaluated > 0 ? parseFloat(((failedCount / totalStudentsEvaluated) * 100).toFixed(1)) : 0;

  const totalAveragesSum = rankedStudents.reduce((acc, s) => acc + s.average, 0);
  const overallAverage = totalStudentsEvaluated > 0 ? parseFloat((totalAveragesSum / totalStudentsEvaluated).toFixed(2)) : 0;
  const highestAverage = rankedStudents[0]?.average || 0;
  const lowestAverage = rankedStudents[rankedStudents.length - 1]?.average || 0;

  // 9. School / Scope Dux & Top Students (Top 3 or 5)
  const dux = rankedStudents.length > 0 ? rankedStudents[0] : null;
  const topStudents = rankedStudents.slice(0, 5);

  // 10. Class Performance & Top 3 per Class Stream
  // Group ranked students by class stream
  const classStreamMap = new Map<string, StudentRankItem[]>();
  for (const st of rankedStudents) {
    const rawAgg = studentAggMap.get(st.studentId);
    if (!rawAgg) continue;
    const streamId = rawAgg.streamId;

    if (!classStreamMap.has(streamId)) {
      classStreamMap.set(streamId, []);
    }
    classStreamMap.get(streamId)!.push(st);
  }

  const classPerformance: ClassPerformanceItem[] = [];
  for (const [streamId, studentsInStream] of classStreamMap.entries()) {
    const streamInfo = streamMetaMap.get(streamId) || {
      className: "Class",
      streamName: "",
      fullName: "Class",
      cycle: "Cycle 1" as const,
    };

    // Sort students in stream
    studentsInStream.sort((a, b) => b.average - a.average);
    const classTop3 = studentsInStream.slice(0, 3).map((st, i) => ({
      ...st,
      rank: i + 1, // Class rank
    }));

    const totalCls = studentsInStream.length;
    const passedCls = studentsInStream.filter((s) => s.average >= 10.0).length;
    const failedCls = totalCls - passedCls;
    const clsPassRate = totalCls > 0 ? parseFloat(((passedCls / totalCls) * 100).toFixed(1)) : 0;
    const clsFailRate = totalCls > 0 ? parseFloat(((failedCls / totalCls) * 100).toFixed(1)) : 0;
    const clsAvgSum = studentsInStream.reduce((acc, s) => acc + s.average, 0);
    const clsAvg = totalCls > 0 ? parseFloat((clsAvgSum / totalCls).toFixed(2)) : 0;

    classPerformance.push({
      classStreamId: streamId,
      className: streamInfo.className,
      streamName: streamInfo.streamName,
      fullClassName: streamInfo.fullName,
      cycle: streamInfo.cycle,
      totalStudents: totalCls,
      passedCount: passedCls,
      failedCount: failedCls,
      passRate: clsPassRate,
      failRate: clsFailRate,
      classAverage: clsAvg,
      highestAverage: studentsInStream[0]?.average || 0,
      lowestAverage: studentsInStream[studentsInStream.length - 1]?.average || 0,
      top3: classTop3,
    });
  }

  // Sort classes by pass rate descending
  classPerformance.sort((a, b) => b.passRate - a.passRate);

  // 11. Subject Laureates (Best mark per subject, pass rate)
  const subjectLaureates: SubjectLaureateItem[] = [];
  for (const [subId, scoreEntries] of subjectScoresMap.entries()) {
    if (scoreEntries.length === 0) continue;

    // Find subject metadata
    let subName = "Subject";
    let subCode = "SUB";
    let deptName: string | undefined;

    for (const coefVal of coefMap.values()) {
      if (coefVal.subject?.id === subId) {
        subName = coefVal.subject.name;
        subCode = coefVal.subject.code || "";
        deptName = coefVal.subject.department?.name;
        break;
      }
    }

    // Sort by mark descending
    scoreEntries.sort((a, b) => b.mark - a.mark);
    const best = scoreEntries[0];
    const totalSub = scoreEntries.length;
    const passedSub = scoreEntries.filter((s) => s.mark >= 10.0).length;
    const subPassRate = totalSub > 0 ? parseFloat(((passedSub / totalSub) * 100).toFixed(1)) : 0;
    const subAvg = parseFloat((scoreEntries.reduce((acc, s) => acc + s.mark, 0) / totalSub).toFixed(2));

    const streamInfo = streamMetaMap.get(best.streamId);
    const bestStudentName = `${best.student?.last_name || ""} ${best.student?.first_name || ""}`.trim();

    const teachers = Array.from(subjectTeachersMap.get(subId) || []);
    const topTeacher = streamSubjectTeacherMap.get(`${best.streamId}_${subId}`) || teachers[0];

    subjectLaureates.push({
      subjectId: subId,
      subjectName: subName,
      subjectCode: subCode,
      departmentName: deptName,
      bestMark: best.mark,
      studentName: bestStudentName,
      studentMatricule: best.student?.matricule || "N/A",
      className: streamInfo?.fullName || "Class",
      cycle: streamInfo?.cycle || "Cycle 1",
      totalEvaluated: totalSub,
      passedCount: passedSub,
      passRate: subPassRate,
      averageScore: subAvg,
      teachers,
      topTeacher,
    });
  }

  // Sort subject laureates by highest bestMark descending
  subjectLaureates.sort((a, b) => b.bestMark - a.bestMark);

  // 12. Build Role Scope Title
  let scopeTitle = "Institution-wide Academic Performance";
  if (role === "teacher") {
    scopeTitle = `Teacher Performance Overview (${scopedStreamIds?.length || 0} classes)`;
  } else if (role === "hod") {
    scopeTitle = departmentName ? `${departmentName} Departmental Overview` : "Departmental Academic Overview";
  }

  return {
    schoolName: school?.name || "School",
    schoolInfo: {
      id: school?.id || schoolId,
      name: school?.name || "School",
      code: school?.code || null,
      logoUrl: school?.logo_url || null,
      motto: school?.motto || null,
      address: school?.address || null,
      phone: school?.phone || null,
      email: school?.email || null,
      subsystem: (school?.subsystem as any) || "bilingual",
    },
    academicYearName,
    selectedSequenceId: targetSequenceId,
    selectedSequenceName,
    availableSequences,
    overallKpis: {
      totalStudentsEvaluated,
      passedCount,
      failedCount,
      passRate,
      failRate,
      overallAverage,
      highestAverage,
      lowestAverage,
      honorsCount: honorsStudents.length,
    },
    dux,
    topStudents,
    allRankedStudents: rankedStudents,
    classPerformance,
    subjectLaureates,
    scope: {
      role,
      title: scopeTitle,
      departmentName,
      assignedClassCount: scopedStreamIds?.length,
    },
  };
}
