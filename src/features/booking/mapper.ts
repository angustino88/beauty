import type {
  BenchBookingItem,
  IBenchBookingListParams,
  IBenchOption,
  IProjectOption,
} from './types';

export type BenchBookingCreateRequest = {
  bench_id: number;
  starts_at: string;
  ends_at: string;
  reason: string;
  project_id: number;
  status?: string;
  approval_status?: string;
  [key: string]: unknown;
};

export type BenchBookingUpdateRequest = Partial<BenchBookingCreateRequest>;

function normalizeListResponse<T>(res: unknown): { total_count: number; data: T[] } {
  if (Array.isArray(res)) {
    return { total_count: res.length, data: res as T[] };
  }
  if (!res || typeof res !== 'object') {
    return { total_count: 0, data: [] };
  }
  const obj = res as Record<string, unknown>;
  const meta = obj.meta as Record<string, unknown> | undefined;
  const pagination = meta?.pagination as Record<string, unknown> | undefined;

  let list: T[] = [];
  if (Array.isArray(obj.data)) {
    list = obj.data as T[];
  } else if (Array.isArray(obj.results)) {
    list = obj.results as T[];
  }

  const total =
    typeof pagination?.count === 'number'
      ? pagination.count
      : typeof obj.total_count === 'number'
        ? obj.total_count
        : typeof obj.count === 'number'
          ? obj.count
          : list.length;

  return { total_count: total, data: list };
}

export function mapBookingItem(raw: unknown): BenchBookingItem {
  const item = (raw as Record<string, unknown>) ?? {};
  const bench = (item.bench as Record<string, unknown>) ?? null;
  const project = (item.project as Record<string, unknown>) ?? null;

  const statusObj = item.status as Record<string, unknown> | string | null;
  const statusStr =
    typeof statusObj === 'object' && statusObj !== null
      ? ((statusObj.value ?? statusObj.label) as string)
      : (statusObj as string) ?? '';

  const approvalObj = item.approval_status as Record<string, unknown> | string | null;
  const approvalStr =
    typeof approvalObj === 'object' && approvalObj !== null
      ? ((approvalObj.value ?? approvalObj.label) as string)
      : (approvalObj as string) ?? '';

  const startsAt = (item.starts_at || '') as string;
  const endsAt = (item.ends_at || '') as string;

  const benchName = (bench?.name || '') as string;
  const benchId = (bench?.id || 0) as number;
  const benchUid = (bench?.uid as string) || undefined;
  const benchSku = (bench?.sku as string | null) || undefined;

  const projectName = (project?.name || '') as string;
  const projectId = (project?.id || 0) as number;

  const reasonText = (item.reason || '') as string;

  const rawCreator =
    item.creator ??
    item.created_by ??
    item.user ??
    item.booked_by ??
    item.owner ??
    item.creator_name;

  let normalizedCreator: BenchBookingItem['creator'] = null;
  if (typeof rawCreator === 'string' && rawCreator.trim().length > 0) {
    const trimmed = rawCreator.trim();
    normalizedCreator = {
      id: typeof item.creator_id === 'number' ? item.creator_id : 0,
      username: trimmed,
      display_name: trimmed,
    };
  } else if (rawCreator && typeof rawCreator === 'object') {
    const cObj = rawCreator as Record<string, unknown>;
    const username = ((cObj.username || cObj.name || cObj.email || '') as string).trim();
    const displayName = (
      (cObj.display_name || cObj.displayName || cObj.full_name || username) as string
    ).trim();
    const id =
      typeof cObj.id === 'number'
        ? cObj.id
        : typeof item.creator_id === 'number'
          ? item.creator_id
          : 0;
    if (username || displayName) {
      normalizedCreator = {
        id,
        username: username || displayName,
        display_name: displayName || username,
      };
    }
  } else if (typeof item.creator_id === 'number') {
    normalizedCreator = {
      id: item.creator_id,
      username: `User #${item.creator_id}`,
      display_name: `User #${item.creator_id}`,
    };
  }

  const rawApprovalBy = item.approval_by ?? item.approved_by;
  let normalizedApprovalBy: BenchBookingItem['approval_by'] = null;
  if (typeof rawApprovalBy === 'string' && rawApprovalBy.trim().length > 0) {
    const trimmed = rawApprovalBy.trim();
    normalizedApprovalBy = { username: trimmed, display_name: trimmed };
  } else if (rawApprovalBy && typeof rawApprovalBy === 'object') {
    const aObj = rawApprovalBy as Record<string, unknown>;
    const username = ((aObj.username || aObj.name || '') as string).trim();
    const displayName = ((aObj.display_name || aObj.displayName || username) as string).trim();
    if (username || displayName) {
      normalizedApprovalBy = {
        id: typeof aObj.id === 'number' ? aObj.id : undefined,
        username: username || displayName,
        display_name: displayName || username,
      };
    }
  }

  return {
    id: (item.id as number) ?? 0,
    booking_code: (item.booking_code as string) ?? '',
    bench: bench || benchName
      ? { id: benchId, uid: benchUid, sku: benchSku, name: benchName }
      : null,
    starts_at: startsAt,
    ends_at: endsAt,
    status: statusStr,
    approval_status: approvalStr,
    creator: normalizedCreator,
    approval_by: normalizedApprovalBy,
    project: project || projectName ? { id: projectId, name: projectName } : null,
    reason: reasonText,
    computer: item.computer as BenchBookingItem['computer'],
    created_at: (item.created_at || '') as string,
    updated_at: (item.updated_at || '') as string,
  };
}

