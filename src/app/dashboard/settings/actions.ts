"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenantContext } from "@/lib/tenancy/context";
import { revalidatePath } from "next/cache";

export async function updateSchoolSettingsAction(formData: FormData) {
  const context = await getTenantContext();
  if (!context) throw new Error("Unauthorized");

  const schoolId = context.school.id;
  const name = formData.get("name") as string;
  const motto = (formData.get("motto") as string) || null;
  const code = (formData.get("code") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;
  const address = (formData.get("address") as string) || null;
  const ranking_mode = (formData.get("ranking_mode") as string) || "enabled";
  const result_approval_workflow = (formData.get("result_approval_workflow") as string) || "hod";
  const receipt_prefix = (formData.get("receipt_prefix") as string) || "REC";

  const supabase = await createClient();

  const { error } = await supabase
    .from("schools")
    .update({
      name,
      motto,
      code,
      phone,
      email,
      address,
      ranking_mode,
      result_approval_workflow,
      receipt_prefix,
      updated_at: new Date().toISOString(),
    })
    .eq("id", schoolId);

  if (error) {
    throw new Error(error.message);
  }

  // Record audit log
  await supabase.from("audit_logs").insert({
    school_id: schoolId,
    user_id: context.user.id,
    action: "UPDATE_SCHOOL_SETTINGS",
    resource_type: "school",
    resource_id: schoolId,
    details: {
      name,
      ranking_mode,
      result_approval_workflow,
      receipt_prefix,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/academics/report-cards");
}

export async function updateStaffRoleAction(formData: FormData) {
  const context = await getTenantContext();
  if (!context) throw new Error("Unauthorized");

  const membershipId = formData.get("membership_id") as string;
  const roleId = formData.get("role_id") as string;
  const title = (formData.get("title") as string) || null;

  const supabase = await createClient();

  const { error } = await supabase
    .from("school_memberships")
    .update({
      role_id: roleId,
      title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membershipId)
    .eq("school_id", context.school.id);

  if (error) {
    throw new Error(error.message);
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: "UPDATE_STAFF_ROLE",
    resource_type: "school_membership",
    resource_id: membershipId,
    details: { role_id: roleId, title },
  });

  revalidatePath("/dashboard/settings");
}
