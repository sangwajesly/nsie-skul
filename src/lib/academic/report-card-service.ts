import { createClient } from "@/lib/supabase/server";
import { getGradeAppreciation } from "./grading";
import {
  School,
  Student,
  ClassStream,
  Term,
  AssessmentMark,
  CbaAppreciation,
} from "@/types/database";

export interface SubjectRowData {
  subjectId: string;
  subjectName: string;
  teacherName: string;
  competencies: string[];
  seqAMark: number | null;
  seqBMark: number | null;
  termAverage: number | null; // AV/20
  coefficient: number;
  weightedScore: number | null; // AV x Coef
  grade: string;
  cba: CbaAppreciation;
  minClassScore: number;
  maxClassScore: number;
  remarks: string;
}

export interface ReportCardFullData {
  school: {
    name: string;
    code: string | null;
    logo_url: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    regionalDelegation: string;
    divisionalDelegation: string;
    subsystem: string;
  };
  term: {
    id: string;
    name: string;
    termNumber: 1 | 2 | 3;
    academicYearName: string;
  };
  student: {
    id: string;
    matricule: string;
    fullName: string;
    dateOfBirth: string | null;
    placeOfBirth: string | null;
    gender: "M" | "F";
    residenceStatus: "day" | "boarding";
    guardianName: string | null;
    guardianPhone: string | null;
    isRepeater: boolean;
  };
  classInfo: {
    className: string;
    streamName: string;
    classEnrolment: number;
    classMasterName: string;
  };
  subjects: SubjectRowData[];
  summary: {
    totalCoef: number;
    totalWeightedScore: number;
    studentAverage: number;
    subjectsPassed: number;
    totalSubjects: number;
    letterGrade: string;
    cbaAppreciation: CbaAppreciation;
    rank: number | null;
    rankingEnabled: boolean;
  };
  classProfile: {
    classAverage: number;
    minAverage: number;
    maxAverage: number;
    numberPassed: number;
    successRate: number;
  };
  discipline: {
    unjustifiedAbsHours: number;
    justifiedAbsHours: number;
    lateCount: number;
    punishmentHours: number;
    warning: boolean;
    reprimand: boolean;
    suspension: boolean;
    dismissed: boolean;
  };
  remarks: {
    performanceRemarks: string;
    classMasterRemarks: string;
    principalRemarks: string;
  };
}

/**
 * Standard MINESEC CBA competencies map fallback (from official syllabus)
 */
const DEFAULT_CBA_COMPETENCIES: Record<string, string[]> = {
  FRENCH: [
    "Se servir du français pour échanger avec les membres de sa communauté sur la vie familiale et scolaire.",
    "Utiliser les ressources nécessaires du français pour tenir un échange basé sur l'hygiène et salubrité.",
  ],
  "COMPUTER SCIENCES": [
    "Classify hardware and software components of a computer, and carry out basic maintenance.",
    "Use appropriate application software or internet services to accomplish tasks.",
  ],
  "ART AND CULTURE": [
    "Use primary colours to convey messages about preserving cultural heritage.",
    "Identify musical notes and simple bars for public performances.",
  ],
  "LITERATURE IN ENGLISH": [
    "Use literary skills and knowledge to recall, classify and perform traditional literary forms.",
    "Identify, classify and discuss basic elements of prose and poetry.",
  ],
  "ENGLISH LANGUAGE": [
    "Use English language skills (listening, speaking, reading, writing) to satisfy basic communicative needs.",
    "Use language resources to engage in community activities and global issues.",
  ],
  "NATIONAL CULTURE": [
    "Present cultural practices in relation to life styles in the domain of citizenship.",
  ],
  "NATIONAL LANGUAGES": [
    "Produce messages in national languages using correct noun and verb forms in different situations.",
  ],
  "CITIZENSHIP EDUCATION": [
    "Promotion of national integration: manifestations and hindrances.",
  ],
  GEOGRAPHY: [
    "Control population growth and adopt healthy ecological behaviours to protect the environment.",
  ],
  HISTORY: [
    "Promote national integration and protect and re-enforce the African identity.",
  ],
  BIOLOGY: [
    "Use scientific reasoning to solve problem-situations relating to agriculture and hygiene.",
    "Solve problem-situations relating to harmful health practices and environmental conservation.",
  ],
  CHEMISTRY: [
    "Use scientific reasoning relating to subatomic particles, simple atomic models, and chemical formulae.",
  ],
  "HOME ECONOMICS": [
    "Select a balanced diet so as to prevent nutritional diseases and practice kitchen safety.",
  ],
  MATHEMATICS: [
    "Use mathematical reasoning and language to solve problem-situations relating to numbers and geometry.",
  ],
  PHYSICS: [
    "Use scientific reasoning relating to measurements, heat, electricity, and energy sources.",
  ],
  "SPORTS AND PHYSICAL EDUCATION": [
    "Run endurance-sprint races, perform gymnastics techniques, and participate in team sports.",
  ],
  "MANUAL LABOUR": [
    "Use agricultural tools to cultivate vegetables and maintain artistic and school objects.",
  ],
};

