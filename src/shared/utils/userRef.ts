export interface UserRef {
  id: number;
  username: string;
  display_name: string;
}

/** A user relation from the API (`{ id, username, display_name }`) or `null`. */
export function toUserRef(value: unknown): UserRef | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const id = Number(record.id);
  if (!Number.isFinite(id)) return null;
  const username = typeof record.username === 'string' ? record.username : '';
  const displayName = typeof record.display_name === 'string' ? record.display_name : '';
  return { id, username, display_name: displayName || username };
}

/** What to show for a user: the display name, then the username. */
export function userLabel(user: { display_name?: string | null; username?: string | null } | null | undefined): string {
  return user?.display_name?.trim() || user?.username?.trim() || '';
}
