import dayjs from 'dayjs';
import { Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { TagCell } from '@/components/display/TagCell';
import type { LabSessionLogEntry } from '../types';

const { Text } = Typography;
const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

function renderText(value: string | null) {
  return value?.trim() || '—';
}

function renderEllipsis(value: string | null) {
  return (
    <Tooltip title={value}>
      <span>{renderText(value)}</span>
    </Tooltip>
  );
}

function renderHours(value: number | null) {
  return value == null ? '—' : <Text strong>{value.toFixed(2)}</Text>;
}

export const labSessionLogColumns: ColumnsType<LabSessionLogEntry> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    align: 'left',
    width: 90,
    fixed: 'left',
    render: (value: number) => <Text type="secondary">#{value}</Text>,
  },
  {
    title: 'Computer Name',
    dataIndex: 'computer_name',
    key: 'computer_name',
    align: 'left',
    width: 150,
    fixed: 'left',
    ellipsis: { showTitle: false },
    render: renderEllipsis,
  },
  {
    title: 'Login time',
    dataIndex: 'login_time',
    key: 'login_time',
    align: 'left',
    width: 164,
    sorter: { multiple: 1 },
    render: (value: string | null) => value ? dayjs(value).format(DATETIME_FORMAT) : '—',
  },
  {
    title: 'Logout time',
    dataIndex: 'logout_time',
    key: 'logout_time',
    align: 'left',
    width: 164,
    sorter: { multiple: 2 },
    render: (value: string | null) => value ? dayjs(value).format(DATETIME_FORMAT) : <Tag color="green">Active</Tag>,
  },
  {
    title: 'Duration (h)',
    dataIndex: 'duration_in_hour',
    key: 'duration',
    align: 'center',
    width: 145,
    sorter: { multiple: 3 },
    render: renderHours,
  },
  {
    title: 'Active Time (h)',
    dataIndex: 'active_time_in_hour',
    key: 'active_time',
    align: 'center',
    width: 165,
    sorter: { multiple: 4 },
    render: renderHours,
  },
  {
    title: 'Remote User',
    dataIndex: 'remote_user',
    key: 'remote_user',
    align: 'left',
    width: 150,
    render: (value: LabSessionLogEntry['remote_user']) =>
      value?.username ? <TagCell item={value} displayKey="username" tooltipKey="displayname" /> : '—',
  },
  {
    title: 'Remote Computer',
    dataIndex: 'remote_computer',
    key: 'remote_computer',
    align: 'left',
    width: 220,
    render: renderText,
  },
  {
    title: 'Remote IP',
    dataIndex: 'remote_ip',
    key: 'remote_ip',
    align: 'left',
    width: 140,
    render: (value: string | null) => value ? <Text code>{value}</Text> : '—',
  },
  {
    title: 'Booking Code',
    dataIndex: 'booking_code',
    key: 'booking_code',
    align: 'left',
    width: 140,
    render: (value: string | null) => value ? <Text code>{value}</Text> : '—',
  },
  {
    title: 'Project',
    dataIndex: ['booking_info', 'project'],
    key: 'project',
    align: 'left',
    width: 150,
    ellipsis: { showTitle: false },
    render: renderEllipsis,
  },
  {
    title: 'From Datetime',
    dataIndex: ['booking_info', 'from_date_time'],
    key: 'from_date_time',
    align: 'left',
    width: 164,
    sorter: { multiple: 5 },
    render: (value: string | null) => value ? dayjs(value).format(DATETIME_FORMAT) : '—',
  },
  {
    title: 'To Datetime',
    dataIndex: ['booking_info', 'to_date_time'],
    key: 'to_date_time',
    align: 'left',
    width: 164,
    sorter: { multiple: 6 },
    render: (value: string | null) => value ? dayjs(value).format(DATETIME_FORMAT) : '—',
  },
];
