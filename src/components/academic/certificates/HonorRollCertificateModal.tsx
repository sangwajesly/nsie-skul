"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  Award,
  Filter,
  Check,
  Settings2,
  Search,
} from "lucide-react";
import type { AcademicAnalyticsData } from "@/lib/academic/analytics-service";
import type {
  HonorRollRecipient,
  CertificateConfig,
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
  diligence:
    "Awarded with warmest congratulations from the Academic Council for distinguished scholastic effort, intellectual rigor, and praiseworthy character.",
  subjectMastery:
    "In high commendation of intellectual curiosity, rigorous analytical acumen, and outstanding mastery demonstrated in this discipline.",
  bilingual:
    "In recognition of outstanding academic performance / En reconnaissance de résultats académiques remarquables et d'une conduite exemplaire.",
};

function resolveDisplayMatricule(matricule?: string | null, schoolCode?: string | null): string {
  if (!matricule) return "N/A";
  if (!schoolCode) return matricule;
  const suffixMatch = matricule.match(/-(\d{2,4}-\d+|\d{3,6})$/);
  if (suffixMatch) {
    return `${schoolCode}${suffixMatch[0]}`;
  }
  return matricule;
}

export function HonorRollCertificateModal({
  data,
  isOpen,
  onClose,
  initialRecipient,
  initialCategory,
}: Props) {
  const [mounted, setMounted] = useState(false);

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
    signatory1Title: "The Principal",
    signatory1Name: "",
    signatory2Title: "Vice Principal",
    signatory2Name: "",
    showSchoolLogo: true,
    showNationalHeader: true,
    showWatermark: true,
    showSealRosette: true,
    bilingualLabels: false,
  });

  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isBatchPrinting, setIsBatchPrinting] = useState<boolean>(false);

  // ── Lifecycle for portal and print event listener ─────────────────────────
  useEffect(() => {
    setMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const afterPrint = () => {
      document.body.classList.remove("printing-certificate");
      setIsBatchPrinting(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("afterprint", afterPrint);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("afterprint", afterPrint);
      document.body.classList.remove("printing-certificate");
    };
  }, [isOpen, onClose]);

  // ── Build all eligible recipient candidates ────────────────────────────────
  const allEligibleRecipients = useMemo<HonorRollRecipient[]>(() => {
    const list: HonorRollRecipient[] = [];

    // 1. School Podium (Top 3 School-wide)
    data.topStudents.slice(0, 5).forEach((st, idx) => {
      list.push({
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
            ? "2nd Position - School-Wide Academic Excellence"
            : idx === 2
            ? "3rd Position - School-Wide Academic Excellence"
            : `Top ${idx + 1} Scholar - Roll of Honour`,
        rankLabel: `#${idx + 1} in School`,
        average: st.average,
        appreciation: st.appreciation,
        cycle: st.cycle,
      });
    });

    // 2. Class Top 3 from Class Streams
    data.classPerformance.forEach((cls) => {
      cls.top3.forEach((st, idx) => {
        list.push({
          studentId: st.studentId,
          studentName: st.name,
          matricule: resolveDisplayMatricule(st.matricule, data.schoolInfo?.code),
          gender: st.gender,
          className: cls.className,
          streamName: cls.streamName,
          fullClassName: cls.fullClassName,
          awardCategory: "class_podium",
          awardTitle:
            idx === 0
              ? `1st Position in ${cls.fullClassName}`
              : idx === 1
              ? `2nd Position in ${cls.fullClassName}`
              : `3rd Position in ${cls.fullClassName}`,
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
          matricule: resolveDisplayMatricule(st.matricule, data.schoolInfo?.code),
          gender: st.gender,
          className: st.className,
          streamName: st.streamName,
          fullClassName: st.fullClassName || `${st.className} ${st.streamName}`,
          awardCategory: "threshold_honor",
          awardTitle:
            st.average >= 16.0
              ? "Roll of Honour · Highest Distinction"
              : st.average >= 14.0
              ? "Roll of Honour · Distinction"
              : "Roll of Honour · Commendation",
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
      });
    });

    return list;
  }, [data]);

  // ── Filter based on Active Filter and Search ──────────────────────────────
  const filteredRecipients = useMemo<HonorRollRecipient[]>(() => {
    if (initialRecipient) {
      return [initialRecipient];
    }

    let items = allEligibleRecipients;

    if (filterCriteria === "school_podium") {
      items = items.filter((r) => r.awardCategory === "school_podium").slice(0, 3);
    } else if (filterCriteria === "class_podium") {
      items = items.filter((r) => r.awardCategory === "class_podium");
    } else if (filterCriteria === "class_dux") {
      items = items.filter(
        (r) => r.awardCategory === "class_podium" && r.awardTitle.includes("1st Position")
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

    if (selectedCycle !== "All") {
      items = items.filter((r) => r.cycle === selectedCycle);
    }

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

  // ── Print Handlers: Isolates the certificate completely ────────────────────
  const handlePrintSingle = () => {
    if (typeof window === "undefined" || !activeRecipient) return;
    setIsBatchPrinting(false);
    const originalTitle = document.title;
    const cleanMatricule = (activeRecipient.matricule || "STU").replace(/[^a-zA-Z0-9]/g, "_");
    const cleanName = (activeRecipient.studentName || "Student").replace(/[^a-zA-Z0-9]/g, "_");
    const awardType = activeRecipient.subjectName
      ? `Excellence_${activeRecipient.subjectName.replace(/[^a-zA-Z0-9]/g, "_")}`
      : activeRecipient.awardCategory;

    document.title = `Certificate_${awardType}_${cleanMatricule}_${cleanName}`;
    document.body.classList.add("printing-certificate");

    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        const cleanup = () => {
          document.title = originalTitle;
          document.body.classList.remove("printing-certificate");
          window.removeEventListener("afterprint", cleanup);
        };
        window.addEventListener("afterprint", cleanup);
        setTimeout(cleanup, 2000);
      }, 100);
    });
  };

  const handlePrintBatch = () => {
    if (typeof window === "undefined") return;
    setIsBatchPrinting(true);
    const originalTitle = document.title;
    const schoolCode =
      data.schoolInfo.code ||
      data.schoolInfo.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() ||
      "SCH";
    const cleanSeq = (data.selectedSequenceName || "Sequence").replace(/[^a-zA-Z0-9]/g, "_");
    const cleanYear = (data.academicYearName || "2026-2027").replace(/[^a-zA-Z0-9]/g, "-");

    document.title = `Certificates_${schoolCode}_${filterCriteria}_${cleanSeq}_${cleanYear}`;
    document.body.classList.add("printing-certificate");

    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        const cleanup = () => {
          document.title = originalTitle;
          document.body.classList.remove("printing-certificate");
          window.removeEventListener("afterprint", cleanup);
        };
        window.addEventListener("afterprint", cleanup);
        setTimeout(cleanup, 2000);
      }, 150);
    });
  };

  const renderCertificateItem = (rec: HonorRollRecipient) => {
    if (config.templateId === "classic_heritage") {
      return (
        <ClassicHeritageCertificate
          recipient={rec}
          config={config}
          school={data.schoolInfo}
          academicYearName={data.academicYearName}
          sequenceName={data.selectedSequenceName}
        />
      );
    }
    if (config.templateId === "modern_laureate") {
      return (
        <ModernLaureateCertificate
          recipient={rec}
          config={config}
          school={data.schoolInfo}
          academicYearName={data.academicYearName}
          sequenceName={data.selectedSequenceName}
        />
      );
    }
    return (
      <SubjectDistinctionCertificate
        recipient={rec}
        config={config}
        school={data.schoolInfo}
        academicYearName={data.academicYearName}
        sequenceName={data.selectedSequenceName}
      />
    );
  };

  if (!isOpen || !mounted) return null;

  return (
    <>
      {/* ── ON-SCREEN INTERACTIVE MODAL (COMPLETELY HIDDEN DURING PRINT) ──────── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto print:hidden">
        <div className="relative w-full max-w-6xl bg-[#FAF9F5] border border-[#E5E5DF] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
          
          {/* Top Header Bar */}
          <div className="bg-white border-b border-[#E8DFC9] px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#142010] flex items-center gap-2">
                  <span>Roll of Honour &amp; Academic Certificates</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7E4] text-[#166534] border border-[#BBF7D0]">
                    English Subsystem
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
                <span>Print Certificate</span>
              </button>

              <button
                type="button"
                onClick={handlePrintBatch}
                disabled={filteredRecipients.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-[#2A7C13] hover:bg-[#20600E] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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

          {/* Filter & Template Toolbar */}
          <div className="bg-[#FAF8F5] border-b border-[#E8DFC9] px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap shrink-0 text-xs">
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
                { id: "subject_laureates", label: "Best in Subject" },
              ].map((crit) => (
                <button
                  key={crit.id}
                  type="button"
                  onClick={() => {
                    setFilterCriteria(crit.id as any);
                    setCurrentIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    filterCriteria === crit.id
                      ? "bg-[#2A7C13] text-white shadow-2xs"
                      : "bg-white text-[#555555] border border-[#D5CBB2] hover:bg-[#F9F6ED]"
                  }`}
                >
                  {crit.label}
                </button>
              ))}
            </div>

            {/* Template Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#777777] uppercase">Template:</span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#D5CBB2]">
                {[
                  { id: "classic_heritage", label: "Classic Heritage" },
                  { id: "modern_laureate", label: "Modern Laureate" },
                  { id: "subject_distinction", label: "Subject Distinction" },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, templateId: tpl.id as any }))}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      config.templateId === tpl.id
                        ? "bg-[#2A7C13] text-white"
                        : "text-[#555555] hover:text-[#111827]"
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Body with Interactive Preview */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-start">
            {/* Customizer Drawer */}
            {showConfigDrawer && (
              <div className="w-full max-w-4xl bg-white border border-[#D5CBB2] rounded-xl p-4 sm:p-5 mb-5 shadow-xs space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-2">
                  <h3 className="font-extrabold text-[#142010] text-sm">
                    Certificate Customizer
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowConfigDrawer(false)}
                    className="text-xs font-bold text-[#2A7C13] hover:underline cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#333333]">Citation Text:</label>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#888888]">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, citation: CITATION_PRESETS.excellence }))}
                        className="px-2 py-0.5 rounded bg-[#F0EFEA] hover:bg-[#E5E5DF] text-[10px] font-medium"
                      >
                        Excellence
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, citation: CITATION_PRESETS.diligence }))}
                        className="px-2 py-0.5 rounded bg-[#F0EFEA] hover:bg-[#E5E5DF] text-[10px] font-medium"
                      >
                        Diligence
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, citation: CITATION_PRESETS.subjectMastery }))}
                        className="px-2 py-0.5 rounded bg-[#F0EFEA] hover:bg-[#E5E5DF] text-[10px] font-medium"
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

                {/* Signatories & Issue Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#333333] block">Signatory 1 Title (Right):</label>
                    <input
                      type="text"
                      value={config.signatory1Title}
                      onChange={(e) => setConfig((c) => ({ ...c, signatory1Title: e.target.value }))}
                      placeholder="The Principal"
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
                      placeholder="Vice Principal"
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
                    <label className="font-bold text-[#333333] block">Date of Issue:</label>
                    <input
                      type="text"
                      value={config.issueDate}
                      onChange={(e) => setConfig((c) => ({ ...c, issueDate: e.target.value }))}
                      className="w-full p-2 rounded-md border border-[#D5CBB2] text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-[#F0EFEA] text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showSchoolLogo}
                      onChange={(e) => setConfig((c) => ({ ...c, showSchoolLogo: e.target.checked }))}
                      className="rounded text-[#2A7C13] focus:ring-0"
                    />
                    <span className="font-medium text-[#333333]">School Crest / Logo</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showNationalHeader}
                      onChange={(e) => setConfig((c) => ({ ...c, showNationalHeader: e.target.checked }))}
                      className="rounded text-[#2A7C13] focus:ring-0"
                    />
                    <span className="font-medium text-[#333333]">Republic of Cameroon Header</span>
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

            {/* Carousel navigation */}
            {filteredRecipients.length > 1 && (
              <div className="w-full max-w-4xl flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="p-1.5 rounded-lg border border-[#D5CBB2] bg-white text-[#333333] hover:bg-[#F0EFEA] disabled:opacity-40 transition-colors cursor-pointer"
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
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative w-48 sm:w-64">
                  <input
                    type="text"
                    placeholder="Search student or class..."
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

            {/* Live Interactive Preview */}
            <div className="w-full flex justify-center">
              {activeRecipient ? (
                renderCertificateItem(activeRecipient)
              ) : (
                <div className="py-16 text-center space-y-2">
                  <Award className="w-10 h-10 text-[#AAAAAA] mx-auto" />
                  <h3 className="font-bold text-[#142010] text-sm">No qualifying students found</h3>
                  <p className="text-xs text-[#666666]">
                    Try adjusting the criteria or sequence filters above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── DEDICATED PRINT PORTAL: Completely isolated from the dashboard and modal ── */}
      {createPortal(
        <div id="certificate-print-portal" className="hidden print:block">
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @media print {
                  @page {
                    size: A4 landscape !important;
                    margin: 0mm !important;
                  }
                  html, body {
                    width: 297mm !important;
                    height: 210mm !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: white !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  body.printing-certificate > *:not(#certificate-print-portal) {
                    display: none !important;
                    visibility: hidden !important;
                  }
                  body.printing-certificate #certificate-print-portal {
                    display: block !important;
                    visibility: visible !important;
                    position: static !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 297mm !important;
                  }
                  .certificate-page {
                    width: 297mm !important;
                    height: 209mm !important;
                    max-width: none !important;
                    max-height: none !important;
                    margin: 0 auto !important;
                    padding: 10mm !important;
                    box-sizing: border-box !important;
                    page-break-after: always !important;
                    break-after: page !important;
                    overflow: hidden !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                }
              `,
            }}
          />

          {isBatchPrinting ? (
            filteredRecipients.map((rec) => (
              <div key={`${rec.studentId}_${rec.awardTitle}_${rec.subjectName || ""}`} className="w-full">
                {renderCertificateItem(rec)}
              </div>
            ))
          ) : activeRecipient ? (
            <div className="w-full">
              {renderCertificateItem(activeRecipient)}
            </div>
          ) : null}
        </div>,
        document.body
      )}
    </>
  );
}
