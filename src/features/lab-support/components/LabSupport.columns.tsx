import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Link } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { Tag, Tooltip, Typography } from 'antd';
import { TagCell } from '@/components/display/TagCell';
import type { SupportTicket, SupportUserRef } from '../types';

const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
dayjs.extend(relativeTime);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readName = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (isObject(value) && typeof value.name === 'string') return value.name;
  return fallback;
};

const readUserObject = (value: unknown): SupportUserRef | null => {
  if (!isObject(value)) return null;
  return value as SupportUserRef;
};

const formatDate = (value: string | null | undefined): string =>
  value && dayjs(value).isValid() ? dayjs(value).format(DATETIME_FORMAT) : '–';

const labelColor = (value: string): string => {
  const state = value.toLowerCase();
  if (state.includes('resolv') || state.includes('closed') || state.includes('done')) return 'green';
  if (state.includes('progress') || state.includes('investig')) return 'blue';
  if (state.includes('hold') || state.includes('pending')) return 'orange';
  if (state.includes('cancel')) return 'default';
  return 'gold';
};

export function buildLabSupportColumns(): ColumnsType<SupportTicket> {
  return [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      align: 'left',
      minWidth: 120,
      render: (value: string, record) => value || record.key
        ? <Link to={`/support-tickets/${encodeURIComponent(value || record.key)}`}>{value || record.key}</Link>
        : '–',
    },
    {
      title: 'Subject',
      key: 'summary',
      align: 'left',
      minWidth: 260,
      render: (_, record) => (
        <div style={{ minWidth: 220 }}>
          <div style={{ fontWeight: 600, color: 'var(--lm-text)' }}>{record.subject ?? record.summary ?? record.fields?.summary ?? 'Untitled ticket'}</div>
          {record.key && <Typography.Text type="secondary">{record.key}</Typography.Text>}
        </div>
      ),
    },
    {
      title: 'Category',
      key: 'category',
      align: 'left',
      minWidth: 120,
      render: (_, record) => record.category?.name ?? '–',
    },
    {
      title: 'Priority',
      key: 'priority',
      align: 'left',
      minWidth: 110,
      render: (_, record) => {
        const p = record.priority ?? record.fields?.priority;
        const name = readName(p, typeof p === 'string' ? p : p?.name ?? '–');
        return <Tag color={name.toLowerCase().includes('high') || name.toLowerCase().includes('critical') ? 'red' : name.toLowerCase().includes('low') ? 'default' : 'blue'}>{name}</Tag>;
      },
    },
    {
      title: 'Status',
      key: 'status',
      align: 'left',
      minWidth: 110,
      render: (_, record) => {
        const s = record.status ?? record.fields?.status;
        const name = readName(s, typeof s === 'string' ? s : s?.name ?? '–');
        return <Tag color={labelColor(name)}>{name}</Tag>;
      },
    },
    {
      title: 'Requester',
      key: 'reporter',
      align: 'left',
      minWidth: 140,
      render: (_, record) => {
        const user = readUserObject(record.requester ?? record.reporter ?? record.fields?.reporter);
        if (!user) return typeof record.reporter === 'string' ? record.reporter : '–';
        return <TagCell item={user} displayKey="username" tooltipKey="displayName" />;
      },
    },
    {
      title: 'Assignee',
      key: 'assignee',
      align: 'left',
      minWidth: 140,
      render: (_, record) => {
        const user = readUserObject(record.assignee ?? record.fields?.assignee);
        if (!user) return typeof record.assignee === 'string' ? record.assignee : '–';
        return <TagCell item={user} displayKey="username" tooltipKey="displayName" />;
      },
    },
    {
      title: 'Created Date',
      key: 'created',
      align: 'left',
      minWidth: 160,
      render: (_, record) => formatDate(record.created_at ?? record.created ?? record.fields?.created),
    },
    {
      title: 'Updated Date',
      key: 'updated',
      align: 'left',
      minWidth: 160,
      render: (_, record) => {
        const updatedAt = record.last_activity_at ?? record.updated_at;
        return updatedAt ? <Tooltip title={dayjs(updatedAt).isValid() ? dayjs(updatedAt).format(DATETIME_FORMAT) : 'Unknown date'}>{dayjs(updatedAt).isValid() ? dayjs(updatedAt).fromNow() : '–'}</Tooltip> : '–';
      },
    },
  ];
}

export const buildSupportTicketColumns = buildLabSupportColumns;
