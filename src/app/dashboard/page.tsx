import Link from "next/link";
import { getTenantContext } from "@/lib/tenancy/context";
import {
  Users,
  BookOpen,
  Wallet,
  CheckCircle2,
  ArrowUpRight,
  ClipboardList,
  Palette,
  Building2,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default async function DashboardPage() {
  const tenantContext = await getTenantContext();

  const school = tenantContext?.school;
  const schoolName = school?.name || "Demo Academy Bamenda";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Editorial Overview Card */}
      <div className="bg-white border border-[#E5E5DF] rounded-[8px] p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#666666]">
              <span>MINESEC Secondary Subsystem</span>
              <span>·</span>
              <span>6-Sequence Evaluation Model</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#191919] tracking-tight">
              {schoolName}
            </h1>
            <p className="text-[13px] text-[#666666]">
              2026/2027 Academic Year · First Term is currently active.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/academics/marks"
              className="px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-[13px] transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Enter Marks</span>
            </Link>
            <Link
              href="/dashboard/academics/report-cards"
              className="px-4 py-2 rounded-[6px] bg-white hover:bg-[#FFF8CF]/40 text-[#142010] font-semibold text-[13px] border border-[#E8DFC9] transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Palette className="w-4 h-4 text-[#2A7C13]" />
              <span>Official Report Cards</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Enrolled Students
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#191919]">482</div>
          <div className="text-[11px] text-[#047857] font-medium">Form 1 through U6</div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Active Streams
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#191919]">14</div>
          <div className="text-[11px] text-[#666666]">Classes &amp; Streams</div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Sequence 1 Marks
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#191919]">76%</div>
          <div className="text-[11px] text-[#B45309] font-medium">Submitted by teachers</div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Fee Collections
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#191919]">14.2M</div>
          <div className="text-[11px] text-[#666666]">FCFA (Term 1 To Date)</div>
        </div>
      </div>

      {/* Modules Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module 1 */}
        <Link
          href="/dashboard/academics"
          className="p-5 rounded-[8px] bg-white border border-[#E5E5DF] hover:border-[#191919] transition-all space-y-2 group block"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-[14px] text-[#191919]">Sequence Mark Entry</span>
            <ArrowUpRight className="w-4 h-4 text-[#888888] group-hover:text-[#191919]" />
          </div>
          <p className="text-[12px] text-[#666666] leading-[1.5]">
            Class mark sheets with autosave. Evaluated out of 20 with customizable denominators for technical practicals.
          </p>
        </Link>

        {/* Module 2 */}
        <Link
          href="/dashboard/academics"
          className="p-5 rounded-[8px] bg-white border border-[#E5E5DF] hover:border-[#191919] transition-all space-y-2 group block"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-[14px] text-[#191919]">Departments &amp; HODs</span>
            <ArrowUpRight className="w-4 h-4 text-[#888888] group-hover:text-[#191919]" />
          </div>
          <p className="text-[12px] text-[#666666] leading-[1.5]">
            Appoint HODs with department-wide or subject-specific scope. Review mark sheets and approve results.
          </p>
        </Link>

        {/* Module 3 */}
        <Link
          href="/dashboard/students"
          className="p-5 rounded-[8px] bg-white border border-[#E5E5DF] hover:border-[#191919] transition-all space-y-2 group block"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-[14px] text-[#191919]">Student Directory</span>
            <ArrowUpRight className="w-4 h-4 text-[#888888] group-hover:text-[#191919]" />
          </div>
          <p className="text-[12px] text-[#666666] leading-[1.5]">
            Matricules, residence status (Day vs Boarding), and class enrolments. Fast single or CSV intake.
          </p>
        </Link>
      </div>
    </div>
  );
}
