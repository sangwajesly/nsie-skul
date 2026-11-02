import React from "react";
import { BookOpen, CheckCircle2, FileSpreadsheet, ClipboardCheck, Wallet, ShieldCheck, Scale, Award } from "lucide-react";

interface Props {
  type: "report-card" | "excel-error" | "logbook-inspection" | "fee-collection";
  className?: string;
  isHero?: boolean;
}

/**
 * Editorial Article Visual Cover
 * Clean, high-contrast, human design without AI-style floating spheres or blur effects.
 */
export function BlogVisualCover({ type, className = "", isHero = false }: Props) {
  const containerClasses = `relative w-full overflow-hidden flex items-center justify-center select-none bg-[#FAF8F2] border border-[#E8DFC9] ${
    isHero ? "h-56 sm:h-72 md:h-80 rounded-[10px]" : "h-44 sm:h-52 rounded-[8px]"
  } ${className}`;

  if (type === "report-card") {
    return (
      <div className={containerClasses}>
        <div className="w-11/12 max-w-[440px] bg-white rounded-[8px] shadow-sm border border-[#D5CBB2] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2A7C13]" />
              <span className="text-xs font-bold text-[#142010]">MINESEC Report Card Guide</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#EAF7E4] text-[#166534] border border-[#BBF7D0]">
              CBA 20/20 SCALE
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-[#FAF8F2] border border-[#E8DFC9]">
              <span className="font-semibold text-[#142010]">Mathematics (Coef 4)</span>
              <span className="font-mono font-bold text-[#142010]">16.5 / 20</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#F0FDF4] text-[#166534] font-bold border border-[#BBF7D0]">
                Expert (Acquis)
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#FAF8F2] border border-[#E8DFC9]">
              <span className="font-semibold text-[#142010]">English Language (Coef 3)</span>
              <span className="font-mono font-bold text-[#142010]">14.0 / 20</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#F0FDF4] text-[#166534] font-bold border border-[#BBF7D0]">
                Acquis
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#525E4B] pt-1">
            <span>Deliberation: <strong>Tableau d&apos;Honneur</strong></span>
            <span className="font-bold text-[#2A7C13] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>MINESEC Standard</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "excel-error") {
    return (
      <div className={containerClasses}>
        <div className="w-11/12 max-w-[440px] bg-white rounded-[8px] shadow-sm border border-[#D5CBB2] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#2A7C13]" />
              <span className="text-xs font-bold text-[#142010]">Class Council Spreadsheet Errors</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Checklist
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-[#FAF8F2] border border-[#E8DFC9]">
              <span className="text-[#142010]">Student #01 · Form 4</span>
              <span className="text-[#142010] font-bold">14.85 / 20</span>
              <span className="text-[10px] text-[#166534] font-bold">Rank: 1st</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-red-50 border border-red-200">
              <span className="text-red-900 font-sans">Student #02 · Absent mark</span>
              <span className="text-red-700 line-through font-bold">#DIV/0!</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-red-700 font-bold border border-red-200">
                Fix: Use ABS flag
              </span>
            </div>
          </div>

          <div className="text-[11px] text-[#525E4B] pt-1 flex items-center justify-between">
            <span>Automated Coefficient Calculations</span>
            <span className="font-bold text-[#2A7C13]">Zero Formula Errors</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "logbook-inspection") {
    return (
      <div className={containerClasses}>
        <div className="w-11/12 max-w-[440px] bg-white rounded-[8px] shadow-sm border border-[#D5CBB2] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#2A7C13]" />
              <span className="text-xs font-bold text-[#142010]">Cahier de Texte Inspection</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF7E4] text-[#166534] border border-[#BBF7D0]">
              Official Checklist
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 p-2 rounded bg-[#FAF8F2] border border-[#E8DFC9]">
              <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
              <span className="text-[#142010] font-medium">Scheme of Work matches term dates &amp; sequence</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-[#FAF8F2] border border-[#E8DFC9]">
              <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
              <span className="text-[#142010] font-medium">Weekly teacher signature &amp; lesson objectives recorded</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-[#FAF8F2] border border-[#E8DFC9]">
              <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
              <span className="text-[#142010] font-medium">Evaluations recorded with marks and return dates</span>
            </div>
          </div>

          <div className="text-[11px] text-[#525E4B] pt-1 flex items-center justify-between">
            <span>Pedagogic Inspection Audit</span>
            <span className="font-bold text-[#2A7C13]">Compliant</span>
          </div>
        </div>
      </div>
    );
  }

  // fee-collection
  return (
    <div className={containerClasses}>
      <div className="w-11/12 max-w-[440px] bg-white rounded-[8px] shadow-sm border border-[#D5CBB2] p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#2A7C13]" />
            <span className="text-xs font-bold text-[#142010]">School Fee Collection</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            Instant Receipts
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-[#FAF8F2] border border-[#E8DFC9]">
            <span className="font-semibold text-[#142010]">Tuition Installment #1</span>
            <span className="font-mono font-bold text-[#2A7C13]">45,000 FCFA</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#F0FDF4] text-[#166534] font-bold border border-[#BBF7D0]">
              Printed Receipt
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-[#FAF8F2] border border-[#E8DFC9]">
            <span className="font-semibold text-[#142010]">Tuition Installment #2</span>
            <span className="font-mono font-bold text-[#525E4B]">30,000 FCFA</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
              Pending
            </span>
          </div>
        </div>

        <div className="text-[11px] text-[#525E4B] pt-1 flex items-center justify-between">
          <span>Official Bursary Ledger</span>
          <span className="font-bold text-[#2A7C13]">Zero Cash Leaks</span>
        </div>
      </div>
    </div>
  );
}

export default BlogVisualCover;
