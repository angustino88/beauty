import type { ApiFieldError, NormalizedApiError, ToastDetailItem } from './types.ts';

type UnknownRecord = Record<string, unknown>;

const RESERVED_KEYS = new Set([
  'error',
  'detail',
  'details',
  'message',
  'non_field_errors',
  'code',
  'request_id',
  'status',
  'title',
]);

const DEFAULT_FALLBACK = 'We could not process your request. Please try again.';

const TECHNICAL_PATTERNS = [
  /traceback\s*\(most recent call last\)/i,
  /\b(typeerror|referenceerror|syntaxerror|rangeerror|urierror|keyerror|attributeerror|integrityerror|operationalerror|programmingerror)\b/i,
  /\b(select|insert|update|delete)\s+.+\b(from|into|where)\b/i,
  /\b(psycopg|django\.db|sqlalchemy|postgres|column\s+"[^"]+"\s+of\s+relation)\b/i,
  /\bat\s+[\w$.<>]+\s*\([^)]*:\d+:\d+\)/,
  /^\s*<!doctype\s+html/i,
  /^\s*<html[\s>]/i,
  /^https?:\/\/\S+$/i,
  /^\s*[[{][\s\S]*[\]}]\s*$/,
  /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/,
];

const GENERIC_ENVELOPE_MESSAGES =
  /^(?:one or more fields are invalid|the request is invalid|validation (?:failed|error)|invalid (?:input|request|data|fields))\.?$/i;

const BLOCKER_ARRAY_PREFIXES = new Set([
  'stations',
  'benches',
  'equipment',
  'equipment_categories',
  'bookings',
  'bench_bookings',
  'blockers',
]);

const NON_FIELD_NAMES = new Set(['non_field_errors', '__all__', 'detail', 'error']);

const FIELD_LABELS: Record<string, string> = {
  power_capacity_w: 'Power capacity (W)',
  max_power: 'Power capacity (W)',
  max_load_kg: 'Max load (kg)',
  height_mm: 'Height (mm)',
  width_mm: 'Width (mm)',
  depth_mm: 'Depth (mm)',
  length_mm: 'Length (mm)',
  network_port_capacity: 'Network port capacity',
  bench_capacity: 'Bench capacity',
  sku: 'SKU',
  serial_number: 'Serial number',
  ip_address: 'IP address',
  mac_address: 'MAC address',
  starts_at: 'Start time',
  ends_at: 'End time',
  due_at: 'Due date',
  setup_location_id: 'Station',
  station_slot_id: 'Station slot',
  room_id: 'Room',
  slot_id: 'Room slot',
  bench_id: 'Bench',
  bench_group_id: 'Bench group',
  owner_id: 'Owner',
  primary_owner: 'Owner',
  department_id: 'Department',
  group_id: 'Group',
  type_id: 'Type',
  purchase_order_number: 'Purchase order number',
  total_amount: 'Total amount',
  remote_ip: 'Remote IP',
  computing_id: 'Computing unit',
};

const ACRONYMS = new Set(['sku', 'ip', 'mac', 'id', 'ids', 'url', 'uuid', 'csv', 'api', 'qr', 'pnp']);

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toMessages = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap((item) => toMessages(item));
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (isRecord(value)) {
    if (typeof value.message === 'string' && value.message.trim()) return [value.message.trim()];
    if (typeof value.error === 'string' && value.error.trim()) return [value.error.trim()];
  }
  return [];
};

/**
 * Normalizes backend flattened field paths. Django/DRF plain-string error lists
 * are flattened by the API exception handler as `power_capacity_w[0]` or
 * `non_field_errors[0]`; strip trailing scalar list indices while preserving
 * structured blocker arrays (`benches[0]`) and nested object paths (`items[2].quantity`).
 */
export function normalizeApiFieldPath(rawField: string): string {
  const trimmed = rawField.trim();
  const scalarIndexMatch = /^([a-z0-9_.-]+)\[\d+\]$/i.exec(trimmed);
  if (scalarIndexMatch) {
    const base = scalarIndexMatch[1];
    if (!BLOCKER_ARRAY_PREFIXES.has(base.toLowerCase())) {
      return base;
    }
  }
  return trimmed;
}

