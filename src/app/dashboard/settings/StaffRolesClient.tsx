"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SchoolMembership, Role } from "@/types/database";
import {
  addStaffMemberAction,
  registerTeacherWithCodeAction,
  updateStaffRoleAction,
  toggleStaffStatusAction,
  removeStaffMembershipAction,
  type RegisteredTeacherResult,
} from "./actions";
import {
  UserPlus,
  Users,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ShieldAlert,
  KeyRound,
  Phone,
  Copy,
  Check,
  Printer,
  MessageSquare,
  Sparkles,
  Mail,
  X,
} from "lucide-react";

interface Props {
  memberships: SchoolMembership[];
  roles: Role[];
  canManageStaff: boolean;
  currentUserId?: string;
  schoolName?: string;
  schoolCode?: string;
}

const roleLabels: Record<string, string> = {
  superadmin: "Platform Superadmin",
  school_admin: "School Administrator",
  principal: "Principal / Academic Dean",
  teacher: "Teacher",
  bursar: "Finance Officer / Bursar",
  class_master: "Teacher (Class Master)",
  hod: "Teacher (Head of Department)",
};

const primaryRoleCodes = ["teacher", "class_master", "hod", "principal", "school_admin", "bursar"];

export default function StaffRolesClient({
  memberships,
  roles,
  canManageStaff,
  currentUserId,
  schoolName = "School",
  schoolCode = "SCH",
}: Props) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<{ id: string; name: string } | null>(null);
  
  // Registration mode: "phone" (default for Cameroon teachers) vs "email"
  const [addMode, setAddMode] = useState<"phone" | "email">("phone");
  const [registeredResult, setRegisteredResult] = useState<Extract<RegisteredTeacherResult, { success: true }> | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Quick WhatsApp share modal for existing staff
  const [shareStaffMember, setShareStaffMember] = useState<SchoolMembership | null>(null);

  const schoolRoles = roles.filter((role) => role.code !== "superadmin");

  async function handleRegisterWithPhone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setUpdatingId("register-phone");
    setStatusMessage(null);

    try {
      const result = await registerTeacherWithCodeAction(formData);
      if (!result.success) {
        setStatusMessage({
          type: "error",
          text: result.error || "Could not register this teacher.",
        });
        return;
      }
      form.reset();
      setRegisteredResult(result);
      setStatusMessage({
        type: "success",
        text: `Teacher ${result.teacherName} registered successfully with access code ${result.accessCode}!`,
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not register this teacher.";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleAddStaffEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setUpdatingId("new-staff");
    setStatusMessage(null);

    try {
      const res = await addStaffMemberAction(new FormData(form));
      if (!res.success) {
        setStatusMessage({
          type: "error",
          text: res.error || "Could not add this staff member.",
        });
        return;
      }
      form.reset();
      setStatusMessage({ type: "success", text: "Staff member linked to this school." });
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

  const generateWhatsAppMessage = (name: string, code: string, pin: string, phone: string) => {
    const text = `Good day ${name}, your Nsei Sukul teacher login for ${schoolName} is ready:\n\n1-Click Direct Login:\nhttps://nsei-sukul.klarifypath.com/login?p=${phone}&c=${code}&s=${schoolCode}\n\nYour Login Details:\n• Phone: +237 ${phone}\n• School Code: ${schoolCode}\n• Teacher Code: ${code}\n• Initial PIN: ${pin}\n\nTap the 1-click link above directly on your phone to open your classes and submit marks.`;
    return `https://api.whatsapp.com/send?phone=237${phone}&text=${encodeURIComponent(text)}`;
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="staff" className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8DFC9] gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[6px] bg-[#EBF5E9] text-[#1F5C0E] border border-[#C3E4BC]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-[#142010]">
              Teachers &amp; Staff Management
            </h3>
            <p className="text-[12px] text-[#777777]">
              Register faculty with direct access codes (zero email required) or invite administrators.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#EBF5E9] text-[#1F5C0E] font-semibold border border-[#C3E4BC]">
            {memberships.filter((m) => m.status === "active").length} Active Staff
          </span>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3 rounded-[6px] text-xs font-medium border ${
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

      {/* ── ADD STAFF SECTION WITH TABS ── */}
      {canManageStaff && (
        <div className="rounded-[8px] border border-[#E8DFC9] bg-white p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EFE7D5] gap-3">
            <div>
              <h4 className="text-sm font-bold text-[#142010]">Register or Add Staff</h4>
              <p className="text-xs text-[#666666] mt-0.5">
                Choose the best registration method for your staff member.
              </p>
            </div>

            {/* Segmented Tab Controls */}
            <div className="inline-flex rounded-[6px] bg-[#F7F3E8] p-1 border border-[#E8DFC9] text-xs">
              <button
                type="button"
                onClick={() => setAddMode("phone")}
                className={`px-3 py-1.5 rounded-[4px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  addMode === "phone"
                    ? "bg-[#142010] text-white shadow-xs"
                    : "text-[#555555] hover:text-[#142010]"
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-[#86EFAC]" />
                <span>Phone &amp; Access Code (Recommended)</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode("email")}
                className={`px-3 py-1.5 rounded-[4px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  addMode === "email"
                    ? "bg-[#142010] text-white shadow-xs"
                    : "text-[#555555] hover:text-[#142010]"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Invitation</span>
              </button>
            </div>
          </div>

          {/* MODE A: PHONE & TEACHER ACCESS CODE (Cameroon Friendly) */}
          {addMode === "phone" ? (
            <form onSubmit={handleRegisterWithPhone} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <div className="p-3 rounded-[6px] bg-[#EBF5E9] border border-[#C3E4BC] text-xs text-[#1F5C0E] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-[#2A7C13]" />
                  <span>
                    <strong>Zero Email Required:</strong> Teachers can log in directly using their Cameroon phone number or school access code + PIN. You can instantly send their credentials to WhatsApp or print a staff room slip.
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="reg-name" className="mb-1 block text-xs font-semibold text-[#444444]">
                  Teacher Full Name *
                </label>
                <input
                  id="reg-name"
                  name="fullName"
                  type="text"
                  required
                  placeholder="e.g. Mr. Emmanuel Forbi"
                  className="w-full rounded-[5px] border border-[#D5CBB2] bg-white px-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-phone" className="mb-1 block text-xs font-semibold text-[#444444]">
                  Cameroon Phone Number (WhatsApp) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-[#777777] pointer-events-none">
                    +237
                  </span>
                  <input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="677 12 34 56"
                    className="w-full rounded-[5px] border border-[#D5CBB2] bg-white pl-13 pr-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none font-mono"
                  />
                </div>
                <p className="text-[10.5px] text-[#788470] mt-1">
                  Enter 9 digits (e.g. 677 12 34 56). Country code (+237) is accepted automatically.
                </p>
              </div>

              <div>
                <label htmlFor="reg-role" className="mb-1 block text-xs font-semibold text-[#444444]">
                  Faculty Role *
                </label>
                <select
                  id="reg-role"
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
                <label htmlFor="reg-title" className="mb-1 block text-xs font-semibold text-[#444444]">
                  Teaching Assignment / Title (optional)
                </label>
                <input
                  id="reg-title"
                  name="title"
                  type="text"
                  placeholder="e.g. Mathematics Form 1-5"
                  className="w-full rounded-[5px] border border-[#D5CBB2] bg-white px-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-code" className="mb-1 block text-xs font-semibold text-[#444444]">
                  Custom Staff Code (leave blank to auto-generate)
                </label>
                <input
                  id="reg-code"
                  name="accessCode"
                  type="text"
                  placeholder={`e.g. ${schoolCode}-482 (Auto-generated if blank)`}
                  className="w-full rounded-[5px] border border-[#D5CBB2] bg-white px-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label htmlFor="reg-pin" className="mb-1 block text-xs font-semibold text-[#444444]">
                  Initial 4-6 Digit PIN (default: 123456)
                </label>
                <input
                  id="reg-pin"
                  name="pin"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  className="w-full rounded-[5px] border border-[#D5CBB2] bg-white px-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingId === "register-phone"}
                  className="inline-flex items-center justify-center gap-2 rounded-[5px] bg-[#142010] hover:bg-[#20361a] px-5 py-2.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <UserPlus className="h-4 w-4 text-[#86EFAC]" />
                  {updatingId === "register-phone" ? "Registering Faculty..." : "Generate Teacher Access & Slip"}
                </button>
              </div>
            </form>
          ) : (
            /* MODE B: EMAIL INVITATION */
            <form onSubmit={handleAddStaffEmail} className="grid grid-cols-1 gap-3 rounded-[6px] bg-[#FFFDF5] p-3 border border-[#E8DFC9] sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-4">
                <p className="text-xs text-[#666666]">
                  Enter any faculty email (e.g. personal Gmail or school email). If they do not have an account yet, one is created automatically so they can sign in with Google or email immediately.
                </p>
              </div>
              <div>
                <label htmlFor="staff-email" className="mb-1 block text-xs font-semibold text-[#444444]">
                  Email Address
                </label>
                <input
                  id="staff-email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-[5px] border border-[#D5CBB2] bg-white px-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="staff-role" className="mb-1 block text-xs font-semibold text-[#444444]">
                  School Role
                </label>
                <select
                  id="staff-role"
                  name="roleId"
                  required
                  defaultValue=""
                  className="w-full rounded-[5px] border border-[#D5CBB2] bg-white px-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none"
                >
                  <option value="" disabled>Select a role</option>
                  {schoolRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {roleLabels[role.code] || role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="staff-title" className="mb-1 block text-xs font-semibold text-[#444444]">
                  Job Title (optional)
                </label>
                <input
                  id="staff-title"
                  name="title"
                  type="text"
                  placeholder="e.g. Vice Principal"
                  className="w-full rounded-[5px] border border-[#D5CBB2] bg-white px-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={updatingId === "new-staff"}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-[5px] bg-[#191919] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#333333] disabled:opacity-50 cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  {updatingId === "new-staff" ? "Granting Access..." : "Grant Staff Access"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── STAFF MEMBERS TABLE ── */}
      <div className="overflow-x-auto -mx-1 sm:mx-0">
        <table className="w-full min-w-[700px] text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E8DFC9] bg-[#F7F3E8] text-[#444444] font-semibold">
              <th className="py-2.5 px-3">Faculty / Staff Name</th>
              <th className="py-2.5 px-3">Access Code / Contact</th>
              <th className="py-2.5 px-3">Teaching Title</th>
              <th className="py-2.5 px-3">Role</th>
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
              memberships.map((m) => {
                const phoneDisplay = m.user?.phone ? `+237 ${m.user.phone}` : null;
                const isInternalEmail = m.user?.email?.includes("@staff.nseisukul.internal");
                const emailDisplay = isInternalEmail ? null : m.user?.email;

                return (
                  <tr key={m.id} className="hover:bg-[#FAF6EC] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#142010]">
                      <div>{m.user?.full_name || "Staff Member"}</div>
                      {phoneDisplay && (
                        <div className="text-[11px] font-mono text-[#777777] font-normal">
                          {phoneDisplay}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {m.access_code ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-[4px] bg-[#FFF8CF] text-[#7A5B00] border border-[#FBE6C2]">
                            <KeyRound className="w-3 h-3 text-[#B45309]" />
                            {m.access_code}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#888888] italic">No code</span>
                        )}
                        {emailDisplay && (
                          <span className="text-[11px] text-[#666666] truncate max-w-[150px]">
                            {emailDisplay}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#555555]">
                      {m.title || "Staff member"}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={m.role_id}
                          disabled={!canManageStaff || updatingId === m.id || m.status === "suspended"}
                          onChange={(e) => handleRoleChange(m.id, e.target.value, m.title)}
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
                            {/* Share / WhatsApp button */}
                            {m.user?.phone && (
                              <button
                                type="button"
                                onClick={() => setShareStaffMember(m)}
                                title="Share access credentials via WhatsApp or Slip"
                                className="p-1.5 rounded-[4px] border border-[#C3E4BC] bg-[#EBF5E9] text-[#1F5C0E] hover:bg-[#DCFCE7] transition-colors cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={updatingId === m.id}
                              onClick={() => handleToggleStatus(m.id, m.status)}
                              title={m.status === "active" ? "Suspend platform access" : "Restore active access"}
                              className={`px-2 py-1 rounded-[4px] text-[10px] font-semibold border transition-colors cursor-pointer ${
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
                              className="p-1 rounded-[4px] text-[#888888] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL 1: REGISTRATION SUCCESS CREDENTIAL CARD ── */}
      {registeredResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[10px] bg-white p-6 shadow-2xl space-y-4 border border-[#E8DFC9] animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFC9]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-[#EBF5E9] text-[#1F5C0E]">
                  <CheckCircle2 className="w-5 h-5 text-[#2A7C13]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#142010]">Teacher Access Created!</h4>
                  <p className="text-[11px] text-[#666666]">
                    {registeredResult.isExistingUser ? "Linked existing faculty account" : "New teacher account created"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRegisteredResult(null)}
                className="text-[#888888] hover:text-[#142010] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Staff Slip Preview */}
            <div id="teacher-access-slip" className="p-4 rounded-[8px] bg-[#FFFDF5] border-2 border-dashed border-[#D5CBB2] space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-2">
                <span className="font-bold text-xs text-[#142010]">{registeredResult.schoolName}</span>
                <span className="font-mono text-[10px] bg-[#142010] text-white px-2 py-0.5 rounded font-bold">
                  CODE: {registeredResult.schoolCode}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#666666]">Teacher Name:</span>
                  <span className="font-bold text-[#142010]">{registeredResult.teacherName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Phone (WhatsApp):</span>
                  <span className="font-mono font-semibold text-[#142010]">+237 {registeredResult.phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#666666]">Teacher Access Code:</span>
                  <span className="font-mono font-extrabold text-sm text-[#1F5C0E] bg-[#EBF5E9] px-2 py-0.5 rounded border border-[#C3E4BC]">
                    {registeredResult.accessCode}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#666666]">Initial Login PIN:</span>
                  <span className="font-mono font-bold text-xs text-[#7A5B00] bg-[#FFF8CF] px-2 py-0.5 rounded border border-[#FBE6C2]">
                    {registeredResult.pin}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#E8DFC9] text-[11px]">
                  <span className="text-[#777777]">Login Website:</span>
                  <span className="font-semibold text-[#2A7C13]">nsei-sukul.klarifypath.com/login</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <a
                href={generateWhatsAppMessage(
                  registeredResult.teacherName,
                  registeredResult.accessCode,
                  registeredResult.pin,
                  registeredResult.phone
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[6px] bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send via WhatsApp (+237 {registeredResult.phone})</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = `Nsei Sukul Teacher Login for ${registeredResult.schoolName}\nWebsite: https://nsei-sukul.klarifypath.com/login\nPhone: +237 ${registeredResult.phone}\nSchool Code: ${registeredResult.schoolCode}\nTeacher Code: ${registeredResult.accessCode}\nPIN: ${registeredResult.pin}`;
                    handleCopyText(text);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[5px] border border-[#D5CBB2] bg-white hover:bg-[#F7F3E8] text-xs font-semibold text-[#444444] transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-[#2A7C13]" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied!" : "Copy Details"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[5px] border border-[#D5CBB2] bg-white hover:bg-[#F7F3E8] text-xs font-semibold text-[#444444] transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setRegisteredResult(null)}
                className="w-full text-center text-xs text-[#666666] hover:text-[#142010] py-1 font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: QUICK SHARE EXISTING STAFF CREDENTIALS ── */}
      {shareStaffMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-[10px] bg-white p-5 shadow-2xl space-y-4 border border-[#E8DFC9] animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DFC9]">
              <h4 className="text-sm font-bold text-[#142010]">Share Teacher Access</h4>
              <button
                type="button"
                onClick={() => setShareStaffMember(null)}
                className="text-[#888888] hover:text-[#142010] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="text-[#555555]">
                Send login instructions directly to <strong>{shareStaffMember.user?.full_name}</strong>:
              </p>
              <div className="p-3 rounded-[6px] bg-[#FFFDF5] border border-[#E8DFC9] font-mono text-[11px] space-y-1">
                <div>School Code: <strong>{schoolCode}</strong></div>
                <div>Teacher Code: <strong>{shareStaffMember.access_code || "T-001"}</strong></div>
                <div>Phone: <strong>{shareStaffMember.user?.phone ? `+237 ${shareStaffMember.user.phone}` : "No phone"}</strong></div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {shareStaffMember.user?.phone && (
                <a
                  href={generateWhatsAppMessage(
                    shareStaffMember.user.full_name || "Teacher",
                    shareStaffMember.access_code || "T-001",
                    "(Your personal PIN)",
                    shareStaffMember.user.phone
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setShareStaffMember(null)}
                className="w-full py-1.5 text-xs text-[#555555] hover:text-[#142010] text-center cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="px-3 py-1.5 text-xs font-semibold rounded-[5px] border border-[#D5CBB2] text-[#444444] hover:bg-[#F7F3E8] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="px-3 py-1.5 text-xs font-semibold rounded-[5px] bg-red-600 hover:bg-red-700 text-white transition-colors shadow-xs cursor-pointer"
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
