"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Printer,
  X,
  Loader2,
  AlertCircle,
  GraduationCap,
  Calendar,
  Award,
  Building,
  User,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getStudentFullTranscriptAction,
  StudentFullTranscriptData,
  TranscriptYearRecord,
} from "@/app/academics/actions";

interface Props {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentTranscriptModal({ studentId, isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<StudentFullTranscriptData | null>(null);
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !studentId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    getStudentFullTranscriptAction(studentId)
      .then((res) => {
        if (!isMounted) return;
        if (res.error) {
          setError(res.error);
        } else if (res.data) {
          setTranscript(res.data);
          // By default expand all years
          const initialExpanded: Record<string, boolean> = {};
          res.data.years.forEach((yr) => {
            initialExpanded[yr.academicYearId] = true;
          });
          setExpandedYears(initialExpanded);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load academic transcript.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, studentId]);

  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove("nsei-print-portal-active");
    };
    window.addEventListener("afterprint", cleanup);
    return () => {
      window.removeEventListener("afterprint", cleanup);
      document.body.classList.remove("nsei-print-portal-active");
    };
  }, []);

  if (!isOpen) return null;

  const handlePrint = () => {
    document.body.classList.add("nsei-print-portal-active");
    requestAnimationFrame(() => {
      window.print();
    });
  };

