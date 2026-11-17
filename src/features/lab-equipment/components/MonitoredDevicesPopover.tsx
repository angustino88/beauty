import { useState } from 'react';
import { Alert, Button, Empty, Pagination, Popover, Spin, Tag, Tooltip } from 'antd';
import { RadarChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useGetDeviceConnectionsQuery } from '../api/deviceConnectionsApi';
import { clampPage, deviceConnectionPresentation } from '../shared/utils/deviceConnectionPresentation';
import type { DeviceConnection } from '../types/deviceConnections';
import tableStyles from '../shared/components/layout/InventoryPresentation.module.css';
import styles from './MonitoredDevicesPopover.module.css';

const POLLING_INTERVAL_MS = 30_000;

function Connection({ connection, isAvailable }: { connection: DeviceConnection; isAvailable: boolean }) {
  const presentation = deviceConnectionPresentation(connection, isAvailable);
  return (
    <article className={styles.connection}>
      <div className={styles.title}>{presentation.title}</div>
      <div className={styles.tags}>
        <Tag color={presentation.connectionTone}>{presentation.connectionLabel}</Tag>
        <Tooltip title={presentation.freshnessDescription}>
          <Tag color={presentation.freshnessTone}>{presentation.freshnessLabel}</Tag>
        </Tooltip>
        <Tooltip title={presentation.matchDescription}>
          <Tag color={presentation.matchTone}>{connection.match_status.label}</Tag>
        </Tooltip>
      </div>
      <div className={styles.detail}>{presentation.matchDescription}</div>
      {(!isAvailable || connection.freshness.value !== 'fresh') && <div className={styles.detail}>{presentation.freshnessDescription}</div>}
      <div className={styles.detail}>Interface: {connection.interface?.name || connection.interface_name || 'Unrecognized'} · Collector: {connection.collector_key}</div>
      {connection.serial_number && <div className={styles.detail}>Serial: {connection.serial_number}</div>}
      <div className={styles.detail}>
        Last observed: <time dateTime={connection.observed_at}>{dayjs(connection.observed_at).format('DD MMM YYYY, HH:mm:ss')}</time>
      </div>
    </article>
  );
}

export default function MonitoredDevicesPopover({ computingId }: { computingId: number }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { currentData, error, isFetching, isError, refetch } = useGetDeviceConnectionsQuery(
    { computingId, page },
    { skip: !open, pollingInterval: open ? POLLING_INTERVAL_MS : 0, skipPollingIfUnfocused: true, refetchOnMountOrArgChange: true },
  );
  const connections = currentData?.data ?? [];
  const pagination = currentData?.meta.pagination;

  // Rows can disappear between polls (retention, reconciliation). Keep the reader on a page that
  // exists; adjusting state during render avoids rendering the stale page first.
  const pageIsOutOfRange = error !== undefined && 'status' in error && error.status === 404 && page > 1;
  const targetPage = pageIsOutOfRange ? 1 : pagination ? clampPage(page, pagination.count, pagination.page_size) : page;
  if (targetPage !== page) setPage(targetPage);

  return (
    <Popover
      placement="right"
      trigger="click"
      title="Monitored devices"
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setPage(1);
        setOpen(nextOpen);
      }}
      content={
        <div className={styles.panel} aria-busy={isFetching} aria-live="polite">
          {isError && (
            <Alert
              type="error"
              title="Could not load device connections"
              description={currentData ? 'The displayed observations may be outdated.' : undefined}
              showIcon
              action={<Button size="small" onClick={() => void refetch()} loading={isFetching}>Retry</Button>}
            />
          )}
          {isFetching && !currentData && <Spin description="Loading device connections"><div style={{ minHeight: 80 }} /></Spin>}
          {!isFetching && !isError && connections.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No device observations yet" />}
          {connections.map((connection) => <Connection key={connection.id} connection={connection} isAvailable={!isError} />)}
          {pagination && pagination.count > 0 && (
            <div className={styles.footer}>
              <span>{pagination.count} {pagination.count === 1 ? 'connection' : 'connections'}</span>
              <Pagination
                size="small"
                simple
                current={pagination.page}
                pageSize={pagination.page_size}
                total={pagination.count}
                showSizeChanger={false}
                disabled={isFetching}
                onChange={setPage}
              />
            </div>
          )}
        </div>
      }
    >
      <button type="button" className={tableStyles.informationButton} aria-label="View monitored devices" title="View monitored devices" onClick={(event) => event.stopPropagation()}>
        <RadarChartOutlined />
      </button>
    </Popover>
  );
}
