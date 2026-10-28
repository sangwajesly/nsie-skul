-- ==============================================================================
-- Nsei Skul: Comprehensive Secondary School Seed Script
-- Standards: MINESEC CBA / APC Compliant (Cameroon Secondary Education)
-- Features:
--   1. Dynamic School & Academic Calendar (3 Terms, 6 Evaluation Sequences)
--   2. 4 Core Departments & 22 Standard Secondary School Subjects
--   3. Complete Classes from Form 1 to Upper Sixth (Cycle 1 & Cycle 2)
--   4. Class Groups / Streams (Form 1 A through Upper Sixth)
--   5. Subject Allocation & Dynamic Coefficients for Every Class Stream
--   6. 140 Enrolled Students (20 Students per Class, Authentic Cameroonian Profiles)
--   7. Repeater Statuses, Guardians, Roll Numbers, and Unique Matricules
--   8. Test Assessment Marks for Sequence 1 & Sequence 2 (Instant Report Cards)
-- Target: Supabase SQL Editor / PostgreSQL
-- ==============================================================================

DO $$
DECLARE
    -- Core Context Variables
    v_school_id UUID;
    v_school_code TEXT;
    v_year_id UUID;
    v_term1_id UUID;
    v_term2_id UUID;
    v_term3_id UUID;
    v_seq1_id UUID;
    v_seq2_id UUID;
    v_seq3_id UUID;
    v_seq4_id UUID;
    v_seq5_id UUID;
    v_seq6_id UUID;

    -- Staff / Teacher profile if present
    v_staff_id UUID;

    -- Department UUIDs
    v_dept_lang UUID;
    v_dept_sci UUID;
    v_dept_hum UUID;
    v_dept_prac UUID;

    -- Class UUIDs
    v_cls_f1 UUID;
    v_cls_f2 UUID;
    v_cls_f3 UUID;
    v_cls_f4 UUID;
    v_cls_f5 UUID;
    v_cls_l6 UUID;
    v_cls_u6 UUID;

    -- Stream UUIDs
    v_strm_f1 UUID;
    v_strm_f2 UUID;
    v_strm_f3 UUID;
    v_strm_f4 UUID;
    v_strm_f5 UUID;
    v_strm_l6 UUID;
    v_strm_u6 UUID;
    v_target_stream_id UUID;

    -- Student tracking
    v_stu_id UUID;
    v_enrol_id UUID;

    -- Loop record variable
    r RECORD;

    -- Test mark computation variables
    v_base NUMERIC;
    v_score1 NUMERIC;
    v_score2 NUMERIC;

    -- Counters
    v_stu_count INT := 0;
    v_marks_count INT := 0;
