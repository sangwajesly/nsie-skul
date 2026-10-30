"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireAnyPermission } from "@/lib/tenancy/context";
import { getActiveAcademicYear, generateNextStudentMatricule } from "@/lib/academic/service";
import { uuidSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const DepartmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  code: z.string().min(2, "Department code is required").toUpperCase(),
  description: z.string().nullish(),
});

const DepartmentUpdateSchema = z.object({
  departmentId: uuidSchema("Department ID is required"),
  name: z.string().min(2, "Department name is required"),
  code: z.string().min(2, "Department code is required").toUpperCase(),
  description: z.string().nullish(),
});

const DepartmentDeleteSchema = z.object({
  departmentId: uuidSchema("Department ID is required"),
});

const SubjectSchema = z.object({
  departmentId: z
    .preprocess(
      (val) => (val === "" || val === "none" || val === null || val === undefined ? null : val),
      uuidSchema("Invalid department ID").nullish()
    ),
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
  academicYearId: uuidSchema("Please select a valid academic year.").nullish().or(z.literal("")),
  classId: uuidSchema("Please select a class"),
  name: z.string().min(1, "Class group name is required"),
  streamTag: z.string().nullish(),
});

const ClassStreamUpdateSchema = z.object({
  classStreamId: uuidSchema("Class group ID is required"),
  name: z.string().min(1, "Class group name is required"),
  streamTag: z.string().nullish(),
});

const ClassStreamDeleteSchema = z.object({
  classStreamId: uuidSchema("Class group ID is required"),
});

const HodAssignmentSchema = z.object({
  academicYearId: uuidSchema("Please select a valid academic year.").nullish().or(z.literal("")),
  hodUserId: uuidSchema("Please select a staff member"),
  departmentId: uuidSchema("Please select a department"),
  subjectId: uuidSchema("Please select a subject").nullish().or(z.literal("")),
  scopeType: z.enum(["department", "subject"]),
});

const TeacherAssignmentSchema = z.object({
  academicYearId: uuidSchema("Please select a valid academic year.").nullish().or(z.literal("")),
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
  matricule: z.string().nullish(),
  firstName: z.string().trim().min(1, "Please enter other names as on birth certificate"),
  lastName: z.string().trim().min(1, "Please enter first name as on birth certificate"),
  gender: z.enum(["M", "F"], { message: "Please select a gender" }),
  dateOfBirth: z.string().trim().nullish().or(z.literal("")),
  placeOfBirth: z.string().trim().nullish().or(z.literal("")),
  photoUrl: z.string().trim().nullish().or(z.literal("")),
  residenceStatus: z.enum(["day", "boarding"], { message: "Please select a residence status" }),
  isRepeater: z
    .preprocess(
      (val) => val === "true" || val === true || val === "1" || val === "on",
      z.boolean()
    )
    .default(false),
  rollNumber: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
      z
        .number()
        .int("Class roster number must be a whole number")
        .min(1, "Class roster number must be 1 or greater")
        .nullish()
    ),
  guardianName: z.string().nullish(),
  guardianPhone: z.string().nullish(),
});

const StudentUpdateSchema = z.object({
  studentId: uuidSchema("Student ID is required"),
  enrolmentId: uuidSchema("Enrolment ID is required").nullish(),
  academicYearId: uuidSchema("Academic Year ID is required").nullish(),
  classStreamId: uuidSchema("Please select a class group"),
  matricule: z.string().trim().min(1, "Matricule / Admission number is required").toUpperCase(),
  firstName: z.string().trim().min(1, "Please enter other names as on birth certificate"),
  lastName: z.string().trim().min(1, "Please enter first name as on birth certificate"),
  gender: z.enum(["M", "F"], { message: "Please select a gender" }),
  dateOfBirth: z.string().trim().nullish().or(z.literal("")),
  placeOfBirth: z.string().trim().nullish().or(z.literal("")),
  photoUrl: z.string().trim().nullish().or(z.literal("")),
  residenceStatus: z.enum(["day", "boarding"], { message: "Please select a residence status" }),
  isRepeater: z
    .preprocess(
      (val) => val === "true" || val === true || val === "1" || val === "on",
      z.boolean()
    )
    .default(false),
  rollNumber: z
    .preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
      z
        .number()
        .int("Class roster number must be a whole number")
        .min(1, "Class roster number must be 1 or greater")
        .nullish()
    ),
  guardianName: z.string().nullish(),
  guardianPhone: z.string().nullish(),
});

