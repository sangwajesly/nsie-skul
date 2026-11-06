import type { Metadata } from "next";
import Link from "next/link";
import {
  Wallet,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Users,
  GraduationCap,
  Building2,
  Banknote,
  Clock,
  HelpCircle,
  Award,
} from "lucide-react";
import { MarketingHeader } from "@/components/landing/MarketingHeader";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { BreadcrumbJsonLd } from "@/lib/seo/structured-data";
import { PitchCopyCard } from "@/components/overview/PitchTools";

export const metadata: Metadata = {
  title: "School Agent Program | Earn Extra Income Helping Schools",
  description:
    "Help schools in your area switch to Nsei Sukul. Earn a 10% Mobile Money bonus when a school joins, plus 5% every September when they renew.",
  alternates: {
    canonical: "/agents",
  },
  openGraph: {
    title: "Nsei Sukul School Agent Program | Earn Extra Income as a Teacher",
    description:
      "Introduce schools around you to Nsei Sukul. Earn up to 50,000 FCFA instant MoMo cash per school, plus extra money every school reopening.",
    url: "/agents",
    type: "website",
  },
};

const TIERS = [
  {
    tier: "Small School",
    students: "Up to 300 students",
    schoolFee: "100,000 FCFA / year",
    setupBounty: "10,000 FCFA",
    annualRoyalty: "5,000 FCFA / year",
    bestFor: "Day colleges, primary-secondary schools, smaller private colleges",
  },
  {
    tier: "Medium School",
    students: "301 to 750 students",
    schoolFee: "200,000 FCFA / year",
    setupBounty: "20,000 FCFA",
    annualRoyalty: "10,000 FCFA / year",
    popular: true,
    bestFor: "Standard secondary colleges, mission schools, established colleges",
  },
  {
    tier: "Large School",
    students: "751 to 1,500 students",
    schoolFee: "350,000 FCFA / year",
    setupBounty: "35,000 FCFA",
    annualRoyalty: "17,500 FCFA / year",
    bestFor: "Big boarding colleges, high-density city schools, large institutes",
  },
  {
    tier: "Very Large School",
    students: "More than 1,500 students",
    schoolFee: "500,000 FCFA / year",
    setupBounty: "50,000 FCFA",
    annualRoyalty: "25,000 FCFA / year",
    bestFor: "Large multi-stream campuses and massive private complexes",
  },
];

