import Link from "next/link";
import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenancy/context";
import {
  getActiveAcademicYear,
  getSchoolClasses,
  getSchoolTeacherAssignments,
} from "@/lib/academic/service";
import { getClassStreamReportCards } from "@/lib/academic/report-card-service";
import { createClient } from "@/lib/supabase/server";
import { MinesecReportCard } from "@/components/academic/MinesecReportCard";
import { BulkPrintControls } from "./BulkPrintControls";
import { ArrowLeft, Lock, Users } from "lucide-react";

export const dynamic = "force-dynamic";

interface BulkReportCardsPageProps {
  searchParams: Promise<{
    classStreamId?: string;
    termNumber?: string;
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

  // Verify Class Master authorization
  const roleCode = context.role?.code || "teacher";
  const isClassMaster = Boolean(context.isClassMaster || roleCode === "class_master");
  const isAdmin = !roleCode || roleCode === "school_admin" || roleCode === "principal" || roleCode === "superadmin";

  if (isClassMaster && !isAdmin) {
    const teacherAssignments = await getSchoolTeacherAssignments(schoolId, activeYear.id, context.user.id);
    const assignedStreamIds = new Set(teacherAssignments.map((a) => a.class_stream_id));

    const hasAuthority =
      selectedStream.class_master_id === context.user.id || assignedStreamIds.has(selectedStream.id);

    if (!hasAuthority) {
      return (
        <div className="mx-auto max-w-2xl py-12 text-center space-y-3">
          <h1 className="text-base font-bold text-red-700">Access Denied</h1>
          <p className="text-xs text-[#525E4B]">
            You can only export report cards for the class group you supervise as Class Master.
          </p>
          <Link
            href="/dashboard/academics/report-cards"
            className="text-xs font-semibold text-[#2A7C13] underline"
          >
            Back to Report Cards Hub
          </Link>
        </div>
      );
    }
  }

  // 4. Fetch All Report Cards for the Class Stream
  const reportCards = await getClassStreamReportCards(schoolId, term.id, selectedStream.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Print Specific CSS Rules for Seamless Multi-Page A4 Break */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 6mm;
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

      {/* Floating Control Toolbar (Hidden during actual print) */}
      <BulkPrintControls
        classNameTitle={selectedStream.name}
        termName={term.name}
        studentCount={reportCards.length}
        classStreamId={selectedStream.id}
        termNumber={requestedTermNumber}
      />

      {/* Report Cards Container */}
      {reportCards.length === 0 ? (
        <div className="p-12 text-center rounded-[8px] bg-white border border-[#E8DFC9] space-y-3">
          <Users className="w-8 h-8 text-[#888888] mx-auto" />
          <h2 className="text-sm font-bold text-[#142010]">No Enrolled Students Found</h2>
          <p className="text-xs text-[#525E4B] max-w-sm mx-auto">
            There are currently no active students enrolled in {selectedStream.name} for {activeYear.name}.
          </p>
          <Link
            href="/dashboard/academics/report-cards"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#F5F5F0] text-xs font-semibold border border-[#D5D5CF]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Report Cards Hub</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-8 print:space-y-0">
          {reportCards.map((rc) => (
            <div
              key={rc.student.id}
              className="report-card-print-sheet bg-white rounded-[8px] shadow-sm border border-[#E8DFC9] p-4 sm:p-6 print:p-0 print:border-none print:shadow-none"
            >
              <MinesecReportCard data={rc} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
