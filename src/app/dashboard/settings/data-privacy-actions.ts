"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/tenancy/context";
import { revalidatePath } from "next/cache";
import { restoreSchoolRecordsService, type RestorationSummary } from "@/lib/data-privacy/data-sovereignty-service";

export interface NseiSukulBackupArchive {
  export_format_version: "1.0";
  system: "Nsei Sukul Management System";
  export_date: string;
  exported_by: {
    id: string;
    name: string;
    email: string;
  };
  school: {
    id: string;
    name: string;
    slug: string;
    code: string | null;
    motto: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    subsystem: string;
    currency: string;
    ranking_mode: string;
    result_approval_workflow: string;
    matricule_format?: string;
    report_card_template?: string;
  };
  statistics: {
    classes_count: number;
    streams_count: number;
    subjects_count: number;
    students_count: number;
    enrollments_count: number;
    marks_count: number;
    fee_payments_count: number;
    staff_count: number;
  };
  data: {
    academic_years: Record<string, unknown>[];
    classes: Record<string, unknown>[];
    streams: Record<string, unknown>[];
    subjects: Record<string, unknown>[];
    class_subjects: Record<string, unknown>[];
    students: Record<string, unknown>[];
    enrolments: Record<string, unknown>[];
    assessment_marks: Record<string, unknown>[];
    fee_structures: Record<string, unknown>[];
    fee_items: Record<string, unknown>[];
    fee_payments: Record<string, unknown>[];
    staff: Record<string, unknown>[];
  };
}

/**
 * Generates and downloads a complete, self-contained JSON backup package
 * containing 100% of the school's relational data.
 */
export async function exportCompleteSchoolArchive(): Promise<{
  success: boolean;
  archive?: NseiSukulBackupArchive;
  error?: string;
}> {
  try {
    const context = await requirePermission("school.settings.manage");
    const supabase = await createClient();
    const admin = createAdminClient();

    // 1. Fetch School Profile
    const { data: school, error: schoolErr } = await supabase
      .from("schools")
      .select("*")
      .eq("id", context.school.id)
      .single();

    if (schoolErr || !school) {
      throw new Error("Unable to retrieve school profile.");
    }

    // 2. Fetch User Profile
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("id, full_name, email")
      .eq("id", context.user.id)
      .single();

    // 3. Fetch Academic Years
    const { data: academicYears = [] } = await supabase
      .from("academic_years")
      .select("*")
      .eq("school_id", context.school.id);

    // 4. Fetch Classes & Streams
    const { data: classes = [] } = await supabase
      .from("classes")
      .select("*")
      .eq("school_id", context.school.id)
      .order("level_order", { ascending: true });

    const { data: streams = [] } = await supabase
      .from("class_streams")
      .select("*")
      .eq("school_id", context.school.id);

    // 5. Fetch Subjects & Class Subjects
    const { data: subjects = [] } = await supabase
      .from("subjects")
      .select("*")
      .eq("school_id", context.school.id);

    const { data: classSubjects = [] } = await supabase
      .from("class_subjects")
      .select("*")
      .eq("school_id", context.school.id);

    // 6. Fetch Students & Enrollments
    const { data: students = [] } = await supabase
      .from("students")
      .select("*")
      .eq("school_id", context.school.id)
      .order("last_name", { ascending: true });

    const { data: enrolments = [] } = await supabase
      .from("enrolments")
      .select("*")
      .eq("school_id", context.school.id);

    // 7. Fetch Assessment Marks
    const { data: marks = [] } = await supabase
      .from("assessment_marks")
      .select("*")
      .eq("school_id", context.school.id);

    // 8. Fetch Bursary & Fee Structures
    const { data: feeStructures = [] } = await supabase
      .from("fee_structures")
      .select("*")
      .eq("school_id", context.school.id);

    const { data: feeItems = [] } = await supabase
      .from("fee_items")
      .select("*")
      .eq("school_id", context.school.id);

    const { data: feePayments = [] } = await supabase
      .from("fee_payments")
      .select("*")
      .eq("school_id", context.school.id);

    // 9. Fetch Staff Memberships
    const { data: staffMemberships = [] } = await supabase
      .from("school_memberships")
      .select("id, user_id, title, status, created_at, role:roles(name, code), user:user_profiles(full_name, email, phone)")
      .eq("school_id", context.school.id);

    // Update last_data_export_at
    const nowIso = new Date().toISOString();
    await admin
      .from("schools")
      .update({ last_data_export_at: nowIso })
      .eq("id", context.school.id);

    // Record audit log
    await admin.from("audit_logs").insert({
      school_id: context.school.id,
      user_id: context.user.id,
      action: "DATA_SOVEREIGNTY_EXPORT_ARCHIVE",
      resource_type: "school",
      resource_id: context.school.id,
      details: {
        students_count: students?.length || 0,
        marks_count: marks?.length || 0,
        classes_count: classes?.length || 0,
        exported_by: userProfile?.email,
      },
    });

    const archive: NseiSukulBackupArchive = {
      export_format_version: "1.0",
      system: "Nsei Sukul Management System",
      export_date: nowIso,
      exported_by: {
        id: context.user.id,
        name: userProfile?.full_name || "School Administrator",
        email: userProfile?.email || "admin@school.cm",
      },
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
        code: school.code,
        motto: school.motto,
        address: school.address,
        phone: school.phone,
        email: school.email,
        subsystem: school.subsystem,
        currency: school.currency,
        ranking_mode: school.ranking_mode,
        result_approval_workflow: school.result_approval_workflow,
        matricule_format: school.matricule_format,
        report_card_template: school.report_card_template,
      },
      statistics: {
        classes_count: classes?.length || 0,
        streams_count: streams?.length || 0,
        subjects_count: subjects?.length || 0,
        students_count: students?.length || 0,
        enrollments_count: enrolments?.length || 0,
        marks_count: marks?.length || 0,
        fee_payments_count: feePayments?.length || 0,
        staff_count: staffMemberships?.length || 0,
      },
      data: {
        academic_years: (academicYears || []) as Record<string, unknown>[],
        classes: (classes || []) as Record<string, unknown>[],
        streams: (streams || []) as Record<string, unknown>[],
        subjects: (subjects || []) as Record<string, unknown>[],
        class_subjects: (classSubjects || []) as Record<string, unknown>[],
        students: (students || []) as Record<string, unknown>[],
        enrolments: (enrolments || []) as Record<string, unknown>[],
        assessment_marks: (marks || []) as Record<string, unknown>[],
        fee_structures: (feeStructures || []) as Record<string, unknown>[],
        fee_items: (feeItems || []) as Record<string, unknown>[],
        fee_payments: (feePayments || []) as Record<string, unknown>[],
        staff: (staffMemberships || []) as unknown as Record<string, unknown>[],
      },
    };

    return { success: true, archive };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to export school archive.";
    return { success: false, error: message };
  }
}

