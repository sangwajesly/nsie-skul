"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  Trophy,
  BookOpen,
  Filter,
  Check,
  Sliders,
  Settings2,
  Calendar,
  Layers,
  Search,
} from "lucide-react";
import type { AcademicAnalyticsData, StudentRankItem, SubjectLaureateItem } from "@/lib/academic/analytics-service";
import type {
  HonorRollRecipient,
  CertificateConfig,
  CertificateTemplateId,
  EducationCycle,
  AwardCategory,
} from "./types";
import { ClassicHeritageCertificate } from "./ClassicHeritageCertificate";
import { ModernLaureateCertificate } from "./ModernLaureateCertificate";
import { SubjectDistinctionCertificate } from "./SubjectDistinctionCertificate";

interface Props {
  data: AcademicAnalyticsData;
  isOpen: boolean;
  onClose: () => void;
  initialRecipient?: HonorRollRecipient | null;
  initialCategory?: AwardCategory;
}

const CITATION_PRESETS: Record<string, string> = {
  excellence:
    "In recognition of outstanding academic performance, unwavering commitment to excellence, and exemplary conduct during the evaluation period.",
  bilingual:
    "En reconnaissance de résultats académiques remarquables, d'un travail assidu et d'une conduite exemplaire au cours de cette séquence d'évaluation.",
  encouragement:
    "Awarded with encouragement and warmest congratulations from the Academic Council for distinguished scholastic effort and praiseworthy character.",
  subjectMastery:
    "In high commendation of intellectual curiosity, rigorous analytical acumen, and outstanding mastery demonstrated in this discipline.",
};

