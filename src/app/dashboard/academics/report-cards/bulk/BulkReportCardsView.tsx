"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ReportCardFullData } from "@/lib/academic/report-card-service";
import { MinesecReportCard } from "@/components/academic/MinesecReportCard";
import { GroupedClassicReportCard } from "@/components/academic/GroupedClassicReportCard";
import { TraditionalReportCard } from "@/components/academic/TraditionalReportCard";
import { ReportCardTemplateType } from "@/components/academic/ReportCardRenderer";
import { ReportCardMarketingFooter } from "@/components/academic/ReportCardMarketingFooter";
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  Award,
  ArrowDownAZ,
  Users,
} from "lucide-react";

interface Props {
  reportCards: ReportCardFullData[];
  classNameTitle: string;
  termName: string;
  classStreamId: string;
  termNumber: number;
  initialSortBy?: "rank" | "alphabetical";
  initialTemplate?: ReportCardTemplateType;
  isTrial?: boolean;
}

export function BulkReportCardsView({
  reportCards,
  classNameTitle,
  termName,
  classStreamId,
  termNumber,
  initialSortBy = "rank",
  initialTemplate,
  isTrial,
}: Props) {
  const template: ReportCardTemplateType =
    initialTemplate ||
    ((reportCards[0]?.school?.reportCardTemplate as ReportCardTemplateType) || "cba_grouped_classic");
  const [sortBy, setSortBy] = useState<"rank" | "alphabetical">(initialSortBy);

  const sortedReportCards = useMemo(() => {
    const list = [...reportCards];
    if (sortBy === "rank") {
      return list.sort((a, b) => {
        const rankA = a.summary.rank ?? 9999;
        const rankB = b.summary.rank ?? 9999;
        if (rankA !== rankB) return rankA - rankB;
        return a.student.fullName.localeCompare(b.student.fullName);
      });
    } else {
      return list.sort((a, b) => {
        return a.student.fullName.localeCompare(b.student.fullName);
      });
    }
  }, [reportCards, sortBy]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Floating Control Toolbar (Hidden during actual print) */}
      <div className="print:hidden sticky top-3 z-30 mb-6 bg-white/95 backdrop-blur-md border border-[#E8DFC9] rounded-[10px] p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                <strong>{reportCards.length}</strong> report cards ready for batch export
              </p>
            </div>
          </div>

          {/* Sort & Print Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Toggle Group */}
            <div className="inline-flex items-center gap-1 bg-[#F4EFE0] p-1 rounded-[6px] border border-[#D5CBB2] text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666] px-1.5">
                Sort:
              </span>
              <button
                type="button"
                onClick={() => setSortBy("rank")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] font-semibold text-xs transition-colors cursor-pointer ${
                  sortBy === "rank"
                    ? "bg-[#2A7C13] text-white shadow-2xs"
                    : "text-[#555555] hover:text-[#191919] hover:bg-white/60"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>By Rank</span>
              </button>
              <button
                type="button"
                onClick={() => setSortBy("alphabetical")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] font-semibold text-xs transition-colors cursor-pointer ${
                  sortBy === "alphabetical"
                    ? "bg-[#2A7C13] text-white shadow-2xs"
                    : "text-[#555555] hover:text-[#191919] hover:bg-white/60"
                }`}
              >
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>A → Z</span>
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Informative Footer */}
        <div className="pt-2.5 border-t border-[#F5EFE0] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#788470]">
          <div className="flex items-center gap-1.5 text-[#2A7C13]">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>
              {sortBy === "rank"
                ? "PDF pages sorted by academic merit: Page 1 will be 1st rank."
                : "PDF pages sorted alphabetically by surname (A to Z) for roll call distribution."}
            </span>
          </div>
          <div className="text-[11px] text-[#525E4B] italic">
            To export as single PDF: Set print destination to <strong>&ldquo;Save as PDF&rdquo;</strong>.
          </div>
        </div>
      </div>

      {/* Rendered List of Report Cards */}
      {sortedReportCards.length === 0 ? (
        <div className="p-12 text-center rounded-[8px] bg-white border border-[#E8DFC9] space-y-3">
          <Users className="w-8 h-8 text-[#888888] mx-auto" />
          <h2 className="text-sm font-bold text-[#142010]">No Enrolled Students Found</h2>
          <p className="text-xs text-[#525E4B] max-w-sm mx-auto">
            There are currently no active students enrolled in {classNameTitle}.
          </p>
          <Link
            href={`/dashboard/academics/report-cards?classStreamId=${classStreamId}&termNumber=${termNumber}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#F5F5F0] text-xs font-semibold border border-[#D5D5CF]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Report Cards Hub</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-8 print:space-y-0">
          {sortedReportCards.map((rc) => (
            <div
              key={rc.student.id}
              className="report-card-print-sheet relative overflow-hidden bg-white rounded-[8px] shadow-sm border border-[#E8DFC9] p-4 sm:p-6 print:p-0 print:border-none print:shadow-none"
            >
              {isTrial && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-20 select-none print:flex"
                  aria-hidden="true"
                >
                  <div className="transform -rotate-35 text-[#9CA3AF]/40 border-4 border-[#9CA3AF]/40 px-6 sm:px-10 py-3 sm:py-4 rounded-xl select-none print:text-neutral-400/40 print:border-neutral-400/40 text-center">
                    <div className="text-3xl sm:text-5xl font-black uppercase tracking-widest whitespace-nowrap">
                      TRIAL EVALUATION COPY
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold tracking-wider mt-1 uppercase text-neutral-500/70 print:text-neutral-500/60">
                      NSEI School Management System
                    </div>
                  </div>
                </div>
              )}
              {template === "traditional_classic" ? (
                <TraditionalReportCard data={rc} />
              ) : template === "cba_grouped_classic" ? (
                <GroupedClassicReportCard data={rc} />
              ) : (
                <MinesecReportCard data={rc} />
              )}
              <ReportCardMarketingFooter />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
