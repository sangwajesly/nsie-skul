/**
 * Sukul Hub Automatic LAN Sync Engine
 * 
 * Auto-detects the on-premise Sukul Hub computer as soon as a teacher's phone
 * or laptop connects to the school Wi-Fi router (even with ZERO active internet).
 * Automatically drains pending marks from IndexedDB outbox directly to the Hub over LAN!
 */

import {
  getPendingSyncCount,
  detectLocalHub,
  syncAllDraftsToLocalHub,
  getAllPendingSyncItems,
  removeSyncItem,
  syncDirectToLocalHub,
} from "./offline-marks-db";

let isAutoSyncing = false;
let syncIntervalId: NodeJS.Timeout | null = null;

export interface AutoSyncResult {
  attempted: boolean;
  channel?: "hub_lan" | "cloud_internet";
  transferredCount?: number;
  message?: string;
  error?: string;
}

/**
 * Triggers a dual-channel sync attempt:
 * 1. Priority 1: Sukul Hub on Local School Wi-Fi (Works without internet!)
 * 2. Priority 2: Central Cloud Server (When connected to mobile data or home Wi-Fi)
 */
export async function triggerDualChannelAutoSync(): Promise<AutoSyncResult> {
  if (isAutoSyncing || typeof window === "undefined") {
    return { attempted: false, message: "Sync already in progress" };
  }

  try {
    const pendingCount = await getPendingSyncCount();
    if (pendingCount === 0) {
      return { attempted: true, transferredCount: 0, message: "No marks waiting to sync." };
    }

    isAutoSyncing = true;

    // ── CHANNEL 1: Check for Sukul Hub on Local School Wi-Fi ─────────────────
    // Fast concurrent probe to detect if the school computer is reachable on LAN
    try {
      const hub = await detectLocalHub();
      if (hub.reachable && hub.host) {
        console.log(`[AutoSync] Sukul Hub detected on local Wi-Fi at ${hub.host}. Initiating LAN sync...`);

        const res = await syncAllDraftsToLocalHub(hub.host);
        if (res.success && res.transferredCount > 0) {
          // Notify the UI that marks synced over School Wi-Fi
          window.dispatchEvent(
            new CustomEvent("nsei:hub-sync-success", {
              detail: {
                transferredCount: res.transferredCount,
                hubName: hub.hubName || "School Sukul Hub",
                host: hub.host,
                channel: "hub_lan",
              },
            })
          );
          return {
            attempted: true,
            channel: "hub_lan",
            transferredCount: res.transferredCount,
            message: res.message,
          };
        }
      }
    } catch (hubErr) {
      console.warn("[AutoSync] Local Hub probe notice:", hubErr);
    }

    // ── CHANNEL 2: Cloud Internet Sync (If Internet is Available) ────────────
    if (navigator.onLine) {
      try {
        const pendingItems = await getAllPendingSyncItems();
        let cloudSyncedCount = 0;

        for (const item of pendingItems) {
          // Attempt push to server sync endpoint
          const res = await fetch("/api/v1/hub/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              academicYearId: item.academicYearId,
              termId: item.termId,
              sequenceId: item.sequenceId,
              classStreamId: item.classStreamId,
              subjectId: item.subjectId,
              maxMarks: item.maxMarks,
              competencyDescription: item.competencyDescription,
              marks: item.marks,
            }),
            signal: AbortSignal.timeout(10000),
          });

          if (res.ok) {
            await removeSyncItem(item.sheetKey);
            cloudSyncedCount += item.marks.length;
          }
        }

        if (cloudSyncedCount > 0) {
          window.dispatchEvent(
            new CustomEvent("nsei:cloud-sync-success", {
              detail: {
                transferredCount: cloudSyncedCount,
                channel: "cloud_internet",
              },
            })
          );
          return {
            attempted: true,
            channel: "cloud_internet",
            transferredCount: cloudSyncedCount,
            message: `Synced ${cloudSyncedCount} marks with school cloud.`,
          };
        }
      } catch (cloudErr) {
        console.warn("[AutoSync] Cloud sync notice:", cloudErr);
      }
    }

    return {
      attempted: true,
      transferredCount: 0,
      message: "Device is offline. Changes remain saved safely on device.",
    };
  } finally {
    isAutoSyncing = false;
  }
}

/**
 * Initializes continuous background LAN discovery & sync listeners
 */
export function initHubAutoSyncListener(): () => void {
  if (typeof window === "undefined") return () => {};

  // 1. Trigger whenever device reconnects or changes networks
  const handleNetworkChange = () => {
    // Wait 1.5s for Wi-Fi IP negotiation
    setTimeout(() => {
      triggerDualChannelAutoSync();
    }, 1500);
  };

  // 2. Trigger when teacher switches back to the app tab (e.g. walked into campus and unlocked phone)
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      triggerDualChannelAutoSync();
    }
  };

  window.addEventListener("online", handleNetworkChange);
  window.addEventListener("focus", handleNetworkChange);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // 3. Periodic LAN check every 25 seconds if outbox has pending items
  syncIntervalId = setInterval(async () => {
    const count = await getPendingSyncCount();
    if (count > 0 && !isAutoSyncing) {
      triggerDualChannelAutoSync();
    }
  }, 25000);

  // Initial check on load
  setTimeout(() => triggerDualChannelAutoSync(), 3000);

  return () => {
    window.removeEventListener("online", handleNetworkChange);
    window.removeEventListener("focus", handleNetworkChange);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    if (syncIntervalId) clearInterval(syncIntervalId);
  };
}
