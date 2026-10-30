"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Printer, 
  Check, 
  Award, 
  LayoutGrid, 
  FileText, 
  ZoomIn, 
  ZoomOut,
  Maximize2
} from "lucide-react";
import { ReportCardRenderer, type ReportCardTemplateType } from "./ReportCardRenderer";
import { SAMPLE_REPORT_CARD_DATA } from "@/lib/academic/sample-report-card-data";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplate: ReportCardTemplateType;
  onApplyTemplate: (template: ReportCardTemplateType) => void;
}

const TEMPLATE_METADATA: Record<
  ReportCardTemplateType,
  {
    title: string;
    subtitle: string;
    icon: typeof Award;
    badge: string;
    description: string;
  }
> = {
  traditional_classic: {
    title: "Traditional Numerical System",
    subtitle: "Classic Numerical Grade Sheet",
    icon: Award,
    badge: "Most Familiar",
    description:
      "Traditional score sheet with Sequence 1 & 2 marks, Term averages, Coefficients, Weighted Totals, Letter Grades (A-F), Class Rankings, and Teacher Remarks, without competency descriptors.",
  },
  cba_grouped_classic: {
    title: "Grouped Classic CBA (APC)",
    subtitle: "Grouped Subject Clusters",
    icon: LayoutGrid,
    badge: "Recommended Standard",
    description:
      "Organized into clean subject clusters (Sciences, Languages, Social/Practical) with Sequence marks, Term marks, Coefficients, Class Averages, Min/Max benchmarks, and dual summary/discipline matrices.",
  },
  cba_ministry_standard: {
    title: "MINESEC Official CBA Grid",
    subtitle: "Competency-Based Evaluation",
    icon: FileText,
    badge: "Official Ministry Circular",
    description:
      "Full official MINESEC national syllabus competencies table with bulleted competency objectives evaluated per subject, plus official institutional seals and stamps.",
  },
};