export function mapBookingListResponse(
  response: unknown,
): { total_count: number; data: BenchBookingItem[] } {
  const norm = normalizeListResponse<unknown>(response);
  return {
    total_count: norm.total_count,
    data: norm.data.map(mapBookingItem),
  };
}

function unwrapBookingItem(response: unknown, operation: string): BenchBookingItem {
  if (!response || typeof response !== 'object') {
    throw new Error(`${operation} returned an empty response`);
  }
  const obj = response as Record<string, unknown>;
  const data = obj.data ?? obj;
  return mapBookingItem(data);
}

export const mapBookingDetailResponse = (response: unknown) =>
  unwrapBookingItem(response, 'getBenchBookingById');

export const mapBookingCreateResponse = (response: unknown) =>
  unwrapBookingItem(response, 'createBenchBooking');

export const mapBookingUpdateResponse = (response: unknown) =>
  unwrapBookingItem(response, 'updateBenchBooking');

/**
 * The API reads a date or a zone-less date-time in the server's time zone, which differs from the
 * browser's, so a calendar week would lose bookings near its edges. Send an absolute instant instead.
 */
export function toBookingInstant(value: string): string {
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value.trim()) && value.includes('T')) return value;
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

export function buildBookingListQuery(params: IBenchBookingListParams): string {
  const {
    filterParams,
    bench_id,
    sorts,
    orders,
    creator,
    project_id,
    starts_at,
    ends_at,
    starts_at_after,
    starts_at_before,
    ...rest
  } = params;
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(rest)) {
    if (value == null) continue;
    const resolvedKey = key === 'project' ? 'project_id' : key === 'search' ? 'q' : key;
    if (Array.isArray(value)) {
      if (value.length > 0) searchParams.append(resolvedKey, value.join(','));
    } else {
      searchParams.append(resolvedKey, String(value));
    }
  }

  if (creator) {
    searchParams.append('creator', creator);
  }

  if (project_id != null && !searchParams.has('project_id')) {
    searchParams.append('project_id', String(project_id));
  }

  const effectiveStartsAtAfter = starts_at_after ?? starts_at;
  if (effectiveStartsAtAfter) {
    searchParams.append('starts_at_after', toBookingInstant(effectiveStartsAtAfter));
  }

  const effectiveStartsAtBefore = starts_at_before ?? ends_at;
  if (effectiveStartsAtBefore) {
    searchParams.append('starts_at_before', toBookingInstant(effectiveStartsAtBefore));
  }

  if (sorts?.length) {
    searchParams.set('ordering', sorts
      .map((field, index) => orders?.[index] === 'desc' ? `-${field}` : field)
      .join(','));
  }
  if (filterParams) {
    for (const [key, values] of Object.entries(filterParams)) {
      if (key === 'creator') continue;
      let resolvedKey = key === 'project' ? 'project_id' : key;
      if (resolvedKey === 'starts_at') resolvedKey = 'starts_at_after';
      if (resolvedKey === 'ends_at') resolvedKey = 'starts_at_before';
      // The API takes one value per filter and rejects repeated params, so only the first is sent.
      if (values?.length) {
        const value = String(values[0]);
        const isInstantFilter = resolvedKey === 'starts_at_after' || resolvedKey === 'starts_at_before';
        searchParams.append(resolvedKey, isInstantFilter ? toBookingInstant(value) : value);
      }
    }
  }
  if (bench_id?.length) searchParams.append('bench_id', String(bench_id[0]));

  return searchParams.toString();
}

export function mapProjectOptions(response: unknown): IProjectOption[] {
  const norm = normalizeListResponse<Record<string, unknown>>(response);
  return norm.data
    .map((project) => ({
      label: (project.name ?? '') as string,
      value: (project.id as number) ?? 0,
      code: (project.code as string) || null,
    }))
    .filter((project) => project.label.trim().length > 0)
    .sort((first, second) => first.label.localeCompare(second.label));
}

export function mapBenchOptions(response: unknown): IBenchOption[] {
  const norm = normalizeListResponse<Record<string, unknown>>(response);
  const options: IBenchOption[] = [];
  for (const bench of norm.data) {
    const value = bench.id as number;
    const label = (bench.name ?? '') as string;
    const sku = (bench.sku as string) || null;

    if (typeof value === 'number' && typeof label === 'string' && label.trim().length > 0) {
      options.push({ value, label, sku });
    }
  }
  return options.sort((first, second) => first.label.localeCompare(second.label));
}
