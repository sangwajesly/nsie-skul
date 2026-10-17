"use client";

import { useState, useTransition } from "react";
import { saveSequenceMarksAction, approveDepartmentalSequenceAction } from "@/app/academics/actions";
import { getGradeAppreciation } from "@/lib/academic/grading";
import {
  Save,
  Lock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

interface StudentRow {
  studentId: string;
  matricule: string;
  fullName: string;
  gender: string;
  score: number | null;
  status: "present" | "absent" | "exempt";
  remarks: string;
  isLocked: boolean;
}

interface MarksGridClientProps {
  academicYearId: string;
  termId: string;
  sequenceId: string;
  classStreamId: string;
  subjectId: string;
  departmentId?: string;
  subjectName: string;
  coefficient: number;
  initialMaxMarks: number;
  isApproved: boolean;
  approverName?: string;
  approvedAt?: string;
  canApprove: boolean;
  students: StudentRow[];
}

export function MarksGridClient({
  academicYearId,
  termId,
  sequenceId,
  classStreamId,
  subjectId,
  departmentId,
  subjectName,
  coefficient,
  initialMaxMarks,
  isApproved,
  approverName,
  approvedAt,
  canApprove,
  students: initialStudents,
}: MarksGridClientProps) {
  const [students, setStudents] = useState<StudentRow[]>(initialStudents);
  const [maxMarks, setMaxMarks] = useState<number>(initialMaxMarks);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleScoreChange = (index: number, val: string) => {
    const num = val === "" ? null : parseFloat(val);
    const updated = [...students];
    updated[index].score = isNaN(num as number) ? null : num;
    if (num !== null && num > 0) {
      updated[index].status = "present";
    }
    setStudents(updated);
  };

  const handleStatusChange = (index: number, newStatus: "present" | "absent" | "exempt") => {
    const updated = [...students];
    updated[index].status = newStatus;
    if (newStatus !== "present") {
      updated[index].score = null;
    }
    setStudents(updated);
  };

  const handleRemarksChange = (index: number, rem: string) => {
    const updated = [...students];
    updated[index].remarks = rem;
    setStudents(updated);
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await saveSequenceMarksAction({
        academicYearId,
        termId,
        sequenceId,
        classStreamId,
        subjectId,
        maxMarks,
        marks: students.map((s) => ({
          studentId: s.studentId,
          score: s.score,
          status: s.status,
          remarks: s.remarks,
        })),
      });

      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({ type: "success", text: "Marks successfully saved and autosaved." });
      }
    });
  };

  const isLocked = isApproved || students.some((s) => s.isLocked);

  // Compute live averages
  const presentStudents = students.filter((s) => s.status === "present" && s.score !== null);
  const avgOutOf20 =
    presentStudents.length > 0
      ? (
          presentStudents.reduce((acc, curr) => acc + ((curr.score! / maxMarks) * 20), 0) /
          presentStudents.length
        ).toFixed(2)
      : null;

  return (
    <div className="space-y-4">
      {/* Action and Metric Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-[#525E4B]">Subject:</span>{" "}
            <strong className="text-[#142010] font-bold text-sm">{subjectName}</strong>
          </div>
          <div className="h-4 w-px bg-[#E8DFC9] hidden sm:block" />
          <div>
            <span className="text-[#525E4B]">Weight:</span>{" "}
            <span className="font-mono font-bold text-[#142010]">Coef {coefficient}</span>
          </div>
          <div className="h-4 w-px bg-[#E8DFC9] hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <label htmlFor="maxMarksInput" className="text-[#525E4B]">
              Max Denominator:
            </label>
            <input
              id="maxMarksInput"
              type="number"
              disabled={isLocked}
              value={maxMarks}
              onChange={(e) => setMaxMarks(parseFloat(e.target.value) || 20)}
              className="w-16 px-2 py-1 rounded-[5px] border border-[#E8DFC9] text-center font-mono font-bold text-xs bg-[#FFFDF5] focus:outline-none focus:border-[#2A7C13]"
            />
            <span className="text-[10px] text-[#788470]">(20 for general, 40-100 for technical)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Approved &amp; Locked</span>
            </span>
          ) : (
            <button
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isPending ? "Saving..." : "Save Mark Sheet"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-3 rounded-[6px] text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Interactive Mark Entry Grid */}
      <div className="bg-white rounded-[8px] border border-[#E8DFC9] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E8DFC9] bg-[#FFFDF5] text-[#525E4B] font-semibold text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Matricule</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3 w-32">Status</th>
                <th className="py-2.5 px-3 w-28 text-center">Score (/{maxMarks})</th>
                <th className="py-2.5 px-3 w-24 text-center">Score (/20)</th>
                <th className="py-2.5 px-3 w-32 text-center">CBA Grade</th>
                <th className="py-2.5 px-3">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE0]">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#788470]">
                    No students currently enrolled in this class stream.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => {
                  const normalized20 =
                    student.score !== null && maxMarks > 0
                      ? parseFloat(((student.score / maxMarks) * 20).toFixed(2))
                      : null;
                  const gradeInfo = getGradeAppreciation(normalized20);

                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-[#FFFDF5] transition-colors"
                    >
                      <td className="py-2 px-3 text-center text-[#788470] font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-[#142010]">
                        {student.matricule}
                      </td>
                      <td className="py-2 px-3 font-medium text-[#142010]">
                        {student.fullName}
                      </td>
                      <td className="py-2 px-3">
                        <select
                          disabled={isLocked}
                          value={student.status}
                          onChange={(e) =>
                            handleStatusChange(
                              idx,
                              e.target.value as "present" | "absent" | "exempt"
                            )
                          }
                          className="w-full px-2 py-1 rounded-[4px] border border-[#E8DFC9] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent (ABS)</option>
                          <option value="exempt">Exempt (EXC)</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max={maxMarks}
                          disabled={isLocked || student.status !== "present"}
                          placeholder={student.status === "present" ? "0.00" : "-"}
                          value={student.score ?? ""}
                          onChange={(e) => handleScoreChange(idx, e.target.value)}
                          className="w-20 px-2 py-1 text-center font-mono font-bold rounded-[4px] border border-[#E8DFC9] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13] disabled:bg-[#F5EFE0] disabled:text-[#788470]"
                        />
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-[#142010]">
                        {student.status === "present" && normalized20 !== null
                          ? normalized20.toFixed(2)
                          : "-"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {student.status === "present" && normalized20 !== null ? (
                          <span
                            className={`inline-flex items-center justify-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                              gradeInfo.cba === "EXP"
                                ? "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40"
                                : gradeInfo.cba === "SA"
                                ? "bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]"
                                : gradeInfo.cba === "SPA"
                                ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {gradeInfo.letter} · {gradeInfo.cba}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#788470] font-mono">
                            {student.status === "absent"
                              ? "ABS"
                              : student.status === "exempt"
                              ? "EXC"
                              : "-"}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          disabled={isLocked}
                          placeholder="Remark (optional)..."
                          value={student.remarks}
                          onChange={(e) => handleRemarksChange(idx, e.target.value)}
                          className="w-full px-2 py-1 rounded-[4px] border border-[#E8DFC9] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mark Sheet Summary Footer */}
        <div className="p-3 border-t border-[#E8DFC9] bg-[#FFFDF5] flex flex-wrap items-center justify-between text-xs text-[#525E4B]">
          <div>
            Total Candidates: <strong className="text-[#142010]">{students.length}</strong> · Present:{" "}
            <strong className="text-[#2A7C13]">{presentStudents.length}</strong> · Absent:{" "}
            <strong>{students.filter((s) => s.status === "absent").length}</strong>
          </div>
          {avgOutOf20 && (
            <div className="font-mono text-xs">
              Class Average: <strong className="text-[#142010] font-bold">{avgOutOf20} / 20.00</strong>
            </div>
          )}
        </div>
      </div>

      {/* HOD Review & Approval Gate Panel */}
      {departmentId && canApprove && (
        <div className="p-5 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2A7C13]" />
            <h3 className="font-bold text-sm text-[#142010]">
              Head of Department (HOD) Approval Gate
            </h3>
          </div>
          <p className="text-xs text-[#525E4B]">
            Once approved by the Department Head, marks for this sequence and class stream are formally
            locked and cannot be modified by teachers without an authorized correction log.
          </p>

          {isApproved ? (
            <div className="flex items-center gap-2 p-3 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] text-xs font-semibold border border-[#76C457]/40">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Approved by {approverName || "Department Head"}{" "}
                {approvedAt ? `on ${new Date(approvedAt).toLocaleDateString()}` : ""}
              </span>
            </div>
          ) : (
            <form
              action={async (formData: FormData) => {
                const res = await approveDepartmentalSequenceAction(formData);
                if (res?.error) {
                  setMessage({ type: "error", text: res.error });
                } else {
                  setMessage({
                    type: "success",
                    text: "Department sequence marks formally approved and locked.",
                  });
                }
              }}
              className="pt-2"
            >
              <input type="hidden" name="sequenceId" value={sequenceId} />
              <input type="hidden" name="classStreamId" value={classStreamId} />
              <input type="hidden" name="departmentId" value={departmentId} />
              <input type="hidden" name="academicYearId" value={academicYearId} />
              <input type="hidden" name="termId" value={termId} />

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  name="notes"
                  placeholder="Optional review endorsement note..."
                  className="w-full sm:flex-1 px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#2A7C13]"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
                >
                  Formally Approve &amp; Lock Sequence Marks
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
