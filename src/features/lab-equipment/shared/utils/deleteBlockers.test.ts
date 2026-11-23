import test from 'node:test';
import assert from 'node:assert/strict';
import { extractBlockerSearchToken, parseBlockedDeleteError, splitBlockerLabel } from './deleteBlockers.ts';

test('parseBlockedDeleteError groups flattened totals, entries, and equipment category keys in order', () => {
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
          { field: 'equipment_categories[0]', code: 'invalid', message: 'instrument' },
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
      entries: [
        { label: 'ST-01 — Main Rack', sku: 'ST-01', name: 'Main Rack', categoryKey: null },
        { label: 'ST-02 — Auxiliary Rack', sku: 'ST-02', name: 'Auxiliary Rack', categoryKey: null },
      ],
    },
    {
      key: 'equipment',
      total: 1,
      items: ['EQ-01 — Oscilloscope'],
      entries: [
        { label: 'EQ-01 — Oscilloscope', sku: 'EQ-01', name: 'Oscilloscope', categoryKey: 'instrument' },
      ],
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

test('extractBlockerSearchToken and splitBlockerLabel parse em-dash labels cleanly', () => {
  assert.equal(extractBlockerSearchToken('ST-01 — Main Rack'), 'ST-01');
  assert.equal(extractBlockerSearchToken('BN-42'), 'BN-42');
  assert.deepEqual(splitBlockerLabel('COMP-0008 — Computing Unit 008'), {
    sku: 'COMP-0008',
    name: 'Computing Unit 008',
  });
  assert.deepEqual(splitBlockerLabel('BK-2026-001'), {
    sku: 'BK-2026-001',
    name: null,
  });
});
