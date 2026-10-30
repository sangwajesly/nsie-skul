import Link from "next/link";
import { 
  Wallet, 
  Receipt, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  MessageCircle, 
  FileText,
  AlertCircle,
  Users,
  Search,
  Banknote
} from "lucide-react";
import { MarketingHeader } from "@/components/landing/MarketingHeader";
import { MarketingFooter } from "@/components/landing/MarketingFooter";

export const metadata = {
  title: "Bursary & Fee Management (FCFA) | Nsei Sukul Managements System",
  description: "Track school fee installments, issue official printable receipts, and generate instant debtor lists in FCFA for Cameroonian colleges and secondary schools.",
};

export default function FinanceFeaturePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] text-[#142010] antialiased">
      <MarketingHeader currentPath="/features/finance" />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-14 sm:pt-20 pb-16 border-b border-[#E8DFC9] bg-gradient-to-b from-[#FFF8CF]/30 via-transparent to-transparent">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#76C457]/40 bg-[#EAF7E4] text-[12px] font-bold text-[#2A7C13]">
                <Wallet className="w-4 h-4" />
                <span>Bursary & Accounts Module in FCFA</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#142010] leading-[1.15]">
                Zero financial leakages. Every franc accounted for.
              </h1>

              <p className="text-[15px] sm:text-[17px] text-[#525E4B] leading-relaxed max-w-2xl mx-auto">
                Track tuition installments, issue anti-tamper printable receipts, and generate instant student debtor lists before exams, <strong>fully audited in FCFA (XAF)</strong>.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-[14px] shadow-sm transition-all"
                >
                  <span>Start Managing School Fees</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20we%20want%20to%20inquire%20about%20the%20Bursary%20%26%20Fee%20Management%20module."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[7px] bg-white hover:bg-[#FFF8CF]/40 text-[#142010] font-semibold text-[14px] border border-[#E8DFC9] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#2A7C13]" />
                  <span>Talk with Finance Specialist</span>
                </a>
              </div>

              <div className="pt-2 flex items-center justify-center gap-6 text-[12px] text-[#788470]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" /> Official Printable Receipts
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" /> Instant Debtor Lists
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" /> Cash & Mobile Money
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Core Capabilities Grid */}
        <section className="py-16 sm:py-20 border-b border-[#E8DFC9] bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2A7C13] bg-[#EAF7E4] px-2.5 py-1 rounded-[4px]">
                Built for School Bursars & Principals
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010] mt-3">
                Complete financial clarity from Day 1 of registration
              </h2>
              <p className="text-[14px] text-[#525E4B] mt-2">
                Replace unorganized paper ledgers and manual receipt books with a modern, auditable bursary system.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {/* Card 1 */}
              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">Instant Printable Receipts</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Generate professional receipt slips in seconds with sequential anti-duplicate receipt numbers, school crest, fee breakdown, and cashier signature line.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#FFF8CF] text-[#4A3D00] flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">Flexible Fee Tranches & Levies</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Configure custom fee structures per class: Registration fees, Tranche 1, Tranche 2, Tranche 3, PTA dues, Medical fees, and Practical examination fees.
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#FFEBEB] text-[#D32F2F] flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">Instant Examination Debtor Lists</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Filter students who have not completed minimum fee requirements before sequence exams or report card distribution with a single click.
                </p>
              </div>

              {/* Card 4 */}
              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#FBE6C2] text-[#422C0A] flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">Daily & Term Collection Analytics</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Real-time dashboard for principals and school proprietors showing total cash in vault, bank deposits, and outstanding fee debt across all classes.
                </p>
              </div>

              {/* Card 5 */}
              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">Tamper-Proof Audit Trail</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Every transaction is stamped with the recording cashier&apos;s username and timestamp. Past receipts cannot be silently deleted or altered without an audit log.
                </p>
              </div>

              {/* Card 6 */}
              <div className="p-6 rounded-[12px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-3">
                <div className="w-10 h-10 rounded-[8px] bg-[#FFF8CF] text-[#4A3D00] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[16px] text-[#142010]">Parent Statement of Account</h3>
                <p className="text-[13px] text-[#525E4B] leading-relaxed">
                  Print clear student account summaries for parents showing total annual fees, every payment made, date of payment, and exact outstanding balance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Sample Receipt Presentation */}
        <section className="py-16 border-b border-[#E8DFC9] bg-[#FFFDF5]">
          <div className="max-w-4xl mx-auto px-5 sm:px-8">
            <div className="text-center space-y-3 mb-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2A7C13] bg-[#EAF7E4] px-2.5 py-1 rounded-[4px]">
                Receipt Format
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#142010]">
                Clean, verifiable payment slips
              </h2>
              <p className="text-[14px] text-[#525E4B]">
                Sample receipt issued by the Nsei Sukul Bursary module.
              </p>
            </div>

            <div className="rounded-[10px] border border-[#D5CBB2] bg-white p-6 sm:p-8 max-w-xl mx-auto shadow-sm text-[12px] space-y-4 font-mono">
              <div className="border-b-2 border-dashed border-[#142010] pb-3 text-center font-sans">
                <h3 className="font-black text-[14px] uppercase text-[#142010]">BILINGUAL HIGH SCHOOL</h3>
                <p className="text-[11px] font-bold text-[#2A7C13]">BURSARY DEPARTMENT · OFFICIAL RECEIPT</p>
                <p className="text-[10px] text-[#788470]">Receipt No: <strong className="text-[#142010]">REC-2026-0849</strong></p>
              </div>

              <div className="space-y-1 text-[11px] font-sans">
                <div className="flex justify-between"><span className="text-[#788470]">Date:</span> <span>24 Oct 2026, 10:14 AM</span></div>
                <div className="flex justify-between"><span className="text-[#788470]">Student:</span> <strong className="text-[#142010]">BIH Grace Lum</strong></div>
                <div className="flex justify-between"><span className="text-[#788470]">Matricule:</span> <span>BHS-2026-118</span></div>
                <div className="flex justify-between"><span className="text-[#788470]">Class:</span> <span>Form 4 Arts</span></div>
                <div className="flex justify-between"><span className="text-[#788470]">Fee Category:</span> <span>Tuition Tranche 1 + PTA Levy</span></div>
                <div className="flex justify-between"><span className="text-[#788470]">Payment Method:</span> <span>Cash (Bursary Desk)</span></div>
              </div>

              <div className="border-t border-b border-[#E8DFC9] py-3 my-2 font-sans">
                <div className="flex justify-between text-[14px] font-extrabold text-[#2A7C13]">
                  <span>AMOUNT PAID:</span>
                  <span>45,000 FCFA</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#788470] mt-1">
                  <span>Balance Remaining:</span>
                  <span className="font-bold text-[#142010]">20,000 FCFA</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-end text-[10px] text-[#788470] font-sans">
                <div>
                  <p>Cashier: <strong className="text-[#142010]">Bursar Desk 1</strong></p>
                  <p className="text-[9px]">Valid only with official school stamp</p>
                </div>
                <div className="border border-dashed border-[#D5CBB2] w-24 h-12 flex items-center justify-center text-[9px] text-[#AAAAAA]">
                  [ School Stamp ]
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-[#142010] text-white">
          <div className="max-w-4xl mx-auto px-5 text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Get full control over your school finances today.
            </h2>
            <p className="text-[#A6B8A0] text-[15px] max-w-xl mx-auto">
              Setup is simple. Configure your fee schedule in 10 minutes and start issuing receipts immediately.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[7px] bg-[#76C457] hover:bg-[#68B349] text-[#0E1A09] font-bold text-[14px] transition-all"
              >
                <span>Register Your Institution</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul,%20I%20would%20like%20a%20demonstration%20of%20the%20fee%20management%20system."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-[7px] bg-white/10 hover:bg-white/20 text-white font-semibold text-[14px] border border-white/20 transition-all"
              >
                <MessageCircle className="w-4 h-4 text-[#76C457]" />
                <span>Schedule WhatsApp Consultation</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
