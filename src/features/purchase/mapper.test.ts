import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapPurchase,
  mapPurchaseListResponse,
  mapPurchaseItem,
  mapPurchaseItemListResponse,
  mapPurchasePriority,
  mapPurchasePriorityListResponse,
  mapPurchaseTransaction,
  mapPurchaseTransactionListResponse,
  mapPurchaseItemResource,
  getPurchaseEtag,
  getItemEtag,
} from './mapper.ts';

test('mapPurchase handles complete backend payload', () => {
  const backendData = {
    id: 12,
    supplier: 'Acme Test Corp',
    purchase_order_number: 'PO-2026-001',
    purchase_date: '2026-11-01',
    status: { value: 'approved', label: 'Approved' },
    total: { amount: '1540.50', currency: 'USD' },
    item_count: 3,
    notes: 'Urgent equipment procurement',
    version: 4,
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-02T12:00:00Z',
  };

  const result = mapPurchase(backendData);

  assert.equal(result.id, 12);
  assert.equal(result.supplier, 'Acme Test Corp');
  assert.equal(result.purchase_order_number, 'PO-2026-001');
  assert.equal(result.currency, 'USD');
  assert.equal(result.status, 'approved');
  assert.equal(result.status_label, 'Approved');
  assert.equal(result.total_amount, '1540.50');
  assert.equal(result.total_display, 'USD 1540.50');
  assert.equal(result.item_count, 3);
  assert.equal(result.notes, 'Urgent equipment procurement');
  assert.equal(result.version, 4);
});

test('mapPurchase handles empty or partial payload', () => {
  const result = mapPurchase(null);
  assert.equal(result.id, 0);
  assert.equal(result.supplier, '');
  assert.equal(result.currency, 'EUR');
  assert.equal(result.status, 'unknown');
  assert.equal(result.version, undefined);
});

test('mapPurchaseListResponse extracts pagination and items correctly', () => {
  const payload = {
    meta: {
      pagination: {
        count: 42,
        page: 2,
        page_size: 10,
        next: '/api/labs/purchases?page=3',
        previous: '/api/labs/purchases?page=1',
      },
    },
    data: [
      {
        id: 1,
        supplier: 'Keysight',
        purchase_date: '2026-10-15',
        total: { amount: '500.00', currency: 'EUR' },
        item_count: 1,
      },
    ],
  };

  const response = mapPurchaseListResponse(payload);
  assert.equal(response.data.length, 1);
  assert.equal(response.data[0].supplier, 'Keysight');
  assert.equal(response.pagination.count, 42);
  assert.equal(response.pagination.page, 2);
  assert.equal(response.pagination.page_size, 10);
  assert.equal(response.pagination.next, '/api/labs/purchases?page=3');
});

test('mapPurchaseItem maps cost item line', () => {
  const rawItem = {
    id: 5,
    purchase: { id: 12 },
    description: 'Digital Multimeter Pro',
    quantity: 2,
    unit: 'pcs',
    unit_price: '250.00',
    line_value: '500.00',
    priority: { id: 2, code: 'high', name: 'High' },
    purpose: 'For RF calibration bench',
    notes: 'Calibrated',
    version: 2,
    created_at: '2026-11-01T10:05:00Z',
  };

  const item = mapPurchaseItem(rawItem);
  assert.equal(item.id, 5);
  assert.equal(item.purchase_id, 12);
  assert.equal(item.description, 'Digital Multimeter Pro');
  assert.equal(item.quantity, 2);
  assert.equal(item.unit, 'pcs');
  assert.equal(item.unit_price, '250.00');
  assert.equal(item.line_value, '500.00');
  assert.equal(item.priority_id, 2);
  assert.equal(item.priority_code, 'high');
  assert.equal(item.priority_name, 'High');
  assert.equal(item.purpose, 'For RF calibration bench');
  assert.equal(item.notes, 'Calibrated');
  assert.equal(item.version, 2);
});

