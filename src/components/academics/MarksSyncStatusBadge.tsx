"use client";

import { Cloud, CloudCheck, CloudOff, RefreshCw, Wifi, WifiOff, HardDrive } from "lucide-react";

export type SyncState = "synced" | "saving_local" | "syncing_cloud" | "pending_offline" | "error";

interface MarksSyncStatusBadgeProps {
  isOnline: boolean;
  syncState: SyncState;
  pendingCount: number;
  lastSyncedAt?: Date | null;
  onSyncNow?: () => void;
  isSyncingManual?: boolean;
}

export function MarksSyncStatusBadge({
  isOnline,
  syncState,
  pendingCount,
  lastSyncedAt,
  onSyncNow,
  isSyncingManual = false,
}: MarksSyncStatusBadgeProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Network Connectivity Indicator */}
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

      {/* Cloud & Local Storage Sync State Badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium transition-all ${
          syncState === "syncing_cloud" || isSyncingManual
            ? "bg-[#EBF5FB] text-[#1D4ED8] border-[#BFDBFE]"
            : syncState === "synced" && pendingCount === 0
            ? "bg-[#EBF7E5] text-[#1B5E20] border-[#CCECC0]"
            : !isOnline || syncState === "pending_offline" || pendingCount > 0
            ? "bg-[#FFF8CF] text-[#7A4A00] border-[#FBE6C2]"
            : "bg-gray-100 text-gray-700 border-gray-200"
        }`}
      >
        {syncState === "syncing_cloud" || isSyncingManual ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1D4ED8]" />
            <span>Syncing with cloud...</span>
          </>
        ) : syncState === "synced" && pendingCount === 0 ? (
          <>
            <CloudCheck className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>
              All saved to cloud
              {lastSyncedAt && (
                <span className="text-[#525E4B] font-normal ml-1 hidden sm:inline">
                  ({formatTime(lastSyncedAt)})
                </span>
              )}
            </span>
          </>
        ) : !isOnline ? (
          <>
            <HardDrive className="w-3.5 h-3.5 text-[#B45309]" />
            <span>
              Saved locally on device
              {pendingCount > 0 && ` (${pendingCount} queued for cloud)`}
            </span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <CloudOff className="w-3.5 h-3.5 text-[#B45309]" />
            <span>
              Saved locally • {pendingCount} unsynced
            </span>
          </>
        ) : (
          <>
            <HardDrive className="w-3.5 h-3.5 text-gray-600" />
            <span>Saved locally</span>
          </>
        )}
      </div>

      {/* Manual "Sync Now" Button when changes are waiting or connection dropped */}
      {pendingCount > 0 && onSyncNow && (
        <button
          type="button"
          onClick={onSyncNow}
          disabled={!isOnline || isSyncingManual}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#2A7C13] hover:bg-[#1B5E20] disabled:opacity-50 text-white transition-all cursor-pointer shadow-2xs"
          title={
            !isOnline
              ? "Re-connect to internet to sync changes to cloud"
              : "Upload unsynced changes to the server now"
          }
        >
          <RefreshCw className={`w-3 h-3 ${isSyncingManual ? "animate-spin" : ""}`} />
          <span>{isSyncingManual ? "Syncing..." : "Sync Now"}</span>
        </button>
      )}
    </div>
  );
}
