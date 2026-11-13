-- ==============================================================================
-- Migration: 00005_bursary_and_fees.sql
-- Description: Fee Structures, Student Billing, Payments, and Sequential Receipts
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. FEE STRUCTURES (Per Academic Year and Class/Stream)
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE, -- NULL applies to whole school
    residence_status TEXT NOT NULL DEFAULT 'all' CHECK (residence_status IN ('all', 'day', 'boarding')),
    name TEXT NOT NULL, -- e.g. 'Form 1 Day Student Package', 'General Boarding Fee'
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'XAF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fee_structures_school_year 
    ON public.fee_structures(school_id, academic_year_id);

-- 2. FEE ITEMS (Modular itemized breakdown: Tuition, PTA, Boarding, Lab, Exams)
CREATE TABLE IF NOT EXISTS public.fee_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'Tuition Fee', 'PTA Levy', 'Boarding & Catering', 'Lab Fee'
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    is_compulsory BOOLEAN NOT NULL DEFAULT true,
    term_number INT CHECK (term_number IN (1, 2, 3)), -- Optional: installment due term
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fee_items_structure 
    ON public.fee_items(fee_structure_id);

-- 3. STUDENT BILLS (Individual student balance tracking per academic year)
CREATE TABLE IF NOT EXISTS public.student_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_stream_id UUID NOT NULL REFERENCES public.class_streams(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE SET NULL,
    
    total_billed NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    balance NUMERIC(10, 2) GENERATED ALWAYS AS (total_billed - total_paid) STORED,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'overpaid')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(academic_year_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_bills_lookup 
    ON public.student_bills(school_id, academic_year_id, class_stream_id);
CREATE INDEX IF NOT EXISTS idx_student_bills_student 
    ON public.student_bills(student_id);

-- 4. FEE PAYMENTS & RECEIPT RECORDS
CREATE TABLE IF NOT EXISTS public.fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_bill_id UUID NOT NULL REFERENCES public.student_bills(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    
    receipt_number TEXT NOT NULL, -- e.g. 'GBHS-2026-0001'
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'momo', 'orange_money', 'bank_deposit')),
    transaction_ref TEXT,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    term_number INT CHECK (term_number IN (1, 2, 3)),
    remarks TEXT,
    received_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    UNIQUE(school_id, receipt_number)
);

CREATE INDEX IF NOT EXISTS idx_fee_payments_school_year 
    ON public.fee_payments(school_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student 
    ON public.fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_receipt 
    ON public.fee_payments(receipt_number);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fee structures in their school" 
    ON public.fee_structures FOR SELECT 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Bursars and admins can manage fee structures" 
    ON public.fee_structures FOR ALL 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can view student bills in their school" 
    ON public.student_bills FOR SELECT 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Bursars and staff can manage student bills" 
    ON public.student_bills FOR ALL 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Users can view fee payments in their school" 
    ON public.fee_payments FOR SELECT 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Bursars and staff can insert fee payments" 
    ON public.fee_payments FOR ALL 
    USING (
        school_id IN (
            SELECT school_id FROM public.school_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );
