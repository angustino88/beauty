import test from 'node:test';
import assert from 'node:assert/strict';
import { extractBlockerSearchToken, parseBlockedDeleteError } from './deleteBlockers.ts';

test('parseBlockedDeleteError groups flattened totals and preview items in order', () => {
  const parsed = parseBlockedDeleteError({
    status: 409,
    data: {
      error: {
        code: 'room_conflict',
        message: 'Move or detach stations and move the equipment kept in this room before deleting it.',
        details: [
          { field: 'stations_total', code: 'invalid', message: '6' },
          { field: 'stations[0]', code: 'invalid', message: 'ST-01 — Main Rack' },
          { field: 'stations[1]', code: 'invalid', message: 'ST-02 — Auxiliary Rack' },
          { field: 'equipment_total', code: 'invalid', message: '1' },
          { field: 'equipment[0]', code: 'invalid', message: 'EQ-01 — Oscilloscope' },
        ],
      },
    },
  });

  assert.equal(parsed.isConflict, true);
  assert.equal(parsed.code, 'room_conflict');
  assert.deepEqual(parsed.groups, [
    {
      key: 'stations',
      total: 6,
      items: ['ST-01 — Main Rack', 'ST-02 — Auxiliary Rack'],
    },
    {
      key: 'equipment',
      total: 1,
      items: ['EQ-01 — Oscilloscope'],
    },
  ]);
});

test('parseBlockedDeleteError handles message-only 409 conflicts cleanly', () => {
  const parsed = parseBlockedDeleteError({
    status: 409,
    data: {
      error: {
        code: 'bench_conflict',
        message: 'Cancel active bookings before deleting this bench.',
        details: [],
      },
    },
  });

  assert.equal(parsed.isConflict, true);
  assert.equal(parsed.message, 'Cancel active bookings before deleting this bench.');
  assert.deepEqual(parsed.groups, []);
});

test('extractBlockerSearchToken returns SKU prefix before em-dash separator', () => {
  assert.equal(extractBlockerSearchToken('ST-01 — Main Rack'), 'ST-01');
  assert.equal(extractBlockerSearchToken('BN-42'), 'BN-42');
});
