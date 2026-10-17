import React from "react";
import { formatFCFA, numberToWordsFCFA } from "@/lib/finance/receipt-utils";
import { School, Student, FeePayment, StudentBill } from "@/types/database";

interface OfficialReceiptProps {
  school: School;
  payment: FeePayment;
  bill?: StudentBill;
  student: Student;
}

export function OfficialReceipt({
  school,
  payment,
  bill,
  student,
}: OfficialReceiptProps) {
  const amountInWords = numberToWordsFCFA(Number(payment.amount));
  const totalBilled = bill ? Number(bill.total_billed) : Number(payment.amount);
  const totalPaid = bill ? Number(bill.total_paid) : Number(payment.amount);
  const balanceRemaining = bill ? Number(bill.balance) : 0;

  return (
    <div className="bg-white text-black p-5 sm:p-8 max-w-[800px] mx-auto border-2 border-black font-sans text-xs leading-relaxed print:p-0 print:border-none print:max-w-none print:w-full">
      {/* ── Top Header ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-2 border-b-2 border-black pb-3 items-center text-center">
        <div className="col-span-5 text-center space-y-0.5 text-[8.5px] uppercase font-bold tracking-tight">
          <div>REPUBLIC OF CAMEROON</div>
          <div className="text-[7.5px] font-normal italic lowercase">Peace – Work – Fatherland</div>
          <div className="text-[7px]">*************</div>
          <div>MINISTRY OF SECONDARY EDUCATION</div>
          <div className="text-[9px] font-extrabold text-black pt-1">{school.name}</div>
          <div className="text-[7.5px] font-normal normal-case">{school.address || "Cameroon"}</div>
        </div>

        <div className="col-span-2 flex flex-col items-center justify-center text-center p-1">
          <div className="w-12 h-12 border-2 border-black rounded-full flex items-center justify-center font-bold text-xs bg-zinc-50">
            {school.code || "SEAL"}
          </div>
        </div>

        <div className="col-span-5 text-center space-y-0.5 text-[8.5px] uppercase font-bold tracking-tight">
          <div>RÉPUBLIQUE DU CAMEROUN</div>
          <div className="text-[7.5px] font-normal italic lowercase">Paix – Travail – Patrie</div>
          <div className="text-[7px]">*************</div>
          <div>MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES</div>
          <div className="text-[9px] font-extrabold text-black pt-1">BURSARY &amp; ACCOUNTS</div>
          <div className="text-[7.5px] font-normal normal-case">TEL: {school.phone || "+237 670 000 000"}</div>
        </div>
      </div>

      {/* ── Receipt Title & Number Bar ────────────────────────────────────────── */}
      <div className="py-2.5 px-3 border-b border-black flex flex-wrap items-center justify-between gap-2 bg-zinc-50/50">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider underline">
            OFFICIAL FEE PAYMENT RECEIPT
          </h2>
          <div className="text-[10px] text-zinc-600">
            Payment Mode: <strong className="uppercase font-mono text-black">{payment.payment_method}</strong>
            {payment.transaction_ref && <span> · REF: {payment.transaction_ref}</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono font-black text-black">
            N° {payment.receipt_number}
          </div>
          <div className="text-[10px] text-zinc-600">
            Date: <span className="font-mono">{payment.payment_date}</span>
          </div>
        </div>
      </div>

      {/* ── Student Information Matrix ─────────────────────────────────────────── */}
      <div className="border-b border-black text-[11px]">
        <div className="grid grid-cols-12 border-b border-black/30 divide-x divide-black/30">
          <div className="col-span-8 p-2">
            <span className="font-bold">Student Name:</span>{" "}
            <span className="font-black uppercase tracking-wide text-xs">
              {student.last_name} {student.first_name}
            </span>
          </div>
          <div className="col-span-4 p-2">
            <span className="font-bold">Matricule:</span>{" "}
            <span className="font-mono font-bold">{student.matricule}</span>
          </div>
        </div>

        <div className="grid grid-cols-12 divide-x divide-black/30">
          <div className="col-span-6 p-2">
            <span className="font-bold">Class / Cohort:</span>{" "}
            <span className="font-medium">{bill?.class_stream?.name || "Enrolled Stream"}</span>
          </div>
          <div className="col-span-6 p-2">
            <span className="font-bold">Residence Status:</span>{" "}
            <span className="capitalize font-medium">{student.residence_status} Student</span>
          </div>
        </div>
      </div>

      {/* ── Payment Details & Financial Breakdown ────────────────────────────── */}
      <div className="p-4 space-y-3 border-b border-black">
        <div className="flex items-center justify-between text-xs py-1 border-b border-black/20">
          <span className="font-bold text-zinc-800">Amount Paid This Transaction:</span>
          <span className="text-sm font-black font-mono text-black">
            {formatFCFA(Number(payment.amount))}
          </span>
        </div>

        <div className="p-2.5 rounded bg-zinc-50 border border-black/20 text-[11px]">
          <span className="font-bold text-zinc-700">Amount in Words:</span>
          <div className="font-serif italic font-bold text-xs text-black mt-0.5">
            &quot;{amountInWords}&quot;
          </div>
        </div>

        {/* Ledger Balance Context */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-center">
          <div className="p-2 rounded bg-zinc-50 border border-black/20">
            <div className="text-zinc-600">Total Billed Year</div>
            <div className="font-mono font-bold text-xs mt-0.5">{formatFCFA(totalBilled)}</div>
          </div>
          <div className="p-2 rounded bg-zinc-50 border border-black/20">
            <div className="text-zinc-600">Total Paid to Date</div>
            <div className="font-mono font-bold text-xs text-[#2A7C13] mt-0.5">{formatFCFA(totalPaid)}</div>
          </div>
          <div className="p-2 rounded bg-zinc-50 border border-black/20">
            <div className="text-zinc-600">Outstanding Balance</div>
            <div className={`font-mono font-bold text-xs mt-0.5 ${balanceRemaining > 0 ? "text-amber-800" : "text-[#2A7C13]"}`}>
              {formatFCFA(balanceRemaining)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Signatures & Stamp Block ─────────────────────────────────────────── */}
      <div className="grid grid-cols-12 divide-x divide-black pt-3 text-[10px]">
        <div className="col-span-6 p-2 space-y-2">
          <div className="font-bold underline uppercase text-[9px]">Student / Payer Acknowledgment</div>
          <p className="text-[9px] text-zinc-500 italic">
            I acknowledge payment of the above sum towards school fees.
          </p>
          <div className="pt-8 border-b border-dotted border-black/40 text-[8px] text-zinc-400">
            Payer&apos;s Signature
          </div>
        </div>

        <div className="col-span-6 p-2 text-center space-y-1">
          <div className="font-black uppercase text-[9px]">Bursary &amp; Accounts Visa</div>
          <div className="h-10 flex items-center justify-center font-serif italic text-zinc-400 text-xs">
            [ Official Cashier Stamp ]
          </div>
          <div className="text-[8.5px] font-mono text-zinc-600">
            Received by: {payment.receiver?.full_name || "School Bursar"}
          </div>
        </div>
      </div>

      {/* ── Legal Disclaimer Footer ────────────────────────────────────────── */}
      <div className="mt-4 pt-2 border-t border-black text-center text-[8px] text-zinc-500">
        Nsei Skul Automated Financial Engine · Official Bursary Document · Fees once paid are non-refundable.
      </div>
    </div>
  );
}
