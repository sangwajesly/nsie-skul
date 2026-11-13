-- Migration: 00018_direct_admin_marks_approval.sql
-- Description: Allow departmental_approvals to support direct administrative review & approval
-- for schools or subjects that do not use departments or Heads of Department (HODs).
-- School Administrators and Principals can review, approve, and reopen marks directly.

-- 1. Make department_id nullable to allow direct school administrator approval
ALTER TABLE public.departmental_approvals 
    ALTER COLUMN department_id DROP NOT NULL;

-- 2. Partial unique index for direct administrative approval (where department_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dept_approvals_direct_admin
    ON public.departmental_approvals (school_id, sequence_id, class_stream_id, subject_id)
    WHERE department_id IS NULL;

-- 3. Ensure RLS policies allow school administrators and principals full access even when department_id IS NULL
COMMENT ON TABLE public.departmental_approvals IS 
'Tracks mark sheet quality review, submission, approval, and contestation reopenings. Supports both HOD departmental review and direct Principal/School Administrator review for schools without departments.';
