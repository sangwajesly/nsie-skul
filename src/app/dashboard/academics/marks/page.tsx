import Link from "next/link";
import { getTenantContext } from "@/lib/tenancy/context";
import {
  getActiveAcademicYear,
  getSchoolSequences,
  getSchoolClasses,
  getSchoolSubjects,
  getEnrolledStudents,
} from "@/lib/academic/service";
import {
  getMarksForSequence,
  getDepartmentalApproval,
} from "@/lib/academic/marks-service";
import { MarksGridClient } from "./MarksGridClient";
import { ArrowLeft, ClipboardList, Layers, BookOpen, Calendar } from "lucide-react";

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

  // 1. Load active academic year, terms & sequences
  const activeYear = await getActiveAcademicYear(schoolId);
  const sequences = await getSchoolSequences(schoolId);
  const classesWithStreams = await getSchoolClasses(schoolId, activeYear?.id);
  const allStreams = classesWithStreams.flatMap((c) => c.streams);
  const subjects = await getSchoolSubjects(schoolId);

  // Default selections if not in query
  const selectedSequence =
    sequences.find((s) => s.id === params.sequenceId) || sequences[0] || null;
  const selectedStream =
    allStreams.find((s) => s.id === params.classStreamId) || allStreams[0] || null;
  const selectedSubject =
    subjects.find((s) => s.id === params.subjectId) || subjects[0] || null;

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
          selectedSubject.department_id
        )
      : null;

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
              <span>Academics Hub</span>
            </Link>
            <span className="text-[#E8DFC9]">/</span>
            <span className="font-semibold text-[#2A7C13]">Sequence Marks</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#142010] tracking-tight">
            Class Mark Sheet &amp; Evaluations
          </h1>
          <p className="text-xs text-[#525E4B]">
            Keyboard-first mark entry for official Cameroonian secondary 6-sequence assessments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-[4px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] text-xs font-bold">
            {activeYear?.name || "2026/2027 Academic Year"}
          </span>
        </div>
      </div>

      {/* Filter / Selector Controls */}
      <div className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">
          Select Class, Sequence &amp; Subject
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Sequence Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Evaluation Sequence
            </label>
            <form method="GET">
              <input type="hidden" name="classStreamId" value={selectedStream?.id || ""} />
              <input type="hidden" name="subjectId" value={selectedSubject?.id || ""} />
              <select
                name="sequenceId"
                defaultValue={selectedSequence?.id}
                onChange={(e) => e.target.form?.submit()}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                {sequences.map((seq) => (
                  <option key={seq.id} value={seq.id}>
                    {seq.name} (Sequence {seq.sequence_number})
                  </option>
                ))}
              </select>
            </form>
          </div>

          {/* 2. Class Stream Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Class &amp; Stream
            </label>
            <form method="GET">
              <input type="hidden" name="sequenceId" value={selectedSequence?.id || ""} />
              <input type="hidden" name="subjectId" value={selectedSubject?.id || ""} />
              <select
                name="classStreamId"
                defaultValue={selectedStream?.id}
                onChange={(e) => e.target.form?.submit()}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                {allStreams.map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name}
                  </option>
                ))}
              </select>
            </form>
          </div>

          {/* 3. Subject Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Teaching Subject
            </label>
            <form method="GET">
              <input type="hidden" name="sequenceId" value={selectedSequence?.id || ""} />
              <input type="hidden" name="classStreamId" value={selectedStream?.id || ""} />
              <select
                name="subjectId"
                defaultValue={selectedSubject?.id}
                onChange={(e) => e.target.form?.submit()}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code}) · Coef {sub.default_coefficient}
                  </option>
                ))}
              </select>
            </form>
          </div>
        </div>
      </div>

      {/* Interactive Mark Entry Table or Missing Configuration State */}
      {!selectedSequence || !selectedStream || !selectedSubject ? (
        <div className="p-8 text-center rounded-[8px] bg-white border border-[#E8DFC9] text-xs text-[#788470]">
          Please configure academic sequences, class streams, and subjects to begin entering marks.
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
          coefficient={selectedSubject.default_coefficient}
          initialMaxMarks={selectedSubject.default_max_marks || 20}
          isApproved={departmentalApproval?.status === "approved"}
          approverName={departmentalApproval?.approver?.full_name}
          approvedAt={departmentalApproval?.approved_at || undefined}
          canApprove={canApprove}
          students={studentRows}
        />
      )}
    </div>
  );
}
