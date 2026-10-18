"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5] p-4 font-sans text-[#142010]">
      <div className="w-full max-w-md bg-white border border-[#E8DFC9] rounded-[10px] p-8 shadow-sm text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-600 mb-2">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-[#142010]">
          Unable to Load Session
        </h1>

        <p className="text-xs text-[#666666] leading-relaxed">
          The requested page could not load. This usually happens if your session has expired, or the user profile is pending school assignment.
        </p>

        {error.digest && (
          <div className="p-2 bg-[#F9F9F6] border border-[#E8DFC9] rounded font-mono text-[10px] text-[#888888]">
            Reference Code: {error.digest}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-semibold rounded-[6px] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try Again
          </button>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#D5CBB2] text-[#142010] text-xs font-semibold rounded-[6px] hover:bg-[#F9F6ED] transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-[#2A7C13]" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
