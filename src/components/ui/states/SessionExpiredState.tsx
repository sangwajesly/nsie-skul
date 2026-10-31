"use client";

import React, { useState } from "react";
import { LogIn, Clock, AlertTriangle, ArrowRight, ShieldCheck, Lock } from "lucide-react";

export interface SessionExpiredModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
  returnUrl?: string;
  hasUnsavedChanges?: boolean;
}

/**
 * 8. SESSION EXPIRED (401 INACTIVITY STATE)
 * Protects teachers in computer labs / staff rooms from losing marks
 * when their Supabase JWT expires while typing.
 */
export function SessionExpiredModal({
  isOpen,
  onSuccess,
  returnUrl,
  hasUnsavedChanges = false,
}: SessionExpiredModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickReAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Post to our auth login endpoint
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Invalid credentials. Please verify your email and password.");
      } else {
        if (onSuccess) onSuccess();
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try signing in via the login page.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginRedirectUrl = `/login?redirect=${encodeURIComponent(
    returnUrl || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard")
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-[12px] bg-white border border-[#E8DFC9] p-6 sm:p-7 shadow-2xl space-y-4">
        {/* Header Icon */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-full bg-[#FFF8CF] text-[#B45309] shrink-0 border border-[#FBE6C2]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#142010]">
              Session Expired
            </h3>
            <p className="text-xs text-[#525E4B] mt-0.5 leading-relaxed">
              Your authentication session has timed out due to inactivity to protect school records.
            </p>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="p-3 rounded-[6px] bg-[#EAF7E4] border border-[#BBF7D0] text-xs text-[#166534] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2A7C13] shrink-0" />
            <span>
              <strong>Drafts Preserved:</strong> Your entered marks on this screen are cached in device storage. Sign in to resume seamlessly.
            </span>
          </div>
        )}

        {/* Quick Re-Auth Form */}
        <form onSubmit={handleQuickReAuth} className="space-y-3 pt-1">
          {error && (
            <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#444444] mb-1">
              Account Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. teacher@school.cm"
              className="w-full px-3 py-2 rounded-[5px] border border-[#D5CBB2] text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#444444] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-[5px] border border-[#D5CBB2] text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Authenticating..." : "Unlock & Continue Work"}</span>
            </button>

            <a
              href={loginRedirectUrl}
              className="w-full text-center py-2 text-xs font-semibold text-[#525E4B] hover:text-[#142010] transition-colors"
            >
              Go to Standard Sign-in Page
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SessionExpiredCard({
  returnUrl = "/dashboard",
  className = "",
}: {
  returnUrl?: string;
  className?: string;
}) {
  return (
    <div
      className={`p-8 rounded-[12px] bg-white border border-[#E8DFC9] shadow-2xs max-w-md mx-auto text-center space-y-4 ${className}`}
      role="alert"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFF8CF] text-[#B45309] border border-[#FBE6C2] mx-auto">
        <Lock className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-extrabold text-[#142010]">Session Expired</h3>
        <p className="text-xs text-[#525E4B] leading-relaxed">
          Please authenticate again to access your school dashboard and continue your work.
        </p>
      </div>

      <div className="pt-2">
        <a
          href={`/login?redirect=${encodeURIComponent(returnUrl)}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors"
        >
          <span>Sign In Again</span>
          <ArrowRight className="w-3.5 h-3.5 text-white/80" />
        </a>
      </div>
    </div>
  );
}

export default SessionExpiredModal;
