-- Migration 00013: Allow multiple teachers per subject in a class stream, and support teacher unassignment
-- Enables team-teaching and multi-teacher subject assignments (e.g. co-teachers, lab vs theory)

-- 1. Drop the single-teacher constraint if present
ALTER TABLE public.teacher_assignments
DROP CONSTRAINT IF EXISTS teacher_assignments_academic_year_id_class_stream_id_subject_id_key;

-- 2. Add the multi-teacher constraint: unique per teacher, subject, class stream, and academic year
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teacher_assignments_year_stream_subject_teacher_key'
  ) THEN
    ALTER TABLE public.teacher_assignments
    ADD CONSTRAINT teacher_assignments_year_stream_subject_teacher_key
    UNIQUE(academic_year_id, class_stream_id, subject_id, teacher_user_id);
  END IF;
END $$;
