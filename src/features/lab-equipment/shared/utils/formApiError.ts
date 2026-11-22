type UnknownRecord = Record<string, unknown>;

export interface ParsedFormApiError {
  fieldErrors: Record<string, string[]>;
  nonFieldErrors: string[];
  message?: string;
}

const RESERVED_KEYS = new Set(['error', 'detail', 'details', 'message', 'non_field_errors', 'code', 'request_id']);

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toMessages = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap((item) => toMessages(item));
  if (typeof value === 'string') return value ? [value] : [];
  if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (isRecord(value)) {
    if (typeof value.message === 'string') return [value.message];
    if (typeof value.error === 'string') return [value.error];
  }
  return [];
};

const readPayload = (error: unknown): UnknownRecord | null => {
  if (error instanceof Error) {
    if (error.cause != null && error.cause !== error) {
      return readPayload(error.cause);
    }
    return null;
  }
  if (!isRecord(error)) return null;
  if (isRecord(error.data)) {
    const data = error.data;
    return isRecord(data.error) ? data.error : data;
  }
  if (isRecord(error.error)) return error.error;
  return error;
};

const NON_FIELD_NAMES = new Set(['non_field_errors', '__all__', 'detail', 'error']);
const METADATA_COUNT_FIELD = /^([a-z0-9_]+)_(?:total|count)$/i;
const GENERIC_VALIDATION_WRAPPER =
  /^(?:one or more fields are invalid|the request is invalid|validation (?:failed|error)|invalid (?:input|request|data|fields)|some fields require attention)\.?$/i;
const BARE_NUMERIC_TEXT = /^\d+$/;

const readRawDetailField = (detail: UnknownRecord): string | undefined => {
  const candidate = detail.field ?? detail.name ?? detail.path;
  if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  if (Array.isArray(candidate) && candidate.every((part) => typeof part === 'string' || typeof part === 'number')) {
    return candidate.join('.');
  }
  return undefined;
};

const normalizeDetailField = (rawField: string, countedGroups: ReadonlySet<string>): string => {
  const trimmed = rawField.trim();
  const scalarIndexMatch = /^([a-z0-9_.-]+)\[\d+\]$/i.exec(trimmed);
  if (scalarIndexMatch && !countedGroups.has(scalarIndexMatch[1].toLowerCase())) {
    return scalarIndexMatch[1];
  }
  return trimmed;
};

const readDetailMessages = (detail: UnknownRecord): string[] =>
  toMessages(detail.message ?? detail.error ?? detail.detail ?? detail.messages);

const isGenericWrapper = (value: unknown): boolean =>
  typeof value !== 'string' || !value.trim() || GENERIC_VALIDATION_WRAPPER.test(value.trim());

const findDescriptiveFieldError = (fieldErrors: Record<string, string[]>): string | undefined => {
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (METADATA_COUNT_FIELD.test(field)) continue;
    const candidate = messages.find((msg) => msg.trim() && !BARE_NUMERIC_TEXT.test(msg.trim()));
    if (candidate) return candidate;
  }
  return undefined;
};

export const parseFormApiError = (error: unknown): ParsedFormApiError | null => {
  const payload = readPayload(error);
  if (!payload) return null;

  const fieldErrors: Record<string, string[]> = {};
  const nonFieldErrors = [
    ...toMessages(payload.non_field_errors),
    ...toMessages(payload.detail),
    ...toMessages(payload.error),
    ...toMessages(payload.message),
  ];

  const countedGroups = new Set<string>();
  if (Array.isArray(payload.details)) {
    for (const detail of payload.details) {
      if (!isRecord(detail)) continue;
      const rawField = readRawDetailField(detail);
      const countMatch = rawField ? METADATA_COUNT_FIELD.exec(rawField) : null;
      if (countMatch) countedGroups.add(countMatch[1].toLowerCase());
    }

    for (const detail of payload.details) {
      if (!isRecord(detail)) {
        nonFieldErrors.push(...toMessages(detail));
        continue;
      }
      const rawField = readRawDetailField(detail);
      const field = rawField ? normalizeDetailField(rawField, countedGroups) : undefined;
      const messages = readDetailMessages(detail);
      if (field && !NON_FIELD_NAMES.has(field.toLowerCase()) && messages.length > 0) {
        fieldErrors[field] = [...(fieldErrors[field] ?? []), ...messages];
      } else {
        nonFieldErrors.push(...messages);
      }
    }
  }

  for (const [key, value] of Object.entries(payload)) {
    if (RESERVED_KEYS.has(key)) continue;
    const messages = toMessages(value);
    if (messages.length > 0) fieldErrors[key] = messages;
  }

  const firstFieldError = findDescriptiveFieldError(fieldErrors);
  const specificNonField = nonFieldErrors.find((item) => item !== payload.message);
  const message = isGenericWrapper(payload.message)
    ? (specificNonField ?? firstFieldError ?? nonFieldErrors[0])
    : (specificNonField ?? (typeof payload.message === 'string' ? payload.message.trim() : undefined) ?? nonFieldErrors[0]);

  if (message || Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, nonFieldErrors, message };
  }
  return null;
};

