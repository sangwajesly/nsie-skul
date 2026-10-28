"use client";

import { useState } from "react";
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
} from "lucide-react";

interface Props {
  schoolName: string;
  schoolCode: string;
  subscription?: SchoolSubscriptionInfo;
}

export function SchoolBillingSubscription({
  schoolName,
  schoolCode,
  subscription,
}: Props) {
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const mtnNumber = "682833601";
  const mtnFormatted = "682 833 601";
  const mtnAccountName = "Mbongih Jesly Sangwa";

  const isExpired = subscription?.isExpired ?? false;
  const isTrial = subscription?.isTrial ?? true;
  const daysRemaining = subscription?.daysRemaining ?? 30;
  const status = subscription?.status ?? "trial";

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
    `Hello Nsei Skul Billing, I have sent a subscription payment for ${schoolName} (Code: ${schoolCode}). Please activate our school license.`
  );
  const whatsappUrl = `https://wa.me/237682833601?text=${whatsappMessage}`;

  return (
    <div className="space-y-6">
      {/* 1. License Overview Banner */}
      <div className="p-5 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EFEA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-[#142010] text-[#4ADE80] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#142010]">
                School License &amp; Billing
              </h2>
              <p className="text-xs text-[#666666]">
                Manage your school&apos;s subscription, access tiers, and local payment verification.
              </p>
            </div>
          </div>

          <div>
            {status === "active" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active School License</span>
              </span>
            )}
            {status === "trial" && !isExpired && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FFF8CF] text-[#7A5B00] border border-[#FBE6C2]">
                <Clock className="w-3.5 h-3.5" />
                <span>30-Day Pilot Trial · {daysRemaining} days left</span>
              </span>
            )}
            {isExpired && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>License Expired</span>
              </span>
            )}
          </div>
        </div>

        {/* License Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-[8px] bg-[#FAFAF8] border border-[#E5E5DF]">
            <div className="text-[11px] font-medium text-[#788470]">
              License Tier
            </div>
            <div className="text-sm font-bold text-[#142010] mt-0.5 capitalize">
              {subscription?.plan || "Pilot / Trial"}
            </div>
            <div className="text-[10px] text-[#888888] mt-1">
              {status === "active" ? "Full Academic Year" : "Evaluation Period"}
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
              {isExpired ? "Action Required" : `${daysRemaining} Days Active`}
            </div>
            <div className="text-[10px] text-[#888888] mt-1">
              {subscription?.trialEndsAt
                ? `Ends ${new Date(subscription.trialEndsAt).toLocaleDateString()}`
                : "Active for 2026/2027"}
            </div>
          </div>
        </div>

        {/* Expiry Warning Callout */}
        {isExpired && (
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

      {/* 2. Local Payment Methods (Cameroon) */}
      <div className="p-5 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs space-y-5">
        <div>
          <h3 className="text-sm font-bold text-[#142010] flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#2A7C13]" />
            <span>Local Payment Channels (Cameroon)</span>
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">
            To activate or renew your school license, send payment via MTN Mobile Money. Orange Money is also available on request.
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
    </div>
  );
}