export function formatApiFieldLabel(field: string): string {
  const normalized = normalizeApiFieldPath(field);
  const direct = FIELD_LABELS[normalized.toLowerCase()];
  if (direct) return direct;

  // Handle workbook or nested array paths like `Rooms[3].power_capacity_w` or `items[2].quantity`
  const indexedNested = /^([^.[\]]+)\[(\d+)\]\.(.+)$/.exec(normalized);
  if (indexedNested) {
    const [, collection, idxStr, subField] = indexedNested;
    const isWorkbookSheet = /^[A-Z]/.test(collection);
    const subLabel = formatApiFieldLabel(subField);
    if (isWorkbookSheet) {
      return `${collection} row ${idxStr} · ${subLabel}`;
    }
    const singular = collection.endsWith('s') ? collection.slice(0, -1) : collection;
    return `${formatApiFieldLabel(singular)} ${Number(idxStr) + 1} · ${subLabel}`;
  }

  const cleaned = normalized
    .replace(/_id$/i, '')
    .replace(/[._]+/g, ' ')
    .trim();

  if (!cleaned) return field;

  const words = cleaned.split(/\s+/).map((word, idx) => {
    const lower = word.toLowerCase();
    if (ACRONYMS.has(lower)) return lower.toUpperCase();
    if (idx === 0) return lower.charAt(0).toUpperCase() + lower.slice(1);
    return lower;
  });

  return words.join(' ');
}

function formatFieldMessage(field: string, message: string): string {
  const trimmed = message.trim();
  const label = formatApiFieldLabel(field);
  const labelLower = label.toLowerCase().replace(/\s*\([^)]*\)\s*$/, '').trim();
  const msgLower = trimmed.toLowerCase();
  if (labelLower && (msgLower.startsWith(labelLower) || msgLower.startsWith(`the ${labelLower}`))) {
    return trimmed;
  }
  return `${label}: ${trimmed}`;
}

const readDetailField = (detail: UnknownRecord): string | undefined => {
  const candidate = detail.field ?? detail.name ?? detail.path;
  if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  if (
    Array.isArray(candidate) &&
    candidate.length > 0 &&
    candidate.every((part) => typeof part === 'string' || typeof part === 'number')
  ) {
    return candidate.join('.');
  }
  return undefined;
};

const readDetailMessages = (detail: UnknownRecord): string[] =>
  toMessages(detail.message ?? detail.error ?? detail.detail ?? detail.messages);

/**
 * Returns true if the message looks like an internal exception, HTML error page,
 * SQL error, stack trace, or raw JSON dump that should not be exposed to users.
 */
export function isTechnicalErrorText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.length > 420) return true;
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function sanitizeUserMessage(candidate: string | undefined, fallback: string): string {
  if (!candidate) return fallback;
  const cleaned = candidate.replace(/^Error:\s*/i, '').trim();
  if (!cleaned || isTechnicalErrorText(cleaned)) return fallback;
  return cleaned;
}

function statusFallbackMessage(status: number | string | undefined, fallback: string): string {
  if (status === 'FETCH_ERROR') {
    return 'Unable to reach the server. Check your network connection and try again.';
  }
  if (status === 'TIMEOUT_ERROR') {
    return 'The request timed out. Please try again.';
  }
  if (status === 'PARSING_ERROR') {
    return 'Received an unexpected response from the server. Please try again.';
  }
  if (typeof status === 'number') {
    if (status === 401) return 'Your session has expired. Please sign in again.';
    if (status === 403) return 'You do not have permission to perform this action.';
    if (status === 404) return 'The requested item could not be found.';
    if (status === 409) {
      return 'This record conflicts with existing data or was updated by someone else. Refresh and try again.';
    }
    if (status === 413) return 'The uploaded file exceeds the maximum allowed size.';
    if (status === 429) return 'Too many requests. Please wait a moment and try again.';
    if (status >= 500) return 'The server encountered an issue. Please try again shortly.';
  }
  return fallback;
}

function extractEnvelope(error: unknown): {
  status?: number | string;
  envelope: UnknownRecord | null;
} {
  if (!isRecord(error)) return { status: undefined, envelope: null };
  const status =
    typeof error.status === 'number' || typeof error.status === 'string'
      ? error.status
      : undefined;

  if (isRecord(error.data)) {
    const data = error.data;
    if (isRecord(data.error)) return { status, envelope: data.error };
    return { status, envelope: data };
  }
  if (isRecord(error.error)) {
    return { status, envelope: error.error };
  }
  return { status, envelope: error };
}

