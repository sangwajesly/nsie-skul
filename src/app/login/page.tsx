"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { loginAction } from "@/app/auth/actions";
import { GraduationCap, ArrowRight, Lock, Mail } from "lucide-react";

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5] p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[10px] bg-[#142010] text-white mb-4">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#142010]">
            Nsei Skul
          </h1>
          <p className="text-xs text-[#666666] mt-1">
            Secondary School Management Platform · Sign in to continue
          </p>
        </div>

        <div className="bg-white border border-[#E8DFC9] rounded-[10px] shadow-sm p-7 space-y-5">
          {state?.error && (
            <div className="p-3 text-xs rounded-[6px] bg-red-50 text-red-700 border border-red-200 font-medium">
              {state.error}
            </div>
          )}

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
                  autoComplete="email"
                  placeholder="admin@school.cm"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all"
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#142010] hover:bg-[#1e3318] text-white font-semibold text-sm rounded-[6px] shadow-sm transition-all disabled:opacity-50"
            >
              {isPending ? "Signing in..." : "Sign in to Dashboard"}
              {!isPending && <ArrowRight className="w-4 h-4" />}
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

        <p className="text-center text-[10px] text-[#AAAAAA] mt-4">
          © {new Date().getFullYear()} Nsei Skul · Built for Cameroon Secondary Education
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
