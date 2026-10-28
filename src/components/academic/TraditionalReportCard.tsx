import React from "react";
import { ReportCardFullData } from "@/lib/academic/report-card-service";

interface TraditionalReportCardProps {
  data: ReportCardFullData;
}

function getLetterGrade(mark: number | null): string {
  if (mark === null) return "—";
  if (mark >= 16) return "A";
  if (mark >= 14) return "B";
  if (mark >= 12) return "C";
  if (mark >= 10) return "D";
  if (mark >= 8) return "E";
  return "F";
}

function getGradeRemark(mark: number | null): string {
  if (mark === null) return "Unevaluated";
  if (mark >= 16) return "Excellent";
  if (mark >= 14) return "Very Good";
  if (mark >= 12) return "Good";
  if (mark >= 10) return "Satisfactory / Pass";
  if (mark >= 8) return "Weak / Fair";
  return "Very Poor";
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

export function TraditionalReportCard({ data }: TraditionalReportCardProps) {
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

  const maleCount = classInfo.maleEnrolment ?? 0;
  const femaleCount = classInfo.femaleEnrolment ?? 0;
  const totalCount = classInfo.classEnrolment ?? (maleCount + femaleCount);

  // Overall pass/fail status
  const isPassed = (summary.studentAverage ?? 0) >= 10.0;

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
          <div className="text-[8px] font-mono font-bold tracking-wider uppercase text-zinc-800">
            {school.code || "GBHS"} · CAMEROON
          </div>
          <div className="text-[7.5px] italic text-zinc-600 font-serif">
            "{school.motto || "Laborare et Orante"}"
          </div>
        </div>

        {/* Francophone Subsystem Header (Right) */}
        <div className="col-span-4 text-center space-y-0.5 text-[8.5px] uppercase font-bold tracking-tight">
          <div>RÉPUBLIQUE DU CAMEROUN</div>
          <div className="text-[7.5px] font-normal italic lowercase">Paix – Travail – Patrie</div>
          <div className="text-[6.5px]">*************</div>
          <div>MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES</div>
          <div>DÉLÉGATION RÉGIONALE DE {school.regionalDelegation}</div>
          <div>DÉLÉGATION DÉPARTEMENTALE DE {school.divisionalDelegation}</div>
          <div className="text-[9.5px] font-extrabold pt-0.5">{school.name}</div>
        </div>
      </div>

      {/* ── 2. REPORT CARD SYSTEM BANNER ────────────────────────────────────────── */}
      <div className="border-b-2 border-black bg-zinc-100 py-1.5 px-3 flex items-center justify-between text-center font-bold">
        <div className="text-[9px] uppercase font-mono tracking-wider">
          ACADEMIC YEAR: <span className="font-black text-[10px]">{term.academicYearName}</span>
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-[13px] font-black uppercase tracking-wider underline underline-offset-2">
            OFFICIAL STUDENT REPORT CARD · {term.name.toUpperCase()}
          </h1>
          <div className="text-[8.5px] uppercase tracking-widest text-zinc-700 font-semibold">
            TRADITIONAL NUMERICAL MARKS &amp; GRADES SYSTEM
          </div>
        </div>
        <div className="text-[9px] uppercase font-mono tracking-wider">
          CLASS: <span className="font-black text-[10px] text-black">{classInfo.streamName}</span>
        </div>
      </div>

      {/* ── 3. STUDENT PROFILE MATRIX ─────────────────────────────────────────── */}
      <div className="border-b-2 border-black text-[9.5px]">
        {/* Row 1: Full Name */}
        <div className="p-1.5 border-b border-black/40 flex items-center justify-between bg-zinc-50/50">
          <div>
            <span className="font-bold text-zinc-700 uppercase">Student Name:</span>{" "}
            <span className="font-black uppercase text-[12px] tracking-wide text-black ml-1.5">
              {student.fullName}
            </span>
          </div>
          <div className="text-[9px] text-zinc-600 font-mono">
            Matricule / Reg No: <strong className="text-black text-[10.5px]">{student.matricule}</strong>
          </div>
        </div>

        {/* Row 2: DOB, POB, Sex, Repeater */}
        <div className="grid grid-cols-12 border-b border-black/40 divide-x divide-black/40 p-0 text-[9px]">
          <div className="col-span-5 p-1.5">
            <span className="font-bold text-zinc-700">Date of Birth:</span>{" "}
            <span className="font-mono">{student.dateOfBirth || "—"}</span>{" "}
            <span className="font-bold text-zinc-700 ml-1">Place:</span>{" "}
            <span>{student.placeOfBirth || "—"}</span>
          </div>
          <div className="col-span-3 p-1.5">
            <span className="font-bold text-zinc-700">Gender:</span>{" "}
            <span className="font-bold">
              {student.gender === "M" ? "Male (M)" : "Female (F)"}
            </span>
          </div>
          <div className="col-span-4 p-1.5 flex items-center gap-2">
            <span className="font-bold text-zinc-700">Repeater Status:</span>
            <span className={`px-1.5 py-0.2 rounded font-mono ${student.isRepeater ? "font-black bg-red-100 text-red-900 border border-red-300" : "font-bold text-black"}`}>
              {student.isRepeater ? "Repeater [Yes]" : "Non-Repeater [No]"}
            </span>
          </div>
        </div>

        {/* Row 3: Class Roster Info & Class Master */}
        <div className="grid grid-cols-12 divide-x divide-black/40 p-0 text-[9px]">
          <div className="col-span-4 p-1.5">
            <span className="font-bold text-zinc-700">Matricule / ID:</span>{" "}
            <span className="font-bold font-mono text-[10px]">{student.matricule || "—"}</span>
          </div>
          <div className="col-span-4 p-1.5">
            <span className="font-bold text-zinc-700">Class Enrolment:</span>{" "}
            <span className="font-bold font-mono">
              {totalCount} students ({maleCount} Boys, {femaleCount} Girls)
            </span>
          </div>
          <div className="col-span-4 p-1.5">
            <span className="font-bold text-zinc-700">Class Master / Form Tutor:</span>{" "}
            <span className="font-bold text-black uppercase">{classInfo.classMasterName}</span>
          </div>
        </div>
      </div>

      {/* ── 4. TRADITIONAL ACADEMIC RESULTS TABLE (PURE NUMERICAL MARKS & GRADES) ── */}
      <div className="overflow-x-auto border-b-2 border-black">
        <table className="w-full text-left border-collapse text-[9.5px]">
          <thead>
            <tr className="border-b-2 border-black bg-zinc-200/90 font-black text-center divide-x divide-black text-[9px] uppercase">
              <th className="py-1.5 px-2 w-48 text-left">Subject &amp; Teacher</th>
              <th className="py-1.5 px-1 w-12">Seq 1 /20</th>
              <th className="py-1.5 px-1 w-12">Seq 2 /20</th>
              <th className="py-1.5 px-1 w-14 bg-zinc-300/60">Term Mark</th>
              <th className="py-1.5 px-1 w-10">Coef</th>
              <th className="py-1.5 px-1 w-14 bg-zinc-300/60">Total (M×C)</th>
              <th className="py-1.5 px-1 w-11">Grade</th>
              <th className="py-1.5 px-1 w-12">Rank</th>
              <th className="py-1.5 px-1 w-12">Class Avg</th>
              <th className="py-1.5 px-1 w-16">[Min – Max]</th>
              <th className="py-1.5 px-2 w-40 text-left">Teacher´s Remarks &amp; Visa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/40">
            {subjects.map((sub, idx) => {
              const letterGrade = getLetterGrade(sub.termAverage);
              const remark = getGradeRemark(sub.termAverage);
              return (
                <tr
                  key={sub.subjectId}
                  className={`divide-x divide-black/30 align-middle ${
                    idx % 2 === 1 ? "bg-zinc-50/40" : "bg-white"
                  }`}
                >
                  <td className="py-1.5 px-2 font-bold uppercase text-[9.5px]">
                    <div>{sub.subjectName}</div>
                    <div className="text-[8px] font-normal italic text-zinc-600 capitalize">
                      {sub.teacherName}
                    </div>
                  </td>
                  <td className="py-1 px-1 text-center font-mono font-semibold">
                    {sub.seqAMark !== null ? sub.seqAMark.toFixed(1) : "//"}
                  </td>
                  <td className="py-1 px-1 text-center font-mono font-semibold">
                    {sub.seqBMark !== null ? sub.seqBMark.toFixed(1) : "//"}
                  </td>
                  <td className="py-1 px-1 text-center font-mono font-black text-[10px] bg-zinc-100/60">
                    {sub.termAverage !== null ? sub.termAverage.toFixed(1) : "//"}
                  </td>
                  <td className="py-1 px-1 text-center font-mono font-bold">{sub.coefficient}</td>
                  <td className="py-1 px-1 text-center font-mono font-bold bg-zinc-100/60">
                    {sub.weightedScore !== null ? sub.weightedScore.toFixed(1) : "//"}
                  </td>
                  <td className="py-1 px-1 text-center font-mono font-black text-[10px]">
                    <span
                      className={`px-1 py-0.2 rounded ${
                        letterGrade === "A" || letterGrade === "B"
                          ? "bg-green-100 text-green-900 font-black"
                          : letterGrade === "E" || letterGrade === "F"
                          ? "bg-red-100 text-red-900 font-black"
                          : "text-black"
                      }`}
                    >
                      {letterGrade}
                    </span>
                  </td>
                  <td className="py-1 px-1 text-center font-mono font-semibold text-[9px]">
                    {sub.subjectRank ? `${sub.subjectRank}` : "—"}
                  </td>
                  <td className="py-1 px-1 text-center font-mono text-zinc-700">
                    {sub.subjectAverage !== null && sub.subjectAverage !== undefined ? sub.subjectAverage.toFixed(1) : "—"}
                  </td>
                  <td className="py-1 px-1 text-center font-mono text-[8px] text-zinc-600">
                    [{sub.minClassScore.toFixed(1)} – {sub.maxClassScore.toFixed(1)}]
                  </td>
                  <td className="py-1 px-2 text-[8.5px]">
                    <div className="font-semibold text-zinc-800">{remark}</div>
                    <div className="text-[7.5px] text-zinc-500 italic mt-0.5 border-t border-dotted border-zinc-300 pt-0.5">
                      Signature: ____________
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 5. PERFORMANCE SUMMARY, DISCIPLINE & COUNCIL DELIBERATIONS ───────────── */}
      <div className="grid grid-cols-12 divide-x-2 divide-black text-[9px]">
        {/* Box 1: Term Academic Performance Breakdown */}
        <div className="col-span-5 p-2 space-y-1.5">
          <div className="font-black uppercase text-[10px] border-b border-black pb-0.5 text-zinc-900 flex items-center justify-between">
            <span>Academic Performance Summary</span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] ${isPassed ? "bg-green-100 text-green-900 font-black" : "bg-red-100 text-red-900 font-black"}`}>
              {isPassed ? "PASSED TERM [✓]" : "FAILED TERM [✗]"}
            </span>
          </div>

          <div className="space-y-1 pt-1 font-mono text-[9px]">
            <div className="flex justify-between border-b border-dotted border-black/30 pb-0.5">
              <span className="font-sans font-bold">Total Weighted Score:</span>
              <span className="font-black text-[10.5px]">
                {summary.totalWeightedScore?.toFixed(2) || "—"} / {((summary.totalCoef || 0) * 20).toFixed(0)}
              </span>
            </div>

            <div className="flex justify-between border-b border-dotted border-black/30 pb-0.5">
              <span className="font-sans font-bold">Total Coefficients:</span>
              <span className="font-bold">{summary.totalCoef?.toFixed(1) || "—"}</span>
            </div>

            <div className="flex justify-between border-b border-black pb-1 bg-zinc-100 p-1 rounded">
              <span className="font-sans font-black text-[10.5px]">STUDENT TERM AVERAGE:</span>
              <span className="font-black text-[13px] text-black">
                {summary.studentAverage !== null ? `${summary.studentAverage.toFixed(2)} / 20` : "—"}
              </span>
            </div>

            <div className="flex justify-between border-b border-black pb-1 bg-zinc-200/60 p-1 rounded">
              <span className="font-sans font-black text-[10px]">CLASS RANK / POSITION:</span>
              <span className="font-black text-[12px] text-black">
                {formatRank(summary.rank, totalCount)}
              </span>
            </div>

            <div className="flex justify-between pt-0.5 text-[8.5px]">
              <span className="font-sans">Class General Average:</span>
              <span className="font-bold">{classProfile.classAverage?.toFixed(2) || "—"} / 20</span>
            </div>

            <div className="flex justify-between text-[8.5px]">
              <span className="font-sans">Class Range [Lowest / Highest]:</span>
              <span className="font-bold font-mono">
                [{classProfile.minAverage?.toFixed(2) || "—"} / {classProfile.maxAverage?.toFixed(2) || "—"}]
              </span>
            </div>

            <div className="flex justify-between text-[8.5px]">
              <span className="font-sans">Subjects Passed / Evaluated:</span>
              <span className="font-bold">
                {summary.subjectsPassed} / {summary.totalSubjects}
              </span>
            </div>

            <div className="flex justify-between text-[8.5px]">
              <span className="font-sans">Class Success Rate:</span>
              <span className="font-bold">
                {classProfile.numberPassed} of {totalCount} passed ({classProfile.successRate?.toFixed(1) || "—"}%)
              </span>
            </div>
          </div>
        </div>

        {/* Box 2: Discipline & Conduct Record */}
        <div className="col-span-3 p-2 space-y-1.5">
          <div className="font-black uppercase text-[10px] border-b border-black pb-0.5 text-zinc-900">
            Student Conduct &amp; Discipline
          </div>

          <div className="space-y-1 pt-1 font-mono text-[8.5px]">
            <div className="flex justify-between border-b border-dotted border-black/30 pb-0.5">
              <span className="font-sans">Unjustified Absences:</span>
              <span className="font-bold">{discipline.unjustifiedAbsHours || 0} hrs</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-black/30 pb-0.5">
              <span className="font-sans">Justified Absences:</span>
              <span className="font-bold">{discipline.justifiedAbsHours || 0} hrs</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-black/30 pb-0.5">
              <span className="font-sans">Lateness Record:</span>
              <span className="font-bold">{discipline.lateCount || 0} times</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-black/30 pb-0.5">
              <span className="font-sans">Punishment:</span>
              <span className="font-bold">{discipline.punishmentHours || 0} hrs</span>
            </div>
          </div>

          <div className="border-t border-black pt-1 space-y-0.5 text-[8px] font-sans">
            <div className="font-bold text-[8.5px] uppercase text-zinc-700">Council Sanctions:</div>
            <div className="grid grid-cols-2 gap-1 pt-0.5">
              <div>Warning: {discipline.warning ? "[✓] Yes" : "[ ] No"}</div>
              <div>Reprimand: {discipline.reprimand ? "[✓] Yes" : "[ ] No"}</div>
              <div>Suspension: {discipline.suspension ? "[✓] Yes" : "[ ] No"}</div>
              <div>Dismissal: {discipline.dismissed ? "[✓] Yes" : "[ ] No"}</div>
            </div>
          </div>
        </div>

        {/* Box 3: Class Master & Principal's Council Observations & Stamps */}
        <div className="col-span-4 p-2 flex flex-col justify-between text-[9px] space-y-2">
          {/* Form Tutor Appreciations */}
          <div>
            <div className="font-black uppercase text-[9.5px] border-b border-black pb-0.5 flex items-center justify-between">
              <span>Class Master´s Remarks</span>
              <span className="text-[7.5px] font-normal italic lowercase font-serif">Avis du Professeur Titulaire</span>
            </div>
            <div className="mt-1 p-1.5 bg-zinc-50 border border-zinc-200 rounded min-h-[38px] text-[8.5px] italic leading-tight text-zinc-900">
              "{remarks.classMasterRemarks || remarks.performanceRemarks || "Satisfactory general academic work this term. Encourage continuous study and punctuality."}"
            </div>
            <div className="mt-1 text-right text-[8px] font-mono">
              Signature: __________________
            </div>
          </div>

          {/* Principal Approval and Institution Seal */}
          <div className="border-t-2 border-black pt-1">
            <div className="font-black uppercase text-[9.5px] flex items-center justify-between">
              <span>Principal´s Decision &amp; Seal</span>
              <span className="text-[7.5px] font-normal italic lowercase font-serif">Visa du Chef d'Établissement</span>
            </div>
            <div className="mt-1 p-1 bg-zinc-100 font-bold text-[8.5px] border border-black/30 rounded text-center">
              {isPassed ? "★ CONGRATULATIONS: ENCOURAGEMENT & HONORS ★" : "⚠ ACADEMIC WARNING: WORK HARDER NEXT TERM"}
            </div>
            <div className="mt-2 flex items-center justify-between text-[8px]">
              <div>
                Date: <span className="font-mono">{new Date().toLocaleDateString("en-GB")}</span>
              </div>
              <div className="border border-dashed border-black/60 px-3 py-2 text-center text-[7.5px] uppercase font-mono text-zinc-600">
                Official School Seal &amp; Stamp
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
