import { createClient } from "@/lib/supabase/server";
import { AssessmentMark, DepartmentalApproval } from "@/types/database";

export { getGradeAppreciation } from "./grading";

/**
 * Fetches existing assessment marks for a specific class stream, subject, and sequence.
 */
export async function getMarksForSequence(
  schoolId: string,
  sequenceId: string,
  classStreamId: string,
  subjectId: string
): Promise<AssessmentMark[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessment_marks")
    .select(
      `
      *,
      student:students (*),
      subject:subjects (*)
    `
    )
    .eq("school_id", schoolId)
    .eq("sequence_id", sequenceId)
    .eq("class_stream_id", classStreamId)
    .eq("subject_id", subjectId);

  return (data as AssessmentMark[]) || [];
}

/**
 * Checks review & approval status for a class sequence.
 * Supports:
 * 1. Subject-specific approval under a department (HOD review)
 * 2. Department-wide approval (HOD review)
 * 3. Direct subject-level approval without department (School Admin / Principal review)
 * 4. Synthetic fallback check on assessment_marks.is_locked when marks are locked
 */
export async function getDepartmentalApproval(
  schoolId: string,
  sequenceId: string,
  classStreamId: string,
  departmentId?: string | null,
  subjectId?: string | null
): Promise<DepartmentalApproval | null> {
  const supabase = await createClient();

  if (departmentId && subjectId) {
    // 1. Check for subject-specific approval under a department
    const { data: subjectSpecific } = await supabase
      .from("departmental_approvals")
      .select(
        `
        *,
        department:departments (*),
        approver:user_profiles (*)
      `
      )
      .eq("school_id", schoolId)
      .eq("sequence_id", sequenceId)
      .eq("class_stream_id", classStreamId)
      .eq("department_id", departmentId)
      .eq("subject_id", subjectId)
      .maybeSingle();

    if (subjectSpecific) {
      return subjectSpecific as DepartmentalApproval;
    }

    // 2. Fallback: Check for department-wide approval (subject_id IS NULL)
    const { data: deptWide } = await supabase
      .from("departmental_approvals")
      .select(
        `
        *,
        department:departments (*),
        approver:user_profiles (*)
      `
      )
      .eq("school_id", schoolId)
      .eq("sequence_id", sequenceId)
      .eq("class_stream_id", classStreamId)
      .eq("department_id", departmentId)
      .is("subject_id", null)
      .maybeSingle();

    if (deptWide) {
      return deptWide as DepartmentalApproval;
    }
  }

  // 3. Check for direct administrative approval or subject-level approval (department_id IS NULL or any)
  if (subjectId) {
    const { data: directApproval } = await supabase
      .from("departmental_approvals")
      .select(
        `
        *,
        department:departments (*),
        approver:user_profiles (*)
      `
      )
      .eq("school_id", schoolId)
      .eq("sequence_id", sequenceId)
      .eq("class_stream_id", classStreamId)
      .eq("subject_id", subjectId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (directApproval) {
      return directApproval as DepartmentalApproval;
    }
  }

  // 4. Check for department-wide approval if only departmentId was provided
  if (departmentId) {
    const { data } = await supabase
      .from("departmental_approvals")
      .select(
        `
        *,
        department:departments (*),
        approver:user_profiles (*)
      `
      )
      .eq("school_id", schoolId)
      .eq("sequence_id", sequenceId)
      .eq("class_stream_id", classStreamId)
      .eq("department_id", departmentId)
      .maybeSingle();

    if (data) {
      return data as DepartmentalApproval;
    }
  }

  // 5. Defensive fallback: If marks exist in assessment_marks and are locked, synthesize approval status
  // so that even if the school has no department record, the UI accurately reflects that marks are submitted & locked
  if (subjectId) {
    const { data: existingMarks } = await supabase
      .from("assessment_marks")
      .select("is_locked, updated_at, updated_by")
      .eq("school_id", schoolId)
      .eq("sequence_id", sequenceId)
      .eq("class_stream_id", classStreamId)
      .eq("subject_id", subjectId)
      .limit(1);

    if (existingMarks && existingMarks.length > 0 && existingMarks[0].is_locked) {
      return {
        id: "synthetic-locked",
        school_id: schoolId,
        academic_year_id: "",
        term_id: "",
        sequence_id: sequenceId,
        class_stream_id: classStreamId,
        department_id: departmentId || null,
        subject_id: subjectId,
        status: "submitted",
        approved_by: existingMarks[0].updated_by || null,
        approved_at: existingMarks[0].updated_at || null,
        notes: "Marks submitted for administrative review.",
        created_at: existingMarks[0].updated_at || new Date().toISOString(),
        updated_at: existingMarks[0].updated_at || new Date().toISOString(),
      } as DepartmentalApproval;
    }
  }

  return null;
}
