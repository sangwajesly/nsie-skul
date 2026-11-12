"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission, requireAnyPermission } from "@/lib/tenancy/context";
import { getActiveAcademicYear, generateNextStudentMatricule, getHodScope, ensureStandardSequences } from "@/lib/academic/service";
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
  code: z
    .string()
    .nullish()
    .transform((val) => (val ? val.trim().toUpperCase() : "")),
  defaultCoefficient: z.coerce.number().int("Subject coefficient must be a whole number (e.g. 1, 2, 3, 4)").min(1, "Coefficient must be at least 1").max(20).default(2),
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
  classStreamId: uuidSchema("Please select a class group").nullish().or(z.literal("")),
  classStreamIds: z.array(z.string()).nullish(),
  subjectId: uuidSchema("Please select a subject"),
});

const ClassSubjectConfigSchema = z.object({
  classStreamId: uuidSchema("Please select a class group"),
  subjectId: uuidSchema("Please select a subject"),
  coefficient: z.coerce.number().int("Subject coefficient must be a whole number (e.g. 1, 2, 3, 4)").min(1, "Coefficient must be at least 1").max(20),
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
  const { data: dept, error } = await supabase
    .from("departments")
    .insert({
      school_id: context.school.id,
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description,
    })
    .select("id, name")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: `A department with code "${parsed.data.code}" already exists.` };
    }
    return { error: error.message };
  }

  // Check if any existing unassigned subjects were chosen to be assigned to this department
  const subjectIds = formData.getAll("subjectIds").map(String).filter(Boolean);
  if (subjectIds.length > 0 && dept) {
    await supabase
      .from("subjects")
      .update({ department_id: dept.id })
      .in("id", subjectIds)
      .eq("school_id", context.school.id);
  }

  revalidatePath("/dashboard/academics");
  return {
    success: true as const,
    message: `Department "${parsed.data.name}" created${subjectIds.length > 0 ? ` with ${subjectIds.length} subject(s) assigned.` : "."}`,
  };
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

  // Prevent duplicate subjects with the same name (case-insensitive) in this school
  const cleanName = parsed.data.name.trim();
  const { data: existingName } = await supabase
    .from("subjects")
    .select("id, name, code")
    .eq("school_id", context.school.id)
    .ilike("name", cleanName)
    .maybeSingle();

  if (existingName) {
    return {
      error: `A subject named "${existingName.name}" (Code: ${existingName.code}) already exists in the school catalog. You do not need to create it again; you can assign this subject to classes under the Class Subjects tab.`,
    };
  }

  // Auto-generate code from subject name if not provided
  let subjectCode = parsed.data.code ? parsed.data.code.trim().toUpperCase() : "";

  if (!subjectCode) {
    const cleaned = cleanName.toUpperCase().replace(/[^A-Z0-9\s]/g, "");
    const words = cleaned.split(/\s+/).filter(Boolean);
    let baseCode = "SUB";
    if (words.length > 1) {
      baseCode = words.map((w: string) => w[0]).join("").slice(0, 5);
      if (baseCode.length < 2) {
        baseCode = (words[0].slice(0, 3) + words[1].slice(0, 2)).slice(0, 5);
      }
    } else if (words.length === 1) {
      baseCode = words[0].slice(0, 4);
    }

    subjectCode = baseCode;

    let exists = true;
    let counter = 1;
    while (exists && counter < 100) {
      const { data: existingCode } = await supabase
        .from("subjects")
        .select("id")
        .eq("school_id", context.school.id)
        .eq("code", subjectCode)
        .maybeSingle();

      if (!existingCode) {
        exists = false;
      } else {
        counter++;
        subjectCode = `${baseCode}${counter}`;
      }
    }
  }

  const { error } = await supabase.from("subjects").insert({
    school_id: context.school.id,
    department_id: parsed.data.departmentId || null,
    name: cleanName,
    code: subjectCode,
    default_coefficient: parsed.data.defaultCoefficient,
    default_max_marks: parsed.data.defaultMaxMarks,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `A subject with code "${subjectCode}" already exists in this school.` };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/academics");
  return { success: true as const, message: `Subject "${cleanName}" (${subjectCode}) created.` };
}

export async function updateSubjectAction(_state: unknown, formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
  const subjectId = String(formData.get("subjectId") || "");
  if (!subjectId) return { error: "Subject ID is required." };

  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const departmentId = formData.get("departmentId") ? String(formData.get("departmentId")) : null;
  const defaultCoefficientRaw = parseFloat(String(formData.get("defaultCoefficient") || "2"));
  const defaultCoefficient = isNaN(defaultCoefficientRaw)
    ? 2
    : Math.max(1, Math.round(defaultCoefficientRaw));
  const defaultMaxMarks = parseFloat(String(formData.get("defaultMaxMarks") || "20"));

  if (!name) return { error: "Subject name is required." };

  const supabase = await createClient();

  // If code was cleared or omitted, retain existing code
  let finalCode = code;
  if (!finalCode) {
    const { data: existingSub } = await supabase
      .from("subjects")
      .select("code")
      .eq("id", subjectId)
      .eq("school_id", context.school.id)
      .maybeSingle();
    finalCode = existingSub?.code || name.slice(0, 4).toUpperCase();
  }

  const { error } = await supabase
    .from("subjects")
    .update({
      name,
      code: finalCode,
      department_id: departmentId || null,
      default_coefficient: defaultCoefficient,
      default_max_marks: isNaN(defaultMaxMarks) ? 20 : defaultMaxMarks,
    })
    .eq("id", subjectId)
    .eq("school_id", context.school.id);

  if (error) {
    if (error.code === "23505") return { error: `A subject with code "${finalCode}" already exists.` };
    return { error: error.message };
  }

  revalidatePath("/dashboard/academics");
  return { success: true as const, message: `Subject "${name}" updated.` };
}