/**
 * Normalizes any RTK Query error, API error envelope, legacy DRF payload, or JS Error
 * into a safe, user-facing `NormalizedApiError`. Never throws.
 */
export function normalizeApiError(
  error: unknown,
  fallback: string = DEFAULT_FALLBACK,
): NormalizedApiError {
  if (error instanceof Error) {
    if (error.cause != null && error.cause !== error && (isRecord(error.cause) || error.cause instanceof Error)) {
      return normalizeApiError(error.cause, fallback);
    }
    const safeMsg = sanitizeUserMessage(error.message, fallback);
    return {
      code: 'client_error',
      message: safeMsg,
      fields: [],
      nonFieldErrors: safeMsg ? [safeMsg] : [],
      isNetworkError: false,
      isTimeout: false,
      isPermissionError: false,
      isConflict: false,
    };
  }

  const { status, envelope } = extractEnvelope(error);
  const isNetworkError = status === 'FETCH_ERROR';
  const isTimeout = status === 'TIMEOUT_ERROR';
  const isPermissionError = status === 401 || status === 403;
  const isConflict = status === 409;

  if (!envelope) {
    const fallbackMessage = statusFallbackMessage(status, fallback);
    return {
      code: typeof status === 'number' ? `http_${status}` : isNetworkError ? 'network_error' : isTimeout ? 'timeout_error' : 'error',
      status,
      message: fallbackMessage,
      fields: [],
      nonFieldErrors: [fallbackMessage],
      isNetworkError,
      isTimeout,
      isPermissionError,
      isConflict,
    };
  }

  const fields: ApiFieldError[] = [];
  const nonFieldErrors: string[] = [
    ...toMessages(envelope.non_field_errors),
    ...toMessages(envelope.detail),
    ...(typeof envelope.error === 'string' ? toMessages(envelope.error) : []),
    ...toMessages(envelope.message),
    ...(typeof envelope.title === 'string' && !envelope.message ? toMessages(envelope.title) : []),
  ];

  if (Array.isArray(envelope.details)) {
    for (const item of envelope.details) {
      if (!isRecord(item)) {
        nonFieldErrors.push(...toMessages(item));
        continue;
      }
      const rawField = readDetailField(item);
      const field = rawField ? normalizeApiFieldPath(rawField) : undefined;
      const msgs = readDetailMessages(item);
      if (field && !NON_FIELD_NAMES.has(field.toLowerCase()) && msgs.length > 0) {
        for (const msg of msgs) {
          fields.push({ field, message: msg });
        }
      } else {
        nonFieldErrors.push(...msgs);
      }
    }
  }

  for (const [key, value] of Object.entries(envelope)) {
    if (RESERVED_KEYS.has(key)) continue;
    // Only treat array/string values on raw DRF payloads as field errors when not transport metadata.
    if (key === 'originalStatus' || key === 'data' || key === 'stack' || key === 'name') continue;
    if (typeof value === 'string' || Array.isArray(value)) {
      const normalizedKey = normalizeApiFieldPath(key);
      const msgs = toMessages(value);
      if (NON_FIELD_NAMES.has(normalizedKey.toLowerCase())) {
        nonFieldErrors.push(...msgs);
      } else {
        for (const msg of msgs) {
          fields.push({ field: normalizedKey, message: msg });
        }
      }
    }
  }

  const rawCode = typeof envelope.code === 'string' && envelope.code.trim()
    ? envelope.code.trim()
    : typeof status === 'number'
      ? `http_${status}`
      : isNetworkError
        ? 'network_error'
        : isTimeout
          ? 'timeout_error'
          : 'error';

  const statusDefault = statusFallbackMessage(status, fallback);
  const descriptiveFields = fields.filter(
    (entry) =>
      !isMetadataCountEntry(entry.field, entry.message) &&
      !isBlockerMetadataField(entry.field) &&
      !isTechnicalErrorText(entry.message),
  );

  const envelopeMessage =
    typeof envelope.message === 'string' && !isTechnicalErrorText(envelope.message)
      ? envelope.message.trim()
      : undefined;

  const isGenericEnvelope = !envelopeMessage || GENERIC_ENVELOPE_MESSAGES.test(envelopeMessage);
  const specificNonField = nonFieldErrors.find(
    (item) =>
      item !== envelope.message &&
      !isTechnicalErrorText(item) &&
      !GENERIC_ENVELOPE_MESSAGES.test(item),
  );

  let primaryCandidate: string | undefined;
  if (isGenericEnvelope) {
    if (specificNonField) {
      primaryCandidate = specificNonField;
    } else if (descriptiveFields.length === 1) {
      primaryCandidate = formatFieldMessage(
        descriptiveFields[0].field,
        descriptiveFields[0].message,
      );
    } else if (descriptiveFields.length > 1) {
      const first = formatFieldMessage(
        descriptiveFields[0].field,
        descriptiveFields[0].message,
      );
      const extra = descriptiveFields.length - 1;
      primaryCandidate = `${first} (+${extra} more ${extra === 1 ? 'issue' : 'issues'})`;
    } else {
      primaryCandidate = envelopeMessage ?? nonFieldErrors.find((item) => !isTechnicalErrorText(item));
    }
  } else {
    primaryCandidate = envelopeMessage;
  }

  const resolvedMessage = sanitizeUserMessage(primaryCandidate, statusDefault);

  return {
    code: rawCode,
    status,
    message: resolvedMessage,
    fields,
    nonFieldErrors: nonFieldErrors.filter((item) => !isTechnicalErrorText(item)),
    isNetworkError,
    isTimeout,
    isPermissionError,
    isConflict: isConflict || rawCode.includes('conflict'),
  };
}

