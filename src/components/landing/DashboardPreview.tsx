/**
 * DashboardPreview
 * ─────────────────────────────────────────────────────────
 * A static, illustrative preview of the product interface.
 * All records shown are sample data only - no real school or student.
 * Uses Option A: Green & Cream educational palette.
 */

import { Users, BookOpen, Wallet, ClipboardList } from "lucide-react";

const SAMPLE_MARKS = [
  { subject: "Mathematics", coef: 4, seq1: "16", seq2: "14", avg: "15.0", grade: "A" },
  { subject: "Chemistry", coef: 3, seq1: "12", seq2: "13", avg: "12.5", grade: "B" },
  { subject: "English Lang.", coef: 3, seq1: "14", seq2: "15", avg: "14.5", grade: "A" },
  { subject: "Geography", coef: 2, seq1: "11", seq2: "10", avg: "10.5", grade: "C" },
];

const SAMPLE_STATS = [
  { label: "Students", value: "312", sub: "Enrolled this term", icon: Users },
  { label: "Classes", value: "11", sub: "Active streams", icon: BookOpen },
  { label: "Fees Collected", value: "9.4 M", sub: "FCFA · Term 1", icon: Wallet },
  { label: "Marks Entered", value: "78%", sub: "Seq. 1 complete", icon: ClipboardList },
];

export function DashboardPreview() {
  return (
    <div
      aria-label="Illustrative product interface preview"
      className="w-full rounded-[12px] border border-[#E8DFC9] bg-white shadow-[0_12px_40px_rgba(20,32,16,0.06)] overflow-hidden select-none"
      role="img"
    >
      {/* Window Chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#E8DFC9] bg-[#FFF8CF]/40">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E8DFC9]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#E8DFC9]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#E8DFC9]" />
        <span className="ml-3 text-[11px] text-[#525E4B] font-medium">
          Demo Secondary School · 2026/2027
        </span>
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/50">
          SAMPLE DATA
        </span>
      </div>

      <div className="flex min-h-0">
        {/* Sidebar */}
        <aside className="hidden sm:flex flex-col w-44 border-r border-[#E8DFC9] bg-[#FFFDF5] py-4 px-2 gap-0.5 shrink-0">
          {[
            { label: "Overview", active: false },
            { label: "Mark Entry", active: true },
            { label: "Departments", active: false },
            { label: "Student Roster", active: false },
            { label: "Fees & Receipts", active: false },
            { label: "Report Cards", active: false },
          ].map(({ label, active }) => (
            <div
              key={label}
              className={`px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors ${
                active
                  ? "bg-[#2A7C13] text-white font-semibold"
                  : "text-[#525E4B] hover:text-[#142010]"
              }`}
            >
              {label}
            </div>
          ))}
        </aside>

        {/* Main Content */}
        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {SAMPLE_STATS.map(({ label, value, sub, icon: Icon }) => (
              <div
                key={label}
                className="bg-white rounded-[8px] border border-[#E8DFC9] px-3 py-2.5 space-y-1 hover:border-[#76C457]/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-[#2A7C13]" aria-hidden="true" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#525E4B]">
                    {label}
                  </span>
                </div>
                <div className="text-[18px] font-extrabold font-mono text-[#142010] leading-none">
                  {value}
                </div>
                <div className="text-[10px] text-[#525E4B]">{sub}</div>
              </div>
            ))}
          </div>

          {/* Mark Entry Table */}
          <div className="bg-white rounded-[8px] border border-[#E8DFC9] overflow-hidden">
            <div className="px-3 py-2 border-b border-[#E8DFC9] bg-[#FFF8CF]/20 flex items-center justify-between">
              <div>
                <span className="text-[12px] font-bold text-[#142010]">
                  Form 4 Science A: Mark Entry
                </span>
                <span className="ml-2 text-[10px] text-[#525E4B]">Term 1 · Seq. 2</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]">
                In progress
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-[#E8DFC9] bg-[#FFFDF5]">
                    <th className="text-left px-3 py-1.5 font-semibold text-[#525E4B]">Subject</th>
                    <th className="text-center px-2 py-1.5 font-semibold text-[#525E4B]">Coef</th>
                    <th className="text-center px-2 py-1.5 font-semibold text-[#525E4B]">Seq 1</th>
                    <th className="text-center px-2 py-1.5 font-semibold text-[#525E4B]">Seq 2</th>
                    <th className="text-center px-2 py-1.5 font-semibold text-[#525E4B]">Avg</th>
                    <th className="text-center px-2 py-1.5 font-semibold text-[#525E4B]">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_MARKS.map(({ subject, coef, seq1, seq2, avg, grade }) => (
                    <tr key={subject} className="border-b border-[#F5EFE0] hover:bg-[#FFFDF5]">
                      <td className="px-3 py-2 font-medium text-[#142010]">{subject}</td>
                      <td className="px-2 py-2 text-center font-mono text-[#525E4B]">{coef}</td>
                      <td className="px-2 py-2 text-center font-mono text-[#142010]">{seq1}</td>
                      <td className="px-2 py-2 text-center font-mono text-[#142010]">{seq2}</td>
                      <td className="px-2 py-2 text-center font-mono font-bold text-[#142010]">{avg}</td>
                      <td className="px-2 py-2 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-[4px] text-[10px] font-bold ${
                            grade === "A"
                              ? "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40"
                              : grade === "B"
                              ? "bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]"
                              : "bg-[#FEF3C7] text-[#92400E]"
                          }`}
                        >
                          {grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
