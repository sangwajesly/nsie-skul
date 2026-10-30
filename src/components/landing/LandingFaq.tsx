"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Does our school need constant internet to use Nsei Sukul?",
    answer:
      "No! This is our biggest advantage over other platforms. With the Nsei Sukul Offline Sukul Hub, your school works completely independently of internet outages. Teachers enter marks and administrators print MINESEC report cards over the school's local Wi-Fi router even when MTN or Orange internet is totally down.",
  },
  {
    question: "Can our school use our existing computers or buy equipment ourselves?",
    answer:
      "Yes, absolutely! You do not need to buy expensive servers from us. You can install the Sukul Hub on any standard desktop or laptop already in your Principal's or Bursar's office in under 5 minutes for 0 FCFA extra hardware cost. If you prefer to buy a dedicated machine, you can purchase an affordable Mini-PC or refurbished laptop from local computer shops in Cameroon (Douala, Yaoundé, Bamenda) for around 110,000 to 150,000 FCFA. Our setup guide gives you the exact shopping checklist and everyday steps.",
  },
  {
    question: "How do teachers enter marks if they are at home without internet?",
    answer:
      "Teachers can open their mark sheet on their smartphone, tablet, or laptop while at home. The system saves their entries offline in their phone's local storage. The moment they arrive on campus and connect to the school Wi-Fi router, their phone automatically synchronizes with the school database without consuming any data bundles.",
  },
  {
    question: "Are report cards compliant with official MINESEC standards?",
    answer:
      "Yes. The system is custom-built for Cameroon secondary education. It supports 6 Sequences across 3 Terms, automatic 20-point weighting (Mark × Coef), class averages, highest/lowest marks, class rankings, and teacher/principal remarks. Report cards are formatted to print cleanly on a single A4 sheet without spilling onto a second page.",
  },
  {
    question: "Can we import our existing student lists from Excel?",
    answer:
      "Yes! You don't have to re-type hundreds of student names. Nsei Sukul has a 1-click Excel/CSV bulk import tool that parses student family names, given names, matricules, gender, and class streams automatically.",
  },
  {
    question: "How does the Bursary module handle school fees and receipts in FCFA?",
    answer:
      "The Bursary module handles custom installment structures (Registration, Tranche 1, Tranche 2, PTA fees, etc.) in FCFA (XAF). It issues verifiable printable receipt slips with sequential receipt numbers, school stamp areas, and allows administrators to generate instant debtor lists before sequence examinations.",
  },
  {
    question: "Is our school data private and compliant with Cameroonian law?",
    answer:
      "Yes. Nsei Sukul is fully aligned with Cameroon's Law No. 2024/017 on Personal Data Protection and ANTIC cybersecurity guidelines. Each school operates in an isolated tenant with PostgreSQL Row-Level Security, student photos and birth details are optional, and your records are never monetized or shared with third parties.",
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {FAQ_ITEMS.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={item.question}
            className="rounded-[10px] border border-[#E8DFC9] bg-white transition-all overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between gap-4 p-5 text-left font-bold text-[15px] text-[#142010] hover:text-[#2A7C13] transition-colors"
              aria-expanded={isOpen}
            >
              <span className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-[#2A7C13] shrink-0" />
                <span>{item.question}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#788470] shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-[#2A7C13]" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 pt-1 text-[13.5px] text-[#525E4B] leading-relaxed border-t border-[#E8DFC9]/60 bg-[#FFFDF5]">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
