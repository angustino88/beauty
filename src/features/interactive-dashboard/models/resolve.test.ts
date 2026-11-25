import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_FIT, resolveModel } from './resolve.ts';
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

test('one library asset resolves for several targets with their own fitting', () => {
  const device = resolveModel(asset(), { ...DEFAULT_FIT, rotation: 15, scale: 0.5, offset_y: 0.2 });
  const category = resolveModel(asset(), DEFAULT_FIT);
  assert.equal(device.cacheKey, category.cacheKey);
  assert.equal(device.rotation, 105);
  assert.equal(category.rotation, 90);
  assert.equal(device.surface, 0.6);
  assert.deepEqual([device.scale, device.offset_y], [0.5, 0.2]);
});

test('a refetched pre-signed link or metadata edit keeps the first link, so the model is not reloaded', () => {
  const first = resolveModel(asset(), DEFAULT_FIT);
  const refetched = resolveModel(asset({ url: 'https://storage.example/visual_models/a.glb?X-Amz-Date=2', version: 3 }), DEFAULT_FIT);
  assert.equal(refetched.url, first.url);
  assert.equal(refetched.cacheKey, first.cacheKey);
  const other = resolveModel(asset({ id: 8, sha256: 'b'.repeat(64), url: 'https://storage.example/b.glb' }), DEFAULT_FIT);
  assert.notEqual(other.cacheKey, first.cacheKey);
  assert.equal(other.url, 'https://storage.example/b.glb');
});
