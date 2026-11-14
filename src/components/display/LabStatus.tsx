import { Badge, Tag } from 'antd';

type LabStatusProps = {
  labStatus?: string | { value?: string; label?: string } | null;
  isBooked?: boolean;
};

type Ink = { ink: string; stamp: string; text: string };

const STATUS_INK: Record<string, Ink> = {
  unknown:     { ink: '#6b625f', stamp: '#433d3b', text: 'rgba(255,255,255,0.96)' },
  active:      { ink: '#a13a30', stamp: '#6b2620', text: 'rgba(255,255,255,0.96)' },
  inactive:    { ink: '#b8822e', stamp: '#85621d', text: 'rgba(255,255,255,0.96)' },
  free:        { ink: '#3e8761', stamp: '#2a5f45', text: 'rgba(255,255,255,0.96)' },
  maintaining: { ink: '#1d8a98', stamp: '#0e5b65', text: 'rgba(255,255,255,0.96)' },
  online:      { ink: '#3e8761', stamp: '#2a5f45', text: 'rgba(255,255,255,0.96)' },
  offline:     { ink: '#6b625f', stamp: '#433d3b', text: 'rgba(255,255,255,0.96)' },
  maintenance: { ink: '#1d8a98', stamp: '#0e5b65', text: 'rgba(255,255,255,0.96)' },
};

function getInk(status?: string): Ink {
  if (!status) return STATUS_INK.unknown;
  return STATUS_INK[status.toLowerCase()] ?? STATUS_INK.unknown;
}

export function LabStatus({ labStatus, isBooked }: LabStatusProps) {
  const statusStr = typeof labStatus === 'string'
    ? labStatus
    : typeof labStatus === 'object' && labStatus !== null && 'value' in labStatus
      ? String((labStatus as { value?: unknown }).value ?? '')
      : '';

  const { ink, stamp, text } = getInk(statusStr);
  const label = statusStr.trim().length > 0
    ? statusStr.charAt(0).toUpperCase() + statusStr.slice(1)
    : '–';

  return (
    <Badge
      style={{ width: '100%' }}
      color={isBooked ? '#a13a30' : '#3e8761'}
      text={
        <Tag
          style={{
            width: '78%',
            textAlign: 'center',
            color: text,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            border: '1px solid rgba(255,255,255,0.20)',
            borderRadius: 999,
            padding: '2px 10px',
            background: `linear-gradient(180deg, ${ink} 0%, ${stamp} 115%)`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 10px 18px rgba(31,24,18,0.14)',
            textShadow: '0 1px 0 rgba(0,0,0,0.25)',
          }}
        >
          {label}
        </Tag>
      }
    />
  );
}
