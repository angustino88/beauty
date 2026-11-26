import { BellOutlined, CheckCircleOutlined, CloseOutlined, EyeOutlined, HourglassOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { notify } from '@/shared/notifications';
import { extractBookingErrorMessage } from '@/shared/utils/booking';
import { alertPhase, formatAlertTime, formatAlertWindow, type ISlotWatch } from '../slotWatchMapper';
import { useCancelSlotWatchMutation } from '../slotWatchApi';
import styles from './SlotAlerts.module.css';

type Phase = 'following' | 'watching' | 'upcoming' | 'notified';

const LABELS: Record<Phase, string> = {
  following: 'Following',
  watching: 'Watching',
  upcoming: 'Scheduled',
  notified: 'Notified',
};

const ICONS: Record<Phase, React.ReactNode> = {
  following: <HourglassOutlined />,
  watching: <EyeOutlined />,
  upcoming: <BellOutlined />,
  notified: <CheckCircleOutlined />,
};

function phaseOf(watch: ISlotWatch): Phase {
  if (watch.status === 'fulfilled') return 'notified';
  if (watch.followedBookingId !== null) return 'following';
  return alertPhase(watch.startsAt);
}

function describe(watch: ISlotWatch, phase: Phase): string {
  if (phase === 'notified') return `Alert sent ${watch.updatedAt ? formatAlertTime(watch.updatedAt) : ''}`.trim();
  if (phase === 'following') return `Booking ends ${formatAlertTime(watch.endsAt)} · one alert`;
  return formatAlertWindow(watch.startsAt, watch.endsAt);
}

type Props = { watch: ISlotWatch; onDismiss?: (id: number) => void };

export function SlotAlertRow({ watch, onDismiss }: Props) {
  const [cancel, { isLoading }] = useCancelSlotWatchMutation();
  const phase = phaseOf(watch);
  const calendarLink = watch.benchId ? `/booking-calendar?bench_ids=${watch.benchId}` : '/booking-calendar';

  const stop = async () => {
    try {
      await cancel(watch.id).unwrap();
      notify.success('Alert stopped', { description: `You won't be notified about ${watch.benchName}.` });
    } catch (error) {
      notify.error("Couldn't stop the alert", { description: extractBookingErrorMessage(error) });
    }
  };

  return (
    <div className={styles.row} data-phase={phase}>
      <span className={styles.icon} data-phase={phase} aria-hidden>
        {ICONS[phase]}
      </span>
      <div className={styles.body}>
        <div className={styles.title}>
          <Link to={calendarLink} className={styles.titleText} title={`Open ${watch.benchName} in the booking calendar`}>
            {watch.benchName}
          </Link>
          <span className={styles.badge} data-phase={phase}>
            {LABELS[phase]}
          </span>
        </div>
        <div className={styles.meta}>{describe(watch, phase)}</div>
      </div>
      {phase === 'notified' ? (
        <div className={styles.rowActions}>
          <Link to={calendarLink}>
            <Button size="small" type="primary">
              Book
            </Button>
          </Link>
          {onDismiss && (
            <Tooltip title="Dismiss">
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                aria-label="Dismiss"
                onClick={() => onDismiss(watch.id)}
              />
            </Tooltip>
          )}
        </div>
      ) : (
        <Popconfirm
          title={phase === 'following' ? 'Stop following this booking?' : 'Stop this alert?'}
          okText="Stop"
          cancelText="Keep"
          onConfirm={stop}
        >
          <Tooltip title="Stop alert">
            <Button type="text" size="small" icon={<CloseOutlined />} loading={isLoading} aria-label="Stop alert" />
          </Tooltip>
        </Popconfirm>
      )}
    </div>
  );
}

export default SlotAlertRow;
