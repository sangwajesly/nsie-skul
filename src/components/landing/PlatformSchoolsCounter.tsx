import Link from "next/link";
import { School, Users, FileCheck2, WifiOff, CheckCircle2, ShieldCheck, ArrowRight, Building2 } from "lucide-react";
import { PlatformPublicStats } from "@/lib/public-stats";

interface PlatformSchoolsCounterProps {
  stats: PlatformPublicStats;
}

export function PlatformSchoolsCounter({ stats }: PlatformSchoolsCounterProps) {
  return (
    <section className="py-12 sm:py-16 border-b border-[#E8DFC9] bg-[#FFFDF5]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header Pill & Title */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#76C457]/40 bg-[#EAF7E4] text-[11px] font-bold uppercase tracking-wider text-[#2A7C13]">
            <Building2 className="w-3.5 h-3.5" />
            <span>Platform Adoption in Cameroon</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010] tracking-tight">
            Trusted by Registered Schools &amp; Colleges Across Cameroon
          </h2>

          <p className="text-[13px] sm:text-[14px] text-[#525E4B] leading-relaxed">
            From Government Bilingual High Schools (GBHS) to private secondary institutes, educational leaders rely on Nsei Sukul to automate marks, print MINESEC report cards, and eliminate Excel headaches.
          </p>
        </div>

        {/* 4 Impact Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Metric 1: Registered Schools */}
          <div className="p-5 sm:p-6 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs hover:border-[#2A7C13] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center font-bold">
                <School className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2A7C13] bg-[#EAF7E4] px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2A7C13] animate-pulse" />
                Active
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#142010] tracking-tight">
              {stats.schoolsCount}
              <span className="text-[#2A7C13]">+</span>
            </div>
            <p className="text-[13px] font-bold text-[#142010] mt-1">Registered Schools</p>
            <p className="text-[11px] text-[#788470] mt-0.5">Institutions running on the platform</p>
          </div>

          {/* Metric 2: Enrolled Students */}
          <div className="p-5 sm:p-6 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs hover:border-[#2A7C13] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#FFF8CF] text-[#4A3D00] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-[#788470] bg-[#FFFDF5] border border-[#E8DFC9] px-2 py-0.5 rounded-full">
                Enrolled
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#142010] tracking-tight">
              {stats.studentsCount}
              <span className="text-[#2A7C13]">+</span>
            </div>
            <p className="text-[13px] font-bold text-[#142010] mt-1">Students Managed</p>
            <p className="text-[11px] text-[#788470] mt-0.5">Matricules &amp; registers tracked</p>
          </div>

          {/* Metric 3: Sequence Marks Calculated */}
          <div className="p-5 sm:p-6 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs hover:border-[#2A7C13] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#FBE6C2] text-[#422C0A] flex items-center justify-center font-bold">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-[#2A7C13] bg-[#EAF7E4] px-2 py-0.5 rounded-full">
                MINESEC
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#142010] tracking-tight">
              {stats.marksCount}
              <span className="text-[#2A7C13]">+</span>
            </div>
            <p className="text-[13px] font-bold text-[#142010] mt-1">Sequence Marks</p>
            <p className="text-[11px] text-[#788470] mt-0.5">Calculated across 6 sequences</p>
          </div>

          {/* Metric 4: Offline LAN Reliability */}
          <div className="p-5 sm:p-6 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs hover:border-[#2A7C13] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#142010] text-[#76C457] flex items-center justify-center font-bold">
                <WifiOff className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-[#2A7C13] bg-[#EAF7E4] px-2 py-0.5 rounded-full">
                Campus LAN
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#142010] tracking-tight">
              100<span className="text-[#2A7C13]">%</span>
            </div>
            <p className="text-[13px] font-bold text-[#142010] mt-1">Zero-Data Offline Uptime</p>
            <p className="text-[11px] text-[#788470] mt-0.5">Works without MTN/Orange internet</p>
          </div>
        </div>

        {/* ── Active Registered Institutions list ── */}
        <div className="p-4 sm:p-5 rounded-[12px] bg-white border border-[#E8DFC9] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-9 h-9 rounded-full bg-[#EAF7E4] flex items-center justify-center shrink-0 text-[#2A7C13]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">
                Active Registered Institutions
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {stats.schoolNames.slice(0, 8).map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#FFFDF5] border border-[#E8DFC9] text-[12px] font-semibold text-[#142010]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2A7C13]" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto text-center md:text-right">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-[13px] font-semibold transition-colors w-full sm:w-auto"
            >
              <span>Register Your School</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
