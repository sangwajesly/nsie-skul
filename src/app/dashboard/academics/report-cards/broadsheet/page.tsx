import Link from "next/link";
import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenancy/context";
import {
  getActiveAcademicYear,
  getSchoolClasses,
  getSchoolTeacherAssignments,
} from "@/lib/academic/service";
import { getClassStreamReportCards } from "@/lib/academic/report-card-service";
import { getStudentBills } from "@/lib/finance/service";
import { createClient } from "@/lib/supabase/server";
import { isSchoolHubMode } from "@/lib/hub/hub-node-store";
import { BroadSheetViewClient } from "./BroadSheetViewClient";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

interface BroadSheetPageProps {
  searchParams: Promise<{
    classStreamId?: string;
    termNumber?: string;
    sortBy?: "rank" | "alphabetical";
  }>;
}

export default async function BroadSheetPage({ searchParams }: BroadSheetPageProps) {
  const params = await searchParams;
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";

  if (!context) {
    redirect("/login");
  }

  // 1. Permission Check: Class Masters, HODs, and Administrators can view the deliberation broad sheet
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
            The Class Council Master Broad Sheet (PV de Délibération) is restricted to designated Class Masters, Academic Deans, and School Administrators.
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

  let term: { id: string; name: string; term_number: number } | null = null;

  // On-premise School Hub: query local PostgreSQL cluster directly (<1ms)
  if (isSchoolHubMode()) {
    try {
      const { queryLocalDb } = await import("@/lib/db/local-postgres");
      const termRes = await queryLocalDb(
        `SELECT id, name, term_number FROM public.terms 
         WHERE school_id = $1 AND academic_year_id = $2 AND term_number = $3 
         LIMIT 1`,
        [schoolId, activeYear.id, requestedTermNumber]
      );
      if (termRes.rows.length > 0) {
        term = termRes.rows[0];
      }
    } catch {}
  }

  // Cloud query fallback
  if (!term) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("terms")
        .select("id, name, term_number")
        .eq("school_id", schoolId)
        .eq("academic_year_id", activeYear.id)
        .eq("term_number", requestedTermNumber)
        .maybeSingle();
      term = data;
    } catch {}
  }

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

  // 3. Resolve Class Streams
  const roleCode = context?.role?.code || "teacher";
  const isHod = !roleCode || roleCode === "hod" || Boolean(context?.isHod);
  const isAdmin =
    roleCode === "school_admin" ||
    roleCode === "principal" ||
    roleCode === "superadmin" ||
    Boolean(context?.hasPermission("school.settings.manage"));

  const classesWithStreams = await getSchoolClasses(schoolId, activeYear.id);
  const allStreams = classesWithStreams.flatMap((c) => c.streams);

  const teacherAssignments = context?.user?.id
    ? await getSchoolTeacherAssignments(schoolId, activeYear.id, context.user.id)
    : [];

  const assignedStreamIds = new Set(teacherAssignments.map((a) => a.class_stream_id));

  const visibleStreams = (isAdmin || isHod)
    ? allStreams
    : allStreams.filter(
        (s) => s.class_master_id === context?.user?.id || assignedStreamIds.has(s.id)
      );

  const defaultStreamId = params.classStreamId || (visibleStreams[0]?.id ?? undefined);
  const selectedStream = visibleStreams.find((s) => s.id === defaultStreamId) || null;

  if (!selectedStream) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center space-y-3">
        <h1 className="text-base font-bold text-[#142010]">No Class Stream Available</h1>
        <p className="text-xs text-[#525E4B]">
          You do not have access to any class streams or none are configured.
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

  // 4. Fetch Full Class Academic Data and Fee Bills in parallel
  const [reportCards, studentBills] = await Promise.all([
    getClassStreamReportCards(schoolId, term.id, selectedStream.id),
    getStudentBills(schoolId, activeYear.id, selectedStream.id),
  ]);

  // Build Debtor lookup map: studentId -> { balance, status, totalAmount, paidAmount }
  const debtorMap: Record<string, { balance: number; status: string; total: number; paid: number }> = {};
  for (const b of studentBills || []) {
    debtorMap[b.student_id] = {
      balance: b.balance,
      status: b.status,
      total: b.total_billed,
      paid: b.total_paid,
    };
  }

  return (
    <BroadSheetViewClient
      reportCards={reportCards}
      debtorMap={debtorMap}
      visibleStreams={visibleStreams}
      selectedStreamId={selectedStream.id}
      selectedTermNumber={requestedTermNumber}
      initialSortBy={params.sortBy || "rank"}
    />
  );
}
