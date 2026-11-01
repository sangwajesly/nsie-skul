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
} from "lucide-react";
import {
  updateDepartmentAction,
  deleteDepartmentAction,
  createSubjectAction,
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
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // New subject addition state
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subName, setSubName] = useState("");
  const [subCode, setSubCode] = useState("");
  const [subCoef, setSubCoef] = useState("2");
  const [subMaxMarks, setSubMaxMarks] = useState("20");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Subject deletion confirmation state
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectItem | null>(null);
  const [deleteConfirmMarks, setDeleteConfirmMarks] = useState(false);

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
      setIsEditing(false);
    }
  }, [updateState]);

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
        setFeedback({ type: "success", text: `Subject "${subName.trim()}" added to ${dept.name}.` });
        setSubName("");
        setSubCode("");
        setSubCoef("2");
        setSubMaxMarks("20");
        setShowAddSubject(false);
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
    <div className="rounded-[8px] border border-[#E5E5DF] bg-[#FAFAF8] overflow-hidden shadow-2xs transition-all">
      {/* Department Summary Row */}
      <div className="p-3.5 space-y-2">
        {isEditing ? (
          <form action={updateFormAction} className="space-y-2 text-[12px]">
            <input type="hidden" name="departmentId" value={dept.id} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                name="name"
                defaultValue={dept.name}
                placeholder="Department Name"
                required
                className="sm:col-span-2 px-2.5 py-1 text-xs rounded border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
              />
              <input
                type="text"
                name="code"
                defaultValue={dept.code}
                placeholder="Code"
                required
                className="px-2.5 py-1 text-xs uppercase font-mono rounded border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
              />
            </div>
            {updateState && "error" in updateState && (
              <p className="text-[11px] text-red-600 font-medium">{updateState.error}</p>
            )}
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isUpdatePending}
                className="px-2.5 py-1 rounded text-[11px] text-[#666666] hover:bg-[#EAEAE6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatePending}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#191919] hover:bg-[#333333] text-white rounded text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUpdatePending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                <span>{isUpdatePending ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[13px] text-[#142010]">{dept.name}</span>
                <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EAEAE6] text-[#555555] text-[10px] font-mono font-bold">
                  {dept.code}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsExpanded((p) => !p)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-[#2A7C13] bg-[#EAF7E4] hover:bg-[#DCF2D4] border border-[#BBF7D0] transition-colors cursor-pointer"
                  title="Open department to view and edit subjects"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>{subjects.length} Subjects</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {canManage && (
                  <div className="flex items-center gap-0.5 pl-1">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1 rounded text-[#777777] hover:text-[#191919] hover:bg-[#EAEAE6] transition-colors cursor-pointer"
                      title="Edit department name/code"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="p-1 rounded text-[#777777] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isConfirmingDelete && (
              <div className="p-2 rounded bg-red-50 border border-red-200 text-xs text-red-900 space-y-1.5">
                <p className="font-semibold text-[11px]">
                  Remove department &ldquo;{dept.name}&rdquo;?
                </p>
                {deleteState && "error" in deleteState && (
                  <p className="text-[11px] text-red-700">{deleteState.error}</p>
                )}
                <div className="flex items-center gap-2">
                  <form action={deleteFormAction}>
                    <input type="hidden" name="departmentId" value={dept.id} />
                    <button
                      type="submit"
                      disabled={isDeletePending}
                      className="px-2.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {isDeletePending && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>{isDeletePending ? "Removing..." : "Yes, Remove"}</span>
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    disabled={isDeletePending}
                    className="px-2 py-0.5 rounded bg-white hover:bg-gray-100 text-[#555555] text-[11px] border border-gray-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-[#EBEBE8] text-[11px] text-[#666666]">
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>
                  Head of Department:{" "}
                  {hodName ? (
                    <strong className="text-[#191919]">{hodName}</strong>
                  ) : (
                    <span className="italic text-[#888888]">Unassigned</span>
                  )}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && isExpanded && (
        <div
          className={`px-3.5 py-2 text-xs flex items-center gap-2 border-t ${
            feedback.type === "success"
              ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <Check className="w-3.5 h-3.5 shrink-0 text-[#2A7C13]" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Expanded Department Subjects & Management Drawer */}
      {isExpanded && (
        <div className="border-t border-[#E5E5DF] bg-white p-3.5 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-[#142010] uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#2A7C13]" />
              <span>Subjects in {dept.name} ({subjects.length})</span>
            </h5>

            {canManage && (
              <button
                type="button"
                onClick={() => setShowAddSubject((p) => !p)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-bold text-white bg-[#2A7C13] hover:bg-[#20600E] shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{showAddSubject ? "Close Form" : "Add Subject"}</span>
              </button>
            )}
          </div>

          {/* Inline Add Subject Form */}
          {showAddSubject && canManage && (
            <form onSubmit={handleAddSubject} className="p-3 rounded-[6px] bg-[#FFFDF5] border border-[#E8DFC9] space-y-2.5 text-xs animate-in slide-in-from-top-1 duration-150">
              <div className="font-bold text-[#142010] flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-[#2A7C13]" />
                <span>New Subject for {dept.name}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    required
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder="Subject Name (e.g. Computer Science)"
                    className="w-full px-2.5 py-1.5 rounded-[5px] border border-[#D5CBB2] text-xs text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value.toUpperCase())}
                    placeholder="Code (CSC)"
                    className="w-full px-2.5 py-1.5 text-center font-mono font-bold rounded-[5px] border border-[#D5CBB2] text-xs text-[#142010] bg-white uppercase focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="15"
                    required
                    value={subCoef}
                    onChange={(e) => setSubCoef(e.target.value)}
                    placeholder="Coef"
                    title="Default Coefficient"
                    className="w-full px-2 py-1.5 text-center font-bold rounded-[5px] border border-[#D5CBB2] text-xs text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isPending || !subName.trim() || !subCode.trim()}
                    className="w-full py-1.5 px-3 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Subjects Table */}
          {subjects.length === 0 ? (
            <div className="p-4 rounded-[6px] border border-dashed border-[#D5CBB2] text-center text-xs text-[#788470]">
              No subjects registered under {dept.name} yet. Click &ldquo;Add Subject&rdquo; above to create one.
            </div>
          ) : (
            <div className="border border-[#E5E5DF] rounded-[6px] overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FAF8F2] text-[#525E4B] font-bold border-b border-[#E5E5DF]">
                  <tr>
                    <th className="py-2 px-3">Code</th>
                    <th className="py-2 px-3">Subject Name</th>
                    <th className="py-2 px-3 text-center w-20">Default Coef</th>
                    <th className="py-2 px-3 text-center w-20">Max Mark</th>
                    {canManage && <th className="py-2 px-3 text-center w-16">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEEEC]">
                  {subjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[#FFFDF8] transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-[#142010]">
                        <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EAEAE6] text-[#555555]">
                          {sub.code}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-[#142010]">{sub.name}</td>
                      <td className="py-2 px-3 text-center font-mono text-[#525E4B]">
                        {sub.default_coefficient}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-[#525E4B]">
                        /{sub.default_max_marks}
                      </td>
                      {canManage && (
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSubjectToDelete(sub);
                              setDeleteConfirmMarks(false);
                            }}
                            disabled={isPending}
                            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            title={`Delete ${sub.name} from school catalog`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Subject Confirmation Overlay */}
      {subjectToDelete && (
        <div className="p-3.5 bg-red-50 border-t border-red-200 animate-in slide-in-from-bottom-1 duration-150">
          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded-full bg-red-100 text-red-700 shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1 text-xs">
              <h6 className="font-bold text-red-900">
                Delete subject &ldquo;{subjectToDelete.name}&rdquo; from {dept.name}?
              </h6>
              <p className="text-[11px] text-red-700">
                {deleteConfirmMarks
                  ? "Marks exist for this subject. Confirming will delete all associated assessment marks and remove the subject from all class report cards."
                  : "This will remove the subject from this department and delete it from the school catalog."}
              </p>
              <div className="flex items-center gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => handleDeleteSubject(deleteConfirmMarks)}
                  disabled={isPending}
                  className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                >
                  {isPending ? "Deleting..." : deleteConfirmMarks ? "Delete Marks & Subject" : "Confirm Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubjectToDelete(null);
                    setDeleteConfirmMarks(false);
                  }}
                  className="px-2.5 py-1 bg-white border border-red-300 text-red-800 rounded text-xs font-semibold hover:bg-red-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
