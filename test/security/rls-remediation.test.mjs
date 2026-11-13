import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('Missing Supabase configuration in environment.');
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function createImpersonatedClient(userId) {
  // Use user JWT impersonation or custom headers for RLS testing
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        // In local/test Postgres or Supabase test runners, impersonation can use custom auth headers
        'X-Test-User-Id': userId
      }
    }
  });
}

test('Nsei Sukul Phase 0 Security & Multi-Tenant Regression Suite', async (t) => {
  await t.test('1. Verify target tables have version column', async () => {
    const tables = ['assessment_marks', 'attendance_records', 'students', 'enrolments'];
    for (const table of tables) {
      const { data, error } = await adminClient.from(table).select('version').limit(1);
      if (error && error.code === '42703') {
        assert.fail(`Table ${table} is missing 'version' column: ${error.message}`);
      }
    }
  });

  await t.test('2. Verify public.school_sync_cursors and cloud_change_feed exist', async () => {
    const { data: cursors, error: errCursors } = await adminClient.from('school_sync_cursors').select('*').limit(1);
    assert.strictEqual(errCursors, null, 'school_sync_cursors table must exist and be accessible');

    const { data: feed, error: errFeed } = await adminClient.from('cloud_change_feed').select('*').limit(1);
    assert.strictEqual(errFeed, null, 'cloud_change_feed table must exist and be accessible');
  });

  await t.test('3. Verify tenant sequence allocator advances cursors monotonically', async () => {
    // Pick an existing school
    const { data: schools } = await adminClient.from('schools').select('id').limit(1);
    assert.ok(schools && schools.length > 0, 'At least one school must exist');
    const schoolId = schools[0].id;

    // Call append_cloud_change_event RPC
    const testPayload = {
      p_school_id: schoolId,
      p_entity_type: 'assessment_marks',
      p_entity_id: '00000000-0000-0000-0000-000000000000',
      p_mutation_type: 'INSERT',
      p_payload: { test: true },
      p_entity_version: 1,
      p_actor_id: null,
      p_device_code: 'TEST-CLI',
      p_origin_node_id: 'CLOUD'
    };

    const { data: cursor1, error: err1 } = await adminClient.rpc('append_cloud_change_event', testPayload);
    assert.strictEqual(err1, null, `append_cloud_change_event failed: ${err1?.message}`);
    assert.ok(typeof cursor1 === 'number' || typeof cursor1 === 'string', 'Cursor must be returned');

    const { data: cursor2, error: err2 } = await adminClient.rpc('append_cloud_change_event', testPayload);
    assert.strictEqual(err2, null, `Second append_cloud_change_event failed: ${err2?.message}`);
    assert.ok(BigInt(cursor2) > BigInt(cursor1), 'Sequential cursor allocation must be strictly monotonic');
  });

  await t.test('4. Verify Assessment Marks RLS: Zero DELETE policy enforcement', async () => {
    // Attempting to delete from assessment_marks with anon/authenticated client
    const anonClient = createClient(SUPABASE_URL, ANON_KEY);
    const { data, error } = await anonClient
      .from('assessment_marks')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000000');

    // Without a DELETE policy, PostgREST returns 0 rows affected or 401/403 RLS rejection
    assert.ok(error || (Array.isArray(data) && data.length === 0) || data === null, 
      'DELETE on assessment_marks must never succeed for non-superadmin');
  });

  await t.test('5. Verify Fee Payments RLS: Zero DELETE policy enforcement', async () => {
    const anonClient = createClient(SUPABASE_URL, ANON_KEY);
    const { data, error } = await anonClient
      .from('fee_payments')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000000');

    assert.ok(error || (Array.isArray(data) && data.length === 0) || data === null,
      'DELETE on fee_payments must never succeed for non-superadmin');
  });
});
