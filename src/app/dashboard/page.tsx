import Link from "next/link";
import { getTenantContext } from "@/lib/tenancy/context";
import {
  getEnrolledStudents,
  getActiveAcademicYear,
  getSchoolSubjects,
  getSchoolDepartments,
  getSchoolClasses,
  getSchoolTeacherAssignments,
  getSchoolSequences,
  getHodScope,
} from "@/lib/academic/service";
import { getSchoolStaffMemberships } from "@/lib/admin/service";
import { getAcademicAnalytics } from "@/lib/academic/analytics-service";
import { AcademicOverviewSection } from "@/components/academic/AcademicOverviewSection";
import { TeacherAssignmentsList } from "./TeacherAssignmentsList";
import {
  Users,
  UserCog,
  ClipboardCheck,
  FileText,
  Wallet,
  CalendarCheck,
  ArrowRight,
  BookOpen,
  Info,
  Building2,
  Layers,
  GraduationCap,
  Sparkles,
  Star,
  Award,
} from "lucide-react";

export default async function DashboardPage() {
  const tenantContext = await getTenantContext();
  const school = tenantContext?.school;
  const schoolName = school?.name || "Your School";
  const schoolId = school?.id || "";
  const userName = tenantContext?.user?.full_name || "Staff Member";
  const roleCode = tenantContext?.role?.code || "teacher";
  const roleName = tenantContext?.role?.name || "Staff";

  const isTeacher = roleCode === "teacher" || roleCode === "class_master";
  const isAdmin = ["school_admin", "principal", "superadmin"].includes(roleCode);
  const isHodUser = !isAdmin && (roleCode === "hod" || Boolean(tenantContext?.isHod));

  // Clean greeting formatting (handles titles like Dr., Mr., Mrs. without truncating to just the title)
  const userGreeting = (() => {
    if (!userName || userName === "Staff Member") return "Staff Member";
    const parts = userName.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0];
    const titles = ["dr.", "dr", "mr.", "mr", "mrs.", "mrs", "ms.", "ms", "prof.", "prof", "rev.", "rev", "pastor", "engr."];
    if (titles.includes(parts[0].toLowerCase())) {
      return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return parts[0];
  })();

  // Real data
  const activeYear = await getActiveAcademicYear(schoolId);
  const [staff, rawSubjects, rawDepartments, classes, teacherAssignments, sequences, hodScope] = await Promise.all([
    getSchoolStaffMemberships(schoolId),
    getSchoolSubjects(schoolId),
    getSchoolDepartments(schoolId),
    getSchoolClasses(schoolId, activeYear?.id),
    isTeacher && activeYear && tenantContext?.user?.id
      ? getSchoolTeacherAssignments(schoolId, activeYear.id, tenantContext.user.id)
      : Promise.resolve([]),
    getSchoolSequences(schoolId),
    isHodUser && activeYear && tenantContext?.user?.id
      ? getHodScope(schoolId, activeYear.id, tenantContext.user.id)
      : Promise.resolve(null),
  ]);

  // If HOD, scope subjects and departments to their assigned department
  const subjects = hodScope
    ? rawSubjects.filter((s) => hodScope.subjectIds.includes(s.id))
    : rawSubjects;

  const departments = hodScope
    ? rawDepartments.filter((d) => hodScope.departmentIds.includes(d.id))
    : rawDepartments;

  // Teachers only fetch enrolled students for their assigned class streams
  const assignedStreamIds = isTeacher
    ? Array.from(new Set(teacherAssignments.map((a) => a.class_stream_id)))
    : undefined;

  const enrolledStudents = isTeacher
    ? (assignedStreamIds && assignedStreamIds.length > 0
        ? await getEnrolledStudents(schoolId, activeYear?.id || "", undefined, assignedStreamIds)
        : [])
    : await getEnrolledStudents(schoolId, activeYear?.id || "");

  // Active assessment window is strictly derived from sequences open for marks
  const openSequences = sequences.filter((s) => s.is_open_for_marks);
  const activeSequence = openSequences.length > 0 ? openSequences[openSequences.length - 1] : null;

  // ── ACADEMIC PERFORMANCE & HONOR ROLL OVERVIEW ──
  const analyticsRole: "admin" | "teacher" | "hod" = isAdmin ? "admin" : isHodUser ? "hod" : "teacher";
  const academicAnalytics = await getAcademicAnalytics({
    schoolId,
    academicYearId: activeYear?.id,
    role: analyticsRole,
    userId: tenantContext?.user?.id,
    departmentId: hodScope?.departmentIds?.[0],
  });

  // ── TEACHER DASHBOARD VIEW ──
  if (isTeacher) {
    const assignedStudentsCount = enrolledStudents.length;
    const displayRoleName =
      roleCode === "class_master" && !tenantContext?.isClassMaster ? "Teacher" : roleName;

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Welcome header */}
        <div className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[14px] p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/30 text-[11px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2A7C13]" />
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{displayRoleName}</span>
                </span>
                {tenantContext?.isClassMaster && (tenantContext.masteredStreamNames?.length ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] text-[11px] font-bold uppercase tracking-wider">
                    <Star className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>Class Master: {tenantContext.masteredStreamNames?.join(", ")}</span>
                  </span>
                )}
                {tenantContext?.isHod && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] text-[11px] font-bold uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 text-[#1E40AF]" />
                    <span>Head of Department{hodScope?.departmentNames?.[0] ? `: ${hodScope.departmentNames[0]}` : ""}</span>
                  </span>
                )}
                <span className="text-xs text-[#B5AC98]">·</span>
                <span className="text-xs text-[#525E4B] font-semibold">
                  {schoolName}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142010] tracking-tight">
                Welcome back, {userGreeting}!
              </h1>
              <p className="text-[13px] text-[#525E4B] mt-1.5 flex flex-wrap items-center gap-2">
                <span>{activeYear?.name || "Academic year not set"}</span>
                {activeSequence ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FFF8CF] text-[#4A3D00] text-[11px] font-semibold rounded-full border border-[#FBE6C2]">
                    <Sparkles className="w-3 h-3 text-[#B45309]" />
                    <span>Active Assessment: {activeSequence.name}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FAF8F2] text-[#666666] text-[11px] font-medium rounded-full border border-[#E8DFC9]">
                    <span>Assessment Windows Closed</span>
                  </span>
                )}
              </p>
            </div>
            <div className="text-[11px] text-[#788470] text-left sm:text-right">
              <div className="font-mono font-bold text-[#142010]">
                {school?.code ||
                  (school?.name
                    ? school.name
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((w) => w[0]?.toUpperCase())
                        .join("")
                        .slice(0, 6)
                    : "SCH")}
              </div>
              <div>Secondary School System</div>
            </div>
          </div>
        </div>

        {/* Class Master Supervision Banner */}
        {tenantContext?.isClassMaster && tenantContext.masteredStreamNames && tenantContext.masteredStreamNames.length > 0 && (
          <div className="p-4.5 rounded-[12px] bg-[#FFFDF5] border border-[#E8DFC9] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#2A7C13]/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FFF8CF] text-[#B45309] border border-[#FBE6C2] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-[13px] text-[#142010]">
                  Class Master Supervision: {tenantContext.masteredStreamNames.join(", ")}
                </h3>
                <p className="text-[11px] text-[#525E4B]">
                  You are designated to supervise this class group, manage daily roll call, and review term report cards.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/dashboard/attendance"
                className="px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-white hover:bg-[#FAF8F2] text-[#142010] border border-[#E8DFC9] transition-all hover:-translate-y-0.5 shadow-2xs"
              >
                Roll Call
              </Link>
              <Link
                href="/dashboard/academics/report-cards"
                className="px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-[#2A7C13] text-white hover:bg-[#20600E] transition-all hover:-translate-y-0.5 shadow-xs"
              >
                Review Report Cards
              </Link>
            </div>
          </div>
        )}

        {/* Teacher Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white border border-[#E8DFC9] rounded-[12px] p-4.5 shadow-2xs hover:border-[#2A7C13] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">Classes Taught</span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#142010]">{teacherAssignments.length}</div>
            <div className="text-[11px] text-[#788470] mt-0.5">Assigned subject groups</div>
          </div>

          <div className="bg-white border border-[#E8DFC9] rounded-[12px] p-4.5 shadow-2xs hover:border-[#2A7C13] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">My Students</span>
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#142010]">
              {teacherAssignments.length > 0 ? assignedStudentsCount : 0}
            </div>
            <div className="text-[11px] text-[#788470] mt-0.5">
              {teacherAssignments.length > 0 ? "In your assigned classes" : "No classes assigned yet"}
            </div>
          </div>

          <div className="bg-white border border-[#E8DFC9] rounded-[12px] p-4.5 shadow-2xs hover:border-[#2A7C13] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">Current Test</span>
            </div>
            <div className={`text-lg font-extrabold truncate leading-tight mt-1 ${activeSequence ? "text-[#142010]" : "text-[#788470]"}`}>
              {activeSequence ? `Seq ${activeSequence.sequence_number}` : "None"}
            </div>
            <div className={`text-[11px] font-semibold mt-0.5 ${activeSequence ? "text-[#2A7C13]" : "text-[#788470]"}`}>
              {activeSequence ? "Marks Entry Open" : "Marks Window Closed"}
            </div>
          </div>

          <div className="bg-white border border-[#E8DFC9] rounded-[12px] p-4.5 shadow-2xs hover:border-[#2A7C13] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">Subsystem</span>
            </div>
            <div className="text-lg font-extrabold text-[#142010] mt-1">
              {school?.subsystem === "anglophone"
                ? "English Curriculum"
                : school?.subsystem === "francophone"
                ? "French Curriculum"
                : school?.subsystem === "bilingual"
                ? "Bilingual Curriculum"
                : "National Curriculum"}
            </div>
            <div className="text-[11px] text-[#788470] mt-0.5">CBA 20-pt grading</div>
          </div>
        </div>

        {/* My Teaching Assignments Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[13px] font-bold text-[#555555] uppercase tracking-wider">
              My Teaching Assignments &amp; Quick Mark Entry
            </h2>
            <span className="text-xs text-[#888888]">
              {teacherAssignments.length} class{teacherAssignments.length === 1 ? "" : "es"} assigned
            </span>
          </div>

          <TeacherAssignmentsList
            assignments={teacherAssignments}
            masteredStreamIds={tenantContext?.isClassMaster ? (tenantContext.masteredStreamNames || []) : []}
          />
        </div>

        {/* Academic Performance & Honor Roll Overview (Teacher Scoped) */}
        {academicAnalytics && (
          <AcademicOverviewSection
            initialData={academicAnalytics}
            canPrintCertificates={false}
          />
        )}

        {/* Common Teacher Actions */}
        <div>
          <h2 className="text-[13px] font-bold text-[#555555] uppercase tracking-wider mb-3">
            Teacher Tools &amp; Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction
              href="/dashboard/academics/marks"
              icon={ClipboardCheck}
              color="green"
              title="Enter Marks"
              description="Record test marks manually or import scores via Excel / CSV."
            />
            <QuickAction
              href="/dashboard/attendance"
              icon={CalendarCheck}
              color="amber"
              title="Daily Attendance"
              description="Take roll call for your class and record student conduct."
            />
            <QuickAction
              href="/dashboard/academics/report-cards"
              icon={FileText}
              color="blue"
              title="Report Cards"
              description="Review student terminal averages, ranks, and report sheets."
            />
            <QuickAction
              href="/dashboard/students"
              icon={Users}
              color="green"
              title="Class Register"
              description="Check student matricules, class lists, and guardian numbers."
            />
            {tenantContext?.isHod && (
              <QuickAction
                href="/dashboard/academics?tab=teachers"
                icon={BookOpen}
                color="blue"
                title="HOD: Assign Teachers"
                description={`Assign teachers to ${hodScope?.departmentNames?.[0] || "your department"} subjects.`}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── ADMINISTRATOR & BURSAR DASHBOARD VIEW ──
  const studentCount = enrolledStudents.length;
  const staffCount = staff.filter((member) => member.status === "active").length;
  const subjectCount = subjects.length;
  const departmentCount = departments.length;
  const classStreamCount = classes.reduce((count, classItem) => count + classItem.streams.length, 0);

  const needsInitialSetup = studentCount === 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Welcome header */}
      <div className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[14px] p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF7E4] border border-[#76C457]/30 text-[#2A7C13] text-[11px] font-bold tracking-wider uppercase mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2A7C13]" />
              <span>{roleName} Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142010] tracking-tight">
              {schoolName}
            </h1>
            <p className="text-[13px] text-[#525E4B] mt-1.5 flex items-center gap-2">
              <span>{activeYear?.name || "Academic year not set"}</span>
              {activeYear?.is_current && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#EAF7E4] text-[#2A7C13] text-[11px] font-semibold rounded-full border border-[#76C457]/40">
                  Current Session
                </span>
              )}
            </p>
          </div>
          <div className="text-[11px] text-[#788470] text-left sm:text-right">
            <div className="font-mono font-bold text-[#142010]">Nsei Sukul Platform</div>
            <div>School Management System</div>
          </div>
        </div>
      </div>

      {/* Getting-started guide for new schools */}
      {needsInitialSetup && (
        <div className="bg-[#FFF8CF] border border-[#FBE6C2] rounded-[12px] p-5 flex gap-3 shadow-2xs">
          <Info className="w-5 h-5 text-[#B45309] flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[13px] text-[#7A4A00]">Set Up Your School</p>
            <ol className="mt-2 space-y-1 text-[12px] text-[#7A4A00] list-decimal list-inside">
              <li>
                Ask each staff member to create an account, then <Link href="/dashboard/settings#staff" className="underline font-semibold">add them to your school</Link> using their registered email.
              </li>
              <li>
                <Link href="/dashboard/academics" className="underline font-semibold">Set up classes and subjects</Link>{" "}so students can be placed in the right class.
              </li>
              <li>
                <Link href="/dashboard/students" className="underline font-semibold">Admit your first students</Link>
                {" "}and assign each student to a class.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Real stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <div className="bg-white border border-[#E8DFC9] rounded-[12px] p-4.5 shadow-2xs hover:border-[#2A7C13] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">Students</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#142010]">{studentCount}</div>
          <div className="text-[11px] text-[#788470] mt-0.5">
            {studentCount === 0 ? "None enrolled yet" : "Currently enrolled"}
          </div>
        </div>

        <div className="bg-white border border-[#E8DFC9] rounded-[12px] p-4.5 shadow-2xs hover:border-[#2A7C13] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0">
              <UserCog className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">Staff</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#142010]">{staffCount}</div>
          <div className="text-[11px] text-[#788470] mt-0.5">
            {staffCount === 0
              ? "No active staff members yet"
              : staffCount === 1
              ? "1 active staff member"
              : "Active staff members"}
          </div>
        </div>

        <div className="bg-white border border-[#E8DFC9] rounded-[12px] p-4.5 shadow-2xs hover:border-[#2A7C13] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">Subjects</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#142010]">{subjectCount}</div>
          <div className="text-[11px] text-[#788470] mt-0.5">
            {isHodUser ? "In your department" : subjectCount === 0 ? "None configured yet" : "In curriculum"}
          </div>
        </div>

        <div className="bg-white border border-[#E8DFC9] rounded-[12px] p-4.5 shadow-2xs hover:border-[#2A7C13] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">Class Streams</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#142010]">{classStreamCount}</div>
          <div className="text-[11px] text-[#788470] mt-0.5">Classes students can join</div>
        </div>

        <div className="bg-white border border-[#E8DFC9] rounded-[12px] p-4.5 shadow-2xs hover:border-[#2A7C13] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">Departments</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#142010]">{departmentCount}</div>
          <div className="text-[11px] text-[#788470] mt-0.5">
            {isHodUser && hodScope?.departmentNames?.[0] ? hodScope.departmentNames[0] : "Subject groups"}
          </div>
        </div>
      </div>

      {/* Institution-Wide Academic Performance & Honor Roll Overview */}
      {academicAnalytics && (
        <AcademicOverviewSection
          initialData={academicAnalytics}
          canPrintCertificates={isAdmin}
        />
      )}

      {/* Quick Actions: the most important section */}
      <div>
        <h2 className="text-[13px] font-bold text-[#555555] uppercase tracking-wider mb-3">
          Common Tasks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          <QuickAction
            href="/dashboard/students"
            icon={Users}
            color="green"
            title="Admit a Student"
            description="Register a new student and assign them to a class."
          />
          <QuickAction
            href="/dashboard/settings#staff"
            icon={UserCog}
            color="green"
            title="Add a Teacher or Staff Member"
            description="Add their registered account and choose their school role."
          />
          <QuickAction
            href="/dashboard/academics/marks"
            icon={ClipboardCheck}
            color="blue"
            title="Enter Marks"
            description="Record test marks for a class, subject and term."
          />
          <QuickAction
            href="/dashboard/academics/report-cards"
            icon={FileText}
            color="blue"
            title="View Report Cards"
            description="Open a student report card and print it."
          />
          <QuickAction
            href="/dashboard/finance"
            icon={Wallet}
            color="amber"
            title="Record a Fee Payment"
            description="Record a payment and print its receipt."
          />
          <QuickAction
            href="/dashboard/attendance"
            icon={CalendarCheck}
            color="amber"
            title="Take Attendance"
            description="Mark students present or absent for a class."
          />
        </div>
      </div>

      {/* Setup reminder if academics not configured */}
      {(subjectCount === 0 || classStreamCount === 0) && (
        <div className="bg-white border border-[#E5E5DF] rounded-[10px] p-5">
          <h3 className="font-bold text-[14px] text-[#191919] mb-1">
            Set Up Classes and Subjects
          </h3>
          <p className="text-[12px] text-[#666666] mb-3">
            Add subjects and class streams before admitting students or recording marks. Departments can group related subjects.
          </p>
          <Link
            href="/dashboard/academics"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#191919] hover:bg-[#333333] text-white text-[13px] font-semibold rounded-[6px] transition-colors"
          >
            Set Up Classes and Subjects
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: "green" | "blue" | "amber";
}) {
  const iconColors = {
    green: "text-[#2A7C13] bg-[#EAF7E4] border border-[#76C457]/30",
    blue: "text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE]",
    amber: "text-[#B45309] bg-[#FFF8CF] border border-[#FBE6C2]",
  };

  return (
    <Link
      href={href}
      className="group bg-white border border-[#E8DFC9] hover:border-[#2A7C13] rounded-[12px] p-4.5 flex items-start gap-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs"
    >
      <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0 ${iconColors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-[14px] text-[#142010] group-hover:text-[#2A7C13] transition-colors flex items-center justify-between">
          <span>{title}</span>
          <ArrowRight className="w-4 h-4 text-[#788470] group-hover:text-[#2A7C13] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-1" />
        </div>
        <div className="text-[12px] text-[#525E4B] mt-0.5 leading-snug">{description}</div>
      </div>
    </Link>
  );
}
