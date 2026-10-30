"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Enrolment } from "@/types/database";
import {
  updateStudentStatusAction,
  updateStudentAction,
  deleteStudentAction,
} from "@/app/academics/actions";
import {
  Users,
  Search,
  Building,
  Home,
  ShieldAlert,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Filter,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  Camera,
  Upload,
} from "lucide-react";

interface StreamOption {
  id: string;
  name: string;
}

interface Props {
  enrolledStudents: Enrolment[];
  canManageStudents: boolean;
  isTeacher: boolean;
  selectedStreamId?: string;
  currentStatusFilter?: string;
  streams?: StreamOption[];
  academicYearId?: string;
}

export function StudentDirectoryClient({
  enrolledStudents,
  canManageStudents,
  isTeacher,
  selectedStreamId,
  currentStatusFilter = "active",
  streams = [],
  academicYearId = "",
}: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Enrolment | null>(null);
  const [newStatus, setNewStatus] = useState<string>("active");
  const [reason, setReason] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Student State
  const [editingEnrolment, setEditingEnrolment] = useState<Enrolment | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    studentId: "",
    enrolmentId: "",
    matricule: "",
    firstName: "",
    lastName: "",
    classStreamId: "",
    gender: "M" as "M" | "F",
    dateOfBirth: "",
    placeOfBirth: "",
    photoUrl: "",
    residenceStatus: "day" as "day" | "boarding",
    isRepeater: false,
    rollNumber: "",
    guardianName: "",
    guardianPhone: "",
  });
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [editGeneralError, setEditGeneralError] = useState<string | null>(null);
  const [isEditPending, setIsEditPending] = useState(false);

  // Delete Student State
  const [deletingEnrolment, setDeletingEnrolment] = useState<Enrolment | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);

  const filteredStudents = enrolledStudents.filter((enrol) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const matricule = enrol.student?.matricule?.toLowerCase() || "";
    const name = `${enrol.student?.first_name || ""} ${enrol.student?.last_name || ""}`.toLowerCase();
    const stream = enrol.class_stream?.name?.toLowerCase() || "";
    return matricule.includes(q) || name.includes(q) || stream.includes(q);
  });

  // --- Status Management ---
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

  // --- Edit Student Management ---
  const handleOpenEditModal = (enrol: Enrolment) => {
    setEditingEnrolment(enrol);
    setEditForm({
      studentId: enrol.student_id,
      enrolmentId: enrol.id,
      matricule: enrol.student?.matricule || "",
      firstName: enrol.student?.first_name || "",
      lastName: enrol.student?.last_name || "",
      classStreamId: enrol.class_stream_id || "",
      gender: (enrol.student?.gender as "M" | "F") || "M",
      dateOfBirth: enrol.student?.date_of_birth || "",
      placeOfBirth: enrol.student?.place_of_birth || "",
      photoUrl: (enrol.student as any)?.photo_url || "",
      residenceStatus: (enrol.student?.residence_status as "day" | "boarding") || "day",
      isRepeater: Boolean(enrol.is_repeater ?? enrol.student?.is_repeater),
      rollNumber: enrol.roll_number !== null && enrol.roll_number !== undefined ? String(enrol.roll_number) : "",
      guardianName: enrol.student?.guardian_name || "",
      guardianPhone: enrol.student?.guardian_phone || "",
    });
    setEditFieldErrors({});
    setEditGeneralError(null);
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditGeneralError("Please select an image file (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          updateEditField("photoUrl", dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleClearEditPhoto = () => {
    updateEditField("photoUrl", "");
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  const updateEditField = (field: string, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (editFieldErrors[field]) {
      setEditFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (editGeneralError) setEditGeneralError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditPending(true);
    setEditFieldErrors({});
    setEditGeneralError(null);

    const formData = new FormData();
    formData.set("studentId", editForm.studentId);
    formData.set("enrolmentId", editForm.enrolmentId);
    formData.set("academicYearId", academicYearId);
    formData.set("classStreamId", editForm.classStreamId);
    formData.set("matricule", editForm.matricule);
    formData.set("firstName", editForm.firstName);
    formData.set("lastName", editForm.lastName);
    formData.set("gender", editForm.gender);
    formData.set("dateOfBirth", editForm.dateOfBirth);
    formData.set("placeOfBirth", editForm.placeOfBirth);
    formData.set("photoUrl", editForm.photoUrl);
    formData.set("residenceStatus", editForm.residenceStatus);
    formData.set("isRepeater", editForm.isRepeater ? "true" : "false");
    formData.set("rollNumber", editForm.rollNumber);
    formData.set("guardianName", editForm.guardianName);
    formData.set("guardianPhone", editForm.guardianPhone);

    const res = await updateStudentAction(null, formData);
    setIsEditPending(false);

    if (res && "error" in res && res.error) {
      setEditGeneralError(res.error);
      if (res.fieldErrors) {
        setEditFieldErrors(res.fieldErrors);
      }
    } else {
      const studentDisplayName = `${editForm.lastName} ${editForm.firstName}`.trim();
      setMessage({
        type: "success",
        text: res?.message || `Student "${studentDisplayName}" updated successfully.`,
      });
      setEditingEnrolment(null);
      router.refresh();
    }
  };

  // --- Delete Student Management ---
  const handleOpenDeleteModal = (enrol: Enrolment) => {
    setDeletingEnrolment(enrol);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEnrolment) return;
    setIsDeletePending(true);
    setDeleteError(null);

    const formData = new FormData();
    formData.set("studentId", deletingEnrolment.student_id);

    const res = await deleteStudentAction(formData);
    setIsDeletePending(false);

    if (res?.error) {
      setDeleteError(res.error);
    } else {
      setMessage({
        type: "success",
        text: res?.message || "Student record deleted successfully.",
      });
      setDeletingEnrolment(null);
      router.refresh();
    }
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

      {/* Notification Toast/Banner */}
      {message && (
        <div
          className={`p-3 rounded-[6px] text-xs flex items-center justify-between gap-2 ${
            message.type === "success"
              ? "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-current opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
          <table className="w-full min-w-[720px] text-left border-collapse">
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
                    <td className="py-2.5 px-2.5">
                      <div className="flex items-center gap-2.5">
                        {enrol.student?.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={enrol.student.photo_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-[#D5D5CF] shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#191919] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {(enrol.student?.last_name?.[0] || "") + (enrol.student?.first_name?.[0] || "")}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold leading-tight">
                            <span className="font-bold text-[#191919]">
                              {enrol.student?.last_name}
                            </span>
                            <span className="font-medium text-[#191919]">
                              {enrol.student?.first_name}
                            </span>
                            {enrol.is_repeater && (
                              <span className="px-1.5 py-0.2 rounded-[3px] bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">
                                Repeater
                              </span>
                            )}
                          </div>
                          {(enrol.student?.date_of_birth || enrol.student?.place_of_birth) && (
                            <p className="text-[10px] text-[#777777] font-normal leading-tight mt-0.5">
                              {enrol.student.date_of_birth ? `Born: ${enrol.student.date_of_birth}` : ""}
                              {enrol.student.date_of_birth && enrol.student.place_of_birth ? " at " : ""}
                              {enrol.student.place_of_birth || ""}
                            </p>
                          )}
                        </div>
                      </div>
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
                      <td className="py-2.5 px-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(enrol)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] text-[11px] font-semibold border border-[#D5D5CF] bg-white hover:bg-[#FAFAF8] text-[#191919] transition-colors shadow-2xs"
                            title="Edit student information"
                          >
                            <Pencil className="w-3 h-3 text-[#555555]" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(enrol)}
                            className="px-2 py-1 rounded-[4px] text-[11px] font-semibold border border-[#D5D5CF] bg-white hover:bg-[#FAFAF8] text-[#555555] transition-colors shadow-2xs"
                            title="Change status"
                          >
                            Status
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(enrol)}
                            className="p-1 rounded-[4px] text-[11px] font-semibold border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors shadow-2xs"
                            title="Delete student permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* --- EDIT STUDENT MODAL --- */}
      {editingEnrolment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-[10px] bg-white shadow-2xl border border-[#E5E5DF] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#EEEEEC] bg-[#FAFAF8]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#191919] text-white flex items-center justify-center shrink-0">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#191919]">Edit Student Profile</h3>
                  <p className="text-[11px] text-[#666666]">
                    Modify student name, class assignment, admission number, or guardian contacts.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEnrolment(null)}
                className="p-1.5 rounded-full text-[#777777] hover:text-[#191919] hover:bg-black/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              {/* General Error Banner */}
              {editGeneralError && (
                <div className="flex items-start gap-2 p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Unable to update student</p>
                    <p className="text-[11px] mt-0.5">{editGeneralError}</p>
                  </div>
                </div>
              )}

              {/* 1. Class Stream Assignment */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  Class Group <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.classStreamId}
                  onChange={(e) => updateEditField("classStreamId", e.target.value)}
                  required
                  className={`w-full px-3 py-2 text-xs rounded-[5px] border bg-white focus:outline-none transition-colors ${
                    editFieldErrors.classStreamId
                      ? "border-red-400 focus:border-red-600 bg-red-50/20"
                      : "border-[#D5D5CF] focus:border-[#191919]"
                  }`}
                >
                  <option value="">Choose a class group</option>
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {editFieldErrors.classStreamId && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {editFieldErrors.classStreamId}
                  </p>
                )}
              </div>

              {/* 2. Matricule / Admission Number */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  Admission Number / Matricule <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.matricule}
                  onChange={(e) => updateEditField("matricule", e.target.value)}
                  required
                  className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-[5px] border bg-white text-[#191919] focus:outline-none transition-colors ${
                    editFieldErrors.matricule
                      ? "border-red-400 focus:border-red-600 bg-red-50/20"
                      : "border-[#D5D5CF] focus:border-[#191919]"
                  }`}
                />
                {editFieldErrors.matricule ? (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {editFieldErrors.matricule}
                  </p>
                ) : (
                  <p className="text-[10px] text-[#777777] mt-0.5">
                    Official admission number used on report cards and ministerial registers.
                  </p>
                )}
              </div>

              {/* 3. Photo & Names (Surname and 3, 4+ Given Names) */}
              <div className="p-3.5 rounded-[8px] border border-[#E5E5DF] bg-[#FAF8F5]/50 space-y-3">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Photo Upload Box */}
                  <div className="flex flex-col items-center sm:items-start shrink-0 space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                      Student Photo <span className="font-normal text-[#888888] lowercase text-[10px]">(optional)</span>
                    </label>
                    <div className="relative w-20 h-24 rounded-[6px] border-2 border-dashed border-[#D5D5CF] bg-white flex flex-col items-center justify-center overflow-hidden group shadow-2xs">
                      {editForm.photoUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={editForm.photoUrl}
                            alt="Passport preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleClearEditPhoto}
                            className="absolute bottom-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-opacity cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[#777777] hover:text-[#191919] hover:bg-[#F3F3EF] transition-colors cursor-pointer"
                        >
                          <Camera className="w-5 h-5 text-[#999999] mb-1" />
                          <span className="text-[10px] font-semibold leading-tight">Add Photo</span>
                          <span className="text-[8px] text-[#888888] mt-0.5 font-normal">(optional)</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditPhotoUpload}
                      className="hidden"
                    />
                    {editForm.photoUrl && (
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="text-[10px] text-[#2A7C13] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-2.5 h-2.5" />
                        Change photo
                      </button>
                    )}
                  </div>

                  {/* Surname and Multiple Given Names */}
                  <div className="flex-1 w-full space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => updateEditField("lastName", e.target.value)}
                          placeholder="e.g. FOMBAN or EMMANUEL"
                          required
                          className={`w-full px-3 py-2 text-xs font-semibold rounded-[5px] border bg-white focus:outline-none transition-colors ${
                            editFieldErrors.lastName
                              ? "border-red-400 focus:border-red-600 bg-red-50/20"
                              : "border-[#D5D5CF] focus:border-[#191919]"
                          }`}
                        />
                        <p className="text-[10px] text-[#777777] mt-0.5">
                          Enter as written on the birth certificate.
                        </p>
                        {editFieldErrors.lastName && (
                          <p className="text-[11px] text-red-600 font-medium mt-1">
                            {editFieldErrors.lastName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-1">
                          Other Names <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => updateEditField("firstName", e.target.value)}
                          placeholder="e.g. Elvis Chi or Marie Paule"
                          required
                          className={`w-full px-3 py-2 text-xs rounded-[5px] border bg-white focus:outline-none transition-colors ${
                            editFieldErrors.firstName
                              ? "border-red-400 focus:border-red-600 bg-red-50/20"
                              : "border-[#D5D5CF] focus:border-[#191919]"
                          }`}
                        />
                        <p className="text-[10px] text-[#777777] mt-0.5">
                          Remaining names as written on the birth certificate.
                        </p>
                        {editFieldErrors.firstName && (
                          <p className="text-[11px] text-red-600 font-medium mt-1">
                            {editFieldErrors.firstName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Live Preview */}
                    {(editForm.lastName || editForm.firstName) && (
                      <div className="p-2 rounded-[5px] bg-[#FAF8F5] border border-[#E0E0D8] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2A7C13] bg-[#EAF7E4] px-1.5 py-0.5 rounded border border-[#76C457]/40">
                            Student Record Display
                          </span>
                          <span className="font-bold text-[#142010] text-[13px]">
                            {[editForm.lastName, editForm.firstName].filter(Boolean).join(" ")}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#777777]">
                          As on Birth Certificate
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Date of Birth & Place of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                    Date of Birth <span className="font-normal text-[#888888] lowercase text-[10px]">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={(e) => updateEditField("dateOfBirth", e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                  />
                  <p className="text-[10px] text-[#777777] mt-0.5">Prints on report card header.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                    Place of Birth <span className="font-normal text-[#888888] lowercase text-[10px]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.placeOfBirth}
                    onChange={(e) => updateEditField("placeOfBirth", e.target.value)}
                    placeholder="e.g. Bamenda, Bafoussam"
                    className="w-full px-3 py-2 text-xs rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                  />
                  <p className="text-[10px] text-[#777777] mt-0.5">e.g. Born at Bamenda.</p>
                </div>
              </div>

              {/* 5. Gender & Residence */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => updateEditField("gender", e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                    Residence <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.residenceStatus}
                    onChange={(e) => updateEditField("residenceStatus", e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                  >
                    <option value="day">Day Student</option>
                    <option value="boarding">Boarding Student</option>
                  </select>
                </div>
              </div>

              {/* 6. Academic Status (Repeater) */}
              <div className="p-3 rounded-[6px] border border-[#E5E5DF] bg-[#FAF8F2] space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#555555]">
                  Academic Repetition Status <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => updateEditField("isRepeater", false)}
                    className={`py-1.5 px-2 rounded-[4px] border text-center font-semibold text-[11px] transition-all cursor-pointer ${
                      !editForm.isRepeater
                        ? "bg-[#191919] border-[#191919] text-white shadow-2xs"
                        : "bg-white border-[#D5D5CF] text-[#555555] hover:bg-[#F0EFEB]"
                    }`}
                  >
                    Regular / New
                  </button>
                  <button
                    type="button"
                    onClick={() => updateEditField("isRepeater", true)}
                    className={`py-1.5 px-2 rounded-[4px] border text-center font-semibold text-[11px] transition-all cursor-pointer ${
                      editForm.isRepeater
                        ? "bg-[#B45309] border-[#B45309] text-white shadow-2xs"
                        : "bg-white border-[#D5D5CF] text-[#555555] hover:bg-[#F0EFEB]"
                    }`}
                  >
                    Repeater (Redoublant)
                  </button>
                </div>
                <p className="text-[10px] text-[#777777] leading-snug">
                  {editForm.isRepeater
                    ? "✓ Marked as a repeater. Will print as Repeater: Yes [✓] on report cards."
                    : "✓ New to this class level. Will print as Repeater: No [✓] on report cards."}
                </p>
              </div>

              {/* 7. Roll Number */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  Class Roster Number (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editForm.rollNumber}
                  onChange={(e) => updateEditField("rollNumber", e.target.value)}
                  placeholder="e.g. 1, 2, 14 (position on class register)"
                  className={`w-full px-3 py-2 text-xs font-mono rounded-[5px] border bg-white focus:outline-none transition-colors ${
                    editFieldErrors.rollNumber
                      ? "border-red-400 focus:border-red-600 bg-red-50/20"
                      : "border-[#D5D5CF] focus:border-[#191919]"
                  }`}
                />
                {editFieldErrors.rollNumber && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {editFieldErrors.rollNumber}
                  </p>
                )}
              </div>

              {/* 8. Guardian Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                    Parent / Guardian Name
                  </label>
                  <input
                    type="text"
                    value={editForm.guardianName}
                    onChange={(e) => updateEditField("guardianName", e.target.value)}
                    placeholder="e.g. Pa Fomban"
                    className="w-full px-3 py-2 text-xs rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                    Parent / Guardian Phone
                  </label>
                  <input
                    type="tel"
                    value={editForm.guardianPhone}
                    onChange={(e) => updateEditField("guardianPhone", e.target.value)}
                    placeholder="e.g. 677000000"
                    className="w-full px-3 py-2 text-xs rounded-[5px] border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                  />
                </div>
              </div>

              {/* Footer buttons inside form with GREEN Save Changes button */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#EEEEEC]">
                <button
                  type="button"
                  onClick={() => setEditingEnrolment(null)}
                  className="px-4 py-2 rounded-[5px] border border-[#D5D5CF] text-[#444444] font-semibold hover:bg-[#FAFAF8] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditPending}
                  className="inline-flex items-center gap-1.5 px-6 py-2 rounded-[6px] font-bold text-white bg-[#2A7C13] hover:bg-[#20600E] active:scale-[0.99] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isEditPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE STUDENT CONFIRMATION MODAL --- */}
      {deletingEnrolment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[10px] bg-white shadow-2xl border border-red-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#191919]">Delete Student Record</h3>
                  <p className="text-xs text-[#666666] mt-0.5">
                    This action will permanently remove this student from your school database.
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="flex items-center gap-2 p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              {/* Student Details Card */}
              <div className="p-3.5 rounded-[6px] bg-[#FAF8F8] border border-[#EBEBEB] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#777777]">Student Name:</span>
                  <span className="font-bold text-[#191919]">
                    {deletingEnrolment.student?.first_name} {deletingEnrolment.student?.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777777]">Admission No:</span>
                  <span className="font-mono font-bold text-[#191919]">
                    {deletingEnrolment.student?.matricule}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#777777]">Class Group:</span>
                  <span className="font-semibold text-[#555555]">
                    {deletingEnrolment.class_stream?.name || "Unassigned"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-[6px] bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1 leading-relaxed">
                <p className="font-bold">⚠️ Warning:</p>
                <p>
                  Deleting this student will permanently erase their enrolment, attendance records, and any entered assessment marks for this student.
                </p>
                <p className="text-[#666666]">
                  Tip: If the student merely transferred or was dismissed, use the <strong>Status</strong> button instead to preserve historic records.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EEEEEC]">
                <button
                  type="button"
                  onClick={() => setDeletingEnrolment(null)}
                  disabled={isDeletePending}
                  className="px-4 py-2 rounded-[5px] border border-[#D5D5CF] text-[#444444] font-semibold hover:bg-[#FAFAF8] transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeletePending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[5px] font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs text-xs disabled:opacity-50"
                >
                  {isDeletePending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting Student...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Permanently</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MANAGE INSTITUTIONAL STATUS MODAL --- */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[8px] bg-white p-6 shadow-xl space-y-4 border border-[#E8DFC9]">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-full shrink-0 ${
                  newStatus === "dismissed" ? "bg-red-100 text-red-700" : "bg-[#F3F9F1] text-[#2A7C13]"
                }`}
              >
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
