const LOGIN_NONCE_SECRET_KEY = 'labmango.loginNonceSecret';
const LOGIN_ID_TOKEN_KEY = 'labmango.loginIdToken';

function base64url(bytes: Uint8Array): string {
  let text = '';
  bytes.forEach((byte) => { text += String.fromCharCode(byte); });
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Only the hash is shared with Microsoft; the secret remains in this tab. */
export async function createLoginNonce(): Promise<string> {
  const secret = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  const nonce = base64url(new Uint8Array(digest));
  sessionStorage.setItem(LOGIN_NONCE_SECRET_KEY, secret);
  return nonce;
}

export function hasLoginNonceSecret(): boolean {
  return sessionStorage.getItem(LOGIN_NONCE_SECRET_KEY) !== null;
}

export function storeRedirectIdToken(idToken: string): void {
  if (hasLoginNonceSecret()) sessionStorage.setItem(LOGIN_ID_TOKEN_KEY, idToken);
}

/** Consume both values before the one-time backend exchange. */
export function takeLoginCredentials(): { idToken: string; nonceSecret: string } | null {
  const nonceSecret = sessionStorage.getItem(LOGIN_NONCE_SECRET_KEY);
  const idToken = sessionStorage.getItem(LOGIN_ID_TOKEN_KEY);
  clearLoginCredentials();
  return nonceSecret && idToken ? { idToken, nonceSecret } : null;
}

export function clearLoginCredentials(): void {
  sessionStorage.removeItem(LOGIN_NONCE_SECRET_KEY);
  sessionStorage.removeItem(LOGIN_ID_TOKEN_KEY);
}