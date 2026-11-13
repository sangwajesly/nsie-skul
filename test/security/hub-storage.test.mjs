import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { storeMediaLocally, hasLocalMedia, readLocalMediaBuffer } from '../../src/lib/hub/hub-storage.ts';

test('Nsei Sukul Phase 5: Local File Storage & Offline Media Handling Suite', async (t) => {
  const schoolId = '11111111-1111-1111-1111-111111111111';
  const studentId = '00000000-0000-0000-0000-000000000099';
  const samplePhoto = Buffer.from('FAKE_JPEG_IMAGE_DATA_CONTENT_FOR_TESTING');

  let storedPath = '';

  t.after(() => {
    if (storedPath && fs.existsSync(storedPath)) {
      fs.unlinkSync(storedPath);
    }
  });

  await t.test('1. Local media write produces relative URL and SHA256 integrity hash', async () => {
    const res = await storeMediaLocally(schoolId, studentId, samplePhoto, 'jpg');
    storedPath = res.storagePath;

    assert.ok(res.url.startsWith(`/uploads/students/${schoolId}/`));
    assert.strictEqual(res.sizeBytes, samplePhoto.length);
    assert.ok(typeof res.hash === 'string' && res.hash.length === 64, 'SHA256 hash must be 64 characters');
    assert.ok(fs.existsSync(res.storagePath), 'File must be written to disk');
  });

  await t.test('2. Local media existence check and buffer reading for Cloud sync', async () => {
    const fileName = path.basename(storedPath);
    const exists = hasLocalMedia(schoolId, fileName);
    assert.strictEqual(exists, true, 'hasLocalMedia must confirm file on disk');

    const buf = readLocalMediaBuffer(schoolId, fileName);
    assert.ok(buf !== null);
    assert.deepStrictEqual(buf, samplePhoto, 'Read buffer must exactly match original image bytes');
  });
});
