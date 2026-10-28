"use client";

import React from "react";
import { ReportCardFullData } from "@/lib/academic/report-card-service";
import { MinesecReportCard } from "./MinesecReportCard";
import { GroupedClassicReportCard } from "./GroupedClassicReportCard";
import { TraditionalReportCard } from "./TraditionalReportCard";

export type ReportCardTemplateType =
  | "cba_grouped_classic"
  | "cba_ministry_standard"
  | "traditional_classic";

interface ReportCardRendererProps {
  data: ReportCardFullData;
  initialTemplate?: ReportCardTemplateType;
  canPrint?: boolean;
  isTrial?: boolean;
}

export function ReportCardRenderer({
  data,
  initialTemplate,
  isTrial,
}: ReportCardRendererProps) {
  // Uses the school's configured report card system set by the administrator
  const template: ReportCardTemplateType =
    initialTemplate ||
    ((data.school.reportCardTemplate as ReportCardTemplateType) || "cba_grouped_classic");

  return (
    <div className="report-card-print-container relative overflow-hidden">
      {isTrial && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-20 select-none print:flex"
          aria-hidden="true"
        >
          <div className="transform -rotate-35 text-[#9CA3AF]/40 text-4xl sm:text-6xl font-black uppercase tracking-widest whitespace-nowrap border-4 border-[#9CA3AF]/40 px-6 sm:px-10 py-3 sm:py-4 rounded-xl select-none print:text-neutral-400/40 print:border-neutral-400/40">
            TRIAL EVALUATION COPY
          </div>
        </div>
      )}
      {template === "traditional_classic" ? (
        <TraditionalReportCard data={data} />
      ) : template === "cba_grouped_classic" ? (
        <GroupedClassicReportCard data={data} />
      ) : (
        <MinesecReportCard data={data} />
      )}
    </div>
  );
}
