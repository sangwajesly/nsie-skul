-- ==============================================================================
-- Migration: 00006_attendance_and_discipline.sql
-- Description: Daily Attendance Roll Call, Justified/Unjustified Hours,
--              Disciplinary Sanctions, and Report Card Integration
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. ATTENDANCE SESSIONS (Daily or period roll call by class stream)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
    class_stream_id UUID NOT NULL REFERENCES public.class_streams(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_type TEXT NOT NULL DEFAULT 'daily' CHECK (period_type IN ('daily', 'morning', 'afternoon')),
    recorded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(class_stream_id, session_date, period_type)
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_stream_date 
    ON public.attendance_sessions(class_stream_id, session_date);

-- 2. ATTENDANCE RECORDS (Per student status and absence hours)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    
    status TEXT NOT NULL DEFAULT 'present' 
        CHECK (status IN ('present', 'unjustified_absent', 'justified_absent', 'late', 'excused')),
    hours_missed NUMERIC(4, 1) NOT NULL DEFAULT 0.0 CHECK (hours_missed >= 0),
    justification_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_student 
    ON public.attendance_records(student_id);

-- 3. DISCIPLINARY INCIDENTS & SANCTIONS
-- Directly models the official MINESEC conduct sanctions
CREATE TABLE IF NOT EXISTS public.disciplinary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_stream_id UUID NOT NULL REFERENCES public.class_streams(id) ON DELETE CASCADE,
    
    sanction_type TEXT NOT NULL 
        CHECK (sanction_type IN ('warning', 'reprimand', 'suspension', 'punishment', 'dismissed')),
    punishment_hours INT NOT NULL DEFAULT 0 CHECK (punishment_hours >= 0),
    suspension_days INT NOT NULL DEFAULT 0 CHECK (suspension_days >= 0),
    infraction_reason TEXT NOT NULL,
    incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    recorded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'served', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disciplinary_student 
    ON public.disciplinary_records(student_id, term_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_school_term 
    ON public.disciplinary_records(school_id, term_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attendance sessions in their school" 
    ON public.attendance_sessions FOR SELECT 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Staff can manage attendance sessions in their school" 
    ON public.attendance_sessions FOR ALL 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can view attendance records in their school" 
    ON public.attendance_records FOR SELECT 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Staff can manage attendance records in their school" 
    ON public.attendance_records FOR ALL 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can view disciplinary records in their school" 
    ON public.disciplinary_records FOR SELECT 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Staff can manage disciplinary records in their school" 
    ON public.disciplinary_records FOR ALL 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );
