import test from 'node:test';
import assert from 'node:assert/strict';
import { mapUserOptions } from './mapper.ts';

test('mapUserOptions maps user selector options and preserves optional display_name', () => {
  const result = mapUserOptions({
    data: [
      { id: 1, username: 'alice', display_name: 'Alice Admin' },
      { id: 2, username: 'bob', display_name: '' },
    ],
  } as Parameters<typeof mapUserOptions>[0]);

  assert.deepEqual(result, [
    { id: 1, username: 'alice', display_name: 'Alice Admin' },
    { id: 2, username: 'bob' },
  ]);
});
