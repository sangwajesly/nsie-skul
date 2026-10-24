"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SchoolMembership, Role } from "@/types/database";
import {
  addStaffMemberAction,
  updateStaffRoleAction,
  toggleStaffStatusAction,
  removeStaffMembershipAction,
} from "./actions";
import {
  UserPlus,
  Users,
  CheckCircle2,
  AlertCircle,
  UserX,
  RotateCcw,
  Trash2,
  ShieldAlert,
} from "lucide-react";

interface Props {
  memberships: SchoolMembership[];
  roles: Role[];
  canManageStaff: boolean;
  currentUserId?: string;
}

const roleLabels: Record<string, string> = {
  school_admin: "School Administrator",
  principal: "Principal / Academic Dean",
  teacher: "Teacher / Academic Faculty",
  bursar: "Finance Officer / Bursar",
  class_master: "Teacher (Class Master)",
  hod: "Teacher (Head of Department)",
};

// Base account access roles when registering new staff
const primaryRoleCodes = ["teacher", "principal", "school_admin", "bursar"];

export default function StaffRolesClient({
  memberships,
  roles,
  canManageStaff,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<{ id: string; name: string } | null>(null);
  const schoolRoles = roles.filter((role) => role.code !== "superadmin");

  async function handleAddStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setUpdatingId("new-staff");
    setStatusMessage(null);

    try {
      await addStaffMemberAction(new FormData(form));
      form.reset();
      setStatusMessage({ type: "success", text: "Staff member added to this school." });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not add this staff member.";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setUpdatingId(null);
    }
  }

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

  async function handleToggleStatus(membershipId: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    setUpdatingId(membershipId);
    setStatusMessage(null);

    const formData = new FormData();
    formData.set("membershipId", membershipId);
    formData.set("status", newStatus);

    try {
      await toggleStaffStatusAction(formData);
      setStatusMessage({
        type: "success",
        text: newStatus === "suspended" ? "Staff platform access suspended." : "Staff access reactivated.",
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change staff status";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleConfirmRemove() {
    if (!confirmRemoveMember) return;
    const { id: membershipId, name } = confirmRemoveMember;
    setUpdatingId(membershipId);
    setStatusMessage(null);
    setConfirmRemoveMember(null);

    const formData = new FormData();
    formData.set("membershipId", membershipId);

    try {
      await removeStaffMembershipAction(formData);
      setStatusMessage({
        type: "success",
        text: `${name} has been removed from this school. Any teaching duties have been unassigned.`,
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove staff member";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div id="staff" className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E8DFC9]">
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 text-[#2A7C13]" />
          <div>
            <h3 className="font-bold text-[14px] text-[#142010]">
              Teachers &amp; Staff
            </h3>
            <p className="text-[11px] text-[#777777]">
              Add staff accounts and choose what they can access.
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#EBF5E9] text-[#1F5C0E] font-semibold border border-[#C3E4BC]">
          {memberships.filter((membership) => membership.status === "active").length} Active
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

      {canManageStaff && (
        <form onSubmit={handleAddStaff} className="grid grid-cols-1 gap-3 rounded-[6px] border border-[#E8DFC9] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-4">
            <h4 className="text-sm font-bold text-[#142010]">Add a Teacher or Staff Member</h4>
            <p className="mt-1 text-xs text-[#666666]">
              They must create a Nsei Skul account first. Enter the same email address they used to register.
            </p>
            <p className="mt-1 text-[11px] text-[#2A7C13] font-medium">
              💡 Tip: Register all teaching faculty as &ldquo;Teacher / Academic Faculty&rdquo;. Class Master appointments, subjects taught, and department heads are assigned under Classes &amp; Subjects.
            </p>
          </div>
          <div>
            <label htmlFor="staff-email" className="mb-1 block text-xs font-semibold text-[#444444]">
              Registered email address
            </label>
            <input
              id="staff-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-[5px] border border-[#D5CBB2] bg-white px-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="staff-role" className="mb-1 block text-xs font-semibold text-[#444444]">
              School role
            </label>
            <select
              id="staff-role"
              name="roleId"
              required
              defaultValue=""
              className="w-full rounded-[5px] border border-[#D5CBB2] bg-white px-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none"
            >
              <option value="" disabled>Select a role</option>
              {schoolRoles
                .slice()
                .sort((a, b) => {
                  const aIdx = primaryRoleCodes.indexOf(a.code);
                  const bIdx = primaryRoleCodes.indexOf(b.code);
                  return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
                })
                .map((role) => (
                  <option key={role.id} value={role.id}>
                    {roleLabels[role.code] || role.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="staff-title" className="mb-1 block text-xs font-semibold text-[#444444]">
              Job title (optional)
            </label>
            <input
              id="staff-title"
              name="title"
              type="text"
              placeholder="e.g. Mathematics Teacher"
              className="w-full rounded-[5px] border border-[#D5CBB2] bg-white px-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={updatingId === "new-staff"}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-[5px] bg-[#191919] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#333333] disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" />
              {updatingId === "new-staff" ? "Adding..." : "Add Staff Member"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E8DFC9] bg-[#F7F3E8] text-[#444444] font-semibold">
              <th className="py-2.5 px-3">Staff Name</th>
              <th className="py-2.5 px-3">Email Address</th>
              <th className="py-2.5 px-3">Job Title</th>
              <th className="py-2.5 px-3">School Role</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              {canManageStaff && <th className="py-2.5 px-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE7D5]">
            {memberships.length === 0 ? (
              <tr>
                <td colSpan={canManageStaff ? 6 : 5} className="py-8 text-center text-[#777777]">
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
                    {m.title || "Staff member"}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={m.role_id}
                        disabled={!canManageStaff || updatingId === m.id || m.status === "suspended"}
                        onChange={(e) =>
                          handleRoleChange(m.id, e.target.value, m.title)
                        }
                        className="px-2.5 py-1.5 border border-[#D5CBB2] rounded-[5px] bg-white text-[#142010] font-medium text-xs focus:outline-none focus:border-[#2A7C13] disabled:opacity-50"
                      >
                        {schoolRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {roleLabels[r.code] || r.name}
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
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      m.status === "active"
                        ? "border-[#C3E4BC] bg-[#EBF5E9] text-[#1F5C0E]"
                        : m.status === "invited"
                        ? "border-[#FBE6C2] bg-[#FFF8CF] text-[#7A5B00]"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        m.status === "active" ? "bg-[#2A7C13]" : m.status === "invited" ? "bg-[#B45309]" : "bg-red-600"
                      }`} />
                      {m.status === "active" ? "Active" : m.status === "invited" ? "Pending" : "Suspended"}
                    </span>
                  </td>
                  {canManageStaff && (
                    <td className="py-2.5 px-3 text-right">
                      {m.user_id === currentUserId ? (
                        <span className="text-[10px] text-[#888888] font-medium italic">You</span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={updatingId === m.id}
                            onClick={() => handleToggleStatus(m.id, m.status)}
                            title={m.status === "active" ? "Suspend platform access" : "Restore active access"}
                            className={`px-2 py-1 rounded-[4px] text-[10px] font-semibold border transition-colors ${
                              m.status === "active"
                                ? "border-[#D5CBB2] bg-white text-[#555555] hover:bg-[#FFF8CF] hover:text-[#7A5B00] hover:border-[#FBE6C2]"
                                : "border-[#C3E4BC] bg-[#EBF5E9] text-[#1F5C0E] hover:bg-[#DCFCE7]"
                            }`}
                          >
                            {m.status === "active" ? "Suspend" : "Reactivate"}
                          </button>

                          <button
                            type="button"
                            disabled={updatingId === m.id}
                            onClick={() => setConfirmRemoveMember({ id: m.id, name: m.user?.full_name || "Staff Member" })}
                            title="Remove staff member from school"
                            className="p-1 rounded-[4px] text-[#888888] hover:text-red-700 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal for Staff Removal */}
      {confirmRemoveMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[8px] bg-white p-6 shadow-xl space-y-4 border border-[#E8DFC9]">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-red-100 text-red-700 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#142010]">
                  Remove Staff Member from School?
                </h4>
                <p className="mt-1 text-xs text-[#555555] leading-relaxed">
                  Are you sure you want to remove <strong className="text-[#142010]">{confirmRemoveMember.name}</strong> from this school?
                </p>
                <div className="mt-2 text-[11px] text-[#777777] bg-[#F7F3E8] p-2.5 rounded-[5px] space-y-1">
                  <p>• Any Class Master appointment will be unassigned.</p>
                  <p>• Any subject teaching allocations will be unassigned.</p>
                  <p>• Their platform access to this institution will be revoked immediately.</p>
                  <p>• Historical assessment marks and payments previously recorded will remain safely audited.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DFC9]">
              <button
                type="button"
                onClick={() => setConfirmRemoveMember(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-[5px] border border-[#D5CBB2] text-[#444444] hover:bg-[#F7F3E8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="px-3 py-1.5 text-xs font-semibold rounded-[5px] bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
