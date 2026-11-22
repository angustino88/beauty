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

test('formats RTK Query PARSING_ERROR HTML 404 responses cleanly instead of raw SyntaxError', () => {
  const result = parseFormApiError({
    status: 'PARSING_ERROR',
    originalStatus: 404,
    data: '<!DOCTYPE html><html><title>Page not found</title></html>',
    error: 'SyntaxError: Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON',
  });

  assert.ok(result?.message?.includes('HTTP 404'));
  assert.ok(!result?.message?.includes('<!DOCTYPE'));
});

test('formats RTK Query PARSING_ERROR HTML 500 responses cleanly', () => {
  const result = parseFormApiError({
    status: 'PARSING_ERROR',
    originalStatus: 500,
    data: '<!DOCTYPE html><html>Server Error</html>',
    error: 'SyntaxError: Unexpected token \'<\'',
  });

  assert.ok(result?.message?.includes('HTTP 500'));
});