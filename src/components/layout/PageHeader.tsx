import { Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** One line under the title: what the page is for. */
  description?: ReactNode;
  controls?: ReactNode;
  style?: { title?: CSSProperties; controls?: CSSProperties };
  sticky?: boolean;
}

export function PageHeader({ title, description, controls, style, sticky }: PageHeaderProps) {
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
      <div style={{ flex: '0 1 auto', minWidth: 0 }}>
        <Typography.Title
          level={4}
          style={{ margin: 0, fontWeight: 600, fontSize: 20, letterSpacing: '-0.015em', ...style?.title }}
        >
          {title}
        </Typography.Title>
        {description && (
          <div style={{ marginTop: 2, color: 'var(--lm-text-tertiary)', fontSize: 13 }}>{description}</div>
        )}
      </div>
      {controls && (
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', ...style?.controls }}>
          {controls}
        </div>
      )}
    </div>
  );
}
