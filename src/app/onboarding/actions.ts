"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ACTIVE_SCHOOL_COOKIE } from "@/lib/tenancy/context";
import { restoreSchoolRecordsService } from "@/lib/data-privacy/data-sovereignty-service";
import type { NseiSukulBackupArchive } from "@/app/dashboard/settings/data-privacy-actions";

const CreateSchoolSchema = z.object({
  schoolName: z.string().min(3, "School name must be at least 3 characters."),
  schoolCode: z.string().min(2, "School code/acronym must be at least 2 characters."),
  subsystem: z.enum(["anglophone", "francophone", "bilingual"]),
  city: z.string().min(2, "Please enter your school's city or town."),
  phone: z.string().min(6, "Please provide an active phone or WhatsApp number."),
  academicYearName: z.string().min(4, "Academic year is required (e.g. 2026/2027)."),
});

export type CreateSchoolResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createSchoolAction(
  prevState: unknown,
  formData: FormData
): Promise<CreateSchoolResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to set up a school." };
  }

  const raw = {
    schoolName: (formData.get("schoolName") as string)?.trim(),
    schoolCode: (formData.get("schoolCode") as string)?.trim()?.toUpperCase(),
    subsystem: (formData.get("subsystem") as string)?.trim(),
    city: (formData.get("city") as string)?.trim(),
    phone: (formData.get("phone") as string)?.trim(),
    academicYearName: (formData.get("academicYearName") as string)?.trim() || "2026/2027",
  };

  const validation = CreateSchoolSchema.safeParse(raw);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { schoolName, schoolCode, subsystem, city, phone, academicYearName } = validation.data;

  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Admin client configuration error.";
    return { success: false, error: msg };
  }

  // 1. Generate unique slug
  let baseSlug = slugify(schoolName);
  if (!baseSlug) baseSlug = "school";
  let finalSlug = baseSlug;

  const { data: existingSlug } = await adminClient
    .from("schools")
    .select("id")
    .eq("slug", finalSlug)
    .maybeSingle();

  if (existingSlug) {
    finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // 2. Insert School
  const { data: newSchool, error: schoolErr } = await adminClient
    .from("schools")
    .insert({
      name: schoolName,
      slug: finalSlug,
      code: schoolCode,
      subsystem,
      address: city,
      phone,
      currency: "XAF",
      ranking_mode: "enabled",
      result_approval_workflow: "hod",
      receipt_prefix: schoolCode.slice(0, 4) || "REC",
      is_active: true,
    })
    .select()
    .single();

  if (schoolErr || !newSchool) {
    return {
      success: false,
      error: `Could not register school: ${schoolErr?.message || "Unknown error"}`,
    };
  }

  // 3. Find 'school_admin' role
  const { data: adminRole, error: roleErr } = await adminClient
    .from("roles")
    .select("id")
    .eq("code", "school_admin")
    .single();

  if (roleErr || !adminRole) {
    return {
      success: false,
      error: "School Administrator role definition not found. Please contact support.",
    };
  }

  // 4. Create membership linking the user as school_admin
  const { error: memberErr } = await adminClient.from("school_memberships").insert({
    school_id: newSchool.id,
    user_id: user.id,
    role_id: adminRole.id,
    title: "School Principal / Administrator",
    status: "active",
  });

  if (memberErr) {
    return {
      success: false,
      error: `Could not link your administrator account: ${memberErr.message}`,
    };
  }

  // 5. Create school trial subscription
  await adminClient.from("school_subscriptions").insert({
    school_id: newSchool.id,
    plan: "pilot",
    status: "trial",
  });

  // 6. Seed Academic Year
  const { data: academicYear, error: yearErr } = await adminClient
    .from("academic_years")
    .insert({
      school_id: newSchool.id,
      name: academicYearName,
      start_date: "2026-09-01",
      end_date: "2027-06-30",
      is_current: true,
    })
    .select()
    .single();

  if (academicYear) {
    const isFrench = subsystem === "francophone";

    // 7. Seed 3 Official Terms (Trimestres)
    const termsData = [
      {
        school_id: newSchool.id,
        academic_year_id: academicYear.id,
        term_number: 1,
        name: isFrench ? "1er Trimestre" : "First Term",
        start_date: "2026-09-01",
        end_date: "2026-12-18",
        is_active: true,
      },
      {
        school_id: newSchool.id,
        academic_year_id: academicYear.id,
        term_number: 2,
        name: isFrench ? "2e Trimestre" : "Second Term",
        start_date: "2027-01-05",
        end_date: "2027-03-26",
        is_active: false,
      },
      {
        school_id: newSchool.id,
        academic_year_id: academicYear.id,
        term_number: 3,
        name: isFrench ? "3e Trimestre" : "Third Term",
        start_date: "2027-04-12",
        end_date: "2027-06-30",
        is_active: false,
      },
    ];

    const { data: createdTerms } = await adminClient
      .from("terms")
      .insert(termsData)
      .select();

    if (createdTerms && createdTerms.length >= 3) {
      const term1 = createdTerms.find((t) => t.term_number === 1) || createdTerms[0];
      const term2 = createdTerms.find((t) => t.term_number === 2) || createdTerms[1];
      const term3 = createdTerms.find((t) => t.term_number === 3) || createdTerms[2];

      // 8. Seed 6 Official Evaluation Sequences (2 per term / trimestre)
      const sequencesData = [
        {
          school_id: newSchool.id,
          term_id: term1.id,
          sequence_number: 1,
          name: isFrench ? "1ère Séquence" : "Sequence 1",
          start_date: "2026-09-01",
          end_date: "2026-10-25",
          is_open_for_marks: true,
        },
        {
          school_id: newSchool.id,
          term_id: term1.id,
          sequence_number: 2,
          name: isFrench ? "2e Séquence" : "Sequence 2",
          start_date: "2026-10-26",
          end_date: "2026-12-18",
          is_open_for_marks: false,
        },
        {
          school_id: newSchool.id,
          term_id: term2.id,
          sequence_number: 3,
          name: isFrench ? "3e Séquence" : "Sequence 3",
          start_date: "2027-01-05",
          end_date: "2027-02-15",
          is_open_for_marks: false,
        },
        {
          school_id: newSchool.id,
          term_id: term2.id,
          sequence_number: 4,
          name: isFrench ? "4e Séquence" : "Sequence 4",
          start_date: "2027-02-16",
          end_date: "2027-03-26",
          is_open_for_marks: false,
        },
        {
          school_id: newSchool.id,
          term_id: term3.id,
          sequence_number: 5,
          name: isFrench ? "5e Séquence" : "Sequence 5",
          start_date: "2027-04-12",
          end_date: "2027-05-20",
          is_open_for_marks: false,
        },
        {
          school_id: newSchool.id,
          term_id: term3.id,
          sequence_number: 6,
          name: isFrench ? "6e Séquence" : "Sequence 6",
          start_date: "2027-05-21",
          end_date: "2027-06-30",
          is_open_for_marks: false,
        },
      ];

      await adminClient.from("evaluation_sequences").insert(sequencesData);
    }
  }

  // 9. Set the active school session cookie
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SCHOOL_COOKIE, newSchool.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return { success: true, redirectTo: "/dashboard" };
}

