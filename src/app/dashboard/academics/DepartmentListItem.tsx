"use client";

import { useState, useActionState, useEffect, useTransition } from "react";
import {
  Award,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  BookOpen,
  AlertCircle,
  Building2,
  Scale,
} from "lucide-react";
import {
  updateDepartmentAction,
  deleteDepartmentAction,
  createSubjectAction,
  updateSubjectAction,
  deleteSubjectAction,
  assignSubjectToDepartmentAction,
} from "@/app/academics/actions";

export interface SubjectItem {
  id: string;
  name: string;
  code: string;
  department_id?: string | null;
  default_coefficient: number;
  default_max_marks: number;
}

interface Props {
  dept: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
  };
  subjects?: SubjectItem[];
  unassignedSubjects?: SubjectItem[];
  hodName?: string | null;
  canManage: boolean;
}

export function DepartmentListItem({
  dept,
  subjects = [],
  unassignedSubjects = [],
  hodName,
  canManage,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingDept, setIsEditingDept] = useState(false);
  const [isConfirmingDeleteDept, setIsConfirmingDeleteDept] = useState(false);

  // New subject addition state
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAttachSubject, setShowAttachSubject] = useState(false);
  const [selectedAttachSubjectId, setSelectedAttachSubjectId] = useState("");
  const [subName, setSubName] = useState("");
  const [subCode, setSubCode] = useState("");
  const [subCoef, setSubCoef] = useState("2");
  const [subMaxMarks, setSubMaxMarks] = useState("20");

  // Edit existing subject state
  const [subjectToEdit, setSubjectToEdit] = useState<SubjectItem | null>(null);
  const [editSubName, setEditSubName] = useState("");
  const [editSubCode, setEditSubCode] = useState("");
  const [editSubCoef, setEditSubCoef] = useState("2");
  const [editSubMaxMarks, setEditSubMaxMarks] = useState("20");

  // Subject deletion state
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectItem | null>(null);
  const [deleteConfirmMarks, setDeleteConfirmMarks] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [updateState, updateFormAction, isUpdatePending] = useActionState(
    updateDepartmentAction,
    null
  );
  const [deleteState, deleteFormAction, isDeletePending] = useActionState(
    deleteDepartmentAction,
    null
  );

  useEffect(() => {
    if (updateState && "success" in updateState && updateState.success) {
      setIsEditingDept(false);
    }
  }, [updateState]);

  // Open edit modal for a subject
  const handleOpenEditSubject = (sub: SubjectItem) => {
    setSubjectToEdit(sub);
    setEditSubName(sub.name);
    setEditSubCode(sub.code);
    setEditSubCoef(String(sub.default_coefficient || 2));
    setEditSubMaxMarks(String(sub.default_max_marks || 20));
    setFeedback(null);
  };

  // Handle adding subject to this department
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;

    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("departmentId", dept.id);
      fd.set("name", subName.trim());
      if (subCode.trim()) {
        fd.set("code", subCode.trim().toUpperCase());
      }
      fd.set("defaultCoefficient", subCoef);
      fd.set("defaultMaxMarks", subMaxMarks);

      const res = await createSubjectAction(null, fd);
      if (res && "error" in res && res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: `Subject "${subName.trim()}" added to ${dept.name}.`,
        });
        setSubName("");
        setSubCode("");
        setSubCoef("2");
        setSubMaxMarks("20");
        setShowAddSubject(false);
      }
    });
  };

  // Handle attaching an existing unassigned subject to this department
  const handleAttachSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttachSubjectId) return;

    setFeedback(null);
    startTransition(async () => {
      const res = await assignSubjectToDepartmentAction(selectedAttachSubjectId, dept.id);
      if (res && "error" in res && res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        const attachedSub = unassignedSubjects.find((s) => s.id === selectedAttachSubjectId);
        setFeedback({
          type: "success",
          text: `Subject "${attachedSub?.name || "Subject"}" assigned to ${dept.name}.`,
        });
        setSelectedAttachSubjectId("");
        setShowAttachSubject(false);
      }
    });
  };

  // Handle updating an existing subject
  const handleUpdateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectToEdit || !editSubName.trim()) return;

    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("subjectId", subjectToEdit.id);
      fd.set("departmentId", dept.id);
      fd.set("name", editSubName.trim());
      if (editSubCode.trim()) {
        fd.set("code", editSubCode.trim().toUpperCase());
      }
      fd.set("defaultCoefficient", editSubCoef);
      fd.set("defaultMaxMarks", editSubMaxMarks);

      const res = await updateSubjectAction(null, fd);
      if (res && "error" in res && res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: `Subject "${editSubName.trim()}" updated successfully.`,
        });
        setSubjectToEdit(null);
      }
    });
  };

  // Handle deleting subject from department
  const handleDeleteSubject = (confirmMarks = false) => {
    if (!subjectToDelete) return;
    setFeedback(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.set("subjectId", subjectToDelete.id);
      if (confirmMarks) {
        fd.set("confirmDeleteMarks", "true");
      }

      const res = await deleteSubjectAction(null, fd);
      if (res && "error" in res && res.error) {
        if ("needsConfirmation" in res && res.needsConfirmation) {
          setDeleteConfirmMarks(true);
        } else {
          setFeedback({ type: "error", text: res.error });
          setSubjectToDelete(null);
          setDeleteConfirmMarks(false);
        }
      } else {
        setFeedback({
          type: "success",
          text: `Subject "${subjectToDelete.name}" removed from ${dept.name}.`,
        });
        setSubjectToDelete(null);
        setDeleteConfirmMarks(false);
      }
    });
  };

  return (
    <div className="rounded-[8px] border border-[#E5E5DF] bg-white overflow-hidden shadow-2xs">
      {/* Department Summary Row */}
      <div className="p-3.5 sm:p-4">
        {isEditingDept ? (
          <form action={updateFormAction} className="space-y-2.5">
            <input type="hidden" name="departmentId" value={dept.id} />
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#142010] uppercase tracking-wider">
                Edit Department
              </h4>
              <button
                type="button"
                onClick={() => setIsEditingDept(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8">
                <input
                  type="text"
                  name="name"
                  defaultValue={dept.name}
                  placeholder="Department Name"
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-[5px] border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                />
              </div>
              <div className="sm:col-span-4">
                <input
                  type="text"
                  name="code"
                  defaultValue={dept.code}
                  placeholder="Code (e.g. SCI)"
                  required
                  className="w-full px-3 py-1.5 text-xs uppercase font-mono font-bold rounded-[5px] border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                />
              </div>
            </div>

            {updateState && "error" in updateState && (
              <p className="text-xs text-red-600 font-semibold">{updateState.error}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingDept(false)}
                disabled={isUpdatePending}
                className="px-3 py-1 rounded-[4px] text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatePending}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#142010] hover:bg-stone-800 text-white rounded-[4px] text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {isUpdatePending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{isUpdatePending ? "Saving..." : "Save Department"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Department Icon & Metadata */}
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] flex items-center justify-center shrink-0 text-[#2A7C13]">
                <Building2 className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-[#142010] truncate">
                    {dept.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#FAF8F2] text-[#525E4B] text-[10px] font-mono font-bold border border-[#E8DFC9]">
                    {dept.code}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-0.5 text-xs text-[#525E4B]">
                  <Award className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>
                    Head of Dept:{" "}
                    {hodName ? (
                      <strong className="text-[#142010] font-semibold">{hodName}</strong>
                    ) : (
                      <span className="text-amber-800 italic">Unassigned</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Expand Subjects Button & Admin Controls */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setIsExpanded((p) => !p)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-bold transition-colors cursor-pointer border ${
                  isExpanded
                    ? "bg-[#2A7C13] text-white border-[#2A7C13]"
                    : "bg-[#FAF8F2] text-[#2A7C13] border-[#E8DFC9] hover:border-[#2A7C13] hover:bg-[#F3EFE3]"
                }`}
                title="View subjects in this department"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {subjects.length} {subjects.length === 1 ? "Subject" : "Subjects"}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {canManage && (
                <div className="flex items-center gap-1 pl-1 border-l border-stone-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingDept(true)}
                    className="p-1 rounded text-stone-500 hover:text-[#142010] hover:bg-stone-100 transition-colors cursor-pointer"
                    title="Edit department name and code"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDeleteDept(true)}
                    className="p-1 rounded text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete department"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Department Confirmation */}
        {isConfirmingDeleteDept && (
          <div className="mt-3 p-3 rounded-[6px] bg-red-50 border border-red-200 text-xs text-red-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-950">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Delete department &ldquo;{dept.name}&rdquo;?</span>
            </div>
            <p className="text-[11px] text-red-800 leading-relaxed">
              Subjects under this department will become general subjects. Any HOD appointment will be removed.
            </p>
            {deleteState && "error" in deleteState && (
              <p className="text-[11px] font-bold text-red-700">{deleteState.error}</p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <form action={deleteFormAction}>
                <input type="hidden" name="departmentId" value={dept.id} />
                <button
                  type="submit"
                  disabled={isDeletePending}
                  className="px-3 py-1 rounded-[4px] bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {isDeletePending && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>{isDeletePending ? "Deleting..." : "Confirm Delete"}</span>
                </button>
              </form>
              <button
                type="button"
                onClick={() => setIsConfirmingDeleteDept(false)}
                disabled={isDeletePending}
                className="px-3 py-1 rounded-[4px] bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && isExpanded && (
        <div
          className={`px-3.5 py-2 text-xs flex items-center justify-between gap-2 border-t ${
            feedback.type === "success"
              ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <Check className="w-3.5 h-3.5 text-[#2A7C13] shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expanded Department Curriculum Drawer */}
      {isExpanded && (
        <div className="border-t border-[#E5E5DF] bg-[#FAF9F5] p-3.5 sm:p-4 space-y-3">
          {/* Drawer Header Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h5 className="text-xs font-bold text-[#142010] uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-[#2A7C13]" />
                <span>Curriculum Subjects · {dept.name}</span>
                <span className="px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 font-mono text-[10px] font-bold">
                  {subjects.length}
                </span>
              </h5>
              <p className="text-[11px] text-[#525E4B] mt-0.5">
                Manage academic subjects and coefficient weightings for this department.
              </p>
            </div>

            {canManage && (
              <div className="flex items-center gap-1.5 shrink-0">
                {unassignedSubjects.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachSubject((p) => !p);
                      setShowAddSubject(false);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[5px] text-xs font-semibold transition-colors cursor-pointer border ${
                      showAttachSubject
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-white text-[#142010] border-[#D5D5CF] hover:bg-[#FAFAF8]"
                    }`}
                  >
                    <span>Attach Existing ({unassignedSubjects.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowAddSubject((p) => !p);
                    setShowAttachSubject(false);
                  }}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] text-xs font-bold transition-colors cursor-pointer shadow-2xs shrink-0 ${
                    showAddSubject
                      ? "bg-stone-200 text-stone-800 hover:bg-stone-300"
                      : "bg-[#2A7C13] hover:bg-[#20600E] text-white"
                  }`}
                >
                  {showAddSubject ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Close Form</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Subject to {dept.code}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Inline Attach Existing Subject Drawer */}
          {showAttachSubject && canManage && unassignedSubjects.length > 0 && (
            <div className="p-3.5 rounded-[6px] bg-white border border-amber-300 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                  <h6 className="text-xs font-bold text-[#142010]">
                    Attach Existing Unassigned Subject to {dept.name}
                  </h6>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAttachSubject(false)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleAttachSubject} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  required
                  value={selectedAttachSubjectId}
                  onChange={(e) => setSelectedAttachSubjectId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-[5px] border border-[#D5D5CF] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                >
                  <option value="">Select an unassigned subject...</option>
                  {unassignedSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code}) &middot; Coef {sub.default_coefficient}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={isPending || !selectedAttachSubjectId}
                  className="px-3.5 py-1.5 bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold rounded-[5px] transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 shrink-0"
                >
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Attach to {dept.code}</span>
                </button>
              </form>
            </div>
          )}

          {/* Inline Add Subject Form Card */}
          {showAddSubject && canManage && (
            <div className="p-3.5 rounded-[6px] bg-white border border-[#2A7C13]/30 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#2A7C13]" />
                  <h6 className="text-xs font-bold text-[#142010]">
                    Register New Subject in {dept.name}
                  </h6>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleAddSubject} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-[#444444] mb-1">
                      Subject Title
                    </label>
                    <input
                      type="text"
                      required
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full px-2.5 py-1.5 text-xs rounded-[5px] border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-[#444444] mb-1">
                      Subject Code <span className="text-[10px] text-[#788470] font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={subCode}
                      onChange={(e) => setSubCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CSC (optional)"
                      className="w-full px-2.5 py-1.5 text-center font-mono font-bold text-xs rounded-[5px] border border-[#D5CBB2] text-[#142010] bg-white uppercase focus:outline-none focus:border-[#2A7C13]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#444444] mb-1">
                      Coefficient
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="20"
                      required
                      value={subCoef}
                      onChange={(e) => setSubCoef(e.target.value)}
                      placeholder="2"
                      className="w-full px-2 py-1.5 text-center font-bold text-xs rounded-[5px] border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#444444] mb-1">
                      Max Mark
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="100"
                      required
                      value={subMaxMarks}
                      onChange={(e) => setSubMaxMarks(e.target.value)}
                      placeholder="20"
                      className="w-full px-2 py-1.5 text-center font-bold text-xs rounded-[5px] border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowAddSubject(false)}
                    className="px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !subName.trim() || !subCode.trim()}
                    className="px-4 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    {isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    <span>{isPending ? "Creating..." : "Save Subject"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Subjects Table Card */}
          {subjects.length === 0 ? (
            <div className="p-6 rounded-[6px] border border-dashed border-[#D5CBB2] bg-white text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-4 h-4" />
              </div>
              <h6 className="text-xs font-bold text-[#142010]">
                No subjects registered in {dept.name} yet
              </h6>
              <p className="text-[11px] text-[#525E4B] max-w-sm mx-auto">
                Add subjects to this department so teachers can record marks and administrators can generate report cards.
              </p>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowAddSubject(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add First Subject</span>
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-[6px] border border-[#E5E5DF] overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF8F2] text-[#525E4B] font-bold border-b border-[#E5E5DF]">
                      <th className="py-2.5 px-3">Subject Code</th>
                      <th className="py-2.5 px-3">Subject Title</th>
                      <th className="py-2.5 px-3 text-center">Coefficient (Weight)</th>
                      <th className="py-2.5 px-3 text-center">Max Denominator</th>
                      {canManage && <th className="py-2.5 px-3 text-center w-24">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F1ED]">
                    {subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#FFFDF8] transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-[#142010]">
                          <span className="px-1.5 py-0.5 rounded-[3px] bg-stone-100 text-stone-800 border border-stone-200 font-mono text-[11px]">
                            {sub.code}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-[#142010] text-xs">
                            {sub.name}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAF7E4] text-[#166534] font-mono font-bold text-[11px] border border-[#BBF7D0]">
                            <Scale className="w-3 h-3 text-[#2A7C13]" />
                            <span>{sub.default_coefficient}</span>
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-[#525E4B]">
                          /{sub.default_max_marks}
                        </td>
                        {canManage && (
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditSubject(sub)}
                                disabled={isPending}
                                className="p-1 rounded text-stone-500 hover:text-[#142010] hover:bg-stone-100 transition-colors cursor-pointer"
                                title={`Edit ${sub.name}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSubjectToDelete(sub);
                                  setDeleteConfirmMarks(false);
                                }}
                                disabled={isPending}
                                className="p-1 rounded text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                title={`Delete ${sub.name} from catalog`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Subject Modal Dialog */}
      {subjectToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[8px] border border-[#E5E5DF] shadow-xl w-full max-w-md p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#2A7C13]" />
                <h4 className="text-sm font-bold text-[#142010]">
                  Edit Subject: {subjectToEdit.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSubjectToEdit(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#444444] mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={editSubName}
                  onChange={(e) => setEditSubName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[5px] border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Subject Code <span className="text-[10px] text-[#788470] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={editSubCode}
                    onChange={(e) => setEditSubCode(e.target.value.toUpperCase())}
                    placeholder="Optional"
                    className="w-full px-2.5 py-1.5 text-center font-mono font-bold text-xs rounded-[5px] border border-[#D5CBB2] text-[#142010] bg-white uppercase focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Default Coef
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="20"
                    required
                    value={editSubCoef}
                    onChange={(e) => setEditSubCoef(e.target.value)}
                    className="w-full px-2 py-1.5 text-center font-bold text-xs rounded-[5px] border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Max Mark
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    required
                    value={editSubMaxMarks}
                    onChange={(e) => setEditSubMaxMarks(e.target.value)}
                    className="w-full px-2 py-1.5 text-center font-bold text-xs rounded-[5px] border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSubjectToEdit(null)}
                  disabled={isPending}
                  className="px-3 py-1 rounded-[4px] text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isPending ? "Updating..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[8px] border border-red-200 shadow-xl w-full max-w-md p-5 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-red-950">
                  Delete &ldquo;{subjectToDelete.name}&rdquo;?
                </h4>
                <p className="text-xs text-red-800">
                  Code: <strong className="font-mono">{subjectToDelete.code}</strong> · Department:{" "}
                  <strong>{dept.name}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#525E4B] leading-relaxed bg-[#FAF8F2] p-2.5 rounded-[6px] border border-[#E8DFC9]">
              {deleteConfirmMarks
                ? "Assessment marks exist for this subject. Confirming will permanently delete all recorded student marks and remove this subject from all report cards."
                : "This subject will be permanently removed from this department, class curricula, and report cards."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setSubjectToDelete(null);
                  setDeleteConfirmMarks(false);
                }}
                className="px-3 py-1.5 rounded-[4px] text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSubject(deleteConfirmMarks)}
                disabled={isPending}
                className="px-4 py-1.5 rounded-[5px] bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>
                  {isPending ? "Deleting..." : deleteConfirmMarks ? "Delete Marks & Subject" : "Confirm Delete"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentListItem;
