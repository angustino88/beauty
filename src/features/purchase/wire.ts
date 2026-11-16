/**
 * Procurement wire adapters. The API takes every amount as one `{amount, currency}` object (FMT-2):
 * purchase `total`, line `unit_price`, transaction `total`, allocation `acquisition_price`.
 * The UI keeps decimal strings and a separate currency; these helpers convert at the request boundary.
 */

export type WireMoney = { amount: string; currency: string };

type WithCurrency = { currency?: string };

const omit = <T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]) => {
  const copy = { ...obj };
  for (const key of keys) delete copy[key];
  return copy as Omit<T, K>;
};

export function wireMoney(amount: string | number, currency: string): WireMoney {
  return { amount: String(amount), currency };
}

/** Reads a money value that may be `{amount, currency}` (current) or a plain decimal (legacy UI state). */
export function readWireMoney(raw: unknown, fallbackCurrency = 'EUR'): WireMoney {
  if (raw && typeof raw === 'object') {
    const m = raw as Partial<WireMoney>;
    return {
      amount: m.amount != null ? String(m.amount) : '0.00',
      currency: typeof m.currency === 'string' && m.currency ? m.currency : fallbackCurrency,
    };
  }
  return { amount: raw != null ? String(raw) : '0.00', currency: fallbackCurrency };
}

export function toPurchaseWire<T extends WithCurrency & { total_amount?: string; items?: { unit_price: string }[] }>(body: T) {
  const currency = body.currency ?? 'EUR';
  const rest = omit(body, ['currency', 'total_amount', 'items']);
  return {
    ...rest,
    ...(body.total_amount !== undefined ? { total: wireMoney(body.total_amount, currency) } : {}),
    ...(body.items
      ? { items: body.items.map((item) => ({ ...item, unit_price: wireMoney(item.unit_price, currency) })) }
      : {}),
  };
}

export function toPurchaseLineWire<T extends WithCurrency & { unit_price?: string }>(body: T) {
  const currency = body.currency ?? 'EUR';
  const rest = omit(body, ['currency', 'unit_price']);
  return {
    ...rest,
    ...(body.unit_price !== undefined ? { unit_price: wireMoney(body.unit_price, currency) } : {}),
  };
}

export function toPurchaseTransactionWire<T extends WithCurrency & { amount: string }>(body: T) {
  const currency = body.currency ?? 'EUR';
  const rest = omit(body, ['currency', 'amount']);
  return { ...rest, total: wireMoney(body.amount, currency) };
}

export function toPurchaseAllocationWire<T extends WithCurrency & { acquisition_price?: string }>(body: T) {
  const currency = body.currency ?? 'EUR';
  const rest = omit(body, ['currency', 'acquisition_price']);
  return {
    ...rest,
    ...(body.acquisition_price !== undefined ? { acquisition_price: wireMoney(body.acquisition_price, currency) } : {}),
  };
}
