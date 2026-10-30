import Link from "next/link";
import { GraduationCap, ArrowLeft, ShieldCheck, Lock, EyeOff, UserCheck, Phone, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Data Privacy Policy · Nsei Sukul Managements System",
  description: "Official student and school data privacy policy under Cameroon Law No. 2024/017 on Personal Data Protection.",
};

export default function PrivacyPolicyPage() {
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
              <span className="text-[10px] text-[#777777] block -mt-0.5">Management System</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/terms"
              className="text-xs font-semibold text-[#555555] hover:text-[#191919] transition-colors"
            >
              Terms of Service
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
            <ShieldCheck className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>Cameroon Law No. 2024/017 Compliant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#142010] tracking-tight">
            Data Privacy &amp; Minor Protection Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#666666]">
            Protecting student records, teacher continuous assessment evaluations, and parent contacts across Cameroon.
            <br />
            Strictly compliant with Law No. 2024/017 on Personal Data Protection and Law No. 2010/012 on Cybersecurity.
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
              <span>Data Controller &amp; Data Processor Distinction</span>
            </h2>
            <p>
              Under <strong>Law No. 2024/017 of 23 December 2024</strong> (Cameroon Personal Data Protection Law):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#555555]">
              <li><strong>The School is the Data Controller (<em>Responsable du traitement</em>)</strong>: The educational institution decides which students to admit, collects physical admission sheets and birth certificates, and controls which teachers are assigned to which classes.</li>
              <li><strong>Nsei Sukul is the Data Processor (<em>Sous-traitant</em>)</strong>: We provide the secure software infrastructure (both Cloud and School Hub) to store and process student records strictly in accordance with the School&apos;s administrative mandate.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#142010] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#142010] text-white text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <span>Protection of Minors &amp; Mandatory Parental Consent</span>
            </h2>
            <p>
              In accordance with <strong>Article 8 and 9 of Law No. 2024/017</strong>, processing the personal data of minors (children under the age of 21) requires explicit parental or legal guardian authorization:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#555555]">
              <li>The subscribing Institution warrants that upon student admission, it has secured informed parental/guardian consent to record the child&apos;s biographic data, generate official report cards, and register the student with MINESEC/MINEDUB.</li>
              <li>Parent/guardian contact numbers are collected strictly for emergency notifications, tuition payment confirmations, and academic progress updates.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#142010] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#142010] text-white text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <span>Categories of Data Collected (Data Minimization)</span>
            </h2>
            <p>
              Nsei Sukul strictly enforces data minimization (*Principe de minimisation*). We only process the information required for Cameroonian educational reporting:
            </p>
            <div className="border border-[#E8DFC9] rounded-[6px] overflow-hidden text-xs mt-2">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FAF8F5] text-[#142010] font-bold border-b border-[#E8DFC9]">
                  <tr>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Items Collected</th>
                    <th className="p-2.5">Educational Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F1ED] text-[#555555]">
                  <tr>
                    <td className="p-2.5 font-semibold text-[#142010]">Student Profile</td>
                    <td className="p-2.5">Surname, Given Names, Matricule, Date &amp; Place of Birth, Gender, Residence (Day/Boarding), Repeating Status</td>
                    <td className="p-2.5">MINESEC register conformity, GCE/OBC exam candidate verification</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-[#142010]">Student Photo <em className="font-normal text-[#888888]">(optional)</em></td>
                    <td className="p-2.5">Client-side compressed passport photograph (~20KB JPEG data URL)</td>
                    <td className="p-2.5">Visual verification on official report cards and badges. Never mandatory.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-[#142010]">Academic Marks</td>
                    <td className="p-2.5">Continuous assessment marks (Seq 1–6), CBA competencies, coefficients, rank</td>
                    <td className="p-2.5">Report cards, promotion council decisions, ministerial transcripts</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-[#142010]">Parent / Guardian</td>
                    <td className="p-2.5">Name, phone number (WhatsApp/MoMo), relationship to pupil</td>
                    <td className="p-2.5">Emergency contact, fee receipting, attendance notifications</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#142010] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#142010] text-white text-[11px] font-bold flex items-center justify-center">
                4
              </span>
              <span>Client-Side Photo Privacy Safeguard</span>
            </h2>
            <p>
              Unlike conventional web apps that send full-resolution photographs to unencrypted third-party image processors, Nsei Sukul processes student photos <strong>entirely within the user&apos;s browser memory</strong> using HTML5 Canvas downsampling (max 320×320 pixels, ~20KB data URL):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#555555]">
              <li>Photographs are never analyzed by external facial recognition algorithms.</li>
              <li>Photographs are stored directly as compact data strings in the isolated school database.</li>
              <li>Photographs are never indexed by external search engines or public web scrapers.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#142010] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#142010] text-white text-[11px] font-bold flex items-center justify-center">
                5
              </span>
              <span>Absolute Anti-Commercialization Guarantee</span>
            </h2>
            <div className="p-4 rounded-[6px] bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] space-y-1 text-xs">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" />
                Zero Commercial Selling or Sharing of Educational Data
              </span>
              <p>
                Nsei Sukul <strong>NEVER sells, rents, monetizes, or shares</strong> student records, grades, or parent contact details with advertisers, commercial vendors, or data brokers. The platform displays zero third-party advertising and contains zero behavioral tracking cookies.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#142010] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#142010] text-white text-[11px] font-bold flex items-center justify-center">
                6
              </span>
              <span>Multi-Tenant Security &amp; Encryption Standards</span>
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#555555]">
              <li><strong>Row-Level Security (RLS)</strong>: Cryptographic tenant isolation ensures that staff of School A can never query, view, or alter records belonging to School B.</li>
              <li><strong>In-Transit Encryption</strong>: All data transmitted between mobile devices, local School Hub nodes, and the cloud is encrypted using TLS 1.3.</li>
              <li><strong>At-Rest Encryption</strong>: Database records, automated snapshots, and backup archives are encrypted using AES-256 standards.</li>
              <li><strong>Role-Based Permissions (RBAC)</strong>: Regular teachers are strictly restricted to viewing students and entering marks for the specific class groups and subjects assigned to them.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#142010] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#142010] text-white text-[11px] font-bold flex items-center justify-center">
                7
              </span>
              <span>Data Subject Rights (Access, Correction, Rectification)</span>
            </h2>
            <p>
              In accordance with Cameroon Law No. 2024/017, parents and legal guardians may exercise their statutory rights through the school administration:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#555555]">
              <li><strong>Right to Rectification</strong>: Immediate correction of misspelled family names, compound given names, or birth dates in the student directory.</li>
              <li><strong>Right to Data Portability</strong>: Authorized school administrators can export student registers and complete marks histories in standard CSV/PDF formats at any time.</li>
              <li><strong>Statutory Educational Archival</strong>: In compliance with MINESEC requirements, historical report cards are retained for student academic verification and certificate claims.</li>
            </ul>
          </section>
        </div>

        {/* Support & Contact Card */}
        <div className="p-5 rounded-[8px] bg-[#FAF8F5] border border-[#E8DFC9] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-bold text-[#142010] block text-sm">Data Protection Officer (DPO) Contact</span>
            <span className="text-[#666666]">
              To submit a privacy request or report a security concern, contact our compliance team.
            </span>
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
