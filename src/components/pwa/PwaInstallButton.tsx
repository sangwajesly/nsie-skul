"use client";

import { usePwa } from "./PwaProvider";
import { Download, Smartphone } from "lucide-react";

interface PwaInstallButtonProps {
  variant?: "sidebar" | "drawer" | "pill";
  className?: string;
}

export function PwaInstallButton({
  variant = "sidebar",
  className = "",
}: PwaInstallButtonProps) {
  const { isInstalled, installApp } = usePwa();

  // If already installed in standalone mode, do not show button
  if (isInstalled) {
    return null;
  }

  if (variant === "drawer") {
    return (
      <button
        type="button"
        onClick={installApp}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[7px] bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] transition-colors font-semibold text-xs ${className}`}
      >
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#2A7C13]" />
          <span>Install Nsei Skul App</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#2A7C13] text-white px-1.5 py-0.5 rounded-[4px]">
          Install
        </span>
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={installApp}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#142010] hover:bg-[#1f3319] text-white text-[11px] font-semibold shadow-xs transition-colors ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-[#4ADE80]" />
        <span>Install App</span>
      </button>
    );
  }

  // Default: Sidebar item
  return (
    <button
      type="button"
      onClick={installApp}
      className={`w-full flex items-center justify-between p-2.5 rounded-[7px] bg-[#FAFAF8] hover:bg-[#F2F2EC] border border-[#E8DFC9] text-left transition-colors group ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-[5px] bg-[#142010] text-[#4ADE80] flex items-center justify-center shrink-0">
          <Download className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="text-[12px] font-bold text-[#142010] group-hover:text-[#2A7C13] transition-colors leading-tight">
            Install App
          </div>
          <div className="text-[10px] text-[#788470] leading-tight">
            Add to home screen
          </div>
        </div>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[3px] bg-[#EBF5E9] text-[#2A7C13] border border-[#C3E4BC]">
        Offline
      </span>
    </button>
  );
}
