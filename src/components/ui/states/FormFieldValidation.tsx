"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

export interface FormFieldProps {
  label: string;
  id?: string;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  tooltip?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * 9. FORM VALIDATION FIELD WRAPPER
 * Flags mistakes right where it happens — directly below the affected input
 * with accessible ARIA attributes and crisp visual cues.
 */
export function FormField({
  label,
  id,
  required = false,
  error,
  helperText,
  tooltip,
  children,
  className = "",
}: FormFieldProps) {
  const hasError = Boolean(error);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and auxiliary badges */}
      <div className="flex items-center justify-between text-xs">
        <label
          htmlFor={id}
          className={`font-bold transition-colors ${
            hasError ? "text-red-700" : "text-[#142010]"
          }`}
        >
          {label}
          {required ? (
            <span className="text-red-600 ml-1" title="Required field">
              *
            </span>
          ) : (
            <span className="text-[10px] font-normal text-[#888888] ml-1.5">
              (optional)
            </span>
          )}
        </label>

        {tooltip && (
          <span
            className="text-[#888888] hover:text-[#525E4B] cursor-help flex items-center gap-1 text-[11px]"
            title={tooltip}
          >
            <HelpCircle className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Input slot */}
      <div className="relative">{children}</div>

      {/* Inline Error Message — flags mistake right where it happens */}
      {hasError ? (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-1.5 text-xs text-red-600 font-semibold animate-in fade-in slide-in-from-top-0.5 duration-150 pt-0.5"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p className="text-[11px] text-[#777777] leading-tight pt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
  isValid?: boolean;
}

export const ValidatedInput = React.forwardRef<
  HTMLInputElement,
  ValidatedInputProps
>(({ error, isValid, className = "", ...props }, ref) => {
  const hasError = Boolean(error);

  return (
    <div className="relative">
      <input
        ref={ref}
        aria-invalid={hasError ? "true" : "false"}
        className={`w-full px-3 py-2 rounded-[6px] border text-xs text-[#142010] placeholder:text-[#999999] transition-all focus:outline-none ${
          hasError
            ? "border-red-500 bg-red-50/30 focus:border-red-600 focus:ring-2 focus:ring-red-100"
            : isValid
            ? "border-[#2A7C13] bg-[#F0FDF4]/40 focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/15"
            : "border-[#D5CBB2] bg-white focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/15"
        } ${className}`}
        {...props}
      />
      {hasError && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-red-500">
          <AlertCircle className="w-4 h-4" />
        </div>
      )}
      {isValid && !hasError && (
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#2A7C13]">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}
    </div>
  );
});
ValidatedInput.displayName = "ValidatedInput";

/**
 * Standard Cameroon School Domain Validators
 */
export const CameroonValidators = {
  /**
   * Validates Cameroon 9-digit phone number (MTN, Orange, Camtel)
   */
  phone(val: string): string | null {
    if (!val) return null;
    const clean = val.replace(/[\s\-\(\)\+]/g, "");
    const cmRegex = /^(?:237)?([62]\d{8})$/;
    if (!cmRegex.test(clean)) {
      return "Please enter a valid 9-digit Cameroon phone number (e.g. 677 123 456 or 699 123 456).";
    }
    return null;
  },

  /**
   * Validates student evaluation score against max marks (default 20.00)
   */
  score(val: string | number, maxMarks = 20): string | null {
    if (val === "" || val === null || val === undefined) return null;
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
    if (isNaN(num)) {
      return "Score must be a valid number.";
    }
    if (num < 0) {
      return "Score cannot be negative.";
    }
    if (num > maxMarks) {
      return `Score cannot exceed the maximum denominator of ${maxMarks.toFixed(2)}.`;
    }
    return null;
  },

  /**
   * Validates Cameroon academic coefficient (0.5 to 10)
   */
  coefficient(val: string | number): string | null {
    if (val === "" || val === null || val === undefined) return "Coefficient is required.";
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(",", "."));
    if (isNaN(num) || num <= 0) {
      return "Coefficient must be greater than 0.";
    }
    if (num > 10) {
      return "Coefficient is unusually high (typically between 1.0 and 6.0).";
    }
    return null;
  },

  /**
   * Validates required non-empty string
   */
  required(val: string, fieldName = "This field"): string | null {
    if (!val || !val.trim()) {
      return `${fieldName} is required.`;
    }
    return null;
  },

  /**
   * Validates standard student matricule format
   */
  matricule(val: string): string | null {
    if (!val) return null;
    if (val.trim().length < 3) {
      return "Matricule must be at least 3 characters.";
    }
    return null;
  },
};

export default FormField;
