"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Download, Share, PlusSquare, X, Smartphone, Monitor, Sparkles, Check, MoreVertical } from "lucide-react";

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
  isAndroid: boolean;
  isDesktop: boolean;
  installApp: () => Promise<void>;
  showInstallGuide: boolean;
  openInstallGuide: () => void;
  closeInstallGuide: () => void;
}

const PwaContext = createContext<PwaContextType>({
  isInstalled: false,
  canInstall: false,
  isIOS: false,
  isAndroid: false,
  isDesktop: false,
  installApp: async () => {},
  showInstallGuide: false,
  openInstallGuide: () => {},
  closeInstallGuide: () => {},
});

export const usePwa = () => useContext(PwaContext);

const PWA_INSTALLED_STORAGE_KEY = "nsei_pwa_installed";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<"android" | "ios" | "desktop">("android");

  useEffect(() => {
    // 1. Register Service Worker in production
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

    // 2. Platform detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isGoogleAndroid = /android/.test(userAgent);
    const isPc = !isApple && !isGoogleAndroid;

    setIsIOS(isApple);
    setIsAndroid(isGoogleAndroid);
    setIsDesktop(isPc);

    if (isApple) {
      setActiveGuideTab("ios");
    } else if (isPc) {
      setActiveGuideTab("desktop");
    } else {
      setActiveGuideTab("android");
    }

    // 3. Check if already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    let previouslyInstalled = false;
    try {
      previouslyInstalled = localStorage.getItem(PWA_INSTALLED_STORAGE_KEY) === "true";
    } catch {
      // Local storage disabled
    }

    if (isStandalone) {
      setIsInstalled(true);
      try {
        localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, "true");
      } catch {}
      return;
    }

    if (previouslyInstalled && isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 4. Handle beforeinstallprompt (Chromium, Android, Edge, Desktop Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 5. Track successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallGuide(false);
      try {
        localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, "true");
      } catch {}
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const openInstallGuide = useCallback(() => {
    setShowInstallGuide(true);
  }, []);

  const closeInstallGuide = useCallback(() => {
    setShowInstallGuide(false);
  }, []);

  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          setDeferredPrompt(null);
          try {
            localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, "true");
          } catch {}
        }
      } catch (err) {
        console.warn("[PWA] Prompt error, opening manual guide:", err);
        setShowInstallGuide(true);
      }
    } else {
      // If browser did not provide deferredPrompt (iOS, Firefox, Desktop with address bar icon, etc.)
      setShowInstallGuide(true);
    }
  }, [deferredPrompt]);

  const canInstall = !isInstalled;

  return (
    <PwaContext.Provider
      value={{
        isInstalled,
        canInstall,
        isIOS,
        isAndroid,
        isDesktop,
        installApp,
        showInstallGuide,
        openInstallGuide,
        closeInstallGuide,
      }}
    >
      {children}

      {/* Universal Installation Guide Modal for Android, Desktop, and iOS */}
      {showInstallGuide && !isInstalled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E8DFC9] rounded-[14px] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[10px] bg-[#142010] p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                  <img src="/icons/icon-192.png" alt="Nsei Sukul" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[15px] text-[#142010] tracking-tight">
                    Install Nsei Sukul App
                  </h3>
                  <p className="text-[11px] text-[#2A7C13] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>PWA - Works offline &amp; loads instantly</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeInstallGuide}
                className="p-1 text-[#888888] hover:text-[#142010] rounded-full hover:bg-[#F0EFEA] transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex rounded-[8px] bg-[#F4F4EE] p-1 gap-1 text-xs font-semibold text-[#525E4B]">
              <button
                type="button"
                onClick={() => setActiveGuideTab("android")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[6px] transition-colors ${
                  activeGuideTab === "android"
                    ? "bg-white text-[#142010] shadow-xs"
                    : "hover:text-[#142010]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[#2A7C13]" />
                <span>Android</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab("desktop")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[6px] transition-colors ${
                  activeGuideTab === "desktop"
                    ? "bg-white text-[#142010] shadow-xs"
                    : "hover:text-[#142010]"
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-[#2A7C13]" />
                <span>Desktop / PC</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab("ios")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[6px] transition-colors ${
                  activeGuideTab === "ios"
                    ? "bg-white text-[#142010] shadow-xs"
                    : "hover:text-[#142010]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[#2A7C13]" />
                <span>iPhone / iPad</span>
              </button>
            </div>

            {/* Step-by-Step Instructions based on active tab */}
            <div className="p-3.5 rounded-[10px] bg-[#FAF8F2] border border-[#E8DFC9] space-y-3 text-xs text-[#333333]">
              {activeGuideTab === "android" && (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#142010] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      1
                    </span>
                    <p className="leading-relaxed">
                      Tap the <strong className="inline-flex items-center gap-0.5 text-[#142010]"><MoreVertical className="w-3.5 h-3.5 inline text-[#2A7C13]" /> three dots menu</strong> at the top-right corner of Chrome or your browser.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#142010] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      2
                    </span>
                    <p className="leading-relaxed">
                      Select <strong className="text-[#142010]">Install app</strong> or <strong className="text-[#142010]">Add to Home screen</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#142010] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      3
                    </span>
                    <p className="leading-relaxed">
                      Tap <strong className="text-[#2A7C13]">Install</strong> to launch Nsei Sukul directly from your home screen.
                    </p>
                  </div>
                </div>
              )}

              {activeGuideTab === "desktop" && (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#142010] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      1
                    </span>
                    <p className="leading-relaxed">
                      Look at the right end of your browser URL address bar in Chrome or Microsoft Edge.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#142010] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      2
                    </span>
                    <p className="leading-relaxed">
                      Click the <strong className="inline-flex items-center gap-1 text-[#2A7C13]"><Download className="w-3.5 h-3.5" /> Install App</strong> icon, or click the browser menu (⋮) and choose <strong className="text-[#142010]">Install Nsei Sukul</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#142010] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      3
                    </span>
                    <p className="leading-relaxed">
                      Confirm <strong className="text-[#2A7C13]">Install</strong> to open the app in its own dedicated, high-speed window.
                    </p>
                  </div>
                </div>
              )}

              {activeGuideTab === "ios" && (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#142010] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      1
                    </span>
                    <p className="leading-relaxed">
                      Tap the <strong className="inline-flex items-center gap-1 text-[#007AFF]"><Share className="w-3.5 h-3.5" /> Share</strong> icon at the bottom of Safari.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#142010] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      2
                    </span>
                    <p className="leading-relaxed">
                      Scroll down and tap <strong className="inline-flex items-center gap-1 text-[#007AFF]"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#142010] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      3
                    </span>
                    <p className="leading-relaxed">
                      Tap <strong className="text-[#2A7C13]">Add</strong> in the top-right corner to finish.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Note clarifying distinction with School Hub */}
            <div className="p-2.5 rounded-[8px] bg-[#FFF8EB] border border-[#FBE6C2] text-[11px] text-[#7A5B00] leading-relaxed">
              <strong>Notice:</strong> This installs the <strong>PWA web application</strong> for phones, tablets, and laptops. For the campus-wide local offline server, download the <strong>School Hub</strong> software (.exe) in the Hub settings.
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={closeInstallGuide}
              className="w-full py-2.5 rounded-[8px] bg-[#142010] hover:bg-[#1f3319] text-white font-bold text-xs shadow-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </PwaContext.Provider>
  );
}
