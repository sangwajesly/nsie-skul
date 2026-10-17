"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/tenancy/context";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const DepartmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  code: z.string().min(2, "Department code is required").toUpperCase(),
  description: z.string().optional(),
});

const SubjectSchema = z.object({
  departmentId: z.string().uuid("Please select a department"),
  name: z.string().min(2, "Subject name is required"),
  code: z.string().min(2, "Subject code is required").toUpperCase(),
  defaultCoefficient: z.coerce.number().min(0.5).max(10).default(2),
  defaultMaxMarks: z.coerce.number().min(5).max(100).default(20),
});

const ClassStreamSchema = z.object({
  classId: z.string().uuid("Please select a class"),
  name: z.string().min(2, "Stream name is required"),
  streamTag: z.string().optional(),
});

const HodAssignmentSchema = z.object({
  academicYearId: z.string().uuid(),
  hodUserId: z.string().uuid("Please select a staff member"),
  departmentId: z.string().uuid("Please select a department"),
  subjectId: z.string().uuid().optional().or(z.literal("")),
  scopeType: z.enum(["department", "subject"]),
});

const TeacherAssignmentSchema = z.object({
  academicYearId: z.string().uuid(),
  teacherUserId: z.string().uuid("Please select a teacher"),
  classStreamId: z.string().uuid("Please select a class stream"),
  subjectId: z.string().uuid("Please select a subject"),
});

const ClassSubjectConfigSchema = z.object({
  classStreamId: z.string().uuid(),
  subjectId: z.string().uuid(),
  coefficient: z.coerce.number().min(0.5).max(10),
  maxMarks: z.coerce.number().min(5).max(100), // e.g. 20, 40, 100 for technical
});

