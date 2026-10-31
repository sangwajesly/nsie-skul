"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home, Lock, UserCheck } from "lucide-react";

export interface PermissionDeniedProps {
  title?: string;
  message?: string;
  requiredRole?: string;
  currentRole?: string;
  resourceName?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}

/**
 * 7. PERMISSION DENIED (403 ACCESS RESTRICTED)
 * Role-aware boundary component that explains what role is needed
 * and guides the user back to their authorized areas.
 */
export function PermissionDeniedState({
  title = "Access Restricted",
  message = "Your account does not have sufficient institutional permissions to view or edit this resource.",
  requiredRole,
  currentRole,
  resourceName,
  actionHref = "/dashboard",
  actionLabel = "Return to Dashboard",
  className = "",
}: PermissionDeniedProps) {
  return (
    <div
      className={`p-6 sm:p-8 rounded-[12px] bg-white border border-[#E8DFC9] shadow-2xs max-w-lg mx-auto text-center space-y-4 ${className}`}
      role="alert"
    >
      {/* Icon Badge */}
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 mx-auto">
        <ShieldAlert className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-extrabold text-[#142010] tracking-tight">{title}</h3>
        {resourceName && (
          <span className="inline-block px-2.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E8DFC9] text-xs font-mono text-[#525E4B]">
            {resourceName}
          </span>
        )}
        <p className="text-xs sm:text-sm text-[#525E4B] leading-relaxed max-w-sm mx-auto">{message}</p>
      </div>

      {/* Role Comparison Table if provided */}
      {(requiredRole || currentRole) && (
        <div className="p-3 rounded-[8px] bg-[#FAF8F5] border border-[#E8DFC9] text-xs text-left space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#888888] font-medium flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-[#2A7C13]" /> Your Current Role:
            </span>
            <span className="font-bold text-[#142010] bg-white px-2 py-0.5 rounded border border-[#E8DFC9]">
              {currentRole || "Logged in User"}
            </span>
          </div>

          {requiredRole && (
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E8DFC9]/60">
              <span className="text-[#888888] font-medium flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600" /> Required Privilege:
              </span>
              <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {requiredRole}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Recovery Actions */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </Link>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-white border border-[#D5CBB2] text-[#444444] hover:bg-[#F7F3E8] text-xs font-semibold transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 text-[#525E4B]" />
          <span>Home Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

export default PermissionDeniedState;
