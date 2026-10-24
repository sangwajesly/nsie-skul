import { getTenantContext } from "@/lib/tenancy/context";
import { AutoSubmitSelect, AutoSubmitDateInput } from "@/components/AutoSubmitSelect";
import {
  getActiveAcademicYear,
  getSchoolClasses,
  getEnrolledStudents,
  getSchoolSequences,
  getSchoolTeacherAssignments,
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
  const roleCode = context?.role?.code || "teacher";
  const isTeacher = roleCode === "teacher" || roleCode === "class_master";

  const activeYear = await getActiveAcademicYear(schoolId);
  const academicYearId = activeYear?.id || "00000000-0000-0000-0000-000000000001";
  
  const [sequences, classesWithStreams, teacherAssignments] = await Promise.all([
    getSchoolSequences(schoolId),
    getSchoolClasses(schoolId, academicYearId),
    isTeacher && activeYear && context?.user?.id
      ? getSchoolTeacherAssignments(schoolId, activeYear.id, context.user.id)
      : Promise.resolve([]),
  ]);

  const activeSequence = sequences.find((s) => s.is_open_for_marks) || sequences[0] || null;
  const termId = activeSequence?.term_id || "00000000-0000-0000-0000-000000000001";

  const todayStr = new Date().toISOString().split("T")[0];
  const selectedDate = params.date || todayStr;

  // 1. Fetch Class Streams
  const allStreams = classesWithStreams.flatMap((c) => c.streams);
  const assignedStreamIds = new Set(teacherAssignments.map((a) => a.class_stream_id));

  // For teachers: only show assigned streams; for admins: show all
  const visibleStreams = isTeacher && teacherAssignments.length > 0
    ? allStreams.filter((s) => assignedStreamIds.has(s.id))
    : allStreams;

  const defaultStreamId =
    params.classStreamId ||
    (isTeacher && teacherAssignments.length > 0 ? teacherAssignments[0].class_stream_id : undefined);

  const selectedStream =
    visibleStreams.find((s) => s.id === defaultStreamId) || visibleStreams[0] || null;

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

  const hasAttendance = Boolean(session && records.length > 0);
  const presentCount = hasAttendance
    ? records.filter((record) => record.status === "present").length
    : null;
  const presentRate =
    presentCount !== null
      ? Math.round((presentCount / records.length) * 100)
      : null;
  const unexplainedHours = hasAttendance
    ? records.reduce(
        (total, student) =>
          total +
          (student.status === "unjustified_absent" ? student.hours_missed : 0),
        0
      )
    : null;

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
            Record who is present, note absences, and review recent conduct records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-[4px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] text-xs font-bold">
            Academic year: {activeYear?.name || "Not set"}
          </span>
        </div>
      </div>

      {/* Unassigned Teacher Empty State */}
      {isTeacher && teacherAssignments.length === 0 && (
        <div className="p-6 rounded-[8px] bg-[#FFF8CF] border border-[#FBE6C2] space-y-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
            <div className="text-xs text-[#7A4A00] space-y-1">
              <p className="font-bold text-sm text-[#4A3D00]">You have not been assigned to any classes yet.</p>
              <p>
                Your school administrator assigns teachers to their classes.
                Once assigned, your classes will appear here for roll call.
              </p>
              <p className="text-[11px] text-[#92400E]">
                If you believe this is an error, please contact your school administrator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid — hidden for unassigned teachers */}
      {(!isTeacher || teacherAssignments.length > 0) && (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Present in This Class
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#2A7C13]">
            {presentRate === null ? "Not recorded" : `${presentRate}%`}
          </div>
          <div className="text-[10px] text-[#2A7C13] font-medium">
            {presentCount === null
              ? "Save roll call to see the rate"
              : `${presentCount} of ${records.length} students marked · ${selectedDate}`}
          </div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Unexplained Missed Hours
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-red-700">
            {unexplainedHours === null ? "Not recorded" : `${unexplainedHours} hrs`}
          </div>
          <div className="text-[10px] text-[#525E4B]">
            {hasAttendance ? "For this class and date" : "Save roll call to see the total"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Recent Conduct Records
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#92400E]">
            {recentIncidents.length}
          </div>
          <div className="text-[10px] text-[#92400E] font-medium">Latest records across the school</div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Students in This Class
          </div>
          <div className="text-xs font-mono font-bold text-[#142010] space-y-0.5">
            {studentChoices.length}
          </div>
          <div className="text-[10px] text-[#788470]">Enrolled for the selected class</div>
        </div>
      </div>

      {/* Filter Selector Bar */}
      <div className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">
            Choose a Class and Date
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

          <div>
            <label className="block text-[11px] font-medium text-[#525E4B] mb-1">
              Attendance Date
            </label>
            <form method="GET">
              <input type="hidden" name="classStreamId" value={selectedStream?.id || ""} />
              <AutoSubmitDateInput
                name="date"
                defaultValue={selectedDate}
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
            {studentRoll.length} Students
          </span>
        </div>

        {selectedStream && studentRoll.length > 0 ? (
          <RollCallClient
            academicYearId={academicYearId}
            termId={termId}
            classStreamId={selectedStream.id}
            sessionDate={selectedDate}
            students={studentRoll}
          />
        ) : (
          <div className="p-8 text-center rounded-[8px] bg-white border border-[#E8DFC9] text-xs text-[#788470]">
            {selectedStream
              ? "No students are enrolled in this class yet. Admit students before taking attendance."
              : "Set up a class and stream before taking attendance."}
          </div>
        )}
      </div>

      {/* Section 2: Disciplinary Incidents & Conduct Sanctions */}
      <div className="bg-white rounded-[8px] border border-[#E8DFC9] shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DFC9]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#92400E]" />
            <h3 className="font-bold text-sm text-[#142010]">
              Recent Conduct Records
            </h3>
          </div>

          {selectedStream && studentChoices.length > 0 && (
            <DisciplineModalClient
              academicYearId={academicYearId}
              termId={termId}
              classStreamId={selectedStream.id}
              students={studentChoices}
            />
          )}
        </div>

        {selectedStream && studentChoices.length === 0 && (
          <p className="text-xs text-[#777777]">
            Enroll students in this class before recording a conduct issue.
          </p>
        )}

        {/* Incidents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E8DFC9] bg-[#FFFDF5] text-[#525E4B] font-semibold text-[11px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Student</th>
                <th className="py-2.5 px-3">Class Stream</th>
                <th className="py-2.5 px-3">Action Taken</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE0]">
              {recentIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#777777]">
                    No conduct records have been added yet.
                  </td>
                </tr>
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
      </>
      )}
    </div>
  );
}
