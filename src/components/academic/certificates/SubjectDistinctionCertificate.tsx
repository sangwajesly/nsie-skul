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

export function SubjectDistinctionCertificate({
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
      className="certificate-page relative w-full aspect-[297/209] max-w-[1020px] mx-auto bg-[#FDFBF7] text-[#1F2937] p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-xl print:shadow-none print:w-[297mm] print:h-[208mm] print:p-[12mm] print:max-w-none print:aspect-auto select-none font-serif"
      style={{
        boxSizing: "border-box",
        pageBreakAfter: "always",
        breakAfter: "page",
      }}
    >
      {/* ── Parchment Double Border with Laurel Wreath Accents ──────────────── */}
      <div className="absolute inset-2 sm:inset-3 border-2 border-[#78350F]/70 pointer-events-none" />
      <div className="absolute inset-3.5 sm:inset-4.5 border border-[#B45309]/30 pointer-events-none" />

      {/* Laurel Wreath Corner Graphics (SVG) */}
      <svg
        className="absolute top-2 left-2 w-12 h-12 text-[#92400E]/70 pointer-events-none"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M10,80 C15,50 35,30 65,15 C55,25 45,40 40,65 C30,70 20,75 10,80 Z M35,40 C38,30 48,22 55,20 C50,28 42,34 35,40 Z" />
      </svg>
      <svg
        className="absolute top-2 right-2 w-12 h-12 text-[#92400E]/70 pointer-events-none -scale-x-100"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M10,80 C15,50 35,30 65,15 C55,25 45,40 40,65 C30,70 20,75 10,80 Z M35,40 C38,30 48,22 55,20 C50,28 42,34 35,40 Z" />
      </svg>

      {/* Center watermark torch / laurel */}
      {config.showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
          <svg className="w-[420px] h-[420px] text-[#78350F]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5h-2v-5h2zm0-7h-2V7h2z" />
          </svg>
        </div>
      )}

      {/* ── HEADER: School Identity & Republic Dignity ──────────────────────── */}
      <div className="relative z-10 space-y-1.5 text-center">
        {config.showNationalHeader && (
          <div className="flex items-center justify-between text-[8px] sm:text-[9.5px] text-[#555555] pb-1 border-b border-[#E5E7EB]">
            <span className="font-bold tracking-wide uppercase">RÉPUBLIQUE DU CAMEROUN · Paix - Travail - Patrie</span>
            <span className="font-bold tracking-wide uppercase">REPUBLIC OF CAMEROON · Peace - Work - Fatherland</span>
          </div>
        )}

        {/* Center: School Seal & Title */}
        <div className="flex items-center justify-center gap-3 pt-1">
          {config.showSchoolLogo && school.logoUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={school.logoUrl}
              alt={school.name}
              onError={() => setImgError(true)}
              className="w-11 h-11 sm:w-13 sm:h-13 object-contain rounded-full border border-[#78350F]/40 p-0.5 bg-white shadow-2xs"
            />
          ) : (
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-[#78350F] bg-[#FEF3C7] flex items-center justify-center text-[#78350F] font-sans font-black text-xs shadow-2xs">
              {initials || "SCH"}
            </div>
          )}

          <div className="text-left">
            <h1 className="text-sm sm:text-lg md:text-xl font-black uppercase tracking-wide text-[#78350F]">
              {school.name}
            </h1>
            <p className="text-[9.5px] sm:text-[10.5px] text-[#555555] font-sans">
              {school.address || "Cameroon"} · Year: <strong>{academicYearName}</strong> · <strong>{sequenceName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ── HERO BANNER: Subject Distinction / Laurel ───────────────────────── */}
      <div className="relative z-10 text-center my-1 sm:my-2">
        <div className="inline-block relative">
          <div className="px-6 sm:px-10 py-1.5 border-y-2 border-[#92400E] bg-[#FEF3C7]/60">
            <span className="block text-[10px] sm:text-[11px] font-sans uppercase font-extrabold tracking-[0.25em] text-[#92400E]">
              {recipient.cycle ? `${recipient.cycle.toUpperCase()} DISTINCTION` : "ACADEMIC SUBJECT DISTINCTION"}
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-widest text-[#451A03]">
              Subject Excellence Award
            </h2>
            <p className="text-[9.5px] sm:text-[10.5px] font-sans italic text-[#6B7280]">
              Academic Distinction &amp; Top Subject Achievement Diploma
            </p>
          </div>
        </div>
      </div>

      {/* ── BODY: Recipient & Subject Highlight ──────────────────────────────── */}
      <div className="relative z-10 text-center space-y-2 sm:space-y-3 px-4">
        {/* Subject Highlight Banner */}
        {recipient.subjectName && (
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-md bg-[#FFFBEB] border border-[#FDE68A] shadow-2xs mx-auto">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#92400E]">
              Subject:
            </span>
            <span className="text-sm sm:text-base font-black uppercase text-[#78350F] tracking-wide">
              {recipient.subjectName}
            </span>
            {typeof recipient.subjectMark === "number" && (
              <span className="font-mono text-sm sm:text-base font-black text-[#15803D] border-l border-[#F59E0B] pl-2">
                {recipient.subjectMark.toFixed(1)} / 20
              </span>
            )}
          </div>
        )}

        <p className="text-[10.5px] sm:text-xs text-[#555555] italic">
          {config.bilingualLabels
            ? "The Academic Council and Teaching Staff proudly confer this honor upon / Le Conseil décerne cette distinction à :"
            : "The Academic Council and Teaching Staff proudly confer this honor upon:"}
        </p>

        {/* Student Name */}
        <div className="border-b-2 border-[#92400E]/70 pb-1 max-w-lg mx-auto">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-[#142010] tracking-wide">
            {recipient.studentName}
          </h3>
        </div>

        {/* Class & Details */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-xs font-sans">
          <span>Class: <strong>{recipient.fullClassName}</strong></span>
          <span className="text-[#92400E]">●</span>
          <span>Matricule: <strong className="font-mono">{recipient.matricule}</strong></span>
          {recipient.cycle && (
            <>
              <span className="text-[#92400E]">●</span>
              <span className="font-semibold text-[#78350F]">{recipient.cycle}</span>
            </>
          )}
          {typeof recipient.average === "number" && (
            <>
              <span className="text-[#92400E]">●</span>
              <span className="font-bold text-[#15803D]">Avg: {recipient.average.toFixed(2)}/20</span>
            </>
          )}
        </div>

        {/* Citation */}
        <p className="text-[10.5px] sm:text-xs text-[#4B5563] max-w-2xl mx-auto leading-relaxed italic px-4">
          &ldquo;{config.citation}&rdquo;
        </p>
      </div>

      {/* ── FOOTER: Laurel Stamp & Signatories ───────────────────────────────── */}
      <div className="relative z-10 pt-3 border-t border-[#D1D5DB]">
        <div className="grid grid-cols-3 items-end text-center">
          {/* Signatory 2: Head of Department */}
          <div className="space-y-1 text-left sm:text-center pl-2">
            <p className="text-[9.5px] sm:text-[11px] font-bold text-[#1F2937]">
              {config.signatory2Title || "Head of Department / Subject Lead"}
            </p>
            {config.signatory2Name ? (
              <p className="text-[9px] text-[#6B7280] italic">{config.signatory2Name}</p>
            ) : recipient.teacherName ? (
              <p className="text-[9px] text-[#6B7280] italic">{recipient.teacherName}</p>
            ) : null}
            <div className="w-28 sm:w-36 h-9 border-b border-dashed border-gray-400 mx-auto" />
            <p className="text-[7.5px] text-[#9CA3AF] uppercase">Signature</p>
          </div>

          {/* Center: Issue Date */}
          <div className="space-y-1">
            <p className="text-[9px] sm:text-[10px] text-[#6B7280] font-sans">
              Date: <strong>{config.issueDate}</strong>
            </p>
            <div className="text-[7.5px] text-[#9CA3AF] uppercase font-mono">
              ★ OFFICIAL ACADEMIC LAUREL ★
            </div>
          </div>

          {/* Signatory 1: The Principal */}
          <div className="space-y-1 text-right sm:text-center pr-2">
            <p className="text-[9.5px] sm:text-[11px] font-bold text-[#1F2937]">
              {config.signatory1Title || "The Principal / Chef d'Établissement"}
            </p>
            {config.signatory1Name && (
              <p className="text-[9px] text-[#6B7280] italic">{config.signatory1Name}</p>
            )}
            <div className="w-28 sm:w-36 h-9 border-b border-dashed border-gray-400 mx-auto" />
            <p className="text-[7.5px] text-[#9CA3AF] uppercase">Le Chef d&apos;Établissement</p>
          </div>
        </div>
      </div>
    </div>
  );
}
