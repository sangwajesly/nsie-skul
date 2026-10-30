"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { loginAction } from "@/app/auth/actions";
import { GraduationCap, ArrowRight, Lock, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";
  const urlError = searchParams.get("error");
  const [isNavigating, setIsNavigating] = useState(false);

  // Pre-warm the target destination route assets so transition is fast
  useEffect(() => {
    router.prefetch(returnUrl);
  }, [router, returnUrl]);

  // When the action returns a redirectTo, smoothly transition
  useEffect(() => {
    if (state && "redirectTo" in state) {
      setIsNavigating(true);
      router.replace(state.redirectTo);
    }
  }, [state, router]);

  const errorMsg = (state && "error" in state ? state.error : null) || urlError;
  const isBusy = isPending || isNavigating;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5] p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[10px] bg-[#142010] text-white mb-4">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142010]">
            Nsei Sukul Management System
          </h1>
          <p className="text-xs text-[#666666] mt-1">
            Secondary School Management Platform · Sign in to continue
          </p>
        </div>

        <div className="bg-white border border-[#E8DFC9] rounded-[10px] shadow-sm p-7 space-y-4">
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
            {/* Hidden returnUrl */}
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
                  placeholder="admin@school.cm"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#444444]"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#2A7C13] hover:underline font-medium"
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
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all disabled:opacity-60"
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
          © {new Date().getFullYear()} Nsei Sukul Management System · Built for Cameroon Secondary Education
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
