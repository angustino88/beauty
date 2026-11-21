export function resolveUserDisplayName(
  backendDisplayName: string | null | undefined,
  username: string | null | undefined,
  msalAccountName?: string | null,
): string {
  const cleanUsername = (username ?? '').trim().toLowerCase();
  const cleanBackend = (backendDisplayName ?? '').trim();
  if (cleanBackend && cleanBackend.toLowerCase() !== cleanUsername) {
    return cleanBackend;
  }

  const cleanMsal = (msalAccountName ?? '').trim();
  if (cleanMsal && cleanMsal.toLowerCase() !== cleanUsername) {
    return cleanMsal;
  }

  return cleanBackend || cleanMsal || '';
}
