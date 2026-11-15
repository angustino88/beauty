import type {
  IPurchase,
  IPurchaseItem,
  IPurchaseItemResource,
  IPurchaseListPagination,
  IPurchaseListResponse,
  IPurchasePriority,
  IPurchaseTransaction,
  TransactionType,
} from './types';
import { readWireMoney } from './wire.ts';

function extractStatus(status: unknown): { code: string; label: string } {
  if (typeof status === 'string') {
    return { code: status, label: status.toUpperCase() };
  }
  if (status && typeof status === 'object') {
    const s = status as Record<string, unknown>;
    const code = (s.value ?? s.code ?? s.key ?? s.status ?? 'unknown') as string;
    const label = (s.label ?? s.name ?? code) as string;
    return { code: String(code), label: String(label) };
  }
  return { code: 'unknown', label: 'Unknown' };
}

function extractAmountDisplay(val: unknown, fallbackAmount?: string, fallbackCurrency?: string): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
    const v = val as Record<string, unknown>;
    if (v.display) return String(v.display);
    if (v.formatted) return String(v.formatted);
    if (v.amount && v.currency) return `${v.currency} ${v.amount}`;
  }
  if (fallbackAmount && fallbackCurrency) {
    return `${fallbackCurrency} ${fallbackAmount}`;
  }
  return fallbackAmount ?? '0.00';
}

function extractIdFromObject(obj: unknown): number | undefined {
  if (typeof obj === 'number') return obj;
  if (obj && typeof obj === 'object') {
    const rec = obj as Record<string, unknown>;
    if (typeof rec.id === 'number') return rec.id;
  }
  return undefined;
}

/**
 * Generates or extracts the strong entity tag (ETag) for a purchase draft header.
 * Follows backend format: "purchase-{id}-v{version}"
 * If version is unknown, defaults to wildcard '*' so backend _require_match accepts it.
 */
export function getPurchaseEtag(
  purchase: { id: number; version?: number; etag?: string } | null | undefined,
): string {
  if (!purchase) return '*';
  if (purchase.etag) return purchase.etag;
  if (typeof purchase.version === 'number') {
    return `"purchase-${purchase.id}-v${purchase.version}"`;
  }
  return '*';
}

/**
 * Generates or extracts the strong entity tag (ETag) for a purchase line item.
 * Follows backend format: "item-{id}-v{version}"
 * If version is unknown, defaults to wildcard '*' so backend _require_match accepts it.
 */
export function getItemEtag(
  item: { id: number; version?: number; etag?: string } | null | undefined,
): string {
  if (!item) return '*';
  if (item.etag) return item.etag;
  if (typeof item.version === 'number') {
    return `"item-${item.id}-v${item.version}"`;
  }
  return '*';
}

export function mapPurchase(raw: unknown): IPurchase {
  if (!raw || typeof raw !== 'object') {
    return {
      id: 0,
      supplier: '',
      purchase_order_number: '',
      purchase_date: '',
      currency: 'EUR',
      status: 'unknown',
      status_label: 'Unknown',
      total_amount: '0.00',
      total_display: 'EUR 0.00',
      item_count: 0,
      notes: '',
      created_at: '',
      updated_at: '',
    };
  }

  const p = raw as Record<string, unknown>;
  const statusInfo = extractStatus(p.status);
  // `total` is one money object ({amount, currency}); the UI reads it as decimal + currency.
  const totalMoney = readWireMoney(p.total);
  const currency = totalMoney.currency;
  const totalAmount = totalMoney.amount;
  const totalDisplay = `${currency} ${totalAmount}`;
  const version = typeof p.version === 'number' ? p.version : undefined;
  const etag = typeof p.etag === 'string' ? p.etag : undefined;

  return {
    id: typeof p.id === 'number' ? p.id : Number(p.id ?? 0),
    supplier: typeof p.supplier === 'string' ? p.supplier : '',
    purchase_order_number: typeof p.purchase_order_number === 'string' ? p.purchase_order_number : '',
    purchase_date: typeof p.purchase_date === 'string' ? p.purchase_date : '',
    currency,
    status: statusInfo.code,
    status_label: statusInfo.label,
    total_amount: totalAmount,
    total_display: totalDisplay,
    item_count: typeof p.item_count === 'number' ? p.item_count : Number(p.item_count ?? 0),
    notes: typeof p.notes === 'string' ? p.notes : '',
    version,
    etag,
    created_at: typeof p.created_at === 'string' ? p.created_at : '',
    updated_at: typeof p.updated_at === 'string' ? p.updated_at : '',
    items: Array.isArray(p.items) ? p.items.map(mapPurchaseItem) : undefined,
  };
}

