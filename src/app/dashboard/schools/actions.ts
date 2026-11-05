"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext, ACTIVE_SCHOOL_COOKIE, SUPER_ADMIN_EMAILS } from "@/lib/tenancy/context";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Asserts the current user has platform superadmin authority.
 */
async function assertSuperAdmin() {
  const context = await getTenantContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized: Please sign in.");
  }

  const isSuper =
    context?.isSuperAdmin ||
    context?.role?.code === "superadmin" ||
    SUPER_ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");

  if (!isSuper) {
    throw new Error("Forbidden: Requires Platform Superadmin privileges.");
  }

  return { user, context };
}

/**
 * 1-Click switch active school session as Super Admin
 */
export async function switchSchoolAction(schoolId: string) {
  await assertSuperAdmin();

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SCHOOL_COOKIE, schoolId, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/**
 * 1-Click extend 30-day trial for any school
 */
export async function extendSchoolTrialAction(schoolId: string, additionalDays: number = 30) {
  try {
    await assertSuperAdmin();
    const adminClient = createAdminClient();

    // 1. Fetch current subscription
    const { data: currentSub } = await adminClient
      .from("school_subscriptions")
      .select("*")
      .eq("school_id", schoolId)
      .maybeSingle();

    const now = new Date();
    let baseDate = now;

    if (currentSub?.trial_ends_at) {
      const existingEnd = new Date(currentSub.trial_ends_at);
      if (existingEnd.getTime() > now.getTime()) {
        baseDate = existingEnd;
      }
    }

    const newTrialEnds = new Date(baseDate.getTime() + additionalDays * 86400000).toISOString();

    const { error } = await adminClient
      .from("school_subscriptions")
      .upsert(
        {
          school_id: schoolId,
          plan: currentSub?.plan || "pilot",
          status: "trial",
          trial_ends_at: newTrialEnds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "school_id" }
      );

    if (error) {
      return { success: false, error: "Unable to extend trial period. Please try again." };
    }

    revalidatePath("/dashboard/schools");
    return { success: true, newTrialEnds };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while extending the trial.",
    };
  }
}

/**
 * 1-Click activate school subscription (Full annual license)
 */
export async function activateSchoolSubscriptionAction(schoolId: string, plan: string = "pilot") {
  try {
    await assertSuperAdmin();
    const adminClient = createAdminClient();

    const nextYear = new Date(Date.now() + 365 * 86400000).toISOString();

    const { error: subError } = await adminClient
      .from("school_subscriptions")
      .upsert(
        {
          school_id: schoolId,
          plan,
          status: "active",
          current_period_end: nextYear,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "school_id" }
      );

    if (subError) {
      console.error("[activateSchoolSubscriptionAction] Subscription error:", subError);
      return {
        success: false,
        error: "Unable to activate school subscription. Please verify your connection and try again.",
      };
    }

    // Ensure the school record itself is marked active
    await adminClient
      .from("schools")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", schoolId);

    revalidatePath("/dashboard/schools");
    return { success: true };
  } catch (err: any) {
    console.error("[activateSchoolSubscriptionAction] Caught error:", err);
    return {
      success: false,
      error: err?.message || "Could not activate annual license. Please try again.",
    };
  }
}

/**
 * 1-Click deactivate / suspend school subscription
 */
export async function deactivateSchoolSubscriptionAction(schoolId: string) {
  try {
    await assertSuperAdmin();
    const adminClient = createAdminClient();

    const now = new Date().toISOString();

    // 1. Mark subscription as canceled / inactive
    const { error: subError } = await adminClient
      .from("school_subscriptions")
      .upsert(
        {
          school_id: schoolId,
          status: "canceled",
          current_period_end: now,
          updated_at: now,
        },
        { onConflict: "school_id" }
      );

    if (subError) {
      console.error("[deactivateSchoolSubscriptionAction] Subscription error:", subError);
      return {
        success: false,
        error: "Unable to deactivate school subscription. Please try again.",
      };
    }

    // 2. Mark the school record as inactive
    const { error: schoolError } = await adminClient
      .from("schools")
      .update({ is_active: false, updated_at: now })
      .eq("id", schoolId);

    if (schoolError) {
      console.error("[deactivateSchoolSubscriptionAction] School update error:", schoolError);
      return {
        success: false,
        error: "Subscription marked inactive, but failed to update school status.",
      };
    }

    // 3. Log audit event
    await adminClient.from("audit_logs").insert({
      school_id: schoolId,
      action: "SCHOOL_DEACTIVATED",
      resource_type: "school",
      resource_id: schoolId,
      details: {
        deactivatedAt: now,
      },
    });

    revalidatePath("/dashboard/schools");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("[deactivateSchoolSubscriptionAction] Caught error:", err);
    return {
      success: false,
      error: err?.message || "Could not deactivate school. Please try again.",
    };
  }
}

/**
 * Toggle whether a school is featured on the platform public landing page
 */
