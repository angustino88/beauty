import { Card, Grid, Typography, Spin } from 'antd';
import type { CSSProperties } from 'react';

export interface SummaryCardProps {
  label?: string;
  title?: string;
  value: number | string;
  backgroundColor?: string;
  color?: string;
  loading?: boolean;
  onClick?: () => void;
}

export default function SummaryCard({
  label,
  title,
  value,
  backgroundColor = '#24292f',
  color = '#fff',
  loading = false,
  onClick,
}: SummaryCardProps) {
  const { xs, sm } = Grid.useBreakpoint();
  const fontSize = xs ? 14 : sm ? 16 : 18;
  const titleLevel = xs || sm ? 3 : 2;
  const displayLabel = label ?? title ?? '';

  return (
    <Card
      variant="borderless"
      style={{
        '--summary-color': color,
        '--summary-background': backgroundColor,
        backgroundColor,
        color,
        height: '100%',
        minHeight: xs || sm ? 76 : 92,
        display: 'flex',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
        padding: xs || sm ? '10px 12px' : '14px 16px',
      } as CSSProperties}
      onClick={onClick}
    >
      <Typography.Text style={{ fontSize, color, fontWeight: 600 }}>
        {displayLabel}
      </Typography.Text>
      {loading ? (
        <Spin size="small" style={{ marginTop: 4 }} />
      ) : (
        <Typography.Title level={titleLevel} style={{ color, margin: '2px 0 0', fontWeight: 700 }}>
          {String(value)}
        </Typography.Title>
      )}
    </Card>
  );
}
