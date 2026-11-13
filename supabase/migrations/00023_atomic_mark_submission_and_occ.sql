-- ==============================================================================
-- Migration: 00023_atomic_mark_submission_and_occ.sql
-- Description: Phase 2 All-or-Nothing Atomic Mark Submission with OCC Rollback
--              1. Atomic PL/pgSQL function: submit_sequence_marks_atomic
--              2. Validates client versions against database versions.
--              3. Rolls back 100% of rows if any conflicting mutation is detected.
--              4. Increments version atomically and logs change events.
-- Target: PostgreSQL / Supabase
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.submit_sequence_marks_atomic(
    p_school_id UUID,
    p_academic_year_id UUID,
    p_term_id UUID,
    p_sequence_id UUID,
    p_class_stream_id UUID,
    p_subject_id UUID,
    p_max_marks NUMERIC,
    p_marks JSONB, -- Array of { student_id, score, status, remarks, version }
    p_actor_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_actor UUID;
    v_mark JSONB;
    v_student_id UUID;
    v_client_version INT;
    v_db_version INT;
    v_db_id UUID;
    v_score NUMERIC;
    v_status TEXT;
    v_remarks TEXT;
    v_conflicts JSONB := '[]'::jsonb;
    v_processed_count INT := 0;
    v_is_locked BOOLEAN := false;
BEGIN
    -- 1. Resolve actor identity
    IF auth.uid() IS NOT NULL THEN
        v_actor := auth.uid();
    ELSE
        v_actor := p_actor_id;
    END IF;

    -- 2. Verify sequence lock state
    SELECT is_locked INTO v_is_locked
    FROM public.assessment_marks
    WHERE school_id = p_school_id
      AND sequence_id = p_sequence_id
      AND class_stream_id = p_class_stream_id
      AND subject_id = p_subject_id
      AND is_locked = true
    LIMIT 1;

    IF v_is_locked THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'MARK_SHEET_LOCKED',
            'message', 'This mark sheet is locked for review and cannot be modified.'
        );
    END IF;

    -- 3. Pre-scan all marks for Optimistic Concurrency Control (OCC) conflicts
    FOR v_mark IN SELECT * FROM jsonb_array_elements(p_marks)
    LOOP
        v_student_id := (v_mark->>'student_id')::uuid;
        v_client_version := COALESCE((v_mark->>'version')::int, 1);

        SELECT id, version INTO v_db_id, v_db_version
        FROM public.assessment_marks
        WHERE sequence_id = p_sequence_id
          AND class_stream_id = p_class_stream_id
          AND subject_id = p_subject_id
          AND student_id = v_student_id;

        IF FOUND THEN
            -- Check if DB version differs from client's base version
            IF v_db_version != v_client_version THEN
                v_conflicts := v_conflicts || jsonb_build_object(
                    'student_id', v_student_id,
                    'client_version', v_client_version,
                    'db_version', v_db_version
                );
            END IF;
        END IF;
    END LOOP;

    -- If ANY conflict was detected, abort transaction completely (All-or-Nothing)
    IF jsonb_array_length(v_conflicts) > 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'CONCURRENCY_CONFLICT',
            'message', 'One or more marks have been modified by another user or synchronized node.',
            'conflicts', v_conflicts
        );
    END IF;

    -- 4. Apply all mutations atomically and advance versions
    FOR v_mark IN SELECT * FROM jsonb_array_elements(p_marks)
    LOOP
        v_student_id := (v_mark->>'student_id')::uuid;
        v_status := COALESCE(v_mark->>'status', 'present');
        v_remarks := v_mark->>'remarks';
        
        IF v_status = 'present' AND (v_mark->>'score') IS NOT NULL THEN
            v_score := (v_mark->>'score')::numeric;
        ELSE
            v_score := NULL;
        END IF;

        INSERT INTO public.assessment_marks (
            school_id, academic_year_id, term_id, sequence_id,
            class_stream_id, subject_id, student_id, score,
            max_marks, status, remarks, version, entered_by,
            updated_by, updated_at
        ) VALUES (
            p_school_id, p_academic_year_id, p_term_id, p_sequence_id,
            p_class_stream_id, p_subject_id, v_student_id, v_score,
            p_max_marks, v_status, v_remarks, 1, v_actor,
            v_actor, clock_timestamp()
        )
        ON CONFLICT (sequence_id, class_stream_id, subject_id, student_id)
        DO UPDATE SET
            score = EXCLUDED.score,
            max_marks = EXCLUDED.max_marks,
            status = EXCLUDED.status,
            remarks = EXCLUDED.remarks,
            version = assessment_marks.version + 1,
            updated_by = v_actor,
            updated_at = clock_timestamp();

        v_processed_count := v_processed_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'processed_count', v_processed_count,
        'message', 'All marks recorded successfully.'
    );
END;
$$;

-- Grant execution to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.submit_sequence_marks_atomic TO authenticated, service_role;
