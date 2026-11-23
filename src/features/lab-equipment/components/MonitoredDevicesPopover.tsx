import { useState } from 'react';
import { Button, Empty, Popover, Spin } from 'antd';
import { InlineAlert } from '@/shared/notifications';
import { RadarChartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useGetDeviceConnectionsQuery } from '../devices/devicesApi';
import { connectionCounts, deviceConnectionPresentation, formatObserved } from '../devices/devicePresentation';
import { DeviceDetailDrawer } from '../devices/DeviceDetailDrawer';
import { DeviceDot } from '../devices/DeviceBits';
import type { DeviceConnection } from '../devices/types';
import tableStyles from '../shared/components/layout/InventoryPresentation.module.css';
import styles from '../devices/Devices.module.css';

const POLLING_INTERVAL_MS = 30_000;
/** One popover page; the full list lives in Lab Monitoring. */
const POPOVER_PAGE_SIZE = 20;

function DeviceRow({ connection, isAvailable, onOpen }: { connection: DeviceConnection; isAvailable: boolean; onOpen: () => void }) {
  const presentation = deviceConnectionPresentation(connection, isAvailable);
  const disconnected = presentation.dot === 'disconnected';
  return (
    <li>
      <button type="button" className={styles.row} onClick={onOpen} title={presentation.matchDescription}>
        <DeviceDot dot={presentation.dot} />
        <span className={styles.rowText}>
          <span className={`${styles.rowName} ${disconnected ? styles.rowNameMuted : ''}`}>{presentation.title}</span>
          <span className={styles.rowMeta}>{presentation.meta || connection.interface_name}</span>
        </span>
        {connection.match_status.value !== 'matched' ? (
          <span className={`${styles.count} ${styles.countWarn}`}>{presentation.canLink ? 'Match' : presentation.matchLabel}</span>
        ) : (
          <span className={styles.rowAside}>{formatObserved(connection.observed_at)}</span>
        )}
      </button>
    </li>
  );
}

export default function MonitoredDevicesPopover({ computingId, computingName }: { computingId: number; computingName?: string }) {
  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const { currentData, isFetching, isError, refetch } = useGetDeviceConnectionsQuery(
    { computingId, page: 1, pageSize: POPOVER_PAGE_SIZE },
    { skip: !open, pollingInterval: open ? POLLING_INTERVAL_MS : 0, skipPollingIfUnfocused: true },
  );
  const rows = currentData?.data ?? [];
  const total = currentData?.meta.pagination.count ?? 0;
  const connected = rows.filter((row) => row.state.value === 'connected');
  const unplugged = rows.filter((row) => row.state.value !== 'connected');
  const counts = connectionCounts(rows);
  const isFresh = !isError && rows.some((row) => row.freshness.value === 'fresh');
  const first = rows[0];
  const name = first?.computing.name ?? computingName ?? 'Computing unit';
  const openDetail = (id: number) => { setOpen(false); setOpenId(id); };

  const content = (
    <div className={styles.popover} aria-busy={isFetching} aria-live="polite">
      <header className={styles.popHeader}>
        <div className={styles.popTitleRow}>
          <div style={{ minWidth: 0 }}>
            <h2 className={styles.popTitle}>Devices</h2>
            <span className={styles.popSubtitle}>{[name, first?.bench ? `Bench ${first.bench.name}` : ''].filter(Boolean).join(' · ')}</span>
          </div>
          {rows.length > 0 && (
            <span className={`${styles.live} ${isFresh ? '' : styles.liveStale}`}>
              <span className={`${styles.dot} ${isFresh ? styles.dotConnected : styles.dotUnconfirmed}`} aria-hidden="true" />
              {isFresh ? 'Live' : 'Unconfirmed'}
            </span>
          )}
        </div>
        {rows.length > 0 && (
          <div className={styles.counts}>
            <span className={`${styles.count} ${styles.countGood}`}>{counts.connected} connected</span>
            {counts.toMatch > 0 && <span className={`${styles.count} ${styles.countWarn}`}>{counts.toMatch} to match</span>}
            {counts.unplugged > 0 && <span className={`${styles.count} ${styles.countMuted}`}>{counts.unplugged} unplugged</span>}
          </div>
        )}
      </header>

      {isError && (
        <InlineAlert
          variant="error"
          compact
          style={{ marginTop: 10 }}
          title="Unable to load monitored devices"
          description={currentData ? 'Showing the last loaded data.' : undefined}
          action={<Button size="small" onClick={() => void refetch()} loading={isFetching}>Retry</Button>}
        />
      )}
      {isFetching && !currentData && <Spin description="Loading devices"><div style={{ minHeight: 80 }} /></Spin>}
      {!isFetching && !isError && rows.length === 0 && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No devices reported yet" />
      )}

      {connected.length > 0 && (
        <ul className={styles.list} aria-label="Connected devices">
          {connected.map((row) => <DeviceRow key={row.id} connection={row} isAvailable={!isError} onOpen={() => openDetail(row.id)} />)}
        </ul>
      )}
      {unplugged.length > 0 && (
        <>
          <div className={styles.section}>Unplugged</div>
          <ul className={styles.list} aria-label="Unplugged devices">
            {unplugged.map((row) => <DeviceRow key={row.id} connection={row} isAvailable={!isError} onOpen={() => openDetail(row.id)} />)}
          </ul>
        </>
      )}

      <footer className={styles.popFooter}>
        <Link to={`/lab-monitoring?tab=events&computing=${computingId}`}>Events</Link>
        <Link to={`/lab-monitoring?tab=devices&computing=${computingId}`}>
          {total > rows.length ? `All ${total} in Lab Monitoring` : 'Open in Lab Monitoring'}
        </Link>
      </footer>
    </div>
  );

  return (
    <>
      <Popover placement="right" trigger="click" open={open} onOpenChange={setOpen} content={content}>
        <button
          type="button"
          className={tableStyles.informationButton}
          aria-label={`Devices of ${computingName ?? 'this computing unit'}`}
          title="View monitored devices"
          onClick={(event) => event.stopPropagation()}
        >
          <RadarChartOutlined />
        </button>
      </Popover>
      <DeviceDetailDrawer connectionId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
