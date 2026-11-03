import Link from "next/link";
import { 
  Globe,
  WifiOff, 
  Printer, 
  Wallet, 
  CreditCard, 
  Award, 
  BarChart3, 
  FileSpreadsheet, 
  ShieldCheck, 
  QrCode, 
  CloudSync,
  ArrowRight,
  GraduationCap,
  RefreshCw
} from "lucide-react";

interface PlatformCapability {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: typeof Globe;
  linkText?: string;
  linkUrl?: string;
}

const CAPABILITIES: PlatformCapability[] = [
  {
    id: "cloud-access",
    number: "01",
    title: "100% Cloud and Remote Access",
    description: "Run your school entirely online from any phone, tablet, or computer browser with zero local hardware installation required.",
    icon: Globe,
    linkText: "Register your school online",
    linkUrl: "/register",
  },
  {
    id: "offline-hub",
    number: "02",
    title: "Offline Campus Operation (Optional Sukul Hub)",
    description: "For schools with unstable internet or frequent blackouts, staff enter marks and print documents over local Wi-Fi without consuming mobile data.",
    icon: WifiOff,
    linkText: "How Sukul Hub works",
    linkUrl: "/features/school-hub",
  },
  {
    id: "report-cards",
    number: "03",
    title: "Generate Official Report Cards in Seconds",
    description: "Compute 6 sequences, subject coefficients, class ranks, and teacher appreciations to print official single-page A4 report cards in one click.",
    icon: Printer,
    linkText: "View report card engine",
    linkUrl: "/features/report-cards",
  },
  {
    id: "student-receipts",
    number: "04",
    title: "Student Fee Receipts and Bursary Tracking",
    description: "Record tuition installments in FCFA, print numbered anti-tamper receipts, and generate instant debtor clearance rosters before examinations.",
    icon: Wallet,
    linkText: "Fee management details",
    linkUrl: "/features/finance",
  },
  {
    id: "id-cards",
    number: "05",
    title: "Student ID Card Production",
    description: "Produce standard CR80 laminated student ID cards with matricules, photos, emergency guardian contacts, barcodes, and QR verification codes.",
    icon: CreditCard,
  },
  {
    id: "honor-roll",
    number: "06",
    title: "Honor Roll and Laureate Certificates",
    description: "Automatically identify the School Dux, class top-three students, and subject distinction laureates with printable official award diplomas.",
    icon: Award,
  },
  {
    id: "statistics",
    number: "07",
    title: "School and Class Council Statistics",
    description: "Monitor sequence pass rates, general averages, grade distributions, and highest or lowest marks across all classes, departments, and streams.",
    icon: BarChart3,
  },
  {
    id: "excel-import",
    number: "08",
    title: "1-Click Excel and CSV Bulk Import",
    description: "Import hundreds of registered students, class lists, and recorded sequence marks directly from spreadsheets without tedious manual retyping.",
    icon: FileSpreadsheet,
    linkText: "Read Excel setup guide",
    linkUrl: "/blog/fix-excel-class-council-errors",
  },
  {
    id: "security-roles",
    number: "09",
    title: "Role-Based Access and Audit Security",
    description: "Ensure complete operational security with separate, least-privilege accounts and audit trails for Principals, Class Masters, Subject Teachers, and Bursars.",
    icon: ShieldCheck,
  },
  {
    id: "qr-verification",
    number: "10",
    title: "Anti-Fraud Document Verification",
    description: "Allow parents, transfer schools, and authorities to instantly verify genuine report cards and student ID badges by scanning the on-document QR code.",
    icon: QrCode,
    linkText: "Try document verification",
    linkUrl: "/verify",
  },
  {
    id: "cloud-sync",
    number: "11",
    title: "Automatic Cloud Backup and Disaster Recovery",
    description: "When using offline mode, all campus records are stored safely on-site and automatically synchronized with encrypted cloud backups once connected.",
    icon: CloudSync,
  },
  {
    id: "annual-rollover",
    number: "12",
    title: "1-Click Academic Year Rollover and Promotion Wizard",
    description: "Seamlessly promote passing students, place borderline candidates on trial, flag repeaters, and roll over to the next academic session without re-admitting existing students.",
    icon: RefreshCw,
  },
  {
    id: "academic-transcripts",
    number: "13",
    title: "Official Multi-Year Academic Transcripts (Relevé de Notes)",
    description: "Generate ministerial-compliant cumulative academic transcripts with multi-year progression, subject coefficients, sequence marks, annual class ranks, and principal certification seals.",
    icon: GraduationCap,
  },
];

export function PlainEnglishCapabilities() {
  return (
    <section id="capabilities" className="py-16 sm:py-24 border-b border-[#E8DFC9] bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7E4] border border-[#76C457]/30 text-[#2A7C13] text-[11px] font-bold tracking-wider uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2A7C13]" />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#142010] tracking-tight leading-tight">
            What Your School Achieves With Nsei Sukul
          </h2>
          <p className="text-[14px] sm:text-[16px] text-[#525E4B] leading-relaxed mt-3">
            Use Nsei Sukul 100% online in the cloud from any browser, or optionally deploy the Sukul Hub for zero-internet campus operations.
          </p>
        </div>

        {/* Capabilities Tactile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 border-t border-[#E8DFC9] pt-8 sm:pt-10">
          {CAPABILITIES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between p-5 rounded-[12px] bg-[#FFFDF5] border border-[#E8DFC9] hover:border-[#2A7C13] hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 group"
              >
                <div>
                  {/* Top: Icon + Number */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-9 h-9 rounded-[8px] bg-white border border-[#E8DFC9] text-[#2A7C13] flex items-center justify-center group-hover:border-[#2A7C13] group-hover:bg-[#EAF7E4] transition-colors">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[#788470] bg-[#FAF8F2] px-2 py-0.5 rounded-[4px] border border-[#E8DFC9]/60">
                      #{item.number}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-[15px] text-[#142010] leading-snug group-hover:text-[#2A7C13] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-[13px] text-[#525E4B] leading-relaxed mt-2">
                    {item.description}
                  </p>
                </div>

                {item.linkText && item.linkUrl && (
                  <div className="pt-3 mt-3 border-t border-[#E8DFC9]/60">
                    <Link
                      href={item.linkUrl}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2A7C13] hover:text-[#20600E] group-hover:translate-x-0.5 transition-all"
                    >
                      <span>{item.linkText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Dignified Action Bar */}
        <div className="mt-14 pt-8 border-t border-[#E8DFC9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-bold text-[#142010]">
              Ready to deploy in your school this term?
            </p>
            <p className="text-[12px] text-[#788470] mt-0.5">
              Get started online immediately, or request an offline campus setup.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-[13px] font-semibold transition-colors"
            >
              <span>Register Your School</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
            <a
              href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20we%20would%20like%20a%20walkthrough%20of%20the%20platform%20capabilities."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-[7px] border border-[#E8DFC9] bg-[#FFFDF5] hover:bg-white text-[#142010] text-[13px] font-medium transition-colors"
            >
              <span>WhatsApp Inquiry (+237 682 833 601)</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
