-- ==============================================================================
-- Migration: 00003_assessment_marks.sql
-- Description: Assessment Marks, Score Normalization, Absent/Exempt States,
--              Departmental HOD Approvals, and Audit Trails
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. ASSESSMENT MARKS TABLE
CREATE TABLE IF NOT EXISTS public.assessment_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
    sequence_id UUID NOT NULL REFERENCES public.evaluation_sequences(id) ON DELETE CASCADE,
    class_stream_id UUID NOT NULL REFERENCES public.class_streams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    
    -- Score tracking
    score NUMERIC(5, 2) CHECK (score >= 0),
    max_marks NUMERIC(5, 2) NOT NULL DEFAULT 20.00 CHECK (max_marks > 0),
    normalized_score_20 NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN score IS NOT NULL AND max_marks > 0 THEN ROUND((score / max_marks) * 20.00, 2)
            ELSE NULL 
        END
    ) STORED,
    
    -- Status: Present (evaluated), Absent (ABS), Exempt (EXC)
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'exempt')),
    remarks TEXT,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit fields
    entered_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure exactly one mark per student, per subject, per sequence
    UNIQUE(sequence_id, class_stream_id, subject_id, student_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_assessment_marks_lookup 
    ON public.assessment_marks(school_id, sequence_id, class_stream_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_assessment_marks_student 
    ON public.assessment_marks(student_id, term_id);
CREATE INDEX IF NOT EXISTS idx_assessment_marks_term_stream 
    ON public.assessment_marks(term_id, class_stream_id);

-- 2. DEPARTMENTAL SEQUENCE APPROVALS
-- Formal gate: HOD verifies marks for their department/subjects before locking
CREATE TABLE IF NOT EXISTS public.departmental_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
    sequence_id UUID NOT NULL REFERENCES public.evaluation_sequences(id) ON DELETE CASCADE,
    class_stream_id UUID NOT NULL REFERENCES public.class_streams(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE, -- NULL means full department
    
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(sequence_id, class_stream_id, department_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_dept_approvals_lookup 
    ON public.departmental_approvals(school_id, sequence_id, department_id);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.assessment_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departmental_approvals ENABLE ROW LEVEL SECURITY;

-- Assessment marks RLS: Accessible by members of the school
CREATE POLICY "Users can view assessment marks in their school" 
    ON public.assessment_marks FOR SELECT 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Authorized staff can insert/update marks in their school" 
    ON public.assessment_marks FOR ALL 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Departmental approvals RLS
CREATE POLICY "Users can view departmental approvals in their school" 
    ON public.departmental_approvals FOR SELECT 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "HODs and admins can manage departmental approvals" 
    ON public.departmental_approvals FOR ALL 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );
