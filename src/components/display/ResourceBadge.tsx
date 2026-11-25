import type { ComponentProps } from 'react';
import styles from './ResourceBadge.module.css';

export type ResourceBadgeKind = 'category' | 'booking' | 'sample' | 'license';

interface ResourceBadgeProps extends ComponentProps<'span'> {
  kind: ResourceBadgeKind;
}

export function ResourceBadge({ kind, className, ...props }: ResourceBadgeProps) {
  return <span {...props} className={[styles.badge, styles[kind], className].filter(Boolean).join(' ')} />;
}
