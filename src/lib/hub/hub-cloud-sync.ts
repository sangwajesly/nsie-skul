import { getHubNodeConfig, saveHubNodeConfig, HubNodeConfig } from "./hub-node-store";
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
      signal: AbortSignal.timeout(15000), // 15 second timeout
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

    // Upsert pulled data into local database if Supabase admin client is connected locally
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
      console.warn("[CloudSync] Local DB cache upsert notice:", dbErr);
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