export async function deleteSubjectAction(_state: unknown, formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);

  if (context.school.slug === "demo-bilingual-high-school") {
    return {
      error: "Sample demo subjects are protected so other teachers can explore them. You can add new subjects freely!",
    };
  }
  const subjectId = String(formData.get("subjectId") || "");
  const confirmDelete = formData.get("confirmDeleteMarks") === "true";

  if (!subjectId) return { error: "Subject ID is required." };

  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subjects")
    .select("id, name, school_id")
    .eq("id", subjectId)
    .eq("school_id", context.school.id)
    .maybeSingle();

  if (!sub) return { error: "Subject not found." };

  const { count: marksCount } = await supabase
    .from("assessment_marks")
    .select("id", { count: "exact", head: true })
    .eq("subject_id", subjectId);

  if (marksCount && marksCount > 0 && !confirmDelete) {
    return {
      error: `Cannot delete "${sub.name}": ${marksCount} assessment mark(s) are recorded for this subject across the school. Confirm deletion to remove it and its marks.`,
      needsConfirmation: true,
      marksCount,
    };
  }

  if (marksCount && marksCount > 0 && confirmDelete) {
    await supabase.from("assessment_marks").delete().eq("subject_id", subjectId);
  }

  await supabase.from("class_subjects").delete().eq("subject_id", subjectId);
  await supabase.from("teacher_assignments").delete().eq("subject_id", subjectId);
  await supabase.from("timetable_slots").delete().eq("subject_id", subjectId);

  const { error } = await supabase.from("subjects").delete().eq("id", subjectId).eq("school_id", context.school.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/report-cards");
  revalidatePath("/dashboard/academics/marks");
  return { success: true as const, message: `Subject "${sub.name}" removed from school catalog.` };
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

  if (context.school.slug === "demo-bilingual-high-school") {
    return {
      error: "Sample demo classes are protected so other teachers can explore them. You can create new classes and streams freely!",
    };
  }
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

  if (context.school.slug === "demo-bilingual-high-school") {
    return {
      error: "Sample demo class streams are protected so other teachers can explore them. You can add new streams freely!",
    };
  }
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
  const context = await requireAnyPermission(["assignments.manage", "academics.manage", "school.settings.manage"]);

  const rawYear = formData.get("academicYearId");
  let academicYearId = typeof rawYear === "string" && rawYear.trim() ? rawYear.trim() : "";

  if (!academicYearId) {
    const activeYear = await getActiveAcademicYear(context.school.id);
    academicYearId = activeYear?.id || "";
  }

  // Support both multi-select ('classStreamIds') and single select ('classStreamId')
  const rawStreamIds = formData.getAll("classStreamIds");
  let streamIds: string[] = [];
  if (rawStreamIds && rawStreamIds.length > 0) {
    streamIds = rawStreamIds
      .map((s) => String(s).trim())
      .filter((s) => s.length > 0);
  }

  // Fallback to single classStreamId if classStreamIds not passed
  if (streamIds.length === 0) {
    const single = String(formData.get("classStreamId") || "").trim();
    if (single) {
      streamIds = [single];
    }
  }

  if (streamIds.length === 0) {
    return { error: "Please select at least one class group." };
  }

  const teacherUserId = String(formData.get("teacherUserId") || "").trim();
  const subjectId = String(formData.get("subjectId") || "").trim();

  if (!teacherUserId) {
    return { error: "Please select a teacher." };
  }
  if (!subjectId) {
    return { error: "Please select a subject." };
  }

  const supabase = await createClient();

  // Validate teacher membership, streams, and subject
  const [membershipResult, streamsResult, subjectResult] = await Promise.all([
    supabase
      .from("school_memberships")
      .select("id, role_id, user_profiles(full_name)")
      .eq("school_id", context.school.id)
      .eq("user_id", teacherUserId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("class_streams")
      .select("id, name, academic_year_id")
      .eq("school_id", context.school.id)
      .in("id", streamIds),
    supabase
      .from("subjects")
      .select("id, name, department_id, default_coefficient, default_max_marks")
      .eq("school_id", context.school.id)
      .eq("id", subjectId)
      .maybeSingle(),
  ]);

  if (membershipResult.error || streamsResult.error || subjectResult.error) {
    return { error: "Could not verify the teacher, classes, and subject. Please try again." };
  }

  if (!membershipResult.data) {
    return { error: "Please select an active teacher from this school." };
  }
  if (!streamsResult.data || streamsResult.data.length === 0) {
    return { error: "Please select valid class groups belonging to your school." };
  }
  if (!subjectResult.data) {
    return { error: "Please select a valid subject." };
  }

  const subject = subjectResult.data;
  const validStreams = streamsResult.data;
  const effectiveYearId =
    academicYearId ||
    validStreams[0].academic_year_id ||
    "";

  if (!effectiveYearId) {
    return { error: "No active academic year found. Please configure an academic year first." };
  }

  // Support assignmentMode: 'co_teach' (default) or 'replace' (replaces previous teacher)
  const assignmentMode = String(formData.get("assignmentMode") || "co_teach").trim();

  // If caller is an HOD (and not school_admin / principal / superadmin), verify the subject belongs to their department
  const isAdmin = ["school_admin", "principal", "superadmin"].includes(context.role.code);
  const isHodCaller = !isAdmin && (context.role.code === "hod" || Boolean(context.isHod));

  if (isHodCaller) {
    const { subjectIds } = await getHodScope(context.school.id, effectiveYearId, context.user.id);
    if (!subjectIds.includes(subjectId)) {
      return { error: "As Head of Department, you can only assign teachers to subjects within your department." };
    }
  }

  const { data: staffRole, error: roleError } = await supabase
    .from("roles")
    .select("id, code")
    .eq("id", membershipResult.data.role_id)
    .maybeSingle();

  if (roleError || !staffRole || !["teacher", "class_master", "hod", "school_admin", "principal"].includes(staffRole.code)) {
    return { error: "This staff member must be a member of the teaching faculty (Teacher, Class Master, or HOD)." };
  }

  const teacherName = (membershipResult.data.user_profiles as any)?.full_name || "Teacher";
  const subjectName = subject.name;

  // Query ALL existing assignments for this subject in the selected streams (any teacher)
  const { data: allExistingSubjectAssignments, error: checkError } = await supabase
    .from("teacher_assignments")
    .select("id, class_stream_id, teacher_user_id, teacher:user_profiles(full_name)")
    .eq("school_id", context.school.id)
    .eq("academic_year_id", effectiveYearId)
    .eq("subject_id", subjectId)
    .in("class_stream_id", validStreams.map((s) => s.id));

  if (checkError) {
    return { error: `Could not verify existing teacher assignments: ${checkError.message}` };
  }

  // Streams where THIS teacher is already assigned
  const alreadyAssignedStreamIds = new Set(
    allExistingSubjectAssignments
      ?.filter((a) => a.teacher_user_id === teacherUserId)
      .map((a) => a.class_stream_id) || []
  );

  const streamsToAssign = validStreams.filter((s) => !alreadyAssignedStreamIds.has(s.id));
  const alreadyAssignedStreams = validStreams.filter((s) => alreadyAssignedStreamIds.has(s.id));

  // If ALL selected classes already have this teacher assigned to this subject
  if (streamsToAssign.length === 0) {
    const alreadyNames = alreadyAssignedStreams.map((s) => s.name).join(", ");
    if (alreadyAssignedStreams.length === 1) {
      return {
        error: `${teacherName} has already been assigned to ${subjectName} in ${alreadyNames}.`,
      };
    }
    return {
      error: `${teacherName} has already been assigned to ${subjectName} in all selected classes: ${alreadyNames}.`,
    };
  }

  // If mode is 'replace', remove any prior assignments by OTHER teachers in these streams
  if (assignmentMode === "replace" && allExistingSubjectAssignments && allExistingSubjectAssignments.length > 0) {
    const otherTeacherAssignmentIds = allExistingSubjectAssignments
      .filter((a) => a.teacher_user_id !== teacherUserId && streamsToAssign.some((s) => s.id === a.class_stream_id))
      .map((a) => a.id);

    if (otherTeacherAssignmentIds.length > 0) {
      const { error: deleteOldError } = await supabase
        .from("teacher_assignments")
        .delete()
        .in("id", otherTeacherAssignmentIds);

      if (deleteOldError) {
        return { error: `Could not reassign previous teacher: ${deleteOldError.message}` };
      }
    }
  }

  // 1. Batch upsert teacher_assignments for new class streams
  const teacherRows = streamsToAssign.map((stream) => ({
    school_id: context.school.id,
    academic_year_id: stream.academic_year_id || effectiveYearId,
    teacher_user_id: teacherUserId,
    class_stream_id: stream.id,
    subject_id: subjectId,
  }));

  const { error: assignError } = await supabase.from("teacher_assignments").upsert(
    teacherRows,
    { onConflict: "academic_year_id,class_stream_id,subject_id,teacher_user_id" }
  );

  if (assignError) {
    // Graceful handling for duplicate key constraint violation when table still has legacy single-teacher constraint
    if (
      assignError.code === "23505" ||
      assignError.message?.includes("teacher_assignments_academic_year_id_class_stream_id_subjec_key") ||
      assignError.message?.includes("teacher_assignments_academic_year_id_class_stream_id_subject_id_key")
    ) {
      const otherTeachers = allExistingSubjectAssignments
        ?.filter((a) => a.teacher_user_id !== teacherUserId)
        ?.map((a) => (a.teacher as any)?.full_name || "another teacher") || [];
      const distinctNames = Array.from(new Set(otherTeachers)).join(", ");

      return {
        error: `Another teacher (${distinctNames || "already assigned"}) is currently assigned to ${subjectName} in this class. Please select 'Replace Existing Teacher' to switch teachers, or run database migration 00021 in your Supabase SQL Editor to allow co-teaching.`,
      };
    }
    return { error: `Could not save the teacher assignments: ${assignError.message}` };
  }

  // 2. Ensure class_subjects record exists for all streams and this subject
  const subjectRows = streamsToAssign.map((stream) => ({
    school_id: context.school.id,
    class_stream_id: stream.id,
    subject_id: subjectId,
    coefficient: subject.default_coefficient ?? 2,
    max_marks: subject.default_max_marks ?? 20,
  }));

  await supabase.from("class_subjects").upsert(
    subjectRows,
    { onConflict: "class_stream_id,subject_id", ignoreDuplicates: true }
  );

  // 3. Record audit log
  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: "BATCH_ASSIGN_TEACHER",
    resource_type: "teacher_assignment",
    details: {
      teacher_user_id: teacherUserId,
      subject_id: subjectId,
      class_stream_ids: streamsToAssign.map((s) => s.id),
      class_names: streamsToAssign.map((s) => s.name),
      skipped_already_assigned: alreadyAssignedStreams.map((s) => s.name),
    },
  });

  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/report-cards");
  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard");

  const newlyAssignedNames = streamsToAssign.map((s) => s.name).join(", ");
  const alreadyAssignedNames = alreadyAssignedStreams.map((s) => s.name).join(", ");

  if (assignmentMode === "replace") {
    return {
      success: true,
      message: `Replaced previous teacher and assigned ${teacherName} to ${subjectName} in ${newlyAssignedNames}.`,
    };
  }

  if (alreadyAssignedStreams.length > 0) {
    return {
      success: true,
      message: `Assigned ${teacherName} to ${subjectName} in ${newlyAssignedNames}. (Note: ${teacherName} has already been assigned to ${subjectName} in ${alreadyAssignedNames}).`,
    };
  }

  if (streamsToAssign.length === 1) {
    return {
      success: true,
      message: `Assigned ${teacherName} to ${subjectName} in ${newlyAssignedNames}.`,
    };
  }

  return {
    success: true,
    message: `Assigned ${teacherName} to ${subjectName} across ${streamsToAssign.length} classes: ${newlyAssignedNames}.`,
  };
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

  // If caller is an HOD, verify this assignment belongs to their department
  const isAdmin = ["school_admin", "principal", "superadmin"].includes(context.role.code);
  const isHodCaller = !isAdmin && (context.role.code === "hod" || Boolean(context.isHod));

  if (isHodCaller) {
    const { data: assignment } = await supabase
      .from("teacher_assignments")
      .select("subject_id, academic_year_id")
      .eq("id", assignmentId)
      .eq("school_id", context.school.id)
      .maybeSingle();

    if (assignment) {
      const { subjectIds } = await getHodScope(context.school.id, assignment.academic_year_id, context.user.id);
      if (!subjectIds.includes(assignment.subject_id)) {
        return { error: "As Head of Department, you can only remove teacher assignments for subjects within your department." };
      }
    }
  }

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
  revalidatePath("/dashboard/academics/marks");
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

  // If caller is an HOD, verify subject belongs to their department
  const isAdmin = ["school_admin", "principal", "superadmin"].includes(context.role.code);
  const isHodCaller = !isAdmin && (context.role.code === "hod" || Boolean(context.isHod));

  if (isHodCaller) {
    const { subjectIds } = await getHodScope(context.school.id, undefined, context.user.id);
    if (!subjectIds.includes(parsed.data.subjectId)) {
      return { error: "As Head of Department, you can only configure coefficients for subjects within your department." };
    }
  }

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
  revalidatePath("/dashboard/academics/marks");
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
      const coefRaw = parseFloat(String(val));
      if (!isNaN(coefRaw) && coefRaw > 0) {
        const coef = Math.max(1, Math.round(coefRaw));
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

  // If caller is an HOD (and not school_admin / principal / superadmin), verify subjects belong to their department
  const isAdmin = ["school_admin", "principal", "superadmin"].includes(context.role.code);
  const isHodCaller = !isAdmin && (context.role.code === "hod" || Boolean(context.isHod));

  if (isHodCaller) {
    const { subjectIds } = await getHodScope(context.school.id, undefined, context.user.id);
    for (const item of upserts) {
      if (!subjectIds.includes(item.subject_id)) {
        return { error: "As Head of Department, you can only configure coefficients for subjects within your department." };
      }
    }
  }

  const { error } = await supabase
    .from("class_subjects")
    .upsert(upserts, { onConflict: "class_stream_id,subject_id" });

  if (error) return { error: `Could not save coefficients: ${error.message}` };

  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/report-cards");
  revalidatePath("/dashboard/academics/marks");
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
        first_name: parsed.data.firstName.trim().toUpperCase(),
        last_name: parsed.data.lastName.trim().toUpperCase(),
        gender: parsed.data.gender,
        date_of_birth: parsed.data.dateOfBirth ? parsed.data.dateOfBirth : null,
        place_of_birth: parsed.data.placeOfBirth ? parsed.data.placeOfBirth.trim().toUpperCase() : null,
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

  // Calculate next sequential matricule for immediate seamless form continuation
  const nextMatricule = await generateNextStudentMatricule(
    context.school.id,
    parsed.data.academicYearId
  );

  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/academics/report-cards");
  return {
    success: true as const,
    message: `Student "${parsed.data.firstName} ${parsed.data.lastName}" enrolled with Matricule ${matricule}.`,
    matricule,
    nextMatricule,
  };
}

