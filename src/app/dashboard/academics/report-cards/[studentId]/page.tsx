import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/tenancy/context";
import { getActiveAcademicYear, getSchoolTeacherAssignments } from "@/lib/academic/service";
import { getStudentReportCard } from "@/lib/academic/report-card-service";
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
    !roleCode ||
    roleCode === "school_admin" ||
    roleCode === "principal" ||
    roleCode === "superadmin" ||
    Boolean(context?.hasPermission("school.settings.manage")) ||
    Boolean(context?.hasPermission("academics.manage"));

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

  const reportCardData = await getStudentReportCard(schoolId, term.id, studentId);
  if (!reportCardData) notFound();

  // If student record not found in database, provide sample demo record based on the official MINESEC sample
  const data = reportCardData || {
    school: {
      name: context?.school?.name || "GOVERNMENT BILINGUAL HIGH SCHOOL BAMENDA",
      code: "GBHS-BDA",
      address: "P.O. Box 24, Bamenda, North West Region",
      phone: "+237 677 000 000",
      email: "info@gbhsbamenda.cm",
      regionalDelegation: "NORTH WEST REGION",
      divisionalDelegation: "MEZAM DIVISION",
      subsystem: "anglophone",
    },
    term: {
      id: "term-1",
      name: "First Term",
      termNumber: 1 as const,
      academicYearName: activeYear?.name || "2026/2027",
    },
    student: {
      id: studentId,
      matricule: "GBHS-2024-041",
      fullName: "NKWENTI BRIAN NGWA",
      dateOfBirth: "14/05/2011",
      placeOfBirth: "Bamenda",
      gender: "M" as const,
      residenceStatus: "day" as const,
      guardianName: "M. Ngwa Thomas",
      guardianPhone: "+237 675 112 233",
      isRepeater: false,
    },
    classInfo: {
      className: "Form 2",
      streamName: "Form 2 Science A",
      classEnrolment: 48,
      classMasterName: "M. Talla Robert",
    },
    subjects: [
      {
        subjectId: "sub-1",
        subjectName: "FRENCH",
        teacherName: "Mme. Ngo Ndongo",
        competencies: [
          "Se servir du français pour échanger avec les membres de sa communauté sur la vie familiale, scolaire et l'orientation.",
          "Se servir de ses connaissances en français pour tenir un échange basé sur l'hygiène et la salubrité.",
        ],
        seqAMark: 14.5,
        seqBMark: 15.0,
        termAverage: 14.75,
        coefficient: 4,
        weightedScore: 59.0,
        grade: "B",
        cba: "SA" as const,
        minClassScore: 7.0,
        maxClassScore: 18.0,
        remarks: "Bon travail d'ensemble.",
      },
      {
        subjectId: "sub-2",
        subjectName: "COMPUTER SCIENCES",
        teacherName: "M. Chi Elvis",
        competencies: [
          "Classify hardware and software components of a computer, and carry out basic maintenance.",
          "Use appropriate application software or internet services to accomplish tasks.",
        ],
        seqAMark: 16.0,
        seqBMark: 17.0,
        termAverage: 16.5,
        coefficient: 2,
        weightedScore: 33.0,
        grade: "A",
        cba: "SA" as const,
        minClassScore: 9.0,
        maxClassScore: 19.5,
        remarks: "Very good analytical skills.",
      },
      {
        subjectId: "sub-3",
        subjectName: "ENGLISH LANGUAGE",
        teacherName: "M. Nfor John",
        competencies: [
          "Use English language skills (listening, speaking, reading, writing) to satisfy basic communicative needs.",
          "Use English resources to describe community activities and access public services.",
        ],
        seqAMark: 15.0,
        seqBMark: 16.0,
        termAverage: 15.5,
        coefficient: 4,
        weightedScore: 62.0,
        grade: "A",
        cba: "SA" as const,
        minClassScore: 8.5,
        maxClassScore: 17.5,
        remarks: "Good expression and grammar.",
      },
      {
        subjectId: "sub-4",
        subjectName: "MATHEMATICS",
        teacherName: "M. Fongang Paul",
        competencies: [
          "Use mathematical reasoning and language to solve problem situations relating to numbers, fractions, and geometry.",
        ],
        seqAMark: 17.5,
        seqBMark: 18.0,
        termAverage: 17.75,
        coefficient: 4,
        weightedScore: 71.0,
        grade: "A+",
        cba: "EXP" as const,
        minClassScore: 4.5,
        maxClassScore: 19.0,
        remarks: "Exceptional mathematical logic.",
      },
      {
        subjectId: "sub-5",
        subjectName: "PHYSICS",
        teacherName: "M. Tcheunche Guy",
        competencies: [
          "Use scientific reasoning and language relating to data collection, predicting, and measurements.",
          "Solve situations relating to thermal insulation and action of heat on materials.",
        ],
        seqAMark: 15.0,
        seqBMark: 16.0,
        termAverage: 15.5,
        coefficient: 2,
        weightedScore: 31.0,
        grade: "A",
        cba: "SA" as const,
        minClassScore: 6.0,
        maxClassScore: 18.5,
        remarks: "Very solid understanding of physical concepts.",
      },
      {
        subjectId: "sub-6",
        subjectName: "CHEMISTRY",
        teacherName: "Mme. Bih Florence",
        competencies: [
          "Use scientific terminology relating to subatomic particles, simple atomic models, and compound formulae.",
        ],
        seqAMark: 13.5,
        seqBMark: 14.5,
        termAverage: 14.0,
        coefficient: 2,
        weightedScore: 28.0,
        grade: "B",
        cba: "SA" as const,
        minClassScore: 5.5,
        maxClassScore: 17.0,
        remarks: "Consistent work throughout the term.",
      },
      {
        subjectId: "sub-7",
        subjectName: "BIOLOGY",
        teacherName: "M. Fon Michael",
        competencies: [
          "Use scientific reasoning relating to agriculture, crop yield, and food transformation.",
        ],
        seqAMark: 14.0,
        seqBMark: 14.0,
        termAverage: 14.0,
        coefficient: 2,
        weightedScore: 28.0,
        grade: "B",
        cba: "SA" as const,
        minClassScore: 7.0,
        maxClassScore: 16.5,
        remarks: "Satisfactory biological reasoning.",
      },
      {
        subjectId: "sub-8",
        subjectName: "CITIZENSHIP EDUCATION",
        teacherName: "M. Njie Samuel",
        competencies: [
          "Promotion of national integration: manifestations and hindrances.",
        ],
        seqAMark: 16.0,
        seqBMark: 16.0,
        termAverage: 16.0,
        coefficient: 2,
        weightedScore: 32.0,
        grade: "A",
        cba: "SA" as const,
        minClassScore: 10.0,
        maxClassScore: 18.0,
        remarks: "Exemplary civic attitude.",
      },
    ],
    summary: {
      totalCoef: 22,
      totalWeightedScore: 344.0,
      studentAverage: 15.64,
      subjectsPassed: 8,
      totalSubjects: 8,
      letterGrade: "A",
      cbaAppreciation: "SA" as const,
      rank: 3,
      rankingEnabled: true,
    },
    classProfile: {
      classAverage: 12.85,
      minAverage: 6.4,
      maxAverage: 18.15,
      numberPassed: 41,
      successRate: 85.4,
    },
    discipline: {
      unjustifiedAbsHours: 0,
      justifiedAbsHours: 2,
      lateCount: 1,
      punishmentHours: 0,
      warning: false,
      reprimand: false,
      suspension: false,
      dismissed: false,
    },
    remarks: {
      performanceRemarks:
        "Outstanding academic achievement this term. Consistently disciplined and hardworking.",
      classMasterRemarks:
        "Brian is an exemplary student who sets a positive model for his peers in Form 2.",
      principalRemarks: "Approved and sealed by Academic Council. Promoted with honors.",
    },
  };

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
            <PrintButton />
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#FFF8CF] border border-[#FBE6C2] text-[#4A3D00] text-xs font-semibold">
              <Eye className="w-3.5 h-3.5 text-[#B45309]" />
              <span>View Only</span>
            </div>
          )}
        </div>
      </div>

      {/* Official Report Card Component */}
      <div className="report-card-print-sheet bg-white rounded-[8px] shadow-sm border border-[#E8DFC9] p-2 sm:p-4 print:p-0 print:border-none print:shadow-none">
        <ReportCardRenderer data={data} canPrint={canPrint} />
      </div>
    </div>
  );
}
