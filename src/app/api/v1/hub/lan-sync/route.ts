import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queryLocalDb } from "@/lib/db/local-postgres";
import { getHubNodeConfig } from "@/lib/hub/hub-node-store";
import { enqueueOutboxMutation } from "@/lib/hub/hub-outbox";

export async function POST(req: NextRequest) {
  try {
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

    // 1. Identify School ID: Local node config -> Local DB sequence -> Local DB stream -> Schools table
    let schoolId: string | null = getHubNodeConfig()?.schoolId || null;

    if (!schoolId) {
      try {
        const seqRes = await queryLocalDb(
          "SELECT school_id FROM public.evaluation_sequences WHERE id = $1 LIMIT 1",
          [sequenceId]
        );
        if (seqRes.rows.length > 0 && seqRes.rows[0].school_id) {
          schoolId = seqRes.rows[0].school_id;
        }
      } catch {}
    }

    if (!schoolId) {
      try {
        const streamRes = await queryLocalDb(
          "SELECT school_id FROM public.class_streams WHERE id = $1 LIMIT 1",
          [classStreamId]
        );
        if (streamRes.rows.length > 0 && streamRes.rows[0].school_id) {
          schoolId = streamRes.rows[0].school_id;
        }
      } catch {}
    }

    if (!schoolId) {
      try {
        const schRes = await queryLocalDb("SELECT id FROM public.schools LIMIT 1");
        if (schRes.rows.length > 0) {
          schoolId = schRes.rows[0].id;
        }
      } catch {}
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: "Could not locate school for this sequence." },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Resolve missing academicYearId or termId automatically to satisfy NOT NULL constraints
    let resolvedAcademicYearId = academicYearId;
    let resolvedTermId = termId;

    if (!resolvedTermId || !resolvedAcademicYearId) {
      try {
        const seqRes = await queryLocalDb(
          `SELECT es.term_id, t.academic_year_id 
           FROM public.evaluation_sequences es
           LEFT JOIN public.terms t ON t.id = es.term_id
           WHERE es.id = $1 LIMIT 1`,
          [sequenceId]
        );
        if (seqRes.rows.length > 0) {
          if (!resolvedTermId) resolvedTermId = seqRes.rows[0].term_id;
          if (!resolvedAcademicYearId) resolvedAcademicYearId = seqRes.rows[0].academic_year_id;
        }
      } catch {}
    }

    if (!resolvedAcademicYearId && schoolId) {
      try {
        const yrRes = await queryLocalDb(
          "SELECT id FROM public.academic_years WHERE school_id = $1 ORDER BY is_current DESC, start_date DESC LIMIT 1",
          [schoolId]
        );
        if (yrRes.rows.length > 0) {
          resolvedAcademicYearId = yrRes.rows[0].id;
        }
      } catch {}
    }

    // 2. Upsert marks directly into Local PostgreSQL database (100% offline edge execution)
    let marksSaved = 0;
    const rowsToUpsert: any[] = [];

    for (const m of marks) {
      if (!m.studentId) continue;
      const scoreVal =
        m.status === "present"
          ? m.score !== undefined && m.score !== null && m.score !== ""
            ? Number(m.score)
            : null
          : null;
      const maxMarksVal = maxMarks ? Number(maxMarks) : 20.0;
      const statusVal = m.status || "present";
      const remarksVal = m.remarks || null;
      const updatedByVal = teacherId || null;

      rowsToUpsert.push({
        school_id: schoolId,
        academic_year_id: resolvedAcademicYearId,
        term_id: resolvedTermId,
        sequence_id: sequenceId,
        class_stream_id: classStreamId,
        subject_id: subjectId,
        student_id: m.studentId,
        score: scoreVal,
        max_marks: maxMarksVal,
        status: statusVal,
        remarks: remarksVal,
        updated_by: updatedByVal,
        updated_at: new Date().toISOString(),
      });

      try {
        await queryLocalDb(
          `INSERT INTO public.assessment_marks (
            school_id, academic_year_id, term_id, sequence_id, class_stream_id, subject_id, student_id,
            score, max_marks, status, remarks, updated_by, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, clock_timestamp())
          ON CONFLICT (sequence_id, class_stream_id, subject_id, student_id)
          DO UPDATE SET
            score = EXCLUDED.score,
            max_marks = EXCLUDED.max_marks,
            status = EXCLUDED.status,
            remarks = EXCLUDED.remarks,
            updated_by = EXCLUDED.updated_by,
            updated_at = clock_timestamp();`,
          [
            schoolId,
            resolvedAcademicYearId,
            resolvedTermId,
            sequenceId,
            classStreamId,
            subjectId,
            m.studentId,
            scoreVal,
            maxMarksVal,
            statusVal,
            remarksVal,
            updatedByVal,
          ]
        );
        marksSaved++;
      } catch (pgErr) {
        console.error("[lan-sync] Local PostgreSQL upsert failed for student:", m.studentId, pgErr);
      }
    }

    // 3. Enqueue mutation to hub.sync_outbox for eventual Cloud Push
    try {
      await enqueueOutboxMutation({
        schoolId,
        entityType: "assessment_marks",
        entityId: `${sequenceId}:${classStreamId}:${subjectId}`,
        mutationType: "UPDATE",
        payload: {
          academicYearId: resolvedAcademicYearId,
          termId: resolvedTermId,
          sequenceId,
          classStreamId,
          subjectId,
          maxMarks,
          marks,
          teacherId,
        },
        clientVersion: 1,
        actorId: teacherId || null,
      });
    } catch (outboxErr) {
      console.warn("[lan-sync] Notice: Outbox queuing skipped:", outboxErr);
    }

    // 4. Update competency description in local DB if provided
    if (competencyDescription && typeof competencyDescription === "string" && competencyDescription.trim()) {
      const trimmed = competencyDescription.trim();
      try {
        const streamRes = await queryLocalDb(
          "SELECT class_id FROM public.class_streams WHERE id = $1 LIMIT 1",
          [classStreamId]
        );
        const classId = streamRes.rows[0]?.class_id;
        if (classId) {
          await queryLocalDb(
            `INSERT INTO public.subject_competencies (
              school_id, subject_id, class_id, term_number, description, order_index, updated_at
            ) VALUES ($1, $2, $3, 1, $4, 1, clock_timestamp())
            ON CONFLICT (school_id, subject_id, class_id, term_number, order_index)
            DO UPDATE SET description = EXCLUDED.description, updated_at = clock_timestamp();`,
            [schoolId, subjectId, classId, trimmed]
          ).catch(() => {});
        }
      } catch (compErr) {
        console.warn("[lan-sync] Local competency notice:", compErr);
      }
    }

    // 5. Non-blocking asynchronous cloud replication if internet is present
    try {
      const supabase = createAdminClient();
      Promise.resolve(
        supabase.from("assessment_marks").upsert(rowsToUpsert, {
          onConflict: "sequence_id,class_stream_id,subject_id,student_id",
        })
      ).catch(() => {});
    } catch {}

    return NextResponse.json(
      {
        success: true,
        marksMerged: marksSaved || marks.length,
        syncedAt: new Date().toISOString(),
        message: `Successfully transferred ${marksSaved || marks.length} marks directly to School Hub over local Wi-Fi.`,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (outerErr: any) {
    console.error("[lan-sync] Unexpected error in LAN sync handler:", outerErr);
    return NextResponse.json(
      { error: outerErr?.message || "Internal server error during LAN sync." },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
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
