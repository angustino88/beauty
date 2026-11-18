import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPPORT_ATTACHMENT_ACCEPT,
  apiErrorMessage,
  formatFileSize,
  isImageAttachment,
  toSupportAttachments,
} from './attachments.ts';

test('formatFileSize renders human readable sizes', () => {
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(1536), '1.5 KB');
  assert.equal(formatFileSize(25 * 1024 * 1024), '25 MB');
  assert.equal(formatFileSize(-1), '–');
});

test('the picker accepts images and office documents', () => {
  for (const ext of ['.png', '.jpg', '.pdf', '.docx', '.xlsx', '.pptx', '.doc', '.zip']) {
    assert.ok(SUPPORT_ATTACHMENT_ACCEPT.split(',').includes(ext), ext);
  }
});

test('isImageAttachment uses the content type or the file name', () => {
  assert.equal(isImageAttachment({ content_type: 'image/png', filename: 'x.bin' }), true);
  assert.equal(isImageAttachment({ content_type: 'application/octet-stream', filename: 'photo.JPG' }), true);
  assert.equal(isImageAttachment({ content_type: 'application/pdf', filename: 'manual.pdf' }), false);
});

test('apiErrorMessage reads the backend error envelope first', () => {
  const envelope = { status: 422, data: { error: { code: 'attachment_type_not_allowed', message: "File extension '.exe' is not permitted." } } };
  assert.equal(apiErrorMessage(envelope), "File extension '.exe' is not permitted.");
  assert.equal(apiErrorMessage({ data: { detail: 'Not found.' } }), 'Not found.');
  assert.equal(apiErrorMessage(new Error('offline')), 'offline');
  assert.equal(apiErrorMessage(null, 'fallback'), 'fallback');
});

test('toSupportAttachments keeps only well formed rows', () => {
  const rows = toSupportAttachments([{ id: 1, filename: 'a.png' }, { id: '2' }, null, 'x']);
  assert.deepEqual(rows.map((row) => row.id), [1]);
  assert.deepEqual(toSupportAttachments(undefined), []);
});
