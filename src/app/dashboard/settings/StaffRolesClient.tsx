"use client";

import { useState } from "react";
import { SchoolMembership, Role } from "@/types/database";
import { updateStaffRoleAction } from "./actions";
import { Users, Shield, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  memberships: SchoolMembership[];
  roles: Role[];
}

export default function StaffRolesClient({ memberships, roles }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleRoleChange(membershipId: string, roleId: string, currentTitle: string | null) {
    setUpdatingId(membershipId);
    setStatusMessage(null);

    const formData = new FormData();
    formData.set("membership_id", membershipId);
    formData.set("role_id", roleId);
    if (currentTitle) formData.set("title", currentTitle);

    try {
      await updateStaffRoleAction(formData);
      setStatusMessage({ type: "success", text: "Staff authorization updated successfully!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update staff role";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E8DFC9]">
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 text-[#2A7C13]" />
          <div>
            <h3 className="font-bold text-[14px] text-[#142010]">
              Staff Members &amp; RBAC Role Delegation
            </h3>
            <p className="text-[11px] text-[#777777]">
              Assign administrative, pedagogic, and bursar privileges to verified institutional staff
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#EBF5E9] text-[#1F5C0E] font-semibold border border-[#C3E4BC]">
          {memberships.length} Active Staff
        </span>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-2.5 rounded-[5px] text-xs font-medium border ${
            statusMessage.type === "success"
              ? "bg-[#F3F9F1] border-[#C3E4BC] text-[#1F5C0E]"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2A7C13]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E8DFC9] bg-[#F7F3E8] text-[#444444] font-semibold">
              <th className="py-2.5 px-3">Staff Name</th>
              <th className="py-2.5 px-3">Email Address</th>
              <th className="py-2.5 px-3">Functional Title</th>
              <th className="py-2.5 px-3">Assigned Role</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE7D5]">
            {memberships.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#777777]">
                  No staff memberships registered for this institution yet.
                </td>
              </tr>
            ) : (
              memberships.map((m) => (
                <tr key={m.id} className="hover:bg-[#FAF6EC] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#142010]">
                    {m.user?.full_name || "Staff Member"}
                  </td>
                  <td className="py-2.5 px-3 text-[#666666]">
                    {m.user?.email || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-[#555555]">
                    {m.title || "Academic Staff"}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={m.role_id}
                        disabled={updatingId === m.id}
                        onChange={(e) =>
                          handleRoleChange(m.id, e.target.value, m.title)
                        }
                        className="px-2.5 py-1.5 border border-[#D5CBB2] rounded-[5px] bg-white text-[#142010] font-medium text-xs focus:outline-none focus:border-[#2A7C13] disabled:opacity-50"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      {updatingId === m.id && (
                        <span className="text-[10px] text-[#2A7C13] animate-pulse font-medium">
                          Updating...
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EBF5E9] text-[#1F5C0E] border border-[#C3E4BC]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2A7C13]" />
                      Active
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
