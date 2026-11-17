import { ClockCircleOutlined, DesktopOutlined, ExclamationCircleOutlined, FileTextOutlined, TagOutlined, ToolOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import dayjs from 'dayjs';
import { useGetBookingBenchChoicesQuery } from '../../api';
import { formatBenchLabel } from '../../utils/benchChoiceOption';

export interface DowntimeEventInfo {
  condition?: string;
  conditionValue?: 'in_maintenance' | 'out_of_service';
  reason?: string;
  notes?: string;
  openEnded?: boolean;
  state?: string;
  resourceType?: string;
  resourceId?: number;
  start?: Date | null;
  end?: Date | null;
}

const lineStyle = { color: 'var(--lm-text-secondary)', fontSize: '12px' } as const;

function formatWindow(start?: Date | null, end?: Date | null, openEnded?: boolean): string {
  if (!start) return '—';
  const from = dayjs(start);
  if (openEnded || !end) return `${from.format('dddd, MMM D, YYYY h:mm A')} - until resolved`;
  const to = dayjs(end);
  return from.isSame(to, 'day')
    ? `${from.format('dddd, MMM D, YYYY h:mm A')} - ${to.format('h:mm A')}`
    : `${from.format('dddd, MMM D, YYYY h:mm A')} - ${to.format('dddd, MMM D, YYYY h:mm A')}`;
}

/** Hover card for a downtime window on the booking calendar; laid out like the booking detail card. */
export function DowntimeEventDetail({ info }: { info: DowntimeEventInfo }) {
  const outOfService = info.conditionValue === 'out_of_service';
  const { data: benchChoices } = useGetBookingBenchChoicesQuery(undefined, { skip: info.resourceType !== 'bench' });
  const bench = info.resourceType === 'bench' ? benchChoices?.find((choice) => choice.id === info.resourceId) : undefined;
  const resourceLabel = bench
    ? formatBenchLabel(bench.sku, bench.name, (bench.computers ?? []).map((computer) => computer.name || computer.sku))
    : info.resourceType
      ? `Whole ${info.resourceType}`
      : undefined;

  return (
    <div style={{ width: 300 }}>
      <div
        className={outOfService ? 'lm-tone-downtime-oos' : 'lm-tone-downtime-maint'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 10px 6px 10px',
          borderBottom: '1px solid var(--lm-border)',
          borderRadius: '8px 8px 0 0',
          backgroundColor: 'var(--lm-downtime-bg)',
          borderLeft: '4px solid var(--lm-downtime-solid)',
        }}
      >
        <Typography.Text strong style={{ fontSize: '14px', color: 'var(--lm-text)', margin: 0 }}>
          <span style={{ color: 'var(--lm-downtime-fg)', marginRight: 6 }}>
            {outOfService ? <ExclamationCircleOutlined /> : <ToolOutlined />}
          </span>
          {info.condition || 'Unavailable'}
        </Typography.Text>
        <span style={{ color: 'var(--lm-downtime-fg)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {info.state === 'current' ? 'Active now' : 'Scheduled'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px 10px' }}>
        <Typography.Text style={lineStyle}><TagOutlined /> {info.reason || 'Maintenance'}</Typography.Text>
        <Typography.Text style={lineStyle}><ClockCircleOutlined /> {formatWindow(info.start, info.end, info.openEnded)}</Typography.Text>
        {resourceLabel && <Typography.Text style={lineStyle}><DesktopOutlined /> {resourceLabel}</Typography.Text>}
        {info.notes && (
          <Typography.Text style={{ ...lineStyle, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            <FileTextOutlined /> {info.notes}
          </Typography.Text>
        )}
      </div>
    </div>
  );
}
