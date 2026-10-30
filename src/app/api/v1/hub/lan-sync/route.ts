import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const {
    academicYearId,
    termId,
    sequenceId,
    classStreamId,
    subjectId,
    maxMarks,
    competencyDescription,
    marks,
    teacherId,
  } = body;

  if (!sequenceId || !classStreamId || !subjectId || !marks || !Array.isArray(marks)) {
    return NextResponse.json(
      { error: "Missing required mark sheet fields." },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  const supabase = await createClient();

  // 1. Identify School ID from sequence or stream
  const { data: seq } = await supabase
    .from("sequences")
    .select("school_id")
    .eq("id", sequenceId)
    .single();

  const schoolId = seq?.school_id;
  if (!schoolId) {
    return NextResponse.json(
      { error: "Could not locate school for this sequence." },
      { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  // 2. Upsert marks directly into local Hub database
  const rowsToUpsert = marks.map((m: any) => ({
    school_id: schoolId,
    academic_year_id: academicYearId,
    term_id: termId,
    sequence_id: sequenceId,
    class_stream_id: classStreamId,
    subject_id: subjectId,
    student_id: m.studentId,
    score: m.status === "present" ? m.score : null,
    max_marks: maxMarks || 20.0,
    status: m.status || "present",
    remarks: m.remarks || null,
    updated_by: teacherId || null,
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertErr } = await supabase.from("assessment_marks").upsert(rowsToUpsert, {
    onConflict: "sequence_id,class_stream_id,subject_id,student_id",
  });

  if (upsertErr) {
    return NextResponse.json(
      { error: upsertErr.message },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  // 3. Update competency description if provided
  if (competencyDescription && typeof competencyDescription === "string" && competencyDescription.trim()) {
    const trimmed = competencyDescription.trim();
    const { data: stream } = await supabase
      .from("class_streams")
      .select("class_id")
      .eq("id", classStreamId)
      .maybeSingle();

    if (stream?.class_id) {
      const { data: existingComp } = await supabase
        .from("subject_competencies")
        .select("id")
        .eq("school_id", schoolId)
        .eq("subject_id", subjectId)
        .eq("class_id", stream.class_id)
        .maybeSingle();

      if (existingComp) {
        await supabase
          .from("subject_competencies")
          .update({ description: trimmed, updated_at: new Date().toISOString() })
          .eq("id", existingComp.id);
      } else {
        await supabase.from("subject_competencies").insert({
          school_id: schoolId,
          subject_id: subjectId,
          class_id: stream.class_id,
          term_number: 1,
          description: trimmed,
          order_index: 1,
        });
      }
    }
  }

  return NextResponse.json(
    {
      success: true,
      marksMerged: rowsToUpsert.length,
      syncedAt: new Date().toISOString(),
      message: `Successfully transferred ${rowsToUpsert.length} marks directly to School Hub over local Wi-Fi.`,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