export async function toggleSchoolFeaturedOnLandingAction(schoolId: string) {
  try {
    const { user } = await assertSuperAdmin();
    const adminClient = createAdminClient();

    // 1. Fetch current featured IDs
    const { data: featuredLog } = await adminClient
      .from("audit_logs")
      .select("details")
      .eq("resource_type", "platform_settings")
      .eq("resource_id", "featured_landing_schools")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentIds: string[] = featuredLog?.details?.featuredSchoolIds || [];
    const isCurrentlyFeatured = currentIds.includes(schoolId);

    const updatedIds = isCurrentlyFeatured
      ? currentIds.filter((id) => id !== schoolId)
      : [...currentIds, schoolId];

    // 2. Persist update in audit_logs
    const { error } = await adminClient.from("audit_logs").insert({
      school_id: schoolId,
      user_id: user.id,
      action: isCurrentlyFeatured ? "REMOVE_FEATURED_LANDING_SCHOOL" : "ADD_FEATURED_LANDING_SCHOOL",
      resource_type: "platform_settings",
      resource_id: "featured_landing_schools",
      details: { featuredSchoolIds: updatedIds },
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[toggleSchoolFeaturedOnLandingAction] Error saving:", error);
      return {
        success: false,
        error: "Unable to update featured schools list. Please try again.",
      };
    }

    revalidatePath("/dashboard/schools");
    revalidatePath("/");
    return { success: true, isFeatured: !isCurrentlyFeatured };
  } catch (err: any) {
    console.error("[toggleSchoolFeaturedOnLandingAction] Caught error:", err);
    return {
      success: false,
      error: err?.message || "Unable to update homepage school display setting.",
    };
  }
}

const QuickCreateSchoolSchema = z.object({
  schoolName: z.string().min(3, "School name must be at least 3 characters."),
  schoolCode: z.string().min(2, "School acronym must be at least 2 characters."),
  subsystem: z.enum(["anglophone", "francophone", "bilingual"]),
  city: z.string().min(2, "City or town is required."),
  phone: z.string().min(6, "Phone number is required."),
  academicYearName: z.string().min(4, "Academic year is required (e.g. 2026/2027)."),
});

/**
 * Fast-provision a complete school tenancy directly from the Super Admin hub
 */
export async function quickCreateSchoolAction(prevState: unknown, formData: FormData) {
  const { user } = await assertSuperAdmin();
  const adminClient = createAdminClient();

  const raw = {
    schoolName: (formData.get("schoolName") as string)?.trim(),
    schoolCode: (formData.get("schoolCode") as string)?.trim()?.toUpperCase(),
    subsystem: (formData.get("subsystem") as string)?.trim(),
    city: (formData.get("city") as string)?.trim(),
    phone: (formData.get("phone") as string)?.trim(),
    academicYearName: (formData.get("academicYearName") as string)?.trim() || "2026/2027",
  };

  const validation = QuickCreateSchoolSchema.safeParse(raw);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { schoolName, schoolCode, subsystem, city, phone, academicYearName } = validation.data;

  // 1. Slugify
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
    return { success: false, error: `Failed to create school: ${schoolErr?.message || "Unknown error"}` };
  }

  // Note: Platform superadmins access schools cross-tenant via SUPER_ADMIN_EMAILS
  // and are not inserted into local school staff lists to keep the school roster clean.

  // 4. Create trial subscription
  await adminClient.from("school_subscriptions").insert({
    school_id: newSchool.id,
    plan: "pilot",
    status: "trial",
  });

  // 5. Seed Academic Year
  const { data: academicYear } = await adminClient
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

    // 6. Seed 3 Terms
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

    const { data: insertedTerms } = await adminClient
      .from("terms")
      .insert(termsData)
      .select();

    // 7. Seed 6 MINESEC Sequences
    if (insertedTerms && insertedTerms.length >= 3) {
      const term1 = insertedTerms.find((t) => t.term_number === 1);
      const term2 = insertedTerms.find((t) => t.term_number === 2);
      const term3 = insertedTerms.find((t) => t.term_number === 3);

      const seqsData = [
        {
          school_id: newSchool.id,
          term_id: term1?.id,
          sequence_number: 1,
          name: isFrench ? "1ère Séquence" : "1st Sequence",
          is_active: true,
        },
        {
          school_id: newSchool.id,
          term_id: term1?.id,
          sequence_number: 2,
          name: isFrench ? "2ème Séquence" : "2nd Sequence",
          is_active: false,
        },
        {
          school_id: newSchool.id,
          term_id: term2?.id,
          sequence_number: 3,
          name: isFrench ? "3ème Séquence" : "3rd Sequence",
          is_active: false,
        },
        {
          school_id: newSchool.id,
          term_id: term2?.id,
          sequence_number: 4,
          name: isFrench ? "4ème Séquence" : "4th Sequence",
          is_active: false,
        },
        {
          school_id: newSchool.id,
          term_id: term3?.id,
          sequence_number: 5,
          name: isFrench ? "5ème Séquence" : "5th Sequence",
          is_active: false,
        },
        {
          school_id: newSchool.id,
          term_id: term3?.id,
          sequence_number: 6,
          name: isFrench ? "6ème Séquence" : "6th Sequence",
          is_active: false,
        },
      ];

      await adminClient.from("sequences").insert(seqsData);
    }

    // 8. Seed Standard MINESEC Class Levels
    const classLevels =
      subsystem === "francophone"
        ? [
            { name: "6ème", code: "6EME", cycle: "first_cycle", order_index: 1 },
            { name: "5ème", code: "5EME", cycle: "first_cycle", order_index: 2 },
            { name: "4ème", code: "4EME", cycle: "first_cycle", order_index: 3 },
            { name: "3ème", code: "3EME", cycle: "first_cycle", order_index: 4 },
            { name: "2nde C", code: "2NDEC", cycle: "second_cycle", order_index: 5 },
            { name: "2nde A", code: "2NDEA", cycle: "second_cycle", order_index: 6 },
            { name: "1ère D", code: "1ERED", cycle: "second_cycle", order_index: 7 },
            { name: "1ère A", code: "1EREA", cycle: "second_cycle", order_index: 8 },
            { name: "Tle D", code: "TLED", cycle: "second_cycle", order_index: 9 },
            { name: "Tle A", code: "TLEA", cycle: "second_cycle", order_index: 10 },
          ]
        : [
            { name: "Form 1", code: "F1", cycle: "first_cycle", order_index: 1 },
            { name: "Form 2", code: "F2", cycle: "first_cycle", order_index: 2 },
            { name: "Form 3", code: "F3", cycle: "first_cycle", order_index: 3 },
            { name: "Form 4", code: "F4", cycle: "first_cycle", order_index: 4 },
            { name: "Form 5", code: "F5", cycle: "first_cycle", order_index: 5 },
            { name: "Lower Sixth Arts", code: "L6A", cycle: "second_cycle", order_index: 6 },
            { name: "Lower Sixth Science", code: "L6S", cycle: "second_cycle", order_index: 7 },
            { name: "Upper Sixth Arts", code: "U6A", cycle: "second_cycle", order_index: 8 },
            { name: "Upper Sixth Science", code: "U6S", cycle: "second_cycle", order_index: 9 },
          ];

    const classesToInsert = classLevels.map((lvl) => ({
      school_id: newSchool.id,
      name: lvl.name,
      code: lvl.code,
      cycle: lvl.cycle,
      order_index: lvl.order_index,
    }));

    const { data: insertedClasses } = await adminClient
      .from("classes")
      .insert(classesToInsert)
      .select();

    // 9. Seed 1 default Class Stream per Class (e.g. Form 1A)
    if (insertedClasses && insertedClasses.length > 0) {
      const streamsToInsert = insertedClasses.map((cls) => ({
        school_id: newSchool.id,
        class_id: cls.id,
        academic_year_id: academicYear.id,
        name: `${cls.name} A`,
      }));

      await adminClient.from("class_streams").insert(streamsToInsert);
    }

    // 10. Seed Core MINESEC Subjects
    const standardSubjects =
      subsystem === "francophone"
        ? [
            { name: "Français", code: "FRA", default_coefficient: 5 },
            { name: "Mathématiques", code: "MATH", default_coefficient: 5 },
            { name: "Anglais", code: "ANG", default_coefficient: 3 },
            { name: "Histoire-Géographie", code: "HG", default_coefficient: 3 },
            { name: "Sciences de la Vie et de la Terre", code: "SVT", default_coefficient: 2 },
            { name: "Physique-Chimie-Technologie", code: "PCT", default_coefficient: 2 },
            { name: "Informatique", code: "INFO", default_coefficient: 2 },
            { name: "Éducation Physique et Sportive", code: "EPS", default_coefficient: 2 },
          ]
        : [
            { name: "English Language", code: "ENG", default_coefficient: 5 },
            { name: "Mathematics", code: "MATH", default_coefficient: 5 },
            { name: "French", code: "FRE", default_coefficient: 3 },
            { name: "Biology", code: "BIO", default_coefficient: 3 },
            { name: "Physics", code: "PHY", default_coefficient: 3 },
            { name: "Chemistry", code: "CHE", default_coefficient: 3 },
            { name: "Geography", code: "GEO", default_coefficient: 3 },
            { name: "History", code: "HIS", default_coefficient: 3 },
            { name: "Computer Science / ICT", code: "ICT", default_coefficient: 2 },
            { name: "Citizenship", code: "CIT", default_coefficient: 2 },
            { name: "Physical Education", code: "PE", default_coefficient: 2 },
          ];

    const subjectsToInsert = standardSubjects.map((sbj) => ({
      school_id: newSchool.id,
      name: sbj.name,
      code: sbj.code,
      default_coefficient: sbj.default_coefficient,
    }));

    await adminClient.from("subjects").insert(subjectsToInsert);
  }

  // Set active cookie so operator can jump right into this new school
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SCHOOL_COOKIE, newSchool.id, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/schools");

  return { success: true, schoolId: newSchool.id };
}
