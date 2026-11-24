import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Link } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { Tooltip } from 'antd';
import type { SupportTicket, SupportUserRef } from '../types';
import { getTicketStatusMeta, getTicketTypeMeta } from '../ticketPresentation';
import {
  TicketPriorityBadge,
  TicketSlaBadge,
  TicketStatusBadge,
  TicketUserChip,
} from './TicketBadges';
import styles from './SupportTickets.module.css';

const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const SHORT_DATE_FORMAT = 'MMM D, YYYY';
dayjs.extend(relativeTime);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readUserObject = (value: unknown): SupportUserRef | string | null => {
  if (typeof value === 'string') return value;
  if (!isObject(value)) return null;
  return value as SupportUserRef;
};

export function buildLabSupportColumns(queueSearch = '', compact = false): ColumnsType<SupportTicket> {
  if (compact) {
    return [{
      title: 'Ticket',
      key: 'ticket',
      render: (_, ticket) => (
        <div className={styles.compactTicket}>
          <span className={styles.compactKey}>{ticket.key}</span>
          <Link
            className={styles.subjectLink}
            to={`/support-tickets/${encodeURIComponent(ticket.key)}`}
            state={{ queueSearch }}
          >
            {ticket.subject || ticket.summary || 'Untitled ticket'}
          </Link>
          <div className={styles.subjectMeta}>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            <TicketSlaBadge sla={ticket.sla} status={ticket.status} />
          </div>
          <TicketUserChip user={readUserObject(ticket.assignee)} emptyLabel="Unassigned" />
        </div>
      ),
    }];
  }

  return [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      align: 'left',
      width: 130,
      render: (value: string, record) => {
        const ticketKey = value || record.key;
        if (!ticketKey) return '–';
        return (
          <Link
            className={styles.keyLink}
            state={{ queueSearch }}
            to={`/support-tickets/${encodeURIComponent(ticketKey)}`}
          >
            {ticketKey}
          </Link>
        );
      },
    },
    {
      title: 'Subject',
      key: 'summary',
      align: 'left',
      minWidth: 280,
      render: (_, record) => {
        const ticketKey = record.key;
        const subjectText =
          record.subject ?? record.summary ?? record.fields?.summary ?? 'Untitled ticket';
        const typeMeta = record.ticket_type ? getTicketTypeMeta(record.ticket_type) : null;
        const labels = record.labels ?? [];

        return (
          <div className={styles.subjectCell}>
            {ticketKey ? (
              <Link
                className={styles.subjectLink}
                state={{ queueSearch }}
                to={`/support-tickets/${encodeURIComponent(ticketKey)}`}
              >
                {subjectText}
              </Link>
            ) : (
              <span className={styles.subjectLink}>{subjectText}</span>
            )}
            <div className={styles.subjectMeta}>
              {typeMeta && <span>{typeMeta.label}</span>}
              {record.team?.name && <span>· Team: {record.team.name}</span>}
              <TicketSlaBadge sla={record.sla} status={record.status ?? record.fields?.status} />
              {labels.slice(0, 3).map((label) => (
                <span key={label} className={styles.labelPill}>
                  {label}
                </span>
              ))}
              {labels.length > 3 && (
                <span className={styles.labelPill}>+{labels.length - 3}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      align: 'left',
      width: 155,
      render: (_, record) => {
        const s = record.status ?? record.fields?.status;
        const systemState =
          isObject(s) && 'system_state' in s && typeof s.system_state === 'string'
            ? s.system_state
            : undefined;
        return <TicketStatusBadge status={s} systemState={systemState} />;
      },
    },
    {
      title: 'Priority',
      key: 'priority',
      align: 'left',
      width: 130,
      render: (_, record) => {
        const p = record.priority ?? record.fields?.priority;
        return <TicketPriorityBadge priority={p} />;
      },
    },
    {
      title: 'Category',
      key: 'category',
      align: 'left',
      width: 145,
      render: (_, record) =>
        record.category?.name ? (
          <span className={styles.categoryChip}>{record.category.name}</span>
        ) : (
          '–'
        ),
    },
    {
      title: 'Requester',
      key: 'reporter',
      align: 'left',
      width: 165,
      render: (_, record) => {
        const user = readUserObject(
          record.requester ?? record.reporter ?? record.fields?.reporter,
        );
        return <TicketUserChip user={user} emptyLabel="–" />;
      },
    },
    {
      title: 'Assignee',
      key: 'assignee',
      align: 'left',
      width: 165,
      render: (_, record) => {
        const user = readUserObject(record.assignee ?? record.fields?.assignee);
        return <TicketUserChip user={user} emptyLabel="Unassigned" />;
      },
    },
    {
      title: 'Due Date',
      key: 'due_date',
      align: 'left',
      width: 135,
      render: (_, record) => {
        const dueDate = record.due_date ?? record.duedate ?? record.fields?.duedate;
        if (!dueDate || !dayjs(dueDate).isValid()) return '–';
        const parsed = dayjs(dueDate);
        const statusMeta = getTicketStatusMeta(record.status ?? record.fields?.status);
        const today = dayjs().startOf('day');
        const isOverdue = !statusMeta.isTerminal && parsed.isBefore(today, 'day');
        const isDueSoon = !statusMeta.isTerminal && !isOverdue && parsed.diff(today, 'day') <= 2;
        const formatted = parsed.format(SHORT_DATE_FORMAT);
        const isoDate = parsed.format('YYYY-MM-DD');

        if (isOverdue) {
          return (
            <Tooltip title={`Overdue · ${isoDate}`}>
              <span className={styles.dueOverdue}>{formatted}</span>
            </Tooltip>
          );
        }
        if (isDueSoon) {
          return (
            <Tooltip title={`Due soon · ${isoDate}`}>
              <span className={styles.dueSoon}>{formatted}</span>
            </Tooltip>
          );
        }
        return (
          <Tooltip title={isoDate}>
            <span>{formatted}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Created',
      key: 'created',
      align: 'left',
      width: 140,
      render: (_, record) => {
        const created = record.created_at ?? record.created ?? record.fields?.created;
        if (!created || !dayjs(created).isValid()) return '–';
        return (
          <Tooltip title={dayjs(created).format(DATETIME_FORMAT)}>
            <span>{dayjs(created).format(SHORT_DATE_FORMAT)}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Updated',
      key: 'updated',
      align: 'left',
      width: 140,
      render: (_, record) => {
        const updatedAt = record.last_activity_at ?? record.updated_at;
        if (!updatedAt || !dayjs(updatedAt).isValid()) return '–';
        return (
          <Tooltip title={dayjs(updatedAt).format(DATETIME_FORMAT)}>
            <span>{dayjs(updatedAt).fromNow()}</span>
          </Tooltip>
        );
      },
    },
  ];
}

export const buildSupportTicketColumns = buildLabSupportColumns;
