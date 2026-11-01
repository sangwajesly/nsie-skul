"use client";

import React, { useState } from "react";
import type { HonorRollRecipient, CertificateConfig, CertificateSchoolInfo } from "./types";

interface Props {
  recipient: HonorRollRecipient;
  config: CertificateConfig;
  school: CertificateSchoolInfo;
  academicYearName: string;
  sequenceName: string;
}

export function ModernLaureateCertificate({
  recipient,
  config,
  school,
  academicYearName,
  sequenceName,
}: Props) {
  const [imgError, setImgError] = useState(false);

  const initials = (school.name || "NS")
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  return (
    <div
      className="certificate-page relative w-full aspect-[297/209] max-w-[1020px] mx-auto bg-white text-[#111827] p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-xl print:shadow-none print:w-[297mm] print:h-[208mm] print:p-[12mm] print:max-w-none print:aspect-auto select-none font-sans"
      style={{
        boxSizing: "border-box",
        pageBreakAfter: "always",
        breakAfter: "page",
      }}
    >
      {/* ── Modern Geometric Frame & Emerald/Gold Corner Ribbons ─────────── */}
      <div className="absolute inset-2 sm:inset-3 border-2 border-[#0F5132] pointer-events-none" />
      <div className="absolute inset-3.5 sm:inset-4.5 border border-[#E5E7EB] pointer-events-none" />

      {/* Top Left Corner Ribbon & Angles */}
      <div className="absolute top-0 left-0 w-20 h-20 overflow-hidden pointer-events-none">
        <div className="absolute transform -rotate-45 bg-[#0F5132] text-white text-[7px] font-black tracking-widest text-center py-1 -left-7 top-4 w-28 uppercase shadow-xs">
          HONOR ROLL
        </div>
      </div>

      {/* Top Right Corner Geometric Accent */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 pointer-events-none flex items-start justify-end">
        <div className="w-5 h-5 border-t-2 border-r-2 border-[#D97706]" />
      </div>

      {/* Bottom Left Corner Geometric Accent */}
      <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-8 h-8 pointer-events-none flex items-end justify-start">
        <div className="w-5 h-5 border-b-2 border-l-2 border-[#D97706]" />
      </div>

      {/* Subtle modern background watermark */}
      {config.showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <svg className="w-[450px] h-[450px] text-[#0F5132]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z" />
            <path d="M4.5 10.5v5.25L12 20l7.5-4.25V10.5L12 15l-7.5-4.5z" />
          </svg>
        </div>
      )}

      {/* ── TOP HEADER: Contemporary Institution Branding ─────────────────── */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#F3F4F6] pb-3">
        {/* Left: School Identity & Address */}
        <div className="flex items-center gap-3">
          {config.showSchoolLogo && school.logoUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={school.logoUrl}
              alt={school.name}
              onError={() => setImgError(true)}
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-lg border border-[#0F5132]/30 p-1 bg-white shadow-2xs"
            />
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-[#0F5132] to-[#1E3A8A] flex flex-col items-center justify-center text-white shadow-xs">
              <span className="text-[12px] font-black tracking-tight">{initials || "SCH"}</span>
              <span className="text-[7px] uppercase tracking-wider text-[#A7F3D0]">CBA</span>
            </div>
          )}

          <div>
            <h1 className="text-base sm:text-xl font-black text-[#111827] tracking-tight uppercase leading-tight">
              {school.name}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-[#4B5563] mt-0.5 flex-wrap">
              {school.address && <span>{school.address}</span>}
              {school.phone && <span>· {school.phone}</span>}
              {school.subsystem && (
                <span className="capitalize font-bold text-[#0F5132]">· {school.subsystem} Subsystem</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Academic Period Badge */}
        <div className="text-right space-y-1 shrink-0">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#DCFCE7] text-[#166534] border border-[#86EFAC]">
            {sequenceName}
          </span>
          <p className="text-[10px] text-[#6B7280] font-mono font-semibold">
            Year: {academicYearName}
          </p>
        </div>
      </div>

      {/* ── HERO BANNER: Certificate Title ─────────────────────────────────── */}
      <div className="relative z-10 text-center my-1.5 sm:my-2">
        <div className="inline-flex items-center gap-2 px-5 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[10px] font-bold uppercase tracking-widest mb-1 shadow-2xs">
          <span>Official Academic Distinction</span>
          <span>·</span>
          <span>Roll of Honour</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-[#064E3B]">
          Certificate of Academic Excellence
        </h2>
        <p className="text-xs sm:text-[13px] font-medium text-[#4B5563] mt-0.5">
          {config.bilingualLabels
            ? "Awarded for outstanding scholastic achievement and exemplary character / Décerné pour excellence académique"
            : "In recognition of distinguished scholastic accomplishment and exemplary discipline"}
        </p>
      </div>

      {/* ── BODY: Recipient Presentation ────────────────────────────────────── */}
      <div className="relative z-10 text-center space-y-2 sm:space-y-3 px-4">
        {/* Student Name */}
        <div className="max-w-xl mx-auto pb-1 border-b-2 border-[#10B981]">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase text-[#111827] tracking-tight">
            {recipient.studentName}
          </h3>
        </div>

        {/* Student Metadata Pills */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-xs">
          <span className="px-3 py-1 rounded-md bg-[#F3F4F6] text-[#374151] font-bold">
            Class: <strong className="text-[#111827]">{recipient.fullClassName}</strong>
          </span>
          <span className="px-3 py-1 rounded-md bg-[#F3F4F6] text-[#374151] font-mono">
            Matricule: <strong className="text-[#111827]">{recipient.matricule}</strong>
          </span>
          {recipient.cycle && (
            <span className="px-2.5 py-1 rounded-md bg-[#E0E7FF] text-[#3730A3] font-bold text-[11px]">
              {recipient.cycle}
            </span>
          )}
        </div>

        {/* Award Distinction Card */}
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-xl bg-gradient-to-r from-[#ECFDF5] via-[#FFFBEB] to-[#ECFDF5] border border-[#A7F3D0] shadow-2xs mx-auto">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0F5132]">
            ★ {recipient.awardTitle} ★
          </span>
          {typeof recipient.average === "number" && (
            <div className="flex items-baseline gap-1 pl-3 border-l border-[#D1D5DB]">
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">Average:</span>
              <span className="font-mono text-sm sm:text-base font-black text-[#047857]">
                {recipient.average.toFixed(2)}/20
              </span>
            </div>
          )}
          {typeof recipient.subjectMark === "number" && recipient.subjectName && (
            <div className="flex items-baseline gap-1 pl-3 border-l border-[#D1D5DB]">
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">{recipient.subjectName}:</span>
              <span className="font-mono text-sm sm:text-base font-black text-[#047857]">
                {recipient.subjectMark.toFixed(1)}/20
              </span>
            </div>
          )}
        </div>

        {/* Citation */}
        <p className="text-[11px] sm:text-xs text-[#4B5563] max-w-2xl mx-auto leading-relaxed italic px-6">
          &ldquo;{config.citation}&rdquo;
        </p>
      </div>

      {/* ── FOOTER: Verification Badge & Modern Signatories ───────────────── */}
      <div className="relative z-10 pt-3 border-t border-[#E5E7EB]">
        <div className="grid grid-cols-3 items-end">
          {/* Signatory 2 */}
          <div className="space-y-1 text-center">
            <p className="text-[10px] sm:text-xs font-bold text-[#111827]">
              {config.signatory2Title}
            </p>
            {config.signatory2Name && (
              <p className="text-[9.5px] text-[#6B7280] italic">{config.signatory2Name}</p>
            )}
            <div className="w-28 sm:w-36 h-9 border-b border-gray-300 mx-auto" />
            <p className="text-[8px] text-[#9CA3AF] uppercase">Signature</p>
          </div>

          {/* Center: Security Badge & Date */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563] text-[9.5px] font-mono font-semibold border border-[#E5E7EB]">
              <span>Date:</span>
              <strong>{config.issueDate}</strong>
            </div>
            <div className="text-[8px] text-[#9CA3AF] font-mono">
              VERIFIED ACADEMIC RECORD · OFFICIAL DISTINCTION
            </div>
          </div>

          {/* Signatory 1 */}
          <div className="space-y-1 text-center">
            <p className="text-[10px] sm:text-xs font-bold text-[#111827]">
              {config.signatory1Title}
            </p>
            {config.signatory1Name && (
              <p className="text-[9.5px] text-[#6B7280] italic">{config.signatory1Name}</p>
            )}
            <div className="w-28 sm:w-36 h-9 border-b border-gray-300 mx-auto" />
            <p className="text-[8px] text-[#9CA3AF] uppercase">The Principal / Head of School</p>
          </div>
        </div>
      </div>
    </div>
  );
}
