import React, { useMemo, useState } from 'react';
import { Button, Empty, Popconfirm, Segmented, Table, Tag, Tooltip, message } from 'antd';
import {
  PlusOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  ToolOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { ColumnsType } from 'antd/es/table';
import {
  type Downtime,
  type ResourceType,
  CONDITION_LABELS,
  DOWNTIME_REASON_LABELS,
} from '../resourceStatus';
import {
  useCancelDowntimeMutation,
  useEndDowntimeMutation,
  useGetDowntimesQuery,
} from '../downtimeApi';
import ScheduleDowntimeModal from './ScheduleDowntimeModal';
import styles from './Downtime.module.css';
import { StatusBadge } from '@/shared/components/StatusBadge';

dayjs.extend(relativeTime);

/** Short date for table cells; the end drops the date when it is on the same day as the start. */
function formatWhen(value: string, sameDayAs?: string): string {
  const d = dayjs(value);
  if (sameDayAs && d.isSame(dayjs(sameDayAs), 'day')) return d.format('HH:mm');
  return d.format(d.isSame(dayjs(), 'year') ? 'MMM D, HH:mm' : 'MMM D, YYYY HH:mm');
}

interface DowntimeTabProps {
  resourceType: ResourceType;
  resourceId: number;
  resourceName?: string;
  isAdminOrCoordinator?: boolean;
}

type FilterState = 'all' | 'active_scheduled' | 'history';

function formatDuration(start: string, end: string | null, isCurrent?: boolean): React.ReactNode {
  const s = dayjs(start);
  if (isCurrent) {
    const elapsedMinutes = dayjs().diff(s, 'minute');
    if (elapsedMinutes < 60) {
      return <span className={styles.durationOngoing}>{Math.max(1, elapsedMinutes)}m ongoing</span>;
    }
    const hours = Math.floor(elapsedMinutes / 60);
    const mins = elapsedMinutes % 60;
    return (
      <span className={styles.durationOngoing}>
        {hours}h {mins > 0 ? `${mins}m` : ''} ongoing
      </span>
    );
  }
  if (!end) return <Tag color="warning">Open-ended</Tag>;
  const e = dayjs(end);
  const diffMinutes = e.diff(s, 'minute');
  if (diffMinutes <= 0) return '—';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  if (hours < 24) return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours > 0 ? `${remHours}h` : ''}`;
}

export const DowntimeTab: React.FC<DowntimeTabProps> = ({
  resourceType,
  resourceId,
  resourceName,
  isAdminOrCoordinator = false,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterState, setFilterState] = useState<FilterState>('all');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const { data, isFetching, refetch } = useGetDowntimesQuery({
    resource_type: resourceType,
    resource_id: resourceId,
    page: 1,
    page_size: 100,
  });

  const [endDowntime, { isLoading: ending }] = useEndDowntimeMutation();
  const [cancelDowntime, { isLoading: cancelling }] = useCancelDowntimeMutation();

  const handleEnd = async (downtimeId: number) => {
    try {
      await endDowntime(downtimeId).unwrap();
      message.success('Downtime ended successfully. Resource marked operational.');
      void refetch();
    } catch {
      message.error('Failed to end downtime');
    }
  };

  const handleCancel = async (downtimeId: number) => {
    try {
      await cancelDowntime(downtimeId).unwrap();
      message.success('Scheduled downtime cancelled successfully');
      void refetch();
    } catch {
      message.error('Failed to cancel downtime');
    }
  };

  const allItems = useMemo(() => data?.data ?? [], [data?.data]);

  // Active (current) downtime
  const activeDowntime = useMemo(
    () => allItems.find((d) => d.state === 'current'),
    [allItems],
  );

  // Counts for tabs
  const activeCount = useMemo(
    () => allItems.filter((d) => d.state === 'current' || d.state === 'scheduled').length,
    [allItems],
  );
  const historyCount = useMemo(
    () => allItems.filter((d) => d.state === 'ended' || d.state === 'cancelled').length,
    [allItems],
  );

  // Filtered items
  const filteredItems = useMemo(() => {
    if (filterState === 'active_scheduled') {
      return allItems.filter((d) => d.state === 'current' || d.state === 'scheduled');
    }
    if (filterState === 'history') {
      return allItems.filter((d) => d.state === 'ended' || d.state === 'cancelled');
    }
    return allItems;
  }, [allItems, filterState]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const columns: ColumnsType<Downtime> = [
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      width: 136,
      render: (state: string) => {
        if (state === 'current') return <StatusBadge tone="warning" label="Active" icon={<span className={styles.pulsingDot} style={{ width: 6, height: 6, margin: 0 }} />} />;
        if (state === 'scheduled') return <StatusBadge tone="info" label="Scheduled" icon={<CalendarOutlined />} />;
        if (state === 'ended') return <StatusBadge tone="success" label="Resolved" icon={<CheckCircleOutlined />} />;
        return <StatusBadge tone="neutral" label="Cancelled" />;
      },
    },
    {
      title: 'Condition',
      key: 'condition',
      width: 170,
      render: (_, r) => {
        const isOutOfService = r.condition.value === 'out_of_service';
        return (
          <div className={styles.cellStack}>
            <span className={`${styles.conditionChip} ${isOutOfService ? styles.conditionChipDanger : ''}`}>
              {isOutOfService ? <ExclamationCircleOutlined /> : <ToolOutlined />}
              {r.condition.label || CONDITION_LABELS[r.condition.value] || r.condition.value}
            </span>
            <span className={styles.cellSub}>
              {r.reason.label || DOWNTIME_REASON_LABELS[r.reason.value] || r.reason.value}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Window',
      key: 'window',
      width: 170,
      render: (_, r) => (
        <div className={styles.cellStack}>
          <span className={styles.cellMain}>{formatWhen(r.starts_at)}</span>
          <span className={styles.cellSub}>
            → {r.ends_at ? formatWhen(r.ends_at, r.starts_at) : 'Until resolved'}
          </span>
        </div>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      width: 110,
      render: (_, r) => formatDuration(r.starts_at, r.ends_at, r.state === 'current'),
    },
    {
      title: 'Actor',
      key: 'actor',
      width: 150,
      render: (_, r) => {
        const actor = r.actor?.display_name || r.actor?.username || 'System';
        return (
          <span className={styles.actorCell} title={actor}>
            <UserOutlined className={styles.actorIcon} />
            <span className={styles.actorName}>{actor}</span>
          </span>
        );
      },
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      ellipsis: { showTitle: false },
      render: (val: string) =>
        val ? (
          <Tooltip title={val}>
            <span className={styles.notesCell}>{val}</span>
          </Tooltip>
        ) : (
          <span style={{ color: 'var(--lm-text-disabled)' }}>—</span>
        ),
    },
  ];

  if (isAdminOrCoordinator) {
    columns.push({
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, r) => {
        if (r.state === 'current') {
          return (
            <Popconfirm
              title="End Downtime"
              description="End this downtime window right now and restore normal operations?"
              onConfirm={() => handleEnd(r.id)}
              okText="End Now"
              cancelText="Cancel"
            >
              <Button
                size="small"
                type="primary"
               
                icon={<CheckCircleOutlined />}
                loading={ending}
              >
                End Now
              </Button>
            </Popconfirm>
          );
        }
        if (r.state === 'scheduled') {
          return (
            <Popconfirm
              title="Cancel Scheduled Downtime"
              description="Cancel this planned downtime window?"
              onConfirm={() => handleCancel(r.id)}
              okText="Cancel Downtime"
              cancelText="Keep"
            >
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                loading={cancelling}
              >
                Cancel
              </Button>
            </Popconfirm>
          );
        }
        return <span style={{ color: 'var(--lm-text-disabled)' }}>—</span>;
      },
    });
  }

  return (
    <div className={styles.downtimeContainer}>
      {/* 1. Header with Title & Action */}
      <div className={styles.tabHeader}>
        <div className={styles.tabTitleArea}>
          <h4>Downtime Windows</h4>
          <span className={styles.tabSubtitle}>
            Maintenance and out-of-service periods recorded for this resource.
          </span>
        </div>
        {isAdminOrCoordinator && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setScheduleModalOpen(true)}
          >
            Schedule Downtime
          </Button>
        )}
      </div>

      {/* 2. Active Downtime Hero Banner */}
      {activeDowntime && (
        <div
          className={`${styles.activeDowntimeCard} ${
            activeDowntime.condition.value === 'out_of_service' ? styles.activeOutOfService : ''
          }`}
        >
          <div className={styles.activeHeader}>
            <span
              className={
                activeDowntime.condition.value === 'out_of_service'
                  ? styles.pulsingDot
                  : `${styles.pulsingDot} ${styles.pulsingDotAmber}`
              }
            />
            <div className={styles.activeDetails}>
              <div className={styles.activeTitle}>
                <span>
                  Active downtime:{' '}
                  {activeDowntime.condition.label ||
                    CONDITION_LABELS[activeDowntime.condition.value] ||
                    activeDowntime.condition.value}
                </span>
                <Tag color={activeDowntime.condition.value === 'out_of_service' ? 'error' : 'warning'}>
                  {activeDowntime.reason.label ||
                    DOWNTIME_REASON_LABELS[activeDowntime.reason.value] ||
                    activeDowntime.reason.value}
                </Tag>
              </div>
              <div className={styles.activeMeta}>
                <span>
                  Started: <strong>{dayjs(activeDowntime.starts_at).format('MMM D, YYYY HH:mm')}</strong>{' '}
                  ({dayjs(activeDowntime.starts_at).fromNow()})
                </span>
                <span>•</span>
                <span>
                  Expected End:{' '}
                  <strong>
                    {activeDowntime.ends_at
                      ? dayjs(activeDowntime.ends_at).format('MMM D, YYYY HH:mm')
                      : 'Until resolved (Open-ended)'}
                  </strong>
                </span>
              </div>
              {activeDowntime.notes && (
                <div className={styles.activeNote}>
                  "{activeDowntime.notes}"
                </div>
              )}
            </div>
          </div>

          {isAdminOrCoordinator && (
            <Popconfirm
              title="End Downtime"
              description="End this downtime window right now and restore normal operations?"
              onConfirm={() => handleEnd(activeDowntime.id)}
              okText="End Now"
              cancelText="Cancel"
            >
              <Button
                type="primary"
               
                icon={<CheckCircleOutlined />}
                loading={ending}
              >
                End Downtime Now
              </Button>
            </Popconfirm>
          )}
        </div>
      )}

      {/* 3. Filter Bar */}
      <div className={styles.controlsBar}>
        <Segmented<FilterState>
          value={filterState}
          onChange={(val) => {
            setFilterState(val);
            setPage(1);
          }}
          options={[
            { label: `All (${allItems.length})`, value: 'all' },
            { label: `Active & Scheduled (${activeCount})`, value: 'active_scheduled' },
            { label: `History (${historyCount})`, value: 'history' },
          ]}
        />
      </div>

      {/* 4. Table */}
      {allItems.length === 0 && !isFetching ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No downtime records found for this resource. All systems are operating normally."
        >
          {isAdminOrCoordinator && (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setScheduleModalOpen(true)}
            >
              Schedule Maintenance
            </Button>
          )}
        </Empty>
      ) : (
        <Table<Downtime>
          rowKey="id"
          dataSource={paginatedItems}
          columns={columns}
          loading={isFetching}
          size="small"
          className={styles.table}
          scroll={{ x: 'max-content' }}
          tableLayout="fixed"
          pagination={{
            current: page,
            pageSize,
            total: filteredItems.length,
            showSizeChanger: true,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            },
          }}
        />
      )}

      {/* 5. Schedule Modal */}
      <ScheduleDowntimeModal
        open={scheduleModalOpen}
        resourceType={resourceType}
        resourceId={resourceId}
        resourceName={resourceName}
        onClose={() => setScheduleModalOpen(false)}
        onSuccess={() => void refetch()}
      />
    </div>
  );
};

export default DowntimeTab;
