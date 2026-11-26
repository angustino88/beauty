import { BellOutlined, CloseOutlined, EyeOutlined, HourglassOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Tooltip } from 'antd';
import { notify } from '@/shared/notifications';
import { extractBookingErrorMessage } from '@/shared/utils/booking';
import { alertPhase, formatAlertTime, formatAlertWindow, type ISlotWatch } from '../slotWatchMapper';
import { useCancelSlotWatchMutation } from '../slotWatchApi';
import styles from './SlotAlerts.module.css';

export function SlotAlertRow({ watch }: { watch: ISlotWatch }) {
  const [cancel, { isLoading }] = useCancelSlotWatchMutation();
  const isFollow = watch.followedBookingId !== null;
  const phase = isFollow ? 'following' : alertPhase(watch.startsAt);
  const label = { following: 'Following', watching: 'Watching', upcoming: 'Scheduled' }[phase];

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
        {isFollow ? <HourglassOutlined /> : phase === 'watching' ? <EyeOutlined /> : <BellOutlined />}
      </span>
      <div className={styles.body}>
        <div className={styles.title}>
          <span className={styles.titleText}>{watch.benchName}</span>
          <span className={styles.badge} data-phase={phase}>
            {label}
          </span>
        </div>
        <div className={styles.meta}>
          {isFollow
            ? `Ends ${formatAlertTime(watch.endsAt)} · alerts once when free`
            : formatAlertWindow(watch.startsAt, watch.endsAt)}
        </div>
      </div>
      <Popconfirm title={isFollow ? 'Stop following this booking?' : 'Stop this slot alert?'} okText="Stop alert" cancelText="Keep" onConfirm={stop}>
        <Tooltip title="Stop alert">
          <Button type="text" size="small" icon={<CloseOutlined />} loading={isLoading} aria-label="Stop alert" />
        </Tooltip>
      </Popconfirm>
    </div>
  );
}

export default SlotAlertRow;
