import assert from 'node:assert/strict';
import test from 'node:test';
import { readApiProblem, toFormErrors } from './errors.ts';

const refused = {
  status: 422,
  data: {
    error: {
      code: 'validation_failed',
      message: 'Some fields are invalid.',
      details: [
        { field: 'modbus.port', code: 'invalid', message: 'Use a port between 1 and 65535.' },
        { field: 'install_location_type', code: 'invalid', message: 'Give both the type and the id.' },
        { field: 'unknown_field', code: 'invalid', message: 'Nope.' },
      ],
    },
  },
};

test('the error envelope becomes code, message and field errors', () => {
  const problem = readApiProblem(refused);
  assert.equal(problem.code, 'validation_failed');
  assert.equal(problem.fields.length, 3);
});

test('field errors map onto form names, with aliases and leftovers', () => {
  const { matched, unmatched } = toFormErrors(readApiProblem(refused), ['modbus.port', 'location'], {
    install_location_type: 'location',
  });
  assert.deepEqual(matched, [
    { name: ['modbus', 'port'], errors: ['Use a port between 1 and 65535.'] },
    { name: ['location'], errors: ['Give both the type and the id.'] },
  ]);
  assert.deepEqual(unmatched.map((item) => item.field), ['unknown_field']);
});

test('conflicts keep their stable code; transport failures read as such', () => {
  const conflict = readApiProblem({ status: 409, data: { error: { code: 'telemetry_modbus_address_in_use', message: 'Taken.' } } });
  assert.equal(conflict.code, 'telemetry_modbus_address_in_use');
  assert.equal(readApiProblem({ status: 'FETCH_ERROR', error: 'TypeError' }).code, 'network_error');
  assert.equal(readApiProblem({ status: 500, data: '<html>' }).code, 'http_500');
});
