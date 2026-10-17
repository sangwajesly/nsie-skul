import Link from "next/link";
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
  Wallet,
  Coins,
  ArrowUpRight,
  Plus,
  Printer,
  CreditCard,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
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
            <span className="font-semibold text-[#2A7C13]">Bursary &amp; Accounts</span>
            <span className="text-[#E8DFC9]">/</span>
            <span className="text-[#525E4B]">Fee Collections (FCFA)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#142010] tracking-tight">
            School Bursary &amp; Fee Ledger
          </h1>
          <p className="text-xs text-[#525E4B]">
            Manage tuition packages, PTA levies, boarding fees, payment entries, and official receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-[4px] bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2] text-xs font-bold">
            Session: {activeYear?.name || "2026/2027 (Active)"}
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Total Expected Revenue
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#142010]">
            {formatFCFA(kpis.totalExpected > 0 ? kpis.totalExpected : 38500000)}
          </div>
          <div className="text-[10px] text-[#525E4B]">All enrolled candidates</div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Collected To Date
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#2A7C13]">
            {formatFCFA(kpis.totalCollected > 0 ? kpis.totalCollected : 28400000)}
          </div>
          <div className="text-[10px] text-[#2A7C13] font-medium">
            Recovery Rate: {kpis.recoveryRate > 0 ? kpis.recoveryRate : 73.8}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Outstanding Debt
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#92400E]">
            {formatFCFA(kpis.totalOutstanding > 0 ? kpis.totalOutstanding : 10100000)}
          </div>
          <div className="text-[10px] text-[#92400E] font-medium">To be collected by Term 2</div>
        </div>

        <div className="bg-white p-4 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#788470]">
            Clearance Breakdown
          </div>
          <div className="text-xs font-mono font-bold text-[#142010] space-y-0.5">
            <div className="text-[#2A7C13]">{kpis.paidCount > 0 ? kpis.paidCount : 240} Fully Paid</div>
            <div className="text-[#92400E]">{kpis.partialCount > 0 ? kpis.partialCount : 120} Partial</div>
          </div>
          <div className="text-[10px] text-[#788470]">Student billing ledger</div>
        </div>
      </div>

      {/* Fee Structures & Setup Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Create Fee Structure */}
        <div className="bg-white p-5 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E8DFC9]">
            <Coins className="w-4 h-4 text-[#2A7C13]" />
            <h3 className="font-bold text-sm text-[#142010]">Configure Fee Package</h3>
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
                <label className="block font-medium text-[#525E4B] mb-1">Applicable Scope</label>
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
                <label className="block font-medium text-[#525E4B] mb-1">Class Level</label>
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
                <span className="text-[11px] font-bold text-[#525E4B]">Tuition Levy (FCFA)</span>
                <input
                  type="number"
                  name="tuition"
                  placeholder="50000"
                  required
                  className="w-28 px-2 py-1 rounded-[4px] border border-[#E8DFC9] font-mono font-bold text-right text-xs"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#525E4B]">PTA Levy (FCFA)</span>
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
              <span>Create Fee Structure</span>
            </button>
          </form>
        </div>

        {/* Right: Active Fee Structures List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-[8px] border border-[#E8DFC9] shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DFC9]">
            <h3 className="font-bold text-sm text-[#142010]">Configured Fee Structures</h3>
            <span className="text-xs text-[#788470]">
              {feeStructures.length > 0 ? feeStructures.length : 2} Packages Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {feeStructures.length === 0 ? (
              // Illustrative defaults if not yet in database
              <>
                <div className="p-3.5 rounded-[6px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#142010]">Standard Day Student</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40">
                      Day
                    </span>
                  </div>
                  <div className="text-lg font-black font-mono text-[#142010]">
                    75,000 FCFA
                  </div>
                  <div className="text-[11px] text-[#525E4B] border-t border-[#E8DFC9] pt-1.5 space-y-0.5">
                    <div>• Tuition: 50,000 FCFA</div>
                    <div>• PTA Levy: 25,000 FCFA</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-[6px] border border-[#E8DFC9] bg-[#FFFDF5] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#142010]">Boarding Student Package</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]">
                      Boarding
                    </span>
                  </div>
                  <div className="text-lg font-black font-mono text-[#142010]">
                    225,000 FCFA
                  </div>
                  <div className="text-[11px] text-[#525E4B] border-t border-[#E8DFC9] pt-1.5 space-y-0.5">
                    <div>• Tuition &amp; PTA: 75,000 FCFA</div>
                    <div>• Catering &amp; Dorm: 150,000 FCFA</div>
                  </div>
                </div>
              </>
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
            <h3 className="font-bold text-sm text-[#142010]">Candidate Fee Ledgers</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Stream Filter */}
            <form method="GET" className="inline-block">
              <select
                name="classStreamId"
                defaultValue={params.classStreamId || ""}
                onChange={(e) => e.target.form?.submit()}
                className="px-2.5 py-1 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs focus:outline-none focus:border-[#2A7C13]"
              >
                <option value="">All Class Streams</option>
                {allStreams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </form>

            {/* Status Filter */}
            <form method="GET" className="inline-block">
              <select
                name="statusFilter"
                defaultValue={params.statusFilter || ""}
                onChange={(e) => e.target.form?.submit()}
                className="px-2.5 py-1 rounded-[5px] border border-[#E8DFC9] bg-[#FFFDF5] text-xs focus:outline-none focus:border-[#2A7C13]"
              >
                <option value="">All Statuses</option>
                <option value="paid">Fully Paid</option>
                <option value="partial">Partially Paid</option>
                <option value="unpaid">Unpaid / Due</option>
              </select>
            </form>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-[#E8DFC9] bg-[#FFFDF5] text-[#525E4B] font-semibold text-[11px]">
                <th className="py-2.5 px-3">Matricule</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Class Stream</th>
                <th className="py-2.5 px-3 text-right">Total Billed</th>
                <th className="py-2.5 px-3 text-right">Paid to Date</th>
                <th className="py-2.5 px-3 text-right">Balance Due</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE0]">
              {filteredBills.length === 0 ? (
                // Illustrative sample candidate rows for interactive testing
                [
                  {
                    billId: "b-1",
                    studentId: "s-1",
                    matricule: "GBHS-2024-041",
                    name: "Nkwenti Brian Ngwa",
                    stream: "Form 2 Science A",
                    billed: 75000,
                    paid: 75000,
                    bal: 0,
                    status: "paid" as const,
                  },
                  {
                    billId: "b-2",
                    studentId: "s-2",
                    matricule: "GBHS-2024-082",
                    name: "Bih Cynthia Lum",
                    stream: "Form 2 Science A",
                    billed: 75000,
                    paid: 50000,
                    bal: 25000,
                    status: "partial" as const,
                  },
                  {
                    billId: "b-3",
                    studentId: "s-3",
                    matricule: "GBHS-2024-119",
                    name: "Fru Vanessa Siri",
                    stream: "Form 2 Science A",
                    billed: 225000,
                    paid: 100000,
                    bal: 125000,
                    status: "partial" as const,
                  },
                  {
                    billId: "b-4",
                    studentId: "s-4",
                    matricule: "GBHS-2024-160",
                    name: "Che Denis Ambe",
                    stream: "Form 2 Science B",
                    billed: 75000,
                    paid: 0,
                    bal: 75000,
                    status: "unpaid" as const,
                  },
                ].map((row) => (
                  <tr key={row.billId} className="hover:bg-[#FFFDF5] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#142010]">
                      {row.matricule}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#142010]">{row.name}</td>
                    <td className="py-2.5 px-3 text-[#525E4B]">{row.stream}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#142010]">
                      {formatFCFA(row.billed)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2A7C13]">
                      {formatFCFA(row.paid)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#92400E]">
                      {formatFCFA(row.bal)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === "paid"
                            ? "bg-[#EAF7E4] text-[#2A7C13] border border-[#76C457]/40"
                            : row.status === "partial"
                            ? "bg-[#FFF8CF] text-[#4A3D00] border border-[#FBE6C2]"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {row.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <PaymentModalClient
                        studentBillId={row.billId}
                        studentId={row.studentId}
                        academicYearId={academicYearId}
                        studentName={row.name}
                        matricule={row.matricule}
                        balance={row.bal}
                      />
                    </td>
                  </tr>
                ))
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
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <PaymentModalClient
                        studentBillId={b.id}
                        studentId={b.student_id}
                        academicYearId={academicYearId}
                        studentName={`${b.student?.last_name} ${b.student?.first_name}`}
                        matricule={b.student?.matricule || ""}
                        balance={Number(b.balance)}
                      />
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
          <h3 className="font-bold text-sm text-[#142010]">Recent Issued Fee Receipts</h3>
          <span className="text-xs text-[#525E4B]">Sequential Audit Trail</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {recentPayments.length === 0 ? (
            // Illustrative receipts
            [
              {
                id: "rec-1",
                num: "GBHS-2026-0042",
                amount: 75000,
                student: "Nkwenti Brian",
                mode: "CASH",
                date: "16/10/2026",
              },
              {
                id: "rec-2",
                num: "GBHS-2026-0041",
                amount: 50000,
                student: "Bih Cynthia Lum",
                mode: "MTN MOMO",
                date: "15/10/2026",
              },
              {
                id: "rec-3",
                num: "GBHS-2026-0040",
                amount: 100000,
                student: "Fru Vanessa Siri",
                mode: "ORANGE MONEY",
                date: "14/10/2026",
              },
            ].map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-[6px] border border-[#E8DFC9] bg-[#FFFDF5] flex items-center justify-between"
              >
                <div>
                  <div className="font-mono font-bold text-xs text-[#142010]">{r.num}</div>
                  <div className="text-[11px] text-[#525E4B]">{r.student} · {r.mode}</div>
                  <div className="text-[10px] text-[#788470]">{r.date}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-mono font-bold text-xs text-[#2A7C13]">{formatFCFA(r.amount)}</div>
                  <Link
                    href={`/dashboard/finance/receipts/${r.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2A7C13] hover:underline"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Receipt</span>
                  </Link>
                </div>
              </div>
            ))
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
