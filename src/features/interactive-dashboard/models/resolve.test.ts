import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAsset } from './resolve.ts';
import type { VisualModelAsset } from './api.ts';

const asset = (patch: Partial<VisualModelAsset> = {}): VisualModelAsset => ({
  id: 7,
  name: 'Scope',
  url: 'https://storage.example/visual_models/a.glb?X-Amz-Date=1',
  sha256: 'a'.repeat(64),
  size: 1000,
  source_url: '',
  license: '',
  rotation: 90,
  surface: 0.6,
  usage_count: 2,
  version: 1,
  updated_at: '2026-11-25T00:00:00Z',
  ...patch,
});

test('an asset resolves to its own placement', () => {
  const model = resolveAsset(asset());
  assert.deepEqual([model.rotation, model.surface, model.scale], [90, 0.6, 1]);
});

test('a refetched pre-signed link or metadata edit keeps the first link, so the model is not reloaded', () => {
  const first = resolveAsset(asset());
  const refetched = resolveAsset(asset({ url: 'https://storage.example/visual_models/a.glb?X-Amz-Date=2', version: 3, rotation: 0 }));
  assert.equal(refetched.url, first.url);
  assert.equal(refetched.cacheKey, first.cacheKey);
  assert.equal(refetched.rotation, 0);
  const other = resolveAsset(asset({ id: 8, sha256: 'b'.repeat(64), url: 'https://storage.example/b.glb' }));
  assert.notEqual(other.cacheKey, first.cacheKey);
  assert.equal(other.url, 'https://storage.example/b.glb');
});
