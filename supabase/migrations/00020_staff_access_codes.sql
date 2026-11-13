-- ==============================================================================
-- Migration: 00020_staff_access_codes.sql
-- Description: Add staff access code support for Cameroon teacher onboarding
-- Author: Nsei Skul Engineering
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Add access_code column to school_memberships
ALTER TABLE public.school_memberships
    ADD COLUMN IF NOT EXISTS access_code TEXT;

-- 2. Unique index for access_code within a school (e.g. 'T-101', 'T-102')
CREATE UNIQUE INDEX IF NOT EXISTS idx_school_memberships_access_code
    ON public.school_memberships(school_id, access_code)
    WHERE access_code IS NOT NULL;

-- 3. Index user_profiles(phone) for rapid phone-based login and duplicate prevention
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone
    ON public.user_profiles(phone)
    WHERE phone IS NOT NULL;
