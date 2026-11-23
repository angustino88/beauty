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

const NON_FIELD_NAMES = new Set(['non_field_errors', '__all__', 'detail', 'error']);

const UNIT_SUFFIXES: Record<string, string> = {
  w: 'W',
  kw: 'kW',
  mw: 'MW',
  kg: 'kg',
  g: 'g',
  mm: 'mm',
  cm: 'cm',
  m: 'm',
  v: 'V',
  mv: 'mV',
  a: 'A',
  ma: 'mA',
  hz: 'Hz',
  khz: 'kHz',
  mhz: 'MHz',
  ghz: 'GHz',
  ms: 'ms',
  s: 's',
  mb: 'MB',
  gb: 'GB',
  tb: 'TB',
  pct: '%',
};

const ACRONYMS = new Set(['sku', 'ip', 'mac', 'id', 'ids', 'url', 'uuid', 'csv', 'api', 'qr', 'pnp']);

export interface ApiErrorFormatOptions {
  /** Optional caller-supplied field label overrides (e.g. derived from a form's field definitions). */
  fieldLabels?: Record<string, string>;
}

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
 * Strips trailing scalar list indices added by DRF/Django validation flattening
 * (e.g. `power_capacity_w[0]` -> `power_capacity_w`), while preserving nested
 * object paths (`items[2].quantity`) and counted resource groups (`benches[0]`
 * when accompanied by `benches_total`).
 */
export function normalizeApiFieldPath(
  rawField: string,
  countedGroups?: ReadonlySet<string>,
): string {
  const trimmed = rawField.trim();
  const scalarIndexMatch = /^([a-z0-9_.-]+)\[\d+\]$/i.exec(trimmed);
  if (scalarIndexMatch) {
    const base = scalarIndexMatch[1];
    if (!countedGroups?.has(base.toLowerCase())) {
      return base;
    }
  }
  return trimmed;
}

/**
 * Converts an API field key (e.g. `power_capacity_w`, `room_id`, `items[1].quantity`)
 * into a readable label using purely structural rules (or a caller-provided label map).
 */
export function formatApiFieldLabel(
  field: string,
  fieldLabels?: Record<string, string>,
): string {
  const normalized = normalizeApiFieldPath(field);
  if (fieldLabels) {
    const override = fieldLabels[normalized] ?? fieldLabels[normalized.toLowerCase()];
    if (override) return override;
  }

  // Handle workbook or nested array paths like `Rooms[3].power_capacity_w` or `items[2].quantity`
  const indexedNested = /^([^.[\]]+)\[(\d+)\]\.(.+)$/.exec(normalized);
  if (indexedNested) {
    const [, collection, idxStr, subField] = indexedNested;
    const isWorkbookSheet = /^[A-Z]/.test(collection);
    const subLabel = formatApiFieldLabel(subField, fieldLabels);
    if (isWorkbookSheet) {
      return `${collection} row ${idxStr} · ${subLabel}`;
    }
    const singular = collection.endsWith('s') ? collection.slice(0, -1) : collection;
    return `${formatApiFieldLabel(singular, fieldLabels)} ${Number(idxStr) + 1} · ${subLabel}`;
  }

  const withoutIdSuffix = normalized.replace(/_ids?$/i, '');
  const tokens = withoutIdSuffix.split(/[._]+/).filter(Boolean);
  if (tokens.length === 0) return field;

  let unitSuffix = '';
  if (tokens.length > 1) {
    const lastLower = tokens[tokens.length - 1].toLowerCase();
    const unit = UNIT_SUFFIXES[lastLower];
    if (unit) {
      tokens.pop();
      unitSuffix = ` (${unit})`;
    }
  }

  const words = tokens.map((word, idx) => {
    const lower = word.toLowerCase();
    if (ACRONYMS.has(lower)) return lower.toUpperCase();
    if (idx === 0) return lower.charAt(0).toUpperCase() + lower.slice(1);
    return lower;
  });

  return `${words.join(' ')}${unitSuffix}`;
}

