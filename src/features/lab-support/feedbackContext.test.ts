import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FEEDBACK_MAX_ATTACHMENTS,
  FEEDBACK_TYPE_CONFIGS,
  buildClientContext,
  getFeedbackTypeConfig,
  mergeAttachmentFiles,
  normalizeFeedbackPagePath,
  resolveDefaultCategoryId,
} from './feedbackContext.ts';

test('normalizeFeedbackPagePath strips query/hash and rejects unsafe paths', () => {
  assert.equal(normalizeFeedbackPagePath(' /booking-calendar?week=12#slot '), '/booking-calendar');
  assert.equal(normalizeFeedbackPagePath('/dashboard/3d'), '/dashboard/3d');
  assert.equal(normalizeFeedbackPagePath('https://evil.example/a'), '');
  assert.equal(normalizeFeedbackPagePath('//evil.example/a'), '');
  assert.equal(normalizeFeedbackPagePath('booking-calendar'), '');
  assert.equal(normalizeFeedbackPagePath('/spaces/../admin'), '');
  assert.equal(normalizeFeedbackPagePath(''), '');
});

test('buildClientContext detects browser, OS, viewport, and allowlisted metadata', () => {
  const ctx = buildClientContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
    innerWidth: 1920,
    innerHeight: 1080,
    theme: 'dark',
    language: 'en-US',
    appVersion: '2.4.0',
  });
  assert.deepEqual(ctx, {
    browser: 'Chrome 131',
    os: 'Windows',
    viewport: '1920x1080',
    theme: 'dark',
    language: 'en-US',
    app_version: '2.4.0',
  });
});

test('buildClientContext distinguishes Edge from Chrome', () => {
  const ctx = buildClientContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  });
  assert.equal(ctx.browser, 'Edge 131');
  assert.equal(ctx.os, 'macOS');
});

test('resolveDefaultCategoryId matches ticketType sku, then general, then first active', () => {
  const categories = [
    { id: 10, name: 'Hardware', sku: 'hardware' },
    { id: 20, name: 'General', sku: 'general' },
    { id: 30, name: 'Platform Bugs', sku: 'bug' },
  ];
  assert.equal(resolveDefaultCategoryId(categories, 'bug'), 30);
  assert.equal(resolveDefaultCategoryId(categories, 'feature_request'), 20);
  assert.equal(resolveDefaultCategoryId([{ id: 99, name: 'Lab Ops', sku: 'ops' }], 'feedback'), 99);
  assert.equal(resolveDefaultCategoryId([], 'bug'), undefined);
});

test('mergeAttachmentFiles enforces cap of 5 and deduplicates files', () => {
  const mk = (name: string, size = 100) => ({ name, size, lastModified: 1 });
  const initial = [mk('a.png'), mk('b.png'), mk('c.png')];
  const merged = mergeAttachmentFiles(initial, [mk('b.png'), mk('d.png'), mk('e.png'), mk('f.png')]);
  assert.equal(merged.files.length, FEEDBACK_MAX_ATTACHMENTS);
  assert.deepEqual(merged.files.map((f) => f.name), ['a.png', 'b.png', 'c.png', 'd.png', 'e.png']);
  assert.equal(merged.duplicateCount, 1);
  assert.equal(merged.skippedCount, 1);
});

test('FEEDBACK_TYPE_CONFIGS covers support, bug, feature, and feedback pills', () => {
  assert.deepEqual(
    FEEDBACK_TYPE_CONFIGS.map((c) => c.key),
    ['support', 'bug', 'feature', 'feedback'],
  );
  assert.equal(getFeedbackTypeConfig('bug').ticketType, 'bug');
  assert.equal(getFeedbackTypeConfig('feature').ticketType, 'feature_request');
  assert.equal(getFeedbackTypeConfig('feedback').ticketType, 'feedback');
  assert.equal(getFeedbackTypeConfig('support').ticketType, 'service_request');
});
