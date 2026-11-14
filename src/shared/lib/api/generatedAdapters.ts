export function unwrapGeneratedData<T>(response: unknown): T | undefined {
  if (response === undefined || response === null) return undefined;
  if (typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export function withGeneratedData<Result extends object, Data>(
  result: Result,
  data: Data,
): Result & {
  data: Data;
  currentData?: Data;
  isUninitialized: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: unknown;
} {
  return { ...result, data } as Result & {
    data: Data;
    currentData?: Data;
    isUninitialized: boolean;
    isLoading: boolean;
    isFetching: boolean;
    isSuccess: boolean;
    isError: boolean;
    error?: unknown;
  };
}
