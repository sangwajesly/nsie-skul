"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  MessageCircle,
  Menu,
  X,
  ChevronDown,
  WifiOff,
  FileSpreadsheet,
  Wallet,
  ArrowRight,
  BookOpen,
  LayoutDashboard,
} from "lucide-react";
import { BRAND } from "@/lib/design-tokens";
import { createClient } from "@/lib/supabase/client";

const BTN_PRIMARY =
  "inline-flex items-center justify-center px-4 py-2 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-[13px] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A7C13] focus-visible:ring-offset-2";

export function MarketingHeader({ currentPath = "/" }: { currentPath?: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setIsAuthenticated(Boolean(data?.user));
      }).catch(() => {
        setIsAuthenticated(false);
      });
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  // Prevent background body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF5]/95 backdrop-blur-md border-b border-[#E8DFC9]">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-[7px] bg-[#2A7C13] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform" aria-hidden="true">
            <GraduationCap className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[16px] tracking-tight text-[#142010] leading-none">
              {BRAND.name}
            </span>
            <span className="text-[10px] font-semibold text-[#788470] tracking-wide uppercase mt-0.5">
              {BRAND.systemTitle}
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-[#525E4B]" aria-label="Main navigation">
          {/* Features Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setFeaturesDropdownOpen(true)}
            onMouseLeave={() => setFeaturesDropdownOpen(false)}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 py-2 hover:text-[#142010] transition-colors focus:outline-none ${
                currentPath.startsWith("/features") ? "text-[#2A7C13] font-semibold" : ""
              }`}
              onClick={() => setFeaturesDropdownOpen(!featuresDropdownOpen)}
              aria-expanded={featuresDropdownOpen}
            >
              <span>Features</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${featuresDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {featuresDropdownOpen && (
              <div className="absolute top-full -left-4 w-72 pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="rounded-[10px] bg-white border border-[#E8DFC9] shadow-lg p-2 space-y-1">
                  <Link
                    href="/features/school-hub"
                    className="flex items-start gap-3 p-2.5 rounded-[7px] hover:bg-[#FFFDF5] hover:border-[#E8DFC9] border border-transparent transition-all group"
                  >
                    <div className="w-8 h-8 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#2A7C13] group-hover:text-white transition-colors">
                      <WifiOff className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#142010] flex items-center gap-1.5">
                        <span>Offline School Hub</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FFF8CF] text-[#4A3D00]">LAN Sync</span>
                      </div>
                      <p className="text-[11px] text-[#788470] mt-0.5 leading-snug">
                        Zero-internet local network server for marks & records.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/features/report-cards"
                    className="flex items-start gap-3 p-2.5 rounded-[7px] hover:bg-[#FFFDF5] hover:border-[#E8DFC9] border border-transparent transition-all group"
                  >
                    <div className="w-8 h-8 rounded-[6px] bg-[#FFF8CF] text-[#4A3D00] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#2A7C13] group-hover:text-white transition-colors">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#142010]">
                        MINESEC Report Cards
                      </div>
                      <p className="text-[11px] text-[#788470] mt-0.5 leading-snug">
                        6 Sequences, coefficients, auto-ranks & 1-page prints.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/features/finance"
                    className="flex items-start gap-3 p-2.5 rounded-[7px] hover:bg-[#FFFDF5] hover:border-[#E8DFC9] border border-transparent transition-all group"
                  >
                    <div className="w-8 h-8 rounded-[6px] bg-[#FBE6C2] text-[#422C0A] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#2A7C13] group-hover:text-white transition-colors">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-[#142010]">
                        Bursary & Fee Management
                      </div>
                      <p className="text-[11px] text-[#788470] mt-0.5 leading-snug">
                        FCFA installments, printable receipt slips & debtors.
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link 
            href="/#capabilities" 
            className="hover:text-[#142010] transition-colors"
          >
            Capabilities
          </Link>

          <Link 
            href="/blog" 
            className={`hover:text-[#142010] transition-colors ${
              currentPath.startsWith("/blog") ? "text-[#2A7C13] font-semibold" : ""
            }`}
          >
            Guides &amp; Pedagogy
          </Link>

          <Link 
            href="/#how-it-works" 
            className="hover:text-[#142010] transition-colors"
          >
            How It Works
          </Link>

          <Link 
            href="/#faq" 
            className="hover:text-[#142010] transition-colors"
          >
            FAQ
          </Link>

          <a
            href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20I%20would%20like%20to%20request%20a%20school%20demonstration."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#2A7C13] hover:text-[#20600E] font-medium transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>+237 682 833 601</span>
          </a>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs sm:text-[13px] shadow-xs transition-colors shrink-0"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5 hidden sm:inline" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline text-[13px] font-medium text-[#525E4B] hover:text-[#142010] transition-colors px-2 py-1"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs sm:text-[13px] shadow-xs transition-colors shrink-0"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 hidden sm:inline" />
              </Link>
            </>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-[6px] border border-[#E8DFC9] bg-white text-[#525E4B] hover:text-[#142010] min-w-[38px] min-h-[38px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer Sheet */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          {/* Backdrop scrim */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="relative ml-auto flex flex-col w-full max-w-[340px] h-full bg-[#FFFDF5] shadow-2xl z-10 overflow-hidden border-l border-[#E8DFC9] animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-[#E8DFC9] bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[7px] bg-[#2A7C13] text-white flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-[15px] tracking-tight text-[#142010] leading-none">
                    {BRAND.name}
                  </span>
                  <span className="text-[9.5px] font-semibold text-[#788470] tracking-wide uppercase mt-0.5">
                    {BRAND.systemTitle}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full border border-[#E8DFC9] bg-[#FAFAF8] text-[#525E4B] hover:text-[#142010] hover:bg-[#F0EEE6] flex items-center justify-center transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {isAuthenticated && (
                <div className="p-3.5 rounded-[8px] bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[5px] bg-[#166534] text-white flex items-center justify-center">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#166534] block">Active Session</span>
                      <span className="text-[10.5px] text-[#22723E]">School portal connected</span>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-[6px] bg-[#2A7C13] text-white text-xs font-bold shadow-2xs hover:bg-[#20600E] shrink-0"
                  >
                    Dashboard
                  </Link>
                </div>
              )}

              {/* Core Modules Section */}
              <div className="space-y-2">
                <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#788470] px-1">
                  Core Modules
                </p>
                <div className="space-y-1.5">
                  <Link
                    href="/features/school-hub"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-[8px] bg-white border border-[#E8DFC9] hover:border-[#2A7C13] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <WifiOff className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#142010] group-hover:text-[#2A7C13] transition-colors">
                        Offline School Hub
                      </div>
                      <div className="text-[11px] text-[#788470] leading-tight">
                        Zero-internet local LAN sync for campuses
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/features/report-cards"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-[8px] bg-white border border-[#E8DFC9] hover:border-[#2A7C13] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#142010] group-hover:text-[#2A7C13] transition-colors">
                        Term Report Cards
                      </div>
                      <div className="text-[11px] text-[#788470] leading-tight">
                        Sequences, CBA competencies, and batch printing
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/features/finance"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-[8px] bg-white border border-[#E8DFC9] hover:border-[#2A7C13] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-[6px] bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#142010] group-hover:text-[#2A7C13] transition-colors">
                        Bursary &amp; Fee Receipts
                      </div>
                      <div className="text-[11px] text-[#788470] leading-tight">
                        Installment logs, clearance lists, and FCFA receipts
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Resources & Information */}
              <div className="space-y-2 pt-1 border-t border-[#E8DFC9]">
                <p className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#788470] px-1 pt-2">
                  Resources &amp; Guides
                </p>
                <div className="space-y-1">
                  <Link
                    href="/blog"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-[6px] hover:bg-[#F2EFE6] text-[13px] font-semibold text-[#2A7C13] transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Teacher Guides &amp; Pedagogy Blog</span>
                  </Link>
                  <Link
                    href="/#capabilities"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block p-2 rounded-[6px] hover:bg-[#F2EFE6] text-[13px] font-medium text-[#142010] transition-colors"
                  >
                    System Capabilities
                  </Link>
                  <Link
                    href="/#how-it-works"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block p-2 rounded-[6px] hover:bg-[#F2EFE6] text-[13px] font-medium text-[#525E4B] transition-colors"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/#faq"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block p-2 rounded-[6px] hover:bg-[#F2EFE6] text-[13px] font-medium text-[#525E4B] transition-colors"
                  >
                    Frequently Asked Questions
                  </Link>
                </div>
              </div>

              {/* WhatsApp Hotline Box */}
              <div className="pt-1">
                <a
                  href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20I%20would%20like%20a%20demonstration%20for%20our%20school."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-[7px] bg-[#EAF7E4] border border-[#76C457]/40 text-[#142010] text-[12.5px] font-semibold hover:border-[#2A7C13] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#2A7C13] shrink-0" />
                  <div>
                    <span className="text-[#2A7C13] block font-bold">+237 682 833 601</span>
                    <span className="text-[10.5px] text-[#525E4B] font-normal">WhatsApp Support &amp; Demos</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Pinned Bottom CTA Actions */}
            <div className="p-4 border-t border-[#E8DFC9] bg-white space-y-2 shrink-0">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to School Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>Register Your School</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center py-2 rounded-[7px] bg-[#FFFDF5] border border-[#D5D5CF] hover:bg-[#F5F5F0] text-[#142010] font-semibold text-xs transition-colors"
                  >
                    Sign in to Portal
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
