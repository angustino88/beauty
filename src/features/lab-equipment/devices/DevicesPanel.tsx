import { useMemo, useState } from 'react';
import { Alert, Button, Input, Segmented, Table, Tag, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useGetComputingAgentsQuery, liveAgentsByEquipment } from '../agents';
import { agentStatus } from '../agents/agentModel';
import { StatusBadge } from '@/shared/components/StatusBadge';
import {
  DEVICE_CONNECTIONS_PAGE_SIZE,
  useDeleteExpectedDeviceMutation,
  useGetDeviceConnectionsQuery,
  useGetDeviceConnectionSummaryQuery,
  useGetExpectedDevicesQuery,
} from './devicesApi';
import { clampPage, computingRowSpans, deviceConnectionPresentation, formatObserved } from './devicePresentation';
import { DeviceDetailDrawer } from './DeviceDetailDrawer';
import { DeviceDot, ToneBadge } from './DeviceBits';
import type { DeviceConnection } from './types';
import styles from './Devices.module.css';

type FilterKey = 'all' | 'attention' | 'connected' | 'unplugged';
const POLLING_INTERVAL_MS = 30_000;

const FILTERS: Record<FilterKey, { label: string; state?: 'connected' | 'disconnected'; isAttentionRequired?: boolean }> = {
  all: { label: 'All' },
  attention: { label: 'Needs attention', isAttentionRequired: true },
  connected: { label: 'Connected', state: 'connected' },
  unplugged: { label: 'Unplugged', state: 'disconnected' },
};

export interface DevicesPanelProps {
  /** Bench (lab) selected in the page filter. */
  benchId?: number;
  /** Narrows the list to one computing unit, e.g. when opened from the equipment table. */
  computingId?: number;
  onClearComputing?: () => void;
  onViewEvents?: (computing: { id: number; name: string }) => void;
}

function SummaryTiles({ benchId }: { benchId?: number }) {
  const { data } = useGetDeviceConnectionSummaryQuery(
    { benchId },
    { pollingInterval: POLLING_INTERVAL_MS, skipPollingIfUnfocused: true },
  );
  const value = (count: number | undefined) => (count === undefined ? '—' : count);
  return (
    <section aria-label="Device summary" className={styles.tiles}>
      <div className={styles.tile}>
        <span className={styles.tileLabel}>Connected now</span>
        <span className={styles.tileValue}>{value(data?.connected)}</span>
        <span className={styles.tileHint}>on {value(data?.computing_units)} computing units</span>
      </div>
      <div className={`${styles.tile} ${styles.tileWarn}`}>
        <span className={styles.tileLabel}>Needs matching</span>
        <span className={styles.tileValue}>{value(data?.needs_matching)}</span>
        <span className={styles.tileHint}>not in inventory, ambiguous or wrong interface</span>
      </div>
      <div className={styles.tile}>
        <span className={styles.tileLabel}>Unconfirmed</span>
        <span className={styles.tileValue}>{value(data?.unconfirmed)}</span>
        <span className={styles.tileHint}>agent stopped reporting or was re-enrolled</span>
      </div>
      <div className={`${styles.tile} ${styles.tileDanger}`}>
        <span className={styles.tileLabel}>Expected but missing</span>
        <span className={styles.tileValue}>{value(data?.missing)}</span>
        <span className={styles.tileHint}>agent reporting, device not connected</span>
      </div>
    </section>
  );
}

function MissingDevices({ benchId, computingId }: { benchId?: number; computingId?: number }) {
  const { data } = useGetExpectedDevicesQuery(
    { benchId, computingId, presence: 'missing', pageSize: 10 },
    { pollingInterval: POLLING_INTERVAL_MS, skipPollingIfUnfocused: true },
  );
  const [remove] = useDeleteExpectedDeviceMutation();
  const rows = data?.data ?? [];
  if (rows.length === 0) return null;
  const total = data?.meta.pagination.count ?? rows.length;
  return (
    <section className={styles.missing} aria-labelledby="missing-title">
      <h2 id="missing-title" className={styles.missingTitle}>Expected but missing · {total}</h2>
      {rows.map((row) => (
        <div key={row.id} className={styles.missingRow}>
          <strong>{row.equipment.name}</strong>
          <span>on {row.computing.name}{row.bench ? ` · Bench ${row.bench.name}` : ''}</span>
          <span className={styles.muted}>{row.last_seen_at ? `Unplugged since ${formatObserved(row.last_seen_at)}` : 'Never reported on this unit'}</span>
          {row.is_disconnect_alert_enabled && <Tag color="purple">Alert on</Tag>}
          <Button
            size="small"
            type="link"
            style={{ marginLeft: 'auto' }}
            onClick={() => remove(row.id).unwrap().then(() => message.success('No longer expected')).catch(() => message.error('Could not update'))}
          >
            Stop expecting
          </Button>
        </div>
      ))}
    </section>
  );
}

