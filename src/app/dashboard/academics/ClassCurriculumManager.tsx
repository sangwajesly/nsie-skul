"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Eraser,
  Users,
  Search,
  Layers,
  Award,
  ChevronDown,
  X,
  SlidersHorizontal,
} from "lucide-react";
import {
  addClassSubjectAction,
  removeClassSubjectAction,
  cleanClassSubjectsAction,
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
  // Format stream names cleanly without duplicate class prefix (e.g. "Form 1 A", not "Form 1 Form 1 A")
  const allStreams = useMemo(() => {
    return classesWithStreams.flatMap((cls) =>
      cls.streams.map((stream) => {
        const streamCleanName = stream.name.trim();
        const classCleanName = cls.name.trim();
        const displayName = streamCleanName.toLowerCase().startsWith(classCleanName.toLowerCase())
          ? streamCleanName
          : `${classCleanName} ${streamCleanName}`;

        return {
          id: stream.id,
          name: displayName,
          className: cls.name,
          streamName: stream.name,
          cycle: cls.cycle,
          levelOrder: cls.level_order,
          classMasterName: stream.class_master?.full_name || null,
        };
      })
    );
  }, [classesWithStreams]);

  const [selectedStreamId, setSelectedStreamId] = useState<string>(
    allStreams[0]?.id || ""
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add Subject Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedNewSubjectId, setSelectedNewSubjectId] = useState("");
  const [newCoefficient, setNewCoefficient] = useState("2");
  const [newMaxMarks, setNewMaxMarks] = useState("20");

  // Subject Deletion State
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
        const teacherName = (ta as unknown as { teacher?: { full_name?: string } })?.teacher?.full_name;
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

  // Total coefficient weight for selected class
  const totalCoefficients = useMemo(() => {
    let sum = 0;
    for (const sub of assignedSubjects) {
      const cfg = currentStreamConfigs.get(sub.id);
      sum += Number(cfg?.coefficient ?? sub.default_coefficient ?? 2);
    }
    return Math.round(sum * 10) / 10;
  }, [assignedSubjects, currentStreamConfigs]);

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

  const handleOpenAddModal = () => {
    if (availableSubjectsToAdd.length > 0) {
      const first = availableSubjectsToAdd[0];
      setSelectedNewSubjectId(first.id);
      setNewCoefficient(String(first.default_coefficient || 2));
      setNewMaxMarks(String(first.default_max_marks || 20));
    } else {
      setSelectedNewSubjectId("");
    }
    setIsAddModalOpen(true);
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
          text: `Added subject to ${selectedStream.name} curriculum.`,
        });
        setIsAddModalOpen(false);
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
    <div className="space-y-6">
      {/* 1. Institutional Class Control Bar */}
      <div className="p-5 rounded-[8px] bg-white border border-[#D5CBB2] shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40 text-[11px] font-bold mb-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Academic Curriculum Configuration</span>
            </div>
            <h2 className="text-lg font-bold text-[#142010]">
              Class Subjects &amp; Coefficients
            </h2>
            <p className="text-xs text-[#555555] max-w-2xl leading-relaxed mt-0.5">
              Configure which subjects are taught in each class cohort. Report cards and term marks will strictly include subjects assigned here.
            </p>
          </div>

          {/* Class Switcher Selector */}
          <div className="flex items-center gap-2.5 shrink-0 bg-[#FAF8F2] p-2 rounded-[6px] border border-[#E8DFC9]">
            <span className="text-xs font-bold text-[#555555] pl-1">Target Class:</span>
            <div className="relative">
              <select
                value={selectedStreamId}
                onChange={(e) => {
                  setSelectedStreamId(e.target.value);
                  setFeedback(null);
                  setSubjectToDelete(null);
                }}
                className="pl-3 pr-8 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-xs font-bold text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#2A7C13] cursor-pointer"
              >
                {allStreams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.cycle === "cycle_1" ? "Cycle 1" : "Cycle 2"})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Academic Metrics for Selected Class */}
        {selectedStream && (
          <div className="pt-3 border-t border-[#E8DFC9] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-[4px] bg-[#191919] text-white font-mono text-[11px] font-bold">
                {selectedStream.name}
              </span>
              <span className="px-2.5 py-1 rounded-[4px] bg-[#FAF8F2] text-[#555555] border border-[#E8DFC9] font-medium">
                {selectedStream.cycle === "cycle_1" ? "First Cycle (Cycle 1)" : "Second Cycle (Cycle 2)"}
              </span>
              <span className="px-2.5 py-1 rounded-[4px] bg-[#EAF7E4] text-[#1F5C0E] border border-[#76C457]/40 font-bold">
                {assignedSubjects.length} Subject(s) Assigned
              </span>
              <span className="px-2.5 py-1 rounded-[4px] bg-[#FFF8CF] text-[#854D0E] border border-[#FBE6C2] font-mono font-bold">
                Total Coefficients: {totalCoefficients}
              </span>
              {selectedStream.classMasterName && (
                <span className="text-[#666666] text-[11px] hidden sm:inline">
                  Class Master: <strong>{selectedStream.classMasterName}</strong>
                </span>
              )}
            </div>

            {canManageAcademics && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                disabled={availableSubjectsToAdd.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-xs font-bold bg-[#2A7C13] hover:bg-[#20600E] text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject to {selectedStream.name}</span>
              </button>
            )}
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-[6px] text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-[#EAF7E4] text-[#1F5C0E] border border-[#76C457]/50"
                : "bg-[#FFF0F0] text-[#991B1B] border border-[#FCA5A5]"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 shrink-0 text-[#2A7C13]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
        )}
      </div>

      {selectedStream && (
        <div className="space-y-4">
          {/* 2. Assigned Subjects Roster Table */}
          <div className="rounded-[8px] bg-white border border-[#D5CBB2] shadow-2xs overflow-hidden">
            {/* Table Header Filter & Clean Action */}
            <div className="p-4 bg-[#FAF8F2] border-b border-[#E8DFC9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <h3 className="font-extrabold text-[#142010] text-sm">
                  Curriculum for {selectedStream.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white text-[#555555] font-mono text-[11px] border border-[#D5D5CF]">
                  {assignedSubjects.length} of {subjects.length} subjects
                </span>
              </div>

              <div className="flex items-center gap-2">
                {assignedSubjects.length > 5 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#777777] absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filter by subject or department..."
                      className="pl-8 pr-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#2A7C13] w-56"
                    />
                  </div>
                )}

                {assignedSubjects.length > 12 && canManageAcademics && (
                  <button
                    type="button"
                    onClick={handleCleanUnassigned}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] text-xs font-bold text-[#854D0E] bg-[#FFF8CF] hover:bg-[#FFF3B0] border border-[#FBE6C2] transition-colors cursor-pointer"
                    title="Remove all subjects that have no teacher assigned and no recorded marks"
                  >
                    <Eraser className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>Clean Unassigned</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table Body */}
            {assignedSubjects.length === 0 ? (
              <div className="p-10 text-center rounded-b-[8px] bg-[#FAF8F2] space-y-3">
                <BookOpen className="w-8 h-8 text-[#888888] mx-auto opacity-60" />
                <h4 className="text-sm font-bold text-[#142010]">
                  No subjects assigned to {selectedStream.name} yet
                </h4>
                <p className="text-xs text-[#666666] max-w-md mx-auto leading-relaxed">
                  Click the &ldquo;Add Subject to {selectedStream.name}&rdquo; button above to specify the curriculum and coefficients for this class.
                </p>
                {canManageAcademics && (
                  <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold cursor-pointer mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Subject</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F2] text-[#555555] font-bold border-b border-[#E8DFC9] text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Subject &amp; Code</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3 text-center w-28">Class Coefficient</th>
                      <th className="py-2.5 px-3 text-center w-24">Scale</th>
                      <th className="py-2.5 px-3">Assigned Teacher</th>
                      {canManageAcademics && (
                        <th className="py-2.5 px-3 text-center w-20">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DFC9]">
                    {filteredAssigned.map((sub) => {
                      const cfg = currentStreamConfigs.get(sub.id);
                      const teacherName = streamTeacherMap.get(sub.id);

                      return (
                        <tr key={sub.id} className="hover:bg-[#FFFDF9] transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-[#191919]">{sub.name}</div>
                            <div className="font-mono text-[10px] text-[#777777]">{sub.code}</div>
                          </td>
                          <td className="py-2.5 px-3 text-[#555555]">
                            {sub.department?.name ? (
                              <span className="px-2 py-0.5 rounded-[4px] bg-[#FAF8F2] border border-[#E8DFC9] text-[11px] font-medium">
                                {sub.department.name}
                              </span>
                            ) : (
                              <span className="text-[#888888] italic text-[11px]">Unassigned</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-[4px] bg-[#EAF7E4] text-[#1F5C0E] border border-[#76C457]/40">
                              {cfg?.coefficient ?? sub.default_coefficient}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-[#555555]">
                            / {cfg?.max_marks ?? sub.default_max_marks ?? 20}
                          </td>
                          <td className="py-2.5 px-3">
                            {teacherName ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F5C0E] bg-[#EAF7E4] px-2 py-0.5 rounded-[4px] border border-[#76C457]/40">
                                <Users className="w-3 h-3 text-[#2A7C13]" />
                                <span>{teacherName}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#888888] italic">
                                No teacher allocated
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
                                <span>Remove</span>
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

      {/* ADD SUBJECT MODAL DIALOG */}
      {isAddModalOpen && selectedStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-[8px] bg-white border border-[#D5CBB2] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#FAF8F2] border-b border-[#E8DFC9] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#142010] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#2A7C13]" />
                  <span>Add Subject to {selectedStream.name}</span>
                </h3>
                <p className="text-[11px] text-[#555555] mt-0.5">
                  Select a registered subject from the school catalog and specify its class coefficient.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-[4px] text-[#777777] hover:text-[#191919] hover:bg-black/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            {availableSubjectsToAdd.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#555555] space-y-2">
                <p className="font-bold">All School Subjects Assigned</p>
                <p>Every subject in the school curriculum is already assigned to {selectedStream.name}.</p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-1.5 rounded-[5px] border border-[#D5D5CF] text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddSubject} className="p-5 space-y-4 text-xs">
                {/* 1. Subject Selector */}
                <div>
                  <label className="block font-bold text-[#191919] mb-1">
                    Select Subject
                  </label>
                  <select
                    value={selectedNewSubjectId}
                    onChange={(e) => handleSelectNewSubject(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-[6px] border border-[#D5D5CF] bg-white text-xs font-medium text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#2A7C13]"
                  >
                    {availableSubjectsToAdd.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) {s.department?.name ? `· ${s.department.name}` : ""} (Default Coef {s.default_coefficient})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10.5px] text-[#777777] block mt-1">
                    Choosing a subject automatically populates its official default coefficient and scale.
                  </span>
                </div>

                {/* 2. Coefficient & Max Marks with Explicit Labels & Explanations */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block font-bold text-[#191919] mb-1">
                      Class Coefficient (Weight)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="20"
                      required
                      value={newCoefficient}
                      onChange={(e) => setNewCoefficient(e.target.value)}
                      className="w-full px-3 py-2 rounded-[6px] border border-[#D5D5CF] bg-white text-xs font-bold text-[#2A7C13] focus:outline-none focus:ring-1 focus:ring-[#2A7C13]"
                    />
                    <span className="text-[10.5px] text-[#777777] block mt-1">
                      Report card multiplier (e.g. 2, 3, 4)
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-[#191919] mb-1">
                      Maximum Mark Scale
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="5"
                      max="100"
                      required
                      value={newMaxMarks}
                      onChange={(e) => setNewMaxMarks(e.target.value)}
                      className="w-full px-3 py-2 rounded-[6px] border border-[#D5D5CF] bg-white text-xs font-bold text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#2A7C13]"
                    />
                    <span className="text-[10.5px] text-[#777777] block mt-1">
                      Usually 20 (or 40/60 for technical)
                    </span>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8DFC9]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[#555555] hover:bg-[#FAF8F2] font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !selectedNewSubjectId}
                    className="px-4 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    {isPending ? "Adding..." : "+ Add to Curriculum"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      {subjectToDelete && selectedStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-[8px] border border-red-200 shadow-2xl w-full max-w-md p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-red-700">
              <div className="p-2 rounded-full bg-red-100 shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-900">
                  Remove {subjectToDelete.name}?
                </h4>
                <p className="text-[11px] text-red-700">
                  Class: <strong>{selectedStream.name}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#555555] leading-relaxed">
              {deleteConfirmMarks
                ? "Assessment marks exist for this subject in this class. Confirming will permanently remove this subject and all recorded marks from student report cards."
                : "This subject will be removed from this class curriculum and will no longer appear on student report cards."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DFC9]">
              <button
                type="button"
                onClick={() => {
                  setSubjectToDelete(null);
                  setDeleteConfirmMarks(false);
                }}
                className="px-3.5 py-1.5 rounded-[5px] border border-[#D5D5CF] text-xs font-semibold text-[#555555] hover:bg-[#FAF8F2] cursor-pointer"
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
