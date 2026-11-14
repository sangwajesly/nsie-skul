"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles, ChevronUp } from "lucide-react";
import Image from "next/image";
import { usePwa } from "./PwaProvider";

const SESSION_MINIMIZED_KEY = "nsei_pwa_floating_minimized_session";

export function FloatingPwaInstallPrompt() {
  const { isInstalled, installApp, isIOS, isDesktop } = usePwa();
  const [mounted, setMounted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const sessionMinimized = sessionStorage.getItem(SESSION_MINIMIZED_KEY) === "true";
      setIsMinimized(sessionMinimized);

      if (!isInstalled) {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Session storage unavailable
    }
  }, [isInstalled]);

  const handleMinimize = () => {
    setIsMinimized(true);
    try {
      sessionStorage.setItem(SESSION_MINIMIZED_KEY, "true");
    } catch {}
  };

  const handleExpand = () => {
    setIsMinimized(false);
    try {
      sessionStorage.removeItem(SESSION_MINIMIZED_KEY);
    } catch {}
  };

  const handleInstall = async () => {
    await installApp();
  };

  // If already installed or unmounted, hide completely
  if (!mounted || isInstalled || !isVisible) {
    return null;
  }

  // Persistent minimized pill for non-installed users who dismissed the larger card
  if (isMinimized) {
    return (
      <aside
        aria-label="Install Nsei Sukul PWA"
        className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-40 print:hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <button
          type="button"
          onClick={handleInstall}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[#142010] hover:bg-[#1f3319] text-white text-xs font-bold shadow-lg border border-[#4ADE80]/30 transition-all cursor-pointer group"
          title="Install Nsei Sukul PWA on phone or desktop"
        >
          <div className="w-5 h-5 rounded-full bg-[#2A7C13] flex items-center justify-center shrink-0">
            <Download className="w-3 h-3 text-white" />
          </div>
          <span>{isDesktop ? "Install on PC" : "Install App (PWA)"}</span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleExpand();
            }}
            title="Expand details"
            className="p-0.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </span>
        </button>
      </aside>
    );
  }

  // Full Prompt Card (persistent for non-installed users)
  return (
    <aside
      aria-label="Install Nsei Sukul PWA App"
      className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-40 max-w-[360px] w-[calc(100vw-2rem)] bg-white text-[#142010] rounded-[12px] p-4 shadow-2xl border border-[#2A7C13]/30 animate-in slide-in-from-bottom-5 fade-in duration-300 print:hidden"
    >
      <div className="flex items-start justify-between gap-3">
        {/* App Logo & Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-[8px] bg-[#142010] p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
            <Image
              src="/app-icon.png"
              alt="Nsei Sukul Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-[13px] text-[#142010] leading-tight">
                Install Nsei Sukul
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-[#EAF7E4] text-[#1F5C0E] border border-[#76C457]/40">
                PWA Web App
              </span>
            </div>
            <p className="text-[11px] text-[#2A7C13] font-semibold flex items-center gap-1 mt-0.5 truncate">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>Works offline &amp; 1-tap launch</span>
            </p>
          </div>
        </div>

        {/* Minimize button */}
        <button
          type="button"
          onClick={handleMinimize}
          className="p-1 rounded-full text-[#788470] hover:text-[#142010] hover:bg-[#F2F2EC] transition-colors shrink-0"
          title="Minimize prompt"
          aria-label="Minimize install prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11.5px] text-[#525E4B] leading-relaxed mt-2.5">
        Install the official PWA web app on your phone, tablet, or laptop for 1-tap home-screen access, full speed, and offline mark entry.
      </p>

      <p className="text-[10px] text-[#888888] mt-1 italic">
        Different from the School Hub local campus server (.exe).
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#EEEEEC]">
        <button
          type="button"
          onClick={handleInstall}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[6px] text-xs font-bold bg-[#2A7C13] hover:bg-[#20600E] text-white shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isIOS ? "Add to Home Screen" : isDesktop ? "Install on PC" : "Install PWA App"}</span>
        </button>

        <button
          type="button"
          onClick={handleMinimize}
          className="px-2.5 py-2 text-xs font-semibold text-[#788470] hover:text-[#142010] rounded-[6px] transition-colors"
        >
          Later
        </button>
      </div>
    </aside>
  );
}
