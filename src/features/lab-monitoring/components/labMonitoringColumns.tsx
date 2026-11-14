import dayjs from 'dayjs';
import { Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { TagCell } from '@/components/display/TagCell';
import type { ILabMonitoring } from '../types';

const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const { Text } = Typography;

function renderText(value?: string) {
  return value?.trim() || '—';
}

function renderDetails(details: Record<string, string>[] = []) {
  const entries = details.flatMap((entry) => Object.entries(entry));
  if (entries.length === 0) return '—';

  const summary = entries.map(([key, value]) => `${key}: ${value}`).join('\n');
  const [firstKey, firstValue] = entries[0];

  return (
    <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{summary}</span>} placement="left">
      <span>
        <Text ellipsis style={{ maxWidth: 210 }}>
          <span style={{ color: '#57606a' }}>{firstKey}:</span> {firstValue}
        </Text>
        {entries.length > 1 && <span style={{ color: '#57606a' }}> +{entries.length - 1}</span>}
      </span>
    </Tooltip>
  );
}

export const labMonitoringColumns: ColumnsType<ILabMonitoring> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    align: 'left',
    width: 76,
    fixed: 'left',
    render: (value: number) => <Text type="secondary">#{value}</Text>,
  },
  {
    title: 'Timestamp',
    dataIndex: 'created',
    key: 'created',
    align: 'left',
    width: 164,
    fixed: 'left',
    render: (value: string) => dayjs(value).format(DATETIME_FORMAT),
  },
  {
    title: 'Source',
    dataIndex: 'source',
    key: 'source',
    align: 'left',
    width: 120,
    render: renderText,
  },
  {
    title: 'Computer Name',
    dataIndex: 'computer_name',
    key: 'computer_name',
    align: 'left',
    width: 150,
    ellipsis: { showTitle: false },
    render: (value: string) => (
      <Tooltip title={value}><span>{renderText(value)}</span></Tooltip>
    ),
  },
  {
    title: 'Technical User',
    dataIndex: 'technical_user',
    key: 'technical_user',
    align: 'left',
    width: 130,
    render: renderText,
  },
  {
    title: 'Remote User',
    dataIndex: 'remote_user',
    key: 'remote_user',
    align: 'left',
    width: 140,
    render: (_: unknown, record: ILabMonitoring) => (
      <TagCell item={record} displayKey="remote_user" tooltipKey="remote_user_displayname" />
    ),
  },
  {
    title: 'Event Type',
    dataIndex: 'event_type',
    key: 'event_type',
    align: 'left',
    width: 130,
    render: (value: string) => value ? <Tag color="blue">{value}</Tag> : '—',
  },
  {
    title: 'Category',
    dataIndex: 'category',
    key: 'category',
    align: 'left',
    width: 120,
    render: (value: string) => value ? <Tag>{value}</Tag> : '—',
  },
  {
    title: 'Object Name',
    dataIndex: 'object_name',
    key: 'object_name',
    align: 'left',
    width: 150,
    ellipsis: { showTitle: false },
    render: (value: string) => (
      <Tooltip title={value}><span>{renderText(value)}</span></Tooltip>
    ),
  },
  {
    title: 'Object ID',
    dataIndex: 'object_id',
    key: 'object_id',
    align: 'left',
    width: 130,
    ellipsis: { showTitle: false },
    render: (value: string) => (
      <Tooltip title={value}><Text code>{renderText(value)}</Text></Tooltip>
    ),
  },
  {
    title: 'Details',
    dataIndex: 'details',
    key: 'details',
    align: 'left',
    width: 260,
    render: renderDetails,
  },
];
