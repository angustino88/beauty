import { CalendarOutlined } from '@ant-design/icons';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { benchActivityTone } from '@/shared/status/statusTone';

type LabStatusProps = {
  labStatus?: string | { value?: string; label?: string } | null;
  isBooked?: boolean;
};

/**
 * Bench activity status plus, as a separate marker, whether the bench is
 * booked right now. The two are independent facts: a free bench can be booked.
 */
export function LabStatus({ labStatus, isBooked }: LabStatusProps) {
  const statusStr = typeof labStatus === 'string'
    ? labStatus
    : typeof labStatus === 'object' && labStatus !== null && 'value' in labStatus
      ? String((labStatus as { value?: unknown }).value ?? '')
      : '';

  const label = statusStr.trim().length > 0
    ? statusStr.charAt(0).toUpperCase() + statusStr.slice(1)
    : 'Unknown';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <StatusBadge tone={benchActivityTone(statusStr)} label={label} />
      {isBooked ? (
        <StatusBadge tone="reserved" fit icon={<CalendarOutlined />} label="Booked" title="Booked right now" />
      ) : null}
    </span>
  );
}
