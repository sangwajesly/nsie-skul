"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Layers,
  Users,
  Building2,
  Sparkles,
  BookOpen,
  Calendar,
} from "lucide-react";
import { ClassesStreamsManager } from "./ClassesStreamsManager";
import { TeacherAssignmentsManager } from "./TeacherAssignmentsManager";
import { DepartmentsSubjectsManager } from "./DepartmentsSubjectsManager";
import { AcademicSequencesManager } from "./AcademicSequencesManager";
import { TeacherAssignment, EvaluationSequence } from "@/types/database";

interface TeacherOption {
  id: string;
  name: string;
  email: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  department_id?: string | null;
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

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  subjects?: unknown[];
}

interface HodAssignmentItem {
  id: string;
  department_id?: string | null;
  scope_type: string;
  hod_user?: { full_name?: string | null };
}

interface Props {
  academicYearId: string;
  academicYearName: string;
  departments: DepartmentItem[];
  subjects: SubjectOption[];
  classSubjects: ClassSubjectConfig[];
  classesWithStreams: ClassItem[];
  hodAssignments: HodAssignmentItem[];
  teacherAssignments: TeacherAssignment[];
  teachingStaff: TeacherOption[];
  headsOfDepartment: TeacherOption[];
  classGroups: Array<{ id: string; name: string }>;
  sequences: EvaluationSequence[];
  canManageAcademics: boolean;
  canManageAssignments: boolean;
  canManageSettings: boolean;
  initialTab?: string;
}

type TabKey = "classes" | "teachers" | "departments" | "sequences";

export function AcademicsViewClient({
  academicYearId,
  academicYearName,
  departments,
  subjects,
  classSubjects,
  classesWithStreams,
  hodAssignments,
  teacherAssignments,
  teachingStaff,
  headsOfDepartment,
  classGroups,
  sequences,
  canManageAcademics,
  canManageAssignments,
  canManageSettings,
  initialTab = "classes",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>(
    (searchParams?.get("tab") as TabKey) || (initialTab as TabKey) || "classes"
  );

  useEffect(() => {
    const tabFromUrl = searchParams?.get("tab") as TabKey;
    if (tabFromUrl && ["classes", "teachers", "departments", "sequences"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    router.replace(`/dashboard/academics?${params.toString()}`, { scroll: false });
  };

  const totalStreamsCount = classesWithStreams.reduce((acc, c) => acc + c.streams.length, 0);
  const openSequencesCount = sequences.filter((s) => s.is_open_for_marks).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E5E5DF]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#191919] tracking-tight">
            Academics, Classes &amp; Staff Allocation
          </h1>
          <p className="text-[13px] text-[#666666] mt-0.5">
            Configure class levels, subject coefficients, departmental structures, teacher subject assignments, and evaluation sequence mark entry.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-[5px] bg-[#F7F3E8] text-[#555555] border border-[#E8DFC9]">
            <Calendar className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Academic Year: <strong>{academicYearName || "Current"}</strong></span>
          </span>
        </div>
      </div>

      {/* Primary Section Tabs */}
      <div className="border-b border-[#E5E5DF]">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px" aria-label="Academics sections">
          {/* Tab 1: Classes & Streams */}
          <button
            type="button"
            onClick={() => handleTabChange("classes")}
            className={`group inline-flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeTab === "classes"
                ? "border-[#191919] text-[#191919] font-bold"
                : "border-transparent text-[#666666] hover:text-[#191919] hover:border-[#D5D5CF]"
            }`}
          >
            <Layers className={`w-4 h-4 shrink-0 ${activeTab === "classes" ? "text-[#191919]" : "text-[#777777]"}`} />
            <span>Classes &amp; Groups</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0 ${
                activeTab === "classes"
                  ? "bg-[#191919] text-white font-bold"
                  : "bg-[#EAEAE6] text-[#555555]"
              }`}
            >
              {classesWithStreams.length}
            </span>
          </button>

          {/* Tab 2: Teacher Allocations */}
          {canManageAssignments && (
            <button
              type="button"
              onClick={() => handleTabChange("teachers")}
              className={`group inline-flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                activeTab === "teachers"
                  ? "border-[#191919] text-[#191919] font-bold"
                : "border-transparent text-[#666666] hover:text-[#191919] hover:border-[#D5D5CF]"
              }`}
            >
              <Users className={`w-4 h-4 shrink-0 ${activeTab === "teachers" ? "text-[#191919]" : "text-[#777777]"}`} />
              <span>Teacher Allocations</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0 ${
                  activeTab === "teachers"
                    ? "bg-[#191919] text-white font-bold"
                    : "bg-[#EAEAE6] text-[#555555]"
                }`}
              >
                {teacherAssignments.length}
              </span>
            </button>
          )}

          {/* Tab 3: Departments & Subjects */}
          <button
            type="button"
            onClick={() => handleTabChange("departments")}
            className={`group inline-flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              activeTab === "departments"
                ? "border-[#191919] text-[#191919] font-bold"
                : "border-transparent text-[#666666] hover:text-[#191919] hover:border-[#D5D5CF]"
            }`}
          >
            <Building2 className={`w-4 h-4 shrink-0 ${activeTab === "departments" ? "text-[#191919]" : "text-[#777777]"}`} />
            <span>Departments &amp; Subjects</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0 ${
                activeTab === "departments"
                  ? "bg-[#191919] text-white font-bold"
                  : "bg-[#EAEAE6] text-[#555555]"
              }`}
            >
              {departments.length}
            </span>
          </button>

          {/* Tab 4: Evaluation Sequences */}
          {canManageAcademics && sequences.length > 0 && (
            <button
              type="button"
              onClick={() => handleTabChange("sequences")}
              className={`group inline-flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                activeTab === "sequences"
                  ? "border-[#191919] text-[#191919] font-bold"
                  : "border-transparent text-[#666666] hover:text-[#191919] hover:border-[#D5D5CF]"
              }`}
            >
              <Sparkles className={`w-4 h-4 shrink-0 ${activeTab === "sequences" ? "text-[#2A7C13]" : "text-[#777777]"}`} />
              <span>Evaluation Windows</span>
              {openSequencesCount > 0 ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#EAF7E4] text-[#1F5C0E] border border-[#76C457]/30 font-bold shrink-0">
                  {openSequencesCount} Open
                </span>
              ) : (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#EAEAE6] text-[#777777] shrink-0">
                  Closed
                </span>
              )}
            </button>
          )}
        </nav>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "classes" && (
          <ClassesStreamsManager
            academicYearId={academicYearId}
            classesWithStreams={classesWithStreams}
            teachers={teachingStaff}
            subjects={subjects}
            classSubjects={classSubjects}
            canManageAcademics={canManageAcademics}
            canManageAssignments={canManageAssignments}
          />
        )}

        {activeTab === "teachers" && canManageAssignments && (
          <TeacherAssignmentsManager
            academicYearId={academicYearId}
            assignments={teacherAssignments}
            teachers={teachingStaff}
            classGroups={classGroups}
            subjects={subjects}
            canManage={canManageAssignments}
          />
        )}

        {activeTab === "departments" && (
          <DepartmentsSubjectsManager
            academicYearId={academicYearId}
            departments={departments}
            subjects={subjects}
            hodAssignments={hodAssignments}
            headsOfDepartment={headsOfDepartment}
            canManageAcademics={canManageAcademics}
            canManageSettings={canManageSettings}
          />
        )}

        {activeTab === "sequences" && canManageAcademics && (
          <div className="bg-white p-6 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-4">
            <AcademicSequencesManager sequences={sequences} />
          </div>
        )}
      </div>
    </div>
  );
}
