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

      {/* Local School Hub LAN Reachability Indicator */}
      {isHubReachable && (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-sky-200 bg-sky-50 text-sky-800 text-[11px] font-medium"
          title={`School Hub server is reachable over local Wi-Fi (${hubName || "School LAN Hub"})`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <span>Hub on Wi-Fi</span>
        </div>
      )}

      {/* Cloud & Local Storage Sync State Badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium transition-all ${
          syncState === "syncing_cloud" || isSyncingManual
            ? "bg-[#EBF5FB] text-[#1D4ED8] border-[#BFDBFE]"
            : syncState === "synced_hub"
            ? "bg-sky-50 text-sky-900 border-sky-200"
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
        ) : syncState === "synced_hub" ? (
          <>
            <Server className="w-3.5 h-3.5 text-sky-700" />
            <span>Transferred to School Hub (LAN)</span>
          </>
        ) : syncState === "synced" && pendingCount === 0 ? (
          <>
            <Check className="w-3.5 h-3.5 text-[#2A7C13]" />
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

      {/* Direct Peer-to-LAN School Hub Transfer Button */}
      {onTransferToHub && (
        <button
          type="button"
          onClick={onTransferToHub}
          disabled={isTransferringHub}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white transition-all cursor-pointer shadow-2xs"
          title="Directly transfer marks to the School Hub PC over school Wi-Fi (works without internet)"
        >
          <Radio className={`w-3 h-3 ${isTransferringHub ? "animate-pulse" : ""}`} />
          <span>{isTransferringHub ? "Sending to Hub..." : "Transfer to School Hub"}</span>
        </button>
      )}

      {/* Manual "Sync Cloud Now" Button when changes are waiting or connection dropped */}
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
          <span>{isSyncingManual ? "Syncing..." : "Sync Cloud"}</span>
        </button>
      )}

      {/* Hub Settings trigger */}
      {onOpenHubSettings && (
        <button
          type="button"
          onClick={onOpenHubSettings}
          className="p-1 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          title="School Hub Connection Settings"
        >
          <Server className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
