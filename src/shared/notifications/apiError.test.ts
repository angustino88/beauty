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
    { tone: 'neutral', label: 'Benches (1):', value: 'BENCH-01 — BENCH-01' },
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
          { field: 'equipment_categories[0]', code: 'invalid', message: 'computing' },
        ],
      },
    },
  };

  assert.deepEqual(getApiErrorDetails(roomConflict), [
    { tone: 'neutral', label: 'Stations (5):', value: 'STN-01, STN-02, STN-03 (+2 more)' },
    { tone: 'neutral', label: 'Equipment (2):', value: 'COMP-01, COMP-02' },
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

test('formats conflict code arrays and arbitrary future counted groups structurally without hardcoded lists', () => {
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
    { tone: 'neutral', label: 'Blockers:', value: 'Bench assignment, Loan' },
  ]);

  const futureConflict = {
    status: 409,
    data: {
      error: {
        code: 'gateway_conflict',
        message: 'Unlink attached sensors before deleting this gateway.',
        details: [
          { field: 'sensors_total', code: 'invalid', message: '4' },
          { field: 'sensors[0]', code: 'invalid', message: 'SENS-01' },
          { field: 'sensors[1]', code: 'invalid', message: 'SENS-02' },
          { field: 'sensors[2]', code: 'invalid', message: 'SENS-03' },
          { field: 'sensors[3]', code: 'invalid', message: 'SENS-04' },
        ],
      },
    },
  };

  assert.deepEqual(getApiErrorDetails(futureConflict), [
    { tone: 'neutral', label: 'Sensors (4):', value: 'SENS-01, SENS-02, SENS-03 (+1 more)' },
  ]);
});

test('supports caller-provided fieldLabels from form configs while deriving labels generically by default', () => {
  const err = {
    status: 422,
    data: {
      error: {
        code: 'validation_failed',
        message: 'One or more fields are invalid.',
        details: [
          { field: 'cooling_capacity_kw[0]', code: 'invalid', message: 'Must be greater than 0.' },
        ],
      },
    },
  };

  assert.equal(getApiErrorMessage(err), 'Cooling capacity (kW): Must be greater than 0.');
  assert.equal(
    getApiErrorMessage(err, 'Fallback', { fieldLabels: { cooling_capacity_kw: 'Max cooling' } }),
    'Max cooling: Must be greater than 0.',
  );
});

test('surfaces readable field error when validation_failed uses generic wrapper and flattened [0] field', () => {
  const err = {
    status: 422,
    data: {
      error: {
        code: 'validation_failed',
        message: 'One or more fields are invalid.',
        details: [
          {
            field: 'power_capacity_w[0]',
            code: 'invalid',
            message: 'Existing allocation or requested capacity exceeds this limit.',
          },
        ],
        request_id: 'b6377148a8dc460489ce3d4f0edaae13',
      },
    },
  };

  const normalized = normalizeApiError(err);
  assert.equal(
    normalized.message,
    'Power capacity (W): Existing allocation or requested capacity exceeds this limit.',
  );
  assert.deepEqual(normalized.fields, [
    {
      field: 'power_capacity_w',
      message: 'Existing allocation or requested capacity exceeds this limit.',
    },
  ]);
  // Single validation error is already in description, so details is empty to avoid duplication
  assert.deepEqual(getApiErrorDetails(err), []);
});

test('surfaces summary and structured rows for multi-field validation_failed responses', () => {
  const err = {
    status: 422,
    data: {
      error: {
        code: 'validation_failed',
        message: 'One or more fields are invalid.',
        details: [
          { field: 'power_capacity_w[0]', code: 'invalid', message: 'Exceeds parent room capacity.' },
          { field: 'sku', code: 'unique', message: 'SKU is already in use.' },
        ],
      },
    },
  };

  assert.equal(
    getApiErrorMessage(err),
    'Power capacity (W): Exceeds parent room capacity. (+1 more issue)',
  );
  assert.deepEqual(getApiErrorDetails(err), [
    { tone: 'neutral', label: 'Power capacity (W):', value: 'Exceeds parent room capacity.' },
    { tone: 'neutral', label: 'SKU:', value: 'SKU is already in use.' },
  ]);
});

test('unwraps Error.cause and suppresses internal snake_case error codes', () => {
  const apiErr = {
    status: 422,
    data: {
      error: {
        code: 'validation_failed',
        message: 'One or more fields are invalid.',
        details: [
          { field: 'non_field_errors[0]', code: 'invalid', message: 'Room cannot be shrunk while stations occupy removed slots.' },
        ],
      },
    },
  };
  const wrapped = new Error('update_room_failed', { cause: apiErr });

  assert.equal(
    getApiErrorMessage(wrapped),
    'Room cannot be shrunk while stations occupy removed slots.',
  );
  assert.equal(isTechnicalErrorText('update_room_failed'), true);
  assert.equal(
    getApiErrorMessage(new Error('update_room_failed'), 'Please try again.'),
    'Please try again.',
  );
});


