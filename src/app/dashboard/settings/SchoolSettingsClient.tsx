"use client";

import { useState } from "react";
import { School } from "@/types/database";
import { updateSchoolSettingsAction } from "./actions";
import { 
  Building2, 
  Sliders, 
  Receipt, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Trash2,
  IdCard,
  LayoutGrid,
  FileText,
  Award,
  Eye,
} from "lucide-react";
import { ReportCardSampleModal } from "@/components/academic/ReportCardSampleModal";
import type { ReportCardTemplateType } from "@/components/academic/ReportCardRenderer";

interface Props {
  school: School;
}

export default function SchoolSettingsClient({ school }: Props) {
  const [rankingMode, setRankingMode] = useState<string>(school.ranking_mode || "enabled");
  const [approvalWorkflow, setApprovalWorkflow] = useState<string>(
    school.result_approval_workflow || "hod"
  );
  const [matriculeFormat, setMatriculeFormat] = useState<string>(
    school.matricule_format || "{CODE}-{YEAR}-{SEQ:4}"
  );
  const [reportCardTemplate, setReportCardTemplate] = useState<string>(
    school.report_card_template || "cba_grouped_classic"
  );
  const [logoUrl, setLogoUrl] = useState<string>(school.logo_url || "");
  const [logoError, setLogoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ReportCardTemplateType>("cba_grouped_classic");

  const openSamplePreview = (template: ReportCardTemplateType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPreviewTemplate(template);
    setIsSampleModalOpen(true);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Please choose an image under 2 MB.");
      return;
    }

    setLogoError(null);
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        setLogoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set("ranking_mode", rankingMode);
    formData.set("result_approval_workflow", approvalWorkflow);
    formData.set("matricule_format", matriculeFormat);
    formData.set("logo_url", logoUrl);

    try {
      await updateSchoolSettingsAction(formData);
      setStatusMessage({ type: "success", text: "School parameters successfully saved and synchronized!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update school settings";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="school-settings" className="space-y-6">
      {statusMessage && (
        <div
          className={`flex items-center gap-2.5 p-3 rounded-[6px] text-xs font-medium border ${
            statusMessage.type === "success"
              ? "bg-[#F3F9F1] border-[#C3E4BC] text-[#1F5C0E]"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2A7C13]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Institution Profile */}
        <div className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8DFC9]">
            <Building2 className="w-4 h-4 text-[#2A7C13]" />
            <h3 className="font-bold text-[14px] text-[#142010]">
              School Details
            </h3>
          </div>

          {/* School Emblem / Logo Uploader */}
          <div className="p-4 rounded-[6px] border border-[#E8DFC9] bg-white flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#D5CBB2] flex items-center justify-center overflow-hidden bg-[#FAF7EE] shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="School Logo"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-1 text-[#888888]">
                  <ImageIcon className="w-6 h-6 mb-0.5 text-[#B8A882]" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">No Logo</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-bold text-[13px] text-[#142010]">School Official Seal / Logo</h4>
                <p className="text-[11px] text-[#666666]">
                  This logo automatically appears on student report cards, official fee payment receipts, and the top navigation.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#142010] hover:bg-[#2A7C13] text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{logoUrl ? "Change School Logo" : "Upload School Logo"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoFileChange}
                  />
                </label>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[5px] border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Logo</span>
                  </button>
                )}
              </div>

              {logoError && (
                <p className="text-[11px] text-red-600 font-semibold">{logoError}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-[#444444] mb-1">
                School Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                defaultValue={school.name}
                required
                className="w-full px-3 py-2 border border-[#D5CBB2] rounded-[5px] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#444444] mb-1">
                Official Motto / Slogan
              </label>
              <input
                type="text"
                name="motto"
                defaultValue={school.motto || ""}
                placeholder="e.g. Honor - Labor - Fatherland"
                className="w-full px-3 py-2 border border-[#D5CBB2] rounded-[5px] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#444444] mb-1">
                School Registration Code
              </label>
              <input
                type="text"
                name="code"
                defaultValue={school.code || ""}
                placeholder="e.g. GBHS-BDA"
                className="w-full px-3 py-2 border border-[#D5CBB2] rounded-[5px] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#444444] mb-1">
                School System
              </label>
              <input
                type="text"
                disabled
                value={
                  school.subsystem === "anglophone"
                    ? "English Curriculum"
                    : school.subsystem === "francophone"
                    ? "French Curriculum"
                    : "Bilingual Curriculum"
                }
                className="w-full px-3 py-2 border border-[#E8DFC9] rounded-[5px] bg-[#F7F3E8] text-[#777777] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-medium text-[#444444] mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                name="phone"
                defaultValue={school.phone || ""}
                placeholder="+237 6xx xx xx xx"
                className="w-full px-3 py-2 border border-[#D5CBB2] rounded-[5px] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#444444] mb-1">
                Contact Email
              </label>
              <input
                type="email"
                name="email"
                defaultValue={school.email || ""}
                placeholder="administration@school.cm"
                className="w-full px-3 py-2 border border-[#D5CBB2] rounded-[5px] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-[#444444] mb-1">
                Campus Postal Address
              </label>
              <input
                type="text"
                name="address"
                defaultValue={school.address || ""}
                placeholder="P.O. Box 24, Up-Station, Bamenda, Cameroon"
                className="w-full px-3 py-2 border border-[#D5CBB2] rounded-[5px] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pedagogic & Report Card Policies */}
        <div className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8DFC9]">
            <Sliders className="w-4 h-4 text-[#2A7C13]" />
            <h3 className="font-bold text-[14px] text-[#142010]">
              Report Card Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Ranking Mode */}
            <div className="space-y-2">
              <label className="block font-bold text-[#142010]">
                Student Class Ranking on Report Cards
              </label>
              <p className="text-[#666666] leading-relaxed text-[11px]">
                Choose whether a student&apos;s position in class appears on report cards.
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setRankingMode("enabled")}
                  className={`flex-1 py-2 px-3 rounded-[5px] border font-medium text-center transition-all ${
                    rankingMode === "enabled"
                      ? "bg-[#2A7C13] border-[#2A7C13] text-white shadow-sm"
                      : "bg-white border-[#D5CBB2] text-[#444444] hover:bg-[#F9F6ED]"
                  }`}
                >
                  Show class position
                </button>
                <button
                  type="button"
                  onClick={() => setRankingMode("disabled")}
                  className={`flex-1 py-2 px-3 rounded-[5px] border font-medium text-center transition-all ${
                    rankingMode === "disabled"
                      ? "bg-[#2A7C13] border-[#2A7C13] text-white shadow-sm"
                      : "bg-white border-[#D5CBB2] text-[#444444] hover:bg-[#F9F6ED]"
                  }`}
                >
                  Hide class position
                </button>
              </div>
            </div>

            {/* Approval Workflow */}
            <div className="space-y-2">
              <label className="block font-bold text-[#142010]">
                Who Approves Marks?
              </label>
              <p className="text-[#666666] leading-relaxed text-[11px]">
                Choose who checks and approves marks before report cards are prepared.
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setApprovalWorkflow("hod")}
                  className={`flex-1 py-2 px-3 rounded-[5px] border font-medium text-center transition-all ${
                    approvalWorkflow === "hod"
                      ? "bg-[#2A7C13] border-[#2A7C13] text-white shadow-sm"
                      : "bg-white border-[#D5CBB2] text-[#444444] hover:bg-[#F9F6ED]"
                  }`}
                >
                  Head of Department
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalWorkflow("principal")}
                  className={`flex-1 py-2 px-3 rounded-[5px] border font-medium text-center transition-all ${
                    approvalWorkflow === "principal"
                      ? "bg-[#2A7C13] border-[#2A7C13] text-white shadow-sm"
                      : "bg-white border-[#D5CBB2] text-[#444444] hover:bg-[#F9F6ED]"
                  }`}
                >
                  Principal Only
                </button>
              </div>
            </div>

            {/* Report Card Template Selector */}
            <div className="md:col-span-2 space-y-2 pt-3 border-t border-[#E8DFC9]">
              <label className="block font-bold text-[#142010]">
                Default Report Card Layout Template
              </label>
              <p className="text-[#666666] leading-relaxed text-[11px]">
                Choose the default official report card template layout used across the school.
              </p>
              <input type="hidden" name="report_card_template" value={reportCardTemplate} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {/* 1. Traditional */}
                <div
                  onClick={() => setReportCardTemplate("traditional_classic")}
                  className={`p-3.5 rounded-[6px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    reportCardTemplate === "traditional_classic"
                      ? "bg-[#F0FDF4] border-[#2A7C13] ring-1 ring-[#2A7C13]"
                      : "bg-white border-[#D5CBB2] hover:bg-[#F9F6ED]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#142010] flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#2A7C13]" />
                        Traditional Numerical System
                      </span>
                      {reportCardTemplate === "traditional_classic" && (
                        <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#666666] leading-tight">
                      Classic Cameroon secondary score sheet with Sequence marks, Term marks, Coefficients, Weighted Totals, Grades (A-F), Class Rankings, and Teacher Remarks, without Competency descriptors.
                    </p>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-[#E8DFC9]/70 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => openSamplePreview("traditional_classic", e)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2A7C13] hover:text-[#20600E] hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Sample</span>
                    </button>
                    {reportCardTemplate === "traditional_classic" && (
                      <span className="text-[10px] font-extrabold text-[#2A7C13] uppercase tracking-wider">
                        Active Choice
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Grouped Classic CBA */}
                <div
                  onClick={() => setReportCardTemplate("cba_grouped_classic")}
                  className={`p-3.5 rounded-[6px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    reportCardTemplate === "cba_grouped_classic"
                      ? "bg-[#F0FDF4] border-[#2A7C13] ring-1 ring-[#2A7C13]"
                      : "bg-white border-[#D5CBB2] hover:bg-[#F9F6ED]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#142010] flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5 text-[#2A7C13]" />
                        Grouped Classic CBA (APC)
                      </span>
                      {reportCardTemplate === "cba_grouped_classic" && (
                        <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#666666] leading-tight">
                      Clean subject groups (Languages/General, Sciences, Practical), sequence marks, term marks, coefficients, class averages &amp; ranks, min/max benchmarks, and dual summary/discipline matrices.
                    </p>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-[#E8DFC9]/70 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => openSamplePreview("cba_grouped_classic", e)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2A7C13] hover:text-[#20600E] hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Sample</span>
                    </button>
                    {reportCardTemplate === "cba_grouped_classic" && (
                      <span className="text-[10px] font-extrabold text-[#2A7C13] uppercase tracking-wider">
                        Active Choice
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. MINESEC Standard Grid */}
                <div
                  onClick={() => setReportCardTemplate("cba_ministry_standard")}
                  className={`p-3.5 rounded-[6px] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    reportCardTemplate === "cba_ministry_standard"
                      ? "bg-[#F0FDF4] border-[#2A7C13] ring-1 ring-[#2A7C13]"
                      : "bg-white border-[#D5CBB2] hover:bg-[#F9F6ED]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#142010] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#2A7C13]" />
                        MINESEC Official CBA Grid
                      </span>
                      {reportCardTemplate === "cba_ministry_standard" && (
                        <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#666666] leading-tight">
                      Full official MINESEC national syllabus competencies table with bulleted competency objectives evaluated per subject and institutional stamps.
                    </p>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-[#E8DFC9]/70 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => openSamplePreview("cba_ministry_standard", e)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2A7C13] hover:text-[#20600E] hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Sample</span>
                    </button>
                    {reportCardTemplate === "cba_ministry_standard" && (
                      <span className="text-[10px] font-extrabold text-[#2A7C13] uppercase tracking-wider">
                        Active Choice
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Bursary & Receipts Configuration */}
        <div className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8DFC9]">
            <Receipt className="w-4 h-4 text-[#2A7C13]" />
            <h3 className="font-bold text-[14px] text-[#142010]">
              Receipt Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-[#444444] mb-1">
                Sequential Receipt Prefix <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="receipt_prefix"
                defaultValue={school.receipt_prefix || "GBHS-REC"}
                required
                placeholder="e.g. GBHS-REC"
                className="w-full px-3 py-2 border border-[#D5CBB2] rounded-[5px] bg-white text-[#142010] font-mono focus:outline-none focus:border-[#2A7C13]"
              />
              <p className="text-[11px] text-[#777777] mt-1">
                Generates: <code className="text-[#2A7C13] font-semibold">{school.receipt_prefix || "GBHS-REC"}-2026-0001</code>
              </p>
            </div>

            <div>
              <label className="block font-medium text-[#444444] mb-1">
                Accounting Currency
              </label>
              <input
                type="text"
                disabled
                value="FCFA (Central African CFA Franc - XAF)"
                className="w-full px-3 py-2 border border-[#E8DFC9] rounded-[5px] bg-[#F7F3E8] text-[#777777] cursor-not-allowed font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Student Identification & Automatic Matricule Format */}
        <div className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8DFC9]">
            <IdCard className="w-4 h-4 text-[#2A7C13]" />
            <h3 className="font-bold text-[14px] text-[#142010]">
              Student Matricule Generation &amp; Numbering
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-[#555555] leading-relaxed text-[12px]">
              Set how unique student admission numbers (matricules) are generated across the school. The matricule follows each student through all academic years and report cards.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-[#444444] mb-1">
                  Matricule Pattern Template <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="matricule_format"
                  value={matriculeFormat}
                  onChange={(e) => setMatriculeFormat(e.target.value)}
                  placeholder="{CODE}-{YEAR}-{SEQ:4}"
                  required
                  className="w-full px-3 py-2 border border-[#D5CBB2] rounded-[5px] bg-white text-[#142010] font-mono text-xs focus:outline-none focus:border-[#2A7C13]"
                />
                <div className="mt-2 p-2.5 rounded-[5px] bg-[#F7F3E8] border border-[#E8DFC9] text-[11px] text-[#555555] space-y-1">
                  <div className="font-semibold text-[#142010]">Supported Pattern Tokens:</div>
                  <ul className="list-disc pl-4 space-y-0.5 font-mono text-[10px]">
                    <li><strong>{"{CODE}"}</strong> &rarr; School Code / Acronym (e.g. {school.code || "GBHS"})</li>
                    <li><strong>{"{YEAR}"}</strong> &rarr; 2-digit academic year (e.g. 26)</li>
                    <li><strong>{"{YEAR:4}"}</strong> &rarr; 4-digit academic year (e.g. 2026)</li>
                    <li><strong>{"{SEQ:4}"}</strong> &rarr; 4-digit sequence number (0001, 0002...)</li>
                    <li><strong>{"{SEQ:3}"}</strong> &rarr; 3-digit sequence number (001, 002...)</li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#444444] mb-1">
                  Live Preview (Next Enrolled Student)
                </label>
                <div className="p-3.5 rounded-[6px] border-2 border-dashed border-[#2A7C13]/40 bg-[#F0FDF4] space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534]">
                    Generated Student Matricule
                  </span>
                  <div className="text-base font-mono font-extrabold text-[#166534]">
                    {matriculeFormat
                      .replace(/{CODE}/gi, school.code || "GBHS")
                      .replace(/{YEAR:4}/gi, "2026")
                      .replace(/{YEAR}/gi, "26")
                      .replace(/{SEQ:(\d+)}/gi, (_, pad) => "1".padStart(Number(pad) || 4, "0"))
                      .replace(/{SEQ}/gi, "0001")}
                  </div>
                  <p className="text-[11px] text-[#2A7C13] leading-snug">
                    When admitting students, this format will pre-fill automatically. Administrators can still override it manually if needed for transfer students.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 text-xs text-[#777777]">
            <ShieldCheck className="w-4 h-4 text-[#2A7C13] shrink-0" />
            <span>Changes are committed directly with audit logging</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded-[5px] bg-[#2A7C13] text-white font-semibold text-xs hover:bg-[#236810] shadow-sm transition-all disabled:opacity-50 cursor-pointer text-center"
          >
            {loading ? "Saving Parameters..." : "Save Settings Changes"}
          </button>
        </div>
      </form>

      {/* Interactive Report Card Sample Modal */}
      <ReportCardSampleModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        selectedTemplate={previewTemplate}
        onApplyTemplate={(tmpl) => {
          setReportCardTemplate(tmpl);
          setStatusMessage({
            type: "success",
            text: `Report card layout changed to "${
              tmpl === "traditional_classic"
                ? "Traditional Numerical System"
                : tmpl === "cba_grouped_classic"
                ? "Grouped Classic CBA (APC)"
                : "MINESEC Official CBA Grid"
            }". Don't forget to save changes below.`,
          });
        }}
      />
    </div>
  );
}
