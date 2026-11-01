"use client";

import React, { useState, useEffect } from "react";
import { LogIn, Clock, ArrowRight, ShieldCheck, Lock, KeyRound, WifiOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  hasOfflinePin,
  verifyOfflinePin,
  setOfflineUnlocked,
  hasOfflineVault,
} from "@/lib/offline/offline-auth";

export interface SessionExpiredModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
  returnUrl?: string;
  hasUnsavedChanges?: boolean;
}

/**
 * 8. SESSION EXPIRED (401 INACTIVITY STATE)
 * Protects teachers in computer labs / staff rooms from losing marks
 * when their session times out or when working across offline/online transitions.
 */
export function SessionExpiredModal({
  isOpen,
  onSuccess,
  returnUrl = "/dashboard",
  hasUnsavedChanges = false,
}: SessionExpiredModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isOffline, setIsOffline] = useState(false);
  const [hasPinConfigured, setHasPinConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState<"cloud" | "pin">("cloud");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStatus = () => {
      const offline = !navigator.onLine;
      const pinExists = hasOfflinePin();
      setIsOffline(offline);
      setHasPinConfigured(pinExists);

      // Default to PIN mode if offline and PIN exists
      if (offline && pinExists) {
        setActiveTab("pin");
      }
    };

    checkStatus();
    window.addEventListener("online", checkStatus);
    window.addEventListener("offline", checkStatus);

    return () => {
      window.removeEventListener("online", checkStatus);
      window.removeEventListener("offline", checkStatus);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Cloud Password Re-authentication
  const handlePasswordReAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        const rawMsg = authError.message || "";
        if (
          rawMsg.includes("<!DOCTYPE") ||
          rawMsg.includes("Unexpected token") ||
          rawMsg.includes("Failed to fetch") ||
          rawMsg.includes("Load failed")
        ) {
          setError(
            "Cannot connect to the authentication server. You appear to be offline or network connection was lost. Please verify your internet or unlock with your offline PIN."
          );
        } else {
          setError(rawMsg || "Invalid credentials. Please verify your email and password.");
        }
      } else if (data?.user) {
        if (onSuccess) onSuccess();
        window.location.reload();
      }
    } catch (err: any) {
      const rawMsg = err?.message || "";
      if (
        rawMsg.includes("<!DOCTYPE") ||
        rawMsg.includes("Unexpected token") ||
        rawMsg.includes("Failed to fetch") ||
        rawMsg.includes("Load failed")
      ) {
        setError(
          "Cannot connect to the authentication server. You appear to be offline or network connection was lost. Please verify your internet or unlock with your offline PIN."
        );
      } else {
        setError(rawMsg || "Authentication failed. Please verify your connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Local Offline 4-Digit PIN Unlock
  const handlePinUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const cleanPin = pin.trim();
    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setError("Please enter your exact 4-digit PIN.");
      setIsSubmitting(false);
      return;
    }

    try {
      const valid = await verifyOfflinePin(cleanPin);
      if (valid) {
        setOfflineUnlocked(true);
        if (onSuccess) onSuccess();
      } else {
        setError("Incorrect 4-digit PIN. Please try again.");
      }
    } catch {
      setError("Failed to verify PIN. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginRedirectUrl = `/login?returnUrl=${encodeURIComponent(
    returnUrl || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard")
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-[12px] bg-white border border-[#E8DFC9] p-6 sm:p-7 shadow-2xl space-y-4">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-full bg-[#FFF8CF] text-[#B45309] shrink-0 border border-[#FBE6C2]">
            {isOffline ? <WifiOff className="w-6 h-6 text-[#B45309]" /> : <Clock className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#142010]">
              {isOffline ? "Offline Workspace Protected" : "Session Expired"}
            </h3>
            <p className="text-xs text-[#525E4B] mt-0.5 leading-relaxed">
              {isOffline
                ? "You are currently offline. Unlock using your 4-digit PIN to continue editing student marks."
                : "Your session has timed out due to inactivity to protect school records."}
            </p>
          </div>
        </div>

        {/* Drafts Preserved Notification */}
        {hasUnsavedChanges && (
          <div className="p-3 rounded-[6px] bg-[#EAF7E4] border border-[#BBF7D0] text-xs text-[#166534] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2A7C13] shrink-0" />
            <span>
              <strong>Drafts Preserved:</strong> Your entered marks on this screen are cached in device storage. Sign in to resume seamlessly.
            </span>
          </div>
        )}

        {/* Auth Mode Tabs (if PIN is configured or offline) */}
        {hasPinConfigured && (
          <div className="flex rounded-[6px] bg-[#F5F3EB] p-1 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab("cloud");
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-[4px] transition-colors cursor-pointer text-center ${
                activeTab === "cloud"
                  ? "bg-white text-[#142010] shadow-2xs"
                  : "text-[#788470] hover:text-[#142010]"
              }`}
            >
              Sign In (Google / Email)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("pin");
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-[4px] transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                activeTab === "pin"
                  ? "bg-white text-[#142010] shadow-2xs"
                  : "text-[#788470] hover:text-[#142010]"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-[#2A7C13]" />
              <span>Offline 4-Digit PIN</span>
            </button>
          </div>
        )}

        {/* Error message alert */}
        {error && (
          <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* TAB 1: CLOUD RE-AUTHENTICATION (Google OAuth + Email/Password) */}
        {activeTab === "cloud" && (
          <div className="space-y-4 pt-1">
            {/* Google Sign-in Option */}
            <div>
              <GoogleSignInButton returnUrl={returnUrl} mode="continue" />
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#E8DFC9] w-full" />
              <span className="bg-white px-2 text-[10px] uppercase font-bold text-[#788470] tracking-wider shrink-0">
                or use account password
              </span>
            </div>

            <form onSubmit={handlePasswordReAuth} className="space-y-3">
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
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: OFFLINE 4-DIGIT PIN KEYPAD */}
        {activeTab === "pin" && (
          <form onSubmit={handlePinUnlock} className="space-y-4 pt-1">
            <div className="p-3 rounded-[6px] bg-[#FFFDF5] border border-[#E8DFC9] text-center">
              <label className="block text-xs font-bold text-[#142010] mb-2">
                Enter your 4-digit Offline PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="w-36 mx-auto px-4 py-2.5 text-center text-2xl font-mono tracking-[0.4em] rounded-[6px] border-2 border-[#D5CBB2] text-[#142010] focus:outline-none focus:border-[#2A7C13] bg-white block"
              />
              <p className="text-[11px] text-[#788470] mt-2">
                Unlocks the cached teaching workspace on this device without internet.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || pin.length !== 4}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Verifying..." : "Unlock Workspace with PIN"}</span>
            </button>
          </form>
        )}

        {/* Footer Navigation Links */}
        <div className="pt-2 border-t border-[#F0EFEA] flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => {
              window.location.assign(loginRedirectUrl);
            }}
            className="text-xs font-semibold text-[#525E4B] hover:text-[#142010] transition-colors cursor-pointer bg-transparent border-none py-1"
          >
            Go to Standard Sign-in Page
          </button>

          {isOffline && (
            <a
              href="/offline.html"
              className="text-xs font-bold text-[#2A7C13] hover:underline"
            >
              Switch to Standalone Offline App
            </a>
          )}
        </div>
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
          href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
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
