import { ReactNode } from "react";
import { getTenantContext } from "@/lib/tenancy/context";
import { getActiveAcademicYear } from "@/lib/academic/service";
import { signOutAction } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import DashboardNavigation from "./DashboardNavigation";
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
        <div className="md:hidden flex items-center justify-between h-14 px-4 border-b border-[#E5E5DF] bg-white sticky top-0 z-20 print:hidden">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-[5px] bg-[#142010] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden">
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
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 print:p-0 print:m-0 print:overflow-visible print:w-full print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
