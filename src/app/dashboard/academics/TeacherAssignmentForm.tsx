"use client";

import { useState, useActionState, useEffect, useMemo } from "react";
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

  // Natural alphabetical and numeric sorting of class groups (Form 1A, Form 1B, Form 2A...)
  const sortedClassGroups = useMemo(() => {
    return [...classGroups].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
    );
  }, [classGroups]);

  // Set of class stream IDs that this teacher is ALREADY assigned to for this subject
  const alreadyAssignedStreamIds = useMemo(() => {
    if (!selectedTeacherId || !selectedSubjectId || !existingAssignments.length) {
      return new Set<string>();
    }
    const matches = existingAssignments.filter(
      (a) => a.teacher_user_id === selectedTeacherId && a.subject_id === selectedSubjectId
    );
    return new Set(matches.map((a) => a.class_stream_id));
  }, [selectedTeacherId, selectedSubjectId, existingAssignments]);

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Selected classes that are already assigned vs new
  const selectedAlreadyAssigned = useMemo(() => {
    return sortedClassGroups.filter(
      (g) => selectedStreamIds.includes(g.id) && alreadyAssignedStreamIds.has(g.id)
    );
  }, [sortedClassGroups, selectedStreamIds, alreadyAssignedStreamIds]);

  const selectedNewStreams = useMemo(() => {
    return sortedClassGroups.filter(
      (g) => selectedStreamIds.includes(g.id) && !alreadyAssignedStreamIds.has(g.id)
    );
  }, [sortedClassGroups, selectedStreamIds, alreadyAssignedStreamIds]);

  // Streams that are not yet assigned to this teacher for this subject
  const unassignedStreams = useMemo(() => {
    return sortedClassGroups.filter((g) => !alreadyAssignedStreamIds.has(g.id));
  }, [sortedClassGroups, alreadyAssignedStreamIds]);

  // Reset selected classes on successful submission
  useEffect(() => {
    if (state && "success" in state && state.success) {
      setSelectedStreamIds([]);
      setSearchFilter("");
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
    // If some streams are already assigned, prefer selecting only unassigned streams
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

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="academicYearId" value={academicYearId} />

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
              const isAlreadyAssigned = alreadyAssignedStreamIds.has(classGroup.id);

              return (
                <button
                  type="button"
                  key={classGroup.id}
                  onClick={() => toggleStream(classGroup.id)}
                  title={
                    isAlreadyAssigned
                      ? `${selectedTeacher?.name || "Teacher"} is already assigned to ${selectedSubject?.name || "this subject"} in ${classGroup.name}`
                      : undefined
                  }
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-[6px] text-xs font-semibold transition-all cursor-pointer select-none ${
                    isSelected
                      ? isAlreadyAssigned
                        ? "bg-amber-50 border-2 border-amber-500 text-amber-950 shadow-xs ring-1 ring-amber-500/20"
                        : "bg-[#EAF7E4] border-2 border-[#2A7C13] text-[#142010] shadow-xs ring-1 ring-[#2A7C13]/20"
                      : isAlreadyAssigned
                      ? "bg-[#FFFBF5] border border-amber-300 text-[#6B5934] hover:bg-[#FFF8EE]"
                      : "bg-white border border-[#D5D5CF] text-[#444444] hover:bg-[#F5F5F0] hover:border-[#999999] shadow-2xs"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-[3px] flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? isAlreadyAssigned
                          ? "bg-amber-600 text-white"
                          : "bg-[#2A7C13] text-white"
                        : isAlreadyAssigned
                        ? "border border-amber-400 bg-white text-transparent"
                        : "border border-[#BBBBBB] bg-white text-transparent"
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>{classGroup.name}</span>

                  {isAlreadyAssigned && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                      Already Assigned
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Warning Banner if any selected class is ALREADY assigned */}
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
                Ready to assign to {selectedNewStreams.length}{" "}
                {selectedNewStreams.length === 1 ? "class" : "classes"} at once
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
          className="inline-flex items-center justify-center gap-2 rounded-[6px] bg-[#142010] hover:bg-[#22361b] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          <UserRoundPlus className="h-4 w-4" />
          <span>
            {isPending
              ? "Saving assignments…"
              : selectedAlreadyAssigned.length > 0 && selectedNewStreams.length === 0
              ? "Teacher Already Assigned to Class"
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
  );
}
