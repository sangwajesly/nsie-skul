import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/tenancy/context";
import { getActiveAcademicYear, getSchoolTeacherAssignments } from "@/lib/academic/service";
import { getStudentReportCard, checkAndRegisterTrialClass } from "@/lib/academic/report-card-service";
import { createClient } from "@/lib/supabase/server";
import { ReportCardRenderer } from "@/components/academic/ReportCardRenderer";
import { ArrowLeft, Eye, ShieldAlert, MessageCircle } from "lucide-react";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

interface ReportCardPageProps {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ termNumber?: string }>;
}

export default async function StudentReportCardPage({
  params,
  searchParams,
}: ReportCardPageProps) {
  const { studentId } = await params;
  const { termNumber } = await searchParams;

  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";

  const activeYear = await getActiveAcademicYear(schoolId);
  const requestedTermNumber = Number(termNumber || 1);

  // Subscription Check: Block official individual report card printing if license is expired
  if (context?.subscription?.isExpired) {
    const schoolCode = context.school.code || context.school.slug;
    const whatsappMsg = encodeURIComponent(
      `Hello Nsei Sukul Billing, I have sent payment for ${context.school.name} (Code: ${schoolCode}). Please activate our school license.`
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
            Your school&apos;s pilot trial has ended. To unlock official MINESEC report card generation, class rankings, and printing for this student, please activate your school license.
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
              <strong className="text-[#142010]">Nsei Sukul Technologies</strong>
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
              <span>Confirm on WhatsApp</span>
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

  if (!activeYear || ![1, 2, 3].includes(requestedTermNumber)) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 py-10 text-center">
        <h1 className="text-lg font-bold text-[#191919]">Report card not available</h1>
        <p className="text-sm text-[#666666]">
          Set a current school year and school terms before opening a report card.
        </p>
        <Link href="/dashboard/academics" className="text-sm font-semibold text-[#2A7C13] underline">
          Go to school setup
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: term } = await supabase
    .from("terms")
    .select("id")
    .eq("school_id", schoolId)
    .eq("academic_year_id", activeYear.id)
    .eq("term_number", requestedTermNumber)
    .maybeSingle();

  if (!term) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 py-10 text-center">
        <h1 className="text-lg font-bold text-[#191919]">This term has not been set up</h1>
        <p className="text-sm text-[#666666]">
          Ask your school administrator to set up this term before opening report cards.
        </p>
        <Link href="/dashboard/academics/report-cards" className="text-sm font-semibold text-[#2A7C13] underline">
          Back to report cards
        </Link>
      </div>
    );
  }

  // Role-based authorization: Only Class Masters and School Administrators can view report cards
  const canViewReportCards = Boolean(context?.hasPermission("report_cards.view"));
  if (!canViewReportCards) {
    return (
      <div className="mx-auto max-w-3xl space-y-3 py-10 text-center">
        <h1 className="text-lg font-bold text-red-700">Access Denied</h1>
        <p className="text-sm text-[#666666]">
          Report card viewing and printing is restricted to Class Masters and School Administrators.
        </p>
        <Link href="/dashboard/academics/marks" className="text-sm font-semibold text-[#2A7C13] underline">
          Go to Marks &amp; Grades
        </Link>
      </div>
    );
  }

  const roleCode = context?.role?.code || "teacher";
  const isAdmin =
    roleCode === "school_admin" ||
    roleCode === "principal" ||
    roleCode === "superadmin" ||
    Boolean(context?.hasPermission("school.settings.manage"));

  // Fetch student enrolment to determine class stream and class master
  const { data: studentEnrolment } = await supabase
    .from("enrolments")
    .select("class_stream_id, class_stream:class_streams(class_master_id)")
    .eq("school_id", schoolId)
    .eq("academic_year_id", activeYear.id)
    .eq("student_id", studentId)
    .maybeSingle();

  const isStreamClassMaster = Boolean(
    studentEnrolment &&
      (studentEnrolment.class_stream as { class_master_id?: string | null })?.class_master_id === context?.user?.id
  );

  const canPrint = isAdmin || isStreamClassMaster;

  // Trial Class Limit: Enforce maximum 3 classes in trial mode
  if (context?.subscription?.isTrial && studentEnrolment?.class_stream_id) {
    const trialCheck = await checkAndRegisterTrialClass(
      schoolId,
      context.user.id,
      studentEnrolment.class_stream_id
    );

    if (!trialCheck.allowed) {
      const schoolCode = context.school.code || context.school.slug;
      const whatsappMsg = encodeURIComponent(
        `Hello Nsei Sukul Billing, I have sent payment for ${context.school.name} (Code: ${schoolCode}). Please activate our school license.`
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
              To view and print report cards for this class and additional classes without trial watermarks, please activate your school license.
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
                <strong className="text-[#142010]">Nsei Sukul Technologies</strong>
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
                <span>Confirm on WhatsApp</span>
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
  }

  let teacherAssignments: any[] = [];
  if (context?.user?.id) {
    teacherAssignments = await getSchoolTeacherAssignments(schoolId, activeYear.id, context.user.id);
  }

  // Only apply stream restrictions to non-admin staff (regular teachers & class masters)
  if (!isAdmin && context?.user?.id) {
    const assignedStreamIds = new Set(teacherAssignments.map((a) => a.class_stream_id));

    const isAuthorizedForStudent =
      isStreamClassMaster ||
      (studentEnrolment && assignedStreamIds.has(studentEnrolment.class_stream_id));

    if (!isAuthorizedForStudent) {
      return (
        <div className="mx-auto max-w-3xl space-y-3 py-10 text-center">
          <h1 className="text-lg font-bold text-red-700">Access Denied</h1>
          <p className="text-sm text-[#666666]">
            You can only view report cards for students in your assigned or supervised class groups.
          </p>
          <Link href="/dashboard/academics/report-cards" className="text-sm font-semibold text-[#2A7C13] underline">
            Back to report cards
          </Link>
        </div>
      );
    }
  }

  const data = await getStudentReportCard(schoolId, term.id, studentId);
  if (!data) notFound();

  // Security & scoping: Regular subject teachers can only view their own assigned subjects
  if (!canPrint && studentEnrolment) {
    const teacherStreamSubjectIds = new Set(
      teacherAssignments
        .filter((a) => a.class_stream_id === studentEnrolment.class_stream_id)
        .map((a) => a.subject_id)
    );
    const allowedSubjectIds =
      teacherStreamSubjectIds.size > 0
        ? teacherStreamSubjectIds
        : new Set(teacherAssignments.map((a) => a.subject_id));

    data.subjects = data.subjects.filter((s) => allowedSubjectIds.has(s.subjectId));
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:space-y-0 print:max-w-none print:m-0 print:p-0">
      {/* Print protection for unauthorized roles */}
      {!canPrint && (
        <style
          dangerouslySetInnerHTML={{
            __html: `@media print { body { display: none !important; } }`,
          }}
        />
      )}

      {/* Top Controls Bar (Hidden during actual print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/academics/report-cards"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] hover:bg-[#FFF8CF]/40 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Class Report Roster</span>
          </Link>
          <div className="text-xs text-[#525E4B]">
            Viewing report card for{" "}
            <strong className="text-[#142010]">{data.student.fullName}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canPrint ? (
            <PrintButton
              studentName={data.student.fullName}
              matricule={data.student.matricule}
              termName={data.term.name}
              schoolCode={data.school.code || data.school.name}
            />
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#FFF8CF] border border-[#FBE6C2] text-[#4A3D00] text-xs font-semibold">
              <Eye className="w-3.5 h-3.5 text-[#B45309]" />
              <span>View Only</span>
            </div>
          )}
        </div>
      </div>

      {/* Official Report Card Component */}
      <div className="report-card-print-sheet report-card-single-sheet overflow-x-auto bg-white rounded-[8px] shadow-sm border border-[#E8DFC9] p-2 sm:p-4 print:p-0 print:border-none print:shadow-none print:overflow-hidden print:max-h-[290mm]">
        <ReportCardRenderer data={data} canPrint={canPrint} isTrial={context?.subscription?.isTrial} />
      </div>
    </div>
  );
}
