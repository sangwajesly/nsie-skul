"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Database, 
  RotateCcw, 
  Trash2, 
  Lock, 
  Sparkles,
  HelpCircle,
  ExternalLink,
  Loader2,
  Calendar,
  XCircle,
  FileSpreadsheet
} from "lucide-react";
import type { School } from "@/types/database";
import { 
  exportCompleteSchoolArchive, 
  exportSchoolModuleCsvAction, 
  restoreSchoolFromBackupAction, 
  requestSchoolDeletionAction, 
  cancelSchoolDeletionAction,
  type NseiSukulBackupArchive
} from "./data-privacy-actions";

interface Props {
  school: School;
}

export default function SchoolDataPrivacyClient({ school }: Props) {
  // Export states
  const [isExportingArchive, setIsExportingArchive] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState<string | null>(null);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [exportErrorMsg, setExportErrorMsg] = useState<string | null>(null);

  // Restore states
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<NseiSukulBackupArchive | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // Deletion modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmationName, setConfirmationName] = useState("");
  const [deletionReason, setDeletionReason] = useState("");
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);

  // Helper: Trigger browser download for text/json/csv
  const downloadBlob = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. One-Click Takeout Export (.json)
  const handleExportFullArchive = async () => {
    setIsExportingArchive(true);
    setExportSuccessMsg(null);
    setExportErrorMsg(null);

    try {
      const res = await exportCompleteSchoolArchive();
      if (!res.success || !res.archive) {
        throw new Error(res.error || "Failed to generate complete backup archive.");
      }

      const jsonStr = JSON.stringify(res.archive, null, 2);
      const code = res.archive.school.code || "SCHOOL";
      const date = new Date().toISOString().split("T")[0];
      const filename = `nsei-sukul-backup-${code}-${date}.json`;

      downloadBlob(jsonStr, filename, "application/json");
      setExportSuccessMsg(
        `Complete school backup successfully exported! (Found ${res.archive.statistics.students_count} students, ${res.archive.statistics.classes_count} classes, and ${res.archive.statistics.marks_count} marks).`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Export failed";
      setExportErrorMsg(msg);
    } finally {
      setIsExportingArchive(false);
    }
  };

  // 2. Quick CSV Module Export
  const handleExportCsv = async (module: "students" | "marks" | "fees") => {
    setIsExportingCsv(module);
    setExportSuccessMsg(null);
    setExportErrorMsg(null);

    try {
      const res = await exportSchoolModuleCsvAction(module);
      if (!res.success || !res.csvContent || !res.filename) {
        throw new Error(res.error || `Failed to export ${module} CSV.`);
      }

      downloadBlob(res.csvContent, res.filename, "text/csv;charset=utf-8;");
      setExportSuccessMsg(`Successfully generated ${res.filename} for Microsoft Excel!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "CSV export failed";
      setExportErrorMsg(msg);
    } finally {
      setIsExportingCsv(null);
    }
  };

  // 3. Handle Backup File Selection for Restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    setRestoreError(null);
    setRestoreSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text) as NseiSukulBackupArchive;

        if (parsed.export_format_version !== "1.0" || parsed.system !== "Nsei Sukul Management System") {
          throw new Error("This file does not appear to be an official Nsei Sukul backup archive.");
        }

        setRestorePreview(parsed);
      } catch (err: unknown) {
        setRestorePreview(null);
        setRestoreError(err instanceof Error ? err.message : "Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // 4. Confirm & Execute Restore
  const handleExecuteRestore = async () => {
    if (!restorePreview || !restoreFile) return;

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const text = evt.target?.result as string;
          const res = await restoreSchoolFromBackupAction(text);
          if (!res.success || !res.restoredSummary) {
            throw new Error(res.error || "Failed to restore school data.");
          }

          setRestoreSuccess(
            `Restoration completed successfully! Restored ${res.restoredSummary.studentsCount} students, ${res.restoredSummary.classesCount} classes, and ${res.restoredSummary.marksCount} assessment marks.`
          );
          setRestorePreview(null);
          setRestoreFile(null);
        } catch (innerErr: unknown) {
          setRestoreError(innerErr instanceof Error ? innerErr.message : "Restoration failed.");
        } finally {
          setIsRestoring(false);
        }
      };
      reader.readAsText(restoreFile);
    } catch (err: unknown) {
      setRestoreError(err instanceof Error ? err.message : "Restoration failed.");
      setIsRestoring(false);
    }
  };

  // 5. Submit Deletion Request
  const handleSubmitDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDeletion(true);
    setDeletionError(null);

    try {
      const formData = new FormData();
      formData.set("confirmationName", confirmationName);
      formData.set("reason", deletionReason);

      const res = await requestSchoolDeletionAction(formData);
      if (!res.success) {
        throw new Error(res.error || "Failed to request school deletion.");
      }

      setIsDeleteModalOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      setDeletionError(err instanceof Error ? err.message : "Deletion request failed");
    } finally {
      setIsSubmittingDeletion(false);
    }
  };

  // 6. Cancel Pending Deletion
  const handleCancelDeletion = async () => {
    if (!confirm("Are you sure you want to cancel the scheduled deletion and reactivate this school?")) {
      return;
    }

    setIsCancellingDeletion(true);
    try {
      const res = await cancelSchoolDeletionAction();
      if (!res.success) {
        throw new Error(res.error || "Failed to cancel deletion.");
      }
      window.location.reload();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to cancel deletion.");
    } finally {
      setIsCancellingDeletion(false);
    }
  };

  const isPendingDeletion = school.deletion_status === "pending_deletion";
  const scheduledDateFormatted = school.deletion_scheduled_for
    ? new Date(school.deletion_scheduled_for).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-8">
      {/* PENDING DELETION WARNING BANNER */}
      {isPendingDeletion && (
        <div className="p-5 rounded-[10px] bg-red-50 border-2 border-red-300 text-red-900 space-y-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-extrabold text-red-900">
                School Scheduled for Permanent Erasure
              </div>
              <p className="text-xs text-red-700 leading-relaxed">
                A deletion request was submitted for <strong>{school.name}</strong>. In accordance with our safe 30-day cooling-off protocol, all school records will be permanently purged on <strong>{scheduledDateFormatted}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-red-200">
            <span className="text-[11px] text-red-700 font-medium">
              You can cancel this deletion at any time before the deadline.
            </span>
            <button
              onClick={handleCancelDeletion}
              disabled={isCancellingDeletion}
              className="px-4 py-2 rounded-[6px] bg-red-700 hover:bg-red-800 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isCancellingDeletion ? "Restoring School…" : "Cancel Deletion & Restore School"}</span>
            </button>
          </div>
        </div>
      )}

      {/* LEGAL DATA SOVEREIGNTY CHARTER */}
      <div className="bg-white border border-[#E8DFC9] rounded-[10px] p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EFEA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#142010] text-[#4ADE80] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#142010]">
                Institutional Data Sovereignty &amp; Privacy Charter
              </h2>
              <p className="text-xs text-[#666666]">
                Compliant with Cameroon Law No. 2024/017 on Personal Data Protection and MINESEC regulations.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Institutional Ownership</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-[#444444]">
          <div className="p-3.5 rounded-[8px] bg-[#FAF8F5] border border-[#E8DFC9] space-y-1.5">
            <div className="font-bold text-[#142010] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#2A7C13]" />
              <span>Your Data Belongs to You</span>
            </div>
            <p className="text-[11px] text-[#666666] leading-relaxed">
              The school retains exclusive ownership of all student rosters, evaluation marks, and fee ledgers. Nsei Sukul claims zero ownership and never sells your data.
            </p>
          </div>

          <div className="p-3.5 rounded-[8px] bg-[#FAF8F5] border border-[#E8DFC9] space-y-1.5">
            <div className="font-bold text-[#142010] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#2A7C13]" />
              <span>Zero-Hostage Guarantee</span>
            </div>
            <p className="text-[11px] text-[#666666] leading-relaxed">
              Even if your school subscription expires, student records are NEVER deleted or locked. You always maintain full read-only and export privileges.
            </p>
          </div>

          <div className="p-3.5 rounded-[8px] bg-[#FAF8F5] border border-[#E8DFC9] space-y-1.5">
            <div className="font-bold text-[#142010] flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-[#2A7C13]" />
              <span>The Boomerang Guarantee</span>
            </div>
            <p className="text-[11px] text-[#666666] leading-relaxed">
              If you ever leave and decide to return in the future, your saved backup file can be restored with a single click in under 15 seconds.
            </p>
          </div>
        </div>
      </div>

      {/* STATUS NOTIFICATIONS */}
      {exportSuccessMsg && (
        <div className="p-3.5 rounded-[6px] bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2A7C13]" />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {exportErrorMsg && (
        <div className="p-3.5 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{exportErrorMsg}</span>
        </div>
      )}

      {/* SECTION 1: ONE-CLICK COMPREHENSIVE TAKEOUT */}
      <div className="bg-white border border-[#E8DFC9] rounded-[10px] p-6 space-y-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#142010]">
              1. School Data Takeout &amp; Portability
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EBF5E9] text-[#2A7C13]">
              Recommended for Off-Site Backup
            </span>
          </div>
          <p className="text-xs text-[#666666] mt-0.5">
            Download your complete school database to store on an external hard drive, USB flash drive, or cloud repository.
          </p>
        </div>

        {/* Hero Full Takeout Card */}
        <div className="p-5 rounded-[8px] border-2 border-[#2A7C13]/30 bg-[#F0FDF4]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-[#166534] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#2A7C13]" />
              <span>Complete School Backup Archive (.json)</span>
            </div>
            <p className="text-xs text-[#2A7C13] leading-relaxed max-w-xl">
              Contains 100% of your school data (classes, subjects, student records, continuous assessment marks, CBA evaluations, and fee transactions). Machine-readable and 1-click restorable anytime.
            </p>
            {school.last_data_export_at && (
              <span className="text-[10px] text-[#666666] block pt-1">
                Last full archive exported on: {new Date(school.last_data_export_at).toLocaleString("en-GB")}
              </span>
            )}
          </div>

          <button
            onClick={handleExportFullArchive}
            disabled={isExportingArchive}
            className="px-5 py-2.5 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shrink-0 shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isExportingArchive ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting Archive…</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Backup Archive (.json)</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Excel/CSV Exports */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold text-[#142010]">
            Export Individual Spreadsheets for Microsoft Excel:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Students CSV */}
            <div className="p-4 rounded-[8px] border border-[#E8DFC9] bg-[#FAF8F5] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#142010] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#2A7C13]" />
                  <span>Students Directory</span>
                </div>
                <p className="text-[11px] text-[#666666] leading-snug">
                  Matricules, names, birth dates, parents, and current class streams.
                </p>
              </div>

              <button
                onClick={() => handleExportCsv("students")}
                disabled={isExportingCsv === "students"}
                className="w-full py-1.5 px-3 rounded-[5px] bg-white hover:bg-[#F0EFEA] border border-[#D5CBB2] text-[#142010] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isExportingCsv === "students" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-[#2A7C13]" />
                )}
                <span>Export Students (.csv)</span>
              </button>
            </div>

            {/* Marks CSV */}
            <div className="p-4 rounded-[8px] border border-[#E8DFC9] bg-[#FAF8F5] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#142010] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#2A7C13]" />
                  <span>Assessment Marks Ledger</span>
                </div>
                <p className="text-[11px] text-[#666666] leading-snug">
                  All continuous assessment marks (Seq 1–6) and CBA evaluations.
                </p>
              </div>

              <button
                onClick={() => handleExportCsv("marks")}
                disabled={isExportingCsv === "marks"}
                className="w-full py-1.5 px-3 rounded-[5px] bg-white hover:bg-[#F0EFEA] border border-[#D5CBB2] text-[#142010] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isExportingCsv === "marks" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-[#2A7C13]" />
                )}
                <span>Export Marks (.csv)</span>
              </button>
            </div>

            {/* Fees CSV */}
            <div className="p-4 rounded-[8px] border border-[#E8DFC9] bg-[#FAF8F5] flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#142010] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#2A7C13]" />
                  <span>Bursary &amp; Fee Receipts</span>
                </div>
                <p className="text-[11px] text-[#666666] leading-snug">
                  Official fee payment receipts, amounts, payer details, and dates.
                </p>
              </div>

              <button
                onClick={() => handleExportCsv("fees")}
                disabled={isExportingCsv === "fees"}
                className="w-full py-1.5 px-3 rounded-[5px] bg-white hover:bg-[#F0EFEA] border border-[#D5CBB2] text-[#142010] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isExportingCsv === "fees" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-[#2A7C13]" />
                )}
                <span>Export Fees (.csv)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: THE BOOMERANG — RESTORE SCHOOL FROM BACKUP */}
      <div className="bg-white border border-[#E8DFC9] rounded-[10px] p-6 space-y-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#142010]">
              2. Easy Return: Restore from Backup Archive
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFF8CF] text-[#7A5B00]">
              The Boomerang Engine
            </span>
          </div>
          <p className="text-xs text-[#666666] mt-0.5">
            Returning to Nsei Sukul or restoring previous academic sessions? Upload your saved `.json` backup file to reconstruct all classes, students, and marks in seconds.
          </p>
        </div>

        {restoreSuccess && (
          <div className="p-3.5 rounded-[6px] bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2A7C13]" />
            <span>{restoreSuccess}</span>
          </div>
        )}

        {restoreError && (
          <div className="p-3.5 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{restoreError}</span>
          </div>
        )}

        {/* Upload Dropzone */}
        {!restorePreview ? (
          <div className="border-2 border-dashed border-[#D5CBB2] hover:border-[#2A7C13] rounded-[8px] p-6 text-center transition-colors bg-[#FAF8F5]">
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
              id="backup-file-upload"
            />
            <label
              htmlFor="backup-file-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-[#EBF5E9] text-[#2A7C13] flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#142010]">
                Choose or drop your Nsei Sukul Backup Archive (.json)
              </div>
              <p className="text-[11px] text-[#777777]">
                Only official .json files exported from Nsei Sukul are accepted.
              </p>
            </label>
          </div>
        ) : (
          /* Preview Verification Card */
          <div className="border border-[#2A7C13]/30 bg-[#F0FDF4]/30 rounded-[8px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#142010]">
                <CheckCircle2 className="w-4 h-4 text-[#2A7C13]" />
                <span>Backup Archive Verified</span>
              </div>
              <button
                onClick={() => {
                  setRestorePreview(null);
                  setRestoreFile(null);
                }}
                className="text-[11px] text-red-600 hover:underline cursor-pointer"
              >
                Choose another file
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded bg-white border border-[#E8DFC9]">
                <span className="text-[10px] text-[#777777] block">Original School</span>
                <span className="font-bold text-[#142010] truncate block">
                  {restorePreview.school.name}
                </span>
              </div>
              <div className="p-2.5 rounded bg-white border border-[#E8DFC9]">
                <span className="text-[10px] text-[#777777] block">Students</span>
                <span className="font-bold text-[#142010] block">
                  {restorePreview.statistics.students_count} records
                </span>
              </div>
              <div className="p-2.5 rounded bg-white border border-[#E8DFC9]">
                <span className="text-[10px] text-[#777777] block">Classes</span>
                <span className="font-bold text-[#142010] block">
                  {restorePreview.statistics.classes_count} classes
                </span>
              </div>
              <div className="p-2.5 rounded bg-white border border-[#E8DFC9]">
                <span className="text-[10px] text-[#777777] block">Marks History</span>
                <span className="font-bold text-[#142010] block">
                  {restorePreview.statistics.marks_count} grades
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E8DFC9]">
              <span className="text-[11px] text-[#555555]">
                Exported on: {new Date(restorePreview.export_date).toLocaleString("en-GB")}
              </span>

              <button
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-5 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring School Records…</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm &amp; Restore School Records</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: THE DANGER ZONE (SAFE 30-DAY DELETION PROTOCOL) */}
      <div className="bg-white border border-red-200 rounded-[10px] p-6 space-y-6 shadow-2xs">
        <div className="border-b border-red-100 pb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-red-900">
              3. School Offboarding &amp; Account Deletion
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
              Danger Zone
            </span>
          </div>
          <p className="text-xs text-red-700 mt-0.5">
            Follow the safe, compliant offboarding procedure to deactivate and permanently purge this school&apos;s records.
          </p>
        </div>

        <div className="space-y-3 text-xs text-[#555555]">
          <div className="font-bold text-[#142010]">
            Our Safe 30-Day Cooling-Off Protocol (Protecting You &amp; Your School):
          </div>
          <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-[#666666]">
            <li>
              <strong>No Instant Accidents</strong>: We never permanently destroy records instantaneously. This prevents rogue staff sabotage, accidental clicks, or unauthorized account compromises.
            </li>
            <li>
              <strong>Mandatory Backup</strong>: Please download the complete school backup archive before submitting a deletion request so your records remain safe in your custody.
            </li>
            <li>
              <strong>30-Day Grace Window</strong>: Your school will enter a 30-day deactivation period. During this window, you can cancel deletion with a single click.
            </li>
            <li>
              <strong>Permanent Purge</strong>: After 30 days, all cloud records, assessment marks, student profiles, and sync logs are permanently erased from disk under Law No. 2024/017.
            </li>
          </ul>
        </div>

        <div className="pt-2 flex justify-end">
          {isPendingDeletion ? (
            <button
              onClick={handleCancelDeletion}
              disabled={isCancellingDeletion}
              className="px-4 py-2.5 rounded-[6px] bg-red-700 hover:bg-red-800 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel Pending Deletion</span>
            </button>
          ) : (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2.5 rounded-[6px] bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Request School Deactivation &amp; Deletion</span>
            </button>
          )}
        </div>
      </div>

      {/* MULTI-STEP DELETION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E8DFC9] rounded-[12px] max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-red-900">
                  Request School Deactivation &amp; Deletion
                </h4>
                <p className="text-xs text-red-700">
                  This action begins the 30-day cooling-off offboarding lifecycle for <strong>{school.name}</strong>.
                </p>
              </div>
            </div>

            {deletionError && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {deletionError}
              </div>
            )}

            <form onSubmit={handleSubmitDeletion} className="space-y-4">
              <div className="p-3.5 rounded-[6px] bg-[#FAF8F5] border border-[#E8DFC9] space-y-2 text-xs">
                <span className="font-bold text-[#142010] block">
                  Step 1: Have you saved a copy of your school data?
                </span>
                <p className="text-[11px] text-[#666666]">
                  If not, please download your backup archive before continuing so your school records are not lost.
                </p>
                <button
                  type="button"
                  onClick={handleExportFullArchive}
                  disabled={isExportingArchive}
                  className="px-3 py-1.5 rounded bg-white hover:bg-[#F0EFEA] border border-[#D5CBB2] text-[#142010] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#2A7C13]" />
                  <span>Download Backup Archive Now</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142010] mb-1">
                  Step 2: Type &ldquo;{school.name}&rdquo; to confirm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={confirmationName}
                  onChange={(e) => setConfirmationName(e.target.value)}
                  placeholder={school.name}
                  required
                  className="w-full px-3 py-2 border border-[#D5CBB2] rounded-[5px] text-xs text-[#142010] focus:outline-none focus:border-red-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#555555] mb-1">
                  Step 3: Reason for departure <em className="text-[#888888] font-normal">(optional feedback)</em>
                </label>
                <textarea
                  rows={2}
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="e.g., School is closing, testing account, switching administrative model..."
                  className="w-full px-3 py-2 border border-[#D5CBB2] rounded-[5px] text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0EFEA]">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isSubmittingDeletion}
                  className="px-4 py-2 rounded-[6px] border border-[#D5CBB2] text-xs font-semibold text-[#555555] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmittingDeletion ||
                    confirmationName.trim().toLowerCase() !== school.name.trim().toLowerCase()
                  }
                  className="px-5 py-2 rounded-[6px] bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingDeletion ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scheduling Deletion…</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Schedule 30-Day Deletion</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
