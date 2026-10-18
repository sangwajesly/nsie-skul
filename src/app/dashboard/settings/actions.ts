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

const CreateAcademicYearSchema = z.object({
  name: z.string().trim().min(2, "Academic year name is required."),
  startDate: z.iso.date("Choose a valid academic year start date."),
  endDate: z.iso.date("Choose a valid academic year end date."),
  makeCurrent: z.boolean().default(false),
});

const SetCurrentAcademicYearSchema = z.object({
  academicYearId: z.uuid("Choose a valid academic year."),
});

function toISODate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function addMonths(dateString: string, monthOffset: number) {
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + monthOffset);
  return date.toISOString().slice(0, 10);
}

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
  const rawLogoUrl = String(formData.get("logo_url") || "").trim();
  const logo_url =
    !rawLogoUrl || rawLogoUrl === "null"
      ? null
      : rawLogoUrl.startsWith("data:image/") || /^https?:\/\//i.test(rawLogoUrl)
      ? rawLogoUrl
      : null;

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
      logo_url,
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

export async function createAcademicYearAction(formData: FormData) {
  const context = await requirePermission("school.settings.manage");

  const parsed = CreateAcademicYearSchema.safeParse({
    name: String(formData.get("name") || ""),
    startDate: String(formData.get("start_date") || ""),
    endDate: String(formData.get("end_date") || ""),
    makeCurrent: String(formData.get("is_current") || "") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Check the academic year details and try again.");
  }

  const startDate = toISODate(parsed.data.startDate);
  const endDate = toISODate(parsed.data.endDate);

  if (!startDate || !endDate) {
    throw new Error("Choose valid start and end dates for the academic year.");
  }

  if (new Date(endDate) <= new Date(startDate)) {
    throw new Error("Academic year end date must be after the start date.");
  }

  const supabase = await createClient();

  const { data: existingYear, error: duplicateCheckError } = await supabase
    .from("academic_years")
    .select("id")
    .eq("school_id", context.school.id)
    .eq("name", parsed.data.name)
    .maybeSingle();

  if (duplicateCheckError) {
    throw new Error("Could not verify the academic year list. Please try again.");
  }

  if (existingYear) {
    throw new Error("An academic year with that name already exists for this school.");
  }

  if (parsed.data.makeCurrent) {
    const { error: clearCurrentError } = await supabase
      .from("academic_years")
      .update({ is_current: false, updated_at: new Date().toISOString() })
      .eq("school_id", context.school.id)
      .eq("is_current", true);

    if (clearCurrentError) {
      throw new Error("Could not switch the current school year. Please try again.");
    }
  }

  const { data: academicYear, error: insertYearError } = await supabase
    .from("academic_years")
    .insert({
      school_id: context.school.id,
      name: parsed.data.name,
      start_date: startDate,
      end_date: endDate,
      is_current: parsed.data.makeCurrent,
    })
    .select("id")
    .single();

  if (insertYearError || !academicYear) {
    throw new Error(insertYearError?.message || "Could not save the academic year.");
  }

  const { data: terms, error: insertTermsError } = await supabase
    .from("terms")
    .insert([
      {
        school_id: context.school.id,
        academic_year_id: academicYear.id,
        term_number: 1,
        name: "First Term",
        start_date: startDate,
        end_date: addMonths(startDate, 3),
        is_active: true,
      },
      {
        school_id: context.school.id,
        academic_year_id: academicYear.id,
        term_number: 2,
        name: "Second Term",
        start_date: addMonths(startDate, 4),
        end_date: addMonths(startDate, 7),
        is_active: false,
      },
      {
        school_id: context.school.id,
        academic_year_id: academicYear.id,
        term_number: 3,
        name: "Third Term",
        start_date: addMonths(startDate, 8),
        end_date: endDate,
        is_active: false,
      },
    ])
    .select("id, term_number");

  if (insertTermsError || !terms || terms.length !== 3) {
    throw new Error("Academic year saved, but the school terms could not be prepared.");
  }

  const sequences = terms.flatMap((term) =>
    Array.from({ length: 6 }, (_, index) => ({
      school_id: context.school.id,
      term_id: term.id,
      sequence_number: index + 1,
      name: `Sequence ${index + 1}`,
      is_open_for_marks: index === 0,
    }))
  );

  const { error: insertSequencesError } = await supabase.from("evaluation_sequences").insert(sequences);

  if (insertSequencesError) {
    throw new Error("Academic year and terms were created, but the evaluation sequences could not be prepared.");
  }

  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: "CREATE_ACADEMIC_YEAR",
    resource_type: "academic_year",
    resource_id: academicYear.id,
    details: { name: parsed.data.name, is_current: parsed.data.makeCurrent },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/academics");
}

export async function setCurrentAcademicYearAction(formData: FormData) {
  const context = await requirePermission("school.settings.manage");

  const parsed = SetCurrentAcademicYearSchema.safeParse({
    academicYearId: formData.get("academicYearId"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Choose a valid academic year.");
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("academic_years")
    .update({ is_current: false, updated_at: new Date().toISOString() })
    .eq("school_id", context.school.id);

  if (updateError) {
    throw new Error("Could not update the school year status. Please try again.");
  }

  const { error: setCurrentError } = await supabase
    .from("academic_years")
    .update({ is_current: true, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.academicYearId)
    .eq("school_id", context.school.id);

  if (setCurrentError) {
    throw new Error("Could not set that school year as the active one.");
  }

  await supabase.from("audit_logs").insert({
    school_id: context.school.id,
    user_id: context.user.id,
    action: "SET_CURRENT_ACADEMIC_YEAR",
    resource_type: "academic_year",
    resource_id: parsed.data.academicYearId,
    details: { academic_year_id: parsed.data.academicYearId },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/academics");
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
