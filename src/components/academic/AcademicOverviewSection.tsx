"use client";

import { useState } from "react";
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
} from "lucide-react";
import type { AcademicAnalyticsData, StudentRankItem } from "@/lib/academic/analytics-service";
import { fetchSequenceAnalyticsAction } from "@/app/dashboard/analytics-actions";
import { HonorRollCertificateModal } from "./certificates/HonorRollCertificateModal";
import type { HonorRollRecipient, AwardCategory } from "./certificates/types";

interface Props {
  initialData: AcademicAnalyticsData;
}

export function AcademicOverviewSection({ initialData }: Props) {
  const [data, setData] = useState<AcademicAnalyticsData>(initialData);
  const [activeTab, setActiveTab] = useState<"honor_roll" | "classes" | "subjects">("honor_roll");
  const [selectedSequenceId, setSelectedSequenceId] = useState<string>(initialData.selectedSequenceId);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);
  const [selectedRecipient, setSelectedRecipient] = useState<HonorRollRecipient | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AwardCategory | undefined>(undefined);

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
    window.print();
  };

  const { overallKpis, dux, topStudents, classPerformance, subjectLaureates, scope } = data;
  const hasData = overallKpis.totalStudentsEvaluated > 0;

  return (
    <section className="bg-white border border-[#E5E5DF] rounded-[12px] p-5 sm:p-6 space-y-6 shadow-xs print:border-none print:shadow-none print:p-0">
      {/* ── Top Header & Sequence Switcher ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EFEA]">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FFF8CF] text-[#7A5B00] border border-[#FBE6C2]">
              <Trophy className="w-3.5 h-3.5 text-[#B45309]" />
              Academic Performance &amp; Honor Roll
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
            Statistical appraisal, highest averages, and honor rolls for official councils and assemblies.
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

          {/* Honor Roll Certificate Generator Button */}
          <button
            type="button"
            onClick={() => handleOpenCertificates()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-[6px] bg-[#FFF8CF] hover:bg-[#FEF08A] border border-[#FACC15] text-[#713F12] transition-colors shadow-2xs cursor-pointer print:hidden"
            title="Generate and print Honor Roll Certificates (Tableau d'Honneur)"
          >
            <Award className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Tableau d&apos;Honneur</span>
          </button>

          {/* Print / Export Button */}
          <button
            type="button"
            onClick={handlePrintSummary}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[6px] bg-white hover:bg-[#F9F6ED] border border-[#D5CBB2] text-[#142010] transition-colors shadow-2xs cursor-pointer print:hidden"
            title="Print performance summary for assembly or notice board"
          >
            <Printer className="w-3.5 h-3.5 text-[#555555]" />
            <span className="hidden sm:inline">Print Roster</span>
          </button>
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
              Once teachers submit evaluation scores for this sequence, the overall school Dux, class honor rolls, pass/fail percentages, and subject laureates will populate here automatically.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── HERO KPI CARDS ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. School Dux / Major de Promotion Card */}
            <div className="relative overflow-hidden rounded-[10px] border-2 border-[#EAB308]/40 bg-gradient-to-br from-[#FEFCE8] via-white to-[#FFFBEB] p-5 shadow-xs flex flex-col justify-between">
              <div className="absolute top-2.5 right-2.5 w-16 h-16 bg-[#FDE047]/20 rounded-full blur-xl pointer-events-none" />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#FEF08A] text-[#854D0E] border border-[#FACC15]">
                    <Trophy className="w-3 h-3 text-[#A16207]" />
                    {scope.role === "admin"
                      ? "School Dux · Major Général"
                      : scope.role === "hod"
                      ? "Department Dux"
                      : "Top Student in Classes"}
                  </span>
                  <span className="font-mono text-[10px] text-[#713F12] font-bold">
                    🥇 1st Place
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#142010] tracking-tight truncate">
                    {dux?.name || "Student Name"}
                  </h3>
                  <p className="text-xs text-[#713F12] font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold">{dux?.className} {dux?.streamName}</span>
                    <span>·</span>
                    <span className="font-mono text-[11px] text-[#854D0E]">
                      {dux?.matricule}
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#FEF08A]/80 mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#854D0E] block">
                    Highest Average
                  </span>
                  <div className="text-2xl font-black font-mono text-[#142010]">
                    {dux?.average.toFixed(2)}{" "}
                    <span className="text-xs font-normal text-[#666666]">/20</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#86EFAC]">
                    <Sparkles className="w-3 h-3 text-[#16A34A]" />
                    <span>{dux?.appreciation.split("(")[0].trim()}</span>
                  </span>

                  {dux && (
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenCertificates(
                          {
                            studentId: dux.studentId,
                            studentName: dux.name,
                            matricule: dux.matricule,
                            gender: dux.gender,
                            className: dux.className,
                            streamName: dux.streamName,
                            fullClassName: dux.fullClassName || `${dux.className} ${dux.streamName}`,
                            awardCategory: "school_podium",
                            awardTitle: "Major Général · School Dux (1st Rank)",
                            rankLabel: "1st in School",
                            average: dux.average,
                            appreciation: dux.appreciation,
                            cycle: dux.cycle,
                          },
                          "school_podium"
                        )
                      }
                      className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#854D0E] hover:text-[#713F12] bg-[#FEF08A] hover:bg-[#FDE047] px-2 py-0.5 rounded border border-[#FACC15] transition-colors cursor-pointer print:hidden"
                      title="Generate official Dux certificate"
                    >
                      <Award className="w-3 h-3" />
                      <span>Certificate</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Pass Rate vs Fail Rate Card */}
            <div className="rounded-[10px] border border-[#E5E5DF] bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                  Pass / Fail Evaluation
                </span>
                <span className="text-[10px] font-semibold text-[#888888]">
                  Threshold: 10.00 / 20
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-black font-mono text-[#15803D]">
                    {overallKpis.passRate}%
                  </div>
                  <div className="text-xs text-[#555555] font-medium">
                    <span className="font-bold text-[#15803D]">{overallKpis.passedCount}</span> passed
                    {" / "}
                    <span className="font-bold text-red-600">{overallKpis.failedCount}</span> failed
                  </div>
                </div>

                {/* Dual-colored progress bar */}
                <div className="w-full h-3 rounded-full bg-red-100 overflow-hidden flex shadow-inner">
                  <div
                    className="h-full bg-[#16A34A] transition-all duration-500 rounded-l-full"
                    style={{ width: `${overallKpis.passRate}%` }}
                    title={`Passed: ${overallKpis.passRate}%`}
                  />
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${overallKpis.failRate}%` }}
                    title={`Failed: ${overallKpis.failRate}%`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#F0EFEA] text-[11px]">
                <span className="text-[#15803D] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{overallKpis.passedCount} Promoted (&ge;10)</span>
                </span>
                <span className="text-red-600 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{overallKpis.failedCount} At Risk (&lt;10)</span>
                </span>
              </div>
            </div>

            {/* 3. Overall Average & Honors Count */}
            <div className="rounded-[10px] border border-[#E5E5DF] bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">
                  General Average &amp; Honors
                </span>
                <span className="text-[10px] font-semibold text-[#888888]">
                  {overallKpis.totalStudentsEvaluated} Students
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-[#777777] font-semibold block uppercase">
                  Class Council Average
                </span>
                <div className="text-3xl font-black font-mono text-[#142010]">
                  {overallKpis.overallAverage.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-[#888888]">/20</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F0EFEA] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#166534]">
                  <Award className="w-4 h-4 text-[#2A7C13]" />
                  <span className="font-bold">{overallKpis.honorsCount} on Honor Roll</span>
                </div>
                <span className="text-[11px] text-[#777777] font-mono">
                  Range: {overallKpis.lowestAverage} - {overallKpis.highestAverage}
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
              <Trophy className="w-4 h-4" />
              <span>Honor Roll &amp; Top 3 Roster</span>
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
              <span>Class-by-Class Pass Rates ({classPerformance.length})</span>
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
              <span>Subject Laureates &amp; Best Marks ({subjectLaureates.length})</span>
            </button>
          </div>

          {/* ── TAB 1: HONOR ROLL (TOP 3 SCHOOL & TOP 3 PER CLASS) ────────────── */}
          {activeTab === "honor_roll" && (
            <div className="space-y-6">
              {/* Podium: Top 3 Students School-Wide */}
              <div className="p-5 rounded-[10px] bg-[#FAF8F5] border border-[#E8DFC9] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#142010] flex items-center gap-1.5">
                      <Medal className="w-4 h-4 text-[#B45309]" />
                      <span>School-Wide Laureates · Top 3 Students</span>
                    </h3>
                    <p className="text-[11px] text-[#666666]">
                      The highest academic averages across all registered classes in {data.selectedSequenceName}.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FEF08A] text-[#854D0E] border border-[#FACC15]">
                    Tableau d&apos;Honneur
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {topStudents.slice(0, 3).map((st, idx) => {
                    const medals = ["🥇 1st Prize", "🥈 2nd Prize", "🥉 3rd Prize"];
                    const badgeStyles = [
                      "border-[#FACC15] bg-[#FEFCE8] text-[#854D0E]",
                      "border-[#CBD5E1] bg-[#F8FAFC] text-[#334155]",
                      "border-[#FDBA74] bg-[#FFF7ED] text-[#9A3412]",
                    ];

                    return (
                      <div
                        key={st.studentId}
                        className={`p-4 rounded-[8px] border ${badgeStyles[idx]} flex flex-col justify-between space-y-2.5 shadow-2xs`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs">{medals[idx]}</span>
                          <span className="font-mono text-base font-black text-[#142010]">
                            {st.average.toFixed(2)} <span className="text-[10px] font-normal text-[#666666]">/20</span>
                          </span>
                        </div>

                        <div>
                          <div className="font-bold text-sm text-[#142010] truncate">
                            {st.name}
                          </div>
                          <div className="text-[11px] text-[#555555] font-medium mt-0.5">
                            {st.className} {st.streamName} · <span className="font-mono">{st.matricule}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[10px]">
                          <span className="text-[#166534] font-semibold truncate">
                            {st.appreciation.split("(")[0].trim()}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenCertificates(
                                {
                                  studentId: st.studentId,
                                  studentName: st.name,
                                  matricule: st.matricule,
                                  gender: st.gender,
                                  className: st.className,
                                  streamName: st.streamName,
                                  fullClassName: st.fullClassName || `${st.className} ${st.streamName}`,
                                  awardCategory: "school_podium",
                                  awardTitle:
                                    idx === 0
                                      ? "Major Général · School Dux (1st Rank)"
                                      : idx === 1
                                      ? "2nd Prize · School-Wide Excellence"
                                      : "3rd Prize · School-Wide Excellence",
                                  rankLabel: `#${idx + 1} in School`,
                                  average: st.average,
                                  appreciation: st.appreciation,
                                  cycle: st.cycle,
                                },
                                "school_podium"
                              )
                            }
                            className="inline-flex items-center gap-1 font-bold text-[#854D0E] hover:underline cursor-pointer shrink-0 ml-2 print:hidden"
                          >
                            <Award className="w-3 h-3" />
                            <span>Certificate</span>
                          </button>
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
                                <span className="w-5 text-center font-bold text-[11px] text-[#777777]">
                                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
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
                                            ? `Major de Classe · 1st in ${cls.fullClassName}`
                                            : i === 1
                                            ? `2nd Place · ${cls.fullClassName}`
                                            : `3rd Place · ${cls.fullClassName}`,
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

          {/* ── TAB 3: SUBJECT LAUREATES & BEST MARKS ─────────────────────────── */}
          {activeTab === "subjects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#666666]">
                <span>
                  The highest scoring student in each subject and subject pass rate across all evaluated streams.
                </span>
                <span className="font-semibold text-[#142010]">
                  {subjectLaureates.length} Subjects Evaluated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {subjectLaureates.map((sub) => (
                  <div
                    key={sub.subjectId}
                    className="p-4 rounded-[8px] border border-[#E5E5DF] bg-white hover:border-[#2A7C13] transition-all space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#F0EFEA]">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#F0EFEA] text-[#555555]">
                            {sub.subjectCode || "SUB"}
                          </span>
                          <h4 className="font-bold text-xs text-[#142010] truncate">
                            {sub.subjectName}
                          </h4>
                        </div>
                        {sub.departmentName && (
                          <span className="text-[10px] text-[#888888]">
                            Dept: {sub.departmentName}
                          </span>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-base font-black text-[#15803D] block">
                          {sub.bestMark.toFixed(1)}{" "}
                          <span className="text-[10px] font-normal text-[#666666]">/20</span>
                        </span>
                        <span className="text-[9px] uppercase font-bold text-[#888888]">
                          Best Mark
                        </span>
                      </div>
                    </div>

                    {/* Best Student info */}
                    <div className="p-2.5 rounded bg-[#FAF8F5] border border-[#E8DFC9] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#777777] uppercase flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-[#B45309]" />
                          <span>Subject Laureate</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenCertificates(
                              {
                                studentId: `${sub.studentMatricule}_${sub.subjectId}`,
                                studentName: sub.studentName,
                                matricule: sub.studentMatricule,
                                className: sub.className,
                                fullClassName: sub.className,
                                awardCategory: "subject_laureate",
                                awardTitle: `Prix d'Excellence · ${sub.subjectName}`,
                                subjectName: sub.subjectName,
                                subjectCode: sub.subjectCode,
                                subjectMark: sub.bestMark,
                                cycle: sub.cycle,
                              },
                              "subject_laureate"
                            )
                          }
                          className="text-[10px] font-bold text-[#854D0E] hover:underline flex items-center gap-1 cursor-pointer print:hidden"
                          title="Generate subject excellence certificate"
                        >
                          <Award className="w-3 h-3" />
                          <span>Certificate</span>
                        </button>
                      </div>
                      <div className="font-bold text-xs text-[#142010] truncate">
                        {sub.studentName}
                      </div>
                      <div className="text-[10px] text-[#555555] font-medium flex items-center justify-between">
                        <span>{sub.className} · <span className="font-mono">{sub.studentMatricule}</span></span>
                        {sub.cycle && <span className="text-[9.5px] font-semibold text-[#854D0E]">{sub.cycle}</span>}
                      </div>
                    </div>

                    {/* Subject Stats */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-[#666666]">
                        Average: <strong className="font-mono text-[#142010]">{sub.averageScore.toFixed(1)}/20</strong>
                      </span>
                      <span className="text-[#15803D] font-bold">
                        Pass: {sub.passRate}% ({sub.passedCount}/{sub.totalEvaluated})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
    </section>
  );
}
