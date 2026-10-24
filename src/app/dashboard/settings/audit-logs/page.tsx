import { getTenantContext } from "@/lib/tenancy/context";
import AccessDenied from "@/components/AccessDenied";
import { getSchoolAuditLogs } from "@/lib/admin/service";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Clock, Filter, FileText } from "lucide-react";

export default async function AuditLogsPage() {
  const context = await getTenantContext();
  if (!context) {
    return (
      <div className="p-8 text-center text-sm text-[#777777]">
        Unauthorized or session expired.
      </div>
    );
  }

  if (!context.hasPermission("audit.view")) {
    return <AccessDenied message="The school audit trail is restricted to authorized school leaders." />;
  }

  const logs = await getSchoolAuditLogs(context.school.id, 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DFC9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1 text-xs text-[#2A7C13] hover:underline font-medium"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Settings
            </Link>
            <span className="text-xs text-[#777777]">·</span>
            <span className="text-xs text-[#777777] font-semibold">
              Compliance &amp; Security
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142010]">
            Immutable System Audit Trail
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            Tamper-evident log of administrative actions, marks modifications, approvals, and bursary adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-[5px] bg-[#FFF8CF] text-[#7A5B00] border border-[#FBE6C2] font-semibold">
            {logs.length} Logged Entries
          </span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DFC9]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#142010]">
            <Clock className="w-4 h-4 text-[#2A7C13]" />
            <span>Chronological Event Records</span>
          </div>
          <span className="text-[11px] text-[#777777]">
            Showing most recent events (Retention: Indefinite)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E8DFC9] bg-[#F7F3E8] text-[#444444] font-semibold">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Resource</th>
                <th className="py-2.5 px-3">Context &amp; Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE7D5]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#777777]">
                    <ShieldAlert className="w-8 h-8 text-[#A89F87] mx-auto mb-2 opacity-50" />
                    <p className="font-medium">No audit events recorded yet.</p>
                    <p className="text-[11px] text-[#888888] mt-0.5">
                      Actions like saving settings, editing marks, or logging payments will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF6EC] transition-colors">
                    <td className="py-2.5 px-3 text-[#666666] whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-[#EBF5E9] text-[#1F5C0E] border border-[#C3E4BC]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#444444]">
                      <span className="font-semibold text-[#142010]">
                        {log.resource_type}
                      </span>
                      {log.resource_id && (
                        <span className="text-[10px] text-[#777777] ml-1 font-mono">
                          ({log.resource_id.substring(0, 8)}...)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <pre className="text-[10px] font-mono bg-white border border-[#E8DFC9] p-1.5 rounded text-[#333333] max-w-md overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
