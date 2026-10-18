import { ReactNode } from "react";
import Link from "next/link";
import { getTenantContext } from "@/lib/tenancy/context";
import { getUserSchools } from "@/lib/tenancy/context";
import { getActiveAcademicYear } from "@/lib/academic/service";
import { signOutAction } from "@/app/auth/actions";
import { setActiveSchoolAction } from "@/app/schools/actions";
import { APP_CONFIG } from "@/lib/version";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  Wallet,
  Settings,
  ClipboardCheck,
  FileText,
  LogOut,
  UserCog,
  CalendarCheck,
  History,
  ChevronRight,
  Menu,
  ArrowLeftRight,
} from "lucide-react";

import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
}

function NavSection({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#AAAAAA]">
      {label}
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  sublabel,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  sublabel?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[#444444] hover:bg-[#F5F5F0] hover:text-[#191919] transition-colors group"
    >
      <Icon className="w-4 h-4 text-[#888888] flex-shrink-0 group-hover:text-[#2A7C13]" />
      <div className="min-w-0">
        <div className="text-[13px] font-medium leading-tight truncate">{label}</div>
        {sublabel && (
          <div className="text-[10px] text-[#AAAAAA] leading-tight truncate">{sublabel}</div>
        )}
      </div>
    </Link>
  );
}

function DashboardNavigation({ className }: { className: string }) {
  return (
    <nav className={className}>
      <NavSection label="Overview" />
      <NavLink
        href="/dashboard"
        icon={LayoutDashboard}
        label="Home"
        sublabel="School overview and next steps"
      />

      <NavSection label="People" />
      <NavLink
        href="/dashboard/students"
        icon={Users}
        label="Students & Admissions"
        sublabel="Admit students and view the register"
      />
      <NavLink
        href="/dashboard/settings#staff"
        icon={UserCog}
        label="Teachers & Staff"
        sublabel="Manage staff and access"
      />

      <NavSection label="Teaching & Learning" />
      <NavLink
        href="/dashboard/academics"
        icon={BookOpen}
        label="Classes & Subjects"
        sublabel="Set up classes, subjects and departments"
      />
      <NavLink
        href="/dashboard/academics/marks"
        icon={ClipboardCheck}
        label="Marks & Grades"
        sublabel="Enter student test marks"
      />
      <NavLink
        href="/dashboard/academics/report-cards"
        icon={FileText}
        label="Report Cards"
        sublabel="View and print student results"
      />

      <NavSection label="Daily Work" />
      <NavLink
        href="/dashboard/attendance"
        icon={CalendarCheck}
        label="Attendance & Conduct"
        sublabel="Mark attendance and record conduct"
      />

      <NavSection label="Fees" />
      <NavLink
        href="/dashboard/finance"
        icon={Wallet}
        label="Fees, Payments & Receipts"
        sublabel="Set fees and record payments"
      />

      <NavSection label="Administration" />
      <NavLink
        href="/dashboard/settings#school-settings"
        icon={Settings}
        label="School Settings"
        sublabel="School details and report settings"
      />
      <NavLink
        href="/dashboard/settings/audit-logs"
        icon={History}
        label="Activity Log"
        sublabel="See who changed school records"
      />
    </nav>
  );
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    redirect("/onboarding");
  }

  const schoolName = tenantContext.school.name;
  const userFullName = tenantContext.user.full_name;
  const userRole = tenantContext.role.name;
  const [activeYear, userSchools] = await Promise.all([
    getActiveAcademicYear(tenantContext.school.id),
    getUserSchools(),
  ]);
  const academicYearLabel = activeYear?.name || "Academic year not set";

  return (
    <div className="min-h-screen flex bg-[#FAFAF8] text-[#191919] font-sans">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#E5E5DF] bg-white flex-shrink-0">

        {/* School brand */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[#EBEBE6]">
          <div className="w-8 h-8 rounded-[6px] bg-[#142010] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {schoolName.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-[13px] tracking-tight text-[#191919] truncate leading-tight">
              {schoolName}
            </div>
            <div className="text-[10px] text-[#AAAAAA] font-medium truncate">
              Nsei Skul · School Management
            </div>
          </div>
        </div>

        {/* Navigation */}
        <DashboardNavigation className="flex-1 px-2 py-3 overflow-y-auto" />

        {/* User card */}
        <div className="p-3 border-t border-[#EBEBE6]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#E5E5DF] text-[#333333] flex items-center justify-center font-bold text-[12px] flex-shrink-0">
                {userFullName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="text-[12px] font-semibold text-[#191919] truncate leading-tight">
                  {userFullName}
                </div>
                <div className="text-[10px] text-[#AAAAAA] truncate">{userRole}</div>
              </div>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                className="p-1.5 text-[#AAAAAA] hover:text-[#C2410C] rounded-[4px] hover:bg-[#FFF0F0] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Version badge */}
          <div className="mt-2.5 px-2 py-1.5 bg-[#F5F5F0] rounded-[5px] flex items-center justify-between text-[10px]">
            <span className="font-mono font-bold text-[#2A7C13]">v{APP_CONFIG.version}</span>
            <span className="text-[#AAAAAA] truncate ml-2">{APP_CONFIG.releaseName}</span>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header */}
        <header className="relative z-20 min-h-14 flex items-center justify-between gap-3 px-4 md:px-6 border-b border-[#E5E5DF] bg-white flex-shrink-0">
          <div className="flex min-w-0 items-center gap-2 text-[13px]">
            <GraduationCap className="w-4 h-4 text-[#2A7C13]" />
            <span className="truncate font-semibold text-[#191919]">{schoolName}</span>
            <ChevronRight className="hidden sm:block w-3.5 h-3.5 text-[#CCCCCC]" />
            <span className="hidden sm:block truncate text-[#777777]">{academicYearLabel}</span>
          </div>

          <div className="flex items-center gap-3">
            {userSchools.length > 1 && (
              <form action={setActiveSchoolAction} className="flex items-center gap-1.5">
                <input type="hidden" name="returnTo" value="/dashboard" />
                <select
                  name="schoolId"
                  aria-label="Choose a school to switch to"
                  defaultValue={tenantContext.school.id}
                  required
                  className="max-w-36 rounded-[5px] border border-[#D5D5CF] bg-white px-2 py-2 text-xs text-[#333333] focus:border-[#2A7C13] focus:outline-none sm:max-w-48"
                >
                  {userSchools.map(({ membershipId, school }) => (
                    <option key={membershipId} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  title="Switch school"
                  aria-label="Switch school"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] border border-[#D5D5CF] bg-white text-[#333333] hover:bg-[#F5F5F0]"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </button>
              </form>
            )}
            <details className="relative md:hidden">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-[5px] border border-[#D5D5CF] px-2.5 py-2 text-xs font-semibold text-[#333333]">
                <Menu className="h-4 w-4" />
                Menu
              </summary>
              <div className="absolute right-0 top-full mt-2 max-h-[calc(100vh-5rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-[6px] border border-[#E5E5DF] bg-white shadow-lg">
                <DashboardNavigation className="px-2 py-2" />
              </div>
            </details>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-[5px] border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-semibold text-[#047857]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              {activeYear?.is_current ? "Current school year" : "No current school year"}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
