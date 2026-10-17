"use client";

import { Printer } from "lucide-react";

export function PrintReceiptButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs shadow-xs transition-colors"
    >
      <Printer className="w-3.5 h-3.5" />
      <span>Print Official Receipt</span>
    </button>
  );
}
