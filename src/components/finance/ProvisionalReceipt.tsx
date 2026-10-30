"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X, CloudOff } from "lucide-react";
import { OfficialReceipt } from "@/components/finance/OfficialReceipt";
import type { FeePaymentMutation } from "@/lib/offline/outbox";
import type { FeePayment, School, Student, StudentBill } from "@/types/database";

const PORTAL_ID = "nsei-print-portal";
const PRINT_BODY_CLASS = "nsei-print-portal-active";

/**
 * Builds the props OfficialReceipt expects from an offline payment snapshot,
 * so provisional receipts look exactly like online ones.
 */
export function buildProvisionalReceiptProps(mutation: FeePaymentMutation) {
  const { payload: p, receipt: r } = mutation;
  const totalPaid = r.paidBeforeThisPayment + p.amount;

  const school = {
    id: mutation.schoolId,
    name: r.schoolName,
    code: r.schoolCode,
    address: r.schoolAddress,
    phone: r.schoolPhone,
    logo_url: r.schoolLogoUrl,
  } as School;

  const student = {
    id: p.studentId,
    first_name: r.studentFirstName,
    last_name: r.studentLastName,
    matricule: r.matricule,
    residence_status: r.residenceStatus,
  } as Student;

  const bill = {
    id: p.studentBillId,
    total_billed: r.totalBilled,
    total_paid: totalPaid,
    balance: Math.max(0, r.totalBilled - totalPaid),
    class_stream: r.classStreamName ? { name: r.classStreamName } : undefined,
  } as StudentBill;

  const payment = {
    id: mutation.id,
    receipt_number: p.receiptNumber,
    amount: p.amount,
    payment_method: p.paymentMethod,
    transaction_ref: p.transactionRef || null,
    payment_date: p.paymentDate,
    term_number: (p.termNumber || 1) as 1 | 2 | 3,
    receiver: r.receivedByName ? { full_name: r.receivedByName } : undefined,
  } as FeePayment;

  return { school, student, bill, payment, provisional: { balanceAsOf: r.balanceAsOf } };
}

interface ProvisionalReceiptOverlayProps {
  mutation: FeePaymentMutation;
  onClose: () => void;
}

/**
 * Full-screen, printable receipt that works with no network at all. It is
 * rendered in a portal on <body> so window.print() prints only the receipt.
 */
export function ProvisionalReceiptOverlay({ mutation, onClose }: ProvisionalReceiptOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const afterPrint = () => document.body.classList.remove(PRINT_BODY_CLASS);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("afterprint", afterPrint);
      document.body.classList.remove(PRINT_BODY_CLASS);
    };
  }, []);

  const handlePrint = () => {
    document.body.classList.add(PRINT_BODY_CLASS);
    // Let the class apply before the print dialog snapshots the page.
    requestAnimationFrame(() => window.print());
  };

  if (!mounted) return null;
  const props = buildProvisionalReceiptProps(mutation);

  return createPortal(
    <div id={PORTAL_ID} className="fixed inset-0 z-[100] bg-[#F7F4EA] overflow-y-auto print:static print:bg-white">
      <div className="print:hidden sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-b border-[#E8DFC9] shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-[#525E4B]">
          <CloudOff className="w-4 h-4 text-[#B45309]" />
          <span>
            Provisional receipt <strong className="font-mono text-[#142010]">{mutation.payload.receiptNumber}</strong>.
            It will sync automatically when the internet is back.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-[#E8DFC9] bg-white text-xs font-semibold text-[#142010] hover:bg-[#FFFDF5] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-3 sm:p-6 print:p-0">
        <div className="bg-white rounded-[8px] shadow-sm border border-[#E8DFC9] p-3 sm:p-6 print:p-0 print:border-none print:shadow-none">
          <OfficialReceipt {...props} />
        </div>
      </div>
    </div>,
    document.body
  );
}
