"use client";

import { useState, useTransition, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Save,
  Eraser,
  GraduationCap,
  Users,
  Search,
} from "lucide-react";
import {
  addClassSubjectAction,
  removeClassSubjectAction,
  cleanClassSubjectsAction,
  updateStreamCoefficientsBatchAction,
} from "@/app/academics/actions";
import { TeacherAssignment } from "@/types/database";

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  default_coefficient: number;
  default_max_marks: number;
  department?: { id: string; name: string } | null;
}

interface ClassSubjectConfig {
  class_stream_id: string;
  subject_id: string;
  coefficient: number;
  max_marks: number;
}

interface StreamItem {
  id: string;
  name: string;
  class_master_id?: string | null;
  class_master?: { full_name?: string | null } | null;
}

interface ClassItem {
  id: string;
  name: string;
  level_order: number;
  cycle: string;
  streams: StreamItem[];
}

interface Props {
  classesWithStreams: ClassItem[];
  subjects: SubjectOption[];
  classSubjects: ClassSubjectConfig[];
  teacherAssignments: TeacherAssignment[];
  canManageAcademics: boolean;
}

export function ClassCurriculumManager({
  classesWithStreams,
  subjects,
  classSubjects,
  teacherAssignments,
  canManageAcademics,
}: Props) {
  const allStreams = useMemo(() => {
    return classesWithStreams.flatMap((cls) =>
      cls.streams.map((stream) => ({
        id: stream.id,
        name: `${cls.name} ${stream.name}`,
        className: cls.name,
        streamName: stream.name,
      }))
    );
  }, [classesWithStreams]);

  const [selectedStreamId, setSelectedStreamId] = useState<string>(
    allStreams[0]?.id || ""
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New subject addition state
  const [selectedNewSubjectId, setSelectedNewSubjectId] = useState("");
  const [newCoefficient, setNewCoefficient] = useState("2");
  const [newMaxMarks, setNewMaxMarks] = useState("20");

  // Subject deletion state
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectOption | null>(null);
  const [deleteConfirmMarks, setDeleteConfirmMarks] = useState(false);

  const selectedStream = useMemo(() => {
    return allStreams.find((s) => s.id === selectedStreamId) || allStreams[0] || null;
  }, [allStreams, selectedStreamId]);

  // Map of configs for currently selected stream
  const currentStreamConfigs = useMemo(() => {
    const map = new Map<string, ClassSubjectConfig>();
    classSubjects
      .filter((cs) => cs.class_stream_id === selectedStream?.id)
      .forEach((cs) => map.set(cs.subject_id, cs));
    return map;
  }, [classSubjects, selectedStream?.id]);

  // Teacher name lookup for selected stream
  const streamTeacherMap = useMemo(() => {
    const map = new Map<string, string>();
    teacherAssignments
      .filter((ta) => ta.class_stream_id === selectedStream?.id)
      .forEach((ta) => {
        const teacherName = (ta as any).teacher?.full_name;
        if (teacherName) {
          const existing = map.get(ta.subject_id);
          map.set(ta.subject_id, existing ? `${existing} / ${teacherName}` : teacherName);
        }
      });
    return map;
  }, [teacherAssignments, selectedStream?.id]);

  // Assigned subjects for selected stream
  const assignedSubjects = useMemo(() => {
    return subjects.filter((sub) => currentStreamConfigs.has(sub.id));
  }, [subjects, currentStreamConfigs]);

  // Available subjects to add
  const availableSubjectsToAdd = useMemo(() => {
    return subjects.filter((sub) => !currentStreamConfigs.has(sub.id));
  }, [subjects, currentStreamConfigs]);

  // Filtered assigned subjects based on search
  const filteredAssigned = useMemo(() => {
    if (!searchTerm.trim()) return assignedSubjects;
    const q = searchTerm.toLowerCase();
    return assignedSubjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.department?.name && s.department.name.toLowerCase().includes(q))
    );
  }, [assignedSubjects, searchTerm]);

  const handleSelectNewSubject = (subId: string) => {
    setSelectedNewSubjectId(subId);
    const found = subjects.find((s) => s.id === subId);
    if (found) {
      setNewCoefficient(String(found.default_coefficient || 2));
      setNewMaxMarks(String(found.default_max_marks || 20));
    }
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStream || !selectedNewSubjectId) return;

    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("classStreamId", selectedStream.id);
      fd.set("subjectId", selectedNewSubjectId);
      fd.set("coefficient", newCoefficient);
      fd.set("maxMarks", newMaxMarks);

      const res = await addClassSubjectAction(fd);
      if (res?.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: `Added subject to ${selectedStream.name}.`,
        });
        setSelectedNewSubjectId("");
      }
    });
  };

  const handleRemoveSubject = (confirmMarks = false) => {
    if (!selectedStream || !subjectToDelete) return;
    setFeedback(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.set("classStreamId", selectedStream.id);
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
        setFeedback({
          type: "success",
          text: `Removed ${subjectToDelete.name} from ${selectedStream.name}.`,
        });
        setSubjectToDelete(null);
        setDeleteConfirmMarks(false);
      }
    });
  };

  const handleCleanUnassigned = () => {
    if (!selectedStream) return;
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("classStreamId", selectedStream.id);

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

  return (
    <div className="space-y-5">
      {/* 1. Header & Class Selector */}
      <div className="p-4 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#142010] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#2A7C13]" />
              <span>Class Subjects & Curriculum</span>
            </h3>
            <p className="text-xs text-[#525E4B] mt-0.5">
              Control exactly which subjects belong to each class. A subject will only appear on a student report card if it is assigned here.
            </p>
          </div>

          {/* Class Stream Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-[#525E4B] shrink-0">Class:</label>
            <select
              value={selectedStreamId}
              onChange={(e) => {
                setSelectedStreamId(e.target.value);
                setFeedback(null);
                setSubjectToDelete(null);
              }}
              className="px-3 py-1.5 rounded-[6px] border border-[#D5CBB2] bg-[#FFFDF5] text-xs font-extrabold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
            >
              {allStreams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-[6px] text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {selectedStream && (
        <div className="space-y-4">
          {/* 2. Add Subject to this Class Form */}
          {canManageAcademics && (
            <div className="p-4 rounded-[10px] bg-[#FFFDF5] border border-[#E8DFC9] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#142010] flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#2A7C13]" />
                  Add Subject to {selectedStream.name}
                </span>
                {availableSubjectsToAdd.length === 0 && (
                  <span className="text-[11px] text-[#788470] italic">
                    All school subjects are assigned to this class
                  </span>
                )}
              </div>

              {availableSubjectsToAdd.length > 0 ? (
                <form onSubmit={handleAddSubject} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
                  <div className="sm:col-span-6">
                    <select
                      value={selectedNewSubjectId}
                      onChange={(e) => handleSelectNewSubject(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-[6px] border border-[#D5CBB2] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                    >
                      <option value="">Select a subject to add...</option>
                      {availableSubjectsToAdd.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code}) {s.department?.name ? `· ${s.department.name}` : ""} - Coef {s.default_coefficient}
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
                      className="w-full px-3 py-2 text-center font-bold rounded-[6px] border border-[#D5CBB2] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
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
                      className="w-full px-3 py-2 text-center rounded-[6px] border border-[#D5CBB2] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={isPending || !selectedNewSubjectId}
                      className="w-full py-2 px-3 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isPending ? "Adding..." : "Add Subject"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-[11px] text-[#788470]">
                  All registered subjects in your school curriculum are currently assigned to {selectedStream.name}.
                </p>
              )}
            </div>
          )}

          {/* 3. Assigned Subjects List */}
          <div className="p-4 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F0EFEA]">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-[#142010]">
                  Subjects in {selectedStream.name}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-[#EAF7E4] text-[#2A7C13] font-bold text-xs border border-[#76C457]/30">
                  {assignedSubjects.length} Assigned
                </span>
              </div>

              <div className="flex items-center gap-2">
                {assignedSubjects.length > 12 && canManageAcademics && (
                  <button
                    type="button"
                    onClick={handleCleanUnassigned}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-xs font-bold text-[#B45309] bg-[#FFF8CF] hover:bg-[#FFF3B0] border border-[#FBE6C2] transition-colors cursor-pointer"
                    title="Remove all subjects that have no teacher assigned and no recorded marks"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Clean Unused Subjects</span>
                  </button>
                )}

                {assignedSubjects.length > 5 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#788470] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filter subjects..."
                      className="pl-8 pr-3 py-1 rounded-[5px] border border-[#D5CBB2] text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13] w-40"
                    />
                  </div>
                )}
              </div>
            </div>

            {assignedSubjects.length === 0 ? (
              <div className="p-8 text-center rounded-[8px] border border-dashed border-[#D5CBB2] bg-[#FAF8F2] space-y-2">
                <BookOpen className="w-8 h-8 text-[#788470] mx-auto opacity-50" />
                <h5 className="text-xs font-bold text-[#142010]">
                  No subjects assigned to {selectedStream.name} yet
                </h5>
                <p className="text-[11px] text-[#788470] max-w-md mx-auto">
                  Use the "Add Subject" form above to select the subjects studied in this class. Report cards will only include subjects assigned here.
                </p>
              </div>
            ) : (
              <div className="border border-[#E8DFC9] rounded-[8px] overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#FAF8F2] text-[#525E4B] font-bold border-b border-[#E8DFC9]">
                    <tr>
                      <th className="py-2.5 px-3">Subject Name</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3 text-center w-24">Class Coef</th>
                      <th className="py-2.5 px-3 text-center w-24">Max Mark</th>
                      <th className="py-2.5 px-3">Assigned Teacher</th>
                      {canManageAcademics && (
                        <th className="py-2.5 px-3 text-center w-20">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EFEA]">
                    {filteredAssigned.map((sub) => {
                      const cfg = currentStreamConfigs.get(sub.id);
                      const teacherName = streamTeacherMap.get(sub.id);

                      return (
                        <tr key={sub.id} className="hover:bg-[#FFFDF8] transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-[#142010]">{sub.name}</div>
                            <div className="font-mono text-[10px] text-[#788470]">{sub.code}</div>
                          </td>
                          <td className="py-2.5 px-3 text-[#525E4B]">
                            {sub.department?.name || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-[#142010]">
                            {cfg?.coefficient ?? sub.default_coefficient}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-[#525E4B]">
                            / {cfg?.max_marks ?? sub.default_max_marks ?? 20}
                          </td>
                          <td className="py-2.5 px-3">
                            {teacherName ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#166534] bg-[#EAF7E4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                                <Users className="w-3 h-3" />
                                {teacherName}
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#788470] italic">
                                None assigned
                              </span>
                            )}
                          </td>
                          {canManageAcademics && (
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSubjectToDelete(sub);
                                  setDeleteConfirmMarks(false);
                                }}
                                disabled={isPending}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-red-600 hover:text-red-800 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer text-[11px] font-semibold"
                                title={`Delete ${sub.name} from ${selectedStream.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Subject Confirmation Modal Overlay */}
      {subjectToDelete && selectedStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[10px] border border-red-200 shadow-2xl w-full max-w-md p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-red-700">
              <div className="p-2 rounded-full bg-red-100 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-red-900">
                  Remove {subjectToDelete.name}?
                </h4>
                <p className="text-[11px] text-red-700">
                  Target class: <strong>{selectedStream.name}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#525E4B] leading-relaxed">
              {deleteConfirmMarks
                ? "Assessment marks exist for this subject in this class. Confirming deletion will permanently delete those marks and remove this subject from student report cards."
                : "This subject will be removed from this class curriculum and will no longer appear on student report cards."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0EFEA]">
              <button
                type="button"
                onClick={() => {
                  setSubjectToDelete(null);
                  setDeleteConfirmMarks(false);
                }}
                className="px-3.5 py-1.5 rounded-[5px] border border-[#D5CBB2] text-xs font-semibold text-[#525E4B] hover:bg-[#FAF8F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemoveSubject(deleteConfirmMarks)}
                disabled={isPending}
                className="px-4 py-1.5 rounded-[5px] bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {isPending ? "Removing..." : deleteConfirmMarks ? "Delete Marks & Remove Subject" : "Confirm Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
