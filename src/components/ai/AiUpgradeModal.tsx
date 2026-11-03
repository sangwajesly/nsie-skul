"use client";

import { useState } from "react";
import {
  Sparkles,
  X,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  School,
  ArrowRight,
  Lock,
} from "lucide-react";

interface AiUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName?: string;
  onPaymentInitiated?: (details: {
    plan: "term" | "year";
    amount: number;
    phone: string;
    operator: "mtn" | "orange";
  }) => Promise<void> | void;
}

export function AiUpgradeModal({
  isOpen,
  onClose,
  teacherName = "Teacher",
  onPaymentInitiated,
}: AiUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"term" | "year">("term");
  const [operator, setOperator] = useState<"mtn" | "orange">("mtn");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSent, setPaymentSent] = useState(false);

  if (!isOpen) return null;

  const amount = selectedPlan === "term" ? 1000 : 2500;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setIsSubmitting(true);
    try {
      if (onPaymentInitiated) {
        await onPaymentInitiated({
          plan: selectedPlan,
          amount,
          phone: phoneNumber.trim(),
          operator,
        });
      }
      setPaymentSent(true);
    } catch (err) {
      console.error("[AI Payment Error]", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-lg rounded-[16px] bg-[#FFFDF5] border border-[#E8DFC9] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="bg-[#142010] text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#76C457] text-[11px] font-bold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sukul AI Pro Assistant</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Work 10x Faster with AI
          </h2>
          <p className="text-xs sm:text-[13px] text-[#A6B8A0] mt-1 leading-relaxed">
            Eliminate hours of clerical exhaustion during Class Councils and mark submissions.
          </p>
        </div>

        {paymentSent ? (
          /* Payment Initiated Confirmation */
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center mx-auto border border-[#76C457]/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#142010]">
              Mobile Money Prompt Sent!
            </h3>
            <p className="text-xs text-[#525E4B] max-w-sm mx-auto leading-relaxed">
              Please check your phone ({phoneNumber}) and authorize the prompt for{" "}
              <strong>{amount.toLocaleString()} FCFA</strong> on your {operator.toUpperCase()} account.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentSent(false);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-[7px] bg-[#2A7C13] text-white text-xs font-bold hover:bg-[#20600E] transition-colors"
              >
                Close &amp; Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-2.5 text-xs text-[#525E4B]">
              <div className="flex items-start gap-2 p-2.5 rounded-[8px] bg-white border border-[#E8DFC9]">
                <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                <span>
                  <strong>MINESEC CBA Remarks:</strong> Tailored student appreciations in 2 seconds.
                </span>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-[8px] bg-white border border-[#E8DFC9]">
                <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                <span>
                  <strong>Phone Marksheet OCR:</strong> Snap a photo to digitize paper test marks.
                </span>
              </div>
            </div>

            {/* Plan Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">
                Choose Your Personal Pass
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Term Pass */}
                <div
                  onClick={() => setSelectedPlan("term")}
                  className={`cursor-pointer p-3.5 rounded-[12px] border transition-all ${
                    selectedPlan === "term"
                      ? "border-[#2A7C13] bg-[#EAF7E4]/50 shadow-xs ring-1 ring-[#2A7C13]"
                      : "border-[#E8DFC9] bg-white hover:border-[#2A7C13]/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#142010]">Term Pass</span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#FAF8F2] text-[#788470] border border-[#E8DFC9]">
                      2 Sequences
                    </span>
                  </div>
                  <div className="text-lg font-black text-[#2A7C13] font-mono mt-1">
                    1,000 FCFA
                  </div>
                  <div className="text-[10px] text-[#788470] mt-0.5">
                    Valid for the current term
                  </div>
                </div>

                {/* Academic Year Pass */}
                <div
                  onClick={() => setSelectedPlan("year")}
                  className={`cursor-pointer p-3.5 rounded-[12px] border transition-all relative ${
                    selectedPlan === "year"
                      ? "border-[#2A7C13] bg-[#EAF7E4]/50 shadow-xs ring-1 ring-[#2A7C13]"
                      : "border-[#E8DFC9] bg-white hover:border-[#2A7C13]/60"
                  }`}
                >
                  <div className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full bg-[#B45309] text-white text-[9px] font-bold">
                    Best Value
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#142010]">Annual Pass</span>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]">
                      Full Year
                    </span>
                  </div>
                  <div className="text-lg font-black text-[#2A7C13] font-mono mt-1">
                    2,500 FCFA
                  </div>
                  <div className="text-[10px] text-[#788470] mt-0.5">
                    All 3 Terms (Save 500 FCFA)
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details Form */}
            <form onSubmit={handlePay} className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">
                  Payment Method (Cameroon)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOperator("mtn")}
                    className={`py-2 px-3 rounded-[8px] text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      operator === "mtn"
                        ? "bg-[#FFCC00] text-[#142010] border-[#E0A800] shadow-2xs font-extrabold"
                        : "bg-white text-[#525E4B] border-[#E8DFC9]"
                    }`}
                  >
                    <span>MTN Mobile Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperator("orange")}
                    className={`py-2 px-3 rounded-[8px] text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      operator === "orange"
                        ? "bg-[#FF6600] text-white border-[#E05500] shadow-2xs font-extrabold"
                        : "bg-white text-[#525E4B] border-[#E8DFC9]"
                    }`}
                  >
                    <span>Orange Money</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#525E4B]">
                  Your {operator === "mtn" ? "MTN" : "Orange"} Number:
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-[#788470] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={operator === "mtn" ? "670 000 000" : "690 000 000"}
                    className="w-full pl-9 pr-3 py-2 rounded-[8px] border border-[#E8DFC9] bg-white text-xs font-mono font-bold text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
                <p className="text-[10px] text-[#788470]">
                  You will receive an instant payment prompt on your phone screen.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !phoneNumber.trim()}
                  className="w-full py-2.5 rounded-[8px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <>
                      <span>Pay {amount.toLocaleString()} FCFA with {operator.toUpperCase()}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* School License Note */}
            <div className="pt-3 border-t border-[#E8DFC9] flex items-center justify-between text-[11px] text-[#788470]">
              <div className="flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-[#2A7C13]" />
                <span>Want your school to pay?</span>
              </div>
              <span className="text-[#2A7C13] font-semibold">
                Ask Principal for School License
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
