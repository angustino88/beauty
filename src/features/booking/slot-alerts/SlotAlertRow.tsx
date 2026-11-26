import { BellOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Tooltip } from 'antd';
import { notify } from '@/shared/notifications';
import { extractBookingErrorMessage } from '@/shared/utils/booking';
import { alertPhase, formatAlertWindow, type ISlotWatch } from '../slotWatchMapper';
import { useCancelSlotWatchMutation } from '../slotWatchApi';
import styles from './SlotAlerts.module.css';

export function SlotAlertRow({ watch }: { watch: ISlotWatch }) {
  const [cancel, { isLoading }] = useCancelSlotWatchMutation();
  const phase = alertPhase(watch.startsAt);

  const stop = async () => {
    try {
      await cancel(watch.id).unwrap();
      notify.success('Slot alert stopped');
    } catch (error) {
      notify.error("Couldn't stop the slot alert", { description: extractBookingErrorMessage(error) });
    }
  };

  return (
    <div className={styles.row}>
      <span className={styles.icon} data-phase={phase} aria-hidden>
        {phase === 'watching' ? <EyeOutlined /> : <BellOutlined />}
      </span>
      <div className={styles.body}>
        <div className={styles.title}>
          <span className={styles.titleText}>{watch.benchName}</span>
          <span className={styles.badge} data-phase={phase}>
            {phase === 'watching' ? 'Watching' : 'Scheduled'}
          </span>
        </div>
        <div className={styles.meta}>{formatAlertWindow(watch.startsAt, watch.endsAt)}</div>
      </div>
      <Popconfirm title="Stop this slot alert?" okText="Stop alert" cancelText="Keep" onConfirm={stop}>
        <Tooltip title="Stop alert">
          <Button type="text" size="small" icon={<CloseOutlined />} loading={isLoading} aria-label="Stop alert" />
        </Tooltip>
      </Popconfirm>
    </div>
  );
}

export default SlotAlertRow;