export interface StreamReportCardContext {
  school: School;
  term: Term & { academic_year: { name: string } };
  sequences: any[];
  allSubjects: any[];
  classSubjectMap: Map<string, { coefficient: number; max_marks: number }>;
  teacherNameMap?: Map<string, string>;
  streamMarks: AssessmentMark[];
  dbCompetencies: any[];
  actualClassSize: number;
  studentAverages: Array<{ studentId: string; average: number }>;
  classProfile: {
    classAverage: number;
    minAverage: number;
    maxAverage: number;
    numberPassed: number;
    successRate: number;
  };
  enrolmentsMap?: Map<string, any>;
  termResultsMap?: Map<string, any>;
  attendanceMap?: Map<string, { unjustified: number; justified: number; late: number }>;
  sanctionsMap?: Map<string, { punishment: number; warning: boolean; reprimand: boolean; suspension: boolean; dismissed: boolean }>;
}

/**
 * Generates the complete official MINESEC CBA Report Card dataset for a student.
 * Supports optional pre-batched StreamReportCardContext to eliminate N+1 queries.
 */
export async function getStudentReportCard(
  schoolId: string,
  termId: string,
  studentId: string,
  sharedContext?: StreamReportCardContext
): Promise<ReportCardFullData | null> {
  const supabase = await createClient();

  if (!schoolId || !termId || !studentId) return null;

  // 1. Fetch School (or use pre-batched)
  let school: School | null = sharedContext?.school || null;
  if (!school) {
    const { data: schoolData } = await supabase
      .from("schools")
      .select("*")
      .eq("id", schoolId)
      .maybeSingle();
    school = (schoolData as School) || null;
  }
  if (!school) return null;

  // 2. Fetch Term & Academic Year (or use pre-batched)
  let term: (Term & { academic_year: { name: string } }) | null = sharedContext?.term || null;
  if (!term) {
    const { data: termData } = await supabase
      .from("terms")
      .select("*, academic_year:academic_years (*)")
      .eq("id", termId)
      .maybeSingle();
    term = (termData as Term & { academic_year: { name: string } }) || null;
  }
  if (!term) return null;

  // 3. Fetch Student & Enrolment (or use pre-batched map)
  let enrolmentData = sharedContext?.enrolmentsMap?.get(studentId) || null;
  if (!enrolmentData) {
    const { data: fetchedEnrolment } = await supabase
      .from("enrolments")
      .select(
        `
        *,
        student:students (*),
        class_stream:class_streams (
          *,
          class:classes (*),
          class_master:user_profiles (*)
        )
      `
      )
      .eq("school_id", schoolId)
      .eq("academic_year_id", term.academic_year_id)
      .eq("student_id", studentId)
      .maybeSingle();
    enrolmentData = fetchedEnrolment;
  }

  if (!enrolmentData || !enrolmentData.student) return null;
  const student = enrolmentData.student as Student;
  const classStream = enrolmentData.class_stream as ClassStream & {
    class: { name: string };
    class_master: { full_name: string } | null;
  };

  // 4. Fetch Sequences in this Term
  let sequences = sharedContext?.sequences || null;
  if (!sequences) {
    const { data: sequencesData } = await supabase
      .from("evaluation_sequences")
      .select("*")
      .eq("term_id", termId)
      .order("sequence_number", { ascending: true });
    sequences = sequencesData || [];
  }
  const seqA = sequences[0] || null;
  const seqB = sequences[1] || null;

  // 5. Fetch Class Enrolment count
  let classEnrolmentCount = sharedContext?.actualClassSize || null;
  if (classEnrolmentCount === null) {
    const { count } = await supabase
      .from("enrolments")
      .select("id", { count: "exact", head: true })
      .eq("class_stream_id", classStream.id)
      .eq("status", "active");
    classEnrolmentCount = count || 1;
  }

  // 6. Fetch Subjects for this stream & department
  let allSubjects = sharedContext?.allSubjects || null;
  let teacherNameMap = sharedContext?.teacherNameMap || new Map<string, string>();

  if (!allSubjects) {
    const [
      { data: subjectsData },
      { data: teacherAssignmentsData },
      { data: classSubjectsData },
    ] = await Promise.all([
      supabase
        .from("subjects")
        .select(
          `
          *,
          department:departments (*)
        `
        )
        .eq("school_id", schoolId)
        .order("name", { ascending: true }),
      supabase
        .from("teacher_assignments")
        .select(
          `
          subject_id,
          teacher:user_profiles (full_name)
        `
        )
        .eq("school_id", schoolId)
        .eq("academic_year_id", term.academic_year_id)
        .eq("class_stream_id", classStream.id),
      supabase
        .from("class_subjects")
        .select("subject_id, coefficient, max_marks")
        .eq("class_stream_id", classStream.id),
    ]);

    const rawSubjects = subjectsData || [];
    const assignedSubjectIds = new Set<string>();

    (teacherAssignmentsData || []).forEach((ta: any) => {
      assignedSubjectIds.add(ta.subject_id);
      const teacher = ta.teacher as { full_name?: string } | null;
      if (teacher?.full_name) {
        teacherNameMap.set(ta.subject_id, teacher.full_name);
      }
    });

    (classSubjectsData || []).forEach((cs) => {
      assignedSubjectIds.add(cs.subject_id);
    });

    // Only include subjects assigned to this class group!
    // Falls back to raw subjects only if no assignments exist at all in the school yet.
    allSubjects = assignedSubjectIds.size > 0
      ? rawSubjects.filter((s) => assignedSubjectIds.has(s.id))
      : rawSubjects;
  }

  // 6b. Fetch stream-specific class_subjects for custom coefficients and max marks
  let classSubjectMap = sharedContext?.classSubjectMap || null;
  if (!classSubjectMap) {
    const { data: classSubjectsData } = await supabase
      .from("class_subjects")
      .select("subject_id, coefficient, max_marks")
      .eq("class_stream_id", classStream.id);

    classSubjectMap = new Map<string, { coefficient: number; max_marks: number }>();
    (classSubjectsData || []).forEach((cs) => {
      classSubjectMap!.set(cs.subject_id, {
        coefficient: Number(cs.coefficient),
        max_marks: Number(cs.max_marks),
      });
    });
  }

  // 7. Fetch All Marks for this Term in this Stream
  let streamMarks = sharedContext?.streamMarks || null;
  if (!streamMarks) {
    const seqIds = sequences.map((s) => s.id);
    const { data: streamMarksData } = await supabase
      .from("assessment_marks")
      .select("*")
      .in("sequence_id", seqIds.length > 0 ? seqIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("class_stream_id", classStream.id);
    streamMarks = (streamMarksData as AssessmentMark[]) || [];
  }

  // 8. Fetch stored competencies if any
  let dbCompetencies = sharedContext?.dbCompetencies || null;
  if (!dbCompetencies) {
    const { data: fetchedComps } = await supabase
      .from("subject_competencies")
      .select("*")
      .eq("school_id", schoolId)
      .eq("term_number", term.term_number);
    dbCompetencies = fetchedComps || [];
  }

  // 9. Build per-subject rows
  let totalCoef = 0;
  let totalWeightedScore = 0;
  let subjectsPassed = 0;

  const subjectRows: SubjectRowData[] = allSubjects.map((sub) => {
    const studentSeqAMark = streamMarks!.find(
      (m) =>
        m.student_id === student.id &&
        m.subject_id === sub.id &&
        m.sequence_id === seqA?.id
    );
    const studentSeqBMark = streamMarks!.find(
      (m) =>
        m.student_id === student.id &&
        m.subject_id === sub.id &&
        m.sequence_id === seqB?.id
    );

    const scoreA = studentSeqAMark?.status === "present" ? studentSeqAMark.normalized_score_20 : null;
    const scoreB = studentSeqBMark?.status === "present" ? studentSeqBMark.normalized_score_20 : null;

    let termAvg: number | null = null;
    if (scoreA !== null && scoreB !== null) {
      termAvg = parseFloat(((scoreA + scoreB) / 2).toFixed(2));
    } else if (scoreA !== null) {
      termAvg = scoreA;
    } else if (scoreB !== null) {
      termAvg = scoreB;
    }

    const streamSubjectConfig = classSubjectMap!.get(sub.id);
    const coef = streamSubjectConfig?.coefficient ?? (Number(sub.default_coefficient) || 2);
    const weighted = termAvg !== null ? parseFloat((termAvg * coef).toFixed(2)) : null;

    if (termAvg !== null) {
      totalCoef += coef;
      totalWeightedScore += weighted || 0;
      if (termAvg >= 10.0) {
        subjectsPassed++;
      }
    }

    const gradeInfo = getGradeAppreciation(termAvg);

    // Compute min and max across class for this subject
    const subjectScoresInClass = streamMarks!
      .filter((m) => m.subject_id === sub.id && m.status === "present" && m.normalized_score_20 !== null)
      .map((m) => Number(m.normalized_score_20));

    const minClassScore =
      subjectScoresInClass.length > 0 ? Math.min(...subjectScoresInClass) : 8.0;
    const maxClassScore =
      subjectScoresInClass.length > 0 ? Math.max(...subjectScoresInClass) : 18.5;

    // Get competencies (prioritize class-specific competency set by teacher)
    const classSpecificComps = dbCompetencies?.filter(
      (c) => c.subject_id === sub.id && c.class_id === classStream.class_id
    );
    const generalComps = dbCompetencies?.filter(
      (c) => c.subject_id === sub.id && !c.class_id
    );
    const matchedComps =
      classSpecificComps && classSpecificComps.length > 0 ? classSpecificComps : generalComps;
    const customComps = matchedComps?.map((c) => c.description);

    const competencies =
      customComps && customComps.length > 0
        ? customComps
        : DEFAULT_CBA_COMPETENCIES[sub.name.toUpperCase()] || [
            `Demonstrate required competencies in ${sub.name} for Term ${term!.term_number}.`,
          ];

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      teacherName: teacherNameMap.get(sub.id) || "Course Teacher",
      competencies,
      seqAMark: scoreA,
      seqBMark: scoreB,
      termAverage: termAvg,
      coefficient: coef,
      weightedScore: weighted,
      grade: gradeInfo.letter,
      cba: gradeInfo.cba,
      minClassScore,
      maxClassScore,
      remarks:
        termAvg !== null && termAvg >= 15
          ? "Excellent mastery"
          : termAvg !== null && termAvg >= 10
          ? "Satisfactory progress"
          : "Needs remediation",
    };
  });

  const studentAverage =
    totalCoef > 0 ? parseFloat((totalWeightedScore / totalCoef).toFixed(2)) : 0.0;
  const overallGrade = getGradeAppreciation(studentAverage);

  // 10. Fetch or compute Discipline
  let termResultData = sharedContext?.termResultsMap?.get(student.id) || null;
  let liveUnjustified = 0;
  let liveJustified = 0;
  let liveLate = 0;
  let livePunishment = 0;
  let liveWarning = false;
  let liveReprimand = false;
  let liveSuspension = false;
  let liveDismissed = false;

  if (sharedContext?.attendanceMap) {
    const att = sharedContext.attendanceMap.get(student.id);
    if (att) {
      liveUnjustified = att.unjustified;
      liveJustified = att.justified;
      liveLate = att.late;
    }
  } else {
    if (!termResultData) {
      const { data: res } = await supabase
        .from("term_results")
        .select("*")
        .eq("term_id", termId)
        .eq("student_id", student.id)
        .maybeSingle();
      termResultData = res;
    }

    const { data: liveAttendance } = await supabase
      .from("attendance_records")
      .select("status, hours_missed, session:attendance_sessions!inner(term_id)")
      .eq("school_id", schoolId)
      .eq("student_id", student.id)
      .eq("session.term_id", termId);

    for (const rec of liveAttendance || []) {
      const hrs = Number(rec.hours_missed) || 0;
      if (rec.status === "unjustified_absent") liveUnjustified += hrs > 0 ? hrs : 2;
      else if (rec.status === "justified_absent") liveJustified += hrs > 0 ? hrs : 2;
      else if (rec.status === "late") liveLate += 1;
    }
  }

  if (sharedContext?.sanctionsMap) {
    const san = sharedContext.sanctionsMap.get(student.id);
    if (san) {
      livePunishment = san.punishment;
      liveWarning = san.warning;
      liveReprimand = san.reprimand;
      liveSuspension = san.suspension;
      liveDismissed = san.dismissed;
    }
  } else {
    const { data: liveSanctions } = await supabase
      .from("disciplinary_records")
      .select("sanction_type, punishment_hours")
      .eq("school_id", schoolId)
      .eq("student_id", student.id)
      .eq("term_id", termId)
      .eq("status", "active");

    for (const s of liveSanctions || []) {
      livePunishment += s.punishment_hours || 0;
      if (s.sanction_type === "warning") liveWarning = true;
      else if (s.sanction_type === "reprimand") liveReprimand = true;
      else if (s.sanction_type === "suspension") liveSuspension = true;
      else if (s.sanction_type === "dismissed") liveDismissed = true;
    }
  }

  const discipline = {
    unjustifiedAbsHours: termResultData?.unjustified_abs_hours || liveUnjustified,
    justifiedAbsHours: termResultData?.justified_abs_hours || liveJustified,
    lateCount: termResultData?.late_count || liveLate,
    punishmentHours: termResultData?.punishment_hours || livePunishment,
    warning: termResultData?.conduct_status === "warning" || liveWarning,
    reprimand: termResultData?.conduct_status === "reprimand" || liveReprimand,
    suspension: termResultData?.conduct_status === "suspension" || liveSuspension,
    dismissed: termResultData?.conduct_status === "dismissed" || liveDismissed,
  };

  // 11. Compute Real Dynamic Class Ranking & Statistical Profile
  let studentAverages = sharedContext?.studentAverages || null;
  let classProfile = sharedContext?.classProfile || null;
  let actualClassSize = sharedContext?.actualClassSize || 1;

  if (!studentAverages || !classProfile) {
    const { data: allStreamEnrolments } = await supabase
      .from("enrolments")
      .select("student_id")
      .eq("school_id", schoolId)
      .eq("class_stream_id", classStream.id)
      .eq("status", "active");

    const enrolledStudentIds = allStreamEnrolments?.map((e) => e.student_id) || [student.id];
    actualClassSize = Math.max(enrolledStudentIds.length, classEnrolmentCount || 1);

    studentAverages = [];

    for (const sId of enrolledStudentIds) {
      let sCoef = 0;
      let sWeighted = 0;

      for (const sub of allSubjects) {
        const markA = streamMarks!.find(
          (m) => m.student_id === sId && m.subject_id === sub.id && m.sequence_id === seqA?.id
        );
        const markB = streamMarks!.find(
          (m) => m.student_id === sId && m.subject_id === sub.id && m.sequence_id === seqB?.id
        );

        const sScoreA = markA?.status === "present" ? markA.normalized_score_20 : null;
        const sScoreB = markB?.status === "present" ? markB.normalized_score_20 : null;

        let sTermAvg: number | null = null;
        if (sScoreA !== null && sScoreB !== null) {
          sTermAvg = (sScoreA + sScoreB) / 2;
        } else if (sScoreA !== null) {
          sTermAvg = sScoreA;
        } else if (sScoreB !== null) {
          sTermAvg = sScoreB;
        }

        if (sTermAvg !== null) {
          const streamSubjectConfig = classSubjectMap!.get(sub.id);
          const coef = streamSubjectConfig?.coefficient ?? (Number(sub.default_coefficient) || 2);
          sCoef += coef;
          sWeighted += sTermAvg * coef;
        }
      }

      const avg = sCoef > 0 ? parseFloat((sWeighted / sCoef).toFixed(2)) : 0.0;
      studentAverages.push({ studentId: sId, average: avg });
    }

    studentAverages.sort((a, b) => b.average - a.average);

    const validAverages = studentAverages.map((s) => s.average).filter((avg) => avg > 0);
    const classAvg =
      validAverages.length > 0
        ? parseFloat((validAverages.reduce((sum, val) => sum + val, 0) / validAverages.length).toFixed(2))
        : studentAverage;
    const minAvg = validAverages.length > 0 ? Math.min(...validAverages) : studentAverage;
    const maxAvg = validAverages.length > 0 ? Math.max(...validAverages) : studentAverage;
    const numPassed = studentAverages.filter((s) => s.average >= 10.0).length;
    const passRate =
      studentAverages.length > 0
        ? parseFloat(((numPassed / studentAverages.length) * 100).toFixed(1))
        : 0.0;

    classProfile = {
      classAverage: classAvg,
      minAverage: minAvg,
      maxAverage: maxAvg,
      numberPassed: numPassed,
      successRate: passRate,
    };
  }

  // Determine this student's 1-based rank
  const studentIndex = studentAverages.findIndex((s) => s.studentId === student.id);
  const calculatedRank = studentIndex >= 0 ? studentIndex + 1 : 1;

  return {
    school: {
      name: school.name || "GOVERNMENT BILINGUAL HIGH SCHOOL",
      code: school.code || "GBHS",
      logo_url: school.logo_url || null,
      address: school.address || "P.O. Box 144, Bamenda, NW Region",
      phone: school.phone || "+237 670 000 000",
      email: school.email || "info@school.cm",
      regionalDelegation: "NORTH WEST REGION",
      divisionalDelegation: "MEZAM DIVISION",
      subsystem: school.subsystem || "anglophone",
    },
    term: {
      id: term.id,
      name: term.name || `Term ${term.term_number}`,
      termNumber: term.term_number as 1 | 2 | 3,
      academicYearName: term.academic_year?.name || "2026/2027",
    },
    student: {
      id: student.id,
      matricule: student.matricule,
      fullName: `${student.last_name} ${student.first_name}`.trim(),
      dateOfBirth: student.date_of_birth,
      placeOfBirth: student.place_of_birth,
      gender: student.gender,
      residenceStatus: student.residence_status,
      guardianName: student.guardian_name,
      guardianPhone: student.guardian_phone,
      isRepeater: false,
    },
    classInfo: {
      className: classStream.class?.name || "Form 2",
      streamName: classStream.name || "Form 2 A",
      classEnrolment: actualClassSize,
      classMasterName: classStream.class_master?.full_name || "M. Class Master",
    },
    subjects: subjectRows,
    summary: {
      totalCoef,
      totalWeightedScore,
      studentAverage,
      subjectsPassed,
      totalSubjects: allSubjects.length,
      letterGrade: overallGrade.letter,
      cbaAppreciation: overallGrade.cba,
      rank: calculatedRank,
      rankingEnabled: school.ranking_mode === "enabled",
    },
    classProfile,
    discipline,
    remarks: {
      performanceRemarks:
        studentAverage >= 14
          ? "Commendable academic effort this term. Keep up the high standards."
          : studentAverage >= 10
          ? "Satisfactory performance. More consistency is required next term."
          : "Work below expectations. Remedial support and parental supervision strongly advised.",
      classMasterRemarks: "Attentive student. Active participation in class activities.",
      principalRemarks: "Approved and sealed by Academic Council.",
    },
  };
}

