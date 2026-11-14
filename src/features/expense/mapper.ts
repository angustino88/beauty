import type {
  BillingPeriodEnum,
  ExpenseTypeEnum,
  IExpense,
  IExpenseListPagination,
  IExpenseListResponse,
  IExpensePayment,
} from './types';

export const EXPENSE_TYPE_LABELS: Record<ExpenseTypeEnum, string> = {
  rent: 'Rent / Lease',
  utilities: 'Utilities',
  maintenance: 'Maintenance',
  calibration: 'Calibration',
  repair: 'Repair',
  service_contract: 'Service Contract',
  license_fee: 'License Fee',
  insurance: 'Insurance',
  service: 'Service',
  other: 'Other',
};

export const EXPENSE_TYPE_COLORS: Record<ExpenseTypeEnum, string> = {
  rent: 'blue',
  utilities: 'cyan',
  maintenance: 'orange',
  calibration: 'purple',
  repair: 'red',
  service_contract: 'green',
  license_fee: 'geekblue',
  insurance: 'gold',
  service: 'magenta',
  other: 'default',
};

export const BILLING_PERIOD_LABELS: Record<BillingPeriodEnum, string> = {
  one_time: 'One-time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

function normalizeExpenseType(type: unknown): ExpenseTypeEnum {
  const str = String(type ?? '').toLowerCase();
  if (str in EXPENSE_TYPE_LABELS) {
    return str as ExpenseTypeEnum;
  }
  return 'other';
}

function normalizeBillingPeriod(period: unknown): BillingPeriodEnum {
  const str = String(period ?? '').toLowerCase();
  if (str in BILLING_PERIOD_LABELS) {
    return str as BillingPeriodEnum;
  }
  return 'one_time';
}

function extractRoomInfo(room: unknown, fallbackRoomId?: number): { id: number; name?: string } {
  if (typeof room === 'number') {
    return { id: room };
  }
  if (room && typeof room === 'object') {
    const r = room as Record<string, unknown>;
    const id = typeof r.id === 'number' ? r.id : Number(r.id ?? fallbackRoomId ?? 0);
    const name = typeof r.name === 'string' ? r.name : typeof r.room_name === 'string' ? r.room_name : undefined;
    return { id, name };
  }
  return { id: fallbackRoomId ?? 0 };
}

function extractAmountDisplay(val: unknown, fallbackAmount: string, fallbackCurrency: string): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    const v = val as Record<string, unknown>;
    if (v.display) return String(v.display);
    if (v.formatted) return String(v.formatted);
    if (v.amount && v.currency) return `${v.currency} ${v.amount}`;
  }
  return `${fallbackCurrency} ${fallbackAmount}`;
}

export function mapExpense(raw: unknown, defaultRoomId?: number): IExpense {
  if (!raw || typeof raw !== 'object') {
    return {
      id: 0,
      room_id: defaultRoomId ?? 0,
      name: '',
      expense_type: 'other',
      expense_type_label: EXPENSE_TYPE_LABELS.other,
      amount: '0.00',
      currency: 'EUR',
      amount_display: 'EUR 0.00',
      billing_period: 'one_time',
      billing_period_label: BILLING_PERIOD_LABELS.one_time,
      valid_from: '',
      created_at: '',
      updated_at: '',
    };
  }

  const ex = raw as Record<string, unknown>;
  const roomInfo = extractRoomInfo(ex.room, defaultRoomId);
  const expenseType = normalizeExpenseType(ex.expense_type);
  const billingPeriod = normalizeBillingPeriod(ex.billing_period);
  const currency = typeof ex.currency === 'string' && ex.currency ? ex.currency : 'EUR';
  const amount = typeof ex.amount === 'string' ? ex.amount : String(ex.amount ?? '0.00');
  const amountDisplay = extractAmountDisplay(ex.amount_display, amount, currency);

  return {
    id: typeof ex.id === 'number' ? ex.id : Number(ex.id ?? 0),
    room_id: roomInfo.id,
    room_name: roomInfo.name,
    name: typeof ex.name === 'string' ? ex.name : '',
    expense_type: expenseType,
    expense_type_label: EXPENSE_TYPE_LABELS[expenseType],
    supplier: typeof ex.supplier === 'string' ? ex.supplier : undefined,
    reference: typeof ex.reference === 'string' ? ex.reference : undefined,
    amount,
    currency,
    amount_display: amountDisplay,
    billing_period: billingPeriod,
    billing_period_label: BILLING_PERIOD_LABELS[billingPeriod],
    valid_from: typeof ex.valid_from === 'string' ? ex.valid_from : '',
    valid_until: typeof ex.valid_until === 'string' ? ex.valid_until : null,
    notes: typeof ex.notes === 'string' ? ex.notes : undefined,
    created_at: typeof ex.created_at === 'string' ? ex.created_at : '',
    updated_at: typeof ex.updated_at === 'string' ? ex.updated_at : '',
  };
}

