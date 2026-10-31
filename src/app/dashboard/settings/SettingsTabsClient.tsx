"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Users, 
  CreditCard, 
  Wifi, 
  History, 
  Settings, 
  ShieldCheck, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import type { School, SchoolMembership, Role } from "@/types/database";
import type { SchoolSubscriptionInfo } from "@/types/tenancy";
import type { SchoolHubNode } from "@/lib/hub/hub-service";
import SchoolSettingsClient from "./SchoolSettingsClient";
import StaffRolesClient from "./StaffRolesClient";
import { SchoolBillingSubscription } from "./SchoolBillingSubscription";
import { SchoolHubSettings } from "./SchoolHubSettings";
import SchoolDataPrivacyClient from "./SchoolDataPrivacyClient";

export type SettingsTabId = "profile" | "staff" | "billing" | "hub" | "logs" | "privacy";

interface AuditLogEntry {
  id: string;
  action: string;
  resource_type: string;
  created_at: string;
}

interface Props {
  school: School;
  subscription?: SchoolSubscriptionInfo;
  isHubMode: boolean;
  localLanIp: string;
  hubs: SchoolHubNode[];
  staff: SchoolMembership[];
  roles: Role[];
  canManageStaff: boolean;
  currentUserId?: string;
  recentLogs: AuditLogEntry[];
}

