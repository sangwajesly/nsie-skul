-- ==============================================================================
-- Migration: 00021_allow_co_teachers_assignment.sql
-- Description: Allow multiple teachers (co-teaching) per subject in a class stream
--              by dropping the legacy 63-char truncated single-teacher constraint.
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Drop the legacy single-teacher constraint (handles both truncated and full names)
ALTER TABLE public.teacher_assignments
    DROP CONSTRAINT IF EXISTS teacher_assignments_academic_year_id_class_stream_id_subjec_key;

ALTER TABLE public.teacher_assignments
    DROP CONSTRAINT IF EXISTS teacher_assignments_academic_year_id_class_stream_id_subject_id_key;

-- 2. Ensure composite unique constraint includes teacher_user_id so multiple teachers
--    can be assigned to the same class and subject (co-teaching, lab vs theory)
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
