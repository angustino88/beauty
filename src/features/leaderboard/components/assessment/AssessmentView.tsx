import { useState } from 'react';
import { Button, Drawer, Progress, Tooltip } from 'antd';
import { AuditOutlined, CheckCircleFilled, ExclamationCircleFilled, LockOutlined, WarningFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import { StatusBadge } from '@/shared/components/StatusBadge';
import type { StatusTone } from '@/shared/status/statusTone';
import type { AssessmentKpiResult, LeaderboardAssessment } from '../../types';
import styles from './Assessment.module.css';

const RATING_TONE: Record<string, StatusTone> = {
  exceeds: 'success', meets: 'info', partially_meets: 'warning', below: 'danger', insufficient_data: 'neutral',
};
const STATUS_TONE: Record<string, StatusTone> = { met: 'success', near: 'warning', below: 'danger', not_applicable: 'neutral' };

const pct = (value: number | null) => (value == null ? '—' : `${Math.round(value * 100)}%`);

function period(range: { starts_at: string; ends_at: string }) {
  const start = dayjs(range.starts_at);
  const end = dayjs(range.ends_at);
  return start.isSame(end, 'year')
    ? `${start.format('D MMM')} – ${end.format('D MMM YYYY')}`
    : `${start.format('D MMM YYYY')} – ${end.format('D MMM YYYY')}`;
}

/** Change against the previous period, coloured by whether it is an improvement for this KPI. */
function KpiTrend({ kpi }: { kpi: AssessmentKpiResult }) {
  if (kpi.value == null || kpi.previous_value == null) return <span className={styles.muted}>—</span>;
  const delta = Math.round((kpi.value - kpi.previous_value) * 100);
  if (delta === 0) return <span className={styles.flat}>±0 pts</span>;
  const better = kpi.is_higher_better ? delta > 0 : delta < 0;
  return <span className={better ? styles.up : styles.down}>{delta > 0 ? '▲' : '▼'} {Math.abs(delta)} pts</span>;
}

const DIAL_COLOR: Record<string, string> = {
  exceeds: 'var(--lm-success-solid)',
  meets: 'var(--lm-info-solid)',
  partially_meets: 'var(--lm-warning-solid)',
  below: 'var(--lm-danger-solid)',
};

export function AssessmentReport({ assessment }: { assessment: LeaderboardAssessment }) {
  const rated = assessment.rating.value !== 'insufficient_data';
  return (
    <div className={styles.body}>
      <div className={styles.hero}>
        <Progress
          type="dashboard"
          size={104}
          percent={assessment.score ?? 0}
          strokeColor={DIAL_COLOR[assessment.rating.value] ?? 'var(--lm-border)'}
          format={() => (
            <span className={styles.dialValue}>
              {assessment.score ?? '—'}
              <small>{assessment.score != null ? 'of 100' : 'no score'}</small>
            </span>
          )}
        />
        <div className={styles.heroText}>
          <div className={styles.heroRating}>
            <StatusBadge tone={RATING_TONE[assessment.rating.value] ?? 'neutral'} label={assessment.rating.label} fit />
          </div>
          <p className={styles.summary}>{assessment.summary}</p>
          <div className={styles.evidence}>
            <span><strong>{assessment.total_sessions}</strong> sessions</span>
            <span><strong>{assessment.total_bookings}</strong> bookings</span>
            {rated && <span><strong>{assessment.strengths.length}</strong> strengths</span>}
            {rated && <span><strong>{assessment.development_areas.length}</strong> development areas</span>}
          </div>
        </div>
      </div>

      {rated && (
        <>
          <section>
            <h5 className={styles.sectionTitle}>KPI scorecard</h5>
            <table className={styles.scorecard}>
              <thead>
                <tr>
                  <th scope="col">KPI</th>
                  <th scope="col" className={styles.num}>Result</th>
                  <th scope="col" className={styles.num}>Target</th>
                  <th scope="col" className={styles.num}>vs previous</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {assessment.kpis.map((kpi) => (
                  <tr key={kpi.kpi.value}>
                    <td>{kpi.kpi.label}</td>
                    <td className={styles.num}>{pct(kpi.value)}</td>
                    <td className={`${styles.num} ${styles.muted}`}>{kpi.is_higher_better ? '≥' : '≤'} {pct(kpi.target)}</td>
                    <td className={styles.num}><KpiTrend kpi={kpi} /></td>
                    <td><StatusBadge tone={STATUS_TONE[kpi.status.value] ?? 'neutral'} label={kpi.status.label} fit /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className={styles.findings}>
            <section>
              <h5 className={styles.sectionTitle}>Strengths</h5>
              {assessment.strengths.length ? (
                <ul className={styles.list}>
                  {assessment.strengths.map((item) => (
                    <li key={item.kpi.value} className={styles.item}>
                      <CheckCircleFilled className={`${styles.itemIcon} ${styles.good}`} aria-hidden="true" />
                      <span><span className={styles.itemKpi}>{item.kpi.label}</span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              ) : <span className={styles.empty}>No KPI is on target yet.</span>}
            </section>
            <section>
              <h5 className={styles.sectionTitle}>Development areas</h5>
              {assessment.development_areas.length ? (
                <ul className={styles.list}>
                  {assessment.development_areas.map((item) => {
                    const below = item.severity.value === 'below';
                    const Icon = below ? WarningFilled : ExclamationCircleFilled;
                    return (
                      <li key={item.kpi.value} className={styles.item}>
                        <Icon className={`${styles.itemIcon} ${below ? styles.below : styles.near}`} aria-label={item.severity.label} />
                        <span>
                          <span className={styles.itemKpi}>{item.kpi.label} · {item.severity.label.toLowerCase()}</span>
                          {item.text}
                          <span className={styles.recommendation}><strong>Recommendation:</strong> {item.recommendation}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : <span className={styles.empty}>Every KPI is on target.</span>}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

const VISIBILITY = {
  self: 'Visible to you, lab coordinators and admins',
  user: 'Visible to this user, lab coordinators and admins',
  bench: 'Lab coordinators and admins only',
} as const;

interface AssessmentActionProps {
  assessment?: LeaderboardAssessment;
  loading: boolean;
  error: boolean;
  /** Whose assessment it is, for the title and the visibility note: the viewer's own, another user's, or a bench's. */
  audience?: 'self' | 'user' | 'bench';
  /** Name of the user or bench, shown in the report header. */
  subjectName?: string;
}

/** Header action on the profile that opens the KPI assessment report in a side drawer. */
export function AssessmentAction({ assessment, loading, error, audience = 'bench', subjectName }: AssessmentActionProps) {
  const [open, setOpen] = useState(false);
  const label = audience === 'self' ? 'My KPI assessment' : 'KPI assessment';
  const button = (
    <Button
      icon={<AuditOutlined />}
      loading={loading && !assessment}
      disabled={!assessment}
      onClick={() => setOpen(true)}
    >
      {label}
    </Button>
  );

  return (
    <>
      {error && !assessment ? <Tooltip title="The assessment could not be loaded.">{button}</Tooltip> : button}
      <Drawer
        open={open && Boolean(assessment)}
        onClose={() => setOpen(false)}
        placement="right"
        width="min(760px, 100vw)"
        destroyOnHidden
        title={(
          <div className={styles.drawerHeader}>
            <small>{audience === 'self' ? 'Your KPI assessment' : 'KPI assessment'}</small>
            <strong>{subjectName || (audience === 'bench' ? 'Bench' : 'User')}</strong>
          </div>
        )}
        extra={assessment && <span className={styles.periodChip}>{period(assessment.period)}</span>}
        footer={(
          <span className={styles.restricted}><LockOutlined aria-hidden="true" /> {VISIBILITY[audience]}</span>
        )}
      >
        {assessment && <AssessmentReport assessment={assessment} />}
      </Drawer>
    </>
  );
}
