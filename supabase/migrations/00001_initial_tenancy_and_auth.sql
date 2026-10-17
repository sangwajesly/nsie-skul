-- ==============================================================================
-- Migration: 00001_initial_tenancy_and_auth.sql
-- Description: Core Tenancy, User Profiles, RBAC, Subscriptions, and Audit Logging
-- Author: Nsei Skul Engineering
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SCHOOLS (Tenants)
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    code TEXT,
    logo_url TEXT,
    motto TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    subsystem TEXT NOT NULL DEFAULT 'anglophone' CHECK (subsystem IN ('anglophone', 'francophone', 'bilingual')),
    currency TEXT NOT NULL DEFAULT 'XAF',
    ranking_mode TEXT NOT NULL DEFAULT 'enabled' CHECK (ranking_mode IN ('enabled', 'disabled')),
    result_approval_workflow TEXT NOT NULL DEFAULT 'hod' CHECK (result_approval_workflow IN ('hod', 'principal')),
    receipt_prefix TEXT NOT NULL DEFAULT 'REC',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for tenant lookup
CREATE INDEX IF NOT EXISTS idx_schools_slug ON public.schools(slug);
CREATE INDEX IF NOT EXISTS idx_schools_is_active ON public.schools(is_active);

-- 3. USER PROFILES (Scaffolded from auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- 4. ROLES
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. PERMISSIONS
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);

-- 6. ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

-- 7. SCHOOL_MEMBERSHIPS (Maps users to schools and roles)
CREATE TABLE IF NOT EXISTS public.school_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'invited')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(school_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_school ON public.school_memberships(school_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.school_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.school_memberships(status);

-- 8. SCHOOL_SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.school_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE UNIQUE,
    plan TEXT NOT NULL DEFAULT 'pilot' CHECK (plan IN ('pilot', 'standard', 'premium', 'custom')),
    status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'canceled')),
    trial_ends_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_school ON public.school_subscriptions(school_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.school_subscriptions(status);

-- 9. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_school ON public.audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 10. SECURITY DEFINER HELPER FUNCTIONS (For RLS & Access Control)
-- ==============================================================================

-- Check if current user is active member of school
CREATE OR REPLACE FUNCTION public.user_is_member(p_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.school_memberships
        WHERE school_id = p_school_id
          AND user_id = auth.uid()
          AND status = 'active'
    );
$$;

-- Check if current user has a specific permission in a school
CREATE OR REPLACE FUNCTION public.user_has_permission(p_school_id UUID, p_perm_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.school_memberships sm
        JOIN public.role_permissions rp ON rp.role_id = sm.role_id
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE sm.school_id = p_school_id
          AND sm.user_id = auth.uid()
          AND sm.status = 'active'
          AND p.code = p_perm_code
    );
$$;

-- Check if current user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.school_memberships sm
        JOIN public.roles r ON r.id = sm.role_id
        WHERE sm.user_id = auth.uid()
          AND sm.status = 'active'
          AND r.code = 'superadmin'
    );
$$;

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Schools: Members can view their own school, superadmins can manage all
CREATE POLICY "Schools are viewable by active members"
    ON public.schools FOR SELECT
    USING (public.user_is_member(id) OR public.is_superadmin());

CREATE POLICY "Schools are manageable by superadmins"
    ON public.schools FOR ALL
    USING (public.is_superadmin());

CREATE POLICY "Schools are updateable by school admins"
    ON public.schools FOR UPDATE
    USING (public.user_has_permission(id, 'school.settings.manage'));

-- User Profiles: Users can view/update their own profile; members of same school can view colleagues
CREATE POLICY "User can read own profile"
    ON public.user_profiles FOR SELECT
    USING (id = auth.uid() OR public.is_superadmin());

CREATE POLICY "User can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "School members can view colleague profiles"
    ON public.user_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.school_memberships my_m
            JOIN public.school_memberships colleague_m ON colleague_m.school_id = my_m.school_id
            WHERE my_m.user_id = auth.uid()
              AND colleague_m.user_id = public.user_profiles.id
              AND my_m.status = 'active'
        )
    );

-- Roles and Permissions: Read-only for authenticated users
CREATE POLICY "Roles are viewable by authenticated users"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Permissions are viewable by authenticated users"
    ON public.permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Role permissions are viewable by authenticated users"
    ON public.role_permissions FOR SELECT
    TO authenticated
    USING (true);

-- School Memberships: Members can view other members in their school
CREATE POLICY "Members can view school colleagues"
    ON public.school_memberships FOR SELECT
    USING (public.user_is_member(school_id) OR public.is_superadmin());

CREATE POLICY "Admins can manage school memberships"
    ON public.school_memberships FOR ALL
    USING (public.user_has_permission(school_id, 'staff.manage') OR public.is_superadmin());

-- School Subscriptions: Viewable by school admins and superadmins
CREATE POLICY "Subscriptions are viewable by school managers"
    ON public.school_subscriptions FOR SELECT
    USING (public.user_has_permission(school_id, 'school.settings.manage') OR public.is_superadmin());

CREATE POLICY "Subscriptions are manageable by superadmins"
    ON public.school_subscriptions FOR ALL
    USING (public.is_superadmin());

-- Audit Logs: Viewable by authorized school auditors, insertable by system
CREATE POLICY "Audit logs are viewable by school admins"
    ON public.audit_logs FOR SELECT
    USING (public.user_has_permission(school_id, 'audit.view') OR public.is_superadmin());

