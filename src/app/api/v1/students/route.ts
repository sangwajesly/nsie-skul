import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { APP_CONFIG } from "@/lib/version";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "A valid Bearer token or authenticated session is required.",
      },
      { status: 401 }
    );
  }

  // Resolve school membership for tenant scoping
  const { data: memberships } = await supabase
    .from("school_memberships")
    .select("school_id, schools (id, name, code)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (!memberships || memberships.length === 0) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "User is not linked to an active school.",
      },
      { status: 403 }
    );
  }

  const schoolId = memberships[0].school_id;
  const searchParams = request.nextUrl.searchParams;
  const classStreamId = searchParams.get("classStreamId");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  let query = supabase
    .from("student_enrolments")
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
        date_of_birth,
        guardian_name,
        guardian_phone
      ),
      class_stream:class_streams (
        id,
        name,
        class:classes (name, level, cycle)
      ),
      academic_year:academic_years (name, is_current)
    `
    )
    .eq("school_id", schoolId)
    .eq("status", "active")
    .limit(limit);

  if (classStreamId) {
    query = query.eq("class_stream_id", classStreamId);
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
      },
    }
  );
}
