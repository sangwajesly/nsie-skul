-- Migration 00019: School Deletion Lifecycle, Data Sovereignty & Portability
-- Compliant with Cameroon Law No. 2024/017 on Personal Data Protection

ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS deletion_status TEXT NOT NULL DEFAULT 'active' CHECK (deletion_status IN ('active', 'pending_deletion', 'deleted')),
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_requested_by UUID REFERENCES public.user_profiles(id),
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS last_data_export_at TIMESTAMPTZ;

-- Index for scheduled deletion purge jobs and status checks
CREATE INDEX IF NOT EXISTS idx_schools_deletion_status ON public.schools(deletion_status);
CREATE INDEX IF NOT EXISTS idx_schools_deletion_scheduled_for ON public.schools(deletion_scheduled_for) 
WHERE deletion_status = 'pending_deletion';

-- Helper function to cancel scheduled school deletion
CREATE OR REPLACE FUNCTION public.cancel_school_deletion(p_school_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.schools
    SET deletion_status = 'active',
        deletion_requested_at = NULL,
        deletion_scheduled_for = NULL,
        deletion_requested_by = NULL,
        deletion_reason = NULL,
        updated_at = now()
    WHERE id = p_school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
