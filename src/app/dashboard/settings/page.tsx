import { getTenantContext } from "@/lib/tenancy/context";
import { createClient } from "@/lib/supabase/server";
import { AcademicYear } from "@/types/database";
import { 
  getSchoolSettings, 
  getSchoolStaffMemberships, 
  getSystemRoles, 
  getSchoolAuditLogs 
} from "@/lib/admin/service";
import SchoolSettingsClient from "./SchoolSettingsClient";
import StaffRolesClient from "./StaffRolesClient";
import Link from "next/link";
import { Settings, ShieldCheck, History } from "lucide-react";

export default async function SettingsPage() {
  const context = await getTenantContext();
  if (!context) {
    return (
      <div className="p-8 text-center text-sm text-[#777777]">
        Unauthorized or session expired.
      </div>
    );
  }

  const getAcademicYears = async (): Promise<AcademicYear[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("academic_years")
      .select("*")
      .eq("school_id", context.school.id)
      .order("start_date", { ascending: false });

    return (data as AcademicYear[]) || [];
  };

  const [school, staff, roles, recentLogs, academicYears] = await Promise.all([
    getSchoolSettings(context.school.id),
    getSchoolStaffMemberships(context.school.id),
    getSystemRoles(),
    getSchoolAuditLogs(context.school.id, 10),
    getAcademicYears(),
  ]);

  if (!school) {
    return (
      <div className="p-8 text-center text-sm text-[#777777]">
        School record could not be loaded.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFC9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded border border-[#FBE6C2] bg-[#FFF8CF] px-2 py-0.5 text-[11px] font-semibold text-[#7A5B00]">
              <Settings className="w-3 h-3" />
              School Administration
            </span>
            <span className="text-xs text-[#777777]">·</span>
            <span className="text-xs text-[#555555] font-mono">
              {school.code || school.slug}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142010]">
            School &amp; Staff Settings
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Manage staff access, school information, report card rules and receipt numbers.
          </p>
        </div>

        <Link
          href="/dashboard/settings/audit-logs"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-[5px] bg-[#FFFDF5] border border-[#D5CBB2] text-[#142010] text-xs font-semibold hover:bg-[#F9F6ED] transition-all shadow-sm"
        >
          <History className="w-3.5 h-3.5 text-[#2A7C13]" />
          <span>View Activity Log</span>
        </Link>
      </div>

      {/* Main Settings Tabs / Sections */}
      <div className="space-y-8">
        <SchoolSettingsClient school={school} academicYears={academicYears} />

        <StaffRolesClient
          memberships={staff}
          roles={roles}
          canManageStaff={context.hasPermission("staff.manage")}
        />

        {/* Recent Audit Summary Preview */}
        <div className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E8DFC9]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2A7C13]" />
              <h3 className="font-bold text-[13px] text-[#142010]">
                Recent Changes
              </h3>
            </div>
            <Link
              href="/dashboard/settings/audit-logs"
              className="text-xs font-semibold text-[#2A7C13] hover:underline"
            >
              See all ({recentLogs.length} events logged) &rarr;
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <p className="text-xs text-[#777777] py-3 text-center">
              No administrative events logged yet.
            </p>
          ) : (
            <div className="divide-y divide-[#EFE7D5] text-xs">
              {recentLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-mono font-semibold text-[#142010]">
                      {log.action}
                    </span>
                    <span className="text-[#777777] ml-2 text-[11px]">
                      on {log.resource_type}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#888888]">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