export function SettingsTabsClient({
  school,
  subscription,
  isHubMode,
  localLanIp,
  hubs,
  staff,
  roles,
  canManageStaff,
  currentUserId,
  recentLogs,
}: Props) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");

  const isExpired = subscription?.isExpired ?? false;
  const isTrial = subscription?.isTrial ?? true;
  const daysRemaining = subscription?.daysRemaining ?? 30;
  const subStatus = subscription?.status ?? "trial";

  // Sync with URL hash on mount & when hash changes
  useEffect(() => {
    function readHash(): SettingsTabId {
      const hash = window.location.hash.toLowerCase().replace("#", "");
      if (hash === "license" || hash === "billing" || hash === "subscription") {
        return "billing";
      }
      if (hash === "staff" || hash === "teachers" || hash === "roles") {
        return "staff";
      }
      if (hash === "hub" || hash === "school-hub" || hash === "lan") {
        return "hub";
      }
      if (hash === "logs" || hash === "audit") {
        return "logs";
      }
      if (hash === "privacy" || hash === "data" || hash === "export" || hash === "sovereignty") {
        return "privacy";
      }
      if (hash === "school-settings" || hash === "profile" || hash === "general") {
        return "profile";
      }
      return "profile";
    }

    setActiveTab(readHash());

    const handleHashChange = () => {
      setActiveTab(readHash());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    const hashMapping: Record<SettingsTabId, string> = {
      profile: "school-settings",
      staff: "staff",
      billing: "license",
      hub: "hub",
      logs: "logs",
      privacy: "privacy",
    };
    window.history.replaceState(null, "", `#${hashMapping[tabId]}`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Compact Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8DFC9]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded border border-[#FBE6C2] bg-[#FFF8CF] px-2 py-0.5 text-[11px] font-semibold text-[#7A5B00]">
              <Settings className="w-3 h-3" />
              School Administration
            </span>
            <span className="text-xs text-[#777777]">·</span>
            <span className="text-xs font-mono font-bold text-[#142010]">
              {school.code || school.slug}
            </span>
            <span className="text-xs text-[#777777]">·</span>
            <span className="text-[11px] font-medium text-[#525E4B] bg-[#EAF7E4] border border-[#76C457]/40 px-2 py-0.5 rounded">
              {school.subsystem === "anglophone"
                ? "English Curriculum"
                : school.subsystem === "francophone"
                ? "French Curriculum"
                : "Bilingual Curriculum"}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142010]">
            School Settings
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Configure your school identity, academic policies, teachers, license, and local School Hub.
          </p>
        </div>

        {/* Quick Action & Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick License Status Button */}
          <button
            type="button"
            onClick={() => handleTabChange("billing")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold border transition-all shadow-2xs ${
              isExpired
                ? "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 animate-pulse"
                : subStatus === "active"
                ? "bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]"
                : "bg-[#FFF8CF]/60 hover:bg-[#FFF8CF] text-[#7A5B00] border-[#FBE6C2]"
            }`}
            title="Click to view subscription and payment options"
          >
            {isExpired ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>License Expired · Renew</span>
              </>
            ) : subStatus === "active" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" />
                <span>Active License</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-[#7A5B00]" />
                <span>Trial · {daysRemaining}d left</span>
              </>
            )}
          </button>

          {/* Quick Hub Status Button */}
          <button
            type="button"
            onClick={() => handleTabChange("hub")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-[#FAFAF8] hover:bg-[#F2F1EC] text-[#142010] border border-[#E5E5DF] transition-all shadow-2xs"
            title="Click to manage local Offline School Hub"
          >
            <Wifi className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>School Hub</span>
          </button>

          {/* Activity Log Link */}
          <Link
            href="/dashboard/settings/audit-logs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white hover:bg-[#F9F6ED] text-[#142010] text-xs font-semibold border border-[#D5CBB2] transition-all shadow-2xs"
            title="View system audit trail"
          >
            <History className="w-3.5 h-3.5 text-[#525E4B]" />
            <span>Activity Log</span>
          </Link>
        </div>
      </div>

      {/* ── Expired License Banner (Only if Expired) ────────────────────────── */}
      {isExpired && (
        <div className="p-4 rounded-[8px] bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="font-bold text-red-900">Your school&apos;s trial has expired</p>
              <p className="text-red-700 text-[11.5px] mt-0.5">
                Report card printing and rankings are paused. Activate your school license to restore full access.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleTabChange("billing")}
            className="px-3.5 py-1.5 rounded-[5px] bg-red-700 hover:bg-red-800 text-white font-bold text-xs shrink-0 transition-colors shadow-2xs"
          >
            View Payment Instructions &rarr;
          </button>
        </div>
      )}

      {/* ── Settings Navigation Tab Bar ────────────────────────────────────── */}
      <div className="border-b border-[#E8DFC9] bg-white rounded-t-[8px] px-2 sm:px-4 pt-1 shadow-2xs">
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto scrollbar-none" aria-label="Settings Tabs">
          {/* Tab 1: School Profile & Rules */}
          <button
            type="button"
            onClick={() => handleTabChange("profile")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-[13px] font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === "profile"
                ? "border-[#2A7C13] text-[#2A7C13] bg-[#FFF8CF]/20 rounded-t-[6px]"
                : "border-transparent text-[#555555] hover:text-[#142010] hover:border-[#D5CBB2]"
            }`}
          >
            <Building2 className={`w-4 h-4 shrink-0 ${activeTab === "profile" ? "text-[#2A7C13]" : "text-[#777777]"}`} />
            <span>School Details &amp; Rules</span>
          </button>

          {/* Tab 2: Staff & Roles */}
          <button
            type="button"
            onClick={() => handleTabChange("staff")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-[13px] font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === "staff"
                ? "border-[#2A7C13] text-[#2A7C13] bg-[#FFF8CF]/20 rounded-t-[6px]"
                : "border-transparent text-[#555555] hover:text-[#142010] hover:border-[#D5CBB2]"
            }`}
          >
            <Users className={`w-4 h-4 shrink-0 ${activeTab === "staff" ? "text-[#2A7C13]" : "text-[#777777]"}`} />
            <span>Staff &amp; Roles</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40 shrink-0">
              {staff.length}
            </span>
          </button>

          {/* Tab 3: License & Billing */}
          <button
            type="button"
            onClick={() => handleTabChange("billing")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-[13px] font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === "billing"
                ? "border-[#2A7C13] text-[#2A7C13] bg-[#FFF8CF]/20 rounded-t-[6px]"
                : "border-transparent text-[#555555] hover:text-[#142010] hover:border-[#D5CBB2]"
            }`}
          >
            <CreditCard className={`w-4 h-4 shrink-0 ${activeTab === "billing" ? "text-[#2A7C13]" : "text-[#777777]"}`} />
            <span>License &amp; Billing</span>
            {isExpired ? (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-100 text-red-700 shrink-0">
                Action
              </span>
            ) : (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FFF8CF] text-[#7A5B00] border border-[#FBE6C2] shrink-0">
                {daysRemaining}d
              </span>
            )}
          </button>

          {/* Tab 4: Offline School Hub */}
          <button
            type="button"
            onClick={() => handleTabChange("hub")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-[13px] font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === "hub"
                ? "border-[#2A7C13] text-[#2A7C13] bg-[#FFF8CF]/20 rounded-t-[6px]"
                : "border-transparent text-[#555555] hover:text-[#142010] hover:border-[#D5CBB2]"
            }`}
          >
            <Wifi className={`w-4 h-4 shrink-0 ${activeTab === "hub" ? "text-[#2A7C13]" : "text-[#777777]"}`} />
            <span>Offline School Hub</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FAFAF8] text-[#555555] border border-[#E5E5DF] shrink-0">
              LAN
            </span>
          </button>

          {/* Tab 5: Recent Logs */}
          <button
            type="button"
            onClick={() => handleTabChange("logs")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-[13px] font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === "logs"
                ? "border-[#2A7C13] text-[#2A7C13] bg-[#FFF8CF]/20 rounded-t-[6px]"
                : "border-transparent text-[#555555] hover:text-[#142010] hover:border-[#D5CBB2]"
            }`}
          >
            <History className={`w-4 h-4 ${activeTab === "logs" ? "text-[#2A7C13]" : "text-[#777777]"}`} />
            <span>Activity Logs</span>
          </button>

          {/* Tab 6: Data Sovereignty & Privacy */}
          <button
            type="button"
            onClick={() => handleTabChange("privacy")}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-[13px] font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === "privacy"
                ? "border-[#2A7C13] text-[#2A7C13] bg-[#FFF8CF]/20 rounded-t-[6px]"
                : "border-transparent text-[#555555] hover:text-[#142010] hover:border-[#D5CBB2]"
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeTab === "privacy" ? "text-[#2A7C13]" : "text-[#777777]"}`} />
            <span>Data Sovereignty &amp; Privacy</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40 shrink-0">
              Takeout
            </span>
          </button>
        </nav>
      </div>

      {/* ── Tab Content Views ──────────────────────────────────────────────── */}
      <div>
        {/* Tab 1: School Profile & Academic Rules */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-in fade-in-50 duration-150">
            <SchoolSettingsClient school={school} />
          </div>
        )}

        {/* Tab 2: Staff & Role Assignments */}
        {activeTab === "staff" && (
          <div className="space-y-6 animate-in fade-in-50 duration-150">
            <StaffRolesClient
              memberships={staff}
              roles={roles}
              canManageStaff={canManageStaff}
              currentUserId={currentUserId}
            />
          </div>
        )}

        {/* Tab 3: License & Billing */}
        {activeTab === "billing" && (
          <div className="space-y-6 animate-in fade-in-50 duration-150">
            <SchoolBillingSubscription
              schoolName={school.name}
              schoolCode={school.code || school.slug}
              subscription={subscription}
            />
          </div>
        )}

        {/* Tab 4: Offline School Hub */}
        {activeTab === "hub" && (
          <div className="space-y-6 animate-in fade-in-50 duration-150">
            <SchoolHubSettings
              schoolId={school.id}
              schoolName={school.name}
              schoolCode={school.code || school.slug}
              isHubMode={isHubMode}
              localLanIp={localLanIp}
              hubs={hubs}
            />
          </div>
        )}

        {/* Tab 5: Activity Logs */}
        {activeTab === "logs" && (
          <div className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-6 shadow-sm space-y-4 animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFC9]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2A7C13]" />
                <div>
                  <h3 className="font-bold text-[14px] text-[#142010]">
                    Recent Administrative Changes
                  </h3>
                  <p className="text-xs text-[#666666]">
                    Security audit log showing sensitive actions and mark alterations.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/settings/audit-logs"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-white border border-[#D5CBB2] text-xs font-semibold text-[#142010] hover:bg-[#F9F6ED] transition-colors"
              >
                <span>Full Audit Log Archive</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#2A7C13]" />
              </Link>
            </div>

            {recentLogs.length === 0 ? (
              <p className="text-xs text-[#777777] py-6 text-center">
                No administrative events logged yet.
              </p>
            ) : (
              <div className="divide-y divide-[#EFE7D5] text-xs">
                {recentLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between">
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
        )}

        {/* Tab 6: Data Sovereignty & Privacy */}
        {activeTab === "privacy" && (
          <div className="space-y-6 animate-in fade-in-50 duration-150">
            <SchoolDataPrivacyClient school={school} />
          </div>
        )}
      </div>
    </div>
  );
}