test('getPurchaseEtag and getItemEtag construct strong RFC entity tags', () => {
  assert.equal(getPurchaseEtag({ id: 4, version: 1 }), '"purchase-4-v1"');
  assert.equal(getPurchaseEtag({ id: 4, version: 3 }), '"purchase-4-v3"');
  assert.equal(getPurchaseEtag({ id: 4, etag: '"custom-etag"' }), '"custom-etag"');
  assert.equal(getPurchaseEtag({ id: 4 }), '*');
  assert.equal(getPurchaseEtag(null), '*');

  assert.equal(getItemEtag({ id: 8, version: 2 }), '"item-8-v2"');
  assert.equal(getItemEtag({ id: 8, etag: '"item-etag"' }), '"item-etag"');
  assert.equal(getItemEtag({ id: 8 }), '*');
  assert.equal(getItemEtag(undefined), '*');
});

test('mapPurchasePriority maps priority options', () => {
  const rawPriority = { id: 3, code: 'critical', name: 'Critical' };
  const mapped = mapPurchasePriority(rawPriority);
  assert.equal(mapped.id, 3);
  assert.equal(mapped.code, 'critical');
  assert.equal(mapped.name, 'Critical');

  const list = mapPurchasePriorityListResponse({ data: [rawPriority] });
  assert.equal(list.length, 1);
  assert.equal(list[0].code, 'critical');
});

test('mapPurchaseTransaction maps payments and refunds', () => {
  const rawPayment = {
    id: 7,
    purchase: { id: 12 },
    transaction_type: { value: 'payment', label: 'Payment' },
    total: { amount: '500.00', currency: 'USD' },
    settled_at: '2026-11-02T14:30:00Z',
    reference: 'INV-99881',
    notes: 'Wire transfer',
  };

  const payment = mapPurchaseTransaction(rawPayment);
  assert.equal(payment.id, 7);
  assert.equal(payment.transaction_type, 'payment');
  assert.equal(payment.amount, '500.00');
  assert.equal(payment.reference, 'INV-99881');

  const rawRefund = {
    id: 8,
    purchase: { id: 12 },
    transaction_type: { value: 'refund', label: 'Refund' },
    total: { amount: '50.00', currency: 'USD' },
    settled_at: '2026-11-03T09:00:00Z',
  };

  const refund = mapPurchaseTransaction(rawRefund);
  assert.equal(refund.transaction_type, 'refund');
  assert.equal(refund.amount, '50.00');
});

test('mapPurchaseItemResource maps allocated physical resources', () => {
  const rawResource = {
    id: 1,
    purchase_item: { id: 5 },
    resource: { id: 101, name: 'Keysight Oscilloscope DSO-X' },
    resource_kind: 'equipment',
    resource_type_id: 2,
    resource_id: 101,
    acquisition_price: '250.00',
    created_at: '2026-11-01T12:00:00Z',
  };

  const res = mapPurchaseItemResource(rawResource);
  assert.equal(res.id, 1);
  assert.equal(res.purchase_item_id, 5);
  assert.equal(res.resource_kind, 'equipment');
  assert.equal(res.resource_id, 101);
  assert.equal(res.resource_name, 'Keysight Oscilloscope DSO-X');
  assert.equal(res.acquisition_price, '250.00');
});

test('mapPurchaseItemListResponse maps paginated item lines', () => {
  const payload = {
    meta: { pagination: { count: 1, page: 1, page_size: 10, next: null, previous: null } },
    data: [{ id: 1, description: 'Cable', quantity: 2, unit_price: '15.00' }],
  };
  const res = mapPurchaseItemListResponse(payload);
  assert.equal(res.data.length, 1);
  assert.equal(res.data[0].description, 'Cable');
});

test('mapPurchaseTransactionListResponse maps paginated transaction entries', () => {
  const payload = {
    meta: { pagination: { count: 1, page: 1, page_size: 10, next: null, previous: null } },
    data: [{ id: 1, transaction_type: { value: 'payment', label: 'Payment' }, total: { amount: '100.00', currency: 'USD' } }],
  };
  const res = mapPurchaseTransactionListResponse(payload);
  assert.equal(res.data.length, 1);
  assert.equal(res.data[0].amount, '100.00');
});