export function HonorRollCertificateModal({
  data,
  isOpen,
  onClose,
  initialRecipient,
  initialCategory,
}: Props) {
  // ── State: Filter Criteria ────────────────────────────────────────────────
  const [filterCriteria, setFilterCriteria] = useState<
    "school_podium" | "class_podium" | "class_dux" | "threshold_14" | "threshold_12" | "subject_laureates" | "all"
  >(initialCategory === "subject_laureate" ? "subject_laureates" : "school_podium");

  const [selectedCycle, setSelectedCycle] = useState<EducationCycle>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // ── State: Customizer / Configuration ─────────────────────────────────────
  const [config, setConfig] = useState<CertificateConfig>({
    templateId: initialCategory === "subject_laureate" ? "subject_distinction" : "classic_heritage",
    citation: CITATION_PRESETS.excellence,
    issueDate: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    signatory1Title: "The Principal / Le Chef d'Établissement",
    signatory1Name: "",
    signatory2Title: "Director of Studies / Le Censeur",
    signatory2Name: "",
    showSchoolLogo: true,
    showNationalHeader: true,
    showWatermark: true,
    showSealRosette: true,
    bilingualLabels: true,
  });

  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isBatchPrinting, setIsBatchPrinting] = useState<boolean>(false);

  // ── Build all eligible recipient candidates ────────────────────────────────
  const allEligibleRecipients = useMemo<HonorRollRecipient[]>(() => {
    const list: HonorRollRecipient[] = [];

    // 1. School Podium (Top 3 School-wide)
    data.topStudents.slice(0, 5).forEach((st, idx) => {
      list.push({
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
            : idx === 2
            ? "3rd Prize · School-Wide Excellence"
            : `Top ${idx + 1} Honor Roll Laureate`,
        rankLabel: `#${idx + 1} in School`,
        average: st.average,
        appreciation: st.appreciation,
        cycle: st.cycle,
      });
    });

    // 2. Class Top 3 from Class Streams
    data.classPerformance.forEach((cls) => {
      cls.top3.forEach((st, idx) => {
        // avoid duplicating if already in list under same category
        list.push({
          studentId: st.studentId,
          studentName: st.name,
          matricule: st.matricule,
          gender: st.gender,
          className: cls.className,
          streamName: cls.streamName,
          fullClassName: cls.fullClassName,
          awardCategory: "class_podium",
          awardTitle:
            idx === 0
              ? `Major de Classe (1st in ${cls.fullClassName})`
              : idx === 1
              ? `2nd Place · ${cls.fullClassName}`
              : `3rd Place · ${cls.fullClassName}`,
          rankLabel: `#${idx + 1} in ${cls.fullClassName}`,
          average: st.average,
          appreciation: st.appreciation,
          cycle: cls.cycle,
        });
      });
    });

    // 3. Score Threshold Students from allRankedStudents
    (data.allRankedStudents || []).forEach((st) => {
      if (st.average >= 12.0) {
        list.push({
          studentId: st.studentId,
          studentName: st.name,
          matricule: st.matricule,
          gender: st.gender,
          className: st.className,
          streamName: st.streamName,
          fullClassName: st.fullClassName || `${st.className} ${st.streamName}`,
          awardCategory: "threshold_honor",
          awardTitle:
            st.average >= 16.0
              ? "Tableau d'Honneur avec Félicitations"
              : st.average >= 14.0
              ? "Tableau d'Honneur avec Encouragements"
              : "Tableau d'Honneur Simple",
          rankLabel: `Rank #${st.rank}`,
          average: st.average,
          appreciation: st.appreciation,
          cycle: st.cycle,
        });
      }
    });

    // 4. Subject Laureates
    data.subjectLaureates.forEach((sub) => {
      list.push({
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
      });
    });

    return list;
  }, [data]);

  // ── Filter based on Active Filter and Search ──────────────────────────────
  const filteredRecipients = useMemo<HonorRollRecipient[]>(() => {
    // If modal was opened with a single pre-selected recipient
    if (initialRecipient) {
      return [initialRecipient];
    }

    let items = allEligibleRecipients;

    // Apply Filter Criteria
    if (filterCriteria === "school_podium") {
      items = items.filter((r) => r.awardCategory === "school_podium").slice(0, 3);
    } else if (filterCriteria === "class_podium") {
      items = items.filter((r) => r.awardCategory === "class_podium");
    } else if (filterCriteria === "class_dux") {
      items = items.filter(
        (r) => r.awardCategory === "class_podium" && r.awardTitle.includes("Major de Classe")
      );
    } else if (filterCriteria === "threshold_14") {
      items = items.filter(
        (r) => r.awardCategory === "threshold_honor" && typeof r.average === "number" && r.average >= 14.0
      );
    } else if (filterCriteria === "threshold_12") {
      items = items.filter(
        (r) => r.awardCategory === "threshold_honor" && typeof r.average === "number" && r.average >= 12.0
      );
    } else if (filterCriteria === "subject_laureates") {
      items = items.filter((r) => r.awardCategory === "subject_laureate");
    }

    // Apply Cycle Filter
    if (selectedCycle !== "All") {
      items = items.filter((r) => r.cycle === selectedCycle);
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.matricule.toLowerCase().includes(q) ||
          r.fullClassName.toLowerCase().includes(q) ||
          (r.subjectName && r.subjectName.toLowerCase().includes(q))
      );
    }

    // Deduplicate by studentId + awardTitle to ensure unique certificates
    const uniqueMap = new Map<string, HonorRollRecipient>();
    items.forEach((item) => {
      const key = `${item.studentId}_${item.awardTitle}_${item.subjectName || ""}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    return Array.from(uniqueMap.values());
  }, [allEligibleRecipients, filterCriteria, selectedCycle, searchQuery, initialRecipient]);

  // Ensure currentIndex stays within bounds
  const activeRecipient = filteredRecipients[currentIndex] || filteredRecipients[0];

  // ── Print Handlers ────────────────────────────────────────────────────────
  const handlePrintSingle = () => {
    setIsBatchPrinting(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintBatch = () => {
    setIsBatchPrinting(true);
    setTimeout(() => {
      window.print();
      setIsBatchPrinting(false);
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="relative w-full max-w-6xl bg-[#FAF9F5] border border-[#E5E5DF] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white">
        
        {/* ── TOP MODAL CONTROLS BAR (Hidden during print) ───────────────────── */}
        <div className="bg-white border-b border-[#E8DFC9] px-4 py-3 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFF8CF] text-[#B45309] border border-[#FBE6C2] flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#142010] flex items-center gap-2">
                <span>Honor Roll &amp; Academic Certificates</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                  Tableau d&apos;Honneur
                </span>
              </h2>
              <p className="text-[11px] text-[#666666]">
                {data.schoolInfo.name} · {data.academicYearName} · {data.selectedSequenceName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                showConfigDrawer
                  ? "bg-[#2A7C13] text-white border-[#2A7C13]"
                  : "bg-white text-[#333333] border-[#D5CBB2] hover:bg-[#F9F6ED]"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Customize</span>
            </button>

            <button
              type="button"
              onClick={handlePrintSingle}
              disabled={!activeRecipient}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-[#142010] border border-[#D5CBB2] hover:bg-[#F9F6ED] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-[#555555]" />
              <span>Print This</span>
            </button>

            <button
              type="button"
              onClick={handlePrintBatch}
              disabled={filteredRecipients.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-[#2A7C13] hover:bg-[#236810] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print All ({filteredRecipients.length})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#666666] hover:text-[#111827] hover:bg-gray-100 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── FILTER & TEMPLATE TOOLBAR (Hidden during print) ────────────────── */}
        <div className="bg-[#FAF8F5] border-b border-[#E8DFC9] px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap shrink-0 print:hidden text-xs">
          {/* Criteria Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#777777] flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Criteria:
            </span>

            {[
              { id: "school_podium", label: "Top 3 School" },
              { id: "class_podium", label: "Top 3 Per Class" },
              { id: "class_dux", label: "Class Dux Only" },
              { id: "threshold_14", label: "Score ≥ 14/20" },
              { id: "threshold_12", label: "Score ≥ 12/20" },
              { id: "subject_laureates", label: "Subject Champions" },
            ].map((crit) => (
              <button
                key={crit.id}
                type="button"
                onClick={() => {
                  setFilterCriteria(crit.id as any);
                  setCurrentIndex(0);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterCriteria === crit.id
                    ? "bg-[#142010] text-white shadow-2xs"
                    : "bg-white text-[#555555] border border-[#D5CBB2] hover:bg-[#F0EFEA]"
                }`}
              >
                {crit.label}
              </button>
            ))}
          </div>

          {/* Cycle & Template Selector */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Cycle Selector */}
            <select
              value={selectedCycle}
              onChange={(e) => {
                setSelectedCycle(e.target.value as EducationCycle);
                setCurrentIndex(0);
              }}
              className="px-2.5 py-1 rounded-md bg-white border border-[#D5CBB2] text-[11px] font-bold text-[#142010] focus:outline-none cursor-pointer"
            >
              <option value="All">All Cycles</option>
              <option value="Cycle 1">1st Cycle (Forms 1-5 / 6e-3e)</option>
              <option value="Cycle 2">2nd Cycle (6th Form / 2nde-Tle)</option>
            </select>

            {/* Template Switcher */}
            <div className="inline-flex rounded-lg border border-[#D5CBB2] p-0.5 bg-white">
              {[
                { id: "classic_heritage", label: "🏛️ Classic" },
                { id: "modern_laureate", label: "💎 Modern" },
                { id: "subject_distinction", label: "🌿 Distinction" },
              ].map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, templateId: tmpl.id as any }))}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    config.templateId === tmpl.id
                      ? "bg-[#FFF8CF] text-[#7A5B00] shadow-2xs"
                      : "text-[#666666] hover:text-[#111827]"
                  }`}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT AREA (Preview & Config Drawer) ───────────────────── */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-start print:p-0 print:overflow-visible">
          {/* Drawer: Live Customization Panel */}
          {showConfigDrawer && (
            <div className="w-full max-w-4xl mb-6 bg-white border border-[#D5CBB2] rounded-xl p-4 sm:p-5 shadow-sm space-y-4 print:hidden text-xs">
              <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-2">
                <h3 className="font-extrabold text-[#142010] text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#2A7C13]" />
                  <span>Certificate Customization &amp; Institutional Wording</span>
                </h3>
                <span className="text-[10px] text-[#777777]">Changes apply instantly to certificates</span>
              </div>

              {/* Citation preset buttons and textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#333333]">Official Citation / Appreciation Text:</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-[#888888]">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, citation: CITATION_PRESETS.excellence }))}
                      className="px-2 py-0.5 rounded bg-[#F0EFEA] hover:bg-[#E4E3DD] text-[10px] font-semibold text-[#444444]"
                    >
                      Excellence
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, citation: CITATION_PRESETS.bilingual }))}
                      className="px-2 py-0.5 rounded bg-[#F0EFEA] hover:bg-[#E4E3DD] text-[10px] font-semibold text-[#444444]"
                    >
                      Bilingual FR/EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, citation: CITATION_PRESETS.encouragement }))}
                      className="px-2 py-0.5 rounded bg-[#F0EFEA] hover:bg-[#E4E3DD] text-[10px] font-semibold text-[#444444]"
                    >
                      Encouragement
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, citation: CITATION_PRESETS.subjectMastery }))}
                      className="px-2 py-0.5 rounded bg-[#F0EFEA] hover:bg-[#E4E3DD] text-[10px] font-semibold text-[#444444]"
                    >
                      Subject Mastery
                    </button>
                  </div>
                </div>
                <textarea
                  value={config.citation}
                  onChange={(e) => setConfig((c) => ({ ...c, citation: e.target.value }))}
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-[#D5CBB2] bg-[#FAF8F5] text-xs font-medium text-[#111827] focus:outline-none focus:border-[#2A7C13]"
                />
              </div>

              {/* Signatories & Issue Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#333333] block">Signatory 1 Title (Right):</label>
                  <input
                    type="text"
                    value={config.signatory1Title}
                    onChange={(e) => setConfig((c) => ({ ...c, signatory1Title: e.target.value }))}
                    placeholder="The Principal / Le Proviseur"
                    className="w-full p-2 rounded-md border border-[#D5CBB2] text-xs font-medium"
                  />
                  <input
                    type="text"
                    value={config.signatory1Name}
                    onChange={(e) => setConfig((c) => ({ ...c, signatory1Name: e.target.value }))}
                    placeholder="Signatory Name (Optional)"
                    className="w-full p-2 rounded-md border border-[#D5CBB2] text-xs font-medium text-[#555555]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#333333] block">Signatory 2 Title (Left):</label>
                  <input
                    type="text"
                    value={config.signatory2Title}
                    onChange={(e) => setConfig((c) => ({ ...c, signatory2Title: e.target.value }))}
                    placeholder="Director of Studies / Le Censeur"
                    className="w-full p-2 rounded-md border border-[#D5CBB2] text-xs font-medium"
                  />
                  <input
                    type="text"
                    value={config.signatory2Name}
                    onChange={(e) => setConfig((c) => ({ ...c, signatory2Name: e.target.value }))}
                    placeholder="Signatory Name (Optional)"
                    className="w-full p-2 rounded-md border border-[#D5CBB2] text-xs font-medium text-[#555555]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#333333] block">Date of Attribution / Issue:</label>
                  <input
                    type="text"
                    value={config.issueDate}
                    onChange={(e) => setConfig((c) => ({ ...c, issueDate: e.target.value }))}
                    className="w-full p-2 rounded-md border border-[#D5CBB2] text-xs font-medium"
                  />
                </div>
              </div>

              {/* Visual Toggles */}
              <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-[#F0EFEA] text-[11px]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showSchoolLogo}
                    onChange={(e) => setConfig((c) => ({ ...c, showSchoolLogo: e.target.checked }))}
                    className="rounded text-[#2A7C13] focus:ring-0"
                  />
                  <span className="font-medium text-[#333333]">Include School Logo</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showNationalHeader}
                    onChange={(e) => setConfig((c) => ({ ...c, showNationalHeader: e.target.checked }))}
                    className="rounded text-[#2A7C13] focus:ring-0"
                  />
                  <span className="font-medium text-[#333333]">Official Republic Header</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showWatermark}
                    onChange={(e) => setConfig((c) => ({ ...c, showWatermark: e.target.checked }))}
                    className="rounded text-[#2A7C13] focus:ring-0"
                  />
                  <span className="font-medium text-[#333333]">Background Watermark</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showSealRosette}
                    onChange={(e) => setConfig((c) => ({ ...c, showSealRosette: e.target.checked }))}
                    className="rounded text-[#2A7C13] focus:ring-0"
                  />
                  <span className="font-medium text-[#333333]">Rosette Seal</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.bilingualLabels}
                    onChange={(e) => setConfig((c) => ({ ...c, bilingualLabels: e.target.checked }))}
                    className="rounded text-[#2A7C13] focus:ring-0"
                  />
                  <span className="font-medium text-[#333333]">Bilingual Text Labels</span>
                </label>
              </div>
            </div>
          )}

          {/* ── CAROUSEL CONTROLS (Hidden during print) ──────────────────────── */}
          {filteredRecipients.length > 1 && (
            <div className="w-full max-w-4xl flex items-center justify-between gap-3 mb-4 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="p-1.5 rounded-lg border border-[#D5CBB2] bg-white text-[#333333] hover:bg-[#F0EFEA] disabled:opacity-40 transition-colors cursor-pointer"
                  title="Previous Certificate"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-bold text-[#142010]">
                  Recipient <strong>{currentIndex + 1}</strong> of <strong>{filteredRecipients.length}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.min(filteredRecipients.length - 1, prev + 1))}
                  disabled={currentIndex >= filteredRecipients.length - 1}
                  className="p-1.5 rounded-lg border border-[#D5CBB2] bg-white text-[#333333] hover:bg-[#F0EFEA] disabled:opacity-40 transition-colors cursor-pointer"
                  title="Next Certificate"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Search */}
              <div className="relative w-48 sm:w-64">
                <input
                  type="text"
                  placeholder="Filter student or class..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentIndex(0);
                  }}
                  className="w-full pl-7 pr-2.5 py-1 text-xs rounded-md border border-[#D5CBB2] bg-white focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-[#888888] absolute left-2 top-2" />
              </div>
            </div>
          )}

          {/* ── CERTIFICATE PREVIEW (Single View in modal, or batch loop on print) ── */}
          {filteredRecipients.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Award className="w-10 h-10 text-[#AAAAAA] mx-auto" />
              <h3 className="font-bold text-[#142010] text-sm">No qualifying students found for this criterion</h3>
              <p className="text-xs text-[#666666]">
                Try adjusting the minimum threshold or cycle selector above.
              </p>
            </div>
          ) : isBatchPrinting ? (
            /* Print All Mode: Sequential certificates with page breaks */
            <div className="w-full">
              {filteredRecipients.map((rec) => (
                <div key={`${rec.studentId}_${rec.awardTitle}`} className="w-full">
                  {config.templateId === "classic_heritage" && (
                    <ClassicHeritageCertificate
                      recipient={rec}
                      config={config}
                      school={data.schoolInfo}
                      academicYearName={data.academicYearName}
                      sequenceName={data.selectedSequenceName}
                    />
                  )}
                  {config.templateId === "modern_laureate" && (
                    <ModernLaureateCertificate
                      recipient={rec}
                      config={config}
                      school={data.schoolInfo}
                      academicYearName={data.academicYearName}
                      sequenceName={data.selectedSequenceName}
                    />
                  )}
                  {config.templateId === "subject_distinction" && (
                    <SubjectDistinctionCertificate
                      recipient={rec}
                      config={config}
                      school={data.schoolInfo}
                      academicYearName={data.academicYearName}
                      sequenceName={data.selectedSequenceName}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Single Certificate Interactive Live Preview */
            <div className="w-full flex justify-center">
              {config.templateId === "classic_heritage" && activeRecipient && (
                <ClassicHeritageCertificate
                  recipient={activeRecipient}
                  config={config}
                  school={data.schoolInfo}
                  academicYearName={data.academicYearName}
                  sequenceName={data.selectedSequenceName}
                />
              )}
              {config.templateId === "modern_laureate" && activeRecipient && (
                <ModernLaureateCertificate
                  recipient={activeRecipient}
                  config={config}
                  school={data.schoolInfo}
                  academicYearName={data.academicYearName}
                  sequenceName={data.selectedSequenceName}
                />
              )}
              {config.templateId === "subject_distinction" && activeRecipient && (
                <SubjectDistinctionCertificate
                  recipient={activeRecipient}
                  config={config}
                  school={data.schoolInfo}
                  academicYearName={data.academicYearName}
                  sequenceName={data.selectedSequenceName}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
