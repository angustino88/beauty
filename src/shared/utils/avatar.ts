import { getApiBaseUrl, joinUrl } from '../lib/backendTarget';

export function getBotttsAvatarUrl(username: string): string {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;
}

export function normalizeAvatarUrl(url?: string | null): string | null {
  if (typeof url !== 'string') return null;
  const t = url.trim();
  if (!t) return null;
  // If it's already an absolute http(s) URL, normalize and return
  if (/^https?:\/\//i.test(t)) {
    // Preserve http for localhost/dev
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(t)) return t;
    return t.replace(/^http:\/\//i, 'https://');
  }

  // Treat as relative or absolute path returned by backend (e.g., /media/avatars/x.png or media/avatars/x.png)
  try {
    // The base can carry a path (router mode: https://router/t/<prefix_key>), so join instead of resolving
    // "/media/..." against the origin.
    const base = getApiBaseUrl() || window.location.origin;
    const resolved = new URL(joinUrl(base, t)).toString();
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(resolved)) return resolved;
    return resolved.replace(/^http:\/\//i, 'https://');
  } catch {
    return null;
  }
}

/**
 * Returns a safe avatar URL.
 * - If `avatarUrl` is a valid http/https URL, normalizes it to https.
 * - Otherwise falls back to DiceBear Bottts using `username` as seed.
 */
export function  getAvatarUrl(avatarUrl?: string | null, username?: string | null): string | null {
  const normalized = normalizeAvatarUrl(avatarUrl);
  if (normalized) return normalized;

  if (typeof username !== 'string') return null;
  const seed = username.trim();
  return seed ? getBotttsAvatarUrl(seed) : null;
}
