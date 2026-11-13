"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  ArrowRight,
  Server,
  WifiOff,
  AlertCircle,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  UserCheck,
  Phone,
} from "lucide-react";
import { unlockHubWithPinAction, setupHubNodeAction } from "../actions";
import { loginWithTeacherCodeAction } from "@/app/auth/actions";

interface HubLoginClientProps {
  isConfigured: boolean;
  schoolName: string;
  schoolCode: string;
  hasPin: boolean;
}

export function HubLoginClient({
  isConfigured,
  schoolName,
  schoolCode,
  hasPin,
}: HubLoginClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"teacher" | "admin">("teacher");
  const [pinOrKey, setPinOrKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showKeyMode, setShowKeyMode] = useState(false);

  // Teacher login states
  const [teacherIdentifier, setTeacherIdentifier] = useState("");
  const [teacherSchoolCode, setTeacherSchoolCode] = useState(schoolCode || "");
  const [teacherPin, setTeacherPin] = useState("");

  // Setup form states for initial activation
  const [setupNodeKey, setSetupNodeKey] = useState("");
  const [setupSchoolName, setSetupSchoolName] = useState("");
  const [setupSchoolCode, setSetupSchoolCode] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [setupConfirmPin, setSetupConfirmPin] = useState("");

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherIdentifier.trim()) {
      setError("Please enter your Teacher Code (e.g. SPCHS-952) or Phone Number.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("identifier", teacherIdentifier.trim());
    formData.append("schoolCode", (teacherSchoolCode || schoolCode).trim());
    formData.append("pin", teacherPin.trim() || "123456");

    startTransition(async () => {
      try {
        const res = await loginWithTeacherCodeAction(null, formData);
        if ("error" in res && res.error) {
          setError(res.error);
        } else if ("redirectTo" in res) {
          window.location.href = res.redirectTo;
        } else {
          window.location.href = "/dashboard";
        }
      } catch (err: any) {
        setError(err.message || "Failed to log in. Please check your credentials.");
      }
    });
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinOrKey.trim()) {
      setError("Please enter your Master PIN or Node Key.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("pinOrKey", pinOrKey.trim());

    startTransition(async () => {
      try {
        const res = await unlockHubWithPinAction(formData);
        if (res?.error) {
          setError(res.error);
        } else {
          // Hard navigation to ensure cookies are read cleanly by server middleware
          window.location.href = "/dashboard";
        }
      } catch (err: any) {
        setError(err.message || "Failed to verify. Please try again.");
      }
    });
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!setupNodeKey.trim()) {
      setError("Please paste your Hub Node Key from the school cloud settings.");
      return;
    }
    if (!setupPin.trim() || setupPin.length < 4) {
      setError("Master PIN must be at least 4 digits.");
      return;
    }
    if (setupPin !== setupConfirmPin) {
      setError("PIN confirmation does not match.");
      return;
    }

    const formData = new FormData();
    formData.append("nodeKey", setupNodeKey.trim());
    formData.append("schoolName", setupSchoolName.trim());
    formData.append("schoolCode", setupSchoolCode.trim());
    formData.append("pin", setupPin.trim());

    startTransition(async () => {
      try {
        const res = await setupHubNodeAction(formData);
        if (res?.error) {
          setError(res.error);
        } else {
          window.location.href = "/dashboard";
        }
      } catch (err: any) {
        setError(err.message || "Failed to activate station.");
      }
    });
  };

  const handleKeypadPress = (val: string) => {
    if (val === "DEL") {
      setPinOrKey((prev) => prev.slice(0, -1));
    } else if (val === "CLR") {
      setPinOrKey("");
    } else {
      if (pinOrKey.length < 8) {
        setPinOrKey((prev) => prev + val);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#142010] text-[#191919] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#2A7C13]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E5E5DF] overflow-hidden">
        {/* Top Header Bar */}
        <div className="bg-[#1C3217] p-6 text-white text-center border-b border-[#2A7C13]/40">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#142010] border border-[#4ADE80]/40 p-2 mb-3 shadow-inner">
            <Image
              src="/app-icon.png"
              alt="Nsei Sukul Logo"
              width={48}
              height={48}
              priority
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">{schoolName}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2A7C13] text-[#DCFCE7] border border-[#4ADE80]/30">
              <Server className="w-3.5 h-3.5" />
              School Hub Master Station
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#142010] text-[#AAAAAA] border border-white/10">
              <WifiOff className="w-3 h-3 text-[#F59E0B]" />
              Offline Station
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-center gap-2.5 text-xs text-[#991B1B]">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span>{error}</span>
            </div>
          )}

          {isConfigured ? (
            <>
              {/* Tab Selector: Teacher Sign In vs Hub Master Station */}
              <div className="flex rounded-xl bg-[#F1F5F9] p-1 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setMode("teacher");
                    setError(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mode === "teacher"
                      ? "bg-white text-[#2A7C13] shadow-xs"
                      : "text-[#64748B] hover:text-[#1E293B]"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Teacher Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("admin");
                    setError(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mode === "admin"
                      ? "bg-white text-[#2A7C13] shadow-xs"
                      : "text-[#64748B] hover:text-[#1E293B]"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Hub Master Unlock</span>
                </button>
              </div>

              {mode === "teacher" ? (
                /* Teacher Access Form */
                <form onSubmit={handleTeacherSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#444444] mb-1">
                      School Code
                    </label>
                    <input
                      type="text"
                      value={teacherSchoolCode}
                      onChange={(e) => setTeacherSchoolCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SPCHS"
                      className="w-full text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 bg-[#F8FAF6] border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#2A7C13] text-[#191919]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#444444] mb-1">
                      Teacher Code or Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={teacherIdentifier}
                        onChange={(e) => setTeacherIdentifier(e.target.value)}
                        placeholder="e.g. SPCHS-952 or 682833601"
                        className="w-full text-sm font-medium px-3.5 py-2.5 bg-[#F8FAF6] border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#2A7C13] text-[#191919]"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888]">
                        <UserCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-[#666666]">
                      Enter your assigned teacher access code or registered phone number.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#444444] mb-1">
                      Teacher PIN
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        inputMode="numeric"
                        value={teacherPin}
                        onChange={(e) => setTeacherPin(e.target.value)}
                        placeholder="Default: 123456"
                        className="w-full text-sm font-mono tracking-widest px-3.5 py-2.5 bg-[#F8FAF6] border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#2A7C13] text-[#191919]"
                        maxLength={8}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888]">
                        <Lock className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending || !teacherIdentifier.trim()}
                    className="w-full mt-2 py-3 px-4 bg-[#2A7C13] hover:bg-[#236810] text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
                  >
                    {isPending ? (
                      <span>Signing In...</span>
                    ) : (
                      <>
                        <span>Sign In as Teacher</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Master PIN / Node Key Unlock Screen */
                <form onSubmit={handlePinSubmit} className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[#444444] uppercase tracking-wider">
                        {showKeyMode ? "Hub Node Key" : hasPin ? "Enter Master PIN" : "Create Master PIN"}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowKeyMode(!showKeyMode);
                          setError(null);
                          setPinOrKey("");
                        }}
                        className="text-xs font-medium text-[#2A7C13] hover:underline"
                      >
                        {showKeyMode ? "Switch to PIN" : "Use Hub Node Key"}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showKeyMode ? "text" : "password"}
                        inputMode={showKeyMode ? "text" : "numeric"}
                        autoFocus
                        value={pinOrKey}
                        onChange={(e) => setPinOrKey(e.target.value)}
                        placeholder={showKeyMode ? "hub_code_..." : "••••"}
                        className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 bg-[#F8FAF6] border-2 border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#2A7C13] focus:bg-white transition-all text-[#191919]"
                        maxLength={showKeyMode ? 64 : 8}
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#888888]">
                        {showKeyMode ? <KeyRound className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                    </div>

                    {!hasPin && !showKeyMode && (
                      <p className="mt-2 text-[11px] text-[#666666] text-center">
                        First time launching on this PC. Choose a 4 to 8 digit PIN to protect this Hub station.
                      </p>
                    )}
                  </div>

                  {/* Quick keypad for touch screens / kiosks (only in PIN mode) */}
                  {!showKeyMode && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "DEL"].map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleKeypadPress(key)}
                          className={`h-11 rounded-lg text-base font-bold transition-colors select-none ${
                            key === "DEL" || key === "CLR"
                              ? "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] text-xs font-semibold"
                              : "bg-[#F8FAF6] text-[#1E293B] hover:bg-[#E2E8F0] active:bg-[#CBD5E1]"
                          }`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPending || !pinOrKey}
                    className="w-full py-3.5 px-4 bg-[#2A7C13] hover:bg-[#236810] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <span>Verifying Station...</span>
                    ) : (
                      <>
                        <span>Unlock School Hub</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          ) : (
            /* First-Time Station Activation Screen */
            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="text-center mb-3">
                <span className="inline-block p-2 rounded-xl bg-[#DCFCE7] text-[#2A7C13] mb-1">
                  <KeyRound className="w-6 h-6" />
                </span>
                <h2 className="text-base font-bold text-[#191919]">Activate School Hub Station</h2>
                <p className="text-xs text-[#666666]">
                  Paste your Hub Node Key generated from your online school settings.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444444] mb-1">
                  Hub Node Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={setupNodeKey}
                  onChange={(e) => setSetupNodeKey(e.target.value)}
                  placeholder="e.g. hub_bhs_7f9a12c4..."
                  className="w-full text-xs font-mono px-3 py-2.5 bg-[#F8FAF6] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2A7C13]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    School Name
                  </label>
                  <input
                    type="text"
                    value={setupSchoolName}
                    onChange={(e) => setSetupSchoolName(e.target.value)}
                    placeholder="e.g. GBHS Bamenda"
                    className="w-full text-xs px-3 py-2 bg-[#F8FAF6] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    School Code
                  </label>
                  <input
                    type="text"
                    value={setupSchoolCode}
                    onChange={(e) => setSetupSchoolCode(e.target.value)}
                    placeholder="e.g. BHS"
                    className="w-full text-xs px-3 py-2 bg-[#F8FAF6] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Create Master PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    required
                    value={setupPin}
                    onChange={(e) => setSetupPin(e.target.value)}
                    placeholder="4-8 digits"
                    className="w-full text-center text-sm font-mono px-3 py-2 bg-[#F8FAF6] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2A7C13]"
                    maxLength={8}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Confirm PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    required
                    value={setupConfirmPin}
                    onChange={(e) => setSetupConfirmPin(e.target.value)}
                    placeholder="Re-enter PIN"
                    className="w-full text-center text-sm font-mono px-3 py-2 bg-[#F8FAF6] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#2A7C13]"
                    maxLength={8}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-2 py-3 px-4 bg-[#2A7C13] hover:bg-[#236810] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <span>Activating Station...</span>
                ) : (
                  <>
                    <span>Activate Hub & Open Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom Security / Station Info */}
          <div className="mt-6 pt-4 border-t border-[#E5E5DF] text-center">
            <p className="text-[11px] text-[#888888] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2A7C13]" />
              Single-machine cryptographic lock. Station active on port 3000.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
