"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, X, BookOpen, AlertCircle } from "lucide-react";
import { generateCbaRemarkAction } from "@/app/actions/ai-actions";
import { StudentPerformanceContext } from "@/lib/ai/prompts/cba-remarks";
import { AiUpgradeModal } from "./AiUpgradeModal";

interface CbaRemarkSuggesterProps {
  studentContext: StudentPerformanceContext;
  onSelectRemark: (remark: string) => void;
  className?: string;
}

export function CbaRemarkSuggester({
  studentContext,
  onSelectRemark,
  className = "",
}: CbaRemarkSuggesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ tone: string; text: string }[]>([]);
  const [source, setSource] = useState<"ai" | "offline_handbook">("ai");
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setIsOpen(true);
    try {
      const res = await generateCbaRemarkAction(studentContext);

      if (!res.success && res.error === "PAYWALL_REQUIRED") {
        setShowPaywall(true);
        setIsOpen(false);
        return;
      }

      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
        setSource(res.source);
        if (res.freeRemaining !== undefined) {
          setFreeRemaining(res.freeRemaining);
        }
      }
    } catch (err) {
      console.error("[CBA Remark Generator Error]", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`relative inline-block ${className}`}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#EAF7E4] hover:bg-[#D5EED0] text-[#2A7C13] border border-[#76C457]/40 text-[11px] font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          title="Suggest MINESEC Competency-Based Remark using AI"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-[#2A7C13]" />
          )}
          <span>Suggest Remark</span>
        </button>

        {/* Suggestions Popover Modal */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-1.5 z-40 w-80 sm:w-96 rounded-[12px] bg-white border border-[#E8DFC9] shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DFC9] mb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#2A7C13]" />
                <span className="font-bold text-xs text-[#142010]">
                  MINESEC CBA Suggestions
                </span>
              </div>
              <div className="flex items-center gap-2">
                {source === "offline_handbook" && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FAF8F2] text-[#788470] border border-[#E8DFC9]">
                    Offline Handbook
                  </span>
                )}
                {freeRemaining !== null && freeRemaining <= 5 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]">
                    {freeRemaining} Free Left
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full text-[#788470] hover:text-[#142010] hover:bg-[#FAF8F2]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#2A7C13] mx-auto" />
                <p className="text-xs text-[#525E4B]">
                  Analyzing {studentContext.score.toFixed(1)}/20 on MINESEC competency scale...
                </p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#788470]">
                No remarks generated. Try again or enter manually.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onSelectRemark(item.text);
                      setIsOpen(false);
                    }}
                    className="group cursor-pointer p-3 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9] hover:border-[#2A7C13] hover:bg-[#EAF7E4]/30 transition-all text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-[#2A7C13]">
                        {item.tone}
                      </span>
                      <span className="text-[10px] text-[#788470] group-hover:text-[#2A7C13] font-semibold flex items-center gap-0.5">
                        <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span>Click to use</span>
                      </span>
                    </div>
                    <p className="text-[#142010] leading-relaxed">
                      &ldquo;{item.text}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Paywall Upgrade Modal */}
      <AiUpgradeModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        teacherName={studentContext.studentName}
      />
    </>
  );
}
