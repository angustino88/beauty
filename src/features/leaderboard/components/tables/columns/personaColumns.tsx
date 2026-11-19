import { Avatar, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getAvatarUrl } from '@/shared/utils/avatar';
import { toPercent } from '../../../formatters';
import type { RankedPersonaItem } from '../../../types';
import { HeaderHint } from './HeaderHint';

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
    title: <HeaderHint label="RFO" hint="RFO rate (Remote from Office): sessions against two per weekday." />,
    dataIndex: 'wfo_rate',
    key: 'wfo_rate',
    width: 80,
    align: 'center',
    sorter: (a, b) => (a.wfo_rate ?? 0) - (b.wfo_rate ?? 0),
    render: (v: number) => toPercent(v),
  },
  {
    title: <HeaderHint label="RFH" hint="RFH rate (Remote from Home): 100% − RFO rate." />,
    dataIndex: 'wfh_rate',
    key: 'wfh_rate',
    width: 80,
    align: 'center',
    sorter: (a, b) => (a.wfh_rate ?? 0) - (b.wfh_rate ?? 0),
    render: (v: number) => toPercent(v),
  },
  {
    title: <HeaderHint label="Off-hours Usage" hint="Off-hours Usage Rate: share of session time between 20:00 and 06:00. Lower is better." />,
    dataIndex: 'late_rate',
    key: 'late_rate',
    width: 100,
    align: 'center',
    sorter: (a, b) => (a.late_rate ?? 0) - (b.late_rate ?? 0),
    render: (v: number) => toPercent(v),
  },
  {
    title: <HeaderHint label="Show-up Rate" hint="Show-up Rate: expected bookings with at least one session. A booking with no session is a no-show." />,
    dataIndex: 'booking_compliance',
    key: 'booking_compliance',
    width: 110,
    align: 'center',
    sorter: (a, b) => (a.booking_compliance ?? -1) - (b.booking_compliance ?? -1),
    render: (v: number | null) => toPercent(v),
  },
  {
    title: <HeaderHint label="Booking Utilization" hint="Booking Utilization Rate: time covered by the booking's sessions (all sessions merged) inside the slot, against booked time." />,
    dataIndex: 'booking_utilization',
    key: 'booking_utilization',
    width: 120,
    align: 'center',
    sorter: (a, b) => (a.booking_utilization ?? -1) - (b.booking_utilization ?? -1),
    render: (v: number | null) => toPercent(v),
  },
  {
    title: <HeaderHint label="Active Time Ratio" hint="Active Time Ratio: active time against session time." />,
    dataIndex: 'active_rate',
    key: 'active_rate',
    width: 90,
    align: 'center',
    sorter: (a, b) => (a.active_rate ?? -1) - (b.active_rate ?? -1),
    render: (v: number | null) => toPercent(v),
  },
  {
    title: <HeaderHint label="Early Release" hint="Early Release Rate: unused booked time after the last session that was released by completing the booking early." />,
    dataIndex: 'early_release_rate',
    key: 'early_release_rate',
    width: 120,
    align: 'center',
    sorter: (a, b) => (a.early_release_rate ?? -1) - (b.early_release_rate ?? -1),
    render: (v: number | null) => toPercent(v),
  },
  {
    title: <HeaderHint label="Workday Utilization" hint="Workday Utilization Rate: active lab time against 8 hours per weekday." />,
    dataIndex: 'usage_efficiency',
    key: 'usage_efficiency',
    width: 140,
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
