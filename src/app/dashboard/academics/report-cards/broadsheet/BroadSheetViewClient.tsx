"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Printer,
  Download,
  Users,
  ArrowLeft,
  Coins,
  CheckCircle2,
  AlertTriangle,
  X,
  Phone,
  SlidersHorizontal,
} from "lucide-react";
import { ReportCardFullData } from "@/lib/academic/report-card-service";

interface BroadSheetViewClientProps {
  reportCards: ReportCardFullData[];
  debtorMap: Record<string, { balance: number; status: string; total: number; paid: number }>;
  visibleStreams: Array<{ id: string; name: string }>;
  selectedStreamId: string;
  selectedTermNumber: number;
  initialSortBy: "rank" | "alphabetical";
}

export function BroadSheetViewClient({
  reportCards,
  debtorMap,
  visibleStreams,
  selectedStreamId,
  selectedTermNumber,
  initialSortBy = "rank",
}: BroadSheetViewClientProps) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<"rank" | "alphabetical">(initialSortBy);
  const [showSequences, setShowSequences] = useState(false);
  const [showFeeStatus, setShowFeeStatus] = useState(false);
  const [isDebtorModalOpen, setIsDebtorModalOpen] = useState(false);

  // Extract common class info from first report card
  const sampleCard = reportCards[0];
  const school = sampleCard?.school;
  const classInfo = sampleCard?.classInfo;
  const term = sampleCard?.term;

  // Extract distinct subjects evaluated across the class
  const classSubjects = useMemo(() => {
    if (!reportCards || reportCards.length === 0) return [];
    const subjectsMap = new Map<
      string,
      { id: string; name: string; coefficient: number }
    >();

    for (const card of reportCards) {
      for (const sub of card.subjects) {
        if (!subjectsMap.has(sub.subjectId)) {
          subjectsMap.set(sub.subjectId, {
            id: sub.subjectId,
            name: sub.subjectName,
            coefficient: sub.coefficient,
          });
        }
      }
    }

    return Array.from(subjectsMap.values());
  }, [reportCards]);

  // Sort student rows
  const sortedStudents = useMemo(() => {
    const list = [...reportCards];
    if (sortBy === "rank") {
      return list.sort((a, b) => (a.summary.rank ?? 999) - (b.summary.rank ?? 999));
    }
    return list.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));
  }, [reportCards, sortBy]);

  // Subject statistics: average & pass rate per subject across the whole class
  const subjectStats = useMemo(() => {
    const stats: Record<string, { totalScore: number; count: number; passCount: number }> = {};
    for (const sub of classSubjects) {
      stats[sub.id] = { totalScore: 0, count: 0, passCount: 0 };
    }

    for (const card of reportCards) {
      for (const sub of card.subjects) {
        if (stats[sub.subjectId] && sub.termAverage !== null && sub.termAverage !== undefined) {
          stats[sub.subjectId].totalScore += sub.termAverage;
          stats[sub.subjectId].count++;
          if (sub.termAverage >= 10) {
            stats[sub.subjectId].passCount++;
          }
        }
      }
    }

    return stats;
  }, [reportCards, classSubjects]);

  // Class statistics rollup
  const classStats = useMemo(() => {
    const totalEnrolled = reportCards.length;
    const boysCount = reportCards.filter((c) => c.student.gender === "M").length;
    const girlsCount = reportCards.filter((c) => c.student.gender === "F").length;
    const passed = reportCards.filter((c) => c.summary.studentAverage >= 10.0);
    const failed = reportCards.filter((c) => c.summary.studentAverage < 10.0);

    const averages = reportCards.map((c) => c.summary.studentAverage).filter((a) => !isNaN(a));
    const maxAverage = averages.length > 0 ? Math.max(...averages) : 0;
    const minAverage = averages.length > 0 ? Math.min(...averages) : 0;
    const generalAverage =
      averages.length > 0 ? averages.reduce((a, b) => a + b, 0) / averages.length : 0;

    const highestStudent = reportCards.find((c) => c.summary.studentAverage === maxAverage);

    return {
      totalEnrolled,
      boysCount,
      girlsCount,
      passedCount: passed.length,
      failedCount: failed.length,
      passRate: totalEnrolled > 0 ? Math.round((passed.length / totalEnrolled) * 100) : 0,
      maxAverage: maxAverage.toFixed(2),
      minAverage: minAverage.toFixed(2),
      generalAverage: generalAverage.toFixed(2),
      highestStudentName: highestStudent?.student.fullName || "N/A",
    };
  }, [reportCards]);

  // Debtor students list for this class
  const debtorStudents = useMemo(() => {
    return reportCards
      .map((c) => {
        const info = debtorMap[c.student.id];
        return {
          id: c.student.id,
          matricule: c.student.matricule,
          fullName: c.student.fullName,
          phone: c.student.guardianPhone || "N/A",
          balance: info?.balance ?? 0,
          paid: info?.paid ?? 0,
          total: info?.total ?? 0,
          isDebtor: (info?.balance ?? 0) > 0,
        };
      })
      .filter((s) => s.isDebtor)
      .sort((a, b) => b.balance - a.balance);
  }, [reportCards, debtorMap]);

  // Export Broad Sheet to CSV / Excel
  const handleExportCsv = () => {
    if (reportCards.length === 0) return;

    const headers = [
      "Roll No",
      "Matricule",
      "Student Name",
      "Gender",
      ...classSubjects.map((s) => `${s.name} (Coef ${s.coefficient})`),
      "Total Weighted Points",
      "Total Coefficients",
      "Average (/20)",
      "Rank",
      "Discipline (Abs hours)",
      "Council Decision",
      "Fee Balance (FCFA)",
    ];

    const rows = sortedStudents.map((card, idx) => {
      const subjectScores = classSubjects.map((s) => {
        const found = card.subjects.find((sub) => sub.subjectId === s.id);
        return found?.termAverage !== null && found?.termAverage !== undefined
          ? found.termAverage.toFixed(2)
          : "-";
      });

      const feeInfo = debtorMap[card.student.id];

      return [
        idx + 1,
        `"${card.student.matricule}"`,
        `"${card.student.fullName}"`,
        card.student.gender,
        ...subjectScores,
        card.summary.totalWeightedScore.toFixed(2),
        card.summary.totalCoef,
        card.summary.studentAverage.toFixed(2),
        card.summary.rank ?? "-",
        card.discipline.unjustifiedAbsHours ?? 0,
        `"${getCouncilDecision(card.summary.studentAverage)}"`,
        feeInfo ? feeInfo.balance : 0,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `broadsheet_${classInfo?.streamName || "class"}_term_${selectedTermNumber}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for official ministerial decision label
  function getCouncilDecision(avg: number): string {
    if (avg >= 16.0) return "Tableau d'Honneur + Félicitations";
    if (avg >= 14.0) return "Tableau d'Honneur + Encouragements";
    if (avg >= 12.0) return "Tableau d'Honneur";
    if (avg >= 10.0) return "Pass (Admis / Satisfaisant)";
    if (avg >= 8.5) return "Avertissement Travail";
    return "Blâme Travail";
  }

  function getAbbreviatedSubject(name: string): string {
    const clean = name.trim().toUpperCase();
    if (clean.length <= 4) return clean;
    if (clean.includes(" ")) {
      const parts = clean.split(" ");
      return parts.map((p) => p[0]).join("").slice(0, 4);
    }
    return clean.slice(0, 4);
  }

  return (
    <div className="space-y-6">
      {/* SCREEN-ONLY TOOLBAR */}
      <div className="print:hidden space-y-4">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/dashboard/academics/report-cards"
              className="inline-flex items-center gap-1.5 text-[#525E4B] hover:text-[#142010] font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Report Cards Hub</span>
            </Link>
            <span className="text-[#D5CBB2]">/</span>
            <span className="font-bold text-[#2A7C13]">Class Council Master Broad Sheet</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDebtorModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#FFF8CF] hover:bg-[#FEF08A] border border-[#FBE6C2] text-[#854D0E] text-xs font-bold transition-colors cursor-pointer"
              title="View & print debtor list for this class"
            >
              <Coins className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Fee Debtors ({debtorStudents.length})</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white hover:bg-[#FAF8F5] border border-[#D5CBB2] text-[#142010] text-xs font-bold transition-colors cursor-pointer"
              title="Download Excel / CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-[#2A7C13]" />
              <span>Export CSV / Excel</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Print landscape broad sheet"
            >
              <Printer className="w-4 h-4" />
              <span>Print Broad Sheet (Landscape)</span>
            </button>
          </div>
        </div>

        {/* Filter and View Customizer Bar */}
        <div className="p-4 rounded-[8px] bg-white border border-[#D5CBB2] shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Stream Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#555555]">Class:</span>
              <select
                value={selectedStreamId}
                onChange={(e) =>
                  router.push(
                    `/dashboard/academics/report-cards/broadsheet?classStreamId=${e.target.value}&termNumber=${selectedTermNumber}`
                  )
                }
                className="px-2.5 py-1.5 rounded-[6px] border border-[#D5D5CF] bg-white text-xs font-bold text-[#142010]"
              >
                {visibleStreams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Term Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#555555]">Evaluation:</span>
              <select
                value={selectedTermNumber}
                onChange={(e) =>
                  router.push(
                    `/dashboard/academics/report-cards/broadsheet?classStreamId=${selectedStreamId}&termNumber=${e.target.value}`
                  )
                }
                className="px-2.5 py-1.5 rounded-[6px] border border-[#D5D5CF] bg-white text-xs font-bold text-[#142010]"
              >
                <option value="1">Term 1 (Seq 1 &amp; 2)</option>
                <option value="2">Term 2 (Seq 3 &amp; 4)</option>
                <option value="3">Term 3 (Seq 5 &amp; 6)</option>
              </select>
            </div>

            {/* Sort Order Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#555555]">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "rank" | "alphabetical")}
                className="px-2.5 py-1.5 rounded-[6px] border border-[#D5D5CF] bg-white text-xs text-[#142010]"
              >
                <option value="rank">Rank (1st to Last)</option>
                <option value="alphabetical">Alphabetical (A - Z)</option>
              </select>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#444444]">
              <input
                type="checkbox"
                checked={showSequences}
                onChange={(e) => setShowSequences(e.target.checked)}
                className="rounded text-[#2A7C13] focus:ring-[#2A7C13]"
              />
              <span className="font-medium text-[11.5px]">Show Sequence Breakdown</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#444444]">
              <input
                type="checkbox"
                checked={showFeeStatus}
                onChange={(e) => setShowFeeStatus(e.target.checked)}
                className="rounded text-[#2A7C13] focus:ring-[#2A7C13]"
              />
              <span className="font-medium text-[11.5px]">Show Fee Clearance</span>
            </label>
          </div>
        </div>
      </div>

      {/* PRINT STYLING INJECTION (Landscape A4/A3) */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 6mm;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 8.5pt !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          nav, aside, header, footer, .print\\:hidden {
            display: none !important;
          }
          .broadsheet-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* THE OFFICIAL BROAD SHEET CONTAINER */}
      <div className="broadsheet-container bg-white rounded-[8px] border border-[#D5CBB2] p-4 sm:p-6 shadow-2xs space-y-4">
        {/* OFFICIAL BILINGUAL MINISTERIAL HEADER */}
        <div className="border-b-2 border-black pb-3 text-center">
          <div className="grid grid-cols-3 items-center text-[10px] leading-tight text-black font-semibold">
            {/* French Subsystem Block */}
            <div className="text-left space-y-0.5 uppercase">
              <p className="font-bold">RÉPUBLIQUE DU CAMEROUN</p>
              <p className="text-[9px] font-normal italic">Paix - Travail - Patrie</p>
              <p className="text-[9px]">MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES</p>
              <p className="text-[9px] text-gray-700">{school?.regionalDelegation || "Délégation Régionale"}</p>
            </div>

            {/* School Crest & Center Identity */}
            <div className="flex flex-col items-center justify-center space-y-1">
              {school?.logo_url ? (
                <img
                  src={school.logo_url}
                  alt={school.name}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-full border border-black flex items-center justify-center font-bold text-sm">
                  {school?.name?.charAt(0) || "S"}
                </div>
              )}
              <h1 className="text-sm sm:text-base font-black tracking-tight text-black uppercase">
                {school?.name || "School Name"}
              </h1>
              {school?.motto && (
                <p className="text-[9px] italic text-gray-600 font-serif">&ldquo;{school.motto}&rdquo;</p>
              )}
              <span className="text-[10px] font-bold px-2 py-0.2 bg-gray-100 border border-gray-400 rounded">
                Année Scolaire / Academic Year: {term?.academicYearName || "2026/2027"}
              </span>
            </div>

            {/* English Subsystem Block */}
            <div className="text-right space-y-0.5 uppercase">
              <p className="font-bold">REPUBLIC OF CAMEROON</p>
              <p className="text-[9px] font-normal italic">Peace - Work - Fatherland</p>
              <p className="text-[9px]">MINISTRY OF SECONDARY EDUCATION</p>
              <p className="text-[9px] text-gray-700">{school?.divisionalDelegation || "Divisional Delegation"}</p>
            </div>
          </div>

          {/* Sheet Main Title Banner */}
          <div className="mt-2.5 pt-2 border-t border-gray-300 flex flex-col items-center">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-black bg-gray-200 px-4 py-1 border border-black inline-block">
              PROCÈS-VERBAL DE DÉLIBÉRATION DU CONSEIL DE CLASSE (MASTER BROAD SHEET)
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[10.5px] text-black font-semibold mt-1.5">
              <span>Classe: <strong>{classInfo?.streamName || "Class"}</strong></span>
              <span>&bull;</span>
              <span>Évaluation: <strong>Term {selectedTermNumber} (Sequences {selectedTermNumber * 2 - 1} &amp; {selectedTermNumber * 2})</strong></span>
              <span>&bull;</span>
              <span>Effectif: <strong>{classStats.totalEnrolled}</strong> ({classStats.boysCount} Garçons, {classStats.girlsCount} Filles)</span>
              <span>&bull;</span>
              <span>Professeur Principal: <strong>{classInfo?.classMasterName || "Non assigné"}</strong></span>
            </div>
          </div>
        </div>

        {/* THE CONSOLIDATED MARKS MATRIX TABLE */}
        <div className="overflow-x-auto">
          {reportCards.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              No students or marks found for this class in Term {selectedTermNumber}.
            </div>
          ) : (
            <table className="w-full text-left text-[10.5px] border-collapse border border-black">
              <thead>
                <tr className="bg-gray-200 text-black font-bold uppercase text-[9px] text-center border-b border-black">
                  <th className="border border-black py-1 px-1.5 w-6">#</th>
                  <th className="border border-black py-1 px-2 text-left">Matricule</th>
                  <th className="border border-black py-1 px-2 text-left min-w-[140px]">Nom et Prénoms</th>
                  <th className="border border-black py-1 px-1 w-6">Sexe</th>

                  {/* Dynamic Subject Columns */}
                  {classSubjects.map((sub) => (
                    <th key={sub.id} className="border border-black py-1 px-1 min-w-[42px]">
                      <div className="font-extrabold" title={sub.name}>
                        {getAbbreviatedSubject(sub.name)}
                      </div>
                      <div className="text-[8px] font-normal text-gray-700">
                        Coef {sub.coefficient}
                      </div>
                    </th>
                  ))}

                  {/* Calculated Performance Summary Columns */}
                  <th className="border border-black py-1 px-1.5 min-w-[44px]">Total Pts</th>
                  <th className="border border-black py-1 px-1.5 min-w-[36px]">Coef</th>
                  <th className="border border-black py-1 px-2 min-w-[46px] bg-gray-300">Moy/20</th>
                  <th className="border border-black py-1 px-1.5 min-w-[36px]">Rang</th>
                  <th className="border border-black py-1 px-1 w-8">Abs</th>
                  <th className="border border-black py-1 px-2 text-left min-w-[120px]">
                    Décision du Conseil
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black text-black">
                {sortedStudents.map((card, idx) => {
                  const studentAvg = card.summary.studentAverage;
                  const isPass = studentAvg >= 10.0;
                  const debtorInfo = debtorMap[card.student.id];

                  return (
                    <tr
                      key={card.student.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        idx % 2 === 1 ? "bg-gray-50/50" : "bg-white"
                      }`}
                    >
                      {/* Serial Number */}
                      <td className="border border-black py-1 px-1 text-center font-mono font-semibold text-[9px]">
                        {idx + 1}
                      </td>

                      {/* Matricule */}
                      <td className="border border-black py-1 px-2 font-mono text-[9px] whitespace-nowrap">
                        {card.student.matricule}
                      </td>

                      {/* Student Full Name & Optional Debtor Badge */}
                      <td className="border border-black py-1 px-2 font-bold text-[10px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{card.student.fullName}</span>
                          {showFeeStatus && debtorInfo && (
                            <span
                              className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                                debtorInfo.balance > 0
                                  ? "bg-red-100 text-red-800 border border-red-300"
                                  : "bg-green-100 text-green-800"
                              }`}
                              title={debtorInfo.balance > 0 ? `Owing ${debtorInfo.balance} FCFA` : "Fees cleared"}
                            >
                              {debtorInfo.balance > 0 ? "Debt" : "Paid"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="border border-black py-1 px-1 text-center font-bold text-[9px]">
                        {card.student.gender}
                      </td>

                      {/* Dynamic Subject Marks */}
                      {classSubjects.map((sub) => {
                        const found = card.subjects.find((s) => s.subjectId === sub.id);
                        const mark = found?.termAverage;
                        const hasMark = mark !== null && mark !== undefined;
                        const isSubPass = hasMark && mark >= 10.0;

                        return (
                          <td
                            key={sub.id}
                            className={`border border-black py-1 px-1 text-center font-mono text-[9.5px] ${
                              hasMark
                                ? isSubPass
                                  ? "font-bold text-black"
                                  : "text-red-700 font-semibold"
                                : "text-gray-400"
                            }`}
                          >
                            {hasMark ? (
                              showSequences ? (
                                <div className="leading-none text-[8.5px]">
                                  <span>{mark.toFixed(1)}</span>
                                  <span className="block text-[7px] text-gray-500">
                                    {found?.seqAMark ?? "-"}/{found?.seqBMark ?? "-"}
                                  </span>
                                </div>
                              ) : (
                                mark.toFixed(1)
                              )
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}

                      {/* Total Weighted Points */}
                      <td className="border border-black py-1 px-1.5 text-center font-mono font-semibold">
                        {card.summary.totalWeightedScore.toFixed(1)}
                      </td>

                      {/* Total Coefficients */}
                      <td className="border border-black py-1 px-1.5 text-center font-mono text-gray-700">
                        {card.summary.totalCoef}
                      </td>

                      {/* Student General Average (/20) */}
                      <td
                        className={`border border-black py-1 px-2 text-center font-mono font-bold text-[10.5px] ${
                          isPass ? "bg-green-50 text-black" : "bg-red-50 text-red-800"
                        }`}
                      >
                        {studentAvg.toFixed(2)}
                      </td>

                      {/* Rank */}
                      <td className="border border-black py-1 px-1.5 text-center font-bold font-mono text-[9.5px]">
                        {card.summary.rank ? `${card.summary.rank}` : "-"}
                      </td>

                      {/* Unjustified Absences */}
                      <td className="border border-black py-1 px-1 text-center font-mono text-[9px] text-gray-700">
                        {card.discipline.unjustifiedAbsHours || 0}
                      </td>

                      {/* Council Decision */}
                      <td className="border border-black py-1 px-2 font-medium text-[9px] whitespace-nowrap">
                        <span
                          className={
                            studentAvg >= 14.0
                              ? "font-bold text-green-900"
                              : studentAvg >= 10.0
                              ? "text-black"
                              : "text-red-800 font-semibold italic"
                          }
                        >
                          {getCouncilDecision(studentAvg)}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {/* BOTTOM ROW: SUBJECT AVERAGES */}
                <tr className="bg-gray-200 font-bold border-t-2 border-black text-center text-[9px]">
                  <td colSpan={4} className="border border-black py-1 px-2 text-left uppercase">
                    Moyenne Matière (Subject Average)
                  </td>
                  {classSubjects.map((sub) => {
                    const st = subjectStats[sub.id];
                    const avg = st && st.count > 0 ? (st.totalScore / st.count).toFixed(1) : "-";
                    return (
                      <td key={sub.id} className="border border-black py-1 px-1 font-mono">
                        {avg}
                      </td>
                    );
                  })}
                  <td colSpan={6} className="border border-black py-1 px-2 text-left text-[8.5px] text-gray-700">
                    Moyenne Générale Classe: <strong>{classStats.generalAverage}/20</strong>
                  </td>
                </tr>

                {/* BOTTOM ROW: SUBJECT SUCCESS RATE */}
                <tr className="bg-gray-100 font-bold border-b border-black text-center text-[8.5px]">
                  <td colSpan={4} className="border border-black py-1 px-2 text-left uppercase">
                    Taux Réussite Matière (% &ge; 10)
                  </td>
                  {classSubjects.map((sub) => {
                    const st = subjectStats[sub.id];
                    const rate =
                      st && st.count > 0 ? `${Math.round((st.passCount / st.count) * 100)}%` : "-";
                    return (
                      <td key={sub.id} className="border border-black py-0.5 px-1 font-mono text-gray-700">
                        {rate}
                      </td>
                    );
                  })}
                  <td colSpan={6} className="border border-black py-0.5 px-2 text-left text-[8.5px] text-gray-700">
                    Taux Réussite Classe: <strong>{classStats.passRate}%</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* CLASS STATISTICS & COUNCIL PERFORMANCE ROLLUP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-black p-3 bg-gray-50 text-[10px] text-black">
          {/* Left Block: Demographics & Ratios */}
          <div className="space-y-1">
            <h4 className="font-bold uppercase tracking-wider text-[10.5px] border-b border-gray-400 pb-0.5">
              Statistiques Globales de la Classe
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
              <div>
                Effectif Total: <strong>{classStats.totalEnrolled}</strong>
              </div>
              <div>
                Garçons: <strong>{classStats.boysCount}</strong> &middot; Filles: <strong>{classStats.girlsCount}</strong>
              </div>
              <div>
                Nombre d&apos;Admis (&ge; 10/20): <strong>{classStats.passedCount}</strong>
              </div>
              <div>
                Nombre d&apos;Échoués (&lt; 10/20): <strong>{classStats.failedCount}</strong>
              </div>
              <div className="col-span-2 text-[#166534] font-bold text-[10.5px]">
                Pourcentage de Réussite: <strong>{classStats.passRate}%</strong>
              </div>
            </div>
          </div>

          {/* Right Block: Averages & Honors */}
          <div className="space-y-1">
            <h4 className="font-bold uppercase tracking-wider text-[10.5px] border-b border-gray-400 pb-0.5">
              Moyennes et Palmarès
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
              <div>
                Moyenne Générale: <strong>{classStats.generalAverage} / 20</strong>
              </div>
              <div>
                Premier de la Classe: <strong>{classStats.maxAverage} / 20</strong>
              </div>
              <div>
                Dernier de la Classe: <strong>{classStats.minAverage} / 20</strong>
              </div>
              <div>
                Major: <strong>{classStats.highestStudentName}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* OFFICIAL COUNCIL SIGNATURES & VISAS (Mandatory for MINESEC Inspections) */}
        <div className="pt-4 border-t-2 border-black grid grid-cols-3 gap-6 text-[10px] text-black text-center">
          <div className="space-y-14">
            <p className="font-bold uppercase tracking-wider">
              Le Professeur Principal
            </p>
            <p className="border-t border-dotted border-black pt-1 italic text-gray-700">
              {classInfo?.classMasterName || "Nom et Signature"}
            </p>
          </div>

          <div className="space-y-14">
            <p className="font-bold uppercase tracking-wider">
              Le Censeur / Doyen des Études
            </p>
            <p className="border-t border-dotted border-black pt-1 italic text-gray-700">
              Visa et Observations
            </p>
          </div>

          <div className="space-y-14">
            <p className="font-bold uppercase tracking-wider">
              Le Chef d&apos;Établissement (Principal)
            </p>
            <p className="border-t border-dotted border-black pt-1 italic text-gray-700">
              Cachet Officiel et Signature
            </p>
          </div>
        </div>
      </div>

      {/* PRINTABLE CLASS DEBTORS MODAL FOR BURSAR */}
      {isDebtorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:p-0">
          <div className="bg-white rounded-[10px] border border-[#D5CBB2] shadow-2xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FFF8CF] text-[#B45309] flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#142010]">
                    Class Fee Debtor List (Liste des Débiteurs)
                  </h3>
                  <p className="text-[11px] text-[#525E4B]">
                    {classInfo?.streamName} &middot; Term {selectedTermNumber} &middot; Bursar Verification Sheet
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Debtor List</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDebtorModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-black rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Debtor Note */}
            <p className="text-xs text-[#7A5B00] bg-[#FFF8EB] border border-[#FBE6C2] p-2.5 rounded-[6px] leading-relaxed">
              <strong>Bursar &amp; Discipline Master Instruction:</strong> Use this official clearance list to identify students whose clean report cards should be held behind the counter until tuition installments are cleared. Report cards remain clean without permanent watermarks.
            </p>

            {/* Debtor Table */}
            {debtorStudents.length === 0 ? (
              <div className="py-8 text-center text-xs text-green-700 font-bold">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#2A7C13]" />
                All students in {classInfo?.streamName} have cleared their fees! No outstanding balance.
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-300 rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F2] border-b border-gray-300 text-[10px] uppercase font-bold text-gray-700">
                    <tr>
                      <th className="py-2 px-2.5">#</th>
                      <th className="py-2 px-2.5">Matricule</th>
                      <th className="py-2 px-2.5">Student Full Name</th>
                      <th className="py-2 px-2.5">Parent Phone</th>
                      <th className="py-2 px-2.5 text-right">Balance Due (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {debtorStudents.map((d, idx) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="py-1.5 px-2.5 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-1.5 px-2.5 font-mono text-[11px]">{d.matricule}</td>
                        <td className="py-1.5 px-2.5 font-bold text-[#142010]">{d.fullName}</td>
                        <td className="py-1.5 px-2.5 font-mono text-[11px] text-gray-600">
                          {d.phone}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-red-700 text-[11px]">
                          {d.balance.toLocaleString()} FCFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-bold border-t border-gray-300 text-xs">
                    <tr>
                      <td colSpan={4} className="py-2 px-2.5 text-right uppercase">
                        Total Outstanding Debt:
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-red-800">
                        {debtorStudents
                          .reduce((sum, d) => sum + d.balance, 0)
                          .toLocaleString()}{" "}
                        FCFA
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsDebtorModalOpen(false)}
                className="px-4 py-1.5 rounded-[5px] border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
