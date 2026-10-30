"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface Props {
  mode?: "signin" | "signup" | "continue";
  returnUrl?: string;
  className?: string;
}

export function GoogleSignInButton({
  mode = "continue",
  returnUrl = "/dashboard",
  className = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const supabase = createClient();
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "";

      const safeReturn =
        returnUrl.startsWith("/dashboard") || returnUrl === "/onboarding"
          ? returnUrl
          : "/dashboard";

      const redirectTo = `${origin}/auth/callback?returnUrl=${encodeURIComponent(safeReturn)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || "Failed to initialize Google authentication.");
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while connecting to Google.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const buttonText =
    mode === "signin"
      ? "Sign in with Google"
      : mode === "signup"
      ? "Sign up with Google"
      : "Continue with Google";

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {errorMessage && (
        <div className="p-2.5 text-xs rounded-[6px] bg-red-50 text-red-700 border border-red-200 font-medium">
          {errorMessage}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-[6px] bg-white hover:bg-[#FAF8F2] text-[#142010] text-xs sm:text-sm font-semibold border border-[#D5CBB2] hover:border-[#142010] shadow-2xs hover:shadow-xs transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#2A7C13]" />
        ) : (
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{loading ? "Connecting to Google…" : buttonText}</span>
      </button>
    </div>
  );
}
