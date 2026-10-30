/**
 * Local-First IndexedDB Storage and Sync Engine for Marks Entry.
 * 
 * Guarantees zero-latency typing for teachers on slow, flaky (2G/3G), or intermittent connections.
 * 1. Immediate local persistence: Marks are written to device IndexedDB in <2ms.
 * 2. Background Sync Outbox: Queues changes and flushes to Supabase when network bandwidth allows.
 * 3. Crash & Reload Protection: Unsynced local marks persist across tab closes and device reboots.
 */

export interface LocalMarkItem {
  studentId: string;
  score: number | null;
  status: "present" | "absent" | "exempt";
  remarks: string;
}

export interface LocalMarkSheetDraft {
  sheetKey: string;
  academicYearId: string;
  termId: string;
  sequenceId: string;
  classStreamId: string;
  subjectId: string;
  maxMarks: number;
  competencyDescription: string;
  marks: LocalMarkItem[];
  updatedAt: number; // Date.now() timestamp
  isSynced: boolean;
}

export interface SyncOutboxItem {
  sheetKey: string;
  academicYearId: string;
  termId: string;
  sequenceId: string;
  classStreamId: string;
  subjectId: string;
  maxMarks: number;
  competencyDescription: string;
  marks: LocalMarkItem[];
  enqueuedAt: number;
  retryCount: number;
  lastError?: string;
}

const DB_NAME = "nsei_marks_offline_db";
const DB_VERSION = 1;
const STORE_DRAFTS = "marks_drafts";
const STORE_OUTBOX = "marks_outbox";

/**
 * Open (or initialize) the IndexedDB database instance.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: "sheetKey" });
      }

      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        db.createObjectStore(STORE_OUTBOX, { keyPath: "sheetKey" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Builds a deterministic sheet key for identifying a specific sequence/class/subject marksheet.
 */
export function buildSheetKey(
  academicYearId: string,
  sequenceId: string,
  classStreamId: string,
  subjectId: string
): string {
  return `${academicYearId}::${sequenceId}::${classStreamId}::${subjectId}`;
}

/**
 * Save draft marks immediately to local IndexedDB.
 */
export async function saveLocalDraft(draft: LocalMarkSheetDraft): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_DRAFTS], "readwrite");
      const store = tx.objectStore(STORE_DRAFTS);
      const req = store.put(draft);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[OfflineDB] Failed to save local draft to IndexedDB:", err);
  }
}

/**
 * Retrieve cached local draft from IndexedDB.
 */
export async function getLocalDraft(sheetKey: string): Promise<LocalMarkSheetDraft | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_DRAFTS], "readonly");
      const store = tx.objectStore(STORE_DRAFTS);
      const req = store.get(sheetKey);
      req.onsuccess = () => resolve((req.result as LocalMarkSheetDraft) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[OfflineDB] Failed to read local draft:", err);
    return null;
  }
}

/**
 * Enqueue a mark sheet save request into the background sync outbox.
 */
export async function enqueueSyncItem(item: SyncOutboxItem): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OUTBOX], "readwrite");
      const store = tx.objectStore(STORE_OUTBOX);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[OfflineDB] Failed to enqueue sync item:", err);
  }
}

/**
 * Retrieve an outbox item by sheetKey.
 */
export async function getSyncItem(sheetKey: string): Promise<SyncOutboxItem | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OUTBOX], "readonly");
      const store = tx.objectStore(STORE_OUTBOX);
      const req = store.get(sheetKey);
      req.onsuccess = () => resolve((req.result as SyncOutboxItem) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[OfflineDB] Failed to retrieve sync item:", err);
    return null;
  }
}

/**
 * Remove an item from the sync outbox once successfully saved to the server.
 */
export async function removeSyncItem(sheetKey: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OUTBOX, STORE_DRAFTS], "readwrite");
      tx.objectStore(STORE_OUTBOX).delete(sheetKey);

      // Also mark the local draft as isSynced = true
      const draftStore = tx.objectStore(STORE_DRAFTS);
      const getReq = draftStore.get(sheetKey);
      getReq.onsuccess = () => {
        if (getReq.result) {
          draftStore.put({ ...getReq.result, isSynced: true });
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[OfflineDB] Failed to remove sync item:", err);
  }
}

/**
 * Get count of items waiting in the background sync outbox.
 */
export async function getPendingSyncCount(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OUTBOX], "readonly");
      const store = tx.objectStore(STORE_OUTBOX);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[OfflineDB] Failed to get outbox count:", err);
    return 0;
  }
}

/**
 * Retrieve all pending sync items across all classes and subjects.
 */
export async function getAllPendingSyncItems(): Promise<SyncOutboxItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_OUTBOX], "readonly");
      const store = tx.objectStore(STORE_OUTBOX);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as SyncOutboxItem[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[OfflineDB] Failed to get all pending items:", err);
    return [];
  }
}

/**
 * Retrieve all local drafts stored in IndexedDB.
 */
export async function getAllLocalDrafts(): Promise<LocalMarkSheetDraft[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_DRAFTS], "readonly");
      const store = tx.objectStore(STORE_DRAFTS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as LocalMarkSheetDraft[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[OfflineDB] Failed to get all drafts:", err);
    return [];
  }
}

