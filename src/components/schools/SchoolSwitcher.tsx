"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import { Building2, Check, ChevronsUpDown, Loader2, ArrowRight } from "lucide-react";
import { setActiveSchoolAction } from "@/app/schools/actions";
import Link from "next/link";

export interface SchoolOption {
  membershipId: string;
  school: {
    id: string;
    name: string;
    code?: string | null;
    slug?: string | null;
    logo_url?: string | null;
  };
  role: {
    name: string;
    code: string;
  };
}

interface SchoolSwitcherProps {
  currentSchool: {
    id: string;
    name: string;
    code?: string | null;
    slug?: string | null;
    logo_url?: string | null;
  };
  currentRole?: {
    name: string;
    code: string;
  };
  availableSchools: SchoolOption[];
  variant?: "sidebar" | "mobile";
  onSwitch?: () => void;
}

export function SchoolSwitcher({
  currentSchool,
  currentRole,
  availableSchools,
  variant = "sidebar",
  onSwitch,
}: SchoolSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasMultipleSchools = availableSchools.length > 1;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Handle switching active school
  const handleSelectSchool = (schoolId: string) => {
    if (schoolId === currentSchool.id || isPending) {
      setIsOpen(false);
      return;
    }

    setSwitchingId(schoolId);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("schoolId", schoolId);
      formData.set("returnTo", "/dashboard");

      try {
        if (onSwitch) onSwitch();
        await setActiveSchoolAction(formData);
      } catch (err) {
        console.error("Failed to switch school:", err);
        setSwitchingId(null);
      }
    });
  };

  // Single school: render clean static header without dropdown
  if (!hasMultipleSchools) {
    return (
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="w-8 h-8 rounded-[6px] bg-[#142010] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
          {currentSchool.logo_url ? (
            <img
              src={currentSchool.logo_url}
              alt={currentSchool.name}
              className="w-full h-full object-contain p-0.5 bg-white"
            />
          ) : (
            currentSchool.name.charAt(0)
          )}
        </div>
        <div className="overflow-hidden">
          <div className="font-bold text-[13px] tracking-tight text-[#191919] truncate leading-tight">
            {currentSchool.name}
          </div>
          <div className="text-[10px] text-[#888888] font-semibold tracking-wide uppercase truncate">
            {currentRole?.name || "Management Systems"}
          </div>
        </div>
      </div>
    );
  }

  // Multiple schools: render interactive switcher
  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`w-full flex items-center justify-between gap-2 p-1.5 rounded-[7px] text-left transition-colors cursor-pointer border ${
          isOpen
            ? "bg-[#F5F5F0] border-[#D5D5CF]"
            : "hover:bg-[#F5F5F0] border-transparent"
        }`}
        title="Click to switch between your assigned schools"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          <div className="w-8 h-8 rounded-[6px] bg-[#142010] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs">
            {currentSchool.logo_url ? (
              <img
                src={currentSchool.logo_url}
                alt={currentSchool.name}
                className="w-full h-full object-contain p-0.5 bg-white"
              />
            ) : (
              currentSchool.name.charAt(0)
            )}
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="font-bold text-[13px] tracking-tight text-[#191919] truncate leading-tight">
              {currentSchool.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-[#2A7C13] font-bold tracking-wide uppercase truncate">
                {currentRole?.name || "Teacher"}
              </span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-[#EAF7E4] text-[#166534] font-semibold border border-[#BBF7D0]">
                {availableSchools.length} schools
              </span>
            </div>
          </div>
        </div>

        <div className="text-[#888888] shrink-0 pr-1">
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2A7C13]" />
          ) : (
            <ChevronsUpDown className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-72 rounded-[9px] bg-white border border-[#E8DFC9] shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="px-3 py-2 bg-[#FFFDF5] border-b border-[#E8DFC9]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">
              Switch School Campus
            </div>
            <div className="text-[10px] text-[#525E4B] mt-0.5">
              Select a school to switch marks and classes
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-[#F0EFEA] py-1">
            {availableSchools.map((item) => {
              const isCurrent = item.school.id === currentSchool.id;
              const isSwitchingThis = switchingId === item.school.id;

              return (
                <button
                  key={item.membershipId}
                  type="button"
                  onClick={() => handleSelectSchool(item.school.id)}
                  disabled={isPending}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-[#F0FDF4] text-[#142010]"
                      : "hover:bg-[#FAF8F5] text-[#333333]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                    <div className="w-7 h-7 rounded-[5px] bg-[#142010] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {item.school.logo_url ? (
                        <img
                          src={item.school.logo_url}
                          alt={item.school.name}
                          className="w-full h-full object-contain p-0.5 bg-white"
                        />
                      ) : (
                        item.school.name.charAt(0)
                      )}
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <div className="font-bold text-xs truncate leading-tight">
                        {item.school.name}
                      </div>
                      <div className="text-[10px] text-[#777777] truncate mt-0.5">
                        {item.role.name} {item.school.code ? `· ${item.school.code}` : ""}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSwitchingThis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2A7C13]" />
                    ) : isCurrent ? (
                      <Check className="w-4 h-4 text-[#166534]" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-2 border-t border-[#E8DFC9] bg-[#FAF8F5]">
            <Link
              href="/select-school"
              onClick={() => setIsOpen(false)}
              className="w-full py-1.5 px-2.5 rounded-[5px] text-[11px] font-semibold text-[#525E4B] hover:text-[#142010] hover:bg-white border border-transparent hover:border-[#D5CBB2] flex items-center justify-between transition-colors"
            >
              <span>View All Registered Schools</span>
              <ArrowRight className="w-3 h-3 text-[#777777]" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
