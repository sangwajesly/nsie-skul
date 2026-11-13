-- ==============================================================================
-- Migration 00016: Student Passport Photo & Extended Report Card Details
-- Adds photo_url, date_of_birth, and place_of_birth to the students table.
-- ==============================================================================

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS place_of_birth TEXT;

-- Index for date of birth lookups and class age distribution reports
CREATE INDEX IF NOT EXISTS idx_students_dob ON public.students(school_id, date_of_birth);

COMMENT ON COLUMN public.students.photo_url IS 'Student passport photograph (Data URL or hosted Storage URL) for MINESEC report cards and identity badges.';
COMMENT ON COLUMN public.students.date_of_birth IS 'Student date of birth for official MINESEC report cards and GCE examination registration.';
COMMENT ON COLUMN public.students.place_of_birth IS 'City or town of birth (e.g. Bamenda, Buea, Yaounde) printed on report cards.';
