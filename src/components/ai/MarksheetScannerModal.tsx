"use client";

import { useState, useRef } from "react";
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  Eye,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { scanPaperMarksheetAction } from "@/app/actions/ai-actions";
import { EnrolledStudentContext, ExtractedMarkRow } from "@/lib/ai/prompts/marksheet-ocr";
import { AiUpgradeModal } from "./AiUpgradeModal";

interface MarksheetScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: EnrolledStudentContext[];
  subjectName: string;
  maxMarks?: number;
  onApplyMarks: (marks: { studentId: string; score: number | null }[]) => void;
}

export function MarksheetScannerModal({
  isOpen,
  onClose,
  roster,
  subjectName,
  maxMarks = 20,
  onApplyMarks,
}: MarksheetScannerModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedRows, setExtractedRows] = useState<ExtractedMarkRow[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  /**
   * Client-side canvas compression:
   * Resizes large phone camera images down to max 1600px width/height and 0.85 quality,
   * reducing 8MB down to ~250KB before uploading over mobile networks.
   */
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.85
          );
        };
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const compressed = await compressImage(file);
    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
  };

  const handleStartScan = async () => {
    if (!imageFile) return;

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("roster", JSON.stringify(roster));
      formData.append("subjectName", subjectName);

      const res = await scanPaperMarksheetAction(formData);

      if (!res.success) {
        if (res.error === "PAYWALL_REQUIRED") {
          setShowPaywall(true);
          return;
        }
        setErrorMsg(res.error || "Failed to extract marks from image.");
        return;
      }

      // Merge extracted rows with class roster to ensure every student is accounted for
      const rowsMap = new Map(res.rows.map((r) => [r.studentId, r]));
      const fullList: ExtractedMarkRow[] = roster.map((s) => {
        const found = rowsMap.get(s.studentId);
        if (found) return found;
        return {
          studentId: s.studentId,
          matricule: s.matricule,
          fullName: s.fullName,
          extractedMark: null,
          confidence: "low",
          notes: "Not found on scanned sheet",
        };
      });

      setExtractedRows(fullList);
      setStep("review");
    } catch (err: any) {
      console.error("[Marksheet Scanner Error]", err);
      setErrorMsg(err?.message || "An unexpected error occurred while scanning.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkChange = (studentId: string, valStr: string) => {
    const num = valStr === "" ? null : parseFloat(valStr);
    setExtractedRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, extractedMark: num, confidence: "high" } : r))
    );
  };

  const handleConfirmApply = () => {
    const marksPayload = extractedRows.map((r) => ({
      studentId: r.studentId,
      score: r.extractedMark,
    }));
    onApplyMarks(marksPayload);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60">
        <div className="relative w-full max-w-4xl h-[90vh] max-h-[750px] rounded-[16px] bg-[#FFFDF5] border border-[#E8DFC9] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E8DFC9] bg-[#142010] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-white/10 flex items-center justify-center text-[#76C457]">
                <Camera className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                  Scan Paper Mark Sheet (AI Vision)
                </h3>
                <p className="text-[11px] text-[#A6B8A0]">
                  {subjectName} · {roster.length} Enrolled Students
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {errorMsg && (
              <div className="mb-4 p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {step === "upload" ? (
              /* Step 1: Upload or Snap Photo */
              <div className="max-w-xl mx-auto space-y-6 text-center py-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-[#76C457] bg-white hover:bg-[#EAF7E4]/20 rounded-[16px] p-8 sm:p-12 transition-all space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center mx-auto shadow-2xs">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-[#142010]">
                        Take a Photo or Select Mark Sheet
                      </h4>
                      <p className="text-xs text-[#525E4B] max-w-sm mx-auto mt-1 leading-relaxed">
                        Snap a photo of the handwritten teacher register or paper score sheet. Works directly from your phone camera.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#2A7C13] text-white text-xs font-bold shadow-xs">
                      <Upload className="w-4 h-4" />
                      <span>Choose File or Camera</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-[12px] overflow-hidden border border-[#E8DFC9] max-h-72 bg-black flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="Scanned mark sheet preview"
                        className="max-h-72 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 text-xs font-bold"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto px-4 py-2 rounded-[7px] border border-[#E8DFC9] bg-white text-xs font-semibold text-[#142010] hover:bg-[#FAF8F2]"
                      >
                        Retake Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleStartScan}
                        disabled={isProcessing}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Reading Handwritten Table...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Extract Marks with AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-[#EAF7E4]/50 rounded-[10px] border border-[#76C457]/30 text-left text-xs text-[#525E4B] space-y-1">
                  <p className="font-bold text-[#2A7C13]">Tips for best accuracy:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#525E4B]">
                    <li>Ensure good lighting (avoid strong shadows across the numbers).</li>
                    <li>Align the camera parallel to the paper so table rows are horizontal.</li>
                    <li>You will be able to review and verify every number before saving.</li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Step 2: Side-by-Side Verification Screen */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full">
                {/* Left: Original Photo Inspection */}
                <div className="flex flex-col rounded-[12px] border border-[#E8DFC9] bg-white overflow-hidden max-h-[500px]">
                  <div className="p-2.5 bg-[#FFFDF5] border-b border-[#E8DFC9] flex items-center justify-between text-xs font-bold text-[#142010]">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#2A7C13]" />
                      <span>Original Paper Photo</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep("upload")}
                      className="text-[11px] font-semibold text-[#2A7C13] hover:underline"
                    >
                      Rescan Photo
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto p-2 bg-neutral-900 flex items-center justify-center">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Mark sheet inspection"
                        className="max-w-full max-h-[440px] object-contain rounded"
                      />
                    )}
                  </div>
                </div>

                {/* Right: Extracted Editable Marks List */}
                <div className="flex flex-col rounded-[12px] border border-[#E8DFC9] bg-white overflow-hidden max-h-[500px]">
                  <div className="p-2.5 bg-[#FFFDF5] border-b border-[#E8DFC9] flex items-center justify-between text-xs font-bold text-[#142010]">
                    <span>Extracted Scores ({extractedRows.length} Students)</span>
                    <span className="text-[10px] text-[#788470]">Verify against photo</span>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-[#F5EFE0] p-1">
                    {extractedRows.map((row) => {
                      const isLowConfidence = row.confidence === "low";
                      const isMedium = row.confidence === "medium";

                      return (
                        <div
                          key={row.studentId}
                          className={`flex items-center justify-between gap-3 p-2 text-xs transition-colors ${
                            isLowConfidence
                              ? "bg-[#FFFBEB]"
                              : isMedium
                              ? "bg-[#FFFDF5]"
                              : "hover:bg-[#FAF8F2]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-[#788470]">
                                {row.matricule}
                              </span>
                              <span className="font-bold text-[#142010] truncate">
                                {row.fullName}
                              </span>
                            </div>
                            {row.notes && (
                              <p className="text-[10px] text-[#B45309] truncate mt-0.5">
                                {row.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isLowConfidence && (
                              <span
                                title="Low optical confidence: please double-check with the photo"
                                className="inline-flex items-center text-[10px] text-[#B45309] font-bold"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                max={maxMarks}
                                value={row.extractedMark ?? ""}
                                onChange={(e) => handleMarkChange(row.studentId, e.target.value)}
                                placeholder="Abs"
                                className={`w-16 px-2 py-1 text-center font-mono font-bold text-xs rounded border focus:outline-none ${
                                  isLowConfidence
                                    ? "border-[#B45309] bg-white text-[#B45309]"
                                    : "border-[#E8DFC9] bg-[#FFFDF5] text-[#142010] focus:border-[#2A7C13]"
                                }`}
                              />
                              <span className="text-[10px] text-[#788470]">/{maxMarks}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {step === "review" && (
            <div className="p-3.5 sm:p-4 border-t border-[#E8DFC9] bg-[#FFFDF5] flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-[#525E4B]">
                Double-checked your numbers against the photo?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-[7px] border border-[#E8DFC9] bg-white text-xs font-semibold text-[#142010] hover:bg-[#FAF8F2]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApply}
                  className="px-5 py-2 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply Extracted Marks to Grid</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Paywall Upgrade Modal */}
      <AiUpgradeModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </>
  );
}
