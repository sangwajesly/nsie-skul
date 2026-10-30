import Link from "next/link";
import { GraduationCap, MessageCircle, ShieldCheck, Wifi, MapPin } from "lucide-react";
import { BRAND } from "@/lib/design-tokens";

export function MarketingFooter() {
  return (
    <footer className="bg-white border-t border-[#E8DFC9] pt-14 pb-10 text-[13px] text-[#525E4B]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#E8DFC9]">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[6px] bg-[#2A7C13] text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-[16px] text-[#142010]">
                {BRAND.name}
              </span>
            </div>
            <p className="text-[12px] text-[#788470] leading-relaxed">
              Hybrid Cloud & Offline School Management System engineered specifically for Cameroonian Secondary Schools and Colleges.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#2A7C13] font-semibold bg-[#EAF7E4] px-2.5 py-1 rounded-[5px] w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cameroon Law No. 2024/017 Compliant</span>
            </div>
          </div>

          {/* Col 2: Features & Products */}
          <div className="space-y-3">
            <h4 className="font-bold text-[13px] text-[#142010] uppercase tracking-wider text-[11px]">
              Features & Hub
            </h4>
            <ul className="space-y-2 text-[12.5px]">
              <li>
                <Link href="/features/school-hub" className="hover:text-[#2A7C13] transition-colors flex items-center gap-1.5">
                  <Wifi className="w-3 h-3 text-[#2A7C13]" />
                  <span>Offline School Hub</span>
                </Link>
              </li>
              <li>
                <Link href="/features/school-hub#installation" className="hover:text-[#2A7C13] transition-colors">
                  Hardware &amp; Setup Guide
                </Link>
              </li>
              <li>
                <Link href="/features/report-cards" className="hover:text-[#2A7C13] transition-colors">
                  MINESEC Terminal Report Cards
                </Link>
              </li>
              <li>
                <Link href="/features/finance" className="hover:text-[#2A7C13] transition-colors">
                  Bursary & Fee Management (FCFA)
                </Link>
              </li>
              <li>
                <Link href="/dashboard/students" className="hover:text-[#2A7C13] transition-colors">
                  Student Dossiers & Multi-Name
                </Link>
              </li>
              <li>
                <Link href="/dashboard/academics" className="hover:text-[#2A7C13] transition-colors">
                  Subject Teacher Allocation
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Portal & Support */}
          <div className="space-y-3">
            <h4 className="font-bold text-[13px] text-[#142010] uppercase tracking-wider text-[11px]">
              Platform Access
            </h4>
            <ul className="space-y-2 text-[12.5px]">
              <li>
                <Link href="/blog" className="hover:text-[#2A7C13] transition-colors font-medium text-[#142010]">
                  Teacher Guides &amp; Pedagogy Blog
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#2A7C13] transition-colors font-medium text-[#142010]">
                  School Portal Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#2A7C13] transition-colors">
                  Register Your Institution
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-[#2A7C13] transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#2A7C13] transition-colors">
                  Terms of Service & Licensing
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#2A7C13] transition-colors">
                  Data Privacy & ANTIC Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Cameroon Support & Hotline */}
          <div className="space-y-3">
            <h4 className="font-bold text-[13px] text-[#142010] uppercase tracking-wider text-[11px]">
              Contact & Demonstrations
            </h4>
            <div className="space-y-2.5 text-[12px]">
              <a
                href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20I%20would%20like%20to%20request%20a%20school%20demonstration%20or%20inquire%20about%20the%20School%20Hub."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2.5 rounded-[7px] bg-[#EAF7E4] border border-[#76C457]/40 text-[#142010] hover:border-[#2A7C13] transition-all group"
              >
                <MessageCircle className="w-4 h-4 text-[#2A7C13] group-hover:scale-110 transition-transform shrink-0" />
                <div>
                  <span className="font-bold text-[#2A7C13] block">+237 682 833 601</span>
                  <span className="text-[10px] text-[#788470]">WhatsApp Hotline & Demos</span>
                </div>
              </a>

              <p className="text-[#788470] text-[11.5px] leading-relaxed flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-[#2A7C13] shrink-0" />
                <span>Republic of Cameroon · Northwest, Southwest, Centre & Littoral campus deployments</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11.5px] text-[#788470]">
          <div>
            © {new Date().getFullYear()} Nsei Sukul Management System. All rights reserved.
          </div>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="hover:text-[#142010] transition-colors underline">Terms of Service</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#142010] transition-colors underline">Privacy Policy</Link>
            <span>•</span>
            <span className="text-[#142010] font-medium">Cameroon Official MINESEC Format</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
