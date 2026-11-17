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
  /** Closed-select text: the username. */
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
 * Select option for choosing a person (owner, assignee): the list shows the username (the stable identifier the
 * backend uses) and hovering an option shows the display name (and email). Search still finds a person by display
 * name, username or email.
 */
export function toUserOption(user: UserOptionSource): UserSelectOption {
  const name = user.display_name?.trim();
  const username = user.username?.trim();
  const primary = username || name || String(user.id);
  const hover = [name && name !== primary ? name : null, user.email?.trim()].filter(Boolean).join(' · ');
  return {
    value: user.id,
    label: <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{primary}</span>,
    title: hover,
    selectedLabel: primary,
    searchText: [name, username, user.email].filter(Boolean).join(' ').toLowerCase(),
  };
}
