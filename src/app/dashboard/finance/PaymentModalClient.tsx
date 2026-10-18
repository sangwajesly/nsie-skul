"use client";

import { useState, useTransition } from "react";
import { recordFeePaymentAction } from "@/app/finance/actions";
import { formatFCFA } from "@/lib/finance/receipt-utils";
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

interface PaymentModalClientProps {
  studentBillId: string;
  studentId: string;
  academicYearId: string;
  studentName: string;
  matricule: string;
  balance: number;
}

export function PaymentModalClient({
  studentBillId,
  studentId,
  academicYearId,
  studentName,
  matricule,
  balance,
}: PaymentModalClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState<number>(balance > 0 ? balance : 25000);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "momo" | "orange_money" | "bank_deposit">("cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [termNumber, setTermNumber] = useState<number>(1);
  const [receiptResult, setReceiptResult] = useState<{ receiptNumber: string; paymentId: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("studentBillId", studentBillId);
    formData.append("studentId", studentId);
    formData.append("academicYearId", academicYearId);
    formData.append("amount", amount.toString());
    formData.append("paymentMethod", paymentMethod);
    if (transactionRef) formData.append("transactionRef", transactionRef);
    formData.append("termNumber", termNumber.toString());

    startTransition(async () => {
      const res = await recordFeePaymentAction(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else if (res?.receiptNumber && res?.paymentId) {
        setReceiptResult({ receiptNumber: res.receiptNumber, paymentId: res.paymentId });
      }
    });
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setReceiptResult(null);
          setErrorMsg(null);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs transition-colors shadow-xs"
      >
        <CreditCard className="w-3.5 h-3.5" />
        <span>Record Payment</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[10px] border border-[#E8DFC9] shadow-xl w-full max-w-md overflow-hidden text-left space-y-4 p-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#2A7C13]" />
                <h3 className="font-bold text-sm text-[#142010]">Record Fee Payment</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#788470] hover:text-[#142010] p-1 rounded hover:bg-[#FFFDF5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success State */}
            {receiptResult ? (
              <div className="space-y-4 text-center py-3">
                <div className="w-12 h-12 rounded-full bg-[#EAF7E4] text-[#2A7C13] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#142010]">Payment Successfully Logged!</h4>
                  <p className="text-xs text-[#525E4B] mt-0.5">
                    Receipt N° <strong className="font-mono text-[#2A7C13]">{receiptResult.receiptNumber}</strong>
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Link
                    href={`/dashboard/finance/receipts/${receiptResult.paymentId}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Official Receipt</span>
                  </Link>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-[6px] border border-[#E8DFC9] text-xs font-semibold text-[#142010] hover:bg-[#FFFDF5]"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Entry Form */
              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                {/* Student Info Box */}
                <div className="p-3 rounded-[6px] bg-[#FFFDF5] border border-[#E8DFC9] flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[#142010]">{studentName}</div>
                    <div className="text-[11px] font-mono text-[#525E4B]">Admission No. {matricule}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#788470]">Balance Still Owed</div>
                    <div className="font-mono font-bold text-sm text-[#142010]">{formatFCFA(balance)}</div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block font-medium text-[#525E4B] mb-1">
                    Amount Received (FCFA) *
                  </label>
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-[5px] border border-[#E8DFC9] font-mono font-bold text-sm bg-white focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-medium text-[#525E4B] mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value as "cash" | "momo" | "orange_money" | "bank_deposit"
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-white text-xs font-medium focus:outline-none focus:border-[#2A7C13]"
                    >
                      <option value="cash">Cash (Bursary Desk)</option>
                      <option value="momo">MTN Mobile Money</option>
                      <option value="orange_money">Orange Money</option>
                      <option value="bank_deposit">Bank Deposit / Slip</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-[#525E4B] mb-1">School Term</label>
                    <select
                      value={termNumber}
                      onChange={(e) => setTermNumber(parseInt(e.target.value, 10))}
                      className="w-full px-2.5 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-white text-xs font-medium focus:outline-none focus:border-[#2A7C13]"
                    >
                      <option value="1">Term 1 Installment</option>
                      <option value="2">Term 2 Installment</option>
                      <option value="3">Term 3 Installment</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[#525E4B] mb-1">
                    Payment Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MoMo TransID or Bank Slip N°"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-white text-xs focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3.5 py-1.5 rounded-[5px] border border-[#E8DFC9] text-xs font-semibold text-[#142010] hover:bg-[#FFFDF5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || amount <= 0}
                    className="px-4 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Saving Payment..." : "Save Payment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
