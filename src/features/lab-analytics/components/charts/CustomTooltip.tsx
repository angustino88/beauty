interface RTooltipItem {
  name?: string;
  value?: unknown;
  color?: string;
  payload?: Record<string, unknown>;
}

interface RTooltipProps {
  active?: boolean;
  payload?: RTooltipItem[];
  label?: unknown;
}

export function CustomTooltip({ active, payload, label }: RTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload as Record<string, unknown> | undefined;

  let title = '';
  if (item?.remote_user_displayname) title = `${String(item.remote_user_displayname)}${label ? ` [${String(label)}]` : ''}`;
  else if (item?.display_name) title = String(item.display_name);
  else if (item?.lab_name && item?.computer_name) title = `${String(item.lab_name)} (${String(item.computer_name)})`;
  else if (typeof label === 'string') title = label;

  return (
    <div
      style={{
        background: 'rgba(17, 24, 39, 0.9)',
        color: '#F9FAFB',
        padding: '10px 12px',
        borderRadius: 10,
        boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
        maxWidth: 260,
        pointerEvents: 'none',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {title && <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>{title}</div>}
      <div style={{ display: 'grid', gap: 4 }}>
        {payload.map((p, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: p.color || '#999',
              }}
            />
            <span style={{ opacity: 0.9 }}>{p.name}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{formatNumber(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatNumber(val: unknown): string {
  if (typeof val === 'number') return Number.isInteger(val) ? val.toString() : val.toFixed(2);
  return String(val ?? '-');
}

export default CustomTooltip;

