import test from 'node:test';
import assert from 'node:assert/strict';
import {
  actionLabel,
  badgeLabel,
  formatExpiry,
  formatRelative,
  isBannerVisible,
  isInAppPath,
  mapInboxItem,
  sortBanners,
  toBannerVariant,
} from './inboxMapper.ts';

test('mapInboxItem reads choice references, display_mode, is_dismissible, and refuses external links', () => {
  const item = mapInboxItem({
    id: 1,
    message: 'Bench 07 frees up at 14:00',
    message_type: { value: 'success' },
    display_mode: { value: 'alert' },
    is_dismissible: true,
    expires_at: '2026-11-27T10:00:00Z',
    action_path: '/booking-calendar?action=create',
    is_read: false,
    created_at: '2026-11-26T10:00:00Z',
  });
  assert.equal(item.kind, 'success');
  assert.equal(item.displayMode, 'alert');
  assert.equal(item.isDismissible, true);
  assert.equal(item.expiresAt, '2026-11-27T10:00:00Z');
  assert.equal(item.actionPath, '/booking-calendar?action=create');
  assert.equal(mapInboxItem({ id: 2, action_path: 'https://evil.example' }).actionPath, null);
  assert.equal(mapInboxItem({ id: 3, action_path: '//evil.example' }).actionPath, null);
  assert.equal(mapInboxItem({ id: 4, message_type: 'nonsense' }).kind, 'info');

  // Legacy announcement without explicit display_mode maps to banner.
  const legacy = mapInboxItem({
    id: 5,
    message: 'Planned maintenance',
    message_type: 'announcement',
    expiry_date: '2026-11-28T10:00:00Z',
  });
  assert.equal(legacy.displayMode, 'banner');
  assert.equal(legacy.expiresAt, '2026-11-28T10:00:00Z');

  // Sticky non-dismissible banner preserves severity tone.
  const sticky = mapInboxItem({
    id: 6,
    message: 'Power outage in Lab B',
    message_type: { value: 'error' },
    display_mode: { value: 'banner' },
    is_dismissible: false,
    expires_at: '2026-11-28T10:00:00Z',
  });
  assert.equal(sticky.displayMode, 'banner');
  assert.equal(sticky.kind, 'error');
  assert.equal(sticky.isDismissible, false);
});

test('isBannerVisible respects displayMode, expiry, read state, and sticky non-dismissible flag', () => {
  const now = Date.parse('2026-11-26T12:00:00Z');
  assert.equal(
    isBannerVisible({ displayMode: 'alert', expiresAt: '2026-11-27T12:00:00Z', isDismissible: true, isRead: false }, now),
    false,
  );
  assert.equal(
    isBannerVisible({ displayMode: 'banner', expiresAt: '2026-11-26T11:59:00Z', isDismissible: false, isRead: false }, now),
    false,
  );
  assert.equal(
    isBannerVisible({ displayMode: 'banner', expiresAt: '2026-11-27T12:00:00Z', isDismissible: true, isRead: true }, now),
    false,
  );
  assert.equal(
    isBannerVisible({ displayMode: 'banner', expiresAt: '2026-11-27T12:00:00Z', isDismissible: true, isRead: false }, now),
    true,
  );
  // Non-dismissible sticky banners stay visible until expiry even if marked read.
  assert.equal(
    isBannerVisible({ displayMode: 'banner', expiresAt: '2026-11-27T12:00:00Z', isDismissible: false, isRead: true }, now),
    true,
  );
});

test('sortBanners orders pinned first, then severity, then newest', () => {
  const sorted = sortBanners([
    { id: 1, is_dismissible: true, message_type: 'info', created: '2026-11-26T10:00:00Z' },
    { id: 2, is_dismissible: true, message_type: 'error', created: '2026-11-26T09:00:00Z' },
    { id: 3, is_dismissible: false, message_type: 'warning', created: '2026-11-26T08:00:00Z' },
    { id: 4, is_dismissible: true, message_type: 'info', created: '2026-11-26T11:00:00Z' },
  ]);
  assert.deepEqual(
    sorted.map((item) => item.id),
    [3, 2, 4, 1],
  );
});

test('toBannerVariant maps legacy announcement to info and preserves severity tones', () => {
  assert.equal(toBannerVariant('announcement'), 'info');
  assert.equal(toBannerVariant('warning'), 'warning');
  assert.equal(toBannerVariant('error'), 'error');
  assert.equal(toBannerVariant('success'), 'success');
  assert.equal(toBannerVariant(undefined), 'info');
});

test('formatExpiry formats same-day, tomorrow, and future dates cleanly', () => {
  const now = new Date(2026, 10, 26, 10, 0);
  assert.equal(formatExpiry(new Date(2026, 10, 26, 17, 30).toISOString(), now), 'Until 17:30');
  assert.equal(formatExpiry(new Date(2026, 10, 27, 9, 0).toISOString(), now), 'Until tomorrow, 09:00');
  assert.equal(formatExpiry(new Date(2026, 10, 30, 14, 15).toISOString(), now), 'Until Nov 30, 14:15');
  assert.equal(formatExpiry(null, now), null);
});

test('isInAppPath and actionLabel', () => {
  assert.equal(isInAppPath('/dashboard'), true);
  assert.equal(isInAppPath('javascript:alert(1)'), false);
  assert.equal(actionLabel('/booking-calendar?x=1'), 'Book now');
  assert.equal(actionLabel('/dashboard'), 'Open');
  assert.equal(actionLabel('/my-bookings'), 'View booking');
  assert.equal(actionLabel('/support-tickets/SUP-9'), 'View ticket');
  assert.equal(actionLabel('/lab-equipment/license'), 'View licenses');
  assert.equal(actionLabel('/lab-monitoring'), 'Open monitoring');
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
