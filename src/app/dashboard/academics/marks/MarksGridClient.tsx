"use client";

import { useState, useTransition, useCallback, memo, useEffect, useRef } from "react";
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
  buildSheetKey,
  saveLocalDraft,
  getLocalDraft,
  enqueueSyncItem,
  removeSyncItem,
  getPendingSyncCount,
  detectLocalHub,
  syncDirectToLocalHub,
  syncAllDraftsToLocalHub,
  getStoredHubHost,
  saveStoredHubHost,
} from "@/lib/academic/offline-marks-db";
import { MarksSyncStatusBadge, SyncState } from "@/components/academics/MarksSyncStatusBadge";
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
  LayoutGrid,
  List,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  WifiOff,
  RefreshCw,
  HardDrive,
  Radio,
  Server,
  X,
  Wifi,
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
  initialCompetency?: string;
  isApproved: boolean;
  approvalStatus?: string;
  approvalNotes?: string;
  approverName?: string;
  approvedAt?: string;
  canApprove: boolean;
  isTeacher?: boolean;
  hasActiveHod?: boolean;
  activeHodName?: string;
  isAdmin?: boolean;
  isHodUser?: boolean;
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
  initialCompetency,
  isApproved,
  approvalStatus = "draft",
  approvalNotes,
  approverName,
  approvedAt,
  canApprove,
  isTeacher,
  hasActiveHod = false,
  activeHodName,
  isAdmin = false,
  isHodUser = false,
  students: initialStudents,
}: MarksGridClientProps) {
  const [students, setStudents] = useState<StudentRow[]>(initialStudents);
  const [maxMarks, setMaxMarks] = useState<number>(initialMaxMarks);
  const [competency, setCompetency] = useState<string>(initialCompetency || "");
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
  const [showFloatingDock, setShowFloatingDock] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [viewMode, setViewMode] = useState<"auto" | "cards" | "table">("auto");
  const bottomCardRef = useRef<HTMLDivElement>(null);

  // ── Offline-First & Local Storage State ───────────────────────────────
  const sheetKey = buildSheetKey(academicYearId, sequenceId, classStreamId, subjectId);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncState, setSyncState] = useState<SyncState>("synced");
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isSyncingManual, setIsSyncingManual] = useState<boolean>(false);
  const [restoredMessage, setRestoredMessage] = useState<string | null>(null);

  // ── School Hub Direct LAN Transfer State ───────────────────────────
  const [isHubReachable, setIsHubReachable] = useState<boolean>(false);
  const [hubName, setHubName] = useState<string>("School LAN Hub");
  const [isTransferringHub, setIsTransferringHub] = useState<boolean>(false);
  const [showHubModal, setShowHubModal] = useState<boolean>(false);
  const [customHubHost, setCustomHubHost] = useState<string>("");
  const [bulkTransferStatus, setBulkTransferStatus] = useState<{ message: string; success: boolean } | null>(null);

  // Keep latest mutable references to avoid stale closure in background timers
  const studentsRef = useRef<StudentRow[]>(students);
  const maxMarksRef = useRef<number>(maxMarks);
  const competencyRef = useRef<string>(competency);
  const isSyncingRef = useRef<boolean>(false);
  const localSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundFlushTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    studentsRef.current = students;
    maxMarksRef.current = maxMarks;
    competencyRef.current = competency;
  });

  // Synchronize internal state when props update (e.g., when changing class stream or sequence)
  useEffect(() => {
    setStudents(initialStudents);
    setMaxMarks(initialMaxMarks);
    setCompetency(initialCompetency || "");
    setCurrentStatus(approvalStatus || (isApproved ? "approved" : "draft"));
    setCurrentNotes(approvalNotes);
    setCurrentApprover(approverName);
    setCurrentApprovedAt(approvedAt);
    setSelectedIds(new Set());
    setIsDirty(false);
  }, [
    initialStudents,
    initialMaxMarks,
    initialCompetency,
    approvalStatus,
    isApproved,
    approvalNotes,
    approverName,
    approvedAt,
  ]);

  // Permission calculation:
  // HOD and Administrator can ALWAYS edit marks (in draft, submitted, or approved states)
  // Teachers can edit when status is 'draft' or 'rejected' (reopened for corrections)
  const canEdit = canApprove ? true : currentStatus === "draft" || currentStatus === "rejected";
  const isSubmitted = currentStatus === "submitted";
  const isFinalApproved = currentStatus === "approved";
  const isReopened = currentStatus === "rejected";

  /**
   * Check reachability of on-premise School Hub on the local Wi-Fi.
   */
  const checkHubReachability = useCallback(async () => {
    try {
      const hub = await detectLocalHub();
      if (hub.reachable) {
        setIsHubReachable(true);
        if (hub.hubName) setHubName(hub.hubName);
      } else {
        setIsHubReachable(false);
      }
    } catch {
      setIsHubReachable(false);
    }
  }, []);

  /**
   * Direct transfer of current mark sheet to School Hub over local school Wi-Fi.
   */
  const handleTransferToHub = useCallback(async () => {
    setIsTransferringHub(true);
    try {
      const res = await syncDirectToLocalHub({
        academicYearId,
        termId,
        sequenceId,
        classStreamId,
        subjectId,
        maxMarks: maxMarksRef.current,
        competencyDescription: competencyRef.current,
        marks: studentsRef.current.map((s) => ({
          studentId: s.studentId,
          score: s.score,
          status: s.status,
          remarks: s.remarks,
        })),
      });

      if (res.success) {
        setSyncState("synced_hub");
        setIsHubReachable(true);
        setMessage({ type: "success", text: res.message });
      } else {
        setMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to transfer marks to School Hub over Wi-Fi.",
      });
    } finally {
      setIsTransferringHub(false);
    }
  }, [academicYearId, termId, sequenceId, classStreamId, subjectId]);

  /**
   * Bulk transfer of all cached mark sheets on device to School Hub over Wi-Fi.
   */
  const handleBulkTransferToHub = useCallback(async () => {
    setIsTransferringHub(true);
    setBulkTransferStatus(null);
    try {
      const res = await syncAllDraftsToLocalHub();
      setBulkTransferStatus({ success: res.success, message: res.message });
      if (res.success) {
        setIsHubReachable(true);
        setSyncState("synced_hub");
      }
    } catch (err: any) {
      setBulkTransferStatus({
        success: false,
        message: err.message || "Bulk transfer encountered an error.",
      });
    } finally {
      setIsTransferringHub(false);
    }
  }, []);

  /**
   * Flush pending mutations from IndexedDB outbox to the server in the background.
   */
  const flushPendingSync = useCallback(
    async (isManual = false): Promise<boolean> => {
      if (typeof window === "undefined") return false;

      // When phone has no internet, attempt direct School Hub sync over local Wi-Fi
      if (!navigator.onLine) {
        if (isManual) {
          setIsSyncingManual(true);
          try {
            const hubRes = await syncDirectToLocalHub({
              academicYearId,
              termId,
              sequenceId,
              classStreamId,
              subjectId,
              maxMarks: maxMarksRef.current,
              competencyDescription: competencyRef.current,
              marks: studentsRef.current.map((s) => ({
                studentId: s.studentId,
                score: s.score,
                status: s.status,
                remarks: s.remarks,
              })),
            });
            setIsSyncingManual(false);

            if (hubRes.success) {
              setSyncState("synced_hub");
              setIsHubReachable(true);
              setMessage({
                type: "success",
                text: `No internet, but ${hubRes.message}`,
              });
              return true;
            }
          } catch {
            setIsSyncingManual(false);
          }
        }

        setSyncState("pending_offline");
        if (isManual) {
          setMessage({
            type: "error",
            text: "Offline: Marks are safely saved on your device. Connect to internet or school Wi-Fi to sync.",
          });
        }
        return false;
      }

      if (isSyncingRef.current) return false;
      isSyncingRef.current = true;
      setSyncState("syncing_cloud");
      if (isManual) setIsSyncingManual(true);

      try {
        const res = await saveSequenceMarksAction({
          academicYearId,
          termId,
          sequenceId,
          classStreamId,
          subjectId,
          maxMarks: maxMarksRef.current,
          competencyDescription: competencyRef.current,
          marks: studentsRef.current.map((s) => ({
            studentId: s.studentId,
            score: s.score,
            status: s.status,
            remarks: s.remarks,
          })),
        });

        if (res?.error) {
          // Cloud error fallback: Try direct School Hub transfer if on school Wi-Fi
          try {
            const hubRes = await syncDirectToLocalHub({
              academicYearId,
              termId,
              sequenceId,
              classStreamId,
              subjectId,
              maxMarks: maxMarksRef.current,
              competencyDescription: competencyRef.current,
              marks: studentsRef.current.map((s) => ({
                studentId: s.studentId,
                score: s.score,
                status: s.status,
                remarks: s.remarks,
              })),
            });
            if (hubRes.success) {
              setSyncState("synced_hub");
              setIsHubReachable(true);
              if (isManual) {
                setMessage({
                  type: "success",
                  text: `Cloud sync unavailable, but ${hubRes.message}`,
                });
              }
              return true;
            }
          } catch {
            // continue
          }

          setSyncState("pending_offline");
          if (isManual) setMessage({ type: "error", text: res.error });
          return false;
        } else {
          await removeSyncItem(sheetKey);
          const remaining = await getPendingSyncCount();
          setPendingCount(remaining);
          setSyncState("synced");
          setIsDirty(false);
          setLastSyncedAt(new Date());
          if (isManual) {
            setMessage({
              type: "success",
              text: "All marks successfully synchronized with the cloud!",
            });
          }
          return true;
        }
      } catch (err: any) {
        console.warn("[OfflineSync] Network error syncing marks:", err);
        // Fallback: Check if School Hub is reachable over local Wi-Fi
        try {
          const hubRes = await syncDirectToLocalHub({
            academicYearId,
            termId,
            sequenceId,
            classStreamId,
            subjectId,
            maxMarks: maxMarksRef.current,
            competencyDescription: competencyRef.current,
            marks: studentsRef.current.map((s) => ({
              studentId: s.studentId,
              score: s.score,
              status: s.status,
              remarks: s.remarks,
            })),
          });
          if (hubRes.success) {
            setSyncState("synced_hub");
            setIsHubReachable(true);
            if (isManual) {
              setMessage({
                type: "success",
                text: `Cloud sync interrupted, but ${hubRes.message}`,
              });
            }
            return true;
          }
        } catch {
          // continue
        }

        setSyncState("pending_offline");
        if (isManual) {
          setMessage({
            type: "error",
            text: "Network connection was interrupted. Marks remain saved safely on your device.",
          });
        }
        return false;
      } finally {
        isSyncingRef.current = false;
        if (isManual) setIsSyncingManual(false);
      }
    },
    [academicYearId, termId, sequenceId, classStreamId, subjectId, sheetKey]
  );

  /**
   * Schedule a debounced background sync to send queued changes to the server.
   */
  const scheduleBackgroundFlush = useCallback(() => {
    if (backgroundFlushTimerRef.current) {
      clearTimeout(backgroundFlushTimerRef.current);
    }
    backgroundFlushTimerRef.current = setTimeout(() => {
      flushPendingSync(false);
    }, 1500);
  }, [flushPendingSync]);

  /**
   * Local-First Persistence:
   * 1. Instantly writes to IndexedDB (zero lag, <2ms).
   * 2. Enqueues mutation to background outbox.
   * 3. Schedules non-blocking background flush if online.
   */
  const scheduleLocalPersistAndSync = useCallback(
    (updatedStudents: StudentRow[], currentMaxMarks: number, currentComp: string) => {
      setIsDirty(true);
      setSyncState("saving_local");

      if (localSaveTimerRef.current) {
        clearTimeout(localSaveTimerRef.current);
      }

      localSaveTimerRef.current = setTimeout(async () => {
        const draftPayload = {
          sheetKey,
          academicYearId,
          termId,
          sequenceId,
          classStreamId,
          subjectId,
          maxMarks: currentMaxMarks,
          competencyDescription: currentComp,
          marks: updatedStudents.map((s) => ({
            studentId: s.studentId,
            score: s.score,
            status: s.status,
            remarks: s.remarks,
          })),
          updatedAt: Date.now(),
          isSynced: false,
        };

        // Instant local persistence
        await saveLocalDraft(draftPayload);
        await enqueueSyncItem({
          ...draftPayload,
          enqueuedAt: Date.now(),
          retryCount: 0,
        });

        const count = await getPendingSyncCount();
        setPendingCount(count);

        if (navigator.onLine) {
          setSyncState("pending_offline");
          scheduleBackgroundFlush();
        } else {
          setSyncState("pending_offline");
        }
      }, 300);
    },
    [sheetKey, academicYearId, termId, sequenceId, classStreamId, subjectId, scheduleBackgroundFlush]
  );

  // Hydrate from IndexedDB on initial mount & listen for network status changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);

    let isMounted = true;
    async function checkOfflineCache() {
      try {
        const pending = await getPendingSyncCount();
        if (isMounted) setPendingCount(pending);

        const localDraft = await getLocalDraft(sheetKey);
        if (!isMounted || !localDraft) return;

        // If local draft has un-synced entries that differ from server initial
        if (localDraft.marks && localDraft.marks.length > 0 && !localDraft.isSynced) {
          const hasDifferences = localDraft.marks.some((dm) => {
            const initMatch = initialStudents.find((s) => s.studentId === dm.studentId);
            if (!initMatch) return false;
            return (
              initMatch.score !== dm.score ||
              initMatch.status !== dm.status ||
              (initMatch.remarks || "") !== (dm.remarks || "")
            );
          });

          if (hasDifferences) {
            setStudents((prev) =>
              prev.map((s) => {
                const dm = localDraft.marks.find((m) => m.studentId === s.studentId);
                if (!dm) return s;
                return {
                  ...s,
                  score: dm.score,
                  status: dm.status,
                  remarks: dm.remarks ?? s.remarks,
                };
              })
            );
            if (localDraft.maxMarks) setMaxMarks(localDraft.maxMarks);
            if (localDraft.competencyDescription) setCompetency(localDraft.competencyDescription);

            setIsDirty(true);
            setSyncState("pending_offline");
            setRestoredMessage(
              "Found unsynced marks saved on this device. Restored your offline edits safely."
            );

            // Attempt background sync if online
            if (navigator.onLine) {
              setTimeout(() => {
                flushPendingSync(false);
              }, 1200);
            }
          }
        }
      } catch (err) {
        console.warn("[OfflineDB] Error checking offline cache:", err);
      }
    }

    checkOfflineCache();
    checkHubReachability();
    const stored = getStoredHubHost();
    if (stored) setCustomHubHost(stored);

    const handleOnline = () => {
      setIsOnline(true);
      flushPendingSync(false);
      checkHubReachability();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncState("pending_offline");
      checkHubReachability();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic retry & School Hub detection every 25 seconds
    const intervalId = setInterval(() => {
      if (navigator.onLine && pendingCount > 0 && !isSyncingRef.current) {
        flushPendingSync(false);
      }
      checkHubReachability();
    }, 25000);

    return () => {
      isMounted = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, [sheetKey, flushPendingSync, checkHubReachability, initialStudents]);

  // Tab unload warning if pending unsynced changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingCount > 0 && isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsynced marks. They are saved on this device, but leaving before sync may delay cloud updates.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pendingCount, isDirty]);

  const handleScoreChange = useCallback(
    (index: number, val: string) => {
      const num = val === "" ? null : parseFloat(val);
      setStudents((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          score: isNaN(num as number) ? null : num,
          status: num !== null && num > 0 ? "present" : updated[index].status,
        };
        scheduleLocalPersistAndSync(updated, maxMarksRef.current, competencyRef.current);
        return updated;
      });
    },
    [scheduleLocalPersistAndSync]
  );

  const handleScoreKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextInput = document.querySelector<HTMLInputElement>(`input[data-score-idx="${index + 1}"]`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
        nextInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevInput = document.querySelector<HTMLInputElement>(`input[data-score-idx="${index - 1}"]`);
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
        prevInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, []);

  const handleStatusChange = useCallback(
    (index: number, newStatus: "present" | "absent" | "exempt") => {
      setStudents((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: newStatus,
          score: newStatus !== "present" ? null : updated[index].score,
        };
        scheduleLocalPersistAndSync(updated, maxMarksRef.current, competencyRef.current);
        return updated;
      });
    },
    [scheduleLocalPersistAndSync]
  );

  const handleRemarksChange = useCallback(
    (index: number, rem: string) => {
      setStudents((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          remarks: rem,
        };
        scheduleLocalPersistAndSync(updated, maxMarksRef.current, competencyRef.current);
        return updated;
      });
    },
    [scheduleLocalPersistAndSync]
  );

  const handleToggleSelectAll = () => {
    if (selectedIds.size === students.length && students.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.studentId)));
    }
  };

  const handleToggleSelectRow = useCallback((studentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  }, []);

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
    scheduleLocalPersistAndSync(updated, maxMarksRef.current, competencyRef.current);
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
    scheduleLocalPersistAndSync(updated, maxMarksRef.current, competencyRef.current);
    setMessage({
      type: "success",
      text: `Successfully applied marks for ${appliedCount} students from file. All marks are saved locally on your device.`,
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

  const handleSaveDraft = (silent = false): Promise<boolean> => {
    setMessage(null);
    return new Promise<boolean>((resolve) => {
      startTransition(async () => {
        // 1. Immediately persist locally to IndexedDB
        const draftPayload = {
          sheetKey,
          academicYearId,
          termId,
          sequenceId,
          classStreamId,
          subjectId,
          maxMarks: maxMarksRef.current,
          competencyDescription: competencyRef.current,
          marks: studentsRef.current.map((s) => ({
            studentId: s.studentId,
            score: s.score,
            status: s.status,
            remarks: s.remarks,
          })),
          updatedAt: Date.now(),
          isSynced: false,
        };

        await saveLocalDraft(draftPayload);
        await enqueueSyncItem({
          ...draftPayload,
          enqueuedAt: Date.now(),
          retryCount: 0,
        });

        const count = await getPendingSyncCount();
        setPendingCount(count);

        // 2. If offline, confirm local save on device
        if (!navigator.onLine) {
          setSyncState("pending_offline");
          if (!silent) {
            setMessage({
              type: "success",
              text: "Working Offline: Marks saved securely on your device. They will synchronize automatically with the cloud when your connection is restored.",
            });
          }
          resolve(true);
          return;
        }

        // 3. If online, flush pending sync immediately
        const synced = await flushPendingSync(false);
        if (synced) {
          if (!silent) {
            setMessage({
              type: "success",
              text: canApprove
                ? "Marks changes saved to cloud."
                : hasActiveHod
                ? "Draft marks saved to cloud successfully. You can continue updating or submit to HOD when ready."
                : "Draft marks saved to cloud successfully. You can continue updating or submit to Administration when ready.",
            });
          }
          resolve(true);
        } else {
          if (!silent) {
            setMessage({
              type: "error",
              text: "Network connection was interrupted. Marks remain saved safely on your device and will retry in the background.",
            });
          }
          resolve(false);
        }
      });
    });
  };

  const handleSaveDraftRef = useRef<(silent?: boolean) => Promise<boolean>>(() => Promise.resolve(false));

  useEffect(() => {
    handleSaveDraftRef.current = handleSaveDraft;
  });

  // Track scroll position to reveal the floating action island mid-page and hide at top and bottom
  useEffect(() => {
    const handleScroll = () => {
      // 1. Accurately measure scroll position from whichever element is scrolling
      const scrollY = Math.max(
        window.scrollY || 0,
        document.documentElement.scrollTop || 0,
        document.body.scrollTop || 0,
        document.querySelector("main")?.scrollTop || 0
      );

      // Must be scrolled down past top controls (~120px)
      const pastTop = scrollY > 120;

      // 2. Measure total scroll distance to detect when at the end of the page
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight || 0,
        document.body.scrollHeight || 0,
        document.querySelector("main")?.scrollHeight || 0
      );
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
      const distFromBottom = scrollHeight - (scrollY + viewportHeight);

      // Hide if reached the end of the page (within 80px)
      let atBottom = distFromBottom <= 80;

      // Also hide if the bottom card is comfortably in view
      if (!atBottom && bottomCardRef.current) {
        const rect = bottomCardRef.current.getBoundingClientRect();
        if (rect.top <= viewportHeight - 160 && rect.bottom <= viewportHeight + 120) {
          atBottom = true;
        }
      }

      setShowFloatingDock(pastTop && !atBottom);
    };

    // Use capture: true so scroll events from both <main> and window are captured
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true } as any);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // Global keyboard shortcut: Ctrl+S or Cmd+S to quickly save marks without moving mouse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (canEdit && !isPending) {
          handleSaveDraftRef.current(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canEdit, isPending]);

  const handleConfirmSubmitToHod = async () => {
    setMessage(null);
    setShowSubmitModal(false);

    // If offline, check if online before submitting
    if (!navigator.onLine) {
      setMessage({
        type: "error",
        text: hasActiveHod
          ? "You are currently offline. Marks are saved safely on your device, but an active internet connection is required to submit to your Head of Department. Please reconnect and submit."
          : "You are currently offline. Marks are saved safely on your device, but an active internet connection is required to submit to School Administration. Please reconnect and submit.",
      });
      return;
    }

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
          text: hasActiveHod
            ? "Marks successfully submitted to Head of Department for review. Editing is now locked for teachers."
            : "Marks successfully submitted to School Administration for review. Editing is now locked for teachers.",
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
      formData.set("academicYearId", academicYearId);
      formData.set("termId", termId);
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

  // Compute live averages & progress statistics
  const presentStudents = students.filter((s) => s.status === "present" && s.score !== null);
  const avgOutOf20 =
    presentStudents.length > 0
      ? (
          presentStudents.reduce((acc, curr) => acc + ((curr.score! / maxMarks) * 20), 0) /
          presentStudents.length
        ).toFixed(2)
      : null;

  const totalStudentsCount = students.length;
  const recordedStudentsCount = students.filter(
    (s) => s.score !== null || s.status === "absent" || s.status === "exempt"
  ).length;
  const pendingStudentsCount = Math.max(0, totalStudentsCount - recordedStudentsCount);

  const renderSaveAndSubmitButtons = (size: "normal" | "large" = "normal") => {
    if (!canEdit) {
      if (isSubmitted) {
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-[6px] bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] font-bold ${
              size === "large" ? "px-4 py-2.5 text-xs" : "px-3 py-1.5 text-xs"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>{hasActiveHod ? "Submitted to HOD" : "Submitted to Admin"}</span>
          </span>
        );
      }
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-[6px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] font-bold ${
            size === "large" ? "px-4 py-2.5 text-xs" : "px-3 py-1.5 text-xs"
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-[#7A4A00]" />
          <span>Approved &amp; Locked</span>
        </span>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {isDirty ? (
          <button
            type="button"
            onClick={() => handleSaveDraft(false)}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer ${
              size === "large" ? "px-5 py-2.5 text-xs" : "px-3.5 py-1.5 text-xs"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isPending ? "Saving..." : canApprove ? "Save Changes" : "Save Draft"}</span>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" title="Unsaved changes" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSaveDraft(false)}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 rounded-[6px] bg-[#F5F5F0] hover:bg-[#EAEAE5] text-[#555555] font-semibold border border-[#D5D5CF] transition-colors cursor-pointer ${
              size === "large" ? "px-5 py-2.5 text-xs" : "px-3.5 py-1.5 text-xs"
            }`}
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
            className={`inline-flex items-center gap-1.5 rounded-[6px] bg-[#142010] hover:bg-[#2A7C13] text-white font-bold shadow-xs transition-colors cursor-pointer ${
              size === "large" ? "px-5 py-2.5 text-xs" : "px-3.5 py-1.5 text-xs"
            }`}
            title={hasActiveHod ? "Submit mark sheet to Head of Department" : "Submit mark sheet to School Administration"}
          >
            <Send className="w-3.5 h-3.5 text-[#76C457]" />
            <span>{hasActiveHod ? "Submit to HOD" : "Submit to Admin"}</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-24">
      {/* ── Top Header: 2 Distinct Columns (Details vs Offline Tools) ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Column 1 (Left 7 cols): Subject Details & Denominator Settings */}
        <div className="lg:col-span-7 p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs flex flex-col justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-[#525E4B] uppercase tracking-wider block">
                Target Evaluation &amp; Subject
              </span>
              <h2 className="text-base font-extrabold text-[#142010] flex flex-wrap items-center gap-2 mt-0.5">
                <span>{subjectName}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]">
                  Weight: Coef {coefficient}
                </span>
              </h2>
              <p className="text-xs text-[#525E4B] mt-0.5">
                {streamName} · <strong className="text-[#142010]">{sequenceName}</strong>
              </p>
            </div>

            {/* Workflow Status Badge */}
            <div>
              {isFinalApproved ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-[#166534]" />
                  <span>Approved &amp; Locked</span>
                </span>
              ) : isSubmitted ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>{hasActiveHod ? "Under HOD Review" : "Under Admin Review"}</span>
                </span>
              ) : isReopened ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-[#FFF8CF] text-[#7A4A00] border border-[#FBE6C2] text-xs font-bold">
                  <RotateCcw className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Reopened for Revision</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-[#F5F5F0] text-[#555555] border border-[#D5D5CF] text-xs font-bold">
                  <Unlock className="w-3.5 h-3.5 text-[#2A7C13]" />
                  <span>Draft Mode</span>
                </span>
              )}
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#E8DFC9]/70 flex flex-wrap items-center gap-2 text-xs">
            <label htmlFor="maxMarksInput" className="font-semibold text-[#525E4B]">
              Max Denominator:
            </label>
            <input
              id="maxMarksInput"
              type="number"
              disabled={!canEdit}
              value={maxMarks}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 20;
                setMaxMarks(val);
                scheduleLocalPersistAndSync(studentsRef.current, val, competencyRef.current);
              }}
              className="w-16 px-2 py-1 rounded-[5px] border border-[#E8DFC9] text-center font-mono font-bold text-xs bg-[#FFFDF5] focus:outline-none focus:border-[#2A7C13] disabled:opacity-60"
            />
            <span className="text-[11px] text-[#788470]">
              (Default /20 for general subjects, /40–/100 for technical subjects)
            </span>
          </div>
        </div>

        {/* Column 2 (Right 5 cols): Offline Spreadsheet Tools Section */}
        <div className="lg:col-span-5 p-4 rounded-[8px] bg-[#FAFAF7] border border-[#E8DFC9] shadow-2xs flex flex-col justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#2A7C13]" />
              <h3 className="text-xs font-bold text-[#142010] uppercase tracking-wide">
                Offline Spreadsheet Tools
              </h3>
            </div>
            <p className="text-[11px] text-[#666666] mt-1 leading-snug">
              Prefer grading offline? Download the official class roster CSV, enter marks in Excel or Google Sheets, and import back in one click.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E8DFC9]/70">
            {canEdit ? (
              <>
                <button
                  type="button"
                  onClick={handleQuickDownloadTemplate}
                  title="Download pre-filled CSV sheet with your class roster"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-white hover:bg-[#F5F5F0] text-[#191919] border border-[#D5D5CF] font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#2A7C13]" />
                  <span>Download Template</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  title="Import student scores from Excel or CSV file"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Import Excel / CSV</span>
                </button>
              </>
            ) : (
              <span className="text-[11px] text-[#788470] italic">
                Spreadsheet import disabled while marks are locked.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Separate Line: Online Mark Entry Grid Status & Top Actions ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A7C13]" />
            <span className="font-bold text-[#142010]">Mark Entry Roster</span>
          </div>
          <div className="h-3.5 w-px bg-[#E8DFC9] hidden sm:block" />
          <div className="text-[#525E4B]">
            Progress: <strong className="text-[#142010]">{recordedStudentsCount}</strong> of{" "}
            <strong className="text-[#142010]">{totalStudentsCount}</strong> entered
            {pendingStudentsCount > 0 ? (
              <span className="ml-1 text-[#A16207] font-semibold">({pendingStudentsCount} pending)</span>
            ) : (
              <span className="ml-1 text-[#2A7C13] font-semibold">(Complete ✓)</span>
            )}
          </div>
          <div className="h-3.5 w-px bg-[#E8DFC9] hidden md:block" />
          {/* Real-Time Device Storage & Cloud Sync Status Badge */}
          <MarksSyncStatusBadge
            isOnline={isOnline}
            syncState={syncState}
            pendingCount={pendingCount}
            lastSyncedAt={lastSyncedAt}
            onSyncNow={() => flushPendingSync(true)}
            isSyncingManual={isSyncingManual}
            isHubReachable={isHubReachable}
            hubName={hubName}
            onTransferToHub={handleTransferToHub}
            isTransferringHub={isTransferringHub}
            onOpenHubSettings={() => setShowHubModal(true)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8DFC9]/70">
          {/* Mobile/Desktop View Switcher */}
          <div className="inline-flex items-center rounded-[6px] border border-[#E8DFC9] p-0.5 bg-[#F5EFE0]/70 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] font-bold text-[11px] transition-colors cursor-pointer ${
                viewMode === "cards" || (viewMode === "auto")
                  ? "bg-white text-[#142010] shadow-xs"
                  : "text-[#666666] hover:text-[#142010]"
              } ${viewMode === "auto" ? "md:hidden" : ""}`}
              title="Touch Cards view (recommended for smartphones)"
            >
              <List className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] font-bold text-[11px] transition-colors cursor-pointer ${
                viewMode === "table" || (viewMode === "auto")
                  ? "bg-white text-[#142010] shadow-xs"
                  : "text-[#666666] hover:text-[#142010]"
              } ${viewMode === "auto" ? "hidden md:inline-flex" : ""}`}
              title="Table view (recommended for laptops & desktops)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {renderSaveAndSubmitButtons("normal")}
          </div>
        </div>
      </div>

      {/* State Workflow Banners */}
      {isReopened && (
        <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-[#FFF8CF] border border-[#FBE6C2] text-xs">
          <RotateCcw className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#7A4A00]">
              Reopened for Correction by {hasActiveHod ? "Head of Department" : "School Administration"}
            </p>
            <p className="text-[#854D0E]">
              <strong>Reason / Audit Justification:</strong> {currentNotes || "Marks correction re-enabled by supervisor."}
            </p>
            <p className="text-[11px] text-[#A16207]">
              You may update the verified score(s) below and click &ldquo;Submit to {hasActiveHod ? "HOD" : "Admin"}&rdquo; once corrected.
            </p>
          </div>
        </div>
      )}

      {isSubmitted && (
        <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-[#EFF6FF] border border-[#BFDBFE] text-xs">
          <Clock className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#1E40AF]">
              {hasActiveHod ? "Submitted to Head of Department · Under Quality Review" : "Submitted to School Administration · Under Review"}
            </p>
            <p className="text-[#1E3A8A]">
              {canApprove
                ? `As ${isHodUser ? "Head of Department" : "School Administrator / Principal"}, you can review and make any adjustments to marks directly in the table below, then approve and lock or return to the teacher for revision.`
                : hasActiveHod
                ? "These marks have been submitted to your Department Head. Editing is locked to prevent unapproved changes. Contact your HOD or School Administrator if a score contestation needs to be verified."
                : "These marks have been submitted to School Administration. Editing is locked to prevent unapproved changes. Contact the School Administrator or Principal if a score contestation needs to be verified."}
            </p>
          </div>
        </div>
      )}

      {isFinalApproved && (
        <div className="flex items-start gap-3 p-3.5 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] text-xs">
          <ShieldCheck className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#166534]">
              Approved &amp; Locked by {currentApprover || approverName || (isHodUser ? "Department Head" : "School Administration")}
              {currentApprovedAt ? ` on ${new Date(currentApprovedAt).toLocaleDateString()}` : ""}
            </p>
            <p className="text-[#14532D]">
              {canApprove
                ? `Marks are officially approved and locked for report card calculation. As ${isHodUser ? "Head of Department" : "School Administrator / Principal"}, you retain authority to make supervisor corrections or reopen the sheet if a verified student contestation arises.`
                : `Marks are finalized and locked for report card generation. If a student formally contests a grade with physical proof, consult your ${hasActiveHod ? "Head of Department or School Administrator" : "School Administrator"}.`}
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {restoredMessage && (
        <div className="p-3.5 rounded-[8px] bg-[#EBF7E5] border border-[#CCECC0] text-xs flex items-center justify-between gap-3 text-[#1B5E20]">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#2A7C13] shrink-0" />
            <span className="font-semibold">{restoredMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setRestoredMessage(null)}
            className="text-[11px] font-bold text-[#2A7C13] hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

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

      {/* CBA Competence Evaluated for this Class Stream */}
      <div className="p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#EBF5E9] text-[#2A7C13] text-xs font-bold">
              ✓
            </span>
            <label className="text-xs font-bold text-[#142010]">
              CBA Competence Tested / Evaluated <span className="text-[#888888] font-normal">(Compétence Évaluée)</span>
            </label>
          </div>
          <span className="text-[11px] text-[#777777]">
            Applies to all students in <strong>{streamName}</strong>
          </span>
        </div>
        <p className="text-[11px] text-[#666666]">
          Set the pedagogical competence tested in this evaluation. This competence will be automatically printed on the official report cards of all students in this class.
        </p>
        <div className="pt-1">
          <input
            type="text"
            disabled={!canEdit}
            value={competency}
            onChange={(e) => {
              const val = e.target.value;
              setCompetency(val);
              setIsDirty(true);
              scheduleLocalPersistAndSync(studentsRef.current, maxMarksRef.current, val);
            }}
            placeholder="e.g. Résoudre un système de deux équations à deux inconnues / Express opinions on environmental preservation..."
            className="w-full px-3 py-2 text-xs rounded-[5px] border border-[#D5D5CF] bg-white text-[#191919] placeholder:text-[#999999] focus:outline-none focus:border-[#2A7C13] disabled:opacity-60 disabled:bg-[#F9F9F7]"
          />
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && canEdit && (
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

      {/* ── 1. Mobile Touch Cards View (Default for smartphones) ──────────── */}
      <div
        className={`${
          viewMode === "table" ? "hidden" : viewMode === "cards" ? "block" : "block md:hidden"
        } space-y-3`}
      >
        {students.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-[8px] border border-[#E8DFC9] text-xs text-[#788470]">
            No students are enrolled in this class group yet.
          </div>
        ) : (
          students.map((student, idx) => (
            <StudentMarkCard
              key={student.studentId}
              student={student}
              idx={idx}
              maxMarks={maxMarks}
              canEdit={canEdit}
              isSelected={selectedIds.has(student.studentId)}
              onToggleSelectRow={handleToggleSelectRow}
              onScoreChange={handleScoreChange}
              onScoreKeyDown={handleScoreKeyDown}
              onStatusChange={handleStatusChange}
              onRemarksChange={handleRemarksChange}
              onFocusInput={() => setIsInputFocused(true)}
              onBlurInput={() => setIsInputFocused(false)}
            />
          ))
        )}

        {/* Mobile Summary Card */}
        <div className="p-3.5 rounded-[8px] bg-white border border-[#E8DFC9] flex flex-wrap items-center justify-between gap-2 text-xs text-[#525E4B]">
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

      {/* ── 2. Desktop Data Table View (Default for laptops & desktops) ────── */}
      <div
        className={`${
          viewMode === "cards" ? "hidden" : viewMode === "table" ? "block" : "hidden md:block"
        } bg-white rounded-[8px] border border-[#E8DFC9] shadow-2xs overflow-hidden`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs text-left">
            <thead>
              <tr className="border-b border-[#E8DFC9] bg-[#FFFDF5] text-[#525E4B] font-semibold text-[11px]">
                <th className="py-2.5 px-3 w-16 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="checkbox"
                      disabled={!canEdit || students.length === 0}
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
                students.map((student, idx) => (
                  <StudentMarkRow
                    key={student.studentId}
                    student={student}
                    idx={idx}
                    maxMarks={maxMarks}
                    canEdit={canEdit}
                    isSelected={selectedIds.has(student.studentId)}
                    onToggleSelectRow={handleToggleSelectRow}
                    onScoreChange={handleScoreChange}
                    onScoreKeyDown={handleScoreKeyDown}
                    onStatusChange={handleStatusChange}
                    onRemarksChange={handleRemarksChange}
                    onFocusInput={() => setIsInputFocused(true)}
                    onBlurInput={() => setIsInputFocused(false)}
                  />
                ))
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

      {/* ── Dedicated End-of-List Submission Bar (After the Student List) ───── */}
      <div
        ref={bottomCardRef}
        className="p-4 sm:p-5 rounded-[8px] bg-white border-2 border-[#E8DFC9] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2A7C13]" />
            <h3 className="font-bold text-sm text-[#142010]">
              Finished Entering Marks for {streamName}?
            </h3>
          </div>
          <p className="text-xs text-[#525E4B] max-w-xl leading-relaxed">
            {canEdit
              ? pendingStudentsCount > 0
                ? `You have recorded marks for ${recordedStudentsCount} of ${totalStudentsCount} students (${pendingStudentsCount} student${pendingStudentsCount > 1 ? "s" : ""} still unrecorded). You can save draft now and return later, or submit directly to ${hasActiveHod ? "your Head of Department" : "School Administration"}.`
                : `All ${totalStudentsCount} students have recorded marks. You can save your draft or click "Submit to ${hasActiveHod ? "HOD" : "Admin"}" to forward this mark sheet for review and lock it.`
              : isSubmitted
              ? `These marks have been submitted for review (${hasActiveHod ? "Head of Department" : "School Administration"}). Editing is locked while under review.`
              : isFinalApproved
              ? "Marks for this evaluation are approved and locked for official term report card calculations."
              : "Mark editing is disabled."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {renderSaveAndSubmitButtons("large")}
        </div>
      </div>

      {/* Review & Approval Gate Panel — accessible to HODs and School Administrators */}
      {canApprove && (
        <div className="p-5 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DFC9]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2A7C13]" />
              <div>
                <h3 className="font-bold text-sm text-[#142010]">
                  {isHodUser
                    ? "Head of Department Review & Quality Control"
                    : "Administrative & Academic Quality Review"}
                </h3>
                <p className="text-[11px] text-[#525E4B]">
                  {isFinalApproved
                    ? "Marks are approved and locked. You can modify marks directly above or reopen the sheet if a verified student contestation arises."
                    : isSubmitted
                    ? isHodUser
                      ? "Teacher has submitted this mark sheet for your departmental review. You may adjust scores above, approve and lock, or return to teacher for revision."
                      : "Teacher has submitted this mark sheet for administrative review. As School Administrator / Principal, you may adjust scores above, approve and lock, or send back to teacher for revision."
                    : isHodUser
                    ? "Teacher is currently drafting marks. You can view progress and approve when finalized."
                    : "Teacher is currently drafting marks. As School Administrator, you can view progress, enter supervisor adjustments, or approve directly."}
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${
              isFinalApproved
                ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
                : isSubmitted
                ? "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]"
                : isReopened
                ? "bg-[#FFF8CF] text-[#7A4A00] border-[#FBE6C2]"
                : "bg-[#F7F3E8] text-[#555555] border-[#D5CBB2]"
            }`}>
              {isFinalApproved
                ? "Approved"
                : isSubmitted
                ? (hasActiveHod ? "Under HOD Review" : "Under Admin Review")
                : isReopened
                ? "Reopened for Revision"
                : "Draft Mode"}
            </span>
          </div>

          {isFinalApproved ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[6px] bg-[#F9FBF8] border border-[#E8DFC9]">
              <div className="text-xs text-[#525E4B]">
                <p className="font-semibold text-[#142010]">
                  Approved by {currentApprover || approverName || (isHodUser ? "Head of Department" : "School Administration")}{" "}
                  {currentApprovedAt ? `on ${new Date(currentApprovedAt).toLocaleDateString()}` : ""}
                </p>
                {currentNotes && (
                  <p className="text-[11px] text-[#777777] mt-0.5">Note: {currentNotes}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowReopenModal(true)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#FFF8CF] hover:bg-[#FDE68A] text-[#7A4A00] border border-[#FBE6C2] font-semibold text-xs transition-colors shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen Mark Sheet for Teacher</span>
              </button>
            </div>
          ) : (
            <form
              action={async (formData: FormData) => {
                await handleApproveMarks(formData);
              }}
              className="space-y-3"
            >
              <input type="hidden" name="sequenceId" value={sequenceId} />
              <input type="hidden" name="classStreamId" value={classStreamId} />
              <input type="hidden" name="departmentId" value={departmentId || ""} />
              <input type="hidden" name="subjectId" value={subjectId} />
              <input type="hidden" name="academicYearId" value={academicYearId} />
              <input type="hidden" name="termId" value={termId} />

              <div>
                <label className="block text-[11px] font-semibold text-[#525E4B] mb-1">
                  Institutional Endorsement / Quality Assurance Note (optional)
                </label>
                <input
                  type="text"
                  name="notes"
                  placeholder="e.g. Marks distribution audited and approved for report card inclusion."
                  className="w-full px-3 py-2 rounded-[5px] border border-[#E8DFC9] text-xs focus:outline-none focus:border-[#2A7C13]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {isSubmitted && (
                    <button
                      type="button"
                      onClick={() => setShowReopenModal(true)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[#FFF8CF] hover:bg-[#FDE68A] text-[#7A4A00] border border-[#FBE6C2] font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Send Back to Teacher for Revision</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve and Lock Marks</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Persistent Floating Action Island (Scroll-Aware for 60-120 students) ── */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ease-out ${
          showFloatingDock && !isInputFocused
            ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
            : "translate-y-8 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#142010]/95 backdrop-blur-md text-white border border-[#2A7C13]/40 shadow-2xl max-w-[calc(100vw-2rem)]">
          {/* Progress & Sync Status Indicator */}
          <div className="flex items-center gap-2 pr-2.5 border-r border-white/20 text-xs shrink-0">
            {!isOnline ? (
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]" title="Working offline • Saved on device">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </span>
            ) : syncState === "syncing_cloud" || isSyncingManual ? (
              <span className="flex items-center gap-1.5 text-blue-300 font-semibold text-[11px]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing</span>
              </span>
            ) : isDirty || pendingCount > 0 ? (
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]" title="Saved on device">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Device saved</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#76C457] font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            )}
            <span className="text-white/30">•</span>
            <span className="font-mono text-white/90 text-[11px]">
              <strong>{recordedStudentsCount}</strong>/{totalStudentsCount}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {canEdit ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSaveDraft(false)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  title="Save marks draft (Ctrl+S / Cmd+S)"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isPending ? "Saving..." : canApprove ? "Save Changes" : "Save Draft"}</span>
                  <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 rounded text-[9px] font-mono bg-black/40 text-white/80">
                    Ctrl+S
                  </kbd>
                </button>

                {!canApprove && (currentStatus === "draft" || currentStatus === "rejected") && (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer border border-white/20"
                    title={hasActiveHod ? "Submit mark sheet to Head of Department" : "Submit mark sheet to School Administration"}
                  >
                    <Send className="w-3.5 h-3.5 text-[#76C457]" />
                    <span>{hasActiveHod ? "Submit" : "Submit to Admin"}</span>
                  </button>
                )}
              </>
            ) : isSubmitted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>{hasActiveHod ? "Submitted to HOD" : "Submitted to Admin"}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Locked</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Teacher Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[8px] bg-white p-6 shadow-xl space-y-4 border border-[#E8DFC9]">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-[#EAF7E4] text-[#2A7C13] shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#142010]">
                  {hasActiveHod ? "Submit Marks to Head of Department?" : "Submit Marks to School Administration?"}
                </h4>
                <p className="mt-1 text-xs text-[#555555] leading-relaxed">
                  You are submitting marks for <strong className="text-[#142010]">{subjectName}</strong> ({streamName}, {sequenceName}).
                </p>
                <div className="mt-2 text-[11px] text-[#777777] bg-[#FFFDF5] p-2.5 rounded-[5px] border border-[#E8DFC9] space-y-1">
                  <p>• Your marks will be saved and forwarded to {hasActiveHod ? "your Head of Department" : "School Administration"}.</p>
                  <p>• Once submitted, editing is locked for teachers to protect mark integrity.</p>
                  <p>• If a student grade contestation arises, {hasActiveHod ? "your HOD or School Administrator" : "the School Administrator"} can re-enable the sheet with verified justification.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DFC9]">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-[5px] border border-[#D5CBB2] text-[#444444] hover:bg-[#F7F3E8] transition-colors cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmitToHod}
                disabled={isPending}
                className="px-4 py-1.5 text-xs font-semibold rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white transition-colors shadow-xs cursor-pointer"
              >
                {isPending ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen / Student Contestation Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[8px] bg-white p-6 shadow-xl space-y-4 border border-[#E8DFC9]">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-[#FFF8CF] text-[#B45309] shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div className="w-full">
                <h4 className="text-sm font-bold text-[#142010]">
                  Reopen Mark Sheet for Teacher Revision
                </h4>
                <p className="mt-1 text-xs text-[#555555] leading-relaxed">
                  As {isHodUser ? "Head of Department" : "School Administrator / Principal"}, enter the audit reason or proof of verified student grade contestation to unlock the mark sheet for the teacher.
                </p>
                <div className="mt-3">
                  <label className="block text-[11px] font-bold text-[#444444] mb-1">
                    Justification / Verified Proof *
                  </label>
                  <textarea
                    rows={3}
                    value={reopenJustification}
                    onChange={(e) => setReopenJustification(e.target.value)}
                    placeholder="e.g. Student John Doe exam paper verified with Q3 score addition error: re-evaluated from 11/20 to 14/20."
                    className="w-full p-2.5 rounded-[5px] border border-[#D5CBB2] text-xs focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DFC9]">
              <button
                type="button"
                onClick={() => {
                  setShowReopenModal(false);
                  setReopenJustification("");
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-[5px] border border-[#D5CBB2] text-[#444444] hover:bg-[#F7F3E8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReopen}
                disabled={isPending || !reopenJustification.trim()}
                className="px-4 py-1.5 text-xs font-semibold rounded-[5px] bg-[#B45309] hover:bg-[#92400E] text-white transition-colors shadow-xs disabled:opacity-50"
              >
                {isPending ? "Reopening..." : "Reopen Mark Sheet"}
              </button>
            </div>
          </div>
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

      {/* School Hub LAN Direct Transfer & Settings Modal */}
      {showHubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[12px] border border-[#E8DFC9] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#FAF8F5] border-b border-[#E8DFC9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#142010]">School Hub Direct Wi-Fi Sync</h3>
                  <p className="text-[11px] text-[#525E4B]">Peer-to-LAN transfer (zero internet required)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHubModal(false)}
                className="p-1 rounded-full text-[#788470] hover:text-[#142010] hover:bg-[#E8DFC9]/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs text-[#142010]">
              {/* LAN Connection Status */}
              <div className="flex items-center justify-between p-3 rounded-[8px] bg-[#FAF8F5] border border-[#E8DFC9]">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-[#525E4B]">School Hub Status:</span>
                  <div className="font-bold flex items-center gap-1.5">
                    {isHubReachable ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-700 font-semibold">{hubName} (Connected)</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-amber-700 font-semibold">Not Detected on Current Wi-Fi</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={checkHubReachability}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-[4px] border border-[#E8DFC9] bg-white hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Scan Wi-Fi
                </button>
              </div>

              {/* Information Callout */}
              <div className="p-3 rounded-[8px] bg-sky-50/70 border border-sky-200 text-sky-900 space-y-1">
                <p className="font-semibold flex items-center gap-1 text-[11px]">
                  <Radio className="w-3.5 h-3.5 text-sky-700" />
                  How does peer-to-LAN transfer work?
                </p>
                <p className="text-[11px] text-sky-800 leading-relaxed">
                  When you enter marks online at home, they are automatically cached on this device. When you arrive at school, connect your phone to the school Wi-Fi router. Marks transfer directly into the school server PC without using internet or mobile data!
                </p>
              </div>

              {/* Hub Host / IP Configuration */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#525E4B] uppercase tracking-wider">
                  School Hub IP / Hostname:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customHubHost}
                    onChange={(e) => setCustomHubHost(e.target.value)}
                    placeholder="e.g. 192.168.1.100:3000 or school.local:3000"
                    className="flex-1 px-3 py-1.5 rounded-[6px] border border-[#E8DFC9] bg-white text-xs focus:outline-none focus:border-[#2A7C13]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      saveStoredHubHost(customHubHost);
                      checkHubReachability();
                    }}
                    className="px-3 py-1.5 rounded-[6px] bg-[#142010] hover:bg-[#23351C] text-white text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Save & Test
                  </button>
                </div>
                <p className="text-[10px] text-[#788470]">
                  Leave blank to auto-scan standard subnet gateways (192.168.1.100, school.local).
                </p>
              </div>

              {/* Status Alert if any */}
              {bulkTransferStatus && (
                <div
                  className={`p-2.5 rounded-[6px] text-[11px] font-medium border ${
                    bulkTransferStatus.success
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {bulkTransferStatus.message}
                </div>
              )}

              {/* Transfer Action Buttons */}
              <div className="pt-2 border-t border-[#E8DFC9] space-y-2">
                <button
                  type="button"
                  onClick={handleTransferToHub}
                  disabled={isTransferringHub}
                  className="w-full py-2 px-3 rounded-[6px] font-bold text-xs bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Server className={`w-4 h-4 ${isTransferringHub ? "animate-pulse" : ""}`} />
                  <span>{isTransferringHub ? "Transferring Current Sheet..." : "Transfer Current Subject Marks to Hub"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBulkTransferToHub}
                  disabled={isTransferringHub}
                  className="w-full py-2 px-3 rounded-[6px] font-bold text-xs bg-[#FAF8F5] hover:bg-[#F2ECE1] disabled:opacity-50 text-[#142010] border border-[#E8DFC9] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <HardDrive className="w-4 h-4 text-[#525E4B]" />
                  <span>Transfer ALL Marksheets Cached on Device</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 bg-[#FAF8F5] border-t border-[#E8DFC9] flex justify-end">
              <button
                type="button"
                onClick={() => setShowHubModal(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-[5px] border border-[#E8DFC9] bg-white hover:bg-stone-50 text-[#525E4B] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StudentMarkRowProps {
  student: StudentRow;
  idx: number;
  maxMarks: number;
  canEdit: boolean;
  isSelected: boolean;
  onToggleSelectRow: (studentId: string) => void;
  onScoreChange: (index: number, val: string) => void;
  onScoreKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onStatusChange: (index: number, newStatus: "present" | "absent" | "exempt") => void;
  onRemarksChange: (index: number, rem: string) => void;
  onFocusInput?: () => void;
  onBlurInput?: () => void;
}

const StudentMarkRow = memo(function StudentMarkRow({
  student,
  idx,
  maxMarks,
  canEdit,
  isSelected,
  onToggleSelectRow,
  onScoreChange,
  onScoreKeyDown,
  onStatusChange,
  onRemarksChange,
  onFocusInput,
  onBlurInput,
}: StudentMarkRowProps) {
  const normalized20 =
    student.score !== null && maxMarks > 0
      ? parseFloat(((student.score / maxMarks) * 20).toFixed(2))
      : null;
  const gradeInfo = getGradeAppreciation(normalized20);

  return (
    <tr
      className={`hover:bg-[#FFFDF5] transition-colors ${
        isSelected ? "bg-[#F0FDF4]/70" : ""
      }`}
    >
      <td className="py-2 px-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <input
            type="checkbox"
            disabled={!canEdit}
            aria-label={`Select ${student.fullName}`}
            checked={isSelected}
            onChange={() => onToggleSelectRow(student.studentId)}
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
          disabled={!canEdit}
          value={student.status}
          aria-label={`Attendance status for ${student.fullName}`}
          onChange={(e) =>
            onStatusChange(
              idx,
              e.target.value as "present" | "absent" | "exempt"
            )
          }
          className="w-full px-2 py-1 rounded-[4px] border border-[#E8DFC9] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13] disabled:opacity-60"
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
          inputMode="decimal"
          data-score-idx={idx}
          onKeyDown={(e) => onScoreKeyDown(idx, e)}
          onFocus={onFocusInput}
          onBlur={onBlurInput}
          aria-label={`Score out of ${maxMarks} for ${student.fullName}`}
          disabled={!canEdit || student.status !== "present"}
          placeholder={student.status === "present" ? "0.00" : "-"}
          value={student.score ?? ""}
          onChange={(e) => onScoreChange(idx, e.target.value)}
          className="w-20 px-2 py-1 text-center font-mono font-bold rounded-[4px] border border-[#E8DFC9] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13] disabled:bg-[#F5EFE0] disabled:text-[#788470]"
          style={{ fontSize: "16px" }}
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
          disabled={!canEdit}
          onFocus={onFocusInput}
          onBlur={onBlurInput}
          aria-label={`Teacher remark for ${student.fullName}`}
          placeholder="Remark (optional)..."
          value={student.remarks}
          onChange={(e) => onRemarksChange(idx, e.target.value)}
          className="w-full px-2 py-1 rounded-[4px] border border-[#E8DFC9] bg-white text-xs text-[#142010] focus:outline-none focus:border-[#2A7C13] disabled:opacity-60"
          style={{ fontSize: "16px" }}
        />
      </td>
    </tr>
  );
});

const StudentMarkCard = memo(function StudentMarkCard({
  student,
  idx,
  maxMarks,
  canEdit,
  isSelected,
  onToggleSelectRow,
  onScoreChange,
  onScoreKeyDown,
  onStatusChange,
  onRemarksChange,
  onFocusInput,
  onBlurInput,
}: StudentMarkRowProps) {
  const [showRemarks, setShowRemarks] = useState(Boolean(student.remarks));
  const normalized20 =
    student.score !== null && maxMarks > 0
      ? parseFloat(((student.score / maxMarks) * 20).toFixed(2))
      : null;
  const gradeInfo = getGradeAppreciation(normalized20);

  return (
    <div
      className={`p-3.5 rounded-[8px] bg-white border transition-colors space-y-3 ${
        isSelected
          ? "border-[#2A7C13] bg-[#F0FDF4]/30"
          : student.score !== null || student.status !== "present"
          ? "border-[#E8DFC9] shadow-2xs"
          : "border-[#E8DFC9]/80 bg-[#FFFDF5]/40"
      }`}
    >
      {/* Student Identification Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#142010] text-white flex items-center justify-center font-bold font-mono text-xs shrink-0 mt-0.5">
            {idx + 1}
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#142010] leading-tight">
              {student.fullName}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-[#788470] mt-0.5 font-mono">
              <span className="font-semibold text-[#142010]">{student.matricule}</span>
              <span>•</span>
              <span>{student.gender === "M" ? "Male" : "Female"}</span>
            </div>
          </div>
        </div>

        {canEdit && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelectRow(student.studentId)}
            className="w-4 h-4 rounded border-[#D5D5CF] text-[#2A7C13] focus:ring-[#2A7C13] accent-[#2A7C13] cursor-pointer mt-1"
          />
        )}
      </div>

      {/* Attendance Status Touch Segmented Buttons (1-Tap on Phone) */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-[6px] bg-[#F7F4EA] border border-[#E8DFC9]">
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => onStatusChange(idx, "present")}
          className={`py-1.5 px-1 rounded-[4px] text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
            student.status === "present"
              ? "bg-[#2A7C13] text-white shadow-xs"
              : "text-[#555555] hover:bg-white/60"
          }`}
        >
          <span>Present</span>
        </button>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => onStatusChange(idx, "absent")}
          className={`py-1.5 px-1 rounded-[4px] text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
            student.status === "absent"
              ? "bg-[#DC2626] text-white shadow-xs"
              : "text-[#555555] hover:bg-white/60"
          }`}
        >
          <span>Absent</span>
        </button>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => onStatusChange(idx, "exempt")}
          className={`py-1.5 px-1 rounded-[4px] text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
            student.status === "exempt"
              ? "bg-[#D97706] text-white shadow-xs"
              : "text-[#555555] hover:bg-white/60"
          }`}
        >
          <span>Exempt</span>
        </button>
      </div>

      {/* Score Entry & Live Calculation */}
      {student.status === "present" ? (
        <div className="grid grid-cols-2 gap-2.5 pt-1 items-end">
          {/* Touch Score Input */}
          <div>
            <label className="block text-[10px] font-bold text-[#525E4B] uppercase mb-1">
              Mark (/{maxMarks})
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.25"
                min="0"
                max={maxMarks}
                inputMode="decimal"
                data-score-idx={idx}
                onKeyDown={(e) => onScoreKeyDown(idx, e)}
                onFocus={onFocusInput}
                onBlur={onBlurInput}
                disabled={!canEdit}
                placeholder="0.00"
                value={student.score ?? ""}
                onChange={(e) => onScoreChange(idx, e.target.value)}
                className="w-full h-11 px-3 text-center font-mono font-black rounded-[6px] border border-[#D5D5CF] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/20 shadow-xs"
                style={{ fontSize: "18px" }}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#888888]">
                /{maxMarks}
              </span>
            </div>
          </div>

          {/* Real-Time Scaled Score & Grade */}
          <div>
            <span className="block text-[10px] font-bold text-[#525E4B] uppercase mb-1">
              Scaled /20 &amp; Grade
            </span>
            <div className="h-11 px-2.5 rounded-[6px] bg-[#FAFAF8] border border-[#E8DFC9] flex items-center justify-between">
              <span className="font-mono font-black text-sm text-[#142010]">
                {normalized20 !== null ? `${normalized20.toFixed(2)}` : "//"}
              </span>
              {normalized20 !== null ? (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    gradeInfo.cba === "EXP"
                      ? "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40"
                      : gradeInfo.cba === "SA"
                      ? "bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]"
                      : gradeInfo.cba === "SPA"
                      ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {gradeInfo.letter} · {gradeInfo.cba}
                </span>
              ) : (
                <span className="text-[10px] text-[#888888] font-mono">—</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-[6px] bg-[#F9F9F7] border border-[#E8DFC9] text-xs font-semibold text-center text-[#788470]">
          {student.status === "absent" ? "Marked as ABSENT (0 score)" : "Marked as EXEMPTED (no score penalty)"}
        </div>
      )}

      {/* Teacher Note Field */}
      <div>
        {!showRemarks && !student.remarks ? (
          <button
            type="button"
            onClick={() => setShowRemarks(true)}
            className="text-[11px] text-[#2A7C13] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <MessageSquare className="w-3 h-3" />
            <span>+ Add report card note</span>
          </button>
        ) : (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <label className="text-[#525E4B] font-medium flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-[#2A7C13]" />
                <span>Teacher&apos;s Note (Report Card)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowRemarks(false);
                  if (!student.remarks) onRemarksChange(idx, "");
                }}
                className="text-[#888888] hover:text-[#555555] text-[10px] underline cursor-pointer"
              >
                Hide
              </button>
            </div>
            <input
              type="text"
              disabled={!canEdit}
              value={student.remarks}
              onFocus={onFocusInput}
              onBlur={onBlurInput}
              onChange={(e) => onRemarksChange(idx, e.target.value)}
              placeholder="e.g. Good mastery, continue practicing..."
              className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] text-xs text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
              style={{ fontSize: "16px" }}
            />
          </div>
        )}
      </div>
    </div>
  );
});
