"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, ArrowRight, Eye, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { ReportCardSampleModal } from "@/components/academic/ReportCardSampleModal";
import type { ReportCardTemplateType } from "@/components/academic/ReportCardRenderer";

interface Props {
  headline?: string;
  description?: string;
  ctaText?: string;
  badge?: string;
}

export function InlineProductCallout({
  headline = "Eliminate manual report card calculation errors in your school",
  description = "Nsei Sukul automatically calculates MINESEC CBA competency marks, applies official subject coefficients, breaks class rank ties, and prints 1-page A4 report cards in 1 click.",
  ctaText = "Start 30-Day Free School Pilot",
  badge = "Built for Cameroon Secondary Schools",
}: Props) {
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [template, setTemplate] = useState<ReportCardTemplateType>("cba_grouped_classic");

  return (
    <>
      <div className="my-10 p-5 sm:p-7 rounded-[12px] bg-gradient-to-r from-[#FFFDF5] via-[#F9F7EE] to-[#EAF7E4] border-2 border-[#2A7C13]/30 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF7E4] text-[#1F5C0E] border border-[#76C457]/40 text-[10px] font-bold uppercase tracking-wide">
              <Sparkles className="w-3 h-3 text-[#2A7C13]" />
              <span>{badge}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#142010] leading-snug">
              {headline}
            </h3>
            <p className="text-xs sm:text-[13px] text-[#525E4B] max-w-2xl leading-relaxed">
              {description}
            </p>
          </div>

          <div className="w-12 h-12 rounded-[10px] bg-[#142010] text-[#4ADE80] flex items-center justify-center shrink-0 shadow-xs hidden sm:flex">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs text-[#142010] font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2A7C13] shrink-0" />
            <span>Official MINESEC 6-Seq Grid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2A7C13] shrink-0" />
            <span>Excel 1-Click Marks Import</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2A7C13] shrink-0" />
            <span>Works 100% Offline (LAN Hub)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-xs transition-colors"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => setSampleModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[7px] bg-white hover:bg-[#FAF6EC] text-[#142010] font-semibold text-xs border border-[#D5CBB2] transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>View Interactive Sample Report Card</span>
          </button>
        </div>
      </div>

      {/* Interactive Modal */}
      <ReportCardSampleModal
        isOpen={sampleModalOpen}
        onClose={() => setSampleModalOpen(false)}
        selectedTemplate={template}
        onApplyTemplate={(newTpl) => setTemplate(newTpl)}
      />
    </>
  );
}
