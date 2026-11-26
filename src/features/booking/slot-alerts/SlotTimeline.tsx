import { Tooltip } from 'antd';
import { formatAlertTime, type SlotAvailability, timelineSegments } from '../slotWatchMapper';
import styles from './SlotAlerts.module.css';

const LABEL = { busy: 'Booked', mine: 'Your booking', free: 'Free' } as const;

/** Mini timeline of the watched time: booked (anonymous), your own bookings, and free gaps. */
export function SlotTimeline({ availability }: { availability: SlotAvailability }) {
  const segments = timelineSegments(availability);
  const summary = segments
    .map((s) => `${LABEL[s.kind]} ${formatAlertTime(s.startsAt)}–${formatAlertTime(s.endsAt)}`)
    .join(', ');
  return (
    <div className={styles.timeline}>
      <div className={styles.timelineBar} role="img" aria-label={`Bench schedule: ${summary}`}>
        {segments.map((segment) => (
          <Tooltip
            key={`${segment.kind}-${segment.startsAt}`}
            title={`${LABEL[segment.kind]} · ${formatAlertTime(segment.startsAt)} – ${formatAlertTime(segment.endsAt)}`}
          >
            <span
              className={styles.timelineSegment}
              data-kind={segment.kind}
              style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
            />
          </Tooltip>
        ))}
      </div>
      <div className={styles.timelineScale} aria-hidden>
        <span>{formatAlertTime(availability.windowStartsAt)}</span>
        <span>{formatAlertTime(availability.windowEndsAt)}</span>
      </div>
    </div>
  );
}

export default SlotTimeline;
