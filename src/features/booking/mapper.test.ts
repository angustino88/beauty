import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapBookingItem,
  buildBookingListQuery,
  mapProjectOptions,
  mapBenchOptions,
} from './mapper.ts';
import {
  extractBookingErrorMessage,
  processBookingBody,
} from '../../shared/utils/booking.ts';

test('mapBookingItem normalizes backend bench booking into unified booking item', () => {
  const backendBooking = {
    id: 101,
    booking_code: 'BK-2026-001',
    bench: { id: 5, uid: 'BENCH-05', sku: 'SKU-05', name: 'Powertrain Rig 5' },
    starts_at: '2026-10-30T10:00:00Z',
    ends_at: '2026-10-30T12:00:00Z',
    status: { value: 'in_progress', label: 'In progress' },
    approval_status: { value: 'approved', label: 'Approved' },
    reason: 'Testing ECU thermal stability',
    creator: { id: 1, username: 'tester1', display_name: 'Test Engineer' },
    project: { id: 8, name: 'Project Velocity' },
    created_at: '2026-10-29T18:00:00Z',
  };

  const item = mapBookingItem(backendBooking);

  assert.equal(item.id, 101);
  assert.equal(item.booking_code, 'BK-2026-001');
  assert.equal(item.bench?.name, 'Powertrain Rig 5');
  assert.equal(item.bench?.uid, 'BENCH-05');
  assert.equal(item.bench?.sku, 'SKU-05');
  assert.equal(item.status, 'in_progress');
  assert.equal(item.approval_status, 'approved');
  assert.equal(item.starts_at, '2026-10-30T10:00:00Z');
  assert.equal(item.ends_at, '2026-10-30T12:00:00Z');
  assert.equal(item.project?.name, 'Project Velocity');
  assert.equal(item.reason, 'Testing ECU thermal stability');
  assert.equal(item.creator?.username, 'tester1');
  assert.equal(item.creator?.display_name, 'Test Engineer');
});

test('mapBookingItem extracts creator from string or created_by field', () => {
  const bookingWithStringCreator = {
    id: 102,
    booking_code: 'BK-2026-002',
    creator: 'engineer_bob',
    creator_id: 42,
  };

  const item1 = mapBookingItem(bookingWithStringCreator);
  assert.equal(item1.creator?.username, 'engineer_bob');
  assert.equal(item1.creator?.id, 42);

  const bookingWithCreatedBy = {
    id: 103,
    booking_code: 'BK-2026-003',
    created_by: { id: 7, name: 'alice_w' },
  };

  const item2 = mapBookingItem(bookingWithCreatedBy);
  assert.equal(item2.creator?.username, 'alice_w');
  assert.equal(item2.creator?.id, 7);
});

test('buildBookingListQuery generates query params with bench_id and creator support', () => {
  const qs = buildBookingListQuery({
    view_side: 'my_booking',
    bench_id: [1, 2],
    status: 'reserved',
    creator: 'uah2hc',
    filterParams: { creator: ['uah2hc'], project: ['1'] },
  });

  assert.match(qs, /view_side=my_booking/);
  assert.match(qs, /status=reserved/);
  // The API takes one bench per request and rejects repeated params.
  assert.deepEqual(new URLSearchParams(qs).getAll('bench_id'), ['1']);
  assert.match(qs, /project_id=1/);
  assert.equal(qs.includes('project='), false);
  // Ensure creator appears only once in query string
  const matches = qs.match(/creator=/g);
  assert.equal(matches?.length, 1);
});

test('buildBookingListQuery uses documented ordering instead of legacy sort parameters', () => {
  const qs = buildBookingListQuery({
    sorts: ['ends_at'],
    orders: ['asc'],
  });
  const params = new URLSearchParams(qs);

  assert.equal(params.has('_sort'), false);
  assert.equal(params.has('_order'), false);
  assert.equal(params.get('ordering'), 'ends_at');
});

test('buildBookingListQuery supports descending ID and multiple date ordering fields', () => {
  assert.equal(new URLSearchParams(buildBookingListQuery({
    sorts: ['id'], orders: ['desc'],
  })).get('ordering'), '-id');
  assert.equal(new URLSearchParams(buildBookingListQuery({
    sorts: ['created_at', 'starts_at', 'ends_at'], orders: ['desc', 'asc', 'desc'],
  })).get('ordering'), '-created_at,starts_at,-ends_at');
});

