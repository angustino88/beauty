import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapDashboardBench,
  mapDashboardListResponse,
  mapDashboardSummaryResponse,
  mapBenchGroupsResponse,
  mapBenchDetailResponse,
  mapFavoriteResponse,
} from './mapper.ts';
import { isCurrentlyBooked } from './types.ts';

test('mapDashboardBench maps backend bench data correctly with compatibility fields', () => {
  const backendBench = {
    id: 42,
    sku: 'BNCH-0042',
    name: 'Bench Alpha',
    lifecycle_status: { value: 'in_service', label: 'In service' },
    condition: { value: 'in_maintenance', label: 'In maintenance' },
    bench_group: {
      id: 10,
      name: 'Powertrain Lab',
      description: 'Testing powertrain rigs',
    },
    bench_type: {
      id: 1,
      name: 'Hardware-in-the-Loop',
    },
    location: {
      station: { id: 101, name: 'Station A' },
      room: { id: 5, name: 'Room 302' },
      building: { id: 9, name: 'B1' },
      slot_label: 'Slot 4',
    },
    is_favorite: true,
    current_booking: {
      id: 99,
      booking_code: 'BK-999',
      starts_at: '2026-10-30T00:00:00Z',
      ends_at: '2026-10-30T23:59:59Z',
      status: 'in-progress',
      user: {
        id: 7,
        name: 'John Doe',
      },
    },
    computing: {
      id: 200,
      sku: 'COMP-01',
      name: 'RigPC-01',
      ip_address: '192.168.1.100',
      os_name: 'Windows 11',
      rdp_file_url: 'https://example.com/rdp/42.rdp',
      activity_status: 'active',
      remote_user: 'jdoe',
      remote_user_display_name: 'John Doe',
      remote_ip: '10.0.0.5',
    },
    samples: [{ id: 1, sku: 'SMP-1', name: 'Sample ECU' }],
    licenses: [{ id: 2, sku: 'LIC-1', name: 'CANoe Pro' }],
    assigned_equipment_count: 5,
    image_url: 'https://example.com/img/42.png',
    updated_at: '2026-10-30T10:00:00Z',
  };

  const result = mapDashboardBench(backendBench);
  assert.equal(result.lifecycle_status, 'in_service');
  assert.equal(result.condition, 'in_maintenance');

  assert.equal(result.id, 42);
  assert.equal(result.name, 'Bench Alpha');
  assert.equal(result.lab_name, 'Bench Alpha');
  assert.equal(result.sku, 'BNCH-0042');
  assert.equal(result.is_favorite, true);
  assert.equal(result.location_name, 'Room 302 - Station A');
  assert.equal(result.bench_group?.name, 'Powertrain Lab');
  assert.equal(result.lab_group?.lab_group_name, 'Powertrain Lab');
  assert.equal(result.computing?.activity_status, 'active');
  assert.equal(result.computer?.status, 'active');
  assert.equal(result.computer?.computer_name, 'RigPC-01');
  assert.equal(result.remote_user?.username, 'jdoe');
  assert.equal(result.samples[0].name, 'Sample ECU');
  assert.equal(result.samples_list?.[0].name, 'Sample ECU');
});

test('mapDashboardListResponse handles pagination envelope and items', () => {
  const payload = {
    meta: {
      pagination: {
        count: 100,
        page: 1,
        page_size: 10,
        next: 'http://example.com/?page=2',
        previous: null,
      },
    },
    data: [
      { id: 1, name: 'Bench 1', sku: 'B-1' },
      { id: 2, name: 'Bench 2', sku: 'B-2' },
    ],
  };

  const result = mapDashboardListResponse(payload);
  assert.equal(result.total_count, 100);
  assert.equal(result.results.length, 2);
  assert.equal(result.results[0].name, 'Bench 1');
  assert.equal(result.results[1].name, 'Bench 2');
});

test('mapDashboardBench defaults missing computing activity status to unknown', () => {
  const result = mapDashboardBench({ id: 10, name: 'Bench without computing status' });

  assert.equal(result.computing, null);
  assert.equal(result.lifecycle_status, '');
});

test('mapDashboardSummaryResponse maps operational summary distributions', () => {
  const payload = {
    data: {
      total_benches: 25,
      active_bookings_count: 12,
      favorited_benches_count: 5,
      lifecycle_distribution: { planned: 2, in_service: 23 },
      condition_distribution: { operational: 20, in_maintenance: 5 },
      activity_distribution: { free: 8, active: 10, inactive: 4, offline: 3 },
      utilization_rate: 68.5,
    },
  };

  const result = mapDashboardSummaryResponse(payload);
  assert.equal(result.total_benches, 25);
  assert.deepEqual(result.condition_distribution, { operational: 20, in_maintenance: 5 });
  assert.equal(result.total, 25);
  assert.equal(result.activity_distribution['active'], 10);
  assert.equal(result.status['active'], 10);
  assert.equal(result.status['free'], 8);
  assert.equal(result.utilization_rate, 68.5);
});

