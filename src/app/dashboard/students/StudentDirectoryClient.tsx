"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Enrolment } from "@/types/database";
import { updateStudentStatusAction } from "@/app/academics/actions";
import {
  Users,
  Search,
  Building,
  Home,
  ShieldAlert,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle2,
  Filter,
} from "lucide-react";

interface Props {
  enrolledStudents: Enrolment[];
  canManageStudents: boolean;
  isTeacher: boolean;
  selectedStreamId?: string;
  currentStatusFilter?: string;
}

export function StudentDirectoryClient({
  enrolledStudents,
  canManageStudents,
  isTeacher,
  selectedStreamId,
  currentStatusFilter = "active",
}: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Enrolment | null>(null);
  const [newStatus, setNewStatus] = useState<string>("active");
  const [reason, setReason] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredStudents = enrolledStudents.filter((enrol) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const matricule = enrol.student?.matricule?.toLowerCase() || "";
    const name = `${enrol.student?.first_name || ""} ${enrol.student?.last_name || ""}`.toLowerCase();
    const stream = enrol.class_stream?.name?.toLowerCase() || "";
    return matricule.includes(q) || name.includes(q) || stream.includes(q);
  });

  const handleOpenStatusModal = (enrol: Enrolment) => {
    setSelectedStudent(enrol);
    setNewStatus(enrol.student?.status || enrol.status || "active");
    setReason("");
    setMessage(null);
  };

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent?.student_id) return;

    setMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("studentId", selectedStudent.student_id);
      formData.set("status", newStatus);
      formData.set("reason", reason.trim());

      const res = await updateStudentStatusAction(formData);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({
          type: "success",
          text: `Status for ${selectedStudent.student?.first_name} ${selectedStudent.student?.last_name} updated to ${newStatus}.`,
        });
        setSelectedStudent(null);
        router.refresh();
      }
    });
  };

  const handleFilterStatusChange = (status: string) => {
    const params = new URLSearchParams(window.location.search);
    if (status === "active") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`/dashboard/students?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Search and Secondary Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, matricule or class..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[5px] border border-[#D5D5CF] bg-white text-[#191919] focus:outline-none focus:border-[#191919]"
          />
        </div>

        {canManageStudents && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#777777]">View:</span>
            <div className="inline-flex rounded-[5px] border border-[#D5D5CF] bg-[#FAFAF8] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => handleFilterStatusChange("active")}
                className={`px-2.5 py-1 rounded-[4px] text-[11px] font-semibold transition-colors ${
                  currentStatusFilter === "active"
                    ? "bg-white text-[#191919] shadow-2xs"
                    : "text-[#666666] hover:text-[#191919]"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => handleFilterStatusChange("dismissed")}
                className={`px-2.5 py-1 rounded-[4px] text-[11px] font-semibold transition-colors ${
                  currentStatusFilter === "dismissed"
                    ? "bg-white text-[#191919] shadow-2xs"
                    : "text-[#666666] hover:text-[#191919]"
                }`}
              >
                Dismissed
              </button>
              <button
                type="button"
                onClick={() => handleFilterStatusChange("all")}
                className={`px-2.5 py-1 rounded-[4px] text-[11px] font-semibold transition-colors ${
                  currentStatusFilter === "all"
                    ? "bg-white text-[#191919] shadow-2xs"
                    : "text-[#666666] hover:text-[#191919]"
                }`}
              >
                All Records
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Notification */}
      {message && (
        <div
          className={`p-3 rounded-[6px] text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Student Table */}
      <div className="overflow-x-auto text-[12px]">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <h3 className="text-sm font-semibold text-[#191919]">
              {searchTerm ? "No matching students found" : "No students in this register view"}
            </h3>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              {searchTerm
                ? "Try searching with a different name or admission number."
                : "No students match the current class and status filters."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5DF] text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                <th className="py-2.5 px-2.5">Admission No.</th>
                <th className="py-2.5 px-2.5">Student Name</th>
                <th className="py-2.5 px-2.5">Class Group</th>
                <th className="py-2.5 px-2.5">Gender</th>
                <th className="py-2.5 px-2.5">Residence</th>
                <th className="py-2.5 px-2.5">Guardian Contact</th>
                <th className="py-2.5 px-2.5 text-center">Status</th>
                {canManageStudents && <th className="py-2.5 px-2.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1ED] text-[#191919]">
              {filteredStudents.map((enrol) => {
                const effectiveStatus: string = enrol.student?.status || enrol.status || "active";
                return (
                  <tr key={enrol.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="py-2.5 px-2.5 font-mono font-bold text-[#191919]">
                      {enrol.student?.matricule}
                    </td>
                    <td className="py-2.5 px-2.5 font-semibold">
                      {enrol.student?.first_name} {enrol.student?.last_name}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className="px-1.5 py-0.5 rounded-[3px] bg-[#F1F1ED] text-[#555555] font-medium text-[11px]">
                        {enrol.class_stream?.name || "Unassigned"}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 font-bold text-[#555555]">
                      {enrol.student?.gender}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase tracking-wider ${
                          enrol.student?.residence_status === "boarding"
                            ? "bg-[#FAF5FF] text-[#7E22CE] border border-[#F3E8FF]"
                            : "bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7]"
                        }`}
                      >
                        {enrol.student?.residence_status === "boarding" ? (
                          <Building className="w-3 h-3" />
                        ) : (
                          <Home className="w-3 h-3" />
                        )}
                        <span>{enrol.student?.residence_status}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-[#666666]">
                      {enrol.student?.guardian_name || "—"}{" "}
                      {enrol.student?.guardian_phone && (
                        <span className="font-mono text-[10px] text-[#888888]">
                          ({enrol.student.guardian_phone})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          effectiveStatus === "active"
                            ? "border-[#C3E4BC] bg-[#EBF5E9] text-[#1F5C0E]"
                            : effectiveStatus === "dismissed"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : effectiveStatus === "withdrawn" || effectiveStatus === "suspended"
                            ? "border-[#FBE6C2] bg-[#FFF8CF] text-[#7A5B00]"
                            : "border-purple-200 bg-purple-50 text-purple-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            effectiveStatus === "active"
                              ? "bg-[#2A7C13]"
                              : effectiveStatus === "dismissed"
                              ? "bg-red-600"
                              : effectiveStatus === "withdrawn" || effectiveStatus === "suspended"
                              ? "bg-[#B45309]"
                              : "bg-purple-600"
                          }`}
                        />
                        <span className="capitalize">{effectiveStatus}</span>
                      </span>
                    </td>
                    {canManageStudents && (
                      <td className="py-2.5 px-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(enrol)}
                          className="px-2 py-1 rounded-[4px] text-[11px] font-semibold border border-[#D5D5CF] bg-white hover:bg-[#FAFAF8] text-[#444444] transition-colors shadow-2xs"
                        >
                          Status
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Manage Student Status & Dismissal Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[8px] bg-white p-6 shadow-xl space-y-4 border border-[#E8DFC9]">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full shrink-0 ${newStatus === "dismissed" ? "bg-red-100 text-red-700" : "bg-[#F3F9F1] text-[#2A7C13]"}`}>
                {newStatus === "dismissed" ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <UserCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#142010]">
                  Manage Student Institutional Status
                </h4>
                <p className="mt-0.5 text-xs text-[#555555]">
                  Student: <strong className="text-[#142010]">{selectedStudent.student?.first_name} {selectedStudent.student?.last_name}</strong> ({selectedStudent.student?.matricule})
                </p>
              </div>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#444444] mb-1">
                  Institutional Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-[5px] border border-[#D5D5CF] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#191919]"
                >
                  <option value="active">Active (Enrolled &amp; Attending Classes)</option>
                  <option value="dismissed">Dismissed / Expelled (Disciplinary Council Action)</option>
                  <option value="suspended">Suspended (Temporarily On Leave)</option>
                  <option value="transferred">Transferred (Moved to Another School)</option>
                  <option value="withdrawn">Withdrawn (Voluntarily Withdrawn by Parent)</option>
                </select>
              </div>

              {newStatus === "dismissed" && (
                <div className="p-3 rounded-[5px] bg-red-50 border border-red-200 text-red-800 text-[11px] space-y-1">
                  <p className="font-bold">Important note on Dismissals:</p>
                  <p>• The student will be immediately removed from active roll calls and marksheets.</p>
                  <p>• Past assessment scores, report cards, and fee receipts are strictly preserved for official ministerial audits.</p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#444444] mb-1">
                  Official Justification / Council Decision (optional)
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Disciplinary Council Resolution #03 of Term 2."
                  className="w-full p-2.5 rounded-[5px] border border-[#D5D5CF] text-xs focus:outline-none focus:border-[#191919]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EEEEEC]">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] text-[#444444] font-semibold hover:bg-[#FAFAF8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`px-4 py-1.5 rounded-[5px] font-semibold text-white transition-colors shadow-xs ${
                    newStatus === "dismissed"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-[#191919] hover:bg-[#333333]"
                  }`}
                >
                  {isPending ? "Updating..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
