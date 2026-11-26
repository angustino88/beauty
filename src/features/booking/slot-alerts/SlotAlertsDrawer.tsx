import { BellOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Drawer, Skeleton, Space } from 'antd';
import { useState } from 'react';
import { useGetSlotWatchesQuery } from '../slotWatchApi';
import { SlotAlertModal } from './SlotAlertModal';
import { SlotAlertRow } from './SlotAlertRow';
import { SlotAlertsEmpty } from './SlotAlertsEmpty';
import { useRecentlyNotified } from './useRecentlyNotified';
import styles from './SlotAlerts.module.css';

export type SlotAlertsDrawerProps = { open: boolean; onClose: () => void };

/** All of the user's active slot alerts. */
export function SlotAlertsDrawer({ open, onClose }: SlotAlertsDrawerProps) {
  const [creating, setCreating] = useState(false);
  const { data: active, isLoading } = useGetSlotWatchesQuery({ status: 'active' }, { skip: !open });
  const { recent, dismiss } = useRecentlyNotified(open);
  const watches = [...recent, ...(active ?? [])];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size={440}
      title={
        <Space>
          <BellOutlined />
          Slot alerts
        </Space>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
          New alert
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton active />
      ) : watches.length ? (
        <div className={styles.list}>
          {watches.map((watch) => (
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

export default SlotAlertsDrawer;
