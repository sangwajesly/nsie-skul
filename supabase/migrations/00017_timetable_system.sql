-- ==============================================================================
-- Migration 00017: Multi-System School Timetable Engine
-- Supports Grammar, Technical, and Commercial subsystems with configurable:
-- - Class start & end times
-- - Period lengths & breaks (Assembly, Short Break, Lunch)
-- - Teacher availability & free days (Vacataire / Part-time management)
-- - Room & workshop allocation
-- - Cross-section clash prevention
-- ==============================================================================

-- 1. Timetable Profiles (e.g. 'General Grammar', 'Technical & Industrial', 'Commercial')
CREATE TABLE IF NOT EXISTS public.timetable_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                                       -- e.g. 'General Grammar Section'
    subsystem TEXT NOT NULL DEFAULT 'grammar' CHECK (subsystem IN ('grammar', 'technical', 'commercial', 'general')),
    default_period_duration_minutes INT NOT NULL DEFAULT 50,
    day_start_time TIME NOT NULL DEFAULT '07:30:00',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timetable_profiles_school ON public.timetable_profiles(school_id, is_active);

-- 2. Configurable Bell Periods & Breaks per Profile
CREATE TABLE IF NOT EXISTS public.timetable_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.timetable_profiles(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                                       -- e.g. 'Period 1', 'Assembly', 'Petite Récréation', 'Lunch'
    period_number INT NOT NULL,                               -- 1, 2, 3...
    start_time TIME NOT NULL,                                 -- '07:30:00'
    end_time TIME NOT NULL,                                   -- '08:20:00'
    is_break BOOLEAN NOT NULL DEFAULT false,                  -- true for morning assembly, recreation, lunch
    applies_to_days INT[] NOT NULL DEFAULT '{1,2,3,4,5}',     -- 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timetable_periods_profile ON public.timetable_periods(profile_id, period_number);

-- 3. Teacher Availability & Part-Time Off-Days
CREATE TABLE IF NOT EXISTS public.teacher_availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
    start_time TIME NOT NULL DEFAULT '07:30:00',
    end_time TIME NOT NULL DEFAULT '15:30:00',
    is_available BOOLEAN NOT NULL DEFAULT true,               -- false = teacher has off-day (e.g. teaches at another college)
    max_weekly_hours INT NOT NULL DEFAULT 18,
    notes TEXT,                                               -- e.g. 'At GBHS Bamenda on Wednesday mornings'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(school_id, teacher_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_teacher_availabilities ON public.teacher_availabilities(school_id, teacher_id);

-- 4. Active Timetable Slots (Weekly Matrix for each Class Stream)
CREATE TABLE IF NOT EXISTS public.timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.timetable_profiles(id) ON DELETE CASCADE,
    class_stream_id UUID NOT NULL REFERENCES public.class_streams(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 to 5 for standard schools
    period_id UUID NOT NULL REFERENCES public.timetable_periods(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    room_name TEXT,                                           -- 'Room 12', 'Physics Lab', 'Carpentry Workshop'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Enforce single subject per class slot
    UNIQUE(class_stream_id, day_of_week, period_id)
);

CREATE INDEX IF NOT EXISTS idx_timetable_slots_lookup ON public.timetable_slots(school_id, academic_year_id, class_stream_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_teacher ON public.timetable_slots(school_id, teacher_id, day_of_week);

-- 5. Link Class Streams to their preferred Timetable Profile
ALTER TABLE public.class_streams 
ADD COLUMN IF NOT EXISTS timetable_profile_id UUID REFERENCES public.timetable_profiles(id) ON DELETE SET NULL;

-- 6. Row Level Security Policies
ALTER TABLE public.timetable_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

-- Read policies for school members
CREATE POLICY "Timetable profiles viewable by school members"
    ON public.timetable_profiles FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Timetable periods viewable by school members"
    ON public.timetable_periods FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Teacher availabilities viewable by school members"
    ON public.teacher_availabilities FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Timetable slots viewable by school members"
    ON public.timetable_slots FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

-- Manage policies for authorized staff (school_admin, principal, hod)
CREATE POLICY "Timetable profiles manageable by authorized staff"
    ON public.timetable_profiles FOR ALL
    USING (
        public.user_has_permission(school_id, 'academics.manage') 
        OR public.user_has_permission(school_id, 'school.settings.manage')
        OR public.is_superadmin()
    );

CREATE POLICY "Timetable periods manageable by authorized staff"
    ON public.timetable_periods FOR ALL
    USING (
        public.user_has_permission(school_id, 'academics.manage') 
        OR public.user_has_permission(school_id, 'school.settings.manage')
        OR public.is_superadmin()
    );

CREATE POLICY "Teacher availabilities manageable by authorized staff"
    ON public.teacher_availabilities FOR ALL
    USING (
        public.user_has_permission(school_id, 'academics.manage') 
        OR public.user_has_permission(school_id, 'staff.manage')
        OR public.is_superadmin()
    );

CREATE POLICY "Timetable slots manageable by authorized staff"
    ON public.timetable_slots FOR ALL
    USING (
        public.user_has_permission(school_id, 'academics.manage') 
        OR public.user_has_permission(school_id, 'assignments.manage')
        OR public.is_superadmin()
    );
