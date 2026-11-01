/**
 * Local-First IndexedDB Storage and Sync Engine for Attendance (Roll Call).
 * 
 * Enables teachers to take daily roll calls offline with zero data or school Wi-Fi.
 * 1. Immediate local persistence: Attendance records are written to device IndexedDB.
 * 2. Background Sync Outbox: Queues roll calls and flushes when internet is available.
 * 3. Works alongside Sukul Hub LAN auto-sync when in proximity to school network.
 */

export interface LocalAttendanceRecordItem {
  studentId: string;
  matricule?: string;
  fullName?: string;
  gender?: string;
  status: "present" | "unjustified_absent" | "justified_absent" | "late" | "excused";
  hoursMissed: number;
  justificationNote?: string;
}

export interface LocalAttendanceDraft {
  sessionKey: string;
  academicYearId: string;
  termId: string;
  classStreamId: string;
  sessionDate: string;
  records: LocalAttendanceRecordItem[];
  updatedAt: number;
  isSynced: boolean;
}

export interface AttendanceOutboxItem {
  sessionKey: string;
  academicYearId: string;
  termId: string;
  classStreamId: string;
  sessionDate: string;
  records: LocalAttendanceRecordItem[];
  enqueuedAt: number;
  retryCount: number;
  lastError?: string;
}

const DB_NAME = "nsei_attendance_offline_db";
const DB_VERSION = 1;
const STORE_DRAFTS = "attendance_drafts";
const STORE_OUTBOX = "attendance_outbox";

function openAttendanceDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: "sessionKey" });
      }

      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        db.createObjectStore(STORE_OUTBOX, { keyPath: "sessionKey" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function buildAttendanceSessionKey(
  academicYearId: string,
  classStreamId: string,
  sessionDate: string
): string {
  return `${academicYearId}::${classStreamId}::${sessionDate}`;
}

export async function saveAttendanceDraftLocally(draft: LocalAttendanceDraft): Promise<void> {
  try {
    const db = await openAttendanceDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_DRAFTS], "readwrite");
      const store = tx.objectStore(STORE_DRAFTS);
      store.put(draft);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[OfflineAttendance] Failed to cache draft in IndexedDB:", err);
  }
}

export async function getAttendanceDraftLocally(
  academicYearId: string,
  classStreamId: string,
  sessionDate: string
): Promise<LocalAttendanceDraft | null> {
  try {
    const db = await openAttendanceDB();
    const key = buildAttendanceSessionKey(academicYearId, classStreamId, sessionDate);

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_DRAFTS], "readonly");
      const store = tx.objectStore(STORE_DRAFTS);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("[OfflineAttendance] Failed to retrieve draft:", err);
    return null;
  }
}

export async function enqueueAttendanceOutbox(draft: LocalAttendanceDraft): Promise<void> {
  try {
    const db = await openAttendanceDB();
    const outboxItem: AttendanceOutboxItem = {
      sessionKey: draft.sessionKey,
      academicYearId: draft.academicYearId,
      termId: draft.termId,
      classStreamId: draft.classStreamId,
      sessionDate: draft.sessionDate,
      records: draft.records,
      enqueuedAt: Date.now(),
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OUTBOX], "readwrite");
      const store = tx.objectStore(STORE_OUTBOX);
      store.put(outboxItem);

      tx.oncomplete = () => {
        window.dispatchEvent(new CustomEvent("nsei:attendance-outbox-changed"));
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[OfflineAttendance] Failed to enqueue outbox item:", err);
  }
}

export async function getAttendanceOutboxCount(): Promise<number> {
  try {
    const db = await openAttendanceDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OUTBOX], "readonly");
      const store = tx.objectStore(STORE_OUTBOX);
      const countRequest = store.count();

      countRequest.onsuccess = () => resolve(countRequest.result || 0);
      countRequest.onerror = () => reject(countRequest.error);
    });
  } catch {
    return 0;
  }
}

export async function getAllAttendanceOutboxItems(): Promise<AttendanceOutboxItem[]> {
  try {
    const db = await openAttendanceDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OUTBOX], "readonly");
      const store = tx.objectStore(STORE_OUTBOX);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function removeAttendanceFromOutbox(sessionKey: string): Promise<void> {
  try {
    const db = await openAttendanceDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OUTBOX], "readwrite");
      const store = tx.objectStore(STORE_OUTBOX);
      store.delete(sessionKey);

      tx.oncomplete = () => {
        window.dispatchEvent(new CustomEvent("nsei:attendance-outbox-changed"));
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[OfflineAttendance] Failed to remove outbox item:", err);
  }
}

export async function flushAttendanceOutbox(
  saveAction: (payload: {
    academicYearId: string;
    termId: string;
    classStreamId: string;
    sessionDate: string;
    records: Array<{
      studentId: string;
      status: "present" | "unjustified_absent" | "justified_absent" | "late" | "excused";
      hoursMissed: number;
      justificationNote?: string;
    }>;
  }) => Promise<{ error?: string; success?: boolean }>
): Promise<{ successCount: number; failureCount: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { successCount: 0, failureCount: 0 };
  }

  const items = await getAllAttendanceOutboxItems();
  if (items.length === 0) return { successCount: 0, failureCount: 0 };

  let successCount = 0;
  let failureCount = 0;

  for (const item of items) {
    try {
      const res = await saveAction({
        academicYearId: item.academicYearId,
        termId: item.termId,
        classStreamId: item.classStreamId,
        sessionDate: item.sessionDate,
        records: item.records.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          hoursMissed: r.hoursMissed,
          justificationNote: r.justificationNote,
        })),
      });

      if (res?.success) {
        await removeAttendanceFromOutbox(item.sessionKey);
        // Mark draft as synced
        const draft = await getAttendanceDraftLocally(
          item.academicYearId,
          item.classStreamId,
          item.sessionDate
        );
        if (draft) {
          draft.isSynced = true;
          await saveAttendanceDraftLocally(draft);
        }
        successCount++;
      } else {
        failureCount++;
      }
    } catch {
      failureCount++;
    }
  }

  if (successCount > 0) {
    window.dispatchEvent(
      new CustomEvent("nsei:cloud-sync-success", {
        detail: { transferredCount: successCount, type: "attendance" },
      })
    );
  }

  return { successCount, failureCount };
}

export function initAttendanceAutoSync(
  saveAction: (payload: any) => Promise<any>
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    flushAttendanceOutbox(saveAction);
  };

  window.addEventListener("online", handleOnline);
  const intervalId = window.setInterval(() => {
    if (navigator.onLine) {
      flushAttendanceOutbox(saveAction);
    }
  }, 30000);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.clearInterval(intervalId);
  };
}