BEGIN
    -- 0. SCHEMA COMPATIBILITY GUARANTEES
    EXECUTE 'ALTER TABLE public.enrolments ADD COLUMN IF NOT EXISTS is_repeater BOOLEAN NOT NULL DEFAULT false';
    EXECUTE 'ALTER TABLE public.students ADD COLUMN IF NOT EXISTS is_repeater BOOLEAN NOT NULL DEFAULT false';
    EXECUTE 'ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS matricule_format TEXT NOT NULL DEFAULT ''{CODE}-{YEAR}-{SEQ:4}''';
    EXECUTE 'ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS report_card_template TEXT NOT NULL DEFAULT ''cba_grouped_classic''';
    EXECUTE 'ALTER TABLE public.teacher_assignments DROP CONSTRAINT IF EXISTS teacher_assignments_academic_year_id_class_stream_id_subject_id_key';

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'teacher_assignments_year_stream_subject_teacher_key'
    ) THEN
        ALTER TABLE public.teacher_assignments
        ADD CONSTRAINT teacher_assignments_year_stream_subject_teacher_key
        UNIQUE(academic_year_id, class_stream_id, subject_id, teacher_user_id);
    END IF;

    RAISE NOTICE '=========================================================';
    RAISE NOTICE 'Starting Nsei Skul Comprehensive Secondary School Seeding';
    RAISE NOTICE '=========================================================';

    -- ──────────────────────────────────────────────────────────────────────────
    -- 1. TARGET EXACT SCHOOL: Government Bilingual High School Bamenda
    -- ID: 11111111-1111-1111-1111-111111111111 (Code: GBHS-BDA)
    -- ──────────────────────────────────────────────────────────────────────────
    v_school_id := '11111111-1111-1111-1111-111111111111'::uuid;
    v_school_code := 'GBHS-BDA';

    -- Verify or update school metadata
    UPDATE public.schools
    SET name = 'Government Bilingual High School Bamenda',
        code = 'GBHS-BDA',
        matricule_format = '{CODE}-{YEAR}-{SEQ:4}',
        report_card_template = 'cba_grouped_classic',
        is_active = true
    WHERE id = v_school_id;

    IF NOT FOUND THEN
        -- If not found by ID, attempt to find by slug 'gbhs-bamenda'
        SELECT id, code INTO v_school_id, v_school_code
        FROM public.schools
        WHERE slug = 'gbhs-bamenda' OR code IN ('GBHS-BDA', 'GBHS')
        LIMIT 1;

        IF v_school_id IS NULL THEN
            v_school_id := '11111111-1111-1111-1111-111111111111'::uuid;
            v_school_code := 'GBHS-BDA';
            INSERT INTO public.schools (
                id, name, slug, code, motto, address, phone, email, subsystem,
                currency, ranking_mode, result_approval_workflow, receipt_prefix,
                matricule_format, report_card_template, is_active
            ) VALUES (
                v_school_id,
                'Government Bilingual High School Bamenda',
                'gbhs-bamenda',
                'GBHS-BDA',
                'Peace – Work – Fatherland',
                'P.O. Box 24, Up-Station, Bamenda, North West Region, Cameroon',
                '+237 677 000 000',
                'administration@gbhsbamenda.cm',
                'anglophone',
                'XAF',
                'enabled',
                'hod',
                'GBHS-REC',
                '{CODE}-{YEAR}-{SEQ:4}',
                'cba_grouped_classic',
                true
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                code = EXCLUDED.code,
                is_active = true;
        END IF;
    END IF;

    RAISE NOTICE 'Targeting school: Government Bilingual High School Bamenda (ID: %, Code: %)', v_school_id, v_school_code;

    -- Ensure an active subscription exists for GBHS Bamenda
    INSERT INTO public.school_subscriptions (school_id, plan, status, trial_ends_at)
    VALUES (v_school_id, 'standard', 'active', now() + INTERVAL '365 days')
    ON CONFLICT (school_id) DO UPDATE SET status = 'active';

    -- Grant School Administrator membership to all registered users
    -- Ensures your logged in account immediately has full administrative access to this school
    INSERT INTO public.school_memberships (school_id, user_id, role_id, title, status)
    SELECT 
        v_school_id,
        up.id,
        (SELECT id FROM public.roles WHERE code = 'school_admin' LIMIT 1),
        'Principal / School Administrator',
        'active'
    FROM public.user_profiles up
    ON CONFLICT (school_id, user_id) DO UPDATE SET status = 'active';

    -- Detect any active user profile to link as class master/teacher
    SELECT id INTO v_staff_id FROM public.user_profiles ORDER BY created_at ASC LIMIT 1;

    -- ──────────────────────────────────────────────────────────────────────────
    -- 2. ACADEMIC YEAR (2026/2027)
    -- ──────────────────────────────────────────────────────────────────────────
    SELECT id INTO v_year_id FROM public.academic_years WHERE school_id = v_school_id AND is_current = true LIMIT 1;

    IF v_year_id IS NULL THEN
        SELECT id INTO v_year_id FROM public.academic_years WHERE school_id = v_school_id ORDER BY start_date DESC LIMIT 1;
    END IF;

    IF v_year_id IS NULL THEN
        v_year_id := gen_random_uuid();
        INSERT INTO public.academic_years (id, school_id, name, start_date, end_date, is_current)
        VALUES (v_year_id, v_school_id, '2026/2027', '2026-09-07', '2027-06-25', true);
        RAISE NOTICE 'Created Academic Year 2026/2027 (ID: %)', v_year_id;
    ELSE
        UPDATE public.academic_years SET is_current = true WHERE id = v_year_id;
        RAISE NOTICE 'Using Academic Year (ID: %)', v_year_id;
    END IF;

    -- ──────────────────────────────────────────────────────────────────────────
    -- 3. TERMS & 6 EVALUATION SEQUENCES (MINESEC CBA Structure)
    -- ──────────────────────────────────────────────────────────────────────────
    -- Term 1
    SELECT id INTO v_term1_id FROM public.terms WHERE academic_year_id = v_year_id AND term_number = 1 LIMIT 1;
    IF v_term1_id IS NULL THEN
        v_term1_id := gen_random_uuid();
        INSERT INTO public.terms (id, school_id, academic_year_id, term_number, name, start_date, end_date, is_active)
        VALUES (v_term1_id, v_school_id, v_year_id, 1, 'First Term', '2026-09-07', '2026-12-18', true);
    ELSE
        UPDATE public.terms SET is_active = true WHERE id = v_term1_id;
    END IF;

    -- Term 2
    SELECT id INTO v_term2_id FROM public.terms WHERE academic_year_id = v_year_id AND term_number = 2 LIMIT 1;
    IF v_term2_id IS NULL THEN
        v_term2_id := gen_random_uuid();
        INSERT INTO public.terms (id, school_id, academic_year_id, term_number, name, start_date, end_date, is_active)
        VALUES (v_term2_id, v_school_id, v_year_id, 2, 'Second Term', '2027-01-04', '2027-03-26', false);
    END IF;

    -- Term 3
    SELECT id INTO v_term3_id FROM public.terms WHERE academic_year_id = v_year_id AND term_number = 3 LIMIT 1;
    IF v_term3_id IS NULL THEN
        v_term3_id := gen_random_uuid();
        INSERT INTO public.terms (id, school_id, academic_year_id, term_number, name, start_date, end_date, is_active)
        VALUES (v_term3_id, v_school_id, v_year_id, 3, 'Third Term', '2027-04-12', '2027-06-25', false);
    END IF;

    -- Sequences 1 to 6
    -- Seq 1
    SELECT id INTO v_seq1_id FROM public.evaluation_sequences WHERE term_id = v_term1_id AND sequence_number = 1 LIMIT 1;
    IF v_seq1_id IS NULL THEN
        v_seq1_id := gen_random_uuid();
        INSERT INTO public.evaluation_sequences (id, school_id, term_id, sequence_number, name, start_date, end_date, is_open_for_marks)
        VALUES (v_seq1_id, v_school_id, v_term1_id, 1, 'Sequence 1', '2026-09-07', '2026-10-23', true);
    ELSE
        UPDATE public.evaluation_sequences SET is_open_for_marks = true WHERE id = v_seq1_id;
    END IF;

    -- Seq 2
    SELECT id INTO v_seq2_id FROM public.evaluation_sequences WHERE term_id = v_term1_id AND sequence_number = 2 LIMIT 1;
    IF v_seq2_id IS NULL THEN
        v_seq2_id := gen_random_uuid();
        INSERT INTO public.evaluation_sequences (id, school_id, term_id, sequence_number, name, start_date, end_date, is_open_for_marks)
        VALUES (v_seq2_id, v_school_id, v_term1_id, 2, 'Sequence 2', '2026-10-26', '2026-12-18', true);
    ELSE
        UPDATE public.evaluation_sequences SET is_open_for_marks = true WHERE id = v_seq2_id;
    END IF;

    -- Seq 3 & 4 (Term 2)
    SELECT id INTO v_seq3_id FROM public.evaluation_sequences WHERE term_id = v_term2_id AND sequence_number = 3 LIMIT 1;
    IF v_seq3_id IS NULL THEN
        v_seq3_id := gen_random_uuid();
        INSERT INTO public.evaluation_sequences (id, school_id, term_id, sequence_number, name, start_date, end_date, is_open_for_marks)
        VALUES (v_seq3_id, v_school_id, v_term2_id, 3, 'Sequence 3', '2027-01-04', '2027-02-12', false);
    END IF;

    SELECT id INTO v_seq4_id FROM public.evaluation_sequences WHERE term_id = v_term2_id AND sequence_number = 4 LIMIT 1;
    IF v_seq4_id IS NULL THEN
        v_seq4_id := gen_random_uuid();
        INSERT INTO public.evaluation_sequences (id, school_id, term_id, sequence_number, name, start_date, end_date, is_open_for_marks)
        VALUES (v_seq4_id, v_school_id, v_term2_id, 4, 'Sequence 4', '2027-02-15', '2027-03-26', false);
    END IF;

    -- Seq 5 & 6 (Term 3)
    SELECT id INTO v_seq5_id FROM public.evaluation_sequences WHERE term_id = v_term3_id AND sequence_number = 5 LIMIT 1;
    IF v_seq5_id IS NULL THEN
        v_seq5_id := gen_random_uuid();
        INSERT INTO public.evaluation_sequences (id, school_id, term_id, sequence_number, name, start_date, end_date, is_open_for_marks)
        VALUES (v_seq5_id, v_school_id, v_term3_id, 5, 'Sequence 5', '2027-04-12', '2027-05-14', false);
    END IF;

    SELECT id INTO v_seq6_id FROM public.evaluation_sequences WHERE term_id = v_term3_id AND sequence_number = 6 LIMIT 1;
    IF v_seq6_id IS NULL THEN
        v_seq6_id := gen_random_uuid();
        INSERT INTO public.evaluation_sequences (id, school_id, term_id, sequence_number, name, start_date, end_date, is_open_for_marks)
        VALUES (v_seq6_id, v_school_id, v_term3_id, 6, 'Sequence 6', '2027-05-17', '2027-06-25', false);
    END IF;

    -- ──────────────────────────────────────────────────────────────────────────
    -- 4. DEPARTMENTS
    -- ──────────────────────────────────────────────────────────────────────────
    -- Languages & Letters
    INSERT INTO public.departments (school_id, name, code, description)
    VALUES (v_school_id, 'Languages & Letters', 'LANG', 'English, French, Literature, National and International Languages')
    ON CONFLICT (school_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_dept_lang;

    -- Sciences & Mathematics
    INSERT INTO public.departments (school_id, name, code, description)
    VALUES (v_school_id, 'Sciences & Mathematics', 'SCIMATH', 'Mathematics, Physics, Chemistry, Biology, Further Mathematics')
    ON CONFLICT (school_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_dept_sci;

    -- Human Sciences & Commercial
    INSERT INTO public.departments (school_id, name, code, description)
    VALUES (v_school_id, 'Human Sciences & Commercial', 'HUMCOM', 'History, Geography, Citizenship, Economics, Commerce, Accounting')
    ON CONFLICT (school_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_dept_hum;

    -- Practical Arts, Sports & ICT
    INSERT INTO public.departments (school_id, name, code, description)
    VALUES (v_school_id, 'Practical, Technical & Sports', 'PRAC', 'Computer Science, Sports & Physical Education, Manual Labour, Arts')
    ON CONFLICT (school_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_dept_prac;

    RAISE NOTICE 'Seeded 4 core departments.';

    -- ──────────────────────────────────────────────────────────────────────────
    -- 5. COMMON SECONDARY SCHOOL SUBJECTS (22 Subjects)
    -- ──────────────────────────────────────────────────────────────────────────
    -- Department: Languages
    INSERT INTO public.subjects (school_id, department_id, name, code, default_coefficient, default_max_marks)
    VALUES
        (v_school_id, v_dept_lang, 'English Language', 'ENG', 4.00, 20.00),
        (v_school_id, v_dept_lang, 'French', 'FRE', 4.00, 20.00),
        (v_school_id, v_dept_lang, 'Literature in English', 'LIT', 3.00, 20.00),
        (v_school_id, v_dept_lang, 'Chinese', 'CHI', 2.00, 20.00)
    ON CONFLICT (school_id, code) DO UPDATE SET 
        name = EXCLUDED.name, 
        default_coefficient = EXCLUDED.default_coefficient;

    -- Department: Sciences & Mathematics
    INSERT INTO public.subjects (school_id, department_id, name, code, default_coefficient, default_max_marks)
    VALUES
        (v_school_id, v_dept_sci, 'Mathematics', 'MATH', 4.00, 20.00),
        (v_school_id, v_dept_sci, 'Biology', 'BIO', 3.00, 20.00),
        (v_school_id, v_dept_sci, 'Chemistry', 'CHEM', 3.00, 20.00),
        (v_school_id, v_dept_sci, 'Physics', 'PHY', 3.00, 20.00),
        (v_school_id, v_dept_sci, 'Further Mathematics', 'FMATH', 3.00, 20.00)
    ON CONFLICT (school_id, code) DO UPDATE SET 
        name = EXCLUDED.name, 
        default_coefficient = EXCLUDED.default_coefficient;

    -- Department: Human Sciences & Commercial
    INSERT INTO public.subjects (school_id, department_id, name, code, default_coefficient, default_max_marks)
    VALUES
        (v_school_id, v_dept_hum, 'History', 'HIST', 3.00, 20.00),
        (v_school_id, v_dept_hum, 'Geography', 'GEO', 3.00, 20.00),
        (v_school_id, v_dept_hum, 'Citizenship Education', 'CIT', 2.00, 20.00),
        (v_school_id, v_dept_hum, 'Economics', 'ECON', 3.00, 20.00),
        (v_school_id, v_dept_hum, 'Commerce', 'COMM', 2.00, 20.00),
        (v_school_id, v_dept_hum, 'Accounting', 'ACC', 3.00, 20.00),
        (v_school_id, v_dept_hum, 'Business Mathematics', 'BMATH', 3.00, 20.00),
        (v_school_id, v_dept_hum, 'Religious Studies', 'REL', 2.00, 20.00)
    ON CONFLICT (school_id, code) DO UPDATE SET 
        name = EXCLUDED.name, 
        default_coefficient = EXCLUDED.default_coefficient;

    -- Department: Practical, Sports & Arts
    INSERT INTO public.subjects (school_id, department_id, name, code, default_coefficient, default_max_marks)
    VALUES
        (v_school_id, v_dept_prac, 'Computer Science', 'CS', 3.00, 20.00),
        (v_school_id, v_dept_prac, 'Physical Education', 'PE', 1.00, 20.00),
        (v_school_id, v_dept_prac, 'Manual Labour', 'ML', 1.00, 20.00),
        (v_school_id, v_dept_prac, 'Health Science', 'HS', 2.00, 20.00),
        (v_school_id, v_dept_prac, 'Art & Craft', 'ART', 1.00, 20.00)
    ON CONFLICT (school_id, code) DO UPDATE SET 
        name = EXCLUDED.name, 
        default_coefficient = EXCLUDED.default_coefficient;

    RAISE NOTICE 'Seeded 22 secondary school subjects.';

    -- ──────────────────────────────────────────────────────────────────────────
    -- 6. CLASSES FROM FORM 1 TO UPPER SIXTH (7 Classes)
    -- ──────────────────────────────────────────────────────────────────────────
    INSERT INTO public.classes (school_id, name, level_order, cycle)
    VALUES (v_school_id, 'Form 1', 1, 'cycle_1')
    ON CONFLICT (school_id, name) DO UPDATE SET level_order = 1
    RETURNING id INTO v_cls_f1;

    INSERT INTO public.classes (school_id, name, level_order, cycle)
    VALUES (v_school_id, 'Form 2', 2, 'cycle_1')
    ON CONFLICT (school_id, name) DO UPDATE SET level_order = 2
    RETURNING id INTO v_cls_f2;

    INSERT INTO public.classes (school_id, name, level_order, cycle)
    VALUES (v_school_id, 'Form 3', 3, 'cycle_1')
    ON CONFLICT (school_id, name) DO UPDATE SET level_order = 3
    RETURNING id INTO v_cls_f3;

    INSERT INTO public.classes (school_id, name, level_order, cycle)
    VALUES (v_school_id, 'Form 4', 4, 'cycle_1')
    ON CONFLICT (school_id, name) DO UPDATE SET level_order = 4
    RETURNING id INTO v_cls_f4;

    INSERT INTO public.classes (school_id, name, level_order, cycle)
    VALUES (v_school_id, 'Form 5', 5, 'cycle_1')
    ON CONFLICT (school_id, name) DO UPDATE SET level_order = 5
    RETURNING id INTO v_cls_f5;

    INSERT INTO public.classes (school_id, name, level_order, cycle)
    VALUES (v_school_id, 'Lower Sixth', 6, 'cycle_2')
    ON CONFLICT (school_id, name) DO UPDATE SET level_order = 6
    RETURNING id INTO v_cls_l6;

    INSERT INTO public.classes (school_id, name, level_order, cycle)
    VALUES (v_school_id, 'Upper Sixth', 7, 'cycle_2')
    ON CONFLICT (school_id, name) DO UPDATE SET level_order = 7
    RETURNING id INTO v_cls_u6;

    RAISE NOTICE 'Seeded 7 classes: Form 1 through Upper Sixth.';

    -- ──────────────────────────────────────────────────────────────────────────
    -- 7. CLASS STREAMS / CLASS GROUPS (1 per class)
    -- ──────────────────────────────────────────────────────────────────────────
    -- Form 1 A
    INSERT INTO public.class_streams (school_id, class_id, academic_year_id, name, stream_tag, class_master_id)
    VALUES (v_school_id, v_cls_f1, v_year_id, 'Form 1 A', 'A', v_staff_id)
    ON CONFLICT (academic_year_id, class_id, name) DO UPDATE SET stream_tag = 'A'
    RETURNING id INTO v_strm_f1;

    -- Form 2 A
    INSERT INTO public.class_streams (school_id, class_id, academic_year_id, name, stream_tag, class_master_id)
    VALUES (v_school_id, v_cls_f2, v_year_id, 'Form 2 A', 'A', v_staff_id)
    ON CONFLICT (academic_year_id, class_id, name) DO UPDATE SET stream_tag = 'A'
    RETURNING id INTO v_strm_f2;

    -- Form 3 A
    INSERT INTO public.class_streams (school_id, class_id, academic_year_id, name, stream_tag, class_master_id)
    VALUES (v_school_id, v_cls_f3, v_year_id, 'Form 3 A', 'A', v_staff_id)
    ON CONFLICT (academic_year_id, class_id, name) DO UPDATE SET stream_tag = 'A'
    RETURNING id INTO v_strm_f3;

    -- Form 4 A
    INSERT INTO public.class_streams (school_id, class_id, academic_year_id, name, stream_tag, class_master_id)
    VALUES (v_school_id, v_cls_f4, v_year_id, 'Form 4 A', 'A', v_staff_id)
    ON CONFLICT (academic_year_id, class_id, name) DO UPDATE SET stream_tag = 'A'
    RETURNING id INTO v_strm_f4;

    -- Form 5 A
    INSERT INTO public.class_streams (school_id, class_id, academic_year_id, name, stream_tag, class_master_id)
    VALUES (v_school_id, v_cls_f5, v_year_id, 'Form 5 A', 'A', v_staff_id)
    ON CONFLICT (academic_year_id, class_id, name) DO UPDATE SET stream_tag = 'A'
    RETURNING id INTO v_strm_f5;

    -- Lower Sixth Arts & Science
    INSERT INTO public.class_streams (school_id, class_id, academic_year_id, name, stream_tag, class_master_id)
    VALUES (v_school_id, v_cls_l6, v_year_id, 'Lower Sixth General', 'General', v_staff_id)
    ON CONFLICT (academic_year_id, class_id, name) DO UPDATE SET stream_tag = 'General'
    RETURNING id INTO v_strm_l6;

    -- Upper Sixth Arts & Science
    INSERT INTO public.class_streams (school_id, class_id, academic_year_id, name, stream_tag, class_master_id)
    VALUES (v_school_id, v_cls_u6, v_year_id, 'Upper Sixth General', 'General', v_staff_id)
    ON CONFLICT (academic_year_id, class_id, name) DO UPDATE SET stream_tag = 'General'
    RETURNING id INTO v_strm_u6;

    RAISE NOTICE 'Seeded 7 class streams.';

    -- ──────────────────────────────────────────────────────────────────────────
    -- 8. CONFIGURE CLASS SUBJECTS & COEFFICIENTS
    -- ──────────────────────────────────────────────────────────────────────────
    -- Assign subjects across class streams with default coefficients
    INSERT INTO public.class_subjects (school_id, class_stream_id, subject_id, coefficient, max_marks, is_compulsory)
    SELECT 
        v_school_id,
        strm.id,
        sub.id,
        sub.default_coefficient,
        sub.default_max_marks,
        true
    FROM public.class_streams strm
    CROSS JOIN public.subjects sub
    WHERE strm.school_id = v_school_id 
      AND strm.academic_year_id = v_year_id
      AND sub.school_id = v_school_id
    ON CONFLICT (class_stream_id, subject_id) DO NOTHING;

    RAISE NOTICE 'Allocated subjects and coefficients to all 7 class streams.';

    -- ──────────────────────────────────────────────────────────────────────────
    -- 9. STUDENTS & ENROLMENTS (140 Students: 20 per class)
    -- ──────────────────────────────────────────────────────────────────────────
    -- Temporary table to hold 140 student profiles
    CREATE TEMP TABLE tmp_seed_students (
        roll_num INT,
        class_target INT, -- 1=F1, 2=F2, 3=F3, 4=F4, 5=F5, 6=L6, 7=U6
        mat_suffix TEXT,
        f_name TEXT,
        l_name TEXT,
        sex TEXT,
        dob DATE,
        pob TEXT,
        guardian TEXT,
        g_phone TEXT,
        is_rep BOOLEAN
    ) ON COMMIT DROP;

    INSERT INTO tmp_seed_students VALUES
    -- ── CLASS 1: FORM 1 A (20 Students, ~11-12 yrs old) ──────────────────────
    (1, 1, '0001', 'Kelly', 'Nforbi', 'F', '2015-04-12', 'Bamenda', 'Pa Nforbi Emmanuel', '+237 677 88 99 01', false),
    (2, 1, '0002', 'Derick', 'Che', 'M', '2015-09-21', 'Mankon', 'Mamma Che Comfort', '+237 675 44 33 02', false),
    (3, 1, '0003', 'Blessing', 'Mbi', 'F', '2015-01-15', 'Bali Nyonga', 'Mr Mbi Divine', '+237 678 11 22 03', false),
    (4, 1, '0004', 'Precious', 'Tita', 'M', '2015-11-03', 'Bafut', 'Mme Tita Rosaline', '+237 674 55 66 04', false),
    (5, 1, '0005', 'Cedric', 'Fon', 'M', '2014-03-18', 'Kumbo', 'Pa Fon Stephen', '+237 677 12 34 05', false),
    (6, 1, '0006', 'Nathalie', 'Biya', 'F', '2015-06-25', 'Yaounde', 'Dr Biya Paulin', '+237 699 22 33 06', false),
    (7, 1, '0007', 'Kelvin', 'Kamga', 'M', '2014-08-30', 'Bafoussam', 'Mme Kamga Therese', '+237 671 45 67 07', false),
    (8, 1, '0008', 'Faith', 'Tchinda', 'F', '2015-02-14', 'Douala', 'Mr Tchinda Lucas', '+237 694 56 78 08', false),
    (9, 1, '0009', 'Collins', 'Fru', 'M', '2014-12-05', 'Bamenda', 'Pa Fru Peter', '+237 679 88 77 09', false),
    (10, 1, '0010', 'Miracle', 'Niba', 'F', '2015-05-19', 'Santa', 'Mamma Niba Esther', '+237 670 12 34 10', false),
    (11, 1, '0011', 'Christelle', 'Asanji', 'F', '2014-07-22', 'Mankon', 'Mr Asanji Martin', '+237 672 34 56 11', false),
    (12, 1, '0012', 'Gilles', 'Ambe', 'M', '2015-10-11', 'Bafut', 'Mme Ambe Beatrice', '+237 673 45 67 12', false),
    (13, 1, '0013', 'Stephanie', 'Nebafru', 'F', '2014-01-29', 'Bamenda', 'Pa Nebafru Joseph', '+237 676 56 78 13', false),
    (14, 1, '0014', 'Desmond', 'Suh', 'M', '2015-03-08', 'Nkwen', 'Mamma Suh Grace', '+237 675 67 89 14', true),
    (15, 1, '0015', 'Paul', 'Mankaa', 'M', '2015-09-17', 'Bali', 'Mr Mankaa Thomas', '+237 674 78 90 15', false),
    (16, 1, '0016', 'Mary', 'Nji', 'F', '2014-11-20', 'Tubah', 'Mme Nji Florence', '+237 678 89 01 16', false),
    (17, 1, '0017', 'Daniel', 'Acha', 'M', '2015-04-03', 'Batibo', 'Pa Acha Francis', '+237 677 90 12 17', false),
    (18, 1, '0018', 'Grace', 'Bih', 'F', '2014-08-16', 'Mbengwi', 'Mamma Bih Sarah', '+237 671 01 23 18', false),
    (19, 1, '0019', 'Samuel', 'Taku', 'M', '2015-12-24', 'Buea', 'Mr Taku Andrew', '+237 690 12 34 19', false),
    (20, 1, '0020', 'Joy', 'Besong', 'F', '2014-02-11', 'Mamfe', 'Mme Besong Alice', '+237 691 23 45 20', false),

    -- ── CLASS 2: FORM 2 A (20 Students, includes demo samples) ───────────────
    (1, 2, '0021', 'Precilia', 'Ngomende', 'F', '2013-05-14', 'Bamenda', 'Madam Ngomende Helen', '+237 677 00 11 21', false),
    (2, 2, '0022', 'Favour', 'Ntam', 'F', '2013-10-22', 'Kumbo', 'Pa Ntam Sylvester', '+237 675 11 22 22', false),
    (3, 2, '0023', 'Favour', 'Temban', 'F', '2013-03-09', 'Bali Nyonga', 'Mr Temban George', '+237 678 22 33 23', false),
    (4, 2, '0024', 'Favour', 'Tipelenuh', 'F', '2013-11-30', 'Bafut', 'Mamma Tipelenuh Ruth', '+237 674 33 44 24', false),
    (5, 2, '0025', 'Shanevia Erica', 'Tsobona', 'F', '2013-07-04', 'Bamenda', 'Dr Tsobona Daniel', '+237 677 44 55 25', false),
    (6, 2, '0026', 'Boris', 'Fomban', 'M', '2013-01-19', 'Nkwen', 'Pa Thomas Fomban', '+237 671 55 66 26', false),
    (7, 2, '0027', 'Emmanuel', 'Nformi', 'M', '2012-08-15', 'Tabenken', 'Madam Nformi Beatrice', '+237 699 66 77 27', false),
    (8, 2, '0028', 'Junior', 'Tanjong', 'M', '2013-06-28', 'Mbengwi', 'Mr Tanjong Simon', '+237 694 77 88 28', false),
    (9, 2, '0029', 'Divine', 'Mbah', 'M', '2012-12-10', 'Batibo', 'Pa Mbah Christopher', '+237 679 88 99 29', true),
    (10, 2, '0030', 'Brenda', 'Nkwenti', 'F', '2013-04-05', 'Bafut', 'Mme Nkwenti Agnes', '+237 670 99 00 30', false),
    (11, 2, '0031', 'Roland', 'Tabi', 'M', '2013-09-12', 'Buea', 'Pa Tabi Roland', '+237 672 10 21 31', false),
    (12, 2, '0032', 'Beatrice', 'Eyong', 'F', '2013-02-18', 'Kumba', 'Mamma Eyong Mary', '+237 673 21 32 32', false),
    (13, 2, '0033', 'Bertrand', 'Tambe', 'M', '2012-11-25', 'Mamfe', 'Mr Tambe Victor', '+237 676 32 43 33', false),
    (14, 2, '0034', 'Solange', 'Ashu', 'F', '2013-08-07', 'Limbe', 'Mme Ashu Catherine', '+237 675 43 54 34', false),
    (15, 2, '0035', 'Kingsley', 'Agbor', 'M', '2013-05-30', 'Tiko', 'Pa Agbor Kingsley', '+237 674 54 65 35', false),
    (16, 2, '0036', 'Prudence', 'Enow', 'F', '2012-10-14', 'Yaounde', 'Dr Enow George', '+237 678 65 76 36', false),
    (17, 2, '0037', 'Elvis', 'Arrey', 'M', '2013-03-23', 'Douala', 'Mr Arrey Robert', '+237 677 76 87 37', false),
    (18, 2, '0038', 'Patience', 'Ayuk', 'F', '2013-07-17', 'Bamenda', 'Mamma Ayuk Judith', '+237 671 87 98 38', false),
    (19, 2, '0039', 'Arnold', 'Eta', 'M', '2012-09-02', 'Bafoussam', 'Pa Eta William', '+237 690 98 09 39', false),
    (20, 2, '0040', 'Vanessa', 'Mengot', 'F', '2013-12-08', 'Buea', 'Mme Mengot Evelyn', '+237 691 09 10 40', false),

    -- ── CLASS 3: FORM 3 A (20 Students, ~13-14 yrs old) ──────────────────────
    (1, 3, '0041', 'Patrick', 'Orock', 'M', '2012-04-10', 'Mamfe', 'Pa Orock James', '+237 677 11 22 41', false),
    (2, 3, '0042', 'Clarisse', 'Ebot', 'F', '2012-09-15', 'Kumba', 'Mme Ebot Martha', '+237 675 22 33 42', false),
    (3, 3, '0043', 'Donald', 'Ndifor', 'M', '2011-12-20', 'Bamenda', 'Mr Ndifor Lucas', '+237 678 33 44 43', false),
    (4, 3, '0044', 'Audrey', 'Wanki', 'F', '2012-06-03', 'Mankon', 'Mamma Wanki Clara', '+237 674 44 55 44', false),
    (5, 3, '0045', 'Frank', 'Abanda', 'M', '2012-02-28', 'Yaounde', 'Dr Abanda Pierre', '+237 677 55 66 45', false),
    (6, 3, '0046', 'Emilienne', 'Manga', 'F', '2011-08-14', 'Douala', 'Mme Manga Suzanne', '+237 699 66 77 46', false),
    (7, 3, '0047', 'Cyril', 'Ndive', 'M', '2012-10-09', 'Buea', 'Pa Ndive John', '+237 671 77 88 47', false),
    (8, 3, '0048', 'Constance', 'Luma', 'F', '2012-01-25', 'Limbe', 'Mr Luma David', '+237 694 88 99 48', false),
    (9, 3, '0049', 'Fabrice', 'Efange', 'M', '2011-11-11', 'Tiko', 'Mme Efange Rose', '+237 679 99 00 49', true),
    (10, 3, '0050', 'Esther', 'Moki', 'F', '2012-05-19', 'Buea', 'Pa Moki Arthur', '+237 670 00 11 50', false),
    (11, 3, '0051', 'Herve', 'Ikome', 'M', '2012-07-27', 'Limbe', 'Mr Ikome Daniel', '+237 672 11 22 51', false),
    (12, 3, '0052', 'Judith', 'Ngale', 'F', '2011-03-16', 'Bota', 'Mamma Ngale Dorothy', '+237 673 22 33 52', false),
    (13, 3, '0053', 'Yannick', 'Nganje', 'M', '2012-09-05', 'Kumba', 'Pa Nganje Samuel', '+237 676 33 44 53', false),
    (14, 3, '0054', 'Laure', 'Monyongo', 'F', '2012-12-18', 'Kumbo', 'Mme Monyongo Theresa', '+237 675 44 55 54', false),
    (15, 3, '0055', 'Brice', 'Njoh', 'M', '2011-04-22', 'Douala', 'Dr Njoh Henri', '+237 674 55 66 55', false),
    (16, 3, '0056', 'Sandrine', 'Ewande', 'F', '2012-08-30', 'Edéa', 'Mamma Ewande Jeanne', '+237 678 66 77 56', false),
    (17, 3, '0057', 'Thierry', 'Ngando', 'M', '2012-02-04', 'Nkongsamba', 'Pa Ngando Joseph', '+237 677 77 88 57', false),
    (18, 3, '0058', 'Chantal', 'Diboundje', 'F', '2011-10-12', 'Douala', 'Mr Diboundje Paul', '+237 671 88 99 58', false),
    (19, 3, '0059', 'Achille', 'Mouelle', 'M', '2012-06-21', 'Yaounde', 'Mme Mouelle Marie', '+237 690 99 00 59', false),
    (20, 3, '0060', 'Yvette', 'Belinga', 'F', '2012-01-08', 'Ebolowa', 'Dr Belinga Gaston', '+237 691 00 11 60', false),

    -- ── CLASS 4: FORM 4 A (20 Students, ~14-15 yrs old) ──────────────────────
    (1, 4, '0061', 'Rodrique', 'Essomba', 'M', '2011-03-14', 'Yaounde', 'Pa Essomba Luc', '+237 677 01 12 61', false),
    (2, 4, '0062', 'Nadege', 'Atangana', 'F', '2011-09-20', 'Mbalmayo', 'Mme Atangana Cecile', '+237 675 12 23 62', false),
    (3, 4, '0063', 'Serge', 'Mbarga', 'M', '2010-12-05', 'Yaounde', 'Mr Mbarga Felix', '+237 678 23 34 63', false),
    (4, 4, '0064', 'Valerie', 'Owona', 'F', '2011-05-18', 'Sangmelima', 'Mamma Owona Bernadette', '+237 674 34 45 64', false),
    (5, 4, '0065', 'Arnaud', 'Ondoa', 'M', '2011-08-22', 'Ebolowa', 'Pa Ondoa Charles', '+237 677 45 56 65', false),
    (6, 4, '0066', 'Josiane', 'Nguema', 'F', '2010-04-11', 'Bafia', 'Dr Nguema Antoine', '+237 699 56 67 66', false),
    (7, 4, '0067', 'Felix', 'Mballa', 'M', '2011-11-29', 'Yaounde', 'Mr Mballa Norbert', '+237 671 67 78 67', false),
    (8, 4, '0068', 'Carine', 'Abessolo', 'F', '2011-02-15', 'Kribi', 'Mme Abessolo Francoise', '+237 694 78 89 68', false),
    (9, 4, '0069', 'Ghislain', 'Fouda', 'M', '2010-07-08', 'Obala', 'Pa Fouda Michel', '+237 679 89 90 69', true),
    (10, 4, '0070', 'Rosine', 'Mvondo', 'F', '2011-10-25', 'Yaounde', 'Mamma Mvondo Christine', '+237 670 90 01 70', false),
    (11, 4, '0071', 'Blaise', 'Tchouassi', 'M', '2011-01-30', 'Bafoussam', 'Mr Tchouassi Guy', '+237 672 01 12 71', false),
    (12, 4, '0072', 'Georgette', 'Kenfack', 'F', '2011-06-12', 'Dschang', 'Mme Kenfack Madeleine', '+237 673 12 23 72', false),
    (13, 4, '0073', 'Guy', 'Dongmo', 'M', '2010-10-03', 'Mbouda', 'Pa Dongmo Jean', '+237 676 23 34 73', false),
    (14, 4, '0074', 'Monique', 'Fotso', 'F', '2011-04-17', 'Bandjoun', 'Mamma Fotso Elisabeth', '+237 675 34 45 74', false),
    (15, 4, '0075', 'Alain', 'Tagne', 'M', '2011-08-09', 'Baham', 'Dr Tagne Emmanuel', '+237 674 45 56 75', false),
    (16, 4, '0076', 'Colette', 'Kamdem', 'F', '2010-12-24', 'Bafoussam', 'Mr Kamdem Robert', '+237 678 56 67 76', false),
    (17, 4, '0077', 'Christian', 'Kuate', 'M', '2011-03-02', 'Bafang', 'Pa Kuate Philippe', '+237 677 67 78 77', false),
    (18, 4, '0078', 'Victoire', 'Wambo', 'F', '2011-07-19', 'Bangangte', 'Mme Wambo Brigitte', '+237 671 78 89 78', false),
    (19, 4, '0079', 'Arthur', 'Simoni', 'M', '2010-11-13', 'Foumban', 'Pa Simoni Oumarou', '+237 690 89 90 79', false),
    (20, 4, '0080', 'Eveline', 'Njoya', 'F', '2011-05-27', 'Foumbot', 'Mamma Njoya Aicha', '+237 691 90 01 80', false),

    -- ── CLASS 5: FORM 5 A (20 Students, ~15-16 yrs old) ──────────────────────
    (1, 5, '0081', 'Prosper', 'Kouam', 'M', '2010-02-14', 'Douala', 'Mr Kouam Roger', '+237 677 12 23 81', false),
    (2, 5, '0082', 'Dorine', 'Deffo', 'F', '2010-09-08', 'Bafoussam', 'Mme Deffo Martine', '+237 675 23 34 82', false),
    (3, 5, '0083', 'Victor', 'Djomo', 'M', '2009-11-21', 'Yaounde', 'Pa Djomo Sylvain', '+237 678 34 45 83', false),
    (4, 5, '0084', 'Antoinette', 'Tcheuko', 'F', '2010-06-17', 'Bafang', 'Mamma Tcheuko Sylvie', '+237 674 45 56 84', false),
    (5, 5, '0085', 'Bertin', 'Nguemo', 'M', '2010-01-05', 'Dschang', 'Dr Nguemo Patrice', '+237 677 56 67 85', false),
    (6, 5, '0086', 'Florence', 'Sop', 'F', '2009-08-30', 'Bamenda', 'Mme Sop Pauline', '+237 699 67 78 86', false),
    (7, 5, '0087', 'Marc', 'Tientcheu', 'M', '2010-10-12', 'Nkongsamba', 'Pa Tientcheu Andre', '+237 671 78 89 87', false),
    (8, 5, '0088', 'Gisele', 'Ngassa', 'F', '2010-04-26', 'Douala', 'Mr Ngassa Jacques', '+237 694 89 90 88', false),
    (9, 5, '0089', 'Armand', 'Pokam', 'M', '2009-12-03', 'Bafoussam', 'Pa Pokam David', '+237 679 90 01 89', true),
    (10, 5, '0090', 'Ines', 'Noubissi', 'F', '2010-07-15', 'Bandjoun', 'Mamma Noubissi Therese', '+237 670 01 12 90', false),
    (11, 5, '0091', 'Herve', 'Tagne', 'M', '2010-03-29', 'Yaounde', 'Dr Tagne Samuel', '+237 672 12 23 91', false),
    (12, 5, '0092', 'Christelle', 'Wandji', 'F', '2010-08-11', 'Buea', 'Mme Wandji Carine', '+237 673 23 34 92', false),
    (13, 5, '0093', 'Rodrigue', 'Kaptue', 'M', '2009-10-19', 'Bafoussam', 'Pa Kaptue Joseph', '+237 676 34 45 93', false),
    (14, 5, '0094', 'Solange', 'Yomi', 'F', '2010-05-02', 'Limbe', 'Mamma Yomi Beatrice', '+237 675 45 56 94', false),
    (15, 5, '0095', 'Jules', 'Mekontso', 'M', '2010-09-24', 'Dschang', 'Mr Mekontso Paul', '+237 674 56 67 95', false),
    (16, 5, '0096', 'Bernadette', 'Tchoffo', 'F', '2009-02-16', 'Bafang', 'Mme Tchoffo Marie', '+237 678 67 78 96', false),
    (17, 5, '0097', 'Boris', 'Djuidje', 'M', '2010-11-07', 'Douala', 'Pa Djuidje Daniel', '+237 677 78 89 97', false),
    (18, 5, '0098', 'Murielle', 'Kougang', 'F', '2010-04-18', 'Kumba', 'Dr Kougang Alice', '+237 671 89 90 98', false),
    (19, 5, '0099', 'Stephane', 'Dzudie', 'M', '2009-06-25', 'Yaounde', 'Mr Dzudie Pierre', '+237 690 90 01 99', false),
    (20, 5, '0100', 'Raissa', 'Metangmo', 'F', '2010-01-31', 'Bafoussam', 'Mme Metangmo Rose', '+237 691 01 12 00', false),

    -- ── CLASS 6: LOWER SIXTH (20 Students, ~16-17 yrs old) ───────────────────
    (1, 6, '0101', 'William', 'Ngu', 'M', '2009-03-12', 'Bamenda', 'Pa Ngu Christopher', '+237 677 22 33 01', false),
    (2, 6, '0102', 'Linda', 'Fuh', 'F', '2009-07-28', 'Mankon', 'Mamma Fuh Grace', '+237 675 33 44 02', false),
    (3, 6, '0103', 'Richard', 'Buma', 'M', '2008-11-15', 'Bali', 'Mr Buma Thomas', '+237 678 44 55 03', false),
    (4, 6, '0104', 'Sonia', 'Gana', 'F', '2009-05-09', 'Santa', 'Mme Gana Helen', '+237 674 55 66 04', false),
    (5, 6, '0105', 'Edwin', 'Ndoping', 'M', '2009-01-22', 'Bafut', 'Pa Ndoping Michael', '+237 677 66 77 05', false),
    (6, 6, '0106', 'Fabiola', 'Ayeah', 'F', '2008-09-03', 'Kumbo', 'Dr Ayeah Bernard', '+237 699 77 88 06', false),
    (7, 6, '0107', 'Gilbert', 'Bung', 'M', '2009-10-18', 'Ndu', 'Mme Bung Elizabeth', '+237 671 88 99 07', false),
    (8, 6, '0108', 'Miriam', 'Nkwi', 'F', '2009-04-14', 'Kom', 'Pa Nkwi Anthony', '+237 694 99 00 08', false),
    (9, 6, '0109', 'Justin', 'Ndze', 'M', '2008-12-07', 'Jakiri', 'Mr Ndze Peter', '+237 679 00 11 09', true),
    (10, 6, '0110', 'Kelly', 'Kinyuy', 'F', '2009-06-20', 'Kumbo', 'Mamma Kinyuy Clara', '+237 670 11 22 10', false),
    (11, 6, '0111', 'George', 'Dzekashu', 'M', '2009-02-17', 'Shisong', 'Pa Dzekashu Francis', '+237 672 22 33 11', false),
    (12, 6, '0112', 'Emelda', 'Bongfen', 'F', '2009-08-25', 'Nkar', 'Mme Bongfen Veronica', '+237 673 33 44 12', false),
    (13, 6, '0113', 'Bertrand', 'Lendzele', 'M', '2008-10-31', 'Kumbo', 'Mr Lendzele Joseph', '+237 676 44 55 13', false),
    (14, 6, '0114', 'Nadine', 'Wirba', 'F', '2009-03-05', 'Tatum', 'Mamma Wirba Agnes', '+237 675 55 66 14', false),
    (15, 6, '0115', 'Franklin', 'Yufenyuy', 'M', '2009-09-19', 'Nso', 'Dr Yufenyuy Martin', '+237 674 66 77 15', false),
    (16, 6, '0116', 'Larissa', 'Berinyuy', 'F', '2008-01-11', 'Kumbo', 'Pa Berinyuy Paul', '+237 678 77 88 16', false),
    (17, 6, '0117', 'Martin', 'Wirsiy', 'M', '2009-11-28', 'Djottin', 'Mme Wirsiy Therese', '+237 677 88 99 17', false),
    (18, 6, '0118', 'Pamela', 'Tata', 'F', '2009-04-02', 'Ndu', 'Mr Tata Stephen', '+237 671 99 00 18', false),
    (19, 6, '0119', 'Roland', 'Kilah', 'M', '2008-07-14', 'Nkambe', 'Pa Kilah David', '+237 690 00 11 19', false),
    (20, 6, '0120', 'Belinda', 'Shey', 'F', '2009-12-23', 'Tabenken', 'Mamma Shey Rose', '+237 691 11 22 20', false),

    -- ── CLASS 7: UPPER SIXTH (20 Students, ~17-18 yrs old) ───────────────────
    (1, 7, '0121', 'Godfrey', 'Nkwain', 'M', '2008-04-09', 'Njinikom', 'Pa Nkwain Lucas', '+237 677 33 44 21', false),
    (2, 7, '0122', 'Theresa', 'Chia', 'F', '2008-08-16', 'Fundong', 'Mme Chia Florence', '+237 675 44 55 22', false),
    (3, 7, '0123', 'Kenneth', 'Tim', 'M', '2007-12-24', 'Belo', 'Mr Tim Emmanuel', '+237 678 55 66 23', false),
    (4, 7, '0124', 'Eunice', 'Kuoh', 'F', '2008-06-30', 'Kom', 'Mamma Kuoh Grace', '+237 674 66 77 24', false),
    (5, 7, '0125', 'Brian', 'Tubuo', 'M', '2008-02-18', 'Njinikom', 'Dr Tubuo Vincent', '+237 677 77 88 25', false),
    (6, 7, '0126', 'Brenda', 'Nain', 'F', '2007-10-05', 'Fundong', 'Pa Nain Peter', '+237 699 88 99 26', false),
    (7, 7, '0127', 'Geoffrey', 'Song', 'M', '2008-07-22', 'Belo', 'Mme Song Beatrice', '+237 671 99 00 27', false),
    (8, 7, '0128', 'Lilian', 'Mbu', 'F', '2008-03-14', 'Mamfe', 'Mr Mbu James', '+237 694 00 11 28', false),
    (9, 7, '0129', 'Harrison', 'Tanyi', 'M', '2007-11-09', 'Kumba', 'Pa Tanyi George', '+237 679 11 22 29', true),
    (10, 7, '0130', 'Solange', 'Arrey', 'F', '2008-05-27', 'Buea', 'Mamma Arrey Mary', '+237 670 22 33 30', false),
    (11, 7, '0131', 'Clarence', 'Tabot', 'M', '2008-09-11', 'Limbe', 'Dr Tabot Richard', '+237 672 33 44 31', false),
    (12, 7, '0132', 'Flora', 'Ntui', 'F', '2007-01-20', 'Mamfe', 'Mme Ntui Patricia', '+237 673 44 55 32', false),
    (13, 7, '0133', 'Eugene', 'Bate', 'M', '2008-08-04', 'Tiko', 'Pa Bate Thomas', '+237 676 55 66 33', false),
    (14, 7, '0134', 'Christiana', 'Agbor', 'F', '2008-12-15', 'Buea', 'Mamma Agbor Helen', '+237 675 66 77 34', false),
    (15, 7, '0135', 'Stephen', 'Ebot', 'M', '2007-06-08', 'Kumba', 'Mr Ebot Stephen', '+237 674 77 88 35', false),
    (16, 7, '0136', 'Priscilla', 'Achu', 'F', '2008-10-29', 'Santa', 'Dr Achu Joseph', '+237 678 88 99 36', false),
    (17, 7, '0137', 'Jerome', 'Khan', 'M', '2008-02-03', 'Mankon', 'Pa Khan Martin', '+237 677 99 00 37', false),
    (18, 7, '0138', 'Delphine', 'Chibili', 'F', '2007-09-17', 'Bali', 'Mme Chibili Sarah', '+237 671 00 11 38', false),
    (19, 7, '0139', 'Raymond', 'Fomuso', 'M', '2008-04-25', 'Batibo', 'Mr Fomuso Andrew', '+237 690 11 22 39', false),
    (20, 7, '0140', 'Mercy', 'Tembeng', 'F', '2008-11-01', 'Mbengwi', 'Mamma Tembeng Alice', '+237 691 22 33 40', false);

    -- Loop through the temporary table, insert each student and their enrolment
    FOR r IN (SELECT * FROM tmp_seed_students ORDER BY class_target, roll_num) LOOP
        -- Select target class stream ID
        IF r.class_target = 1 THEN v_target_stream_id := v_strm_f1;
        ELSIF r.class_target = 2 THEN v_target_stream_id := v_strm_f2;
        ELSIF r.class_target = 3 THEN v_target_stream_id := v_strm_f3;
        ELSIF r.class_target = 4 THEN v_target_stream_id := v_strm_f4;
        ELSIF r.class_target = 5 THEN v_target_stream_id := v_strm_f5;
        ELSIF r.class_target = 6 THEN v_target_stream_id := v_strm_l6;
        ELSIF r.class_target = 7 THEN v_target_stream_id := v_strm_u6;
        END IF;

        -- Insert or retrieve student
        INSERT INTO public.students (
            school_id, matricule, first_name, last_name, gender, date_of_birth, place_of_birth,
            residence_status, guardian_name, guardian_phone, guardian_email, status, is_repeater
        ) VALUES (
            v_school_id,
            v_school_code || '-26-' || r.mat_suffix,
            r.f_name,
            r.l_name,
            r.sex,
            r.dob,
            r.pob,
            'day',
            r.guardian,
            r.g_phone,
            lower(replace(r.f_name, ' ', '.')) || '.' || lower(r.l_name) || '@parents.cm',
            'active',
            r.is_rep
        )
        ON CONFLICT (school_id, matricule) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            is_repeater = EXCLUDED.is_repeater
        RETURNING id INTO v_stu_id;

        -- Enrol student in the target class stream
        INSERT INTO public.enrolments (
            school_id, student_id, academic_year_id, class_stream_id, roll_number,
            enrolment_date, status, is_repeater
        ) VALUES (
            v_school_id,
            v_stu_id,
            v_year_id,
            v_target_stream_id,
            r.roll_num,
            '2026-09-07',
            'active',
            r.is_rep
        )
        ON CONFLICT (academic_year_id, student_id) DO UPDATE SET
            class_stream_id = EXCLUDED.class_stream_id,
            roll_number = EXCLUDED.roll_number,
            is_repeater = EXCLUDED.is_repeater;

        v_stu_count := v_stu_count + 1;
    END LOOP;

    RAISE NOTICE 'Seeded % students with active enrolments (20 per class).', v_stu_count;

    -- ──────────────────────────────────────────────────────────────────────────
    -- 10. REAL TEST ASSESSMENT MARKS FOR FORM 2 A (Sequence 1 & Sequence 2)
    -- Allows immediate verification of report cards, term averages, & rankings
    -- ──────────────────────────────────────────────────────────────────────────
    v_strm_f2 := (SELECT id FROM public.class_streams WHERE class_id = v_cls_f2 AND academic_year_id = v_year_id LIMIT 1);

    IF v_strm_f2 IS NOT NULL AND v_seq1_id IS NOT NULL AND v_seq2_id IS NOT NULL THEN
        -- Insert test marks across subjects for Form 2 A students
        FOR r IN (
            SELECT 
                e.student_id,
                e.roll_number,
                s.id as subject_id,
                s.code as subject_code
            FROM public.enrolments e
            CROSS JOIN public.subjects s
            WHERE e.class_stream_id = v_strm_f2
              AND s.school_id = v_school_id
              AND s.code IN ('ENG', 'FRE', 'MATH', 'BIO', 'CHEM', 'PHY', 'GEO', 'HIST', 'CIT', 'CS')
        ) LOOP
            -- Determine deterministic marks based on roll number and subject code
            -- Realistic academic spread (Rank 1 achieves ~16-18, average students ~11-14, low performers ~6-9)
            IF r.roll_number = 1 THEN v_base := 16.5; -- Precilia Ngomende (Top student)
            ELSIF r.roll_number = 2 THEN v_base := 14.5;
            ELSIF r.roll_number = 3 THEN v_base := 12.0;
            ELSIF r.roll_number = 4 THEN v_base := 15.0;
            ELSIF r.roll_number = 5 THEN v_base := 11.5;
            ELSIF r.roll_number = 6 THEN v_base := 13.5;
            ELSIF r.roll_number = 7 THEN v_base := 14.0;
            ELSIF r.roll_number = 8 THEN v_base := 10.5;
            ELSIF r.roll_number = 9 THEN v_base := 8.5; -- Repeater / struggling
            ELSIF r.roll_number = 10 THEN v_base := 12.5;
            ELSIF r.roll_number <= 15 THEN v_base := 11.0 + (r.roll_number % 4);
            ELSE v_base := 9.0 + (r.roll_number % 5);
            END IF;

            -- Modulate slightly between subjects and sequences
            v_score1 := LEAST(20.00, GREATEST(4.00, v_base + (length(r.subject_code) % 3) - 1.0));
            v_score2 := LEAST(20.00, GREATEST(4.00, v_base + (r.roll_number % 3) - 0.5));

            -- Sequence 1 Mark
            INSERT INTO public.assessment_marks (
                school_id, academic_year_id, term_id, sequence_id, class_stream_id,
                subject_id, student_id, score, max_marks, status, remarks, is_locked
            ) VALUES (
                v_school_id, v_year_id, v_term1_id, v_seq1_id, v_strm_f2,
                r.subject_id, r.student_id, v_score1, 20.00, 'present', 'Evaluated', false
            )
            ON CONFLICT (sequence_id, class_stream_id, subject_id, student_id) DO UPDATE SET
                score = EXCLUDED.score;

            -- Sequence 2 Mark
            INSERT INTO public.assessment_marks (
                school_id, academic_year_id, term_id, sequence_id, class_stream_id,
                subject_id, student_id, score, max_marks, status, remarks, is_locked
            ) VALUES (
                v_school_id, v_year_id, v_term1_id, v_seq2_id, v_strm_f2,
                r.subject_id, r.student_id, v_score2, 20.00, 'present', 'Evaluated', false
            )
            ON CONFLICT (sequence_id, class_stream_id, subject_id, student_id) DO UPDATE SET
                score = EXCLUDED.score;

            v_marks_count := v_marks_count + 2;
        END LOOP;

        RAISE NOTICE 'Seeded % test evaluation marks for Form 2 A (Sequences 1 & 2).', v_marks_count;
    END IF;

    -- ──────────────────────────────────────────────────────────────────────────
    -- 11. LINK LOGGED IN STAFF / USER PROFILE (IF ANY) AS TEACHER
    -- ──────────────────────────────────────────────────────────────────────────
    IF v_staff_id IS NOT NULL THEN
        -- Assign this user to teach core subjects in Form 2 A and Form 1 A
        INSERT INTO public.teacher_assignments (
            school_id, academic_year_id, teacher_user_id, class_stream_id, subject_id
        )
        SELECT 
            v_school_id,
            v_year_id,
            v_staff_id,
            v_strm_f2,
            sub.id
        FROM public.subjects sub
        WHERE sub.school_id = v_school_id
          AND sub.code IN ('ENG', 'MATH', 'GEO', 'FRE')
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Assigned active staff member (%) to subjects in Form 2 A.', v_staff_id;
    END IF;

    RAISE NOTICE '=========================================================';
    RAISE NOTICE 'SUCCESS: Nsei Skul Database Seeding Completed!';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - School: %', v_school_code;
    RAISE NOTICE '  - Academic Year: 2026/2027';
    RAISE NOTICE '  - Classes: Form 1 through Upper Sixth (7 Classes)';
    RAISE NOTICE '  - Streams: 7 Class Groups';
    RAISE NOTICE '  - Subjects: 22 Secondary School Subjects';
    RAISE NOTICE '  - Enrolled Students: % Students (20 per class)', v_stu_count;
    RAISE NOTICE '  - Assessment Marks: % Marks (Form 2 A Ready)', v_marks_count;
    RAISE NOTICE '=========================================================';
END $$;
