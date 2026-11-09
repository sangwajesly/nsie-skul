"use client";

import { useState, useEffect, useRef } from "react";
import { SchoolSubscriptionInfo } from "@/types/tenancy";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Loader2,
  ExternalLink,
  Zap,
  Users,
} from "lucide-react";
import {
  initiateSchoolLicensePaymentAction,
  verifyFapshiPaymentStatusAction,
} from "./actions";

interface Props {
  schoolName: string;
  schoolCode: string;
  subscription?: SchoolSubscriptionInfo;
}

const TIERS = [
  { id: "tier_1", name: "Tier 1: Up to 300 students", amount: 100000, label: "100,000 FCFA / year" },
  { id: "tier_2", name: "Tier 2: 301 to 750 students", amount: 200000, label: "200,000 FCFA / year", popular: true },
  { id: "tier_3", name: "Tier 3: 751 to 1,500 students", amount: 350000, label: "350,000 FCFA / year" },
  { id: "tier_4", name: "Tier 4: 1,501+ students", amount: 500000, label: "500,000 FCFA / year" },
];

export function SchoolBillingSubscription({
  schoolName,
  schoolCode,
  subscription,
}: Props) {
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Online Fapshi payment state
  const [selectedTier, setSelectedTier] = useState<string>("tier_2");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Automated & Manual verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    amount?: number;
  } | null>(null);
  const [manualTransId, setManualTransId] = useState("");
  const [showManualVerify, setShowManualVerify] = useState(false);

  const hasCheckedRef = useRef(false);

  const mtnNumber = "682833601";
  const mtnFormatted = "682 833 601";
  const mtnAccountName = "Nsei Sukul Technologies";

  // Dynamic subscription status reflecting immediate in-session verification
  const isLicenseActive =
    verificationResult?.success ||
    (!subscription?.isExpired && subscription?.status === "active");
  const isExpired = verificationResult?.success
    ? false
    : (subscription?.isExpired ?? false);
  const isTrial = verificationResult?.success
    ? false
    : (subscription?.isTrial ?? true);
  const daysRemaining = verificationResult?.success
    ? 365
    : (subscription?.daysRemaining ?? 30);

  // Auto-verify transaction upon return from Fapshi checkout
  useEffect(() => {
    if (typeof window === "undefined" || hasCheckedRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    let transId = urlParams.get("transId") || urlParams.get("transferId");

    // Check hash just in case Fapshi appended after #
    if (!transId && window.location.hash.includes("transId=")) {
      const match = window.location.hash.match(/transId=([^&]+)/);
      if (match) transId = match[1];
    }

    if (!transId) {
      try {
        transId = localStorage.getItem("nsei_pending_fapshi_transId");
      } catch (e) {
        // Local storage inaccessible
      }
    }

    if (transId) {
      hasCheckedRef.current = true;
      runVerification(transId, false);
    }
  }, []);

  const runVerification = async (transIdToVerify: string, isManual: boolean) => {
    const tid = transIdToVerify.trim();
    if (!tid) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const res = await verifyFapshiPaymentStatusAction(tid);

      if (res.success && res.status === "SUCCESSFUL") {
        try {
          localStorage.removeItem("nsei_pending_fapshi_transId");
        } catch (e) {}

        setVerificationResult({
          success: true,
          message: `Payment verified successfully! Your school license is now activated for 1 year (${res.plan || "standard"} tier).`,
          amount: res.amount,
        });

        // Clean query parameters from URL without reloading
        if (typeof window !== "undefined" && window.history?.replaceState) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } else if (res.status === "FAILED" || res.status === "EXPIRED") {
        try {
          localStorage.removeItem("nsei_pending_fapshi_transId");
        } catch (e) {}

        setVerificationResult({
          success: false,
          message: `Payment ${tid} was marked as ${res.status.toLowerCase()} by Mobile Money. If you were debited, please contact support with your SMS confirmation.`,
        });
      } else if (res.status === "PENDING" || res.status === "CREATED") {
        setVerificationResult({
          success: false,
          message: `Transaction ${tid} is still pending on the telecom network. Please authorize the prompt on your phone or check back shortly.`,
        });
      } else {
        setVerificationResult({
          success: false,
          message: res.error || `Could not verify transaction ${tid}. Please try again.`,
        });
      }
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: err?.message || "Failed to contact payment verification server.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOnlinePay = async () => {
    setIsPaying(true);
    setPaymentError(null);

    const tier = TIERS.find((t) => t.id === selectedTier) || TIERS[1];

    try {
      const res = await initiateSchoolLicensePaymentAction(tier.id, tier.amount);

      if (res.success && res.link) {
        if (res.transId) {
          try {
            localStorage.setItem("nsei_pending_fapshi_transId", res.transId);
            localStorage.setItem("nsei_pending_tier", tier.id);
          } catch (e) {}
        }
        window.location.href = res.link;
      } else {
        setPaymentError(res.error || "Unable to start Mobile Money payment. Please try again.");
        setIsPaying(false);
      }
    } catch (err: any) {
      setPaymentError(err?.message || "An unexpected error occurred.");
      setIsPaying(false);
    }
  };

  const copyMtn = () => {
    navigator.clipboard.writeText(mtnNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(schoolCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Nsei Sukul Billing, I have sent a subscription payment for ${schoolName} (Code: ${schoolCode}). Please activate our school license.`
  );
  const whatsappUrl = `https://wa.me/237682833601?text=${whatsappMessage}`;

  // Student Enrollment Capacity & Soft-Cap Buffer calculation
  const enrolledCount = subscription?.enrolledCount ?? 0;
  const maxStudents = subscription?.maxStudents ?? 300;
  const bufferLimit = subscription?.bufferLimit ?? 330;
  const tierName = subscription?.tierName ?? "Tier 1: Up to 300 students";
  const isOverTier = subscription?.isOverTier ?? (enrolledCount > maxStudents);
  const isInBuffer = subscription?.isInBuffer ?? (enrolledCount > maxStudents && enrolledCount <= bufferLimit);
  const capacityPercent = maxStudents > 0 ? Math.min(100, Math.round((enrolledCount / maxStudents) * 100)) : 0;

  const whatsappDiscussionMessage = encodeURIComponent(
    `Hello Nsei Sukul Team, our school ${schoolName} (Code: ${schoolCode}) currently has ${enrolledCount} enrolled students on ${tierName}. We would like to discuss our plan and options.`
  );
  const whatsappDiscussionUrl = `https://wa.me/237682833601?text=${whatsappDiscussionMessage}`;

  return (
    <div className="space-y-6">
      {/* Verification Feedback Banners */}
      {isVerifying && (
        <div className="p-4 rounded-[10px] bg-[#FFF8CF] border border-[#FBE6C2] flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 text-[#7A5B00] animate-spin shrink-0" />
          <div className="text-xs font-semibold text-[#7A5B00]">
            Checking Mobile Money transaction status with Fapshi... Please wait.
          </div>
        </div>
      )}

      {verificationResult?.success && (
        <div className="p-4 rounded-[10px] bg-[#EAF7E4] border-2 border-[#2A7C13] shadow-xs space-y-1.5 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#2A7C13] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#142010]">
                School License Activated Successfully!
              </h4>
              <p className="text-xs text-[#2A7C13] leading-relaxed">
                {verificationResult.message}
              </p>
              <div className="text-[11px] text-[#525E4B]">
                Official MINESEC report card generation, class rankings, and bulk PDF downloads are fully unlocked for your institution.
              </div>
            </div>
          </div>
        </div>
      )}

      {verificationResult && !verificationResult.success && (
        <div className="p-4 rounded-[10px] bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="font-bold text-[#142010]">Payment Status Notice</div>
              <p className="text-amber-800">{verificationResult.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 0. Student Capacity & Growth Soft-Cap Status ── */}
      <div className="p-5 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EFEA]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-[8px] border ${
              isOverTier
                ? "bg-[#FFF8CF] border-[#FBE6C2] text-[#7A5B00]"
                : "bg-[#EAF7E4] border-[#BBF7D0] text-[#2A7C13]"
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#142010]">
                  Student Enrollment &amp; Tier Capacity
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAFAF8] text-[#555555] border border-[#E5E5DF]">
                  {tierName}
                </span>
              </div>
              <p className="text-xs text-[#525E4B] mt-0.5">
                Tracks active student registrations against your annual institutional package
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-[#788470]">Enrolled Students:</span>
            <div className="text-base font-extrabold font-mono text-[#142010]">
              {enrolledCount} <span className="text-xs font-normal text-[#788470]">/ {maxStudents >= 99999 ? "Unlimited" : `${maxStudents} plan limit`}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar with 10% Grace Buffer Indicator */}
        {maxStudents < 99999 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#525E4B] font-medium">
                Capacity: <strong className="text-[#142010]">{capacityPercent}%</strong>
              </span>
              <span className="text-[11px] text-[#2A7C13] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Includes +10% Grace Buffer (up to {bufferLimit} students)</span>
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-[#EFEFEA] overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverTier
                    ? "bg-[#D97706]"
                    : capacityPercent >= 85
                    ? "bg-[#EAB308]"
                    : "bg-[#2A7C13]"
                }`}
                style={{ width: `${Math.min(100, (enrolledCount / bufferLimit) * 100)}%` }}
              />
            </div>

            <p className="text-[11px] text-[#788470]">
              Our soft-cap policy guarantees your school is never locked out or interrupted when adding new students.
            </p>
          </div>
        )}

        {/* Growth Banner: If School Reached or Exceeded Tier (e.g. 305 students) */}
        {isOverTier && (
          <div className="p-4 rounded-[8px] bg-[#FFFBEB] border border-[#FCD34D] space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#92400E]">
                  Congratulations on your school&apos;s growth!
                </h4>
                <p className="text-xs text-[#78350F] leading-relaxed">
                  Your school currently has <strong>{enrolledCount} enrolled students</strong>, which is slightly above your plan allowance ({maxStudents} students).
                  Don&apos;t worry: your platform remains <strong>100% operational</strong> with zero disruption to marks or report cards.
                </p>
              </div>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <a
                href={whatsappDiscussionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Discuss Plan on WhatsApp</span>
              </a>
              <span className="text-[11px] text-[#92400E]">
                We offer fair, prorated upgrades and custom allowances tailored to your school.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 1. License Overview Banner */}
      <div className="p-5 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EFEA]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-[8px] border ${isLicenseActive ? "bg-[#EAF7E4] border-[#BBF7D0] text-[#2A7C13]" : "bg-[#FFF8CF] border-[#FBE6C2] text-[#7A5B00]"}`}>
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#142010]">
                  School Software License
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${
                    isLicenseActive
                      ? "bg-[#EAF7E4] text-[#166534] border border-[#BBF7D0]"
                      : isExpired
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-[#FFF8CF] text-[#7A5B00] border border-[#FBE6C2]"
                  }`}
                >
                  {isLicenseActive ? "Active" : isExpired ? "Expired" : "Trial Active"}
                </span>
              </div>
              <p className="text-xs text-[#525E4B] mt-0.5">
                Annual institutional access to Nsei Sukul Academic Management Platform
              </p>
            </div>
          </div>

          <div className="text-right sm:text-right">
            <span className="text-xs text-[#788470]">Annual License:</span>
            <div className="text-sm font-bold text-[#142010]">
              From 100,000 FCFA / year
            </div>
          </div>
        </div>

        {/* Status Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-[8px] bg-[#FAFAF8] border border-[#E5E5DF]">
            <div className="text-[11px] font-medium text-[#788470]">
              Institution
            </div>
            <div className="text-sm font-bold text-[#142010] mt-0.5 truncate">
              {schoolName}
            </div>
            <div className="text-[10px] text-[#888888] mt-1">
              Registered Academic Center
            </div>
          </div>

          <div className="p-3.5 rounded-[8px] bg-[#FAFAF8] border border-[#E5E5DF]">
            <div className="text-[11px] font-medium text-[#788470]">
              School Reference Code
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-sm font-bold font-mono text-[#142010]">
                {schoolCode}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="text-[11px] text-[#2A7C13] hover:underline flex items-center gap-1 font-semibold"
              >
                {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <div className="text-[10px] text-[#888888] mt-1">
              Quote in payment reference
            </div>
          </div>

          <div className="p-3.5 rounded-[8px] bg-[#FAFAF8] border border-[#E5E5DF]">
            <div className="text-[11px] font-medium text-[#788470]">
              Status / Validity
            </div>
            <div className="text-sm font-bold text-[#142010] mt-0.5">
              {isLicenseActive ? `${daysRemaining} Days Active` : isExpired ? "Action Required" : `${daysRemaining} Days Active`}
            </div>
            <div className="text-[10px] text-[#888888] mt-1">
              {isLicenseActive
                ? "Full Annual License Active"
                : subscription?.trialEndsAt
                ? `Ends ${new Date(subscription.trialEndsAt).toLocaleDateString()}`
                : "Active for 2026/2027"}
            </div>
          </div>
        </div>

        {/* Expiry Warning Callout */}
        {isExpired && !isLicenseActive && (
          <div className="p-4 rounded-[8px] bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-700" />
              Your school&apos;s pilot trial has expired
            </p>
            <p className="leading-relaxed">
              Official MINESEC report card generation, class rankings, and bulk PDF downloads are currently paused. Please complete your license activation below to restore full administrative access.
            </p>
          </div>
        )}
      </div>

      {/* 2. Instant Online Payment (MTN MoMo & Orange Money via Fapshi) */}
      <div className="p-5 rounded-[10px] bg-white border-2 border-[#2A7C13] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAF7E4] text-[#166534] text-[11px] font-bold uppercase tracking-wider mb-1.5 border border-[#BBF7D0]">
              <Zap className="w-3.5 h-3.5 text-[#2A7C13]" />
              <span>Instant Activation via Mobile Money</span>
            </div>
            <h3 className="text-[15px] font-bold text-[#142010]">
              Pay Online with MTN MoMo or Orange Money
            </h3>
            <p className="text-xs text-[#525E4B] mt-0.5">
              Select your school size tier below. You will be redirected to complete payment with your PIN and your license activates automatically.
            </p>
          </div>
        </div>

        {paymentError && (
          <div className="p-3 rounded-[6px] bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{paymentError}</span>
          </div>
        )}

        {/* Tier Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {TIERS.map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedTier(tier.id)}
              disabled={isPaying}
              className={`p-3 rounded-[8px] text-left border transition-all cursor-pointer ${
                selectedTier === tier.id
                  ? "bg-[#EAF7E4] border-[#2A7C13] ring-1 ring-[#2A7C13]"
                  : "bg-[#FAFAF8] border-[#E5E5DF] hover:border-[#2A7C13]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#142010] block">
                  {tier.name}
                </span>
                {tier.popular && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#2A7C13] text-white">
                    Popular
                  </span>
                )}
              </div>
              <div className="text-base font-extrabold text-[#2A7C13] mt-1">
                {tier.label}
              </div>
            </button>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleOnlinePay}
            disabled={isPaying}
            className="w-full sm:w-auto px-6 py-2.5 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPaying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting to Mobile Money...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>
                  Pay {TIERS.find((t) => t.id === selectedTier)?.label} Online Now
                </span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </>
            )}
          </button>
          <span className="text-[11px] text-[#788470]">
            Secured by Fapshi &middot; Supports MTN Mobile Money &amp; Orange Money Cameroon
          </span>
        </div>

        {/* Manual Status Verification Tool */}
        <div className="pt-2 border-t border-[#F0EFEA] flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowManualVerify(!showManualVerify)}
            className="text-[11px] text-[#2A7C13] hover:underline font-semibold flex items-center gap-1.5 self-start cursor-pointer"
          >
            <span>Already completed MoMo transfer? Verify by Transaction ID</span>
          </button>

          {showManualVerify && (
            <div className="p-3.5 rounded-[8px] bg-[#FAFAF8] border border-[#E5E5DF] space-y-2.5 animate-in fade-in duration-200">
              <div className="text-xs font-semibold text-[#142010]">
                Enter Fapshi Transfer ID or MoMo Reference:
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. 1BYtZ8Un or Transfer ID"
                  value={manualTransId}
                  onChange={(e) => setManualTransId(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-[6px] border border-[#D5D5CD] bg-white text-[#142010] focus:outline-none focus:ring-1 focus:ring-[#2A7C13] font-mono"
                />
                <button
                  type="button"
                  onClick={() => runVerification(manualTransId, true)}
                  disabled={isVerifying || !manualTransId.trim()}
                  className="px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <span>Verify &amp; Activate</span>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#788470]">
                If your payment succeeded on checkout or via USSD prompt, entering the Transfer ID confirms it with Fapshi and activates your license immediately.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Manual Transfer Methods (Alternative) */}
      <div className="p-5 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-[#142010] flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#2A7C13]" />
            <span>Alternative: Direct Manual MoMo Transfer</span>
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">
            If you prefer to send money manually via USSD code (*126# or #150#) or direct bank transfer:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* MTN MoMo Card */}
          <div className="p-4 rounded-[8px] bg-[#FFFDF5] border-2 border-[#FBE6C2] space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-[4px] bg-[#FFCC00] text-black font-extrabold text-[11px] tracking-wide">
                MTN Mobile Money
              </span>
              <span className="text-[10px] text-[#7A5B00] font-bold uppercase">
                Instant Processing
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-[#788470]">MoMo Number:</div>
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-[6px] border border-[#E8DFC9]">
                <span className="font-mono font-bold text-sm text-[#142010]">
                  {mtnFormatted}
                </span>
                <button
                  type="button"
                  onClick={copyMtn}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-[#2A7C13] hover:bg-[#F0FDF4] rounded transition-colors"
                >
                  {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNumber ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="text-xs space-y-0.5 text-[#555555]">
              <div className="flex justify-between">
                <span>Account Name:</span>
                <strong className="text-[#142010]">{mtnAccountName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Payment Reference:</span>
                <strong className="font-mono text-[#2A7C13]">{schoolCode}</strong>
              </div>
            </div>
          </div>

          {/* Orange Money / Assistance Card */}
          <div className="p-4 rounded-[8px] bg-[#FAFAF8] border border-[#E5E5DF] space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-[4px] bg-[#FF6600] text-white font-extrabold text-[11px] tracking-wide">
                  Orange Money
                </span>
                <span className="text-[10px] text-[#888888] font-bold uppercase">
                  Upon Request
                </span>
              </div>
              <p className="text-xs text-[#666666] mt-2.5 leading-relaxed">
                Prefer paying with Orange Money or direct bank wire? Tap the WhatsApp button below to request the active Orange Money merchant code or bank coordinates.
              </p>
            </div>

            <div className="p-2.5 rounded-[6px] bg-[#FFF8CF] border border-[#FBE6C2] text-[11px] text-[#7A5B00]">
              <strong>Tip:</strong> Always include your School Code (<code>{schoolCode}</code>) in the transfer reason.
            </div>
          </div>
        </div>

        {/* WhatsApp Instant Activation Button */}
        <div className="pt-2 p-4 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-[#166534]">
              Confirm Payment &amp; Instant License Activation
            </div>
            <p className="text-[11px] text-[#166534]/80">
              After sending your Mobile Money transfer, send the transaction ID to our team on WhatsApp for immediate 5-minute activation.
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-xs transition-colors shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send Payment Proof on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* 4. Safe Data Retention & 90-Day Preservation Guarantee */}
      <div className="p-5 rounded-[10px] bg-[#FFFDF5] border border-[#E8DFC9] shadow-2xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[6px] bg-[#EBF5E9] text-[#1F5C0E] border border-[#C3E4BC]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#142010]">
              Zero Data Loss &amp; 90-Day Data Preservation Policy
            </h3>
            <p className="text-xs text-[#666666]">
              Your institution&apos;s records are protected even when a pilot or evaluation period expires.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#444444] leading-relaxed">
          If your school&apos;s 30-day evaluation concludes before you renew your license, <strong>your records are never automatically deleted</strong>. The platform automatically enters a safe <strong>90-Day Read-Only Grace Period</strong>:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-[6px] bg-white border border-[#E8DFC9]">
            <div className="font-bold text-xs text-[#142010]">1. 90-Day Retention Guarantee</div>
            <p className="text-[11px] text-[#666666] mt-1 leading-relaxed">
              All registered students, class streams, subjects, and historical marks remain safely preserved in the database for 90 days.
            </p>
          </div>

          <div className="p-3 rounded-[6px] bg-white border border-[#E8DFC9]">
            <div className="font-bold text-xs text-[#142010]">2. Never Start from Scratch</div>
            <p className="text-[11px] text-[#666666] mt-1 leading-relaxed">
              When you activate your annual license, your school picks up immediately right where you left off.
            </p>
          </div>

          <div className="p-3 rounded-[6px] bg-white border border-[#E8DFC9]">
            <div className="font-bold text-xs text-[#142010]">3. Complete Data Sovereignty</div>
            <p className="text-[11px] text-[#666666] mt-1 leading-relaxed">
              School administrators can export full offline backups of all students and marks at any time under Settings &gt; Data Sovereignty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
