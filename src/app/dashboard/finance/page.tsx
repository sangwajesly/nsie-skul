import Link from "next/link";
import { AutoSubmitSelect } from "@/components/AutoSubmitSelect";
import { getTenantContext } from "@/lib/tenancy/context";
import { getActiveAcademicYear, getSchoolClasses } from "@/lib/academic/service";
import {
  getSchoolFeeStructures,
  getStudentBills,
  getRecentFeePayments,
  getBursaryKpis,
} from "@/lib/finance/service";
import { createFeeStructureAction } from "@/app/finance/actions";
import { formatFCFA } from "@/lib/finance/receipt-utils";
import { PaymentModalClient } from "./PaymentModalClient";
import {
  Coins,
  Plus,
  Printer,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface FinancePageProps {
  searchParams: Promise<{
    classStreamId?: string;
    statusFilter?: string;
  }>;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const params = await searchParams;
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";

  const activeYear = await getActiveAcademicYear(schoolId);
  const academicYearId = activeYear?.id || "00000000-0000-0000-0000-000000000001";

  // 1. Fetch KPI summaries
  const kpis = await getBursaryKpis(schoolId, academicYearId);

  // 2. Fetch Fee Structures
  const feeStructures = await getSchoolFeeStructures(schoolId, academicYearId);

  // 3. Fetch Classes & Streams for filter
  const classesWithStreams = await getSchoolClasses(schoolId, academicYearId);
  const allStreams = classesWithStreams.flatMap((c) => c.streams);

  // 4. Fetch Student Bills
  const studentBills = await getStudentBills(
    schoolId,
    academicYearId,
    params.classStreamId
  );

  // Filter bills by status if requested
  const filteredBills = params.statusFilter
    ? studentBills.filter((b) => b.status === params.statusFilter)
    : studentBills;

  // 5. Fetch Recent Payments
  const recentPayments = await getRecentFeePayments(schoolId, academicYearId, 10);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8DFC9]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#2A7C13]">Fees &amp; Payments</span>
            <span className="text-[#E8DFC9]">/</span>
            <span className="text-[#525E4B]">Fee Collections (FCFA)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#142010] tracking-tight">
            School Fees &amp; Payments
          </h1>
          <p className="text-xs text-[#525E4B]">
            Set school fees, record student payments, and print receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-[4px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] text-xs font-bold">
            Academic year: {activeYear?.name || "Not set"}
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Fees Expected
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#142010]">
            {formatFCFA(kpis.totalExpected)}
          </div>
          <div className="text-[10px] text-[#525E4B]">Based on current fee bills</div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Fees Collected
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#2A7C13]">
            {formatFCFA(kpis.totalCollected)}
          </div>
          <div className="text-[10px] text-[#2A7C13] font-medium">
            Collected / expected: {kpis.recoveryRate}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Fees Still Owed
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#92400E]">
            {formatFCFA(kpis.totalOutstanding)}
          </div>
          <div className="text-[10px] text-[#92400E] font-medium">Outstanding balance on current bills</div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Payment Status
          </div>
          <div className="text-xs font-mono font-bold text-[#142010] space-y-0.5">
            <div className="text-[#2A7C13]">{kpis.paidCount} paid in full</div>
            <div className="text-[#92400E]">{kpis.partialCount} partly paid</div>
          </div>
          <div className="text-[10px] text-[#788470]">Students with fee records</div>
        </div>
      </div>

      {/* Fee Structures & Setup Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Create Fee Structure */}
        <div className="bg-white p-5 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E8DFC9]">
            <Coins className="w-4 h-4 text-[#2A7C13]" />
            <h3 className="font-bold text-sm text-[#142010]">Create a Fee Package</h3>
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              await createFeeStructureAction(formData);
            }}
            className="space-y-3 text-xs"
          >
            <input type="hidden" name="academicYearId" value={academicYearId} />

            <div>
              <label className="block font-medium text-[#525E4B] mb-1">Package Name *</label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Form 1 Day Student, Boarding Form 5"
                required
                className="w-full px-3 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs focus:outline-none focus:border-[#2A7C13]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-[#525E4B] mb-1">Applies To</label>
                <select
                  name="residenceStatus"
                  className="w-full px-2 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs focus:outline-none focus:border-[#2A7C13]"
                >
                  <option value="all">All Students</option>
                  <option value="day">Day Students Only</option>
                  <option value="boarding">Boarding Students Only</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#525E4B] mb-1">Class</label>
                <select
                  name="classId"
                  className="w-full px-2 py-1.5 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs focus:outline-none focus:border-[#2A7C13]"
                >
                  <option value="">Whole School</option>
                  {classesWithStreams.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-[#E8DFC9]">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#525E4B]">Tuition Fee (FCFA)</span>
                <input
                  type="number"
                  name="tuition"
                  placeholder="50000"
                  required
                  className="w-28 px-2 py-1 rounded-[4px] border border-[#E8DFC9] font-mono font-bold text-right text-xs"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#525E4B]">PTA Fee (FCFA)</span>
                <input
                  type="number"
                  name="pta"
                  placeholder="25000"
                  required
                  className="w-28 px-2 py-1 rounded-[4px] border border-[#E8DFC9] font-mono font-bold text-right text-xs"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#525E4B]">Boarding Fee (Optional)</span>
                <input
                  type="number"
                  name="boarding"
                  placeholder="0"
                  className="w-28 px-2 py-1 rounded-[4px] border border-[#E8DFC9] font-mono font-bold text-right text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Fee Package</span>
            </button>
          </form>
        </div>

        {/* Right: Active Fee Structures List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DFC9]">
            <h3 className="font-bold text-sm text-[#142010]">Fee Packages</h3>
            <span className="text-xs text-[#788470]">
              {feeStructures.length} Fee Packages
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {feeStructures.length === 0 ? (
              <p className="col-span-full py-8 text-center text-xs text-[#777777]">
                No fee packages yet. Create one using the form to the left.
              </p>
            ) : (
              feeStructures.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-[6px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#142010]">{f.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF7E4] text-[#2A7C13]">
                      {f.residence_status}
                    </span>
                  </div>
                  <div className="text-lg font-black font-mono text-[#142010]">
                    {formatFCFA(Number(f.total_amount))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Student Billing & Fee Collection Table */}
      <div className="bg-white rounded-[8px] border border-[#E8DFC9] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#E8DFC9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2A7C13]" />
            <h3 className="font-bold text-sm text-[#142010]">Student Fee Records</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Class group filter */}
            <form method="GET" className="inline-block">
              <AutoSubmitSelect
                name="classStreamId"
                defaultValue={params.classStreamId || ""}
                className="px-2.5 py-1 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs focus:outline-none focus:border-[#2A7C13]"
              >
                <option value="">All Class Groups</option>
                {allStreams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </AutoSubmitSelect>
            </form>

            {/* Status Filter */}
            <form method="GET" className="inline-block">
              <AutoSubmitSelect
                name="statusFilter"
                defaultValue={params.statusFilter || ""}
                className="px-2.5 py-1 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs focus:outline-none focus:border-[#2A7C13]"
              >
                <option value="">All Payment Statuses</option>
                <option value="paid">Fully Paid</option>
                <option value="partial">Partially Paid</option>
                <option value="unpaid">Unpaid / Due</option>
              </AutoSubmitSelect>
            </form>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E8DFC9] bg-[#FFFDF5] text-[#525E4B] font-semibold text-[11px]">
                <th className="py-2.5 px-3">Admission No.</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Class Group</th>
                <th className="py-2.5 px-3 text-right">Total Billed</th>
                <th className="py-2.5 px-3 text-right">Paid to Date</th>
                <th className="py-2.5 px-3 text-right">Balance Due</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE0]">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#777777]">
                    No fee records match this selection.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FFFDF5] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#142010]">
                      {b.student?.matricule}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#142010]">
                      {b.student?.last_name} {b.student?.first_name}
                    </td>
                    <td className="py-2.5 px-3 text-[#525E4B]">
                      {b.class_stream?.name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#142010]">
                      {formatFCFA(Number(b.total_billed))}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2A7C13]">
                      {formatFCFA(Number(b.total_paid))}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#92400E]">
                      {formatFCFA(Number(b.balance))}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === "paid"
                            ? "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40"
                            : b.status === "partial"
                            ? "bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {b.status === "paid" ? "Paid in full" : b.status === "partial" ? "Partly paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {Number(b.balance) > 0 ? (
                        <PaymentModalClient
                          studentBillId={b.id}
                          studentId={b.student_id}
                          academicYearId={academicYearId}
                          studentName={`${b.student?.last_name} ${b.student?.first_name}`}
                          matricule={b.student?.matricule || ""}
                          balance={Number(b.balance)}
                        />
                      ) : (
                        <span className="text-xs font-semibold text-[#1F5C0E]">Paid in full</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Receipts Log */}
      <div className="bg-white rounded-[8px] border border-[#E8DFC9] shadow-2xs p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8DFC9] pb-2.5">
          <h3 className="font-bold text-sm text-[#142010]">Recent Receipts</h3>
          <span className="text-xs text-[#525E4B]">Most recent payments recorded</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {recentPayments.length === 0 ? (
            <p className="col-span-full py-8 text-center text-xs text-[#777777]">
              No payments or receipts have been recorded yet.
            </p>
          ) : (
            recentPayments.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-[6px] border border-[#E8DFC9] bg-[#FFFDF5] flex items-center justify-between"
              >
                <div>
                  <div className="font-mono font-bold text-xs text-[#142010]">{p.receipt_number}</div>
                  <div className="text-[11px] text-[#525E4B]">
                    {p.student?.last_name} {p.student?.first_name}
                  </div>
                  <div className="text-[10px] text-[#788470]">{p.payment_date}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-mono font-bold text-xs text-[#2A7C13]">
                    {formatFCFA(Number(p.amount))}
                  </div>
                  <Link
                    href={`/dashboard/finance/receipts/${p.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2A7C13] hover:underline"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Receipt</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
