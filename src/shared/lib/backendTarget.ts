/**
 * Where the frontend sends its API, WebSocket and refresh-token requests.
 *
 * `VITE_API_MODE` switches between the two deployments:
 *
 * - `direct` (default): one backend at `VITE_API_URL`. Single-department deployment, no Router.
 * - `router`: several department backends behind the LabMango Router at `VITE_ROUTER_URL`. After Microsoft
 *   sign-in the frontend asks the Router which backend owns the user
 *   (`POST {VITE_ROUTER_URL}/routing/resolve/user`) and then talks to that backend through
 *   the Router's prefix: `{VITE_ROUTER_URL}/t/<prefix_key>/api/...`. The choice is remembered in
 *   localStorage so a reload (or a new tab) reaches the same backend, and it is cleared on sign-out.
 *
 * Everything that builds a backend URL goes through {@link getApiBaseUrl} / {@link getWsBaseUrl}.
 */

export type ApiMode = 'direct' | 'router';

/** The backend the Router resolved for the signed-in user. */
export interface RoutedBackend {
  /** The backend's logical id (`BACKEND_ID`). */
  backendId: string;
  /** Display name of the backend. */
  name: string;
  /** Path prefix on the Router, `/t/<prefix_key>`. */
  prefix: string;
}

export interface BackendTargetConfig {
  mode: ApiMode;
  /** Backend origin in direct mode (`VITE_API_URL`). */
  apiUrl: string;
  /** Router origin in router mode (`VITE_ROUTER_URL`). */
  routerUrl: string;
}

const STORAGE_KEY = 'labmango.routedBackend';

type Env = Record<string, string | boolean | undefined>;

/** `import.meta.env` in the browser bundle; empty under the Node test runner. */
function viteEnv(): Env {
  return ((import.meta as unknown as { env?: Env }).env ?? {}) as Env;
}

const trimSlash = (url: string): string => url.trim().replace(/\/+$/, '');

export function resolveApiMode(raw: unknown): ApiMode {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return value === 'router' ? 'router' : 'direct';
}

/** Origin of the page; used when the frontend is served behind its own nginx that proxies the API. */
function pageOrigin(): string {
  return typeof window === 'undefined' ? '' : window.location.origin;
}

/**
 * Empty `VITE_API_URL` / `VITE_ROUTER_URL` mean "same origin": the frontend's nginx proxies `/api/`, `/ws/`
 * (direct mode) or `/routing/`, `/t/` (router mode), so no CORS is involved.
 */
export function readConfig(env: Env = viteEnv(), origin: string = pageOrigin()): BackendTargetConfig {
  const str = (name: string): string => (typeof env[name] === 'string' ? (env[name] as string) : '');
  const mode = resolveApiMode(env.VITE_API_MODE);
  return {
    mode,
    apiUrl: trimSlash(str('VITE_API_URL') || origin),
    routerUrl: trimSlash(str('VITE_ROUTER_URL') || origin),
  };
}

/** `base` + `path` with exactly one slash between them. */
export function joinUrl(base: string, path: string): string {
  if (!path) return base;
  return `${trimSlash(base)}/${path.replace(/^\/+/, '')}`;
}

/** A prefix the Router may return: `/t/<prefix_key>` only (never a host, never `..`). */
export function isSafePrefix(prefix: unknown): prefix is string {
  return typeof prefix === 'string' && /^\/t\/[A-Za-z0-9_-]{1,100}$/.test(prefix);
}

// ------------------------------------------------------------------ selected backend (router mode)

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function getSelectedBackend(): RoutedBackend | null {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RoutedBackend>;
    if (!isSafePrefix(parsed.prefix)) return null;
    return { backendId: String(parsed.backendId ?? ''), name: String(parsed.name ?? ''), prefix: parsed.prefix };
  } catch {
    return null;
  }
}

export function setSelectedBackend(backend: RoutedBackend): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(backend));
  } catch {
    // Storage may be unavailable (private mode); the session then lasts until the next reload.
  }
  memorySelection = backend;
}

