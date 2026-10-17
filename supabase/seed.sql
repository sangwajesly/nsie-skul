-- ==============================================================================
-- Nsei Skul Demo Seed Script: GBHS Bamenda
-- Anglophone Subsystem, MINESEC CBA Compliant
-- ==============================================================================

DO $$
DECLARE
    v_school_id UUID := '11111111-1111-1111-1111-111111111111';
    v_year_id UUID := '22222222-2222-2222-2222-222222222222';
    v_term1_id UUID := '33333333-3333-3333-3333-333333333331';
    v_term2_id UUID := '33333333-3333-3333-3333-333333333332';
    v_term3_id UUID := '33333333-3333-3333-3333-333333333333';
    
    v_seq1_id UUID := '44444444-4444-4444-4444-444444444441';
    v_seq2_id UUID := '44444444-4444-4444-4444-444444444442';
    v_seq3_id UUID := '44444444-4444-4444-4444-444444444443';
    v_seq4_id UUID := '44444444-4444-4444-4444-444444444444';
    v_seq5_id UUID := '44444444-4444-4444-4444-444444444445';
    v_seq6_id UUID := '44444444-4444-4444-4444-444444444446';

    v_dept_sci UUID := '55555555-5555-5555-5555-555555555551';
    v_dept_arts UUID := '55555555-5555-5555-5555-555555555552';
    v_dept_lang UUID := '55555555-5555-5555-5555-555555555553';

    v_subj_math UUID := '66666666-6666-6666-6666-666666666661';
    v_subj_eng UUID := '66666666-6666-6666-6666-666666666662';
    v_subj_fr UUID := '66666666-6666-6666-6666-666666666663';
    v_subj_bio UUID := '66666666-6666-6666-6666-666666666664';
    v_subj_chem UUID := '66666666-6666-6666-6666-666666666665';
    v_subj_phy UUID := '66666666-6666-6666-6666-666666666666';
    v_subj_hist UUID := '66666666-6666-6666-6666-666666666667';
    v_subj_geo UUID := '66666666-6666-6666-6666-666666666668';

    v_class_f1 UUID := '77777777-7777-7777-7777-777777777771';
    v_class_f5 UUID := '77777777-7777-7777-7777-777777777775';

    v_stream_f5a UUID := '88888888-8888-8888-8888-888888888881';

    v_stu1 UUID := '99999999-9999-9999-9999-999999999991';
    v_stu2 UUID := '99999999-9999-9999-9999-999999999992';
    v_stu3 UUID := '99999999-9999-9999-9999-999999999993';
    v_stu4 UUID := '99999999-9999-9999-9999-999999999994';

    v_enrol1 UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
    v_enrol2 UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2';
    v_enrol3 UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3';
    v_enrol4 UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4';

    v_fee_f5 UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1';
