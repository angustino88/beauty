import { Tooltip } from 'antd';
import { StatusBadge } from '@/shared/components/StatusBadge';
import type { StatusTone } from '@/shared/status/statusTone';
import type { AssessmentKpiResult } from '../../types';
import { attainment, pct } from '../../utils/assessmentChart';
import styles from './Assessment.module.css';

const STATUS_TONE: Record<string, StatusTone> = { met: 'success', near: 'warning', below: 'danger', not_applicable: 'neutral' };

function ChangeChip({ kpi }: { kpi: AssessmentKpiResult }) {
  if (kpi.value == null || kpi.previous_value == null) {
    return <span className={`${styles.change} ${styles.changeNone}`}>No prior data</span>;
  }
  const delta = Math.round((kpi.value - kpi.previous_value) * 100);
  if (delta === 0) return <span className={`${styles.change} ${styles.changeFlat}`}>No change</span>;
  const improved = kpi.is_higher_better ? delta > 0 : delta < 0;
  return (
    <Tooltip title={`Previous period ${pct(kpi.previous_value)}`}>
      <span className={`${styles.change} ${improved ? styles.changeUp : styles.changeDown}`}>
        {delta > 0 ? '+' : '−'}{Math.abs(delta)} pts
      </span>
    </Tooltip>
  );
}

/**
 * KPI scorecard: one row per KPI with its target, a progress bar towards the target (a full bar means the
 * target is reached), the result, the change against the previous period and the status.
 */
export function KpiBulletList({ kpis }: { kpis: AssessmentKpiResult[] }) {
  return (
    <div className={styles.scorecard} role="table" aria-label="KPI scorecard">
      <div className={styles.scoreHead} role="row">
        <span role="columnheader">KPI</span>
        <span role="columnheader">Progress to target</span>
        <span role="columnheader" className={styles.alignEnd}>Result</span>
        <span role="columnheader" className={styles.alignEnd}>Change</span>
        <span role="columnheader">Status</span>
      </div>
      {kpis.map((kpi) => {
        const progress = attainment(kpi.value, kpi.target, kpi.is_higher_better);
        const progressPct = progress == null ? null : Math.round(progress * 100);
        return (
          <div key={kpi.kpi.value} className={styles.scoreRow} role="row">
            <span className={styles.kpiCell} role="cell">
              <span className={styles.kpiName}>{kpi.kpi.label}</span>
              <span className={styles.kpiTarget}>Target {kpi.is_higher_better ? '≥' : '≤'} {pct(kpi.target)}</span>
            </span>
            <span className={styles.progressCell} role="cell">
              <Tooltip title={progressPct == null ? 'Not applicable this period' : `${progressPct}% of the way to target`}>
                <span className={styles.progressTrack} aria-label={progressPct == null ? 'Not applicable' : `${progressPct}% of target`}>
                  {progressPct != null && (
                    <span
                      className={`${styles.progressFill} ${progressPct >= 100 ? styles.progressDone : ''}`}
                      style={{ width: `${Math.max(3, progressPct)}%` }}
                    />
                  )}
                </span>
              </Tooltip>
              <span className={styles.progressValue}>{progressPct == null ? '—' : `${progressPct}%`}</span>
            </span>
            <span className={`${styles.resultCell} ${styles.alignEnd}`} role="cell">{pct(kpi.value)}</span>
            <span className={styles.alignEnd} role="cell"><ChangeChip kpi={kpi} /></span>
            <span role="cell"><StatusBadge tone={STATUS_TONE[kpi.status.value] ?? 'neutral'} label={kpi.status.label} fit /></span>
          </div>
        );
      })}
    </div>
  );
}
