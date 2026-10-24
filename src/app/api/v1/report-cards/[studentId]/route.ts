import { NextRequest, NextResponse } from "next/server";
import { getStudentReportCard } from "@/lib/academic/report-card-service";
import { getTenantContext, hasAnyPermission } from "@/lib/tenancy/context";
import { getAssignedClassStreamIds } from "@/lib/academic/service";
import { createClient } from "@/lib/supabase/server";
import { APP_CONFIG } from "@/lib/version";

interface Context {
  params: Promise<{
    studentId: string;
  }>;
}

export async function GET(request: NextRequest, context: Context) {
  const { studentId } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const termId = searchParams.get("termId");

  const tenantContext = await getTenantContext();
  if (!tenantContext) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasAnyPermission(tenantContext, ["report_cards.view", "report_cards.generate"])) {
    return NextResponse.json({ error: "Forbidden", message: "Report-card access is not assigned to your role." }, { status: 403 });
  }

  if (!termId) {
    return NextResponse.json({ error: "BadRequest", message: "A valid termId is required." }, { status: 400 });
  }

  const schoolId = tenantContext.school.id;
  const supabase = await createClient();
  const { data: term } = await supabase
    .from("terms")
    .select("id, academic_year_id")
    .eq("id", termId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!term) {
    return NextResponse.json({ error: "NotFound", message: "Term not found in the active school." }, { status: 404 });
  }

  const canViewAllStudents = hasAnyPermission(tenantContext, ["students.view_all", "students.manage"]);
  if (!canViewAllStudents) {
    const { data: enrolment } = await supabase
      .from("enrolments")
      .select("class_stream_id")
      .eq("school_id", schoolId)
      .eq("academic_year_id", term.academic_year_id)
      .eq("student_id", studentId)
      .eq("status", "active")
      .maybeSingle();

    const assignedClassStreamIds = await getAssignedClassStreamIds(
      schoolId,
      term.academic_year_id,
      tenantContext.user.id,
      tenantContext.role.code
    );

    if (!enrolment || !assignedClassStreamIds.includes(enrolment.class_stream_id)) {
      return NextResponse.json({ error: "Forbidden", message: "You do not have access to this student's report card." }, { status: 403 });
    }
  }

  try {
    const reportData = await getStudentReportCard(schoolId, termId, studentId);

    if (!reportData) {
      return NextResponse.json(
        {
          error: "NotFound",
          message: `Report card data not found for student enrolment ID '${studentId}'.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        version: APP_CONFIG.apiVersion,
        compliance: APP_CONFIG.compliance,
        generatedAt: new Date().toISOString(),
        data: reportData,
      },
      {
        status: 200,
        headers: {
          "X-Nsei-Api-Version": APP_CONFIG.apiVersion,
          "Cache-Control": "private, max-age=60",
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load report card";
    return NextResponse.json(
      { error: "InternalError", message: msg },
      { status: 500 }
    );
  }
}