BEGIN
    -- 1. Create Demo School: GBHS Bamenda
    INSERT INTO public.schools (
        id, name, slug, code, motto, address, phone, email, subsystem, currency, ranking_mode, result_approval_workflow, receipt_prefix
    ) VALUES (
        v_school_id, 
        'Government Bilingual High School Bamenda', 
        'gbhs-bamenda', 
        'GBHS-BDA', 
        'Honor - Labor - Fatherland', 
        'P.O. Box 24, Up-Station, Bamenda, North West Region, Cameroon',
        '+237 677 12 34 56',
        'info@gbhsbamenda.cm',
        'anglophone',
        'XAF',
        'enabled',
        'hod',
        'GBHS-REC'
    ) ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        ranking_mode = EXCLUDED.ranking_mode;

    -- 2. Academic Year: 2026/2027
    INSERT INTO public.academic_years (
        id, school_id, name, start_date, end_date, is_current
    ) VALUES (
        v_year_id, v_school_id, '2026/2027', '2026-09-07', '2027-06-25', true
    ) ON CONFLICT (id) DO NOTHING;

    -- 3. Terms (1, 2, 3)
    INSERT INTO public.terms (id, academic_year_id, school_id, term_number, name, start_date, end_date, is_active)
    VALUES
        (v_term1_id, v_year_id, v_school_id, 1, 'First Term', '2026-09-07', '2026-12-18', true),
        (v_term2_id, v_year_id, v_school_id, 2, 'Second Term', '2027-01-04', '2027-03-26', false),
        (v_term3_id, v_year_id, v_school_id, 3, 'Third Term', '2027-04-12', '2027-06-25', false)
    ON CONFLICT (id) DO NOTHING;

    -- 4. Sequences 1 to 6 (MINESEC 6-Sequence Calendar)
    INSERT INTO public.evaluation_sequences (id, term_id, school_id, sequence_number, name, start_date, end_date, is_active)
    VALUES
        (v_seq1_id, v_term1_id, v_school_id, 1, 'Sequence 1 (1st Evaluation)', '2026-09-07', '2026-10-23', true),
        (v_seq2_id, v_term1_id, v_school_id, 2, 'Sequence 2 (2nd Evaluation)', '2026-10-26', '2026-12-18', false),
        (v_seq3_id, v_term2_id, v_school_id, 3, 'Sequence 3 (3rd Evaluation)', '2027-01-04', '2027-02-12', false),
        (v_seq4_id, v_term2_id, v_school_id, 4, 'Sequence 4 (4th Evaluation)', '2027-02-15', '2027-03-26', false),
        (v_seq5_id, v_term3_id, v_school_id, 5, 'Sequence 5 (5th Evaluation)', '2027-04-12', '2027-05-14', false),
        (v_seq6_id, v_term3_id, v_school_id, 6, 'Sequence 6 (6th Evaluation)', '2027-05-17', '2027-06-25', false)
    ON CONFLICT (id) DO NOTHING;

    -- 5. Departments
    INSERT INTO public.departments (id, school_id, name, code)
    VALUES
        (v_dept_sci, v_school_id, 'Science & Mathematics', 'SCIMATH'),
        (v_dept_arts, v_school_id, 'Arts & Humanities', 'ARTS'),
        (v_dept_lang, v_school_id, 'Languages & Bilingual Training', 'LANG')
    ON CONFLICT (id) DO NOTHING;

    -- 6. Subjects with MINESEC CBA Domains & Coefficients
    INSERT INTO public.subjects (id, school_id, department_id, name, code, coefficient, cba_competency_description)
    VALUES
        (v_subj_math, v_school_id, v_dept_sci, 'Mathematics', 'MATH', 4, 'Mathematical problem solving, spatial reasoning, and scientific calculation'),
        (v_subj_eng, v_school_id, v_dept_lang, 'English Language', 'ENG', 5, 'Communication, reading comprehension, essay writing, and oral presentation'),
        (v_subj_fr, v_school_id, v_dept_lang, 'French (Langue Seconde)', 'FRE', 3, 'Expression orale, production d''écrits, et compréhension des textes usuels'),
        (v_subj_bio, v_school_id, v_dept_sci, 'Biology', 'BIO', 3, 'Scientific inquiry, living organisms, and environmental awareness'),
        (v_subj_chem, v_school_id, v_dept_sci, 'Chemistry', 'CHE', 3, 'Matter, chemical reactions, and laboratory experiment procedures'),
        (v_subj_phy, v_school_id, v_dept_sci, 'Physics', 'PHY', 3, 'Physical laws, energy, electrical circuits, and mechanics'),
        (v_subj_hist, v_school_id, v_dept_arts, 'History', 'HIST', 2, 'Critical historical inquiry, national heritage, and world civilizations'),
        (v_subj_geo, v_school_id, v_dept_arts, 'Geography', 'GEO', 2, 'Physical geography, cartography, and sustainable human settlement')
    ON CONFLICT (id) DO NOTHING;

    -- 7. Classes & Stream (Form 5 Science A)
    INSERT INTO public.classes (id, school_id, name, level, cycle, stream_type)
    VALUES
        (v_class_f1, v_school_id, 'Form 1', 1, 'first_cycle', 'general'),
        (v_class_f5, v_school_id, 'Form 5', 5, 'first_cycle', 'science')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.class_streams (id, class_id, school_id, name, capacity)
    VALUES
        (v_stream_f5a, v_class_f5, v_school_id, 'Form 5 Science A', 45)
    ON CONFLICT (id) DO NOTHING;

    -- Assign subjects to Form 5 Science A
    INSERT INTO public.class_subjects (school_id, class_stream_id, subject_id, coefficient)
    VALUES
        (v_school_id, v_stream_f5a, v_subj_math, 4),
        (v_school_id, v_stream_f5a, v_subj_eng, 5),
        (v_school_id, v_stream_f5a, v_subj_fr, 3),
        (v_school_id, v_stream_f5a, v_subj_bio, 3),
        (v_school_id, v_stream_f5a, v_subj_chem, 3),
        (v_school_id, v_stream_f5a, v_subj_phy, 3),
        (v_school_id, v_stream_f5a, v_subj_hist, 2),
        (v_school_id, v_stream_f5a, v_subj_geo, 2)
    ON CONFLICT DO NOTHING;

    -- 8. Students
    INSERT INTO public.students (id, school_id, matricule, first_name, last_name, gender, date_of_birth, place_of_birth, guardian_name, guardian_phone, emergency_contact)
    VALUES
        (v_stu1, v_school_id, 'GBHS/2026/001', 'Kelly', 'Nforbi', 'F', '2010-04-12', 'Bamenda', 'Pa Nforbi Emmanuel', '+237 677 88 99 00', '+237 677 88 99 00'),
        (v_stu2, v_school_id, 'GBHS/2026/002', 'Derick', 'Che', 'M', '2010-09-21', 'Mankon', 'Mamma Che Comfort', '+237 675 44 33 22', '+237 675 44 33 22'),
        (v_stu3, v_school_id, 'GBHS/2026/003', 'Blessing', 'Mbi', 'F', '2010-01-15', 'Bali Nyonga', 'Mr. Mbi Divine', '+237 678 11 22 33', '+237 678 11 22 33'),
        (v_stu4, v_school_id, 'GBHS/2026/004', 'Precious', 'Tita', 'M', '2010-11-03', 'Bafut', 'Mme. Tita Rosaline', '+237 674 55 66 77', '+237 674 55 66 77')
    ON CONFLICT (id) DO NOTHING;

    -- Enrolments in Form 5 Science A for 2026/2027
    INSERT INTO public.student_enrolments (id, school_id, student_id, class_stream_id, academic_year_id, status)
    VALUES
        (v_enrol1, v_school_id, v_stu1, v_stream_f5a, v_year_id, 'active'),
        (v_enrol2, v_school_id, v_stu2, v_stream_f5a, v_year_id, 'active'),
        (v_enrol3, v_school_id, v_stu3, v_stream_f5a, v_year_id, 'active'),
        (v_enrol4, v_school_id, v_stu4, v_stream_f5a, v_year_id, 'active')
    ON CONFLICT (id) DO NOTHING;

    -- 9. Marks Records for Sequence 1 (Evaluation 1)
    -- Total Coeff = 4+5+3+3+3+3+2+2 = 25
    -- Kelly Nforbi (Top Performer)
    INSERT INTO public.marks_records (school_id, student_enrolment_id, subject_id, evaluation_sequence_id, raw_score, max_score, score_on_20, is_absent, status)
    VALUES
        (v_school_id, v_enrol1, v_subj_math, v_seq1_id, 18.5, 20, 18.5, false, 'approved'),
        (v_school_id, v_enrol1, v_subj_eng,  v_seq1_id, 17.0, 20, 17.0, false, 'approved'),
        (v_school_id, v_enrol1, v_subj_fr,   v_seq1_id, 16.0, 20, 16.0, false, 'approved'),
        (v_school_id, v_enrol1, v_subj_bio,  v_seq1_id, 17.5, 20, 17.5, false, 'approved'),
        (v_school_id, v_enrol1, v_subj_chem, v_seq1_id, 18.0, 20, 18.0, false, 'approved'),
        (v_school_id, v_enrol1, v_subj_phy,  v_seq1_id, 19.0, 20, 19.0, false, 'approved'),
        (v_school_id, v_enrol1, v_subj_hist, v_seq1_id, 15.0, 20, 15.0, false, 'approved'),
        (v_school_id, v_enrol1, v_subj_geo,  v_seq1_id, 16.5, 20, 16.5, false, 'approved'),

    -- Derick Che (Solid Performer)
        (v_school_id, v_enrol2, v_subj_math, v_seq1_id, 14.0, 20, 14.0, false, 'approved'),
        (v_school_id, v_enrol2, v_subj_eng,  v_seq1_id, 13.5, 20, 13.5, false, 'approved'),
        (v_school_id, v_enrol2, v_subj_fr,   v_seq1_id, 12.0, 20, 12.0, false, 'approved'),
        (v_school_id, v_enrol2, v_subj_bio,  v_seq1_id, 15.0, 20, 15.0, false, 'approved'),
        (v_school_id, v_enrol2, v_subj_chem, v_seq1_id, 14.5, 20, 14.5, false, 'approved'),
        (v_school_id, v_enrol2, v_subj_phy,  v_seq1_id, 13.0, 20, 13.0, false, 'approved'),
        (v_school_id, v_enrol2, v_subj_hist, v_seq1_id, 14.0, 20, 14.0, false, 'approved'),
        (v_school_id, v_enrol2, v_subj_geo,  v_seq1_id, 13.0, 20, 13.0, false, 'approved'),

    -- Blessing Mbi (Good Performer)
        (v_school_id, v_enrol3, v_subj_math, v_seq1_id, 12.0, 20, 12.0, false, 'approved'),
        (v_school_id, v_enrol3, v_subj_eng,  v_seq1_id, 16.0, 20, 16.0, false, 'approved'),
        (v_school_id, v_enrol3, v_subj_fr,   v_seq1_id, 14.5, 20, 14.5, false, 'approved'),
        (v_school_id, v_enrol3, v_subj_bio,  v_seq1_id, 13.0, 20, 13.0, false, 'approved'),
        (v_school_id, v_enrol3, v_subj_chem, v_seq1_id, 11.5, 20, 11.5, false, 'approved'),
        (v_school_id, v_enrol3, v_subj_phy,  v_seq1_id, 10.0, 20, 10.0, false, 'approved'),
        (v_school_id, v_enrol3, v_subj_hist, v_seq1_id, 16.5, 20, 16.5, false, 'approved'),
        (v_school_id, v_enrol3, v_subj_geo,  v_seq1_id, 15.0, 20, 15.0, false, 'approved'),

    -- Precious Tita (Needs Support)
        (v_school_id, v_enrol4, v_subj_math, v_seq1_id, 8.0, 20, 8.0, false, 'approved'),
        (v_school_id, v_enrol4, v_subj_eng,  v_seq1_id, 9.5, 20, 9.5, false, 'approved'),
        (v_school_id, v_enrol4, v_subj_fr,   v_seq1_id, 7.0, 20, 7.0, false, 'approved'),
        (v_school_id, v_enrol4, v_subj_bio,  v_seq1_id, 11.0, 20, 11.0, false, 'approved'),
        (v_school_id, v_enrol4, v_subj_chem, v_seq1_id, 8.5, 20, 8.5, false, 'approved'),
        (v_school_id, v_enrol4, v_subj_phy,  v_seq1_id, 7.5, 20, 7.5, false, 'approved'),
        (v_school_id, v_enrol4, v_subj_hist, v_seq1_id, 10.0, 20, 10.0, false, 'approved'),
        (v_school_id, v_enrol4, v_subj_geo,  v_seq1_id, 9.0, 20, 9.0, false, 'approved')
    ON CONFLICT (student_enrolment_id, subject_id, evaluation_sequence_id) DO UPDATE SET
        score_on_20 = EXCLUDED.score_on_20,
        status = EXCLUDED.status;

    -- 10. Attendance & Disciplinary Records
    INSERT INTO public.attendance_records (school_id, student_enrolment_id, evaluation_sequence_id, date, status, missed_hours)
    VALUES
        (v_school_id, v_enrol1, v_seq1_id, '2026-10-05', 'present', 0),
        (v_school_id, v_enrol2, v_seq1_id, '2026-10-05', 'late', 1),
        (v_school_id, v_enrol3, v_seq1_id, '2026-10-05', 'absent_justified', 2),
        (v_school_id, v_enrol4, v_seq1_id, '2026-10-05', 'absent_unjustified', 4)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.disciplinary_records (school_id, student_enrolment_id, evaluation_sequence_id, incident_date, sanction_type, quantity, reason, is_active)
    VALUES
        (v_school_id, v_enrol4, v_seq1_id, '2026-10-08', 'punishment_hours', 2, 'Insubordination and late coming to assembly', true)
    ON CONFLICT DO NOTHING;

    -- 11. Bursary: Fee Structure & Payments in FCFA
    -- Form 5 Tuition & PTA Package = 75,000 FCFA
    INSERT INTO public.fee_structures (id, school_id, academic_year_id, name, amount_fcfa, is_mandatory, target_level)
    VALUES
        (v_fee_f5, v_school_id, v_year_id, 'Form 5 Comprehensive Fee (Tuition + PTA)', 75000, true, 5)
    ON CONFLICT (id) DO NOTHING;

    -- Payments: Kelly paid in full (75,000 FCFA), Derick paid installment 1 (50,000 FCFA)
    INSERT INTO public.payments (
        school_id, student_enrolment_id, fee_structure_id, receipt_number, amount_paid_fcfa, payment_method, payer_name, notes
    ) VALUES
        (v_school_id, v_enrol1, v_fee_f5, 'GBHS-REC-2026-0001', 75000, 'cash', 'Pa Nforbi Emmanuel', 'Paid in full for 2026/2027 academic session'),
        (v_school_id, v_enrol2, v_fee_f5, 'GBHS-REC-2026-0002', 50000, 'mtn_momo', 'Mamma Che Comfort', '1st installment payment via MoMo')
    ON CONFLICT (receipt_number) DO NOTHING;

    RAISE NOTICE 'Nsei Skul GBHS Bamenda seed complete!';
END $$;
