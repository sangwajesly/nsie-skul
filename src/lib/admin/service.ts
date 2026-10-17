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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("id", schoolId)
    .single();

  if (error || !data) return null;
  return data as School;
}

/**
 * Get all staff memberships in the school
 */
export async function getSchoolStaffMemberships(schoolId: string): Promise<SchoolMembership[]> {
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

  if (error || !data) return [];
  return data as unknown as SchoolMembership[];
}

/**
 * Get available roles in the system
 */
export async function getSystemRoles(): Promise<Role[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data as Role[];
}

/**
 * Retrieve immutable audit logs for the school
 */
export async function getSchoolAuditLogs(
  schoolId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as AuditLog[];
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
