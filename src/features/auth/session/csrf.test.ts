import test from 'node:test';
import assert from 'node:assert/strict';
import { getCsrfToken, setCsrfToken, clearCsrfToken } from './csrf.ts';

// Mock browser global environment for sessionStorage and document
const mockStorage = new Map<string, string>();
(globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => { mockStorage.set(key, value); },
  removeItem: (key: string) => { mockStorage.delete(key); },
  clear: () => { mockStorage.clear(); },
  length: 0,
  key: () => null,
};

test('CSRF helper manages tokens in storage', () => {
  mockStorage.clear();
  assert.equal(getCsrfToken(), null);

  setCsrfToken('test-challenge-csrf-token');
  assert.equal(getCsrfToken(), 'test-challenge-csrf-token');

  clearCsrfToken();
  assert.equal(getCsrfToken(), null);
});

test('CSRF helper falls back to document.cookie if not in sessionStorage', () => {
  mockStorage.clear();
  (globalThis as unknown as { document: { cookie: string } }).document = {
    cookie: 'other=123; csrftoken=cookie-token-value; foo=bar',
  };

  assert.equal(getCsrfToken(), 'cookie-token-value');

  // sessionStorage takes precedence when set
  setCsrfToken('session-token-value');
  assert.equal(getCsrfToken(), 'session-token-value');

  clearCsrfToken();
});
