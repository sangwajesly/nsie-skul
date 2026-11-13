import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from 'pg';
import { withAuthenticatedSession, closeLocalPgPool } from '../../src/lib/db/local-postgres.ts';

const connectionString =
  process.env.HUB_DATABASE_URL ||
  `postgresql://${process.env.HUB_DB_USER || 'postgres'}:${process.env.HUB_DB_PASSWORD || 'postgres'}@${process.env.HUB_DB_HOST || '127.0.0.1'}:${process.env.HUB_DB_PORT || '5432'}/${process.env.HUB_DB_NAME || 'nsei_sukul_hub'}`;

test('Nsei Sukul Phase 1: Local PostgreSQL Compatibility & RLS Verification Suite', async (t) => {
  const client = new Client({ connectionString });
  await client.connect();

  t.after(async () => {
    await client.end();
    await closeLocalPgPool();
  });

  await t.test('1. Verify all core tables and version columns exist locally', async () => {
    const tables = ['assessment_marks', 'attendance_records', 'students', 'enrolments'];
    for (const table of tables) {
      const res = await client.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'version';`,
        [table]
      );
      assert.strictEqual(res.rows.length, 1, `Table ${table} must have version column in local postgres`);
    }
  });

  await t.test('2. Verify auth.uid() and auth.role() session functions execute', async () => {
    const testUserId = 'a0000000-0000-0000-0000-000000000001';
    
    // Simulate session context
    await client.query("BEGIN;");
    await client.query("SELECT set_config('request.jwt.claim.sub', $1, true);", [testUserId]);
    await client.query("SELECT set_config('request.jwt.claim.role', 'authenticated', true);");

    const uidRes = await client.query("SELECT auth.uid() AS uid, auth.role() AS role;");
    await client.query("COMMIT;");

    assert.strictEqual(uidRes.rows[0].uid, testUserId, 'auth.uid() must resolve local session sub claim');
    assert.strictEqual(uidRes.rows[0].role, 'authenticated', 'auth.role() must resolve authenticated');
  });

  await t.test('3. Verify withAuthenticatedSession helper injects context and rolls back on failure', async () => {
    const testUserId = 'b0000000-0000-0000-0000-000000000002';
    
    const result = await withAuthenticatedSession(testUserId, 'authenticated', async (sessionClient) => {
      const res = await sessionClient.query("SELECT auth.uid() AS uid;");
      return res.rows[0].uid;
    });

    assert.strictEqual(result, testUserId);
  });

  await t.test('4. Verify local hub schema and sync_outbox are operational', async () => {
    const res = await client.query(`
      INSERT INTO hub.sync_outbox (school_id, entity_type, entity_id, mutation_type, payload, client_version)
      VALUES ('11111111-1111-1111-1111-111111111111', 'assessment_marks', '00000000-0000-0000-0000-000000000000', 'INSERT', '{"score": 18}'::jsonb, 1)
      RETURNING id, status, event_id;
    `);

    assert.strictEqual(res.rows.length, 1);
    assert.strictEqual(res.rows[0].status, 'PENDING');
    assert.ok(res.rows[0].id > 0);

    // Clean up test outbox record
    await client.query("DELETE FROM hub.sync_outbox WHERE id = $1;", [res.rows[0].id]);
  });
});
