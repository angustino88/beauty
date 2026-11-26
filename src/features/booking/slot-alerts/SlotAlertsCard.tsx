import { BellOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Skeleton, Space } from 'antd';
import { useState } from 'react';
import { useGetSlotWatchesQuery } from '../slotWatchApi';
import { SlotAlertModal } from './SlotAlertModal';
import { SlotAlertRow } from './SlotAlertRow';
import { SlotAlertsDrawer } from './SlotAlertsDrawer';
import { SlotAlertsEmpty } from './SlotAlertsEmpty';
import styles from './SlotAlerts.module.css';

const VISIBLE = 4;

/** Dashboard card: the user's next slot alerts and a one-click way to add one. */
export function SlotAlertsCard() {
  const [creating, setCreating] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { data: watches, isLoading } = useGetSlotWatchesQuery({ status: 'active' });
  const count = watches?.length ?? 0;

  return (
    <section className={styles.card} aria-labelledby="slot-alerts-title">
      <div className={styles.cardHeader}>
        <div>
          <h2 id="slot-alerts-title" className={styles.cardTitle}>
            <BellOutlined />
            Slot alerts
            {count > 0 && <span className={styles.cardCount}>{count} active</span>}
          </h2>
          <p className={styles.cardSubtitle}>Get notified the moment a busy bench frees up.</p>
        </div>
        <Space>
          {count > VISIBLE && (
            <Button type="link" onClick={() => setShowAll(true)}>
              View all <RightOutlined />
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
            New alert
          </Button>
        </Space>
      </div>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : count ? (
        <div className={styles.cardGrid}>
          {watches!.slice(0, VISIBLE).map((watch) => (
            <SlotAlertRow key={watch.id} watch={watch} />
          ))}
        </div>
      ) : (
        <SlotAlertsEmpty onCreate={() => setCreating(true)} />
      )}
      <SlotAlertModal open={creating} onClose={() => setCreating(false)} />
      <SlotAlertsDrawer open={showAll} onClose={() => setShowAll(false)} />
    </section>
  );
}

export default SlotAlertsCard;
