import { Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { toPercent } from '../../../formatters';
import type { RankedLabItem } from '../../../types';
import { assessLab } from '../../../utils/assessment';
import { AssessmentCell } from '../../assessment/AssessmentView';
import { HeaderHint } from './HeaderHint';

const { Text } = Typography;

export const labColumns: ColumnsType<RankedLabItem> = [
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
    title: 'Lab Name',
    dataIndex: 'lab_name',
    key: 'lab_name',
    sorter: (a, b) => (a.lab_name || '').localeCompare(b.lab_name || ''),
    render: (name: string) => <Text>{name}</Text>,
  },
  {
    title: 'Assessment',
    key: 'assessment',
    width: 300,
    sorter: (a, b) => (assessLab(a).score ?? -1) - (assessLab(b).score ?? -1),
    render: (_: unknown, record) => <AssessmentCell assessment={assessLab(record)} />,
  },
  {
    title: 'Active Users',
    dataIndex: 'active_users',
    key: 'active_users',
    width: 110,
    align: 'center',
    sorter: (a, b) => (a.active_users ?? 0) - (b.active_users ?? 0),
  },
  {
    title: 'Sessions',
    dataIndex: 'total_sessions',
    key: 'total_sessions',
    width: 100,
    align: 'center',
    sorter: (a, b) => (a.total_sessions ?? 0) - (b.total_sessions ?? 0),
  },
  {
    title: <HeaderHint label="Utilization" hint="Active time on the bench against 8 hours per weekday." />,
    dataIndex: 'utilization_rate',
    key: 'utilization_rate',
    width: 110,
    align: 'center',
    sorter: (a, b) => (a.utilization_rate ?? 0) - (b.utilization_rate ?? 0),
    render: (v: number) => toPercent(v),
  },
  {
    title: <HeaderHint label="Booking fill" hint="Booked time against 8 hours per weekday." />,
    dataIndex: 'booking_fill',
    key: 'booking_fill',
    width: 110,
    align: 'center',
    sorter: (a, b) => (a.booking_fill ?? 0) - (b.booking_fill ?? 0),
    render: (v: number) => toPercent(v),
  },
  {
    title: <HeaderHint label="Attendance" hint="Approved bookings on this bench that had a session." />,
    dataIndex: 'booking_compliance',
    key: 'booking_compliance',
    width: 110,
    align: 'center',
    sorter: (a, b) => (a.booking_compliance ?? -1) - (b.booking_compliance ?? -1),
    render: (v: number | null) => toPercent(v),
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
