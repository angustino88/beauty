const CSRF_STORAGE_KEY = 'lm:csrf_token';

/** Retrieves the current CSRF token from sessionStorage or document cookie. */
export function getCsrfToken(): string | null {
  try {
    const stored = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (stored) return stored;

    if (typeof document !== 'undefined' && document.cookie) {
      const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
  } catch {
    // Storage or cookie access may be restricted.
  }
  return null;
}

/** Stores or clears the CSRF token in sessionStorage. */
export function setCsrfToken(token: string | null | undefined): void {
  try {
    if (token) {
      sessionStorage.setItem(CSRF_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(CSRF_STORAGE_KEY);
    }
  } catch {
    // Storage access may be restricted.
  }
}

export function clearCsrfToken(): void {
  setCsrfToken(null);
}