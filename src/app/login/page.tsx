"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { loginAction, loginWithTeacherCodeAction } from "@/app/auth/actions";
import {
  GraduationCap,
  ArrowRight,
  Lock,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  Building2,
  WifiOff,
} from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  hasOfflineVault,
  verifyOfflinePin,
  setOfflineUnlocked,
  saveOfflineTeacherCredentials,
  type OfflineUserProfile,
  getOfflineSession,
} from "@/lib/offline/offline-auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  const urlError = searchParams.get("error");
  const [isNavigating, setIsNavigating] = useState(false);

  // URL parameters from 1-click WhatsApp links: ?p=677123456&c=T-101&s=BHS
  const paramPhone = searchParams.get("p") || "";
  const paramCode = searchParams.get("c") || "";
  const paramSchool = searchParams.get("s") || "";

  // Audience Tabs: "teacher" (Default for 95% of users) vs "admin" (School management)
  const [roleTab, setRoleTab] = useState<"teacher" | "admin">("teacher");

  // Input states
  const [identifier, setIdentifier] = useState(paramPhone || paramCode || "");
  const [schoolCode, setSchoolCode] = useState(paramSchool || "");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const pinInputRef = useRef<HTMLInputElement>(null);

  // Server actions
  const [emailState, emailFormAction, isEmailPending] = useActionState(loginAction, null);
  const [codeState, codeFormAction, isCodePending] = useActionState(loginWithTeacherCodeAction, null);

  // Offline status
  const [isOffline, setIsOffline] = useState(false);
  const [offlineProfile, setOfflineProfile] = useState<OfflineUserProfile | null>(null);
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [offlineSuccess, setOfflineSuccess] = useState(false);
  const [isVerifyingOffline, setIsVerifyingOffline] = useState(false);

  // Pre-warm destination route
  useEffect(() => {
    router.prefetch(returnUrl);
  }, [router, returnUrl]);

  // When WhatsApp parameters are present, auto-focus PIN
  useEffect(() => {
    if (paramPhone || paramCode) {
      pinInputRef.current?.focus();
    }
  }, [paramPhone, paramCode]);

  // Handle successful cloud login & cache PIN automatically for offline use
  useEffect(() => {
    if (emailState && "redirectTo" in emailState) {
      setIsNavigating(true);
      router.replace(emailState.redirectTo);
    }
  }, [emailState, router]);

  useEffect(() => {
    if (codeState && "redirectTo" in codeState) {
      setIsNavigating(true);
      // Seamlessly cache credentials so the exact same PIN works offline!
      if (pin && identifier) {
        saveOfflineTeacherCredentials(identifier, pin);
      }
      router.replace(codeState.redirectTo);
    }
  }, [codeState, router, pin, identifier]);

  // Monitor connectivity & offline profile
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStatus = () => {
      const online = navigator.onLine;
      setIsOffline(!online);
      setOfflineProfile(getOfflineSession());
    };

    syncStatus();
    window.addEventListener("online", syncStatus);
    window.addEventListener("offline", syncStatus);

    return () => {
      window.removeEventListener("online", syncStatus);
      window.removeEventListener("offline", syncStatus);
    };
  }, []);

  // Seamless offline login handler: uses the EXACT SAME form inputs
  const handleTeacherSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      e.preventDefault();
      setOfflineError(null);

      if (!pin || pin.trim().length < 4) {
        setOfflineError("Please enter your 4 to 6 digit PIN.");
        return;
      }

      setIsVerifyingOffline(true);
      try {
        const valid = await verifyOfflinePin(pin);
        if (valid) {
          setOfflineSuccess(true);
          setOfflineUnlocked(true);
          setTimeout(() => {
            window.location.href = returnUrl || "/dashboard";
          }, 500);
        } else {
          setOfflineError("Incorrect PIN for offline access. Please check your PIN.");
          setIsVerifyingOffline(false);
        }
      } catch {
        setOfflineError("Offline verification failed. Please check your PIN.");
        setIsVerifyingOffline(false);
      }
    }
  };

  const isNumericOnly = /^\d+$/.test(identifier.replace(/[\s+-]/g, ""));
  const activeError =
    roleTab === "admin"
      ? (emailState && "error" in emailState ? emailState.error : null) || urlError
      : offlineError || (codeState && "error" in codeState ? codeState.error : null) || urlError;

  const isBusy = isEmailPending || isCodePending || isNavigating || isVerifyingOffline;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5] p-4 text-[#142010]">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[10px] bg-[#142010] text-white mb-2.5 shadow-xs">
            <GraduationCap className="w-6 h-6 text-[#86EFAC]" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#142010]">
            Nsei Sukul
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#687660] mt-0.5">
            Secondary School Management
          </p>
        </div>

        {/* ── CARD ── */}
        <div className="bg-white border border-[#E8DFC9] rounded-[12px] shadow-sm p-6 space-y-4">
          {/* Two Clear Audience Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-[8px] bg-[#F7F3E8] border border-[#E8DFC9] text-xs">
            <button
              type="button"
              onClick={() => {
                setRoleTab("teacher");
                setOfflineError(null);
              }}
              className={`py-2 rounded-[6px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleTab === "teacher"
                  ? "bg-[#142010] text-white shadow-xs"
                  : "text-[#555555] hover:text-[#142010]"
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-[#86EFAC]" />
              <span>Phone / Staff Slip</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRoleTab("admin");
                setOfflineError(null);
              }}
              className={`py-2 rounded-[6px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                roleTab === "admin"
                  ? "bg-[#142010] text-white shadow-xs"
                  : "text-[#555555] hover:text-[#142010]"
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-[#86EFAC]" />
              <span>Google &amp; Email</span>
            </button>
          </div>

          {/* Offline Status Badge */}
          {isOffline && (
            <div className="p-2.5 rounded-[6px] bg-[#FFF8CF] border border-[#FBE6C2] text-xs text-[#7A5B00] flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-[#B45309] shrink-0" />
              <div className="leading-tight">
                <span className="font-bold">Offline Mode: </span>
                <span>Enter your Teacher PIN to open your cached workspace.</span>
              </div>
            </div>
          )}

          {/* WhatsApp 1-Click Verification Banner */}
          {paramPhone && roleTab === "teacher" && (
            <div className="p-2.5 rounded-[6px] bg-[#EBF5E9] border border-[#C3E4BC] text-xs text-[#1F5C0E] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2A7C13] shrink-0" />
              <span className="font-semibold">
                WhatsApp Link Verified: +237 {paramPhone}
              </span>
            </div>
          )}

          {/* Error Message */}
          {activeError && (
            <div className="p-2.5 text-xs rounded-[6px] bg-red-50 text-red-700 border border-red-200 font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{activeError}</span>
            </div>
          )}

          {/* Success Transitions */}
          {(isNavigating || offlineSuccess) && (
            <div className="p-2.5 text-xs rounded-[6px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-medium flex items-center gap-2">
              {offlineSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin text-[#166534] shrink-0" />
              )}
              <span>Opening your classes and marksheets…</span>
            </div>
          )}

          {/* ── AUDIENCE 1: TEACHER & STAFF LOGIN (Unified Online & Offline) ── */}
          {roleTab === "teacher" ? (
            <form action={codeFormAction} onSubmit={handleTeacherSubmit} className="space-y-3.5">
              <input type="hidden" name="returnUrl" value={returnUrl} />
              <input type="hidden" name="schoolCode" value={schoolCode} />

              <div>
                <label
                  htmlFor="teacher-identifier"
                  className="block text-xs font-semibold text-[#444444] mb-1"
                >
                  Cameroon Phone or Staff Code
                </label>
                <div className="relative flex rounded-[6px] border border-[#D5CBB2] bg-white focus-within:border-[#2A7C13] focus-within:ring-1 focus-within:ring-[#2A7C13] transition-all">
                  {isNumericOnly && identifier.length > 2 && (
                    <div className="flex items-center gap-1 pl-2.5 pr-2 border-r border-[#E8DFC9] bg-[#F7F3E8] text-[#444444] text-[11px] font-bold select-none">
                      <span>🇨🇲</span>
                      <span className="font-mono text-[#555555]">+237</span>
                    </div>
                  )}
                  <input
                    id="teacher-identifier"
                    name="identifier"
                    type="text"
                    required
                    disabled={isBusy}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 677 12 34 56 or T-101"
                    className="w-full px-3 py-2.5 text-xs font-mono font-medium text-[#142010] placeholder-[#BBBBBB] bg-transparent focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[10.5px] text-[#788470]">
                  Enter your WhatsApp phone number or the staff code on your slip.
                </p>
              </div>

              <div>
                <label
                  htmlFor="teacher-pin"
                  className="block text-xs font-semibold text-[#444444] mb-1"
                >
                  PIN Code
                </label>
                <div className="relative">
                  <input
                    id="teacher-pin"
                    ref={pinInputRef}
                    name="pin"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={8}
                    required
                    disabled={isBusy}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••••"
                    className="w-full pl-3 pr-10 py-2.5 text-sm font-mono tracking-[0.25em] rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#888888] hover:text-[#142010] cursor-pointer"
                    title={showPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1 text-[10.5px] text-[#788470]">
                  <span>Initial PIN is usually <strong>123456</strong></span>
                  {offlineProfile && isOffline && (
                    <span className="text-[#2A7C13] font-bold">Cached: {offlineProfile.schoolName}</span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy || identifier.length < 3 || pin.length < 4}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142010] hover:bg-[#20361a] text-white font-bold text-xs rounded-[6px] shadow-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Access…</span>
                  </>
                ) : (
                  <>
                    <span>{isOffline ? "Unlock Offline Workspace" : "Open My Classes"}</span>
                    <ArrowRight className="w-4 h-4 text-[#86EFAC]" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ── AUDIENCE 2: SCHOOL ADMINISTRATOR & BURSAR LOGIN ── */
            <div className="space-y-3.5">
              {/* 1-Click Google Sign In */}
              <GoogleSignInButton mode="signin" returnUrl={returnUrl} />

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-[#E8DFC9] w-full" />
                <span className="bg-white px-2.5 text-[10px] font-semibold text-[#888888] uppercase tracking-wider relative shrink-0">
                  or admin password
                </span>
                <div className="border-t border-[#E8DFC9] w-full" />
              </div>

              <form action={emailFormAction} className="space-y-3">
                <input type="hidden" name="returnUrl" value={returnUrl} />

                <div>
                  <label
                    htmlFor="admin-email"
                    className="block text-xs font-semibold text-[#444444] mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#AAAAAA]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="admin-email"
                      name="email"
                      type="email"
                      required
                      disabled={isBusy}
                      autoComplete="email"
                      placeholder="name@gmail.com or school email"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="admin-password"
                      className="text-xs font-semibold text-[#444444]"
                    >
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] font-medium text-[#2A7C13] hover:underline"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#AAAAAA]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="admin-password"
                      name="password"
                      type="password"
                      required
                      disabled={isBusy}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142010] hover:bg-[#20361a] text-white font-bold text-xs rounded-[6px] shadow-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to Dashboard</span>
                      <ArrowRight className="w-4 h-4 text-[#86EFAC]" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── AUDIENCE 3: NEW INSTITUTION ONBOARDING BANNER ── */}
        <div className="mt-4 p-3.5 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs text-center space-y-1">
          <div className="text-xs font-bold text-[#142010]">
            Principal or School Proprietor?
          </div>
          <p className="text-[11px] text-[#666666]">
            Set up your secondary school on Nsei Sukul in 2 minutes.
          </p>
          <div className="pt-1 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#2A7C13] hover:underline cursor-pointer"
            >
              <span>Register School</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-[#D5D5CF]">|</span>
            <Link
              href="/demo"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#B45309] hover:underline cursor-pointer"
              title="Test with pre-populated demo classes and report cards"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Explore Live Demo</span>
            </Link>
          </div>
        </div>

        {/* Footer Links & Contact */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-[#888888] mt-4">
          <Link href="/terms" className="hover:text-[#2A7C13] hover:underline">Terms</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-[#2A7C13] hover:underline">Privacy</Link>
          <span>•</span>
          <a
            href="https://wa.me/237682833601"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#2A7C13] hover:underline font-medium text-[#2A7C13]"
          >
            WhatsApp Support
          </a>
        </div>

        <p className="text-center text-[10px] text-[#AAAAAA] mt-2">
          © {new Date().getFullYear()} Nsei Sukul · Management Systems · nsei-sukul.klarifypath.com
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFDF5]" />}>
      <LoginForm />
    </Suspense>
  );
}
