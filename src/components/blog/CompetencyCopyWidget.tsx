"use client";

import { useState } from "react";
import { Check, Copy, Sparkles, BookOpen, Layers } from "lucide-react";

interface SubjectCompetencyMap {
  subject: string;
  category: "Sciences" | "Languages & Arts" | "Humanities & Commercial";
  tiers: {
    expert: string;
    acquired: string;
    inProgress: string;
    notAcquired: string;
  };
}

const COMPETENCY_DATABASE: SubjectCompetencyMap[] = [
  {
    subject: "Mathematics",
    category: "Sciences",
    tiers: {
      expert: "Exceptional analytical rigor; solves multi-step geometric theorems and algebraic modeling with flawless proofs.",
      acquired: "Good problem-solving ability; consistently carries out standard algebraic reductions and calculations correctly.",
      inProgress: "Understands direct formulas but hesitates when faced with word problems requiring multi-step formulation.",
      notAcquired: "Basic arithmetic and algebraic prerequisites are missing. Immediate supervised tutorial support is mandatory.",
    },
  },
  {
    subject: "Physics",
    category: "Sciences",
    tiers: {
      expert: "Expert grasp of mechanics and electric circuit analysis; applies dimensional formulas accurately to everyday situations.",
      acquired: "Successfully applies standard physical laws; needs closer attention to SI unit conversions in numerical answers.",
      inProgress: "Recalls physical definitions well; practice required on graphical interpretations and laboratory measurements.",
      notAcquired: "Struggles to apply fundamental physical principles; consistent neglect of homework drills observed.",
    },
  },
  {
    subject: "Chemistry",
    category: "Sciences",
    tiers: {
      expert: "Flawless balancing of redox equations and stoichiometry; demonstrates deep understanding of industrial chemical processes.",
      acquired: "Competently executes volumetric calculations; practice drawing accurate laboratory apparatus setups.",
      inProgress: "Memorizes chemical terminology but makes frequent errors calculating molar masses and gas volumes.",
      notAcquired: "Basic chemical bonding and periodic table foundations not acquired; remedial tutoring required.",
    },
  },
  {
    subject: "Biology / Life Sciences",
    category: "Sciences",
    tiers: {
      expert: "Masterfully relates cell structures to human pathology; structures scientific deductions with outstanding clarity.",
      acquired: "Good recall of biological cycles and anatomical diagrams; elaborate further on ecological implications.",
      inProgress: "Identifies basic organs but struggles to explain physiological mechanisms and genetic crosses.",
      notAcquired: "Cannot label fundamental biological diagrams; urgent parent conference and study supervision advised.",
    },
  },
  {
    subject: "English Language",
    category: "Languages & Arts",
    tiers: {
      expert: "Mature linguistic command; produces engaging, error-free narrative and argumentative essays with sophisticated vocabulary.",
      acquired: "Clear syntactic structure and logical paragraphing; minor grammatical slips in complex compound sentences.",
      inProgress: "Communicates basic ideas, but frequent tense errors and restricted vocabulary weaken essay quality.",
      notAcquired: "Severe orthographic and grammatical errors obscure communication. Regular guided reading required.",
    },
  },
  {
    subject: "Literature in English",
    category: "Languages & Arts",
    tiers: {
      expert: "In-depth thematic and character critique; skillfully dissects dramatic techniques and poetic imagery with strong textual citations.",
      acquired: "Competent understanding of set books; elaborate more on authorial intentions rather than plot summaries.",
      inProgress: "Familiar with storyline events but struggles to analyze literary themes, irony, or stylistic devices.",
      notAcquired: "Has not read the designated prescribed texts; unable to answer context-based examination questions.",
    },
  },
  {
    subject: "Français (Anglophone Subsystem)",
    category: "Languages & Arts",
    tiers: {
      expert: "Expression écrite et orale très fluide; conjugaison et concordance des temps parfaitement maîtrisées.",
      acquired: "Bonne compréhension des textes; enrichir le vocabulaire usuel et soigner les accords en genre et en nombre.",
      inProgress: "Compréhension globale satisfaisante mais de nombreuses fautes d'orthographe et de grammaire à l'écrit.",
      notAcquired: "Difficultés majeures d'expression écrite; acquisition des bases grammaticales indispensable.",
    },
  },
  {
    subject: "History",
    category: "Humanities & Commercial",
    tiers: {
      expert: "Brilliant historical synthesis; contextualizes Cameroon national integration and world history with sharp objectivity.",
      acquired: "Demonstrates good chronological mastery of Cameroon's colonial transitions; substantiates arguments with dates.",
      inProgress: "Recalls prominent historical dates but lacks depth when explaining underlying political causes.",
      notAcquired: "Lacks basic historical milestones; unable to structure coherent historical answers.",
    },
  },
  {
    subject: "Geography",
    category: "Humanities & Commercial",
    tiers: {
      expert: "Outstanding cartographic accuracy; interprets topographical contours and climatic anomalies with sharp analytical precision.",
      acquired: "Good knowledge of Cameroon geography and human settlements; ensure maps include complete keys and scales.",
      inProgress: "Identifies general relief features but struggles with contour calculations and map coordinates.",
      notAcquired: "Cannot read standard topographical maps; continuous class disengagement noted.",
    },
  },
  {
    subject: "Economics & Commerce",
    category: "Humanities & Commercial",
    tiers: {
      expert: "Flawless commercial acumen; models market equilibrium and fiscal policies with mature economic reasoning.",
      acquired: "Good grasp of market dynamics and banking instruments; practice graphical shifts in supply and demand.",
      inProgress: "Recalls demand-supply laws but struggles to interpret price elasticity calculations accurately.",
      notAcquired: "Fundamental commercial concepts not mastered; regular assignments missed.",
    },
  },
];