export function clearSelectedBackend(): void {
  memorySelection = null;
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Fallback when localStorage cannot be written. */
let memorySelection: RoutedBackend | null = null;

// ------------------------------------------------------------------ base URLs

/** Base URL for a given config and selection (pure; see {@link getApiBaseUrl}). */
export function apiBaseUrlFor(config: BackendTargetConfig, selected: RoutedBackend | null): string {
  if (config.mode === 'direct') return config.apiUrl;
  return selected ? joinUrl(config.routerUrl, selected.prefix) : config.routerUrl;
}

export function isRouterMode(): boolean {
  return readConfig().mode === 'router';
}

/** True when API calls can be made: always in direct mode, after the Router resolved a backend in router mode. */
export function hasBackendTarget(): boolean {
  return !isRouterMode() || (getSelectedBackend() ?? memorySelection) !== null;
}

/** Base of every backend request: `VITE_API_URL`, or `VITE_ROUTER_URL/t/<prefix_key>` in router mode. */
export function getApiBaseUrl(): string {
  return apiBaseUrlFor(readConfig(), getSelectedBackend() ?? memorySelection);
}

/** Same as {@link getApiBaseUrl} with `ws(s)://`. */
export function getWsBaseUrl(): string {
  return getApiBaseUrl().replace(/^http/, 'ws');
}

// ------------------------------------------------------------------ Router lookup

export class BackendRoutingError extends Error {
  readonly status: number | null;
  /** Error code of the Router (`not_routed`, `ambiguous_route`, `invalid_token`, ...), when it answered. */
  readonly code: string | null;
  constructor(message: string, status: number | null, code: string | null = null) {
    super(message);
    this.name = 'BackendRoutingError';
    this.status = status;
    this.code = code;
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** The `data` of a successful `POST /routing/resolve/user`, or `null` when it is not a usable route. */
export function parseRoute(data: unknown): RoutedBackend | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as { backend_id?: unknown; name?: unknown; prefix?: unknown };
  if (!isSafePrefix(d.prefix)) return null;
  return { backendId: String(d.backend_id ?? ''), name: String(d.name ?? ''), prefix: d.prefix };
}

/** Asks the Router which backend serves the user of `idToken` (the Microsoft ID token from MSAL). */
export async function resolveBackendForIdToken(
  idToken: string,
  options: { routerUrl?: string; fetchImpl?: FetchLike } = {},
): Promise<RoutedBackend> {
  const routerUrl = options.routerUrl ?? readConfig().routerUrl;
  const fetchImpl: FetchLike = options.fetchImpl ?? ((input, init) => fetch(input, init));
  if (!routerUrl) {
    throw new BackendRoutingError('VITE_ROUTER_URL is not configured.', null);
  }
  let response: Response;
  try {
    response = await fetchImpl(joinUrl(routerUrl, '/routing/resolve/user'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });
  } catch {
    throw new BackendRoutingError('The LabMango router is unreachable. Check your connection and try again.', null);
  }
  const body = (await response.json().catch(() => null)) as
    | { data?: unknown; error?: { code?: unknown; message?: unknown } }
    | null;
  if (response.ok) {
    const route = parseRoute(body?.data);
    if (route) return route;
    throw new BackendRoutingError('The router returned no usable backend.', response.status);
  }
  const code = typeof body?.error?.code === 'string' ? body.error.code : null;
  const message = typeof body?.error?.message === 'string' ? body.error.message : null;
  if (code === 'not_routed') {
    throw new BackendRoutingError(
      'Your account is not assigned to a lab yet. Please contact your lab administrator.',
      response.status,
      code,
    );
  }
  if (code === 'ambiguous_route') {
    throw new BackendRoutingError(
      'Your account is assigned to more than one lab. Please contact your lab administrator.',
      response.status,
      code,
    );
  }
  if (code === 'invalid_token') {
    throw new BackendRoutingError('Microsoft sign-in could not be verified. Please try again.', response.status, code);
  }
  throw new BackendRoutingError(
    message ?? `The router answered with an error (${response.status}).`,
    response.status,
    code,
  );
}
