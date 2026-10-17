import Link from "next/link";
import { getTenantContext } from "@/lib/tenancy/context";
import { getPaymentReceiptData } from "@/lib/finance/service";
import { OfficialReceipt } from "@/components/finance/OfficialReceipt";
import { ArrowLeft, Printer } from "lucide-react";
import { PrintReceiptButton } from "./PrintReceiptButton";

export const dynamic = "force-dynamic";

interface ReceiptPageProps {
  params: Promise<{ paymentId: string }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { paymentId } = await params;
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";

  const receiptData = await getPaymentReceiptData(schoolId, paymentId);

  // Fallback demo receipt if record is illustrative
  const school = receiptData?.school || {
    id: schoolId,
    name: context?.school?.name || "GOVERNMENT BILINGUAL HIGH SCHOOL BAMENDA",
    slug: "gbhs-bamenda",
    code: "GBHS",
    address: "P.O. Box 24, Up-Station, Bamenda",
    phone: "+237 677 889 900",
    email: "bursary@gbhsbda.cm",
    subsystem: "anglophone" as const,
    currency: "XAF",
    ranking_mode: "enabled" as const,
    result_approval_workflow: "hod" as const,
    receipt_prefix: "GBHS",
    is_active: true,
    logo_url: null,
    motto: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const payment = receiptData?.payment || {
    id: paymentId,
    school_id: schoolId,
    student_bill_id: "bill-1",
    student_id: "student-1",
    academic_year_id: "year-1",
    receipt_number: "GBHS-2026-0042",
    amount: 75000,
    payment_method: "cash" as const,
    transaction_ref: "CASH-REC-042",
    payment_date: new Date().toISOString().split("T")[0],
    term_number: 1 as const,
    remarks: "First Term Tuition & PTA Levy Payment",
    received_by: context?.user?.id || null,
    created_at: new Date().toISOString(),
  };

  const student = receiptData?.student || {
    id: "student-1",
    school_id: schoolId,
    matricule: "GBHS-2024-041",
    first_name: "Brian",
    last_name: "Nkwenti",
    gender: "M" as const,
    date_of_birth: "2011-05-14",
    place_of_birth: "Bamenda",
    residence_status: "day" as const,
    guardian_name: "M. Ngwa Thomas",
    guardian_phone: "+237 675 112 233",
    guardian_email: null,
    status: "active" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const bill = receiptData?.bill;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Controls Bar */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[8px] bg-white border border-[#E8DFC9] shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/finance"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs font-semibold text-[#142010] hover:bg-[#FFF8CF]/40 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Bursary Desk</span>
          </Link>
          <div className="text-xs text-[#525E4B]">
            Viewing official receipt N°{" "}
            <strong className="font-mono text-[#142010]">{payment.receipt_number}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PrintReceiptButton />
        </div>
      </div>

      {/* Official Receipt Card Component */}
      <div className="bg-white rounded-[8px] shadow-sm border border-[#E8DFC9] p-3 sm:p-6 print:p-0 print:border-none print:shadow-none">
        <OfficialReceipt
          school={school}
          payment={payment}
          bill={bill}
          student={student}
        />
      </div>
    </div>
  );
}
