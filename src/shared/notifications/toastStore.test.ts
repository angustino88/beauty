import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_TOAST_DURATIONS,
  MAX_VISIBLE_TOASTS,
  dismissToast,
  getToastsSnapshot,
  notify,
  pauseToast,
  resumeToast,
  updateToast,
} from './toastStore.ts';

test('applies severity-appropriate default durations and persists errors until dismissed', () => {
  notify.clear();
  notify.success('Equipment created');
  notify.error('Unable to save equipment');

  const snapshot = getToastsSnapshot();
  assert.equal(snapshot.length, 2);
  assert.equal(snapshot[0].variant, 'error');
  assert.equal(snapshot[0].duration, 0);
  assert.equal(snapshot[1].variant, 'success');
  assert.equal(snapshot[1].duration, DEFAULT_TOAST_DURATIONS.success);

  notify.clear();
});

test('deduplicates identical active notifications and increments occurrence count', () => {
  notify.clear();
  const id1 = notify.warning('Rate limit approaching', { description: 'Wait before retrying.' });
  const id2 = notify.warning('Rate limit approaching', { description: 'Wait before retrying.' });

  assert.equal(id1, id2);
  const snapshot = getToastsSnapshot();
  assert.equal(snapshot.length, 1);
  assert.equal(snapshot[0].count, 2);

  notify.clear();
});

test('enforces maximum visible toast stack by evicting oldest auto-dismissible items first', () => {
  notify.clear();
  const errId = notify.error('Persistent error');
  for (let i = 0; i < MAX_VISIBLE_TOASTS + 2; i += 1) {
    notify.success(`Saved item ${i}`);
  }

  const snapshot = getToastsSnapshot();
  assert.equal(snapshot.length, MAX_VISIBLE_TOASTS);
  assert.equal(snapshot.some((item) => item.id === errId), true);

  notify.clear();
});

test('supports loading -> success transition via updateToast and manual dismiss', () => {
  notify.clear();
  const id = notify.loading('Exporting workbook...');
  assert.equal(getToastsSnapshot()[0].dismissible, false);

  updateToast(id, { variant: 'success', title: 'Workbook exported' });
  const updated = getToastsSnapshot()[0];
  assert.equal(updated.variant, 'success');
  assert.equal(updated.dismissible, true);
  assert.equal(updated.duration, DEFAULT_TOAST_DURATIONS.success);

  dismissToast(id);
  assert.equal(getToastsSnapshot().length, 0);
});

test('pauses and resumes auto-dismiss state cleanly', () => {
  notify.clear();
  const id = notify.info('Sync started', { duration: 10_000 });
  pauseToast(id);
  assert.equal(getToastsSnapshot()[0].paused, true);

  resumeToast(id);
  assert.equal(getToastsSnapshot()[0].paused, false);

  notify.clear();
});
