import test from 'node:test';
import assert from 'node:assert/strict';
import { actionLabel, badgeLabel, formatRelative, isInAppPath, mapInboxItem } from './inboxMapper.ts';

test('mapInboxItem reads choice references and refuses external links', () => {
  const item = mapInboxItem({
    id: 1,
    message: 'Bench 07 frees up at 14:00',
    message_type: { value: 'success' },
    action_path: '/booking-calendar?action=create',
    is_read: false,
    created_at: '2026-11-26T10:00:00Z',
  });
  assert.equal(item.kind, 'success');
  assert.equal(item.actionPath, '/booking-calendar?action=create');
  assert.equal(mapInboxItem({ id: 2, action_path: 'https://evil.example' }).actionPath, null);
  assert.equal(mapInboxItem({ id: 3, action_path: '//evil.example' }).actionPath, null);
  assert.equal(mapInboxItem({ id: 4, message_type: 'nonsense' }).kind, 'info');
});

test('isInAppPath and actionLabel', () => {
  assert.equal(isInAppPath('/dashboard'), true);
  assert.equal(isInAppPath('javascript:alert(1)'), false);
  assert.equal(actionLabel('/booking-calendar?x=1'), 'Book now');
  assert.equal(actionLabel('/dashboard'), 'Open');
});

test('formatRelative uses short human labels', () => {
  const now = new Date(2026, 10, 26, 12, 0);
  assert.equal(formatRelative(new Date(2026, 10, 26, 11, 59, 30).toISOString(), now), 'Just now');
  assert.equal(formatRelative(new Date(2026, 10, 26, 11, 55).toISOString(), now), '5 min ago');
  assert.equal(formatRelative(new Date(2026, 10, 26, 9, 0).toISOString(), now), '3 h ago');
  assert.equal(formatRelative(new Date(2026, 10, 25, 18, 0).toISOString(), now), 'Yesterday');
  assert.equal(formatRelative(new Date(2026, 10, 20, 18, 0).toISOString(), now), 'Nov 20');
});

test('badgeLabel hides zero and caps at 99+', () => {
  assert.equal(badgeLabel(0), null);
  assert.equal(badgeLabel(7), '7');
  assert.equal(badgeLabel(120), '99+');
});
