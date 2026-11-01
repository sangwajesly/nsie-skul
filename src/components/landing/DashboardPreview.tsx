"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  FileSpreadsheet,
  Contact,
  Award,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  ArrowRight,
  Maximize2,
  X,
  Play,
  Pause,
} from "lucide-react";

interface ShowcaseSlide {
  id: string;
  tabLabel: string;
  tabIcon: typeof LayoutDashboard;
  badge: string;
  headline: string;
  description: string;
  image: string;
  features: string[];
  docUrl: string;
  docLabel: string;
}

const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: "overview",
    tabLabel: "School Overview",
    tabIcon: LayoutDashboard,
    badge: "Operations Command Center",
    headline: "Unified School Operations & Real-Time Academic Rollup",
    description:
      "Instant administrative command center. Monitor school-wide rollups, term attendance, top-performing subjects, fee collections, and staff submission progress across all class streams from a single screen.",
    image: "/screenshots/desktop-overview.png",
    features: [
      "Offline Hub LAN & Cloud Synchronization",
      "Term Attendance & Disciplinary Rollup",
      "Real-Time Class Stream Enrollment Counts",
    ],
    docUrl: "/features/school-hub",
    docLabel: "Explore School Hub",
  },
  {
    id: "marks",
    tabLabel: "Marks Entry",
    tabIcon: ClipboardList,
    badge: "Academics & Evaluation",
    headline: "Rapid Sequence Marks Entry & Desk Recording",
    description:
      "Engineered for fast keyboard entry without network lag. Teachers and administration desk staff can enter scores on the Cameroon 20-point scale, record CBA competencies, and lock sequence sheets in seconds.",
    image: "/screenshots/desktop-marks.png",
    features: [
      "Desk Entry for Unregistered Teachers",
      "6 Official Evaluation Sequences",
      "Instant 20-Point Scale & Coef Weighting",
    ],
    docUrl: "/dashboard/academics/marks",
    docLabel: "Learn About Mark Entry",
  },
  {
    id: "reportcard",
    tabLabel: "Report Cards",
    tabIcon: FileSpreadsheet,
    badge: "Official Certification",
    headline: "Official Term Report Cards Generated in Seconds",
    description:
      "Eliminate end-of-term calculation mistakes and stressful manual compilation. Automatically calculate weighted averages, class rank, min and max scores, and council conduct summaries ready for instant batch printing.",
    image: "/screenshots/desktop-reportcard.png",
    features: [
      "Grouped Subject Hierarchy (Arts, Science, Tech)",
      "Single-Click Class Batch PDF Generation",
      "Smart Document Naming per Class Stream",
    ],
    docUrl: "/features/report-cards",
    docLabel: "View Report Card Details",
  },
  {
    id: "school-id",
    tabLabel: "School ID Cards",
    tabIcon: Contact,
    badge: "Identity & Security",
    headline: "Automatic & Customizable School ID Cards",
    description:
      "Generate official, laminated student identification cards in seconds. Choose between 3 distinct templates, customize with school colors, include photo dossiers and QR verification, and export by class group in one click.",
    image: "/screenshots/desktop-school-id.png",
    features: [
      "3 Clean Templates (Classic, Modern, Compact)",
      "Front-Only or Duplex Printing Layouts",
      "Instant QR Code Verification for Phones",
    ],
    docUrl: "/dashboard/students",
    docLabel: "Explore Student Dossiers",
  },
  {
    id: "honor-roll",
    tabLabel: "Honor Roll",
    tabIcon: Award,
    badge: "Student Distinction",
    headline: "Automatic & Customizable Honor Roll Certificates",
    description:
      "Celebrate student academic excellence at term end. The system automatically detects class laureates and subject top scorers, generating framed distinction certificates with school branding and official seals.",
    image: "/screenshots/desktop-honor-roll.png",
    features: [
      "Subject Excellence Distinction Awards",
      "Class Honor Roll Laureate Certificates",
      "Automatic Term Assembly Honor Roster",
    ],
    docUrl: "/dashboard/academics",
    docLabel: "Learn About Honor Roll",
  },
];

