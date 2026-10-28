import React from "react";
import { ReportCardFullData, SubjectRowData } from "@/lib/academic/report-card-service";

interface GroupedClassicReportCardProps {
  data: ReportCardFullData;
}

function getAppreciationBadge(mark: number | null): { label: string; bg: string; text: string } {
  if (mark === null) {
    return { label: "Not acquired", bg: "bg-red-50", text: "text-red-800" };
  }
  if (mark >= 17) {
    return { label: "Expert", bg: "bg-emerald-100", text: "text-emerald-900" };
  }
  if (mark >= 13) {
    return { label: "Acquired", bg: "bg-green-100", text: "text-green-900" };
  }
  if (mark >= 10) {
    return { label: "Skill in the process of Acquisition", bg: "bg-amber-100", text: "text-amber-900" };
  }
  return { label: "Not acquired", bg: "bg-red-50", text: "text-red-800" };
}

function formatRank(rank: number | null | undefined, total: number): string {
  if (!rank) return "—";
  const j = rank % 10;
  const k = rank % 100;
  let suffix = "th";
  if (j === 1 && k !== 11) suffix = "st";
  else if (j === 2 && k !== 12) suffix = "nd";
  else if (j === 3 && k !== 13) suffix = "rd";
  return `${rank}${suffix} / ${total}`;
}

