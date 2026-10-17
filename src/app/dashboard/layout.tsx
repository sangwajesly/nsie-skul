import { ReactNode } from "react";
import Link from "next/link";
import { getTenantContext } from "@/lib/tenancy/context";
import { signOutAction } from "@/app/auth/actions";
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
  Building2,
  LogOut,
  ShieldCheck,
  Award,
  Clock,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const tenantContext = await getTenantContext();

  const schoolName = tenantContext?.school?.name || "Demo Academy Bamenda";
  const userFullName = tenantContext?.user?.full_name || "School Administrator";
  const userRole = tenantContext?.role?.name || "Administrator";

  return (
    <div className="min-h-screen flex bg-[#FAFAF8] text-[#191919] font-sans">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-60 border-r border-[#E5E5DF] bg-white">
        {/* Workspace Brand / Identity */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[#EBEBE6]">
          <div className="w-7 h-7 rounded-[5px] bg-[#191919] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            {schoolName.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="font-bold text-[13px] tracking-tight text-[#191919] truncate">
              {schoolName}
            </div>
            <div className="text-[11px] text-[#777777] font-medium truncate">
              Secondary Education · CBA System
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-2 py-3 space-y-5 overflow-y-auto text-[13px]">
          {/* Main */}
          <div className="space-y-0.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-2.5 py-1.5 font-medium rounded-[5px] bg-[#F1F1ED] text-[#191919]"
            >
              <LayoutDashboard className="w-4 h-4 text-[#555555]" />
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Academics */}
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#999999]">
              Academics
            </div>
            <Link
              href="/dashboard/academics"
              className="flex items-center gap-2.5 px-2.5 py-1.5 font-medium rounded-[5px] text-[#555555] hover:bg-[#F5F5F0] hover:text-[#191919] transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#777777]" />
              <span>Classes &amp; Subjects</span>
            </Link>
            <Link
              href="/dashboard/academics"
              className="flex items-center gap-2.5 px-2.5 py-1.5 font-medium rounded-[5px] text-[#555555] hover:bg-[#F5F5F0] hover:text-[#191919] transition-colors"
            >
              <Building2 className="w-4 h-4 text-[#777777]" />
              <span>Departments &amp; HODs</span>
            </Link>
            <Link
              href="/dashboard/academics/marks"
              className="flex items-center gap-2.5 px-2.5 py-1.5 font-medium rounded-[5px] text-[#555555] hover:bg-[#F5F5F0] hover:text-[#191919] transition-colors"
            >
              <ClipboardCheck className="w-4 h-4 text-[#777777]" />
              <span>Marks Entry (Sequences)</span>
            </Link>
            <Link
              href="/dashboard/academics/report-cards"
              className="flex items-center gap-2.5 px-2.5 py-1.5 font-medium rounded-[5px] text-[#555555] hover:bg-[#F5F5F0] hover:text-[#191919] transition-colors"
            >
              <FileText className="w-4 h-4 text-[#777777]" />
              <span>Report Cards &amp; CBA</span>
            </Link>
          </div>

          {/* Students */}
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#999999]">
              Students &amp; Staff
            </div>
            <Link
              href="/dashboard/students"
              className="flex items-center gap-2.5 px-2.5 py-1.5 font-medium rounded-[5px] text-[#555555] hover:bg-[#F5F5F0] hover:text-[#191919] transition-colors"
            >
              <Users className="w-4 h-4 text-[#777777]" />
              <span>Student Roster</span>
            </Link>
            <Link
              href="/dashboard/attendance"
              className="flex items-center gap-2.5 px-2.5 py-1.5 font-medium rounded-[5px] text-[#555555] hover:bg-[#F5F5F0] hover:text-[#191919] transition-colors"
            >
              <Clock className="w-4 h-4 text-[#777777]" />
              <span>Attendance &amp; Discipline</span>
            </Link>
            <Link
              href="/dashboard/academics"
              className="flex items-center gap-2.5 px-2.5 py-1.5 font-medium rounded-[5px] text-[#555555] hover:bg-[#F5F5F0] hover:text-[#191919] transition-colors"
            >
              <Award className="w-4 h-4 text-[#777777]" />
              <span>Teaching Assignments</span>
            </Link>
          </div>

          {/* Finance */}
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#999999]">
              Finance
            </div>
            <Link
              href="/dashboard/finance"
              className="flex items-center gap-2.5 px-2.5 py-1.5 font-medium rounded-[5px] text-[#555555] hover:bg-[#F5F5F0] hover:text-[#191919] transition-colors"
            >
              <Wallet className="w-4 h-4 text-[#777777]" />
              <span>Fees &amp; Receipts (XAF)</span>
            </Link>
          </div>

          {/* Settings */}
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#999999]">
              Administration
            </div>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2.5 px-2.5 py-1.5 font-medium rounded-[5px] text-[#555555] hover:bg-[#F5F5F0] hover:text-[#191919] transition-colors"
            >
              <Settings className="w-4 h-4 text-[#777777]" />
              <span>Setup &amp; Roles</span>
            </Link>
            <Link
              href="/dashboard/settings/audit-logs"
              className="flex items-center gap-2.5 px-2.5 py-1.5 font-medium rounded-[5px] text-[#555555] hover:bg-[#F5F5F0] hover:text-[#191919] transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#777777]" />
              <span>Audit Log</span>
            </Link>
          </div>
        </nav>

        {/* User Card */}
        <div className="p-2.5 border-t border-[#EBEBE6] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-[#E5E5DF] text-[#333333] flex items-center justify-center font-bold text-[11px] flex-shrink-0">
              {userFullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-[12px] font-semibold text-[#191919] truncate">
                {userFullName}
              </div>
              <div className="text-[10px] text-[#777777] truncate">{userRole}</div>
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              title="Sign out"
              className="p-1 text-[#888888] hover:text-[#C2410C] rounded-[4px] hover:bg-[#F5F5F0] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* System Version Badge */}
        <div className="px-3 py-2 bg-[#F9F9F6] border-t border-[#EBEBE6] flex items-center justify-between text-[10px] text-[#888888]">
          <span className="font-mono font-medium text-[#2A7C13]">
            v{APP_CONFIG.version}
          </span>
          <span className="truncate text-[#999999]" title={APP_CONFIG.compliance.framework}>
            {APP_CONFIG.releaseName}
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-[#E5E5DF] bg-white">
          <div className="flex items-center gap-2 text-[13px]">
            <span className="font-semibold text-[#191919]">{schoolName}</span>
            <span className="text-[#CCCCCC]">·</span>
            <span className="text-[#666666]">2026/2027 Academic Year</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
              Active Session
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
