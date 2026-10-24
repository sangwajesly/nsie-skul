"use client";

import { useState, useTransition } from "react";
import {
  saveSequenceMarksAction,
  approveDepartmentalSequenceAction,
  submitSequenceMarksAction,
  reopenDepartmentalSequenceAction,
} from "@/app/academics/actions";
import { getGradeAppreciation } from "@/lib/academic/grading";
import { MarksImportModal } from "./MarksImportModal";
import { ParsedMarkRow, generateMarksCsvTemplate } from "@/lib/academic/marks-import";
import {
  Save,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Send,
  RotateCcw,
  Clock,
  HelpCircle,
} from "lucide-react";

interface StudentRow {
  studentId: string;
  matricule: string;
  fullName: string;
  gender: string;
  score: number | null;
  status: "present" | "absent" | "exempt";
  remarks: string;
  isLocked: boolean;
}

interface MarksGridClientProps {
  academicYearId: string;
  termId: string;
  sequenceId: string;
  classStreamId: string;
  subjectId: string;
  departmentId?: string;
  subjectName: string;
  streamName?: string;
  sequenceName?: string;
  coefficient: number;
  initialMaxMarks: number;
  isApproved: boolean;
  approvalStatus?: string;
  approvalNotes?: string;
  approverName?: string;
  approvedAt?: string;
  canApprove: boolean;
  isTeacher?: boolean;
  students: StudentRow[];
}

