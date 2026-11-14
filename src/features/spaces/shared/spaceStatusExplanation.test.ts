import assert from 'node:assert/strict';
import test from 'node:test';
import { explainSpaceStatus } from './spaceStatusExplanation.ts';
import { resourceBadge } from './resourceStatus.ts';

const base = {
  lifecycle_status: { value: 'in_service' as const, label: 'In service' },
  condition: { value: 'operational' as const, label: 'Operational' },
  availability: { value: 'available' as const, blocked_by: null, condition: null, reason: null },
  activity_status: { value: 'idle' as const, label: 'Idle' },
};

test('explanation agrees with the list badge', () => {
  const states = [
    base,
    { ...base, lifecycle_status: { value: 'retired' as const, label: 'Retired' } },
    { ...base, condition: { value: 'out_of_service' as const, label: 'Out of service' } },
    { ...base, activity_status: { value: 'active' as const, label: 'Active' } },
    { ...base, activity_status: { value: 'scheduled' as const, label: 'Scheduled' } },
  ];
  for (const state of states) {
    const badge = resourceBadge(state, 'bench');
    const explanation = explainSpaceStatus(state, 'bench');
    assert.equal(explanation.title, badge.text);
    assert.equal(explanation.tone, badge.tone);
  }
});

test('blocked resources name the blocking space and reason', () => {
  const blocked = { ...base, availability: { value: 'unavailable' as const, blocked_by: { type: 'room' as const, id: 2, name: 'HIL Room 2' }, condition: 'in_maintenance' as const, reason: 'maintenance' as const } };
  const explanation = explainSpaceStatus(blocked, 'bench');
  assert.equal(explanation.tone, 'warning');
  assert.match(explanation.description, /room HIL Room 2/);
  assert.match(explanation.description, /maintenance/);
});

test('rooms and stations read as operational when healthy', () => {
  assert.equal(explainSpaceStatus(base, 'room').title, 'Operational');
  assert.equal(explainSpaceStatus(base, 'station').tone, 'success');
  assert.equal(explainSpaceStatus(null, 'room').title, 'Unknown');
});
