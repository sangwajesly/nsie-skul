"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/tenancy/context";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { SchoolHubNode } from "@/lib/hub/hub-service";

/**
 * Generates and registers a new Hub node key for the school.
 * Used when setting up the Principal's PC or a dedicated mini-PC.
 */
export async function registerNewHubNodeAction(formData: FormData) {
  const context = await requirePermission("school.manage_settings");
  if (!context?.school?.id) {
    return { error: "Unauthorized. Administrator privileges required." };
  }

  const hubName = (formData.get("hubName") as string) || "Main Campus LAN Server";
  const nodeKey = `hub_${context.school.code ? context.school.code.toLowerCase() : "nsei"}_${crypto.randomBytes(16).toString("hex")}`;
  const hardwareId = crypto.randomBytes(12).toString("hex");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("school_hubs")
    .insert({
      school_id: context.school.id,
      hub_name: hubName,
      node_key: nodeKey,
      hardware_id: hardwareId,
      local_ip: null,
      port: 3000,
      status: "active",
      lease_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message || "Failed to register new School Hub node." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true, hub: data as SchoolHubNode, nodeKey };
}

/**
 * Revokes an existing Hub node (e.g. if a computer was lost or replaced).
 */
export async function revokeHubNodeAction(formData: FormData) {
  const context = await requirePermission("school.manage_settings");
  if (!context?.school?.id) {
    return { error: "Unauthorized." };
  }

  const hubId = formData.get("hubId") as string;
  if (!hubId) return { error: "Hub ID is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("school_hubs")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", hubId)
    .eq("school_id", context.school.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
