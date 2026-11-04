"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, Building2, HelpCircle } from "lucide-react";

interface SchoolOption {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  motto: string | null;
}

interface PrintableIntakeSheetClientProps {
  schools: SchoolOption[];
  selectedSchool: SchoolOption;
  classesList: string[];
  subjectsList: string[];
}

export function PrintableIntakeSheetClient({
  schools,
  selectedSchool: initialSchool,
  classesList,
  subjectsList,
}: PrintableIntakeSheetClientProps) {
  const [selectedSchool, setSelectedSchool] = useState<SchoolOption>(initialSchool);
  const [rowCount, setRowCount] = useState<number>(20);

  const handleSchoolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = schools.find((s) => s.id === e.target.value);
    if (found) setSelectedSchool(found);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* ── TOP ACTION BAR (Hidden when printing) ── */}
      <div className="print:hidden bg-white border border-[#E8DFC9] p-4 rounded-[10px] mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/dashboard/schools"
            className="p-2 rounded-[6px] hover:bg-[#F5F5F0] text-[#555555] hover:text-[#142010] flex items-center gap-1.5 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Schools Hub</span>
          </Link>

          <div className="h-4 w-px bg-[#E0E0D8]" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#666666] font-medium">School:</span>
            <select
              value={selectedSchool.id}
              onChange={handleSchoolChange}
              className="px-2.5 py-1.5 text-xs rounded-[6px] border border-[#D5CBB2] bg-[#FFFDF5] text-[#142010] font-semibold focus:outline-none focus:border-[#2A7C13]"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#666666] font-medium">Rows:</span>
            <select
              value={rowCount}
              onChange={(e) => setRowCount(Number(e.target.value))}
              className="px-2 py-1.5 text-xs rounded-[6px] border border-[#D5CBB2] bg-[#FFFDF5] text-[#142010] font-semibold focus:outline-none focus:border-[#2A7C13]"
            >
              <option value={15}>15 Teachers</option>
              <option value={20}>20 Teachers</option>
              <option value={25}>25 Teachers</option>
              <option value={30}>30 Teachers</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print A4 Staffroom Form</span>
          </button>
        </div>
      </div>

      {/* ── PRINTABLE A4 SHEET CONTENT ── */}
      <div className="bg-white p-6 sm:p-8 rounded-[8px] border border-[#D5CBB2] shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 max-w-[297mm] mx-auto text-[#142010]">
        {/* Cameroon Official Header */}
        <div className="flex items-start justify-between text-center pb-3 border-b-2 border-[#142010]">
          {/* Anglophone side */}
          <div className="w-[30%] text-[10px] leading-tight font-serif uppercase tracking-tight">
            <div className="font-bold">REPUBLIC OF CAMEROON</div>
            <div className="italic text-[9px] lowercase font-sans">Peace - Work - Fatherland</div>
            <div className="mt-1 font-semibold text-[9px]">MINISTRY OF SECONDARY EDUCATION</div>
            <div className="text-[9px]">REGIONAL DELEGATION</div>
          </div>

          {/* School Center Logo / Name */}
          <div className="flex-1 px-4 text-center">
            <h1 className="text-base sm:text-lg font-black tracking-tight uppercase leading-tight font-serif">
              {selectedSchool.name}
            </h1>
            {selectedSchool.code && (
              <div className="text-[11px] font-mono font-bold tracking-wider mt-0.5">
                CODE / ACRONYM: {selectedSchool.code}
              </div>
            )}
            {selectedSchool.motto && (
              <div className="text-[10px] italic font-serif text-[#444444] mt-0.5">
                &ldquo;{selectedSchool.motto}&rdquo;
              </div>
            )}
            {selectedSchool.address && (
              <div className="text-[10px] text-[#555555]">
                {selectedSchool.address}
              </div>
            )}
          </div>

          {/* Francophone side */}
          <div className="w-[30%] text-[10px] leading-tight font-serif uppercase tracking-tight">
            <div className="font-bold">RÉPUBLIQUE DU CAMEROUN</div>
            <div className="italic text-[9px] lowercase font-sans">Paix - Travail - Patrie</div>
            <div className="mt-1 font-semibold text-[9px]">MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES</div>
            <div className="text-[9px]">DÉLÉGATION RÉGIONALE</div>
          </div>
        </div>

        {/* Title Bar */}
        <div className="text-center my-3 py-1.5 bg-[#F5F5F0] border-y border-[#142010]">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider">
            TEACHER DATA INTAKE & SUBJECT ALLOCATION REGISTER
          </h2>
          <div className="text-[10px] font-semibold text-[#555555] mt-0.5">
            Academic Year 2026/2027 • For Marks Entry & Report Card Generation
          </div>
        </div>

        {/* Instructions Box for Staff Room */}
        <div className="p-2.5 rounded-[4px] border border-[#142010] bg-[#FFFDF8] text-[10px] leading-relaxed mb-3 space-y-1">
          <div className="font-bold uppercase tracking-wider text-[#142010]">
            Notice for Subject Teachers & Class Masters:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <div>
              1. <strong>Full Name & Phone:</strong> Write your name in block letters and provide your active <strong>WhatsApp number</strong> (used to receive your secure 1-click login link).
            </div>
            <div>
              2. <strong>Class Master:</strong> If appointed as Class Master (Form Tutor), tick [X] and write your class stream (e.g. <em>Form 3A</em> or <em>4ème B</em>).
            </div>
            <div className="col-span-full pt-0.5">
              3. <strong>Subjects & Classes:</strong> List all subjects you teach. For each subject, specify the class stream and coefficient.
              <br />
              <span className="italic text-[#444444]">
                Example: Mathematics &rarr; Form 1A (Coeff 4), Form 2B (Coeff 4), Form 4 (Coeff 5) | Physics &rarr; Form 3 (Coeff 3)
              </span>
            </div>
          </div>

          {/* Quick reference of existing classes & subjects if available */}
          {(classesList.length > 0 || subjectsList.length > 0) && (
            <div className="pt-1.5 border-t border-[#E8DFC9] text-[9px] text-[#666666] flex flex-wrap gap-x-4">
              {classesList.length > 0 && (
                <div>
                  <strong>Registered Classes:</strong> {classesList.slice(0, 10).join(", ")}
                </div>
              )}
              {subjectsList.length > 0 && (
                <div>
                  <strong>Common Subjects:</strong> {subjectsList.slice(0, 8).join(", ")}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Structured Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-[#142010] text-[10.5px]">
            <thead>
              <tr className="bg-[#EBEBE6] border-b border-[#142010] text-center font-bold text-[10px] uppercase">
                <th className="border border-[#142010] p-1.5 w-7">N°</th>
                <th className="border border-[#142010] p-1.5 w-44 text-left">Teacher Full Name</th>
                <th className="border border-[#142010] p-1.5 w-28 text-left">WhatsApp Phone</th>
                <th className="border border-[#142010] p-1.5 w-28 text-left">Class Master?</th>
                <th className="border border-[#142010] p-1.5 text-left">Teaching Allocations: Subject &rarr; Classes (Coefficients)</th>
                <th className="border border-[#142010] p-1.5 w-20 text-center">Signature</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowCount }).map((_, idx) => (
                <tr key={idx} className="border-b border-[#142010] h-12">
                  <td className="border border-[#142010] text-center font-bold text-[#666666]">
                    {idx + 1}
                  </td>
                  <td className="border border-[#142010] p-1.5 align-top">
                    {/* Blank line for handwriting */}
                  </td>
                  <td className="border border-[#142010] p-1.5 align-top font-mono text-[9.5px] text-[#888888]">
                    +237 6__ __ __ __
                  </td>
                  <td className="border border-[#142010] p-1.5 align-top text-[9.5px]">
                    <div className="flex items-center gap-1">
                      <span>[ ] Yes:</span>
                      <span className="border-b border-dotted border-[#888888] flex-1 inline-block h-3"></span>
                    </div>
                    <div className="mt-1 text-[9px] text-[#777777]">[ ] No</div>
                  </td>
                  <td className="border border-[#142010] p-1.5 align-top">
                    <div className="space-y-1.5">
                      <div className="border-b border-dotted border-[#CCCCCC] h-3"></div>
                      <div className="border-b border-dotted border-[#CCCCCC] h-3"></div>
                    </div>
                  </td>
                  <td className="border border-[#142010] p-1.5 align-middle text-center">
                    {/* Signature box */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Sign-off */}
        <div className="mt-6 pt-3 flex items-start justify-between text-[10px] font-semibold border-t border-[#142010]">
          <div>
            <div>Date Circulated: ____ / ____ / 2026</div>
            <div className="mt-1">Staffroom Coordinator / Bursar: ___________________________</div>
          </div>
          <div className="text-right">
            <div>Approved by Principal / Academic Vice:</div>
            <div className="mt-8 italic text-[9px] text-[#555555]">Signature & School Stamp</div>
          </div>
        </div>
      </div>
    </div>
  );
}
