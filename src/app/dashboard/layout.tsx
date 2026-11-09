import { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTenantContext, getUserSchools } from "@/lib/tenancy/context";
import { getActiveAcademicYear } from "@/lib/academic/service";
import { signOutAction } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import DashboardNavigation from "./DashboardNavigation";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { MobileBottomNav } from "./MobileBottomNav";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { GlobalSystemStateMonitor } from "@/components/ui/states";
import { OfflineVaultSynchronizer } from "@/components/offline/OfflineVaultSynchronizer";
import { SchoolSwitcher } from "@/components/schools/SchoolSwitcher";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { FirstLoginPinModal } from "@/components/auth/FirstLoginPinModal";
import { LogOut, Globe, Clock, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const [tenantContext, userSchools] = await Promise.all([
    getTenantContext(),
    getUserSchools(),
  ]);

  if (!tenantContext) {
    redirect("/onboarding");
  }

  const schoolName = tenantContext.school.name;
  const userFullName = tenantContext.user.full_name;
  const userRole = tenantContext.role.name;
  const activeYear = await getActiveAcademicYear(tenantContext.school.id);
  const academicYearLabel = activeYear?.name || "Academic year not set";
  const isDemo =
    tenantContext.school.slug === "demo-bilingual-high-school" ||
    tenantContext.user.email === "demo@nsei-sukul.klarifypath.com";
  const isAdmin =
    tenantContext.isSuperAdmin ||
    ["school_admin", "principal", "superadmin"].includes(tenantContext.role.code);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAF8] text-[#191919] font-sans print:min-h-0 print:bg-white print:block">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#E5E5DF] bg-white flex-shrink-0 min-h-screen sticky top-0 h-screen print:hidden">
        {/* School brand, Switcher & Public Site Tour Link */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-[#EBEBE6] gap-2">
          <div className="flex-1 min-w-0">
            <SchoolSwitcher
              currentSchool={tenantContext.school}
              currentRole={tenantContext.role}
              availableSchools={userSchools}
              variant="sidebar"
            />
          </div>

          <Link
            href="/"
            title="Explore Public Website & Tour"
            className="p-1.5 text-[#888888] hover:text-[#2A7C13] hover:bg-[#F0FDF4] rounded-[5px] transition-colors shrink-0"
          >
            <Globe className="w-4 h-4" />
          </Link>
        </div>

        {/* Navigation */}
        <DashboardNavigation
          className="flex-1 px-2 py-3 overflow-y-auto"
          roleCode={tenantContext.role.code}
          isClassMaster={tenantContext.isClassMaster}
          isHod={tenantContext.isHod}
          isSuperAdmin={tenantContext.isSuperAdmin}
        />

        {/* PWA Install Button (Sidebar) */}
        <div className="px-3 pb-2">
          <PwaInstallButton variant="sidebar" />
        </div>

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
                <div className="text-[10px] text-[#AAAAAA] truncate">
                  {tenantContext.isClassMaster && tenantContext.role.code === "teacher"
                    ? `${userRole} & Class Master`
                    : userRole}
                </div>
              </div>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                className="p-1.5 text-[#AAAAAA] hover:text-[#C2410C] rounded-[4px] hover:bg-[#FFF0F0] transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 print:block print:w-full">
        {isDemo && <DemoBanner schoolName={schoolName} />}
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between h-14 px-3 sm:px-4 border-b border-[#E5E5DF] bg-white sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2 overflow-hidden">
            <MobileNavDrawer
              currentSchool={tenantContext.school}
              availableSchools={userSchools}
              schoolName={schoolName}
              logoUrl={tenantContext.school.logo_url}
              academicYearLabel={academicYearLabel}
              userFullName={userFullName}
              userRole={userRole}
              roleCode={tenantContext.role.code}
              isClassMaster={tenantContext.isClassMaster}
              isHod={tenantContext.isHod}
          isSuperAdmin={tenantContext.isSuperAdmin}
        />
            <div className="overflow-hidden">
              <span className="font-bold text-xs text-[#191919] truncate block">{schoolName}</span>
              <span className="text-[10px] text-[#888888] truncate block">{academicYearLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Subtle trial badge in top header for continuous awareness (Administrators only) */}
            {isAdmin && tenantContext.subscription?.isTrial && !tenantContext.subscription.isExpired && (
              <Link
                href="/dashboard/settings#billing"
                title="View trial details and license options"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#FFF8CF] border border-[#FBE6C2] text-[#7A5B00] text-[10px] font-bold hover:bg-[#FEF08A] transition-colors"
              >
                <Clock className="w-3 h-3 text-[#B45309]" />
                <span>Pilot: {tenantContext.subscription.daysRemaining}d left</span>
              </Link>
            )}

            <Link
              href="/"
              title="Explore Public Site & Features"
              className="p-2 text-[#666666] hover:text-[#2A7C13] rounded-[4px] hover:bg-[#F0FDF4] flex items-center justify-center min-w-[36px] min-h-[36px] transition-colors"
            >
              <Globe className="w-4 h-4" />
            </Link>
            <span className="text-[11px] text-[#555555] font-semibold px-2 py-0.5 rounded bg-[#F1F1ED] hidden sm:inline-block max-w-[120px] truncate">{userRole}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                className="p-2 text-[#888888] hover:text-[#C2410C] rounded-[4px] hover:bg-red-50 flex items-center justify-center min-w-[36px] min-h-[36px]"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Main content area with progressive trial awareness banners (Administrators only) */}
        
        {/* 1. Trial Expired: Read-Only Grace & 90-Day Safe Preservation Banner */}
        {isAdmin && tenantContext.subscription?.isExpired && (
          <div className="bg-[#FFFDF5] border-b-2 border-red-300 px-4 py-3 text-xs text-[#142010] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs print:hidden">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0 mt-0.5 sm:mt-0" />
              <div className="space-y-0.5">
                <div className="font-bold text-red-800 flex items-center gap-2 flex-wrap">
                  <span>30-Day Pilot Concluded : Safe Grace Period Active</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                    Data Preserved (90 Days)
                  </span>
                </div>
                <p className="text-[11px] text-[#555555] leading-relaxed">
                  Your school data (students, marks, faculty) is safely preserved. New marks and PDF exports are paused. Activate your school license via MTN MoMo <strong>682 833 601</strong> (Nsei Sukul Technologies) to continue immediately without starting over.
                </p>
              </div>
            </div>
            <a
              href="/dashboard/settings#billing"
              className="px-3.5 py-1.5 rounded-[5px] bg-[#142010] hover:bg-[#20361a] text-white font-bold text-xs transition-colors shrink-0 text-center shadow-xs cursor-pointer"
            >
              Activate Full License
            </a>
          </div>
        )}

        {/* 2. Trial Final Countdown (< 4 days) */}
        {isAdmin &&
          tenantContext.subscription?.isTrial &&
          !tenantContext.subscription.isExpired &&
          tenantContext.subscription.daysRemaining <= 3 && (
            <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-4 py-2.5 text-xs text-[#991B1B] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
                <span>
                  <strong>Final {tenantContext.subscription.daysRemaining} Days of Pilot:</strong> Your school evaluation period ends soon. Activate your annual license to ensure uninterrupted teacher grading and report card generation.
                </span>
              </div>
              <a
                href="/dashboard/settings#billing"
                className="px-3 py-1 rounded-[4px] bg-[#DC2626] text-white font-bold hover:bg-[#B91C1C] transition-colors shrink-0 text-center text-xs"
              >
                Activate License
              </a>
            </div>
          )}

        {/* 3. Trial 7-Day Warning (4 to 7 days remaining) */}
        {isAdmin &&
          tenantContext.subscription?.isTrial &&
          !tenantContext.subscription.isExpired &&
          tenantContext.subscription.daysRemaining <= 7 &&
          tenantContext.subscription.daysRemaining > 3 && (
            <div className="bg-[#FFF8CF] border-b border-[#FBE6C2] px-4 py-2 text-xs text-[#7A5B00] flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#B45309] shrink-0" />
                <span>
                  <strong>Pilot Evaluation:</strong> {tenantContext.subscription.daysRemaining} days remaining on your 30-day evaluation. Your school records and marks are actively building.
                </span>
              </div>
              <a
                href="/dashboard/settings#billing"
                className="px-2.5 py-1 rounded-[4px] bg-[#7A5B00] text-white font-bold hover:bg-[#5E4600] transition-colors shrink-0 text-[11px] text-center"
              >
                Renew License
              </a>
            </div>
          )}

        {/* 4. Trial Midway Checkpoint (Day 15) */}
        {isAdmin &&
          tenantContext.subscription?.isTrial &&
          !tenantContext.subscription.isExpired &&
          tenantContext.subscription.daysRemaining === 15 && (
            <div className="bg-[#EFF6FF] border-b border-[#BFDBFE] px-4 py-2 text-xs text-[#1E40AF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6] shrink-0" />
                <span>
                  <strong>Midway Checkpoint:</strong> 15 days remaining on your 30-day school pilot. You can review license options or activate anytime in Settings.
                </span>
              </div>
              <a
                href="/dashboard/settings#billing"
                className="px-2.5 py-1 rounded-[4px] bg-[#1E40AF] text-white font-bold hover:bg-[#1E3A8A] transition-colors shrink-0 text-[11px] text-center"
              >
                View Billing
              </a>
            </div>
          )}

        {/* Global Network, Offline, Slow 2G & Session States */}
        <GlobalSystemStateMonitor />

        {/* Offline Vault & Teaching Scope Auto-Synchronizer */}
        <OfflineVaultSynchronizer
          user={{
            id: tenantContext.user.id,
            fullName: tenantContext.user.full_name,
            email: tenantContext.user.email,
          }}
          role={{
            code: tenantContext.role.code,
            name: tenantContext.role.name,
          }}
          school={{
            id: tenantContext.school.id,
            name: tenantContext.school.name,
          }}
          availableSchools={userSchools}
        />

        {/* First-Login Secret PIN Shield for Teachers */}
        {tenantContext.needsPinSetup && !isDemo && (
          <FirstLoginPinModal teacherName={userFullName} />
        )}

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-20 md:pb-8 print:p-0 print:m-0 print:overflow-visible print:w-full print:block">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (Home, Marks, Students, Attendance) */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
