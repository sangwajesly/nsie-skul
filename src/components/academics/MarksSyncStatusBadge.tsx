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
    <div className="inline-flex flex-wrap items-center gap-1.5 text-xs">
      {/* Consolidated Connectivity & Sync State Indicator */}
      <div
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
        title={
          !isOnline
            ? "Offline: Marks are saved locally on this device"
            : pendingCount > 0
            ? `${pendingCount} marks saved locally and queued for cloud sync`
            : "Connected and saved to cloud"
        }
      >
        {syncState === "syncing_cloud" || isSyncingManual ? (
          <span className="inline-flex items-center gap-1 text-blue-700">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
            <span>Syncing...</span>
          </span>
        ) : syncState === "synced_hub" ? (
          <span className="inline-flex items-center gap-1 text-sky-800">
            <Server className="w-3 h-3 text-sky-700" />
            <span>Saved to Hub</span>
          </span>
        ) : !isOnline ? (
          <span className="inline-flex items-center gap-1 text-[#B45309]">
            <WifiOff className="w-3 h-3" />
            <span>Offline (saved locally)</span>
          </span>
        ) : pendingCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[#B45309]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>{pendingCount} unsynced</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[#2A7C13]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2A7C13]" />
            <span>Synced</span>
            {lastSyncedAt && (
              <span className="text-[#525E4B] font-normal hidden lg:inline">
                ({formatTime(lastSyncedAt)})
              </span>
            )}
          </span>
        )}
      </div>

      {/* Manual "Sync" Button when changes are waiting */}
      {pendingCount > 0 && onSyncNow && (
        <button
          type="button"
          onClick={onSyncNow}
          disabled={!isOnline || isSyncingManual}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#2A7C13] hover:bg-[#1B5E20] disabled:opacity-50 text-white transition-all cursor-pointer shadow-2xs"
          title="Upload unsynced changes to the server now"
        >
          <RefreshCw className={`w-2.5 h-2.5 ${isSyncingManual ? "animate-spin" : ""}`} />
          <span>{isSyncingManual ? "Syncing" : "Sync"}</span>
        </button>
      )}

      {/* Local School Hub LAN Reachability Indicator */}
      {isHubReachable && (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-sky-200 bg-sky-50 text-sky-800 text-[10px] font-semibold"
          title={`School Hub server is reachable over local Wi-Fi (${hubName || "School LAN Hub"})`}
        >
          <span className="w-1 h-1 rounded-full bg-sky-500 animate-pulse" />
          <span>Hub Wi-Fi</span>
        </span>
      )}

      {/* Direct Peer-to-LAN School Hub Transfer Button */}
      {isHubReachable && onTransferToHub && (
        <button
          type="button"
          onClick={onTransferToHub}
          disabled={isTransferringHub}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white transition-all cursor-pointer shadow-2xs"
          title="Transfer marks to School Hub PC over Wi-Fi"
        >
          <Radio className={`w-2.5 h-2.5 ${isTransferringHub ? "animate-pulse" : ""}`} />
          <span>{isTransferringHub ? "Sending..." : "Transfer Hub"}</span>
        </button>
      )}

      {/* Hub Settings trigger */}
      {onOpenHubSettings && (
        <button
          type="button"
          onClick={onOpenHubSettings}
          className="p-0.5 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          title="School Hub Connection Settings"
        >
          <Server className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
