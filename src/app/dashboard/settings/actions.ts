"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/tenancy/context";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AddStaffSchema = z.object({
  email: z.email("Enter a valid email address."),
  roleId: z.uuid("Choose a valid staff role."),
  title: z.string().max(100, "Job title must be 100 characters or fewer."),
});

const UpdateStaffRoleSchema = z.object({
  membershipId: z.uuid("Choose a valid staff member."),
  roleId: z.uuid("Choose a valid school role."),
  title: z.string().max(100, "Job title must be 100 characters or fewer."),
});

export async function addStaffMemberAction(formData: FormData) {
  const context = await requirePermission("staff.manage");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const roleId = String(formData.get("roleId") || "");
  const title = String(formData.get("title") || "").trim();
  const validation = AddStaffSchema.safeParse({ email, roleId, title });

  if (!validation.success) {
    throw new Error(validation.error.issues[0]?.message || "Check the staff details and try again.");
  }

  const supabase = await createClient();
  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id, code")
    .eq("id", roleId)
    .maybeSingle();

  if (roleError || !role || role.code === "superadmin") {
    throw new Error("Choose a valid school staff role.");
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("user_profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    throw new Error("Could not check that account. Please try again.");
  }

  if (!profile) {
    throw new Error("No account uses that email yet. Ask the staff member to register first.");
  }

  const { data: existingMembership, error: membershipLookupError } = await supabase
    .from("school_memberships")
    .select("id, status")
    .eq("school_id", context.school.id)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (membershipLookupError) {
    throw new Error("Could not check the school staff list. Please try again.");
  }

  if (existingMembership) {
    throw new Error(
      existingMembership.status === "suspended"
        ? "This person is already on the staff list with access suspended. Review their existing account instead."
        : "This person is already on the school staff list."
    );
  }

  const { data: membership, error: insertError } = await supabase
    .from("school_memberships")
    .insert({
      school_id: context.school.id,
      user_id: profile.id,
      role_id: role.id,
      title: title || null,
      status: "active",
    })
    .select("id")
    .single();

  if (insertError || !membership) {
    throw new Error(insertError?.message || "Could not add this staff member.");
  }

  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: "ADD_STAFF_MEMBER",
    resource_type: "school_membership",
    resource_id: membership.id,
    details: { email, role_id: role.id, title: title || null },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}

export async function updateSchoolSettingsAction(formData: FormData) {
  const context = await requirePermission("school.settings.manage");

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
  const logo_url = (formData.get("logo_url") as string) || null;

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
      logo_url,
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
      has_logo: Boolean(logo_url),
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/academics/report-cards");
  revalidatePath("/dashboard/finance");
}

export async function updateStaffRoleAction(formData: FormData) {
  const context = await requirePermission("staff.manage");
  const validation = UpdateStaffRoleSchema.safeParse({
    membershipId: formData.get("membership_id"),
    roleId: formData.get("role_id"),
    title: String(formData.get("title") || ""),
  });

  if (!validation.success) {
    throw new Error(validation.error.issues[0]?.message || "Check the staff details and try again.");
  }

  const supabase = await createClient();
  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id, code")
    .eq("id", validation.data.roleId)
    .maybeSingle();

  if (roleError || !role || role.code === "superadmin") {
    throw new Error("Choose a valid school staff role.");
  }

  const { data: membership, error } = await supabase
    .from("school_memberships")
    .update({
      role_id: role.id,
      title: validation.data.title || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", validation.data.membershipId)
    .eq("school_id", context.school.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!membership) {
    throw new Error("That staff member could not be found in this school.");
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: "UPDATE_STAFF_ROLE",
    resource_type: "school_membership",
    resource_id: membership.id,
    details: { role_id: role.id, title: validation.data.title || null },
  });

  revalidatePath("/dashboard/settings");
}

export async function toggleStaffStatusAction(formData: FormData) {
  const context = await requirePermission("staff.manage");
  const membershipId = String(formData.get("membershipId") || "");
  const newStatus = String(formData.get("status") || "");

  if (!membershipId || !["active", "suspended"].includes(newStatus)) {
    throw new Error("Invalid staff status update request.");
  }

  const supabase = await createClient();
  const { data: membership, error: fetchErr } = await supabase
    .from("school_memberships")
    .select("id, user_id, status")
    .eq("id", membershipId)
    .eq("school_id", context.school.id)
    .maybeSingle();

  if (fetchErr || !membership) {
    throw new Error("Staff member not found in this school.");
  }

  if (membership.user_id === context.user.id) {
    throw new Error("You cannot change the status of your own account.");
  }

  const { error: updateErr } = await supabase
    .from("school_memberships")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membershipId)
    .eq("school_id", context.school.id);

  if (updateErr) {
    throw new Error(updateErr.message);
  }

  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: newStatus === "suspended" ? "SUSPEND_STAFF" : "REACTIVATE_STAFF",
    resource_type: "school_membership",
    resource_id: membershipId,
    details: { previous_status: membership.status, new_status: newStatus },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}

export async function removeStaffMembershipAction(formData: FormData) {
  const context = await requirePermission("staff.manage");
  const membershipId = String(formData.get("membershipId") || "");

  if (!membershipId) {
    throw new Error("Invalid staff removal request.");
  }

  const supabase = await createClient();
  const { data: membership, error: fetchErr } = await supabase
    .from("school_memberships")
    .select("id, user_id, title")
    .eq("id", membershipId)
    .eq("school_id", context.school.id)
    .maybeSingle();

  if (fetchErr || !membership) {
    throw new Error("Staff member not found in this school.");
  }

  if (membership.user_id === context.user.id) {
    throw new Error("You cannot remove your own school administrator account.");
  }

  const targetUserId = membership.user_id;

  // 1. Unassign class master duties
  await supabase
    .from("class_streams")
    .update({ class_master_id: null, updated_at: new Date().toISOString() })
    .eq("school_id", context.school.id)
    .eq("class_master_id", targetUserId);

  // 2. Unassign teacher subject allocations
  await supabase
    .from("teacher_assignments")
    .delete()
    .eq("school_id", context.school.id)
    .eq("teacher_user_id", targetUserId);

  // 3. Revoke HOD assignments
  await supabase
    .from("hod_assignments")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("school_id", context.school.id)
    .eq("hod_user_id", targetUserId);

  // 4. Attempt to delete membership; if foreign keys or audit trail exist, suspend access instead
  const { error: deleteErr } = await supabase
    .from("school_memberships")
    .delete()
    .eq("id", membershipId)
    .eq("school_id", context.school.id);

  if (deleteErr) {
    // Soft deactivation fallback to protect historical marks/payments
    await supabase
      .from("school_memberships")
      .update({
        status: "suspended",
        title: membership.title ? `${membership.title} (Former)` : "Former Staff",
        updated_at: new Date().toISOString(),
      })
      .eq("id", membershipId);
  }

  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: "REMOVE_STAFF_MEMBER",
    resource_type: "school_membership",
    resource_id: membershipId,
    details: { removed_user_id: targetUserId },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard");
}