function formatFieldMessage(
  field: string,
  message: string,
  fieldLabels?: Record<string, string>,
): string {
  const trimmed = message.trim();
  const label = formatApiFieldLabel(field, fieldLabels);
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

const METADATA_COUNT_FIELD = /^([a-z0-9_]+)_(?:total|count)$/i;
const BARE_NUMERIC_TEXT = /^\d+$/;
const SNAKE_CASE_CODE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;
const MAX_TOAST_PREVIEW_ITEMS = 3;
const MAX_TOAST_FIELD_DETAILS = 4;

function isMetadataCountEntry(field: string, message: string): boolean {
  return METADATA_COUNT_FIELD.test(field) || BARE_NUMERIC_TEXT.test(message.trim());
}

function humanizeSnakeToken(value: string): string {
  const cleaned = value.trim().replace(/_+/g, ' ');
  if (!cleaned) return value;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function collectCountedGroups(details: unknown[]): Set<string> {
  const groups = new Set<string>();
  for (const item of details) {
    if (!isRecord(item)) continue;
    const rawField = readDetailField(item);
    if (!rawField) continue;
    const match = METADATA_COUNT_FIELD.exec(rawField);
    if (match) {
      groups.add(match[1].toLowerCase());
    }
  }
  return groups;
}

function isCountedOrAuxiliaryField(field: string, countedGroups: ReadonlySet<string>): boolean {
  const base = field.replace(/\[\d+\]$/, '').split('.')[0].toLowerCase();
  if (countedGroups.has(base)) return true;
  for (const group of countedGroups) {
    if (base.startsWith(`${group}_`)) return true;
  }
  return false;
}

/**
 * Normalizes any RTK Query error, API error envelope, legacy DRF payload, or JS Error
 * into a safe, user-facing `NormalizedApiError`. Never throws.
 */
export function normalizeApiError(
  error: unknown,
  fallback: string = DEFAULT_FALLBACK,
  options?: ApiErrorFormatOptions,
): NormalizedApiError {
  if (error instanceof Error) {
    if (error.cause != null && error.cause !== error && (isRecord(error.cause) || error.cause instanceof Error)) {
      return normalizeApiError(error.cause, fallback, options);
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

  const countedGroups = Array.isArray(envelope.details)
    ? collectCountedGroups(envelope.details)
    : new Set<string>();

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
      const field = rawField ? normalizeApiFieldPath(rawField, countedGroups) : undefined;
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
      const normalizedKey = normalizeApiFieldPath(key, countedGroups);
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
      !isCountedOrAuxiliaryField(entry.field, countedGroups) &&
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
        options?.fieldLabels,
      );
    } else if (descriptiveFields.length > 1) {
      const first = formatFieldMessage(
        descriptiveFields[0].field,
        descriptiveFields[0].message,
        options?.fieldLabels,
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

function formatCountedGroup(
  groupKey: string,
  total: number,
  previews: string[],
  fieldLabels?: Record<string, string>,
): ToastDetailItem {
  const count = Math.max(total, previews.length);
  const baseLabel = formatApiFieldLabel(groupKey, fieldLabels);

  if (previews.length === 0) {
    return { tone: 'neutral', label: `${baseLabel}:`, value: String(count) };
  }

  const shown = previews.slice(0, MAX_TOAST_PREVIEW_ITEMS);
  const remaining = count - shown.length;
  const value = remaining > 0 ? `${shown.join(', ')} (+${remaining} more)` : shown.join(', ');
  return { tone: 'neutral', label: `${baseLabel} (${count}):`, value };
}

/**
 * Extracts structured, human-readable details for toast display using purely structural conventions:
 * - Counted conflict groups (`<key>_total` + `<key>[n]`, or `<key>.<id>` on 409 responses)
 * - Coded conflict reason arrays (`<key>[n]` of snake_case tokens on 409 responses)
 * - Multi-field validation issues (422 validation_failed with multiple field errors)
 */
export function getApiErrorDetails(
  error: unknown,
  options?: ApiErrorFormatOptions,
): ToastDetailItem[] {
  const normalized = normalizeApiError(error, DEFAULT_FALLBACK, options);
  if (normalized.fields.length === 0) return [];

  const totals = new Map<string, number>();
  const countedLists = new Map<string, string[]>();
  const conflictDotLists = new Map<string, string[]>();
  const conflictCodeLists = new Map<string, string[]>();

  // First pass: discover all counted resource groups (`<key>_total` / `<key>_count`).
  for (const { field, message } of normalized.fields) {
    const match = METADATA_COUNT_FIELD.exec(field);
    if (!match) continue;
    const parsed = Number.parseInt(message.trim(), 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      totals.set(match[1].toLowerCase(), parsed);
    }
  }

  const countedGroups = new Set(totals.keys());

  // Second pass: collect previews for counted groups and conflict-specific dot/code lists.
  for (const { field, message } of normalized.fields) {
    const trimmed = message.trim();
    if (!trimmed || METADATA_COUNT_FIELD.test(field)) continue;

    const arrayMatch = /^([a-z0-9_]+)\[\d+\]$/i.exec(field);
    if (arrayMatch) {
      const groupKey = arrayMatch[1].toLowerCase();
      if (countedGroups.has(groupKey)) {
        const existing = countedLists.get(groupKey) ?? [];
        if (!existing.includes(trimmed)) {
          existing.push(trimmed);
          countedLists.set(groupKey, existing);
        }
        continue;
      }
    }

    if (normalized.isConflict) {
      const dotIdMatch = /^([a-z0-9_]+)\.\d+$/i.exec(field);
      if (dotIdMatch) {
        const groupKey = dotIdMatch[1].toLowerCase();
        const existing = conflictDotLists.get(groupKey) ?? [];
        if (!existing.includes(trimmed)) {
          existing.push(trimmed);
          conflictDotLists.set(groupKey, existing);
        }
        continue;
      }

      if (!isCountedOrAuxiliaryField(field, countedGroups) && (SNAKE_CASE_CODE.test(trimmed) || field.toLowerCase() === 'blockers' || field.toLowerCase() === 'reasons')) {
        const groupKey = field.toLowerCase();
        const existing = conflictCodeLists.get(groupKey) ?? [];
        const readable = SNAKE_CASE_CODE.test(trimmed) || /^[a-z]+$/.test(trimmed)
          ? humanizeSnakeToken(trimmed)
          : trimmed;
        if (!existing.includes(readable)) {
          existing.push(readable);
          conflictCodeLists.set(groupKey, existing);
        }
      }
    }
  }

  const conflictDetails: ToastDetailItem[] = [];

  for (const [groupKey, total] of totals.entries()) {
    const previews = countedLists.get(groupKey) ?? [];
    conflictDetails.push(formatCountedGroup(groupKey, total, previews, options?.fieldLabels));
  }

  for (const [groupKey, items] of conflictDotLists.entries()) {
    if (totals.has(groupKey)) continue;
    conflictDetails.push(formatCountedGroup(groupKey, items.length, items, options?.fieldLabels));
  }

  if (conflictDetails.length > 0) {
    return conflictDetails;
  }

  if (conflictCodeLists.size > 0) {
    for (const [groupKey, items] of conflictCodeLists.entries()) {
      conflictDetails.push({
        tone: 'neutral',
        label: `${formatApiFieldLabel(groupKey, options?.fieldLabels)}:`,
        value: items.join(', '),
      });
    }
    return conflictDetails;
  }

  // Surface field-level validation issues as structured rows when there are multiple errors
  // (or when the top-level message does not already include the single field error).
  const validationFields = normalized.fields.filter(
    (entry) =>
      !isMetadataCountEntry(entry.field, entry.message) &&
      !isCountedOrAuxiliaryField(entry.field, countedGroups) &&
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
      label: `${formatApiFieldLabel(entry.field, options?.fieldLabels)}:`,
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
export function getApiErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_FALLBACK,
  options?: ApiErrorFormatOptions,
): string {
  return normalizeApiError(error, fallback, options).message;
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
