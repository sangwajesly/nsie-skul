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
}

export function ReportCardRenderer({
  data,
  initialTemplate,
}: ReportCardRendererProps) {
  // Uses the school's configured report card system set by the administrator
  const template: ReportCardTemplateType =
    initialTemplate ||
    ((data.school.reportCardTemplate as ReportCardTemplateType) || "cba_grouped_classic");

  return (
    <div className="report-card-print-container">
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
