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
import { ArrowLeft } from "lucide-react";

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

      {/* Filter / Selector Controls */}
      <div className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">
          Choose a Class, Test &amp; Subject
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Sequence Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Test / Sequence
            </label>
            <form method="GET" className="flex gap-2">
              <input type="hidden" name="classStreamId" value={selectedStream?.id || ""} />
              <input type="hidden" name="subjectId" value={selectedSubject?.id || ""} />
              <select
                name="sequenceId"
                defaultValue={selectedSequence?.id}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                {sequences.map((seq) => (
                  <option key={seq.id} value={seq.id}>
                    {seq.name} (Test {seq.sequence_number} of 6)
                  </option>
                ))}
              </select>
              <button type="submit" className="px-2.5 py-1.5 rounded-[5px] bg-[#2A7C13] text-white text-[10px] font-semibold">Apply</button>
            </form>
          </div>

          {/* 2. Class Stream Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Class Group
            </label>
            <form method="GET" className="flex gap-2">
              <input type="hidden" name="sequenceId" value={selectedSequence?.id || ""} />
              <input type="hidden" name="subjectId" value={selectedSubject?.id || ""} />
              <select
                name="classStreamId"
                defaultValue={selectedStream?.id}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                {allStreams.map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="px-2.5 py-1.5 rounded-[5px] bg-[#2A7C13] text-white text-[10px] font-semibold">Apply</button>
            </form>
          </div>

          {/* 3. Subject Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Subject
            </label>
            <form method="GET" className="flex gap-2">
              <input type="hidden" name="sequenceId" value={selectedSequence?.id || ""} />
              <input type="hidden" name="classStreamId" value={selectedStream?.id || ""} />
              <select
                name="subjectId"
                defaultValue={selectedSubject?.id}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="px-2.5 py-1.5 rounded-[5px] bg-[#2A7C13] text-white text-[10px] font-semibold">Apply</button>
            </form>
          </div>
        </div>
      </div>

      {/* Interactive Mark Entry Table or Missing Configuration State */}
      {!selectedSequence || !selectedStream || !selectedSubject ? (
        <div className="p-8 text-center rounded-[8px] bg-white border border-[#E8DFC9] text-xs text-[#788470]">
          Set up a current school year, class groups and subjects before entering marks.
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