/**
 * Fetches the next auto-generated matricule for the active school and year.
 */
export async function getNextStudentMatriculeAction(academicYearId?: string) {
  try {
    const context = await requirePermission("students.manage");
    const nextMatricule = await generateNextStudentMatricule(context.school.id, academicYearId);
    return { success: true as const, matricule: nextMatricule };
  } catch (err: any) {
    return { success: false as const, error: err?.message || "Failed to generate next matricule." };
  }
}

/**
 * Assigns or unassigns a subject to/from an academic department.
 */
export async function assignSubjectToDepartmentAction(
  subjectId: string,
  departmentId: string | null
) {
  try {
    const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
    const supabase = await createClient();

    const { error } = await supabase
      .from("subjects")
      .update({ department_id: departmentId || null })
      .eq("id", subjectId)
      .eq("school_id", context.school.id);

    if (error) {
      return { success: false as const, error: error.message };
    }

    revalidatePath("/dashboard/academics");
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, error: err?.message || "Failed to update subject department." };
  }
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
      first_name: parsed.data.firstName.trim().toUpperCase(),
      last_name: parsed.data.lastName.trim().toUpperCase(),
      gender: parsed.data.gender,
      date_of_birth: parsed.data.dateOfBirth ? parsed.data.dateOfBirth : null,
      place_of_birth: parsed.data.placeOfBirth ? parsed.data.placeOfBirth.trim().toUpperCase() : null,
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

  // Demo Protection Shield: Protect pre-seeded demo students from deletion
  if (context.school.slug === "demo-bilingual-high-school" && student.matricule?.startsWith("DEMO-")) {
    return {
      error: "Sample demo students are protected so other teachers can explore them. However, you can add new students and delete any student you create!",
    };
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

  // Server-side teacher assignment and departmental scope enforcement:
  const roleCode = context.role?.code || "";
  const isAdminRole = ["school_admin", "principal", "superadmin"].includes(roleCode);
  const isHodRole = !isAdminRole && (roleCode === "hod" || Boolean(context.isHod));
  const isTeacherRole = !isAdminRole && !isHodRole && (roleCode === "teacher" || roleCode === "class_master");

  // Sequence open/closed window check:
  // Only school administrators can modify marks for a closed sequence (Administrative Override).
  // Teachers and HODs are strictly blocked from writing to a closed sequence.
  const { data: sequenceRecord } = await supabase
    .from("evaluation_sequences")
    .select("id, name, sequence_number, is_open_for_marks")
    .eq("school_id", context.school.id)
    .eq("id", payload.sequenceId)
    .maybeSingle();

  if (sequenceRecord && !sequenceRecord.is_open_for_marks && !isAdminRole) {
    return {
      error: `${sequenceRecord.name} is closed for mark entry. Only a School Administrator can modify marks for a closed sequence.`,
    };
  }

  // Audit log for Administrative Override on closed sequences
  if (sequenceRecord && !sequenceRecord.is_open_for_marks && isAdminRole && context.user?.id) {
    await supabase.from("audit_logs").insert({
      school_id: context.school.id,
      user_id: context.user.id,
      action: "ADMIN_OVERRIDE_CLOSED_SEQUENCE_MARKS",
      resource_type: "assessment_marks",
      resource_id: `${payload.sequenceId}_${payload.classStreamId}_${payload.subjectId}`,
      details: {
        sequence_id: payload.sequenceId,
        sequence_name: sequenceRecord.name,
        class_stream_id: payload.classStreamId,
        subject_id: payload.subjectId,
        updated_by_role: roleCode,
        modified_count: payload.marks.length,
        note: "Administrator override on closed sequence mark entry",
      },
    });
  }

  // HOD scope check: HOD can only save marks for subjects within their department OR personally assigned
  if (isHodRole && context.user?.id) {
    const { subjectIds } = await getHodScope(context.school.id, payload.academicYearId, context.user.id);
    const { data: ownAssignment } = await supabase
      .from("teacher_assignments")
      .select("id")
      .eq("school_id", context.school.id)
      .eq("academic_year_id", payload.academicYearId)
      .eq("teacher_user_id", context.user.id)
      .eq("class_stream_id", payload.classStreamId)
      .eq("subject_id", payload.subjectId)
      .maybeSingle();

    if (!subjectIds.includes(payload.subjectId) && !ownAssignment) {
      return {
        error: "As Head of Department, you can only enter or update marks for subjects within your department.",
      };
    }
  }

  // Teacher scope check: Teacher can only save marks for assigned classes & subjects
  if (isTeacherRole && context.user?.id) {
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

    // Check departmental/admin approval status for teachers
    const { data: approval } = await supabase
      .from("departmental_approvals")
      .select("status")
      .eq("school_id", context.school.id)
      .eq("sequence_id", payload.sequenceId)
      .eq("class_stream_id", payload.classStreamId)
      .eq("subject_id", payload.subjectId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (approval?.status === "submitted") {
      return {
        error: "This mark sheet has already been submitted for review and is locked for teacher editing. Request an unlock from your Head of Department or School Administrator if corrections are required.",
      };
    }

    if (approval?.status === "approved") {
      return {
        error: "This sequence has been approved and locked. Only your Head of Department or School Administrator can make changes.",
      };
    }
  }

  // Check if locked: only allow if HOD or administrator
  const { data: existingMarks } = await supabase
    .from("assessment_marks")
    .select("is_locked")
    .eq("sequence_id", payload.sequenceId)
    .eq("class_stream_id", payload.classStreamId)
    .eq("subject_id", payload.subjectId)
    .limit(1);

  if (existingMarks && existingMarks.length > 0 && existingMarks[0].is_locked && !isAdminRole && !isHodRole) {
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
  revalidatePath("/dashboard/academics/marks");
  return { success: true };
}

/**
 * Teacher submits their mark sheet for quality review.
 * In schools with departments, forwards to the Head of Department (HOD).
 * In schools without departments, forwards directly to the School Administrator / Principal.
 * Locks the sheet for the teacher until approved or reopened.
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

  // Track submission in departmental_approvals (supports both departmental & direct admin flow)
  try {
    if (resolvedDeptId) {
      await supabase.from("departmental_approvals").upsert(
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
    } else {
      // Direct Administrative submission (school without departments or subject with no department)
      const { error: noDeptErr } = await supabase.from("departmental_approvals").upsert(
        {
          school_id: context.school.id,
          academic_year_id: academicYearId,
          term_id: termId,
          sequence_id: sequenceId,
          class_stream_id: classStreamId,
          department_id: null,
          subject_id: subjectId,
          status: "submitted",
          notes: `Submitted for administrative review by ${context.user.full_name || "Teacher"}`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "sequence_id,class_stream_id,subject_id" }
      );
      if (noDeptErr) {
        console.warn("Direct admin approval upsert notice:", noDeptErr.message);
      }
    }
  } catch (err) {
    console.warn("Non-fatal departmental_approvals upsert error:", err);
  }

  // Always lock entered marks for this teacher until approved or reopened by HOD or Principal/Admin
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
 * HOD or Principal/School Administrator approves and locks sequence marks for a department/subject.
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

  // Departmental scope enforcement:
  // Head of Department can only approve marks for subjects within their department
  const roleCode = context.role?.code || "";
  const isAdminRole = ["school_admin", "principal", "superadmin"].includes(roleCode);
  const isHodRole = !isAdminRole && (roleCode === "hod" || Boolean(context.isHod));

  if (isHodRole && context.user?.id) {
    const { departmentIds, subjectIds } = await getHodScope(context.school.id, academicYearId, context.user.id);
    const inScope = (subjectId && subjectIds.includes(subjectId)) || (departmentId && departmentIds.includes(departmentId));
    if (!inScope) {
      return { error: "As Head of Department, you can only approve marks for subjects within your department." };
    }
  }

  const supabase = await createClient();

  // 1. Record formal departmental or administrative approval
  if (departmentId || subjectId) {
    try {
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
      } else if (subjectId) {
        // Direct administrative approval for a subject without department
        await supabase.from("departmental_approvals").upsert(
          {
            school_id: context.school.id,
            academic_year_id: academicYearId,
            term_id: termId,
            sequence_id: sequenceId,
            class_stream_id: classStreamId,
            department_id: null,
            subject_id: subjectId,
            status: "approved",
            approved_by: context.user?.id,
            approved_at: new Date().toISOString(),
            notes,
          },
          { onConflict: "sequence_id,class_stream_id,subject_id" }
        );
      }
    } catch (approvalErr) {
      console.warn("Direct approval upsert warning:", approvalErr);
    }
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
    details: { approved_by: context.user.id, notes, role: context.role?.code },
  });

  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/report-cards");
  revalidatePath("/dashboard/academics/marks");
  return { success: true };
}

/**
 * HOD or Principal/School Administrator re-enables a submitted/approved mark sheet for a teacher to make corrections.
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
  const approverRole =
    context.role?.code === "school_admin" || context.role?.code === "principal" || context.role?.code === "superadmin"
      ? "School Administration"
      : "Head of Department";
  const auditNote = notes || `Reopened for teacher revision by ${context.user.full_name || approverRole}`;

  // 1. Update departmental_approvals to 'rejected' (reopened for revision) with audit notes
  if (departmentId || subjectId) {
    let query = supabase
      .from("departmental_approvals")
      .update({
        status: "rejected",
        notes: auditNote,
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

    const { data: updatedRows } = await query.select("id");

    // If no existing approval row was found to update (e.g. submitted directly before DB row created), insert one
    if ((!updatedRows || updatedRows.length === 0) && subjectId) {
      try {
        await supabase.from("departmental_approvals").upsert(
          {
            school_id: context.school.id,
            academic_year_id: (formData.get("academicYearId") as string) || null,
            term_id: (formData.get("termId") as string) || null,
            sequence_id: sequenceId,
            class_stream_id: classStreamId,
            department_id: departmentId || null,
            subject_id: subjectId,
            status: "rejected",
            notes: auditNote,
            approved_by: context.user.id,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: departmentId
              ? "sequence_id,class_stream_id,department_id,subject_id"
              : "sequence_id,class_stream_id,subject_id",
          }
        );
      } catch (err) {
        console.warn("Notice: could not upsert rejected status on reopen:", err);
      }
    }
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
    details: {
      reason: auditNote,
      reopened_by: context.user.id,
      reopened_by_role: context.role?.code,
    },
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

export async function initializeSchoolSequencesAction() {
  const context = await requirePermission("academics.manage");
  const seqs = await ensureStandardSequences(context.school.id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/marks");
  revalidatePath("/dashboard/academics/report-cards");
  return { success: true, count: seqs.length };
}

// ==============================================================================
// Timetable System Server Actions (Multi-Subsystem Grammar / Technical / Commercial)
// ==============================================================================

import { checkTimetableConflict } from "@/lib/academic/timetable-service";

export async function createOrUpdateTimetableProfileAction(formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
  const profileId = String(formData.get("profileId") || "");
  const name = String(formData.get("name") || "").trim();
  const subsystem = String(formData.get("subsystem") || "grammar") as "grammar" | "technical" | "commercial" | "general";
  const defaultPeriodDurationMinutes = Math.max(30, Math.min(120, Number(formData.get("defaultPeriodDurationMinutes") || 50)));
  const dayStartTime = String(formData.get("dayStartTime") || "07:30");
  const description = String(formData.get("description") || "").trim();

  if (!name) {
    return { error: "Profile name is required (e.g. 'General Grammar' or 'Technical Workshop')." };
  }

  const supabase = await createClient();

  if (profileId) {
    const { error } = await supabase
      .from("timetable_profiles")
      .update({
        name,
        subsystem,
        default_period_duration_minutes: defaultPeriodDurationMinutes,
        day_start_time: dayStartTime,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId)
      .eq("school_id", context.school.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("timetable_profiles")
      .insert({
        school_id: context.school.id,
        name,
        subsystem,
        default_period_duration_minutes: defaultPeriodDurationMinutes,
        day_start_time: dayStartTime,
        description: description || null,
      });

    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/academics/timetable");
  return { success: true };
}

export async function deleteTimetableProfileAction(formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
  const profileId = String(formData.get("profileId") || "");
  if (!profileId) return { error: "Profile ID is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("timetable_profiles")
    .delete()
    .eq("id", profileId)
    .eq("school_id", context.school.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/academics/timetable");
  return { success: true };
}

export async function autoGenerateDefaultPeriodsAction(payload: {
  profileId: string;
  dayStartTime: string;
  periodDurationMinutes: number;
  numberOfPeriods: number;
  shortBreakAfterPeriod: number;
  shortBreakDuration: number;
  lunchBreakAfterPeriod: number;
  lunchBreakDuration: number;
}) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
  const {
    profileId,
    dayStartTime,
    periodDurationMinutes,
    numberOfPeriods = 8,
    shortBreakAfterPeriod = 3,
    shortBreakDuration = 20,
    lunchBreakAfterPeriod = 5,
    lunchBreakDuration = 40,
  } = payload;

  const supabase = await createClient();

  // Helper to add minutes to "HH:MM"
  const addMinutes = (timeStr: string, mins: number): string => {
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date(2000, 0, 1, h, m, 0);
    date.setMinutes(date.getMinutes() + mins);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}:00`;
  };

  const periodsToInsert: Array<{
    profile_id: string;
    school_id: string;
    name: string;
    period_number: number;
    start_time: string;
    end_time: string;
    is_break: boolean;
    applies_to_days: number[];
  }> = [];

  let currentTime = dayStartTime.length === 5 ? `${dayStartTime}:00` : dayStartTime;
  let periodCounter = 1;

  for (let i = 1; i <= numberOfPeriods; i++) {
    const periodStart = currentTime;
    const periodEnd = addMinutes(currentTime, periodDurationMinutes);
    periodsToInsert.push({
      profile_id: profileId,
      school_id: context.school.id,
      name: `Period ${i}`,
      period_number: periodCounter++,
      start_time: periodStart,
      end_time: periodEnd,
      is_break: false,
      applies_to_days: [1, 2, 3, 4, 5],
    });
    currentTime = periodEnd;

    // Check if Short Break is needed
    if (i === shortBreakAfterPeriod && shortBreakDuration > 0) {
      const breakStart = currentTime;
      const breakEnd = addMinutes(currentTime, shortBreakDuration);
      periodsToInsert.push({
        profile_id: profileId,
        school_id: context.school.id,
        name: "Petite Récréation (Short Break)",
        period_number: periodCounter++,
        start_time: breakStart,
        end_time: breakEnd,
        is_break: true,
        applies_to_days: [1, 2, 3, 4, 5],
      });
      currentTime = breakEnd;
    }

    // Check if Lunch Break is needed
    if (i === lunchBreakAfterPeriod && lunchBreakDuration > 0) {
      const lunchStart = currentTime;
      const lunchEnd = addMinutes(currentTime, lunchBreakDuration);
      periodsToInsert.push({
        profile_id: profileId,
        school_id: context.school.id,
        name: "Grande Récréation (Lunch Break)",
        period_number: periodCounter++,
        start_time: lunchStart,
        end_time: lunchEnd,
        is_break: true,
        applies_to_days: [1, 2, 3, 4, 5],
      });
      currentTime = lunchEnd;
    }
  }

  // Delete previous periods for this profile and insert fresh ones
  await supabase.from("timetable_periods").delete().eq("profile_id", profileId);
  const { error } = await supabase.from("timetable_periods").insert(periodsToInsert);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/academics/timetable");
  return { success: true };
}

export async function saveTeacherAvailabilityAction(payload: {
  teacherId: string;
  maxWeeklyHours?: number;
  availabilities: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    notes?: string;
  }>;
}) {
  const context = await requireAnyPermission(["academics.manage", "staff.manage"]);
  const { teacherId, maxWeeklyHours = 18, availabilities } = payload;
  if (!teacherId) return { error: "Teacher ID is required." };

  const supabase = await createClient();

  const rows = availabilities.map((a) => ({
    school_id: context.school.id,
    teacher_id: teacherId,
    day_of_week: a.dayOfWeek,
    start_time: a.startTime,
    end_time: a.endTime,
    is_available: a.isAvailable,
    max_weekly_hours: maxWeeklyHours,
    notes: a.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("teacher_availabilities").upsert(rows, {
    onConflict: "school_id,teacher_id,day_of_week",
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/academics/timetable");
  return { success: true };
}

export async function assignTimetableSlotAction(payload: {
  academicYearId: string;
  profileId: string;
  classStreamId: string;
  dayOfWeek: number;
  periodId: string;
  subjectId: string;
  teacherId?: string | null;
  roomName?: string | null;
  slotIdToIgnore?: string;
}) {
  const context = await requireAnyPermission(["academics.manage", "assignments.manage"]);
  const {
    academicYearId,
    profileId,
    classStreamId,
    dayOfWeek,
    periodId,
    subjectId,
    teacherId,
    roomName,
    slotIdToIgnore,
  } = payload;

  if (!classStreamId || !periodId || !subjectId) {
    return { error: "Class, period, and subject are required to schedule a slot." };
  }

  // 1. Run Conflict Detection (Teacher collision across all subsystems, availability, room double-booking)
  const conflict = await checkTimetableConflict({
    schoolId: context.school.id,
    academicYearId,
    dayOfWeek,
    periodId,
    teacherId,
    roomName,
    classStreamId,
    slotIdToIgnore,
  });

  if (conflict.hasConflict) {
    return { error: conflict.message || "A scheduling conflict was detected." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("timetable_slots").upsert(
    {
      school_id: context.school.id,
      academic_year_id: academicYearId,
      profile_id: profileId,
      class_stream_id: classStreamId,
      day_of_week: dayOfWeek,
      period_id: periodId,
      subject_id: subjectId,
      teacher_id: teacherId || null,
      room_name: roomName?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "class_stream_id,day_of_week,period_id",
    }
  );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/academics/timetable");
  return { success: true };
}

export async function deleteTimetableSlotAction(formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "assignments.manage"]);
  const slotId = String(formData.get("slotId") || "");
  if (!slotId) return { error: "Slot ID is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("timetable_slots")
    .delete()
    .eq("id", slotId)
    .eq("school_id", context.school.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/academics/timetable");
  return { success: true };
}

/**
 * Remove a subject assignment from a class stream in class_subjects.
 * Prevents subjects from appearing on report cards when unassigned.
 */
export async function removeClassSubjectAction(formData: FormData) {
  const context = await requireAnyPermission(["academics.manage"]);
  const classStreamId = String(formData.get("classStreamId") || "");
  const subjectId = String(formData.get("subjectId") || "");
  const confirmDeleteMarks = formData.get("confirmDeleteMarks") === "true";

  if (!classStreamId || !subjectId) {
    return { error: "Class group and Subject are required." };
  }

  const supabase = await createClient();

  // Safety check: Cannot remove if marks have already been recorded for this class group and subject
  const { count: marksCount } = await supabase
    .from("assessment_marks")
    .select("id", { count: "exact", head: true })
    .eq("class_stream_id", classStreamId)
    .eq("subject_id", subjectId);

  if (marksCount && marksCount > 0 && !confirmDeleteMarks) {
    return {
      error: `Cannot remove this subject: ${marksCount} assessment mark(s) have already been entered for this class group. Delete the marks first or confirm deletion to remove.`,
      needsConfirmation: true,
      marksCount,
    };
  }

  if (marksCount && marksCount > 0 && confirmDeleteMarks) {
    await supabase
      .from("assessment_marks")
      .delete()
      .eq("class_stream_id", classStreamId)
      .eq("subject_id", subjectId);
  }

  // Remove teacher assignments for this stream and subject
  await supabase
    .from("teacher_assignments")
    .delete()
    .eq("class_stream_id", classStreamId)
    .eq("subject_id", subjectId);

  // Remove from class_subjects
  const { error } = await supabase
    .from("class_subjects")
    .delete()
    .eq("class_stream_id", classStreamId)
    .eq("subject_id", subjectId);

  if (error) {
    return { error: `Could not remove subject: ${error.message}` };
  }

  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/report-cards");
  revalidatePath("/dashboard/academics/marks");
  return { success: true as const, message: "Subject removed from class." };
}

/**
 * Add a single subject to a class stream curriculum with a coefficient.
 */
export async function addClassSubjectAction(formData: FormData) {
  const context = await requireAnyPermission(["academics.manage"]);
  const classStreamId = String(formData.get("classStreamId") || "");
  const subjectId = String(formData.get("subjectId") || "");
  const coefRaw = parseFloat(String(formData.get("coefficient") || "2"));
  const coefficient = Math.max(1, Math.round(isNaN(coefRaw) ? 2 : coefRaw));
  const maxMarks = parseFloat(String(formData.get("maxMarks") || "20"));

  if (!classStreamId || !subjectId) {
    return { error: "Class group and Subject are required." };
  }
  if (coefficient <= 0) {
    return { error: "Coefficient must be a whole number greater than 0." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("class_subjects").upsert(
    {
      school_id: context.school.id,
      class_stream_id: classStreamId,
      subject_id: subjectId,
      coefficient,
      max_marks: !isNaN(maxMarks) && maxMarks > 0 ? maxMarks : 20,
    },
    { onConflict: "class_stream_id,subject_id" }
  );

  if (error) {
    return { error: `Could not add subject to class: ${error.message}` };
  }

  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/report-cards");
  revalidatePath("/dashboard/academics/marks");
  return { success: true as const, message: "Subject added to class successfully." };
}

/**
 * Clean up subjects in class_subjects that have NO teacher assignment and NO recorded marks.
 */
export async function cleanClassSubjectsAction(formData: FormData) {
  const context = await requireAnyPermission(["academics.manage"]);
  const classStreamId = String(formData.get("classStreamId") || "");
  if (!classStreamId) {
    return { error: "Class group is required." };
  }

  const supabase = await createClient();

  const [{ data: teacherAssignments }, { data: marks }] = await Promise.all([
    supabase.from("teacher_assignments").select("subject_id").eq("class_stream_id", classStreamId),
    supabase.from("assessment_marks").select("subject_id").eq("class_stream_id", classStreamId),
  ]);

  const activeSubjectIds = new Set<string>([
    ...(teacherAssignments || []).map((t) => t.subject_id),
    ...(marks || []).map((m) => m.subject_id),
  ]);

  const { data: allClassSubjects } = await supabase
    .from("class_subjects")
    .select("subject_id")
    .eq("class_stream_id", classStreamId);

  const toRemove = (allClassSubjects || [])
    .map((cs) => cs.subject_id)
    .filter((id) => !activeSubjectIds.has(id));

  if (toRemove.length === 0) {
    return { message: "No unassigned subjects found to clean up." };
  }

  const { error } = await supabase
    .from("class_subjects")
    .delete()
    .eq("class_stream_id", classStreamId)
    .in("subject_id", toRemove);

  if (error) {
    return { error: `Could not clean subjects: ${error.message}` };
  }

  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/academics/report-cards");
  revalidatePath("/dashboard/academics/marks");
  return {
    success: true as const,
    message: `Removed ${toRemove.length} unassigned subject(s) from this class.`,
  };
}

/**
 * ==============================================================================
 * ANNUAL ACADEMIC ROLLOVER & PROMOTION ACTIONS
 * ==============================================================================
 */

/**
 * Creates a new Academic Year for the school, auto-seeding 3 terms, 6 sequences,
 * and optionally cloning the class stream structure from an existing year.
 */
export async function createAcademicYearAction(formData: FormData) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
  const name = String(formData.get("name") || "").trim();
  const startDate = String(formData.get("startDate") || "").trim();
  const endDate = String(formData.get("endDate") || "").trim();
  const copyStreamsFromYearId = String(formData.get("copyStreamsFromYearId") || "").trim();

  if (!name) {
    return { error: "Academic year name is required (e.g. 2026/2027)." };
  }
  if (!startDate || !endDate) {
    return { error: "Start and end dates are required." };
  }

  const supabase = await createClient();

  // 1. Create Academic Year
  const { data: newYear, error: yearError } = await supabase
    .from("academic_years")
    .insert({
      school_id: context.school.id,
      name,
      start_date: startDate,
      end_date: endDate,
      is_current: false,
    })
    .select()
    .single();

  if (yearError) {
    if (yearError.code === "23505") {
      return { error: `Academic year "${name}" already exists in your school.` };
    }
    return { error: `Could not create academic year: ${yearError.message}` };
  }

  const isFrench = context.school.subsystem === "francophone";
  const startYear = startDate.split("-")[0] || "2026";
  const endYear = endDate.split("-")[0] || "2027";

  // 2. Seed 3 Official Terms
  const termsData = [
    {
      school_id: context.school.id,
      academic_year_id: newYear.id,
      term_number: 1,
      name: isFrench ? "1er Trimestre" : "First Term",
      start_date: startDate,
      end_date: `${startYear}-12-18`,
      is_active: true,
    },
    {
      school_id: context.school.id,
      academic_year_id: newYear.id,
      term_number: 2,
      name: isFrench ? "2e Trimestre" : "Second Term",
      start_date: `${endYear}-01-05`,
      end_date: `${endYear}-03-27`,
      is_active: false,
    },
    {
      school_id: context.school.id,
      academic_year_id: newYear.id,
      term_number: 3,
      name: isFrench ? "3e Trimestre" : "Third Term",
      start_date: `${endYear}-04-14`,
      end_date: endDate,
      is_active: false,
    },
  ];

  const { data: createdTerms, error: termsError } = await supabase
    .from("terms")
    .insert(termsData)
    .select();

  if (!termsError && createdTerms && createdTerms.length > 0) {
    const t1 = createdTerms.find((t) => t.term_number === 1);
    const t2 = createdTerms.find((t) => t.term_number === 2);
    const t3 = createdTerms.find((t) => t.term_number === 3);

    // 3. Seed 6 Official Evaluation Sequences
    const sequencesData = [
      {
        school_id: context.school.id,
        term_id: t1?.id,
        sequence_number: 1,
        name: isFrench ? "1ère Séquence" : "Sequence 1",
        start_date: startDate,
        end_date: `${startYear}-10-25`,
        is_open_for_marks: true,
      },
      {
        school_id: context.school.id,
        term_id: t1?.id,
        sequence_number: 2,
        name: isFrench ? "2e Séquence" : "Sequence 2",
        start_date: `${startYear}-11-01`,
        end_date: `${startYear}-12-18`,
        is_open_for_marks: false,
      },
      {
        school_id: context.school.id,
        term_id: t2?.id,
        sequence_number: 3,
        name: isFrench ? "3e Séquence" : "Sequence 3",
        start_date: `${endYear}-01-05`,
        end_date: `${endYear}-02-15`,
        is_open_for_marks: false,
      },
      {
        school_id: context.school.id,
        term_id: t2?.id,
        sequence_number: 4,
        name: isFrench ? "4e Séquence" : "Sequence 4",
        start_date: `${endYear}-02-18`,
        end_date: `${endYear}-03-27`,
        is_open_for_marks: false,
      },
      {
        school_id: context.school.id,
        term_id: t3?.id,
        sequence_number: 5,
        name: isFrench ? "5e Séquence" : "Sequence 5",
        start_date: `${endYear}-04-14`,
        end_date: `${endYear}-05-20`,
        is_open_for_marks: false,
      },
      {
        school_id: context.school.id,
        term_id: t3?.id,
        sequence_number: 6,
        name: isFrench ? "6e Séquence" : "Sequence 6",
        start_date: `${endYear}-05-22`,
        end_date: endDate,
        is_open_for_marks: false,
      },
    ];

    await supabase.from("evaluation_sequences").insert(sequencesData);
  }

  // 4. Optionally clone class streams and curriculum from source year
  if (copyStreamsFromYearId) {
    const { data: existingStreams } = await supabase
      .from("class_streams")
      .select("*, class_subjects (*)")
      .eq("school_id", context.school.id)
      .eq("academic_year_id", copyStreamsFromYearId);

    if (existingStreams && existingStreams.length > 0) {
      for (const stream of existingStreams) {
        const { data: newStream } = await supabase
          .from("class_streams")
          .insert({
            school_id: context.school.id,
            academic_year_id: newYear.id,
            class_id: stream.class_id,
            name: stream.name,
            stream_tag: stream.stream_tag,
            class_master_id: null, // Fresh slate: class masters and teachers are assigned anew each academic year
          })
          .select()
          .single();

        if (newStream && stream.class_subjects && stream.class_subjects.length > 0) {
          const subjectsToClone = stream.class_subjects.map((cs: { subject_id: string; coefficient: number; max_marks: number; is_compulsory: boolean }) => ({
            school_id: context.school.id,
            class_stream_id: newStream.id,
            subject_id: cs.subject_id,
            coefficient: cs.coefficient,
            max_marks: cs.max_marks,
            is_compulsory: cs.is_compulsory,
          }));
          await supabase.from("class_subjects").insert(subjectsToClone);
        }
      }
    }
  }

  revalidatePath("/dashboard/academics");
  return {
    success: true as const,
    academicYear: newYear,
    message: `Academic Year "${name}" created successfully with terms and sequences.`,
  };
}

/**
 * Previews annual promotion candidates for an academic year, calculating annual averages,
 * class ranks, and automatic progression recommendations based on customizable thresholds.
 */
export async function previewAnnualPromotionAction(payload: {
  sourceAcademicYearId: string;
  targetAcademicYearId?: string;
  promotionThreshold?: number;
  trialThreshold?: number;
}) {
  const context = await requireAnyPermission(["academics.manage", "students.manage"]);
  const sourceAcademicYearId = payload.sourceAcademicYearId;
  const promotionThreshold = payload.promotionThreshold ?? 10.0;
  const trialThreshold = payload.trialThreshold ?? 8.5;

  if (!sourceAcademicYearId) {
    return { error: "Please select a source academic year." };
  }

  const supabase = await createClient();

  // 1. Fetch source enrolments with student and class stream info
  const { data: enrolments, error: enrolError } = await supabase
    .from("enrolments")
    .select(`
      id,
      student_id,
      is_repeater,
      status,
      class_stream:class_streams (
        id,
        name,
        stream_tag,
        class_id,
        class:classes (
          id,
          name,
          level_order,
          cycle
        )
      ),
      student:students (
        id,
        matricule,
        first_name,
        last_name,
        gender,
        status
      )
    `)
    .eq("school_id", context.school.id)
    .eq("academic_year_id", sourceAcademicYearId);

  if (enrolError) {
    return { error: `Could not load student enrolments: ${enrolError.message}` };
  }

  // 2. Fetch all school classes sorted by level_order
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, level_order, cycle")
    .eq("school_id", context.school.id)
    .order("level_order", { ascending: true });

  const sortedClasses = classes || [];
  const maxLevelOrder = Math.max(...sortedClasses.map((c) => c.level_order), 7);

  // 3. Fetch target academic year class streams if targetAcademicYearId provided
  let targetStreams: Array<{
    id: string;
    name: string;
    stream_tag: string | null;
    class_id: string;
    class_name: string;
    level_order: number;
  }> = [];

  if (payload.targetAcademicYearId) {
    const { data: streamsData } = await supabase
      .from("class_streams")
      .select(`
        id,
        name,
        stream_tag,
        class_id,
        class:classes (
          name,
          level_order
        )
      `)
      .eq("school_id", context.school.id)
      .eq("academic_year_id", payload.targetAcademicYearId);

    if (streamsData) {
      targetStreams = streamsData.map((s) => {
        const cls = Array.isArray(s.class) ? s.class[0] : s.class;
        return {
          id: s.id,
          name: s.name,
          stream_tag: s.stream_tag,
          class_id: s.class_id,
          class_name: cls?.name || "",
          level_order: cls?.level_order || 1,
        };
      });
    }
  }

  // 4. Fetch assessment marks for all students in source academic year
  const { data: marks } = await supabase
    .from("assessment_marks")
    .select("student_id, subject_id, class_stream_id, normalized_score_20, score, max_marks")
    .eq("school_id", context.school.id)
    .eq("academic_year_id", sourceAcademicYearId);

  // 5. Fetch class_subjects for coefficients
  const { data: classSubjects } = await supabase
    .from("class_subjects")
    .select("class_stream_id, subject_id, coefficient");

  const coeffMap = new Map<string, number>();
  for (const cs of classSubjects || []) {
    coeffMap.set(`${cs.class_stream_id}:${cs.subject_id}`, Number(cs.coefficient) || 2.0);
  }

  // Group marks by student -> subject -> scores
  const studentMarksMap = new Map<string, Map<string, number[]>>();
  for (const m of marks || []) {
    let score = m.normalized_score_20;
    if (score === null || score === undefined) {
      if (m.score !== null && m.score !== undefined && m.max_marks > 0) {
        score = (Number(m.score) / Number(m.max_marks)) * 20;
      }
    }
    if (score !== null && score !== undefined && !isNaN(score)) {
      if (!studentMarksMap.has(m.student_id)) {
        studentMarksMap.set(m.student_id, new Map());
      }
      const subMap = studentMarksMap.get(m.student_id)!;
      if (!subMap.has(m.subject_id)) {
        subMap.set(m.subject_id, []);
      }
      subMap.get(m.subject_id)!.push(Number(score));
    }
  }

  // 6. Compute annual average for each enrolled student
  interface Candidate {
    enrolmentId: string;
    studentId: string;
    matricule: string;
    fullName: string;
    gender: string;
    currentStreamId: string;
    currentStreamName: string;
    currentClassLevel: number;
    currentClassName: string;
    annualAverage: number | null;
    rank: number;
    totalInStream: number;
    recommendedDecision: "promoted" | "trial" | "repeated" | "graduated";
    recommendedTargetStreamId: string | null;
    isCurrentRepeater: boolean;
  }

  const rawCandidates: Candidate[] = [];
  const streamCounts = new Map<string, number>();

  for (const enr of enrolments || []) {
    const student = Array.isArray(enr.student) ? enr.student[0] : enr.student;
    const stream = Array.isArray(enr.class_stream) ? enr.class_stream[0] : enr.class_stream;
    const cls = stream?.class ? (Array.isArray(stream.class) ? stream.class[0] : stream.class) : null;

    if (!student || !stream) continue;

    streamCounts.set(stream.id, (streamCounts.get(stream.id) || 0) + 1);

    const subMap = studentMarksMap.get(student.id);
    let annualAverage: number | null = null;

    if (subMap && subMap.size > 0) {
      let totalWeighted = 0;
      let totalCoeff = 0;

      for (const [subjectId, scores] of subMap.entries()) {
        const subjectAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const coeff = coeffMap.get(`${stream.id}:${subjectId}`) || 2.0;
        totalWeighted += subjectAvg * coeff;
        totalCoeff += coeff;
      }

      if (totalCoeff > 0) {
        annualAverage = Math.round((totalWeighted / totalCoeff) * 100) / 100;
      }
    }

    const currentLevel = cls?.level_order || 1;
    const isTerminal = currentLevel >= maxLevelOrder || (currentLevel === 5 && cls?.cycle === "cycle_1");

    let recommendedDecision: "promoted" | "trial" | "repeated" | "graduated" = "repeated";
    if (annualAverage !== null) {
      if (annualAverage >= promotionThreshold) {
        recommendedDecision = isTerminal ? "graduated" : "promoted";
      } else if (annualAverage >= trialThreshold) {
        recommendedDecision = isTerminal ? "graduated" : "trial";
      } else {
        recommendedDecision = "repeated";
      }
    } else {
      // Default to promoted if no marks are entered yet
      recommendedDecision = "promoted";
    }

    rawCandidates.push({
      enrolmentId: enr.id,
      studentId: student.id,
      matricule: student.matricule || "N/A",
      fullName: `${student.last_name || ""} ${student.first_name || ""}`.trim(),
      gender: student.gender || "M",
      currentStreamId: stream.id,
      currentStreamName: stream.name,
      currentClassLevel: currentLevel,
      currentClassName: cls?.name || stream.name,
      annualAverage,
      rank: 1,
      totalInStream: 1,
      recommendedDecision,
      recommendedTargetStreamId: null,
      isCurrentRepeater: Boolean(enr.is_repeater),
    });
  }

  // 7. Calculate ranks within each stream
  const groupedByStream = new Map<string, Candidate[]>();
  for (const cand of rawCandidates) {
    if (!groupedByStream.has(cand.currentStreamId)) {
      groupedByStream.set(cand.currentStreamId, []);
    }
    groupedByStream.get(cand.currentStreamId)!.push(cand);
  }

  for (const [streamId, cands] of groupedByStream.entries()) {
    cands.sort((a, b) => (b.annualAverage ?? -1) - (a.annualAverage ?? -1));
    const total = cands.length;
    cands.forEach((c, idx) => {
      c.rank = idx + 1;
      c.totalInStream = total;

      // Suggest target stream
      if (targetStreams.length > 0) {
        let targetLevel = c.currentClassLevel;
        if (c.recommendedDecision === "promoted" || c.recommendedDecision === "trial") {
          targetLevel = c.currentClassLevel + 1;
        }

        // Find candidate streams at target level
        const levelStreams = targetStreams.filter((ts) => ts.level_order === targetLevel);
        if (levelStreams.length > 0) {
          // Attempt exact name or stream tag match
          const matchingStream = levelStreams.find(
            (ls) =>
              ls.name.toLowerCase().includes(c.currentStreamName.toLowerCase()) ||
              (c.currentStreamName.includes(" ") && ls.name.endsWith(c.currentStreamName.split(" ").slice(-1)[0]))
          );
          c.recommendedTargetStreamId = matchingStream ? matchingStream.id : levelStreams[0].id;
        }
      }
    });
  }

  return {
    candidates: rawCandidates,
    targetStreams,
    classes: sortedClasses,
    promotionThreshold,
    trialThreshold,
    totalCount: rawCandidates.length,
  };
}

/**
 * Quickly creates a missing class stream in the target academic year during rollover,
 * optionally cloning curriculum subjects from a source stream.
 */
export async function createQuickTargetStreamAction(payload: {
  academicYearId: string;
  classId: string;
  name: string;
  streamTag?: string;
  copyCurriculumFromStreamId?: string;
}) {
  const context = await requireAnyPermission(["academics.manage", "school.settings.manage"]);
  const { academicYearId, classId, name, streamTag, copyCurriculumFromStreamId } = payload;

  if (!academicYearId || !classId || !name) {
    return { error: "Academic year, class, and stream name are required." };
  }

  const supabase = await createClient();

  // 1. Insert class stream
  const { data: newStream, error } = await supabase
    .from("class_streams")
    .insert({
      school_id: context.school.id,
      academic_year_id: academicYearId,
      class_id: classId,
      name,
      stream_tag: streamTag || null,
    })
    .select(`
      id,
      name,
      stream_tag,
      class_id,
      class:classes (
        name,
        level_order
      )
    `)
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: `A class stream named "${name}" already exists in this academic year.` };
    }
    return { error: error.message };
  }

  // 2. Optionally clone subjects/coefficients from another stream
  if (copyCurriculumFromStreamId && newStream) {
    const { data: existingSubjects } = await supabase
      .from("class_subjects")
      .select("subject_id, coefficient, max_marks, is_compulsory")
      .eq("class_stream_id", copyCurriculumFromStreamId);

    if (existingSubjects && existingSubjects.length > 0) {
      const subjectsToInsert = existingSubjects.map((s) => ({
        school_id: context.school.id,
        class_stream_id: newStream.id,
        subject_id: s.subject_id,
        coefficient: s.coefficient,
        max_marks: s.max_marks,
        is_compulsory: s.is_compulsory,
      }));
      await supabase.from("class_subjects").insert(subjectsToInsert);
    }
  }

  const cls = Array.isArray(newStream.class) ? newStream.class[0] : newStream.class;
  const formattedStream = {
    id: newStream.id,
    name: newStream.name,
    stream_tag: newStream.stream_tag,
    class_id: newStream.class_id,
    class_name: cls?.name || "",
    level_order: cls?.level_order || 1,
  };

  revalidatePath("/dashboard/academics");
  return {
    success: true as const,
    newStream: formattedStream,
    message: `Stream "${name}" successfully created.`,
  };
}