CREATE POLICY "Audit logs can be created by authenticated users"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ==============================================================================
-- 12. AUTOMATIC PROFILE CREATION TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, email, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = now();
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 13. SEED DATA: STANDARD ROLES & PERMISSIONS
-- ==============================================================================

-- Standard System Roles
INSERT INTO public.roles (code, name, description, is_system) VALUES
    ('superadmin', 'Platform Superadmin', 'SaaS platform operator with cross-tenant management', true),
    ('school_admin', 'School Administrator', 'Principal administrative authority in the school', true),
    ('principal', 'Principal / Academic Administrator', 'Academic supervisor approving term results and report cards', true),
    ('hod', 'Head of Department (HOD)', 'Departmental head supervising subjects, mark entry, and reviews', true),
    ('teacher', 'Subject Teacher', 'Teacher entering marks and attendance for assigned classes', true),
    ('class_master', 'Class Master / Form Tutor', 'Oversees class stream attendance and conduct remarks', true),
    ('bursar', 'Bursar / Accountant', 'Manages fees, records payments, issues receipts, tracks arrears', true)
ON CONFLICT (code) DO NOTHING;

-- Standard Granular Permissions
INSERT INTO public.permissions (code, category, description) VALUES
    -- School & Settings
    ('school.settings.manage', 'school', 'Configure school profile, academic calendar, and branding'),
    ('school.roles.manage', 'school', 'Configure custom roles and permissions'),
    ('audit.view', 'school', 'View security and change audit history'),
    
    -- Staff & Assignments
    ('staff.view', 'staff', 'View staff directory and profiles'),
    ('staff.manage', 'staff', 'Invite, register, edit, and deactivate staff'),
    ('assignments.manage', 'staff', 'Assign teachers and HODs to classes and subjects'),
    
    -- Students
    ('students.view_all', 'students', 'View all student records across the school'),
    ('students.view_assigned', 'students', 'View students in assigned classes/subjects'),
    ('students.manage', 'students', 'Register, edit, transfer, and graduate students'),
    ('students.import_export', 'students', 'Bulk import and export student records'),
    
    -- Academics & Subjects
    ('academics.manage', 'academics', 'Configure classes, streams, departments, and subjects'),
    ('schemes.manage', 'academics', 'Configure assessment schemes, grading bands, and coefficients'),
    
    -- Marks & Assessments
    ('marks.view_all', 'marks', 'View all student marks school-wide'),
    ('marks.view_department', 'marks', 'View marks within authorized department scope'),
    ('marks.enter_assigned', 'marks', 'Enter and edit marks for assigned teaching subjects'),
    ('marks.review_hod', 'marks', 'Review, flag, and endorse marks within HOD scope'),
    ('marks.approve_hod', 'marks', 'Formally approve marks for HOD scope'),
    ('results.approve_school', 'marks', 'Formally approve term results school-wide'),
    ('results.publish', 'marks', 'Release and publish approved report cards to families'),
    
    -- Report Cards
    ('report_cards.view', 'report_cards', 'View and download student report cards'),
    ('report_cards.generate', 'report_cards', 'Generate class and school report card bundles'),
    ('report_cards.customize_appearance', 'report_cards', 'Customize report card themes and colors (FR-092-FR-098)'),
    
    -- Finance
    ('finance.view_reports', 'finance', 'View financial summaries, collection, and arrears reports'),
    ('finance.manage_structure', 'finance', 'Configure fee categories, levies, and class charge structures'),
    ('finance.collect', 'finance', 'Record student fee payments and issue official receipts'),
    ('finance.adjust', 'finance', 'Authorize refunds, corrections, and fee charge adjustments'),
    
    -- Attendance
    ('attendance.take_assigned', 'attendance', 'Record daily or period attendance for assigned classes'),
    ('attendance.view_all', 'attendance', 'View school-wide attendance summaries and reports')
ON CONFLICT (code) DO NOTHING;

-- Map Default Permissions to School Administrator
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.code = 'school_admin'
ON CONFLICT DO NOTHING;

-- Map Default Permissions to Principal
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.code = 'principal'
  AND p.code IN (
    'staff.view', 'students.view_all', 'marks.view_all', 'marks.review_hod',
    'results.approve_school', 'results.publish', 'report_cards.view',
    'report_cards.generate', 'attendance.view_all', 'audit.view'
  )
ON CONFLICT DO NOTHING;

-- Map Default Permissions to HOD
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.code = 'hod'
  AND p.code IN (
    'students.view_assigned', 'marks.view_department', 'marks.enter_assigned',
    'marks.review_hod', 'marks.approve_hod', 'report_cards.view'
  )
ON CONFLICT DO NOTHING;

-- Map Default Permissions to Teacher
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.code = 'teacher'
  AND p.code IN (
    'students.view_assigned', 'marks.enter_assigned', 'attendance.take_assigned',
    'report_cards.view'
  )
ON CONFLICT DO NOTHING;

-- Map Default Permissions to Class Master
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.code = 'class_master'
  AND p.code IN (
    'students.view_assigned', 'marks.enter_assigned', 'attendance.take_assigned',
    'attendance.view_all', 'report_cards.view'
  )
ON CONFLICT DO NOTHING;

-- Map Default Permissions to Bursar
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.code = 'bursar'
  AND p.code IN (
    'students.view_all', 'finance.view_reports', 'finance.manage_structure',
    'finance.collect', 'finance.adjust'
  )
ON CONFLICT DO NOTHING;
