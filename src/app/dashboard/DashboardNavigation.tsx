"use client";
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
  Settings,
  History,
} from "lucide-react";

function NavSection({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#AAAAAA]">
      {label}
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  sublabel,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  sublabel?: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const base = "flex items-center gap-2.5 px-3 py-2 rounded-[6px] transition-colors group";
  const active = "bg-[#F5F5F0] text-[#191919]";
  const def = "text-[#444444] hover:bg-[#F5F5F0] hover:text-[#191919]";
  return (
    <Link href={href} className={`${base} ${isActive ? active : def}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#2A7C13]" : "text-[#888888]"}`} />
      <div className="min-w-0">
        <div className="text-[13px] font-medium leading-tight truncate">{label}</div>
        {sublabel && (
          <div className="text-[10px] text-[#AAAAAA] leading-tight truncate">{sublabel}</div>
        )}
      </div>
    </Link>
  );
}

export default function DashboardNavigation({
  className,
  roleCode,
  isClassMaster = false,
  isHod = false,
}: {
  className: string;
  roleCode?: string;
  isClassMaster?: boolean;
  isHod?: boolean;
}) {
  const isTeacher = roleCode === "teacher" || roleCode === "class_master";
  const isBursar = roleCode === "bursar";
  const canAccessHod = isHod || roleCode === "hod";
  const canAccessClassMaster = isClassMaster || roleCode === "class_master";
  const isAdmin = !roleCode || roleCode === "school_admin" || roleCode === "principal" || roleCode === "superadmin";

  return (
    <nav className={className}>
      <NavSection label="Overview" />
      <NavLink href="/dashboard" icon={LayoutDashboard} label="Home" sublabel={isTeacher ? "Your teaching overview & classes" : "School overview and next steps"} />

      {/* Teaching & Learning */}
      <NavSection label="Teaching & Learning" />
      {(isAdmin || canAccessHod) && (
        <NavLink href="/dashboard/academics" icon={BookOpen} label="Classes & Subjects" sublabel="Set up classes, subjects and departments" />
      )}
      <NavLink href="/dashboard/academics/marks" icon={ClipboardCheck} label="Marks & Grades" sublabel={isTeacher ? "Enter & import sequence test marks" : "Enter student test marks"} />
      {(isAdmin || canAccessClassMaster) && (
        <NavLink
          href="/dashboard/academics/report-cards"
          icon={FileText}
          label="Report Cards"
          sublabel={canAccessClassMaster ? "Review results for your class" : "View and print student results"}
        />
      )}

      {/* Daily Work */}
      <NavSection label="Daily Work" />
      <NavLink href="/dashboard/attendance" icon={CalendarCheck} label="Attendance & Conduct" sublabel={isTeacher ? "Mark roll call for your classes" : "Mark attendance and record conduct"} />

      {/* Students */}
      <NavSection label="People" />
      <NavLink
        href="/dashboard/students"
        icon={Users}
        label={isTeacher ? "Student Register" : "Students & Admissions"}
        sublabel={isTeacher ? "View students in your classes" : "Admit students and view the register"}
      />
      {isAdmin && (
        <NavLink href="/dashboard/settings#staff" icon={UserCog} label="Teachers & Staff" sublabel="Manage staff and access" />
      )}

      {/* Fees (Admins & Bursars) */}
      {(isAdmin || isBursar) && (
        <>
          <NavSection label="Fees" />
          <NavLink href="/dashboard/finance" icon={Wallet} label="Fees, Payments & Receipts" sublabel="Set fees and record payments" />
        </>
      )}

      {/* Administration (Admins only) */}
      {isAdmin && (
        <>
          <NavSection label="Administration" />
          <NavLink href="/dashboard/settings#school-settings" icon={Settings} label="School Settings" sublabel="School details and report settings" />
          <NavLink href="/dashboard/settings/audit-logs" icon={History} label="Activity Log" sublabel="See who changed school records" />
        </>
      )}
    </nav>
  );
}
