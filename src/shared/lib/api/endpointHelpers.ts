/**
 * Generates REST endpoint paths for a resource.
 * Pass the full path after /api/ — verified against api-docs/.
 *
 * Examples:
 *   createResourceEndpoints('labs/lab-computers')  → /api/labs/lab-computers
 *   createResourceEndpoints('labs/lab-bookings')   → /api/labs/lab-bookings
 *   createResourceEndpoints('login')               → /api/login
 */
export function createResourceEndpoints(resourcePath: string) {
  return {
    LIST: `/api/${resourcePath}`,
    DETAIL: (id: number | string) => `/api/${resourcePath}/${id}`,
    CREATE: `/api/${resourcePath}`,
    UPDATE: (id: number | string) => `/api/${resourcePath}/${id}`,
    DELETE: (id: number | string) => `/api/${resourcePath}/${id}`,
  };
}

type UnknownRecord = Record<string, unknown>;
type ArrayMode = 'repeat' | 'comma';

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function appendQueryParams(
  searchParams: URLSearchParams,
  params: object,
  options?: { arrayMode?: ArrayMode },
) {
  const arrayMode = options?.arrayMode ?? 'comma';
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    // Guard against malformed key fragments accidentally leaking into query strings
    // (e.g. "page_"), which can produce backend 400 responses.
    if (!key || key.endsWith('_')) continue;
    if (value == null) continue;
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      if (arrayMode === 'repeat') {
        for (const item of value) {
          if (item == null) continue;
          if (typeof item === 'number' && !Number.isFinite(item)) continue;
          if (typeof item === 'string' && item.trim() === '') continue;
          searchParams.append(key, String(item));
        }
      } else {
        const compacted = value
          .filter((item) => item != null)
          .filter((item) => !(typeof item === 'number' && !Number.isFinite(item)))
          .filter((item) => !(typeof item === 'string' && item.trim() === ''))
          .map(String);
        if (compacted.length === 0) continue;
        searchParams.append(key, compacted.join(','));
      }
      continue;
    }
    searchParams.append(key, String(value));
  }
}

export function buildQueryString(
  params: object,
  options?: { arrayMode?: ArrayMode },
): string {
  const searchParams = new URLSearchParams();
  appendQueryParams(searchParams, params, options);
  return searchParams.toString();
}

type SortableListParams = {
  sorts?: readonly string[];
  orders?: readonly string[];
};

export function buildSortableListQuery(params: SortableListParams & object): string {
  const { sorts, orders, ...rest } = params;
  const searchParams = new URLSearchParams();
  appendQueryParams(searchParams, rest);

  // The list endpoints take one `ordering` param: comma-separated fields, `-` for descending.
  if (sorts?.length) {
    searchParams.append(
      'ordering',
      sorts.map((field, index) => ((orders?.[index] ?? 'asc').toLowerCase() === 'desc' ? `-${field}` : field)).join(','),
    );
  }
  return searchParams.toString();
}

const toNumberIfValid = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const pickTotal = (...candidates: unknown[]): number | undefined => {
  for (const candidate of candidates) {
    const n = toNumberIfValid(candidate);
    if (n !== undefined) return n;
  }
  return undefined;
};

const paginationCount = (value: unknown): number | undefined => {
  if (!isRecord(value) || !isRecord(value.pagination)) return undefined;
  return toNumberIfValid(value.pagination.count);
};

export function normalizeListResponse<T>(res: unknown): { total_count: number; data: T[] } {
  if (Array.isArray(res)) {
    return { total_count: res.length, data: res as T[] };
  }

  if (!isRecord(res)) {
    return { total_count: 0, data: [] };
  }

  if (Array.isArray(res.data)) {
    return {
      total_count:
        pickTotal(res.total_count, paginationCount(res.meta), res.count, res.data.length)
        ?? res.data.length,
      data: res.data as T[],
    };
  }

  if (Array.isArray(res.value)) {
    return {
      total_count: pickTotal(res.total_count, res.count, res.value.length) ?? res.value.length,
      data: res.value as T[],
    };
  }

  if (isRecord(res.data)) {
    const nested = res.data;
    if (Array.isArray(nested.data)) {
      return {
        total_count:
          pickTotal(
            nested.total_count,
            res.total_count,
            paginationCount(nested.meta),
            paginationCount(res.meta),
            nested.count,
            res.count,
            nested.data.length,
          )
          ?? nested.data.length,
        data: nested.data as T[],
      };
    }
    if (Array.isArray(nested.results)) {
      return {
        total_count:
          pickTotal(nested.total_count, res.total_count, nested.count, res.count, nested.results.length)
          ?? nested.results.length,
        data: nested.results as T[],
      };
    }
    if (Array.isArray(nested.value)) {
      return {
        total_count:
          pickTotal(nested.total_count, res.total_count, nested.count, res.count, nested.value.length)
          ?? nested.value.length,
        data: nested.value as T[],
      };
    }
  }

  if (Array.isArray(res.results)) {
    return {
      total_count:
        pickTotal(res.total_count, paginationCount(res.meta), res.count, res.results.length)
        ?? res.results.length,
      data: res.results as T[],
    };
  }

  return { total_count: 0, data: [] };
}

export function normalizeRefList<T>(res: unknown): T[] {
  if (Array.isArray(res)) {
    return res as T[];
  }

  if (!isRecord(res)) {
    return [];
  }

  if (Array.isArray(res.data)) {
    return res.data as T[];
  }

  if (Array.isArray(res.results)) {
    return res.results as T[];
  }

  if (Array.isArray(res.value)) {
    return res.value as T[];
  }

  if (isRecord(res.data)) {
    const nested = res.data;
    if (Array.isArray(nested.data)) return nested.data as T[];
    if (Array.isArray(nested.results)) return nested.results as T[];
    if (Array.isArray(nested.value)) return nested.value as T[];
  }

  return [];
}
