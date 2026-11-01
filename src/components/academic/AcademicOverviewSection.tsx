"use client";

import { useState, useMemo } from "react";
import {
  Trophy,
  Award,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Medal,
  Printer,
  ChevronDown,
  Loader2,
  GraduationCap,
  Percent,
  Search,
  X,
  Lock,
} from "lucide-react";
import type { AcademicAnalyticsData, StudentRankItem } from "@/lib/academic/analytics-service";
import { fetchSequenceAnalyticsAction } from "@/app/dashboard/analytics-actions";
import { HonorRollCertificateModal } from "./certificates/HonorRollCertificateModal";
import { HonorRollRosterModal } from "./certificates/HonorRollRosterModal";
import type { HonorRollRecipient, AwardCategory } from "./certificates/types";

function resolveDisplayMatricule(matricule?: string | null, schoolCode?: string | null): string {
  if (!matricule) return "N/A";
  if (!schoolCode) return matricule;
  const suffixMatch = matricule.match(/-(\d{2,4}-\d+|\d{3,6})$/);
  if (suffixMatch) {
    return `${schoolCode}${suffixMatch[0]}`;
  }
  return matricule;
}

interface Props {
  initialData: AcademicAnalyticsData;
  canPrintCertificates?: boolean;
}

export function AcademicOverviewSection({ initialData, canPrintCertificates = false }: Props) {
  const [data, setData] = useState<AcademicAnalyticsData>(initialData);
  const [activeTab, setActiveTab] = useState<"honor_roll" | "classes" | "subjects">("honor_roll");
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>(initialData.selectedSequenceId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState<boolean>(false);
  const [selectedRecipient, setSelectedRecipient] = useState<HonorRollRecipient | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AwardCategory | undefined>(undefined);

  // ── Subject Performance Tab Filter State ─────────────────────────────────
  const [subjectSearch, setSubjectSearch] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [subjectSort, setSubjectSort] = useState<"mark_desc" | "pass_desc" | "avg_desc" | "name_asc">("mark_desc");

  const handleOpenCertificates = (recipient?: HonorRollRecipient, category?: AwardCategory) => {
    setSelectedRecipient(recipient || null);
    setSelectedCategory(category);
    setIsCertificateModalOpen(true);
  };

  const handleSequenceChange = async (seqId: string) => {
    if (seqId === selectedSequenceId || isLoading) return;
    setSelectedSequenceId(seqId);
    setIsLoading(true);

    try {
      const res = await fetchSequenceAnalyticsAction(seqId);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to switch sequence analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintSummary = () => {
    setIsRosterModalOpen(true);
  };

  const { overallKpis, dux, topStudents, classPerformance, subjectLaureates, scope } = data;
  const hasData = overallKpis.totalStudentsEvaluated > 0;

  // Extract unique departments for filtering
  const departmentList = useMemo(() => {
    const depts = new Set<string>();
    subjectLaureates.forEach((s) => {
      if (s.departmentName) depts.add(s.departmentName);
    });
    return Array.from(depts).sort();
  }, [subjectLaureates]);

  // Filtered & sorted subjects for effortless scanning
  const filteredSubjects = useMemo(() => {
    return subjectLaureates
      .filter((s) => {
        if (selectedDept !== "All" && s.departmentName !== selectedDept) {
          return false;
        }
        if (subjectSearch.trim()) {
          const q = subjectSearch.toLowerCase().trim();
          return (
            s.subjectName.toLowerCase().includes(q) ||
            s.subjectCode.toLowerCase().includes(q) ||
            s.studentName.toLowerCase().includes(q) ||
            s.className.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (subjectSort === "mark_desc") return b.bestMark - a.bestMark;
        if (subjectSort === "pass_desc") return b.passRate - a.passRate;
        if (subjectSort === "avg_desc") return b.averageScore - a.averageScore;
        return a.subjectName.localeCompare(b.subjectName);
      });
  }, [subjectLaureates, selectedDept, subjectSearch, subjectSort]);

  // Top Performing Subject across the sequence
  const topSubject = useMemo(() => {
    if (!subjectLaureates || subjectLaureates.length === 0) return null;
    const sorted = [...subjectLaureates].sort((a, b) => {
      if (b.passRate !== a.passRate) return b.passRate - a.passRate;
      if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
      return b.bestMark - a.bestMark;
    });
    return sorted[0];
  }, [subjectLaureates]);

  return (
    <section className="bg-white border border-[#E5E5DF] rounded-[12px] p-5 sm:p-6 space-y-6 shadow-xs print:border-none print:shadow-none print:p-0">
      {/* ── Top Header & Sequence Switcher ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EFEA]">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
              <Award className="w-3.5 h-3.5 text-[#16A34A]" />
              Academic Performance &amp; Roll of Honour
            </span>
            <span className="text-xs text-[#888888]">·</span>
            <span className="text-xs font-semibold text-[#555555]">
              {scope.title}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#142010]">
            Performance Overview &amp; Top Students
          </h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Statistical appraisal, highest averages, and Roll of Honour for official academic councils.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sequence Dropdown Selector */}
          <div className="relative inline-block">
            <select
              value={selectedSequenceId}
              onChange={(e) => handleSequenceChange(e.target.value)}
              disabled={isLoading}
              className="appearance-none bg-[#FAF8F5] hover:bg-[#F0EFEA] border border-[#D5CBB2] text-[#142010] text-xs font-bold py-2 pl-3.5 pr-8 rounded-[6px] focus:outline-none focus:border-[#2A7C13] cursor-pointer transition-colors shadow-2xs"
            >
              {data.availableSequences.map((seq) => (
                <option key={seq.id} value={seq.id}>
                  {seq.name} {seq.is_open ? "· (Open)" : ""}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#666666]">
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2A7C13]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </div>
          </div>

          {/* Honor Roll Certificate Generator & Roster Buttons (Admin / Principal Only) */}
          {canPrintCertificates ? (
            <>
              <button
                type="button"
                onClick={() => handleOpenCertificates()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white transition-colors shadow-2xs cursor-pointer print:hidden"
                title="Generate and print Roll of Honour Certificates"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Roll of Honour</span>
              </button>

              <button
                type="button"
                onClick={handlePrintSummary}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[6px] bg-white hover:bg-[#F9F6ED] border border-[#D5CBB2] text-[#142010] transition-colors shadow-2xs cursor-pointer print:hidden"
                title="Print official Roll of Honour notice board and assembly roster"
              >
                <Printer className="w-3.5 h-3.5 text-[#555555]" />
                <span className="hidden sm:inline">Print Roll Roster</span>
              </button>
            </>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] bg-[#FFF8CF] border border-[#FBE6C2] text-[11px] font-semibold text-[#7A5B00] print:hidden">
              <Lock className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Certificates by Administration Only</span>
            </div>
          )}
        </div>
      </div>

      {/* ── EMPTY STATE IF NO MARKS RECORDED YET ──────────────────────────── */}
      {!hasData ? (
        <div className="text-center py-10 px-4 rounded-[10px] bg-[#FAF8F5] border border-dashed border-[#D5CBB2] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FFF8CF] text-[#B45309] mx-auto flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#142010]">
              No Assessment Marks Recorded for {data.selectedSequenceName}
            </h3>
            <p className="text-xs text-[#666666] max-w-md mx-auto leading-relaxed">
              Once teachers submit evaluation scores for this sequence, the overall school Dux, class honor rolls, pass/fail percentages, and top students by subject will populate here automatically.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── HERO KPI CARDS ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. School Dux / Top Scholar Card */}
            <div className="rounded-[8px] border border-[#E5E5DF] bg-white p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-2xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#666666]">
                    {scope.role === "admin"
                      ? "School Dux (1st Place)"
                      : scope.role === "hod"
                      ? "Department Dux"
                      : "Top Student"}
                  </span>
                  <span className="text-[11px] font-bold text-[#15803D]">
                    {dux?.appreciation.split("(")[0].trim()}
                  </span>
                </div>

                <div className="font-bold text-base text-[#142010] truncate">
                  {dux?.name || "Student Name"}
                </div>
                <div className="text-xs text-[#666666]">
                  {dux?.fullClassName || dux?.className} · <span className="font-mono text-[#888888]">{resolveDisplayMatricule(dux?.matricule, data.schoolInfo?.code)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0EFEA] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#777777] block font-medium">Average Score</span>
                  <div className="text-xl font-bold font-mono text-[#142010]">
                    {dux?.average.toFixed(2)}{" "}
                    <span className="text-xs font-normal text-[#888888]">/ 20</span>
                  </div>
                </div>

                {dux && canPrintCertificates && (
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenCertificates(
                        {
                          studentId: dux.studentId,
                          studentName: dux.name,
                          matricule: resolveDisplayMatricule(dux.matricule, data.schoolInfo?.code),
                          gender: dux.gender,
                          className: dux.className,
                          streamName: dux.streamName,
                          fullClassName: dux.fullClassName || `${dux.className} ${dux.streamName}`,
                          awardCategory: "school_podium",
                          awardTitle: "School Dux - 1st Position School-Wide",
                          rankLabel: "1st in School",
                          average: dux.average,
                          appreciation: dux.appreciation,
                          cycle: dux.cycle,
                        },
                        "school_podium"
                      )
                    }
                    className="text-xs font-semibold text-[#2A7C13] hover:text-[#1F5C0E] hover:underline cursor-pointer print:hidden"
                  >
                    Certificate &rarr;
                  </button>
                )}
              </div>
            </div>

            {/* 2. Pass / Fail Evaluation */}
            <div className="rounded-[8px] border border-[#E5E5DF] bg-white p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-2xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#666666]">
                    Pass Rate (Threshold: 10.00 / 20)
                  </span>
                  <span className="text-[11px] font-bold text-[#15803D]">
                    {overallKpis.passedCount} Promoted
                  </span>
                </div>

                <div className="text-2xl font-bold font-mono text-[#15803D]">
                  {overallKpis.passRate}%
                </div>
                <div className="text-xs text-[#666666]">
                  <strong className="text-[#142010]">{overallKpis.passedCount}</strong> passed ·{" "}
                  <span className="text-red-600 font-semibold">{overallKpis.failedCount}</span> failed
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0EFEA] flex items-center justify-between text-xs text-[#777777]">
                <span>Total Evaluated</span>
                <span className="font-mono font-bold text-[#142010]">
                  {overallKpis.totalStudentsEvaluated} Students
                </span>
              </div>
            </div>

            {/* 3. Class Council Average & Honors */}
            <div className="rounded-[8px] border border-[#E5E5DF] bg-white p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-2xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#666666]">
                    Council General Average
                  </span>
                  <span className="text-[11px] font-bold text-[#2A7C13]">
                    {overallKpis.honorsCount} on Roll of Honour
                  </span>
                </div>

                <div className="text-2xl font-bold font-mono text-[#142010]">
                  {overallKpis.overallAverage.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-[#888888]">/ 20</span>
                </div>
                <div className="text-xs text-[#666666]">
                  School-wide performance across all enrolled classes
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0EFEA] flex items-center justify-between text-xs text-[#777777]">
                <span>Score Range</span>
                <span className="font-mono font-medium text-[#142010]">
                  {overallKpis.lowestAverage.toFixed(1)} to {overallKpis.highestAverage.toFixed(1)} / 20
                </span>
              </div>
            </div>
          </div>

          {/* ── TAB NAVIGATION BAR ────────────────────────────────────────────── */}
          <div className="border-b border-[#E8DFC9] flex items-center gap-2 sm:gap-4 overflow-x-auto print:hidden">
            <button
              type="button"
              onClick={() => setActiveTab("honor_roll")}
              className={`py-2.5 px-3 sm:px-4 text-xs sm:text-[13px] font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === "honor_roll"
                  ? "border-[#2A7C13] text-[#2A7C13] bg-[#FFF8CF]/20 rounded-t-[6px]"
                  : "border-transparent text-[#666666] hover:text-[#142010]"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Roll of Honour &amp; Top 3</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("classes")}
              className={`py-2.5 px-3 sm:px-4 text-xs sm:text-[13px] font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === "classes"
                  ? "border-[#2A7C13] text-[#2A7C13] bg-[#FFF8CF]/20 rounded-t-[6px]"
                  : "border-transparent text-[#666666] hover:text-[#142010]"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Class Pass Rates ({classPerformance.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("subjects")}
              className={`py-2.5 px-3 sm:px-4 text-xs sm:text-[13px] font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === "subjects"
                  ? "border-[#2A7C13] text-[#2A7C13] bg-[#FFF8CF]/20 rounded-t-[6px]"
                  : "border-transparent text-[#666666] hover:text-[#142010]"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Top Student by Subject ({subjectLaureates.length})</span>
            </button>
          </div>

          {/* ── TAB 1: HONOR ROLL (TOP 3 SCHOOL & TOP 3 PER CLASS) ────────────── */}
          {activeTab === "honor_roll" && (
            <div className="space-y-6">
              {/* Podium: Top 3 Students School-Wide */}
              <div className="p-4 sm:p-5 rounded-[8px] bg-white border border-[#E5E5DF] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#142010]">
                      Top 3 Students Across Entire School
                    </h3>
                    <p className="text-xs text-[#666666]">
                      The highest academic averages across all registered classes in {data.selectedSequenceName}.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#2A7C13]">
                    Roll of Honour
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {topStudents.slice(0, 3).map((st, idx) => {
                    const positionLabels = ["1st Position", "2nd Position", "3rd Position"];

                    return (
                      <div
                        key={st.studentId}
                        className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-[#FAF8F5]/40 flex flex-col justify-between space-y-2 hover:border-[#2A7C13] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-[#2A7C13]">
                            {positionLabels[idx]}
                          </span>
                          <span className="font-mono text-sm font-bold text-[#142010]">
                            {st.average.toFixed(2)} <span className="text-[10px] font-normal text-[#888888]">/20</span>
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-xs text-[#142010] truncate">
                            {st.name}
                          </div>
                          <div className="text-[11px] text-[#666666] mt-0.5">
                            {st.fullClassName || st.className} · <span className="font-mono text-[#777777]">{resolveDisplayMatricule(st.matricule, data.schoolInfo?.code)}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#F0EFEA] flex items-center justify-between text-[11px]">
                          <span className="text-[#15803D] font-medium truncate">
                            {st.appreciation.split("(")[0].trim()}
                          </span>
                          {canPrintCertificates && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenCertificates(
                                  {
                                    studentId: st.studentId,
                                    studentName: st.name,
                                    matricule: resolveDisplayMatricule(st.matricule, data.schoolInfo?.code),
                                    gender: st.gender,
                                    className: st.className,
                                    streamName: st.streamName,
                                    fullClassName: st.fullClassName || `${st.className} ${st.streamName}`,
                                    awardCategory: "school_podium",
                                    awardTitle:
                                      idx === 0
                                        ? "School Dux - 1st Position School-Wide"
                                        : idx === 1
                                        ? "2nd Position - School-Wide Excellence"
                                        : "3rd Position - School-Wide Excellence",
                                    rankLabel: `#${idx + 1} in School`,
                                    average: st.average,
                                    appreciation: st.appreciation,
                                    cycle: st.cycle,
                                  },
                                  "school_podium"
                                )
                              }
                              className="font-semibold text-[#2A7C13] hover:underline cursor-pointer shrink-0 ml-2 print:hidden"
                            >
                              Certificate &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Class-by-Class Top 3 Grids */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#142010]">
                    Class Stream Honor Rolls (Top 3 per Class Group)
                  </h3>
                  <span className="text-xs text-[#777777]">
                    {classPerformance.length} class stream{classPerformance.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {classPerformance.map((cls) => (
                    <div
                      key={cls.classStreamId}
                      className="p-4 rounded-[8px] bg-white border border-[#E5E5DF] hover:border-[#2A7C13] transition-all space-y-3 shadow-2xs"
                    >
                      {/* Class Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-[#F0EFEA]">
                        <div>
                          <span className="font-bold text-xs text-[#142010] block">
                            {cls.fullClassName}
                          </span>
                          <span className="text-[10px] text-[#777777]">
                            {cls.totalStudents} students · Avg: {cls.classAverage.toFixed(2)}/20
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            cls.passRate >= 70
                              ? "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]"
                              : cls.passRate >= 50
                              ? "bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {cls.passRate}% Pass
                        </span>
                      </div>

                      {/* Top 3 List */}
                      <div className="space-y-1.5 text-xs">
                        {cls.top3.length === 0 ? (
                          <span className="text-[11px] text-[#888888] italic block py-1">
                            No marks entered for this class yet.
                          </span>
                        ) : (
                          cls.top3.map((st, i) => (
                            <div
                              key={st.studentId}
                              className="flex items-center justify-between p-1.5 rounded hover:bg-[#FAF8F5] transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                    i === 0
                                      ? "bg-[#FFF8CF] text-[#7A5B00] border border-[#FBE6C2]"
                                      : i === 1
                                      ? "bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1]"
                                      : "bg-[#FFF7ED] text-[#9A3412] border border-[#FED7AA]"
                                  }`}
                                >
                                  {i + 1}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-semibold text-[#142010] truncate text-[11.5px]">
                                    {st.name}
                                  </div>
                                  <div className="text-[9.5px] font-mono text-[#888888]">
                                    {st.matricule}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className="font-mono font-bold text-xs text-[#166534]">
                                  {st.average.toFixed(2)}
                                </span>
                                {canPrintCertificates && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOpenCertificates(
                                        {
                                          studentId: st.studentId,
                                          studentName: st.name,
                                          matricule: st.matricule,
                                          gender: st.gender,
                                          className: cls.className,
                                          streamName: cls.streamName,
                                          fullClassName: cls.fullClassName,
                                          awardCategory: "class_podium",
                                          awardTitle:
                                            i === 0
                                              ? `1st Position in ${cls.fullClassName}`
                                              : i === 1
                                              ? `2nd Position in ${cls.fullClassName}`
                                              : `3rd Position in ${cls.fullClassName}`,
                                          rankLabel: `#${i + 1} in ${cls.fullClassName}`,
                                          average: st.average,
                                          appreciation: st.appreciation,
                                          cycle: cls.cycle,
                                        },
                                        "class_podium"
                                      )
                                    }
                                    className="p-1 rounded text-[#B45309] hover:bg-[#FFF8CF] transition-colors cursor-pointer print:hidden"
                                    title={`Print certificate for ${st.name}`}
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: CLASS PERFORMANCE TABLE (PASS / FAIL RATES) ─────────────── */}
          {activeTab === "classes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#666666]">
                <span>Classes sorted from highest pass rate to lowest for targeted intervention.</span>
                <span className="font-semibold text-[#142010]">
                  Official threshold: &ge; 10.00 / 20
                </span>
              </div>

              <div className="border border-[#E5E5DF] rounded-[8px] overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF8F5] text-[#142010] font-bold border-b border-[#E5E5DF]">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Class Group</th>
                      <th className="p-3 text-center">Evaluated</th>
                      <th className="p-3 text-center text-[#15803D]">Passed (&ge;10)</th>
                      <th className="p-3 text-center text-red-600">Failed (&lt;10)</th>
                      <th className="p-3">Pass Rate (%)</th>
                      <th className="p-3 text-right">Class Average</th>
                      <th className="p-3 text-right">Best Average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EFEA] text-[#444444]">
                    {classPerformance.map((cls, idx) => (
                      <tr key={cls.classStreamId} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#888888]">
                          #{idx + 1}
                        </td>
                        <td className="p-3 font-bold text-[#142010]">
                          {cls.fullClassName}
                        </td>
                        <td className="p-3 text-center font-mono font-semibold">
                          {cls.totalStudents}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-[#15803D]">
                          {cls.passedCount}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-red-600">
                          {cls.failedCount}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold text-xs ${
                                cls.passRate >= 70
                                  ? "text-[#15803D]"
                                  : cls.passRate >= 50
                                  ? "text-[#854D0E]"
                                  : "text-red-600"
                              }`}
                            >
                              {cls.passRate}%
                            </span>
                            <div className="w-20 h-1.5 rounded-full bg-red-100 overflow-hidden flex">
                              <div
                                className="h-full bg-[#16A34A] rounded-full"
                                style={{ width: `${cls.passRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#142010]">
                          {cls.classAverage.toFixed(2)}/20
                        </td>
                        <td className="p-3 text-right font-mono text-[#15803D] font-bold">
                          {cls.highestAverage.toFixed(2)}/20
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 3: SUBJECT PERFORMANCE & TOP STUDENTS ─────────────────────── */}
          {activeTab === "subjects" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F0EFEA]">
                <div>
                  <h3 className="text-sm font-bold text-[#142010]">
                    Top Student by Subject
                  </h3>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Highest-scoring student and class pass rates for each evaluated subject in {data.selectedSequenceName}.
                  </p>
                </div>
                <div className="text-xs text-[#666666]">
                  Showing <span className="font-semibold text-[#142010]">{filteredSubjects.length}</span> of {subjectLaureates.length} subjects
                </div>
              </div>

              {/* Top Subject Highlight Card */}
              {topSubject && (
                <div className="bg-white border border-[#E5E5DF] rounded-[8px] p-4 sm:p-5 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EFEA] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-[#EAF7E4] text-[#166534] border border-[#BBF7D0] flex items-center justify-center font-bold text-xs shrink-0">
                        #1
                      </div>
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">
                          Top Performing Subject
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-[#142010]">
                          {topSubject.subjectName} ({topSubject.subjectCode})
                        </h4>
                      </div>
                    </div>
                    {topSubject.departmentName && (
                      <span className="self-start sm:self-auto text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#555555] border border-[#D5CBB2]">
                        {topSubject.departmentName}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* Teacher(s) */}
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-[#777777] block font-medium">Subject Teacher(s):</span>
                      <div className="font-bold text-[#142010]">
                        {topSubject.teachers && topSubject.teachers.length > 0
                          ? topSubject.teachers.join(", ")
                          : "Unassigned"}
                      </div>
                    </div>

                    {/* Pass Rate & Average */}
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-[#777777] block font-medium">Class Pass Rate:</span>
                      <div className="font-bold text-[#15803D] font-mono">
                        {topSubject.passRate}%{" "}
                        <span className="text-[11px] font-normal text-[#666666]">
                          ({topSubject.passedCount}/{topSubject.totalEvaluated} passed)
                        </span>
                      </div>
                    </div>

                    {/* Highest Student */}
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-[#777777] block font-medium">Top Scoring Student:</span>
                      <div className="font-bold text-[#142010] truncate">
                        {topSubject.studentName}{" "}
                        <span className="text-[#15803D] font-mono">({topSubject.bestMark.toFixed(1)}/20)</span>
                      </div>
                      <div className="text-[10px] text-[#777777]">
                        {topSubject.className}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filtering Toolbar (Single Clean Row Without Horizontal Scrollbars) */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 text-xs">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    placeholder="Filter by subject, code, student, or class..."
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-[#D5CBB2] rounded-[6px] text-[#142010] placeholder:text-[#888888] focus:outline-none focus:border-[#2A7C13]"
                  />
                  {subjectSearch && (
                    <button
                      type="button"
                      onClick={() => setSubjectSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#142010] p-0.5 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Department Dropdown Filter */}
                {departmentList.length > 0 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-medium text-[#666666]">Dept:</span>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="bg-white border border-[#D5CBB2] text-[#142010] text-xs py-1.5 px-2.5 rounded-[6px] focus:outline-none focus:border-[#2A7C13] cursor-pointer"
                    >
                      <option value="All">All Departments ({subjectLaureates.length})</option>
                      {departmentList.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept} ({subjectLaureates.filter((s) => s.departmentName === dept).length})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-medium text-[#666666]">Sort:</span>
                  <select
                    value={subjectSort}
                    onChange={(e) => setSubjectSort(e.target.value as any)}
                    className="bg-white border border-[#D5CBB2] text-[#142010] text-xs py-1.5 px-2.5 rounded-[6px] focus:outline-none focus:border-[#2A7C13] cursor-pointer"
                  >
                    <option value="mark_desc">Highest Mark</option>
                    <option value="pass_desc">Pass Rate</option>
                    <option value="avg_desc">Subject Average</option>
                    <option value="name_asc">Name (A → Z)</option>
                  </select>
                </div>

                {(subjectSearch || selectedDept !== "All") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSubjectSearch("");
                      setSelectedDept("All");
                    }}
                    className="text-xs font-semibold text-[#2A7C13] hover:underline cursor-pointer shrink-0 self-center"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Empty state when filters match 0 */}
              {filteredSubjects.length === 0 ? (
                <div className="p-8 text-center rounded-[8px] border border-dashed border-[#D5CBB2] bg-[#FAF8F5] space-y-2">
                  <BookOpen className="w-8 h-8 text-[#888888] mx-auto opacity-60" />
                  <h4 className="font-bold text-sm text-[#142010]">No subjects found</h4>
                  <p className="text-xs text-[#666666]">
                    No subject matches your current filter or search criteria.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubjectSearch("");
                      setSelectedDept("All");
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-[#2A7C13] text-white hover:bg-[#20600E] cursor-pointer"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                /* ── COMPACT, PROFESSIONAL ACADEMIC TABLE ───────────────────── */
                <div className="border border-[#E5E5DF] rounded-[8px] overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#FAF8F5] border-b border-[#E8DFC9] text-[11px] font-semibold text-[#666666]">
                          <th className="p-3 w-16 text-center font-mono">Code</th>
                          <th className="p-3">Subject &amp; Department</th>
                          <th className="p-3">Teacher(s)</th>
                          <th className="p-3">Top Student</th>
                          <th className="p-3 text-right">Highest Mark</th>
                          <th className="p-3 text-right">Class Avg</th>
                          <th className="p-3 text-right">Pass Rate</th>
                          {canPrintCertificates && (
                            <th className="p-3 text-right print:hidden">Action</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EFEA]">
                        {filteredSubjects.map((sub, idx) => (
                          <tr
                            key={sub.subjectId}
                            className={`hover:bg-[#FFFDF7] transition-colors ${
                              idx % 2 === 1 ? "bg-[#FAF8F5]/30" : "bg-white"
                            }`}
                          >
                            {/* Code */}
                            <td className="p-3 text-center font-mono text-[11px] font-bold text-[#666666]">
                              {sub.subjectCode || "N/A"}
                            </td>

                            {/* Subject Name & Department */}
                            <td className="p-3">
                              <div className="font-semibold text-xs text-[#142010]">
                                {sub.subjectName}
                              </div>
                              {sub.departmentName && (
                                <div className="text-[11px] text-[#777777]">
                                  {sub.departmentName}
                                </div>
                              )}
                            </td>

                            {/* Teacher(s) */}
                            <td className="p-3">
                              {sub.topTeacher ? (
                                <div>
                                  <div className="font-semibold text-xs text-[#142010] truncate max-w-[150px]">
                                    {sub.topTeacher}
                                  </div>
                                  {sub.teachers && sub.teachers.length > 1 && (
                                    <div className="text-[10px] text-[#777777]">
                                      +{sub.teachers.length - 1} other teacher{sub.teachers.length > 2 ? "s" : ""}
                                    </div>
                                  )}
                                </div>
                              ) : sub.teachers && sub.teachers.length > 0 ? (
                                <div className="font-medium text-xs text-[#142010] truncate max-w-[150px]">
                                  {sub.teachers.join(", ")}
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#888888] italic">Unassigned</span>
                              )}
                            </td>

                            {/* Best Student (Clean, calm typography without trophy badges or clutter) */}
                            <td className="p-3">
                              <div className="font-semibold text-xs text-[#142010]">
                                {sub.studentName}
                              </div>
                              <div className="text-[11px] text-[#666666]">
                                {sub.className} · <span className="font-mono text-[#777777]">{resolveDisplayMatricule(sub.studentMatricule, data.schoolInfo?.code)}</span>
                              </div>
                            </td>

                            {/* Highest Mark */}
                            <td className="p-3 text-right font-mono font-bold text-[#15803D]">
                              {sub.bestMark.toFixed(1)}{" "}
                              <span className="text-[10px] text-[#888888] font-normal">/20</span>
                            </td>

                            {/* Class Average */}
                            <td className="p-3 text-right font-mono font-medium text-[#142010]">
                              {sub.averageScore.toFixed(1)}{" "}
                              <span className="text-[10px] text-[#888888] font-normal">/20</span>
                            </td>

                            {/* Pass Rate */}
                            <td className="p-3 text-right">
                              <span className="font-mono font-bold text-xs text-[#15803D]">
                                {sub.passRate}%
                              </span>
                              <span className="text-[11px] text-[#777777] ml-1.5 hidden sm:inline">
                                ({sub.passedCount}/{sub.totalEvaluated})
                              </span>
                            </td>

                            {/* Action Button (Admin / Principal Only) */}
                            {canPrintCertificates && (
                              <td className="p-3 text-right print:hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenCertificates(
                                      {
                                        studentId: `${sub.studentMatricule}_${sub.subjectId}`,
                                        studentName: sub.studentName,
                                        matricule: resolveDisplayMatricule(sub.studentMatricule, data.schoolInfo?.code),
                                        className: sub.className,
                                        fullClassName: sub.className,
                                        awardCategory: "subject_laureate",
                                        awardTitle: `Subject Excellence · 1st in ${sub.subjectName}`,
                                        subjectName: sub.subjectName,
                                        subjectCode: sub.subjectCode,
                                        subjectMark: sub.bestMark,
                                        teacherName: sub.topTeacher || sub.teachers?.[0],
                                        cycle: sub.cycle,
                                      },
                                      "subject_laureate"
                                    )
                                  }
                                  className="text-[11px] font-semibold text-[#2A7C13] hover:text-[#1F5C0E] hover:underline cursor-pointer"
                                >
                                  Award Certificate &rarr;
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── HONOR ROLL CERTIFICATE GENERATOR MODAL ───────────────────────── */}
      <HonorRollCertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        data={data}
        initialRecipient={selectedRecipient}
        initialCategory={selectedCategory}
      />

      {/* ── OFFICIAL ROLL OF HONOUR ROSTER MODAL & PRINT PORTAL ───────────── */}
      {isRosterModalOpen && (
        <HonorRollRosterModal
          isOpen={isRosterModalOpen}
          onClose={() => setIsRosterModalOpen(false)}
          data={data}
        />
      )}
    </section>
  );
}
