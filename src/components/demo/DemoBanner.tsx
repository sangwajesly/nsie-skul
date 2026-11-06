"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, LogOut, CheckCircle2 } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";

interface DemoBannerProps {
  schoolName?: string;
}

export function DemoBanner({ schoolName = "Government Bilingual High School (Demo)" }: DemoBannerProps) {
  return (
    <div className="bg-[#142010] text-[#FFFDF5] border-b border-[#2A7C13]/40 px-4 py-2.5 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs min-w-0">
            <span className="font-extrabold text-[#86EFAC] uppercase tracking-wider text-[10px] mr-1.5">
              Live Demo Campus
            </span>
            <span className="text-[#E0E7DC] truncate">
              You are exploring <strong>{schoolName}</strong>. Sample records are protected from deletion, but you can add new marks, students, and receipts freely.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>Start Your School&apos;s Free Trial</span>
            <ArrowRight className="w-3 h-3" />
          </Link>

          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[5px] bg-white/10 hover:bg-white/20 text-[#E0E7DC] text-xs font-medium transition-colors cursor-pointer"
              title="Exit demo session"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Exit Demo</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