const StudentRegisterSchema = z.object({
  academicYearId: z.string().uuid(),
  classStreamId: z.string().uuid(),
  matricule: z.string().min(2, "Matricule is required"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  gender: z.enum(["M", "F"]),
  residenceStatus: z.enum(["day", "boarding"]),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
});

export async function createDepartmentAction(formData: FormData) {
  const context = await requirePermission("academics.manage");
  const parsed = DepartmentSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({
    school_id: context.school.id,
    name: parsed.data.name,
    code: parsed.data.code,
    description: parsed.data.description,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/academics");
  return { success: true };
}

export async function createSubjectAction(formData: FormData) {
  const context = await requirePermission("academics.manage");
  const parsed = SubjectSchema.safeParse({
    departmentId: formData.get("departmentId"),
    name: formData.get("name"),
    code: formData.get("code"),
    defaultCoefficient: formData.get("defaultCoefficient"),
    defaultMaxMarks: formData.get("defaultMaxMarks"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert({
    school_id: context.school.id,
    department_id: parsed.data.departmentId,
    name: parsed.data.name,
    code: parsed.data.code,
    default_coefficient: parsed.data.defaultCoefficient,
    default_max_marks: parsed.data.defaultMaxMarks,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/academics");
  return { success: true };
}

export async function createClassStreamAction(formData: FormData) {
  const context = await requirePermission("academics.manage");
  const parsed = ClassStreamSchema.safeParse({
    classId: formData.get("classId"),
    name: formData.get("name"),
    streamTag: formData.get("streamTag"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("class_streams").insert({
    school_id: context.school.id,
    class_id: parsed.data.classId,
    name: parsed.data.name,
    stream_tag: parsed.data.streamTag,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/academics");
  return { success: true };
}

export async function assignHodAction(formData: FormData) {
  const context = await requirePermission("assignments.manage");
  const parsed = HodAssignmentSchema.safeParse({
    academicYearId: formData.get("academicYearId"),
    hodUserId: formData.get("hodUserId"),
    departmentId: formData.get("departmentId"),
    subjectId: formData.get("subjectId") || undefined,
    scopeType: formData.get("scopeType"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("hod_assignments").insert({
    school_id: context.school.id,
    academic_year_id: parsed.data.academicYearId,
    hod_user_id: parsed.data.hodUserId,
    department_id: parsed.data.departmentId,
    subject_id: parsed.data.scopeType === "subject" ? parsed.data.subjectId : null,
    scope_type: parsed.data.scopeType,
    status: "active",
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/academics");
  return { success: true };
}

export async function assignTeacherAction(formData: FormData) {
  const context = await requirePermission("assignments.manage");
  const parsed = TeacherAssignmentSchema.safeParse({
    academicYearId: formData.get("academicYearId"),
    teacherUserId: formData.get("teacherUserId"),
    classStreamId: formData.get("classStreamId"),
    subjectId: formData.get("subjectId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("teacher_assignments").upsert(
    {
      school_id: context.school.id,
      academic_year_id: parsed.data.academicYearId,
      teacher_user_id: parsed.data.teacherUserId,
      class_stream_id: parsed.data.classStreamId,
      subject_id: parsed.data.subjectId,
    },
    { onConflict: "academic_year_id,class_stream_id,subject_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/academics");
  return { success: true };
}

export async function configureClassSubjectAction(formData: FormData) {
  const context = await requirePermission("schemes.manage");
  const parsed = ClassSubjectConfigSchema.safeParse({
    classStreamId: formData.get("classStreamId"),
    subjectId: formData.get("subjectId"),
    coefficient: formData.get("coefficient"),
    maxMarks: formData.get("maxMarks"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("class_subjects").upsert(
    {
      school_id: context.school.id,
      class_stream_id: parsed.data.classStreamId,
      subject_id: parsed.data.subjectId,
      coefficient: parsed.data.coefficient,
      max_marks: parsed.data.maxMarks,
    },
    { onConflict: "class_stream_id,subject_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/academics");
  return { success: true };
}

export async function registerStudentAction(formData: FormData) {
  const context = await requirePermission("students.manage");
  const parsed = StudentRegisterSchema.safeParse({
    academicYearId: formData.get("academicYearId"),
    classStreamId: formData.get("classStreamId"),
    matricule: formData.get("matricule"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    gender: formData.get("gender"),
    residenceStatus: formData.get("residenceStatus"),
    guardianName: formData.get("guardianName"),
    guardianPhone: formData.get("guardianPhone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // 1. Insert or update student
  const { data: student, error: studentError } = await supabase
    .from("students")
    .upsert(
      {
        school_id: context.school.id,
        matricule: parsed.data.matricule,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        gender: parsed.data.gender,
        residence_status: parsed.data.residenceStatus,
        guardian_name: parsed.data.guardianName,
        guardian_phone: parsed.data.guardianPhone,
        status: "active",
      },
      { onConflict: "school_id,matricule" }
    )
    .select("id")
    .single();

  if (studentError || !student) {
    return { error: studentError?.message || "Failed to create student record." };
  }

  // 2. Insert enrolment
  const { error: enrolError } = await supabase.from("enrolments").upsert(
    {
      school_id: context.school.id,
      student_id: student.id,
      academic_year_id: parsed.data.academicYearId,
      class_stream_id: parsed.data.classStreamId,
      status: "active",
    },
    { onConflict: "academic_year_id,student_id" }
  );

  if (enrolError) return { error: enrolError.message };

  revalidatePath("/dashboard/students");
  return { success: true };
}

/**
 * Saves a batch of assessment marks for a specific sequence, stream, and subject.
 * Honors customizable max_marks and explicit present/absent/exempt statuses.
 */
export async function saveSequenceMarksAction(payload: {
  academicYearId: string;
  termId: string;
  sequenceId: string;
  classStreamId: string;
  subjectId: string;
  maxMarks: number;
  marks: Array<{
    studentId: string;
    score: number | null;
    status: "present" | "absent" | "exempt";
    remarks?: string;
  }>;
}) {
  const context = await requirePermission("academics:marks:enter");
  if (!context?.school?.id) {
    return { error: "Authentication required or insufficient permissions." };
  }

  const supabase = await createClient();

  // Check if already approved/locked
  const { data: existingMarks } = await supabase
    .from("assessment_marks")
    .select("is_locked")
    .eq("sequence_id", payload.sequenceId)
    .eq("class_stream_id", payload.classStreamId)
    .eq("subject_id", payload.subjectId)
    .limit(1);

  if (existingMarks && existingMarks.length > 0 && existingMarks[0].is_locked) {
    return { error: "This sequence has already been approved and locked by the Department Head." };
  }

  const rowsToUpsert = payload.marks.map((m) => {
    // If student is absent or exempt, score is null
    const finalScore = m.status === "present" ? m.score : null;
    return {
      school_id: context.school.id,
      academic_year_id: payload.academicYearId,
      term_id: payload.termId,
      sequence_id: payload.sequenceId,
      class_stream_id: payload.classStreamId,
      subject_id: payload.subjectId,
      student_id: m.studentId,
      score: finalScore,
      max_marks: payload.maxMarks || 20.0,
      status: m.status,
      remarks: m.remarks || null,
      entered_by: context.user?.id || null,
      updated_by: context.user?.id || null,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from("assessment_marks").upsert(rowsToUpsert, {
    onConflict: "sequence_id,class_stream_id,subject_id,student_id",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics");
  return { success: true };
}

/**
 * HOD or Principal approves/locks sequence marks for a department.
 */
export async function approveDepartmentalSequenceAction(formData: FormData) {
  const context = await requirePermission("academics:marks:approve");
  if (!context?.school?.id) {
    return { error: "Unauthorized. HOD or Administrator role required." };
  }

  const sequenceId = formData.get("sequenceId") as string;
  const classStreamId = formData.get("classStreamId") as string;
  const departmentId = formData.get("departmentId") as string;
  const academicYearId = formData.get("academicYearId") as string;
  const termId = formData.get("termId") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!sequenceId || !classStreamId || !departmentId) {
    return { error: "Missing required parameters for approval." };
  }

  const supabase = await createClient();

  // 1. Record approval
  const { error: approvalError } = await supabase.from("departmental_approvals").upsert(
    {
      school_id: context.school.id,
      academic_year_id: academicYearId,
      term_id: termId,
      sequence_id: sequenceId,
      class_stream_id: classStreamId,
      department_id: departmentId,
      status: "approved",
      approved_by: context.user?.id,
      approved_at: new Date().toISOString(),
      notes,
    },
    { onConflict: "sequence_id,class_stream_id,department_id,subject_id" }
  );

  if (approvalError) {
    return { error: approvalError.message };
  }

  // 2. Lock marks for all subjects belonging to this department in this stream & sequence
  const { data: deptSubjects } = await supabase
    .from("subjects")
    .select("id")
    .eq("department_id", departmentId);

  if (deptSubjects && deptSubjects.length > 0) {
    const subjectIds = deptSubjects.map((s) => s.id);
    await supabase
      .from("assessment_marks")
      .update({ is_locked: true, updated_by: context.user?.id })
      .eq("sequence_id", sequenceId)
      .eq("class_stream_id", classStreamId)
      .in("subject_id", subjectIds);
  }

  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics");
  return { success: true };
}