/**
 * Executes the annual promotion and academic year rollover for selected students.
 * Inserts new enrolments into the target academic year, updates student statuses,
 * and records repeater flags without requiring existing students to be re-admitted.
 */
export async function executeAnnualPromotionRolloverAction(payload: {
  sourceAcademicYearId: string;
  targetAcademicYearId: string;
  decisions: Array<{
    studentId: string;
    enrolmentId?: string;
    decision: "promoted" | "trial" | "repeated" | "graduated" | "transferred" | "withdrawn";
    targetClassStreamId?: string | null;
    isRepeater?: boolean;
  }>;
}) {
  const context = await requireAnyPermission(["academics.manage", "students.manage"]);
  const { sourceAcademicYearId, targetAcademicYearId, decisions } = payload;

  if (!sourceAcademicYearId || !targetAcademicYearId) {
    return { error: "Both source and target academic years are required." };
  }
  if (!decisions || decisions.length === 0) {
    return { error: "No student promotion decisions provided." };
  }

  const supabase = await createClient();

  // Verify target academic year exists
  const { data: targetYear, error: targetYearError } = await supabase
    .from("academic_years")
    .select("id, name")
    .eq("school_id", context.school.id)
    .eq("id", targetAcademicYearId)
    .maybeSingle();

  if (targetYearError || !targetYear) {
    return { error: "Target academic year could not be verified." };
  }

  let promotedCount = 0;
  let trialCount = 0;
  let repeatedCount = 0;
  let graduatedCount = 0;
  let transferredCount = 0;

  for (const item of decisions) {
    const { studentId, decision, targetClassStreamId, isRepeater } = item;

    if (decision === "graduated") {
      await Promise.all([
        supabase
          .from("students")
          .update({ status: "graduated" })
          .eq("id", studentId)
          .eq("school_id", context.school.id),
        supabase
          .from("enrolments")
          .update({ status: "promoted" })
          .eq("student_id", studentId)
          .eq("academic_year_id", sourceAcademicYearId),
      ]);
      graduatedCount++;
    } else if (decision === "transferred" || decision === "withdrawn") {
      await Promise.all([
        supabase
          .from("students")
          .update({ status: decision === "transferred" ? "transferred" : "withdrawn" })
          .eq("id", studentId)
          .eq("school_id", context.school.id),
        supabase
          .from("enrolments")
          .update({ status: "withdrawn" })
          .eq("student_id", studentId)
          .eq("academic_year_id", sourceAcademicYearId),
      ]);
      transferredCount++;
    } else {
      // Promoted, Trial, or Repeated: Requires enrolment in target academic year
      if (!targetClassStreamId) {
        continue;
      }

      const repeaterFlag = decision === "repeated" || Boolean(isRepeater);
      const enrolmentStatus = decision === "repeated" ? "repeated" : "promoted";

      // 1. Update source year enrolment status
      await supabase
        .from("enrolments")
        .update({ status: enrolmentStatus })
        .eq("student_id", studentId)
        .eq("academic_year_id", sourceAcademicYearId);

      // 2. Upsert enrolment in target academic year
      await supabase.from("enrolments").upsert(
        {
          school_id: context.school.id,
          student_id: studentId,
          academic_year_id: targetAcademicYearId,
          class_stream_id: targetClassStreamId,
          is_repeater: repeaterFlag,
          status: "active",
        },
        { onConflict: "academic_year_id,student_id" }
      );

      // 3. Update student master profile
      await supabase
        .from("students")
        .update({
          status: "active",
          is_repeater: repeaterFlag,
        })
        .eq("id", studentId)
        .eq("school_id", context.school.id);

      if (decision === "promoted") promotedCount++;
      else if (decision === "trial") trialCount++;
      else if (decision === "repeated") repeatedCount++;
    }
  }

  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/academics/report-cards");

  return {
    success: true as const,
    message: `Rollover executed: ${promotedCount} promoted, ${trialCount} promoted on trial, ${repeatedCount} repeating, ${graduatedCount} graduated, ${transferredCount} departed.`,
    summary: {
      promotedCount,
      trialCount,
      repeatedCount,
      graduatedCount,
      transferredCount,
    },
  };
}

