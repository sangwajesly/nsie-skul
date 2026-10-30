"use client";

import { useState, useTransition } from "react";
import {
  Server,
  Wifi,
  Key,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Check,
  HardDrive,
  Laptop,
} from "lucide-react";
import { registerNewHubNodeAction, revokeHubNodeAction } from "./hub-actions";
import type { SchoolHubNode } from "@/lib/hub/hub-service";

interface SchoolHubSettingsProps {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  isHubMode: boolean;
  localLanIp?: string;
  hubs: SchoolHubNode[];
}

export function SchoolHubSettings({
  schoolId,
  schoolName,
  schoolCode,
  isHubMode,
  localLanIp = "192.168.1.100",
  hubs: initialHubs,
}: SchoolHubSettingsProps) {
  const [hubs, setHubs] = useState<SchoolHubNode[]>(initialHubs);
  const [isPending, startTransition] = useTransition();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [hubNameInput, setHubNameInput] = useState("Main Campus LAN Server");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const localAccessUrl = `http://${localLanIp}:3000`;

  const handleRegisterHub = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const formData = new FormData();
    formData.append("hubName", hubNameInput);

    startTransition(async () => {
      const res = await registerNewHubNodeAction(formData);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else if (res?.hub && res?.nodeKey) {
        setHubs([res.hub, ...hubs]);
        setGeneratedKey(res.nodeKey);
        setMessage({
          type: "success",
          text: "School Hub node registered. Save this Node Key to configure the local computer.",
        });
      }
    });
  };

  const handleRevokeHub = (hubId: string) => {
    if (!confirm("Are you sure you want to revoke this School Hub? It will no longer be able to sync with the cloud.")) {
      return;
    }

    const formData = new FormData();
    formData.append("hubId", hubId);

    startTransition(async () => {
      const res = await revokeHubNodeAction(formData);
      if (res?.error) {
        setMessage({ type: "error", text: res.error });
      } else {
        setHubs(hubs.map((h) => (h.id === hubId ? { ...h, status: "revoked" } : h)));
        setMessage({ type: "success", text: "School Hub node revoked." });
      }
    });
  };

  const copyToClipboard = (text: string, isIp = false) => {
    navigator.clipboard.writeText(text);
    if (isIp) {
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div id="school-hub" className="bg-[#FFFDF5] border border-[#E8DFC9] rounded-[8px] p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DFC9]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#EBF7E5] text-[#2A7C13] flex items-center justify-center font-bold">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#142010]">School Hub &amp; Local Network Architecture</h3>
            <p className="text-xs text-[#525E4B]">
              Run an on-premise local server so staff can enter marks and print receipts without internet.
            </p>
          </div>
        </div>

        {/* Current Server Mode Pill */}
        <div>
          {isHubMode ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF7E5] text-[#2A7C13] border border-[#CCECC0] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#2A7C13] animate-pulse" />
              <span>School Hub Active (Local LAN)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
              <Laptop className="w-3.5 h-3.5" />
              <span>Cloud Multi-Tenant Mode</span>
            </span>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-xs ${
            message.type === "success"
              ? "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Active Hub Local Wi-Fi Access Banner */}
      {isHubMode && (
        <div className="p-4 rounded-[6px] bg-[#EBF7E5] border border-[#CCECC0] space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1B5E20]">
            <Wifi className="w-4 h-4 text-[#2A7C13]" />
            <span>Staff Local Wi-Fi Access URL</span>
          </div>
          <p className="text-xs text-[#2A7C13]">
            Teachers and bursars connected to the school Wi-Fi can open this link on their phones or laptops without internet:
          </p>
          <div className="flex items-center gap-2">
            <code className="px-3 py-1.5 rounded bg-white font-mono font-bold text-sm text-[#142010] border border-[#CCECC0]">
              {localAccessUrl}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(localAccessUrl, true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-white border border-[#CCECC0] text-xs font-semibold text-[#142010] hover:bg-[#F5F5F0] cursor-pointer"
            >
              {copiedIp ? <Check className="w-3.5 h-3.5 text-[#2A7C13]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIp ? "Copied" : "Copy Link"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Overview Explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-[6px] bg-white border border-[#E8DFC9] space-y-1">
          <div className="font-bold text-[#142010] flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-[#2A7C13]" />
            <span>Zero-Internet Operation</span>
          </div>
          <p className="text-[#525E4B] text-[11px] leading-relaxed">
            The school computer acts as the central server. Staff can record fees and enter sequence marks through blackouts.
          </p>
        </div>

        <div className="p-3.5 rounded-[6px] bg-white border border-[#E8DFC9] space-y-1">
          <div className="font-bold text-[#142010] flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-[#2A7C13]" />
            <span>Two-Way Cloud Sync</span>
          </div>
          <p className="text-[#525E4B] text-[11px] leading-relaxed">
            Whenever an internet hotspot or modem is plugged in, the Hub automatically backs up everything to Supabase.
          </p>
        </div>

        <div className="p-3.5 rounded-[6px] bg-white border border-[#E8DFC9] space-y-1">
          <div className="font-bold text-[#142010] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#2A7C13]" />
            <span>30-Day Offline Lease</span>
          </div>
          <p className="text-[#525E4B] text-[11px] leading-relaxed">
            Active school subscriptions grant a 30-day offline cryptographic lease, protecting software licensing.
          </p>
        </div>
      </div>

      {/* Registered Hub Nodes Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-[#788470]">
            Registered On-Premise Hubs ({hubs.filter((h) => h.status === "active").length} Active)
          </div>
          <button
            type="button"
            onClick={() => {
              setShowRegisterModal(true);
              setGeneratedKey(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register a Hub Computer</span>
          </button>
        </div>

        {hubs.length === 0 ? (
          <div className="p-6 text-center rounded-[6px] bg-white border border-[#E8DFC9] text-xs text-[#788470]">
            No Hub servers registered yet. Click &ldquo;Register a Hub Computer&rdquo; to set up the school desktop or mini-PC.
          </div>
        ) : (
          <div className="divide-y divide-[#E8DFC9] bg-white border border-[#E8DFC9] rounded-[6px]">
            {hubs.map((h) => (
              <div key={h.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#142010]">{h.hub_name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        h.status === "active"
                          ? "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {h.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#788470] mt-1 font-mono">
                    <span>IP: {h.local_ip || "Waiting for first connection"}</span>
                    <span>•</span>
                    <span>Lease: {new Date(h.lease_expires_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Last Sync: {h.last_sync_at ? new Date(h.last_sync_at).toLocaleDateString() : "Never"}</span>
                  </div>
                </div>

                {h.status === "active" && (
                  <button
                    type="button"
                    onClick={() => handleRevokeHub(h.id)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Register Hub Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[10px] border border-[#E8DFC9] shadow-xl w-full max-w-md p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#142010]">
                <Server className="w-4 h-4 text-[#2A7C13]" />
                <span>Register a School Hub Node</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="text-[#788470] hover:text-[#142010] font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {generatedKey ? (
              <div className="space-y-3">
                <div className="p-3 rounded bg-[#EBF7E5] border border-[#CCECC0] text-[#1B5E20] space-y-1">
                  <div className="font-bold">Hub Registered Successfully!</div>
                  <p className="text-[11px]">
                    Copy this Node Key. You will paste it into the <code>.env.hub</code> file on the school computer:
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={generatedKey}
                    className="w-full px-3 py-2 rounded border border-[#CCECC0] bg-white font-mono text-xs font-bold text-[#142010] pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedKey)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-[#2A7C13] text-white text-[11px] font-bold cursor-pointer"
                  >
                    {copiedKey ? "Copied!" : "Copy"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="w-full py-2 rounded bg-[#142010] text-white font-bold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterHub} className="space-y-3">
                <div>
                  <label className="block font-medium text-[#525E4B] mb-1">Hub Name / Location</label>
                  <input
                    type="text"
                    required
                    value={hubNameInput}
                    onChange={(e) => setHubNameInput(e.target.value)}
                    placeholder="e.g. Bursary Desktop, Principal Office Mini-PC"
                    className="w-full px-3 py-2 rounded border border-[#E8DFC9] text-xs font-semibold focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-3.5 py-1.5 rounded border border-[#E8DFC9] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-1.5 rounded bg-[#2A7C13] text-white font-semibold text-xs shadow-xs"
                  >
                    {isPending ? "Registering..." : "Generate Hub Key"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
