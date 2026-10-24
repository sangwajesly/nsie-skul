"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  History,
  LayoutDashboard,
  Settings,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

const icons = {
  dashboard: LayoutDashboard,
  students: Users,
  staff: UserCog,
  academics: BookOpen,
  marks: ClipboardCheck,
  reports: FileText,
  attendance: CalendarCheck,
  finance: Wallet,
  settings: Settings,
  activity: History,
};

type IconName = keyof typeof icons;

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function getHash() {
  return window.location.hash;
}

function getServerHash() {
  return "";
}

export default function DashboardNavLink({
  href,
  icon,
  label,
  sublabel,
  matchSubroutes = false,
}: {
  href: string;
  icon: IconName;
  label: string;
  sublabel?: string;
  matchSubroutes?: boolean;
}) {
  const pathname = usePathname();
  const hash = useSyncExternalStore(subscribeToHash, getHash, getServerHash);
  const [routePath, anchor] = href.split("#");
  const matchesPath =
    pathname === routePath ||
    (matchSubroutes && pathname.startsWith(`${routePath}/`));
  const isActive = matchesPath && (!anchor || hash === `#${anchor}`);
  const Icon = icons[icon];

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex items-center gap-2.5 rounded-[6px] px-3 py-2 transition-colors ${
        isActive
          ? "bg-[#2A7C13] text-white font-semibold shadow-[inset_3px_0_0_#142010]"
          : "text-[#444444] hover:bg-[#F5F5F0] hover:text-[#191919]"
      }`}
    >
      <Icon
        className={`h-4 w-4 flex-shrink-0 transition-colors ${
          isActive ? "text-white" : "text-[#888888] group-hover:text-[#2A7C13]"
        }`}
      />
      <div className="min-w-0">
        <div className="truncate text-[13px] leading-tight">{label}</div>
        {sublabel && (
          <div className={`truncate text-[10px] leading-tight ${isActive ? "text-white/80" : "text-[#AAAAAA]"}`}>
            {sublabel}
          </div>
        )}
      </div>
    </Link>
  );
}