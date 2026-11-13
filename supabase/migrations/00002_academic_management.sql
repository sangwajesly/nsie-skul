-- ==============================================================================
-- Migration: 00002_academic_management.sql
-- Description: Academic Calendar, 6-Sequence Model, Classes, Streams,
--              Departments, Subjects, Dynamic Coefficients, HOD & Teacher
--              Assignments, Students, and Enrolments
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. ACADEMIC YEARS
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. '2026/2027'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_academic_years_school ON public.academic_years(school_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_current ON public.academic_years(school_id, is_current);

-- 2. TERMS (Fixed 3 terms for Cameroon)
CREATE TABLE IF NOT EXISTS public.terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    term_number INT NOT NULL CHECK (term_number IN (1, 2, 3)),
    name TEXT NOT NULL, -- 'First Term', 'Second Term', 'Third Term'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(academic_year_id, term_number)
);

CREATE INDEX IF NOT EXISTS idx_terms_year ON public.terms(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_terms_school ON public.terms(school_id);

-- 3. EVALUATION SEQUENCES (6 sequences: 2 per term)
CREATE TABLE IF NOT EXISTS public.evaluation_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
    sequence_number INT NOT NULL CHECK (sequence_number BETWEEN 1 AND 6),
    name TEXT NOT NULL, -- 'Sequence 1' to 'Sequence 6'
    start_date DATE,
    end_date DATE,
    is_open_for_marks BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(term_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_sequences_term ON public.evaluation_sequences(term_id);

-- 4. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. 'Science & Mathematics', 'Languages & Letters'
    code TEXT NOT NULL, -- e.g. 'SCI', 'LANG', 'TECH'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(school_id, code)
);

CREATE INDEX IF NOT EXISTS idx_departments_school ON public.departments(school_id);

-- 5. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL, -- e.g. 'Mathematics', 'Computer Science'
    code TEXT NOT NULL, -- e.g. 'MATH', 'CS'
    default_coefficient NUMERIC(4, 2) NOT NULL DEFAULT 2.00,
    default_max_marks NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(school_id, code)
);

CREATE INDEX IF NOT EXISTS idx_subjects_school ON public.subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_department ON public.subjects(department_id);

-- 6. CLASSES (Grade levels)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Lower Sixth', 'Upper Sixth'
    level_order INT NOT NULL, -- 1 to 7 for ordering
    cycle TEXT NOT NULL DEFAULT 'cycle_1' CHECK (cycle IN ('cycle_1', 'cycle_2')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_classes_school ON public.classes(school_id);

-- 7. CLASS STREAMS (Classroom cohort in an academic year)
CREATE TABLE IF NOT EXISTS public.class_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. 'Form 1 A', 'Form 5 Science', 'Lower Sixth Arts'
    stream_tag TEXT, -- 'A', 'B', 'Science', 'Arts', 'Commercial'
    class_master_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(academic_year_id, class_id, name)
);