/**
 * Retrieves full report card data for all students enrolled in a class stream.
 * Highly optimized: Batches all data in single queries, eliminating 12*N waterfalls.
 */
export async function getClassStreamReportCards(
  schoolId: string,
  termId: string,
  classStreamId: string
): Promise<ReportCardFullData[]> {
  const supabase = await createClient();

  // 1. Fetch all active enrolments for this stream
  const { data: enrolments } = await supabase
    .from("enrolments")
    .select(
      `
      *,
      student:students (*),
      class_stream:class_streams (
        *,
        class:classes (*),
        class_master:user_profiles (*)
      )
    `
    )
    .eq("school_id", schoolId)
    .eq("class_stream_id", classStreamId)
    .eq("status", "active");

  if (!enrolments || enrolments.length === 0) return [];

  // Sort alphabetically by last_name, first_name
  const sorted = [...enrolments].sort((a, b) => {
    const studentA = a.student as { last_name?: string; first_name?: string } | null;
    const studentB = b.student as { last_name?: string; first_name?: string } | null;
    const nameA = `${studentA?.last_name || ""} ${studentA?.first_name || ""}`.trim();
    const nameB = `${studentB?.last_name || ""} ${studentB?.first_name || ""}`.trim();
    return nameA.localeCompare(nameB);
  });

  const enrolledStudentIds = sorted.map((e) => e.student_id);

  // 2. Fetch shared context in parallel (school, term, sequences, subjects, stream marks, competencies, assignments)
  const [
    { data: schoolData },
    { data: termData },
    { data: sequencesData },
    { data: subjectsData },
    { data: classSubjectsData },
    { data: teacherAssignmentsData },
    { data: dbCompetenciesData },
    { data: termResultsData },
    { data: attendanceRecordsData },
    { data: disciplinaryRecordsData },
  ] = await Promise.all([
    supabase.from("schools").select("*").eq("id", schoolId).maybeSingle(),
    supabase.from("terms").select("*, academic_year:academic_years (*)").eq("id", termId).maybeSingle(),
    supabase.from("evaluation_sequences").select("*").eq("term_id", termId).order("sequence_number", { ascending: true }),
    supabase.from("subjects").select("*, department:departments (*)").eq("school_id", schoolId).order("name", { ascending: true }),
    supabase.from("class_subjects").select("subject_id, coefficient, max_marks").eq("class_stream_id", classStreamId),
    supabase.from("teacher_assignments").select("subject_id, teacher:user_profiles (full_name)").eq("school_id", schoolId).eq("class_stream_id", classStreamId),
    supabase.from("subject_competencies").select("*").eq("school_id", schoolId),
    supabase.from("term_results").select("*").eq("term_id", termId).in("student_id", enrolledStudentIds),
    supabase.from("attendance_records").select("student_id, status, hours_missed, session:attendance_sessions!inner(term_id)").eq("school_id", schoolId).in("student_id", enrolledStudentIds).eq("session.term_id", termId),
    supabase.from("disciplinary_records").select("student_id, sanction_type, punishment_hours").eq("school_id", schoolId).in("student_id", enrolledStudentIds).eq("term_id", termId).eq("status", "active"),
  ]);

  if (!schoolData || !termData) return [];

  const school = schoolData as School;
  const term = termData as Term & { academic_year: { name: string } };
  const sequences = sequencesData || [];
  const seqIds = sequences.map((s) => s.id);

  // 2b. Filter strictly to subjects assigned to this class group
  const assignedSubjectIds = new Set<string>();
  const teacherNameMap = new Map<string, string>();

  (teacherAssignmentsData || []).forEach((ta: any) => {
    assignedSubjectIds.add(ta.subject_id);
    const teacher = ta.teacher as { full_name?: string } | null;
    if (teacher?.full_name) {
      teacherNameMap.set(ta.subject_id, teacher.full_name);
    }
  });

  (classSubjectsData || []).forEach((cs) => {
    assignedSubjectIds.add(cs.subject_id);
  });

  const rawSubjects = subjectsData || [];
  const streamSubjects = assignedSubjectIds.size > 0
    ? rawSubjects.filter((s) => assignedSubjectIds.has(s.id))
    : rawSubjects;

  // Fetch assessment marks for this stream and sequences
  const { data: streamMarksData } = await supabase
    .from("assessment_marks")
    .select("*")
    .in("sequence_id", seqIds.length > 0 ? seqIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("class_stream_id", classStreamId);

  const streamMarks = (streamMarksData as AssessmentMark[]) || [];

  // Build lookups and maps
  const classSubjectMap = new Map<string, { coefficient: number; max_marks: number }>();
  (classSubjectsData || []).forEach((cs) => {
    classSubjectMap.set(cs.subject_id, {
      coefficient: Number(cs.coefficient),
      max_marks: Number(cs.max_marks),
    });
  });

  const enrolmentsMap = new Map<string, any>();
  sorted.forEach((e) => enrolmentsMap.set(e.student_id, e));

  const termResultsMap = new Map<string, any>();
  (termResultsData || []).forEach((tr) => termResultsMap.set(tr.student_id, tr));

  const attendanceMap = new Map<string, { unjustified: number; justified: number; late: number }>();
  (attendanceRecordsData || []).forEach((rec: any) => {
    const prev = attendanceMap.get(rec.student_id) || { unjustified: 0, justified: 0, late: 0 };
    const hrs = Number(rec.hours_missed) || 0;
    if (rec.status === "unjustified_absent") prev.unjustified += hrs > 0 ? hrs : 2;
    else if (rec.status === "justified_absent") prev.justified += hrs > 0 ? hrs : 2;
    else if (rec.status === "late") prev.late += 1;
    attendanceMap.set(rec.student_id, prev);
  });

  const sanctionsMap = new Map<string, { punishment: number; warning: boolean; reprimand: boolean; suspension: boolean; dismissed: boolean }>();
  (disciplinaryRecordsData || []).forEach((s: any) => {
    const prev = sanctionsMap.get(s.student_id) || { punishment: 0, warning: false, reprimand: false, suspension: false, dismissed: false };
    prev.punishment += s.punishment_hours || 0;
    if (s.sanction_type === "warning") prev.warning = true;
    else if (s.sanction_type === "reprimand") prev.reprimand = true;
    else if (s.sanction_type === "suspension") prev.suspension = true;
    else if (s.sanction_type === "dismissed") prev.dismissed = true;
    sanctionsMap.set(s.student_id, prev);
  });

  // 3. Precompute class ranking & statistical profile ONCE across assigned stream subjects
  const seqA = sequences[0] || null;
  const seqB = sequences[1] || null;
  const studentAverages: Array<{ studentId: string; average: number }> = [];

  for (const sId of enrolledStudentIds) {
    let sCoef = 0;
    let sWeighted = 0;

    for (const sub of streamSubjects) {
      const markA = streamMarks.find(
        (m) => m.student_id === sId && m.subject_id === sub.id && m.sequence_id === seqA?.id
      );
      const markB = streamMarks.find(
        (m) => m.student_id === sId && m.subject_id === sub.id && m.sequence_id === seqB?.id
      );

      const sScoreA = markA?.status === "present" ? markA.normalized_score_20 : null;
      const sScoreB = markB?.status === "present" ? markB.normalized_score_20 : null;

      let sTermAvg: number | null = null;
      if (sScoreA !== null && sScoreB !== null) {
        sTermAvg = (sScoreA + sScoreB) / 2;
      } else if (sScoreA !== null) {
        sTermAvg = sScoreA;
      } else if (sScoreB !== null) {
        sTermAvg = sScoreB;
      }

      if (sTermAvg !== null) {
        const streamSubjectConfig = classSubjectMap.get(sub.id);
        const coef = streamSubjectConfig?.coefficient ?? (Number(sub.default_coefficient) || 2);
        sCoef += coef;
        sWeighted += sTermAvg * coef;
      }
    }

    const avg = sCoef > 0 ? parseFloat((sWeighted / sCoef).toFixed(2)) : 0.0;
    studentAverages.push({ studentId: sId, average: avg });
  }

  studentAverages.sort((a, b) => b.average - a.average);

  const validAverages = studentAverages.map((s) => s.average).filter((avg) => avg > 0);
  const classAvg =
    validAverages.length > 0
      ? parseFloat((validAverages.reduce((sum, val) => sum + val, 0) / validAverages.length).toFixed(2))
      : 0.0;
  const minAvg = validAverages.length > 0 ? Math.min(...validAverages) : 0.0;
  const maxAvg = validAverages.length > 0 ? Math.max(...validAverages) : 0.0;
  const numPassed = studentAverages.filter((s) => s.average >= 10.0).length;
  const passRate =
    studentAverages.length > 0
      ? parseFloat(((numPassed / studentAverages.length) * 100).toFixed(1))
      : 0.0;

  const classProfile = {
    classAverage: classAvg,
    minAverage: minAvg,
    maxAverage: maxAvg,
    numberPassed: numPassed,
    successRate: passRate,
  };

  const sharedContext: StreamReportCardContext = {
    school,
    term,
    sequences,
    allSubjects: streamSubjects,
    classSubjectMap,
    teacherNameMap,
    streamMarks,
    dbCompetencies: dbCompetenciesData || [],
    actualClassSize: enrolledStudentIds.length,
    studentAverages,
    classProfile,
    enrolmentsMap,
    termResultsMap,
    attendanceMap,
    sanctionsMap,
  };

  // 4. Generate all student report cards in memory with 0 extra DB roundtrips!
  const cards = await Promise.all(
    sorted.map((e) => getStudentReportCard(schoolId, termId, e.student_id, sharedContext))
  );

  return cards.filter((c): c is ReportCardFullData => c !== null);
}
