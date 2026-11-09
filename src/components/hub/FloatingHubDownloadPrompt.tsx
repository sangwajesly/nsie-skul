"use client";

import { useState, useEffect } from "react";
import { Download, X, Wifi, Monitor, CheckCircle2 } from "lucide-react";
import Image from "next/image";

const SESSION_DISMISS_KEY = "nsei_hub_prompt_dismissed_session";
const DOWNLOADED_KEY = "nsei_hub_downloaded";

export function FloatingHubDownloadPrompt() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    setMounted(true);

    // If running in Hub Mode (offline desktop app), never show prompt
    if (process.env.NEXT_PUBLIC_HUB_MODE === "true") {
      return;
    }

    try {
      const alreadyDownloaded = localStorage.getItem(DOWNLOADED_KEY) === "true";
      const sessionDismissed = sessionStorage.getItem(SESSION_DISMISS_KEY) === "true";

      setIsDownloaded(alreadyDownloaded);

      // If not dismissed for this session and not already installed, show after a gentle 1.5s delay
      if (!sessionDismissed && !alreadyDownloaded) {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // In case storage is restricted
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      // Dismiss for current session: will reappear on next session visit
      sessionStorage.setItem(SESSION_DISMISS_KEY, "true");
    } catch {}
  };

  const handleDownload = () => {
    try {
      localStorage.setItem(DOWNLOADED_KEY, "true");
      setIsDownloaded(true);
    } catch {}

    // Trigger direct download
    const link = document.createElement("a");
    link.href = "/api/v1/hub/download";
    link.download = "NseiSukulHubSetup.exe";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Close prompt after download begins
    setTimeout(() => {
      setIsVisible(false);
    }, 2500);
  };

  if (!mounted || !isVisible || process.env.NEXT_PUBLIC_HUB_MODE === "true") {
    return null;
  }

  return (
    <aside
      aria-label="Offline School Hub Download"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 max-w-[360px] w-[calc(100vw-2rem)] bg-[#142010] text-white rounded-[12px] p-4 shadow-2xl border border-[#2A7C13]/40 animate-in slide-in-from-bottom-5 fade-in duration-300 print:hidden"
    >
      <div className="flex items-start justify-between gap-3">
        {/* App Logo & Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-[8px] bg-[#1C3217] border border-[#4ADE80]/30 p-1 flex items-center justify-center shrink-0 shadow-inner">
            <Image
              src="/app-icon.png"
              alt="Nsei Sukul Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[13px] text-white leading-tight">
                School Hub Desktop
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-[#2A7C13] text-[#DCFCE7] border border-[#4ADE80]/40">
                .EXE
              </span>
            </div>
            <p className="text-[11px] text-[#CCECC0] flex items-center gap-1 mt-0.5">
              <Wifi className="w-3 h-3 text-[#4ADE80]" />
              <span>Works 100% Offline in School</span>
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-md text-[#888888] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Dismiss for this session"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-[#D8EEDB] mt-2.5 leading-relaxed">
        Install the offline School Hub on your school laptop or desktop. Teachers connect over the laptop hotspot with zero internet needed.
      </p>

      {/* Action Buttons */}
      <div className="mt-3.5 flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 py-2 px-3 rounded-[6px] bg-[#4ADE80] hover:bg-[#22C55E] text-[#142010] font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Download App (.exe)</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="py-2 px-3 rounded-[6px] bg-white/10 hover:bg-white/15 text-white/90 font-medium text-xs transition-colors cursor-pointer"
        >
          Later
        </button>
      </div>
    </aside>
  );
}
