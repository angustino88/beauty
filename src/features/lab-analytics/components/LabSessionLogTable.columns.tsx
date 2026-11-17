import dayjs from 'dayjs';
import { Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { SpaceLocationRow } from '@/features/spaces/shared/components/SpaceLocation';
import type { LabSessionLogEntry } from '../types';

const DATETIME_FORMAT = 'DD MMM YYYY, HH:mm';

/** 95 → "1 h 35 min"; minutes stay readable at a glance, hours for long sessions. */
export function formatMinutes(minutes: number | null): string {
  if (minutes == null) return '—';
  const total = Math.round(minutes);
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

const ACCESS_TONE: Record<string, 'success' | 'neutral' | 'warning'> = {
  booked: 'success',
  ad_hoc: 'neutral',
  unverified_booking: 'warning',
};
const ACCESS_HINT: Record<string, string> = {
  booked: 'Logged in with a valid booking for this bench.',
  ad_hoc: 'Logged in without a booking.',
  unverified_booking: 'A booking code was entered but could not be verified.',
};

const muted = { color: 'var(--lm-text-tertiary)' } as const;

/** Sorting is done by the server; the column keys are its `ordering` fields. */
export const labSessionLogColumns: ColumnsType<LabSessionLogEntry> = [
  {
    title: 'Login',
    dataIndex: 'login_at',
    key: 'login_time',
    width: 170,
    fixed: 'left',
    sorter: true,
    defaultSortOrder: 'descend',
    render: (value: string | null) => (value ? dayjs(value).format(DATETIME_FORMAT) : '—'),
  },
  {
    title: 'Logout',
    dataIndex: 'logout_at',
    key: 'logout_time',
    width: 170,
    sorter: true,
    render: (value: string | null) => (value ? dayjs(value).format(DATETIME_FORMAT) : '—'),
  },
  {
    title: 'User',
    key: 'user',
    width: 200,
    render: (_: unknown, row) => {
      const name = row.user?.display_name || row.remote_user_display_name || row.remote_user || '—';
      const login = row.remote_user && row.remote_user !== name ? row.remote_user : null;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          {login ? <span style={{ ...muted, fontSize: 12 }}>{login}</span> : null}
          {!row.user && row.remote_user ? (
            <Tooltip title="No Lab Mango account matches this login name.">
              <span style={{ ...muted, fontSize: 11 }}>No matching account</span>
            </Tooltip>
          ) : null}
        </div>
      );
    },
  },
  {
    title: 'Access',
    key: 'access_type',
    width: 170,
    render: (_: unknown, row) => row.access_type
      ? (
        <StatusBadge
          tone={ACCESS_TONE[row.access_type.value] ?? 'neutral'}
          label={row.access_type.value === 'unverified_booking' ? 'Unverified booking' : row.access_type.label}
          title={ACCESS_HINT[row.access_type.value] ?? row.access_type.label}
        />
      )
      : <span style={muted}>—</span>,
  },
  {
    title: 'Booking code',
    dataIndex: 'booking_code',
    key: 'booking_code',
    width: 140,
    render: (value: string | null) => value || <span style={muted}>—</span>,
  },
  {
    title: 'Bench',
    key: 'bench',
    width: 170,
    render: (_: unknown, row) => row.bench
      ? <SpaceLocationRow kind="bench" label={row.bench.name} refId={row.bench.id} />
      : <span style={muted}>Not on a bench</span>,
  },
  {
    title: 'Computer',
    key: 'computer',
    width: 180,
    render: (_: unknown, row) => (
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
        <span>{row.computer?.name || '—'}</span>
        {row.host_name && row.host_name !== row.computer?.name ? <span style={{ ...muted, fontSize: 12 }}>{row.host_name}</span> : null}
      </div>
    ),
  },
  {
    title: 'Session',
    dataIndex: 'duration_minutes',
    key: 'duration',
    width: 120,
    align: 'right',
    render: (value: number | null) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMinutes(value)}</span>,
  },
  {
    title: 'Active',
    dataIndex: 'active_minutes',
    key: 'active_duration_seconds',
    width: 150,
    align: 'right',
    sorter: true,
    render: (value: number | null, row) => {
      const share = value != null && row.duration_minutes ? Math.round((value / row.duration_minutes) * 100) : null;
      return (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatMinutes(value)}
          {share != null ? <span style={{ ...muted, marginLeft: 6, fontSize: 12 }}>{share}%</span> : null}
        </span>
      );
    },
  },
];