test('buildBookingListQuery correctly applies starts_at_after and starts_at_before date range filters', () => {
  const qs = buildBookingListQuery({
    view_side: 'booking_calendar',
    bench_id: [5],
    starts_at_after: '2026-11-02',
    starts_at_before: '2026-11-09',
  });

  assert.match(qs, /view_side=booking_calendar/);
  assert.match(qs, /bench_id=5/);
  assert.match(qs, /starts_at_after=2026-11-02/);
  assert.match(qs, /starts_at_before=2026-11-09/);
});

test('buildBookingListQuery maps legacy starts_at and ends_at aliases to starts_at_after and starts_at_before', () => {
  const qs = buildBookingListQuery({
    view_side: 'booking_calendar',
    starts_at: '2026-11-01',
    ends_at: '2026-11-08',
  });

  assert.match(qs, /starts_at_after=2026-11-01/);
  assert.match(qs, /starts_at_before=2026-11-08/);
  assert.equal(qs.includes('starts_at='), false);
  assert.equal(qs.includes('ends_at='), false);
});

test('buildBookingListQuery maps legacy date keys inside filterParams', () => {
  const qs = buildBookingListQuery({
    filterParams: {
      starts_at: ['2026-11-05'],
      ends_at: ['2026-11-12'],
    },
  });

  assert.match(qs, /starts_at_after=2026-11-05/);
  assert.match(qs, /starts_at_before=2026-11-12/);
  assert.equal(qs.includes('starts_at='), false);
  assert.equal(qs.includes('ends_at='), false);
});

test('mapProjectOptions extracts and sorts project options from CatalogOptionList', () => {
  const payload = {
    data: [
      { id: 2, name: 'Project Beta', sku: 'PRJ-B' },
      { id: 1, name: 'Project Alpha', sku: 'PRJ-A' },
    ],
  };

  const options = mapProjectOptions(payload);
  assert.equal(options.length, 2);
  assert.equal(options[0].label, 'Project Alpha');
  assert.equal(options[0].value, 1);
  assert.equal(options[1].label, 'Project Beta');
  assert.equal(options[1].value, 2);
});

test('mapBenchOptions extracts and sorts bench selector options from CatalogOptionList', () => {
  const payload = {
    data: [
      { id: 10, name: 'Bench Zeta', sku: 'Z-100' },
      { id: 5, name: 'Bench Alpha', sku: 'A-200' },
    ],
  };

  const options = mapBenchOptions(payload);
  assert.equal(options.length, 2);
  assert.equal(options[0].label, 'Bench Alpha');
  assert.equal(options[0].value, 5);
  assert.equal(options[0].sku, 'A-200');
  assert.equal(options[1].label, 'Bench Zeta');
  assert.equal(options[1].value, 10);
  assert.equal(options[1].sku, 'Z-100');
});

test('processBookingBody handles bench booking fields strictly', () => {
  const body = processBookingBody({
    bench_id: 12,
    project_id: 4,
    starts_at: '2026-11-05T08:00:00Z',
    ends_at: '2026-11-05T10:00:00Z',
    reason: 'Calibrating torque sensor',
  });

  assert.equal(body.bench_id, 12);
  assert.equal(body.project_id, 4);
  assert.equal(body.reason, 'Calibrating torque sensor');
  assert.ok(body.starts_at);
  assert.ok(body.ends_at);
});

test('extractBookingErrorMessage extracts nested conflict and validation error messages', () => {
  const conflictError = {
    data: {
      error: {
        code: 'bench_booking_conflict',
        message: 'The bench is unavailable for the requested period: Room is in maintenance.',
        details: [
          {
            field: 'bench_bookings.41',
            code: 'booking_overlaps_downtime',
            message: 'Booking overlaps downtime.',
          },
        ],
      },
    },
  };
  assert.equal(
    extractBookingErrorMessage(conflictError),
    'The bench is unavailable for the requested period: Room is in maintenance.',
  );

  const validationError = {
    data: {
      error: {
        code: 'validation_error',
        message: 'The station or room is not in service.',
      },
    },
  };
  assert.equal(
    extractBookingErrorMessage(validationError),
    'The station or room is not in service.',
  );

  const fallbackResult = extractBookingErrorMessage({}, 'Default fallback');
  assert.equal(fallbackResult, 'Default fallback');
});

test('buildBookingListQuery never repeats a filter parameter', () => {
  const qs = buildBookingListQuery({ filterParams: { status: ['reserved', 'in_progress'], approval_status: ['approved'] } });
  const params = new URLSearchParams(qs);
  assert.deepEqual(params.getAll('status'), ['reserved']);
  assert.deepEqual(params.getAll('approval_status'), ['approved']);
});
