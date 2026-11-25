import { getCsrfToken, setCsrfToken } from './csrf.ts';
import { getApiBaseUrl, joinUrl } from './backendTarget.ts';

/** Refresh requests require a CSRF token even after session storage is cleared. */
export async function getRefreshCsrfToken(apiOrigin: string = getApiBaseUrl()): Promise<string> {
  const existing = getCsrfToken();
  if (existing) return existing;

  const response = await fetch(joinUrl(apiOrigin, '/api/csrf-token'), {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Unable to obtain a CSRF token');

  const payload: unknown = await response.json();
  const token = (payload as { data?: { csrf_token?: string } })?.data?.csrf_token;
  if (!token) throw new Error('CSRF response missing token');
  setCsrfToken(token);
  return token;
}