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
  School,
  ExternalLink,
  Globe,
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
 * Standard Session Expired & Offline Security Screen
 * Clean, high-contrast institutional re-authentication for schools.
 * No decorative blur effects or AI aesthetic.
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

  // Focus PIN input when tab changes or opens
  useEffect(() => {
    if (isOpen && activeTab === "pin") {
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
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
            "Cannot connect to the cloud server while offline. Please unlock with your 4-digit PIN."
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
          "Cannot connect to the cloud server while offline. Please unlock with your 4-digit PIN."
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
        setError("Incorrect 4-digit PIN. Please try again.");
        setPin("");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60">
      <div className="w-full max-w-md rounded-[10px] bg-white border border-[#D5CBB2] p-5 sm:p-6 shadow-xl">
        {/* Header Bar: Status Indicator */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
              isOffline
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-emerald-50 text-emerald-800 border-emerald-300"
            }`}
          >
            {isOffline ? (
              <WifiOff className="w-5 h-5 text-amber-800" />
            ) : (
              <Lock className="w-5 h-5 text-emerald-800" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#142010]">
                {isOffline ? "Offline Device Locked" : "Session Expired"}
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isOffline
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                }`}
              >
                {isOffline ? "Offline Mode" : "Online"}
              </span>
            </div>
            <p className="text-xs text-[#525E4B] mt-0.5 leading-snug">
              {isOffline
                ? "Enter your 4-digit PIN to continue working offline."
                : "Your authentication session has timed out. Please sign in to resume."}
            </p>
          </div>
        </div>

        {/* Active Teacher Identity Chip */}
        {cachedUser && (
          <div className="mb-3.5 p-2.5 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#2A7C13] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#142010] truncate">
                  {cachedUser.fullName || cachedUser.email}
                </p>
                <p className="text-[10px] text-[#525E4B] truncate flex items-center gap-1">
                  <School className="w-3 h-3 shrink-0 text-[#2A7C13]" />
                  <span>{cachedUser.schoolName || "School Workspace"}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.location.assign(loginRedirectUrl)}
              className="text-[11px] font-bold text-[#2A7C13] hover:text-[#20600E] hover:underline shrink-0 cursor-pointer"
            >
              Switch User
            </button>
          </div>
        )}

        {/* Drafts Preserved Notification */}
        {hasUnsavedChanges && (
          <div className="mb-3.5 p-2.5 rounded-[6px] bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2A7C13] shrink-0" />
            <div className="leading-snug">
              <strong>Drafts Preserved:</strong> Your entered marks are safely cached on this device.
            </div>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="flex rounded-[6px] bg-[#F5F3EB] p-1 gap-1 text-xs font-bold mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("pin");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-[4px] transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === "pin"
                ? "bg-white text-[#142010] shadow-2xs font-bold"
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
            className={`flex-1 py-1.5 rounded-[4px] transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 ${
              activeTab === "cloud"
                ? "bg-white text-[#142010] shadow-2xs font-bold"
                : "text-[#788470] hover:text-[#142010]"
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#525E4B]" />
            <span>Google / Password</span>
          </button>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-3.5 p-2.5 rounded-[6px] bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-900">Notice</p>
              <p className="text-[11px] text-red-700 mt-0.5 leading-snug">{error}</p>
            </div>
          </div>
        )}

        {/* TAB 1: 4-DIGIT OFFLINE PIN KEYPAD */}
        {activeTab === "pin" && (
          <div className="space-y-3.5">
            <form onSubmit={handlePinFormSubmit} className="space-y-3.5">
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
                className="flex items-center justify-center gap-2.5 py-1 cursor-pointer"
              >
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = pin.length > idx;
                  const isCurrent = pin.length === idx;
                  return (
                    <div
                      key={idx}
                      className={`w-12 h-13 rounded-[6px] border-2 flex items-center justify-center bg-white ${
                        isCurrent
                          ? "border-[#2A7C13] shadow-xs"
                          : isFilled
                          ? "border-[#142010] bg-[#FAF8F2]"
                          : "border-[#D5CBB2] bg-[#FAF8F2]"
                      }`}
                    >
                      {isFilled ? (
                        <div className="w-3 h-3 rounded-full bg-[#142010]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D5CBB2]" />
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-[11px] text-[#788470]">
                {hasPinConfigured
                  ? "Verified instantly on this device without internet."
                  : "No PIN created yet? Switch to Google / Password to unlock."}
              </p>

              {/* On-Screen Touch Numeric Keypad */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 max-w-[260px] mx-auto select-none">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    disabled={isSubmitting}
                    className="h-10 rounded-[5px] bg-[#FAF8F2] hover:bg-[#EAE6D8] border border-[#E8DFC9] text-[#142010] font-bold text-base transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPin("")}
                  disabled={isSubmitting || pin.length === 0}
                  className="h-10 rounded-[5px] bg-transparent hover:bg-stone-100 text-[#788470] text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer disabled:opacity-30"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => handleKeypadPress("0")}
                  disabled={isSubmitting}
                  className="h-10 rounded-[5px] bg-[#FAF8F2] hover:bg-[#EAE6D8] border border-[#E8DFC9] text-[#142010] font-bold text-base transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  disabled={isSubmitting || pin.length === 0}
                  className="h-10 rounded-[5px] bg-[#FAF8F2] hover:bg-[#EAE6D8] border border-[#E8DFC9] text-[#525E4B] transition-colors flex items-center justify-center cursor-pointer disabled:opacity-30"
                  title="Backspace"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              {/* Primary Unlock Action */}
              <button
                type="submit"
                disabled={isSubmitting || pin.length !== 4}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Verifying PIN..." : "Unlock Workspace"}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: GOOGLE OAUTH + PASSWORD */}
        {activeTab === "cloud" && (
          <div className="space-y-3.5 pt-1">
            {/* Google Re-Auth */}
            <div>
              <GoogleSignInButton returnUrl={returnUrl} mode="continue" />
            </div>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-[#E8DFC9] w-full" />
              <span className="bg-white px-3 text-[10px] uppercase font-bold text-[#788470] tracking-wider shrink-0">
                or use account password
              </span>
            </div>

            <form onSubmit={handlePasswordReAuth} className="space-y-3">
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
                    className="w-full pl-8 pr-3 py-2 rounded-[5px] border border-[#D5CBB2] text-xs text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                  />
                  <User className="w-3.5 h-3.5 text-[#788470] absolute left-2.5 top-2.5 pointer-events-none" />
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
                    className="w-full pl-8 pr-9 py-2 rounded-[5px] border border-[#D5CBB2] text-xs text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                  />
                  <Lock className="w-3.5 h-3.5 text-[#788470] absolute left-2.5 top-2.5 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-[#788470] hover:text-[#142010] cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5" />
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
              className="text-xs font-bold text-[#2A7C13] hover:underline flex items-center gap-1"
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
 * Standard inline card preview of Session Expired
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
      className={`p-6 sm:p-8 rounded-[10px] bg-white border border-[#E8DFC9] shadow-xs max-w-md mx-auto text-center space-y-4 ${className}`}
      role="alert"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-800 border border-amber-300 mx-auto">
        <Lock className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-[#142010]">Session Protected</h3>
        <p className="text-xs text-[#525E4B] leading-relaxed">
          Please authenticate again to access your school dashboard and resume work.
        </p>
      </div>

      <div className="pt-2">
        <a
          href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors"
        >
          <span>Sign In to Continue</span>
          <ArrowRight className="w-3.5 h-3.5 text-white/80" />
        </a>
      </div>
    </div>
  );
}

export default SessionExpiredModal;
