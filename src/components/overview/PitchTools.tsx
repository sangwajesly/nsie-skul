"use client";

import { useState } from "react";
import { Copy, Check, MessageSquare, Share2, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PitchToolsProps {
  demoUrl?: string;
  whatsappUrl?: string;
}

export function PitchCopyCard({
  demoUrl = "https://nsei-sukul.klarifypath.com/demo",
  whatsappUrl = "https://wa.me/237682833601",
}: PitchToolsProps) {
  const [copied, setCopied] = useState(false);

  const pitchText = `Good morning Sir/Madam Principal.

I was reviewing Nsei Sukul, an all-in-one school software built specifically for secondary and high schools here in Cameroon.

Here is what our school gets right out of the box:
1. It calculates all 6 MINESEC sequences, subject coefficients, averages, and class ranks automatically.
2. Every student report card strictly fits on 1 single page of A4 paper, saving us huge printing costs.
3. It generates printable student ID cards with barcodes, official transcripts, and Tableau d'Honneur certificates for speech days.
4. It creates conflict-free master timetables and official class lists in minutes.
5. It works completely offline on our school Wi-Fi or LAN cable when internet is down in town.
6. It tracks school fees, Mobile Money payments, and prints official receipt slips in seconds.

They offer a 30-day free trial with no upfront payment, and we can test the live demo right now on any phone or laptop:
${demoUrl}

Could we test it for our school this term?`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pitchText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback if clipboard API is restricted
      const textArea = document.createElement("textarea");
      textArea.value = pitchText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(pitchText)}`;

  return (
    <div className="bg-[#FFFDF5] rounded-xl border-2 border-[#2A7C13]/30 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DFC9]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#142010]">
              Ready-to-Use WhatsApp Note for Your Principal
            </h3>
            <p className="text-xs text-[#525E4B]">
              Copy and send this directly to your Principal, Vice Principal, or school group.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
              copied
                ? "bg-[#2A7C13] text-white"
                : "bg-white hover:bg-[#F3EED9] text-[#142010] border border-[#D8CDB2]"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#525E4B]" />
                <span>Copy Message</span>
              </>
            )}
          </button>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </a>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-lg border border-[#E8DFC9] p-4 text-[13px] text-[#2D3827] font-mono leading-relaxed whitespace-pre-line select-all">
        {pitchText}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#525E4B] pt-2">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#2A7C13]" />
          <span>Tip: You can also invite our team to join your staff meeting virtually or in person.</span>
        </span>
        <a
          href={`${whatsappUrl}?text=Hello%20Nsei%20Sukul%20team,%20I%20am%20a%20teacher%20and%20would%20like%20guidance%20on%20introducing%20the%20platform%20to%20my%20school.`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#2A7C13] font-bold hover:underline inline-flex items-center gap-1"
        >
          <span>Chat with our team for advice</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
