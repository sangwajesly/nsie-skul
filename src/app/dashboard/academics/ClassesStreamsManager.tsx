"use client";

import { useState, useMemo } from "react";
import {
  Layers,
  Search,
  Plus,
  Filter,
  X,
  Building,
  GraduationCap,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ClassCardItem } from "./ClassCardItem";
import { ClassCreateForm } from "./AcademicSetupForms";

interface TeacherOption {
  id: string;
  name: string;
  email: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  default_coefficient: number;
  default_max_marks: number;
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
  academicYearId: string;
  classesWithStreams: ClassItem[];
  teachers: TeacherOption[];
  subjects: SubjectOption[];
  classSubjects: ClassSubjectConfig[];
  canManageAcademics: boolean;
  canManageAssignments: boolean;
}

export function ClassesStreamsManager({
  academicYearId,
  classesWithStreams,
  teachers,
  subjects,
  classSubjects,
  canManageAcademics,
  canManageAssignments,
}: Props) {
  const [cycleFilter, setCycleFilter] = useState<"all" | "cycle_1" | "cycle_2">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddClassForm, setShowAddClassForm] = useState(false);

  // Total streams count
  const totalStreamsCount = useMemo(() => {
    return classesWithStreams.reduce((acc, c) => acc + c.streams.length, 0);
  }, [classesWithStreams]);

  const cycle1Count = useMemo(() => {
    return classesWithStreams.filter((c) => c.cycle === "cycle_1").length;
  }, [classesWithStreams]);

  const cycle2Count = useMemo(() => {
    return classesWithStreams.filter((c) => c.cycle === "cycle_2").length;
  }, [classesWithStreams]);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return classesWithStreams.filter((cls) => {
      const matchesCycle = cycleFilter === "all" || cls.cycle === cycleFilter;
      if (!matchesCycle) return false;

      if (!q) return true;

      const classNameMatches = cls.name.toLowerCase().includes(q);
      const streamMatches = cls.streams.some((st) =>
        st.name.toLowerCase().includes(q)
      );

      return classNameMatches || streamMatches;
    });
  }, [classesWithStreams, cycleFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Overview Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Class Levels
          </div>
          <div className="text-xl font-extrabold text-[#191919] mt-0.5">
            {classesWithStreams.length}
          </div>
          <p className="text-[10px] text-[#888888] mt-0.5">From Form 1 to Upper Sixth</p>
        </div>
        <div className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Active Class Streams
          </div>
          <div className="text-xl font-extrabold text-[#191919] mt-0.5">
            {totalStreamsCount}
          </div>
          <p className="text-[10px] text-[#888888] mt-0.5">Individual stream groups</p>
        </div>
        <div className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Cycle 1 (O-Level)
          </div>
          <div className="text-xl font-extrabold text-[#191919] mt-0.5">
            {cycle1Count}
          </div>
          <p className="text-[10px] text-[#888888] mt-0.5">Lower secondary levels</p>
        </div>
        <div className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Cycle 2 (A-Level)
          </div>
          <div className="text-xl font-extrabold text-[#191919] mt-0.5">
            {cycle2Count}
          </div>
          <p className="text-[10px] text-[#888888] mt-0.5">High school / Sixth form</p>
        </div>
      </div>

      {/* Control Bar: Cycle Filter, Search & Actions */}
      <div className="bg-white p-3.5 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Cycle Sub-Filters */}
          <div className="inline-flex rounded-[5px] border border-[#D5D5CF] bg-[#FAFAF8] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setCycleFilter("all")}
              className={`px-3 py-1 rounded-[4px] text-[11px] font-semibold transition-colors ${
                cycleFilter === "all"
                  ? "bg-white text-[#191919] shadow-2xs font-bold"
                  : "text-[#666666] hover:text-[#191919]"
              }`}
            >
              All Levels ({classesWithStreams.length})
            </button>
            <button
              type="button"
              onClick={() => setCycleFilter("cycle_1")}
              className={`px-3 py-1 rounded-[4px] text-[11px] font-semibold transition-colors ${
                cycleFilter === "cycle_1"
                  ? "bg-white text-[#191919] shadow-2xs font-bold"
                  : "text-[#666666] hover:text-[#191919]"
              }`}
            >
              Cycle 1 (O-Level) ({cycle1Count})
            </button>
            <button
              type="button"
              onClick={() => setCycleFilter("cycle_2")}
              className={`px-3 py-1 rounded-[4px] text-[11px] font-semibold transition-colors ${
                cycleFilter === "cycle_2"
                  ? "bg-white text-[#191919] shadow-2xs font-bold"
                  : "text-[#666666] hover:text-[#191919]"
              }`}
            >
              Cycle 2 (A-Level) ({cycle2Count})
            </button>
          </div>

          {canManageAcademics && (
            <button
              type="button"
              onClick={() => setShowAddClassForm((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-[5px] bg-[#191919] hover:bg-[#333333] text-white transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddClassForm ? "Close Form" : "Add Class Level"}</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative pt-2 border-t border-[#EEEEEC]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 mt-1 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search classes or streams (e.g. Form 5, Technical, Upper Sixth Arts)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[5px] border border-[#D5D5CF] bg-white text-[#191919] focus:outline-none focus:border-[#191919]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 mt-1 -translate-y-1/2 text-[#888888] hover:text-[#191919]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Add Class Level Form */}
      {showAddClassForm && canManageAcademics && (
        <div className="bg-white p-4 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#EEEEEC]">
            <span className="text-xs font-bold text-[#191919]">Create New Class Level</span>
            <button
              type="button"
              onClick={() => setShowAddClassForm(false)}
              className="text-[#888888] hover:text-[#191919]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ClassCreateForm />
        </div>
      )}

      {/* Grid of Classes & Class Groups */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-[8px] border border-[#E5E5DF] p-12 text-center space-y-2">
          <Layers className="w-8 h-8 text-[#888888] mx-auto" />
          <h4 className="text-sm font-bold text-[#191919]">No Classes Found</h4>
          <p className="text-xs text-[#666666] max-w-sm mx-auto">
            {searchTerm
              ? "No class levels or streams match your search."
              : "No classes found for the selected cycle. Use 'Add Class Level' above to create one."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => (
            <ClassCardItem
              key={cls.id}
              cls={cls}
              academicYearId={academicYearId}
              teachers={teachers}
              subjects={subjects}
              classSubjects={classSubjects}
              canManageAcademics={canManageAcademics}
              canManageAssignments={canManageAssignments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
