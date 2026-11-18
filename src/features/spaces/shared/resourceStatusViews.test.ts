import assert from 'node:assert/strict';
import test from 'node:test';
import { activityView, availabilityView, lifecycleView } from './resourceStatusViews.ts';
import type { ResourceState } from './resourceStatus.ts';

const base: ResourceState = {
  lifecycle_status: { value: 'in_service', label: 'In service' },
  condition: { value: 'operational', label: 'Operational' },
  availability: { value: 'available', blocked_by: null, condition: null, reason: null },
  activity_status: { value: 'idle', label: 'Idle' },
};

test('lifecycle tones match the overview tiles', () => {
  assert.deepEqual(
    (['planned', 'in_service', 'retired'] as const).map((value) => lifecycleView({ ...base, lifecycle_status: { value, label: value } }).tone),
    ['info', 'success', 'neutral'],
  );
});

test('availability names the reason, own condition before a blocking parent', () => {
  assert.equal(availabilityView(base).label, 'Available');
  assert.equal(availabilityView({ ...base, condition: { value: 'out_of_service', label: '' } }).tone, 'danger');
  const blocked = availabilityView({ ...base, availability: { value: 'unavailable', blocked_by: { type: 'room', id: 1, name: 'R1' }, condition: null, reason: 'renovation' } });
  assert.deepEqual([blocked.label, blocked.detail], ['Blocked by room', 'Its room R1 is renovation.']);
  assert.equal(availabilityView({ ...base, lifecycle_status: { value: 'retired', label: '' } }).label, 'Not in service');
});

test('activity is always a value, and rooms and stations speak about their benches', () => {
  assert.deepEqual([activityView(base).label, activityView(base).tone], ['No booking', 'neutral']);
  assert.match(activityView({ ...base, activity_status: { value: 'active', label: '' } }, 'station').detail, /bench in this station/);
});
