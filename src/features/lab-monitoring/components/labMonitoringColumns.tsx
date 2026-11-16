import dayjs from 'dayjs';
import { Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { TagCell } from '@/components/display/TagCell';
import type { ILabMonitoring } from '../types';

const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const { Text } = Typography;

function renderText(value?: string | null) {
  return value?.trim() || '—';
}

/** Payload is an arbitrary JSON object; show its first entry and the count of the rest. */
function renderPayload(payload: unknown) {
  const entries = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? Object.entries(payload as Record<string, unknown>)
    : [];
  if (entries.length === 0) return '—';

  const summary = entries.map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`).join('\n');
  const [firstKey, firstValue] = entries[0];

  return (
    <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{summary}</span>} placement="left">
      <span>
        <Text ellipsis style={{ maxWidth: 210 }}>
          <span style={{ color: 'var(--lm-text-secondary)' }}>{firstKey}:</span>{' '}
          {typeof firstValue === 'object' ? JSON.stringify(firstValue) : String(firstValue)}
        </Text>
        {entries.length > 1 && <span style={{ color: 'var(--lm-text-secondary)' }}> +{entries.length - 1}</span>}
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
    dataIndex: 'occurred_at',
    key: 'occurred_at',
    align: 'left',
    width: 164,
    fixed: 'left',
    render: (value: string) => dayjs(value).format(DATETIME_FORMAT),
  },
  {
    title: 'Source',
    dataIndex: 'agent_key',
    key: 'agent_key',
    align: 'left',
    width: 120,
    render: renderText,
  },
  {
    title: 'Computer Name',
    key: 'computer',
    align: 'left',
    width: 150,
    ellipsis: { showTitle: false },
    render: (_: unknown, record: ILabMonitoring) => (
      <Tooltip title={record.computer?.name}><span>{renderText(record.computer?.name)}</span></Tooltip>
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
      <TagCell item={record} displayKey="remote_user" tooltipKey="remote_user_display_name" />
    ),
  },
  {
    title: 'Event Type',
    key: 'action',
    align: 'left',
    width: 130,
    render: (_: unknown, record: ILabMonitoring) =>
      record.action?.label ? <Tag color="blue">{record.action.label}</Tag> : '—',
  },
  {
    title: 'Category',
    key: 'subject_type',
    align: 'left',
    width: 120,
    render: (_: unknown, record: ILabMonitoring) =>
      record.subject?.type ? <Tag>{record.subject.type}</Tag> : '—',
  },
  {
    title: 'Object Name',
    key: 'subject_name',
    align: 'left',
    width: 150,
    ellipsis: { showTitle: false },
    render: (_: unknown, record: ILabMonitoring) => (
      <Tooltip title={record.subject?.name}><span>{renderText(record.subject?.name)}</span></Tooltip>
    ),
  },
  {
    title: 'Object ID',
    key: 'subject_key',
    align: 'left',
    width: 130,
    ellipsis: { showTitle: false },
    render: (_: unknown, record: ILabMonitoring) => (
      <Tooltip title={record.subject?.key}><Text code>{renderText(record.subject?.key)}</Text></Tooltip>
    ),
  },
  {
    title: 'Details',
    key: 'payload',
    align: 'left',
    width: 260,
    render: (_: unknown, record: ILabMonitoring) => renderPayload(record.payload),
  },
];
