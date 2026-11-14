"use client";

import { usePwa } from "./PwaProvider";
import { Download, Smartphone } from "lucide-react";

interface PwaInstallButtonProps {
  variant?: "sidebar" | "drawer" | "pill" | "nav";
  className?: string;
}

export function PwaInstallButton({
  variant = "sidebar",
  className = "",
}: PwaInstallButtonProps) {
  const { isInstalled, installApp, isDesktop } = usePwa();

  // If already installed in standalone mode, do not show button
  if (isInstalled) {
    return null;
  }

  if (variant === "drawer") {
    return (
      <button
        type="button"
        onClick={installApp}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[7px] bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] transition-colors font-semibold text-xs cursor-pointer ${className}`}
      >
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#2A7C13]" />
          <span>Install Nsei Sukul App (PWA)</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#2A7C13] text-white px-1.5 py-0.5 rounded-[4px]">
          Install
        </span>
      </button>
    );
  }

  if (variant === "nav" || variant === "pill") {
    return (
      <button
        type="button"
        onClick={installApp}
        className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[6px] bg-[#142010] hover:bg-[#1f3319] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${className}`}
        title="Install Nsei Sukul PWA on phone, tablet, or PC"
      >
        <Download className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
        <span>{isDesktop ? "Install on PC" : "Install App"}</span>
      </button>
    );
  }

  // Default: Sidebar item
  return (
    <button
      type="button"
      onClick={installApp}
      className={`w-full flex items-center justify-between p-2.5 rounded-[7px] bg-[#FAFAF8] hover:bg-[#F2F2EC] border border-[#E8DFC9] text-left transition-colors group cursor-pointer ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-[5px] bg-[#142010] text-[#4ADE80] flex items-center justify-center shrink-0">
          <Download className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="text-[12px] font-bold text-[#142010] group-hover:text-[#2A7C13] transition-colors leading-tight">
            {isDesktop ? "Install on PC" : "Install App (PWA)"}
          </div>
          <div className="text-[10px] text-[#788470] leading-tight">
            {isDesktop ? "Native offline desktop app" : "Offline phone & desktop app"}
          </div>
        </div>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[3px] bg-[#EBF5E9] text-[#2A7C13] border border-[#C3E4BC]">
        {isDesktop ? "PC App" : "Offline"}
      </span>
    </button>
  );
}
