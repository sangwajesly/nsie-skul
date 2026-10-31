"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Printer, Check, X, Sparkles } from "lucide-react";

export interface SuccessCardProps {
  title: string;
  message: string;
  badgeText?: string;
  details?: { label: string; value: string | React.ReactNode }[];
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

/**
 * 10. SUCCESS STATE
 * Affirmative feedback when a key academic or financial task completes.
 */
export function SuccessCard({
  title,
  message,
  badgeText = "Completed Successfully",
  details,
  primaryAction,
  secondaryAction,
  className = "",
}: SuccessCardProps) {
  return (
    <div
      className={`p-6 sm:p-8 rounded-[12px] bg-white border border-[#BBF7D0] shadow-sm max-w-lg mx-auto text-center space-y-4 animate-in fade-in zoom-in-95 duration-200 ${className}`}
      role="status"
    >
      {/* Icon Badge */}
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#EAF7E4] text-[#2A7C13] border border-[#BBF7D0] shadow-xs mx-auto">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[11px] font-bold text-[#166534]">
          {badgeText}
        </span>
        <h3 className="text-lg font-extrabold text-[#142010] tracking-tight">{title}</h3>
        <p className="text-xs sm:text-sm text-[#525E4B] leading-relaxed max-w-md mx-auto">{message}</p>
      </div>

      {/* Transaction Details Table if provided */}
      {details && details.length > 0 && (
        <div className="p-3.5 rounded-[8px] bg-[#F9FBF8] border border-[#E8DFC9] text-left text-xs divide-y divide-[#E8DFC9]/60">
          {details.map((d, i) => (
            <div key={i} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
              <span className="text-[#666666] font-medium">{d.label}</span>
              <span className="font-bold text-[#142010] text-right">{d.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Primary & Secondary Action CTAs */}
      {(primaryAction || secondaryAction) && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
          {primaryAction && (
            primaryAction.href ? (
              <Link
                href={primaryAction.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {primaryAction.icon || <Check className="w-3.5 h-3.5" />}
                <span>{primaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {primaryAction.icon || <Check className="w-3.5 h-3.5" />}
                <span>{primaryAction.label}</span>
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[6px] bg-white border border-[#D5CBB2] text-[#444444] hover:bg-[#F7F3E8] text-xs font-semibold transition-colors cursor-pointer"
              >
                {secondaryAction.icon}
                <span>{secondaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[6px] bg-white border border-[#D5CBB2] text-[#444444] hover:bg-[#F7F3E8] text-xs font-semibold transition-colors cursor-pointer"
              >
                {secondaryAction.icon}
                <span>{secondaryAction.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export interface SuccessBannerProps {
  message: string;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

export function SuccessBanner({
  message,
  title = "Success",
  onDismiss,
  className = "",
}: SuccessBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  return (
    <div
      className={`p-3.5 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] flex items-start justify-between gap-3 shadow-2xs animate-in fade-in duration-200 ${className}`}
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#14532D]">{title}</p>
          <p className="text-[11px] text-[#166534] mt-0.5">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="p-1 hover:bg-[#BBF7D0]/40 rounded text-[#166534] cursor-pointer"
        title="Dismiss message"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default SuccessCard;
