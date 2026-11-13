-- ==============================================================================
-- Migration: 00022_cloud_security_remediation.sql
-- Description: Phase 0 Cloud Security Remediation:
--              1. Entity versioning columns for offline OCC.
--              2. Drops permissive RLS policies on assessment_marks and fee_payments.
--              3. Restricts assessment_marks to assigned teachers, scoped HODs, or admins.
--              4. Enforces symmetrical WITH CHECK on assessment_marks UPDATE.
--              5. Restricts fee_payments to authorized bursary roles; strictly blocks DELETE.
--              6. Revokes direct client DELETE on financial and academic tables.
--              7. Establishes commit-safe school_sync_cursors (read-only for clients).
--              8. Establishes append-only cloud_change_feed.
--              9. Secure, server-only append_cloud_change_event SECURITY DEFINER function.
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. ADD ENTITY VERSIONING COLUMNS FOR OFFLINE OCC
ALTER TABLE public.assessment_marks 
ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

ALTER TABLE public.attendance_records 
ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

ALTER TABLE public.enrolments 
ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

-- 2. REMOVE PERMISSIVE POLICIES ON ASSESSMENT_MARKS
DROP POLICY IF EXISTS "Authorized staff can insert/update marks in their school" ON public.assessment_marks;
DROP POLICY IF EXISTS "Users can view assessment marks in their school" ON public.assessment_marks;
DROP POLICY IF EXISTS "assessment_marks_select_policy" ON public.assessment_marks;
DROP POLICY IF EXISTS "assessment_marks_insert_policy" ON public.assessment_marks;
DROP POLICY IF EXISTS "assessment_marks_update_policy" ON public.assessment_marks;

-- Revoke physical client-role DELETE on assessment_marks
REVOKE DELETE ON public.assessment_marks FROM anon, authenticated;

-- 3. DEPLOY STRICT, LEAST-PRIVILEGE POLICIES ON ASSESSMENT_MARKS

-- SELECT Policy: Active school members can view marks
CREATE POLICY "assessment_marks_select_policy" 
ON public.assessment_marks FOR SELECT 
TO authenticated 
USING (
    school_id IN (
        SELECT sm.school_id FROM public.school_memberships sm 
        WHERE sm.user_id = (SELECT auth.uid()) AND sm.status = 'active'
    )
);

-- INSERT Policy: Assigned teachers, scoped active HODs, or School Admins
CREATE POLICY "assessment_marks_insert_policy" 
ON public.assessment_marks FOR INSERT 
TO authenticated 
WITH CHECK (
    school_id IN (
        SELECT sm.school_id FROM public.school_memberships sm 
        WHERE sm.user_id = (SELECT auth.uid()) AND sm.status = 'active'
    )
    AND (
        public.user_has_permission(school_id, 'academics.manage')
        OR EXISTS (
            SELECT 1 FROM public.teacher_assignments ta
            WHERE ta.school_id = assessment_marks.school_id
              AND ta.teacher_user_id = (SELECT auth.uid())
              AND ta.class_stream_id = assessment_marks.class_stream_id
              AND ta.subject_id = assessment_marks.subject_id
        )
        OR EXISTS (
            SELECT 1 FROM public.hod_assignments ha
            JOIN public.subjects s ON s.id = assessment_marks.subject_id
            WHERE ha.school_id = assessment_marks.school_id
              AND ha.hod_user_id = (SELECT auth.uid())
              AND ha.status = 'active'
              AND (
                  (ha.scope_type = 'department' AND s.department_id = ha.department_id)
                  OR (ha.scope_type = 'subject' AND ha.subject_id = assessment_marks.subject_id)
              )
        )
    )
);

