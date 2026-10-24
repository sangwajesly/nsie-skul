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
 * Checks departmental review & approval status for a class sequence.
 * Supports both subject-specific submission/approval and department-wide approvals.
 */
export async function getDepartmentalApproval(
  schoolId: string,
  sequenceId: string,
  classStreamId: string,
  departmentId: string,
  subjectId?: string
): Promise<DepartmentalApproval | null> {
  const supabase = await createClient();

  if (subjectId) {
    // 1. Check for subject-specific approval/submission
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

    return deptWide as DepartmentalApproval | null;
  }

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

  return data as DepartmentalApproval | null;
}
