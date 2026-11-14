import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFormApiError } from './formApiError.ts';

test('parses nested validation problem responses and exposes detail messages', () => {
  const result = parseFormApiError({
    status: 400,
    data: {
      error: {
        code: 'validation_failed',
        message: 'One or more fields are invalid.',
        details: [
          { field: 'serial_number', message: 'Serial number is already registered.' },
          { field: 'department_id', message: 'Select a valid department.' },
        ],
        request_id: 'request-123',
      },
    },
  });

  assert.deepEqual(result, {
    fieldErrors: {
      serial_number: ['Serial number is already registered.'],
      department_id: ['Select a valid department.'],
    },
    nonFieldErrors: ['One or more fields are invalid.'],
    message: 'Serial number is already registered.',
  });
});

test('uses detail-level non-field message instead of the generic envelope message', () => {
  const result = parseFormApiError({
    data: {
      error: {
        code: 'validation_failed',
        message: 'One or more fields are invalid.',
        details: [{ message: 'Equipment cannot be created for this category.' }],
      },
    },
  });

  assert.equal(result?.message, 'Equipment cannot be created for this category.');
});