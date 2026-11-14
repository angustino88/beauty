import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeListResponse } from './endpointHelpers.ts';

test('normalizeListResponse uses canonical pagination count for a partial page', () => {
  const result = normalizeListResponse({
    meta: { pagination: { count: 47, page: 2, page_size: 10 } },
    data: [{ id: 11 }, { id: 12 }],
  });

  assert.equal(result.total_count, 47);
  assert.deepEqual(result.data, [{ id: 11 }, { id: 12 }]);
});

test('normalizeListResponse preserves legacy total_count precedence', () => {
  const result = normalizeListResponse({
    total_count: 8,
    meta: { pagination: { count: 47 } },
    data: [{ id: 1 }],
  });

  assert.equal(result.total_count, 8);
});

test('normalizeListResponse reads pagination metadata from nested data envelope', () => {
  const result = normalizeListResponse({
    data: {
      meta: { pagination: { count: 31 } },
      data: [{ id: 3 }],
    },
  });

  assert.equal(result.total_count, 31);
  assert.deepEqual(result.data, [{ id: 3 }]);
});

test('normalizeListResponse falls back to returned row count for invalid metadata', () => {
  const result = normalizeListResponse({
    meta: { pagination: { count: 'not-a-number' } },
    data: [{ id: 1 }, { id: 2 }],
  });

  assert.equal(result.total_count, 2);
});