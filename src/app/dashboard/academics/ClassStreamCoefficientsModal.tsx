"use client";

import { useState, useActionState, useEffect } from "react";
import { SlidersHorizontal, X, Check, Save } from "lucide-react";
import { updateStreamCoefficientsBatchAction } from "@/app/academics/actions";

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  default_coefficient: number;
  default_max_marks: number;
}

interface ClassSubjectConfig {
  subject_id: string;
  coefficient: number;
  max_marks: number;
}

interface Props {
  streamId: string;
  streamName: string;
  subjects: SubjectOption[];
  currentConfigs: ClassSubjectConfig[];
  buttonLabel?: string;
  buttonClassName?: string;
}

export function ClassStreamCoefficientsModal({
  streamId,
  streamName,
  subjects,
  currentConfigs,
  buttonLabel,
  buttonClassName,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    updateStreamCoefficientsBatchAction,
    null
  );

  const configMap = new Map<string, ClassSubjectConfig>();
  currentConfigs.forEach((c) => configMap.set(c.subject_id, c));

  useEffect(() => {
    if (state && "success" in state && state.success) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          buttonClassName ||
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#FAFAF8] hover:bg-[#F5F5F0] text-[#191919] border border-[#D5D5CF] transition-colors shadow-2xs cursor-pointer select-none"
        }
        title={`Configure subject coefficients for ${streamName}`}
      >
        <SlidersHorizontal className="w-3 h-3 text-[#2A7C13]" />
        <span>{buttonLabel || "Class Coefs"}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-[#E5E5DF] shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#EEEEEC] flex items-center justify-between bg-[#FAFAF8]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#191919]" />
            <div>
              <h3 className="text-sm font-bold text-[#191919]">
                Subject Coefficients: {streamName}
              </h3>
              <p className="text-[11px] text-[#777777]">
                Set the weight (coefficient) of each subject specifically for {streamName}. Only subjects assigned to a teacher for this class in &quot;Teacher Allocations&quot; (or with recorded marks) will appear on student report cards.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded text-[#888888] hover:text-[#191919] hover:bg-[#EAEAE6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form action={formAction} className="flex-1 overflow-y-auto p-4 space-y-4">
          <input type="hidden" name="classStreamId" value={streamId} />

          {subjects.length === 0 ? (
            <p className="text-xs text-[#777777] py-6 text-center">
              No subjects registered in the school yet. Add subjects first.
            </p>
          ) : (
            <div className="border border-[#EEEEEC] rounded-md overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F6F6F4] text-[#666666] font-semibold border-b border-[#EEEEEC]">
                  <tr>
                    <th className="py-2 px-3">Subject</th>
                    <th className="py-2 px-3 text-center">Default Coef</th>
                    <th className="py-2 px-3 w-32">Class Coef</th>
                    <th className="py-2 px-3 w-28">Max Mark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEEEC]">
                  {subjects.map((sub) => {
                    const cfg = configMap.get(sub.id);
                    const effectiveCoef = cfg?.coefficient ?? sub.default_coefficient ?? 2;
                    const effectiveMax = cfg?.max_marks ?? sub.default_max_marks ?? 20;

                    return (
                      <tr key={sub.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-2 px-3">
                          <div className="font-medium text-[#191919]">{sub.name}</div>
                          <div className="font-mono text-[10px] text-[#777777]">{sub.code}</div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[#777777]">
                          {sub.default_coefficient}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            name={`coef_${sub.id}`}
                            defaultValue={effectiveCoef}
                            step="0.5"
                            min="0.5"
                            max="15"
                            required
                            aria-label={`Coefficient for ${sub.name}`}
                            className="w-full px-2.5 py-1 text-xs font-mono font-bold rounded border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            name={`max_${sub.id}`}
                            defaultValue={effectiveMax}
                            step="1"
                            min="5"
                            max="100"
                            required
                            aria-label={`Max mark for ${sub.name}`}
                            className="w-full px-2.5 py-1 text-xs font-mono rounded border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {state && (
            <div
              className={`p-2.5 rounded text-xs ${
                "error" in state
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-800 border border-green-200 flex items-center gap-1.5"
              }`}
            >
              {"success" in state && <Check className="w-3.5 h-3.5 shrink-0 text-green-700" />}
              <span>{"error" in state ? state.error : state.message}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#EEEEEC] flex items-center justify-end gap-2 bg-white">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded text-xs font-medium text-[#666666] hover:bg-[#F1F1ED] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || subjects.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#191919] hover:bg-[#333333] text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isPending ? "Saving..." : "Save Coefficients"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
