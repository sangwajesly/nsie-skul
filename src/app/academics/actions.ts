"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireAnyPermission } from "@/lib/tenancy/context";
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

const ClassSchema = z.object({
  name: z.string().min(2, "Class name is required"),
  levelOrder: z.coerce.number().int().min(1).max(12).default(1),
  cycle: z.enum(["cycle_1", "cycle_2"]).default("cycle_1"),
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

export async function createDepartmentAction(_state: unknown, formData: FormData) {
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
  return { success: true as const, message: "Department created." };
}

export async function createSubjectAction(_state: unknown, formData: FormData) {
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
  return { success: true as const, message: "Subject created." };
}

export async function createClassAction(_state: unknown, formData: FormData) {
  const context = await requirePermission("academics.manage");
  const parsed = ClassSchema.safeParse({
    name: formData.get("name"),
    levelOrder: formData.get("levelOrder"),
    cycle: formData.get("cycle"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert({
    school_id: context.school.id,
    name: parsed.data.name,
    level_order: parsed.data.levelOrder,
    cycle: parsed.data.cycle,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/academics");
  return { success: true as const, message: "Class created." };
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

export async function assignClassMasterAction(formData: FormData) {
  const context = await requireAnyPermission(["assignments.manage", "academics.manage"]);
  const classStreamId = String(formData.get("classStreamId") || "");
  const rawMasterId = String(formData.get("classMasterUserId") || "").trim();
  const classMasterUserId = rawMasterId && rawMasterId !== "none" ? rawMasterId : null;

  if (!classStreamId) {
    return { error: "Invalid class group specified." };
  }

  const supabase = await createClient();

  // If assigning a user, verify they belong to this school and are teaching staff
  if (classMasterUserId) {
    const { data: membership, error: memError } = await supabase
      .from("school_memberships")
      .select("id, role_id")
      .eq("school_id", context.school.id)
      .eq("user_id", classMasterUserId)
      .eq("status", "active")
      .maybeSingle();

    if (memError || !membership) {
      return { error: "Selected staff member was not found in this school." };
    }
  }

  // Update class stream's class_master_id
  const { error } = await supabase
    .from("class_streams")
    .update({
      class_master_id: classMasterUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", classStreamId)
    .eq("school_id", context.school.id);

  if (error) {
    return { error: `Could not assign class master: ${error.message}` };
  }

  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/academics/report-cards");
  return { success: true };
}

export async function assignHodAction(_previousState: unknown, formData: FormData) {
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
  const [membershipResult, departmentResult, yearResult] = await Promise.all([
    supabase
      .from("school_memberships")
      .select("id, role_id")
      .eq("school_id", context.school.id)
      .eq("user_id", parsed.data.hodUserId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("departments")
      .select("id")
      .eq("school_id", context.school.id)
      .eq("id", parsed.data.departmentId)
      .maybeSingle(),
    supabase
      .from("academic_years")
      .select("id")
      .eq("school_id", context.school.id)
      .eq("id", parsed.data.academicYearId)
      .maybeSingle(),
  ]);

  if (membershipResult.error || departmentResult.error || yearResult.error) {
    return { error: "Could not verify the staff member and school details. Please try again." };
  }

  if (!membershipResult.data) {
    return { error: "Choose an active Head of Department from this school." };
  }

  const { data: staffRole, error: roleError } = await supabase
    .from("roles")
    .select("id, code")
    .eq("id", membershipResult.data.role_id)
    .maybeSingle();

  if (roleError || !staffRole || !["hod", "teacher", "class_master"].includes(staffRole.code)) {
    return { error: "This staff member must be a member of the teaching faculty (Teacher, Class Master, or HOD)." };
  }

  if (!departmentResult.data || !yearResult.data) {
    return { error: "Choose a department and academic year belonging to this school." };
  }

  if (parsed.data.scopeType === "subject") {
    const { data: subject, error: subjectError } = await supabase
      .from("subjects")
      .select("id")
      .eq("school_id", context.school.id)
      .eq("department_id", parsed.data.departmentId)
      .eq("id", parsed.data.subjectId || "")
      .maybeSingle();

    if (subjectError || !subject) {
      return { error: "Choose a subject from the selected department." };
    }
  }

  const assignmentQuery = supabase
    .from("hod_assignments")
    .select("id")
    .eq("school_id", context.school.id)
    .eq("academic_year_id", parsed.data.academicYearId)
    .eq("department_id", parsed.data.departmentId)
    .eq("scope_type", parsed.data.scopeType)
    .eq("status", "active");

  if (parsed.data.scopeType === "subject" && parsed.data.subjectId) {
    assignmentQuery.eq("subject_id", parsed.data.subjectId);
  } else {
    assignmentQuery.is("subject_id", null);
  }

  const { data: existingAssignment, error: assignmentLookupError } = await assignmentQuery
    .limit(1)
    .maybeSingle();

  if (assignmentLookupError) {
    return { error: "Could not check the current department assignment. Please try again." };
  }

  const assignmentData = {
    hod_user_id: parsed.data.hodUserId,
    updated_at: new Date().toISOString(),
  };

  const { error } = existingAssignment
    ? await supabase
        .from("hod_assignments")
        .update(assignmentData)
        .eq("id", existingAssignment.id)
        .eq("school_id", context.school.id)
    : await supabase.from("hod_assignments").insert({
        school_id: context.school.id,
        academic_year_id: parsed.data.academicYearId,
        hod_user_id: parsed.data.hodUserId,
        department_id: parsed.data.departmentId,
        subject_id: parsed.data.scopeType === "subject" ? parsed.data.subjectId : null,
        scope_type: parsed.data.scopeType,
        status: "active",
      });

  if (error) return { error: "Could not save the department assignment. Please try again." };

  revalidatePath("/dashboard/academics");
  return { success: true, message: existingAssignment ? "Head of Department updated." : "Head of Department assigned." };
}

export async function assignTeacherAction(_previousState: unknown, formData: FormData) {
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
  const [membershipResult, streamResult, subjectResult, yearResult] = await Promise.all([
    supabase
      .from("school_memberships")
      .select("id, role_id")
      .eq("school_id", context.school.id)
      .eq("user_id", parsed.data.teacherUserId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("class_streams")
      .select("id")
      .eq("school_id", context.school.id)
      .eq("academic_year_id", parsed.data.academicYearId)
      .eq("id", parsed.data.classStreamId)
      .maybeSingle(),
    supabase
      .from("subjects")
      .select("id")
      .eq("school_id", context.school.id)
      .eq("id", parsed.data.subjectId)
      .maybeSingle(),
    supabase
      .from("academic_years")
      .select("id")
      .eq("school_id", context.school.id)
      .eq("id", parsed.data.academicYearId)
      .maybeSingle(),
  ]);

  if (membershipResult.error || streamResult.error || subjectResult.error || yearResult.error) {
    return { error: "Could not verify the teacher and class details. Please try again." };
  }

  if (!membershipResult.data || !streamResult.data || !subjectResult.data || !yearResult.data) {
    return { error: "Choose a teacher, class group, subject, and school year from this school." };
  }

  const { data: staffRole, error: roleError } = await supabase
    .from("roles")
    .select("id, code")
    .eq("id", membershipResult.data.role_id)
    .maybeSingle();

  if (roleError || !staffRole || !["teacher", "class_master", "hod"].includes(staffRole.code)) {
    return { error: "This staff member must be a member of the teaching faculty (Teacher, Class Master, or HOD)." };
  }

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

  if (error) return { error: "Could not save the teacher assignment. Please try again." };

  revalidatePath("/dashboard/academics");
  return { success: true, message: "Teacher assignment saved." };
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
  const context = await requireAnyPermission([
    "marks.enter_assigned",
    "marks.view_all",
    "academics.manage",
  ]);
  if (!context?.school?.id) {
    return { error: "Authentication required or insufficient permissions." };
  }

  const supabase = await createClient();

  // Server-side teacher assignment enforcement:
  // Teachers can only save marks for class+subject combinations they are assigned to
  const roleCode = context.role?.code || "";
  const isTeacherRole = roleCode === "teacher" || roleCode === "class_master";
  const isHodOrAdmin =
    context.hasPermission("marks.approve_hod") ||
    context.hasPermission("academics.manage") ||
    context.isHod ||
    roleCode === "school_admin" ||
    roleCode === "principal" ||
    roleCode === "hod";

  if (isTeacherRole && !isHodOrAdmin && context.user?.id) {
    const { data: assignment } = await supabase
      .from("teacher_assignments")
      .select("id")
      .eq("school_id", context.school.id)
      .eq("academic_year_id", payload.academicYearId)
      .eq("teacher_user_id", context.user.id)
      .eq("class_stream_id", payload.classStreamId)
      .eq("subject_id", payload.subjectId)
      .maybeSingle();

    if (!assignment) {
      return {
        error: "You are not assigned to teach this subject in this class. Contact your school administrator if you believe this is an error.",
      };
    }

    // Check departmental approval status for teachers
    const { data: approval } = await supabase
      .from("departmental_approvals")
      .select("status")
      .eq("school_id", context.school.id)
      .eq("sequence_id", payload.sequenceId)
      .eq("class_stream_id", payload.classStreamId)
      .eq("subject_id", payload.subjectId)
      .maybeSingle();

    if (approval?.status === "submitted") {
      return {
        error: "This mark sheet has already been submitted to your Head of Department for review and is locked for teacher editing. Request an unlock from your HOD if corrections are required.",
      };
    }

    if (approval?.status === "approved") {
      return {
        error: "This sequence has been approved and locked by the Department Head. Only your HOD or School Administrator can make changes.",
      };
    }
  }

  // Check if locked — only allow if HOD or administrator
  const { data: existingMarks } = await supabase
    .from("assessment_marks")
    .select("is_locked")
    .eq("sequence_id", payload.sequenceId)
    .eq("class_stream_id", payload.classStreamId)
    .eq("subject_id", payload.subjectId)
    .limit(1);

  if (existingMarks && existingMarks.length > 0 && existingMarks[0].is_locked && !isHodOrAdmin) {
    return { error: "This mark sheet is locked. Only the Head of Department or School Administrator can modify approved marks." };
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
 * Teacher submits their mark sheet to the Head of Department for quality review.
 * Locks the sheet for the teacher until approved or reopened by the HOD.
 */
export async function submitSequenceMarksAction(formData: FormData) {
  const context = await requireAnyPermission([
    "marks.enter_assigned",
    "marks.view_all",
    "academics.manage",
  ]);
  if (!context?.school?.id) {
    return { error: "Authentication required." };
  }

  const sequenceId = String(formData.get("sequenceId") || "");
  const classStreamId = String(formData.get("classStreamId") || "");
  const subjectId = String(formData.get("subjectId") || "");
  const departmentId = String(formData.get("departmentId") || "");
  const academicYearId = String(formData.get("academicYearId") || "");
  const termId = String(formData.get("termId") || "");

  if (!sequenceId || !classStreamId || !subjectId) {
    return { error: "Missing required parameters to submit mark sheet." };
  }

  const supabase = await createClient();

  // Find department if not passed
  let resolvedDeptId = departmentId;
  if (!resolvedDeptId) {
    const { data: subj } = await supabase
      .from("subjects")
      .select("department_id")
      .eq("id", subjectId)
      .maybeSingle();
    resolvedDeptId = subj?.department_id || "";
  }

  if (!resolvedDeptId) {
    return { error: "Subject must belong to a department before submitting to HOD." };
  }

  // Upsert departmental_approvals with status 'submitted'
  const { error: approvalErr } = await supabase.from("departmental_approvals").upsert(
    {
      school_id: context.school.id,
      academic_year_id: academicYearId,
      term_id: termId,
      sequence_id: sequenceId,
      class_stream_id: classStreamId,
      department_id: resolvedDeptId,
      subject_id: subjectId,
      status: "submitted",
      notes: `Submitted for review by ${context.user.full_name || "Teacher"}`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "sequence_id,class_stream_id,department_id,subject_id" }
  );

  if (approvalErr) {
    return { error: approvalErr.message };
  }

  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics");
  return { success: true, message: "Marks submitted to Head of Department for review." };
}

/**
 * HOD or Principal approves and locks sequence marks for a department/subject.
 */
export async function approveDepartmentalSequenceAction(formData: FormData) {
  const context = await requireAnyPermission([
    "marks.approve_hod",
    "results.approve_school",
    "academics.manage",
  ]);
  if (!context?.school?.id) {
    return { error: "Unauthorized. HOD or Administrator role required." };
  }

  const sequenceId = formData.get("sequenceId") as string;
  const classStreamId = formData.get("classStreamId") as string;
  const departmentId = formData.get("departmentId") as string;
  const subjectId = (formData.get("subjectId") as string) || null;
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
      subject_id: subjectId,
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

  // 2. Lock marks for this subject (or department)
  if (subjectId) {
    await supabase
      .from("assessment_marks")
      .update({ is_locked: true, updated_by: context.user?.id })
      .eq("sequence_id", sequenceId)
      .eq("class_stream_id", classStreamId)
      .eq("subject_id", subjectId);
  } else {
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
  }

  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics");
  return { success: true };
}

/**
 * HOD or Principal re-enables a submitted/approved mark sheet for a teacher to make corrections.
 * Records verified audit justification (e.g. proof of student grade contestation).
 */
export async function reopenDepartmentalSequenceAction(formData: FormData) {
  const context = await requireAnyPermission([
    "marks.approve_hod",
    "results.approve_school",
    "academics.manage",
  ]);
  if (!context?.school?.id) {
    return { error: "Unauthorized. Head of Department or Administrator role required." };
  }

  const sequenceId = String(formData.get("sequenceId") || "");
  const classStreamId = String(formData.get("classStreamId") || "");
  const subjectId = String(formData.get("subjectId") || "");
  const departmentId = String(formData.get("departmentId") || "");
  const notes = String(formData.get("notes") || "").trim();

  if (!sequenceId || !classStreamId || (!departmentId && !subjectId)) {
    return { error: "Missing parameters to reopen mark sheet." };
  }

  const supabase = await createClient();

  // 1. Update departmental_approvals to 'rejected' (reopened for revision) with audit notes
  let query = supabase
    .from("departmental_approvals")
    .update({
      status: "rejected",
      notes: notes || `Reopened for teacher revision by ${context.user.full_name || "HOD"}`,
      approved_by: context.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("school_id", context.school.id)
    .eq("sequence_id", sequenceId)
    .eq("class_stream_id", classStreamId);

  if (subjectId) {
    query = query.eq("subject_id", subjectId);
  } else {
    query = query.eq("department_id", departmentId);
  }

  const { error: updateErr } = await query;
  if (updateErr) {
    return { error: updateErr.message };
  }

  // 2. Unlock assessment_marks
  let marksQuery = supabase
    .from("assessment_marks")
    .update({ is_locked: false, updated_by: context.user.id, updated_at: new Date().toISOString() })
    .eq("sequence_id", sequenceId)
    .eq("class_stream_id", classStreamId);

  if (subjectId) {
    marksQuery = marksQuery.eq("subject_id", subjectId);
  } else if (departmentId) {
    const { data: deptSubjects } = await supabase
      .from("subjects")
      .select("id")
      .eq("department_id", departmentId);
    if (deptSubjects && deptSubjects.length > 0) {
      marksQuery = marksQuery.in("subject_id", deptSubjects.map((s) => s.id));
    }
  }

  await marksQuery;

  // 3. Log audit event
  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: "REOPEN_SEQUENCE_MARKS",
    resource_type: "assessment_marks",
    resource_id: `${sequenceId}_${classStreamId}_${subjectId || departmentId}`,
    details: { reason: notes, reopened_by: context.user.id },
  });

  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics");
  return { success: true, message: "Mark sheet reopened for teacher adjustments." };
}

/**
 * Updates a student's institutional status (e.g. dismissed, suspended, transferred, active)
 * Soft-deactivates enrolment so the student drops off current roll calls and new marksheets
 * while preserving all historic marks, receipts, and audit trail.
 */
export async function updateStudentStatusAction(formData: FormData) {
  const context = await requireAnyPermission(["students.manage", "academics.manage"]);
  if (!context?.school?.id) {
    return { error: "Authentication required or insufficient permissions." };
  }

  const studentId = String(formData.get("studentId") || "");
  const newStatus = String(formData.get("status") || "");
  const reason = String(formData.get("reason") || "").trim();

  const allowedStatuses = ["active", "dismissed", "withdrawn", "transferred", "suspended"];
  if (!studentId || !allowedStatuses.includes(newStatus)) {
    return { error: "Invalid student status update request." };
  }

  const supabase = await createClient();

  // 1. Verify student exists in this school
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, first_name, last_name, matricule, status")
    .eq("id", studentId)
    .eq("school_id", context.school.id)
    .maybeSingle();

  if (studentError || !student) {
    return { error: "Student record not found in this school." };
  }

  // Map to student table status: 'active', 'withdrawn', 'transferred', 'graduated', 'dismissed'
  const studentTableStatus =
    newStatus === "suspended" ? "withdrawn" : (newStatus as "active" | "dismissed" | "withdrawn" | "transferred");

  // Map to enrolment table status: 'active', 'promoted', 'repeated', 'withdrawn', 'dismissed'
  const enrolmentTableStatus =
    newStatus === "active" ? "active" : newStatus === "dismissed" ? "dismissed" : "withdrawn";

  // Update students table
  const { error: updateStudentErr } = await supabase
    .from("students")
    .update({
      status: studentTableStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", studentId)
    .eq("school_id", context.school.id);

  if (updateStudentErr) {
    return { error: updateStudentErr.message };
  }

  // Update current enrolments
  await supabase
    .from("enrolments")
    .update({
      status: enrolmentTableStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("student_id", studentId)
    .eq("school_id", context.school.id);

  // Insert audit log
  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: "UPDATE_STUDENT_STATUS",
    resource_type: "student",
    resource_id: studentId,
    details: {
      matricule: student.matricule,
      name: `${student.first_name} ${student.last_name}`,
      previous_status: student.status,
      new_status: newStatus,
      reason: reason || null,
    },
  });

  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics/report-cards");
  revalidatePath("/dashboard");

  return { success: true, message: `Student status updated to ${newStatus}.` };
}

