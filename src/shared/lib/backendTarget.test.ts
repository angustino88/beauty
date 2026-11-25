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
  clearSelectedBackend,
  getSelectedBackend,
  isSafePrefix,
  joinUrl,
  parseRoute,
  readConfig,
  resolveApiMode,
  resolveBackendForIdToken,
  setSelectedBackend,
} from './backendTarget.ts';

test('mode switch defaults to direct', () => {
  assert.equal(resolveApiMode(undefined), 'direct');
  assert.equal(resolveApiMode('ROUTER '), 'router');
  assert.equal(resolveApiMode('anything'), 'direct');
  assert.deepEqual(readConfig({ VITE_API_URL: 'http://api:8000/' }, 'https://app'), {
    mode: 'direct', apiUrl: 'http://api:8000', routerUrl: 'https://app',
  });
  assert.equal(readConfig({ VITE_API_MODE: 'router', VITE_ROUTER_URL: 'https://router' }).routerUrl, 'https://router');
  // Empty URLs: same origin (the frontend's nginx proxies the API).
  assert.deepEqual(readConfig({ VITE_API_MODE: 'router' }, 'https://labmango.example'), {
    mode: 'router', apiUrl: 'https://labmango.example', routerUrl: 'https://labmango.example',
  });
});

test('base URL follows the mode and the selected backend', () => {
  const direct = { mode: 'direct' as const, apiUrl: 'http://api:8000', routerUrl: '' };
  const router = { mode: 'router' as const, apiUrl: '', routerUrl: 'https://router.example' };
  const selected = { backendId: 'dept_a', name: 'Lab A', prefix: '/t/abc123' };
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

test('router answers are validated', () => {
  assert.deepEqual(parseRoute({ backend_id: 'dept_a', name: 'Lab A', prefix: '/t/a' }), {
    backendId: 'dept_a', name: 'Lab A', prefix: '/t/a',
  });
  assert.equal(parseRoute({ prefix: '//evil' }), null);
  assert.equal(parseRoute('nope'), null);
});

test('selection is persisted and cleared', () => {
  store.clear();
  setSelectedBackend({ backendId: 'dept_a', name: 'Lab A', prefix: '/t/abc' });
  assert.deepEqual(getSelectedBackend(), { backendId: 'dept_a', name: 'Lab A', prefix: '/t/abc' });
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
    fetchImpl: fakeFetch(200, { data: { backend_id: 'dept_a', name: 'Lab A', prefix: '/t/abc' } }, seen),
  });
  assert.deepEqual(ok, { backendId: 'dept_a', name: 'Lab A', prefix: '/t/abc' });
  assert.equal(seen.url, 'https://router/routing/resolve/user');
  assert.equal(seen.init?.method, 'POST');
  assert.equal(seen.init?.body, JSON.stringify({ id_token: 'tok' }));

  const error = (code: string) => ({ error: { code, message: 'm', details: [], request_id: 'r' } });
  for (const [status, code] of [[404, 'not_routed'], [409, 'ambiguous_route'], [400, 'invalid_token'], [502, 'internal_error']] as const) {
    await assert.rejects(
      resolveBackendForIdToken('tok', { routerUrl: 'https://router', fetchImpl: fakeFetch(status, error(code)) }),
      (e: unknown) => e instanceof BackendRoutingError && e.status === status && e.code === code,
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
