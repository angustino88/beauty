import { Avatar, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
import { baseApi } from '@/shared/lib/api';
import type { UsersRetrieveApiResponse } from '@/shared/api/generated/api';
import { getAvatarUrl } from '@/shared/utils/avatar';

interface AvatarRendererProps {
  username: string;
  displayname?: string;
}

function getInitials(displayname?: string, username?: string): string {
  const name = displayname || username || '';
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

// Tinted pairs from the theme tokens, so initials stay legible in both themes.
const AVATAR_TONES = ['primary', 'info', 'success', 'warning', 'reserved', 'danger', 'neutral'] as const;

function toneForUsername(username: string): (typeof AVATAR_TONES)[number] {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

const avatarLookupApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAvatarByUsername: build.query<string | null, string>({
      query: (username) => ({ url: '/api/users', params: { username } }),
      transformResponse: (response: UsersRetrieveApiResponse, _meta, username) => {
        const list = Array.isArray(response?.data) ? response.data : [];
        const user = list.find((item) => item?.username === username);
        return getAvatarUrl(user?.avatar_url ?? null, username);
      },
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: false,
});

const { useGetAvatarByUsernameQuery } = avatarLookupApi;

export function AvatarRenderer({ username, displayname }: AvatarRendererProps) {
  const initials = useMemo(() => getInitials(displayname, username), [displayname, username]);
  const tone = useMemo(() => toneForUsername(username), [username]);
  const { data: avatarSrc } = useGetAvatarByUsernameQuery(username, { skip: !username });

  return (
    <Tooltip title={displayname || username}>
      <Avatar
        size={32}
        src={avatarSrc ?? undefined}
        style={{
          backgroundColor: avatarSrc ? 'var(--lm-surface-muted)' : `var(--lm-${tone}-bg)`,
          color: `var(--lm-${tone}-fg)`,
          border: `1px solid var(--lm-${tone}-border)`,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          cursor: 'default',
          verticalAlign: 'middle',
        }}
        icon={!initials && !avatarSrc ? <UserOutlined /> : undefined}
      >
        {!avatarSrc ? initials : null}
      </Avatar>
    </Tooltip>
  );
}
