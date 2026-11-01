"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  saveOfflineSession,
  saveOfflineTeachingScope,
  saveOfflineSchools,
  hasOfflinePin,
  setOfflinePin,
  getOfflineVaultStatus,
  type OfflineSchoolMembership,
} from "@/lib/offline/offline-auth";
import { ShieldCheck, KeyRound, CheckCircle2, X, HardDrive, AlertCircle } from "lucide-react";

interface OfflineVaultSynchronizerProps {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  role: {
    code: string;
    name: string;
  };
  school: {
    id: string;
    name: string;
  };
  availableSchools?: OfflineSchoolMembership[];
}

const PIN_PROMPT_DISMISSED_KEY = "nsei_pin_prompt_dismissed_at";

export function OfflineVaultSynchronizer({
  user,
  role,
  school,
  availableSchools = [],
}: OfflineVaultSynchronizerProps) {
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");

  // Synchronize user profile, schools list & teaching scopes into offline vault
  const syncScope = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) return;

    // 1. Cache current profile with 30-day lease
    saveOfflineSession({
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      roleCode: role.code,
      roleName: role.name,
      schoolId: school.id,
      schoolName: school.name,
    });

    // 2. Cache full authorized schools list for offline switcher
    if (availableSchools.length > 0) {
      saveOfflineSchools(availableSchools);
    }

    // 3. Fetch and cache primary teaching scope (classes, subjects, student roster)
    try {
      setSyncStatus("syncing");
      const res = await fetch(`/api/v1/offline/scope?schoolId=${encodeURIComponent(school.id)}`, {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const scopeData = await res.json();
        saveOfflineTeachingScope(scopeData, school.id);
        setSyncStatus("synced");

        // 4. Background-cache secondary schools if teacher belongs to multiple campuses
        if (availableSchools.length > 1) {
          const secondarySchools = availableSchools.filter((s) => s.school.id !== school.id);
          for (const sec of secondarySchools) {
            try {
              const secRes = await fetch(
                `/api/v1/offline/scope?schoolId=${encodeURIComponent(sec.school.id)}`,
                { headers: { "Cache-Control": "no-cache" } }
              );
              if (secRes.ok) {
                const secScope = await secRes.json();
                saveOfflineTeachingScope(secScope, sec.school.id);
              }
            } catch {
              // Non-blocking background sync
            }
          }
        }
      } else {
        setSyncStatus("error");
      }
    } catch {
      setSyncStatus("error");
    }
  }, [user, role, school, availableSchools]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Run sync on mount
    syncScope();

    // Check if user has an offline PIN set up
    const hasPin = hasOfflinePin();
    if (!hasPin) {
      const dismissedAt = localStorage.getItem(PIN_PROMPT_DISMISSED_KEY);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (!dismissedAt || parseInt(dismissedAt, 10) < oneDayAgo) {
        // Show after a brief delay so page load isn't interrupted
        const timer = setTimeout(() => {
          setShowPinPrompt(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }

    // Also sync whenever connectivity returns
    const handleOnline = () => {
      syncScope();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncScope]);

  const handleDismissPrompt = () => {
    setShowPinPrompt(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(PIN_PROMPT_DISMISSED_KEY, Date.now().toString());
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinError("PIN must be exactly 4 numeric digits.");
      return;
    }

    if (pin !== confirmPin) {
      setPinError("PINs do not match. Please re-enter.");
      return;
    }

    setIsSettingPin(true);
    try {
      const res = await setOfflinePin(pin);
      if (res.success) {
        setPinSuccess(true);
        setTimeout(() => {
          setShowPinModal(false);
          setShowPinPrompt(false);
          setPinSuccess(false);
          setPin("");
          setConfirmPin("");
        }, 1500);
      } else {
        setPinError(res.error || "Failed to set PIN. Please try again.");
      }
    } catch (err: any) {
      setPinError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSettingPin(false);
    }
  };

  return (
    <>
      {/* Subtle Offline PIN Prompt Banner (Top-Right Toast) */}
      {showPinPrompt && !showPinModal && (
        <aside
          role="region"
          aria-label="Offline Security Pin Setup"
          className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100%-2rem)] animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="bg-[#142010] text-white p-3.5 rounded-[10px] border border-[#2A7C13] shadow-xl flex items-start gap-3">
            <div className="p-2 rounded-full bg-[#2A7C13]/30 text-[#86EFAC] shrink-0 mt-0.5">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Setup Offline Access PIN</span>
              </div>
              <p className="text-[11px] text-[#A3B899] mt-0.5 leading-snug">
                Set a 4-digit PIN so you can access your marksheet and enter marks when school internet is unavailable.
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => setShowPinModal(true)}
                  className="px-2.5 py-1 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Set PIN Now
                </button>
                <button
                  type="button"
                  onClick={handleDismissPrompt}
                  className="px-2 py-1 text-[11px] text-[#A3B899] hover:text-white transition-colors cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissPrompt}
              aria-label="Close notification"
              className="text-[#A3B899] hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* 4-Digit Offline PIN Setup Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[12px] border border-[#E8DFC9] shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#142010]">
                    Create 4-Digit Offline PIN
                  </h3>
                  <p className="text-[11px] text-[#525E4B]">
                    Enables instant access without internet
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="text-[#888888] hover:text-[#142010] p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#525E4B] leading-relaxed">
              When your school or mobile internet is offline, enter this 4-digit code on the login screen to unlock your teaching workspace and enter marks safely.
            </p>

            {pinError && (
              <div className="p-2.5 rounded-[6px] bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{pinError}</span>
              </div>
            )}

            {pinSuccess && (
              <div className="p-2.5 rounded-[6px] bg-green-50 text-green-800 border border-green-200 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
                <span>Offline PIN activated! Ready for offline marks entry.</span>
              </div>
            )}

            <form onSubmit={handleSavePin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#142010] mb-1">
                  Choose 4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="e.g. 1234"
                  required
                  autoFocus
                  className="w-full text-center text-xl tracking-[0.5em] font-mono py-2.5 rounded-[6px] border border-[#D5CBB2] bg-[#FFFDF5] text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#142010] mb-1">
                  Confirm 4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Repeat 4 digits"
                  required
                  className="w-full text-center text-xl tracking-[0.5em] font-mono py-2.5 rounded-[6px] border border-[#D5CBB2] bg-[#FFFDF5] text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-3.5 py-2 rounded-[6px] border border-[#D5CBB2] text-xs font-semibold text-[#525E4B] hover:bg-[#F5F5F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettingPin || pin.length !== 4 || confirmPin.length !== 4}
                  className="px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSettingPin ? "Saving PIN..." : "Save Offline PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
