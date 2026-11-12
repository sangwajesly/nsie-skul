"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
} from "lucide-react";
import { syncHubWithCloudAction, lockHubStationAction } from "@/app/hub/actions";

interface HubSyncStatusBarProps {
  schoolName: string;
}

export function HubSyncStatusBar({ schoolName }: HubSyncStatusBarProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, startSyncTransition] = useTransition();
  const [isLocking, startLockTransition] = useTransition();
  const [lastSyncText, setLastSyncText] = useState("Checking...");
  const [syncNotice, setSyncNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Monitor network status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when network reconnects
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync check
    setLastSyncText("Ready");

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSync = () => {
    if (!navigator.onLine) {
      setSyncNotice({
        type: "error",
        text: "Computer is offline. Connect to Wi-Fi or mobile hotspot to sync with cloud.",
      });
      return;
    }

    setSyncNotice(null);
    startSyncTransition(async () => {
      const res = await syncHubWithCloudAction();
      if (res.success) {
        setLastSyncText("Just now");
        setSyncNotice({
          type: "success",
          text: res.message || "Cloud sync complete.",
        });
      } else {
        setSyncNotice({
          type: "error",
          text: res.message || "Sync failed. Will retry automatically.",
        });
      }

      // Auto dismiss notice after 6 seconds
      setTimeout(() => setSyncNotice(null), 6000);
    });
  };

  const handleLock = () => {
    startLockTransition(async () => {
      await lockHubStationAction();
    });
  };

  return (
    <div className="bg-[#142010] text-white border-b border-[#2A7C13]/30 px-3 sm:px-4 py-2 print:hidden z-30 sticky top-0 sm:static">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Station Identity & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1C3217] border border-[#4ADE80]/30 text-white font-semibold">
            <Server className="w-3.5 h-3.5 text-[#4ADE80]" />
            <span className="hidden sm:inline">School Hub Station:</span>
            <span className="text-[#DCFCE7] font-bold">{schoolName}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#064E3B] text-[#A7F3D0] border border-[#10B981]/40">
                <Wifi className="w-3 h-3 text-[#34D399]" />
                Cloud Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#78350F] text-[#FDE68A] border border-[#F59E0B]/40">
                <WifiOff className="w-3 h-3 text-[#FBBF24]" />
                Offline (LAN Only)
              </span>
            )}
            <span className="text-[11px] text-[#A3E635] hidden md:inline">
              Port 3000 Active
            </span>
          </div>
        </div>

        {/* Right: Sync Action & Lock */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[11px] text-[#888888] hidden lg:inline">
            Last Sync: {lastSyncText}
          </span>

          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            title="Push local marks to cloud and download updated school roster"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2A7C13] hover:bg-[#236810] text-white font-bold text-xs shadow transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync with Cloud"}</span>
          </button>

          <button
            type="button"
            onClick={handleLock}
            disabled={isLocking}
            title="Lock Station (requires PIN to unlock)"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-[#D1D5DB] hover:text-white text-xs border border-white/10 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </div>

      {/* Sync feedback notification banner */}
      {syncNotice && (
        <div
          className={`mt-1.5 px-3 py-1.5 rounded text-xs flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
            syncNotice.type === "success"
              ? "bg-[#065F46] text-[#ECFDF5] border border-[#34D399]/40"
              : "bg-[#7F1D1D] text-[#FEF2F2] border border-[#F87171]/40"
          }`}
        >
          <div className="flex items-center gap-2">
            {syncNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#F87171] shrink-0" />
            )}
            <span>{syncNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncNotice(null)}
            className="text-[10px] text-white/70 hover:text-white font-bold px-1"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
