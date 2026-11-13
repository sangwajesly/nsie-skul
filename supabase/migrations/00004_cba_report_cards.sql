-- ==============================================================================
-- Migration: 00004_cba_report_cards.sql
-- Description: Subject Competencies per Term, Term Aggregate Results,
--              Discipline records, and Official Report Card generation
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. SUBJECT COMPETENCIES (Competency-Based Assessment per Term & Level)
CREATE TABLE IF NOT EXISTS public.subject_competencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    term_number INT NOT NULL CHECK (term_number IN (1, 2, 3)),
    description TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subject_competencies_subject 
    ON public.subject_competencies(subject_id, term_number);

-- 2. TERM RESULTS & REPORT CARD RECORDS
CREATE TABLE IF NOT EXISTS public.term_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
    class_stream_id UUID NOT NULL REFERENCES public.class_streams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    
    -- Academic Summary
    total_score NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    total_coef NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    term_average NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    rank INT,
    grade TEXT,
    cba_appreciation TEXT CHECK (cba_appreciation IN ('SNA', 'SPA', 'SA', 'EXP')),
    subjects_passed INT NOT NULL DEFAULT 0,
    total_subjects INT NOT NULL DEFAULT 0,
    
    -- Discipline Profile
    unjustified_abs_hours INT NOT NULL DEFAULT 0,
    justified_abs_hours INT NOT NULL DEFAULT 0,
    late_count INT NOT NULL DEFAULT 0,
    punishment_hours INT NOT NULL DEFAULT 0,
    conduct_status TEXT NOT NULL DEFAULT 'satisfactory' 
        CHECK (conduct_status IN ('satisfactory', 'warning', 'reprimand', 'suspension', 'dismissed')),
    
    -- Remarks & Annual Decision
    class_master_remarks TEXT,
    principal_remarks TEXT,
    annual_decision TEXT CHECK (annual_decision IN ('promoted', 'repeat', 'dismissed')),
    
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(term_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_term_results_lookup 
    ON public.term_results(school_id, term_id, class_stream_id);
CREATE INDEX IF NOT EXISTS idx_term_results_student 
    ON public.term_results(student_id);

-- RLS Policies
ALTER TABLE public.subject_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.term_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subject competencies in their school" 
    ON public.subject_competencies FOR SELECT 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Admins and teachers can manage subject competencies" 
    ON public.subject_competencies FOR ALL 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can view term results in their school" 
    ON public.term_results FOR SELECT 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Staff can manage term results in their school" 
    ON public.term_results FOR ALL 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );
