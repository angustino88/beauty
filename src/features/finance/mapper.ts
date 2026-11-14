import type {
  IFinanceExpenseTypeBreakdown,
  IFinanceExpenseTypeBreakdownItem,
  IFinanceMonthlyTrends,
  IFinanceMonthTrend,
  IFinanceSummary,
  IFinanceTotals,
  IFinancialReport,
  IFinancialReportItem,
  IFinancialReportPeriodBreakdown,
  IFinancialReportRoomBreakdown,
  IFinancialReportStatusBreakdown,
  IFinancialReportSummary,
  IFinancialReportTypeBreakdown,
} from './types';
import { EXPENSE_TYPE_LABELS } from '../expense/mapper.ts';

function parseNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function getExpenseTypeLabel(type: string): string {
  const key = type.toLowerCase() as keyof typeof EXPENSE_TYPE_LABELS;
  return EXPENSE_TYPE_LABELS[key] || type || 'Other';
}

function parseMoney(raw: unknown): number {
  if (raw && typeof raw === 'object' && 'amount' in raw) {
    return parseNumber(raw.amount);
  }
  return parseNumber(raw);
}

function mapTotals(raw: unknown): IFinanceTotals {
  if (!raw || typeof raw !== 'object') {
    return { payments: 0, refunds: 0, net: 0, transaction_count: 0 };
  }
  const t = raw as Record<string, unknown>;
  return {
    payments: parseMoney(t.payments),
    refunds: parseMoney(t.refunds),
    net: parseMoney(t.net),
    transaction_count: Math.round(parseNumber(t.transaction_count)),
  };
}

export function mapFinancialReport(raw: unknown): IFinancialReport {
  if (!raw || typeof raw !== 'object') {
    return {
      currency: 'EUR',
      summary: {
        total_budgeted: 0,
        total_paid: 0,
        total_pending: 0,
        total_refunded: 0,
        expense_count: 0,
        payment_count: 0,
      },
      by_expense_type: [],
      by_room: [],
      by_status: [],
      by_billing_period: [],
      items: [],
    };
  }

  const envelope = raw as Record<string, unknown>;
  const data = (envelope.data && typeof envelope.data === 'object' ? envelope.data : envelope) as Record<
    string,
    unknown
  >;

  const currency = typeof data.currency === 'string' && data.currency ? data.currency : 'EUR';

  // Summary
  const rawSummary = (data.summary ?? {}) as Record<string, unknown>;
  const summary: IFinancialReportSummary = {
    total_budgeted: parseNumber(rawSummary.total_budgeted),
    total_paid: parseNumber(rawSummary.total_paid),
    total_pending: parseNumber(rawSummary.total_pending),
    total_refunded: parseNumber(rawSummary.total_refunded),
    expense_count: Math.round(parseNumber(rawSummary.expense_count)),
    payment_count: Math.round(parseNumber(rawSummary.payment_count)),
  };

  // By Expense Type
  const rawTypes = Array.isArray(data.by_expense_type) ? data.by_expense_type : [];
  const by_expense_type: IFinancialReportTypeBreakdown[] = rawTypes.map((item: Record<string, unknown>) => {
    const expense_type = String(item.expense_type ?? 'other');
    return {
      expense_type,
      expense_type_label: getExpenseTypeLabel(expense_type),
      count: Math.round(parseNumber(item.count)),
      amount: parseNumber(item.amount),
      paid_amount: parseNumber(item.paid_amount),
      pending_amount: parseNumber(item.pending_amount),
    };
  });

  // By Room
  const rawRooms = Array.isArray(data.by_room) ? data.by_room : [];
  const by_room: IFinancialReportRoomBreakdown[] = rawRooms.map((item: Record<string, unknown>) => ({
    room_id: Math.round(parseNumber(item.room_id)),
    room_name: String(item.room_name ?? `Room #${item.room_id}`),
    count: Math.round(parseNumber(item.count)),
    amount: parseNumber(item.amount),
    paid_amount: parseNumber(item.paid_amount),
    pending_amount: parseNumber(item.pending_amount),
  }));

  // By Status
  const rawStatus = Array.isArray(data.by_status) ? data.by_status : [];
  const by_status: IFinancialReportStatusBreakdown[] = rawStatus.map((item: Record<string, unknown>) => ({
    status: String(item.status ?? 'pending'),
    count: Math.round(parseNumber(item.count)),
    amount: parseNumber(item.amount),
  }));

  // By Billing Period
  const rawPeriods = Array.isArray(data.by_billing_period) ? data.by_billing_period : [];
  const by_billing_period: IFinancialReportPeriodBreakdown[] = rawPeriods.map(
    (item: Record<string, unknown>) => ({
      billing_period: String(item.billing_period ?? 'monthly'),
      count: Math.round(parseNumber(item.count)),
      amount: parseNumber(item.amount),
      paid_amount: parseNumber(item.paid_amount),
    }),
  );

  // Items
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: IFinancialReportItem[] = rawItems.map((item: Record<string, unknown>) => {
    const expenseType = String(item.expense_type ?? 'other');
    return {
      id: Math.round(parseNumber(item.id)),
      name: String(item.name ?? ''),
      expense_type: expenseType,
      expense_type_label: getExpenseTypeLabel(expenseType),
      amount: parseNumber(item.amount),
      paid_amount: parseNumber(item.paid_amount),
      pending_amount: parseNumber(item.pending_amount),
      payment_status: String(item.payment_status ?? 'pending'),
      currency: String(item.currency ?? currency),
      billing_period: String(item.billing_period ?? 'monthly'),
      supplier: typeof item.supplier === 'string' ? item.supplier : undefined,
      reference: typeof item.reference === 'string' ? item.reference : undefined,
      valid_from: String(item.valid_from ?? ''),
      valid_until: typeof item.valid_until === 'string' ? item.valid_until : null,
      room_id: Math.round(parseNumber(item.room_id)),
      room_name: String(item.room_name ?? `Room #${item.room_id}`),
    };
  });

  return {
    currency,
    summary,
    by_expense_type,
    by_room,
    by_status,
    by_billing_period,
    items,
  };
}