export function DevicesPanel({ benchId, computingId, onClearComputing, onViewEvents }: DevicesPanelProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const { state, isAttentionRequired } = FILTERS[filter];
  const { currentData, error, isFetching, isError, refetch } = useGetDeviceConnectionsQuery(
    { benchId, computingId, state, isAttentionRequired, q, page },
    { pollingInterval: POLLING_INTERVAL_MS, skipPollingIfUnfocused: true },
  );
  const rows = useMemo(() => currentData?.data ?? [], [currentData]);
  const pagination = currentData?.meta.pagination;

  // Rows can disappear between polls; keep the reader on a page that exists.
  const pageIsOutOfRange = error !== undefined && 'status' in error && error.status === 404 && page > 1;
  const targetPage = pageIsOutOfRange ? 1 : pagination ? clampPage(page, pagination.count, pagination.page_size) : page;
  if (targetPage !== page) setPage(targetPage);

  const computingIds = useMemo(() => [...new Set(rows.map((row) => row.computing.id))], [rows]);
  const { data: agentsData } = useGetComputingAgentsQuery(
    { equipmentIds: computingIds, liveOnly: true },
    { skip: computingIds.length === 0, pollingInterval: 60_000, skipPollingIfUnfocused: true },
  );
  const agents = useMemo(() => liveAgentsByEquipment(agentsData?.data ?? []), [agentsData]);
  const spans = useMemo(() => computingRowSpans(rows), [rows]);

  const columns: ColumnsType<DeviceConnection> = [
    {
      title: 'Computing unit',
      key: 'computing',
      width: 220,
      onCell: (_row, index) => ({ rowSpan: spans[index ?? 0] }),
      render: (_value, row) => {
        const status = agentStatus(agents.get(row.computing.id));
        return (
          <div className={styles.computingCell}>
            <strong>{row.computing.name}</strong>
            {row.bench && <span className={styles.muted}>Bench {row.bench.name}</span>}
            <StatusBadge tone={status.tone} label={`Agent ${status.label.toLowerCase()}`} title={status.hint} fit />
            {onViewEvents && (
              <Button size="small" type="link" style={{ padding: 0 }} onClick={() => onViewEvents(row.computing)}>
                View events
              </Button>
            )}
          </div>
        );
      },
    },
    {
      title: 'Device',
      key: 'device',
      render: (_value, row) => {
        const presentation = deviceConnectionPresentation(row, !isError);
        return (
          <div className={styles.deviceCell}>
            <DeviceDot dot={presentation.dot} />
            <div className={styles.rowText}>
              <span className={styles.rowName}>{presentation.title}</span>
              <span className={styles.rowMeta}>{presentation.meta || '—'}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Connection',
      key: 'state',
      width: 190,
      render: (_value, row) => {
        const presentation = deviceConnectionPresentation(row, !isError);
        return <ToneBadge tone={presentation.connectionTone} label={presentation.connectionLabel} title={presentation.freshnessDescription} />;
      },
    },
    {
      title: 'Inventory',
      key: 'match',
      width: 170,
      render: (_value, row) => {
        const presentation = deviceConnectionPresentation(row);
        return <ToneBadge tone={presentation.matchTone} label={presentation.matchLabel} title={presentation.matchDescription} />;
      },
    },
    {
      title: 'Last observed',
      key: 'observed',
      width: 150,
      render: (_value, row) => (
        <Tooltip title={dayjs(row.observed_at).format('DD MMM YYYY, HH:mm:ss')}>
          <time dateTime={row.observed_at}>{formatObserved(row.observed_at)}</time>
        </Tooltip>
      ),
    },
    {
      title: <span className={styles.srOnly}>Action</span>,
      key: 'action',
      width: 110,
      align: 'right',
      render: (_value, row) => {
        const { canLink } = deviceConnectionPresentation(row);
        return (
          <Button
            size="small"
            type={canLink ? 'primary' : 'default'}
            ghost={canLink}
            onClick={(event) => { event.stopPropagation(); setOpenId(row.id); }}
          >
            {canLink ? 'Link' : 'Details'}
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SummaryTiles benchId={benchId} />
      <MissingDevices benchId={benchId} computingId={computingId} />
      <div className={styles.toolbar}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <Segmented<FilterKey>
            value={filter}
            onChange={(value) => { setFilter(value); setPage(1); }}
            options={(Object.keys(FILTERS) as FilterKey[]).map((key) => ({ value: key, label: FILTERS[key].label }))}
          />
          {computingId !== undefined && (
            <Tag closable onClose={onClearComputing} color="purple">
              {rows[0]?.computing.name ?? `Computing #${computingId}`}
            </Tag>
          )}
        </div>
        <Input.Search
          allowClear
          placeholder="Device, serial or computing unit"
          aria-label="Search devices"
          style={{ width: 300, maxWidth: '100%' }}
          onSearch={(value) => { setQ(value.trim()); setPage(1); }}
        />
      </div>
      {isError && (
        <Alert
          type="error"
          showIcon
          title="Could not refresh devices"
          description={currentData ? 'Showing the last loaded data; connection state is unconfirmed.' : undefined}
          action={<Button size="small" onClick={() => void refetch()}>Retry</Button>}
        />
      )}
      <Table<DeviceConnection>
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={rows}
        loading={isFetching && !currentData}
        scroll={{ x: 980 }}
        onRow={(row) => ({ onClick: () => setOpenId(row.id), style: { cursor: 'pointer' } })}
        locale={{ emptyText: 'No devices match these filters' }}
        pagination={{
          current: page,
          pageSize: pagination?.page_size ?? DEVICE_CONNECTIONS_PAGE_SIZE,
          total: pagination?.count ?? 0,
          showSizeChanger: false,
          showTotal: (total) => `${total} devices`,
          onChange: setPage,
        }}
      />
      <p className={styles.footnote} style={{ margin: 0 }}>
        Unconfirmed rows keep their last reported state until the agent reports again; losing the agent never proves a device was unplugged.
      </p>
      <DeviceDetailDrawer connectionId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