export function DashboardPreview() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeSlide = SHOWCASE_SLIDES[currentIndex];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SHOWCASE_SLIDES.length) % SHOWCASE_SLIDES.length);
  }, []);

  // Auto-rotation timer (pauses on user hover or manual toggle)
  useEffect(() => {
    if (isPaused || isZoomed) return;
    timerRef.current = setInterval(() => {
      handleNext();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isZoomed, handleNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isZoomed && e.key === "Escape") {
        setIsZoomed(false);
        return;
      }
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomed, handleNext, handlePrev]);

  return (
    <div
      className="w-full space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Segmented Tab Selector ────────────────────────────────────────── */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-1 pt-1 scrollbar-none">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs">
          {SHOWCASE_SLIDES.map((slide, idx) => {
            const Icon = slide.tabIcon;
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-[7px] text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#142010] text-white shadow-xs"
                    : "text-[#525E4B] hover:text-[#142010] hover:bg-[#FFFDF5]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#76C457]" : "text-[#788470]"}`} />
                <span>{slide.tabLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Showcase Window Frame ────────────────────────────────────── */}
      <div className="relative w-full rounded-[14px] border border-[#E8DFC9] bg-white shadow-[0_16px_50px_rgba(20,32,16,0.08)] overflow-hidden">
        {/* Window Chrome Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8DFC9] bg-[#FFF8CF]/30">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/40" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/40" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/40" />
            <div className="hidden sm:inline-flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-[5px] bg-white/80 border border-[#E8DFC9] text-[11px] text-[#525E4B] font-mono">
              <Lock className="w-3 h-3 text-[#2A7C13]" />
              <span>nsei-sukul.klarifypath.com/dashboard/{activeSlide.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10.5px] font-semibold text-[#525E4B] hidden sm:inline">
              Slide {currentIndex + 1} of {SHOWCASE_SLIDES.length}
            </span>

            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 rounded text-[#788470] hover:text-[#142010] hover:bg-[#F0EEE6] transition-colors"
              title={isPaused ? "Resume auto-rotation" : "Pause auto-rotation"}
              aria-label={isPaused ? "Resume auto-rotation" : "Pause auto-rotation"}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-white border border-[#E8DFC9] text-[11px] font-semibold text-[#142010] hover:bg-[#FFFDF5] transition-colors"
              title="View full resolution"
            >
              <Maximize2 className="w-3 h-3 text-[#2A7C13]" />
              <span className="hidden xs:inline">Zoom</span>
            </button>
          </div>
        </div>

        {/* Screenshot Viewport Container */}
        <div className="relative bg-[#FAFAF8] aspect-[1713/1100] sm:aspect-[1713/1000] overflow-hidden group">
          <img
            key={activeSlide.id}
            src={activeSlide.image}
            alt={activeSlide.headline}
            className="w-full h-full object-cover object-top transition-opacity duration-300"
            loading="eager"
          />

          {/* Previous Slide Button */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-[#142010] border border-[#E8DFC9] shadow-md flex items-center justify-center hover:bg-[#142010] hover:text-white transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Next Slide Button */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-[#142010] border border-[#E8DFC9] shadow-md flex items-center justify-center hover:bg-[#142010] hover:text-white transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Next screenshot"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* ── Cohesive Story & Marketing Details Panel ─────────────────────── */}
        <div className="p-5 sm:p-6 bg-[#FFFDF5] border-t border-[#E8DFC9]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left 8 cols: Story & Highlights */}
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40 text-[11px] font-bold tracking-wide uppercase">
                <span>{activeSlide.badge}</span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#142010]">
                {activeSlide.headline}
              </h2>

              <p className="text-xs sm:text-[13px] text-[#525E4B] leading-relaxed">
                {activeSlide.description}
              </p>

              {/* 3 Key Capability Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {activeSlide.features.map((feat, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-white border border-[#E8DFC9] text-[11px] font-semibold text-[#142010]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2A7C13] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 4 cols: Step indicators & Jump CTA */}
            <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-between gap-4 border-t lg:border-t-0 lg:border-l border-[#E8DFC9] pt-4 lg:pt-0 lg:pl-6">
              <div className="flex items-center gap-1.5">
                {SHOWCASE_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentIndex
                        ? "w-8 bg-[#2A7C13]"
                        : "w-2 bg-[#D5D5CF] hover:bg-[#788470]"
                    }`}
                    aria-label={`Jump to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <Link
                href={activeSlide.docUrl}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[7px] bg-[#142010] hover:bg-[#2A7C13] text-white text-xs font-bold shadow-xs transition-colors"
              >
                <span>{activeSlide.docLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fullscreen Zoom Lightbox Modal ─────────────────────────────────── */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-6xl w-full max-h-[92vh] flex flex-col bg-white rounded-[12px] border border-[#333333] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8DFC9] bg-[#FFFDF5]">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-[#142010]">
                  {activeSlide.headline}
                </span>
                <span className="text-xs text-[#788470]">
                  (Slide {currentIndex + 1} of {SHOWCASE_SLIDES.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="w-8 h-8 rounded-full border border-[#E8DFC9] bg-white text-[#525E4B] hover:text-[#142010] hover:bg-[#F0EEE6] flex items-center justify-center transition-colors"
                aria-label="Close zoomed preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 overflow-auto p-2 bg-[#1A1A1A] flex items-center justify-center">
              <img
                src={activeSlide.image}
                alt={activeSlide.headline}
                className="max-w-full max-h-[80vh] object-contain rounded-[6px]"
              />
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#E8DFC9] bg-white text-xs">
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] text-[#142010] hover:bg-[#FFFDF5] font-semibold transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Screenshot</span>
              </button>

              <span className="text-[#788470] font-medium hidden sm:inline">
                Press Esc or click Close to return
              </span>

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] text-[#142010] hover:bg-[#FFFDF5] font-semibold transition-colors"
              >
                <span>Next Screenshot</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
