import Link from "next/link";
import { 
  WifiOff, 
  Wifi, 
  Server, 
  Smartphone, 
  CheckCircle2, 
  ZapOff, 
  ShieldCheck, 
  ArrowRight, 
  MessageCircle, 
  Layers, 
  Cpu, 
  RefreshCw,
  Printer,
  Database
} from "lucide-react";
import { MarketingHeader } from "@/components/landing/MarketingHeader";
import { MarketingFooter } from "@/components/landing/MarketingFooter";

export const metadata = {
  title: "Offline Sukul Hub | Nsei Sukul Management System",
  description: "Run your school operations 100% offline without internet. Teachers sync marks over local school Wi-Fi even during internet blackouts and power cuts.",
};

export default function SchoolHubFeaturePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] text-[#142010] antialiased">
      <MarketingHeader currentPath="/features/school-hub" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-14 sm:pt-20 pb-16 border-b border-[#E8DFC9] bg-gradient-to-b from-[#FFF8CF]/30 via-transparent to-transparent">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#76C457]/40 bg-[#EAF7E4] text-[12px] font-bold text-[#2A7C13]">
                <WifiOff className="w-4 h-4" />
                <span>Zero-Internet Campus Infrastructure</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#142010] leading-[1.15]">
                Never let internet cuts or power outages paralyze your school.
              </h1>

              <p className="text-[15px] sm:text-[17px] text-[#525E4B] leading-relaxed max-w-2xl mx-auto">
                The <strong>Nsei Sukul Hub</strong> is a plug-and-play local server installed on your campus. Teachers enter marks and print official MINESEC report cards over local Wi-Fi, <strong>with or without internet access</strong>.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20I%20am%20interested%20in%20setting%20up%20the%20Sukul%20Hub%20for%20our%20campus."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-[14px] shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Request Campus Hub Setup (+237 682 833 601)</span>
                </a>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-[7px] bg-white hover:bg-[#FFF8CF]/40 text-[#142010] font-semibold text-[14px] border border-[#E8DFC9] transition-colors"
                >
                  Register School Online
                </Link>
              </div>

              <div className="pt-2 flex items-center justify-center gap-6 text-[12px] text-[#788470]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" /> Works without MTN / Orange data
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" /> Auto-syncs when online
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* The Reality Problem in Cameroon */}
        <section className="py-16 border-b border-[#E8DFC9] bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2A7C13] bg-[#EAF7E4] px-2.5 py-1 rounded-[4px]">
                Built for Cameroon
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010] mt-3">
                Why generic foreign school software fails in Cameroon
              </h2>
              <p className="text-[14px] text-[#525E4B] mt-2">
                Most cloud school platforms assume reliable 24/7 high-speed fiber internet and uninterrupted electric power. In Cameroon, reality is very different.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-[10px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#FFEBEB] text-[#D32F2F] flex items-center justify-center">
                  <WifiOff className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">Frequent Internet Cuts</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  When MTN or Orange network cuts out, or in areas with poor reception, schools get stuck with no internet for days, right when teachers need to enter sequence marks on time.
                </p>
              </div>

              <div className="p-6 rounded-[10px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#FFF8CF] text-[#856404] flex items-center justify-center">
                  <ZapOff className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">Unannounced Power Cuts (Eneo)</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Sudden power cuts disrupt office computers and modems. When the lights go off, ordinary systems crash, risking lost mark sheets and delayed report cards.
                </p>
              </div>

              <div className="p-6 rounded-[10px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">Teacher Data Bundle Costs</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Teachers shouldn't have to spend their own credit or data bundles to enter student marks. With the Sukul Hub, teachers enter marks freely over the local school Wi-Fi at zero data cost.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How the School Hub Works (Interactive Workflow) */}
        <section id="how-it-works" className="py-16 sm:py-20 border-b border-[#E8DFC9] bg-[#FFFDF5]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2A7C13] bg-[#EAF7E4] px-2.5 py-1 rounded-[4px]">
                Simple 3-Step Process
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010] mt-3">
                How the Offline Sukul Hub Works
              </h2>
              <p className="text-[14px] text-[#525E4B] mt-2">
                A seamless 3-stage local-first workflow designed so school operations never stop.
              </p>
            </div>

            {/* Workflow steps cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="bg-white p-7 rounded-[12px] border border-[#E8DFC9] shadow-xs relative space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#2A7C13] text-white font-extrabold text-sm flex items-center justify-center">
                  1
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#2A7C13]" />
                    <h3 className="font-bold text-[16px] text-[#142010]">Teacher Enters Marks Anywhere</h3>
                  </div>
                  <p className="text-[13px] text-[#525E4B] leading-relaxed">
                    Teachers input marks on their laptop or phone browser at home or in the staff room. Marks are saved safely right on the teacher&apos;s phone.
                  </p>
                </div>
                <div className="p-3 bg-[#FFFDF5] rounded-[6px] border border-[#E8DFC9] text-[11px] text-[#788470]">
                  <strong>Works 100% offline:</strong> No active internet connection or data bundles required on the phone.
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-7 rounded-[12px] border-2 border-[#2A7C13] shadow-md relative space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#2A7C13] text-white font-extrabold text-sm flex items-center justify-center">
                  2
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-[#2A7C13]" />
                    <h3 className="font-bold text-[16px] text-[#142010]">Automatic Local Wi-Fi Sync</h3>
                  </div>
                  <p className="text-[13px] text-[#525E4B] leading-relaxed">
                    The teacher arrives on campus and connects to the school Wi-Fi. Even if the modem has <strong>NO internet connection</strong>, their phone talks directly to the school box.
                  </p>
                </div>
                <div className="p-3 bg-[#EAF7E4] rounded-[6px] border border-[#76C457]/40 text-[11px] text-[#2A7C13] font-medium">
                  <strong>Zero data cost:</strong> Pushes marks to the office box over school Wi-Fi in under 2 seconds.
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-7 rounded-[12px] border border-[#E8DFC9] shadow-xs relative space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#2A7C13] text-white font-extrabold text-sm flex items-center justify-center">
                  3
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#2A7C13]" />
                    <h3 className="font-bold text-[16px] text-[#142010]">Background Cloud Backup</h3>
                  </div>
                  <p className="text-[13px] text-[#525E4B] leading-relaxed">
                    Whenever internet becomes available (even if the principal turns on a mobile hotspot for just 5 minutes), the Hub silently backs up school records to the cloud.
                  </p>
                </div>
                <div className="p-3 bg-[#FFFDF5] rounded-[6px] border border-[#E8DFC9] text-[11px] text-[#788470]">
                  <strong>Double protection:</strong> One copy stays safely in your school box, and a secure backup is stored in the cloud.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Practical Installation Guide for School Owners ──────────────── */}
        <section id="installation" className="py-16 sm:py-24 border-b border-[#E8DFC9] bg-[#FFFDF5]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2A7C13] bg-[#EAF7E4] px-2.5 py-1 rounded-[4px]">
                Simple Campus Setup
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#142010]">
                Two Simple Ways to Set Up in Your School
              </h2>
              <p className="text-[14px] sm:text-[16px] text-[#525E4B] leading-relaxed">
                You do <strong>not</strong> need to buy proprietary hardware from us. You have full freedom to use computers you already own or buy affordable equipment from local markets.
              </p>
            </div>

            {/* Two Pathways: Existing PC vs Buying Equipment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-14">
              {/* Path 1: Existing PC */}
              <div className="bg-white rounded-[14px] border-2 border-[#2A7C13] p-7 sm:p-8 shadow-sm flex flex-col justify-between relative">
                <div className="absolute -top-3.5 left-6 bg-[#2A7C13] text-white text-[11px] font-extrabold uppercase tracking-wide px-3 py-0.5 rounded-full">
                  Fastest &amp; Most Affordable (0 FCFA)
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-10 h-10 rounded-[8px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center font-bold text-lg">
                      1
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[18px] text-[#142010]">Use an Existing School Computer</h3>
                      <p className="text-[12px] text-[#788470]">Desktop or Laptop in Principal&apos;s or Bursar&apos;s Office</p>
                    </div>
                  </div>

                  <p className="text-[13.5px] text-[#525E4B] leading-relaxed">
                    If your school already has a computer running Windows 10 or 11, you can turn it into your School Hub in under 5 minutes without spending an extra franc on hardware.
                  </p>

                  <div className="space-y-2.5 pt-2 text-[12.5px]">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                      <span><strong>Works on standard PCs:</strong> Minimum 4GB RAM and 20GB free space.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                      <span><strong>Office work uninterrupted:</strong> You can continue typing Word letters, printing, or using Excel on the PC while the Hub runs in the background.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                      <span><strong>Laptops have built-in battery:</strong> If using a laptop, its battery keeps the server running automatically during power cuts.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#E8DFC9] flex items-center justify-between">
                  <span className="text-[12px] text-[#788470]">Extra hardware cost: <strong className="text-[#2A7C13]">0 FCFA</strong></span>
                  <span className="text-[11px] font-bold px-2 py-1 rounded bg-[#EAF7E4] text-[#2A7C13]">Ready in 5 Mins</span>
                </div>
              </div>

              {/* Path 2: Buying Equipment Yourself */}
              <div className="bg-white rounded-[14px] border border-[#E8DFC9] p-7 sm:p-8 shadow-sm flex flex-col justify-between relative">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] bg-[#FFF8CF] text-[#4A3D00] flex items-center justify-center font-bold text-lg">
                      2
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[18px] text-[#142010]">Buy Your Own Equipment Locally</h3>
                      <p className="text-[12px] text-[#788470]">Buy from computer shops in Douala, Yaoundé, or Bamenda</p>
                    </div>
                  </div>

                  <p className="text-[13.5px] text-[#525E4B] leading-relaxed">
                    Prefer to have a dedicated machine that stays on 24/7? You can buy affordable equipment yourself from reputable computer vendors in Cameroon.
                  </p>

                  <div className="space-y-2.5 pt-2 text-[12.5px]">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                      <span><strong>A Mini-PC or Refurbished Laptop:</strong> Ask for an Intel N100 Mini-PC or Core i3/i5 laptop (~110,000 – 150,000 FCFA).</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                      <span><strong>A Regular Wi-Fi Router:</strong> Standard TP-Link or Tenda router (~18,000 – 25,000 FCFA). <em>No internet subscription needed!</em></span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#2A7C13] shrink-0 mt-0.5" />
                      <span><strong>A Small UPS Battery Backup:</strong> Protects against power cuts and surges (~25,000 FCFA).</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#E8DFC9] flex items-center justify-between">
                  <span className="text-[12px] text-[#788470]">Estimated shopping cost: <strong className="text-[#142010]">~160,000 FCFA</strong></span>
                  <span className="text-[11px] font-bold px-2 py-1 rounded bg-[#FFF8CF] text-[#4A3D00]">Lasts 5+ Years</span>
                </div>
              </div>
            </div>

            {/* Visual Setup: What It Looks Like on Your Desk */}
            <div className="rounded-[14px] border border-[#E8DFC9] bg-white p-6 sm:p-8 space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-1 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">Physical Setup</span>
                <h3 className="font-extrabold text-[18px] text-[#142010]">What the Setup Looks Like in Your Office</h3>
                <p className="text-[12.5px] text-[#525E4B]">
                  No technical cables or complicated wiring. Three everyday items plugged together on a desk.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                {/* Item 1 */}
                <div className="p-4 rounded-[10px] bg-[#FFFDF5] border border-[#E8DFC9] space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="font-bold text-[13px] text-[#142010]">The Computer</h4>
                  <p className="text-[11.5px] text-[#788470] leading-snug">
                    Your existing laptop, desktop, or Mini-PC sitting on the Principal&apos;s or Bursar&apos;s desk.
                  </p>
                </div>

                {/* Item 2 */}
                <div className="p-4 rounded-[10px] bg-[#FFFDF5] border border-[#E8DFC9] space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="font-bold text-[13px] text-[#142010]">Yellow Network Cable</h4>
                  <p className="text-[11.5px] text-[#788470] leading-snug">
                    A simple 2-meter Ethernet cord connecting the computer directly into the Wi-Fi router.
                  </p>
                </div>

                {/* Item 3 */}
                <div className="p-4 rounded-[10px] bg-[#FFFDF5] border border-[#E8DFC9] space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center font-bold">
                    3
                  </div>
                  <h4 className="font-bold text-[13px] text-[#142010]">Wi-Fi Router</h4>
                  <p className="text-[11.5px] text-[#788470] leading-snug">
                    Broadcasts the school staff Wi-Fi. Does <strong>not</strong> need an internet SIM card or data bundle.
                  </p>
                </div>

                {/* Item 4 */}
                <div className="p-4 rounded-[10px] bg-[#FFFDF5] border border-[#E8DFC9] space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center font-bold">
                    4
                  </div>
                  <h4 className="font-bold text-[13px] text-[#142010]">Teacher Phones</h4>
                  <p className="text-[11.5px] text-[#788470] leading-snug">
                    Teachers connect to the Wi-Fi on their phones or laptops and type marks with zero data cost.
                  </p>
                </div>
              </div>

              {/* Step By Step Instructions in 4 bullet points */}
              <div className="pt-4 border-t border-[#E8DFC9] bg-[#FFFDF5] p-5 rounded-[8px]">
                <h4 className="font-bold text-[13px] text-[#142010] mb-3 flex items-center gap-2">
                  <span>How Staff Access It Daily (4 Simple Steps):</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px] text-[#525E4B]">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-[#2A7C13]">Step 1:</span>
                    <span>Turn on the computer in the morning and double-click <strong>start-school-hub</strong> (or let it start automatically).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-[#2A7C13]">Step 2:</span>
                    <span>Check your computer&apos;s local address (e.g., <code>192.168.1.100:3000</code>).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-[#2A7C13]">Step 3:</span>
                    <span>Teachers connect to the school Wi-Fi and open that address on their phone browser.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-[#2A7C13]">Step 4:</span>
                    <span>Marks are saved directly into the school computer with 0 FCFA airtime spent.</span>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <a
                  href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20we%20would%20like%20guidance%20on%20setting%20up%20the%20School%20Hub%20on%20our%20school%20computer."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[13px] font-bold text-[#2A7C13] hover:text-[#20600E] underline"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Need help setting up on your computer? Chat with our team on WhatsApp (+237 682 833 601)</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Plain-Language Capabilities & What You Get ──────────────────── */}
        <section className="py-16 border-b border-[#E8DFC9] bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2A7C13] bg-[#EAF7E4] px-2.5 py-1 rounded-[4px]">
                  Campus Hardware
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010] leading-tight">
                  A small, silent box that keeps your whole school running
                </h2>
                <p className="text-[14px] text-[#525E4B] leading-relaxed">
                  The Nsei Sukul Hub is a compact device installed directly in your administration office. It replaces noisy, complicated server rooms with a small, durable device built to withstand dusty chalkboards, heat, and unpredictable Cameroonian electricity.
                </p>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-[14px] text-[#142010]">Runs on Very Low Electricity</h4>
                      <p className="text-[12.5px] text-[#525E4B] leading-relaxed">
                        Uses less power than a single light bulb. During power cuts (load shedding), it easily keeps running for up to 8 hours on a small office mini-UPS or solar inverter battery.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-[14px] text-[#142010]">Safe From Sudden Blackouts</h4>
                      <p className="text-[12.5px] text-[#525E4B] leading-relaxed">
                        If electricity cuts abruptly while teachers are entering marks, zero data is lost. The system saves every mark entry immediately and turns back on safely without losing anything.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-[14px] text-[#142010]">Fast Printing Without Internet</h4>
                      <p className="text-[12.5px] text-[#525E4B] leading-relaxed">
                        Send hundreds of official report cards directly to your office printer in seconds. You never have to wait for internet to load or struggle with heavy PDF downloads.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-full bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-bold text-[14px] text-[#142010]">Completely Private &amp; Secure</h4>
                      <p className="text-[12.5px] text-[#525E4B] leading-relaxed">
                        All student marks, exam results, and fee records remain physically locked inside your school. Only authorized teachers and administrators with their password can access them.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Practical Box */}
              <div className="rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] p-7 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Server className="w-5 h-5 text-[#2A7C13]" />
                    <span className="font-extrabold text-[15px] text-[#142010]">What You Get With The Hub</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2A7C13] text-white">
                    PLUG &amp; PLAY
                  </span>
                </div>

                <div className="space-y-3 text-[13px]">
                  <div className="flex justify-between py-2 border-b border-[#E8DFC9]/60">
                    <span className="text-[#788470]">Physical Size:</span>
                    <span className="font-semibold text-[#142010]">Compact box (fits neatly on a desk)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E8DFC9]/60">
                    <span className="text-[#788470]">Installation:</span>
                    <span className="font-semibold text-[#142010]">Delivered &amp; installed by our team</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E8DFC9]/60">
                    <span className="text-[#788470]">Wi-Fi Connection:</span>
                    <span className="font-semibold text-[#142010]">Works with your existing school Wi-Fi</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E8DFC9]/60">
                    <span className="text-[#788470]">Staff Capacity:</span>
                    <span className="font-semibold text-[#2A7C13]">All teachers can connect at the same time</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E8DFC9]/60">
                    <span className="text-[#788470]">Record Storage:</span>
                    <span className="font-semibold text-[#142010]">10+ years of complete school records</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#788470]">Computer Skills Required:</span>
                    <span className="font-semibold text-[#2A7C13]">None: Turn it on and it works</span>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20please%20send%20us%20pricing%20and%20installation%20details%20for%20the%20Sukul%20Hub."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-[7px] bg-[#142010] hover:bg-[#1e3318] text-white font-bold text-[13px] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-[#76C457]" />
                    <span>Inquire About School Installation on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 bg-[#142010] text-white">
          <div className="max-w-4xl mx-auto px-5 text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to free your school from internet dependency?
            </h2>
            <p className="text-[#A6B8A0] text-[15px] max-w-xl mx-auto">
              Our engineering team deploys and configures the Sukul Hub directly on your campus, conducts in-person teacher training, and sets up your local Wi-Fi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a
                href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul,%20we%20want%20to%20schedule%20a%20Sukul%20Hub%20on-site%20demonstration%20at%20our%20institution."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[7px] bg-[#76C457] hover:bg-[#68B349] text-[#0E1A09] font-bold text-[14px] transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with our Cameroon Engineering Team (+237 682 833 601)</span>
              </a>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-[7px] bg-white/10 hover:bg-white/20 text-white font-semibold text-[14px] border border-white/20 transition-all"
              >
                <span>Register Your School</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
