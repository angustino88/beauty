import { Tooltip } from 'antd';
import { StatusBadge } from '@/shared/components/StatusBadge';
import type { StatusTone } from '@/shared/status/statusTone';
import type { AssessmentKpiResult } from '../../types';
import { pct } from '../../utils/assessmentChart';
import styles from './Assessment.module.css';

const STATUS_TONE: Record<string, StatusTone> = { met: 'success', near: 'warning', below: 'danger', not_applicable: 'neutral' };

const toPoints = (value: number | null) => (value == null ? null : Math.round(value * 100));

/**
 * KPI scorecard as bullet bars on the actual value (0–100 %): the result, a target tick and the previous
 * period as a hollow marker. For lower-is-better KPIs the target is a ceiling; colour and status say
 * whether the result is good, and the change arrow is coloured by whether it is an improvement.
 */
export function KpiBulletList({ kpis }: { kpis: AssessmentKpiResult[] }) {
  return (
    <ul className={styles.bullets}>
      {kpis.map((kpi) => {
        const row = {
          key: kpi.kpi.value,
          label: kpi.kpi.label,
          raw: kpi.value,
          rawPrevious: kpi.previous_value,
          rawTarget: kpi.target,
          isHigherBetter: kpi.is_higher_better,
          current: toPoints(kpi.value),
          previous: toPoints(kpi.previous_value),
          target: toPoints(kpi.target) ?? 0,
          status: kpi.status,
        };
        const delta = row.current != null && row.previous != null ? row.current - row.previous : null;
        const improved = delta != null && (row.isHigherBetter ? delta > 0 : delta < 0);
        return (
          <li key={row.key} className={styles.bulletRow}>
            <div className={styles.bulletHead}>
              <span className={styles.bulletName}>{row.label}</span>
              <span className={styles.bulletValue}>
                {pct(row.raw)}
                <span className={styles.bulletTarget}>target {row.isHigherBetter ? '≥' : '≤'} {pct(row.rawTarget)}</span>
              </span>
            </div>
            <div className={styles.bulletBody}>
              <Tooltip
                title={(
                  <span>
                    {row.label}: {pct(row.raw)} (target {row.isHigherBetter ? '≥' : '≤'} {pct(row.rawTarget)})
                    {row.rawPrevious != null ? `, previous period ${pct(row.rawPrevious)}` : ''}
                  </span>
                )}
              >
                <div className={styles.track} role="img" aria-label={`${row.label}: ${pct(row.raw)}, target ${row.isHigherBetter ? 'at least' : 'at most'} ${pct(row.rawTarget)}`}>
                  {row.current != null && <div className={`${styles.fill} ${styles[`fill_${row.status.value}`] ?? ''}`} style={{ width: `${Math.max(2, row.current)}%` }} />}
                  <div className={styles.targetTick} style={{ left: `${row.target}%` }} />
                  {row.previous != null && <div className={styles.previousMark} style={{ left: `${row.previous}%` }} />}
                </div>
              </Tooltip>
              <span className={styles.bulletDelta}>
                {delta == null ? <span className={styles.muted}>—</span>
                  : delta === 0 ? <span className={styles.flat}>±0</span>
                    : (
                      <Tooltip title={improved ? 'Improved on the previous period' : 'Worse than the previous period'}>
                        <span className={improved ? styles.up : styles.down}>{delta > 0 ? '▲' : '▼'} {Math.abs(delta)}</span>
                      </Tooltip>
                    )}
              </span>
              <StatusBadge tone={STATUS_TONE[row.status.value] ?? 'neutral'} label={row.status.label} fit />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
