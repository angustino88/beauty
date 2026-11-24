import assert from 'node:assert/strict';
import test from 'node:test';
import { lifecycleSummaryCards } from './spaceOverviewStatuses.ts';

test('space summary shows lifecycle labels and keeps in-service distinct from availability', () => {
  const counts = [
    { status: { value: 'planned', label: 'Planned' }, resource_count: 0 },
    { status: { value: 'in_service', label: 'In service' }, resource_count: 2 },
    { status: { value: 'retired', label: 'Retired' }, resource_count: 1 },
  ];
  assert.deepEqual(lifecycleSummaryCards(counts), [
    { key: 'planned', label: 'Planned', tone: 'info' },
    { key: 'in_service', label: 'In service', tone: 'success' },
    { key: 'retired', label: 'Retired', tone: 'neutral' },
  ]);
});