export function CompetencyCopyWidget() {
  const [selectedSubject, setSelectedSubject] = useState(COMPETENCY_DATABASE[0].subject);
  const [selectedTier, setSelectedTier] = useState<"expert" | "acquired" | "inProgress" | "notAcquired">("acquired");
  const [copied, setCopied] = useState(false);

  const currentEntry = COMPETENCY_DATABASE.find((s) => s.subject === selectedSubject) || COMPETENCY_DATABASE[0];
  const appreciationText = currentEntry.tiers[selectedTier];

  const handleCopy = () => {
    navigator.clipboard.writeText(appreciationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-8 p-5 sm:p-6 rounded-[12px] bg-gradient-to-br from-[#142010] via-[#1b2d16] to-[#142010] text-white shadow-xl border border-[#2A7C13]/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/15">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[7px] bg-[#2A7C13] text-[#4ADE80] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Interactive CBA Competency Finder</h3>
            <p className="text-[11px] text-[#A3B899]">
              Pick your subject and student score tier to copy official MINESEC appreciations:
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-[#4ADE80] border border-white/20 self-start sm:self-auto">
          MINESEC Compliant
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
        {/* Subject Selector */}
        <div>
          <label htmlFor="widget-subject-select" className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
            Teaching Subject
          </label>
          <select
            id="widget-subject-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 rounded-[6px] bg-white/10 border border-white/20 text-white text-xs font-medium focus:outline-none focus:border-[#4ADE80] cursor-pointer"
          >
            {COMPETENCY_DATABASE.map((s) => (
              <option key={s.subject} value={s.subject} className="bg-[#142010] text-white">
                {s.subject} ({s.category})
              </option>
            ))}
          </select>
        </div>

        {/* Tier Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
            Student Score Bracket
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedTier("expert")}
              className={`px-2 py-1.5 rounded-[5px] text-[11px] font-bold border transition-all text-center ${
                selectedTier === "expert"
                  ? "bg-[#22C55E]/30 text-[#4ADE80] border-[#4ADE80]"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
              }`}
            >
              15 - 20 (Expert)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier("acquired")}
              className={`px-2 py-1.5 rounded-[5px] text-[11px] font-bold border transition-all text-center ${
                selectedTier === "acquired"
                  ? "bg-[#2A7C13] text-white border-[#4ADE80]"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
              }`}
            >
              12 - 14.9 (Acquis)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier("inProgress")}
              className={`px-2 py-1.5 rounded-[5px] text-[11px] font-bold border transition-all text-center ${
                selectedTier === "inProgress"
                  ? "bg-[#F59E0B]/30 text-[#FCD34D] border-[#F59E0B]"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
              }`}
            >
              10 - 11.9 (En cours)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier("notAcquired")}
              className={`px-2 py-1.5 rounded-[5px] text-[11px] font-bold border transition-all text-center ${
                selectedTier === "notAcquired"
                  ? "bg-[#EF4444]/30 text-[#FCA5A5] border-[#EF4444]"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
              }`}
            >
              0 - 9.9 (Non acquis)
            </button>
          </div>
        </div>
      </div>

      {/* Generated Output Preview Box */}
      <div className="mt-4 p-4 rounded-[8px] bg-black/40 border border-white/15 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#4ADE80] uppercase tracking-wider font-bold">
            Approved MINESEC Report Card Remark:
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-all shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied to Clipboard!" : "Copy Remark"}</span>
          </button>
        </div>
        <p className="text-xs sm:text-sm text-white font-medium leading-relaxed italic">
          &ldquo;{appreciationText}&rdquo;
        </p>
      </div>

      <div className="mt-3 text-[11px] text-[#A3B899] flex items-center justify-between flex-wrap gap-2">
        <span>💡 In Nsei Sukul, these remarks are populated automatically based on marks entered.</span>
      </div>
    </div>
  );
}
