import { BellOutlined, CalendarOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Skeleton } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGetBenchBookingsQuery } from '../api';
import { formatBookingCountdown } from '../slotWatchMapper';
import { useGetSlotWatchesQuery } from '../slotWatchApi';
import type { BenchBookingItem } from '../types';
import { SlotAlertModal } from './SlotAlertModal';
import { SlotAlertRow } from './SlotAlertRow';
import { SlotAlertsDrawer } from './SlotAlertsDrawer';
import { useRecentlyNotified } from './useRecentlyNotified';
import styles from './SlotAlerts.module.css';

const VISIBLE_ALERTS = 3;
const VISIBLE_BOOKINGS = 2;
const ACTIVE = new Set(['reserved', 'in_progress']);

/** The signed-in user's next bookings in the coming week, soonest first. */
function useNextBookings() {
  // Fixed for the page view so the query key stays stable.
  const [window] = useState(() => ({
    after: dayjs().startOf('minute').toISOString(),
    before: dayjs().add(7, 'day').endOf('day').toISOString(),
  }));
  const { data, isLoading } = useGetBenchBookingsQuery({
    view_side: 'my_booking',
    starts_at_after: window.after,
    starts_at_before: window.before,
    page: 1,
    page_size: 20,
  });
  const bookings = useMemo(
    () =>
      (data?.data ?? [])
        .filter((booking) => ACTIVE.has(booking.status) && dayjs(booking.ends_at).isAfter(dayjs()))
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
        .slice(0, VISIBLE_BOOKINGS),
    [data],
  );
  return { bookings, isLoading };
}

function BookingRow({ booking }: { booking: BenchBookingItem }) {
  const countdown = formatBookingCountdown(booking.starts_at, booking.ends_at);
  const live = dayjs(booking.starts_at).isBefore(dayjs());
  const soon = !live && dayjs(booking.starts_at).diff(dayjs(), 'minute') < 60;
  const bench = [booking.bench?.name ?? booking.bench?.sku ?? 'Bench', booking.computer?.computer_name]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className={styles.bookingRow} data-live={live}>
      <span className={styles.icon} data-phase={live ? 'watching' : 'upcoming'} aria-hidden>
        <CalendarOutlined />
      </span>
      <div className={styles.body}>
        <div className={styles.title}>
          <span className={styles.titleText}>{bench}</span>
          {booking.approval_status === 'pending' && (
            <span className={styles.badge} data-phase="following">
              Awaiting approval
            </span>
          )}
        </div>
        <div className={styles.meta}>
          <span className={styles.countdown} data-soon={soon}>
            {countdown}
          </span>
          {/* "In progress · ends 16:00" is complete; "Starts in 25 min" gets the slot; others already show the start. */}
          {live
            ? null
            : countdown.startsWith('Starts in')
              ? ` · ${dayjs(booking.starts_at).format('HH:mm')} – ${dayjs(booking.ends_at).format('HH:mm')}`
              : ` – ${dayjs(booking.ends_at).format('HH:mm')}`}
        </div>
      </div>
      <Link to="/my-bookings">
        <Button size="small">View</Button>
      </Link>
    </div>
  );
}

/**
 * Dashboard "Up next": the user's next bookings and the benches they're waiting for, each with a live view of
 * when it frees up. Collapses to one line when there is nothing to show.
 */
export function SlotAlertsCard() {
  const [creating, setCreating] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { data: active, isLoading: alertsLoading } = useGetSlotWatchesQuery({ status: 'active' });
  const { recent, dismiss } = useRecentlyNotified();
  const { bookings, isLoading: bookingsLoading } = useNextBookings();
  const alerts = [...recent, ...(active ?? [])];
  const activeCount = active?.length ?? 0;

  const modals = (
    <>
      <SlotAlertModal open={creating} onClose={() => setCreating(false)} />
      <SlotAlertsDrawer open={showAll} onClose={() => setShowAll(false)} />
    </>
  );

  if (alertsLoading || bookingsLoading) {
    return (
      <section className={styles.strip} aria-busy="true">
        <Skeleton.Input active size="small" block />
      </section>
    );
  }

  if (alerts.length === 0 && bookings.length === 0) {
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
        {modals}
      </section>
    );
  }

  return (
    <section className={styles.card} aria-labelledby="up-next-title">
      <div className={styles.cardHeader}>
        <h2 id="up-next-title" className={styles.cardTitle}>
          <CalendarOutlined />
          Up next
        </h2>
        <div className={styles.cardActions}>
          {alerts.length > VISIBLE_ALERTS && (
            <Button type="link" size="small" onClick={() => setShowAll(true)}>
              All alerts ({activeCount}) <RightOutlined />
            </Button>
          )}
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
            New alert
          </Button>
        </div>
      </div>

      {bookings.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Your bookings</h3>
          <div className={styles.cardGrid}>
            {bookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Waiting for a bench</h3>
          <div className={styles.cardGrid}>
            {alerts.slice(0, VISIBLE_ALERTS).map((watch) => (
              <SlotAlertRow key={watch.id} watch={watch} onDismiss={dismiss} />
            ))}
          </div>
        </div>
      )}
      {modals}
    </section>
  );
}

export default SlotAlertsCard;
