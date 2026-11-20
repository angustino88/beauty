import test from 'node:test';
import assert from 'node:assert/strict';
import { meFromUser } from './meSlice.ts';
import { holds, permissionSetFrom } from './permissions.ts';

const user = {
  id: 7,
  username: 'carol',
  display_name: 'Carol',
  avatar_url: null,
  effective_roles: { labs: ['coord', 'user'] },
  effective_permissions: {
    labs: [
      { value: 'bench_booking.approve', label: 'Approve or reject bench bookings that need approval' },
      { value: 'lab_operations.manage', label: 'Read and manage lab resources and operations' },
    ],
  },
};

test('meFromUser keeps the permissions the backend grants and the roles for display', () => {
  const me = meFromUser(user);

  assert.equal(holds(me.permissions, 'bench_booking.approve'), true);
  assert.equal(holds(me.permissions, 'lab_operations.manage'), true);
  assert.equal(holds(me.permissions, 'workbook.import'), false);
  assert.deepEqual(me.roles, ['coord', 'user']);
  assert.equal(me.displayName, 'Carol');
});

test('a coordinator is recognised by permission, whatever its role code is called', () => {
  // The backend role code is "coord"; the UI never needs to know it.
  assert.equal(holds(meFromUser(user).permissions, 'lab_operations.manage'), true);
});

test('missing or malformed permissions grant nothing', () => {
  assert.deepEqual(permissionSetFrom(null), {});
  assert.deepEqual(permissionSetFrom(undefined), {});
  assert.deepEqual(permissionSetFrom({ labs: [] }), {});
  assert.deepEqual(permissionSetFrom({ labs: [{ value: 3 }, { value: ' ' }, {}] }), {});
  assert.equal(holds(meFromUser({ ...user, effective_permissions: undefined }).permissions, 'dashboard.read'), false);
});

test('plain string codes and unknown future codes are accepted', () => {
  const set = permissionSetFrom({ labs: ['dashboard.read', { value: 'future.permission' }] });
  assert.equal(set['dashboard.read'], true);
  assert.equal(set['future.permission'], true);
});
