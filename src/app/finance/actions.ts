"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/tenancy/context";
import { revalidatePath } from "next/cache";
import { formatReceiptNumber } from "@/lib/finance/receipt-utils";
import { z } from "zod";

const RecordPaymentSchema = z.object({
  studentBillId: z.string().uuid(),
  studentId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  amount: z.coerce.number().positive("Payment amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "momo", "orange_money", "bank_deposit"]),
  transactionRef: z.string().optional(),
  termNumber: z.coerce.number().min(1).max(3).optional(),
  remarks: z.string().optional(),
});

export async function recordFeePaymentAction(formData: FormData) {
  const context = await requirePermission("finance:payments:create");
  if (!context?.school?.id) {
    return { error: "Unauthorized. Bursary permission required." };
  }

  const raw = {
    studentBillId: formData.get("studentBillId"),
    studentId: formData.get("studentId"),
    academicYearId: formData.get("academicYearId"),
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    transactionRef: formData.get("transactionRef") || undefined,
    termNumber: formData.get("termNumber") || undefined,
    remarks: formData.get("remarks") || undefined,
  };

  const parsed = RecordPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // 1. Calculate next sequential receipt number for school
  const { count } = await supabase
    .from("fee_payments")
    .select("id", { count: "exact", head: true })
    .eq("school_id", context.school.id);

  const nextSeq = (count || 0) + 1;
  const prefix = context.school.code || "REC";
  const receiptNumber = formatReceiptNumber(prefix, "2026", nextSeq);

  // 2. Insert Fee Payment
  const { data: payment, error: paymentError } = await supabase
    .from("fee_payments")
    .insert({
      school_id: context.school.id,
      student_bill_id: parsed.data.studentBillId,
      student_id: parsed.data.studentId,
      academic_year_id: parsed.data.academicYearId,
      receipt_number: receiptNumber,
      amount: parsed.data.amount,
      payment_method: parsed.data.paymentMethod,
      transaction_ref: parsed.data.transactionRef || null,
      term_number: parsed.data.termNumber || 1,
      remarks: parsed.data.remarks || null,
      received_by: context.user?.id || null,
      payment_date: new Date().toISOString().split("T")[0],
    })
    .select("id, receipt_number")
    .single();

  if (paymentError || !payment) {
    return { error: paymentError?.message || "Failed to record payment." };
  }

  // 3. Update Student Bill total_paid and status
  const { data: bill } = await supabase
    .from("student_bills")
    .select("total_billed, total_paid")
    .eq("id", parsed.data.studentBillId)
    .single();

  if (bill) {
    const newTotalPaid = Number(bill.total_paid) + parsed.data.amount;
    const billed = Number(bill.total_billed);
    const newStatus =
      newTotalPaid >= billed ? "paid" : newTotalPaid > 0 ? "partial" : "unpaid";

    await supabase
      .from("student_bills")
      .update({
        total_paid: newTotalPaid,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.studentBillId);
  }

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true, receiptNumber: payment.receipt_number, paymentId: payment.id };
}

export async function createFeeStructureAction(formData: FormData) {
  const context = await requirePermission("finance:manage");
  if (!context?.school?.id) {
    return { error: "Unauthorized. Administrator or Bursar permission required." };
  }

  const name = formData.get("name") as string;
  const academicYearId = formData.get("academicYearId") as string;
  const residenceStatus = (formData.get("residenceStatus") as string) || "all";
  const classId = (formData.get("classId") as string) || null;
  const tuition = parseFloat(formData.get("tuition") as string) || 0;
  const pta = parseFloat(formData.get("pta") as string) || 0;
  const boarding = parseFloat(formData.get("boarding") as string) || 0;

  if (!name || !academicYearId) {
    return { error: "Structure name and academic year are required." };
  }

  const totalAmount = tuition + pta + boarding;
  const supabase = await createClient();

  // 1. Create fee structure
  const { data: structure, error: structError } = await supabase
    .from("fee_structures")
    .insert({
      school_id: context.school.id,
      academic_year_id: academicYearId,
      class_id: classId,
      residence_status: residenceStatus,
      name,
      total_amount: totalAmount,
      currency: "XAF",
    })
    .select("id")
    .single();

  if (structError || !structure) {
    return { error: structError?.message || "Failed to create fee structure." };
  }

  // 2. Insert items
  const items = [
    { name: "Tuition Fee", amount: tuition, is_compulsory: true },
    { name: "PTA Levy", amount: pta, is_compulsory: true },
  ];
  if (boarding > 0) {
    items.push({ name: "Boarding & Catering", amount: boarding, is_compulsory: false });
  }

  await supabase.from("fee_items").insert(
    items.map((i) => ({
      school_id: context.school.id,
      fee_structure_id: structure.id,
      name: i.name,
      amount: i.amount,
      is_compulsory: i.is_compulsory,
    }))
  );

  revalidatePath("/dashboard/finance");
  return { success: true };
}
