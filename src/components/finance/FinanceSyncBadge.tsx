"use client";

import { useState } from "react";
import { useOutbox } from "@/lib/offline/useOutbox";
import { CloudCheck, CloudOff, RefreshCw, Wifi, WifiOff, Printer, AlertCircle } from "lucide-react";
import { ProvisionalReceiptOverlay } from "./ProvisionalReceipt";
import type { FeePaymentMutation } from "@/lib/offline/outbox";
import { formatFCFA } from "@/lib/finance/receipt-utils";

interface FinanceSyncBadgeProps {
  schoolId: string;
}

export function FinanceSyncBadge({ schoolId }: FinanceSyncBadgeProps) {
  const {
    items,
    pending,
    failed,
    pendingCount,
    failedCount,
    isOnline,
    isSyncing,
    lastSyncedAt,
    syncNow,
  } = useOutbox(schoolId);

  const [activeReceipt, setActiveReceipt] = useState<FeePaymentMutation | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const totalUnsynced = pendingCount + failedCount;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Network indicator */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors ${
            isOnline
              ? "bg-[#EBF7E5] text-[#2A7C13] border-[#CCECC0]"
              : "bg-[#FFF4E5] text-[#B45309] border-[#FDE3C8]"
          }`}
          title={isOnline ? "Network connected" : "Network disconnected. Working in offline mode."}
        >
          {isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#2A7C13] animate-pulse" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-[#B45309]" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Sync status badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium transition-all ${
            isSyncing
              ? "bg-[#EBF5FB] text-[#1D4ED8] border-[#BFDBFE]"
              : totalUnsynced === 0
              ? "bg-[#EBF7E5] text-[#1B5E20] border-[#CCECC0]"
              : failedCount > 0
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-[#FFF8CF] text-[#7A4A00] border-[#FBE6C2]"
          }`}
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1D4ED8]" />
              <span>Syncing receipts with cloud...</span>
            </>
          ) : totalUnsynced === 0 ? (
            <>
              <CloudCheck className="w-3.5 h-3.5 text-[#2A7C13]" />
              <span>
                All receipts synced to cloud
                {lastSyncedAt && (
                  <span className="text-[#525E4B] font-normal ml-1 hidden sm:inline">
                    ({formatTime(lastSyncedAt)})
                  </span>
                )}
              </span>
            </>
          ) : failedCount > 0 ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              <span>
                {failedCount} sync error{failedCount > 1 ? "s" : ""} · {pendingCount} queued
              </span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5 text-[#B45309]" />
              <span>
                {pendingCount} offline receipt{pendingCount > 1 ? "s" : ""} on device
              </span>
            </>
          )}
        </div>

        {/* Action buttons */}
        {totalUnsynced > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FFFDF5] hover:bg-[#F5EFE0] text-[#142010] border border-[#E8DFC9] transition-colors cursor-pointer"
            >
              View Unsynced ({totalUnsynced})
            </button>
            <button
              type="button"
              onClick={() => syncNow()}
              disabled={!isOnline || isSyncing}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#2A7C13] hover:bg-[#20600E] disabled:opacity-50 text-white transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Unsynced receipts drawer / modal */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[10px] border border-[#E8DFC9] shadow-xl w-full max-w-lg overflow-hidden text-left space-y-4 p-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#142010]">Unsynced Receipts on This Device</h3>
                <p className="text-xs text-[#525E4B] mt-0.5">
                  Issued offline. Valid proof of payment; will sync automatically when connected.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="text-[#788470] hover:text-[#142010] p-1 rounded text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto divide-y divide-[#E8DFC9] flex-1">
              {items.length === 0 ? (
                <p className="text-xs text-center py-6 text-[#788470]">No unsynced receipts.</p>
              ) : (
                items.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-mono font-bold text-[#142010]">
                        {m.payload.receiptNumber}
                      </div>
                      <div className="text-[11px] text-[#525E4B]">
                        {m.receipt.studentName} · {formatFCFA(m.payload.amount)}
                      </div>
                      <div className="text-[10px] text-[#788470]">
                        {m.payload.paymentDate} · Status:{" "}
                        <span className={m.status === "failed" ? "text-red-600 font-bold" : "text-amber-700"}>
                          {m.status === "failed" ? `Sync failed (${m.lastError || "error"})` : "Queued"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveReceipt(m)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[5px] bg-[#FFFDF5] border border-[#E8DFC9] text-xs font-semibold hover:bg-[#F5EFE0] text-[#142010]"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#2A7C13]" />
                      <span>Print</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#E8DFC9] flex items-center justify-between">
              <button
                type="button"
                onClick={() => syncNow()}
                disabled={!isOnline || isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] disabled:opacity-50 text-white font-semibold text-xs shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync All Now"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable provisional receipt overlay */}
      {activeReceipt && (
        <ProvisionalReceiptOverlay
          mutation={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </>
  );
}
