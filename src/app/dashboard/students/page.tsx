import { getTenantContext } from "@/lib/tenancy/context";
import {
  getEnrolledStudents,
  getActiveAcademicYear,
  getSchoolClasses,
  getSchoolTeacherAssignments,
} from "@/lib/academic/service";
import { registerStudentAction } from "@/app/academics/actions";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import EmptyState from "@/components/EmptyState";
import {
  Users,
  UserPlus,
  GraduationCap,
  Building,
  Home,
  BookOpen,
  Filter,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface StudentsPageProps {
  searchParams?: Promise<{
    classStreamId?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";
  const canManageStudents = Boolean(context?.hasPermission("students.manage"));
  const canViewAllStudents = Boolean(context?.hasPermission("students.view_all"));
  const isTeacher = !canViewAllStudents;

  const activeYear = await getActiveAcademicYear(schoolId);
  const classesWithStreams = await getSchoolClasses(schoolId, activeYear?.id);

  // Flatten all streams for the dropdown
  const allStreams = classesWithStreams.flatMap((c) => c.streams);

  // For teachers, load their specific assignments
  const teacherAssignments = isTeacher && activeYear && context?.user?.id
    ? await getSchoolTeacherAssignments(schoolId, activeYear.id, context.user.id)
    : [];

  const assignedStreamIds = Array.from(new Set(teacherAssignments.map((a) => a.class_stream_id)));

  // Visible streams in filter dropdown
  const visibleStreams = isTeacher
    ? allStreams.filter((s) => assignedStreamIds.includes(s.id))
    : allStreams;

  const selectedStreamId = params?.classStreamId || "";

  // Query enrolled students scoped to authorized streams
  let enrolledStudents: Awaited<ReturnType<typeof getEnrolledStudents>> = [];
  if (isTeacher) {
    if (assignedStreamIds.length > 0) {
      if (selectedStreamId && assignedStreamIds.includes(selectedStreamId)) {
        enrolledStudents = await getEnrolledStudents(schoolId, activeYear?.id || "", selectedStreamId);
      } else {
        enrolledStudents = await getEnrolledStudents(schoolId, activeYear?.id || "", undefined, assignedStreamIds);
      }
    } else {
      enrolledStudents = [];
    }
  } else {
    enrolledStudents = await getEnrolledStudents(
      schoolId,
      activeYear?.id || "",
      selectedStreamId || undefined
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-5 border-b border-[#E5E5DF]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#191919] tracking-tight">
            {canManageStudents ? "Student Register & Admissions" : "Student Register"}
          </h1>
          <p className="text-[13px] text-[#666666] mt-1 max-w-xl">
            {canManageStudents
              ? "Add a student to the school year and find their class, admission number, and guardian contact here."
              : isTeacher
              ? "View enrolled students and guardian contact details for your assigned class groups."
              : "View enrolled students, their class groups, matricules, and guardian contacts."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-3 py-1.5 text-[12px] font-semibold rounded-[6px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
            {isTeacher
              ? `${enrolledStudents.length} student${enrolledStudents.length === 1 ? "" : "s"} in your classes`
              : `${enrolledStudents.length} enrolled`}
          </span>
        </div>
      </div>

      {/* Unassigned Teacher Empty State */}
      {isTeacher && teacherAssignments.length === 0 && (
        <div className="p-8 rounded-[10px] bg-white border border-[#E5E5DF] text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#FFF8CF] text-[#B45309] flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#191919]">No Classes Assigned Yet</h2>
          <p className="text-xs text-[#666666] max-w-md mx-auto leading-relaxed">
            You have not been assigned to any class groups or subjects yet. Once your school administrator or Head of Department assigns you to your classes, your student roster and guardian contacts will appear here.
          </p>
        </div>
      )}

      {/* Main Grid: Student Registration & List */}
      {(!isTeacher || teacherAssignments.length > 0) && (
      <div className={`grid grid-cols-1 ${canManageStudents ? "lg:grid-cols-3" : "grid-cols-1"} gap-6`}>
        {/* Left Column: Register Student (Admins only) */}
        {canManageStudents && (
        <div className="bg-white p-5 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#EEEEEC]">
            <UserPlus className="w-4 h-4 text-[#555555]" />
            <div>
              <h2 className="text-[14px] font-bold text-[#191919]">Admit Student</h2>
              <p className="text-[11px] text-[#777777]">Register and enroll a student</p>
            </div>
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              await registerStudentAction(formData);
            }}
            className="space-y-3 text-[12px]"
          >
            <input type="hidden" name="academicYearId" value={activeYear?.id || ""} />

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                Class Group *
              </label>
              <select
                name="classStreamId"
                required
                className="w-full px-3 py-1.5 text-[12px] rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
              >
                <option value="">Choose a class group</option>
                {allStreams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                Student Admission Number (Matricule) *
              </label>
              <input
                type="text"
                name="matricule"
                placeholder="e.g. BHS-2026-042"
                required
                className="w-full px-3 py-1.5 text-[12px] font-mono rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="e.g. John"
                  required
                  className="w-full px-3 py-1.5 text-[12px] rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="e.g. Fomban"
                  required
                  className="w-full px-3 py-1.5 text-[12px] rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  Gender *
                </label>
                <select
                  name="gender"
                  required
                  className="w-full px-3 py-1.5 text-[12px] rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  Residence *
                </label>
                <select
                  name="residenceStatus"
                  required
                  className="w-full px-3 py-1.5 text-[12px] rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                >
                  <option value="day">Day Student</option>
                  <option value="boarding">Boarding Student</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                Parent / Guardian Name
              </label>
              <input
                type="text"
                name="guardianName"
                placeholder="e.g. Pa Thomas Fomban"
                className="w-full px-3 py-1.5 text-[12px] rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                Guardian Phone
              </label>
              <input
                type="tel"
                name="guardianPhone"
                placeholder="e.g. 677 12 34 56"
                className="w-full px-3 py-1.5 text-[12px] font-mono rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#191919] hover:bg-[#333333] text-white font-semibold text-[13px] rounded-[5px] transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>
          </form>
        </div>
        )}

        {/* Directory Column */}
        <div className={`${canManageStudents ? "lg:col-span-2" : "col-span-1"} bg-white p-5 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EEEEEC]">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-[#555555]" />
              <div>
                <h2 className="text-[14px] font-bold text-[#191919]">
                  {isTeacher ? "My Class Students" : "Enrolled Students"}
                </h2>
                <p className="text-[11px] text-[#777777]">
                  {isTeacher
                    ? "Students in classes assigned to you"
                    : `Students registered for ${activeYear?.name || "the current school year"}`}
                </p>
              </div>
            </div>

            {/* Class Stream Filter */}
            {visibleStreams.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#888888]" />
                <form method="GET">
                  <AutoSubmitSelect
                    name="classStreamId"
                    defaultValue={selectedStreamId}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-[5px] border border-[#D5D5CF] bg-[#FAFAF8] text-[#191919] focus:outline-none focus:border-[#191919]"
                  >
                    <option value="">
                      {isTeacher ? "All My Assigned Classes" : "All Classes"}
                    </option>
                    {visibleStreams.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </AutoSubmitSelect>
                </form>
              </div>
            )}
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto text-[12px]">
            {enrolledStudents.length === 0 ? (
              canManageStudents ? (
                <EmptyState
                  title="No students yet"
                  description="Add a student to start managing records and attendance."
                  ctaLabel="Admit First Student"
                  ctaHref="/dashboard/students"
                />
              ) : (
                <div className="text-center py-12 space-y-2">
                  <h3 className="text-sm font-semibold text-[#191919]">
                    {isTeacher ? "No students in this class" : "No students yet"}
                  </h3>
                  <p className="text-xs text-[#666666] max-w-sm mx-auto">
                    {isTeacher
                      ? "No students are currently enrolled in this class group."
                      : "No students are enrolled for this academic year yet."}
                  </p>
                </div>
              )
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5DF] text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                    <th className="py-2 px-2.5">Admission No.</th>
                    <th className="py-2 px-2.5">Student Name</th>
                    <th className="py-2 px-2.5">Class Group</th>
                    <th className="py-2 px-2.5">Gender</th>
                    <th className="py-2 px-2.5">Residence</th>
                    <th className="py-2 px-2.5">Guardian Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F1ED] text-[#191919]">
                  {enrolledStudents.map((enrol) => (
                    <tr key={enrol.id} className="hover:bg-[#FAFAF8]">
                      <td className="py-2 px-2.5 font-mono font-bold text-[#191919]">
                        {enrol.student?.matricule}
                      </td>
                      <td className="py-2 px-2.5 font-semibold">
                        {enrol.student?.first_name} {enrol.student?.last_name}
                      </td>
                      <td className="py-2 px-2.5">
                        <span className="px-1.5 py-0.5 rounded-[3px] bg-[#F1F1ED] text-[#555555] font-medium text-[11px]">
                          {enrol.class_stream?.name || "Unassigned"}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-bold text-[#555555]">
                        {enrol.student?.gender}
                      </td>
                      <td className="py-2 px-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase tracking-wider ${
                            enrol.student?.residence_status === "boarding"
                              ? "bg-[#FAF5FF] text-[#7E22CE] border border-[#F3E8FF]"
                              : "bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]"
                          }`}
                        >
                          {enrol.student?.residence_status === "boarding" ? (
                            <Building className="w-3 h-3" />
                          ) : (
                            <Home className="w-3 h-3" />
                          )}
                          <span>{enrol.student?.residence_status}</span>
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-[#666666]">
                        {enrol.student?.guardian_name || "—"}{" "}
                        {enrol.student?.guardian_phone && (
                          <span className="font-mono text-[10px] text-[#888888]">
                            ({enrol.student.guardian_phone})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
