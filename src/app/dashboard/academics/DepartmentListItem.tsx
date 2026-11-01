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
  Sparkles,
  HelpCircle,
} from "lucide-react";
import {
  updateDepartmentAction,
  deleteDepartmentAction,
  createSubjectAction,
  updateSubjectAction,
  deleteSubjectAction,
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
  hodName?: string | null;
  canManage: boolean;
}

export function DepartmentListItem({ dept, subjects = [], hodName, canManage }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingDept, setIsEditingDept] = useState(false);
  const [isConfirmingDeleteDept, setIsConfirmingDeleteDept] = useState(false);

  // New subject addition state
  const [showAddSubject, setShowAddSubject] = useState(false);
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
    if (!subName.trim() || !subCode.trim()) return;

    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("departmentId", dept.id);
      fd.set("name", subName.trim());
      fd.set("code", subCode.trim().toUpperCase());
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

  // Handle updating an existing subject
  const handleUpdateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectToEdit || !editSubName.trim() || !editSubCode.trim()) return;

    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("subjectId", subjectToEdit.id);
      fd.set("departmentId", dept.id);
      fd.set("name", editSubName.trim());
      fd.set("code", editSubCode.trim().toUpperCase());
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
    <div className="rounded-2xl border border-stone-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-xs transition-all">
      {/* Department Summary Row */}
      <div className="p-4 sm:p-5">
        {isEditingDept ? (
          <form action={updateFormAction} className="space-y-3">
            <input type="hidden" name="departmentId" value={dept.id} />
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#142010] uppercase tracking-wider">
                Edit Department Details
              </h4>
              <button
                type="button"
                onClick={() => setIsEditingDept(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-8">
                <input
                  type="text"
                  name="name"
                  defaultValue={dept.name}
                  placeholder="Department Name"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
                />
              </div>
              <div className="sm:col-span-4">
                <input
                  type="text"
                  name="code"
                  defaultValue={dept.code}
                  placeholder="CODE (e.g. SCI)"
                  required
                  className="w-full px-3 py-2 text-xs uppercase font-mono font-bold rounded-xl border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
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
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatePending}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#142010] hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
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
            {/* Left: Department Emblem & Metadata */}
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F2] border border-[#E8DFC9] flex items-center justify-center shrink-0 text-[#2A7C13] shadow-2xs">
                <Building2 className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-sm sm:text-base text-[#142010] tracking-tight truncate">
                    {dept.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-[#FAF8F2] text-[#525E4B] text-[10px] font-mono font-bold border border-[#E8DFC9]">
                    {dept.code}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-[#525E4B] flex-wrap">
                  <div className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Head of Dept:{" "}
                      {hodName ? (
                        <strong className="text-[#142010] font-semibold">{hodName}</strong>
                      ) : (
                        <span className="text-amber-800/80 italic font-medium">Unassigned</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Expand Subjects Button & Admin Controls */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setIsExpanded((p) => !p)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isExpanded
                    ? "bg-[#2A7C13] text-white border-[#2A7C13] shadow-2xs"
                    : "bg-[#FAF8F2] text-[#2A7C13] border-[#E8DFC9] hover:border-[#2A7C13] hover:bg-[#F3EFE3]"
                }`}
                title="Open department to view and edit curriculum subjects"
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
                    className="p-1.5 rounded-lg text-stone-500 hover:text-[#142010] hover:bg-stone-100 transition-colors cursor-pointer"
                    title="Edit department name and code"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDeleteDept(true)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete department"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Department Inline Confirmation */}
        {isConfirmingDeleteDept && (
          <div className="mt-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-red-950">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Are you sure you want to delete department &ldquo;{dept.name}&rdquo;?</span>
            </div>
            <p className="text-[11px] text-red-800 leading-relaxed">
              Subjects under this department will become unassigned general subjects. Any HOD appointment will be revoked.
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
                  className="px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {isDeletePending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isDeletePending ? "Deleting..." : "Confirm Delete"}</span>
                </button>
              </form>
              <button
                type="button"
                onClick={() => setIsConfirmingDeleteDept(false)}
                disabled={isDeletePending}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global Feedback Banner */}
      {feedback && isExpanded && (
        <div
          className={`px-4 sm:px-5 py-2.5 text-xs flex items-center justify-between gap-2 border-t ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expanded Department Curriculum Drawer */}
      {isExpanded && (
        <div className="border-t border-stone-200/90 bg-[#FAF9F5] p-4 sm:p-6 space-y-4 animate-in fade-in duration-150">
          {/* Drawer Header Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h5 className="text-xs font-extrabold text-[#142010] uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#2A7C13]" />
                <span>Curriculum Subjects · {dept.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700 font-mono text-[10px] font-bold">
                  {subjects.length}
                </span>
              </h5>
              <p className="text-[11px] text-[#525E4B] mt-0.5">
                Manage all academic subjects, coefficient weightings, and marksDenominators for this department.
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={() => setShowAddSubject((p) => !p)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0 ${
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
            )}
          </div>

          {/* Inline Add Subject Form Card */}
          {showAddSubject && canManage && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#2A7C13]/30 shadow-sm space-y-3.5 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#2A7C13] flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="text-xs font-black text-[#142010]">
                      Register New Subject in {dept.name}
                    </h6>
                    <p className="text-[10px] text-[#525E4B]">
                      Once added, this subject becomes available for all streams and report cards.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSubject} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
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
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-[#444444] mb-1">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      required
                      value={subCode}
                      onChange={(e) => setSubCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CSC"
                      className="w-full px-3 py-2 text-center font-mono font-bold text-xs rounded-xl border border-[#D5CBB2] text-[#142010] bg-white uppercase focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#444444] mb-1">
                      Coefficient (Weight)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="15"
                      required
                      value={subCoef}
                      onChange={(e) => setSubCoef(e.target.value)}
                      placeholder="2"
                      className="w-full px-3 py-2 text-center font-bold text-xs rounded-xl border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
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
                      className="w-full px-3 py-2 text-center font-bold text-xs rounded-xl border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowAddSubject(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !subName.trim() || !subCode.trim()}
                    className="px-5 py-2 rounded-xl bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>{isPending ? "Creating..." : "Save Subject"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Subjects Table Card */}
          {subjects.length === 0 ? (
            <div className="p-8 rounded-2xl border-2 border-dashed border-[#D5CBB2] bg-white text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h6 className="text-sm font-bold text-[#142010]">
                  No subjects in {dept.name} yet
                </h6>
                <p className="text-xs text-[#525E4B] max-w-sm mx-auto">
                  Add subjects to this department so teachers can record marks and administrators can generate report cards.
                </p>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowAddSubject(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Subject</span>
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-stone-200/90 overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF8F2] text-[#525E4B] font-bold border-b border-stone-200/90">
                      <th className="py-3 px-4">Subject Code</th>
                      <th className="py-3 px-4">Subject Title</th>
                      <th className="py-3 px-4 text-center">Coefficient (Weight)</th>
                      <th className="py-3 px-4 text-center">Max Score</th>
                      {canManage && <th className="py-3 px-4 text-center w-28">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#FFFDF8] transition-colors group">
                        <td className="py-3 px-4 font-mono font-bold text-[#142010]">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200 font-mono text-[11px]">
                            {sub.code}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#142010] text-xs sm:text-sm">
                            {sub.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold text-[11px] border border-emerald-200/70">
                            <Scale className="w-3 h-3 text-[#2A7C13]" />
                            <span>{sub.default_coefficient}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-[#525E4B]">
                          /{sub.default_max_marks}
                        </td>
                        {canManage && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditSubject(sub)}
                                disabled={isPending}
                                className="p-1.5 rounded-lg text-stone-500 hover:text-[#142010] hover:bg-stone-100 transition-colors cursor-pointer"
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
                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2A7C13] flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#142010]">
                    Edit Subject: {subjectToEdit.name}
                  </h4>
                  <p className="text-[11px] text-[#525E4B]">
                    Department: <strong>{dept.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubjectToEdit(null)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#444444] mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={editSubName}
                  onChange={(e) => setEditSubName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editSubCode}
                    onChange={(e) => setEditSubCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-center font-mono font-bold text-xs rounded-xl border border-[#D5CBB2] text-[#142010] bg-white uppercase focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Default Coef
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="15"
                    required
                    value={editSubCoef}
                    onChange={(e) => setEditSubCoef(e.target.value)}
                    className="w-full px-3 py-2 text-center font-bold text-xs rounded-xl border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
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
                    className="w-full px-3 py-2 text-center font-bold text-xs rounded-xl border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSubjectToEdit(null)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-red-200 shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-extrabold text-red-950">
                  Delete &ldquo;{subjectToDelete.name}&rdquo;?
                </h4>
                <p className="text-xs text-red-800 leading-relaxed">
                  Code: <strong className="font-mono">{subjectToDelete.code}</strong> · Department:{" "}
                  <strong>{dept.name}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#525E4B] leading-relaxed bg-[#FAF8F2] p-3 rounded-xl border border-[#E8DFC9]">
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSubject(deleteConfirmMarks)}
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
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
