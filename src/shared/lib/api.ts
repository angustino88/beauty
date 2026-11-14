import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { refreshOnce } from './refreshMutex';
import { getCsrfToken } from './csrf';
import { getRefreshCsrfToken } from './refreshCsrf';

// Minimal state shape needed for auth header injection.
// Avoids circular dep with store.ts (which imports this file).
type ApiAuthState = {
  auth: {
    accessToken: string | null;
    isLoggedIn: boolean;
    bootstrapStatus: 'loading' | 'authenticated' | 'unauthenticated';
  };
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL as string,
  credentials: 'include', // sends HttpOnly REFRESH_TOKEN_COOKIE_NAME automatically
  timeout: 30000, // 30 seconds timeout to prevent hanging requests
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as ApiAuthState).auth?.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const csrfToken = getCsrfToken();
    if (csrfToken) headers.set('X-CSRFToken', csrfToken);
    return headers;
  },
});

type RefreshResponsePayload = {
  access?: string;
  access_token?: string;
  data?: {
    access?: string;
    access_token?: string;
  };
};

const readAccessToken = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as RefreshResponsePayload;
  return data.access ?? data.access_token ?? data.data?.access ?? data.data?.access_token ?? null;
};

type DispatchLike = (action: { type: string; payload?: string }) => void;

export async function attemptRefreshAccessToken(
  dispatch: DispatchLike,
  getState?: () => ApiAuthState,
): Promise<string | null> {
  return refreshOnce(async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      headers['X-CSRFToken'] = await getRefreshCsrfToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL as string}/api/refresh-token`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: '{}',
      });

      if (!response.ok) {
        const currentToken = getState?.().auth.accessToken
        if(!currentToken) {
        dispatch({ type: 'auth/logout' });
        }
        return currentToken ?? null;
      }

      const payload = await response.json().catch(() => ({}));
      const token = readAccessToken(payload);
      if (!token) {
        dispatch({ type: 'auth/logout' });
        return null;
      }

      dispatch({ type: 'auth/setAccessToken', payload: token });
      return token;
    } catch {
      dispatch({ type: 'auth/logout' });
      return null;
    }
  });
}

/**
 * Wraps rawBaseQuery with automatic token refresh on 401.
 * - Calls POST /api/refresh-token (HttpOnly cookie sent by browser)
 * - On success: stores new access token and retries original request
 * - On failure: dispatches logout action
 * - Mutex ensures only ONE refresh call fires at a time
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const authState = (api.getState() as ApiAuthState).auth;
    const canAttemptRefresh = authState.isLoggedIn && authState.bootstrapStatus === 'authenticated';

    if(!canAttemptRefresh) return result; // Don't attempt refresh if user isn't logged in or bootstrap not done


    const token = await attemptRefreshAccessToken(
      api.dispatch as DispatchLike,
      api.getState as () => ApiAuthState,
    );

    if (token) {
      result = await rawBaseQuery(args, api, extraOptions);
      if (result.error?.status === 401) {
        api.dispatch({ type: 'auth/logout' });
      }
    } 
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // Keep cached data for 5 minutes after last subscriber unmounts.
  // Prevents "empty table" flash when user switches tabs and returns.
  keepUnusedDataFor: 300,
  tagTypes: [
    // Auth
    'Me',
    // Equipment
    'Equipment',
    'ResourceMapping', 'Bench', 'Station',
    'Computer', 'Monitor', 'Accessory', 'NetworkInterface',
    'PowerSupply', 'DebugHardware', 'License', 'Sample', 'Rack', 'Room',
    'EquipmentSelectList', 'ChangeLog',
    // Lab management
    'LabInfo', 'LabEquipment', 'LabDevice', 'DashboardStats',
    // Booking
    'Booking', 'LabProject',
    // Downtime & Resource Status
    'Downtime',
    // Monitoring
    'Monitoring',
    // Leaderboard
    'Leaderboard',
    // Jira support & Support desk
    'JiraIssue',
    'SupportTicket',
    // Analytics
    'Analytics',
    // Procurement & Finance
    'Purchase',
    'Expense',
    'FinanceReport',
  ],
  endpoints: () => ({}),
});
