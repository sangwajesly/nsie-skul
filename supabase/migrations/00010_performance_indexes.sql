-- ==============================================================================
-- Migration: 00010_performance_indexes.sql
-- Description: Composite and Foreign Key B-Tree Indexes for High-Throughput
--              Queries: Marks Ingestion, Report Cards, Attendance, Fees
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. ASSESSMENT MARKS & APPROVALS
-- Accelerates sequence mark sheets and bulk report card queries
CREATE INDEX IF NOT EXISTS idx_assessment_marks_stream_seq 
    ON public.assessment_marks(class_stream_id, sequence_id);

CREATE INDEX IF NOT EXISTS idx_assessment_marks_subject_seq 
    ON public.assessment_marks(subject_id, sequence_id);

CREATE INDEX IF NOT EXISTS idx_dept_approvals_stream_seq 
    ON public.departmental_approvals(class_stream_id, sequence_id);

-- 2. ACADEMIC CONFIGURATION & SUBJECT OVERRIDES
-- Accelerates stream-specific coefficient lookups and subject competencies
CREATE INDEX IF NOT EXISTS idx_class_subjects_stream_subject 
    ON public.class_subjects(class_stream_id, subject_id);

CREATE INDEX IF NOT EXISTS idx_subject_competencies_school_term 
    ON public.subject_competencies(school_id, term_number);

-- 3. ATTENDANCE & DISCIPLINE
-- Accelerates daily attendance rolls, sanction lookups, and term discipline summaries
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id 
    ON public.attendance_records(session_id);

CREATE INDEX IF NOT EXISTS idx_disciplinary_stream_term 
    ON public.disciplinary_records(class_stream_id, term_id);

-- 4. BURSARY & FEE BILLING
-- Eliminates table locks on cascades and speeds up balance queries
CREATE INDEX IF NOT EXISTS idx_fee_payments_bill_id 
    ON public.fee_payments(student_bill_id);
