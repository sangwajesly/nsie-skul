import Link from "next/link";
import { 
  Users, 
  BookOpen, 
  Wallet, 
  ClipboardList, 
  CheckCircle2, 
  MessageCircle, 
  WifiOff, 
  Wifi, 
  Server, 
  Smartphone, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  FileSpreadsheet,
  Award,
  RefreshCw,
  GraduationCap,
  Sparkles
} from "lucide-react";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { MarketingHeader } from "@/components/landing/MarketingHeader";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { PlatformSchoolsCounter } from "@/components/landing/PlatformSchoolsCounter";
import { PlainEnglishCapabilities } from "@/components/landing/PlainEnglishCapabilities";
import { RoleShowcase } from "@/components/landing/RoleShowcase";
import { getPlatformPublicStats } from "@/lib/public-stats";
import { BRAND } from "@/lib/design-tokens";
import type { Metadata } from "next";
import { SoftwareApplicationJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  title: "Nsei Sukul | School Management System in Cameroon",
  description:
    "Manage your school's students, academic activities, CBA assessments, report cards and finances with Nsei Sukul, a comprehensive school management system designed for secondary schools in Cameroon.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Nsei Sukul | School Management System in Cameroon",
    description:
      "Manage students, academic activities, MINESEC 6-sequence assessments, CBA report cards, and bursary fees in CFA Francs.",
    url: "/",
    type: "website",
  },
};

// ─── Shared primitive classes ────────────────────────────────────────────────
const CONTAINER = "max-w-6xl mx-auto px-5 sm:px-8";

const BTN_PRIMARY =
  "inline-flex items-center justify-center px-5 py-2.5 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-[14px] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A7C13] focus-visible:ring-offset-2";

const BTN_SECONDARY =
  "inline-flex items-center justify-center px-5 py-2.5 rounded-[7px] bg-white hover:bg-[#FFF8CF]/30 text-[#142010] font-semibold text-[14px] border border-[#E8DFC9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A7C13] focus-visible:ring-offset-2";

// ─── Workflow bullet points ────────────────────────────────────────────────────
const WORKFLOW_POINTS = [
  "Support relevant Cameroonian academic structures, sequences and assessment workflows.",
  "Give school administrators, teachers and department heads clear, least-privilege responsibilities.",
  "Keep records consistent with controlled access, audit trails and traceable mark edits.",
  "Configure report-card presentation to match Cameroon secondary education specifications.",
];

