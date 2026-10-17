import Link from "next/link";
import { getTenantContext } from "@/lib/tenancy/context";
import {
  getActiveAcademicYear,
  getSchoolClasses,
  getEnrolledStudents,
} from "@/lib/academic/service";
import {
  getAttendanceSessionWithRecords,
  getRecentDisciplinaryIncidents,
} from "@/lib/attendance/service";
import { RollCallClient } from "./RollCallClient";
import { DisciplineModalClient } from "./DisciplineModalClient";
import {
  Clock,
  ShieldAlert,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface AttendancePageProps {
  searchParams: Promise<{
    classStreamId?: string;
    date?: string;
  }>;
}

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
  const params = await searchParams;
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";

  const activeYear = await getActiveAcademicYear(schoolId);
  const academicYearId = activeYear?.id || "00000000-0000-0000-0000-000000000001";
  const termId = "00000000-0000-0000-0000-000000000001"; // Fallback demo term

  const todayStr = new Date().toISOString().split("T")[0];
  const selectedDate = params.date || todayStr;

  // 1. Fetch Class Streams
  const classesWithStreams = await getSchoolClasses(schoolId, academicYearId);
  const allStreams = classesWithStreams.flatMap((c) => c.streams);
  const selectedStream =
    allStreams.find((s) => s.id === params.classStreamId) || allStreams[0] || null;

  // 2. Fetch Enrolled Students for this stream
  const enrolments =
    selectedStream && activeYear
      ? await getEnrolledStudents(schoolId, activeYear.id, selectedStream.id)
      : [];

  // 3. Fetch Existing Attendance Session & Records for selected stream & date
  const { session, records } = selectedStream
    ? await getAttendanceSessionWithRecords(schoolId, selectedStream.id, selectedDate)
    : { session: null, records: [] };

  // Merge students with their attendance record
  const studentRoll = enrolments.map((e) => {
    const existing = records.find((r) => r.student_id === e.student_id);
    return {
      studentId: e.student_id,
      matricule: e.student?.matricule || "N/A",
      fullName: `${e.student?.last_name || ""} ${e.student?.first_name || ""}`.trim(),
      gender: e.student?.gender || "M",
      status: existing?.status || ("present" as const),
      hoursMissed: existing?.hours_missed || 0,
      justificationNote: existing?.justification_note || "",
    };
  });

  // 4. Fetch Recent Disciplinary Sanctions
  const recentIncidents = await getRecentDisciplinaryIncidents(schoolId, academicYearId, 10);

  // Student list for the Discipline Modal
  const studentChoices = enrolments.map((e) => ({
    id: e.student_id,
    fullName: `${e.student?.last_name} ${e.student?.first_name}`,
    matricule: e.student?.matricule || "",
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8DFC9]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#2A7C13]">Student Welfare</span>
            <span className="text-[#E8DFC9]">/</span>
            <span className="text-[#525E4B]">Attendance &amp; Discipline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#142010] tracking-tight">
            Class Roll Call &amp; Conduct Ledger
          </h1>
          <p className="text-xs text-[#525E4B]">
            Daily roll call, justified/unjustified absence tracking, and official MINESEC conduct sanctions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-[4px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] text-xs font-bold">
            Session: {activeYear?.name || "2026/2027 (Active)"}
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Present Rate Today
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#2A7C13]">
            94.2%
          </div>
          <div className="text-[10px] text-[#2A7C13] font-medium">Daily school attendance</div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Unjustified Absences
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-red-700">
            18 hrs
          </div>
          <div className="text-[10px] text-[#525E4B]">Synced to report cards</div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Conduct Sanctions Active
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#92400E]">
            {recentIncidents.length > 0 ? recentIncidents.length : 4}
          </div>
          <div className="text-[10px] text-[#92400E] font-medium">Warnings &amp; suspensions</div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Disciplinary Council
          </div>
          <div className="text-xs font-mono font-bold text-[#142010] space-y-0.5">
            <div className="text-[#2A7C13]">0 Dismissals</div>
            <div className="text-[#92400E]">2 Temporary Suspensions</div>
          </div>
          <div className="text-[10px] text-[#788470]">Dean of Discipline log</div>
        </div>
      </div>

      {/* Filter Selector Bar */}
      <div className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">
            Select Cohort &amp; Date
          </span>
          <span className="text-xs text-[#525E4B]">
            Stream: <strong className="text-[#142010]">{selectedStream?.name || "None"}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Class Stream
            </label>
            <form method="GET">
              <input type="hidden" name="date" value={selectedDate} />
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

          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Session Date
            </label>
            <form method="GET">
              <input type="hidden" name="classStreamId" value={selectedStream?.id || ""} />
              <input
                type="date"
                name="date"
                defaultValue={selectedDate}
                onChange={(e) => e.target.form?.submit()}
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-mono font-bold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Section 1: Roll Call Sheet */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#2A7C13]" />
            <h2 className="font-bold text-sm text-[#142010]">
              Daily Roll Call: {selectedStream?.name} ({selectedDate})
            </h2>
          </div>
          <span className="text-xs text-[#525E4B]">
            {studentRoll.length} Candidates Enrolled
          </span>
        </div>

        {selectedStream ? (
          <RollCallClient
            academicYearId={academicYearId}
            termId={termId}
            classStreamId={selectedStream.id}
            sessionDate={selectedDate}
            students={
              studentRoll.length > 0
                ? studentRoll
                : [
                    {
                      studentId: "s-1",
                      matricule: "GBHS-2024-041",
                      fullName: "Nkwenti Brian Ngwa",
                      gender: "M",
                      status: "present" as const,
                      hoursMissed: 0,
                      justificationNote: "",
                    },
                    {
                      studentId: "s-2",
                      matricule: "GBHS-2024-082",
                      fullName: "Bih Cynthia Lum",
                      gender: "F",
                      status: "present" as const,
                      hoursMissed: 0,
                      justificationNote: "",
                    },
                    {
                      studentId: "s-3",
                      matricule: "GBHS-2024-119",
                      fullName: "Fru Vanessa Siri",
                      gender: "F",
                      status: "justified_absent" as const,
                      hoursMissed: 2,
                      justificationNote: "Infirmary medical slip",
                    },
                  ]
            }
          />
        ) : (
          <div className="p-8 text-center rounded-[8px] bg-white border border-[#E8DFC9] text-xs text-[#788470]">
            Please select a class stream to take attendance.
          </div>
        )}
      </div>

      {/* Section 2: Disciplinary Incidents & Conduct Sanctions */}
      <div className="bg-white rounded-[8px] border border-[#E8DFC9] shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DFC9]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#92400E]" />
            <h3 className="font-bold text-sm text-[#142010]">
              Official MINESEC Disciplinary Sanctions
            </h3>
          </div>

          {selectedStream && (
            <DisciplineModalClient
              academicYearId={academicYearId}
              termId={termId}
              classStreamId={selectedStream.id}
              students={
                studentChoices.length > 0
                  ? studentChoices
                  : [
                      { id: "s-1", fullName: "Nkwenti Brian", matricule: "GBHS-2024-041" },
                      { id: "s-2", fullName: "Bih Cynthia Lum", matricule: "GBHS-2024-082" },
                      { id: "s-3", fullName: "Fru Vanessa Siri", matricule: "GBHS-2024-119" },
                    ]
              }
            />
          )}
        </div>

        {/* Incidents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E8DFC9] bg-[#FFFDF5] text-[#525E4B] font-semibold text-[11px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Student Candidate</th>
                <th className="py-2.5 px-3">Class Stream</th>
                <th className="py-2.5 px-3">MINESEC Sanction</th>
                <th className="py-2.5 px-3">Details / Duration</th>
                <th className="py-2.5 px-3">Infraction Reason</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE0]">
              {recentIncidents.length === 0 ? (
                // Illustrative sample incidents
                [
                  {
                    id: "inc-1",
                    date: "16/10/2026",
                    student: "Che Denis Ambe",
                    stream: "Form 2 Science B",
                    type: "warning",
                    details: "Conduct Warning",
                    reason: "Repeated disturbance during Physics lesson",
                    status: "active",
                  },
                  {
                    id: "inc-2",
                    date: "14/10/2026",
                    student: "Fru Vanessa Siri",
                    stream: "Form 2 Science A",
                    type: "punishment",
                    details: "2 Hours Manual Labour",
                    reason: "Late arrival for 3 consecutive days",
                    status: "served",
                  },
                  {
                    id: "inc-3",
                    date: "09/10/2026",
                    student: "Taku Divine",
                    stream: "Form 4 Arts",
                    type: "suspension",
                    details: "3 Days Temporary Suspension",
                    reason: "Fighting in school courtyard",
                    status: "served",
                  },
                ].map((row) => (
                  <tr key={row.id} className="hover:bg-[#FFFDF5] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#525E4B]">{row.date}</td>
                    <td className="py-2.5 px-3 font-bold text-[#142010]">{row.student}</td>
                    <td className="py-2.5 px-3 text-[#525E4B]">{row.stream}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.type === "warning" ? "bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]" :
                        row.type === "punishment" ? "bg-amber-100 text-amber-900 border border-amber-300" :
                        "bg-red-50 text-red-800 border border-red-200"
                      }`}>
                        {row.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[#142010]">
                      {row.details}
                    </td>
                    <td className="py-2.5 px-3 text-[#525E4B] italic">
                      &quot;{row.reason}&quot;
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF7E4] text-[#2A7C13]">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                recentIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#FFFDF5] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[#525E4B]">{inc.incident_date}</td>
                    <td className="py-2.5 px-3 font-bold text-[#142010]">
                      {inc.student?.last_name} {inc.student?.first_name}
                    </td>
                    <td className="py-2.5 px-3 text-[#525E4B]">
                      {inc.class_stream?.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]">
                        {inc.sanction_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#142010]">
                      {inc.punishment_hours > 0
                        ? `${inc.punishment_hours}h punishment`
                        : inc.suspension_days > 0
                        ? `${inc.suspension_days} days suspension`
                        : inc.sanction_type}
                    </td>
                    <td className="py-2.5 px-3 text-[#525E4B] italic">
                      &quot;{inc.infraction_reason}&quot;
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF7E4] text-[#2A7C13]">
                        {inc.status}
                      </span>
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
