"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LogIn,
  Clock,
  ArrowRight,
  ShieldCheck,
  Lock,
  KeyRound,
  WifiOff,
  Eye,
  EyeOff,
  User,
  AlertTriangle,
  Delete,
  Sparkles,
  School,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  hasOfflinePin,
  verifyOfflinePin,
  setOfflineUnlocked,
  getOfflineSession,
  OfflineUserProfile,
} from "@/lib/offline/offline-auth";

export interface SessionExpiredModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
  returnUrl?: string;
  hasUnsavedChanges?: boolean;
}

/**
 * Professional Session Expired & Offline Security Screen
 * Built to provide an Apple / Stripe-grade security vault experience
 * for teachers in classrooms and computer labs across Cameroon.
 */
export function SessionExpiredModal({
  isOpen,
  onSuccess,
  returnUrl = "/dashboard",
  hasUnsavedChanges = false,
}: SessionExpiredModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const [isOffline, setIsOffline] = useState(false);
  const [hasPinConfigured, setHasPinConfigured] = useState(false);
  const [activeTab, setActiveTab] = useState<"pin" | "cloud">("pin");
  const [cachedUser, setCachedUser] = useState<OfflineUserProfile | null>(null);

  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const session = getOfflineSession();
    if (session) {
      setCachedUser(session);
      if (session.email) {
        setEmail(session.email);
      }
    }

    const checkStatus = () => {
      const offline = !navigator.onLine;
      const pinExists = hasOfflinePin();
      setIsOffline(offline);
      setHasPinConfigured(pinExists);

      if (offline || pinExists) {
        setActiveTab("pin");
      } else {
        setActiveTab("cloud");
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

  // Auto-focus PIN input when tab changes or opens
  useEffect(() => {
    if (isOpen && activeTab === "pin") {
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, activeTab]);

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
            "Cannot connect to the cloud server while offline. Please unlock with your 4-digit PIN instead."
          );
          if (hasPinConfigured) {
            setActiveTab("pin");
          }
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
          "Cannot connect to the cloud server while offline. Please unlock with your 4-digit PIN instead."
        );
        if (hasPinConfigured) {
          setActiveTab("pin");
        }
      } else {
        setError(rawMsg || "Authentication failed. Please check your network connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Local Offline 4-Digit PIN Unlock
  const executePinUnlock = async (pinToVerify: string) => {
    const cleanPin = pinToVerify.trim();
    if (cleanPin.length !== 4) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const valid = await verifyOfflinePin(cleanPin);
      if (valid) {
        setOfflineUnlocked(true);
        if (onSuccess) onSuccess();
      } else {
        setIsShaking(true);
        setError("Incorrect 4-digit PIN. Please re-enter.");
        setPin("");
        setTimeout(() => setIsShaking(false), 500);
        pinInputRef.current?.focus();
      }
    } catch {
      setError("Failed to verify PIN on this device.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executePinUnlock(pin);
  };

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4) {
      const updated = pin + digit;
      setPin(updated);
      if (updated.length === 4) {
        executePinUnlock(updated);
      }
    }
  };

  const handleKeypadBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const loginRedirectUrl = `/login?returnUrl=${encodeURIComponent(
    returnUrl || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard")
  )}`;

  const userInitials = cachedUser?.fullName
    ? cachedUser.fullName
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/65 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-2xl sm:rounded-3xl bg-white border border-[#E8DFC9] p-5 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden transition-transform ${
          isShaking ? "translate-x-[-4px] animate-pulse" : ""
        }`}
      >
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl" />

        {/* Header Bar: Status Indicator + Close/Escape */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                isOffline
                  ? "bg-amber-50 text-amber-700 border-amber-200/80 shadow-xs"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-xs"
              }`}
            >
              {isOffline ? (
                <WifiOff className="w-5 h-5 text-amber-700" />
              ) : (
                <Lock className="w-5 h-5 text-emerald-800" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-[#142010]">
                  {isOffline ? "Offline Device Locked" : "Session Protected"}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isOffline
                      ? "bg-amber-100 text-amber-900 border border-amber-300/60"
                      : "bg-emerald-100 text-emerald-900 border border-emerald-300/60"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOffline ? "bg-amber-600 animate-pulse" : "bg-emerald-600"
                    }`}
                  />
                  {isOffline ? "Offline Mode" : "Cloud Online"}
                </span>
              </div>
              <p className="text-xs text-[#525E4B] mt-0.5 leading-snug">
                {isOffline
                  ? "Enter your 4-digit PIN to immediately unlock your cached workspace."
                  : "Authentication expired. Verify your identity to protect student records."}
              </p>
            </div>
          </div>
        </div>

        {/* Active Teacher Identity Chip */}
        {cachedUser && (
          <div className="mb-4 p-2.5 rounded-xl bg-[#FAF8F2] border border-[#E8DFC9] flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#2A7C13] text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#142010] truncate">
                  {cachedUser.fullName || cachedUser.email}
                </p>
                <p className="text-[10px] text-[#525E4B] truncate flex items-center gap-1">
                  <School className="w-2.5 h-2.5 shrink-0 text-[#2A7C13]" />
                  <span>{cachedUser.schoolName || "Institutional Workspace"}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.location.assign(loginRedirectUrl)}
              className="text-[11px] font-bold text-[#2A7C13] hover:text-[#20600E] hover:underline shrink-0 cursor-pointer"
            >
              Switch
            </button>
          </div>
        )}

        {/* Drafts Preserved Notification Capsule */}
        {hasUnsavedChanges && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="leading-snug">
              <span className="font-extrabold text-emerald-950">100% Data Safe: </span>
              <span className="text-emerald-800">Your mark entries are preserved on this device.</span>
            </div>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-xl bg-[#F4F1E8] p-1 gap-1 text-xs font-bold mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("pin");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === "pin"
                ? "bg-white text-[#142010] shadow-xs font-black"
                : "text-[#788470] hover:text-[#142010]"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>4-Digit PIN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("cloud");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === "cloud"
                ? "bg-white text-[#142010] shadow-xs font-black"
                : "text-[#788470] hover:text-[#142010]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Google / Password</span>
          </button>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-900">Attention</p>
              <p className="text-[11px] text-red-700 mt-0.5 leading-snug">{error}</p>
            </div>
          </div>
        )}

        {/* TAB 1: 4-DIGIT OFFLINE PIN KEYPAD */}
        {activeTab === "pin" && (
          <div className="space-y-4">
            <form onSubmit={handlePinFormSubmit} className="space-y-4">
              {/* Hidden input to receive real keyboard events */}
              <input
                ref={pinInputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPin(cleaned);
                  if (cleaned.length === 4) {
                    executePinUnlock(cleaned);
                  }
                }}
                className="sr-only"
                autoComplete="one-time-code"
                aria-label="Enter 4-digit PIN"
              />

              {/* Visual 4-cell PIN Boxes */}
              <div
                onClick={() => pinInputRef.current?.focus()}
                className="flex items-center justify-center gap-3 py-1 cursor-pointer"
              >
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = pin.length > idx;
                  const isCurrent = pin.length === idx;
                  return (
                    <div
                      key={idx}
                      className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center transition-all bg-white ${
                        isCurrent
                          ? "border-[#2A7C13] ring-4 ring-[#2A7C13]/10 shadow-sm scale-105"
                          : isFilled
                          ? "border-[#142010] bg-[#FAF8F2]"
                          : "border-[#D5CBB2]/80 bg-[#FAF8F2]/60"
                      }`}
                    >
                      {isFilled ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-[#142010] animate-in zoom-in-50 duration-150" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#D5CBB2]/60" />
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-[11px] font-medium text-[#788470]">
                {hasPinConfigured
                  ? "Zero internet required. Verified instantly on this device."
                  : "No PIN created yet? Switch to Google / Password to unlock and set one up."}
              </p>

              {/* On-Screen Touch Numeric Keypad for Mobile Ergonomics */}
              <div className="grid grid-cols-3 gap-2 pt-1 max-w-[280px] mx-auto select-none">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    disabled={isSubmitting}
                    className="h-11 sm:h-12 rounded-xl bg-[#FAF8F2] hover:bg-[#F0EBE0] active:bg-[#E5DEC9] border border-[#E8DFC9] text-[#142010] font-black text-lg transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPin("")}
                  disabled={isSubmitting || pin.length === 0}
                  className="h-11 sm:h-12 rounded-xl bg-transparent hover:bg-stone-100 text-[#788470] hover:text-[#142010] text-[11px] font-bold transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => handleKeypadPress("0")}
                  disabled={isSubmitting}
                  className="h-11 sm:h-12 rounded-xl bg-[#FAF8F2] hover:bg-[#F0EBE0] active:bg-[#E5DEC9] border border-[#E8DFC9] text-[#142010] font-black text-lg transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  disabled={isSubmitting || pin.length === 0}
                  className="h-11 sm:h-12 rounded-xl bg-[#FAF8F2] hover:bg-[#F0EBE0] active:bg-[#E5DEC9] border border-[#E8DFC9] text-[#525E4B] hover:text-red-700 transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer disabled:opacity-30"
                  title="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Primary Unlock Action */}
              <button
                type="submit"
                disabled={isSubmitting || pin.length !== 4}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2A7C13] hover:bg-[#20600E] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSubmitting ? "Verifying PIN..." : "Unlock Workspace"}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: GOOGLE OAUTH + PASSWORD */}
        {activeTab === "cloud" && (
          <div className="space-y-4 pt-1">
            {/* Google One-Click Re-Auth */}
            <div>
              <GoogleSignInButton returnUrl={returnUrl} mode="continue" />
            </div>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-[#E8DFC9] w-full" />
              <span className="bg-white px-3 text-[10px] uppercase font-black text-[#788470] tracking-wider shrink-0">
                or account password
              </span>
            </div>

            <form onSubmit={handlePasswordReAuth} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#444444] mb-1">
                  Account Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. teacher@school.cm"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D5CBB2] text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10 bg-white"
                  />
                  <User className="w-4 h-4 text-[#788470] absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-[#444444]">
                    Password
                  </label>
                  <a
                    href="/forgot-password"
                    target="_blank"
                    className="text-[10px] font-bold text-[#2A7C13] hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#D5CBB2] text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10 bg-white"
                  />
                  <Lock className="w-4 h-4 text-[#788470] absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#788470] hover:text-[#142010] transition-colors cursor-pointer p-0.5"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2A7C13] hover:bg-[#20600E] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? "Authenticating..." : "Unlock with Password"}</span>
              </button>
            </form>
          </div>
        )}

        {/* Footer Navigation Links */}
        <div className="pt-3 mt-4 border-t border-[#F0EFEA] flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.assign(loginRedirectUrl)}
            className="text-xs font-semibold text-[#525E4B] hover:text-[#142010] transition-colors cursor-pointer bg-transparent border-none py-1 flex items-center gap-1.5"
          >
            <span>Go to Standard Sign-in Page</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#788470]" />
          </button>

          {isOffline && (
            <a
              href="/offline.html"
              className="text-xs font-bold text-[#2A7C13] hover:text-[#20600E] hover:underline flex items-center gap-1"
            >
              <span>Open Standalone Offline App</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Clean inline card preview of Session Expired
 */
export function SessionExpiredCard({
  returnUrl = "/dashboard",
  className = "",
}: {
  returnUrl?: string;
  className?: string;
}) {
  return (
    <div
      className={`p-8 rounded-3xl bg-white border border-[#E8DFC9] shadow-sm max-w-md mx-auto text-center space-y-4 ${className}`}
      role="alert"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs mx-auto">
        <Lock className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-black tracking-tight text-[#142010]">Session Protected</h3>
        <p className="text-xs text-[#525E4B] leading-relaxed">
          Please authenticate again to access your school dashboard and resume work.
        </p>
      </div>

      <div className="pt-2">
        <a
          href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2A7C13] hover:bg-[#20600E] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
        >
          <span>Sign In to Continue</span>
          <ArrowRight className="w-4 h-4 text-white/80" />
        </a>
      </div>
    </div>
  );
}

export default SessionExpiredModal;
