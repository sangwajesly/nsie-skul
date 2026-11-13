import { getHubNodeConfig, saveHubNodeConfig, HubNodeConfig } from "./hub-node-store";
import { getLocalPgPool } from "../db/local-postgres";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CloudSyncResult {
  success: boolean;
  message: string;
  itemsPushed?: number;
  itemsPulled?: number;
  lastSyncAt?: string;
  error?: string;
}

/**
 * Persists pulled Cloud snapshot directly into the local PostgreSQL 16 cluster.
 * Uses replica replication role to prevent transient foreign-key locks during full snapshot sync.
 */
async function upsertPulledDataToLocalDb(pulledData: any) {
  if (!pulledData) return;
  const pool = getLocalPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN;");
    await client.query("SET session_replication_role = 'replica';");

    const schoolId = pulledData.school?.id || (pulledData.academicYears?.[0]?.school_id);
    if (!schoolId) {
      await client.query("SET session_replication_role = 'origin';");
      await client.query("COMMIT;");
      return;
    }

    // 1. School
    if (pulledData.school) {
      const s = pulledData.school;
      await client.query(
        `INSERT INTO schools (id, name, slug, code, logo_url, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           code = EXCLUDED.code,
           logo_url = COALESCE(EXCLUDED.logo_url, schools.logo_url),
           is_active = true;`,
        [s.id, s.name, s.slug, s.code, s.logo_url]
      );
    }

    // 2. Academic Years
    let activeYearId: string | null = null;
    if (pulledData.academicYears?.length) {
      for (const y of pulledData.academicYears) {
        activeYearId = y.id;
        await client.query(
          `INSERT INTO academic_years (id, school_id, name, start_date, end_date, is_current)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             start_date = EXCLUDED.start_date,
             end_date = EXCLUDED.end_date,
             is_current = EXCLUDED.is_current;`,
          [y.id, y.school_id, y.name, y.start_date, y.end_date, Boolean(y.is_current)]
        );
      }
    }

    // 3. Terms
    if (pulledData.terms?.length) {
      for (const tm of pulledData.terms) {
        await client.query(
          `INSERT INTO terms (id, school_id, academic_year_id, name, term_number, start_date, end_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             term_number = EXCLUDED.term_number,
             start_date = EXCLUDED.start_date,
             end_date = EXCLUDED.end_date;`,
          [tm.id, tm.school_id, tm.academic_year_id, tm.name, tm.term_number, tm.start_date, tm.end_date]
        );
      }
    }

    // 4. Evaluation Sequences
    if (pulledData.sequences?.length) {
      for (const seq of pulledData.sequences) {
        await client.query(
          `INSERT INTO evaluation_sequences (id, school_id, term_id, sequence_number, name)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             sequence_number = EXCLUDED.sequence_number,
             name = EXCLUDED.name;`,
          [seq.id, seq.school_id, seq.term_id, seq.sequence_number, seq.name]
        );
      }
    }

    // 5. Departments
    if (pulledData.departments?.length) {
      for (const d of pulledData.departments) {
        const code = d.code || d.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase();
        await client.query(
          `INSERT INTO departments (id, school_id, name, code)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             code = EXCLUDED.code;`,
          [d.id, d.school_id, d.name, code]
        );
      }
    }

    // 6. Classes
    if (pulledData.classes?.length) {
      for (const c of pulledData.classes) {
        await client.query(
          `INSERT INTO classes (id, school_id, name, level_order, cycle)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             level_order = EXCLUDED.level_order,
             cycle = EXCLUDED.cycle;`,
          [c.id, c.school_id, c.name, c.level_order || 1, c.cycle || "cycle_1"]
        );
      }
    }

    // 7. Class Streams
    if (pulledData.classStreams?.length) {
      for (const cs of pulledData.classStreams) {
        await client.query(
          `INSERT INTO class_streams (id, school_id, class_id, academic_year_id, name, stream_tag)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             stream_tag = EXCLUDED.stream_tag;`,
          [cs.id, cs.school_id, cs.class_id, cs.academic_year_id, cs.name, cs.stream_tag || null]
        );
      }
    }

    // 8. Subjects
    if (pulledData.subjects?.length) {
      for (const sub of pulledData.subjects) {
        await client.query(
          `INSERT INTO subjects (id, school_id, department_id, name, code)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             code = EXCLUDED.code,
             department_id = EXCLUDED.department_id;`,
          [sub.id, sub.school_id, sub.department_id, sub.name, sub.code]
        );
      }
    }

    // 9. Class Subjects
    if (pulledData.classSubjects?.length) {
      for (const cs of pulledData.classSubjects) {
        await client.query(
          `INSERT INTO class_subjects (id, school_id, class_stream_id, subject_id, coefficient, max_marks, is_compulsory)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             coefficient = EXCLUDED.coefficient,
             max_marks = EXCLUDED.max_marks,
             is_compulsory = EXCLUDED.is_compulsory;`,
          [cs.id, cs.school_id, cs.class_stream_id, cs.subject_id, cs.coefficient || 2, cs.max_marks || 20, cs.is_compulsory ?? true]
        );
      }
    }

    // Extract unique references to ensure completeness if cloud endpoint sent partial schema
    const marks = pulledData.remoteMarks || [];
    const tas = pulledData.teacherAssignments || [];
    const students = pulledData.students || [];

    const termIds = new Set(marks.map((m: any) => m.term_id).filter(Boolean));
    const seqIds = new Set(marks.map((m: any) => m.sequence_id).filter(Boolean));
    const streamIds = new Set([
      ...marks.map((m: any) => m.class_stream_id),
      ...tas.map((t: any) => t.class_stream_id),
    ].filter(Boolean));
    const subjectIds = new Set([
      ...marks.map((m: any) => m.subject_id),
      ...tas.map((t: any) => t.subject_id),
    ].filter(Boolean));
    const teacherUserIds = new Set(tas.map((t: any) => t.teacher_user_id).filter(Boolean));

    // Fallback stubs for terms & sequences if not sent explicitly
    if (!pulledData.terms?.length && termIds.size > 0) {
      for (const tId of termIds) {
        await client.query(
          `INSERT INTO terms (id, school_id, academic_year_id, name, term_number, start_date, end_date)
           VALUES ($1, $2, $3, 'Term', 1, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '60 days')
           ON CONFLICT (id) DO NOTHING;`,
          [tId, schoolId, activeYearId]
        );
      }
    }

    if (!pulledData.sequences?.length && seqIds.size > 0) {
      const parentTermId = Array.from(termIds)[0] || null;
      let sNum = 1;
      for (const sId of seqIds) {
        await client.query(
          `INSERT INTO evaluation_sequences (id, school_id, term_id, sequence_number, name)
           VALUES ($1, $2, $3, $4, 'Evaluation Sequence')
           ON CONFLICT (id) DO NOTHING;`,
          [sId, schoolId, parentTermId, sNum++]
        );
      }
    }

    // Fallback stubs for classes & streams if not sent explicitly
    if (!pulledData.classStreams?.length && streamIds.size > 0) {
      const defaultClassId = "10000000-0000-0000-0000-000000000001";
      await client.query(
        `INSERT INTO classes (id, school_id, name, level_order, cycle)
         VALUES ($1, $2, 'General Secondary', 1, 'cycle_1')
         ON CONFLICT (id) DO NOTHING;`,
        [defaultClassId, schoolId]
      );
      for (const stId of streamIds) {
        await client.query(
          `INSERT INTO class_streams (id, school_id, class_id, academic_year_id, name)
           VALUES ($1, $2, $3, $4, 'Class Stream')
           ON CONFLICT (id) DO NOTHING;`,
          [stId, schoolId, defaultClassId, activeYearId]
        );
      }
    }

    // Fallback stubs for subjects if not sent explicitly
    if (!pulledData.subjects?.length && subjectIds.size > 0) {
      for (const subId of subjectIds) {
        await client.query(
          `INSERT INTO subjects (id, school_id, name, code)
           VALUES ($1, $2, 'Subject', 'SUB')
           ON CONFLICT (id) DO NOTHING;`,
          [subId, schoolId]
        );
      }
    }

    // 9b. System Roles
    if (pulledData.roles?.length) {
      for (const r of pulledData.roles) {
        await client.query(
          `INSERT INTO roles (id, code, name, description, is_system)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (code) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description;`,
          [r.id, r.code, r.name, r.description || null, Boolean(r.is_system)]
        );
      }
    }

    // 10. Staff Users / User Profiles
    if (pulledData.staffProfiles?.length) {
      for (const u of pulledData.staffProfiles) {
        const userEmail = u.email || `staff_${String(u.id).slice(0, 8)}@school.local`;
        await client.query(
          `INSERT INTO auth.users (id, email)
           VALUES ($1::uuid, $2)
           ON CONFLICT (id) DO NOTHING;`,
          [u.id, userEmail]
        );
        await client.query(
          `INSERT INTO user_profiles (id, full_name, email, phone)
           VALUES ($1::uuid, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
             full_name = EXCLUDED.full_name,
             email = EXCLUDED.email,
             phone = EXCLUDED.phone;`,
          [u.id, u.full_name || "Staff Member", userEmail, u.phone || null]
        );
      }
    } else if (pulledData.staffUsers?.length) {
      for (const u of pulledData.staffUsers) {
        await client.query(
          `INSERT INTO auth.users (id, email)
           VALUES ($1::uuid, $2)
           ON CONFLICT (id) DO NOTHING;`,
          [u.id, u.email]
        );
        await client.query(
          `INSERT INTO user_profiles (id, full_name, email)
           VALUES ($1::uuid, $2, $3)
           ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;`,
          [u.id, u.full_name || "Staff Member", u.email]
        );
      }
    }
    for (const uId of teacherUserIds) {
      const email = `staff_${String(uId).slice(0, 8)}@school.local`;
      await client.query(
        `INSERT INTO auth.users (id, email)
         VALUES ($1::uuid, $2)
         ON CONFLICT (id) DO NOTHING;`,
        [uId, email]
      );
      await client.query(
        `INSERT INTO user_profiles (id, full_name, email)
         VALUES ($1::uuid, 'Teacher Staff', $2)
         ON CONFLICT (id) DO NOTHING;`,
        [uId, email]
      );
    }

    // 10b. School Memberships (Teacher codes & access roles)
    if (pulledData.memberships?.length) {
      for (const m of pulledData.memberships) {
        await client.query(
          `INSERT INTO school_memberships (id, school_id, user_id, role_id, title, access_code, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             role_id = EXCLUDED.role_id,
             title = EXCLUDED.title,
             access_code = EXCLUDED.access_code,
             status = EXCLUDED.status;`,
          [m.id, m.school_id, m.user_id, m.role_id, m.title || null, m.access_code || null, m.status || "active"]
        );
      }
    }

    // 11. Students
    if (students.length) {
      for (const st of students) {
        await client.query(
          `INSERT INTO students (id, school_id, matricule, first_name, last_name, gender, date_of_birth, status, version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 1))
           ON CONFLICT (id) DO UPDATE SET
             matricule = EXCLUDED.matricule,
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             gender = EXCLUDED.gender,
             date_of_birth = EXCLUDED.date_of_birth,
             status = EXCLUDED.status,
             version = EXCLUDED.version;`,
          [
            st.id,
            st.school_id,
            st.matricule || null,
            st.first_name || "Student",
            st.last_name || "",
            st.gender || "M",
            st.date_of_birth || "2010-01-01",
            st.status || "active",
            st.version || 1,
          ]
        );
      }
    }

    // 12. Enrolments
    if (pulledData.enrolments?.length) {
      for (const e of pulledData.enrolments) {
        await client.query(
          `INSERT INTO enrolments (id, school_id, student_id, academic_year_id, class_stream_id, roll_number, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             class_stream_id = EXCLUDED.class_stream_id,
             status = EXCLUDED.status;`,
          [e.id, e.school_id, e.student_id, e.academic_year_id, e.class_stream_id, e.roll_number || null, e.status || "active"]
        );
      }
    } else if (students.length && activeYearId && streamIds.size > 0) {
      const primaryStreamId = Array.from(streamIds)[0];
      for (const st of students) {
        const markForStudent = marks.find((m: any) => m.student_id === st.id && m.class_stream_id);
        const stStream = markForStudent ? markForStudent.class_stream_id : primaryStreamId;
        await client.query(
          `INSERT INTO enrolments (school_id, student_id, academic_year_id, class_stream_id, status)
           VALUES ($1, $2, $3, $4, 'active')
           ON CONFLICT (academic_year_id, student_id) DO UPDATE SET
             class_stream_id = EXCLUDED.class_stream_id,
             status = 'active';`,
          [schoolId, st.id, activeYearId, stStream]
        );
      }
    }

    // 13. Teacher Assignments
    if (tas.length) {
      for (const ta of tas) {
        await client.query(
          `INSERT INTO teacher_assignments (id, school_id, academic_year_id, teacher_user_id, class_stream_id, subject_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING;`,
          [ta.id, ta.school_id, ta.academic_year_id, ta.teacher_user_id, ta.class_stream_id, ta.subject_id]
        );
      }
    }

    // 14. Remote Marks
    if (marks.length) {
      for (const rm of marks) {
        await client.query(
          `INSERT INTO assessment_marks (
             school_id, academic_year_id, term_id, sequence_id, class_stream_id, subject_id, student_id, score, max_marks, status, remarks, version
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, 1))
           ON CONFLICT (sequence_id, class_stream_id, subject_id, student_id) DO UPDATE SET
             score = EXCLUDED.score,
             max_marks = EXCLUDED.max_marks,
             status = EXCLUDED.status,
             remarks = EXCLUDED.remarks,
             version = EXCLUDED.version;`,
          [
            rm.school_id || schoolId,
            rm.academic_year_id,
            rm.term_id,
            rm.sequence_id,
            rm.class_stream_id,
            rm.subject_id,
            rm.student_id,
            rm.score,
            rm.max_marks || 20,
            rm.status || "present",
            rm.remarks || null,
            rm.version || 1,
          ]
        );
      }
    }

    // 15. Subject Competencies
    if (pulledData.subjectCompetencies?.length) {
      for (const sc of pulledData.subjectCompetencies) {
        await client.query(
          `INSERT INTO subject_competencies (id, school_id, subject_id, sequence_id, term_id, title, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             description = EXCLUDED.description;`,
          [sc.id, sc.school_id, sc.subject_id, sc.sequence_id || null, sc.term_id || null, sc.title, sc.description || null]
        );
      }
    }

    // 16. Term Results
    if (pulledData.termResults?.length) {
      for (const tr of pulledData.termResults) {
        await client.query(
          `INSERT INTO term_results (
             id, school_id, term_id, student_id, class_stream_id, total_weighted_marks, total_coefficients,
             term_average, rank, class_average, class_min_average, class_max_average, pass_rate,
             cba_competence_acquired, general_appreciation
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO UPDATE SET
             total_weighted_marks = EXCLUDED.total_weighted_marks,
             total_coefficients = EXCLUDED.total_coefficients,
             term_average = EXCLUDED.term_average,
             rank = EXCLUDED.rank,
             class_average = EXCLUDED.class_average,
             class_min_average = EXCLUDED.class_min_average,
             class_max_average = EXCLUDED.class_max_average,
             pass_rate = EXCLUDED.pass_rate,
             cba_competence_acquired = EXCLUDED.cba_competence_acquired,
             general_appreciation = EXCLUDED.general_appreciation;`,
          [
            tr.id,
            tr.school_id,
            tr.term_id,
            tr.student_id,
            tr.class_stream_id,
            tr.total_weighted_marks,
            tr.total_coefficients,
            tr.term_average,
            tr.rank,
            tr.class_average,
            tr.class_min_average,
            tr.class_max_average,
            tr.pass_rate,
            tr.cba_competence_acquired,
            tr.general_appreciation,
          ]
        );
      }
    }

    await client.query("SET session_replication_role = 'origin';");
    await client.query("COMMIT;");
  } catch (err) {
    try {
      await client.query("SET session_replication_role = 'origin';");
    } catch {}
    await client.query("ROLLBACK;");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Triggers bidirectional synchronization between the on-premise School Hub and the Central Cloud server.
 */
export async function executeHubCloudSync(): Promise<CloudSyncResult> {
  const config = getHubNodeConfig();
  if (!config || !config.nodeKey) {
    return {
      success: false,
      message: "School Hub is not registered. Please enter a valid Hub Node Key.",
      error: "MISSING_NODE_KEY",
    };
  }

  const cloudUrl =
    config.cloudSyncUrl ||
    process.env.CLOUD_SYNC_URL ||
    "https://nsei-sukul.klarifypath.com/api/v1/hub/sync";

  try {
    // 1. Collect pending local marks to push to central cloud
    let localMarksToPush: any[] = [];
    try {
      const pool = getLocalPgPool();
      const markRes = await pool.query(
        `SELECT academic_year_id, term_id, sequence_id, class_stream_id, subject_id, student_id, score, max_marks, status, remarks
         FROM public.assessment_marks
         WHERE school_id = $1
         LIMIT 1000;`,
        [config.schoolId]
      );
      localMarksToPush = markRes.rows.map((r: any) => ({
        academicYearId: r.academic_year_id,
        termId: r.term_id,
        sequenceId: r.sequence_id,
        classStreamId: r.class_stream_id,
        subjectId: r.subject_id,
        studentId: r.student_id,
        score: r.score !== null ? Number(r.score) : null,
        maxMarks: r.max_marks ? Number(r.max_marks) : 20,
        status: r.status || "present",
        remarks: r.remarks || null,
      }));
    } catch (e) {
      console.warn("[CloudSync] Could not read local marks to push:", e);
    }

    // 2. Collect durable outbox mutations
    const { getPendingOutboxBatch, markOutboxCommitted } = await import("./hub-outbox");
    let pendingMutations: any[] = [];
    try {
      pendingMutations = await getPendingOutboxBatch(200);
    } catch (e) {
      console.warn("[CloudSync] Could not read outbox mutations:", e);
    }

    const payload = {
      localIp: "127.0.0.1",
      lastPulledAt: config.lastSyncAt || null,
      pushData: {
        marks: localMarksToPush,
        payments: [],
        mutations: pendingMutations,
      },
    };

    const res = await fetch(cloudUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-key": config.nodeKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000), // 20 second timeout
    });

    if (!res.ok) {
      let errText = "Cloud sync failed";
      try {
        const errJson = await res.json();
        errText = errJson.error || errText;
      } catch {
        errText = `HTTP Error ${res.status}: ${res.statusText}`;
      }
      return {
        success: false,
        message: errText,
        error: errText,
      };
    }

    const data = await res.json();
    const nowIso = new Date().toISOString();

    // Mark pushed outbox mutations as committed
    if (pendingMutations.length > 0) {
      await markOutboxCommitted(pendingMutations.map((m) => m.id!)).catch(() => {});
    }

    // If cloud response returns school metadata, update local node config
    if (data.pulledData?.school) {
      const sch = data.pulledData.school;
      saveHubNodeConfig({
        schoolId: sch.id,
        schoolName: sch.name,
        schoolCode: sch.code || config.schoolCode,
        schoolSlug: sch.slug || config.schoolSlug,
        schoolLogoUrl: sch.logo_url || config.schoolLogoUrl,
        lastSyncAt: nowIso,
      });
    } else {
      saveHubNodeConfig({
        lastSyncAt: nowIso,
      });
    }

    // Upsert pulled data into local PostgreSQL database
    try {
      await upsertPulledDataToLocalDb(data.pulledData);
    } catch (pgErr) {
      console.warn("[CloudSync] Local PG cluster upsert notice:", pgErr);
      // Fallback to Supabase client if running in hybrid cloud mode
      try {
        const admin = createAdminClient();
        if (data.pulledData?.students?.length > 0) {
          await admin.from("students").upsert(data.pulledData.students, { onConflict: "id" });
        }
        if (data.pulledData?.academicYears?.length > 0) {
          await admin.from("academic_years").upsert(data.pulledData.academicYears, { onConflict: "id" });
        }
        if (data.pulledData?.teacherAssignments?.length > 0) {
          await admin.from("teacher_assignments").upsert(data.pulledData.teacherAssignments, { onConflict: "id" });
        }
        if (data.pulledData?.remoteMarks?.length > 0) {
          await admin.from("assessment_marks").upsert(data.pulledData.remoteMarks, {
            onConflict: "sequence_id,class_stream_id,subject_id,student_id",
          });
        }
      } catch (dbErr) {
        console.warn("[CloudSync] Supabase fallback notice:", dbErr);
      }
    }

    const countPulled =
      typeof data.itemsPulled === "number" && data.itemsPulled > 0
        ? data.itemsPulled
        : (data.pulledData?.students?.length || 0) +
          (data.pulledData?.academicYears?.length || 0) +
          (data.pulledData?.teacherAssignments?.length || 0) +
          (data.pulledData?.remoteMarks?.length || 0) +
          (data.pulledData?.classes?.length || 0) +
          (data.pulledData?.classStreams?.length || 0) +
          (data.pulledData?.subjects?.length || 0);

    return {
      success: true,
      message: `Sync successful. Pushed ${data.itemsPushed || 0} items, pulled ${countPulled} updates.`,
      itemsPushed: data.itemsPushed || 0,
      itemsPulled: countPulled,
      lastSyncAt: nowIso,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.name === "TimeoutError" ? "Cloud server did not respond (network timeout)." : (err.message || "Failed to reach cloud server."),
      error: err.name || "NETWORK_ERROR",
    };
  }
}