export function mapFinanceSummary(raw: unknown): IFinanceSummary {
  if (!raw || typeof raw !== 'object') {
    return {
      currency: 'EUR',
      start_month: '',
      end_month: '',
      combined: { payments: 0, refunds: 0, net: 0, transaction_count: 0 },
      sources: {
        expense: { payments: 0, refunds: 0, net: 0, transaction_count: 0 },
        procurement: { payments: 0, refunds: 0, net: 0, transaction_count: 0 },
      },
    };
  }

  const envelope = raw as Record<string, unknown>;
  const data = (envelope.data && typeof envelope.data === 'object' ? envelope.data : envelope) as Record<
    string,
    unknown
  >;

  const rawSources = (data.sources ?? {}) as Record<string, unknown>;

  return {
    currency: String(data.currency ?? 'EUR'),
    start_month: String(data.start_month ?? ''),
    end_month: String(data.end_month ?? ''),
    combined: mapTotals(data.combined),
    sources: {
      expense: mapTotals(rawSources.expense),
      procurement: mapTotals(rawSources.procurement),
    },
  };
}

export function mapFinanceMonthlyTrends(raw: unknown): IFinanceMonthlyTrends {
  if (!raw || typeof raw !== 'object') {
    return { currency: 'EUR', months: [] };
  }

  const envelope = raw as Record<string, unknown>;
  const data = (envelope.data && typeof envelope.data === 'object' ? envelope.data : envelope) as Record<
    string,
    unknown
  >;

  const rawMonths = Array.isArray(data.months) ? data.months : [];
  const months: IFinanceMonthTrend[] = rawMonths.map((m: Record<string, unknown>) => {
    const rawSources = (m.sources ?? {}) as Record<string, unknown>;
    return {
      month: String(m.month ?? ''),
      combined: mapTotals(m.combined),
      sources: {
        expense: mapTotals(rawSources.expense),
        procurement: mapTotals(rawSources.procurement),
      },
    };
  });

  return {
    currency: String(data.currency ?? 'EUR'),
    months,
  };
}

export function mapFinanceExpenseTypeBreakdown(raw: unknown): IFinanceExpenseTypeBreakdown {
  if (!raw || typeof raw !== 'object') {
    return { currency: 'EUR', items: [] };
  }

  const envelope = raw as Record<string, unknown>;
  const data = (envelope.data && typeof envelope.data === 'object' ? envelope.data : envelope) as Record<
    string,
    unknown
  >;

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: IFinanceExpenseTypeBreakdownItem[] = rawItems.map((item: Record<string, unknown>) => {
    const expenseType = String(item.expense_type ?? 'other');
    return {
      expense_type: expenseType,
      expense_type_label: getExpenseTypeLabel(expenseType),
      source: String(item.source ?? 'expense'),
      payments: parseMoney(item.payments),
      refunds: parseMoney(item.refunds),
      net: parseMoney(item.net),
      transaction_count: Math.round(parseNumber(item.transaction_count)),
    };
  });

  return {
    currency: String(data.currency ?? 'EUR'),
    items,
  };
}
