import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resourceBadge,
  parseDowntimeBookingConflicts,
  getAllowedLifecycleTransitions,
  type ResourceState,
} from './resourceStatus.ts';

test('resourceBadge prioritizes retired and planned lifecycle status', () => {
  const retired: ResourceState = {
    lifecycle_status: { value: 'retired', label: 'Retired' },
    condition: { value: 'operational', label: 'Operational' },
    availability: { value: 'available', blocked_by: null, condition: null, reason: null },
    activity_status: { value: 'active', label: 'Active' },
    status: null,
  };
  assert.deepEqual(resourceBadge(retired), { text: 'Retired', tone: 'neutral' });

  const planned: ResourceState = {
    lifecycle_status: { value: 'planned', label: 'Planned' },
    condition: { value: 'operational', label: 'Operational' },
    availability: { value: 'available', blocked_by: null, condition: null, reason: null },
    activity_status: { value: 'idle', label: 'Idle' },
    status: null,
  };
  assert.deepEqual(resourceBadge(planned), { text: 'Planned', tone: 'info' });
});

test('resourceBadge shows non-operational condition over availability and activity', () => {
  const outOfService: ResourceState = {
    lifecycle_status: { value: 'in_service', label: 'In Service' },
    condition: { value: 'out_of_service', label: 'Out of service' },
    availability: { value: 'unavailable', blocked_by: null, condition: 'out_of_service', reason: 'fault' },
    activity_status: { value: 'idle', label: 'Idle' },
    status: null,
  };
  assert.deepEqual(resourceBadge(outOfService), { text: 'Out of service', tone: 'danger' });

  const inMaintenance: ResourceState = {
    lifecycle_status: { value: 'in_service', label: 'In Service' },
    condition: { value: 'in_maintenance', label: 'In Maintenance' },
    availability: { value: 'unavailable', blocked_by: null, condition: 'in_maintenance', reason: 'maintenance' },
    activity_status: { value: 'idle', label: 'Idle' },
    status: null,
  };
  assert.deepEqual(resourceBadge(inMaintenance), { text: 'In Maintenance', tone: 'warning' });
});

test('resourceBadge shows unavailable blocked_by parent resource when blocked', () => {
  const blockedBench: ResourceState = {
    lifecycle_status: { value: 'in_service', label: 'In Service' },
    condition: { value: 'operational', label: 'Operational' },
    availability: {
      value: 'unavailable',
      blocked_by: { type: 'room', id: 12, name: 'R101' },
      condition: 'in_maintenance',
      reason: 'maintenance',
    },
    activity_status: { value: 'idle', label: 'Idle' },
    status: null,
  };
  assert.deepEqual(resourceBadge(blockedBench), {
    text: 'Unavailable (Room R101)',
    tone: 'warning',
  });
});

test('resourceBadge shows in use and booked today when operational and available', () => {
  const active: ResourceState = {
    lifecycle_status: { value: 'in_service', label: 'In Service' },
    condition: { value: 'operational', label: 'Operational' },
    availability: { value: 'available', blocked_by: null, condition: null, reason: null },
    activity_status: { value: 'active', label: 'Active' },
    status: null,
  };
  assert.deepEqual(resourceBadge(active), { text: 'In use', tone: 'info' });

  const scheduled: ResourceState = {
    lifecycle_status: { value: 'in_service', label: 'In Service' },
    condition: { value: 'operational', label: 'Operational' },
    availability: { value: 'available', blocked_by: null, condition: null, reason: null },
    activity_status: { value: 'scheduled', label: 'Scheduled' },
    status: null,
  };
  assert.deepEqual(resourceBadge(scheduled), { text: 'Booked today', tone: 'reserved' });

  const idle: ResourceState = {
    lifecycle_status: { value: 'in_service', label: 'In Service' },
    condition: { value: 'operational', label: 'Operational' },
    availability: { value: 'available', blocked_by: null, condition: null, reason: null },
    activity_status: { value: 'idle', label: 'Idle' },
    status: null,
  };
  assert.deepEqual(resourceBadge(idle), { text: 'Available', tone: 'success' });
  assert.deepEqual(resourceBadge(idle, 'station'), { text: 'Operational', tone: 'success' });
  assert.deepEqual(resourceBadge(idle, 'room'), { text: 'Operational', tone: 'success' });
});

test('parseDowntimeBookingConflicts extracts booking details', () => {
  const details = [
    {
      field: 'bench_bookings.41',
      code: 'booking_overlaps_downtime',
      message: 'Booking BK-7Q2M (2026-11-20 09:00 to 2026-11-20 11:00) overlaps the downtime.',
    },
    {
      field: 'equipment_bookings.99',
      code: 'booking_overlaps_downtime',
      message: 'Equipment reservation overlaps downtime.',
    },
    {
      field: 'other_field',
      code: 'unrelated_code',
      message: 'Ignored',
    },
  ];

  const parsed = parseDowntimeBookingConflicts(details);
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], {
    kind: 'bench_bookings',
    id: 41,
    message: 'Booking BK-7Q2M (2026-11-20 09:00 to 2026-11-20 11:00) overlaps the downtime.',
  });
  assert.deepEqual(parsed[1], {
    kind: 'equipment_bookings',
    id: 99,
    message: 'Equipment reservation overlaps downtime.',
  });
});

test('getAllowedLifecycleTransitions returns only valid target transitions', () => {
  assert.deepEqual(getAllowedLifecycleTransitions('planned'), ['in_service', 'retired']);
  assert.deepEqual(getAllowedLifecycleTransitions('in_service'), ['retired']);
  assert.deepEqual(getAllowedLifecycleTransitions('retired'), []);
  assert.deepEqual(getAllowedLifecycleTransitions(undefined), []);
});