/**
 * ==============================================================================
 * OFFICIAL STUDENT MULTI-YEAR ACADEMIC TRANSCRIPT (RELEVE DE NOTES)
 * ==============================================================================
 */

export interface TranscriptSubjectRow {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  coefficient: number;
  term1Average: number | null;
  term2Average: number | null;
  term3Average: number | null;
  annualAverage: number | null;
  weightedPoints: number | null;
  appreciation: string;
}

export interface TranscriptYearRecord {
  academicYearId: string;
  academicYearName: string;
  startDate: string;
  endDate: string;
  classStreamId: string;
  classStreamName: string;
  className: string;
  levelOrder: number;
  cycle: string;
  classMasterName: string | null;
  isRepeater: boolean;
  status: string;
  subjects: TranscriptSubjectRow[];
  totalCoefficients: number;
  totalWeightedPoints: number;
  annualAverage: number | null;
  classRank: number;
  totalClassEnrolment: number;
  councilDecision: string;
}

export interface StudentFullTranscriptData {
  school: {
    id: string;
    name: string;
    code: string;
    subsystem: string;
    motto: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
  };
  student: {
    id: string;
    matricule: string;
    fullName: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string | null;
    placeOfBirth: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    status: string;
    createdAt: string;
  };
  years: TranscriptYearRecord[];
  cumulativeGPA: number | null;
  totalYearsCompleted: number;
  overallAppreciation: string;
  issuedAt: string;
}

