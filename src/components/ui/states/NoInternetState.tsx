"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw, HardDrive, Wifi, ShieldAlert, ArrowRight, Laptop } from "lucide-react";

export interface NoInternetBannerProps {
  pendingCount?: number;
  className?: string;
  onRefresh?: () => void;
}

/**
 * 4. NO INTERNET (OFFLINE STATE)
 * Vital for Cameroon schools where internet fluctuates daily.
 * Reassures teachers that their data is safely persisted in device IndexedDB.
 */
export function NoInternetBanner({
  pendingCount = 0,
  className = "",
  onRefresh,
}: NoInternetBannerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleCheckConnection = async () => {
    setIsChecking(true);
    try {
      // Ping an ultra-light local or network endpoint
      await fetch("/api/v1/health", { method: "HEAD", cache: "no-store" });
      setOnline(true);
      if (onRefresh) onRefresh();
    } catch {
      setOnline(false);
    } finally {
      setTimeout(() => setIsChecking(false), 600);
    }
  };

  if (online) return null;

  return (
    <div
      className={`bg-[#1E160C] text-[#FDE68A] border-b border-[#78350F]/70 px-4 py-2.5 text-xs shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-amber-200">Offline Mode Active</span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 font-mono text-[10px] font-bold border border-amber-500/30">
                <HardDrive className="w-2.5 h-2.5" />
                <span>{pendingCount} saved locally</span>
              </span>
            )}
          </div>
          <p className="text-amber-100/80 text-[11px] leading-snug truncate sm:whitespace-normal">
            All mark entries and attendance are saved safely on this device and will sync automatically when reconnected.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <a
          href="/offline.html"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2A7C13] hover:bg-[#20600E] text-white text-[11px] font-bold transition-all shrink-0 shadow-2xs"
        >
          <span>Open Offline App</span>
        </a>
        <button
          type="button"
          onClick={handleCheckConnection}
          disabled={isChecking}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-2xs border border-stone-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isChecking ? "animate-spin" : ""}`} />
          <span>{isChecking ? "Checking..." : "Check Wi-Fi"}</span>
        </button>
      </div>
    </div>
  );
}

export interface NoInternetCardProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function NoInternetCard({
  title = "No Internet Connection",
  description = "This feature requires an active connection to synchronize with the cloud database. Your offline mark drafts and student registers are still available.",
  onRetry,
  className = "",
}: NoInternetCardProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    if (onRetry) {
      await onRetry();
    }
    setTimeout(() => setIsRetrying(false), 800);
  };

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl bg-white border border-[#E8DFC9] shadow-sm max-w-lg mx-auto text-center space-y-5 ${className}`}
      role="status"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs mx-auto">
        <WifiOff className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-black tracking-tight text-[#142010]">{title}</h3>
        <p className="text-xs sm:text-sm text-[#525E4B] leading-relaxed max-w-sm mx-auto">{description}</p>
      </div>

      <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#E8DFC9] text-left text-xs text-[#525E4B] space-y-2">
        <div className="flex items-center gap-2 font-black text-[#142010]">
          <HardDrive className="w-4 h-4 text-[#2A7C13]" />
          <span>Local Data Preservation Active</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#525E4B]">
          • You can continue entering marks and attendance in offline draft mode.
          <br />
          • If your campus has a <strong>Nsei Sukul School Hub (LAN)</strong> running, connect your laptop or phone to the staff Wi-Fi to sync locally without internet!
        </p>
      </div>

      <div className="pt-2 flex items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2A7C13] hover:bg-[#20600E] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
          <span>{isRetrying ? "Testing Network..." : "Retry Connection"}</span>
        </button>
      </div>
    </div>
  );
}

export default NoInternetBanner;
