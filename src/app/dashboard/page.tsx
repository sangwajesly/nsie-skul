import Link from "next/link";
import { getTenantContext } from "@/lib/tenancy/context";
import {
  getEnrolledStudents,
  getActiveAcademicYear,
  getSchoolSubjects,
  getSchoolDepartments,
  getSchoolClasses,
} from "@/lib/academic/service";
import { getSchoolStaffMemberships } from "@/lib/admin/service";
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
} from "lucide-react";

export default async function DashboardPage() {
  const tenantContext = await getTenantContext();
  const school = tenantContext?.school;
  const schoolName = school?.name || "Your School";
  const schoolId = school?.id || "";
  const userName = tenantContext?.user?.full_name || "Admin";

  // Real data
  const activeYear = await getActiveAcademicYear(schoolId);
  const [enrolledStudents, staff, subjects, departments, classes] = await Promise.all([
    getEnrolledStudents(schoolId, activeYear?.id || ""),
    getSchoolStaffMemberships(schoolId),
    getSchoolSubjects(schoolId),
    getSchoolDepartments(schoolId),
    getSchoolClasses(schoolId, activeYear?.id),
  ]);

  const studentCount = enrolledStudents.length;
  const staffCount = staff.filter((member) => member.status === "active").length;
  const subjectCount = subjects.length;
  const departmentCount = departments.length;
  const classStreamCount = classes.reduce((count, classItem) => count + classItem.streams.length, 0);

  const needsInitialSetup = studentCount === 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Welcome header */}
      <div className="bg-white border border-[#E5E5DF] rounded-[10px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-[12px] text-[#AAAAAA] font-medium mb-1">
              Welcome back, {userName.split(" ")[0]}
            </p>
            <h1 className="text-2xl font-extrabold text-[#191919] tracking-tight">
              {schoolName}
            </h1>
            <p className="text-[13px] text-[#777777] mt-1">
              {activeYear?.name || "Academic year not set"}
              {activeYear?.is_current && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-[#ECFDF5] text-[#047857] text-[11px] font-semibold rounded-[4px] border border-[#A7F3D0]">
                  Current year
                </span>
              )}
            </p>
          </div>
          <div className="text-[11px] text-[#999999] text-right">
            <div className="font-mono">Nsei Skul Platform</div>
            <div>Independent · Not affiliated with MINESEC</div>
          </div>
        </div>
      </div>

      {/* Getting-started guide for new schools */}
      {needsInitialSetup && (
        <div className="bg-[#FFF8CF] border border-[#FBE6C2] rounded-[10px] p-5 flex gap-3">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <div className="bg-white border border-[#E5E5DF] rounded-[8px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#2A7C13]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Students</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#191919]">{studentCount}</div>
          <div className="text-[11px] text-[#AAAAAA] mt-0.5">
            {studentCount === 0 ? "None enrolled yet" : "Currently enrolled"}
          </div>
        </div>

        <div className="bg-white border border-[#E5E5DF] rounded-[8px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserCog className="w-4 h-4 text-[#2A7C13]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Staff</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#191919]">{staffCount}</div>
          <div className="text-[11px] text-[#AAAAAA] mt-0.5">
            {staffCount === 0
              ? "No active staff members yet"
              : staffCount === 1
              ? "1 active staff member"
              : "Active staff members"}
          </div>
        </div>

        <div className="bg-white border border-[#E5E5DF] rounded-[8px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-[#2A7C13]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Subjects</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#191919]">{subjectCount}</div>
          <div className="text-[11px] text-[#AAAAAA] mt-0.5">
            {subjectCount === 0 ? "None configured yet" : "In curriculum"}
          </div>
        </div>

        <div className="bg-white border border-[#E5E5DF] rounded-[8px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-[#2A7C13]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Class Streams</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#191919]">{classStreamCount}</div>
          <div className="text-[11px] text-[#AAAAAA] mt-0.5">Classes students can join</div>
        </div>

        <div className="bg-white border border-[#E5E5DF] rounded-[8px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-[#2A7C13]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">Departments</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#191919]">{departmentCount}</div>
          <div className="text-[11px] text-[#AAAAAA] mt-0.5">Subject groups</div>
        </div>
      </div>

      {/* Quick Actions — the most important section */}
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
    green: "text-[#2A7C13] bg-[#F0FDF4]",
    blue: "text-[#1D4ED8] bg-[#EFF6FF]",
    amber: "text-[#B45309] bg-[#FFFBEB]",
  };

  return (
    <Link
      href={href}
      className="group bg-white border border-[#E5E5DF] hover:border-[#2A7C13] rounded-[10px] p-5 flex items-start gap-3 transition-all hover:shadow-md"
    >
      <div className={`w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0 ${iconColors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-[14px] text-[#191919] group-hover:text-[#2A7C13] transition-colors flex items-center justify-between">
          {title}
          <ArrowRight className="w-4 h-4 text-[#CCCCCC] group-hover:text-[#2A7C13] flex-shrink-0" />
        </div>
        <div className="text-[12px] text-[#777777] mt-0.5 leading-snug">{description}</div>
      </div>
    </Link>
  );
}
