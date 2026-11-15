import test from 'node:test';
import assert from 'node:assert/strict';
import { mapLicenseRead } from './mapper.ts';

const wire = {
  id: 7,
  sku: 'LIC-7',
  name: 'CAD Suite',
  owner: { id: 3, name: 'Ada Lovelace' },
  product: { id: 1, name: 'CAD' },
  vendor: { id: 2, name: 'Acme' },
  type: { id: 4, name: 'Floating' },
  category: { id: 5, name: 'Engineering' },
  restriction: null,
  seats: 3,
  seats_in_use: 2,
  max_version: '2026.1',
  expires_at: '2027-01-31T12:00:00Z',
  status: { value: 'assigned', label: 'Assigned' },
  assigned_equipment: [
    { id: 11, uid: 'u-11', sku: 'EQ-011', name: 'Oscilloscope' },
    { id: 12, uid: 'u-12', sku: 'EQ-012', name: '' },
  ],
  image_url: null,
};

test('license read keeps who holds the seats', () => {
  const license = mapLicenseRead(wire);

  assert.deepEqual(license.assigned_equipment.map((item) => item.id), [11, 12]);
  assert.deepEqual(
    license.assigned_equipment[0],
    { id: 11, uid: 'u-11', sku: 'EQ-011', name: 'Oscilloscope' },
    'both the SKU and the name are kept',
  );
  assert.equal(license.assigned_equipment[1].sku, 'EQ-012');
  assert.equal(license.assigned_equipment[1].name, '');
});

test('license read maps seats, version, owner, expiry and the status choice', () => {
  const license = mapLicenseRead(wire);

  assert.equal(license.license_seats, 3);
  assert.equal(license.maximum_version, '2026.1');
  assert.equal(license.primary_owner?.username, 'Ada Lovelace');
  assert.equal(license.expiry_date, '2027-01-31T12:00:00Z');
  assert.equal(license.status, 'assigned');
});

test('a license with no assignments has an empty list, not undefined', () => {
  assert.deepEqual(mapLicenseRead({ ...wire, assigned_equipment: undefined }).assigned_equipment, []);
});
