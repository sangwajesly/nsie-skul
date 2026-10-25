"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireAnyPermission } from "@/lib/tenancy/context";
import { getActiveAcademicYear } from "@/lib/academic/service";
import { uuidSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const DepartmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  code: z.string().min(2, "Department code is required").toUpperCase(),
  description: z.string().optional(),
});

const DepartmentUpdateSchema = z.object({
  departmentId: uuidSchema("Department ID is required"),
  name: z.string().min(2, "Department name is required"),
  code: z.string().min(2, "Department code is required").toUpperCase(),
  description: z.string().optional(),
});

const DepartmentDeleteSchema = z.object({
  departmentId: uuidSchema("Department ID is required"),
});

const SubjectSchema = z.object({
  departmentId: uuidSchema("Please select a department"),
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

const ClassUpdateSchema = z.object({
  classId: uuidSchema("Class ID is required"),
  name: z.string().min(2, "Class name is required"),
  levelOrder: z.coerce.number().int().min(1).max(12).default(1),
  cycle: z.enum(["cycle_1", "cycle_2"]).default("cycle_1"),
});

const ClassDeleteSchema = z.object({
  classId: uuidSchema("Class ID is required"),
});

const ClassStreamSchema = z.object({
  academicYearId: uuidSchema("Please select a valid academic year.").optional().or(z.literal("")),
  classId: uuidSchema("Please select a class"),
  name: z.string().min(1, "Class group name is required"),
  streamTag: z.string().optional(),
});

const ClassStreamUpdateSchema = z.object({
  classStreamId: uuidSchema("Class group ID is required"),
  name: z.string().min(1, "Class group name is required"),
  streamTag: z.string().optional(),
});

const ClassStreamDeleteSchema = z.object({
  classStreamId: uuidSchema("Class group ID is required"),
});

const HodAssignmentSchema = z.object({
  academicYearId: uuidSchema("Please select a valid academic year.").optional().or(z.literal("")),
  hodUserId: uuidSchema("Please select a staff member"),
  departmentId: uuidSchema("Please select a department"),
  subjectId: uuidSchema("Please select a subject").optional().or(z.literal("")),
  scopeType: z.enum(["department", "subject"]),
});

const TeacherAssignmentSchema = z.object({
  academicYearId: uuidSchema("Please select a valid academic year.").optional().or(z.literal("")),
  teacherUserId: uuidSchema("Please select a teacher"),
  classStreamId: uuidSchema("Please select a class group"),
  subjectId: uuidSchema("Please select a subject"),
});

const ClassSubjectConfigSchema = z.object({
  classStreamId: uuidSchema("Please select a class group"),
  subjectId: uuidSchema("Please select a subject"),
  coefficient: z.coerce.number().min(0.5).max(10),
  maxMarks: z.coerce.number().min(5).max(100), // e.g. 20, 40, 100 for technical
});

const StudentRegisterSchema = z.object({
  academicYearId: uuidSchema("Please select an academic year"),
  classStreamId: uuidSchema("Please select a class group"),
  matricule: z.string().min(2, "Matricule is required"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  gender: z.enum(["M", "F"]),
  residenceStatus: z.enum(["day", "boarding"]),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
});

export async function createDepartmentAction(_state: unknown, formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
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

  if (error) {
    if (error.code === "23505") {
      return { error: `A department with code "${parsed.data.code}" already exists.` };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/academics");
  return { success: true as const, message: `Department "${parsed.data.name}" created.` };
}

export async function updateDepartmentAction(_state: unknown, formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
  const parsed = DepartmentUpdateSchema.safeParse({
    departmentId: formData.get("departmentId"),
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("departments")
    .update({
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.departmentId)
    .eq("school_id", context.school.id);

  if (error) {
    if (error.code === "23505") {
      return { error: `Another department with code "${parsed.data.code}" already exists.` };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/academics");
  return { success: true as const, message: `Department "${parsed.data.name}" updated.` };
}

export async function deleteDepartmentAction(_state: unknown, formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
  const parsed = DepartmentDeleteSchema.safeParse({
    departmentId: formData.get("departmentId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // 1. Verify department exists and belongs to this school
  const { data: dept, error: deptError } = await supabase
    .from("departments")
    .select("id, name")
    .eq("id", parsed.data.departmentId)
    .eq("school_id", context.school.id)
    .maybeSingle();

  if (deptError || !dept) {
    return { error: "Department not found." };
  }

  // 2. Check if subjects are linked to this department
  const { count, error: countError } = await supabase
    .from("subjects")
    .select("id", { count: "exact", head: true })
    .eq("school_id", context.school.id)
    .eq("department_id", parsed.data.departmentId);

  if (!countError && count && count > 0) {
    return {
      error: `Cannot delete "${dept.name}" because ${count} subject(s) belong to it. Please reassign or delete those subjects first.`,
    };
  }

  // 3. Remove HOD assignments for this department
  await supabase
    .from("hod_assignments")
    .delete()
    .eq("school_id", context.school.id)
    .eq("department_id", parsed.data.departmentId);

  // 4. Delete the department
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", parsed.data.departmentId)
    .eq("school_id", context.school.id);

  if (error) {
    return { error: `Could not delete department: ${error.message}` };
  }

  revalidatePath("/dashboard/academics");
  return { success: true as const, message: `Department "${dept.name}" deleted.` };
}

export async function createSubjectAction(_state: unknown, formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
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

  if (error) {
    if (error.code === "23505") {
      return { error: `A subject with code "${parsed.data.code}" already exists.` };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/academics");
  return { success: true as const, message: `Subject "${parsed.data.name}" created.` };
}

export async function createClassAction(_state: unknown, formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
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

  if (error) {
    if (error.code === "23505") {
      return { error: `A class named "${parsed.data.name}" already exists.` };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/academics");
  return { success: true as const, message: `Class "${parsed.data.name}" created.` };
}

export async function createClassStreamAction(
  stateOrFormData: unknown,
  maybeFormData?: FormData
) {
  const formData = maybeFormData instanceof FormData ? maybeFormData : (stateOrFormData as FormData);
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);

  const rawYear = formData?.get ? formData.get("academicYearId") : null;
  let academicYearId = typeof rawYear === "string" && rawYear.trim() ? rawYear.trim() : "";

  if (!academicYearId) {
    const activeYear = await getActiveAcademicYear(context.school.id);
    academicYearId = activeYear?.id || "";
  }

  const parsed = ClassStreamSchema.safeParse({
    academicYearId: academicYearId || undefined,
    classId: formData.get("classId"),
    name: formData.get("name"),
    streamTag: formData.get("streamTag"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const effectiveYearId = parsed.data.academicYearId || academicYearId;
  if (!effectiveYearId) {
    return { error: "No active academic year found. Please set an academic year first." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("class_streams").insert({
    school_id: context.school.id,
    class_id: parsed.data.classId,
    academic_year_id: effectiveYearId,
    name: parsed.data.name,
    stream_tag: parsed.data.streamTag,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `A class group named "${parsed.data.name}" already exists in this class for this academic year.` };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/academics");
  return { success: true as const, message: `Class group "${parsed.data.name}" created.` };
}

export async function updateClassAction(_state: unknown, formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
  const parsed = ClassUpdateSchema.safeParse({
    classId: formData.get("classId"),
    name: formData.get("name"),
    levelOrder: formData.get("levelOrder"),
    cycle: formData.get("cycle"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("classes")
    .update({
      name: parsed.data.name,
      level_order: parsed.data.levelOrder,
      cycle: parsed.data.cycle,
    })
    .eq("id", parsed.data.classId)
    .eq("school_id", context.school.id);

  if (error) {
    if (error.code === "23505") {
      return { error: `Another class named "${parsed.data.name}" already exists.` };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/academics");
  return { success: true as const, message: `Class updated to "${parsed.data.name}".` };
}

export async function deleteClassAction(_state: unknown, formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
  const parsed = ClassDeleteSchema.safeParse({
    classId: formData.get("classId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // 1. Verify class belongs to this school
  const { data: cls, error: clsError } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", parsed.data.classId)
    .eq("school_id", context.school.id)
    .maybeSingle();

  if (clsError || !cls) {
    return { error: "Class not found." };
  }

  // 2. Safety Check: Check if any class streams/groups exist for this class
  const { count: streamCount } = await supabase
    .from("class_streams")
    .select("id", { count: "exact", head: true })
    .eq("school_id", context.school.id)
    .eq("class_id", parsed.data.classId);

  if (streamCount && streamCount > 0) {
    return {
      error: `Safety Lock: Cannot delete class "${cls.name}" because it contains ${streamCount} class group(s). Please delete or move those class groups first.`,
    };
  }

  // 3. Delete class
  const { error } = await supabase
    .from("classes")
    .delete()
    .eq("id", parsed.data.classId)
    .eq("school_id", context.school.id);

  if (error) {
    return { error: `Could not delete class: ${error.message}` };
  }

  revalidatePath("/dashboard/academics");
  return { success: true as const, message: `Class "${cls.name}" deleted.` };
}

export async function updateClassStreamAction(_state: unknown, formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
  const parsed = ClassStreamUpdateSchema.safeParse({
    classStreamId: formData.get("classStreamId"),
    name: formData.get("name"),
    streamTag: formData.get("streamTag"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("class_streams")
    .update({
      name: parsed.data.name,
      stream_tag: parsed.data.streamTag,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.classStreamId)
    .eq("school_id", context.school.id);

  if (error) {
    if (error.code === "23505") {
      return { error: `A class group named "${parsed.data.name}" already exists in this class.` };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard");
  return { success: true as const, message: `Class group updated to "${parsed.data.name}".` };
}

export async function deleteClassStreamAction(_state: unknown, formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
  const parsed = ClassStreamDeleteSchema.safeParse({
    classStreamId: formData.get("classStreamId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // 1. Verify stream exists and belongs to this school
  const { data: stream, error: streamError } = await supabase
    .from("class_streams")
    .select("id, name")
    .eq("id", parsed.data.classStreamId)
    .eq("school_id", context.school.id)
    .maybeSingle();

  if (streamError || !stream) {
    return { error: "Class group not found." };
  }

  // 2. Strict Safety Check: Enrolled students
  const { count: enrolledCount } = await supabase
    .from("enrolments")
    .select("id", { count: "exact", head: true })
    .eq("school_id", context.school.id)
    .eq("class_stream_id", parsed.data.classStreamId);

  if (enrolledCount && enrolledCount > 0) {
    return {
      error: `Safety Lock: Cannot delete "${stream.name}" because ${enrolledCount} student(s) are currently enrolled in it. Reassign or withdraw the students first to protect academic records.`,
    };
  }

  // 3. Strict Safety Check: Assessment marks
  const { count: marksCount } = await supabase
    .from("assessment_marks")
    .select("id", { count: "exact", head: true })
    .eq("class_stream_id", parsed.data.classStreamId);

  if (marksCount && marksCount > 0) {
    return {
      error: `Safety Lock: Cannot delete "${stream.name}" because ${marksCount} assessment mark(s) have been entered for this group. Deleting it would permanently destroy academic evaluation records.`,
    };
  }

  // 4. Strict Safety Check: Attendance sessions
  const { count: attendanceCount } = await supabase
    .from("attendance_sessions")
    .select("id", { count: "exact", head: true })
    .eq("school_id", context.school.id)
    .eq("class_stream_id", parsed.data.classStreamId);

  if (attendanceCount && attendanceCount > 0) {
    return {
      error: `Safety Lock: Cannot delete "${stream.name}" because ${attendanceCount} attendance session(s) exist for this group.`,
    };
  }

  // 5. Clean up assignments & class subjects
  await supabase.from("teacher_assignments").delete().eq("class_stream_id", parsed.data.classStreamId);
  await supabase.from("class_subjects").delete().eq("class_stream_id", parsed.data.classStreamId);

  // 6. Delete the stream
  const { error } = await supabase
    .from("class_streams")
    .delete()
    .eq("id", parsed.data.classStreamId)
    .eq("school_id", context.school.id);

  if (error) {
    return { error: `Could not delete class group: ${error.message}` };
  }

  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard");
  return { success: true as const, message: `Class group "${stream.name}" deleted.` };
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
  const context = await requireAnyPermission(["assignments.manage", "academics.manage"]);

  let academicYearId = String(formData.get("academicYearId") || "").trim();
  if (!academicYearId) {
    const activeYear = await getActiveAcademicYear(context.school.id);
    academicYearId = activeYear?.id || "";
  }

  const parsed = HodAssignmentSchema.safeParse({
    academicYearId: academicYearId || undefined,
    hodUserId: formData.get("hodUserId"),
    departmentId: formData.get("departmentId"),
    subjectId: formData.get("subjectId") || undefined,
    scopeType: formData.get("scopeType"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const effectiveYearId = parsed.data.academicYearId || academicYearId;
  if (!effectiveYearId) {
    return { error: "No active academic year found. Please configure an academic year first." };
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
      .eq("id", effectiveYearId)
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

  if (roleError || !staffRole || !["hod", "teacher", "class_master", "school_admin", "principal"].includes(staffRole.code)) {
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
    .eq("academic_year_id", effectiveYearId)
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
        academic_year_id: effectiveYearId,
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
  const context = await requireAnyPermission(["assignments.manage", "academics.manage"]);

  const rawYear = formData.get("academicYearId");
  let academicYearId = typeof rawYear === "string" && rawYear.trim() ? rawYear.trim() : "";

  if (!academicYearId) {
    const activeYear = await getActiveAcademicYear(context.school.id);
    academicYearId = activeYear?.id || "";
  }

  const parsed = TeacherAssignmentSchema.safeParse({
    academicYearId: academicYearId || undefined,
    teacherUserId: formData.get("teacherUserId"),
    classStreamId: formData.get("classStreamId"),
    subjectId: formData.get("subjectId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const [membershipResult, streamResult, subjectResult] = await Promise.all([
    supabase
      .from("school_memberships")
      .select("id, role_id")
      .eq("school_id", context.school.id)
      .eq("user_id", parsed.data.teacherUserId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("class_streams")
      .select("id, academic_year_id")
      .eq("school_id", context.school.id)
      .eq("id", parsed.data.classStreamId)
      .maybeSingle(),
    supabase
      .from("subjects")
      .select("id, default_coefficient, default_max_marks")
      .eq("school_id", context.school.id)
      .eq("id", parsed.data.subjectId)
      .maybeSingle(),
  ]);

  if (membershipResult.error || streamResult.error || subjectResult.error) {
    return { error: "Could not verify the teacher and class details. Please try again." };
  }

  if (!membershipResult.data) {
    return { error: "Please select an active teacher from this school." };
  }
  if (!streamResult.data) {
    return { error: "Please select a valid class group." };
  }
  if (!subjectResult.data) {
    return { error: "Please select a valid subject." };
  }

  const effectiveYearId = parsed.data.academicYearId || streamResult.data.academic_year_id || academicYearId;
  if (!effectiveYearId) {
    return { error: "No active academic year found. Please configure an academic year first." };
  }

  const { data: staffRole, error: roleError } = await supabase
    .from("roles")
    .select("id, code")
    .eq("id", membershipResult.data.role_id)
    .maybeSingle();

  if (roleError || !staffRole || !["teacher", "class_master", "hod", "school_admin", "principal"].includes(staffRole.code)) {
    return { error: "This staff member must be a member of the teaching faculty (Teacher, Class Master, or HOD)." };
  }

  const { error } = await supabase.from("teacher_assignments").upsert(
    {
      school_id: context.school.id,
      academic_year_id: effectiveYearId,
      teacher_user_id: parsed.data.teacherUserId,
      class_stream_id: parsed.data.classStreamId,
      subject_id: parsed.data.subjectId,
    },
    { onConflict: "academic_year_id,class_stream_id,subject_id" }
  );

  if (error) return { error: `Could not save the teacher assignment: ${error.message}` };

  // Ensure class_subjects record exists for this stream and subject
  await supabase.from("class_subjects").upsert(
    {
      school_id: context.school.id,
      class_stream_id: parsed.data.classStreamId,
      subject_id: parsed.data.subjectId,
      coefficient: subjectResult.data.default_coefficient ?? 2,
      max_marks: subjectResult.data.default_max_marks ?? 20,
    },
    { onConflict: "class_stream_id,subject_id", ignoreDuplicates: true }
  );

  revalidatePath("/dashboard/academics");
  return { success: true, message: "Teacher assignment saved." };
}

export async function configureClassSubjectAction(
  stateOrFormData: unknown,
  maybeFormData?: FormData
) {
  const formData = maybeFormData instanceof FormData ? maybeFormData : (stateOrFormData as FormData);
  const context = await requireAnyPermission(["schemes.manage", "academics.manage", "school.settings.manage"]);
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
  revalidatePath("/dashboard/academics/report-cards");
  return { success: true as const, message: "Subject coefficient updated." };
}

export async function updateStreamCoefficientsBatchAction(
  _prevState: unknown,
  formData: FormData
) {
  const context = await requireAnyPermission(["schemes.manage", "academics.manage", "school.settings.manage"]);
  const classStreamId = String(formData.get("classStreamId") || "");
  if (!classStreamId) {
    return { error: "Class group ID is required." };
  }

  const supabase = await createClient();
  const upserts: Array<{
    school_id: string;
    class_stream_id: string;
    subject_id: string;
    coefficient: number;
    max_marks: number;
  }> = [];

  for (const [key, val] of formData.entries()) {
    if (key.startsWith("coef_")) {
      const subjectId = key.replace("coef_", "");
      const coef = parseFloat(String(val));
      if (!isNaN(coef) && coef > 0) {
        const maxMarksKey = `max_${subjectId}`;
        const maxMarksVal = parseFloat(String(formData.get(maxMarksKey) || "20"));
        upserts.push({
          school_id: context.school.id,
          class_stream_id: classStreamId,
          subject_id: subjectId,
          coefficient: coef,
          max_marks: !isNaN(maxMarksVal) && maxMarksVal > 0 ? maxMarksVal : 20,
        });
      }
    }
  }

  if (upserts.length === 0) {
    return { error: "No subject coefficients were submitted." };
  }

  const { error } = await supabase
    .from("class_subjects")
    .upsert(upserts, { onConflict: "class_stream_id,subject_id" });

  if (error) return { error: `Could not save coefficients: ${error.message}` };

  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/report-cards");
  return { success: true as const, message: `Updated coefficients for ${upserts.length} subject(s).` };
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
  competencyDescription?: string;
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

  // Persist class-wide CBA Competency Evaluated if provided
  if (payload.competencyDescription !== undefined) {
    const trimmedComp = payload.competencyDescription.trim();
    if (trimmedComp) {
      const { data: termData } = await supabase
        .from("terms")
        .select("term_number")
        .eq("id", payload.termId)
        .maybeSingle();

      const { data: streamData } = await supabase
        .from("class_streams")
        .select("class_id")
        .eq("id", payload.classStreamId)
        .maybeSingle();

      const termNumber = termData?.term_number || 1;
      const classId = streamData?.class_id || null;

      const { data: existingComp } = await supabase
        .from("subject_competencies")
        .select("id")
        .eq("school_id", context.school.id)
        .eq("subject_id", payload.subjectId)
        .eq("term_number", termNumber)
        .eq("class_id", classId)
        .maybeSingle();

      if (existingComp) {
        await supabase
          .from("subject_competencies")
          .update({
            description: trimmedComp,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingComp.id);
      } else {
        await supabase
          .from("subject_competencies")
          .insert({
            school_id: context.school.id,
            subject_id: payload.subjectId,
            class_id: classId,
            term_number: termNumber,
            description: trimmedComp,
            order_index: 1,
          });
      }
    }
  }

  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/report-cards");
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

