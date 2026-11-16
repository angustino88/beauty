import { Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RankedLabItem } from '../../../types';

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
    title: 'Downtime (h)',
    dataIndex: 'downtime_hours',
    key: 'downtime_hours',
    width: 120,
    align: 'center',
    sorter: (a, b) => (a.downtime_hours ?? 0) - (b.downtime_hours ?? 0),
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
