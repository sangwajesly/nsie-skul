import Link from "next/link";
import { Users, BookOpen, Wallet, ClipboardList, CheckCircle2, GraduationCap } from "lucide-react";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { BRAND, DESIGN_TOKENS } from "@/lib/design-tokens";

// ─── Shared primitive classes ────────────────────────────────────────────────
const CONTAINER = "max-w-6xl mx-auto px-5 sm:px-8";

const BTN_PRIMARY =
  "inline-flex items-center justify-center px-5 py-2.5 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-[14px] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A7C13] focus-visible:ring-offset-2";

const BTN_SECONDARY =
  "inline-flex items-center justify-center px-5 py-2.5 rounded-[7px] bg-white hover:bg-[#FFF8CF]/30 text-[#142010] font-semibold text-[14px] border border-[#E8DFC9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A7C13] focus-visible:ring-offset-2";

// ─── Capability cards data ─────────────────────────────────────────────────────
const CAPABILITIES = [
  {
    icon: Users,
    title: "Student records",
    body: "Keep student profiles and class records organized.",
  },
  {
    icon: ClipboardList,
    title: "Marks and report cards",
    body: "Record assessments and prepare structured results.",
  },
  {
    icon: BookOpen,
    title: "Staff and classes",
    body: "Manage teachers, subjects and responsibilities.",
  },
  {
    icon: Wallet,
    title: "Fees and payments",
    body: "Track charges, payments, receipts and balances.",
  },
];

// ─── Workflow bullet points ────────────────────────────────────────────────────
const WORKFLOW_POINTS = [
  "Support relevant academic structures and assessment workflows.",
  "Give school administrators, teachers and department heads clear responsibilities.",
  "Keep records consistent with controlled access and traceable changes.",
  "Configure report-card presentation to match approved school requirements.",
];

