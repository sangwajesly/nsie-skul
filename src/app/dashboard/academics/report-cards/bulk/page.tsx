import Link from "next/link";
import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenancy/context";
import {
  getActiveAcademicYear,
  getSchoolClasses,
  getSchoolTeacherAssignments,
} from "@/lib/academic/service";
import { getClassStreamReportCards, checkAndRegisterTrialClass } from "@/lib/academic/report-card-service";
import { createClient } from "@/lib/supabase/server";
import { BulkReportCardsView } from "./BulkReportCardsView";
import { Lock, MessageCircle, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

interface BulkReportCardsPageProps {
  searchParams: Promise<{
    classStreamId?: string;
    termNumber?: string;
    sortBy?: "rank" | "alphabetical";
  }>;
}

export default async function BulkReportCardsPage({
  searchParams,
}: BulkReportCardsPageProps) {
  const params = await searchParams;
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";

  if (!context) {
    redirect("/login");
  }

  // 1. Permission Check: Only Class Masters and School Administrators can access bulk report cards
  const canViewReportCards = Boolean(context.hasPermission("report_cards.view"));
  if (!canViewReportCards) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center space-y-4">
        <div className="p-8 rounded-[10px] bg-white border border-[#E8DFC9] shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FFF8CF] text-[#B45309] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-red-700">Access Restricted</h1>
          <p className="text-xs text-[#525E4B] max-w-md mx-auto">
            Bulk report card generation and printing is restricted to designated Class Masters and School Administrators.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/academics/marks"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-semibold"
            >
              Go to Marks &amp; Grades
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Subscription Check: Enforce active license for bulk report card generation
  if (context.subscription?.isExpired) {
    const schoolCode = context.school.code || context.school.slug;
    const whatsappMsg = encodeURIComponent(
      `Hello Nsei Skul Billing, I have sent payment for ${context.school.name} (Code: ${schoolCode}). Please activate our school license.`
    );
    const whatsappUrl = `https://wa.me/237682833601?text=${whatsappMsg}`;

    return (
      <div className="mx-auto max-w-xl py-12 px-4 text-center space-y-4">
        <div className="p-8 rounded-[12px] bg-white border border-[#FCA5A5] shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-[#991B1B]">
            School License Activation Required
          </h1>
          <p className="text-xs text-[#525E4B] max-w-md mx-auto leading-relaxed">
            Your school&apos;s pilot trial has ended. To unlock official MINESEC report card generation, class rankings, and bulk PDF printing for your students, please activate your school license.
          </p>

          <div className="p-4 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9] max-w-sm mx-auto text-left space-y-2 text-xs">
            <div className="font-bold text-[#142010] flex items-center justify-between">
              <span>MTN Mobile Money:</span>
              <span className="text-[10px] font-bold text-[#2A7C13] uppercase">Cameroon</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0EFEA]">
              <span className="text-[#666666]">Number:</span>
              <strong className="font-mono text-[#2A7C13] text-sm">682 833 601</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F0EFEA]">
              <span className="text-[#666666]">Account Name:</span>
              <strong className="text-[#142010]">Mbongih Jesly Sangwa</strong>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-[#666666]">Reference Code:</span>
              <strong className="font-mono text-[#2A7C13]">{schoolCode}</strong>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm on WhatsApp (Instant Activation)</span>
            </a>
            <Link
              href="/dashboard/settings#license"
              className="px-4 py-2 text-xs font-semibold text-[#525E4B] hover:text-[#142010]"
            >
              View Billing Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeYear = await getActiveAcademicYear(schoolId);
  const requestedTermNumber = Number(params.termNumber || 1);

  if (!activeYear || ![1, 2, 3].includes(requestedTermNumber)) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center space-y-3">
        <h1 className="text-base font-bold text-[#142010]">Invalid Academic Year or Term</h1>
        <p className="text-xs text-[#525E4B]">
          Please set an active academic year and choose a valid term (1, 2, or 3).
        </p>
        <Link
          href="/dashboard/academics/report-cards"
          className="text-xs font-semibold text-[#2A7C13] underline"
        >
          Return to Report Cards Hub
        </Link>
      </div>
    );
  }

  const supabase = await createClient();

  // 2. Fetch Term
  const { data: term } = await supabase
    .from("terms")
    .select("id, name, term_number")
    .eq("school_id", schoolId)
    .eq("academic_year_id", activeYear.id)
    .eq("term_number", requestedTermNumber)
    .maybeSingle();

  if (!term) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center space-y-3">
        <h1 className="text-base font-bold text-[#142010]">Term Not Found</h1>
        <p className="text-xs text-[#525E4B]">
          Term {requestedTermNumber} has not been configured for {activeYear.name}.
        </p>
        <Link
          href="/dashboard/academics/report-cards"
          className="text-xs font-semibold text-[#2A7C13] underline"
        >
          Return to Report Cards Hub
        </Link>
      </div>
    );
  }

  // 3. Resolve Class Stream & Authority
  const classesWithStreams = await getSchoolClasses(schoolId, activeYear.id);
  const allStreams = classesWithStreams.flatMap((c) => c.streams);

  const selectedStreamId = params.classStreamId || allStreams[0]?.id;
  const selectedStream = allStreams.find((s) => s.id === selectedStreamId) || null;

  if (!selectedStream) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center space-y-3">
        <h1 className="text-base font-bold text-[#142010]">Class Group Not Found</h1>
        <p className="text-xs text-[#525E4B]">
          The requested class stream could not be found.
        </p>
        <Link
          href="/dashboard/academics/report-cards"
          className="text-xs font-semibold text-[#2A7C13] underline"
        >
          Return to Report Cards Hub
        </Link>
      </div>
    );
  }

  // 4. Trial Limit Check: Allow up to 3 classes in trial mode; prompt for payment on the 4th
  let trialClassInfo: { usedClassCount: number; maxTrialClasses: number } | null = null;
  if (context.subscription?.isTrial) {
    const trialCheck = await checkAndRegisterTrialClass(
      schoolId,
      context.user.id,
      selectedStream.id,
      selectedStream.name
    );

    if (!trialCheck.allowed) {
      const schoolCode = context.school.code || context.school.slug;
      const whatsappMsg = encodeURIComponent(
        `Hello Nsei Skul Billing, I have sent payment for ${context.school.name} (Code: ${schoolCode}). Please activate our school license.`
      );
      const whatsappUrl = `https://wa.me/237682833601?text=${whatsappMsg}`;

      return (
        <div className="mx-auto max-w-xl py-12 px-4 text-center space-y-4">
          <div className="p-8 rounded-[12px] bg-white border border-[#FCA5A5] shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-[#991B1B]">
              Trial Class Limit Reached (3 of 3 Classes Used)
            </h1>
            <p className="text-xs text-[#525E4B] max-w-md mx-auto leading-relaxed">
              Your trial allows generating complete report cards for up to <strong>3 classes</strong>.
              You have already generated report cards for: <strong>{trialCheck.usedStreamNames.join(", ")}</strong>.
            </p>
            <p className="text-xs text-[#666666] max-w-md mx-auto">
              To generate report cards for <strong>{selectedStream.name}</strong> and additional classes without trial watermarks, please activate your school license.
            </p>

            <div className="p-4 rounded-[8px] bg-[#FFFDF5] border border-[#E8DFC9] max-w-sm mx-auto text-left space-y-2 text-xs">
              <div className="font-bold text-[#142010] flex items-center justify-between">
                <span>MTN Mobile Money:</span>
                <span className="text-[10px] font-bold text-[#2A7C13] uppercase">Cameroon</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EFEA]">
                <span className="text-[#666666]">Number:</span>
                <strong className="font-mono text-[#2A7C13] text-sm">682 833 601</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EFEA]">
                <span className="text-[#666666]">Account Name:</span>
                <strong className="text-[#142010]">Mbongih Jesly Sangwa</strong>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[#666666]">Reference Code:</span>
                <strong className="font-mono text-[#2A7C13]">{schoolCode}</strong>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[7px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-bold shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirm on WhatsApp (Instant Activation)</span>
              </a>
              <Link
                href="/dashboard/settings#license"
                className="px-4 py-2 text-xs font-semibold text-[#525E4B] hover:text-[#142010]"
              >
                View Billing Details
              </Link>
            </div>
          </div>
        </div>
      );
    }

    trialClassInfo = {
      usedClassCount: trialCheck.usedClassCount,
      maxTrialClasses: trialCheck.maxTrialClasses,
    };
  }

  // Verify authorization
  const roleCode = context.role?.code || "teacher";
  const isAdmin =
    !roleCode ||
    roleCode === "school_admin" ||
    roleCode === "principal" ||
    roleCode === "superadmin" ||
    Boolean(context.hasPermission("school.settings.manage")) ||
    Boolean(context.hasPermission("academics.manage"));

  if (!isAdmin) {
    const isClassMasterOfStream = selectedStream.class_master_id === context.user.id;

    if (!isClassMasterOfStream) {
      return (
        <div className="mx-auto max-w-2xl py-12 text-center space-y-4">
          <div className="p-8 rounded-[10px] bg-white border border-[#E8DFC9] shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FFF8CF] text-[#B45309] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-[#142010]">Batch Export Restricted</h1>
            <p className="text-xs text-[#525E4B] max-w-md mx-auto leading-relaxed">
              Exporting batch PDFs and printing official report cards is restricted to School Administrators and the designated Class Master (<em>Professeur Principal</em>) for {selectedStream.name}.
            </p>
            <p className="text-xs text-[#525E4B]">
              As a subject teacher, you can inspect individual student mark entry on the report card hub.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/academics/report-cards"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white text-xs font-semibold shadow-xs"
              >
                Back to Report Cards Hub
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  // 4. Fetch All Report Cards for the Class Stream
  const reportCards = await getClassStreamReportCards(schoolId, term.id, selectedStream.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6 print:space-y-0 print:max-w-none print:m-0 print:p-0">
      {/* Print Specific CSS Rules for Seamless Multi-Page A4 Break */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 5mm 6mm;
              }
              body {
                background-color: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .report-card-print-sheet {
                page-break-after: always !important;
                break-after: page !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
              }
              .report-card-print-sheet:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
            }
          `,
        }}
      />

      {/* Interactive Bulk View with Rank / Alphabetical Sort and Print */}
      <BulkReportCardsView
        reportCards={reportCards}
        classNameTitle={selectedStream.name}
        termName={term.name}
        classStreamId={selectedStream.id}
        termNumber={requestedTermNumber}
        initialSortBy={params.sortBy}
        isTrial={context.subscription?.isTrial}
      />
    </div>
  );
}
