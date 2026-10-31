"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Printer,
  Download,
  X,
  FileText,
  Users,
  CheckSquare,
  ShieldCheck,
  ChevronDown,
  Building,
  Calendar,
  GraduationCap,
  Eye,
  Check,
} from "lucide-react";
import { Enrolment, School, ClassStream } from "@/types/database";

interface ClassListModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrolledStudents: Enrolment[];
  streams: ClassStream[];
  school?: School | null;
  academicYearName: string;
  defaultStreamId?: string;
}

type ListMode = "official" | "attendance" | "notice_board";

const PORTAL_ID = "nsei-print-portal";
const PRINT_BODY_CLASS = "nsei-print-portal-active";

export function ClassListModal({
  isOpen,
  onClose,
  enrolledStudents,
  streams,
  school,
  academicYearName,
  defaultStreamId = "",
}: ClassListModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ListMode>("official");
  const [selectedStreamId, setSelectedStreamId] = useState<string>(defaultStreamId);
  const [genderFilter, setGenderFilter] = useState<"all" | "M" | "F">("all");
  const [includeParentContact, setIncludeParentContact] = useState<boolean>(true);
  const [includeDateOfBirth, setIncludeDateOfBirth] = useState<boolean>(true);
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);

  // Synchronize default stream when modal opens
  useEffect(() => {
    setSelectedStreamId(defaultStreamId);
  }, [defaultStreamId, isOpen]);

  // Handle escape key & print portal setup
  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    const afterPrint = () => {
      document.body.classList.remove(PRINT_BODY_CLASS);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("afterprint", afterPrint);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("afterprint", afterPrint);
      document.body.classList.remove(PRINT_BODY_CLASS);
    };
  }, [isOpen, onClose]);

  // Selected stream details
  const activeStream = useMemo(() => {
    return streams.find((s) => s.id === selectedStreamId) || null;
  }, [streams, selectedStreamId]);

  // Filter students by selected stream and gender
  const filteredStudents = useMemo(() => {
    return enrolledStudents.filter((e) => {
      // Stream filter
      if (selectedStreamId && e.class_stream_id !== selectedStreamId) {
        return false;
      }
      // Gender filter
      if (genderFilter !== "all" && e.student?.gender !== genderFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const nameA = `${a.student?.last_name || ""} ${a.student?.first_name || ""}`.trim().toLowerCase();
      const nameB = `${b.student?.last_name || ""} ${b.student?.first_name || ""}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [enrolledStudents, selectedStreamId, genderFilter]);

  // Statistics
  const totalCount = filteredStudents.length;
  const maleCount = filteredStudents.filter((e) => e.student?.gender === "M").length;
  const femaleCount = filteredStudents.filter((e) => e.student?.gender === "F").length;
  const dayCount = filteredStudents.filter((e) => e.student?.residence_status !== "boarding").length;
  const boardingCount = filteredStudents.filter((e) => e.student?.residence_status === "boarding").length;
  const repeaterCount = filteredStudents.filter((e) => e.is_repeater || e.student?.is_repeater).length;

  const malePercent = totalCount > 0 ? Math.round((maleCount / totalCount) * 100) : 0;
  const femalePercent = totalCount > 0 ? Math.round((femaleCount / totalCount) * 100) : 0;

  // Print execution
  const handlePrint = () => {
    document.body.classList.add(PRINT_BODY_CLASS);
    requestAnimationFrame(() => {
      window.print();
    });
  };

  // CSV Export execution
  const handleExportCsv = () => {
    const streamName = activeStream ? activeStream.name : "All_Classes";
    const headers = [
      "No",
      "Matricule",
      "Last Name",
      "First Name",
      "Class Group",
      "Gender",
      "Date of Birth",
      "Place of Birth",
      "Residence",
      "Repeater",
      "Guardian Name",
      "Guardian Phone",
      "Status",
    ];

    const rows = filteredStudents.map((e, idx) => [
      idx + 1,
      `"${e.student?.matricule || ""}"`,
      `"${(e.student?.last_name || "").replace(/"/g, '""')}"`,
      `"${(e.student?.first_name || "").replace(/"/g, '""')}"`,
      `"${(e.class_stream?.name || streamName).replace(/"/g, '""')}"`,
      e.student?.gender || "M",
      e.student?.date_of_birth || "",
      `"${(e.student?.place_of_birth || "").replace(/"/g, '""')}"`,
      e.student?.residence_status === "boarding" ? "Boarding" : "Day",
      e.is_repeater || e.student?.is_repeater ? "Yes" : "No",
      `"${(e.student?.guardian_name || "").replace(/"/g, '""')}"`,
      `"${e.student?.guardian_phone || ""}"`,
      e.student?.status || e.status || "active",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = streamName.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${safeName}_Student_Register_${(academicYearName || "Academic_Year").replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !mounted) return null;

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return createPortal(
    <div
      id={PORTAL_ID}
      className="fixed inset-0 z-[100] bg-[#142010]/60 backdrop-blur-xs overflow-y-auto print:static print:bg-white print:p-0"
    >
      <style>{`
        @media print {
          @page {
            size: ${mode === "attendance" ? "A4 landscape" : "A4 portrait"};
            margin: 8mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>

      {/* ── Top Floating Action Toolbar (Hidden in Print) ── */}
      <header className="no-print sticky top-0 z-20 bg-white border-b border-[#E8DFC9] shadow-sm px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-[#F5EFE0]/60 p-1 rounded-[6px] border border-[#E8DFC9] text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("official");
                setIncludeParentContact(true);
              }}
              className={`px-3 py-1.5 rounded-[4px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mode === "official"
                  ? "bg-white text-[#142010] shadow-2xs font-bold"
                  : "text-[#525E4B] hover:text-[#142010]"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#2A7C13]" />
              <span>Official Register</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("attendance")}
              className={`px-3 py-1.5 rounded-[4px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mode === "attendance"
                  ? "bg-white text-[#142010] shadow-2xs font-bold"
                  : "text-[#525E4B] hover:text-[#142010]"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Attendance &amp; Marks Grid</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("notice_board");
                setIncludeParentContact(false);
              }}
              className={`px-3 py-1.5 rounded-[4px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                mode === "notice_board"
                  ? "bg-white text-[#142010] shadow-2xs font-bold"
                  : "text-[#525E4B] hover:text-[#142010]"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Notice Board List</span>
            </button>
          </div>

          {/* Controls: Class Selector & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stream Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#525E4B]">Class:</span>
              <select
                value={selectedStreamId}
                onChange={(e) => setSelectedStreamId(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              >
                <option value="">All School Classes ({enrolledStudents.length})</option>
                {streams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as "all" | "M" | "F")}
              className="px-2 py-1.5 text-xs font-semibold rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-[#142010] focus:outline-none focus:border-[#2A7C13]"
            >
              <option value="all">All Genders</option>
              <option value="M">Boys Only (M)</option>
              <option value="F">Girls Only (F)</option>
            </select>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-white text-[#142010] hover:bg-[#FFFDF5] text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#525E4B]" />
              <span>Excel / CSV</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[5px] border border-[#E8DFC9] bg-white text-[#525E4B] hover:text-[#142010] hover:bg-[#FFFDF5] cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Options Row */}
        <div className="max-w-6xl mx-auto mt-2 pt-2 border-t border-[#F5EFE0] flex flex-wrap items-center gap-4 text-[11px] text-[#525E4B]">
          <span className="font-semibold text-[#142010]">Toggles:</span>
          {mode !== "attendance" && (
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeParentContact}
                onChange={(e) => setIncludeParentContact(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#D5D5CF] text-[#2A7C13] focus:ring-[#2A7C13] accent-[#2A7C13]"
              />
              <span>Guardian Phone</span>
            </label>
          )}
          {mode !== "attendance" && (
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDateOfBirth}
                onChange={(e) => setIncludeDateOfBirth(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#D5D5CF] text-[#2A7C13] focus:ring-[#2A7C13] accent-[#2A7C13]"
              />
              <span>Date &amp; Place of Birth</span>
            </label>
          )}
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSignatures}
              onChange={(e) => setIncludeSignatures(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#D5D5CF] text-[#2A7C13] focus:ring-[#2A7C13] accent-[#2A7C13]"
            />
            <span>Official Signatures</span>
          </label>
          <span className="ml-auto font-mono text-[#2A7C13] font-semibold">
            {totalCount} student{totalCount === 1 ? "" : "s"} listed (M: {maleCount}, F: {femaleCount})
          </span>
        </div>
      </header>

      {/* ── Document Container (Rendered on screen with paper aesthetic, full-bleed in print) ── */}
      <main className="max-w-5xl mx-auto p-4 sm:p-8 print:p-0 print-full-width">
        <article className="bg-white rounded-[8px] shadow-md border border-[#E8DFC9] p-6 sm:p-10 print:border-none print:shadow-none print:p-0 print:rounded-none">
          {/* Official Bilingual Cameroon Letterhead */}
          <header className="border-b-2 border-[#142010] pb-4 mb-4">
            <div className="grid grid-cols-3 items-center text-center text-[10px] leading-tight text-[#142010]">
              {/* Left Column: English Header */}
              <div className="space-y-0.5">
                <p className="font-extrabold uppercase tracking-wider text-[10.5px]">Republic of Cameroon</p>
                <p className="italic text-[9.5px]">Peace – Work – Fatherland</p>
                <p className="font-semibold uppercase text-[9px] text-[#525E4B]">Ministry of Secondary Education</p>
                <p className="text-[9px] text-[#525E4B]">Regional Delegation</p>
              </div>

              {/* Center Column: School Branding */}
              <div className="space-y-1">
                {school?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={school.logo_url}
                    alt={school.name}
                    className="w-12 h-12 object-contain mx-auto rounded"
                  />
                ) : (
                  <div className="w-11 h-11 mx-auto rounded-full bg-[#F5EFE0] border border-[#E8DFC9] flex items-center justify-center text-[#2A7C13] font-black text-sm">
                    {school?.name?.charAt(0) || "S"}
                  </div>
                )}
                <h1 className="font-black text-sm sm:text-base uppercase tracking-tight text-[#142010]">
                  {school?.name || "Nsei Sukul Academy"}
                </h1>
                {school?.motto && (
                  <p className="italic text-[9.5px] text-[#525E4B] font-serif">&ldquo;{school.motto}&rdquo;</p>
                )}
                <p className="text-[8.5px] text-[#788470]">
                  {[school?.address, school?.phone, school?.email].filter(Boolean).join(" • ")}
                </p>
              </div>

              {/* Right Column: French Header */}
              <div className="space-y-0.5">
                <p className="font-extrabold uppercase tracking-wider text-[10.5px]">République du Cameroun</p>
                <p className="italic text-[9.5px]">Paix – Travail – Patrie</p>
                <p className="font-semibold uppercase text-[9px] text-[#525E4B]">Ministère des Enseignements Secondaires</p>
                <p className="text-[9px] text-[#525E4B]">Délégation Régionale</p>
              </div>
            </div>
          </header>

          {/* Title & Metadata Strip */}
          <div className="bg-[#F5EFE0]/70 border border-[#E8DFC9] rounded-[4px] p-3 mb-4 print:bg-transparent print:border-[#142010]">
            <div className="text-center space-y-1">
              <h2 className="text-sm sm:text-base font-black tracking-wider uppercase text-[#142010]">
                {mode === "official"
                  ? "Official Class List / Liste Officielle des Élèves"
                  : mode === "attendance"
                  ? "Class Attendance & Continuous Assessment Register"
                  : "Student Notice Board Register / Liste d'Affichage"}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 mt-2 border-t border-[#E8DFC9] text-xs print:border-[#142010]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#788470] block">Academic Year</span>
                <strong className="text-[#142010]">{academicYearName || "2026/2027"}</strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#788470] block">Class / Section</span>
                <strong className="text-[#2A7C13] font-bold">
                  {activeStream ? activeStream.name : "All Enrolled Classes"}
                </strong>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#788470] block">Class Master (Titulaire)</span>
                <span className="text-[#142010]">
                  {activeStream?.class_master?.full_name || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#788470] block">Date Generated</span>
                <span className="text-[#142010]">{currentDate}</span>
              </div>
            </div>

            {mode === "attendance" && (
              <div className="grid grid-cols-3 gap-3 pt-2 mt-2 border-t border-dashed border-[#E8DFC9] text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#788470] uppercase">Subject / Matière:</span>{" "}
                  <span className="border-b border-[#142010] inline-block w-36">&nbsp;</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#788470] uppercase">Period / Month:</span>{" "}
                  <span className="border-b border-[#142010] inline-block w-36">&nbsp;</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#788470] uppercase">Teacher / Enseignant:</span>{" "}
                  <span className="border-b border-[#142010] inline-block w-36">&nbsp;</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Table Layout ── */}
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#788470]">
              No students enrolled in this selection.
            </div>
          ) : mode === "attendance" ? (
            /* ── Layout B: Attendance & Assessment Blank Grid ── */
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#142010] text-[10px]">
                <thead>
                  <tr className="bg-[#F5EFE0] print:bg-gray-100 text-[#142010] font-bold border-b border-[#142010]">
                    <th className="border border-[#142010] py-1.5 px-1 w-8 text-center">#</th>
                    <th className="border border-[#142010] py-1.5 px-2 w-24 text-left">Matricule</th>
                    <th className="border border-[#142010] py-1.5 px-2 text-left min-w-[160px]">
                      Student Name (Nom et Prénom)
                    </th>
                    <th className="border border-[#142010] py-1.5 px-1 w-8 text-center">Sex</th>
                    {/* 20 Checkbox / Daily test score columns */}
                    {Array.from({ length: 20 }).map((_, i) => (
                      <th
                        key={i}
                        className="border border-[#142010] py-1 px-0.5 w-6 text-center font-normal text-[8px]"
                      >
                        {i + 1}
                      </th>
                    ))}
                    <th className="border border-[#142010] py-1.5 px-1 w-14 text-center font-bold">Total / 20</th>
                    <th className="border border-[#142010] py-1.5 px-1 w-20 text-center font-bold">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((enrol, idx) => (
                    <tr
                      key={enrol.id}
                      className={idx % 2 === 1 ? "bg-[#FAF7EE]/50 print:bg-transparent" : "bg-white"}
                    >
                      <td className="border border-[#142010] py-1 px-1 text-center font-semibold text-[#525E4B]">
                        {idx + 1}
                      </td>
                      <td className="border border-[#142010] py-1 px-2 font-mono text-[9px] text-[#142010]">
                        {enrol.student?.matricule || "N/A"}
                      </td>
                      <td className="border border-[#142010] py-1 px-2 font-medium text-[#142010] truncate">
                        <strong className="uppercase">{enrol.student?.last_name}</strong>{" "}
                        <span>{enrol.student?.first_name}</span>
                      </td>
                      <td className="border border-[#142010] py-1 px-1 text-center font-bold text-[#142010]">
                        {enrol.student?.gender || "M"}
                      </td>
                      {Array.from({ length: 20 }).map((_, i) => (
                        <td key={i} className="border border-[#142010] py-1 px-0.5 text-center">
                          &nbsp;
                        </td>
                      ))}
                      <td className="border border-[#142010] py-1 px-1 text-center">&nbsp;</td>
                      <td className="border border-[#142010] py-1 px-1 text-center">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── Layout A: Official Class Register / Notice Board List ── */
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#142010] text-[10.5px]">
                <thead>
                  <tr className="bg-[#F5EFE0] print:bg-gray-100 text-[#142010] font-bold border-b-2 border-[#142010]">
                    <th className="border border-[#142010] py-1.5 px-1.5 w-9 text-center">N°</th>
                    <th className="border border-[#142010] py-1.5 px-2 w-28 text-left">Matricule</th>
                    <th className="border border-[#142010] py-1.5 px-2 text-left">
                      Student Full Name (Noms et Prénoms)
                    </th>
                    <th className="border border-[#142010] py-1.5 px-1.5 w-10 text-center">Sex</th>
                    {includeDateOfBirth && (
                      <th className="border border-[#142010] py-1.5 px-2 w-44 text-left">
                        Date &amp; Place of Birth
                      </th>
                    )}
                    <th className="border border-[#142010] py-1.5 px-1.5 w-16 text-center">Statut</th>
                    <th className="border border-[#142010] py-1.5 px-1.5 w-12 text-center" title="Redoublant / Repeater">
                      Red.
                    </th>
                    {includeParentContact && mode !== "notice_board" && (
                      <th className="border border-[#142010] py-1.5 px-2 w-48 text-left">
                        Guardian &amp; Phone Contact
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((enrol, idx) => {
                    const isRep = enrol.is_repeater || enrol.student?.is_repeater;
                    const isBoarder = enrol.student?.residence_status === "boarding";
                    return (
                      <tr
                        key={enrol.id}
                        className={idx % 2 === 1 ? "bg-[#FAF7EE]/50 print:bg-transparent" : "bg-white"}
                      >
                        <td className="border border-[#142010] py-1.5 px-1.5 text-center font-bold text-[#525E4B]">
                          {idx + 1}
                        </td>
                        <td className="border border-[#142010] py-1.5 px-2 font-mono text-[9.5px] font-semibold text-[#142010]">
                          {enrol.student?.matricule || "N/A"}
                        </td>
                        <td className="border border-[#142010] py-1.5 px-2 text-[#142010]">
                          <strong className="uppercase font-bold">{enrol.student?.last_name}</strong>{" "}
                          <span>{enrol.student?.first_name}</span>
                        </td>
                        <td className="border border-[#142010] py-1.5 px-1.5 text-center font-bold text-[#142010]">
                          {enrol.student?.gender || "M"}
                        </td>
                        {includeDateOfBirth && (
                          <td className="border border-[#142010] py-1.5 px-2 text-[9.5px] text-[#525E4B]">
                            {enrol.student?.date_of_birth
                              ? `${enrol.student.date_of_birth}${
                                  enrol.student.place_of_birth ? ` in ${enrol.student.place_of_birth}` : ""
                                }`
                              : "—"}
                          </td>
                        )}
                        <td className="border border-[#142010] py-1.5 px-1.5 text-center text-[9.5px] font-semibold">
                          {isBoarder ? "Interne" : "Externe"}
                        </td>
                        <td className="border border-[#142010] py-1.5 px-1.5 text-center text-[9.5px] font-semibold">
                          {isRep ? (
                            <span className="text-[#B45309] font-bold">R</span>
                          ) : (
                            <span className="text-[#2A7C13]">N</span>
                          )}
                        </td>
                        {includeParentContact && mode !== "notice_board" && (
                          <td className="border border-[#142010] py-1.5 px-2 text-[9.5px] text-[#142010]">
                            {enrol.student?.guardian_name ? (
                              <div className="truncate">
                                <span className="font-medium">{enrol.student.guardian_name}</span>
                                {enrol.student.guardian_phone && (
                                  <span className="text-[#788470] ml-1">({enrol.student.guardian_phone})</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#788470]">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Summary Statistics Block ── */}
          <footer className="mt-4 pt-3 border-t-2 border-[#142010] text-[10px] text-[#142010] space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#F5EFE0]/50 p-2.5 rounded-[4px] border border-[#E8DFC9] print:bg-transparent print:border-[#142010]">
              <div>
                <span className="font-bold text-[#788470] block uppercase text-[8.5px]">Total Enrolled</span>
                <strong className="text-sm font-black text-[#142010]">{totalCount}</strong>
              </div>
              <div>
                <span className="font-bold text-[#788470] block uppercase text-[8.5px]">Boys (Garçons)</span>
                <strong className="text-xs font-bold text-[#2A7C13]">{maleCount} ({malePercent}%)</strong>
              </div>
              <div>
                <span className="font-bold text-[#788470] block uppercase text-[8.5px]">Girls (Filles)</span>
                <strong className="text-xs font-bold text-[#B45309]">{femaleCount} ({femalePercent}%)</strong>
              </div>
              <div>
                <span className="font-bold text-[#788470] block uppercase text-[8.5px]">Day / Boarders</span>
                <strong className="text-xs font-bold">{dayCount} Ext. / {boardingCount} Int.</strong>
              </div>
              <div>
                <span className="font-bold text-[#788470] block uppercase text-[8.5px]">Repeaters / New</span>
                <strong className="text-xs font-bold">{repeaterCount} Red. / {totalCount - repeaterCount} Nouv.</strong>
              </div>
            </div>

            {/* Official Signatures Block */}
            {includeSignatures && (
              <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs">
                <div className="space-y-12">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-[#525E4B]">
                    The Class Master / Titulaire
                  </p>
                  <p className="border-t border-dotted border-[#142010] pt-1 text-[9.5px] italic text-[#788470]">
                    {activeStream?.class_master?.full_name || "Signature & Date"}
                  </p>
                </div>

                <div className="space-y-12">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-[#525E4B]">
                    Dean of Studies / Censeur
                  </p>
                  <p className="border-t border-dotted border-[#142010] pt-1 text-[9.5px] italic text-[#788470]">
                    Signature &amp; Date
                  </p>
                </div>

                <div className="space-y-12">
                  <p className="font-bold uppercase tracking-wider text-[10px] text-[#525E4B]">
                    The Principal / Le Chef d&apos;Établissement
                  </p>
                  <p className="border-t border-dotted border-[#142010] pt-1 text-[9.5px] italic text-[#788470]">
                    Visa &amp; Official School Stamp
                  </p>
                </div>
              </div>
            )}
          </footer>
        </article>
      </main>
    </div>,
    document.body
  );
}
