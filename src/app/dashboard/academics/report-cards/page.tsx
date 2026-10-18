import Link from "next/link";
import { getTenantContext } from "@/lib/tenancy/context";
import {
  getActiveAcademicYear,
  getSchoolClasses,
  getEnrolledStudents,
} from "@/lib/academic/service";
import {
  Printer,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ReportCardsHubProps {
  searchParams: Promise<{
    classStreamId?: string;
    termNumber?: string;
    template?: string;
  }>;
}

export default async function ReportCardsHubPage({
  searchParams,
}: ReportCardsHubProps) {
  const params = await searchParams;
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";

  const activeYear = await getActiveAcademicYear(schoolId);
  const classesWithStreams = await getSchoolClasses(schoolId, activeYear?.id);
  const allStreams = classesWithStreams.flatMap((c) => c.streams);

  const selectedTemplate = params.template || "minesec-cba";
  const selectedStream =
    allStreams.find((s) => s.id === params.classStreamId) || allStreams[0] || null;
  const selectedTermNumber = parseInt(params.termNumber || "1", 10);

  const enrolments =
    selectedStream && activeYear
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
            Choose a class and term, then open a student&apos;s report card. Results use marks entered for that term.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-[4px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] text-xs font-bold">
            {activeYear?.name || "Academic year not set"}
          </span>
        </div>
      </div>

      {/* Class Stream & Term Controls */}
      <div className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">
            Choose a Class, Term and Template
          </span>
          <span className="text-xs text-[#525E4B]">
              Class: <strong className="text-[#142010]">{selectedStream?.name || "None selected"}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Stream Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Class
            </label>
            <form method="GET" className="flex gap-2">
              <input type="hidden" name="termNumber" value={selectedTermNumber} />
              <input type="hidden" name="template" value={selectedTemplate} />
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

          {/* Term Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              School Term
            </label>
            <form method="GET" className="flex gap-2">
              <input type="hidden" name="classStreamId" value={selectedStream?.id || ""} />
              <input type="hidden" name="template" value={selectedTemplate} />
              <select
                name="termNumber"
                defaultValue={selectedTermNumber}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                <option value="1">Term 1 (Tests 1 and 2)</option>
                <option value="2">Term 2 (Tests 3 and 4)</option>
                <option value="3">Term 3 (Tests 5 and 6)</option>
              </select>
              <button type="submit" className="px-2.5 py-1.5 rounded-[5px] bg-[#2A7C13] text-white text-[10px] font-semibold">Apply</button>
            </form>
          </div>

          {/* Template Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Template
            </label>
            <form method="GET" className="flex gap-2">
              <input type="hidden" name="classStreamId" value={selectedStream?.id || ""} />
              <input type="hidden" name="termNumber" value={selectedTermNumber} />
              <select
                name="template"
                defaultValue={selectedTemplate}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                <option value="minesec-cba">MINESEC CBA Official</option>
              </select>
              <button type="submit" className="px-2.5 py-1.5 rounded-[5px] bg-[#2A7C13] text-white text-[10px] font-semibold">Apply</button>
            </form>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-[8px] bg-white border border-[#E8DFC9] p-4">
        <Users className="w-4 h-4 text-[#2A7C13]" />
        <p className="text-sm text-[#142010]">
          <strong>{enrolments.length}</strong> students in this class
        </p>
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
          <span className="text-xs text-[#525E4B]">
            {enrolments.length} students
          </span>
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
    </div>
  );
}
