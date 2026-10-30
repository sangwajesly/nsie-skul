"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  School,
  UserCheck,
  Check,
  Copy,
  Clock,
  ArrowRight,
  Loader2,
  LogOut,
  Building2,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import { createSchoolAction, type CreateSchoolResult } from "./actions";
import { signOutAction } from "@/app/auth/actions";

interface OnboardingClientProps {
  userId: string;
  userEmail: string;
  fullName: string;
}

export function OnboardingClient({
  userId,
  userEmail,
  fullName,
}: OnboardingClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"admin" | "teacher">("admin");
  const [copied, setCopied] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const [state, formAction, isPending] = useActionState<CreateSchoolResult | null, FormData>(
    createSchoolAction,
    null
  );

  useEffect(() => {
    if (state && state.success && state.redirectTo) {
      setIsNavigating(true);
      router.replace(state.redirectTo);
    }
  }, [state, router]);

  const copyEmail = () => {
    navigator.clipboard.writeText(userEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBusy = isPending || isNavigating;

  return (
    <div className="min-h-screen bg-[#FFFDF5] text-[#142010] py-10 px-4 sm:px-6 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[#E8DFC9]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[8px] bg-[#142010] text-white flex items-center justify-center font-bold shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-[15px] tracking-tight text-[#142010]">
              Nsei Sukul Management System
            </div>
            <div className="text-[10px] text-[#788470]">
              Cameroon Secondary Education Platform
            </div>
          </div>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#666666] hover:text-[#C2410C] rounded-[6px] hover:bg-[#FFF0F0] border border-transparent hover:border-[#FEE2E2] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </form>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto w-full my-8 space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#EBF5E9] text-[#2A7C13] border border-[#C3E4BC]">
            <Sparkles className="w-3 h-3" />
            Account Setup
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#142010]">
            Welcome to Nsei Sukul Management System, {fullName}!
          </h1>
          <p className="text-sm text-[#525E4B] max-w-lg mx-auto">
            Choose how you would like to get started. You can register your school as an administrator or join an existing school as a staff member.
          </p>
        </div>

        {/* Intent Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab("admin")}
            className={`p-4 rounded-[10px] text-left border transition-all flex items-start gap-3.5 ${
              activeTab === "admin"
                ? "bg-white border-[#2A7C13] ring-2 ring-[#2A7C13]/15 shadow-sm"
                : "bg-white/60 border-[#E8DFC9] hover:bg-white hover:border-[#D5CBB2]"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 ${
                activeTab === "admin"
                  ? "bg-[#142010] text-[#4ADE80]"
                  : "bg-[#F0EFEA] text-[#666666]"
              }`}
            >
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#142010] flex items-center gap-1.5">
                <span>Register a New School</span>
                {activeTab === "admin" && (
                  <span className="w-2 h-2 rounded-full bg-[#2A7C13]" />
                )}
              </div>
              <p className="text-[11px] text-[#666666] mt-0.5 leading-snug">
                For Principals, Headmasters, and Proprietors setting up their institution.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("teacher")}
            className={`p-4 rounded-[10px] text-left border transition-all flex items-start gap-3.5 ${
              activeTab === "teacher"
                ? "bg-white border-[#2A7C13] ring-2 ring-[#2A7C13]/15 shadow-sm"
                : "bg-white/60 border-[#E8DFC9] hover:bg-white hover:border-[#D5CBB2]"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 ${
                activeTab === "teacher"
                  ? "bg-[#142010] text-[#4ADE80]"
                  : "bg-[#F0EFEA] text-[#666666]"
              }`}
            >
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#142010] flex items-center gap-1.5">
                <span>Join Existing School</span>
                {activeTab === "teacher" && (
                  <span className="w-2 h-2 rounded-full bg-[#2A7C13]" />
                )}
              </div>
              <p className="text-[11px] text-[#666666] mt-0.5 leading-snug">
                For Teachers, HODs, Bursars, and Staff invited by their school.
              </p>
            </div>
          </button>
        </div>

        {/* Tab Content: Register School Form */}
        {activeTab === "admin" && (
          <div className="bg-white border border-[#E8DFC9] rounded-[12px] shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0EFEA]">
              <div>
                <h2 className="text-base font-bold text-[#142010]">
                  School Registration Wizard
                </h2>
                <p className="text-xs text-[#666666] mt-0.5">
                  Set up your school profile, educational system, and active academic year.
                </p>
              </div>
              <span className="hidden sm:inline-flex px-2.5 py-1 text-[11px] font-semibold rounded-[4px] bg-[#FFF8CF] text-[#7A5B00] border border-[#FBE6C2]">
                Instant 2-Min Setup
              </span>
            </div>

            {state && !state.success && (
              <div className="p-3 text-xs rounded-[6px] bg-red-50 text-red-700 border border-red-200 font-medium">
                {state.error}
              </div>
            )}

            {isNavigating && (
              <div className="p-3.5 text-xs rounded-[6px] bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-medium flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#166534]" />
                <span>School registered! Preparing your administrator dashboard…</span>
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* School Name */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="schoolName"
                    className="block text-xs font-semibold text-[#444444] mb-1.5"
                  >
                    Official School Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#AAAAAA]">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      id="schoolName"
                      name="schoolName"
                      type="text"
                      required
                      disabled={isBusy}
                      placeholder="e.g. Government Bilingual High School Bamenda"
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13]"
                    />
                  </div>
                </div>

                {/* Acronym / Code */}
                <div>
                  <label
                    htmlFor="schoolCode"
                    className="block text-xs font-semibold text-[#444444] mb-1.5"
                  >
                    School Acronym / Code *
                  </label>
                  <input
                    id="schoolCode"
                    name="schoolCode"
                    type="text"
                    required
                    disabled={isBusy}
                    placeholder="e.g. GBHS-BMA"
                    className="w-full px-3 py-2 text-sm font-semibold uppercase rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13]"
                  />
                </div>
              </div>

              {/* Subsystem & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="subsystem"
                    className="block text-xs font-semibold text-[#444444] mb-1.5"
                  >
                    Educational Sub-System *
                  </label>
                  <select
                    id="subsystem"
                    name="subsystem"
                    required
                    disabled={isBusy}
                    defaultValue="bilingual"
                    className="w-full px-3 py-2 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13]"
                  >
                    <option value="bilingual">Comprehensive / Bilingual Institution</option>
                    <option value="anglophone">English Curriculum (General &amp; Technical)</option>
                    <option value="francophone">French Curriculum (Enseignement Général &amp; Technique)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="academicYearName"
                    className="block text-xs font-semibold text-[#444444] mb-1.5"
                  >
                    Starting Academic Year *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#AAAAAA]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      id="academicYearName"
                      name="academicYearName"
                      type="text"
                      required
                      disabled={isBusy}
                      defaultValue="2026/2027"
                      placeholder="e.g. 2026/2027"
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13]"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-xs font-semibold text-[#444444] mb-1.5"
                  >
                    City / Town &amp; Region *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#AAAAAA]">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      disabled={isBusy}
                      placeholder="e.g. Bamenda, North West"
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-semibold text-[#444444] mb-1.5"
                  >
                    Official Phone / WhatsApp Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#AAAAAA]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      disabled={isBusy}
                      placeholder="e.g. +237 670 123 456"
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-[6px] border border-[#D5CBB2] bg-white text-[#142010] placeholder-[#BBBBBB] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13]"
                    />
                  </div>
                </div>
              </div>

              {/* Automatic Configuration Note */}
              <div className="p-3.5 rounded-[6px] bg-[#FFF8CF] border border-[#FBE6C2] text-xs text-[#7A4A00] space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
                  What will be configured automatically:
                </p>
                <p className="text-[11px] text-[#8B7030] leading-relaxed">
                  Your school will be initialized with the official <strong>3 Terms</strong> and <strong>6 Evaluation Sequences</strong>, with Sequence 1 opened for marks entry, and your account designated as the School Administrator &amp; Principal.
                </p>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[8px] bg-[#142010] hover:bg-[#1f3319] text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isNavigating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Provisioning School &amp; Opening Dashboard…</span>
                    </>
                  ) : isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Registering School…</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Setup &amp; Launch Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Content: Join as Teacher Card */}
        {activeTab === "teacher" && (
          <div className="bg-white border border-[#E8DFC9] rounded-[12px] shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0EFEA]">
              <div>
                <h2 className="text-base font-bold text-[#142010]">
                  Teacher &amp; Staff Activation
                </h2>
                <p className="text-xs text-[#666666] mt-0.5">
                  Follow these steps to connect with your school administrator.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#FFF8CF] text-[#7A5B00] border border-[#FBE6C2] text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-[#B45309]" />
                Awaiting School Link
              </span>
            </div>

            {/* Email Identification Card */}
            <div className="p-4 rounded-[8px] bg-[#FAFAF8] border border-[#E5E5DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#788470]">
                  Your Registered Staff Email
                </div>
                <div className="text-sm font-bold text-[#142010] mt-0.5">
                  {userEmail}
                </div>
              </div>

              <button
                type="button"
                onClick={copyEmail}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white border border-[#D5CBB2] text-xs font-semibold text-[#142010] hover:bg-[#FFF8CF]/30 transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#2A7C13]" />
                    <span className="text-[#2A7C13]">Email Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#666666]" />
                    <span>Copy Email</span>
                  </>
                )}
              </button>
            </div>

            {/* Steps List */}
            <div className="space-y-3.5 text-xs text-[#525E4B]">
              <h3 className="font-bold text-sm text-[#142010]">
                How to join your school:
              </h3>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#EBF5E9] text-[#2A7C13] flex items-center justify-center font-bold text-xs shrink-0 border border-[#C3E4BC]">
                  1
                </span>
                <p className="leading-relaxed">
                  Share your email (<strong>{userEmail}</strong>) with your school&apos;s Principal or Vice-Principal.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#EBF5E9] text-[#2A7C13] flex items-center justify-center font-bold text-xs shrink-0 border border-[#C3E4BC]">
                  2
                </span>
                <p className="leading-relaxed">
                  The administrator will navigate to <strong>Settings &gt; Staff &amp; Teachers</strong> on their Nsei Sukul Management System dashboard and assign you your teaching subjects and class groups.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#EBF5E9] text-[#2A7C13] flex items-center justify-center font-bold text-xs shrink-0 border border-[#C3E4BC]">
                  3
                </span>
                <p className="leading-relaxed">
                  Once assigned, click the button below or refresh the page, and you will be routed directly to your teacher workspace.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => router.refresh()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#142010] hover:bg-[#1f3319] text-white font-semibold text-xs shadow-sm transition-all"
              >
                <span>Check Status / Refresh</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("admin")}
                className="w-full sm:w-auto text-xs text-[#2A7C13] hover:underline font-semibold py-2"
              >
                Are you a school administrator instead? Set up your school &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Cameroon Education Support & WhatsApp Assisted Setup */}
        <div className="p-4 sm:p-5 rounded-[10px] bg-gradient-to-r from-[#F0FDF4] to-[#FFFDF5] border border-[#BBF7D0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2A7C13] text-white flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#142010]">
                Need help onboarding your school or importing data?
              </div>
              <p className="text-[11px] text-[#525E4B] mt-0.5 leading-relaxed">
                Our local education team in Cameroon can help import your student lists, configure your class streams, and train your staff.
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/237682833601?text=Hello%20Nsei%20Sukul%20Team,%20I%20need%20assistance%20onboarding%20our%20school."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-xs transition-colors shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center text-[11px] text-[#888888] pt-6 border-t border-[#E8DFC9]">
        &copy; {new Date().getFullYear()} Nsei Sukul Management System &middot; Secondary School Management Platform for Cameroon
      </div>
    </div>
  );
}
