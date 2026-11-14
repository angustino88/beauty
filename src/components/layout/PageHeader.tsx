import { Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  controls?: ReactNode;
  style?: { title?: CSSProperties; controls?: CSSProperties };
  sticky?: boolean;
}

export function PageHeader({ title, controls, style, sticky }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '2px 0 10px',
        ...(sticky
          ? { position: 'sticky', top: 0, zIndex: 10, background: 'inherit' }
          : {}),
      }}
    >
      <Typography.Title
        level={4}
        style={{ flex: '0 0 auto', margin: 0, fontWeight: 600, fontSize: 20, letterSpacing: '-0.015em', ...style?.title }}
      >
        {title}
      </Typography.Title>
      {controls && (
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', ...style?.controls }}>
          {controls}
        </div>
      )}
    </div>
  );
}
