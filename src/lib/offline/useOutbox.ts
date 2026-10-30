"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listOutbox, processOutbox, OUTBOX_CHANGED_EVENT, type OutboxMutation, type SyncResult } from "./outbox";

const AUTO_SYNC_INTERVAL_MS = 30_000;

/**
 * Live view of this device's offline outbox for a school, with automatic
 * background sync when the network comes back and every 30 seconds.
 */
export function useOutbox(schoolId: string) {
  const [items, setItems] = useState<OutboxMutation[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const list = await listOutbox(schoolId);
    if (mounted.current) setItems(list);
  }, [schoolId]);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await processOutbox(schoolId);
      if (!mounted.current) return result;
      setLastResult(result);
      if (result.synced > 0 || (!result.offline && result.remaining === 0)) setLastSyncedAt(new Date());
      return result;
    } finally {
      if (mounted.current) setIsSyncing(false);
      refresh();
    }
  }, [schoolId, refresh]);

  useEffect(() => {
    mounted.current = true;
    setIsOnline(navigator.onLine);
    refresh().then(() => {
      if (navigator.onLine) syncNow();
    });

    const onChanged = () => refresh();
    const onOnline = () => {
      setIsOnline(true);
      syncNow();
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener(OUTBOX_CHANGED_EVENT, onChanged);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const interval = setInterval(() => {
      if (navigator.onLine) syncNow();
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      mounted.current = false;
      window.removeEventListener(OUTBOX_CHANGED_EVENT, onChanged);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(interval);
    };
  }, [refresh, syncNow]);

  const pending = items.filter((m) => m.status === "pending");
  const failed = items.filter((m) => m.status === "failed");

  return {
    items,
    pending,
    failed,
    pendingCount: pending.length,
    failedCount: failed.length,
    isOnline,
    isSyncing,
    lastResult,
    lastSyncedAt,
    syncNow,
    refresh,
  };
}
