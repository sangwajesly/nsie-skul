"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home, ChevronDown, ChevronUp, Copy, Check, MessageSquare } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  errorCode?: string;
  onRetry?: () => void;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
  className?: string;
}

/**
 * 3. ERROR STATE
 * Production-ready error component with friendly explanation, retry handler,
 * and expandable technical diagnostics for support.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while processing this request. Your data remains safe.",
  error,
  errorCode,
  onRetry,
  actionHref,
  actionLabel = "Return to Dashboard",
  compact = false,
  className = "",
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const errorString =
    typeof error === "string" ? error : error?.message || (error ? JSON.stringify(error) : "");
  const referenceCode =
    errorCode || (typeof error !== "string" && (error as any)?.digest) || `ERR_${Date.now().toString(36).toUpperCase()}`;

  const copyDiagnostic = () => {
    const diagnostic = `Nsei Sukul Error Report:\nRef: ${referenceCode}\nTime: ${new Date().toISOString()}\nError: ${errorString || message}`;
    navigator.clipboard.writeText(diagnostic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div
        className={`p-3.5 rounded-[8px] bg-red-50/80 border border-red-200 text-xs text-red-900 flex items-start justify-between gap-3 ${className}`}
        role="alert"
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-950">{title}</p>
            <p className="text-red-800 text-[11px] mt-0.5">{message}</p>
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-900 font-bold text-[11px] transition-colors shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-6 sm:p-8 rounded-[12px] bg-white border border-red-200 shadow-2xs max-w-xl mx-auto text-center space-y-4 ${className}`}
      role="alert"
    >
      {/* Icon Badge */}
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-100 mx-auto">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-extrabold text-[#142010] tracking-tight">{title}</h3>
        <p className="text-xs sm:text-sm text-[#525E4B] leading-relaxed max-w-md mx-auto">{message}</p>
      </div>

      {/* Action buttons */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}

        {actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-white border border-[#D5CBB2] text-[#444444] hover:bg-[#F7F3E8] text-xs font-semibold transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-[#525E4B]" />
            <span>{actionLabel}</span>
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-white border border-[#D5CBB2] text-[#444444] hover:bg-[#F7F3E8] text-xs font-semibold transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-[#525E4B]" />
            <span>Dashboard</span>
          </Link>
        )}
      </div>

      {/* Expandable Technical Support Diagnostic */}
      <div className="pt-3 border-t border-[#E8DFC9]/70 text-left">
        <div className="flex items-center justify-between text-[11px] text-[#777777]">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 font-semibold hover:text-[#142010] cursor-pointer"
          >
            <span>{showDetails ? "Hide technical details" : "Technical diagnostic code"}</span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <span className="font-mono text-[10px] text-[#999999]">Ref: {referenceCode}</span>
        </div>

        {showDetails && (
          <div className="mt-2.5 p-3 rounded-[6px] bg-[#FAF8F5] border border-[#E8DFC9] space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#142010]">System Diagnostic Details</span>
              <button
                type="button"
                onClick={copyDiagnostic}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[#D5CBB2] text-[10px] font-semibold text-[#555555] hover:bg-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-[#2A7C13]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy Code"}</span>
              </button>
            </div>

            {errorString && (
              <pre className="font-mono text-[10px] text-red-800 bg-red-50/70 p-2 rounded border border-red-100 overflow-x-auto whitespace-pre-wrap">
                {errorString}
              </pre>
            )}

            <p className="text-[10px] text-[#777777] leading-relaxed">
              If this issue persists, please send this diagnostic code to your School IT Administrator or Nsei Sukul Support on WhatsApp: <strong>682 833 601</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorState;
