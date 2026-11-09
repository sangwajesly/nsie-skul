"use client";

import { Cloud, CloudOff, RefreshCw, Wifi, WifiOff, HardDrive, Radio, Check, Server } from "lucide-react";

export type SyncState = "synced" | "saving_local" | "syncing_cloud" | "pending_offline" | "error" | "synced_hub";

interface MarksSyncStatusBadgeProps {
  isOnline: boolean;
  syncState: SyncState;
  pendingCount: number;
  lastSyncedAt?: Date | null;
  onSyncNow?: () => void;
  isSyncingManual?: boolean;
  isHubReachable?: boolean;
  hubName?: string;
  onTransferToHub?: () => void;
  isTransferringHub?: boolean;
  onOpenHubSettings?: () => void;
}

export function MarksSyncStatusBadge({
  isOnline,
  syncState,
  pendingCount,
  lastSyncedAt,
  onSyncNow,
  isSyncingManual = false,
  isHubReachable = false,
  hubName,
  onTransferToHub,
  isTransferringHub = false,
  onOpenHubSettings,
}: MarksSyncStatusBadgeProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {/* Consolidated Connectivity & Sync State Indicator */}
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold transition-colors ${
          syncState === "syncing_cloud" || isSyncingManual
            ? "bg-[#EBF5FB] text-[#1D4ED8] border-[#BFDBFE]"
            : syncState === "synced_hub"
            ? "bg-sky-50 text-sky-900 border-sky-200"
            : !isOnline
            ? "bg-[#FFF4E5] text-[#B45309] border-[#FDE3C8]"
            : pendingCount > 0 || syncState === "pending_offline"
            ? "bg-[#FFF8CF] text-[#7A4A00] border-[#FBE6C2]"
            : "bg-[#EBF7E5] text-[#2A7C13] border-[#CCECC0]"
        }`}
        title={
          !isOnline
            ? "Offline: Marks are saved locally on this device"
            : pendingCount > 0
            ? `${pendingCount} marks saved locally and queued for cloud sync`
            : "Connected and saved to cloud"
        }
      >
        {syncState === "syncing_cloud" || isSyncingManual ? (
          <>
            <RefreshCw className="w-3 h-3 animate-spin text-[#1D4ED8]" />
            <span>Syncing cloud...</span>
          </>
        ) : syncState === "synced_hub" ? (
          <>
            <Server className="w-3 h-3 text-sky-700" />
            <span>Saved to Hub (LAN)</span>
          </>
        ) : !isOnline ? (
          <>
            <WifiOff className="w-3 h-3 text-[#B45309]" />
            <span>Offline · Saved locally</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Local · {pendingCount} unsynced</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-[#2A7C13]" />
            <span>Cloud synced</span>
            {lastSyncedAt && (
              <span className="text-[#525E4B] font-normal hidden lg:inline">
                ({formatTime(lastSyncedAt)})
              </span>
            )}
          </>
        )}
      </div>

      {/* Local School Hub LAN Reachability Indicator */}
      {isHubReachable && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-sky-200 bg-sky-50 text-sky-800 text-[10px] font-semibold"
          title={`School Hub server is reachable over local Wi-Fi (${hubName || "School LAN Hub"})`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          <span>Hub Wi-Fi</span>
        </span>
      )}

      {/* Manual "Sync Cloud Now" Button when changes are waiting */}
      {pendingCount > 0 && onSyncNow && (
        <button
          type="button"
          onClick={onSyncNow}
          disabled={!isOnline || isSyncingManual}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#2A7C13] hover:bg-[#1B5E20] disabled:opacity-50 text-white transition-all cursor-pointer shadow-2xs"
          title="Upload unsynced changes to the server now"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncingManual ? "animate-spin" : ""}`} />
          <span>{isSyncingManual ? "Syncing..." : "Sync Cloud"}</span>
        </button>
      )}

      {/* Direct Peer-to-LAN School Hub Transfer Button */}
      {isHubReachable && onTransferToHub && (
        <button
          type="button"
          onClick={onTransferToHub}
          disabled={isTransferringHub}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white transition-all cursor-pointer shadow-2xs"
          title="Transfer marks to School Hub PC over Wi-Fi"
        >
          <Radio className={`w-3 h-3 ${isTransferringHub ? "animate-pulse" : ""}`} />
          <span>{isTransferringHub ? "Sending..." : "Transfer Hub"}</span>
        </button>
      )}

      {/* Hub Settings trigger */}
      {onOpenHubSettings && (
        <button
          type="button"
          onClick={onOpenHubSettings}
          className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          title="School Hub Connection Settings"
        >
          <Server className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
