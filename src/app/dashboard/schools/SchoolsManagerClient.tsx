"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Printer,
  Sparkles,
  Search,
  Loader2,
  Phone,
  MapPin,
  Calendar,
  X,
  ExternalLink,
  Star,
} from "lucide-react";
import {
  switchSchoolAction,
  extendSchoolTrialAction,
  activateSchoolSubscriptionAction,
  deactivateSchoolSubscriptionAction,
  quickCreateSchoolAction,
  toggleSchoolFeaturedOnLandingAction,
} from "./actions";

export interface SchoolRow {
  id: string;
  name: string;
  code: string | null;
  slug: string;
  subsystem: "anglophone" | "francophone" | "bilingual";
  address: string | null;
  phone: string | null;
  studentCount: number;
  staffCount: number;
  streamCount: number;
  academicYearName: string | null;
  isFeaturedOnLanding?: boolean;
  isActive?: boolean;
  subscription: {
    status: "trial" | "active" | "past_due" | "canceled";
    plan: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    daysRemaining: number;
    isExpired: boolean;
  };
}

interface SchoolsManagerClientProps {
  schools: SchoolRow[];
  currentActiveSchoolId: string;
  currentUserName: string;
}

export function SchoolsManagerClient({
  schools: initialSchools,
  currentActiveSchoolId,
  currentUserName,
}: SchoolsManagerClientProps) {
  const [schools, setSchools] = useState<SchoolRow[]>(initialSchools);
  const [search, setSearch] = useState("");
  const [subsystemFilter, setSubsystemFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync state whenever props update after server revalidations
  useEffect(() => {
    setSchools(initialSchools);
  }, [initialSchools]);

  // Quick Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form fields for new school
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formSubsystem, setFormSubsystem] = useState<"anglophone" | "francophone" | "bilingual">("anglophone");
  const [formCity, setFormCity] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formYear, setFormYear] = useState("2026/2027");

  // Filtered list
  const filteredSchools = schools.filter((sch) => {
    const matchesSearch =
      sch.name.toLowerCase().includes(search.toLowerCase()) ||
      (sch.code && sch.code.toLowerCase().includes(search.toLowerCase())) ||
      (sch.address && sch.address.toLowerCase().includes(search.toLowerCase()));

    const matchesSubsystem =
      subsystemFilter === "all" || sch.subsystem === subsystemFilter;

    return matchesSearch && matchesSubsystem;
  });

  // Calculate totals
  const totalStudents = schools.reduce((acc, s) => acc + s.studentCount, 0);
  const totalStaff = schools.reduce((acc, s) => acc + s.staffCount, 0);
  const activeSubs = schools.filter((s) => s.subscription.status === "active" && s.isActive !== false).length;
  const trialSubs = schools.filter((s) => s.subscription.status === "trial" && s.isActive !== false).length;
  const deactivatedCount = schools.filter((s) => s.isActive === false || s.subscription.status === "canceled").length;
  const featuredOnLandingCount = schools.filter((s) => s.isFeaturedOnLanding).length;

  const handleSwitchSchool = (schoolId: string) => {
    setSwitchingId(schoolId);
    startTransition(async () => {
      try {
        await switchSchoolAction(schoolId);
      } catch (err: any) {
        setActionMessage({
          type: "error",
          text: "Unable to switch school session. Please try again.",
        });
        setSwitchingId(null);
      }
    });
  };

  const handleExtendTrial = (schoolId: string, schoolName: string) => {
    startTransition(async () => {
      try {
        const res = await extendSchoolTrialAction(schoolId, 30);
        if (!res.success) {
          setActionMessage({
            type: "error",
            text: res.error || "Unable to extend trial. Please try again.",
          });
          return;
        }
        setSchools((prev) =>
          prev.map((s) =>
            s.id === schoolId
              ? {
                  ...s,
                  subscription: {
                    ...s.subscription,
                    status: "trial",
                    daysRemaining: s.subscription.daysRemaining + 30,
                    isExpired: false,
                  },
                }
              : s
          )
        );
        setActionMessage({
          type: "success",
          text: `Trial extended by 30 days for ${schoolName}.`,
        });
      } catch (err: any) {
        setActionMessage({
          type: "error",
          text: "Failed to extend trial period. Please try again.",
        });
      }
    });
  };

  const handleActivateSchool = (schoolId: string, schoolName: string) => {
    startTransition(async () => {
      try {
        const res = await activateSchoolSubscriptionAction(schoolId, "pilot");
        if (!res.success) {
          setActionMessage({
            type: "error",
            text: res.error || "Unable to activate school. Please try again.",
          });
          return;
        }
        setSchools((prev) =>
          prev.map((s) =>
            s.id === schoolId
              ? {
                  ...s,
                  isActive: true,
                  subscription: {
                    ...s.subscription,
                    status: "active",
                    daysRemaining: 365,
                    isExpired: false,
                  },
                }
              : s
          )
        );
        setActionMessage({
          type: "success",
          text: `Annual license activated for ${schoolName}!`,
        });
      } catch (err: any) {
        setActionMessage({
          type: "error",
          text: "Failed to activate school. Please try again.",
        });
      }
    });
  };

  const handleDeactivateSchool = (schoolId: string, schoolName: string) => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Are you sure you want to deactivate "${schoolName}"?\n\nThe school and its teachers will be suspended from logging in until you activate it again.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deactivateSchoolSubscriptionAction(schoolId);
        if (!res.success) {
          setActionMessage({
            type: "error",
            text: res.error || "Unable to deactivate school. Please try again.",
          });
          return;
        }
        setSchools((prev) =>
          prev.map((s) =>
            s.id === schoolId
              ? {
                  ...s,
                  isActive: false,
                  subscription: {
                    ...s.subscription,
                    status: "canceled",
                    daysRemaining: 0,
                    isExpired: true,
                  },
                }
              : s
          )
        );
        setActionMessage({
          type: "success",
          text: `"${schoolName}" has been deactivated.`,
        });
      } catch (err: any) {
        setActionMessage({
          type: "error",
          text: "Failed to deactivate school. Please try again.",
        });
      }
    });
  };

  const handleToggleFeaturedLanding = (schoolId: string, schoolName: string) => {
    startTransition(async () => {
      try {
        const res = await toggleSchoolFeaturedOnLandingAction(schoolId);
        if (!res.success) {
          setActionMessage({
            type: "error",
            text: res.error || "Unable to update homepage display. Please try again.",
          });
          return;
        }
        setSchools((prev) =>
          prev.map((s) =>
            s.id === schoolId
              ? { ...s, isFeaturedOnLanding: res.isFeatured }
              : s
          )
        );
        setActionMessage({
          type: "success",
          text: res.isFeatured
            ? `"${schoolName}" is now featured on the public homepage!`
            : `"${schoolName}" was removed from the public homepage.`,
        });
      } catch (err: any) {
        setActionMessage({
          type: "error",
          text: "Unable to update homepage display. Please try again.",
        });
      }
    });
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    const formData = new FormData();
    formData.set("schoolName", formName);
    formData.set("schoolCode", formCode);
    formData.set("subsystem", formSubsystem);
    formData.set("city", formCity);
    formData.set("phone", formPhone);
    formData.set("academicYearName", formYear);

    try {
      const res = await quickCreateSchoolAction(null, formData);
      if (res.success) {
        setShowCreateModal(false);
        // Page redirects automatically to dashboard of the newly created school
        window.location.href = "/dashboard";
      } else {
        setCreateError(res.error || "Failed to create school.");
        setIsCreating(false);
      }
    } catch (err: any) {
      setCreateError(err?.message || "An unexpected error occurred.");
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── HEADER BANNER ── */}
      <div className="bg-[#142010] text-white p-6 rounded-[12px] shadow-sm border border-[#2A7C13] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2A7C13]/30 text-[#86EFAC] text-[11px] font-bold uppercase tracking-wider mb-2 border border-[#2A7C13]/50">
            <Sparkles className="w-3.5 h-3.5 text-[#86EFAC]" />
            <span>Platform Super Admin</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Multi-Tenant School Network
          </h1>
          <p className="text-sm text-[#A3B899] mt-1 max-w-2xl">
            Welcome, {currentUserName}. Oversee all client campuses, create new school tenancies, manage subscription leases, and jump into any school with full administrative authority.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/schools/intake-sheet"
            className="px-3.5 py-2 rounded-[7px] bg-white text-[#142010] hover:bg-[#F5F5F0] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>Staff Roster (A4 Print)</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create School Tenancy</span>
          </button>
        </div>
      </div>

      {/* ── METRIC STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#788470] flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>Total Campuses</span>
          </div>
          <div className="text-2xl font-black text-[#142010] mt-1">
            {schools.length}
          </div>
          <div className="text-[11px] text-[#666666] mt-0.5">
            Active tenancies across Cameroon
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#788470] flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>Total Students</span>
          </div>
          <div className="text-2xl font-black text-[#142010] mt-1">
            {totalStudents.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#666666] mt-0.5">
            Enrolled across all campuses
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#788470] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>Teachers & Staff</span>
          </div>
          <div className="text-2xl font-black text-[#142010] mt-1">
            {totalStaff}
          </div>
          <div className="text-[11px] text-[#666666] mt-0.5">
            Entering marks and attendance
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#788470] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#2A7C13]" />
            <span>Subscription Status</span>
          </div>
          <div className="text-2xl font-black text-[#142010] mt-1">
            {activeSubs} <span className="text-xs font-normal text-[#888888]">Active</span> / {trialSubs} <span className="text-xs font-normal text-[#888888]">Trial</span>
            {deactivatedCount > 0 && (
              <span className="text-xs font-normal text-red-600 ml-1.5">
                ({deactivatedCount} Inactive)
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#666666] mt-0.5">
            Managed from this console
          </div>
        </div>

        <div className="p-4 rounded-[10px] bg-white border border-[#E8DFC9] shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#788470] flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Public Homepage</span>
          </div>
          <div className="text-2xl font-black text-[#142010] mt-1">
            {featuredOnLandingCount} <span className="text-xs font-normal text-[#888888]">Featured</span>
          </div>
          <div className="text-[11px] text-[#666666] mt-0.5">
            Names displayed on landing
          </div>
        </div>
      </div>

      {/* ── NOTIFICATION ALERT ── */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-[8px] text-xs font-medium flex items-center justify-between border ${
            actionMessage.type === "success"
              ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── CONTROLS & FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-[10px] border border-[#E8DFC9]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search school name, code or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-[6px] border border-[#D5CBB2] text-xs bg-[#FFFDF5] text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-1 focus:ring-[#2A7C13]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["all", "anglophone", "francophone", "bilingual"].map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSubsystemFilter(sub)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold capitalize transition-colors cursor-pointer ${
                subsystemFilter === sub
                  ? "bg-[#142010] text-white"
                  : "bg-[#F5F5F0] text-[#555555] hover:bg-[#EAEAE5]"
              }`}
            >
              {sub === "all" ? "All Subsystems" : sub}
            </button>
          ))}
        </div>
      </div>

      {/* ── SCHOOLS DIRECTORY TABLE / CARDS ── */}
      <div className="space-y-3.5">
        {filteredSchools.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[10px] border border-[#E8DFC9] p-6 space-y-2">
            <Building2 className="w-8 h-8 text-[#888888] mx-auto" />
            <h3 className="text-sm font-bold text-[#142010]">No schools found</h3>
            <p className="text-xs text-[#666666]">
              No campuses match your current search or filter criteria.
            </p>
          </div>
        ) : (
          filteredSchools.map((school) => {
            const isCurrentlyActive = school.id === currentActiveSchoolId;
            const isSwitching = switchingId === school.id;
            const isDeactivated = school.isActive === false || school.subscription.status === "canceled";
            const isTrial = !isDeactivated && school.subscription.status === "trial";
            const isLicenseActive = !isDeactivated && school.subscription.status === "active";
            const daysLeft = school.subscription.daysRemaining;

            return (
              <div
                key={school.id}
                className={`p-4 rounded-[10px] bg-white border transition-all shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isCurrentlyActive
                    ? "border-[#2A7C13] ring-1 ring-[#2A7C13]/30 bg-[#FBFDFB]"
                    : "border-[#E8DFC9] hover:border-[#D5CBB2]"
                }`}
              >
                {/* School Profile */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-[8px] bg-[#142010] text-white font-black text-base flex items-center justify-center shrink-0 shadow-2xs">
                    {school.code ? school.code.slice(0, 3) : school.name.charAt(0)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-extrabold text-sm text-[#142010] truncate">
                        {school.name}
                      </h2>
                      {school.code && (
                        <span className="px-1.5 py-0.5 rounded bg-[#F5F5F0] text-[#555555] text-[10px] font-mono font-bold border border-[#E0E0D8]">
                          {school.code}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-[#EAF7E4] text-[#166534] text-[10px] font-bold capitalize border border-[#BBF7D0]">
                        {school.subsystem}
                      </span>
                      {school.isFeaturedOnLanding && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FFF8CF] text-[#7A5B00] text-[10px] font-bold border border-[#FBE6C2]">
                          <Star className="w-2.5 h-2.5 fill-[#B45309] text-[#B45309]" />
                          <span>On Homepage</span>
                        </span>
                      )}
                      {isCurrentlyActive && (
                        <span className="px-1.5 py-0.5 rounded bg-[#142010] text-[#86EFAC] text-[10px] font-bold">
                          Active Session
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#666666] mt-1.5">
                      {school.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#888888]" />
                          <span>{school.address}</span>
                        </span>
                      )}
                      {school.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#888888]" />
                          <span>{school.phone}</span>
                        </span>
                      )}
                      {school.academicYearName && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#888888]" />
                          <span>{school.academicYearName}</span>
                        </span>
                      )}
                    </div>

                    {/* Stats pills */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                      <span className="font-semibold text-[#142010]">
                        <strong className="text-[#2A7C13]">{school.studentCount}</strong> students
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-[#142010]">
                        <strong className="text-[#2A7C13]">{school.staffCount}</strong> staff
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-[#142010]">
                        <strong className="text-[#2A7C13]">{school.streamCount}</strong> classes
                      </span>
                      <span>•</span>
                      {isDeactivated ? (
                        <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-red-100 text-red-800 border border-red-200">
                          Deactivated
                        </span>
                      ) : isTrial ? (
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                            daysLeft <= 3
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          Trial: {daysLeft} days remaining
                        </span>
                      ) : (
                        <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-green-100 text-green-800 border border-green-200">
                          Active License ({school.subscription.plan})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#F0EFEA]">
                  <Link
                    href={`/dashboard/schools/intake-sheet?schoolId=${school.id}`}
                    title="Print Staffroom Intake & Assignment Sheet"
                    className="p-2 rounded-[6px] bg-[#FAF8F5] hover:bg-[#EFECE6] text-[#525E4B] border border-[#D5CBB2] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#2A7C13]" />
                    <span className="hidden sm:inline">Roster A4</span>
                  </Link>

                  {isTrial && (
                    <button
                      type="button"
                      onClick={() => handleExtendTrial(school.id, school.name)}
                      disabled={isPending}
                      title="Add 30 days to the trial period"
                      className="px-2.5 py-1.5 rounded-[6px] bg-[#FAF8F5] hover:bg-[#EFECE6] text-[#142010] border border-[#D5CBB2] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      +30d Trial
                    </button>
                  )}

                  {isLicenseActive ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#EAF7E4] text-[#166534] border border-[#BBF7D0] text-xs font-bold shadow-2xs select-none"
                        title="Official annual license is active"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" />
                        <span>Activated</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeactivateSchool(school.id, school.name)}
                        disabled={isPending}
                        title="Deactivate or suspend this school"
                        className="px-2.5 py-1.5 rounded-[6px] bg-[#FAF8F5] hover:bg-red-50 text-red-600 hover:text-red-700 border border-[#D5CBB2] hover:border-red-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleActivateSchool(school.id, school.name)}
                      disabled={isPending}
                      title="Activate official annual license"
                      className="px-3 py-1.5 rounded-[6px] bg-[#FAF8F5] hover:bg-[#EAF7E4] text-[#166534] border border-[#BBF7D0] hover:border-[#166534] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Activate
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleFeaturedLanding(school.id, school.name)}
                    disabled={isPending}
                    title={
                      school.isFeaturedOnLanding
                        ? "Currently shown on public homepage. Click to remove."
                        : "Click to show this school on the public platform homepage."
                    }
                    className={`px-2.5 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                      school.isFeaturedOnLanding
                        ? "bg-[#FFF8CF] text-[#7A5B00] border border-[#FBE6C2] hover:bg-[#FDF3B4]"
                        : "bg-[#FAF8F5] text-[#525E4B] border border-[#D5CBB2] hover:bg-[#EFECE6]"
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        school.isFeaturedOnLanding
                          ? "fill-[#B45309] text-[#B45309]"
                          : "text-[#788470]"
                      }`}
                    />
                    <span className="hidden sm:inline">
                      {school.isFeaturedOnLanding ? "On Homepage" : "Show on Homepage"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchSchool(school.id)}
                    disabled={isPending || isCurrentlyActive}
                    className={`px-3.5 py-1.5 rounded-[6px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      isCurrentlyActive
                        ? "bg-[#EAF7E4] text-[#166534] border border-[#BBF7D0] cursor-default"
                        : "bg-[#2A7C13] hover:bg-[#20600E] text-white"
                    }`}
                  >
                    {isSwitching ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Switching…</span>
                      </>
                    ) : isCurrentlyActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" />
                        <span>Current School</span>
                      </>
                    ) : (
                      <>
                        <span>Enter Campus</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── CREATE SCHOOL TENANCY MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white rounded-[12px] border border-[#E8DFC9] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-base text-[#142010]">
                  Create New School Tenancy
                </h3>
                <p className="text-xs text-[#666666] mt-0.5">
                  Provisions a new secondary school in 60 seconds with full MINESEC seeding.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#888888] hover:text-[#142010] p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-[6px] bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleQuickCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#142010] mb-1">
                  School Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Joseph Bilingual College"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#D5CBB2] bg-[#FFFDF5] text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#142010] mb-1">
                    Acronym / Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SJBC"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#D5CBB2] bg-[#FFFDF5] text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#142010] mb-1">
                    Subsystem <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formSubsystem}
                    onChange={(e) => setFormSubsystem(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#D5CBB2] bg-[#FFFDF5] text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                  >
                    <option value="anglophone">Anglophone (Forms 1-U6)</option>
                    <option value="francophone">Francophone (6ème-Tle)</option>
                    <option value="bilingual">Bilingual (Both Sections)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#142010] mb-1">
                    City / Town <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bamenda, Buea, Yaounde"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#D5CBB2] bg-[#FFFDF5] text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#142010] mb-1">
                    Phone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 677 12 34 56"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#D5CBB2] bg-[#FFFDF5] text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#142010] mb-1">
                  Academic Year
                </label>
                <input
                  type="text"
                  required
                  placeholder="2026/2027"
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[6px] border border-[#D5CBB2] bg-[#FFFDF5] text-[#142010] focus:outline-none focus:border-[#2A7C13]"
                />
              </div>

              <div className="p-3 rounded-[6px] bg-[#F5F5F0] border border-[#E0E0D8] text-[11px] text-[#555555] space-y-1">
                <div className="font-bold text-[#142010]">
                  Automatic MINESEC Seeding Included:
                </div>
                <div>• Academic Year {formYear} + 3 Terms + 6 Evaluation Sequences</div>
                <div>• Standard classes ({formSubsystem === "francophone" ? "6ème to Terminale" : "Form 1 to Upper Sixth"})</div>
                <div>• Core curriculum subjects with official coefficients</div>
                <div>• Links your master account immediately with full Superadmin rights</div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-[6px] border border-[#D5CBB2] text-xs font-semibold text-[#525E4B] hover:bg-[#F5F5F0] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisioning School…</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create & Enter Campus</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
