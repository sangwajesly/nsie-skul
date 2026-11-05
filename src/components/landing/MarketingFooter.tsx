import Link from "next/link";
import { GraduationCap, MessageCircle, ShieldCheck, Wifi, MapPin, Award, FileSpreadsheet, Wallet } from "lucide-react";
import { BRAND } from "@/lib/design-tokens";

export function MarketingFooter() {
  return (
    <footer className="bg-[#0F1A0E] text-[#9EB594] border-t border-[#23351E] pt-16 pb-12 text-[13px] selection:bg-[#2A7C13] selection:text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-[#23351E]">
          {/* Brand & Identity Column (5 cols on md) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[7px] bg-[#2A7C13] text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-[17px] text-white tracking-tight leading-none">
                  {BRAND.name}
                </span>
                <span className="text-[10px] font-semibold text-[#7FA776] tracking-wide uppercase mt-1">
                  {BRAND.systemTitle}
                </span>
              </div>
            </div>

            <p className="text-[12.5px] text-[#A3BCA0] leading-relaxed max-w-sm">
              Hybrid Cloud and Local Offline School Management Platform engineered specifically for secondary schools, high schools, and colleges across Cameroon.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#84E466] bg-[#172B15] border border-[#2B4E24] px-2.5 py-1 rounded-[5px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Cameroon Law No. 2024/017 Compliant</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#CBE7C6] bg-[#172B15] border border-[#2B4E24] px-2.5 py-1 rounded-[5px]">
                <Award className="w-3.5 h-3.5 text-[#84E466]" />
                <span>Bilingual System Standard</span>
              </div>
            </div>
          </div>

          {/* Features & Hub Column (2 cols on md) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-bold text-[11.5px] text-white uppercase tracking-wider">
              System Modules
            </h4>
            <ul className="space-y-2 text-[12.5px]">
              <li>
                <Link href="/features/school-hub" className="hover:text-white transition-colors flex items-center gap-1.5 group">
                  <Wifi className="w-3 h-3 text-[#84E466]" />
                  <span>Offline School Hub</span>
                </Link>
              </li>
              <li>
                <Link href="/features/report-cards" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3 h-3 text-[#84E466]" />
                  <span>Term Report Cards</span>
                </Link>
              </li>
              <li>
                <Link href="/features/finance" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Wallet className="w-3 h-3 text-[#84E466]" />
                  <span>Bursary &amp; Fees (FCFA)</span>
                </Link>
              </li>
              <li>
                <Link href="/features/school-hub#installation" className="hover:text-white transition-colors">
                  Local Server Setup Guide
                </Link>
              </li>
              <li>
                <Link href="/dashboard/students" className="hover:text-white transition-colors">
                  Student ID &amp; Matricules
                </Link>
              </li>
              <li>
                <Link href="/dashboard/academics" className="hover:text-white transition-colors">
                  Curriculum &amp; Coefs
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Access Column (2 cols on md) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-bold text-[11.5px] text-white uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2 text-[12.5px]">
              <li>
                <Link href="/blog" className="text-white hover:text-[#84E466] font-medium transition-colors">
                  Pedagogy &amp; Guides
                </Link>
              </li>
              <li>
                <Link href="/agents" className="text-[#84E466] hover:text-white font-semibold transition-colors flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#84E466]" />
                  <span>School Agent Program</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  School Portal Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Register Institution
                </Link>
              </li>
              <li>
                <Link href="/#capabilities" className="hover:text-white transition-colors">
                  System Capabilities
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  School Admin FAQs
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Licensing
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Hotline Column (3 cols on md) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-bold text-[11.5px] text-white uppercase tracking-wider">
              Institutional Hotline
            </h4>
            <div className="space-y-3">
              <a
                href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20I%20would%20like%20to%20request%20a%20school%20demonstration%20or%20inquire%20about%20the%20platform."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-[8px] bg-[#162A14] border border-[#294B22] hover:border-[#84E466] text-white transition-all group"
              >
                <div className="w-8 h-8 rounded-[6px] bg-[#2A7C13] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[13px] text-[#84E466] block leading-tight">
                    +237 682 833 601
                  </span>
                  <span className="text-[10.5px] text-[#A3BCA0]">
                    Direct WhatsApp Concierge
                  </span>
                </div>
              </a>

              <p className="text-[#86A382] text-[11.5px] leading-relaxed flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-[#84E466] shrink-0" />
                <span>Republic of Cameroon · Northwest, Southwest, Centre, and Littoral campus deployments</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11.5px] text-[#789674]">
          <div>
            &copy; {new Date().getFullYear()} Nsei Sukul. Educational Management Infrastructure.
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link href="/terms" className="hover:text-white transition-colors underline">Terms</Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:text-white transition-colors underline">Privacy</Link>
            <span>&bull;</span>
            <span className="text-[#A3BCA0] font-medium">Cameroon Secondary Curriculum Standard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
