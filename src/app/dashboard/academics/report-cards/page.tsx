import Link from "next/link";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { getTenantContext } from "@/lib/tenancy/context";
import {
  getActiveAcademicYear,
  getSchoolClasses,
  getEnrolledStudents,
  getSchoolTeacherAssignments,
} from "@/lib/academic/service";
import {
  Printer,
  Users,
  BookOpen,
  AlertCircle,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ReportCardsHubProps {
  searchParams: Promise<{
    classStreamId?: string;
    termNumber?: string;
  }>;
}

export default async function ReportCardsHubPage({
  searchParams,
}: ReportCardsHubProps) {
  const params = await searchParams;
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";
  const roleCode = context?.role?.code || "teacher";
  const canViewReportCards = Boolean(context?.hasPermission("report_cards.view"));
  const isClassMaster = Boolean(context?.isClassMaster || roleCode === "class_master");
  const isAdmin = !roleCode || roleCode === "school_admin" || roleCode === "principal" || roleCode === "superadmin";

  // Access check: only Class Masters, HODs and Administrators can view report cards
  if (!canViewReportCards) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12 text-center">
        <div className="p-8 rounded-[10px] bg-white border border-[#E8DFC9] shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FFF8CF] text-[#B45309] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-[#142010]">Report Cards Access Restricted</h1>
          <p className="text-xs text-[#525E4B] leading-relaxed max-w-md mx-auto">
            Official student report cards are prepared and signed by designated Class Masters (<em>Professeurs Principaux</em>) and School Administrators following mark compilation and class council deliberations.
          </p>
          <p className="text-xs text-[#525E4B]">
            As a subject teacher, enter and verify your subject test scores in the Mark Entry center.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/academics/marks"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Go to Marks &amp; Grades</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeYear = await getActiveAcademicYear(schoolId);
  const classesWithStreams = await getSchoolClasses(schoolId, activeYear?.id);
  const allStreams = classesWithStreams.flatMap((c) => c.streams);

  const teacherAssignments = activeYear && context?.user?.id
    ? await getSchoolTeacherAssignments(schoolId, activeYear.id, context.user.id)
    : [];

  const assignedStreamIds = new Set(teacherAssignments.map((a) => a.class_stream_id));

  // Class Masters see only their designated class stream; Admins see all
  const visibleStreams = isClassMaster
    ? allStreams.filter((s) => s.class_master_id === context?.user?.id || assignedStreamIds.has(s.id))
    : allStreams;

  const defaultStreamId = params.classStreamId || (visibleStreams[0]?.id ?? undefined);
  const selectedStream = visibleStreams.find((s) => s.id === defaultStreamId) || null;
  const selectedTermNumber = parseInt(params.termNumber || "1", 10);

  const isAuthorized = isAdmin || (selectedStream && (
    selectedStream.class_master_id === context?.user?.id || assignedStreamIds.has(selectedStream.id)
  ));

  const enrolments =
    selectedStream && activeYear && isAuthorized
      ? await getEnrolledStudents(schoolId, activeYear.id, selectedStream.id)
      : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8DFC9]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/dashboard/academics"
              className="text-[#525E4B] hover:text-[#142010] transition-colors"
            >
              Classes &amp; Subjects
            </Link>
            <span className="text-[#E8DFC9]">/</span>
            <span className="font-semibold text-[#2A7C13]">Report Cards</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#142010] tracking-tight">
            Student Report Cards
          </h1>
          <p className="text-xs text-[#525E4B]">
            {isClassMaster
              ? "Choose your class group and term, then open a student's report card."
              : "Choose a class and term, then open a student's report card. Results use marks entered for that term."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-[4px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] text-xs font-bold">
            {activeYear?.name || "Academic year not set"}
          </span>
        </div>
      </div>

      {/* Unassigned Class Master Empty State */}
      {isClassMaster && visibleStreams.length === 0 && (
        <div className="p-6 rounded-[8px] bg-[#FFF8CF] border border-[#FBE6C2] space-y-3">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
            <div className="text-xs text-[#7A4A00] space-y-1">
              <p className="font-bold text-sm text-[#4A3D00]">You have not been assigned as a Class Master to any class yet.</p>
              <p>
                Your school administrator assigns Class Masters to specific class streams. Once assigned, your class roster and report cards will appear here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Class Stream & Term Controls (Hidden if unassigned class master) */}
      {(!isClassMaster || visibleStreams.length > 0) && (
      <>
      <div className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">
            Choose a Class and Term
          </span>
          <span className="text-xs text-[#525E4B]">
            Class: <strong className="text-[#142010]">{selectedStream?.name || "None selected"}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Stream Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Class
            </label>
            <form method="GET">
              <input type="hidden" name="termNumber" value={selectedTermNumber} />
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

          {/* Term Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              School Term
            </label>
            <form method="GET">
              <input type="hidden" name="classStreamId" value={selectedStream?.id || ""} />
              <AutoSubmitSelect
                name="termNumber"
                defaultValue={selectedTermNumber}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                <option value="1">Term 1 (Tests 1 and 2)</option>
                <option value="2">Term 2 (Tests 3 and 4)</option>
                <option value="3">Term 3 (Tests 5 and 6)</option>
              </AutoSubmitSelect>
            </form>
          </div>
        </div>
      </div>

      {!isAuthorized ? (
        <div className="p-6 rounded-[8px] bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-700 space-y-1">
            <p className="font-bold text-sm">Access Denied</p>
            <p>You can only view report cards for your assigned class groups.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[8px] bg-white border border-[#E8DFC9] p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#2A7C13]" />
              <div>
                <p className="text-sm font-bold text-[#142010]">
                  <strong>{enrolments.length}</strong> students enrolled in {selectedStream?.name}
                </p>
                <p className="text-xs text-[#525E4B]">
                  Term {selectedTermNumber} evaluation results &amp; competence appreciations
                </p>
              </div>
            </div>

            {enrolments.length > 0 && selectedStream && (
              <Link
                href={`/dashboard/academics/report-cards/bulk?classStreamId=${selectedStream.id}&termNumber=${selectedTermNumber}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                title="Print all report cards or export as one combined PDF file"
              >
                <Printer className="w-4 h-4" />
                <span>Export Class Batch (Single PDF)</span>
              </Link>
            )}
          </div>

          {/* Student Roster & Report Card Links */}
          <div className="bg-white rounded-[8px] border border-[#E8DFC9] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#E8DFC9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2A7C13]" />
                <h2 className="font-bold text-sm text-[#142010]">
                  Students in {selectedStream?.name || "Class"}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#525E4B]">
                  {enrolments.length} students
                </span>
                {enrolments.length > 0 && selectedStream && (
                  <Link
                    href={`/dashboard/academics/report-cards/bulk?classStreamId=${selectedStream.id}&termNumber=${selectedTermNumber}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#F5F5F0] hover:bg-[#EAEAE5] text-[#191919] border border-[#D5D5CF] font-semibold text-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#2A7C13]" />
                    <span>Print All</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E8DFC9] bg-[#FFFDF5] text-[#525E4B] font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Admission No.</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3 text-center">Gender</th>
                    <th className="py-2.5 px-3 text-right">Report Card</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EFE0]">
                  {enrolments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#777777]">
                        {selectedStream
                          ? "No students are enrolled in this class yet. Admit students before preparing report cards."
                          : "Set up classes and streams before preparing report cards."}
                      </td>
                    </tr>
                  ) : (
                    enrolments.map((e) => (
                      <tr key={e.id} className="hover:bg-[#FFFDF5] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#142010]">
                          {e.student?.matricule}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#142010]">
                          {e.student?.last_name} {e.student?.first_name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-[#525E4B]">
                          {e.student?.gender}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/dashboard/academics/report-cards/${e.student_id}?termNumber=${selectedTermNumber}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs transition-colors shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>View Report Card</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      </>
      )}
    </div>
  );
}
