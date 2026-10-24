"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAnyPermission } from "@/lib/tenancy/context";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const RollCallSchema = z.object({
  academicYearId: z.string().uuid(),
  termId: z.string().uuid(),
  classStreamId: z.string().uuid(),
  sessionDate: z.string(),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(["present", "unjustified_absent", "justified_absent", "late", "excused"]),
      hoursMissed: z.number().min(0).max(10).default(0),
      justificationNote: z.string().optional(),
    })
  ),
});

export async function saveRollCallAction(payload: {
  academicYearId: string;
  termId: string;
  classStreamId: string;
  sessionDate: string;
  records: Array<{
    studentId: string;
    status: "present" | "unjustified_absent" | "justified_absent" | "late" | "excused";
    hoursMissed: number;
    justificationNote?: string;
  }>;
}) {
  const context = await requireAnyPermission([
    "attendance.take_assigned",
    "attendance.view_all",
    "academics.manage",
  ]);
  if (!context?.school?.id) {
    return { error: "Unauthorized. Staff permission required." };
  }

  const parsed = RollCallSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // 1. Upsert attendance session
  const { data: session, error: sessionError } = await supabase
    .from("attendance_sessions")
    .upsert(
      {
        school_id: context.school.id,
        academic_year_id: parsed.data.academicYearId,
        term_id: parsed.data.termId,
        class_stream_id: parsed.data.classStreamId,
        session_date: parsed.data.sessionDate,
        period_type: "daily",
        recorded_by: context.user?.id || null,
      },
      { onConflict: "class_stream_id,session_date,period_type" }
    )
    .select("id")
    .single();

  if (sessionError || !session) {
    return { error: sessionError?.message || "Failed to create attendance session." };
  }

  // 2. Upsert individual student records
  const recordsToUpsert = parsed.data.records.map((r) => ({
    school_id: context.school.id,
    session_id: session.id,
    student_id: r.studentId,
    status: r.status,
    hours_missed: r.hoursMissed,
    justification_note: r.justificationNote || null,
  }));

  const { error: recordsError } = await supabase
    .from("attendance_records")
    .upsert(recordsToUpsert, { onConflict: "session_id,student_id" });

  if (recordsError) {
    return { error: recordsError.message };
  }

  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/academics/report-cards");
  return { success: true };
}

export async function recordDisciplinarySanctionAction(formData: FormData) {
  const context = await requireAnyPermission([
    "attendance.take_assigned",
    "attendance.view_all",
    "academics.manage",
  ]);
  if (!context?.school?.id) {
    return { error: "Unauthorized. Discipline Master or Administrator role required." };
  }

  const studentId = formData.get("studentId") as string;
  const classStreamId = formData.get("classStreamId") as string;
  const academicYearId = formData.get("academicYearId") as string;
  const termId = formData.get("termId") as string;
  const sanctionTypeResult = z
    .enum(["warning", "reprimand", "suspension", "punishment", "dismissed"])
    .safeParse(formData.get("sanctionType"));
  const infractionReason = formData.get("infractionReason") as string;
  const punishmentHours = parseInt((formData.get("punishmentHours") as string) || "0", 10);
  const suspensionDays = parseInt((formData.get("suspensionDays") as string) || "0", 10);

  if (!studentId || !infractionReason || !sanctionTypeResult.success) {
    return { error: "Missing required disciplinary sanction fields." };
  }

  const sanctionType = sanctionTypeResult.data;

  const supabase = await createClient();

  const { error } = await supabase.from("disciplinary_records").insert({
    school_id: context.school.id,
    academic_year_id: academicYearId,
    term_id: termId,
    student_id: studentId,
    class_stream_id: classStreamId,
    sanction_type: sanctionType,
    punishment_hours: punishmentHours,
    suspension_days: suspensionDays,
    infraction_reason: infractionReason,
    recorded_by: context.user?.id || null,
    incident_date: new Date().toISOString().split("T")[0],
    status: "active",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/academics/report-cards");
  return { success: true };
}
