"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/tenancy/context";
import { uuidSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { formatReceiptNumber } from "@/lib/finance/receipt-utils";
import { z } from "zod";

const RecordPaymentSchema = z.object({
  studentBillId: uuidSchema(),
  studentId: uuidSchema(),
  academicYearId: uuidSchema(),
  amount: z.coerce.number().positive("Payment amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "momo", "orange_money", "bank_deposit"]),
  transactionRef: z.string().nullish(),
  termNumber: z.coerce.number().min(1).max(3).nullish(),
  remarks: z.string().nullish(),
});

export async function recordFeePaymentAction(formData: FormData) {
  const context = await requirePermission("finance.collect");
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
  const schoolId = context.school.id;
  const clientMutationId = parseOptionalUuid(formData.get("clientMutationId"));

  // 0. Idempotency: if this exact submission was already saved (e.g. the
  //    network dropped after the server wrote it), return the existing receipt.
  if (clientMutationId) {
    const existing = await findPaymentByMutationId(supabase, schoolId, clientMutationId);
    if (existing) {
      return { success: true, receiptNumber: existing.receipt_number, paymentId: existing.id };
    }
  }

  // 1. Calculate next sequential receipt number for school
  const { count } = await supabase
    .from("fee_payments")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId);

  const prefix = context.school.code || "REC";
  const baseRow = {
    school_id: schoolId,
    student_bill_id: parsed.data.studentBillId,
    student_id: parsed.data.studentId,
    academic_year_id: parsed.data.academicYearId,
    amount: parsed.data.amount,
    payment_method: parsed.data.paymentMethod,
    transaction_ref: parsed.data.transactionRef || null,
    term_number: parsed.data.termNumber || 1,
    remarks: parsed.data.remarks || null,
    received_by: context.user?.id || null,
    payment_date: new Date().toISOString().split("T")[0],
  };
  const syncColumns = clientMutationId
    ? { client_mutation_id: clientMutationId, synced_at: new Date().toISOString() }
    : {};

  // 2. Insert Fee Payment (retry on receipt-number collision from concurrent desks)
  let payment: { id: string; receipt_number: string } | null = null;
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 5 && !payment; attempt++) {
    const receiptNumber = formatReceiptNumber(prefix, "2026", (count || 0) + 1 + attempt);
    const res = await insertPaymentRow(supabase, { ...baseRow, receipt_number: receiptNumber }, syncColumns);
    if (res.data) {
      payment = res.data;
    } else if (res.code === "23505" && clientMutationId) {
      // Could be a duplicate mutation that raced us; return it if so.
      const existing = await findPaymentByMutationId(supabase, schoolId, clientMutationId);
      if (existing) payment = existing;
      lastError = res.message || null;
    } else if (res.code === "23505") {
      lastError = res.message || null;
    } else {
      return { error: res.message || "Failed to record payment." };
    }
  }

  if (!payment) {
    return { error: lastError || "Failed to record payment." };
  }

  // 3. Recalculate Student Bill total_paid and status from the payment ledger
  await recalculateBillTotals(supabase, parsed.data.studentBillId);

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true, receiptNumber: payment.receipt_number, paymentId: payment.id };
}

// ── Offline payment sync ───────────────────────────────────────────────────

