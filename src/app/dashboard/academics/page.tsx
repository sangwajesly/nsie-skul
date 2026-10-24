import { getTenantContext } from "@/lib/tenancy/context";
import {
  getSchoolDepartments,
  getSchoolSubjects,
  getSchoolClasses,
  getActiveAcademicYear,
  getSchoolHodAssignments,
} from "@/lib/academic/service";
import { getSchoolStaffMemberships } from "@/lib/admin/service";
import {
  createDepartmentAction,
  createSubjectAction,
  createClassStreamAction,
} from "@/app/academics/actions";
import {
  Building2,
  BookOpen,
  Plus,
  Award,
  Layers,
} from "lucide-react";
import HodAssignmentForm from "./HodAssignmentForm";
import TeacherAssignmentForm from "./TeacherAssignmentForm";
import { ClassMasterSelectClient } from "./ClassMasterSelectClient";

export default async function AcademicsPage() {
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";

  const activeYear = await getActiveAcademicYear(schoolId);
  const departments = await getSchoolDepartments(schoolId);
  const subjects = await getSchoolSubjects(schoolId);
  const classesWithStreams = await getSchoolClasses(schoolId, activeYear?.id);
  const hodAssignments = activeYear ? await getSchoolHodAssignments(schoolId, activeYear.id) : [];
  const staff = await getSchoolStaffMemberships(schoolId);

  const teachingStaff = staff
    .filter(
      (member) =>
        member.status === "active" &&
        ["teacher", "class_master", "hod"].includes(member.role?.code || "")
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
        <section className="space-y-3 rounded-[8px] border border-[#E5E5DF] bg-white p-5">
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
          <form
            action={async (formData: FormData) => {
              "use server";
              await createDepartmentAction(null, formData);
            }}
            className="p-3.5 rounded-[6px] bg-[#FAFAF8] border border-[#E5E5DF] space-y-2.5 text-[12px]"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Add a Department
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                name="name"
                placeholder="Name (e.g. Science)"
                required
                className="sm:col-span-2 px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] focus:outline-none focus:border-[#191919]"
              />
              <input
                type="text"
                name="code"
                aria-label="Short department code"
                placeholder="Short code (SCI)"
                required
                className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] uppercase font-mono focus:outline-none focus:border-[#191919]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#191919] hover:bg-[#333333] text-white rounded-[5px] text-[12px] font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Department</span>
            </button>
          </form>

          {context?.hasPermission("assignments.manage") && (
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
              departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-3 rounded-[6px] border border-[#EAEAE6] bg-[#FAFAF8] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[13px] text-[#191919]">{dept.name}</span>
                      <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EAEAE6] text-[#555555] text-[10px] font-mono font-bold">
                        {dept.code}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#888888]">
                      {dept.subjects?.length || 0} subjects
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-[#EBEBE8] text-[11px] text-[#666666]">
                    <Award className="w-3.5 h-3.5 text-[#C2410C]" />
                    <span>
                      Head of Department:{" "}
                      {hodAssignments.find((assignment) => assignment.department_id === dept.id && assignment.scope_type === "department")?.hod_user?.full_name ? (
                        <strong className="text-[#191919]">
                          {hodAssignments.find((assignment) => assignment.department_id === dept.id && assignment.scope_type === "department")?.hod_user?.full_name}
                        </strong>
                      ) : (
                        <span className="italic text-[#888888]">Unassigned</span>
                      )}
                    </span>
                  </div>
                </div>
              ))
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
          <form
            action={async (formData: FormData) => {
              "use server";
              await createSubjectAction(null, formData);
            }}
            className="p-3.5 rounded-[6px] bg-[#FAFAF8] border border-[#E5E5DF] space-y-2.5 text-[12px]"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
              Add New Subject
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                name="name"
                placeholder="Subject Name (e.g. Physics)"
                required
                className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] focus:outline-none focus:border-[#191919]"
              />
              <input
                type="text"
                name="code"
                placeholder="Short code (PHY)"
                required
                className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] uppercase font-mono focus:outline-none focus:border-[#191919]"
              />
              <select
                name="departmentId"
                required
                className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] focus:outline-none focus:border-[#191919]"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  name="defaultCoefficient"
                  aria-label="Subject weight"
                  placeholder="Weight (2)"
                  step="0.5"
                  defaultValue="2"
                  className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] font-mono focus:outline-none focus:border-[#191919]"
                />
                <input
                  type="number"
                  name="defaultMaxMarks"
                  aria-label="Maximum mark"
                  placeholder="Max mark (20)"
                  defaultValue="20"
                  className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] font-mono focus:outline-none focus:border-[#191919]"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#191919] hover:bg-[#333333] text-white rounded-[5px] text-[12px] font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </form>

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

      {/* Class groups */}
      <div className="bg-white p-5 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#EEEEEC]">
          <Layers className="w-4 h-4 text-[#555555]" />
          <div>
            <h2 className="text-[14px] font-bold text-[#191919]">Classes &amp; Class Groups</h2>
            <p className="text-[11px] text-[#777777]">Create groups such as Form 1 A or Form 5 Science for this school year.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classesWithStreams.length === 0 ? (
            <div className="col-span-full text-center py-6 text-[12px] text-[#888888]">
              No classes are available yet. Contact your school administrator to set up classes.
            </div>
          ) : (
            classesWithStreams.map((cls) => (
              <div
                key={cls.id}
                className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-[#FAFAF8] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[13px] text-[#191919]">{cls.name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#EAEAE6] text-[#555555]">
                    {cls.cycle === "cycle_1" ? "O-Level" : "A-Level"}
                  </span>
                </div>

                {/* Streams */}
                <div className="space-y-1">
                  {cls.streams.length === 0 ? (
                    <div className="text-[11px] italic text-[#888888]">No class groups added yet</div>
                  ) : (
                    cls.streams.map((st) => (
                      <div
                        key={st.id}
                        className="p-2.5 rounded-[4px] bg-white border border-[#E5E5DF] space-y-1.5 text-[11px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#191919]">{st.name}</span>
                          {st.class_master?.full_name && (
                            <span className="text-[10px] text-[#2A7C13] font-semibold bg-[#EAF7E4] px-1.5 py-0.5 rounded border border-[#76C457]/30">
                              {st.class_master.full_name}
                            </span>
                          )}
                        </div>

                        {context?.hasPermission("assignments.manage") ? (
                          <ClassMasterSelectClient
                            classStreamId={st.id}
                            streamName={st.name}
                            currentClassMasterId={st.class_master_id}
                            teachers={teachingStaff}
                          />
                        ) : (
                          <div className="text-[10px] text-[#777777]">
                            Class master: {st.class_master?.full_name || "Not assigned"}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Add Stream */}
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await createClassStreamAction(formData);
                  }}
                  className="flex gap-1.5 pt-1.5"
                >
                  <input type="hidden" name="classId" value={cls.id} />
                  <input
                    type="text"
                    name="name"
                    aria-label={`Name for a class group in ${cls.name}`}
                    placeholder={`Group name (e.g. ${cls.name} A)`}
                    required
                    className="flex-1 px-2.5 py-1 text-[11px] rounded-[4px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-[#191919] hover:bg-[#333333] text-white rounded-[4px] text-[11px] font-semibold transition-colors"
                  >
                    Add Group
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
