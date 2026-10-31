"use client";

import React, { useState, useEffect } from "react";
import { Hourglass, AlertTriangle, CloudOff, RefreshCw } from "lucide-react";

export interface SlowNetworkAlertProps {
  message?: string;
  onSaveLocally?: () => void;
  className?: string;
}

/**
 * 5. SLOW NETWORK STATE (2G / High Latency Advisory)
 * Prevents teachers from double-submitting or refreshing when requests take > 4 seconds.
 */
export function SlowNetworkAlert({
  message = "Your connection is unusually slow (2G or high packet latency). Your submission is still processing. Please do not refresh.",
  onSaveLocally,
  className = "",
}: SlowNetworkAlertProps) {
  return (
    <div
      className={`p-3 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-200 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        <Hourglass className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5 animate-pulse" />
        <div>
          <p className="font-bold text-[#78350F]">Slow Network Detected</p>
          <p className="text-[11px] text-[#92400E] leading-relaxed mt-0.5">{message}</p>
        </div>
      </div>

      {onSaveLocally && (
        <button
          type="button"
          onClick={onSaveLocally}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#D97706] hover:bg-[#B45309] text-white text-[11px] font-bold transition-colors shrink-0 cursor-pointer"
        >
          <CloudOff className="w-3.5 h-3.5" />
          <span>Save as Device Draft</span>
        </button>
      )}
    </div>
  );
}

/**
 * Hook to monitor if an async task or network is experiencing high latency
 */
export function useSlowNetworkDetection(thresholdMs = 4500) {
  const [isSlow, setIsSlow] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);

  // Check Network Information API (Chrome / Android / Chromium)
  useEffect(() => {
    if (typeof window === "undefined" || !("connection" in navigator)) return;
    const conn = (navigator as any).connection;

    const checkEffectiveType = () => {
      if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") {
        setIsSlow(true);
      }
    };

    checkEffectiveType();
    conn?.addEventListener("change", checkEffectiveType);
    return () => conn?.removeEventListener("change", checkEffectiveType);
  }, []);

  const startSlowTimer = () => {
    setIsMeasuring(true);
    const timer = setTimeout(() => {
      setIsSlow(true);
    }, thresholdMs);

    return () => {
      clearTimeout(timer);
      setIsMeasuring(false);
      setIsSlow(false);
    };
  };

  return { isSlow, setIsSlow, startSlowTimer };
}

export default SlowNetworkAlert;