const OfflinePaymentSchema = z.object({
  clientMutationId: uuidSchema(),
  studentBillId: uuidSchema(),
  studentId: uuidSchema(),
  academicYearId: uuidSchema(),
  receiptNumber: z.string().min(3).max(64),
  deviceCode: z.string().min(1).max(16),
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(["cash", "momo", "orange_money", "bank_deposit"]),
  transactionRef: z.string().nullish(),
  termNumber: z.coerce.number().min(1).max(3).nullish(),
  remarks: z.string().nullish(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clientRecordedAt: z.string(),
});

export type OfflinePaymentPayload = z.infer<typeof OfflinePaymentSchema>;

/**
 * Applies a payment that was recorded on a device while offline.
 * Safe to call any number of times: the client mutation id guarantees the
 * payment is written exactly once. Payments are never merged or overwritten.
 */
export async function syncOfflinePaymentAction(payload: OfflinePaymentPayload) {
  const context = await requirePermission("finance.collect");
  if (!context?.school?.id) {
    return { error: "Unauthorized. Bursary permission required.", retryable: false };
  }

  const parsed = OfflinePaymentSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, retryable: false };
  }
  const p = parsed.data;
  const supabase = await createClient();
  const schoolId = context.school.id;

  const existing = await findPaymentByMutationId(supabase, schoolId, p.clientMutationId);
  if (existing) {
    return { success: true, paymentId: existing.id, receiptNumber: existing.receipt_number };
  }

  const baseRow = {
    school_id: schoolId,
    student_bill_id: p.studentBillId,
    student_id: p.studentId,
    academic_year_id: p.academicYearId,
    amount: p.amount,
    payment_method: p.paymentMethod,
    transaction_ref: p.transactionRef || null,
    term_number: p.termNumber || 1,
    remarks: p.remarks || null,
    received_by: context.user?.id || null,
    payment_date: p.paymentDate,
  };
  const syncColumns = {
    client_mutation_id: p.clientMutationId,
    device_code: p.deviceCode,
    recorded_offline: true,
    client_recorded_at: p.clientRecordedAt,
    synced_at: new Date().toISOString(),
  };

  // Device-prefixed numbers should never collide; if they somehow do (e.g. a
  // device that never registered), keep the printed number recognisable.
  const candidates = [p.receiptNumber, `${p.receiptNumber}-R1`, `${p.receiptNumber}-R2`];
  for (const receiptNumber of candidates) {
    const res = await insertPaymentRow(supabase, { ...baseRow, receipt_number: receiptNumber }, syncColumns, {
      requireSyncColumns: true,
    });
    if (res.data) {
      await recalculateBillTotals(supabase, p.studentBillId);
      revalidatePath("/dashboard/finance");
      revalidatePath("/dashboard");
      return { success: true, paymentId: res.data.id, receiptNumber: res.data.receipt_number };
    }
    if (res.code === "23505") {
      const dup = await findPaymentByMutationId(supabase, schoolId, p.clientMutationId);
      if (dup) return { success: true, paymentId: dup.id, receiptNumber: dup.receipt_number };
      continue;
    }
    return { error: res.message || "Failed to sync payment.", retryable: true };
  }

  return { error: "Receipt number conflict could not be resolved.", retryable: false };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function parseOptionalUuid(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

function isMissingColumnError(code?: string, message?: string) {
  return code === "42703" || code === "PGRST204" || /column .* does not exist|schema cache/i.test(message || "");
}

async function findPaymentByMutationId(
  supabase: SupabaseServerClient,
  schoolId: string,
  clientMutationId: string
): Promise<{ id: string; receipt_number: string } | null> {
  const { data, error } = await supabase
    .from("fee_payments")
    .select("id, receipt_number")
    .eq("school_id", schoolId)
    .eq("client_mutation_id", clientMutationId)
    .maybeSingle();
  if (error) return null; // column missing before migration 00014 → treat as not found
  return data;
}

/**
 * Inserts a payment row. If migration 00014 has not been applied yet, the
 * optional sync columns are dropped so online payments keep working.
 */
async function insertPaymentRow(
  supabase: SupabaseServerClient,
  row: Record<string, unknown>,
  syncColumns: Record<string, unknown>,
  opts: { requireSyncColumns?: boolean } = {}
): Promise<{ data: { id: string; receipt_number: string } | null; code?: string; message?: string }> {
  const attempt = await supabase
    .from("fee_payments")
    .insert({ ...row, ...syncColumns })
    .select("id, receipt_number")
    .single();

  if (!attempt.error) return { data: attempt.data };

  if (
    !opts.requireSyncColumns &&
    Object.keys(syncColumns).length > 0 &&
    isMissingColumnError(attempt.error.code, attempt.error.message)
  ) {
    const fallback = await supabase.from("fee_payments").insert(row).select("id, receipt_number").single();
    if (!fallback.error) return { data: fallback.data };
    return { data: null, code: fallback.error.code, message: fallback.error.message };
  }

  return { data: null, code: attempt.error.code, message: attempt.error.message };
}

/**
 * Recomputes a bill's total_paid from the payment ledger. Idempotent and
 * immune to lost updates when two payments land at the same time.
 */
async function recalculateBillTotals(supabase: SupabaseServerClient, studentBillId: string) {
  const [{ data: bill }, { data: payments }] = await Promise.all([
    supabase.from("student_bills").select("total_billed").eq("id", studentBillId).single(),
    supabase.from("fee_payments").select("amount").eq("student_bill_id", studentBillId),
  ]);
  if (!bill) return;

  const totalPaid = (payments || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const billed = Number(bill.total_billed);
  const status = totalPaid >= billed ? "paid" : totalPaid > 0 ? "partial" : "unpaid";

  await supabase
    .from("student_bills")
    .update({ total_paid: totalPaid, status, updated_at: new Date().toISOString() })
    .eq("id", studentBillId);
}

export async function createFeeStructureAction(formData: FormData) {
  const context = await requirePermission("finance.manage_structure");
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
