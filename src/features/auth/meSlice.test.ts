import test from 'node:test';
import assert from 'node:assert/strict';
import { flattenEffectiveRoles } from './meSlice.ts';

test('flattenEffectiveRoles maps effective lab roles to route permissions', () => {
  const effectiveRoles = { labs: ['admin', 'lab-coordinator'] };

  const result = flattenEffectiveRoles(effectiveRoles);

  assert.equal(result.permissionGroups['admin'], true);
  assert.equal(result.permissionGroups['lab-coordinator'], true);
  assert.equal(result.permissionGroups['coordinator'], true);
  assert.equal(result.permissionGroups['administrator'], true);
});

test('flattenEffectiveRoles normalizes role variations and aliases', () => {
  const effectiveRoles = {
    labs: ['Lab Coordinator', 'lab_operator', 'Coordinator', 'Administrator'],
  };

  const result = flattenEffectiveRoles(effectiveRoles);

  assert.equal(result.permissionGroups['Lab Coordinator'], true);
  assert.equal(result.permissionGroups['lab-coordinator'], true);
  assert.equal(result.permissionGroups['coordinator'], true);
  assert.equal(result.permissionGroups['admin'], true);
  assert.equal(result.permissionGroups['administrator'], true);
  assert.equal(result.permissionGroups['lab_operator'], true);
  assert.equal(result.permissionGroups['lab-operator'], true);
});

test('flattenEffectiveRoles handles empty or null input gracefully', () => {
  assert.deepEqual(flattenEffectiveRoles(null), { permissions: {}, permissionGroups: {} });
  assert.deepEqual(flattenEffectiveRoles(undefined), { permissions: {}, permissionGroups: {} });
  assert.deepEqual(flattenEffectiveRoles({ labs: [] }), { permissions: {}, permissionGroups: {} });
});
