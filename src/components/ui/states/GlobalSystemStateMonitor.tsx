"use client";

import React, { useState, useEffect } from "react";
import { NoInternetBanner } from "./NoInternetState";
import { SlowNetworkAlert } from "./SlowNetworkState";
import { SessionExpiredModal } from "./SessionExpiredState";
import { initHubAutoSyncListener } from "@/lib/academic/hub-auto-sync";
import { Wifi, CheckCircle2, X } from "lucide-react";

/**
 * Global System State Monitor
 * Runs in the background of the Dashboard Layout to handle:
 * - Real-time Network offline / online events (State 4)
 * - Automatic Sukul Hub Discovery & Sync when connecting to School Wi-Fi
 * - Slow 2G latency advisories (State 5)
 * - Session expiration / 401 re-authentication popups (State 8)
 */
export function GlobalSystemStateMonitor() {
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [slowNetworkWarning, setSlowNetworkWarning] = useState<string | null>(null);
  const [hubSyncToast, setHubSyncToast] = useState<{ count: number; hubName: string } | null>(null);
  const [cloudSyncToast, setCloudSyncToast] = useState<{ count: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Initialize Sukul Hub LAN auto-sync listener
    const stopHubSync = initHubAutoSyncListener();

    // 2. Listen for LAN Hub sync success
    const handleHubSyncSuccess = (e: any) => {
      const detail = e.detail;
      if (detail && detail.transferredCount > 0) {
        setHubSyncToast({
          count: detail.transferredCount,
          hubName: detail.hubName || "School Sukul Hub",
        });
        setTimeout(() => setHubSyncToast(null), 7000);
      }
    };

    // 3. Listen for Cloud sync success
    const handleCloudSyncSuccess = (e: any) => {
      const detail = e.detail;
      if (detail && detail.transferredCount > 0) {
        setCloudSyncToast({ count: detail.transferredCount });
        setTimeout(() => setCloudSyncToast(null), 5000);
      }
    };

    // 4. Session & network warning events
    const handleSessionExpired = () => setIsSessionExpired(true);
    const handleSlowNetwork = (e: any) => {
      setSlowNetworkWarning(e?.detail?.message || "Slow network detected. Request is in transit.");
      setTimeout(() => setSlowNetworkWarning(null), 8000);
    };

    window.addEventListener("nsei:hub-sync-success", handleHubSyncSuccess);
    window.addEventListener("nsei:cloud-sync-success", handleCloudSyncSuccess);
    window.addEventListener("nsei:session-expired", handleSessionExpired);
    window.addEventListener("nsei:slow-network", handleSlowNetwork);

    // Global fetch interceptor to detect 401 unauthorized responses
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent("nsei:session-expired"));
        }
        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      stopHubSync();
      window.removeEventListener("nsei:hub-sync-success", handleHubSyncSuccess);
      window.removeEventListener("nsei:cloud-sync-success", handleCloudSyncSuccess);
      window.removeEventListener("nsei:session-expired", handleSessionExpired);
      window.removeEventListener("nsei:slow-network", handleSlowNetwork);
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <>
      {/* 4. No Internet Banner — Auto-activates on offline */}
      <NoInternetBanner />

      {/* Sukul Hub Wi-Fi LAN Sync Toast */}
      {hubSyncToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] px-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 rounded-[8px] bg-[#142010] text-white border border-[#2A7C13] shadow-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-full bg-[#2A7C13] text-white shrink-0">
                <Wifi className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-[#76C457]">Connected to School Wi-Fi</p>
                <p className="text-[11px] text-white/90">
                  Transferred <strong>{hubSyncToast.count}</strong> marks directly to <strong>{hubSyncToast.hubName}</strong> over local LAN!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHubSyncToast(null)}
              className="p-1 text-white/60 hover:text-white rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Cloud Sync Toast */}
      {cloudSyncToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] px-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2.5 rounded-[8px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] shadow-md flex items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
              <span>
                Synced <strong>{cloudSyncToast.count}</strong> marks with school cloud.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCloudSyncToast(null)}
              className="p-0.5 text-[#166534] hover:text-[#14532D] cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Slow Network Advisory Banner if active */}
      {slowNetworkWarning && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[calc(100%-2rem)] px-2">
          <SlowNetworkAlert
            message={slowNetworkWarning}
            className="shadow-lg"
          />
        </div>
      )}

      {/* 8. Session Expired Modal — Pops up on 401 */}
      <SessionExpiredModal
        isOpen={isSessionExpired}
        onSuccess={() => setIsSessionExpired(false)}
        hasUnsavedChanges={true}
      />
    </>
  );
}

/**
 * Helper utilities that can be called from anywhere in the client codebase
 */
export function notifySessionExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nsei:session-expired"));
  }
}

export function notifySlowNetwork(message?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nsei:slow-network", { detail: { message } }));
  }
}

export default GlobalSystemStateMonitor;
