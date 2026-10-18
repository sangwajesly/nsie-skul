import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantContext } from "@/lib/tenancy/context";
import { getPaymentReceiptData } from "@/lib/finance/service";
import { OfficialReceipt } from "@/components/finance/OfficialReceipt";
import { ArrowLeft } from "lucide-react";
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
  if (!receiptData) notFound();

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
            <span>Fees &amp; Payments</span>
          </Link>
          <div className="text-xs text-[#525E4B]">
            Receipt <strong className="font-mono text-[#142010]">{receiptData.payment.receipt_number}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PrintReceiptButton />
        </div>
      </div>

      {/* Official Receipt Card Component */}
      <div className="bg-white rounded-[8px] shadow-sm border border-[#E8DFC9] p-3 sm:p-6 print:p-0 print:border-none print:shadow-none">
        <OfficialReceipt
          school={receiptData.school}
          payment={receiptData.payment}
          bill={receiptData.bill}
          student={receiptData.student}
        />
      </div>
    </div>
  );
}
