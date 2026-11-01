"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { loginAction } from "@/app/auth/actions";
import {
  GraduationCap,
  ArrowRight,
  Lock,
  Mail,
  Loader2,
  CheckCircle2,
  KeyRound,
  WifiOff,
  ShieldCheck,
  AlertCircle,
  Wifi,
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
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  const urlError = searchParams.get("error");
  const [isNavigating, setIsNavigating] = useState(false);

  // Offline detection & PIN vault state
  const [isOffline, setIsOffline] = useState(false);
  const [hasVault, setHasVault] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [offlineProfile, setOfflineProfile] = useState<OfflineUserProfile | null>(null);
  const [isPinMode, setIsPinMode] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Pre-warm target destination route assets
  useEffect(() => {
    router.prefetch(returnUrl);
  }, [router, returnUrl]);

  // When cloud login succeeds, transition to dashboard
  useEffect(() => {
    if (state && "redirectTo" in state) {
      setIsNavigating(true);
      router.replace(state.redirectTo);
    }
  }, [state, router]);

  // Monitor network status & offline vault presence on this device
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

      // Auto-switch to PIN mode if completely offline and vault is active
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
    setPinError(null);

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinError("Please enter your exact 4-digit PIN.");
      return;
    }

    setIsVerifyingPin(true);
    try {
      const valid = await verifyOfflinePin(pin);
      if (valid) {
        setPinSuccess(true);
        setOfflineUnlocked(true);
        setTimeout(() => {
          window.location.href = returnUrl || "/dashboard";
        }, 600);
      } else {
        setPinError("Incorrect 4-digit PIN. Please try again.");
      }
    } catch {
      setPinError("Verification error. Please retry.");
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const errorMsg = (state && "error" in state ? state.error : null) || urlError;
  const isBusy = isPending || isNavigating;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5] p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
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

        {/* ── CARD CONTENT ── */}
        <div className="bg-white border border-[#E8DFC9] rounded-[10px] shadow-sm p-7 space-y-4">
          {/* Offline Banner when network is unavailable */}
          {isOffline && (
            <div className="p-3 rounded-[6px] bg-[#2B1B04] text-[#FDE68A] border border-[#78350F] text-xs flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <div>
                <span className="font-bold">Offline: </span>
                <span>No internet connection detected on this device.</span>
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
                      setPinError(null);
                      setPin("");
                    }}
                    className="text-[11px] text-[#2A7C13] hover:underline font-semibold"
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

              {pinError && (
                <div className="p-2.5 text-xs rounded-[6px] bg-red-50 text-red-700 border border-red-200 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{pinError}</span>
                </div>
              )}

              {pinSuccess && (
                <div className="p-2.5 text-xs rounded-[6px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                  <span>PIN verified! Opening offline teaching workspace…</span>
                </div>
              )}

              {!hasPin ? (
                <div className="p-3 rounded-[6px] bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-xs space-y-2">
                  <p className="font-bold">No Offline PIN configured on this browser.</p>
                  <p className="text-[11px]">
                    To unlock your workspace offline, please connect to the internet once and set your 4-digit PIN in Dashboard Settings.
                  </p>
                  {!isOffline && (
                    <button
                      type="button"
                      onClick={() => setIsPinMode(false)}
                      className="w-full py-1.5 rounded-[4px] bg-[#92400E] text-white font-bold text-xs"
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
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="••••"
                      autoFocus
                      required
                      disabled={isVerifyingPin || pinSuccess}
                      className="w-full py-3 text-center text-2xl font-mono tracking-[0.5em] rounded-[6px] border border-[#D5CBB2] bg-[#FFFDF5] text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingPin || pin.length !== 4 || pinSuccess}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-sm rounded-[6px] shadow-xs transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isVerifyingPin ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying PIN…</span>
                      </>
                    ) : pinSuccess ? (
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

                  {!isOffline && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPinMode(false);
                        setPinError(null);
                        setPin("");
                      }}
                      className="w-full text-center text-xs text-[#525E4B] hover:text-[#142010] py-1 transition-colors"
                    >
                      Use Email &amp; Password instead
                    </button>
                  )}
                </form>
              )}
            </div>
          ) : (
            /* ── MODE 2: STANDARD CLOUD LOGIN ── */
            <>
              {errorMsg && (
                <div className="p-3 text-xs rounded-[6px] bg-red-50 text-red-700 border border-red-200 font-medium">
                  {errorMsg}
                </div>
              )}

              {isNavigating && (
                <div className="p-3 text-xs rounded-[6px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-medium flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#166534]" />
                  <span>Signed in! Preparing your school dashboard…</span>
                </div>
              )}

              {/* 1-Click Google Sign In */}
              <GoogleSignInButton mode="signin" returnUrl={returnUrl} />

              {/* Clean Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-[#E8DFC9] w-full" />
                <span className="bg-white px-2.5 text-[10.5px] font-semibold text-[#888888] uppercase tracking-wider relative shrink-0">
                  or with password
                </span>
                <div className="border-t border-[#E8DFC9] w-full" />
              </div>

              <form action={formAction} className="space-y-4">
                <input type="hidden" name="returnUrl" value={returnUrl} />

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-[#444444] mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#AAAAAA]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      disabled={isBusy}
                      autoComplete="email"
                      placeholder="teacher@school.cm"
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="text-xs font-semibold text-[#444444]"
                    >
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-[#2A7C13] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#AAAAAA]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      disabled={isBusy}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142010] hover:bg-[#1e3318] text-white font-semibold text-sm rounded-[6px] shadow-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isNavigating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Loading Dashboard…</span>
                    </>
                  ) : isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

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

        <p className="text-center text-xs text-[#777777] mt-5">
          Need access?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#2A7C13] hover:underline"
          >
            Create an account
          </Link>
        </p>

        <div className="flex items-center justify-center gap-3 text-[11px] text-[#888888] mt-4">
          <Link href="/terms" className="hover:text-[#2A7C13] hover:underline">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-[#2A7C13] hover:underline">Privacy Policy</Link>
        </div>

        <p className="text-center text-[10px] text-[#AAAAAA] mt-2">
          © {new Date().getFullYear()} Nsei Sukul · Management Systems · Built for Cameroon Secondary Education
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
