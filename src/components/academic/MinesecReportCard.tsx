import React from "react";
import { ReportCardFullData } from "@/lib/academic/report-card-service";

interface MinesecReportCardProps {
  data: ReportCardFullData;
}

export function MinesecReportCard({ data }: MinesecReportCardProps) {
  const {
    school,
    term,
    student,
    classInfo,
    subjects,
    summary,
    classProfile,
    discipline,
    remarks,
  } = data;

  return (
    <div className="bg-white text-black p-4 sm:p-6 max-w-[960px] mx-auto border border-black/80 font-sans text-[11px] leading-tight print:p-0 print:border-none print:max-w-none print:w-full">
      
      {/* ── 1. BILINGUAL NATIONAL HEADER ────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-2 border-b-2 border-black pb-2 items-center text-center">
        {/* Anglophone Subsystem Header (Left) */}
        <div className="col-span-5 text-center space-y-0.5 text-[9px] uppercase font-bold tracking-tight">
          <div>REPUBLIC OF CAMEROON</div>
          <div className="text-[8px] font-normal italic lowercase">Peace – Work – Fatherland</div>
          <div className="text-[7px]">*************</div>
          <div>MINISTRY OF SECONDARY EDUCATION</div>
          <div className="text-[7px]">*************</div>
          <div>DÉLÉGATION RÉGIONALE DE {school.regionalDelegation}</div>
          <div className="text-[7px]">*************</div>
          <div>DÉLÉGATION DÉPARTEMENTALE DE {school.divisionalDelegation}</div>
          <div className="text-[7px]">*************</div>
          <div className="text-[10px] font-extrabold text-black pt-0.5">{school.name}</div>
        </div>

        {/* School Logo & Center Seal */}
        <div className="col-span-2 flex flex-col items-center justify-center text-center p-1">
          <div className="w-14 h-14 border border-black rounded-full flex items-center justify-center font-bold text-xs bg-zinc-50 mb-1">
            {school.code || "SEAL"}
          </div>
          <div className="text-[8px] font-mono">REG: {school.code || "MINESEC/2026"}</div>
        </div>

        {/* Francophone Subsystem Header (Right) */}
        <div className="col-span-5 text-center space-y-0.5 text-[9px] uppercase font-bold tracking-tight">
          <div>RÉPUBLIQUE DU CAMEROUN</div>
          <div className="text-[8px] font-normal italic lowercase">Paix – Travail – Patrie</div>
          <div className="text-[7px]">*************</div>
          <div>MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES</div>
          <div className="text-[7px]">*************</div>
          <div>REGIONAL DELEGATION OF {school.regionalDelegation}</div>
          <div className="text-[7px]">*************</div>
          <div>DIVISIONAL DELEGATION OF {school.divisionalDelegation}</div>
          <div className="text-[7px]">*************</div>
          <div className="text-[10px] font-extrabold text-black pt-0.5">LYCÉE DE {school.code || "BAMENDA"}</div>
        </div>
      </div>

      {/* ── 2. TERM TITLE & METADATA BAR ─────────────────────────────────────── */}
      <div className="text-center py-2 border-b border-black flex items-center justify-between px-2">
        <div className="w-16 h-16 border border-dashed border-black/60 flex items-center justify-center text-[8px] text-zinc-500 uppercase text-center p-1">
          Student Photo
        </div>
        <div className="text-center flex-1">
          <h2 className="text-sm sm:text-base font-black tracking-wider uppercase underline underline-offset-4">
            {term.name.toUpperCase()} PROGRESS RECORD
          </h2>
          <div className="text-[11px] font-bold mt-0.5">
            School Year: <span className="font-mono">{term.academicYearName}</span>
          </div>
        </div>
        <div className="w-16 h-16 border border-dashed border-black/60 flex items-center justify-center text-[8px] text-zinc-500 uppercase text-center p-1">
          Official Stamp
        </div>
      </div>

      {/* ── 3. STUDENT PROFILE MATRIX ─────────────────────────────────────────── */}
      <div className="border-b border-black text-[10px]">
        <div className="grid grid-cols-12 border-b border-black/30 divide-x divide-black/30">
          <div className="col-span-7 p-1">
            <span className="font-bold">Name of Student:</span>{" "}
            <span className="font-bold uppercase tracking-tight text-[11px]">{student.fullName}</span>
          </div>
          <div className="col-span-5 p-1">
            <span className="font-bold">Class:</span>{" "}
            <span className="font-bold font-mono">{classInfo.streamName}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 border-b border-black/30 divide-x divide-black/30">
          <div className="col-span-5 p-1">
            <span className="font-bold">Date &amp; place of birth:</span>{" "}
            <span>{student.dateOfBirth || "12/04/2011"} at {student.placeOfBirth || "Bamenda"}</span>
          </div>
          <div className="col-span-3 p-1">
            <span className="font-bold">Gender:</span>{" "}
            <span className="font-mono font-bold">{student.gender === "M" ? "Male (M)" : "Female (F)"}</span>
          </div>
          <div className="col-span-4 p-1">
            <span className="font-bold">Class enrolment:</span>{" "}
            <span className="font-mono font-bold">{classInfo.classEnrolment}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 border-b border-black/30 divide-x divide-black/30">
          <div className="col-span-5 p-1">
            <span className="font-bold">Unique Identification (Matricule):</span>{" "}
            <span className="font-mono font-bold">{student.matricule}</span>
          </div>
          <div className="col-span-3 p-1 flex items-center gap-2">
            <span className="font-bold">Repeater:</span>
            <span>Yes [ ]</span>
            <span className="font-bold">No [✓]</span>
          </div>
          <div className="col-span-4 p-1">
            <span className="font-bold">Number of subjects:</span>{" "}
            <span className="font-mono font-bold">{summary.totalSubjects}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 divide-x divide-black/30">
          <div className="col-span-5 p-1">
            <span className="font-bold">Parent / Guardian contact:</span>{" "}
            <span>{student.guardianName || "N/A"} ({student.guardianPhone || "N/A"})</span>
          </div>
          <div className="col-span-3 p-1">
            <span className="font-bold">Number passed:</span>{" "}
            <span className="font-mono font-bold">{summary.subjectsPassed}</span>
          </div>
          <div className="col-span-4 p-1">
            <span className="font-bold">Class master:</span>{" "}
            <span className="font-medium">{classInfo.classMasterName}</span>
          </div>
        </div>
      </div>

      {/* ── 4. ASSESSMENT & CBA COMPETENCIES TABLE ─────────────────────────────── */}
      <div className="overflow-x-auto border-b-2 border-black">
        <table className="w-full text-left border-collapse text-[9.5px]">
          <thead>
            <tr className="border-b-2 border-black bg-zinc-100/80 font-bold text-center divide-x divide-black">
              <th className="py-1 px-1.5 w-28 text-left">Subject &amp; Teacher</th>
              <th className="py-1 px-1.5 text-left">COMPETENCIES EVALUATED</th>
              <th className="py-1 px-1 w-11">MK/20</th>
              <th className="py-1 px-1 w-11">AV/20</th>
              <th className="py-1 px-1 w-8">Coef</th>
              <th className="py-1 px-1 w-12">AV x Coef</th>
              <th className="py-1 px-1 w-12">GRADE</th>
              <th className="py-1 px-1 w-16">[Min – Max]</th>
              <th className="py-1 px-1.5 w-32 text-left">Remarks &amp; Signature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/40">
            {subjects.map((sub, idx) => (
              <tr key={sub.subjectId} className="divide-x divide-black/30 align-top">
                <td className="py-1 px-1.5 font-bold uppercase text-[9px] bg-zinc-50/50">
                  {sub.subjectName}
                  <div className="text-[7.5px] font-normal text-zinc-600 capitalize">{sub.teacherName}</div>
                </td>
                <td className="py-1 px-1.5 text-[8.5px] leading-tight">
                  <ul className="list-disc pl-3 space-y-0.5">
                    {sub.competencies.map((c, ci) => (
                      <li key={ci}>{c}</li>
                    ))}
                  </ul>
                </td>
                <td className="py-1 px-1 text-center font-mono font-semibold">
                  {sub.seqAMark !== null ? sub.seqAMark.toFixed(1) : "-"}
                </td>
                <td className="py-1 px-1 text-center font-mono font-bold bg-zinc-50/30">
                  {sub.termAverage !== null ? sub.termAverage.toFixed(2) : "-"}
                </td>
                <td className="py-1 px-1 text-center font-mono font-bold">
                  {sub.coefficient}
                </td>
                <td className="py-1 px-1 text-center font-mono font-bold bg-zinc-50/30">
                  {sub.weightedScore !== null ? sub.weightedScore.toFixed(2) : "-"}
                </td>
                <td className="py-1 px-1 text-center font-bold font-mono">
                  <span className={`px-1 py-0.5 rounded text-[8.5px] ${
                    sub.cba === "EXP" ? "bg-green-100 text-green-900" :
                    sub.cba === "SA" ? "bg-emerald-50 text-emerald-800" :
                    sub.cba === "SPA" ? "bg-amber-100 text-amber-900" :
                    "bg-red-50 text-red-800"
                  }`}>
                    {sub.grade} ({sub.cba})
                  </span>
                </td>
                <td className="py-1 px-1 text-center font-mono text-[8px] text-zinc-600">
                  [{sub.minClassScore.toFixed(1)} – {sub.maxClassScore.toFixed(1)}]
                </td>
                <td className="py-1 px-1.5 text-[8px] italic text-zinc-800">
                  {sub.remarks}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black font-bold divide-x divide-black bg-zinc-100/90 text-center text-[10px]">
              <td colSpan={4} className="py-1 px-2 text-right uppercase">
                TOTAL COEFFICIENTS &amp; WEIGHTED SCORES:
              </td>
              <td className="py-1 px-1 font-mono">{summary.totalCoef}</td>
              <td className="py-1 px-1 font-mono">{summary.totalWeightedScore.toFixed(2)}</td>
              <td colSpan={3} className="py-1 px-2 text-left bg-zinc-200/80">
                STUDENT AVERAGE:{" "}
                <span className="font-extrabold text-[12px] font-mono text-black">
                  {summary.studentAverage.toFixed(2)} / 20.00
                </span>
                {summary.rankingEnabled && summary.rank && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-black text-white text-[9px] font-mono font-bold">
                    RANK: {summary.rank}e
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── 5. DISCIPLINE, PERFORMANCE & CLASS PROFILE MATRIX ─────────────────── */}
      <div className="grid grid-cols-12 border-b-2 border-black divide-x divide-black text-[9px]">
        {/* Box A: Discipline */}
        <div className="col-span-4 p-1.5 space-y-1">
          <div className="font-black text-[9.5px] uppercase border-b border-black pb-0.5 mb-1">
            Discipline
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <div>Unjustified Abs. (h): <strong className="font-mono">{discipline.unjustifiedAbsHours}</strong></div>
            <div>Conduct Warning: <strong>{discipline.warning ? "[✓]" : "[ ]"}</strong></div>
            <div>Justified Abs. (h): <strong className="font-mono">{discipline.justifiedAbsHours}</strong></div>
            <div>Reprimand: <strong>{discipline.reprimand ? "[✓]" : "[ ]"}</strong></div>
            <div>Late (nbr of times): <strong className="font-mono">{discipline.lateCount}</strong></div>
            <div>Suspension: <strong>{discipline.suspension ? "[✓]" : "[ ]"}</strong></div>
            <div>Punishment (hours): <strong className="font-mono">{discipline.punishmentHours}</strong></div>
            <div>Dismissed: <strong>{discipline.dismissed ? "[✓]" : "[ ]"}</strong></div>
          </div>
        </div>

        {/* Box B: Student Performance */}
        <div className="col-span-4 p-1.5 space-y-1 bg-zinc-50/40">
          <div className="font-black text-[9.5px] uppercase border-b border-black pb-0.5 mb-1">
            Student Performance
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>TOTAL SCORE:</span>
              <strong className="font-mono">{summary.totalWeightedScore.toFixed(2)}</strong>
            </div>
            <div className="flex justify-between">
              <span>TOTAL COEFFICIENTS:</span>
              <strong className="font-mono">{summary.totalCoef}</strong>
            </div>
            <div className="flex justify-between font-bold border-t border-black/30 pt-0.5 text-[10px]">
              <span>TERM AVERAGE:</span>
              <strong className="font-mono underline text-black">{summary.studentAverage.toFixed(2)} / 20</strong>
            </div>
            <div className="flex justify-between text-[9px]">
              <span>Grade Appreciation:</span>
              <strong className="font-bold font-mono">{summary.letterGrade} ({summary.cbaAppreciation})</strong>
            </div>
            <div className="pt-1 text-[8px] flex items-center justify-between border-t border-black/20 text-zinc-700">
              <span className={summary.cbaAppreciation === "EXP" ? "font-black underline" : ""}>EXP [17-20]</span>
              <span className={summary.cbaAppreciation === "SA" ? "font-black underline" : ""}>SA [13-16.9]</span>
              <span className={summary.cbaAppreciation === "SPA" ? "font-black underline" : ""}>SPA [10-12.9]</span>
              <span className={summary.cbaAppreciation === "SNA" ? "font-black underline" : ""}>SNA [&lt;10]</span>
            </div>
          </div>
        </div>

        {/* Box C: Class Profile */}
        <div className="col-span-4 p-1.5 space-y-1">
          <div className="font-black text-[9.5px] uppercase border-b border-black pb-0.5 mb-1">
            Class Profile
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>Class Average:</span>
              <strong className="font-mono">{classProfile.classAverage.toFixed(2)} / 20</strong>
            </div>
            <div className="flex justify-between">
              <span>Class Extremes [Min – Max]:</span>
              <strong className="font-mono">[{classProfile.minAverage.toFixed(1)} – {classProfile.maxAverage.toFixed(1)}]</strong>
            </div>
            <div className="flex justify-between">
              <span>Number Passed:</span>
              <strong className="font-mono">{classProfile.numberPassed} / {classInfo.classEnrolment}</strong>
            </div>
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <strong className="font-mono">{classProfile.successRate.toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. SIGNATURES & REMARKS MATRIX ────────────────────────────────────── */}
      <div className="grid grid-cols-12 divide-x divide-black text-[9px] pt-1">
        <div className="col-span-4 p-2 space-y-1">
          <div className="font-bold underline uppercase text-[8.5px]">Remarks on Student Performance</div>
          <p className="italic text-[8.5px] text-zinc-800 leading-tight">
            &quot;{remarks.performanceRemarks}&quot;
          </p>
          <div className="pt-6 border-b border-dotted border-black/40 text-[8px] text-zinc-500">
            Parent&apos;s / Guardian&apos;s Signature
          </div>
        </div>

        <div className="col-span-4 p-2 space-y-1">
          <div className="font-bold underline uppercase text-[8.5px]">Class Master&apos;s Review</div>
          <p className="italic text-[8.5px] text-zinc-800 leading-tight">
            &quot;{remarks.classMasterRemarks}&quot;
          </p>
          <div className="pt-6 border-b border-dotted border-black/40 text-[8px] text-zinc-500">
            Class Master&apos;s Signature: {classInfo.classMasterName}
          </div>
        </div>

        <div className="col-span-4 p-2 space-y-1 text-center bg-zinc-50/30">
          <div className="font-black uppercase text-[9px]">The PRINCIPAL</div>
          <div className="text-[8px] text-zinc-600">Decision &amp; Institutional Visa</div>
          <div className="h-12 flex items-center justify-center font-serif italic text-zinc-400 text-xs">
            [ Official Seal &amp; Signature ]
          </div>
          <div className="text-[7.5px] font-mono text-zinc-500">
            Done at Bamenda, on {new Date().toLocaleDateString("en-GB")}
          </div>
        </div>
      </div>

      {/* Discrete independent software attribution */}
      <div className="pt-1 text-right text-[7px] text-zinc-400 font-mono">
        Generated via Nsei Skul Management System · Independent software provider to educational institutions
      </div>
    </div>
  );
}
