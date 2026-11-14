import { Avatar, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getAvatarUrl } from '@/shared/utils/avatar';
import { toPercent } from '../../../formatters';
import type { RankedPersonaItem } from '../../../types';

const { Text } = Typography;

function getInitials(name: string): string {
  const clean = (name || '').trim();
  if (!clean) return '?';

  return clean
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const personaColumns: ColumnsType<RankedPersonaItem> = [
  {
    title: 'Rank',
    dataIndex: 'rank',
    key: 'rank',
    width: 70,
    align: 'center',
    sorter: (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
    render: (rank: number) => <Text strong style={{ color: 'var(--lm-text-tertiary)' }}>#{rank}</Text>,
  },
  {
    title: 'Avatar',
    dataIndex: 'avatar',
    key: 'avatar',
    width: 60,
    align: 'center',
    render: (avatar: string | null, record) => {
      const src = getAvatarUrl(avatar, record.username) ?? undefined;
      return src
        ? <Avatar size={36} src={src} />
        : (
          <Avatar
            size={36}
            style={{
              background: 'linear-gradient(135deg, var(--lm-primary) 0%, var(--lm-primary) 100%)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {getInitials(record.display_name || record.username)}
          </Avatar>
        );
    },
  },
  {
    title: 'Name',
    dataIndex: 'display_name',
    key: 'display_name',
    sorter: (a, b) =>
      (a.display_name || a.username || '').localeCompare(b.display_name || b.username || ''),
    render: (_name: string, record) => <Text>{record.display_name || record.username}</Text>,
  },
  {
    title: 'WFO',
    dataIndex: 'wfo_rate',
    key: 'wfo_rate',
    width: 80,
    align: 'center',
    sorter: (a, b) => (a.wfo_rate ?? 0) - (b.wfo_rate ?? 0),
    render: (v: number) => toPercent(v),
  },
  {
    title: 'WFH',
    dataIndex: 'wfh_rate',
    key: 'wfh_rate',
    width: 80,
    align: 'center',
    sorter: (a, b) => (a.wfh_rate ?? 0) - (b.wfh_rate ?? 0),
    render: (v: number) => toPercent(v),
  },
  {
    title: 'Work Late',
    dataIndex: 'late_rate',
    key: 'late_rate',
    width: 90,
    align: 'center',
    sorter: (a, b) => (a.late_rate ?? 0) - (b.late_rate ?? 0),
    render: (v: number) => toPercent(v),
  },
  {
    title: 'Compliance',
    dataIndex: 'booking_compliance',
    key: 'booking_compliance',
    width: 100,
    align: 'center',
    sorter: (a, b) => (a.booking_compliance ?? 0) - (b.booking_compliance ?? 0),
    render: (v: number) => toPercent(v),
  },
  {
    title: 'Efficiency',
    dataIndex: 'usage_efficiency',
    key: 'usage_efficiency',
    width: 120,
    align: 'center',
    sorter: (a, b) => (a.usage_efficiency ?? 0) - (b.usage_efficiency ?? 0),
    render: (v: number | undefined) => toPercent(v),
  },
  {
    title: 'Points',
    dataIndex: 'points',
    key: 'points',
    width: 90,
    align: 'center',
    sorter: (a, b) => (a.points ?? 0) - (b.points ?? 0),
    render: (pts: number) => <Text strong style={{ color: 'var(--lm-primary)' }}>{pts}</Text>,
  },
];
