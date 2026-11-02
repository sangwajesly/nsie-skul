"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Users,
  Search,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Layers,
  Award,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  createAcademicYearAction,
  previewAnnualPromotionAction,
  executeAnnualPromotionRolloverAction,
} from "@/app/academics/actions";
import { AcademicYear } from "@/types/database";

interface StreamOption {
  id: string;
  name: string;
  stream_tag: string | null;
  class_id: string;
  class_name: string;
  level_order: number;
}

interface CandidateRow {
  enrolmentId: string;
  studentId: string;
  matricule: string;
  fullName: string;
  gender: string;
  currentStreamId: string;
  currentStreamName: string;
  currentClassLevel: number;
  currentClassName: string;
  annualAverage: number | null;
  rank: number;
  totalInStream: number;
  recommendedDecision: "promoted" | "trial" | "repeated" | "graduated";
  recommendedTargetStreamId: string | null;
  isCurrentRepeater: boolean;
  // Editable by admin
  userDecision: "promoted" | "trial" | "repeated" | "graduated" | "transferred" | "withdrawn";
  targetStreamId: string;
}

interface Props {
  academicYears: AcademicYear[];
  currentAcademicYearId: string;
  canManage: boolean;
}

export function AcademicRolloverWizard({
  academicYears,
  currentAcademicYearId,
  canManage,
}: Props) {
  const router = useRouter();
  const [sourceYearId, setSourceYearId] = useState(currentAcademicYearId || (academicYears[0]?.id ?? ""));
  const [targetYearId, setTargetYearId] = useState("");
  const [promotionThreshold, setPromotionThreshold] = useState("10.0");
  const [trialThreshold, setTrialThreshold] = useState("8.5");

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [targetStreams, setTargetStreams] = useState<StreamOption[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStreamFilter, setSelectedStreamFilter] = useState("all");
  const [selectedDecisionFilter, setSelectedDecisionFilter] = useState("all");

  // New Academic Year Modal State
  const [isNewYearModalOpen, setIsNewYearModalOpen] = useState(false);
  const [newYearName, setNewYearName] = useState("");
  const [newYearStartDate, setNewYearStartDate] = useState("");
  const [newYearEndDate, setNewYearEndDate] = useState("");
  const [cloneCurriculum, setCloneCurriculum] = useState(true);
  const [isSubmittingNewYear, setIsSubmittingNewYear] = useState(false);
  const [newYearError, setNewYearError] = useState<string | null>(null);

  // Execution State
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Automatically suggest a target academic year when academicYears changes
  useEffect(() => {
    if (academicYears.length > 0 && !targetYearId) {
      // Find a year that is different from sourceYearId, ideally later start_date
      const other = academicYears.find((y) => y.id !== sourceYearId);
      if (other) {
        setTargetYearId(other.id);
      }
    }
  }, [academicYears, sourceYearId, targetYearId]);

  // Load preview whenever sourceYearId or targetYearId changes
  const loadPreview = async () => {
    if (!sourceYearId) return;
    setLoadingPreview(true);
    setPreviewError(null);
    setExecutionResult(null);

    try {
      const pThresh = parseFloat(promotionThreshold) || 10.0;
      const tThresh = parseFloat(trialThreshold) || 8.5;

      const res = await previewAnnualPromotionAction({
        sourceAcademicYearId: sourceYearId,
        targetAcademicYearId: targetYearId || undefined,
        promotionThreshold: pThresh,
        trialThreshold: tThresh,
      });

      if (res.error) {
        setPreviewError(res.error);
        setCandidates([]);
      } else if (res.candidates) {
        setTargetStreams(res.targetStreams || []);
        const rows: CandidateRow[] = res.candidates.map((c) => ({
          ...c,
          userDecision: c.recommendedDecision,
          targetStreamId: c.recommendedTargetStreamId || (res.targetStreams?.[0]?.id ?? ""),
        }));
        setCandidates(rows);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load promotion preview";
      setPreviewError(msg);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (sourceYearId) {
      loadPreview();
    }
  }, [sourceYearId, targetYearId]);

  // Handle Threshold Form Submit
  const handleApplyThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    loadPreview();
  };

  // Change individual candidate decision
  const handleCandidateDecisionChange = (
    studentId: string,
    newDecision: CandidateRow["userDecision"]
  ) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.studentId !== studentId) return c;
        let newTarget = c.targetStreamId;

        // Auto-switch target stream based on new decision
        if (targetStreams.length > 0) {
          let targetLevel = c.currentClassLevel;
          if (newDecision === "promoted" || newDecision === "trial") {
            targetLevel = c.currentClassLevel + 1;
          }
          const levelStreams = targetStreams.filter((ts) => ts.level_order === targetLevel);
          if (levelStreams.length > 0) {
            newTarget = levelStreams[0].id;
          }
        }

        return {
          ...c,
          userDecision: newDecision,
          targetStreamId: newTarget,
        };
      })
    );
  };

  // Change individual candidate target stream
  const handleCandidateTargetStreamChange = (studentId: string, newStreamId: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.studentId === studentId ? { ...c, targetStreamId: newStreamId } : c))
    );
  };

  // Handle Create Academic Year Form Submit
  const handleCreateNewYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNewYear(true);
    setNewYearError(null);

    const formData = new FormData();
    formData.append("name", newYearName);
    formData.append("startDate", newYearStartDate);
    formData.append("endDate", newYearEndDate);
    if (cloneCurriculum && sourceYearId) {
      formData.append("copyStreamsFromYearId", sourceYearId);
    }

    try {
      const res = await createAcademicYearAction(formData);
      if (res.error) {
        setNewYearError(res.error);
      } else if (res.academicYear) {
        setIsNewYearModalOpen(false);
        setTargetYearId(res.academicYear.id);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create academic year";
      setNewYearError(msg);
    } finally {
      setIsSubmittingNewYear(false);
    }
  };

  // Handle Execution
  const handleExecuteRollover = async () => {
    if (!targetYearId) {
      alert("Please select a target Academic Year to roll over into.");
      return;
    }

    if (
      !confirm(
        `Execute annual rollover for ${candidates.length} student(s) from ${
          academicYears.find((y) => y.id === sourceYearId)?.name || "current year"
        } into ${
          academicYears.find((y) => y.id === targetYearId)?.name || "target year"
        }? This will enrol passing and repeating students into their assigned classes.`
      )
    ) {
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const decisions = candidates.map((c) => ({
        studentId: c.studentId,
        enrolmentId: c.enrolmentId,
        decision: c.userDecision,
        targetClassStreamId: c.targetStreamId,
        isRepeater: c.userDecision === "repeated",
      }));

      const res = await executeAnnualPromotionRolloverAction({
        sourceAcademicYearId: sourceYearId,
        targetAcademicYearId: targetYearId,
        decisions,
      });

      if (res.error) {
        setExecutionResult({ success: false, message: res.error });
      } else {
        setExecutionResult({
          success: true,
          message: res.message || "Annual promotion and rollover completed successfully.",
        });
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to execute rollover";
      setExecutionResult({ success: false, message: msg });
    } finally {
      setIsExecuting(false);
    }
  };

  // Filtered Candidates
  const filteredCandidates = candidates.filter((c) => {
    if (selectedStreamFilter !== "all" && c.currentStreamId !== selectedStreamFilter) {
      return false;
    }
    if (selectedDecisionFilter !== "all" && c.userDecision !== selectedDecisionFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.matricule.toLowerCase().includes(q) ||
        c.currentStreamName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Unique current streams for filter
  const currentStreamsList = Array.from(
    new Map(candidates.map((c) => [c.currentStreamId, c.currentStreamName])).entries()
  ).map(([id, name]) => ({ id, name }));

  // Summary counts
  const promotedCount = candidates.filter((c) => c.userDecision === "promoted").length;
  const trialCount = candidates.filter((c) => c.userDecision === "trial").length;
  const repeatCount = candidates.filter((c) => c.userDecision === "repeated").length;
  const graduateCount = candidates.filter((c) => c.userDecision === "graduated").length;
  const departCount = candidates.filter(
    (c) => c.userDecision === "transferred" || c.userDecision === "withdrawn"
  ).length;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="p-5 sm:p-6 rounded-[8px] bg-white border border-[#D5CBB2] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E8DFC9] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40 text-[11px] font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Academic Year Rollover</span>
            </div>
            <h2 className="text-lg font-bold text-[#142010]">
              Annual Promotion &amp; Progression Council
            </h2>
            <p className="text-xs text-[#555555] mt-1 max-w-2xl leading-relaxed">
              Seamlessly promote passing students, place borderline candidates on trial, record repeaters, and create next-session enrolments without re-registering existing students.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewYearModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-xs font-semibold bg-[#FAF8F2] hover:bg-[#F2ECE1] border border-[#D5CBB2] text-[#191919] transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-[#2A7C13]" />
            <span>Create New Academic Year</span>
          </button>
        </div>

        {/* Year Selectors & Thresholds Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 text-xs">
          {/* Source Academic Year */}
          <div>
            <label className="block font-bold text-[#191919] mb-1">
              From Academic Year (Source)
            </label>
            <select
              value={sourceYearId}
              onChange={(e) => setSourceYearId(e.target.value)}
              className="w-full px-3 py-2 rounded-[6px] border border-[#D5D5CF] bg-white text-xs font-medium text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#2A7C13]"
            >
              {academicYears.map((yr) => (
                <option key={yr.id} value={yr.id}>
                  {yr.name} {yr.is_current ? "(Active Current)" : ""}
                </option>
              ))}
            </select>
            <span className="text-[10.5px] text-[#777777] block mt-1">
              Select completed school year with annual marks
            </span>
          </div>

          {/* Target Academic Year */}
          <div>
            <label className="block font-bold text-[#191919] mb-1">
              To Academic Year (Target)
            </label>
            <select
              value={targetYearId}
              onChange={(e) => setTargetYearId(e.target.value)}
              className="w-full px-3 py-2 rounded-[6px] border border-[#D5D5CF] bg-white text-xs font-medium text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#2A7C13]"
            >
              <option value="">-- Choose Target Year --</option>
              {academicYears
                .filter((yr) => yr.id !== sourceYearId)
                .map((yr) => (
                  <option key={yr.id} value={yr.id}>
                    {yr.name} {yr.is_current ? "(Current)" : ""}
                  </option>
                ))}
            </select>
            <span className="text-[10.5px] text-[#777777] block mt-1">
              Where promoted &amp; repeating students roll into
            </span>
          </div>

          {/* Customizable Promotion Cutoff */}
          <div>
            <label className="block font-bold text-[#191919] mb-1">
              Direct Promotion Cutoff (/20)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={promotionThreshold}
              onChange={(e) => setPromotionThreshold(e.target.value)}
              className="w-full px-3 py-2 rounded-[6px] border border-[#D5D5CF] bg-white text-xs font-bold text-[#2A7C13] focus:outline-none focus:ring-1 focus:ring-[#2A7C13]"
            />
            <span className="text-[10.5px] text-[#777777] block mt-1">
              Students at or above this mark pass directly
            </span>
          </div>

          {/* Customizable Trial Cutoff */}
          <div>
            <label className="block font-bold text-[#191919] mb-1">
              Trial Promotion Cutoff (/20)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={trialThreshold}
                onChange={(e) => setTrialThreshold(e.target.value)}
                className="w-full px-3 py-2 rounded-[6px] border border-[#D5D5CF] bg-white text-xs font-bold text-[#B45309] focus:outline-none focus:ring-1 focus:ring-[#2A7C13]"
              />
              <button
                type="button"
                onClick={loadPreview}
                className="px-3 py-2 rounded-[6px] bg-[#191919] hover:bg-black text-white font-semibold text-xs cursor-pointer shrink-0 transition-colors"
                title="Recalculate recommendations"
              >
                Apply
              </button>
            </div>
            <span className="text-[10.5px] text-[#777777] block mt-1">
              Borderline candidates (e.g. 8.5 to 9.99)
            </span>
          </div>
        </div>
      </div>

      {/* Execution Feedback Banner */}
      {executionResult && (
        <div
          className={`p-4 rounded-[8px] border text-xs flex items-start gap-3 ${
            executionResult.success
              ? "bg-[#EAF7E4] border-[#76C457]/50 text-[#1F5C0E]"
              : "bg-[#FFF0F0] border-[#FCA5A5] text-[#991B1B]"
          }`}
        >
          {executionResult.success ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2A7C13]" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          )}
          <div className="flex-1">
            <h4 className="font-bold text-sm">
              {executionResult.success ? "Rollover Completed" : "Rollover Failed"}
            </h4>
            <p className="mt-0.5 leading-relaxed">{executionResult.message}</p>
          </div>
        </div>
      )}

      {/* Target Year Missing Warning */}
      {!targetYearId && (
        <div className="p-4 rounded-[8px] bg-[#FFF8CF] border border-[#FBE6C2] text-[#854D0E] text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#B45309]" />
            <div>
              <span className="font-bold">No Target Academic Year Selected: </span>
              <span>
                Please select the target school year above or click &ldquo;Create New Academic Year&rdquo; to proceed with the rollover.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsNewYearModalOpen(true)}
            className="px-3 py-1.5 rounded-[5px] bg-[#B45309] text-white font-semibold text-xs hover:bg-[#92400E] shrink-0"
          >
            Create Year
          </button>
        </div>
      )}

      {/* Metric Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-[6px] bg-white border border-[#D5CBB2] text-xs">
          <span className="text-[10px] uppercase font-bold text-[#777777] block">Total Enrolled</span>
          <span className="text-lg font-black text-[#191919]">{candidates.length}</span>
        </div>
        <div className="p-3.5 rounded-[6px] bg-white border border-[#D5CBB2] text-xs">
          <span className="text-[10px] uppercase font-bold text-[#2A7C13] block">Promoted</span>
          <span className="text-lg font-black text-[#2A7C13]">{promotedCount}</span>
        </div>
        <div className="p-3.5 rounded-[6px] bg-white border border-[#D5CBB2] text-xs">
          <span className="text-[10px] uppercase font-bold text-[#B45309] block">On Trial</span>
          <span className="text-lg font-black text-[#B45309]">{trialCount}</span>
        </div>
        <div className="p-3.5 rounded-[6px] bg-white border border-[#D5CBB2] text-xs">
          <span className="text-[10px] uppercase font-bold text-red-700 block">Repeating</span>
          <span className="text-lg font-black text-red-700">{repeatCount}</span>
        </div>
        <div className="p-3.5 rounded-[6px] bg-white border border-[#D5CBB2] text-xs">
          <span className="text-[10px] uppercase font-bold text-[#555555] block">Graduated / Departed</span>
          <span className="text-lg font-black text-[#555555]">{graduateCount + departCount}</span>
        </div>
      </div>

      {/* Candidate Table & Filters */}
      <div className="rounded-[8px] bg-white border border-[#D5CBB2] shadow-2xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-4 bg-[#FAF8F2] border-b border-[#E8DFC9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#777777] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search candidate by name or matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-[6px] border border-[#D5D5CF] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#2A7C13]"
              />
            </div>

            {/* Stream Filter */}
            <select
              value={selectedStreamFilter}
              onChange={(e) => setSelectedStreamFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-[6px] border border-[#D5D5CF] bg-white text-xs text-[#191919] focus:outline-none"
            >
              <option value="all">All Current Classes</option>
              {currentStreamsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Decision Filter */}
            <select
              value={selectedDecisionFilter}
              onChange={(e) => setSelectedDecisionFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-[6px] border border-[#D5D5CF] bg-white text-xs text-[#191919] focus:outline-none"
            >
              <option value="all">All Decision Statuses</option>
              <option value="promoted">Promoted Only</option>
              <option value="trial">Promoted on Trial Only</option>
              <option value="repeated">Repeating Only</option>
              <option value="graduated">Graduated Only</option>
              <option value="transferred">Departed / Transferred</option>
            </select>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExecuteRollover}
              disabled={isExecuting || candidates.length === 0 || !targetYearId}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-xs font-bold bg-[#2A7C13] hover:bg-[#20600E] text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Rollover...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Execute Rollover ({candidates.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Candidate Table */}
        <div className="overflow-x-auto">
          {loadingPreview ? (
            <div className="py-20 flex flex-col items-center justify-center text-[#666666] space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#2A7C13]" />
              <p className="text-xs">Computing student annual marks and council standing...</p>
            </div>
          ) : previewError ? (
            <div className="p-8 text-center text-xs text-red-700 space-y-1">
              <p className="font-bold">Error loading candidates</p>
              <p>{previewError}</p>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#777777]">
              No students found matching your search or filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F2] border-b border-[#E8DFC9] text-[10px] font-bold text-[#555555] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Student &amp; Matricule</th>
                  <th className="py-2.5 px-2">Current Class</th>
                  <th className="py-2.5 px-2 text-center">Annual Mark (/20)</th>
                  <th className="py-2.5 px-2 text-center">Class Rank</th>
                  <th className="py-2.5 px-2">Council Decision</th>
                  <th className="py-2.5 px-3">Target Stream (New Session)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFC9]">
                {filteredCandidates.map((cand) => (
                  <tr key={cand.studentId} className="hover:bg-[#FFFDF9] transition-colors">
                    {/* Student */}
                    <td className="py-2 px-3">
                      <div className="font-bold text-[#191919]">{cand.fullName}</div>
                      <div className="text-[10px] font-mono text-[#777777]">
                        {cand.matricule} - {cand.gender === "M" ? "Male" : "Female"}
                        {cand.isCurrentRepeater && (
                          <span className="ml-1 text-amber-700 font-sans font-bold">(Repeater)</span>
                        )}
                      </div>
                    </td>

                    {/* Current Class */}
                    <td className="py-2 px-2 text-[#555555] font-medium">
                      {cand.currentStreamName}
                    </td>

                    {/* Annual Average */}
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.5 rounded-[4px] ${
                          cand.annualAverage === null
                            ? "bg-[#F0EFEA] text-[#777777]"
                            : cand.annualAverage >= 10.0
                            ? "bg-[#EAF7E4] text-[#1F5C0E] border border-[#76C457]/40"
                            : cand.annualAverage >= 8.5
                            ? "bg-[#FFF8CF] text-[#854D0E] border border-[#FBE6C2]"
                            : "bg-[#FFF0F0] text-[#991B1B] border border-[#FCA5A5]"
                        }`}
                      >
                        {cand.annualAverage !== null ? `${cand.annualAverage.toFixed(2)}/20` : "No Marks"}
                      </span>
                    </td>

                    {/* Class Rank */}
                    <td className="py-2 px-2 text-center text-[#555555] font-mono text-[11px]">
                      {cand.rank}/{cand.totalInStream}
                    </td>

                    {/* Decision Selector */}
                    <td className="py-2 px-2">
                      <select
                        value={cand.userDecision}
                        onChange={(e) =>
                          handleCandidateDecisionChange(
                            cand.studentId,
                            e.target.value as CandidateRow["userDecision"]
                          )
                        }
                        className={`px-2 py-1 rounded-[4px] border text-xs font-semibold focus:outline-none ${
                          cand.userDecision === "promoted"
                            ? "bg-[#EAF7E4] border-[#76C457]/50 text-[#1F5C0E]"
                            : cand.userDecision === "trial"
                            ? "bg-[#FFF8CF] border-[#FBE6C2] text-[#854D0E]"
                            : cand.userDecision === "repeated"
                            ? "bg-[#FFF0F0] border-[#FCA5A5] text-[#991B1B]"
                            : cand.userDecision === "graduated"
                            ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]"
                            : "bg-gray-100 border-gray-300 text-gray-700"
                        }`}
                      >
                        <option value="promoted">Promote (Admis)</option>
                        <option value="trial">Promote on Trial (À titre d&apos;essai)</option>
                        <option value="repeated">Repeat (Redouble)</option>
                        <option value="graduated">Graduated (Diplômé)</option>
                        <option value="transferred">Transferred Out / Left</option>
                      </select>
                    </td>

                    {/* Target Stream */}
                    <td className="py-2 px-3">
                      {cand.userDecision === "graduated" ||
                      cand.userDecision === "transferred" ||
                      cand.userDecision === "withdrawn" ? (
                        <span className="text-[11px] text-[#777777] italic">
                          No enrolment needed ({cand.userDecision})
                        </span>
                      ) : targetStreams.length === 0 ? (
                        <span className="text-[11px] text-[#B45309] font-medium">
                          Select target year above to assign stream
                        </span>
                      ) : (
                        <select
                          value={cand.targetStreamId}
                          onChange={(e) =>
                            handleCandidateTargetStreamChange(cand.studentId, e.target.value)
                          }
                          className="w-full px-2 py-1 rounded-[4px] border border-[#D5D5CF] bg-white text-xs font-medium text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#2A7C13]"
                        >
                          {targetStreams.map((ts) => (
                            <option key={ts.id} value={ts.id}>
                              {ts.name} (Level {ts.level_order})
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE NEW ACADEMIC YEAR MODAL */}
      {isNewYearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[8px] bg-white border border-[#D5CBB2] shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-[#FAF8F2] border-b border-[#E8DFC9] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#142010]">
                Create New Academic Year
              </h3>
              <button
                type="button"
                onClick={() => setIsNewYearModalOpen(false)}
                className="text-[#777777] hover:text-[#191919] text-xs font-bold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateNewYear} className="p-5 space-y-4 text-xs">
              {newYearError && (
                <div className="p-2.5 rounded-[5px] bg-red-50 border border-red-200 text-red-700 text-xs">
                  {newYearError}
                </div>
              )}

              <div>
                <label className="block font-bold text-[#191919] mb-1">
                  Academic Year Name (e.g. 2027/2028)
                </label>
                <input
                  type="text"
                  required
                  placeholder="2027/2028"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] border border-[#D5D5CF] text-xs focus:outline-none focus:ring-1 focus:ring-[#2A7C13]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#191919] mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newYearStartDate}
                    onChange={(e) => setNewYearStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] border border-[#D5D5CF] text-xs focus:outline-none focus:ring-1 focus:ring-[#2A7C13]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#191919] mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newYearEndDate}
                    onChange={(e) => setNewYearEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] border border-[#D5D5CF] text-xs focus:outline-none focus:ring-1 focus:ring-[#2A7C13]"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-[#E8DFC9]">
                <input
                  type="checkbox"
                  id="cloneCurriculum"
                  checked={cloneCurriculum}
                  onChange={(e) => setCloneCurriculum(e.target.checked)}
                  className="mt-0.5 rounded text-[#2A7C13] focus:ring-[#2A7C13]"
                />
                <label htmlFor="cloneCurriculum" className="text-[11px] text-[#555555] leading-snug">
                  <strong>Clone class streams and subjects:</strong> Automatically create the same class groups and copy their subject coefficients from the current academic year.
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8DFC9]">
                <button
                  type="button"
                  onClick={() => setIsNewYearModalOpen(false)}
                  className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[#555555] hover:bg-[#FAF8F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewYear}
                  className="px-4 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingNewYear ? "Creating..." : "Create Academic Year"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
