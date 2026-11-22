import assert from 'node:assert/strict';
import test from 'node:test';
import {
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
