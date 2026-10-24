import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext, hasAnyPermission } from "@/lib/tenancy/context";
import { getActiveAcademicYear, getAssignedClassStreamIds } from "@/lib/academic/service";
import { APP_CONFIG } from "@/lib/version";

export async function GET(request: NextRequest) {
  const tenantContext = await getTenantContext();
  if (!tenantContext) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "A valid authenticated session is required.",
      },
      { status: 401 }
    );
  }

  if (!hasAnyPermission(tenantContext, ["students.view_all", "students.view_assigned", "students.manage"])) {
    return NextResponse.json(
      { error: "Forbidden", message: "Your school role does not include student-data access." },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const schoolId = tenantContext.school.id;
  const academicYear = await getActiveAcademicYear(schoolId);

  if (!academicYear) {
    return NextResponse.json({ version: APP_CONFIG.apiVersion, count: 0, data: [] });
  }

  const canViewAll = hasAnyPermission(tenantContext, ["students.view_all", "students.manage"]);
  const assignedClassStreamIds = canViewAll
    ? undefined
    : await getAssignedClassStreamIds(
        schoolId,
        academicYear.id,
        tenantContext.user.id,
        tenantContext.role.code
      );

  const searchParams = request.nextUrl.searchParams;
  const classStreamId = searchParams.get("classStreamId");
  const requestedLimit = Number(searchParams.get("limit") || 50);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;

  if (classStreamId && assignedClassStreamIds && !assignedClassStreamIds.includes(classStreamId)) {
    return NextResponse.json(
      { error: "Forbidden", message: "You do not have access to that class group." },
      { status: 403 }
    );
  }

  let query = supabase
    .from("enrolments")
    .select(
      `
      id,
      status,
      created_at,
      student:students (
        id,
        matricule,
        first_name,
        last_name,
        gender,
        residence_status
      ),
      class_stream:class_streams (
        id,
        name,
        class:classes (name, level_order, cycle)
      ),
      academic_year:academic_years (name, is_current)
    `
    )
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYear.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (classStreamId) {
    query = query.eq("class_stream_id", classStreamId);
  }

  if (assignedClassStreamIds) {
    query = query.in("class_stream_id", assignedClassStreamIds);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "DatabaseError", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      version: APP_CONFIG.apiVersion,
      count: data?.length || 0,
      data: data || [],
    },
    {
      status: 200,
      headers: {
        "X-Nsei-Api-Version": APP_CONFIG.apiVersion,
        "Cache-Control": "private, no-store",
      },
    }
  );
}