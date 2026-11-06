"use client";

import { Printer } from "lucide-react";

interface PrintButtonProps {
  studentName?: string;
  matricule?: string;
  termName?: string;
  schoolCode?: string;
}

export function PrintButton({
  studentName,
  matricule,
  termName,
  schoolCode,
}: PrintButtonProps) {
  const handlePrint = () => {
    if (typeof window === "undefined") return;

    const originalTitle = document.title;
    const cleanMatricule = (matricule || "STU").replace(/[^a-zA-Z0-9]/g, "_");
    const cleanName = (studentName || "Student").replace(/[^a-zA-Z0-9]/g, "_");
    const cleanTerm = (termName || "Term").replace(/[^a-zA-Z0-9]/g, "_");
    const code = schoolCode ? `${schoolCode.replace(/[^a-zA-Z0-9]/g, "_")}_` : "";

    document.title = `Report_Card_${code}${cleanMatricule}_${cleanName}_${cleanTerm}`;

    window.print();

    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", restore);
    };

    window.addEventListener("afterprint", restore);
    setTimeout(restore, 2000);
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      title="Print or Save as 1-Page A4 PDF (calibrated to fit on a single sheet)"
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
    >
      <Printer className="w-3.5 h-3.5" />
      <span>Print / Save 1-Page PDF</span>
    </button>
  );
}
