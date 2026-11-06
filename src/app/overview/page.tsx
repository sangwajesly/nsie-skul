import type { Metadata } from "next";
import Link from "next/link";
import {
  FileSpreadsheet,
  WifiOff,
  Wallet,
  Users,
  Calendar,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageCircle,
  Clock,
  Printer,
  Smartphone,
  Award,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Camera,
  Mic,
  Bell,
  CreditCard,
  IdCard,
  FileText,
} from "lucide-react";
import { MarketingHeader } from "@/components/landing/MarketingHeader";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { BreadcrumbJsonLd } from "@/lib/seo/structured-data";
import { PitchCopyCard } from "@/components/overview/PitchTools";

export const metadata: Metadata = {
  title: "System Overview & School Pitch Guide | Nsei Sukul",
  description:
    "Complete walkthrough of Nsei Sukul capabilities, MINESEC report cards, fee bursary, offline campus hub, upcoming roadmap, and teacher introduction resources.",
  alternates: {
    canonical: "/overview",
  },
  openGraph: {
    title: "Everything Nsei Sukul Does for Secondary & High Schools in Cameroon",
    description:
      "A complete guide to Nsei Sukul academic tools, fee management, offline hub, future roadmap, and teacher pitch resources.",
    url: "/overview",
    type: "website",
  },
};

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#142010] flex flex-col selection:bg-[#2A7C13] selection:text-white">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "System Overview", path: "/overview" },
        ]}
      />

      <MarketingHeader currentPath="/overview" />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-[#E8DFC9] bg-gradient-to-b from-[#FAF6E9] to-[#FFFDF5]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF7E4] border border-[#C5E8BB] text-[#2A7C13] text-xs sm:text-sm font-bold mb-6">
              <Sparkles className="w-4 h-4" />
              <span>For Teachers, Principals, and School Administrators in Cameroon</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#142010] tracking-tight leading-tight max-w-4xl mx-auto">
              Everything Nsei Sukul Does for Secondary and High Schools
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#525E4B] max-w-3xl mx-auto leading-relaxed">
              A complete guide covering current system capabilities, upcoming roadmap additions,
              and step-by-step resources to introduce the platform to your school leadership.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#2A7C13] hover:bg-[#20600E] text-white text-sm font-bold shadow-md transition-all hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4 text-[#FFF8CF]" />
                <span>Test 1-Click Live Demo</span>
              </Link>

              <a
                href="#pitch-kit"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-[#F3EED9] text-[#142010] border border-[#D8CDB2] text-sm font-bold shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#2A7C13]" />
                <span>Get Pitch Kit for Your Principal</span>
              </a>

              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#FFF8CF] hover:bg-[#FDF3B4] border border-[#FBE6C2] text-[#7A5B00] text-sm font-bold shadow-xs transition-colors"
              >
                <span>Start 30-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick Trust Pillars */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-left">
              <div className="bg-white p-3 rounded-lg border border-[#E8DFC9] shadow-2xs">
                <div className="text-[10px] font-bold text-[#2A7C13] uppercase tracking-wider">Report Cards</div>
                <div className="text-[13px] font-extrabold text-[#142010] mt-1">Strict 1-Page A4</div>
                <div className="text-[10.5px] text-[#788470] mt-0.5">No 2nd-page spillover</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#E8DFC9] shadow-2xs">
                <div className="text-[10px] font-bold text-[#2A7C13] uppercase tracking-wider">Identification</div>
                <div className="text-[13px] font-extrabold text-[#142010] mt-1">Student ID Cards</div>
                <div className="text-[10.5px] text-[#788470] mt-0.5">With photos &amp; barcodes</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#E8DFC9] shadow-2xs">
                <div className="text-[10px] font-bold text-[#2A7C13] uppercase tracking-wider">Assemblies</div>
                <div className="text-[13px] font-extrabold text-[#142010] mt-1">Honor Certificates</div>
                <div className="text-[10.5px] text-[#788470] mt-0.5">Tableau d'Honneur print</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#E8DFC9] shadow-2xs">
                <div className="text-[10px] font-bold text-[#2A7C13] uppercase tracking-wider">Academic History</div>
                <div className="text-[13px] font-extrabold text-[#142010] mt-1">Official Transcripts</div>
                <div className="text-[10.5px] text-[#788470] mt-0.5">Multi-year cumulative</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#E8DFC9] shadow-2xs">
                <div className="text-[10px] font-bold text-[#2A7C13] uppercase tracking-wider">Scheduling</div>
                <div className="text-[13px] font-extrabold text-[#142010] mt-1">Master Timetable</div>
                <div className="text-[10.5px] text-[#788470] mt-0.5">Zero teacher overlap</div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#E8DFC9] shadow-2xs">
                <div className="text-[10px] font-bold text-[#2A7C13] uppercase tracking-wider">Campus Network</div>
                <div className="text-[13px] font-extrabold text-[#142010] mt-1">Works Offline</div>
                <div className="text-[10.5px] text-[#788470] mt-0.5">Local Wi-Fi when offline</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: 2-MINUTE SUMMARY */}
        <section className="py-14 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2A7C13]">
              Short On Time? Read This First
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#142010] mt-1">
              The 2-Minute Summary of Nsei Sukul
            </h3>
            <p className="text-sm text-[#525E4B] mt-2">
              How schools in Cameroon operate today versus what happens when you turn on Nsei Sukul.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Way */}
            <div className="bg-[#FFF4F2] rounded-xl border border-[#FAD2CD] p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#C53030] font-bold text-base">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>The Traditional Way (Excel &amp; Paper Books)</span>
              </div>
              <ul className="space-y-3 text-sm text-[#5C2B29]">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#C53030] font-bold mt-0.5">&times;</span>
                  <span>Teachers spend sleepless nights calculating marks, coefficients, and ranks on paper or Excel sheets with broken formulas.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#C53030] font-bold mt-0.5">&times;</span>
                  <span>Report cards print across two pages, wasting reams of expensive A4 paper and toner just to print a signature on page 2.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#C53030] font-bold mt-0.5">&times;</span>
                  <span>When MTN or Orange internet cuts in town, online platforms freeze and no teacher can submit marks.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#C53030] font-bold mt-0.5">&times;</span>
                  <span>Fee registers are handwritten in huge counter books. Reconciling who paid first installment takes days.</span>
                </li>
              </ul>
            </div>

            {/* The Nsei Sukul Way */}
            <div className="bg-[#F0FAF0] rounded-xl border-2 border-[#84E466]/60 p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#20600E] font-bold text-base">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2A7C13]" />
                <span>The Nsei Sukul Way (Fast, Simple &amp; Local)</span>
              </div>
              <ul className="space-y-3 text-sm text-[#1A4010]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                  <span>Teachers enter marks on simple digital sheets. The system automatically computes sequence totals, averages, and class ranks in seconds.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                  <span>Every report card strictly fits on the front of 1 single sheet of A4 paper. Bulk print whole classes in one click.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                  <span>Works offline on your school Wi-Fi or LAN cable. Teachers work smoothly even with zero internet connectivity.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                  <span>Tracks fee installments, supports Mobile Money payments, and prints clean receipts with live debtor lists.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 2: DETAILED BREAKDOWN OF CURRENT CAPABILITIES */}
        <section className="py-14 bg-white border-y border-[#E8DFC9]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#2A7C13]">
                Full System Tour
              </h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#142010] mt-1">
                Everything Working on the Platform Right Now
              </h3>
              <p className="text-sm text-[#525E4B] mt-2">
                Nsei Sukul is packed with real tools built for Cameroon schools. Here is the full tour of what your school can use today.
              </p>
            </div>

            <div className="space-y-8">
              {/* Feature 1: Report Cards */}
              <div className="p-6 rounded-xl border border-[#E8DFC9] bg-[#FFFDF5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EAF7E4] text-[#2A7C13] text-xs font-bold">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Academic Engine</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#142010]">
                    1. MINESEC-Compliant Report Cards with Strict 1-Page Guarantee
                  </h4>
                  <p className="text-sm text-[#525E4B] leading-relaxed">
                    Custom-built for Cameroon secondary schools (General, Technical, and Commercial streams).
                    Handles all 6 sequences, 3 terms, Competency-Based Approach (CBA) appreciations, and weighted subject coefficients.
                    Every report card strictly fits on the front of 1 single sheet of A4 paper with zero overflow.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3827] pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Automatic class ranks, sequence totals, and term averages</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Strict 1-page physical A4 constraint saves over 50% paper</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Bulk 1-click printing for whole classes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Official MINESEC grading scale and class master remarks</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-[#E8DFC9] text-center shadow-xs">
                  <div className="text-xs font-bold text-[#788470] uppercase">Paper Savings</div>
                  <div className="text-2xl font-extrabold text-[#2A7C13] mt-1">50% Less Paper</div>
                  <p className="text-xs text-[#525E4B] mt-1 leading-snug">
                    No more wasted sheets where only a signature or date spills onto page 2.
                  </p>
                </div>
              </div>

              {/* Feature 2: Honor Roll Certificates */}
              <div className="p-6 rounded-xl border border-[#E8DFC9] bg-[#FFFDF5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFF8CF] text-[#7A5B00] text-xs font-bold">
                    <Award className="w-3.5 h-3.5" />
                    <span>School Assemblies &amp; Prize Days</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#142010]">
                    2. Honor Roll &amp; Distinction Certificates (Tableau d'Honneur)
                  </h4>
                  <p className="text-sm text-[#525E4B] leading-relaxed">
                    Celebrate student excellence on speech days and morning assemblies. The system automatically pulls your top-performing
                    students and generates beautiful, official printable certificates with the school coat of arms, student photo,
                    term average, and principal endorsement.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3827] pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Tableau d'Honneur (Honors) for averages of 12/20 and above</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Modern Laureate and Classic Heritage certificate templates</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Subject Distinction awards for highest score in Math, English, etc.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>1-click batch printing for all honorees across the school</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-[#E8DFC9] text-center shadow-xs">
                  <div className="text-xs font-bold text-[#788470] uppercase">Assembly Ready</div>
                  <div className="text-2xl font-extrabold text-[#7A5B00] mt-1">Instant Awards</div>
                  <p className="text-xs text-[#525E4B] mt-1 leading-snug">
                    Reward hardworking students without spending days typing certificates in Microsoft Word.
                  </p>
                </div>
              </div>

              {/* Feature 3: Student ID Cards */}
              <div className="p-6 rounded-xl border border-[#E8DFC9] bg-[#FFFDF5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EAF7E4] text-[#2A7C13] text-xs font-bold">
                    <IdCard className="w-3.5 h-3.5" />
                    <span>Campus Identification</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#142010]">
                    3. Student ID Card Generation with Real Barcodes
                  </h4>
                  <p className="text-sm text-[#525E4B] leading-relaxed">
                    Stop paying expensive third-party graphic designers every September to make student ID cards.
                    Nsei Sukul generates standard CR80 student identification cards complete with the school badge,
                    student photograph, matricule, dynamic barcode, date of birth, class, and academic year.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3827] pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Standard wallet badge size ready for lamination or PVC print</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Scannable Code-128 barcode linked to student matricule</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Batch export ID cards for entire classes in seconds</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Includes principal signature and official school stamp</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-[#E8DFC9] text-center shadow-xs">
                  <div className="text-xs font-bold text-[#788470] uppercase">Cost Cut</div>
                  <div className="text-2xl font-extrabold text-[#2A7C13] mt-1">Zero Designer Fees</div>
                  <p className="text-xs text-[#525E4B] mt-1 leading-snug">
                    Print student badges in-house on your office printer at a fraction of the cost.
                  </p>
                </div>
              </div>

              {/* Feature 4: Academic Transcripts */}
              <div className="p-6 rounded-xl border border-[#E8DFC9] bg-[#FFFDF5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FBE6C2] text-[#5A3C0B] text-xs font-bold">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Official Records</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#142010]">
                    4. Official Multi-Year Academic Transcripts (Relevé de Notes)
                  </h4>
                  <p className="text-sm text-[#525E4B] leading-relaxed">
                    When a student transfers to another institution, applies for a visa, registers for national examinations,
                    or applies to a university, producing their multi-year transcript usually takes weeks of digging through dusty paper registers.
                    Nsei Sukul generates a cumulative official transcript with one click.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3827] pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Multi-year cumulative record of sequences and terms</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Official verification layout accepted by universities &amp; embassies</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Includes student GPA, rank, conduct summary, and honors</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Archived permanently in the school's digital registry</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-[#E8DFC9] text-center shadow-xs">
                  <div className="text-xs font-bold text-[#788470] uppercase">Administrative Speed</div>
                  <div className="text-2xl font-extrabold text-[#5A3C0B] mt-1">Ready in 5s</div>
                  <p className="text-xs text-[#525E4B] mt-1 leading-snug">
                    Print verified transcripts on demand without opening ancient paper registers.
                  </p>
                </div>
              </div>

              {/* Feature 5: Master Timetable */}
              <div className="p-6 rounded-xl border border-[#E8DFC9] bg-[#FFFDF5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EAF7E4] text-[#2A7C13] text-xs font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Academic Planning</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#142010]">
                    5. Master Timetable &amp; Teacher Schedule Generator
                  </h4>
                  <p className="text-sm text-[#525E4B] leading-relaxed">
                    Building a secondary school timetable by hand is a massive headache of clashes, teacher overlaps,
                    and room conflicts. Nsei Sukul maps out your periods across Monday to Friday, assigns subject teachers
                    to specific classes, and ensures no teacher is scheduled in two places at once.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3827] pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Master campus timetable view across all forms and streams</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Individual printable timetable slips for each teacher</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Automatic conflict prevention for teacher periods and rooms</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Customizable periods for assemblies, breaks, and sports</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-[#E8DFC9] text-center shadow-xs">
                  <div className="text-xs font-bold text-[#788470] uppercase">Zero Clashes</div>
                  <div className="text-2xl font-extrabold text-[#142010] mt-1">100% Conflict Free</div>
                  <p className="text-xs text-[#525E4B] mt-1 leading-snug">
                    No teacher will ever find another teacher teaching in their classroom period.
                  </p>
                </div>
              </div>

              {/* Feature 6: Class Lists & Intake Sheets */}
              <div className="p-6 rounded-xl border border-[#E8DFC9] bg-[#FFFDF5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFF8CF] text-[#7A5B00] text-xs font-bold">
                    <Users className="w-3.5 h-3.5" />
                    <span>Enrollment &amp; Roster</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#142010]">
                    6. Class Lists, Student Dossiers, and Printable Intake Sheets
                  </h4>
                  <p className="text-sm text-[#525E4B] leading-relaxed">
                    Generate official class master registers for class masters and discipline masters with one click.
                    Includes male/female counts, student matricules, and emergency parent contacts.
                    The system also provides official printable student intake sheets for admission days and lets you import
                    existing class rosters from Excel in under 30 seconds.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3827] pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Printable official class registers with gender ratios</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Ready-to-print paper intake sheets for new school admissions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>One-click bulk student upload from existing Excel files</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Permanent digital student dossiers with photos and medical notes</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-[#E8DFC9] text-center shadow-xs">
                  <div className="text-xs font-bold text-[#788470] uppercase">Intake Speed</div>
                  <div className="text-2xl font-extrabold text-[#7A5B00] mt-1">&lt; 30 Seconds</div>
                  <p className="text-xs text-[#525E4B] mt-1 leading-snug">
                    Upload an entire Excel list of 80 students and generate their class register instantly.
                  </p>
                </div>
              </div>

              {/* Feature 7: Bursary & Fees */}
              <div className="p-6 rounded-xl border border-[#E8DFC9] bg-[#FFFDF5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FBE6C2] text-[#5A3C0B] text-xs font-bold">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>School Bursary</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#142010]">
                    7. Fee Management, Installments, Receipts &amp; Mobile Money
                  </h4>
                  <p className="text-sm text-[#525E4B] leading-relaxed">
                    Track all tuition, PTA levies, registration fees, and exam dues in FCFA.
                    Record cash payments or accept MTN Mobile Money and Orange Money payments seamlessly.
                    The bursar prints official thermal or A5 receipt slips, and can generate a 1-click debtor list
                    showing exactly which students owe balances before exams begin.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3827] pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Track 1st, 2nd, and 3rd fee installments with live balances</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>MTN MoMo and Orange Money payment integration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Printable official and provisional bursary receipts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Instant 1-click debtor roster for examination clearance</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-[#E8DFC9] text-center shadow-xs">
                  <div className="text-xs font-bold text-[#788470] uppercase">Financial Control</div>
                  <div className="text-2xl font-extrabold text-[#2A7C13] mt-1">Zero Leaks</div>
                  <p className="text-xs text-[#525E4B] mt-1 leading-snug">
                    Every franc received is tied to a student matricule and logged with collector name and timestamp.
                  </p>
                </div>
              </div>

              {/* Feature 8: Attendance & Discipline */}
              <div className="p-6 rounded-xl border border-[#E8DFC9] bg-[#FFFDF5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EAF7E4] text-[#2A7C13] text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Discipline Master</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#142010]">
                    8. Daily Attendance &amp; Discipline Tracking
                  </h4>
                  <p className="text-sm text-[#525E4B] leading-relaxed">
                    Discipline masters can record student absences and lates with simple taps on a phone or laptop.
                    The system categorizes absences as justified or unjustified, and tallies the exact absence hours
                    directly into the conduct section of terminal MINESEC report cards without manual recount.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3827] pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Daily morning roll call and period attendance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Justified vs unjustified absence tally for MINESEC cards</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Discipline sanction records and warning letters</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Class conduct overview for staff meetings</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-[#E8DFC9] text-center shadow-xs">
                  <div className="text-xs font-bold text-[#788470] uppercase">Discipline Accuracy</div>
                  <div className="text-2xl font-extrabold text-[#2A7C13] mt-1">Automatic Tallies</div>
                  <p className="text-xs text-[#525E4B] mt-1 leading-snug">
                    Absence hours automatically display on the official report card without manual recount.
                  </p>
                </div>
              </div>

              {/* Feature 9: Offline School Hub */}
              <div className="p-6 rounded-xl border border-[#E8DFC9] bg-[#FFFDF5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFF8CF] text-[#7A5B00] text-xs font-bold">
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Campus Resilience</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#142010]">
                    9. Offline School Hub: Works Without Internet
                  </h4>
                  <p className="text-sm text-[#525E4B] leading-relaxed">
                    Internet outages should never stop a school from working. With Nsei Sukul Offline Hub, teachers connect
                    their laptops or phones to the school's local router. Even when the internet cable is cut or network
                    bundles expire, teachers can enter marks, print class lists, and generate report cards smoothly.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3827] pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Runs on local Wi-Fi or simple Ethernet switch</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Zero data bundle needed during marks entry sessions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Automatic cloud sync when internet is restored</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Encrypted local database with automatic backups</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-[#E8DFC9] text-center shadow-xs">
                  <div className="text-xs font-bold text-[#788470] uppercase">Uptime Guarantee</div>
                  <div className="text-2xl font-extrabold text-[#142010] mt-1">100% Reliable</div>
                  <p className="text-xs text-[#525E4B] mt-1 leading-snug">
                    No more waiting for network bars at midnight before report card deadlines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: FUTURE ROADMAP */}
        <section className="py-14 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8CF] text-[#7A5B00] text-xs font-bold mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>Future Roadmap</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010]">
              What We Plan to Implement Next
            </h2>
            <p className="text-sm text-[#525E4B] mt-2">
              We are constantly evolving and improving Nsei Sukul to make work easier for teachers and school heads.
              Here are the upcoming features we are actively preparing for the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Future Item 1 */}
            <div className="p-5 rounded-xl border border-[#E8DFC9] bg-white space-y-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#2A7C13] uppercase tracking-wider">Coming Soon</div>
              <h3 className="text-base font-bold text-[#142010]">
                WhatsApp Report Cards to Parents
              </h3>
              <p className="text-xs text-[#525E4B] leading-relaxed">
                Send student terminal report cards directly to parents on WhatsApp as soon as results are released. Parents can view and download their child's card instantly without traveling to the campus.
              </p>
            </div>

            {/* Future Item 2 */}
            <div className="p-5 rounded-xl border border-[#E8DFC9] bg-white space-y-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#FFF8CF] text-[#7A5B00] flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#7A5B00] uppercase tracking-wider">Coming Soon</div>
              <h3 className="text-base font-bold text-[#142010]">
                Fee Payments Directly from Parents' Phones
              </h3>
              <p className="text-xs text-[#525E4B] leading-relaxed">
                Parents will be able to pay school fees, tuition installments, and PTA levies straight from their own mobile phones from anywhere in Cameroon, saving time and ending long bursary lines.
              </p>
            </div>

            {/* Future Item 3 */}
            <div className="p-5 rounded-xl border border-[#E8DFC9] bg-white space-y-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#FBE6C2] text-[#5A3C0B] flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#5A3C0B] uppercase tracking-wider">Coming Soon</div>
              <h3 className="text-base font-bold text-[#142010]">
                SMS &amp; WhatsApp Reminders for Unpaid Fees
              </h3>
              <p className="text-xs text-[#525E4B] leading-relaxed">
                Automated, polite reminder notifications sent by SMS and WhatsApp to parents whose children have an outstanding fee balance, showing the exact amount due and how to clear it.
              </p>
            </div>

            {/* Future Item 4 */}
            <div className="p-5 rounded-xl border border-[#E8DFC9] bg-white space-y-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center font-bold">
                <Camera className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#2A7C13] uppercase tracking-wider">AI Innovation</div>
              <h3 className="text-base font-bold text-[#142010]">
                AI Snap-to-Marks Entry (Photo Filling)
              </h3>
              <p className="text-xs text-[#525E4B] leading-relaxed">
                Teachers can snap a photo of their handwritten paper mark booklet or test sheet with their phone. The AI automatically scans the handwriting and fills the marks into the system for all students.
              </p>
            </div>

            {/* Future Item 5 */}
            <div className="p-5 rounded-xl border border-[#E8DFC9] bg-white space-y-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#FFF8CF] text-[#7A5B00] flex items-center justify-center font-bold">
                <Mic className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#7A5B00] uppercase tracking-wider">Smart Voice Tool</div>
              <h3 className="text-base font-bold text-[#142010]">
                Offline Voice Mark Entry
              </h3>
              <p className="text-xs text-[#525E4B] leading-relaxed">
                Dictate student scores using your voice while working offline on campus. Speak student names and marks, and the system automatically fills them into the mark sheet without typing.
              </p>
            </div>

            {/* Future Item 6: Commitment to Continuous Improvement */}
            <div className="p-5 rounded-xl border border-[#2A7C13]/30 bg-[#FAF6E9] space-y-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#2A7C13] text-white flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#2A7C13] uppercase tracking-wider">Continuous Growth</div>
              <h3 className="text-base font-bold text-[#142010]">
                Always Improving for Cameroon Schools
              </h3>
              <p className="text-xs text-[#525E4B] leading-relaxed">
                We are always evolving, listening to teachers, and improving the platform. Every update is designed to remove repetitive burdens and make school leadership smoother and more transparent.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: TEACHER PITCH KIT */}
        <section id="pitch-kit" className="py-14 bg-[#FAF6E9] border-t border-[#E8DFC9]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7E4] text-[#2A7C13] text-xs font-bold mb-3">
                <Award className="w-3.5 h-3.5" />
                <span>Teacher Pitch Kit</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010]">
                How to Introduce Nsei Sukul to Your School
              </h2>
              <p className="text-sm text-[#525E4B] mt-2">
                Want your school to start using Nsei Sukul? Here is a simple, 4-step approach that has helped dozens
                of teachers convince their Principals and Vice Principals to adopt the system.
              </p>
            </div>

            {/* 4 Step Pitch Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-[#E8DFC9] shadow-2xs space-y-2">
                <div className="w-7 h-7 rounded-full bg-[#2A7C13] text-white flex items-center justify-center text-xs font-extrabold">
                  1
                </div>
                <h3 className="text-sm font-bold text-[#142010]">Show the Live Demo</h3>
                <p className="text-xs text-[#525E4B] leading-relaxed">
                  During break, open <span className="font-semibold text-[#142010]">/demo</span> on your phone or laptop. Show them a populated Form 1 class with marks and ranks already calculated.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#E8DFC9] shadow-2xs space-y-2">
                <div className="w-7 h-7 rounded-full bg-[#2A7C13] text-white flex items-center justify-center text-xs font-extrabold">
                  2
                </div>
                <h3 className="text-sm font-bold text-[#142010]">Show the 1-Page Report</h3>
                <p className="text-xs text-[#525E4B] leading-relaxed">
                  Show them how every report card strictly fits on one sheet of A4 paper. Explain how much money the school will save on paper and printing toner.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#E8DFC9] shadow-2xs space-y-2">
                <div className="w-7 h-7 rounded-full bg-[#2A7C13] text-white flex items-center justify-center text-xs font-extrabold">
                  3
                </div>
                <h3 className="text-sm font-bold text-[#142010]">Explain the 30-Day Trial</h3>
                <p className="text-xs text-[#525E4B] leading-relaxed">
                  Let the principal know the school pays zero francs upfront. They have a full 30 days to test the software with their real classes before deciding.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#E8DFC9] shadow-2xs space-y-2">
                <div className="w-7 h-7 rounded-full bg-[#2A7C13] text-white flex items-center justify-center text-xs font-extrabold">
                  4
                </div>
                <h3 className="text-sm font-bold text-[#142010]">Highlight the Offline Hub</h3>
                <p className="text-xs text-[#525E4B] leading-relaxed">
                  Assure them that internet network failure will not stop the school. The local hub continues working right on campus even when internet is out.
                </p>
              </div>
            </div>

            {/* Interactive Pitch Tool Card */}
            <PitchCopyCard />
          </div>
        </section>

        {/* SECTION 5: COMMON OBJECTIONS & ANSWERS */}
        <section className="py-14 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#2A7C13]">
              School Leadership Questions
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#142010] mt-1">
              Common Questions from Principals (And How to Answer)
            </h3>
            <p className="text-sm text-[#525E4B] mt-2">
              Be ready when your school leadership asks these practical questions.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#E8DFC9] p-5 shadow-2xs">
              <h3 className="text-base font-bold text-[#142010] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#2A7C13] shrink-0" />
                <span>"We already use Excel for marks. Why should we switch?"</span>
              </h3>
              <p className="mt-2 text-sm text-[#525E4B] leading-relaxed">
                Excel formulas break easily when teachers delete cells or copy formulas incorrectly. A virus or flash drive crash can wipe out weeks of marks.
                With Nsei Sukul, calculations are 100% automated and protected. In addition, Excel cannot manage student photos, track fee installments, or produce instant debtor lists.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E8DFC9] p-5 shadow-2xs">
              <h3 className="text-base font-bold text-[#142010] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#2A7C13] shrink-0" />
                <span>"Internet in our town is very weak and unreliable. Will this work for us?"</span>
              </h3>
              <p className="mt-2 text-sm text-[#525E4B] leading-relaxed">
                Yes. That is the exact reason Nsei Sukul was created. Our platform has an Offline School Hub. You connect a basic Wi-Fi router in the staffroom without an active internet subscription.
                Teachers connect to that Wi-Fi network and enter marks smoothly. When internet is back, the system syncs in the background.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E8DFC9] p-5 shadow-2xs">
              <h3 className="text-base font-bold text-[#142010] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#2A7C13] shrink-0" />
                <span>"Is it difficult for older teachers who are not very good with computers?"</span>
              </h3>
              <p className="mt-2 text-sm text-[#525E4B] leading-relaxed">
                Not at all. The marks entry screen looks identical to the traditional paper mark booklet teachers already use. If a teacher can type numbers on a phone keypad or send a WhatsApp message, they can use Nsei Sukul in less than 10 minutes.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-[#E8DFC9] p-5 shadow-2xs">
              <h3 className="text-base font-bold text-[#142010] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#2A7C13] shrink-0" />
                <span>"How much will it cost our school?"</span>
              </h3>
              <p className="mt-2 text-sm text-[#525E4B] leading-relaxed">
                Pricing is flexible based on your school's total student enrollment. There is an unconditional 30-day free trial so the school only commits after seeing the system work with their real students.
                Most schools save more money in printing paper, printer toner, and prevented fee leakages than the small software fee.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: AGENT PROGRAM REMINDER FOR TEACHERS */}
        <section className="py-12 bg-[#EAF7E4] border-t border-[#C5E8BB]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#2A7C13] text-xs font-bold shadow-2xs">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Earn Extra Income While Helping Schools</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010]">
              Are You a Teacher Introducing Schools to Nsei Sukul?
            </h2>
            <p className="text-sm text-[#525E4B] max-w-2xl mx-auto leading-relaxed">
              Through the Nsei Sukul School Agent Program, you earn an instant 10% cash bonus (up to 50,000 FCFA per school) paid directly to your MTN MoMo or Orange Money account when a school joins, plus a 5% bonus every September when they renew.
            </p>
            <div className="pt-2">
              <Link
                href="/agents"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
              >
                <span>Read Full Agent Program Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* BOTTOM FINAL CALL TO ACTION */}
        <section className="py-16 bg-[#142010] text-white text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to See How Nsei Sukul Works on Campus?
            </h2>
            <p className="text-sm text-[#A3BCA0] max-w-xl mx-auto leading-relaxed">
              Test our live demo campus right now in 10 seconds, or reach out to our team directly on WhatsApp for guidance.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#2A7C13] hover:bg-[#20600E] text-white text-sm font-bold shadow-md transition-all hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4 text-[#FFF8CF]" />
                <span>Open Live Demo Campus</span>
              </Link>

              <a
                href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20I%20am%20a%20teacher%20and%20would%20like%20to%20introduce%20my%20school%20to%20the%20platform."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#25D366] hover:bg-[#20BA5A] text-white text-sm font-bold shadow-md transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Team on WhatsApp</span>
              </a>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-bold transition-colors"
              >
                <span>Register Your School</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
