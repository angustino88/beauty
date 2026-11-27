import { CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Drawer, Empty, Grid, Segmented, Skeleton } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatBookingCountdown } from '../slotWatchMapper';
import { useGetSlotWatchesQuery } from '../slotWatchApi';
import type { BenchBookingItem } from '../types';
import { SlotAlertModal } from './SlotAlertModal';
import { SlotAlertRow } from './SlotAlertRow';
import { SlotAlertsEmpty } from './SlotAlertsEmpty';
import { benchLabel, useNextBookings } from './useNextBookings';
import { useRecentlyNotified } from './useRecentlyNotified';
import styles from './SlotAlerts.module.css';

export type UpNextTab = 'bookings' | 'alerts';

function BookingRow({ booking }: { booking: BenchBookingItem }) {
  const live = dayjs(booking.starts_at).isBefore(dayjs());
  const countdown = formatBookingCountdown(booking.starts_at, booking.ends_at);
  const soon = !live && dayjs(booking.starts_at).diff(dayjs(), 'minute') < 60;
  return (
    <div className={styles.bookingRow} data-live={live}>
      <span className={styles.icon} data-phase={live ? 'watching' : 'upcoming'} aria-hidden>
        <CalendarOutlined />
      </span>
      <div className={styles.body}>
        <div className={styles.title}>
          <span className={styles.titleText}>{benchLabel(booking)}</span>
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

type Props = { open: boolean; onClose: () => void; initialTab?: UpNextTab };

/** Everything behind the Dashboard's Up next bar: your bookings and your slot alerts, with full detail. */
export function UpNextDrawer({ open, onClose, initialTab = 'bookings' }: Props) {
  const [tab, setTab] = useState<UpNextTab>(initialTab);
  const [creating, setCreating] = useState(false);
  const screens = Grid.useBreakpoint();
  const { data: active, isLoading: alertsLoading } = useGetSlotWatchesQuery({ status: 'active' }, { skip: !open });
  const { recent, dismiss } = useRecentlyNotified(open);
  const { bookings, isLoading: bookingsLoading } = useNextBookings();
  const alerts = [...recent, ...(active ?? [])];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      afterOpenChange={(visible) => visible && setTab(initialTab)}
      placement={screens.sm === false ? 'bottom' : 'right'}
      size={screens.sm === false ? '85vh' : 460}
      title="Up next"
      extra={
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
          New alert
        </Button>
      }
    >
      <Segmented
        block
        value={tab}
        onChange={(value) => setTab(value as UpNextTab)}
        options={[
          { label: `Bookings${bookings.length ? ` (${bookings.length})` : ''}`, value: 'bookings' },
          { label: `Alerts${active?.length ? ` (${active.length})` : ''}`, value: 'alerts' },
        ]}
        style={{ marginBottom: 14 }}
      />
      {tab === 'bookings' ? (
        bookingsLoading ? (
          <Skeleton active />
        ) : bookings.length ? (
          <div className={styles.list}>
            {bookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <Empty description="No bookings in the next 7 days">
            <Link to="/booking-calendar">
              <Button type="primary">Book a bench</Button>
            </Link>
          </Empty>
        )
      ) : alertsLoading ? (
        <Skeleton active />
      ) : alerts.length ? (
        <div className={styles.list}>
          {alerts.map((watch) => (
            <SlotAlertRow key={watch.id} watch={watch} onDismiss={dismiss} />
          ))}
        </div>
      ) : (
        <SlotAlertsEmpty onCreate={() => setCreating(true)} />
      )}
      <SlotAlertModal open={creating} onClose={() => setCreating(false)} />
    </Drawer>
  );
}

export default UpNextDrawer;
