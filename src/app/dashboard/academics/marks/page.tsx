import Link from "next/link";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { getTenantContext } from "@/lib/tenancy/context";
import {
  getActiveAcademicYear,
  getSchoolSequences,
  getSchoolClasses,
  getSchoolSubjects,
  getEnrolledStudents,
  getSchoolTeacherAssignments,
} from "@/lib/academic/service";
import {
  getMarksForSequence,
  getDepartmentalApproval,
} from "@/lib/academic/marks-service";
import { createClient } from "@/lib/supabase/server";
import { MarksGridClient } from "./MarksGridClient";
import { AlertCircle, ArrowLeft, BookOpen, GraduationCap, Sparkles, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

interface MarksPageProps {
  searchParams: Promise<{
    sequenceId?: string;
    classStreamId?: string;
    subjectId?: string;
  }>;
}

export default async function MarksPage({ searchParams }: MarksPageProps) {
  const params = await searchParams;
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";
  const roleCode = context?.role?.code || "teacher";
  const isTeacher = roleCode === "teacher" || roleCode === "class_master";

  // 1. Load active academic year, terms & sequences
  const activeYear = await getActiveAcademicYear(schoolId);
  const [sequences, classesWithStreams, subjects, teacherAssignments, allSchoolAssignments] = await Promise.all([
    getSchoolSequences(schoolId),
    getSchoolClasses(schoolId, activeYear?.id),
    getSchoolSubjects(schoolId),
    isTeacher && activeYear && context?.user?.id
      ? getSchoolTeacherAssignments(schoolId, activeYear.id, context.user.id)
      : Promise.resolve([]),
    !isTeacher && activeYear
      ? getSchoolTeacherAssignments(schoolId, activeYear.id)
      : Promise.resolve([]),
  ]);

  const allStreams = classesWithStreams.flatMap((c) => c.streams);

  // Set of assigned stream IDs and subject IDs for the teacher
  const assignedStreamIds = new Set(teacherAssignments.map((a) => a.class_stream_id));
  const assignedSubjectIds = new Set(teacherAssignments.map((a) => a.subject_id));

  // Build a map of class_stream_id -> Set<subject_id> for cross-filtering
  const streamToSubjects = new Map<string, Set<string>>();
  for (const a of teacherAssignments) {
    if (!streamToSubjects.has(a.class_stream_id)) {
      streamToSubjects.set(a.class_stream_id, new Set());
    }
    streamToSubjects.get(a.class_stream_id)!.add(a.subject_id);
  }

  // For teachers: only show assigned streams; for admins: show all
  const visibleStreams = isTeacher && teacherAssignments.length > 0
    ? allStreams.filter((s) => assignedStreamIds.has(s.id))
    : allStreams;

  // Default selections: if teacher has assignments and no param specified, pick teacher's first assigned class and subject
  const defaultStreamId =
    params.classStreamId ||
    (isTeacher && teacherAssignments.length > 0 ? teacherAssignments[0].class_stream_id : undefined);
  const defaultSubjectId =
    params.subjectId ||
    (isTeacher && teacherAssignments.length > 0 ? teacherAssignments[0].subject_id : undefined);

  const selectedSequence =
    sequences.find((s) => s.id === params.sequenceId) ||
    sequences.find((s) => s.is_open_for_marks) ||
    sequences[0] ||
    null;

  const selectedStream =
    visibleStreams.find((s) => s.id === defaultStreamId) || visibleStreams[0] || null;

  // For teachers: cross-filter subjects by their assigned classes and subjects
  // For administrators / HODs: filter subjects by those assigned to the selected class group (falling back to all subjects if none are assigned yet)
  const adminStreamSubjectIds = new Set(
    allSchoolAssignments
      .filter((a) => a.class_stream_id === selectedStream?.id)
      .map((a) => a.subject_id)
  );

  const subjectsForSelectedStream = isTeacher && teacherAssignments.length > 0
    ? subjects.filter((s) => {
        const allowedSubjects = selectedStream ? streamToSubjects.get(selectedStream.id) : null;
        return allowedSubjects ? allowedSubjects.has(s.id) : assignedSubjectIds.has(s.id);
      })
    : adminStreamSubjectIds.size > 0
    ? subjects.filter((s) => adminStreamSubjectIds.has(s.id))
    : subjects;

  const selectedSubject =
    subjectsForSelectedStream.find((s) => s.id === defaultSubjectId) || subjectsForSelectedStream[0] || null;

  // For teachers: verify the selected class+subject is an actual assignment
  const isAuthorizedForSelection = !isTeacher || teacherAssignments.length === 0 ||
    teacherAssignments.some(
      (a) => a.class_stream_id === selectedStream?.id && a.subject_id === selectedSubject?.id
    );

  // 2. Load enrolled students for stream
  const enrolments =
    selectedStream && activeYear
      ? await getEnrolledStudents(schoolId, activeYear.id, selectedStream.id)
      : [];

  // 3. Load existing marks if sequence, stream, and subject are selected
  const existingMarks =
    selectedSequence && selectedStream && selectedSubject
      ? await getMarksForSequence(
          schoolId,
          selectedSequence.id,
          selectedStream.id,
          selectedSubject.id
        )
      : [];

  // 4. Load HOD approval if subject belongs to a department
  const departmentalApproval =
    selectedSequence && selectedStream && selectedSubject?.department_id
      ? await getDepartmentalApproval(
          schoolId,
          selectedSequence.id,
          selectedStream.id,
          selectedSubject.department_id,
          selectedSubject.id
        )
      : null;

  // 5. Load existing CBA competence evaluated for this class & subject
  let initialCompetency = "";
  if (selectedSubject && selectedStream) {
    const supabase = await createClient();
    const { data: comp } = await supabase
      .from("subject_competencies")
      .select("description")
      .eq("school_id", schoolId)
      .eq("subject_id", selectedSubject.id)
      .eq("class_id", selectedStream.class_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (comp?.description) {
      initialCompetency = comp.description;
    } else {
      const { data: generalComp } = await supabase
        .from("subject_competencies")
        .select("description")
        .eq("school_id", schoolId)
        .eq("subject_id", selectedSubject.id)
        .is("class_id", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (generalComp?.description) {
        initialCompetency = generalComp.description;
      }
    }
  }

  // Merge enrolled students with their existing marks
  const studentRows = enrolments.map((e) => {
    const existing = existingMarks.find((m) => m.student_id === e.student_id);
    return {
      studentId: e.student_id,
      matricule: e.student?.matricule || "N/A",
      fullName: `${e.student?.last_name || ""} ${e.student?.first_name || ""}`.trim(),
      gender: e.student?.gender || "M",
      score: existing?.score ?? null,
      status: (existing?.status as "present" | "absent" | "exempt") || "present",
      remarks: existing?.remarks || "",
      isLocked: existing?.is_locked || false,
    };
  });

  const canApprove =
    context?.role?.code === "school_admin" ||
    context?.role?.code === "principal" ||
    context?.role?.code === "hod";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8DFC9]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/dashboard/academics"
              className="inline-flex items-center gap-1 text-[#525E4B] hover:text-[#142010] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Classes &amp; Subjects</span>
            </Link>
            <span className="text-[#E8DFC9]">/</span>
            <span className="font-semibold text-[#2A7C13]">Enter Marks</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#142010] tracking-tight">
            Enter Student Marks
          </h1>
          <p className="text-xs text-[#525E4B]">
            Choose a class, subject and test, then enter each student&apos;s mark. Marks are shown on a scale of 20.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-[4px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] text-xs font-bold">
            {activeYear?.name || "Academic year not set"}
          </span>
        </div>
      </div>

      {/* Teacher Assignment Status Banner */}
      {isTeacher && teacherAssignments.length === 0 && (
        <div className="p-6 rounded-[8px] bg-[#FFF8CF] border border-[#FBE6C2] space-y-3">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
            <div className="text-xs text-[#7A4A00] space-y-1">
              <p className="font-bold text-sm text-[#4A3D00]">You have not been assigned to any classes or subjects yet.</p>
              <p>
                Your school administrator or Head of Department assigns teachers to their classes.
                Once assigned, your classes and subjects will appear here automatically.
              </p>
              <p className="text-[11px] text-[#92400E]">
                If you believe this is an error, please contact your school administrator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter / Selector Controls — hidden for unassigned teachers */}
      {(!isTeacher || teacherAssignments.length > 0) && (
      <div className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">
            Choose a Class, Test &amp; Subject
          </div>
          {isTeacher && teacherAssignments.length > 0 && (
            <span className="text-[11px] text-[#2A7C13] font-semibold flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{teacherAssignments.length} assignment{teacherAssignments.length === 1 ? "" : "s"} · {visibleStreams.length} class{visibleStreams.length === 1 ? "" : "es"}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Sequence Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Test / Sequence
            </label>
            <form method="GET">
              <input type="hidden" name="classStreamId" value={selectedStream?.id || ""} />
              <input type="hidden" name="subjectId" value={selectedSubject?.id || ""} />
              <AutoSubmitSelect
                name="sequenceId"
                defaultValue={selectedSequence?.id}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                {sequences.map((seq) => (
                  <option key={seq.id} value={seq.id}>
                    {seq.name} (Test {seq.sequence_number}) — {seq.is_open_for_marks ? "Open for Marks" : "Closed"}
                  </option>
                ))}
              </AutoSubmitSelect>
            </form>
          </div>

          {/* 2. Class Stream Selector — teachers see only assigned classes */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Class Group
            </label>
            <form method="GET">
              <input type="hidden" name="sequenceId" value={selectedSequence?.id || ""} />
              <input type="hidden" name="subjectId" value={selectedSubject?.id || ""} />
              <AutoSubmitSelect
                name="classStreamId"
                defaultValue={selectedStream?.id}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                {visibleStreams.map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name}
                  </option>
                ))}
              </AutoSubmitSelect>
            </form>
          </div>

          {/* 3. Subject Selector — teachers see only subjects assigned for the selected class */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Subject
            </label>
            <form method="GET">
              <input type="hidden" name="sequenceId" value={selectedSequence?.id || ""} />
              <input type="hidden" name="classStreamId" value={selectedStream?.id || ""} />
              <AutoSubmitSelect
                name="subjectId"
                defaultValue={selectedSubject?.id}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                {subjectsForSelectedStream.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </AutoSubmitSelect>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* Interactive Mark Entry Table or Missing Configuration State */}
      {isTeacher && teacherAssignments.length === 0 ? (
        /* Unassigned teacher: no grid at all */
        null
      ) : !selectedSequence || !selectedStream || !selectedSubject ? (
        <div className="p-8 text-center rounded-[8px] bg-white border border-[#E8DFC9] text-xs text-[#788470]">
          Set up a current school year, class groups and subjects before entering marks.
        </div>
      ) : isTeacher && !isAuthorizedForSelection ? (
        <div className="p-6 rounded-[8px] bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-700 space-y-1">
            <p className="font-bold text-sm">Access Denied</p>
            <p>
              You are not assigned to teach <strong>{selectedSubject.name}</strong> in <strong>{selectedStream.name}</strong>.
              Please select a class and subject from your assignments above.
            </p>
          </div>
        </div>
      ) : (
        <MarksGridClient
          academicYearId={activeYear?.id || ""}
          termId={selectedSequence.term_id}
          sequenceId={selectedSequence.id}
          classStreamId={selectedStream.id}
          subjectId={selectedSubject.id}
          departmentId={selectedSubject.department_id || undefined}
          subjectName={selectedSubject.name}
          streamName={selectedStream.name}
          sequenceName={selectedSequence.name}
          coefficient={selectedSubject.default_coefficient}
          initialMaxMarks={selectedSubject.default_max_marks || 20}
          initialCompetency={initialCompetency}
          isApproved={departmentalApproval?.status === "approved"}
          approvalStatus={departmentalApproval?.status || "draft"}
          approvalNotes={departmentalApproval?.notes || undefined}
          approverName={departmentalApproval?.approver?.full_name}
          approvedAt={departmentalApproval?.approved_at || undefined}
          canApprove={canApprove}
          isTeacher={isTeacher}
          students={studentRows}
        />
      )}
    </div>
  );
}
