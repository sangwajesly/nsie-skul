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
} from "lucide-react";
import { MarketingHeader } from "@/components/landing/MarketingHeader";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { BreadcrumbJsonLd } from "@/lib/seo/structured-data";
import { PitchCopyCard } from "@/components/overview/PitchTools";

export const metadata: Metadata = {
  title: "What Nsei Sukul Does | Complete Guide and Teacher Pitch Kit",
  description:
    "Everything Nsei Sukul offers for secondary and high schools in Cameroon. Summary, full feature breakdown, future roadmap, and how teachers can introduce it to their school.",
  alternates: {
    canonical: "/overview",
  },
  openGraph: {
    title: "Nsei Sukul Overview: What the System Does and What Is Coming Next",
    description:
      "A simple, clear guide for teachers, principals, and school leaders. Learn how Nsei Sukul handles MINESEC report cards, school fees, and offline campus work.",
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
              Everything Nsei Sukul Does, Explained in Plain Human Language
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#525E4B] max-w-3xl mx-auto leading-relaxed">
              No technical buzzwords or confusing jargon. Here is a clear summary of what our system does today,
              what we are adding next, and how you can introduce it to your school or principal with confidence.
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
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-left">
              <div className="bg-white p-3.5 rounded-lg border border-[#E8DFC9] shadow-2xs">
                <div className="text-xs font-bold text-[#2A7C13] uppercase tracking-wider">Printing</div>
                <div className="text-sm font-extrabold text-[#142010] mt-1">Strict 1-Page A4</div>
                <div className="text-[11px] text-[#788470] mt-0.5">Never overflows to a 2nd sheet</div>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-[#E8DFC9] shadow-2xs">
                <div className="text-xs font-bold text-[#2A7C13] uppercase tracking-wider">Curriculum</div>
                <div className="text-sm font-extrabold text-[#142010] mt-1">MINESEC Standard</div>
                <div className="text-[11px] text-[#788470] mt-0.5">6 Sequences, CBA &amp; coefficients</div>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-[#E8DFC9] shadow-2xs">
                <div className="text-xs font-bold text-[#2A7C13] uppercase tracking-wider">Network</div>
                <div className="text-sm font-extrabold text-[#142010] mt-1">Works Offline</div>
                <div className="text-[11px] text-[#788470] mt-0.5">Local Wi-Fi when internet cuts</div>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-[#E8DFC9] shadow-2xs">
                <div className="text-xs font-bold text-[#2A7C13] uppercase tracking-wider">Finance</div>
                <div className="text-sm font-extrabold text-[#142010] mt-1">Mobile Money</div>
                <div className="text-[11px] text-[#788470] mt-0.5">MTN &amp; Orange instant receipts</div>
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
                Here are the core modules and tools available the moment your school signs up.
              </p>
            </div>

            <div className="space-y-8">
              {/* Feature 1 */}
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
                    Designed specifically for the Cameroon national curriculum (General Secondary, Technical, and Commercial).
                    It handles 6 sequences, 3 terms, competency-based appreciations (CBA), and weighted subject coefficients.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3827] pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Automatic class ranks and term averages</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Strict 1-page A4 print without multi-page spillover</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Bulk print entire classes with one button click</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Official MINESEC grading scale &amp; conduct remarks</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-[#E8DFC9] text-center shadow-xs">
                  <div className="text-xs font-bold text-[#788470] uppercase">Paper Savings</div>
                  <div className="text-2xl font-extrabold text-[#2A7C13] mt-1">50% Less Paper</div>
                  <p className="text-xs text-[#525E4B] mt-1 leading-snug">
                    By keeping report cards strictly on 1 page front-only, a school with 600 students saves over 1,800 printed sheets every academic year.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-xl border border-[#E8DFC9] bg-[#FFFDF5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFF8CF] text-[#7A5B00] text-xs font-bold">
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Campus Resilience</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#142010]">
                    2. Offline School Hub: Works Without Internet
                  </h4>
                  <p className="text-sm text-[#525E4B] leading-relaxed">
                    Internet outages should never stop a school from working. With Nsei Sukul Offline Hub, teachers connect
                    their laptops or phones to the school's local router. Even when the internet cable is cut or network
                    bundles expire, teachers can enter marks and print report cards smoothly.
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

              {/* Feature 3 */}
              <div className="p-6 rounded-xl border border-[#E8DFC9] bg-[#FFFDF5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FBE6C2] text-[#5A3C0B] text-xs font-bold">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>School Bursary</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#142010]">
                    3. Fee Management, Installments, and Mobile Money
                  </h4>
                  <p className="text-sm text-[#525E4B] leading-relaxed">
                    Manage all tuition, PTA levies, registration fees, and exam dues in FCFA. The bursar can record cash
                    payments or let parents pay directly via MTN Mobile Money and Orange Money. The system automatically
                    generates official printed receipt slips and tracks debtor balances.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3827] pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Custom installment plans (1st, 2nd, 3rd installments)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>MTN MoMo and Orange Money payment integration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Instant 1-click debtor list for exam clearance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Printable thermal slips or A5 bursary receipts</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-[#E8DFC9] text-center shadow-xs">
                  <div className="text-xs font-bold text-[#788470] uppercase">Financial Control</div>
                  <div className="text-2xl font-extrabold text-[#2A7C13] mt-1">Zero Leaks</div>
                  <p className="text-xs text-[#525E4B] mt-1 leading-snug">
                    Every franc received is tied to a student matricule and logged with the collector's name and timestamp.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-xl border border-[#E8DFC9] bg-[#FFFDF5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EAF7E4] text-[#2A7C13] text-xs font-bold">
                    <Users className="w-3.5 h-3.5" />
                    <span>Student Records</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#142010]">
                    4. Student Dossiers, Class Lists, and Fast Bulk Enrollment
                  </h4>
                  <p className="text-sm text-[#525E4B] leading-relaxed">
                    Say goodbye to misplaced physical files. Store each student's full profile: matricule, photo, date of birth,
                    guardian phone number, address, and academic history. You can upload entire class lists from an existing
                    Excel or CSV file in under 30 seconds.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3827] pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Excel and CSV one-click student roster upload</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Automatic matricule generator for new intake</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Permanent academic archive preserved across years</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Class promotion and transfer management</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-[#E8DFC9] text-center shadow-xs">
                  <div className="text-xs font-bold text-[#788470] uppercase">Setup Speed</div>
                  <div className="text-2xl font-extrabold text-[#142010] mt-1">&lt; 5 Minutes</div>
                  <p className="text-xs text-[#525E4B] mt-1 leading-snug">
                    Import 500 students and assign them to Form 1 through Upper Sixth before your morning tea break.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-xl border border-[#E8DFC9] bg-[#FFFDF5] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FFF8CF] text-[#7A5B00] text-xs font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>School Life</span>
                  </div>
                  <h4 className="text-xl font-bold text-[#142010]">
                    5. Attendance, Discipline Tracking, and Master Timetable
                  </h4>
                  <p className="text-sm text-[#525E4B] leading-relaxed">
                    Discipline masters can record student absences and lates with simple taps. Unjustified absence counts
                    feed directly into the conduct section of terminal report cards. In addition, the timetable tool
                    allows administrators to map teacher periods without overlapping schedules.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3827] pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Daily morning roll call and period attendance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Justified vs unjustified absence tally for MINESEC</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Subject teacher schedule and room assignment</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0" />
                      <span>Discipline sanction records and warning letters</span>
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
            </div>
          </div>
        </section>

        {/* SECTION 3: FUTURE ROADMAP */}
        <section className="py-14 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8CF] text-[#7A5B00] text-xs font-bold mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>Transparent Development Roadmap</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010]">
              What We Are Adding Next to Nsei Sukul
            </h2>
            <p className="text-sm text-[#525E4B] mt-2">
              We update our system every month based on direct feedback from Cameroonian teachers and principals.
              Here is what is currently in active development.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Roadmap 1 */}
            <div className="p-5 rounded-xl border border-[#E8DFC9] bg-white space-y-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#2A7C13] uppercase tracking-wider">Coming Soon</div>
              <h3 className="text-base font-bold text-[#142010]">
                Direct WhatsApp Report Card Delivery
              </h3>
              <p className="text-xs text-[#525E4B] leading-relaxed">
                Parents will receive a secure PDF link of their child's report card directly on WhatsApp the minute the principal releases the term results.
              </p>
            </div>

            {/* Roadmap 2 */}
            <div className="p-5 rounded-xl border border-[#E8DFC9] bg-white space-y-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#FFF8CF] text-[#7A5B00] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#7A5B00] uppercase tracking-wider">In Development</div>
              <h3 className="text-base font-bold text-[#142010]">
                Parent &amp; Student Mobile Portal
              </h3>
              <p className="text-xs text-[#525E4B] leading-relaxed">
                Parents can log in from their phones to check daily attendance, school fee clearance, and sequence marks without traveling to campus.
              </p>
            </div>

            {/* Roadmap 3 */}
            <div className="p-5 rounded-xl border border-[#E8DFC9] bg-white space-y-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#FBE6C2] text-[#5A3C0B] flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#5A3C0B] uppercase tracking-wider">In Development</div>
              <h3 className="text-base font-bold text-[#142010]">
                Digital Teacher Lesson Notebook (Cahier de Texte)
              </h3>
              <p className="text-xs text-[#525E4B] leading-relaxed">
                Teachers log syllabus progress digitally. HODs and MINESEC Pedagogic Inspectors can review lesson coverage in one clean dashboard.
              </p>
            </div>

            {/* Roadmap 4 */}
            <div className="p-5 rounded-xl border border-[#E8DFC9] bg-white space-y-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#2A7C13] uppercase tracking-wider">Planned</div>
              <h3 className="text-base font-bold text-[#142010]">
                GCE Board &amp; BEPC Exam Registration Exporter
              </h3>
              <p className="text-xs text-[#525E4B] leading-relaxed">
                Automatically format candidate registration lists and photo albums matching official Cameroon GCE Board and DECC submission requirements.
              </p>
            </div>

            {/* Roadmap 5 */}
            <div className="p-5 rounded-xl border border-[#E8DFC9] bg-white space-y-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#FFF8CF] text-[#7A5B00] flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#7A5B00] uppercase tracking-wider">Planned</div>
              <h3 className="text-base font-bold text-[#142010]">
                Automated Honor Rolls &amp; Merits
              </h3>
              <p className="text-xs text-[#525E4B] leading-relaxed">
                One-click generation of Tableau d'Honneur, certificates of excellence, and most improved student certificates for school assemblies.
              </p>
            </div>

            {/* Roadmap 6 */}
            <div className="p-5 rounded-xl border border-[#E8DFC9] bg-white space-y-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#FBE6C2] text-[#5A3C0B] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#5A3C0B] uppercase tracking-wider">Planned</div>
              <h3 className="text-base font-bold text-[#142010]">
                RFID / Gate Clock-in Scanner
              </h3>
              <p className="text-xs text-[#525E4B] leading-relaxed">
                Optional student card scanner at the school gate that marks daily presence instantly when students arrive on campus.
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