/**
 * Allows a returning school to restore their entire institution in 1-click
 * during onboarding from an official Nsei Sukul backup JSON archive.
 */
export async function restoreSchoolOnboardingAction(
  archiveJsonString: string
): Promise<{ success: boolean; redirectTo?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to restore a school." };
  }

  let archive: NseiSukulBackupArchive;
  try {
    archive = JSON.parse(archiveJsonString);
  } catch {
    return { success: false, error: "Invalid backup file: not valid JSON." };
  }

  if (archive.export_format_version !== "1.0" || archive.system !== "Nsei Sukul Management System") {
    return {
      success: false,
      error: "Unrecognized backup archive. Please ensure this file was exported from Nsei Sukul.",
    };
  }

  const adminClient = createAdminClient();

  // 1. Generate unique slug
  let baseSlug = slugify(archive.school.name || "school");
  let finalSlug = baseSlug;

  const { data: existingSlug } = await adminClient
    .from("schools")
    .select("id")
    .eq("slug", finalSlug)
    .maybeSingle();

  if (existingSlug) {
    finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // 2. Insert School
  const { data: newSchool, error: schoolErr } = await adminClient
    .from("schools")
    .insert({
      name: archive.school.name,
      slug: finalSlug,
      code: archive.school.code,
      motto: archive.school.motto,
      address: archive.school.address,
      phone: archive.school.phone,
      email: archive.school.email,
      subsystem: (archive.school.subsystem as any) || "anglophone",
      currency: archive.school.currency || "XAF",
      ranking_mode: (archive.school.ranking_mode as any) || "enabled",
      result_approval_workflow: (archive.school.result_approval_workflow as any) || "hod",
      receipt_prefix: archive.school.code?.slice(0, 4) || "REC",
      matricule_format: archive.school.matricule_format,
      report_card_template: archive.school.report_card_template,
      is_active: true,
    })
    .select()
    .single();

  if (schoolErr || !newSchool) {
    return {
      success: false,
      error: `Could not register school: ${schoolErr?.message || "Unknown error"}`,
    };
  }

  // 3. Find 'school_admin' role
  const { data: adminRole, error: roleErr } = await adminClient
    .from("roles")
    .select("id")
    .eq("code", "school_admin")
    .single();

  if (roleErr || !adminRole) {
    return { success: false, error: "School Administrator role definition not found." };
  }

  // 4. Link user as school_admin
  await adminClient.from("school_memberships").insert({
    school_id: newSchool.id,
    user_id: user.id,
    role_id: adminRole.id,
    title: "School Principal / Proprietor",
    status: "active",
  });

  // 5. Create school trial subscription
  await adminClient.from("school_subscriptions").insert({
    school_id: newSchool.id,
    plan: "trial",
    status: "trial",
    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // 6. Reconstruct school records
  await restoreSchoolRecordsService(adminClient, newSchool.id, archive);

  // 7. Set the active school session cookie
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SCHOOL_COOKIE, newSchool.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return { success: true, redirectTo: "/dashboard" };
}
