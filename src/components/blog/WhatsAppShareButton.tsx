"use client";

import { MessageCircle, Check, Copy } from "lucide-react";
import { useState } from "react";

interface Props {
  title: string;
  shareText?: string;
  url?: string;
  className?: string;
  variant?: "pill" | "banner" | "floating";
}

export function WhatsAppShareButton({
  title,
  shareText,
  url,
  className = "",
  variant = "pill",
}: Props) {
  const [copied, setCopied] = useState(false);

  const getFullUrl = () => {
    if (typeof window !== "undefined") {
      return url || window.location.href;
    }
    return url || "https://nsei-sukul.klarifypath.com/blog";
  };

  const handleWhatsAppShare = () => {
    const finalUrl = getFullUrl();
    const message = encodeURIComponent(
      `${shareText || `📚 *MINESEC Guide for Cameroon Teachers:* ${title}`}\n\n👉 Read the full guide here: ${finalUrl}`
    );
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(getFullUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (variant === "banner") {
    return (
      <div className={`p-4 sm:p-5 rounded-[10px] bg-gradient-to-r from-[#F0FDF4] via-[#F7FCF5] to-[#FFFDF5] border border-[#BBF7D0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
            <MessageCircle className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#142010]">
              Share this guide with your teachers&apos; WhatsApp group
            </h4>
            <p className="text-xs text-[#525E4B] mt-0.5 leading-relaxed">
              Help your colleagues and Class Masters save hours on report cards and inspections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-white hover:bg-[#FAF6EC] text-[#142010] text-xs font-semibold border border-[#D5CBB2] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#2A7C13]" /> : <Copy className="w-3.5 h-3.5 text-[#555555]" />}
            <span>{copied ? "Link Copied!" : "Copy Link"}</span>
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Share on WhatsApp</span>
          </button>
        </div>
      </div>
    );
  }

  if (variant === "floating") {
    return (
      <div className="fixed bottom-5 right-5 z-40 sm:hidden">
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] text-white font-bold text-xs shadow-xl active:scale-95 transition-transform"
          aria-label="Share guide on WhatsApp"
        >
          <MessageCircle className="w-4 h-4 fill-current" />
          <span>Share to Teachers Group</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleWhatsAppShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold shadow-2xs transition-colors shrink-0"
      >
        <MessageCircle className="w-3.5 h-3.5 fill-current" />
        <span>Share on WhatsApp</span>
      </button>

      <button
        type="button"
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] bg-white hover:bg-[#F9F6ED] text-[#444444] text-xs font-medium border border-[#D5CBB2] transition-colors"
        title="Copy article link"
      >
        {copied ? <Check className="w-3 h-3 text-[#2A7C13]" /> : <Copy className="w-3 h-3" />}
        <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}