export function ReportCardSampleModal({
  isOpen,
  onClose,
  selectedTemplate: initialTemplate,
  onApplyTemplate,
}: Props) {
  const [activeTemplate, setActiveTemplate] = useState<ReportCardTemplateType>(initialTemplate);
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to beforeprint / afterprint so both "Test Print" button and Ctrl+P isolate only the A4 sheet
  useEffect(() => {
    if (!isOpen) return;

    const handleBeforePrint = () => {
      document.body.classList.add("printing-sample-report-card");
    };
    const handleAfterPrint = () => {
      document.body.classList.remove("printing-sample-report-card");
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      document.body.classList.remove("printing-sample-report-card");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMeta = TEMPLATE_METADATA[activeTemplate];

  const handlePrint = () => {
    document.body.classList.add("printing-sample-report-card");
    const cleanup = () => {
      document.body.classList.remove("printing-sample-report-card");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    requestAnimationFrame(() => {
      window.print();
    });
  };

  const handleApply = () => {
    onApplyTemplate(activeTemplate);
    onClose();
  };

  return (
    <>
      {/* On-screen Interactive Modal (hidden entirely during print) */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in-50 duration-150 print:hidden"
      >
        <div className="bg-[#FAF8F5] border border-[#D5CBB2] rounded-[12px] shadow-2xl w-full max-w-5xl flex flex-col max-h-[94vh] overflow-hidden">
          {/* Modal Header */}
          <div className="p-4 sm:px-6 border-b border-[#E8DFC9] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2A7C13] bg-[#EAF7E4] px-2 py-0.5 rounded border border-[#76C457]/40">
                  A4 Live Template Preview
                </span>
                <span className="text-xs text-[#777777]">·</span>
                <span className="text-xs font-semibold text-[#142010]">
                  {currentMeta.title}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#142010] mt-0.5">
                Official MINESEC Report Card Sample
              </h2>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap print:hidden">
              {/* Zoom Controls */}
              <div className="hidden sm:flex items-center bg-[#F4EFE6] rounded-[6px] border border-[#E8DFC9] px-1 py-0.5 text-xs text-[#555555]">
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.max(0.65, z - 0.1))}
                  className="p-1 hover:text-[#142010] disabled:opacity-40"
                  disabled={zoomScale <= 0.65}
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 font-mono text-[11px] font-medium min-w-[42px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.min(1.0, z + 0.1))}
                  className="p-1 hover:text-[#142010] disabled:opacity-40"
                  disabled={zoomScale >= 1.0}
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#D5CBB2] bg-white hover:bg-[#F9F6ED] text-xs font-semibold text-[#142010] transition-colors shadow-2xs"
                title="Test A4 print layout"
              >
                <Printer className="w-3.5 h-3.5 text-[#2A7C13]" />
                <span className="hidden sm:inline">Test Print</span>
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-all shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Select This Layout</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-[6px] text-[#777777] hover:text-[#142010] hover:bg-[#EAE5D9] transition-colors"
                title="Close Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Template Switcher Bar */}
          <div className="bg-[#F8F5EE] border-b border-[#E8DFC9] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {(
                [
                  "traditional_classic",
                  "cba_grouped_classic",
                  "cba_ministry_standard",
                ] as ReportCardTemplateType[]
              ).map((t) => {
                const meta = TEMPLATE_METADATA[t];
                const Icon = meta.icon;
                const isActive = activeTemplate === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTemplate(t)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[#2A7C13] text-white shadow-xs ring-1 ring-[#2A7C13]"
                        : "bg-white text-[#555555] border border-[#D5CBB2] hover:bg-[#F4EFE6] hover:text-[#142010]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">{meta.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-1.5 shrink-0">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#2A7C13] bg-[#EAF7E4] px-2.5 py-1 rounded border border-[#76C457]/40 whitespace-nowrap">
                {currentMeta.badge}
              </span>
            </div>
          </div>

          {/* Template Details Helper Banner */}
          <div className="bg-[#FAF8F2] border-b border-[#E8DFC9]/70 px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs shrink-0 print:hidden">
            <p className="text-[11.5px] text-[#555555] leading-snug">
              <strong className="text-[#142010] font-semibold">Format Overview: </strong>
              {currentMeta.description}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2A7C13] bg-[#EAF7E4] px-2 py-0.5 rounded border border-[#76C457]/40 whitespace-nowrap shrink-0 md:hidden">
              {currentMeta.badge}
            </span>
          </div>

          {/* Scrollable Preview Body (Simulated A4 Paper) */}
          <div className="flex-1 overflow-y-auto overflow-x-auto p-2 sm:p-6 bg-[#EBE7DF] flex justify-center items-start">
            <div
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease-out",
              }}
              className="w-full max-w-[820px] bg-white rounded-[4px] shadow-lg border border-[#C5BC9F] p-4 sm:p-6 text-[#142010]"
            >
              <ReportCardRenderer
                data={SAMPLE_REPORT_CARD_DATA}
                initialTemplate={activeTemplate}
                isTrial={false}
                canPrint={true}
              />
            </div>
          </div>

          {/* Footer Notice */}
          <div className="px-4 py-2 bg-white border-t border-[#E8DFC9] flex items-center justify-between text-[11px] text-[#788470] shrink-0 print:hidden">
            <span>
              Demonstration using standard 9-subject Cameroonian Form 4 curriculum.
            </span>
            <span className="font-semibold text-[#2A7C13]">
              100% Guaranteed 1-Page A4 Print Layout
            </span>
          </div>
        </div>
      </div>

      {/* Pure Print Portal (Mounted directly to <body> so window.print prints ONLY this clean A4 sheet) */}
      {mounted &&
        createPortal(
          <div
            id="sample-report-card-print-target"
            className="hidden print:block bg-white text-black p-0 m-0"
          >
            <ReportCardRenderer
              data={SAMPLE_REPORT_CARD_DATA}
              initialTemplate={activeTemplate}
              isTrial={false}
              canPrint={true}
            />
          </div>,
          document.body
        )}
    </>
  );
}

export default ReportCardSampleModal;
