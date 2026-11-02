"use client";

import { useState, useActionState, useEffect, useTransition } from "react";
import {
  SlidersHorizontal,
  X,
  Check,
  Save,
  Plus,
  Trash2,
  BookOpen,
  AlertCircle,
  Sparkles,
  Eraser,
} from "lucide-react";
import {
  updateStreamCoefficientsBatchAction,
  addClassSubjectAction,
  removeClassSubjectAction,
  cleanClassSubjectsAction,
} from "@/app/academics/actions";

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  default_coefficient: number;
  default_max_marks: number;
  department?: { id: string; name: string } | null;
}

interface ClassSubjectConfig {
  subject_id: string;
  coefficient: number;
  max_marks: number;
}

interface Props {
  streamId: string;
  streamName: string;
  subjects: SubjectOption[];
  currentConfigs: ClassSubjectConfig[];
  buttonLabel?: string;
  buttonClassName?: string;
}

export function ClassStreamCoefficientsModal({
  streamId,
  streamName,
  subjects,
  currentConfigs,
  buttonLabel,
  buttonClassName,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New subject addition form state
  const [selectedNewSubjectId, setSelectedNewSubjectId] = useState("");
  const [newCoefficient, setNewCoefficient] = useState("2");
  const [newMaxMarks, setNewMaxMarks] = useState("20");

  // Subject deletion confirmation state
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectOption | null>(null);
  const [deleteConfirmMarks, setDeleteConfirmMarks] = useState(false);

  // Batch update coefficients state
  const [batchState, batchFormAction, isBatchPending] = useActionState(
    updateStreamCoefficientsBatchAction,
    null
  );

  const configMap = new Map<string, ClassSubjectConfig>();
  currentConfigs.forEach((c) => configMap.set(c.subject_id, c));

  // Determine subjects currently assigned to this class stream
  const assignedSubjects = subjects.filter((sub) => configMap.has(sub.id));

  // Determine available subjects in the school that are not yet in this class
  const availableSubjectsToAdd = subjects.filter((sub) => !configMap.has(sub.id));

  // When a new subject is selected in the dropdown, prefill its default coefficient
  const handleSelectNewSubject = (subId: string) => {
    setSelectedNewSubjectId(subId);
    const found = subjects.find((s) => s.id === subId);
    if (found) {
      setNewCoefficient(String(found.default_coefficient || 2));
      setNewMaxMarks(String(found.default_max_marks || 20));
    }
  };

  useEffect(() => {
    if (batchState && "success" in batchState && batchState.success) {
      setFeedback({ type: "success", text: batchState.message || "Coefficients updated successfully." });
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
    if (batchState && "error" in batchState && batchState.error) {
      setFeedback({ type: "error", text: batchState.error });
    }
  }, [batchState]);

  // Handle Add Subject to Class
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNewSubjectId) return;

    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("classStreamId", streamId);
      fd.set("subjectId", selectedNewSubjectId);
      fd.set("coefficient", newCoefficient);
      fd.set("maxMarks", newMaxMarks);

      const res = await addClassSubjectAction(fd);
      if (res?.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({ type: "success", text: "Subject added to this class." });
        setSelectedNewSubjectId("");
      }
    });
  };

  // Handle Remove Subject from Class
  const handleRemoveSubject = (confirmMarks = false) => {
    if (!subjectToDelete) return;
    setFeedback(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.set("classStreamId", streamId);
      fd.set("subjectId", subjectToDelete.id);
      if (confirmMarks) {
        fd.set("confirmDeleteMarks", "true");
      }

      const res = await removeClassSubjectAction(fd);
      if (res?.error) {
        if ("needsConfirmation" in res && res.needsConfirmation) {
          setDeleteConfirmMarks(true);
        } else {
          setFeedback({ type: "error", text: res.error });
          setSubjectToDelete(null);
          setDeleteConfirmMarks(false);
        }
      } else {
        setFeedback({ type: "success", text: "Subject removed from this class." });
        setSubjectToDelete(null);
        setDeleteConfirmMarks(false);
      }
    });
  };

  // Handle Clean Unassigned Subjects (bulk cleanup of extra subjects with no marks/teachers)
  const handleCleanUnassigned = () => {
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("classStreamId", streamId);

      const res = await cleanClassSubjectsAction(fd);
      if (res?.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: res?.message || "Cleaned up unassigned subjects.",
        });
      }
    });
  };

  if (!isOpen) {
    const count = assignedSubjects.length;
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          buttonClassName ||
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[11px] font-semibold bg-[#FAFAF8] hover:bg-[#F5F5F0] text-[#191919] border border-[#D5D5CF] transition-colors shadow-2xs cursor-pointer select-none"
        }
        title={`Manage subjects and curriculum for ${streamName}`}
      >
        <BookOpen className="w-3.5 h-3.5 text-[#2A7C13]" />
        <span>{buttonLabel || (count > 0 ? `${count} Subjects` : "Manage Subjects")}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-[10px] border border-[#E5E5DF] shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#EEEEEC] flex items-center justify-between bg-[#FAFAF8]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-[#EAF7E4] text-[#2A7C13]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#191919]">
                Class Subjects: {streamName}
              </h3>
              <p className="text-[11px] text-[#777777]">
                Only subjects listed here will appear on student report cards and in mark sheets for this class.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setSubjectToDelete(null);
              setDeleteConfirmMarks(false);
              setFeedback(null);
            }}
            className="p-1 rounded text-[#888888] hover:text-[#191919] hover:bg-[#EAEAE6] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center gap-2 border-b ${
              feedback.type === "success"
                ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 shrink-0 text-[#2A7C13]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* 1. Add Subject to this Class Bar */}
          <div className="p-3.5 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#142010] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#2A7C13]" />
                Add Subject to this Class
              </span>
              {availableSubjectsToAdd.length === 0 && (
                <span className="text-[10.5px] text-[#788470] italic">
                  All school subjects are assigned
                </span>
              )}
            </div>

            {availableSubjectsToAdd.length > 0 ? (
              <form onSubmit={handleAddSubject} className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                <div className="sm:col-span-6">
                  <select
                    value={selectedNewSubjectId}
                    onChange={(e) => handleSelectNewSubject(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-[5px] border border-[#D5CBB2] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                  >
                    <option value="">Select subject to add...</option>
                    {availableSubjectsToAdd.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) - Coef {s.default_coefficient}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="15"
                    required
                    value={newCoefficient}
                    onChange={(e) => setNewCoefficient(e.target.value)}
                    placeholder="Coef"
                    title="Class Coefficient"
                    className="w-full px-2 py-1.5 text-center font-bold rounded-[5px] border border-[#D5CBB2] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    step="1"
                    min="5"
                    max="100"
                    required
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(e.target.value)}
                    placeholder="Max"
                    title="Max Marks (usually 20)"
                    className="w-full px-2 py-1.5 text-center rounded-[5px] border border-[#D5CBB2] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isPending || !selectedNewSubjectId}
                    className="w-full py-1.5 px-3 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-2xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-[11px] text-[#788470]">
                All registered subjects in your school have been assigned to this class.
              </p>
            )}
          </div>

          {/* 2. Currently Assigned Subjects Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#142010] uppercase tracking-wider">
                Assigned Curriculum ({assignedSubjects.length} Subjects)
              </h4>
              {assignedSubjects.length > 12 && (
                <button
                  type="button"
                  onClick={handleCleanUnassigned}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold text-[#B45309] bg-[#FFF8CF] hover:bg-[#FFF3B0] border border-[#FBE6C2] transition-colors cursor-pointer"
                  title="Remove subjects that have no teacher and no recorded marks"
                >
                  <Eraser className="w-3 h-3" />
                  <span>Clean Unused Subjects</span>
                </button>
              )}
            </div>

            {assignedSubjects.length === 0 ? (
              <div className="p-6 text-center rounded-[8px] border border-dashed border-[#D5CBB2] bg-[#FAF8F2] space-y-1">
                <BookOpen className="w-6 h-6 text-[#788470] mx-auto opacity-60" />
                <p className="text-xs font-bold text-[#142010]">No subjects assigned to this class yet</p>
                <p className="text-[11px] text-[#788470]">
                  Use the form above to add the specific subjects taught in {streamName}.
                </p>
              </div>
            ) : (
              <form action={batchFormAction} className="space-y-3">
                <input type="hidden" name="classStreamId" value={streamId} />
                <div className="border border-[#E5E5DF] rounded-[8px] overflow-hidden text-xs shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F6F6F4] text-[#525E4B] font-bold border-b border-[#E5E5DF]">
                      <tr>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3 text-center w-24">Default</th>
                        <th className="py-2.5 px-3 w-28">Class Coef</th>
                        <th className="py-2.5 px-3 w-24">Max Mark</th>
                        <th className="py-2.5 px-3 text-center w-16">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEEEC]">
                      {assignedSubjects.map((sub) => {
                        const cfg = configMap.get(sub.id);
                        const effectiveCoef = cfg?.coefficient ?? sub.default_coefficient ?? 2;
                        const effectiveMax = cfg?.max_marks ?? sub.default_max_marks ?? 20;

                        return (
                          <tr key={sub.id} className="hover:bg-[#FFFDF8] transition-colors">
                            <td className="py-2 px-3">
                              <div className="font-bold text-[#142010]">{sub.name}</div>
                              <div className="font-mono text-[10px] text-[#788470]">
                                {sub.code} {sub.department?.name ? `· ${sub.department.name}` : ""}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-[#788470]">
                              {sub.default_coefficient}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                name={`coef_${sub.id}`}
                                defaultValue={effectiveCoef}
                                step="0.5"
                                min="0.5"
                                max="15"
                                required
                                aria-label={`Coefficient for ${sub.name}`}
                                className="w-full px-2 py-1 text-xs font-mono font-bold rounded border border-[#D5CBB2] bg-white text-center focus:outline-none focus:border-[#2A7C13]"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                name={`max_${sub.id}`}
                                defaultValue={effectiveMax}
                                step="1"
                                min="5"
                                max="100"
                                required
                                aria-label={`Max mark for ${sub.name}`}
                                className="w-full px-2 py-1 text-xs font-mono rounded border border-[#D5CBB2] bg-white text-center focus:outline-none focus:border-[#2A7C13]"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSubjectToDelete(sub);
                                  setDeleteConfirmMarks(false);
                                }}
                                disabled={isPending}
                                className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                title={`Remove ${sub.name} from this class`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#788470]">
                    Only these <strong>{assignedSubjects.length}</strong> subjects will appear on {streamName} report cards.
                  </span>
                  <button
                    type="submit"
                    disabled={isBatchPending || assignedSubjects.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#142010] hover:bg-[#1E3018] text-white rounded-[5px] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isBatchPending ? "Saving..." : "Save Coefficients"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Delete Subject Confirmation Modal Overlay */}
        {subjectToDelete && (
          <div className="p-4 bg-red-50 border-t border-red-200 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-red-100 text-red-700 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1">
                <h5 className="text-xs font-bold text-red-900">
                  Remove {subjectToDelete.name} from {streamName}?
                </h5>
                <p className="text-[11px] text-red-700">
                  {deleteConfirmMarks
                    ? "Marks are recorded for this subject in this class. Confirming will delete the marks and remove the subject from this class report card."
                    : "This subject will no longer appear on report cards or mark sheets for this class."}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(deleteConfirmMarks)}
                    disabled={isPending}
                    className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-bold cursor-pointer transition-colors"
                  >
                    {isPending ? "Removing..." : deleteConfirmMarks ? "Delete Marks & Remove Subject" : "Confirm Remove"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubjectToDelete(null);
                      setDeleteConfirmMarks(false);
                    }}
                    className="px-3 py-1 bg-white border border-red-300 text-red-800 rounded text-xs font-semibold hover:bg-red-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
