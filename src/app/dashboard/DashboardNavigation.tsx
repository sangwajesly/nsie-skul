"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  ClipboardCheck,
  FileText,
  Wallet,
  CalendarCheck,
  Calendar,
  Settings,
  History,
  ShieldCheck,
  Layers,
} from "lucide-react";

function NavSection({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#999999]">
      {label}
    </div>
  );
}

function isRouteActive(pathname: string, currentHash: string, href: string): boolean {
  const [cleanHref, hashPart] = href.split("#");
  const targetHash = hashPart ? `#${hashPart}` : "";

  // 1. Home / Overview: strictly matches /dashboard only
  if (cleanHref === "/dashboard") {
    return pathname === "/dashboard";
  }

  // 2. Academics parent: strictly matches /dashboard/academics
  // (marks and report-cards have dedicated sidebar entries)
  if (cleanHref === "/dashboard/academics") {
    return pathname === "/dashboard/academics";
  }

  // 3. Activity Log (Audit): exact or sub-paths
  if (cleanHref === "/dashboard/settings/audit-logs") {
    return (
      pathname === "/dashboard/settings/audit-logs" ||
      pathname.startsWith("/dashboard/settings/audit-logs/")
    );
  }

  // 4. Settings tab with hash targets (#staff vs #school-settings)
  if (cleanHref === "/dashboard/settings") {
    if (pathname !== "/dashboard/settings") {
      return false;
    }
    if (targetHash === "#staff") {
      return currentHash === "#staff";
    }
    if (targetHash === "#license") {
      return currentHash === "#license";
    }
    if (targetHash === "#school-settings") {
      return currentHash === "#school-settings" || !currentHash;
    }
    return !currentHash;
  }

  // 5. Default exact or nested sub-path matching
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

function NavLink({
  href,
  icon: Icon,
  label,
  sublabel,
  currentHash,
  onNavClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  currentHash: string;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = isRouteActive(pathname, currentHash, href);

  return (
    <Link
      href={href}
      onClick={onNavClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-[7px] transition-all group relative ${
        isActive
          ? "bg-[#142010] text-white shadow-xs font-semibold"
          : "text-[#4B5563] hover:bg-[#F4F4F0] hover:text-[#191919]"
      }`}
    >
      <Icon
        className={`w-4 h-4 flex-shrink-0 transition-colors ${
          isActive ? "text-[#4ADE80]" : "text-[#777777] group-hover:text-[#191919]"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div
          className={`text-[12.5px] leading-tight truncate ${
            isActive ? "font-bold text-white" : "font-medium text-[#333333] group-hover:text-[#191919]"
          }`}
        >
          {label}
        </div>
        {sublabel && (
          <div
            className={`text-[10px] leading-tight truncate mt-0.5 ${
              isActive ? "text-[#9CA3AF]" : "text-[#888888] group-hover:text-[#666666]"
            }`}
          >
            {sublabel}
          </div>
        )}
      </div>

      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shrink-0" aria-hidden="true" />
      )}
    </Link>
  );
}

export default function DashboardNavigation({
  className,
  roleCode,
  isClassMaster = false,
  isHod = false,
  onNavClick,
}: {
  className: string;
  roleCode?: string;
  isClassMaster?: boolean;
  isHod?: boolean;
  onNavClick?: () => void;
}) {
  const isTeacher = roleCode === "teacher" || roleCode === "class_master";
  const isBursar = roleCode === "bursar";
  const canAccessHod = isHod || roleCode === "hod";
  const canAccessClassMaster = isClassMaster || roleCode === "class_master";
  const isAdmin =
    !roleCode ||
    roleCode === "school_admin" ||
    roleCode === "principal" ||
    roleCode === "superadmin";

  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash);
      const handleHashChange = () => setCurrentHash(window.location.hash);
      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, []);

  return (
    <nav className={className}>
      <NavSection label="Overview" />
      <NavLink
        href="/dashboard"
        icon={LayoutDashboard}
        label="Home"
        sublabel={isTeacher ? "Your teaching overview & classes" : "School overview and next steps"}
        currentHash={currentHash}
        onNavClick={onNavClick}
      />

      {/* Teaching & Learning */}
      <NavSection label="Teaching & Learning" />
      {(isAdmin || canAccessHod) && (
        <NavLink
          href="/dashboard/academics"
          icon={BookOpen}
          label="Classes & Subjects"
          sublabel="Set up classes, subjects and departments"
          currentHash={currentHash}
          onNavClick={onNavClick}
        />
      )}
      <NavLink
        href="/dashboard/academics/marks"
        icon={ClipboardCheck}
        label="Marks & Grades"
        sublabel={isTeacher ? "Enter & import sequence test marks" : "Enter student test marks"}
        currentHash={currentHash}
        onNavClick={onNavClick}
      />
      {(isAdmin || canAccessClassMaster) && (
        <NavLink
          href="/dashboard/academics/report-cards"
          icon={FileText}
          label="Report Cards"
          sublabel={canAccessClassMaster ? "Review results for your class" : "View and print student results"}
          currentHash={currentHash}
          onNavClick={onNavClick}
        />
      )}
      <NavLink
        href="/dashboard/academics/timetable"
        icon={Calendar}
        label="Timetable"
        sublabel={isTeacher ? "Your weekly class schedules" : "Master bell schedules & class timetables"}
        currentHash={currentHash}
        onNavClick={onNavClick}
      />

      {/* Daily Work */}
      <NavSection label="Daily Work" />
      <NavLink
        href="/dashboard/attendance"
        icon={CalendarCheck}
        label="Attendance & Conduct"
        sublabel={isTeacher ? "Mark roll call for your classes" : "Mark attendance and record conduct"}
        currentHash={currentHash}
        onNavClick={onNavClick}
      />

      {/* Students */}
      <NavSection label="People" />
      <NavLink
        href="/dashboard/students"
        icon={Users}
        label={isAdmin ? "Students & Admissions" : "Students"}
        sublabel={
          isAdmin
            ? "Admit students and view the register"
            : canAccessHod
            ? "View students in your department's classes"
            : isTeacher
            ? "View students in your classes"
            : "View class registers and student lists"
        }
        currentHash={currentHash}
        onNavClick={onNavClick}
      />
      {isAdmin && (
        <NavLink
          href="/dashboard/settings#staff"
          icon={UserCog}
          label="Teachers & Staff"
          sublabel="Manage staff and access"
          currentHash={currentHash}
          onNavClick={onNavClick}
        />
      )}

      {/* Fees (Admins & Bursars) */}
      {(isAdmin || isBursar) && (
        <>
          <NavSection label="Fees" />
          <NavLink
            href="/dashboard/finance"
            icon={Wallet}
            label="Fees, Payments & Receipts"
            sublabel="Set fees and record payments"
            currentHash={currentHash}
            onNavClick={onNavClick}
          />
        </>
      )}

      {/* Administration (Admins only) */}
      {isAdmin && (
        <>
          <NavSection label="Administration" />
          <NavLink
            href="/dashboard/settings#license"
            icon={ShieldCheck}
            label="License & Billing"
            sublabel="MTN MoMo payments & subscription"
            currentHash={currentHash}
            onNavClick={onNavClick}
          />
          <NavLink
            href="/dashboard/settings#school-settings"
            icon={Settings}
            label="School Settings"
            sublabel="School details and report settings"
            currentHash={currentHash}
            onNavClick={onNavClick}
          />
          <NavLink
            href="/dashboard/settings/audit-logs"
            icon={History}
            label="Activity Log"
            sublabel="See who changed school records"
            currentHash={currentHash}
            onNavClick={onNavClick}
          />
          <NavLink
            href="/dashboard/settings/states"
            icon={Layers}
            label="System States"
            sublabel="Empty, offline, loading & validation"
            currentHash={currentHash}
            onNavClick={onNavClick}
          />
        </>
      )}
    </nav>
  );
}