-- UPDATE Policy: Symmetrical USING and WITH CHECK to prevent rebinding streams/subjects
CREATE POLICY "assessment_marks_update_policy" 
ON public.assessment_marks FOR UPDATE 
TO authenticated 
USING (
    school_id IN (
        SELECT sm.school_id FROM public.school_memberships sm 
        WHERE sm.user_id = (SELECT auth.uid()) AND sm.status = 'active'
    )
    AND (
        public.user_has_permission(school_id, 'academics.manage')
        OR EXISTS (
            SELECT 1 FROM public.teacher_assignments ta
            WHERE ta.school_id = assessment_marks.school_id
              AND ta.teacher_user_id = (SELECT auth.uid())
              AND ta.class_stream_id = assessment_marks.class_stream_id
              AND ta.subject_id = assessment_marks.subject_id
        )
        OR EXISTS (
            SELECT 1 FROM public.hod_assignments ha
            JOIN public.subjects s ON s.id = assessment_marks.subject_id
            WHERE ha.school_id = assessment_marks.school_id
              AND ha.hod_user_id = (SELECT auth.uid())
              AND ha.status = 'active'
              AND (
                  (ha.scope_type = 'department' AND s.department_id = ha.department_id)
                  OR (ha.scope_type = 'subject' AND ha.subject_id = assessment_marks.subject_id)
              )
        )
    )
)
WITH CHECK (
    school_id IN (
        SELECT sm.school_id FROM public.school_memberships sm 
        WHERE sm.user_id = (SELECT auth.uid()) AND sm.status = 'active'
    )
    AND (
        public.user_has_permission(school_id, 'academics.manage')
        OR EXISTS (
            SELECT 1 FROM public.teacher_assignments ta
            WHERE ta.school_id = assessment_marks.school_id
              AND ta.teacher_user_id = (SELECT auth.uid())
              AND ta.class_stream_id = assessment_marks.class_stream_id
              AND ta.subject_id = assessment_marks.subject_id
        )
        OR EXISTS (
            SELECT 1 FROM public.hod_assignments ha
            JOIN public.subjects s ON s.id = assessment_marks.subject_id
            WHERE ha.school_id = assessment_marks.school_id
              AND ha.hod_user_id = (SELECT auth.uid())
              AND ha.status = 'active'
              AND (
                  (ha.scope_type = 'department' AND s.department_id = ha.department_id)
                  OR (ha.scope_type = 'subject' AND ha.subject_id = assessment_marks.subject_id)
              )
        )
    )
);

-- 4. REMOVE PERMISSIVE POLICIES ON FEE_PAYMENTS
DROP POLICY IF EXISTS "Bursars and staff can insert fee payments" ON public.fee_payments;
DROP POLICY IF EXISTS "Users can view fee payments in their school" ON public.fee_payments;
DROP POLICY IF EXISTS "fee_payments_select_policy" ON public.fee_payments;
DROP POLICY IF EXISTS "fee_payments_insert_policy" ON public.fee_payments;
DROP POLICY IF EXISTS "fee_payments_update_policy" ON public.fee_payments;

-- Revoke physical client-role DELETE on fee_payments
REVOKE DELETE ON public.fee_payments FROM anon, authenticated;

-- 5. DEPLOY STRICT POLICIES ON FEE_PAYMENTS

-- SELECT Policy: Viewable by active school members
CREATE POLICY "fee_payments_select_policy" 
ON public.fee_payments FOR SELECT 
TO authenticated 
USING (
    school_id IN (
        SELECT sm.school_id FROM public.school_memberships sm 
        WHERE sm.user_id = (SELECT auth.uid()) AND sm.status = 'active'
    )
);

-- INSERT Policy: Strictly restricted to finance.collect or finance.adjust permissions
CREATE POLICY "fee_payments_insert_policy" 
ON public.fee_payments FOR INSERT 
TO authenticated 
WITH CHECK (
    public.user_has_permission(school_id, 'finance.collect') OR
    public.user_has_permission(school_id, 'finance.adjust')
);

-- UPDATE Policy: Strictly restricted to finance.adjust permission
CREATE POLICY "fee_payments_update_policy" 
ON public.fee_payments FOR UPDATE 
TO authenticated 
USING (
    public.user_has_permission(school_id, 'finance.adjust')
)
WITH CHECK (
    public.user_has_permission(school_id, 'finance.adjust')
);