export default function AgentsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] text-[#142010] antialiased">
      <MarketingHeader currentPath="/agents" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "School Agent Program", path: "/agents" },
        ]}
      />

      <main className="flex-1">
        {/* ── Hero Section ──────────────────────────────────────────────────── */}
        <section className="pt-14 sm:pt-20 pb-14 sm:pb-20 border-b border-[#E8DFC9] bg-[#FFFDF5]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#FBE6C2] bg-[#FFF8CF] text-[11px] font-bold uppercase tracking-widest text-[#2A7C13]">
                <Sparkles className="w-3.5 h-3.5 text-[#2A7C13]" />
                <span>For Teachers &amp; School Staff</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#142010] leading-[1.14]">
                Make extra money by helping schools around you use Nsei Sukul.
              </h1>

              <p className="text-[15px] sm:text-[17px] text-[#525E4B] leading-relaxed max-w-2xl mx-auto">
                Help schools move away from stressful paper work and broken Excel sheets. Whenever a school you introduce pays for Nsei Sukul, you get <strong>10% sent straight to your MTN MoMo or Orange Money</strong>. Then every September when the school renews, you get another <strong>5%</strong> as long as you help them get started.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <a
                  href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20I%20am%20a%20teacher%20and%20I%20want%20to%20introduce%20my%20school."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-[14px] shadow-sm transition-all w-full sm:w-auto"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Talk with us on WhatsApp</span>
                </a>
                <a
                  href="#earnings-table"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[7px] bg-white hover:bg-[#FFF8CF]/30 text-[#142010] font-semibold text-[14px] border border-[#E8DFC9] transition-colors w-full sm:w-auto"
                >
                  <span>See How Much You Can Earn</span>
                  <ArrowRight className="w-4 h-4 text-[#2A7C13]" />
                </a>
              </div>

              <p className="text-[12px] text-[#788470] pt-1">
                You do not need any coding or computer science degree. Your money is paid within 48 hours after the school pays.
              </p>
            </div>
          </div>
        </section>

        {/* ── Why Teachers Do This Best ──────────────────────────────────────── */}
        <section className="py-14 sm:py-20 border-b border-[#E8DFC9] bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="max-w-2xl mb-12">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7E4] border border-[#76C457]/30 text-[#2A7C13] text-[11px] font-bold tracking-wider uppercase mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2A7C13]" />
                <span>Why You Are the Right Person</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010] tracking-tight">
                Principals listen to teachers, not software salespeople.
              </h2>
              <p className="text-[14px] text-[#525E4B] mt-2 leading-relaxed">
                Someone coming from outside does not know what goes on in a Cameroon staff room. You already know how tired teachers get during sequence exams, how marks get mixed up in Excel, and how stressful class councils can be.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">
                  1. You Know the Real Problems
                </h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  You have lived through late nights calculating student averages and arguing over lost mark sheets. When you show your Principal how this system prints clean report cards in minutes, they will listen because they trust your experience.
                </p>
              </div>

              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#FFF8CF] text-[#4A3D00] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">
                  2. You Know Other Teachers
                </h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Your former classmates, friends from university, and teachers at church teach in other schools. You can easily share your experience with them and help their schools get started too.
                </p>
              </div>

              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">
                  3. We Do the Heavy Technical Work
                </h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  You do not need to build software or fix server errors. Our team sets up the system, provides the offline box, and gives staff training. Your job is simply to make the connection and help teachers on ground.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Transparent Commission Table ───────────────────────────────────── */}
        <section id="earnings-table" className="py-16 sm:py-24 border-b border-[#E8DFC9] bg-[#FFFDF5]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7E4] border border-[#76C457]/30 text-[#2A7C13] text-[11px] font-bold tracking-wider uppercase">
                <Wallet className="w-3.5 h-3.5" />
                <span>Simple &amp; Clear Numbers</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#142010] tracking-tight">
                Exactly What You Earn per School
              </h2>
              <p className="text-[14px] sm:text-[15px] text-[#525E4B]">
                School pricing depends on how many students are enrolled. Your payment is clear, straightforward, and sent straight to your phone.
              </p>
            </div>

            {/* Pricing / Commission Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TIERS.map((tier) => (
                <div
                  key={tier.tier}
                  className={`rounded-[14px] p-6 border flex flex-col justify-between transition-all ${
                    tier.popular
                      ? "bg-white border-[#2A7C13] shadow-md ring-1 ring-[#2A7C13]"
                      : "bg-white border-[#E8DFC9] hover:border-[#2A7C13]/60 shadow-xs"
                  }`}
                >
                  <div className="space-y-4">
                    {tier.popular && (
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#2A7C13] text-white">
                        Most Common School Size
                      </span>
                    )}

                    <div>
                      <h3 className="font-extrabold text-[17px] text-[#142010]">
                        {tier.tier}
                      </h3>
                      <p className="text-[12px] font-semibold text-[#788470] mt-0.5">
                        {tier.students}
                      </p>
                      <p className="text-[11px] text-[#525E4B] mt-1 font-mono">
                        School fee: {tier.schoolFee}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#F0EBE0] space-y-3">
                      <div>
                        <span className="text-[11px] uppercase tracking-wide text-[#788470] font-bold block">
                          First Payment (10%)
                        </span>
                        <span className="text-2xl font-extrabold text-[#2A7C13] block">
                          {tier.setupBounty}
                        </span>
                        <span className="text-[11px] text-[#525E4B]">
                          Sent to your MoMo right after the school pays
                        </span>
                      </div>

                      <div className="pt-2 border-t border-dashed border-[#E8DFC9]">
                        <span className="text-[11px] uppercase tracking-wide text-[#788470] font-bold block">
                          Yearly Payment (5%)
                        </span>
                        <span className="text-xl font-bold text-[#142010] block">
                          {tier.annualRoyalty}
                        </span>
                        <span className="text-[11px] text-[#525E4B]">
                          Paid every September when the school renews
                        </span>
                      </div>
                    </div>

                    <p className="text-[11.5px] text-[#788470] pt-1">
                      {tier.bestFor}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-[#F0EBE0]">
                    <a
                      href={`https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20I%20have%20a%20school%20with%20${encodeURIComponent(
                        tier.students
                      )}%20that%20wants%20to%20learn%20more.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[6px] bg-[#EAF7E4] hover:bg-[#2A7C13] text-[#2A7C13] hover:text-white font-bold text-[12.5px] transition-colors"
                    >
                      <span>Introduce a School Like This</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Compounding Example in Everyday Language ───────────────────────── */}
        <section className="py-16 sm:py-22 border-b border-[#E8DFC9] bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column */}
              <div className="lg:col-span-6 space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7E4] border border-[#76C457]/30 text-[#2A7C13] text-[11px] font-bold tracking-wider uppercase">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>How the Money Adds Up</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#142010] tracking-tight leading-tight">
                  How bringing 3 or 4 schools gives you extra money every year.
                </h2>

                <p className="text-[14px] sm:text-[15px] text-[#525E4B] leading-relaxed">
                  With most side jobs like evening home lessons, if you stop teaching for one week, you do not get paid. But with this program, once a school is using the system and you keep helping them at the start of each year, you get paid every September when schools reopen.
                </p>

                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9]">
                    <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[13.5px] text-[#142010]">
                        Example 1: Just Your Own School (1 School)
                      </h4>
                      <p className="text-[12.5px] text-[#525E4B] mt-0.5">
                        Say your school has 500 students. When they join, you get <strong>20,000 FCFA</strong> sent to your MoMo. Next September when the school renews, you get another <strong>10,000 FCFA</strong> just for helping them start the new term.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-[#EAF7E4]/50 border border-[#76C457]/40">
                    <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[13.5px] text-[#142010]">
                        Example 2: Your School + 3 Neighboring Schools (4 Schools Total)
                      </h4>
                      <p className="text-[12.5px] text-[#525E4B] mt-0.5">
                        In your first year, you can make <strong>80,000 to 140,000 FCFA</strong> cash. Then every September when those schools reopen, you get <strong>40,000 to 70,000 FCFA</strong> sent straight to your phone right when you need money for back-to-school expenses.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Summary Card */}
              <div className="lg:col-span-6">
                <div className="rounded-[16px] border border-[#E8DFC9] bg-[#FFFDF5] p-7 sm:p-9 shadow-sm space-y-6">
                  <div className="border-b border-[#E8DFC9] pb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#788470]">
                      Simple 3-Year Example (4 Schools)
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#142010] mt-1">
                      Over 200,000 FCFA in Extra Income
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs sm:text-[13px]">
                    <div className="flex items-center justify-between p-3 rounded-[6px] bg-white border border-[#E8DFC9]">
                      <span className="font-medium text-[#525E4B]">Year 1 (When the 4 schools start):</span>
                      <span className="font-bold text-[#2A7C13]">+100,000 FCFA</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-[6px] bg-white border border-[#E8DFC9]">
                      <span className="font-medium text-[#525E4B]">Year 2 (September school reopening):</span>
                      <span className="font-bold text-[#142010]">+50,000 FCFA</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-[6px] bg-white border border-[#E8DFC9]">
                      <span className="font-medium text-[#525E4B]">Year 3 (September school reopening):</span>
                      <span className="font-bold text-[#142010]">+50,000 FCFA</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-[6px] bg-[#EAF7E4] border border-[#76C457]/50 font-bold text-[#142010]">
                      <span>Total Extra Cash Across 3 Years:</span>
                      <span className="text-[#2A7C13] text-base">200,000 to 280,000 FCFA</span>
                    </div>
                  </div>

                  <p className="text-[11.5px] text-[#788470] leading-relaxed">
                    You do not enter marks for other teachers. You are simply the trusted teacher in the school who introduced the system and calls us if the school needs anything.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Teacher Pitch Kit & Script ─────────────────────────────────────── */}
        <section id="pitch-kit" className="py-14 sm:py-20 border-b border-[#E8DFC9] bg-[#FAF6E9]">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7E4] text-[#2A7C13] text-xs font-bold">
                <Award className="w-3.5 h-3.5" />
                <span>Teacher Pitch Playbook</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010]">
                How to Introduce Nsei Sukul to Your Principal
              </h2>
              <p className="text-sm text-[#525E4B] leading-relaxed">
                Here is a simple, proven 4-step approach that has helped dozens of teachers convince their Principals
                and Vice Principals to adopt the system.
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

            {/* Common Principal Questions & Answers */}
            <div className="space-y-4 pt-4 border-t border-[#E8DFC9]">
              <div className="text-center max-w-xl mx-auto mb-6">
                <h3 className="text-lg font-bold text-[#142010]">
                  How to Answer Common Questions from Your Principal
                </h3>
                <p className="text-xs text-[#525E4B] mt-1">
                  Be ready when your school leadership asks these practical questions.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-white rounded-xl border border-[#E8DFC9] p-5 shadow-2xs">
                  <h4 className="text-sm font-bold text-[#142010] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#2A7C13] shrink-0" />
                    <span>"We already use Excel for marks. Why should we switch?"</span>
                  </h4>
                  <p className="mt-2 text-xs sm:text-[13px] text-[#525E4B] leading-relaxed">
                    Excel formulas break easily when teachers delete cells or copy formulas incorrectly. A virus or flash drive crash can wipe out weeks of marks.
                    With Nsei Sukul, calculations are 100% automated and protected. In addition, Excel cannot manage student photos, print student ID cards with barcodes, or track fee installments.
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-[#E8DFC9] p-5 shadow-2xs">
                  <h4 className="text-sm font-bold text-[#142010] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#2A7C13] shrink-0" />
                    <span>"Internet in our town is very weak and unreliable. Will this work for us?"</span>
                  </h4>
                  <p className="mt-2 text-xs sm:text-[13px] text-[#525E4B] leading-relaxed">
                    Yes. That is the exact reason Nsei Sukul was created. Our platform has an Offline School Hub. You connect a basic Wi-Fi router in the staffroom without an active internet subscription.
                    Teachers connect to that Wi-Fi network and enter marks smoothly. When internet is back, the system syncs in the background.
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-[#E8DFC9] p-5 shadow-2xs">
                  <h4 className="text-sm font-bold text-[#142010] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#2A7C13] shrink-0" />
                    <span>"Is it difficult for older teachers who are not very good with computers?"</span>
                  </h4>
                  <p className="mt-2 text-xs sm:text-[13px] text-[#525E4B] leading-relaxed">
                    Not at all. The marks entry screen looks identical to the traditional paper mark booklet teachers already use. If a teacher can type numbers on a phone keypad or send a WhatsApp message, they can use Nsei Sukul in less than 10 minutes.
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-[#E8DFC9] p-5 shadow-2xs">
                  <h4 className="text-sm font-bold text-[#142010] flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#2A7C13] shrink-0" />
                    <span>"How much will it cost our school?"</span>
                  </h4>
                  <p className="mt-2 text-xs sm:text-[13px] text-[#525E4B] leading-relaxed">
                    Pricing is flexible based on your school's total student enrollment. There is an unconditional 30-day free trial so the school only commits after seeing the system work with their real students.
                    Most schools save more money in printing paper, printer toner, and prevented fee leakages than the small software fee.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Honest Rules to Keep Everything Fair ──────────────────────────── */}
        <section className="py-14 sm:py-20 border-b border-[#E8DFC9] bg-[#FAF8F2]">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 space-y-6">
            <div className="flex items-center gap-2.5 text-[#B45309]">
              <ShieldCheck className="w-5 h-5 text-[#2A7C13]" />
              <h2 className="text-lg sm:text-xl font-extrabold text-[#142010] tracking-tight">
                Simple Rules to Protect Everyone and Keep Things Fair
              </h2>
            </div>

            <p className="text-[13px] text-[#525E4B] leading-relaxed">
              We want this partnership to be honest, simple, and respectful of schools and teachers. Here are the three clear rules we follow:
            </p>

            <div className="space-y-3.5 text-xs sm:text-[13px] text-[#333333]">
              {/* Rule 1 */}
              <div className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] space-y-1">
                <span className="font-bold text-[#142010] block">
                  1. You must be on ground to help the school
                </span>
                <p className="text-[#525E4B] leading-relaxed">
                  To receive the 5% payment every September, you need to actually be there helping the school start the year: making sure teachers know where to type their marks and helping the office if they have simple questions.
                </p>
              </div>

              {/* Rule 2 */}
              <div className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] space-y-1">
                <span className="font-bold text-[#142010] block">
                  2. What happens if you transfer or leave the school?
                </span>
                <p className="text-[#525E4B] leading-relaxed">
                  If you transfer to another town or stop helping the school, the 5% payment will go to the new teacher who takes over helping the school on ground. If nobody is helping the school and our team manages everything directly, the payment stays with the platform.
                </p>
              </div>

              {/* Rule 3 */}
              <div className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] space-y-1">
                <span className="font-bold text-[#142010] block">
                  3. Paid directly to your MoMo, no cash collection
                </span>
                <p className="text-[#525E4B] leading-relaxed">
                  All your money comes directly from us to your MTN MoMo or Orange Money number within 48 hours after the school pays. You are not allowed to collect school fees or cash directly from students or parents. The school pays us cleanly, and we pay you cleanly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final Call to Action ──────────────────────────────────────────── */}
        <section className="py-16 sm:py-20 bg-[#142010] text-white">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center space-y-5">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Want to get started? Let us chat.
            </h2>
            <p className="text-xs sm:text-[15px] text-[#B8C8B4] max-w-xl mx-auto leading-relaxed">
              Send us a message on WhatsApp. We will give you a demo, explain how to talk to your Principal, and answer any questions you have.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20I%20am%20interested%20in%20becoming%20a%20school%20agent."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-[14px] shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Message Us on WhatsApp</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