test('mapBenchGroupsResponse extracts groups from SchemaRead3 format', () => {
  const payload = {
    data: [
      {
        groups: [
          { id: 1, name: 'Group Alpha', description: 'Desc A', is_active: true },
          { id: 2, name: 'Group Beta', description: 'Desc B', is_active: true },
        ],
        types: [],
      },
    ],
  };

  const result = mapBenchGroupsResponse(payload);
  assert.equal(result.length, 2);
  assert.equal(result[0].name, 'Group Alpha');
  assert.equal(result[1].name, 'Group Beta');
});

test('mapBenchDetailResponse extracts equipment by category into lab_equipment', () => {
  const detailPayload = {
    data: {
      id: 10,
      sku: 'BNCH-10',
      name: 'Lab Rig 10',
      lifecycle_status: { value: 'in_service', label: 'In service' },
      condition: { value: 'operational', label: 'Operational' },
      bench_group: { id: 1, name: 'Main' },
      equipment_by_category: [
        {
          id: 1,
          name: 'Computer',
          equipment: [{ id: 101, sku: 'PC-1', name: 'Workstation 1', role: 'Host', position: 1, assigned_at: '2026-01-01', licenses: [] }],
        },
        {
          id: 2,
          name: 'Rack Equipment',
          equipment: [{ id: 102, sku: 'RCK-1', name: 'Server Rack 42U', role: 'Housing', position: 1, assigned_at: '2026-01-01', licenses: [] }],
        },
        {
          id: 3,
          name: 'Sample',
          equipment: [{ id: 103, sku: 'SMP-10', name: 'ECU Prototype', role: 'DUT', position: 1, assigned_at: '2026-01-01', licenses: [] }],
        },
      ],
      upcoming_bookings: [],
    },
  };

  const result = mapBenchDetailResponse(detailPayload);
  assert.equal(result.id, 10);
  assert.equal(result.name, 'Lab Rig 10');
  assert.equal(result.lifecycle_status, 'in_service');
  assert.equal(result.condition, 'operational');
  assert.equal(result.lab_equipment?.computer?.computer_name, 'Workstation 1');
  assert.equal(result.lab_equipment?.rack?.name, 'Server Rack 42U');
  assert.equal(result.lab_equipment?.samples_list[0].name, 'ECU Prototype');
});

test('mapFavoriteResponse extracts is_favorite flag correctly', () => {
  const res = mapFavoriteResponse({ data: { is_favorite: true } });
  assert.equal(res.data.is_favorite, true);

  const resFalse = mapFavoriteResponse({ data: { is_favorite: false } });
  assert.equal(resFalse.data.is_favorite, false);
});

test('isCurrentlyBooked correctly detects active booking intervals', () => {
  const currentBooking = {
    id: 1,
    booking_code: 'BK-1',
    starts_at: '2020-01-01T00:00:00Z',
    ends_at: '2030-01-01T00:00:00Z',
    status: 'in-progress',
    user: null,
  };

  assert.equal(isCurrentlyBooked(currentBooking), true);

  const pastBooking = {
    id: 2,
    booking_code: 'BK-2',
    starts_at: '2020-01-01T00:00:00Z',
    ends_at: '2021-01-01T00:00:00Z',
    status: 'completed',
    user: null,
  };

  assert.equal(isCurrentlyBooked(pastBooking), false);
  assert.equal(isCurrentlyBooked(null), false);
});

test('mapBenchDetailResponse puts the status start time on the current offline or inactive status', () => {
  const detail = (status: string) => mapBenchDetailResponse({
    data: {
      id: 11,
      name: 'Rig 11',
      computing: { id: 7, name: 'PC-7', activity_status: status, status_started_at: '2026-11-19T06:00:00Z' },
      equipment_by_category: [],
      upcoming_bookings: [],
    },
  });

  const offline = detail('offline');
  assert.equal(offline.computing?.status_started_at, '2026-11-19T06:00:00Z');
  assert.equal(offline.current_activity?.offline_time, '2026-11-19T06:00:00Z');
  assert.equal(offline.current_activity?.inactive_time, null);

  const inactive = detail('inactive');
  assert.equal(inactive.current_activity?.inactive_time, '2026-11-19T06:00:00Z');
  assert.equal(inactive.current_activity?.offline_time, null);

  const active = detail('active');
  assert.equal(active.current_activity?.offline_time, null);
  assert.equal(active.current_activity?.inactive_time, null);
});
