import type { CSSProperties, ReactNode } from 'react';
import styles from './FinanceWorkspace.module.css';

interface WorkspaceHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  actions?: ReactNode;
}

export function WorkspaceHero({ eyebrow, title, description, icon, actions }: WorkspaceHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.heroCopy}>
        <div className={styles.eyebrow}>{icon}<span>{eyebrow}</span></div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className={styles.heroActions}>{actions}</div>}
    </header>
  );
}

interface MetricCardProps {
  label: string;
  value: ReactNode;
  note: string;
  icon: ReactNode;
  accent?: string;
  tint?: string;
}

export function MetricCard({ label, value, note, icon, accent, tint }: MetricCardProps) {
  const accentStyle = {
    '--metric-accent': accent ?? '#348364',
    '--metric-tint': tint ?? '#ebf5ef',
  } as CSSProperties;

  return (
    <div className={styles.metric} style={accentStyle}>
      <div className={styles.metricTop}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.metricIcon} aria-hidden="true">{icon}</span>
      </div>
      <div className={styles.metricValue} title={typeof value === 'string' ? value : undefined}>{value}</div>
      <div className={styles.metricNote}>{note}</div>
    </div>
  );
}