/**
 * Fetches the complete official multi-year transcript for a student across all academic years.
 */
export async function getStudentFullTranscriptAction(studentId: string): Promise<{
  success?: boolean;
  data?: StudentFullTranscriptData;
  error?: string;
}> {
  const context = await requireAnyPermission([
    "students.view_all",
    "students.manage",
    "academics.manage",
    "reports.view",
  ]);

  if (!studentId) {
    return { error: "Student ID is required." };
  }

  const supabase = await createClient();

  // 1. Fetch Student Record
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("*")
    .eq("school_id", context.school.id)
    .eq("id", studentId)
    .maybeSingle();

  if (studentError || !student) {
    return { error: "Student record could not be found." };
  }

  // 2. Fetch School Details
  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", context.school.id)
    .maybeSingle();

  // 3. Fetch all enrolments for this student ordered chronologically
  const { data: enrolments, error: enrolError } = await supabase
    .from("enrolments")
    .select(`
      id,
      academic_year_id,
      class_stream_id,
      is_repeater,
      status,
      created_at,
      academic_year:academic_years (
        id,
        name,
        start_date,
        end_date
      ),
      class_stream:class_streams (
        id,
        name,
        stream_tag,
        class_master:user_profiles (
          full_name
        ),
        class:classes (
          id,
          name,
          level_order,
          cycle
        )
      )
    `)
    .eq("school_id", context.school.id)
    .eq("student_id", studentId);

  if (enrolError || !enrolments || enrolments.length === 0) {
    return { error: "No enrolment history found for this student." };
  }

  // Sort enrolments chronologically by academic year start_date
  enrolments.sort((a, b) => {
    const yearA = Array.isArray(a.academic_year) ? a.academic_year[0] : a.academic_year;
    const yearB = Array.isArray(b.academic_year) ? b.academic_year[0] : b.academic_year;
    return (yearA?.start_date || "").localeCompare(yearB?.start_date || "");
  });

  const academicYearIds = enrolments.map((e) => e.academic_year_id);
  const classStreamIds = enrolments.map((e) => e.class_stream_id);

  // 4. Fetch all terms for these academic years
  const { data: terms } = await supabase
    .from("terms")
    .select("id, academic_year_id, term_number, name")
    .in("academic_year_id", academicYearIds)
    .order("term_number", { ascending: true });

  // 5. Fetch all class_subjects for these class streams
  const { data: classSubjects } = await supabase
    .from("class_subjects")
    .select(`
      class_stream_id,
      subject_id,
      coefficient,
      max_marks,
      subject:subjects (
        id,
        name,
        code
      )
    `)
    .in("class_stream_id", classStreamIds);

  // 6. Fetch all assessment marks for this student across these years
  const { data: marks } = await supabase
    .from("assessment_marks")
    .select("academic_year_id, term_id, sequence_id, class_stream_id, subject_id, normalized_score_20, score, max_marks")
    .eq("student_id", studentId)
    .in("academic_year_id", academicYearIds);

  // 7. Fetch all stream sizes and peer annual averages to compute historical rank
  const { data: allPeerMarks } = await supabase
    .from("assessment_marks")
    .select("academic_year_id, class_stream_id, student_id, subject_id, normalized_score_20, score, max_marks")
    .in("class_stream_id", classStreamIds);

  const { data: peerEnrolments } = await supabase
    .from("enrolments")
    .select("academic_year_id, class_stream_id, student_id")
    .in("class_stream_id", classStreamIds);

  // Helper to calculate Cameroon grade appreciation
  const getAppreciation = (avg: number | null): string => {
    if (avg === null || isNaN(avg)) return "-";
    if (avg >= 16.0) return "Excellent (Très Bien)";
    if (avg >= 14.0) return "Very Good (Bien)";
    if (avg >= 12.0) return "Good (Assez Bien)";
    if (avg >= 10.0) return "Pass (Passable)";
    if (avg >= 8.0) return "Weak (Médiocre)";
    return "Poor (Faible)";
  };

  const yearsRecords: TranscriptYearRecord[] = [];
  let cumulativeWeightedSum = 0;
  let cumulativeCount = 0;

  for (const enr of enrolments) {
    const yearObj = Array.isArray(enr.academic_year) ? enr.academic_year[0] : enr.academic_year;
    const streamObj = Array.isArray(enr.class_stream) ? enr.class_stream[0] : enr.class_stream;
    const classObj = streamObj?.class ? (Array.isArray(streamObj.class) ? streamObj.class[0] : streamObj.class) : null;
    const masterObj = streamObj?.class_master ? (Array.isArray(streamObj.class_master) ? streamObj.class_master[0] : streamObj.class_master) : null;

    if (!yearObj || !streamObj) continue;

    // Terms in this year
    const yearTerms = (terms || []).filter((t) => t.academic_year_id === yearObj.id);
    const t1 = yearTerms.find((t) => t.term_number === 1);
    const t2 = yearTerms.find((t) => t.term_number === 2);
    const t3 = yearTerms.find((t) => t.term_number === 3);

    // Stream subjects
    const streamSubs = (classSubjects || []).filter((cs) => cs.class_stream_id === streamObj.id);

    // Student marks for this year
    const yearMarks = (marks || []).filter((m) => m.academic_year_id === yearObj.id);

    // Subject rows
    const subjectRows: TranscriptSubjectRow[] = [];
    let yearTotalCoeff = 0;
    let yearTotalWeightedPoints = 0;

    for (const cs of streamSubs) {
      const sub = Array.isArray(cs.subject) ? cs.subject[0] : cs.subject;
      if (!sub) continue;

      const coef = Number(cs.coefficient) || 2.0;

      const getTermAvg = (termId?: string): number | null => {
        if (!termId) return null;
        const termMarks = yearMarks.filter((m) => m.term_id === termId && m.subject_id === sub.id);
        const validScores = termMarks
          .map((m) => {
            if (m.normalized_score_20 !== null && m.normalized_score_20 !== undefined) {
              return Number(m.normalized_score_20);
            }
            if (m.score !== null && m.max_marks > 0) {
              return (Number(m.score) / Number(m.max_marks)) * 20;
            }
            return null;
          })
          .filter((s): s is number => s !== null && !isNaN(s));

        if (validScores.length === 0) return null;
        return Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 100) / 100;
      };

      const m1 = getTermAvg(t1?.id);
      const m2 = getTermAvg(t2?.id);
      const m3 = getTermAvg(t3?.id);

      const availableTerms = [m1, m2, m3].filter((m): m is number => m !== null);
      let subAnnual: number | null = null;
      if (availableTerms.length > 0) {
        subAnnual = Math.round((availableTerms.reduce((a, b) => a + b, 0) / availableTerms.length) * 100) / 100;
      }

      const weightedPoints = subAnnual !== null ? Math.round(subAnnual * coef * 100) / 100 : null;

      if (subAnnual !== null) {
        yearTotalCoeff += coef;
        yearTotalWeightedPoints += subAnnual * coef;
      }

      subjectRows.push({
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        coefficient: coef,
        term1Average: m1,
        term2Average: m2,
        term3Average: m3,
        annualAverage: subAnnual,
        weightedPoints,
        appreciation: getAppreciation(subAnnual),
      });
    }

    const annualAverage = yearTotalCoeff > 0 ? Math.round((yearTotalWeightedPoints / yearTotalCoeff) * 100) / 100 : null;

    if (annualAverage !== null) {
      cumulativeWeightedSum += annualAverage;
      cumulativeCount++;
    }

    // Compute rank among peers in this class stream
    const streamPeerEnrolments = (peerEnrolments || []).filter((pe) => pe.class_stream_id === streamObj.id);
    const totalClassEnrolment = Math.max(streamPeerEnrolments.length, 1);

    // Compute peer annual averages
    const peerMap = new Map<string, number[]>();
    for (const pm of allPeerMarks || []) {
      if (pm.class_stream_id === streamObj.id) {
        let score = pm.normalized_score_20;
        if (score === null && pm.score !== null && pm.max_marks > 0) {
          score = (Number(pm.score) / Number(pm.max_marks)) * 20;
        }
        if (score !== null && !isNaN(score)) {
          if (!peerMap.has(pm.student_id)) peerMap.set(pm.student_id, []);
          peerMap.get(pm.student_id)!.push(Number(score));
        }
      }
    }

    const peerAverages: Array<{ studentId: string; avg: number }> = [];
    for (const [sId, scores] of peerMap.entries()) {
      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        peerAverages.push({ studentId: sId, avg });
      }
    }
    peerAverages.sort((a, b) => b.avg - a.avg);
    const studentRankIdx = peerAverages.findIndex((p) => p.studentId === studentId);
    const classRank = studentRankIdx >= 0 ? studentRankIdx + 1 : 1;

    // Council decision
    let councilDecision = "Promoted (Admis)";
    if (enr.is_repeater || enr.status === "repeated") {
      councilDecision = "Repeated (Redouble)";
    } else if (annualAverage !== null) {
      if (annualAverage >= 10.0) {
        councilDecision = classObj?.level_order === 7 ? "Graduated (Diplômé)" : "Promoted (Admis)";
      } else if (annualAverage >= 8.5) {
        councilDecision = "Promoted on Trial (Admis sur titre d'essai)";
      } else {
        councilDecision = "Repeated (Redouble)";
      }
    }

    yearsRecords.push({
      academicYearId: yearObj.id,
      academicYearName: yearObj.name,
      startDate: yearObj.start_date,
      endDate: yearObj.end_date,
      classStreamId: streamObj.id,
      classStreamName: streamObj.name,
      className: classObj?.name || streamObj.name,
      levelOrder: classObj?.level_order || 1,
      cycle: classObj?.cycle || "cycle_1",
      classMasterName: masterObj?.full_name || null,
      isRepeater: Boolean(enr.is_repeater),
      status: enr.status,
      subjects: subjectRows,
      totalCoefficients: yearTotalCoeff,
      totalWeightedPoints: Math.round(yearTotalWeightedPoints * 100) / 100,
      annualAverage,
      classRank,
      totalClassEnrolment,
      councilDecision,
    });
  }

  const cumulativeGPA = cumulativeCount > 0 ? Math.round((cumulativeWeightedSum / cumulativeCount) * 100) / 100 : null;

  return {
    success: true,
    data: {
      school: {
        id: school?.id || context.school.id,
        name: school?.name || "Cameroon Secondary School",
        code: school?.code || "SCH",
        subsystem: school?.subsystem || "bilingual",
        motto: school?.motto || "Labor - Disciplina - Scientia",
        address: school?.address || "Republic of Cameroon",
        phone: school?.phone || null,
        email: school?.email || null,
        logoUrl: school?.logo_url || null,
      },
      student: {
        id: student.id,
        matricule: student.matricule || "N/A",
        fullName: `${student.last_name || ""} ${student.first_name || ""}`.trim(),
        firstName: student.first_name || "",
        lastName: student.last_name || "",
        gender: student.gender || "M",
        dateOfBirth: student.date_of_birth || null,
        placeOfBirth: student.place_of_birth || null,
        guardianName: student.guardian_name || null,
        guardianPhone: student.guardian_phone || null,
        status: student.status || "active",
        createdAt: student.created_at,
      },
      years: yearsRecords,
      cumulativeGPA,
      totalYearsCompleted: yearsRecords.length,
      overallAppreciation: getAppreciation(cumulativeGPA),
      issuedAt: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    },
  };
}



