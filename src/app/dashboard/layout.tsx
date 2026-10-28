import { ReactNode } from "react";
import { getTenantContext } from "@/lib/tenancy/context";
import { getActiveAcademicYear } from "@/lib/academic/service";
import { signOutAction } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import DashboardNavigation from "./DashboardNavigation";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { LogOut } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    redirect("/onboarding");
  }

  const schoolName = tenantContext.school.name;
  const userFullName = tenantContext.user.full_name;
  const userRole = tenantContext.role.name;
  const activeYear = await getActiveAcademicYear(tenantContext.school.id);
  const academicYearLabel = activeYear?.name || "Academic year not set";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAF8] text-[#191919] font-sans print:min-h-0 print:bg-white print:block">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#E5E5DF] bg-white flex-shrink-0 min-h-screen sticky top-0 h-screen print:hidden">
        {/* School brand */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[#EBEBE6]">
          <div className="w-8 h-8 rounded-[6px] bg-[#142010] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden">
            {tenantContext.school.logo_url ? (
              <img
                src={tenantContext.school.logo_url}
                alt={schoolName}
                className="w-full h-full object-contain p-0.5 bg-white"
              />
            ) : (
              schoolName.charAt(0)
            )}
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
        <DashboardNavigation
          className="flex-1 px-2 py-3 overflow-y-auto"
          roleCode={tenantContext.role.code}
          isClassMaster={tenantContext.isClassMaster}
          isHod={tenantContext.isHod}
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
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between h-14 px-3 sm:px-4 border-b border-[#E5E5DF] bg-white sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2 overflow-hidden">
            <MobileNavDrawer
              schoolName={schoolName}
              logoUrl={tenantContext.school.logo_url}
              academicYearLabel={academicYearLabel}
              userFullName={userFullName}
              userRole={userRole}
              roleCode={tenantContext.role.code}
              isClassMaster={tenantContext.isClassMaster}
              isHod={tenantContext.isHod}
            />
            <div className="overflow-hidden">
              <span className="font-bold text-xs text-[#191919] truncate block">{schoolName}</span>
              <span className="text-[10px] text-[#888888] truncate block">{academicYearLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#555555] font-semibold px-2 py-0.5 rounded bg-[#F1F1ED]">{userRole}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                className="p-1.5 text-[#888888] hover:text-[#C2410C]"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Main content area with consistent gutters and breathing room */}
        {/* Subscription Expired / Action Required Banner */}
        {tenantContext.subscription?.isExpired && (
          <div className="bg-[#FEF2F2] border-b border-[#FCA5A5] px-4 py-2.5 text-xs text-[#991B1B] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse shrink-0" />
              <span>
                <strong>School License Expired:</strong> Report card printing and bulk PDF exports are paused. To activate your school license, send payment via MTN MoMo <strong>682 833 601</strong> (Mbongih Jesly Sangwa).
              </span>
            </div>
            <a
              href="/dashboard/settings#license"
              className="px-3 py-1 rounded-[5px] bg-[#DC2626] text-white font-bold hover:bg-[#B91C1C] transition-colors shrink-0 text-center"
            >
              Activate School License
            </a>
          </div>
        )}

        {/* Trial Days Reminder (< 8 days) */}
        {tenantContext.subscription?.isTrial &&
          tenantContext.subscription.daysRemaining <= 7 &&
          !tenantContext.subscription.isExpired && (
            <div className="bg-[#FFF8CF] border-b border-[#FBE6C2] px-4 py-2 text-xs text-[#7A5B00] flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#B45309] shrink-0" />
                <span>
                  <strong>Pilot Trial:</strong> {tenantContext.subscription.daysRemaining} days remaining on your school evaluation.
                </span>
              </div>
              <a
                href="/dashboard/settings#license"
                className="px-2.5 py-1 rounded-[4px] bg-[#7A5B00] text-white font-bold hover:bg-[#5E4600] transition-colors shrink-0 text-[11px] text-center"
              >
                Renew License
              </a>
            </div>
          )}

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 print:p-0 print:m-0 print:overflow-visible print:w-full print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