export default async function LandingPage() {
  const stats = await getPlatformPublicStats();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] text-[#142010] antialiased">
      {/* ── Main Navigation ──────────────────────────────────────────────────── */}
      <MarketingHeader currentPath="/" />
      <SoftwareApplicationJsonLd />

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="pt-14 sm:pt-20 pb-12 sm:pb-16 border-b border-[#E8DFC9] bg-[#FFFDF5]">
          <div className={CONTAINER}>
            {/* Centered copy block */}
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-5">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FBE6C2] bg-[#FFF8CF]/70 text-[11px] font-bold uppercase tracking-widest text-[#2A7C13]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#76C457]" aria-hidden="true" />
                Secondary Schools, Colleges &amp; Institutes
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#142010] leading-[1.12]">
                Run your school with zero paperwork, zero internet stress, and total clarity.
              </h1>

              {/* Supporting text */}
              <p className="text-[15px] sm:text-[17px] text-[#525E4B] leading-[1.65] max-w-2xl">
                The all-in-one management platform custom-built for Cameroon schools. Manage admissions, teachers, class streams, sequence assessments, official MINESEC report cards, and fee bursary, <strong>with full offline campus LAN capability</strong>.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto justify-center">
                <Link href="/register" className={BTN_PRIMARY + " w-full sm:w-auto py-3 px-6 text-[15px]"}>
                  <span>Register Your School</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link
                  href="/demo"
                  className={BTN_SECONDARY + " w-full sm:w-auto gap-2 py-3 px-5 text-[14px] sm:text-[15px] bg-[#FFF8CF]/70 hover:bg-[#FFF8CF] border-[#FBE6C2] text-[#7A5B00]"}
                  title="1-Click Demo Campus - Test marks, report cards and classes instantly"
                >
                  <Sparkles className="w-4 h-4 text-[#B45309] shrink-0" />
                  <span>Explore Live Demo</span>
                </Link>
                <a
                  href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20I%20would%20like%20a%20demonstration%20for%20our%20school."
                  target="_blank"
                  rel="noopener noreferrer"
                  className={BTN_SECONDARY + " w-full sm:w-auto gap-2 py-3 px-5 text-[14px] sm:text-[15px]"}
                >
                  <MessageCircle className="w-4 h-4 text-[#2A7C13] shrink-0" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Microcopy */}
              <p className="text-[12px] text-[#788470]">
                Built for the day-to-day realities of schools across Cameroon: Northwest, Southwest, Littoral &amp; Centre.
              </p>
            </div>

            {/* Product preview */}
            <div className="mt-12 sm:mt-16">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* ── Cameroon Trust & Compliance Bar ─────────────────────────────────── */}
        <section className="py-6 border-b border-[#E8DFC9] bg-white">
          <div className={CONTAINER}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="flex flex-col items-center justify-center p-3 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9]/60">
                <WifiOff className="w-5 h-5 text-[#2A7C13] mb-1" />
                <span className="font-bold text-[12px] text-[#142010]">100% Offline Capable</span>
                <span className="text-[10px] text-[#788470]">Local Sukul Hub LAN</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9]/60">
                <FileSpreadsheet className="w-5 h-5 text-[#2A7C13] mb-1" />
                <span className="font-bold text-[12px] text-[#142010]">MINESEC Compliant</span>
                <span className="text-[10px] text-[#788470]">6 Sequences · 20-pt Scale</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9]/60">
                <ShieldCheck className="w-5 h-5 text-[#2A7C13] mb-1" />
                <span className="font-bold text-[12px] text-[#142010]">Law No. 2024/017</span>
                <span className="text-[10px] text-[#788470]">Cameroon Data Privacy</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9]/60">
                <Wallet className="w-5 h-5 text-[#2A7C13] mb-1" />
                <span className="font-bold text-[12px] text-[#142010]">FCFA Bursary Module</span>
                <span className="text-[10px] text-[#788470]">Receipts &amp; Debtor Lists</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Live Platform Impact & Number of Schools Counter ───────────────── */}
        <PlatformSchoolsCounter stats={stats} />

        {/* ── What a School Can Achieve in Plain English ───────────────────────── */}
        <PlainEnglishCapabilities />

        {/* ── Spotlight: The Offline Sukul Hub ────────────────────────────────── */}
        <section className="py-16 sm:py-24 border-b border-[#E8DFC9] bg-[#142010] text-white">
          <div className={CONTAINER}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#76C457] text-[12px] font-bold">
                  <WifiOff className="w-4 h-4" />
                  <span>Flagship Innovation for Cameroon</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  No Internet? No Problem. <br />
                  <span className="text-[#76C457]">The Sukul Hub works completely offline.</span>
                </h2>

                <p className="text-[14px] sm:text-[15px] text-[#A6B8A0] leading-relaxed">
                  Never let network cuts, slow internet, or expensive mobile data bundles stop your teachers from submitting student marks. With the Sukul Hub, your school works smoothly on its own local Wi-Fi without needing an internet connection.
                </p>

                <div className="space-y-3.5 pt-1">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#76C457] shrink-0 mt-0.5" />
                    <p className="text-[13px] text-[#E0E8DC]">
                      <strong>Local Wi-Fi Mark Sync:</strong> Teachers connect to school Wi-Fi and push marks in 2 seconds, even if the router has NO internet connection.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#76C457] shrink-0 mt-0.5" />
                    <p className="text-[13px] text-[#E0E8DC]">
                      <strong>Zero Data Cost for Staff:</strong> Teachers never spend their personal MTN or Orange airtime submitting sequences.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#76C457] shrink-0 mt-0.5" />
                    <p className="text-[13px] text-[#E0E8DC]">
                      <strong>Double Protection:</strong> The box automatically saves a secure cloud backup whenever an internet link is connected.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    href="/features/school-hub"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[7px] bg-[#76C457] hover:bg-[#68B349] text-[#0E1A09] font-bold text-[13px] transition-colors w-full sm:w-auto"
                  >
                    <span>Learn How Sukul Hub Works</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20please%20tell%20me%20more%20about%20the%20Sukul%20Hub."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[7px] bg-white/10 hover:bg-white/15 text-white font-medium text-[13px] border border-white/20 transition-colors w-full sm:w-auto"
                  >
                    <MessageCircle className="w-4 h-4 text-[#76C457] shrink-0" />
                    <span>Inquire About Sukul Hub</span>
                    <span className="hidden sm:inline">(+237 682 833 601)</span>
                  </a>
                </div>
              </div>

              {/* Visual Diagram */}
              <div className="rounded-[14px] bg-white/5 border border-white/15 p-6 sm:p-8 space-y-6">
                <div className="text-center pb-2 border-b border-white/10">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#76C457]">
                    Zero-Internet Process
                  </span>
                  <h3 className="font-bold text-[16px] text-white mt-1">Simple 3-Step Campus Workflow</h3>
                </div>

                {/* Node 1 */}
                <div className="flex items-center gap-4 p-3.5 rounded-[8px] bg-white/10 border border-white/10">
                  <div className="w-10 h-10 rounded-[6px] bg-[#2A7C13] flex items-center justify-center text-white shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[13px] text-white">1. Teacher Phone or Laptop</h4>
                    <p className="text-[11px] text-[#A6B8A0]">Marks entered at home or school, saved safely right on the phone.</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center -my-3">
                  <div className="w-0.5 h-6 bg-[#76C457]/50" />
                </div>

                {/* Node 2 */}
                <div className="flex items-center gap-4 p-3.5 rounded-[8px] bg-[#76C457]/20 border border-[#76C457]/40">
                  <div className="w-10 h-10 rounded-[6px] bg-[#76C457] flex items-center justify-center text-[#0E1A09] shrink-0 font-bold">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[13px] text-white">2. School Wi-Fi (No Internet Needed)</h4>
                    <p className="text-[11px] text-[#E0E8DC]">Pushes marks to the school box in 2 seconds without consuming mobile data.</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center -my-3">
                  <div className="w-0.5 h-6 bg-[#76C457]/50" />
                </div>

                {/* Node 3 */}
                <div className="flex items-center gap-4 p-3.5 rounded-[8px] bg-white/10 border border-white/10">
                  <div className="w-10 h-10 rounded-[6px] bg-[#2A7C13] flex items-center justify-center text-white shrink-0">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[13px] text-white">3. The Sukul Hub Box</h4>
                    <p className="text-[11px] text-[#A6B8A0]">Calculates class ranks, averages, and prints official report cards instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Dedicated Capabilities Showcase ───────────────────────────────── */}
        <section id="features" className="py-16 sm:py-24 border-b border-[#E8DFC9] bg-white">
          <div className={CONTAINER}>
            {/* Section heading */}
            <div className="max-w-2xl mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7E4] border border-[#76C457]/30 text-[#2A7C13] text-[11px] font-bold tracking-wider uppercase mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2A7C13]" />
                <span>Comprehensive Management</span>
              </div>
              <h2 className="text-[1.85rem] sm:text-[2.4rem] font-extrabold tracking-tight text-[#142010] leading-tight">
                Everything your school needs to operate with excellence.
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[#525E4B] leading-[1.65] mt-2">
                Designed from the ground up for Cameroonian schools, combining administrative rigor with effortless daily usability.
              </p>
            </div>

            {/* 3 Pillar Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pillar 1: Sukul Hub */}
              <div className="flex flex-col p-7 rounded-[14px] border border-[#E8DFC9] bg-[#FFFDF5] hover:border-[#2A7C13] hover:-translate-y-1 hover:shadow-md transition-all duration-200 group">
                <div className="w-11 h-11 rounded-[8px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center mb-5 group-hover:bg-[#2A7C13] group-hover:text-white transition-colors">
                  <WifiOff className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[18px] text-[#142010] mb-2">Offline Sukul Hub</h3>
                <p className="text-[13px] text-[#525E4B] leading-[1.6] mb-6 flex-1">
                  Keeps your school office computers, teachers, and printers working smoothly without interruption even when the internet is completely cut.
                </p>
                <div className="pt-4 border-t border-[#E8DFC9]">
                  <Link
                    href="/features/school-hub"
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#2A7C13] hover:text-[#20600E] group-hover:translate-x-1 transition-all"
                  >
                    <span>Explore Offline Sukul Hub</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Pillar 2: Report Cards */}
              <div className="flex flex-col p-7 rounded-[14px] border border-[#E8DFC9] bg-[#FFFDF5] hover:border-[#2A7C13] hover:-translate-y-1 hover:shadow-md transition-all duration-200 group">
                <div className="w-11 h-11 rounded-[8px] bg-[#FFF8CF] text-[#4A3D00] flex items-center justify-center mb-5 group-hover:bg-[#2A7C13] group-hover:text-white transition-colors">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[18px] text-[#142010] mb-2">MINESEC Report Cards</h3>
                <p className="text-[13px] text-[#525E4B] leading-[1.6] mb-6 flex-1">
                  6 Sequences, 3 Terms, weighted coefficients, auto-calculated class ranks, and 1-page A4 printouts with optional student photographs.
                </p>
                <div className="pt-4 border-t border-[#E8DFC9]">
                  <Link
                    href="/features/report-cards"
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#2A7C13] hover:text-[#20600E] group-hover:translate-x-1 transition-all"
                  >
                    <span>Explore Report Cards Engine</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Pillar 3: Bursary */}
              <div className="flex flex-col p-7 rounded-[14px] border border-[#E8DFC9] bg-[#FFFDF5] hover:border-[#2A7C13] hover:-translate-y-1 hover:shadow-md transition-all duration-200 group">
                <div className="w-11 h-11 rounded-[8px] bg-[#FBE6C2] text-[#422C0A] flex items-center justify-center mb-5 group-hover:bg-[#2A7C13] group-hover:text-white transition-colors">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[18px] text-[#142010] mb-2">Bursary & Fees (FCFA)</h3>
                <p className="text-[13px] text-[#525E4B] leading-[1.6] mb-6 flex-1">
                  Tuition installments, PTA dues, verifiable printable receipts, debtor rosters before sequence exams, and daily cash collection logs.
                </p>
                <div className="pt-4 border-t border-[#E8DFC9]">
                  <Link
                    href="/features/finance"
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#2A7C13] hover:text-[#20600E] group-hover:translate-x-1 transition-all"
                  >
                    <span>Explore Bursary Management</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Supplementary Institutional Capabilities Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Feature: 1-Click Annual Rollover */}
              <div className="flex items-start gap-4 p-5 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] hover:border-[#2A7C13] hover:-translate-y-0.5 hover:shadow-2xs transition-all duration-200">
                <div className="w-10 h-10 rounded-[8px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[15px] text-[#142010]">
                    1-Click Annual Academic Rollover &amp; Promotion
                  </h4>
                  <p className="text-[12.5px] text-[#525E4B] leading-[1.6] mt-1">
                    Set school promotion and trial thresholds, automatically promote passing students, flag repeaters, and roll over to the new academic year without re-admitting existing students.
                  </p>
                </div>
              </div>

              {/* Feature: Multi-Year Academic Transcripts */}
              <div className="flex items-start gap-4 p-5 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] hover:border-[#2A7C13] hover:-translate-y-0.5 hover:shadow-2xs transition-all duration-200">
                <div className="w-10 h-10 rounded-[8px] bg-[#FAF8F2] text-[#2A7C13] border border-[#E8DFC9] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[15px] text-[#142010]">
                    Official Multi-Year Academic Transcripts (Relevé de Notes)
                  </h4>
                  <p className="text-[12.5px] text-[#525E4B] leading-[1.6] mt-1">
                    Generate ministerial-compliant cumulative academic transcripts showing multi-year progression, subject coefficients, sequence marks, annual class ranks, and principal verification seals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Role Workflows & Interactive Showcase ──────────────────────── */}
        <div id="how-it-works">
          <RoleShowcase />
        </div>

        {/* ── Teacher Resources & Pedagogic Hub Section ────────────────────── */}
        <section className="py-16 sm:py-20 border-b border-[#E8DFC9] bg-[#FFFDF5]">
          <div className={CONTAINER}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7E4] border border-[#76C457]/30 text-[#2A7C13] text-[11px] font-bold tracking-wider uppercase mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2A7C13]" />
                  <span>Cameroon Pedagogic Hub</span>
                </div>
                <h2 className="text-[1.75rem] sm:text-[2.1rem] font-extrabold text-[#142010]">
                  Free MINESEC Guides &amp; Teacher Toolkits
                </h2>
                <p className="text-[14px] text-[#525E4B]">
                  Practical resources written for Cameroon secondary educators, Class Masters, and Principals.
                </p>
              </div>

              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2A7C13] hover:underline shrink-0"
              >
                <span>Browse All Guides &amp; Articles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Most Recent Guide */}
              <div className="rounded-[10px] bg-white border border-[#E8DFC9] p-5 shadow-2xs hover:shadow-md hover:border-[#2A7C13] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-4 group">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2A7C13] bg-[#EAF7E4] px-2 py-0.5 rounded">
                    Teacher Tools
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-[#142010] mt-2.5 leading-snug group-hover:text-[#2A7C13] transition-colors">
                    <Link href="/blog/how-cameroon-teachers-make-extra-income" className="hover:text-[#2A7C13] transition-colors">
                      6 Practical Ways Cameroon Teachers Can Make Extra Income
                    </Link>
                  </h3>
                  <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
                    Realistic, ethical ways educators earn extra income without burning out, from exam booklets to school agent royalties.
                  </p>
                </div>
                <Link
                  href="/blog/how-cameroon-teachers-make-extra-income"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2A7C13] hover:underline pt-2 border-t border-[#F0EFEA] group-hover:translate-x-0.5 transition-all"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Card 2 */}
              <div className="rounded-[10px] bg-white border border-[#E8DFC9] p-5 shadow-2xs hover:shadow-md hover:border-[#2A7C13] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-4 group">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B45309] bg-[#FFF8CF] px-2 py-0.5 rounded">
                    Marks &amp; Excel
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-[#142010] mt-2.5 leading-snug group-hover:text-[#2A7C13] transition-colors">
                    <Link href="/blog/fix-excel-class-council-errors" className="hover:text-[#2A7C13] transition-colors">
                      Why Excel Breaks During Class Councils (And How to Fix It)
                    </Link>
                  </h3>
                  <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
                    Troubleshooting guide for Class Masters fighting #DIV/0!, coefficient multiplier errors, and corrupted rankings.
                  </p>
                </div>
                <Link
                  href="/blog/fix-excel-class-council-errors"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2A7C13] hover:underline pt-2 border-t border-[#F0EFEA] group-hover:translate-x-0.5 transition-all"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Card 3 */}
              <div className="rounded-[10px] bg-white border border-[#E8DFC9] p-5 shadow-2xs hover:shadow-md hover:border-[#2A7C13] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-4 group">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] bg-[#EFF6FF] px-2 py-0.5 rounded">
                    Teacher Tools
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-[#142010] mt-2.5 leading-snug group-hover:text-[#2A7C13] transition-colors">
                    <Link href="/blog/minesec-inspection-cahier-de-texte-checklist" className="hover:text-[#2A7C13] transition-colors">
                      The Pedagogic Inspector&apos;s Checklist: Logbooks &amp; Schemes of Work
                    </Link>
                  </h3>
                  <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
                    What ministerial inspectors audit in your Cahier de Texte and lesson pacing across the 6 evaluation sequences.
                  </p>
                </div>
                <Link
                  href="/blog/minesec-inspection-cahier-de-texte-checklist"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2A7C13] hover:underline pt-2 border-t border-[#F0EFEA] group-hover:translate-x-0.5 transition-all"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ Section ───────────────────────────────────────────────────── */}
        <section id="faq" className="py-16 sm:py-24 border-b border-[#E8DFC9] bg-white">
          <div className={CONTAINER}>
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7E4] border border-[#76C457]/30 text-[#2A7C13] text-[11px] font-bold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2A7C13]" />
                <span>Questions & Answers</span>
              </div>
              <h2 className="text-[1.85rem] sm:text-[2.2rem] font-extrabold text-[#142010]">
                Frequently Asked Questions
              </h2>
              <p className="text-[14px] text-[#525E4B]">
                Everything you need to know about setting up Nsei Sukul and the Sukul Hub at your institution.
              </p>
            </div>

            <LandingFaq />
          </div>
        </section>

        {/* ── Closing CTA ───────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-24 bg-[#142010] text-white">
          <div className={CONTAINER}>
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-[2rem] sm:text-[2.6rem] font-extrabold tracking-tight leading-[1.12]">
                Less time fighting paperwork. <br />
                <span className="text-[#76C457]">More time educating the next generation.</span>
              </h2>
              <p className="text-[14px] sm:text-[16px] text-[#A6B8A0] leading-[1.65]">
                Empower your school with an organized, error-free system built specifically for the realities of Cameroon.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-[7px] bg-[#76C457] hover:bg-[#68B349] text-[#0E1A09] font-bold text-[14px] shadow-sm transition-colors"
                >
                  Register Your School Now
                </Link>
                <a
                  href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20we%20want%20to%20schedule%20a%20demonstration%20for%20our%20school."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-[7px] bg-white/10 hover:bg-white/15 text-white font-semibold text-[14px] border border-white/15 transition-colors gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-[#76C457] shrink-0" />
                  <span>Chat on WhatsApp</span>
                  <span className="hidden sm:inline">(+237 682 833 601)</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <MarketingFooter />
    </div>
  );
}
