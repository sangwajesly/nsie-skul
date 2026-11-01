"use client";

import React, { useState, useEffect } from "react";
import {
  hasOfflinePin,
  setOfflinePin,
  verifyOfflinePin,
  getOfflineVaultStatus,
  saveOfflineTeachingScope,
  clearOfflineVault,
} from "@/lib/offline/offline-auth";
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  WifiOff,
} from "lucide-react";

export function OfflinePinCard() {
  const [status, setStatus] = useState<ReturnType<typeof getOfflineVaultStatus>>({
    hasVault: false,
    hasPin: false,
    isUnlocked: false,
    profile: null,
    daysRemaining: 0,
    studentCount: 0,
    classCount: 0,
    subjectCount: 0,
    lastOnlineAt: null,
  });

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const refreshStatus = () => {
    setStatus(getOfflineVaultStatus());
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleSetOrUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // If changing existing PIN, verify old PIN first
    if (status.hasPin) {
      if (currentPin.length !== 4) {
        setMessage({ type: "error", text: "Please enter your current 4-digit PIN." });
        return;
      }
      const isValid = await verifyOfflinePin(currentPin);
      if (!isValid) {
        setMessage({ type: "error", text: "Current PIN is incorrect." });
        return;
      }
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setMessage({ type: "error", text: "New PIN must be exactly 4 numeric digits." });
      return;
    }

    if (newPin !== confirmPin) {
      setMessage({ type: "error", text: "New PIN and confirmation do not match." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await setOfflinePin(newPin);
      if (res.success) {
        setMessage({
          type: "success",
          text: status.hasPin
            ? "Offline PIN updated successfully."
            : "4-Digit Offline PIN configured and activated on this device.",
        });
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        setShowForm(false);
        refreshStatus();
      } else {
        setMessage({ type: "error", text: res.error || "Failed to set PIN." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to configure PIN." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSync = async () => {
    if (!navigator.onLine) {
      setMessage({
        type: "error",
        text: "Cannot refresh offline cache while disconnected. Please reconnect to internet.",
      });
      return;
    }

    setIsSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/offline/scope", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        saveOfflineTeachingScope(data);
        refreshStatus();
        setMessage({
          type: "success",
          text: `Offline cache updated: ${data.enrolledStudents?.length || 0} students and ${data.classes?.length || 0} classes ready for offline marks entry.`,
        });
      } else {
        setMessage({ type: "error", text: "Server returned an error refreshing offline cache." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error refreshing offline cache." });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearVault = () => {
    if (
      window.confirm(
        "Are you sure you want to clear the offline vault from this browser? Any unsynced marks should be synced first."
      )
    ) {
      clearOfflineVault();
      refreshStatus();
      setMessage({
        type: "success",
        text: "Offline vault cleared from this device.",
      });
    }
  };

  return (
    <div className="bg-white rounded-[10px] border border-[#E8DFC9] p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DFC9]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[8px] bg-[#142010] text-[#86EFAC] shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#142010]">
              Offline Access PIN &amp; Device Vault
            </h3>
            <p className="text-xs text-[#525E4B]">
              Configure emergency 4-digit PIN unlock for offline marks entry and roster lookup
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status.hasPin ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
              <span>PIN Protected</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              <ShieldAlert className="w-3.5 h-3.5 text-[#B45309]" />
              <span>No PIN Set</span>
            </span>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-[6px] text-xs flex items-center gap-2 font-medium ${
            message.type === "success"
              ? "bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#166534]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Vault Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9] space-y-1">
          <div className="text-[11px] font-semibold text-[#525E4B] flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>Cached Teaching Scope</span>
          </div>
          <div className="text-lg font-extrabold text-[#142010]">
            {status.studentCount} Students
          </div>
          <div className="text-[11px] text-[#788470]">
            {status.classCount} classes · {status.subjectCount} subjects cached
          </div>
        </div>

        <div className="p-3.5 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9] space-y-1">
          <div className="text-[11px] font-semibold text-[#525E4B] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>Offline Lease Duration</span>
          </div>
          <div className="text-lg font-extrabold text-[#142010]">
            {status.daysRemaining} Days Remaining
          </div>
          <div className="text-[11px] text-[#788470]">
            Auto-renews for 30 days whenever online
          </div>
        </div>

        <div className="p-3.5 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9] space-y-1">
          <div className="text-[11px] font-semibold text-[#525E4B] flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>Offline Login Method</span>
          </div>
          <div className="text-lg font-extrabold text-[#142010]">
            {status.hasPin ? "4-Digit PIN Keypad" : "Not Configured"}
          </div>
          <div className="text-[11px] text-[#788470]">
            {status.hasPin ? "Web Crypto SHA-256 device salt" : "Requires active internet to sign in"}
          </div>
        </div>
      </div>

      {/* Explainer Box */}
      <div className="p-4 rounded-[8px] bg-[#F5F5F0] border border-[#E5E5DF] text-xs text-[#525E4B] leading-relaxed">
        <strong className="text-[#142010]">How Offline Mode works in Cameroon:</strong>
        <p className="mt-1">
          When the school router or mobile data is down, teachers can still log into their device using their 4-digit PIN. All marks entered are persisted safely in local browser IndexedDB and can be synced either to the local School Hub PC over Wi-Fi or directly to the cloud once an internet connection returns.
        </p>
      </div>

      {/* PIN Configuration Form or Trigger */}
      {showForm ? (
        <form onSubmit={handleSetOrUpdatePin} className="p-5 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9] space-y-4">
          <h4 className="text-xs font-bold text-[#142010] uppercase tracking-wider">
            {status.hasPin ? "Change 4-Digit Offline PIN" : "Configure 4-Digit Offline PIN"}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {status.hasPin && (
              <div>
                <label className="block text-xs font-semibold text-[#525E4B] mb-1">
                  Current 4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  required
                  className="w-full text-center text-lg tracking-widest font-mono py-2 rounded-[5px] border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#525E4B] mb-1">
                New 4-Digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]{4}"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                required
                className="w-full text-center text-lg tracking-widest font-mono py-2 rounded-[5px] border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#525E4B] mb-1">
                Confirm New PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]{4}"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                required
                className="w-full text-center text-lg tracking-widest font-mono py-2 rounded-[5px] border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setCurrentPin("");
                setNewPin("");
                setConfirmPin("");
              }}
              className="px-3 py-1.5 rounded-[5px] border border-[#D5CBB2] text-xs font-semibold text-[#525E4B] hover:bg-[#F5F5F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || newPin.length !== 4 || confirmPin.length !== 4}
              className="px-4 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? "Saving..." : status.hasPin ? "Update PIN" : "Activate PIN"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              {status.hasPin ? "Change 4-Digit PIN" : "Configure 4-Digit PIN"}
            </button>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] border border-[#D5CBB2] bg-white hover:bg-[#F5F5F0] text-xs font-semibold text-[#142010] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing Cache..." : "Sync Teaching Cache Now"}</span>
            </button>
          </div>

          {status.hasVault && (
            <button
              type="button"
              onClick={handleClearVault}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Device Vault</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
