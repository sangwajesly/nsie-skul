import { createClient } from "@/lib/supabase/server";
import {
  FeeStructure,
  FeeItem,
  StudentBill,
  FeePayment,
  School,
  Student,
} from "@/types/database";

export interface BursaryKpiSummary {
  totalExpected: number;
  totalCollected: number;
  totalOutstanding: number;
  recoveryRate: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
}

/**
 * Retrieves all fee structures and breakdown items for a school year.
 */
export async function getSchoolFeeStructures(
  schoolId: string,
  academicYearId: string
): Promise<FeeStructure[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fee_structures")
    .select(
      `
      *,
      fee_items (*),
      class:classes (*)
    `
    )
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .order("name", { ascending: true });

  return (data as FeeStructure[]) || [];
}

/**
 * Retrieves student bills with optional filtering by class stream.
 */
export async function getStudentBills(
  schoolId: string,
  academicYearId: string,
  classStreamId?: string
): Promise<StudentBill[]> {
  const supabase = await createClient();
  let query = supabase
    .from("student_bills")
    .select(
      `
      *,
      student:students (*),
      class_stream:class_streams (*),
      fee_structure:fee_structures (*)
    `
    )
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId);

  if (classStreamId) {
    query = query.eq("class_stream_id", classStreamId);
  }

  const { data } = await query.order("created_at", { ascending: false });
  return (data as StudentBill[]) || [];
}

/**
 * Retrieves recent fee payments and receipts recorded for the school.
 */
export async function getRecentFeePayments(
  schoolId: string,
  academicYearId: string,
  limit: number = 20
): Promise<FeePayment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fee_payments")
    .select(
      `
      *,
      student:students (*),
      receiver:user_profiles (*)
    `
    )
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .order("payment_date", { ascending: false })
    .limit(limit);

  return (data as FeePayment[]) || [];
}

/**
 * Retrieves full data required for an official printed fee receipt.
 */
export async function getPaymentReceiptData(schoolId: string, paymentId: string) {
  const supabase = await createClient();

  // 1. Fetch School
  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", schoolId)
    .single();

  // 2. Fetch Payment
  const { data: payment } = await supabase
    .from("fee_payments")
    .select(
      `
      *,
      student:students (*),
      receiver:user_profiles (*)
    `
    )
    .eq("school_id", schoolId)
    .eq("id", paymentId)
    .single();

  if (!payment || !school) return null;

  // 3. Fetch Student Bill for balance context
  const { data: bill } = await supabase
    .from("student_bills")
    .select(
      `
      *,
      class_stream:class_streams (*)
    `
    )
    .eq("id", payment.student_bill_id)
    .single();

  return {
    school: school as School,
    payment: payment as FeePayment,
    bill: bill as StudentBill,
    student: payment.student as Student,
  };
}

/**
 * Computes high-level collection and debtor KPIs for the Bursary dashboard.
 */
export async function getBursaryKpis(
  schoolId: string,
  academicYearId: string
): Promise<BursaryKpiSummary> {
  const supabase = await createClient();
  const { data: bills } = await supabase
    .from("student_bills")
    .select("total_billed, total_paid, balance, status")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId);

  const billList = bills || [];
  let totalExpected = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;

  for (const b of billList) {
    const billed = Number(b.total_billed) || 0;
    const paid = Number(b.total_paid) || 0;
    const bal = Number(b.balance) || billed - paid;

    totalExpected += billed;
    totalCollected += paid;
    totalOutstanding += bal > 0 ? bal : 0;

    if (b.status === "paid") paidCount++;
    else if (b.status === "partial") partialCount++;
    else unpaidCount++;
  }

  const recoveryRate =
    totalExpected > 0 ? parseFloat(((totalCollected / totalExpected) * 100).toFixed(1)) : 0;

  return {
    totalExpected,
    totalCollected,
    totalOutstanding,
    recoveryRate,
    paidCount,
    partialCount,
    unpaidCount,
  };
}
