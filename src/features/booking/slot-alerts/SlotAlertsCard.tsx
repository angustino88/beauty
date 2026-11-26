import { BellOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Skeleton } from 'antd';
import { useState } from 'react';
import { useGetSlotWatchesQuery } from '../slotWatchApi';
import { SlotAlertModal } from './SlotAlertModal';
import { SlotAlertRow } from './SlotAlertRow';
import { SlotAlertsDrawer } from './SlotAlertsDrawer';
import { useRecentlyNotified } from './useRecentlyNotified';
import styles from './SlotAlerts.module.css';

const VISIBLE = 3;

/** Dashboard card: active alerts and recently sent ones; a single line when there are none. */
export function SlotAlertsCard() {
  const [creating, setCreating] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { data: active, isLoading } = useGetSlotWatchesQuery({ status: 'active' });
  const { recent, dismiss } = useRecentlyNotified();
  const rows = [...recent, ...(active ?? [])];
  const activeCount = active?.length ?? 0;

  const modals = (
    <>
      <SlotAlertModal open={creating} onClose={() => setCreating(false)} />
      <SlotAlertsDrawer open={showAll} onClose={() => setShowAll(false)} />
    </>
  );

  if (isLoading) {
    return (
      <section className={styles.strip} aria-busy="true">
        <Skeleton.Input active size="small" block />
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section className={styles.strip} aria-label="Slot alerts">
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
    <section className={styles.card} aria-labelledby="slot-alerts-title">
      <div className={styles.cardHeader}>
        <h2 id="slot-alerts-title" className={styles.cardTitle}>
          <BellOutlined />
          Slot alerts
          {activeCount > 0 && <span className={styles.cardCount}>{activeCount} active</span>}
        </h2>
        <div className={styles.cardActions}>
          {rows.length > VISIBLE && (
            <Button type="link" size="small" onClick={() => setShowAll(true)}>
              View all <RightOutlined />
            </Button>
          )}
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
            New alert
          </Button>
        </div>
      </div>
      <div className={styles.cardGrid}>
        {rows.slice(0, VISIBLE).map((watch) => (
          <SlotAlertRow key={watch.id} watch={watch} onDismiss={dismiss} />
        ))}
      </div>
      {modals}
    </section>
  );
}

export default SlotAlertsCard;
