"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaContextType {
  isInstalled: boolean;
  canInstall: boolean;
  isIOS: boolean;
  installApp: () => Promise<void>;
  showIOSGuide: boolean;
  closeIOSGuide: () => void;
}

const PwaContext = createContext<PwaContextType>({
  isInstalled: false,
  canInstall: false,
  isIOS: false,
  installApp: async () => {},
  showIOSGuide: false,
  closeIOSGuide: () => {},
});

export const usePwa = () => useContext(PwaContext);

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const DISMISS_KEY = "nsei_pwa_dismissed_at";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // 2. Check if already installed in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    setIsInstalled(isStandalone);
    if (isStandalone) return;

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isAppleDevice);

    // 4. Check 2-Day frequency
    const shouldShowEveryTwoDays = () => {
      try {
        const lastDismissed = localStorage.getItem(DISMISS_KEY);
        if (!lastDismissed) return true;
        const elapsed = Date.now() - parseInt(lastDismissed, 10);
        return elapsed >= TWO_DAYS_MS;
      } catch {
        return false;
      }
    };

    // 5. Handle beforeinstallprompt (Chromium, Android, Edge, Desktop Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      if (shouldShowEveryTwoDays()) {
        const timer = setTimeout(() => {
          setShowPromptModal(true);
        }, 3500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 6. If iOS Safari and not installed, trigger 2-day modal as well
    if (isAppleDevice && !isStandalone && shouldShowEveryTwoDays()) {
      const timer = setTimeout(() => {
        setShowPromptModal(true);
      }, 4000);
      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        clearTimeout(timer);
      };
    }

    // 7. Track successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowPromptModal(false);
      setShowIOSGuide(false);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismissModal = useCallback(() => {
    setShowPromptModal(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // Ignored
    }
  }, []);

  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      setShowPromptModal(false);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          setDeferredPrompt(null);
        } else {
          dismissModal();
        }
      } catch (err) {
        console.warn("[PWA] Installation failed:", err);
      }
    } else if (isIOS) {
      setShowPromptModal(false);
      setShowIOSGuide(true);
    }
  }, [deferredPrompt, isIOS, dismissModal]);

  const canInstall = !isInstalled && (Boolean(deferredPrompt) || isIOS);

  return (
    <PwaContext.Provider
      value={{
        isInstalled,
        canInstall,
        isIOS,
        installApp,
        showIOSGuide,
        closeIOSGuide: () => setShowIOSGuide(false),
      }}
    >
      {children}

      {/* 2-Day Recurring PWA Install Popup */}
      {showPromptModal && !isInstalled && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E8DFC9] rounded-[14px] shadow-2xl max-w-sm w-full p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            {/* Header with App Icon */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[10px] bg-[#142010] p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                  <img src="/icons/icon-192.svg" alt="Nsei Skul" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[15px] text-[#142010] tracking-tight">
                    Install Nsei Skul
                  </h3>
                  <p className="text-[11px] text-[#2A7C13] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Works offline &amp; loads instantly</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={dismissModal}
                className="p-1 text-[#888888] hover:text-[#142010] rounded-full hover:bg-[#F0EFEA] transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-[#525E4B] leading-relaxed">
              Add Nsei Skul to your home screen for instant access to student marks, attendance rolls, and class rosters without opening your browser.
            </p>

            {/* Feature Bullets */}
            <div className="p-3 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9] space-y-1.5 text-[11px] text-[#666666]">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#2A7C13] shrink-0" />
                <span>Instant full-screen app experience</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#2A7C13] shrink-0" />
                <span>Quick access from your phone or desktop</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={installApp}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[7px] bg-[#142010] hover:bg-[#1f3319] text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Download className="w-4 h-4 text-[#4ADE80]" />
                <span>Install App</span>
              </button>

              <button
                type="button"
                onClick={dismissModal}
                className="w-full py-1.5 text-xs text-[#777777] hover:text-[#142010] font-medium transition-colors text-center"
              >
                Maybe later (remind me in 2 days)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E8DFC9] rounded-[14px] shadow-2xl max-w-sm w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[15px] text-[#142010] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#2A7C13]" />
                <span>Add to iPhone / iPad</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-[#888888] hover:text-[#142010]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#666666]">
              Apple Safari does not allow automatic 1-click install, but you can add it in two taps:
            </p>

            <div className="space-y-3 text-xs text-[#444444] pt-1">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#142010] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  1
                </span>
                <p>
                  Tap the <strong className="inline-flex items-center gap-1 text-[#007AFF]"><Share className="w-3.5 h-3.5" /> Share</strong> icon at the bottom of your Safari screen.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#142010] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  2
                </span>
                <p>
                  Scroll down the share sheet and tap <strong className="inline-flex items-center gap-1 text-[#007AFF]"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#142010] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  3
                </span>
                <p>
                  Tap <strong>Add</strong> in the top-right corner to finish.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-2 py-2.5 rounded-[7px] bg-[#142010] text-white font-bold text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}
