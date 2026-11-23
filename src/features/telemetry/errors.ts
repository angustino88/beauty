/** Turns the API error envelope (`{error: {code, message, details: [{field, code, message}]}}`) into UI text. */
import { mapApiFieldErrors, normalizeApiError } from '../../shared/notifications/apiError.ts';
import type { ApiFieldError } from '../../shared/notifications/types.ts';

export type { ApiFieldError };

export interface ApiProblem {
  code: string;
  message: string;
  fields: ApiFieldError[];
}

/** Read an RTK Query error (or anything thrown by `unwrap()`); never throws. */
export function readApiProblem(error: unknown): ApiProblem {
  const normalized = normalizeApiError(error);
  return {
    code: normalized.code,
    message: normalized.message,
    fields: normalized.fields,
  };
}

/**
 * Map API field paths (`modbus.port`, `install_location_type`) onto antd form names.
 * `aliases` renames API fields to form fields; unknown fields are returned as `unmatched`.
 */
export function toFormErrors(
  problem: ApiProblem,
  formFields: readonly string[],
  aliases: Record<string, string> = {},
): { matched: { name: (string | number)[]; errors: string[] }[]; unmatched: ApiFieldError[] } {
  return mapApiFieldErrors(problem, formFields, aliases);
}