export function GroupedClassicReportCard({ data }: GroupedClassicReportCardProps) {
  const {
    school,
    term,
    student,
    classInfo,
    subjects,
    summary,
    classProfile,
    discipline,
  } = data;

  // Split subjects by groups
  const group1Subjects = subjects.filter((s) => s.subjectGroup === "group_1");
  const group2Subjects = subjects.filter((s) => s.subjectGroup === "group_2");
  const group3Subjects = subjects.filter((s) => s.subjectGroup === "group_3");

  const calcGroupTotals = (rows: SubjectRowData[]) => {
    let coef = 0;
    let nxc = 0;
    for (const r of rows) {
      if (r.termAverage !== null) {
        coef += r.coefficient;
        nxc += r.weightedScore || 0;
      }
    }
    const avg = coef > 0 ? parseFloat((nxc / coef).toFixed(2)) : 0;
    return { coef, nxc: parseFloat(nxc.toFixed(2)), avg };
  };

  const g1Totals = calcGroupTotals(group1Subjects);
  const g2Totals = calcGroupTotals(group2Subjects);
  const g3Totals = calcGroupTotals(group3Subjects);

  const maleCount = classInfo.maleEnrolment ?? 0;
  const femaleCount = classInfo.femaleEnrolment ?? 0;
  const totalCount = classInfo.classEnrolment ?? (maleCount + femaleCount);

  return (
    <div className="bg-white text-black p-4 sm:p-5 max-w-[1020px] mx-auto border-2 border-black font-sans text-[10.5px] leading-snug print:p-0 print:border-none print:max-w-none print:w-full">
      {/* ── 1. BILINGUAL NATIONAL HEADER ────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-2 border-b-2 border-black pb-2 items-center text-center">
        {/* Anglophone Subsystem Header (Left) */}
        <div className="col-span-4 text-center space-y-0.5 text-[8.5px] uppercase font-bold tracking-tight">
          <div>REPUBLIC OF CAMEROON</div>
          <div className="text-[7.5px] font-normal italic lowercase">Peace – Work – Fatherland</div>
          <div className="text-[6.5px]">*************</div>
          <div>MINISTRY OF SECONDARY EDUCATION</div>
          <div>REGIONAL DELEGATION OF {school.regionalDelegation}</div>
          <div>DIVISIONAL DELEGATION OF {school.divisionalDelegation}</div>
          <div className="text-[9.5px] font-extrabold pt-0.5">{school.name}</div>
        </div>

        {/* Center: School Seal & Motto */}
        <div className="col-span-4 flex flex-col items-center justify-center text-center p-1">
          <div className="w-14 h-14 border border-black rounded-full flex items-center justify-center overflow-hidden bg-zinc-50 mb-1">
            {school.logo_url ? (
              <img
                src={school.logo_url}
                alt={`${school.name} logo`}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="font-extrabold text-[11px] font-mono">{school.code || "SEAL"}</span>
            )}
          </div>
          <div className="text-[8.5px] font-serif italic text-zinc-700">Knowledge – Integrity – Excellence</div>
          <div className="text-[7.5px] font-mono text-zinc-600 mt-0.5">{school.address}</div>
        </div>

        {/* Francophone Subsystem Header (Right) */}
        <div className="col-span-4 text-center space-y-0.5 text-[8.5px] uppercase font-bold tracking-tight">
          <div>RÉPUBLIQUE DU CAMEROUN</div>
          <div className="text-[7.5px] font-normal italic lowercase">Paix – Travail – Patrie</div>
          <div className="text-[6.5px]">*************</div>
          <div>MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES</div>
          <div>DÉLÉGATION RÉGIONALE DU {school.regionalDelegation}</div>
          <div>DÉLÉGATION DÉPARTEMENTALE DU {school.divisionalDelegation}</div>
          <div className="text-[9.5px] font-extrabold pt-0.5">{school.name}</div>
        </div>
      </div>

      {/* ── 2. TRIMESTRE / CLASS / ENROLLMENT BANNER ──────────────────────────── */}
      <div className="border-b-2 border-black bg-zinc-100/90 py-1.5 px-3 flex flex-wrap items-center justify-between text-[10px] font-bold">
        <div className="space-y-0.5">
          <div>
            <span className="uppercase text-[#191919]">Trimestre:</span>{" "}
            <span className="text-black font-extrabold text-[11px]">
              {term.termNumber} {term.name.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="uppercase text-zinc-600">ANNEE SCOLAIRE / ACADEMIC YEAR:</span>{" "}
            <span className="font-mono">{term.academicYearName}</span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-[12px] font-black uppercase tracking-wider text-black">
            CLASSE / CLASS: {classInfo.streamName.toUpperCase()}
          </div>
        </div>

        <div className="text-right space-y-0.5">
          <div>
            <span className="uppercase text-zinc-600">Effectif / Enrollment:</span>{" "}
            <span className="font-mono text-black font-extrabold text-[11px]">{totalCount}</span>
          </div>
          <div className="text-[9px] font-mono text-zinc-700">
            M: <span className="font-bold text-black">{maleCount}</span> &nbsp;|&nbsp;
            F: <span className="font-bold text-black">{femaleCount}</span> &nbsp;|&nbsp;
            T: <span className="font-bold text-black">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* ── 3. STUDENT PROFILE MATRIX ─────────────────────────────────────────── */}
      <div className="border-b-2 border-black text-[9.5px]">
        {/* Row 1: Full Name */}
        <div className="p-1.5 border-b border-black/40 flex items-center justify-between bg-zinc-50/50">
          <div>
            <span className="font-bold text-zinc-700 uppercase">Noms et Prénoms / Full name:</span>{" "}
            <span className="font-black uppercase text-[12px] tracking-wide text-black ml-1.5">
              {student.fullName}
            </span>
          </div>
          <div className="text-[9px] text-zinc-600 font-mono">
            Matr. / Reg No: <strong className="text-black text-[10.5px]">{student.matricule}</strong>
          </div>
        </div>

        {/* Row 2: DOB, POB, Sex, Repeater */}
        <div className="grid grid-cols-12 border-b border-black/40 divide-x divide-black/40 p-0 text-[9px]">
          <div className="col-span-5 p-1.5">
            <span className="font-bold text-zinc-700">Né(e) le / Born on:</span>{" "}
            <span className="font-mono">{student.dateOfBirth || "—"}</span>{" "}
            <span className="font-bold text-zinc-700 ml-1">à / At:</span>{" "}
            <span>{student.placeOfBirth || "—"}</span>
          </div>
          <div className="col-span-3 p-1.5">
            <span className="font-bold text-zinc-700">Sexe / Sex:</span>{" "}
            <span className="font-bold">
              {student.gender === "M" ? "Masculin / Male (M)" : "Féminin / Female (F)"}
            </span>
          </div>
          <div className="col-span-4 p-1.5 flex items-center gap-2">
            <span className="font-bold text-zinc-700">Redoublant? / Repeating?:</span>
            <span className={`px-1.5 py-0.2 rounded font-mono ${student.isRepeater ? "font-black bg-red-100 text-red-900 border border-red-300" : "font-bold text-black"}`}>
              {student.isRepeater ? "Oui / Yes [✓]" : "Non / No [✓]"}
            </span>
          </div>
        </div>

        {/* Row 3: Parent Contact & Class Master */}
        <div className="grid grid-cols-12 divide-x divide-black/40 p-0 text-[9px]">
          <div className="col-span-6 p-1.5">
            <span className="font-bold text-zinc-700">Parent´s Contact:</span>{" "}
            <span>
              {student.guardianName || "—"} {student.guardianPhone ? `(${student.guardianPhone})` : ""}
            </span>
          </div>
          <div className="col-span-6 p-1.5">
            <span className="font-bold text-zinc-700">Prof Titulaire / Class Master:</span>{" "}
            <span className="font-bold text-black uppercase">{classInfo.classMasterName}</span>
          </div>
        </div>
      </div>

      {/* ── 4. MAIN ASSESSMENT TABLE (GROUP 1, 2, 3) ───────────────────────────── */}
      <div className="overflow-x-auto border-b-2 border-black">
        <table className="w-full text-left border-collapse text-[9px]">
          <thead>
            <tr className="border-b-2 border-black bg-zinc-200/90 font-black text-center divide-x divide-black text-[9px] uppercase">
              <th className="py-1 px-1.5 w-44 text-left">Subjects / Teacher´s name</th>
              <th className="py-1 px-1 w-11">Seq 1</th>
              <th className="py-1 px-1 w-11">Seq 2</th>
              <th className="py-1 px-1 w-12 bg-zinc-300/60">Term. N</th>
              <th className="py-1 px-1 w-9">Coef</th>
              <th className="py-1 px-1 w-12 bg-zinc-300/60">N x C</th>
              <th className="py-1 px-1 w-10">Rank</th>
              <th className="py-1 px-1 w-11">AVG</th>
              <th className="py-1 px-1 w-16">[Min / Max]</th>
              <th className="py-1 px-1.5 w-36 text-center">Appreciation</th>
              <th className="py-1 px-1 w-14 text-center">Signature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/40">
            {/* ── GROUP 1: FIRST GROUP SUBJECTS / LANGUAGES & HUMANITIES ── */}
            {group1Subjects.length > 0 && (
              <>
                <tr className="bg-zinc-100 font-extrabold uppercase text-[8.5px] border-y border-black">
                  <td colSpan={11} className="py-0.5 px-2 tracking-wider text-black">
                    GROUP 1: FIRST GROUP SUBJECTS / LANGUAGES &amp; HUMANITIES
                  </td>
                </tr>
                {group1Subjects.map((sub) => {
                  const badge = getAppreciationBadge(sub.termAverage);
                  return (
                    <tr key={sub.subjectId} className="divide-x divide-black/30 align-middle hover:bg-zinc-50/50">
                      <td className="py-1 px-1.5 font-bold uppercase text-[9px]">
                        <div>{sub.subjectName}</div>
                        <div className="text-[7.5px] font-normal italic text-zinc-600 capitalize">
                          {sub.teacherName}
                        </div>
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-semibold">
                        {sub.seqAMark !== null ? sub.seqAMark.toFixed(1) : "//"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-semibold">
                        {sub.seqBMark !== null ? sub.seqBMark.toFixed(1) : "//"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-black text-[9.5px] bg-zinc-100/60">
                        {sub.termAverage !== null ? sub.termAverage.toFixed(1) : "//"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-bold">{sub.coefficient}</td>
                      <td className="py-1 px-1 text-center font-mono font-bold bg-zinc-100/60">
                        {sub.weightedScore !== null ? sub.weightedScore.toFixed(1) : "//"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-bold text-zinc-800">
                        {sub.subjectRank ? `${sub.subjectRank}` : "—"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono text-zinc-700">
                        {sub.subjectAverage !== null && sub.subjectAverage !== undefined
                          ? sub.subjectAverage.toFixed(1)
                          : "—"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono text-[8px] text-zinc-600">
                        [{sub.minClassScore.toFixed(1)} – {sub.maxClassScore.toFixed(1)}]
                      </td>
                      <td className="py-0.5 px-1.5 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-1 px-1 text-center border-dashed border-black/20"></td>
                    </tr>
                  );
                })}
                {/* Group 1 Subtotal */}
                <tr className="bg-zinc-100/80 font-bold border-t border-black text-[8.5px] divide-x divide-black/40">
                  <td colSpan={4} className="py-0.5 px-2 text-right uppercase font-bold text-zinc-700">
                    Sous-Total Groupe 1 / Group 1 Subtotal:
                  </td>
                  <td className="py-0.5 px-1 text-center font-mono font-bold">{g1Totals.coef}</td>
                  <td className="py-0.5 px-1 text-center font-mono font-bold">{g1Totals.nxc.toFixed(1)}</td>
                  <td colSpan={5} className="py-0.5 px-2 text-left font-mono text-[8.5px]">
                    Moyenne Groupe 1: <strong className="text-black">{g1Totals.avg.toFixed(2)} / 20</strong>
                  </td>
                </tr>
              </>
            )}

            {/* ── GROUP 2: SCIENCES & TECHNOLOGY / COMMERCIAL ── */}
            {group2Subjects.length > 0 && (
              <>
                <tr className="bg-zinc-100 font-extrabold uppercase text-[8.5px] border-y border-black">
                  <td colSpan={11} className="py-0.5 px-2 tracking-wider text-black">
                    GROUP 2: SCIENCES &amp; TECHNOLOGY / COMMERCIAL
                  </td>
                </tr>
                {group2Subjects.map((sub) => {
                  const badge = getAppreciationBadge(sub.termAverage);
                  return (
                    <tr key={sub.subjectId} className="divide-x divide-black/30 align-middle hover:bg-zinc-50/50">
                      <td className="py-1 px-1.5 font-bold uppercase text-[9px]">
                        <div>{sub.subjectName}</div>
                        <div className="text-[7.5px] font-normal italic text-zinc-600 capitalize">
                          {sub.teacherName}
                        </div>
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-semibold">
                        {sub.seqAMark !== null ? sub.seqAMark.toFixed(1) : "//"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-semibold">
                        {sub.seqBMark !== null ? sub.seqBMark.toFixed(1) : "//"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-black text-[9.5px] bg-zinc-100/60">
                        {sub.termAverage !== null ? sub.termAverage.toFixed(1) : "//"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-bold">{sub.coefficient}</td>
                      <td className="py-1 px-1 text-center font-mono font-bold bg-zinc-100/60">
                        {sub.weightedScore !== null ? sub.weightedScore.toFixed(1) : "//"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-bold text-zinc-800">
                        {sub.subjectRank ? `${sub.subjectRank}` : "—"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono text-zinc-700">
                        {sub.subjectAverage !== null && sub.subjectAverage !== undefined
                          ? sub.subjectAverage.toFixed(1)
                          : "—"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono text-[8px] text-zinc-600">
                        [{sub.minClassScore.toFixed(1)} – {sub.maxClassScore.toFixed(1)}]
                      </td>
                      <td className="py-0.5 px-1.5 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-1 px-1 text-center border-dashed border-black/20"></td>
                    </tr>
                  );
                })}
                {/* Group 2 Subtotal */}
                <tr className="bg-zinc-100/80 font-bold border-t border-black text-[8.5px] divide-x divide-black/40">
                  <td colSpan={4} className="py-0.5 px-2 text-right uppercase font-bold text-zinc-700">
                    Sous-Total Groupe 2 / Group 2 Subtotal:
                  </td>
                  <td className="py-0.5 px-1 text-center font-mono font-bold">{g2Totals.coef}</td>
                  <td className="py-0.5 px-1 text-center font-mono font-bold">{g2Totals.nxc.toFixed(1)}</td>
                  <td colSpan={5} className="py-0.5 px-2 text-left font-mono text-[8.5px]">
                    Moyenne Groupe 2: <strong className="text-black">{g2Totals.avg.toFixed(2)} / 20</strong>
                  </td>
                </tr>
              </>
            )}

            {/* ── GROUPE 3: OTHER SUBJECTS / PRACTICAL & SPORTS ── */}
            {group3Subjects.length > 0 && (
              <>
                <tr className="bg-zinc-100 font-extrabold uppercase text-[8.5px] border-y border-black">
                  <td colSpan={11} className="py-0.5 px-2 tracking-wider text-black">
                    GROUPE 3: OTHER SUBJECTS / PRACTICAL &amp; SPORTS
                  </td>
                </tr>
                {group3Subjects.map((sub) => {
                  const badge = getAppreciationBadge(sub.termAverage);
                  return (
                    <tr key={sub.subjectId} className="divide-x divide-black/30 align-middle hover:bg-zinc-50/50">
                      <td className="py-1 px-1.5 font-bold uppercase text-[9px]">
                        <div>{sub.subjectName}</div>
                        <div className="text-[7.5px] font-normal italic text-zinc-600 capitalize">
                          {sub.teacherName}
                        </div>
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-semibold">
                        {sub.seqAMark !== null ? sub.seqAMark.toFixed(1) : "//"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-semibold">
                        {sub.seqBMark !== null ? sub.seqBMark.toFixed(1) : "//"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-black text-[9.5px] bg-zinc-100/60">
                        {sub.termAverage !== null ? sub.termAverage.toFixed(1) : "//"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-bold">{sub.coefficient}</td>
                      <td className="py-1 px-1 text-center font-mono font-bold bg-zinc-100/60">
                        {sub.weightedScore !== null ? sub.weightedScore.toFixed(1) : "//"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-bold text-zinc-800">
                        {sub.subjectRank ? `${sub.subjectRank}` : "—"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono text-zinc-700">
                        {sub.subjectAverage !== null && sub.subjectAverage !== undefined
                          ? sub.subjectAverage.toFixed(1)
                          : "—"}
                      </td>
                      <td className="py-1 px-1 text-center font-mono text-[8px] text-zinc-600">
                        [{sub.minClassScore.toFixed(1)} – {sub.maxClassScore.toFixed(1)}]
                      </td>
                      <td className="py-0.5 px-1.5 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-1 px-1 text-center border-dashed border-black/20"></td>
                    </tr>
                  );
                })}
                {/* Group 3 Subtotal */}
                <tr className="bg-zinc-100/80 font-bold border-t border-black text-[8.5px] divide-x divide-black/40">
                  <td colSpan={4} className="py-0.5 px-2 text-right uppercase font-bold text-zinc-700">
                    Sous-Total Groupe 3 / Group 3 Subtotal:
                  </td>
                  <td className="py-0.5 px-1 text-center font-mono font-bold">{g3Totals.coef}</td>
                  <td className="py-0.5 px-1 text-center font-mono font-bold">{g3Totals.nxc.toFixed(1)}</td>
                  <td colSpan={5} className="py-0.5 px-2 text-left font-mono text-[8.5px]">
                    Moyenne Groupe 3: <strong className="text-black">{g3Totals.avg.toFixed(2)} / 20</strong>
                  </td>
                </tr>
              </>
            )}
          </tbody>

          {/* ── GRAND TOTAL ROW ── */}
          <tfoot>
            <tr className="border-t-2 border-black font-black divide-x divide-black bg-zinc-200 text-center text-[10px]">
              <td colSpan={4} className="py-1 px-2 text-right uppercase tracking-wider">
                TOTAL GENERAL / GRAND TOTAL:
              </td>
              <td className="py-1 px-1 font-mono text-[10.5px]">{summary.totalCoef}</td>
              <td className="py-1 px-1 font-mono text-[10.5px]">{summary.totalWeightedScore.toFixed(1)}</td>
              <td colSpan={5} className="py-1 px-2 text-left bg-zinc-300/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="uppercase text-[9px] font-bold">TERM AVERAGE / MOYENNE TRIMESTRIELLE:</span>{" "}
                    <span className="font-extrabold text-[12px] font-mono text-black ml-1">
                      {summary.studentAverage.toFixed(2)} / 20.00
                    </span>
                  </div>
                  {summary.rankingEnabled && summary.rank && (
                    <span className="px-2 py-0.5 rounded bg-black text-white text-[9px] font-mono font-bold">
                      RANK: {formatRank(summary.rank, totalCount)}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── 5. SUMMARY OF THE TERM & OBSERVATIONS (Side-by-side exact match) ────── */}
      <div className="grid grid-cols-12 border-b-2 border-black divide-x-2 divide-black text-[9.5px]">
        {/* Box Left: SUMMARY OF THE TERM */}
        <div className="col-span-6 p-2 space-y-1.5">
          <div className="font-black text-[10px] uppercase border-b border-black pb-0.5 tracking-wider bg-zinc-100 px-1 -mx-1">
            SUMMARY OF THE TERM / BILAN DU TRIMESTRE
          </div>
          <div className="space-y-1 divide-y divide-black/20 text-[9px]">
            <div className="flex justify-between pt-0.5">
              <span className="text-zinc-700">First sequence average:</span>
              <span className="font-mono font-bold">
                {summary.seqAAverage !== null && summary.seqAAverage !== undefined
                  ? `${summary.seqAAverage.toFixed(2)} / 20`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between pt-0.5 font-bold text-[10.5px] text-black">
              <span>Term average / Moyenne:</span>
              <span className="font-mono underline font-extrabold">
                {summary.studentAverage.toFixed(2)} / 20
              </span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-zinc-700">Term Rank / Rang:</span>
              <span className="font-mono font-bold text-black">
                {summary.rankingEnabled && summary.rank ? formatRank(summary.rank, totalCount) : "—"}
              </span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-zinc-700">Class Average / Moyenne Générale:</span>
              <span className="font-mono font-bold">{classProfile.classAverage.toFixed(2)} / 20</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-zinc-700">Class first Average / Plus Forte Moy.:</span>
              <span className="font-mono font-bold">{classProfile.maxAverage.toFixed(2)} / 20</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-zinc-700">Class last Average / Plus Faible Moy.:</span>
              <span className="font-mono font-bold">{classProfile.minAverage.toFixed(2)} / 20</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-zinc-700">Appreciation:</span>
              <span className="font-mono font-bold uppercase text-black">
                {summary.studentAverage >= 16 ? "Very Good / Très Bien"
                  : summary.studentAverage >= 14 ? "Good / Bien"
                  : summary.studentAverage >= 12 ? "Fairly Good / Assez Bien"
                  : summary.studentAverage >= 10 ? "Average / Passable"
                  : "Below Average / Insuffisant"}
              </span>
            </div>
          </div>
        </div>

        {/* Box Right: OBSERVATIONS & DISCIPLINE */}
        <div className="col-span-6 p-2 space-y-1.5">
          <div className="font-black text-[10px] uppercase border-b border-black pb-0.5 tracking-wider bg-zinc-100 px-1 -mx-1">
            OBSERVATIONS &amp; DISCIPLINE
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
            <div className="flex justify-between border-b border-black/20 pb-0.5">
              <span className="text-zinc-700">Honor Roll / Tableau:</span>
              <span className="font-bold font-mono">
                {summary.studentAverage >= 12 ? "Yes / Oui [✓]" : "No / Non"}
              </span>
            </div>
            <div className="flex justify-between border-b border-black/20 pb-0.5">
              <span className="text-zinc-700">Result Decision:</span>
              <span className={`font-black font-mono ${summary.studentAverage >= 10 ? "text-emerald-800" : "text-red-700"}`}>
                {summary.studentAverage >= 10 ? "Passed / Admis" : "Failed / Échec"}
              </span>
            </div>
            <div className="flex justify-between border-b border-black/20 pb-0.5">
              <span className="text-zinc-700">Congratulation:</span>
              <span className="font-mono font-bold">
                {summary.studentAverage >= 14 ? "[✓] Félicitations" : "[ ]"}
              </span>
            </div>
            <div className="flex justify-between border-b border-black/20 pb-0.5">
              <span className="text-zinc-700">Lateness:</span>
              <span className="font-mono font-bold">{discipline.lateCount} time(s)</span>
            </div>
            <div className="flex justify-between border-b border-black/20 pb-0.5">
              <span className="text-zinc-700">Orders Warning:</span>
              <span className="font-mono font-bold">
                {discipline.reprimand ? "[✓] Avert. Conduite" : "[ ]"}
              </span>
            </div>
            <div className="flex justify-between border-b border-black/20 pb-0.5">
              <span className="text-zinc-700">Justified Absences:</span>
              <span className="font-mono font-bold">{discipline.justifiedAbsHours} hr(s)</span>
            </div>
            <div className="flex justify-between border-b border-black/20 pb-0.5">
              <span className="text-zinc-700">Warning Punishment:</span>
              <span className="font-mono font-bold">
                {discipline.warning ? "[✓] Avert. Travail" : "[ ]"}
              </span>
            </div>
            <div className="flex justify-between border-b border-black/20 pb-0.5">
              <span className="text-zinc-700">Temporal Exclusion:</span>
              <span className="font-mono font-bold">
                {discipline.suspension ? "[✓] Exclusion temp." : "[ ]"}
              </span>
            </div>
            <div className="col-span-2 flex justify-between pt-0.5">
              <span className="text-zinc-700">Punishment hours / Heures retenue:</span>
              <span className="font-mono font-bold">{discipline.punishmentHours} hr(s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. SIGNATURES & VISAS ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 divide-x-2 divide-black text-[9px] pt-2">
        {/* Class Master */}
        <div className="col-span-4 p-2 text-center flex flex-col justify-between h-28">
          <div>
            <div className="font-black uppercase text-[9.5px]">CLASS MASTER / PROF TITULAIRE</div>
            <div className="text-[8px] text-zinc-600 mt-0.5">{classInfo.classMasterName}</div>
          </div>
          <div className="text-[7.5px] italic text-zinc-400 border-t border-dotted border-black/40 pt-1">
            Signature &amp; Date
          </div>
        </div>

        {/* Principal Visa & Seal */}
        <div className="col-span-4 p-2 text-center flex flex-col justify-between h-28 bg-zinc-50/40">
          <div>
            <div className="text-[8px] font-mono text-zinc-700">
              Done in Yaounde / Bamenda, on {new Date().toLocaleDateString("en-GB")}
            </div>
            <div className="font-black uppercase text-[10px] mt-1">The Principal / Le Chef d&apos;Établissement</div>
          </div>
          <div className="font-serif italic text-zinc-400 text-[10px]">
            [ Institutional Seal &amp; Signature ]
          </div>
          <div className="border-t border-dotted border-black/40 text-[7.5px] text-zinc-500 pt-0.5">
            Visa du Chef d&apos;Établissement
          </div>
        </div>

        {/* Parent Signature */}
        <div className="col-span-4 p-2 text-center flex flex-col justify-between h-28">
          <div>
            <div className="font-black uppercase text-[9.5px]">SIGNATURE OF PARENTS / PARENT</div>
            <div className="text-[8px] text-zinc-600 mt-0.5">Visa du Parent / Tuteur</div>
          </div>
          <div className="text-[7.5px] italic text-zinc-400 border-t border-dotted border-black/40 pt-1">
            Parent&apos;s Signature
          </div>
        </div>
      </div>

      {/* Software attribution */}
      <div className="pt-2 text-right text-[7.5px] text-zinc-400 font-mono">
        Template: Cameroon CBA Grouped Classic &bull; Generated via Nsei Skul Management System
      </div>
    </div>
  );
}
