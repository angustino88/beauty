import { BellOutlined, CalendarOutlined, PlusOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Grid, Popover, Skeleton } from 'antd';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetSlotWatchesQuery } from '../slotWatchApi';
import { buildUpNextItems, type UpNextItem, visibleCount } from '../upNext';
import { SlotAlertModal } from './SlotAlertModal';
import { SlotAlertRow } from './SlotAlertRow';
import { useNextBookings } from './useNextBookings';
import styles from './UpNextTiles.module.css';

function TileBody({ item }: { item: UpNextItem }) {
  return (
    <>
      <span className={styles.tileIcon} data-kind={item.kind} data-tone={item.tone} aria-hidden>
        {item.kind === 'booking' ? <CalendarOutlined /> : <BellOutlined />}
      </span>
      <span className={styles.tileText}>
        <span className={styles.tileTitle}>{item.title}</span>
        <span className={styles.tileStatus} data-tone={item.tone}>
          {item.status}
        </span>
      </span>
    </>
  );
}

function Tile({ item }: { item: UpNextItem }) {
  const label = `${item.kind === 'booking' ? 'Your booking' : 'Alert'}: ${item.title}, ${item.status}`;
  if (item.to) {
    return (
      <Link to={item.to} className={styles.tile} data-tone={item.tone} aria-label={label}>
        <TileBody item={item} />
      </Link>
    );
  }
  // Alerts that are not free yet open their details (timeline, others watching, stop) in place.
  return (
    <Popover
      trigger="click"
      placement="bottom"
      arrow={false}
      destroyOnHidden
      content={item.kind === 'alert' ? <div className={styles.popover}><SlotAlertRow watch={item.watch} /></div> : null}
    >
      <button type="button" className={styles.tile} data-tone={item.tone} aria-label={label} aria-haspopup="dialog">
        <TileBody item={item} />
      </button>
    </Popover>
  );
}

/**
 * Dashboard "Up next": your bookings and slot alerts as compact tiles in one row, most urgent first.
 * When there are more than fit, the last tile is "+N" and expands the rest in place.
 */
export function UpNextTiles() {
  const [expanded, setExpanded] = useState(false);
  const [creating, setCreating] = useState(false);
  const screens = Grid.useBreakpoint();
  // Tiles per row; phones get one full-width column with up to three rows (two items + "+N more").
  const columns = screens.xl ? 5 : screens.lg ? 4 : screens.md ? 3 : screens.sm ? 2 : 1;
  const slots = columns === 1 ? 3 : columns;
  const { data: alerts, isLoading: alertsLoading } = useGetSlotWatchesQuery({ status: 'active' });
  const { summaries, isLoading: bookingsLoading } = useNextBookings();
  const [now] = useState(() => new Date());
  const items = useMemo(() => buildUpNextItems(summaries, alerts ?? [], now), [summaries, alerts, now]);
  const shown = visibleCount(items.length, slots, expanded);
  const hidden = items.length - shown;

  const newAlert = (
    <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
      New alert
    </Button>
  );

  return (
    <section className={styles.section} aria-labelledby="up-next-label">
      <div className={styles.header}>
        <h2 id="up-next-label" className={styles.label}>
          Up next
        </h2>
        {newAlert}
      </div>
      {alertsLoading || bookingsLoading ? (
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: slots }, (_, index) => (
            <Skeleton.Button key={index} active block style={{ height: 58 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          No bookings or alerts coming up. Bench busy? <button type="button" onClick={() => setCreating(true)}>Get an alert when it frees up</button>.
        </p>
      ) : (
        <div
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          aria-live="polite"
        >
          {items.slice(0, shown).map((item) => (
            <Tile key={item.key} item={item} />
          ))}
          {hidden > 0 && (
            <button
              type="button"
              className={`${styles.tile} ${styles.more}`}
              onClick={() => setExpanded(true)}
              aria-label={`Show ${hidden} more`}
            >
              +{hidden} more
            </button>
          )}
          {expanded && items.length > slots && (
            <button type="button" className={`${styles.tile} ${styles.more}`} onClick={() => setExpanded(false)}>
              <UpOutlined aria-hidden /> Show less
            </button>
          )}
        </div>
      )}
      <SlotAlertModal open={creating} onClose={() => setCreating(false)} />
    </section>
  );
}

export default UpNextTiles;
