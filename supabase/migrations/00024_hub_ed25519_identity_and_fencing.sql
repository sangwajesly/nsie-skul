-- ============================================================================
-- Migration: 00024_hub_ed25519_identity_and_fencing.sql
-- Description: Phase 3 Hub Cryptographic Identity & Epoch Fencing
--              1. Adds ed25519_public_key and epoch_fence to school_hubs
--              2. Establishes class_stream_leases table for stream ownership
-- Target: PostgreSQL / Supabase
-- ============================================================================

-- 1. Upgrade school_hubs with Ed25519 cryptographic identity & fencing epoch
ALTER TABLE public.school_hubs
ADD COLUMN IF NOT EXISTS ed25519_public_key TEXT,
ADD COLUMN IF NOT EXISTS fencing_epoch BIGINT NOT NULL DEFAULT 1;

-- 2. Class Stream Ownership Leases (Stream Fencing)
CREATE TABLE IF NOT EXISTS public.class_stream_leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_stream_id UUID NOT NULL REFERENCES public.class_streams(id) ON DELETE CASCADE,
    hub_id UUID NOT NULL REFERENCES public.school_hubs(id) ON DELETE CASCADE,
    lease_epoch BIGINT NOT NULL DEFAULT 1,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    UNIQUE (school_id, class_stream_id)
);

CREATE INDEX IF NOT EXISTS idx_stream_leases_lookup
ON public.class_stream_leases(school_id, class_stream_id, status);

ALTER TABLE public.class_stream_leases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_stream_leases_select" ON public.class_stream_leases;
CREATE POLICY "class_stream_leases_select"
ON public.class_stream_leases FOR SELECT
TO authenticated
USING (public.user_is_member(school_id));

DROP POLICY IF EXISTS "class_stream_leases_admin" ON public.class_stream_leases;
CREATE POLICY "class_stream_leases_admin"
ON public.class_stream_leases FOR ALL
TO authenticated
USING (public.user_has_permission(school_id, 'school.settings.manage'));
