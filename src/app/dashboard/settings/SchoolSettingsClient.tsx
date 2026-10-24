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
  AlertCircle 
} from "lucide-react";

interface Props {
  school: School;
}

export default function SchoolSettingsClient({ school }: Props) {
  const [rankingMode, setRankingMode] = useState<string>(school.ranking_mode || "enabled");
  const [approvalWorkflow, setApprovalWorkflow] = useState<string>(
    school.result_approval_workflow || "hod"
  );
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set("ranking_mode", rankingMode);
    formData.set("result_approval_workflow", approvalWorkflow);

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
