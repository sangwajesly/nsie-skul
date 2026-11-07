"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Printer, Award, FileSpreadsheet } from "lucide-react";
import type { AcademicAnalyticsData } from "@/lib/academic/analytics-service";

interface Props {
  data: AcademicAnalyticsData;
  isOpen: boolean;
  onClose: () => void;
}

export function HonorRollRosterModal({ data, isOpen, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const afterPrint = () => {
      document.body.classList.remove("printing-roster-active");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("afterprint", afterPrint);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("afterprint", afterPrint);
      document.body.classList.remove("printing-roster-active");
    };
  }, [isOpen, onClose]);

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    const originalTitle = document.title;
    const schoolCode =
      schoolInfo.code ||
      schoolInfo.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() ||
      "SCH";
    const cleanSeq = (selectedSequenceName || "Sequence").replace(/[^a-zA-Z0-9]/g, "_");
    const cleanYear = (academicYearName || "2026-2027").replace(/[^a-zA-Z0-9]/g, "-");

    document.title = `Honor_Roll_Roster_${schoolCode}_${cleanSeq}_${cleanYear}`;
    document.body.classList.add("printing-roster-active");

    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        const cleanup = () => {
          document.title = originalTitle;
          document.body.classList.remove("printing-roster-active");
          window.removeEventListener("afterprint", cleanup);
        };
        window.addEventListener("afterprint", cleanup);
        setTimeout(cleanup, 2000);
      }, 100);
    });
  };

  if (!isOpen || !mounted) return null;

  const { schoolInfo, academicYearName, selectedSequenceName, overallKpis, dux, topStudents, classPerformance, subjectLaureates } = data;

  const schoolInitials = (schoolInfo.name || "NS")
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const renderRosterDocument = () => (
    <div className="roster-print-sheet w-full max-w-[210mm] mx-auto bg-white text-[#111827] p-6 sm:p-8 font-serif select-none">
      {/* ── Official Republic & School Header ───────────────────────────────── */}
      <div className="grid grid-cols-3 items-center text-center text-[9px] sm:text-[10px] leading-tight border-b-2 border-[#142010] pb-3">
        {/* Left: National Header */}
        <div className="text-left font-serif space-y-0.5">
          <p className="font-extrabold tracking-wider text-[#142010] uppercase">
            Republic of Cameroon
          </p>
          <p className="italic text-[#555555]">Peace – Work – Fatherland</p>
          <p className="font-semibold text-[#333333] text-[8.5px]">
            Ministry of Secondary Education
          </p>
        </div>

        {/* Center: School Emblem */}
        <div className="flex flex-col items-center justify-center">
          {schoolInfo.logoUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={schoolInfo.logoUrl}
              alt={schoolInfo.name}
              onError={() => setImgError(true)}
              className="w-12 h-12 object-contain rounded-full border border-[#2A7C13] p-0.5 bg-white"
            />
          ) : (
            <div className="w-12 h-12 rounded-full border-2 border-[#2A7C13] bg-[#EAF7E4] flex flex-col items-center justify-center text-[#166534]">
              <span className="text-[10px] font-black font-sans tracking-tight">
                {schoolInitials}
              </span>
            </div>
          )}
        </div>

        {/* Right: Bilingual Republic Header */}
        <div className="text-right font-serif space-y-0.5">
          <p className="font-extrabold tracking-wider text-[#142010] uppercase">
            République du Cameroun
          </p>
          <p className="italic text-[#555555]">Paix – Travail – Patrie</p>
          <p className="font-semibold text-[#333333] text-[8.5px]">
            Ministère des Enseignements Secondaires
          </p>
        </div>
      </div>

      {/* School Name & Document Title Banner */}
      <div className="text-center space-y-1 pt-3 pb-3 border-b border-[#E5E5DF]">
        <h1 className="text-lg sm:text-xl font-black uppercase tracking-wide text-[#142010]">
          {schoolInfo.name}
        </h1>
        {schoolInfo.motto && (
          <p className="text-[11px] italic text-[#555555]">
            &laquo; {schoolInfo.motto} &raquo;
          </p>
        )}
        <div className="inline-block mt-1 px-4 py-1 rounded bg-[#F8F9FA] border border-[#D5CBB2]">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#142010] font-sans">
            Official Roll of Honour &amp; Academic Merit Roster
          </h2>
          <p className="text-[10px] text-[#555555] font-sans font-medium">
            Academic Year: <strong>{academicYearName}</strong> · Evaluation: <strong>{selectedSequenceName}</strong>
          </p>
        </div>
      </div>

      {/* Statistical Summary Strip */}
      <div className="grid grid-cols-4 gap-2 my-3 text-center text-xs font-sans">
        <div className="p-2 rounded bg-[#F9FAFB] border border-[#E5E7EB]">
          <span className="text-[9px] uppercase font-bold text-[#6B7280] block">Evaluated</span>
          <strong className="text-sm text-[#111827]">{overallKpis.totalStudentsEvaluated} Students</strong>
        </div>
        <div className="p-2 rounded bg-[#F0FDF4] border border-[#BBF7D0]">
          <span className="text-[9px] uppercase font-bold text-[#166534] block">Pass Rate</span>
          <strong className="text-sm text-[#15803D]">{overallKpis.passRate}% ({overallKpis.passedCount})</strong>
        </div>
        <div className="p-2 rounded bg-[#F9FAFB] border border-[#E5E7EB]">
          <span className="text-[9px] uppercase font-bold text-[#6B7280] block">Class Average</span>
          <strong className="text-sm text-[#111827]">{overallKpis.overallAverage.toFixed(2)} / 20</strong>
        </div>
        <div className="p-2 rounded bg-[#FFFBEB] border border-[#FDE68A]">
          <span className="text-[9px] uppercase font-bold text-[#92400E] block">On Roll of Honour</span>
          <strong className="text-sm text-[#B45309]">{overallKpis.honorsCount} Laureates</strong>
        </div>
      </div>

      {/* ── SECTION 1: INSTITUTIONAL PODIUM (TOP SCHOLARS) ─────────────────── */}
      <div className="my-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#142010] font-sans border-b border-[#142010] pb-1 mb-2 flex items-center justify-between">
          <span>1. School-Wide Laureates &amp; School Dux</span>
          <span className="text-[9px] font-normal text-[#555555]">Highest averages across institution</span>
        </h3>
        <table className="w-full text-left text-xs font-sans border-collapse">
          <thead>
            <tr className="bg-[#F3F4F6] border-y border-[#D1D5DB] text-[10px] font-bold uppercase text-[#374151]">
              <th className="py-1.5 px-2">Position</th>
              <th className="py-1.5 px-2">Student Name</th>
              <th className="py-1.5 px-2">Matricule</th>
              <th className="py-1.5 px-2">Class Stream</th>
              <th className="py-1.5 px-2 text-right">Average / 20</th>
              <th className="py-1.5 px-2 text-right">Commendation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {topStudents.slice(0, 3).map((st, i) => (
              <tr key={st.studentId} className={i === 0 ? "bg-[#FEFCE8] font-bold" : ""}>
                <td className="py-1.5 px-2">
                  {i === 0 ? "School Dux (1st)" : i === 1 ? "2nd Position" : "3rd Position"}
                </td>
                <td className="py-1.5 px-2 font-bold text-[#111827]">{st.name}</td>
                <td className="py-1.5 px-2 font-mono text-[10px] text-[#4B5563]">{st.matricule}</td>
                <td className="py-1.5 px-2 text-[#374151]">{st.fullClassName || st.className}</td>
                <td className="py-1.5 px-2 text-right font-mono font-bold text-[#15803D]">
                  {st.average.toFixed(2)}
                </td>
                <td className="py-1.5 px-2 text-right text-[10px] font-semibold text-[#166534]">
                  {st.appreciation.split("(")[0].trim()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── SECTION 2: CLASS-BY-CLASS ROLL OF HONOUR ───────────────────────── */}
      <div className="my-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#142010] font-sans border-b border-[#142010] pb-1 mb-2 flex items-center justify-between">
          <span>2. Class Stream Roll of Honour (Top 3 per Class Group)</span>
          <span className="text-[9px] font-normal text-[#555555]">Class council rankings</span>
        </h3>
        <div className="space-y-3">
          {classPerformance.map((cls) => (
            <div key={cls.classStreamId} className="border border-[#E5E7EB] rounded overflow-hidden">
              <div className="bg-[#F9FAFB] px-2.5 py-1 flex items-center justify-between text-[11px] font-sans font-bold border-b border-[#E5E7EB]">
                <span className="text-[#142010]">{cls.fullClassName}</span>
                <span className="text-[10px] text-[#555555] font-normal">
                  Pass Rate: <strong>{cls.passRate}%</strong> · Class Avg: <strong>{cls.classAverage.toFixed(2)}/20</strong>
                </span>
              </div>
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-white border-b border-[#F3F4F6] text-[9.5px] font-bold uppercase text-[#6B7280]">
                    <th className="py-1 px-2 w-16">Rank</th>
                    <th className="py-1 px-2">Student Name</th>
                    <th className="py-1 px-2">Matricule</th>
                    <th className="py-1 px-2 text-right">Average / 20</th>
                    <th className="py-1 px-2 text-right">Commendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {cls.top3.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-1.5 px-2 text-center text-[#9CA3AF] italic text-[10px]">
                        No marks recorded for this stream
                      </td>
                    </tr>
                  ) : (
                    cls.top3.map((st, i) => (
                      <tr key={st.studentId}>
                        <td className="py-1 px-2 font-bold text-[#374151]">
                          {i === 1 ? "2nd" : i === 2 ? "3rd" : "1st"}
                        </td>
                        <td className="py-1 px-2 font-semibold text-[#111827]">{st.name}</td>
                        <td className="py-1 px-2 font-mono text-[10px] text-[#6B7280]">{st.matricule}</td>
                        <td className="py-1 px-2 text-right font-mono font-bold text-[#15803D]">
                          {st.average.toFixed(2)}
                        </td>
                        <td className="py-1 px-2 text-right text-[10px] text-[#166534]">
                          {st.appreciation.split("(")[0].trim()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: SUBJECT LAUREATES ───────────────────────────────────── */}
      {subjectLaureates.length > 0 && (
        <div className="my-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#142010] font-sans border-b border-[#142010] pb-1 mb-2 flex items-center justify-between">
            <span>3. Subject Champions (Highest Score in Discipline)</span>
            <span className="text-[9px] font-normal text-[#555555]">{subjectLaureates.length} subjects</span>
          </h3>
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-[#F3F4F6] border-y border-[#D1D5DB] text-[10px] font-bold uppercase text-[#374151]">
                <th className="py-1.5 px-2">Subject</th>
                <th className="py-1.5 px-2">Student Laureate</th>
                <th className="py-1.5 px-2">Matricule</th>
                <th className="py-1.5 px-2">Class</th>
                <th className="py-1.5 px-2 text-right">Highest Mark / 20</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {subjectLaureates.map((sub) => (
                <tr key={sub.subjectId}>
                  <td className="py-1.5 px-2 font-bold text-[#111827]">{sub.subjectName}</td>
                  <td className="py-1.5 px-2 text-[#111827]">{sub.studentName}</td>
                  <td className="py-1.5 px-2 font-mono text-[10px] text-[#6B7280]">{sub.studentMatricule}</td>
                  <td className="py-1.5 px-2 text-[#374151]">{sub.className}</td>
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-[#15803D]">
                    {sub.bestMark.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── FOOTER: DUAL SIGNATORIES & STAMP ───────────────────────────────── */}
      <div className="pt-6 mt-6 border-t-2 border-[#142010] font-sans text-xs">
        <div className="grid grid-cols-3 items-end text-center">
          <div>
            <p className="font-bold text-[#111827]">Vice Principal / Dean of Studies</p>
            <div className="w-36 h-12 border-b border-dashed border-[#9CA3AF] mx-auto mt-2" />
            <p className="text-[8px] uppercase tracking-wider text-[#9CA3AF] mt-1">Signature &amp; Date</p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#9CA3AF] flex items-center justify-center text-[9px] text-[#9CA3AF] uppercase text-center p-2 leading-tight">
              Official School Stamp
            </div>
          </div>

          <div>
            <p className="font-bold text-[#111827]">The Principal</p>
            <div className="w-36 h-12 border-b border-dashed border-[#9CA3AF] mx-auto mt-2" />
            <p className="text-[8px] uppercase tracking-wider text-[#9CA3AF] mt-1">Signature &amp; Date</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── ON-SCREEN INTERACTIVE PREVIEW MODAL (HIDDEN DURING PRINT) ────────── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 overflow-y-auto print:hidden">
        <div className="relative w-full max-w-4xl bg-white border border-[#E5E5DF] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
          {/* Header */}
          <div className="bg-white border-b border-[#E8DFC9] px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#142010]">
                  Official Roll of Honour Roster (Print Preview)
                </h2>
                <p className="text-[11px] text-[#666666]">
                  Notice Board &amp; Assembly Official Document · A4 Portrait Format
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#2A7C13] hover:bg-[#20600E] text-white shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Roster</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#666666] hover:text-[#111827] hover:bg-gray-100 transition-colors ml-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Document Preview Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F3F4F6] flex justify-center">
            <div className="shadow-lg border border-[#E5E7EB] bg-white rounded-sm w-full max-w-[210mm]">
              {renderRosterDocument()}
            </div>
          </div>
        </div>
      </div>

      {/* ── DEDICATED PRINT PORTAL (ONLY THIS PRINTS) ───────────────────────── */}
      {createPortal(
        <div id="roster-print-portal" className="hidden print:block">
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @media print {
                  @page {
                    size: A4 portrait !important;
                    margin: 8mm !important;
                  }
                  html, body {
                    width: 210mm !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: white !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  body.printing-roster-active > *:not(#roster-print-portal) {
                    display: none !important;
                    visibility: hidden !important;
                  }
                  body.printing-roster-active #roster-print-portal {
                    display: block !important;
                    visibility: visible !important;
                    position: static !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                  }
                  .roster-print-sheet {
                    width: 100% !important;
                    max-width: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    border: none !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                }
              `,
            }}
          />
          {renderRosterDocument()}
        </div>,
        document.body
      )}
    </>
  );
}
