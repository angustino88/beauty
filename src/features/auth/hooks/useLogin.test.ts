import test from 'node:test';
import assert from 'node:assert/strict';

// Mock storage
const mockStorage = new Map<string, string>();
(globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => { mockStorage.set(key, value); },
  removeItem: (key: string) => { mockStorage.delete(key); },
  clear: () => { mockStorage.clear(); },
  length: 0,
  key: () => null,
};

import { createLoginNonce, hasLoginNonceSecret, storeRedirectIdToken, takeLoginCredentials, clearLoginCredentials } from '../session/loginNonce.ts';

test('browser nonce is the SHA-256 base64url digest of the stored secret', async () => {
  mockStorage.clear();
  const nonce = await createLoginNonce();
  assert.match(nonce, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(hasLoginNonceSecret(), true);
  const secret = mockStorage.get('labmango.loginNonceSecret')!;
  assert.match(secret, /^[A-Za-z0-9_-]{43}$/);
  const expected = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))).toString('base64url');
  assert.equal(nonce, expected);
  assert.notEqual(nonce, secret);
});

test('redirect token and nonce secret can only be consumed once', () => {
  mockStorage.clear();
  storeRedirectIdToken('unrelated-token');
  assert.equal(takeLoginCredentials(), null);
  sessionStorage.setItem('labmango.loginNonceSecret', 'secret');
  storeRedirectIdToken('fresh-token');
  assert.deepEqual(takeLoginCredentials(), { idToken: 'fresh-token', nonceSecret: 'secret' });
  assert.equal(takeLoginCredentials(), null);
  assert.equal(hasLoginNonceSecret(), false);
  sessionStorage.setItem('labmango.loginNonceSecret', 'another-secret');
  storeRedirectIdToken('another-token');
  clearLoginCredentials();
  assert.equal(takeLoginCredentials(), null);
});
