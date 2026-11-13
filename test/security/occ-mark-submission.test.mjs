import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from 'pg';
import { withAuthenticatedSession, closeLocalPgPool } from '../../src/lib/db/local-postgres.ts';

const connectionString =
  process.env.HUB_DATABASE_URL ||
  `postgresql://${process.env.HUB_DB_USER || 'postgres'}:${process.env.HUB_DB_PASSWORD || 'postgres'}@${process.env.HUB_DB_HOST || '127.0.0.1'}:${process.env.HUB_DB_PORT || '5432'}/${process.env.HUB_DB_NAME || 'nsei_sukul_hub'}`;

test('Nsei Sukul Phase 2: All-or-Nothing Mark Submission & OCC Rollback Suite', async (t) => {
  const client = new Client({ connectionString });
  await client.connect();

  const testSchoolId = '11111111-1111-1111-1111-111111111111';
  const testYearId = '9202412a-6125-4411-b355-3146e7ea3a53';
  const testTermId = '3c242c47-062b-4378-8eb5-a1a8d9bba14f';
  const testSequenceId = '00000000-0000-0000-0000-000000000001';
  const testStreamId = '00000000-0000-0000-0000-000000000002';
  const testSubjectId = '00000000-0000-0000-0000-000000000003';
  const student1 = '00000000-0000-0000-0000-000000000011';
  const student2 = '00000000-0000-0000-0000-000000000012';

  t.after(async () => {
    await client.query("DELETE FROM public.assessment_marks WHERE sequence_id = $1;", [testSequenceId]);
    await client.end();
    await closeLocalPgPool();
  });

  // Ensure clean starting slate for sequence
  await client.query("DELETE FROM public.assessment_marks WHERE sequence_id = $1;", [testSequenceId]);

  // Seed prerequisites in local database inside test setup
  await client.query(`
    INSERT INTO public.schools (id, name, slug) VALUES ('${testSchoolId}', 'Test School', 'test-school') ON CONFLICT DO NOTHING;
    INSERT INTO public.academic_years (id, school_id, name, start_date, end_date) VALUES ('${testYearId}', '${testSchoolId}', '2026/2027', '2026-09-01', '2027-06-30') ON CONFLICT DO NOTHING;
    INSERT INTO public.terms (id, school_id, academic_year_id, term_number, name, start_date, end_date) VALUES ('${testTermId}', '${testSchoolId}', '${testYearId}', 1, 'First Term', '2026-09-01', '2026-12-15') ON CONFLICT DO NOTHING;
    INSERT INTO public.evaluation_sequences (id, school_id, term_id, sequence_number, name) VALUES ('${testSequenceId}', '${testSchoolId}', '${testTermId}', 1, 'Sequence 1') ON CONFLICT DO NOTHING;
    INSERT INTO public.classes (id, school_id, name, level_order, cycle) VALUES ('00000000-0000-0000-0000-000000000020', '${testSchoolId}', 'Form 1', 1, 'cycle_1') ON CONFLICT DO NOTHING;
    INSERT INTO public.class_streams (id, school_id, class_id, academic_year_id, name) VALUES ('${testStreamId}', '${testSchoolId}', '00000000-0000-0000-0000-000000000020', '${testYearId}', 'Form 1A') ON CONFLICT DO NOTHING;
    INSERT INTO public.departments (id, school_id, name, code) VALUES ('00000000-0000-0000-0000-000000000030', '${testSchoolId}', 'Computer Science', 'CS') ON CONFLICT DO NOTHING;
    INSERT INTO public.subjects (id, school_id, department_id, name, code) VALUES ('${testSubjectId}', '${testSchoolId}', '00000000-0000-0000-0000-000000000030', 'Maths', 'MAT') ON CONFLICT DO NOTHING;
    INSERT INTO public.students (id, school_id, matricule, first_name, last_name, gender, date_of_birth) VALUES ('${student1}', '${testSchoolId}', 'MAT-01', 'Alice', 'Fon', 'F', '2012-01-01') ON CONFLICT DO NOTHING;
    INSERT INTO public.students (id, school_id, matricule, first_name, last_name, gender, date_of_birth) VALUES ('${student2}', '${testSchoolId}', 'MAT-02', 'Bob', 'Manga', 'M', '2012-01-01') ON CONFLICT DO NOTHING;
  `);

  await t.test('1. Initial batch insert records marks at version 1', async () => {
    const marksPayload = [
      { student_id: student1, score: 15, status: 'present', remarks: 'Good', version: 1 },
      { student_id: student2, score: 18, status: 'present', remarks: 'Excellent', version: 1 }
    ];

    const res = await client.query(`
      SELECT public.submit_sequence_marks_atomic(
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb
      ) AS result;
    `, [testSchoolId, testYearId, testTermId, testSequenceId, testStreamId, testSubjectId, 20, JSON.stringify(marksPayload)]);

    const result = res.rows[0].result;
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.processed_count, 2);

    // Verify DB records have version = 1
    const check = await client.query(`
      SELECT student_id, score, version FROM public.assessment_marks
      WHERE sequence_id = $1 AND subject_id = $2 ORDER BY student_id;
    `, [testSequenceId, testSubjectId]);

    assert.strictEqual(check.rows.length, 2);
    assert.strictEqual(check.rows[0].version, 1);
    assert.strictEqual(check.rows[1].version, 1);
  });

  await t.test('2. Atomic update advances version monotonically to version 2', async () => {
    const updatePayload = [
      { student_id: student1, score: 16, status: 'present', remarks: 'Improved', version: 1 },
      { student_id: student2, score: 19, status: 'present', remarks: 'Outstanding', version: 1 }
    ];

    const res = await client.query(`
      SELECT public.submit_sequence_marks_atomic(
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb
      ) AS result;
    `, [testSchoolId, testYearId, testTermId, testSequenceId, testStreamId, testSubjectId, 20, JSON.stringify(updatePayload)]);

    const result = res.rows[0].result;
    assert.strictEqual(result.success, true);

    const check = await client.query(`
      SELECT student_id, score, version FROM public.assessment_marks
      WHERE sequence_id = $1 AND subject_id = $2 ORDER BY student_id;
    `, [testSequenceId, testSubjectId]);

    assert.strictEqual(check.rows[0].version, 2);
    assert.strictEqual(Number(check.rows[0].score), 16);
    assert.strictEqual(check.rows[1].version, 2);
    assert.strictEqual(Number(check.rows[1].score), 19);
  });

  await t.test('3. OCC Conflict: If 1 row is stale, ALL-OR-NOTHING aborts and rolls back completely', async () => {
    // Client tries to submit student1 with correct version (2), but student2 with stale version (1)
    const stalePayload = [
      { student_id: student1, score: 20, status: 'present', remarks: 'Perfect', version: 2 },
      { student_id: student2, score: 20, status: 'present', remarks: 'Should Not Apply', version: 1 } // Stale! DB is 2
    ];

    const res = await client.query(`
      SELECT public.submit_sequence_marks_atomic(
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb
      ) AS result;
    `, [testSchoolId, testYearId, testTermId, testSequenceId, testStreamId, testSubjectId, 20, JSON.stringify(stalePayload)]);

    const result = res.rows[0].result;
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error_code, 'CONCURRENCY_CONFLICT');
    assert.strictEqual(result.conflicts.length, 1);
    assert.strictEqual(result.conflicts[0].student_id, student2);

    // Verify student1 was NOT updated (strict all-or-nothing rollback)
    const check = await client.query(`
      SELECT student_id, score, version FROM public.assessment_marks
      WHERE sequence_id = $1 AND subject_id = $2 AND student_id = $3;
    `, [testSequenceId, testSubjectId, student1]);

    assert.strictEqual(Number(check.rows[0].score), 16, 'Student 1 score must remain 16 (untouched)');
    assert.strictEqual(check.rows[0].version, 2, 'Student 1 version must remain 2 (not incremented)');
  });
});
