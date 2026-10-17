"use client";

import { useState, useTransition } from "react";
import { saveRollCallAction } from "@/app/attendance/actions";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  Check,
} from "lucide-react";

interface StudentRollItem {
  studentId: string;
  matricule: string;
  fullName: string;
  gender: string;
  status: "present" | "unjustified_absent" | "justified_absent" | "late" | "excused";
  hoursMissed: number;
  justificationNote: string;
}

interface RollCallClientProps {
  academicYearId: string;
  termId: string;
  classStreamId: string;
  sessionDate: string;
  students: StudentRollItem[];
}

export function RollCallClient({
  academicYearId,
  termId,
  classStreamId,
  sessionDate,
  students: initialStudents,
}: RollCallClientProps) {
  const [students, setStudents] = useState<StudentRollItem[]>(initialStudents);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleStatusChange = (
    index: number,
    newStatus: "present" | "unjustified_absent" | "justified_absent" | "late" | "excused"
  ) => {
    const updated = [...students];
    updated[index].status = newStatus;
    if (newStatus === "unjustified_absent" || newStatus === "justified_absent") {
      if (updated[index].hoursMissed === 0) {
        updated[index].hoursMissed = 2.0; // Standard 2-hour secondary block
      }
    } else if (newStatus === "present") {
      updated[index].hoursMissed = 0;
    }
    setStudents(updated);
  };

  const handleHoursChange = (index: number, val: string) => {
    const num = parseFloat(val) || 0;
    const updated = [...students];
    updated[index].hoursMissed = num;
    setStudents(updated);
  };

  const handleMarkAllPresent = () => {
    const updated = students.map((s) => ({
      ...s,
      status: "present" as const,
      hoursMissed: 0,
    }));
    setStudents(updated);
  };

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await saveRollCallAction({
        academicYearId,
        termId,
        classStreamId,
        sessionDate,
        records: students.map((s) => ({
          studentId: s.studentId,
          status: s.status,
          hoursMissed: s.hoursMissed,
          justificationNote: s.justificationNote,
        })),
      });

      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({
          type: "success",
          text: `Roll call for ${sessionDate} saved successfully. Absence hours synced to report cards.`,
        });
      }
    });
  };

  const presentCount = students.filter((s) => s.status === "present").length;
  const unjustifiedCount = students.filter((s) => s.status === "unjustified_absent").length;
  const justifiedCount = students.filter((s) => s.status === "justified_absent").length;
  const lateCount = students.filter((s) => s.status === "late").length;

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] hover:bg-[#FFF8CF]/40 text-[#142010] font-semibold text-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>Mark All Present</span>
          </button>
          <div className="h-4 w-px bg-[#E8DFC9] hidden sm:block" />
          <div className="text-[#525E4B]">
            Present: <strong className="text-[#2A7C13]">{presentCount}</strong> · Unjustified:{" "}
            <strong className="text-red-700">{unjustifiedCount}</strong> · Justified:{" "}
            <strong className="text-[#92400E]">{justifiedCount}</strong> · Late:{" "}
            <strong>{lateCount}</strong>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isPending || students.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isPending ? "Saving Roll Call..." : "Save Roll Call Sheet"}</span>
        </button>
      </div>

      {/* Message feedback */}
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

      {/* Roster Table */}
      <div className="bg-white rounded-[8px] border border-[#E8DFC9] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E8DFC9] bg-[#FFFDF5] text-[#525E4B] font-semibold text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Matricule</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3 text-center">Gender</th>
                <th className="py-2.5 px-3 w-64">Attendance Status</th>
                <th className="py-2.5 px-3 w-28 text-center">Hours Missed</th>
                <th className="py-2.5 px-3">Justification Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE0]">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#788470]">
                    No students enrolled in this class stream.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => (
                  <tr key={student.studentId} className="hover:bg-[#FFFDF5] transition-colors">
                    <td className="py-2 px-3 text-center font-mono text-[#788470]">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-[#142010]">
                      {student.matricule}
                    </td>
                    <td className="py-2 px-3 font-semibold text-[#142010]">
                      {student.fullName}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-[#525E4B]">
                      {student.gender}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(idx, "present")}
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                            student.status === "present"
                              ? "bg-[#2A7C13] text-white"
                              : "bg-zinc-100 text-[#525E4B] hover:bg-zinc-200"
                          }`}
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(idx, "unjustified_absent")}
                          title="Unjustified Absence"
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                            student.status === "unjustified_absent"
                              ? "bg-red-700 text-white"
                              : "bg-zinc-100 text-[#525E4B] hover:bg-zinc-200"
                          }`}
                        >
                          UA
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(idx, "justified_absent")}
                          title="Justified Absence"
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                            student.status === "justified_absent"
                              ? "bg-amber-600 text-white"
                              : "bg-zinc-100 text-[#525E4B] hover:bg-zinc-200"
                          }`}
                        >
                          JA
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(idx, "late")}
                          title="Late"
                          className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                            student.status === "late"
                              ? "bg-blue-600 text-white"
                              : "bg-zinc-100 text-[#525E4B] hover:bg-zinc-200"
                          }`}
                        >
                          L
                        </button>
                        <span className="text-[10px] text-[#788470] capitalize ml-1">
                          {student.status.replace("_", " ")}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="8"
                        disabled={student.status === "present"}
                        value={student.hoursMissed}
                        onChange={(e) => handleHoursChange(idx, e.target.value)}
                        className="w-16 px-2 py-1 text-center font-mono font-bold rounded-[4px] border border-[#E8DFC9] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13] disabled:bg-[#F5EFE0] disabled:text-[#788470]"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="e.g. Medical slip, transport..."
                        value={student.justificationNote}
                        onChange={(e) => {
                          const updated = [...students];
                          updated[idx].justificationNote = e.target.value;
                          setStudents(updated);
                        }}
                        className="w-full px-2 py-1 rounded-[4px] border border-[#E8DFC9] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