export function mapPurchaseListResponse(raw: unknown): IPurchaseListResponse {
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

  const pagination: IPurchaseListPagination = {
    count: Number(metaPagination?.count ?? envelope.count ?? rawList.length),
    page: Number(metaPagination?.page ?? envelope.page ?? 1),
    page_size: Number(metaPagination?.page_size ?? envelope.page_size ?? 10),
    next: (metaPagination?.next ?? envelope.next ?? null) as string | null,
    previous: (metaPagination?.previous ?? envelope.previous ?? null) as string | null,
  };

  return {
    data: rawList.map(mapPurchase),
    pagination,
  };
}

export function mapPurchaseItem(raw: unknown): IPurchaseItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: 0,
      description: '',
      quantity: 1,
      unit: 'pcs',
      unit_price: '0.00',
      line_value: '0.00',
      notes: '',
      created_at: '',
    };
  }

  const it = raw as Record<string, unknown>;
  const quantity = typeof it.quantity === 'number' ? it.quantity : Number(it.quantity ?? 1);
  const unitPrice = readWireMoney(it.unit_price).amount;

  let priorityId: number | undefined;
  let priorityCode: string | undefined;
  let priorityName: string | undefined;
  if (it.priority && typeof it.priority === 'object') {
    const pri = it.priority as Record<string, unknown>;
    priorityId = typeof pri.id === 'number' ? pri.id : undefined;
    priorityCode = typeof pri.code === 'string' ? pri.code : undefined;
    priorityName = typeof pri.name === 'string' ? pri.name : undefined;
  } else if (typeof it.priority_id === 'number') {
    priorityId = it.priority_id;
  }

  const lineValue =
    typeof it.line_value === 'string'
      ? it.line_value
      : it.line_value && typeof it.line_value === 'object'
        ? extractAmountDisplay(it.line_value, '0.00')
        : (quantity * parseFloat(unitPrice || '0')).toFixed(2);

  const version = typeof it.version === 'number' ? it.version : undefined;
  const etag = typeof it.etag === 'string' ? it.etag : undefined;

  return {
    id: typeof it.id === 'number' ? it.id : Number(it.id ?? 0),
    purchase_id: extractIdFromObject(it.purchase),
    description: typeof it.description === 'string' ? it.description : '',
    quantity,
    unit: typeof it.unit === 'string' && it.unit ? it.unit : 'pcs',
    unit_price: unitPrice,
    line_value: lineValue,
    priority_id: priorityId,
    priority_code: priorityCode,
    priority_name: priorityName,
    purpose: typeof it.purpose === 'string' ? it.purpose : undefined,
    notes: typeof it.notes === 'string' ? it.notes : '',
    version,
    etag,
    created_at: typeof it.created_at === 'string' ? it.created_at : '',
  };
}

export function mapPurchasePriority(raw: unknown): IPurchasePriority {
  if (!raw || typeof raw !== 'object') {
    return { id: 0, code: 'normal', name: 'Normal' };
  }
  const p = raw as Record<string, unknown>;
  return {
    id: typeof p.id === 'number' ? p.id : Number(p.id ?? 0),
    code: typeof p.code === 'string' ? p.code : 'normal',
    name: typeof p.name === 'string' ? p.name : 'Normal',
  };
}

export function mapPurchasePriorityListResponse(raw: unknown): IPurchasePriority[] {
  if (!raw || typeof raw !== 'object') return [];
  const envelope = raw as Record<string, unknown>;
  const rawList = Array.isArray(envelope.data)
    ? envelope.data
    : Array.isArray(envelope.results)
      ? envelope.results
      : Array.isArray(raw)
        ? raw
        : [];
  return rawList.map(mapPurchasePriority);
}

export function mapPurchaseItemListResponse(raw: unknown): {
  data: IPurchaseItem[];
  pagination: IPurchaseListPagination;
} {
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
    data: rawList.map(mapPurchaseItem),
    pagination: {
      count: Number(metaPagination?.count ?? envelope.count ?? rawList.length),
      page: Number(metaPagination?.page ?? envelope.page ?? 1),
      page_size: Number(metaPagination?.page_size ?? envelope.page_size ?? 10),
      next: (metaPagination?.next ?? envelope.next ?? null) as string | null,
      previous: (metaPagination?.previous ?? envelope.previous ?? null) as string | null,
    },
  };
}

