"use client";

import React from "react";
import { Loader2 } from "lucide-react";

/**
 * 2. LOADING STATE
 * Comprehensive skeleton loaders & spinners designed to prevent layout shift (CLS).
 */

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  hasHeader = true,
  className = "",
}: TableSkeletonProps) {
  return (
    <div className={`w-full rounded-[8px] bg-white border border-[#E8DFC9] overflow-hidden shadow-2xs animate-pulse ${className}`}>
      {hasHeader && (
        <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] border-b border-[#E8DFC9]">
          <div className="h-4 w-32 bg-[#EAEAEA] rounded" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-20 bg-[#EAEAEA] rounded" />
            <div className="h-7 w-24 bg-[#EAEAEA] rounded" />
          </div>
        </div>
      )}

      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-[#FAF8F5]/60 border-b border-[#E8DFC9]/70 text-[11px]">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-[#E5E5DF] rounded col-span-3 sm:col-span-auto"
            style={{ width: `${60 + (i % 3) * 15}%` }}
          />
        ))}
      </div>

      {/* Row Items */}
      <div className="divide-y divide-[#F0EFEA]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center">
            {/* Col 1: Avatar / Title */}
            <div className="col-span-4 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#EAEAEA] shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-3.5 bg-[#E8E8E0] rounded w-3/4" />
                <div className="h-2.5 bg-[#F2F2EE] rounded w-1/2" />
              </div>
            </div>

            {/* Other Columns */}
            {Array.from({ length: columns - 1 }).map((_, c) => (
              <div key={c} className="col-span-2 sm:col-span-auto">
                <div
                  className="h-3 bg-[#EFEFEA] rounded"
                  style={{ width: `${40 + ((r + c) % 4) * 15}%` }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface CardGridSkeletonProps {
  count?: number;
  className?: string;
}

export function CardGridSkeleton({ count = 4, className = "" }: CardGridSkeletonProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] space-y-3 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 bg-[#F0F0EA] rounded-[3px]" />
            <div className="w-6 h-6 rounded-[4px] bg-[#F4F4EE]" />
          </div>
          <div className="h-7 w-24 bg-[#E8E8E0] rounded-[4px]" />
          <div className="h-2.5 w-36 bg-[#F6F6F2] rounded-[3px]" />
        </div>
      ))}
    </div>
  );
}

interface DetailSkeletonProps {
  className?: string;
}

export function DetailSkeleton({ className = "" }: DetailSkeletonProps) {
  return (
    <div className={`p-6 rounded-[8px] bg-white border border-[#E8DFC9] space-y-6 shadow-2xs animate-pulse ${className}`}>
      <div className="flex items-center gap-4 pb-4 border-b border-[#F0EFEA]">
        <div className="w-16 h-16 rounded-full bg-[#EAEAEA] shrink-0" />
        <div className="space-y-2 w-full max-w-sm">
          <div className="h-5 w-48 bg-[#E8E8E0] rounded" />
          <div className="h-3.5 w-32 bg-[#F2F2EE] rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-3 rounded bg-[#FAF8F5] space-y-2">
            <div className="h-3 w-16 bg-[#E5E5DF] rounded" />
            <div className="h-4 w-28 bg-[#E8E8E0] rounded" />
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-2">
        <div className="h-4 w-36 bg-[#E8E8E0] rounded" />
        <div className="h-20 w-full bg-[#F6F6F2] rounded" />
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  message?: string;
  subtext?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  message = "Loading...",
  subtext,
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-9 h-9",
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center space-y-3 ${className}`}>
      <div className="relative">
        <Loader2 className={`${sizeClasses} text-[#2A7C13] animate-spin`} />
      </div>
      {message && (
        <div className="space-y-0.5">
          <p className="text-xs sm:text-sm font-bold text-[#142010]">{message}</p>
          {subtext && <p className="text-[11px] text-[#525E4B]">{subtext}</p>}
        </div>
      )}
    </div>
  );
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "outline";
}

export function LoadingButton({
  isLoading = false,
  loadingText,
  icon,
  children,
  variant = "primary",
  disabled,
  className = "",
  ...props
}: LoadingButtonProps) {
  const variantClasses = {
    primary: "bg-[#2A7C13] hover:bg-[#20600E] text-white shadow-xs",
    secondary: "bg-[#142010] hover:bg-[#20600E] text-white shadow-xs",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-xs",
    outline: "bg-white border border-[#D5CBB2] text-[#444444] hover:bg-[#F7F3E8]",
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] text-xs font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}

export function FullPageLoading({ message = "Loading academic systems..." }: { message?: string }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="p-8 rounded-[12px] bg-white border border-[#E8DFC9] shadow-sm text-center max-w-sm w-full space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EAF7E4] text-[#2A7C13] mx-auto">
          <Loader2 className="w-6 h-6 animate-spin text-[#2A7C13]" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[#142010]">{message}</h4>
          <p className="text-xs text-[#525E4B]">Connecting to school database...</p>
        </div>
      </div>
    </div>
  );
}

export default LoadingSpinner;
