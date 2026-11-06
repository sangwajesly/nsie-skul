import { createAdminClient } from "@/lib/supabase/admin";

export const DEMO_USER_EMAIL = "demo@nsei-sukul.klarifypath.com";
export const DEMO_USER_PASSWORD = "Demo@NseiSukul2026!";
export const DEMO_SCHOOL_SLUG = "demo-bilingual-high-school";
export const DEMO_SCHOOL_CODE = "DEMO-GBHS";

/**
 * Ensures the pre-seeded demonstration campus and demo principal user exist.
 * Completely isolated from real production schools.
 * Zero em dashes used.
 */
export async function ensureDemoSchoolAndUser() {
  const admin = createAdminClient();

  // 1. Ensure Demo User in Auth
  let demoUserId: string | null = null;
  const { data: userList } = await admin.auth.admin.listUsers();
  const existingUser = userList?.users?.find(
    (u) => u.email?.toLowerCase() === DEMO_USER_EMAIL.toLowerCase()
  );

  if (existingUser) {
    demoUserId = existingUser.id;
  } else {
    const { data: newAuth, error: authErr } = await admin.auth.admin.createUser({
      email: DEMO_USER_EMAIL,
      password: DEMO_USER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: "Demo Campus Principal",
      },
    });

    if (authErr || !newAuth.user) {
      throw new Error(`Failed to provision demo user: ${authErr?.message || "Unknown error"}`);
    }
    demoUserId = newAuth.user.id;
  }

  // Ensure user profile
  await admin.from("user_profiles").upsert(
    {
      id: demoUserId,
      full_name: "Demo Campus Principal",
      email: DEMO_USER_EMAIL,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  // 2. Ensure Demo School
  const { data: existingSchool } = await admin
    .from("schools")
    .select("*")
    .eq("slug", DEMO_SCHOOL_SLUG)
    .maybeSingle();

  let schoolId: string;

  if (existingSchool) {
    schoolId = existingSchool.id;
  } else {
    const { data: createdSchool, error: createErr } = await admin
      .from("schools")
      .insert({
        name: "Government Bilingual High School (Demo)",
        slug: DEMO_SCHOOL_SLUG,
        code: DEMO_SCHOOL_CODE,
        subsystem: "bilingual",
        address: "Up Station, Bamenda, North West Region",
        phone: "+237 682 833 601",
        motto: "Laborare et Orante · Excellence in Education",
        currency: "XAF",
        ranking_mode: "enabled",
        result_approval_workflow: "principal",
        receipt_prefix: "DEMO",
        is_active: true,
      })
      .select()
      .single();

    if (createErr || !createdSchool) {
      throw new Error(`Failed to create demo school: ${createErr?.message || "Unknown error"}`);
    }
    schoolId = createdSchool.id;
  }

  // 3. Ensure Active Subscription
  await admin.from("school_subscriptions").upsert(
    {
      school_id: schoolId,
      plan: "standard",
      status: "active",
      current_period_end: new Date(Date.now() + 365 * 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "school_id" }
  );

  // 4. Ensure Principal Membership
  const { data: principalRole } = await admin
    .from("roles")
    .select("id")
    .eq("code", "principal")
    .maybeSingle();

  if (principalRole && demoUserId) {
    const { data: existingMembership } = await admin
      .from("school_memberships")
      .select("id")
      .eq("school_id", schoolId)
      .eq("user_id", demoUserId)
      .maybeSingle();

    if (!existingMembership) {
      await admin.from("school_memberships").insert({
        school_id: schoolId,
        user_id: demoUserId,
        role_id: principalRole.id,
        status: "active",
      });
    }
  }

  // 5. Ensure Academic Year & Sample Structure
  const { data: existingYear } = await admin
    .from("academic_years")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();

  if (!existingYear) {
    const { data: newYear } = await admin
      .from("academic_years")
      .insert({
        school_id: schoolId,
        name: "2026/2027",
        start_date: "2026-09-01",
        end_date: "2027-06-30",
        is_current: true,
      })
      .select()
      .single();

    if (newYear) {
      // Create Term 1
      const { data: term1 } = await admin
        .from("terms")
        .insert({
          school_id: schoolId,
          academic_year_id: newYear.id,
          term_number: 1,
          name: "First Term",
          start_date: "2026-09-01",
          end_date: "2026-12-18",
          is_active: true,
        })
        .select()
        .single();

      if (term1) {
        // Create Sequence 1 and 2
        await admin.from("sequences").insert([
          {
            school_id: schoolId,
            term_id: term1.id,
            sequence_number: 1,
            name: "1st Sequence",
            is_active: false,
            is_open_for_marks: false,
          },
          {
            school_id: schoolId,
            term_id: term1.id,
            sequence_number: 2,
            name: "2nd Sequence",
            is_active: true,
            is_open_for_marks: true,
          },
        ]);
      }

      // Create Departments
      const { data: scienceDept } = await admin
        .from("departments")
        .insert({
          school_id: schoolId,
          name: "Sciences & Mathematics",
          code: "SCI",
        })
        .select()
        .single();

      const { data: artsDept } = await admin
        .from("departments")
        .insert({
          school_id: schoolId,
          name: "Languages & Humanities",
          code: "LANG",
        })
        .select()
        .single();

      // Create Subjects
      const subjectsToInsert = [
        { school_id: schoolId, name: "English Language", code: "ENG", department_id: artsDept?.id },
        { school_id: schoolId, name: "Mathematics", code: "MTH", department_id: scienceDept?.id },
        { school_id: schoolId, name: "French", code: "FRE", department_id: artsDept?.id },
        { school_id: schoolId, name: "Physics", code: "PHY", department_id: scienceDept?.id },
        { school_id: schoolId, name: "Chemistry", code: "CHE", department_id: scienceDept?.id },
        { school_id: schoolId, name: "Biology", code: "BIO", department_id: scienceDept?.id },
        { school_id: schoolId, name: "History", code: "HIS", department_id: artsDept?.id },
        { school_id: schoolId, name: "Geography", code: "GEO", department_id: artsDept?.id },
        { school_id: schoolId, name: "Computer Science", code: "CSC", department_id: scienceDept?.id },
      ];

      await admin.from("subjects").insert(subjectsToInsert);

      // Create Class & Stream
      const { data: f1Class } = await admin
        .from("classes")
        .insert({
          school_id: schoolId,
          name: "Form 1",
          level: 1,
          subsystem: "anglophone",
        })
        .select()
        .single();

      if (f1Class) {
        const { data: f1AStream } = await admin
          .from("class_streams")
          .insert({
            school_id: schoolId,
            class_id: f1Class.id,
            name: "Form 1A",
          })
          .select()
          .single();

        if (f1AStream) {
          // Seed 5 sample students
          const sampleStudents = [
            { first_name: "Kevin", last_name: "Tanyi Fon", matricule: "GBHS-2026-001", gender: "M" },
            { first_name: "Joyline", last_name: "Bih Fru", matricule: "GBHS-2026-002", gender: "F" },
            { first_name: "Jean-Paul", last_name: "Kamgaing", matricule: "GBHS-2026-003", gender: "M" },
            { first_name: "Blessing", last_name: "Ngoran Berinyuy", matricule: "GBHS-2026-004", gender: "F" },
            { first_name: "Emmanuel", last_name: "Fokam", matricule: "GBHS-2026-005", gender: "M" },
          ];

          for (const s of sampleStudents) {
            const { data: newStudent } = await admin
              .from("students")
              .insert({
                school_id: schoolId,
                first_name: s.first_name,
                last_name: s.last_name,
                matricule: s.matricule,
                gender: s.gender,
                residence_status: "day",
                status: "active",
                date_of_birth: "2013-05-14",
                place_of_birth: "Bamenda",
              })
              .select()
              .single();

            if (newStudent) {
              await admin.from("enrolments").insert({
                school_id: schoolId,
                academic_year_id: newYear.id,
                class_stream_id: f1AStream.id,
                student_id: newStudent.id,
                status: "active",
              });
            }
          }
        }
      }
    }
  }

  return { demoUserId, schoolId };
}
