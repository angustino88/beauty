import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapFinancialReport,
  mapFinanceSummary,
  mapFinanceMonthlyTrends,
  mapFinanceExpenseTypeBreakdown,
} from './mapper.ts';

test('mapFinancialReport normalizes summary, breakdowns, and ledger items', () => {
  const payload = {
    currency: 'EUR',
    summary: {
      total_budgeted: '25000.00',
      total_paid: '18500.00',
      total_pending: '6500.00',
      total_refunded: '200.00',
      expense_count: 14,
      payment_count: 22,
    },
    by_expense_type: [
      {
        expense_type: 'rent',
        count: 2,
        amount: '12000.00',
        paid_amount: '10000.00',
        pending_amount: '2000.00',
      },
    ],
    by_room: [
      {
        room_id: 1,
        room_name: 'Cleanroom 101',
        count: 5,
        amount: '15000.00',
        paid_amount: '12000.00',
        pending_amount: '3000.00',
      },
    ],
    by_status: [
      { status: 'paid', count: 10, amount: '18500.00' },
      { status: 'pending', count: 4, amount: '6500.00' },
    ],
    by_billing_period: [
      { billing_period: 'monthly', count: 8, amount: '20000.00', paid_amount: '15000.00' },
    ],
    items: [
      {
        id: 10,
        name: 'Cleanroom Rent',
        expense_type: 'rent',
        amount: '6000.00',
        paid_amount: '5000.00',
        pending_amount: '1000.00',
        payment_status: 'partial',
        currency: 'EUR',
        billing_period: 'monthly',
        room_id: 1,
        room_name: 'Cleanroom 101',
      },
    ],
  };

  const report = mapFinancialReport(payload);

  assert.equal(report.currency, 'EUR');
  assert.equal(report.summary.total_budgeted, 25000);
  assert.equal(report.summary.total_paid, 18500);
  assert.equal(report.summary.total_pending, 6500);
  assert.equal(report.summary.expense_count, 14);

  assert.equal(report.by_expense_type.length, 1);
  assert.equal(report.by_expense_type[0].expense_type, 'rent');
  assert.equal(report.by_expense_type[0].expense_type_label, 'Rent / Lease');

  assert.equal(report.by_room.length, 1);
  assert.equal(report.by_room[0].room_name, 'Cleanroom 101');

  assert.equal(report.items.length, 1);
  assert.equal(report.items[0].payment_status, 'partial');
});

test('mapFinanceSummary maps combined and source totals', () => {
  const money = (amount: string) => ({ amount, currency: 'USD' });
  const payload = {
    currency: 'USD',
    start_month: '2026-01',
    end_month: '2026-06',
    combined: {
      payments: money('54000.00'),
      refunds: money('-1200.00'),
      net: money('52800.00'),
      transaction_count: 35,
    },
    sources: {
      expense: {
        payments: money('30000.00'),
        refunds: money('-200.00'),
        net: money('29800.00'),
        transaction_count: 20,
      },
      procurement: {
        payments: money('24000.00'),
        refunds: money('-1000.00'),
        net: money('23000.00'),
        transaction_count: 15,
      },
    },
  };

  const summary = mapFinanceSummary(payload);

  assert.equal(summary.currency, 'USD');
  assert.equal(summary.combined.net, 52800);
  assert.equal(summary.combined.refunds, -1200);
  assert.equal(summary.sources.expense.payments, 30000);
  assert.equal(summary.sources.procurement.net, 23000);
});

test('mapFinanceMonthlyTrends parses monthly series', () => {
  const money = (amount: string) => ({ amount, currency: 'EUR' });
  const payload = {
    currency: 'EUR',
    months: [
      {
        month: '2026-01',
        combined: { payments: money('10000.00'), refunds: money('-11000.00'), net: money('-1000.00'), transaction_count: 5 },
        sources: {
          expense: { payments: money('6000.00'), refunds: money('0.00'), net: money('6000.00'), transaction_count: 3 },
          procurement: { payments: money('4000.00'), refunds: money('-11000.00'), net: money('-7000.00'), transaction_count: 2 },
        },
      },
    ],
  };

  const trends = mapFinanceMonthlyTrends(payload);
  assert.equal(trends.months.length, 1);
  assert.equal(trends.months[0].month, '2026-01');
  assert.equal(trends.months[0].sources.expense.net, 6000);
  assert.equal(trends.months[0].combined.net, -1000);
});

test('mapFinanceExpenseTypeBreakdown maps categories and sources', () => {
  const money = (amount: string) => ({ amount, currency: 'EUR' });
  const payload = {
    currency: 'EUR',
    items: [
      {
        expense_type: 'maintenance',
        source: 'expense',
        payments: money('4500.00'),
        refunds: money('-500.00'),
        net: money('4000.00'),
        transaction_count: 4,
      },
    ],
  };

  const breakdown = mapFinanceExpenseTypeBreakdown(payload);
  assert.equal(breakdown.items.length, 1);
  assert.equal(breakdown.items[0].expense_type_label, 'Maintenance');
  assert.equal(breakdown.items[0].source, 'expense');
  assert.equal(breakdown.items[0].net, 4000);
  assert.equal(breakdown.items[0].refunds, -500);
});
