import type { ReactNode } from 'react';

export interface UserOptionSource {
  id: number;
  username?: string | null;
  display_name?: string | null;
  email?: string | null;
}

export interface UserSelectOption {
  value: number;
  label: ReactNode;
  title: string;
  /** Closed-select text: `Display Name (username)`. */
  selectedLabel: string;
  /** Everything a person might type: display name, username, email. Matched by `filterResourceOption`. */
  searchText: string;
}

/** `Display Name (username)`; just the one when they are the same or one is missing. */
export function userText(user: Pick<UserOptionSource, 'username' | 'display_name'>): string {
  const name = user.display_name?.trim();
  const username = user.username?.trim();
  if (name && username && name.toLowerCase() !== username.toLowerCase()) return `${name} (${username})`;
  return name || username || '';
}

/**
 * Select option for choosing a person (owner, assignee): the display name with the username under it, so two people
 * with the same name stay apart, and search finds a person by name, username or email.
 */
export function toUserOption(user: UserOptionSource): UserSelectOption {
  const name = user.display_name?.trim();
  const username = user.username?.trim();
  const primary = name || username || String(user.id);
  const secondary = [name && username && name.toLowerCase() !== username.toLowerCase() ? `@${username}` : null, user.email?.trim()]
    .filter(Boolean).join(' · ');
  const text = userText(user) || primary;
  return {
    value: user.id,
    label: (
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.3, padding: '2px 0' }}>
        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{primary}</span>
        {secondary && (
          <span style={{ color: 'var(--lm-text-secondary)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {secondary}
          </span>
        )}
      </span>
    ),
    title: '',
    selectedLabel: text,
    searchText: [name, username, user.email].filter(Boolean).join(' ').toLowerCase(),
  };
}
