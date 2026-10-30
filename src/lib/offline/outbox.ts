"use client";

import { idbDelete, idbGetAll, idbPut, STORE_OUTBOX } from "./idb";
import { syncOfflinePaymentAction, type OfflinePaymentPayload } from "@/app/finance/actions";

export type OutboxStatus = "pending" | "failed";

export interface FeePaymentReceiptSnapshot {
  schoolName: string;
  schoolCode: string | null;
  schoolAddress: string | null;
  schoolPhone: string | null;
  schoolLogoUrl: string | null;
  studentName: string;
  studentFirstName: string;
  studentLastName: string;
  matricule: string;
  residenceStatus: "day" | "boarding";
  classStreamName: string | null;
  totalBilled: number;
  paidBeforeThisPayment: number;
  balanceAsOf: string; // ISO timestamp the cached balance was loaded
  receivedByName: string | null;
}

export interface FeePaymentMutation {
  id: string; // = clientMutationId
  type: "fee_payment";
  schoolId: string;
  payload: OfflinePaymentPayload;
  receipt: FeePaymentReceiptSnapshot;
  status: OutboxStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
}

export type OutboxMutation = FeePaymentMutation;

export const OUTBOX_CHANGED_EVENT = "nsei:outbox-changed";

function emitChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OUTBOX_CHANGED_EVENT));
  }
}

export function newMutationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // RFC4122 v4 fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function enqueueMutation(mutation: OutboxMutation): Promise<void> {
  await idbPut(STORE_OUTBOX, mutation);
  emitChanged();
}

export async function listOutbox(schoolId?: string): Promise<OutboxMutation[]> {
  try {
    const all = await idbGetAll<OutboxMutation>(STORE_OUTBOX);
    return all
      .filter((m) => !schoolId || m.schoolId === schoolId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export async function discardMutation(id: string): Promise<void> {
  await idbDelete(STORE_OUTBOX, id);
  emitChanged();
}

let syncInFlight: Promise<SyncResult> | null = null;

export interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
  offline: boolean;
}

/**
 * Pushes queued mutations to the server, oldest first. Stops at the first
 * network failure (no point hammering a dead connection). Only one sync runs
 * at a time per tab.
 */
export function processOutbox(schoolId?: string): Promise<SyncResult> {
  if (syncInFlight) return syncInFlight;
  syncInFlight = runSync(schoolId).finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
}

async function runSync(schoolId?: string): Promise<SyncResult> {
  const queue = (await listOutbox(schoolId)).filter((m) => m.status === "pending");
  let synced = 0;
  let failed = 0;

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced, failed, remaining: queue.length, offline: true };
  }

  for (const mutation of queue) {
    try {
      const res = await syncOfflinePaymentAction(mutation.payload);
      if (res && "success" in res && res.success) {
        await idbDelete(STORE_OUTBOX, mutation.id);
        synced++;
      } else {
        const retryable = !!(res && "retryable" in res && res.retryable);
        const updated: OutboxMutation = {
          ...mutation,
          attempts: mutation.attempts + 1,
          lastError: (res && "error" in res && res.error) || "Unknown error",
          status: retryable && mutation.attempts < 10 ? "pending" : "failed",
        };
        await idbPut(STORE_OUTBOX, updated);
        if (updated.status === "failed") failed++;
      }
    } catch {
      // Network / server unreachable: stop and keep everything queued.
      emitChanged();
      const remaining = (await listOutbox(schoolId)).filter((m) => m.status === "pending").length;
      return { synced, failed, remaining, offline: true };
    }
  }

  emitChanged();
  const remaining = (await listOutbox(schoolId)).filter((m) => m.status === "pending").length;
  return { synced, failed, remaining, offline: false };
}

/** Puts a failed mutation back in the queue (after the user fixed the cause). */
export async function retryMutation(mutation: OutboxMutation): Promise<void> {
  await idbPut(STORE_OUTBOX, { ...mutation, status: "pending", attempts: 0, lastError: null });
  emitChanged();
}
