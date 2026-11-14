import { DesktopOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { toPercent } from '../../../formatters';
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
    render: (rank: number) => <Text strong style={{ color: '#888888' }}>#{rank}</Text>,
  },
  {
    title: 'Image',
    dataIndex: 'image',
    key: 'image',
    width: 80,
    align: 'center',
    render: (image: string | null, record) =>
      image
        ? (
          <div
            style={{
              width: 48,
              height: 36,
              borderRadius: 6,
              overflow: 'hidden',
              border: '1px solid #e8e8e8',
            }}
          >
            <img
              src={image}
              alt={record.lab_name ?? undefined}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )
        : (
          <div
            style={{
              width: 48,
              height: 36,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #7e57c2 0%, #311b92 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DesktopOutlined style={{ color: '#fff', fontSize: 18 }} />
          </div>
        ),
  },
  {
    title: 'Lab Name',
    dataIndex: 'lab_name',
    key: 'lab_name',
    sorter: (a, b) => (a.lab_name || '').localeCompare(b.lab_name || ''),
    render: (name: string) => <Text>{name}</Text>,
  },
  {
    title: 'Computer Name',
    dataIndex: 'computer_name',
    key: 'computer_name',
    sorter: (a, b) => (a.computer_name || '').localeCompare(b.computer_name || ''),
    render: (name: string | undefined) => <Text>{name ?? '—'}</Text>,
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
    title: 'Utilization',
    dataIndex: 'utilization_rate',
    key: 'utilization_rate',
    width: 100,
    align: 'center',
    sorter: (a, b) => (a.utilization_rate ?? 0) - (b.utilization_rate ?? 0),
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
    title: 'Availability',
    dataIndex: 'availability',
    key: 'availability',
    width: 100,
    align: 'center',
    sorter: (a, b) => (a.availability ?? 0) - (b.availability ?? 0),
    render: (v: number | undefined) => (v != null ? `${v.toFixed(1)}%` : '—'),
  },
  {
    title: 'Points',
    dataIndex: 'points',
    key: 'points',
    width: 90,
    align: 'center',
    sorter: (a, b) => (a.points ?? 0) - (b.points ?? 0),
    render: (pts: number) => <Text strong style={{ color: '#7e57c2' }}>{pts}</Text>,
  },
];
