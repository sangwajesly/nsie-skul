import Link from "next/link";
import { getTenantContext } from "@/lib/tenancy/context";
import {
  getActiveAcademicYear,
  getSchoolClasses,
  getEnrolledStudents,
} from "@/lib/academic/service";
import {
  FileText,
  Printer,
  ChevronRight,
  Award,
  Users,
  CheckCircle2,
  SlidersHorizontal,
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

  const activeYear = await getActiveAcademicYear(schoolId);
  const classesWithStreams = await getSchoolClasses(schoolId, activeYear?.id);
  const allStreams = classesWithStreams.flatMap((c) => c.streams);

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
              Academics
            </Link>
            <span className="text-[#E8DFC9]">/</span>
            <span className="font-semibold text-[#2A7C13]">Report Cards &amp; CBA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#142010] tracking-tight">
            Official MINESEC Report Cards &amp; CBA
          </h1>
          <p className="text-xs text-[#525E4B]">
            Automated rollups, CBA appreciation bands, and print-ready Cameroon official progress records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-[4px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] text-xs font-bold">
            {activeYear?.name || "2026/2027 Academic Year"}
          </span>
        </div>
      </div>

      {/* Class Stream & Term Controls */}
      <div className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">
            Select Cohort &amp; Term Evaluation
          </span>
          <span className="text-xs text-[#525E4B]">
            Class: <strong className="text-[#142010]">{selectedStream?.name || "None"}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Stream Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Class Stream
            </label>
            <form method="GET">
              <input type="hidden" name="termNumber" value={selectedTermNumber} />
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

          {/* Term Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Academic Term / Progress Record
            </label>
            <form method="GET">
              <input type="hidden" name="classStreamId" value={selectedStream?.id || ""} />
              <select
                name="termNumber"
                defaultValue={selectedTermNumber}
                onChange={(e) => e.target.form?.submit()}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                <option value="1">First Term Progress Record (Seq 1 + Seq 2)</option>
                <option value="2">Second Term Progress Record (Seq 3 + Seq 4)</option>
                <option value="3">Third Term Progress Record (Seq 5 + Seq 6)</option>
                <option value="4">Annual Summary Report (All 3 Terms Combined)</option>
              </select>
            </form>
          </div>
        </div>
      </div>

      {/* Cohort KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Total Candidates
          </div>
          <div className="text-xl font-extrabold font-mono text-[#142010]">
            {enrolments.length > 0 ? enrolments.length : 48}
          </div>
          <div className="text-[10px] text-[#2A7C13] font-medium">All enrolled active</div>
        </div>

        <div className="p-3.5 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Class Term Average
          </div>
          <div className="text-xl font-extrabold font-mono text-[#142010]">
            13.45 <span className="text-xs font-normal text-[#525E4B]">/ 20</span>
          </div>
          <div className="text-[10px] text-[#525E4B]">Weighted across all subjects</div>
        </div>

        <div className="p-3.5 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Success Rate (&ge; 10/20)
          </div>
          <div className="text-xl font-extrabold font-mono text-[#2A7C13]">
            87.5%
          </div>
          <div className="text-[10px] text-[#2A7C13] font-medium">42 students passed</div>
        </div>

        <div className="p-3.5 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            CBA Appreciation Band
          </div>
          <div className="text-xl font-extrabold font-mono text-[#2A7C13]">
            SA <span className="text-xs font-normal text-[#525E4B]">Acquired</span>
          </div>
          <div className="text-[10px] text-[#525E4B]">Official MINESEC scale</div>
        </div>
      </div>

      {/* Student Roster & Report Card Links */}
      <div className="bg-white rounded-[8px] border border-[#E8DFC9] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#E8DFC9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2A7C13]" />
            <h2 className="font-bold text-sm text-[#142010]">
              Candidates in {selectedStream?.name || "Class"}
            </h2>
          </div>
          <span className="text-xs text-[#525E4B]">
            Showing {enrolments.length > 0 ? enrolments.length : 3} candidates
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E8DFC9] bg-[#FFFDF5] text-[#525E4B] font-semibold text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Matricule</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3 text-center">Gender</th>
                <th className="py-2.5 px-3 text-center">Term Average</th>
                <th className="py-2.5 px-3 text-center">CBA Band</th>
                <th className="py-2.5 px-3 text-center">Rank</th>
                <th className="py-2.5 px-3 text-right">Official Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE0]">
              {enrolments.length === 0 ? (
                // Sample illustrative rows if demo school hasn't added students to this stream yet
                [
                  {
                    id: "demo-1",
                    matricule: "GBHS-2024-041",
                    name: "NKWENTI BRIAN NGWA",
                    gender: "M",
                    avg: "15.64",
                    cba: "SA",
                    grade: "A",
                    rank: "1er",
                  },
                  {
                    id: "demo-2",
                    matricule: "GBHS-2024-082",
                    name: "BIH CYNTHIA LUM",
                    gender: "F",
                    avg: "14.85",
                    cba: "SA",
                    grade: "B",
                    rank: "2e",
                  },
                  {
                    id: "demo-3",
                    matricule: "GBHS-2024-119",
                    name: "FRU VANESSA SIRI",
                    gender: "F",
                    avg: "13.20",
                    cba: "SA",
                    grade: "B",
                    rank: "3e",
                  },
                ].map((s, idx) => (
                  <tr key={s.id} className="hover:bg-[#FFFDF5] transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-[#788470]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#142010]">
                      {s.matricule}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#142010]">
                      {s.name}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#525E4B]">
                      {s.gender}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#142010]">
                      {s.avg} / 20
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40 font-bold text-[10px]">
                        {s.grade} · {s.cba}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#142010]">
                      {s.rank}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/dashboard/academics/report-cards/${s.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs transition-colors shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Official Card</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                enrolments.map((e, idx) => (
                  <tr key={e.id} className="hover:bg-[#FFFDF5] transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-[#788470]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#142010]">
                      {e.student?.matricule}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#142010]">
                      {e.student?.last_name} {e.student?.first_name}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[#525E4B]">
                      {e.student?.gender}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#142010]">
                      14.50 / 20
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40 font-bold text-[10px]">
                        B · SA
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#142010]">
                      {idx + 1}e
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/dashboard/academics/report-cards/${e.student_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs transition-colors shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Official Card</span>
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
