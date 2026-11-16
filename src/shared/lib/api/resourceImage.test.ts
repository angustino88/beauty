import test from 'node:test';
import assert from 'node:assert/strict';
import { resourceImageUrl, validateResourceImage, RESOURCE_IMAGE_MAX_BYTES } from './resourceImage.ts';

test('validateResourceImage accepts JPEG, PNG, GIF and WebP up to 5 MB', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/gif', 'image/webp']) {
    assert.equal(validateResourceImage({ type, size: 1024 }), null);
  }
  assert.equal(validateResourceImage({ type: 'image/png', size: RESOURCE_IMAGE_MAX_BYTES }), null);
});

test('validateResourceImage rejects other types and files over 5 MB', () => {
  assert.match(validateResourceImage({ type: 'image/svg+xml', size: 10 }) ?? '', /JPG, PNG, GIF or WEBP/);
  assert.match(validateResourceImage({ type: 'image/png', size: RESOURCE_IMAGE_MAX_BYTES + 1 }) ?? '', /5 MB/);
});

test('resourceImageUrl builds the per-resource image path', () => {
  assert.equal(resourceImageUrl('rooms', 4), '/api/labs/rooms/4/image');
  assert.equal(resourceImageUrl('equipment', 9), '/api/labs/equipment/9/image');
});
