import test from 'node:test';
import assert from 'node:assert/strict';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
  length: 0,
  key: () => null,
};

import {
  apiBaseUrlFor,
  BackendRoutingError,
  chooseBackend,
  clearSelectedBackend,
  getSelectedBackend,
  isSafePrefix,
  joinUrl,
  readConfig,
  resolveApiMode,
  resolveBackendForIdToken,
  setSelectedBackend,
} from './backendTarget.ts';

test('mode switch defaults to direct', () => {
  assert.equal(resolveApiMode(undefined), 'direct');
  assert.equal(resolveApiMode('ROUTER '), 'router');
  assert.equal(resolveApiMode('anything'), 'direct');
  assert.deepEqual(readConfig({ VITE_API_URL: 'http://api:8000/' }), {
    mode: 'direct', apiUrl: 'http://api:8000', routerUrl: 'http://api:8000',
  });
  assert.equal(readConfig({ VITE_API_MODE: 'router', VITE_ROUTER_URL: 'https://router' }).routerUrl, 'https://router');
});

test('base URL follows the mode and the selected backend', () => {
  const direct = { mode: 'direct' as const, apiUrl: 'http://api:8000', routerUrl: '' };
  const router = { mode: 'router' as const, apiUrl: '', routerUrl: 'https://router.example' };
  const selected = { backendName: 'Lab A', prefix: '/t/abc123' };
  assert.equal(apiBaseUrlFor(direct, selected), 'http://api:8000');
  assert.equal(apiBaseUrlFor(router, selected), 'https://router.example/t/abc123');
  assert.equal(apiBaseUrlFor(router, null), 'https://router.example');
  assert.equal(joinUrl('https://router.example/t/abc123', '/media/x.png'), 'https://router.example/t/abc123/media/x.png');
  assert.equal(joinUrl('http://api/', 'api/x'), 'http://api/api/x');
});

test('only /t/<prefix_key> prefixes are accepted', () => {
  assert.equal(isSafePrefix('/t/abc_1-2'), true);
  assert.equal(isSafePrefix('https://evil.example'), false);
  assert.equal(isSafePrefix('/t/../admin'), false);
  assert.equal(isSafePrefix('/t/a/b'), false);
});

test('the previous backend is kept when the router still offers it', () => {
  const mappings = [{ backend_name: 'A', prefix: '/t/a' }, { backend_name: 'B', prefix: '/t/b' }, { prefix: 'bad' }];
  assert.deepEqual(chooseBackend(mappings, { backendName: 'B', prefix: '/t/b' }), { backendName: 'B', prefix: '/t/b' });
  assert.deepEqual(chooseBackend(mappings, null), { backendName: 'A', prefix: '/t/a' });
  assert.equal(chooseBackend([{ prefix: '//evil' }], null), null);
  assert.equal(chooseBackend('nope', null), null);
});

test('selection is persisted and cleared', () => {
  store.clear();
  setSelectedBackend({ backendName: 'Lab A', prefix: '/t/abc' });
  assert.deepEqual(getSelectedBackend(), { backendName: 'Lab A', prefix: '/t/abc' });
  store.set('labmango.routedBackend', JSON.stringify({ prefix: 'https://evil' }));
  assert.equal(getSelectedBackend(), null);
  clearSelectedBackend();
  assert.equal(getSelectedBackend(), null);
});

function fakeFetch(status: number, body: unknown, seen: { url?: string; init?: RequestInit } = {}) {
  return async (url: string, init?: RequestInit) => {
    seen.url = url;
    seen.init = init;
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  };
}

test('router lookup posts the ID token and maps errors', async () => {
  const seen: { url?: string; init?: RequestInit } = {};
  const ok = await resolveBackendForIdToken('tok', {
    routerUrl: 'https://router/',
    previous: null,
    fetchImpl: fakeFetch(200, { mappings: [{ backend_name: 'Lab A', prefix: '/t/abc' }] }, seen),
  });
  assert.deepEqual(ok, { backendName: 'Lab A', prefix: '/t/abc' });
  assert.equal(seen.url, 'https://router/routing/auth/backend-info/by-id-token/');
  assert.equal(seen.init?.method, 'POST');
  assert.equal(seen.init?.body, JSON.stringify({ id_token: 'tok' }));

  for (const [status, body] of [[404, { detail: 'x' }], [409, { detail: 'claimed twice' }], [400, {}], [502, {}]] as const) {
    await assert.rejects(
      resolveBackendForIdToken('tok', { routerUrl: 'https://router', previous: null, fetchImpl: fakeFetch(status, body) }),
      (e: unknown) => e instanceof BackendRoutingError && e.status === status,
    );
  }
  await assert.rejects(
    resolveBackendForIdToken('tok', {
      routerUrl: 'https://router',
      fetchImpl: async () => { throw new TypeError('network'); },
    }),
    /unreachable/,
  );
});
