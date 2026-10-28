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

  // Concurrent data fetching to eliminate sequential waterfalls
  const [activeYear, departments, subjects, classSubjects, staff, sequences] = await Promise.all([
    getActiveAcademicYear(schoolId),
    getSchoolDepartments(schoolId),
    getSchoolSubjects(schoolId),
    getSchoolClassSubjects(schoolId),
    getSchoolStaffMemberships(schoolId),
    getSchoolSequences(schoolId),
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
  const classGroups = classesWithStreams.flatMap((classItem) =>
    classItem.streams.map((stream) => ({ id: stream.id, name: stream.name }))
  );

  return (
    <AcademicsViewClient
      academicYearId={activeYear?.id || ""}
      academicYearName={activeYear?.name || "Not set"}
      departments={departments}
      subjects={subjects}
      classSubjects={classSubjects}
      classesWithStreams={classesWithStreams}
      hodAssignments={hodAssignments}
      teacherAssignments={teacherAssignments}
      teachingStaff={teachingStaff}
      headsOfDepartment={headsOfDepartment}
      classGroups={classGroups}
      sequences={sequences}
      canManageAcademics={Boolean(context?.hasPermission("academics.manage"))}
      canManageAssignments={Boolean(context?.hasPermission("assignments.manage"))}
      canManageSettings={Boolean(context?.hasPermission("school.settings.manage"))}
      initialTab={params?.tab || "classes"}
    />
  );
}
