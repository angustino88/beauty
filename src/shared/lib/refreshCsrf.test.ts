import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map<string, string>();
(globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
  clear: () => { storage.clear(); },
  length: 0,
  key: () => null,
};

import { getRefreshCsrfToken } from './refreshCsrf.ts';

test('reuses a stored token without fetching', async () => {
  storage.set('lm:csrf_token', 'stored');
  assert.equal(await getRefreshCsrfToken('https://backend.example'), 'stored');
  storage.clear();
});

test('requests and stores CSRF before a refresh when storage is empty', async () => {
  storage.clear();
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = (async (_url, options) => {
    requests++;
    assert.equal(options?.credentials, 'include');
    return new Response(JSON.stringify({ data: { csrf_token: 'new-csrf' } }), { status: 200 });
  }) as typeof fetch;
  try {
    assert.equal(await getRefreshCsrfToken('https://backend.example'), 'new-csrf');
    assert.equal(await getRefreshCsrfToken('https://backend.example'), 'new-csrf');
    assert.equal(requests, 1);
  } finally {
    globalThis.fetch = originalFetch;
    storage.clear();
  }
});

test('rejects failed or malformed CSRF responses', async () => {
  storage.clear();
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () => new Response(null, { status: 403 })) as typeof fetch;
    await assert.rejects(getRefreshCsrfToken('https://backend.example'), /Unable to obtain/);
    globalThis.fetch = (async () => new Response('{}', { status: 200 })) as typeof fetch;
    await assert.rejects(getRefreshCsrfToken('https://backend.example'), /missing token/);
    assert.equal(storage.size, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});