import { getTenantContext } from "@/lib/tenancy/context";
import {
  getSchoolDepartments,
  getSchoolSubjects,
  getSchoolClasses,
  getActiveAcademicYear,
  getSchoolHodAssignments,
  getSchoolTeacherAssignments,
  getSchoolClassSubjects,
} from "@/lib/academic/service";
import { getSchoolStaffMemberships } from "@/lib/admin/service";
import {
  Building2,
  BookOpen,
  Award,
  Layers,
} from "lucide-react";
import HodAssignmentForm from "./HodAssignmentForm";
import TeacherAssignmentForm from "./TeacherAssignmentForm";
import { ClassMasterSelectClient } from "./ClassMasterSelectClient";
import { ClassStreamCoefficientsModal } from "./ClassStreamCoefficientsModal";
import { DepartmentListItem } from "./DepartmentListItem";
import { ClassCardItem } from "./ClassCardItem";
import {
  DepartmentCreateForm,
  SubjectCreateForm,
  ClassCreateForm,
  ClassStreamCreateForm,
} from "./AcademicSetupForms";

export default async function AcademicsPage() {
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";

  // Concurrent data fetching to eliminate sequential waterfalls
  const [activeYear, departments, subjects, classSubjects, staff] = await Promise.all([
    getActiveAcademicYear(schoolId),
    getSchoolDepartments(schoolId),
    getSchoolSubjects(schoolId),
    getSchoolClassSubjects(schoolId),
    getSchoolStaffMemberships(schoolId),
  ]);

  const [classesWithStreams, hodAssignments, teacherAssignments] = await Promise.all([
    getSchoolClasses(schoolId, activeYear?.id),
    activeYear ? getSchoolHodAssignments(schoolId, activeYear.id) : Promise.resolve([]),
    activeYear ? getSchoolTeacherAssignments(schoolId, activeYear.id) : Promise.resolve([]),
  ]);

  const teachingStaff = staff
    .filter(
      (member) =>
        member.status === "active" &&
        ["teacher", "class_master", "hod", "school_admin", "principal"].includes(member.role?.code || "")
    )
    .map((member) => ({
      id: member.user_id,
      name: member.user?.full_name || "Staff member",
      email: member.user?.email || "",
    }));

  const headsOfDepartment = teachingStaff;
  const teachers = teachingStaff;
  const classGroups = classesWithStreams.flatMap((classItem) =>
    classItem.streams.map((stream) => ({ id: stream.id, name: stream.name }))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E5E5DF]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#191919] tracking-tight">
            Classes, Subjects &amp; Departments
          </h1>
          <p className="text-[13px] text-[#666666] mt-0.5">
            Set up the classes students join, the subjects they study, and the departments that group those subjects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-[11px] font-semibold rounded-[4px] bg-[#F1F1ED] text-[#555555] border border-[#E0E0DB]">
            Academic year: {activeYear?.name || "Not set"}
          </span>
        </div>
      </div>

      {context?.hasPermission("assignments.manage") && (
        <section className="space-y-4 rounded-[8px] border border-[#E5E5DF] bg-white p-5">
          <div>
            <h2 className="text-sm font-bold text-[#191919]">Assign Teachers to Classes and Subjects</h2>
            <p className="mt-1 text-xs text-[#666666]">
              Choose who teaches each subject in a class group. One teacher is assigned to each subject in each group.
            </p>
          </div>
          <TeacherAssignmentForm
            academicYearId={activeYear?.id || ""}
            teachers={teachers}
            classGroups={classGroups}
            subjects={subjects.map(({ id, name }) => ({ id, name }))}
          />

          {teacherAssignments.length > 0 && (
            <div className="pt-3 border-t border-[#EEEEEC] space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                Active Subject Teacher Assignments ({teacherAssignments.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                {teacherAssignments.map((ta) => (
                  <div
                    key={ta.id}
                    className="p-2.5 rounded-[5px] border border-[#EAEAE6] bg-[#FAFAF8] flex flex-col justify-between text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#191919]">{ta.class_stream?.name || "Class Group"}</span>
                      <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EAEAE6] text-[#555555] font-mono text-[10px]">
                        {ta.subject?.code}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-[#666666]">{ta.subject?.name}</span>
                      <span className="font-medium text-[#1F5C0E]">{ta.teacher?.full_name || "Teacher"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Grid of Sections: Departments & Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Departments */}
        <div className="bg-white p-5 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#EEEEEC]">
            <Building2 className="w-4 h-4 text-[#555555]" />
            <div>
              <h2 className="text-[14px] font-bold text-[#191919]">Departments &amp; Heads</h2>
              <p className="text-[11px] text-[#777777]">Group related subjects and assign a department head.</p>
            </div>
          </div>

          {/* Create Department Form */}
          <DepartmentCreateForm />

          {context?.hasPermission("school.settings.manage") && (
            <div className="space-y-2.5 rounded-[6px] border border-[#E5E5DF] bg-[#FAFAF8] p-3.5">
              <div>
                <h3 className="text-xs font-bold text-[#191919]">Assign a Head of Department</h3>
                <p className="mt-0.5 text-[11px] text-[#777777]">
                  The staff member must already have the Head of Department role.
                </p>
              </div>
              <HodAssignmentForm
                academicYearId={activeYear?.id || ""}
                departments={departments.map(({ id, name }) => ({ id, name }))}
                headsOfDepartment={headsOfDepartment}
              />
            </div>
          )}

          {/* Departments List */}
          <div className="space-y-2 text-[12px]">
            {departments.length === 0 ? (
              <div className="text-center py-6 text-[12px] text-[#888888]">
                No departments configured yet (e.g., Science, Arts, Commercial, Technical).
              </div>
            ) : (
              departments.map((dept) => {
                const assignedHod = hodAssignments.find(
                  (assignment) =>
                    assignment.department_id === dept.id &&
                    assignment.scope_type === "department"
                );
                return (
                  <DepartmentListItem
                    key={dept.id}
                    dept={dept}
                    hodName={assignedHod?.hod_user?.full_name || null}
                    canManage={Boolean(context?.hasPermission("academics.manage"))}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Section 2: Subjects Catalog */}
        <div className="bg-white p-5 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#EEEEEC]">
            <BookOpen className="w-4 h-4 text-[#555555]" />
            <div>
              <h2 className="text-[14px] font-bold text-[#191919]">Subjects</h2>
              <p className="text-[11px] text-[#777777]">Set each subject&apos;s department, mark weight and maximum mark.</p>
            </div>
          </div>

          {/* Create Subject Form */}
          <SubjectCreateForm departments={departments.map(({ id, name }) => ({ id, name }))} />

          {/* Subjects List */}
          <div className="space-y-1.5 max-h-80 overflow-y-auto text-[12px] pr-1">
            {subjects.length === 0 ? (
              <div className="text-center py-6 text-[12px] text-[#888888]">
                No subjects registered yet.
              </div>
            ) : (
              subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="p-2.5 rounded-[5px] border border-[#EAEAE6] bg-[#FAFAF8] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#191919]">{sub.name}</span>
                    <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EAEAE6] text-[#555555] font-mono text-[10px]">
                      {sub.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#666666]">
                    <span>Weight: <strong className="font-mono text-[#191919]">{sub.default_coefficient}</strong></span>
                    <span>Max mark: <strong className="font-mono text-[#191919]">/{sub.default_max_marks}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Classes & Class Groups */}
      <div className="bg-white p-5 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#EEEEEC]">
          <Layers className="w-4 h-4 text-[#555555]" />
          <div>
            <h2 className="text-[14px] font-bold text-[#191919]">Classes &amp; Class Groups</h2>
            <p className="text-[11px] text-[#777777]">Create class levels (e.g. Form 1, Lower Sixth) and class groups (e.g. Form 1 General, Form 1 Technical, Form 5 Science) for this school year.</p>
          </div>
        </div>

        {/* Add Class Form */}
        {context?.hasPermission("academics.manage") && <ClassCreateForm />}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {classesWithStreams.length === 0 ? (
            <div className="col-span-full text-center py-6 text-[12px] text-[#888888]">
              No classes are available yet. Use the form above to add your first class level.
            </div>
          ) : (
            classesWithStreams.map((cls) => (
              <ClassCardItem
                key={cls.id}
                cls={cls}
                academicYearId={activeYear?.id || ""}
                teachers={teachers}
                subjects={subjects}
                classSubjects={classSubjects}
                canManageAcademics={Boolean(context?.hasPermission("academics.manage"))}
                canManageAssignments={Boolean(context?.hasPermission("assignments.manage"))}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
