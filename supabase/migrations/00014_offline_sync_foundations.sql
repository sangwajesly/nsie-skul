-- ============================================================================
-- Migration: 00014_offline_sync_foundations.sql
-- Description: Foundations for Hybrid (offline-capable) operation.
--   1. school_devices      - each browser/PC gets a short, school-unique code
--                            (D1, D2, ...) used in offline receipt numbers.
--   2. fee_payments        - idempotency key + offline provenance columns so a
--                            payment recorded offline is applied exactly once.
-- ============================================================================

-- 1. SCHOOL DEVICES -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    device_code TEXT NOT NULL,              -- e.g. 'D1', 'D2'
    label TEXT,                             -- e.g. 'Chrome on Windows'
    registered_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (school_id, device_code)
);

CREATE INDEX IF NOT EXISTS idx_school_devices_school
    ON public.school_devices(school_id);

ALTER TABLE public.school_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view school devices" ON public.school_devices;
CREATE POLICY "Members can view school devices"
    ON public.school_devices FOR SELECT
    USING (public.user_is_member(school_id));

DROP POLICY IF EXISTS "Members can register school devices" ON public.school_devices;
CREATE POLICY "Members can register school devices"
    ON public.school_devices FOR INSERT
    WITH CHECK (public.user_is_member(school_id));

DROP POLICY IF EXISTS "Members can update school devices" ON public.school_devices;
CREATE POLICY "Members can update school devices"
    ON public.school_devices FOR UPDATE
    USING (public.user_is_member(school_id));

-- 2. FEE PAYMENTS: idempotency + offline provenance ----------------------------
ALTER TABLE public.fee_payments
    ADD COLUMN IF NOT EXISTS client_mutation_id UUID,
    ADD COLUMN IF NOT EXISTS device_code TEXT,
    ADD COLUMN IF NOT EXISTS recorded_offline BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS client_recorded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- One client mutation can only ever create one payment (safe retries).
CREATE UNIQUE INDEX IF NOT EXISTS uq_fee_payments_client_mutation
    ON public.fee_payments(school_id, client_mutation_id)
    WHERE client_mutation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fee_payments_bill
    ON public.fee_payments(student_bill_id);
