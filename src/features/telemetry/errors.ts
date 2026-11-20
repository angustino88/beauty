/** Turns the API error envelope (`{error: {code, message, details: [{field, code, message}]}}`) into UI text. */

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiProblem {
  code: string;
  message: string;
  fields: ApiFieldError[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Read an RTK Query error (or anything thrown by `unwrap()`); never throws. */
export function readApiProblem(error: unknown): ApiProblem {
  const payload = isRecord(error) && isRecord(error.data) ? error.data : null;
  const body = payload && isRecord(payload.error) ? payload.error : null;
  if (!body) {
    const status = isRecord(error) ? error.status : undefined;
    return {
      code: typeof status === 'number' ? `http_${status}` : 'network_error',
      message: status === 'FETCH_ERROR' ? 'The server could not be reached. Check your connection.' : 'Something went wrong. Try again.',
      fields: [],
    };
  }
  const details = Array.isArray(body.details) ? body.details.filter(isRecord) : [];
  return {
    code: typeof body.code === 'string' ? body.code : 'error',
    message: typeof body.message === 'string' ? body.message : 'The request was refused.',
    fields: details
      .filter((detail) => typeof detail.field === 'string' && detail.field)
      .map((detail) => ({ field: String(detail.field), message: String(detail.message ?? 'Invalid value.') })),
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
  const known = new Set(formFields);
  const matched: { name: (string | number)[]; errors: string[] }[] = [];
  const unmatched: ApiFieldError[] = [];
  for (const fieldError of problem.fields) {
    const path = aliases[fieldError.field] ?? fieldError.field;
    if (known.has(path)) matched.push({ name: path.split('.'), errors: [fieldError.message] });
    else unmatched.push(fieldError);
  }
  return { matched, unmatched };
}
