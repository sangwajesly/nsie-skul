"use client";

import { useState, useActionState, useEffect, useMemo, useRef, startTransition } from "react";
import { assignTeacherAction } from "@/app/academics/actions";
import {
  UserRoundPlus,
  Check,
  CheckSquare,
  Square,
  Search,
  X,
  Layers,
  Sparkles,
  AlertCircle,
  Users,
  RefreshCw,
  HelpCircle,
} from "lucide-react";

interface Props {
  academicYearId: string;
  teachers: Array<{ id: string; name: string; email: string }>;
  classGroups: Array<{ id: string; name: string }>;
  subjects: Array<{ id: string; name: string }>;
  existingAssignments?: Array<{
    teacher_user_id: string;
    subject_id: string;
    class_stream_id: string;
    teacher?: { full_name?: string };
  }>;
}

export default function TeacherAssignmentForm({
  academicYearId,
  teachers,
  classGroups,
  subjects,
  existingAssignments = [],
}: Props) {
  const [state, formAction, isPending] = useActionState(assignTeacherAction, null);
  const [selectedStreamIds, setSelectedStreamIds] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [assignmentMode, setAssignmentMode] = useState<"co_teach" | "replace">("co_teach");
  const [showConflictPromptModal, setShowConflictPromptModal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isConfirmedRef = useRef(false);

  // Natural alphabetical and numeric sorting of class groups (Form 1A, Form 1B, Form 2A...)
  const sortedClassGroups = useMemo(() => {
    return [...classGroups].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [classGroups]);

  // Set of class stream IDs that THIS specific teacher is ALREADY assigned to for this subject
  const alreadyAssignedStreamIds = useMemo(() => {
    if (!selectedTeacherId || !selectedSubjectId || !existingAssignments.length) {
      return new Set<string>();
    }
    const matches = existingAssignments.filter(
      (a) => a.teacher_user_id === selectedTeacherId && a.subject_id === selectedSubjectId
    );
    return new Set(matches.map((a) => a.class_stream_id));
  }, [selectedTeacherId, selectedSubjectId, existingAssignments]);

  // Map of class stream ID -> List of OTHER teacher names currently assigned to this subject
  const otherAssignedTeachersByStream = useMemo(() => {
    if (!selectedSubjectId || !existingAssignments.length) {
      return new Map<string, string[]>();
    }
    const map = new Map<string, string[]>();
    for (const a of existingAssignments) {
      if (a.subject_id === selectedSubjectId && a.teacher_user_id !== selectedTeacherId) {
        const teacherName =
          a.teacher?.full_name ||
          teachers.find((t) => t.id === a.teacher_user_id)?.name ||
          "Another Teacher";
        if (!map.has(a.class_stream_id)) {
          map.set(a.class_stream_id, []);
        }
        const list = map.get(a.class_stream_id)!;
        if (!list.includes(teacherName)) {
          list.push(teacherName);
        }
      }
    }
    return map;
  }, [selectedSubjectId, selectedTeacherId, existingAssignments, teachers]);

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Selected classes that are already assigned to THIS teacher
  const selectedAlreadyAssigned = useMemo(() => {
    return sortedClassGroups.filter(
      (g) => selectedStreamIds.includes(g.id) && alreadyAssignedStreamIds.has(g.id)
    );
  }, [sortedClassGroups, selectedStreamIds, alreadyAssignedStreamIds]);

  // Selected classes that are new to THIS teacher
  const selectedNewStreams = useMemo(() => {
    return sortedClassGroups.filter(
      (g) => selectedStreamIds.includes(g.id) && !alreadyAssignedStreamIds.has(g.id)
    );
  }, [sortedClassGroups, selectedStreamIds, alreadyAssignedStreamIds]);

  // Selected classes where ANOTHER teacher is already assigned (co-teaching or replace scenario)
  const conflictingSelectedStreams = useMemo(() => {
    return selectedNewStreams
      .filter((g) => otherAssignedTeachersByStream.has(g.id))
      .map((g) => ({
        streamId: g.id,
        streamName: g.name,
        teacherNames: otherAssignedTeachersByStream.get(g.id)!,
      }));
  }, [selectedNewStreams, otherAssignedTeachersByStream]);

  // Streams that are not yet assigned to this teacher for this subject
  const unassignedStreams = useMemo(() => {
    return sortedClassGroups.filter((g) => !alreadyAssignedStreamIds.has(g.id));
  }, [sortedClassGroups, alreadyAssignedStreamIds]);

  // Reset selected classes on successful submission
  useEffect(() => {
    if (state && "success" in state && state.success) {
      setSelectedStreamIds([]);
      setSearchFilter("");
      setShowConflictPromptModal(false);
      setAssignmentMode("co_teach");
    }
  }, [state]);

  if (!academicYearId) {
    return <p className="text-xs text-[#777777]">Set a current school year before assigning teachers.</p>;
  }

  if (teachers.length === 0) {
    return (
      <p className="text-xs text-[#777777]">
        Add the teacher under Teachers &amp; Staff and give them the Teacher role first.
      </p>
    );
  }

  if (classGroups.length === 0 || subjects.length === 0) {
    return <p className="text-xs text-[#777777]">Add a class group and subject before assigning a teacher.</p>;
  }

  const toggleStream = (streamId: string) => {
    setSelectedStreamIds((prev) =>
      prev.includes(streamId) ? prev.filter((id) => id !== streamId) : [...prev, streamId]
    );
  };

  const filteredStreams = sortedClassGroups.filter((g) =>
    g.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const selectAll = () => {
    const candidateStreams =
      alreadyAssignedStreamIds.size > 0
        ? searchFilter.trim()
          ? filteredStreams.filter((g) => !alreadyAssignedStreamIds.has(g.id))
          : unassignedStreams
        : searchFilter.trim()
        ? filteredStreams
        : sortedClassGroups;

    const newIds = new Set([...selectedStreamIds, ...candidateStreams.map((g) => g.id)]);
    setSelectedStreamIds(Array.from(newIds));
  };

  const clearSelection = () => {
    if (searchFilter.trim()) {
      const filterIds = new Set(filteredStreams.map((g) => g.id));
      setSelectedStreamIds((prev) => prev.filter((id) => !filterIds.has(id)));
    } else {
      setSelectedStreamIds([]);
    }
  };

  const isAllTargetSelected =
    alreadyAssignedStreamIds.size > 0 && unassignedStreams.length > 0
      ? unassignedStreams.every((g) => selectedStreamIds.includes(g.id))
      : filteredStreams.length > 0 &&
        filteredStreams.every((g) => selectedStreamIds.includes(g.id));

  const allClassesAreAlreadyAssigned =
    alreadyAssignedStreamIds.size > 0 && unassignedStreams.length === 0;

  // Intercept submit button click: prompt user if conflicting classes exist
  const handleInitialSubmit = (e: React.FormEvent) => {
    // If the user already confirmed their choice via the modal prompt, allow submission
    if (isConfirmedRef.current) {
      isConfirmedRef.current = false;
      return;
    }

    if (conflictingSelectedStreams.length > 0) {
      e.preventDefault();
      setShowConflictPromptModal(true);
      return;
    }
  };

  // Execute confirmed submission from prompt modal (co-teaching or replace)
  const handleConfirmPrompt = (mode: "co_teach" | "replace") => {
    isConfirmedRef.current = true;
    setShowConflictPromptModal(false);
    setAssignmentMode(mode);

    if (formRef.current) {
      const formData = new FormData(formRef.current);
      formData.set("assignmentMode", mode);
      formData.delete("classStreamIds");
      for (const streamId of selectedStreamIds) {
        formData.append("classStreamIds", streamId);
      }

      startTransition(async () => {
        await formAction(formData);
      });
    }
  };

  return (
    <>
      <form ref={formRef} action={formAction} onSubmit={handleInitialSubmit} className="space-y-4">
        <input type="hidden" name="academicYearId" value={academicYearId} />
        <input type="hidden" name="assignmentMode" value={assignmentMode} />

        {/* Hidden inputs for each selected class stream */}
        {selectedStreamIds.map((streamId) => (
          <input key={streamId} type="hidden" name="classStreamIds" value={streamId} />
        ))}

        {/* Row 1: Teacher & Subject (2 equal columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label
              htmlFor="teacher-assignment-teacher"
              className="mb-1.5 block text-xs font-semibold text-[#333333]"
            >
              1. Select Teacher *
            </label>
            <select
              id="teacher-assignment-teacher"
              name="teacherUserId"
              required
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full rounded-[6px] border border-[#D5D5CF] bg-white px-3 py-2 text-xs text-[#191919] font-medium focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] focus:outline-none transition-all shadow-2xs"
            >
              <option value="" disabled>
                Choose a teacher
              </option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} {teacher.email ? `(${teacher.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="teacher-assignment-subject"
              className="mb-1.5 block text-xs font-semibold text-[#333333]"
            >
              2. Select Subject *
            </label>
            <select
              id="teacher-assignment-subject"
              name="subjectId"
              required
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-[6px] border border-[#D5D5CF] bg-white px-3 py-2 text-xs text-[#191919] font-medium focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] focus:outline-none transition-all shadow-2xs"
            >
              <option value="" disabled>
                Choose a subject
              </option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Classes Selection Panel (Horizontal chips / pill layout) */}
        <div className="rounded-[8px] border border-[#E5E5DF] bg-[#FAFAF8] p-3.5 sm:p-4 space-y-3">
          {/* Header of Classes section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#EAEAE6]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2A7C13]" />
              <div>
                <span className="text-xs font-bold text-[#191919] block">
                  3. Choose Class Groups to Assign
                </span>
                <span className="text-[11px] text-[#666666]">
                  Tap the classes below to assign or remove. You can choose one, multiple, or all classes.
                </span>
              </div>
            </div>

            {/* Quick search input if more than 6 classes */}
            {sortedClassGroups.length > 6 && (
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter classes..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs rounded-[5px] border border-[#D5D5CF] bg-white text-[#191919] focus:outline-none focus:border-[#2A7C13]"
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#191919]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Classes horizontal chips / pill buttons */}
          <div className="flex flex-wrap gap-2 pt-0.5">
            {filteredStreams.length === 0 ? (
              <p className="text-xs text-[#888888] py-2 w-full text-center">
                No classes matching &quot;{searchFilter}&quot;
              </p>
            ) : (
              filteredStreams.map((classGroup) => {
                const isSelected = selectedStreamIds.includes(classGroup.id);
                const isAlreadyAssignedToSelf = alreadyAssignedStreamIds.has(classGroup.id);
                const otherTeachers = otherAssignedTeachersByStream.get(classGroup.id) || [];
                const hasOtherTeacher = otherTeachers.length > 0;

                return (
                  <button
                    type="button"
                    key={classGroup.id}
                    onClick={() => toggleStream(classGroup.id)}
                    title={
                      isAlreadyAssignedToSelf
                        ? `${selectedTeacher?.name || "Teacher"} is already assigned to ${selectedSubject?.name || "this subject"} in ${classGroup.name}`
                        : hasOtherTeacher
                        ? `Currently taught by ${otherTeachers.join(", ")}`
                        : undefined
                    }
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-[6px] text-xs font-semibold transition-all cursor-pointer select-none ${
                      isSelected
                        ? isAlreadyAssignedToSelf
                          ? "bg-amber-50 border-2 border-amber-500 text-amber-950 shadow-xs ring-1 ring-amber-500/20"
                          : hasOtherTeacher
                          ? "bg-sky-50 border-2 border-sky-600 text-sky-950 shadow-xs ring-1 ring-sky-600/20"
                          : "bg-[#EAF7E4] border-2 border-[#2A7C13] text-[#142010] shadow-xs ring-1 ring-[#2A7C13]/20"
                        : isAlreadyAssignedToSelf
                        ? "bg-[#FFFBF5] border border-amber-300 text-[#6B5934] hover:bg-[#FFF8EE]"
                        : hasOtherTeacher
                        ? "bg-[#F0F9FF] border border-sky-300 text-sky-900 hover:bg-[#E0F2FE]"
                        : "bg-white border border-[#D5D5CF] text-[#444444] hover:bg-[#F5F5F0] hover:border-[#999999] shadow-2xs"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-[3px] flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? isAlreadyAssignedToSelf
                            ? "bg-amber-600 text-white"
                            : hasOtherTeacher
                            ? "bg-sky-600 text-white"
                            : "bg-[#2A7C13] text-white"
                          : isAlreadyAssignedToSelf
                          ? "border border-amber-400 bg-white text-transparent"
                          : hasOtherTeacher
                          ? "border border-sky-400 bg-white text-transparent"
                          : "border border-[#BBBBBB] bg-white text-transparent"
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{classGroup.name}</span>

                    {isAlreadyAssignedToSelf && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                        Already Assigned
                      </span>
                    )}

                    {!isAlreadyAssignedToSelf && hasOtherTeacher && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                        Taught by {otherTeachers[0]}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Interactive Conflict Banner when another teacher is already assigned */}
          {conflictingSelectedStreams.length > 0 && (
            <div className="p-3.5 rounded-[6px] bg-sky-50 border border-sky-200 text-sky-950 text-xs space-y-2.5">
              <div className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sky-950">
                    Existing Teacher Detected ({conflictingSelectedStreams.length}{" "}
                    {conflictingSelectedStreams.length === 1 ? "class" : "classes"})
                  </p>
                  <div className="text-[11px] text-sky-800 space-y-0.5">
                    {conflictingSelectedStreams.map((c) => (
                      <div key={c.streamId}>
                        • <strong>{c.streamName}</strong>: Currently taught by{" "}
                        <span className="font-semibold text-sky-950">{c.teacherNames.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assignment Strategy Options */}
              <div className="pt-2 border-t border-sky-200/80 space-y-2">
                <span className="text-[11px] font-bold text-sky-950 block">
                  Select Assignment Action:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-[6px] border flex items-start gap-2 cursor-pointer transition-all ${
                      assignmentMode === "co_teach"
                        ? "bg-white border-[#2A7C13] ring-1 ring-[#2A7C13] text-[#142010]"
                        : "bg-white/70 border-sky-200 text-[#444444] hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="assignmentModeChoice"
                      value="co_teach"
                      checked={assignmentMode === "co_teach"}
                      onChange={() => setAssignmentMode("co_teach")}
                      className="mt-0.5 text-[#2A7C13] focus:ring-[#2A7C13]"
                    />
                    <div>
                      <strong className="block text-xs font-bold text-[#142010]">
                        Add as Co-Teacher (Keep Both)
                      </strong>
                      <span className="text-[11px] text-[#666666] leading-tight block mt-0.5">
                        Both teachers will teach {selectedSubject?.name || "this subject"} in this class.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-2.5 rounded-[6px] border flex items-start gap-2 cursor-pointer transition-all ${
                      assignmentMode === "replace"
                        ? "bg-white border-amber-600 ring-1 ring-amber-600 text-amber-950"
                        : "bg-white/70 border-sky-200 text-[#444444] hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="assignmentModeChoice"
                      value="replace"
                      checked={assignmentMode === "replace"}
                      onChange={() => setAssignmentMode("replace")}
                      className="mt-0.5 text-amber-600 focus:ring-amber-600"
                    />
                    <div>
                      <strong className="block text-xs font-bold text-amber-950">
                        Replace Existing Teacher
                      </strong>
                      <span className="text-[11px] text-[#666666] leading-tight block mt-0.5">
                        Unassign previous teacher and make {selectedTeacher?.name || "this teacher"} the assigned teacher.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Warning Banner if any selected class is ALREADY assigned to THIS teacher */}
          {selectedAlreadyAssigned.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-[6px] bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-900">
                  Notice: {selectedTeacher?.name || "This teacher"} is already assigned to {selectedSubject?.name || "this subject"} in:{" "}
                  <strong className="underline decoration-amber-400">
                    {selectedAlreadyAssigned.map((g) => g.name).join(", ")}
                  </strong>.
                </p>
                <p className="text-[11px] text-amber-800">
                  {selectedNewStreams.length > 0
                    ? `Submitting will assign ${selectedTeacher?.name} to the ${selectedNewStreams.length} remaining new ${selectedNewStreams.length === 1 ? "class" : "classes"} (${selectedNewStreams.map((g) => g.name).join(", ")}) without duplicating existing assignments.`
                    : "This teacher has already been assigned to this class. No duplicate assignment will be created."}
                </p>
              </div>
            </div>
          )}

          {/* Bottom Control Bar: Select All / Clear on the left, Counter on the right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#EAEAE6] text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={allClassesAreAlreadyAssigned}
                onClick={isAllTargetSelected ? clearSelection : selectAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white hover:bg-[#F5F5F0] text-[#191919] font-bold text-[11px] transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {allClassesAreAlreadyAssigned ? (
                  <span>All Classes Already Assigned</span>
                ) : isAllTargetSelected ? (
                  <>
                    <Square className="w-3.5 h-3.5 text-[#666666]" />
                    <span>Deselect All</span>
                  </>
                ) : alreadyAssignedStreamIds.size > 0 ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-[#2A7C13]" />
                    <span>Select Unassigned ({unassignedStreams.length})</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-[#2A7C13]" />
                    <span>Select All ({sortedClassGroups.length})</span>
                  </>
                )}
              </button>

              {selectedStreamIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-red-600 hover:underline text-[11px] font-medium cursor-pointer"
                >
                  Clear selection
                </button>
              )}

              <span className="text-[11px] text-[#666666] font-medium">
                <strong>{selectedStreamIds.length}</strong> of {sortedClassGroups.length} selected
              </span>
            </div>

            {selectedNewStreams.length > 0 && (
              <div className="text-[11px] text-[#2A7C13] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>
                  Ready to assign across {selectedNewStreams.length}{" "}
                  {selectedNewStreams.length === 1 ? "class" : "classes"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button & Help Text */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-[#777777]">
            {selectedStreamIds.length === 0
              ? "Choose a teacher, subject, and at least one class above."
              : selectedAlreadyAssigned.length > 0 && selectedNewStreams.length === 0
              ? "Teacher is already assigned to the selected class(es). Choose unassigned classes."
              : conflictingSelectedStreams.length > 0
              ? assignmentMode === "replace"
                ? `Will replace previous teacher and assign ${selectedTeacher?.name} to ${selectedNewStreams.length} ${selectedNewStreams.length === 1 ? "class" : "classes"}.`
                : `Will assign ${selectedTeacher?.name} as co-teacher across ${selectedNewStreams.length} ${selectedNewStreams.length === 1 ? "class" : "classes"}.`
              : `Will allocate this subject to the teacher across ${selectedNewStreams.length} ${
                  selectedNewStreams.length === 1 ? "class" : "classes"
                } simultaneously.`}
          </p>

          <button
            type="submit"
            disabled={
              isPending ||
              selectedStreamIds.length === 0 ||
              (selectedAlreadyAssigned.length > 0 && selectedNewStreams.length === 0)
            }
            className="inline-flex items-center justify-center gap-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <UserRoundPlus className="h-4 w-4" />
            <span>
              {isPending
                ? "Saving assignments..."
                : selectedAlreadyAssigned.length > 0 && selectedNewStreams.length === 0
                ? "Teacher Already Assigned to Class"
                : conflictingSelectedStreams.length > 0
                ? assignmentMode === "replace"
                  ? `Replace & Assign (${selectedNewStreams.length} ${selectedNewStreams.length === 1 ? "Class" : "Classes"})`
                  : `Assign as Co-Teacher (${selectedNewStreams.length} ${selectedNewStreams.length === 1 ? "Class" : "Classes"})`
                : selectedNewStreams.length > 1
                ? `Assign to ${selectedNewStreams.length} Classes at Once`
                : selectedNewStreams.length === 1
                ? "Assign Teacher (1 Class)"
                : "Select Class(es) to Assign"}
            </span>
          </button>
        </div>

        {/* State Feedback Notification Banner */}
        {state && (
          <div
            aria-live="polite"
            className={`p-3 rounded-[6px] text-xs font-medium border ${
              "error" in state
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
            }`}
          >
            {"error" in state ? (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{state.error}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2A7C13] shrink-0" />
                <span>{state.message}</span>
              </div>
            )}
          </div>
        )}
      </form>

      {/* Confirmation Modal Prompt for Co-Teaching vs Replacement */}
      {showConflictPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-[10px] border border-[#E8DFC9] shadow-xl w-full max-w-md p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#142010]">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Existing Teacher Assignment Detected</span>
              </div>
              <button
                type="button"
                onClick={() => setShowConflictPromptModal(false)}
                className="text-[#788470] hover:text-[#142010] font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#444444] leading-relaxed">
                The subject <strong>{selectedSubject?.name}</strong> already has an assigned teacher in the following class group:
              </p>

              <div className="p-2.5 rounded bg-sky-50 border border-sky-200 text-sky-950 space-y-1 text-xs">
                {conflictingSelectedStreams.map((c) => (
                  <div key={c.streamId} className="flex items-center justify-between">
                    <span className="font-bold">{c.streamName}</span>
                    <span className="text-[11px] text-sky-800">
                      Currently taught by: <strong>{c.teacherNames.join(", ")}</strong>
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs font-semibold text-[#142010]">
                How would you like to assign <strong>{selectedTeacher?.name}</strong>?
              </p>

              {/* Action Choices */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleConfirmPrompt("co_teach")}
                  className="w-full p-3 rounded-[6px] border border-[#2A7C13] bg-[#EAF7E4] hover:bg-[#D9F0D1] text-left transition-colors cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#142010]">
                      1. Assign as Co-Teacher (Keep Both)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A7C13] text-white font-bold">
                      {isPending ? "Assigning..." : "Co-Teach"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4F6849] mt-1 leading-normal">
                    Both teachers will teach {selectedSubject?.name} in {conflictingSelectedStreams.map((c) => c.streamName).join(", ")}. Both can enter marks and teach together.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleConfirmPrompt("replace")}
                  className="w-full p-3 rounded-[6px] border border-amber-300 bg-amber-50 hover:bg-amber-100 text-left transition-colors cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-950">
                      2. Replace Existing Teacher
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600 text-white font-bold">
                      {isPending ? "Reassigning..." : "Replace"}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-1 leading-normal">
                    Unassign the previous teacher and make {selectedTeacher?.name} the primary teacher for this subject.
                  </p>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowConflictPromptModal(false)}
                  className="px-3 py-1.5 rounded border border-[#D5D5CF] text-[#666666] hover:bg-gray-50 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
