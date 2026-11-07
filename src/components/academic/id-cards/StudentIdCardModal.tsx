"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sliders,
  RotateCw,
  Search,
  Filter,
  Check,
  CreditCard,
  Palette,
  Layers,
  Sparkles,
} from "lucide-react";
import type {
  StudentIdCardData,
  IdCardConfig,
  IdCardTemplate,
  IdCardColorPreset,
} from "./types";
import { COLOR_PRESETS } from "./types";
import { StudentIdCardItem } from "./StudentIdCardItem";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: StudentIdCardData[];
  initialStudentIndex?: number;
  classStreams?: Array<{ id: string; name: string }>;
  selectedStreamId?: string;
  onStreamChange?: (streamId: string) => void;
}

export function StudentIdCardModal({
  isOpen,
  onClose,
  students,
  initialStudentIndex = 0,
  classStreams = [],
  selectedStreamId,
  onStreamChange,
}: Props) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(initialStudentIndex);
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [selectedClassId, setSelectedClassId] = useState<string>(selectedStreamId || "");

  // Configuration state with 3 templates, color themes, and print layouts
  const [config, setConfig] = useState<IdCardConfig>({
    template: "classic",
    colorPreset: "forest",
    customColor: "#142010",
    printLayout: "front_only",
    showEmergencyContact: true,
    showBarcode: true,
    showQRCode: true,
    issueDate: new Date().toLocaleDateString("en-GB"),
    expiryDate: "31/07/2026",
    signatoryTitle: "The Principal / Le Proviseur",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync external selectedStreamId when provided
  useEffect(() => {
    if (selectedStreamId !== undefined) {
      setSelectedClassId(selectedStreamId);
    }
  }, [selectedStreamId]);

  // Reset index when search or stream filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchQuery, selectedClassId]);

  // Filter students by selected class stream AND search query
  const filteredStudents = useMemo(() => {
    let result = students;

    if (selectedClassId) {
      result = result.filter((s) => {
        if (s.classStreamId) {
          return s.classStreamId === selectedClassId;
        }
        return false;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.matricule.toLowerCase().includes(q) ||
          s.fullClassName.toLowerCase().includes(q)
      );
    }

    return result;
  }, [students, selectedClassId, searchQuery]);

  const activeStudent = filteredStudents[currentIndex] || filteredStudents[0];

  // Helper: compute clean, smart document title for PDF saving / printing
  const generateSmartTitle = (mode: "single" | "batch"): string => {
    if (mode === "single" && activeStudent) {
      const cleanMatricule = (activeStudent.matricule || "STU").replace(/[^a-zA-Z0-9]/g, "_");
      const cleanName = (activeStudent.fullName || "Student").replace(/[^a-zA-Z0-9]/g, "_");
      return `ID_Card_${cleanMatricule}_${cleanName}`;
    }

    const schoolCode =
      activeStudent?.schoolCode ||
      (activeStudent?.schoolName ? activeStudent.schoolName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() : "SCH");
    
    let classLabel = "All_Classes";
    if (selectedClassId) {
      const stream = classStreams.find((s) => s.id === selectedClassId);
      if (stream?.name) {
        classLabel = stream.name.replace(/[^a-zA-Z0-9]/g, "_");
      }
    }

    const academicYear = (activeStudent?.academicYearName || "2026-2027").replace(/[^a-zA-Z0-9]/g, "-");
    const layoutLabel = config.printLayout === "front_only" ? "Fronts" : config.printLayout === "back_only" ? "Backs" : "Duplex";

    return `ID_Cards_${schoolCode}_${classLabel}_${layoutLabel}_${academicYear}`;
  };

  // Trigger print with smart filename and complete DOM print isolation
  const handlePrint = (mode: "single" | "batch") => {
    if (typeof window === "undefined") return;

    const originalTitle = document.title;
    const smartTitle = generateSmartTitle(mode);
    document.title = smartTitle;

    document.body.classList.add("is-printing-id-cards");
    if (mode === "single") {
      document.body.classList.add("print-single-only");
    } else {
      document.body.classList.remove("print-single-only");
    }

    // Small delay to ensure browser applies classes before spooling
    setTimeout(() => {
      window.print();

      const restore = () => {
        document.title = originalTitle;
        document.body.classList.remove("is-printing-id-cards");
        document.body.classList.remove("print-single-only");
        window.removeEventListener("afterprint", restore);
      };

      window.addEventListener("afterprint", restore);
      setTimeout(restore, 2000);
    }, 150);
  };

  if (!isOpen) return null;

  // Split students into chunks of 8 per A4 sheet
  const studentChunks: StudentIdCardData[][] = [];
  for (let i = 0; i < filteredStudents.length; i += 8) {
    studentChunks.push(filteredStudents.slice(i, i + 8));
  }

  return (
    <>
      {/* ── MODAL UI (Hidden during print) ───────────────────────────────── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto print:hidden">
        <div className="relative w-full max-w-5xl bg-[#FAF9F5] border border-[#E5E5DF] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
          
          {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
          <div className="bg-white border-b border-[#E8DFC9] px-4 py-3 flex items-center justify-between gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EAF7E4] text-[#166534] border border-[#BBF7D0] flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#142010] flex items-center gap-2">
                  <span>Student Identity Cards</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                    Cartes d&apos;Identite Scolaire
                  </span>
                </h2>
                <p className="text-[11px] text-[#666666]">
                  CR80 badges with QR verification, barcode, and print isolation
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  showConfig
                    ? "bg-[#2A7C13] text-white border-[#2A7C13]"
                    : "bg-white text-[#333333] border-[#D5CBB2] hover:bg-[#F9F6ED]"
                }`}
                title="Configure dates, signatory, and field visibility"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Options</span>
              </button>

              {/* Print Single Card */}
              <button
                type="button"
                onClick={() => handlePrint("single")}
                disabled={!activeStudent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-[#142010] border border-[#D5CBB2] hover:bg-[#F9F6ED] shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Prints active student card with crop marks"
              >
                <Printer className="w-3.5 h-3.5 text-[#555555]" />
                <span>Print This Card</span>
              </button>

              {/* Batch Print (8 per page) */}
              <button
                type="button"
                onClick={() => handlePrint("batch")}
                disabled={filteredStudents.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black bg-[#2A7C13] hover:bg-[#20600E] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Prints 8 cards per A4 page without background webpage"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Batch Print ({filteredStudents.length})</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#666666] hover:text-[#111827] hover:bg-gray-100 transition-colors ml-1 cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── CONTROL ROW 1: Template Selector & Print Layout ─────────────── */}
          <div className="bg-[#FAF8F5] border-b border-[#E8DFC9] px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap shrink-0 text-xs">
            {/* Template Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#2A7C13]" /> Template:
              </span>
              <div className="inline-flex rounded-lg border border-[#D5CBB2] p-0.5 bg-white">
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, template: "classic" }))}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    config.template === "classic"
                      ? "bg-[#2A7C13] text-white shadow-2xs"
                      : "text-[#666666] hover:text-[#111827]"
                  }`}
                  title="Traditional Cameroon secondary badge with bilingual Republic header & barcode"
                >
                  Classic Academic
                </button>
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, template: "modern" }))}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    config.template === "modern"
                      ? "bg-[#2A7C13] text-white shadow-2xs"
                      : "text-[#666666] hover:text-[#111827]"
                  }`}
                  title="Prestige institutional badge with FRONT QR code for front-only schools"
                >
                  Modern Prestige (Front QR)
                </button>
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, template: "compact" }))}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    config.template === "compact"
                      ? "bg-[#2A7C13] text-white shadow-2xs"
                      : "text-[#666666] hover:text-[#111827]"
                  }`}
                  title="Clean two-column minimalist layout for maximum ink savings"
                >
                  Compact Ink-Saver
                </button>
              </div>
            </div>

            {/* Print Layout: Front Only vs Front & Back */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666] flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#2A7C13]" /> Sides:
              </span>
              <div className="inline-flex rounded-lg border border-[#D5CBB2] p-0.5 bg-white">
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, printLayout: "front_only" }))}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    config.printLayout === "front_only"
                      ? "bg-[#2A7C13] text-white shadow-2xs"
                      : "text-[#666666] hover:text-[#111827]"
                  }`}
                  title="Most Cameroon schools print front only to minimize card production cost"
                >
                  Front Only (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, printLayout: "front_and_back" }))}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    config.printLayout === "front_and_back"
                      ? "bg-[#2A7C13] text-white shadow-2xs"
                      : "text-[#666666] hover:text-[#111827]"
                  }`}
                  title="Prints fronts then backs for duplex printers or two-sided lamination"
                >
                  Front &amp; Back (Duplex)
                </button>
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, printLayout: "back_only" }))}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    config.printLayout === "back_only"
                      ? "bg-[#2A7C13] text-white shadow-2xs"
                      : "text-[#666666] hover:text-[#111827]"
                  }`}
                  title="Prints only the back side with institutional rules and verification QR"
                >
                  Back Only
                </button>
              </div>
            </div>
          </div>

          {/* ── CONTROL ROW 2: Class Filter & Color Theme Swatches ───────────── */}
          <div className="bg-[#FAF8F5] border-b border-[#E8DFC9] px-4 py-2 flex items-center justify-between gap-3 flex-wrap shrink-0 text-xs">
            {/* Class Stream filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666] flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#2A7C13]" /> Class Stream:
              </span>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedClassId(val);
                  if (onStreamChange) onStreamChange(val);
                }}
                className="px-2.5 py-1 rounded-md bg-white border border-[#D5CBB2] text-xs font-bold text-[#142010] focus:outline-none"
              >
                <option value="">
                  All Classes ({students.length} students)
                </option>
                {classStreams.map((s) => {
                  const count = students.filter((st) => st.classStreamId === s.id).length;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Color Theme Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#666666] flex items-center gap-1">
                <Palette className="w-3 h-3 text-[#2A7C13]" /> Color:
              </span>
              <div className="flex items-center gap-1.5 bg-white border border-[#D5CBB2] rounded-lg p-1">
                {(
                  [
                    { id: "forest", name: "Forest", hex: "#142010" },
                    { id: "navy", name: "Navy", hex: "#0F2942" },
                    { id: "maroon", name: "Maroon", hex: "#4A0E17" },
                    { id: "purple", name: "Purple", hex: "#2E1065" },
                    { id: "slate", name: "Slate", hex: "#0F172A" },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, colorPreset: c.id }))}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                      config.colorPreset === c.id ? "scale-115 ring-2 ring-offset-1 ring-[#142010]" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {config.colorPreset === c.id && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}

                {/* Custom Color Input */}
                <label
                  className={`relative w-5 h-5 rounded-full cursor-pointer flex items-center justify-center border border-dashed border-[#888888] ${
                    config.colorPreset === "custom" ? "scale-115 ring-2 ring-offset-1 ring-[#142010]" : ""
                  }`}
                  style={{
                    backgroundColor: config.colorPreset === "custom" ? config.customColor : "transparent",
                  }}
                  title="Pick custom school brand color"
                >
                  <input
                    type="color"
                    value={config.customColor || "#142010"}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        colorPreset: "custom",
                        customColor: e.target.value,
                      }))
                    }
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                  {config.colorPreset === "custom" ? (
                    <Check className="w-3 h-3 text-white" />
                  ) : (
                    <span className="text-[9px] font-black text-[#555555]">+</span>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* ── MAIN CONTENT: Single Card Interactive Preview ───────────────── */}
          <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-start">
            
            {/* Options Drawer */}
            {showConfig && (
              <div className="w-full max-w-xl mb-4 bg-white border border-[#D5CBB2] rounded-xl p-4 shadow-sm space-y-3 text-xs">
                <h3 className="font-extrabold text-[#142010] border-b border-[#F0EFEA] pb-1.5 flex items-center justify-between">
                  <span>Card Customization Settings</span>
                  <span className="text-[10px] text-[#777777]">Applied to all student cards</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-[#333333] block">Expiry Date:</label>
                    <input
                      type="text"
                      value={config.expiryDate}
                      onChange={(e) => setConfig((c) => ({ ...c, expiryDate: e.target.value }))}
                      placeholder="31/07/2026"
                      className="w-full p-2 rounded-md border border-[#D5CBB2] text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#333333] block">Signatory Title:</label>
                    <input
                      type="text"
                      value={config.signatoryTitle}
                      onChange={(e) => setConfig((c) => ({ ...c, signatoryTitle: e.target.value }))}
                      placeholder="The Principal / Le Proviseur"
                      className="w-full p-2 rounded-md border border-[#D5CBB2] text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-[#F0EFEA] text-[11px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showBarcode}
                      onChange={(e) => setConfig((c) => ({ ...c, showBarcode: e.target.checked }))}
                      className="rounded text-[#2A7C13]"
                    />
                    <span>Show Barcode</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showQRCode}
                      onChange={(e) => setConfig((c) => ({ ...c, showQRCode: e.target.checked }))}
                      className="rounded text-[#2A7C13]"
                    />
                    <span>Show QR Code</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showEmergencyContact}
                      onChange={(e) => setConfig((c) => ({ ...c, showEmergencyContact: e.target.checked }))}
                      className="rounded text-[#2A7C13]"
                    />
                    <span>Show Emergency Phone</span>
                  </label>
                </div>
              </div>
            )}

            {/* Single Student Carousel Navigator */}
            {filteredStudents.length > 0 && (
              <div className="w-full max-w-xl flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="p-1.5 rounded-lg border border-[#D5CBB2] bg-white text-[#333333] hover:bg-[#F0EFEA] disabled:opacity-40 transition-colors cursor-pointer"
                    title="Previous Student"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-bold text-[#142010]">
                    Student <strong>{currentIndex + 1}</strong> of <strong>{filteredStudents.length}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.min(filteredStudents.length - 1, prev + 1))}
                    disabled={currentIndex >= filteredStudents.length - 1}
                    className="p-1.5 rounded-lg border border-[#D5CBB2] bg-white text-[#333333] hover:bg-[#F0EFEA] disabled:opacity-40 transition-colors cursor-pointer"
                    title="Next Student"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Search */}
                <div className="relative w-48">
                  <input
                    type="text"
                    placeholder="Search in this view..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-2.5 py-1 text-xs rounded-md border border-[#D5CBB2] bg-white focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-[#888888] absolute left-2 top-2" />
                </div>
              </div>
            )}

            {/* Interactive Card Preview */}
            {activeStudent ? (
              <div className="flex flex-col items-center gap-3 my-auto">
                <div className="transform hover:scale-101 transition-transform duration-200 shadow-md rounded-[5px]">
                  <StudentIdCardItem
                    data={activeStudent}
                    config={config}
                    side={config.printLayout === "back_only" ? "back" : activeSide}
                  />
                </div>

                {config.printLayout !== "back_only" && (
                  <div className="flex items-center gap-2 text-xs text-[#666666]">
                    <button
                      type="button"
                      onClick={() => setActiveSide(activeSide === "front" ? "back" : "front")}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D5CBB2] text-[#142010] hover:bg-[#FAF8F5] transition-colors cursor-pointer font-bold shadow-2xs"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-[#2A7C13]" />
                      <span>
                        Flip to {activeSide === "front" ? "Back Side" : "Front Side"} Preview
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#666666]">
                No students match the selected filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PORTAL FOR PRINT ISOLATION (Mounted directly on document.body) ─ */}
      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div id="id-cards-print-portal" aria-hidden="true">
            <style
              dangerouslySetInnerHTML={{
                __html: `
                @media screen {
                  #id-cards-print-portal {
                    display: none !important;
                  }
                }
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 6mm;
                  }
                  html, body {
                    background: #ffffff !important;
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  /* Completely hide the rest of the application tree */
                  body.is-printing-id-cards > *:not(#id-cards-print-portal) {
                    display: none !important;
                  }
                  #id-cards-print-portal {
                    display: block !important;
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                  }
                  /* Toggle between single card print and batch print targets */
                  body.print-single-only .batch-cards-print-target {
                    display: none !important;
                  }
                  body:not(.print-single-only) .single-card-print-target {
                    display: none !important;
                  }
                  .print-page-break {
                    page-break-after: always !important;
                    break-after: page !important;
                  }
                  .print-page-break:last-child {
                    page-break-after: avoid !important;
                    break-after: avoid !important;
                  }
                }
              `,
              }}
            />

            {/* SINGLE CARD PRINT VIEW */}
            <div className="single-card-print-target">
              {activeStudent && (
                <div
                  className="print-page-break flex flex-col items-center justify-center"
                  style={{
                    width: "210mm",
                    minHeight: "285mm",
                    boxSizing: "border-box",
                    paddingTop: "25mm",
                  }}
                >
                  <div className="border border-dashed border-gray-400 p-[2mm] rounded-[6px]">
                    <StudentIdCardItem
                      data={activeStudent}
                      config={config}
                      side={config.printLayout === "back_only" ? "back" : "front"}
                    />
                  </div>

                  {config.printLayout === "front_and_back" && (
                    <div className="border border-dashed border-gray-400 p-[2mm] rounded-[6px] mt-6">
                      <StudentIdCardItem data={activeStudent} config={config} side="back" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BATCH PRINT VIEW (8 Cards per A4 Page) */}
            <div className="batch-cards-print-target">
              {studentChunks.map((chunk, chunkIdx) => {
                const showFronts = config.printLayout === "front_only" || config.printLayout === "front_and_back";
                const showBacks = config.printLayout === "back_only" || config.printLayout === "front_and_back";

                return (
                  <React.Fragment key={`chunk-${chunkIdx}`}>
                    {/* Front sheet of 8 cards */}
                    {showFronts && (
                      <div
                        className="print-page-break grid grid-cols-2 gap-[3mm] p-[4mm] mx-auto box-border"
                        style={{
                          width: "210mm",
                          height: "285mm",
                          boxSizing: "border-box",
                        }}
                      >
                        {chunk.map((st) => (
                          <div
                            key={`front-${st.studentId}`}
                            className="border border-dashed border-gray-300 p-[1.5mm] flex items-center justify-center rounded-[5px]"
                          >
                            <StudentIdCardItem data={st} config={config} side="front" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Back sheet of 8 cards (mirrored columns for double-sided flip alignment) */}
                    {showBacks && (
                      <div
                        className="print-page-break grid grid-cols-2 gap-[3mm] p-[4mm] mx-auto box-border"
                        style={{
                          width: "210mm",
                          height: "285mm",
                          boxSizing: "border-box",
                        }}
                      >
                        {chunk.map((st) => (
                          <div
                            key={`back-${st.studentId}`}
                            className="border border-dashed border-gray-300 p-[1.5mm] flex items-center justify-center rounded-[5px]"
                          >
                            <StudentIdCardItem data={st} config={config} side="back" />
                          </div>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
