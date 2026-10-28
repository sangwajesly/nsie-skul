import { getTenantContext } from "@/lib/tenancy/context";
import {
  getEnrolledStudents,
  getActiveAcademicYear,
  getSchoolClasses,
  getSchoolTeacherAssignments,
  generateNextStudentMatricule,
} from "@/lib/academic/service";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { StudentDirectoryClient } from "./StudentDirectoryClient";
import { StudentAdmissionForm } from "./StudentAdmissionForm";
import {
  Users,
  BookOpen,
  Filter,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface StudentsPageProps {
  searchParams?: Promise<{
    classStreamId?: string;
    status?: string;
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
  const suggestedMatricule = canManageStudents && activeYear
    ? await generateNextStudentMatricule(schoolId, activeYear.id)
    : "";
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
  const statusFilter = params?.status || "active";

  // Query enrolled students scoped to authorized streams
  let enrolledStudents: Awaited<ReturnType<typeof getEnrolledStudents>> = [];
  if (isTeacher) {
    if (assignedStreamIds.length > 0) {
      if (selectedStreamId && assignedStreamIds.includes(selectedStreamId)) {
        enrolledStudents = await getEnrolledStudents(schoolId, activeYear?.id || "", selectedStreamId, undefined, undefined, "active");
      } else {
        enrolledStudents = await getEnrolledStudents(schoolId, activeYear?.id || "", undefined, assignedStreamIds, undefined, "active");
      }
    } else {
      enrolledStudents = [];
    }
  } else {
    enrolledStudents = await getEnrolledStudents(
      schoolId,
      activeYear?.id || "",
      selectedStreamId || undefined,
      undefined,
      undefined,
      statusFilter
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

      {/* Main Container: Stacked Full-Width Student Registration & Directory */}
      {(!isTeacher || teacherAssignments.length > 0) && (
        <div className="space-y-6">
          {/* 1. Admit Student (Full Horizontal Width, Admins only) */}
          {canManageStudents && (
            <StudentAdmissionForm
              academicYearId={activeYear?.id || ""}
              academicYearName={activeYear?.name || "Active Year"}
              streams={allStreams}
              suggestedMatricule={suggestedMatricule}
            />
          )}

          {/* 2. Directory Section (Full Horizontal Width, Placed Underneath) */}
          <div className="w-full bg-white p-5 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-4">
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

            {/* Student Table — delegated to client component for search, status filtering, editing, and status management */}
            <StudentDirectoryClient
              enrolledStudents={enrolledStudents}
              canManageStudents={canManageStudents}
              isTeacher={isTeacher}
              selectedStreamId={selectedStreamId}
              currentStatusFilter={statusFilter}
              streams={allStreams}
              academicYearId={activeYear?.id || ""}
            />
          </div>
        </div>
      )}
    </div>
  );
}