  const toggleYear = (yearId: string) => {
    setExpandedYears((prev) => ({
      ...prev,
      [yearId]: !prev[yearId],
    }));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 overflow-y-auto print:hidden">
      {/* Container - NO BLUR */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[8px] bg-white border border-[#D5CBB2] shadow-2xl overflow-hidden">
        {/* Screen Header (Excluded from Print) */}
        <div className="print:hidden flex items-center justify-between px-5 py-3.5 bg-[#FAF8F2] border-b border-[#E8DFC9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#2A7C13] text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#142010]">
                Official Academic Transcript (Relevé de Notes)
              </h2>
              <p className="text-[11px] text-[#555555]">
                Multi-year ministerial transcript and academic progression record
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || Boolean(error)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold bg-[#2A7C13] hover:bg-[#20600E] text-white transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[6px] text-[#666666] hover:text-[#191919] hover:bg-black/5 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#FAF8F2]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#666666] space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#2A7C13]" />
              <p className="text-xs font-medium">Generating official cumulative transcript...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-[8px] bg-[#FFF0F0] border border-[#FCA5A5] text-[#991B1B] space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold">Transcript Unavailable</h3>
              </div>
              <p className="text-xs leading-relaxed">{error}</p>
            </div>
          ) : !transcript ? (
            <div className="text-center py-12 text-[#666666] text-xs">
              No transcript records available for this student.
            </div>
          ) : (
            /* Printable Document Body */
            <TranscriptBody
              transcript={transcript}
              expandedYears={expandedYears}
              toggleYear={toggleYear}
              isPrint={false}
            />
          )}
        </div>

        {/* Modal Footer (Screen only) */}
        <div className="print:hidden flex items-center justify-between px-5 py-3 bg-[#FAF8F2] border-t border-[#E8DFC9] text-xs">
          <span className="text-[11px] text-[#666666]">
            Print format: Standard A4. Margins are automatically handled for print.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[6px] border border-[#D5D5CF] bg-white hover:bg-[#FAFAF8] text-[#191919] font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    {/* ── PRINT PORTAL (Mounted to document.body, isolated from screen) ── */}
    {typeof document !== "undefined" && transcript && createPortal(
      <div id="nsei-print-portal" className="hidden print:block bg-white text-black p-6 font-sans max-w-4xl mx-auto">
        <TranscriptBody
          transcript={transcript}
          expandedYears={{}}
          toggleYear={() => {}}
          isPrint={true}
        />
      </div>,
      document.body
    )}
  </>
  );
}

function TranscriptBody({
  transcript,
  expandedYears,
  toggleYear,
  isPrint,
}: {
  transcript: StudentFullTranscriptData;
  expandedYears: Record<string, boolean>;
  toggleYear: (yearId: string) => void;
  isPrint: boolean;
}) {
  return (
    <div
      id={isPrint ? "print-transcript-content" : "screen-transcript-content"}
      className="bg-white p-6 sm:p-8 rounded-[6px] border border-[#D5CBB2] text-[#191919] print:border-none print:p-0 print:shadow-none space-y-6 max-w-3xl mx-auto"
    >
      {/* 1. Official Cameroon Ministerial Header */}
      <div className="border-b-2 border-[#191919] pb-4">
        <div className="grid grid-cols-2 text-center text-[9px] sm:text-[10px] font-bold uppercase tracking-tight text-[#333333] leading-tight">
          <div>
            <p>République du Cameroun</p>
            <p className="font-normal italic normal-case text-[8.5px]">Paix - Travail - Patrie</p>
            <p className="mt-1">Ministère des Enseignements Secondaires</p>
            <p className="text-[#2A7C13] font-extrabold">{transcript.school.name}</p>
          </div>
          <div>
            <p>Republic of Cameroon</p>
            <p className="font-normal italic normal-case text-[8.5px]">Peace - Work - Fatherland</p>
            <p className="mt-1">Ministry of Secondary Education</p>
            <p className="text-[#2A7C13] font-extrabold">Code: {transcript.school.code}</p>
          </div>
        </div>

        <div className="text-center mt-4 pt-3 border-t border-[#E5E5DF]">
          <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-[#191919]">
            Official Cumulative Academic Transcript
          </h1>
          <p className="text-[11px] font-semibold text-[#555555] uppercase tracking-wider">
            Relevé Officiel de Notes et Parcours Scolaire
          </p>
          <p className="text-[9.5px] text-[#777777] italic mt-0.5">
            Subsystem: {transcript.school.subsystem.toUpperCase()} | Motto: &ldquo;{transcript.school.motto}&rdquo;
          </p>
        </div>
      </div>

      {/* 2. Student Identification Roster */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] text-xs">
        <div>
          <span className="block text-[10px] font-bold uppercase text-[#777777]">Student Name</span>
          <span className="font-extrabold text-[#191919]">{transcript.student.fullName}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-[#777777]">Matricule / ID</span>
          <span className="font-mono font-bold text-[#2A7C13]">{transcript.student.matricule}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-[#777777]">Gender</span>
          <span className="font-semibold">{transcript.student.gender === "M" ? "Male (M)" : "Female (F)"}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-[#777777]">Date of Birth</span>
          <span className="font-semibold">{transcript.student.dateOfBirth || "N/A"}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-[#777777]">Place of Birth</span>
          <span className="font-semibold">{transcript.student.placeOfBirth || "N/A"}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-[#777777]">Current Status</span>
          <span className="capitalize font-bold text-[#191919]">{transcript.student.status}</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-[#777777]">Years Completed</span>
          <span className="font-bold text-[#191919]">{transcript.totalYearsCompleted} Academic Year(s)</span>
        </div>
        <div>
          <span className="block text-[10px] font-bold uppercase text-[#777777]">Issue Date</span>
          <span className="font-semibold">{transcript.issuedAt}</span>
        </div>
      </div>

      {/* 3. Multi-Year Academic Progression */}
      <div className="space-y-6">
        {transcript.years.length === 0 ? (
          <p className="text-xs text-[#777777] italic text-center py-4">
            No completed terms or assessment marks recorded yet.
          </p>
        ) : (
          transcript.years.map((year) => {
            const isExpanded = isPrint ? true : (expandedYears[year.academicYearId] ?? true);
            return (
              <div
                key={year.academicYearId}
                className="rounded-[6px] border border-[#D5CBB2] overflow-hidden break-inside-avoid"
              >
                {/* Academic Year Header Bar */}
                <div
                  onClick={() => !isPrint && toggleYear(year.academicYearId)}
                  className={`flex items-center justify-between px-3.5 py-2.5 bg-[#F4EFE6] border-b border-[#D5CBB2] ${isPrint ? "" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#191919] text-white font-mono text-[11px] font-bold">
                      {year.academicYearName}
                    </span>
                    <span className="text-xs font-extrabold text-[#191919]">
                      {year.className} ({year.classStreamName})
                    </span>
                    {year.isRepeater && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                        Repeater (Redoublant)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-[11px]">
                      <span className="text-[#666666]">Annual Average: </span>
                      <strong className="text-[#2A7C13] font-mono text-xs">
                        {year.annualAverage !== null ? `${year.annualAverage.toFixed(2)}/20` : "N/A"}
                      </strong>
                      <span className="text-[#777777] ml-2">
                        (Rank: {year.classRank}/{year.totalClassEnrolment})
                      </span>
                    </div>
                    {!isPrint && (
                      <button
                        type="button"
                        className="print:hidden text-[#666666] hover:text-[#191919]"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Subject Breakdown Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-[#FAF8F2] border-b border-[#E8DFC9] text-[10px] font-bold text-[#555555] uppercase">
                          <th className="py-1.5 px-3">Subject</th>
                          <th className="py-1.5 px-2 text-center w-12">Coef</th>
                          <th className="py-1.5 px-2 text-center w-14">Term 1</th>
                          <th className="py-1.5 px-2 text-center w-14">Term 2</th>
                          <th className="py-1.5 px-2 text-center w-14">Term 3</th>
                          <th className="py-1.5 px-2 text-center w-16 bg-[#F4EFE6] font-extrabold text-[#191919]">Annual</th>
                          <th className="py-1.5 px-2 text-center w-16">Points</th>
                          <th className="py-1.5 px-3 text-left">Appreciation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8DFC9]">
                        {year.subjects.map((sub) => (
                          <tr key={sub.subjectId} className="hover:bg-[#FFFDF9]">
                            <td className="py-1.5 px-3 font-medium text-[#191919]">
                              {sub.subjectName}
                              <span className="text-[9.5px] font-mono text-[#777777] ml-1">({sub.subjectCode})</span>
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono font-semibold">{sub.coefficient}</td>
                            <td className="py-1.5 px-2 text-center font-mono">
                              {sub.term1Average !== null ? sub.term1Average.toFixed(1) : "-"}
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono">
                              {sub.term2Average !== null ? sub.term2Average.toFixed(1) : "-"}
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono">
                              {sub.term3Average !== null ? sub.term3Average.toFixed(1) : "-"}
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono font-bold bg-[#F4EFE6] text-[#191919]">
                              {sub.annualAverage !== null ? sub.annualAverage.toFixed(2) : "-"}
                            </td>
                            <td className="py-1.5 px-2 text-center font-mono text-[#555555]">
                              {sub.weightedPoints !== null ? sub.weightedPoints.toFixed(2) : "-"}
                            </td>
                            <td className="py-1.5 px-3 text-[10px] text-[#555555] italic">
                              {sub.appreciation}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Year Summary Row */}
                      <tfoot>
                        <tr className="bg-[#FAF8F2] border-t-2 border-[#D5CBB2] text-[11px] font-bold text-[#191919]">
                          <td className="py-2 px-3 uppercase">Year Totals &amp; Standing</td>
                          <td className="py-2 px-2 text-center font-mono">{year.totalCoefficients}</td>
                          <td colSpan={3} className="py-2 px-2 text-center text-[10px] text-[#666666]">
                            Weighted Points: {year.totalWeightedPoints.toFixed(2)}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-black text-[#2A7C13] bg-[#EAF7E4] border border-[#76C457]/40">
                            {year.annualAverage !== null ? `${year.annualAverage.toFixed(2)}/20` : "-"}
                          </td>
                          <td colSpan={2} className="py-2 px-3 text-right">
                            <span className="text-[10px] font-bold uppercase text-[#555555] mr-1">Decision:</span>
                            <span className="font-extrabold text-[#191919]">{year.councilDecision}</span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Overall Cumulative Performance Summary */}
      <div className="p-4 rounded-[6px] bg-[#FAF8F2] border-2 border-[#D5CBB2] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8DFC9] pb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#191919]">
              Cumulative Academic Performance (Bilan Global)
            </h3>
            <p className="text-[10.5px] text-[#666666]">
              Weighted progression across all enrolled academic sessions at this institution
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-[#777777] block">Cumulative GPA</span>
              <span className="text-base font-black font-mono text-[#2A7C13]">
                {transcript.cumulativeGPA !== null ? `${transcript.cumulativeGPA.toFixed(2)} / 20.00` : "N/A"}
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-[4px] bg-[#EAF7E4] border border-[#76C457]/40 text-[#2A7C13] text-[11px] font-bold">
              {transcript.overallAppreciation}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-[#666666] leading-relaxed pt-1">
          <strong>Notice of Authenticity:</strong> This transcript is an official record of the student&apos;s academic standing at {transcript.school.name}. It is valid only when embossed with the school seal and signed by the Principal or authorized administrative officer.
        </div>
      </div>

      {/* 5. Principal Certification & Stamp Block */}
      <div className="grid grid-cols-2 gap-8 pt-6 border-t border-[#D5CBB2] text-xs">
        <div>
          <p className="text-[10px] font-bold uppercase text-[#777777]">Certified Accurate By:</p>
          <p className="font-bold text-[#191919] mt-1">Dean of Studies / Academic Registrar</p>
          <p className="text-[10px] text-[#666666] mt-8">Date: ________________________</p>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-bold uppercase text-[#777777]">Principal / Head of Institution</p>
          <p className="font-bold text-[#191919] mt-1">Signature &amp; Official School Stamp</p>
          <div className="w-28 h-20 border border-dashed border-[#B4A895] rounded-[4px] ml-auto mt-2 flex items-center justify-center text-[9px] text-[#888888]">
            Official Seal
          </div>
        </div>
      </div>
    </div>
  );
}