const METADATA_COUNT_FIELD = /(?:^|_)(?:total|count)$/i;
const BARE_NUMERIC_TEXT = /^\d+$/;

function isMetadataCountEntry(field: string, message: string): boolean {
  return METADATA_COUNT_FIELD.test(field) || BARE_NUMERIC_TEXT.test(message.trim());
}

function isBlockerMetadataField(field: string): boolean {
  const base = field.replace(/\[\d+\]$/, '').split('.')[0].toLowerCase();
  return BLOCKER_ARRAY_PREFIXES.has(base);
}

const BLOCKER_GROUPS: ReadonlyArray<{
  key: string;
  singular: string;
  plural: string;
}> = [
  { key: 'stations', singular: 'Blocking station', plural: 'Blocking stations' },
  { key: 'benches', singular: 'Blocking bench', plural: 'Blocking benches' },
  { key: 'equipment', singular: 'Blocking equipment', plural: 'Blocking equipment' },
  { key: 'bookings', singular: 'Active booking', plural: 'Active bookings' },
  { key: 'bench_bookings', singular: 'Active booking', plural: 'Active bookings' },
];

const EQUIPMENT_BLOCKER_LABELS: Record<string, string> = {
  bench_assignment: 'Assigned to a bench',
  loan: 'Checked out on loan',
  license_assignment: 'Assigned license seats',
  booking: 'Active booking',
};

const MAX_TOAST_PREVIEW_ITEMS = 3;
const MAX_TOAST_FIELD_DETAILS = 4;

function formatBlockerGroup(
  labelSingular: string,
  labelPlural: string,
  total: number,
  previews: string[],
): ToastDetailItem {
  const count = Math.max(total, previews.length);
  const baseLabel = count === 1 ? labelSingular : labelPlural;
  const label = `${baseLabel} (${count}):`;

  if (previews.length === 0) {
    return { tone: 'neutral', label: `${baseLabel}:`, value: String(count) };
  }

  const shown = previews.slice(0, MAX_TOAST_PREVIEW_ITEMS);
  const remaining = count - shown.length;
  const value = remaining > 0 ? `${shown.join(', ')} (+${remaining} more)` : shown.join(', ');
  return { tone: 'neutral', label, value };
}

/**
 * Extracts structured, human-readable details for toast display:
 * - 409 Conflict blockers (blocking benches, stations, equipment, active bookings)
 * - Multi-field validation issues (422 validation_failed with multiple field errors)
 */