export function MarksGridClient({
  academicYearId,
  termId,
  sequenceId,
  classStreamId,
  subjectId,
  departmentId,
  subjectName,
  streamName = "Class Group",
  sequenceName = "Test Sequence",
  coefficient,
  initialMaxMarks,
  isApproved,
  approvalStatus = "draft",
  approvalNotes,
  approverName,
  approvedAt,
  canApprove,
  isTeacher,
  students: initialStudents,
}: MarksGridClientProps) {
  const [students, setStudents] = useState<StudentRow[]>(initialStudents);
  const [maxMarks, setMaxMarks] = useState<number>(initialMaxMarks);
  const [currentStatus, setCurrentStatus] = useState<string>(approvalStatus || (isApproved ? "approved" : "draft"));
  const [currentNotes, setCurrentNotes] = useState<string | undefined>(approvalNotes);
  const [currentApprover, setCurrentApprover] = useState<string | undefined>(approverName);
  const [currentApprovedAt, setCurrentApprovedAt] = useState<string | undefined>(approvedAt);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenJustification, setReopenJustification] = useState("");

  // Permission calculation:
  // HOD and Administrator can ALWAYS edit marks (in draft, submitted, or approved states)
  // Teachers can edit when status is 'draft' or 'rejected' (reopened for corrections)
  const canEdit = canApprove ? true : currentStatus === "draft" || currentStatus === "rejected";
  const isSubmitted = currentStatus === "submitted";
  const isFinalApproved = currentStatus === "approved";
  const isReopened = currentStatus === "rejected";

  const handleScoreChange = (index: number, val: string) => {
    const num = val === "" ? null : parseFloat(val);
    const updated = [...students];
    updated[index].score = isNaN(num as number) ? null : num;
    if (num !== null && num > 0) {
      updated[index].status = "present";
    }
    setStudents(updated);
    setIsDirty(true);
  };

  const handleScoreKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextInput = document.querySelector<HTMLInputElement>(`input[data-score-idx="${index + 1}"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevInput = document.querySelector<HTMLInputElement>(`input[data-score-idx="${index - 1}"]`);
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  const handleStatusChange = (index: number, newStatus: "present" | "absent" | "exempt") => {
    const updated = [...students];
    updated[index].status = newStatus;
    if (newStatus !== "present") {
      updated[index].score = null;
    }
    setStudents(updated);
    setIsDirty(true);
  };

  const handleRemarksChange = (index: number, rem: string) => {
    const updated = [...students];
    updated[index].remarks = rem;
    setStudents(updated);
    setIsDirty(true);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === students.length && students.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.studentId)));
    }
  };

  const handleToggleSelectRow = (studentId: string) => {
    const next = new Set(selectedIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setSelectedIds(next);
  };

  const handleBulkStatus = (status: "present" | "absent" | "exempt") => {
    const targetIds = selectedIds.size > 0 ? selectedIds : new Set(students.map((s) => s.studentId));
    const updated = students.map((s) => {
      if (targetIds.has(s.studentId)) {
        return {
          ...s,
          status,
          score: status === "present" ? s.score : null,
        };
      }
      return s;
    });
    setStudents(updated);
    setIsDirty(true);
  };

  const handleApplyImportedMarks = (importedRows: ParsedMarkRow[]) => {
    const importedByStudentId = new Map<string, ParsedMarkRow>();
    for (const row of importedRows) {
      if (row.matchedStudentId) {
        importedByStudentId.set(row.matchedStudentId, row);
      }
    }

    let appliedCount = 0;
    const updated = students.map((s) => {
      const match = importedByStudentId.get(s.studentId);
      if (match) {
        appliedCount++;
        return {
          ...s,
          score: match.score,
          status: match.status,
          remarks: match.remarks || s.remarks,
        };
      }
      return s;
    });

    setStudents(updated);
    setIsDirty(true);
    setMessage({
      type: "success",
      text: `Successfully applied marks for ${appliedCount} students from file. Review the table below and click "Save Mark Sheet".`,
    });
  };

  const handleQuickDownloadTemplate = () => {
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

  const handleSaveDraft = (silent = false) => {
    setMessage(null);
    return new Promise<boolean>((resolve) => {
      startTransition(async () => {
        const res = await saveSequenceMarksAction({
          academicYearId,
          termId,
          sequenceId,
          classStreamId,
          subjectId,
          maxMarks,
          marks: students.map((s) => ({
            studentId: s.studentId,
            score: s.score,
            status: s.status,
            remarks: s.remarks,
          })),
        });

        if (res?.error) {
          setMessage({ type: "error", text: res.error });
          resolve(false);
        } else {
          setIsDirty(false);
          if (!silent) {
            setMessage({
              type: "success",
              text: canApprove
                ? "Marks changes saved."
                : "Draft marks saved successfully. You can continue updating or submit to HOD when ready.",
            });
          }
          resolve(true);
        }
      });
    });
  };

  const handleConfirmSubmitToHod = async () => {
    setMessage(null);
    setShowSubmitModal(false);

    // Save pending edits first
    const saved = await handleSaveDraft(true);
    if (!saved) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("sequenceId", sequenceId);
      formData.set("classStreamId", classStreamId);
      formData.set("subjectId", subjectId);
      if (departmentId) formData.set("departmentId", departmentId);
      formData.set("academicYearId", academicYearId);
      formData.set("termId", termId);

      const res = await submitSequenceMarksAction(formData);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setCurrentStatus("submitted");
        setMessage({
          type: "success",
          text: "Marks successfully submitted to Head of Department for review. Editing is now locked for teachers.",
        });
      }
    });
  };

  const handleApproveMarks = async (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      if (isDirty) {
        await handleSaveDraft(true);
      }

      const res = await approveDepartmentalSequenceAction(formData);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setCurrentStatus("approved");
        setCurrentApprover("Department Head");
        setCurrentApprovedAt(new Date().toISOString());
        setIsDirty(false);
        setMessage({
          type: "success",
          text: "Marks approved and locked.",
        });
      }
    });
  };

  const handleConfirmReopen = async () => {
    if (!reopenJustification.trim()) {
      setMessage({ type: "error", text: "Please provide a reason or verified contestation proof for reopening marks." });
      return;
    }

    setMessage(null);
    setShowReopenModal(false);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("sequenceId", sequenceId);
      formData.set("classStreamId", classStreamId);
      formData.set("subjectId", subjectId);
      if (departmentId) formData.set("departmentId", departmentId);
      formData.set("notes", reopenJustification.trim());

      const res = await reopenDepartmentalSequenceAction(formData);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setCurrentStatus("rejected");
        setCurrentNotes(reopenJustification.trim());
        setReopenJustification("");
        setMessage({
          type: "success",
          text: "Mark sheet re-enabled for teacher revision. The audit reason has been recorded.",
        });
      }
    });
  };

  // Compute live averages
  const presentStudents = students.filter((s) => s.status === "present" && s.score !== null);
  const avgOutOf20 =
    presentStudents.length > 0
      ? (
          presentStudents.reduce((acc, curr) => acc + ((curr.score! / maxMarks) * 20), 0) /
          presentStudents.length
        ).toFixed(2)
      : null;

  return (
    <div className="space-y-4">
      {/* Action and Metric Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-[#525E4B]">Subject:</span>{" "}
            <strong className="text-[#142010] font-bold text-sm">{subjectName}</strong>
          </div>
          <div className="h-4 w-px bg-[#E8DFC9] hidden sm:block" />
          <div>
            <span className="text-[#525E4B]">Weight:</span>{" "}
            <span className="font-mono font-bold text-[#142010]">Coef {coefficient}</span>
          </div>
          <div className="h-4 w-px bg-[#E8DFC9] hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <label htmlFor="maxMarksInput" className="text-[#525E4B]">
              Max Denominator:
            </label>
            <input
              id="maxMarksInput"
              type="number"
              disabled={!canEdit}
              value={maxMarks}
              onChange={(e) => setMaxMarks(parseFloat(e.target.value) || 20)}
              className="w-16 px-2 py-1 rounded-[5px] border border-[#E8DFC9] text-center font-mono font-bold text-xs bg-[#FFFDF5] focus:outline-none focus:border-[#2A7C13] disabled:opacity-60"
            />
            <span className="text-[10px] text-[#788470]">(20 for general, 40-100 for technical)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button
                type="button"
                onClick={handleQuickDownloadTemplate}
                title="Download pre-filled CSV sheet with your class roster"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-white hover:bg-[#F5F5F0] text-[#191919] border border-[#D5D5CF] font-semibold text-xs transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-[#2A7C13]" />
                <span>Template</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                title="Import student scores from Excel or CSV file"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] font-semibold text-xs transition-colors shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Import Excel/CSV</span>
              </button>
            </>
          )}

          {!canEdit ? (
            isSubmitted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>Submitted to HOD</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Approved &amp; Locked</span>
              </span>
            )
          ) : (
            <>
              {isDirty ? (
                <button
                  onClick={() => handleSaveDraft(false)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isPending ? "Saving..." : canApprove ? "Save Changes" : "Save Draft"}</span>
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" title="Unsaved changes" />
                </button>
              ) : (
                <button
                  onClick={() => handleSaveDraft(false)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#F5F5F0] hover:bg-[#EAEAE5] text-[#555555] font-semibold text-xs border border-[#D5D5CF] transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2A7C13]" />
                  <span>{isPending ? "Saving..." : canApprove ? "All Changes Saved" : "Draft Saved"}</span>
                </button>
              )}

              {!canApprove && (currentStatus === "draft" || currentStatus === "rejected") && (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#142010] hover:bg-[#2A7C13] text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-[#76C457]" />
                  <span>Submit to HOD</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* State Workflow Banners */}
      {isReopened && (
        <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-[#FFF8CF] border border-[#FBE6C2] text-xs">
          <RotateCcw className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#7A4A00]">
              Reopened for Correction by Head of Department
            </p>
            <p className="text-[#854D0E]">
              <strong>Reason / Audit Justification:</strong> {currentNotes || "Marks correction approved by HOD."}
            </p>
            <p className="text-[11px] text-[#A16207]">
              You may update the verified score(s) below and click &ldquo;Submit to HOD&rdquo; once corrected.
            </p>
          </div>
        </div>
      )}

      {isSubmitted && (
        <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-[#EFF6FF] border border-[#BFDBFE] text-xs">
          <Clock className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#1E40AF]">
              Submitted to Head of Department · Under Quality Review
            </p>
            <p className="text-[#1E3A8A]">
              {canApprove
                ? "As Head of Department / Administrator, you can review and make any adjustments to marks directly in the table below, then approve and lock or return to the teacher."
                : "These marks have been submitted to your Department Head. Editing is locked to prevent unapproved changes. Contact your HOD if a score contestation needs to be verified."}
            </p>
          </div>
        </div>
      )}

      {isFinalApproved && (
        <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] text-xs">
          <ShieldCheck className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#166534]">
              Approved &amp; Locked by {currentApprover || approverName || "Department Head"}
              {currentApprovedAt ? ` on ${new Date(currentApprovedAt).toLocaleDateString()}` : ""}
            </p>
            <p className="text-[#14532D]">
              {canApprove
                ? "Marks are officially approved and locked for report card calculation. As HOD/Administrator, you retain authority to make supervisor corrections or reopen the sheet if a verified student contestation arises."
                : "Marks are finalized and locked for report card generation. If a student formally contests a grade with physical proof, consult your Head of Department."}
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {message && (
        <div
          className={`p-3 rounded-[6px] text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && !isLocked && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[8px] bg-[#142010] text-white text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white px-2 py-0.5 rounded-[4px] bg-[#2A7C13] text-[11px]">
              {selectedIds.size} student{selectedIds.size > 1 ? "s" : ""} selected
            </span>
            <span className="text-[#A5B29D] text-[11px]">Batch status action:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkStatus("present")}
              className="px-2.5 py-1 rounded-[4px] bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
            >
              Mark Present
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatus("absent")}
              className="px-2.5 py-1 rounded-[4px] bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30 font-medium text-xs transition-colors"
            >
              Mark Absent (ABS)
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatus("exempt")}
              className="px-2.5 py-1 rounded-[4px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-medium text-xs transition-colors"
            >
              Mark Exempt (EXC)
            </button>
            <div className="h-4 w-px bg-white/20 mx-1" />
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-[#A5B29D] hover:text-white text-xs underline underline-offset-2 transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Interactive Mark Entry Grid */}
      <div className="bg-white rounded-[8px] border border-[#E8DFC9] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E8DFC9] bg-[#FFFDF5] text-[#525E4B] font-semibold text-[11px]">
                <th className="py-2.5 px-3 w-16 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="checkbox"
                      disabled={isLocked || students.length === 0}
                      aria-label="Select all students"
                      checked={students.length > 0 && selectedIds.size === students.length}
                      onChange={handleToggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-[#D5D5CF] text-[#2A7C13] focus:ring-[#2A7C13] accent-[#2A7C13] cursor-pointer"
                    />
                    <span>#</span>
                  </div>
                </th>
                <th className="py-2.5 px-3">Admission No.</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3 w-32">Status</th>
                <th className="py-2.5 px-3 w-28 text-center">Score (/{maxMarks})</th>
                <th className="py-2.5 px-3 w-24 text-center">Score (/20)</th>
                <th className="py-2.5 px-3 w-40 text-center">Grade</th>
                <th className="py-2.5 px-3">Teacher&apos;s Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE0]">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#788470]">
                    No students are enrolled in this class group yet.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => {
                  const normalized20 =
                    student.score !== null && maxMarks > 0
                      ? parseFloat(((student.score / maxMarks) * 20).toFixed(2))
                      : null;
                  const gradeInfo = getGradeAppreciation(normalized20);
                  const isSelected = selectedIds.has(student.studentId);

                  return (
                    <tr
                      key={student.studentId}
                      className={`hover:bg-[#FFFDF5] transition-colors ${
                        isSelected ? "bg-[#F0FDF4]/70" : ""
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="checkbox"
                            disabled={isLocked}
                            aria-label={`Select ${student.fullName}`}
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(student.studentId)}
                            className="w-3.5 h-3.5 rounded border-[#D5D5CF] text-[#2A7C13] focus:ring-[#2A7C13] accent-[#2A7C13] cursor-pointer"
                          />
                          <span className="text-[#788470] font-mono text-[11px] w-4 text-right">
                            {idx + 1}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-[#142010]">
                        {student.matricule}
                      </td>
                      <td className="py-2 px-3 font-medium text-[#142010]">
                        {student.fullName}
                      </td>
                      <td className="py-2 px-3">
                        <select
                          disabled={isLocked}
                          value={student.status}
                          aria-label={`Attendance status for ${student.fullName}`}
                          onChange={(e) =>
                            handleStatusChange(
                              idx,
                              e.target.value as "present" | "absent" | "exempt"
                            )
                          }
                          className="w-full px-2 py-1 rounded-[4px] border border-[#E8DFC9] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent (ABS)</option>
                          <option value="exempt">Exempt (EXC)</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          max={maxMarks}
                          data-score-idx={idx}
                          onKeyDown={(e) => handleScoreKeyDown(idx, e)}
                          aria-label={`Score out of ${maxMarks} for ${student.fullName}`}
                          disabled={isLocked || student.status !== "present"}
                          placeholder={student.status === "present" ? "0.00" : "-"}
                          value={student.score ?? ""}
                          onChange={(e) => handleScoreChange(idx, e.target.value)}
                          className="w-20 px-2 py-1 text-center font-mono font-bold rounded-[4px] border border-[#E8DFC9] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13] disabled:bg-[#F5EFE0] disabled:text-[#788470]"
                        />
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-[#142010]">
                        {student.status === "present" && normalized20 !== null
                          ? normalized20.toFixed(2)
                          : "-"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {student.status === "present" && normalized20 !== null ? (
                          <span
                            className={`inline-flex items-center justify-center px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                              gradeInfo.cba === "EXP"
                                ? "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40"
                                : gradeInfo.cba === "SA"
                                ? "bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]"
                                : gradeInfo.cba === "SPA"
                                ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {gradeInfo.letter} · {gradeInfo.label.split("/")[0].trim()}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#788470] font-mono">
                            {student.status === "absent"
                              ? "ABS"
                              : student.status === "exempt"
                              ? "EXC"
                              : "-"}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          disabled={isLocked}
                          aria-label={`Teacher remark for ${student.fullName}`}
                          placeholder="Remark (optional)..."
                          value={student.remarks}
                          onChange={(e) => handleRemarksChange(idx, e.target.value)}
                          className="w-full px-2 py-1 rounded-[4px] border border-[#E8DFC9] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mark Sheet Summary Footer */}
        <div className="p-3 border-t border-[#E8DFC9] bg-[#FFFDF5] flex flex-wrap items-center justify-between text-xs text-[#525E4B]">
          <div>
            Students: <strong className="text-[#142010]">{students.length}</strong> · Present:{" "}
            <strong className="text-[#2A7C13]">{presentStudents.length}</strong> · Absent:{" "}
            <strong>{students.filter((s) => s.status === "absent").length}</strong>
          </div>
          {avgOutOf20 && (
            <div className="font-mono text-xs">
              Class Average: <strong className="text-[#142010] font-bold">{avgOutOf20} / 20</strong>
            </div>
          )}
        </div>
      </div>

      {/* HOD Review & Approval Gate Panel */}
      {departmentId && canApprove && (
        <div className="p-5 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2A7C13]" />
            <h3 className="font-bold text-sm text-[#142010]">
              Head of Department Approval
            </h3>
          </div>
          <p className="text-xs text-[#525E4B]">
            Once approved, these marks are locked. A school administrator must authorize any later correction.
          </p>

          {isApproved ? (
            <div className="flex items-center gap-2 p-3 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] text-xs font-semibold border border-[#76C457]/40">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Approved by {approverName || "Department Head"}{" "}
                {approvedAt ? `on ${new Date(approvedAt).toLocaleDateString()}` : ""}
              </span>
            </div>
          ) : (
            <form
              action={async (formData: FormData) => {
                const res = await approveDepartmentalSequenceAction(formData);
                if (res?.error) {
                  setMessage({ type: "error", text: res.error });
                } else {
                  setMessage({
                    type: "success",
                    text: "Marks approved and locked.",
                  });
                }
              }}
              className="pt-2"
            >
              <input type="hidden" name="sequenceId" value={sequenceId} />
              <input type="hidden" name="classStreamId" value={classStreamId} />
              <input type="hidden" name="departmentId" value={departmentId} />
              <input type="hidden" name="academicYearId" value={academicYearId} />
              <input type="hidden" name="termId" value={termId} />

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  name="notes"
                  placeholder="Optional review endorsement note..."
                  className="w-full sm:flex-1 px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#2A7C13]"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
                >
                  Approve and Lock Marks
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Excel / CSV Import Modal */}
      <MarksImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onApply={handleApplyImportedMarks}
        students={students}
        maxMarks={maxMarks}
        subjectName={subjectName}
        streamName={streamName}
        sequenceName={sequenceName}
      />
    </div>
  );
}
