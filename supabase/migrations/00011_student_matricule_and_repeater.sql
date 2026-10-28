-- ==============================================================================
-- Migration: 00011_student_matricule_and_repeater.sql
-- Description: Adds is_repeater flag to student enrolments and configurable
--              automatic matricule generation format to schools.
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. ADD REPEATER STATUS TO ENROLMENTS & STUDENTS
-- Captures whether the student is repeating the class for the academic year
ALTER TABLE public.enrolments 
    ADD COLUMN IF NOT EXISTS is_repeater BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.students 
    ADD COLUMN IF NOT EXISTS is_repeater BOOLEAN NOT NULL DEFAULT false;

-- 2. ADD CUSTOMIZABLE MATRICULE FORMAT TO SCHOOLS
-- Format tokens supported:
-- {CODE}    - School Code / Abbreviation (e.g. GBHS)
-- {YEAR}    - 2-digit academic year (e.g. 26)
-- {YEAR:4}  - 4-digit academic year (e.g. 2026)
-- {SEQ:4}   - 4-digit zero-padded school-wide sequence (e.g. 0001)
-- {SEQ:3}   - 3-digit zero-padded school-wide sequence (e.g. 001)
ALTER TABLE public.schools 
    ADD COLUMN IF NOT EXISTS matricule_format TEXT NOT NULL DEFAULT '{CODE}-{YEAR}-{SEQ:4}';
