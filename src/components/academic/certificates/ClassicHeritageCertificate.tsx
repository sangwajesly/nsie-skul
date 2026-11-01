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

export function ClassicHeritageCertificate({
  recipient,
  config,
  school,
  academicYearName,
  sequenceName,
}: Props) {
  const [imgError, setImgError] = useState(false);

  // Fallback monogram for school seal
  const initials = (school.name || "NS")
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  return (
    <div
      className="certificate-page relative w-full aspect-[297/209] max-w-[1020px] mx-auto bg-[#FFFDF7] text-[#1A1A1A] p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-xl print:shadow-none print:w-[297mm] print:h-[208mm] print:p-[12mm] print:max-w-none print:aspect-auto select-none font-serif"
      style={{
        boxSizing: "border-box",
        pageBreakAfter: "always",
        breakAfter: "page",
      }}
    >
      {/* ── Ornate Gold Outer & Inner Guilloche Border ─────────────────────── */}
      <div className="absolute inset-2 sm:inset-3 border-4 border-[#B4842A] rounded-none pointer-events-none" />
      <div className="absolute inset-3.5 sm:inset-4.5 border border-[#D4AF37]/70 pointer-events-none" />
      <div className="absolute inset-4 sm:inset-5 border border-dashed border-[#B4842A]/40 pointer-events-none" />

      {/* Ornate Corner Accents (SVG Flourishes) */}
      <svg
        className="absolute top-2.5 left-2.5 w-8 h-8 text-[#B4842A] pointer-events-none"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M0,0 L40,0 C20,10 10,20 0,40 Z M10,10 L30,10 C20,15 15,20 10,30 Z" />
      </svg>
      <svg
        className="absolute top-2.5 right-2.5 w-8 h-8 text-[#B4842A] pointer-events-none rotate-90"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M0,0 L40,0 C20,10 10,20 0,40 Z M10,10 L30,10 C20,15 15,20 10,30 Z" />
      </svg>
      <svg
        className="absolute bottom-2.5 left-2.5 w-8 h-8 text-[#B4842A] pointer-events-none -rotate-90"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M0,0 L40,0 C20,10 10,20 0,40 Z M10,10 L30,10 C20,15 15,20 10,30 Z" />
      </svg>
      <svg
        className="absolute bottom-2.5 right-2.5 w-8 h-8 text-[#B4842A] pointer-events-none rotate-180"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M0,0 L40,0 C20,10 10,20 0,40 Z M10,10 L30,10 C20,15 15,20 10,30 Z" />
      </svg>

      {/* Watermark Crest in Center Background */}
      {config.showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
          <svg className="w-[420px] h-[420px] text-[#B4842A]" viewBox="0 0 200 200" fill="currentColor">
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="4" />
            <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M100 25 L106 45 L128 45 L110 58 L117 78 L100 66 L83 78 L90 58 L72 45 L94 45 Z" />
            <path d="M40 100 C40 135 65 160 100 165 C135 160 160 135 160 100 C160 75 145 55 100 55 C55 55 40 75 40 100 Z" fill="none" stroke="currentColor" strokeWidth="3" />
          </svg>
        </div>
      )}

      {/* ── HEADER: Official Bilingual Republic & School Crest ───────────── */}
      <div className="relative z-10 space-y-2">
        {config.showNationalHeader && (
          <div className="grid grid-cols-3 items-center text-center text-[8.5px] sm:text-[10px] leading-tight border-b border-[#D4AF37]/50 pb-2">
            {/* Left: Francophone Header */}
            <div className="text-left font-serif space-y-0.5">
              <p className="font-extrabold tracking-wider text-[#142010] uppercase">
                République du Cameroun
              </p>
              <p className="italic text-[#77551B]">Paix – Travail – Patrie</p>
              <p className="font-semibold text-[#444444] text-[8px] sm:text-[9px]">
                Ministère des Enseignements Secondaires
              </p>
            </div>

            {/* Center: School Crest / Logo */}
            <div className="flex flex-col items-center justify-center">
              {config.showSchoolLogo && school.logoUrl && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={school.logoUrl}
                  alt={school.name}
                  onError={() => setImgError(true)}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain rounded-full border-2 border-[#B4842A] p-0.5 bg-white shadow-2xs"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#B4842A] bg-[#FFF9E6] flex flex-col items-center justify-center text-[#7A5B00] shadow-2xs">
                  <svg className="w-5 h-5 text-[#B4842A]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z" />
                    <path d="M4.5 10.5v5.25L12 20l7.5-4.25V10.5L12 15l-7.5-4.5z" />
                  </svg>
                  <span className="text-[7.5px] font-black font-sans tracking-tight leading-none mt-0.5">
                    {initials || "SCH"}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Anglophone Header */}
            <div className="text-right font-serif space-y-0.5">
              <p className="font-extrabold tracking-wider text-[#142010] uppercase">
                Republic of Cameroon
              </p>
              <p className="italic text-[#77551B]">Peace – Work – Fatherland</p>
              <p className="font-semibold text-[#444444] text-[8px] sm:text-[9px]">
                Ministry of Secondary Education
              </p>
            </div>
          </div>
        )}

        {/* Institution Identity & Subsystem Banner */}
        <div className="text-center space-y-0.5 pt-0.5">
          <h1 className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-wide text-[#1A2E05] font-serif">
            {school.name}
          </h1>
          {school.motto && (
            <p className="italic text-[10px] sm:text-[11.5px] text-[#785E23] font-medium">
              &laquo; {school.motto} &raquo;
            </p>
          )}
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-[#555555] font-sans flex-wrap">
            {school.address && <span>{school.address}</span>}
            {school.phone && <span>· Tel: {school.phone}</span>}
            <span>· Academic Year: <strong>{academicYearName}</strong></span>
            <span>· <strong>{sequenceName}</strong></span>
          </div>
        </div>
      </div>

      {/* ── CORE TITLE BANNER ─────────────────────────────────────────────── */}
      <div className="relative z-10 text-center my-1 sm:my-2">
        <div className="inline-block relative">
          <div className="px-6 sm:px-10 py-1.5 sm:py-2 border-y-2 border-[#B4842A] bg-gradient-to-r from-transparent via-[#FFF8DE] to-transparent">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.2em] uppercase text-[#7A550C] drop-shadow-2xs font-serif">
              Roll of Honour
            </h2>
            <p className="text-[10px] sm:text-[11.5px] font-sans uppercase font-bold tracking-[0.25em] text-[#1E3A10] mt-0.5">
              Certificate of Academic Excellence
            </p>
          </div>
        </div>
      </div>

      {/* ── BODY: Recipient Honor Details ──────────────────────────────────── */}
      <div className="relative z-10 text-center space-y-2 sm:space-y-3 px-2 sm:px-6">
        <p className="text-[11px] sm:text-xs text-[#555555] italic">
          {config.bilingualLabels
            ? "The Academic Council and School Administration proudly confer this honor upon / Le Conseil décerne ce titre à :"
            : "The Academic Council and School Administration proudly confer this honor upon:"}
        </p>

        {/* Student Name */}
        <div className="border-b-2 border-[#D4AF37]/80 pb-1.5 max-w-lg mx-auto">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-[#142010] tracking-wide font-serif">
            {recipient.studentName}
          </h3>
        </div>

        {/* Class, Matricule & Ranking Metadata */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-xs sm:text-[13px] text-[#222222]">
          <span className="font-bold">
            Class: <span className="text-[#1E3A10]">{recipient.fullClassName}</span>
          </span>
          <span className="text-[#B4842A]">◆</span>
          <span>
            Matricule: <strong className="font-mono text-[#333333]">{recipient.matricule}</strong>
          </span>
          {recipient.cycle && (
            <>
              <span className="text-[#B4842A]">◆</span>
              <span className="font-semibold text-[#666666]">{recipient.cycle}</span>
            </>
          )}
        </div>

        {/* Distinction Badge & Score */}
        <div className="inline-flex items-center gap-2 sm:gap-3 px-4 py-1.5 rounded-full bg-[#FFF5D6] border border-[#E4C868] shadow-2xs mx-auto">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#855507]">
            ★ {recipient.awardTitle} ★
          </span>
          {typeof recipient.average === "number" && (
            <span className="font-mono text-xs sm:text-sm font-black text-[#15803D] border-l border-[#D5B853] pl-2.5">
              Average: {recipient.average.toFixed(2)} / 20
            </span>
          )}
          {typeof recipient.subjectMark === "number" && recipient.subjectName && (
            <span className="font-mono text-xs sm:text-sm font-black text-[#15803D] border-l border-[#D5B853] pl-2.5">
              {recipient.subjectName}: {recipient.subjectMark.toFixed(1)} / 20
            </span>
          )}
        </div>

        {/* Citation Paragraph */}
        <p className="text-[10.5px] sm:text-xs text-[#444444] max-w-2xl mx-auto leading-relaxed italic px-4">
          &ldquo;{config.citation}&rdquo;
        </p>
      </div>

      {/* ── FOOTER: Rosette Seal, Date & Dual Signatories ──────────────────── */}
      <div className="relative z-10 pt-2 sm:pt-4 border-t border-[#D4AF37]/50 mt-1">
        <div className="grid grid-cols-3 items-end text-center">
          {/* Signatory 2: Censeur / Class Council */}
          <div className="space-y-1 text-left sm:text-center pl-2">
            <p className="text-[9.5px] sm:text-[11px] font-bold text-[#142010]">
              {config.signatory2Title}
            </p>
            {config.signatory2Name && (
              <p className="text-[9px] text-[#555555] italic">{config.signatory2Name}</p>
            )}
            <div className="w-28 sm:w-36 h-9 sm:h-11 border-b border-dashed border-[#888888] mx-auto mt-1" />
            <p className="text-[7.5px] text-[#888888] uppercase tracking-wider">Signature &amp; Date</p>
          </div>

          {/* Center: Official Seal Rosette & Issuance Date */}
          <div className="flex flex-col items-center justify-center">
            {config.showSealRosette && (
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                {/* SVG Rosette with serrated perimeter */}
                <svg
                  className="w-full h-full text-[#B4842A] drop-shadow-xs"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                >
                  <circle cx="50" cy="50" r="42" fill="#FAF5E4" stroke="#B4842A" strokeWidth="3" />
                  <circle cx="50" cy="50" r="34" fill="none" stroke="#B4842A" strokeWidth="1" strokeDasharray="3 2" />
                  <text
                    x="50"
                    y="38"
                    fontSize="7.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#7A550C"
                  >
                    ACADEMIC
                  </text>
                  <text
                    x="50"
                    y="52"
                    fontSize="9.5"
                    fontWeight="black"
                    textAnchor="middle"
                    fill="#1E3A10"
                  >
                    EXCELLENCE
                  </text>
                  <text
                    x="50"
                    y="64"
                    fontSize="6.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#7A550C"
                  >
                    ★ HONNEUR ★
                  </text>
                </svg>
              </div>
            )}
            <div className="text-[9px] sm:text-[10px] text-[#666666] font-sans mt-0.5">
              <span>Fait le / Issued: <strong>{config.issueDate}</strong></span>
            </div>
          </div>

          {/* Signatory 1: The Principal / Le Proviseur */}
          <div className="space-y-1 text-right sm:text-center pr-2">
            <p className="text-[9.5px] sm:text-[11px] font-bold text-[#142010]">
              {config.signatory1Title}
            </p>
            {config.signatory1Name && (
              <p className="text-[9px] text-[#555555] italic">{config.signatory1Name}</p>
            )}
            <div className="w-28 sm:w-36 h-9 sm:h-11 border-b border-dashed border-[#888888] mx-auto mt-1" />
            <p className="text-[7.5px] text-[#888888] uppercase tracking-wider">Le Chef d&apos;Établissement / Sceau</p>
          </div>
        </div>
      </div>
    </div>
  );
}