export function mapPurchaseTransaction(raw: unknown): IPurchaseTransaction {
  if (!raw || typeof raw !== 'object') {
    return {
      id: 0,
      transaction_type: 'payment',
      amount: '0.00',
      settled_at: '',
      reference: '',
      notes: '',
      created_at: '',
    };
  }

  const tr = raw as Record<string, unknown>;
  const rawType = extractStatus(tr.transaction_type ?? 'payment').code.toLowerCase();
  const txType: TransactionType = rawType === 'refund' ? 'refund' : 'payment';

  return {
    id: typeof tr.id === 'number' ? tr.id : Number(tr.id ?? 0),
    purchase_id: extractIdFromObject(tr.purchase),
    transaction_type: txType,
    amount: readWireMoney(tr.total).amount,
    settled_at: typeof tr.settled_at === 'string' ? tr.settled_at : '',
    reference: typeof tr.reference === 'string' ? tr.reference : '',
    notes: typeof tr.notes === 'string' ? tr.notes : '',
    created_at: typeof tr.created_at === 'string' ? tr.created_at : '',
  };
}

export function mapPurchaseTransactionListResponse(raw: unknown): {
  data: IPurchaseTransaction[];
  pagination: IPurchaseListPagination;
} {
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
    data: rawList.map(mapPurchaseTransaction),
    pagination: {
      count: Number(metaPagination?.count ?? envelope.count ?? rawList.length),
      page: Number(metaPagination?.page ?? envelope.page ?? 1),
      page_size: Number(metaPagination?.page_size ?? envelope.page_size ?? 10),
      next: (metaPagination?.next ?? envelope.next ?? null) as string | null,
      previous: (metaPagination?.previous ?? envelope.previous ?? null) as string | null,
    },
  };
}

export function mapPurchaseItemResource(raw: unknown): IPurchaseItemResource {
  if (!raw || typeof raw !== 'object') {
    return {
      id: 0,
      purchase_item_id: 0,
      resource_type_id: 0,
      resource_id: 0,
      created_at: '',
    };
  }

  const res = raw as Record<string, unknown>;
  let resourceName: string | undefined;
  if (res.resource && typeof res.resource === 'object') {
    const rObj = res.resource as Record<string, unknown>;
    resourceName = String(rObj.name ?? rObj.sku ?? rObj.title ?? '');
  }

  const rawKind = extractStatus(res.resource_kind).code;
  const resourceKind =
    rawKind === 'bench' || rawKind === 'equipment' || rawKind === 'license' || rawKind === 'station'
      ? rawKind
      : undefined;

  const rawPrice = res.acquisition_price;
  const acquisitionPrice =
    typeof rawPrice === 'string'
      ? rawPrice
      : rawPrice && typeof rawPrice === 'object'
        ? readWireMoney(rawPrice).amount
        : undefined;

  return {
    id: typeof res.id === 'number' ? res.id : Number(res.id ?? 0),
    purchase_item_id: extractIdFromObject(res.purchase_item) ?? Number(res.purchase_item_id ?? 0),
    resource_kind: resourceKind,
    resource_type_id: res.resource_type_id ? Number(res.resource_type_id) : undefined,
    resource_id: Number(res.resource_id ?? 0),
    resource_name: resourceName,
    acquisition_price: acquisitionPrice,
    created_at: typeof res.created_at === 'string' ? res.created_at : '',
  };
}

export function mapPurchaseItemResourceListResponse(raw: unknown): {
  data: IPurchaseItemResource[];
  pagination: IPurchaseListPagination;
} {
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
    data: rawList.map(mapPurchaseItemResource),
    pagination: {
      count: Number(metaPagination?.count ?? envelope.count ?? rawList.length),
      page: Number(metaPagination?.page ?? envelope.page ?? 1),
      page_size: Number(metaPagination?.page_size ?? envelope.page_size ?? 10),
      next: (metaPagination?.next ?? envelope.next ?? null) as string | null,
      previous: (metaPagination?.previous ?? envelope.previous ?? null) as string | null,
    },
  };
}
