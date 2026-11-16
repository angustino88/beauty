import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readWireMoney,
  toPurchaseAllocationWire,
  toPurchaseLineWire,
  toPurchaseTransactionWire,
  toPurchaseWire,
} from './wire.ts';

test('purchase header sends one total money object and drops the split currency fields', () => {
  const body = toPurchaseWire({ supplier: 'Acme', currency: 'USD', total_amount: '1540.50', notes: 'x' });
  assert.deepEqual(body, { supplier: 'Acme', notes: 'x', total: { amount: '1540.50', currency: 'USD' } });
});

test('purchase header with items converts each unit price with the purchase currency', () => {
  const body = toPurchaseWire({
    supplier: 'Acme',
    currency: 'EUR',
    total_amount: '20.00',
    items: [{ description: 'Cable', quantity: 2, unit_price: '10.00' }],
  });
  assert.deepEqual(body.items, [{ description: 'Cable', quantity: 2, unit_price: { amount: '10.00', currency: 'EUR' } }]);
});

test('line, transaction and allocation bodies carry {amount, currency}', () => {
  assert.deepEqual(
    toPurchaseLineWire({ description: 'A', quantity: 1, currency: 'EUR', unit_price: '3.50' }),
    { description: 'A', quantity: 1, unit_price: { amount: '3.50', currency: 'EUR' } },
  );
  assert.deepEqual(
    toPurchaseTransactionWire({ transaction_type: 'payment', currency: 'USD', amount: '500.00', settled_at: '2026-11-02' }),
    { transaction_type: 'payment', settled_at: '2026-11-02', total: { amount: '500.00', currency: 'USD' } },
  );
  assert.deepEqual(
    toPurchaseAllocationWire({ resource_id: 7, currency: 'EUR', acquisition_price: '99.00' }),
    { resource_id: 7, acquisition_price: { amount: '99.00', currency: 'EUR' } },
  );
});

test('readWireMoney reads a money object and tolerates a plain decimal', () => {
  assert.deepEqual(readWireMoney({ amount: '12.00', currency: 'GBP' }), { amount: '12.00', currency: 'GBP' });
  assert.deepEqual(readWireMoney('7.00', 'EUR'), { amount: '7.00', currency: 'EUR' });
  assert.deepEqual(readWireMoney(undefined), { amount: '0.00', currency: 'EUR' });
});
