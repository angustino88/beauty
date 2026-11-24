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

/** `{value, label}` choice (ENU-1) → its value; plain strings pass through. */
function choiceValue(raw: unknown, fallback: string): string {
  if (raw && typeof raw === 'object') return String((raw as { value?: unknown }).value ?? fallback);
  return typeof raw === 'string' && raw ? raw : fallback;
}

function roomOf(raw: unknown): { room_id: number; room_name: string } {
  const room = (raw && typeof raw === 'object' ? raw : {}) as { id?: unknown; name?: unknown };
  const room_id = Math.round(parseNumber(room.id));
  return { room_id, room_name: String(room.name ?? `Room #${room_id}`) };
}

// The report is read into the UI's internal names: money objects → numbers, choices → values,
// `room: {id, name}` → room_id / room_name, `start_date` / `end_date` → valid_from / valid_until.
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

  const rawSummary = (data.summary ?? {}) as Record<string, unknown>;
  const summary: IFinancialReportSummary = {
    total_budgeted: parseMoney(rawSummary.budgeted),
    total_paid: parseMoney(rawSummary.paid),
    total_pending: parseMoney(rawSummary.pending),
    total_refunded: parseMoney(rawSummary.refunded),
    expense_count: Math.round(parseNumber(rawSummary.expense_count)),
    payment_count: Math.round(parseNumber(rawSummary.payment_count)),
  };

  const rawTypes = Array.isArray(data.by_expense_type) ? data.by_expense_type : [];
  const by_expense_type: IFinancialReportTypeBreakdown[] = rawTypes.map((item: Record<string, unknown>) => {
    const expense_type = choiceValue(item.expense_type, 'other');
    return {
      expense_type,
      expense_type_label: getExpenseTypeLabel(expense_type),
      count: Math.round(parseNumber(item.count)),
      amount: parseMoney(item.cost),
      paid_amount: parseMoney(item.paid),
      pending_amount: parseMoney(item.pending),
    };
  });

  const rawRooms = Array.isArray(data.by_room) ? data.by_room : [];
  const by_room: IFinancialReportRoomBreakdown[] = rawRooms.map((item: Record<string, unknown>) => ({
    ...roomOf(item.room),
    count: Math.round(parseNumber(item.count)),
    amount: parseMoney(item.cost),
    paid_amount: parseMoney(item.paid),
    pending_amount: parseMoney(item.pending),
  }));

  const rawStatus = Array.isArray(data.by_status) ? data.by_status : [];
  const by_status: IFinancialReportStatusBreakdown[] = rawStatus.map((item: Record<string, unknown>) => ({
    status: choiceValue(item.status, 'pending'),
    count: Math.round(parseNumber(item.count)),
    amount: parseMoney(item.cost),
  }));

  const rawPeriods = Array.isArray(data.by_billing_period) ? data.by_billing_period : [];
  const by_billing_period: IFinancialReportPeriodBreakdown[] = rawPeriods.map(
    (item: Record<string, unknown>) => ({
      billing_period: choiceValue(item.billing_period, 'monthly'),
      count: Math.round(parseNumber(item.count)),
      amount: parseMoney(item.cost),
      paid_amount: parseMoney(item.paid),
    }),
  );

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: IFinancialReportItem[] = rawItems.map((item: Record<string, unknown>) => {
    const expenseType = choiceValue(item.expense_type, 'other');
    const cost = item.cost as { currency?: unknown } | undefined;
    const resourceKind = choiceValue(item.resource_kind, 'room');
    const resourceKindLabel =
      item.resource_kind && typeof item.resource_kind === 'object' && typeof (item.resource_kind as { label?: unknown }).label === 'string'
        ? String((item.resource_kind as { label?: unknown }).label)
        : resourceKind.charAt(0).toUpperCase() + resourceKind.slice(1);
    const rawResource = (item.resource ?? item.room) as { id?: unknown; name?: unknown } | null | undefined;
    const resourceId = Math.round(parseNumber(rawResource?.id));
    const resourceName =
      typeof rawResource?.name === 'string' && rawResource.name
        ? rawResource.name
        : `${resourceKindLabel} #${resourceId}`;
    const room = item.room ? roomOf(item.room) : { room_id: 0, room_name: resourceName };
    return {
      id: Math.round(parseNumber(item.id)),
      name: String(item.name ?? ''),
      expense_type: expenseType,
      expense_type_label: getExpenseTypeLabel(expenseType),
      amount: parseMoney(item.cost),
      paid_amount: parseMoney(item.paid),
      pending_amount: parseMoney(item.pending),
      payment_status: choiceValue(item.payment_status, 'pending'),
      currency: typeof cost?.currency === 'string' ? cost.currency : currency,
      billing_period: choiceValue(item.billing_period, 'monthly'),
      supplier: typeof item.supplier === 'string' ? item.supplier : undefined,
      reference: typeof item.reference === 'string' ? item.reference : undefined,
      valid_from: String(item.start_date ?? ''),
      valid_until: typeof item.end_date === 'string' ? item.end_date : null,
      resource_kind: resourceKind,
      resource_kind_label: resourceKindLabel,
      resource_id: resourceId,
      resource_name: resourceName,
      ...room,
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
      source: choiceValue(item.source, 'expense'),
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
