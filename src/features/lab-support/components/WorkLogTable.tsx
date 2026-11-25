import { Empty, Table, type TableProps } from 'antd';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { TicketWorkLogRead, WorkLogReportEntryRead, WorkLogReportSummaryRead } from '@/shared/api/generated/api';
import { userLabel } from '@/shared/utils/userRef';
import { formatWorkDuration } from '../ticketPresentation';
import styles from './SupportTickets.module.css';

type WorkLogRow = TicketWorkLogRead | WorkLogReportEntryRead;

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

interface WorkLogMetricsProps {
  summary?: WorkLogReportSummaryRead;
  scope: 'mine' | 'team' | 'ticket';
}

export function WorkLogMetrics({ summary, scope }: WorkLogMetricsProps) {
  const secondary = scope === 'ticket'
    ? { label: 'My time', value: summary ? formatWorkDuration(summary.my_minutes) : '—' }
    : { label: 'Tickets worked', value: summary?.ticket_count.toLocaleString() ?? '—' };

  return (
    <dl className={styles.workLogMetrics}>
      <div>
        <dt>{scope === 'mine' ? 'My time logged' : 'Total time logged'}</dt>
        <dd>{summary ? formatWorkDuration(summary.total_minutes) : '—'}</dd>
      </div>
      <div>
        <dt>Work entries</dt>
        <dd>{summary?.entry_count.toLocaleString() ?? '—'}</dd>
      </div>
      <div>
        <dt>{secondary.label}</dt>
        <dd>{secondary.value}</dd>
      </div>
      {scope === 'team' && (
        <div>
          <dt>Contributors</dt>
          <dd>{summary?.contributor_count.toLocaleString() ?? '—'}</dd>
        </div>
      )}
    </dl>
  );
}

interface WorkLogTableProps {
  rows: readonly WorkLogRow[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  showTicket?: boolean;
  renderActions?: (entry: TicketWorkLogRead) => ReactNode;
  emptyLabel: string;
}

export function WorkLogTable({
  rows, loading, page, pageSize, total, onPageChange, showTicket, renderActions, emptyLabel,
}: WorkLogTableProps) {
  const columns: TableProps<WorkLogRow>['columns'] = [
    {
      title: 'Work performed',
      key: 'work',
      render: (_, entry) => (
        <div className={styles.workLogEntry}>
          {showTicket && 'ticket' in entry && (
            <Link to={`/support-tickets/${encodeURIComponent(entry.ticket.key)}?tab=work-logs`}>
              {entry.ticket.key} · {entry.ticket.subject}
            </Link>
          )}
          <span className={entry.description ? styles.workLogDescription : styles.workLogMuted}>
            {entry.description || 'No description'}
          </span>
        </div>
      ),
    },
    {
      title: 'Logged by',
      key: 'author',
      width: 170,
      render: (_, entry) => userLabel(entry.author),
    },
    {
      title: 'Started',
      key: 'started',
      width: 180,
      render: (_, entry) => <time dateTime={entry.started_at}>{dateTime.format(new Date(entry.started_at))}</time>,
    },
    {
      title: 'Duration',
      key: 'duration',
      align: 'right',
      width: 100,
      render: (_, entry) => <strong>{formatWorkDuration(entry.time_spent_minutes)}</strong>,
    },
  ];
  if (renderActions) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'right',
      render: (_, entry) => entry.can_manage ? renderActions(entry) : null,
    });
  }

  return (
    <Table<WorkLogRow>
      rowKey="id"
      size="small"
      columns={columns}
      dataSource={rows}
      loading={loading}
      scroll={{ x: showTicket ? 730 : 680 }}
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: onPageChange,
        hideOnSinglePage: true,
        showSizeChanger: false,
      }}
      locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyLabel} /> }}
    />
  );
}
