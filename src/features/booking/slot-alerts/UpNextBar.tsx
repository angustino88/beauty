import { BellOutlined, CalendarOutlined, CheckCircleFilled, ClockCircleFilled, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Skeleton, Tooltip } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetSlotWatchesQuery } from '../slotWatchApi';
import { pickHeadline } from '../upNext';
import { SlotAlertModal } from './SlotAlertModal';
import { UpNextDrawer, type UpNextTab } from './UpNextDrawer';
import { useNextBookings } from './useNextBookings';
import styles from './SlotAlerts.module.css';

const TONE_ICON = {
  free: <CheckCircleFilled />,
  soon: <ClockCircleFilled />,
  neutral: <CalendarOutlined />,
} as const;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * Dashboard "Up next": one quiet line with the single most important personal item (a bench free now, a booking
 * about to start, ...). Everything else is one click away in the Up next panel.
 */
export function UpNextBar() {
  const [drawerTab, setDrawerTab] = useState<UpNextTab | null>(null);
  const [creating, setCreating] = useState(false);
  const { data: alerts, isLoading: alertsLoading } = useGetSlotWatchesQuery({ status: 'active' });
  const { summaries, isLoading: bookingsLoading } = useNextBookings();
  const [now] = useState(() => new Date());
  const headline = pickHeadline(summaries, alerts ?? [], now);
  const bookingCount = summaries.length;
  const alertCount = alerts?.length ?? 0;

  const overlays = (
    <>
      <UpNextDrawer open={drawerTab !== null} initialTab={drawerTab ?? 'bookings'} onClose={() => setDrawerTab(null)} />
      <SlotAlertModal open={creating} onClose={() => setCreating(false)} />
    </>
  );

  if (alertsLoading || bookingsLoading) {
    return (
      <section className={styles.strip} aria-busy="true">
        <Skeleton.Input active size="small" block />
      </section>
    );
  }

  if (!headline) {
    return (
      <section className={styles.strip} aria-label="Up next">
        <span className={styles.stripIcon} aria-hidden>
          <BellOutlined />
        </span>
        <span className={styles.stripText}>
          <strong>Bench busy?</strong> Get an alert the moment it frees up.
        </span>
        <Button size="small" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
          New alert
        </Button>
        {overlays}
      </section>
    );
  }

  return (
    <section className={styles.strip} data-tone={headline.tone} aria-label="Up next">
      <span className={styles.stripIcon} data-tone={headline.tone} aria-hidden>
        {TONE_ICON[headline.tone]}
      </span>
      <span className={styles.stripText}>
        <strong>{headline.title}</strong>
        <span className={styles.stripDetail}>{headline.detail}</span>
      </span>
      {headline.action && (
        <Link to={headline.action.to}>
          <Button size="small" type={headline.tone === 'free' ? 'primary' : 'default'}>
            {headline.action.label}
          </Button>
        </Link>
      )}
      <span className={styles.stripDivider} aria-hidden />
      <Button
        size="small"
        type="text"
        className={styles.stripLink}
        onClick={() => setDrawerTab(bookingCount === 0 && alertCount > 0 ? 'alerts' : 'bookings')}
      >
        {[bookingCount ? plural(bookingCount, 'booking') : null, alertCount ? plural(alertCount, 'alert') : null]
          .filter(Boolean)
          .join(' · ') || 'Up next'}{' '}
        <RightOutlined />
      </Button>
      <Tooltip title="New slot alert">
        <Button
          size="small"
          type="text"
          className={styles.stripPlus}
          icon={<PlusOutlined />}
          aria-label="New slot alert"
          onClick={() => setCreating(true)}
        />
      </Tooltip>
      {overlays}
    </section>
  );
}

export default UpNextBar;
