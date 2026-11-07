"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/tenancy/context";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { initiateFapshiPayment, getFapshiPaymentStatus } from "@/lib/payments/fapshi";
import { normalizePinForAuth } from "@/lib/auth/pin-utils";

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

export type RegisteredTeacherResult =
  | {
      success: true;
      teacherName: string;
      phone: string;
      accessCode: string;
      pin: string;
      isExistingUser: boolean;
      schoolName: string;
      schoolCode: string;
    }
  | {
      success: false;
      error: string;
    };

export async function registerTeacherWithCodeAction(formData: FormData): Promise<RegisteredTeacherResult> {
  try {
    const context = await requirePermission("staff.manage");
    const fullName = String(formData.get("fullName") || "").trim();
    const phoneInput = String(formData.get("phone") || "").trim();
    const roleId = String(formData.get("roleId") || "");
    const title = String(formData.get("title") || "").trim();
    let accessCode = String(formData.get("accessCode") || "").trim().toUpperCase();
    let pin = String(formData.get("pin") || "").trim();

    if (!fullName || fullName.length < 2) {
      return { success: false, error: "Please enter the teacher's full name (at least 2 letters)." };
    }

    // Normalize Cameroon phone number intelligently:
    // Handles: "+237 677 12 34 56", "+237677123456", "00237 677123456", "237677123456", "0677123456", "677 12 34 56", etc.
    let cleanDigits = phoneInput.replace(/\D/g, "");

    // Strip international prefix: 00237 or 237
    if (cleanDigits.startsWith("00237")) {
      cleanDigits = cleanDigits.slice(5);
    } else if (cleanDigits.startsWith("237") && cleanDigits.length > 9) {
      cleanDigits = cleanDigits.slice(3);
    }

    // Also handle accidental double 237 (e.g. +237 237 682833601)
    if (cleanDigits.startsWith("237") && cleanDigits.length > 9) {
      cleanDigits = cleanDigits.slice(3);
    }

    // Strip leading zero if 10 digits (e.g. 0677123456 -> 677123456)
    if (cleanDigits.startsWith("0") && cleanDigits.length === 10) {
      cleanDigits = cleanDigits.slice(1);
    }

    if (cleanDigits.length !== 9) {
      return {
        success: false,
        error: `Please enter a valid 9-digit Cameroon phone number. You entered ${cleanDigits.length} digit${cleanDigits.length === 1 ? "" : "s"}. Example: 677 12 34 56 or +237 677 12 34 56.`,
      };
    }

    // Validate Cameroon mobile prefix (mobile starts with 6, fixed with 2)
    if (!cleanDigits.startsWith("6") && !cleanDigits.startsWith("2")) {
      return {
        success: false,
        error: "Cameroon mobile numbers start with 6 (e.g. 677 12 34 56 or 699 00 11 22). Please verify the phone number.",
      };
    }

    const supabase = await createClient();
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id, code, name")
      .eq("id", roleId)
      .maybeSingle();

    if (roleError || !role || role.code === "superadmin") {
      return { success: false, error: "Choose a valid school staff role." };
    }

    const admin = createAdminClient();
    const schoolCode = (context.school.code || context.school.slug.toUpperCase().slice(0, 4) || "SCH").trim();

    // Auto-generate unpredictable 3-digit teacher code (e.g. GBHS-482)
    // Prevents students from guessing sequential numbers (01, 02, 03)
    if (!accessCode) {
      let uniqueFound = false;
      let candidate = "";
      let attempts = 0;

      while (!uniqueFound && attempts < 10) {
        attempts++;
        const randomDigits = Math.floor(100 + Math.random() * 900);
        candidate = `${schoolCode}-${randomDigits}`;

        const { data: existing } = await supabase
          .from("school_memberships")
          .select("id")
          .eq("school_id", context.school.id)
          .eq("access_code", candidate)
          .maybeSingle();

        if (!existing) {
          uniqueFound = true;
          accessCode = candidate;
        }
      }

      if (!accessCode) {
        accessCode = `${schoolCode}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (!accessCode.includes("-") && !accessCode.startsWith(schoolCode)) {
      // Prefix school code if admin typed just a number (e.g. "482" -> "GBHS-482")
      accessCode = `${schoolCode}-${accessCode}`;
    }

    // Handle initial PIN (supports 4 to 6 digits)
    const rawPin = pin ? pin.trim() : "";
    let effectivePin = rawPin;
    if (!effectivePin) {
      effectivePin = "123456";
    } else if (effectivePin.length < 4) {
      return { success: false, error: "PIN must be at least 4 digits." };
    } else if (effectivePin.length > 6) {
      return { success: false, error: "PIN must be 6 digits or fewer." };
    } else if (!/^\d+$/.test(effectivePin)) {
      return { success: false, error: "PIN must contain only numbers (0 to 9)." };
    }

    const authPassword = normalizePinForAuth(effectivePin);

    // 1. Check if user already exists with this phone number
    const { data: existingProfile } = await admin
      .from("user_profiles")
      .select("id, full_name, email, phone")
      .or(`phone.eq.${cleanDigits},phone.eq.+237${cleanDigits},email.eq.teacher_${cleanDigits}@staff.nseisukul.internal`)
      .maybeSingle();

    let userId: string;
    let isExistingUser = false;

    if (existingProfile) {
      userId = existingProfile.id;
      isExistingUser = true;

      // Check if already in this school
      const { data: existingMembership } = await supabase
        .from("school_memberships")
        .select("id, status, access_code")
        .eq("school_id", context.school.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingMembership) {
        return {
          success: false,
          error: `This teacher (+237 ${cleanDigits}) is already registered in this school with access code ${existingMembership.access_code || "assigned"}.`,
        };
      }

      // If the administrator inputted a name, update user profile & auth metadata so it reflects the correct teacher name
      if (fullName && fullName.length >= 2) {
        await admin
          .from("user_profiles")
          .update({ full_name: fullName, phone: cleanDigits })
          .eq("id", userId);

        await admin.auth.admin.updateUserById(userId, {
          user_metadata: { full_name: fullName, phone: cleanDigits },
        });
      }
    } else {
      // Create new Supabase Auth user
      const syntheticEmail = `teacher_${cleanDigits}@staff.nseisukul.internal`;
      const { data: newAuth, error: authError } = await admin.auth.admin.createUser({
        email: syntheticEmail,
        password: authPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone: cleanDigits,
          created_by_school: context.school.id,
          needs_pin_setup: !rawPin || effectivePin === "123456",
        },
      });

      if (authError || !newAuth.user) {
        return { success: false, error: authError?.message || "Could not create teacher credentials." };
      }

      userId = newAuth.user.id;

      // Upsert user_profile row with the teacher's name and phone
      const { error: profileError } = await admin
        .from("user_profiles")
        .upsert({
          id: userId,
          full_name: fullName,
          email: syntheticEmail,
          phone: cleanDigits,
        });

      if (profileError) {
        return { success: false, error: "Could not initialize teacher profile." };
      }
    }

    // Insert school membership with access code
    const { data: membership, error: membershipError } = await supabase
      .from("school_memberships")
      .insert({
        school_id: context.school.id,
        user_id: userId,
        role_id: role.id,
        title: title || role.name || "Teacher",
        access_code: accessCode,
        status: "active",
      })
      .select("id")
      .single();

    if (membershipError) {
      if (membershipError.message?.includes("idx_school_memberships_access_code") || membershipError.message?.includes("unique")) {
        return {
          success: false,
          error: `Access code ${accessCode} is already used by another teacher in this school. Please choose a different code or leave blank to auto-generate.`,
        };
      }
      return { success: false, error: membershipError.message || "Failed to link teacher to school." };
    }

    const resolvedName = (fullName && fullName.length >= 2) ? fullName : (existingProfile?.full_name || "Teacher");

    await supabase.from("audit_logs").insert({
      school_id: context.school.id,
      user_id: context.user.id,
      action: "REGISTER_STAFF_WITH_CODE",
      resource_type: "school_membership",
      resource_id: membership.id,
      details: {
        fullName: resolvedName,
        phone: cleanDigits,
        access_code: accessCode,
        role_id: role.id,
        title: title || null,
        isExistingUser,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return {
      success: true,
      teacherName: resolvedName,
      phone: cleanDigits,
      accessCode,
      pin: isExistingUser ? "(Teacher's existing PIN)" : effectivePin,
      isExistingUser,
      schoolName: context.school.name,
      schoolCode,
    };
  } catch (err: any) {
    console.error("[registerTeacherWithCodeAction] Error:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while registering the teacher.",
    };
  }
}

export async function addStaffMemberAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requirePermission("staff.manage");
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const roleId = String(formData.get("roleId") || "");
    const title = String(formData.get("title") || "").trim();
    const validation = AddStaffSchema.safeParse({ email, roleId, title });

    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Check the staff details and try again." };
    }

    const supabase = await createClient();
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id, code")
      .eq("id", roleId)
      .maybeSingle();

    if (roleError || !role || role.code === "superadmin") {
      return { success: false, error: "Choose a valid school staff role." };
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("user_profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    let targetUserId: string;

    if (profile) {
      targetUserId = profile.id;
    } else {
      // Automatically provision user account in Supabase Auth if not yet registered
      const tempPassword = `Sukul@${Math.floor(100000 + Math.random() * 900000)}`;
      const { data: newAuth, error: authError } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: title || email.split("@")[0],
          created_by_school: context.school.id,
        },
      });

      if (newAuth?.user) {
        targetUserId = newAuth.user.id;
        await admin.from("user_profiles").upsert({
          id: targetUserId,
          full_name: title || email.split("@")[0],
          email,
        });
      } else {
        // User might already be registered in auth
        const { data: userList } = await admin.auth.admin.listUsers();
        const matched = userList?.users?.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (matched) {
          targetUserId = matched.id;
          await admin.from("user_profiles").upsert({
            id: targetUserId,
            full_name: title || email.split("@")[0],
            email,
          });
        } else {
          return {
            success: false,
            error: authError?.message || "Could not register staff email. Please check the address.",
          };
        }
      }
    }

    const { data: existingMembership, error: membershipLookupError } = await supabase
      .from("school_memberships")
      .select("id, status")
      .eq("school_id", context.school.id)
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (membershipLookupError) {
      return { success: false, error: "Could not check the school staff list. Please try again." };
    }

    if (existingMembership) {
      return {
        success: false,
        error:
          existingMembership.status === "suspended"
            ? "This person is already on the staff list with access suspended. Review their existing account instead."
            : "This person is already on the school staff list.",
      };
    }

    const { data: membership, error: insertError } = await supabase
      .from("school_memberships")
      .insert({
        school_id: context.school.id,
        user_id: targetUserId,
        role_id: role.id,
        title: title || null,
        status: "active",
      })
      .select("id")
      .single();

    if (insertError || !membership) {
      return { success: false, error: insertError?.message || "Could not add this staff member." };
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

    return { success: true };
  } catch (err: any) {
    console.error("[addStaffMemberAction] Error:", err);
    return {
      success: false,
      error: err?.message || "Could not add this staff member.",
    };
  }
}

export async function updateSchoolSettingsAction(formData: FormData) {
  const context = await requirePermission("school.settings.manage");

  if (context.school.slug === "demo-bilingual-high-school") {
    return;
  }

  const schoolId = context.school.id;
  const name = (formData.get("name") as string)?.trim();
  const motto = (formData.get("motto") as string) || null;
  let code = (formData.get("code") as string)?.trim().toUpperCase() || null;
  const phone = (formData.get("phone") as string) || null;
  const email = (formData.get("email") as string) || null;
  const address = (formData.get("address") as string) || null;
  const ranking_mode = (formData.get("ranking_mode") as string) || "enabled";
  const result_approval_workflow = (formData.get("result_approval_workflow") as string) || "hod";
  let receipt_prefix = ((formData.get("receipt_prefix") as string) || "").trim();
  const matricule_format = (formData.get("matricule_format") as string)?.trim() || "{CODE}-{YEAR}-{SEQ:4}";
  const report_card_template = (formData.get("report_card_template") as string) || "cba_grouped_classic";
  const logo_url = (formData.get("logo_url") as string) || null;

  // Auto-derive code if left blank
  if (!code && name) {
    const words = name.split(/\s+/).filter(Boolean);
    code = words.map((w: string) => w[0]?.toUpperCase()).filter(Boolean).join("").slice(0, 6) || "SCH";
  }

  if (!receipt_prefix) {
    receipt_prefix = `${code || "REC"}-REC`;
  }

  const supabase = await createClient();

  // Fetch current school to detect acronym/code changes
  const { data: currentSchool } = await supabase
    .from("schools")
    .select("code, name, receipt_prefix")
    .eq("id", schoolId)
    .single();

  const oldCode = currentSchool?.code?.trim().toUpperCase();

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
      matricule_format,
      report_card_template,
      logo_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", schoolId);

  if (error) {
    throw new Error(error.message);
  }

  // If school abbreviation/code changed or was set, cascade update all student matricules that carried the old prefix
  if (code && (code !== oldCode || !oldCode)) {
    const { data: studentsToUpdate } = await supabase
      .from("students")
      .select("id, matricule")
      .eq("school_id", schoolId);

    if (studentsToUpdate && studentsToUpdate.length > 0) {
      for (const st of studentsToUpdate) {
        if (!st.matricule) continue;
        // Standard Cameroon pattern: [PREFIX]-[YEAR]-[NUM] or [PREFIX]-[NUM]
        const suffixMatch = st.matricule.match(/-(\d{2,4}-\d+|\d{3,6})$/);
        if (suffixMatch) {
          const currentPrefix = st.matricule.slice(0, st.matricule.length - suffixMatch[0].length);
          if (currentPrefix !== code) {
            const newMat = `${code}${suffixMatch[0]}`;
            await supabase
              .from("students")
              .update({ matricule: newMat })
              .eq("id", st.id);
          }
        } else if (oldCode && st.matricule.startsWith(`${oldCode}-`)) {
          const newMat = `${code}-${st.matricule.slice(oldCode.length + 1)}`;
          await supabase
            .from("students")
            .update({ matricule: newMat })
            .eq("id", st.id);
        }
      }
    }
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
      code,
      old_code: oldCode,
      ranking_mode,
      result_approval_workflow,
      receipt_prefix,
      has_logo: Boolean(logo_url),
    },
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/academics/report-cards");
  revalidatePath("/dashboard/academics");
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/finance");
  revalidatePath("/select-school");
}

export async function setSchoolReportCardTemplateAction(formData: FormData) {
  const context = await requirePermission("school.settings.manage");
  const schoolId = context.school.id;
  const report_card_template = (formData.get("report_card_template") as string) || "cba_grouped_classic";

  const supabase = await createClient();
  const { error } = await supabase
    .from("schools")
    .update({
      report_card_template,
      updated_at: new Date().toISOString(),
    })
    .eq("id", schoolId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("audit_logs").insert({
    school_id: schoolId,
    user_id: context.user.id,
    action: "UPDATE_REPORT_CARD_TEMPLATE",
    resource_type: "school",
    resource_id: schoolId,
    details: { report_card_template },
  });

  revalidatePath("/dashboard/academics/report-cards");
  revalidatePath("/dashboard/settings");
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

  if (context.school.slug === "demo-bilingual-high-school") {
    throw new Error("Demo Campus staff accounts are protected. You can add new staff members freely!");
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

export async function updateStaffMemberAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await requirePermission("staff.manage");
    const membershipId = String(formData.get("membershipId") || "").trim();
    const fullName = String(formData.get("fullName") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const roleId = String(formData.get("roleId") || "").trim();

    if (!membershipId) {
      return { success: false, error: "Missing staff membership identifier." };
    }

    const admin = createAdminClient();
    const { data: membership, error: memError } = await admin
      .from("school_memberships")
      .select("id, user_id, school_id")
      .eq("id", membershipId)
      .eq("school_id", context.school.id)
      .maybeSingle();

    if (memError || !membership) {
      return { success: false, error: "Staff member not found in this school." };
    }

    // 1. Update membership title and role if provided
    const updatePayload: Record<string, any> = {};
    if (title !== undefined) updatePayload.title = title || null;
    if (roleId) updatePayload.role_id = roleId;

    if (Object.keys(updatePayload).length > 0) {
      await admin
        .from("school_memberships")
        .update(updatePayload)
        .eq("id", membership.id);
    }

    // 2. Update user profile and auth metadata full_name if provided
    if (fullName && fullName.length >= 2) {
      await admin
        .from("user_profiles")
        .update({ full_name: fullName })
        .eq("id", membership.user_id);

      await admin.auth.admin.updateUserById(membership.user_id, {
        user_metadata: { full_name: fullName },
      });
    }

    await admin.from("audit_logs").insert({
      school_id: context.school.id,
      user_id: context.user.id,
      action: "UPDATE_STAFF_MEMBER",
      resource_type: "school_membership",
      resource_id: membershipId,
      details: { fullName, title, roleId },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/academics");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: any) {
    console.error("[updateStaffMemberAction] Error:", err);
    return { success: false, error: err?.message || "Failed to update staff member." };
  }
}

/**
 * Initiates an automated Mobile Money payment (MTN MoMo or Orange Money via Fapshi)
 * for a school's annual software license.
 */
export async function initiateSchoolLicensePaymentAction(plan: string = "standard", amount: number = 200000) {
  try {
    const context = await requirePermission("school.settings.manage");
    const schoolId = context.school.id;
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://nsei-sukul.klarifypath.com").replace(/\/+$/, "");

    // Fapshi externalId allows alphanumeric and underscores/hyphens, rejecting colons
    const externalId = `LIC_${schoolId}_${plan}_${Date.now()}`;
    const redirectUrl = `${siteUrl}/dashboard/settings?billing_status=verify`;

    const res = await initiateFapshiPayment({
      amount,
      email: context.user.email || undefined,
      externalId,
      redirectUrl,
      userId: context.user.id,
      message: `Annual license payment for ${context.school.name} (${plan} tier)`,
    });

    if (!res.success || !res.link) {
      return {
        success: false,
        error: res.error || "Unable to initiate payment with Fapshi. Please try again or use direct MoMo transfer.",
      };
    }

    return {
      success: true,
      link: res.link,
      transId: res.transId,
    };
  } catch (err: any) {
    console.error("[initiateSchoolLicensePaymentAction] Error:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while starting payment.",
    };
  }
}

/**
 * Manually verifies the live transaction status from Fapshi when a school returns to settings.
 */
export async function verifyFapshiPaymentStatusAction(transId: string) {
  try {
    const context = await requirePermission("school.settings.manage");
    const cleanedTransId = transId?.trim();
    if (!cleanedTransId) {
      return { success: false, error: "Please provide a valid transaction ID." };
    }

    const statusRes = await getFapshiPaymentStatus(cleanedTransId);

    if (!statusRes.success || !statusRes.data) {
      return { success: false, error: statusRes.error || "Could not check transaction status." };
    }

    const { status, amount, externalId, medium, financialTransId } = statusRes.data;

    if (status === "SUCCESSFUL") {
      const adminClient = createAdminClient();
      const nextYear = new Date(Date.now() + 365 * 86400000).toISOString();

      let plan = "standard";
      if (externalId && typeof externalId === "string") {
        if (externalId.startsWith("LIC_")) {
          const parts = externalId.split("_");
          if (parts.length >= 3 && parts[2]) {
            plan = parts[2];
          }
        }
      }

      await adminClient.from("school_subscriptions").upsert(
        {
          school_id: context.school.id,
          plan,
          status: "active",
          current_period_end: nextYear,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "school_id" }
      );

      await adminClient
        .from("schools")
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq("id", context.school.id);

      await adminClient.from("audit_logs").insert({
        school_id: context.school.id,
        action: "FAPSHI_MOMO_LICENSE_ACTIVATED",
        resource_type: "school_subscription",
        resource_id: cleanedTransId,
        details: {
          transId: cleanedTransId,
          amount,
          medium: medium || "Mobile Money",
          financialTransId: financialTransId || null,
          plan,
          externalId,
          activatedAt: new Date().toISOString(),
        },
      });

      revalidatePath("/dashboard/settings");
      revalidatePath("/dashboard");
      return { success: true, status: "SUCCESSFUL", amount, plan };
    }

    return { success: true, status, amount };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to verify transaction status." };
  }
}
