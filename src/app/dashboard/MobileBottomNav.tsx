"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardCheck, GraduationCap, CalendarCheck } from "lucide-react";

interface NavTab {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
}

const TABS: NavTab[] = [
  {
    label: "Home",
    href: "/dashboard",
    icon: Home,
    isActive: (pathname) => pathname === "/dashboard",
  },
  {
    label: "Marks",
    href: "/dashboard/academics/marks",
    icon: ClipboardCheck,
    isActive: (pathname) => pathname.startsWith("/dashboard/academics/marks"),
  },
  {
    label: "Students",
    href: "/dashboard/students",
    icon: GraduationCap,
    isActive: (pathname) => pathname.startsWith("/dashboard/students"),
  },
  {
    label: "Attendance",
    href: "/dashboard/attendance",
    icon: CalendarCheck,
    isActive: (pathname) => pathname.startsWith("/dashboard/attendance"),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // If user is printing (report cards or sheets), do not render
  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 border-t border-[#E5E5DF] shadow-[0_-2px_10px_rgba(0,0,0,0.04)] print:hidden safe-area-inset-bottom"
    >
      <div className="grid grid-cols-4 h-14 max-w-lg mx-auto px-1">
        {TABS.map((tab) => {
          const active = tab.isActive(pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all select-none relative py-1 ${
                active
                  ? "text-[#2A7C13]"
                  : "text-[#788470] hover:text-[#142010]"
              }`}
            >
              {/* Active subtle pill highlight behind icon */}
              <div
                className={`p-1 rounded-full transition-colors ${
                  active ? "bg-[#EAF7E4] text-[#1F5C0E]" : "bg-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] tracking-tight leading-none ${
                  active ? "font-bold text-[#1F5C0E]" : "font-medium text-[#666666]"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
