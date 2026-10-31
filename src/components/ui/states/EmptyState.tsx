"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { LucideIcon, FolderPlus, ArrowRight, Sparkles } from "lucide-react";

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: "primary" | "secondary";
}

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  variant?: "default" | "compact" | "card" | "dashed";
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  tip?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * 1. EMPTY STATE
 * Universal empty state component for tables, rosters, and collection views.
 * Designed with warm institutional styling matching Cameroon education workflows.
 */
export function EmptyState({
  title,
  description,
  icon: Icon = FolderPlus,
  variant = "default",
  action,
  secondaryAction,
  tip,
  className = "",
  children,
}: EmptyStateProps) {
  const isCompact = variant === "compact";
  const isDashed = variant === "dashed";

  const containerClasses = {
    default: "py-12 px-4 text-center",
    compact: "py-6 px-4 text-center",
    card: "p-8 text-center rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs",
    dashed: "p-8 text-center rounded-[10px] bg-[#FFFDF5]/70 border-2 border-dashed border-[#D5CBB2]",
  }[variant];

  return (
    <div className={`${containerClasses} ${className} flex flex-col items-center justify-center`}>
      {/* Visual Badge Icon */}
      <div
        className={`inline-flex items-center justify-center rounded-2xl bg-[#EAF7E4] border border-[#BBF7D0] text-[#2A7C13] shadow-xs ${
          isCompact ? "w-10 h-10 mb-3" : "w-14 h-14 mb-4"
        }`}
      >
        <Icon className={isCompact ? "w-5 h-5" : "w-7 h-7"} />
      </div>

      {/* Headline & Description */}
      <h3
        className={`font-extrabold text-[#142010] tracking-tight ${
          isCompact ? "text-sm" : "text-base sm:text-lg"
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-[#525E4B] max-w-md mx-auto mt-1 leading-relaxed ${
          isCompact ? "text-xs" : "text-xs sm:text-sm"
        }`}
      >
        {description}
      </p>

      {/* Optional Pro-Tip banner */}
      {tip && (
        <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF8CF] border border-[#FBE6C2] text-[#7A4A00] text-[11px] font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
          <span>{tip}</span>
        </div>
      )}

      {/* Action Buttons */}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {action.icon && <action.icon className="w-3.5 h-3.5" />}
                <span>{action.label}</span>
                {!action.icon && <ArrowRight className="w-3 h-3 text-white/80" />}
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {action.icon && <action.icon className="w-3.5 h-3.5" />}
                <span>{action.label}</span>
                {!action.icon && <ArrowRight className="w-3 h-3 text-white/80" />}
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-white border border-[#D5CBB2] text-[#444444] hover:bg-[#F7F3E8] text-xs font-semibold transition-colors cursor-pointer"
              >
                {secondaryAction.icon && <secondaryAction.icon className="w-3.5 h-3.5" />}
                <span>{secondaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-white border border-[#D5CBB2] text-[#444444] hover:bg-[#F7F3E8] text-xs font-semibold transition-colors cursor-pointer"
              >
                {secondaryAction.icon && <secondaryAction.icon className="w-3.5 h-3.5" />}
                <span>{secondaryAction.label}</span>
              </button>
            )
          )}
        </div>
      )}

      {/* Extra child content */}
      {children && <div className="mt-4 w-full">{children}</div>}
    </div>
  );
}

export default EmptyState;