export async function createDepartmentAction(_state: unknown, formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
  const parsed = DepartmentSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
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
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
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
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
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
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert({
    school_id: context.school.id,
    department_id: parsed.data.departmentId || null,
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
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
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
    streamTag: formData.get("streamTag") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
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
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
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
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
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
    streamTag: formData.get("streamTag") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
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
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
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
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
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
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
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
    { onConflict: "academic_year_id,class_stream_id,subject_id,teacher_user_id" }
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
  revalidatePath("/dashboard/academics/report-cards");
  return { success: true, message: "Teacher assignment saved." };
}

export async function removeTeacherAssignmentAction(
  stateOrFormData: unknown,
  maybeFormData?: FormData
) {
  const formData = maybeFormData instanceof FormData ? maybeFormData : (stateOrFormData as FormData);
  const context = await requireAnyPermission(["assignments.manage", "academics.manage", "school.settings.manage"]);

  const assignmentId = String(formData.get("assignmentId") || "").trim();
  if (!assignmentId) {
    return { error: "Please select an assignment to remove." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("teacher_assignments")
    .delete()
    .eq("id", assignmentId)
    .eq("school_id", context.school.id);

  if (error) {
    return { error: `Could not remove teacher assignment: ${error.message}` };
  }

  // Record audit log
  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: "REMOVE_TEACHER_ASSIGNMENT",
    resource_type: "teacher_assignment",
    resource_id: assignmentId,
    details: { assignment_id: assignmentId },
  });

  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/report-cards");
  return { success: true, message: "Teacher assignment removed successfully." };
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
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
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

export async function registerStudentAction(
  stateOrFormData: unknown,
  maybeFormData?: FormData
) {
  const formData = maybeFormData instanceof FormData ? maybeFormData : (stateOrFormData as FormData);
  const context = await requirePermission("students.manage");
  const parsed = StudentRegisterSchema.safeParse({
    academicYearId: formData?.get ? formData.get("academicYearId") : null,
    classStreamId: formData?.get ? formData.get("classStreamId") : null,
    matricule: formData?.get ? formData.get("matricule") : null,
    firstName: formData?.get ? formData.get("firstName") : null,
    lastName: formData?.get ? formData.get("lastName") : null,
    gender: formData?.get ? formData.get("gender") : null,
    residenceStatus: formData?.get ? formData.get("residenceStatus") : null,
    isRepeater: formData?.get ? formData.get("isRepeater") : null,
    rollNumber: formData?.get ? formData.get("rollNumber") : null,
    dateOfBirth: formData?.get ? formData.get("dateOfBirth") : null,
    placeOfBirth: formData?.get ? formData.get("placeOfBirth") : null,
    photoUrl: formData?.get ? formData.get("photoUrl") : null,
    guardianName: formData?.get ? formData.get("guardianName") : null,
    guardianPhone: formData?.get ? formData.get("guardianPhone") : null,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
  }

  const supabase = await createClient();

  // If matricule was left empty or omitted, automatically generate next sequence matricule
  let matricule = (parsed.data.matricule || "").trim().toUpperCase();
  if (!matricule) {
    matricule = await generateNextStudentMatricule(context.school.id, parsed.data.academicYearId);
  }

  // 1. Insert or update student
  const { data: student, error: studentError } = await supabase
    .from("students")
    .upsert(
      {
        school_id: context.school.id,
        matricule,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        gender: parsed.data.gender,
        date_of_birth: parsed.data.dateOfBirth ? parsed.data.dateOfBirth : null,
        place_of_birth: parsed.data.placeOfBirth ? parsed.data.placeOfBirth.trim() : null,
        photo_url: parsed.data.photoUrl ? parsed.data.photoUrl.trim() : null,
        residence_status: parsed.data.residenceStatus,
        guardian_name: parsed.data.guardianName,
        guardian_phone: parsed.data.guardianPhone,
        is_repeater: parsed.data.isRepeater,
        status: "active",
      },
      { onConflict: "school_id,matricule" }
    )
    .select("id")
    .single();

  if (studentError || !student) {
    return { error: studentError?.message || "Failed to create student record." };
  }

  // 2. Insert or update enrolment
  const { error: enrolError } = await supabase.from("enrolments").upsert(
    {
      school_id: context.school.id,
      student_id: student.id,
      academic_year_id: parsed.data.academicYearId,
      class_stream_id: parsed.data.classStreamId,
      is_repeater: parsed.data.isRepeater,
      roll_number: parsed.data.rollNumber || null,
      status: "active",
    },
    { onConflict: "academic_year_id,student_id" }
  );

  if (enrolError) return { error: enrolError.message };

  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/academics/report-cards");
  return {
    success: true as const,
    message: `Student "${parsed.data.firstName} ${parsed.data.lastName}" enrolled with Matricule ${matricule}.`,
    matricule,
  };
}

/**
 * Updates an enrolled student's personal details, assigned stream, repeater status, and guardian info.
 */
export async function updateStudentAction(
  stateOrFormData: unknown,
  maybeFormData?: FormData
) {
  const formData = maybeFormData instanceof FormData ? maybeFormData : (stateOrFormData as FormData);
  const context = await requirePermission("students.manage");
  const parsed = StudentUpdateSchema.safeParse({
    studentId: formData?.get ? formData.get("studentId") : null,
    enrolmentId: formData?.get ? formData.get("enrolmentId") : null,
    academicYearId: formData?.get ? formData.get("academicYearId") : null,
    classStreamId: formData?.get ? formData.get("classStreamId") : null,
    matricule: formData?.get ? formData.get("matricule") : null,
    firstName: formData?.get ? formData.get("firstName") : null,
    lastName: formData?.get ? formData.get("lastName") : null,
    gender: formData?.get ? formData.get("gender") : null,
    residenceStatus: formData?.get ? formData.get("residenceStatus") : null,
    isRepeater: formData?.get ? formData.get("isRepeater") : null,
    rollNumber: formData?.get ? formData.get("rollNumber") : null,
    dateOfBirth: formData?.get ? formData.get("dateOfBirth") : null,
    placeOfBirth: formData?.get ? formData.get("placeOfBirth") : null,
    photoUrl: formData?.get ? formData.get("photoUrl") : null,
    guardianName: formData?.get ? formData.get("guardianName") : null,
    guardianPhone: formData?.get ? formData.get("guardianPhone") : null,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] || "");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      error: parsed.error.issues[0]?.message || "Please correct the highlighted fields",
      fieldErrors,
    };
  }

  const supabase = await createClient();

  // 1. Verify student exists in this school
  const { data: existingStudent, error: fetchErr } = await supabase
    .from("students")
    .select("id, matricule, first_name, last_name, school_id")
    .eq("id", parsed.data.studentId)
    .eq("school_id", context.school.id)
    .maybeSingle();

  if (fetchErr || !existingStudent) {
    return { error: "Student record not found in this school." };
  }

  // 2. Check matricule uniqueness within this school
  if (parsed.data.matricule !== existingStudent.matricule) {
    const { data: duplicateMatricule } = await supabase
      .from("students")
      .select("id")
      .eq("school_id", context.school.id)
      .eq("matricule", parsed.data.matricule)
      .neq("id", parsed.data.studentId)
      .maybeSingle();

    if (duplicateMatricule) {
      return {
        error: `Admission number "${parsed.data.matricule}" is already assigned to another student in your school.`,
        fieldErrors: { matricule: "This admission number is already in use." },
      };
    }
  }

  // 3. Update students table
  const { error: studentUpdateErr } = await supabase
    .from("students")
    .update({
      matricule: parsed.data.matricule,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      gender: parsed.data.gender,
      date_of_birth: parsed.data.dateOfBirth ? parsed.data.dateOfBirth : null,
      place_of_birth: parsed.data.placeOfBirth ? parsed.data.placeOfBirth.trim() : null,
      photo_url: parsed.data.photoUrl ? parsed.data.photoUrl.trim() : null,
      residence_status: parsed.data.residenceStatus,
      guardian_name: parsed.data.guardianName || null,
      guardian_phone: parsed.data.guardianPhone || null,
      is_repeater: parsed.data.isRepeater,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.studentId)
    .eq("school_id", context.school.id);

  if (studentUpdateErr) {
    return { error: studentUpdateErr.message };
  }

  // 4. Update enrolment record if stream/repeater/rollNumber changed
  const enrolmentUpdate: Record<string, any> = {
    class_stream_id: parsed.data.classStreamId,
    is_repeater: parsed.data.isRepeater,
    roll_number: parsed.data.rollNumber ?? null,
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.enrolmentId) {
    await supabase
      .from("enrolments")
      .update(enrolmentUpdate)
      .eq("id", parsed.data.enrolmentId)
      .eq("school_id", context.school.id);
  } else if (parsed.data.academicYearId) {
    await supabase
      .from("enrolments")
      .update(enrolmentUpdate)
      .eq("student_id", parsed.data.studentId)
      .eq("academic_year_id", parsed.data.academicYearId)
      .eq("school_id", context.school.id);
  }

  // 5. If class_stream_id changed, update assessment marks class_stream_id for this student
  // to ensure their marks remain visible in marksheets & report cards under their new class
  await supabase
    .from("assessment_marks")
    .update({ class_stream_id: parsed.data.classStreamId, updated_at: new Date().toISOString() })
    .eq("student_id", parsed.data.studentId)
    .eq("school_id", context.school.id);

  // 6. Log audit event
  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: "UPDATE_STUDENT_INFO",
    resource_type: "student",
    resource_id: parsed.data.studentId,
    details: {
      previous: {
        matricule: existingStudent.matricule,
        name: `${existingStudent.first_name} ${existingStudent.last_name}`,
      },
      updated: {
        matricule: parsed.data.matricule,
        name: `${parsed.data.firstName} ${parsed.data.lastName}`,
        class_stream_id: parsed.data.classStreamId,
      },
    },
  });

  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics/report-cards");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Student information for "${parsed.data.firstName} ${parsed.data.lastName}" updated successfully.`,
  };
}

