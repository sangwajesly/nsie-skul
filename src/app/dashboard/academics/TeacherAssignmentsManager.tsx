"use client";

import { useState, useTransition, useMemo } from "react";
import { removeTeacherAssignmentAction } from "@/app/academics/actions";
import TeacherAssignmentForm from "./TeacherAssignmentForm";
import {
  Users,
  Layers,
  List,
  Search,
  Plus,
  Trash2,
  Loader2,
  UserCheck,
  Building,
  BookOpen,
  Filter,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TeacherAssignment } from "@/types/database";
import { ClassStreamCoefficientsModal } from "./ClassStreamCoefficientsModal";

interface ClassSubjectConfig {
  class_stream_id: string;
  subject_id: string;
  coefficient: number;
  max_marks: number;
}

interface Props {
  academicYearId: string;
  assignments: TeacherAssignment[];
  teachers: Array<{ id: string; name: string; email: string }>;
  classGroups: Array<{ id: string; name: string }>;
  subjects: Array<{ id: string; name: string; code?: string; default_coefficient?: number; default_max_marks?: number }>;
  classSubjects?: ClassSubjectConfig[];
  canManage: boolean;
  canManageAcademics?: boolean;
}

export function TeacherAssignmentsManager({
  academicYearId,
  assignments,
  teachers,
  classGroups,
  subjects,
  classSubjects = [],
  canManage,
  canManageAcademics = false,
}: Props) {
  const [viewMode, setViewMode] = useState<"teacher" | "class" | "table">("teacher");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("");
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState("");
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((ta) => {
      const q = searchTerm.toLowerCase().trim();
      const teacherName = (ta.teacher?.full_name || "").toLowerCase();
      const subjectName = (ta.subject?.name || "").toLowerCase();
      const subjectCode = (ta.subject?.code || "").toLowerCase();
      const streamName = (ta.class_stream?.name || "").toLowerCase();

      const matchesQuery =
        !q ||
        teacherName.includes(q) ||
        subjectName.includes(q) ||
        subjectCode.includes(q) ||
        streamName.includes(q);

      const matchesClass =
        !selectedClassFilter || ta.class_stream_id === selectedClassFilter;

      const matchesTeacher =
        !selectedTeacherFilter || ta.teacher_user_id === selectedTeacherFilter;

      return matchesQuery && matchesClass && matchesTeacher;
    });
  }, [assignments, searchTerm, selectedClassFilter, selectedTeacherFilter]);

  // Grouped by Teacher
  const assignmentsByTeacher = useMemo(() => {
    const map = new Map<string, { teacherName: string; email: string; items: TeacherAssignment[] }>();
    for (const ta of filteredAssignments) {
      const id = ta.teacher_user_id;
      if (!map.has(id)) {
        map.set(id, {
          teacherName: ta.teacher?.full_name || "Unknown Teacher",
          email: ta.teacher?.email || "",
          items: [],
        });
      }
      map.get(id)!.items.push(ta);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[1].teacherName.localeCompare(b[1].teacherName)
    );
  }, [filteredAssignments]);

  // Grouped by Class Group
  const assignmentsByClass = useMemo(() => {
    const map = new Map<string, { streamName: string; items: TeacherAssignment[] }>();
    for (const ta of filteredAssignments) {
      const id = ta.class_stream_id;
      if (!map.has(id)) {
        map.set(id, {
          streamName: ta.class_stream?.name || "Unknown Class",
          items: [],
        });
      }
      map.get(id)!.items.push(ta);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[1].streamName.localeCompare(b[1].streamName)
    );
  }, [filteredAssignments]);

  // Unique counts for stats
  const uniqueTeachersCount = useMemo(() => {
    return new Set(assignments.map((a) => a.teacher_user_id)).size;
  }, [assignments]);

  const uniqueStreamsCount = useMemo(() => {
    return new Set(assignments.map((a) => a.class_stream_id)).size;
  }, [assignments]);

  const getSubjectCoef = (classStreamId: string, subjectId: string, defaultCoef?: number) => {
    const found = classSubjects.find(
      (cs) => cs.class_stream_id === classStreamId && cs.subject_id === subjectId
    );
    return found?.coefficient ?? defaultCoef ?? 2;
  };

  const modalSubjects = useMemo(() => {
    return subjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code || "",
      default_coefficient: s.default_coefficient ?? 2,
      default_max_marks: s.default_max_marks ?? 20,
    }));
  }, [subjects]);

  const handleRemove = (assignmentId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("assignmentId", assignmentId);
      const res = await removeTeacherAssignmentAction(null, formData);
      setConfirmDeleteId(null);
      if (res && "error" in res && res.error) {
        alert(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Overview Statistics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">Total Allocations</div>
          <div className="text-xl font-extrabold text-[#191919] mt-0.5">{assignments.length}</div>
          <p className="text-[10px] text-[#888888] mt-0.5">Subject-class pairings</p>
        </div>
        <div className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">Teaching Staff</div>
          <div className="text-xl font-extrabold text-[#191919] mt-0.5">{uniqueTeachersCount}</div>
          <p className="text-[10px] text-[#888888] mt-0.5">With active subjects</p>
        </div>
        <div className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">Class Groups Covered</div>
          <div className="text-xl font-extrabold text-[#191919] mt-0.5">{uniqueStreamsCount}</div>
          <p className="text-[10px] text-[#888888] mt-0.5">Of {classGroups.length} total groups</p>
        </div>
        <div className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">Subjects Catalog</div>
          <div className="text-xl font-extrabold text-[#191919] mt-0.5">{subjects.length}</div>
          <p className="text-[10px] text-[#888888] mt-0.5">Registered subjects</p>
        </div>
      </div>

      {/* Collapsible Assignment Form */}
      {canManage && (
        <div className="rounded-[8px] border border-[#E5E5DF] bg-white shadow-2xs">
          <div
            onClick={() => setShowAssignForm((prev) => !prev)}
            className="flex items-center justify-between px-4 py-3 bg-[#FAFAF8] cursor-pointer hover:bg-[#F5F5F0] transition-colors border-b border-[#EEEEEC]"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#191919]" />
              <span className="text-xs font-bold text-[#191919]">Assign Teacher to Class &amp; Subject</span>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-[#555555] flex items-center gap-1"
            >
              <span>{showAssignForm ? "Hide Form" : "+ New Assignment"}</span>
              {showAssignForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showAssignForm && (
            <div className="p-4 sm:p-5">
              <TeacherAssignmentForm
                academicYearId={academicYearId}
                teachers={teachers}
                classGroups={classGroups}
                subjects={subjects.map(({ id, name }) => ({ id, name }))}
                existingAssignments={assignments}
              />
            </div>
          )}
        </div>
      )}

      {/* Filter and View Switcher Bar */}
      <div className="bg-white p-3.5 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by teacher, subject, or class (e.g. Maths, Form 3, Fomban)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[5px] border border-[#D5D5CF] bg-white text-[#191919] focus:outline-none focus:border-[#191919]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#191919]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex rounded-[5px] border border-[#D5D5CF] bg-[#FAFAF8] p-0.5 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("teacher")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[11px] font-semibold transition-colors ${
                viewMode === "teacher"
                  ? "bg-white text-[#191919] shadow-2xs font-bold"
                  : "text-[#666666] hover:text-[#191919]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>By Teacher</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("class")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[11px] font-semibold transition-colors ${
                viewMode === "class"
                  ? "bg-white text-[#191919] shadow-2xs font-bold"
                  : "text-[#666666] hover:text-[#191919]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>By Class Group</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[11px] font-semibold transition-colors ${
                viewMode === "table"
                  ? "bg-white text-[#191919] shadow-2xs font-bold"
                  : "text-[#666666] hover:text-[#191919]"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>All Table</span>
            </button>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EEEEEC] text-[11px]">
          <span className="font-semibold text-[#777777] flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filter:
          </span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-2 py-1 rounded-[4px] border border-[#D5D5CF] bg-white text-[#191919] focus:outline-none focus:border-[#191919]"
          >
            <option value="">All Class Groups ({classGroups.length})</option>
            {classGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTeacherFilter}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
            className="px-2 py-1 rounded-[4px] border border-[#D5D5CF] bg-white text-[#191919] focus:outline-none focus:border-[#191919]"
          >
            <option value="">All Teachers ({teachers.length})</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {(selectedClassFilter || selectedTeacherFilter || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedClassFilter("");
                setSelectedTeacherFilter("");
                setSearchTerm("");
              }}
              className="px-2 py-1 text-[11px] text-red-600 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          )}

          <div className="ml-auto text-[#777777]">
            Showing <strong>{filteredAssignments.length}</strong> of {assignments.length} assignments
          </div>
        </div>
      </div>

      {/* Content Rendering based on ViewMode */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-[8px] border border-[#E5E5DF] p-12 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-[#888888] mx-auto" />
          <h4 className="text-sm font-bold text-[#191919]">No Subject Allocations Found</h4>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            {searchTerm || selectedClassFilter || selectedTeacherFilter
              ? "No assignments match your active search or filters. Try adjusting your filters above."
              : "No teachers have been assigned to subjects yet. Use the 'Assign Teacher' form above to allocate staff."}
          </p>
        </div>
      ) : viewMode === "teacher" ? (
        /* --- VIEW 1: GROUP BY TEACHER --- */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignmentsByTeacher.map(([teacherId, group]) => (
            <div
              key={teacherId}
              className="bg-white rounded-[8px] border border-[#E5E5DF] shadow-2xs p-4 space-y-3"
            >
              {/* Teacher Header */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#EEEEEC]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#FAFAF8] border border-[#E5E5DF] text-[#191919] font-bold text-xs flex items-center justify-center shrink-0">
                    {group.teacherName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#191919] truncate">{group.teacherName}</h4>
                    {group.email && (
                      <p className="text-[10px] text-[#777777] truncate font-mono">{group.email}</p>
                    )}
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF7E4] text-[#1F5C0E] border border-[#76C457]/30 shrink-0">
                  {group.items.length} {group.items.length === 1 ? "Subject" : "Subjects"}
                </span>
              </div>

              {/* Subject Allocations List */}
              <div className="space-y-1.5">
                {group.items.map((ta) => {
                  const isConfirming = confirmDeleteId === ta.id;
                  return (
                    <div
                      key={ta.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-[5px] border border-[#EAEAE6] bg-[#FAFAF8] text-xs hover:border-[#D5D5CF] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EAEAE6] text-[#555555] font-mono text-[10px] shrink-0 font-bold">
                          {ta.subject?.code}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-[#191919] block truncate">
                            {ta.subject?.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-[#666666] truncate">
                              Class: <strong className="text-[#191919]">{ta.class_stream?.name}</strong>
                            </span>
                            <span className="px-1.5 py-0.2 rounded-[3px] bg-[#EBF3FE] text-[#1E40AF] font-bold text-[10px] border border-[#BFDBFE]">
                              Coef {getSubjectCoef(ta.class_stream_id, ta.subject_id, (ta.subject as any)?.default_coefficient)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canManage && (
                        <div className="shrink-0 flex items-center gap-1.5">
                          {canManageAcademics && (
                            <ClassStreamCoefficientsModal
                              streamId={ta.class_stream_id}
                              streamName={ta.class_stream?.name || "Class"}
                              subjects={modalSubjects}
                              currentConfigs={classSubjects.filter((cs) => cs.class_stream_id === ta.class_stream_id)}
                              buttonLabel="Coefs"
                              buttonClassName="px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#555555] hover:text-[#191919] hover:bg-[#EAEAE6] border border-[#D5D5CF] bg-white inline-flex items-center gap-1 cursor-pointer shrink-0"
                            />
                          )}
                          {isConfirming ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleRemove(ta.id)}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-semibold transition-colors disabled:opacity-50"
                              >
                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1.5 py-0.5 text-[10px] text-[#666666] hover:text-[#191919]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(ta.id)}
                              title="Remove teacher from subject"
                              className="p-1 text-[#888888] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === "class" ? (
        /* --- VIEW 2: GROUP BY CLASS GROUP --- */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignmentsByClass.map(([classId, group]) => (
            <div
              key={classId}
              className="bg-white rounded-[8px] border border-[#E5E5DF] shadow-2xs p-4 space-y-3"
            >
              {/* Class Header */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#EEEEEC]">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#555555]" />
                  <h4 className="text-xs font-bold text-[#191919]">{group.streamName}</h4>
                  {canManageAcademics && (
                    <ClassStreamCoefficientsModal
                      streamId={classId}
                      streamName={group.streamName}
                      subjects={modalSubjects}
                      currentConfigs={classSubjects.filter((cs) => cs.class_stream_id === classId)}
                      buttonLabel="Class Coefs"
                    />
                  )}
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1F1ED] text-[#555555]">
                  {group.items.length} {group.items.length === 1 ? "Assigned Subject" : "Assigned Subjects"}
                </span>
              </div>

              {/* Subjects in Class */}
              <div className="space-y-1.5">
                {group.items.map((ta) => {
                  const isConfirming = confirmDeleteId === ta.id;
                  return (
                    <div
                      key={ta.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-[5px] border border-[#EAEAE6] bg-[#FAFAF8] text-xs"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#191919] truncate">{ta.subject?.name}</span>
                          <span className="px-1.5 py-0.2 rounded-[3px] bg-[#EAEAE6] text-[#555555] font-mono text-[10px]">
                            {ta.subject?.code}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-[3px] bg-[#EBF3FE] text-[#1E40AF] font-bold text-[10px] border border-[#BFDBFE]">
                            Coef {getSubjectCoef(ta.class_stream_id, ta.subject_id, (ta.subject as any)?.default_coefficient)}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#2A7C13] font-medium flex items-center gap-1 truncate">
                          <UserCheck className="w-3 h-3 shrink-0" />
                          <span>{ta.teacher?.full_name || "Assigned Teacher"}</span>
                        </div>
                      </div>

                      {canManage && (
                        <div className="shrink-0">
                          {isConfirming ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleRemove(ta.id)}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-semibold transition-colors disabled:opacity-50"
                              >
                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1.5 py-0.5 text-[10px] text-[#666666] hover:text-[#191919]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(ta.id)}
                              title="Remove teacher from subject"
                              className="p-1 text-[#888888] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* --- VIEW 3: FLAT DATA TABLE --- */
        <div className="bg-white rounded-[8px] border border-[#E5E5DF] overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5DF] bg-[#FAFAF8] text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                <th className="py-2.5 px-3">Class Group</th>
                <th className="py-2.5 px-3">Subject Name</th>
                <th className="py-2.5 px-3">Subject Code</th>
                <th className="py-2.5 px-3">Class Coefficient</th>
                <th className="py-2.5 px-3">Assigned Teacher</th>
                {canManage && <th className="py-2.5 px-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F1ED] text-[#191919]">
              {filteredAssignments.map((ta) => {
                const isConfirming = confirmDeleteId === ta.id;
                return (
                  <tr key={ta.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#191919]">
                      {ta.class_stream?.name}
                    </td>
                    <td className="py-2.5 px-3">{ta.subject?.name}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#666666]">
                      {ta.subject?.code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#EBF3FE] text-[#1E40AF] font-bold text-[11px] font-mono border border-[#BFDBFE]">
                          Coef {getSubjectCoef(ta.class_stream_id, ta.subject_id, (ta.subject as any)?.default_coefficient)}
                        </span>
                        {canManageAcademics && (
                          <ClassStreamCoefficientsModal
                            streamId={ta.class_stream_id}
                            streamName={ta.class_stream?.name || "Class"}
                            subjects={modalSubjects}
                            currentConfigs={classSubjects.filter((cs) => cs.class_stream_id === ta.class_stream_id)}
                            buttonLabel="Edit"
                            buttonClassName="px-1.5 py-0.5 rounded text-[10px] font-semibold text-[#555555] hover:text-[#191919] hover:bg-[#EAEAE6] border border-[#D5D5CF] bg-white inline-flex items-center gap-1 cursor-pointer shrink-0"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#1F5C0E]">
                      👤 {ta.teacher?.full_name}
                    </td>
                    {canManage && (
                      <td className="py-2.5 px-3 text-right">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleRemove(ta.id)}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-semibold transition-colors disabled:opacity-50"
                            >
                              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 text-[10px] text-[#666666] hover:text-[#191919]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(ta.id)}
                            className="p-1 rounded text-[#888888] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Remove assignment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
  );
}
