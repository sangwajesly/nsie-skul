"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, LogOut, CheckCircle2 } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";

interface DemoBannerProps {
  schoolName?: string;
}

export function DemoBanner({ schoolName = "Government Bilingual High School (Demo)" }: DemoBannerProps) {
  return (
    <div className="bg-[#142010] text-[#FFFDF5] border-b border-[#2A7C13]/40 px-3 sm:px-4 py-2.5 shadow-xs print:hidden w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-full bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs min-w-0 flex-1">
            <span className="inline-block font-extrabold text-[#86EFAC] uppercase tracking-wider text-[10px] mr-1.5">
              Live Demo Campus
            </span>
            <p className="text-[#E0E7DC] text-[11.5px] sm:text-xs leading-normal break-words mt-0.5">
              You are exploring <strong>{schoolName}</strong>. Sample records are preserved, but you can add marks and test features freely.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pl-8 sm:pl-0">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-all shadow-xs whitespace-nowrap"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-red-900/40 hover:bg-red-900/60 border border-red-500/30 text-red-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              title="Exit demo session and return to school login"
            >
              <LogOut className="w-3 h-3 text-red-300" />
              <span>Exit Demo</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
