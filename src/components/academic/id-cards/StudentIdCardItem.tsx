"use client";

import React, { useState } from "react";
import type { StudentIdCardData, IdCardConfig } from "./types";
import { COLOR_PRESETS } from "./types";
import { BarcodeSVG } from "./BarcodeSVG";
import { QRCodeSVG } from "@/components/ui/QRCodeSVG";

interface Props {
  data: StudentIdCardData;
  config: IdCardConfig;
  side?: "front" | "back";
}

export function StudentIdCardItem({ data, config, side = "front" }: Props) {
  const [imgError, setImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const theme =
    config.colorPreset === "custom" && config.customColor
      ? {
          id: "custom" as const,
          name: "Custom Color",
          primary: config.customColor,
          accent: config.customColor,
          lightBg: "#FAF9F5",
        }
      : COLOR_PRESETS[config.colorPreset] || COLOR_PRESETS.forest;

  const initials = (data.fullName || "ST")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const schoolInitials = (data.schoolName || "SCH")
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const verifyUrl = `/verify?matricule=${encodeURIComponent(data.matricule)}&studentName=${encodeURIComponent(data.fullName)}&school=${encodeURIComponent(data.schoolName)}&className=${encodeURIComponent(data.fullClassName)}&year=${encodeURIComponent(data.academicYearName)}&type=student_id`;

  // ─────────────────────────────────────────────────────────────────────────────
  // BACK SIDE (Common to all templates when back side is rendered)
  // ─────────────────────────────────────────────────────────────────────────────
  if (side === "back") {
    return (
      <div
        className="id-card-back relative w-[86mm] h-[54mm] bg-[#FDFBF7] text-[#111827] rounded-[5px] border border-[#CBD5E1] p-[3mm] flex flex-col justify-between overflow-hidden shadow-sm select-none font-sans box-border print:shadow-none print:border-black/40 print:m-0"
        style={{ width: "86mm", height: "54mm" }}
      >
        {/* Back Header */}
        <div
          className="text-center pb-0.5 space-y-0.2"
          style={{ borderBottom: `1px solid ${theme.primary}40` }}
        >
          <h2
            className="text-[7.5px] font-black uppercase truncate"
            style={{ color: theme.primary }}
          >
            {data.schoolName}
          </h2>
          <p className="text-[5.5px] text-[#555555]">
            {data.schoolAddress || "Cameroon"} · Tel: {data.schoolPhone || "(+237) 6XX XXX XXX"}
          </p>
        </div>

        {/* Center: QR Code and Campus Notice */}
        <div className="flex items-center justify-center gap-2.5 py-1">
          {config.showQRCode && (
            <div className="p-1 rounded bg-white border border-black/20 shadow-2xs shrink-0 flex flex-col items-center">
              <QRCodeSVG value={verifyUrl} size={42} quietZone={1} />
              <span
                className="text-[5px] font-mono uppercase font-black mt-0.5 leading-none"
                style={{ color: theme.accent }}
              >
                VERIFIED
              </span>
            </div>
          )}

          <div className="space-y-0.5 text-[5.8px] leading-tight text-[#333333] max-w-[46mm]">
            <p
              className="font-bold uppercase text-[6px]"
              style={{ color: theme.primary }}
            >
              Avis Reglementaire / Campus Notice:
            </p>
            <p className="italic">
              Cette carte est strictement personnelle et obligatoire dans l&apos;enceinte de l&apos;etablissement et aux examens officiels.
            </p>
            <p className="text-[5.2px] text-[#555555]">
              En cas de perte, priere de la rapporter a l&apos;administration de l&apos;ecole ou au commissariat le plus proche.
            </p>
          </div>
        </div>

        {/* Emergency Guardian Details and Expiry */}
        <div
          className="pt-0.5 flex items-center justify-between text-[5.8px] text-[#444444]"
          style={{ borderTop: `1px solid ${theme.primary}30` }}
        >
          <div>
            <span>Parent / Tuteur: </span>
            <strong className="text-[#111827]">{data.guardianName || "N/A"}</strong>
          </div>
          <div className="text-right">
            <span
              className="font-mono font-bold"
              style={{ color: theme.accent }}
            >
              Expire: {config.expiryDate || "31/07/2026"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEMPLATE 1: CLASSIC ACADEMIC (Traditional Cameroon secondary card)
  // ─────────────────────────────────────────────────────────────────────────────
  if (config.template === "classic") {
    return (
      <div
        className="id-card-front relative w-[86mm] h-[54mm] bg-white text-[#111827] rounded-[5px] border border-[#CBD5E1] p-[3mm] flex flex-col justify-between overflow-hidden shadow-sm select-none font-sans box-border print:shadow-none print:border-black/40 print:m-0"
        style={{ width: "86mm", height: "54mm" }}
      >
        {/* Top Republic Mini-Header */}
        <div
          className="pb-0.5 space-y-0.2"
          style={{ borderBottom: `1px solid ${theme.primary}40` }}
        >
          <div className="flex items-center justify-between text-[5.5px] font-bold uppercase tracking-tight text-[#444444]">
            <span>REPUBLIQUE DU CAMEROUN</span>
            <span style={{ color: theme.accent }} className="font-black">•</span>
            <span>REPUBLIC OF CAMEROON</span>
          </div>

          {/* School Name and Logo */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {data.schoolLogoUrl && !logoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.schoolLogoUrl}
                alt={data.schoolName}
                onError={() => setLogoError(true)}
                className="w-5 h-5 object-contain rounded-full border p-0.2 shrink-0 bg-white"
                style={{ borderColor: `${theme.primary}50` }}
              />
            ) : (
              <div
                className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[7px] font-black shrink-0"
                style={{ backgroundColor: theme.primary }}
              >
                {schoolInitials || "SCH"}
              </div>
            )}
            <div className="min-w-0 flex-1 leading-none">
              <h1
                className="text-[7.5px] font-black uppercase truncate"
                style={{ color: theme.primary }}
              >
                {data.schoolName}
              </h1>
              <p className="text-[5.5px] text-[#666666] truncate italic mt-0.2">
                {data.schoolMotto || "Knowledge, Discipline, Success"}
              </p>
            </div>
          </div>
        </div>

        {/* Card Title Banner */}
        <div
          className="text-white py-0.5 px-2 -mx-[3mm] flex items-center justify-between text-[6.5px] font-black uppercase tracking-wider"
          style={{ backgroundColor: theme.primary }}
        >
          <span>CARTE D&apos;IDENTITE SCOLAIRE</span>
          <span className="text-[#FDE047] font-mono">{data.academicYearName}</span>
          <span>STUDENT ID CARD</span>
        </div>

        {/* Core Student Information Grid */}
        <div className="flex items-start gap-2 flex-1 pt-1 min-h-0">
          {/* Student Photo */}
          <div
            className="w-[19mm] h-[24mm] rounded border bg-[#F3F4F6] overflow-hidden flex flex-col items-center justify-center shrink-0"
            style={{ borderColor: `${theme.primary}80` }}
          >
            {data.photoUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.photoUrl}
                alt={data.fullName}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <span
                  className="text-xs font-black block"
                  style={{ color: theme.accent }}
                >
                  {initials || "ST"}
                </span>
                <span className="text-[5px] uppercase font-bold text-[#888888] block">
                  PHOTO
                </span>
              </div>
            )}
          </div>

          {/* Student Info Details */}
          <div className="flex-1 min-w-0 space-y-0.5 text-[6.5px] leading-tight">
            <div>
              <span className="text-[#666666] uppercase block text-[5.5px]">Nom / Name:</span>
              <span className="font-black text-[8px] text-[#111827] uppercase truncate block leading-none">
                {data.fullName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-1">
              <div>
                <span className="text-[#666666] block text-[5px]">Matricule:</span>
                <span
                  className="font-mono font-black text-[7.5px] block"
                  style={{ color: theme.accent }}
                >
                  {data.matricule}
                </span>
              </div>
              <div>
                <span className="text-[#666666] block text-[5px]">Classe / Class:</span>
                <span className="font-bold text-[7.5px] text-[#111827] block truncate">
                  {data.fullClassName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-1">
              <div>
                <span className="text-[#666666] block text-[5px]">Ne(e) / Born:</span>
                <span className="font-medium text-[6px] text-[#333333] block truncate">
                  {data.dateOfBirth || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-[#666666] block text-[5px]">Sexe / Gender:</span>
                <span className="font-bold text-[6px] text-[#333333] block">
                  {data.gender === "M" ? "M (Masculin)" : "F (Feminin)"}
                </span>
              </div>
            </div>

            {data.guardianPhone && config.showEmergencyContact && (
              <div>
                <span className="text-[#666666] block text-[5px]">Contact d&apos;Urgence:</span>
                <span
                  className="font-mono font-bold text-[6px] block"
                  style={{ color: theme.accent }}
                >
                  {data.guardianPhone}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Barcode + Signature */}
        <div className="border-t border-[#CBD5E1] pt-0.5 flex items-end justify-between">
          {config.showBarcode ? (
            <BarcodeSVG value={data.matricule} width={90} height={16} showText={false} />
          ) : (
            <span className="font-mono text-[6.5px] font-bold text-[#666666]">
              REG: {data.matricule}
            </span>
          )}

          <div className="text-right space-y-0.2 shrink-0">
            <span className="text-[5px] text-[#666666] uppercase block">
              {config.signatoryTitle || "Le Chef d'Etablissement"}
            </span>
            <div className="w-16 border-b border-dotted border-black/40 h-3" />
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEMPLATE 2: MODERN PRESTIGE (Includes Front QR code for front-only schools)
  // ─────────────────────────────────────────────────────────────────────────────
  if (config.template === "modern") {
    return (
      <div
        className="id-card-front relative w-[86mm] h-[54mm] bg-white text-[#111827] rounded-[5px] border border-[#CBD5E1] flex flex-col justify-between overflow-hidden shadow-sm select-none font-sans box-border print:shadow-none print:border-black/40 print:m-0"
        style={{ width: "86mm", height: "54mm" }}
      >
        {/* Top Full Banner */}
        <div
          className="text-white px-[3mm] py-1 flex items-center justify-between gap-1.5"
          style={{ backgroundColor: theme.primary }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {data.schoolLogoUrl && !logoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.schoolLogoUrl}
                alt={data.schoolName}
                onError={() => setLogoError(true)}
                className="w-4.5 h-4.5 object-contain rounded-full bg-white p-0.2 shrink-0"
              />
            ) : (
              <div className="w-4.5 h-4.5 rounded-full bg-white/20 text-white flex items-center justify-center text-[6px] font-black shrink-0">
                {schoolInitials || "SCH"}
              </div>
            )}
            <div className="min-w-0 leading-tight">
              <h1 className="text-[7.5px] font-black uppercase truncate text-white">
                {data.schoolName}
              </h1>
              <span className="text-[5.5px] text-white/80 uppercase font-semibold">
                STUDENT PASS · CARTE D&apos;IDENTITE
              </span>
            </div>
          </div>

          <span className="text-[6.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/20 text-white shrink-0">
            {data.academicYearName}
          </span>
        </div>

        {/* Card Body: Photo (Left) + Details (Center) + Front QR Code (Right) */}
        <div className="px-[3mm] py-1 flex items-center justify-between gap-2 flex-1 min-h-0">
          {/* Photo */}
          <div
            className="w-[19mm] h-[24mm] rounded border-2 overflow-hidden bg-[#F3F4F6] flex flex-col items-center justify-center shrink-0 shadow-2xs"
            style={{ borderColor: theme.accent }}
          >
            {data.photoUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.photoUrl}
                alt={data.fullName}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <span
                  className="text-xs font-black block"
                  style={{ color: theme.accent }}
                >
                  {initials || "ST"}
                </span>
                <span className="text-[5px] uppercase font-bold text-[#888888] block">
                  PHOTO
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-0.8 text-[6.5px] leading-tight">
            <div>
              <span className="font-mono text-[5.5px] text-[#666666] uppercase block">
                FULL NAME
              </span>
              <strong className="font-black text-[8px] text-[#111827] uppercase truncate block leading-none">
                {data.fullName}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="px-1.5 py-0.2 rounded font-mono font-black text-[6.5px] text-white"
                style={{ backgroundColor: theme.accent }}
              >
                {data.matricule}
              </span>
              <span className="font-bold text-[7px] text-[#111827] truncate">
                {data.fullClassName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[6px] text-[#444444] pt-0.5">
              <div>
                <span className="text-[#888888] block text-[5px]">BORN:</span>
                <span className="font-medium text-[#111827]">{data.dateOfBirth || "N/A"}</span>
              </div>
              <div>
                <span className="text-[#888888] block text-[5px]">SEX:</span>
                <span className="font-bold text-[#111827]">{data.gender === "M" ? "Male" : "Female"}</span>
              </div>
            </div>

            {data.guardianPhone && config.showEmergencyContact && (
              <div className="text-[5.5px] text-[#555555]">
                <span>Emergency: </span>
                <strong className="font-mono text-[#111827]">{data.guardianPhone}</strong>
              </div>
            )}
          </div>

          {/* Front QR Code for Direct Smartphone Verification */}
          {config.showQRCode && (
            <div className="flex flex-col items-center justify-center p-1 rounded bg-[#FAF9F5] border border-black/15 shrink-0">
              <QRCodeSVG value={verifyUrl} size={36} quietZone={1} />
              <span
                className="text-[4.5px] font-mono uppercase font-black mt-0.5 tracking-tighter"
                style={{ color: theme.primary }}
              >
                VERIFY
              </span>
            </div>
          )}
        </div>

        {/* Footer: Bottom Barcode Bar */}
        <div
          className="px-[3mm] py-0.5 flex items-center justify-between border-t"
          style={{ borderColor: `${theme.primary}20`, backgroundColor: `${theme.lightBg}60` }}
        >
          {config.showBarcode ? (
            <BarcodeSVG value={data.matricule} width={80} height={13} showText={false} />
          ) : (
            <span className="font-mono text-[6px] font-bold text-[#666666]">
              ID: {data.matricule}
            </span>
          )}

          <div className="text-right leading-none">
            <span className="text-[4.8px] text-[#666666] uppercase block">
              {config.signatoryTitle || "Principal"}
            </span>
            <span className="font-serif italic text-[6px] text-[#333333]">Signed & Sealed</span>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEMPLATE 3: COMPACT MINIMALIST (Clean, high-efficiency, ink-saving)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="id-card-front relative w-[86mm] h-[54mm] bg-white text-[#111827] rounded-[5px] border-2 p-[2.5mm] flex flex-col justify-between overflow-hidden shadow-sm select-none font-sans box-border print:shadow-none print:border-black/40 print:m-0"
      style={{ width: "86mm", height: "54mm", borderColor: theme.primary }}
    >
      {/* Slim Header */}
      <div
        className="flex items-center justify-between pb-1"
        style={{ borderBottom: `1.5px solid ${theme.primary}` }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {data.schoolLogoUrl && !logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.schoolLogoUrl}
              alt={data.schoolName}
              onError={() => setLogoError(true)}
              className="w-4 h-4 object-contain rounded-full shrink-0"
            />
          ) : (
            <div
              className="w-4 h-4 rounded-full text-white flex items-center justify-center text-[6px] font-bold shrink-0"
              style={{ backgroundColor: theme.primary }}
            >
              {schoolInitials || "S"}
            </div>
          )}
          <span
            className="text-[7.5px] font-black uppercase truncate"
            style={{ color: theme.primary }}
          >
            {data.schoolName}
          </span>
        </div>

        <span
          className="text-[6px] font-black uppercase tracking-wider px-1 py-0.2 rounded text-white"
          style={{ backgroundColor: theme.accent }}
        >
          {data.academicYearName}
        </span>
      </div>

      {/* Structured 2-Column Body */}
      <div className="flex items-center gap-2.5 py-1 flex-1 min-h-0">
        {/* Photo with clean thin frame */}
        <div
          className="w-[20mm] h-[25mm] rounded border overflow-hidden bg-gray-50 flex flex-col items-center justify-center shrink-0"
          style={{ borderColor: theme.primary }}
        >
          {data.photoUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photoUrl}
              alt={data.fullName}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <span className="text-xs font-bold text-gray-400 block">{initials}</span>
              <span className="text-[5px] text-gray-400 uppercase">PHOTO</span>
            </div>
          )}
        </div>

        {/* Data Fields */}
        <div className="flex-1 min-w-0 space-y-0.5 text-[6.5px]">
          <div>
            <span className="text-[5px] text-[#777777] uppercase block">Student Name</span>
            <strong className="text-[8px] font-black text-black uppercase truncate block leading-tight">
              {data.fullName}
            </strong>
          </div>

          <div className="grid grid-cols-2 gap-1 pt-0.2">
            <div>
              <span className="text-[5px] text-[#777777] uppercase block">Reg Number</span>
              <span
                className="font-mono font-black text-[7px] block"
                style={{ color: theme.accent }}
              >
                {data.matricule}
              </span>
            </div>
            <div>
              <span className="text-[5px] text-[#777777] uppercase block">Class Stream</span>
              <strong className="text-[7px] text-black block truncate">{data.fullClassName}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 pt-0.2">
            <div>
              <span className="text-[5px] text-[#777777] uppercase block">Birth Date</span>
              <span className="text-[6px] text-gray-800">{data.dateOfBirth || "N/A"}</span>
            </div>
            <div>
              <span className="text-[5px] text-[#777777] uppercase block">Gender</span>
              <span className="text-[6px] text-gray-800">{data.gender === "M" ? "Male" : "Female"}</span>
            </div>
          </div>

          {data.guardianPhone && config.showEmergencyContact && (
            <div className="pt-0.2">
              <span className="text-[5px] text-[#777777] uppercase block">Emergency Phone</span>
              <span className="font-mono text-[6px] text-gray-800">{data.guardianPhone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Clean Bottom Barcode and Signature */}
      <div
        className="pt-1 flex items-center justify-between"
        style={{ borderTop: `1px solid ${theme.primary}30` }}
      >
        <div className="flex flex-col">
          {config.showBarcode && (
            <BarcodeSVG value={data.matricule} width={95} height={14} showText={false} />
          )}
          <span className="font-mono text-[5px] text-gray-600">ID: {data.matricule}</span>
        </div>

        <div className="text-right">
          <span className="text-[5px] text-gray-500 uppercase block">
            {config.signatoryTitle || "Head of Institution"}
          </span>
          <div className="w-14 border-b border-gray-400 h-2" />
        </div>
      </div>
    </div>
  );
}
