import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveAcademicYear } from "@/lib/academic/service";
import {
  MAX_STUDENT_IMPORT_ROWS,
  parseStudentImportFile,
  StudentImportRow,
} from "@/lib/academic/student-import";
import { getTenantContext } from "@/lib/tenancy/context";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getValidatedImport(
  file: File,
  classStreamId: string,
  schoolId: string
): Promise<
  | { rows: StudentImportRow[]; schoolId: string; academicYearId: string; classStreamId: string }
  | { error: string; status: number }
> {
  const parsed = await parseStudentImportFile(file);
  if (parsed.errors.length > 0) {
    return { error: parsed.errors.join(" "), status: 400 };
  }

  const supabase = await createClient();
  const academicYear = await getActiveAcademicYear(schoolId);
  if (!academicYear) {
    return { error: "Set a current school year before importing students.", status: 409 };
  }

  const { data: classStream, error: classError } = await supabase
    .from("class_streams")
    .select("id")
    .eq("id", classStreamId)
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYear.id)
    .maybeSingle();

  if (classError || !classStream) {
    return { error: "Choose a class group from this school’s current academic year.", status: 400 };
  }

  const matricules = parsed.rows.map((row) => row.student.matricule);
  const { data: existingStudents, error: existingError } = await supabase
    .from("students")
    .select("matricule")
    .eq("school_id", schoolId)
    .in("matricule", matricules);

  if (existingError) {
    return { error: "Could not check existing matricules. Please retry the preview.", status: 500 };
  }

  const existingMatricules = new Set(
    (existingStudents || []).map((student) => student.matricule.trim().toUpperCase())
  );
  const rows = parsed.rows.map((row) => ({
    ...row,
    errors: existingMatricules.has(row.student.matricule)
      ? [...row.errors, "Matricule already exists in this school."]
      : row.errors,
  }));

  return {
    rows,
    schoolId,
    academicYearId: academicYear.id,
    classStreamId,
  };
}

export async function GET() {
  const context = await getTenantContext();
  if (!context) return errorResponse("Sign in to download the student template.", 401);
  if (!context.hasPermission("students.manage")) {
    return errorResponse("You do not have permission to import students.", 403);
  }

  const csvHeader = [
    "Matricule",
    "First Name",
    "Last Name",
    "Gender",
    "Residence Status",
    "Date of Birth",
    "Place of Birth",
    "Guardian Name",
    "Guardian Phone",
    "Guardian Email",
  ].join(",");

  return new Response(`${csvHeader}\r\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=student-import-template.csv",
      "Cache-Control": "private, no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  const context = await getTenantContext();
  if (!context) return errorResponse("Sign in before importing students.", 401);
  if (!context.hasPermission("students.manage")) {
    return errorResponse("You do not have permission to import students.", 403);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Upload a CSV or Excel workbook using multipart form data.", 400);
  }

  const mode = formData.get("mode");
  const classStreamId = String(formData.get("classStreamId") || "");
  const fileValue = formData.get("file");

  if (mode !== "preview" && mode !== "import") {
    return errorResponse("Choose preview or import mode.", 400);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(classStreamId)) {
    return errorResponse("Choose a valid class group.", 400);
  }
  if (!(fileValue instanceof File)) {
    return errorResponse("Choose a CSV or Excel file to upload.", 400);
  }

  const validated = await getValidatedImport(fileValue, classStreamId, context.school.id);
  if ("error" in validated) return errorResponse(validated.error, validated.status);

  const invalidRows = validated.rows.filter((row) => row.errors.length > 0);
  if (mode === "preview") {
    return NextResponse.json({
      rowCount: validated.rows.length,
      errorCount: invalidRows.length,
      rows: validated.rows.slice(0, 100),
      truncated: validated.rows.length > 100,
    });
  }

  if (validated.rows.length > MAX_STUDENT_IMPORT_ROWS) {
    return errorResponse(`Imports are limited to ${MAX_STUDENT_IMPORT_ROWS} rows.`, 400);
  }
  if (invalidRows.length > 0) {
    return NextResponse.json(
      {
        error: "Fix the invalid rows before importing.",
        rowCount: validated.rows.length,
        errorCount: invalidRows.length,
        rows: validated.rows.slice(0, 100),
        truncated: validated.rows.length > 100,
      },
      { status: 422 }
    );
  }

  const supabase = await createClient();
  const studentRows = validated.rows.map(({ student }) => ({
    school_id: validated.schoolId,
    matricule: student.matricule,
    first_name: student.firstName,
    last_name: student.lastName,
    gender: student.gender,
    date_of_birth: student.dateOfBirth,
    place_of_birth: student.placeOfBirth,
    residence_status: student.residenceStatus,
    guardian_name: student.guardianName,
    guardian_phone: student.guardianPhone,
    guardian_email: student.guardianEmail,
    status: "active" as const,
  }));

  const { data: insertedStudents, error: studentError } = await supabase
    .from("students")
    .insert(studentRows)
    .select("id, matricule");

  if (studentError || !insertedStudents || insertedStudents.length !== studentRows.length) {
    const duplicateConflict = studentError?.code === "23505";
    return errorResponse(
      duplicateConflict
        ? "At least one matricule was added by another user during this import. Refresh the preview and try again."
        : studentError?.message || "Could not create the student records.",
      duplicateConflict ? 409 : 500
    );
  }

  const studentIdByMatricule = new Map(insertedStudents.map((student) => [student.matricule, student.id]));
  const enrolments = validated.rows.map(({ student }) => ({
    school_id: validated.schoolId,
    student_id: studentIdByMatricule.get(student.matricule)!,
    academic_year_id: validated.academicYearId,
    class_stream_id: validated.classStreamId,
    status: "active" as const,
  }));

  const { error: enrolmentError } = await supabase.from("enrolments").insert(enrolments);
  if (enrolmentError) {
    const { error: rollbackError } = await supabase
      .from("students")
      .delete()
      .eq("school_id", validated.schoolId)
      .in("id", insertedStudents.map((student) => student.id));

    if (rollbackError) {
      console.error("Student import rollback failed", {
        schoolId: validated.schoolId,
        createdStudentCount: insertedStudents.length,
        enrolmentError: enrolmentError.message,
        rollbackError: rollbackError.message,
      });
      return errorResponse(
        "Enrollment failed and automatic cleanup could not be completed. Contact school support before retrying.",
        500
      );
    }

    return errorResponse(`Enrollment failed; the newly created student records were rolled back. ${enrolmentError.message}`, 500);
  }

  await supabase.from("audit_logs").insert({
    school_id: validated.schoolId,
    user_id: context.user.id,
    action: "BULK_IMPORT_STUDENTS",
    resource_type: "students",
    details: { count: insertedStudents.length, academic_year_id: validated.academicYearId },
  });

  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard");

  return NextResponse.json({ importedCount: insertedStudents.length });
}