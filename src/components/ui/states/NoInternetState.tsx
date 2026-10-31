"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw, HardDrive, Wifi, ShieldAlert } from "lucide-react";

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
      className={`bg-[#2B1B04] text-[#FDE68A] border-b border-[#78350F] px-4 py-2.5 text-xs shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1 rounded bg-[#B45309]/30 text-[#F59E0B] shrink-0">
          <WifiOff className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-amber-200">Offline Mode Active: </span>
          <span className="text-amber-100/90">
            No internet detected. All mark entries and changes are saved safely on this device and will automatically sync when reconnected.
          </span>
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 font-mono text-[10px] font-bold border border-amber-500/30">
              <HardDrive className="w-2.5 h-2.5" />
              <span>{pendingCount} saved locally</span>
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleCheckConnection}
        disabled={isChecking}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#B45309] hover:bg-[#92400E] text-white text-[11px] font-bold transition-colors shrink-0 cursor-pointer shadow-2xs disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${isChecking ? "animate-spin" : ""}`} />
        <span>{isChecking ? "Checking..." : "Check Connection"}</span>
      </button>
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
  description = "This feature requires an active internet connection to communicate with the central database. Your offline mark drafts and student registers are still available.",
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
      className={`p-6 sm:p-8 rounded-[12px] bg-white border border-[#E8DFC9] shadow-2xs max-w-lg mx-auto text-center space-y-4 ${className}`}
      role="status"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFF8CF] text-[#B45309] border border-[#FBE6C2] mx-auto">
        <WifiOff className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-extrabold text-[#142010] tracking-tight">{title}</h3>
        <p className="text-xs sm:text-sm text-[#525E4B] leading-relaxed max-w-sm mx-auto">{description}</p>
      </div>

      <div className="p-3.5 rounded-[8px] bg-[#FDFBF7] border border-[#E8DFC9] text-left text-xs text-[#525E4B] space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#142010]">
          <HardDrive className="w-4 h-4 text-[#2A7C13]" />
          <span>Local Data Preservation Active</span>
        </div>
        <p className="text-[11px] leading-relaxed">
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
          <span>{isRetrying ? "Testing Network..." : "Retry Connection"}</span>
        </button>
      </div>
    </div>
  );
}

export default NoInternetBanner;
