import { memo } from 'react';
import { BENCH_ACTIVITY_META, benchActivityTone } from '@/shared/status/statusTone';
import type { DerivedDashboardStats, SummaryStatus } from '../types';
import styles from './DashboardSummary.module.css';

type StatDef = {
  label: string;
  key: keyof DerivedDashboardStats;
  summaryKey: NonNullable<SummaryStatus>;
};

const STATUSES: StatDef[] = [
  { label: 'Free',        key: 'freeCount',        summaryKey: 'free' },
  { label: 'Active',      key: 'activeCount',      summaryKey: 'active' },
  { label: 'Inactive',    key: 'inactiveCount',    summaryKey: 'inactive' },
  { label: 'Maintenance', key: 'maintainingCount', summaryKey: 'maintaining' },
  { label: 'Offline',     key: 'offlineCount',     summaryKey: 'offline' },
];

interface DashboardSummaryProps {
  stats: DerivedDashboardStats;
  activeSummary: SummaryStatus;
  onSummaryClick: (key: SummaryStatus) => void;
}

// memo keeps the overview from re-rendering when Dashboard re-renders for
// unrelated state (pagination, search input).
export const DashboardSummary = memo(function DashboardSummary({ stats, activeSummary, onSummaryClick }: DashboardSummaryProps) {
  const total = stats.totalCount;

  return (
    <section className={styles.rail} aria-label="Bench status overview">
      <div className={styles.lead}>
        <span className={styles.leadNumber}>{stats.freeCount}</span>
        <span className={styles.leadText}>
          free of <strong>{total}</strong> {total === 1 ? 'bench' : 'benches'}
        </span>
      </div>

      <div className={styles.detail}>
        <div className={styles.bar} aria-hidden="true">
          {STATUSES.map((stat) =>
            stats[stat.key] > 0 ? (
              <span
                key={stat.key}
                className={`${styles.segment} ${styles[benchActivityTone(stat.summaryKey)]}`}
                style={{ flexGrow: stats[stat.key] }}
                title={`${stat.label}: ${stats[stat.key]}`}
              />
            ) : null,
          )}
        </div>

        <div className={styles.chips} role="group" aria-label="Filter benches by status">
          {STATUSES.map((stat) => {
            const isActive = activeSummary === stat.summaryKey;
            return (
              <button
                key={stat.key}
                type="button"
                className={`${styles.chip} ${styles[benchActivityTone(stat.summaryKey)]} ${isActive ? styles.chipActive : ''}`}
                aria-pressed={isActive}
                title={`${BENCH_ACTIVITY_META[stat.summaryKey].meaning} ${isActive ? 'Click to show all benches again.' : `Click to show only ${stat.summaryKey === 'maintaining' ? 'benches under maintenance' : `${stat.label.toLowerCase()} benches`}.`}`}
                onClick={() => onSummaryClick(isActive ? null : stat.summaryKey)}
              >
                <span className={styles.dot} aria-hidden="true" />
                {stat.label}
                <span className={styles.chipCount}>{stats[stat.key]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});
