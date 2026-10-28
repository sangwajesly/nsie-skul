import React from "react";

export function ReportCardMarketingFooter() {
  return (
    <div className="pt-2 mt-1 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-1 text-[7.5px] sm:text-[8px] text-zinc-500 font-mono">
      <div>
        <span>Generated with </span>
        <strong className="text-zinc-800">NSEI School Management System</strong>
        <span className="hidden sm:inline"> &bull; Cameroon Secondary Education Platform</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <span>Web: <strong className="text-zinc-700">nsei-skul.klarifypath.com</strong></span>
        <span>Inquiries &amp; School Setup: <strong className="text-zinc-800 font-bold">+237 682 833 601</strong></span>
      </div>
    </div>
  );
}
