import type {
  BillingPeriodEnum,
  ExpenseTypeEnum,
  ICreateExpensePaymentPayload,
  ICreateExpensePayload,
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

type MoneyRead = { amount: string; currency: string };

/** `{value, label}` choice (ENU-1) → its value; plain strings pass through. */
function choiceValue(raw: unknown): string {
  if (raw && typeof raw === 'object') return String((raw as { value?: unknown }).value ?? '');
  return String(raw ?? '');
}

function readMoney(raw: unknown, fallbackCurrency = 'EUR'): { amount: string; currency: string } {
  if (raw && typeof raw === 'object') {
    const m = raw as Partial<MoneyRead>;
    return {
      amount: typeof m.amount === 'string' ? m.amount : String(m.amount ?? '0.00'),
      currency: typeof m.currency === 'string' && m.currency ? m.currency : fallbackCurrency,
    };
  }
  return { amount: typeof raw === 'string' ? raw : '0.00', currency: fallbackCurrency };
}

/** Write body for an expense (`cost` money object, `start_date` / `end_date`). */
export function toExpenseWriteBody(body: ICreateExpensePayload) {
  const { amount, currency = 'EUR', valid_from, valid_until, ...rest } = body;
  return {
    ...rest,
    cost: { amount, currency },
    start_date: valid_from,
    end_date: valid_until ?? null,
  };
}

/** Write body for a payment (`total` money object, `paid_date`). */
export function toExpensePaymentWriteBody(body: ICreateExpensePaymentPayload) {
  const { amount, currency, paid_at, ...rest } = body;
  return {
    ...rest,
    total: { amount, currency },
    paid_date: paid_at,
  };
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

  // Wire shape: `expense_type` / `billing_period` are {value, label}; `cost` is {amount, currency};
  // dates are `start_date` / `end_date`. The UI keeps its own names (`amount`, `valid_from`, ...).
  const ex = raw as Record<string, unknown>;
  const roomInfo = extractRoomInfo(ex.room, defaultRoomId);
  const expenseType = normalizeExpenseType(choiceValue(ex.expense_type));
  const billingPeriod = normalizeBillingPeriod(choiceValue(ex.billing_period));
  const cost = readMoney(ex.cost);

  return {
    id: typeof ex.id === 'number' ? ex.id : Number(ex.id ?? 0),
    room_id: roomInfo.id,
    room_name: roomInfo.name,
    name: typeof ex.name === 'string' ? ex.name : '',
    expense_type: expenseType,
    expense_type_label: EXPENSE_TYPE_LABELS[expenseType],
    supplier: typeof ex.supplier === 'string' ? ex.supplier : undefined,
    reference: typeof ex.reference === 'string' ? ex.reference : undefined,
    amount: cost.amount,
    currency: cost.currency,
    amount_display: `${cost.currency} ${cost.amount}`,
    billing_period: billingPeriod,
    billing_period_label: BILLING_PERIOD_LABELS[billingPeriod],
    valid_from: typeof ex.start_date === 'string' ? ex.start_date : '',
    valid_until: typeof ex.end_date === 'string' ? ex.end_date : null,
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
  const rawType = choiceValue(p.transaction_type ?? 'payment').toLowerCase();
  const txType: 'payment' | 'refund' = rawType === 'refund' ? 'refund' : 'payment';

  let expenseId = defaultExpenseId;
  if (typeof p.expense === 'number') expenseId = p.expense;
  else if (p.expense && typeof p.expense === 'object') {
    const expObj = p.expense as Record<string, unknown>;
    if (typeof expObj.id === 'number') expenseId = expObj.id;
  }

  const total = readMoney(p.total);

  return {
    id: typeof p.id === 'number' ? p.id : Number(p.id ?? 0),
    expense_id: expenseId,
    transaction_type: txType,
    amount: total.amount,
    paid_at: typeof p.paid_date === 'string' ? p.paid_date : '',
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
