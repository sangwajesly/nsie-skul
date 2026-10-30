import Link from "next/link";
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  Printer, 
  Award, 
  Layers, 
  UserCheck, 
  ArrowRight, 
  MessageCircle,
  FileCheck,
  Calculator,
  SlidersHorizontal,
  Image as ImageIcon,
  Eye,
} from "lucide-react";
import { MarketingHeader } from "@/components/landing/MarketingHeader";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { ReportCardShowcaseClient } from "./ReportCardShowcaseClient";

export const metadata = {
  title: "MINESEC Report Cards & Exam Sequences | Nsei Sukul Managements System",
  description: "Official Cameroon MINESEC report cards with 6 sequences, 20-point scale, automated coefficients, class rankings, and single-line compact print layouts.",
};

export default function ReportCardsFeaturePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] text-[#142010] antialiased">
      <MarketingHeader currentPath="/features/report-cards" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-14 sm:pt-20 pb-16 border-b border-[#E8DFC9] bg-gradient-to-b from-[#FFF8CF]/30 via-transparent to-transparent">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#76C457]/40 bg-[#EAF7E4] text-[12px] font-bold text-[#2A7C13]">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Cameroon Secondary Education Standard</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#142010] leading-[1.15]">
                Generate 500+ official MINESEC report cards in under 3 minutes.
              </h1>

              <p className="text-[15px] sm:text-[17px] text-[#525E4B] leading-relaxed max-w-2xl mx-auto">
                No more calculator errors or midnight spreadsheet marathons. Automated 20-point grading, sequence calculations, class ranks, and <strong>guaranteed 1-page A4 print layouts</strong>.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-[14px] shadow-sm transition-all"
                >
                  <span>Start Free Trial For Your School</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#interactive-samples"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[7px] bg-white hover:bg-[#FFF8CF]/40 text-[#142010] font-semibold text-[14px] border border-[#E8DFC9] transition-colors"
                >
                  <Eye className="w-4 h-4 text-[#2A7C13]" />
                  <span>Explore Interactive Sample Templates</span>
                </a>
              </div>

              <div className="pt-2 flex items-center justify-center gap-6 text-[12px] text-[#788470]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" /> 6 Sequences & 3 Terms
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" /> Auto-rank & Class Statistics
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" /> Zero Split Pages
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 sm:py-20 border-b border-[#E8DFC9] bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2A7C13] bg-[#EAF7E4] px-2.5 py-1 rounded-[4px]">
                Built for All Secondary Schools &amp; Colleges
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010] mt-3">
                Everything required by MINESEC Inspectors
              </h2>
              <p className="text-[14px] text-[#525E4B] mt-2">
                Designed precisely according to the Ministry of Secondary Education evaluation circulars and general education guidelines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {/* Card 1 */}
              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">Exact Cameroon 20-Point Grading</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Automatic computation of weighted marks (`Mark × Coef`), student sequence total, student average (`Total Marks / Total Coef`), class highest, lowest, and general class average.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#FFF8CF] text-[#4A3D00] flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">Strict Class Subject Assignment</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Only subjects officially assigned to that specific class stream appear on report cards. No cluttered unassigned subjects or zero-coefficient errors.
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">1-Page A4 Printing Guarantee</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Compact single-line footer design with class master remarks, principal approval stamps, and grading scales formatted to fit on a single crisp A4 sheet without spilling onto page 2.
                </p>
              </div>

              {/* Card 4 */}
              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#FBE6C2] text-[#422C0A] flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">Exact Birth Certificate Names</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  First name and other names display clearly and accurately, exactly as written on the student&apos;s official birth certificate.
                </p>
              </div>

              {/* Card 5 */}
              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">Optional Student Passport Photo</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Photographs are strictly optional. Uploaded images are automatically optimized down to ~20KB client-side for rapid printing and low bandwidth consumption.
                </p>
              </div>

              {/* Card 6 */}
              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#FFF8CF] text-[#4A3D00] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">3 Distinct Layout Templates</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Choose between the Official MINESEC Competency format, Classic Secondary layout, or Grouped Subject Clusters (Science / Arts / Commercial / Technical).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Live Preview Showcase */}
        <section className="py-16 sm:py-20 border-b border-[#E8DFC9] bg-[#FFFDF5]">
          <div className="max-w-5xl mx-auto px-5 sm:px-8">
            <ReportCardShowcaseClient />
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-[#142010] text-white">
          <div className="max-w-4xl mx-auto px-5 text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to automate your report cards this term?
            </h2>
            <p className="text-[#A6B8A0] text-[15px] max-w-xl mx-auto">
              Join leading secondary schools and colleges across Cameroon using Nsei Sukul to produce error-free terminal results.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[7px] bg-[#76C457] hover:bg-[#68B349] text-[#0E1A09] font-bold text-[14px] transition-all"
              >
                <span>Register Your School Today</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul,%20we%20want%20to%20see%20a%20live%20demo%20of%20the%20report%20card%20generator."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-[7px] bg-white/10 hover:bg-white/20 text-white font-semibold text-[14px] border border-white/20 transition-all"
              >
                <MessageCircle className="w-4 h-4 text-[#76C457]" />
                <span>Schedule WhatsApp Walkthrough</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
