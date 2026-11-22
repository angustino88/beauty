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

test('preserves specific domain conflict message instead of structured count fields', () => {
  const result = parseFormApiError({
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
  });

  assert.equal(result?.message, 'Move or detach configured benches before deleting the station.');
});

test('skips metadata count fields when selecting a descriptive field error fallback', () => {
  const result = parseFormApiError({
    status: 400,
    data: {
      error: {
        code: 'validation_failed',
        message: 'One or more fields are invalid.',
        details: [
          { field: 'items_total', code: 'invalid', message: '3' },
          { field: 'sku', code: 'invalid', message: 'SKU is already in use.' },
        ],
      },
    },
  });

  assert.equal(result?.message, 'SKU is already in use.');
});