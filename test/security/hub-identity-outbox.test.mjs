import test from 'node:test';
import assert from 'node:assert/strict';
import { getOrCreateHubKeyPair, signHubPayload, verifyHubSignature } from '../../src/lib/hub/hub-identity.ts';
import { enqueueOutboxMutation, getPendingOutboxBatch, markOutboxCommitted, markOutboxFailed } from '../../src/lib/hub/hub-outbox.ts';
import { closeLocalPgPool } from '../../src/lib/db/local-postgres.ts';

test('Nsei Sukul Phase 3: Hub Cryptographic Identity & Transactional Outbox Suite', async (t) => {
  t.after(async () => {
    await closeLocalPgPool();
  });

  await t.test('1. Hub Ed25519 identity generation, signing, and signature verification', async () => {
    const keyPair = getOrCreateHubKeyPair();
    assert.ok(keyPair.publicKeyPem.includes('BEGIN PUBLIC KEY'));
    assert.ok(keyPair.privateKeyPem.includes('BEGIN PRIVATE KEY'));

    const testPayload = {
      hub_node_key: 'hub_test_001',
      school_id: '11111111-1111-1111-1111-111111111111',
      timestamp: Date.now(),
      mutations: [{ entity_type: 'assessment_marks', count: 5 }]
    };

    const signature = signHubPayload(testPayload, keyPair.privateKeyPem);
    assert.ok(typeof signature === 'string' && signature.length > 30, 'Signature must be valid base64');

    const isValid = verifyHubSignature(testPayload, signature, keyPair.publicKeyPem);
    assert.strictEqual(isValid, true, 'Valid signature must verify successfully');

    // Tamper test
    const tamperedPayload = { ...testPayload, timestamp: testPayload.timestamp + 1000 };
    const isTamperedValid = verifyHubSignature(tamperedPayload, signature, keyPair.publicKeyPem);
    assert.strictEqual(isTamperedValid, false, 'Tampered payload must fail verification');
  });

  await t.test('2. Transactional Outbox life-cycle: enqueue, batch pull, and commit', async () => {
    const schoolId = '11111111-1111-1111-1111-111111111111';
    const mutationId = await enqueueOutboxMutation({
      schoolId,
      entityType: 'assessment_marks',
      entityId: '00000000-0000-0000-0000-000000000001',
      mutationType: 'UPDATE',
      payload: { score: 17.5, max_marks: 20 },
      clientVersion: 2,
      actorId: '3c1f8953-b29a-4df6-ab44-fc4416d8524d'
    });

    assert.ok(mutationId > 0, 'Outbox ID must be positive integer');

    const batch = await getPendingOutboxBatch(10);
    const item = batch.find((b) => b.id === mutationId);
    assert.ok(item, 'Item must be retrieved in pending batch');
    assert.strictEqual(item.entityType, 'assessment_marks');
    assert.strictEqual(item.status, 'PENDING');

    // Mark committed
    await markOutboxCommitted([mutationId]);

    const postBatch = await getPendingOutboxBatch(10);
    const postItem = postBatch.find((b) => b.id === mutationId);
    assert.strictEqual(postItem, undefined, 'Committed item must not appear in pending batch');
  });
});
