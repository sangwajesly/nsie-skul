import React from "react";

export function ReportCardMarketingFooter() {
  return (
    <div className="pt-1.5 mt-1 border-t border-zinc-200 w-full flex flex-row items-center justify-between flex-nowrap whitespace-nowrap gap-2 text-[7px] sm:text-[7.5px] print:text-[6.8px] leading-none text-zinc-500 font-mono select-none overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0 truncate">
        <span>Generated with</span>
        <strong className="text-zinc-800 font-bold">Nsei Sukul · Management Systems</strong>
        <span className="text-zinc-400 hidden sm:inline print:inline">•</span>
        <span className="text-zinc-500 hidden sm:inline print:inline truncate">Cameroon Secondary Education</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 text-right">
        <span>Web: <strong className="text-zinc-700">nsei-sukul.klarifypath.com</strong></span>
        <span className="text-zinc-400">•</span>
        <span>WhatsApp: <strong className="text-zinc-800 font-bold">+237 682 833 601</strong></span>
      </div>
    </div>
  );
}
