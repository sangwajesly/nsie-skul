"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Award, 
  LayoutGrid, 
  FileText, 
  Printer, 
  CheckCircle2, 
  ZoomIn, 
  ZoomOut,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { ReportCardRenderer, type ReportCardTemplateType } from "@/components/academic/ReportCardRenderer";
import { SAMPLE_REPORT_CARD_DATA } from "@/lib/academic/sample-report-card-data";

interface TemplateInfo {
  id: ReportCardTemplateType;
  title: string;
  badge: string;
  icon: typeof Award;
  summary: string;
  highlights: string[];
  bestFor: string;
}

const TEMPLATES: TemplateInfo[] = [
  {
    id: "traditional_classic",
    title: "Traditional Numerical System",
    badge: "Familiar & Proven",
    icon: Award,
    summary:
      "A classic Cameroonian score sheet format with Sequence 1 & 2 marks, Term marks, Coefficients, Weighted Totals, Grades (A-F), Class Rankings, and Teacher Remarks, without competency descriptors.",
    highlights: [
      "Sequence 1 & Sequence 2 test scores per subject",
      "Automatic Mark × Coefficient total points calculation",
      "Class Rank, Success Rate, and Principal's Remarks",
      "Guaranteed single-sheet A4 printable document",
    ],
    bestFor: "Secondary grammar schools & institutions preferring concise, numerical evaluation sheets.",
  },
  {
    id: "cba_grouped_classic",
    title: "Grouped Classic CBA (APC)",
    badge: "Recommended Standard",
    icon: LayoutGrid,
    summary:
      "Modern Competency-Based Approach (APC) with subjects grouped cleanly into Sciences, Languages, and Practical/Social clusters with min/max class benchmarks and dual summary matrices.",
    highlights: [
      "Logical subject clusters: Sciences, Languages, Technical/Arts",
      "Min/Max class score benchmarks per subject",
      "Dual academic performance & student conduct matrices",
      "Single-page A4 layout optimized for fast bulk printing",
    ],
    bestFor: "Comprehensive colleges, technical institutions, and modern secondary schools.",
  },
  {
    id: "cba_ministry_standard",
    title: "MINESEC Official CBA Grid",
    badge: "Official Circular Standard",
    icon: FileText,
    summary:
      "Complete official Ministry of Secondary Education circular layout with detailed bulleted competency acquisition descriptors, letter grades, and institutional stamp blocks.",
    highlights: [
      "Bulleted competency objectives evaluated per subject",
      "CBA appreciation scale: Not Acquired, In Process, Acquired, Expert",
      "Official Regional & Divisional Delegation headings",
      "Institutional seal, stamp, and discipline penalty grids",
    ],
    bestFor: "Institutions requiring verbatim alignment with official MINESEC circular templates.",
  },
];

export function ReportCardShowcaseClient() {
  const [activeTemplate, setActiveTemplate] = useState<ReportCardTemplateType>("cba_grouped_classic");
  const [zoomScale, setZoomScale] = useState<number>(0.9);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      document.body.classList.remove("printing-sample-report-card");
    };
  }, []);

  const selectedTemplateInfo = TEMPLATES.find((t) => t.id === activeTemplate) || TEMPLATES[1];

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

  return (
    <>
      <div id="interactive-samples" className="space-y-8 scroll-mt-20">
      {/* Interactive Tabs Header */}
      <div className="bg-white rounded-[12px] border border-[#E8DFC9] p-4 sm:p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8DFC9]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF7E4] text-[#2A7C13] text-[11px] font-bold border border-[#76C457]/40 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Live Preview</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#142010]">
              Explore the 3 MINESEC Layout Templates
            </h3>
            <p className="text-xs sm:text-[13px] text-[#525E4B] mt-0.5">
              Click any template to inspect its exact live rendering. Test the 1-page A4 print layout directly in your browser.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Zoom Slider / Controls */}
            <div className="hidden sm:flex items-center bg-[#F4EFE6] rounded-[6px] border border-[#E8DFC9] px-2 py-1 text-xs text-[#555555]">
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.max(0.65, z - 0.1))}
                className="p-1 hover:text-[#142010] disabled:opacity-40 cursor-pointer"
                disabled={zoomScale <= 0.65}
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] font-semibold min-w-[46px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((z) => Math.min(1.0, z + 0.1))}
                className="p-1 hover:text-[#142010] disabled:opacity-40 cursor-pointer"
                disabled={zoomScale >= 1.0}
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[7px] bg-[#142010] hover:bg-[#20600E] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#76C457]" />
              <span>Test A4 Print</span>
            </button>
          </div>
        </div>

        {/* 3-Way Template Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = activeTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => setActiveTemplate(tmpl.id)}
                className={`p-4 rounded-[10px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#F0FDF4] border-[#2A7C13] shadow-xs ring-1 ring-[#2A7C13]"
                    : "bg-[#FFFDF5] border-[#E8DFC9] hover:bg-[#FFF8CF]/30 hover:border-[#D5CBB2]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isSelected
                          ? "bg-[#2A7C13] text-white"
                          : "bg-[#EFE7D5] text-[#555555]"
                      }`}
                    >
                      {tmpl.badge}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" />
                    )}
                  </div>
                  <h4 className="font-bold text-[14px] text-[#142010] flex items-center gap-1.5 mb-1.5">
                    <Icon className="w-4 h-4 text-[#2A7C13]" />
                    <span>{tmpl.title}</span>
                  </h4>
                  <p className="text-[11.5px] text-[#525E4B] leading-relaxed">
                    {tmpl.summary}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#E8DFC9]/70 text-[11px] font-semibold text-[#2A7C13] flex items-center justify-between">
                  <span>{isSelected ? "Currently Viewing" : "Click to View Layout"}</span>
                  <span>&rarr;</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Template Details Pill */}
        <div className="p-3.5 rounded-[8px] bg-[#FAF8F5] border border-[#E8DFC9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-[#142010]">Recommended For: </span>
            <span className="text-[#525E4B]">{selectedTemplateInfo.bestFor}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#2A7C13] font-semibold shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Guaranteed 1-Page A4 Dimension</span>
          </div>
        </div>
      </div>

      {/* Live Rendered A4 Document Showcase */}
      <div className="bg-[#EAE6DD] rounded-[12px] border border-[#D5CBB2] p-4 sm:p-8 flex justify-center items-start overflow-x-auto shadow-inner">
        <div
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className="w-full max-w-[820px] bg-white rounded-[4px] shadow-xl border border-[#C5BC9F] p-5 sm:p-8 text-[#142010] shrink-0"
        >
          <ReportCardRenderer
            data={SAMPLE_REPORT_CARD_DATA}
            initialTemplate={activeTemplate}
            isTrial={false}
            canPrint={true}
          />
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
