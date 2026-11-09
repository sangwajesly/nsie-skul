"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { usePwa } from "./PwaProvider";

const SESSION_DISMISS_KEY = "nsei_pwa_floating_dismissed_session";

export function FloatingPwaInstallPrompt() {
  const { isInstalled, installApp, isIOS } = usePwa();
  const [mounted, setMounted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const sessionDismissed = sessionStorage.getItem(SESSION_DISMISS_KEY) === "true";
      setIsDismissed(sessionDismissed);

      // If not dismissed for this session and not already installed, show after 1.5s
      if (!sessionDismissed && !isInstalled) {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // In case session storage is restricted
    }
  }, [isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, "true");
    } catch {}
  };

  const handleInstall = async () => {
    await installApp();
  };

  if (!mounted || isInstalled || isDismissed || !isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Install Nsei Sukul App"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 max-w-[350px] w-[calc(100vw-2rem)] bg-white text-[#142010] rounded-[12px] p-4 shadow-2xl border border-[#2A7C13]/30 animate-in slide-in-from-bottom-5 fade-in duration-300 print:hidden"
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
                Install Nsei Sukul App
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-[#EAF7E4] text-[#1F5C0E] border border-[#76C457]/40">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-[#2A7C13] font-semibold flex items-center gap-1 mt-0.5 truncate">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>Works offline &amp; 1-tap launch</span>
            </p>
          </div>
        </div>

        {/* Close / Dismiss for this session */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-full text-[#788470] hover:text-[#142010] hover:bg-[#F2F2EC] transition-colors shrink-0"
          title="Dismiss for now"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11.5px] text-[#525E4B] leading-relaxed mt-2.5">
        Install on your phone or laptop for instant home-screen access, full-screen speed, and offline grade entry without opening your browser.
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#EEEEEC]">
        <button
          type="button"
          onClick={handleInstall}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[6px] text-xs font-bold bg-[#2A7C13] hover:bg-[#20600E] text-white shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isIOS ? "Add to Home Screen" : "Install App"}</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="px-2.5 py-2 text-xs font-semibold text-[#788470] hover:text-[#142010] rounded-[6px] transition-colors"
        >
          Later
        </button>
      </div>
    </aside>
  );
}
