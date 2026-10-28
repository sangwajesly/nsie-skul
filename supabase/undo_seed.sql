-- ==============================================================================
-- Nsei Skul: Comprehensive Undo / Reset Script
-- Description: Safely deletes all seeded test assessment marks, enrolments,
--              students, class streams, classes, subjects, departments, and
--              the 2026/2027 academic year across schools.
--              Leaves your school "Government Bilingual High School Bamenda"
--              (ID: 11111111-1111-1111-1111-111111111111) and user logins intact.
-- Target: Supabase SQL Editor / PostgreSQL
-- ==============================================================================

DO $$
DECLARE
    v_marks_deleted INT := 0;
    v_students_deleted INT := 0;
    v_streams_deleted INT := 0;
    v_classes_deleted INT := 0;
    v_subjects_deleted INT := 0;
BEGIN
    RAISE NOTICE '=========================================================';
    RAISE NOTICE 'Starting Comprehensive Cleanup of Seeded Test Data';
    RAISE NOTICE '=========================================================';

    -- 1. DELETE TEST ASSESSMENT MARKS
    WITH deleted_marks AS (
        DELETE FROM public.assessment_marks
        WHERE student_id IN (
            SELECT id FROM public.students WHERE matricule LIKE '%-26-0%'
        )
        RETURNING id
    )
    SELECT count(*) INTO v_marks_deleted FROM deleted_marks;
    RAISE NOTICE 'Deleted % test assessment marks.', v_marks_deleted;

    -- 2. DELETE TEACHER ASSIGNMENTS IN SEEDED STREAMS
    DELETE FROM public.teacher_assignments
    WHERE class_stream_id IN (
        SELECT id FROM public.class_streams 
        WHERE name IN ('Form 1 A', 'Form 2 A', 'Form 3 A', 'Form 4 A', 'Form 5 A', 'Lower Sixth General', 'Upper Sixth General')
    );
    RAISE NOTICE 'Cleaned up seeded teacher assignments.';

    -- 3. DELETE CLASS SUBJECTS IN SEEDED STREAMS
    DELETE FROM public.class_subjects
    WHERE class_stream_id IN (
        SELECT id FROM public.class_streams 
        WHERE name IN ('Form 1 A', 'Form 2 A', 'Form 3 A', 'Form 4 A', 'Form 5 A', 'Lower Sixth General', 'Upper Sixth General')
    );
    RAISE NOTICE 'Cleaned up seeded class subjects.';

    -- 4. DELETE ENROLMENTS & TEST STUDENTS (140 students)
    DELETE FROM public.enrolments
    WHERE student_id IN (
        SELECT id FROM public.students WHERE matricule LIKE '%-26-0%'
    );

    WITH deleted_stu AS (
        DELETE FROM public.students
        WHERE matricule LIKE '%-26-0%'
        RETURNING id
    )
    SELECT count(*) INTO v_students_deleted FROM deleted_stu;
    RAISE NOTICE 'Deleted % seeded students and their enrolments.', v_students_deleted;

    -- 5. DELETE SEEDED CLASS STREAMS
    WITH deleted_strm AS (
        DELETE FROM public.class_streams
        WHERE name IN ('Form 1 A', 'Form 2 A', 'Form 3 A', 'Form 4 A', 'Form 5 A', 'Lower Sixth General', 'Upper Sixth General')
        RETURNING id
    )
    SELECT count(*) INTO v_streams_deleted FROM deleted_strm;
    RAISE NOTICE 'Deleted % seeded class streams.', v_streams_deleted;

    -- 6. DELETE SEEDED CLASSES (Form 1 to Upper Sixth)
    WITH deleted_cls AS (
        DELETE FROM public.classes
        WHERE name IN ('Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Lower Sixth', 'Upper Sixth')
        RETURNING id
    )
    SELECT count(*) INTO v_classes_deleted FROM deleted_cls;
    RAISE NOTICE 'Deleted % seeded classes.', v_classes_deleted;

    -- 7. DELETE SEEDED SUBJECTS
    WITH deleted_subs AS (
        DELETE FROM public.subjects
        WHERE code IN (
            'ENG', 'FRE', 'LIT', 'CHI', 'MATH', 'FMATH', 'BIO', 'CHEM', 'PHY',
            'HIST', 'GEO', 'CIT', 'ECON', 'COMM', 'ACC', 'BMATH', 'REL',
            'CS', 'PE', 'ML', 'HS', 'ART'
        )
        RETURNING id
    )
    SELECT count(*) INTO v_subjects_deleted FROM deleted_subs;
    RAISE NOTICE 'Deleted % seeded subjects.', v_subjects_deleted;

    -- 8. DELETE SEEDED DEPARTMENTS
    DELETE FROM public.departments
    WHERE code IN ('LANG', 'SCIMATH', 'HUMCOM', 'PRAC');
    RAISE NOTICE 'Cleaned up seeded departments.';

    -- 9. DELETE SEEDED ACADEMIC YEAR (2026/2027) & ITS TERMS / SEQUENCES
    DELETE FROM public.academic_years WHERE name = '2026/2027';
    RAISE NOTICE 'Cleaned up academic calendar 2026/2027.';

    RAISE NOTICE '=========================================================';
    RAISE NOTICE 'CLEANUP COMPLETE: Ready to seed into GBHS Bamenda!';
    RAISE NOTICE '=========================================================';
END $$;
