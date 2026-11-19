import dayjs from 'dayjs';
import { Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { SpaceLocationRow } from '@/features/spaces/shared/components/SpaceLocation';
import type { LabSessionLogEntry } from '../types';
import { checkAgainstSlot, formatMinutes, formatSlot } from '../utils/sessionBookingSlot';

const DATETIME_FORMAT = 'DD MMM YYYY, HH:mm';

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
const stack = { display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0 } as const;
const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as const;

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
        <div style={stack}>
          <span style={ellipsis}>{name}</span>
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
  {
    title: 'Booking code',
    key: 'booking_code',
    width: 170,
    // Space after the right-aligned Active figures so the two columns don't run together.
    onHeaderCell: () => ({ style: { paddingLeft: 28 } }),
    onCell: () => ({ style: { paddingLeft: 28 } }),
    render: (_: unknown, row) => {
      const code = row.booking?.booking_code || row.booking_code;
      if (!code) return <span style={muted}>—</span>;
      return (
        <div style={stack}>
          <Tooltip title={row.booking?.status ? `Booking status: ${row.booking.status.label}` : 'Not linked to a verified booking.'}>
            <span style={{ ...ellipsis, fontFamily: 'var(--lm-font-mono, ui-monospace, monospace)', fontSize: 12.5 }}>{code}</span>
          </Tooltip>
          {row.booking?.status ? <span style={{ ...muted, fontSize: 12 }}>{row.booking.status.label}</span> : null}
        </div>
      );
    },
  },
  {
    title: 'Project',
    key: 'booking_project',
    width: 180,
    render: (_: unknown, row) => {
      const project = row.booking?.project?.name;
      if (project) return <Tooltip title={project}><span style={{ ...ellipsis, display: 'block' }}>{project}</span></Tooltip>;
      return <span style={muted}>{row.booking ? 'No project' : '—'}</span>;
    },
  },
  {
    title: 'Booked slot',
    key: 'booking_slot',
    width: 200,
    render: (_: unknown, row) => {
      const slot = formatSlot(row);
      if (!slot) return <span style={muted}>—</span>;
      const check = checkAgainstSlot(row);
      return (
        <div style={stack}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{slot}</span>
          {check ? (
            <Tooltip title={check.detail}>
              <span style={{ fontSize: 12, color: check.ok ? 'var(--lm-success-fg)' : 'var(--lm-warning-fg)' }}>{check.label}</span>
            </Tooltip>
          ) : null}
        </div>
      );
    },
  },
];
