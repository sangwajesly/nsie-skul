import { createAdminClient } from "@/lib/supabase/admin";

export const DEMO_USER_EMAIL = "demo@nsei-sukul.klarifypath.com";
export const DEMO_USER_PASSWORD = "Demo@NseiSukul2026!";
export const DEMO_SCHOOL_SLUG = "demo-bilingual-high-school";
export const DEMO_SCHOOL_CODE = "DEMO-GBHS";

/**
 * Ensures the pre-seeded demonstration campus and demo principal user exist,
 * fully populated with realistic classes, students, marks, fee payments, and attendance.
 * Zero em dashes used.
 */
export async function ensureDemoSchoolAndUser() {
  const admin = createAdminClient();

  // 1. Ensure Demo Principal User in Auth
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
    // Keep school info updated
    await admin
      .from("schools")
      .update({
        name: "Government Bilingual High School (Demo)",
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
        report_card_template: "cba_grouped_classic",
      })
      .eq("id", schoolId);
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
        report_card_template: "cba_grouped_classic",
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
      plan: "premium",
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

  // 5. Ensure Academic Year & Terms
  let academicYearId: string;
  const { data: currentYear } = await admin
    .from("academic_years")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();

  if (currentYear) {
    academicYearId = currentYear.id;
  } else {
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

    if (!newYear) {
      throw new Error("Failed to create demo academic year");
    }
    academicYearId = newYear.id;
  }

  // Ensure Terms
  const { data: existingTerms } = await admin
    .from("terms")
    .select("id, term_number")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId);

  let term1Id: string | null = null;
  const term1 = existingTerms?.find((t) => t.term_number === 1);

  if (term1) {
    term1Id = term1.id;
  } else {
    const { data: newTerm1 } = await admin
      .from("terms")
      .insert({
        school_id: schoolId,
        academic_year_id: academicYearId,
        term_number: 1,
        name: "First Term",
        start_date: "2026-09-01",
        end_date: "2026-12-18",
        is_active: true,
        is_approved: true,
      })
      .select()
      .single();

    term1Id = newTerm1?.id || null;

    // Create Term 2 and Term 3
    await admin.from("terms").insert([
      {
        school_id: schoolId,
        academic_year_id: academicYearId,
        term_number: 2,
        name: "Second Term",
        start_date: "2027-01-05",
        end_date: "2027-04-02",
        is_active: false,
        is_approved: false,
      },
      {
        school_id: schoolId,
        academic_year_id: academicYearId,
        term_number: 3,
        name: "Third Term",
        start_date: "2027-04-19",
        end_date: "2027-06-25",
        is_active: false,
        is_approved: false,
      },
    ]);
  }

  // 6. Ensure Evaluation Sequences (1 to 6)
  let seq1Id: string | null = null;
  let seq2Id: string | null = null;

  if (term1Id) {
    const { data: existingSequences } = await admin
      .from("evaluation_sequences")
      .select("id, sequence_number")
      .eq("school_id", schoolId);

    const s1 = existingSequences?.find((s) => s.sequence_number === 1);
    const s2 = existingSequences?.find((s) => s.sequence_number === 2);

    if (s1 && s2) {
      seq1Id = s1.id;
      seq2Id = s2.id;
    } else {
      const sequencesToInsert = [
        {
          school_id: schoolId,
          term_id: term1Id,
          sequence_number: 1,
          name: "1st Sequence",
          is_open_for_marks: false,
        },
        {
          school_id: schoolId,
          term_id: term1Id,
          sequence_number: 2,
          name: "2nd Sequence",
          is_open_for_marks: true,
        },
      ];

      const { data: insertedSeqs } = await admin
        .from("evaluation_sequences")
        .insert(sequencesToInsert)
        .select();

      if (insertedSeqs && insertedSeqs.length >= 2) {
        seq1Id = insertedSeqs[0].id;
        seq2Id = insertedSeqs[1].id;
      }
    }
  }

  // 7. Ensure Departments & Subjects
  const { data: existingDepts } = await admin
    .from("departments")
    .select("id, code")
    .eq("school_id", schoolId);

  let scienceDeptId = existingDepts?.find((d) => d.code === "SCI")?.id;
  let langDeptId = existingDepts?.find((d) => d.code === "LANG")?.id;

  if (!scienceDeptId) {
    const { data: newSci } = await admin
      .from("departments")
      .insert({
        school_id: schoolId,
        name: "Sciences & Mathematics",
        code: "SCI",
      })
      .select()
      .single();
    scienceDeptId = newSci?.id;
  }

  if (!langDeptId) {
    const { data: newLang } = await admin
      .from("departments")
      .insert({
        school_id: schoolId,
        name: "Languages & Humanities",
        code: "LANG",
      })
      .select()
      .single();
    langDeptId = newLang?.id;
  }

  const { data: existingSubjects } = await admin
    .from("subjects")
    .select("id, code, name")
    .eq("school_id", schoolId);

  const subjectMap = new Map<string, string>();
  if (existingSubjects) {
    for (const sub of existingSubjects) {
      subjectMap.set(sub.code, sub.id);
    }
  }

  const requiredSubjects = [
    { name: "English Language", code: "ENG", department_id: langDeptId, coef: 4 },
    { name: "Mathematics", code: "MTH", department_id: scienceDeptId, coef: 4 },
    { name: "French", code: "FRE", department_id: langDeptId, coef: 3 },
    { name: "Physics", code: "PHY", department_id: scienceDeptId, coef: 3 },
    { name: "Chemistry", code: "CHE", department_id: scienceDeptId, coef: 3 },
    { name: "Biology", code: "BIO", department_id: scienceDeptId, coef: 3 },
    { name: "History", code: "HIS", department_id: langDeptId, coef: 2 },
    { name: "Geography", code: "GEO", department_id: langDeptId, coef: 2 },
    { name: "Computer Science", code: "CSC", department_id: scienceDeptId, coef: 2 },
    { name: "Citizenship", code: "CIT", department_id: langDeptId, coef: 1 },
  ];

  for (const s of requiredSubjects) {
    if (!subjectMap.has(s.code)) {
      const { data: newSub } = await admin
        .from("subjects")
        .insert({
          school_id: schoolId,
          name: s.name,
          code: s.code,
          department_id: s.department_id,
          default_coefficient: s.coef,
          default_max_marks: 20,
        })
        .select()
        .single();

      if (newSub) {
        subjectMap.set(s.code, newSub.id);
      }
    }
  }

  // 8. Ensure Classes & Streams (Form 1A and Form 5 Science)
  const { data: existingClasses } = await admin
    .from("classes")
    .select("id, name")
    .eq("school_id", schoolId);

  let f1ClassId = existingClasses?.find((c) => c.name === "Form 1")?.id;
  let f5ClassId = existingClasses?.find((c) => c.name === "Form 5")?.id;

  if (!f1ClassId) {
    const { data: newF1 } = await admin
      .from("classes")
      .insert({
        school_id: schoolId,
        name: "Form 1",
        level_order: 1,
        cycle: "cycle_1",
      })
      .select()
      .single();
    f1ClassId = newF1?.id;
  }

  if (!f5ClassId) {
    const { data: newF5 } = await admin
      .from("classes")
      .insert({
        school_id: schoolId,
        name: "Form 5",
        level_order: 5,
        cycle: "cycle_1",
      })
      .select()
      .single();
    f5ClassId = newF5?.id;
  }

  const { data: existingStreams } = await admin
    .from("class_streams")
    .select("id, name")
    .eq("school_id", schoolId);

  let f1AStreamId = existingStreams?.find((s) => s.name === "Form 1A")?.id;
  let f5SciStreamId = existingStreams?.find((s) => s.name === "Form 5 Science")?.id;

  if (!f1AStreamId && f1ClassId) {
    const { data: newF1A } = await admin
      .from("class_streams")
      .insert({
        school_id: schoolId,
        class_id: f1ClassId,
        academic_year_id: academicYearId,
        name: "Form 1A",
        stream_tag: "A",
        class_master_id: demoUserId,
      })
      .select()
      .single();
    f1AStreamId = newF1A?.id;
  }

  if (!f5SciStreamId && f5ClassId) {
    const { data: newF5Sci } = await admin
      .from("class_streams")
      .insert({
        school_id: schoolId,
        class_id: f5ClassId,
        academic_year_id: academicYearId,
        name: "Form 5 Science",
        stream_tag: "Science",
        class_master_id: demoUserId,
      })
      .select()
      .single();
    f5SciStreamId = newF5Sci?.id;
  }

  // 9. Assign Class Subjects with Coefficients to Form 1A
  if (f1AStreamId) {
    const { data: existingClassSubs } = await admin
      .from("class_subjects")
      .select("subject_id")
      .eq("class_stream_id", f1AStreamId);

    const assignedSubjectIds = new Set(existingClassSubs?.map((cs) => cs.subject_id) || []);

    const classSubjectsToInsert = [];
    for (const s of requiredSubjects) {
      const subId = subjectMap.get(s.code);
      if (subId && !assignedSubjectIds.has(subId)) {
        classSubjectsToInsert.push({
          school_id: schoolId,
          class_stream_id: f1AStreamId,
          subject_id: subId,
          coefficient: s.coef,
          max_marks: 20,
          is_compulsory: true,
        });
      }
    }

    if (classSubjectsToInsert.length > 0) {
      await admin.from("class_subjects").insert(classSubjectsToInsert);
    }

    // Teacher assignments
    if (demoUserId) {
      const { data: existingAssignments } = await admin
        .from("teacher_assignments")
        .select("subject_id")
        .eq("class_stream_id", f1AStreamId);

      const assignedTeachers = new Set(existingAssignments?.map((ta) => ta.subject_id) || []);
      const assignmentsToInsert = [];

      for (const s of requiredSubjects) {
        const subId = subjectMap.get(s.code);
        if (subId && !assignedTeachers.has(subId)) {
          assignmentsToInsert.push({
            school_id: schoolId,
            academic_year_id: academicYearId,
            teacher_user_id: demoUserId,
            class_stream_id: f1AStreamId,
            subject_id: subId,
          });
        }
      }

      if (assignmentsToInsert.length > 0) {
        await admin.from("teacher_assignments").insert(assignmentsToInsert);
      }
    }
  }

  // 10. Seed Realistic Cameroon Students (14 in Form 1A, 10 in Form 5 Science)
  const { data: existingDemoStudents } = await admin
    .from("students")
    .select("id, matricule")
    .eq("school_id", schoolId);

  const studentMatriculeMap = new Map<string, string>();
  if (existingDemoStudents) {
    for (const st of existingDemoStudents) {
      studentMatriculeMap.set(st.matricule, st.id);
    }
  }

  const sampleRoster = [
    // Form 1A Students
    { first_name: "Kevin", last_name: "Tanyi Fon", matricule: "DEMO-2026-001", gender: "M", dob: "2013-04-12", pob: "Bamenda", residence: "day", guardian: "Mr. Fon Christopher", phone: "+237 677 123 456", streamId: f1AStreamId, roll: 1 },
    { first_name: "Joyline", last_name: "Bih Fru", matricule: "DEMO-2026-002", gender: "F", dob: "2013-08-25", pob: "Buea", residence: "day", guardian: "Mrs. Fru Beatrice", phone: "+237 675 234 567", streamId: f1AStreamId, roll: 2 },
    { first_name: "Blessing", last_name: "Ngoran Berinyuy", matricule: "DEMO-2026-003", gender: "F", dob: "2013-01-19", pob: "Kumbo", residence: "day", guardian: "Mr. Berinyuy Paul", phone: "+237 699 345 678", streamId: f1AStreamId, roll: 3 },
    { first_name: "Jean-Paul", last_name: "Kamgaing", matricule: "DEMO-2026-004", gender: "M", dob: "2013-05-30", pob: "Bafoussam", residence: "day", guardian: "Mme. Kamgaing Cecile", phone: "+237 674 456 789", streamId: f1AStreamId, roll: 4 },
    { first_name: "Brenda", last_name: "Enow Manga", matricule: "DEMO-2026-005", gender: "F", dob: "2013-11-04", pob: "Limbe", residence: "day", guardian: "Mr. Manga Richard", phone: "+237 678 567 890", streamId: f1AStreamId, roll: 5 },
    { first_name: "Emmanuel", last_name: "Fokam", matricule: "DEMO-2026-006", gender: "M", dob: "2013-07-15", pob: "Douala", residence: "day", guardian: "Mme. Fokam Sophie", phone: "+237 691 678 901", streamId: f1AStreamId, roll: 6 },
    { first_name: "Collins", last_name: "Ndip Agbor", matricule: "DEMO-2026-007", gender: "M", dob: "2013-09-22", pob: "Mamfe", residence: "boarding", guardian: "Mr. Agbor George", phone: "+237 677 789 012", streamId: f1AStreamId, roll: 7 },
    { first_name: "Patience", last_name: "Lum Che", matricule: "DEMO-2026-008", gender: "F", dob: "2013-03-08", pob: "Mankon", residence: "day", guardian: "Mrs. Che Grace", phone: "+237 679 890 123", streamId: f1AStreamId, roll: 8 },
    { first_name: "David", last_name: "Ngufor Atanga", matricule: "DEMO-2026-009", gender: "M", dob: "2013-12-14", pob: "Bali", residence: "boarding", guardian: "Mr. Atanga Solomon", phone: "+237 670 901 234", streamId: f1AStreamId, roll: 9 },
    { first_name: "Vanessa", last_name: "Sirri Niba", matricule: "DEMO-2026-010", gender: "F", dob: "2013-06-18", pob: "Bafut", residence: "day", guardian: "Mrs. Niba Florence", phone: "+237 694 012 345", streamId: f1AStreamId, roll: 10 },
    { first_name: "Patrick", last_name: "Epie Nkwelle", matricule: "DEMO-2026-011", gender: "M", dob: "2013-02-27", pob: "Kumba", residence: "boarding", guardian: "Mr. Nkwelle Victor", phone: "+237 676 123 789", streamId: f1AStreamId, roll: 11 },
    { first_name: "Cynthia", last_name: "Mbong Wung", matricule: "DEMO-2026-012", gender: "F", dob: "2013-10-10", pob: "Wum", residence: "day", guardian: "Mrs. Wung Judith", phone: "+237 673 234 890", streamId: f1AStreamId, roll: 12 },
    { first_name: "Bertrand", last_name: "Ashu Takor", matricule: "DEMO-2026-013", gender: "M", dob: "2012-08-05", pob: "Tiko", residence: "day", guardian: "Mr. Takor Daniel", phone: "+237 698 345 901", streamId: f1AStreamId, roll: 13 },
    { first_name: "Diane", last_name: "Mbiydzenyuy", matricule: "DEMO-2026-014", gender: "F", dob: "2013-04-03", pob: "Jakiri", residence: "day", guardian: "Mrs. Mbiydzenyuy Rose", phone: "+237 671 456 012", streamId: f1AStreamId, roll: 14 },

    // Form 5 Science Students
    { first_name: "Franklin", last_name: "Ndive Motanga", matricule: "DEMO-2026-015", gender: "M", dob: "2009-02-11", pob: "Buea", residence: "boarding", guardian: "Mr. Motanga Henry", phone: "+237 675 567 123", streamId: f5SciStreamId, roll: 1 },
    { first_name: "Solange", last_name: "Akum Fongang", matricule: "DEMO-2026-016", gender: "F", dob: "2009-06-19", pob: "Bamenda", residence: "day", guardian: "Mrs. Fongang Helen", phone: "+237 677 678 234", streamId: f5SciStreamId, roll: 2 },
    { first_name: "Boris", last_name: "Tabi Besong", matricule: "DEMO-2026-017", gender: "M", dob: "2009-11-23", pob: "Mamfe", residence: "day", guardian: "Mr. Besong Francis", phone: "+237 699 789 345", streamId: f5SciStreamId, roll: 3 },
    { first_name: "Christelle", last_name: "Nkem Tanjong", matricule: "DEMO-2026-018", gender: "F", dob: "2009-08-14", pob: "Douala", residence: "day", guardian: "Mrs. Tanjong Celine", phone: "+237 674 890 456", streamId: f5SciStreamId, roll: 4 },
    { first_name: "Alain", last_name: "Tsafack Dongmo", matricule: "DEMO-2026-019", gender: "M", dob: "2009-01-05", pob: "Bafoussam", residence: "day", guardian: "Mr. Dongmo Robert", phone: "+237 692 901 567", streamId: f5SciStreamId, roll: 5 },
    { first_name: "Grace", last_name: "Lum Ndeh", matricule: "DEMO-2026-020", gender: "F", dob: "2009-05-28", pob: "Santa", residence: "day", guardian: "Mrs. Ndeh Mary", phone: "+237 671 012 678", streamId: f5SciStreamId, roll: 6 },
  ];

  for (const s of sampleRoster) {
    let studentId = studentMatriculeMap.get(s.matricule);

    if (!studentId) {
      const { data: newSt } = await admin
        .from("students")
        .insert({
          school_id: schoolId,
          matricule: s.matricule,
          first_name: s.first_name,
          last_name: s.last_name,
          gender: s.gender as "M" | "F",
          date_of_birth: s.dob,
          place_of_birth: s.pob,
          residence_status: s.residence as "day" | "boarding",
          guardian_name: s.guardian,
          guardian_phone: s.phone,
          status: "active",
        })
        .select()
        .single();

      if (newSt?.id) {
        studentId = newSt.id;
        studentMatriculeMap.set(s.matricule, newSt.id);
      }
    }

    if (studentId && s.streamId) {
      const { data: existingEnrolment } = await admin
        .from("enrolments")
        .select("id")
        .eq("school_id", schoolId)
        .eq("academic_year_id", academicYearId)
        .eq("student_id", studentId)
        .maybeSingle();

      if (!existingEnrolment) {
        await admin.from("enrolments").insert({
          school_id: schoolId,
          academic_year_id: academicYearId,
          class_stream_id: s.streamId,
          student_id: studentId,
          roll_number: s.roll,
          status: "active",
        });
      }
    }
  }

  // 11. Seed Real Assessment Marks for Form 1A (Sequences 1 & 2)
  if (f1AStreamId && term1Id && seq1Id && seq2Id) {
    const { count: marksCount } = await admin
      .from("assessment_marks")
      .select("id", { count: "exact", head: true })
      .eq("class_stream_id", f1AStreamId);

    if (!marksCount || marksCount < 20) {
      // Mark profiles to create realistic rank distribution
      const scoreProfiles: Record<string, number> = {
        "DEMO-2026-001": 16.5, // Kevin - Top
        "DEMO-2026-002": 16.2, // Joyline - Top
        "DEMO-2026-003": 15.8, // Blessing - Top
        "DEMO-2026-004": 14.5, // Jean-Paul - High
        "DEMO-2026-005": 14.0, // Brenda - High
        "DEMO-2026-006": 13.2, // Emmanuel - Mid
        "DEMO-2026-007": 12.8, // Collins - Mid
        "DEMO-2026-008": 12.0, // Patience - Mid
        "DEMO-2026-009": 11.5, // David - Mid
        "DEMO-2026-010": 11.0, // Vanessa - Mid
        "DEMO-2026-011": 10.2, // Patrick - Passing
        "DEMO-2026-012": 10.0, // Cynthia - Passing
        "DEMO-2026-013": 8.5,  // Bertrand - Needs improvement
        "DEMO-2026-014": 8.0,  // Diane - Needs improvement
      };

      const marksToInsert = [];

      for (const [mat, baseAvg] of Object.entries(scoreProfiles)) {
        const stId = studentMatriculeMap.get(mat);
        if (!stId) continue;

        for (const s of requiredSubjects) {
          const subId = subjectMap.get(s.code);
          if (!subId) continue;

          // Add realistic subject variations
          const subjectVariation =
            s.code === "MTH" ? 0.5 :
            s.code === "ENG" ? 0.2 :
            s.code === "FRE" ? -0.5 :
            s.code === "CSC" ? 1.0 : 0.0;

          // Sequence 1 Score
          const s1Score = Math.min(20, Math.max(0, Math.round((baseAvg + subjectVariation) * 2) / 2));
          // Sequence 2 Score (slight progress)
          const s2Score = Math.min(20, Math.max(0, Math.round((baseAvg + subjectVariation + 0.5) * 2) / 2));

          marksToInsert.push({
            school_id: schoolId,
            academic_year_id: academicYearId,
            term_id: term1Id,
            sequence_id: seq1Id,
            class_stream_id: f1AStreamId,
            subject_id: subId,
            student_id: stId,
            score: s1Score,
            max_marks: 20,
            normalized_score_20: s1Score,
            status: "present",
            remarks: s1Score >= 16 ? "Excellent" : s1Score >= 12 ? "Good" : s1Score >= 10 ? "Satisfactory" : "Needs effort",
            is_locked: false,
          });

          marksToInsert.push({
            school_id: schoolId,
            academic_year_id: academicYearId,
            term_id: term1Id,
            sequence_id: seq2Id,
            class_stream_id: f1AStreamId,
            subject_id: subId,
            student_id: stId,
            score: s2Score,
            max_marks: 20,
            normalized_score_20: s2Score,
            status: "present",
            remarks: s2Score >= 16 ? "Mastered" : s2Score >= 12 ? "Satisfactory" : "Working on it",
            is_locked: false,
          });
        }
      }

      if (marksToInsert.length > 0) {
        await admin.from("assessment_marks").insert(marksToInsert);
      }
    }
  }

  // 12. Seed Fee Structure, Student Bills & Fee Payments
  if (f1ClassId && f1AStreamId) {
    const { data: existingFeeStructure } = await admin
      .from("fee_structures")
      .select("id")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .maybeSingle();

    let feeStructureId: string | null = existingFeeStructure?.id || null;

    if (!feeStructureId) {
      const { data: newFeeStruct } = await admin
        .from("fee_structures")
        .insert({
          school_id: schoolId,
          academic_year_id: academicYearId,
          class_id: f1ClassId,
          name: "Form 1 Comprehensive Fees 2026/2027",
          total_amount: 85000,
          is_active: true,
        })
        .select()
        .single();

      if (newFeeStruct) {
        feeStructureId = newFeeStruct.id;

        await admin.from("fee_items").insert([
          {
            school_id: schoolId,
            fee_structure_id: feeStructureId,
            name: "Tuition 1st Installment",
            amount: 45000,
            is_compulsory: true,
            term_number: 1,
          },
          {
            school_id: schoolId,
            fee_structure_id: feeStructureId,
            name: "Tuition 2nd Installment",
            amount: 25000,
            is_compulsory: true,
            term_number: 2,
          },
          {
            school_id: schoolId,
            fee_structure_id: feeStructureId,
            name: "PTA & Computer Maintenance",
            amount: 15000,
            is_compulsory: true,
            term_number: 1,
          },
        ]);
      }
    }

    if (feeStructureId) {
      const { count: billsCount } = await admin
        .from("student_bills")
        .select("id", { count: "exact", head: true })
        .eq("class_stream_id", f1AStreamId);

      if (!billsCount || billsCount < 10) {
        let receiptCounter = 1;

        for (let i = 1; i <= 14; i++) {
          const mat = `DEMO-2026-${String(i).padStart(3, "0")}`;
          const stId = studentMatriculeMap.get(mat);
          if (!stId) continue;

          // Variety of payment statuses
          let totalPaid = 85000;
          let billStatus: "paid" | "partial" | "unpaid" = "paid";

          if (i > 5 && i <= 11) {
            totalPaid = 60000;
            billStatus = "partial";
          } else if (i > 11) {
            totalPaid = 15000;
            billStatus = "unpaid";
          }

          const balance = 85000 - totalPaid;

          const { data: bill } = await admin
            .from("student_bills")
            .insert({
              school_id: schoolId,
              academic_year_id: academicYearId,
              student_id: stId,
              class_stream_id: f1AStreamId,
              fee_structure_id: feeStructureId,
              total_billed: 85000,
              total_paid: totalPaid,
              balance: balance,
              status: billStatus,
            })
            .select()
            .single();

          if (bill && totalPaid > 0) {
            const receiptNum = `DEMO-REC-2026-${String(receiptCounter++).padStart(3, "0")}`;
            await admin.from("fee_payments").insert({
              school_id: schoolId,
              student_bill_id: bill.id,
              student_id: stId,
              academic_year_id: academicYearId,
              receipt_number: receiptNum,
              amount: totalPaid,
              payment_method: i % 2 === 0 ? "momo" : "orange_money",
              transaction_ref: `MOMO-FP-${Date.now().toString().slice(-6)}-${i}`,
              payment_date: "2026-09-12",
              term_number: 1,
              remarks: billStatus === "paid" ? "Full payment received" : "1st installment cleared",
              received_by: demoUserId,
            });
          }
        }
      }
    }
  }

  // 13. Seed Attendance Records for Form 1A
  if (f1AStreamId && term1Id) {
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: existingSession } = await admin
      .from("attendance_sessions")
      .select("id")
      .eq("class_stream_id", f1AStreamId)
      .eq("session_date", todayStr)
      .maybeSingle();

    if (!existingSession) {
      const { data: newSession } = await admin
        .from("attendance_sessions")
        .insert({
          school_id: schoolId,
          academic_year_id: academicYearId,
          term_id: term1Id,
          class_stream_id: f1AStreamId,
          session_date: todayStr,
          period_type: "daily",
          recorded_by: demoUserId,
        })
        .select()
        .single();

      if (newSession) {
        const attendanceRecordsToInsert = [];
        for (let i = 1; i <= 14; i++) {
          const mat = `DEMO-2026-${String(i).padStart(3, "0")}`;
          const stId = studentMatriculeMap.get(mat);
          if (!stId) continue;

          let status: "present" | "late" | "justified_absent" | "unjustified_absent" = "present";
          let hoursMissed = 0;
          let note: string | null = null;

          if (i === 4) {
            status = "late";
            hoursMissed = 1;
            note = "Arrived 15 minutes late due to rain";
          } else if (i === 8) {
            status = "justified_absent";
            hoursMissed = 6;
            note = "Medical certificate presented";
          }

          attendanceRecordsToInsert.push({
            school_id: schoolId,
            session_id: newSession.id,
            student_id: stId,
            status: status,
            hours_missed: hoursMissed,
            justification_note: note,
          });
        }

        if (attendanceRecordsToInsert.length > 0) {
          await admin.from("attendance_records").insert(attendanceRecordsToInsert);
        }
      }
    }
  }

  // 14. Seed Master Timetable
  try {
    const { data: existingProfile } = await admin
      .from("timetable_profiles")
      .select("id")
      .eq("school_id", schoolId)
      .maybeSingle();

    let profileId: string | null = existingProfile?.id || null;

    if (!profileId) {
      const { data: newProfile } = await admin
        .from("timetable_profiles")
        .insert({
          school_id: schoolId,
          name: "Standard Campus Timetable",
          subsystem: "general",
          default_period_duration_minutes: 50,
          day_start_time: "07:30",
          is_active: true,
        })
        .select()
        .single();

      profileId = newProfile?.id || null;

      if (profileId) {
        const periodsData = [
          { period_number: 1, name: "Period 1", start_time: "07:30", end_time: "08:20", is_break: false, applies_to_days: [1, 2, 3, 4, 5] },
          { period_number: 2, name: "Period 2", start_time: "08:20", end_time: "09:10", is_break: false, applies_to_days: [1, 2, 3, 4, 5] },
          { period_number: 3, name: "Period 3", start_time: "09:10", end_time: "10:00", is_break: false, applies_to_days: [1, 2, 3, 4, 5] },
          { period_number: 4, name: "Midday Break", start_time: "10:00", end_time: "10:30", is_break: true, applies_to_days: [1, 2, 3, 4, 5] },
          { period_number: 5, name: "Period 4", start_time: "10:30", end_time: "11:20", is_break: false, applies_to_days: [1, 2, 3, 4, 5] },
          { period_number: 6, name: "Period 5", start_time: "11:20", end_time: "12:10", is_break: false, applies_to_days: [1, 2, 3, 4, 5] },
          { period_number: 7, name: "Period 6", start_time: "12:10", end_time: "13:00", is_break: false, applies_to_days: [1, 2, 3, 4, 5] },
        ];

        const { data: insertedPeriods } = await admin
          .from("timetable_periods")
          .insert(
            periodsData.map((p) => ({
              profile_id: profileId,
              school_id: schoolId,
              ...p,
            }))
          )
          .select();

        if (insertedPeriods && f1AStreamId) {
          const mathId = subjectMap.get("MTH");
          const engId = subjectMap.get("ENG");
          const freId = subjectMap.get("FRE");
          const sciId = subjectMap.get("PHY");

          const p1 = insertedPeriods.find((p) => p.period_number === 1)?.id;
          const p2 = insertedPeriods.find((p) => p.period_number === 2)?.id;

          const slots = [];
          if (p1 && mathId) {
            slots.push({
              school_id: schoolId,
              academic_year_id: academicYearId,
              profile_id: profileId,
              class_stream_id: f1AStreamId,
              day_of_week: 1, // Monday
              period_id: p1,
              subject_id: mathId,
              teacher_id: demoUserId,
              room_name: "Room 101",
            });
          }
          if (p2 && engId) {
            slots.push({
              school_id: schoolId,
              academic_year_id: academicYearId,
              profile_id: profileId,
              class_stream_id: f1AStreamId,
              day_of_week: 1, // Monday
              period_id: p2,
              subject_id: engId,
              teacher_id: demoUserId,
              room_name: "Room 101",
            });
          }

          if (slots.length > 0) {
            await admin.from("timetable_slots").insert(slots);
          }
        }
      }
    }
  } catch (err) {
    // Non-critical if timetable tables have minor custom schemas
    console.warn("[Demo Timetable Seed] Handled:", err);
  }

  return { demoUserId, schoolId };
}
