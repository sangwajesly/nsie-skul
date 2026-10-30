import { getTenantContext } from "@/lib/tenancy/context";
import { 
  getSchoolSettings, 
  getSchoolStaffMemberships, 
  getSystemRoles, 
  getSchoolAuditLogs 
} from "@/lib/admin/service";
import { getSchoolHubs, isSchoolHubInstance, getLocalServerLanIp } from "@/lib/hub/hub-service";
import { SettingsTabsClient } from "./SettingsTabsClient";

export default async function SettingsPage() {
  const context = await getTenantContext();
  if (!context) {
    return (
      <div className="p-8 text-center text-sm text-[#777777]">
        Unauthorized or session expired.
      </div>
    );
  }

  const [school, staff, roles, recentLogs, hubs] = await Promise.all([
    getSchoolSettings(context.school.id),
    getSchoolStaffMemberships(context.school.id),
    getSystemRoles(),
    getSchoolAuditLogs(context.school.id, 10),
    getSchoolHubs(context.school.id),
  ]);

  if (!school) {
    return (
      <div className="p-8 text-center text-sm text-[#777777]">
        School record could not be loaded.
      </div>
    );
  }

  return (
    <SettingsTabsClient
      school={school}
      subscription={context.subscription}
      isHubMode={isSchoolHubInstance()}
      localLanIp={getLocalServerLanIp()}
      hubs={hubs}
      staff={staff}
      roles={roles}
      canManageStaff={context.hasPermission("staff.manage")}
      currentUserId={context.user.id}
      recentLogs={recentLogs}
    />
  );
}
