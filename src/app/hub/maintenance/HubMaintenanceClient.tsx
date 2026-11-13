"use client";

import React, { useState } from "react";
import { ShieldCheck, Database, RefreshCw, Key, CheckCircle, AlertTriangle } from "lucide-react";

interface HubMaintenanceClientProps {
  config: any;
  publicKeyPem: string;
  pendingCount: number;
}

export default function HubMaintenanceClient({
  config,
  publicKeyPem,
  pendingCount,
}: HubMaintenanceClientProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncStatus("Synchronizing with Nsei Sukul Cloud...");
    try {
      const res = await fetch("/api/v1/hub/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(`Sync successful: ${data.itemsPushed || 0} pushed, ${data.itemsPulled || 0} pulled.`);
      } else {
        setSyncStatus(`Sync error: ${data.message || "Failed to synchronize."}`);
      }
    } catch (err: any) {
      setSyncStatus(`Network error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Hub Maintenance Console</h1>
              <p className="text-sm text-slate-400">Offline Appliance & Node Identity Management</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
            Node Active
          </span>
        </div>

        {/* Node Metadata & School Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-2">
            <div className="flex items-center text-slate-400 text-xs font-medium space-x-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Registered School</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {config?.schoolName || "Station Mode"}
            </div>
            <div className="text-xs text-slate-400">Code: {config?.schoolCode || "SCH"}</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-2">
            <div className="flex items-center text-slate-400 text-xs font-medium space-x-1.5">
              <Key className="w-4 h-4 text-sky-400" />
              <span>Node Cryptographic Key</span>
            </div>
            <div className="text-sm font-mono text-slate-200 truncate">
              {config?.nodeKey || "Configured via .env.local"}
            </div>
            <div className="text-xs text-emerald-400">Ed25519 Engine Active</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-2">
            <div className="flex items-center text-slate-400 text-xs font-medium space-x-1.5">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Transactional Outbox</span>
            </div>
            <div className="text-2xl font-bold text-white">{pendingCount}</div>
            <div className="text-xs text-slate-400">Mutations awaiting sync</div>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Manual Cloud Synchronization</h2>
              <p className="text-xs text-slate-400">
                Trigger bidirectional synchronization to flush outbox mutations to central cloud.
              </p>
            </div>
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync Now"}</span>
            </button>
          </div>

          {syncStatus && (
            <div className="p-3 bg-slate-900/80 border border-slate-700 rounded-lg text-xs font-mono text-slate-300">
              {syncStatus}
            </div>
          )}
        </div>

        {/* Asymmetric Public Identity */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 space-y-3">
          <h2 className="text-base font-semibold text-white">Station Public Identity (SPKI PEM)</h2>
          <p className="text-xs text-slate-400">
            This public key is registered with the central cloud to cryptographically verify data pushes from this machine.
          </p>
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto">
            {publicKeyPem}
          </pre>
        </div>
      </div>
    </div>
  );
}
