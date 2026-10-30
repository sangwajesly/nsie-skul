"use client";

import { useActionState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerAction } from "@/app/auth/actions";
import { GraduationCap, ArrowRight, Lock, Mail, User } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(registerAction, null);
  const urlError = searchParams.get("error");

  // Navigate client-side when the action returns a redirectTo path
  useEffect(() => {
    if (state && "redirectTo" in state) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  const errorMsg = (state && "error" in state ? state.error : null) || urlError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5] p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[10px] bg-[#142010] text-white mb-4">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142010]">
            Create Account
          </h1>
          <p className="text-xs text-[#666666] mt-1">
            Set up your school or join as staff on Nsei Sukul Management System
          </p>
        </div>

        <div className="bg-white border border-[#E8DFC9] rounded-[10px] shadow-sm p-7 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-[6px] bg-red-50 text-red-700 border border-red-200 font-medium">
              {errorMsg}
            </div>
          )}

          {/* 1-Click Google Sign Up */}
          <GoogleSignInButton mode="signup" returnUrl="/onboarding" />

          {/* Clean Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-[#E8DFC9] w-full" />
            <span className="bg-white px-2.5 text-[10.5px] font-semibold text-[#888888] uppercase tracking-wider relative shrink-0">
              or register with email
            </span>
            <div className="border-t border-[#E8DFC9] w-full" />
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-semibold text-[#444444] mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#AAAAAA]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Mme. Florence Bih"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all"
                />
              </div>
            </div>

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
                  autoComplete="email"
                  placeholder="f.bih@school.cm"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#444444] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#AAAAAA]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all"
                />
              </div>
              <p className="text-[11px] text-[#888888] mt-1">
                Minimum 8 characters. Must include letters and numbers.
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2A7C13] hover:bg-[#236810] text-white font-semibold text-sm rounded-[6px] shadow-sm transition-all disabled:opacity-50"
            >
              {isPending ? "Creating account…" : "Create Account"}
              {!isPending && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-[11px] text-center text-[#888888] mt-3 leading-relaxed">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-[#2A7C13] underline font-medium hover:text-[#1e5c0e]">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-[#2A7C13] underline font-medium hover:text-[#1e5c0e]">Privacy Policy</Link>.
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-[#777777] mt-5">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#2A7C13] hover:underline"
          >
            Sign in
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFDF5]" />}>
      <RegisterForm />
    </Suspense>
  );
}
