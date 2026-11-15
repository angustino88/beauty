import test from 'node:test';
import assert from 'node:assert/strict';
import { mapLicenseWritePayload } from './mapper.ts';

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
    serial_number: 'S',
  } as Parameters<typeof mapLicenseWritePayload>[0]);

  assert.deepEqual(Object.keys(body), ['name']);
});
