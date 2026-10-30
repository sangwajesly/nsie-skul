"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenancy/context";

/**
 * Registers the current browser/PC as a school device and returns its short,
 * school-unique code (D1, D2, ...). The code is embedded in receipt numbers
 * generated offline so two devices can never issue the same number.
 *
 * Idempotent per device: pass the previously stored deviceId to just refresh
 * last_seen_at and get the same code back.
 */
export async function registerSchoolDeviceAction(input: { deviceId?: string | null; label?: string | null }) {
  const context = await getTenantContext();
  if (!context?.school?.id || !context.user?.id) {
    return { error: "Authentication required." };
  }

  const supabase = await createClient();
  const schoolId = context.school.id;

  if (input.deviceId) {
    const { data: existing } = await supabase
      .from("school_devices")
      .select("id, device_code")
      .eq("school_id", schoolId)
      .eq("id", input.deviceId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("school_devices")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", existing.id);
      return { deviceId: existing.id as string, deviceCode: existing.device_code as string, schoolId };
    }
  }

  // Allocate the next free code. Retry if two devices register at the same time.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { count, error: countError } = await supabase
      .from("school_devices")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId);

    if (countError) {
      return { error: "Offline device registry is not available yet. Apply migration 00014." };
    }

    const deviceCode = `D${(count || 0) + 1 + attempt}`;
    const { data, error } = await supabase
      .from("school_devices")
      .insert({
        school_id: schoolId,
        device_code: deviceCode,
        label: input.label?.slice(0, 80) || null,
        registered_by: context.user.id,
      })
      .select("id, device_code")
      .single();

    if (data) {
      return { deviceId: data.id as string, deviceCode: data.device_code as string, schoolId };
    }
    if (error?.code !== "23505") {
      return { error: error?.message || "Could not register this device." };
    }
  }

  return { error: "Could not allocate a device code. Please try again." };
}
