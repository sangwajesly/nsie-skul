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
  KeyRound,
  WifiOff,
  AlertCircle,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  hasOfflineVault,
  hasOfflinePin,
  getOfflineSession,
  verifyOfflinePin,
  setOfflineUnlocked,
  type OfflineUserProfile,
} from "@/lib/offline/offline-auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  const urlError = searchParams.get("error");
  const [isNavigating, setIsNavigating] = useState(false);

  // URL parameters from WhatsApp 1-click links: ?p=677123456&c=T-101&s=BHS
  const paramPhone = searchParams.get("p") || "";
  const paramCode = searchParams.get("c") || "";
  const paramSchool = searchParams.get("s") || "";

  // View modes: "phone" (primary), "code" (staff slip), "admin" (email/password)
  const [mode, setMode] = useState<"phone" | "code" | "admin">(
    paramCode && !paramPhone ? "code" : "phone"
  );

  // Form field states
  const [phone, setPhone] = useState(paramPhone);
  const [staffCode, setStaffCode] = useState(paramCode);
  const [schoolCode, setSchoolCode] = useState(paramSchool);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const pinInputRef = useRef<HTMLInputElement>(null);

  // Server actions for both login modes
  const [emailState, emailFormAction, isEmailPending] = useActionState(loginAction, null);
  const [codeState, codeFormAction, isCodePending] = useActionState(loginWithTeacherCodeAction, null);

  // Offline detection & PIN vault state
  const [isOffline, setIsOffline] = useState(false);
  const [hasVault, setHasVault] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [offlineProfile, setOfflineProfile] = useState<OfflineUserProfile | null>(null);
  const [isPinMode, setIsPinMode] = useState(false);
  const [offlinePin, setOfflinePin] = useState("");
  const [offlinePinError, setOfflinePinError] = useState<string | null>(null);
  const [offlinePinSuccess, setOfflinePinSuccess] = useState(false);
  const [isVerifyingOfflinePin, setIsVerifyingOfflinePin] = useState(false);

  // Pre-warm destination route
  useEffect(() => {
    router.prefetch(returnUrl);
  }, [router, returnUrl]);

  // When WhatsApp link provides phone or code, auto-focus PIN input
  useEffect(() => {
    if (paramPhone || paramCode) {
      pinInputRef.current?.focus();
    }
  }, [paramPhone, paramCode]);

  // Handle successful cloud redirects
  useEffect(() => {
    if (emailState && "redirectTo" in emailState) {
      setIsNavigating(true);
      router.replace(emailState.redirectTo);
    }
  }, [emailState, router]);

  useEffect(() => {
    if (codeState && "redirectTo" in codeState) {
      setIsNavigating(true);
      router.replace(codeState.redirectTo);
    }
  }, [codeState, router]);

  // Monitor network status & offline vault
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncNetworkAndVault = () => {
      const online = navigator.onLine;
      const vaultExists = hasOfflineVault();
      const pinExists = hasOfflinePin();
      const profile = getOfflineSession();

      setIsOffline(!online);
      setHasVault(vaultExists);
      setHasPin(pinExists);
      setOfflineProfile(profile);

      if (!online && vaultExists) {
        setIsPinMode(true);
      }
    };

    syncNetworkAndVault();
    window.addEventListener("online", syncNetworkAndVault);
    window.addEventListener("offline", syncNetworkAndVault);

    return () => {
      window.removeEventListener("online", syncNetworkAndVault);
      window.removeEventListener("offline", syncNetworkAndVault);
    };
  }, []);

  const handleVerifyOfflinePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfflinePinError(null);

    if (offlinePin.length !== 4 || !/^\d{4}$/.test(offlinePin)) {
      setOfflinePinError("Please enter your exact 4-digit PIN.");
      return;
    }

    setIsVerifyingOfflinePin(true);
    try {
      const valid = await verifyOfflinePin(offlinePin);
      if (valid) {
        setOfflinePinSuccess(true);
        setOfflineUnlocked(true);
        setTimeout(() => {
          window.location.href = returnUrl || "/dashboard";
        }, 600);
      } else {
        setOfflinePinError("Incorrect 4-digit PIN. Please try again.");
      }
    } catch {
      setOfflinePinError("Verification error. Please retry.");
    } finally {
      setIsVerifyingOfflinePin(false);
    }
  };

  const activeError =
    mode === "admin"
      ? (emailState && "error" in emailState ? emailState.error : null) || urlError
      : (codeState && "error" in codeState ? codeState.error : null) || urlError;

  const isBusy = isEmailPending || isCodePending || isNavigating;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5] p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Platform Name */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[10px] bg-[#142010] text-white mb-3 shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#142010]">
            Nsei Sukul
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#788470] mt-0.5">
            Management Systems
          </p>
        </div>

        {/* ── CARD WRAPPER ── */}
        <div className="bg-white border border-[#E8DFC9] rounded-[10px] shadow-sm p-6 space-y-4">
          {/* Offline Banner when campus network drops */}
          {isOffline && (
            <div className="p-3 rounded-[6px] bg-[#2B1B04] text-[#FDE68A] border border-[#78350F] text-xs flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <div>
                <span className="font-bold">Offline: </span>
                <span>No campus internet connection detected.</span>
              </div>
            </div>
          )}

          {/* ── MODE 1: OFFLINE 4-DIGIT PIN KEYPAD ── */}
          {isPinMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8DFC9]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-[#142010] text-[#86EFAC]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-[#142010]">
                      Offline Workspace Unlock
                    </h2>
                    <p className="text-[11px] text-[#525E4B]">
                      {offlineProfile?.schoolName || "Local Cached Session"}
                    </p>
                  </div>
                </div>

                {!isOffline && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPinMode(false);
                      setOfflinePinError(null);
                      setOfflinePin("");
                    }}
                    className="text-[11px] text-[#2A7C13] hover:underline font-semibold cursor-pointer"
                  >
                    Cloud Login
                  </button>
                )}
              </div>

              {offlineProfile && (
                <div className="p-2.5 rounded-[6px] bg-[#FFFDF5] border border-[#E8DFC9] text-xs">
                  <div className="font-bold text-[#142010]">
                    {offlineProfile.fullName}
                  </div>
                  <div className="text-[11px] text-[#788470] capitalize">
                    {offlineProfile.roleName || offlineProfile.roleCode} · 30-Day Offline Lease
                  </div>
                </div>
              )}

              {offlinePinError && (
                <div className="p-2.5 text-xs rounded-[6px] bg-red-50 text-red-700 border border-red-200 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{offlinePinError}</span>
                </div>
              )}

              {offlinePinSuccess && (
                <div className="p-2.5 text-xs rounded-[6px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                  <span>PIN verified! Opening offline teaching workspace…</span>
                </div>
              )}

              {!hasPin ? (
                <div className="p-3 rounded-[6px] bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-xs space-y-2">
                  <p className="font-bold">No Offline PIN configured on this browser.</p>
                  <p className="text-[11px]">
                    To unlock your workspace offline, connect to the internet once and set your 4-digit PIN in Dashboard Settings.
                  </p>
                  {!isOffline && (
                    <button
                      type="button"
                      onClick={() => setIsPinMode(false)}
                      className="w-full py-1.5 rounded-[4px] bg-[#92400E] text-white font-bold text-xs cursor-pointer"
                    >
                      Sign In with Password
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleVerifyOfflinePin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#444444] mb-1.5 text-center">
                      Enter 4-Digit Offline PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      pattern="[0-9]{4}"
                      value={offlinePin}
                      onChange={(e) => setOfflinePin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="••••"
                      autoFocus
                      required
                      disabled={isVerifyingOfflinePin || offlinePinSuccess}
                      className="w-full py-3 text-center text-2xl font-mono tracking-[0.5em] rounded-[6px] border border-[#D5CBB2] bg-[#FFFDF5] text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOfflinePin || offlinePin.length !== 4 || offlinePinSuccess}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-sm rounded-[6px] shadow-xs transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isVerifyingOfflinePin ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying PIN…</span>
                      </>
                    ) : offlinePinSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Unlocked!</span>
                      </>
                    ) : (
                      <>
                        <span>Unlock Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ── MODE 2: CLOUD AUTHENTICATION ── */
            <>
              {/* WhatsApp 1-Click Verification Banner */}
              {paramPhone && (
                <div className="p-3 rounded-[6px] bg-[#EBF5E9] border border-[#C3E4BC] text-xs text-[#1F5C0E] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2A7C13] shrink-0" />
                  <div className="leading-tight">
                    <span className="font-bold">Verified WhatsApp Link: </span>
                    <span>Ready to log in for +237 {paramPhone}. Enter your PIN below.</span>
                  </div>
                </div>
              )}

              {/* Status / Error Alerts */}
              {activeError && (
                <div className="p-3 text-xs rounded-[6px] bg-red-50 text-red-700 border border-red-200 font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{activeError}</span>
                </div>
              )}

              {isNavigating && (
                <div className="p-3 text-xs rounded-[6px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-medium flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#166534]" />
                  <span>Verified! Opening your classes…</span>
                </div>
              )}

              {/* ── FLOW A: PHONE NUMBER & PIN (Default for 95% of Teachers) ── */}
              {mode === "phone" && (
                <form action={codeFormAction} className="space-y-4">
                  <input type="hidden" name="returnUrl" value={returnUrl} />
                  <input type="hidden" name="identifier" value={phone} />

                  <div>
                    <label
                      htmlFor="phone-input"
                      className="block text-xs font-semibold text-[#444444] mb-1.5"
                    >
                      Cameroon Mobile Phone (WhatsApp)
                    </label>
                    <div className="relative flex rounded-[6px] border border-[#D5CBB2] bg-white focus-within:border-[#2A7C13] focus-within:ring-1 focus-within:ring-[#2A7C13] transition-all">
                      <div className="flex items-center gap-1 pl-3 pr-2 border-r border-[#E8DFC9] bg-[#F7F3E8] text-[#444444] text-xs font-bold rounded-l-[5px] select-none">
                        <span>🇨🇲</span>
                        <span className="font-mono text-[11px] text-[#555555]">+237</span>
                      </div>
                      <input
                        id="phone-input"
                        type="tel"
                        inputMode="tel"
                        required
                        disabled={isBusy}
                        autoComplete="tel-national"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                        placeholder="677 12 34 56"
                        className="w-full px-3 py-2.5 text-sm font-mono text-[#142010] placeholder-[#BBBBBB] bg-transparent focus:outline-none"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[#788470]">
                      Your 9-digit MTN or Orange number registered by your school.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="pin-phone-input"
                      className="block text-xs font-semibold text-[#444444] mb-1.5"
                    >
                      4 to 6 Digit PIN
                    </label>
                    <div className="relative">
                      <input
                        id="pin-phone-input"
                        ref={pinInputRef}
                        name="pin"
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={6}
                        required
                        disabled={isBusy}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="••••••"
                        className="w-full pl-3 pr-10 py-2.5 text-base font-mono tracking-[0.3em] rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all disabled:opacity-60"
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
                    <div className="flex items-center justify-between mt-1 text-[11px] text-[#788470]">
                      <span>Initial PIN is usually <strong>123456</strong></span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy || phone.length < 9 || pin.length < 4}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142010] hover:bg-[#20361a] text-white font-semibold text-sm rounded-[6px] shadow-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying Access…</span>
                      </>
                    ) : (
                      <>
                        <span>Open My Classes</span>
                        <ArrowRight className="w-4 h-4 text-[#86EFAC]" />
                      </>
                    )}
                  </button>

                  {/* Alternative link for Staff Slip Code */}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setMode("code")}
                      className="text-xs text-[#525E4B] hover:text-[#142010] font-medium hover:underline cursor-pointer"
                    >
                      Have a Paper Staff Slip? Use Staff Code instead →
                    </button>
                  </div>
                </form>
              )}

              {/* ── FLOW B: STAFF CODE & SCHOOL CODE (For Paper Slip Holders) ── */}
              {mode === "code" && (
                <form action={codeFormAction} className="space-y-4">
                  <input type="hidden" name="returnUrl" value={returnUrl} />
                  <input type="hidden" name="identifier" value={staffCode} />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="school-code-input"
                        className="block text-xs font-semibold text-[#444444] mb-1"
                      >
                        School Code
                      </label>
                      <input
                        id="school-code-input"
                        name="schoolCode"
                        type="text"
                        required
                        disabled={isBusy}
                        value={schoolCode}
                        onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                        placeholder="e.g. BHS"
                        className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="staff-code-input"
                        className="block text-xs font-semibold text-[#444444] mb-1"
                      >
                        Teacher Code
                      </label>
                      <input
                        id="staff-code-input"
                        type="text"
                        required
                        disabled={isBusy}
                        value={staffCode}
                        onChange={(e) => setStaffCode(e.target.value.toUpperCase())}
                        placeholder="e.g. T-101"
                        className="w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="pin-code-input"
                      className="block text-xs font-semibold text-[#444444] mb-1"
                    >
                      4 to 6 Digit PIN
                    </label>
                    <div className="relative">
                      <input
                        id="pin-code-input"
                        name="pin"
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={6}
                        required
                        disabled={isBusy}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="••••••"
                        className="w-full pl-3 pr-10 py-2.5 text-base font-mono tracking-[0.3em] rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all disabled:opacity-60"
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
                    disabled={isBusy || !staffCode || pin.length < 4}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142010] hover:bg-[#20361a] text-white font-semibold text-sm rounded-[6px] shadow-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying Access…</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In with Code</span>
                        <ArrowRight className="w-4 h-4 text-[#86EFAC]" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setMode("phone")}
                      className="text-xs text-[#525E4B] hover:text-[#142010] font-medium hover:underline cursor-pointer"
                    >
                      ← Back to Phone Number Login
                    </button>
                  </div>
                </form>
              )}

              {/* ── FLOW C: SCHOOL ADMINISTRATOR / EMAIL LOGIN ── */}
              {mode === "admin" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E8DFC9]">
                    <span className="text-xs font-bold text-[#142010] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#2A7C13]" />
                      <span>Administrator Access</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setMode("phone")}
                      className="text-[11px] text-[#2A7C13] hover:underline font-semibold cursor-pointer"
                    >
                      ← Teacher Login
                    </button>
                  </div>

                  {/* 1-Click Google Sign In */}
                  <GoogleSignInButton mode="signin" returnUrl={returnUrl} />

                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-[#E8DFC9] w-full" />
                    <span className="bg-white px-2.5 text-[10px] font-semibold text-[#888888] uppercase tracking-wider relative shrink-0">
                      or admin password
                    </span>
                    <div className="border-t border-[#E8DFC9] w-full" />
                  </div>

                  <form action={emailFormAction} className="space-y-3.5">
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
                          placeholder="principal@school.cm"
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
                      className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142010] hover:bg-[#20361a] text-white font-semibold text-xs rounded-[6px] shadow-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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

              {/* Offline PIN toggle button if device has offline vault */}
              {hasVault && hasPin && (
                <div className="pt-2 border-t border-[#E8DFC9]">
                  <button
                    type="button"
                    onClick={() => setIsPinMode(true)}
                    className="w-full py-2 px-3 rounded-[6px] bg-[#FFFDF5] hover:bg-[#F5F5F0] border border-[#D5CBB2] text-xs font-semibold text-[#142010] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#2A7C13]" />
                    <span>Campus Internet Down? Log in with 4-Digit PIN</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quiet Admin Footer Switcher */}
        {mode !== "admin" && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setMode("admin")}
              className="text-xs text-[#777777] hover:text-[#142010] hover:underline font-medium cursor-pointer"
            >
              School Administrator or Bursar? Sign in with Email →
            </button>
          </div>
        )}

        <p className="text-center text-xs text-[#777777] mt-3">
          Need school admin access?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#2A7C13] hover:underline"
          >
            Create an institution
          </Link>
        </p>

        <div className="flex items-center justify-center gap-3 text-[11px] text-[#888888] mt-3">
          <Link href="/terms" className="hover:text-[#2A7C13] hover:underline">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-[#2A7C13] hover:underline">Privacy Policy</Link>
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
