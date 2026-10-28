-- Migration 00012: Report Card Template Selection
-- Allows schools to select between different report card templates (e.g. 'cba_grouped_classic' vs 'cba_ministry_standard').

ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS report_card_template TEXT NOT NULL DEFAULT 'cba_grouped_classic';

COMMENT ON COLUMN public.schools.report_card_template IS 'Selected template layout for official student report cards (cba_grouped_classic, cba_ministry_standard)';