/**
 * Permanently deletes a student record and cascaded academic data from the school database.
 */
export async function deleteStudentAction(formData: FormData) {
  const context = await requirePermission("students.manage");
  const studentId = String(formData.get("studentId") || "");

  if (!studentId) {
    return { error: "Student ID is required." };
  }

  const supabase = await createClient();

  // 1. Verify student exists in this school
  const { data: student, error: fetchErr } = await supabase
    .from("students")
    .select("id, matricule, first_name, last_name")
    .eq("id", studentId)
    .eq("school_id", context.school.id)
    .maybeSingle();

  if (fetchErr || !student) {
    return { error: "Student record not found in your school." };
  }

  // 2. Audit log before deletion
  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: "DELETE_STUDENT",
    resource_type: "student",
    resource_id: studentId,
    details: {
      matricule: student.matricule,
      name: `${student.first_name} ${student.last_name}`,
      deleted_by: context.user.id,
    },
  });

  // 3. Delete student (Postgres foreign key cascade deletes enrolments, assessment_marks, term_results, fees, attendance)
  const { error: deleteErr } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId)
    .eq("school_id", context.school.id);

  if (deleteErr) {
    return { error: deleteErr.message };
  }

  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics/report-cards");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Student "${student.first_name} ${student.last_name}" (${student.matricule}) has been permanently deleted from the database.`,
  };
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

  // If a department exists, track in departmental_approvals
  if (resolvedDeptId) {
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
  }

  // Also lock entered marks for this teacher until approved by HOD or Principal
  await supabase
    .from("assessment_marks")
    .update({ is_locked: true, updated_by: context.user?.id })
    .eq("sequence_id", sequenceId)
    .eq("class_stream_id", classStreamId)
    .eq("subject_id", subjectId);

  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics");
  return {
    success: true,
    message: resolvedDeptId
      ? "Marks submitted to Head of Department for review."
      : "Marks submitted directly to School Administration for review.",
  };
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
  const departmentId = (formData.get("departmentId") as string) || null;
  const subjectId = (formData.get("subjectId") as string) || null;
  const academicYearId = formData.get("academicYearId") as string;
  const termId = formData.get("termId") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!sequenceId || !classStreamId) {
    return { error: "Missing required parameters for approval." };
  }

  const supabase = await createClient();

  // 1. Record formal departmental approval if departmentId is available
  if (departmentId) {
    await supabase.from("departmental_approvals").upsert(
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
  }

  // 2. Lock marks for this subject (or department / stream)
  if (subjectId) {
    await supabase
      .from("assessment_marks")
      .update({ is_locked: true, updated_by: context.user?.id })
      .eq("sequence_id", sequenceId)
      .eq("class_stream_id", classStreamId)
      .eq("subject_id", subjectId);
  } else if (departmentId) {
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
  } else {
    // School-wide or stream-wide approval without department
    await supabase
      .from("assessment_marks")
      .update({ is_locked: true, updated_by: context.user?.id })
      .eq("sequence_id", sequenceId)
      .eq("class_stream_id", classStreamId);
  }

  // 3. Log audit event
  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: "APPROVE_SEQUENCE_MARKS",
    resource_type: "assessment_marks",
    resource_id: `${sequenceId}_${classStreamId}_${subjectId || departmentId || "stream"}`,
    details: { approved_by: context.user.id, notes },
  });

  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/report-cards");
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
  if (departmentId || subjectId) {
    let query = supabase
      .from("departmental_approvals")
      .update({
        status: "rejected",
        notes: notes || `Reopened for teacher revision by ${context.user.full_name || "HOD / Administration"}`,
        approved_by: context.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("school_id", context.school.id)
      .eq("sequence_id", sequenceId)
      .eq("class_stream_id", classStreamId);

    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    } else if (departmentId) {
      query = query.eq("department_id", departmentId);
    }

    await query;
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

export async function toggleSequenceMarksAction(formData: FormData) {
  const context = await requirePermission("academics.manage");
  const sequenceId = String(formData.get("sequenceId") || "");
  const isOpen = formData.get("isOpen") === "true";

  if (!sequenceId) {
    throw new Error("Invalid sequence specified.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("evaluation_sequences")
    .update({ is_open_for_marks: isOpen })
    .eq("id", sequenceId)
    .eq("school_id", context.school.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics/report-cards");
}

export async function setActiveSequenceAction(formData: FormData) {
  const context = await requirePermission("academics.manage");
  const activeSequenceId = String(formData.get("activeSequenceId") || "");

  if (!activeSequenceId) {
    throw new Error("Invalid sequence specified.");
  }

  const supabase = await createClient();
  // Close all sequences first, then open the chosen active sequence
  await supabase
    .from("evaluation_sequences")
    .update({ is_open_for_marks: false })
    .eq("school_id", context.school.id);

  const { error } = await supabase
    .from("evaluation_sequences")
    .update({ is_open_for_marks: true })
    .eq("id", activeSequenceId)
    .eq("school_id", context.school.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics/report-cards");
}