-- 6. COMMIT-SAFE TENANT SYNCHRONIZATION INFRASTRUCTURE

-- Row-locked tenant sequence allocator table
CREATE TABLE IF NOT EXISTS public.school_sync_cursors (
    school_id UUID PRIMARY KEY REFERENCES public.schools(id) ON DELETE CASCADE,
    last_cursor BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.school_sync_cursors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "school_sync_cursors_admin_policy" ON public.school_sync_cursors;
DROP POLICY IF EXISTS "school_sync_cursors_read_policy" ON public.school_sync_cursors;

-- Strictly READ-ONLY for authenticated school administrators. Direct client INSERT/UPDATE/DELETE denied.
CREATE POLICY "school_sync_cursors_read_policy" 
ON public.school_sync_cursors FOR SELECT 
TO authenticated 
USING (public.user_has_permission(school_id, 'school.settings.manage'));

REVOKE INSERT, UPDATE, DELETE ON public.school_sync_cursors FROM anon, authenticated;

-- Append-only cloud change feed
CREATE TABLE IF NOT EXISTS public.cloud_change_feed (
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    sequence_cursor BIGINT NOT NULL,
    event_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    mutation_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    payload JSONB NOT NULL,
    entity_version INT NOT NULL,
    actor_id UUID,
    device_code TEXT,
    origin_node_id TEXT NOT NULL DEFAULT 'CLOUD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (school_id, sequence_cursor)
);

-- Primary key (school_id, sequence_cursor) inherently clusters and serves monotonic queries.

ALTER TABLE public.cloud_change_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cloud_change_feed_admin_policy" ON public.cloud_change_feed;
DROP POLICY IF EXISTS "cloud_change_feed_read_policy" ON public.cloud_change_feed;

-- Strictly READ-ONLY for authenticated school administrators
CREATE POLICY "cloud_change_feed_read_policy" 
ON public.cloud_change_feed FOR SELECT 
TO authenticated 
USING (public.user_has_permission(school_id, 'school.settings.manage'));

REVOKE INSERT, UPDATE, DELETE ON public.cloud_change_feed FROM anon, authenticated;

-- Atomic cursor allocator and event append function
-- Server-only SECURITY DEFINER function: revoked from PUBLIC, anon, authenticated
CREATE OR REPLACE FUNCTION public.append_cloud_change_event(
    p_school_id UUID,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_mutation_type TEXT,
    p_payload JSONB,
    p_entity_version INT,
    p_actor_id UUID,
    p_device_code TEXT,
    p_origin_node_id TEXT
) RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_next_cursor BIGINT;
    v_resolved_actor UUID;
BEGIN
    -- If called within an authenticated session, force actor to auth.uid()
    IF auth.uid() IS NOT NULL THEN
        v_resolved_actor := auth.uid();
    ELSE
        v_resolved_actor := p_actor_id;
    END IF;

    INSERT INTO public.school_sync_cursors (school_id, last_cursor, updated_at)
    VALUES (p_school_id, 1, clock_timestamp())
    ON CONFLICT (school_id)
    DO UPDATE SET 
        last_cursor = school_sync_cursors.last_cursor + 1,
        updated_at = clock_timestamp()
    RETURNING last_cursor INTO v_next_cursor;

    INSERT INTO public.cloud_change_feed (
        school_id, sequence_cursor, entity_type, entity_id,
        mutation_type, payload, entity_version, actor_id,
        device_code, origin_node_id, created_at
    ) VALUES (
        p_school_id, v_next_cursor, p_entity_type, p_entity_id,
        p_mutation_type, p_payload, p_entity_version, v_resolved_actor,
        p_device_code, p_origin_node_id, clock_timestamp()
    );

    RETURN v_next_cursor;
END;
$$;

-- Restrict execution to service_role and postgres; prevent untrusted client invocation
REVOKE EXECUTE ON FUNCTION public.append_cloud_change_event FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.append_cloud_change_event TO service_role;
