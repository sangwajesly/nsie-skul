import { getTenantContext } from "@/lib/tenancy/context";
import {
  getSchoolDepartments,
  getSchoolSubjects,
  getSchoolClasses,
  getActiveAcademicYear,
  getSchoolHodAssignments,
  getSchoolTeacherAssignments,
  getSchoolClassSubjects,
  getSchoolSequences,
  getHodScope,
} from "@/lib/academic/service";
import { getSchoolStaffMemberships } from "@/lib/admin/service";
import { AcademicsViewClient } from "./AcademicsViewClient";

export const dynamic = "force-dynamic";

interface AcademicsPageProps {
  searchParams?: Promise<{
    tab?: string;
  }>;
}

export default async function AcademicsPage({ searchParams }: AcademicsPageProps) {
  const params = await searchParams;
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";

  // Check if current user is an HOD (and not an administrator/principal with school-wide scope)
  const isAdmin = ["school_admin", "principal", "superadmin"].includes(context?.role?.code || "");
  const isHodUser = !isAdmin && (context?.role?.code === "hod" || Boolean(context?.isHod));

  // Concurrent data fetching to eliminate sequential waterfalls
  const [activeYear, departments, subjects, classSubjects, staff, sequences] = await Promise.all([
    getActiveAcademicYear(schoolId),
    getSchoolDepartments(schoolId),
    getSchoolSubjects(schoolId),
    getSchoolClassSubjects(schoolId),
    getSchoolStaffMemberships(schoolId),
    getSchoolSequences(schoolId),
  ]);

  const [classesWithStreams, hodAssignments, teacherAssignments, hodScope] = await Promise.all([
    getSchoolClasses(schoolId, activeYear?.id),
    activeYear ? getSchoolHodAssignments(schoolId, activeYear.id) : Promise.resolve([]),
    activeYear ? getSchoolTeacherAssignments(schoolId, activeYear.id) : Promise.resolve([]),
    isHodUser && context?.user?.id
      ? getHodScope(schoolId, activeYear?.id, context.user.id)
      : Promise.resolve(null),
  ]);

  // If the user is an HOD, strictly filter subjects, departments, and allocations to their department
  const visibleSubjects = hodScope
    ? subjects.filter((s) => hodScope.subjectIds.includes(s.id))
    : subjects;

  const visibleDepartments = hodScope
    ? departments.filter((d) => hodScope.departmentIds.includes(d.id))
    : departments;

  const visibleTeacherAssignments = hodScope
    ? teacherAssignments.filter((ta) => hodScope.subjectIds.includes(ta.subject_id))
    : teacherAssignments;

  const visibleClassSubjects = hodScope
    ? classSubjects.filter((cs) => hodScope.subjectIds.includes(cs.subject_id))
    : classSubjects;

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
  const classGroups = classesWithStreams.flatMap((classItem) =>
    classItem.streams.map((stream) => ({ id: stream.id, name: stream.name }))
  );

  return (
    <AcademicsViewClient
      academicYearId={activeYear?.id || ""}
      academicYearName={activeYear?.name || "Not set"}
      departments={visibleDepartments}
      subjects={visibleSubjects}
      classSubjects={visibleClassSubjects}
      classesWithStreams={classesWithStreams}
      hodAssignments={hodAssignments}
      teacherAssignments={visibleTeacherAssignments}
      teachingStaff={teachingStaff}
      headsOfDepartment={headsOfDepartment}
      classGroups={classGroups}
      sequences={sequences}
      canManageAcademics={Boolean(context?.hasPermission("academics.manage"))}
      canManageAssignments={Boolean(context?.hasPermission("assignments.manage"))}
      canManageSettings={Boolean(context?.hasPermission("school.settings.manage"))}
      initialTab={params?.tab || (isHodUser ? "teachers" : "classes")}
      isHodUser={isHodUser}
      hodDepartmentNames={hodScope?.departmentNames || []}
    />
  );
}
