import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveUserDisplayName } from './displayName.ts';

test('prefers backend display_name when distinct from username', () => {
  assert.equal(resolveUserDisplayName('Nguyen Van A', 'uah2hc', 'Entra Name'), 'Nguyen Van A');
});

test('falls back to MSAL account name when backend display_name is blank', () => {
  assert.equal(resolveUserDisplayName('', 'uah2hc', 'Nguyen Van A'), 'Nguyen Van A');
  assert.equal(resolveUserDisplayName(null, 'uah2hc', '  Nguyen Van A  '), 'Nguyen Van A');
});

test('falls back to MSAL account name when backend display_name equals username', () => {
  assert.equal(resolveUserDisplayName('uah2hc', 'uah2hc', 'Nguyen Van A'), 'Nguyen Van A');
  assert.equal(resolveUserDisplayName('UAH2HC', 'uah2hc', 'Nguyen Van A'), 'Nguyen Van A');
});

test('returns empty string when neither backend nor MSAL has a display name', () => {
  assert.equal(resolveUserDisplayName('', 'uah2hc', ''), '');
  assert.equal(resolveUserDisplayName(undefined, 'uah2hc', undefined), '');
});
