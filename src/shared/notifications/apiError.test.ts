import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getApiErrorDetails,
  getApiErrorMessage,
  isTechnicalErrorText,
  mapApiFieldErrors,
  normalizeApiError,
  sanitizeUserMessage,
} from './apiError.ts';

test('normalizes standard LabMango API error envelope with details', () => {
  const error = {
    status: 422,
    data: {
      error: {
        code: 'validation_failed',
        message: 'Some fields require attention.',
        details: [
          { field: 'modbus.port', code: 'invalid', message: 'Enter a port between 1 and 65535.' },
          { field: 'name', code: 'required', message: 'Name is required.' },
        ],
      },
    },
  };

  const result = normalizeApiError(error);
  assert.equal(result.code, 'validation_failed');
  assert.equal(result.status, 422);
  assert.equal(result.message, 'Some fields require attention.');
  assert.equal(result.fields.length, 2);
  assert.deepEqual(result.fields[0], {
    field: 'modbus.port',
    message: 'Enter a port between 1 and 65535.',
  });
});

test('maps RTK Query transport errors to actionable network messages', () => {
  const fetchError = normalizeApiError({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' });
  assert.equal(fetchError.isNetworkError, true);
  assert.equal(fetchError.code, 'network_error');
  assert.match(fetchError.message, /network connection/i);

  const timeoutError = normalizeApiError({ status: 'TIMEOUT_ERROR' });
  assert.equal(timeoutError.isTimeout, true);
  assert.equal(timeoutError.code, 'timeout_error');
  assert.match(timeoutError.message, /timed out/i);
});

test('maps HTTP status codes to clear user-facing fallbacks when no body is present', () => {
  assert.match(getApiErrorMessage({ status: 401 }), /session has expired/i);
  assert.match(getApiErrorMessage({ status: 403 }), /permission/i);
  assert.match(getApiErrorMessage({ status: 404 }), /could not be found/i);
  assert.match(getApiErrorMessage({ status: 409 }), /conflicts|updated by someone else/i);
  assert.match(getApiErrorMessage({ status: 500, data: '<html><body>500</body></html>' }), /server encountered an issue/i);
});

test('suppresses technical details, stack traces, SQL errors, and raw JSON dumps', () => {
  assert.equal(isTechnicalErrorText('TypeError: Cannot read properties of undefined'), true);
  assert.equal(isTechnicalErrorText('Traceback (most recent call last):\n  File "views.py"'), true);
  assert.equal(isTechnicalErrorText('SELECT * FROM labs_equipment WHERE id = 1'), true);
  assert.equal(isTechnicalErrorText('{"status":500,"detail":"boom"}'), true);
  assert.equal(isTechnicalErrorText('Booking overlaps with an existing reservation.'), false);

  const sanitized = sanitizeUserMessage(
    'IntegrityError: duplicate key value violates unique constraint',
    'Unable to save equipment.',
  );
  assert.equal(sanitized, 'Unable to save equipment.');
});

test('strips redundant Error: prefix from JS Error messages while keeping safe text', () => {
  const err = new Error('Error: End time must be after start time.');
  assert.equal(getApiErrorMessage(err), 'End time must be after start time.');
});

test('maps API field errors onto Ant Design form paths with aliases and unmatched leftovers', () => {
  const problem = normalizeApiError({
    status: 422,
    data: {
      error: {
        code: 'validation_failed',
        message: 'Invalid fields',
        details: [
          { field: 'modbus.port', message: 'Invalid port.' },
          { field: 'install_location_type', message: 'Choose a location.' },
          { field: 'extra_field', message: 'Unexpected.' },
        ],
      },
    },
  });

  const { matched, unmatched } = mapApiFieldErrors(problem, ['modbus.port', 'location'], {
    install_location_type: 'location',
  });
  assert.deepEqual(matched, [
    { name: ['modbus', 'port'], errors: ['Invalid port.'] },
    { name: ['location'], errors: ['Choose a location.'] },
  ]);
  assert.deepEqual(unmatched, [{ field: 'extra_field', message: 'Unexpected.' }]);
});

test('preserves domain conflict message and extracts structured blocker details for station/room/bench delete', () => {
  const stationConflict = {
    status: 409,
    data: {
      error: {
        code: 'location_conflict',
        message: 'Move or detach configured benches before deleting the station.',
        details: [
          { field: 'benches_total', code: 'invalid', message: '1' },
          { field: 'benches[0]', code: 'invalid', message: 'BENCH-01 — BENCH-01' },
        ],
        request_id: 'f7637aef2f5c4026a38538b4598bbe83',
      },
    },
  };

  assert.equal(
    getApiErrorMessage(stationConflict),
    'Move or detach configured benches before deleting the station.',
  );
  assert.deepEqual(getApiErrorDetails(stationConflict), [
    { tone: 'neutral', label: 'Blocking bench (1):', value: 'BENCH-01 — BENCH-01' },
  ]);

  const roomConflict = {
    status: 409,
    data: {
      error: {
        code: 'room_conflict',
        message: 'Move or detach stations and equipment before deleting this room.',
        details: [
          { field: 'stations_total', code: 'invalid', message: '5' },
          { field: 'stations[0]', code: 'invalid', message: 'STN-01' },
          { field: 'stations[1]', code: 'invalid', message: 'STN-02' },
          { field: 'stations[2]', code: 'invalid', message: 'STN-03' },
          { field: 'stations[3]', code: 'invalid', message: 'STN-04' },
          { field: 'equipment_total', code: 'invalid', message: '2' },
          { field: 'equipment[0]', code: 'invalid', message: 'COMP-01' },
          { field: 'equipment[1]', code: 'invalid', message: 'COMP-02' },
        ],
      },
    },
  };

  assert.deepEqual(getApiErrorDetails(roomConflict), [
    { tone: 'neutral', label: 'Blocking stations (5):', value: 'STN-01, STN-02, STN-03 (+2 more)' },
    { tone: 'neutral', label: 'Blocking equipment (2):', value: 'COMP-01, COMP-02' },
  ]);
});

test('never falls back to bare numeric count fields when envelope message is absent', () => {
  const err = {
    status: 409,
    data: {
      error: {
        code: 'location_conflict',
        details: [
          { field: 'benches_total', code: 'invalid', message: '2' },
        ],
      },
    },
  };

  assert.match(getApiErrorMessage(err), /conflicts|updated by someone else/i);
});

test('formats equipment delete blockers into readable toast detail rows', () => {
  const equipmentConflict = {
    status: 409,
    data: {
      error: {
        code: 'equipment_in_use',
        message: 'Unassign the bench, take back a loan, release license seats, and cancel active bookings before deleting.',
        details: [
          { field: 'blockers[0]', code: 'invalid', message: 'bench_assignment' },
          { field: 'blockers[1]', code: 'invalid', message: 'loan' },
        ],
      },
    },
  };

  assert.deepEqual(getApiErrorDetails(equipmentConflict), [
    { tone: 'neutral', label: 'Active blockers:', value: 'Assigned to a bench, Checked out on loan' },
  ]);
});