// ═════════════════════════════════════════════════════════════════════════════
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] text-[#142010] antialiased">

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#FFFDF5]/90 backdrop-blur-sm border-b border-[#E8DFC9]">
        <div className={`${CONTAINER} h-14 flex items-center justify-between gap-6`}>
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-[6px] bg-[#2A7C13] text-white flex items-center justify-center shadow-xs" aria-hidden="true">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-[15px] tracking-tight text-[#142010]">
              {BRAND.name}
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-[#525E4B]" aria-label="Main navigation">
            <a href="#features" className="hover:text-[#142010] transition-colors">Features</a>
            <a href="#workflow" className="hover:text-[#142010] transition-colors">How it works</a>
            <Link href="/login" className="hover:text-[#142010] transition-colors">Sign in</Link>
          </nav>

          {/* Nav CTA */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline text-[13px] font-medium text-[#525E4B] hover:text-[#142010] transition-colors">
              Sign in
            </Link>
            <Link href="/register" className={BTN_PRIMARY + " text-[13px] py-2 px-4"}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="pt-16 sm:pt-24 pb-10 sm:pb-14 border-b border-[#E8DFC9] bg-gradient-to-b from-[#FFF8CF]/25 to-transparent">
          <div className={CONTAINER}>
            {/* Centered copy block */}
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-5">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FBE6C2] bg-[#FFF8CF]/60 text-[11px] font-bold uppercase tracking-widest text-[#2A7C13]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#76C457]" aria-hidden="true" />
                School Management, Simplified
              </div>

              {/* Headline */}
              <h1 className="text-[2.4rem] sm:text-[3rem] font-extrabold tracking-tight text-[#142010] leading-[1.1] max-w-xl">
                Run your school with less paperwork and more clarity.
              </h1>

              {/* Supporting text */}
              <p className="text-[15px] sm:text-[16px] text-[#525E4B] leading-[1.65] max-w-lg">
                Manage students, teachers, classes, assessments, report cards, attendance
                and school fees in one organized platform.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-1 w-full sm:w-auto justify-center">
                <Link href="/register" className={BTN_PRIMARY}>
                  Get started
                </Link>
                <a href="#features" className={BTN_SECONDARY}>
                  Explore features
                </a>
              </div>

              {/* Microcopy */}
              <p className="text-[12px] text-[#788470]">
                Built for the day-to-day realities of schools in Cameroon.
              </p>
            </div>

            {/* Product preview */}
            <div className="mt-12 sm:mt-16">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* ── Capabilities ──────────────────────────────────────────────────── */}
        <section id="features" className="py-16 sm:py-20 border-b border-[#E8DFC9] bg-white">
          <div className={CONTAINER}>
            {/* Section heading */}
            <div className="max-w-xl mb-10 sm:mb-12">
              <h2 className="text-[1.65rem] sm:text-[2rem] font-extrabold tracking-tight text-[#142010] leading-tight mb-3">
                Everything your school needs, in one place.
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[#525E4B] leading-[1.65]">
                Connect everyday school operations without juggling scattered records and spreadsheets.
              </p>
            </div>

            {/* 2×2 capability cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {CAPABILITIES.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex gap-4 p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] hover:border-[#76C457] transition-colors"
                >
                  <div
                    className="shrink-0 w-9 h-9 rounded-[8px] bg-[#EAF7E4] border border-[#76C457]/40 flex items-center justify-center text-[#2A7C13]"
                    aria-hidden="true"
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[14px] text-[#142010] mb-1">{title}</h3>
                    <p className="text-[13px] text-[#525E4B] leading-[1.6]">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Workflow ──────────────────────────────────────────────────────── */}
        <section id="workflow" className="py-16 sm:py-20 border-b border-[#E8DFC9] bg-[#FFFDF5]">
          <div className={CONTAINER}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              {/* Left: heading */}
              <div className="space-y-4">
                <h2 className="text-[1.65rem] sm:text-[2rem] font-extrabold tracking-tight text-[#142010] leading-tight">
                  Designed around how schools actually work.
                </h2>
                <p className="text-[14px] sm:text-[15px] text-[#525E4B] leading-[1.65]">
                  Your school should not have to force its academic processes into a
                  generic template.
                </p>

                {/* Workflow points */}
                <ul className="space-y-4 pt-2" role="list">
                  {WORKFLOW_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-[13px] sm:text-[14px] text-[#525E4B] leading-[1.6]">
                      <CheckCircle2
                        className="w-4.5 h-4.5 mt-0.5 shrink-0 text-[#2A7C13]"
                        aria-hidden="true"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: visual panel (roles overview) */}
              <div className="space-y-3">
                {[
                  {
                    role: "Head Teacher / Principal",
                    badge: "Full access",
                    badgeColor: "bg-[#2A7C13] text-white",
                    desc: "Set up the school, review term results, approve report cards, and manage staff access.",
                  },
                  {
                    role: "HOD — Head of Department",
                    badge: "Dept. scope",
                    badgeColor: "bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]",
                    desc: "Review and approve mark sheets within an assigned department before they are locked.",
                  },
                  {
                    role: "Class Teacher",
                    badge: "Class scope",
                    badgeColor: "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40",
                    desc: "Enter marks for assigned subjects and sequences. Leave remarks for individual students.",
                  },
                  {
                    role: "Bursary / Accounts",
                    badge: "Finance",
                    badgeColor: "bg-[#FBE6C2] text-[#422C0A] border border-[#E8DFC9]",
                    desc: "Record fee payments, issue receipts in FCFA, and track outstanding balances.",
                  },
                ].map(({ role, badge, badgeColor, desc }) => (
                  <div
                    key={role}
                    className="flex items-start gap-4 p-4 rounded-[12px] bg-white border border-[#E8DFC9] shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-[13px] text-[#142010]">{role}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] ${badgeColor}`}>
                          {badge}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#525E4B] leading-[1.55]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Closing CTA ───────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-24 bg-[#142010] text-white">
          <div className={CONTAINER}>
            <div className="max-w-xl mx-auto text-center space-y-6">
              <h2 className="text-[1.85rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-[1.12]">
                Less time organizing records.{" "}
                <span className="text-[#76C457]">More time running your school.</span>
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[#A6B8A0] leading-[1.65]">
                Bring your school&apos;s daily administration into a system designed to keep
                information organized and accessible to the right people.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 rounded-[7px] bg-[#76C457] hover:bg-[#68B349] text-[#0E1A09] font-bold text-[14px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#76C457] focus-visible:ring-offset-2 focus-visible:ring-offset-[#142010]"
                >
                  Get started
                </Link>
                <a
                  href={`mailto:${BRAND.supportEmail}`}
                  className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 rounded-[7px] bg-white/10 hover:bg-white/15 text-white font-semibold text-[14px] border border-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#142010]"
                >
                  Contact us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="py-8 bg-white border-t border-[#E8DFC9]">
        <div className={`${CONTAINER} flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#788470]`}>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#142010]">{BRAND.name}</span>
            <span aria-hidden="true">·</span>
            <span>Anglophone Secondary School Management</span>
          </div>
          <nav className="flex items-center gap-5" aria-label="Footer navigation">
            <Link href="/login" className="hover:text-[#142010] transition-colors">Portal login</Link>
            <Link href="/register" className="hover:text-[#142010] transition-colors">Get started</Link>
            <a href="#features" className="hover:text-[#142010] transition-colors">Features</a>
          </nav>
        </div>
      </footer>

    </div>
  );
}
