"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileSpreadsheet,
  Wallet,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Printer,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";

interface RoleTab {
  id: "teacher" | "class_master" | "bursar" | "principal";
  title: string;
  badge: string;
  icon: typeof BookOpen;
  headline: string;
  description: string;
  painPoint: string;
  solution: string;
  screenshot: string;
  screenshotAlt: string;
  benefits: string[];
  ctaText: string;
  ctaUrl: string;
}

const ROLES: RoleTab[] = [
  {
    id: "teacher",
    title: "Teacher",
    badge: "Classroom & Sequence Marks",
    icon: BookOpen,
    headline: "Enter marks on your phone in minutes. No heavy paperwork.",
    description:
      "Teachers are the heart of every school. Instead of carrying piles of mark sheets home or copying numbers into multiple logbooks, open your phone and record sequence scores with zero stress.",
    painPoint:
      "Tired of calculating averages by hand, copying marks into three different books, and rushing before inspection deadlines.",
    solution:
      "Fast numeric keypad input, automated 20-point validation, and helpful competency appreciations so you never have to type 'Can do better' 80 times.",
    screenshot: "/screenshots/desktop-marks.png",
    screenshotAlt: "Nsei Sukul rapid sequence marks entry interface for teachers",
    benefits: [
      "Fast keypad score entry for 70+ students in under 3 minutes",
      "Works on phone or computer browser with zero app installation",
      "Works 100% offline over school Wi-Fi when internet is cut",
      "Automatic conversion for 20-point scale and sequence weighting",
    ],
    ctaText: "Explore Teacher Tools",
    ctaUrl: "/features/report-cards",
  },
  {
    id: "class_master",
    title: "Class Master",
    badge: "Stream Council & Deliberations",
    icon: FileSpreadsheet,
    headline: "Class deliberations and report cards without spreadsheet headaches.",
    description:
      "As a Class Master, end-of-term shouldn't mean staying up until midnight fixing broken Excel formulas. The system compiles your entire stream automatically.",
    painPoint:
      "Midnight spreadsheet marathons, broken cell formulas, disputed class averages, and report cards that print across two pages.",
    solution:
      "Instant class ranking, automatic subject coefficients, and official MINESEC report cards guaranteed to print on a single crisp A4 page.",
    screenshot: "/screenshots/desktop-reportcard.png",
    screenshotAlt: "Official Cameroon MINESEC report card preview in Nsei Sukul",
    benefits: [
      "Instant Class Council deliberation sheets with pass/fail rollups",
      "Automatic rank calculation and term general average",
      "Single-page A4 printable report cards with school crest and stamp",
      "One-click batch printing for the entire class stream",
    ],
    ctaText: "See Report Card Formats",
    ctaUrl: "/features/report-cards",
  },
  {
    id: "bursar",
    title: "Bursar (Finance)",
    badge: "Bursary & Accounts in FCFA",
    icon: Wallet,
    headline: "Zero financial leaks. Every single franc accounted for.",
    description:
      "Manage school fee installments, issue official printed receipts, and verify student exam clearance in seconds, fully audited in CFA Francs.",
    painPoint:
      "Lost paper receipt stubs, endless disputes with parents over paid installments, and chaotic debtor queues before exams.",
    solution:
      "Instant searchable student fee ledger, numbered anti-tamper receipt vouchers, and real-time debtor lists categorized by class stream.",
    screenshot: "/screenshots/desktop-overview.png",
    screenshotAlt: "School bursary fee tracking and financial rollup in Nsei Sukul",
    benefits: [
      "Issue official printed receipt slips with unique voucher numbers",
      "Instant debtor lists before sequence exams in one click",
      "Track installments: Registration, PTA levies, and Tuition",
      "Audit logs protect the Bursar from cash discrepancies",
    ],
    ctaText: "Explore Fee Management",
    ctaUrl: "/features/finance",
  },
  {
    id: "principal",
    title: "Principal & Proprietor",
    badge: "Executive Leadership",
    icon: GraduationCap,
    headline: "Total institutional visibility from your office or home.",
    description:
      "Leading a secondary school requires clarity. Check teacher mark submissions, monitor attendance, and review fee collections from your desk or phone.",
    painPoint:
      "Chasing 40 teachers for overdue mark sheets, relying on verbal reports, and discovering fee shortages weeks after term end.",
    solution:
      "A live executive dashboard showing real-time enrollment, teacher submission progress, term discipline rollups, and financial summaries.",
    screenshot: "/screenshots/desktop-overview.png",
    screenshotAlt: "Executive school management dashboard overview in Nsei Sukul",
    benefits: [
      "See which teachers have submitted sequence marks and who is pending",
      "School-wide enrollment and attendance statistics at a glance",
      "Permanent multi-year student dossiers and archive records",
      "Bilingual ready for Anglophone, Francophone, and bilingual colleges",
    ],
    ctaText: "Register Your School",
    ctaUrl: "/register",
  },
];

