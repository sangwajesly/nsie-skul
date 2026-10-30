import Link from "next/link";
import { GraduationCap, ArrowLeft, ShieldCheck, FileText, Phone, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Terms of Service · Nsei Sukul Managements System",
  description: "Official terms and conditions of use for secondary schools across Cameroon.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#191919]">
      {/* Top Navbar */}
      <header className="border-b border-[#E8DFC9] bg-white sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/login" className="inline-flex items-center gap-2.5 text-[#142010]">
            <div className="w-9 h-9 rounded-[8px] bg-[#142010] text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight block">Nsei Sukul</span>
              <span className="text-[10px] text-[#777777] block -mt-0.5">Managements System</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="text-xs font-semibold text-[#555555] hover:text-[#191919] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Title Box */}
        <div className="border-b border-[#E8DFC9] pb-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-[#F7F3E8] text-[#555555] border border-[#E8DFC9]">
            <FileText className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>Official Institutional Terms · Republic of Cameroon</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#142010] tracking-tight">
            Terms of Service (Conditions Générales d&apos;Utilisation)
          </h1>
          <p className="text-xs sm:text-sm text-[#666666]">
            Applicable to Subscribing Secondary Schools, Lycées, Colleges, School Hub Nodes, and Users.
            <br />
            Compliant with Cameroon Law No. 2024/017, Law No. 2010/012, and MINESEC regulations.
          </p>
        </div>

        {/* Content Sections */}
        <div className="bg-white border border-[#E8DFC9] rounded-[10px] p-6 sm:p-8 space-y-6 text-[13px] leading-relaxed text-[#333333] shadow-xs">
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#142010] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#142010] text-white text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <span>Acceptance &amp; Institutional Representation</span>
            </h2>
            <p>
              By accessing, registering an educational establishment, deploying an on-premises School Hub local server, or inputting continuous assessment evaluation marks onto the <strong>Nsei Sukul Managements System</strong>, the subscribing Institution warrants that the person executing registration possesses valid administrative authority (such as the Principal, Headmaster, Proprietor, or authorized PTA representative).
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#142010] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#142010] text-white text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <span>Scope of Software License</span>
            </h2>
            <p>
              Nsei Sukul grants the Institution a non-exclusive, non-transferable, revocable annual or termly license to deploy the software strictly for official school administration, student register management, marks entry, ministerial report card compilation, and fee receipting. Commercial resale, reverse engineering, unauthorized API scraping, or sublicensing is strictly prohibited.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#142010] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#142010] text-white text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <span>School Hub Local Node &amp; Physical Custody</span>
            </h2>
            <p>
              The platform operates on a hybrid architecture combining an on-premises local School Hub appliance and secure cloud synchronization:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#555555]">
              <li>The Institution is solely responsible for the physical custody, electrical surge protection, and security of the physical computer hardware hosting the School Hub on school premises.</li>
              <li>Local school Wi-Fi router passwords must be kept confidential by the school administration and changed from default factory settings immediately upon setup.</li>
              <li>The School assumes responsibility for maintaining physical encrypted USB backup archives kept in administrative safes for local disaster recovery.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#142010] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#142010] text-white text-[11px] font-bold flex items-center justify-center">
                4
              </span>
              <span>Integrity of Academic Evaluation Marks &amp; Fraud Prevention</span>
            </h2>
            <p>
              In accordance with Cameroonian penal provisions and MINESEC regulations, all assessment marks entered onto the platform must genuinely reflect the academic performance of students. Nsei Sukul maintains permanent cryptographic audit logs capturing user IDs, timestamps, and marks alteration history. Deliberate grade falsification constitutes criminal academic fraud punishable under the Cameroonian Penal Code (<em>Faux et usage de faux</em>).
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#142010] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#142010] text-white text-[11px] font-bold flex items-center justify-center">
                5
              </span>
              <span>Subscription Fees, Pilot Trial &amp; Mobile Money Payments</span>
            </h2>
            <p>
              Institutional licensing fees are determined per academic term or full academic year:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#555555]">
              <li><strong>Complimentary Pilot Trial</strong>: New schools may evaluate marks entry and feature workflows for up to 3 class groups. Institution-wide bulk printing and official ministerial exports require an active license.</li>
              <li><strong>Official Payment Channels</strong>: Mobile Money subscriptions are processed via official registered merchant channels (MTN Mobile Money: <strong>+237 682 833 601</strong>, Account Name: Mbongih Jesly Sangwa) quoting the school&apos;s registered code.</li>
              <li><strong>14-Day Exam Period Grace Period</strong>: In the event of pending renewal at term end, an automatic 14-day administrative grace period ensures ongoing examination and report card generation is never abruptly blocked.</li>
              <li><strong>No Data Lockout</strong>: Student records will never be deleted or held hostage due to subscription delays. The school always retains CSV/PDF export rights.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#142010] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#142010] text-white text-[11px] font-bold flex items-center justify-center">
                6
              </span>
              <span>Ownership of Educational Data</span>
            </h2>
            <p>
              The subscribing Institution retains <strong>100% exclusive ownership</strong> of all student names, birth registers, evaluation scores, attendance notes, and guardian records. Nsei Sukul claims zero ownership over institutional educational data. Nsei Sukul retains exclusive intellectual property rights to the platform source code, database architectures, user interfaces, and report card generation algorithms.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#142010] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#142010] text-white text-[11px] font-bold flex items-center justify-center">
                7
              </span>
              <span>Governing Law &amp; Jurisdiction</span>
            </h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of the <strong>Republic of Cameroon</strong>. Any disputes arising in connection with these terms that cannot be resolved amicably shall fall under the exclusive jurisdiction of the competent courts of Cameroon.
            </p>
          </section>
        </div>

        {/* Support & Contact Card */}
        <div className="p-5 rounded-[8px] bg-[#FAF8F5] border border-[#E8DFC9] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-bold text-[#142010] block text-sm">Questions regarding institutional terms?</span>
            <span className="text-[#666666]">Contact our legal compliance team via WhatsApp or phone.</span>
          </div>
          <a
            href="https://wa.me/237682833601"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold shrink-0 shadow-2xs"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>+237 682 833 601</span>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8DFC9] bg-white py-6 text-center text-xs text-[#777777]">
        <p>© {new Date().getFullYear()} Nsei Sukul Managements System · Built for Secondary Education in Cameroon</p>
      </footer>
    </div>
  );
}
