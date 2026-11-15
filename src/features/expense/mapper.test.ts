import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapExpense,
  mapExpenseListResponse,
  mapExpensePayment,
  mapExpensePaymentListResponse,
  EXPENSE_TYPE_LABELS,
  BILLING_PERIOD_LABELS,
} from './mapper.ts';

test('mapExpense maps complete expense payload', () => {
  const backendExpense = {
    id: 10,
    room: { id: 3, name: 'RF Lab Alpha' },
    name: 'Facility HVAC Maintenance',
    expense_type: { value: 'maintenance', label: 'Maintenance' },
    supplier: 'AirCool Solutions',
    reference: 'CON-HVAC-2026',
    cost: { amount: '1200.00', currency: 'EUR' },
    billing_period: { value: 'monthly', label: 'Monthly' },
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    notes: 'Includes bi-weekly filter check',
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-02T09:00:00Z',
  };

  const expense = mapExpense(backendExpense);

  assert.equal(expense.id, 10);
  assert.equal(expense.room_id, 3);
  assert.equal(expense.room_name, 'RF Lab Alpha');
  assert.equal(expense.name, 'Facility HVAC Maintenance');
  assert.equal(expense.expense_type, 'maintenance');
  assert.equal(expense.expense_type_label, EXPENSE_TYPE_LABELS.maintenance);
  assert.equal(expense.billing_period, 'monthly');
  assert.equal(expense.billing_period_label, BILLING_PERIOD_LABELS.monthly);
  assert.equal(expense.amount, '1200.00');
  assert.equal(expense.supplier, 'AirCool Solutions');
  assert.equal(expense.reference, 'CON-HVAC-2026');
});

test('mapExpense falls back gracefully for empty payload', () => {
  const expense = mapExpense(null, 5);
  assert.equal(expense.id, 0);
  assert.equal(expense.room_id, 5);
  assert.equal(expense.expense_type, 'other');
  assert.equal(expense.billing_period, 'one_time');
});

test('mapExpenseListResponse maps paginated response', () => {
  const payload = {
    meta: {
      pagination: {
        count: 15,
        page: 1,
        page_size: 10,
        next: '/api/labs/rooms/3/expenses?page=2',
        previous: null,
      },
    },
    data: [
      {
        id: 1,
        name: 'Fiber Internet Lease',
        expense_type: { value: 'utilities', label: 'Utilities' },
        cost: { amount: '350.00', currency: 'EUR' },
      },
    ],
  };

  const result = mapExpenseListResponse(payload, 3);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].name, 'Fiber Internet Lease');
  assert.equal(result.data[0].room_id, 3);
  assert.equal(result.pagination.count, 15);
  assert.equal(result.pagination.next, '/api/labs/rooms/3/expenses?page=2');
});

test('mapExpensePayment maps payments and refunds', () => {
  const rawPayment = {
    id: 101,
    expense: { id: 10 },
    transaction_type: { value: 'payment', label: 'Payment' },
    total: { amount: '1200.00', currency: 'EUR' },
    paid_date: '2026-02-01',
    reference: 'BANK-TRF-0988',
    notes: 'February payment',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
  };

  const payment = mapExpensePayment(rawPayment);
  assert.equal(payment.id, 101);
  assert.equal(payment.expense_id, 10);
  assert.equal(payment.transaction_type, 'payment');
  assert.equal(payment.amount, '1200.00');
  assert.equal(payment.paid_at, '2026-02-01');

  const rawRefund = {
    id: 102,
    transaction_type: { value: 'refund', label: 'Refund' },
    total: { amount: '100.00', currency: 'EUR' },
    paid_date: '2026-02-05',
  };
  const refund = mapExpensePayment(rawRefund, 10);
  assert.equal(refund.id, 102);
  assert.equal(refund.expense_id, 10);
  assert.equal(refund.transaction_type, 'refund');
});

test('mapExpensePaymentListResponse maps payment list envelope', () => {
  const payload = {
    meta: { pagination: { count: 1, page: 1, page_size: 10, next: null, previous: null } },
    data: [{ id: 101, total: { amount: '500.00', currency: 'EUR' }, transaction_type: { value: 'payment', label: 'Payment' } }],
  };
  const result = mapExpensePaymentListResponse(payload, 5);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].amount, '500.00');
  assert.equal(result.data[0].expense_id, 5);
});
