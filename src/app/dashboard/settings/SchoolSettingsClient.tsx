"use client";

import { useState } from "react";
import { AcademicYear, School } from "@/types/database";
import {
  createAcademicYearAction,
  setCurrentAcademicYearAction,
  updateSchoolSettingsAction,
} from "./actions";
import { 
  Building2, 
  Sliders, 
  Receipt, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  CalendarRange,
} from "lucide-react";

interface Props {
  school: School;
  academicYears: AcademicYear[];
}

export default function SchoolSettingsClient({ school, academicYears }: Props) {
  const [rankingMode, setRankingMode] = useState<string>(school.ranking_mode || "enabled");
  const [approvalWorkflow, setApprovalWorkflow] = useState<string>(
    school.result_approval_workflow || "hod"
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(school.logo_url || null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const sortedYears = [...academicYears].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );
  const currentYear = sortedYears.find((year) => year.is_current) ?? sortedYears[0] ?? null;

  async function handleAcademicYearCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const formData = new FormData(event.currentTarget);

    try {
      await createAcademicYearAction(formData);
      event.currentTarget.reset();
      setStatusMessage({ type: "success", text: "Academic year created and initialized with terms." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not create the academic year.";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleSetCurrentAcademicYear(academicYearId: string) {
    setLoading(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.set("academicYearId", academicYearId);

    try {
      await setCurrentAcademicYearAction(formData);
      setStatusMessage({ type: "success", text: "Current school year updated." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not update the current academic year.";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  }

  function handleLogoSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "Please choose a valid image file for the school logo." });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Logo files must be 2MB or smaller." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(String(reader.result || ""));
      setStatusMessage({ type: "success", text: "Logo preview updated. Save settings to apply it to official school documents." });
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set("ranking_mode", rankingMode);
    formData.set("result_approval_workflow", approvalWorkflow);
    formData.set("logo_url", logoPreview || "");

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

      <div className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8DFC9]">
          <CalendarRange className="w-4 h-4 text-[#2A7C13]" />
          <h3 className="font-bold text-[14px] text-[#142010]">
            Academic Year Setup
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
          <div className="space-y-3 rounded-[6px] border border-[#E8DFC9] bg-white p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#777777]">Current school year</p>
              <h4 className="mt-1 text-lg font-bold text-[#142010]">
                {currentYear ? currentYear.name : "No academic year set"}
              </h4>
            </div>

            {currentYear ? (
              <p className="text-xs text-[#666666]">
                {new Date(currentYear.start_date).toLocaleDateString()} to {new Date(currentYear.end_date).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-xs text-[#666666]">
                Create the current academic year and the app will automatically prepare the 3-term cycle and 6 sequences for each term.
              </p>
            )}

            <div className="space-y-2 text-xs">
              {sortedYears.length === 0 ? (
                <p className="text-[#777777]">No years configured yet.</p>
              ) : (
                sortedYears.map((year) => (
                  <div key={year.id} className="flex items-center justify-between gap-3 rounded-[5px] border border-[#E8DFC9] bg-[#FAF7F0] p-2.5">
                    <div>
                      <p className="font-semibold text-[#142010]">{year.name}</p>
                      <p className="text-[10px] text-[#666666]">
                        {new Date(year.start_date).toLocaleDateString()} — {new Date(year.end_date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {year.is_current && (
                        <span className="rounded-full border border-[#C3E4BC] bg-[#EBF5E9] px-2 py-0.5 text-[10px] font-semibold text-[#1F5C0E]">
                          Current
                        </span>
                      )}
                      {!year.is_current && (
                        <button
                          type="button"
                          onClick={() => handleSetCurrentAcademicYear(year.id)}
                          disabled={loading}
                          className="rounded-[5px] border border-[#D5CBB2] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#142010] hover:bg-[#F9F6ED] disabled:opacity-50"
                        >
                          Set current
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={handleAcademicYearCreate} className="space-y-3 rounded-[6px] border border-[#E8DFC9] bg-[#FAF7F0] p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold text-[#777777]">Add School Year</p>
              <h4 className="mt-1 text-sm font-bold text-[#142010]">Create a new academic cycle</h4>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[#444444]">Academic year name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="2026/2027"
                className="w-full rounded-[5px] border border-[#D5CBB2] bg-white px-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#444444]">Start date</label>
                <input
                  type="date"
                  name="start_date"
                  required
                  className="w-full rounded-[5px] border border-[#D5CBB2] bg-white px-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[#444444]">End date</label>
                <input
                  type="date"
                  name="end_date"
                  required
                  className="w-full rounded-[5px] border border-[#D5CBB2] bg-white px-3 py-2 text-xs text-[#142010] focus:border-[#2A7C13] focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-[#444444]">
              <input type="checkbox" name="is_current" className="h-4 w-4 rounded border-[#D5CBB2] text-[#2A7C13] focus:ring-[#2A7C13]" />
              Set this as the current school year
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-[5px] bg-[#191919] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#333333] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create academic year"}
            </button>
          </form>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Institution Profile */}
        <div className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8DFC9]">
            <Building2 className="w-4 h-4 text-[#2A7C13]" />
            <h3 className="font-bold text-[14px] text-[#142010]">
              School Details
            </h3>
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
                    ? "English-speaking system"
                    : school.subsystem === "francophone"
                    ? "French-speaking system"
                    : "Bilingual system"
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

        {/* Official Document Branding */}
        <div className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E8DFC9]">
            <Building2 className="w-4 h-4 text-[#2A7C13]" />
            <h3 className="font-bold text-[14px] text-[#142010]">
              School Identity for Official Documents
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-5 items-center">
            <div className="flex flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-[#D5CBB2] bg-white p-4">
              <div className="w-24 h-24 rounded-full border border-[#D5CBB2] bg-[#F7F3E8] flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="School logo preview" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-[11px] font-bold text-[#567847]">No logo</span>
                )}
              </div>
              <div className="flex gap-2">
                <label className="inline-flex cursor-pointer items-center justify-center px-3 py-2 rounded-[5px] bg-[#2A7C13] text-white text-[11px] font-semibold hover:bg-[#236810]">
                  Upload logo
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoSelection} />
                </label>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoPreview(null);
                      setStatusMessage({ type: "success", text: "School logo removed from preview. Save to clear it from official school documents." });
                    }}
                    className="px-3 py-2 rounded-[5px] border border-[#D5CBB2] bg-white text-[#142010] text-[11px] font-semibold hover:bg-[#F9F6ED]"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#444444]">
              <p className="font-bold text-[#142010]">School-wide document branding</p>
              <p>The uploaded logo is used on official school documents, including report cards and fee receipts.</p>
              <p className="text-[#666666]">Accepted formats: PNG, JPG, and WEBP. Maximum size: 2MB.</p>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-xs text-[#777777]">
            <ShieldCheck className="w-4 h-4 text-[#2A7C13]" />
            <span>Changes are committed directly with audit logging</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-[5px] bg-[#2A7C13] text-white font-semibold text-xs hover:bg-[#236810] shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? "Saving Parameters..." : "Save Settings Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
