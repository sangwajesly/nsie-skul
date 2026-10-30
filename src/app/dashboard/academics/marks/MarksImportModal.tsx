"use client";

import { useState, useRef } from "react";
import {
  StudentRowData,
  parseMarksCsv,
  generateMarksCsvTemplate,
  MarksImportResult,
  ParsedMarkRow,
} from "@/lib/academic/marks-import";
import {
  Upload,
  Download,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface MarksImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (importedRows: ParsedMarkRow[]) => void;
  students: StudentRowData[];
  maxMarks: number;
  subjectName: string;
  streamName: string;
  sequenceName: string;
}

export function MarksImportModal({
  isOpen,
  onClose,
  onApply,
  students,
  maxMarks,
  subjectName,
  streamName,
  sequenceName,
}: MarksImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<MarksImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent = generateMarksCsvTemplate(
      students,
      maxMarks,
      subjectName,
      streamName,
      sequenceName
    );
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeSubject = subjectName.replace(/[^a-zA-Z0-9]/g, "_");
    const safeStream = streamName.replace(/[^a-zA-Z0-9]/g, "_");
    const safeSeq = sequenceName.replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("href", url);
    link.setAttribute("download", `Marks_${safeSubject}_${safeStream}_${safeSeq}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      if (uploadedFile.name.endsWith(".csv")) {
        // Fast, zero-overhead browser parse for CSV
        const text = await uploadedFile.text();
        const parsed = parseMarksCsv(text, students, maxMarks);
        setResult(parsed);
      } else if (uploadedFile.name.endsWith(".xlsx") || uploadedFile.name.endsWith(".xls")) {
        // Server parse with ExcelJS for binary Excel files
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("maxMarks", String(maxMarks));

        const res = await fetch("/api/dashboard/marks/import", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to parse Excel file.");
        }

        // Match against existing students
        const matriculeMap = new Map<string, StudentRowData>();
        const nameMap = new Map<string, StudentRowData>();
        for (const s of students) {
          matriculeMap.set(s.matricule.trim().toLowerCase(), s);
          nameMap.set(s.fullName.trim().toLowerCase(), s);
        }

        let matchedCount = 0;
        let unmatchedCount = 0;
        let errorCount = data.errorCount || 0;

        const matchedRows: ParsedMarkRow[] = data.parsedRows.map((r: ParsedMarkRow) => {
          let matchedStudent = r.matricule ? matriculeMap.get(r.matricule.toLowerCase()) : undefined;
          if (!matchedStudent && r.studentName) {
            matchedStudent = nameMap.get(r.studentName.toLowerCase());
          }

          let error = r.error;
          if (matchedStudent) {
            matchedCount++;
          } else {
            unmatchedCount++;
            if (!error && r.matricule) {
              error = `Matricule "${r.matricule}" not found in this class group.`;
            }
          }

          return {
            ...r,
            matchedStudentId: matchedStudent?.studentId,
            matchedStudentName: matchedStudent?.fullName,
            error,
          };
        });

        setResult({
          totalRows: matchedRows.length,
          matchedCount,
          unmatchedCount,
          errorCount,
          parsedRows: matchedRows,
        });
      } else {
        throw new Error("Please upload a .csv, .xlsx, or .xls file.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error reading marks file.");
      setResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    const validRows = result.parsedRows.filter((r) => r.matchedStudentId && !r.error);
    onApply(validRows);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="importModalTitle"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    >
      <div className="bg-white rounded-[12px] border border-[#E5E5DF] shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E5E5DF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-[#F0FDF4] text-[#2A7C13] flex items-center justify-center border border-[#BBF7D0]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 id="importModalTitle" className="font-bold text-sm text-[#191919]">Import Marks from Excel or CSV</h3>
              <p className="text-[11px] text-[#777777]">
                {streamName} · {subjectName} (Out of {maxMarks})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close import dialog"
            className="p-1 rounded-[4px] text-[#888888] hover:text-[#191919] hover:bg-[#F5F5F0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Instructions & Template Download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[8px] bg-[#FAFAF8] border border-[#E5E5DF]">
            <div className="space-y-0.5">
              <span className="font-bold text-[#191919]">Need the right format?</span>
              <p className="text-[#666666] text-[11px]">
                Download a ready-made template already filled with your students&apos; names and matricules.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-white border border-[#D5D5CF] hover:border-[#191919] text-[#191919] text-xs font-semibold shadow-2xs transition-all shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#2A7C13]" />
              <span>Download Template (CSV)</span>
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#D5D5CF] hover:border-[#2A7C13] rounded-[8px] p-6 text-center cursor-pointer bg-[#FFFDF5] transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processFile(f);
              }}
            />
            <Upload className="w-6 h-6 text-[#2A7C13] mx-auto mb-2" />
            <p className="font-semibold text-xs text-[#191919]">
              {file ? file.name : "Click to select or drag & drop a file"}
            </p>
            <p className="text-[11px] text-[#777777] mt-0.5">Supports CSV, Excel (.xlsx, .xls)</p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-[6px] bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {isProcessing && (
            <div className="p-4 text-center text-xs text-[#777777]">
              Reading and matching student records...
            </div>
          )}

          {/* Preview Results */}
          {result && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[6px] bg-[#F5F5F0] text-[11px] font-medium text-[#444444]">
                <div className="flex items-center gap-3">
                  <span>
                    Total Rows: <strong>{result.totalRows}</strong>
                  </span>
                  <span>
                    Matched Students: <strong className="text-[#2A7C13]">{result.matchedCount}</strong>
                  </span>
                  {result.unmatchedCount > 0 && (
                    <span className="text-[#B45309]">
                      Unmatched: <strong>{result.unmatchedCount}</strong>
                    </span>
                  )}
                  {result.errorCount > 0 && (
                    <span className="text-red-700">
                      Errors: <strong>{result.errorCount}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-[#E5E5DF] rounded-[6px] overflow-x-auto max-h-56 overflow-y-auto">
                <table className="w-full min-w-[500px] text-xs text-left">
                  <thead className="bg-[#FAFAF8] text-[#777777] text-[10px] font-bold uppercase sticky top-0 border-b border-[#E5E5DF]">
                    <tr>
                      <th className="py-2 px-3">Matricule</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3 text-center">Score (/{maxMarks})</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Match Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0EC]">
                    {result.parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.error ? "bg-red-50/50" : "hover:bg-[#FAFAF8]"}>
                        <td className="py-1.5 px-3 font-mono font-medium text-[#191919]">
                          {row.matricule || "-"}
                        </td>
                        <td className="py-1.5 px-3 text-[#191919]">
                          {row.matchedStudentName || row.studentName || "-"}
                        </td>
                        <td className="py-1.5 px-3 text-center font-mono font-bold">
                          {row.score !== null ? row.score : "-"}
                        </td>
                        <td className="py-1.5 px-3 capitalize">
                          {row.status}
                        </td>
                        <td className="py-1.5 px-3">
                          {row.error ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-red-700 font-medium">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              {row.error}
                            </span>
                          ) : row.matchedStudentId ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#2A7C13] font-medium">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              Matched
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#B45309] font-medium">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Not in class
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#E5E5DF] bg-[#FAFAF8]">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-[5px] border border-[#D5D5CF] hover:bg-[#F0F0EC] text-[#191919] text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            disabled={!result || result.matchedCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply {result ? result.matchedCount : 0} Marks to Sheet</span>
          </button>
        </div>
      </div>
    </div>
  );
}