export function RoleShowcase() {
  const [activeId, setActiveId] = useState<RoleTab["id"]>("teacher");
  const activeRole = ROLES.find((r) => r.id === activeId) || ROLES[0];
  const Icon = activeRole.icon;

  return (
    <section className="py-16 sm:py-24 border-b border-[#E8DFC9] bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FBE6C2] bg-[#FFF8CF]/70 text-[11px] font-bold uppercase tracking-widest text-[#2A7C13]">
            <Sparkles className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>Human-Centered Design</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#142010] tracking-tight leading-tight">
            A simple, dedicated workspace for every person on your staff.
          </h2>

          <p className="text-[14px] sm:text-[16px] text-[#525E4B] leading-relaxed">
            No complicated technical menus or confusing jargon. Each role sees exactly what they need to do their job with speed and peace of mind.
          </p>
        </div>

        {/* Role Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
          {ROLES.map((role) => {
            const TabIcon = role.icon;
            const isSelected = role.id === activeId;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setActiveId(role.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] sm:text-[14px] font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#2A7C13] text-white shadow-xs"
                    : "bg-[#FFFDF5] text-[#525E4B] hover:text-[#142010] border border-[#E8DFC9] hover:bg-[#FFF8CF]/40"
                }`}
              >
                <TabIcon className="w-4 h-4 shrink-0" />
                <span>{role.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Role Content Card */}
        <div className="rounded-[14px] border border-[#E8DFC9] bg-[#FFFDF5] shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 items-center">
            {/* Left 7 cols: Role Story, Problem & Solution */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#EAF7E4] border border-[#76C457]/40 text-[#2A7C13] text-[11px] font-bold uppercase tracking-wider">
                <Icon className="w-3.5 h-3.5" />
                <span>Workspace: {activeRole.title}</span>
                <span className="text-[#525E4B] font-normal">({activeRole.badge})</span>
              </div>

              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#142010] tracking-tight leading-snug">
                {activeRole.headline}
              </h3>

              <p className="text-[13.5px] sm:text-[15px] text-[#525E4B] leading-relaxed">
                {activeRole.description}
              </p>

              {/* Before vs After Callout Box */}
              <div className="space-y-2.5 pt-1">
                <div className="p-3 rounded-[8px] bg-red-50/70 border border-red-200/80 text-[12px] text-red-950 flex items-start gap-2.5">
                  <span className="font-bold text-red-700 shrink-0">The Old Way:</span>
                  <p className="leading-relaxed">{activeRole.painPoint}</p>
                </div>
                <div className="p-3 rounded-[8px] bg-[#EAF7E4]/70 border border-[#76C457]/50 text-[12px] text-[#142010] flex items-start gap-2.5">
                  <span className="font-bold text-[#2A7C13] shrink-0">With Nsei Sukul:</span>
                  <p className="leading-relaxed">{activeRole.solution}</p>
                </div>
              </div>

              {/* Bullet Points */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#142010]">
                  Key Daily Capabilities:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12.5px] text-[#333333]">
                  {activeRole.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-3">
                <Link
                  href={activeRole.ctaUrl}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-[13.5px] transition-colors shadow-xs"
                >
                  <span>{activeRole.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right 5 cols: Visual Screenshot Preview */}
            <div className="lg:col-span-5">
              <div className="rounded-[10px] border border-[#E8DFC9] bg-white p-2.5 shadow-sm space-y-2">
                <div className="flex items-center justify-between px-2 py-1 text-[11px] text-[#788470] border-b border-[#F0EBE0]">
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#76C457]" />
                    {activeRole.title} Dashboard Screen
                  </span>
                  <span className="text-[10px] bg-[#FFF8CF] px-2 py-0.5 rounded text-[#4A3D00] font-bold">
                    Live Interface
                  </span>
                </div>
                <div className="overflow-hidden rounded-[7px] border border-[#E8DFC9] bg-[#FAFAF8] aspect-[4/3] relative">
                  <img
                    src={activeRole.screenshot}
                    alt={activeRole.screenshotAlt}
                    width={800}
                    height={600}
                    className="w-full h-full object-cover object-top transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
