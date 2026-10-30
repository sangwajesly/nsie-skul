"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import DashboardNavigation from "./DashboardNavigation";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { signOutAction } from "@/app/auth/actions";

interface Props {
  schoolName: string;
  logoUrl?: string | null;
  academicYearLabel: string;
  userFullName: string;
  userRole: string;
  roleCode?: string;
  isClassMaster?: boolean;
  isHod?: boolean;
}

export function MobileNavDrawer({
  schoolName,
  logoUrl,
  academicYearLabel,
  userFullName,
  userRole,
  roleCode,
  isClassMaster,
  isHod,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer whenever pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Hamburger Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 -ml-1 rounded-[6px] text-[#444444] hover:text-[#191919] hover:bg-[#F5F5F0] transition-colors focus:outline-none flex items-center justify-center min-w-[38px] min-h-[38px]"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Slide-out Backdrop & Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="relative flex flex-col w-[280px] max-w-[85vw] h-full bg-white shadow-2xl z-10 overflow-hidden">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#EBEBE6] bg-[#FAFAF8]">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-[5px] bg-[#142010] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={schoolName}
                      className="w-full h-full object-contain p-0.5 bg-white"
                    />
                  ) : (
                    schoolName.charAt(0)
                  )}
                </div>
                <div className="overflow-hidden">
                  <span className="font-bold text-xs text-[#191919] truncate block">
                    {schoolName}
                  </span>
                  <span className="text-[10px] text-[#888888] truncate block">
                    {academicYearLabel}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-[#777777] hover:text-[#191919] hover:bg-black/5 flex items-center justify-center min-w-[36px] min-h-[36px]"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation links */}
            <div className="flex-1 overflow-y-auto px-2 py-3">
              <DashboardNavigation
                className="space-y-0.5"
                roleCode={roleCode}
                isClassMaster={isClassMaster}
                isHod={isHod}
                onNavClick={() => setIsOpen(false)}
              />
            </div>

            {/* PWA Install Button inside Drawer */}
            <div className="px-3 pb-2 pt-2 border-t border-[#EBEBE6] bg-white">
              <PwaInstallButton variant="drawer" />
            </div>

            {/* User footer & sign out */}
            <div className="p-3 border-t border-[#EBEBE6] bg-[#FAFAF8]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-[#E5E5DF] text-[#333333] flex items-center justify-center font-bold text-[12px] shrink-0">
                    {userFullName.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[12px] font-semibold text-[#191919] truncate leading-tight">
                      {userFullName}
                    </div>
                    <div className="text-[10px] text-[#888888] truncate">
                      {isClassMaster && roleCode === "teacher"
                        ? `${userRole} & Class Master`
                        : userRole}
                    </div>
                  </div>
                </div>

                <form action={signOutAction}>
                  <button
                    type="submit"
                    title="Sign out"
                    className="p-1.5 text-[#888888] hover:text-[#C2410C] rounded-[4px] hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
