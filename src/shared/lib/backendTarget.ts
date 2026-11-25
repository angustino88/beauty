/**
 * Where the frontend sends its API, WebSocket and refresh-token requests.
 *
 * `VITE_API_MODE` switches between the two deployments:
 *
 * - `direct` (default): one backend at `VITE_API_URL`. Single-department deployment, no Router.
 * - `router`: several department backends behind the LabMango Router at `VITE_ROUTER_URL`. After Microsoft
 *   sign-in the frontend asks the Router which backend owns the user
 *   (`POST {VITE_ROUTER_URL}/routing/auth/backend-info/by-id-token/`) and then talks to that backend through
 *   the Router's prefix: `{VITE_ROUTER_URL}/t/<prefix_key>/api/...`. The choice is remembered in
 *   localStorage so a reload (or a new tab) reaches the same backend, and it is cleared on sign-out.
 *
 * Everything that builds a backend URL goes through {@link getApiBaseUrl} / {@link getWsBaseUrl}.
 */

export type ApiMode = 'direct' | 'router';

/** One backend the Router returned for the signed-in user. */
export interface RoutedBackend {
  backendName: string;
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

export function readConfig(env: Env = viteEnv()): BackendTargetConfig {
  const str = (name: string): string => (typeof env[name] === 'string' ? (env[name] as string) : '');
  const mode = resolveApiMode(env.VITE_API_MODE);
  return {
    mode,
    apiUrl: trimSlash(str('VITE_API_URL')),
    // In router mode the Router URL falls back to VITE_API_URL, so an existing .env only needs VITE_API_MODE.
    routerUrl: trimSlash(str('VITE_ROUTER_URL') || str('VITE_API_URL')),
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
    return { backendName: String(parsed.backendName ?? ''), prefix: parsed.prefix };
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
  constructor(message: string, status: number | null) {
    super(message);
    this.name = 'BackendRoutingError';
    this.status = status;
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Picks the backend for a Router answer: the previously used one when it is still offered, else the first.
 * (The Router returns one backend unless it runs with ROUTING_CONFLICT_POLICY=all.)
 */
export function chooseBackend(mappings: unknown, previous: RoutedBackend | null): RoutedBackend | null {
  if (!Array.isArray(mappings)) return null;
  const valid: RoutedBackend[] = mappings
    .filter((m): m is { backend_name?: unknown; prefix: string } => !!m && isSafePrefix((m as { prefix?: unknown }).prefix))
    .map((m) => ({ backendName: String(m.backend_name ?? ''), prefix: m.prefix }));
  if (!valid.length) return null;
  return valid.find((m) => previous && m.prefix === previous.prefix) ?? valid[0];
}

/** Asks the Router which backend serves the user of `idToken` (the Microsoft ID token from MSAL). */
export async function resolveBackendForIdToken(
  idToken: string,
  options: { routerUrl?: string; fetchImpl?: FetchLike; previous?: RoutedBackend | null } = {},
): Promise<RoutedBackend> {
  const routerUrl = options.routerUrl ?? readConfig().routerUrl;
  const fetchImpl: FetchLike = options.fetchImpl ?? ((input, init) => fetch(input, init));
  if (!routerUrl) {
    throw new BackendRoutingError('VITE_ROUTER_URL is not configured.', null);
  }
  let response: Response;
  try {
    response = await fetchImpl(joinUrl(routerUrl, '/routing/auth/backend-info/by-id-token/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });
  } catch {
    throw new BackendRoutingError('The LabMango router is unreachable. Check your connection and try again.', null);
  }
  const body = (await response.json().catch(() => null)) as { detail?: unknown; mappings?: unknown } | null;
  const detail = typeof body?.detail === 'string' ? body.detail : null;
  if (response.ok) {
    const chosen = chooseBackend(body?.mappings, options.previous ?? getSelectedBackend());
    if (chosen) return chosen;
    throw new BackendRoutingError('The router returned no usable backend.', response.status);
  }
  if (response.status === 404) {
    throw new BackendRoutingError(
      'Your account is not assigned to a lab yet. Please contact your lab administrator.',
      404,
    );
  }
  if (response.status === 409) {
    throw new BackendRoutingError(
      detail ?? 'Your account is assigned to more than one lab. Please contact your lab administrator.',
      409,
    );
  }
  if (response.status === 400) {
    throw new BackendRoutingError(detail ?? 'Microsoft sign-in could not be verified. Please try again.', 400);
  }
  throw new BackendRoutingError(detail ?? `The router answered with an error (${response.status}).`, response.status);
}
