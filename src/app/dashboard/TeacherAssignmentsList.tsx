"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TeacherAssignment } from "@/types/database";
import {
  ClipboardCheck,
  CalendarCheck,
  Search,
  X,
  BookOpen,
  Star,
  Layers,
} from "lucide-react";

interface Props {
  assignments: TeacherAssignment[];
  masteredStreamIds?: string[];
}

export function TeacherAssignmentsList({
  assignments,
  masteredStreamIds = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Extract unique subjects for quick-filtering if teacher teaches multiple subjects
  const uniqueSubjects = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const a of assignments) {
      if (!a.subject) continue;
      const existing = map.get(a.subject.id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(a.subject.id, {
          id: a.subject.id,
          name: a.subject.name,
          count: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignments.filter((a) => {
      // Subject filter
      if (selectedSubject !== "all" && a.subject_id !== selectedSubject) {
        return false;
      }
      // Search query (matches class name, stream tag, subject name, subject code)
      if (!q) return true;
      const className = a.class_stream?.name?.toLowerCase() || "";
      const streamTag = a.class_stream?.stream_tag?.toLowerCase() || "";
      const subjectName = a.subject?.name?.toLowerCase() || "";
      const subjectCode = a.subject?.code?.toLowerCase() || "";
      return (
        className.includes(q) ||
        streamTag.includes(q) ||
        subjectName.includes(q) ||
        subjectCode.includes(q)
      );
    });
  }, [assignments, search, selectedSubject]);

  if (assignments.length === 0) {
    return (
      <div className="bg-white border border-[#E5E5DF] rounded-[10px] p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#F5F5F0] text-[#888888] flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-[15px] text-[#191919]">No Teaching Classes Assigned Yet</h3>
        <p className="text-xs text-[#666666] max-w-md mx-auto">
          Your Head of Department or School Principal assigns teachers to specific class streams and subjects.
          Once assigned, your classes will appear here with one-click access to mark entry and roll call.
        </p>
      </div>
    );
  }

  const showSearch = assignments.length >= 4;
  const showSubjectTabs = uniqueSubjects.length > 1;

  return (
    <div className="space-y-3">
      {/* Search and Subject Filter Header */}
      {(showSearch || showSubjectTabs) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Quick Subject Tabs */}
          {showSubjectTabs ? (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setSelectedSubject("all")}
                className={`px-2.5 py-1 rounded-[5px] font-semibold text-xs transition-colors shrink-0 ${
                  selectedSubject === "all"
                    ? "bg-[#142010] text-white shadow-2xs"
                    : "bg-[#F5F5F0] text-[#555555] hover:bg-[#EAEAE5]"
                }`}
              >
                All Classes ({assignments.length})
              </button>
              {uniqueSubjects.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`px-2.5 py-1 rounded-[5px] font-semibold text-xs transition-colors shrink-0 ${
                    selectedSubject === sub.id
                      ? "bg-[#142010] text-white shadow-2xs"
                      : "bg-[#F5F5F0] text-[#555555] hover:bg-[#EAEAE5]"
                  }`}
                >
                  {sub.name} ({sub.count})
                </button>
              ))}
            </div>
          ) : (
            <div />
          )}

          {/* Search Input for many classes */}
          {showSearch && (
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter class (e.g. Form 1, Upper...)"
                className="w-full pl-8 pr-7 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs text-[#142010] placeholder-[#888888] focus:outline-none focus:border-[#2A7C13]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#142010]"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid of Compact, Proportional Assignment Cards */}
      {filteredAssignments.length === 0 ? (
        <div className="p-6 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9] text-center space-y-2">
          <p className="text-xs text-[#525E4B]">
            No classes match &ldquo;<strong>{search}</strong>&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedSubject("all");
            }}
            className="text-xs font-semibold text-[#2A7C13] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredAssignments.map((assignment) => {
            const isMaster =
              masteredStreamIds.includes(assignment.class_stream_id) ||
              assignment.class_stream?.class_master_id === assignment.teacher_user_id;

            return (
              <div
                key={assignment.id}
                className="bg-white border border-[#E8DFC9] hover:border-[#2A7C13] rounded-[8px] p-3 transition-all shadow-2xs hover:shadow-xs flex items-center justify-between gap-2.5"
              >
                {/* Left: Class & Subject Information */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[13px] text-[#142010] truncate leading-tight">
                      {assignment.class_stream?.name || "Class Group"}
                    </span>

                    {isMaster && (
                      <span
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#FFF8CF] text-[#7A4A00] border border-[#FBE6C2] text-[9px] font-bold"
                        title="You are the designated Class Master for this stream"
                      >
                        <Star className="w-2.5 h-2.5 text-[#B45309]" />
                        <span>Class Master</span>
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#525E4B] flex items-center gap-1 mt-0.5 truncate">
                    <span className="font-semibold text-[#2A7C13] truncate">
                      {assignment.subject?.name || "Subject"}
                    </span>
                    <span className="text-[#888888] font-mono text-[10px] shrink-0">
                      ({assignment.subject?.code}) · Coef {assignment.subject?.default_coefficient ?? 2}
                    </span>
                  </div>
                </div>

                {/* Right: Ergonomic Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    href={`/dashboard/academics/marks?classStreamId=${assignment.class_stream_id}&subjectId=${assignment.subject_id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] active:scale-95 text-white text-xs font-semibold shadow-2xs transition-all whitespace-nowrap"
                    title={`Enter marks for ${assignment.class_stream?.name}`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Enter Marks</span>
                  </Link>

                  <Link
                    href={`/dashboard/attendance?classStreamId=${assignment.class_stream_id}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-[5px] bg-[#F5F5F0] hover:bg-[#EAEAE5] active:scale-95 text-[#555555] hover:text-[#191919] transition-all"
                    title={`Roll Call for ${assignment.class_stream?.name}`}
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
