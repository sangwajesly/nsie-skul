"use client";

import { useState } from "react";
import { ShieldCheck, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { updateTeacherPinAction } from "@/app/auth/actions";
import { useRouter } from "next/navigation";

interface FirstLoginPinModalProps {
  teacherName?: string;
}

export function FirstLoginPinModal({ teacherName = "Teacher" }: FirstLoginPinModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    if (newPin.length < 4 || newPin.length > 6) {
      setErrorMessage("Please enter a 4 to 6 digit PIN.");
      return;
    }
    if (newPin === "123456" || newPin === "0000" || newPin === "1234") {
      setErrorMessage("Please choose a safer PIN than 123456 or 0000 to prevent students from guessing it.");
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMessage("The two PINs do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.set("newPin", newPin);
    formData.set("confirmPin", confirmPin);

    try {
      const res = await updateTeacherPinAction(formData);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to save your PIN. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 1500);
    } catch {
      setErrorMessage("Network error saving PIN. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Set Personal Teacher PIN"
    >
      <div className="relative w-full max-w-md bg-[#FFFDF5] border-2 border-[#2A7C13] rounded-[12px] shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200">
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-[5px] text-[#777777] hover:text-[#142010] hover:bg-[#F0EFEA] transition-colors"
          title="Remind me later"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0 border border-[#C3E4BC]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#142010]">
              Protect Your Gradebook
            </h3>
            <p className="text-xs text-[#525E4B] mt-0.5 leading-snug">
              Welcome {teacherName}! You are currently on the initial default PIN (123456). Set your personal 4 to 6 digit PIN so students cannot guess your access or change marks.
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="p-3 rounded-[6px] bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#166534]" />
            <span>Personal PIN activated! Default PIN (123456) is now permanently disabled.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            {errorMessage && (
              <div className="p-2.5 rounded-[6px] bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label htmlFor="new-pin-input" className="block text-xs font-semibold text-[#444444] mb-1">
                New Personal PIN (4 to 6 digits) *
              </label>
              <div className="relative">
                <input
                  id="new-pin-input"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoFocus
                  disabled={isSubmitting}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 7842"
                  className="w-full pl-3 pr-10 py-2 text-sm font-mono tracking-widest rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] focus:border-[#2A7C13] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#888888] hover:text-[#142010]"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10.5px] text-[#788470] mt-1">
                Choose a number easy for you to remember, like a Mobile Money PIN.
              </p>
            </div>

            <div>
              <label htmlFor="confirm-pin-input" className="block text-xs font-semibold text-[#444444] mb-1">
                Confirm Personal PIN *
              </label>
              <input
                id="confirm-pin-input"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                maxLength={6}
                required
                disabled={isSubmitting}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Re-enter your PIN"
                className="w-full px-3 py-2 text-sm font-mono tracking-widest rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] focus:border-[#2A7C13] focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 rounded-[6px] text-xs font-semibold text-[#666666] hover:text-[#142010] hover:bg-[#F0EFEA] transition-colors"
              >
                Remind Me Later
              </button>

              <button
                type="submit"
                disabled={isSubmitting || newPin.length < 4}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving PIN…</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Save My Secret PIN</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
