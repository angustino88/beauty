import type { ReactNode } from 'react';
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

/**
 * KPI card. `accent`/`tint` are accepted for compatibility but ignored: KPI cards
 * use the brand accent so the colour palette stays reserved for status.
 */
export function MetricCard({ label, value, note, icon }: MetricCardProps) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricTop}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.metricIcon} aria-hidden="true">{icon}</span>
      </div>
      <div className={styles.metricValue} title={typeof value === 'string' ? value : undefined}>{value}</div>
      <div className={styles.metricNote}>{note}</div>
    </div>
  );
}

