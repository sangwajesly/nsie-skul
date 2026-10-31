"use client";

import React, { useState } from "react";
import {
  EmptyState,
  TableSkeleton,
  CardGridSkeleton,
  DetailSkeleton,
  LoadingSpinner,
  LoadingButton,
  ErrorState,
  NoInternetCard,
  SlowNetworkAlert,
  NoSearchResultsState,
  PermissionDeniedState,
  SessionExpiredModal,
  FormField,
  ValidatedInput,
  CameroonValidators,
  SuccessCard,
  SuccessBanner,
} from "@/components/ui/states";
import {
  Layers,
  FolderPlus,
  Loader2,
  AlertCircle,
  WifiOff,
  Hourglass,
  SearchX,
  ShieldAlert,
  Clock,
  CheckCircle2,
  UserCheck,
  Send,
  Plus,
} from "lucide-react";

export function StatesShowcaseClient({ userRole = "Administrator" }: { userRole?: string }) {
  const [activeTab, setActiveTab] = useState<number>(1);

  // State 8 simulation
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // State 9 Interactive Form Validation states
  const [phone, setPhone] = useState("677 123 456");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [score, setScore] = useState("24.50"); // Intentionally invalid > 20
  const [scoreError, setScoreError] = useState<string | null>("Score cannot exceed the maximum denominator of 20.00.");

  const [coef, setCoef] = useState("3");
  const [coefError, setCoefError] = useState<string | null>(null);

  const [matricule, setMatricule] = useState("2024-F5-001");
  const [matriculeError, setMatriculeError] = useState<string | null>(null);

  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  const tabs = [
    { id: 1, label: "1. Empty State", icon: FolderPlus },
    { id: 2, label: "2. Loading State", icon: Loader2 },
    { id: 3, label: "3. Error State", icon: AlertCircle },
    { id: 4, label: "4. No Internet", icon: WifiOff },
    { id: 5, label: "5. Slow Network", icon: Hourglass },
    { id: 6, label: "6. No Search Results", icon: SearchX },
    { id: 7, label: "7. Permission Denied", icon: ShieldAlert },
    { id: 8, label: "8. Session Expired", icon: Clock },
    { id: 9, label: "9. Form Validation", icon: AlertCircle },
    { id: 10, label: "10. Success State", icon: CheckCircle2 },
  ];

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setPhoneError(CameroonValidators.phone(val));
  };

  const handleScoreChange = (val: string) => {
    setScore(val);
    setScoreError(CameroonValidators.score(val, 20));
  };

  const handleCoefChange = (val: string) => {
    setCoef(val);
    setCoefError(CameroonValidators.coefficient(val));
  };

  const handleMatriculeChange = (val: string) => {
    setMatricule(val);
    setMatriculeError(CameroonValidators.matricule(val));
  };

  return (
    <div className="space-y-6">
      {/* State Switcher Tab Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-[#142010] text-white shadow-xs"
                  : "bg-white text-[#525E4B] border border-[#E8DFC9] hover:bg-[#FAF8F5]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#76C457]" : "text-[#777777]"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Active State Container ────────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-[12px] bg-white border border-[#E8DFC9] shadow-2xs min-h-[420px]">
        {/* STATE 1: EMPTY STATE */}
        {activeTab === 1 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8DFC9] pb-3">
              <h2 className="text-base font-extrabold text-[#142010]">1. Empty State Showcase</h2>
              <p className="text-xs text-[#525E4B]">Used when a collection, class roster, or ledger has 0 records.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Default Empty State */}
              <div className="p-4 rounded-[8px] bg-[#FAF8F5] border border-[#E8DFC9]">
                <span className="text-[10px] font-bold text-[#888888] uppercase block mb-2">Variant: Card Style</span>
                <EmptyState
                  title="No Subjects Registered in Form 5"
                  description="This class group has no assigned subjects for the 2024/2025 academic year."
                  action={{ label: "Assign Subject", href: "/dashboard/academics", icon: Plus }}
                  secondaryAction={{ label: "Import MINESEC Syllabus", href: "#" }}
                  tip="Pro-Tip: Assigning subjects automatically configures default coefficients for terminal report cards."
                />
              </div>

              {/* Dashed Empty State */}
              <div className="p-4 rounded-[8px] bg-[#FAF8F5] border border-[#E8DFC9]">
                <span className="text-[10px] font-bold text-[#888888] uppercase block mb-2">Variant: Dashed Placeholder</span>
                <EmptyState
                  variant="dashed"
                  title="No Timetable Profiles Created"
                  description="Set up class start times, period lengths, and breaks for General or Technical subsystems."
                  action={{ label: "Create Bell Schedule", href: "/dashboard/academics/timetable" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* STATE 2: LOADING STATE */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8DFC9] pb-3">
              <h2 className="text-base font-extrabold text-[#142010]">2. Loading State Showcase</h2>
              <p className="text-xs text-[#525E4B]">Zero-Cumulative-Layout-Shift (CLS) skeleton loaders & interactive spinners.</p>
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-[#142010] block mb-2">KPI Metric Card Skeletons</span>
                <CardGridSkeleton count={4} />
              </div>

              <div>
                <span className="text-xs font-bold text-[#142010] block mb-2">Student Directory Table Skeleton</span>
                <TableSkeleton rows={4} columns={5} />
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <LoadingButton isLoading={true} loadingText="Saving Assessment Marks...">
                  Save Marks
                </LoadingButton>
                <LoadingButton isLoading={false}>
                  Standard Button
                </LoadingButton>
              </div>
            </div>
          </div>
        )}

        {/* STATE 3: ERROR STATE */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8DFC9] pb-3">
              <h2 className="text-base font-extrabold text-[#142010]">3. Error State Showcase</h2>
              <p className="text-xs text-[#525E4B]">Actionable errors with expandable diagnostics and WhatsApp support codes.</p>
            </div>

            <div className="space-y-6">
              {/* Full Card Error */}
              <ErrorState
                title="Failed to Load Academic Results"
                message="The connection to the cloud database timed out while calculating terminal class ranks. Your entered marks remain safely preserved."
                errorCode="ERR_PG_RANK_TIMEOUT_408"
                error="Postgres query exceeded 15000ms threshold on view 'vw_terminal_rankings'."
                onRetry={() => alert("Retrying academic results query...")}
              />

              {/* Compact Banner Error */}
              <ErrorState
                compact={true}
                title="Could not submit mark sheet"
                message="Marks submission rejected: 2 students in Form 5 Arts have missing Continuous Assessment scores."
                onRetry={() => alert("Retrying submission...")}
              />
            </div>
          </div>
        )}

        {/* STATE 4: NO INTERNET */}
        {activeTab === 4 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8DFC9] pb-3">
              <h2 className="text-base font-extrabold text-[#142010]">4. No Internet State Showcase</h2>
              <p className="text-xs text-[#525E4B]">Offline resilience tailored for African power and telecommunication cuts.</p>
            </div>

            <NoInternetCard
              title="No Internet Connection Detected"
              description="You can continue typing marks and taking attendance in full offline mode. Everything is saved locally on your device."
              onRetry={() => alert("Probing network...")}
            />
          </div>
        )}

        {/* STATE 5: SLOW NETWORK */}
        {activeTab === 5 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8DFC9] pb-3">
              <h2 className="text-base font-extrabold text-[#142010]">5. Slow Network State Showcase</h2>
              <p className="text-xs text-[#525E4B]">2G Edge / high latency warning to prevent impatient users from refreshing.</p>
            </div>

            <SlowNetworkAlert
              message="Unusually high latency detected (2G connection). Your 45 mark entries are safe and currently transmitting to the server. Please keep this tab open."
              onSaveLocally={() => alert("Saved marks as device draft.")}
            />
          </div>
        )}

        {/* STATE 6: NO SEARCH RESULTS */}
        {activeTab === 6 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8DFC9] pb-3">
              <h2 className="text-base font-extrabold text-[#142010]">6. No Search Results Showcase</h2>
              <p className="text-xs text-[#525E4B]">Helpful suggestions when a search query matches zero records.</p>
            </div>

            <NoSearchResultsState
              query="Ngwa Clovis Form 7"
              activeFilters={[
                { label: "Class", value: "Form 5 Arts" },
                { label: "Term", value: "Term 1" },
              ]}
              onClearSearch={() => alert("Cleared search query")}
              onResetAll={() => alert("Reset all filters")}
            />
          </div>
        )}

        {/* STATE 7: PERMISSION DENIED */}
        {activeTab === 7 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8DFC9] pb-3">
              <h2 className="text-base font-extrabold text-[#142010]">7. Permission Denied Showcase (403)</h2>
              <p className="text-xs text-[#525E4B]">Clear institutional boundary guidance showing current role vs required role.</p>
            </div>

            <PermissionDeniedState
              title="Financial Ledger Access Restricted"
              message="Only appointed School Bursars, Principals, and Proprietors have authorization to view and issue student fee receipts."
              currentRole="Teacher"
              requiredRole="Bursar, Principal, or School Administrator"
              resourceName="Fee Management & Bursary Ledger"
            />
          </div>
        )}

        {/* STATE 8: SESSION EXPIRED */}
        {activeTab === 8 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8DFC9] pb-3">
              <h2 className="text-base font-extrabold text-[#142010]">8. Session Expired Showcase (401)</h2>
              <p className="text-xs text-[#525E4B]">Protects teachers from losing entered marks when auth expires.</p>
            </div>

            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-[#525E4B]">
                Click below to simulate a 401 session timeout while preserving uncommitted inputs in local storage:
              </p>
              <button
                type="button"
                onClick={() => setIsSessionModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[6px] bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>Simulate 401 Session Expired Modal</span>
              </button>
            </div>

            <SessionExpiredModal
              isOpen={isSessionModalOpen}
              onSuccess={() => setIsSessionModalOpen(false)}
              hasUnsavedChanges={true}
            />
          </div>
        )}

        {/* STATE 9: FORM VALIDATION */}
        {activeTab === 9 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8DFC9] pb-3">
              <h2 className="text-base font-extrabold text-[#142010]">9. Real-Time Form Validation Showcase</h2>
              <p className="text-xs text-[#525E4B]">Flags mistakes right where it happens — with live Cameroon educational rules.</p>
            </div>

            <form className="max-w-xl mx-auto space-y-4" onSubmit={(e) => { e.preventDefault(); setIsSavedSuccess(true); }}>
              {isSavedSuccess && (
                <SuccessBanner message="All form validation checks passed successfully!" />
              )}

              {/* Field 1: Phone */}
              <FormField
                label="Parent / Guardian Cameroon Phone"
                id="phoneInput"
                required={true}
                error={phoneError}
                helperText="Must be a valid 9-digit Cameroon mobile number (MTN, Orange, or Camtel)."
              >
                <ValidatedInput
                  id="phoneInput"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  error={phoneError}
                  isValid={!phoneError && Boolean(phone)}
                  placeholder="677 123 456"
                />
              </FormField>

              {/* Field 2: Score */}
              <FormField
                label="Sequence Assessment Score (/20.00)"
                id="scoreInput"
                required={true}
                error={scoreError}
                helperText="Enter score out of 20. Try typing 25 to see the instant error flag."
              >
                <ValidatedInput
                  id="scoreInput"
                  value={score}
                  onChange={(e) => handleScoreChange(e.target.value)}
                  error={scoreError}
                  isValid={!scoreError && Boolean(score)}
                  placeholder="e.g. 15.50"
                />
              </FormField>

              {/* Field 3: Coefficient */}
              <FormField
                label="Subject Coefficient"
                id="coefInput"
                required={true}
                error={coefError}
                helperText="Secondary school coefficients typically range from 1.00 to 5.00."
              >
                <ValidatedInput
                  id="coefInput"
                  value={coef}
                  onChange={(e) => handleCoefChange(e.target.value)}
                  error={coefError}
                  isValid={!coefError && Boolean(coef)}
                  placeholder="2"
                />
              </FormField>

              {/* Field 4: Matricule */}
              <FormField
                label="Official Student Matricule"
                id="matInput"
                required={true}
                error={matriculeError}
              >
                <ValidatedInput
                  id="matInput"
                  value={matricule}
                  onChange={(e) => handleMatriculeChange(e.target.value)}
                  error={matriculeError}
                  isValid={!matriculeError && Boolean(matricule)}
                />
              </FormField>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={Boolean(phoneError || scoreError || coefError || matriculeError)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Validated Record</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STATE 10: SUCCESS STATE */}
        {activeTab === 10 && (
          <div className="space-y-6">
            <div className="border-b border-[#E8DFC9] pb-3">
              <h2 className="text-base font-extrabold text-[#142010]">10. Success State Showcase</h2>
              <p className="text-xs text-[#525E4B]">Affirmative feedback confirming completed academic or financial actions.</p>
            </div>

            <SuccessCard
              badgeText="Sequence Finalized"
              title="Form 5 Arts Marks Approved & Locked"
              message="All 54 student marks for Computer Science (Sequence 2) have been verified and submitted for official MINESEC report card generation."
              details={[
                { label: "Class Stream", value: "Form 5 Arts" },
                { label: "Subject", value: "Computer Science (Coef 3)" },
                { label: "Class Average", value: "14.28 / 20.00" },
                { label: "Approved By", value: `${userRole} (John Doe)` },
                { label: "Locked At", value: new Date().toLocaleDateString() },
              ]}
              primaryAction={{ label: "Generate Class Rank List", onClick: () => alert("Generating class ranks...") }}
              secondaryAction={{ label: "Go to Next Class", onClick: () => alert("Navigating to next class...") }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default StatesShowcaseClient;
