import { authActions } from '../authSlice';
import { sessionFlag } from './sessionFlag';
import { getRefreshCsrfToken } from '@/shared/lib/refreshCsrf';

export type AuthBootstrapStatus = 'loading' | 'authenticated' | 'unauthenticated';

type DispatchLike = (action: { type: string; payload?: unknown }) => void;

let bootstrapPromise: Promise<AuthBootstrapStatus> | null = null;
let bootstrapResult: AuthBootstrapStatus | null = null;

function readAccessToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = (payload as { data?: { access?: string } }).data;
  if (data && typeof data.access === 'string') {
    return data.access;
  }
  return null;
}

export function resetBootstrapAuthState(): void {
  bootstrapPromise = null;
  bootstrapResult = null;
}

export async function bootstrapAuth(dispatch: DispatchLike): Promise<AuthBootstrapStatus> {
  if (bootstrapResult) return bootstrapResult;
  if (bootstrapPromise) return bootstrapPromise;

  dispatch(authActions.setBootstrapStatus('loading'));

  if (!sessionFlag.exists()) {
    dispatch(authActions.logout());
    bootstrapResult = 'unauthenticated';
    return bootstrapResult;
  }

  bootstrapPromise = getRefreshCsrfToken()
    .then((csrfToken) => fetch(`${import.meta.env.VITE_API_URL as string}/api/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
      body: '{}',
    }))
    .then(async (response) => {
      if (!response.ok) {
        dispatch(authActions.logout());  
        bootstrapResult = 'unauthenticated';
        return bootstrapResult;
      }

      const payload = await response.json().catch(() => ({}));
      const accessToken = readAccessToken(payload);
      if (!accessToken) {
        dispatch(authActions.logout());
        bootstrapResult = 'unauthenticated';
        return bootstrapResult;
      }

      dispatch(authActions.setAccessToken(accessToken));  
      bootstrapResult = 'authenticated';
      return bootstrapResult;
    })
    .catch(() => {
      dispatch(authActions.logout());
      bootstrapResult = 'unauthenticated';
      return bootstrapResult;
    })
    .finally(() => {
      bootstrapPromise = null;
    });

  return bootstrapPromise;
}