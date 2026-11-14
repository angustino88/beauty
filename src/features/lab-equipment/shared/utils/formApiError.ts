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
  if (!isRecord(error)) return null;
  if (isRecord(error.data)) {
    const data = error.data;
    return isRecord(data.error) ? data.error : data;
  }
  if (isRecord(error.error)) return error.error;
  return error;
};

const readDetailField = (detail: UnknownRecord): string | undefined => {
  const candidate = detail.field ?? detail.name ?? detail.path;
  if (typeof candidate === 'string') return candidate;
  if (Array.isArray(candidate) && candidate.every((part) => typeof part === 'string' || typeof part === 'number')) {
    return candidate.join('.');
  }
  return undefined;
};

const readDetailMessages = (detail: UnknownRecord): string[] =>
  toMessages(detail.message ?? detail.error ?? detail.detail ?? detail.messages);

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

  if (Array.isArray(payload.details)) {
    for (const detail of payload.details) {
      if (!isRecord(detail)) {
        nonFieldErrors.push(...toMessages(detail));
        continue;
      }
      const field = readDetailField(detail);
      const messages = readDetailMessages(detail);
      if (field && messages.length > 0) {
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

  const firstFieldError = Object.values(fieldErrors)[0]?.[0];
  const message = nonFieldErrors.find((item) => item !== payload.message)
    ?? firstFieldError
    ?? nonFieldErrors[0];

  if (message || Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, nonFieldErrors, message };
  }
  return null;
};

