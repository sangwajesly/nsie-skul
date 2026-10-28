"use client";

import { useTransition } from "react";
import { EvaluationSequence } from "@/types/database";
import { toggleSequenceMarksAction, setActiveSequenceAction } from "@/app/academics/actions";
import { Sparkles, CheckCircle2, Lock, Unlock, Loader2 } from "lucide-react";

interface Props {
  sequences: EvaluationSequence[];
}

export function AcademicSequencesManager({ sequences }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (sequenceId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("sequenceId", sequenceId);
      formData.set("isOpen", String(!currentStatus));
      try {
        await toggleSequenceMarksAction(formData);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to update sequence");
      }
    });
  };

  const handleSetSoleActive = (sequenceId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("activeSequenceId", sequenceId);
      try {
        await setActiveSequenceAction(formData);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to set active sequence");
      }
    });
  };

  const sortedSequences = [...sequences].sort(
    (a, b) => a.sequence_number - b.sequence_number
  );

  const activeSequencesCount = sortedSequences.filter((s) => s.is_open_for_marks).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm text-[#142010] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#2A7C13]" />
            <span>Evaluation Sequences &amp; Mark Entry Windows</span>
          </h3>
          <p className="text-xs text-[#525E4B]">
            Control which sequence assessment windows are currently open for teachers to enter marks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPending && <Loader2 className="w-4 h-4 text-[#2A7C13] animate-spin" />}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]">
            {activeSequencesCount > 0
              ? `${activeSequencesCount} window${activeSequencesCount > 1 ? "s" : ""} open`
              : "All windows closed"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {sortedSequences.map((seq) => {
          const termNumber = Math.ceil(seq.sequence_number / 2);
          const isOpen = Boolean(seq.is_open_for_marks);

          return (
            <div
              key={seq.id}
              className={`p-3 rounded-[8px] border transition-all shadow-2xs flex flex-col justify-between gap-3 ${
                isOpen
                  ? "bg-[#F3F9F1] border-[#C3E4BC] ring-1 ring-[#C3E4BC]"
                  : "bg-white border-[#E8DFC9] hover:border-[#D5CBB2]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-[#142010]">
                      {seq.name || `Sequence ${seq.sequence_number}`}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#F5F5F0] text-[#555555] font-mono text-[10px] font-bold">
                      Term {termNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#666666] mt-0.5">
                    {isOpen ? "Marks entry is open for staff" : "Window closed for marks"}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    isOpen
                      ? "bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]"
                      : "bg-[#F5F5F0] text-[#666666] border border-[#E0E0DB]"
                  }`}
                >
                  {isOpen ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-[#166534]" />
                      <span>Open</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-[#888888]" />
                      <span>Closed</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#E8DFC9]/50">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggle(seq.id, isOpen)}
                  className={`flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-[5px] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                    isOpen
                      ? "bg-white hover:bg-red-50 text-red-700 border border-red-200"
                      : "bg-[#2A7C13] hover:bg-[#20600E] text-white shadow-2xs"
                  }`}
                >
                  {isOpen ? (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Close Window</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" />
                      <span>Open for Marks</span>
                    </>
                  )}
                </button>

                {!isOpen && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSetSoleActive(seq.id)}
                    className="inline-flex items-center justify-center px-2 py-1 rounded-[5px] bg-[#F5F5F0] hover:bg-[#EAEAE5] text-[#191919] border border-[#D5D5CF] text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                    title="Close all others and make this the sole active assessment sequence"
                  >
                    <span>Set as Active</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
