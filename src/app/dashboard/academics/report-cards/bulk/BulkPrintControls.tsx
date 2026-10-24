"use client";

import Link from "next/link";
import { Printer, ArrowLeft, FileText, CheckCircle2 } from "lucide-react";

interface Props {
  classNameTitle: string;
  termName: string;
  studentCount: number;
  classStreamId: string;
  termNumber: number;
}

export function BulkPrintControls({
  classNameTitle,
  termName,
  studentCount,
  classStreamId,
  termNumber,
}: Props) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print:hidden sticky top-3 z-30 mb-6 bg-white/95 backdrop-blur-md border border-[#E8DFC9] rounded-[10px] p-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/academics/report-cards?classStreamId=${classStreamId}&termNumber=${termNumber}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] hover:bg-[#F5F5F0] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Class Roster</span>
          </Link>
          <div className="h-4 w-px bg-[#E8DFC9] hidden sm:block" />
          <div>
            <h1 className="text-sm font-extrabold text-[#142010]">
              {classNameTitle} · {termName}
            </h1>
            <p className="text-[11px] text-[#525E4B]">
              <strong>{studentCount}</strong> report cards ready for batch export
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save All as Single PDF</span>
          </button>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#F5EFE0] flex flex-wrap items-center justify-between text-[11px] text-[#788470]">
        <div className="flex items-center gap-1.5 text-[#2A7C13]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Each report card starts automatically on a fresh page (A4 Portrait).</span>
        </div>
        <div className="text-[11px] text-[#525E4B] italic">
          To export a single PDF file: in the print window, set <strong>Destination</strong> to <strong>&ldquo;Save as PDF&rdquo;</strong>.
        </div>
      </div>
    </div>
  );
}