/**
 * Hub Host configuration helpers.
 */
export function getStoredHubHost(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nsei_school_hub_host") || localStorage.getItem("nsei_school_hub_ip") || null;
}

export function saveStoredHubHost(host: string): void {
  if (typeof window === "undefined") return;
  const cleaned = host.replace(/^https?:\/\//i, "").replace(/\/+$/, "").trim();
  localStorage.setItem("nsei_school_hub_host", cleaned);
}

/**
 * Fast concurrent detection of the on-premise School Hub server on local Wi-Fi.
 * Pings candidate local network IPs simultaneously using Promise.any for sub-second response.
 */
export async function detectLocalHub(
  preferredHost?: string
): Promise<{ reachable: boolean; host?: string; hubName?: string }> {
  if (typeof window === "undefined") return { reachable: false };

  const stored = getStoredHubHost();
  const candidates: string[] = [];
  if (stored) candidates.push(stored);
  if (preferredHost) candidates.push(preferredHost);
  if (window.location && window.location.hostname && !window.location.hostname.includes("klarifypath")) {
    candidates.push(window.location.host);
  }
  candidates.push(
    "school.local:3000",
    "192.168.1.100:3000",
    "192.168.1.50:3000",
    "192.168.1.2:3000",
    "192.168.0.100:3000",
    "192.168.8.100:3000",
    "localhost:3000"
  );

  const uniqueHosts = Array.from(new Set(candidates.filter(Boolean)));

  const pingPromises = uniqueHosts.map(async (host) => {
    const cleanHost = host.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    try {
      const res = await fetch(`http://${cleanHost}/api/v1/hub/lan-ping`, {
        method: "GET",
        signal: AbortSignal.timeout(1800),
      });
      if (res.ok) {
        const data = await res.json();
        return { reachable: true, host: cleanHost, hubName: data.hubName || "School LAN Hub" };
      }
    } catch {
      // not reachable
    }
    throw new Error("Unreachable");
  });

  try {
    return await Promise.any(pingPromises);
  } catch {
    return { reachable: false };
  }
}

/**
 * Direct Peer-to-LAN Sync:
 * Transfers marks directly from a teacher's phone to the School Hub computer
 * over the local school Wi-Fi without requiring any internet or mobile data.
 */
export async function syncDirectToLocalHub(
  payload: {
    academicYearId: string;
    termId: string;
    sequenceId: string;
    classStreamId: string;
    subjectId: string;
    maxMarks: number;
    competencyDescription: string;
    marks: LocalMarkItem[];
    teacherId?: string;
  },
  preferredHost?: string
): Promise<{ success: boolean; message: string; host?: string }> {
  try {
    const hub = await detectLocalHub(preferredHost);
    if (!hub.reachable || !hub.host) {
      return {
        success: false,
        message: "Could not find School Hub on local Wi-Fi. Ensure phone is connected to school router.",
      };
    }

    const res = await fetch(`http://${hub.host}/api/v1/hub/lan-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return { success: false, message: data.error || "Failed to transfer marks to Hub." };
    }

    return {
      success: true,
      host: hub.host,
      message: `Transferred ${data.marksMerged || payload.marks.length} marks directly to ${hub.hubName || "School Hub"} over school Wi-Fi!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Network error communicating with School Hub over Wi-Fi.",
    };
  }
}

/**
 * Bulk Transfer:
 * Sends ALL marksheets cached in device IndexedDB directly to the School Hub over Wi-Fi.
 */
export async function syncAllDraftsToLocalHub(
  preferredHost?: string
): Promise<{ success: boolean; transferredCount: number; message: string }> {
  try {
    const drafts = await getAllLocalDrafts();
    if (drafts.length === 0) {
      return { success: true, transferredCount: 0, message: "No stored marks found on this device." };
    }

    const hub = await detectLocalHub(preferredHost);
    if (!hub.reachable || !hub.host) {
      return {
        success: false,
        transferredCount: 0,
        message: "School Hub not detected on Wi-Fi. Ensure phone is connected to the school router.",
      };
    }

    let totalMarks = 0;
    let sheetSuccessCount = 0;

    for (const draft of drafts) {
      if (!draft.marks || draft.marks.length === 0) continue;
      const res = await syncDirectToLocalHub(
        {
          academicYearId: draft.academicYearId,
          termId: draft.termId,
          sequenceId: draft.sequenceId,
          classStreamId: draft.classStreamId,
          subjectId: draft.subjectId,
          maxMarks: draft.maxMarks,
          competencyDescription: draft.competencyDescription,
          marks: draft.marks,
        },
        hub.host
      );
      if (res.success) {
        sheetSuccessCount++;
        totalMarks += draft.marks.length;
      }
    }

    return {
      success: true,
      transferredCount: totalMarks,
      message: `Successfully transferred ${sheetSuccessCount} marksheet(s) (${totalMarks} student marks) to ${hub.hubName || "School Hub"} over school Wi-Fi!`,
    };
  } catch (err: any) {
    return {
      success: false,
      transferredCount: 0,
      message: err.message || "Bulk transfer to School Hub encountered an error.",
    };
  }
}