export function getApiErrorDetails(error: unknown): ToastDetailItem[] {
  const normalized = normalizeApiError(error);
  if (normalized.fields.length === 0) return [];

  const totals = new Map<string, number>();
  const lists = new Map<string, string[]>();

  for (const { field, message } of normalized.fields) {
    const trimmed = message.trim();
    if (!trimmed) continue;

    const totalMatch = /^([a-z_]+)_total$/i.exec(field);
    if (totalMatch) {
      const parsed = Number.parseInt(trimmed, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        totals.set(totalMatch[1].toLowerCase(), parsed);
      }
      continue;
    }

    const arrayMatch = /^([a-z_]+)\[\d+\]$/i.exec(field);
    if (arrayMatch && BLOCKER_ARRAY_PREFIXES.has(arrayMatch[1].toLowerCase())) {
      const groupKey = arrayMatch[1].toLowerCase();
      const existing = lists.get(groupKey) ?? [];
      if (!existing.includes(trimmed)) {
        existing.push(trimmed);
        lists.set(groupKey, existing);
      }
      continue;
    }

    const bookingDotMatch = /^bench_bookings\.\d+$/i.exec(field);
    if (bookingDotMatch) {
      const existing = lists.get('bench_bookings') ?? [];
      if (!existing.includes(trimmed)) {
        existing.push(trimmed);
        lists.set('bench_bookings', existing);
      }
      continue;
    }

    if (field === 'blockers') {
      const existing = lists.get('blockers') ?? [];
      if (!existing.includes(trimmed)) {
        existing.push(trimmed);
        lists.set('blockers', existing);
      }
    }
  }

  const blockerDetails: ToastDetailItem[] = [];

  for (const group of BLOCKER_GROUPS) {
    const total = totals.get(group.key) ?? 0;
    const previews = lists.get(group.key) ?? [];
    if (total > 0 || previews.length > 0) {
      blockerDetails.push(formatBlockerGroup(group.singular, group.plural, total, previews));
    }
  }

  const blockers = lists.get('blockers') ?? [];
  if (blockers.length > 0 && blockerDetails.length === 0) {
    const labels = blockers.map((code) => EQUIPMENT_BLOCKER_LABELS[code] ?? code.replace(/_/g, ' '));
    blockerDetails.push({
      tone: 'neutral',
      label: blockers.length === 1 ? 'Active blocker:' : 'Active blockers:',
      value: labels.join(', '),
    });
  }

  if (blockerDetails.length > 0) {
    return blockerDetails;
  }

  // Surface field-level validation issues as structured rows when there are multiple errors
  // (or when the top-level message does not already include the single field error).
  const validationFields = normalized.fields.filter(
    (entry) =>
      !isMetadataCountEntry(entry.field, entry.message) &&
      !isBlockerMetadataField(entry.field) &&
      !isTechnicalErrorText(entry.message),
  );

  if (validationFields.length === 0) return [];
  if (validationFields.length === 1 && normalized.message.includes(validationFields[0].message.trim())) {
    return [];
  }

  const rows: ToastDetailItem[] = validationFields
    .slice(0, MAX_TOAST_FIELD_DETAILS)
    .map((entry) => ({
      tone: 'neutral' as const,
      label: `${formatApiFieldLabel(entry.field)}:`,
      value: entry.message.trim(),
    }));

  const remaining = validationFields.length - rows.length;
  if (remaining > 0) {
    rows.push({
      tone: 'neutral',
      label: 'More issues:',
      value: `+${remaining} additional ${remaining === 1 ? 'field' : 'fields'}`,
    });
  }

  return rows;
}

/**
 * Convenience helper returning only a safe, user-facing error message.
 */
export function getApiErrorMessage(error: unknown, fallback: string = DEFAULT_FALLBACK): string {
  return normalizeApiError(error, fallback).message;
}

/**
 * Maps normalized API field errors onto Ant Design form field paths.
 */
export function mapApiFieldErrors(
  problem: Pick<NormalizedApiError, 'fields'>,
  formFields: readonly string[],
  aliases: Record<string, string> = {},
): {
  matched: { name: (string | number)[]; errors: string[] }[];
  unmatched: ApiFieldError[];
} {
  const known = new Set(formFields);
  const grouped = new Map<string, string[]>();
  const unmatched: ApiFieldError[] = [];

  for (const fieldError of problem.fields) {
    const path = aliases[fieldError.field] ?? fieldError.field;
    if (known.has(path)) {
      const existing = grouped.get(path) ?? [];
      existing.push(fieldError.message);
      grouped.set(path, existing);
    } else {
      unmatched.push(fieldError);
    }
  }

  const matched = Array.from(grouped.entries()).map(([path, errors]) => ({
    name: path.split('.'),
    errors,
  }));

  return { matched, unmatched };
}
