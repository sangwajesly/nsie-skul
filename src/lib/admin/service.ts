import { createClient } from "@/lib/supabase/server";
import { School, Role, SchoolMembership, AuditLog } from "@/types/database";

export interface SchoolSettingsUpdate {
  name: string;
  motto?: string | null;
  code?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  ranking_mode: "enabled" | "disabled";
  result_approval_workflow: "hod" | "principal";
  receipt_prefix: string;
}

/**
 * Get active school metadata and settings
 */
export async function getSchoolSettings(schoolId: string): Promise<School | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("id", schoolId)
      .maybeSingle();

    if (!error && data) return data as School;
  } catch (err) {
    console.warn("[AdminService] Cloud school settings query notice:", err);
  }

  // Fallback to local PostgreSQL cluster
  try {
    const { queryLocalDb } = await import("@/lib/db/local-postgres");
    const res = await queryLocalDb<School>("SELECT * FROM schools WHERE id = $1 LIMIT 1;", [schoolId]);
    if (res.rows.length > 0) return res.rows[0];
  } catch {}

  return null;
}

/**
 * Get all staff memberships in the school
 */
export async function getSchoolStaffMemberships(schoolId: string): Promise<SchoolMembership[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("school_memberships")
      .select(`
        *,
        user:user_profiles (*),
        role:roles (*)
      `)
      .eq("school_id", schoolId)
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      const staffOnly = (data as any[]).filter((m) => m.role?.code !== "superadmin");
      return staffOnly as unknown as SchoolMembership[];
    }
  } catch (err) {
    console.warn("[AdminService] Cloud staff memberships query notice:", err);
  }

  // Fallback to local PostgreSQL cluster
  try {
    const { queryLocalDb } = await import("@/lib/db/local-postgres");
    const res = await queryLocalDb(
      `SELECT m.*, 
              row_to_json(u) as user, 
              row_to_json(r) as role
       FROM school_memberships m
       LEFT JOIN user_profiles u ON u.id = m.user_id
       LEFT JOIN roles r ON r.id = m.role_id
       WHERE m.school_id = $1 AND COALESCE(r.code, '') != 'superadmin'
       ORDER BY m.created_at ASC;`,
      [schoolId]
    );
    if (res.rows.length > 0) {
      return res.rows as unknown as SchoolMembership[];
    }
  } catch {}

  return [];
}

/**
 * Get available roles in the system
 */
export async function getSystemRoles(): Promise<Role[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("roles")
      .select("*")
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) return data as Role[];
  } catch (err) {
    console.warn("[AdminService] Cloud system roles query notice:", err);
  }

  // Fallback to local PostgreSQL cluster
  try {
    const { queryLocalDb } = await import("@/lib/db/local-postgres");
    const res = await queryLocalDb<Role>("SELECT * FROM roles ORDER BY name ASC;");
    if (res.rows.length > 0) return res.rows;
  } catch {}

  return [];
}

/**
 * Retrieve immutable audit logs for the school
 */
export async function getSchoolAuditLogs(
  schoolId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data) return data as AuditLog[];
  } catch {}

  return [];
}

/**
 * Write an immutable audit log entry
 */
export async function logAuditEvent(
  schoolId: string,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId?: string | null,
  details: Record<string, unknown> = {}
) {
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    school_id: schoolId,
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId ?? null,
    details: {
      ...details,
      _system: {
        version: "1.0.0-rc.1",
        api: "v1",
      },
    },
  });
}
