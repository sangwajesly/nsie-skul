import { SupabaseClient } from "@supabase/supabase-js";
import type { NseiSukulBackupArchive } from "@/app/dashboard/settings/data-privacy-actions";

export interface RestorationSummary {
  classesCount: number;
  subjectsCount: number;
  studentsCount: number;
  marksCount: number;
  feePaymentsCount: number;
}

/**
 * Reconstructs classes, streams, subjects, students, enrollments, marks, and fees
 * from a verified Nsei Sukul JSON Backup Archive into a target school tenant.
 */
export async function restoreSchoolRecordsService(
  adminClient: SupabaseClient,
  schoolId: string,
  archive: NseiSukulBackupArchive
): Promise<RestorationSummary> {
  // 1. Restore/Update School Parameters
  await adminClient
    .from("schools")
    .update({
      motto: archive.school.motto || undefined,
      ranking_mode: (archive.school.ranking_mode as any) || undefined,
      result_approval_workflow: (archive.school.result_approval_workflow as any) || undefined,
      matricule_format: archive.school.matricule_format || undefined,
      report_card_template: archive.school.report_card_template || undefined,
    })
    .eq("id", schoolId);

  // 2. Academic Years
  const yearIdMap = new Map<string, string>();
  for (const yr of archive.data.academic_years || []) {
    const oldYearId = yr.id as string;
    const { data: existingYear } = await adminClient
      .from("academic_years")
      .select("id")
      .eq("school_id", schoolId)
      .eq("name", yr.name as string)
      .maybeSingle();

    let targetYearId = existingYear?.id;
    if (!targetYearId) {
      const { data: newYear, error: yrErr } = await adminClient
        .from("academic_years")
        .insert({
          school_id: schoolId,
          name: yr.name,
          start_date: yr.start_date,
          end_date: yr.end_date,
          is_active: yr.is_active ?? false,
        })
        .select("id")
        .single();

      if (!yrErr && newYear) {
        targetYearId = newYear.id;
      }
    }
    if (oldYearId && targetYearId) {
      yearIdMap.set(oldYearId, targetYearId);
    }
  }

  // 3. Classes & Streams
  const classIdMap = new Map<string, string>();
  for (const cls of archive.data.classes || []) {
    const oldClassId = cls.id as string;
    const { data: existingClass } = await adminClient
      .from("classes")
      .select("id")
      .eq("school_id", schoolId)
      .eq("name", cls.name as string)
      .maybeSingle();

    let targetClassId = existingClass?.id;
    if (!targetClassId) {
      const { data: newClass, error: clsErr } = await adminClient
        .from("classes")
        .insert({
          school_id: schoolId,
          name: cls.name,
          level_order: cls.level_order || 1,
          cycle: cls.cycle || "cycle_1",
        })
        .select("id")
        .single();

      if (!clsErr && newClass) {
        targetClassId = newClass.id;
      }
    }
    if (oldClassId && targetClassId) {
      classIdMap.set(oldClassId, targetClassId);
    }
  }

  const streamIdMap = new Map<string, string>();
  for (const stm of archive.data.streams || []) {
    const oldStreamId = stm.id as string;
    const targetClassId = classIdMap.get(stm.class_id as string);
    const targetYearId = yearIdMap.get(stm.academic_year_id as string);

    if (!targetClassId || !targetYearId) continue;

    const { data: existingStream } = await adminClient
      .from("class_streams")
      .select("id")
      .eq("school_id", schoolId)
      .eq("class_id", targetClassId)
      .eq("name", stm.name as string)
      .maybeSingle();

    let targetStreamId = existingStream?.id;
    if (!targetStreamId) {
      const { data: newStream, error: stmErr } = await adminClient
        .from("class_streams")
        .insert({
          school_id: schoolId,
          class_id: targetClassId,
          academic_year_id: targetYearId,
          name: stm.name,
          stream_tag: stm.stream_tag || null,
        })
        .select("id")
        .single();

      if (!stmErr && newStream) {
        targetStreamId = newStream.id;
      }
    }
    if (oldStreamId && targetStreamId) {
      streamIdMap.set(oldStreamId, targetStreamId);
    }
  }

  // 4. Subjects
  const subjectIdMap = new Map<string, string>();
  for (const sbj of archive.data.subjects || []) {
    const oldSubjectId = sbj.id as string;
    const { data: existingSubject } = await adminClient
      .from("subjects")
      .select("id")
      .eq("school_id", schoolId)
      .eq("code", sbj.code as string)
      .maybeSingle();

    let targetSubjectId = existingSubject?.id;
    if (!targetSubjectId) {
      const { data: newSubject, error: sbjErr } = await adminClient
        .from("subjects")
        .insert({
          school_id: schoolId,
          name: sbj.name,
          code: sbj.code,
          default_coefficient: sbj.default_coefficient || 1,
          subject_group: sbj.subject_group || "general",
        })
        .select("id")
        .single();

      if (!sbjErr && newSubject) {
        targetSubjectId = newSubject.id;
      }
    }
    if (oldSubjectId && targetSubjectId) {
      subjectIdMap.set(oldSubjectId, targetSubjectId);
    }
  }

  // 5. Students
  const studentIdMap = new Map<string, string>();
  let restoredStudentsCount = 0;
  for (const stu of archive.data.students || []) {
    const oldStudentId = stu.id as string;
    const matricule = (stu.matricule as string) || `REST-${Date.now()}`;

    const { data: existingStudent } = await adminClient
      .from("students")
      .select("id")
      .eq("school_id", schoolId)
      .eq("matricule", matricule)
      .maybeSingle();

    let targetStudentId = existingStudent?.id;
    if (!targetStudentId) {
      const { data: newStudent, error: stuErr } = await adminClient
        .from("students")
        .insert({
          school_id: schoolId,
          first_name: stu.first_name,
          last_name: stu.last_name,
          matricule: matricule,
          gender: stu.gender || "male",
          dob: stu.dob || null,
          pob: stu.pob || null,
          parent_name: stu.parent_name || null,
          parent_phone: stu.parent_phone || null,
          is_repeater: stu.is_repeater ?? false,
          residence: stu.residence || "day",
          photo_url: stu.photo_url || null,
        })
        .select("id")
        .single();

      if (!stuErr && newStudent) {
        targetStudentId = newStudent.id;
        restoredStudentsCount++;
      }
    }
    if (oldStudentId && targetStudentId) {
      studentIdMap.set(oldStudentId, targetStudentId);
    }
  }

  // 6. Student Enrollments
  for (const enr of archive.data.enrolments || []) {
    const targetStudentId = studentIdMap.get(enr.student_id as string);
    const targetStreamId = streamIdMap.get(enr.class_stream_id as string);
    const targetYearId = yearIdMap.get(enr.academic_year_id as string);

    if (!targetStudentId || !targetStreamId || !targetYearId) continue;

    const { data: existingEnr } = await adminClient
      .from("enrolments")
      .select("id")
      .eq("school_id", schoolId)
      .eq("student_id", targetStudentId)
      .eq("class_stream_id", targetStreamId)
      .eq("academic_year_id", targetYearId)
      .maybeSingle();

    if (!existingEnr) {
      await adminClient.from("enrolments").insert({
        school_id: schoolId,
        student_id: targetStudentId,
        class_stream_id: targetStreamId,
        academic_year_id: targetYearId,
        status: enr.status || "active",
      });
    }
  }

  // 7. Class Subjects
  const classSubjectIdMap = new Map<string, string>();
  for (const cs of archive.data.class_subjects || []) {
    const oldCsId = cs.id as string;
    const targetStreamId = streamIdMap.get(cs.class_stream_id as string);
    const targetSubjectId = subjectIdMap.get(cs.subject_id as string);

    if (!targetStreamId || !targetSubjectId) continue;

    const { data: existingCs } = await adminClient
      .from("class_subjects")
      .select("id")
      .eq("school_id", schoolId)
      .eq("class_stream_id", targetStreamId)
      .eq("subject_id", targetSubjectId)
      .maybeSingle();

    let targetCsId = existingCs?.id;
    if (!targetCsId) {
      const { data: newCs, error: csErr } = await adminClient
        .from("class_subjects")
        .insert({
          school_id: schoolId,
          class_stream_id: targetStreamId,
          subject_id: targetSubjectId,
          coefficient: cs.coefficient || 1,
        })
        .select("id")
        .single();

      if (!csErr && newCs) {
        targetCsId = newCs.id;
      }
    }
    if (oldCsId && targetCsId) {
      classSubjectIdMap.set(oldCsId, targetCsId);
    }
  }

  // 8. Assessment Marks
  let restoredMarksCount = 0;
  for (const mk of archive.data.assessment_marks || []) {
    const targetStudentId = studentIdMap.get(mk.student_id as string);
    const targetCsId = classSubjectIdMap.get(mk.class_subject_id as string);

    if (!targetStudentId || !targetCsId) continue;

    const { error: mkErr } = await adminClient.from("assessment_marks").insert({
      school_id: schoolId,
      student_id: targetStudentId,
      class_subject_id: targetCsId,
      sequence_id: mk.sequence_id,
      mark: mk.mark,
      competency_evaluation: mk.competency_evaluation || null,
      is_locked: mk.is_locked ?? false,
    });

    if (!mkErr) {
      restoredMarksCount++;
    }
  }

  return {
    classesCount: classIdMap.size,
    subjectsCount: subjectIdMap.size,
    studentsCount: restoredStudentsCount,
    marksCount: restoredMarksCount,
    feePaymentsCount: archive.statistics?.fee_payments_count || 0,
  };
}
