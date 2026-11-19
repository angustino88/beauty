import { Avatar, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getAvatarUrl } from '@/shared/utils/avatar';
import { toPercent } from '../../../formatters';
import type { RankedPersonaItem } from '../../../types';
import { assessPersona } from '../../../utils/assessment';
import { AssessmentCell } from '../../assessment/AssessmentView';
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
    title: 'Assessment',
    key: 'assessment',
    width: 300,
    sorter: (a, b) => (assessPersona(a).score ?? -1) - (assessPersona(b).score ?? -1),
    render: (_: unknown, record) => <AssessmentCell assessment={assessPersona(record)} />,
  },
  {
    title: <HeaderHint label="RFO" hint="Remote from office: sessions against two per weekday." />,
    dataIndex: 'wfo_rate',
    key: 'wfo_rate',
    width: 80,
    align: 'center',
    sorter: (a, b) => (a.wfo_rate ?? 0) - (b.wfo_rate ?? 0),
    render: (v: number) => toPercent(v),
  },
  {
    title: <HeaderHint label="RFH" hint="Remote from home: the rest of the expected sessions (100% − RFO)." />,
    dataIndex: 'wfh_rate',
    key: 'wfh_rate',
    width: 80,
    align: 'center',
    sorter: (a, b) => (a.wfh_rate ?? 0) - (b.wfh_rate ?? 0),
    render: (v: number) => toPercent(v),
  },
  {
    title: <HeaderHint label="Work late" hint="Share of lab time between 20:00 and 06:00." />,
    dataIndex: 'late_rate',
    key: 'late_rate',
    width: 100,
    align: 'center',
    sorter: (a, b) => (a.late_rate ?? 0) - (b.late_rate ?? 0),
    render: (v: number) => toPercent(v),
  },
  {
    title: <HeaderHint label="Attendance" hint="Approved bookings that had a session. Bookings with no session are no-shows." />,
    dataIndex: 'booking_compliance',
    key: 'booking_compliance',
    width: 110,
    align: 'center',
    sorter: (a, b) => (a.booking_compliance ?? -1) - (b.booking_compliance ?? -1),
    render: (v: number | null) => toPercent(v),
  },
  {
    title: <HeaderHint label="Booked used" hint="Booked time actually spent in a session." />,
    dataIndex: 'booking_utilization',
    key: 'booking_utilization',
    width: 120,
    align: 'center',
    sorter: (a, b) => (a.booking_utilization ?? -1) - (b.booking_utilization ?? -1),
    render: (v: number | null) => toPercent(v),
  },
  {
    title: <HeaderHint label="Active" hint="Active time against total session time (idle time excluded)." />,
    dataIndex: 'active_rate',
    key: 'active_rate',
    width: 90,
    align: 'center',
    sorter: (a, b) => (a.active_rate ?? -1) - (b.active_rate ?? -1),
    render: (v: number | null) => toPercent(v),
  },
  {
    title: <HeaderHint label="Efficiency" hint="Active lab time against 8 hours per weekday." />,
    dataIndex: 'usage_efficiency',
    key: 'usage_efficiency',
    width: 110,
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
