import test from 'node:test';
import assert from 'node:assert/strict';
import { mapLicenseRead, mapLicenseWritePayload } from './mapper.ts';

test('license write body uses the API field names', () => {
  const body = mapLicenseWritePayload({
    sku: 'LIC-1',
    name: 'CAD Suite',
    license_product: 3,
    license_vendor: 4,
    license_type: 5,
    license_category: 6,
    license_restriction: null,
    primary_owner: 9,
    license_seats: 4,
    maximum_version: '2026.1',
    remark: 'n/a',
  });

  assert.deepEqual(body, {
    sku: 'LIC-1',
    name: 'CAD Suite',
    remark: 'n/a',
    product_id: 3,
    vendor_id: 4,
    type_id: 5,
    category_id: 6,
    restriction_id: null,
    owner_id: 9,
    seats: 4,
    max_version: '2026.1',
  });
});

test('the expiry date goes out as a date-time that keeps the calendar date', () => {
  assert.equal(mapLicenseWritePayload({ expiry_date: '2027-01-31' }).expires_at, '2027-01-31T12:00:00Z');
  assert.equal(mapLicenseWritePayload({ expiry_date: null }).expires_at, null);
  assert.equal('expires_at' in mapLicenseWritePayload({ name: 'x' }), false);
});

test('the license key is sent only when one was typed, so an empty field never wipes it', () => {
  assert.equal(mapLicenseWritePayload({ license_ID: '  KEY-1  ' }).identifier, 'KEY-1');
  assert.equal('identifier' in mapLicenseWritePayload({ license_ID: '' }), false);
  assert.equal('identifier' in mapLicenseWritePayload({ license_ID: null }), false);
});

test('fields the API no longer takes are not sent', () => {
  const body = mapLicenseWritePayload({
    name: 'x',
    status: 'available',
    log_label: 'L',
  } as Parameters<typeof mapLicenseWritePayload>[0]);

  assert.deepEqual(Object.keys(body), ['name']);
});

test('required relations are never sent as null, optional ones may clear', () => {
  const body = mapLicenseWritePayload({
    name: 'x',
    license_product: null,
    license_vendor: null,
    license_type: null,
    license_category: null,
    license_restriction: null,
    primary_owner: null,
  } as Parameters<typeof mapLicenseWritePayload>[0]);

  assert.deepEqual(body, { name: 'x', restriction_id: null, owner_id: null });
});

test('the serial number is sent trimmed and separately from the write-only key', () => {
  const body = mapLicenseWritePayload({ serial_number: ' 55100045010 ', license_ID: 'KEY-1' });
  assert.equal(body.serial_number, '55100045010');
  assert.equal(body.identifier, 'KEY-1');
  assert.equal(mapLicenseWritePayload({ serial_number: '' }).serial_number, '');
  assert.equal('serial_number' in mapLicenseWritePayload({ name: 'x' }), false);
});


test('license ownership and seats round trip and optional ownership can be cleared', () => {
  const department = { id: 3, name: 'Labs' };
  const group = { id: 4, name: 'Measurement' };
  const license = mapLicenseRead({ department, group, seats: 5 });
  assert.deepEqual(license.department, department);
  assert.deepEqual(license.group, group);
  assert.equal(license.license_seats, 5);
  assert.deepEqual(mapLicenseWritePayload({ department_id: 3, group_id: 4, license_seats: 5 }), {
    department_id: 3, group_id: 4, seats: 5,
  });
  assert.deepEqual(mapLicenseWritePayload({ department_id: null, group_id: null }), {
    department_id: null, group_id: null,
  });
});
