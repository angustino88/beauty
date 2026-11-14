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

// Mid-tone hues that carry white initials in both themes.
const AVATAR_COLORS = [
  '#6d3fd6', '#0e7f99', '#1f8a52', '#b3611a', '#b0396b',
  '#3f6bc4', '#7a5a9e', '#5e6b7d', '#8a6d1f', '#a8463c',
];

function colorForUsername(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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
  const color = useMemo(() => colorForUsername(username), [username]);
  const { data: avatarSrc } = useGetAvatarByUsernameQuery(username, { skip: !username });

  return (
    <Tooltip title={displayname || username}>
      <Avatar
        size={32}
        src={avatarSrc ?? undefined}
        style={{
          backgroundColor: avatarSrc ? 'var(--lm-surface-muted)' : color,
          color: '#ffffff',
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
