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
import { createClient } from "@/lib/supabase/client";
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

  // URL parameters from 1-click WhatsApp or invitation links: ?c=T-101&s=BHS or ?p=677123456
  const paramPhone = searchParams.get("p") || "";
  const paramCode = searchParams.get("c") || "";
  const paramSchool = searchParams.get("s") || "";

  // Audience Tabs: "teacher" (Default for 95% of users) vs "admin" (School management)
  const [roleTab, setRoleTab] = useState<"teacher" | "admin">("teacher");

  // Input states (automatically pre-filled from invite URL or device cache)
  const [identifier, setIdentifier] = useState(paramCode || paramPhone || "");
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

  // Read invite parameters & cache them in localStorage so PWA retains them on iPhone
  useEffect(() => {
    if (paramSchool) {
      const cleanSchool = paramSchool.trim().toUpperCase();
      setSchoolCode(cleanSchool);
      try { localStorage.setItem("nsei_school_code", cleanSchool); } catch {}
    } else {
      try {
        const cached = localStorage.getItem("nsei_school_code");
        if (cached) setSchoolCode(cached);
      } catch {}
    }

    if (paramCode || paramPhone) {
      const val = (paramCode || paramPhone).trim();
      setIdentifier(val);
      try { localStorage.setItem("nsei_teacher_code", val); } catch {}
    } else {
      try {
        const cached = localStorage.getItem("nsei_teacher_code");
        if (cached) setIdentifier(cached);
      } catch {}
    }

    // Ensure demo session is purged if user visits real school login
    if (typeof document !== "undefined" && document.cookie.includes("nsei_is_demo")) {
      try {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user?.email === "demo@nsei-sukul.klarifypath.com") {
            supabase.auth.signOut().then(() => {
              document.cookie = "nsei_is_demo=; path=/; max-age=0";
              document.cookie = "nsei_active_school_id=; path=/; max-age=0";
            });
          }
        });
      } catch {}
    }
  }, [paramSchool, paramCode, paramPhone]);

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
      // Seamlessly cache credentials so the exact same credentials work offline
      const effectivePin = pin || "123456";
      if (identifier) {
        saveOfflineTeacherCredentials(identifier, effectivePin);
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

      const effectivePin = pin || "123456";

      setIsVerifyingOffline(true);
      try {
        const valid = await verifyOfflinePin(effectivePin);
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

          {/* School Invitation Banner */}
          {schoolCode && roleTab === "teacher" && (
            <div className="p-2.5 rounded-[6px] bg-[#EBF5E9] border border-[#C3E4BC] text-xs text-[#1F5C0E] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
              <div className="leading-tight">
                <span className="font-bold">School Invitation: </span>
                <span>Connecting to <strong>{schoolCode}</strong></span>
              </div>
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

          {/* ── AUDIENCE 1: TEACHER & STAFF LOGIN (School Code + Teacher Code) ── */}
          {roleTab === "teacher" ? (
            <form action={codeFormAction} onSubmit={handleTeacherSubmit} className="space-y-3.5">
              <input type="hidden" name="returnUrl" value={returnUrl} />

              {/* 1. School Code */}
              <div>
                <label
                  htmlFor="teacher-school-code"
                  className="block text-xs font-semibold text-[#444444] mb-1"
                >
                  School Code *
                </label>
                <div className="relative flex rounded-[6px] border border-[#D5CBB2] bg-white focus-within:border-[#2A7C13] focus-within:ring-1 focus-within:ring-[#2A7C13] transition-all">
                  <div className="flex items-center pl-2.5 pr-2 text-[#777777]">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="teacher-school-code"
                    name="schoolCode"
                    type="text"
                    required
                    disabled={isBusy}
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    placeholder="e.g. GBHS or BHS"
                    className="w-full px-2 py-2.5 text-xs font-mono font-bold uppercase text-[#142010] placeholder-[#BBBBBB] bg-transparent focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[10.5px] text-[#788470]">
                  The code or acronym of your school (e.g. GBHS).
                </p>
              </div>

              {/* 2. Teacher Code */}
              <div>
                <label
                  htmlFor="teacher-identifier"
                  className="block text-xs font-semibold text-[#444444] mb-1"
                >
                  Teacher Code (or Phone) *
                </label>
                <div className="relative flex rounded-[6px] border border-[#D5CBB2] bg-white focus-within:border-[#2A7C13] focus-within:ring-1 focus-within:ring-[#2A7C13] transition-all">
                  <input
                    id="teacher-identifier"
                    name="identifier"
                    type="text"
                    required
                    disabled={isBusy}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. T-001 or 677 12 34 56"
                    className="w-full px-3 py-2.5 text-xs font-mono font-medium text-[#142010] placeholder-[#BBBBBB] bg-transparent focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[10.5px] text-[#788470]">
                  Your unique teacher code on your slip (e.g. T-001) or WhatsApp number.
                </p>
              </div>

              {/* 3. PIN Code (Optional - default is 123456) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="teacher-pin"
                    className="block text-xs font-semibold text-[#444444]"
                  >
                    PIN Code <span className="font-normal text-[#888888]">(optional)</span>
                  </label>
                  <span className="text-[10px] text-[#2A7C13] font-semibold">Initial default: 123456</span>
                </div>
                <div className="relative">
                  <input
                    id="teacher-pin"
                    ref={pinInputRef}
                    name="pin"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={6}
                    disabled={isBusy}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Leave blank for default (123456)"
                    className="w-full pl-3 pr-10 py-2.5 text-xs font-mono rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all disabled:opacity-60"
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
              </div>

              <button
                type="submit"
                disabled={isBusy || !identifier || identifier.trim().length < 2 || !schoolCode || schoolCode.trim().length < 2}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142010] hover:bg-[#20361a] text-white font-bold text-xs rounded-[6px] shadow-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Access…</span>
                  </>
                ) : (
                  <>
                    <span>Enter School Workspace</span>
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