CREATE INDEX IF NOT EXISTS idx_streams_school ON public.class_streams(school_id);
CREATE INDEX IF NOT EXISTS idx_streams_year ON public.class_streams(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_streams_class ON public.class_streams(class_id);

-- 8. CLASS SUBJECTS (Dynamic coefficients and custom max_marks per stream)
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_stream_id UUID NOT NULL REFERENCES public.class_streams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    coefficient NUMERIC(4, 2) NOT NULL DEFAULT 2.00,
    max_marks NUMERIC(5, 2) NOT NULL DEFAULT 20.00, -- Customizable: 20 for general, 40/60/100 for technical practicals
    is_compulsory BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(class_stream_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_class_subjects_stream ON public.class_subjects(class_stream_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject ON public.class_subjects(subject_id);

-- 9. HEAD OF DEPARTMENT (HOD) ASSIGNMENTS
-- Supports department-wide scope OR specific subject scope within a department
CREATE TABLE IF NOT EXISTS public.hod_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    hod_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE, -- NULL means entire department scope
    scope_type TEXT NOT NULL DEFAULT 'department' CHECK (scope_type IN ('department', 'subject')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hod_assignments_user ON public.hod_assignments(hod_user_id);
CREATE INDEX IF NOT EXISTS idx_hod_assignments_department ON public.hod_assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_hod_assignments_school_year ON public.hod_assignments(school_id, academic_year_id);

-- 10. TEACHER ASSIGNMENTS
-- Maps a teacher to a specific Class Stream and Subject for an Academic Year
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    teacher_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    class_stream_id UUID NOT NULL REFERENCES public.class_streams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(academic_year_id, class_stream_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON public.teacher_assignments(teacher_user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_stream ON public.teacher_assignments(class_stream_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_school_year ON public.teacher_assignments(school_id, academic_year_id);

-- 11. STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    matricule TEXT NOT NULL, -- e.g. 'JST-2026-001'
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
    date_of_birth DATE,
    place_of_birth TEXT,
    residence_status TEXT NOT NULL DEFAULT 'day' CHECK (residence_status IN ('day', 'boarding')),
    guardian_name TEXT,
    guardian_phone TEXT,
    guardian_email TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'transferred', 'graduated', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(school_id, matricule)
);

CREATE INDEX IF NOT EXISTS idx_students_school ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_matricule ON public.students(school_id, matricule);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);

-- 12. ENROLMENTS (Student in a Class Stream for an Academic Year)
CREATE TABLE IF NOT EXISTS public.enrolments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    class_stream_id UUID NOT NULL REFERENCES public.class_streams(id) ON DELETE CASCADE,
    roll_number INT,
    enrolment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'promoted', 'repeated', 'withdrawn', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(academic_year_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrolments_student ON public.enrolments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrolments_stream ON public.enrolments(class_stream_id);
CREATE INDEX IF NOT EXISTS idx_enrolments_school_year ON public.enrolments(school_id, academic_year_id);

-- ==============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hod_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrolments ENABLE ROW LEVEL SECURITY;

-- Academic Years: Read for members, manage for admins
CREATE POLICY "Academic years viewable by school members"
    ON public.academic_years FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Academic years manageable by school admins"
    ON public.academic_years FOR ALL
    USING (public.user_has_permission(school_id, 'academics.manage') OR public.is_superadmin());

-- Terms: Read for members, manage for admins
CREATE POLICY "Terms viewable by school members"
    ON public.terms FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Terms manageable by school admins"
    ON public.terms FOR ALL
    USING (public.user_has_permission(school_id, 'academics.manage') OR public.is_superadmin());

-- Sequences: Read for members, manage for admins
CREATE POLICY "Sequences viewable by school members"
    ON public.evaluation_sequences FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Sequences manageable by school admins"
    ON public.evaluation_sequences FOR ALL
    USING (public.user_has_permission(school_id, 'academics.manage') OR public.is_superadmin());

-- Departments & Subjects: Read for members, manage for admins/HODs
CREATE POLICY "Departments viewable by school members"
    ON public.departments FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Departments manageable by school admins"
    ON public.departments FOR ALL
    USING (public.user_has_permission(school_id, 'academics.manage') OR public.is_superadmin());

CREATE POLICY "Subjects viewable by school members"
    ON public.subjects FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Subjects manageable by school admins"
    ON public.subjects FOR ALL
    USING (public.user_has_permission(school_id, 'academics.manage') OR public.is_superadmin());

-- Classes & Streams
CREATE POLICY "Classes viewable by school members"
    ON public.classes FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Classes manageable by school admins"
    ON public.classes FOR ALL
    USING (public.user_has_permission(school_id, 'academics.manage') OR public.is_superadmin());

CREATE POLICY "Streams viewable by school members"
    ON public.class_streams FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Streams manageable by school admins"
    ON public.class_streams FOR ALL
    USING (public.user_has_permission(school_id, 'academics.manage') OR public.is_superadmin());

-- Class Subjects (Coefficients)
CREATE POLICY "Class subjects viewable by school members"
    ON public.class_subjects FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Class subjects manageable by school admins"
    ON public.class_subjects FOR ALL
    USING (public.user_has_permission(school_id, 'academics.manage') OR public.is_superadmin());

-- HOD Assignments
CREATE POLICY "HOD assignments viewable by school members"
    ON public.hod_assignments FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "HOD assignments manageable by school admins"
    ON public.hod_assignments FOR ALL
    USING (public.user_has_permission(school_id, 'assignments.manage') OR public.is_superadmin());

-- Teacher Assignments
CREATE POLICY "Teacher assignments viewable by school members"
    ON public.teacher_assignments FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Teacher assignments manageable by school admins"
    ON public.teacher_assignments FOR ALL
    USING (public.user_has_permission(school_id, 'assignments.manage') OR public.is_superadmin());

-- Students & Enrolments
CREATE POLICY "Students viewable by school members"
    ON public.students FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Students manageable by authorized staff"
    ON public.students FOR ALL
    USING (public.user_has_permission(school_id, 'students.manage') OR public.is_superadmin());

CREATE POLICY "Enrolments viewable by school members"
    ON public.enrolments FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Enrolments manageable by authorized staff"
    ON public.enrolments FOR ALL
    USING (public.user_has_permission(school_id, 'students.manage') OR public.is_superadmin());