export function mapExpenseListResponse(raw: unknown, defaultRoomId?: number): IExpenseListResponse {
  if (!raw || typeof raw !== 'object') {
    return {
      data: [],
      pagination: { count: 0, page: 1, page_size: 10, next: null, previous: null },
    };
  }

  const envelope = raw as Record<string, unknown>;
  const rawList = Array.isArray(envelope.data)
    ? envelope.data
    : Array.isArray(envelope.results)
      ? envelope.results
      : [];

  const metaPagination = (envelope.meta as Record<string, unknown> | undefined)?.pagination as
    | Record<string, unknown>
    | undefined;

  const pagination: IExpenseListPagination = {
    count: Number(metaPagination?.count ?? envelope.count ?? rawList.length),
    page: Number(metaPagination?.page ?? envelope.page ?? 1),
    page_size: Number(metaPagination?.page_size ?? envelope.page_size ?? 10),
    next: (metaPagination?.next ?? envelope.next ?? null) as string | null,
    previous: (metaPagination?.previous ?? envelope.previous ?? null) as string | null,
  };

  return {
    data: rawList.map((item) => mapExpense(item, defaultRoomId)),
    pagination,
  };
}

export function mapExpensePayment(raw: unknown, defaultExpenseId?: number): IExpensePayment {
  if (!raw || typeof raw !== 'object') {
    return {
      id: 0,
      expense_id: defaultExpenseId,
      transaction_type: 'payment',
      amount: '0.00',
      paid_at: '',
      created_at: '',
      updated_at: '',
    };
  }

  const p = raw as Record<string, unknown>;
  const rawType = String(p.transaction_type ?? 'payment').toLowerCase();
  const txType: 'payment' | 'refund' = rawType === 'refund' ? 'refund' : 'payment';

  let expenseId = defaultExpenseId;
  if (typeof p.expense === 'number') expenseId = p.expense;
  else if (p.expense && typeof p.expense === 'object') {
    const expObj = p.expense as Record<string, unknown>;
    if (typeof expObj.id === 'number') expenseId = expObj.id;
  }

  return {
    id: typeof p.id === 'number' ? p.id : Number(p.id ?? 0),
    expense_id: expenseId,
    transaction_type: txType,
    amount: typeof p.amount === 'string' ? p.amount : String(p.amount ?? '0.00'),
    paid_at: typeof p.paid_at === 'string' ? p.paid_at : '',
    reference: typeof p.reference === 'string' ? p.reference : undefined,
    notes: typeof p.notes === 'string' ? p.notes : undefined,
    created_at: typeof p.created_at === 'string' ? p.created_at : '',
    updated_at: typeof p.updated_at === 'string' ? p.updated_at : '',
  };
}

export function mapExpensePaymentListResponse(
  raw: unknown,
  defaultExpenseId?: number,
): { data: IExpensePayment[]; pagination: IExpenseListPagination } {
  if (!raw || typeof raw !== 'object') {
    return {
      data: [],
      pagination: { count: 0, page: 1, page_size: 10, next: null, previous: null },
    };
  }

  const envelope = raw as Record<string, unknown>;
  const rawList = Array.isArray(envelope.data)
    ? envelope.data
    : Array.isArray(envelope.results)
      ? envelope.results
      : [];

  const metaPagination = (envelope.meta as Record<string, unknown> | undefined)?.pagination as
    | Record<string, unknown>
    | undefined;

  return {
    data: rawList.map((item) => mapExpensePayment(item, defaultExpenseId)),
    pagination: {
      count: Number(metaPagination?.count ?? envelope.count ?? rawList.length),
      page: Number(metaPagination?.page ?? envelope.page ?? 1),
      page_size: Number(metaPagination?.page_size ?? envelope.page_size ?? 10),
      next: (metaPagination?.next ?? envelope.next ?? null) as string | null,
      previous: (metaPagination?.previous ?? envelope.previous ?? null) as string | null,
    },
  };
}
