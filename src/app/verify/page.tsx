import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Award,
  Calendar,
  Building,
  ArrowLeft,
  Printer,
  QrCode,
  FileText,
} from "lucide-react";
import { BRAND } from "@/lib/design-tokens";

interface VerifyPageProps {
  searchParams?: Promise<{
    matricule?: string;
    studentName?: string;
    school?: string;
    className?: string;
    type?: string;
    term?: string;
    score?: string;
    year?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;

  const matricule = params?.matricule || "STU-2026-001";
  const studentName = params?.studentName || "Official Student Record";
  const schoolName = params?.school || "Secondary Education Institution";
  const className = params?.className || "Secondary Division";
  const docType = params?.type || "report_card";
  const termName = params?.term || "Current Term";
  const score = params?.score;
  const academicYear = params?.year || "2025/2026";

  const typeLabels: Record<string, { title: string; subtitle: string; icon: any }> = {
    report_card: {
      title: "Academic Progress Report / Bulletin Scolaire",
      subtitle: "Official Term Evaluation & Competency Appraisal",
      icon: FileText,
    },
    student_id: {
      title: "Carte d'Identité Scolaire / Student Identity Card",
      subtitle: "Student Enrollment & Campus Identity Record",
      icon: GraduationCap,
    },
    certificate: {
      title: "Tableau d'Honneur / Honor Roll Certificate",
      subtitle: "Official Academic Excellence & Council Distinction",
      icon: Award,
    },
  };

  const currentDoc = typeLabels[docType] || typeLabels.report_card;
  const DocIcon = currentDoc.icon;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#191919] flex flex-col justify-between p-4 sm:p-8 font-sans antialiased">
      <div className="max-w-xl mx-auto w-full space-y-6 pt-4 sm:pt-10">
        
        {/* Top Back / Brand Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#555555] hover:text-[#142010] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sukul</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded bg-[#2A7C13] text-white flex items-center justify-center font-bold text-xs">
              S
            </div>
            <span className="font-extrabold text-xs tracking-tight text-[#142010]">
              {BRAND.name} Security
            </span>
          </div>
        </div>

        {/* Verification Card */}
        <div className="bg-white border-2 border-[#16A34A]/40 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-[#142010] text-white p-5 sm:p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto border border-white/30">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-0.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest text-[#DCFCE7] border border-white/30">
                Official Record Verified
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Authentic Document
              </h1>
              <p className="text-xs text-[#DCFCE7] font-medium">
                Verified institutional academic record generated for school administration
              </p>
            </div>
          </div>

          {/* Document Content Details */}
          <div className="p-5 sm:p-6 space-y-5">
            
            {/* Document Type Badge */}
            <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E8DFC9] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FFF8CF] text-[#B45309] border border-[#FACC15] flex items-center justify-center shrink-0">
                <DocIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-sm text-[#142010] truncate">
                  {currentDoc.title}
                </div>
                <div className="text-[11px] text-[#666666] truncate">
                  {currentDoc.subtitle}
                </div>
              </div>
            </div>

            {/* Student & Institution Verification Matrix */}
            <div className="divide-y divide-[#F0EFEA] border-y border-[#F0EFEA] text-xs">
              
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#666666] font-medium">Student Full Name:</span>
                <span className="font-bold text-[#142010] uppercase text-right">
                  {studentName}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#666666] font-medium">Unique Matricule:</span>
                <span className="font-mono font-black text-[#142010] bg-[#F5F5F0] px-2 py-0.5 rounded">
                  {matricule}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#666666] font-medium">Institution / School:</span>
                <span className="font-bold text-[#142010] text-right">
                  {schoolName}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#666666] font-medium">Class Stream:</span>
                <span className="font-bold text-[#2A7C13]">
                  {className}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#666666] font-medium">Academic Year:</span>
                <span className="font-mono font-semibold text-[#142010]">
                  {academicYear}
                </span>
              </div>

              {termName && (
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#666666] font-medium">Evaluation Period:</span>
                  <span className="font-semibold text-[#142010]">
                    {termName}
                  </span>
                </div>
              )}

              {score && (
                <div className="py-2.5 flex items-center justify-between bg-[#DCFCE7]/30 px-2 -mx-2 rounded">
                  <span className="text-[#166534] font-bold">Recorded Average:</span>
                  <span className="font-mono font-black text-sm text-[#15803D]">
                    {score} / 20.00
                  </span>
                </div>
              )}
            </div>

            {/* Verification Metadata Footnote */}
            <div className="rounded-lg bg-[#FAF8F5] p-3 text-[11px] text-[#777777] space-y-1">
              <div className="flex items-center gap-1.5 text-[#15803D] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Cryptographic Registry Verified</span>
              </div>
              <p className="leading-relaxed">
                This verification record confirms that this credential was officially generated by {schoolName} through the Sukul School Management Platform.
              </p>
            </div>
          </div>
        </div>

        {/* Security Stamp Notice */}
        <div className="text-center text-[11px] text-[#888888]">
          <p>© {new Date().getFullYear()} Nsei Sukul Technologies · Secure Academic Verification Service</p>
        </div>
      </div>
    </div>
  );
}