/**
 * Exports individual school modules into clean, Excel-compatible CSVs
 * equipped with UTF-8 BOM so French/Cameroonian names render flawlessly in MS Excel.
 */
export async function exportSchoolModuleCsvAction(
  module: "students" | "marks" | "fees"
): Promise<{ success: boolean; filename?: string; csvContent?: string; error?: string }> {
  try {
    const context = await requirePermission("school.settings.manage");
    const supabase = await createClient();

    const { data: school } = await supabase
      .from("schools")
      .select("name, code")
      .eq("id", context.school.id)
      .single();

    const schoolCode = school?.code || "SCHOOL";
    const dateStamp = new Date().toISOString().split("T")[0];

    // Helper to escape CSV cell contents
    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // UTF-8 BOM byte sequence ensures Excel opens French/English accents perfectly
    const BOM = "\uFEFF";

    if (module === "students") {
      const { data: students = [] } = await supabase
        .from("students")
        .select(`
          matricule,
          last_name,
          first_name,
          gender,
          dob,
          pob,
          parent_name,
          parent_phone,
          is_repeater,
          residence,
          enrolments (
            status,
            class_stream:class_streams (
              name,
              class:classes (name)
            )
          )
        `)
        .eq("school_id", context.school.id)
        .order("last_name", { ascending: true });

      const headers = [
        "Matricule",
        "Last Name",
        "First Name",
        "Gender",
        "Date of Birth",
        "Place of Birth",
        "Class",
        "Stream",
        "Parent / Guardian",
        "Parent Phone",
        "Residence",
        "Repeating Status",
        "Enrollment Status",
      ];

      const rows = (students || []).map((s: any) => {
        const activeEnrolment = s.enrolments?.[0];
        const className = activeEnrolment?.class_stream?.class?.name || "Unassigned";
        const streamName = activeEnrolment?.class_stream?.name || "";

        return [
          escapeCsv(s.matricule || ""),
          escapeCsv(s.last_name || ""),
          escapeCsv(s.first_name || ""),
          escapeCsv(s.gender || ""),
          escapeCsv(s.dob || ""),
          escapeCsv(s.pob || ""),
          escapeCsv(className),
          escapeCsv(streamName),
          escapeCsv(s.parent_name || ""),
          escapeCsv(s.parent_phone || ""),
          escapeCsv(s.residence || "Day"),
          escapeCsv(s.is_repeater ? "Repeater" : "New Student"),
          escapeCsv(activeEnrolment?.status || "Active"),
        ].join(",");
      });

      const csvContent = BOM + [headers.join(","), ...rows].join("\r\n");
      return {
        success: true,
        filename: `${schoolCode}_Students_Directory_${dateStamp}.csv`,
        csvContent,
      };
    }

    if (module === "marks") {
      const { data: marks = [] } = await supabase
        .from("assessment_marks")
        .select(`
          mark,
          competency_evaluation,
          is_locked,
          created_at,
          sequence:evaluation_sequences (name, sequence_number),
          student:students (matricule, first_name, last_name),
          class_subject:class_subjects (
            subject:subjects (name, code),
            class_stream:class_streams (
              name,
              class:classes (name)
            )
          )
        `)
        .eq("school_id", context.school.id)
        .order("created_at", { ascending: false });

      const headers = [
        "Matricule",
        "Student Name",
        "Class",
        "Stream",
        "Subject Code",
        "Subject Name",
        "Sequence",
        "Mark (/20)",
        "CBA Competency Level",
        "Locked",
        "Date Recorded",
      ];

      const rows = (marks || []).map((m: any) => {
        const studentName = `${m.student?.last_name || ""} ${m.student?.first_name || ""}`.trim();
        const className = m.class_subject?.class_stream?.class?.name || "";
        const streamName = m.class_subject?.class_stream?.name || "";
        const subjectCode = m.class_subject?.subject?.code || "";
        const subjectName = m.class_subject?.subject?.name || "";
        const seqName = m.sequence?.name || `Seq ${m.sequence?.sequence_number || ""}`;

        return [
          escapeCsv(m.student?.matricule || ""),
          escapeCsv(studentName),
          escapeCsv(className),
          escapeCsv(streamName),
          escapeCsv(subjectCode),
          escapeCsv(subjectName),
          escapeCsv(seqName),
          escapeCsv(m.mark ?? ""),
          escapeCsv(m.competency_evaluation || "N/A"),
          escapeCsv(m.is_locked ? "Yes" : "No"),
          escapeCsv(m.created_at ? new Date(m.created_at).toLocaleDateString("en-GB") : ""),
        ].join(",");
      });

      const csvContent = BOM + [headers.join(","), ...rows].join("\r\n");
      return {
        success: true,
        filename: `${schoolCode}_Assessment_Marks_Ledger_${dateStamp}.csv`,
        csvContent,
      };
    }

    if (module === "fees") {
      const { data: payments = [] } = await supabase
        .from("fee_payments")
        .select(`
          receipt_number,
          amount_paid,
          payment_method,
          reference_code,
          payer_name,
          created_at,
          student:students (
            matricule,
            first_name,
            last_name,
            enrolments (
              class_stream:class_streams (
                name,
                class:classes (name)
              )
            )
          )
        `)
        .eq("school_id", context.school.id)
        .order("created_at", { ascending: false });

      const headers = [
        "Receipt Number",
        "Matricule",
        "Student Name",
        "Class",
        "Stream",
        "Amount Paid (XAF)",
        "Payment Method",
        "Reference Code",
        "Payer Name",
        "Payment Date",
      ];

      const rows = (payments || []).map((p: any) => {
        const studentName = `${p.student?.last_name || ""} ${p.student?.first_name || ""}`.trim();
        const activeEnrolment = p.student?.enrolments?.[0];
        const className = activeEnrolment?.class_stream?.class?.name || "";
        const streamName = activeEnrolment?.class_stream?.name || "";

        return [
          escapeCsv(p.receipt_number || ""),
          escapeCsv(p.student?.matricule || ""),
          escapeCsv(studentName),
          escapeCsv(className),
          escapeCsv(streamName),
          escapeCsv(p.amount_paid ?? 0),
          escapeCsv(p.payment_method || "Cash"),
          escapeCsv(p.reference_code || ""),
          escapeCsv(p.payer_name || ""),
          escapeCsv(p.created_at ? new Date(p.created_at).toLocaleDateString("en-GB") : ""),
        ].join(",");
      });

      const csvContent = BOM + [headers.join(","), ...rows].join("\r\n");
      return {
        success: true,
        filename: `${schoolCode}_Bursary_Fee_Payments_${dateStamp}.csv`,
        csvContent,
      };
    }

    throw new Error("Invalid export module specified.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to export CSV.";
    return { success: false, error: message };
  }
}

/**
 * Restores a school's entire database records from a previously exported Nsei Sukul JSON backup package.
 * "The Boomerang Engine" — effortlessly welcomes back returning schools!
 */
export async function restoreSchoolFromBackupAction(
  archiveJsonString: string
): Promise<{
  success: boolean;
  restoredSummary?: RestorationSummary;
  error?: string;
}> {
  try {
    const context = await requirePermission("school.settings.manage");
    const admin = createAdminClient();

    let archive: NseiSukulBackupArchive;
    try {
      archive = JSON.parse(archiveJsonString);
    } catch {
      throw new Error("Invalid backup file. The uploaded file is not valid JSON.");
    }

    if (archive.export_format_version !== "1.0" || archive.system !== "Nsei Sukul Management System") {
      throw new Error("Unrecognized backup archive. Please ensure this file was exported from Nsei Sukul.");
    }

    if (!archive.data || !archive.school) {
      throw new Error("Corrupted backup file: missing required data or school attributes.");
    }

    const restoredSummary = await restoreSchoolRecordsService(admin, context.school.id, archive);

    // Log the restore event
    await admin.from("audit_logs").insert({
      school_id: context.school.id,
      user_id: context.user.id,
      action: "DATA_SOVEREIGNTY_RESTORE_ARCHIVE",
      resource_type: "school",
      resource_id: context.school.id,
      details: {
        original_school_name: archive.school.name,
        restored_students: restoredSummary.studentsCount,
        restored_marks: restoredSummary.marksCount,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/students");
    revalidatePath("/dashboard/academics/marks");

    return {
      success: true,
      restoredSummary,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to restore school backup.";
    return { success: false, error: message };
  }
}

/**
 * Initiates the safe 30-day soft-delete lifecycle for a school.
 * Protects engineers from legal liability and prevents malicious instant deletion.
 */
export async function requestSchoolDeletionAction(
  formData: FormData
): Promise<{ success: boolean; scheduledFor?: string; error?: string }> {
  try {
    const context = await requirePermission("school.settings.manage");
    const admin = createAdminClient();

    const confirmationName = String(formData.get("confirmationName") || "").trim();
    const reason = String(formData.get("reason") || "").trim();

    // Verify current school details
    const { data: school, error: schoolErr } = await admin
      .from("schools")
      .select("id, name, deletion_status")
      .eq("id", context.school.id)
      .single();

    if (schoolErr || !school) {
      throw new Error("School not found.");
    }

    if (school.deletion_status === "pending_deletion") {
      throw new Error("This school is already scheduled for deletion.");
    }

    // Verify exact school name confirmation
    if (confirmationName.toLowerCase() !== school.name.trim().toLowerCase()) {
      throw new Error(`Please type "${school.name}" exactly to confirm.`);
    }

    // Schedule deletion for 30 days from now
    const now = new Date();
    const scheduledDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const scheduledIso = scheduledDate.toISOString();

    const { error: updateErr } = await admin
      .from("schools")
      .update({
        deletion_status: "pending_deletion",
        deletion_requested_at: now.toISOString(),
        deletion_scheduled_for: scheduledIso,
        deletion_requested_by: context.user.id,
        deletion_reason: reason || "Administrator offboarding",
      })
      .eq("id", context.school.id);

    if (updateErr) {
      throw new Error("Could not update school deletion status. Please try again.");
    }

    // Audit log
    await admin.from("audit_logs").insert({
      school_id: context.school.id,
      user_id: context.user.id,
      action: "DATA_SOVEREIGNTY_DELETION_REQUESTED",
      resource_type: "school",
      resource_id: context.school.id,
      details: {
        school_name: school.name,
        scheduled_for: scheduledIso,
        reason: reason || "None provided",
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true, scheduledFor: scheduledIso };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to schedule school deletion.";
    return { success: false, error: message };
  }
}

/**
 * Instantly cancels a pending school deletion request and restores active status.
 */
export async function cancelSchoolDeletionAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const context = await requirePermission("school.settings.manage");
    const admin = createAdminClient();

    const { error: cancelErr } = await admin
      .from("schools")
      .update({
        deletion_status: "active",
        deletion_requested_at: null,
        deletion_scheduled_for: null,
        deletion_requested_by: null,
        deletion_reason: null,
      })
      .eq("id", context.school.id);

    if (cancelErr) {
      throw new Error("Failed to cancel deletion request.");
    }

    // Audit log
    await admin.from("audit_logs").insert({
      school_id: context.school.id,
      user_id: context.user.id,
      action: "DATA_SOVEREIGNTY_DELETION_CANCELLED",
      resource_type: "school",
      resource_id: context.school.id,
      details: {
        cancelled_by_user_id: context.user.id,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel deletion.";
    return { success: false, error: message };
  }
}
