"use client";

import { useState, useTransition } from "react";
import { recordDisciplinarySanctionAction } from "@/app/attendance/actions";
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
} from "lucide-react";

interface DisciplineModalClientProps {
  academicYearId: string;
  termId: string;
  classStreamId: string;
  students: Array<{ id: string; fullName: string; matricule: string }>;
}

export function DisciplineModalClient({
  academicYearId,
  termId,
  classStreamId,
  students,
}: DisciplineModalClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || "");
  const [sanctionType, setSanctionType] = useState<"warning" | "reprimand" | "suspension" | "punishment" | "dismissed">("warning");
  const [punishmentHours, setPunishmentHours] = useState(2);
  const [suspensionDays, setSuspensionDays] = useState(3);
  const [infractionReason, setInfractionReason] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const formData = new FormData();
    formData.append("studentId", selectedStudentId);
    formData.append("classStreamId", classStreamId);
    formData.append("academicYearId", academicYearId);
    formData.append("termId", termId);
    formData.append("sanctionType", sanctionType);
    formData.append("infractionReason", infractionReason);
    if (sanctionType === "punishment") {
      formData.append("punishmentHours", punishmentHours.toString());
    } else if (sanctionType === "suspension") {
      formData.append("suspensionDays", suspensionDays.toString());
    }

    startTransition(async () => {
      const res = await recordDisciplinarySanctionAction(formData);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setMessage({
          type: "success",
          text: "Sanction formally logged and synchronized to student's MINESEC report card profile.",
        });
        setInfractionReason("");
        setTimeout(() => setIsOpen(false), 1500);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setMessage(null);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#92400E] hover:bg-[#78350F] text-white font-semibold text-xs transition-colors shadow-xs"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Log Disciplinary Sanction</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[10px] border border-[#E8DFC9] shadow-xl w-full max-w-md overflow-hidden text-left space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#92400E]" />
                <h3 className="font-bold text-sm text-[#142010]">Record Disciplinary Action</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#788470] hover:text-[#142010] p-1 rounded hover:bg-[#FFFDF5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {message && (
              <div
                className={`p-2.5 rounded text-xs flex items-center gap-2 ${
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

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[#525E4B] mb-1">Student Candidate *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-white text-xs font-semibold focus:outline-none focus:border-[#2A7C13]"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.matricule})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#525E4B] mb-1">
                  MINESEC Sanction Type *
                </label>
                <select
                  value={sanctionType}
                  onChange={(e) => setSanctionType(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-white text-xs font-medium focus:outline-none focus:border-[#2A7C13]"
                >
                  <option value="warning">Conduct Warning (Avertissement de conduite)</option>
                  <option value="reprimand">Reprimand (Blâme)</option>
                  <option value="punishment">Manual Labour / Punishment (Corvée en heures)</option>
                  <option value="suspension">Temporary Suspension (Exclusion temporaire)</option>
                  <option value="dismissed">Definitive Dismissal (Exclusion définitive)</option>
                </select>
              </div>

              {sanctionType === "punishment" && (
                <div>
                  <label className="block font-medium text-[#525E4B] mb-1">
                    Punishment Duration (Hours) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={punishmentHours}
                    onChange={(e) => setPunishmentHours(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] font-mono font-bold text-xs focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
              )}

              {sanctionType === "suspension" && (
                <div>
                  <label className="block font-medium text-[#525E4B] mb-1">
                    Suspension Duration (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={suspensionDays}
                    onChange={(e) => setSuspensionDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] font-mono font-bold text-xs focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-[#525E4B] mb-1">
                  Infraction Reason / Disciplinary Motif *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe the student infraction..."
                  value={infractionReason}
                  onChange={(e) => setInfractionReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#2A7C13]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3.5 py-1.5 rounded-[5px] border border-[#E8DFC9] text-xs font-semibold text-[#142010] hover:bg-[#FFFDF5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !infractionReason}
                  className="px-4 py-1.5 rounded-[5px] bg-[#92400E] hover:bg-[#78350F] text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  {isPending ? "Logging Sanction..." : "Confirm & Save Sanction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
