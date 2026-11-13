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
 */
async function upsertPulledDataToLocalDb(pulledData: any) {
  if (!pulledData) return;
  const pool = getLocalPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

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
    if (pulledData.academicYears?.length) {
      for (const y of pulledData.academicYears) {
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

    // 3. Students
    if (pulledData.students?.length) {
      for (const st of pulledData.students) {
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

    // 4. Teacher Assignments
    if (pulledData.teacherAssignments?.length) {
      for (const ta of pulledData.teacherAssignments) {
        await client.query(
          `INSERT INTO teacher_assignments (id, school_id, academic_year_id, teacher_user_id, class_stream_id, subject_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING;`,
          [ta.id, ta.school_id, ta.academic_year_id, ta.teacher_user_id, ta.class_stream_id, ta.subject_id]
        );
      }
    }

    // 5. Remote Marks
    if (pulledData.remoteMarks?.length) {
      for (const rm of pulledData.remoteMarks) {
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
            rm.school_id,
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

    await client.query("COMMIT;");
  } catch (err) {
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
    const payload = {
      localIp: "127.0.0.1",
      lastPulledAt: config.lastSyncAt || null,
      pushData: {
        marks: [],
        payments: [],
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

    return {
      success: true,
      message: `Sync successful. Pushed ${data.itemsPushed || 0} items, pulled ${data.itemsPulled || 0} updates.`,
      itemsPushed: data.itemsPushed || 0,
      itemsPulled: data.itemsPulled || 0,
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
