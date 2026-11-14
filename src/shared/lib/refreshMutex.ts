let refreshPromise: Promise<string | null> | null = null;

export async function refreshOnce(refreshFn: () => Promise<string | null>): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = refreshFn().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}
